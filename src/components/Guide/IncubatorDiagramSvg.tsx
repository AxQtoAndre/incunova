import React, { useState } from 'react';
import {
  Flame,
  RotateCw,
  Cpu,
  Layers,
  Thermometer,
  Droplets,
} from 'lucide-react';

/**
 * Diagrama de corte transversal SVG mejorado e interactivo de la incubadora incuNOVA v3.1.
 * Refleja con precisión matemática el hardware:
 * - AHT10/20 + BMP280 (I2C 0x38/0x76) a nivel de huevos
 * - DHT11 (GPIO 16) en el extremo opuesto
 * - DS18B20 (GPIO 4) en el disipador PTC (MOSFET IRFZ44N)
 * - Ventilador PWM superior (GPIO 19)
 * - DRV8825 (STEP 32, DIR 33, EN 23) + NEMA 17
 * - Humidificador ultrasónico (GPIO 17)
 * - 3 botones físicos (B1 Temp GPIO 25, B2 Hum GPIO 26, B3 Días GPIO 27) + LCD I2C
 */
export const IncubatorDiagramSvg: React.FC<{ className?: string }> = ({
  className = 'w-full max-w-4xl mx-auto',
}) => {
  const [capaActiva, setCapaActiva] = useState<'todas' | 'termica' | 'volteo' | 'sensores'>('todas');
  const [elementoHover, setElementoHover] = useState<string | null>(null);

  const esOpaco = (capa: 'termica' | 'volteo' | 'sensores') => {
    if (capaActiva === 'todas') return 1;
    return capaActiva === capa ? 1 : 0.22;
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Selector de capas interactivas del diagrama */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 transition-colors">
        <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-stone-600 dark:text-stone-300">
          <Layers className="w-4 h-4 text-[#E05A36] dark:text-[#FF7A50]" />
          <span>Filtro de Subsistemas:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'todas', label: 'Vista General (Todo)', icon: Layers },
            { id: 'termica', label: 'Térmico & Aire (PTC / Fan)', icon: Flame },
            { id: 'volteo', label: 'Mecánica & Volteo (NEMA17 / DRV8825)', icon: RotateCw },
            { id: 'sensores', label: 'Sensores & ESP32 (AHT, BMP, DHT, DS)', icon: Cpu },
          ].map((c) => {
            const Icon = c.icon;
            const activo = capaActiva === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCapaActiva(c.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activo
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs border border-stone-300 dark:border-stone-600'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${activo ? 'text-[#E05A36] dark:text-[#FF7A50]' : 'text-stone-400 dark:text-stone-500'}`} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Vectorial de alta definición adaptado a modo claro/oscuro */}
      <div className="relative rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-2 sm:p-4 overflow-hidden shadow-inner transition-colors">
        <svg
          viewBox="0 0 820 540"
          className="w-full h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradientes de chasis y cámara */}
            <linearGradient id="chassisOuterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            <linearGradient id="insulationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FDE047" stopOpacity="0.15" />
            </linearGradient>

            <linearGradient id="innerChamberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>

            {/* Gradientes térmicos y de niebla */}
            <linearGradient id="heatFlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#F97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FDBA74" stopOpacity="0.05" />
            </linearGradient>

            <linearGradient id="mistFlowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.65" />
              <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.02" />
            </linearGradient>

            {/* Filtros de sombra suave */}
            <filter id="softShadow" x="-5%" y="-5%" width="115%" height="115%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
            <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#E05A36" floodOpacity="0.3" />
            </filter>

            {/* Marcadores de flecha */}
            <marker id="arrowRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#EF4444" />
            </marker>
            <marker id="arrowBlue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#0284C7" />
            </marker>
          </defs>

          {/* FONDO Y CHASIS EXTERIOR CON AISLAMIENTO TÉRMICO */}
          <rect width="820" height="540" className="fill-stone-50 dark:fill-stone-900 transition-colors" />

          {/* Pared exterior del chasis */}
          <rect
            x="40"
            y="25"
            width="530"
            height="490"
            rx="24"
            fill="url(#chassisOuterGrad)"
            stroke="#64748B"
            strokeWidth="3.5"
            filter="url(#softShadow)"
          />

          {/* Capa aislante de poliestireno extruido (XPS / espuma de alta densidad) */}
          <rect
            x="56"
            y="41"
            width="498"
            height="458"
            rx="16"
            fill="url(#insulationGrad)"
            stroke="#FDE047"
            strokeWidth="2"
            strokeDasharray="4 2"
          />

          {/* Cámara interior reflectante (Liner aluminizado higiénico) */}
          <rect
            x="76"
            y="61"
            width="458"
            height="418"
            rx="12"
            fill="url(#innerChamberGrad)"
            stroke="#94A3B8"
            strokeWidth="2"
          />

          {/* Ventana de inspección frontal acrílica con reflejo de luz */}
          <rect x="180" y="32" width="250" height="12" rx="4" fill="#CBD5E1" opacity="0.85" />
          <line x1="200" y1="38" x2="330" y2="38" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

          {/* Conductos laterales de recirculación de aire forzado */}
          <g opacity={esOpaco('termica')}>
            <path
              d="M 105 130 C 90 220, 90 320, 110 400"
              fill="none"
              stroke="#F97316"
              strokeWidth="3"
              strokeDasharray="6 4"
              markerEnd="url(#arrowRed)"
            />
            <path
              d="M 505 130 C 520 220, 520 320, 500 400"
              fill="none"
              stroke="#F97316"
              strokeWidth="3"
              strokeDasharray="6 4"
              markerEnd="url(#arrowRed)"
            />
            {/* Retorno central de aire tibio */}
            <path
              d="M 305 380 Q 305 300 305 210"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              opacity="0.6"
              markerEnd="url(#arrowBlue)"
            />
          </g>

          {/* SUBSISTEMA 1: CALEFACCIÓN Y VENTILACIÓN SUPERIOR */}
          <g
            id="sub-termico"
            opacity={esOpaco('termica')}
            className="transition-opacity duration-300"
            onMouseEnter={() => setElementoHover('ptc')}
            onMouseLeave={() => setElementoHover(null)}
          >
            {/* Ventilador 12V 120mm PWM (GPIO 19) */}
            <g id="ventilador-top">
              <rect x="235" y="72" width="140" height="26" rx="5" fill="#0F172A" stroke="#020617" strokeWidth="2" />
              <circle cx="305" cy="85" r="16" fill="#1E293B" />
              <line x1="290" y1="85" x2="320" y2="85" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
              <line x1="305" y1="70" x2="305" y2="100" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
              <line x1="294" y1="74" x2="316" y2="96" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="294" y1="96" x2="316" y2="74" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="305" cy="85" r="4" fill="#F8FAFC" />
              <text x="360" y="88" fill="#F1F5F9" fontSize="8" fontWeight="bold">FAN 12V</text>
            </g>

            {/* Disipador de aluminio extruido con aletas térmicas */}
            <g id="disipador-ptc">
              <rect x="205" y="106" width="200" height="34" rx="4" fill="#475569" stroke="#334155" strokeWidth="1.5" />
              {[215, 227, 239, 251, 263, 275, 287, 299, 311, 323, 335, 347, 359, 371, 383, 395].map((x) => (
                <line key={x} x1={x} y1="108" x2={x} y2="138" stroke="#1E293B" strokeWidth="2.5" />
              ))}

              {/* Bloque cerámico calefactor PTC (12V 80W) con MOSFET IRFZ44N */}
              <rect x="225" y="140" width="160" height="14" rx="3" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
              <text x="305" y="150" textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="bold">
                PTC 12V 80W (PWM IRFZ44N · GPIO 18)
              </text>

              {/* Sonda DS18B20 adosada directamente a las placas del disipador */}
              <rect x="207" y="118" width="14" height="8" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
              <circle cx="214" cy="122" r="2" fill="#38BDF8" />
              <path d="M 207 122 Q 170 120 150 145" fill="none" stroke="#0284C7" strokeWidth="1.8" strokeDasharray="3 2" />

              {/* Termostato bimetálico de respaldo mecánico (65°C Cut-off) */}
              <circle cx="395" cy="122" r="9" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
              <text x="395" y="125" textAnchor="middle" fill="#78350F" fontSize="7.5" fontWeight="black">65°</text>
            </g>

            {/* Pluma de calor hacia la bandeja */}
            <polygon points="215,155 395,155 440,240 170,240" fill="url(#heatFlowGrad)" />
          </g>

          {/* SUBSISTEMA 2: BANDEJA DE VOLTEO Y MOTOR DRV8825 */}
          <g
            id="sub-volteo"
            opacity={esOpaco('volteo')}
            className="transition-opacity duration-300"
            onMouseEnter={() => setElementoHover('volteo')}
            onMouseLeave={() => setElementoHover(null)}
          >
            {/* Rieles soporte de bandeja */}
            <rect x="120" y="275" width="370" height="10" rx="3" fill="#64748B" stroke="#475569" strokeWidth="1.5" />
            <rect x="125" y="280" width="360" height="2" fill="#94A3B8" />

            {/* 6 Rodillos basculantes */}
            {[160, 218, 276, 334, 392, 450].map((rx, idx) => (
              <g key={idx}>
                <circle cx={rx} cy="279" r="10" fill="#E2E8F0" stroke="#475569" strokeWidth="2" />
                <circle cx={rx} cy="279" r="4" fill="#0F172A" />
                <path d={`M ${rx - 7} 279 A 7 7 0 0 1 ${rx + 7} 279`} stroke="#94A3B8" strokeWidth="1.5" fill="none" />
                <rect x={rx - 1.5} y="267" width="3" height="4" fill="#475569" />
              </g>
            ))}

            {/* Huevos fértiles */}
            {[
              { x: 189, y: 256, rot: -8 },
              { x: 247, y: 256, rot: 5 },
              { x: 305, y: 256, rot: -4 },
              { x: 363, y: 256, rot: 7 },
              { x: 421, y: 256, rot: -6 },
            ].map((egg, idx) => (
              <g key={idx}>
                <ellipse
                  cx={egg.x}
                  cy={egg.y}
                  rx="20"
                  ry="15.5"
                  fill="#FFF7ED"
                  stroke="#EA580C"
                  strokeWidth="2"
                  transform={`rotate(${egg.rot} ${egg.x} ${egg.y})`}
                  filter="url(#softShadow)"
                />
                <path
                  d={`M ${egg.x - 14} ${egg.y - 4} Q ${egg.x} ${egg.y - 12} ${egg.x + 14} ${egg.y - 4}`}
                  fill="none"
                  stroke="#FED7AA"
                  strokeWidth="1.8"
                  strokeDasharray="2 1"
                  transform={`rotate(${egg.rot} ${egg.x} ${egg.y})`}
                />
              </g>
            ))}

            {/* Flecha dinámica de basculación */}
            <path
              d="M 296 230 A 16 16 0 0 1 316 230"
              fill="none"
              stroke="#EA580C"
              strokeWidth="2.5"
              markerEnd="url(#arrowRed)"
            />

            {/* Motor NEMA 17 */}
            <g id="nema17-motor">
              <rect x="495" y="248" width="46" height="50" rx="4" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
              <rect x="485" y="262" width="12" height="20" rx="1" fill="#94A3B8" />
              <circle cx="491" cy="272" r="3" fill="#0F172A" />
              <line x1="499" y1="256" x2="499" y2="290" stroke="#334155" strokeWidth="2" />
              <text x="518" y="272" textAnchor="middle" fill="#38BDF8" fontSize="7.5" fontWeight="black">NEMA17</text>
              <text x="518" y="284" textAnchor="middle" fill="#94A3B8" fontSize="6.5">1.8°/paso</text>
            </g>
          </g>

          {/* SUBSISTEMA 3: SENSORES */}
          <g
            id="sub-sensores"
            opacity={esOpaco('sensores')}
            className="transition-opacity duration-300"
            onMouseEnter={() => setElementoHover('sensores')}
            onMouseLeave={() => setElementoHover(null)}
          >
            {/* AHT20 + BMP280 */}
            <g id="modulo-aht-bmp">
              <rect x="135" y="224" width="26" height="18" rx="3" fill="#047857" stroke="#065F46" strokeWidth="1.5" filter="url(#softShadow)" />
              <circle cx="143" cy="233" r="3.5" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1" />
              <rect x="151" y="230" width="6" height="6" rx="1" fill="#D97706" />
              <line x1="135" y1="228" x2="115" y2="228" stroke="#10B981" strokeWidth="1.5" />
              <line x1="135" y1="233" x2="115" y2="233" stroke="#059669" strokeWidth="1.5" />
              <text x="148" y="217" textAnchor="middle" fill="#047857" fontSize="8" fontWeight="black">
                AHT10 / BMP280
              </text>
              <text x="148" y="249" textAnchor="middle" fill="#065F46" fontSize="7" fontWeight="bold">
                I2C (0x38 · 0x76)
              </text>
            </g>

            {/* DHT11 Respaldo */}
            <g id="sensor-dht11">
              <rect x="450" y="222" width="20" height="24" rx="3" fill="#0284C7" stroke="#0369A1" strokeWidth="1.5" filter="url(#softShadow)" />
              <line x1="454" y1="228" x2="466" y2="228" stroke="#BAE6FD" strokeWidth="1.5" />
              <line x1="454" y1="233" x2="466" y2="233" stroke="#BAE6FD" strokeWidth="1.5" />
              <line x1="454" y1="238" x2="466" y2="238" stroke="#BAE6FD" strokeWidth="1.5" />
              <text x="460" y="216" textAnchor="middle" fill="#0284C7" fontSize="8" fontWeight="black">
                DHT11
              </text>
              <text x="460" y="254" textAnchor="middle" fill="#0369A1" fontSize="7" fontWeight="bold">
                GPIO 16
              </text>
            </g>

            {/* Sonda DS18B20 */}
            <circle cx="214" cy="122" r="7" fill="none" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="2 2" />
          </g>

          {/* SUBSISTEMA 4: BANDEJA DE AGUA Y HUMIDIFICADOR */}
          <g
            id="sub-humedad"
            opacity={esOpaco('termica')}
            className="transition-opacity duration-300"
          >
            <rect x="170" y="415" width="270" height="45" rx="8" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2" />
            <rect x="174" y="432" width="262" height="24" rx="4" fill="#BAE6FD" />
            <path
              d="M 174 433 Q 235 428 305 433 T 436 433"
              stroke="#0284C7"
              strokeWidth="2"
              fill="none"
            />
            <rect x="280" y="423" width="50" height="15" rx="3" fill="#334155" stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="305" cy="430" r="4.5" fill="#38BDF8" />
            <text x="305" y="433" textAnchor="middle" fill="#0C4A6E" fontSize="6.5" fontWeight="bold">PIEZO</text>
            <polygon points="280,420 330,420 375,320 235,320" fill="url(#mistFlowGrad)" />
            <circle cx="215" cy="440" r="7" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
            <text x="215" y="443" textAnchor="middle" fill="#713F12" fontSize="6" fontWeight="bold">AGUA</text>
          </g>

          {/* GABINETE ELECTRÓNICO */}
          <g id="gabinete-control" className="transition-opacity duration-300">
            <rect
              x="585"
              y="40"
              width="215"
              height="465"
              rx="18"
              fill="#1E293B"
              stroke="#334155"
              strokeWidth="2.5"
              filter="url(#softShadow)"
            />

            <rect x="585" y="40" width="215" height="36" rx="18" fill="#0F172A" />
            <rect x="585" y="60" width="215" height="16" fill="#0F172A" />
            <text x="692" y="63" textAnchor="middle" fill="#F8FAFC" fontSize="11" fontWeight="black" letterSpacing="0.5">
              GABINETE DE CONTROL ESP32
            </text>

            {/* LCD 16x2 */}
            <rect x="602" y="90" width="180" height="60" rx="6" fill="#047857" stroke="#065F46" strokeWidth="2" />
            <rect x="612" y="98" width="160" height="44" rx="3" fill="#10B981" />
            <text x="620" y="115" fill="#064E3B" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
              HUEVOS: 37.8°C
            </text>
            <text x="620" y="132" fill="#064E3B" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
              HUM:45% D4/21
            </text>

            {/* 3 Botones Físicos */}
            <g id="tres-botones">
              <text x="605" y="172" fill="#94A3B8" fontSize="9.5" fontWeight="extrabold">
                BOTONES FÍSICOS (INPUT_PULLUP)
              </text>

              {/* Botón 1 */}
              <g transform="translate(605, 182)">
                <rect x="0" y="0" width="175" height="28" rx="8" fill="#334155" stroke="#475569" strokeWidth="1.5" />
                <circle cx="16" cy="14" r="7" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" />
                <text x="30" y="14" fill="#F1F5F9" fontSize="9" fontWeight="bold">B1: Temp en LCD</text>
                <text x="30" y="23" fill="#94A3B8" fontSize="7.5" fontFamily="monospace">GPIO 25 (PULL-UP)</text>
              </g>

              {/* Botón 2 */}
              <g transform="translate(605, 216)">
                <rect x="0" y="0" width="175" height="28" rx="8" fill="#334155" stroke="#475569" strokeWidth="1.5" />
                <circle cx="16" cy="14" r="7" fill="#0284C7" stroke="#0369A1" strokeWidth="1" />
                <text x="30" y="14" fill="#F1F5F9" fontSize="9" fontWeight="bold">B2: Humedad en LCD</text>
                <text x="30" y="23" fill="#94A3B8" fontSize="7.5" fontFamily="monospace">GPIO 26 (PULL-UP)</text>
              </g>

              {/* Botón 3 */}
              <g transform="translate(605, 250)">
                <rect x="0" y="0" width="175" height="28" rx="8" fill="#334155" stroke="#475569" strokeWidth="1.5" />
                <circle cx="16" cy="14" r="7" fill="#10B981" stroke="#047857" strokeWidth="1" />
                <text x="30" y="14" fill="#F1F5F9" fontSize="9" fontWeight="bold">B3: Días Transcurridos</text>
                <text x="30" y="23" fill="#94A3B8" fontSize="7.5" fontFamily="monospace">GPIO 27 (PULL-UP)</text>
              </g>
            </g>

            {/* ESP32 */}
            <g id="modulo-esp32" transform="translate(605, 292)">
              <rect x="0" y="0" width="175" height="66" rx="8" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
              <rect x="10" y="8" width="45" height="50" rx="3" fill="#1E293B" />
              <path d="M 16 14 L 46 14 L 46 22 L 20 22 L 20 30 L 46 30" fill="none" stroke="#F59E0B" strokeWidth="1.8" />
              <text x="70" y="26" fill="#F8FAFC" fontSize="10.5" fontWeight="extrabold">ESP32 WROOM</text>
              <text x="70" y="38" fill="#38BDF8" fontSize="8.5" fontWeight="bold">Web Bluetooth BLE</text>
              <text x="70" y="50" fill="#94A3B8" fontSize="7.5">38 Pines · 240MHz</text>
            </g>

            {/* DRV8825 */}
            <g id="modulo-drv8825" transform="translate(605, 368)">
              <rect x="0" y="0" width="175" height="50" rx="8" fill="#3B170B" stroke="#78350F" strokeWidth="1.5" />
              <rect x="8" y="10" width="28" height="30" rx="2" fill="#78350F" />
              <rect x="12" y="14" width="20" height="22" rx="1" fill="#9333EA" />
              <text x="46" y="24" fill="#FEF3C7" fontSize="9.5" fontWeight="extrabold">DRIVER DRV8825</text>
              <text x="46" y="36" fill="#FDE68A" fontSize="7.5" fontFamily="monospace">STEP: 32 · DIR: 33 · EN: 23</text>
              <text x="46" y="45" fill="#D6D3D1" fontSize="7">1/32 Micropasos silentes</text>
            </g>

            {/* Protección térmica */}
            <g transform="translate(605, 430)">
              <rect x="0" y="0" width="175" height="55" rx="8" fill="#450A0A" stroke="#991B1B" strokeWidth="1.5" />
              <text x="10" y="18" fill="#FCA5A5" fontSize="9" fontWeight="black">PROTECCIÓN TÉRMICA ACTIVA</text>
              <text x="10" y="31" fill="#FECACA" fontSize="7.5">• DS18B20 corta PTC a 65°C</text>
              <text x="10" y="42" fill="#FECACA" fontSize="7.5">• Aire corta a 39.5°C máx.</text>
              <text x="10" y="51" fill="#FECACA" fontSize="7.5">• Vuelta a AUTO al cortar BLE</text>
            </g>
          </g>

          {/* Líneas guía */}
          <path d="M 375 80 L 450 60 L 585 60" fill="none" stroke="#64748B" strokeWidth="1.2" strokeDasharray="3 2" />
          <circle cx="375" cy="80" r="3" fill="#64748B" />

          <path d="M 214 118 L 180 95 L 140 95" fill="none" stroke="#DC2626" strokeWidth="1.2" strokeDasharray="3 2" />
          <circle cx="214" cy="118" r="3" fill="#DC2626" />
          <text x="135" y="92" textAnchor="end" fill="#DC2626" fontSize="8" fontWeight="bold">DS18B20 (GPIO 4 Disipador)</text>

          <path d="M 541 270 L 575 270 L 605 385" fill="none" stroke="#9333EA" strokeWidth="1.2" strokeDasharray="3 2" />
          <circle cx="541" cy="270" r="3" fill="#9333EA" />
        </svg>
      </div>

      {/* Tarjetas resumen de los componentes para rápida referencia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs transition-colors">
          <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-100 mb-1">
            <Thermometer className="w-3.5 h-3.5 text-[#E05A36] dark:text-[#FF7A50]" />
            <span>Zona Superior (Calor)</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
            Ventilador 12V PWM impulsando aire a través del disipador PTC con sensor DS18B20 de corte térmico.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs transition-colors">
          <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-100 mb-1">
            <RotateCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Zona Central (Volteo)</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
            5 rodillos motorizados por NEMA 17 y DRV8825 (STEP 32, DIR 33, EN 23) rotando los embriones cada 120 min.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs transition-colors">
          <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-100 mb-1">
            <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Sensores Triples</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
            AHT10/20 + BMP280 (I2C) en flanco izquierdo y DHT11 (GPIO 16) como respaldo en el flanco derecho.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs transition-colors">
          <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-100 mb-1">
            <Droplets className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Zona Inferior (Humedad)</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
            Bandeja de recarga con nebulizador piezoeléctrico ultrasónico (GPIO 17) para niebla fría sin calor residual.
          </p>
        </div>
      </div>
    </div>
  );
};
