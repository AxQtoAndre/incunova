import { IncubadoraConfig, PerfilEspecie, LecturaHistorica } from '../types/incubator';
import { PERFILES_PREDETERMINADOS } from '../data/speciesProfiles';

const KEY_INCUBADORAS = 'incubaesp_incubadoras_v3';
const KEY_INTERVALO = 'incubaesp_intervalo_consulta_v3';
const KEY_SILENCIO = 'incubaesp_silencio_alarmas_v3';
const KEY_PERFILES_CUSTOM = 'incubaesp_perfiles_custom_v3';
const KEY_HISTORIAL_PREFIX = 'incubaesp_historial_v3_';
const KEY_TEMA_OSCURO = 'incubaesp_tema_oscuro_v1';

export function getTemaOscuroStorage(): boolean {
  try {
    const raw = localStorage.getItem(KEY_TEMA_OSCURO);
    if (raw !== null) {
      return JSON.parse(raw);
    }
    // Si no está guardado, verificar preferencia del sistema
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  } catch {
    return false;
  }
}

export function saveTemaOscuroStorage(oscuro: boolean): void {
  try {
    localStorage.setItem(KEY_TEMA_OSCURO, JSON.stringify(oscuro));
  } catch (err) {
    console.error(err);
  }
}

// Limpieza de claves previas de versiones anteriores con datos de demo
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('incubaesp_incubadoras_v2');
    localStorage.removeItem('incubaesp_modo_simulacion');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Obtiene la lista de incubadoras configuradas por el usuario.
 * Inicia completamente vacía por requerimiento explícito.
 */
export function getIncubadorasStorage(): IncubadoraConfig[] {
  try {
    const raw = localStorage.getItem(KEY_INCUBADORAS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveIncubadorasStorage(items: IncubadoraConfig[]): void {
  try {
    localStorage.setItem(KEY_INCUBADORAS, JSON.stringify(items));
  } catch (err) {
    console.error('Error guardando incubadoras en localStorage', err);
  }
}

export function getIntervaloConsulta(): number {
  try {
    const raw = localStorage.getItem(KEY_INTERVALO);
    return raw ? parseInt(raw, 10) : 5; // Segundos (5s por defecto)
  } catch {
    return 5;
  }
}

export function saveIntervaloConsulta(seg: number): void {
  try {
    localStorage.setItem(KEY_INTERVALO, seg.toString());
  } catch (err) {
    console.error(err);
  }
}

export function getSilencioStorage(): boolean {
  try {
    const raw = localStorage.getItem(KEY_SILENCIO);
    return raw ? JSON.parse(raw) : false;
  } catch {
    return false;
  }
}

export function saveSilencioStorage(silenciado: boolean): void {
  try {
    localStorage.setItem(KEY_SILENCIO, JSON.stringify(silenciado));
  } catch (err) {
    console.error(err);
  }
}

export function getPerfilesStorage(): PerfilEspecie[] {
  try {
    const raw = localStorage.getItem(KEY_PERFILES_CUSTOM);
    const custom: PerfilEspecie[] = raw ? JSON.parse(raw) : [];
    return [...PERFILES_PREDETERMINADOS, ...custom];
  } catch {
    return PERFILES_PREDETERMINADOS;
  }
}

export function savePerfilesCustomStorage(perfiles: PerfilEspecie[]): void {
  try {
    const soloCustom = perfiles.filter((p) => p.esPersonalizado);
    localStorage.setItem(KEY_PERFILES_CUSTOM, JSON.stringify(soloCustom));
  } catch (err) {
    console.error(err);
  }
}

export function getHistorialStorage(incubadoraId: string): LecturaHistorica[] {
  try {
    const raw = localStorage.getItem(`${KEY_HISTORIAL_PREFIX}${incubadoraId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendHistorialStorage(incubadoraId: string, lectura: LecturaHistorica): LecturaHistorica[] {
  try {
    const actual = getHistorialStorage(incubadoraId);
    actual.push(lectura);
    // Limitar a las últimas 120 lecturas
    const podado = actual.slice(-120);
    localStorage.setItem(`${KEY_HISTORIAL_PREFIX}${incubadoraId}`, JSON.stringify(podado));
    return podado;
  } catch {
    return [];
  }
}

export function eliminarHistorialStorage(incubadoraId: string): void {
  try {
    localStorage.removeItem(`${KEY_HISTORIAL_PREFIX}${incubadoraId}`);
  } catch {
    // Ignore
  }
}
