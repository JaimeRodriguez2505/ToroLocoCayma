const { sequelize, User } = require('../models');
const GastoPersonal = require('../models/gasto_personal.model');
const { Op } = require('sequelize');

const gastoPersonalController = {
  // Crear un nuevo gasto
  create: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { 
        concepto, 
        monto, 
        fecha_gasto, 
        descripcion, 
        categoria, 
        comprobante_url, 
        prioridad, 
        es_reembolso 
      } = req.body;
      
      const id_usuario_solicitante = req.user.id;

      // Validaciones básicas
      if (!concepto || !monto || !categoria) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Concepto, monto y categoría son obligatorios'
        });
      }

      if (parseFloat(monto) <= 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser mayor a 0'
        });
      }

      const gasto = await GastoPersonal.create({
        concepto,
        monto: parseFloat(monto),
        fecha_gasto: fecha_gasto ? new Date(fecha_gasto) : new Date(),
        descripcion,
        categoria,
        comprobante_url,
        prioridad: prioridad || 'media',
        es_reembolso: es_reembolso !== undefined ? es_reembolso : true,
        id_usuario_solicitante,
        estado: 'pendiente'
      }, { transaction: t });

      await t.commit();

      res.status(201).json({
        success: true,
        message: 'Gasto creado exitosamente',
        data: gasto
      });
    } catch (error) {
      await t.rollback();
      console.error('Error al crear gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener todos los gastos (con filtros)
  getAll: async (req, res) => {
    try {
      const { 
        estado, 
        categoria, 
        usuario_id, 
        fecha_inicio, 
        fecha_fin, 
        page = 1, 
        limit = 20 
      } = req.query;

      const where = {};
      
      // Filtros
      if (estado) where.estado = estado;
      if (categoria) where.categoria = categoria;
      if (usuario_id) where.id_usuario_solicitante = usuario_id;
      
      if (fecha_inicio && fecha_fin) {
        where.fecha_gasto = {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
        };
      }

      // Si no es administrador, solo puede ver sus propios gastos
      if (req.user.id_role !== 1 && req.user.id_role !== 2) {
        where.id_usuario_solicitante = req.user.id;
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const gastos = await GastoPersonal.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'usuario_solicitante',
            attributes: ['id_user', 'name', 'email']
          },
          {
            model: User,
            as: 'usuario_revisor',
            attributes: ['id_user', 'name', 'email'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: gastos.rows,
        pagination: {
          total: gastos.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(gastos.count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error al obtener gastos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener un gasto por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const where = { gasto_id: id };
      
      // Si no es administrador, solo puede ver sus propios gastos
      if (req.user.id_role !== 1 && req.user.id_role !== 2) {
        where.id_usuario_solicitante = req.user.id;
      }

      const gasto = await GastoPersonal.findOne({
        where,
        include: [
          {
            model: User,
            as: 'usuario_solicitante',
            attributes: ['id_user', 'name', 'email']
          },
          {
            model: User,
            as: 'usuario_revisor',
            attributes: ['id_user', 'name', 'email'],
            required: false
          }
        ]
      });

      if (!gasto) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado'
        });
      }

      res.json({
        success: true,
        data: gasto
      });
    } catch (error) {
      console.error('Error al obtener gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Actualizar un gasto (solo el solicitante y si está pendiente)
  update: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const {
        concepto,
        monto,
        fecha_gasto,
        descripcion,
        categoria,
        comprobante_url,
        prioridad,
        es_reembolso
      } = req.body;

      const gasto = await GastoPersonal.findOne({
        where: { 
          gasto_id: id,
          id_usuario_solicitante: req.user.id,
          estado: 'pendiente' // Solo se puede editar si está pendiente
        },
        transaction: t
      });

      if (!gasto) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado o no se puede editar'
        });
      }

      await gasto.update({
        concepto: concepto || gasto.concepto,
        monto: monto ? parseFloat(monto) : gasto.monto,
        fecha_gasto: fecha_gasto ? new Date(fecha_gasto) : gasto.fecha_gasto,
        descripcion: descripcion !== undefined ? descripcion : gasto.descripcion,
        categoria: categoria || gasto.categoria,
        comprobante_url: comprobante_url !== undefined ? comprobante_url : gasto.comprobante_url,
        prioridad: prioridad || gasto.prioridad,
        es_reembolso: es_reembolso !== undefined ? es_reembolso : gasto.es_reembolso
      }, { transaction: t });

      await t.commit();

      res.json({
        success: true,
        message: 'Gasto actualizado exitosamente',
        data: gasto
      });
    } catch (error) {
      await t.rollback();
      console.error('Error al actualizar gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Revisar un gasto (aprobar/rechazar) - Solo administradores
  review: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { estado, comentarios_revision } = req.body;

      // Verificar que sea administrador
      if (req.user.id_role !== 1 && req.user.id_role !== 2) {
        await t.rollback();
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para revisar gastos'
        });
      }

      if (!['aprobado', 'rechazado'].includes(estado)) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Estado debe ser "aprobado" o "rechazado"'
        });
      }

      const gasto = await GastoPersonal.findOne({
        where: { 
          gasto_id: id,
          estado: 'pendiente' // Solo se pueden revisar gastos pendientes
        },
        transaction: t
      });

      if (!gasto) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado o ya fue revisado'
        });
      }

      await gasto.update({
        estado,
        id_usuario_revisor: req.user.id,
        fecha_revision: new Date(),
        comentarios_revision
      }, { transaction: t });

      await t.commit();

      res.json({
        success: true,
        message: `Gasto ${estado} exitosamente`,
        data: gasto
      });
    } catch (error) {
      await t.rollback();
      console.error('Error al revisar gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Eliminar un gasto (solo el solicitante y si está pendiente)
  delete: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;

      const gasto = await GastoPersonal.findOne({
        where: { 
          gasto_id: id,
          id_usuario_solicitante: req.user.id,
          estado: 'pendiente' // Solo se puede eliminar si está pendiente
        },
        transaction: t
      });

      if (!gasto) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado o no se puede eliminar'
        });
      }

      await gasto.destroy({ transaction: t });
      await t.commit();

      res.json({
        success: true,
        message: 'Gasto eliminado exitosamente'
      });
    } catch (error) {
      await t.rollback();
      console.error('Error al eliminar gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener estadísticas de gastos (solo administradores)
  getStats: async (req, res) => {
    try {
      // Verificar que sea administrador
      if (req.user.id_role !== 1 && req.user.id_role !== 2) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver estadísticas'
        });
      }

      const { fecha_inicio, fecha_fin } = req.query;
      
      const where = {};
      if (fecha_inicio && fecha_fin) {
        where.fecha_gasto = {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
        };
      }

      // Estadísticas por estado
      const estatusPorEstado = await GastoPersonal.findAll({
        where,
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('gasto_id')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'total_monto']
        ],
        group: ['estado']
      });

      // Estadísticas por categoría
      const estatusPorCategoria = await GastoPersonal.findAll({
        where,
        attributes: [
          'categoria',
          [sequelize.fn('COUNT', sequelize.col('gasto_id')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'total_monto']
        ],
        group: ['categoria']
      });

      // Gastos pendientes de revisión
      const gastosPendientes = await GastoPersonal.count({
        where: { ...where, estado: 'pendiente' }
      });

      res.json({
        success: true,
        data: {
          por_estado: estatusPorEstado,
          por_categoria: estatusPorCategoria,
          gastos_pendientes: gastosPendientes
        }
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener resumen diario de gastos (solo administradores)
  getDailySummary: async (req, res) => {
    try {
      // Verificar que sea administrador
      if (req.user.id_role !== 1 && req.user.id_role !== 2) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver el resumen diario'
        });
      }

      const { fecha } = req.params;
      
      // Validar formato de fecha
      if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido. Use YYYY-MM-DD'
        });
      }

      const fechaInicio = new Date(fecha + ' 00:00:00');
      const fechaFin = new Date(fecha + ' 23:59:59');

      // Gastos del día - buscar por fecha_gasto O por fecha de creación
      const gastosDia = await GastoPersonal.findAll({
        where: {
          [Op.or]: [
            {
              fecha_gasto: {
                [Op.between]: [fechaInicio, fechaFin]
              }
            },
            {
              created_at: {
                [Op.between]: [fechaInicio, fechaFin]
              }
            }
          ]
        },
        include: [
          {
            model: User,
            as: 'usuario_solicitante',
            attributes: ['id_user', 'name']
          }
        ],
        order: [['fecha_gasto', 'ASC']]
      });

      // Resumen por categoría
      const resumenPorCategoria = await GastoPersonal.findAll({
        where: {
          [Op.or]: [
            {
              fecha_gasto: {
                [Op.between]: [fechaInicio, fechaFin]
              }
            },
            {
              created_at: {
                [Op.between]: [fechaInicio, fechaFin]
              }
            }
          ]
        },
        attributes: [
          'categoria',
          'estado',
          [sequelize.fn('COUNT', sequelize.col('gasto_id')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'total_monto']
        ],
        group: ['categoria', 'estado']
      });

      // Resumen por estado
      const resumenPorEstado = await GastoPersonal.findAll({
        where: {
          [Op.or]: [
            {
              fecha_gasto: {
                [Op.between]: [fechaInicio, fechaFin]
              }
            },
            {
              created_at: {
                [Op.between]: [fechaInicio, fechaFin]
              }
            }
          ]
        },
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('gasto_id')), 'cantidad'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'total_monto']
        ],
        group: ['estado']
      });

      // Total gastado aprobado del día
      const totalAprobado = await GastoPersonal.sum('monto', {
        where: {
          [Op.or]: [
            {
              fecha_gasto: {
                [Op.between]: [fechaInicio, fechaFin]
              }
            },
            {
              created_at: {
                [Op.between]: [fechaInicio, fechaFin]
              }
            }
          ],
          estado: 'aprobado'
        }
      });

      // Gastos pendientes de revisión
      const gastosPendientes = gastosDia.filter(gasto => gasto.estado === 'pendiente');

      res.json({
        success: true,
        data: {
          fecha,
          gastos_del_dia: gastosDia,
          resumen_por_categoria: resumenPorCategoria,
          resumen_por_estado: resumenPorEstado,
          total_aprobado: totalAprobado || 0,
          gastos_pendientes: gastosPendientes.length,
          gastos_pendientes_detalle: gastosPendientes
        }
      });

    } catch (error) {
      console.error('Error al obtener resumen diario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener gastos más frecuentes por categoría (solo administradores)
  getFrequentExpenses: async (req, res) => {
    try {
      // Verificar que sea administrador
      if (req.user.id_role !== 1 && req.user.id_role !== 2) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver gastos frecuentes'
        });
      }

      const { fecha_inicio, fecha_fin, limit = 10 } = req.query;

      const where = { estado: 'aprobado' };
      if (fecha_inicio && fecha_fin) {
        where.fecha_gasto = {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
        };
      }

      // Gastos frecuentes por categoría
      const gastosFrecuentes = await GastoPersonal.findAll({
        where,
        attributes: [
          'categoria',
          [sequelize.fn('COUNT', sequelize.col('gasto_id')), 'frecuencia'],
          [sequelize.fn('AVG', sequelize.col('monto')), 'monto_promedio'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
        ],
        group: ['categoria'],
        order: [[sequelize.fn('COUNT', sequelize.col('gasto_id')), 'DESC']],
        limit: parseInt(limit),
        raw: true
      });

      res.json({
        success: true,
        data: gastosFrecuentes
      });
    } catch (error) {
      console.error('Error al obtener gastos frecuentes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
};

module.exports = gastoPersonalController;
