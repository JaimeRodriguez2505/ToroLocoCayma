const { sequelize, Categoria, Producto } = require('../src/models');

async function seedParrilleria() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Iniciando seed de Parrillería Toro Loco...');

    // 1. Limpiar datos existentes (opcional, comentar si se quieren conservar)
    // await Producto.destroy({ where: {}, transaction });
    // await Categoria.destroy({ where: {}, transaction });

    // 2. Definir Categorías
    const categoriasData = [
      {
        nombre: 'Parrillas',
        descripcion: 'Nuestras mejores carnes a la parrilla',
        imagen_url: 'https://images.unsplash.com/photo-1544025162-d76690b60943'
      },
      {
        nombre: 'Cortes Especiales',
        descripcion: 'Cortes premium importados y nacionales',
        imagen_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e'
      },
      {
        nombre: 'Guarniciones',
        descripcion: 'Acompañamientos perfectos para tu parrilla',
        imagen_url: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7'
      },
      {
        nombre: 'Bebidas & Cocteles',
        descripcion: 'Refrescos, cervezas y coctelería de autor',
        imagen_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b'
      },
      {
        nombre: 'Vinos',
        descripcion: 'Nuestra selección de vinos tintos y blancos',
        imagen_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3'
      }
    ];

    const categoriasMap = {};

    for (const catData of categoriasData) {
      const [categoria] = await Categoria.findOrCreate({
        where: { nombre: catData.nombre },
        defaults: catData,
        transaction
      });
      categoriasMap[catData.nombre] = categoria.id_categoria;
      console.log(`Categoría procesada: ${catData.nombre}`);
    }

    // 3. Definir Productos por Categoría
    const productosData = [
      // PARRILLAS
      {
        sku: 'PAR-001',
        nombre: 'Parrilla Toro Loco (2 Personas)',
        descripcion: 'Bife de chorizo, chuleta de cerdo, anticuchos, chorizo, papas doradas y ensalada.',
        precio_unitario: 75.00, // Sin IGV aprox
        precio_unitario_con_igv: 89.00,
        stock: 100,
        categoria: 'Parrillas',
        es_oferta: true,
        precio_oferta: 67.00,
        precio_oferta_con_igv: 79.00,
        imagen_url: 'https://images.unsplash.com/photo-1544025162-d76690b60943'
      },
      {
        sku: 'PAR-002',
        nombre: 'Parrilla Familiar (4 Personas)',
        descripcion: 'Lomo fino, costillas BBQ, pollo a la parrilla, chorizos, morcilla, papas fritas y ensalada familiar.',
        precio_unitario: 135.00,
        precio_unitario_con_igv: 159.00,
        stock: 100,
        categoria: 'Parrillas',
        imagen_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1'
      },
      {
        sku: 'PAR-003',
        nombre: 'Pollo a la Parrilla (1/2)',
        descripcion: 'Medio pollo deshuesado marinado en finas hierbas con papas y ensalada.',
        precio_unitario: 28.00,
        precio_unitario_con_igv: 33.00,
        stock: 100,
        categoria: 'Parrillas',
        imagen_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b'
      },

      // CORTES ESPECIALES
      {
        sku: 'COR-001',
        nombre: 'Bife de Chorizo (350g)',
        descripcion: 'Jugoso corte de bife angosto a la parrilla.',
        precio_unitario: 48.00,
        precio_unitario_con_igv: 56.00,
        stock: 100,
        categoria: 'Cortes Especiales',
        imagen_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e'
      },
      {
        sku: 'COR-002',
        nombre: 'Lomo Fino (300g)',
        descripcion: 'El corte más suave de la res, término a elección.',
        precio_unitario: 55.00,
        precio_unitario_con_igv: 65.00,
        stock: 100,
        categoria: 'Cortes Especiales',
        imagen_url: 'https://images.unsplash.com/photo-1558030006-45067198663e'
      },
      {
        sku: 'COR-003',
        nombre: 'Tomahawk Steak (800g)',
        descripcion: 'Imponente corte con hueso, ideal para compartir.',
        precio_unitario: 110.00,
        precio_unitario_con_igv: 130.00,
        stock: 100,
        categoria: 'Cortes Especiales',
        es_oferta: true,
        precio_oferta: 99.00,
        precio_oferta_con_igv: 116.00,
        imagen_url: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef'
      },

      // GUARNICIONES
      {
        sku: 'GUA-001',
        nombre: 'Papas Nativas Doradas',
        descripcion: 'Selección de papas andinas doradas en mantequilla y hierbas.',
        precio_unitario: 12.00,
        precio_unitario_con_igv: 14.00,
        stock: 100,
        categoria: 'Guarniciones',
        imagen_url: 'https://images.unsplash.com/photo-1618449845540-b43263e8dd19'
      },
      {
        sku: 'GUA-002',
        nombre: 'Ensalada Parrillera',
        descripcion: 'Mix de lechugas, tomate, palta, choclo y vinagreta de la casa.',
        precio_unitario: 15.00,
        precio_unitario_con_igv: 18.00,
        stock: 100,
        categoria: 'Guarniciones',
        imagen_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'
      },
      {
        sku: 'GUA-003',
        nombre: 'Choclo con Queso',
        descripcion: 'Choclo desgranado con queso fresco serrano.',
        precio_unitario: 14.00,
        precio_unitario_con_igv: 16.50,
        stock: 100,
        categoria: 'Guarniciones',
        imagen_url: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7'
      },

      // BEBIDAS & COCTELES
      {
        sku: 'BEB-001',
        nombre: 'Pisco Sour Clásico',
        descripcion: 'Nuestro pisco sour bandera con quebranta.',
        precio_unitario: 22.00,
        precio_unitario_con_igv: 26.00,
        stock: 100,
        categoria: 'Bebidas & Cocteles',
        imagen_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b'
      },
      {
        sku: 'BEB-002',
        nombre: 'Chilcano de Maracuyá',
        descripcion: 'Refrescante chilcano con macerado de maracuyá.',
        precio_unitario: 20.00,
        precio_unitario_con_igv: 24.00,
        stock: 100,
        categoria: 'Bebidas & Cocteles',
        es_oferta: true,
        precio_oferta: 15.00,
        precio_oferta_con_igv: 18.00,
        imagen_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd'
      },
      {
        sku: 'BEB-003',
        nombre: 'Limonada Frozen (Jarra)',
        descripcion: 'Jarra de limonada frozen de 1 litro.',
        precio_unitario: 18.00,
        precio_unitario_con_igv: 21.00,
        stock: 100,
        categoria: 'Bebidas & Cocteles',
        imagen_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd'
      },

      // VINOS
      {
        sku: 'VIN-001',
        nombre: 'Vino Tinto Malbec (Botella)',
        descripcion: 'Vino argentino Malbec reserva.',
        precio_unitario: 65.00,
        precio_unitario_con_igv: 78.00,
        stock: 100,
        categoria: 'Vinos',
        imagen_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3'
      },
      {
        sku: 'VIN-002',
        nombre: 'Vino Blanco Sauvignon Blanc',
        descripcion: 'Vino chileno fresco y frutado.',
        precio_unitario: 55.00,
        precio_unitario_con_igv: 65.00,
        stock: 100,
        categoria: 'Vinos',
        imagen_url: 'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d'
      }
    ];

    for (const prodData of productosData) {
      const categoriaId = categoriasMap[prodData.categoria];
      
      // Eliminar el nombre de categoría del objeto para que no falle al insertar
      const { categoria, ...productoFinal } = prodData;
      
      await Producto.findOrCreate({
        where: { sku: productoFinal.sku },
        defaults: {
          ...productoFinal,
          id_categoria: categoriaId,
          precio_mayoritario: productoFinal.precio_unitario, // Por defecto igual
          precio_mayoritario_con_igv: productoFinal.precio_unitario_con_igv
        },
        transaction
      });
      console.log(`Producto procesado: ${productoFinal.nombre}`);
    }

    await transaction.commit();
    console.log('✅ Seed completado exitosamente con stock de 100 para todos los productos.');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedParrilleria();
