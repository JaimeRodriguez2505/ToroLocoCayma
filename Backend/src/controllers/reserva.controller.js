const Reserva = require("../models/reserva.model");
const path = require("path");
const fs = require("fs");

// Crear una nueva reserva
const createReserva = async (req, res) => {
    try {
        const { nombre, telefono, fecha_reserva, cantidad_personas, comentarios } = req.body;
        let comprobante_url = null;

        if (req.file) {
            // Guardar ruta relativa para servir estáticamente
            comprobante_url = `/uploads/reservas/${req.file.filename}`;
        }

        const nuevaReserva = await Reserva.create({
            nombre,
            telefono,
            fecha_reserva,
            cantidad_personas,
            comentarios,
            comprobante_url,
            estado: "PENDIENTE"
        });

        res.status(201).json({
            message: "Reserva creada exitosamente",
            reserva: nuevaReserva
        });
    } catch (error) {
        console.error("Error al crear reserva:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Obtener todas las reservas
const getAllReservas = async (req, res) => {
    try {
        const reservas = await Reserva.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(reservas);
    } catch (error) {
        console.error("Error al obtener reservas:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Actualizar estado de reserva
const updateReservaStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const reserva = await Reserva.findByPk(id);

        if (!reserva) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        reserva.estado = estado;
        await reserva.save();

        res.status(200).json({
            message: "Estado de reserva actualizado",
            reserva
        });
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Actualizar comprobante de reserva (para paso 2 si es separado)
const uploadComprobante = async (req, res) => {
    try {
        const { id } = req.params;
        
        const reserva = await Reserva.findByPk(id);
        if (!reserva) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        if (req.file) {
             // Si ya existe un comprobante, podríamos querer borrar el anterior, pero por ahora solo actualizamos
            reserva.comprobante_url = `/uploads/reservas/${req.file.filename}`;
            await reserva.save();
            
            res.status(200).json({
                message: "Comprobante subido exitosamente",
                reserva
            });
        } else {
            res.status(400).json({ message: "No se subió ningún archivo" });
        }

    } catch (error) {
        console.error("Error al subir comprobante:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
}

module.exports = {
    createReserva,
    getAllReservas,
    updateReservaStatus,
    uploadComprobante
};
