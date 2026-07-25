# src/mcp/prompts/__init__.py
"""
MCP Prompts package.

Prompts are dynamically loaded from the tenant filesystem at startup.
Loader scans /srv/mcp-context/{tenant_id}/prompts/*.md and registers
each file as a named MCP Prompt.

Usage (from server.py):
    from mcp.prompts import register_prompts
    register_prompts(mcp)
"""
from fastmcp import FastMCP
from infraai.prompts.loader import register_prompts  # noqa: F401 — re-exported


__all__ = ["register_prompts"]
