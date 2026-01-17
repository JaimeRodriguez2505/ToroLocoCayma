const express = require("express");
const router = express.Router();
const reservaController = require("../controllers/reserva.controller");
const upload = require("../middlewares/upload.middleware");

// Crear reserva (puede incluir archivo 'comprobante_reserva')
router.post("/", upload.single("comprobante_reserva"), reservaController.createReserva);

// Subir comprobante a reserva existente (Paso 2 si se hace separado)
router.post("/:id/comprobante", upload.single("comprobante_reserva"), reservaController.uploadComprobante);

// Listar reservas
router.get("/", reservaController.getAllReservas);

// Actualizar estado
router.patch("/:id/status", reservaController.updateReservaStatus);

module.exports = router;
