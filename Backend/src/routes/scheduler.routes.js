/**
 * ============================================================================
 * RUTAS DEL SCHEDULER
 * ============================================================================
 *
 * Define los endpoints REST para gestionar el scheduler de cierre automático.
 *
 * SEGURIDAD:
 * Todas las rutas requieren autenticación JWT y rol de administrador.
 *
 * @author Sistema ERP Toro Loco
 * @version 2.0.0
 * @since 2025-10-11
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const schedulerController = require('../controllers/scheduler.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * Middleware de autorización para administradores
 * Solo usuarios con rol 1 (admin) o rol 2 (manager) pueden acceder
 */
const isAdmin = (req, res, next) => {
  if (req.user.id_role !== 1 && req.user.id_role !== 2) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a esta funcionalidad. Solo administradores.'
    });
  }
  next();
};

// ============================================================================
// RUTAS DE CONSULTA (GET)
// ============================================================================

/**
 * GET /api/scheduler/status
 * Obtiene el estado básico del scheduler
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "isRunning": true,
 *     "startTime": "2025-10-11 10:00:00",
 *     "uptime": "2 hours",
 *     "tasks_count": 1,
 *     "tasks": [...]
 *   }
 * }
 */
router.get('/status', authMiddleware, isAdmin, schedulerController.getStatus);

/**
 * GET /api/scheduler/stats
 * Obtiene estadísticas completas del scheduler y servicio de cierre
 *
 * Response incluye:
 * - Estado del scheduler
 * - Configuración
 * - Tareas programadas
 * - Estadísticas del servicio de cierre automático
 * - Logs recientes
 */
router.get('/stats', authMiddleware, isAdmin, schedulerController.getStats);

/**
 * GET /api/scheduler/logs
 * Obtiene los logs del scheduler
 *
 * Query params:
 * - limit: Número de logs (default: 50)
 * - service: 'scheduler' | 'auto_cierre' | 'both' (default: 'both')
 *
 * Ejemplos:
 * GET /api/scheduler/logs?limit=100
 * GET /api/scheduler/logs?service=scheduler&limit=20
 */
router.get('/logs', authMiddleware, isAdmin, schedulerController.getLogs);

// ============================================================================
// RUTAS DE ACCIÓN (POST)
// ============================================================================

/**
 * POST /api/scheduler/start
 * Inicia el scheduler si está detenido
 *
 * Body: (ninguno)
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Scheduler iniciado exitosamente",
 *   "data": { ... }
 * }
 */
router.post('/start', authMiddleware, isAdmin, schedulerController.start);

/**
 * POST /api/scheduler/stop
 * Detiene el scheduler
 *
 * Body: (ninguno)
 *
 * IMPORTANTE: Detener el scheduler detendrá todos los cierres automáticos
 * hasta que se reinicie.
 */
router.post('/stop', authMiddleware, isAdmin, schedulerController.stop);

/**
 * POST /api/scheduler/restart
 * Reinicia el scheduler
 *
 * Body: (ninguno)
 *
 * Útil para aplicar cambios de configuración.
 */
router.post('/restart', authMiddleware, isAdmin, schedulerController.restart);

/**
 * POST /api/scheduler/run-manual
 * Ejecuta un cierre automático manualmente, sin esperar a la hora programada
 *
 * Body: (ninguno)
 *
 * IMPORTANTE: Ejecuta el cierre para el día ACTUAL.
 * Si ya existe un cierre para hoy, no creará uno nuevo.
 *
 * Útil para:
 * - Testing del sistema
 * - Cierre urgente fuera de horario
 * - Verificar funcionamiento
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Cierre automático ejecutado correctamente",
 *   "data": {
 *     "fecha": "2025-10-11",
 *     "cierre": { ... },
 *     "ventas_procesadas": 25
 *   }
 * }
 */
router.post('/run-manual', authMiddleware, isAdmin, schedulerController.runManual);

/**
 * POST /api/scheduler/run-for-date
 * Ejecuta un cierre automático para una fecha específica
 *
 * Body:
 * {
 *   "fecha": "2025-10-10"  // Formato YYYY-MM-DD
 * }
 *
 * IMPORTANTE: Útil para recuperar cierres de días anteriores que no se ejecutaron.
 * Por ejemplo, si el servidor estuvo caído el 10/10, puedes ejecutar:
 *
 * POST /api/scheduler/run-for-date
 * { "fecha": "2025-10-10" }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Cierre creado exitosamente",
 *   "data": {
 *     "fecha": "2025-10-10",
 *     "cierre": { ... }
 *   }
 * }
 */
router.post('/run-for-date', authMiddleware, isAdmin, schedulerController.runForDate);

// ============================================================================
// RUTAS DE LIMPIEZA (DELETE)
// ============================================================================

/**
 * DELETE /api/scheduler/logs
 * Limpia los logs del scheduler y/o servicio de cierre
 *
 * Query params:
 * - service: 'scheduler' | 'auto_cierre' | 'both' (default: 'both')
 *
 * Ejemplos:
 * DELETE /api/scheduler/logs
 * DELETE /api/scheduler/logs?service=scheduler
 */
router.delete('/logs', authMiddleware, isAdmin, schedulerController.clearLogs);

module.exports = router;
