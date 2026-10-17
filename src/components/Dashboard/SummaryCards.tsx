import React from 'react';
import { Wifi, Egg, AlertTriangle, Lock } from 'lucide-react';
import { IncubadoraConEstado } from '../../types/incubator';

interface Props {
  incubadoras: IncubadoraConEstado[];
}

export const SummaryCards: React.FC<Props> = ({ incubadoras }) => {
  const enRed = incubadoras.filter((i) => i.enLinea).length;
  const totalHuevos = incubadoras.reduce((sum, i) => sum + (i.activa ? i.cantidadHuevos : 0), 0);
  const conAlerta = incubadoras.filter(
    (i) => i.enLinea && i.sensores && i.sensores.alertas.length > 0
  ).length;
  const enLockdown = incubadoras.filter(
    (i) => i.enLinea && i.sensores && i.sensores.dia_incubacion >= i.sensores.dias_totales - 3
  ).length;

  const items = [
    {
      titulo: 'En Red Local',
      valor: `${enRed} / ${incubadoras.length}`,
      subtexto: incubadoras.length === 0 ? 'Sin incubadoras configuradas' : 'Incubadoras conectadas',
      icono: Wifi,
      colorIcono: 'text-emerald-600 dark:text-emerald-400',
      bgIcono: 'bg-emerald-50 dark:bg-emerald-950/60',
      borderCard: 'border-emerald-200/60 dark:border-emerald-900/60',
    },
    {
      titulo: 'Huevos en Proceso',
      valor: totalHuevos.toString(),
      subtexto: incubadoras.length === 0 ? 'Sin carga activa' : 'En incubación activa',
      icono: Egg,
      colorIcono: 'text-[#E05A36]',
      bgIcono: 'bg-[#FFF2EB] dark:bg-[#E05A36]/20',
      borderCard: 'border-[#E05A36]/20 dark:border-[#E05A36]/30',
    },
    {
      titulo: 'En Alerta',
      valor: conAlerta.toString(),
      subtexto: conAlerta > 0 ? 'Requiere atención inmediata' : 'Sin alertas activas',
      icono: AlertTriangle,
      colorIcono: conAlerta > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-400 dark:text-stone-500',
      bgIcono: conAlerta > 0 ? 'bg-rose-50 dark:bg-rose-950/60' : 'bg-stone-50 dark:bg-stone-800',
      borderCard: conAlerta > 0 ? 'border-rose-300 dark:border-rose-700 ring-2 ring-rose-100 dark:ring-rose-950' : 'border-stone-200/60 dark:border-stone-800',
    },
    {
      titulo: 'En Lockdown',
      valor: enLockdown.toString(),
      subtexto: enLockdown > 0 ? 'Fase final de eclosión' : 'Sin unidades en eclosión',
      icono: Lock,
      colorIcono: 'text-amber-600 dark:text-amber-400',
      bgIcono: 'bg-amber-50 dark:bg-amber-950/60',
      borderCard: 'border-amber-200/60 dark:border-amber-900/60',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {items.map((it, idx) => {
        const Icon = it.icono;
        return (
          <div
            key={idx}
            className={`bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs border ${it.borderCard} transition-all duration-200 hover:shadow-md flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-stone-500 dark:text-stone-400">{it.titulo}</span>
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center ${it.bgIcono} ${it.colorIcono}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">{it.valor}</div>
              <div className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium truncate">{it.subtexto}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
