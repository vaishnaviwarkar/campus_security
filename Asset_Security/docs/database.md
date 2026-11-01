# Database Architecture - CampusAssetSecurity

## Database: `campus_asset_security` (MySQL 8.x)

The database schema utilizes 16 fully normalized tables with primary keys, foreign key constraints, indexes on high-frequency search columns, and timestamp tracking:

1. **`roles`**: System roles (`ADMIN`, `LAB_STAFF`, `STUDENT`).
2. **`users`**: System user credentials, hashed passwords (`bcrypt`), role associations, and active status.
3. **`assets`**: Campus assets catalog, codes, categories, status (`AVAILABLE`, `ISSUED`, `MISSING`, `RECOVERED`, `UNDER_REPAIR`, `OUT_OF_SERVICE`), maintenance status, and risk level.
4. **`rfid_tags`**: 13.56MHz UID tag registry with unique constraints and asset mapping.
5. **`checkpoints`**: Physical monitoring locations (e.g. `CP01 - Main Entrance`, `CP02 - Lab Exit`).
6. **`iot_devices`**: ESP32 and ESP32-CAM nodes, IP addresses, firmware versions, and last heartbeat timestamps.
7. **`iot_commands`**: Remote actuator command queue (e.g. `RESET_ALARM`, `GREEN`, `RED`, `BUZZER_OFF`).
8. **`asset_movements`**: Complete audit log of every RFID scan, authorization outcome, and checkpoint.
9. **`issue_records`**: Tracking asset checkouts, borrowers, purpose, and expected return dates.
10. **`alerts`**: High-priority security and operational incidents with severity levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
11. **`maintenance_records`**: Detailed maintenance service logs and repair notes.
12. **`recovery_records`**: Documentation of missing assets located at checkpoints with physical evidence.
13. **`camera_events`**: Captured snapshot metadata and image file references linked to security incidents.
14. **`notifications`**: Live user notification alerts.
15. **`audit_logs`**: Comprehensive administrative action audit trail.
