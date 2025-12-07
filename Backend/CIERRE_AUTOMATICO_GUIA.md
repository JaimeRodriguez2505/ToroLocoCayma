# 🤖 Sistema de Cierre Automático de Caja - Guía Completa

## 📋 Índice
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Problema Detectado](#problema-detectado)
3. [Solución Implementada](#solución-implementada)
4. [Arquitectura del Sistema](#arquitectura-del-sistema)
5. [Gestión de Gastos de Personal](#gestión-de-gastos-de-personal)
6. [Configuración](#configuración)
7. [API Endpoints](#api-endpoints)
8. [Cómo Usar el Sistema](#cómo-usar-el-sistema)
9. [Casos de Uso](#casos-de-uso)
10. [Troubleshooting](#troubleshooting)

---

## 📝 Resumen Ejecutivo

Se ha implementado un **sistema de cierre automático de caja** completo, robusto y bien documentado que:

✅ Cierra automáticamente la caja todos los días a las **23:59:00 hora de Lima**
✅ Calcula todos los totales por método de pago automáticamente
✅ Integra los gastos de personal aprobados y los resta del saldo esperado
✅ Genera alertas si hay discrepancias
✅ Permite recuperar cierres de días anteriores que no se ejecutaron
✅ Proporciona APIs REST completas para monitoreo y control

---

## 🔍 Problema Detectado

### Situación del 10 de Octubre 2025

**Síntomas:**
- Había 1 venta registrada el 10/10/2025 por S/ 2,000.00
- NO existía cierre de caja para esa fecha
- Había 1 gasto aprobado de S/ 25.00 (Transporte Delivery)

**Causa raíz:**
El sistema **NO tenía un cierre automático**. El cierre era 100% manual y requería que el usuario hiciera clic en "Cerrar Caja" desde el frontend.

---

## 💡 Solución Implementada

### 1. Servicio de Cierre Automático (`autoCierreCaja.service.js`)

Un servicio completo que maneja toda la lógica de cierre automático:

**Funcionalidades principales:**
- ✅ Detecta ventas sin cierre del día
- ✅ Calcula totales por método de pago (efectivo, tarjeta, yape, plin, etc.)
- ✅ Considera descuentos aplicados a las ventas
- ✅ Calcula gastos aprobados automáticamente
- ✅ Calcula saldo esperado y discrepancias
- ✅ Genera logs detallados de cada operación
- ✅ Maneja errores sin detener el sistema

### 2. Scheduler (`cierreScheduler.service.js`)

Un scheduler basado en `node-cron` que:
- ✅ Programa cierre diario a las 23:59:00
- ✅ Se inicia automáticamente con el servidor
- ✅ Permite control manual (start/stop/restart)
- ✅ Soporta múltiples tareas programadas

### 3. API REST (`scheduler.controller.js` + `scheduler.routes.js`)

Endpoints completos para:
- ✅ Monitorear estado del scheduler
- ✅ Ver estadísticas y logs
- ✅ Ejecutar cierres manuales
- ✅ Recuperar cierres de fechas anteriores
- ✅ Controlar el scheduler (start/stop/restart)

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              src/index.js                             │  │
│  │  • Inicia el servidor                                 │  │
│  │  • Inicia el scheduler automáticamente               │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      src/services/cierreScheduler.service.js          │  │
│  │  • Gestiona tareas programadas con node-cron         │  │
│  │  • Ejecuta cierre a las 23:59:00 diariamente         │  │
│  │  • Permite control manual                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      src/services/autoCierreCaja.service.js           │  │
│  │  • Lógica de negocio del cierre automático           │  │
│  │  • Calcula totales por método de pago                │  │
│  │  • Integra gastos de personal aprobados              │  │
│  │  • Calcula saldo esperado y discrepancias            │  │
│  │  • Genera logs detallados                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Base de Datos MySQL                      │  │
│  │  • ventas                                             │  │
│  │  • cierres_caja                                       │  │
│  │  • gastos_personal                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │       API REST: /api/scheduler/*                      │  │
│  │  • Monitoreo y control del scheduler                 │  │
│  │  • Ejecución manual de cierres                       │  │
│  │  • Recuperación de cierres perdidos                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 💸 Gestión de Gastos de Personal

### Cómo Funciona la Integración

El sistema integra automáticamente los gastos de personal aprobados en el cierre de caja:

#### 1. **Cálculo de Gastos Aprobados**

Al crear un cierre, el sistema busca gastos que cumplan CUALQUIERA de estas condiciones:
- `fecha_gasto` está dentro del día a cerrar
- `fecha_revision` (fecha de aprobación) está dentro del día

Esto permite capturar:
- ✅ Gastos realizados y aprobados el mismo día
- ✅ Gastos realizados días antes pero aprobados hoy
- ✅ Gastos pendientes de revisión no se incluyen

#### 2. **Cálculo del Saldo Esperado**

```javascript
saldo_final_esperado = total_efectivo - total_gastos_aprobados
```

**Ejemplo:**
- Ventas en efectivo del día: S/ 2,000.00
- Gastos aprobados (Transporte): S/ 25.00
- **Saldo esperado**: S/ 1,975.00

#### 3. **Cálculo de Discrepancia**

```javascript
discrepancia = saldo_efectivo_reportado - saldo_final_esperado
```

**Interpretación:**
- **Discrepancia = 0**: Todo está correcto ✅
- **Discrepancia > 0**: Hay más dinero del esperado (sobra dinero)
- **Discrepancia < 0**: Falta dinero

#### 4. **Alertas Automáticas**

El sistema genera alertas si:
- Discrepancia > S/ 0.50: Alerta media
- Discrepancia > S/ 10.00: Alerta alta
- Hay gastos aprobados: Alerta informativa

### Estrategia de Cierre Automático

El cierre automático usa una **estrategia OPTIMISTA**:

```javascript
// Asume que el saldo efectivo es igual al total de ventas en efectivo
saldo_efectivo = total_efectivo

// Si hay gastos aprobados de S/ 25.00, el sistema:
// - Calcula saldo_esperado = S/ 2,000 - S/ 25 = S/ 1,975
// - Reporta saldo_efectivo = S/ 2,000
// - Genera discrepancia = S/ 25.00 (se asume que el gasto no fue retirado aún)
```

**Razón:** En un cierre automático no podemos contar físicamente el dinero, entonces asumimos que:
1. Todo el dinero de las ventas está en la caja
2. Los gastos aprobados NO han sido retirados aún de la caja
3. La discrepancia refleja los gastos pendientes de pago

---

## ⚙️ Configuración

### Configuración del Servicio de Cierre Automático

Archivo: `src/services/autoCierreCaja.service.js`

```javascript
const AUTO_CIERRE_CONFIG = {
  // Zona horaria de Perú (Lima)
  TIMEZONE: 'America/Lima',

  // ID del cajero del sistema para cierres automáticos
  SYSTEM_CASHIER_ID: 1,

  // Umbral de discrepancia aceptable (en soles)
  DISCREPANCY_THRESHOLD: 0.50,

  // Número máximo de reintentos en caso de fallo
  MAX_RETRIES: 3,

  // Delay entre reintentos (en milisegundos)
  RETRY_DELAY: 5000,

  // Habilitar/deshabilitar logs detallados
  VERBOSE_LOGGING: true
};
```

### Configuración del Scheduler

Archivo: `src/services/cierreScheduler.service.js`

```javascript
const SCHEDULER_CONFIG = {
  // Zona horaria de Perú (Lima)
  TIMEZONE: 'America/Lima',

  // Horario de ejecución del cierre automático (cron expression)
  // Por defecto: 23:59:00 todos los días
  CIERRE_CRON_SCHEDULE: '0 59 23 * * *',

  // Habilitar/deshabilitar el scheduler al inicio
  AUTO_START: true,

  // Ejecutar cierre inmediatamente al iniciar (útil para testing)
  RUN_ON_STARTUP: false,

  // Habilitar logs detallados
  VERBOSE_LOGGING: true
};
```

### Modificar el Horario de Cierre

Para cambiar la hora de cierre automático, modifica `CIERRE_CRON_SCHEDULE`:

```javascript
// Ejemplos de expresiones cron:
'0 59 23 * * *'   // 23:59:00 todos los días (actual)
'0 0 0 * * *'     // 00:00:00 medianoche
'0 30 23 * * 1-5' // 23:30:00 solo de lunes a viernes
'0 0 22 * * *'    // 22:00:00 todos los días
```

---

## 🌐 API Endpoints

Todos los endpoints requieren autenticación JWT y rol de administrador (role 1 o 2).

### GET /api/scheduler/status
Obtiene el estado básico del scheduler.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "startTime": "2025-10-11 10:00:00",
    "uptime": "2 hours",
    "tasks_count": 1,
    "tasks": [...]
  }
}
```

### GET /api/scheduler/stats
Obtiene estadísticas completas del scheduler y servicio de cierre.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "scheduler": { ...},
    "auto_cierre": { ...}
  }
}
```

### GET /api/scheduler/logs
Obtiene los logs del scheduler.

**Query params:**
- `limit`: Número de logs (default: 50)
- `service`: 'scheduler' | 'auto_cierre' | 'both' (default: 'both')

**Ejemplo:**
```bash
GET /api/scheduler/logs?limit=100&service=scheduler
```

### POST /api/scheduler/start
Inicia el scheduler si está detenido.

### POST /api/scheduler/stop
Detiene el scheduler.

⚠️ **IMPORTANTE:** Detener el scheduler detendrá todos los cierres automáticos.

### POST /api/scheduler/restart
Reinicia el scheduler.

Útil para aplicar cambios de configuración.

### POST /api/scheduler/run-manual
Ejecuta un cierre automático manualmente para el día ACTUAL.

**Respuesta:**
```json
{
  "success": true,
  "message": "Cierre automático ejecutado correctamente",
  "data": {
    "fecha": "2025-10-11",
    "cierre": {
      "id_cierre": 123,
      "total_efectivo": 2000.00,
      "total_gastos_aprobados": 25.00,
      "saldo_final_esperado": 1975.00,
      "discrepancia": 25.00
    },
    "ventas_procesadas": 15,
    "alertas": [...]
  }
}
```

### POST /api/scheduler/run-for-date
Ejecuta un cierre automático para una fecha específica.

**Body:**
```json
{
  "fecha": "2025-10-10"
}
```

**Útil para:** Recuperar cierres de días anteriores que no se ejecutaron.

### DELETE /api/scheduler/logs
Limpia los logs del scheduler.

**Query params:**
- `service`: 'scheduler' | 'auto_cierre' | 'both' (default: 'both')

---

## 📖 Cómo Usar el Sistema

### 1. El Sistema Automático (No Requiere Acción)

Por defecto, el sistema cerrará automáticamente la caja todos los días a las 23:59:00.

✅ **No necesitas hacer nada**, el sistema funciona solo.

### 2. Ver Estado del Scheduler

```bash
# Usando curl (reemplaza YOUR_JWT_TOKEN con tu token)
curl -X GET http://localhost:3000/api/scheduler/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Recuperar Cierre del 10 de Octubre

Para crear el cierre que falta del 10/10/2025:

```bash
curl -X POST http://localhost:3000/api/scheduler/run-for-date \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"fecha": "2025-10-10"}'
```

### 4. Ejecutar Cierre Manual del Día Actual

```bash
curl -X POST http://localhost:3000/api/scheduler/run-manual \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Ver Logs del Sistema

```bash
curl -X GET "http://localhost:3000/api/scheduler/logs?limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 💼 Casos de Uso

### Caso 1: Recuperar Cierre Perdido

**Escenario:** El servidor estuvo caído el 10/10 y no se ejecutó el cierre.

**Solución:**
1. Verificar que hay ventas sin cierre:
   ```sql
   SELECT * FROM ventas WHERE DATE(fecha) = '2025-10-10';
   ```

2. Ejecutar cierre para esa fecha:
   ```bash
   POST /api/scheduler/run-for-date
   { "fecha": "2025-10-10" }
   ```

3. Verificar que se creó el cierre:
   ```sql
   SELECT * FROM cierres_caja WHERE DATE(fecha_apertura) = '2025-10-10';
   ```

### Caso 2: Cierre Urgente Antes de Medianoche

**Escenario:** Necesitas cerrar la caja a las 20:00 en lugar de esperar a las 23:59.

**Solución:**
```bash
POST /api/scheduler/run-manual
```

Esto creará el cierre inmediatamente para el día actual.

### Caso 3: Auditoría de Cierres

**Escenario:** Necesitas revisar todos los cierres del mes.

**Solución:**
```bash
GET /api/scheduler/logs?limit=100&service=auto_cierre
```

O directamente en la base de datos:
```sql
SELECT
  DATE(fecha_apertura) as fecha,
  total_efectivo,
  total_gastos_aprobados,
  saldo_final_esperado,
  discrepancia,
  observaciones
FROM cierres_caja
WHERE MONTH(fecha_apertura) = 10
ORDER BY fecha_apertura DESC;
```

### Caso 4: Cambiar Horario de Cierre

**Escenario:** Quieres que el cierre sea a las 22:00 en lugar de 23:59.

**Solución:**
1. Editar `src/services/cierreScheduler.service.js`:
   ```javascript
   CIERRE_CRON_SCHEDULE: '0 0 22 * * *',  // 22:00:00
   ```

2. Reiniciar el scheduler:
   ```bash
   POST /api/scheduler/restart
   ```

### Caso 5: Detener Cierres Automáticos Temporalmente

**Escenario:** Vas a hacer mantenimiento y no quieres que se ejecuten cierres.

**Solución:**
1. Detener el scheduler:
   ```bash
   POST /api/scheduler/stop
   ```

2. Hacer mantenimiento...

3. Reiniciar el scheduler:
   ```bash
   POST /api/scheduler/start
   ```

---

## 🔧 Troubleshooting

### Problema 1: El Scheduler No Inicia

**Síntomas:**
- No ves mensajes de "Scheduler iniciado" en los logs
- El cierre automático no se ejecuta

**Solución:**
1. Verificar logs del backend:
   ```bash
   docker logs tiktendry-backend --tail 100 | grep -i scheduler
   ```

2. Si hay error de sintaxis, verificar que no haya caracteres especiales en comentarios

3. Verificar que `node-cron` está instalado:
   ```bash
   docker exec tiktendry-backend npm list node-cron
   ```

### Problema 2: Cierre No Se Ejecuta a las 23:59

**Síntomas:**
- El scheduler está corriendo pero no ejecuta el cierre

**Solución:**
1. Verificar configuración de cron:
   ```bash
   GET /api/scheduler/stats
   ```

2. Verificar zona horaria:
   ```bash
   docker exec tiktendry-backend date
   ```

3. Ejecutar cierre manual para probar:
   ```bash
   POST /api/scheduler/run-manual
   ```

### Problema 3: Discrepancia Alta en Cierre Automático

**Síntomas:**
- El cierre automático genera alertas de discrepancia alta

**Causas posibles:**
1. **Gastos aprobados no retirados de la caja** (comportamiento normal)
2. **Ventas con descuentos** no calculados correctamente
3. **Errores en registro de ventas**

**Solución:**
1. Revisar gastos aprobados del día:
   ```bash
   GET /api/gastos-personal/admin/daily-summary/2025-10-10
   ```

2. Revisar ventas del día:
   ```sql
   SELECT * FROM ventas WHERE DATE(fecha) = '2025-10-10';
   ```

3. Si es necesario, editar el cierre manualmente desde el frontend

### Problema 4: Falla la Conexión a la Base de Datos

**Síntomas:**
- Error "getaddrinfo ENOTFOUND db"

**Causas:**
- El servicio se ejecuta fuera del contenedor Docker

**Solución:**
- Usar los endpoints de la API en lugar de ejecutar scripts directos
- Si necesitas ejecutar desde código, hacerlo dentro del contenedor:
  ```bash
  docker exec tiktendry-backend node /app/tu-script.js
  ```

---

## 📚 Archivos Creados/Modificados

### Archivos Nuevos
1. `Backend/src/services/autoCierreCaja.service.js` - Servicio de cierre automático
2. `Backend/src/services/cierreScheduler.service.js` - Scheduler con node-cron
3. `Backend/src/controllers/scheduler.controller.js` - Controlador de API
4. `Backend/src/routes/scheduler.routes.js` - Rutas de API
5. `Backend/test-cierre-10-oct.js` - Script de prueba
6. `Backend/CIERRE_AUTOMATICO_GUIA.md` - Esta guía

### Archivos Modificados
1. `Backend/src/index.js` - Agregado inicio del scheduler
2. `Backend/src/app.js` - Agregadas rutas del scheduler
3. `Backend/package.json` - Agregadas dependencias (node-cron)

---

## 🎯 Próximos Pasos Recomendados

1. **Probar el Cierre del 10 de Octubre:**
   ```bash
   POST /api/scheduler/run-for-date
   { "fecha": "2025-10-10" }
   ```

2. **Monitorear los Primeros Días:**
   - Revisar logs diariamente
   - Verificar que los cierres se crean correctamente
   - Ajustar configuración si es necesario

3. **Configurar Alertas (Opcional):**
   - Agregar webhook o email cuando hay discrepancias altas
   - Notificar si el cierre automático falla

4. **Backup de Seguridad:**
   - Implementar backup automático de la tabla `cierres_caja`

---

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisar los logs del scheduler:
   ```bash
   GET /api/scheduler/logs?limit=100
   ```

2. Ver estadísticas del sistema:
   ```bash
   GET /api/scheduler/stats
   ```

3. Consultar esta guía

---

**Fecha de creación:** 11 de Octubre 2025
**Versión:** 2.0.0
**Autor:** Sistema ERP Toro Loco
**Estado:** ✅ IMPLEMENTADO Y OPERACIONAL
