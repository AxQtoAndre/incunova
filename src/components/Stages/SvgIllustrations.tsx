import React from 'react';

/**
 * Ilustraciones vectoriales originales SVG en estilo limpio, educativo y con la paleta
 * terracota/crema de incuNOVA. Adaptadas a tema claro y tema nocturno.
 */

// 1. ANATOMÍA DEL HUEVO
export const HuevoAnatomiaSvg: React.FC<{ className?: string }> = ({ className = 'w-full h-auto' }) => (
  <svg viewBox="0 0 540 380" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="anatShell" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFBF5" />
        <stop offset="100%" stopColor="#F2DFD3" />
      </linearGradient>
      <radialGradient id="anatYolk" cx="45%" cy="45%" r="60%">
        <stop offset="0%" stopColor="#FFB347" />
        <stop offset="70%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#D96800" />
      </radialGradient>
      <linearGradient id="anatAir" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E8F4F8" />
        <stop offset="100%" stopColor="#D1E8F2" />
      </linearGradient>
    </defs>

    {/* Fondo suave */}
    <rect width="540" height="380" rx="20" className="fill-[#FAF5EF] dark:fill-stone-900 transition-colors" />

    {/* Cáscara externa (Huevo horizontal) */}
    <path
      d="M 120 190 C 120 90, 260 70, 390 110 C 470 140, 480 240, 390 270 C 260 310, 120 290, 120 190 Z"
      fill="url(#anatShell)"
      stroke="#D2B49E"
      strokeWidth="4"
    />

    {/* Membrana interna */}
    <path
      d="M 125 190 C 125 96, 260 77, 385 115 C 460 144, 468 236, 385 265 C 260 303, 125 284, 125 190 Z"
      fill="#FFFDFB"
      stroke="#E6CEBD"
      strokeWidth="2"
      strokeDasharray="4 2"
    />

    {/* Cámara de Aire (en el polo ancho, derecha) */}
    <path
      d="M 430 135 C 445 150, 455 170, 455 190 C 455 210, 445 230, 430 245 C 418 225, 412 205, 412 190 C 412 175, 418 155, 430 135 Z"
      fill="url(#anatAir)"
      stroke="#79A8B8"
      strokeWidth="2"
    />

    {/* Clara / Albúmina gruesa */}
    <ellipse cx="260" cy="190" rx="145" ry="85" fill="#FFF9ED" stroke="#FCECD2" strokeWidth="2" />

    {/* Chalazas (cuerdas espirales que sujetan la yema) */}
    <path
      d="M 140 190 Q 155 180 170 190 T 200 190"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M 320 190 Q 345 180 370 190 T 405 190"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="3.5"
      strokeLinecap="round"
    />

    {/* Yema de huevo con disco germinal */}
    <circle cx="260" cy="190" r="55" fill="url(#anatYolk)" stroke="#D96800" strokeWidth="2" />

    {/* Blastodermo (disco germinal fecundado - huevo fértil en ojo de buey) */}
    <circle cx="260" cy="148" r="8" fill="#FFF5EA" stroke="#C84724" strokeWidth="2" />
    <circle cx="260" cy="148" r="3" fill="#C84724" />

    {/* LÍNEAS TÉCNICAS Y ETIQUETAS */}
    {/* Blastodermo */}
    <line x1="260" y1="140" x2="260" y2="40" stroke="#C84724" strokeWidth="1.5" strokeDasharray="3 3" />
    <rect x="170" y="25" width="180" height="24" rx="6" fill="#C84724" />
    <text x="260" y="41" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">Disco Germinal Fértil (Ojo de buey)</text>

    {/* Cámara de aire */}
    <line x1="430" y1="160" x2="470" y2="80" stroke="#488B9E" strokeWidth="1.5" strokeDasharray="3 3" />
    <rect x="420" y="58" width="105" height="22" rx="6" fill="#488B9E" />
    <text x="472" y="73" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">Cámara de aire</text>

    {/* Chalaza */}
    <line x1="165" y1="190" x2="70" y2="130" stroke="#A89484" strokeWidth="1.5" strokeDasharray="3 3" />
    <rect x="25" y="118" width="90" height="22" rx="6" fill="#A89484" />
    <text x="70" y="133" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">Chalazas</text>

    {/* Yema */}
    <line x1="260" y1="244" x2="260" y2="330" stroke="#D96800" strokeWidth="1.5" strokeDasharray="3 3" />
    <rect x="205" y="330" width="110" height="22" rx="6" fill="#D96800" />
    <text x="260" y="345" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">Yema (vitelo)</text>

    {/* Cáscara porosa */}
    <line x1="330" y1="285" x2="380" y2="330" stroke="#9E7658" strokeWidth="1.5" strokeDasharray="3 3" />
    <rect x="350" y="330" width="145" height="22" rx="6" fill="#9E7658" />
    <text x="422" y="345" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">Cáscara y membranas</text>
  </svg>
);

// 2. DESARROLLO DEL EMBRIÓN EN DÍAS CLAVE
export const EmbrionDiasClaveSvg: React.FC<{ diaSeleccionado?: number }> = ({ diaSeleccionado = 7 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {/* Día 3 */}
    <div className={`rounded-2xl p-3 border text-center transition ${diaSeleccionado <= 3 ? 'border-[#E05A36] bg-[#FFF5F0] dark:bg-stone-800/90' : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/50'}`}>
      <svg viewBox="0 0 160 160" className="w-full h-28 mx-auto">
        <ellipse cx="80" cy="80" rx="65" ry="50" fill="#FFF9F5" stroke="#E2C9B8" strokeWidth="2"/>
        <circle cx="80" cy="80" r="32" fill="#FFA533" opacity="0.85"/>
        {/* Islas de sangre */}
        <circle cx="75" cy="76" r="4" fill="#C84724"/>
        <path d="M 75 76 Q 65 70 60 76 T 55 85" fill="none" stroke="#C84724" strokeWidth="1.5"/>
        <path d="M 75 76 Q 85 70 95 73 T 100 80" fill="none" stroke="#C84724" strokeWidth="1.5"/>
        <circle cx="75" cy="76" r="8" fill="none" stroke="#C84724" strokeWidth="1" strokeDasharray="2 2"/>
      </svg>
      <div className="text-xs font-bold text-[#E05A36] dark:text-[#FF7A50] mt-1">DÍA 3</div>
      <div className="text-[11px] text-stone-600 dark:text-stone-300 font-medium">Primer latido cardíaco e islas vasculares tempranas.</div>
    </div>

    {/* Día 7 */}
    <div className={`rounded-2xl p-3 border text-center transition ${diaSeleccionado > 3 && diaSeleccionado <= 10 ? 'border-[#E05A36] bg-[#FFF5F0] dark:bg-stone-800/90' : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/50'}`}>
      <svg viewBox="0 0 160 160" className="w-full h-28 mx-auto">
        <ellipse cx="80" cy="80" rx="65" ry="50" fill="#FFF9F5" stroke="#E2C9B8" strokeWidth="2"/>
        <circle cx="75" cy="80" r="35" fill="#FF9A26" opacity="0.6"/>
        {/* Red vascular "araña" */}
        <path d="M 70 75 Q 40 50 35 70 T 45 105" fill="none" stroke="#A82810" strokeWidth="1.8"/>
        <path d="M 70 75 Q 90 45 110 65 T 115 95" fill="none" stroke="#A82810" strokeWidth="1.8"/>
        <path d="M 70 75 Q 60 110 75 120" fill="none" stroke="#A82810" strokeWidth="1.5"/>
        <path d="M 70 75 Q 85 95 100 115" fill="none" stroke="#A82810" strokeWidth="1.5"/>
        {/* Embrión con ojo */}
        <ellipse cx="70" cy="75" rx="8" ry="12" fill="#781C0B"/>
        <circle cx="68" cy="71" r="3.5" fill="#1A1A1A"/>
        <circle cx="69" cy="70" r="1" fill="#FFFFFF"/>
      </svg>
      <div className="text-xs font-bold text-[#E05A36] dark:text-[#FF7A50] mt-1">DÍA 7</div>
      <div className="text-[11px] text-stone-600 dark:text-stone-300 font-medium">Ojo visible y densa red vascular en forma de araña.</div>
    </div>

    {/* Día 14 */}
    <div className={`rounded-2xl p-3 border text-center transition ${diaSeleccionado > 10 && diaSeleccionado <= 17 ? 'border-[#E05A36] bg-[#FFF5F0] dark:bg-stone-800/90' : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/50'}`}>
      <svg viewBox="0 0 160 160" className="w-full h-28 mx-auto">
        <ellipse cx="80" cy="80" rx="65" ry="50" fill="#FFF9F5" stroke="#E2C9B8" strokeWidth="2"/>
        {/* Mitad oscura */}
        <path d="M 40 60 C 40 40, 100 45, 115 80 C 130 110, 80 125, 45 100 Z" fill="#6B2816" opacity="0.85"/>
        {/* Cámara de aire amplia arriba a la derecha */}
        <path d="M 120 50 C 135 65, 140 85, 130 105 C 120 95, 115 70, 120 50 Z" fill="#D3EAF2"/>
        {/* Silueta de ala y pico */}
        <path d="M 70 75 Q 85 80 90 92" stroke="#DDAA88" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <circle cx="65" cy="70" r="4" fill="#201510"/>
      </svg>
      <div className="text-xs font-bold text-[#E05A36] dark:text-[#FF7A50] mt-1">DÍA 14</div>
      <div className="text-[11px] text-stone-600 dark:text-stone-300 font-medium">Plumas y pico formados. Más de la mitad del huevo es opaco.</div>
    </div>

    {/* Día 18 */}
    <div className={`rounded-2xl p-3 border text-center transition ${diaSeleccionado >= 18 ? 'border-[#E05A36] bg-[#FFF5F0] dark:bg-stone-800/90' : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/50'}`}>
      <svg viewBox="0 0 160 160" className="w-full h-28 mx-auto">
        <ellipse cx="80" cy="80" rx="65" ry="50" fill="#3D1810" stroke="#E2C9B8" strokeWidth="2"/>
        {/* Cámara de aire limpia bien delimitada */}
        <path d="M 115 48 C 135 65, 142 85, 128 108 C 118 95, 112 68, 115 48 Z" fill="#D3EAF2"/>
        {/* Pico apuntando hacia la membrana de la cámara de aire */}
        <polygon points="108,74 116,77 109,82" fill="#E89E30"/>
        <circle cx="98" cy="74" r="3" fill="#111111"/>
      </svg>
      <div className="text-xs font-bold text-[#E05A36] dark:text-[#FF7A50] mt-1">DÍA 18 (LOCKDOWN)</div>
      <div className="text-[11px] text-stone-600 dark:text-stone-300 font-medium">Embrión ocupa el 90%. Pico orientado a la cámara de aire.</div>
    </div>
  </div>
);

// 3. VISTA DE OVOSCOPIA (CANDLING)
export const OvoscopiaGuiaSvg: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {/* Infértil / Claro */}
    <div className="rounded-2xl p-3 bg-stone-900 border border-stone-800 text-white flex flex-col items-center">
      <div className="relative w-28 h-36 rounded-full bg-amber-500/30 border-2 border-amber-400/40 flex items-center justify-center overflow-hidden my-2 shadow-[0_0_25px_rgba(251,191,36,0.3)]">
        <div className="w-14 h-14 rounded-full bg-amber-400/50 blur-xs"></div>
        <div className="absolute bottom-2 text-[10px] text-amber-200 font-mono">100% TRASLÚCIDO</div>
      </div>
      <span className="text-xs font-bold text-amber-300">Huevo Infértil / Claro</span>
      <p className="text-[11px] text-stone-300 text-center mt-1">Luz pasa limpia sin vasos. Descartar en el día 7 para evitar descomposición.</p>
    </div>

    {/* Fértil Día 7 (Araña) */}
    <div className="rounded-2xl p-3 bg-stone-900 border border-stone-800 text-white flex flex-col items-center">
      <div className="relative w-28 h-36 rounded-full bg-amber-600/40 border-2 border-emerald-400/60 flex items-center justify-center overflow-hidden my-2 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
        <svg viewBox="0 0 100 130" className="w-full h-full">
          {/* Cámara de aire tenue arriba */}
          <ellipse cx="50" cy="15" rx="30" ry="10" fill="#E8F4F8" opacity="0.4"/>
          {/* Ojo y araña de vasos */}
          <circle cx="48" cy="65" r="5" fill="#4A0C06"/>
          <path d="M 48 65 Q 25 45 15 65" stroke="#B91C1C" strokeWidth="1.8" fill="none"/>
          <path d="M 48 65 Q 30 85 20 95" stroke="#B91C1C" strokeWidth="1.5" fill="none"/>
          <path d="M 48 65 Q 70 50 85 60" stroke="#B91C1C" strokeWidth="1.8" fill="none"/>
          <path d="M 48 65 Q 70 85 80 105" stroke="#B91C1C" strokeWidth="1.5" fill="none"/>
        </svg>
        <span className="absolute top-2 right-2 text-[10px] bg-emerald-500/80 text-white px-1.5 py-0.5 rounded font-bold">VIVO</span>
      </div>
      <span className="text-xs font-bold text-emerald-400">Embrión Fértil Activo (D7)</span>
      <p className="text-[11px] text-stone-300 text-center mt-1">Efecto araña nítido con vasos radiando desde el punto embrionario.</p>
    </div>

    {/* Anillo de Sangre (Muerte temprana) */}
    <div className="rounded-2xl p-3 bg-stone-900 border border-stone-800 text-white flex flex-col items-center">
      <div className="relative w-28 h-36 rounded-full bg-amber-700/40 border-2 border-rose-500/60 flex items-center justify-center overflow-hidden my-2 shadow-[0_0_25px_rgba(244,63,94,0.3)]">
        <svg viewBox="0 0 100 130" className="w-full h-full">
          {/* Anillo de sangre circular estancado sin red viva */}
          <ellipse cx="50" cy="65" rx="32" ry="22" stroke="#DC2626" strokeWidth="3" fill="none" opacity="0.9"/>
          <circle cx="50" cy="65" r="3" fill="#581C10" opacity="0.5"/>
        </svg>
        <span className="absolute top-2 right-2 text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">MUERTO</span>
      </div>
      <span className="text-xs font-bold text-rose-400">Anillo de Sangre (Baja)</span>
      <p className="text-[11px] text-stone-300 text-center mt-1">La sangre se coagula en un círculo periférico. Indica muerte precoz.</p>
    </div>

    {/* Día 18 Maduro (Lockdown) */}
    <div className="rounded-2xl p-3 bg-stone-900 border border-stone-800 text-white flex flex-col items-center">
      <div className="relative w-28 h-36 rounded-full bg-stone-950 border-2 border-sky-400/60 flex items-center justify-center overflow-hidden my-2 shadow-[0_0_25px_rgba(56,189,248,0.3)]">
        <svg viewBox="0 0 100 130" className="w-full h-full">
          {/* Cámara de aire nítida superior */}
          <path d="M 20 25 C 35 35, 65 35, 80 25 C 75 10, 25 10, 20 25 Z" fill="#E0F2FE" opacity="0.85"/>
          {/* Cuerpo 90% opaco */}
          <ellipse cx="50" cy="75" rx="38" ry="45" fill="#1C1917"/>
        </svg>
        <span className="absolute top-2 right-2 text-[10px] bg-sky-500 text-white px-1.5 py-0.5 rounded font-bold">LOCKDOWN</span>
      </div>
      <span className="text-xs font-bold text-sky-300">Embrión Maduro (D18)</span>
      <p className="text-[11px] text-stone-300 text-center mt-1">Casi opaco total. Cámara de aire con borde diagonal bien marcado.</p>
    </div>
  </div>
);

// 4. POSICIÓN ANTES DE ECLOSIÓN (PIPPING INTERNO)
export const PippingInternoSvg: React.FC<{ className?: string }> = ({ className = 'w-full max-w-md mx-auto' }) => (
  <svg viewBox="0 0 400 280" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="280" rx="16" className="fill-[#FDFBF7] dark:fill-stone-900 stroke-[#EAE1D8] dark:stroke-stone-800 transition-colors" strokeWidth="1.5"/>
    
    {/* Contorno del huevo */}
    <path
      d="M 60 140 C 60 70, 180 50, 310 80 C 370 105, 375 175, 310 200 C 180 230, 60 210, 60 140 Z"
      fill="#F5EDE4"
      stroke="#D2B59D"
      strokeWidth="3"
    />

    {/* Cámara de aire (polo ancho derecho) */}
    <path
      d="M 330 95 C 345 110, 350 130, 350 145 C 350 160, 345 180, 330 195 C 315 175, 310 155, 310 145 C 310 135, 315 115, 330 95 Z"
      fill="#E1F0F7"
      stroke="#6BA3B8"
      strokeWidth="2"
    />

    {/* Membrana interna abombada empujada por el pico */}
    <path d="M 312 135 Q 319 143 312 152" stroke="#C84724" strokeWidth="2.5" fill="none"/>

    {/* Pollito en posición fetal adecuada (cabeza bajo el ala derecha) */}
    <ellipse cx="190" cy="142" rx="95" ry="60" fill="#75351E" opacity="0.9"/>
    <ellipse cx="255" cy="142" rx="35" ry="25" fill="#8F4328"/>
    
    {/* Pico triangular atravesando la membrana interna (Pipping interno) */}
    <polygon points="285,138 318,144 285,150" fill="#EAA132" stroke="#B87314" strokeWidth="1.5"/>
    <circle cx="250" cy="133" r="5" fill="#1A1A1A"/>
    <circle cx="252" cy="132" r="1.5" fill="#FFFFFF"/>

    {/* Saco vitelino siendo absorbido por el ombligo */}
    <circle cx="170" cy="165" r="18" fill="#FFB03B" stroke="#D97706" strokeWidth="1.5"/>
    <line x1="170" y1="165" x2="185" y2="152" stroke="#C84724" strokeWidth="2"/>

    {/* Etiquetas explicativas */}
    <rect x="220" y="22" width="160" height="24" rx="6" fill="#0284C7"/>
    <text x="300" y="38" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">Pipping Interno (Día 19-20)</text>

    <text x="330" y="80" textAnchor="middle" fill="#0284C7" fontSize="10" fontWeight="bold">Cámara de Aire</text>
    <text x="300" y="175" textAnchor="middle" fill="#B45309" fontSize="9" fontWeight="bold">Diente de eclosión</text>
    <text x="170" y="200" textAnchor="middle" fill="#B45309" fontSize="9" fontWeight="bold">Absorción vitelina (ombligo)</text>
  </svg>
);

// 5. POLLITO ECLOSIONANDO (PIPPING EXTERNO Y SALIDA)
export const EclosionActivaSvg: React.FC<{ className?: string }> = ({ className = 'w-full max-w-md mx-auto' }) => (
  <svg viewBox="0 0 400 280" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="280" rx="16" className="fill-[#FDFBF7] dark:fill-stone-900 stroke-[#EAE1D8] dark:stroke-stone-800 transition-colors" strokeWidth="1.5"/>

    {/* Mitad inferior del cascarón roto */}
    <path
      d="M 100 170 C 100 230, 260 230, 260 170 L 240 160 L 220 175 L 200 155 L 180 175 L 160 155 L 140 170 L 120 160 Z"
      fill="#F2E6DA"
      stroke="#CBB39C"
      strokeWidth="2.5"
    />

    {/* Cascarón superior expulsado hacia arriba */}
    <path
      d="M 120 90 C 130 50, 230 50, 240 90 L 220 100 L 200 85 L 180 102 L 160 88 L 140 102 Z"
      fill="#F2E6DA"
      stroke="#CBB39C"
      strokeWidth="2"
      transform="rotate(-12 180 90)"
    />

    {/* Pollito saliendo, plumas húmedas */}
    <ellipse cx="180" cy="155" rx="42" ry="32" fill="#E6A820"/>
    <circle cx="180" cy="125" r="26" fill="#F2B72B"/>
    
    {/* Ojo húmedo y pico abierto piando */}
    <circle cx="195" cy="120" r="4" fill="#1C1917"/>
    <circle cx="196" cy="119" r="1.2" fill="#FFFFFF"/>
    
    <polygon points="204,120 226,123 205,127" fill="#E88B17" stroke="#B86604" strokeWidth="1"/>

    {/* Ala y patita empujando el cascarón */}
    <ellipse cx="150" cy="150" rx="14" ry="9" transform="rotate(-30 150 150)" fill="#D49413"/>
    <path d="M 215 168 L 235 178" stroke="#D49413" strokeWidth="3" strokeLinecap="round"/>

    {/* Ondas sonoras de pío */}
    <path d="M 235 116 A 12 12 0 0 1 235 132" fill="none" stroke="#E05A36" strokeWidth="2" strokeLinecap="round"/>
    <path d="M 243 111 A 20 20 0 0 1 243 137" fill="none" stroke="#E05A36" strokeWidth="1.8" strokeLinecap="round"/>

    {/* Etiqueta */}
    <rect x="235" y="20" width="145" height="24" rx="6" fill="#16A34A"/>
    <text x="307" y="36" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">Nacimiento en progreso</text>
    <text x="307" y="55" textAnchor="middle" fill="#15803D" fontSize="10">¡No ayudar antes de 24h!</text>
  </svg>
);
