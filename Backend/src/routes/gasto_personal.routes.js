const express = require('express');
const router = express.Router();
const gastoPersonalController = require('../controllers/gasto_personal.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { verificarRolesSinHorario } = require('../middlewares/restricciones.middleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas para gerentes y administradores (pueden ver todos los gastos)
router.get('/', verificarRolesSinHorario([1, 2, 3, 4]), gastoPersonalController.getAll);
router.get('/:id', verificarRolesSinHorario([1, 2, 3, 4]), gastoPersonalController.getById);

// Cualquier usuario autenticado puede crear gastos (excepto no autorizados en horario laboral)
router.post('/', gastoPersonalController.create); 
router.put('/:id', gastoPersonalController.update); // Solo el propietario puede editar
router.delete('/:id', gastoPersonalController.delete); // Solo el propietario puede eliminar

// Rutas SOLO para gerentes y administradores (roles 1 y 2)
router.patch('/:id/review', verificarRolesSinHorario([1, 2]), gastoPersonalController.review);
router.get('/admin/stats', verificarRolesSinHorario([1, 2]), gastoPersonalController.getStats);
router.get('/admin/daily-summary/:fecha', verificarRolesSinHorario([1, 2]), gastoPersonalController.getDailySummary);
router.get('/admin/frecuentes', verificarRolesSinHorario([1, 2]), gastoPersonalController.getFrequentExpenses);

module.exports = router;
