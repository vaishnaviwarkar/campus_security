#ifndef CONFIG_H
#define CONFIG_H

// Wi-Fi Configuration
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Backend Server Configuration
#define BACKEND_BASE_URL "http://192.168.1.100:5000"
#define DEVICE_ID "ESP32-CP01"
#define CHECKPOINT_ID "CP01"

// Hardware Pin Definitions
#define SS_PIN 5      // MFRC522 SDA / SS
#define RST_PIN 22    // MFRC522 RST
#define LED_GREEN 25  // Authorized Indicator
#define LED_RED 26    // Unauthorized Indicator
#define BUZZER_PIN 27 // Active Buzzer

// Timing parameters
#define HEARTBEAT_INTERVAL_MS 10000
#define RFID_DEBOUNCE_MS 3000
#define COMMAND_POLL_INTERVAL_MS 2000

#endif // CONFIG_H
