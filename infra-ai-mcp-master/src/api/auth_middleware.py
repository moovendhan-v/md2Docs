import os
import json
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from utils.utils import extract_bearer_token, resolve_tenant
from api.config import MCP_PATH
from api.helpers import normalize_mcp_path, unauthorized_response, requires_auth

log = logging.getLogger("infraai-mcp")

class BearerAuthMiddleware(BaseHTTPMiddleware):
    """Validate Cognito Bearer JWT before FastMCP handles MCP requests."""

    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        token = extract_bearer_token(request)

        if token:
            # ── Cognito JWT via JWKS ──────────────────────────────────────
            from starlette.exceptions import HTTPException
            try:
                request.state.tenant_id = resolve_tenant(token)
                return await call_next(request)
            except HTTPException:
                return unauthorized_response(request)

        # ── 2. Public paths — no auth needed ────────────────────────────────
        public_paths = {
            "/health",
            "/favicon.ico",
            "/authorize",
            "/callback",
            "/token",
            "/register",
            "/internal/provision",
            "/.well-known/oauth-protected-resource",
            "/.well-known/oauth-protected-resource/mcp",
            "/.well-known/oauth-authorization-server",
        }
        if request.url.path in public_paths:
            return await call_next(request)

        # Allow unauthenticated GET to /mcp for initial discovery
        mcp_path = normalize_mcp_path(MCP_PATH)
        if request.url.path == mcp_path and request.method == "GET":
            return await call_next(request)

        if request.method == "POST":
            try:
                body = await request.json()
            except json.JSONDecodeError:
                body = None
            if requires_auth(body):
                return unauthorized_response(request)

        return unauthorized_response(request)
