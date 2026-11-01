# API Specification - CampusAssetSecurity

## 1. Authentication Endpoints
- `POST /api/auth/login` - Authenticate with email & password, returns JWT token and user profile with role.
- `POST /api/auth/register` - Create a new user account (Admin only).
- `GET /api/auth/me` - Get current authenticated user profile.

## 2. Asset Management Endpoints
- `GET /api/assets` - List all assets (supports search, category, department, location, status, maintenance filter).
- `POST /api/assets` - Register a new asset (Admin/Lab Staff).
- `GET /api/assets/:id` - Get detailed asset records including movement and maintenance history.
- `PUT /api/assets/:id` - Update asset details.
- `DELETE /api/assets/:id` - Delete an asset (Admin only).

## 3. RFID Management Endpoints
- `GET /api/rfid` - List all RFID tags and their linked assets.
- `POST /api/rfid/assign` - Assign or reassign an RFID tag UID to an asset.
- `PUT /api/rfid/:id` - Update RFID tag status (active/disabled).
- `DELETE /api/rfid/:id` - Unlink RFID tag.
- `GET /api/rfid/lookup/:uid` - Public/Student lookup for asset availability by tag UID.

## 4. Asset Issue & Return Endpoints
- `POST /api/assets/:id/issue` - Issue asset to a student or faculty member.
- `POST /api/assets/:id/return` - Process return of issued asset.
- `GET /api/issues` - List active and historical issue records.

## 5. IoT & Hardware Endpoints (ESP32)
- `POST /api/iot/rfid-scan` - Ingest RFID scan from checkpoint reader.
  - Payload: `{ "deviceId": "ESP32-CP01", "checkpointId": "CP01", "uid": "B72A5C19", "timestamp": "..." }`
  - Response: `{ "success": true, "authorized": true|false, "action": "GREEN"|"ALARM", "message": "..." }`
- `POST /api/iot/heartbeat` - Device periodic status ping.
- `GET /api/iot/device/:deviceId/commands` - Polled by ESP32 for pending actuator commands (e.g. `RESET_ALARM`).
- `POST /api/iot/device/:deviceId/commands/:commandId/execute` - Mark command executed.

## 6. Security Alerts & Live Movements
- `GET /api/alerts` - List active, acknowledged, or resolved alerts.
- `PUT /api/alerts/:id/acknowledge` - Acknowledge alert.
- `PUT /api/alerts/:id/resolve` - Mark alert resolved with resolution notes.
- `GET /api/movements` - Full audit trail of RFID checkpoint movements.

## 7. Camera & Evidence Endpoints
- `POST /api/camera/event` - Multipart/form-data upload of security snapshot from ESP32-CAM.
- `GET /api/camera/events` - List security snapshot events.

## 8. Dashboard & Device Telemetry
- `GET /api/dashboard/summary` - Aggregated system statistics, alerts count, risk overview.
- `GET /api/dashboard/live-events` - Recent real-time event feed.
- `GET /api/devices` - IoT device status and health monitor.
