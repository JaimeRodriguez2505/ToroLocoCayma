# 🔍 ANÁLISIS DE ERRORES - Sistema de Facturación

## 📊 Errores Detectados

### ✅ BUENAS NOTICIAS:

1. **Empresas sincronizadas correctamente:**
   - ERP: 1 empresa ✅
   - Factura: 1 empresa ✅
   - Cron funcionando ✅

2. **Servicios funcionando:**
   - Backend: Healthy ✅
   - Factura-PHP: Healthy ✅
   - Bases de datos: Healthy ✅

3. **API de Factura respondiendo:**
   ```bash
   curl http://localhost:4244/api/invoices/send
   # Respuesta: {"message":"Token no proporcionado"}
   ```
   Esto significa que la API funciona, solo requiere autenticación JWT.

---

## ❌ PROBLEMAS IDENTIFICADOS

### Problema 1: Error Backend - Columna `venta_id` no existe

**Log del error:**
```
Error: Unknown column 'Comanda.venta_id' in 'where clause'
sql: "SELECT ... WHERE ... `Comanda`.`venta_id` = 1 ..."
```

**Causa:**
El código del backend intenta buscar comandas por `venta_id`, pero esa columna NO existe en la tabla `comandas`.

**Ubicación del problema:**
Probablemente en `Backend/src/controllers/venta.controller.js` o similar, después de crear una venta.

**Impacto:**
- Error secundario que aparece en logs
- NO afecta la facturación directamente
- Puede causar problemas con comandas delivery

**Solución manual:**

**Opción A - Agregar columna (Recomendado):**
```sql
-- Conectarse a la base de datos ERP
docker exec -it toroloco-db-erp mysql -utoroloco -ptoroloco_change_me toroloco_erp

-- Agregar columna venta_id
ALTER TABLE comandas ADD COLUMN venta_id INT NULL AFTER observaciones;

-- Agregar índice para mejorar rendimiento
CREATE INDEX idx_comandas_venta_id ON comandas(venta_id);

-- Salir
exit
```

**Opción B - Modificar código del backend:**
Editar el archivo que hace la consulta y eliminar la búsqueda por `venta_id`, usar solo `observaciones LIKE '%Venta ID: X%'`

---

### Problema 2: Error 404 en Facturación - `/api/invoices/send`

**Error en frontend:**
```
Failed to load resource: the server responded with a status of 404 (Not Found) (send, line 0)
Error: Error 404: Not Found
```

**Análisis:**
- ✅ Ruta existe en Laravel: `POST /api/invoices/send`
- ✅ Controlador existe: `Api\InvoiceController@send`
- ✅ Empresas sincronizadas: 1 empresa
- ✅ API responde (requiere token JWT)

**Posibles causas:**

#### Causa A: Problema de autenticación JWT

El frontend está enviando el request sin token JWT válido o el middleware está rechazando el token.

**Cómo verificar:**
1. Abre las DevTools del navegador
2. Ve a Network → Busca el request a `send`
3. Mira los Headers → Verifica si hay `Authorization: Bearer <token>`

**Solución:**
Si no hay token o el token es inválido:
```bash
# Verificar que el usuario esté logueado
# Cerrar sesión y volver a loguear en el frontend
```

#### Causa B: Configuración de CORS

El middleware de CORS en Laravel puede estar bloqueando el request.

**Cómo verificar:**
```bash
# Ver logs de PHP-FPM
docker logs toroloco-factura-php --tail 100

# Debería mostrar algo como:
# 172.25.0.9 - POST /index.php 404
```

**Solución:**
Editar `Factura/app/Http/Middleware/Cors.php` o `Factura/config/cors.php`:

```php
// Factura/config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'],  // En producción, especificar dominios
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

#### Causa C: Middleware VerifyJwtToken rechazando el token

El middleware JWT personalizado puede estar rechazando tokens.

**Ubicación:** `Factura/app/Http/Middleware/VerifyJwtToken.php`

**Solución temporal (solo para testing):**
Comentar temporalmente el middleware en las rutas de facturación:

Editar `Factura/routes/api.php`:
```php
// ANTES
Route::middleware(['verify.jwt'])->group(function () {
    Route::post('/invoices/send', [InvoiceController::class, 'send']);
});

// DESPUÉS (temporal - solo para testing)
Route::post('/invoices/send', [InvoiceController::class, 'send']);
```

**⚠️ ADVERTENCIA:** Esto desactiva la seguridad. Solo para testing local.

#### Causa D: Frontend enviando a URL incorrecta

**Verificar en:** `Frontend/src/services/invoiceService.ts`

Debe ser:
```typescript
const FACTURADOR_API_URL = "http://localhost:4244/api"
```

**NO debe ser:**
- `http://localhost:8000/api`
- `http://localhost:4244` (sin /api)

---

## 🔧 PASOS PARA SOLUCIONAR MANUALMENTE

### Paso 1: Verificar URL del frontend

```bash
# Ver el archivo
cat Frontend/src/services/invoiceService.ts | grep FACTURADOR_API_URL

# Debe mostrar:
# const FACTURADOR_API_URL = "http://localhost:4244/api"
```

Si está mal:
```bash
# Editar el archivo
nano Frontend/src/services/invoiceService.ts

# Cambiar a:
const FACTURADOR_API_URL = "http://localhost:4244/api"

# Guardar y reconstruir frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Paso 2: Ver request real en DevTools

1. Abre Chrome DevTools (F12)
2. Ve a Network
3. Filtra por "send"
4. Intenta emitir factura
5. Click en el request "send"
6. Ve a Headers tab
7. Copia y pégame:
   - Request URL
   - Request Headers (especialmente Authorization)
   - Response Headers
   - Response (Preview tab)

### Paso 3: Verificar logs de Laravel

```bash
# Ver logs de factura-php
docker exec toroloco-factura-php tail -f /var/www/html/storage/logs/laravel.log

# En otra terminal, intenta emitir factura
# El log debería mostrar el error real
```

Si no hay archivo de log:
```bash
# Habilitar logs en Laravel
docker exec toroloco-factura-php php -r "echo file_get_contents('.env');" | grep LOG_LEVEL

# Debería ser LOG_LEVEL=debug (no error)
```

### Paso 4: Test directo sin frontend

```bash
# Obtener token JWT del frontend (desde DevTools → Application → LocalStorage)
# Luego ejecutar:

curl -X POST http://localhost:4244/api/invoices/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "company": {
      "ruc": "20613614508",
      "razonSocial": "TU_EMPRESA",
      "address": {
        "direccion": "Calle X"
      }
    },
    "client": {
      "tipoDoc": "1",
      "numDoc": "12345678",
      "rznSocial": "Cliente Test"
    },
    "details": [
      {
        "codProducto": "P001",
        "unidad": "NIU",
        "descripcion": "Producto Test",
        "cantidad": 1,
        "mtoValorUnitario": 10,
        "mtoValorVenta": 10,
        "mtoBaseIgv": 10,
        "porcentajeIgv": 18,
        "igv": 1.8,
        "tipAfeIgv": "10",
        "totalImpuestos": 1.8,
        "mtoPrecioUnitario": 11.8
      }
    ]
  }'
```

Si esto funciona, el problema está en el frontend.
Si da error, el problema está en el backend de facturación.

---

## 📝 SOLUCIÓN RÁPIDA (Lo más probable)

El problema más común es que el frontend no esté enviando el token JWT correctamente.

**Solución:**

1. **Cerrar sesión en el frontend**
2. **Volver a loguear**
3. **Intentar emitir factura de nuevo**

Esto refresca el token JWT y suele solucionar el problema.

---

## 🐛 DEBUGGING AVANZADO

Si nada de lo anterior funciona, ejecuta esto:

```bash
# 1. Ver todos los requests que llegan a factura
docker logs toroloco-factura-php --tail 100 -f

# 2. En otra terminal, ver requests de nginx
docker logs toroloco-factura-nginx --tail 100 -f

# 3. Intentar emitir factura desde el frontend

# 4. Observar qué aparece en los logs
```

Luego ejecuta:

```bash
# Ver rutas registradas en Laravel
docker exec toroloco-factura-php php artisan route:list | grep invoice

# Debe mostrar:
# POST  api/invoices/send   Api\InvoiceController@send
```

---

## 🎯 RESUMEN EJECUTIVO

### Problema Principal: Error 404 en `/api/invoices/send`

**Lo que SÍ funciona:**
- ✅ Empresas sincronizadas
- ✅ API de factura responde
- ✅ Rutas Laravel configuradas
- ✅ Todos los servicios healthy

**Lo que probablemente está fallando:**
- ❌ Token JWT no se envía o es inválido
- ❌ Frontend apuntando a URL incorrecta

**Primera acción:**
1. Cerrar sesión y volver a loguear
2. Si sigue fallando, verificar en DevTools:
   - Request URL debe ser: `http://localhost:4244/api/invoices/send`
   - Debe tener header: `Authorization: Bearer <token>`

**Segunda acción (si lo anterior falla):**
```bash
# Ver archivo de configuración del frontend
cat Frontend/src/services/invoiceService.ts

# Verificar que tenga:
# const FACTURADOR_API_URL = "http://localhost:4244/api"
```

**Tercera acción:**
```bash
# Ver logs mientras intentas emitir factura
docker logs toroloco-factura-php --tail 50 -f
```

---

## 📞 INFORMACIÓN PARA DEBUGGING

**Comandos útiles:**

```bash
# Ver estado general
docker ps --filter name=toroloco

# Ver empresas sincronizadas
docker exec toroloco-db-factura mysql -utoroloco_factura -pfactura_password_change_me toroloco_factura \
  -e "SELECT id_company, razon_social, ruc FROM companies;" 2>/dev/null

# Ver log del cron
docker exec toroloco-factura-php cat /var/log/cron.log

# Ver últimos 100 logs de factura
docker logs toroloco-factura-php --tail 100

# Test directo del endpoint (sin token)
curl http://localhost:4244/api/health
```

---

**Nota:** El error de `venta_id` en el backend es secundario y no afecta la facturación. Puede solucionarse después.
