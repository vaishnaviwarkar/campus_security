#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>
#include "config.h"

// --- ArduinoJson v6 & v7 Universal Compatibility ---
#if defined(ARDUINOJSON_VERSION_MAJOR) && (ARDUINOJSON_VERSION_MAJOR >= 7)
  #define JSON_DOC(name, size) JsonDocument name
  #define JSON_HAS_KEY(doc, key) (!doc[key].isNull())
#else
  #define JSON_DOC(name, size) StaticJsonDocument<size> name
  #define JSON_HAS_KEY(doc, key) (doc.containsKey(key))
#endif

// --- Hardware Instances ---
MFRC522 mfrc522(PIN_RFID_SS, PIN_RFID_RST);

// --- State Variables ---
unsigned long lastHeartbeat = 0;
unsigned long lastScanTime = 0;
String lastScannedUID = "";
bool isAlarmActive = false;

// --- Forward Declarations ---
void connectWiFi();
void sendHeartbeat();
void processRFIDScan(String uid);
void triggerAuthorizedFeedback();
void triggerSecurityAlertFeedback();

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==========================================");
  Serial.println(" CampusAssetSecurity - Checkpoint 1 Node");
  Serial.print(" Firmware v");
  Serial.println(FIRMWARE_VER);
  Serial.println("==========================================");

  // Initialize GPIO Actuators
  pinMode(PIN_GREEN_LED, OUTPUT);
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_GREEN_LED, LOW);
  digitalWrite(PIN_RED_LED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // Initialize SPI & MFRC522 RFID Reader
  SPI.begin(PIN_RFID_SCK, PIN_RFID_MISO, PIN_RFID_MOSI, PIN_RFID_SS);
  mfrc522.PCD_Init();
  delay(50);
  mfrc522.PCD_DumpVersionToSerial();
  Serial.println("[RFID] MFRC522 Reader Initialized successfully.");

  // Quick startup beep
  digitalWrite(PIN_GREEN_LED, HIGH);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(100);
  digitalWrite(PIN_GREEN_LED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // Connect to Campus / Local Wi-Fi
  connectWiFi();
}

void loop() {
  // 1. Maintain Wi-Fi connectivity
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // 2. Periodic Heartbeat
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
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

  // Debounce rapid re-scans of the same tag within 2.5 seconds
  if (uidStr == lastScannedUID && (millis() - lastScanTime < 2500)) {
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    return;
  }

  lastScannedUID = uidStr;
  lastScanTime = millis();

  Serial.println("\n[RFID] >>> Card Detected! UID: " + uidStr);
  processRFIDScan(uidStr);

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

void connectWiFi() {
  Serial.print("[WIFI] Connecting to " + String(WIFI_SSID));
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected! IP: " + WiFi.localIP().toString());
    Serial.println("[WIFI] Signal Strength (RSSI): " + String(WiFi.RSSI()) + " dBm");
  } else {
    Serial.println("\n[WIFI] Failed to connect. Will retry...");
  }
}

void processRFIDScan(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] Cannot send scan: Wi-Fi offline");
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
  Serial.println("[HTTP] POST " + url + " -> Response Code: " + String(httpCode));

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("[HTTP] Server Response: " + response);

    JSON_DOC(resDoc, 512);
    DeserializationError error = deserializeJson(resDoc, response);

    if (!error && JSON_HAS_KEY(resDoc, "authorized")) {
      bool isAuthorized = resDoc["authorized"].as<bool>();
      const char* resStr = resDoc["result"];
      String result = resStr ? String(resStr) : "UNKNOWN";

      Serial.println("[DECISION] Result: " + result + " (Authorized: " + String(isAuthorized ? "YES" : "NO") + ")");

      if (isAuthorized) {
        triggerAuthorizedFeedback();
      } else {
        triggerSecurityAlertFeedback();
      }
    }
  } else {
    Serial.println("[HTTP] Connection failed: " + http.errorToString(httpCode));
    // Default fail-secure visual signal (fast blink)
    digitalWrite(PIN_RED_LED, HIGH);
    delay(300);
    digitalWrite(PIN_RED_LED, LOW);
  }

  http.end();
}

void triggerAuthorizedFeedback() {
  Serial.println("[ACTUATOR] ✅ ACCESS GRANTED: Green LED ON, Short Chime");
  digitalWrite(PIN_RED_LED, LOW);
  digitalWrite(PIN_GREEN_LED, HIGH);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(120);
  digitalWrite(PIN_BUZZER, LOW);
  delay(1800);
  digitalWrite(PIN_GREEN_LED, LOW);
}

void triggerSecurityAlertFeedback() {
  Serial.println("[ACTUATOR] 🚨 SECURITY BREACH / UNAUTHORIZED: Red LED & Siren");
  digitalWrite(PIN_GREEN_LED, LOW);

  // Triple alarm strobe + buzzer pulses
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
