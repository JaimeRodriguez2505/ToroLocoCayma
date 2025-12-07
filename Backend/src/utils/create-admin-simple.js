#!/usr/bin/env node

/**
 * Script simple para crear un usuario administrador (Gerente - rol 1)
 * Uso: node create-admin-simple.js
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
      name: 'Jaime Rodriguez',
      email: 'jaimeandre17@hotmail.com',
      password: 'EthaN2505', // Cambia esta contraseña por una más segura
      id_role: 1 // Rol de Gerente (más alto)
    };

    // Verificar si ya existe un usuario con ese email
    const existingUser = await User.findOne({ where: { email: adminData.email } });
    if (existingUser) {
      console.log('⚠️  Ya existe un usuario con ese email:', adminData.email);
      console.log('   ID:', existingUser.id_user);
      console.log('   Rol actual:', existingUser.id_role);
      
      // Actualizar automáticamente el rol a Gerente
      existingUser.id_role = 1;
      await existingUser.save();
      console.log('✅ Usuario actualizado con rol de Gerente');
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
