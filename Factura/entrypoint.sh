#!/bin/bash
set -e

# Configurar variables de entorno por defecto si no existen
export APP_NAME=${APP_NAME:-TikTrendyFacturador}
export APP_ENV=${APP_ENV:-production}
export APP_DEBUG=${APP_DEBUG:-false}
export APP_TIMEZONE=${APP_TIMEZONE:-America/Lima}
export APP_URL=${APP_URL:-http://localhost:8000}
export DB_CONNECTION=${DB_CONNECTION:-mysql}
export DB_HOST=${DB_HOST:-db}
export DB_PORT=${DB_PORT:-3306}
export DB_DATABASE=${DB_DATABASE:-tiktendry}
export DB_USERNAME=${DB_USERNAME:-tiktendry}
export DB_PASSWORD=${DB_PASSWORD:-tiktendry}
export LOG_LEVEL=${LOG_LEVEL:-error}
export SESSION_DRIVER=${SESSION_DRIVER:-database}
export CACHE_STORE=${CACHE_STORE:-database}
export QUEUE_CONNECTION=${QUEUE_CONNECTION:-database}

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << EOF
APP_NAME=${APP_NAME}
APP_ENV=${APP_ENV}
APP_KEY=
APP_DEBUG=${APP_DEBUG}
APP_TIMEZONE=${APP_TIMEZONE}
APP_URL=${APP_URL}

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=${LOG_LEVEL}

DB_CONNECTION=${DB_CONNECTION}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_SSLMODE=prefer

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=${QUEUE_CONNECTION}

SESSION_DRIVER=${SESSION_DRIVER}
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

CACHE_STORE=${CACHE_STORE}
CACHE_PREFIX=

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="\${APP_NAME}"

VITE_APP_NAME="\${APP_NAME}"
EOF
    echo "✅ Archivo .env creado correctamente."
    
    # Generar clave de aplicación si no existe
    if ! grep -q "APP_KEY=base64:" .env; then
        echo "🔑 Generando clave de aplicación..."
        php artisan key:generate --no-interaction --force
        echo "✅ Clave de aplicación generada."
    fi
fi

echo "Configuración de DB:"
echo "Host: $DB_HOST"
echo "Puerto: $DB_PORT"
echo "Base de datos: $DB_DATABASE"
echo "Usuario: $DB_USERNAME"

# Esperar a que la base de datos esté disponible
echo "Verificando conexión a la base de datos..."
until mysqladmin ping -h"$DB_HOST" -u"$DB_USERNAME" -p"$DB_PASSWORD" --silent --skip-ssl; do
    echo "Esperando conexión a la base de datos... (Host: $DB_HOST, Usuario: $DB_USERNAME)"
    sleep 5
done
echo "✅ Conexión a base de datos establecida."

# Ejecutar migraciones si es necesario
echo "🔄 Ejecutando migraciones..."
php artisan migrate --force || echo "⚠️ Migraciones fallaron o no necesarias"

# NOTA: No cacheamos la configuración para permitir lectura dinámica del .env
echo "⚡ Limpiando caches para lectura dinámica..."
php artisan config:clear || echo "Config cache ya estaba limpio"
php artisan route:clear || echo "Route cache ya estaba limpio"  
php artisan view:clear || echo "View cache ya estaba limpio"

# Asegurar permisos correctos
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

echo "🚀 Iniciando PHP-FPM..."
exec "$@"
