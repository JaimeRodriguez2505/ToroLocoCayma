#!/usr/bin/env node

/**
 * Script de verificación del sistema antes del despliegue
 * Verifica configuraciones, conexiones a BD, y estructura de tablas
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyDatabaseConnection() {
  log('\n🔍 Verificando conexión a la base de datos...', 'cyan');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'db',
      user: process.env.DB_USER || 'tiktendry',
      password: process.env.DB_PASSWORD || 'tiktendry',
      database: process.env.DB_NAME || 'tiktendry',
      charset: 'utf8mb4'
    });

    await connection.ping();
    log('✅ Conexión a la base de datos exitosa', 'green');

    return connection;
  } catch (error) {
    log(`❌ Error de conexión: ${error.message}`, 'red');
    throw error;
  }
}

async function verifyTableStructure(connection) {
  log('\n🔍 Verificando estructura de tabla cierres_caja...', 'cyan');

  try {
    const [columns] = await connection.query(
      'SHOW COLUMNS FROM cierres_caja'
    );

    const requiredColumns = [
      'total_gastos_aprobados',
      'saldo_final_esperado',
      'discrepancia'
    ];

    const existingColumns = columns.map(col => col.Field);

    for (const column of requiredColumns) {
      if (existingColumns.includes(column)) {
        log(`  ✅ Columna '${column}' existe`, 'green');
      } else {
        log(`  ❌ Columna '${column}' NO existe`, 'red');
        return false;
      }
    }

    log('✅ Estructura de tabla cierres_caja correcta', 'green');
    return true;
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      log('⚠️  Tabla cierres_caja no existe (se creará en la sincronización)', 'yellow');
      return true; // No es error crítico, Sequelize la creará
    }
    log(`❌ Error verificando estructura: ${error.message}`, 'red');
    return false;
  }
}

async function verifyUsersTable(connection) {
  log('\n🔍 Verificando tabla users...', 'cyan');

  try {
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'users'"
    );

    if (tables.length > 0) {
      log('✅ Tabla users existe', 'green');
      return true;
    } else {
      log('⚠️  Tabla users no existe (se creará en la sincronización)', 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Error verificando tabla users: ${error.message}`, 'red');
    return false;
  }
}

async function verifyEnvVariables() {
  log('\n🔍 Verificando variables de entorno...', 'cyan');

  const requiredVars = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET'
  ];

  let allPresent = true;

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log(`  ✅ ${varName}: ${varName.includes('PASSWORD') || varName.includes('SECRET') ? '***' : process.env[varName]}`, 'green');
    } else {
      log(`  ❌ ${varName} no está definida`, 'red');
      allPresent = false;
    }
  }

  return allPresent;
}

async function verifyMigrationFiles() {
  log('\n🔍 Verificando archivos de migración...', 'cyan');

  try {
    const migrationsDir = path.join(__dirname, '../migrations');

    if (!fs.existsSync(migrationsDir)) {
      log('❌ Directorio de migraciones no existe', 'red');
      return false;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      log('⚠️  No hay archivos de migración', 'yellow');
      return true;
    }

    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      if (content.trim().length > 0) {
        log(`  ✅ ${file} (${content.length} caracteres)`, 'green');
      } else {
        log(`  ⚠️  ${file} está vacío`, 'yellow');
      }
    }

    log(`✅ ${files.length} archivo(s) de migración encontrado(s)`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error verificando migraciones: ${error.message}`, 'red');
    return false;
  }
}

async function verifyGastosPersonalTable(connection) {
  log('\n🔍 Verificando tabla gastos_personal...', 'cyan');

  try {
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'gastos_personal'"
    );

    if (tables.length > 0) {
      log('✅ Tabla gastos_personal existe', 'green');

      // Verificar columnas importantes
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM gastos_personal'
      );

      const requiredColumns = ['gasto_id', 'concepto', 'monto', 'estado', 'categoria'];
      const existingColumns = columns.map(col => col.Field);

      for (const column of requiredColumns) {
        if (existingColumns.includes(column)) {
          log(`  ✅ Columna '${column}' existe`, 'green');
        } else {
          log(`  ❌ Columna '${column}' NO existe`, 'red');
          return false;
        }
      }

      return true;
    } else {
      log('⚠️  Tabla gastos_personal no existe (se creará con la migración)', 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Error verificando tabla gastos_personal: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║   VERIFICACIÓN DEL SISTEMA - ERP RESTAURANTES          ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  let connection;
  let allChecksPassed = true;

  try {
    // 1. Verificar variables de entorno
    const envOk = await verifyEnvVariables();
    allChecksPassed = allChecksPassed && envOk;

    // 2. Verificar archivos de migración
    const migrationsOk = await verifyMigrationFiles();
    allChecksPassed = allChecksPassed && migrationsOk;

    // 3. Verificar conexión a BD
    connection = await verifyDatabaseConnection();

    // 4. Verificar tabla users
    const usersOk = await verifyUsersTable(connection);
    allChecksPassed = allChecksPassed && usersOk;

    // 5. Verificar tabla gastos_personal
    const gastosOk = await verifyGastosPersonalTable(connection);
    allChecksPassed = allChecksPassed && gastosOk;

    // 6. Verificar estructura de cierres_caja
    const structureOk = await verifyTableStructure(connection);
    allChecksPassed = allChecksPassed && structureOk;

    // Resultado final
    log('\n╔════════════════════════════════════════════════════════╗', allChecksPassed ? 'green' : 'red');
    if (allChecksPassed) {
      log('║        ✅ TODAS LAS VERIFICACIONES PASARON             ║', 'green');
      log('║           Sistema listo para despliegue                ║', 'green');
    } else {
      log('║        ❌ ALGUNAS VERIFICACIONES FALLARON              ║', 'red');
      log('║      Por favor, revise los errores anteriores         ║', 'red');
    }
    log('╚════════════════════════════════════════════════════════╝\n', allChecksPassed ? 'green' : 'red');

    process.exit(allChecksPassed ? 0 : 1);

  } catch (error) {
    log(`\n❌ Error fatal: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar verificación
main().catch(console.error);
