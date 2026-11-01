# Firmware Architecture & Setup - CampusAssetSecurity

## 1. Checkpoint 1 ESP32 Firmware
- **Location**: `firmware/checkpoint_1/`
- **Required Libraries**:
  - `WiFi` (Built-in ESP32 core)
  - `SPI` (Built-in ESP32 core)
  - `MFRC522` by GithubCommunity / miguelbalboa
  - `HTTPClient` (Built-in ESP32 core)
  - `ArduinoJson` by Benoit Blanchon (v6.x or v7.x)

### Key Features
1. Non-blocking state machine for RFID scanning and perimeter security verification.
2. HTTP REST client with automatic exponential retry and Wi-Fi auto-reconnect.
3. Actuator control for Green LED (Authorized), Red LED (Unauthorized/Security Alert), and Active Buzzer.
4. Periodic command polling to support remote alarm silencing directly from the web dashboard.
5. Heartbeat reporting every 10 seconds to maintain live device status on the monitoring dashboard.

---

## 2. ESP32-CAM Firmware
- **Location**: `firmware/esp32_cam/`
- **Hardware Profile**: AI-Thinker ESP32-CAM (OV2640 Sensor)
- **Required Libraries**:
  - `WiFi`
  - `esp_camera.h` (ESP32 Camera driver)
  - `HTTPClient`
  - `ArduinoJson`

### Key Features
1. Low-power idle state until triggered by event signal or backend dispatch.
2. Captures UXGA/SVGA JPEG snapshot upon security trip.
3. Transmits image as `multipart/form-data` payload to `POST /api/camera/event`.
