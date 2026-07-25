# InfraAI MCP Server

**AI-as-a-service for Australian construction professionals**  
Hosted on AWS EC2 ap-southeast-4 (Melbourne) · Powered by FastMCP 3.x

---

## What this is

The InfraAI platform makes proprietary construction IP — templates, assessment frameworks, and prompt guides — available to Claude Desktop at query time via the Model Context Protocol (MCP).

When a professional asks Claude a project-specific question, Claude calls this server over HTTPS, retrieves the relevant markdown content, and uses it to give a project-accurate answer.

---

## Architecture

Four Docker services sit behind a Caddy reverse proxy on a single EC2 instance.

```
                        ┌─────────────────────────────────────────────┐
                        │              Caddy (TLS termination)        │
                        │         mcp.infraconsulting.com.au          │
                        └──────┬──────────┬──────────┬────────────────┘
                               │          │          │
              /mcp  /authorize │   /api/* │          │  /* (catch-all)
              /token /callback │          │          │
                               ▼          ▼          ▼
                        ┌──────────┐ ┌─────────┐ ┌──────────┐
                        │   MCP    │ │   API   │ │ Frontend │
                        │ Server   │ │ Service │ │   (Ui)   │
                        │ :80      │ │ :80     │ │  :80     │
                        └──────────┘ └─────────┘ └──────────┘
                               │          │
                               └────┬─────┘
                                    ▼
                            /srv/mcp-context/
                            └── {tenant_uuid}/
                                ├── templates/
                                ├── context/
                                └── prompts/
```

### Services

| Service | Container | Purpose |
|---|---|---|
| `mcp-server` | `infraai-mcp` | FastMCP server — serves tools, resources, prompts to Claude |
| `api` | `infraai-api` | FastAPI REST service — user/admin file management + tenant ops |
| `frontend` | `infraai-frontend` | Static HTML/JS admin & user consoles |
| `caddy` | `infraai-caddy` | TLS termination, path-based routing, auto-HTTPS |

### Routing (Caddyfile)

| Path | Routed to |
|---|---|
| `/mcp*` | MCP server |
| `/authorize`, `/token`, `/callback`, `/register`, `/.well-known/*` | MCP server (OAuth proxy) |
| `/api/*` | API service (prefix stripped) |
| `/*` | Frontend |

---

## Directory structure

```
infraai-mcp-server/
├── src/                        ← MCP server
│   ├── server.py               ← Entrypoint — wires FastMCP + Starlette routes
│   ├── api/                    ← Auth middleware, config, route handlers, helpers
│   ├── infraai/
│   │   ├── tools/              ← list/get tools for templates, context, prompts, discovery
│   │   ├── resources/          ← Direct URI read handlers (infraai://)
│   │   └── prompts/            ← Dynamic per-tenant prompt discovery
│   └── utils/                  ← JWT validation, path safety, Cognito helpers
├── api/                        ← REST API service
│   ├── src/
│   │   ├── admin_routes.py     ← Admin endpoints (Cognito group: admin)
│   │   ├── user_routes.py      ← User endpoints (any valid Cognito token)
│   │   └── shared.py           ← Auth deps, path helpers, Cognito JWKS validation
│   ├── main.py
│   └── Dockerfile
├── Ui/                         ← Frontend
│   ├── admin.html              ← Admin console
│   ├── user.html               ← User workspace
│   ├── index.html              ← Login / OAuth entry point
│   └── js/
│       ├── api.js              ← Axios instance, interceptors, Cognito PKCE flow
│       ├── admin.js            ← Admin console logic
│       ├── user.js             ← User workspace logic
│       └── config.js           ← API base URL, Cognito client ID
├── __docs/                     ← Maintenance guides, runbook, API reference
├── Caddyfile
├── docker-compose.yml
├── Dockerfile                  ← MCP server image
└── pyproject.toml
```

---

## Authentication

All auth is delegated to **AWS Cognito** (pool: `ap-southeast-4`).

### MCP server (Claude Desktop)
- Implements OAuth 2.0 PKCE via `/authorize` → `/callback` → `/token` proxy endpoints
- Bearer JWT validated against Cognito JWKS on every MCP request
- Tenant is resolved from `custom:tenant_id` → `cognito:username` → `sub`

### REST API
- **Admin routes** (`/api/tenants/*`, `/api/logs`) — require a valid Cognito JWT in the `admin` Cognito group
- **User routes** (`/api/files/*`) — require any valid Cognito JWT; tenant is resolved from token claims
- Admins can impersonate a tenant via the `X-Tenant-Id` header

### Frontend
- PKCE flow handled in `api.js`; token stored in `localStorage` as `infra_cognito_id_token`
- `api.js` exposes `window.infraApi` (axios instance) — automatically prepends `/api` and injects the Bearer token on every request
- RBAC redirect: `admin` group → `admin.html`, others → `user.html`

---

## Tenant isolation

Each tenant gets a UUID-named folder under `/srv/mcp-context/`:

```
/srv/mcp-context/
└── {tenant_uuid}/
    ├── templates/   ← markdown templates
    ├── context/     ← assessment frameworks, reference docs
    └── prompts/     ← workflow prompt guides (auto-discovered by MCP)
```

---

## Key features

### Filename masking
Raw filenames are never exposed to the AI. Every file is converted to a **topic name** before being sent (e.g. `quote_assessment_guide.md` → `"Quote Assessment Guide"`). The server maps the topic name back to the real file automatically. This keeps AI responses clean and consistent.

### Dynamic prompt discovery
The MCP server scans `{tenant_uuid}/prompts/*.md` at query time. Any `.md` file added there is immediately discoverable via `list_prompts` — no restart needed.

### Multi-level knowledge access
- **Tools** — `list_templates`, `get_template`, `list_context`, `get_context`, `list_prompts`, `get_prompt`, `list_all_resources`
- **Resources** — direct read via `infraai://templates/{topic}` or `infraai://context/{topic}`
- **Prompts** — per-tenant workflow orchestration, auto-discovered

---

## Quick start


### Running locally
```bash
docker compose up --build
```

### Deploying
```bash
./bootstrap.sh   # first-time EC2 setup
./start.sh       # start all services
```

For troubleshooting and API reference see the [\_\_docs/ folder](__docs/README.md).

Key docs:
- [Deployment & Git Pull Guide](__docs/deployment.md)
- [Architecture Overview](__docs/architecture.md)
- [API Reference](__docs/api_reference.md)
- [Runbook](__docs/runbook.md)

