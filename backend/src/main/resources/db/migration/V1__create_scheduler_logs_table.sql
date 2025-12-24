-- Migration for File Manager Scheduler Logs table
-- File Manager & Auto Import Scheduler feature

CREATE TABLE IF NOT EXISTS `file_manager_scheduler_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_code` VARCHAR(50) NULL,
  `import_type` VARCHAR(50) NULL COMMENT 'AgencyList or PolicyList',
  `file_name` VARCHAR(255) NULL,
  `file_path` VARCHAR(1000) NULL,
  `status` VARCHAR(20) NULL COMMENT 'SUCCESS or FAILED',
  `created_count` INT NULL DEFAULT 0,
  `updated_count` INT NULL DEFAULT 0,
  `error_count` INT NULL DEFAULT 0,
  `error_message` TEXT NULL,
  `processed_by` VARCHAR(100) NULL COMMENT 'SCHEDULER or MANUAL',
  `processed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_company_code` (`company_code`),
  INDEX `idx_status` (`status`),
  INDEX `idx_processed_at` (`processed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
