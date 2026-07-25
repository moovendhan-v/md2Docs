# InfraAI MCP Server — Architecture Overview

## Introduction

The InfraAI platform serves proprietary construction IP to Claude Desktop via the Model Context Protocol (MCP). It runs as four Docker services behind a Caddy reverse proxy on a single EC2 instance in `ap-southeast-4` (Melbourne).

---

## Services

```
                   ┌─────────────────────────────────────────────┐
                   │              Caddy (TLS termination)         │
                   │             mcp.infraai.com.au               │
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
                       /srv/mcp-context/   (mcp_data volume)
                       └── {tenant_uuid}/
                           ├── templates/
                           ├── context/
                           └── prompts/
```

| Service | Container | Purpose |
|---|---|---|
| `mcp-server` | `infraai-mcp` | FastMCP — tools, resources, prompts for Claude |
| `api` | `infraai-api` | FastAPI REST — file management, tenant operations |
| `frontend` | `infraai-frontend` | Static HTML/JS admin and user consoles |
| `caddy` | `infraai-caddy` | TLS termination, path-based routing |

### Caddy routing (`Caddyfile`)

| Path | Routed to |
|---|---|
| `/mcp*` | `infraai-mcp:80` |
| `/authorize`, `/token`, `/callback`, `/register`, `/.well-known/*` | `infraai-mcp:80` |
| `/api/*` | `infraai-api:80` (prefix stripped) |
| `/*` | `infraai-frontend:80` |

---

## MCP Server (`src/`)

Entry point: `src/server.py` — wires FastMCP with a Starlette app.

```
src/
├── server.py               ← Starlette app + FastMCP mount
├── api/
│   ├── auth_middleware.py  ← BearerAuthMiddleware (Cognito JWKS validation)
│   ├── config.py           ← MCP_HOST, MCP_PORT, MCP_PATH
│   ├── helpers.py          ← Path normalisation, response helpers
│   └── routes.py           ← OAuth proxy endpoints (/authorize, /token, etc.)
├── infraai/
│   ├── tools/
│   │   ├── templates.py    ← list_templates, get_template
│   │   ├── context.py      ← list_context, get_context
│   │   ├── prompts.py      ← list_prompts, get_prompt
│   │   └── discovery.py    ← list_all_resources
│   ├── resources/
│   │   ├── templates.py    ← infraai://templates/{topic}
│   │   └── context.py      ← infraai://context/{topic}
│   └── prompts/
│       └── loader.py       ← Dynamic discovery from prompts/*.md
└── utils/
    └── utils.py            ← Cognito JWKS validation, tenant resolution, path safety,
                               filename↔topic conversion
```

---

## REST API (`api/`)

Entry point: `api/src/main.py` — FastAPI app with two routers.

```
api/src/
├── admin_routes.py   ← /tenants/*, /logs  (requires Cognito 'admin' group)
├── user_routes.py    ← /files/*           (any valid Cognito token)
└── shared.py         ← Auth deps, Cognito JWKS client, path helpers
```

### Admin endpoints (Cognito `admin` group required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/tenants` | List all Cognito users |
| `DELETE` | `/tenants/{id}` | Disable user + global sign-out |
| `POST` | `/tenants/{id}/enable` | Re-enable a user |
| `PATCH` | `/tenants/{id}` | Update Cognito user attributes |
| `GET` | `/tenants/{id}/files/{folder}` | List files for any tenant |
| `GET` | `/tenants/{id}/files/{folder}/{file}` | Read file for any tenant |
| `PUT` | `/tenants/{id}/files/{folder}/{file}` | Update file for any tenant |
| `POST` | `/tenants/{id}/files/{folder}/{file}` | Create file for any tenant |
| `GET` | `/logs` | Tail MCP server log |

### User endpoints (any valid Cognito token)

| Method | Path | Description |
|---|---|---|
| `GET` | `/files/{folder}` | List files in own tenant folder |
| `GET` | `/files/{folder}/{file}` | Read file content |
| `PUT` | `/files/{folder}/{file}` | Update file content |
| `POST` | `/files/{folder}/{file}` | Create new file |
| `DELETE` | `/files/{folder}/{file}` | Delete file |

Admins can pass `X-Tenant-Id` header to operate on behalf of another tenant.

---

## Frontend (`Ui/`)

Static files served by nginx inside `infraai-frontend`.

```
Ui/
├── index.html    ← Login / OAuth entry point
├── admin.html    ← Admin console
├── user.html     ← User workspace (file editor)
└── js/
    ├── api.js    ← Axios instance, Cognito PKCE flow, RBAC redirect
    ├── admin.js  ← Admin console logic
    ├── user.js   ← User workspace logic (legacy, superseded by inline script)
    └── config.js ← API_BASE_URL, MCP_SERVER_URL, COGNITO_CLIENT_ID
```

`api.js` exposes `window.infraApi` — an axios instance that automatically:
- Prepends `/api` to all request paths
- Injects the Cognito Bearer token from `localStorage`
- Redirects to `index.html` on 401

---

## Authentication

All auth is delegated to AWS Cognito (`ap-southeast-4_NMx325UPp`).

### MCP server
- OAuth 2.0 PKCE proxy: `/authorize` → Cognito hosted UI → `/callback` → `/token`
- `BearerAuthMiddleware` validates RS256 JWT against Cognito JWKS on every `/mcp` request
- Tenant resolved from token: `custom:tenant_id` → `cognito:username` → `sub`

### REST API
- `require_admin` — validates Cognito JWT, checks `cognito:groups` contains `admin`
- `require_user_token` — validates any Cognito JWT, resolves tenant from claims

### Frontend
- PKCE flow in `api.js`; token stored as `infra_cognito_id_token` in `localStorage`
- On load: `admin` group → redirect to `admin.html`, others → `user.html`

---

## Tenant isolation

Each Cognito user maps to a UUID folder on disk. The mapping lives in `/srv/mcp-context/config/tenants.json`.

```
/srv/mcp-context/
└── {tenant_uuid}/
    ├── templates/
    ├── context/
    └── prompts/
```

---

## Storage

A single named Docker volume `mcp_data` is shared between `mcp-server` and `api`, both mounting it at `/srv/mcp-context`. `caddy_data` and `caddy_config` persist TLS certificates.
