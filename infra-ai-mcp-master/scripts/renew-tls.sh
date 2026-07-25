#!/bin/sh
set -e

# ==============================
# RENEW TLS CERTIFICATES
# ==============================
# This script is meant to be run via a cron job on the host machine.
# Example crontab entry (runs every day at 3 AM):
# 0 3 * * * /path/to/MCP-SERVER/scripts/renew-tls.sh >> /var/log/renew-tls.log 2>&1

cd "$(dirname "$0")/.." || exit 1

echo "[$(date)] Starting certificate renewal..."

# Run the certbot renewal command inside a temporary certbot container
# It uses the saved renewal config from /etc/letsencrypt/renewal/
docker run --rm --name infraai-certbot-renew \
  -v "$(pwd)/certs:/etc/letsencrypt" \
  -v "$(pwd)/certbot-webroot:/var/www/certbot" \
  certbot/certbot renew --quiet

echo "[$(date)] Reloading Nginx to apply any updated certificates..."
docker restart infraai-nginx

echo "[$(date)] Renewal check complete."
