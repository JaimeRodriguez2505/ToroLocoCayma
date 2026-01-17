#!/bin/bash

# =============================================================================
# TikTrendry - Quick Start Script
# =============================================================================
# Este script facilita el primer inicio de la aplicación
# =============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║            🚀 TikTrendry - Quick Start Setup 🚀            ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Verificar Docker
echo -e "${BLUE}[1/6]${NC} Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker no está corriendo${NC}"
    echo "   Por favor inicia Docker Desktop o el daemon de Docker"
    exit 1
fi
echo -e "${GREEN}✅ Docker está corriendo${NC}"
echo ""

# Verificar docker-compose
echo -e "${BLUE}[2/6]${NC} Verificando Docker Compose..."
if ! docker-compose --version > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker Compose no está instalado${NC}"
    echo "   Instala Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose está instalado${NC}"
echo ""

# Verificar archivo .env
echo -e "${BLUE}[3/6]${NC} Verificando archivo de configuración..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado${NC}"
    echo "   Creando desde plantilla .env.production..."
    cp .env.production .env
    echo -e "${GREEN}✅ Archivo .env creado${NC}"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Debes cambiar las contraseñas en el archivo .env${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "   Edita el archivo .env y cambia TODAS las contraseñas:"
    echo "   - DB_ROOT_PASSWORD"
    echo "   - DB_PASSWORD"
    echo "   - DB_FACTURA_PASSWORD"
    echo "   - REDIS_PASSWORD"
    echo ""
    read -p "   ¿Ya actualizaste las contraseñas? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}   Por favor edita .env y vuelve a ejecutar este script${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✅ Archivo .env existe${NC}"
fi
echo ""

# Verificar archivos .env de servicios
echo -e "${BLUE}[4/6]${NC} Verificando configuración de servicios..."

# Backend .env
if [ ! -f Backend/.env ]; then
    echo -e "${YELLOW}   ⚠️  Backend/.env no encontrado${NC}"
    echo "   Por favor verifica que Backend/.env existe"
    exit 1
fi

# Factura .env
if [ ! -f Factura/.env ]; then
    echo -e "${YELLOW}   ⚠️  Factura/.env no encontrado${NC}"
    echo "   Por favor verifica que Factura/.env existe"
    exit 1
fi

echo -e "${GREEN}✅ Archivos de configuración OK${NC}"
echo ""

# Crear directorios necesarios
echo -e "${BLUE}[5/6]${NC} Creando directorios necesarios..."
mkdir -p Backend/src/uploads/{productos,certs,logos,reservas}
mkdir -p backups
chmod -R 755 Backend/src/uploads
echo -e "${GREEN}✅ Directorios creados${NC}"
echo ""

# Preguntar si construir imágenes
echo -e "${BLUE}[6/6]${NC} ¿Deseas construir las imágenes Docker ahora?"
echo "   (Esto puede tardar varios minutos en la primera vez)"
echo ""
read -p "   Construir imágenes? (Y/n): " -n 1 -r
echo
echo ""

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${CYAN}Construyendo imágenes Docker...${NC}"
    echo "Esto puede tardar varios minutos. Por favor espera..."
    echo ""
    docker-compose build
    echo ""
    echo -e "${GREEN}✅ Imágenes construidas correctamente${NC}"
fi
echo ""

# Resumen
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 ✅ Setup Completado ✅                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "Próximos pasos:"
echo ""
echo -e "${GREEN}1.${NC} Iniciar todos los servicios:"
echo -e "   ${CYAN}./gestor.sh${NC}"
echo -e "   Luego selecciona la opción ${YELLOW}1${NC} para iniciar"
echo ""
echo -e "${GREEN}2.${NC} O usando docker-compose directamente:"
echo -e "   ${CYAN}docker-compose up -d${NC}"
echo ""
echo -e "${GREEN}3.${NC} Verificar que los servicios estén corriendo:"
echo -e "   ${CYAN}docker-compose ps${NC}"
echo ""
echo -e "${GREEN}4.${NC} Acceder a las aplicaciones:"
echo "   • Landing:    http://localhost:4243"
echo "   • Backend:    http://localhost:4240/api"
echo "   • Frontend:   http://localhost:4242"
echo "   • Factura:    http://localhost:4244"
echo "   • Gateway:    http://localhost"
echo ""
echo -e "${YELLOW}⚠️  Nota:${NC} La primera vez que inicies puede tardar 1-2 minutos"
echo "   mientras se crean las bases de datos y se ejecutan migraciones."
echo ""
echo -e "${CYAN}📚 Documentación:${NC}"
echo "   • README.md          - Documentación general"
echo "   • DEPLOYMENT.md      - Guía de deployment"
echo "   • CAMBIOS_REALIZADOS.md - Resumen de cambios"
echo ""
echo -e "${GREEN}¡Listo para empezar! 🚀${NC}"
echo ""
