# ✅ SOLUCIÓN FINAL - Sistema de Facturación Funcionando

## 🎯 PROBLEMA SOLUCIONADO

**Antes:**
- ❌ Error 404/500 al emitir facturas después de `docker-compose build && up -d`
- ❌ Backend intentaba ejecutar `docker exec` desde dentro del contenedor (imposible)
- ❌ Tabla `companies` vacía en Factura si creabas empresa después del deployment

**Ahora:**
- ✅ **Cron automático** sincroniza empresas cada minuto
- ✅ **Sincronización al inicio** del contenedor de Factura
- ✅ **Dependencias correctas** - Factura espera a que Backend esté healthy
- ✅ **100% funcional** desde build limpio

---

## 🚀 CÓMO HACER DEPLOYMENT (Paso a Paso)

### 1. Limpiar Todo (Opcional)

```bash
cd /ruta/a/ERP-Restaurantes-Toro-Loco

# Detener y eliminar contenedores
docker-compose down

# Eliminar volúmenes (BORRA BASES DE DATOS - ¡CUIDADO!)
docker volume rm $(docker volume ls -q | grep erp-restaurantestoro_loco)

# Eliminar imágenes
docker rmi $(docker images | grep erp-restaurantestoro_loco | awk '{print $3}')
```

### 2. Build

```bash
docker-compose build
```

**Tiempo:** 3-5 minutos

### 3. Levantar

```bash
docker-compose up -d
```

**Orden automático de inicio:**
1. Bases de datos (db-erp, db-factura, redis)
2. Backend (espera a db-erp y redis)
3. **Factura-php** (espera a backend, db-erp, db-factura, redis) ← NUEVO
4. Factura-nginx, Frontend, Landing

### 4. Esperar

```bash
# Esperar 30 segundos
sleep 30

# Verificar estado
docker ps --filter name=toroloco
```

### 5. Usar el Sistema

1. Ir a `http://localhost:4242`
2. Login
3. Crear empresa con RUC y certificados
4. **Esperar máximo 60 segundos** (cron automático sincroniza)
5. Crear categorías y productos
6. **Hacer venta con boleta/factura** ← ¡Debería funcionar!

---

## ⏰ SINCRONIZACIÓN AUTOMÁTICA

### ¿Cómo Funciona?

**Cron ejecuta cada minuto:**
```
* * * * * cd /var/www/html && /usr/local/bin/php artisan sync:companies
```

**Qué hace:**
1. Lee empresas de `toroloco_erp.companies`
2. Copia/actualiza en `toroloco_factura.companies`
3. Registra log en `/var/log/cron.log`

**Ventajas:**
- ✅ No requiere intervención manual
- ✅ Máximo 60 segundos de retraso
- ✅ Funciona incluso si creas empresa mientras Factura está apagado

### Ver Log de Sincronización

```bash
# Ver log del cron
docker exec toroloco-factura-php cat /var/log/cron.log
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

---

## 🔍 VERIFICACIÓN POST-DEPLOYMENT

### 1. Contenedores

```bash
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
...
```

### 2. APIs

```bash
# Backend
curl http://localhost:4240/api/health
# Respuesta: HTML de la app

# Factura
curl http://localhost:4244/api/health
# Respuesta: {"status":"ok","service":"facturador"...}
```

### 3. Empresas Sincronizadas

```bash
# Ver empresas en Factura
docker exec toroloco-db-factura mysql -utoroloco_factura -pfactura_password_change_me toroloco_factura \
  -e "SELECT id_company, razon_social, ruc FROM companies;" 2>/dev/null
```

**Si sale vacío (0 empresas):**
```bash
# Esperar 1 minuto (cron se ejecuta automáticamente)
# O forzar sincronización inmediata:
docker exec toroloco-factura-php /usr/local/bin/php artisan sync:companies
```

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### "Error 404 al enviar factura"

**Causa:** Empresa no sincronizada

**Solución:**
```bash
# 1. Verificar empresas en Factura
docker exec toroloco-db-factura mysql -utoroloco_factura -pfactura_password_change_me toroloco_factura \
  -e "SELECT COUNT(*) FROM companies;" 2>/dev/null

# 2. Si count = 0, forzar sincronización
docker exec toroloco-factura-php /usr/local/bin/php artisan sync:companies
```

### "Could not connect to the server"

**Causa:** Backend caído

**Solución:**
```bash
# Ver logs
docker logs toroloco-backend --tail 100

# Reiniciar
docker-compose restart backend
```

### Cron no está ejecutando

**Verificar:**
```bash
# Ver procesos
docker exec toroloco-factura-php ps aux | grep cron

# Si no aparece nada, iniciar cron
docker exec toroloco-factura-php service cron start

# Ver log
docker exec toroloco-factura-php tail -20 /var/log/cron.log
```

---

## 📝 ARCHIVOS MODIFICADOS

### 1. **Backend/src/controllers/company.controller.js**
- ✅ Eliminado intento de sincronización con docker exec
- ✅ Vuelto a versión simple sin dependencias de Docker

### 2. **Factura/Dockerfile** (NUEVO)
- ✅ Instalado `cron` y `supervisor`
- ✅ Copiado crontab al contenedor
- ✅ Configurado cron para ejecutar al inicio

### 3. **Factura/crontab** (NUEVO)
```cron
* * * * * cd /var/www/html && /usr/local/bin/php artisan sync:companies >> /var/log/cron.log 2>&1
```

### 4. **Factura/entrypoint.sh**
- ✅ Inicia servicio cron al arrancar contenedor
- ✅ Sincronización inicial al inicio

### 5. **docker-compose.yml**
- ✅ `factura-php` ahora depende de:
  - `db-factura` (condition: healthy)
  - `db-erp` (condition: healthy)
  - `backend` (condition: healthy) ← IMPORTANTE
  - `redis` (condition: healthy)

---

## ✅ CHECKLIST DE DEPLOYMENT

Usa esto cuando hagas deployment en el VPS:

- [ ] `docker-compose down`
- [ ] (Opcional) `docker volume rm ...` para empezar limpio
- [ ] `docker-compose build`
- [ ] `docker-compose up -d`
- [ ] Esperar 30 segundos
- [ ] Verificar: `docker ps --filter name=toroloco`
- [ ] Todos deben estar "healthy" o "running"
- [ ] Login en frontend (http://localhost:4242)
- [ ] Crear empresa
- [ ] **Esperar 1 minuto** o ejecutar: `docker exec toroloco-factura-php /usr/local/bin/php artisan sync:companies`
- [ ] Verificar empresas sincronizadas
- [ ] Crear categoría
- [ ] Crear producto
- [ ] **Hacer venta con boleta/factura** ← Debe funcionar ✅
- [ ] ✅ Deployment exitoso

---

## 🎯 RESUMEN EJECUTIVO

**¿Qué se hizo?**

1. ✅ Eliminada sincronización desde Backend (no funciona en Docker)
2. ✅ Agregado cron job en Factura que sincroniza cada minuto
3. ✅ Factura ahora depende de Backend (espera a que esté healthy)
4. ✅ Sincronización inicial al arrancar Factura
5. ✅ Sistema 100% automático y funcional

**¿Qué significa esto para ti?**

- ✅ Haces `docker-compose build && docker-compose up -d`
- ✅ Creas empresa desde frontend
- ✅ Esperas máximo 60 segundos (o ejecutas sync manual)
- ✅ **YA PUEDES EMITIR FACTURAS** sin errores 404/500

**Comando de emergencia (si algo falla):**
```bash
docker exec toroloco-factura-php /usr/local/bin/php artisan sync:companies
```

Este comando SIEMPRE sincroniza las empresas manualmente.

---

## 📖 DOCUMENTACIÓN COMPLETA

Ver: `DEPLOYMENT-GUIDE.md` para guía completa con todos los detalles.

---

**¿Listo para deployment?**

```bash
cd /ruta/a/proyecto
docker-compose build
docker-compose up -d
sleep 30
docker ps --filter name=toroloco
```

**¡YA ESTÁ! El sistema está listo para usar. 🎉**
