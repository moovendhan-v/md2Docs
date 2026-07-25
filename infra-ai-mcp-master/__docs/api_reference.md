# InfraAI MCP Server — API Reference

## MCP Tools

Tools are called by Claude to query tenant IP. All tools are scoped to the authenticated tenant automatically — no tenant ID parameter needed.

Filenames are never exposed to the AI. All tools work with **topic names** (e.g. `"Quote Assessment Guide"`) which are automatically mapped to the underlying files on the server.

### Templates (`src/infraai/tools/templates.py`)

- **`list_templates()`** — returns `[{topic, description}]` for the tenant's `templates/` knowledge
- **`get_template(topic)`** — returns the full content of a specific template by topic name

### Context (`src/infraai/tools/context.py`)

- **`list_context()`** — returns `[{topic, description}]` for assessment criteria and framework knowledge
- **`get_context(topic)`** — returns the content of a specific context topic

### Prompts (`src/infraai/tools/prompts.py`)

- **`list_prompts()`** — returns `[{topic, description}]` for task-specific workflow prompts
- **`get_prompt(topic)`** — returns the content of a specific workflow prompt

### Global Discovery (`src/infraai/tools/discovery.py`)

- **`list_all_resources()`** — aggregates all templates, context, and prompts in one call. Recommended as the first tool call in a session to prime Claude with available IP. Returns `{templates, context, prompts}` each as `[{topic, description}]`.

---

## MCP Resources

Resources are direct URIs Claude can read without a tool call. They accept **topic names**, not raw filenames.

- **`infraai://templates/{topic}`** — reads a template by topic name (e.g. `infraai://templates/Subcontractor Quote Assessment`)
- **`infraai://context/{topic}`** — reads a context document by topic name (e.g. `infraai://context/Assessment Criteria`)

---

## MCP Prompts

Prompts are registered dynamically from the tenant's `prompts/` folder (`src/infraai/prompts/loader.py`). Any `.md` file placed there is immediately discoverable — no restart needed.

- **`list_all_prompts`** — returns topic names and full contents of all discovered prompts
- **`get_prompt(topic)`** — loads a specific prompt by topic name (e.g. `"Quote Assessment Guide"`)
- **`default`** — loads `default.md` if it exists

---

## REST API — User Endpoints

Base URL: `https://mcp.infraai.com.au/api`  
Auth: `Authorization: Bearer {cognito_id_token}`  
Tenant is resolved automatically from the token — no tenant ID in the path.

Valid folders: `templates`, `context`, `prompts`

| Method | Path | Description |
|---|---|---|
| `GET` | `/files/{folder}` | List `.md` files in folder |
| `GET` | `/files/{folder}/{filename}` | Get file content |
| `PUT` | `/files/{folder}/{filename}` | Update file — body: `{ "content": "..." }` |
| `POST` | `/files/{folder}/{filename}` | Create new file (appends `.md` if missing) |
| `DELETE` | `/files/{folder}/{filename}` | Delete file |

---

## REST API — Admin Endpoints

Auth: `Authorization: Bearer {cognito_id_token}` where the token's `cognito:groups` includes `admin`.

Admins can operate on any tenant by passing `X-Tenant-Id: {tenant_uuid}` header on user-scoped endpoints.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health-check` | Protected health check |
| `GET` | `/tenants` | List all Cognito users with status |
| `DELETE` | `/tenants/{id}` | Disable user + global sign-out |
| `POST` | `/tenants/{id}/enable` | Re-enable a disabled user |
| `PATCH` | `/tenants/{id}` | Update Cognito user attributes |
| `GET` | `/tenants/{id}/files/{folder}` | List files for any tenant |
| `GET` | `/tenants/{id}/files/{folder}/{file}` | Read file for any tenant |
| `PUT` | `/tenants/{id}/files/{folder}/{file}` | Update file for any tenant |
| `POST` | `/tenants/{id}/files/{folder}/{file}` | Create file for any tenant |
| `GET` | `/logs` | Tail MCP server log (last 100 lines by default) |

---

## OAuth Endpoints (MCP Server)

These are used by Claude Desktop's `mcp-remote` bridge for the PKCE flow.

| Method | Path | Description |
|---|---|---|
| `GET` | `/authorize` | Redirects to Cognito hosted UI |
| `GET` | `/callback` | Handles Cognito redirect, exchanges code for tokens |
| `POST` | `/token` | Token exchange proxy |
| `POST` | `/register` | Dynamic client registration |
| `GET` | `/.well-known/oauth-authorization-server` | OAuth metadata |
| `GET` | `/.well-known/oauth-protected-resource` | Protected resource metadata |
| `GET` | `/health` | Unauthenticated health check |
