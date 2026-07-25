# InfraAI — End-User Setup Guide

This guide explains how to access the InfraAI platform and connect it to Claude Desktop.

## Prerequisites

- **Claude Desktop** installed on your machine
- **Node.js & npm** — required for the `npx mcp-remote` bridge that Claude Desktop uses to connect

---

## Phase 1: Log In

1. Go to `https://mcp.infraai.com.au`
2. Click **Sign in with Cognito** — you'll be redirected to the AWS Cognito login page
3. Log in with your credentials. If you don't have an account, contact your administrator
4. After login you'll be redirected automatically:
   - Admin users → `admin.html`
   - All other users → `user.html` (the workspace)

---

## Phase 2: Manage Your Files

The workspace (`user.html`) gives you a file editor for your isolated tenant folder.

Use the sidebar to switch between folders:
- `templates/` — base frameworks
- `context/` — assessment criteria and reference docs
- `prompts/` — workflow guides (auto-discovered by Claude)

From here you can create, edit, and delete `.md` files. Changes are available to Claude immediately — no restart needed.

---

## Phase 3: Connect Claude Desktop (Only for local testing)

Claude Desktop connects via OAuth 2.0 PKCE — no static token required.

1. Locate your Claude config file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the following to the `mcpServers` object:

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

3. Restart Claude Desktop completely (quit and relaunch)

4. On first connect, a browser window will open for Cognito login. After authenticating, Claude will have access to your tenant's files via the MCP tools.

---

## Phase 4: Using InfraAI in Claude

Once connected, start a session by asking Claude to call `list_all_resources`. This primes Claude with all your available templates, context files, and prompt guides.

Example prompts:
- "List all available InfraAI templates"
- "Use the [template name] template to help me with [task]"
- "What assessment frameworks do I have available?"

---

## Troubleshooting

**Login redirects back to the login page**  
Your account may be disabled. Contact your administrator.

**Claude shows "Connection failed"**  
Ensure Node.js is installed and `npx` is available in your system path. Try running `npx mcp-remote --version` in a terminal to verify.

**Claude shows "Unauthorized"**  
Your Cognito session may have expired. Disconnect and reconnect the MCP server in Claude Desktop to trigger a fresh login.

**Files not appearing in Claude**  
Ensure files are `.md` format and placed in the correct folder. Call `list_all_resources` in Claude to refresh the available IP list.
