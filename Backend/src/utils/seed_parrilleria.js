const { sequelize, Categoria, Producto } = require("./models");

async function seedParrilleria() {
  try {
    await sequelize.authenticate();

    const categoriasData = [
      {
        nombre: "Parrillas",
        descripcion: "Parrillas surtidas a la brasa",
        imagen_url: null,
      },
      {
        nombre: "Parrillas de Res",
        descripcion: "Cortes de res a la parrilla",
        imagen_url: null,
      },
      {
        nombre: "Parrillas de Cerdo",
        descripcion: "Cortes de cerdo a la parrilla",
        imagen_url: null,
      },
      {
        nombre: "Parrillas de Pollo",
        descripcion: "Pollo a la brasa y a la parrilla",
        imagen_url: null,
      },
      {
        nombre: "Cócteles",
        descripcion: "Coctelería clásica y de autor",
        imagen_url: null,
      },
      {
        nombre: "Bebidas",
        descripcion: "Bebidas frías y calientes",
        imagen_url: null,
      },
    ];

    const categoriasMap = {};

    for (const data of categoriasData) {
      const [categoria] = await Categoria.findOrCreate({
        where: { nombre: data.nombre },
        defaults: data,
      });
      categoriasMap[data.nombre] = categoria.id_categoria;
    }

    const productosData = [
      {
        sku: "PARR-RES-01",
        nombre: "Parrilla de Res Clásica",
        descripcion: "Bife, asado de tira y chorizo a la parrilla",
        precio_unitario: 45.0,
        precio_unitario_con_igv: 53.1,
        precio_mayoritario: 40.0,
        precio_mayoritario_con_igv: 47.2,
        stock: 100,
        id_categoria: categoriasMap["Parrillas de Res"],
      },
      {
        sku: "PARR-RES-02",
        nombre: "Parrilla de Res Premium",
        descripcion: "Lomo fino, entraña y chorizo artesanal",
        precio_unitario: 60.0,
        precio_unitario_con_igv: 70.8,
        precio_mayoritario: 55.0,
        precio_mayoritario_con_igv: 64.9,
        stock: 100,
        id_categoria: categoriasMap["Parrillas de Res"],
      },
      {
        sku: "PARR-CER-01",
        nombre: "Parrilla de Cerdo Clásica",
        descripcion: "Costillas de cerdo BBQ y panceta crocante",
        precio_unitario: 42.0,
        precio_unitario_con_igv: 49.56,
        precio_mayoritario: 38.0,
        precio_mayoritario_con_igv: 44.84,
        stock: 100,
        id_categoria: categoriasMap["Parrillas de Cerdo"],
      },
      {
        sku: "PARR-CER-02",
        nombre: "Parrilla de Chancho Familiar",
        descripcion: "Costillas, panceta y chorizo de cerdo para compartir",
        precio_unitario: 75.0,
        precio_unitario_con_igv: 88.5,
        precio_mayoritario: 68.0,
        precio_mayoritario_con_igv: 80.24,
        stock: 100,
        id_categoria: categoriasMap["Parrillas de Cerdo"],
      },
      {
        sku: "PARR-MIX-01",
        nombre: "Parrilla Mixta",
        descripcion: "Res, cerdo y pollo a la parrilla",
        precio_unitario: 65.0,
        precio_unitario_con_igv: 76.7,
        precio_mayoritario: 60.0,
        precio_mayoritario_con_igv: 70.8,
        stock: 100,
        id_categoria: categoriasMap["Parrillas"],
      },
      {
        sku: "PARR-POL-01",
        nombre: "Pollo a la Brasa Entero",
        descripcion: "Pollo a la brasa entero con guarniciones",
        precio_unitario: 55.0,
        precio_unitario_con_igv: 64.9,
        precio_mayoritario: 50.0,
        precio_mayoritario_con_igv: 59.0,
        stock: 100,
        id_categoria: categoriasMap["Parrillas de Pollo"],
      },
      {
        sku: "COC-MOJ-01",
        nombre: "Mojito Clásico",
        descripcion: "Ron, hierbabuena, lima y soda",
        precio_unitario: 18.0,
        precio_unitario_con_igv: 21.24,
        precio_mayoritario: 16.0,
        precio_mayoritario_con_igv: 18.88,
        stock: 100,
        id_categoria: categoriasMap["Cócteles"],
      },
      {
        sku: "COC-PIN-01",
        nombre: "Piña Colada",
        descripcion: "Ron, crema de coco y jugo de piña",
        precio_unitario: 20.0,
        precio_unitario_con_igv: 23.6,
        precio_mayoritario: 18.0,
        precio_mayoritario_con_igv: 21.24,
        stock: 100,
        id_categoria: categoriasMap["Cócteles"],
      },
      {
        sku: "COC-CHL-01",
        nombre: "Chilcano de Pisco",
        descripcion: "Pisco, ginger ale, limón y amargo de angostura",
        precio_unitario: 17.0,
        precio_unitario_con_igv: 20.06,
        precio_mayoritario: 15.0,
        precio_mayoritario_con_igv: 17.7,
        stock: 100,
        id_categoria: categoriasMap["Cócteles"],
      },
      {
        sku: "BEB-GAS-01",
        nombre: "Gaseosa 1.5L",
        descripcion: "Bebida gaseosa sabor cola 1.5 litros",
        precio_unitario: 10.0,
        precio_unitario_con_igv: 11.8,
        precio_mayoritario: 9.0,
        precio_mayoritario_con_igv: 10.62,
        stock: 100,
        id_categoria: categoriasMap["Bebidas"],
      },
      {
        sku: "BEB-AGU-01",
        nombre: "Agua sin gas 600ml",
        descripcion: "Agua de mesa sin gas 600 ml",
        precio_unitario: 5.0,
        precio_unitario_con_igv: 5.9,
        precio_mayoritario: 4.5,
        precio_mayoritario_con_igv: 5.31,
        stock: 100,
        id_categoria: categoriasMap["Bebidas"],
      },
    ];

    for (const data of productosData) {
      if (!data.id_categoria) {
        console.log(`Omitiendo producto ${data.nombre} por falta de categoría`);
        continue;
      }

      await Producto.findOrCreate({
        where: { sku: data.sku },
        defaults: {
          ...data,
          es_oferta: false,
          precio_oferta: null,
          precio_oferta_con_igv: null,
        },
      });
    }

    console.log("Seed de parrillería ejecutado correctamente");
  } catch (error) {
    console.error("Error ejecutando seed de parrillería:", error);
  } finally {
    await sequelize.close();
  }
}

seedParrilleria();

