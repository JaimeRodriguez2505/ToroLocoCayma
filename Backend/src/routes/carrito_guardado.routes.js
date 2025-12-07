const express = require('express');
const router = express.Router();
const carritoGuardadoController = require('../controllers/carrito_guardado.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { verificarRolesSinHorario } = require('../middlewares/restricciones.middleware');

// POST /api/carritos/initialize - Inicializar los 25 carritos por defecto (NO requiere autenticación)
router.post('/initialize', carritoGuardadoController.initializeDefaultCarts);

// Aplicar middleware de autenticación a las demás rutas
router.use(authMiddleware);

// Rutas de solo lectura (requieren autenticación, pero no horario laboral para rol 3)
router.get('/', verificarRolesSinHorario([1, 2, 3]), carritoGuardadoController.getAll);
router.get('/:numero', verificarRolesSinHorario([1, 2, 3]), carritoGuardadoController.getByNumber);

// Rutas de escritura (requieren autenticación y horario laboral)
router.post('/', carritoGuardadoController.saveOrUpdate);
router.put('/:numero', carritoGuardadoController.saveOrUpdate);
router.delete('/:numero/clear', carritoGuardadoController.clear);
router.delete('/:numero', carritoGuardadoController.delete);

module.exports = router;
