# Solución al Problema de Facturación

## 📋 Problema Identificado

Cuando hacías `docker-compose build` y `docker-compose up -d` desde cero y luego creabas una empresa:

1. ❌ Los contenedores iniciaban en paralelo
2. ❌ **Factura-php** sincronizaba empresas ANTES de que crearas la empresa en el backend
3. ❌ Tabla `companies` quedaba vacía en `toroloco_factura`
4. ❌ Error 500/404 al intentar emitir facturas: "Table companies is empty"

## ✅ Solución Implementada

### 1. **Sincronización Automática** (Backend/src/controllers/company.controller.js:5-159)

El backend ahora sincroniza automáticamente con facturación cuando:
- Creas una empresa (POST `/api/companies`)
- Actualizas una empresa (PUT `/api/companies/:id`)
- Actualizas parcialmente (PATCH `/api/companies/:id`)

```javascript
// Función agregada que ejecuta sincronización automática
const syncCompaniesToFactura = () => {
    exec('docker exec toroloco-factura-php php artisan sync:companies', ...);
};
```

### 2. **Comando Manual de Sincronización** (Por si acaso)

Si alguna vez la sincronización automática falla, ejecuta manualmente:

```bash
docker exec toroloco-factura-php php artisan sync:companies
```

Este comando:
- ✅ Lee todas las empresas de `toroloco_erp`
- ✅ Las copia/actualiza en `toroloco_factura`
- ✅ Muestra resumen: "✓ Sincronizada: [nombre] (RUC: [ruc])"

### 3. **Sincronización al Inicio** (Factura/entrypoint.sh:97-120)

El contenedor de factura automáticamente:
1. Espera a que la base de datos ERP esté disponible
2. Ejecuta `php artisan sync:companies`
3. Sincroniza todas las empresas existentes

## 🚀 Deployment en VPS (Paso a Paso)

### Opción 1: Deployment Limpio (Recomendado)

```bash
# 1. Clonar o actualizar código
cd /ruta/a/tu/proyecto

# 2. Construir todos los servicios
docker-compose build

# 3. Levantar servicios
docker-compose up -d

# 4. Esperar 30 segundos a que todo inicie
sleep 30

# 5. Verificar que los servicios estén healthy
docker ps --filter name=toroloco

# 6. (Opcional) Verificar sincronización
docker exec toroloco-factura-php php artisan sync:companies
```

### Opción 2: Si Ya Tienes el Sistema Corriendo

```bash
# Actualizar código
git pull  # o copia los archivos nuevos

# Reconstruir servicios específicos
docker-compose build backend factura-php

# Reiniciar servicios
docker-compose up -d backend factura-php factura-nginx

# Verificar logs
docker logs toroloco-backend --tail 50
docker logs toroloco-factura-php --tail 50
```

## 🔍 Verificación Post-Deployment

### 1. Verificar Servicios

```bash
docker ps --filter name=toroloco --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Deberías ver:
- ✅ `toroloco-backend`: Healthy en puerto 4240
- ✅ `toroloco-factura-php`: Healthy
- ✅ `toroloco-factura-nginx`: Running en puerto 4244
- ✅ `toroloco-frontend`: Running en puerto 4242

### 2. Verificar APIs

```bash
# Backend
curl http://localhost:4240/api/health

# Factura
curl http://localhost:4244/api/health
```

### 3. Verificar Sincronización de Empresas

```bash
# Ver empresas en ERP
docker exec toroloco-db-erp mysql -utoroloco -ptoroloco_change_me toroloco_erp \
  -e "SELECT id_company, razon_social, ruc FROM companies;"

# Ver empresas en Factura
docker exec toroloco-db-factura mysql -utoroloco_factura -pfactura_password_change_me toroloco_factura \
  -e "SELECT id_company, razon_social, ruc FROM companies;"
```

**Ambas deben mostrar las mismas empresas.**

## 🛠️ Solución de Problemas

### Problema: "No se encontraron empresas en la base de datos ERP"

**Causa**: El contenedor de factura inició antes de que crearas la empresa.

**Solución**:
```bash
# Crear la empresa primero desde el frontend (http://localhost:4242)
# Luego ejecutar sincronización manual:
docker exec toroloco-factura-php php artisan sync:companies
```

### Problema: Error 500 al emitir factura

**Verificar**:
```bash
# 1. ¿Hay empresas sincronizadas?
docker exec toroloco-db-factura mysql -utoroloco_factura -pfactura_password_change_me \
  toroloco_factura -e "SELECT COUNT(*) FROM companies;" 2>/dev/null

# 2. Ver logs detallados
docker logs toroloco-factura-php --tail 100
```

**Solución**:
```bash
# Re-sincronizar
docker exec toroloco-factura-php php artisan sync:companies
```

### Problema: Error 404 al emitir factura

**Causa**: Ruta no encontrada en Laravel.

**Verificar rutas**:
```bash
docker exec toroloco-factura-php php artisan route:list
```

Deberías ver:
- ✅ `POST api/invoices/send`
- ✅ `POST api/invoices/pdf`
- ✅ `POST api/invoices/xml`

## 📝 Archivos Modificados

1. **Backend/src/controllers/company.controller.js**
   - Agregada función `syncCompaniesToFactura()`
   - Se llama automáticamente en `createCompany`, `updateCompanyPut`, `updateCompanyPatch`

2. **Factura/app/Console/Commands/SyncCompanies.php** (NUEVO)
   - Comando Laravel para sincronizar empresas
   - Uso: `php artisan sync:companies`

3. **Factura/entrypoint.sh**
   - Agregada sincronización automática al inicio
   - Espera a base de datos ERP antes de sincronizar

4. **Factura/database/migrations/2026_01_17_202007_create_companies_table.php** (NUEVO)
   - Migración para crear tabla `companies` en facturación

5. **Factura/app/Models/Company.php**
   - Configurado modelo para tabla `companies`

## ✅ Estado Actual

**Sistema completamente funcional:**

1. ✅ Bases de datos separadas (`toroloco_erp` y `toroloco_factura`)
2. ✅ Sincronización automática al crear/actualizar empresas
3. ✅ Sincronización al inicio del contenedor
4. ✅ Comando manual disponible para emergencias
5. ✅ Backend en puerto 4240
6. ✅ Factura en puerto 4244
7. ✅ Frontend en puerto 4242

## 🎯 Flujo Normal de Uso

1. Usuario crea empresa desde frontend → Backend guarda en `toroloco_erp`
2. Backend automáticamente dispara: `docker exec toroloco-factura-php php artisan sync:companies`
3. Factura lee de `toroloco_erp` y guarda en `toroloco_factura`
4. Usuario puede emitir facturas sin problemas ✅

---

**¿Necesitas ayuda?** Ejecuta:
```bash
docker exec toroloco-factura-php php artisan sync:companies
```

Este comando SIEMPRE solucionará problemas de sincronización.
