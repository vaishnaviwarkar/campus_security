# System Architecture - CampusAssetSecurity

## 1. Architectural Diagram

```
+-------------------------------------------------------------------------+
|                              USERS & CLIENTS                            |
|                                                                         |
|      [ADMIN]                 [LAB_STAFF]               [STUDENT]        |
|   (Full Control)         (Issue/Return/Alerts)    (Asset Availability)  |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                           REACT 19 FRONTEND                             |
|                                                                         |
|  - Real-Time Live Feed Dashboard        - Asset Inventory CRUD          |
|  - RFID Tag Pairing & History           - Check-Out / Return Portal     |
|  - Active Security Alert Center         - Maintenance Tracker           |
|  - Recovery & Evidence Inspector        - IoT Device Status & Heartbeat |
|  - Remote Alarm Reset Switch            - Role-Based Guarded Routing    |
+-------------------------------------------------------------------------+
              ^                                          |
              | Socket.IO Live Events                    | HTTP REST APIs
              v                                          v
+-------------------------------------------------------------------------+
|                       NODE.JS + EXPRESS BACKEND                         |
|                                                                         |
|  - Authentication & JWT Middleware      - RFID Authorization Engine     |
|  - Security Alert Pipeline              - Risk Scoring Algorithm        |
|  - Camera Snapshot Ingestion (/uploads) - Actuator Command Queue        |
|  - IoT Heartbeat & Status Manager       - Real-Time Event Broadcaster   |
+-------------------------------------------------------------------------+
                 |                                      ^
                 v                                      | Wi-Fi HTTP REST
+------------------------------------+  +---------------------------------+
|          MYSQL 8.X DATABASE        |  |          PHYSICAL IOT NODES     |
|                                    |  |                                 |
|  - 16 Relational Tables            |  |  ESP32 Checkpoint 1:            |
|  - Normalized Foreign Keys         |  |   - MFRC522 (13.56MHz SPI)      |
|  - Complete Audit Trail            |  |   - Green/Red LEDs & Buzzer     |
|  - Indexed Search Fields           |  |                                 |
|                                    |  |  ESP32-CAM Checkpoint 1:        |
+------------------------------------+  |   - OV2640 Image Capture        |
                                        +---------------------------------+
```

## 2. Event Lifecycle

### A. RFID Tag Scan Event
1. Physical RFID tag brought within ~3cm of MFRC522 reader.
2. ESP32 firmware reads UID (e.g. `B72A5C19`), formats JSON payload with device ID and checkpoint code.
3. ESP32 makes `POST /api/iot/rfid-scan`.
4. Backend queries MySQL:
   - Validates tag registration & active state.
   - Looks up asset details, issue status, current checkpoint, and maintenance status.
5. If movement is authorized:
   - Backend responds `action: "GREEN"`, emits Socket.IO event.
   - ESP32 turns ON Green LED for 2 seconds.
6. If movement is unauthorized or tag belongs to missing asset:
   - Backend responds `action: "ALARM"`.
   - Creates critical security alert and movement record in MySQL.
   - Broadcasts immediate alert via Socket.IO.
   - ESP32 activates Red LED and sound buzzer.
   - Triggers camera snapshot capture.

