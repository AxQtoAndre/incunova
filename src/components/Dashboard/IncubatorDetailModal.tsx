import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Thermometer,
  Droplets,
  Cpu,
  Fan,
  Flame,
  RotateCw,
  Waves,
  ShieldAlert,
  Activity,
  Layers,
  Clock,
  Code,
  Gauge,
  Sliders,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { IncubadoraConEstado, PerfilEspecie } from '../../types/incubator';

import { Bluetooth, RefreshCw, Send, Check } from 'lucide-react';

interface Props {
  incubadora: IncubadoraConEstado;
  perfil?: PerfilEspecie;
  onClose: () => void;
  onGirarAhora: () => Promise<void>;
  onActuador: (act: 'ptc' | 'fan' | 'hum' | 'auto', v: number) => Promise<void>;
  onSincronizarParametros?: () => Promise<void>;
  onFijarDia?: (dia: number) => Promise<void>;
  onResetDias?: () => Promise<void>;
  onConectarBle?: () => Promise<void>;
}

export const IncubatorDetailModal: React.FC<Props> = ({
  incubadora,
  perfil,
  onClose,
  onGirarAhora,
  onActuador,
  onSincronizarParametros,
  onFijarDia,
  onResetDias,
  onConectarBle,
}) => {
  const [tabGrafica, setTabGrafica] = useState<'TEMP' | 'HUM' | 'DISIPADOR' | 'PID'>('TEMP');
  const [mostrarJSON, setMostrarJSON] = useState(false);
  const [girando, setGirando] = useState(false);
  const [sensorTooltipActivo, setSensorTooltipActivo] = useState<string | null>(null);
  const [reconectados, setReconectados] = useState<{ [sensorId: string]: boolean }>({});
  const prevSensoresOkRef = useRef<{ aht?: boolean; bmp?: boolean; dht?: boolean; ds?: boolean }>({});

  const { sensores, enLinea, historial } = incubadora;

  // Detectar transición de Fallido (false) a OK (true) para activar animación de pulso suave
  useEffect(() => {
    if (!sensores?.sensores_ok) return;
    const current = sensores.sensores_ok;
    const prev = prevSensoresOkRef.current;

    const sensorKeys: Array<{ key: 'aht' | 'bmp' | 'dht' | 'ds'; id: string }> = [
      { key: 'aht', id: 'aht' },
      { key: 'bmp', id: 'bmp' },
      { key: 'dht', id: 'dht' },
      { key: 'ds', id: 'ds' },
    ];

    sensorKeys.forEach(({ key, id }) => {
      if (prev[key] === false && current[key] === true) {
        setReconectados((r) => ({ ...r, [id]: true }));
        setTimeout(() => {
          setReconectados((r) => ({ ...r, [id]: false }));
        }, 3500);
      }
    });

    prevSensoresOkRef.current = { ...current };
  }, [sensores?.sensores_ok]);

  const [sincronizando, setSincronizando] = useState(false);
  const [sincronizadoExito, setSincronizadoExito] = useState(false);
  const [editandoDia, setEditandoDia] = useState(false);
  const [inputDia, setInputDia] = useState<number>(sensores?.dia_incubacion || 1);

  const handleSincronizar = async () => {
    if (!onSincronizarParametros) return;
    try {
      setSincronizando(true);
      await onSincronizarParametros();
      setSincronizadoExito(true);
      setTimeout(() => setSincronizadoExito(false), 3000);
    } finally {
      setSincronizando(false);
    }
  };

  const handleGuardarDia = async () => {
    if (!onFijarDia) return;
    const diaNum = Math.max(1, Math.min(inputDia, sensores?.dias_totales || 99));
    await onFijarDia(diaNum);
    setEditandoDia(false);
  };

  const handleResetearDia = async () => {
    if (!onResetDias) return;
    if (confirm('¿Deseas reiniciar el contador de incubación al Día 1 en el ESP32?')) {
      await onResetDias();
      setInputDia(1);
    }
  };

  const handleGirar = async () => {
    try {
      setGirando(true);
      await onGirarAhora();
    } finally {
      setTimeout(() => setGirando(false), 2000);
    }
  };

  // Formatear datos para las gráficas Recharts (últimas 24h)
  const chartData = historial.map((h) => ({
    hora: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp_aire: h.temp_aire,
    temp_aire2: h.temp_aire2,
    temp_disipador: h.temp_disipador,
    humedad: h.humedad,
    hum_dht: h.hum_dht !== undefined ? h.hum_dht : sensores?.hum_dht,
    temp_dht: h.temp_dht !== undefined ? h.temp_dht : sensores?.temp_dht,
    pid_salida: h.pid_salida,
    setpoint_temp: sensores?.setpoint_temp ?? 37.8,
    setpoint_hum: sensores?.setpoint_hum ?? 50,
  }));

  const divergenciaSensores =
    sensores && Math.abs(sensores.temp_aire - sensores.temp_aire2) > 1.5;

  const getEstadoBadgeClass = (estado?: string) => {
    switch (estado) {
      case 'REGULANDO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'CALENTANDO':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'VOLTEANDO':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'ALARMA':
        return 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={() => setSensorTooltipActivo(null)}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-stone-900 shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-stone-900 dark:text-stone-100">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-[#FAF6F0] dark:bg-stone-850 dark:bg-stone-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{perfil?.icono || '🥚'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">{incubadora.nombre}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${getEstadoBadgeClass(
                    sensores?.estado
                  )}`}
                >
                  {sensores?.estado || 'DESCONECTADO'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                {incubadora.esSimulada
                  ? 'Modo: Simulación en memoria'
                  : `BLE Device: ${incubadora.deviceId?.slice(0, 10) || 'ESP32-GATT'} • Estado: ${incubadora.estadoConexion || (incubadora.enLinea ? 'conectado' : 'desconectado')}`}{' '}
                • Uptime:{' '}
                {sensores ? `${Math.floor(sensores.uptime_s / 3600)}h ${Math.floor((sensores.uptime_s % 3600) / 60)}m` : '0m'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Alerta de Divergencia Térmica (> 1.5°C) */}
          {divergenciaSensores && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Alerta de Verificación de Sensores:</strong> Se detectó una diferencia de{' '}
                <span className="font-bold font-mono">
                  {Math.abs(sensores.temp_aire - sensores.temp_aire2).toFixed(2)} °C
                </span>{' '}
                entre el sensor principal AHT20 ({sensores.temp_aire} °C) y el sensor redundante BMP280 en zona de huevos (
                {sensores.temp_aire2} °C). Compruebe la recirculación de aire del ventilador o posible descalibración física de sonda.
              </div>
            </div>
          )}

          {/* BARRA DE COMUNICACIÓN Y SINCRONIZACIÓN BLE */}
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-[#FFFDFB] dark:bg-stone-800/80 p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Bluetooth className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                    Sincronización con ESP32 (GATT BLE)
                  </h3>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Transfiere los valores ideales del perfil ({perfil?.temperatura}°C, {perfil?.humedadNormal}% HR, {perfil?.diasTotales} días) a la memoria EEPROM/Preferences del microcontrolador.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!enLinea && !incubadora.esSimulada && onConectarBle && (
                  <button
                    onClick={onConectarBle}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Bluetooth className="w-3.5 h-3.5" />
                    <span>Conectar BLE</span>
                  </button>
                )}

                <button
                  onClick={handleSincronizar}
                  disabled={!enLinea || sincronizando}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E05A36] hover:bg-[#C84724] disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? 'animate-spin' : ''}`} />
                  <span>{sincronizando ? 'Enviando...' : 'Sincronizar Perfil'}</span>
                </button>

                {!editandoDia ? (
                  <button
                    onClick={() => {
                      setInputDia(sensores?.dia_incubacion || 1);
                      setEditandoDia(true);
                    }}
                    disabled={!enLinea}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-700/80 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 text-stone-700 dark:text-stone-300 text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Clock className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                    <span>Día {sensores?.dia_incubacion || 1} (Ajustar)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-700 p-1 rounded-xl">
                    <span className="text-xs text-stone-600 dark:text-stone-300 font-bold pl-1.5">Día:</span>
                    <input
                      type="number"
                      min="1"
                      max={sensores?.dias_totales || 99}
                      value={inputDia}
                      onChange={(e) => setInputDia(parseInt(e.target.value, 10) || 1)}
                      className="w-14 px-2 py-0.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100 rounded font-bold font-mono"
                    />
                    <button
                      onClick={handleGuardarDia}
                      className="px-2 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition cursor-pointer"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setEditandoDia(false)}
                      className="px-1.5 py-0.5 text-stone-500 dark:text-stone-400 text-xs font-bold hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <button
                  onClick={handleResetearDia}
                  disabled={!enLinea}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-700/80 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-700 dark:hover:text-rose-300 disabled:opacity-50 text-stone-600 dark:text-stone-300 text-xs font-bold transition cursor-pointer disabled:cursor-not-allowed"
                  title="Reiniciar contador a Día 1"
                >
                  Reset a Día 1
                </button>
              </div>
            </div>

            {sincronizadoExito && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  ¡Parámetros de especie sincronizados correctamente en la memoria interna del ESP32!
                </span>
              </div>
            )}
          </div>

          {/* ESTADO EN VIVO DE LOS 4 ACTUADORES */}
          <div>
            <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#E05A36]" />
              Estado de los Actuadores en Vivo
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* PTC Calefactor */}
              <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-500" />
                    PTC Cerámico
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      sensores?.salidas.ptc ? 'bg-rose-500 animate-ping' : 'bg-stone-300 dark:bg-stone-600'
                    }`}
                  />
                </div>
                <div className="mt-2">
                  <div className="text-base font-bold text-stone-800 dark:text-stone-100">
                    {sensores?.salidas.ptc ? 'ENCENDIDO' : 'APAGADO'}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono mt-0.5">
                    PID Salida: {sensores?.pid.salida ?? 0}%
                  </div>
                </div>
              </div>

              {/* Ventilador PWM */}
              <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <Fan
                      className={`w-4 h-4 text-sky-500 ${
                        sensores?.salidas.ventilador ? 'animate-spin' : ''
                      }`}
                      style={{ animationDuration: '3s' }}
                    />
                    Ventilador
                  </span>
                  <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400">
                    {sensores?.salidas.ventilador ?? 0}% PWM
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-base font-bold text-stone-800 dark:text-stone-100">Circulación Activa</div>
                  <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${sensores?.salidas.ventilador ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Humidificador ultrasónico */}
              <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <Waves className="w-4 h-4 text-teal-500" />
                    Humidificador
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      sensores?.salidas.humidificador ? 'bg-teal-500 animate-pulse' : 'bg-stone-300 dark:bg-stone-600'
                    }`}
                  />
                </div>
                <div className="mt-2">
                  <div className="text-base font-bold text-stone-800 dark:text-stone-100">
                    {sensores?.salidas.humidificador ? 'ACTIVO (VAPOR)' : 'REPOSO'}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono mt-0.5">
                    Set: {sensores?.setpoint_hum ?? 50}% HR
                  </div>
                </div>
              </div>

              {/* Motor de Volteo */}
              <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <RotateCw
                      className={`w-4 h-4 text-amber-500 ${
                        sensores?.salidas.motor ? 'animate-spin' : ''
                      }`}
                    />
                    Motor Volteo
                  </span>
                  <button
                    onClick={handleGirar}
                    disabled={girando || !enLinea}
                    className="text-[10px] bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 rounded font-bold transition cursor-pointer"
                  >
                    Probar
                  </button>
                </div>
                <div className="mt-2">
                  <div className="text-base font-bold text-stone-800 dark:text-stone-100">
                    {sensores?.salidas.motor ? 'GIRANDO...' : 'REPOSO'}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono mt-0.5">
                    DRV8825 Pasos
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTROL MANUAL DE ACTUADORES */}
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#E05A36]" />
                <h3 className="text-sm sm:text-base font-bold text-stone-800 dark:text-stone-100">
                  Control Manual de Actuadores
                </h3>
              </div>
              <button
                onClick={() => onActuador('auto', -1)}
                disabled={!enLinea}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                Todo en AUTO
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tarjeta PTC */}
              <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-500" />
                    PTC Calefactor
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sensores?.manual?.ptc
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    }`}
                  >
                    {sensores?.manual?.ptc ? 'MANUAL' : 'AUTO'}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 mt-3">
                  <button
                    onClick={() => onActuador('ptc', 0)}
                    disabled={!enLinea}
                    className="px-1.5 py-1 text-[11px] font-bold rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 disabled:opacity-40 text-stone-700 dark:text-stone-300 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    OFF
                  </button>
                  <button
                    onClick={() => onActuador('ptc', 25)}
                    disabled={!enLinea}
                    className="px-1.5 py-1 text-[11px] font-bold rounded-lg bg-rose-100 dark:bg-rose-950/70 hover:bg-rose-200 dark:hover:bg-rose-900/60 disabled:opacity-40 text-rose-800 dark:text-rose-300 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    25%
                  </button>
                  <button
                    onClick={() => onActuador('ptc', 50)}
                    disabled={!enLinea}
                    className="px-1.5 py-1 text-[11px] font-bold rounded-lg bg-rose-100 dark:bg-rose-950/70 hover:bg-rose-200 dark:hover:bg-rose-900/60 disabled:opacity-40 text-rose-800 dark:text-rose-300 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    50%
                  </button>
                  <button
                    onClick={() => onActuador('ptc', 100)}
                    disabled={!enLinea}
                    className="px-1.5 py-1 text-[11px] font-bold rounded-lg bg-rose-200 dark:bg-rose-900/80 hover:bg-rose-300 dark:hover:bg-rose-800/80 disabled:opacity-40 text-rose-900 dark:text-rose-200 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    100%
                  </button>
                  <button
                    onClick={() => onActuador('ptc', -1)}
                    disabled={!enLinea}
                    className="px-1.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 dark:bg-emerald-950/70 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 disabled:opacity-40 text-emerald-800 dark:text-emerald-300 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    AUTO
                  </button>
                </div>
              </div>

              {/* Tarjeta Ventilador */}
              <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Fan className="w-4 h-4 text-sky-500" />
                    Ventilador
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sensores?.manual?.ventilador
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    }`}
                  >
                    {sensores?.manual?.ventilador ? 'MANUAL' : 'AUTO'}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 mt-3">
                  <button
                    onClick={() => onActuador('fan', 0)}
                    disabled={!enLinea}
                    className="px-1.5 py-1 text-[11px] font-bold rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 disabled:opacity-40 text-stone-700 dark:text-stone-300 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    OFF
                  </button>
                  <button
                    onClick={() => onActuador('fan', 50)}
                    disabled={!enLinea}
                    className="px-1.5 py-1 text-[11px] font-bold rounded-lg bg-sky-100 dark:bg-sky-950/70 hover:bg-sky-200 dark:hover:bg-sky-900/60 disabled:opacity-40 text-sky-800 dark:text-sky-300 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    50%
                  </button>
                  <button
                    onClick={() => onActuador('fan', 75)}
                    disabled={!enLinea}
                    className="px-1.5 py-1 text-[11px] font-bold rounded-lg bg-sky-100 dark:bg-sky-950/70 hover:bg-sky-200 dark:hover:bg-sky-900/60 disabled:opacity-40 text-sky-800 dark:text-sky-300 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    75%
                  </button>
                  <button
                    onClick={() => onActuador('fan', 100)}
                    disabled={!enLinea}
                    className="px-1.5 py-1 text-[11px] font-bold rounded-lg bg-sky-200 dark:bg-sky-900/80 hover:bg-sky-300 dark:hover:bg-sky-800/80 disabled:opacity-40 text-sky-900 dark:text-sky-200 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    100%
                  </button>
                  <button
                    onClick={() => onActuador('fan', -1)}
                    disabled={!enLinea}
                    className="px-1.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 dark:bg-emerald-950/70 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 disabled:opacity-40 text-emerald-800 dark:text-emerald-300 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    AUTO
                  </button>
                </div>
              </div>

              {/* Tarjeta Humidificador */}
              <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Waves className="w-4 h-4 text-teal-500" />
                    Humidificador
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sensores?.manual?.humidificador
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    }`}
                  >
                    {sensores?.manual?.humidificador ? 'MANUAL' : 'AUTO'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-3">
                  <button
                    onClick={() => onActuador('hum', 1)}
                    disabled={!enLinea}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-teal-100 dark:bg-teal-950/70 hover:bg-teal-200 dark:hover:bg-teal-900/60 disabled:opacity-40 text-teal-800 dark:text-teal-300 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    ON (1)
                  </button>
                  <button
                    onClick={() => onActuador('hum', 0)}
                    disabled={!enLinea}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 disabled:opacity-40 text-stone-700 dark:text-stone-300 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    OFF (0)
                  </button>
                  <button
                    onClick={() => onActuador('hum', -1)}
                    disabled={!enLinea}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 dark:bg-emerald-950/70 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 disabled:opacity-40 text-emerald-800 dark:text-emerald-300 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    AUTO
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400 italic">
              El modo manual vuelve a AUTO al desconectar el Bluetooth. Los cortes de seguridad térmica siempre tienen prioridad.
            </p>
          </div>

          {/* SECCIÓN DE INFORMACIÓN TÉCNICA */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pt-1">
              <Sliders className="w-4 h-4 text-[#E05A36]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Información Técnica y Diagnóstico de Sensores
              </h3>
            </div>

            {/* PARÁMETROS PID Y SENSORES REDUNDANTES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-[#FAF6F0] dark:bg-stone-800/90 rounded-2xl p-3 border border-stone-200 dark:border-stone-700">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Temp Disipador PTC (DS18B20)</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100">
                    {sensores?.temp_disipador ?? '--'} °C
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">Corte: 65°C</span>
                </div>
              </div>

              <div className="bg-[#FAF6F0] dark:bg-stone-800/90 rounded-2xl p-3 border border-stone-200 dark:border-stone-700">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Temp Huevos (BMP280)</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100">
                    {sensores?.temp_aire2 ?? '--'} °C
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">Sensor redundante</span>
                </div>
              </div>

              <div className="bg-[#FAF6F0] dark:bg-stone-800/90 rounded-2xl p-3 border border-stone-200 dark:border-stone-700">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Respaldo DHT11 (T / H)</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100">
                    {sensores?.hum_dht !== undefined ? `${sensores.hum_dht}%` : '--'}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    {sensores?.temp_dht !== undefined ? `${sensores.temp_dht} °C` : 'Sensor respaldo'}
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF6F0] dark:bg-stone-800/90 rounded-2xl p-3 border border-stone-200 dark:border-stone-700">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Lazo PID (Kp / Ki / Kd)</span>
                <div className="flex items-baseline gap-1 mt-1 font-mono text-sm font-bold text-stone-800 dark:text-stone-200">
                  <span>{sensores?.pid.kp ?? 35}</span> / <span>{sensores?.pid.ki ?? 0.8}</span> /{' '}
                  <span>{sensores?.pid.kd ?? 15}</span>
                  <span className="text-xs font-sans text-stone-500 dark:text-stone-400 ml-1">({sensores?.pid.salida}% PWM)</span>
                </div>
              </div>
            </div>

            {/* PANEL INFORMATIVO DE ESTADO DE SENSORES */}
            <div
              id="sensores-ok-panel"
              className="rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 shadow-xs transition-colors"
            >
              {/* Encabezado del panel con resumen y estado global */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200/70 dark:border-orange-800 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4 text-[#E05A36]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">
                      Estado de Conexión de Sensores
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Supervisión continua de bus I2C, 1-Wire y GPIO del ESP32
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      sensores?.sensores_ok && Object.values(sensores.sensores_ok).every(Boolean)
                        ? 'bg-green-50 text-green-800 border-green-200'
                        : !enLinea
                        ? 'bg-stone-100 text-stone-600 border-stone-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        sensores?.sensores_ok && Object.values(sensores.sensores_ok).every(Boolean)
                          ? 'bg-green-500 animate-pulse'
                          : !enLinea
                          ? 'bg-stone-400'
                          : 'bg-amber-500 animate-ping'
                      }`}
                    />
                    {sensores?.sensores_ok
                      ? `${Object.values(sensores.sensores_ok).filter(Boolean).length}/4 Operativos`
                      : enLinea
                      ? 'Verificando...'
                      : 'Desconectado'}
                  </span>
                </div>
              </div>

              {/* Grid responsivo: 1 col móvil, 2 cols tablet, 4 cols desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'aht',
                    nombre: 'AHT10',
                    rol: 'Principal',
                    ubicacion: 'Zona huevos',
                    bus: 'I2C 0x38',
                    valor:
                      sensores?.temp_aire !== undefined && sensores?.humedad !== undefined
                        ? `${sensores.temp_aire}°C · ${sensores.humedad}%`
                        : '--',
                    funcionTecnica:
                      'Sensor principal en zona de huevos. Mide temperatura y humedad con alta precisión para alimentar el lazo de control PID de las PTC y el humidificador.',
                    ok: sensores?.sensores_ok ? Boolean(sensores.sensores_ok.aht) : Boolean(enLinea),
                  },
                  {
                    id: 'bmp',
                    nombre: 'BMP280',
                    rol: 'Redundante',
                    ubicacion: 'Zona huevos',
                    bus: 'I2C 0x76',
                    valor:
                      sensores?.temp_aire2 !== undefined
                        ? `${sensores.temp_aire2}°C · ${sensores?.presion ? `${sensores.presion}hPa` : '1013hPa'}`
                        : '--',
                    funcionTecnica:
                      'Sensor redundante en zona de huevos. Proporciona una segunda lectura térmica para detectar divergencias y mide la presión barométrica (hPa).',
                    ok: sensores?.sensores_ok ? Boolean(sensores.sensores_ok.bmp) : Boolean(enLinea),
                  },
                  {
                    id: 'dht',
                    nombre: 'DHT11',
                    rol: 'Respaldo',
                    ubicacion: 'Extremo huevos',
                    bus: 'GPIO 16',
                    valor:
                      sensores?.hum_dht !== undefined
                        ? `${sensores?.temp_dht !== undefined ? `${sensores.temp_dht}°C` : '--'} · ${sensores.hum_dht}%`
                        : '--',
                    funcionTecnica:
                      'Sensor de respaldo en el extremo opuesto de los huevos. Verifica la uniformidad térmica/humedad y sirve de árbitro ante discrepancias.',
                    ok: sensores?.sensores_ok ? Boolean(sensores.sensores_ok.dht) : Boolean(enLinea),
                  },
                  {
                    id: 'ds',
                    nombre: 'DS18B20',
                    rol: 'Seguridad',
                    ubicacion: 'Disipador PTC',
                    bus: 'GPIO 4',
                    valor:
                      sensores?.temp_disipador !== undefined
                        ? `${sensores.temp_disipador}°C`
                        : '--',
                    funcionTecnica:
                      'Sonda OneWire fijada al disipador de las PTC. Mide exclusivamente la temperatura del disipador y corta el calentador de emergencia si supera 65 °C.',
                    ok: sensores?.sensores_ok ? Boolean(sensores.sensores_ok.ds) : Boolean(enLinea),
                  },
                ].map((s) => {
                  const IconSensor = s.ok ? CheckCircle : XCircle;
                  const tooltipAbierto = sensorTooltipActivo === s.id;
                  const esReconectado = !!reconectados[s.id];

                  return (
                    <div
                      key={s.id}
                      className={`relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                        esReconectado
                          ? 'bg-gradient-to-b from-green-100/90 to-emerald-50/70 border-emerald-400 shadow-md ring-2 ring-emerald-300/80 animate-pulse'
                          : s.ok
                          ? 'bg-gradient-to-b from-green-50/70 to-emerald-50/30 border-green-200/90 shadow-2xs hover:border-green-300'
                          : 'bg-gradient-to-b from-red-50/80 to-rose-50/40 border-red-300 shadow-2xs hover:border-red-400'
                      }`}
                    >
                      {/* Fila superior: Nombre, bus y badge de estado con tooltip */}
                      <div className="flex items-start justify-between gap-1.5 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-stone-900 tracking-tight">
                              {s.nombre}
                            </span>
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/60">
                              {s.bus}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-stone-500 mt-0.5">
                            {s.rol} · <span className="text-stone-400">{s.ubicacion}</span>
                          </p>
                        </div>

                        {/* Contenedor relativo para el ícono/badge interactivo y su tooltip */}
                        <div className="relative group/tooltip shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSensorTooltipActivo(tooltipAbierto ? null : s.id);
                            }}
                            title={`${s.nombre} (${s.ok ? 'OK' : 'Fallido'}): ${s.funcionTecnica}`}
                            aria-label={`Información técnica del sensor ${s.nombre}`}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                              esReconectado
                                ? 'bg-emerald-200 text-emerald-950 border-emerald-400 ring-2 ring-emerald-400/60 animate-pulse'
                                : s.ok
                                ? 'bg-green-100/90 text-green-800 border-green-300 hover:bg-green-200/80'
                                : 'bg-red-100/90 text-red-800 border-red-300 hover:bg-red-200/80'
                            }`}
                          >
                            <IconSensor
                              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${
                                esReconectado
                                  ? 'text-emerald-700 animate-pulse scale-125'
                                  : s.ok
                                  ? 'text-green-600'
                                  : 'text-red-600 animate-pulse'
                              }`}
                            />
                            <span>{esReconectado ? '¡Reconectado!' : s.ok ? 'OK' : 'Fallido'}</span>
                            <Info className="w-3 h-3 text-stone-400 group-hover/tooltip:text-stone-700 transition-colors" />
                          </button>

                          {/* Tooltip flotante técnico (Hover en PC / Tap en móviles) */}
                          <div
                            className={`absolute right-0 bottom-full mb-2 w-64 sm:w-72 p-3 bg-stone-900/95 text-white rounded-2xl shadow-xl backdrop-blur-xs text-left z-30 transition-all duration-200 ${
                              tooltipAbierto
                                ? 'opacity-100 visible translate-y-0 pointer-events-auto'
                                : 'opacity-0 invisible translate-y-1 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:visible group-hover/tooltip:translate-y-0 group-hover/tooltip:pointer-events-auto'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-stone-800">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <IconSensor
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    s.ok ? 'text-green-400' : 'text-red-400'
                                  }`}
                                />
                                <span className="font-bold text-xs text-stone-100 truncate">
                                  {s.nombre}
                                </span>
                                <span className="text-[10px] font-mono text-stone-400">
                                  {s.bus}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                  s.ok
                                    ? 'bg-green-950 text-green-300 border border-green-800'
                                    : 'bg-red-950 text-red-300 border border-red-800'
                                }`}
                              >
                                {s.ok ? 'Operativo' : 'Falla'}
                              </span>
                            </div>

                            <p className="text-[11px] leading-relaxed text-stone-300 mt-2">
                              {s.funcionTecnica}
                            </p>

                            <div className="mt-2.5 pt-1.5 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-400">
                              <span>Rol: {s.rol}</span>
                              <span className="font-mono text-stone-200 font-semibold">
                                {s.valor}
                              </span>
                            </div>

                            {/* Flecha indicadora */}
                            <div className="absolute right-4 top-full w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-stone-900/95" />
                          </div>
                        </div>
                      </div>

                      {/* Fila inferior: Lectura actual compacta */}
                      <div className="mt-1 pt-2 border-t border-stone-200/40 flex items-center justify-between text-xs">
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-stone-400">
                          Lectura actual
                        </span>
                        <span className="font-mono font-bold text-stone-800">
                          {s.valor}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* GRÁFICAS DE TELEMETRÍA (ÚLTIMAS 24H) */}
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#E05A36]" />
                <h3 className="text-sm sm:text-base font-bold text-stone-800 dark:text-stone-100">
                  Telemetría Registrada (Últimas 24 Horas)
                </h3>
              </div>

              {/* Selector de métrica */}
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => setTabGrafica('TEMP')}
                  className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                    tabGrafica === 'TEMP'
                      ? 'bg-white dark:bg-stone-700 text-[#E05A36] dark:text-[#FF7A50] shadow-xs font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  Temperatura
                </button>
                <button
                  onClick={() => setTabGrafica('HUM')}
                  className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                    tabGrafica === 'HUM'
                      ? 'bg-white dark:bg-stone-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  Humedad
                </button>
                <button
                  onClick={() => setTabGrafica('DISIPADOR')}
                  className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                    tabGrafica === 'DISIPADOR'
                      ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  Disipador PTC
                </button>
                <button
                  onClick={() => setTabGrafica('PID')}
                  className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                    tabGrafica === 'PID'
                      ? 'bg-white dark:bg-stone-700 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  Salida PID %
                </button>
              </div>
            </div>

            {/* Contenedor Recharts */}
            <div className="h-64 sm:h-72 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {tabGrafica === 'TEMP' ? (
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#88888833" />
                      <XAxis dataKey="hora" stroke="#A8A29E" fontSize={11} tickLine={false} />
                      <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} stroke="#A8A29E" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1C1917',
                          color: '#F5F5F4',
                          borderRadius: '16px',
                          border: '1px solid #44403C',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Line
                        type="monotone"
                        dataKey="temp_aire"
                        name="Temp Huevos AHT20 (°C)"
                        stroke="#E05A36"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="temp_aire2"
                        name="Temp Huevos BMP280 (°C)"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="setpoint_temp"
                        name="Objetivo (°C)"
                        stroke="#059669"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                    </LineChart>
                  ) : tabGrafica === 'HUM' ? (
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#88888833" />
                      <XAxis dataKey="hora" stroke="#A8A29E" fontSize={11} tickLine={false} />
                      <YAxis domain={[30, 85]} stroke="#A8A29E" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1C1917',
                          color: '#F5F5F4',
                          borderRadius: '16px',
                          border: '1px solid #44403C',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Line
                        type="monotone"
                        dataKey="humedad"
                        name="Humedad Relativa AHT20 (%)"
                        stroke="#0284C7"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="hum_dht"
                        name="Humedad Respaldo DHT11 (%)"
                        stroke="#0D9488"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="setpoint_hum"
                        name="Objetivo (%)"
                        stroke="#10B981"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                    </LineChart>
                  ) : tabGrafica === 'DISIPADOR' ? (
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#88888833" />
                      <XAxis dataKey="hora" stroke="#A8A29E" fontSize={11} tickLine={false} />
                      <YAxis domain={[30, 70]} stroke="#A8A29E" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1C1917',
                          color: '#F5F5F4',
                          borderRadius: '16px',
                          border: '1px solid #44403C',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Line
                        type="monotone"
                        dataKey="temp_disipador"
                        name="Disipador PTC (°C)"
                        stroke="#D97706"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#88888833" />
                      <XAxis dataKey="hora" stroke="#A8A29E" fontSize={11} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#A8A29E" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1C1917',
                          color: '#F5F5F4',
                          borderRadius: '16px',
                          border: '1px solid #44403C',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Line
                        type="monotone"
                        dataKey="pid_salida"
                        name="Salida Potencia PID (%)"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-stone-400 dark:text-stone-500 text-xs">
                  Recopilando telemetría... Las curvas se graficarán conforme lleguen lecturas del ESP32.
                </div>
              )}
            </div>
          </div>

          {/* INSPECCIÓN RAW JSON DEL ESP32 (PARA DEPURACIÓN DE HARDWARE) */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-4 bg-stone-50 dark:bg-stone-800/80 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                Diagnóstico de Trama JSON (Notificación BLE b7a10002...)
              </span>
              <button
                onClick={() => setMostrarJSON(!mostrarJSON)}
                className="text-xs font-semibold text-[#E05A36] dark:text-[#FF7A50] hover:underline cursor-pointer"
              >
                {mostrarJSON ? 'Ocultar JSON' : 'Ver JSON crudo'}
              </button>
            </div>
            {mostrarJSON && (
              <pre className="mt-3 p-3 bg-stone-900 dark:bg-stone-950 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-stone-800">
                {JSON.stringify(sensores, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Pie del modal */}
        <div className="px-6 py-3.5 border-t border-stone-100 dark:border-stone-800 bg-[#FAF6F0] dark:bg-stone-800 flex items-center justify-between transition-colors">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            Perfil: <strong className="text-stone-800 dark:text-stone-200">{perfil?.nombre}</strong> ({incubadora.cantidadHuevos} huevos)
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 dark:hover:bg-stone-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
