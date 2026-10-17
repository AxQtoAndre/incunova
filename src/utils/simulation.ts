import {
  IncubadoraConfig,
  SensorDataESP32,
  LecturaHistorica,
  TipoAlerta,
  EstadoESP32,
} from '../types/incubator';
import { getPerfilesStorage } from './storage';

// Estado mutable de simulación por incubadora para continuidad temporal suave
interface EstadoSimulacionInterno {
  tempBase: number;
  humBase: number;
  segundosProximoVolteo: number;
  ultimoGiroTimestamp: number;
  faseOscilacion: number;
  alertaForzada?: TipoAlerta;
}

const estadosSimulacion = new Map<string, EstadoSimulacionInterno>();

export function generarHistorialInicial(
  config: IncubadoraConfig,
  setpointTemp: number,
  setpointHum: number
): LecturaHistorica[] {
  const puntos: LecturaHistorica[] = [];
  const ahora = Date.now();
  const PUNTOS = 24; // 24 horas simuladas (un punto por hora)
  const PASO_MS = 3600 * 1000;

  for (let i = PUNTOS; i >= 0; i--) {
    const t = ahora - i * PASO_MS;
    // Variación senoidal suave que simula ciclos día/noche y control PID
    const ondaLenta = Math.sin((i / PUNTOS) * Math.PI * 4);
    const ruido = (Math.random() - 0.5) * 0.12;

    const tempAire = Number((setpointTemp + ondaLenta * 0.1 + ruido).toFixed(2));
    const tempAire2 = Number((tempAire - 0.05 + (Math.random() - 0.5) * 0.08).toFixed(2));
    const tempDisipador = Number((43 + ondaLenta * 3.5 + Math.random() * 2).toFixed(1));
    const humedad = Number((setpointHum + ondaLenta * 1.8 + (Math.random() - 0.5) * 1.2).toFixed(1));
    const pidSalida = Math.max(10, Math.min(95, Math.round(55 + ondaLenta * 25 + (Math.random() - 0.5) * 10)));

    const humDht = Number((humedad - 0.5 + (Math.random() - 0.5) * 1.5).toFixed(1));
    const tempDht = Number((tempAire + 0.1 + (Math.random() - 0.5) * 0.1).toFixed(2));

    puntos.push({
      timestamp: t,
      temp_aire: tempAire,
      temp_aire2: tempAire2,
      temp_disipador: tempDisipador,
      humedad: humedad,
      hum_dht: humDht,
      temp_dht: tempDht,
      pid_salida: pidSalida,
    });
  }

  return puntos;
}

export function simularLecturaESP32(config: IncubadoraConfig): SensorDataESP32 {
  const perfiles = getPerfilesStorage();
  const perfil = perfiles.find((p) => p.id === config.perfilId) || perfiles[0];

  let sim = estadosSimulacion.get(config.id);
  if (!sim) {
    sim = {
      tempBase: perfil.temperatura,
      humBase: perfil.humedadNormal,
      segundosProximoVolteo: (config.intervaloVolteoMinutos || 120) * 60,
      ultimoGiroTimestamp: Date.now(),
      faseOscilacion: Math.random() * 10,
    };
    estadosSimulacion.set(config.id, sim);
  }

  // Calcular días transcurridos
  const diffMs = Date.now() - new Date(config.fechaInicio).getTime();
  const diasTranscurridos = Math.max(1, Math.min(perfil.diasTotales, Math.floor(diffMs / (24 * 3600 * 1000)) + 1));
  const esLockdown = diasTranscurridos >= perfil.diaLockdown;

  const targetTemp = esLockdown ? perfil.temperatura - 0.2 : perfil.temperatura;
  const targetHum = esLockdown ? perfil.humedadLockdown : perfil.humedadNormal;

  // Actualizar oscilaciones
  sim.faseOscilacion += 0.3;
  const onda = Math.sin(sim.faseOscilacion) * 0.09;
  const ruido = (Math.random() - 0.5) * 0.06;

  let tempAire = Number((targetTemp + onda + ruido).toFixed(2));
  let tempAire2 = Number((tempAire - 0.04 + (Math.random() - 0.5) * 0.06).toFixed(2));
  let tempDisipador = Number((44.5 + Math.sin(sim.faseOscilacion * 0.7) * 4.2).toFixed(1));
  let humedad = Number((targetHum + Math.cos(sim.faseOscilacion * 0.5) * 1.5 + (Math.random() - 0.5)).toFixed(1));
  let pidSalida = Math.max(5, Math.min(95, Math.round(50 + onda * 150 + (Math.random() - 0.5) * 8)));

  // Countdown de volteo
  if (esLockdown) {
    sim.segundosProximoVolteo = 0;
  } else {
    sim.segundosProximoVolteo = Math.max(0, sim.segundosProximoVolteo - 5);
    if (sim.segundosProximoVolteo <= 0) {
      sim.segundosProximoVolteo = (config.intervaloVolteoMinutos || 120) * 60;
    }
  }

  // Alertas
  const alertas: TipoAlerta[] = [];

  // Alerta de demostración o forzada
  if (sim.alertaForzada) {
    alertas.push(sim.alertaForzada);
  } else {
    if (tempAire < targetTemp - 0.6) alertas.push('TEMP_BAJA');
    if (tempAire > targetTemp + 0.6) alertas.push('TEMP_ALTA');
    if (humedad < targetHum - 8) alertas.push('HUM_BAJA');
    if (humedad > targetHum + 12) alertas.push('HUM_ALTA');
  }

  // Estado ESP32
  let estado: EstadoESP32 = 'REGULANDO';
  if (alertas.length > 0) {
    estado = 'ALARMA';
  } else if (sim.segundosProximoVolteo < 15 && !esLockdown) {
    estado = 'VOLTEANDO';
  } else if (Math.abs(tempAire - targetTemp) > 0.5) {
    estado = 'CALENTANDO';
  }

  return {
    id: `ESP32-${config.id.toUpperCase()}`,
    uptime_s: Math.floor(diffMs / 1000),
    temp_aire: tempAire,
    temp_aire2: tempAire2,
    temp_disipador: tempDisipador,
    humedad: humedad,
    temp_dht: Number((tempAire + 0.1 + (Math.random() - 0.5) * 0.08).toFixed(2)),
    hum_dht: Number((humedad - 0.5 + (Math.random() - 0.5) * 1.2).toFixed(1)),
    presion: 1013.2,
    sensores_ok: { aht: true, bmp: true, dht: true, ds: true },
    setpoint_temp: targetTemp,
    setpoint_hum: targetHum,
    salidas: {
      ptc: pidSalida > 15,
      ventilador: 75,
      humidificador: humedad < targetHum,
      motor: estado === 'VOLTEANDO',
    },
    estado: estado,
    pid: {
      kp: 35.0,
      ki: 0.8,
      kd: 15.0,
      salida: pidSalida,
    },
    dia_incubacion: diasTranscurridos,
    dias_totales: perfil.diasTotales,
    segundos_proximo_volteo: sim.segundosProximoVolteo,
    alertas: alertas,
  };
}

export function reiniciarVolteoSimulado(configId: string, minutos: number): void {
  const sim = estadosSimulacion.get(configId);
  if (sim) {
    sim.segundosProximoVolteo = (minutos || 120) * 60;
  }
}

export function alternarAlertaSimulada(configId: string, tipo?: TipoAlerta): void {
  let sim = estadosSimulacion.get(configId);
  if (!sim) {
    sim = {
      tempBase: 37.8,
      humBase: 50,
      segundosProximoVolteo: 3600,
      ultimoGiroTimestamp: Date.now(),
      faseOscilacion: 0,
    };
    estadosSimulacion.set(configId, sim);
  }
  sim.alertaForzada = sim.alertaForzada ? undefined : (tipo || 'TEMP_ALTA');
}
