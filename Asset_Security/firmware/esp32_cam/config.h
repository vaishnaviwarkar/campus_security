#ifndef CAM_CONFIG_H
#define CAM_CONFIG_H

// ==============================================================================
// CampusAssetSecurity - ESP32-CAM Security Node Configuration
// Model: AI-Thinker ESP32-CAM (OV2640 Sensor)
// ==============================================================================

// --- Wi-Fi Settings ---
const char* WIFI_SSID     = "vivoE";
const char* WIFI_PASSWORD = "12345679";

// --- Backend Node.js Server Ingestion Endpoint ---
// Set to your laptop IP running the backend server (e.g. 192.168.43.100 or 192.168.1.100)
const char* SERVER_UPLOAD_URL = "http://192.168.43.100:3000/api/camera/event";
const char* SERVER_HOST       = "192.168.43.100";
const int   SERVER_PORT       = 3000;

// --- Device Identifiers ---
const char* DEVICE_CODE   = "ESP32-CAM-HW381-OV3660";
const int   CHECKPOINT_ID = 1;

// --- AI-Thinker ESP32-CAM Pin Map ---
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Onboard Flash LED
#define FLASH_LED_PIN      4

#endif // CAM_CONFIG_H
