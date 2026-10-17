export interface EtapaDetalle {
  id: string;
  rangoDias: string;
  diaInicio: number;
  diaFin: number;
  titulo: string;
  descripcionEmbrion: string;
  tempRecomendada: string;
  humedadRecomendada: string;
  volteoActivo: boolean;
  queHacer: string[];
  erroresComunes: string[];
  ovoscopiaQueVer: string;
}

export interface CuidadoRecienNacido {
  titulo: string;
  icono: string;
  descripcion: string;
  puntosClave: string[];
}

export const ETAPAS_GALLINA: EtapaDetalle[] = [
  {
    id: 'fase1',
    rangoDias: 'Días 1 a 3',
    diaInicio: 1,
    diaFin: 3,
    titulo: 'Fase Inicial: Implantación y Primeros Latidos',
    descripcionEmbrion:
      'Aparece la línea primitiva y la placa neural. Al día 2 el corazón comienza a formarse y a latir rítmicamente (~42-44 h). En el día 3 se forma la red vascular temprana (islas de sangre). El saco vitelino comienza a expandirse sobre la yema.',
    tempRecomendada: '37.8 °C (±0.15 °C)',
    humedadRecomendada: '45% – 50% HR',
    volteoActivo: true,
    queHacer: [
      'Precalentar la incubadora vacía 24 h antes para estabilizar PID y humedad.',
      'Colocar los huevos con la punta hacia abajo (cámara de aire arriba).',
      'Activar el volteo automático (mínimo cada 2 horas).',
      'No abrir la incubadora salvo estricta necesidad para no alterar el gradiente térmico.',
    ],
    erroresComunes: [
      'Poner huevos recién sacados del frigorífico sin dejar que alcancen temperatura ambiente (provoca choque térmico y condensación).',
      'Colocar huevos con la punta hacia arriba (el embrión desarrollará su cabeza en el extremo angosto y morirá asfixiado al no alcanzar la cámara de aire).',
    ],
    ovoscopiaQueVer:
      'Día 1-2: Huevo prácticamente transparente con la yema ligeramente más oscura en el centro. Día 3: Muy difícil de ver a simple vista sin linterna de alta potencia; puede verse un diminuto punto rojizo.',
  },
  {
    id: 'fase2',
    rangoDias: 'Días 4 a 7',
    diaInicio: 4,
    diaFin: 7,
    titulo: 'Fase de Red Vascular y Primer Ovoscopio',
    descripcionEmbrion:
      'El embrión se curva en forma de C. Los ojos y el cristalino son claramente visibles como manchas oscuras. Se diferencian los esbozos de alas y patas. El alantoides crece activamente para permitir el intercambio gaseoso.',
    tempRecomendada: '37.8 °C (±0.15 °C)',
    humedadRecomendada: '45% – 50% HR',
    volteoActivo: true,
    queHacer: [
      'Primera ovoscopia en el Día 7 en un cuarto totalmente a oscuras.',
      'Identificar y retirar huevos claros (infértiles) y huevos con anillo de sangre (muerte embrionaria temprana) para evitar bacterias.',
      'Mantener la ventilación abierta al 25% para renovación de oxígeno.',
    ],
    erroresComunes: [
      'Dejar huevos infértiles o podridos dentro de la incubadora (pueden explotar por acumulación de gas e infectar toda la carga).',
      'Manipular los huevos con manos sucias (los poros de la cáscara absorben grasa y bacterias fácilmente).',
    ],
    ovoscopiaQueVer:
      'Día 7: Efecto "araña roja": se observa con nitidez un punto oscuro (ojo y embrión) del que parten decenas de finos capilares sanguíneos irradiando por toda la yema. Si se mueve la luz, se puede apreciar el movimiento del embrión.',
  },
  {
    id: 'fase3',
    rangoDias: 'Días 8 a 14',
    diaInicio: 8,
    diaFin: 14,
    titulo: 'Fase de Rápido Crecimiento y Mineralización',
    descripcionEmbrion:
      'Aparecen los folículos de las plumas (día 10). Se forman las uñas y el pico endurecido (diente de eclosión en la punta). El embrión absorbe activamente calcio de la cara interna de la cáscara para mineralizar su esqueleto.',
    tempRecomendada: '37.7 °C – 37.8 °C',
    humedadRecomendada: '45% – 50% HR',
    volteoActivo: true,
    queHacer: [
      'Verificar el consumo de agua del humidificador diariamente.',
      'Segunda ovoscopia en el Día 14 para comprobar el tamaño de la cámara de aire (debe ocupar aprox. 20-25% del volumen del huevo).',
      'Si la cámara de aire es muy pequeña, bajar ligeramente la humedad; si es muy grande, subirla.',
    ],
    erroresComunes: [
      'Humedad excesiva sostenida (impide que el huevo pierda el ~13% de peso necesario por vapor de agua; el pollito se ahogará en líquido en el día 20).',
      'Fallas en el motor de volteo (el embrión puede adherirse a la membrana interna de la cáscara causando deformidades).',
    ],
    ovoscopiaQueVer:
      'Día 14: Más de la mitad del huevo se observa completamente opaco/oscuro. Los vasos sanguíneos se han engrosado y son densos. La cámara de aire en el polo ancho está claramente delimitada por una línea diagonal limpia.',
  },
  {
    id: 'fase4',
    rangoDias: 'Días 15 a 17',
    diaInicio: 15,
    diaFin: 17,
    titulo: 'Fase de Maduración Pulmonar y Posicionamiento',
    descripcionEmbrion:
      'El embrión orienta su cuerpo longitudinalmente. La cabeza se sitúa bajo el ala derecha apuntando directamente hacia la cámara de aire. El líquido amniótico disminuye a medida que el feto traga los últimos restos proteicos.',
    tempRecomendada: '37.7 °C',
    humedadRecomendada: '48% – 52% HR',
    volteoActivo: true,
    queHacer: [
      'Inspeccionar el sistema de calefacción PTC y ventilador para garantizar cero paradas técnicas.',
      'Preparar la rejilla de eclosión o tela antideslizante para el día 18.',
      'Tercera ovoscopia rápida para descartar posibles bajas tardías.',
    ],
    erroresComunes: [
      'Sobrecalentamiento: En esta fase el embrión produce su propio calor metabólico. Si la temperatura del aire supera los 38.3 °C, se producen fallas cardíacas.',
      'Falta de oxígeno por conductos de ventilación cerrados al 100%.',
    ],
    ovoscopiaQueVer:
      'Día 17: El huevo está casi 85% opaco. Solo la cámara de aire deja pasar la luz en el polo superior. Se puede percibir cómo el embrión se reacomoda intensamente.',
  },
  {
    id: 'fase5',
    rangoDias: 'Días 18 a 21',
    diaInicio: 18,
    diaFin: 21,
    titulo: 'Lockdown (Cierre Crítico), Pipping y Eclosión',
    descripcionEmbrion:
      'Día 18: Lockdown. Día 19: El saco vitelino se retrae por completo dentro del abdomen a través del ombligo. Pipping interno (rompe la membrana de la cámara de aire y empieza a respirar con sus pulmones; se oyen píos). Día 20-21: Pipping externo (pico rompe la cáscara), giro de 360° empujando la tapa con las patas y nacimiento.',
    tempRecomendada: '37.5 °C (reducir 0.3 °C por calor metabólico)',
    humedadRecomendada: '65% – 75% HR (vital para no resecar la membrana)',
    volteoActivo: false,
    queHacer: [
      'DETENER EL VOLTEO: Retirar bandejas basculantes o rodillos y colocar los huevos en posición horizontal sobre base antideslizante.',
      'SUBIR HUMEDAD al 65%-70% de inmediato para que la membrana no se endurezca como pergamino.',
      'ABRIR VENTILACIÓN al 50%-75% (los pollitos respiran aire atmosférico activamente).',
      '¡NO ABRIR LA INCUBADORA! Cada apertura escapa la humedad en 3 segundos y el pollito puede quedar pegado a la membrana.',
    ],
    erroresComunes: [
      'Ansiedad de abrir la incubadora para "ayudar" antes de tiempo (desgarra vasos sanguíneos y provoca hemorragias letales por ombligo sin cicatrizar).',
      'Mantener el volteo activo durante el pipping (desorienta al pollito impidiendo que localice la cámara de aire).',
    ],
    ovoscopiaQueVer:
      'Día 19: En el borde de la cámara de aire se observa una sombra irregular con forma de pico empujando la membrana. En muchos huevos se nota el movimiento respiratorio.',
  },
];

export const CUIDADOS_RECIEN_NACIDO: CuidadoRecienNacido[] = [
  {
    titulo: 'Permanencia en la Incubadora (12 a 24 horas)',
    icono: '🐣',
    descripcion:
      'Los pollitos nacen húmedos y exhaustos. Deben permanecer dentro de la incubadora a 37.5 °C hasta que sus plumas estén 100% secas, esponjosas y puedan caminar con firmeza.',
    puntosClave: [
      'No necesitan comida ni agua en las primeras 24-48 horas gracias a la absorción del saco vitelino.',
      'El movimiento y piar de los primeros pollitos estimula a los que aún están picando el cascarón.',
      'Retirar en tandas rápidas solo cuando haya 4 o 5 completamente secos y activos.',
    ],
  },
  {
    titulo: 'Traslado a la Criadora y Temperatura Gradual',
    icono: '🔥',
    descripcion:
      'La criadora debe estar precalentada a 34 °C – 35 °C bajo el foco o placa térmica durante la primera semana, reduciendo 2.5 °C cada semana posterior.',
    puntosClave: [
      'Observar su comportamiento: si se amontonan bajo la fuente de calor tienen frío; si huyen a las esquinas tienen calor; si están repartidos cantando están perfectos.',
      'Piso con papel toalla absorbente rugoso durante las primeras 72 horas para evitar patas de rana (evitar periódicos lisos o cartón resbaladizo).',
    ],
  },
  {
    titulo: 'Primer Agua y Alimentación',
    icono: '💧',
    descripcion:
      'El primer contacto debe ser con agua templada. Mojar suavemente la punta del pico de cada pollito en el bebedero para que aprendan a tragar.',
    puntosClave: [
      'Añadir electrolitos o una cucharadita de azúcar/miel al agua el primer día para reponer energía del esfuerzo del nacimiento.',
      'Colocar canicas o piedras limpias en el bebedero para evitar que se mojen o se ahoguen accidentalmente.',
      'Alimento de iniciación medicado (20-22% proteína) en harina fina a partir de las 12-24 horas.',
    ],
  },
];
