# src/mcp/tools/__init__.py
"""
MCP Tools package.

Each module in this package registers exactly one pair of
list + get tools for a single resource type.

Usage (from server.py):
    from mcp.tools import register_tools
    register_tools(mcp)
"""
from fastmcp import FastMCP
from infraai.tools.templates  import register as register_template_tools
from infraai.tools.context    import register as register_context_tools
from infraai.tools.prompts    import register as register_prompt_tools
from infraai.tools.discovery  import register as register_discovery_tools


def register_tools(mcp: FastMCP) -> None:
    """Register all tool modules onto the MCP instance."""
    register_template_tools(mcp)
    register_context_tools(mcp)
    register_prompt_tools(mcp)
    register_discovery_tools(mcp)
