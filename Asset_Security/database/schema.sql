-- =======================================================================
-- CampusAssetSecurity Database Schema
-- Target Engine: MySQL 8.x / MariaDB 10.5+ / PostgreSQL compatible
-- Database Name: campus_asset_security
-- =======================================================================

CREATE DATABASE IF NOT EXISTS `campus_asset_security` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `campus_asset_security`;

-- 1. Roles & Permissions
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_code` VARCHAR(32) NOT NULL UNIQUE,
  `role_name` VARCHAR(64) NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. System Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `email` VARCHAR(128) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NULL,
  `role_id` INT NOT NULL,
  `role_code` VARCHAR(32) NOT NULL DEFAULT 'LAB_STAFF',
  `department` VARCHAR(128) NOT NULL,
  `phone` VARCHAR(32) NULL,
  `status` ENUM('ACTIVE', 'SUSPENDED', 'INACTIVE') DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Asset Categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_code` VARCHAR(32) NOT NULL UNIQUE,
  `category_name` VARCHAR(64) NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Locations & Facilities
CREATE TABLE IF NOT EXISTS `locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `location_code` VARCHAR(32) NOT NULL UNIQUE,
  `name` VARCHAR(128) NOT NULL,
  `building` VARCHAR(128) NOT NULL,
  `floor` VARCHAR(32) NULL,
  `room` VARCHAR(32) NULL,
  `is_secure_zone` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Physical Security Checkpoints
CREATE TABLE IF NOT EXISTS `checkpoints` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `checkpoint_code` VARCHAR(32) NOT NULL UNIQUE,
  `name` VARCHAR(128) NOT NULL,
  `location_id` INT NOT NULL,
  `location_name` VARCHAR(128) NULL,
  `direction` ENUM('ENTRY', 'EXIT', 'BIDIRECTIONAL') DEFAULT 'BIDIRECTIONAL',
  `camera_installed` BOOLEAN DEFAULT FALSE,
  `status` ENUM('ACTIVE', 'MAINTENANCE', 'OFFLINE') DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_checkpoints_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. IoT Edge Gate Controllers & Readers
CREATE TABLE IF NOT EXISTS `iot_devices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `device_code` VARCHAR(64) NOT NULL UNIQUE,
  `name` VARCHAR(128) NOT NULL,
  `device_type` VARCHAR(64) NOT NULL, -- 'ESP32-GATE', 'ESP32-CAM'
  `checkpoint_id` INT NOT NULL,
  `ip_address` VARCHAR(64) NULL,
  `mac_address` VARCHAR(32) NULL,
  `firmware_version` VARCHAR(32) DEFAULT 'v2.4.1',
  `status` ENUM('ONLINE', 'OFFLINE', 'WARNING', 'ERROR') DEFAULT 'ONLINE',
  `alarm_active` BOOLEAN DEFAULT FALSE,
  `camera_installed` BOOLEAN DEFAULT FALSE,
  `rssi` INT DEFAULT -55,
  `last_seen` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_devices_checkpoint` FOREIGN KEY (`checkpoint_id`) REFERENCES `checkpoints` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Managed Campus Assets
CREATE TABLE IF NOT EXISTS `assets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `asset_code` VARCHAR(64) NOT NULL UNIQUE,
  `asset_name` VARCHAR(128) NOT NULL,
  `category_id` INT NOT NULL,
  `category_name` VARCHAR(64) NULL,
  `description` TEXT NULL,
  `department` VARCHAR(128) NOT NULL,
  `location_id` INT NOT NULL,
  `location_name` VARCHAR(128) NULL,
  `status` ENUM('AVAILABLE', 'ISSUED', 'MISSING', 'RECOVERED', 'UNDER_REPAIR', 'OUT_OF_SERVICE') DEFAULT 'AVAILABLE',
  `maintenance_status` ENUM('WORKING', 'NOT_WORKING', 'UNDER_REPAIR', 'OUT_OF_SERVICE') DEFAULT 'WORKING',
  `condition_rating` ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED') DEFAULT 'GOOD',
  `risk_score` INT DEFAULT 50,
  `risk_level` ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
  `assigned_to` VARCHAR(128) NULL,
  `rfid_uid` VARCHAR(32) NULL UNIQUE,
  `purchase_date` DATE NULL,
  `warranty_expiry` DATE NULL,
  `image_path` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_assets_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_assets_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  INDEX `idx_asset_rfid` (`rfid_uid`),
  INDEX `idx_asset_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. RFID Physical Tags
CREATE TABLE IF NOT EXISTS `rfid_tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rfid_uid` VARCHAR(32) NOT NULL UNIQUE,
  `asset_id` INT NULL,
  `tag_type` VARCHAR(32) DEFAULT 'MIFARE_CLASSIC_1K',
  `status` ENUM('ACTIVE', 'DECOMMISSIONED', 'RESERVED') DEFAULT 'ACTIVE',
  `issued_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tags_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Checkpoint Optical Camera Evidence Snapshots
CREATE TABLE IF NOT EXISTS `camera_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` VARCHAR(64) NOT NULL UNIQUE,
  `checkpoint_id` INT NOT NULL,
  `checkpoint_name` VARCHAR(128) NOT NULL,
  `device_code` VARCHAR(64) NOT NULL,
  `event_type` VARCHAR(64) NOT NULL, -- 'UNAUTHORIZED_EXIT', 'MISSING_ASSET'
  `image_url` TEXT NOT NULL,
  `trigger_reason` VARCHAR(255) NOT NULL,
  `rfid_uid` VARCHAR(32) NULL,
  `asset_name` VARCHAR(128) NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_camera_checkpoint` FOREIGN KEY (`checkpoint_id`) REFERENCES `checkpoints` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. RFID Scan Logs
CREATE TABLE IF NOT EXISTS `rfid_scans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rfid_uid` VARCHAR(32) NOT NULL,
  `asset_id` INT NULL,
  `asset_name` VARCHAR(128) NULL,
  `checkpoint_id` INT NOT NULL,
  `checkpoint_name` VARCHAR(128) NULL,
  `device_code` VARCHAR(64) NOT NULL,
  `result` ENUM('AUTHORIZED', 'UNAUTHORIZED', 'MISSING_ASSET', 'UNKNOWN_TAG') NOT NULL,
  `action_taken` VARCHAR(128) NOT NULL,
  `buzzer_triggered` BOOLEAN DEFAULT FALSE,
  `led_status` VARCHAR(32) DEFAULT 'GREEN',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_scan_rfid` (`rfid_uid`),
  INDEX `idx_scan_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Asset Movement & Gate Crossing History
CREATE TABLE IF NOT EXISTS `asset_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `asset_id` INT NOT NULL,
  `asset_code` VARCHAR(64) NOT NULL,
  `asset_name` VARCHAR(128) NOT NULL,
  `rfid_uid` VARCHAR(32) NOT NULL,
  `checkpoint_id` INT NOT NULL,
  `checkpoint_name` VARCHAR(128) NOT NULL,
  `device_code` VARCHAR(64) NOT NULL,
  `direction` ENUM('ENTRY', 'EXIT') DEFAULT 'ENTRY',
  `authorization_status` ENUM('AUTHORIZED', 'UNAUTHORIZED') NOT NULL,
  `previous_checkpoint_id` INT NULL,
  `scanned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_move_asset` (`asset_id`),
  INDEX `idx_move_scanned` (`scanned_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Security Incidents & Alarms
CREATE TABLE IF NOT EXISTS `security_alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `alert_code` VARCHAR(64) NOT NULL UNIQUE,
  `alert_type` VARCHAR(64) NOT NULL,
  `severity` ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') NOT NULL,
  `asset_id` INT NULL,
  `asset_name` VARCHAR(128) NULL,
  `asset_code` VARCHAR(64) NULL,
  `rfid_uid` VARCHAR(32) NULL,
  `checkpoint_id` INT NOT NULL,
  `checkpoint_name` VARCHAR(128) NOT NULL,
  `device_code` VARCHAR(64) NOT NULL,
  `message` TEXT NOT NULL,
  `camera_event_id` VARCHAR(64) NULL,
  `camera_image_url` TEXT NULL,
  `status` ENUM('OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_ALARM') DEFAULT 'OPEN',
  `resolved_by` VARCHAR(128) NULL,
  `resolved_at` TIMESTAMP NULL,
  `resolution_notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_alert_status` (`status`),
  INDEX `idx_alert_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Asset Borrowing / Loan Registry
CREATE TABLE IF NOT EXISTS `asset_loans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `asset_id` INT NOT NULL,
  `asset_name` VARCHAR(128) NOT NULL,
  `asset_code` VARCHAR(64) NOT NULL,
  `borrower_name` VARCHAR(128) NOT NULL,
  `borrower_id` VARCHAR(64) NOT NULL,
  `department` VARCHAR(128) NOT NULL,
  `purpose` VARCHAR(255) NOT NULL,
  `status` ENUM('ACTIVE', 'RETURNED', 'OVERDUE') DEFAULT 'ACTIVE',
  `issued_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expected_return` TIMESTAMP NOT NULL,
  `returned_at` TIMESTAMP NULL,
  CONSTRAINT `fk_loans_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
