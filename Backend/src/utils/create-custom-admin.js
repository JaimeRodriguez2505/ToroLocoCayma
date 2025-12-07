#!/usr/bin/env node

/**
 * Script para crear un usuario administrador personalizado (Gerente - rol 1)
 * Uso: node create-custom-admin.js "Nombre" "email@ejemplo.com" "contraseña"
 * Ejemplo: node create-custom-admin.js "Juan Pérez" "juan@empresa.com" "MiPassword123!"
 */

const { sequelize } = require('../config/database');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

async function createCustomAdmin() {
  try {
    // Obtener argumentos de la línea de comandos
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
      console.log('❌ Uso: node create-custom-admin.js "Nombre" "email@ejemplo.com" "contraseña"');
      console.log('   Ejemplo: node create-custom-admin.js "Juan Pérez" "juan@empresa.com" "MiPassword123!"');
      process.exit(1);
    }

    const [name, email, password] = args;

    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');

    // Verificar si ya existe un usuario con ese email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('⚠️  Ya existe un usuario con ese email:', email);
      console.log('   ID:', existingUser.id_user);
      console.log('   Nombre:', existingUser.name);
      console.log('   Rol actual:', existingUser.id_role);
      
      // Actualizar automáticamente el rol a Gerente
      existingUser.name = name;
      existingUser.id_role = 1;
      existingUser.password = await bcrypt.hash(password, await bcrypt.genSalt(10));
      await existingUser.save();
      console.log('✅ Usuario actualizado con rol de Gerente');
    } else {
      // Hashear la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Crear el usuario
      const newUser = await User.create({
        name: name,
        email: email,
        password: hashedPassword,
        id_role: 1 // Rol de Gerente (más alto)
      });

      console.log('✅ Usuario administrador creado exitosamente:');
      console.log('   ID:', newUser.id_user);
      console.log('   Nombre:', newUser.name);
      console.log('   Email:', newUser.email);
      console.log('   Rol:', newUser.id_role, '(Gerente)');
    }

  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error);
  } finally {
    // Cerrar la conexión
    await sequelize.close();
    console.log('🔌 Conexión a la base de datos cerrada');
    process.exit(0);
  }
}

// Ejecutar el script
createCustomAdmin();
