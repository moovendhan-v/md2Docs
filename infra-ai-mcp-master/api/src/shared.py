import os
import json
import time
import jwt
from typing import Optional
from pathlib import Path
from fastapi import Header, HTTPException, Depends

# ─── Config ───────────────────────────────────────────────────────────────────

BASE_CONTENT_DIR = Path(os.getenv("MCP_CONTENT_DIR", "/srv/mcp-context"))
CONFIG_DIR       = BASE_CONTENT_DIR / "config"
TENANTS_FILE     = CONFIG_DIR / "tenants.json"
TOKENS_FILE      = CONFIG_DIR / "tokens.json"
DISABLED_USERS_FILE = CONFIG_DIR / "disabled_users.json"

# Removed fallback admin key since we're using Cognito groups now

# ── Cognito config (same pool as the MCP server) ─────────────────────────────
COGNITO_REGION       = os.getenv("COGNITO_REGION", "ap-southeast-4")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
COGNITO_CLIENT_ID    = os.getenv("COGNITO_CLIENT_ID", "")
COGNITO_JWKS_URL     = (
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com"
    f"/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    if COGNITO_USER_POOL_ID else ""
)

VALID_FOLDERS = ("templates", "context", "prompts")

# ─── Data helpers ─────────────────────────────────────────────────────────────

def load_tenants() -> dict:
    if not TENANTS_FILE.exists():
        return {"tenants": {}}
    return json.loads(TENANTS_FILE.read_text())

def save_tenants(data: dict):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    TENANTS_FILE.write_text(json.dumps(data, indent=2))

def load_tokens() -> dict:
    if not TOKENS_FILE.exists():
        return {}
    return json.loads(TOKENS_FILE.read_text())

def save_tokens(data: dict):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    TOKENS_FILE.write_text(json.dumps(data, indent=2))

# ─── Disabled users ───────────────────────────────────────────────────────────

def load_disabled_users() -> set:
    if not DISABLED_USERS_FILE.exists():
        return set()
    try:
        return set(json.loads(DISABLED_USERS_FILE.read_text()))
    except Exception:
        return set()

def save_disabled_users(disabled: set):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    DISABLED_USERS_FILE.write_text(json.dumps(sorted(disabled), indent=2))

def is_user_disabled(sub: str) -> bool:
    return sub in load_disabled_users()

# ─── Tenant helpers ───────────────────────────────────────────────────────────

def resolve_tenant_id(name_or_uuid: str) -> str:
    tenants = load_tenants().get("tenants", {})
    if name_or_uuid in tenants:
        return tenants[name_or_uuid]
    return name_or_uuid

# ─── Cognito JWT validation ───────────────────────────────────────────────────

COGNITO_ISSUER = (
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
    if COGNITO_USER_POOL_ID else ""
)

_jwks_client = None

def _get_jwks_client():
    global _jwks_client
    if _jwks_client is None and COGNITO_JWKS_URL:
        from jwt import PyJWKClient
        _jwks_client = PyJWKClient(COGNITO_JWKS_URL, cache_keys=True)
    return _jwks_client

def validate_cognito_token(raw_token: str) -> dict:
    """
    Validate a Cognito RS256 JWT (ID token or access token).
    - Skips aud verification (Cognito tokens don't always set aud consistently)
    - Validates issuer and token_use explicitly
    Returns the decoded payload on success, raises HTTPException on failure.
    """
    client = _get_jwks_client()
    if client is None:
        raise HTTPException(status_code=503, detail="Cognito JWKS not configured")
    try:
        signing_key = client.get_signing_key_from_jwt(raw_token)
        payload = jwt.decode(
            raw_token,
            signing_key.key,
            algorithms=["RS256"],
            options={
                "verify_exp": True,
                "verify_aud": False,   # Cognito tokens use client_id, not aud
            },
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Cognito token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Cognito token: {e}")

    # Validate issuer
    if COGNITO_ISSUER and payload.get("iss") != COGNITO_ISSUER:
        raise HTTPException(status_code=401, detail="Invalid token issuer")

    # Accept only access or ID tokens
    token_use = payload.get("token_use", "")
    if token_use not in ("access", "id"):
        raise HTTPException(status_code=401, detail=f"Unexpected token_use: {token_use}")

    return payload

# ─── Auth dependencies ────────────────────────────────────────────────────────

def require_admin(
    authorization: Optional[str] = Header(None),
):
    """
    Accepts a valid Cognito Bearer JWT with the 'admin' group.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        payload = validate_cognito_token(token)
        
        groups = payload.get("cognito:groups", [])
        if "admin" not in groups:
            raise HTTPException(status_code=403, detail="Admin access required. User is not in the 'admin' group.")
        
        return payload

    raise HTTPException(status_code=401, detail="Valid Cognito token required")


def require_user_token(
    authorization: Optional[str] = Header(None),
    x_tenant_id: Optional[str] = Header(None)
) -> dict:
    """
    Accept a Cognito Bearer token for user-level operations.
    Extracts tenant_id from the token claims.
    If the user is an Admin, they can override the tenant_id via the 'x-tenant-id' header.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    token = authorization.split(" ", 1)[1]
    payload = validate_cognito_token(token)

    # Any valid Cognito token is treated as a user
    groups = payload.get("cognito:groups", [])
    
    # If user is admin and x-tenant-id header is provided, use it
    if "admin" in groups and x_tenant_id:
        tenant_id = x_tenant_id
    else:
        # Resolve tenant_id from token — same precedence as MCP server
        tenant_id = (
            payload.get("custom:tenant_id")
            or payload.get("cognito:username")
            or payload.get("username")
            or payload.get("sub")
        )
        
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Cannot resolve tenant from token")

    payload["tenant_id"] = tenant_id

    # Check local disabled_users.json
    sub = payload.get("sub", "")
    if sub and is_user_disabled(sub):
        raise HTTPException(status_code=403, detail="Account is disabled")

    return payload

# ─── Path helpers ─────────────────────────────────────────────────────────────

def tenant_path(tenant_id: str) -> Path:
    uuid_id = resolve_tenant_id(tenant_id)
    path = BASE_CONTENT_DIR / uuid_id
    # Auto-initialize folders on-the-fly if they don't exist
    for folder in VALID_FOLDERS:
        (path / folder).mkdir(parents=True, exist_ok=True)
    return path

def safe_file_path(tenant_id: str, folder: str, filename: str) -> Path:
    import urllib.parse
    folder = urllib.parse.unquote(folder)
    filename = urllib.parse.unquote(filename)
    root   = (tenant_path(tenant_id) / folder).resolve()
    target = (root / filename).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file path")
    return target

# ─── Legacy stubs (kept so imports don't break) ───────────────────────────────

def make_jwt(tenant_id: str, jti: str, expires_in_days: int = 365) -> str:
    """Legacy — no longer used. Cognito issues tokens now."""
    raise NotImplementedError("Token minting is delegated to Cognito")

def decode_jwt(raw_token: str) -> dict:
    """Legacy — delegates to Cognito validation."""
    return validate_cognito_token(raw_token)
