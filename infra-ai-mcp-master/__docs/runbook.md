# InfraAI MCP Server — Runbook

## Common Failure Modes

### 1. Server Not Responding

**Symptoms**: Claude Desktop shows "Connection failed" or "MCP server not found".

1. Check all containers are running: `docker ps`
2. Check for crashes: `docker compose logs mcp-server`
3. Check Caddy is routing correctly: `docker compose logs caddy`
4. Verify HTTPS is reachable: `curl https://mcp.infraai.com.au/health`

---

### 2. Unauthorized Errors (401/403)

**Symptoms**: Claude tool calls return "Unauthorized", or the web console shows a 401.

**For Claude Desktop:**
1. The Cognito token may have expired. In Claude Desktop, disconnect and reconnect the MCP server to trigger a fresh OAuth login.
2. Check `docker compose logs mcp-server` for the JWT rejection reason.
3. Confirm the Cognito pool ID and region in `docker-compose.yml` match the actual pool.

**For the web console:**
1. Clear `localStorage` in the browser and log in again via `index.html`.
2. Check that the user exists and is enabled in Cognito (visible in `admin.html` → Tenants tab).
3. Admin 403: confirm the user is in the `admin` Cognito group.

---

### 3. Files Not Found (404)

**Symptoms**: Claude can list files but fails to retrieve content, or the user console shows 404.

1. Verify the file exists on disk: `/srv/mcp-context/{tenant_uuid}/{folder}/{filename}`
2. Confirm the tenant UUID — check `/srv/mcp-context/config/tenants.json` for the mapping
3. Check for path-traversal warnings in the logs: `docker compose logs api`

---

### 4. Claude Fails to Load Tools

**Symptoms**: "has not been loaded yet" or incorrect parameter names.

1. Restart Claude Desktop to clear the tool cache
2. Call `list_all_resources` first — this primes Claude with all available IP and correct parameter names
3. Check parameter names in [`api_reference.md`](api_reference.md)

---

### 5. Tenant Not Appearing / Access Denied After Login

**Symptoms**: User logs in successfully but sees no files, or gets redirected back to login.

1. Check the user exists in Cognito and is enabled
2. Confirm the user's `sub` or `cognito:username` maps to a folder in `/srv/mcp-context/`
3. If the folder is missing, it will be auto-created on the next file operation — but it will be empty
4. Check `docker compose logs api` for tenant resolution errors

---

### 6. Caddy TLS / Certificate Issues

**Symptoms**: Browser shows certificate error, HTTPS requests fail, or Caddy logs show repeated `no information found to solve challenge` ACME errors.

**Step 1 — Try a graceful reload first (near-zero downtime, ~2-3s):**
```bash
./start.sh restart-caddy
```
This restarts Caddy with its existing cert still in the volume. Good for most renewal hiccups.

**Step 2 — If ACME challenges keep failing for hours, force a fresh cert (⚠️ ~20-30s downtime):**
```bash
./start.sh renew-certs
```
This wipes the `caddy_data` volume and lets Caddy request a brand-new certificate from Let's Encrypt.

**Step 3 — Check port 80 is open in AWS Security Group:**  
Let's Encrypt needs to reach `http://mcp.infraai.com.au/.well-known/acme-challenge/...` to validate the domain. If port 80 is blocked, all ACME challenges will fail regardless.

```bash
curl -I http://mcp.infraai.com.au/.well-known/acme-challenge/test
# Should return 404, not a timeout
```

**Verify TLS is working after any fix:**
```bash
curl -I https://mcp.infraai.com.au/health
```

---

### 7. MCP Server Keeps Restarting

The `mcp-server` container has `restart: "no"` in `docker-compose.yml`. If it exits, it will not auto-restart.

1. Check exit reason: `docker compose logs mcp-server`
2. Common causes: missing env vars, Cognito misconfiguration, port conflict
3. After fixing, restart manually: `./start.sh restart`

---

## Contact & Support

For critical infrastructure failures, contact your system administrator.
