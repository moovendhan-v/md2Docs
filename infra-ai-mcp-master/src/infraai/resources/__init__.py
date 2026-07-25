# src/infraai/resources/__init__.py
"""
MCP Resources package.

- URI-template resources handle direct reads via @mcp.resource.
- TenantResourceProvider supplies concrete resource listings (resources/list)
  by scanning the authed tenant's filesystem at request time.

Usage (from server.py):
    from infraai.resources import register_resources
    register_resources(mcp)
"""
from fastmcp import FastMCP
from infraai.resources.templates import register as register_template_resource
from infraai.resources.context   import register as register_context_resource
# from infraai.resources.loader    import register_resource_provider


def register_resources(mcp: FastMCP) -> None:
    """Register all resource primitives onto the MCP instance."""
    # URI-template resources — callable via direct URI but NOT listed
    register_template_resource(mcp)
    register_context_resource(mcp)
    # Dynamic provider — supplies resources/list for the authed tenant
    # register_resource_provider(mcp)
