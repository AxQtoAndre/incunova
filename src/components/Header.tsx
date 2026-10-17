import {
  Egg,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Bluetooth,
  BookOpen,
  Code2,
  LayoutDashboard,
  Sparkles,
  Moon,
  Sun,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type TabId = 'dashboard' | 'perfiles' | 'config' | 'etapas' | 'guia' | 'sketch';

interface Props {
  tabActiva: TabId;
  onCambiarTab: (tab: TabId) => void;
  silenciado: boolean;
  onToggleSilencio: () => void;
  isSyncing: boolean;
  haySimuladas: boolean;
  conAlertas: boolean;
  onNuevaIncubadora: () => void;
  temaOscuro: boolean;
  onToggleTemaOscuro: () => void;
}

export const Header: React.FC<Props> = ({
  tabActiva,
  onCambiarTab,
  silenciado,
  onToggleSilencio,
  isSyncing,
  haySimuladas,
  conAlertas,
  onNuevaIncubadora,
  temaOscuro,
  onToggleTemaOscuro,
}) => {
  const tabs: { id: TabId; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'perfiles', label: 'Perfiles de especies', icon: Sliders },
    { id: 'config', label: 'Dispositivos', icon: Bluetooth },
    { id: 'etapas', label: 'Etapas de incubación', icon: Egg, badge: 'Nueva' },
    { id: 'guia', label: 'Guía de uso', icon: BookOpen, badge: 'Nueva' },
    { id: 'sketch', label: 'Código ESP32 (.ino)', icon: Code2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6F0]/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 shadow-2xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Barra superior con marca, status sync, botón silencio, tema nocturno y PWA */}
        <div className="py-3 flex items-center justify-between gap-3">
          {/* Logo e identidad */}
          <div
            onClick={() => onCambiarTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#FF7A50] to-[#E05A36] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition">
              <Egg className="w-6 h-6 drop-shadow-xs" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-stone-900 dark:text-stone-100 font-sans">incuNOVA</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#E05A36]/15 dark:bg-[#E05A36]/30 text-[#E05A36]">
                  BLE
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-medium hidden sm:block">
                Monitoreo y Control Bluetooth BLE de Incubadoras ESP32
              </p>
            </div>
          </div>

          {/* Acciones y Estados de Sistema */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Botón rápido Nueva Incubadora */}
            <button
              onClick={onNuevaIncubadora}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E05A36] text-white text-xs font-bold hover:bg-[#C84724] active:scale-95 transition shadow-2xs cursor-pointer"
              title="Registrar una nueva incubadora"
            >
              <span>+ Nueva incubadora</span>
            </button>

            {/* Indicador de Modo Simulación si alguna unidad la usa */}
            {haySimuladas && (
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Unidad simulada
              </span>
            )}

            {/* Indicador Sync con punto verde parpadeante */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-2xs text-[11px] font-semibold text-stone-700 dark:text-stone-300"
              title="Sincronización en tiempo real vía Bluetooth BLE"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${
                    isSyncing ? 'duration-500' : 'duration-1000'
                  }`}
                />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-mono">Sync</span>
            </div>

            {/* Botón Guardia Nocturna (Tema Oscuro) */}
            <button
              onClick={onToggleTemaOscuro}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                temaOscuro
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700/60 shadow-2xs'
              }`}
              title={
                temaOscuro
                  ? 'Guardia nocturna activa (baja luminosidad). Clic para volver a modo diurno'
                  : 'Activar modo guardia nocturna para supervisión en baja luz'
              }
            >
              {temaOscuro ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
              )}
              <span className="hidden xs:inline">
                {temaOscuro ? 'Guardia' : 'Noche'}
              </span>
            </button>

            {/* Botón Silencio de alarmas */}
            <button
              onClick={onToggleSilencio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                silenciado
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : conAlertas
                  ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 animate-pulse'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700/60'
              }`}
              title={silenciado ? 'Alarmas silenciadas' : 'Silenciar sonido de alarmas'}
            >
              {silenciado ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">{silenciado ? 'Silenciado' : 'Silencio'}</span>
            </button>

            {/* Botón de instalación PWA */}
            <PWAInstallButton />
          </div>
        </div>

        {/* Barra de pestañas de navegación responsive */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none border-t border-stone-200/50 dark:border-stone-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const activa = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onCambiarTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  activa
                    ? 'bg-[#E05A36] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/70 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${activa ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
                      activa ? 'bg-white/25 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
