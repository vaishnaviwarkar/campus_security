# Hardware Pinout Reference - CampusAssetSecurity

## ESP32 Dev Module (Checkpoint 1 Node)

| Pin / Function | ESP32 GPIO | Connected Component | Signal Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| **SPI SS / SDA** | `GPIO 5` | MFRC522 (SDA) | SPI Chip Select | Slave select for RFID reader |
| **SPI SCK** | `GPIO 18` | MFRC522 (SCK) | SPI Clock | Serial clock for RFID |
| **SPI MISO** | `GPIO 19` | MFRC522 (MISO) | SPI Data In | Master In Slave Out |
| **SPI MOSI** | `GPIO 23` | MFRC522 (MOSI) | SPI Data Out | Master Out Slave In |
| **RFID RST** | `GPIO 22` | MFRC522 (RST) | Digital Output | Reset pin for MFRC522 |
| **GREEN_LED** | `GPIO 25` | Green LED | Digital Output | Authorized movement indicator |
| **RED_LED** | `GPIO 26` | Red LED | Digital Output | Unauthorized breach alarm |
| **BUZZER** | `GPIO 27` | Active Buzzer | Digital Output | Audible security siren |
| **3V3 Power** | `3V3` | MFRC522 VCC | Power (3.3V) | Reader power rail |
| **GND** | `GND` | Common Ground | Ground | Reference ground |

---

## ESP32-CAM (AI-Thinker OV2640 Node)

| Camera Function | ESP32-CAM Pin | Purpose |
| :--- | :--- | :--- |
| **PWDN** | `GPIO 32` | Power Down Mode Control |
| **RESET** | `-1` | Software reset |
| **XCLK** | `GPIO 0` | Master Clock |
| **SIOD** | `GPIO 26` | I2C Data (SCCB) |
| **SIOC** | `GPIO 27` | I2C Clock (SCCB) |
| **Y9 - Y2** | `35, 34, 39, 36, 21, 19, 18, 5` | 8-bit Parallel Video Data Bus |
| **VSYNC** | `GPIO 25` | Vertical Sync |
| **HREF** | `GPIO 23` | Horizontal Reference |
| **PCLK** | `GPIO 22` | Pixel Clock |
