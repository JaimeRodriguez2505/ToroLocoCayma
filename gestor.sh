#!/bin/bash

# Script interactivo para gestionar TIKTENDRY con Docker Compose
# Autor: Equipo TIKTENDRY

set -e

show_menu() {
  echo "==============================="
  echo "  GESTOR DE TIKTENDRY"
  echo "==============================="
  echo "1. Construir aplicación (build)"
  echo "2. Levantar aplicación (up)"
  echo "3. Reconstruir aplicación (build + up)"
  echo "4. Reiniciar un servicio"
  echo "5. Ver logs de un servicio"
  echo "6. Ver volúmenes de Docker"
  echo "7. Parar todos los servicios (down)"
  echo "8. Salir"
  echo "==============================="
}

build_app() {
  echo "Construyendo todos los servicios..."
  docker-compose build
}

up_app() {
  echo "Levantando todos los servicios..."
  docker-compose up -d
}

rebuild_app() {
  echo "Reconstruyendo y levantando todos los servicios..."
  docker-compose build
  docker-compose up -d
}

restart_service() {
  echo "\n¿Qué servicio quieres reiniciar?"
  echo "1. backend"
  echo "2. frontend"
  echo "3. factura-php"
  echo "4. factura-nginx"
  echo "5. db (base de datos)"
  echo "6. Cancelar"
  read -p "Selecciona una opción [1-6]: " svc_opt
  case $svc_opt in
    1) docker-compose restart backend ;;
    2) docker-compose restart frontend ;;
    3) docker-compose restart factura-php ;;
    4) docker-compose restart factura-nginx ;;
    5) docker-compose restart db ;;
    6) echo "Operación cancelada." ;;
    *) echo "Opción inválida." ;;
  esac
}

logs_service() {
  echo "\n¿De qué servicio quieres ver los logs?"
  echo "1. backend"
  echo "2. frontend"
  echo "3. factura-php"
  echo "4. factura-nginx"
  echo "5. db (base de datos)"
  echo "6. Cancelar"
  read -p "Selecciona una opción [1-6]: " svc_opt
  case $svc_opt in
    1) docker-compose logs -f backend ;;
    2) docker-compose logs -f frontend ;;
    3) docker-compose logs -f factura-php ;;
    4) docker-compose logs -f factura-nginx ;;
    5) docker-compose logs -f db ;;
    6) echo "Operación cancelada." ;;
    *) echo "Opción inválida." ;;
  esac
}

show_volumes() {
  echo "Volúmenes de Docker usados en este proyecto:"
  docker volume ls | grep tiktendry || echo "(No hay volúmenes con 'tiktendry' en el nombre)"
  echo "Volúmenes referenciados en docker-compose.yml:"
  docker-compose config --volumes
  read -p $'Presiona Enter para continuar...' _
}


down_app() {
  echo "Parando todos los servicios..."
  docker-compose down
}

while true; do
  show_menu
  read -p "Selecciona una opción [1-9]: " opt
  case $opt in
    1) build_app ;;
    2) up_app ;;
    3) rebuild_app ;;
    4) restart_service ;;
    5) logs_service ;;
    6) show_volumes ;;
    7) down_app ;;
    8) echo "¡Hasta luego!"; exit 0 ;;
    *) echo "Opción inválida." ;;
  esac
done
