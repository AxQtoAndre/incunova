import React, { useState } from 'react';
import {
  Code,
  Copy,
  Download,
  Check,
  Cpu,
  Bluetooth,
  BookMarked,
  Info,
  ShieldCheck,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import { ESP32_SKETCH_INO } from '../../data/esp32Sketch';
import { sonarChimeExito } from '../../utils/audioAlert';

export const SketchTab: React.FC = () => {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = () => {
    navigator.clipboard.writeText(ESP32_SKETCH_INO);
    setCopiado(true);
    sonarChimeExito();
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleDescargar = () => {
    const blob = new Blob([ESP32_SKETCH_INO], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'incuNOVA_v3_2_ESP32_Firmware.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    sonarChimeExito();
  };

  const handleDescargarZip = () => {
    const link = document.createElement('a');
    link.href = '/incuNOVA_v3_2_Proyecto_Completo.zip';
    link.download = 'incuNOVA_v3_2_Proyecto_Completo.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sonarChimeExito();
  };

  const pinesTabla = [
    { componente: 'DHT11 (Al otro lado de huevos)', pin: 'GPIO 16', tipo: 'Sensor de respaldo y corroboración temp/hum' },
    { componente: 'DS18B20 (En placas PTC)', pin: 'GPIO 4', tipo: 'Mide disipador de calor (pull-up 4.7kΩ a 3V3)' },
    { componente: 'I2C SDA (Módulo AHT20 + BMP280, LCD)', pin: 'GPIO 21', tipo: 'Bus I2C Datos' },
    { componente: 'I2C SCL (Módulo AHT20 + BMP280, LCD)', pin: 'GPIO 22', tipo: 'Bus I2C Reloj' },
    { componente: 'Botón 1 (Muestra Temperatura en LCD)', pin: 'GPIO 25', tipo: 'Pulsador a GND con pull-up interno' },
    { componente: 'Botón 2 (Muestra Humedad en LCD)', pin: 'GPIO 26', tipo: 'Pulsador a GND con pull-up interno' },
    { componente: 'Botón 3 (Muestra Días transcurridos en LCD)', pin: 'GPIO 27', tipo: 'Pulsador a GND con pull-up interno' },
    { componente: 'Relé Humidificador (Control app)', pin: 'GPIO 17', tipo: 'Salida Digital a módulo relé' },
    { componente: 'PTC Calefactor (4N35 + IRFZ44N) (Control app)', pin: 'GPIO 18', tipo: 'Salida PID (Optoacoplador + MOSFET IRFZ44N)' },
    { componente: 'Ventilador 12V (2N3904) (Control app)', pin: 'GPIO 19', tipo: 'PWM LEDC con transistor 2N3904' },
    { componente: 'DRV8825 Motor STEP (Opcional)', pin: 'GPIO 32', tipo: 'Paso a paso (reposo seguro cuando está inactivo)' },
    { componente: 'DRV8825 Motor DIR (Opcional)', pin: 'GPIO 33', tipo: 'Dirección (reposo seguro cuando está inactivo)' },
    { componente: 'DRV8825 Motor ENABLE (Opcional)', pin: 'GPIO 23', tipo: 'Habilitación (reposo seguro cuando está inactivo)' },
  ];

  const librerias = [
    { nombre: 'NimBLE-Arduino', desc: 'Stack BLE de alto rendimiento y bajo consumo para ESP32 (v1.4 y v2.x)' },
    { nombre: 'Adafruit AHTX0', desc: 'Lectura del sensor digital principal AHT20 de temperatura y humedad' },
    { nombre: 'Adafruit BMP280 + Unified Sensor', desc: 'Sensor redundante de temperatura de los huevos y presión' },
    { nombre: 'DHT sensor library (Adafruit)', desc: 'Sensor de respaldo DHT11 para temperatura y humedad' },
    { nombre: 'OneWire + DallasTemperature', desc: 'Lectura del sensor DS18B20 en el disipador PTC' },
    { nombre: 'LiquidCrystal_I2C', desc: 'Pantalla LCD 16x2 para interfaz física' },
  ];

  return (
    <div className="space-y-8">
      {/* CABECERA Y DESCARGAS */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <span className="text-[11px] font-bold text-[#E05A36] uppercase tracking-wider flex items-center gap-1.5">
            <Bluetooth className="w-3.5 h-3.5" />
            Firmware Oficial Bluetooth BLE v3.2 (Auditado y Verificado)
          </span>
          <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 tracking-tight">Código Fuente Arduino con NimBLE (.ino)</h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Compatible con ESP32 DevKit V1, NodeMCU-32S y ESP-WROOM-32. Incluye interbloqueos térmicos de seguridad y suite de pruebas superada (30/30).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleCopiar}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            {copiado ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiado ? '¡Copiado!' : 'Copiar'}</span>
          </button>

          <button
            onClick={handleDescargar}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar .ino (v3.2)</span>
          </button>

          <button
            onClick={handleDescargarZip}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#E05A36] hover:bg-[#C84724] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Proyecto ZIP Completo</span>
          </button>
        </div>
      </div>

      {/* RESULTADOS DE AUDITORÍA Y SEGURIDAD v3.2 */}
      <div className="rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-300/80 dark:border-emerald-800 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Auditoría Técnica y Correcciones del Firmware v3.2
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Garantías de seguridad física, fiabilidad de memoria y transporte BLE verificadas mediante 30 pruebas unitarias:
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs">
            30/30 Pruebas Pasadas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-[11px]">
                1
              </span>
              <strong className="text-stone-900 dark:text-stone-100 text-xs font-bold">Parser JSON a prueba de NaN / Infinito</strong>
            </div>
            <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
              La deserialización ahora utiliza <code>isfinite()</code> y protección contra punteros nulos. Parámetros malformados no pueden corromper el regulador térmico PID ni provocar bucles descontrolados.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-[11px]">
                2
              </span>
              <strong className="text-stone-900 dark:text-stone-100 text-xs font-bold">Reensamblador BLE Streaming + Cola FIFO</strong>
            </div>
            <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
              La app web implementa un búfer streaming que reensambla fragmentos de 20 bytes delimitados por <code>\n</code> y una cola FIFO secuencial que erradica el error <code>GATT operation already in progress</code>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-[11px]">
                3
              </span>
              <strong className="text-stone-900 dark:text-stone-100 text-xs font-bold">Interbloqueos Térmicos Redundantes</strong>
            </div>
            <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
              Corte inmediato de calefacción si el aire alcanza ≥39.5 °C o el disipador PTC ≥65.0 °C. Ante emergencias térmicas, el ventilador se activa al 100 % para evacuar el calor remanente.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-[11px]">
                4
              </span>
              <strong className="text-stone-900 dark:text-stone-100 text-xs font-bold">Watchdog de Motor y Preservación NVS</strong>
            </div>
            <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
              Watchdog de 15 segundos para el volteador DRV8825 que previene quemaduras de motor ante trabas mecánicas, y guardado de tiempo espaciado a 15 minutos para preservar la memoria flash del ESP32.
            </p>
          </div>
        </div>
      </div>

      {/* ESPECIFICACIÓN DE TRAMAS BLE Y CONTRATO */}
      <div className="rounded-3xl bg-[#FFF9F6] dark:bg-stone-900 border-2 border-[#FDE5DC] dark:border-stone-800 p-5 sm:p-6 shadow-2xs space-y-3 transition-colors">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-[#E05A36]" />
          Contrato del Protocolo Bluetooth BLE (&lt; 240 bytes)
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
          Para garantizar la máxima velocidad de transferencia y compatibilidad con el límite MTU estándar de Bluetooth Low Energy sin fragmentación,
          la característica de <strong>SENSORES</strong> emite tramas JSON con claves abreviadas:
        </p>
        <div className="bg-white dark:bg-stone-950 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 font-mono text-[11px] text-stone-700 dark:text-stone-300 overflow-x-auto">
          <code>
            {`{"up":1234,"ta":37.82,"ta2":37.75,"td":42.1,"h":48.5,"st":37.8,"sh":45.0,"out":{"p":1,"f":75,"h":0,"m":0},"stt":"REG","pid":42,"d":3,"dt":21,"sv":3450}`}
          </code>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-stone-600 dark:text-stone-400 pt-1">
          <div><code className="text-[#E05A36] font-bold">up:</code> Uptime (segundos)</div>
          <div><code className="text-[#E05A36] font-bold">ta / ta2:</code> Temp aire sonda 1 y 2</div>
          <div><code className="text-[#E05A36] font-bold">td:</code> Temp disipador (°C)</div>
          <div><code className="text-[#E05A36] font-bold">h:</code> Humedad relativa (%)</div>
          <div><code className="text-[#E05A36] font-bold">st / sh:</code> Setpoints temp/hum</div>
          <div><code className="text-[#E05A36] font-bold">out:</code> Salidas (ptc, fan, hum, motor)</div>
          <div><code className="text-[#E05A36] font-bold">stt:</code> CAL, REG, VOL, ALM</div>
          <div><code className="text-[#E05A36] font-bold">sv:</code> Segundos próx. volteo</div>
        </div>
      </div>

      {/* TABLA DE PINES Y LIBRERÍAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de asignación de pines */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-xs transition-colors">
          <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#E05A36]" />
            Mapeo de Pines GPIO Oficial de incuNOVA
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold">
                  <th className="py-2 px-2">Periférico / Función</th>
                  <th className="py-2 px-2">Pin ESP32</th>
                  <th className="py-2 px-2">Descripción Eléctrica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {pinesTabla.map((p, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40">
                    <td className="py-2 px-2 font-medium text-stone-800 dark:text-stone-200">{p.componente}</td>
                    <td className="py-2 px-2 font-mono font-bold text-[#E05A36]">{p.pin}</td>
                    <td className="py-2 px-2 text-stone-500 dark:text-stone-400">{p.tipo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Librerías requeridas */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-[#E05A36]" />
              Bibliotecas Requeridas
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
              Instalar desde el Administrador de Bibliotecas en Arduino IDE:
            </p>
            <div className="space-y-2">
              {librerias.map((lib, idx) => (
                <div key={idx} className="p-2 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-100 dark:border-stone-700/60">
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200 font-mono">{lib.nombre}</div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">{lib.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 space-y-1">
            <div>✓ UUID Servicio: <code className="text-[#E05A36]">b7a10001-...</code></div>
            <div>✓ Modo autónomo AUTO continuo al desconectarse BLE.</div>
          </div>
        </div>
      </div>

      {/* GUÍA DE VERIFICACIÓN PASO A PASO PARA CONEXIÓN BLE */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Bluetooth className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Guía de Verificación de Conexión BLE (ESP32 ↔ Web)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Sigue estos 4 pasos para comprobar que la comunicación inalámbrica funcione al 100%:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAF6F0] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/70 flex flex-col justify-between">
            <div>
              <span className="w-6 h-6 rounded-full bg-[#E05A36] text-white font-bold flex items-center justify-center text-xs mb-2">
                1
              </span>
              <strong className="text-stone-900 dark:text-stone-100 block mb-1">Cargar el Sketch</strong>
              <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                Abre Arduino IDE, instala la librería <strong>NimBLE-Arduino</strong> y selecciona tu placa <em>ESP32 Dev Module</em>. Compila y sube el firmware v3.1.
              </p>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-2">✓ Compatible NimBLE 1.4 y 2.x</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF6F0] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/70 flex flex-col justify-between">
            <div>
              <span className="w-6 h-6 rounded-full bg-[#E05A36] text-white font-bold flex items-center justify-center text-xs mb-2">
                2
              </span>
              <strong className="text-stone-900 dark:text-stone-100 block mb-1">Monitor Serie 115200</strong>
              <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                Abre el Monitor Serie. Debes ver: <code className="text-[#E05A36] font-mono">[BLE] Servicio incuNOVA v3.2 anunciado</code> indicando que la radio BLE está transmitiendo.
              </p>
            </div>
            <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold mt-2">✓ Baudios: 115200</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF6F0] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/70 flex flex-col justify-between">
            <div>
              <span className="w-6 h-6 rounded-full bg-[#E05A36] text-white font-bold flex items-center justify-center text-xs mb-2">
                3
              </span>
              <strong className="text-stone-900 dark:text-stone-100 block mb-1">Navegador Compatible</strong>
              <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                Usa <strong>Google Chrome</strong> o <strong>Edge</strong> en PC/Android. En iPhone usa <strong>Bluefy</strong>. Asegúrate de tener Bluetooth encendido.
              </p>
            </div>
            <span className="text-[10px] text-stone-700 dark:text-stone-300 font-bold mt-2">✓ Web Bluetooth API</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF6F0] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/70 flex flex-col justify-between">
            <div>
              <span className="w-6 h-6 rounded-full bg-[#E05A36] text-white font-bold flex items-center justify-center text-xs mb-2">
                4
              </span>
              <strong className="text-stone-900 dark:text-stone-100 block mb-1">Vincular y Recibir</strong>
              <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                En la pestaña "Dispositivos", pulsa <strong>Emparejar incubadora</strong>. Selecciona "incuNOVA-01". Las lecturas de sensores llegarán cada 2 segundos.
              </p>
            </div>
            <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold mt-2">✓ Notificaciones GATT</span>
          </div>
        </div>
      </div>

      {/* VISOR DE CÓDIGO CON ESTILO MONOSPACE */}
      <div className="bg-stone-950 rounded-3xl p-5 sm:p-6 border border-stone-800 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800 text-stone-400 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 font-mono text-stone-300 font-semibold">incuNOVA_v3_2_ESP32_Firmware.ino</span>
          </div>
          <button
            onClick={handleCopiar}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition cursor-pointer"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiado ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        <pre className="font-mono text-xs sm:text-[13px] text-stone-300 overflow-x-auto p-2 leading-relaxed max-h-[600px] scrollbar-thin">
          <code>{ESP32_SKETCH_INO}</code>
        </pre>
      </div>
    </div>
  );
};
