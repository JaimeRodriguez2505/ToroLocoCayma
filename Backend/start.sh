#!/bin/sh
set -e

# Esperar a que MySQL esté listo
until nc -z ${DB_HOST:-db-erp} 3306; do
  echo "Esperando a que la base de datos MySQL esté disponible..."
  sleep 2
 done

# Iniciar la app
node src/index.js
