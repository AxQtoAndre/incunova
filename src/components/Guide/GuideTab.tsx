import React, { useState } from 'react';
import {
  BookOpen,
  Bluetooth,
  PlusCircle,
  Egg,
  ShieldCheck,
  Zap,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Radio,
  Flame,
  Fan,
  Droplets,
  RotateCw,
  Cpu,
  Layers,
  Smartphone,
} from 'lucide-react';
import { IncubatorDiagramSvg } from './IncubatorDiagramSvg';

export const GuideTab: React.FC = () => {
  const [seccionAbierta, setSeccionAbierta] = useState<number | null>(null);

  const pasos = [
    {
      num: 1,
      titulo: 'Encendido del ESP32 y Publicidad BLE',
      icono: Bluetooth,
      resumen: 'Conecta el ESP32 a la fuente de alimentación. Comenzará a emitir advertising BLE inmediatamente.',
      detalle: (
        <div className="space-y-2 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <p>
            1. Conecta la placa ESP32 a su fuente de alimentación de 5V/12V. No necesitas configurar contraseñas de WiFi ni conectarte a routers: la comunicación es punto a punto directa por <strong>Bluetooth Low Energy (BLE)</strong>.
          </p>
          <p>
            2. La pantalla LCD 16x2 y el monitor serie mostrarán el inicio del stack NimBLE:
          </p>
          <div className="bg-stone-900 text-emerald-400 p-3 rounded-xl font-mono text-xs">
            [BLE] Stack NimBLE inicializado.<br />
            [BLE] Publicidad activa (Advertising: IncubaESP-01)<br />
            [GATT] Servicio raíz: b7a10001-5d3e-4c1a-9f2b-6e8d4a3c1f00<br />
            [ESTADO] Listo para emparejar desde la app web IncubaESP.
          </div>
          <p>
            3. El ESP32 ya se encuentra regulando la temperatura de forma autónoma con su lazo PID integrado.
          </p>
        </div>
      ),
    },
    {
      num: 2,
      titulo: 'Cómo emparejar la incubadora en la App Web',
      icono: PlusCircle,
      resumen: 'Dirígete a "Dispositivos" y pulsa "Emparejar incubadora" para seleccionarla en el diálogo nativo.',
      detalle: (
        <div className="space-y-2 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <p>
            1. En la aplicación web IncubaESP, ve a la pestaña <strong>Dispositivos</strong> o pulsa el botón <strong>+ Nueva incubadora</strong>.
          </p>
          <p>
            2. Haz clic en el botón azul <strong>Emparejar incubadora</strong>. El navegador abrirá el diálogo nativo de selección Bluetooth filtrando automáticamente los dispositivos con el prefijo <code>IncubaESP</code> y el UUID de servicio.
          </p>
          <p>
            3. Selecciona tu incubadora en la lista y presiona <strong>Vincular</strong>. La app se conectará al servidor GATT y se suscribirá automáticamente a las notificaciones en tiempo real.
          </p>
          <p>
            4. Asigna un nombre personalizado, selecciona la especie (ej. Gallina) y la cantidad de huevos que colocarás.
          </p>
        </div>
      ),
    },
    {
      num: 3,
      titulo: 'Alcance Inalámbrico y Cobertura',
      icono: Radio,
      resumen: 'Cobertura habitual de 10 a 15 metros sin obstáculos mediante Bluetooth BLE.',
      detalle: (
        <div className="space-y-2 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <p>
            • <strong>Alcance estándar:</strong> La tecnología Bluetooth Low Energy opera de manera óptima en un radio de <strong>10 a 15 metros</strong> en interiores con paredes delgadas, y hasta 30 metros en línea de vista directa.
          </p>
          <p>
            • <strong>Transmisión sin saturación de red:</strong> A diferencia de WiFi, las transmisiones BLE no interfieren con el ancho de banda de internet del hogar ni sufren por caídas de tu proveedor de red.
          </p>
          <p>
            • <strong>Notificaciones push automáticas:</strong> La app no consulta por intervalos repetitivos; el ESP32 envía los paquetes compactos por notificación cada 2 segundos, reduciendo drásticamente el consumo de batería de tu teléfono móvil o tableta.
          </p>
        </div>
      ),
    },
    {
      num: 4,
      titulo: 'Modo Autónomo de Seguridad (AUTO)',
      icono: ShieldCheck,
      resumen: 'Si sales del rango o cierras la app, el ESP32 continúa regulando sin riesgo para los embriones.',
      detalle: (
        <div className="space-y-2 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <p className="font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            ✓ Tu incubación está 100% protegida aunque apagues el teléfono o pierdas la señal Bluetooth.
          </p>
          <p>
            Al detectar la desconexión del cliente Bluetooth, el firmware ESP32 pasa de forma instantánea a <strong>MODO AUTÓNOMO (AUTO)</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-stone-600">
            <li>El control PID continúa regulando la temperatura a 37.8 °C en bucle cerrado local.</li>
            <li>El temporizador de volteo sigue rotando la bandeja cada 120 minutos con el motor paso a paso.</li>
            <li>El control de humedad mantiene el humidificador en el rango de histéresis programado.</li>
            <li>En cuanto regreses al alcance y abras la app, la reconexión se efectuará automáticamente.</li>
          </ul>
        </div>
      ),
    },
    {
      num: 5,
      titulo: '¿Qué hacer si el ESP32 no aparece en el escaneo?',
      icono: HelpCircle,
      resumen: 'Diagnóstico de Bluetooth apagado, permisos de ubicación y compatibilidad con navegadores.',
      detalle: (
        <div className="space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <strong className="text-stone-900 block font-bold mb-1">1. Compatibilidad de navegadores (iOS vs Android / PC):</strong>
            <p className="text-stone-600">
              En dispositivos <strong>iPhone o iPad (iOS)</strong>, Apple no permite que Safari ni Chrome accedan a la Web Bluetooth API nativa.
              Para usar Bluetooth en iOS, abre la app desde un navegador especializado como <strong>Bluefy</strong> o <strong>WebBLE</strong> de la App Store.
              En <strong>Android, Windows, Mac o Linux</strong>, funciona de forma nativa con Google Chrome o Microsoft Edge.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <strong className="text-stone-900 block font-bold mb-1">2. Permisos del sistema operativo:</strong>
            <p className="text-stone-600">
              Asegúrate de tener el <strong>Bluetooth encendido</strong> en los ajustes de tu sistema. En Android, el navegador requiere además tener activada la Ubicación/Dispositivos Cercanos para escanear balizas BLE.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <strong className="text-stone-900 block font-bold mb-1">3. ¿El ESP32 ya está conectado a otro teléfono?:</strong>
            <p className="text-stone-600">
              Bluetooth Low Energy permite un cliente central activo a la vez por servidor GATT. Si otro teléfono o pestaña del navegador ya está conectada al ESP32, desconéctalo primero para que vuelva a estar visible en el advertising.
            </p>
          </div>
        </div>
      ),
    },
    {
      num: 6,
      titulo: 'Carga de Huevos y Calibración Inicial',
      icono: Egg,
      resumen: 'Precalentamiento de 12 a 24 horas y orientación correcta de los huevos.',
      detalle: (
        <div className="space-y-2 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <p>
            • <strong>Precalentamiento estabilizado:</strong> Enciende la incubadora vacía entre 12 y 24 horas antes de introducir los huevos. Esto permite que el lazo PID estabilice las paredes térmicas y el agua de la bandeja.
          </p>
          <p>
            • <strong>Orientación de los huevos:</strong> Coloca siempre los huevos con la <strong>punta hacia abajo</strong> y el polo ancho (cámara de aire) hacia arriba.
          </p>
          <p>
            • <strong>Disposición de Sensores y Redundancia:</strong> El módulo principal AHT20 + BMP280 va al lado de los huevos midiendo temperatura y humedad con lectura redundante. El sensor DHT11 (GPIO 16) va al otro extremo de los huevos para corroborar y servir de respaldo. El sensor DS18B20 (GPIO 4) se adosa exclusivamente al disipador de aluminio de las placas PTC gobernadas por MOSFET IRFZ44N para supervisión de seguridad térmica y corte ante sobrecalentamiento.
          </p>
        </div>
      ),
    },
    {
      num: 7,
      titulo: 'Lockdown y Eclosión',
      icono: AlertTriangle,
      resumen: 'Detención del volteo, aumento de humedad al 65-70% y preparación para el nacimiento.',
      detalle: (
        <div className="space-y-2 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <p>
            • <strong>Día de Lockdown (Día 18 en Gallinas):</strong> La app y el ESP32 detienen el volteo de forma automática para que el embrión se oriente hacia la cámara de aire.
          </p>
          <p>
            • <strong>Retirar rodillos o bandeja basculante:</strong> Pasa los huevos a la rejilla plana de nacimiento para que los pollitos no queden atrapados entre los rodillos mecánicos.
          </p>
          <p>
            • <strong>Incrementar Humedad al 65-75%:</strong> Crucial para que las membranas no se sequen ni se peguen al plumón durante el picado externo y la eclosión.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* SECCIÓN DIAGRAMA DE ARQUITECTURA FÍSICA SVG */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs">
        <div className="mb-4">
          <span className="text-[11px] font-bold text-[#E05A36] uppercase tracking-wider">Diseño Mecánico y Electrónico</span>
          <h3 className="text-lg font-black text-stone-900">Diagrama Estructural de la Incubadora</h3>
          <p className="text-xs sm:text-sm text-stone-500">
            Ubicación espacial de actuadores, conductos térmicos de flujo recirculado y sensores redundantes.
          </p>
        </div>

        <IncubatorDiagramSvg />
      </div>

      {/* SECCIÓN PASO A PASO */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs">
        <div className="mb-6">
          <span className="text-[11px] font-bold text-[#E05A36] uppercase tracking-wider">Manual de Operación</span>
          <h3 className="text-lg font-black text-stone-900">Guía de Conexión BLE y Operación</h3>
          <p className="text-xs sm:text-sm text-stone-500">
            Haz clic en cualquier paso para desplegar instrucciones técnicas detalladas.
          </p>
        </div>

        <div className="space-y-3">
          {pasos.map((p) => {
            const Icon = p.icono;
            const abierto = seccionAbierta === p.num;

            return (
              <div
                key={p.num}
                className={`rounded-2xl border transition ${
                  abierto ? 'border-[#E05A36] bg-[#FFFBF8] shadow-xs' : 'border-stone-200 bg-white hover:bg-stone-50/70'
                }`}
              >
                <button
                  onClick={() => setSeccionAbierta(abierto ? null : p.num)}
                  className="w-full p-4 flex items-center justify-between text-left gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        abierto ? 'bg-[#E05A36] text-white' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {p.num}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                        <span>{p.titulo}</span>
                      </h4>
                      <p className="text-[11px] text-stone-500 line-clamp-1">{p.resumen}</p>
                    </div>
                  </div>

                  <div className="text-stone-400">
                    <Icon className="w-4 h-4" />
                  </div>
                </button>

                {abierto && (
                  <div className="px-5 pb-5 pt-1 border-t border-stone-200/60 animate-in fade-in duration-150">
                    {p.detalle}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
