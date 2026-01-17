-- Migración para añadir campos de delivery a comandas
-- Ejecutar antes de iniciar la aplicación

USE toroloco_erp;

-- Agregar campos si no existen (MySQL compatible)
ALTER TABLE comandas 
ADD COLUMN es_delivery BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica si es una comanda delivery (auto-eliminación en 30min)';

ALTER TABLE comandas 
ADD COLUMN fecha_expiracion DATETIME NULL COMMENT 'Fecha de expiración para comandas delivery';

-- Actualizar ENUM de estado para incluir 'expirado'
ALTER TABLE comandas 
MODIFY COLUMN estado ENUM('pendiente', 'en_proceso', 'listo', 'entregado', 'expirado') NOT NULL DEFAULT 'pendiente' 
COMMENT 'Estado de la comanda: pendiente, en_proceso, listo, entregado, expirado';

-- Crear índices para optimizar consultas (MySQL compatible)
CREATE INDEX idx_comandas_delivery_expiracion ON comandas (es_delivery, is_active, fecha_expiracion);
CREATE INDEX idx_comandas_numero_carrito_active ON comandas (numero_carrito, is_active);

-- Verificar estructura
DESCRIBE comandas;
