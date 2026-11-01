-- =======================================================================
-- CampusAssetSecurity Initial Seed Data
-- Database Name: campus_asset_security
-- =======================================================================

USE `campus_asset_security`;

-- 1. Roles
INSERT INTO `roles` (`id`, `role_code`, `role_name`, `description`) VALUES
(1, 'ADMIN', 'System Administrator', 'Full access to assets, checkpoints, devices, and security rules'),
(2, 'LAB_STAFF', 'Laboratory Manager / Staff', 'Inventory management, equipment checkout, maintenance logging'),
(3, 'SECURITY', 'Campus Security Officer', 'Perimeter gate monitoring, alerts, camera evidence audit')
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`);

-- 2. Users
INSERT INTO `users` (`id`, `name`, `email`, `role_id`, `role_code`, `department`, `phone`, `status`) VALUES
(1, 'Dr. Robert Vance', 'admin@campus.edu', 1, 'ADMIN', 'Information Technology', '+1 (555) 019-2831', 'ACTIVE'),
(2, 'Sarah Jenkins', 'staff@campus.edu', 2, 'LAB_STAFF', 'Computer Science Lab', '+1 (555) 014-9922', 'ACTIVE'),
(3, 'Officer Marcus Kane', 'security@campus.edu', 3, 'SECURITY', 'Campus Police & Safety', '+1 (555) 011-8844', 'ACTIVE')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. Categories
INSERT INTO `categories` (`id`, `category_code`, `category_name`, `description`) VALUES
(1, 'COMP', 'Computing & Laptops', 'High-performance workstations, laptops, GPU clusters'),
(2, 'LAB', 'Lab Instruments', 'Oscilloscopes, spectrum analyzers, multimeters, function generators'),
(3, 'AV', 'Audio/Visual Equipment', 'Cinema cameras, 4K projectors, studio audio mixers'),
(4, 'NET', 'Networking Hardware', 'Managed switches, edge routers, patch panels, IoT gateways')
ON DUPLICATE KEY UPDATE `category_name` = VALUES(`category_name`);

-- 4. Locations
INSERT INTO `locations` (`id`, `location_code`, `name`, `building`, `floor`, `room`, `is_secure_zone`) VALUES
(1, 'LAB-CS-101', 'Computer Science Lab A', 'Turing Hall', '1st Floor', 'Room 101', TRUE),
(2, 'LAB-EE-204', 'Electrical Engineering Lab', 'Tesla Building', '2nd Floor', 'Room 204', TRUE),
(3, 'AUD-300', 'Main Auditorium AV Room', 'Media Center', '3rd Floor', 'Room 300', FALSE),
(4, 'GATE-CP01', 'Main Campus Exit Checkpoint', 'Perimeter Gate 1', 'Ground', 'Booth 1', TRUE)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 5. Physical Checkpoints
INSERT INTO `checkpoints` (`id`, `checkpoint_code`, `name`, `location_id`, `location_name`, `direction`, `camera_installed`, `status`) VALUES
(1, 'CP01-MAIN', 'Checkpoint 1 (Main Entrance Gate)', 4, 'Perimeter Gate 1', 'BIDIRECTIONAL', TRUE, 'ACTIVE'),
(2, 'CP02-GATE', 'Checkpoint 2 (Secondary/Lab Gate)', 1, 'Turing Hall CS Lab', 'BIDIRECTIONAL', FALSE, 'ACTIVE')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 6. IoT Edge Devices
INSERT INTO `iot_devices` (`id`, `device_code`, `name`, `device_type`, `checkpoint_id`, `ip_address`, `mac_address`, `status`, `camera_installed`, `rssi`) VALUES
(1, 'ESP32-CP01-GATE', 'Checkpoint 1 Main Controller', 'ESP32-WROOM-32', 1, '192.168.1.101', '24:6F:28:AB:C1:01', 'ONLINE', FALSE, -58),
(2, 'ESP32-CP02-GATE', 'Checkpoint 2 Secondary Controller', 'ESP32-WROOM-32', 2, '192.168.1.105', '24:6F:28:AB:C2:05', 'ONLINE', FALSE, -52),
(3, 'ESP32-CAM-01', 'Perimeter Camera Unit 1', 'AI-Thinker OV2640', 1, '192.168.1.102', '24:6F:28:CD:F2:02', 'ONLINE', TRUE, -61)
ON DUPLICATE KEY UPDATE `ip_address` = VALUES(`ip_address`);

-- 7. Assets
INSERT INTO `assets` (`id`, `asset_code`, `asset_name`, `category_id`, `category_name`, `description`, `department`, `location_id`, `location_name`, `status`, `maintenance_status`, `condition_rating`, `risk_score`, `risk_level`, `assigned_to`, `rfid_uid`, `purchase_date`, `warranty_expiry`) VALUES
(1, 'AST-2024-001', 'Dell Precision 7780 Workstation', 1, 'Computing & Laptops', 'High-performance AI workstation with RTX 4090 GPU', 'Computer Science', 1, 'Computer Science Lab A', 'AVAILABLE', 'WORKING', 'EXCELLENT', 92, 'HIGH', NULL, 'E2806894000040', '2024-01-15', '2027-01-15'),
(2, 'AST-2024-002', 'Tektronix MSO46 4-Channel Oscilloscope', 2, 'Lab Instruments', '1.5 GHz Mixed Signal Digital Oscilloscope', 'Electrical Engineering', 2, 'Electrical Engineering Lab', 'ISSUED', 'WORKING', 'GOOD', 85, 'HIGH', 'Alex Mercer (Student ID: CS-9921)', 'E2801120000018', '2023-11-20', '2026-11-20'),
(3, 'AST-2024-003', 'Sony FX6 Cinema 4K Camera Rig', 3, 'Audio/Visual Equipment', 'Full-frame cinema camera with 24-70mm G-Master Lens', 'Media Arts', 3, 'Main Auditorium AV Room', 'MISSING', 'WORKING', 'EXCELLENT', 96, 'HIGH', NULL, 'E2809930000099', '2024-02-01', '2026-02-01'),
(4, 'AST-2024-004', 'Cisco Catalyst 9300 48-Port Switch', 4, 'Networking Hardware', 'Enterprise gigabit PoE managed network switch', 'Information Technology', 1, 'Computer Science Lab A', 'AVAILABLE', 'WORKING', 'GOOD', 65, 'MEDIUM', NULL, 'E2804450000044', '2023-08-10', '2028-08-10'),
(5, 'AST-2024-005', 'Keysight 34461A Digital Multimeter', 2, 'Lab Instruments', '6.5 digit precision digital bench multimeter', 'Electrical Engineering', 2, 'Electrical Engineering Lab', 'UNDER_REPAIR', 'NOT_WORKING', 'POOR', 45, 'LOW', NULL, 'E2805560000055', '2022-05-14', '2025-05-14')
ON DUPLICATE KEY UPDATE `asset_name` = VALUES(`asset_name`);

-- 8. RFID Tags
INSERT INTO `rfid_tags` (`id`, `rfid_uid`, `asset_id`, `tag_type`, `status`) VALUES
(1, 'E2806894000040', 1, 'MIFARE_CLASSIC_1K', 'ACTIVE'),
(2, 'E2801120000018', 2, 'MIFARE_CLASSIC_1K', 'ACTIVE'),
(3, 'E2809930000099', 3, 'MIFARE_CLASSIC_1K', 'ACTIVE'),
(4, 'E2804450000044', 4, 'MIFARE_CLASSIC_1K', 'ACTIVE'),
(5, 'E2805560000055', 5, 'MIFARE_CLASSIC_1K', 'ACTIVE')
ON DUPLICATE KEY UPDATE `tag_type` = VALUES(`tag_type`);

-- 9. Active Borrowing Loans
INSERT INTO `asset_loans` (`id`, `asset_id`, `asset_name`, `asset_code`, `borrower_name`, `borrower_id`, `department`, `purpose`, `status`, `issued_at`, `expected_return`) VALUES
(1, 2, 'Tektronix MSO46 4-Channel Oscilloscope', 'AST-2024-002', 'Alex Mercer', 'CS-9921', 'Electrical Engineering', 'Master Thesis Signal Analysis', 'ACTIVE', NOW() - INTERVAL 2 DAY, NOW() + INTERVAL 5 DAY)
ON DUPLICATE KEY UPDATE `borrower_name` = VALUES(`borrower_name`);
