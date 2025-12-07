const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function ensureAdminUser() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'tiktendry',
    password: process.env.DB_PASSWORD || 'tiktendry',
    database: process.env.DB_NAME || 'tiktendry',
    charset: 'utf8mb4'
  });

  try {
    // Verificar si ya existe un usuario administrador
    const [rows] = await connection.execute(
      'SELECT id_user FROM users WHERE id_role = 1 LIMIT 1'
    );

    if (rows.length === 0) {
      console.log('🔧 Creando usuario administrador...');

      const hashedPassword = await bcrypt.hash('EthaN2505', 10);

      await connection.execute(`
        INSERT INTO users (name, email, password, id_role, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `, [
        'Jaime Rodriguez',
        'jaimeandre17@hotmail.com',
        hashedPassword,
        1 // Rol gerente
      ]);

      console.log('✅ Usuario administrador creado exitosamente');
      console.log('   Email: jaimeandre17@hotmail.com');
      console.log('   Contraseña: EthaN2505');
    } else {
      console.log('✅ Usuario administrador ya existe');
    }
    
  } catch (error) {
    console.error('❌ Error verificando usuario administrador:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ensureAdminUser().catch(console.error);
}

module.exports = ensureAdminUser;
