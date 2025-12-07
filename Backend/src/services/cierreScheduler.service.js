/**
 * ============================================================================
 * SCHEDULER DE CIERRE AUTOMÁTICO DE CAJA
 * ============================================================================
 *
 * Este servicio gestiona la programación y ejecución automática de cierres
 * de caja usando node-cron.
 *
 * FUNCIONALIDADES:
 * ---------------
 * - Programa ejecución diaria a las 23:59:00 hora de Lima
 * - Maneja múltiples tareas programadas (cierre diario, reportes, etc.)
 * - Permite iniciar/detener el scheduler
 * - Ejecutar cierres manuales bajo demanda
 * - Monitoreo del estado de las tareas
 * - Logs detallados de ejecuciones
 *
 * SINTAXIS DE CRON:
 * -----------------
 * Los trabajos cron usan la siguiente sintaxis:
 *
 *    ┌────────────── segundo (0-59, opcional)
 *    │ ┌──────────── minuto (0-59)
 *    │ │ ┌────────── hora (0-23)
 *    │ │ │ ┌──────── día del mes (1-31)
 *    │ │ │ │ ┌────── mes (1-12)
 *    │ │ │ │ │ ┌──── día de la semana (0-7, 0 y 7 = domingo)
 *    │ │ │ │ │ │
 *    * * * * * *
 *
 * EJEMPLOS:
 * --------
 * '0 59 23 * * *'   - A las 23:59:00 todos los días
 * '0 0 0 * * *'     - A las 00:00:00 todos los días (medianoche)
 * '0 30 23 * * 1-5' - A las 23:30:00 de lunes a viernes
 * '0 0 *\/6 * * *'  - Cada 6 horas (escapado para evitar error)
 * '0 *\/30 * * * *' - Cada 30 minutos (escapado para evitar error)
 *
 * ZONA HORARIA:
 * ------------
 * Todas las tareas se ejecutan en timezone 'America/Lima' (UTC-5)
 *
 * @author Sistema ERP Toro Loco
 * @version 2.0.0
 * @since 2025-10-11
 * ============================================================================
 */

const cron = require('node-cron');
const moment = require('moment-timezone');
const autoCierreCajaService = require('./autoCierreCaja.service');

/**
 * Configuración del scheduler
 */
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

/**
 * ============================================================================
 * CLASE: CierreSchedulerService
 * ============================================================================
 *
 * Gestiona todas las tareas programadas relacionadas con cierres de caja
 */
class CierreSchedulerService {
  constructor() {
    this.config = SCHEDULER_CONFIG;
    this.tasks = new Map();
    this.isRunning = false;
    this.logs = [];
    this.startTime = null;
  }

  /**
   * Agrega un log al historial
   * @param {string} level - Nivel del log
   * @param {string} message - Mensaje
   * @param {Object} data - Datos adicionales
   */
  addLog(level, message, data = null) {
    const logEntry = {
      timestamp: moment().tz(this.config.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
      level,
      message,
      data
    };

    this.logs.push(logEntry);

    // Mantener solo los últimos 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    if (this.config.VERBOSE_LOGGING) {
      const emoji = {
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        success: '✅'
      }[level] || 'ℹ️';

      console.log(`[Scheduler] ${emoji} ${logEntry.timestamp} - ${message}`);
      if (data) console.log('  Datos:', JSON.stringify(data, null, 2));
    }
  }

  /**
   * ============================================================================
   * MÉTODO: Iniciar Scheduler
   * ============================================================================
   *
   * Inicia todas las tareas programadas del scheduler.
   *
   * Este método:
   * 1. Valida que el scheduler no esté ya corriendo
   * 2. Crea la tarea de cierre automático diario
   * 3. Opcionalmente ejecuta un cierre inmediato
   * 4. Marca el scheduler como activo
   *
   * @returns {Object} Estado del inicio
   */
  async start() {
    if (this.isRunning) {
      this.addLog('warn', 'Scheduler ya está en ejecución');
      return {
        success: false,
        message: 'Scheduler ya está corriendo'
      };
    }

    this.addLog('info', '🚀 Iniciando Cierre Scheduler...');
    this.startTime = moment().tz(this.config.TIMEZONE);

    try {
      // ========================================
      // TAREA 1: Cierre Automático Diario
      // ========================================
      this.createDailyCierreTask();

      // ========================================
      // TAREA 2: Recordatorio de Cierre Manual (Opcional)
      // ========================================
      // Podrías agregar una tarea que a las 22:00 verifique si hay ventas
      // y envíe un recordatorio para cerrar manualmente
      // this.createReminderTask();

      // ========================================
      // TAREA 3: Limpieza de Logs Antiguos (Opcional)
      // ========================================
      // Podrías agregar una tarea semanal que limpie logs antiguos
      // this.createLogCleanupTask();

      this.isRunning = true;

      this.addLog('success', '✅ Scheduler iniciado exitosamente', {
        tasks_count: this.tasks.size,
        timezone: this.config.TIMEZONE,
        cierre_schedule: this.config.CIERRE_CRON_SCHEDULE,
        start_time: this.startTime.format('YYYY-MM-DD HH:mm:ss')
      });

      // Ejecutar cierre inmediatamente si está configurado
      if (this.config.RUN_ON_STARTUP) {
        this.addLog('info', '⚡ Ejecutando cierre inmediato (RUN_ON_STARTUP=true)...');
        await this.runManualCierre();
      }

      return {
        success: true,
        message: 'Scheduler iniciado exitosamente',
        tasks: Array.from(this.tasks.keys()),
        start_time: this.startTime.toISOString()
      };

    } catch (error) {
      this.addLog('error', `❌ Error al iniciar scheduler: ${error.message}`, {
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * ============================================================================
   * MÉTODO: Crear Tarea de Cierre Diario
   * ============================================================================
   *
   * Crea y programa la tarea de cierre automático diario.
   *
   * IMPORTANTE: Esta tarea se ejecuta ANTES de medianoche (23:59)
   * para cerrar el día ACTUAL. Si se ejecutara a las 00:00, cerraría
   * el día ANTERIOR, lo cual puede ser confuso.
   *
   * OPCIONES DE CRON:
   * ----------------
   * - scheduled: true (la tarea está activa)
   * - timezone: 'America/Lima' (hora de Perú)
   *
   * FLUJO:
   * -----
   * 1. Se ejecuta el callback a las 23:59:00
   * 2. Llama al servicio de cierre automático
   * 3. Registra resultado en logs
   * 4. Maneja errores sin detener el scheduler
   */
  createDailyCierreTask() {
    const taskName = 'cierre-automatico-diario';

    this.addLog('info', `📋 Creando tarea: ${taskName}`);

    try {
      // Validar expresión cron
      if (!cron.validate(this.config.CIERRE_CRON_SCHEDULE)) {
        throw new Error(`Expresión cron inválida: ${this.config.CIERRE_CRON_SCHEDULE}`);
      }

      // Crear tarea programada
      const task = cron.schedule(
        this.config.CIERRE_CRON_SCHEDULE,
        async () => {
          const executionTime = moment().tz(this.config.TIMEZONE);
          this.addLog('info', `⏰ Ejecutando tarea programada: ${taskName}`, {
            scheduled_time: this.config.CIERRE_CRON_SCHEDULE,
            actual_time: executionTime.format('YYYY-MM-DD HH:mm:ss')
          });

          try {
            // Ejecutar cierre automático
            const result = await autoCierreCajaService.ejecutarCierreAutomatico();

            if (result.success) {
              this.addLog('success', '✅ Cierre automático ejecutado exitosamente', {
                fecha: result.fecha,
                cierre_id: result.cierre?.id_cierre,
                ventas_procesadas: result.ventas_procesadas
              });
            } else {
              this.addLog('warn', `⚠️  Cierre no ejecutado: ${result.message}`, result);
            }

          } catch (error) {
            this.addLog('error', `❌ Error en ejecución programada: ${error.message}`, {
              error: error.message,
              stack: error.stack
            });

            // No lanzar el error para evitar que el scheduler se detenga
            // El scheduler debe continuar aunque falle una ejecución
          }
        },
        {
          scheduled: true,
          timezone: this.config.TIMEZONE
        }
      );

      // Guardar referencia a la tarea
      this.tasks.set(taskName, {
        task,
        schedule: this.config.CIERRE_CRON_SCHEDULE,
        created_at: moment().tz(this.config.TIMEZONE).toISOString(),
        description: 'Cierre automático de caja diario a las 23:59',
        status: 'active'
      });

      this.addLog('success', `✅ Tarea ${taskName} creada exitosamente`, {
        schedule: this.config.CIERRE_CRON_SCHEDULE,
        next_execution: this.getNextExecutionTime(taskName)
      });

    } catch (error) {
      this.addLog('error', `❌ Error al crear tarea ${taskName}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ============================================================================
   * MÉTODO: Obtener próxima ejecución
   * ============================================================================
   *
   * Calcula la próxima fecha/hora en que se ejecutará una tarea.
   * Útil para monitoreo y debugging.
   *
   * NOTA: Esta es una estimación. La librería node-cron no expone
   * directamente la próxima ejecución, así que la calculamos.
   *
   * @param {string} taskName - Nombre de la tarea
   * @returns {string|null} Fecha de próxima ejecución
   */
  getNextExecutionTime(taskName) {
    const taskInfo = this.tasks.get(taskName);
    if (!taskInfo) return null;

    const schedule = taskInfo.schedule;

    // Para '0 59 23 * * *' (23:59:00 diario)
    // La próxima ejecución es hoy a las 23:59 si aún no pasó,
    // o mañana a las 23:59 si ya pasó

    const now = moment().tz(this.config.TIMEZONE);
    let next = moment().tz(this.config.TIMEZONE);

    // Extraer hora y minuto del cron (simplificado)
    // Asumimos formato '0 MM HH * * *'
    const parts = schedule.split(' ');
    if (parts.length >= 3) {
      const minute = parseInt(parts[1]);
      const hour = parseInt(parts[2]);

      next.set({ hour, minute, second: 0, millisecond: 0 });

      // Si ya pasó la hora hoy, programar para mañana
      if (next.isBefore(now)) {
        next.add(1, 'day');
      }

      return next.format('YYYY-MM-DD HH:mm:ss');
    }

    return null;
  }

  /**
   * ============================================================================
   * MÉTODO: Detener Scheduler
   * ============================================================================
   *
   * Detiene todas las tareas programadas del scheduler.
   *
   * IMPORTANTE: Al detener el scheduler:
   * - Todas las tareas cron se cancelan
   * - No se ejecutarán más cierres automáticos
   * - El servidor puede seguir corriendo normalmente
   * - Se puede reiniciar el scheduler llamando a start()
   */
  stop() {
    if (!this.isRunning) {
      this.addLog('warn', 'Scheduler no está en ejecución');
      return {
        success: false,
        message: 'Scheduler no está corriendo'
      };
    }

    this.addLog('info', '🛑 Deteniendo scheduler...');

    try {
      // Detener todas las tareas
      let stoppedCount = 0;
      this.tasks.forEach((taskInfo, taskName) => {
        if (taskInfo.task) {
          taskInfo.task.stop();
          taskInfo.status = 'stopped';
          stoppedCount++;
          this.addLog('info', `⏸️  Tarea detenida: ${taskName}`);
        }
      });

      this.isRunning = false;

      this.addLog('success', `✅ Scheduler detenido. ${stoppedCount} tarea(s) detenida(s)`);

      return {
        success: true,
        message: `Scheduler detenido exitosamente`,
        tasks_stopped: stoppedCount
      };

    } catch (error) {
      this.addLog('error', `❌ Error al detener scheduler: ${error.message}`);
      throw error;
    }
  }

  /**
   * ============================================================================
   * MÉTODO: Reiniciar Scheduler
   * ============================================================================
   *
   * Detiene y reinicia el scheduler.
   * Útil para aplicar cambios de configuración.
   */
  async restart() {
    this.addLog('info', '🔄 Reiniciando scheduler...');

    this.stop();

    // Limpiar tareas anteriores
    this.tasks.clear();

    // Esperar un momento antes de reiniciar
    await new Promise(resolve => setTimeout(resolve, 1000));

    return await this.start();
  }

  /**
   * ============================================================================
   * MÉTODO: Ejecutar cierre manual
   * ============================================================================
   *
   * Ejecuta un cierre automático manualmente, sin esperar a la hora programada.
   *
   * CASOS DE USO:
   * ------------
   * - Testing del sistema
   * - Cierre urgente fuera de horario
   * - Recuperar cierres perdidos
   * - Verificar que el sistema funcione correctamente
   *
   * @returns {Promise<Object>} Resultado del cierre
   */
  async runManualCierre() {
    this.addLog('info', '🔧 Ejecutando cierre manual...');

    try {
      const result = await autoCierreCajaService.ejecutarCierreAutomatico();

      if (result.success) {
        this.addLog('success', '✅ Cierre manual completado', result);
      } else {
        this.addLog('warn', `⚠️  Cierre manual no completado: ${result.message}`, result);
      }

      return result;

    } catch (error) {
      this.addLog('error', `❌ Error en cierre manual: ${error.message}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ============================================================================
   * MÉTODO: Ejecutar cierre para fecha específica
   * ============================================================================
   *
   * Ejecuta un cierre automático para una fecha pasada específica.
   *
   * IMPORTANTE: Útil para recuperar cierres que no se ejecutaron en su momento.
   * Por ejemplo, si el servidor estuvo caído el 10/10, podemos ejecutar:
   * await scheduler.runCierreForDate('2025-10-10');
   *
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Object>} Resultado del cierre
   */
  async runCierreForDate(fecha) {
    this.addLog('info', `🔧 Ejecutando cierre para fecha específica: ${fecha}`);

    try {
      const result = await autoCierreCajaService.ejecutarCierreParaFecha(fecha);

      if (result.success) {
        this.addLog('success', `✅ Cierre para ${fecha} completado`, result);
      } else {
        this.addLog('warn', `⚠️  Cierre para ${fecha} no completado: ${result.message}`, result);
      }

      return result;

    } catch (error) {
      this.addLog('error', `❌ Error en cierre para ${fecha}: ${error.message}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ============================================================================
   * MÉTODO: Obtener estadísticas del scheduler
   * ============================================================================
   *
   * Retorna información completa sobre el estado del scheduler.
   *
   * @returns {Object} Estadísticas del scheduler
   */
  getStats() {
    const tasks = [];
    this.tasks.forEach((taskInfo, taskName) => {
      tasks.push({
        name: taskName,
        schedule: taskInfo.schedule,
        status: taskInfo.status,
        created_at: taskInfo.created_at,
        description: taskInfo.description,
        next_execution: this.getNextExecutionTime(taskName)
      });
    });

    const uptime = this.startTime
      ? moment.duration(moment().diff(this.startTime)).humanize()
      : null;

    return {
      isRunning: this.isRunning,
      startTime: this.startTime?.format('YYYY-MM-DD HH:mm:ss'),
      uptime: uptime,
      timezone: this.config.TIMEZONE,
      config: this.config,
      tasks: tasks,
      tasks_count: this.tasks.size,
      logs_count: this.logs.length,
      recent_logs: this.logs.slice(-10),
      auto_cierre_stats: autoCierreCajaService.getStats()
    };
  }

  /**
   * ============================================================================
   * MÉTODO: Obtener logs del scheduler
   * ============================================================================
   *
   * @returns {Array} Array de logs
   */
  getLogs() {
    return this.logs;
  }

  /**
   * ============================================================================
   * MÉTODO: Limpiar logs
   * ============================================================================
   */
  clearLogs() {
    this.logs = [];
    this.addLog('info', 'Logs del scheduler limpiados');
  }

  /**
   * ============================================================================
   * MÉTODO: Actualizar configuración
   * ============================================================================
   *
   * Actualiza la configuración del scheduler.
   * Requiere reiniciar para aplicar cambios.
   *
   * @param {Object} newConfig - Nueva configuración
   */
  updateConfig(newConfig) {
    this.addLog('info', '⚙️  Actualizando configuración del scheduler', newConfig);

    Object.assign(this.config, newConfig);

    this.addLog('success', '✅ Configuración actualizada. Reinicie el scheduler para aplicar cambios.');

    return {
      success: true,
      message: 'Configuración actualizada. Requiere reinicio.',
      new_config: this.config
    };
  }
}

// Exportar instancia única del scheduler (Singleton)
const cierreScheduler = new CierreSchedulerService();

module.exports = cierreScheduler;
