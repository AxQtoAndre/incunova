import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { CREDITOS_IMAGENES } from '../../data/imageCredits';

export const CreditsSection: React.FC = () => {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-xs transition-colors">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-2xl bg-[#FFF2EB] dark:bg-[#E05A36]/20 text-[#E05A36] dark:text-[#FF7A50] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">Créditos y Licencias de Imágenes</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Atribución completa según licencias Creative Commons y Dominio Público de Wikimedia Commons e IA referencial.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {CREDITOS_IMAGENES.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-[#FAF6F0] dark:bg-stone-800/80 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 text-xs flex flex-col justify-between transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-stone-900 dark:text-stone-100 truncate">{item.nombreComun}</span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                    item.esIa
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {item.esIa ? 'IA Referencial' : item.licencia}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 italic mb-2">{item.especie}</p>
              <div className="text-[11px] text-stone-600 dark:text-stone-300 space-y-0.5">
                <div><strong className="text-stone-700 dark:text-stone-200">Autor:</strong> {item.autor}</div>
                <div><strong className="text-stone-700 dark:text-stone-200">Licencia:</strong> {item.licencia}</div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-stone-200/60 dark:border-stone-700/80 flex items-center justify-between text-[10px]">
              <span className="text-stone-500 dark:text-stone-400">{item.fuente}</span>
              {item.origenUrl !== '#' && (
                <a
                  href={item.origenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#E05A36] dark:text-[#FF7A50] font-bold inline-flex items-center gap-0.5 hover:underline"
                >
                  <span>Ver origen</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
