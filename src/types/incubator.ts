/**
 * Tipos de datos para IncubaESP con Web Bluetooth API (BLE)
 */

export const BLE_UUIDS = {
  SERVICE: 'b7a10001-5d3e-4c1a-9f2b-6e8d4a3c1f00',
  CHAR_SENSORES: 'b7a10002-5d3e-4c1a-9f2b-6e8d4a3c1f00', // Lectura y Notificación
  CHAR_COMANDO: 'b7a10003-5d3e-4c1a-9f2b-6e8d4a3c1f00',  // Escritura
} as const;

export type EstadoConexionBLE = 'conectando' | 'conectado' | 'desconectado' | 'reconectando';

export type EstadoESP32 = 'CALENTANDO' | 'REGULANDO' | 'VOLTEANDO' | 'ALARMA' | 'DESCONECTADO';

export type TipoAlerta =
  | 'TEMP_BAJA'
  | 'TEMP_ALTA'
  | 'HUM_BAJA'
  | 'HUM_ALTA'
  | 'SENSOR_FALLA'
  | 'SOBRECALENTAMIENTO_DISIPADOR'
  | 'NIVEL_AGUA_BAJO'
  | 'DIVERGENCIA_SENSORES';

export interface SalidasActuadores {
  ptc: boolean;
  ventilador: number; // 0 - 100% PWM
  humidificador: boolean;
  motor: boolean;
}

export interface PIDData {
  kp: number;
  ki: number;
  kd: number;
  salida: number; // 0 - 100%
}

export interface SensorDataESP32 {
  id: string;
  uptime_s: number;
  temp_aire: number;
  temp_aire2: number; // Sensor redundante en zona de huevos
  temp_disipador: number;
  humedad: number;
  presion: number; // hPa
  setpoint_temp: number;
  setpoint_hum: number;
  salidas: SalidasActuadores;
  estado: EstadoESP32;
  pid: PIDData;
  dia_incubacion: number;
  dias_totales: number;
  segundos_proximo_volteo: number;
  alertas: TipoAlerta[];
  temp_dht?: number;
  hum_dht?: number;
  manual?: { ptc: boolean; ventilador: boolean; humidificador: boolean };
  sensores_ok?: { aht: boolean; bmp: boolean; dht: boolean; ds: boolean };
}

/**
 * Payload JSON compacto para BLE (<180 bytes) transmitido por notificación
 */
export interface BleCompactSensorsPayload {
  id?: string;
  up: number;         // Uptime segundos
  ta: number;         // Temp aire principal
  ta2: number;        // Temp aire sonda 2
  td: number;         // Temp disipador
  h: number;          // Humedad relativa %
  st: number;         // Setpoint temperatura
  sh: number;         // Setpoint humedad
  out: {
    p: number;        // PTC: 0 o 1
    f: number;        // Ventilador PWM 0-100
    h: number;        // Humidificador: 0 o 1
    m: number;        // Motor: 0 o 1
  };
  stt: 'CAL' | 'REG' | 'VOL' | 'ALM'; // Estado compacto
  pid: number;        // Salida PID %
  d: number;          // Día actual
  dt: number;         // Días totales
  sv: number;         // Segundos para próximo volteo
  al?: string[];      // Alertas compactas: 'TB','TA','HB','HA','SD','DS'
  t3?: number;        // DHT11 temp
  h3?: number;        // DHT11 hum
  pr?: number;        // presión hPa
  mn?: number;        // bitmask modo manual: 1=PTC, 2=ventilador, 4=humidificador
  sr?: number;        // bitmask sensores OK: 1=AHT20, 2=BMP280, 4=DHT11, 8=DS18B20
}

export interface IncubadoraConfig {
  id: string;
  nombre: string;
  deviceId?: string; // ID asignado por Web Bluetooth al emparejar
  perfilId: string;
  cantidadHuevos: number;
  fechaInicio: string; // ISO date string
  intervaloVolteoMinutos: number;
  activa: boolean;
  esSimulada: boolean;
}

export interface PerfilEspecie {
  id: string;
  nombre: string;
  nombreCientifico?: string;
  icono: string;
  diasTotales: number;
  temperatura: number; // °C
  toleranciaTemp: number; // ± °C (ej: 0.2)
  humedadNormal: number; // %
  diaLockdown: number;
  humedadLockdown: number; // %
  intervaloVolteoHoras: number;
  rotacionDetenidaEnLockdown: boolean;
  notas: string;
  esPersonalizado?: boolean;
}

export interface PerfilMixtoResultado {
  especiesSeleccionadas: PerfilEspecie[];
  tempCompromiso: number;
  humCompromisoNormal: number;
  humCompromisoLockdown: number;
  intervaloVolteoHoras: number;
  diaLockdownSugerido: number;
  diaEclosionFinal: number;
  conflictos: string[];
  advertencias: string[];
}

export interface LecturaHistorica {
  timestamp: number;
  temp_aire: number;
  temp_aire2: number;
  temp_disipador: number;
  humedad: number;
  pid_salida: number;
  hum_dht?: number;
  temp_dht?: number;
}

export interface IncubadoraConEstado extends IncubadoraConfig {
  sensores?: SensorDataESP32;
  ultimaLectura?: number; // timestamp
  estadoConexion: EstadoConexionBLE;
  enLinea: boolean;
  errorConexion?: string;
  historial: LecturaHistorica[];
  avisoModoAutonomo?: boolean; // True cuando el ESP32 se desconectó y pasó a AUTO
}

export type FiltroEstado = 'TODAS' | 'ALERTA' | 'LOCKDOWN' | 'NORMAL';
