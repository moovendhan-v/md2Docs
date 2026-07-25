#!/bin/sh
set -e

# Start Caddy in background
caddy run --config /etc/caddy/Caddyfile &
CADDY_PID=$!

# Wait 3 seconds for cert cache to load
sleep 3

# Reload to ensure cert is active
caddy reload --config /etc/caddy/Caddyfile

# Bring Caddy back to foreground
wait $CADDY_PID
