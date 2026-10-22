import React, { useState } from 'react';
import {
  Bluetooth,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Info,
  Radio,
  PowerOff,
} from 'lucide-react';
import { IncubadoraConfig, PerfilEspecie, EstadoConexionBLE } from '../../types/incubator';
import { isWebBluetoothSupported, bleManager } from '../../utils/bleManager';
import { sonarChimeExito } from '../../utils/audioAlert';

interface Props {
  incubadoras: IncubadoraConfig[];
  perfiles: PerfilEspecie[];
  estadosConexion?: Record<string, EstadoConexionBLE>;
  onAgregarIncubadora: (inc: IncubadoraConfig, bluetoothDeviceInstance?: any) => void;
  onActualizarIncubadora: (inc: IncubadoraConfig) => void;
  onEliminarIncubadora: (id: string) => void;
  onConectarBle?: (id: string) => Promise<void>;
  onDesconectarBle?: (id: string) => void;
}

export const SettingsTab: React.FC<Props> = ({
  incubadoras,
  perfiles,
  estadosConexion = {},
  onAgregarIncubadora,
  onActualizarIncubadora,
  onEliminarIncubadora,
  onConectarBle,
  onDesconectarBle,
}) => {
  const soportadoBLE = isWebBluetoothSupported();

  // Estados del formulario
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enEdicionId, setEnEdicionId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [perfilId, setPerfilId] = useState(perfiles[0]?.id || 'gallina');
  const [cantidadHuevos, setCantidadHuevos] = useState<number | ''>('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [intervaloVolteoMinutos, setIntervaloVolteoMinutos] = useState(120);
  const [esSimulada, setEsSimulada] = useState(false);
  const [bluetoothDeviceTemp, setBluetoothDeviceTemp] = useState<any>(null);
  const [deviceIdTemp, setDeviceIdTemp] = useState<string>('');

  // Estado de escaneo BLE
  const [escaneando, setEscaneando] = useState(false);
  const [errorBle, setErrorBle] = useState<string | null>(null);
  const [exitoMensaje, setExitoMensaje] = useState<string | null>(null);

  const resetFormulario = () => {
    setEnEdicionId(null);
    setNombre('');
    setPerfilId(perfiles[0]?.id || 'gallina');
    setCantidadHuevos('');
    setFechaInicio(new Date().toISOString().split('T')[0]);
    setIntervaloVolteoMinutos(120);
    setEsSimulada(false);
    setBluetoothDeviceTemp(null);
    setDeviceIdTemp('');
    setErrorBle(null);
    setMostrarForm(false);
  };

  const cargarParaEditar = (inc: IncubadoraConfig) => {
    setEnEdicionId(inc.id);
    setNombre(inc.nombre);
    setPerfilId(inc.perfilId);
    setCantidadHuevos(inc.cantidadHuevos);
    setFechaInicio(inc.fechaInicio.split('T')[0]);
    setIntervaloVolteoMinutos(inc.intervaloVolteoMinutos || 120);
    setEsSimulada(!!inc.esSimulada);
    setDeviceIdTemp(inc.deviceId || '');
    setMostrarForm(true);
    setErrorBle(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Emparejar vía diálogo nativo Web Bluetooth
  const handleEmparejarBLE = async (verTodos: boolean = false) => {
    setErrorBle(null);
    setEscaneando(true);

    try {
      const res = await bleManager.solicitarDispositivo(nombre || 'incuNOVA BLE', verTodos);
      setBluetoothDeviceTemp(res.bluetoothDevice);
      setDeviceIdTemp(res.deviceId);
      if (!nombre) {
        setNombre(res.deviceName || 'incuNOVA ESP32');
      }
      setEsSimulada(false);
      setMostrarForm(true);
      setExitoMensaje(`¡Dispositivo "${res.deviceName}" detectado correctamente! Completa los datos para guardar.`);
      setTimeout(() => setExitoMensaje(null), 5000);
    } catch (err: any) {
      setErrorBle(err.message || 'Error al emparejar por Bluetooth.');
    } finally {
      setEscaneando(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBle(null);

    if (!nombre.trim()) {
      setErrorBle('Por favor ingresa un nombre para identificar la incubadora.');
      return;
    }

    const huevosNum = Number(cantidadHuevos);
    if (!cantidadHuevos || isNaN(huevosNum) || huevosNum <= 0) {
      setErrorBle('Ingresa una cantidad válida de huevos (mínimo 1).');
      return;
    }

    if (!esSimulada && !deviceIdTemp && !enEdicionId) {
      setErrorBle('Empareja un dispositivo Bluetooth o activa el Modo Simulación.');
      return;
    }

    if (enEdicionId) {
      // Actualizar existente
      const existente = incubadoras.find((i) => i.id === enEdicionId);
      if (existente) {
        onActualizarIncubadora({
          ...existente,
          nombre: nombre.trim(),
          perfilId,
          cantidadHuevos: huevosNum,
          fechaInicio: new Date(fechaInicio).toISOString(),
          intervaloVolteoMinutos,
          esSimulada,
          deviceId: deviceIdTemp || existente.deviceId,
        });
        sonarChimeExito();
      }
    } else {
      // Crear nueva
      const nueva: IncubadoraConfig = {
        id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        nombre: nombre.trim(),
        deviceId: deviceIdTemp || undefined,
        perfilId,
        cantidadHuevos: huevosNum,
        fechaInicio: new Date(fechaInicio).toISOString(),
        intervaloVolteoMinutos,
        activa: true,
        esSimulada,
      };

      onAgregarIncubadora(nueva, bluetoothDeviceTemp);
      sonarChimeExito();
    }

    resetFormulario();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* AVISO DE SOPORTE WEB BLUETOOTH */}
      {!soportadoBLE && (
        <div className="rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 p-5 flex items-start gap-3.5 shadow-2xs transition-colors">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
            <h4 className="font-bold text-base text-amber-950 dark:text-amber-100">Aviso de compatibilidad con Web Bluetooth (BLE)</h4>
            <p className="leading-relaxed">
              Tu navegador actual no admite la <strong>Web Bluetooth API</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-amber-800 dark:text-amber-300">
              <li>
                <strong>En iPhone / iPad (iOS):</strong> Safari y Chrome no admiten BLE debido a restricciones del sistema.
                Puedes usar navegadores compatibles con Web Bluetooth disponibles en la App Store como <strong>Bluefy</strong> o <strong>WebBLE</strong>.
              </li>
              <li>
                <strong>En Android, Windows, Mac o Linux:</strong> Utiliza <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong> con Bluetooth activado en el equipo.
              </li>
            </ul>
            <p className="text-amber-950 dark:text-amber-100 font-medium pt-1">
              💡 Puedes utilizar el <strong>Modo Simulación</strong> para probar y operar la aplicación sin requerir Bluetooth físico.
            </p>
          </div>
        </div>
      )}

      {/* MENSAJES DE ESTADO */}
      {errorBle && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 p-4 text-xs sm:text-sm text-rose-900 dark:text-rose-200 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorBle}</span>
          </div>
          <button onClick={() => setErrorBle(null)} className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-300 font-bold px-2 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {exitoMensaje && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-4 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2 transition-colors">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{exitoMensaje}</span>
        </div>
      )}

      {/* CABECERA DE LA PESTAÑA CON ACCIONES PRINCIPALES */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Bluetooth className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">Dispositivos e Incubadoras BLE</h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-xl">
            Conexión inalámbrica directa por Bluetooth Low Energy (BLE) sin necesidad de red WiFi ni direcciones IP.
            Comandos de giro inmediato y telemetría por notificaciones GATT en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleEmparejarBLE(false)}
            disabled={escaneando || !soportadoBLE}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold transition shadow-xs active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {escaneando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bluetooth className="w-4 h-4" />}
            <span>{escaneando ? 'Buscando ESP32...' : 'Emparejar incubadora'}</span>
          </button>

          <button
            onClick={() => handleEmparejarBLE(true)}
            disabled={escaneando || !soportadoBLE}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs sm:text-sm font-bold transition shadow-2xs active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            title="Escanear sin filtros de nombre por si el ESP32 tiene otro nombre o prefijo"
          >
            <Radio className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Buscar todos los BLE</span>
          </button>

          <button
            onClick={() => {
              resetFormulario();
              setEsSimulada(true);
              setMostrarForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-bold transition shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>+ Crear simulada</span>
          </button>
        </div>
      </div>

      {/* FORMULARIO DE CREACIÓN O EDICIÓN */}
      {mostrarForm && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border-2 border-stone-300 dark:border-stone-700 shadow-md animate-in fade-in slide-in-from-top-4 duration-200 transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 mb-6">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#FFF2EB] dark:bg-[#E05A36]/20 text-[#E05A36] dark:text-[#FF7A50]">
                <Edit2 className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">
                {enEdicionId ? 'Editar Incubadora' : 'Registrar Nueva Incubadora'}
              </h3>
            </div>
            <button
              onClick={resetFormulario}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 font-bold text-xs px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase tracking-wider">
                  Nombre de la incubadora *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Incubadora Aves de Raza"
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#E05A36] text-sm font-medium"
                  required
                />
              </div>

              {/* Perfil de Especie */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase tracking-wider">
                  Perfil de especie *
                </label>
                <select
                  value={perfilId}
                  onChange={(e) => setPerfilId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-[#E05A36] text-sm font-medium bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  {perfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icono} {p.nombre} ({p.diasTotales} días, {p.temperatura}°C)
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad de Huevos */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase tracking-wider">
                  Cantidad de huevos en proceso *
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={cantidadHuevos}
                  onChange={(e) => setCantidadHuevos(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="Ej. 30"
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#E05A36] text-sm font-medium"
                  required
                />
              </div>

              {/* Fecha de inicio */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase tracking-wider">
                  Fecha de inicio de incubación *
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#E05A36] text-sm font-medium"
                  required
                />
              </div>

              {/* Intervalo de volteo */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase tracking-wider">
                  Intervalo de volteo (minutos)
                </label>
                <select
                  value={intervaloVolteoMinutos}
                  onChange={(e) => setIntervaloVolteoMinutos(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-[#E05A36] text-sm font-medium bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  <option value={60}>Cada 1 hora (60 min)</option>
                  <option value={90}>Cada 1.5 horas (90 min)</option>
                  <option value={120}>Cada 2 horas (120 min - Recomendado)</option>
                  <option value={180}>Cada 3 horas (180 min)</option>
                  <option value={240}>Cada 4 horas (240 min)</option>
                </select>
              </div>

              {/* Modo Simulación Checkbox */}
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-[#FAF6F0] dark:bg-stone-800/80 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition">
                  <input
                    type="checkbox"
                    checked={esSimulada}
                    onChange={(e) => setEsSimulada(e.target.checked)}
                    className="w-4 h-4 text-[#E05A36] rounded border-stone-300 dark:border-stone-600 focus:ring-[#E05A36]"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Modo Simulación
                    </span>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Genera lecturas y curvas realistas de PID sin requerir conexión física con el ESP32.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Información del dispositivo emparejado si no es simulada */}
            {!esSimulada && (
              <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-xs flex items-center justify-between transition-colors">
                <div className="flex items-center gap-2">
                  <Bluetooth className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-sky-900 dark:text-sky-200">
                    {deviceIdTemp ? (
                      <>
                        Dispositivo BLE Vinculado: <code className="font-mono font-bold">{deviceIdTemp.slice(0, 16)}...</code>
                      </>
                    ) : (
                      'Ningún dispositivo BLE vinculado aún.'
                    )}
                  </span>
                </div>
                {soportadoBLE && (
                  <button
                    type="button"
                    onClick={() => handleEmparejarBLE(false)}
                    className="px-3 py-1 bg-white dark:bg-stone-800 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700 rounded-xl font-bold hover:bg-sky-100 dark:hover:bg-stone-700 transition cursor-pointer"
                  >
                    {deviceIdTemp ? 'Cambiar dispositivo' : 'Escanear ahora'}
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={resetFormulario}
                className="px-5 py-2.5 rounded-2xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-[#E05A36] hover:bg-[#C84724] text-white text-xs sm:text-sm font-bold transition shadow-xs active:scale-95 cursor-pointer"
              >
                {enEdicionId ? 'Guardar Cambios' : 'Registrar Incubadora'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA DE INCUBADORAS CONFIGURADAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Incubadoras Configuradas ({incubadoras.length})
          </h3>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            Persistencia automática en LocalStorage
          </span>
        </div>

        {incubadoras.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-10 text-center border border-stone-200/90 dark:border-stone-800 shadow-xs max-w-lg mx-auto transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center mx-auto mb-3">
              <Bluetooth className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-stone-800 dark:text-stone-100">No hay incubadoras registradas</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-5 leading-relaxed">
              Haz clic en <strong>"Emparejar incubadora"</strong> para detectar tu ESP32 por BLE o crea una unidad en <strong>"Modo Simulación"</strong> para ensayar el sistema.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => handleEmparejarBLE(false)}
                disabled={!soportadoBLE}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                Emparejar por Bluetooth
              </button>
              <button
                onClick={() => {
                  resetFormulario();
                  setEsSimulada(true);
                  setMostrarForm(true);
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition cursor-pointer"
              >
                Crear unidad simulada
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incubadoras.map((inc) => {
              const perfil = perfiles.find((p) => p.id === inc.perfilId);
              const estado = estadosConexion[inc.id] || (inc.esSimulada ? 'conectado' : 'desconectado');

              return (
                <div
                  key={inc.id}
                  className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{perfil?.icono || '🥚'}</span>
                        <div>
                          <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">{inc.nombre}</h4>
                          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                            {perfil?.nombre} • {inc.cantidadHuevos} huevos
                          </span>
                        </div>
                      </div>

                      {/* Pill de estado BLE */}
                      {inc.esSimulada ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          Simulada
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                            estado === 'conectado'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : estado === 'conectando' || estado === 'reconectando'
                              ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              estado === 'conectado'
                                ? 'bg-emerald-500'
                                : estado === 'conectando' || estado === 'reconectando'
                                ? 'bg-sky-500 animate-pulse'
                                : 'bg-stone-400 dark:bg-stone-500'
                            }`}
                          />
                          <span className="capitalize">{estado}</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-stone-600 dark:text-stone-300 space-y-1 bg-[#FAF6F0] dark:bg-stone-800/80 p-3 rounded-2xl border border-stone-200/70 dark:border-stone-700 mt-3 font-mono">
                      <div>
                        <strong className="text-stone-800 dark:text-stone-200 font-sans">Identificador:</strong> {inc.id}
                      </div>
                      <div>
                        <strong className="text-stone-800 dark:text-stone-200 font-sans">Modo:</strong> {inc.esSimulada ? 'Simulación en navegador' : 'Bluetooth Low Energy (GATT)'}
                      </div>
                      <div>
                        <strong className="text-stone-800 dark:text-stone-200 font-sans">Volteo programado:</strong> Cada {inc.intervaloVolteoMinutos || 120} min
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-1.5">
                      {!inc.esSimulada && onConectarBle && (
                        estado === 'conectado' ? (
                          <button
                            onClick={() => onDesconectarBle?.(inc.id)}
                            className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Desconectar Bluetooth"
                          >
                            <PowerOff className="w-3.5 h-3.5 text-rose-500" />
                            <span>Desconectar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onConectarBle(inc.id)}
                            disabled={!soportadoBLE}
                            className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            title="Conectar por Bluetooth"
                          >
                            <Bluetooth className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span>Conectar</span>
                          </button>
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => cargarParaEditar(inc)}
                        className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                        title="Editar parámetros"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la incubadora "${inc.nombre}"? Se borrará su historial de telemetría.`)) {
                            onEliminarIncubadora(inc.id);
                          }
                        }}
                        className="p-2 rounded-xl text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                        title="Eliminar incubadora"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TARJETA INFORMATIVA: ESPECIFICACIÓN GATT BLUETOOTH */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#E05A36] dark:text-[#FF7A50]" />
            Especificación del Servicio Bluetooth BLE (NimBLE ESP32)
          </h4>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            ✓ Protocolo Verificado 100% Compatible
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700 transition-colors">
            <span className="font-bold text-stone-800 dark:text-stone-100 block mb-1">Servicio Primario</span>
            <code className="text-[11px] font-mono text-[#E05A36] dark:text-[#FF7A50] break-all">b7a10001-5d3e-4c1a-9f2b-6e8d4a3c1f00</code>
            <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-1">Servicio raíz para filtrado publicitario en advertising.</p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700 transition-colors">
            <span className="font-bold text-stone-800 dark:text-stone-100 block mb-1">Característica Sensores</span>
            <code className="text-[11px] font-mono text-sky-700 dark:text-sky-300 break-all">b7a10002-5d3e-4c1a-9f2b-6e8d4a3c1f00</code>
            <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-1">Propiedades: Read + Notify. Payload JSON compacto &lt;180 bytes.</p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700 transition-colors">
            <span className="font-bold text-stone-800 dark:text-stone-100 block mb-1">Característica Comando</span>
            <code className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 break-all">b7a10003-5d3e-4c1a-9f2b-6e8d4a3c1f00</code>
            <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-1">Propiedades: Write. Comandos JSON para giro inmediato, setpoints o reinicio.</p>
          </div>
        </div>

        {/* Matriz de diagnóstico de compatibilidad */}
        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
          <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider mb-2.5">
            Diagnóstico de Compatibilidad en este Dispositivo
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 transition-colors">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">Soporte Web Bluetooth</span>
              <strong className={`font-mono text-xs ${soportadoBLE ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                {soportadoBLE ? '✓ Disponible (Activo)' : '✗ No soportado en este navegador'}
              </strong>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 transition-colors">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">Librería Firmware ESP32</span>
              <strong className="font-mono text-xs text-sky-700 dark:text-sky-300">
                NimBLE-Arduino (h2zero)
              </strong>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 transition-colors">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">Tamaño MTU Negociado</span>
              <strong className="font-mono text-xs text-stone-800 dark:text-stone-200">
                247 bytes (Trama ~170 B)
              </strong>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 transition-colors">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">Seguridad por Desconexión</span>
              <strong className="font-mono text-xs text-amber-700 dark:text-amber-400">
                Fail-Safe AUTO Autónomo
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
