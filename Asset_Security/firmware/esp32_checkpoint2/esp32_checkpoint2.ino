#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// --- ArduinoJson v6 & v7 Universal Compatibility ---
#if defined(ARDUINOJSON_VERSION_MAJOR) && (ARDUINOJSON_VERSION_MAJOR >= 7)
  #define JSON_DOC(name, size) JsonDocument name
  #define JSON_HAS_KEY(doc, key) (!doc[key].isNull())
#else
  #define JSON_DOC(name, size) StaticJsonDocument<size> name
  #define JSON_HAS_KEY(doc, key) (doc.containsKey(key))
#endif

// ==============================================================================
// 1. CONFIGURATION FOR CHECKPOINT 2 (CS LAB PORTAL - 30-PIN ESP32)
// ==============================================================================
// Configure your Wi-Fi hotspot or campus router credentials
const char* WIFI_SSID       = "vivoE";
const char* WIFI_PASSWORD   = "12345678";

// Local Laptop / Node.js Server IP on port 3000
const char* SERVER_BASE_URL = "http://192.168.240.216:3000";

// Checkpoint 2 Node Identity
const char* DEVICE_CODE     = "ESP32-CP02-LAB";
const int   CHECKPOINT_ID   = 2;
const char* FIRMWARE_VER    = "2.4.1";


// ==============================================================================
// 30-PIN ESP32 PINOUT (MFRC522 SPI & ACTUATORS)
// ==============================================================================
// MFRC522 RFID SPI Pins
#define PIN_RFID_SS    5   // D5  (SDA)
#define PIN_RFID_SCK   18  // D18 (SCK)
#define PIN_RFID_MOSI  23  // D23 (MOSI)
#define PIN_RFID_MISO  19  // D19 (MISO)
#define PIN_RFID_RST   22  // D22 (RST)
// Connect RC522 3.3V -> 3V3 (Never 5V/VIN)
// Connect RC522 GND  -> GND

// Optional Actuator Pins (safe to leave unconnected if using reader only)
#define PIN_GREEN_LED  25  // D25 (Authorized indicator)
#define PIN_RED_LED    26  // D26 (Security alert indicator)
#define PIN_BUZZER     27  // D27 (Audio chime / alarm)

// ==============================================================================
// 2. HARDWARE INSTANCES & VARIABLES
// ==============================================================================
MFRC522 mfrc522(PIN_RFID_SS, PIN_RFID_RST);
unsigned long lastHeartbeat = 0;
unsigned long lastScanTime = 0;
String lastScannedUID = "";

// Forward declarations
void connectWiFi();
void sendHeartbeat();
void processRFIDScan(String uid);
void triggerAuthorizedFeedback();
void triggerSecurityAlertFeedback();

// ==============================================================================
// 3. SETUP FUNCTION
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==========================================");
  Serial.println(" CampusAssetSecurity - Checkpoint 2 Node");
  Serial.println(" Hardware: ESP32 DevKit 30-Pin");
  Serial.print(" Device Code: ");
  Serial.println(DEVICE_CODE);
  Serial.print(" Checkpoint ID: ");
  Serial.println(CHECKPOINT_ID);
  Serial.print(" Firmware Version: ");
  Serial.println(FIRMWARE_VER);
  Serial.println("==========================================");

  // Initialize GPIO Actuator pins
  pinMode(PIN_GREEN_LED, OUTPUT);
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_GREEN_LED, LOW);
  digitalWrite(PIN_RED_LED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // Initialize SPI & MFRC522 Reader on 30-pin board
  SPI.begin(PIN_RFID_SCK, PIN_RFID_MISO, PIN_RFID_MOSI, PIN_RFID_SS);
  mfrc522.PCD_Init();
  delay(50);
  
  Serial.println("[RFID] Initializing Checkpoint 2 RC522 Reader...");
  mfrc522.PCD_DumpVersionToSerial();
  Serial.println("[RFID] Checkpoint 2 Ready! Tap any RFID tag.");

  // Connect to Wi-Fi
  connectWiFi();
}

// ==============================================================================
// 4. MAIN LOOP FUNCTION
// ==============================================================================
void loop() {
  // 1. Maintain Wi-Fi connectivity
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // 2. Send Heartbeat to server every 15 seconds
  if (millis() - lastHeartbeat >= 15000) {
    lastHeartbeat = millis();
    sendHeartbeat();
  }

  // 3. Check for RFID Card / Tag Presence
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Convert UID bytes to Hex String
  String uidStr = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uidStr += "0";
    uidStr += String(mfrc522.uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();

  // Debounce rapid re-scans within 2.5 seconds
  if (uidStr == lastScannedUID && (millis() - lastScanTime < 2500)) {
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    return;
  }

  lastScannedUID = uidStr;
  lastScanTime = millis();

  Serial.println("\n[CP2-RFID] >>> Card Detected! UID: " + uidStr);
  processRFIDScan(uidStr);

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

// ==============================================================================
// 5. HELPER FUNCTIONS
// ==============================================================================
void connectWiFi() {
  Serial.print("[WIFI-CP2] Connecting to " + String(WIFI_SSID));
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI-CP2] Connected! IP: " + WiFi.localIP().toString());
    Serial.println("[WIFI-CP2] Signal Strength (RSSI): " + String(WiFi.RSSI()) + " dBm");
  } else {
    Serial.println("\n[WIFI-CP2] Failed to connect. Will retry in next loop...");
  }
}

void processRFIDScan(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] Checkpoint 2 Wi-Fi offline. Cannot send scan.");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/iot/rfid-scan";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  JSON_DOC(doc, 256);
  doc["rfid_uid"] = uid;
  doc["device_code"] = DEVICE_CODE;
  doc["checkpoint_id"] = CHECKPOINT_ID;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  Serial.println("[HTTP-CP2] POST " + url + " -> Code: " + String(httpCode));

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("[HTTP-CP2] Server Response: " + response);

    JSON_DOC(resDoc, 512);
    DeserializationError error = deserializeJson(resDoc, response);

    if (!error && JSON_HAS_KEY(resDoc, "authorized")) {
      bool isAuthorized = resDoc["authorized"].as<bool>();
      const char* resStr = resDoc["result"];
      String result = resStr ? String(resStr) : "UNKNOWN";

      Serial.println("[CP2-DECISION] Result: " + result + " (Authorized: " + String(isAuthorized ? "YES" : "NO") + ")");

      if (isAuthorized) {
        triggerAuthorizedFeedback();
      } else {
        triggerSecurityAlertFeedback();
      }
    }
  } else {
    Serial.println("[HTTP-CP2] Connection failed: " + http.errorToString(httpCode));
    digitalWrite(PIN_RED_LED, HIGH);
    delay(300);
    digitalWrite(PIN_RED_LED, LOW);
  }

  http.end();
}

void triggerAuthorizedFeedback() {
  Serial.println("[ACTUATOR-CP2] ACCESS GRANTED: Green LED Chime");
  digitalWrite(PIN_RED_LED, LOW);
  digitalWrite(PIN_GREEN_LED, HIGH);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(120);
  digitalWrite(PIN_BUZZER, LOW);
  delay(1800);
  digitalWrite(PIN_GREEN_LED, LOW);
}

void triggerSecurityAlertFeedback() {
  Serial.println("[ACTUATOR-CP2] SECURITY ALERT: Red LED Siren");
  digitalWrite(PIN_GREEN_LED, LOW);

  for (int i = 0; i < 4; i++) {
    digitalWrite(PIN_RED_LED, HIGH);
    digitalWrite(PIN_BUZZER, HIGH);
    delay(200);
    digitalWrite(PIN_RED_LED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
    delay(150);
  }
}

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/iot/heartbeat";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  JSON_DOC(doc, 256);
  doc["device_code"] = DEVICE_CODE;
  doc["ip_address"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();

  String requestBody;
  serializeJson(doc, requestBody);
  http.POST(requestBody);
  http.end();
}
