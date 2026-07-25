# InfraAI MCP Server — Maintenance Guide

## 1. Managing Markdown Content

All tenant IP is stored in the `mcp_data` Docker volume, mounted at `/srv/mcp-context/`.

Each tenant's files live under their UUID folder:

```
/srv/mcp-context/
└── {tenant_uuid}/
    ├── templates/   ← markdown templates
    ├── context/     ← assessment frameworks, reference docs
    └── prompts/     ← workflow prompt guides
```


To add or update a file, place it in the appropriate subfolder. The MCP server scans at request time — no restart needed for tools or resources. Prompts may need a Claude Desktop restart to appear in the prompt picker.

---

## 2. Multi-Tenancy & Access Control

Auth is fully delegated to **AWS Cognito** (pool: `ap-southeast-4_NMx325UPp`).

- The MCP server validates RS256 JWTs against Cognito JWKS on every request
- Tenant is resolved from the token: `custom:tenant_id` → `cognito:username` → `sub`
- All file operations are scoped to `/srv/mcp-context/{tenant_uuid}/`

Admin vs user access is controlled by Cognito groups:
- `admin` group → access to `admin.html` and all `/api/tenants/*` endpoints
- Any valid Cognito token → access to `user.html` and `/api/files/*` endpoints

---

## 3. Server Management

Connect to the EC2 instance first — see [deployment.md](deployment.md) for SSH setup and the full git pull + redeploy workflow.

Quick reference:

```bash
ssh ubuntu@{SERVER_IP}
cd ~/mcp-server

# Pull latest code and rebuild
git pull origin main
./start.sh --build

# Restart a specific service
docker compose restart mcp-server

# Tail logs
docker compose logs -f mcp-server
docker compose logs -f api
docker compose logs -f caddy
```

---

## 4. Configuring Claude Desktop (Only for local testing)

Claude Desktop connects via OAuth 2.0 PKCE — no static token needed.

1. Locate your Claude config:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the server entry:

```json
{
  "mcpServers": {
    "infraai": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.infraai.com.au/mcp"
      ]
    }
  }
}
```

3. Restart Claude Desktop. It will open a browser window to complete the Cognito login on first connect.

---

## Further Documentation

- [Deployment & Git Pull Guide](deployment.md)
- [Architecture Overview](architecture.md)
- [API Reference](api_reference.md)
- [Runbook](runbook.md)
- [End-User Setup Guide](user_setup_guide.md)
