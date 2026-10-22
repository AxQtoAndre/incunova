# incuNOVA v3.2 — Sistema de Telemetría y Control Inteligente para Incubadoras ESP32

Sistema integral de monitoreo, control físico y telemetría en tiempo real para incubadoras avícolas automáticas basado en **ESP32 (WROOM 38 pines) + Bluetooth Low Energy (Web Bluetooth API) + React 19 + TypeScript + Tailwind CSS**.

---

## 1. Arquitectura del Sistema

```
                    +-----------------------------+
                    | Navegador Web (Chrome/Edge) |
                    |      React 19 + Web BLE     |
                    +--------------+--------------+
                                   | GATT (MTU 247 / Stream)
                                   v
                    +--------------+--------------+
                    |       ESP32 WROOM-32        |
                    | (NimBLE-Arduino + FreeRTOS) |
                    +--------------+--------------+
                                   |
         +-----------------+-------+-------+------------------+
         |                 |               |                  |
         v                 v               v                  v
+-----------------+ +-------------+ +-------------+ +--------------------+
|  I2C (21 / 22)  | | OneWire (4) | |  GPIO (16)  | |  Salidas Actuadores|
| - AHT20 Temp/Hum| | - DS18B20   | | - DHT11     | | - PTC (PWM 18)     |
| - BMP280 Presión| |   Disipador | |   Respaldo  | | - Fan (PWM 19)     |
| - LCD 16x2 I2C  | |   PTC       | |   Huevos    | | - Humidif. (Relé 17|
+-----------------+ +-------------+ +-------------+ | - Motor (STEP 32,  |
                                                    |   DIR 33, EN 23)   |
                                                    +--------------------+
```

---

## 2. Asignación Oficial de Pines GPIO

| Periférico / Función | Pin ESP32 | Tipo / Conexión Eléctrica |
| :--- | :--- | :--- |
| **I2C SDA** | `GPIO 21` | Bus I2C de datos (AHT20 + BMP280 + LCD 16x2) |
| **I2C SCL** | `GPIO 22` | Bus I2C de reloj (AHT20 + BMP280 + LCD 16x2) |
| **OneWire DS18B20** | `GPIO 4` | Sonda en disipador PTC (requiere pull-up 4.7 kΩ a 3.3V) |
| **DHT11** | `GPIO 16` | Sensor de respaldo en zona opuesta de la cámara |
| **Calefactor PTC** | `GPIO 18` | PWM lento (1 Hz) vía optoacoplador 4N35 y MOSFETs IRFZ44N |
| **Ventilador 12V** | `GPIO 19` | Salida PWM LEDC vía transistor 2N3904 |
| **Humidificador** | `GPIO 17` | Salida digital hacia módulo de relé |
| **Motor STEP** | `GPIO 32` | Pulsos de micropasos para driver DRV8825 |
| **Motor DIR** | `GPIO 33` | Dirección de basculación de la bandeja |
| **Motor ENABLE** | `GPIO 23` | Habilitación de driver (`LOW` = activo, `HIGH` = frío) |
| **Botón 1 (Temp)** | `GPIO 25` | Pulsador a masa con `INPUT_PULLUP` interno |
| **Botón 2 (Hum)** | `GPIO 26` | Pulsador a masa con `INPUT_PULLUP` interno |
| **Botón 3 (Días)**| `GPIO 27` | Pulsador a masa con `INPUT_PULLUP` interno |

---

## 3. Especificación del Protocolo GATT BLE

- **Service UUID:** `b7a10001-5d3e-4c1a-9f2b-6e8d4a3c1f00`
- **Char Sensores (Notify/Read):** `b7a10002-5d3e-4c1a-9f2b-6e8d4a3c1f00`
- **Char Comandos (Write/WriteNR):** `b7a10003-5d3e-4c1a-9f2b-6e8d4a3c1f00`

### Trama de Telemetría (JSON compacto &lt; 240 bytes, terminador `\n`):
```json
{
  "up": 1234,
  "ta": 37.82,
  "ta2": 37.75,
  "td": 42.1,
  "h": 48.5,
  "st": 37.8,
  "sh": 45.0,
  "out": {"p": 1, "f": 75, "h": 0, "m": 0},
  "stt": "REG",
  "pid": 42,
  "d": 3,
  "dt": 21,
  "sv": 3450,
  "al": [],
  "t3": 37.9,
  "h3": 47.0,
  "pr": 1013.2,
  "mn": 0,
  "sr": 15
}
```

### Comandos Soportados:
- `{"cmd":"girar"}`: Inicia volteo de bandeja de inmediato.
- `{"cmd":"auto"}`: Restaura control 100% automático.
- `{"cmd":"reset_dias"}`: Reinicia contador a Día 1.
- `{"cmd":"dia","v":5}`: Fija día actual de incubación.
- `{"act":"ptc","v":60}`: Control manual de PTC (0-100%, -1 = auto).
- `{"act":"fan","v":80}`: Control manual de ventilador (0-100%, -1 = auto).
- `{"act":"hum","v":1}`: Control manual de humidificador (0/1, -1 = auto).
- `{"st":37.8,"sh":45,"dt":21,"dl":18,"hl":65,"iv":120}`: Sincronización de perfiles térmicos.

---

## 4. Interbloqueos Críticos de Seguridad

1. **Corte Térmico de Aire:** Si la temperatura del aire supera los **39.5 °C**, la potencia PTC se fuerza a **0 %** y el ventilador se activa al **100 %**.
2. **Corte Térmico de Disipador:** Si la sonda DS18B20 en el disipador PTC alcanza los **65.0 °C**, la PTC se corta de inmediato.
3. **Pérdida de Sensor Crítico:** Si el sensor de disipador falla o se desconecta, la potencia máxima de la PTC queda limitada al **50 %**.
4. **Desconexión BLE:** Si el enlace inalámbrico se interrumpe, el ESP32 restablece de inmediato el modo autónomo regulado por PID.
5. **Watchdog de Motor:** Si el volteador mecánico supera los 15 segundos activo, el pin `/ENABLE` se lleva a `HIGH` para evitar quemar el motor o el driver.

---

## 5. Instrucciones de Compilación y Pruebas

### Firmware ESP32
1. Abrir Arduino IDE (v2.x recomendado).
2. Instalar biblioteca **NimBLE-Arduino** (h2zero).
3. Instalar bibliotecas de Adafruit: `Adafruit AHTX0`, `Adafruit BMP280`, `DHT sensor library`.
4. Instalar `OneWire`, `DallasTemperature` y `LiquidCrystal_I2C`.
5. Seleccionar placa **ESP32 Dev Module**.
6. Abrir `firmware/incuNOVA_esp32.ino` y subir a 115200 baudios.

### Aplicación Web
```bash
npm install
npm run lint      # Verificación TypeScript
npm run build     # Compilación de producción Vite
npx tsx scripts/test_protocol_audit.ts  # Suite de 30 pruebas automatizadas
```
