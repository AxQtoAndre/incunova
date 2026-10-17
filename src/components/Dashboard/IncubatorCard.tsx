import React, { useState } from 'react';
import {
  Thermometer,
  Droplets,
  RotateCw,
  Egg,
  Clock,
  WifiOff,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { IncubadoraConEstado, PerfilEspecie } from '../../types/incubator';
import { sonarChimeExito } from '../../utils/audioAlert';

interface Props {
  incubadora: IncubadoraConEstado;
  perfil?: PerfilEspecie;
  onVerDetalle: () => void;
  onGirarAhora: () => Promise<void>;
}

export const IncubatorCard: React.FC<Props> = ({
  incubadora,
  perfil,
  onVerDetalle,
  onGirarAhora,
}) => {
  const [girando, setGirando] = useState(false);

  const { sensores, enLinea, errorConexion, ultimaLectura } = incubadora;

  const handleGirar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setGirando(true);
      sonarChimeExito();
      await onGirarAhora();
    } finally {
      setTimeout(() => setGirando(false), 2000);
    }
  };

  // Formato de tiempo para el próximo volteo (HH:MM:SS o MM:SS)
  const formatTiempoRestante = (segundos?: number) => {
    if (segundos === undefined || segundos <= 0) return '00:00';
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Formato de hora de última lectura
  const formatUltimaLectura = (ts?: number) => {
    if (!ts) return 'Desconocido';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const diasTotales = sensores?.dias_totales || perfil?.diasTotales || 21;
  const diaActual = sensores?.dia_incubacion || 1;
  const diaLockdown = perfil?.diaLockdown || Math.max(1, diasTotales - 3);

  const porcentajeProgreso = Math.min(100, Math.max(0, Math.round((diaActual / diasTotales) * 100)));
  const porcentajeLockdown = Math.min(100, Math.max(0, Math.round((diaLockdown / diasTotales) * 100)));

  // Determinar píldora de estado
  const tieneAlertas = enLinea && sensores && sensores.alertas.length > 0;
  const esLockdown = diaActual >= diaLockdown;
  const divergenciaSensores =
    sensores && Math.abs(sensores.temp_aire - sensores.temp_aire2) > 1.5;

  let estadoPill = {
    label: 'NORMAL',
    bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    dot: 'bg-emerald-500',
  };

  if (!enLinea) {
    estadoPill = {
      label: 'SIN CONEXIÓN',
      bg: 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700',
      dot: 'bg-stone-400',
    };
  } else if (tieneAlertas || divergenciaSensores) {
    estadoPill = {
      label: 'ALERTA',
      bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700',
      dot: 'bg-rose-500 animate-ping',
    };
  } else if (esLockdown) {
    estadoPill = {
      label: 'LOCKDOWN',
      bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      dot: 'bg-amber-500',
    };
  }

  // Cálculos térmicos y de humedad
  const tempActual = sensores?.temp_aire ?? 0;
  const tempObj = sensores?.setpoint_temp ?? perfil?.temperatura ?? 37.8;
  const deltaTemp = Number((tempActual - tempObj).toFixed(2));

  const humActual = sensores?.humedad ?? 0;
  const humObj = sensores?.setpoint_hum ?? (esLockdown ? perfil?.humedadLockdown : perfil?.humedadNormal) ?? 50;
  const deltaHum = Number((humActual - humObj).toFixed(1));

  return (
    <div
      onClick={onVerDetalle}
      className={`group relative bg-white dark:bg-stone-900 rounded-3xl p-5 shadow-xs border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between ${
        tieneAlertas || divergenciaSensores
          ? 'border-rose-300 dark:border-rose-700 ring-2 ring-rose-100 dark:ring-rose-950'
          : 'border-stone-200/80 dark:border-stone-800'
      }`}
    >
      {/* Cabecera de la tarjeta */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">{perfil?.icono || '🥚'}</span>
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-100 truncate group-hover:text-[#E05A36] transition">
                {incubadora.nombre}
              </h3>
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5 font-mono">
              <span className="flex items-center gap-1">
                {incubadora.esSimulada ? (
                  <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded font-sans text-[11px] font-semibold">Simulada</span>
                ) : (
                  <span className="text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded font-sans text-[11px] font-semibold flex items-center gap-1">
                    BLE {incubadora.estadoConexion || 'desconectado'}
                  </span>
                )}
              </span>
              <span>•</span>
              <span className="font-sans font-medium text-stone-600 dark:text-stone-300">{perfil?.nombre || 'Especie'}</span>
            </div>
          </div>

          {/* Píldora de estado */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${estadoPill.bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${estadoPill.dot}`} />
            <span>{estadoPill.label}</span>
          </div>
        </div>

        {/* Aviso de modo autónomo si se desconectó */}
        {incubadora.avisoModoAutonomo && (
          <div className="mb-3 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 p-2 text-xs text-sky-900 dark:text-sky-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
            <span>ESP32 en modo autónomo de seguridad (AUTO). Regulación local activa.</span>
          </div>
        )}

        {/* Alerta de divergencia de sensores (> 1.5°C) */}
        {divergenciaSensores && (
          <div className="mb-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 p-2.5 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Verificar sensores: Diferencia de {Math.abs(sensores.temp_aire - sensores.temp_aire2).toFixed(1)} °C entre Sonda 1 ({sensores.temp_aire}°C) y Sonda 2 ({sensores.temp_aire2}°C).
            </span>
          </div>
        )}

        {/* Sin conexión aviso */}
        {!enLinea && (
          <div className="mb-3 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-3 text-xs text-stone-600 dark:text-stone-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              <span>Sin conexión con el ESP32</span>
            </div>
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">Última lectura: {formatUltimaLectura(ultimaLectura)}</span>
          </div>
        )}

        {/* Métricas Principales: Temperatura y Humedad */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Tarjeta Temperatura */}
          <div className="bg-[#FFF9F6] dark:bg-stone-800/90 rounded-2xl p-3 border border-[#FADCD1] dark:border-stone-700/80">
            <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-1">
              <span className="font-semibold flex items-center gap-1 text-[#E05A36] dark:text-[#FF7A50]">
                <Thermometer className="w-4 h-4" />
                Temp Aire
              </span>
              <span className="font-mono text-[11px] text-stone-600 dark:text-stone-400">Obj: {tempObj}°C</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight font-mono">
                {enLinea ? `${tempActual.toFixed(1)}°` : '--.-°'}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">C</span>
            </div>
            <div className="text-[11px] font-semibold mt-1">
              {enLinea ? (
                <span className={Math.abs(deltaTemp) > 0.4 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-700 dark:text-emerald-400'}>
                  Δ {deltaTemp > 0 ? `+${deltaTemp}` : deltaTemp} °C
                </span>
              ) : (
                <span className="text-stone-400 dark:text-stone-500">Sin datos</span>
              )}
            </div>
          </div>

          {/* Tarjeta Humedad */}
          <div className="bg-[#F0F8FA] dark:bg-stone-800/90 rounded-2xl p-3 border border-[#D5ECF2] dark:border-stone-700/80">
            <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-1">
              <span className="font-semibold flex items-center gap-1 text-sky-700 dark:text-sky-400">
                <Droplets className="w-4 h-4" />
                Humedad
              </span>
              <span className="font-mono text-[11px] text-stone-600 dark:text-stone-400">Obj: {humObj}%</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight font-mono">
                {enLinea ? `${Math.round(humActual)}` : '--'}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">% HR</span>
            </div>
            <div className="text-[11px] font-semibold mt-1">
              {enLinea ? (
                <span className={Math.abs(deltaHum) > 8 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-sky-700 dark:text-sky-400'}>
                  Δ {deltaHum > 0 ? `+${deltaHum}` : deltaHum} %
                </span>
              ) : (
                <span className="text-stone-400 dark:text-stone-500">Sin datos</span>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Progreso: Día X de N con marcas de Lockdown y Eclosión */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E05A36]" />
              Día <strong className="text-stone-900 dark:text-stone-100 text-sm">{diaActual}</strong> de {diasTotales}
            </span>
            <span className="text-stone-500 dark:text-stone-400 font-mono text-[11px]">
              {esLockdown ? 'En periodo de eclosión' : `Faltan ${Math.max(0, diasTotales - diaActual)} días`}
            </span>
          </div>

          {/* Barra con marcadores visuales */}
          <div className="relative w-full h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700">
            {/* Relleno de progreso */}
            <div
              className="h-full bg-linear-to-r from-[#E05A36] to-[#F97316] transition-all duration-500"
              style={{ width: `${porcentajeProgreso}%` }}
            />
          </div>

          {/* Marcadores de Lockdown y Eclosión debajo de la barra */}
          <div className="relative w-full h-5 mt-1 text-[10px] text-stone-500 dark:text-stone-400 font-medium">
            <div
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${porcentajeLockdown}%` }}
            >
              <div className="w-0.5 h-1.5 bg-amber-500" />
              <span className="text-amber-800 dark:text-amber-400 font-bold whitespace-nowrap">D{diaLockdown} (Lockdown)</span>
            </div>
            <div className="absolute right-0 flex flex-col items-end">
              <div className="w-0.5 h-1.5 bg-emerald-600" />
              <span className="text-emerald-700 dark:text-emerald-400 font-bold whitespace-nowrap">D{diasTotales} (Eclosión)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pie de la tarjeta: Próximo Volteo + Botón Girar Ahora + Huevos + Ver detalle */}
      <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Volteo / Lockdown estado */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 font-medium">
            <Clock className="w-4 h-4 text-stone-400" />
            {esLockdown ? (
              <span className="text-amber-800 dark:text-amber-400 font-semibold">Volteo suspendido (Lockdown)</span>
            ) : (
              <span>
                Próximo volteo:{' '}
                <strong className="text-stone-800 dark:text-stone-200 font-mono">
                  {formatTiempoRestante(sensores?.segundos_proximo_volteo)}
                </strong>
              </span>
            )}
          </div>

          {/* Botón Girar Ahora */}
          {!esLockdown && (
            <button
              onClick={handleGirar}
              disabled={girando || !enLinea}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
                girando
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 cursor-wait'
                  : 'bg-[#FFF2EB] dark:bg-[#E05A36]/20 text-[#E05A36] dark:text-[#FF7A50] hover:bg-[#FFE5D6] dark:hover:bg-[#E05A36]/30 active:scale-95'
              } disabled:opacity-50 disabled:pointer-events-none`}
              title="Iniciar giro manual de la bandeja"
            >
              <RotateCw className={`w-3.5 h-3.5 ${girando ? 'animate-spin' : ''}`} />
              <span>{girando ? 'Girando...' : 'Girar ahora'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400">
            <Egg className="w-4 h-4 text-[#E05A36]" />
            <span>{incubadora.cantidadHuevos} huevos</span>
          </div>

          <button
            onClick={onVerDetalle}
            className="flex items-center gap-1 text-xs font-bold text-[#E05A36] dark:text-[#FF7A50] hover:text-[#C84724] transition group-hover:translate-x-0.5 cursor-pointer"
          >
            <span>Ver detalle y gráficas</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
