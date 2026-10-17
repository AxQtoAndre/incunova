import React from 'react';
import { ExternalLink, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { CREDITOS_IMAGENES } from '../../data/imageCredits';

export const CreditsSection: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-2xl bg-[#FFF2EB] text-[#E05A36] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-stone-900">Créditos y Licencias de Imágenes</h3>
          <p className="text-xs text-stone-500">
            Atribución completa según licencias Creative Commons y Dominio Público de Wikimedia Commons e IA referencial.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {CREDITOS_IMAGENES.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-[#FAF6F0] rounded-2xl border border-stone-200/80 text-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-stone-900 truncate">{item.nombreComun}</span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                    item.esIa ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {item.esIa ? 'IA Referencial' : item.licencia}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 italic mb-2">{item.especie}</p>
              <div className="text-[11px] text-stone-600 space-y-0.5">
                <div><strong>Autor:</strong> {item.autor}</div>
                <div><strong>Licencia:</strong> {item.licencia}</div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px]">
              <span className="text-stone-500">{item.fuente}</span>
              {item.origenUrl !== '#' && (
                <a
                  href={item.origenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#E05A36] font-bold inline-flex items-center gap-0.5 hover:underline"
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
