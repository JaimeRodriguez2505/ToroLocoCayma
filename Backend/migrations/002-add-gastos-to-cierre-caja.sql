-- Migration: Add expense tracking fields to cierre_caja table
-- Date: 2025-10-10
-- Description: Adds columns for tracking approved expenses, expected balance, and discrepancies in cash register closings

-- Add new columns to cierres_caja table (MySQL compatible syntax)
-- Check if column exists before adding
SET @dbname = DATABASE();
SET @tablename = 'cierres_caja';
SET @columnname1 = 'total_gastos_aprobados';
SET @columnname2 = 'saldo_final_esperado';
SET @columnname3 = 'discrepancia';

-- Add total_gastos_aprobados if not exists
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname1)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname1, ' DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT ''Total de gastos de personal aprobados en el día''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add saldo_final_esperado if not exists
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname2)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname2, ' DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT ''Saldo esperado después de restar gastos (total_efectivo - total_gastos_aprobados)''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add discrepancia if not exists
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname3)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname3, ' DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT ''Diferencia entre saldo_efectivo reportado y saldo_final_esperado''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
