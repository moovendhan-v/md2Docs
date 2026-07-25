#!/bin/bash
set -e

# ==============================
# INFRAAI TLS BOOTSTRAP SCRIPT
# ==============================
# Run this script on the host machine to request certificates 
# and automatically set up the auto-renewal cron job.

echo "👉 Requesting Let's Encrypt certificates via Docker Compose..."
docker compose --profile tls up certbot

echo "👉 Setting up auto-renewal cron job..."
SCRIPT_PATH="$(pwd)/scripts/renew-tls.sh"
LOG_PATH="$(pwd)/certs/renew-tls.log"

# Add cron job if it doesn't already exist
(crontab -l 2>/dev/null | grep -v "renew-tls.sh"; echo "0 3 * * * $SCRIPT_PATH >> $LOG_PATH 2>&1") | crontab -

echo "✅ Setup complete!"
echo "👉 Auto-renew is enabled ✔ (runs daily at 3 AM)"