#!/bin/sh
set -e

DOMAIN="mcp.infraconsulting.com.au"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

if [ ! -f "$CERT_PATH/fullchain.pem" ]; then
    echo "Dummy certificate not found for $DOMAIN. Generating a self-signed one so Nginx can start..."
    apk add --no-cache openssl
    mkdir -p "$CERT_PATH"
    openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
        -keyout "$CERT_PATH/privkey.pem" \
        -out "$CERT_PATH/fullchain.pem" \
        -subj "/CN=localhost"
    echo "Self-signed certificate generated successfully."
else
    echo "Certificate already exists for $DOMAIN."
fi
