const { CarritoGuardado, User, Comanda, syncCarritosGuardados } = require('../models');

const carritoGuardadoController = {
  // Obtener todos los carritos guardados
  getAll: async (req, res) => {
    try {
      console.log('Iniciando getAll carritos...');
      
      // Sincronizar la tabla antes de usar el modelo
      await syncCarritosGuardados();
      
      // Verificar si existen carritos, si no, inicializarlos automáticamente
      const existingCount = await CarritoGuardado.count();
      console.log('Carritos existentes:', existingCount);
      
      if (existingCount === 0) {
        console.log('No hay carritos existentes, inicializando automáticamente...');
        await carritoGuardadoController.initializeDefaultCarts(req, res);
        return; // La función initializeDefaultCarts ya envía la respuesta
      }

      // Usar consulta SQL directa para evitar JOINs automáticos
      const carritos = await require('../models').sequelize.query(
        'SELECT * FROM carritos_guardados ORDER BY numero_carrito ASC',
        { type: require('sequelize').QueryTypes.SELECT }
      );

      console.log('Carritos encontrados:', carritos.length);

      res.json(carritos);
    } catch (error) {
      console.error('Error al obtener carritos guardados:', error);
      res.status(500).json({
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener un carrito específico por número
  getByNumber: async (req, res) => {
    try {
      const { numero } = req.params;
      const numeroCarrito = parseInt(numero);

      if (numeroCarrito < 1 || numeroCarrito > 25) {
        return res.status(400).json({
          message: 'Número de carrito inválido. Debe estar entre 1 y 25'
        });
      }

      // Usar consulta SQL directa para evitar JOINs automáticos
      const results = await require('../models').sequelize.query(
        'SELECT * FROM carritos_guardados WHERE numero_carrito = ?',
        { 
          replacements: [numeroCarrito],
          type: require('sequelize').QueryTypes.SELECT 
        }
      );
      const carrito = results[0];

      if (!carrito) {
        return res.status(404).json({
          message: `Carrito ${numeroCarrito} no encontrado`
        });
      }

      res.json(carrito);
    } catch (error) {
      console.error('Error al obtener carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Crear o actualizar un carrito
  saveOrUpdate: async (req, res) => {
    const t = await require('../models').sequelize.transaction();
    try {
      console.log('Iniciando saveOrUpdate carrito...');
      
      // Sincronizar la tabla antes de usar el modelo
      await syncCarritosGuardados();
      
      const { numero_carrito, items, metodo_pago, observaciones, tipo_documento, cliente_data, barcode_search_results } = req.body;
      const id_usuario = req.user?.id;
      
      console.log('Datos recibidos:', {
        numero_carrito,
        items_count: items?.length || 0,
        metodo_pago,
        id_usuario
      });

      // Validar número de carrito
      if (numero_carrito < 1 || numero_carrito > 25) {
        await t.rollback();
        return res.status(400).json({
          message: 'Número de carrito inválido. Debe estar entre 1 y 25'
        });
      }

      // Validar que haya items
      if (!items || !Array.isArray(items) || items.length === 0) {
        await t.rollback();
        return res.status(400).json({
          message: 'El carrito debe contener al menos un producto'
        });
      }

      const nombre = `Carrito ${numero_carrito}`;

      // Buscar si ya existe un carrito con ese número
      const existingCarrito = await CarritoGuardado.findOne({
        where: { numero_carrito },
        transaction: t
      });

      console.log('Carrito existente encontrado:', !!existingCarrito);

      let carrito;

      if (existingCarrito) {
        console.log('Actualizando carrito existente...');
        // Actualizar carrito existente
        await existingCarrito.update({
          nombre,
          items,
          metodo_pago: metodo_pago || 'efectivo',
          observaciones,
          tipo_documento,
          cliente_data,
          barcode_search_results: barcode_search_results || [],
          id_usuario,
          is_active: true
        }, { transaction: t });

        carrito = existingCarrito;
      } else {
        console.log('Creando nuevo carrito...');
        // Crear nuevo carrito
        carrito = await CarritoGuardado.create({
          numero_carrito,
          nombre,
          items,
          metodo_pago: metodo_pago || 'efectivo',
          observaciones,
          tipo_documento,
          cliente_data,
          barcode_search_results: barcode_search_results || [],
          id_usuario,
          is_active: true
        }, { transaction: t });
      }

      // MEJORA: Crear/actualizar comanda automáticamente al guardar mesa (antes del commit)
      await carritoGuardadoController.sincronizarComandaConMesa(carrito, id_usuario, t);

      await t.commit();
      console.log('Carrito guardado exitosamente:', carrito.numero_carrito);

      res.json({
        message: `Carrito ${numero_carrito} ${existingCarrito ? 'actualizado' : 'creado'} correctamente`,
        carrito
      });
    } catch (error) {
      await t.rollback();
      console.error('Error al guardar carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Limpiar un carrito (marcarlo como vacío)
  clear: async (req, res) => {
    const t = await require('../models').sequelize.transaction();
    try {
      const { numero } = req.params;
      const numeroCarrito = parseInt(numero);
      const id_usuario = req.user?.id;

      if (numeroCarrito < 1 || numeroCarrito > 25) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Número de carrito inválido. Debe estar entre 1 y 25'
        });
      }

      const carrito = await CarritoGuardado.findOne({
        where: { numero_carrito: numeroCarrito },
        transaction: t
      });

      if (!carrito) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: `Carrito ${numeroCarrito} no encontrado`
        });
      }

      // Limpiar el carrito
      await carrito.update({
        items: [],
        metodo_pago: 'efectivo',
        observaciones: '',
        tipo_documento: null,
        cliente_data: null,
        barcode_search_results: [],
        id_usuario,
        is_active: false
      }, { transaction: t });

      await t.commit();

      // MEJORA: Eliminar comanda asociada al limpiar mesa
      await carritoGuardadoController.eliminarComandaAlLimpiarMesa(numeroCarrito);

      res.json({
        success: true,
        data: carrito,
        message: `Carrito ${numeroCarrito} limpiado correctamente`
      });
    } catch (error) {
      await t.rollback();
      console.error('Error al limpiar carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // MEJORA: Eliminar mesa completamente (vaciar y eliminar comanda)
  delete: async (req, res) => {
    const t = await require('../models').sequelize.transaction();
    try {
      const { numero } = req.params;
      const numeroCarrito = parseInt(numero);
      const id_usuario = req.user?.id;

      if (numeroCarrito < 1 || numeroCarrito > 25) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Número de carrito inválido. Debe estar entre 1 y 25'
        });
      }

      const carrito = await CarritoGuardado.findOne({
        where: { numero_carrito: numeroCarrito },
        transaction: t
      });

      if (!carrito) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: `Mesa ${numeroCarrito} no encontrada`
        });
      }

      // En lugar de eliminar completamente, solo limpiamos la mesa
      await carrito.update({
        items: [],
        metodo_pago: 'efectivo',
        observaciones: '',
        tipo_documento: null,
        cliente_data: null,
        barcode_search_results: [],
        id_usuario,
        is_active: false
      }, { transaction: t });

      await t.commit();

      // MEJORA: Eliminar comanda asociada
      await carritoGuardadoController.eliminarComandaAlLimpiarMesa(numeroCarrito);

      res.json({
        success: true,
        message: `Mesa ${numeroCarrito} eliminada correctamente`,
        carrito
      });
    } catch (error) {
      await t.rollback();
      console.error('Error al eliminar mesa:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Inicializar los 15 carritos por defecto
  initializeDefaultCarts: async (req, res) => {
    const t = await require('../models').sequelize.transaction();
    try {
      console.log('Iniciando initializeDefaultCarts...');
      const id_usuario = req.user?.id || null; // Permitir inicialización sin usuario
      console.log('ID usuario:', id_usuario);

      // Verificar si ya existen carritos
      const existingCount = await CarritoGuardado.count({ transaction: t });
      console.log('Carritos existentes en initialize:', existingCount);
      
      if (existingCount > 0) {
        console.log('Ya existen carritos, devolviendo existentes...');
        // Si ya existen, obtener los existentes y devolverlos
        // Usar consulta SQL directa para evitar JOINs automáticos
        const existingCarts = await require('../models').sequelize.query(
          'SELECT * FROM carritos_guardados ORDER BY numero_carrito ASC',
          { 
            transaction: t,
            type: require('sequelize').QueryTypes.SELECT 
          }
        );
        
        await t.commit();
        console.log('Devolviendo carritos existentes:', existingCarts.length);
        return res.json(existingCarts);
      }

      console.log('Creando 25 carritos por defecto...');
      // Crear los 25 carritos por defecto
      const defaultCarts = [];
      for (let i = 1; i <= 25; i++) {
        defaultCarts.push({
          numero_carrito: i,
          nombre: `Carrito ${i}`,
          items: [],
          metodo_pago: 'efectivo',
          observaciones: '',
          tipo_documento: null,
          cliente_data: null,
          barcode_search_results: [],
          id_usuario,
          is_active: false
        });
      }

      console.log('Guardando carritos en base de datos...');
      await CarritoGuardado.bulkCreate(defaultCarts, { transaction: t });
      
      // Obtener los carritos recién creados para devolverlos
      // Usar consulta SQL directa para evitar JOINs automáticos
      const createdCarts = await require('../models').sequelize.query(
        'SELECT * FROM carritos_guardados ORDER BY numero_carrito ASC',
        { 
          transaction: t,
          type: require('sequelize').QueryTypes.SELECT 
        }
      );
      
      await t.commit();
      console.log('Carritos creados exitosamente:', createdCarts.length);

      res.json(createdCarts);
    } catch (error) {
      await t.rollback();
      console.error('Error al inicializar carritos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // MEJORA: Sincronizar comanda automáticamente al guardar mesa
  sincronizarComandaConMesa: async (carrito, id_usuario, transaction = null) => {
    try {
      console.log(`Sincronizando comanda para mesa ${carrito.numero_carrito}`);
      
      // Solo crear comanda si la mesa tiene productos
      if (!carrito.items || carrito.items.length === 0) {
        console.log(`Mesa ${carrito.numero_carrito} vacía, no se crea comanda`);
        return;
      }

      // Convertir items del carrito a formato comanda
      const productos = carrito.items.map(item => ({
        producto_id: item.producto_id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: parseFloat(item.precio_unitario || 0),
        precioConIgv: parseFloat(item.precio_unitario_con_igv || 0),
        subtotal: item.subtotal || 0
      }));

      // Calcular totales
      let total = 0;
      let totalConIgv = 0;
      productos.forEach(producto => {
        total += producto.precio * producto.cantidad;
        totalConIgv += producto.precioConIgv * producto.cantidad;
      });

      // Opciones para las consultas (con o sin transacción)
      const queryOptions = transaction ? { transaction } : {};

      // Buscar comanda existente
      const comandaExistente = await Comanda.findOne({
        where: { 
          numero_carrito: carrito.numero_carrito,
          is_active: true 
        },
        ...queryOptions
      });

      if (comandaExistente) {
        // Actualizar comanda existente
        await comandaExistente.update({
          productos: productos,
          total: total,
          total_con_igv: totalConIgv,
          observaciones: carrito.observaciones || comandaExistente.observaciones,
          id_usuario: id_usuario,
          fecha_actualizacion: new Date()
        }, queryOptions);
        console.log(`✅ Comanda ${comandaExistente.comanda_id} actualizada para mesa ${carrito.numero_carrito}`);
      } else {
        // Crear nueva comanda
        const nuevaComanda = await Comanda.create({
          numero_carrito: carrito.numero_carrito,
          nombre: `Comanda Mesa ${carrito.numero_carrito}`,
          productos: productos,
          total: total,
          total_con_igv: totalConIgv,
          observaciones: carrito.observaciones,
          id_usuario: id_usuario,
          estado: 'pendiente',
          is_active: true,
          fecha_creacion: new Date(),
          fecha_actualizacion: new Date()
        }, queryOptions);
        console.log(`✅ Nueva comanda ${nuevaComanda.comanda_id} creada para mesa ${carrito.numero_carrito}`);
      }
    } catch (error) {
      // Propagar el error para que se maneje en la transacción principal
      console.error(`❌ Error al sincronizar comanda para mesa ${carrito.numero_carrito}:`, error);
      throw error;
    }
  },

  // MEJORA: Eliminar comanda al limpiar mesa
  eliminarComandaAlLimpiarMesa: async (numero_carrito) => {
    try {
      console.log(`Eliminando comanda para mesa ${numero_carrito}`);
      
      const comanda = await Comanda.findOne({
        where: { 
          numero_carrito: numero_carrito,
          is_active: true
        }
      });
      
      if (comanda) {
        // Eliminar comanda completamente (soft delete)
        await comanda.update({
          is_active: false,
          fecha_actualizacion: new Date()
        });
        console.log(`✅ Comanda eliminada para mesa ${numero_carrito}`);
      }
    } catch (error) {
      // No fallar la limpieza del carrito si hay error en la comanda
      console.error(`❌ Error al eliminar comanda para mesa ${numero_carrito}:`, error);
    }
  }
};

module.exports = carritoGuardadoController;
