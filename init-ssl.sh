#!/bin/bash

# ============================================
# Script de inicialización SSL para ToroLocoCayma
# Obtiene certificados SSL de Let's Encrypt
# ============================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
DOMAIN="torolococayma.com"
SUBDOMAINS=("www" "app" "api" "factura")
EMAIL="admin@torolococayma.com"  # Cambia este email
STAGING=0  # Cambiar a 1 para usar servidor staging de Let's Encrypt (para pruebas)

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTBOT_CONF="$SCRIPT_DIR/docker/certbot/conf"
CERTBOT_WWW="$SCRIPT_DIR/docker/certbot/www"
NGINX_CONF="$SCRIPT_DIR/docker/nginx"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Inicialización SSL para ToroLocoCayma${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "$SCRIPT_DIR/docker-compose.yml" ]; then
    echo -e "${RED}Error: No se encontró docker-compose.yml${NC}"
    echo "Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# Crear directorios necesarios
echo -e "${YELLOW}[1/6] Creando directorios...${NC}"
mkdir -p "$CERTBOT_CONF"
mkdir -p "$CERTBOT_WWW"

# Verificar si ya existen certificados
if [ -d "$CERTBOT_CONF/live/$DOMAIN" ]; then
    echo -e "${GREEN}Ya existen certificados para $DOMAIN${NC}"
    read -p "¿Deseas renovar/reemplazar los certificados? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Operación cancelada"
        exit 0
    fi
fi

# Copiar configuración HTTP temporal
echo -e "${YELLOW}[2/6] Configurando nginx en modo HTTP...${NC}"
cp "$NGINX_CONF/nginx-init.conf" "$NGINX_CONF/nginx.conf"

# Detener y reiniciar servicios
echo -e "${YELLOW}[3/6] Reiniciando servicios...${NC}"
docker compose down nginx-gateway 2>/dev/null || true
docker compose up -d

# Esperar a que nginx esté listo
echo -e "${YELLOW}[4/6] Esperando a que los servicios estén listos...${NC}"
sleep 10

# Verificar que nginx responde
echo "Verificando conectividad..."
for i in {1..30}; do
    if curl -s --fail http://localhost/health > /dev/null 2>&1 || curl -s --fail http://localhost > /dev/null 2>&1; then
        echo -e "${GREEN}Nginx está respondiendo${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Timeout esperando a nginx${NC}"
        echo "Revisa los logs: docker compose logs nginx-gateway"
        exit 1
    fi
    echo "Esperando... ($i/30)"
    sleep 2
done

# Configurar staging si es necesario
if [ $STAGING -eq 1 ]; then
    STAGING_ARG="--staging"
    echo -e "${YELLOW}MODO STAGING ACTIVADO (certificados de prueba)${NC}"
else
    STAGING_ARG=""
fi

# Obtener certificados
echo -e "${YELLOW}[5/6] Obteniendo certificados SSL...${NC}"
echo ""

# Lista de dominios para el certificado principal
CERT_DOMAINS="-d $DOMAIN -d www.$DOMAIN"

# Obtener certificado para dominio principal
echo -e "${BLUE}Obteniendo certificado para: $DOMAIN, www.$DOMAIN${NC}"
docker run --rm \
    -v "$CERTBOT_CONF:/etc/letsencrypt" \
    -v "$CERTBOT_WWW:/var/www/certbot" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    $STAGING_ARG \
    $CERT_DOMAINS \
    --force-renewal

# Obtener certificados para subdominios
for subdomain in "app" "api" "factura"; do
    echo ""
    echo -e "${BLUE}Obteniendo certificado para: $subdomain.$DOMAIN${NC}"
    docker run --rm \
        -v "$CERTBOT_CONF:/etc/letsencrypt" \
        -v "$CERTBOT_WWW:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        $STAGING_ARG \
        -d "$subdomain.$DOMAIN" \
        --force-renewal
done

# Restaurar configuración SSL completa
echo ""
echo -e "${YELLOW}[6/6] Activando configuración SSL...${NC}"

# Crear enlace simbólico para el certificado del default server
if [ ! -L "$CERTBOT_CONF/live/torolococayma.com" ]; then
    echo "Certificados obtenidos correctamente"
fi

# Restaurar nginx.conf con SSL
cat > "$NGINX_CONF/nginx.conf" << 'NGINX_CONF_EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Upstream backends
    upstream backend_api {
        least_conn;
        server backend:3000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream frontend_app {
        least_conn;
        server frontend:80 max_fails=3 fail_timeout=30s;
    }

    upstream landing_app {
        least_conn;
        server landing:3000 max_fails=3 fail_timeout=30s;
    }

    upstream factura_app {
        least_conn;
        server factura-nginx:80 max_fails=3 fail_timeout=30s;
    }

    # ============================================
    # LANDING PAGE - torolococayma.com / www.torolococayma.com
    # ============================================

    server {
        listen 80;
        server_name torolococayma.com www.torolococayma.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    server {
        listen 443 ssl http2;
        server_name torolococayma.com www.torolococayma.com;

        ssl_certificate /etc/nginx/ssl/live/torolococayma.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/torolococayma.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_stapling on;
        ssl_stapling_verify on;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            proxy_pass http://landing_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    # ============================================
    # APP (Frontend ERP) - app.torolococayma.com
    # ============================================

    server {
        listen 80;
        server_name app.torolococayma.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    server {
        listen 443 ssl http2;
        server_name app.torolococayma.com;

        ssl_certificate /etc/nginx/ssl/live/app.torolococayma.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/app.torolococayma.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_stapling on;
        ssl_stapling_verify on;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            proxy_pass http://frontend_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # ============================================
    # API (Backend) - api.torolococayma.com
    # ============================================

    server {
        listen 80;
        server_name api.torolococayma.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    server {
        listen 443 ssl http2;
        server_name api.torolococayma.com;

        ssl_certificate /etc/nginx/ssl/live/api.torolococayma.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/api.torolococayma.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_stapling on;
        ssl_stapling_verify on;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # CORS headers para API
        add_header 'Access-Control-Allow-Origin' 'https://app.torolococayma.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        location / {
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' 'https://app.torolococayma.com' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
            }

            proxy_pass http://backend_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        location /uploads/ {
            proxy_pass http://backend_api/uploads/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_cache_valid 200 1h;
        }
    }

    # ============================================
    # FACTURA - factura.torolococayma.com
    # ============================================

    server {
        listen 80;
        server_name factura.torolococayma.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    server {
        listen 443 ssl http2;
        server_name factura.torolococayma.com;

        ssl_certificate /etc/nginx/ssl/live/factura.torolococayma.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/factura.torolococayma.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_stapling on;
        ssl_stapling_verify on;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            proxy_pass http://factura_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # ============================================
    # Default server - reject unknown hosts
    # ============================================
    server {
        listen 80 default_server;
        listen 443 ssl http2 default_server;
        server_name _;

        ssl_certificate /etc/nginx/ssl/live/torolococayma.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/torolococayma.com/privkey.pem;

        return 444;
    }
}
NGINX_CONF_EOF

# Reiniciar nginx con nueva configuración
echo "Reiniciando nginx con SSL..."
docker compose restart nginx-gateway

# Esperar y verificar
sleep 5

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  SSL CONFIGURADO EXITOSAMENTE${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Dominios configurados:"
echo -e "  ${BLUE}https://torolococayma.com${NC} - Landing Page"
echo -e "  ${BLUE}https://www.torolococayma.com${NC} - Landing Page"
echo -e "  ${BLUE}https://app.torolococayma.com${NC} - Frontend ERP"
echo -e "  ${BLUE}https://api.torolococayma.com${NC} - Backend API"
echo -e "  ${BLUE}https://factura.torolococayma.com${NC} - Sistema de Facturación"
echo ""
echo -e "${YELLOW}IMPORTANTE: Actualiza las URLs en tu aplicación:${NC}"
echo "  - Frontend: VITE_API_URL=https://api.torolococayma.com"
echo "  - Factura: APP_URL=https://factura.torolococayma.com"
echo ""
echo -e "${YELLOW}La renovación automática está configurada.${NC}"
echo "Los certificados se renuevan automáticamente cada 12 horas si es necesario."
echo ""
