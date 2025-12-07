const express = require('express');
const router = express.Router();
const comandaController = require('../controllers/comanda.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { verificarRolesSinHorario } = require('../middlewares/restricciones.middleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas de solo lectura (requieren autenticación, pero no horario laboral para rol 3)
router.get('/', verificarRolesSinHorario([1, 2, 3]), comandaController.getAll);
router.get('/estadisticas', verificarRolesSinHorario([1, 2, 3]), comandaController.getEstadisticas);
router.get('/:id', verificarRolesSinHorario([1, 2, 3]), comandaController.getById);
router.get('/carrito/:numero', verificarRolesSinHorario([1, 2, 3]), comandaController.getByCarrito);

// Rutas de escritura (requieren autenticación y horario laboral)
router.post('/', comandaController.createOrUpdate);
router.put('/:id/estado', comandaController.updateEstado);
router.delete('/:id', comandaController.delete);

module.exports = router;
