import {
  BLE_UUIDS,
  BleCompactSensorsPayload,
  SensorDataESP32,
  EstadoESP32,
  TipoAlerta,
  EstadoConexionBLE,
} from '../types/incubator';

// Declaraciones seguras para navegadores sin tipos Web Bluetooth en lib.dom
type BluetoothDeviceAny = any;

export const isWebBluetoothSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator && !!navigator.bluetooth;
};

// Mapa de códigos compactos a tipos de alerta
const CODIGOS_ALERTA_MAP: Record<string, TipoAlerta> = {
  TB: 'TEMP_BAJA',
  TA: 'TEMP_ALTA',
  HB: 'HUM_BAJA',
  HA: 'HUM_ALTA',
  SF: 'SENSOR_FALLA',
  SD: 'SOBRECALENTAMIENTO_DISIPADOR',
  NA: 'NIVEL_AGUA_BAJO',
  DS: 'DIVERGENCIA_SENSORES',
};

// Helper defensivo para garantizar números finitos con valor por defecto
function safeNum(val: any, fallback: number = 0): number {
  if (typeof val === 'number' && Number.isFinite(val)) {
    return val;
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/**
 * Convierte cualquier payload JSON (compacto o detallado) en SensorDataESP32
 * Totalmente blindado contra campos ausentes, nulos, undefined o NaN.
 */
export function deserializarBlePayload(rawJson: string): SensorDataESP32 {
  if (!rawJson || typeof rawJson !== 'string') {
    throw new Error('Payload JSON vacío o inválido');
  }

  const p: Partial<BleCompactSensorsPayload & Record<string, any>> = JSON.parse(rawJson.trim());

  // Estado del ESP32
  let estado: EstadoESP32 = 'REGULANDO';
  const stt = p.stt || (p.estado as string) || '';
  if (stt === 'CAL' || stt === 'CALENTANDO') estado = 'CALENTANDO';
  else if (stt === 'VOL' || stt === 'VOLTEANDO') estado = 'VOLTEANDO';
  else if (stt === 'ALM' || stt === 'ALARMA') estado = 'ALARMA';
  else if (stt === 'REG' || stt === 'REGULANDO') estado = 'REGULANDO';

  // Alertas
  const alertas: TipoAlerta[] = [];
  const rawAlertas = p.al || p.alertas;
  if (Array.isArray(rawAlertas)) {
    rawAlertas.forEach((c) => {
      if (typeof c === 'string') {
        const mapeada = CODIGOS_ALERTA_MAP[c] || (c as TipoAlerta);
        if (mapeada && !alertas.includes(mapeada)) alertas.push(mapeada);
      }
    });
  }

  // Temperaturas y lecturas numéricas
  const tempAire = safeNum(p.ta ?? p.temp_aire, 37.8);
  const tempAire2 = safeNum(p.ta2 ?? p.temp_aire2, tempAire);
  const tempDisipador = safeNum(p.td ?? p.temp_disipador, 35.0);
  const humedad = safeNum(p.h ?? p.humedad, 45.0);
  const setpointTemp = safeNum(p.st ?? p.setpoint_temp, 37.8);
  const setpointHum = safeNum(p.sh ?? p.setpoint_hum, 45.0);
  const uptime = Math.max(0, Math.round(safeNum(p.up ?? p.uptime_s, 0)));
  const diaIncubacion = Math.max(1, Math.round(safeNum(p.d ?? p.dia_incubacion, 1)));
  const diasTotales = Math.max(1, Math.round(safeNum(p.dt ?? p.dias_totales, 21)));
  const segVolteo = Math.max(0, Math.round(safeNum(p.sv ?? p.segundos_proximo_volteo, 0)));
  const rawPid = typeof p.pid === 'object' && p.pid !== null ? (p.pid as any).salida : p.pid;
  const pidSalida = Math.min(100, Math.max(0, safeNum(rawPid, 0)));

  // Detección automática de divergencia si no vino codificada
  if (Math.abs(tempAire - tempAire2) > 1.5 && !alertas.includes('DIVERGENCIA_SENSORES')) {
    alertas.push('DIVERGENCIA_SENSORES');
  }

  const rawPresion = p.pr ?? p.presion;
  const presion = safeNum(rawPresion, 1013.2);

  // Actuadores
  const rawOut = p.out || p.salidas || {};
  const salidas = {
    ptc: Boolean(rawOut.p ?? rawOut.ptc),
    ventilador: Math.min(100, Math.max(0, safeNum(rawOut.f ?? rawOut.ventilador, 0))),
    humidificador: Boolean(rawOut.h ?? rawOut.humidificador),
    motor: Boolean(rawOut.m ?? rawOut.motor),
  };

  // Sensores y modo manual opcionales
  const manual = p.mn !== undefined ? {
    ptc: !!(p.mn & 1),
    ventilador: !!(p.mn & 2),
    humidificador: !!(p.mn & 4),
  } : undefined;

  const sensores_ok = p.sr !== undefined ? {
    aht: !!(p.sr & 1),
    bmp: !!(p.sr & 2),
    dht: !!(p.sr & 4),
    ds: !!(p.sr & 8),
  } : undefined;

  return {
    id: p.id || 'ESP32-BLE',
    uptime_s: uptime,
    temp_aire: Number(tempAire.toFixed(2)),
    temp_aire2: Number(tempAire2.toFixed(2)),
    temp_disipador: Number(tempDisipador.toFixed(1)),
    humedad: Number(humedad.toFixed(1)),
    presion: Number(presion.toFixed(1)),
    setpoint_temp: Number(setpointTemp.toFixed(1)),
    setpoint_hum: Number(setpointHum.toFixed(1)),
    salidas,
    estado,
    pid: {
      kp: 35.0,
      ki: 0.8,
      kd: 15.0,
      salida: pidSalida,
    },
    dia_incubacion: diaIncubacion,
    dias_totales: diasTotales,
    segundos_proximo_volteo: segVolteo,
    alertas,
    temp_dht: p.t3 !== undefined || p.temp_dht !== undefined ? safeNum(p.t3 ?? p.temp_dht) : undefined,
    hum_dht: p.h3 !== undefined || p.hum_dht !== undefined ? safeNum(p.h3 ?? p.hum_dht) : undefined,
    manual,
    sensores_ok,
  };
}

interface ConexionActiva {
  device: BluetoothDeviceAny;
  server?: any;
  charSensors?: any;
  charCommand?: any;
  reintentos: number;
  desconectadoManualmente: boolean;
  timerReconexion?: any;
  onDisconnectedHandler?: (event: Event) => void;
  onNotificationHandler?: (event: any) => void;
  textDecoder?: TextDecoder;
}

interface ReassemblyBuffer {
  data: string;
  lastChunkTime: number;
}

// Gestor de conexiones BLE en memoria de alta resiliencia
class BleConnectionManager {
  private conexiones = new Map<string, ConexionActiva>();
  private rxBuffers = new Map<string, ReassemblyBuffer>();
  private writeQueues = new Map<string, Promise<void>>();
  private onDataCallback?: (incubadoraId: string, sensores: SensorDataESP32) => void;
  private onStatusChangeCallback?: (incubadoraId: string, estado: EstadoConexionBLE, mensaje?: string) => void;

  setCallbacks(
    onData: (incubadoraId: string, sensores: SensorDataESP32) => void,
    onStatus: (incubadoraId: string, estado: EstadoConexionBLE, mensaje?: string) => void
  ) {
    this.onDataCallback = onData;
    this.onStatusChangeCallback = onStatus;
  }

  // Emparejar nuevo dispositivo mediante el diálogo nativo del navegador
  async solicitarDispositivo(
    nombreSugerido?: string,
    verTodos: boolean = false
  ): Promise<{ deviceId: string; deviceName: string; bluetoothDevice: any }> {
    if (!isWebBluetoothSupported()) {
      throw new Error(
        'Tu navegador actual no admite Web Bluetooth API. En iOS utiliza Bluefy o WebBLE; en Android, Windows, Mac o Linux usa Chrome o Edge.'
      );
    }

    try {
      const options: any = verTodos
        ? {
            acceptAllDevices: true,
            optionalServices: [BLE_UUIDS.SERVICE],
          }
        : {
            filters: [
              { services: [BLE_UUIDS.SERVICE] },
              { namePrefix: 'incuNOVA' },
              { namePrefix: 'IncuNOVA' },
              { namePrefix: 'Incubanova' },
              { namePrefix: 'IncubaESP' },
              { namePrefix: 'Incuba' },
              { namePrefix: 'ESP32' },
            ],
            optionalServices: [BLE_UUIDS.SERVICE],
          };

      const device = await (navigator as any).bluetooth.requestDevice(options);

      return {
        deviceId: device.id,
        deviceName: device.name || nombreSugerido || 'incuNOVA ESP32 BLE',
        bluetoothDevice: device,
      };
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error('Cancelado por el usuario o no se encontró ninguna incubadora cercana con BLE activo.');
      }
      throw err;
    }
  }

  // Intentar obtener un dispositivo previamente autorizado en el navegador
  async obtenerDispositivoAutorizado(deviceId?: string): Promise<any | null> {
    if (typeof navigator !== 'undefined' && (navigator as any).bluetooth?.getDevices && deviceId) {
      try {
        const devices = await (navigator as any).bluetooth.getDevices();
        const found = devices.find((d: any) => d.id === deviceId);
        if (found) return found;
      } catch (e) {
        console.warn('[BLE] Error consultando getDevices():', e);
      }
    }
    return null;
  }

  /**
   * Procesa fragmentos o tramas completas recibidas por BLE.
  /**
   * Procesa fragmentos o tramas completas recibidas por BLE.
   * Maneja delimitación por streaming, llaves dentro de strings/escapes, múltiples JSONs
   * en una sola trama, protección contra desbordamiento (> 1024 bytes) y timeout (> 2000 ms).
   */
  public procesarFragmentoBLE(incubadoraId: string, chunkTexto: string): void {
    const AHORA = Date.now();
    let rx = this.rxBuffers.get(incubadoraId);

    if (!rx) {
      rx = { data: '', lastChunkTime: AHORA };
      this.rxBuffers.set(incubadoraId, rx);
    }

    // Timeout de reensamblado: si pasaron más de 2000 ms entre fragmentos, purgar datos incompletos
    if (AHORA - rx.lastChunkTime > 2000) {
      rx.data = '';
    }
    rx.lastChunkTime = AHORA;

    rx.data += chunkTexto;

    // Protección estricta contra desbordamiento de memoria (máx 1024 bytes)
    if (rx.data.length > 1024) {
      console.warn(`[BLE] Búfer de reensamblado excedido (${rx.data.length}B) para ${incubadoraId}. Purgando.`);
      rx.data = '';
      return;
    }

    // Extraer en bucle todos los JSONs válidos presentes en el búfer acumulado
    while (true) {
      const inicio = rx.data.indexOf('{');
      if (inicio === -1) {
        // No hay inicio de JSON, descartar cualquier residuo
        rx.data = '';
        break;
      }

      // Si hay basura antes del primer '{', descartarla
      if (inicio > 0) {
        rx.data = rx.data.substring(inicio);
      }

      // Analizar balance de llaves ignorando llaves dentro de cadenas de texto y caracteres escapados
      let nivel = 0;
      let inString = false;
      let escape = false;
      let fin = -1;

      for (let i = 0; i < rx.data.length; i++) {
        const char = rx.data[i];

        if (escape) {
          escape = false;
          continue;
        }

        if (char === '\\' && inString) {
          escape = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '{') {
            nivel++;
          } else if (char === '}') {
            nivel--;
            if (nivel === 0) {
              fin = i;
              break;
            }
          }
        }
      }

      // Si no se ha completado el JSON, esperar más fragmentos
      if (fin === -1) {
        break;
      }

      // Extraer y procesar el JSON completo detectado
      const jsonCompleto = rx.data.substring(0, fin + 1);
      rx.data = rx.data.substring(fin + 1); // Mantener el resto para la siguiente iteración

      try {
        const sensores = deserializarBlePayload(jsonCompleto);
        this.onDataCallback?.(incubadoraId, sensores);
      } catch (err) {
        console.warn('[BLE] Error deserializando JSON reensamblado:', err);
      }
    }
  }

  // Conectar a GATT y suscribirse a notificaciones
  async conectarIncubadora(incubadoraId: string, deviceInstance?: any, deviceIdGuardado?: string): Promise<void> {
    let conn = this.conexiones.get(incubadoraId);

    if (!conn && !deviceInstance && deviceIdGuardado) {
      const recovered = await this.obtenerDispositivoAutorizado(deviceIdGuardado);
      if (recovered) {
        deviceInstance = recovered;
      }
    }

    if (!conn && deviceInstance) {
      conn = {
        device: deviceInstance,
        reintentos: 0,
        desconectadoManualmente: false,
      };
      this.conexiones.set(incubadoraId, conn);
    }

    if (!conn || !conn.device) {
      throw new Error('No hay dispositivo Bluetooth emparejado para esta incubadora.');
    }

    conn.desconectadoManualmente = false;
    this.onStatusChangeCallback?.(incubadoraId, 'conectando');

    try {
      // Limpiar listeners previos para evitar duplicación
      if (conn.onDisconnectedHandler) {
        conn.device.removeEventListener('gattserverdisconnected', conn.onDisconnectedHandler);
      }

      conn.onDisconnectedHandler = () => {
        this.manejarDesconexion(incubadoraId);
      };
      conn.device.addEventListener('gattserverdisconnected', conn.onDisconnectedHandler);

      const server = await conn.device.gatt.connect();
      conn.server = server;

      const service = await server.getPrimaryService(BLE_UUIDS.SERVICE);
      const charSensors = await service.getCharacteristic(BLE_UUIDS.CHAR_SENSORES);
      const charCommand = await service.getCharacteristic(BLE_UUIDS.CHAR_COMANDO);

      conn.charSensors = charSensors;
      conn.charCommand = charCommand;

      // Inicializar decodificador UTF-8 con preservación de caracteres en streaming
      conn.textDecoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });

      // Iniciar notificaciones de sensores BLE con reensamblador streaming
      await charSensors.startNotifications();

      conn.onNotificationHandler = (event: any) => {
        try {
          const value: DataView = event.target.value;
          const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
          const chunkTexto = conn?.textDecoder
            ? conn.textDecoder.decode(bytes, { stream: true })
            : new TextDecoder('utf-8').decode(bytes);
          this.procesarFragmentoBLE(incubadoraId, chunkTexto);
        } catch (e) {
          console.warn('[BLE] Error decodificando notificación compacta:', e);
        }
      };

      charSensors.addEventListener('characteristicvaluechanged', conn.onNotificationHandler);

      conn.reintentos = 0;
      this.onStatusChangeCallback?.(incubadoraId, 'conectado');
    } catch (err: any) {
      console.warn(`[BLE] Error conectando a ${incubadoraId}:`, err);
      this.manejarDesconexion(incubadoraId);
      throw err;
    }
  }

  // Manejo de desconexión y reintentos espaciados
  private manejarDesconexion(incubadoraId: string) {
    const conn = this.conexiones.get(incubadoraId);
    if (!conn) return;

    // Limpiar buffers temporales de recepción y purgar cola FIFO de comandos pendientes
    this.rxBuffers.delete(incubadoraId);
    this.writeQueues.delete(incubadoraId);

    if (conn.desconectadoManualmente) {
      this.onStatusChangeCallback?.(incubadoraId, 'desconectado');
      return;
    }

    // El ESP32 detectó la desconexión y pasó a modo autónomo AUTO
    this.onStatusChangeCallback?.(
      incubadoraId,
      'desconectado',
      'El ESP32 ha detectado la desconexión BLE y ha entrado automáticamente en modo autónomo (AUTO) de seguridad.'
    );

    // Reintentos espaciados con retroceso exponencial (3s, 6s, 9s, 12s, 15s)
    if (conn.reintentos < 5) {
      conn.reintentos++;
      const delay = Math.min(15000, conn.reintentos * 3000);

      this.onStatusChangeCallback?.(
        incubadoraId,
        'reconectando',
        `Reintentando reconexión BLE en ${delay / 1000}s (Intento ${conn.reintentos}/5)...`
      );

      clearTimeout(conn.timerReconexion);
      conn.timerReconexion = setTimeout(() => {
        this.conectarIncubadora(incubadoraId).catch(() => {});
      }, delay);
    } else {
      this.onStatusChangeCallback?.(
        incubadoraId,
        'desconectado',
        'Se superaron los reintentos automáticos. Pulsa Conectar para reintentar manualmente.'
      );
    }
  }

  /**
   * Enviar comando por BLE con cola FIFO secuencial, timeout de 5000 ms y validación estricta de tamaño.
   * Previene de raíz la excepción DOMException: GATT operation already in progress y rechazos silenciosos.
   */
  async enviarComando(incubadoraId: string, comando: Record<string, any>): Promise<void> {
    const conn = this.conexiones.get(incubadoraId);
    if (!conn || !conn.charCommand) {
      throw new Error('La incubadora no está conectada por Bluetooth.');
    }

    // Validación y saneamiento del payload saliente
    const sanitized: Record<string, any> = {};
    for (const [k, v] of Object.entries(comando)) {
      if (typeof v === 'number') {
        if (!Number.isFinite(v)) {
          throw new Error(`Parámetro numérico inválido en comando (${k}: ${v})`);
        }
        sanitized[k] = v;
      } else if (typeof v === 'string' || typeof v === 'boolean') {
        sanitized[k] = v;
      }
    }

    const payload = JSON.stringify(sanitized);
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    // Validación estricta de tamaño máximo admitido por la característica BLE (máx 180 bytes)
    if (data.byteLength > 180) {
      throw new Error(`Comando demasiado grande (${data.byteLength}B > 180B). Rechazado por seguridad.`);
    }

    // Encadenar en la cola de escritura FIFO de la incubadora
    const colaPrevia = this.writeQueues.get(incubadoraId) || Promise.resolve();

    const siguienteEscritura = colaPrevia
      .catch(() => {}) // No romper la cadena si una operación anterior fue rechazada
      .then(async () => {
        // Verificar conexión activa antes de ejecutar la escritura diferida
        const conexionActual = this.conexiones.get(incubadoraId);
        if (!conexionActual || !conexionActual.charCommand) {
          throw new Error('Operación abortada: Conexión BLE no disponible.');
        }

        // Timeout de seguridad de 5000ms para evitar que la cola quede congelada indefinidamente
        let timeoutId: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Timeout en operación GATT de escritura (5000 ms)')), 5000);
        });

        const writePromise = (async () => {
          try {
            if (conexionActual.charCommand.writeValueWithResponse) {
              await conexionActual.charCommand.writeValueWithResponse(data);
            } else {
              await conexionActual.charCommand.writeValue(data);
            }
          } finally {
            clearTimeout(timeoutId);
          }
        })();

        await Promise.race([writePromise, timeoutPromise]);
      });

    this.writeQueues.set(incubadoraId, siguienteEscritura);
    await siguienteEscritura;
  }

  // Desconectar voluntariamente
  desconectar(incubadoraId: string) {
    const conn = this.conexiones.get(incubadoraId);
    if (conn) {
      conn.desconectadoManualmente = true;
      clearTimeout(conn.timerReconexion);

      // Limpiar listeners
      if (conn.onDisconnectedHandler && conn.device) {
        conn.device.removeEventListener('gattserverdisconnected', conn.onDisconnectedHandler);
      }
      if (conn.onNotificationHandler && conn.charSensors) {
        conn.charSensors.removeEventListener('characteristicvaluechanged', conn.onNotificationHandler);
      }

      if (conn.server && conn.server.connected) {
        conn.server.disconnect();
      }
      this.conexiones.delete(incubadoraId);
      this.rxBuffers.delete(incubadoraId);
      this.writeQueues.delete(incubadoraId);
      this.onStatusChangeCallback?.(incubadoraId, 'desconectado');
    }
  }

  estaConectado(incubadoraId: string): boolean {
    const conn = this.conexiones.get(incubadoraId);
    return !!(conn && conn.server && conn.server.connected);
  }

  tieneDispositivoEnMemoria(incubadoraId: string): boolean {
    const conn = this.conexiones.get(incubadoraId);
    return !!(conn && conn.device);
  }

  // Sincronizar parámetros térmicos y de tiempo con el ESP32
  async sincronizarParametros(
    incubadoraId: string,
    params: {
      st: number;
      sh: number;
      dt: number;
      dl: number;
      hl: number;
      iv: number;
    }
  ): Promise<void> {
    // Validar rangos físicos permitidos
    const st = Math.min(39.0, Math.max(30.0, safeNum(params.st, 37.8)));
    const sh = Math.min(90.0, Math.max(20.0, safeNum(params.sh, 45.0)));
    const dt = Math.min(99, Math.max(1, Math.round(safeNum(params.dt, 21))));
    const dl = Math.min(dt, Math.max(0, Math.round(safeNum(params.dl, 18))));
    const hl = Math.min(95.0, Math.max(20.0, safeNum(params.hl, 65.0)));
    const iv = Math.min(1440, Math.max(1, Math.round(safeNum(params.iv, 120))));

    await this.enviarComando(incubadoraId, {
      st: Number(st.toFixed(1)),
      sh: Number(sh.toFixed(1)),
      dt,
      dl,
      hl: Number(hl.toFixed(1)),
      iv,
    });
  }

  // Fijar día actual en el ESP32
  async fijarDia(incubadoraId: string, dia: number): Promise<void> {
    const d = Math.min(99, Math.max(1, Math.round(safeNum(dia, 1))));
    await this.enviarComando(incubadoraId, { cmd: 'dia', v: d });
  }

  // Reiniciar contador de días a día 1
  async reiniciarDias(incubadoraId: string): Promise<void> {
    await this.enviarComando(incubadoraId, { cmd: 'reset_dias' });
  }

  // Solicitar volteo manual de bandeja ahora
  async solicitarGiro(incubadoraId: string): Promise<void> {
    await this.enviarComando(incubadoraId, { cmd: 'girar' });
  }

  // Volver a modo totalmente automático
  async ponerTodoAuto(incubadoraId: string): Promise<void> {
    await this.enviarComando(incubadoraId, { cmd: 'auto' });
  }

  // Control manual individual de actuadores
  async cambiarActuador(
    incubadoraId: string,
    act: 'ptc' | 'fan' | 'hum',
    valor: number
  ): Promise<void> {
    const v = safeNum(valor, -1);
    await this.enviarComando(incubadoraId, { act, v });
  }
}

export const bleManager = new BleConnectionManager();
