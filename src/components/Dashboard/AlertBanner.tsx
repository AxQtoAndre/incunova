import React from 'react';
import { AlertOctagon, VolumeX, Volume2, ChevronRight } from 'lucide-react';
import { IncubadoraConEstado, TipoAlerta } from '../../types/incubator';

interface Props {
  incubadorasEnAlerta: IncubadoraConEstado[];
  silenciado: boolean;
  onToggleSilencio: () => void;
  onSelectIncubadora: (inc: IncubadoraConEstado) => void;
}

const NOMBRES_ALERTAS: Record<TipoAlerta, string> = {
  TEMP_BAJA: 'Temperatura baja',
  TEMP_ALTA: 'Temperatura alta',
  HUM_BAJA: 'Humedad baja',
  HUM_ALTA: 'Humedad alta',
  SENSOR_FALLA: 'Falla de lectura en sensor',
  SOBRECALENTAMIENTO_DISIPADOR: 'Sobrecalentamiento en disipador PTC (>65°C)',
  NIVEL_AGUA_BAJO: 'Nivel bajo de agua en depósito',
  DIVERGENCIA_SENSORES: 'Divergencia entre sensores > 1.5 °C',
};

export const AlertBanner: React.FC<Props> = ({
  incubadorasEnAlerta,
  silenciado,
  onToggleSilencio,
  onSelectIncubadora,
}) => {
  if (incubadorasEnAlerta.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl sm:rounded-3xl bg-rose-50 border-2 border-rose-300 p-4 sm:p-5 shadow-sm text-rose-950 animate-pulse-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <AlertOctagon className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-rose-900">
                ¡Atención! {incubadorasEnAlerta.length} {incubadorasEnAlerta.length === 1 ? 'incubadora presenta' : 'incubadoras presentan'} alertas activas
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-rose-200 text-rose-800">
                CRÍTICO
              </span>
            </div>
            <div className="mt-1 space-y-1">
              {incubadorasEnAlerta.map((inc) => (
                <div key={inc.id} className="text-xs sm:text-sm text-rose-800 flex items-center gap-2 flex-wrap">
                  <span className="font-bold underline cursor-pointer hover:text-rose-950" onClick={() => onSelectIncubadora(inc)}>
                    {inc.nombre}:
                  </span>
                  {inc.sensores?.alertas.map((a) => (
                    <span key={a} className="inline-block bg-rose-100 text-rose-900 border border-rose-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                      {NOMBRES_ALERTAS[a] || a}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={onToggleSilencio}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
              silenciado
                ? 'bg-rose-200/80 text-rose-800 border-rose-300'
                : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-100'
            }`}
            title={silenciado ? 'Alarmas silenciadas' : 'Silenciar sonido de alarma'}
          >
            {silenciado ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{silenciado ? 'Silenciado' : 'Silenciar'}</span>
          </button>

          <button
            onClick={() => onSelectIncubadora(incubadorasEnAlerta[0])}
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold hover:bg-rose-800 transition shadow-xs"
          >
            <span>Ver detalle</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
