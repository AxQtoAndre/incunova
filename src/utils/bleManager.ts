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

// Convierte el payload compacto BLE (<180 bytes) en SensorDataESP32
export function deserializarBlePayload(rawJson: string): SensorDataESP32 {
  const p: BleCompactSensorsPayload = JSON.parse(rawJson);

  let estado: EstadoESP32 = 'REGULANDO';
  if (p.stt === 'CAL') estado = 'CALENTANDO';
  else if (p.stt === 'VOL') estado = 'VOLTEANDO';
  else if (p.stt === 'ALM') estado = 'ALARMA';

  const alertas: TipoAlerta[] = [];
  if (Array.isArray(p.al)) {
    p.al.forEach((c) => {
      const mapeada = CODIGOS_ALERTA_MAP[c];
      if (mapeada) alertas.push(mapeada);
    });
  }

  // Detección automática de divergencia si no vino codificada
  if (Math.abs(p.ta - p.ta2) > 1.5 && !alertas.includes('DIVERGENCIA_SENSORES')) {
    alertas.push('DIVERGENCIA_SENSORES');
  }

  const presion = (p.pr !== undefined && p.pr > 0) ? Number(p.pr.toFixed(1)) : 1013.2;

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
    uptime_s: p.up,
    temp_aire: Number(p.ta.toFixed(2)),
    temp_aire2: Number(p.ta2.toFixed(2)),
    temp_disipador: Number(p.td.toFixed(1)),
    humedad: Number(p.h.toFixed(1)),
    presion,
    setpoint_temp: p.st,
    setpoint_hum: p.sh,
    salidas: {
      ptc: !!p.out.p,
      ventilador: p.out.f,
      humidificador: !!p.out.h,
      motor: !!p.out.m,
    },
    estado,
    pid: {
      kp: 35.0,
      ki: 0.8,
      kd: 15.0,
      salida: p.pid,
    },
    dia_incubacion: p.d,
    dias_totales: p.dt,
    segundos_proximo_volteo: p.sv,
    alertas,
    temp_dht: p.t3 !== undefined ? Number(p.t3.toFixed(1)) : undefined,
    hum_dht: p.h3 !== undefined ? Number(p.h3.toFixed(1)) : undefined,
    manual,
    sensores_ok,
  };
}

interface ConexionActiva {
  device: any; // BluetoothDevice
  server?: any; // BluetoothRemoteGATTServer
  charSensors?: any; // BluetoothRemoteGATTCharacteristic
  charCommand?: any; // BluetoothRemoteGATTCharacteristic
  reintentos: number;
  desconectadoManualmente: boolean;
  timerReconexion?: any;
}

// Gestor de conexiones BLE en memoria
class BleConnectionManager {
  private conexiones = new Map<string, ConexionActiva>();
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
        'Tu navegador actual no admite Web Bluetooth API. En iPhone/iPad utiliza navegadores con soporte BLE como Bluefy o WebBLE, o Chrome/Edge en Android, Windows, Mac o Linux.'
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
        deviceName: device.name || nombreSugerido || 'Incubadora ESP32 BLE',
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
      // Escuchar desconexión
      conn.device.addEventListener('gattserverdisconnected', () => {
        this.manejarDesconexion(incubadoraId);
      });

      const server = await conn.device.gatt.connect();
      conn.server = server;

      const service = await server.getPrimaryService(BLE_UUIDS.SERVICE);
      const charSensors = await service.getCharacteristic(BLE_UUIDS.CHAR_SENSORES);
      const charCommand = await service.getCharacteristic(BLE_UUIDS.CHAR_COMANDO);

      conn.charSensors = charSensors;
      conn.charCommand = charCommand;

      // Iniciar notificaciones de sensores BLE
      await charSensors.startNotifications();
      charSensors.addEventListener('characteristicvaluechanged', (event: any) => {
        try {
          const value: DataView = event.target.value;
          const decoder = new TextDecoder('utf-8');
          const rawJson = decoder.decode(value);
          const sensores = deserializarBlePayload(rawJson);
          this.onDataCallback?.(incubadoraId, sensores);
        } catch (e) {
          console.warn('[BLE] Error decodificando notificación compacta:', e);
        }
      });

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

    // Reintentos espaciados (backoff exponencial controlado: 2s, 5s, 10s)
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

  // Enviar comando compacto por BLE (<180 bytes)
  async enviarComando(incubadoraId: string, comando: Record<string, any>): Promise<void> {
    const conn = this.conexiones.get(incubadoraId);
    if (!conn || !conn.charCommand) {
      throw new Error('La incubadora no está conectada por Bluetooth.');
    }

    const payload = JSON.stringify(comando);
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    if (data.byteLength > 180) {
      console.warn(`[BLE] Aviso: El comando supera 180 bytes (${data.byteLength}B).`);
    }

    if (conn.charCommand.writeValueWithResponse) {
      await conn.charCommand.writeValueWithResponse(data);
    } else {
      await conn.charCommand.writeValue(data);
    }
  }

  // Desconectar voluntariamente
  desconectar(incubadoraId: string) {
    const conn = this.conexiones.get(incubadoraId);
    if (conn) {
      conn.desconectadoManualmente = true;
      clearTimeout(conn.timerReconexion);
      if (conn.server && conn.server.connected) {
        conn.server.disconnect();
      }
      this.conexiones.delete(incubadoraId);
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
    await this.enviarComando(incubadoraId, {
      st: Number(params.st.toFixed(1)),
      sh: Number(params.sh.toFixed(1)),
      dt: Math.round(params.dt),
      dl: Math.round(params.dl),
      hl: Number(params.hl.toFixed(1)),
      iv: Math.round(params.iv),
    });
  }

  // Fijar día actual en el ESP32
  async fijarDia(incubadoraId: string, dia: number): Promise<void> {
    await this.enviarComando(incubadoraId, { cmd: 'dia', v: dia });
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
    await this.enviarComando(incubadoraId, { act, v: valor });
  }
}

export const bleManager = new BleConnectionManager();

