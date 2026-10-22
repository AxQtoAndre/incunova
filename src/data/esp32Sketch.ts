// Exportación del sketch Arduino/C++ para descarga directa y visualización en la interfaz
export const ESP32_SKETCH_INO = `/*
 * ==============================================================================
 * incuNOVA v3.2 - Firmware de Incubadora Automática (ESP32 WROOM 38 pines + BLE)
 * ==============================================================================
 * VERSIÓN AUDITADA Y ENDURECIDA:
 * 1. Parser JSON libre de fugas de memoria con validación estricta de finitez (rechaza NaN/Inf).
 * 2. Transmisión BLE compatible con Web Bluetooth (MTU 247 y delimitador de trama streaming '\\n').
 * 3. Encolado asíncrono seguro de comandos (intercambio atómico con el bucle de control).
 * 4. Interbloqueos térmicos redundantes de seguridad:
 *    - Corte inmediato de calefacción si aire >= 39.5 °C o disipador PTC >= 65.0 °C.
 *    - Ventilación forzada al 100 % ante picos térmicos para disipar calor remanente.
 *    - Fallback a potencia máxima del 50 % si se pierde el sensor del disipador (DS18B20).
 *    - Desconexión BLE conmuta automáticamente a modo 100 % autónomo (AUTO).
 * 5. Temporizador no bloqueante del motor paso a paso con watchdog de tiempo máximo (15 s).
 * 6. Recuperación segura de bus I2C (evita cuelgues si AHT20/BMP280/LCD se desconectan).
 * 7. Protección de memoria flash NVS (guardado de tiempo espaciado a 15 min).
 * ==============================================================================
 */

#include <Arduino.h>
#include <Wire.h>
#include <Preferences.h>
#include <NimBLEDevice.h>
#include <Adafruit_AHTX0.h>
#include <Adafruit_BMP280.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <LiquidCrystal_I2C.h>

// Detección automática de NimBLE-Arduino 1.4.x vs 2.x
#if __has_include(<NimBLEConnInfo.h>)
  #define NIMBLE_V2 1
#else
  #define NIMBLE_V2 0
#endif

// ==============================================================================
// 1. UUIDs DE BLUETOOTH LOW ENERGY (Coincidentes con la app web incuNOVA)
// ==============================================================================
#define SERVICE_UUID        "b7a10001-5d3e-4c1a-9f2b-6e8d4a3c1f00"
#define CHAR_SENSORES_UUID  "b7a10002-5d3e-4c1a-9f2b-6e8d4a3c1f00"
#define CHAR_COMANDO_UUID   "b7a10003-5d3e-4c1a-9f2b-6e8d4a3c1f00"
#define BLE_DEVICE_NAME     "incuNOVA-01"

// ==============================================================================
// 2. ASIGNACIÓN DE PINES (Esquema físico incuNOVA ESP32)
// ==============================================================================
#define PIN_I2C_SDA     21
#define PIN_I2C_SCL     22
#define PIN_ONEWIRE     4    // DS18B20 en disipador PTC (pull-up 4.7k a 3V3)
#define PIN_DHT         16   // DHT11 respaldo de aire zona opuesta
#define PIN_PTC         18   // -> 4N35 -> IRFZ44N Q1/Q2 (PTC calefactor)
#define PIN_FAN         19   // -> 2N3904 -> ventilador 12V (PWM)
#define PIN_HUMIDIF     17   // -> Módulo relé humidificador
#define PIN_BTN_TEMP    25   // Botón 1 (Temperatura en LCD)
#define PIN_BTN_HUM     26   // Botón 2 (Humedad en LCD)
#define PIN_BTN_DIAS    27   // Botón 3 (Días transcurridos en LCD)

// DRV8825 Motor Paso a Paso
#define PIN_STEP        32
#define PIN_DIR         33
#define PIN_EN          23   // /ENABLE: LOW = activo, HIGH = reposo frío

// ==============================================================================
// 3. LÍMITES FÍSICOS, PARÁMETROS Y SEGURIDAD TÉRMICA
// ==============================================================================
#define RELE_NIVEL_ACTIVO       HIGH   // Invertir a LOW si el relé conmuta a masa
#define PWM_FAN_FREQ            1000   // Frecuencia PWM del ventilador
#define PWM_FAN_RES             8      // 8 bits (0 - 255)
#define PWM_FAN_CH              0      // Canal LEDC para ESP32 Core 2.x

#define PASOS_POR_VOLTEO        800    // Micropasos por volteo (ajustable)
#define PASO_MEDIO_US           1000   // 1 ms por semipulso (~500 Hz de paso)
#define VOLTEO_ALTERNAR         1      // Alterna dirección en cada ciclo
#define MOTOR_TIMEOUT_MS        15000  // Watchdog de seguridad del motor (15 s)

#define TEMP_EMERGENCIA_AIRE    39.5f  // Corte total de PTC por sobretemperatura de aire
#define TEMP_CORTE_DISIPADOR    65.0f  // Corte total de PTC por disipador caliente
#define TEMP_AVISO_DISIPADOR    60.0f  // Alerta preventiva en telemetría
#define TEMP_FAN_FORZADO        50.0f  // Ventilador al 100 % si disipador supera este umbral
#define PTC_MAX_SIN_DS          25.0f  // Límite conservador de potencia si se pierde el DS18B20 (con ventilador al 100%)

#define DIV_TEMP_MAX            1.5f   // Divergencia admisible AHT20 vs BMP280
#define DIV_TEMP_DHT_MAX        3.0f   // Divergencia contra sensor secundario DHT11
#define DIV_HUM_DHT_MAX         15.0f

// Calibración offset opcional
#define CAL_AHT_T    0.0f
#define CAL_AHT_H    0.0f
#define CAL_BMP_T    0.0f
#define CAL_DHT_T    0.0f
#define CAL_DHT_H    0.0f
#define CAL_DS_T     0.0f

// ==============================================================================
// 4. OBJETOS Y CONTROLADORES
// ==============================================================================
LiquidCrystal_I2C* lcd = nullptr;
Adafruit_AHTX0 aht;
Adafruit_BMP280 bmp;
DHT dht(PIN_DHT, DHT11);
OneWire oneWire(PIN_ONEWIRE);
DallasTemperature ds18b20(&oneWire);
Preferences prefs;

NimBLEServer*         pServer       = nullptr;
NimBLECharacteristic* pCharSensores = nullptr;
NimBLECharacteristic* pCharComando  = nullptr;

// ==============================================================================
// 5. ESTADO GLOBAL DEL SISTEMA
// ==============================================================================
// Parámetros de control
float setpoint_temp = 37.8f;
float setpoint_hum  = 45.0f;
int   dias_totales  = 21;
int   dia_lockdown  = 18;
float hum_lockdown  = 65.0f;
int   intervalo_volteo_min = 120;

// Temporización de incubación
uint32_t elapsed_s = 0;
int dia_incubacion = 1;

// Sensores crudos
float aht_t = NAN, aht_h = NAN, bmp_t = NAN, bmp_p = NAN, dht_t = NAN, dht_h = NAN, ds_t = NAN;
uint32_t aht_ts = 0, bmp_ts = 0, dht_ts = 0, ds_ts = 0;
bool aht_presente = false, bmp_presente = false;
uint8_t bmp_addr = 0x76;
bool aht_ok = false, bmp_ok = false, dht_ok = false, ds_ok = false;

// Variables fusionadas
float temp_aire = NAN, temp_aire2 = NAN, humedad = NAN, presion_hpa = 1013.2f;
float temp_max_aire = NAN;
bool  temp_valida = false, hum_valida = false, divergencia = false;
float temp_disipador = 30.0f;

// Actuadores
bool  ptc_activo = false, humidificador_activo = false;
int   ventilador_pct = 75;
volatile bool motor_girando = false;
uint32_t motor_inicio_ms = 0;
float salida_pid_pct = 0;
bool  emergencia = false;

// Modo manual con retorno automático por seguridad al desconectar
bool  man_ptc = false, man_fan = false, man_hum = false, man_hum_on = false;
float man_ptc_pct = 0;
int   man_fan_pct = 0;
#define FAN_AUTO_PCT 75

// Regulador PID
float Kp = 35.0f, Ki = 0.8f, Kd = 15.0f;
float error_integral = 0, error_previo = 0;

// Motor
int  pasos_rest = 0;
bool paso_nivel = false, dir_actual = false;
uint32_t t_paso_us = 0, ultimo_volteo_ms = 0;

// Alertas y estado
char alertas_json[48] = "[]";
bool alarma_activa = false;
const char* stt_actual = "REG";

// BLE y conexión
volatile bool ble_conectado = false;
volatile bool evento_desconexion = false;
uint32_t t_notif = 0;

// Cola de comandos FIFO segura
#define CMD_N   4
#define CMD_LEN 192
char cola_cmd[CMD_N][CMD_LEN];
volatile uint8_t cola_head = 0, cola_tail = 0;

// Pantalla LCD
int pantalla = 0;
bool lcd_redibujar = true;

// ==============================================================================
// 6. PARSER JSON ROBUSTO Y SIN ASIGNACIONES DINÁMICAS (Anti-Memory Leaks)
// ==============================================================================
static const char* buscarClave(const char* s, const char* clave) {
  if (!s || !clave) return nullptr;
  char pat[32];
  snprintf(pat, sizeof(pat), "\\"%s\\"", clave);
  size_t lp = strlen(pat);
  const char* p = s;
  while ((p = strstr(p, pat)) != nullptr) {
    const char* q = p + lp;
    while (*q && (*q == ' ' || *q == '\\t' || *q == '\\r' || *q == '\\n')) q++;
    if (*q == ':') {
      q++;
      while (*q && (*q == ' ' || *q == '\\t' || *q == '\\r' || *q == '\\n')) q++;
      return q;
    }
    p += lp;
  }
  return nullptr;
}

static bool jNum(const char* s, const char* clave, float& out) {
  const char* v = buscarClave(s, clave);
  if (!v) return false;
  if (strncmp(v, "true", 4) == 0)  { out = 1.0f; return true; }
  if (strncmp(v, "false", 5) == 0) { out = 0.0f; return true; }
  if (strncmp(v, "null", 4) == 0)  { return false; }
  char* fin = nullptr;
  float f = strtof(v, &fin);
  if (fin == v || !isfinite(f)) return false;
  out = f;
  return true;
}

static bool jStr(const char* s, const char* clave, char* out, size_t n) {
  const char* v = buscarClave(s, clave);
  if (!v || *v != '"') return false;
  v++;
  size_t i = 0;
  while (*v && *v != '"' && i < n - 1) {
    if (*v == '\\\\' && *(v + 1)) v++; // Ignorar caracter de escape
    out[i++] = *v++;
  }
  out[i] = 0;
  return true;
}

// ==============================================================================
// 7. PERSISTENCIA EN MEMORIA FLASH NVS (Preferences)
// ==============================================================================
void guardarConfig() {
  prefs.putFloat("st", setpoint_temp);
  prefs.putFloat("sh", setpoint_hum);
  prefs.putInt("dt", dias_totales);
  prefs.putInt("dl", dia_lockdown);
  prefs.putFloat("hl", hum_lockdown);
  prefs.putInt("iv", intervalo_volteo_min);
}

void guardarTiempo() {
  prefs.putULong("el", elapsed_s);
}

void cargarConfig() {
  setpoint_temp = prefs.getFloat("st", 37.8f);
  setpoint_hum  = prefs.getFloat("sh", 45.0f);
  dias_totales  = prefs.getInt("dt", 21);
  dia_lockdown  = prefs.getInt("dl", 18);
  hum_lockdown  = prefs.getFloat("hl", 65.0f);
  intervalo_volteo_min = prefs.getInt("iv", 120);
  elapsed_s     = prefs.getULong("el", 0);
}

// ==============================================================================
// 8. CONTROLADORES DE ACTUADORES
// ==============================================================================
static void fanPwmInit() {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(PIN_FAN, PWM_FAN_FREQ, PWM_FAN_RES);
#else
  ledcSetup(PWM_FAN_CH, PWM_FAN_FREQ, PWM_FAN_RES);
  ledcAttachPin(PIN_FAN, PWM_FAN_CH);
#endif
}

static void fanPwmWrite(uint8_t duty) {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcWrite(PIN_FAN, duty);
#else
  ledcWrite(PWM_FAN_CH, duty);
#endif
}

void iniciarVolteo() {
  if (motor_girando) return;
#if VOLTEO_ALTERNAR
  dir_actual = !dir_actual;
#endif
  digitalWrite(PIN_DIR, dir_actual ? HIGH : LOW);
  digitalWrite(PIN_EN, LOW); // Habilita driver
  delayMicroseconds(10);
  pasos_rest = PASOS_POR_VOLTEO;
  paso_nivel = false;
  t_paso_us = micros();
  motor_inicio_ms = millis();
  motor_girando = true;
  Serial.println(F("[MOTOR] Volteo mecánico iniciado"));
}

// Servicio no bloqueante del motor paso a paso con watchdog de seguridad
void servicioMotor() {
  if (!motor_girando) return;

  uint32_t nowMs = millis();
  // Watchdog de seguridad del motor para evitar sobrecalentamiento del driver
  if ((nowMs - motor_inicio_ms) > MOTOR_TIMEOUT_MS) {
    digitalWrite(PIN_EN, HIGH);
    motor_girando = false;
    ultimo_volteo_ms = nowMs;
    Serial.println(F("[MOTOR ALERTA] Timeout de volteo superado. Driver liberado."));
    return;
  }

  uint32_t n = micros();
  if (n - t_paso_us < PASO_MEDIO_US) return;
  t_paso_us = n;
  paso_nivel = !paso_nivel;
  digitalWrite(PIN_STEP, paso_nivel ? HIGH : LOW);

  if (!paso_nivel && --pasos_rest <= 0) {
    digitalWrite(PIN_EN, HIGH); // Apaga bobinas para que no se caliente en reposo
    motor_girando = false;
    ultimo_volteo_ms = millis();
    Serial.println(F("[MOTOR] Volteo mecánico completado con éxito"));
  }
}

// ==============================================================================
// 9. LECTURA Y DIAGNÓSTICO DE SENSORES
// ==============================================================================
static bool i2cResponde(uint8_t addr) {
  Wire.beginTransmission(addr);
  return (Wire.endTransmission() == 0);
}

static bool fresco(uint32_t ts, uint32_t now, uint32_t maxMs) {
  return (ts != 0 && (now - ts) <= maxMs);
}

static bool rango(float v, float a, float b) {
  return (isfinite(v) && v > a && v < b);
}

void leerAHT_BMP(uint32_t now) {
  static uint32_t t_reintento = 0;

  // AHT20
  if (aht_presente && i2cResponde(0x38)) {
    sensors_event_t eh, et;
    if (aht.getEvent(&eh, &et) && rango(et.temperature, -10, 60) &&
        rango(eh.relative_humidity, -1, 101)) {
      aht_t = et.temperature + CAL_AHT_T;
      aht_h = constrain(eh.relative_humidity + CAL_AHT_H, 0.0f, 100.0f);
      aht_ts = now;
    }
  }

  // BMP280
  if (bmp_presente && i2cResponde(bmp_addr)) {
    float t = bmp.readTemperature();
    float p = bmp.readPressure();
    if (rango(t, -10, 60)) {
      bmp_t = t + CAL_BMP_T;
      if (rango(p, 30000, 110000)) bmp_p = p / 100.0f;
      bmp_ts = now;
    }
  }

  // Reintento de inicialización cada 30 segundos si alguno se descolgó
  if ((now - t_reintento) >= 30000) {
    t_reintento = now;
    if (!fresco(aht_ts, now, 5000)) aht_presente = aht.begin();
    if (!fresco(bmp_ts, now, 5000)) {
      bmp_presente = bmp.begin(0x76);
      bmp_addr = 0x76;
      if (!bmp_presente) { bmp_presente = bmp.begin(0x77); bmp_addr = 0x77; }
    }
  }
}

void leerDHT(uint32_t now) {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (rango(t, -10, 60) && rango(h, -1, 101)) {
    dht_t = t + CAL_DHT_T;
    dht_h = constrain(h + CAL_DHT_H, 0.0f, 100.0f);
    dht_ts = now;
  }
}

// DS18B20 no bloqueante con solicitud periódica y lectura diferida
void servicioDS18B20(uint32_t now) {
  static uint32_t t_req = 0;
  static bool pendiente = false;

  if (!pendiente && (now - t_req) >= 1000) {
    ds18b20.requestTemperatures();
    t_req = now;
    pendiente = true;
  } else if (pendiente && (now - t_req) >= 800) {
    pendiente = false;
    float t = ds18b20.getTempCByIndex(0);
    if (t != DEVICE_DISCONNECTED_C && t > -40.0f && t < 120.0f && t != 85.0f) {
      ds_t = t + CAL_DS_T;
      ds_ts = now;
    }
  }
}

// Fusión sensorial con árbitro térmico redundante
void fusionarSensores(uint32_t now) {
  aht_ok = fresco(aht_ts, now, 5000);
  bmp_ok = fresco(bmp_ts, now, 5000);
  dht_ok = fresco(dht_ts, now, 10000);
  ds_ok  = fresco(ds_ts, now, 5000);
  divergencia = false;

  // Fusión de temperatura de los huevos
  temp_valida = true;
  if (aht_ok && bmp_ok) {
    temp_aire = aht_t;
    temp_aire2 = bmp_t;
    if (fabsf(aht_t - bmp_t) > DIV_TEMP_MAX) {
      divergencia = true;
      if (dht_ok && fabsf(bmp_t - dht_t) < fabsf(aht_t - dht_t)) {
        temp_aire = bmp_t;
        temp_aire2 = aht_t;
      }
    }
  } else if (aht_ok) {
    temp_aire = aht_t;
    temp_aire2 = dht_ok ? dht_t : aht_t;
    if (dht_ok && fabsf(aht_t - dht_t) > DIV_TEMP_DHT_MAX) divergencia = true;
  } else if (bmp_ok) {
    temp_aire = bmp_t;
    temp_aire2 = dht_ok ? dht_t : bmp_t;
    if (dht_ok && fabsf(bmp_t - dht_t) > DIV_TEMP_DHT_MAX) divergencia = true;
  } else if (dht_ok) {
    temp_aire = dht_t;
    temp_aire2 = dht_t;
  } else {
    temp_valida = false;
  }

  // Temperatura máxima de aire entre todos los sensores (para interbloqueo)
  temp_max_aire = NAN;
  if (aht_ok) temp_max_aire = aht_t;
  if (bmp_ok && (isnan(temp_max_aire) || bmp_t > temp_max_aire)) temp_max_aire = bmp_t;
  if (dht_ok && (isnan(temp_max_aire) || dht_t > temp_max_aire)) temp_max_aire = dht_t;

  // Fusión de humedad
  hum_valida = true;
  if (aht_ok) {
    humedad = aht_h;
    if (dht_ok && fabsf(aht_h - dht_h) > DIV_HUM_DHT_MAX) divergencia = true;
  } else if (dht_ok) {
    humedad = dht_h;
  } else {
    hum_valida = false;
  }

  if (bmp_ok && isfinite(bmp_p)) presion_hpa = bmp_p;
  if (ds_ok) temp_disipador = ds_t;
}

// ==============================================================================
// 10. SEGURIDAD, PID Y GESTIÓN TÉRMICA
// ==============================================================================
void evaluarSeguridad() {
  bool sobre = (!isnan(temp_max_aire) && temp_max_aire >= TEMP_EMERGENCIA_AIRE) ||
               (ds_ok && temp_disipador >= TEMP_CORTE_DISIPADOR);

  if (sobre) {
    if (!emergencia) {
      Serial.println(F("[CORTE DE EMERGENCIA] Sobrecalentamiento detectado. PTC forzada a 0."));
    }
    emergencia = true;
  } else if (emergencia) {
    bool aire_ok = isnan(temp_max_aire) || temp_max_aire < (TEMP_EMERGENCIA_AIRE - 0.7f);
    bool disi_ok = !ds_ok || temp_disipador < (TEMP_CORTE_DISIPADOR - 8.0f);
    if (aire_ok && disi_ok) {
      emergencia = false;
      Serial.println(F("[SEGURIDAD] Condiciones térmicas normalizadas."));
    }
  }
}

void calcularPID() {
  if (!temp_valida) {
    salida_pid_pct = 0;
    error_integral = 0;
    return;
  }

  float err = setpoint_temp - temp_aire;
  float p = Kp * err;
  float d = Kd * (err - error_previo);
  error_previo = err;

  if (err > 2.0f || err < -1.0f) {
    error_integral = 0;
  } else {
    float tent = error_integral + err;
    float out = p + Ki * tent + d;
    bool satura = (out > 100.0f && err > 0) || (out < 0.0f && err < 0);
    if (!satura) error_integral = tent;
  }
  error_integral = constrain(error_integral, -50.0f, 50.0f);
  salida_pid_pct = constrain(p + Ki * error_integral + d, 0.0f, 100.0f);
}

float potenciaPTC() {
  // Fail-safe absoluto: interbloqueo físico prioritario sobre cualquier modo manual o PID
  if (emergencia || !temp_valida) return 0.0f;
  if (!isnan(temp_max_aire) && temp_max_aire >= TEMP_EMERGENCIA_AIRE) return 0.0f;
  if (ds_ok && temp_disipador >= TEMP_CORTE_DISIPADOR) return 0.0f;

  float duty = man_ptc ? man_ptc_pct : salida_pid_pct;
  // Si no hay sensor en disipador (DS18B20 desconectado), limitar potencia máxima al 25 % por seguridad
  if (!ds_ok && duty > PTC_MAX_SIN_DS) duty = PTC_MAX_SIN_DS;
  return duty;
}

// Modulación lenta de potencia por ancho de pulso (ventana de 1000 ms)
void servicioPTC(uint32_t now) {
  static uint32_t ventana = 0;
  if ((now - ventana) >= 1000) ventana = now;

  float duty = potenciaPTC();
  bool on = (now - ventana) < (uint32_t)(duty * 10.0f);
  digitalWrite(PIN_PTC, on ? HIGH : LOW);
  ptc_activo = on;
}

void controlHumidificador() {
  bool estado;
  if (man_hum) {
    estado = man_hum_on;
  } else if (!hum_valida) {
    estado = false;
  } else {
    float obj = (dia_incubacion >= dia_lockdown) ? hum_lockdown : setpoint_hum;
    estado = humidificador_activo;
    if (humedad < obj - 1.5f) estado = true;
    else if (humedad > obj + 1.0f) estado = false;
  }
  humidificador_activo = estado;
  digitalWrite(PIN_HUMIDIF, estado ? RELE_NIVEL_ACTIVO : !RELE_NIVEL_ACTIVO);
}

void controlVentilador() {
  int pct = man_fan ? man_fan_pct : FAN_AUTO_PCT;

  // Interbloqueo térmico: forzar ventilador al 100 % si:
  // 1. El disipador supera umbral térmico (>= 50 °C).
  // 2. Se pierde el sensor DS18B20 (!ds_ok) para garantizar refrigeración continua preventiva.
  // 3. El aire supera el límite de emergencia (>= 39.5 °C).
  if (!ds_ok ||
      (ds_ok && temp_disipador >= TEMP_FAN_FORZADO) ||
      (!isnan(temp_max_aire) && temp_max_aire >= TEMP_EMERGENCIA_AIRE)) {
    pct = 100;
  }

  ventilador_pct = constrain(pct, 0, 100);
  fanPwmWrite((uint8_t)((ventilador_pct * 255) / 100));
}

void volteoAutomatico(uint32_t now) {
  if (motor_girando || dia_incubacion >= dia_lockdown) return;
  if ((now - ultimo_volteo_ms) >= (uint32_t)intervalo_volteo_min * 60000UL) {
    iniciarVolteo();
  }
}

// ==============================================================================
// 11. GENERACIÓN DE ALERTAS Y TELEMETRÍA
// ==============================================================================
void calcularAlertas(uint32_t up_s) {
  char* w = alertas_json;
  size_t cap = sizeof(alertas_json);
  int n = snprintf(w, cap, "[");
  bool alguna = false, critica = false;

  auto add = [&](const char* c) {
    if (n < (int)cap - 6) {
      n += snprintf(w + n, cap - n, "%s\\"%s\\"", alguna ? "," : "", c);
      alguna = true;
    }
  };

  if (!temp_valida || !ds_ok) {
    add("SF");
    critica = true;
  }
  if (temp_valida && up_s > 900) {
    if (temp_aire < setpoint_temp - 1.0f) add("TB");
    if (temp_aire > setpoint_temp + 1.0f) { add("TA"); critica = true; }
  }
  if (hum_valida && up_s > 900) {
    float obj = (dia_incubacion >= dia_lockdown) ? hum_lockdown : setpoint_hum;
    if (humedad < obj - 12.0f) add("HB");
    if (humedad > obj + 12.0f) add("HA");
  }
  if (ds_ok && temp_disipador >= TEMP_AVISO_DISIPADOR) {
    add("SD");
    critica = true;
  }
  if (divergencia) add("DS");
  if (emergencia) critica = true;

  snprintf(w + n, cap - n, "]");
  alarma_activa = alguna;

  if (critica) stt_actual = "ALM";
  else if (motor_girando) stt_actual = "VOL";
  else if (temp_valida && temp_aire < setpoint_temp - 0.5f) stt_actual = "CAL";
  else stt_actual = "REG";
}

// ==============================================================================
// 12. PROCESAMIENTO DE COMANDOS DESDE WEB BLUETOOTH
// ==============================================================================
void procesarComando(const char* s) {
  if (!s || strlen(s) == 0) return;
  Serial.print(F("[BLE RECIBIDO] ")); Serial.println(s);

  char tmp[16];
  float v;

  if (jStr(s, "cmd", tmp, sizeof(tmp))) {
    if (!strcmp(tmp, "girar")) {
      iniciarVolteo();
    } else if (!strcmp(tmp, "auto")) {
      man_ptc = man_fan = man_hum = false;
      Serial.println(F("[COMANDO] Modo 100% automático restaurado"));
    } else if (!strcmp(tmp, "reset_dias")) {
      elapsed_s = 0;
      guardarTiempo();
      Serial.println(F("[COMANDO] Contador de días reiniciado a Día 1"));
    } else if (!strcmp(tmp, "dia") && jNum(s, "v", v)) {
      int d = constrain((int)v, 1, 99);
      elapsed_s = (uint32_t)(d - 1) * 86400UL;
      guardarTiempo();
    }
  }

  if (jStr(s, "act", tmp, sizeof(tmp)) && jNum(s, "v", v)) {
    if (!strcmp(tmp, "ptc")) {
      if (v < 0) man_ptc = false;
      else { man_ptc = true; man_ptc_pct = constrain(v, 0.0f, 100.0f); }
    } else if (!strcmp(tmp, "fan")) {
      if (v < 0) man_fan = false;
      else { man_fan = true; man_fan_pct = constrain((int)v, 0, 100); }
    } else if (!strcmp(tmp, "hum")) {
      if (v < 0) man_hum = false;
      else { man_hum = true; man_hum_on = (v > 0.5f); }
    }
  }

  bool cambio = false;
  if (jNum(s, "st", v)) { setpoint_temp = constrain(v, 30.0f, 39.0f); cambio = true; }
  if (jNum(s, "sh", v)) { setpoint_hum  = constrain(v, 20.0f, 90.0f); cambio = true; }
  if (jNum(s, "dt", v)) { dias_totales  = constrain((int)v, 1, 99);   cambio = true; }
  if (jNum(s, "dl", v)) { dia_lockdown  = constrain((int)v, 0, 99);   cambio = true; }
  if (jNum(s, "hl", v)) { hum_lockdown  = constrain(v, 20.0f, 95.0f); cambio = true; }
  if (jNum(s, "iv", v)) { intervalo_volteo_min = constrain((int)v, 1, 1440); cambio = true; }

  if (cambio) {
    guardarConfig();
    Serial.println(F("[CONFIG] Parámetros actualizados y guardados en NVS"));
  }
  lcd_redibujar = true;
}

void encolarComando(const char* datos, size_t len) {
  uint8_t sig = (cola_head + 1) % CMD_N;
  if (sig == cola_tail || len == 0) return;
  if (len >= CMD_LEN) len = CMD_LEN - 1;
  memcpy(cola_cmd[cola_head], datos, len);
  cola_cmd[cola_head][len] = 0;
  cola_head = sig;
}

void procesarCola() {
  while (cola_tail != cola_head) {
    procesarComando(cola_cmd[cola_tail]);
    cola_tail = (cola_tail + 1) % CMD_N;
  }
}

// ==============================================================================
// 13. STACK BLUETOOTH LOW ENERGY (NimBLE-Arduino)
// ==============================================================================
class ServerCB : public NimBLEServerCallbacks {
#if NIMBLE_V2
  void onConnect(NimBLEServer* s, NimBLEConnInfo& info) override {
    ble_conectado = true;
    Serial.println(F("[BLE] Navegador Web conectado"));
  }
  void onDisconnect(NimBLEServer* s, NimBLEConnInfo& info, int reason) override {
    ble_conectado = false;
    evento_desconexion = true;
    NimBLEDevice::startAdvertising();
  }
#else
  void onConnect(NimBLEServer* s) override {
    ble_conectado = true;
    Serial.println(F("[BLE] Navegador Web conectado"));
  }
  void onDisconnect(NimBLEServer* s) override {
    ble_conectado = false;
    evento_desconexion = true;
    NimBLEDevice::startAdvertising();
  }
#endif
};

class CmdCB : public NimBLECharacteristicCallbacks {
#if NIMBLE_V2
  void onWrite(NimBLECharacteristic* c, NimBLEConnInfo& info) override {
    std::string v = c->getValue();
    if (!v.empty()) {
      encolarComando(v.c_str(), v.length());
    }
  }
#else
  void onWrite(NimBLECharacteristic* c) override {
    std::string v = c->getValue();
    if (!v.empty()) {
      encolarComando(v.c_str(), v.length());
    }
  }
#endif
};

void iniciarBLE() {
  NimBLEDevice::init(BLE_DEVICE_NAME);
  NimBLEDevice::setMTU(247); // MTU óptima para tramas completas sin desbordes
  pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCB());

  NimBLEService* svc = pServer->createService(SERVICE_UUID);
  pCharSensores = svc->createCharacteristic(
    CHAR_SENSORES_UUID,
    NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
  );
  pCharComando = svc->createCharacteristic(
    CHAR_COMANDO_UUID,
    NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
  );
  pCharComando->setCallbacks(new CmdCB());
  svc->start();

  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->setName(BLE_DEVICE_NAME);
  adv->setScanResponse(true);
  adv->setMinPreferred(0x06); // 7.5 ms intervalo
  adv->setMaxPreferred(0x12); // 22.5 ms
  adv->start();
  Serial.println(F("[BLE] Servicio incuNOVA v3.2 anunciado"));
}

// Construye la trama JSON con terminador newline '\\n' para streaming y delimitación
int construirPayload(char* buf, size_t n) {
  uint32_t up = (uint32_t)(esp_timer_get_time() / 1000000ULL);
  int seg_volteo = 0;
  if (dia_incubacion < dia_lockdown) {
    uint32_t tr = (millis() - ultimo_volteo_ms) / 1000UL;
    uint32_t total = (uint32_t)intervalo_volteo_min * 60UL;
    seg_volteo = (tr < total) ? (int)(total - tr) : 0;
  }
  float obj_h = (dia_incubacion >= dia_lockdown) ? hum_lockdown : setpoint_hum;
  int dia_tx = min(dia_incubacion, dias_totales);
  int mn = (man_ptc ? 1 : 0) | (man_fan ? 2 : 0) | (man_hum ? 4 : 0);
  int sr = (aht_ok ? 1 : 0) | (bmp_ok ? 2 : 0) | (dht_ok ? 4 : 0) | (ds_ok ? 8 : 0);

  int len = snprintf(buf, n,
    "{\\"up\\":%lu,\\"ta\\":%.2f,\\"ta2\\":%.2f,\\"td\\":%.1f,\\"h\\":%.1f,\\"st\\":%.1f,\\"sh\\":%.1f,"
    "\\"out\\":{\\"p\\":%d,\\"f\\":%d,\\"h\\":%d,\\"m\\":%d},\\"stt\\":\\"%s\\",\\"pid\\":%d,"
    "\\"d\\":%d,\\"dt\\":%d,\\"sv\\":%d,\\"al\\":%s,"
    "\\"t3\\":%.1f,\\"h3\\":%.1f,\\"pr\\":%.1f,\\"mn\\":%d,\\"sr\\":%d}\\n",
    (unsigned long)up,
    temp_valida ? temp_aire : 0.0f, temp_valida ? temp_aire2 : 0.0f,
    temp_disipador, hum_valida ? humedad : 0.0f,
    setpoint_temp, obj_h,
    ptc_activo ? 1 : 0, ventilador_pct, humidificador_activo ? 1 : 0, motor_girando ? 1 : 0,
    stt_actual, (int)potenciaPTC(), dia_tx, dias_totales, seg_volteo, alertas_json,
    dht_ok ? dht_t : 0.0f, dht_ok ? dht_h : 0.0f, presion_hpa, mn, sr);

  return len;
}

void notificarSensores() {
  if (!pCharSensores || !ble_conectado) return;
  char buf[512];
  int len = construirPayload(buf, sizeof(buf));
  if (len <= 0 || len >= (int)sizeof(buf)) return;

  pCharSensores->setValue((uint8_t*)buf, (size_t)len);
  pCharSensores->notify();
}

void servicioBLE(uint32_t now) {
  if (evento_desconexion) {
    evento_desconexion = false;
    // SEGURIDAD CRÍTICA: Al desconectarse de la Web vuelve a modo 100% autónomo
    man_ptc = man_fan = man_hum = false;
    Serial.println(F("[BLE SEGURIDAD] Desconexión detectada. Retorno inmediato a modo AUTO."));
    NimBLEDevice::getAdvertising()->start();
  }

  if (ble_conectado && (now - t_notif) >= 2000) {
    t_notif = now;
    notificarSensores();
  }
}

// ==============================================================================
// 14. INTERFAZ FÍSICA: PANTALLA LCD 16x2 Y 3 PULSADORES
// ==============================================================================
void lcdLinea(uint8_t fila, const char* txt, bool marca) {
  if (!lcd) return;
  char b[24];
  snprintf(b, sizeof(b), "%-16.16s", txt);
  if (marca) b[15] = '!';
  lcd->setCursor(0, fila);
  lcd->print(b);
}

void dibujarPantalla() {
  if (!lcd) return;
  char l1[32], l2[32];
  switch (pantalla) {
    case 0: // BOTÓN 1: Temperatura
      if (temp_valida) snprintf(l1, sizeof(l1), "Huevos:%5.1fC", temp_aire);
      else             snprintf(l1, sizeof(l1), "Huevos: --.-C");
      if (ds_ok) snprintf(l2, sizeof(l2), "Set:%.1f PTC:%.0fC", setpoint_temp, temp_disipador);
      else       snprintf(l2, sizeof(l2), "Set:%.1f PTC:--C", setpoint_temp);
      break;

    case 1: { // BOTÓN 2: Humedad
      float obj = (dia_incubacion >= dia_lockdown) ? hum_lockdown : setpoint_hum;
      if (hum_valida) snprintf(l1, sizeof(l1), "Humedad:%5.1f%%", humedad);
      else            snprintf(l1, sizeof(l1), "Humedad: --.-%%");
      snprintf(l2, sizeof(l2), "Obj:%.0f%% Hum:%s", obj, humidificador_activo ? "ON" : "OFF");
      break;
    }

    default: { // BOTÓN 3: Días de incubación
      uint32_t d = elapsed_s / 86400UL;
      uint32_t h = (elapsed_s % 86400UL) / 3600UL;
      int faltan = max(0, dias_totales - (int)d);
      snprintf(l1, sizeof(l1), "Transc: %lud %02luh", (unsigned long)d, (unsigned long)h);
      if (faltan > 0) {
        snprintf(l2, sizeof(l2), "D%d/%d Faltan:%d", min(dia_incubacion, dias_totales), dias_totales, faltan);
      } else {
        snprintf(l2, sizeof(l2), "D%d/%d ECLOSION", dias_totales, dias_totales);
      }
      break;
    }
  }
  lcdLinea(0, l1, alarma_activa);
  lcdLinea(1, l2, false);
}

int leerBotones(uint32_t now) {
  static const uint8_t pines[3] = {PIN_BTN_TEMP, PIN_BTN_HUM, PIN_BTN_DIAS};
  static bool estable[3] = {HIGH, HIGH, HIGH}, ultima[3] = {HIGH, HIGH, HIGH};
  static uint32_t t_cambio[3] = {0, 0, 0};
  int pulsado = -1;

  for (int i = 0; i < 3; i++) {
    bool lec = digitalRead(pines[i]);
    if (lec != ultima[i]) {
      ultima[i] = lec;
      t_cambio[i] = now;
    }
    if ((now - t_cambio[i]) > 30 && lec != estable[i]) {
      estable[i] = lec;
      if (lec == LOW) pulsado = i;
    }
  }
  return pulsado;
}

// ==============================================================================
// 15. SETUP
// ==============================================================================
void setup() {
  Serial.begin(115200);

  // Estados seguros de salidas ANTES de cualquier otra operación
  pinMode(PIN_PTC, OUTPUT);     digitalWrite(PIN_PTC, LOW);
  pinMode(PIN_HUMIDIF, OUTPUT); digitalWrite(PIN_HUMIDIF, !RELE_NIVEL_ACTIVO);
  pinMode(PIN_STEP, OUTPUT);    digitalWrite(PIN_STEP, LOW);
  pinMode(PIN_DIR, OUTPUT);     digitalWrite(PIN_DIR, LOW);
  pinMode(PIN_EN, OUTPUT);      digitalWrite(PIN_EN, HIGH); // Driver liberado

  pinMode(PIN_BTN_TEMP, INPUT_PULLUP);
  pinMode(PIN_BTN_HUM, INPUT_PULLUP);
  pinMode(PIN_BTN_DIAS, INPUT_PULLUP);

  fanPwmInit();
  fanPwmWrite(0);

  prefs.begin("incuba", false);
  cargarConfig();

  // Inicialización de bus I2C con timeout de 50 ms para evitar bloqueos
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.setClock(100000);
  Wire.setTimeOut(50);

  // Autodetección segura de pantalla LCD 16x2
  uint8_t dirLcd = i2cResponde(0x27) ? 0x27 : (i2cResponde(0x3F) ? 0x3F : 0);
  if (dirLcd) {
    lcd = new LiquidCrystal_I2C(dirLcd, 16, 2);
    lcd->init();
    lcd->backlight();
    lcdLinea(0, "incuNOVA v3.2", false);
    lcdLinea(1, "Iniciando...", false);
  } else {
    Serial.println(F("[WARN] LCD I2C no detectada en 0x27 ni 0x3F"));
  }

  // Inicialización segura de AHT20
  if (i2cResponde(0x38)) {
    aht_presente = aht.begin();
  } else {
    Serial.println(F("[WARN] AHT20 no responde en 0x38"));
    aht_presente = false;
  }

  // Inicialización segura de BMP280
  if (i2cResponde(0x76)) {
    bmp_presente = bmp.begin(0x76);
    bmp_addr = 0x76;
  } else if (i2cResponde(0x77)) {
    bmp_presente = bmp.begin(0x77);
    bmp_addr = 0x77;
  } else {
    bmp_presente = false;
  }

  if (bmp_presente) {
    bmp.setSampling(Adafruit_BMP280::MODE_NORMAL, Adafruit_BMP280::SAMPLING_X2,
                    Adafruit_BMP280::SAMPLING_X16, Adafruit_BMP280::FILTER_X16,
                    Adafruit_BMP280::STANDBY_MS_500);
  }

  dht.begin();
  ds18b20.begin();
  ds18b20.setResolution(11);
  ds18b20.setWaitForConversion(false);

  Serial.printf("[INIT v3.2] AHT20:%d BMP280:%d DS18B20:%d\\n",
                aht_presente, bmp_presente, ds18b20.getDeviceCount());

  iniciarBLE();
  ultimo_volteo_ms = millis();
}

// ==============================================================================
// 16. BUCLE PRINCIPAL (LOOP NO BLOQUEANTE)
// ==============================================================================
void loop() {
  uint32_t now = millis();
  static uint32_t t_ctl = 0, t_tick = 0, t_dht = 0, t_lcd = 0;
  if (t_tick == 0) t_tick = now;

  servicioMotor();  // Pulsos paso a paso no bloqueantes
  servicioPTC(now); // PWM lento del calefactor PTC
  procesarCola();   // Comandos encolados por BLE
  servicioBLE(now); // Notificaciones y gestión de conexión

  // Contador de tiempo de incubación con guardado cada 15 minutos en NVS
  while ((now - t_tick) >= 1000) {
    t_tick += 1000;
    elapsed_s++;
    if (elapsed_s % 900 == 0) guardarTiempo();
  }
  dia_incubacion = (int)(elapsed_s / 86400UL) + 1;

  // Interacción de botones físicos
  int b = leerBotones(now);
  if (b >= 0) {
    pantalla = b;
    lcd_redibujar = true;
  }

  // Operaciones de lectura y control (cuando el motor no está basculando)
  if (!motor_girando) {
    servicioDS18B20(now);

    if ((now - t_dht) >= 2500) {
      t_dht = now;
      leerDHT(now);
    }

    if ((now - t_ctl) >= 1000) { // Bucle de control a 1 Hz
      t_ctl = now;
      leerAHT_BMP(now);
      fusionarSensores(now);
      evaluarSeguridad();
      calcularPID();
      controlHumidificador();
      controlVentilador();
      volteoAutomatico(now);
      calcularAlertas((uint32_t)(esp_timer_get_time() / 1000000ULL));
      lcd_redibujar = true;
    }

    if (lcd_redibujar && (now - t_lcd) >= 300) {
      t_lcd = now;
      lcd_redibujar = false;
      dibujarPantalla();
    }
  }

  if (motor_girando) yield();
  else delay(2);
}
`;
