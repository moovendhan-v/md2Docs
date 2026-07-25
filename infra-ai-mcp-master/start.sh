#!/bin/bash

# InfraAI Startup Script
# Usage: ./start.sh <mode> [options]
#
# Modes:
#   deploy          Pull latest code + rebuild images + start  (production deploy)
#   restart         Restart all containers without rebuilding   (config/env changes)
#   dev             Build + start + launch MCP Inspector        (local development)
#   clean           Prompt then teardown all containers + volumes + rebuild
#   restart-caddy   Graceful Caddy reload — near-zero downtime (~2-3s)
#   renew-certs     Wipe Caddy TLS state + fresh Let's Encrypt cert (⚠️ ~20-30s downtime)
#   logs            Tail logs for all services
#   status          Show container status
#
# Options (combine with any mode):
#   --no-cache      Skip Docker layer cache (use with deploy or dev)
#   --inspect       Launch MCP Inspector after startup (use with deploy or restart)
#
# Examples:
#   ./start.sh deploy
#   ./start.sh deploy --no-cache
#   ./start.sh dev
#   ./start.sh restart
#   ./start.sh restart-caddy
#   ./start.sh renew-certs
#   ./start.sh logs
#   ./start.sh status
#   ./start.sh clean

set -e

MODE="${1:-}"
NO_CACHE_FLAG=""
DO_INSPECT=false

# ── Parse extra options ────────────────────────────────────────────────────────
for arg in "${@:2}"; do
    case $arg in
        --no-cache) NO_CACHE_FLAG="--no-cache" ;;
        --inspect)  DO_INSPECT=true ;;
        --*)        echo "⚠️  Unknown option: $arg"; exit 1 ;;
    esac
done

# ── Help function ─────────────────────────────────────────────────────────────
show_help() {
    echo ""
    echo "  InfraAI · start.sh"
    echo ""
    echo "  Usage: ./start.sh <mode> [options]"
    echo ""
    echo "  ┌─────────────────┬──────────────────────────────────────────────────┬──────────────┐"
    echo "  │ Mode            │ What it does                                     │ Downtime     │"
    echo "  ├─────────────────┼──────────────────────────────────────────────────┼──────────────┤"
    echo "  │ deploy          │ Pull latest + rebuild images + start             │ ~5s          │"
    echo "  │ restart         │ Restart containers without rebuilding            │ ~3s          │"
    echo "  │ dev             │ Build + start + launch MCP Inspector             │ local only   │"
    echo "  │ clean           │ Tear down volumes + rebuild  ⚠️  destructive      │ full restart │"
    echo "  │ restart-caddy   │ Graceful Caddy reload                            │ ~2-3s        │"
    echo "  │ renew-certs     │ Wipe TLS state + fresh Let's Encrypt cert        │ ~20-30s ⚠️   │"
    echo "  │ logs            │ Tail logs for all services (Ctrl+C to exit)      │ —            │"
    echo "  │ status          │ Show container status                            │ —            │"
    echo "  │ help            │ Show this help message                           │ —            │"
    echo "  └─────────────────┴──────────────────────────────────────────────────┴──────────────┘"
    echo ""
    echo "  Options (combine with any mode):"
    echo "    --no-cache    Skip Docker layer cache        (use with deploy or dev)"
    echo "    --inspect     Launch MCP Inspector after startup"
    echo ""
    echo "  Examples:"
    echo "    ./start.sh deploy                  # standard production deploy"
    echo "    ./start.sh deploy --no-cache       # deploy, skip layer cache"
    echo "    ./start.sh restart --inspect       # restart + open inspector"
    echo "    ./start.sh dev                     # local dev with inspector"
    echo "    ./start.sh restart-caddy           # fix TLS renewal hiccups"
    echo "    ./start.sh renew-certs             # force fresh TLS cert"
    echo "    ./start.sh logs                    # stream all service logs"
    echo "    ./start.sh status                  # check container health"
    echo ""
}

# ── Show help if no mode given or help requested ───────────────────────────────
if [[ -z "$MODE" || "$MODE" == "help" || "$MODE" == "--help" || "$MODE" == "-h" ]]; then
    show_help
    exit 0
fi

# ══════════════════════════════════════════════════════════════════════════════
# MODE: deploy — pull + build + start
# ══════════════════════════════════════════════════════════════════════════════
if [[ "$MODE" == "deploy" ]]; then
    echo "📦 Stashing local changes and pulling latest..."
    git stash
    git pull origin "$(git rev-parse --abbrev-ref HEAD)"
    echo "✅ On commit: $(git log -1 --oneline)"

    echo "🔨 Building images... $NO_CACHE_FLAG"
    docker compose build $NO_CACHE_FLAG

    echo "🚀 Starting services..."
    docker compose up -d

    sleep 5
    docker compose ps

    echo "------------------------------------------------"
    echo "✅ Deployed!"
    echo "------------------------------------------------"
    docker compose logs --tail=20

# ══════════════════════════════════════════════════════════════════════════════
# MODE: restart — restart containers without rebuilding
# ══════════════════════════════════════════════════════════════════════════════
elif [[ "$MODE" == "restart" ]]; then
    echo "🔄 Restarting all services (no rebuild)..."
    docker compose up -d

    sleep 5
    docker compose ps

    echo "------------------------------------------------"
    echo "✅ Services restarted!"
    echo "   App:    https://mcp.infraai.com.au"
    echo "   Health: https://mcp.infraai.com.au/health"
    echo "------------------------------------------------"
    docker compose logs --tail=20

# ══════════════════════════════════════════════════════════════════════════════
# MODE: dev — build + start + MCP Inspector
# ══════════════════════════════════════════════════════════════════════════════
elif [[ "$MODE" == "dev" ]]; then
    echo "🛠️  Dev mode: building and starting services..."
    docker compose build $NO_CACHE_FLAG
    docker compose up -d

    sleep 5
    docker compose ps
    echo "✅ Services running locally."
    docker compose logs --tail=10

    echo "🔍 Launching MCP Inspector..."
    DANGEROUSLY_OMIT_AUTH=true npx @modelcontextprotocol/inspector \
        --transport streamable-http \
        --server-url http://localhost/mcp

# ══════════════════════════════════════════════════════════════════════════════
# MODE: clean — teardown + rebuild (destructive)
# ══════════════════════════════════════════════════════════════════════════════
elif [[ "$MODE" == "clean" ]]; then
    echo "⚠️  CLEAN MODE: This will permanently destroy all Docker volumes."
    echo "   This includes tenant data in the mcp_data volume."
    echo ""
    read -r -p "   Type YES to confirm: " confirm
    if [[ "$confirm" != "YES" ]]; then
        echo "Aborted."
        exit 0
    fi

    echo "🗑️  Tearing down containers and volumes..."
    docker compose down -v

    echo "🔨 Rebuilding images... $NO_CACHE_FLAG"
    docker compose build $NO_CACHE_FLAG

    echo "🚀 Starting fresh..."
    docker compose up -d

    sleep 5
    docker compose ps
    echo "✅ Clean deploy complete."

# ══════════════════════════════════════════════════════════════════════════════
# MODE: restart-caddy — graceful Caddy reload (near-zero downtime)
# ══════════════════════════════════════════════════════════════════════════════
elif [[ "$MODE" == "restart-caddy" ]]; then
    echo "🔄 Gracefully reloading Caddy (~2-3s downtime)..."
    docker compose restart caddy
    sleep 3
    echo "📋 Caddy logs (last 20 lines):"
    docker compose logs --tail=20 caddy
    echo ""
    echo "✅ Caddy restarted. Verify: curl -I https://mcp.infraai.com.au/health"

# ══════════════════════════════════════════════════════════════════════════════
# MODE: renew-certs — wipe TLS state + fresh cert (⚠️ downtime)
# ══════════════════════════════════════════════════════════════════════════════
elif [[ "$MODE" == "renew-certs" ]]; then
    echo "🔐 Renewing TLS certificates..."
    echo "   ⚠️  This will cause ~20-30s of HTTPS downtime."
    echo "   Stopping Caddy..."
    docker compose stop caddy

    echo "   Wiping Caddy TLS state (caddy_data volume)..."
    docker volume rm -f mcp-server_caddy_data 2>/dev/null || true
    docker volume rm -f infra-ai_caddy_data    2>/dev/null || true

    echo "   Restarting Caddy (requesting fresh cert from Let's Encrypt)..."
    docker compose up -d caddy

    echo "📋 Caddy logs (last 30 lines):"
    docker compose logs --tail=30 caddy
    echo ""
    echo "✅ TLS renewal triggered. Verify: curl -I https://mcp.infraai.com.au/health"

# ══════════════════════════════════════════════════════════════════════════════
# MODE: logs — tail all service logs
# ══════════════════════════════════════════════════════════════════════════════
elif [[ "$MODE" == "logs" ]]; then
    docker compose logs -f

# ══════════════════════════════════════════════════════════════════════════════
# MODE: status — show container status
# ══════════════════════════════════════════════════════════════════════════════
elif [[ "$MODE" == "status" ]]; then
    docker compose ps

else
    echo ""
    echo "  ❌ Unknown mode: '$MODE'"
    show_help
    exit 1
fi

# ── MCP Inspector (optional extra flag) ───────────────────────────────────────
if [[ "$DO_INSPECT" == true && "$MODE" != "dev" ]]; then
    echo "🔍 Launching MCP Inspector..."
    DANGEROUSLY_OMIT_AUTH=true npx @modelcontextprotocol/inspector \
        --transport streamable-http \
        --server-url http://localhost/mcp
fi
