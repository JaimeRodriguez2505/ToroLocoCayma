#!/usr/bin/env node

/**
 * Script para crear un usuario administrador (Gerente - rol 1)
 * Uso: node create-admin-user.js
 */

const { sequelize } = require('../config/database');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');

    // Datos del usuario administrador
    const adminData = {
      name: 'Administrador Principal',
      email: 'admin@tiktendry.com',
      password: 'Admin123!', // Cambia esta contraseña por una más segura
      id_role: 1 // Rol de Gerente (más alto)
    };

    // Verificar si ya existe un usuario con ese email
    const existingUser = await User.findOne({ where: { email: adminData.email } });
    if (existingUser) {
      console.log('⚠️  Ya existe un usuario con ese email:', adminData.email);
      console.log('ID del usuario existente:', existingUser.id_user);
      console.log('Rol actual:', existingUser.id_role);
      
      // Preguntar si quiere actualizar el rol
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise((resolve) => {
        rl.question('¿Deseas actualizar el rol de este usuario a Gerente? (y/n): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        // Actualizar el rol del usuario existente
        existingUser.id_role = 1;
        await existingUser.save();
        console.log('✅ Usuario actualizado con rol de Gerente');
      } else {
        console.log('❌ Operación cancelada');
        process.exit(0);
      }
    } else {
      // Hashear la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);

      // Crear el usuario
      const newUser = await User.create({
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        id_role: adminData.id_role
      });

      console.log('✅ Usuario administrador creado exitosamente:');
      console.log('   ID:', newUser.id_user);
      console.log('   Nombre:', newUser.name);
      console.log('   Email:', newUser.email);
      console.log('   Rol:', newUser.id_role, '(Gerente)');
      console.log('   Contraseña:', adminData.password);
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
createAdminUser();
