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
    <header className="sticky top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-stone-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Barra superior con marca, status sync, botón silencio y PWA */}
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
                <span className="text-lg font-black tracking-tight text-stone-900 font-sans">Incubanova</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#E05A36]/15 text-[#E05A36]">
                  BLE
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-500 font-medium hidden sm:block">
                Monitoreo y Control Bluetooth BLE de Incubadoras ESP32
              </p>
            </div>
          </div>

          {/* Acciones y Estados de Sistema */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botón rápido Nueva Incubadora */}
            <button
              onClick={onNuevaIncubadora}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E05A36] text-white text-xs font-bold hover:bg-[#C84724] active:scale-95 transition shadow-2xs"
              title="Registrar una nueva incubadora"
            >
              <span>+ Nueva incubadora</span>
            </button>

            {/* Indicador de Modo Simulación si alguna unidad la usa */}
            {haySimuladas && (
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100/90 text-amber-800 border border-amber-300">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Unidad simulada
              </span>
            )}

            {/* Indicador Sync con punto verde parpadeante */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-stone-200 shadow-2xs text-[11px] font-semibold text-stone-700"
              title="Sincronización en tiempo real vía HTTP local"
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

            {/* Botón Silencio de alarmas */}
            <button
              onClick={onToggleSilencio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                silenciado
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : conAlertas
                  ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
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
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none border-t border-stone-200/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const activa = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onCambiarTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  activa
                    ? 'bg-[#E05A36] text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${activa ? 'text-white' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
                      activa ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
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
