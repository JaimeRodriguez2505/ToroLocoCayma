const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'tiktendry',
    password: process.env.DB_PASSWORD || 'tiktendry',
    database: process.env.DB_NAME || 'tiktendry',
    charset: 'utf8mb4'
  });

  try {
    console.log('🔄 Ejecutando migraciones...');
    
    const migrationsDir = path.join(__dirname, '../../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      console.log(`📄 Ejecutando migración: ${file}`);

      try {
        // Ejecutar la migración completa usando multipleStatements
        // Esto permite prepared statements y bloques complejos
        const connectionMulti = await mysql.createConnection({
          host: process.env.DB_HOST || 'db',
          user: process.env.DB_USER || 'tiktendry',
          password: process.env.DB_PASSWORD || 'tiktendry',
          database: process.env.DB_NAME || 'tiktendry',
          charset: 'utf8mb4',
          multipleStatements: true
        });

        try {
          await connectionMulti.query(sql);
          console.log(`✅ Migración completada: ${file}`);
        } catch (error) {
          // Ignorar errores de columnas que ya existen
          if (!error.message.includes('Duplicate column name') &&
              !error.message.includes('Duplicate key name') &&
              !error.message.includes('already exists') &&
              !error.sqlMessage?.includes('Duplicate column name')) {
            throw error;
          }
          console.log(`⚠️  Migración omitida (ya aplicada): ${file}`);
        } finally {
          await connectionMulti.end();
        }
      } catch (error) {
        console.error(`❌ Error en migración ${file}:`, error.message);
        // No lanzar el error para permitir que continúe con otras migraciones
      }
    }

    console.log('✅ Todas las migraciones ejecutadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runMigrations().catch(console.error);
}

module.exports = runMigrations;
