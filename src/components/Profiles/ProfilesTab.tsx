import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Sliders,
  AlertTriangle,
  RotateCw,
  Clock,
  Thermometer,
  Droplets,
  Lock,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { PerfilEspecie, PerfilMixtoResultado } from '../../types/incubator';
import { calcularPerfilMixto } from '../../data/speciesProfiles';
import { sonarChimeExito } from '../../utils/audioAlert';
import { RealImage } from '../Common/RealImage';
import { CreditsSection } from '../Common/CreditsSection';

interface Props {
  perfiles: PerfilEspecie[];
  onGuardarPerfil: (perfil: PerfilEspecie) => void;
  onEliminarPerfil: (id: string) => void;
}

export const ProfilesTab: React.FC<Props> = ({
  perfiles,
  onGuardarPerfil,
  onEliminarPerfil,
}) => {
  // Estado para modal de crear / editar perfil
  const [modalAbierto, setModalAbierto] = useState(false);
  const [perfilEnEdicion, setPerfilEnEdicion] = useState<Partial<PerfilEspecie> | null>(null);

  // Estado para calculadora de Perfil Mixto
  const [especiesSeleccionadasMixto, setEspeciesSeleccionadasMixto] = useState<string[]>(['gallina', 'pato']);
  const [resultadoMixto, setResultadoMixto] = useState<PerfilMixtoResultado | null>(() => {
    const seleccionadas = perfiles.filter((p) => p.id === 'gallina' || p.id === 'pato');
    return seleccionadas.length >= 2 ? calcularPerfilMixto(seleccionadas) : null;
  });

  const abrirCrear = () => {
    setPerfilEnEdicion({
      id: `custom-${Date.now()}`,
      nombre: '',
      icono: '🥚',
      diasTotales: 21,
      temperatura: 37.8,
      toleranciaTemp: 0.2,
      humedadNormal: 50,
      diaLockdown: 18,
      humedadLockdown: 70,
      intervaloVolteoHoras: 2,
      rotacionDetenidaEnLockdown: true,
      notas: '',
      esPersonalizado: true,
    });
    setModalAbierto(true);
  };

  const abrirEditar = (perfil: PerfilEspecie) => {
    setPerfilEnEdicion({ ...perfil });
    setModalAbierto(true);
  };

  const handleGuardarForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfilEnEdicion || !perfilEnEdicion.nombre) return;
    onGuardarPerfil(perfilEnEdicion as PerfilEspecie);
    sonarChimeExito();
    setModalAbierto(false);
    setPerfilEnEdicion(null);
  };

  const toggleEspecieMixto = (id: string) => {
    let nuevaLista: string[];
    if (especiesSeleccionadasMixto.includes(id)) {
      if (especiesSeleccionadasMixto.length <= 2) return; // Mínimo 2
      nuevaLista = especiesSeleccionadasMixto.filter((e) => e !== id);
    } else {
      nuevaLista = [...especiesSeleccionadasMixto, id];
    }
    setEspeciesSeleccionadasMixto(nuevaLista);

    const filtradas = perfiles.filter((p) => nuevaLista.includes(p.id));
    if (filtradas.length >= 2) {
      setResultadoMixto(calcularPerfilMixto(filtradas));
    }
  };

  return (
    <div className="space-y-8">
      {/* SECCIÓN 1: PERFILES ESTÁNDAR Y PERSONALIZADOS */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">Perfiles de Especies</h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Parámetros biológicos calibrados de temperatura, humedad y ventanas de volteo.
            </p>
          </div>
          <button
            onClick={abrirCrear}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#E05A36] text-white text-xs font-bold hover:bg-[#C84724] transition shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Perfil Personalizado</span>
          </button>
        </div>

        {/* Rejilla de tarjetas de perfiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {perfiles.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition relative group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 bg-[#FAF6F0] rounded-2xl border border-stone-100">{p.icono}</span>
                    <div>
                      <h3 className="text-base font-bold text-stone-900">{p.nombre}</h3>
                      {p.nombreCientifico && (
                        <p className="text-[11px] text-stone-600 italic">{p.nombreCientifico}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition"
                      title="Editar perfil"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {p.esPersonalizado && (
                      <button
                        onClick={() => onEliminarPerfil(p.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Eliminar perfil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Galería Fotográfica Realista (Ave adulta, Huevo y Cría recién nacida) */}
                <div className="grid grid-cols-3 gap-2 mb-3.5">
                  <div className="flex flex-col">
                    <RealImage imageId={`${p.id}_adulto`} className="rounded-xl" />
                    <span className="text-[10px] font-bold text-stone-700 text-center mt-1 truncate">Ave adulta</span>
                  </div>
                  <div className="flex flex-col">
                    <RealImage imageId={`${p.id}_huevo`} className="rounded-xl" />
                    <span className="text-[10px] font-bold text-stone-700 text-center mt-1 truncate">Huevo</span>
                  </div>
                  <div className="flex flex-col">
                    <RealImage imageId={`${p.id}_cria`} className="rounded-xl" />
                    <span className="text-[10px] font-bold text-stone-700 text-center mt-1 truncate">Cría recién nacida</span>
                  </div>
                </div>

                {/* Parámetros Clave */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-[#FFF9F6] p-2.5 rounded-xl border border-[#FDE5DC]">
                    <span className="text-[10px] uppercase font-bold text-[#E05A36] flex items-center gap-1">
                      <Thermometer className="w-3 h-3" />
                      Temperatura
                    </span>
                    <div className="text-sm font-black font-mono text-stone-900 mt-0.5">
                      {p.temperatura} °C
                      <span className="text-[10px] font-normal text-stone-500 ml-1">±{p.toleranciaTemp}°C</span>
                    </div>
                  </div>

                  <div className="bg-[#F0F8FA] p-2.5 rounded-xl border border-[#D5ECF2]">
                    <span className="text-[10px] uppercase font-bold text-sky-700 flex items-center gap-1">
                      <Droplets className="w-3 h-3" />
                      Humedad Normal
                    </span>
                    <div className="text-sm font-black font-mono text-stone-900 mt-0.5">
                      {p.humedadNormal}% HR
                    </div>
                  </div>

                  <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/70">
                    <span className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Lockdown (Cierre)
                    </span>
                    <div className="text-sm font-black font-mono text-stone-900 mt-0.5">
                      Día {p.diaLockdown}
                      <span className="text-[10px] font-normal text-stone-500 ml-1">({p.humedadLockdown}% HR)</span>
                    </div>
                  </div>

                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-600 flex items-center gap-1">
                      <RotateCw className="w-3 h-3" />
                      Intervalo Volteo
                    </span>
                    <div className="text-sm font-black font-mono text-stone-900 mt-0.5">
                      Cada {p.intervaloVolteoHoras} h
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-stone-600 mb-2 px-1">
                  <span>Días totales de ciclo:</span>
                  <strong className="text-stone-900 font-mono text-sm">{p.diasTotales} días</strong>
                </div>

                <p className="text-xs text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-100 line-clamp-3">
                  {p.notas}
                </p>
              </div>

              {p.esPersonalizado && (
                <div className="mt-3 text-[10px] font-black uppercase text-amber-700 tracking-wider">
                  ★ Perfil Creado por Usuario
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: PERFIL MIXTO MULTI-ESPECIE (CALCULADORA DE COMPROMISO) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">Calculadora de "Perfil Mixto"</h3>
            <p className="text-xs text-stone-500">
              Incubación conjunta de 2 o más especies en la misma cámara.
            </p>
          </div>
        </div>

        {/* Selector de especies */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-stone-700 mb-2">
            Selecciona las especies que compartirán la incubadora (mínimo 2):
          </label>
          <div className="flex flex-wrap gap-2">
            {perfiles.map((p) => {
              const seleccionada = especiesSeleccionadasMixto.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleEspecieMixto(p.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition border ${
                    seleccionada
                      ? 'bg-[#FAF2EE] text-[#E05A36] border-[#E05A36]'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span>{p.icono}</span>
                  <span>{p.nombre}</span>
                  {seleccionada && <span className="text-[10px] font-black ml-1 text-[#E05A36]">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Resultados del cálculo de compromiso */}
        {resultadoMixto && (
          <div className="mt-6 space-y-5 animate-in fade-in duration-200">
            {/* Banner de Advertencia Clara */}
            <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 text-amber-950">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-900">
                    ADVERTENCIA CRÍTICA: NO SE GARANTIZA EL 100% DE ÉXITO
                  </h4>
                  {resultadoMixto.advertencias.map((adv, idx) => (
                    <p key={idx} className="text-xs text-amber-800 leading-relaxed">
                      • {adv}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Valores de Compromiso calculados */}
            <div>
              <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider mb-2">
                Valores de Compromiso Calculados
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FFF9F6] p-3 rounded-2xl border border-[#FDE5DC]">
                  <span className="text-[11px] font-semibold text-[#E05A36]">Temp. Compromiso</span>
                  <div className="text-xl font-black font-mono text-stone-900 mt-1">
                    {resultadoMixto.tempCompromiso} °C
                  </div>
                  <span className="text-[10px] text-stone-500">Punto medio ponderado</span>
                </div>

                <div className="bg-[#F0F8FA] p-3 rounded-2xl border border-[#D5ECF2]">
                  <span className="text-[11px] font-semibold text-sky-700">Humedad Inicial</span>
                  <div className="text-xl font-black font-mono text-stone-900 mt-1">
                    {resultadoMixto.humCompromisoNormal}% HR
                  </div>
                  <span className="text-[10px] text-stone-500">Fase de desarrollo</span>
                </div>

                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                  <span className="text-[11px] font-semibold text-amber-800">Lockdown Crítico</span>
                  <div className="text-xl font-black font-mono text-stone-900 mt-1">
                    Día {resultadoMixto.diaLockdownSugerido}
                  </div>
                  <span className="text-[10px] text-stone-500">Retirar a nacedora auxiliar</span>
                </div>

                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
                  <span className="text-[11px] font-semibold text-stone-600">Intervalo Volteo</span>
                  <div className="text-xl font-black font-mono text-stone-900 mt-1">
                    Cada {resultadoMixto.intervaloVolteoHoras} h
                  </div>
                  <span className="text-[10px] text-stone-500">Hasta el día de corte</span>
                </div>
              </div>
            </div>

            {/* Conflictos de fechas detectados */}
            {resultadoMixto.conflictos.length > 0 && (
              <div className="rounded-2xl bg-rose-50/70 border border-rose-200 p-4">
                <h4 className="text-xs font-bold text-rose-900 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Conflictos Biológicos y Temporales Detectados
                </h4>
                <div className="space-y-2">
                  {resultadoMixto.conflictos.map((conf, idx) => (
                    <div key={idx} className="text-xs text-rose-800 bg-white/70 p-2.5 rounded-xl border border-rose-100">
                      {conf}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR PERFIL */}
      {modalAbierto && perfilEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-stone-900 mb-4">
              {perfilEnEdicion.esPersonalizado ? 'Editar Perfil Personalizado' : 'Editar Parámetros de Perfil'}
            </h3>

            <form onSubmit={handleGuardarForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nombre de la Especie</label>
                <input
                  type="text"
                  required
                  value={perfilEnEdicion.nombre || ''}
                  onChange={(e) => setPerfilEnEdicion({ ...perfilEnEdicion, nombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A36]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Temperatura (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={perfilEnEdicion.temperatura ?? 37.8}
                    onChange={(e) =>
                      setPerfilEnEdicion({ ...perfilEnEdicion, temperatura: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Tolerancia (± °C)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={perfilEnEdicion.toleranciaTemp ?? 0.2}
                    onChange={(e) =>
                      setPerfilEnEdicion({ ...perfilEnEdicion, toleranciaTemp: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A36]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Humedad Normal (% HR)</label>
                  <input
                    type="number"
                    required
                    value={perfilEnEdicion.humedadNormal ?? 45}
                    onChange={(e) =>
                      setPerfilEnEdicion({ ...perfilEnEdicion, humedadNormal: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Humedad Lockdown (%)</label>
                  <input
                    type="number"
                    required
                    value={perfilEnEdicion.humedadLockdown ?? 65}
                    onChange={(e) =>
                      setPerfilEnEdicion({ ...perfilEnEdicion, humedadLockdown: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A36]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Días Totales</label>
                  <input
                    type="number"
                    required
                    value={perfilEnEdicion.diasTotales ?? 21}
                    onChange={(e) =>
                      setPerfilEnEdicion({ ...perfilEnEdicion, diasTotales: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Día Lockdown</label>
                  <input
                    type="number"
                    required
                    value={perfilEnEdicion.diaLockdown ?? 18}
                    onChange={(e) =>
                      setPerfilEnEdicion({ ...perfilEnEdicion, diaLockdown: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Volteo (Horas)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={perfilEnEdicion.intervaloVolteoHoras ?? 2}
                    onChange={(e) =>
                      setPerfilEnEdicion({ ...perfilEnEdicion, intervaloVolteoHoras: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A36]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Notas y Recomendaciones</label>
                <textarea
                  rows={2}
                  value={perfilEnEdicion.notas || ''}
                  onChange={(e) => setPerfilEnEdicion({ ...perfilEnEdicion, notas: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#E05A36]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E05A36] hover:bg-[#C84724] text-white text-xs font-bold transition shadow-xs"
                >
                  Guardar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
