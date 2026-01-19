const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const moment = require('moment-timezone');

const Comanda = sequelize.define('Comanda', {
  comanda_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_carrito: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 999
    },
    comment: 'Número del carrito: 1-15 (carritos guardados), 16+ (delivery)'
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: function() {
      return `Comanda Carrito ${this.numero_carrito}`;
    }
  },
  productos: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array de productos en la comanda'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  total_con_igv: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'en_proceso', 'listo', 'entregado', 'expirado'),
    allowNull: false,
    defaultValue: 'pendiente',
    comment: 'Estado de la comanda: pendiente, en_proceso, listo, entregado, expirado'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones adicionales de la comanda'
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Usuario que creó la comanda'
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de creación de la comanda'
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de última actualización'
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se inició la preparación'
  },
  fecha_listo: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se marcó como listo'
  },
  fecha_entregado: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se entregó'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si la comanda está activa'
  },
  es_delivery: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si es una comanda delivery (auto-eliminación en 30min)'
  },
  fecha_expiracion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de expiración para comandas delivery'
  },
  venta_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID de la venta asociada (para comandas delivery)'
  }
}, {
  tableName: 'comandas',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_actualizacion'
});

// Método para formatear fechas en el JSON de respuesta
Comanda.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Formatear fechas a zona horaria de Lima
  const formatDate = (date) => {
    if (!date) return null;
    return moment(date).tz('America/Lima').format('YYYY-MM-DD HH:mm:ss');
  };
  
  values.fecha_creacion = formatDate(values.fecha_creacion);
  values.fecha_actualizacion = formatDate(values.fecha_actualizacion);
  values.fecha_inicio = formatDate(values.fecha_inicio);
  values.fecha_listo = formatDate(values.fecha_listo);
  values.fecha_entregado = formatDate(values.fecha_entregado);
  values.fecha_expiracion = formatDate(values.fecha_expiracion);
  
  return values;
};

module.exports = Comanda;
