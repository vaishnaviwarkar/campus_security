#ifndef CONFIG_CHECKPOINT2_H
#define CONFIG_CHECKPOINT2_H

// ==============================================================================
// CampusAssetSecurity - Checkpoint 2 (30-Pin ESP32) Configuration
// ==============================================================================

// --- Wi-Fi Credentials ---
const char* WIFI_SSID     = "vivoE";
const char* WIFI_PASSWORD = "12345678";

// --- Backend Node.js Server API Endpoint ---
// Replace with your laptop's Wi-Fi IP address e.g. "http://192.168.240.216:3000"
const char* SERVER_BASE_URL = "http://192.168.240.216:3000";

// --- Device & Checkpoint Identification ---
const char* DEVICE_CODE   = "ESP32-CP02-LAB";
const int   CHECKPOINT_ID = 2;
const char* FIRMWARE_VER  = "2.4.1";

// --- 30-Pin ESP32 Hardware Pin Definitions ---
// MFRC522 SPI Pins (Must run strictly at 3.3V)
#define PIN_RFID_SS    5   // D5 (SDA / Chip Select)
#define PIN_RFID_SCK   18  // D18 (SPI Clock)
#define PIN_RFID_MOSI  23  // D23 (Master Out Slave In)
#define PIN_RFID_MISO  19  // D19 (Master In Slave Out)
#define PIN_RFID_RST   22  // D22 (MFRC522 Reset)


// Visual & Audio Actuators (safe to leave unconnected if using reader only)
#define PIN_GREEN_LED     25  // D25 (Authorized indicator)
#define PIN_RED_LED       26  // D26 (Unauthorized / Security breach)
#define PIN_BUZZER        27  // D27 (Audio Alarm)

// --- Timing Intervals ---
#define HEARTBEAT_INTERVAL_MS 15000  // Send heartbeat every 15 seconds

#endif // CONFIG_CHECKPOINT2_H
