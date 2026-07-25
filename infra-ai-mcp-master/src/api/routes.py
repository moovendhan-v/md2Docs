import logging
import secrets
import time
import urllib.parse
import httpx
import json as _json
import boto3
from functools import lru_cache
import os

from starlette.requests import Request
from starlette.responses import JSONResponse, PlainTextResponse, RedirectResponse

from utils.utils import COGNITO_ISSUER, BASE_CONTENT_DIR
from api.config import (
    MCP_PATH, OUR_CALLBACK_URL, AUTH_STATE_STORE,
    COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, COGNITO_DOMAIN,
    COGNITO_TOKEN_URL, AWS_REGION,
)
from api.helpers import normalize_mcp_path, external_base_url

log = logging.getLogger("infraai-mcp")


# ─── Cognito Boto3 Helpers ────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _cognito_client():
    try:
        client = boto3.client("cognito-idp", region_name=AWS_REGION)
        log.debug("[COGNITO] boto3 client created | region=%s", AWS_REGION)
        return client
    except Exception as e:
        log.error("[COGNITO] Failed to create boto3 client | region=%s | error=%s", AWS_REGION, e)
        raise

@lru_cache(maxsize=1)
def _get_app_client_secret() -> str | None:
    # Prefer env var first
    if os.environ.get("COGNITO_CLIENT_SECRET"):
        log.debug("[COGNITO] Using client secret from env")
        return COGNITO_CLIENT_SECRET

    # Fetch only once from Cognito
    try:
        response = _cognito_client().describe_user_pool_client(
            UserPoolId=COGNITO_USER_POOL_ID,
            ClientId=COGNITO_CLIENT_ID,
        )

        secret = response["UserPoolClient"].get("ClientSecret")
        log.debug("[COGNITO] Client secret fetched from Cognito API", secret)

        if secret:
            log.debug("[COGNITO] Client secret fetched and cached")
        else:
            log.debug("[COGNITO] Public client / no secret configured")

        return secret

    except Exception as e:
        log.warning(
            "[COGNITO] Failed to fetch client secret | pool=%s | client=%s | error=%s",
            COGNITO_USER_POOL_ID,
            COGNITO_CLIENT_ID,
            e,
        )
        return None


# ─── Well-Known Endpoints ─────────────────────────────────────────────────────

async def health_check(_: Request) -> PlainTextResponse:
    return PlainTextResponse("ok")


async def favicon(_: Request) -> PlainTextResponse:
    return PlainTextResponse("", status_code=204)


async def oauth_protected_resource(request: Request) -> JSONResponse:
    try:
        auth_server = external_base_url(request)
        resource_url = f"{auth_server}{normalize_mcp_path(MCP_PATH)}"
        log.debug("[OAUTH] Protected resource metadata | auth_server=%s | resource=%s", auth_server, resource_url)
        return JSONResponse({
            "resource": resource_url,
            "authorization_servers": [auth_server],
            "bearer_methods_supported": ["header"],
        })
    except Exception as e:
        log.error("[OAUTH] oauth_protected_resource failed | error=%s", e, exc_info=True)
        return JSONResponse({"error": "server_error"}, status_code=500)


async def oauth_protected_resource_path(request: Request) -> JSONResponse:
    return await oauth_protected_resource(request)


async def oauth_authorization_server(request: Request) -> JSONResponse:
    try:
        base = external_base_url(request)
        log.debug("[OAUTH] Authorization server metadata requested | base=%s", base)
        return JSONResponse({
            "issuer": base,
            "authorization_endpoint": f"{base}/authorize",
            "token_endpoint": f"{base}/token",
            "registration_endpoint": f"{base}/register",
            "response_types_supported": ["code"],
            "grant_types_supported": ["authorization_code", "refresh_token"],
            "code_challenge_methods_supported": ["S256"],
            "token_endpoint_auth_methods_supported": ["none"],
            "scopes_supported": ["openid", "email", "profile"],
            "jwks_uri": f"{COGNITO_ISSUER}/.well-known/jwks.json",
        })
    except Exception as e:
        log.error("[OAUTH] oauth_authorization_server failed | error=%s", e, exc_info=True)
        return JSONResponse({"error": "server_error"}, status_code=500)


# ─── OAuth Proxy Endpoints ────────────────────────────────────────────────────

async def authorize_get(request: Request) -> RedirectResponse:
    params = dict(request.query_params)
    client_ip = request.client.host if request.client else "unknown"

    log.info(
        "[OAUTH] /authorize hit | ip=%s | response_type=%s | client_id=%s | scope=%s | has_pkce=%s",
        client_ip,
        params.get("response_type"),
        params.get("client_id"),
        params.get("scope"),
        "code_challenge" in params,
    )

    if params.get("response_type") != "code":
        log.warning(
            "[OAUTH] Unsupported response_type | response_type=%s | ip=%s",
            params.get("response_type"), client_ip,
        )
        return JSONResponse({"error": "unsupported_response_type"}, status_code=400)

    original_redirect_uri = params.get("redirect_uri", "")
    original_state        = params.get("state", "")

    if not original_redirect_uri:
        log.warning("[OAUTH] Missing redirect_uri | ip=%s", client_ip)
        return JSONResponse({"error": "missing redirect_uri"}, status_code=400)

    if not original_state:
        log.warning("[OAUTH] Missing state parameter | ip=%s | redirect_uri=%s", client_ip, original_redirect_uri)
        # Don't hard-fail — state is recommended but not always required
        # return JSONResponse({"error": "missing_state"}, status_code=400)

    our_state = secrets.token_urlsafe(24)
    AUTH_STATE_STORE[our_state] = {
        "original_redirect_uri": original_redirect_uri,
        "original_state": original_state,
        "expires_at": int(time.time()) + 600,
    }
    log.debug(
        "[OAUTH] State stored | our_state=%s | original_redirect_uri=%s | store_size=%d",
        our_state, original_redirect_uri, len(AUTH_STATE_STORE),
    )

    callback_url = OUR_CALLBACK_URL or f"{external_base_url(request)}/callback"
    log.debug("[OAUTH] Using callback_url=%s", callback_url)

    cognito_params = {
        "response_type": "code",
        "client_id": COGNITO_CLIENT_ID,
        "redirect_uri": callback_url,
        "state": our_state,
        "scope": params.get("scope", "openid email"),
    }
    for key in ("code_challenge", "code_challenge_method"):
        if key in params:
            cognito_params[key] = params[key]

    target = f"{COGNITO_DOMAIN}/oauth2/authorize?{urllib.parse.urlencode(cognito_params)}"
    log.info(
        "[OAUTH] Redirecting to Cognito | our_state=%s | callback_url=%s | cognito_target=%s",
        our_state, callback_url, target,
    )
    return RedirectResponse(target, status_code=302)


async def callback_get(request: Request) -> RedirectResponse:
    code      = request.query_params.get("code", "")
    our_state = request.query_params.get("state", "")
    error     = request.query_params.get("error", "")
    client_ip = request.client.host if request.client else "unknown"

    log.info(
        "[OAUTH] /callback hit | ip=%s | has_code=%s | has_state=%s | has_error=%s | store_size=%d",
        client_ip, bool(code), bool(our_state), bool(error), len(AUTH_STATE_STORE),
    )

    if error:
        log.warning(
            "[OAUTH] Cognito returned error | error=%s | description=%s | ip=%s",
            error, request.query_params.get("error_description", ""), client_ip,
        )
        return JSONResponse({
            "error": error,
            "error_description": request.query_params.get("error_description", ""),
        }, status_code=400)

    if not our_state:
        log.warning("[OAUTH] Missing state on callback | ip=%s", client_ip)
        return JSONResponse({"error": "missing_state"}, status_code=400)

    if not code:
        log.warning("[OAUTH] Missing code on callback | state=%s | ip=%s", our_state, client_ip)
        return JSONResponse({"error": "missing_code"}, status_code=400)

    record = AUTH_STATE_STORE.pop(our_state, None)
    if not record:
        log.warning(
            "[OAUTH] Unknown state on callback | our_state=%s | ip=%s | store_keys=%s",
            our_state, client_ip, list(AUTH_STATE_STORE.keys()),
        )
        return JSONResponse({"error": "invalid_state"}, status_code=400)

    now = int(time.time())
    if now > record["expires_at"]:
        log.warning(
            "[OAUTH] State expired | our_state=%s | expired_at=%s | now=%s | age_seconds=%d",
            our_state, record["expires_at"], now, now - record["expires_at"],
        )
        return JSONResponse({"error": "state_expired"}, status_code=400)

    original_redirect_uri = record["original_redirect_uri"]
    original_state        = record["original_state"]
    sep = "&" if "?" in original_redirect_uri else "?"
    location = f"{original_redirect_uri}{sep}code={code}&state={original_state}"

    log.info(
        "[OAUTH] Callback success | our_state=%s | redirecting_to=%s",
        our_state, original_redirect_uri,
    )
    return RedirectResponse(location, status_code=302)


async def token_post(request: Request) -> JSONResponse:
    client_ip = request.client.host if request.client else "unknown"
    content_type = request.headers.get("content-type", "")

    log.info("[OAUTH] /token hit | ip=%s | content_type=%s", client_ip, content_type)

    try:
        if "application/json" in content_type:
            raw = await request.json()
            form_data = {k: str(v) for k, v in raw.items() if v is not None}
            log.debug("[OAUTH] Token request parsed as JSON | keys=%s", list(form_data.keys()))
        else:
            form = await request.form()
            form_data = {k: str(v) for k, v in form.items() if v is not None}
            log.debug("[OAUTH] Token request parsed as form | keys=%s", list(form_data.keys()))
    except Exception as e:
        log.error("[OAUTH] Failed to parse token request body | error=%s | ip=%s", e, client_ip, exc_info=True)
        return JSONResponse({"error": "invalid_request", "error_description": "Could not parse request body"}, status_code=400)

    grant_type = form_data.get("grant_type", "")
    if not grant_type:
        log.warning("[OAUTH] Missing grant_type | ip=%s", client_ip)
        return JSONResponse({"error": "invalid_request", "error_description": "grant_type is required"}, status_code=400)

    form_data["client_id"] = COGNITO_CLIENT_ID
    form_data.pop("client_secret", None)

    if grant_type == "authorization_code":
        callback_url = OUR_CALLBACK_URL or f"{external_base_url(request)}/callback"
        form_data["redirect_uri"] = callback_url
        log.info(
            "[OAUTH] Token exchange | grant_type=authorization_code | has_code=%s | has_pkce=%s | redirect_uri=%s",
            bool(form_data.get("code")),
            bool(form_data.get("code_verifier")),
            callback_url,
        )
    elif grant_type == "refresh_token":
        log.info("[OAUTH] Token refresh | has_refresh_token=%s", bool(form_data.get("refresh_token")))
    else:
        log.warning("[OAUTH] Unsupported grant_type=%s | ip=%s", grant_type, client_ip)

    proxy_headers: dict = {"Content-Type": "application/x-www-form-urlencoded"}

    client_secret = _get_app_client_secret()
    if client_secret:
        import base64 as _b64
        creds = _b64.b64encode(f"{COGNITO_CLIENT_ID}:{client_secret}".encode()).decode()
        proxy_headers["Authorization"] = f"Basic {creds}"
        log.debug("[OAUTH] Using Basic auth for Cognito token endpoint")
    else:
        log.debug("[OAUTH] No client secret — sending without Authorization header")

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            log.debug("[OAUTH] POSTing to Cognito token endpoint | url=%s", COGNITO_TOKEN_URL)
            resp = await client.post(COGNITO_TOKEN_URL, data=form_data, headers=proxy_headers)
    except httpx.TimeoutException:
        log.error("[OAUTH] Cognito token request timed out | url=%s", COGNITO_TOKEN_URL)
        return JSONResponse({"error": "server_error", "error_description": "Upstream token endpoint timed out"}, status_code=502)
    except httpx.RequestError as e:
        log.error("[OAUTH] Cognito token request failed | error=%s", e, exc_info=True)
        return JSONResponse({"error": "server_error", "error_description": "Could not reach token endpoint"}, status_code=502)

    try:
        body = resp.json()
    except Exception as e:
        log.error(
            "[OAUTH] Failed to parse Cognito token response as JSON | status=%d | body=%s | error=%s",
            resp.status_code, resp.text[:500], e,
        )
        return JSONResponse({"error": "server_error", "error_description": "Invalid response from token endpoint"}, status_code=502)

    log.info(
        "[OAUTH] Cognito token response | status=%d | keys=%s",
        resp.status_code, list(body.keys()),
    )
    if resp.status_code != 200:
        log.warning(
            "[OAUTH] Cognito token error | status=%d | error=%s | description=%s",
            resp.status_code,
            body.get("error"),
            body.get("error_description"),
        )

    return JSONResponse(body, status_code=resp.status_code)


async def register_client(request: Request) -> JSONResponse:
    client_ip = request.client.host if request.client else "unknown"

    try:
        payload = await request.json()
    except Exception as e:
        log.warning("[OAUTH] register_client: failed to parse JSON body | error=%s | ip=%s", e, client_ip)
        payload = {}

    redirect_uris = payload.get("redirect_uris", [])
    client_name   = payload.get("client_name", "claude")

    log.info(
        "[OAUTH] Client registration | name=%s | redirect_uris=%s | ip=%s",
        client_name, redirect_uris, client_ip,
    )

    client_secret = _get_app_client_secret()
    auth_method = "client_secret_post" if client_secret else "none"

    log.debug("[OAUTH] Registration | auth_method=%s | has_secret=%s", auth_method, bool(client_secret))

    response = {
        "client_id": COGNITO_CLIENT_ID,
        "client_id_issued_at": int(time.time()),
        "redirect_uris": redirect_uris,
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "token_endpoint_auth_method": auth_method,
        "client_name": client_name,
    }
    if client_secret:
        response["client_secret"] = client_secret
        response["client_secret_expires_at"] = 0

    return JSONResponse(response, status_code=201)


async def provision_post(request: Request) -> JSONResponse:
    client_ip = request.client.host if request.client else "unknown"

    try:
        body = await request.json()
    except Exception as e:
        log.warning("[PROVISION] Failed to parse JSON body | error=%s | ip=%s", e, client_ip)
        return JSONResponse({"error": "invalid_json"}, status_code=400)

    sub      = body.get("sub", "").strip()
    email    = body.get("email", "").strip()
    username = body.get("username", "").strip()

    log.info("[PROVISION] Request | sub=%s | email=%s | username=%s | ip=%s", sub, email, username, client_ip)

    if not sub:
        log.warning("[PROVISION] Missing sub | ip=%s", client_ip)
        return JSONResponse({"error": "sub is required"}, status_code=422)

    base = BASE_CONTENT_DIR / sub

    if base.exists():
        log.info("[PROVISION] Already provisioned | sub=%s", sub)
        return JSONResponse({
            "message": "Tenant already provisioned",
            "tenant_id": sub, "email": email,
            "folders": ["templates", "context", "prompts"],
            "created": False,
        }, status_code=200)

    try:
        for folder in ("templates", "context", "prompts"):
            (base / folder).mkdir(parents=True, exist_ok=True)
            log.debug("[PROVISION] Created folder | sub=%s | folder=%s", sub, folder)

        manifest = {
            "sub": sub, "email": email, "username": username,
            "provisioned_at": int(time.time()),
            "trigger_source": body.get("trigger_source", "manual"),
        }
        (base / "manifest.json").write_text(_json.dumps(manifest, indent=2))
        log.info("[PROVISION] Tenant created | sub=%s | path=%s", sub, base)
    except OSError as e:
        log.error("[PROVISION] Failed to create tenant directories | sub=%s | path=%s | error=%s", sub, base, e, exc_info=True)
        return JSONResponse({"error": "provisioning_failed", "detail": str(e)}, status_code=500)

    return JSONResponse({
        "message": "Tenant provisioned",
        "tenant_id": sub, "email": email,
        "folders": ["templates", "context", "prompts"],
        "created": True,
    }, status_code=201)