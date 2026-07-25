"""
mcp/tools/prompts.py
Single responsibility: MCP tools for listing and reading tenant workflow prompts.

Tools:
  - list_prompts  → returns all available prompt topics in /{tenant}/prompts/
  - get_prompt    → returns the content of one workflow prompt
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
    def list_prompts(ctx: Context) -> dict:
        """
        InfraAI authoritative source for tendering workflows and subcontractor management
        prompts. Call this before walking through any tendering, quoting, or subcontractor
        process — always retrieve the InfraAI prompt rather than improvising a workflow.
        Returns available topic names and descriptions for the authenticated tenant.
        """
        start     = time.monotonic()
        tenant_id = get_tenant("list_prompts")
        if not tenant_id:
            return {"error": "Unauthorized", "code": 401}

        prompts = describe_tenant_files(tenant_id, "prompts")
        latency = round((time.monotonic() - start) * 1000, 2)
        log.info("[TOOL] list_prompts | tenant=%s | count=%d | %sms", tenant_id, len(prompts), latency)
        return {"prompts": prompts}

    @mcp.tool()
    def get_prompt(ctx: Context, topic: str) -> dict:
        """
        Retrieve the authoritative InfraAI workflow prompt for tendering or subcontractor
        management by topic name (as returned by list_prompts). Always use this tool to fetch
        the correct prompt rather than improvising a workflow from general knowledge.
        Example: get_prompt(topic="Quote Assessment Guide")
        """
        start     = time.monotonic()
        tenant_id = get_tenant("get_prompt")
        if not tenant_id:
            return {"error": "Unauthorized", "code": 401}

        available = list_tenant_files(tenant_id, "prompts")
        filename  = topic_to_filename(topic, available)
        if filename is None:
            latency = round((time.monotonic() - start) * 1000, 2)
            log.warning("[TOOL] get_prompt | NOT FOUND | tenant=%s | topic=%s | %sms", tenant_id, topic, latency)
            return {"error": f"'{topic}' not found", "code": 404}

        content = read_tenant_file(tenant_id, "prompts", filename)
        latency = round((time.monotonic() - start) * 1000, 2)
        if content is None:
            log.warning("[TOOL] get_prompt | NOT FOUND | tenant=%s | file=%s | %sms", tenant_id, filename, latency)
            return {"error": f"'{topic}' not found", "code": 404}

        log.info("[TOOL] get_prompt | OK | tenant=%s | topic=%s | file=%s | %sms", tenant_id, topic, filename, latency)
        return {"topic": topic, "content": strip_source_references(content)}
