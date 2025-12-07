const { Comanda, User, syncComandas } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment-timezone');
const cron = require('node-cron');

// Función para obtener el siguiente número de delivery
const getNextDeliveryNumber = async () => {
  try {
    const lastDelivery = await Comanda.findOne({
      where: {
        numero_carrito: {
          [Op.gte]: 16
        }
      },
      order: [['numero_carrito', 'DESC']]
    });
    
    return lastDelivery ? lastDelivery.numero_carrito + 1 : 16;
  } catch (error) {
    console.error('Error al obtener siguiente número de delivery:', error);
    return 16; // Fallback
  }
};

const comandaController = {
  // Obtener todas las comandas
  getAll: async (req, res) => {
    try {
      console.log('Iniciando getAll comandas...');
      
      // Sincronizar la tabla antes de usar el modelo
      await syncComandas();
      
      const { estado, fecha_desde, fecha_hasta, limit = 50, offset = 0 } = req.query;
      
      // Construir filtros
      const whereClause = {};
      
      if (estado) {
        whereClause.estado = estado;
        // Si se filtra por entregado, mostrar también las inactivas
        if (estado === 'entregado') {
          whereClause.is_active = false;
        } else {
          whereClause.is_active = true;
        }
      } else {
        // Por defecto, mostrar solo comandas activas
        whereClause.is_active = true;
      }
      
      if (fecha_desde || fecha_hasta) {
        whereClause.fecha_creacion = {};
        if (fecha_desde) {
          whereClause.fecha_creacion[Op.gte] = moment(fecha_desde).startOf('day').toDate();
        }
        if (fecha_hasta) {
          whereClause.fecha_creacion[Op.lte] = moment(fecha_hasta).endOf('day').toDate();
        }
      }
      
      const comandas = await Comanda.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'usuario',
          attributes: ['id_user', 'name', 'email']
        }],
        order: [['fecha_creacion', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      console.log(`Comandas encontradas: ${comandas.length}`);
      res.json(comandas);
    } catch (error) {
      console.error('Error al obtener comandas:', error);
      res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener una comanda específica por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const comandaId = parseInt(id);
      
      if (isNaN(comandaId)) {
        return res.status(400).json({
          message: 'ID de comanda inválido'
        });
      }
      
      const comanda = await Comanda.findOne({
        where: { 
          comanda_id: comandaId,
          is_active: true 
        },
        include: [{
          model: User,
          as: 'usuario',
          attributes: ['id_user', 'name', 'email']
        }]
      });
      
      if (!comanda) {
        return res.status(404).json({
          message: 'Comanda no encontrada'
        });
      }
      
      res.json(comanda);
    } catch (error) {
      console.error('Error al obtener comanda:', error);
      res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener comanda por número de carrito
  getByCarrito: async (req, res) => {
    try {
      const { numero } = req.params;
      const numeroCarrito = parseInt(numero);
      
      if (numeroCarrito < 1 || numeroCarrito > 15) {
        return res.status(400).json({
          message: 'Número de carrito inválido. Debe estar entre 1 y 15'
        });
      }
      
      const comanda = await Comanda.findOne({
        where: { 
          numero_carrito: numeroCarrito,
          is_active: true 
        },
        include: [{
          model: User,
          as: 'usuario',
          attributes: ['id_user', 'name', 'email']
        }]
      });
      
      if (!comanda) {
        return res.status(404).json({
          message: 'No hay comanda para este carrito'
        });
      }
      
      res.json(comanda);
    } catch (error) {
      console.error('Error al obtener comanda por carrito:', error);
      res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear o actualizar comanda
  createOrUpdate: async (req, res) => {
    try {
      let { numero_carrito, productos, observaciones, id_usuario, es_delivery } = req.body;
      
      // Si es delivery, generar número secuencial y configurar expiración
      if (es_delivery) {
        numero_carrito = await getNextDeliveryNumber();
      }
      
      if (numero_carrito === undefined || numero_carrito === null || numero_carrito < 1) {
        return res.status(400).json({
          message: 'Número de carrito inválido. Debe ser mayor a 0'
        });
      }
      
      if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({
          message: 'La comanda debe tener al menos un producto'
        });
      }
      
      // Calcular totales
      let total = 0;
      let totalConIgv = 0;
      
      productos.forEach(producto => {
        const subtotal = parseFloat(producto.precio) * parseInt(producto.cantidad);
        const subtotalConIgv = parseFloat(producto.precioConIgv) * parseInt(producto.cantidad);
        total += subtotal;
        totalConIgv += subtotalConIgv;
      });
      
      // Configurar fecha de expiración para delivery (30 minutos)
      let fechaExpiracion = null;
      if (es_delivery) {
        fechaExpiracion = new Date();
        fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 30);
      }
      
      // Buscar comanda existente activa (solo para carritos 1-15, no delivery)
      let comandaExistente = null;
      if (numero_carrito >= 1 && numero_carrito <= 15 && !es_delivery) {
        comandaExistente = await Comanda.findOne({
          where: { 
            numero_carrito: numero_carrito,
            is_active: true 
          }
        });
      }
      
      if (comandaExistente) {
        // Actualizar comanda existente
        await comandaExistente.update({
          productos: productos,
          total: total,
          total_con_igv: totalConIgv,
          observaciones: observaciones || comandaExistente.observaciones,
          id_usuario: id_usuario || comandaExistente.id_usuario,
          fecha_actualizacion: new Date()
        });
        
        console.log(`Comanda ${comandaExistente.comanda_id} actualizada para carrito ${numero_carrito}`);
        res.json({
          message: 'Comanda actualizada exitosamente',
          comanda: comandaExistente
        });
      } else {
        // Verificar si hay una comanda entregada para este carrito
        const comandaEntregada = await Comanda.findOne({
          where: { 
            numero_carrito: numero_carrito,
            estado: 'entregado',
            is_active: false
          },
          order: [['fecha_entregado', 'DESC']]
        });
        
        // Crear nueva comanda (siempre nueva, no importa si había una entregada)
        const nombreComanda = es_delivery ? `Delivery ${numero_carrito}` : `Comanda Mesa ${numero_carrito}`;
        const estadoInicial = 'pendiente'; // Todas las comandas nuevas empiezan como pendientes
        
        // MEJORA: Calcular fecha de expiración para deliveries (30 minutos)
        let fechaExpiracion = null;
        if (es_delivery) {
          fechaExpiracion = new Date();
          fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 30);
        }
        
        const nuevaComanda = await Comanda.create({
          numero_carrito: numero_carrito,
          nombre: nombreComanda,
          productos: productos,
          total: total,
          total_con_igv: totalConIgv,
          observaciones: observaciones,
          id_usuario: id_usuario,
          estado: estadoInicial,
          is_active: true, // Todas las comandas nuevas son activas
          fecha_creacion: new Date(),
          fecha_actualizacion: new Date(),
          // Agregar campo personalizado para delivery
          es_delivery: es_delivery || false,
          fecha_expiracion: fechaExpiracion
        });
        
        console.log(`Nueva comanda ${nuevaComanda.comanda_id} creada para carrito ${numero_carrito}`);
        res.status(201).json({
          message: 'Comanda creada exitosamente',
          comanda: nuevaComanda
        });
      }
    } catch (error) {
      console.error('Error al crear/actualizar comanda:', error);
      res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar estado de comanda
  updateEstado: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const comandaId = parseInt(id);
      
      if (isNaN(comandaId)) {
        return res.status(400).json({
          message: 'ID de comanda inválido'
        });
      }
      
      const estadosValidos = ['pendiente', 'en_proceso', 'listo', 'entregado'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
          message: 'Estado inválido. Estados válidos: pendiente, en_proceso, listo, entregado'
        });
      }
      
      const comanda = await Comanda.findOne({
        where: { 
          comanda_id: comandaId,
          is_active: true 
        }
      });
      
      if (!comanda) {
        return res.status(404).json({
          message: 'Comanda no encontrada'
        });
      }
      
      // Actualizar estado y fechas correspondientes
      const updateData = {
        estado: estado
        // NO actualizar fecha_actualizacion para cambios de estado
      };
      
      // Actualizar fechas específicas según el estado
      switch (estado) {
        case 'en_proceso':
          if (!comanda.fecha_inicio) {
            updateData.fecha_inicio = new Date();
          }
          break;
        case 'listo':
          if (!comanda.fecha_listo) {
            updateData.fecha_listo = new Date();
          }
          break;
        case 'entregado':
          if (!comanda.fecha_entregado) {
            updateData.fecha_entregado = new Date();
          }
          // Marcar como inactiva para liberar el carrito
          updateData.is_active = false;
          break;
      }
      
      await comanda.update(updateData);
      
      console.log(`Comanda ${comandaId} actualizada a estado: ${estado}`);
      res.json({
        message: `Comanda actualizada a estado: ${estado}`,
        comanda: comanda
      });
    } catch (error) {
      console.error('Error al actualizar estado de comanda:', error);
      res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  },

  // Eliminar comanda (soft delete)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const comandaId = parseInt(id);
      
      if (isNaN(comandaId)) {
        return res.status(400).json({
          message: 'ID de comanda inválido'
        });
      }
      
      const comanda = await Comanda.findOne({
        where: { 
          comanda_id: comandaId,
          is_active: true 
        }
      });
      
      if (!comanda) {
        return res.status(404).json({
          message: 'Comanda no encontrada'
        });
      }
      
      // Soft delete
      await comanda.update({
        is_active: false,
        fecha_actualizacion: new Date()
      });
      
      console.log(`Comanda ${comandaId} eliminada (soft delete)`);
      res.json({
        message: 'Comanda eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar comanda:', error);
      res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener estadísticas de comandas
  getEstadisticas: async (req, res) => {
    try {
      const { fecha_desde, fecha_hasta } = req.query;
      
      // Construir filtros de fecha
      const whereClause = {
        is_active: true
      };
      
      if (fecha_desde || fecha_hasta) {
        whereClause.fecha_creacion = {};
        if (fecha_desde) {
          whereClause.fecha_creacion[Op.gte] = moment(fecha_desde).startOf('day').toDate();
        }
        if (fecha_hasta) {
          whereClause.fecha_creacion[Op.lte] = moment(fecha_hasta).endOf('day').toDate();
        }
      }
      
      // Contar por estado
      const estadisticas = await Comanda.findAll({
        where: whereClause,
        attributes: [
          'estado',
          [Comanda.sequelize.fn('COUNT', Comanda.sequelize.col('comanda_id')), 'cantidad']
        ],
        group: ['estado']
      });
      
      // Formatear estadísticas
      const stats = {
        pendiente: 0,
        en_proceso: 0,
        listo: 0,
        entregado: 0,
        total: 0
      };
      
      estadisticas.forEach(stat => {
        stats[stat.estado] = parseInt(stat.dataValues.cantidad);
        stats.total += parseInt(stat.dataValues.cantidad);
      });
      
      res.json(stats);
    } catch (error) {
      console.error('Error al obtener estadísticas de comandas:', error);
      res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  },

  // MEJORA: Crear comanda delivery automática para ventas sin mesa
  crearComandaDeliveryAutomatica: async (productos, id_usuario, observaciones = '') => {
    try {
      const numero_carrito = await getNextDeliveryNumber();
      
      // Calcular totales
      let total = 0;
      let totalConIgv = 0;
      productos.forEach(producto => {
        total += parseFloat(producto.precio) * parseInt(producto.cantidad);
        totalConIgv += parseFloat(producto.precioConIgv) * parseInt(producto.cantidad);
      });

      // Fecha de expiración: 30 minutos desde ahora
      const fechaExpiracion = new Date();
      fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 30);

      const comandaDelivery = await Comanda.create({
        numero_carrito: numero_carrito,
        nombre: `Delivery ${numero_carrito}`,
        productos: productos,
        total: total,
        total_con_igv: totalConIgv,
        observaciones: observaciones,
        id_usuario: id_usuario,
        estado: 'pendiente',
        is_active: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        es_delivery: true,
        fecha_expiracion: fechaExpiracion
      });

      console.log(`✅ Comanda delivery ${comandaDelivery.comanda_id} creada automáticamente (expira: ${fechaExpiracion})`);
      return comandaDelivery;
    } catch (error) {
      console.error('❌ Error al crear comanda delivery automática:', error);
      return null;
    }
  },

  // MEJORA: Limpiar comandas delivery expiradas (ejecutar cada 5 minutos)
  limpiarComandasDeliveryExpiradas: async () => {
    try {
      console.log('🔍 Verificando comandas delivery expiradas...');
      
      const ahora = new Date();
      const comandasExpiradas = await Comanda.findAll({
        where: {
          es_delivery: true,
          is_active: true,
          fecha_expiracion: {
            [Op.lte]: ahora
          }
        }
      });

      if (comandasExpiradas.length > 0) {
        console.log(`🗑️ Encontradas ${comandasExpiradas.length} comandas delivery expiradas`);
        
        for (const comanda of comandasExpiradas) {
          await comanda.update({
            is_active: false,
            estado: 'expirado',
            fecha_actualizacion: new Date()
          });
          console.log(`🗑️ Comanda delivery ${comanda.comanda_id} eliminada por expiración`);
        }
      }
    } catch (error) {
      console.error('❌ Error al limpiar comandas delivery expiradas:', error);
    }
  }
};

// MEJORA: Inicializar tarea automática para limpiar comandas delivery expiradas
// Ejecutar cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  await comandaController.limpiarComandasDeliveryExpiradas();
});

console.log('✅ Tarea automática de limpieza de comandas delivery configurada (cada 5 minutos)');

module.exports = comandaController;
