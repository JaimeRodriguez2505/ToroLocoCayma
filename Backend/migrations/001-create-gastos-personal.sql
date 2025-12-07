-- Migración: Crear tabla gastos_personal
-- Fecha: 2025-09-25
-- Descripción: Tabla para gestionar gastos de personal del restaurante

CREATE TABLE IF NOT EXISTS `gastos_personal` (
  `gasto_id` INT NOT NULL AUTO_INCREMENT,
  `concepto` VARCHAR(200) NOT NULL COMMENT 'Descripción del gasto (ej: Alimentación, Transporte, Materiales)',
  `monto` DECIMAL(10,2) NOT NULL COMMENT 'Monto del gasto',
  `fecha_gasto` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha en que se realizó el gasto',
  `descripcion` TEXT NULL COMMENT 'Descripción detallada del gasto',
  `categoria` ENUM('alimentacion','transporte','materiales','reparaciones','servicios','limpieza','mantenimiento','otros') NOT NULL DEFAULT 'otros' COMMENT 'Categoría específica del gasto del restaurante',
  `comprobante_url` VARCHAR(500) NULL COMMENT 'URL del comprobante o recibo (opcional)',
  `estado` ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente' COMMENT 'Estado del gasto: pendiente, aprobado o rechazado',
  `id_usuario_solicitante` INT NOT NULL COMMENT 'ID del usuario que solicita el gasto',
  `id_usuario_revisor` INT NULL COMMENT 'ID del administrador que revisó el gasto',
  `fecha_revision` DATETIME NULL COMMENT 'Fecha en que se revisó el gasto',
  `comentarios_revision` TEXT NULL COMMENT 'Comentarios del administrador sobre la revisión',
  `prioridad` ENUM('baja','media','alta','urgente') NOT NULL DEFAULT 'media' COMMENT 'Prioridad del gasto',
  `es_reembolso` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indica si es un reembolso de gasto ya realizado o una solicitud previa',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`gasto_id`),
  INDEX `idx_gastos_estado` (`estado`),
  INDEX `idx_gastos_solicitante` (`id_usuario_solicitante`),
  INDEX `idx_gastos_fecha` (`fecha_gasto`),
  INDEX `idx_gastos_categoria` (`categoria`),
  INDEX `idx_gastos_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
