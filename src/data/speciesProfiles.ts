import { PerfilEspecie, PerfilMixtoResultado } from '../types/incubator';

export const PERFILES_PREDETERMINADOS: PerfilEspecie[] = [
  {
    id: 'gallina',
    nombre: 'Gallina común',
    nombreCientifico: 'Gallus gallus domesticus',
    icono: '🐔',
    diasTotales: 21,
    temperatura: 37.8,
    toleranciaTemp: 0.2,
    humedadNormal: 45,
    diaLockdown: 18,
    humedadLockdown: 65,
    intervaloVolteoHoras: 2,
    rotacionDetenidaEnLockdown: true,
    notas: 'Especie estándar. En el día 18 retirar volteador, colocar malla antideslizante y subir humedad para ablandar la cáscara y evitar deshidratación de la membrana.',
  },
  {
    id: 'pato',
    nombre: 'Pato doméstico',
    nombreCientifico: 'Anas platyrhynchos domesticus',
    icono: '🦆',
    diasTotales: 28,
    temperatura: 37.5,
    toleranciaTemp: 0.3,
    humedadNormal: 55,
    diaLockdown: 25,
    humedadLockdown: 75,
    intervaloVolteoHoras: 2,
    rotacionDetenidaEnLockdown: true,
    notas: 'Los huevos de pato requieren mayor humedad y refrigeración/pulverización diaria con agua tibia de 10 a 15 min a partir del día 10 para simular la salida de la madre.',
  },
  {
    id: 'pavo',
    nombre: 'Pavo',
    nombreCientifico: 'Meleagris gallopavo',
    icono: '🦃',
    diasTotales: 28,
    temperatura: 37.6,
    toleranciaTemp: 0.2,
    humedadNormal: 50,
    diaLockdown: 25,
    humedadLockdown: 70,
    intervaloVolteoHoras: 2,
    rotacionDetenidaEnLockdown: true,
    notas: 'Cáscara más densa. Mantener buena ventilación en los últimos 4 días. Evitar abrir la incubadora durante la eclosión para no secar la membrana interna.',
  },
  {
    id: 'ganso',
    nombre: 'Ganso',
    nombreCientifico: 'Anser anser domesticus',
    icono: '🪿',
    diasTotales: 30,
    temperatura: 37.4,
    toleranciaTemp: 0.3,
    humedadNormal: 55,
    diaLockdown: 27,
    humedadLockdown: 80,
    intervaloVolteoHoras: 3,
    rotacionDetenidaEnLockdown: true,
    notas: 'Requiere volteo manual de 180° además del volteador si los huevos son muy grandes. Enfriamiento diario a temperatura ambiente y rociado con agua tibia desde el día 15.',
  },
  {
    id: 'codorniz',
    nombre: 'Codorniz (Japónica)',
    nombreCientifico: 'Coturnix japonica',
    icono: '🥚',
    diasTotales: 17,
    temperatura: 37.7,
    toleranciaTemp: 0.2,
    humedadNormal: 45,
    diaLockdown: 14,
    humedadLockdown: 65,
    intervaloVolteoHoras: 1.5,
    rotacionDetenidaEnLockdown: true,
    notas: 'Desarrollo muy rápido. El día 14 entra en lockdown. Se recomienda usar rodillos o bandejas específicas para evitar que los huevos pequeños queden aplastados o caigan.',
  },
  {
    id: 'faisan',
    nombre: 'Faisán común',
    nombreCientifico: 'Phasianus colchicus',
    icono: '🪶',
    diasTotales: 24,
    temperatura: 37.6,
    toleranciaTemp: 0.2,
    humedadNormal: 50,
    diaLockdown: 21,
    humedadLockdown: 70,
    intervaloVolteoHoras: 2,
    rotacionDetenidaEnLockdown: true,
    notas: 'Huevos de tamaño intermedio. Muy sensibles a los picos térmicos (>38.3 °C es crítico). Mantener constante la circulación forzada de aire.',
  },
];

/**
 * Calcula el perfil de compromiso cuando se mezclan dos o más especies en la misma incubadora.
 * Genera advertencias y conflictos temporales reales.
 */
export function calcularPerfilMixto(especies: PerfilEspecie[]): PerfilMixtoResultado {
  if (especies.length === 0) {
    throw new Error('Debe seleccionar al menos una especie');
  }

  const n = especies.length;
  const tempCompromiso = Number(
    (especies.reduce((sum, e) => sum + e.temperatura, 0) / n).toFixed(1)
  );
  const humCompromisoNormal = Math.round(
    especies.reduce((sum, e) => sum + e.humedadNormal, 0) / n
  );
  const humCompromisoLockdown = Math.round(
    especies.reduce((sum, e) => sum + e.humedadLockdown, 0) / n
  );
  const intervaloVolteoHoras = Number(
    (especies.reduce((sum, e) => sum + e.intervaloVolteoHoras, 0) / n).toFixed(1)
  );

  const diasMinLockdown = Math.min(...especies.map((e) => e.diaLockdown));
  const diasMaxEclosion = Math.max(...especies.map((e) => e.diasTotales));

  const conflictos: string[] = [];
  const advertencias: string[] = [];

  // Analizar conflictos de calendario (Lockdown vs Volteo)
  for (let i = 0; i < especies.length; i++) {
    for (let j = i + 1; j < especies.length; j++) {
      const e1 = especies[i];
      const e2 = especies[j];

      const diffLockdown = Math.abs(e1.diaLockdown - e2.diaLockdown);
      if (diffLockdown >= 2) {
        conflictos.push(
          `Conflicto de Lockdown entre ${e1.nombre} (Día ${e1.diaLockdown}) y ${e2.nombre} (Día ${e2.diaLockdown}): Diferencia de ${diffLockdown} días. Cuando una especie requiere suspender el volteo y subir la humedad al ${e1.humedadLockdown}%, la otra aún necesita volteo continuo para evitar adherencias embrionarias.`
        );
      }

      const diffTemp = Math.abs(e1.temperatura - e2.temperatura);
      if (diffTemp > 0.3) {
        conflictos.push(
          `Discrepancia térmica entre ${e1.nombre} (${e1.temperatura} °C) y ${e2.nombre} (${e2.temperatura} °C). Un compromiso de ${tempCompromiso} °C puede retrasar o acelerar el desarrollo metabólico de una de las dos.`
        );
      }
    }
  }

  // Advertencias generales críticas
  advertencias.push(
    'NO SE GARANTIZA EL 100% DE ÉXITO: La incubación mixta en un mismo habitáculo es una solución de compromiso. La tasa de nacimientos suele reducirse entre un 15% y un 35% respecto a incubaciones individuales.'
  );
  advertencias.push(
    `Solución física recomendada: Si no puedes usar dos incubadoras, retira manualmente los huevos que entren en lockdown a una nacedora auxiliar con alta humedad (${humCompromisoLockdown}%) y sin volteo a partir del Día ${diasMinLockdown}.`
  );
  if (especies.some((e) => e.id === 'pato' || e.id === 'ganso')) {
    advertencias.push(
      'Huevos de anátidas (pato/ganso) requieren pulverización de agua y enfriamiento diario que puede dañar o enfriar en exceso a los embriones de gallina o codorniz.'
    );
  }

  return {
    especiesSeleccionadas: especies,
    tempCompromiso,
    humCompromisoNormal,
    humCompromisoLockdown,
    intervaloVolteoHoras,
    diaLockdownSugerido: diasMinLockdown,
    diaEclosionFinal: diasMaxEclosion,
    conflictos,
    advertencias,
  };
}
