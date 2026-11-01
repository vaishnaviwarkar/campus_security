# CampusAssetSecurity - Embedded Firmware & Hardware Guide

This directory contains the firmware for the IoT Checkpoint nodes and vision security modules.

---

## Architecture Overview

| Node | Hardware | Device Code | Checkpoint ID | Location in App | Primary Power Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Checkpoint 1** | ESP32 (38-Pin DevKit) | `ESP32-CP01-GATE` | `1` | Perimeter Gate 1 / Main Entrance | Laptop USB or 5V Adapter |
| **Checkpoint 2** | ESP32 (30-Pin DevKit) | `ESP32-CP02-LAB` | `2` | Turing Hall / CS Lab Portal | **Power Bank** (cordless) or 5V Adapter |
| **Vision Node** | ESP32-CAM (AI-Thinker) | `CAM-CP01-GATE` | `1` | Checkpoint 1 Optical Evidence | 5V 2A DC Supply |

---

## 1. Checkpoint 1 (38-Pin ESP32 Node)

Located at `firmware/esp32_checkpoint/`.
- Uses `esp32_checkpoint.ino` and `config.h`.

### 38-Pin ESP32 Pinout Table:
| RC522 RFID Reader Pin | 38-Pin ESP32 Pin | Logic Level | Purpose |
| :--- | :--- | :--- | :--- |
| **3.3V (VCC)** | **3V3** | 3.3V DC | Power supply (**Do NOT connect to 5V!**) |
| **GND** | **GND** | 0V | Ground reference |
| **RST** | **GPIO 22** | 3.3V | Hardware Reset |
| **SDA (SS)** | **GPIO 5** | 3.3V | SPI Chip Select |
| **SCK** | **GPIO 18** | 3.3V | SPI Clock |
| **MOSI** | **GPIO 23** | 3.3V | Master Out Slave In |
| **MISO** | **GPIO 19** | 3.3V | Master In Slave Out |
| **IRQ** | *Unconnected* | - | Not required |

Optional Actuators (Check `config.h`):
- **Green LED**: GPIO 25 (Authorized scan)
- **Red LED**: GPIO 26 (Unauthorized / Security Alert)
- **Buzzer**: GPIO 27 (Chime / Alarm siren)

---

## 2. Checkpoint 2 (30-Pin ESP32 Node)

Located at `firmware/esp32_checkpoint2/esp32_checkpoint2.ino`.
- **Completely self-contained single-file sketch**. No external header files required.

### 30-Pin ESP32 Pinout Table:
On 30-pin boards, pins are typically printed as `D` + pin number:
| RC522 RFID Reader Pin | 30-Pin ESP32 Pin Label | Position on 30-Pin Board |
| :--- | :--- | :--- |
| **3.3V (VCC)** | **3V3** | Bottom-Right pin |
| **GND** | **GND** | Right side ground pin |
| **RST** | **D22** (GPIO 22) | Right side |
| **SDA (SS)** | **D5** (GPIO 5) | Right side |
| **SCK** | **D18** (GPIO 18) | Right side |
| **MISO** | **D19** (GPIO 19) | Right side |
| **MOSI** | **D23** (GPIO 23) | Top-Right pin |
| **IRQ** | *Unconnected* | - |

Optional Actuators:
- **Green LED**: D25 (GPIO 25)
- **Red LED**: D26 (GPIO 26)
- **Buzzer**: D27 (GPIO 27)

---

## 3. Powering Remote Checkpoints with a Power Bank

When placing Checkpoint 2 at a distance from your laptop:
1. **Connection**:
   - Use a standard USB-A to Micro-USB cable.
   - Plug the USB-A connector into any 5V output port of your Power Bank.
   - Plug the Micro-USB connector directly into the ESP32's onboard Micro-USB port.
2. **Preventing Power Bank Auto-Shutoff**:
   - Some power banks turn off after 30 seconds if the connected device draws very little power.
   - **Solution**: Double-click or press-and-hold the power bank button to turn on **"Low-Current / Trickle Charge Mode"** (supported on Xiaomi, Realme, Anker, Baseus, etc.).
   - Alternatively, plug a 5V phone charger block into any nearby wall socket.
3. **Wi-Fi Range**:
   - Ensure the remote ESP32, the laptop, and the first checkpoint are all connected to the same Wi-Fi or mobile hotspot (`WIFI_SSID = "vivoE"`).

---

## 4. How to Flash in Arduino IDE

1. **Prerequisites**:
   - Install the ESP32 Board package: `Tools` -> `Board` -> `Boards Manager` -> search for `esp32` by Espressif.
   - Install required libraries: `Tools` -> `Manage Libraries`:
     - `MFRC522` by GithubCommunity
     - `ArduinoJson` (v6.x or v7.x) by Benoit Blanchon
2. **Flashing Checkpoint 1 (RFID Node)**:
   - Open `firmware/esp32_checkpoint/esp32_checkpoint.ino`.
   - Update Wi-Fi SSID, Password, and laptop IP in `config.h`.
   - Select Board: `DOIT ESP32 DEVKIT V1` or `ESP32 Dev Module`.
   - Connect 38-pin ESP32 via USB and click **Upload**.

3. **Flashing Checkpoint 2 (Remote Node)**:
   - Open `firmware/esp32_checkpoint2/esp32_checkpoint2.ino`.
   - Update Wi-Fi SSID, Password, and laptop IP at the top of the file.
   - Select Board: `DOIT ESP32 DEVKIT V1` or `ESP32 Dev Module`.
   - Connect 30-pin ESP32 via USB and click **Upload**.

4. **Flashing ESP32-CAM (Optical Evidence Node)**:
   - Open `firmware/esp32_cam/esp32_cam.ino`.
   - Set Board: `AI Thinker ESP32-CAM` (under ESP32 Arduino).
   - Set Partition Scheme: `Huge APP (3MB No OTA/1MB SPIFFS)` (Critical: camera firmware requires >1.3MB flash).
   - Set PSRAM: `Enabled`.
   - Connect ESP32-CAM via USB (or FTDI adapter with `GPIO 0` bridged to `GND` for flashing).
   - Click **Verify / Upload**.

---

## 5. Troubleshooting: "\firmware\esp32_cam\bootloader.bin was unexpected at this time"

If you see this compilation error on Windows:
```
\firmware\esp32_cam\bootloader.bin was unexpected at this time.
exit status 1
Compilation error: exit status 1
```

### Why this happens:
This is a Windows Command Prompt (`cmd.exe`) syntax error caused by **spaces, parentheses, or special characters (`&`)** in your extracted folder path (for example: `C:\Users\Name\Downloads\Campus Asset Security (1)\firmware\esp32_cam`). 
The ESP32 Arduino core build recipe invokes a Windows batch command to copy `bootloader.bin`. In older ESP32 core versions, the file path variable is unquoted, causing Windows `cmd.exe` to break at the first space or ampersand and report `\firmware\esp32_cam\bootloader.bin was unexpected at this time.`

### How to fix it (2 easy solutions):

- **Solution A (Instant Fix — 30 seconds)**:
  1. Copy the `esp32_cam` folder directly to your `C:\` drive or a path **with no spaces or symbols**, e.g.:
     `C:\esp32_cam`
  2. Open `C:\esp32_cam\esp32_cam.ino` in Arduino IDE.
  3. Click **Verify (Compile)** — it will compile with 0 errors!

- **Solution B (Update ESP32 Board Package in Arduino IDE)**:
  1. In Arduino IDE, go to `Tools` -> `Board` -> `Boards Manager...`
  2. Search for `esp32` by **Espressif Systems**.
  3. Update to **v2.0.14** or **v3.0+** (where Espressif fixed unquoted path variables on Windows).

---

## 6. Dual Checkpoint Transit Verification

Once both nodes are powered:
1. Start the server on your laptop: `npm run dev` and open `http://localhost:3000`.
2. Swipe an asset RFID tag at **Checkpoint 1 (Main Entrance Gate)**.
   - The Web App logs: `AST-2024-001 scanned at Checkpoint 1 (Main Entrance Gate)`.
3. Walk over to **Checkpoint 2 (CS Lab Portal)** and swipe the same tag.
   - The Web App logs: `AST-2024-001 transit recorded: Moved from Gate 1 to CS Lab Portal`.
4. Both nodes will also report live Wi-Fi RSSI heartbeats to the **IoT Device Health** tab in the dashboard!
