# Resumen de Cambios - TikTrendry v2.0.0

## Fecha: 2026-01-17

## 🎯 Problemas Resueltos

### 1. ✅ Conflicto de Tabla "users"
**Problema**: Backend (Node.js) y Factura (Laravel) compartían la misma base de datos MySQL, causando error al migrar porque ambos intentaban crear la tabla `users`.

**Solución**:
- Creadas **2 bases de datos separadas**:
  - `tiktrendry_erp` (puerto 3307) → Backend
  - `tiktrendry_factura` (puerto 3308) → Factura
- Cada servicio ahora tiene su propia instancia de MySQL
- Scripts de inicialización independientes en `docker/mysql/`

### 2. ✅ Conflictos de Nombres de Contenedores
**Problema**: Nombres de contenedores `toroloco-*` conflictuaban con otros proyectos en el VPS.

**Solución**:
Todos los contenedores renombrados a `tiktrendry-*`:
- `tiktrendry-backend`
- `tiktrendry-frontend`
- `tiktrendry-landing`
- `tiktrendry-factura-php`
- `tiktrendry-factura-nginx`
- `tiktrendry-db-erp`
- `tiktrendry-db-factura`
- `tiktrendry-redis`
- `tiktrendry-gateway`

### 3. ✅ Dockerización No Lista para Producción
**Problema**: Configuración Docker básica sin health checks, límites de recursos, o gestión de logs.

**Solución**:
- Health checks en todos los servicios
- Límites de CPU y memoria configurados
- Volúmenes separados para logs
- Redis con autenticación y política de memoria
- Restart policy `always` para producción
- Nginx gateway como reverse proxy

## 📋 Archivos Creados/Modificados

### Archivos Nuevos Creados
```
✅ docker/mysql/init-erp.sql           # Inicialización BD ERP
✅ docker/mysql/init-factura.sql       # Inicialización BD Factura
✅ docker/nginx/nginx.conf             # Gateway reverse proxy
✅ docker/README.md                    # Docs de configuración Docker
✅ .env.production                     # Plantilla de variables de entorno
✅ .gitignore                          # Ignorar archivos sensibles
✅ DEPLOYMENT.md                       # Guía completa de deployment
✅ README.md                           # Documentación principal
✅ CAMBIOS_REALIZADOS.md              # Este archivo
```

### Archivos Modificados
```
✅ docker-compose.yml                  # Arquitectura completa renovada
✅ Backend/.env                        # Nueva configuración BD
✅ Factura/.env                        # Nueva configuración BD
✅ gestor.sh                           # Script mejorado con 22 opciones
✅ CLAUDE.md                           # Actualizado con nueva arquitectura
```

## 🏗️ Nueva Arquitectura

### Servicios Docker (antes: 5, ahora: 9)

#### Bases de Datos (Separadas)
1. **db-erp**: MySQL 8.0 para Backend
   - Puerto: 3307
   - Database: tiktrendry_erp
   - Volumen: db_erp_data

2. **db-factura**: MySQL 8.0 para Factura
   - Puerto: 3308
   - Database: tiktrendry_factura
   - Volumen: db_factura_data

3. **redis**: Cache compartido
   - Puerto: 6380
   - Con autenticación
   - Política de memoria configurada

#### Aplicaciones
4. **backend**: Node.js + Express
   - Puerto: 4240
   - Conecta a db-erp

5. **frontend**: React + Nginx
   - Puerto: 4242

6. **landing**: Next.js
   - Puerto: 4243

7. **factura-php**: Laravel + PHP-FPM
   - Conecta a db-factura

8. **factura-nginx**: Nginx para Factura
   - Puerto: 4244

9. **nginx-gateway**: Reverse proxy
   - Puertos: 80, 443
   - Rutas: /, /api/, /erp/, /factura/

### Mejoras de Seguridad

- Variables de entorno con valores por defecto seguros
- Contraseñas ahora en `.env` (no hardcoded)
- Redis requiere autenticación
- Volúmenes read-only donde corresponde
- SSL/TLS preparado (descomentar en nginx.conf)

### Gestión de Recursos

#### Límites de CPU y Memoria
- MySQL ERP: 2 CPU, 2GB RAM (reserva 1 CPU, 1GB)
- MySQL Factura: 2 CPU, 2GB RAM (reserva 1 CPU, 1GB)
- Redis: 0.5 CPU, 512MB RAM
- Backend: 2 CPU, 1GB RAM
- Frontend: 1 CPU, 512MB RAM
- Landing: 1 CPU, 1GB RAM
- Factura PHP: 2 CPU, 1GB RAM
- Factura Nginx: 1 CPU, 512MB RAM
- Gateway: 0.5 CPU, 256MB RAM

### Volúmenes Persistentes

**Datos**:
- `db_erp_data`: Datos de MySQL ERP
- `db_factura_data`: Datos de MySQL Factura
- `redis_data`: Cache Redis

**Logs**:
- `backend_logs`: Logs del backend
- `factura_logs`: Logs de Factura
- `factura_nginx_logs`: Logs de Nginx Factura
- `gateway_logs`: Logs del gateway

**Uploads** (bind mounts):
- `./Backend/src/uploads`: Archivos subidos
  - Compartido read-only con Factura para certs/logos

## 🛠️ Gestor.sh Mejorado

El script `gestor.sh` ahora incluye:

**SERVICIOS** (4 opciones):
- Iniciar/Detener/Reiniciar servicios
- Ver estado

**CONSTRUCCIÓN** (2 opciones):
- Build normal
- Rebuild sin caché

**LOGS** (6 opciones):
- Logs de todos los servicios
- Logs individuales: Backend, Frontend, Factura, DB-ERP, DB-Factura

**BASE DE DATOS** (5 opciones):
- Conectar a MySQL ERP/Factura
- Backup individual o completo
- Backups automáticos con timestamp

**MANTENIMIENTO** (4 opciones):
- Ver uso de recursos
- Limpiar contenedores/imágenes
- Limpieza completa

**MIGRACIONES** (1 opción):
- Ejecutar migraciones de Factura

Total: **22 opciones** vs 8 anteriores

## 📚 Documentación

### DEPLOYMENT.md
Guía completa de 400+ líneas que incluye:
- Prerequisitos y recursos mínimos
- Configuración paso a paso
- Puertos expuestos (tabla completa)
- Comandos útiles (backups, migraciones, logs)
- Troubleshooting exhaustivo
- Checklist de seguridad
- Setup de SSL con Let's Encrypt
- Monitoreo y actualización

### README.md
Documentación principal con:
- Descripción del proyecto
- Stack tecnológico
- Diagrama de arquitectura (ASCII)
- Instalación rápida
- Acceso a servicios
- Estructura del proyecto
- Comandos útiles
- Troubleshooting
- Changelog v2.0.0

### CLAUDE.md (actualizado)
Documentación para desarrollo:
- Nueva arquitectura de 9 servicios
- Bases de datos separadas documentadas
- Troubleshooting actualizado
- Sección de production deployment
- Comandos actualizados con nuevos nombres

## 🔒 Seguridad

### Variables de Entorno
Todas las contraseñas ahora en `.env`:
```env
DB_ROOT_PASSWORD=...
DB_PASSWORD=...
DB_FACTURA_PASSWORD=...
REDIS_PASSWORD=...
```

### .gitignore Completo
Creado archivo `.gitignore` que excluye:
- Archivos `.env`
- Backups
- Logs
- Certificados SSL
- Archivos de OS
- Datos de volúmenes
- Uploads (estructura sí, archivos no)

## 📊 Comparación Antes vs Ahora

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Bases de Datos** | 1 compartida | 2 separadas |
| **Servicios Docker** | 5 | 9 |
| **Health Checks** | ❌ | ✅ |
| **Límites de Recursos** | ❌ | ✅ |
| **Gestión de Logs** | ❌ | ✅ Volúmenes separados |
| **Redis** | Sin auth | Con autenticación |
| **Nombres Contenedores** | toroloco-* | tiktrendry-* |
| **Gateway** | ❌ | ✅ Nginx reverse proxy |
| **SSL Ready** | ❌ | ✅ Configuración lista |
| **Gestor Opciones** | 8 | 22 |
| **Documentación** | Básica | Completa (3 archivos) |
| **Seguridad** | Básica | Mejorada (passwords en .env) |
| **Production Ready** | ❌ | ✅ |

## 🚀 Próximos Pasos

Para deployment en tu VPS:

1. **Copiar archivos al VPS**:
```bash
git push origin main
# En el VPS:
git pull origin main
```

2. **Configurar variables de entorno**:
```bash
cp .env.production .env
nano .env  # Cambiar TODAS las contraseñas
```

3. **Actualizar .env de servicios**:
```bash
nano Backend/.env    # Actualizar DB_PASSWORD, REDIS_PASSWORD
nano Factura/.env    # Actualizar DB_PASSWORD, REDIS_PASSWORD
```

4. **Iniciar servicios**:
```bash
chmod +x gestor.sh
./gestor.sh
# Opción 1: Iniciar todos los servicios
```

5. **Verificar health checks**:
```bash
docker-compose ps
# Todos deben mostrar "Up (healthy)"
```

6. **Configurar SSL** (opcional pero recomendado):
```bash
# Ver DEPLOYMENT.md sección "Configurar SSL con Let's Encrypt"
```

7. **Configurar backups automáticos**:
```bash
# Agregar a crontab
crontab -e
# Agregar: 0 2 * * * cd /ruta/proyecto && ./gestor.sh backup-all
```

## ⚠️ Advertencias Importantes

1. **Cambiar contraseñas**: El archivo `.env.production` tiene contraseñas de ejemplo con el prefijo "CAMBIAR_". Cámbialas TODAS antes de usar en producción.

2. **Backups**: Antes de actualizar o hacer cambios, siempre crea un backup:
```bash
./gestor.sh
# Opción 17: Backup completo
```

3. **Puertos**: Si los puertos 4240-4244 están en uso, cámbialos en `.env`.

4. **Migración de datos**: Si ya tienes una base de datos `tiktendry` antigua:
   - Haz backup: `mysqldump -u root -p tiktendry > backup-old.sql`
   - Importa a nueva BD ERP: `mysql -u root -p tiktrendry_erp < backup-old.sql`

5. **First run**: La primera vez que inicies, las bases de datos se crearán automáticamente y el Backend ejecutará migraciones. Esto puede tardar 1-2 minutos.

## 📞 Soporte

Si encuentras problemas:

1. **Revisa los logs**:
```bash
./gestor.sh
# Opción 7: Ver logs de todos los servicios
```

2. **Verifica health checks**:
```bash
docker-compose ps
```

3. **Consulta DEPLOYMENT.md**:
   - Sección Troubleshooting tiene soluciones a problemas comunes

4. **Revisa las bases de datos**:
```bash
./gestor.sh
# Opción 13: Conectar a MySQL ERP
# Opción 14: Conectar a MySQL Factura
```

## ✅ Checklist de Verificación

Antes de considerar el deployment completo:

- [ ] Todas las contraseñas cambiadas en `.env`
- [ ] Contraseñas actualizadas en `Backend/.env` y `Factura/.env`
- [ ] Servicios iniciados: `docker-compose ps` muestra todos "Up (healthy)"
- [ ] Backend accesible: `curl http://localhost:4240/api/health`
- [ ] Frontend accesible: `curl http://localhost:4242`
- [ ] Factura accesible: `curl http://localhost:4244`
- [ ] Migraciones ejecutadas sin errores
- [ ] Backups configurados
- [ ] Firewall configurado (si es VPS)
- [ ] SSL configurado (si es producción pública)

---

## 🎉 Conclusión

Tu aplicación TikTrendry ahora está lista para producción con:

✅ Arquitectura robusta y escalable
✅ Bases de datos separadas (sin conflictos)
✅ Health checks y monitoreo
✅ Gestión simplificada con gestor.sh
✅ Documentación completa
✅ Seguridad mejorada
✅ Production-ready

**¡Todo listo para despegar! 🚀**
