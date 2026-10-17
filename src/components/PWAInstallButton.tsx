import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Si ya corre instalada en pantalla completa, no mostrar botón
  if (isInstalled) {
    return null;
  }

  // Flujo Android / Chrome / Desktop
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-[#E05A36] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#C84724] active:scale-95 transition"
        title="Instalar IncubaESP en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  // Flujo iOS Safari
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-full border border-[#E05A36]/40 bg-[#FFF5F0] px-3 py-1.5 text-xs font-semibold text-[#E05A36] hover:bg-[#FFE8DE] transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF2EB] flex items-center justify-center text-[#E05A36]">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800">Instalar en iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-stone-600">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E05A36]/10 text-[#E05A36] font-bold text-xs flex items-center justify-center">1</span>
                  <p>Toca el botón <strong>Compartir</strong> <span className="inline-block px-1 bg-stone-100 rounded text-xs">⎋</span> en la barra inferior de Safari.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E05A36]/10 text-[#E05A36] font-bold text-xs flex items-center justify-center">2</span>
                  <p>Desplaza hacia abajo y selecciona <strong>Agregar a pantalla de inicio</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E05A36]/10 text-[#E05A36] font-bold text-xs flex items-center justify-center">3</span>
                  <p>Confirma en <strong>Agregar</strong> arriba a la derecha. ¡Listo! Tendrás acceso directo sin barras de navegador.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-2xl bg-[#E05A36] py-2.5 text-sm font-semibold text-white hover:bg-[#C84724] transition"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
