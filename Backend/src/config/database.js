const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    timezone: '-05:00', // Zona horaria de Perú (UTC-5)
    dialectOptions: {
      dateStrings: true,
      typeCast: function (field, next) {
        if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
          return field.string();
        }
        return next();
      }
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexión a la base de datos exitosa");

    // La sincronización se maneja en el archivo principal (index.js)
    // para tener mejor control sobre el orden de ejecución
  } catch (error) {
    console.error("Error de conexión a la base de datos:", error);
    throw error;
  }
};

module.exports = {
  sequelize,
  connectDB
};