"""
utils.py — Shared helpers for InfraAI MCP Server
  - Cognito JWKS JWT validation
  - Opaque token dev mode (tokens.json)
  - Path safety + file I/O
  - Logging setup
"""

import os
import json
import logging
import logging.handlers
from pathlib import Path
from typing import Optional

import jwt
from jwt import PyJWKClient
from starlette.requests import Request
from starlette.exceptions import HTTPException
from fastmcp.server.dependencies import get_http_request

# ─── Config ───────────────────────────────────────────────────────────────────

BASE_CONTENT_DIR = Path(os.getenv("MCP_CONTENT_DIR", "/srv/mcp-context"))
CONFIG_DIR       = BASE_CONTENT_DIR / "config"
TOKENS_FILE      = CONFIG_DIR / "tokens.json"
DISABLED_USERS_FILE = CONFIG_DIR / "disabled_users.json"

# ─── Cognito Config ───────────────────────────────────────────────────────────

COGNITO_REGION       = os.getenv("COGNITO_REGION")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID    = os.getenv("COGNITO_CLIENT_ID")
COGNITO_DOMAIN       = os.getenv(
    "COGNITO_DOMAIN"
).rstrip("/")

COGNITO_ISSUER   = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
COGNITO_JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"

# JWKS client with built-in key caching (refreshes automatically on unknown kid)
_jwks_client = PyJWKClient(COGNITO_JWKS_URL, cache_keys=True)

# ─── Logging ──────────────────────────────────────────────────────────────────

LOG_DIR = BASE_CONTENT_DIR / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.handlers.RotatingFileHandler(
            LOG_DIR / "mcp.log", maxBytes=10 * 1024 * 1024, backupCount=3
        ),
    ],
)
log = logging.getLogger("infraai-mcp")


# ─── Auth Registry (opaque token dev mode) ────────────────────────────────────

def load_tokens() -> dict:
    """Load the JSON token allowlist (opaque_token -> metadata) for dev/testing."""
    if not TOKENS_FILE.exists():
        return {}
    try:
        return json.loads(TOKENS_FILE.read_text())
    except Exception as e:
        log.error("[AUTH] Failed to load tokens.json: %s", e)
        return {}


def _load_disabled_users() -> set:
    if not DISABLED_USERS_FILE.exists():
        return set()
    try:
        return set(json.loads(DISABLED_USERS_FILE.read_text()))
    except Exception:
        return set()


# ─── JWT helpers ──────────────────────────────────────────────────────────────

def resolve_tenant(raw_token: str) -> str:
    """
    Resolve tenant_id from a bearer token.

    Priority:
      1. Opaque token in tokens.json  (dev / service-account mode)
      2. Cognito JWT validated via JWKS  (production)

    Raises HTTPException(401) on any failure.
    """
    preview = raw_token[:20] + "..." if len(raw_token) > 20 else raw_token
    log.debug("[AUTH] resolve_tenant | preview=%s", preview)

    # ── 1. Opaque token (dev/testing) ─────────────────────────────────────────
    tokens = load_tokens()
    opaque_entry = tokens.get(raw_token)
    if isinstance(opaque_entry, dict) and opaque_entry.get("tenant_id"):
        tenant_id = opaque_entry["tenant_id"]
        log.info("[AUTH] ACCEPTED | tenant_id=%s | provider=local-opaque", tenant_id)
        return tenant_id

    # ── 2. Cognito JWT (RS256 via JWKS) ───────────────────────────────────────
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(raw_token)
    except Exception as e:
        log.warning("[AUTH] REJECTED | JWKS key lookup failed | reason=%s | preview=%s", e, preview)
        raise HTTPException(status_code=401, detail="Invalid token: cannot resolve signing key")

    try:
        payload = jwt.decode(
            raw_token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},   # Cognito access tokens use client_id, not aud
        )
    except jwt.ExpiredSignatureError:
        log.warning("[AUTH] REJECTED | JWT expired | preview=%s", preview)
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError as e:
        log.warning("[AUTH] REJECTED | JWT invalid | reason=%s | preview=%s", e, preview)
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    # Validate issuer
    if payload.get("iss") != COGNITO_ISSUER:
        log.warning("[AUTH] REJECTED | wrong issuer | iss=%s | preview=%s", payload.get("iss"), preview)
        raise HTTPException(status_code=401, detail="Invalid token issuer")

    # Cognito access tokens carry token_use=access; ID tokens carry token_use=id
    token_use = payload.get("token_use", "")
    if token_use not in ("access", "id"):
        log.warning("[AUTH] REJECTED | unexpected token_use=%s | preview=%s", token_use, preview)
        raise HTTPException(status_code=401, detail=f"Unexpected token_use: {token_use}")

    # ── Extract tenant_id ─────────────────────────────────────────────────────
    # Priority: custom:tenant_id > username (Cognito access token) > sub (fallback)
    tenant_id = (
        payload.get("custom:tenant_id")
        or payload.get("username")
        or payload.get("cognito:username")
        or payload.get("sub")
    )
    if not tenant_id:
        log.warning("[AUTH] REJECTED | cannot extract tenant_id from payload | preview=%s", preview)
        raise HTTPException(status_code=401, detail="Cannot determine tenant from token")

    log.info("[AUTH] ACCEPTED | tenant_id=%s | token_use=%s | provider=cognito", tenant_id, token_use)

    # Check disabled_users.json (shared volume with API)
    sub = payload.get("sub", "")
    if sub and sub in _load_disabled_users():
        log.warning("[AUTH] REJECTED | user disabled | sub=%s", sub)
        raise HTTPException(status_code=403, detail="Account is disabled")

    return tenant_id


def extract_bearer_token(request: Request) -> Optional[str]:
    """Pull raw token from Authorization: Bearer <token> header."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[len("Bearer "):]
    log.warning("[AUTH] No Bearer token in Authorization header")
    return None


def get_tenant(caller: str = "unknown") -> Optional[str]:
    """
    Core auth helper used by tools, resources, and prompts.
    Extracts + validates Cognito JWT from the active HTTP request.
    Falls back to DEV_TENANT_ID in stdio/dev mode.
    """
    log.debug("[AUTH] get_tenant start | caller=%s", caller)
    try:
        request: Request = get_http_request()
        log.debug("[AUTH] found active request | headers=%s", dict(request.headers))
        token = extract_bearer_token(request)
        if not token:
            log.warning("[AUTH] UNAUTHORIZED | caller=%s | no Bearer token", caller)
            raise HTTPException(status_code=401, detail="Unauthorized: Bearer token required")

        tenant_id = resolve_tenant(token)
        log.info("[AUTH] OK | caller=%s | tenant=%s", caller, tenant_id)
        return tenant_id
    except RuntimeError as e:
        log.warning("[AUTH] No active HTTP request | caller=%s | %s", caller, e)

    dev = os.getenv("DEV_TENANT_ID")
    if dev:
        log.info("[AUTH] Fallback to DEV_TENANT_ID | caller=%s | tenant=%s", caller, dev)
        return dev

    log.warning("[AUTH] No tenant resolved and no DEV_TENANT_ID | caller=%s", caller)
    raise HTTPException(status_code=401, detail="Unauthorized: valid Cognito Bearer JWT required")


# ─── Filesystem helpers ───────────────────────────────────────────────────────

def safe_tenant_path(tenant_id: str, subfolder: str, filename: str) -> Optional[Path]:
    """
    Build and validate a path inside the tenant's namespace.
    Auto-initializes tenant subfolders on-the-fly.
    Returns None if the resolved path escapes the tenant directory (path traversal).
    """
    import urllib.parse
    subfolder = urllib.parse.unquote(subfolder)
    filename = urllib.parse.unquote(filename)
    tenant_root = (BASE_CONTENT_DIR / tenant_id).resolve()
    # Auto-initialize folders on-the-fly
    for folder in ("templates", "context", "prompts"):
        (tenant_root / folder).mkdir(parents=True, exist_ok=True)
        
    target      = (tenant_root / subfolder / filename).resolve()
    try:
        target.relative_to(tenant_root)
        return target
    except ValueError:
        log.error(
            "[PATH] TRAVERSAL ATTEMPT | tenant=%s | subfolder=%s | filename=%s | resolved=%s",
            tenant_id, subfolder, filename, target,
        )
        return None


def list_tenant_files(tenant_id: str, subfolder: str) -> list[str]:
    """List *.md filenames in a tenant subfolder."""
    import urllib.parse
    subfolder = urllib.parse.unquote(subfolder)
    folder = BASE_CONTENT_DIR / tenant_id / subfolder
    if not folder.exists():
        # Auto-initialize folders on-the-fly
        for f in ("templates", "context", "prompts"):
            (BASE_CONTENT_DIR / tenant_id / f).mkdir(parents=True, exist_ok=True)
    files = sorted(f.name for f in folder.glob("*.md") if f.is_file())
    log.debug("[FS] list_tenant_files | tenant=%s | subfolder=%s | count=%d", tenant_id, subfolder, len(files))
    return files


def read_tenant_file(tenant_id: str, subfolder: str, filename: str) -> Optional[str]:
    """Read and return markdown file content for a tenant."""
    import urllib.parse
    subfolder = urllib.parse.unquote(subfolder)
    filename = urllib.parse.unquote(filename)
    path = safe_tenant_path(tenant_id, subfolder, filename)
    if path is None:
        return None
    if not path.exists():
        log.warning("[FS] File not found | tenant=%s | path=%s", tenant_id, path)
        return None
    content = path.read_text(encoding="utf-8")
    log.debug("[FS] read OK | tenant=%s | %s/%s | bytes=%d", tenant_id, subfolder, filename, len(content))
    return content


# ─── Source-reference stripping ──────────────────────────────────────────────

import re

_SOURCE_RE = re.compile(
    r"""
    (?:
        [\(\[]source:\s*[^\)\]]+[\)\]]         # (source: ...) or [source: ...]
      | \bfrom\s+\S+\.\w+\b                    # from filename.anyextension
      | \baccording\s+to\s+\S+\.\w+\b          # according to filename.anyextension
      | \bsee\s+\S+\.\w+\b                     # see filename.anyextension
      | \bin\s+\S+\.\w+\b                      # in filename.anyextension
      | \brefer\s+to\s+\S+\.\w+\b              # refer to filename.anyextension
      | \b[\w\-/]+\.(?:md|pdf|docx|txt|xlsx|csv|json)\b  # any bare filename with known extension
    )
    """,
    re.IGNORECASE | re.VERBOSE,
)


def strip_source_references(text: str) -> str:
    """Remove internal source-file citation patterns from a string."""
    return _SOURCE_RE.sub("", text).strip()


# ─── File description helpers ─────────────────────────────────────────────────

def _extract_description(content: str, filename: str) -> str:
    """
    Derive a human-readable description from file content.
    Priority: first Markdown heading → first non-empty line → title-cased filename stem.
    """
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("#"):
            return stripped.lstrip("#").strip()
        if stripped:
            return stripped
    stem = Path(filename).stem.replace("-", " ").replace("_", " ")
    return stem.title()


# ─── Filename ↔ Topic name conversion ────────────────────────────────────────

def filename_to_topic(filename: str) -> str:
    """
    Convert a raw filename to a human-readable topic name.
    Strips the file extension, replaces underscores and hyphens with spaces,
    and title-cases the result.

    Examples:
        quote_assessment_guide.md  →  "Quote Assessment Guide"
        risk-framework-v2.md       →  "Risk Framework V2"
    """
    stem = Path(filename).stem
    topic = stem.replace("-", " ").replace("_", " ")
    return topic.title()


def topic_to_filename(topic: str, available_files: list[str]) -> Optional[str]:
    """
    Reverse-map a topic name back to the original filename.
    Comparison is case-insensitive. Returns None if no match is found.

    Examples:
        "Quote Assessment Guide", [...] → "quote_assessment_guide.md"
        "quote assessment guide", [...] → "quote_assessment_guide.md"  (case-insensitive)
    """
    topic_normalised = topic.strip().lower()
    for f in available_files:
        if filename_to_topic(f).lower() == topic_normalised:
            return f
    log.warning("[TOPIC] No filename match for topic=%r | available=%s", topic, available_files)
    return None


def describe_tenant_files(tenant_id: str, subfolder: str) -> list[dict]:
    """
    Return [{topic, description}] for every .md file in a tenant subfolder.

    `topic`       — human-readable label derived from the filename
                    (e.g. assessment_criteria.md → "Assessment Criteria").
                    Raw filenames are intentionally hidden from the AI.
    `description` — first non-empty line of file content.
    """
    files = list_tenant_files(tenant_id, subfolder)
    result = []
    for filename in files:
        content = read_tenant_file(tenant_id, subfolder, filename) or ""
        result.append({
            "topic":       filename_to_topic(filename),
            "description": _extract_description(content, filename),
        })
    return result
