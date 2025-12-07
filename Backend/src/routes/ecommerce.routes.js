const express = require("express");
const router = express.Router();
const ecommerceController = require("../controllers/ecommerce.controller");

// Rutas públicas de ecommerce (sin autenticación)
// Estas APIs están diseñadas para ser consumidas por un frontend de ecommerce público

// Obtener todos los productos para ecommerce
router.get("/productos", ecommerceController.getProducts);

// Obtener todas las categorías para ecommerce
router.get("/categorias", ecommerceController.getCategories);

// Obtener productos por categoría para ecommerce
router.get("/categorias/:id_categoria/productos", ecommerceController.getProductsByCategory);

// Obtener un producto específico para ecommerce
router.get("/productos/:id", ecommerceController.getProductById);

// Obtener productos en oferta para ecommerce
router.get("/ofertas", ecommerceController.getOffersProducts);

// Obtener el banner para ecommerce
router.get("/banner", ecommerceController.getBannerPublic);

// Obtener todos los banners para ecommerce (carrusel)
router.get("/banners", ecommerceController.getBannersPublic);

// Obtener todas las tarjetas para ecommerce
router.get("/tarjetas", ecommerceController.getTarjetasPublic);


// Enviar reclamación desde el ecommerce
const ecommerceLibroReclamacionesController = require("../controllers/ecommerceLibroReclamaciones.controller");
router.post("/libro-reclamaciones", ecommerceLibroReclamacionesController.create);

// Obtener una tarjeta específica por ID para ecommerce
router.get("/tarjetas/:id", ecommerceController.getTarjetaByIdPublic);

module.exports = router;
