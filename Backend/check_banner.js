const { sequelize } = require('./src/config/database');
const Banner = require('./src/models/banner.model');

async function checkBannerTable() {
  try {
    await sequelize.authenticate();
    console.log('Conexión exitosa.');

    // Sincronizar solo el modelo Banner para ver si crea la tabla o si falla
    console.log('Sincronizando tabla Banner...');
    await Banner.sync({ alter: true }); 
    console.log('Tabla Banner sincronizada (alter: true).');

    const banners = await Banner.findAll();
    console.log(`Banners encontrados: ${banners.length}`);
    
    if (banners.length === 0) {
        console.log('Intentando crear un banner de prueba...');
        await Banner.create({
            imagen_url: '/uploads/banner/default.jpg',
            whatsapp: '999999999'
        });
        console.log('Banner de prueba creado.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkBannerTable();
