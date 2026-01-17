const {app, server} = require("./app");
const { sequelize, connectDB } = require('./config/database');
const { seedRoles, syncComandas, syncReservas } = require('./models');
const runMigrations = require('./utils/run-migrations');
const ensureAdminUser = require('./utils/ensure-admin-user');
const cierreScheduler = require('./services/cierreScheduler.service');

const port = process.env.PORT || 3000;

const syncDatabase = async (retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Sincronizar con configuración optimizada para evitar deadlocks
      await sequelize.sync({
        alter: false, // Cambiar a false para evitar ALTER TABLE durante sincronización
        force: false,
        logging: false
      });
      console.log('✅ Base de datos sincronizada');
      return true;
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError' && error.parent?.code === 'ER_LOCK_DEADLOCK') {
        console.log(`⚠️  Deadlock detectado, reintentando (${i + 1}/${retries})...`);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      // Si no es un deadlock o se agotaron los reintentos
      console.log('⚠️  Error en sincronización (continuando):', error.message);
      return false;
    }
  }
  return false;
};

const startServer = async () => {
  try {
    // 1. Conectar a la base de datos
    await connectDB();

    // 2. Sincronizar base de datos con retry logic
    await syncDatabase();

    // 3. Ejecutar migraciones (aquí sí se hacen los ALTER TABLE de forma controlada)
    try {
      await runMigrations();
    } catch (error) {
      console.log('⚠️  Error en migraciones (continuando):', error.message);
    }

    // 4. Insertar roles iniciales
    try {
      await seedRoles();
    } catch (error) {
      console.log('⚠️  Error en seedRoles (continuando):', error.message);
    }

    // 5. Crear usuario administrador
    try {
      await ensureAdminUser();
    } catch (error) {
      console.log('⚠️  Error creando admin (continuando):', error.message);
    }

    // 6. Sincronizar tabla de comandas
    try {
      await syncComandas();
    } catch (error) {
      console.log('⚠️  Error en syncComandas (continuando):', error.message);
    }

    // 6.5. Sincronizar tabla de reservas
    try {
      await syncReservas();
    } catch (error) {
      console.log('⚠️  Error en syncReservas (continuando):', error.message);
    }

    // 7. Iniciar Scheduler de Cierre Automático
    try {
      console.log('🕐 Iniciando scheduler de cierre automático...');
      await cierreScheduler.start();
      console.log('✅ Scheduler de cierre automático iniciado');
    } catch (error) {
      console.log('⚠️  Error al iniciar scheduler (continuando):', error.message);
      // El servidor puede continuar sin el scheduler
    }

    // 8. Iniciar servidor
    server.listen(port, '0.0.0.0', () => {
      console.log('Servidor escuchando en: ', port);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    console.log('Intentando continuar a pesar del error...');
    // Intentar iniciar el servidor de todos modos
    server.listen(port, '0.0.0.0', () => {
      console.log('Servidor escuchando en: ', port, '(con errores de inicialización)');
    });
  }
};

startServer();


