import React, { useState } from 'react';
import {
  AlertCircle,
  Eye,
  CheckCircle,
  AlertTriangle,
  Camera,
  Calendar,
} from 'lucide-react';
import { ETAPAS_GALLINA, CUIDADOS_RECIEN_NACIDO } from '../../data/incubationStages';
import { RealImage } from '../Common/RealImage';
import { CreditsSection } from '../Common/CreditsSection';

export const StagesTab: React.FC = () => {
  const [etapaActiva, setEtapaActiva] = useState<string>('fase2'); // Día 4-7 por defecto

  // Mapeo de fotos de etapas por clave de día
  const fotosEtapa: Record<string, { ovoscopiaId: string; embrionId: string; diaLabel: string }> = {
    fase1: { ovoscopiaId: 'etapa_dia3_ovoscopia', embrionId: 'etapa_dia3_embrion', diaLabel: 'Día 3' },
    fase2: { ovoscopiaId: 'etapa_dia7_ovoscopia', embrionId: 'etapa_dia7_embrion', diaLabel: 'Día 7' },
    fase3: { ovoscopiaId: 'etapa_dia10_ovoscopia', embrionId: 'etapa_dia10_embrion', diaLabel: 'Día 10' },
    fase4: { ovoscopiaId: 'etapa_dia14_ovoscopia', embrionId: 'etapa_dia14_embrion', diaLabel: 'Día 14' },
    fase5: { ovoscopiaId: 'etapa_dia18_ovoscopia', embrionId: 'etapa_dia18_embrion', diaLabel: 'Día 18 (Lockdown)' },
  };

  const diasClaveGaleria = [
    { dia: 'Día 3', embrionId: 'etapa_dia3_embrion', ovoscopiaId: 'etapa_dia3_ovoscopia', titulo: 'Inicio Vascular', desc: 'Isla de sangre primitiva y primer latido cardíaco.' },
    { dia: 'Día 7', embrionId: 'etapa_dia7_embrion', ovoscopiaId: 'etapa_dia7_ovoscopia', titulo: 'Red en Araña', desc: 'Ojo pigmentado negro y densos vasos radiando.' },
    { dia: 'Día 10', embrionId: 'etapa_dia10_embrion', ovoscopiaId: 'etapa_dia10_ovoscopia', titulo: 'Crecimiento Rápido', desc: 'Folículos de plumón y formación del pico.' },
    { dia: 'Día 14', embrionId: 'etapa_dia14_embrion', ovoscopiaId: 'etapa_dia14_ovoscopia', titulo: 'Osificación', desc: 'Garras formadas y sombra densa en más del 60%.' },
    { dia: 'Día 18', embrionId: 'etapa_dia18_embrion', ovoscopiaId: 'etapa_dia18_ovoscopia', titulo: 'Lockdown', desc: 'Embrión llena el huevo y apunta a la cámara de aire.' },
    { dia: 'Día 21', embrionId: 'etapa_dia21_embrion', ovoscopiaId: 'etapa_dia21_ovoscopia', titulo: 'Eclosión', desc: 'Pipping activo y absorción total del saco vitelino.' },
  ];

  return (
    <div className="space-y-8">
      {/* BANNER DE VALORES DE REFERENCIA */}
      <div className="rounded-3xl bg-[#FFF9F6] border-2 border-[#FDE5DC] p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
        <div className="w-10 h-10 rounded-2xl bg-[#E05A36] text-white flex items-center justify-center shrink-0 shadow-xs">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900">
            Guía Biológica — Valores de Referencia e Imágenes Realistas
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
            Fotografías reales y referenciales en alta definición del desarrollo embrionario y ovoscopia (miraje con luz).
            Se consideran <strong>valores de referencia técnica</strong> basados en el ciclo estándar de 21 días (Gallina); verifique siempre las particularidades según la raza o condiciones climáticas.
          </p>
        </div>
      </div>

      {/* SECCIÓN 1: ANATOMÍA REAL DEL HUEVO FÉRTIL (FOTOGRAFÍA REALISTA) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs">
        <div className="mb-4">
          <span className="text-[11px] font-bold text-[#E05A36] uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            Fotografía Anatómica
          </span>
          <h3 className="text-lg font-black text-stone-900">1. Anatomía Interna del Huevo Fértil</h3>
          <p className="text-xs sm:text-sm text-stone-500">
            Estructuras vitales que sustentan el embrión: cáscara porosa, membranas testáceas, cámara de aire, clara (albúmina), chalazas y yema con disco germinal.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7">
            <RealImage
              imageId="anatomia_huevo_completo"
              className="rounded-3xl shadow-sm border border-stone-200"
            />
          </div>

          <div className="lg:col-span-5 space-y-2.5">
            <div className="p-3 bg-[#FAF6F0] rounded-2xl border border-stone-200/70 text-xs">
              <strong className="text-[#E05A36] font-bold block mb-0.5">1. Cámara de aire (Polo ancho)</strong>
              <p className="text-stone-600">Se ubica en el extremo romo. Proporciona la primera bocanada de oxígeno pulmonar en el pipping interno.</p>
            </div>

            <div className="p-3 bg-[#FAF6F0] rounded-2xl border border-stone-200/70 text-xs">
              <strong className="text-amber-800 font-bold block mb-0.5">2. Yema (Vitelo) y Disco Germinal</strong>
              <p className="text-stone-600">Depósito de nutrientes lípidos y proteicos. El blastodisco fertilizado se ubica sobre su cara superior.</p>
            </div>

            <div className="p-3 bg-[#FAF6F0] rounded-2xl border border-stone-200/70 text-xs">
              <strong className="text-sky-800 font-bold block mb-0.5">3. Chalazas y Clara (Albúmina)</strong>
              <p className="text-stone-600">Cuerdas espirales de proteína que suspenden la yema en el centro protegiéndola contra impactos mecánicos.</p>
            </div>

            <div className="p-3 bg-[#FAF6F0] rounded-2xl border border-stone-200/70 text-xs">
              <strong className="text-stone-800 font-bold block mb-0.5">4. Cáscara porosa y membranas</strong>
              <p className="text-stone-600">Barrera semipermeable con más de 7,000 poros microscópicos que permite el intercambio de oxígeno y CO2.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: LÍNEA DE TIEMPO INTERACTIVA CON FOTOGRAFÍAS */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs">
        <div className="mb-4">
          <span className="text-[11px] font-bold text-[#E05A36] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Evolución Día a Día
          </span>
          <h3 className="text-lg font-black text-stone-900">2. Desarrollo Embrionario y Ovoscopia por Etapa</h3>
          <p className="text-xs sm:text-sm text-stone-500">
            Selecciona una fase para ver las fotografías reales de ovoscopia con linterna y el estado morfológico del embrión.
          </p>
        </div>

        {/* Selector de Fases */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
          {ETAPAS_GALLINA.map((etapa) => {
            const activa = etapaActiva === etapa.id;
            return (
              <button
                key={etapa.id}
                onClick={() => setEtapaActiva(etapa.id)}
                className={`p-3 rounded-2xl border text-left transition ${
                  activa
                    ? 'border-[#E05A36] bg-[#FFF5F0] shadow-xs ring-2 ring-[#E05A36]/20'
                    : 'border-stone-200 hover:bg-stone-50 bg-white'
                }`}
              >
                <div className={`text-xs font-black ${activa ? 'text-[#E05A36]' : 'text-stone-700'}`}>
                  {etapa.rangoDias}
                </div>
                <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5 font-medium">
                  {etapa.titulo.split(':')[1] || etapa.titulo}
                </div>
              </button>
            );
          })}
        </div>

        {/* Ficha de la Fase Seleccionada */}
        {(() => {
          const etapa = ETAPAS_GALLINA.find((e) => e.id === etapaActiva) || ETAPAS_GALLINA[0];
          const fotos = fotosEtapa[etapa.id] || fotosEtapa.fase1;

          return (
            <div className="border border-stone-200/90 rounded-3xl p-5 sm:p-6 bg-[#FAF6F0]/60 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-[#E05A36] text-white">
                    {etapa.rangoDias}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-stone-900 mt-2">{etapa.titulo}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-white px-3 py-2 rounded-2xl border border-stone-200 text-xs">
                    <span className="text-stone-400 block text-[10px]">TEMPERATURA</span>
                    <strong className="text-stone-900 font-mono">{etapa.tempRecomendada}</strong>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-2xl border border-stone-200 text-xs">
                    <span className="text-stone-400 block text-[10px]">HUMEDAD</span>
                    <strong className="text-sky-700 font-mono">{etapa.humedadRecomendada}</strong>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-2xl border border-stone-200 text-xs">
                    <span className="text-stone-400 block text-[10px]">VOLTEO</span>
                    <strong className={etapa.volteoActivo ? 'text-emerald-700' : 'text-amber-800'}>
                      {etapa.volteoActivo ? 'ACTIVO' : 'SUSPENDIDO'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* FOTOS REALISTAS: Ovoscopia vs Embrión */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-3xl border border-stone-200 shadow-2xs">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-2">
                    <Eye className="w-4 h-4 text-amber-600" />
                    Vista en Ovoscopia con Linterna ({fotos.diaLabel})
                  </span>
                  <RealImage imageId={fotos.ovoscopiaId} />
                  <p className="text-[11px] text-stone-600 mt-2 leading-relaxed">
                    {etapa.ovoscopiaQueVer}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-3xl border border-stone-200 shadow-2xs">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-2">
                    <Camera className="w-4 h-4 text-[#E05A36]" />
                    Morfología del Embrión ({fotos.diaLabel})
                  </span>
                  <RealImage imageId={fotos.embrionId} />
                  <p className="text-[11px] text-stone-600 mt-2 leading-relaxed">
                    {etapa.descripcionEmbrion}
                  </p>
                </div>
              </div>

              {/* Protocolo y Errores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                  <h5 className="text-xs font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Protocolo Recomendado (Qué Hacer)
                  </h5>
                  <ul className="space-y-1.5 text-xs text-emerald-950">
                    {etapa.queHacer.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
                  <h5 className="text-xs font-bold text-rose-900 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Errores Frecuentes a Evitar
                  </h5>
                  <ul className="space-y-1.5 text-xs text-rose-950">
                    {etapa.erroresComunes.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* SECCIÓN 3: GALERÍA VISUAL DE DÍAS CLAVE 3, 7, 10, 14, 18 Y 21 */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs">
        <div className="mb-4">
          <span className="text-[11px] font-bold text-[#E05A36] uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            Galería Fotográfica Completa
          </span>
          <h3 className="text-lg font-black text-stone-900">3. Secuencia Fotográfica de Días Clave (3, 7, 10, 14, 18 y 21)</h3>
          <p className="text-xs sm:text-sm text-stone-500">
            Comparativa directa de ovoscopia con linterna y embrión para los momentos críticos de diagnóstico.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {diasClaveGaleria.map((dc, idx) => (
            <div
              key={idx}
              className="bg-[#FAF6F0] rounded-3xl p-3.5 border border-stone-200/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-[#E05A36] bg-[#FFF2EB] px-2.5 py-0.5 rounded-full border border-[#E05A36]/20">
                    {dc.dia}
                  </span>
                  <span className="text-xs font-bold text-stone-800">{dc.titulo}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <RealImage imageId={dc.ovoscopiaId} className="rounded-xl" />
                    <span className="text-[10px] text-stone-500 block text-center mt-1">Ovoscopia</span>
                  </div>
                  <div>
                    <RealImage imageId={dc.embrionId} className="rounded-xl" />
                    <span className="text-[10px] text-stone-500 block text-center mt-1">Embrión</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">{dc.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 4: PROCESO FÍSICO DE ECLOSIÓN (FOTOGRAFÍAS REALISTAS) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs">
        <div className="mb-4">
          <span className="text-[11px] font-bold text-[#E05A36] uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            Mecánica de Nacimiento
          </span>
          <h3 className="text-lg font-black text-stone-900">4. Secuencia Real de Eclosión: Picado Interno, Externo y Salida</h3>
          <p className="text-xs sm:text-sm text-stone-500">
            Fases finales que ocurren entre el día 19 y 21. Nunca fuerces la rotura del cascarón si el pollito aún no ha completado el giro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Picado Interno */}
          <div className="bg-[#FAF6F0] rounded-3xl p-4 border border-stone-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">Fase 1</span>
                <span className="text-xs font-mono text-stone-500">Día 19</span>
              </div>
              <h4 className="text-sm font-bold text-stone-900 mb-2">Picado Interno</h4>
              <RealImage imageId="eclosion_picado_interno" className="rounded-2xl mb-2" />
              <p className="text-xs text-stone-600 leading-relaxed">
                El pollito perfora con su diente de eclosión la membrana interna hacia la cámara de aire y realiza su primera respiración pulmonar. Se escuchan los primeros píos dentro del huevo.
              </p>
            </div>
          </div>

          {/* 2. Picado Externo */}
          <div className="bg-[#FAF6F0] rounded-3xl p-4 border border-stone-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">Fase 2</span>
                <span className="text-xs font-mono text-stone-500">Día 20</span>
              </div>
              <h4 className="text-sm font-bold text-stone-900 mb-2">Picado Externo</h4>
              <RealImage imageId="eclosion_picado_externo" className="rounded-2xl mb-2" />
              <p className="text-xs text-stone-600 leading-relaxed">
                Perfora un orificio estrellado en la cáscara exterior para tomar aire atmosférico. Puede descansar en este estado de 12 a 24 horas mientras termina de absorber el vitelo por su ombligo.
              </p>
            </div>
          </div>

          {/* 3. Salida y Nacimiento */}
          <div className="bg-[#FAF6F0] rounded-3xl p-4 border border-stone-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">Fase 3</span>
                <span className="text-xs font-mono text-stone-500">Día 21</span>
              </div>
              <h4 className="text-sm font-bold text-stone-900 mb-2">Salida del Cascarón</h4>
              <RealImage imageId="eclosion_salida_pollito" className="rounded-2xl mb-2" />
              <p className="text-xs text-stone-600 leading-relaxed">
                El pollito gira 360 grados cortando la tapa superior con su pico, empuja con sus patas y nace húmedo. Debe permanecer dentro de la incubadora a 37.5 °C hasta secar completamente su plumón.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 5: PRIMEROS CUIDADOS DEL RECIÉN NACIDO */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs">
        <div className="mb-4">
          <span className="text-[11px] font-bold text-[#E05A36] uppercase tracking-wider">Post-Eclosión</span>
          <h3 className="text-lg font-black text-stone-900">5. Primeros Cuidados del Pollito (24 - 48 Horas)</h3>
          <p className="text-xs sm:text-sm text-stone-500">
            Manejo adecuado de temperatura, agua con electrolitos y alimentación inicial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CUIDADOS_RECIEN_NACIDO.map((cuidado, idx) => (
            <div
              key={idx}
              className="bg-[#FAF6F0] rounded-2xl p-4 border border-stone-200/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{cuidado.icono}</span>
                  <h4 className="text-xs font-bold text-stone-900">{cuidado.titulo}</h4>
                </div>
                <p className="text-xs text-stone-600 mb-3 leading-relaxed">{cuidado.descripcion}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-stone-200/60">
                {cuidado.puntosClave.map((pt, pidx) => (
                  <div key={pidx} className="text-[11px] text-stone-700 flex items-start gap-1.5">
                    <span className="text-[#E05A36] font-bold">✓</span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 6: SECCIÓN CRÉDITOS Y LICENCIAS (OBLIGATORIA SEGÚN REQUERIMIENTO) */}
      <CreditsSection />
    </div>
  );
};
