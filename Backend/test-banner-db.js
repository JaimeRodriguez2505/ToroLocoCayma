const { Banner, sequelize } = require('./src/models');

async function testBanner() {
  try {
    console.log('Testing Banner Model with new fields...');
    
    // 1. Create
    console.log('Creating banner...');
    const banner = await Banner.create({
      imagen_url: '/uploads/test.jpg',
      whatsapp: '123456789',
      titulo: 'TEST TITLE',
      descripcion: 'TEST DESCRIPTION'
    });
    
    console.log('Banner created:', banner.toJSON());
    
    if (banner.titulo !== 'TEST TITLE' || banner.descripcion !== 'TEST DESCRIPTION') {
      throw new Error('Fields titulo/descripcion not saved correctly');
    }

    // 2. Read
    console.log('Reading banner...');
    const fetched = await Banner.findByPk(banner.id_banner);
    console.log('Banner fetched:', fetched.toJSON());

    // 3. Update
    console.log('Updating banner...');
    fetched.titulo = 'UPDATED TITLE';
    fetched.descripcion = 'UPDATED DESCRIPTION';
    await fetched.save();
    
    const updated = await Banner.findByPk(banner.id_banner);
    console.log('Banner updated:', updated.toJSON());
    
    if (updated.titulo !== 'UPDATED TITLE') {
      throw new Error('Update failed');
    }

    // 4. Delete
    console.log('Deleting banner...');
    await updated.destroy();
    console.log('Banner deleted successfully');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testBanner();
