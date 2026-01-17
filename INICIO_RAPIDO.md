# 🚀 Inicio Rápido - TikTrendry

Esta guía te ayudará a poner en marcha TikTrendry en menos de 5 minutos.

## Opción 1: Script Automático (Recomendado)

```bash
./quick-start.sh
```

El script verificará:
- ✅ Docker está instalado y corriendo
- ✅ Docker Compose está disponible
- ✅ Archivos de configuración existen
- ✅ Creará directorios necesarios
- ✅ Opcionalmente construirá las imágenes

## Opción 2: Manual

### Paso 1: Configurar Variables de Entorno

```bash
# Copiar plantilla
cp .env.production .env

# Editar y cambiar TODAS las contraseñas
nano .env
```

**⚠️ IMPORTANTE**: Busca y reemplaza todos los valores que empiezan con "CAMBIAR_".

### Paso 2: Verificar Configuración de Servicios

```bash
# Backend
nano Backend/.env
# Actualizar:
# - DB_HOST=db-erp
# - DB_NAME=tiktrendry_erp
# - DB_PASSWORD=(debe coincidir con DB_PASSWORD del .env raíz)
# - REDIS_PASSWORD=(debe coincidir con REDIS_PASSWORD del .env raíz)

# Factura
nano Factura/.env
# Actualizar:
# - DB_HOST=db-factura
# - DB_DATABASE=tiktrendry_factura
# - DB_USERNAME=tiktrendry_factura
# - DB_PASSWORD=(debe coincidir con DB_FACTURA_PASSWORD del .env raíz)
# - REDIS_HOST=redis
# - REDIS_PASSWORD=(debe coincidir con REDIS_PASSWORD del .env raíz)
```

### Paso 3: Crear Directorios

```bash
mkdir -p Backend/src/uploads/{productos,certs,logos,reservas}
mkdir -p backups
chmod -R 755 Backend/src/uploads
```

### Paso 4: Construir e Iniciar

```bash
# Construir imágenes (primera vez)
docker-compose build

# Iniciar servicios
docker-compose up -d

# Verificar estado
docker-compose ps
```

Espera 1-2 minutos mientras se crean las bases de datos y se ejecutan migraciones.

### Paso 5: Verificar

```bash
# Todos los servicios deben mostrar "Up (healthy)"
docker-compose ps

# Ver logs si hay problemas
docker-compose logs -f
```

## Acceso a las Aplicaciones

Una vez iniciado:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| 🏠 Landing | http://localhost:4243 | Página de aterrizaje |
| 🔌 API | http://localhost:4240/api | Backend REST API |
| 💼 ERP | http://localhost:4242 | Panel de administración |
| 🧾 Factura | http://localhost:4244 | Sistema de facturación |
| 🌐 Gateway | http://localhost | Proxy unificado |

## Gestión con gestor.sh

Para facilitar la administración:

```bash
./gestor.sh
```

Opciones más usadas:
- **1**: Iniciar servicios
- **2**: Detener servicios
- **4**: Ver estado
- **7**: Ver todos los logs
- **17**: Backup completo

## Verificación de Salud

### Ver estado de servicios
```bash
docker-compose ps
```

Deberías ver algo como:
```
NAME                      STATUS              PORTS
tiktrendry-backend        Up (healthy)        0.0.0.0:4240->3000/tcp
tiktrendry-db-erp         Up (healthy)        0.0.0.0:3307->3306/tcp
tiktrendry-db-factura     Up (healthy)        0.0.0.0:3308->3306/tcp
tiktrendry-redis          Up (healthy)        0.0.0.0:6380->6379/tcp
...
```

### Probar endpoints

```bash
# Backend API
curl http://localhost:4240/api/health

# Frontend
curl http://localhost:4242

# Factura
curl http://localhost:4244
```

## Troubleshooting Rápido

### Servicios no inician
```bash
# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f db-erp
```

### Base de datos no conecta
```bash
# Verificar que la BD esté healthy
docker-compose ps db-erp

# Ver logs de la BD
docker-compose logs -f db-erp

# Conectar manualmente
docker exec -it tiktrendry-db-erp mysql -uroot -p
# Usar: tiktrendry_erp
```

### Puertos en uso
Si algún puerto está ocupado:
```bash
# Editar .env y cambiar los puertos
nano .env

# Reiniciar
docker-compose down
docker-compose up -d
```

### "Table users already exists"
✅ Este problema está resuelto con las bases de datos separadas.

Si aún lo ves:
```bash
# Verificar que uses las configuraciones correctas
grep DB_NAME Backend/.env    # debe decir tiktrendry_erp
grep DB_DATABASE Factura/.env # debe decir tiktrendry_factura

# Si es necesario, reiniciar desde cero
docker-compose down -v
docker-compose up -d
```

## Comandos Útiles

### Ver logs en tiempo real
```bash
docker-compose logs -f
```

### Reiniciar un servicio
```bash
docker-compose restart backend
```

### Conectar a MySQL
```bash
# ERP
docker exec -it tiktrendry-db-erp mysql -uroot -p
# use tiktrendry_erp;

# Factura
docker exec -it tiktrendry-db-factura mysql -uroot -p
# use tiktrendry_factura;
```

### Backup rápido
```bash
./gestor.sh
# Opción 17: Backup completo
```

### Ver uso de recursos
```bash
docker stats
```

## Próximos Pasos

1. **Explorar el sistema**:
   - Abre http://localhost:4242 (Frontend ERP)
   - Busca las credenciales del admin en los logs del backend

2. **Revisar documentación**:
   - `README.md` - Documentación completa
   - `DEPLOYMENT.md` - Guía de producción
   - `CAMBIOS_REALIZADOS.md` - Resumen de mejoras

3. **Configurar backups automáticos**:
   - Ver sección "Backups" en DEPLOYMENT.md

4. **SSL/HTTPS (producción)**:
   - Ver sección "SSL con Let's Encrypt" en DEPLOYMENT.md

## Credenciales por Defecto

### Usuario Admin (Backend)
Se crea automáticamente en el primer inicio.
Ver credenciales en los logs:
```bash
docker-compose logs backend | grep -i "admin"
```

### Bases de Datos
Ver contraseñas en el archivo `.env`.

**⚠️ IMPORTANTE**: Cambia todas las contraseñas antes de usar en producción.

## Checklist de Verificación

Después de iniciar, verifica que:

- [ ] `docker-compose ps` muestra todos los servicios como "Up (healthy)"
- [ ] Backend responde en http://localhost:4240/api
- [ ] Frontend carga en http://localhost:4242
- [ ] Factura carga en http://localhost:4244
- [ ] No hay errores en los logs: `docker-compose logs -f`
- [ ] Puedes conectar a MySQL ERP: `docker exec -it tiktrendry-db-erp mysql -uroot -p`
- [ ] Puedes conectar a MySQL Factura: `docker exec -it tiktrendry-db-factura mysql -uroot -p`

## Soporte

Si tienes problemas:

1. **Revisa los logs**: `docker-compose logs -f`
2. **Consulta DEPLOYMENT.md**: Sección Troubleshooting
3. **Verifica salud**: `docker-compose ps`
4. **Reinicia servicios**: `docker-compose restart <servicio>`

## Recursos Adicionales

- **Gestor interactivo**: `./gestor.sh`
- **Documentación completa**: `README.md`
- **Deployment producción**: `DEPLOYMENT.md`
- **Cambios v2.0**: `CAMBIOS_REALIZADOS.md`

---

**¡Listo! Tu aplicación TikTrendry está corriendo 🎉**

Para administrar servicios, usa: `./gestor.sh`
