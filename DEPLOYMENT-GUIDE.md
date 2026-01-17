# 🚀 Guía de Deployment - ToroLoco ERP

## ⚠️ IMPORTANTE: Cómo Hacer un Deployment Limpio

### 📋 Problema y Solución

**Problema anterior:**
- Factura iniciaba antes que el Backend
- No había empresas para sincronizar
- Error 404/500 al intentar facturar

**Solución implementada:**
1. ✅ **Cron automático**: Factura sincroniza empresas cada minuto automáticamente
2. ✅ **Dependencias correctas**: Factura espera a que Backend esté healthy
3. ✅ **Sincronización al inicio**: Cuando Factura inicia, sincroniza inmediatamente

---

## 🔥 Deployment Paso a Paso

### Paso 1: Limpiar Todo (Opcional)

```bash
# Detener y eliminar contenedores
docker-compose down

# Eliminar volúmenes (¡CUIDADO! Esto borra todas las bases de datos)
docker volume rm $(docker volume ls -q | grep erp-restaurantestoro_loco)

# Eliminar imágenes build
docker rmi $(docker images | grep erp-restaurantestoro_loco | awk '{print $3}')
```

### Paso 2: Build

```bash
# Construir todos los servicios
docker-compose build

# O construir servicios específicos
docker-compose build backend factura-php frontend
```

**Tiempo estimado**: 3-5 minutos

### Paso 3: Levantar Servicios

```bash
# Levantar en orden correcto (automático con depends_on)
docker-compose up -d
```

**Orden de inicio automático:**
1. db-erp, db-factura, redis (bases de datos)
2. backend (espera a db-erp y redis)
3. factura-php (espera a backend, db-factura, db-erp, redis)
4. factura-nginx (espera a factura-php)
5. frontend, landing, gateway

### Paso 4: Esperar y Verificar

```bash
# Esperar 30 segundos a que todo inicie
sleep 30

# Verificar que todos los servicios estén healthy
docker ps --filter name=toroloco --format "table {{.Names}}\t{{.Status}}"
```

**Deberías ver:**
```
toroloco-backend         Up X minutes (healthy)
toroloco-factura-php     Up X minutes (healthy)
toroloco-db-erp          Up X minutes (healthy)
toroloco-db-factura      Up X minutes (healthy)
toroloco-redis           Up X minutes (healthy)
toroloco-frontend        Up X minutes
toroloco-factura-nginx   Up X minutes
toroloco-landing         Up X minutes
toroloco-gateway         Up X minutes
```

### Paso 5: Verificar Logs

```bash
# Backend
docker logs toroloco-backend --tail 50

# Factura
docker logs toroloco-factura-php --tail 50
```

**Logs esperados de Factura:**
```
✅ Conexión a base de datos establecida.
🔄 Ejecutando migraciones...
✅ Sincronización completada
⏰ Iniciando cron para sincronización automática
🚀 Iniciando PHP-FPM...
```

---

## 📊 Flujo de Uso Normal

### 1. Crear Empresa (Primera vez o después de build limpio)

1. Ir a `http://localhost:4242` (Frontend)
2. Login con usuario admin
3. Ir a Configuración → Empresa
4. Crear empresa con RUC, certificados, etc.

**¿Qué pasa internamente?**
- ✅ Backend guarda empresa en `toroloco_erp.companies`
- ⏰ Cron de Factura sincroniza automáticamente en <60 segundos
- ✅ Empresa disponible en `toroloco_factura.companies`

### 2. Verificar Sincronización (Opcional)

```bash
# Ver log del cron
docker exec toroloco-factura-php cat /var/log/cron.log

# Forzar sincronización inmediata (no esperar al cron)
docker exec toroloco-factura-php php artisan sync:companies
```

**Salida esperada:**
```
🔄 Sincronizando empresas desde ERP...
📊 Encontradas 1 empresa(s) en ERP
  ✓ Sincronizada: NombreEmpresa (RUC: 20XXXXXXXXX)
✅ Sincronización completada:
   • Nuevas: 1
   • Actualizadas: 0
```

### 3. Crear Productos y Categorías

Normal, sin cambios.

### 4. Realizar Ventas con Factura/Boleta

1. Ir a Nueva Venta
2. Agregar productos
3. Seleccionar tipo de comprobante (Boleta/Factura)
4. Completar datos del cliente
5. Emitir

**✅ Debería funcionar sin errores**

---

## 🔍 Verificación Post-Deployment

### Verificar APIs

```bash
# Backend
curl http://localhost:4240/api/health
# Debería retornar HTML de la app

# Factura
curl http://localhost:4244/api/health
# Debería retornar: {"status":"ok","service":"facturador","timestamp":"..."}
```

### Verificar Empresas Sincronizadas

```bash
# Empresas en ERP
docker exec toroloco-db-erp mysql -utoroloco -ptoroloco_change_me toroloco_erp \
  -e "SELECT id_company, razon_social, ruc FROM companies;" 2>/dev/null

# Empresas en Factura
docker exec toroloco-db-factura mysql -utoroloco_factura -pfactura_password_change_me toroloco_factura \
  -e "SELECT id_company, razon_social, ruc FROM companies;" 2>/dev/null
```

**Ambas deben mostrar las mismas empresas.**

### Verificar Cron Funcionando

```bash
# Ver procesos de cron
docker exec toroloco-factura-php ps aux | grep cron

# Ver log de sincronización
docker exec toroloco-factura-php tail -f /var/log/cron.log
```

---

## 🛠️ Solución de Problemas

### Problema: "Error 404 al enviar factura"

**Causa**: Empresa no sincronizada en Factura

**Solución inmediata**:
```bash
# Verificar empresas
docker exec toroloco-db-factura mysql -utoroloco_factura -pfactura_password_change_me \
  toroloco_factura -e "SELECT COUNT(*) as count FROM companies;" 2>/dev/null

# Si count = 0, sincronizar manualmente
docker exec toroloco-factura-php php artisan sync:companies
```

### Problema: "Could not connect to the server"

**Causa**: Backend caído o reiniciando

**Solución**:
```bash
# Ver estado del backend
docker logs toroloco-backend --tail 100

# Reiniciar backend
docker-compose restart backend

# Esperar 10 segundos
sleep 10
```

### Problema: Cron no está sincronizando

**Verificar**:
```bash
# ¿Cron está corriendo?
docker exec toroloco-factura-php service cron status

# Si no está corriendo, iniciarlo
docker exec toroloco-factura-php service cron start

# Ver últimas ejecuciones
docker exec toroloco-factura-php tail -20 /var/log/cron.log
```

### Problema: Migraciones no se ejecutaron

**Solución**:
```bash
# Ejecutar migraciones manualmente
docker exec toroloco-factura-php php artisan migrate --force

# Sincronizar empresas
docker exec toroloco-factura-php php artisan sync:companies
```

---

## 📝 Archivos Importantes Modificados

### 1. Factura/Dockerfile
- ✅ Instalado `cron` y `supervisor`
- ✅ Agregado crontab para sincronización automática

### 2. Factura/crontab (NUEVO)
- ✅ Ejecuta `php artisan sync:companies` cada minuto

### 3. Factura/entrypoint.sh
- ✅ Inicia cron al arrancar el contenedor
- ✅ Sincronización inicial al inicio

### 4. docker-compose.yml
- ✅ `factura-php` ahora depende de `backend` (condition: healthy)
- ✅ Asegura orden correcto de inicio

### 5. Backend/src/controllers/company.controller.js
- ✅ Eliminada sincronización con docker exec (no funciona en contenedor)

---

## ⏰ Sincronización Automática

**Cómo funciona:**

1. **Cron ejecuta cada minuto**: `/etc/cron.d/laravel-cron`
2. **Comando**: `php artisan sync:companies`
3. **Conexión**: Factura se conecta a `db-erp` (MySQL)
4. **Sincronización**: Lee `toroloco_erp.companies` y copia a `toroloco_factura.companies`
5. **Log**: Guarda resultado en `/var/log/cron.log`

**Ventajas:**
- ✅ No requiere intervención manual
- ✅ Siempre sincronizado (máximo 60 segundos de retraso)
- ✅ Funciona incluso si creas empresa mientras Factura está apagado
- ✅ Se actualiza automáticamente si modificas empresa

---

## 🎯 Checklist de Deployment

- [ ] `docker-compose down` (si hay sistema anterior)
- [ ] `docker volume rm ...` (si quieres empezar limpio)
- [ ] `docker-compose build`
- [ ] `docker-compose up -d`
- [ ] Esperar 30 segundos
- [ ] Verificar: `docker ps --filter name=toroloco`
- [ ] Todos los servicios deben estar "healthy" o "running"
- [ ] Verificar logs: `docker logs toroloco-backend --tail 50`
- [ ] Verificar logs: `docker logs toroloco-factura-php --tail 50`
- [ ] Crear empresa desde frontend
- [ ] Esperar 1 minuto o ejecutar: `docker exec toroloco-factura-php php artisan sync:companies`
- [ ] Verificar empresas sincronizadas
- [ ] Crear categoría y producto
- [ ] Hacer venta de prueba con boleta
- [ ] ✅ Deployment exitoso

---

## 🚨 En Caso de Emergencia

Si nada funciona, ejecuta esto:

```bash
# 1. Reiniciar todo
docker-compose restart

# 2. Esperar
sleep 30

# 3. Sincronizar manualmente
docker exec toroloco-factura-php php artisan sync:companies

# 4. Verificar
docker ps --filter name=toroloco
curl http://localhost:4240/api/health
curl http://localhost:4244/api/health
```

---

**¿Necesitas ayuda?**

Ver logs completos:
```bash
docker logs toroloco-backend
docker logs toroloco-factura-php
docker logs toroloco-frontend
```

Ver logs de cron:
```bash
docker exec toroloco-factura-php cat /var/log/cron.log
```

Sincronización manual:
```bash
docker exec toroloco-factura-php php artisan sync:companies
```
