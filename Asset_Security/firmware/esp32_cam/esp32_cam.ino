/*
 * ==============================================================================
 * CampusAssetSecurity - Checkpoint 1 Optical Evidence Node
 * Hardware: AI-Thinker ESP32-CAM (OV3660 / OV2640 Sensor) with HW-381 MB Base
 * Target: Checkpoint 1 (Main Entrance Gate)
 * ==============================================================================
 * Features:
 *  - Native support for OV3660 (PID detection, vertical flip, color balance)
 *  - Zero SD card required: all frames captured directly to PSRAM frame buffer
 *  - Local HTTP server on port 80: serves /capture endpoint for live view
 *  - Automatic or remote evidence upload directly to Node.js backend
 * ==============================================================================
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>

// ------------------------------------------------------------------------------
// 1. Wi-Fi Configuration (Your hotspot credentials)
// ------------------------------------------------------------------------------
const char* ssid     = "vivoE";
const char* password = "12345679";

// ------------------------------------------------------------------------------
// 2. Central Backend Server Configuration
// (Replace with your computer's IP where Node.js / npm run dev is running)
// ------------------------------------------------------------------------------
const char* serverUploadUrl = "http://192.168.43.100:3000/api/camera/event";
const char* deviceCode      = "ESP32-CAM-HW381-OV3660";
const int   checkpointId    = 1;

// ------------------------------------------------------------------------------
// 3. AI-Thinker ESP32-CAM Hardware Pin Definitions
// ------------------------------------------------------------------------------
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

#define FLASH_LED_PIN      4 // Onboard bright white flash LED

WebServer server(80);

// ------------------------------------------------------------------------------
// Camera Initialization with OV3660 Auto-Tuning
// ------------------------------------------------------------------------------
bool startCamera() {
  camera_config_t config = {};

  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;

  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;

  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;

  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

#ifndef OV3660_PID
#define OV3660_PID 0x3660
#endif
#ifndef OV2640_PID
#define OV2640_PID 0x2642
#endif

  if (psramFound()) {
    config.frame_size   = FRAMESIZE_VGA; // 640x480
    config.jpeg_quality = 12;
    config.fb_count     = 2;
#ifdef CAMERA_FB_IN_PSRAM
    config.fb_location  = CAMERA_FB_IN_PSRAM;
#endif
#ifdef CAMERA_GRAB_LATEST
    config.grab_mode    = CAMERA_GRAB_LATEST;
#endif
  } else {
    config.frame_size   = FRAMESIZE_QVGA; // 320x240
    config.jpeg_quality = 15;
    config.fb_count     = 1;
#ifdef CAMERA_FB_IN_DRAM
    config.fb_location  = CAMERA_FB_IN_DRAM;
#endif
#ifdef CAMERA_GRAB_WHEN_EMPTY
    config.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;
#endif
  }

  esp_err_t result = esp_camera_init(&config);
  if (result != ESP_OK) {
    Serial.printf("[CAMERA] Initialization failed: 0x%x\n", result);
    return false;
  }

  sensor_t* sensor = esp_camera_sensor_get();
  if (sensor != nullptr) {
    Serial.printf("[CAMERA] Sensor PID detected: 0x%04X\n", sensor->id.PID);

    // OV3660 sensor tuning
    if (sensor->id.PID == OV3660_PID) {
      sensor->set_vflip(sensor, 1);
      sensor->set_brightness(sensor, 1);
      sensor->set_saturation(sensor, -2);
      Serial.println("[CAMERA] OV3660 optimal sensor parameters applied.");
    }
  }

  Serial.println("[CAMERA] Initialized successfully in PSRAM buffer.");
  return true;
}

// ------------------------------------------------------------------------------
// HTTP Route: / (Camera Status & Dashboard link)
// ------------------------------------------------------------------------------
void handleHome() {
  String page = "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1'>";
  page += "<title>CampusAssetSecurity - Camera 01</title>";
  page += "<style>body{font-family:sans-serif;text-align:center;background:#0f172a;color:#f8fafc;padding:20px;}";
  page += "img{max-width:640px;width:100%;border-radius:12px;border:2px solid #8b5cf6;}";
  page += "button{background:#8b5cf6;color:white;border:none;padding:12px 20px;margin:8px;border-radius:8px;font-weight:bold;cursor:pointer;}";
  page += "</style></head><body>";
  page += "<h2>CampusAssetSecurity - Optical Node 01</h2>";
  page += "<p>Hardware: HW-381 / OV3660 • Location: Checkpoint 1 (Main Gate)</p>";
  page += "<img id='view' src='/capture' alt='Camera Feed'><br>";
  page += "<button onclick='location.reload()'>Refresh Frame</button>";
  page += "<button onclick=\"fetch('/upload-evidence').then(r=>r.text()).then(alert)\">Upload Evidence Now</button>";
  page += "<script>setInterval(()=>{document.getElementById('view').src='/capture?t='+Date.now();}, 1500);</script>";
  page += "</body></html>";
  server.send(200, "text/html", page);
}

// ------------------------------------------------------------------------------
// HTTP Route: /capture (Streams JPEG snapshot directly from RAM)
// ------------------------------------------------------------------------------
void handleCapture() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (fb == nullptr) {
    Serial.println("[ERROR] Failed to capture frame buffer");
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }

  WiFiClient client = server.client();
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: image/jpeg");
  client.printf("Content-Length: %u\r\n", (unsigned int)fb->len);
  client.println("Cache-Control: no-store, no-cache, must-revalidate");
  client.println("Connection: close");
  client.println();

  client.write(fb->buf, fb->len);
  esp_camera_fb_return(fb);
}

// ------------------------------------------------------------------------------
// Function: Upload snapshot directly to Node.js Backend Server
// ------------------------------------------------------------------------------
bool uploadEvidenceToServer(String triggerType = "MANUAL_TRIGGER", String rfidUid = "") {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[UPLOAD] Wi-Fi not connected");
    return false;
  }

  // Flash LED briefly during evidence capture
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, HIGH);
  delay(100);

  camera_fb_t* fb = esp_camera_fb_get();
  digitalWrite(FLASH_LED_PIN, LOW);

  if (!fb) {
    Serial.println("[UPLOAD] Frame buffer capture failed");
    return false;
  }

  Serial.printf("[UPLOAD] Frame captured: %u bytes. Posting to backend...\n", fb->len);

  HTTPClient http;
  http.begin(serverUploadUrl);
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Device-Code", deviceCode);
  http.addHeader("X-Checkpoint-Id", String(checkpointId));
  http.addHeader("X-Trigger-Type", triggerType);
  if (rfidUid.length() > 0) {
    http.addHeader("X-RFID-UID", rfidUid);
  }

  int httpCode = http.POST(fb->buf, fb->len);
  Serial.printf("[UPLOAD] Backend server HTTP response: %d\n", httpCode);

  esp_camera_fb_return(fb);
  http.end();
  return (httpCode == 200 || httpCode == 201);
}

// ------------------------------------------------------------------------------
// HTTP Route: /upload-evidence (Can be triggered remotely via browser or curl)
// ------------------------------------------------------------------------------
void handleUploadTrigger() {
  bool success = uploadEvidenceToServer("REMOTE_TRIGGER");
  if (success) {
    server.send(200, "text/plain", "Snapshot captured and uploaded to server successfully!");
  } else {
    server.send(500, "text/plain", "Failed to upload snapshot to server.");
  }
}

// ------------------------------------------------------------------------------
// Setup
// ------------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1500);

  Serial.println("\n=======================================================");
  Serial.println("  CampusAssetSecurity - ESP32-CAM OV3660 Security Node");
  Serial.println("=======================================================");

  if (!startCamera()) {
    Serial.println("[FATAL] Camera sensor initialization failed. Check ribbon cable.");
    while (true) delay(1000);
  }

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(ssid, password);

  Serial.print("[WIFI] Connecting to " + String(ssid));
  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 30000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Connection failed. Check hotspot name & password.");
    return;
  }

  Serial.println("[WIFI] Connected successfully!");
  Serial.print("[INFO] Camera Web Server URL: http://");
  Serial.println(WiFi.localIP());
  Serial.println("[INFO] Ingestion Endpoint: http://" + WiFi.localIP().toString() + "/capture");

  // Register Web Endpoints
  server.on("/", HTTP_GET, handleHome);
  server.on("/capture", HTTP_GET, handleCapture);
  server.on("/upload-evidence", HTTP_GET, handleUploadTrigger);

  server.onNotFound([]() {
    server.send(404, "text/plain", "Endpoint not found");
  });

  server.begin();
  Serial.println("[READY] Optical Surveillance Node is online and armed.");

  // Auto-register live camera IP with the central backend server
  HTTPClient regHttp;
  String regUrl = String(serverUploadUrl);
  // Replace /api/camera/event with /api/camera/register-ip
  regUrl.replace("/event", "/register-ip");
  regHttp.begin(regUrl);
  regHttp.addHeader("Content-Type", "application/json");
  String regPayload = "{\"ip\":\"" + WiFi.localIP().toString() + "\"}";
  int regCode = regHttp.POST(regPayload);
  Serial.printf("[AUTO-REGISTER] Registered Camera IP %s to %s (HTTP %d)\n", 
                WiFi.localIP().toString().c_str(), regUrl.c_str(), regCode);
  regHttp.end();
}

// ------------------------------------------------------------------------------
// Main Loop
// ------------------------------------------------------------------------------
void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    server.handleClient();
  }
  delay(2);
}
