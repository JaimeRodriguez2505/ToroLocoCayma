# TikTrendry - Sistema ERP para Restaurantes

Sistema completo de gestión para restaurantes con facturación electrónica integrada con SUNAT (Perú).

## Características Principales

- **ERP Completo**: Gestión de inventario, ventas (POS), caja, personal y más
- **Facturación Electrónica**: Integración con SUNAT para e-facturación
- **Multi-usuario**: Sistema de roles (Admin, Manager, Cajero)
- **Cierre Automático**: Cierre de caja automatizado diario
- **Gestión de Comandas**: Sistema de órdenes para cocina
- **Analytics**: Reportes y dashboards en tiempo real
- **Multi-plataforma**: Web responsive (desktop, tablet, mobile)

## Stack Tecnológico

- **Backend**: Node.js + Express + Sequelize + MySQL
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Factura**: Laravel (PHP) + MySQL
- **Landing**: Next.js
- **Base de Datos**: MySQL 8.0 (bases de datos separadas para ERP y Factura)
- **Cache**: Redis
- **Deployment**: Docker + Docker Compose

## Arquitectura

El sistema utiliza una arquitectura de microservicios con **bases de datos separadas**:

```
┌─────────────────────────────────────────────────────────────┐
│                     Nginx Gateway (Port 80/443)              │
│  Routes: /, /api/, /erp/, /factura/, /uploads/              │
└──────────────────┬──────────────────────────────────────────┘
                   │
       ┌───────────┴───────────┬──────────────┬────────────┐
       │                       │              │            │
┌──────▼──────┐         ┌─────▼─────┐  ┌─────▼─────┐ ┌───▼────┐
│   Landing   │         │  Backend  │  │ Frontend  │ │Factura │
│  (Next.js)  │         │ (Node.js) │  │  (React)  │ │(Laravel)│
│  Port 4243  │         │ Port 4240 │  │ Port 4242 │ │Port 4244│
└─────────────┘         └─────┬─────┘  └───────────┘ └────┬───┘
                              │                            │
                    ┌─────────┴────────┐         ┌────────▼─────┐
                    │  MySQL ERP DB    │         │MySQL Factura │
                    │ tiktrendry_erp   │         │tiktrendry_   │
                    │   Port 3307      │         │  factura     │
                    └──────────────────┘         │  Port 3308   │
                                                 └──────────────┘
                              │
                    ┌─────────▼──────────┐
                    │    Redis Cache     │
                    │     Port 6380      │
                    └────────────────────┘
```

### Solución al Problema de Tablas Duplicadas

✅ **Problema Resuelto**: Anteriormente, Backend y Factura compartían la misma base de datos, causando conflictos en la tabla `users`. Ahora cada servicio tiene su propia base de datos:

- **Backend ERP**: `tiktrendry_erp` (puerto 3307)
- **Factura**: `tiktrendry_factura` (puerto 3308)

Esto elimina completamente los conflictos de migración.

## Instalación y Setup

### Prerrequisitos

- Docker 20.10+
- Docker Compose 2.0+
- Git

### Instalación Rápida

1. Clonar el repositorio:
```bash
git clone <tu-repositorio>
cd ERP-Restaurantes-Toro-Loco
```

2. Configurar variables de entorno:
```bash
# Copiar plantilla de producción
cp .env.production .env

# Editar y cambiar TODAS las contraseñas
nano .env
```

3. Iniciar servicios:
```bash
# Usando el gestor interactivo (recomendado)
./gestor.sh

# O directamente con docker-compose
docker-compose up -d
```

4. Verificar que todo esté corriendo:
```bash
docker-compose ps
```

Deberías ver todos los servicios como `Up (healthy)`.

## Uso del Gestor Interactivo

El proyecto incluye un script mejorado `gestor.sh` para facilitar la gestión:

```bash
./gestor.sh
```

Funcionalidades del gestor:
- ✅ Iniciar/detener/reiniciar servicios
- ✅ Ver logs en tiempo real
- ✅ Conectar a bases de datos MySQL
- ✅ Crear backups automáticos
- ✅ Ejecutar migraciones
- ✅ Monitorear uso de recursos
- ✅ Limpiar contenedores e imágenes

## Acceso a los Servicios

Una vez iniciado, puedes acceder a:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Landing Page | http://localhost:4243 | Página de aterrizaje |
| Backend API | http://localhost:4240/api | API REST del ERP |
| Frontend ERP | http://localhost:4242 | Panel de administración |
| Facturación | http://localhost:4244 | Sistema de facturación |
| Gateway | http://localhost | Proxy unificado |

## Credenciales por Defecto

### Backend (Usuario Admin)
- **Email**: Se crea automáticamente en el primer inicio
- Ver logs del backend para obtener las credenciales iniciales

### Base de Datos
Ver archivo `.env` para credenciales de MySQL y Redis.

**⚠️ IMPORTANTE**: Cambia todas las contraseñas antes de desplegar a producción.

## Estructura del Proyecto

```
.
├── Backend/              # API REST (Node.js + Express)
│   ├── src/
│   │   ├── models/       # Modelos Sequelize
│   │   ├── controllers/  # Lógica de negocio
│   │   ├── routes/       # Rutas de API
│   │   ├── middlewares/  # Auth, validación, etc.
│   │   └── uploads/      # Archivos subidos
│   └── .env
│
├── Frontend/             # Panel Admin (React + TypeScript)
│   ├── src/
│   │   ├── pages/        # Páginas de la app
│   │   ├── components/   # Componentes reutilizables
│   │   └── services/     # Cliente API
│   └── .env
│
├── Factura/              # Facturación SUNAT (Laravel)
│   ├── app/
│   ├── routes/
│   └── .env
│
├── landing/              # Landing page (Next.js)
│   └── src/
│
├── docker/               # Configuraciones Docker
│   ├── mysql/            # Scripts de inicialización
│   └── nginx/            # Config del gateway
│
├── docker-compose.yml    # Orquestación de servicios
├── gestor.sh             # Script de gestión
├── .env.production       # Plantilla de variables de entorno
├── DEPLOYMENT.md         # Guía de deployment completa
└── CLAUDE.md             # Documentación para desarrollo
```

## Comandos Útiles

### Ver logs
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f backend
docker-compose logs -f db-erp
```

### Backups
```bash
# Usando el gestor
./gestor.sh
# Opción 17: Backup completo

# O manualmente
docker exec tiktrendry-db-erp mysqldump -uroot -p tiktrendry_erp > backup.sql
```

### Migraciones
```bash
# Backend (automático al iniciar)
docker-compose restart backend

# Factura (manual)
docker exec -it tiktrendry-factura-php php artisan migrate
```

### Acceso a MySQL
```bash
# ERP
docker exec -it tiktrendry-db-erp mysql -uroot -p
# use tiktrendry_erp;

# Factura
docker exec -it tiktrendry-db-factura mysql -uroot -p
# use tiktrendry_factura;
```

## Desarrollo

Para desarrollo local, ver documentación específica:

- [Backend README](Backend/README.md)
- [Frontend README](Frontend/README.md)
- [CLAUDE.md](CLAUDE.md) - Guía completa de desarrollo

## Deployment a Producción

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones detalladas sobre:

- Configuración de VPS
- Setup de SSL/HTTPS
- Variables de entorno de producción
- Backups automáticos
- Monitoreo y logs
- Seguridad

## Troubleshooting

### Contenedores no inician
```bash
# Ver logs detallados
docker-compose logs -f <servicio>

# Verificar que Docker esté corriendo
docker info
```

### Error de conexión a base de datos
```bash
# Verificar que las bases de datos estén healthy
docker-compose ps

# Revisar logs de las bases de datos
docker-compose logs -f db-erp
docker-compose logs -f db-factura
```

### Puertos en uso
Si los puertos están ocupados en tu sistema, edita el archivo `.env` y cambia los puertos expuestos.

### Error "Table users already exists"
✅ **Este problema ya está resuelto** con las bases de datos separadas. Si aún lo ves:
1. Verifica que Backend use `DB_NAME=tiktrendry_erp`
2. Verifica que Factura use `DB_DATABASE=tiktrendry_factura`
3. Reinicia: `docker-compose down -v && docker-compose up -d`

## Seguridad

Antes de desplegar a producción:

- [ ] Cambiar todas las contraseñas en `.env`
- [ ] Generar nuevo `JWT_SECRET`
- [ ] Generar nuevo `APP_KEY` para Laravel
- [ ] Configurar firewall (UFW)
- [ ] Habilitar SSL/HTTPS
- [ ] Configurar backups automáticos
- [ ] Revisar y actualizar dependencias

Ver checklist completo en [DEPLOYMENT.md](DEPLOYMENT.md#seguridad).

## Contribuir

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Soporte

Para problemas o preguntas:

- **Issues**: Abre un issue en GitHub
- **Documentación**: Ver CLAUDE.md y DEPLOYMENT.md
- **Logs**: Siempre revisa los logs con `docker-compose logs -f`

## Licencia

Ver archivo LICENSE para más detalles.

---

**Desarrollado con ❤️ para la gestión eficiente de restaurantes**

## Changelog

### v2.0.0 - 2026-01-17

#### 🎉 Cambios Mayores
- ✅ **Bases de datos separadas**: Backend y Factura ahora usan bases de datos independientes
- ✅ **Nombres de contenedores actualizados**: De `toroloco-*` a `tiktrendry-*`
- ✅ **Mejoras de producción**: Health checks, límites de recursos, volúmenes de logs

#### 🔧 Mejoras
- Nuevo script `gestor.sh` con menú interactivo mejorado
- Configuración de Redis con autenticación
- Nginx gateway como reverse proxy
- Scripts de inicialización de bases de datos
- Documentación completa de deployment

#### 🐛 Correcciones
- Resuelto: Error "Table users already exists"
- Resuelto: Conflictos de nombres de contenedores
- Mejorado: Gestión de volúmenes y persistencia
