const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GastoPersonal = sequelize.define('GastoPersonal', {
  gasto_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  concepto: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Descripción del gasto (ej: Alimentación, Transporte, Materiales)'
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Monto del gasto'
  },
  fecha_gasto: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha en que se realizó el gasto'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción detallada del gasto'
  },
  categoria: {
    type: DataTypes.ENUM(
      'alimentacion',       // Gaseosas, comidas del personal
      'transporte',         // Pasajes, combustible
      'materiales',         // Aceite, ingredientes, insumos
      'reparaciones',       // Reparación de mesas, equipos
      'servicios',          // Servicios externos
      'limpieza',          // Productos de limpieza
      'mantenimiento',     // Mantenimiento de equipos
      'otros'              // Otros gastos
    ),
    allowNull: false,
    defaultValue: 'otros',
    comment: 'Categoría específica del gasto del restaurante'
  },
  comprobante_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL del comprobante o recibo (opcional)'
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'),
    allowNull: false,
    defaultValue: 'pendiente',
    comment: 'Estado del gasto: pendiente, aprobado o rechazado'
  },
  id_usuario_solicitante: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID del usuario que solicita el gasto'
  },
  id_usuario_revisor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del administrador que revisó el gasto'
  },
  fecha_revision: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha en que se revisó el gasto'
  },
  comentarios_revision: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comentarios del administrador sobre la revisión'
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
    allowNull: false,
    defaultValue: 'media',
    comment: 'Prioridad del gasto'
  },
  es_reembolso: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si es un reembolso de gasto ya realizado o una solicitud previa'
  }
}, {
  tableName: 'gastos_personal',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  freezeTableName: true,
  sync: false // No sincronizar automáticamente, usar migraciones
});

module.exports = GastoPersonal;
