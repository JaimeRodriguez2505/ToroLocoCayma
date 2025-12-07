const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CarritoGuardado = sequelize.define('CarritoGuardado', {
  carrito_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_carrito: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    validate: {
      min: 1,
      max: 25
    },
    comment: 'Número del carrito del 1 al 25'
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: function() {
      return `Carrito ${this.numero_carrito}`;
    }
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array de productos en el carrito'
  },
  metodo_pago: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'efectivo'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo_documento: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Tipo de documento para facturación'
  },
  cliente_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Datos del cliente en formato JSON'
  },
  barcode_search_results: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Resultados de búsqueda de códigos de barras'
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Usuario que modificó por última vez el carrito (para auditoría)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si el carrito está activo'
  }
}, {
  tableName: 'carritos_guardados',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = CarritoGuardado;
