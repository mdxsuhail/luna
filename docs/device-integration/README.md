# ESP32 Device Integration Starter

This example firmware lets LUNA's **Device Integration** page verify a real ESP32 over Wi-Fi. It implements the read-only endpoint that the frontend currently requests:

`GET http://<ESP32-IP>:80/api/device/info`

## What it does

- Connects an ESP32-WROOM-32 DevKit to your Wi-Fi network.
- Starts an HTTP server on port 80.
- Returns JSON with `device_id`, `name`, `board`, `firmware_version`, and `capabilities`.
- Adds CORS headers so a local LUNA frontend in the browser can read the response.

This is a **connectivity starter only**. It does not control the ESP32, synchronize books, or communicate with the LUNA backend. USB serial support is not implemented in the current Device Integration page.

## 1. Flash the firmware

1. Install Arduino IDE and the ESP32 board package if you have not already.
2. Open `esp32-device-info.ino`.
3. Replace `REPLACE_WITH_WIFI_NAME` and `REPLACE_WITH_WIFI_PASSWORD` with your 2.4 GHz Wi-Fi credentials. Do not commit real credentials to GitHub.
4. Select your ESP32 board and its COM port.
5. Upload the sketch.
6. Open **Serial Monitor** at **115200 baud**.
7. Wait for a line similar to `Wi-Fi connected. ESP32 IP address: 192.168.1.50`. Your IP will probably be different.

The computer running LUNA and the ESP32 must be on the same network. Some guest Wi-Fi networks isolate devices; use a trusted private network.

## 2. Verify the endpoint before opening LUNA

On the computer running LUNA, open a browser and visit:

`http://YOUR_ESP32_IP/api/device/info`

Replace `YOUR_ESP32_IP` with the IP printed in Serial Monitor. A successful response resembles:

```json
{
  "device_id": "LUNA-ESP32-001",
  "name": "LUNA Reader",
  "board": "ESP32-WROOM-32 DevKit",
  "firmware_version": "0.1.0",
  "capabilities": ["device_info"]
}
```

If the page does not load, check the Wi-Fi connection and IP address before troubleshooting LUNA.

## 3. Test from LUNA

1. Start LUNA using the project's normal launcher.
2. Open the **Device Integration** page in the same browser.
3. Choose **Wi-Fi** transport.
4. Set host/IP to the ESP32 IP (for example, `192.168.1.50`), port to `80`, and protocol to `http`.
5. Leave the expected device ID blank for the first test, or enter `LUNA-ESP32-001`.
6. Select **Test Connection**. A successful test should display the device information.

If the direct browser endpoint works but LUNA reports an error, check the browser console for CORS or mixed-content errors. Use LUNA on a local **HTTP** development origin when testing this HTTP device; an HTTPS-hosted page may block HTTP requests as mixed content.

## Security notes

- The example exposes only a read-only device-information endpoint and is intended for a trusted local network.
- The wildcard CORS policy is for this read-only development endpoint. Do not copy it to endpoints that reveal private data or change device state.
- Do not expose this HTTP server to the public internet. Do not commit Wi-Fi credentials.
- A successful browser connection confirms reachability and the info endpoint only. It does not verify future USB support, book transfer, audio transfer, or hardware-control features.
