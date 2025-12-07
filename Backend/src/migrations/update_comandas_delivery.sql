-- Migración para añadir campos de delivery y expiración a comandas
-- Ejecutar este script en la base de datos para agregar los nuevos campos

-- 1. Agregar nuevos campos a la tabla comandas
ALTER TABLE comandas 
ADD COLUMN es_delivery BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica si es una comanda delivery (auto-eliminación en 30min)';

ALTER TABLE comandas 
ADD COLUMN fecha_expiracion DATETIME NULL COMMENT 'Fecha de expiración para comandas delivery';

-- 2. Actualizar el ENUM de estado para incluir 'expirado'
ALTER TABLE comandas 
MODIFY COLUMN estado ENUM('pendiente', 'en_proceso', 'listo', 'entregado', 'expirado') NOT NULL DEFAULT 'pendiente' 
COMMENT 'Estado de la comanda: pendiente, en_proceso, listo, entregado, expirado';

-- 3. Crear índice para optimizar búsquedas de comandas delivery expiradas
CREATE INDEX idx_comandas_delivery_expiracion ON comandas (es_delivery, is_active, fecha_expiracion);

-- 4. Crear índice para optimizar búsquedas por número de carrito
CREATE INDEX idx_comandas_numero_carrito_active ON comandas (numero_carrito, is_active);

-- Verificar que los campos se agregaron correctamente
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT, 
    COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'comandas' 
AND COLUMN_NAME IN ('es_delivery', 'fecha_expiracion', 'estado')
ORDER BY ORDINAL_POSITION;
