# InfraAI — Server Deployment & Git Pull Guide

This covers how to SSH into the EC2 server, pull the latest code from Git, and redeploy the stack.

---

## Prerequisites

- SSH access to the EC2 instance (`ap-southeast-4`, Melbourne)
- Your SSH private key (`.pem` file) for the instance
- Git remote already configured on the server (done during initial setup)

---

## 1. SSH into the Server

```bash
ssh -i /path/to/your-key.pem ubuntu@{SERVER_IP}
```

If you've added the key to your SSH agent or `~/.ssh/config`, you can just use:

```bash
ssh ubuntu@{SERVER_IP}
```

To set up a shortcut in `~/.ssh/config`:

```
Host infraai
    HostName {SERVER_IP}
    User ubuntu
    IdentityFile ~/.ssh/your-key.pem
```

Then connect with just:

```bash
ssh infraai
```

---

## 2. Navigate to the Project

The project lives at `~/mcp-server` on the EC2 instance:

```bash
cd ~/mcp-server
```

---

## 3. Pull Latest Code

The easiest way is to use the `deploy` mode, which stashes any local changes, pulls, builds, and restarts in one step:

```bash
./start.sh deploy
```

If you need to pull manually:

```bash
git pull origin main
```

If there are local conflicts on the server (shouldn't happen — never edit files directly on the server):

```bash
git fetch origin
git reset --hard origin/main
```

> This discards all local changes. Only use it if you're certain nothing was edited directly on the server.

---

## 4. Rebuild and Redeploy

After pulling, rebuild and restart the affected containers.

### Full production deploy (pull + build + start):

```bash
./start.sh deploy
```

### Deploy without Docker layer cache (use if a dependency changed):

```bash
./start.sh deploy --no-cache
```

### Restart without rebuilding (use for config-only changes like `.env` or `Caddyfile`):

```bash
./start.sh restart
```

### Rebuild a single service:

```bash
docker compose up -d --build api
docker compose up -d --build mcp-server
docker compose up -d --build frontend
```

---

## 5. TLS Certificate Management

Caddy auto-renews TLS certificates via Let's Encrypt. You normally don't need to do anything. Use these commands only when ACME errors appear in `docker compose logs caddy`.

| Situation | Command | Downtime |
|---|---|---|
| Renewal stuck, cert still valid | `./start.sh --restart-caddy` | ~2-3s ✅ |
| ACME challenges failing for hours, cert expired | `./start.sh --renew-certs` | ~20-30s ⚠️ |

### Graceful reload (try this first)
```bash
./start.sh restart-caddy
```
Restarts Caddy keeping the existing cert in the volume. Near-zero downtime.

### Force fresh certificate (nuclear option)
```bash
./start.sh renew-certs
```
Wipes the `caddy_data` volume and requests a brand-new cert from Let's Encrypt.  
⚠️ Causes ~20-30s of HTTPS downtime. Requires port 80 to be open in the EC2 Security Group.

### Verify TLS after any fix
```bash
curl -I https://mcp.infraai.com.au/health
```

---

## 6. Verify the Deployment

Check all containers are running:

```bash
docker compose ps
```

Expected output — all services should show `Up`:

```
NAME                 STATUS
infraai-caddy        Up
infraai-api          Up
infraai-frontend     Up
infraai-mcp          Up (or Exited — see note below)
```

> `infraai-mcp` has `restart: "no"` in `docker-compose.yml`. If it exits after startup (e.g. due to a config error), it won't auto-restart. Check logs if it's not running.

Tail logs to confirm clean startup:

```bash
docker compose logs --tail=30 mcp-server
docker compose logs --tail=30 api
docker compose logs --tail=30 caddy
```

Smoke test the live endpoints:

```bash
# Health check
curl https://mcp.infraai.com.au/health

# API health
curl https://mcp.infraai.com.au/api/health-check
```

---

## 7. Full Redeploy from Scratch

WARNING: Only needed if volumes are corrupted or you want a clean slate. **This will delete all tenant data in the `mcp_data` volume.**

```bash
./start.sh clean
```

WARNING: Or manually:

```bash
docker compose down -v
docker compose up -d --build
```

---

## 8. Rollback

To roll back to a previous commit:

```bash
git log --oneline -10          # find the commit hash you want
git checkout {commit-hash}     # detach HEAD to that commit
./start.sh --build             # rebuild from that state
```

To get back to the latest:

```bash
git checkout main
git pull origin main
./start.sh --build
```

---

## Common Issues

**`git pull` asks for a password**  
The server should use an SSH deploy key or HTTPS with a stored credential. If it's prompting, check:
```bash
git remote -v   # confirm the remote URL
cat ~/.ssh/config
```

**Permission denied on `start.sh`**  
```bash
chmod +x start.sh
```

**Docker permission denied**  
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Port 80/443 already in use**  
```bash
sudo lsof -i :80
sudo lsof -i :443
docker compose down
docker compose up -d
```
