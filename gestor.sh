#!/bin/bash

# =============================================================================
# TikTrendry - Script de Gestión de Docker
# =============================================================================
# Este script facilita la gestión de los contenedores Docker para desarrollo
# y producción.
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función para mostrar el menú
show_menu() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         TikTrendry - Gestor de Contenedores Docker         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "SERVICIOS:"
    echo "  1)  Iniciar todos los servicios"
    echo "  2)  Detener todos los servicios"
    echo "  3)  Reiniciar todos los servicios"
    echo "  4)  Ver estado de los servicios"
    echo ""
    echo "CONSTRUCCIÓN:"
    echo "  5)  Construir todas las imágenes"
    echo "  6)  Reconstruir sin caché"
    echo ""
    echo "LOGS:"
    echo "  7)  Ver logs de todos los servicios"
    echo "  8)  Ver logs del Backend"
    echo "  9)  Ver logs de Frontend"
    echo "  10) Ver logs de Factura"
    echo "  11) Ver logs de Base de Datos ERP"
    echo "  12) Ver logs de Base de Datos Factura"
    echo ""
    echo "BASE DE DATOS:"
    echo "  13) Conectar a MySQL ERP"
    echo "  14) Conectar a MySQL Factura"
    echo "  15) Backup de Base de Datos ERP"
    echo "  16) Backup de Base de Datos Factura"
    echo "  17) Backup completo (todas las BDs)"
    echo ""
    echo "MANTENIMIENTO:"
    echo "  18) Ver uso de recursos"
    echo "  19) Limpiar contenedores detenidos"
    echo "  20) Limpiar imágenes no usadas"
    echo "  21) Limpiar todo (⚠️  incluye volúmenes)"
    echo ""
    echo "MIGRACIONES:"
    echo "  22) Ejecutar migraciones de Factura (Laravel)"
    echo ""
    echo "  0)  Salir"
    echo ""
    echo -n "Selecciona una opción: "
}

# Verificar que Docker esté corriendo
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker no está corriendo. Por favor inicia Docker primero."
        exit 1
    fi
}

# Función para pausar
pause() {
    echo ""
    read -p "Presiona Enter para continuar..."
}

# Funciones principales
start_services() {
    print_info "Iniciando todos los servicios..."
    docker-compose up -d
    print_success "Servicios iniciados correctamente"
    echo ""
    docker-compose ps
}

stop_services() {
    print_info "Deteniendo todos los servicios..."
    docker-compose down
    print_success "Servicios detenidos correctamente"
}

restart_services() {
    print_info "Reiniciando todos los servicios..."
    docker-compose restart
    print_success "Servicios reiniciados correctamente"
    echo ""
    docker-compose ps
}

status_services() {
    print_info "Estado de los servicios:"
    echo ""
    docker-compose ps
}

build_images() {
    print_info "Construyendo todas las imágenes..."
    docker-compose build
    print_success "Imágenes construidas correctamente"
}

rebuild_no_cache() {
    print_info "Reconstruyendo todas las imágenes sin caché..."
    docker-compose build --no-cache
    print_success "Imágenes reconstruidas correctamente"
}

view_logs() {
    print_info "Mostrando logs de todos los servicios (Ctrl+C para salir)..."
    docker-compose logs -f --tail=100
}

view_backend_logs() {
    print_info "Mostrando logs del Backend (Ctrl+C para salir)..."
    docker-compose logs -f --tail=100 backend
}

view_frontend_logs() {
    print_info "Mostrando logs del Frontend (Ctrl+C para salir)..."
    docker-compose logs -f --tail=100 frontend
}

view_factura_logs() {
    print_info "Mostrando logs de Factura (Ctrl+C para salir)..."
    docker-compose logs -f --tail=100 factura-php factura-nginx
}

view_db_erp_logs() {
    print_info "Mostrando logs de la Base de Datos ERP (Ctrl+C para salir)..."
    docker-compose logs -f --tail=100 db-erp
}

view_db_factura_logs() {
    print_info "Mostrando logs de la Base de Datos Factura (Ctrl+C para salir)..."
    docker-compose logs -f --tail=100 db-factura
}

connect_mysql_erp() {
    print_info "Conectando a MySQL ERP..."
    docker exec -it toroloco-db-erp mysql -uroot -p
}

connect_mysql_factura() {
    print_info "Conectando a MySQL Factura..."
    docker exec -it toroloco-db-factura mysql -uroot -p
}

backup_db_erp() {
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup-erp-$(date +%Y%m%d-%H%M%S).sql"

    print_info "Creando backup de la base de datos ERP..."

    # Obtener password del .env
    if [ -f .env ]; then
        source .env
    fi

    docker exec toroloco-db-erp mysqldump \
        -uroot -p${DB_ROOT_PASSWORD:-root} \
        toroloco_erp > "$BACKUP_FILE"

    print_success "Backup creado: $BACKUP_FILE"

    # Comprimir
    gzip "$BACKUP_FILE"
    print_success "Backup comprimido: ${BACKUP_FILE}.gz"
}

backup_db_factura() {
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup-factura-$(date +%Y%m%d-%H%M%S).sql"

    print_info "Creando backup de la base de datos Factura..."

    # Obtener password del .env
    if [ -f .env ]; then
        source .env
    fi

    docker exec toroloco-db-factura mysqldump \
        -uroot -p${DB_ROOT_PASSWORD:-root} \
        toroloco_factura > "$BACKUP_FILE"

    print_success "Backup creado: $BACKUP_FILE"

    # Comprimir
    gzip "$BACKUP_FILE"
    print_success "Backup comprimido: ${BACKUP_FILE}.gz"
}

backup_all_dbs() {
    print_info "Creando backup de todas las bases de datos..."
    backup_db_erp
    backup_db_factura

    # Backup de archivos
    BACKUP_DIR="./backups"
    UPLOADS_BACKUP="$BACKUP_DIR/uploads-$(date +%Y%m%d-%H%M%S).tar.gz"
    print_info "Creando backup de archivos uploads..."
    tar -czf "$UPLOADS_BACKUP" Backend/src/uploads/
    print_success "Backup de uploads creado: $UPLOADS_BACKUP"
}

view_resources() {
    print_info "Uso de recursos de los contenedores:"
    echo ""
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

clean_stopped() {
    print_warning "Eliminando contenedores detenidos..."
    docker container prune -f
    print_success "Contenedores detenidos eliminados"
}

clean_images() {
    print_warning "Eliminando imágenes no usadas..."
    docker image prune -a -f
    print_success "Imágenes no usadas eliminadas"
}

clean_all() {
    print_warning "⚠️  ADVERTENCIA: Esto eliminará contenedores, imágenes, volúmenes y redes no usadas."
    read -p "¿Estás seguro? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        docker system prune -a --volumes -f
        print_success "Sistema limpiado completamente"
    else
        print_info "Operación cancelada"
    fi
}

run_factura_migrations() {
    print_info "Ejecutando migraciones de Factura (Laravel)..."
    docker exec -it toroloco-factura-php php artisan migrate
    print_success "Migraciones ejecutadas correctamente"
}

# Verificar Docker
check_docker

# Loop principal
while true; do
    show_menu
    read option

    case $option in
        1) start_services; pause ;;
        2) stop_services; pause ;;
        3) restart_services; pause ;;
        4) status_services; pause ;;
        5) build_images; pause ;;
        6) rebuild_no_cache; pause ;;
        7) view_logs ;;
        8) view_backend_logs ;;
        9) view_frontend_logs ;;
        10) view_factura_logs ;;
        11) view_db_erp_logs ;;
        12) view_db_factura_logs ;;
        13) connect_mysql_erp ;;
        14) connect_mysql_factura ;;
        15) backup_db_erp; pause ;;
        16) backup_db_factura; pause ;;
        17) backup_all_dbs; pause ;;
        18) view_resources; pause ;;
        19) clean_stopped; pause ;;
        20) clean_images; pause ;;
        21) clean_all; pause ;;
        22) run_factura_migrations; pause ;;
        0)
            print_info "¡Hasta luego!"
            exit 0
            ;;
        *)
            print_error "Opción inválida"
            pause
            ;;
    esac
done
