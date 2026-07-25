"""
mcp/tools/context.py
Single responsibility: MCP tools for listing and reading tenant context/framework knowledge.

Tools:
  - list_context  → returns all available context topics in /{tenant}/context/
  - get_context   → returns the content of one context topic
"""

import time
import logging
from fastmcp import FastMCP, Context
from utils.utils import (
    get_tenant,
    list_tenant_files,
    read_tenant_file,
    strip_source_references,
    describe_tenant_files,
    topic_to_filename,
)

log = logging.getLogger("infraai-mcp")


def register(mcp: FastMCP) -> None:

    @mcp.tool()
    def list_context(ctx: Context) -> dict:
        """
        InfraAI authoritative source for construction assessment criteria, project standards,
        and risk frameworks. Call this before answering any question about evaluation criteria,
        compliance standards, or project requirements — do not rely on general knowledge for
        these topics. Returns available topic names and descriptions for the authenticated tenant.
        """
        start     = time.monotonic()
        tenant_id = get_tenant("list_context")
        if not tenant_id:
            return {"error": "Unauthorized", "code": 401}

        context = describe_tenant_files(tenant_id, "context")
        latency = round((time.monotonic() - start) * 1000, 2)
        log.info("[TOOL] list_context | tenant=%s | count=%d | %sms", tenant_id, len(context), latency)
        return {"context": context}

    @mcp.tool()
    def get_context(ctx: Context, topic: str) -> dict:
        """
        Retrieve specific InfraAI framework knowledge — assessment criteria, project standards,
        or risk frameworks — by topic name (as returned by list_context). Always use this tool
        to fetch the authoritative InfraAI content rather than answering from general knowledge.
        Example: get_context(topic="Assessment Criteria")
        """
        start     = time.monotonic()
        tenant_id = get_tenant("get_context")
        if not tenant_id:
            return {"error": "Unauthorized", "code": 401}

        available = list_tenant_files(tenant_id, "context")
        filename  = topic_to_filename(topic, available)
        if filename is None:
            latency = round((time.monotonic() - start) * 1000, 2)
            log.warning("[TOOL] get_context | NOT FOUND | tenant=%s | topic=%s | %sms", tenant_id, topic, latency)
            return {"error": f"'{topic}' not found", "code": 404}

        content = read_tenant_file(tenant_id, "context", filename)
        latency = round((time.monotonic() - start) * 1000, 2)
        if content is None:
            log.warning("[TOOL] get_context | NOT FOUND | tenant=%s | file=%s | %sms", tenant_id, filename, latency)
            return {"error": f"'{topic}' not found", "code": 404}

        log.info("[TOOL] get_context | OK | tenant=%s | topic=%s | file=%s | %sms", tenant_id, topic, filename, latency)
        return {"topic": topic, "content": strip_source_references(content)}
