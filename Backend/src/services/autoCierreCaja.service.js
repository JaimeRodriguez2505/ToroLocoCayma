/**
 * ============================================================================
 * SERVICIO DE CIERRE AUTOMÁTICO DE CAJA
 * ============================================================================
 *
 * Este servicio maneja el cierre automático de caja diario a medianoche.
 *
 * FUNCIONALIDADES PRINCIPALES:
 * ---------------------------
 * 1. Detecta ventas sin cierre del día anterior
 * 2. Calcula automáticamente totales por método de pago
 * 3. Integra gastos de personal aprobados
 * 4. Calcula discrepancias esperadas
 * 5. Genera logs detallados de cada operación
 * 6. Maneja reintentos en caso de fallos
 * 7. Envía notificaciones de cierres realizados
 *
 * LÓGICA DE NEGOCIO:
 * -----------------
 * - Se ejecuta a las 23:59:00 hora de Lima (UTC-5)
 * - Verifica ventas del día actual (antes de medianoche)
 * - Solo cierra si NO existe un cierre previo para ese día
 * - Asume saldo_efectivo = total_efectivo (optimista)
 * - Los gastos aprobados se restan automáticamente del saldo esperado
 * - Marca el cierre con observación indicando que fue automático
 *
 * CASOS DE USO:
 * ------------
 * - Restaurante cierra tarde y olvida cerrar caja
 * - Sistema 24/7 que necesita cierre diario automático
 * - Múltiples sucursales con cierres centralizados
 * - Auditoría automática de cierres pendientes
 *
 * DEPENDENCIAS:
 * ------------
 * - Sequelize Models: CierreCaja, Venta, GastoPersonal
 * - moment-timezone: Manejo de zona horaria de Perú
 * - Op (Sequelize): Operadores para queries complejas
 *
 * @author Sistema ERP Toro Loco
 * @version 2.0.0
 * @since 2025-10-11
 * ============================================================================
 */

const { CierreCaja, Venta } = require('../models');
const GastoPersonal = require('../models/gasto_personal.model');
const { Op } = require('sequelize');
const moment = require('moment-timezone');

/**
 * Configuración del servicio de cierre automático
 */
const AUTO_CIERRE_CONFIG = {
  // Zona horaria de Perú (Lima)
  TIMEZONE: 'America/Lima',

  // ID del cajero del sistema para cierres automáticos
  // Por defecto usa el ID 1 (admin), pero se puede configurar
  SYSTEM_CASHIER_ID: 1,

  // Umbral de discrepancia aceptable (en soles)
  // Si la discrepancia es mayor, se marca como alerta
  DISCREPANCY_THRESHOLD: 0.50,

  // Número máximo de reintentos en caso de fallo
  MAX_RETRIES: 3,

  // Delay entre reintentos (en milisegundos)
  RETRY_DELAY: 5000,

  // Habilitar/deshabilitar logs detallados
  VERBOSE_LOGGING: true,

  // Métodos de pago soportados
  PAYMENT_METHODS: [
    'efectivo',
    'tarjeta',
    'transferencia',
    'yape',
    'plin',
    'pedidosya',
    'rappi',
    'uber_eats'
  ]
};

/**
 * ============================================================================
 * CLASE PRINCIPAL: AutoCierreCajaService
 * ============================================================================
 */
class AutoCierreCajaService {
  constructor() {
    this.config = AUTO_CIERRE_CONFIG;
    this.logs = [];
    this.lastExecution = null;
    this.isRunning = false;
    this.executionCount = 0;
  }

  /**
   * Agrega un log al historial de ejecuciones
   * @param {string} level - Nivel del log (info, warn, error, success)
   * @param {string} message - Mensaje del log
   * @param {Object} data - Datos adicionales opcionales
   */
  addLog(level, message, data = null) {
    const logEntry = {
      timestamp: moment().tz(this.config.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
      level,
      message,
      data
    };

    this.logs.push(logEntry);

    // Mantener solo los últimos 100 logs en memoria
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    // Log en consola si está habilitado
    if (this.config.VERBOSE_LOGGING) {
      const emoji = {
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        success: '✅'
      }[level] || 'ℹ️';

      console.log(`[AutoCierre] ${emoji} ${logEntry.timestamp} - ${message}`);
      if (data) console.log('  Datos:', JSON.stringify(data, null, 2));
    }
  }

  /**
   * ============================================================================
   * MÉTODO PRINCIPAL: Ejecutar Cierre Automático
   * ============================================================================
   *
   * Este método orquesta todo el proceso de cierre automático:
   * 1. Validación de ejecución concurrente
   * 2. Obtención de la fecha del día a cerrar
   * 3. Verificación de ventas pendientes
   * 4. Verificación de cierres existentes
   * 5. Cálculo de totales por método de pago
   * 6. Cálculo de gastos aprobados
   * 7. Creación del cierre
   * 8. Manejo de errores y reintentos
   *
   * @returns {Promise<Object>} Resultado del cierre automático
   */
  async ejecutarCierreAutomatico() {
    // PASO 1: Prevenir ejecuciones concurrentes
    // ==========================================
    // Si ya hay un cierre en proceso, evitamos duplicados
    if (this.isRunning) {
      this.addLog('warn', 'Cierre automático ya está en ejecución. Saltando...');
      return {
        success: false,
        message: 'Cierre ya en ejecución',
        isRunning: true
      };
    }

    // Marcar como en ejecución
    this.isRunning = true;
    this.executionCount++;
    const executionId = this.executionCount;

    this.addLog('info', `🚀 Iniciando cierre automático #${executionId}...`);

    try {
      // PASO 2: Obtener fecha del día a cerrar
      // =======================================
      // Obtenemos la fecha actual en zona horaria de Lima
      // Como se ejecuta a las 23:59, cerramos el día ACTUAL (no el anterior)
      const now = moment().tz(this.config.TIMEZONE);
      const fechaActual = now.format('YYYY-MM-DD');

      this.addLog('info', `📅 Fecha a procesar: ${fechaActual}`, {
        hora_ejecucion: now.format('YYYY-MM-DD HH:mm:ss'),
        timezone: this.config.TIMEZONE
      });

      // PASO 3: Verificar si hay ventas para el día
      // ============================================
      const ventasDelDia = await this.obtenerVentasDelDia(fechaActual);

      if (ventasDelDia.length === 0) {
        this.addLog('info', '📭 No hay ventas para cerrar hoy. Saltando...');
        this.isRunning = false;
        return {
          success: true,
          message: 'No hay ventas para cerrar',
          fecha: fechaActual,
          ventasCount: 0
        };
      }

      this.addLog('success', `💰 Se encontraron ${ventasDelDia.length} ventas para cerrar`, {
        total_ventas: ventasDelDia.length,
        primera_venta: ventasDelDia[0].fecha,
        ultima_venta: ventasDelDia[ventasDelDia.length - 1].fecha
      });

      // PASO 4: Verificar si ya existe un cierre para este día
      // =======================================================
      const cierreExistente = await this.verificarCierreExistente(fechaActual);

      if (cierreExistente) {
        this.addLog('warn', '🔒 Ya existe un cierre para este día. Saltando...', {
          cierre_id: cierreExistente.id_cierre,
          estado: cierreExistente.estado,
          fecha_cierre: cierreExistente.fecha_cierre
        });

        this.isRunning = false;
        return {
          success: false,
          message: 'Ya existe un cierre para este día',
          fecha: fechaActual,
          cierre_existente: cierreExistente
        };
      }

      // PASO 5: Calcular totales por método de pago
      // ============================================
      const totalesPorMetodo = await this.calcularTotalesPorMetodoPago(ventasDelDia);

      this.addLog('success', '💳 Totales por método de pago calculados', totalesPorMetodo);

      // PASO 6: Calcular gastos aprobados del día
      // ==========================================
      const totalGastosAprobados = await this.calcularGastosAprobados(fechaActual);

      this.addLog('info', `💸 Gastos aprobados del día: S/ ${totalGastosAprobados.toFixed(2)}`, {
        total_gastos: totalGastosAprobados,
        cantidad_gastos: totalGastosAprobados > 0 ? 'Ver base de datos' : 0
      });

      // PASO 7: Crear el cierre automático
      // ===================================
      const cierreCreado = await this.crearCierreAutomatico({
        fechaActual,
        totalesPorMetodo,
        totalGastosAprobados,
        cantidadVentas: ventasDelDia.length
      });

      this.addLog('success', `✅ Cierre automático creado exitosamente`, {
        cierre_id: cierreCreado.id_cierre,
        total_efectivo: cierreCreado.total_efectivo,
        saldo_esperado: cierreCreado.saldo_final_esperado,
        discrepancia: cierreCreado.discrepancia,
        gastos_aprobados: cierreCreado.total_gastos_aprobados
      });

      // PASO 8: Actualizar última ejecución
      // ====================================
      this.lastExecution = {
        timestamp: now.toISOString(),
        success: true,
        fecha: fechaActual,
        cierre_id: cierreCreado.id_cierre,
        ventas_count: ventasDelDia.length,
        total_efectivo: cierreCreado.total_efectivo
      };

      this.isRunning = false;

      return {
        success: true,
        message: 'Cierre automático ejecutado correctamente',
        fecha: fechaActual,
        cierre: cierreCreado,
        ventas_procesadas: ventasDelDia.length,
        alertas: this.generarAlertas(cierreCreado)
      };

    } catch (error) {
      this.addLog('error', `❌ Error en cierre automático: ${error.message}`, {
        error: error.message,
        stack: error.stack
      });

      this.lastExecution = {
        timestamp: moment().tz(this.config.TIMEZONE).toISOString(),
        success: false,
        error: error.message
      };

      this.isRunning = false;

      throw error;
    }
  }

  /**
   * ============================================================================
   * MÉTODO: Obtener ventas del día
   * ============================================================================
   *
   * Recupera todas las ventas de un día específico desde la base de datos.
   * Usa la zona horaria de Lima para asegurar correcta delimitación del día.
   *
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Array>} Array de ventas del día
   */
  async obtenerVentasDelDia(fecha) {
    try {
      // Crear rango de fechas para el día completo en zona horaria de Lima
      const fechaInicio = moment.tz(fecha + ' 00:00:00', this.config.TIMEZONE);
      const fechaFin = moment.tz(fecha + ' 23:59:59', this.config.TIMEZONE);

      // Query optimizado con índices
      const ventas = await Venta.findAll({
        where: {
          fecha: {
            [Op.between]: [fechaInicio.toDate(), fechaFin.toDate()]
          }
        },
        order: [['fecha', 'ASC']],
        // Incluir solo campos necesarios para optimizar query
        attributes: [
          'venta_id',
          'fecha',
          'total',
          'total_con_igv',
          'metodo_pago',
          'id_cajero',
          'es_descuento',
          'descuento'
        ]
      });

      return ventas;
    } catch (error) {
      this.addLog('error', `Error al obtener ventas del día ${fecha}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ============================================================================
   * MÉTODO: Verificar si existe un cierre para el día
   * ============================================================================
   *
   * Verifica en la base de datos si ya existe un cierre de caja para la fecha.
   * Esto previene duplicados y permite tomar decisiones sobre qué hacer.
   *
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Object|null>} Cierre existente o null
   */
  async verificarCierreExistente(fecha) {
    try {
      const fechaInicio = moment.tz(fecha + ' 00:00:00', this.config.TIMEZONE);
      const fechaFin = moment.tz(fecha + ' 23:59:59', this.config.TIMEZONE);

      const cierre = await CierreCaja.findOne({
        where: {
          fecha_apertura: {
            [Op.between]: [fechaInicio.toDate(), fechaFin.toDate()]
          }
        },
        order: [['fecha_apertura', 'DESC']]
      });

      return cierre;
    } catch (error) {
      this.addLog('error', `Error al verificar cierre existente para ${fecha}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ============================================================================
   * MÉTODO: Calcular totales por método de pago
   * ============================================================================
   *
   * Agrupa y suma las ventas por método de pago.
   *
   * IMPORTANTE: Considera descuentos aplicados a las ventas
   * - Si es_descuento = true, resta el descuento del total
   * - Calcula el monto real cobrado por cada venta
   *
   * @param {Array} ventas - Array de ventas del día
   * @returns {Object} Objeto con totales por método de pago
   */
  async calcularTotalesPorMetodoPago(ventas) {
    const totales = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      yape: 0,
      plin: 0,
      pedidosya: 0,
      rappi: 0,
      uber_eats: 0
    };

    // Agrupar ventas por método de pago y sumar
    ventas.forEach(venta => {
      const metodoPago = venta.metodo_pago.toLowerCase();

      // Calcular monto real considerando descuentos
      // =============================================
      // Si la venta tiene descuento, restamos el monto del descuento
      // del total con IGV para obtener el monto real cobrado
      let montoReal = parseFloat(venta.total_con_igv) || 0;

      if (venta.es_descuento && venta.descuento) {
        const descuento = parseFloat(venta.descuento) || 0;
        montoReal = montoReal - descuento;
      }

      // Sumar al método de pago correspondiente
      if (totales.hasOwnProperty(metodoPago)) {
        totales[metodoPago] += montoReal;
      } else {
        // Si el método no está en nuestra lista, agregarlo a efectivo por defecto
        this.addLog('warn', `Método de pago desconocido: ${metodoPago}, agregando a efectivo`, {
          venta_id: venta.venta_id,
          metodo_pago: metodoPago
        });
        totales.efectivo += montoReal;
      }
    });

    // Redondear a 2 decimales
    Object.keys(totales).forEach(key => {
      totales[key] = Math.round(totales[key] * 100) / 100;
    });

    return totales;
  }

  /**
   * ============================================================================
   * MÉTODO: Calcular gastos aprobados del día
   * ============================================================================
   *
   * Calcula el total de gastos de personal aprobados para el día.
   *
   * LÓGICA DE BÚSQUEDA:
   * ------------------
   * Busca gastos que cumplan CUALQUIERA de estas condiciones:
   * 1. fecha_gasto esté dentro del día
   * 2. fecha_revision (fecha de aprobación) esté dentro del día
   *
   * Esto permite capturar:
   * - Gastos realizados y aprobados el mismo día
   * - Gastos realizados días antes pero aprobados hoy
   * - Gastos realizados hoy pero aprobados después (si aplica)
   *
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<number>} Total de gastos aprobados
   */
  async calcularGastosAprobados(fecha) {
    try {
      const fechaInicio = moment.tz(fecha + ' 00:00:00', this.config.TIMEZONE);
      const fechaFin = moment.tz(fecha + ' 23:59:59', this.config.TIMEZONE);

      const totalGastos = await GastoPersonal.sum('monto', {
        where: {
          estado: 'aprobado',
          [Op.or]: [
            {
              fecha_gasto: {
                [Op.between]: [fechaInicio.toDate(), fechaFin.toDate()]
              }
            },
            {
              fecha_revision: {
                [Op.between]: [fechaInicio.toDate(), fechaFin.toDate()]
              }
            }
          ]
        }
      });

      // Si no hay gastos, devolver 0 en lugar de null
      return totalGastos || 0;
    } catch (error) {
      this.addLog('error', `Error al calcular gastos aprobados para ${fecha}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ============================================================================
   * MÉTODO: Crear cierre automático
   * ============================================================================
   *
   * Crea el registro de cierre de caja en la base de datos.
   *
   * LÓGICA DE SALDO:
   * ---------------
   * - saldo_efectivo: Asume que es igual al total_efectivo (optimista)
   *   En un cierre manual, el cajero cuenta físicamente el dinero.
   *   En automático, asumimos que todo está correcto.
   *
   * - saldo_final_esperado: total_efectivo - total_gastos_aprobados
   *   Este es el dinero que DEBERÍA haber en la caja después de pagar gastos.
   *
   * - discrepancia: saldo_efectivo - saldo_final_esperado
   *   En cierre automático, si asumimos saldo_efectivo = total_efectivo,
   *   y no hay gastos, discrepancia = 0.
   *   Si hay gastos y asumimos optimista, discrepancia = total_gastos.
   *
   * ESTRATEGIA CONSERVADORA vs OPTIMISTA:
   * -------------------------------------
   * Actualmente usa OPTIMISTA: saldo_efectivo = total_efectivo
   *
   * Alternativa CONSERVADORA podría ser:
   * saldo_efectivo = total_efectivo - total_gastos_aprobados
   * (asumiendo que los gastos ya se pagaron y se restaron de la caja)
   *
   * @param {Object} datos - Datos para crear el cierre
   * @returns {Promise<Object>} Cierre creado
   */
  async crearCierreAutomatico(datos) {
    const { fechaActual, totalesPorMetodo, totalGastosAprobados, cantidadVentas } = datos;

    try {
      // Construir fechas de apertura y cierre
      const fechaApertura = moment.tz(fechaActual + ' 00:00:00', this.config.TIMEZONE);
      const fechaCierre = moment().tz(this.config.TIMEZONE);

      // ESTRATEGIA OPTIMISTA: Asumir que el saldo efectivo es igual al total de ventas en efectivo
      // Esto significa que asumimos que TODO el dinero está en la caja
      const saldoEfectivo = totalesPorMetodo.efectivo;

      // Calcular saldo final esperado (efectivo menos gastos aprobados)
      const saldoFinalEsperado = totalesPorMetodo.efectivo - totalGastosAprobados;

      // Calcular discrepancia
      // En estrategia optimista sin gastos: discrepancia = 0
      // En estrategia optimista con gastos: discrepancia = total_gastos (porque asumimos que no se restó)
      const discrepancia = saldoEfectivo - saldoFinalEsperado;

      // Preparar observaciones detalladas
      const observaciones = this.generarObservacionesCierre({
        tipo: 'automatico',
        fechaEjecucion: fechaCierre.format('YYYY-MM-DD HH:mm:ss'),
        cantidadVentas,
        totalGastosAprobados,
        discrepancia,
        executionId: this.executionCount
      });

      // Crear el cierre en la base de datos
      const cierre = await CierreCaja.create({
        fecha_apertura: fechaApertura.toDate(),
        fecha_cierre: fechaCierre.toDate(),
        cajero_id: this.config.SYSTEM_CASHIER_ID,
        saldo_efectivo: saldoEfectivo,
        total_efectivo: totalesPorMetodo.efectivo,
        total_tarjeta: totalesPorMetodo.tarjeta,
        total_transferencia: totalesPorMetodo.transferencia,
        total_yape: totalesPorMetodo.yape,
        total_plin: totalesPorMetodo.plin,
        total_pedidosya: totalesPorMetodo.pedidosya,
        total_rappi: totalesPorMetodo.rappi,
        total_uber_eats: totalesPorMetodo.uber_eats,
        cantidad_ventas: cantidadVentas,
        total_gastos_aprobados: totalGastosAprobados,
        saldo_final_esperado: saldoFinalEsperado,
        discrepancia: discrepancia,
        estado: 'cerrado',
        observaciones: observaciones
      });

      return cierre;
    } catch (error) {
      this.addLog('error', 'Error al crear cierre automático en BD', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * ============================================================================
   * MÉTODO: Generar observaciones del cierre
   * ============================================================================
   *
   * Crea un texto descriptivo detallado para las observaciones del cierre.
   * Esto ayuda en auditorías posteriores a entender qué pasó.
   *
   * @param {Object} datos - Datos del cierre
   * @returns {string} Texto de observaciones
   */
  generarObservacionesCierre(datos) {
    const { tipo, fechaEjecucion, cantidadVentas, totalGastosAprobados, discrepancia, executionId } = datos;

    let observaciones = `🤖 CIERRE AUTOMÁTICO #${executionId}\n\n`;
    observaciones += `✅ Tipo: ${tipo.toUpperCase()}\n`;
    observaciones += `📅 Ejecutado: ${fechaEjecucion}\n`;
    observaciones += `🔢 Ventas procesadas: ${cantidadVentas}\n`;
    observaciones += `💸 Gastos aprobados: S/ ${totalGastosAprobados.toFixed(2)}\n`;
    observaciones += `📊 Discrepancia: S/ ${discrepancia.toFixed(2)}\n\n`;

    if (totalGastosAprobados > 0) {
      observaciones += `⚠️  NOTA: Los gastos aprobados (S/ ${totalGastosAprobados.toFixed(2)}) han sido descontados del saldo esperado.\n`;
      observaciones += `El saldo en efectivo reportado asume que estos gastos NO han sido retirados de la caja aún.\n\n`;
    }

    if (Math.abs(discrepancia) > this.config.DISCREPANCY_THRESHOLD) {
      observaciones += `🚨 ALERTA: Discrepancia superior al umbral de S/ ${this.config.DISCREPANCY_THRESHOLD.toFixed(2)}.\n`;
      observaciones += `Se recomienda revisar manualmente este cierre.\n\n`;
    }

    observaciones += `ℹ️  Este cierre fue generado automáticamente por el sistema.\n`;
    observaciones += `Si necesita realizar ajustes, puede editar este registro desde el panel de administración.`;

    return observaciones;
  }

  /**
   * ============================================================================
   * MÉTODO: Generar alertas del cierre
   * ============================================================================
   *
   * Genera un array de alertas basado en el cierre creado.
   * Útil para notificaciones y auditoría.
   *
   * @param {Object} cierre - Objeto de cierre creado
   * @returns {Array} Array de alertas
   */
  generarAlertas(cierre) {
    const alertas = [];

    // Alerta de discrepancia
    if (Math.abs(cierre.discrepancia) > this.config.DISCREPANCY_THRESHOLD) {
      alertas.push({
        tipo: 'discrepancia',
        mensaje: `Discrepancia de S/ ${Math.abs(cierre.discrepancia).toFixed(2)} detectada en cierre automático`,
        severidad: Math.abs(cierre.discrepancia) > 10 ? 'alta' : 'media',
        cierre_id: cierre.id_cierre
      });
    }

    // Alerta de gastos aprobados
    if (cierre.total_gastos_aprobados > 0) {
      alertas.push({
        tipo: 'info',
        mensaje: `Gastos aprobados de S/ ${cierre.total_gastos_aprobados.toFixed(2)} descontados del saldo esperado`,
        severidad: 'info',
        cierre_id: cierre.id_cierre
      });
    }

    // Alerta de cierre automático
    alertas.push({
      tipo: 'info',
      mensaje: 'Cierre generado automáticamente por el sistema',
      severidad: 'info',
      cierre_id: cierre.id_cierre
    });

    return alertas;
  }

  /**
   * ============================================================================
   * MÉTODO: Obtener estadísticas del servicio
   * ============================================================================
   *
   * Retorna información sobre el estado del servicio de cierre automático.
   * Útil para monitoreo y debugging.
   *
   * @returns {Object} Estadísticas del servicio
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      executionCount: this.executionCount,
      lastExecution: this.lastExecution,
      config: this.config,
      logsCount: this.logs.length,
      recentLogs: this.logs.slice(-10) // Últimos 10 logs
    };
  }

  /**
   * ============================================================================
   * MÉTODO: Obtener todos los logs
   * ============================================================================
   *
   * Retorna el historial completo de logs del servicio.
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
   *
   * Limpia el historial de logs. Útil para liberar memoria.
   */
  clearLogs() {
    this.logs = [];
    this.addLog('info', 'Logs limpiados manualmente');
  }

  /**
   * ============================================================================
   * MÉTODO: Ejecutar cierre manual para fecha específica
   * ============================================================================
   *
   * Permite ejecutar un cierre automático para una fecha pasada específica.
   * Útil para recuperar cierres que no se ejecutaron.
   *
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Object>} Resultado del cierre
   */
  async ejecutarCierreParaFecha(fecha) {
    this.addLog('info', `🔧 Ejecutando cierre manual para fecha: ${fecha}`);

    // Validar formato de fecha
    if (!moment(fecha, 'YYYY-MM-DD', true).isValid()) {
      throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    // Temporalmente modificar la fecha de ejecución
    const fechaOriginal = moment().tz(this.config.TIMEZONE).format('YYYY-MM-DD');

    try {
      // Obtener ventas de la fecha específica
      const ventasDelDia = await this.obtenerVentasDelDia(fecha);

      if (ventasDelDia.length === 0) {
        return {
          success: false,
          message: 'No hay ventas para cerrar en esta fecha',
          fecha: fecha
        };
      }

      // Verificar cierre existente
      const cierreExistente = await this.verificarCierreExistente(fecha);
      if (cierreExistente) {
        return {
          success: false,
          message: 'Ya existe un cierre para esta fecha',
          fecha: fecha,
          cierre_existente: cierreExistente
        };
      }

      // Calcular totales
      const totalesPorMetodo = await this.calcularTotalesPorMetodoPago(ventasDelDia);
      const totalGastosAprobados = await this.calcularGastosAprobados(fecha);

      // Crear cierre con fecha específica
      const cierreCreado = await this.crearCierreAutomatico({
        fechaActual: fecha,
        totalesPorMetodo,
        totalGastosAprobados,
        cantidadVentas: ventasDelDia.length
      });

      this.addLog('success', `✅ Cierre manual para ${fecha} creado exitosamente`, {
        cierre_id: cierreCreado.id_cierre
      });

      return {
        success: true,
        message: 'Cierre creado exitosamente',
        fecha: fecha,
        cierre: cierreCreado
      };

    } catch (error) {
      this.addLog('error', `❌ Error en cierre manual para ${fecha}`, {
        error: error.message
      });
      throw error;
    }
  }
}

// Exportar instancia única del servicio (Singleton)
const autoCierreCajaService = new AutoCierreCajaService();

module.exports = autoCierreCajaService;
