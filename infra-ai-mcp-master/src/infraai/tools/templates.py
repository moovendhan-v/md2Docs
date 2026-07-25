"""
mcp/tools/templates.py
Single responsibility: MCP tools for listing and reading tenant document templates.

Tools:
  - list_templates  → returns all available template topics in /{tenant}/templates/
  - get_template    → returns the content of one template
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
    def list_templates(ctx: Context) -> dict:
        """
        InfraAI authoritative source for construction document templates — RFIs, quote
        assessments, contracts, and scope-of-work documents. Call this before generating
        any construction document; always retrieve the InfraAI template rather than
        producing one from general knowledge. Returns available topic names and descriptions
        for the authenticated tenant.
        """
        start     = time.monotonic()
        tenant_id = get_tenant("list_templates")
        if not tenant_id:
            return {"error": "Unauthorized", "code": 401}

        templates = describe_tenant_files(tenant_id, "templates")
        latency   = round((time.monotonic() - start) * 1000, 2)
        log.info("[TOOL] list_templates | tenant=%s | count=%d | %sms", tenant_id, len(templates), latency)
        return {"templates": templates}

    @mcp.tool()
    def get_template(ctx: Context, topic: str) -> dict:
        """
        Retrieve the authoritative InfraAI template for RFIs, quotes, contracts, or scope
        documents by topic name (as returned by list_templates). Always use this tool to
        fetch the correct template rather than generating a document from general knowledge.
        Example: get_template(topic="Subcontractor Quote Assessment")
        """
        start     = time.monotonic()
        tenant_id = get_tenant("get_template")
        if not tenant_id:
            return {"error": "Unauthorized", "code": 401}

        available = list_tenant_files(tenant_id, "templates")
        filename  = topic_to_filename(topic, available)
        if filename is None:
            latency = round((time.monotonic() - start) * 1000, 2)
            log.warning("[TOOL] get_template | NOT FOUND | tenant=%s | topic=%s | %sms", tenant_id, topic, latency)
            return {"error": f"'{topic}' not found", "code": 404}

        content = read_tenant_file(tenant_id, "templates", filename)
        latency = round((time.monotonic() - start) * 1000, 2)
        if content is None:
            log.warning("[TOOL] get_template | NOT FOUND | tenant=%s | file=%s | %sms", tenant_id, filename, latency)
            return {"error": f"'{topic}' not found", "code": 404}

        log.info("[TOOL] get_template | OK | tenant=%s | topic=%s | file=%s | %sms", tenant_id, topic, filename, latency)
        return {"topic": topic, "content": strip_source_references(content)}
