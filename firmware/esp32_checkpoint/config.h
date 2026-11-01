#ifndef CONFIG_H
#define CONFIG_H

// ==============================================================================
// CampusAssetSecurity - ESP32 Checkpoint Configuration
// ==============================================================================

// --- Wi-Fi Credentials (Configure for your campus/lab network) ---
const char* WIFI_SSID     = "CAMPUS_IOT_WIFI";
const char* WIFI_PASSWORD = "CampusSecurePass2026!";

// --- Backend Node.js Server API Endpoint ---
// If running on local network, use the server's LAN IP e.g. "http://192.168.1.100:3000"
const char* SERVER_BASE_URL = "http://192.168.1.100:3000";

// --- Device & Checkpoint Identification ---
const char* DEVICE_CODE   = "ESP32-CP01-GATE";
const int   CHECKPOINT_ID = 1;
const char* FIRMWARE_VER  = "2.4.1";

// --- Hardware Pin Definitions ---
// MFRC522 SPI Pins (Must run at 3.3V)
#define PIN_RFID_SS    5   // SDA / Chip Select
#define PIN_RFID_SCK   18  // SPI Clock
#define PIN_RFID_MOSI  23  // Master Out Slave In
#define PIN_RFID_MISO  19  // Master In Slave Out
#define PIN_RFID_RST   22  // MFRC522 Reset

// Visual & Audio Actuators
#define PIN_GREEN_LED     25  // Authorized Access Indicator
#define PIN_RED_LED       26  // Unauthorized Access Indicator
#define PIN_BUZZER        27  // Audio Alarm Siren

// --- Timing Intervals ---
#define HEARTBEAT_INTERVAL_MS 15000  // Send heartbeat every 15 seconds
#define COMMAND_POLL_MS       3000   // Poll for remote actuator reset every 3 seconds

#endif // CONFIG_H
