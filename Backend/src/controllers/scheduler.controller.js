/**
 * ============================================================================
 * CONTROLADOR DE SCHEDULER
 * ============================================================================
 *
 * Este controlador proporciona endpoints REST para gestionar y monitorear
 * el scheduler de cierre automático de caja.
 *
 * ENDPOINTS DISPONIBLES:
 * ---------------------
 * GET    /api/scheduler/status        - Obtener estado del scheduler
 * GET    /api/scheduler/stats         - Obtener estadísticas completas
 * GET    /api/scheduler/logs          - Obtener logs del scheduler
 * POST   /api/scheduler/start         - Iniciar scheduler
 * POST   /api/scheduler/stop          - Detener scheduler
 * POST   /api/scheduler/restart       - Reiniciar scheduler
 * POST   /api/scheduler/run-manual    - Ejecutar cierre manual
 * POST   /api/scheduler/run-for-date  - Ejecutar cierre para fecha específica
 * DELETE /api/scheduler/logs          - Limpiar logs
 *
 * SEGURIDAD:
 * ---------
 * Todos los endpoints requieren autenticación JWT.
 * Solo administradores (role 1 o 2) pueden acceder.
 *
 * @author Sistema ERP Toro Loco
 * @version 2.0.0
 * @since 2025-10-11
 * ============================================================================
 */

const cierreScheduler = require('../services/cierreScheduler.service');
const autoCierreCajaService = require('../services/autoCierreCaja.service');

const schedulerController = {
  /**
   * ============================================================================
   * GET /api/scheduler/status
   * ============================================================================
   * Obtiene el estado básico del scheduler
   */
  getStatus: async (req, res) => {
    try {
      const stats = cierreScheduler.getStats();

      return res.status(200).json({
        success: true,
        data: {
          isRunning: stats.isRunning,
          startTime: stats.startTime,
          uptime: stats.uptime,
          tasks_count: stats.tasks_count,
          tasks: stats.tasks
        }
      });
    } catch (error) {
      console.error('Error al obtener estado del scheduler:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener estado del scheduler',
        error: error.message
      });
    }
  },

  /**
   * ============================================================================
   * GET /api/scheduler/stats
   * ============================================================================
   * Obtiene estadísticas completas del scheduler y servicio de cierre
   */
  getStats: async (req, res) => {
    try {
      const schedulerStats = cierreScheduler.getStats();
      const autoCierreStats = autoCierreCajaService.getStats();

      return res.status(200).json({
        success: true,
        data: {
          scheduler: {
            isRunning: schedulerStats.isRunning,
            startTime: schedulerStats.startTime,
            uptime: schedulerStats.uptime,
            timezone: schedulerStats.timezone,
            config: schedulerStats.config,
            tasks: schedulerStats.tasks,
            tasks_count: schedulerStats.tasks_count,
            logs_count: schedulerStats.logs_count
          },
          auto_cierre: {
            isRunning: autoCierreStats.isRunning,
            executionCount: autoCierreStats.executionCount,
            lastExecution: autoCierreStats.lastExecution,
            config: autoCierreStats.config,
            logs_count: autoCierreStats.logsCount
          }
        }
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  },

  /**
   * ============================================================================
   * GET /api/scheduler/logs
   * ============================================================================
   * Obtiene los logs del scheduler y del servicio de cierre
   *
   * Query params opcionales:
   * - limit: Número máximo de logs a retornar (default: 50)
   * - service: 'scheduler' | 'auto_cierre' | 'both' (default: 'both')
   */
  getLogs: async (req, res) => {
    try {
      const { limit = 50, service = 'both' } = req.query;
      const limitNum = parseInt(limit);

      const response = {
        success: true,
        data: {}
      };

      if (service === 'scheduler' || service === 'both') {
        const schedulerLogs = cierreScheduler.getLogs();
        response.data.scheduler_logs = schedulerLogs.slice(-limitNum);
      }

      if (service === 'auto_cierre' || service === 'both') {
        const autoCierreLogs = autoCierreCajaService.getLogs();
        response.data.auto_cierre_logs = autoCierreLogs.slice(-limitNum);
      }

      return res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener logs',
        error: error.message
      });
    }
  },

  /**
   * ============================================================================
   * POST /api/scheduler/start
   * ============================================================================
   * Inicia el scheduler si está detenido
   */
  start: async (req, res) => {
    try {
      const result = await cierreScheduler.start();

      return res.status(200).json({
        success: result.success,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error al iniciar scheduler:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al iniciar scheduler',
        error: error.message
      });
    }
  },

  /**
   * ============================================================================
   * POST /api/scheduler/stop
   * ============================================================================
   * Detiene el scheduler si está corriendo
   */
  stop: async (req, res) => {
    try {
      const result = cierreScheduler.stop();

      return res.status(200).json({
        success: result.success,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error al detener scheduler:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al detener scheduler',
        error: error.message
      });
    }
  },

  /**
   * ============================================================================
   * POST /api/scheduler/restart
   * ============================================================================
   * Reinicia el scheduler
   */
  restart: async (req, res) => {
    try {
      const result = await cierreScheduler.restart();

      return res.status(200).json({
        success: result.success,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error al reiniciar scheduler:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al reiniciar scheduler',
        error: error.message
      });
    }
  },

  /**
   * ============================================================================
   * POST /api/scheduler/run-manual
   * ============================================================================
   * Ejecuta un cierre automático manualmente, sin esperar a la hora programada
   *
   * Útil para:
   * - Testing del sistema
   * - Cierre urgente fuera de horario
   * - Verificar funcionamiento
   */
  runManual: async (req, res) => {
    try {
      const result = await cierreScheduler.runManualCierre();

      const statusCode = result.success ? 200 : 400;

      return res.status(statusCode).json({
        success: result.success,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error al ejecutar cierre manual:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al ejecutar cierre manual',
        error: error.message
      });
    }
  },

  /**
   * ============================================================================
   * POST /api/scheduler/run-for-date
   * ============================================================================
   * Ejecuta un cierre automático para una fecha específica
   *
   * Body params:
   * - fecha: Fecha en formato YYYY-MM-DD (requerido)
   *
   * Útil para recuperar cierres de días anteriores que no se ejecutaron
   *
   * Ejemplo:
   * POST /api/scheduler/run-for-date
   * {
   *   "fecha": "2025-10-10"
   * }
   */
  runForDate: async (req, res) => {
    try {
      const { fecha } = req.body;

      if (!fecha) {
        return res.status(400).json({
          success: false,
          message: 'El parámetro "fecha" es requerido',
          example: { fecha: '2025-10-10' }
        });
      }

      // Validar formato de fecha
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fecha)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido. Use YYYY-MM-DD',
          example: { fecha: '2025-10-10' }
        });
      }

      const result = await cierreScheduler.runCierreForDate(fecha);

      const statusCode = result.success ? 200 : 400;

      return res.status(statusCode).json({
        success: result.success,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error al ejecutar cierre para fecha:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al ejecutar cierre para fecha',
        error: error.message
      });
    }
  },

  /**
   * ============================================================================
   * DELETE /api/scheduler/logs
   * ============================================================================
   * Limpia los logs del scheduler y/o del servicio de cierre
   *
   * Query params opcionales:
   * - service: 'scheduler' | 'auto_cierre' | 'both' (default: 'both')
   */
  clearLogs: async (req, res) => {
    try {
      const { service = 'both' } = req.query;

      if (service === 'scheduler' || service === 'both') {
        cierreScheduler.clearLogs();
      }

      if (service === 'auto_cierre' || service === 'both') {
        autoCierreCajaService.clearLogs();
      }

      return res.status(200).json({
        success: true,
        message: `Logs de ${service} limpiados exitosamente`
      });
    } catch (error) {
      console.error('Error al limpiar logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al limpiar logs',
        error: error.message
      });
    }
  }
};

module.exports = schedulerController;
