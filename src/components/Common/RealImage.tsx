import React, { useState } from 'react';
import { ImageOff, Sparkles, ExternalLink, Info } from 'lucide-react';
import { CREDITOS_IMAGENES, CreditoImagen } from '../../data/imageCredits';

interface Props {
  imageId: string;
  className?: string;
  aspectRatioClass?: string; // Default: 'aspect-4/3'
  mostrarBadge?: boolean;
}

export const RealImage: React.FC<Props> = ({
  imageId,
  className = '',
  aspectRatioClass = 'aspect-4/3',
  mostrarBadge = true,
}) => {
  const [errorCarga, setErrorCarga] = useState(false);
  const [mostrarCredito, setMostrarCredito] = useState(false);

  const credito: CreditoImagen | undefined = CREDITOS_IMAGENES.find((c) => c.id === imageId);
  const src = credito?.archivo || `/images/${imageId}.webp`;
  const alt = credito?.alt || credito?.nombreComun || 'Fotografía de incubación';

  if (errorCarga || !credito) {
    return (
      <div
        className={`relative w-full ${aspectRatioClass} rounded-2xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center p-4 text-center text-stone-400 ${className}`}
      >
        <ImageOff className="w-8 h-8 mb-2 text-stone-400" />
        <span className="text-xs font-semibold text-stone-500">
          {credito?.nombreComun || imageId}
        </span>
        <span className="text-[10px] text-stone-400 mt-1">Fotografía referencial</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${aspectRatioClass} rounded-2xl overflow-hidden bg-stone-100 group shadow-2xs border border-stone-200/80 ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setErrorCarga(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
      />

      {/* Badge si es generada por IA (requerido por usuario) */}
      {mostrarBadge && credito.esIa && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-xs text-white text-[9px] font-bold shadow-xs">
          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
          <span>Imagen generada por IA, referencial</span>
        </div>
      )}

      {/* Botón sutil de atribución / crédito */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setMostrarCredito(!mostrarCredito);
        }}
        className="absolute bottom-2 right-2 z-10 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-xs opacity-75 group-hover:opacity-100"
        title="Ver crédito y licencia de la imagen"
      >
        <Info className="w-3 h-3" />
      </button>

      {/* Modal / tooltip de crédito al hacer click en el botón info */}
      {mostrarCredito && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-2 bottom-2 z-20 p-2.5 rounded-xl bg-stone-900/95 text-white text-[10px] leading-tight shadow-xl backdrop-blur-md animate-in fade-in"
        >
          <div className="flex items-center justify-between font-bold text-stone-200 mb-1 border-b border-stone-700 pb-1">
            <span className="truncate">{credito.nombreComun}</span>
            <button
              onClick={() => setMostrarCredito(false)}
              className="text-stone-400 hover:text-white px-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-0.5 text-stone-300">
            <div><strong>Autor:</strong> {credito.autor}</div>
            <div><strong>Licencia:</strong> {credito.licencia}</div>
            <div className="flex items-center gap-1 text-amber-400 mt-1">
              <span>{credito.fuente}</span>
              {credito.origenUrl !== '#' && (
                <a
                  href={credito.origenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center underline hover:text-amber-300"
                >
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
