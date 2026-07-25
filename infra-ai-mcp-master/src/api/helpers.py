import json
from starlette.requests import Request
from starlette.responses import JSONResponse

from api.config import MCP_PATH, MCP_PUBLIC_BASE_URL

def normalize_mcp_path(path: str) -> str:
    cleaned = path.strip() or "/mcp"
    if not cleaned.startswith("/"):
        cleaned = f"/{cleaned}"
    return cleaned.rstrip("/") or "/mcp"

def external_base_url(request: Request) -> str:
    if MCP_PUBLIC_BASE_URL:
        return MCP_PUBLIC_BASE_URL
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host  = request.headers.get("x-forwarded-host", request.headers.get("host", request.url.netloc))
    return f"{proto}://{host}".rstrip("/")

def resource_metadata_url(request: Request) -> str:
    mcp_path = normalize_mcp_path(MCP_PATH).lstrip("/")
    return f"{external_base_url(request)}/.well-known/oauth-protected-resource/{mcp_path}"

def unauthorized_response(request: Request) -> JSONResponse:
    return JSONResponse(
        {
            "error": "invalid_token",
            "error_description": "Valid Cognito Bearer token required",
        },
        status_code=401,
        headers={
            "WWW-Authenticate": (
                'Bearer realm="infraai", '
                'error="invalid_token", '
                'error_description="Valid Cognito Bearer token required", '
                f'resource_metadata="{resource_metadata_url(request)}"'
            )
        },
    )

def requires_auth(body: object) -> bool:
    protected_methods = {
        "tools/call",
        "resources/list",
        "resources/read",
        "prompts/list",
        "prompts/get",
    }
    messages = body if isinstance(body, list) else [body]
    for message in messages:
        if isinstance(message, dict) and message.get("method") in protected_methods:
            return True
    return False
