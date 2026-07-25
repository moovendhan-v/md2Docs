"""
mcp/resources/context.py
Single responsibility: MCP Resource for reading tenant context/framework files.

Resource:
  infraai://context/{filename}

Claude can read this URI directly without calling a tool.
Tenant is derived ONLY from JWT (not from URI).
"""

import logging
from fastmcp import FastMCP
from utils.utils import get_tenant, read_tenant_file, list_tenant_files, topic_to_filename

log = logging.getLogger("infraai-mcp")


def register(mcp: FastMCP) -> None:

    @mcp.resource("infraai://context/{topic}")
    def get_context_resource(topic: str) -> str:
        """
        Read a tenant context/framework file as an MCP Resource.

        URI:
            infraai://context/{topic}

        Example:
            infraai://context/Assessment Criteria
        """

        caller = f"resource:context/{topic}"

        # 🔐 Get tenant ONLY from JWT
        tenant_id = get_tenant(caller)

        if tenant_id is None:
            log.warning("[RESOURCE] UNAUTHORIZED | %s", caller)
            raise PermissionError("Unauthorized: valid Bearer JWT required")

        # 🔍 Resolve topic name → real filename
        available = list_tenant_files(tenant_id, "context")
        filename  = topic_to_filename(topic, available)
        if filename is None:
            log.warning("[RESOURCE] NOT FOUND | tenant=%s | topic=%s", tenant_id, topic)
            raise FileNotFoundError(
                f"Context file '{topic}' not found for tenant '{tenant_id}'"
            )

        # 📂 Read tenant-scoped file
        content = read_tenant_file(tenant_id, "context", filename)

        if content is None:
            log.warning("[RESOURCE] NOT FOUND | tenant=%s | context/%s", tenant_id, filename)
            raise FileNotFoundError(
                f"Context file '{topic}' not found for tenant '{tenant_id}'"
            )

        log.info(
            "[RESOURCE] OK | tenant=%s | topic=%s | context/%s | bytes=%d",
            tenant_id,
            topic,
            filename,
            len(content),
        )

        return content