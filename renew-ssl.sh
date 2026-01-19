#!/bin/bash

# ============================================
# Script de renovación manual de certificados SSL
# Ejecutar si necesitas renovar manualmente
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTBOT_CONF="$SCRIPT_DIR/docker/certbot/conf"
CERTBOT_WWW="$SCRIPT_DIR/docker/certbot/www"

echo "Renovando certificados SSL..."

docker run --rm \
    -v "$CERTBOT_CONF:/etc/letsencrypt" \
    -v "$CERTBOT_WWW:/var/www/certbot" \
    certbot/certbot renew

echo "Recargando nginx..."
docker compose exec nginx-gateway nginx -s reload

echo "Certificados renovados exitosamente"
