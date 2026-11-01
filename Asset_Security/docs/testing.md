# Testing & Validation Guide - CampusAssetSecurity

## Phase Verification Checklist

### 1. Phase 1: Environment & File Structure Verification
- [x] Project root directory `Asset_Security/` initialized.
- [x] Frontend workspace `Asset_Security/frontend/` configured with React, Vite, and Tailwind CSS.
- [x] Backend workspace `Asset_Security/backend/` configured with Express, MySQL2, Socket.IO, and JWT.
- [x] Database definitions directory `Asset_Security/database/` prepared.
- [x] Firmware repositories `Asset_Security/firmware/checkpoint_1/` & `esp32_cam/` structured.
- [x] Hardware schematics and docs in `Asset_Security/hardware/` & `Asset_Security/docs/`.
- [x] Environment configuration files (`.env.example`) created.

### 2. Next Phase (Phase 2): Database Verification Plan
1. Create `campus_asset_security` schema in MySQL 8.x.
2. Execute `schema.sql` and verify creation of all 16 tables.
3. Validate foreign key cascades and unique constraints.
4. Populate `seed.sql` with default roles, admin/staff/student test users, sample assets, RFID tags, and checkpoints.
5. Verify test queries in `queries.sql`.
