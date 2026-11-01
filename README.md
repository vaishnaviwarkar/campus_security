# 🛡️ CampusAssetSecurity — Smart Campus Anti-Theft & Monitoring System

A complete IoT-integrated campus asset security platform featuring RFID checkpoint monitoring, ESP32-CAM automated optical evidence capture, real-time WebSocket dashboard, and perimeter security alerts.

---

## ⚡ Quick Start (Run Locally After Downloading ZIP)

### Prerequisites
- **Node.js**: v18, v20, or v22 installed ([nodejs.org](https://nodejs.org/))
- **Arduino IDE**: 1.8.x or 2.x (if uploading code to ESP32 / ESP32-CAM hardware)

### Option 1: One-Click Launch
- **Windows**: Double-click `start.bat`
- **macOS / Linux**: Open Terminal and run `./start.sh`

### Option 2: Command Line
Open terminal in the project root directory and run:

```bash
# 1. Install dependencies
npm install

# 2. Run in Development Mode (Live full-stack app on http://localhost:3000)
npm run dev
```

### Production Build & Run:
```bash
# Build production bundle (client assets + Node.js bundle)
npm run build

# Start production server
npm start
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 📁 Project Structure

```
├── server.ts                    # Central Express & Socket.IO backend server
├── server/                      # Server routes, database models, sockets, camera proxy
├── src/                         # React 19 Frontend (Dashboard, Checkpoints, Live Cameras)
├── firmware/                    # ESP32 & ESP32-CAM Arduino sketches
│   ├── esp32_cam/               # Checkpoint 1 ESP32-CAM Optical Evidence Node
│   │   ├── esp32_cam.ino        # Camera sketch (works on all ESP32 core versions)
│   │   └── config.h             # Wi-Fi SSID & Central Server URL
│   ├── esp32_checkpoint/        # Checkpoint 1 (Main Entrance Gate) RFID & Buzzer
│   │   ├── esp32_checkpoint.ino # Checkpoint 1 sketch (ArduinoJson v6 & v7 compatible)
│   │   └── config.h             # Checkpoint 1 pinouts & Wi-Fi settings
│   └── esp32_checkpoint2/       # Checkpoint 2 (CS Lab Portal) RFID & Buzzer
│       ├── esp32_checkpoint2.ino# Checkpoint 2 sketch (ArduinoJson v6 & v7 compatible)
│       └── config.h             # Checkpoint 2 pinouts & Wi-Fi settings
├── package.json                 # Node.js dependencies and cross-platform build scripts
├── start.bat                    # Windows 1-click startup script
└── start.sh                     # Linux/macOS 1-click startup script
```

---

## 🔌 Hardware Setup & Arduino IDE Compilation

### Required Arduino IDE Libraries:
Open **Arduino IDE** -> **Tools** -> **Manage Libraries...** and install:
1. **`ArduinoJson`** by Benoît Blanchon (Both **v6** and **v7** are fully supported!)
2. **`MFRC522`** by GithubCommunity (for RC522 RFID reader)

### ESP32 Board Package:
In **Tools** -> **Board** -> **Boards Manager**, ensure `esp32` by Espressif Systems is installed.

### 1. Upload Checkpoint 1 Firmware:
1. Open `firmware/esp32_checkpoint/esp32_checkpoint.ino` in Arduino IDE.
2. In `config.h`, set your Wi-Fi SSID, Password, and your computer's IP address (e.g. `http://192.168.1.100:3000`).
3. Select Board: **DOIT ESP32 DEVKIT V1** or **ESP32 Dev Module**.
4. Click **Verify / Compile** (Ctrl+R / Cmd+R) — it will compile with 0 errors.
5. Click **Upload** (Ctrl+U).

### 2. Upload Checkpoint 2 Firmware:
1. Open `firmware/esp32_checkpoint2/esp32_checkpoint2.ino` in Arduino IDE.
2. Verify Wi-Fi SSID and computer's IP address.
3. Select Board: **DOIT ESP32 DEVKIT V1** or **ESP32 Dev Module**.
4. Click **Verify / Compile** and **Upload**.

### 3. Upload ESP32-CAM Firmware:
1. Open `firmware/esp32_cam/esp32_cam.ino` in Arduino IDE.
2. Set Wi-Fi and server IP in `firmware/esp32_cam/config.h` or top of `esp32_cam.ino`.
3. Select Board: **AI Thinker ESP32-CAM**.
4. In Tools:
   - Partition Scheme: **Huge APP (3MB No OTA / 1MB SPIFFS)**
   - PSRAM: **Enabled**
5. Hold GPIO0 to GND while flashing, then press Reset and release GPIO0.

> 💡 **Windows Compilation Error Fix (`\bootloader.bin was unexpected at this time`)**:  
> If Arduino IDE shows `\firmware\esp32_cam\bootloader.bin was unexpected at this time. Compilation error: exit status 1`:  
> **Cause**: Your extracted folder path has **spaces** (e.g. `Downloads\Campus Asset Security (1)`).  
> **Fix**: Copy the `esp32_cam` folder directly to `C:\esp32_cam` (or any path without spaces) and open `C:\esp32_cam\esp32_cam.ino`. It will compile with 0 errors! Alternatively, update the `esp32` board definition in Arduino IDE Boards Manager to v2.0.14+.

---

## 🚨 Security Logic & Automated Camera Capture

1. **Security Alarm Behavior**:
   - The security alarm and buzzer remain **OFF (IDLE)** during normal conditions.
   - When an **authorized registered tag** is detected: The green LED illuminates with a brief chime (`ACCESS GRANTED`).
   - When an **unregistered or unauthorized tag** is detected: The system triggers an instant **CRITICAL SECURITY ALARM** (strobe red LED + siren).

2. **Automated Evidence Camera Capture**:
   - Whenever an **unregistered card or unauthorized tag** is scanned at Checkpoint 1, the system **automatically triggers a burst snapshot capture** from the ESP32-CAM.
   - The captured evidence photos are instantly transmitted to the central server, attached to the Security Alert record, and displayed on the web dashboard in real time!
