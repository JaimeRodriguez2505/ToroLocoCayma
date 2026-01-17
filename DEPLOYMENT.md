# Guía de Deployment - TikTrendry

Esta guía te ayudará a desplegar el sistema TikTrendry en producción con Docker.

## Tabla de Contenidos
- [Cambios Importantes](#cambios-importantes)
- [Prerequisitos](#prerequisitos)
- [Configuración Inicial](#configuración-inicial)
- [Deployment en VPS](#deployment-en-vps)
- [Comandos Útiles](#comandos-útiles)
- [Troubleshooting](#troubleshooting)
- [Seguridad](#seguridad)

## Cambios Importantes

### ✅ Problemas Resueltos

1. **Bases de datos separadas**: Ya no hay conflicto de tablas `users`
   - **Backend ERP**: usa `tiktrendry_erp` (puerto 3307)
   - **Factura**: usa `tiktrendry_factura` (puerto 3308)

2. **Nombres de contenedores actualizados**: Cambiados de `toroloco-*` a `tiktrendry-*`
   - `tiktrendry-backend`
   - `tiktrendry-frontend`
   - `tiktrendry-landing`
   - `tiktrendry-factura-php`
   - `tiktrendry-factura-nginx`
   - `tiktrendry-db-erp`
   - `tiktrendry-db-factura`
   - `tiktrendry-redis`
   - `tiktrendry-gateway`

3. **Mejoras de producción**:
   - ✅ Health checks en todos los servicios
   - ✅ Límites de recursos (CPU y memoria)
   - ✅ Volúmenes separados para logs
   - ✅ Redis con autenticación y política de memoria
   - ✅ Restart policy en `always` para producción
   - ✅ Scripts de inicialización de bases de datos
   - ✅ Nginx gateway como reverse proxy

## Prerequisitos

### En tu VPS

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

### Recursos Mínimos Recomendados

- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disco**: 50 GB SSD
- **SO**: Ubuntu 20.04+ / Debian 11+

## Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone <tu-repositorio>
cd ERP-Restaurantes-Toro-Loco
```

### 2. Configurar Variables de Entorno

```bash
# Copiar plantilla de producción
cp .env.production .env

# Editar con tus valores
nano .env
```

**⚠️ IMPORTANTE**: Cambia TODAS las contraseñas en `.env`:
- `DB_ROOT_PASSWORD`
- `DB_PASSWORD`
- `DB_FACTURA_PASSWORD`
- `REDIS_PASSWORD`

### 3. Actualizar Archivos .env de los Servicios

#### Backend (.env)
```bash
nano Backend/.env
```
Actualiza:
- `DB_PASSWORD` (debe coincidir con `.env` del root)
- `REDIS_PASSWORD` (debe coincidir con `.env` del root)
- `JWT_SECRET` (genera uno nuevo: `openssl rand -hex 32`)

#### Factura (.env)
```bash
nano Factura/.env
```
Actualiza:
- `DB_PASSWORD` (debe coincidir con `DB_FACTURA_PASSWORD` del root)
- `REDIS_PASSWORD` (debe coincidir con `.env` del root)
- `APP_KEY` (ejecuta: `php artisan key:generate`)

### 4. Crear Directorios de Uploads

```bash
mkdir -p Backend/src/uploads/{productos,certs,logos,reservas}
chmod -R 755 Backend/src/uploads
```

## Deployment en VPS

### Opción 1: Deploy Completo

```bash
# Construir todas las imágenes
docker-compose build --no-cache

# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Opción 2: Deploy Selectivo

```bash
# Solo bases de datos
docker-compose up -d db-erp db-factura redis

# Esperar que estén healthy
docker-compose ps

# Luego backend
docker-compose up -d backend

# Luego frontend y factura
docker-compose up -d frontend factura-php factura-nginx landing

# Finalmente el gateway
docker-compose up -d nginx-gateway
```

### Verificar el Estado

```bash
# Ver estado de todos los contenedores
docker-compose ps

# Debería mostrar algo como:
# NAME                      STATUS              PORTS
# tiktrendry-backend        Up (healthy)        0.0.0.0:4240->3000/tcp
# tiktrendry-db-erp         Up (healthy)        0.0.0.0:3307->3306/tcp
# tiktrendry-db-factura     Up (healthy)        0.0.0.0:3308->3306/tcp
# tiktrendry-redis          Up (healthy)        0.0.0.0:6380->6379/tcp
# tiktrendry-frontend       Up (healthy)        0.0.0.0:4242->80/tcp
# tiktrendry-landing        Up (healthy)        0.0.0.0:4243->3000/tcp
# tiktrendry-factura-php    Up (healthy)        9070->9000/tcp
# tiktrendry-factura-nginx  Up (healthy)        0.0.0.0:4244->80/tcp
# tiktrendry-gateway        Up (healthy)        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

## Puertos Expuestos

| Servicio | Puerto | URL Local | Descripción |
|----------|--------|-----------|-------------|
| Gateway (HTTP) | 80 | http://localhost | Reverse proxy principal |
| Gateway (HTTPS) | 443 | https://localhost | SSL/TLS (configurar certs) |
| Backend API | 4240 | http://localhost:4240/api | API REST del ERP |
| Frontend | 4242 | http://localhost:4242 | Panel de administración |
| Landing | 4243 | http://localhost:4243 | Página de aterrizaje |
| Factura | 4244 | http://localhost:4244 | Sistema de facturación |
| MySQL ERP | 3307 | localhost:3307 | Base de datos ERP |
| MySQL Factura | 3308 | localhost:3308 | Base de datos Factura |
| Redis | 6380 | localhost:6380 | Cache y sesiones |

## Comandos Útiles

### Gestión de Servicios

```bash
# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f db-erp

# Reiniciar un servicio
docker-compose restart backend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ BORRA DATOS)
docker-compose down -v

# Ver uso de recursos
docker stats

# Limpiar imágenes no usadas
docker system prune -a
```

### Backups

#### Backup de Base de Datos ERP
```bash
docker exec tiktrendry-db-erp mysqldump \
  -uroot -p${DB_ROOT_PASSWORD} \
  tiktrendry_erp > backup-erp-$(date +%Y%m%d).sql
```

#### Backup de Base de Datos Factura
```bash
docker exec tiktrendry-db-factura mysqldump \
  -uroot -p${DB_ROOT_PASSWORD} \
  tiktrendry_factura > backup-factura-$(date +%Y%m%d).sql
```

#### Backup de Archivos
```bash
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz Backend/src/uploads/
```

### Restaurar Base de Datos

```bash
# ERP
docker exec -i tiktrendry-db-erp mysql \
  -uroot -p${DB_ROOT_PASSWORD} \
  tiktrendry_erp < backup-erp-20240115.sql

# Factura
docker exec -i tiktrendry-db-factura mysql \
  -uroot -p${DB_ROOT_PASSWORD} \
  tiktrendry_factura < backup-factura-20240115.sql
```

### Acceso Directo a MySQL

```bash
# Base de datos ERP
docker exec -it tiktrendry-db-erp mysql -uroot -p
# Usar: tiktrendry_erp

# Base de datos Factura
docker exec -it tiktrendry-db-factura mysql -uroot -p
# Usar: tiktrendry_factura
```

### Migraciones

#### Backend (Sequelize)
```bash
# Las migraciones se ejecutan automáticamente al iniciar el backend
# Para ejecutar manualmente:
docker exec -it tiktrendry-backend npm run migrate
```

#### Factura (Laravel)
```bash
# Ejecutar migraciones
docker exec -it tiktrendry-factura-php php artisan migrate

# Rollback
docker exec -it tiktrendry-factura-php php artisan migrate:rollback

# Refrescar (⚠️ borra datos)
docker exec -it tiktrendry-factura-php php artisan migrate:fresh
```

## Troubleshooting

### Contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs -f <nombre-servicio>

# Ver eventos del contenedor
docker events

# Inspeccionar contenedor
docker inspect <nombre-contenedor>
```

### Base de datos no conecta

```bash
# Verificar que el contenedor de BD esté healthy
docker-compose ps db-erp

# Ver logs de la base de datos
docker-compose logs -f db-erp

# Probar conexión desde el host
docker exec -it tiktrendry-db-erp mysqladmin ping -h localhost -u root -p
```

### Error "Table users already exists"

✅ **Este problema ya está RESUELTO** con las bases de datos separadas.

Si aún persiste:
1. Verifica que Backend use `DB_HOST=db-erp` y `DB_NAME=tiktrendry_erp`
2. Verifica que Factura use `DB_HOST=db-factura` y `DB_DATABASE=tiktrendry_factura`
3. Elimina volúmenes y reinicia: `docker-compose down -v && docker-compose up -d`

### Puertos en uso

Si los puertos ya están en uso en tu VPS:

1. Edita `.env` y cambia los puertos:
```env
BACKEND_PORT=5240
FRONTEND_PORT=5242
# etc...
```

2. Actualiza `docker-compose.yml` para usar variables:
```yaml
ports:
  - "${BACKEND_PORT:-4240}:3000"
```

### Problemas de permisos en uploads

```bash
# Dentro del contenedor backend
docker exec -it tiktrendry-backend chown -R node:node /app/src/uploads

# Desde el host
sudo chown -R 1000:1000 Backend/src/uploads
chmod -R 755 Backend/src/uploads
```

## Seguridad

### Checklist de Seguridad

- [ ] Cambiar todas las contraseñas por defecto
- [ ] Generar nuevo `JWT_SECRET`
- [ ] Generar nuevo `APP_KEY` para Laravel
- [ ] Configurar firewall (UFW):
  ```bash
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 22/tcp
  sudo ufw enable
  ```
- [ ] Configurar SSL/TLS con Let's Encrypt (ver sección abajo)
- [ ] Configurar backups automáticos
- [ ] Actualizar Docker y el sistema operativo regularmente
- [ ] Revisar logs periódicamente
- [ ] Limitar acceso SSH solo a IPs conocidas

### Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot certonly --standalone -d tu-dominio.com

# Los certificados se guardan en:
# /etc/letsencrypt/live/tu-dominio.com/fullchain.pem
# /etc/letsencrypt/live/tu-dominio.com/privkey.pem

# Copiar a docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem docker/nginx/ssl/key.pem

# Descomentar sección HTTPS en docker/nginx/nginx.conf

# Reiniciar gateway
docker-compose restart nginx-gateway

# Auto-renovación (agregar a crontab)
sudo crontab -e
# Agregar:
# 0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/tu-dominio.com/*.pem /ruta/a/docker/nginx/ssl/ && docker-compose restart nginx-gateway
```

### Monitoreo

#### Ver uso de recursos
```bash
docker stats --no-stream
```

#### Logs centralizados
```bash
# Ver todos los logs
docker-compose logs -f --tail=100

# Solo errores
docker-compose logs -f | grep -i error
```

## Actualización de la Aplicación

```bash
# 1. Hacer backup
./scripts/backup.sh

# 2. Descargar cambios
git pull origin main

# 3. Rebuild con cambios
docker-compose build --no-cache

# 4. Reiniciar servicios
docker-compose down
docker-compose up -d

# 5. Verificar logs
docker-compose logs -f
```

## Soporte

Para problemas o consultas:
- Issues: GitHub Issues
- Documentación: Ver CLAUDE.md
- Logs: Siempre revisa los logs con `docker-compose logs -f`

---

**¡Listo para producción! 🚀**

Recuerda:
1. ✅ Bases de datos separadas (sin conflictos)
2. ✅ Nombres de contenedores únicos
3. ✅ Health checks configurados
4. ✅ Seguridad mejorada
5. ✅ Listo para escalar
