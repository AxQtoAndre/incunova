import React from 'react';
import { Search, Filter } from 'lucide-react';
import { FiltroEstado } from '../../types/incubator';

interface Props {
  filtroActual: FiltroEstado;
  onSelectFiltro: (filtro: FiltroEstado) => void;
  busqueda: string;
  onCambiarBusqueda: (texto: string) => void;
  conteos: {
    todas: number;
    alerta: number;
    lockdown: number;
    normal: number;
  };
}

export const FilterBar: React.FC<Props> = ({
  filtroActual,
  onSelectFiltro,
  busqueda,
  onCambiarBusqueda,
  conteos,
}) => {
  const filtros: { id: FiltroEstado; label: string; count: number; badgeColor?: string }[] = [
    { id: 'TODAS', label: 'Todas', count: conteos.todas },
    { id: 'ALERTA', label: 'Con alerta', count: conteos.alerta, badgeColor: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300' },
    { id: 'LOCKDOWN', label: 'Lockdown', count: conteos.lockdown, badgeColor: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300' },
    { id: 'NORMAL', label: 'Normales', count: conteos.normal, badgeColor: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white/70 dark:bg-stone-900/80 p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-2xs backdrop-blur-xs transition-colors duration-200">
      {/* Pills de filtro */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <div className="hidden sm:flex items-center pl-2 pr-1 text-stone-400 dark:text-stone-500">
          <Filter className="w-4 h-4" />
        </div>
        {filtros.map((f) => {
          const activo = filtroActual === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onSelectFiltro(f.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activo
                  ? 'bg-[#E05A36] text-white shadow-xs'
                  : 'bg-stone-100/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-700/80'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activo ? 'bg-white/25 text-white' : f.badgeColor || 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Búsqueda por nombre o IP */}
      <div className="relative min-w-[220px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onCambiarBusqueda(e.target.value)}
          placeholder="Buscar por nombre o ID..."
          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-100/70 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#E05A36]/40 focus:bg-white dark:focus:bg-stone-800 transition"
        />
        {busqueda && (
          <button
            onClick={() => onCambiarBusqueda('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
