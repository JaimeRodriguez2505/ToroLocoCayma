
const { sequelize } = require('../src/config/database');
const Categoria = require('../src/models/categoria.model');
const Producto = require('../src/models/producto.model');
const Banner = require('../src/models/banner.model');
const Tarjeta = require('../src/models/tarjeta.model');

// Datos de prueba para un restaurante de carnes y parrillas (Toro Loco)
const CATEGORIAS_DATA = [
  {
    nombre: 'Parrillas',
    descripcion: 'Las mejores carnes a la parrilla, cortes premium.',
    imagen_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    nombre: 'Hamburguesas',
    descripcion: 'Hamburguesas artesanales con carne 100% Angus.',
    imagen_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    nombre: 'Bebidas',
    descripcion: 'Refrescos, cervezas artesanales y cócteles.',
    imagen_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    nombre: 'Guarniciones',
    descripcion: 'El acompañamiento perfecto para tu carne.',
    imagen_url: 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

const PRODUCTOS_DATA = [
  // Parrillas
  {
    sku: 'PAR-001',
    nombre: 'Bife Angosto (350g)',
    descripcion: 'Corte jugoso y tierno, término a elección. Incluye papas fritas y ensalada.',
    precio_unitario: 45.00,
    precio_unitario_con_igv: 45.00,
    imagen_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    stock: 50,
    categoria_index: 0, // Parrillas
    es_oferta: false
  },
  {
    sku: 'PAR-002',
    nombre: 'Parrillada Mixta (2 Personas)',
    descripcion: 'Bife, chuleta, chorizo, anticucho, papas y ensalada.',
    precio_unitario: 85.00,
    precio_unitario_con_igv: 85.00,
    imagen_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    stock: 30,
    categoria_index: 0, // Parrillas
    es_oferta: true,
    precio_oferta: 75.00,
    precio_oferta_con_igv: 75.00
  },
  {
    sku: 'PAR-003',
    nombre: 'Costillas BBQ',
    descripcion: 'Costillas de cerdo bañadas en salsa BBQ de la casa.',
    precio_unitario: 55.00,
    precio_unitario_con_igv: 55.00,
    imagen_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    stock: 40,
    categoria_index: 0, // Parrillas
    es_oferta: false
  },
  // Hamburguesas
  {
    sku: 'HAM-001',
    nombre: 'Toro Clásica',
    descripcion: 'Carne 200g, queso cheddar, lechuga, tomate y salsa secreta.',
    precio_unitario: 25.00,
    precio_unitario_con_igv: 25.00,
    imagen_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    stock: 100,
    categoria_index: 1, // Hamburguesas
    es_oferta: false
  },
  {
    sku: 'HAM-002',
    nombre: 'Toro Royal',
    descripcion: 'Doble carne, huevo frito, tocino y doble queso.',
    precio_unitario: 32.00,
    precio_unitario_con_igv: 32.00,
    imagen_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    stock: 80,
    categoria_index: 1, // Hamburguesas
    es_oferta: true,
    precio_oferta: 28.00,
    precio_oferta_con_igv: 28.00
  },
  // Bebidas
  {
    sku: 'BEB-001',
    nombre: 'Limonada Frozen',
    descripcion: 'Refrescante limonada con hielo frappeado.',
    precio_unitario: 12.00,
    precio_unitario_con_igv: 12.00,
    imagen_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    stock: 200,
    categoria_index: 2, // Bebidas
    es_oferta: false
  },
  {
    sku: 'BEB-002',
    nombre: 'Cerveza Artesanal IPA',
    descripcion: 'Cerveza local con notas cítricas y amargor equilibrado.',
    precio_unitario: 18.00,
    precio_unitario_con_igv: 18.00,
    imagen_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    stock: 150,
    categoria_index: 2, // Bebidas
    es_oferta: false
  }
];

const BANNERS_DATA = [
  {
    titulo: '¡Noche de Parrillas!',
    descripcion: 'Todos los viernes 2x1 en cortes seleccionados. Música en vivo.',
    imagen_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    whatsapp: '51999999999'
  },
  {
    titulo: 'Nueva Toro Royal',
    descripcion: 'Prueba nuestra hamburguesa más bestial. ¿Te atreves?',
    imagen_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    whatsapp: '51999999999'
  }
];

const TARJETAS_DATA = [
  {
    titulo: 'Delivery Gratis',
    descripcion: 'Por compras mayores a S/ 80.00 en toda la zona de Cayma.',
    imagen_url: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    titulo: 'Reserva tu Mesa',
    descripcion: 'Evita colas y asegura tu lugar para esa cena especial.',
    imagen_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    titulo: 'Eventos Privados',
    descripcion: 'Cotiza con nosotros para cumpleaños y reuniones corporativas.',
    imagen_url: 'https://images.unsplash.com/photo-1519671482502-9759101d4561?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

async function seed() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa.');

    // Sincronizar modelos (con cuidado en producción, aquí asumimos demo/dev)
    // No usamos force: true para no borrar usuarios u otros datos si ya existen
    // Pero si quieres limpiar todo, podrías borrar manualmente antes.
    
    // 1. Crear Categorías
    console.log('📦 Creando categorías...');
    const categoriasCreadas = [];
    for (const catData of CATEGORIAS_DATA) {
      // Buscar si existe para no duplicar
      let [cat, created] = await Categoria.findOrCreate({
        where: { nombre: catData.nombre },
        defaults: catData
      });
      if (!created) {
        // Actualizar si ya existe para asegurar imagen
        await cat.update(catData);
      }
      categoriasCreadas.push(cat);
      console.log(`   - Categoría procesada: ${cat.nombre}`);
    }

    // 2. Crear Productos
    console.log('🍖 Creando productos...');
    for (const prodData of PRODUCTOS_DATA) {
      const categoria = categoriasCreadas[prodData.categoria_index];
      const productoData = { ...prodData, id_categoria: categoria.id_categoria };
      delete productoData.categoria_index; // Remover índice temporal

      let [prod, created] = await Producto.findOrCreate({
        where: { sku: prodData.sku },
        defaults: productoData
      });
      
      if (!created) {
         await prod.update(productoData);
      }
      console.log(`   - Producto procesado: ${prod.nombre}`);
    }

    // 3. Crear Banners
    console.log('🖼️ Creando banners...');
    // Borramos banners antiguos para tener solo los nuevos de demo
    await Banner.destroy({ where: {}, truncate: true });
    for (const bannerData of BANNERS_DATA) {
      await Banner.create(bannerData);
      console.log(`   - Banner creado: ${bannerData.titulo}`);
    }

    // 4. Crear Tarjetas
    console.log('🃏 Creando tarjetas...');
    // Borramos tarjetas antiguas
    await Tarjeta.destroy({ where: {}, truncate: true });
    for (const tarjetaData of TARJETAS_DATA) {
      await Tarjeta.create(tarjetaData);
      console.log(`   - Tarjeta creada: ${tarjetaData.titulo}`);
    }

    console.log('✨ ¡Sembrado de datos completado con éxito!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error al sembrar datos:', error);
    process.exit(1);
  }
}

seed();
