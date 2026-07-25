#!/bin/sh
set -e

# ==============================
# CONFIG
# ==============================
# Space-separated list of domains
# DOMAINS="mcp.infraconsulting.com.au api.infraconsulting.com.au"
DOMAINS="mcp.infraconsulting.com.au api.infraconsulting.com.au"
EMAIL="moovendhan.v@meyicloud.com"
WEBROOT="/var/www/certbot"

echo "Waiting for Nginx to boot up..."
sleep 5

# Build domain arguments for Certbot
DOMAIN_ARGS=""
for DOMAIN in $DOMAINS; do
  DOMAIN_ARGS="$DOMAIN_ARGS -d $DOMAIN"
  
  echo "Removing dummy certificates for $DOMAIN..."
  rm -rf "/etc/letsencrypt/live/$DOMAIN" \
         "/etc/letsencrypt/archive/$DOMAIN" \
         "/etc/letsencrypt/renewal/$DOMAIN.conf"
done

echo "Requesting real certificates for: $DOMAINS"
# Run certbot (we disable word splitting warnings by intentionally not quoting DOMAIN_ARGS)
certbot certonly --webroot \
  --webroot-path="$WEBROOT" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  $DOMAIN_ARGS \
  --non-interactive

echo "================================================================"
echo "✅ Certificates obtained successfully!"
echo "👉 You MUST now reload Nginx by running: docker restart infraai-nginx"
echo "================================================================"
