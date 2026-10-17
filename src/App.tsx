/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  IncubadoraConfig,
  IncubadoraConEstado,
  PerfilEspecie,
  FiltroEstado,
  SensorDataESP32,
  LecturaHistorica,
  EstadoConexionBLE,
} from './types/incubator';
import {
  getIncubadorasStorage,
  saveIncubadorasStorage,
  getSilencioStorage,
  saveSilencioStorage,
  getPerfilesStorage,
  savePerfilesCustomStorage,
  getHistorialStorage,
  appendHistorialStorage,
  eliminarHistorialStorage,
} from './utils/storage';
import {
  simularLecturaESP32,
  generarHistorialInicial,
  reiniciarVolteoSimulado,
} from './utils/simulation';
import {
  setSilencioGlobal,
  sonarAlarmaCritica,
  sonarAlertaAdvertencia,
} from './utils/audioAlert';
import { bleManager } from './utils/bleManager';
import { Header, TabId } from './components/Header';
import { SummaryCards } from './components/Dashboard/SummaryCards';
import { AlertBanner } from './components/Dashboard/AlertBanner';
import { FilterBar } from './components/Dashboard/FilterBar';
import { IncubatorCard } from './components/Dashboard/IncubatorCard';
import { IncubatorDetailModal } from './components/Dashboard/IncubatorDetailModal';
import { ProfilesTab } from './components/Profiles/ProfilesTab';
import { SettingsTab } from './components/Settings/SettingsTab';
import { StagesTab } from './components/Stages/StagesTab';
import { GuideTab } from './components/Guide/GuideTab';
import { SketchTab } from './components/Sketch/SketchTab';
import { Egg, Plus, BookOpen } from 'lucide-react';

export default function App() {
  // Pestaña activa
  const [tabActiva, setTabActiva] = useState<TabId>('dashboard');

  // Ajustes del sistema
  const [silenciado, setSilenciado] = useState<boolean>(() => getSilencioStorage());

  // Datos - Inicia completamente vacío por requerimiento
  const [perfiles, setPerfiles] = useState<PerfilEspecie[]>(() => getPerfilesStorage());
  const [incubadorasConfigs, setIncubadorasConfigs] = useState<IncubadoraConfig[]>(() =>
    getIncubadorasStorage()
  );
  const [incubadorasEstado, setIncubadorasEstado] = useState<Record<string, IncubadoraConEstado>>({});

  // Filtros del dashboard
  const [filtroActual, setFiltroActual] = useState<FiltroEstado>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Incubadora seleccionada para modal de detalle
  const [detalleId, setDetalleId] = useState<string | null>(null);

  // Indicador visual de Sync BLE
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Registro de alertas previas para evitar repetir sonido en cada notificación
  const prevAlertasRef = useRef<Record<string, number>>({});

  // Inicializar audio y persistencia de silencio
  useEffect(() => {
    setSilencioGlobal(silenciado);
    saveSilencioStorage(silenciado);
  }, [silenciado]);

  const handleToggleSilencio = () => {
    setSilenciado((prev) => !prev);
  };

  // Sincronizar configuraciones guardadas con el estado en memoria
  useEffect(() => {
    setIncubadorasEstado((prev) => {
      const siguiente: Record<string, IncubadoraConEstado> = { ...prev };

      incubadorasConfigs.forEach((cfg) => {
        const perfil = perfiles.find((p) => p.id === cfg.perfilId) || perfiles[0];
        let historial = getHistorialStorage(cfg.id);

        if (cfg.esSimulada && historial.length === 0) {
          historial = generarHistorialInicial(cfg, perfil.temperatura, perfil.humedadNormal);
          historial.forEach((h) => appendHistorialStorage(cfg.id, h));
        }

        const estadoPrev = siguiente[cfg.id];
        siguiente[cfg.id] = {
          ...cfg,
          sensores: estadoPrev?.sensores,
          ultimaLectura: estadoPrev?.ultimaLectura,
          estadoConexion: cfg.esSimulada ? 'conectado' : estadoPrev?.estadoConexion || 'desconectado',
          enLinea: cfg.esSimulada ? true : estadoPrev?.enLinea || false,
          historial: estadoPrev?.historial?.length ? estadoPrev.historial : historial,
          avisoModoAutonomo: estadoPrev?.avisoModoAutonomo,
        };
      });

      // Limpiar incubadoras eliminadas
      Object.keys(siguiente).forEach((id) => {
        if (!incubadorasConfigs.some((c) => c.id === id)) {
          delete siguiente[id];
        }
      });

      return siguiente;
    });
  }, [incubadorasConfigs, perfiles]);

  // Manejo de Telemetría por notificaciones Web Bluetooth GATT
  useEffect(() => {
    bleManager.setCallbacks(
      // Callback: Nuevos datos de sensores recibidos por notificación BLE
      (incubadoraId: string, sensores: SensorDataESP32) => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 300);

        const lectura: LecturaHistorica = {
          timestamp: Date.now(),
          temp_aire: sensores.temp_aire,
          temp_aire2: sensores.temp_aire2,
          temp_disipador: sensores.temp_disipador,
          humedad: sensores.humedad,
          hum_dht: sensores.hum_dht,
          temp_dht: sensores.temp_dht,
          pid_salida: sensores.pid.salida,
        };

        const nuevoHistorial = appendHistorialStorage(incubadoraId, lectura);

        setIncubadorasEstado((prev) => {
          const actual = prev[incubadoraId];
          if (!actual) return prev;

          const numAlertas = sensores.alertas.length;
          const prevNum = prevAlertasRef.current[incubadoraId] || 0;

          if (numAlertas > 0 && numAlertas > prevNum && !silenciado) {
            sonarAlarmaCritica();
          }
          prevAlertasRef.current[incubadoraId] = numAlertas;

          return {
            ...prev,
            [incubadoraId]: {
              ...actual,
              sensores,
              ultimaLectura: Date.now(),
              enLinea: true,
              estadoConexion: 'conectado',
              historial: nuevoHistorial,
              avisoModoAutonomo: false,
            },
          };
        });
      },
      // Callback: Cambio de estado de conexión BLE
      (incubadoraId: string, estado: EstadoConexionBLE, mensaje?: string) => {
        setIncubadorasEstado((prev) => {
          const actual = prev[incubadoraId];
          if (!actual) return prev;

          const esDesconectado = estado === 'desconectado';
          return {
            ...prev,
            [incubadoraId]: {
              ...actual,
              estadoConexion: estado,
              enLinea: estado === 'conectado',
              errorConexion: mensaje,
              avisoModoAutonomo: esDesconectado && !actual.esSimulada,
            },
          };
        });
      }
    );
  }, [silenciado]);

  // Generador de lecturas para incubadoras marcadas como "Modo Simulación"
  useEffect(() => {
    const simuladas = incubadorasConfigs.filter((c) => c.esSimulada);
    if (simuladas.length === 0) return;

    const interval = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 200);

      simuladas.forEach((cfg) => {
        const sensores = simularLecturaESP32(cfg);
        const lectura: LecturaHistorica = {
          timestamp: Date.now(),
          temp_aire: sensores.temp_aire,
          temp_aire2: sensores.temp_aire2,
          temp_disipador: sensores.temp_disipador,
          humedad: sensores.humedad,
          hum_dht: sensores.hum_dht,
          temp_dht: sensores.temp_dht,
          pid_salida: sensores.pid.salida,
        };

        const nuevoHistorial = appendHistorialStorage(cfg.id, lectura);

        setIncubadorasEstado((prev) => {
          const actual = prev[cfg.id];
          if (!actual) return prev;

          const numAlertas = sensores.alertas.length;
          const prevNum = prevAlertasRef.current[cfg.id] || 0;
          if (numAlertas > 0 && numAlertas > prevNum && !silenciado) {
            sonarAlarmaCritica();
          }
          prevAlertasRef.current[cfg.id] = numAlertas;

          return {
            ...prev,
            [cfg.id]: {
              ...actual,
              sensores,
              ultimaLectura: Date.now(),
              enLinea: true,
              estadoConexion: 'conectado',
              historial: nuevoHistorial,
            },
          };
        });
      });
    }, 4000); // Actualización suave cada 4s en simulación

    return () => clearInterval(interval);
  }, [incubadorasConfigs, silenciado]);

  // Manejo de giro de bandeja inmediato (Bluetooth BLE o Simulación)
  const handleGirarAhora = async (configId: string) => {
    const config = incubadorasConfigs.find((c) => c.id === configId);
    if (!config) return;

    if (config.esSimulada) {
      reiniciarVolteoSimulado(configId, config.intervaloVolteoMinutos || 120);
      setIncubadorasEstado((prev) => {
        const actual = prev[configId];
        if (!actual || !actual.sensores) return prev;
        return {
          ...prev,
          [configId]: {
            ...actual,
            sensores: {
              ...actual.sensores,
              segundos_proximo_volteo: (config.intervaloVolteoMinutos || 120) * 60,
              salidas: { ...actual.sensores.salidas, motor: true },
            },
          },
        };
      });
      return;
    }

    // Dispositivo BLE real: comando compacto de escritura
    try {
      await bleManager.enviarComando(configId, { cmd: 'girar' });
    } catch (e: any) {
      console.warn('Error enviando comando BLE de giro:', e);
      alert(`No se pudo enviar el comando BLE de giro: ${e?.message || 'Error de comunicación'}`);
    }
  };

  // Control manual de actuadores (PTC, ventilador, humidificador o auto)
  const handleActuador = async (configId: string, act: 'ptc' | 'fan' | 'hum' | 'auto', v: number) => {
    const config = incubadorasConfigs.find((c) => c.id === configId);
    if (!config) return;

    if (config.esSimulada) {
      if (act === 'auto' || v < 0) {
        return;
      }
      setIncubadorasEstado((prev) => {
        const actual = prev[configId];
        if (!actual || !actual.sensores) return prev;
        const salidasActuales = actual.sensores.salidas;
        return {
          ...prev,
          [configId]: {
            ...actual,
            sensores: {
              ...actual.sensores,
              salidas: {
                ...salidasActuales,
                ptc: act === 'ptc' ? v > 0 : salidasActuales.ptc,
                ventilador: act === 'fan' ? v : salidasActuales.ventilador,
                humidificador: act === 'hum' ? v > 0 : salidasActuales.humidificador,
              },
            },
          },
        };
      });
      return;
    }

    // Dispositivo BLE real
    try {
      await bleManager.enviarComando(configId, act === 'auto' ? { cmd: 'auto' } : { act, v });
    } catch (e: any) {
      console.warn('Error enviando comando BLE de actuador:', e);
      alert(`No se pudo enviar el comando BLE de actuador: ${e?.message || 'Error de comunicación'}`);
    }
  };

  // Sincronizar parámetros térmicos y temporales con el ESP32
  const handleSincronizarParametros = async (configId: string) => {
    const config = incubadorasConfigs.find((c) => c.id === configId);
    if (!config) return;
    const perfil = perfiles.find((p) => p.id === config.perfilId) || perfiles[0];

    const params = {
      st: perfil.temperatura,
      sh: perfil.humedadNormal,
      dt: perfil.diasTotales,
      dl: perfil.diaLockdown,
      hl: perfil.humedadLockdown,
      iv: config.intervaloVolteoMinutos || 120,
    };

    if (config.esSimulada) {
      setIncubadorasEstado((prev) => {
        const actual = prev[configId];
        if (!actual || !actual.sensores) return prev;
        return {
          ...prev,
          [configId]: {
            ...actual,
            sensores: {
              ...actual.sensores,
              setpoint_temp: params.st,
              setpoint_hum: params.sh,
              dias_totales: params.dt,
            },
          },
        };
      });
      sonarAlertaAdvertencia();
      return;
    }

    try {
      await bleManager.sincronizarParametros(configId, params);
      sonarAlertaAdvertencia();
    } catch (err: any) {
      console.warn('Error sincronizando parámetros con ESP32:', err);
      alert(`No se pudo sincronizar con el ESP32: ${err?.message || 'Error BLE'}`);
    }
  };

  // Fijar día actual en el ESP32
  const handleFijarDia = async (configId: string, dia: number) => {
    const config = incubadorasConfigs.find((c) => c.id === configId);
    if (!config) return;

    if (config.esSimulada) {
      setIncubadorasEstado((prev) => {
        const actual = prev[configId];
        if (!actual || !actual.sensores) return prev;
        return {
          ...prev,
          [configId]: {
            ...actual,
            sensores: {
              ...actual.sensores,
              dia_incubacion: dia,
            },
          },
        };
      });
      return;
    }

    try {
      await bleManager.fijarDia(configId, dia);
    } catch (err: any) {
      alert(`No se pudo fijar el día en el ESP32: ${err?.message || 'Error BLE'}`);
    }
  };

  // Reiniciar contador de días a 1 en el ESP32
  const handleResetDias = async (configId: string) => {
    const config = incubadorasConfigs.find((c) => c.id === configId);
    if (!config) return;

    if (config.esSimulada) {
      setIncubadorasEstado((prev) => {
        const actual = prev[configId];
        if (!actual || !actual.sensores) return prev;
        return {
          ...prev,
          [configId]: {
            ...actual,
            sensores: {
              ...actual.sensores,
              dia_incubacion: 1,
            },
          },
        };
      });
      return;
    }

    try {
      await bleManager.reiniciarDias(configId);
    } catch (err: any) {
      alert(`No se pudo reiniciar días en el ESP32: ${err?.message || 'Error BLE'}`);
    }
  };

  // Conectar y Desconectar BLE con soporte de reconexión transparente
  const handleConectarBle = async (id: string) => {
    const config = incubadorasConfigs.find((c) => c.id === id);
    if (!config) return;

    try {
      // 1. Si ya tiene instancia activa en memoria
      if (bleManager.tieneDispositivoEnMemoria(id)) {
        await bleManager.conectarIncubadora(id);
        return;
      }

      // 2. Intentar recuperar dispositivo previamente autorizado si el navegador lo soporta
      if (config.deviceId) {
        const device = await bleManager.obtenerDispositivoAutorizado(config.deviceId);
        if (device) {
          await bleManager.conectarIncubadora(id, device);
          return;
        }
      }

      // 3. Si no está en memoria, abrir el selector nativo de Bluetooth
      const res = await bleManager.solicitarDispositivo(config.nombre);
      if (res.bluetoothDevice) {
        if (res.deviceId !== config.deviceId) {
          const mod = { ...config, deviceId: res.deviceId };
          handleActualizarIncubadora(mod);
        }
        await bleManager.conectarIncubadora(id, res.bluetoothDevice);
      }
    } catch (err: any) {
      console.warn('Fallo al conectar BLE:', err);
    }
  };

  const handleDesconectarBle = (id: string) => {
    bleManager.desconectar(id);
  };

  // CRUD Incubadoras
  const handleAgregarIncubadora = async (nueva: IncubadoraConfig, bluetoothDeviceInstance?: any) => {
    const lista = [...incubadorasConfigs, nueva];
    setIncubadorasConfigs(lista);
    saveIncubadorasStorage(lista);

    // Si viene de un emparejamiento BLE inmediato, conectar GATT
    if (bluetoothDeviceInstance && !nueva.esSimulada) {
      try {
        await bleManager.conectarIncubadora(nueva.id, bluetoothDeviceInstance);
      } catch (err) {
        console.warn('Error inicializando GATT:', err);
      }
    }
  };

  const handleActualizarIncubadora = (modificada: IncubadoraConfig) => {
    const lista = incubadorasConfigs.map((i) => (i.id === modificada.id ? modificada : i));
    setIncubadorasConfigs(lista);
    saveIncubadorasStorage(lista);
  };

  const handleEliminarIncubadora = (id: string) => {
    bleManager.desconectar(id);
    const lista = incubadorasConfigs.filter((i) => i.id !== id);
    setIncubadorasConfigs(lista);
    saveIncubadorasStorage(lista);
    eliminarHistorialStorage(id);
    if (detalleId === id) setDetalleId(null);
  };

  // CRUD Perfiles
  const handleGuardarPerfil = (perfil: PerfilEspecie) => {
    const existe = perfiles.some((p) => p.id === perfil.id);
    let nuevaLista: PerfilEspecie[];
    if (existe) {
      nuevaLista = perfiles.map((p) => (p.id === perfil.id ? perfil : p));
    } else {
      nuevaLista = [...perfiles, perfil];
    }
    setPerfiles(nuevaLista);
    savePerfilesCustomStorage(nuevaLista);
  };

  const handleEliminarPerfil = (id: string) => {
    const nuevaLista = perfiles.filter((p) => p.id !== id);
    setPerfiles(nuevaLista);
    savePerfilesCustomStorage(nuevaLista);
  };

  // Lista con estado ordenado
  const listaIncubadorasConEstado: IncubadoraConEstado[] = useMemo(() => {
    return incubadorasConfigs.map((cfg) => {
      const estado = incubadorasEstado[cfg.id];
      return (
        estado || {
          ...cfg,
          estadoConexion: cfg.esSimulada ? 'conectado' : 'desconectado',
          enLinea: !!cfg.esSimulada,
          historial: [],
        }
      );
    });
  }, [incubadorasConfigs, incubadorasEstado]);

  // Alertas activas globales
  const incubadorasEnAlerta = useMemo(() => {
    return listaIncubadorasConEstado.filter(
      (i) => i.enLinea && i.sensores && i.sensores.alertas.length > 0
    );
  }, [listaIncubadorasConEstado]);

  const haySimuladas = useMemo(() => {
    return incubadorasConfigs.some((i) => i.esSimulada);
  }, [incubadorasConfigs]);

  // Diccionario de estados de conexión para la pestaña de Dispositivos
  const estadosConexionMap = useMemo(() => {
    const map: Record<string, EstadoConexionBLE> = {};
    listaIncubadorasConEstado.forEach((inc) => {
      map[inc.id] = inc.estadoConexion;
    });
    return map;
  }, [listaIncubadorasConEstado]);

  // Conteos para filtros
  const conteosFiltros = useMemo(() => {
    const todas = listaIncubadorasConEstado.length;
    const alerta = incubadorasEnAlerta.length;
    const lockdown = listaIncubadorasConEstado.filter(
      (i) =>
        i.enLinea &&
        i.sensores &&
        i.sensores.dia_incubacion >= i.sensores.dias_totales - 3
    ).length;
    const normal = listaIncubadorasConEstado.filter(
      (i) =>
        i.enLinea &&
        (!i.sensores || i.sensores.alertas.length === 0) &&
        i.sensores &&
        i.sensores.dia_incubacion < i.sensores.dias_totales - 3
    ).length;

    return { todas, alerta, lockdown, normal };
  }, [listaIncubadorasConEstado, incubadorasEnAlerta]);

  // Incubadoras filtradas para el dashboard
  const incubadorasFiltradas = useMemo(() => {
    return listaIncubadorasConEstado.filter((inc) => {
      // Filtro de búsqueda por nombre o ID
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideNombre = inc.nombre.toLowerCase().includes(query);
        const coincideId = (inc.deviceId || inc.id).toLowerCase().includes(query);
        const perfil = perfiles.find((p) => p.id === inc.perfilId);
        const coincidePerfil = perfil?.nombre.toLowerCase().includes(query);
        if (!coincideNombre && !coincideId && !coincidePerfil) return false;
      }

      // Filtro de estado
      if (filtroActual === 'ALERTA') {
        return inc.enLinea && inc.sensores && inc.sensores.alertas.length > 0;
      }
      if (filtroActual === 'LOCKDOWN') {
        return (
          inc.enLinea &&
          inc.sensores &&
          inc.sensores.dia_incubacion >= inc.sensores.dias_totales - 3
        );
      }
      if (filtroActual === 'NORMAL') {
        return (
          inc.enLinea &&
          (!inc.sensores || inc.sensores.alertas.length === 0) &&
          inc.sensores &&
          inc.sensores.dia_incubacion < inc.sensores.dias_totales - 3
        );
      }
      return true;
    });
  }, [listaIncubadorasConEstado, filtroActual, busqueda, perfiles]);

  const incubadoraDetalle = detalleId
    ? listaIncubadorasConEstado.find((i) => i.id === detalleId)
    : null;
  const perfilDetalle = incubadoraDetalle
    ? perfiles.find((p) => p.id === incubadoraDetalle.perfilId)
    : undefined;

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-sans antialiased flex flex-col selection:bg-[#E05A36]/20 selection:text-[#E05A36]">
      {/* Cabecera persistente */}
      <Header
        tabActiva={tabActiva}
        onCambiarTab={setTabActiva}
        silenciado={silenciado}
        onToggleSilencio={handleToggleSilencio}
        isSyncing={isSyncing}
        haySimuladas={haySimuladas}
        conAlertas={incubadorasEnAlerta.length > 0}
        onNuevaIncubadora={() => setTabActiva('config')}
      />

      {/* Contenido principal según pestaña */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {tabActiva === 'dashboard' && (
          <div>
            {/* Banner global rojo de alertas activas (solo si hay alertas reales) */}
            {incubadorasEnAlerta.length > 0 && (
              <AlertBanner
                incubadorasEnAlerta={incubadorasEnAlerta}
                silenciado={silenciado}
                onToggleSilencio={handleToggleSilencio}
                onSelectIncubadora={(inc) => setDetalleId(inc.id)}
              />
            )}

            {/* Tarjetas resumen en red, huevos, alerta, lockdown (inician en 0 si está vacío) */}
            <SummaryCards incubadoras={listaIncubadorasConEstado} />

            {/* Caso 1: Aún no hay incubadoras registradas (ESTADO VACÍO REQUERIDO) */}
            {incubadorasConfigs.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-stone-200/90 shadow-xs max-w-xl mx-auto my-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-[#FFF2EB] text-[#E05A36] flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <Egg className="w-8 h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  Aún no tienes incubadoras conectadas
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-2 mb-6 max-w-md mx-auto leading-relaxed">
                  Para comenzar a monitorear la temperatura, humedad y volteo automático, empareja tu primer módulo ESP32 por Bluetooth Low Energy (BLE) o configura una unidad de simulación.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setTabActiva('config')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#E05A36] hover:bg-[#C84724] text-white text-xs sm:text-sm font-bold transition shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Conectar nueva incubadora</span>
                  </button>

                  <button
                    onClick={() => setTabActiva('guia')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-bold transition"
                  >
                    <BookOpen className="w-4 h-4 text-stone-500" />
                    <span>Ver Guía de uso</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Caso 2: Hay incubadoras configuradas por el usuario */
              <>
                {/* Barra de filtros y buscador */}
                <FilterBar
                  filtroActual={filtroActual}
                  onSelectFiltro={setFiltroActual}
                  busqueda={busqueda}
                  onCambiarBusqueda={setBusqueda}
                  conteos={conteosFiltros}
                />

                {/* Grid de incubadoras */}
                {incubadorasFiltradas.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {incubadorasFiltradas.map((inc) => {
                      const perfil = perfiles.find((p) => p.id === inc.perfilId);
                      return (
                        <IncubatorCard
                          key={inc.id}
                          incubadora={inc}
                          perfil={perfil}
                          onVerDetalle={() => setDetalleId(inc.id)}
                          onGirarAhora={() => handleGirarAhora(inc.id)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-10 text-center border border-stone-200/80 shadow-xs max-w-lg mx-auto">
                    <h3 className="text-base font-bold text-stone-800">No se encontraron resultados</h3>
                    <p className="text-xs text-stone-500 mt-1 mb-5">
                      No hay incubadoras que coincidan con el filtro "{filtroActual}" o el término de búsqueda.
                    </p>
                    <button
                      onClick={() => {
                        setFiltroActual('TODAS');
                        setBusqueda('');
                      }}
                      className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-bold transition"
                    >
                      Restablecer filtros
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tabActiva === 'perfiles' && (
          <ProfilesTab
            perfiles={perfiles}
            onGuardarPerfil={handleGuardarPerfil}
            onEliminarPerfil={handleEliminarPerfil}
          />
        )}

        {tabActiva === 'config' && (
          <SettingsTab
            incubadoras={incubadorasConfigs}
            perfiles={perfiles}
            estadosConexion={estadosConexionMap}
            onAgregarIncubadora={handleAgregarIncubadora}
            onActualizarIncubadora={handleActualizarIncubadora}
            onEliminarIncubadora={handleEliminarIncubadora}
            onConectarBle={handleConectarBle}
            onDesconectarBle={handleDesconectarBle}
          />
        )}

        {tabActiva === 'etapas' && <StagesTab />}

        {tabActiva === 'guia' && <GuideTab />}

        {tabActiva === 'sketch' && <SketchTab />}
      </main>

      {/* Modal de Detalle con gráficas de 24h y actuadores */}
      {incubadoraDetalle && (
        <IncubatorDetailModal
          incubadora={incubadoraDetalle}
          perfil={perfilDetalle}
          onClose={() => setDetalleId(null)}
          onGirarAhora={() => handleGirarAhora(incubadoraDetalle.id)}
          onActuador={(act, v) => handleActuador(incubadoraDetalle.id, act, v)}
          onSincronizarParametros={() => handleSincronizarParametros(incubadoraDetalle.id)}
          onFijarDia={(dia) => handleFijarDia(incubadoraDetalle.id, dia)}
          onResetDias={() => handleResetDias(incubadoraDetalle.id)}
          onConectarBle={() => handleConectarBle(incubadoraDetalle.id)}
        />
      )}

      {/* Pie de página cálido y sobrio */}
      <footer className="border-t border-stone-200/60 bg-[#F5EFE6]/60 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-medium text-stone-600">
            <strong>IncubaESP</strong> • Sistema de Telemetría y Control BLE para Incubadoras Automáticas ESP32
          </div>
          <div className="text-[11px] text-stone-600">
            Web Bluetooth GATT • PWA Instalable • Sin datos precargados
          </div>
        </div>
      </footer>
    </div>
  );
}
