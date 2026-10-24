/*
 * LUNA ESP32 Wi-Fi integration starter
 * Target: ESP32-WROOM-32 DevKit (Arduino IDE)
 *
 * Provides the read-only GET /api/device/info endpoint expected by
 * frontend/src/pages/DevicePage.tsx.
 *
 * Before uploading:
 * 1. Replace WIFI_SSID and WIFI_PASSWORD below.
 * 2. Select your ESP32 board and COM port in Arduino IDE.
 * 3. Upload, then open Serial Monitor at 115200 baud.
 *
 * This is a connectivity demo only; it does not control hardware or expose
 * book/audio data. Keep it on a trusted local network.
 */

#include <WiFi.h>
#include <WebServer.h>

const char* WIFI_SSID = "REPLACE_WITH_WIFI_NAME";
const char* WIFI_PASSWORD = "REPLACE_WITH_WIFI_PASSWORD";

const char* DEVICE_ID = "LUNA-ESP32-001";
const char* DEVICE_NAME = "LUNA Reader";
const char* BOARD_NAME = "ESP32-WROOM-32 DevKit";
const char* FIRMWARE_VERSION = "0.1.0";

WebServer server(80);

void addCorsHeaders() {
  // The endpoint is read-only and intended for local development.
  // Do not reuse this wildcard policy for private/control endpoints.
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Accept, Content-Type");
  server.sendHeader("Cache-Control", "no-store");
}

void sendDeviceInfo() {
  addCorsHeaders();

  String body = "{";
  body += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  body += "\"name\":\"" + String(DEVICE_NAME) + "\",";
  body += "\"board\":\"" + String(BOARD_NAME) + "\",";
  body += "\"firmware_version\":\"" + String(FIRMWARE_VERSION) + "\",";
  body += "\"capabilities\":[\"device_info\"]";
  body += "}";

  server.send(200, "application/json", body);
}

void sendOptions() {
  addCorsHeaders();
  server.send(204);
}

void setup() {
  Serial.begin(115200);
  delay(300);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to Wi-Fi");
  const unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 20000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi connection failed. Check the SSID/password and restart.");
    return;
  }

  Serial.print("Wi-Fi connected. ESP32 IP address: ");
  Serial.println(WiFi.localIP());

  server.on("/api/device/info", HTTP_GET, sendDeviceInfo);
  server.on("/api/device/info", HTTP_OPTIONS, sendOptions);
  server.on("/", HTTP_GET, []() {
    addCorsHeaders();
    server.send(200, "text/plain", "LUNA ESP32 is online. Try GET /api/device/info");
  });
  server.onNotFound([]() {
    addCorsHeaders();
    server.send(404, "application/json", "{\"error\":\"not_found\"}");
  });

  server.begin();
  Serial.println("HTTP server started on port 80.");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    server.handleClient();
  } else {
    delay(100);
  }
}
