const { DataTypes } = require("sequelize")
const { sequelize } = require("../config/database")

const Reserva = sequelize.define("Reserva", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha_reserva: {
    type: DataTypes.DATEONLY, // Solo fecha, sin hora específica si es por turno
    allowNull: false,
  },
  hora_reserva: { // Agregamos hora por si acaso
      type: DataTypes.STRING,
      allowNull: true
  },
  cantidad_personas: {
    type: DataTypes.STRING, // "2 Personas", "4 Personas", etc. o INTEGER si se limpia
    allowNull: false,
  },
  comentarios: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM("PENDIENTE", "RESERVADO", "CANCELADO", "COMPLETADO"),
    defaultValue: "PENDIENTE",
  },
  comprobante_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: "reservas",
  timestamps: true, // createdAt, updatedAt
})

module.exports = Reserva
