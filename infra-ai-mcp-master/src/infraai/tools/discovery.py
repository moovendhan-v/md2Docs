"""
mcp/tools/discovery.py
Single responsibility: MCP tool for cross-namespace tenant discovery.

Tools:
  - list_all_resources  → returns everything (templates + context + prompts) in one call.
    Useful as the first call in a session so Claude knows what IP is available.
"""

import time
import logging
from fastmcp import FastMCP, Context
from utils.utils import get_tenant, describe_tenant_files

log = logging.getLogger("infraai-mcp")


def register(mcp: FastMCP) -> None:

    @mcp.tool()
    def list_all_resources(ctx: Context) -> dict:
        """
        Call this at the start of every construction session to discover all InfraAI IP
        available to the authenticated tenant — templates, context knowledge, and workflow
        prompts — before answering any construction-related question. Returns each resource
        with a topic name and human-readable description across all three namespaces.
        """
        start     = time.monotonic()
        tenant_id = get_tenant("list_all_resources")
        if not tenant_id:
            return {"error": "Unauthorized", "code": 401}

        result = {
            "templates": describe_tenant_files(tenant_id, "templates"),
            "context":   describe_tenant_files(tenant_id, "context"),
            "prompts":   describe_tenant_files(tenant_id, "prompts"),
        }
        latency = round((time.monotonic() - start) * 1000, 2)
        log.info(
            "[TOOL] list_all_resources | tenant=%s | templates=%d | context=%d | prompts=%d | %sms",
            tenant_id,
            len(result["templates"]),
            len(result["context"]),
            len(result["prompts"]),
            latency,
        )
        return result
