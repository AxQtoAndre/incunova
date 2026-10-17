/**
 * Utilidad de audio con sintetizador Web Audio API para alertas audibles en IncubaESP.
 * Permite silenciar temporal o permanentemente las alarmas.
 */

let audioCtx: AudioContext | null = null;
let estaSilenciado = false;

export function inicializarAudio(): void {
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function setSilencioGlobal(silenciado: boolean): void {
  estaSilenciado = silenciado;
}

export function getSilencioGlobal(): boolean {
  return estaSilenciado;
}

/**
 * Tono de alerta de advertencia (dos pulsos suaves)
 */
export function sonarAlertaAdvertencia(): void {
  if (estaSilenciado) return;
  try {
    inicializarAudio();
    if (!audioCtx) return;

    const ahora = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ahora);
    osc.frequency.setValueAtTime(880, ahora + 0.12);

    gain.gain.setValueAtTime(0.001, ahora);
    gain.gain.exponentialRampToValueAtTime(0.15, ahora + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(ahora);
    osc.stop(ahora + 0.4);
  } catch {
    // Silently ignore browser autoplay constraints
  }
}

/**
 * Alarma crítica estridente (sobrecalentamiento o falla de sensor)
 */
export function sonarAlarmaCritica(): void {
  if (estaSilenciado) return;
  try {
    inicializarAudio();
    if (!audioCtx) return;

    const ahora = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(987.77, ahora); // B5
    osc.frequency.setValueAtTime(1318.51, ahora + 0.1); // E6
    osc.frequency.setValueAtTime(987.77, ahora + 0.2);
    osc.frequency.setValueAtTime(1318.51, ahora + 0.3);

    gain.gain.setValueAtTime(0.001, ahora);
    gain.gain.linearRampToValueAtTime(0.25, ahora + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.45);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(ahora);
    osc.stop(ahora + 0.5);
  } catch {
    // Silently ignore
  }
}

/**
 * Chime agradable de confirmación al girar huevos o guardar configuración
 */
export function sonarChimeExito(): void {
  if (estaSilenciado) return;
  try {
    inicializarAudio();
    if (!audioCtx) return;

    const ahora = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ahora); // C5
    osc.frequency.setValueAtTime(659.25, ahora + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, ahora + 0.2); // G5

    gain.gain.setValueAtTime(0.001, ahora);
    gain.gain.exponentialRampToValueAtTime(0.2, ahora + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.4);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(ahora);
    osc.stop(ahora + 0.45);
  } catch {
    // Silently ignore
  }
}
