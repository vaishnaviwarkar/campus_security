# Hardware Wiring Guide - CampusAssetSecurity

## 1. Checkpoint 1 (ESP32 + MFRC522 + Actuators)

```
                       ESP32 Dev Module
                     ┌──────────────────┐
                     │                  │
        3.3V  ───────┤ 3V3          GND ├─────── GND
        GPIO 22 ─────┤ GPIO22    GPIO23 ├─────── MFRC522 MOSI
        GPIO 19 ─────┤ GPIO19    GPIO18 ├─────── MFRC522 SCK
        GPIO 5  ─────┤ GPIO5     GPIO25 ├─────── Green LED (Anode via 220Ω) ──► GND
                     │           GPIO26 ├─────── Red LED (Anode via 220Ω) ────► GND
                     │           GPIO27 ├─────── Active Buzzer (+) ───────────► GND
                     └──────────────────┘
```

### MFRC522 Connections
> ⚠️ **CRITICAL**: MFRC522 MUST BE CONNECTED TO **3.3V**. Connecting to 5V will permanently destroy the RFID IC.

- **VCC** ──► ESP32 `3V3`
- **RST** ──► ESP32 `GPIO 22`
- **GND** ──► ESP32 `GND`
- **MISO** ──► ESP32 `GPIO 19`
- **MOSI** ──► ESP32 `GPIO 23`
- **SCK** ──► ESP32 `GPIO 18`
- **SDA (SS)** ──► ESP32 `GPIO 5`

---

## 2. Actuators Wiring
- **Green LED**: Anode (+) ──► 220Ω Resistor ──► ESP32 `GPIO 25`, Cathode (-) ──► `GND`
- **Red LED**: Anode (+) ──► 220Ω Resistor ──► ESP32 `GPIO 26`, Cathode (-) ──► `GND`
- **Active Buzzer**: Positive (+) ──► ESP32 `GPIO 27`, Negative (-) ──► `GND`

---

## 4. ESP32-CAM (Checkpoint 1 Security Camera)
- **5V Pin** ──► External 5V 2A Power Source / ESP32 5V
- **GND** ──► Common GND
- Configured in firmware with AI-Thinker OV2640 pin definitions.
