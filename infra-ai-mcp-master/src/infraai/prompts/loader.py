"""
infraai/prompts/loader.py
Single responsibility: Register tenant-scoped MCP prompts.

MCP Prompts registered here are user-invoked from the Claude UI prompt picker.
For AI-autonomous prompt retrieval, use the MCP tools in tools/prompts.py instead.

Prompts:
  - list_all_prompts  → loads every prompt file with its title heading and full content
  - default           → zero-argument shortcut that loads default.md
"""

import logging

from fastmcp import FastMCP, Context
from fastmcp.prompts import Message
from utils.utils import get_tenant, list_tenant_files, read_tenant_file, filename_to_topic

log = logging.getLogger("infraai-mcp")


# ─── Public registration entry-point ──────────────────────────────────────────

def register_prompts(mcp: FastMCP) -> None:
    """
    Register prompt discovery and loading primitives onto the MCP instance.
    Called once at server startup from server.py.
    """

    @mcp.prompt(
        name="list_all_prompts",
        description=(
            "Load all available InfraAI workflow prompts for the authenticated tenant. "
            "Each prompt is returned with its title heading and full content. "
            "Use this when you need to choose a prompt or load all context at once."
        ),
    )
    def list_all_prompts(ctx: Context) -> list[Message]:
        tenant_id = get_tenant("prompts/list")
        if not tenant_id:
            return [Message(role="assistant", content="Error: Unauthorized")]

        filenames = list_tenant_files(tenant_id, "prompts")
        if not filenames:
            return [Message(role="assistant", content=f"No prompts found for tenant '{tenant_id}'.")]

        messages = []

        for filename in filenames:
            content = read_tenant_file(tenant_id, "prompts", filename)
            topic   = filename_to_topic(filename)
            messages.append(
                Message(
                    role="assistant",
                    content=f"--- {topic} ---\n{content if content else '(Empty or missing file)'}"
                )
            )

        return messages

    @mcp.prompt(
        name="default",
        description="InfraAI default workflow prompt. Loads default.md for the authenticated tenant.",
    )
    async def default_prompt(ctx: Context) -> str:
        """Loads the tenant's primary workflow prompt (default.md)."""
        tenant_id = get_tenant("prompts/default")
        if not tenant_id:
            return "Error: could not resolve tenant from request context."

        content = read_tenant_file(tenant_id, "prompts", "default.md")
        if content is None:
            log.warning("[PROMPT] default.md not found | tenant=%s", tenant_id)
            return f"Error: no default prompt configured for tenant '{tenant_id}'."

        log.info("[PROMPT] default prompt invoked | tenant=%s", tenant_id)
        return content

    log.info("[PROMPTS] 'list_all_prompts' and 'default' prompts registered")