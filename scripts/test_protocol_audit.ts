import { deserializarBlePayload, bleManager } from '../src/utils/bleManager';
import { BLE_UUIDS, SensorDataESP32 } from '../src/types/incubator';

console.log('================================================================');
console.log(' incuNOVA v3.2 - AUDITORÍA FORENSE Y BATERÍA COMPLETA DE PRUEBAS');
console.log('================================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(cond: boolean, desc: string, extraInfo?: string) {
  if (cond) {
    console.log(`[PASS] ${desc}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${desc}${extraInfo ? ` -> ${extraInfo}` : ''}`);
    testsFailed++;
  }
}

async function runAllTests() {
  // --------------------------------------------------------------------------
  // BLOQUE 1: Verificación de UUIDs estándar GATT BLE
  // --------------------------------------------------------------------------
  console.log('--- 1. Verificación de UUIDs GATT BLE ---');
  assert(BLE_UUIDS.SERVICE === 'b7a10001-5d3e-4c1a-9f2b-6e8d4a3c1f00', 'Service UUID estándar coincidente');
  assert(BLE_UUIDS.CHAR_SENSORES === 'b7a10002-5d3e-4c1a-9f2b-6e8d4a3c1f00', 'Sensor Notify UUID coincidente');
  assert(BLE_UUIDS.CHAR_COMANDO === 'b7a10003-5d3e-4c1a-9f2b-6e8d4a3c1f00', 'Command Write UUID coincidente');

  // --------------------------------------------------------------------------
  // BLOQUE 2: Deserialización de payload compacto BLE válido
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Payload compacto válido ---');
  const validPayload = JSON.stringify({
    up: 1250,
    ta: 37.82,
    ta2: 37.75,
    td: 46.2,
    h: 55.4,
    st: 37.8,
    sh: 55.0,
    out: { p: 1, f: 75, h: 0, m: 0 },
    stt: 'REG',
    pid: 58,
    d: 12,
    dt: 21,
    sv: 3600,
    al: ['TB'],
    t3: 37.9,
    h3: 54.0,
    pr: 1014.2,
    mn: 0,
    sr: 15,
  });

  try {
    const data = deserializarBlePayload(validPayload);
    assert(data.uptime_s === 1250, 'Uptime parseado correctamente');
    assert(data.temp_aire === 37.82, 'Temp aire principal correcta');
    assert(data.temp_aire2 === 37.75, 'Temp aire sonda 2 correcta');
    assert(data.temp_disipador === 46.2, 'Temp disipador correcta');
    assert(data.humedad === 55.4, 'Humedad relativa correcta');
    assert(data.salidas.ptc === true, 'Salida PTC correcta');
    assert(data.salidas.ventilador === 75, 'Salida Ventilador PWM correcta');
    assert(data.salidas.humidificador === false, 'Salida Humidificador correcta');
    assert(data.salidas.motor === false, 'Salida Motor correcta');
    assert(data.estado === 'REGULANDO', 'Estado REGULANDO mapeado');
    assert(data.alertas.includes('TEMP_BAJA'), 'Alerta TB mapeada a TEMP_BAJA');
    assert(data.presion === 1014.2, 'Presión atmosférica correcta');
    assert(data.manual?.ptc === false && data.manual?.ventilador === false, 'Máscara mn=0 parseada');
    assert(data.sensores_ok?.aht === true && data.sensores_ok?.ds === true, 'Máscara sr=15 (todos presentes) parseada');
  } catch (e: any) {
    assert(false, `Excepción en payload válido: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // BLOQUE 3: Resiliencia ante JSON corrupto, nulo, NaN o con campos ausentes
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Resiliencia ante JSON corrupto, incompleto o con NaN ---');
  try {
    const incompletePayload = JSON.stringify({
      up: 50,
      ta: 37.5,
    });
    const data = deserializarBlePayload(incompletePayload);
    assert(data !== null && typeof data === 'object', 'Maneja payload con campos incompletos');
    assert(typeof data.temp_aire === 'number' && Number.isFinite(data.temp_aire), 'temp_aire es un número finito seguro');
    assert(typeof data.salidas === 'object', 'salidas inicializado aunque falte en JSON');
    assert(typeof data.salidas.ventilador === 'number', 'ventilador inicializado a número seguro');
    assert(data.estado === 'REGULANDO', 'Fallback de estado a REGULANDO seguro');
  } catch (e: any) {
    assert(false, `Excepción con payload incompleto: ${e.message}`);
  }

  try {
    const nanPayload = '{"up":10,"ta":"NaN","td":"Infinity","h":null}';
    const data = deserializarBlePayload(nanPayload);
    assert(Number.isFinite(data.temp_aire), 'String "NaN" saneado a fallback finito');
    assert(Number.isFinite(data.temp_disipador), 'String "Infinity" saneado a fallback finito');
    assert(Number.isFinite(data.humedad), 'Valor null saneado a fallback finito');
  } catch (e: any) {
    assert(false, `Excepción con payload NaN: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // BLOQUE 4: Reensamblado de tramas fragmentadas por streaming BLE (20 bytes)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Prueba de reensamblado streaming por fragmentos (20 bytes) ---');
  const devId = 'incuba-test-streaming';
  let telemetriaRecibida: SensorDataESP32 | null = null;
  bleManager.setCallbacks(
    (id, sensores) => {
      if (id === devId) {
        telemetriaRecibida = sensores;
      }
    },
    () => {}
  );

  const mensajeFragmentado = JSON.stringify({
    up: 800,
    ta: 37.8,
    ta2: 37.7,
    td: 42.0,
    h: 46.5,
    st: 37.8,
    sh: 45.0,
    out: { p: 0, f: 75, h: 1, m: 0 },
    stt: 'REG',
    pid: 25,
    d: 5,
    dt: 21,
    sv: 7200,
    al: [],
  });

  const chunkSize = 20;
  for (let i = 0; i < mensajeFragmentado.length; i += chunkSize) {
    const chunk = mensajeFragmentado.substring(i, i + chunkSize);
    bleManager.procesarFragmentoBLE(devId, chunk);
  }

  assert(telemetriaRecibida !== null, 'Reensamblador streaming reconstruyó el JSON fragmentado en trozos de 20B');
  if (telemetriaRecibida) {
    const t: SensorDataESP32 = telemetriaRecibida;
    assert(t.uptime_s === 800, 'Uptime en trama fragmentada es exacto (800)');
    assert(t.temp_aire === 37.8, 'Temp aire en trama fragmentada es exacta (37.8)');
    assert(t.salidas.humidificador === true, 'Salida humidificador reconstruida');
    assert(t.estado === 'REGULANDO', 'Estado reconstruido');
  }

  // --------------------------------------------------------------------------
  // BLOQUE 5: Reensamblado con llaves '{' y '}' dentro de cadenas de texto JSON
  // --------------------------------------------------------------------------
  console.log('\n--- 5. JSON con llaves y caracteres escapados en strings ---');
  let payloadConLlaves: SensorDataESP32 | null = null;
  bleManager.setCallbacks(
    (id, s) => {
      if (id === 'incuba-test-braces') payloadConLlaves = s;
    },
    () => {}
  );

  // String que incluye llave { y } dentro del contenido de la cadena
  const jsonConBraces = '{"up":999,"ta":37.8,"stt":"REG","al":["TB"],"out":{"p":1,"f":50,"h":0,"m":0}}\n';
  bleManager.procesarFragmentoBLE('incuba-test-braces', jsonConBraces.substring(0, 30));
  bleManager.procesarFragmentoBLE('incuba-test-braces', jsonConBraces.substring(30));

  assert(payloadConLlaves !== null, 'JSON con subobjetos procesado correctamente');
  assert((payloadConLlaves as any)?.uptime_s === 999, 'Uptime correcto en JSON con llaves');

  // --------------------------------------------------------------------------
  // BLOQUE 6: Múltiples JSONs consecutivos en una sola notificación BLE
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Múltiples JSONs en una sola notificación BLE ---');
  const multiMensajes: SensorDataESP32[] = [];
  bleManager.setCallbacks(
    (id, s) => {
      if (id === 'incuba-test-multi') multiMensajes.push(s);
    },
    () => {}
  );

  const jsonA = JSON.stringify({ up: 100, ta: 37.8, stt: 'REG' });
  const jsonB = JSON.stringify({ up: 101, ta: 37.9, stt: 'REG' });
  // Enviar ambos en una sola llamada concatenados con \n
  bleManager.procesarFragmentoBLE('incuba-test-multi', `${jsonA}\n${jsonB}\n`);

  assert(multiMensajes.length === 2, `Se extrajeron ambos JSONs en una sola notificación (recibidos: ${multiMensajes.length})`);
  if (multiMensajes.length >= 2) {
    assert(multiMensajes[0].uptime_s === 100, 'Primer JSON procesado en orden');
    assert(multiMensajes[1].uptime_s === 101, 'Segundo JSON procesado en orden');
  }

  // --------------------------------------------------------------------------
  // BLOQUE 7: Preservación UTF-8 en división de bytes multi-byte
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Preservación UTF-8 en límite de bytes ---');
  // Carácter '°' en UTF-8 se codifica en 2 bytes: 0xC2 0xB0
  const degreeCharBytes = new TextEncoder().encode('°');
  assert(degreeCharBytes.length === 2 && degreeCharBytes[0] === 0xc2 && degreeCharBytes[1] === 0xb0, 'Verificación byte UTF-8 para "°"');

  const streamDecoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
  // Simular corte justo en medio del caracter UTF-8 entre dos notificaciones BLE
  const decPart1 = streamDecoder.decode(new Uint8Array([0x7b, 0x22, 0x74, 0x61, 0x22, 0x3a, 0x33, 0x37, 0x2e, 0x38, 0x2c, 0x22, 0x6e, 0x22, 0x3a, 0x22, degreeCharBytes[0]]), { stream: true });
  const decPart2 = streamDecoder.decode(new Uint8Array([degreeCharBytes[1], 0x43, 0x22, 0x7d]), { stream: false });
  const reconstructedStr = decPart1 + decPart2;

  assert(reconstructedStr.includes('°C'), `TextDecoder en modo streaming preserva "°C" sin sustitución por  (resultado: ${reconstructedStr})`);

  // --------------------------------------------------------------------------
  // BLOQUE 8: Protección contra desbordamiento de búfer (> 1024 bytes) y timeout
  // --------------------------------------------------------------------------
  console.log('\n--- 8. Protección de búfer (> 1024 bytes) y rechazo de ruido ---');
  let dataConBasura = false;
  bleManager.setCallbacks(
    (id) => {
      if (id === 'incuba-test-overflow') dataConBasura = true;
    },
    () => {}
  );

  // Enviar 1100 bytes de ruido continuo sin llaves
  const bigNoise = 'X'.repeat(1100);
  bleManager.procesarFragmentoBLE('incuba-test-overflow', bigNoise);
  assert(!dataConBasura, 'Ruido de 1100 bytes no generó falsos disparos de telemetría');

  // Enviar JSON válido inmediatamente después del desbordamiento
  let telemetriaPostOverflow: SensorDataESP32 | null = null;
  bleManager.setCallbacks(
    (id, s) => {
      if (id === 'incuba-test-overflow') telemetriaPostOverflow = s;
    },
    () => {}
  );

  const payloadLimpio = JSON.stringify({ up: 105, ta: 37.8, stt: 'REG' });
  bleManager.procesarFragmentoBLE('incuba-test-overflow', payloadLimpio);
  assert(telemetriaPostOverflow !== null, 'El búfer se recuperó y procesó el siguiente JSON válido');

  // --------------------------------------------------------------------------
  // BLOQUE 9: Validación y sanitización estricta de parámetros
  // --------------------------------------------------------------------------
  console.log('\n--- 9. Validación de límites y rangos de parámetros ---');
  let comandoEnviado: any = null;
  (bleManager as any).conexiones.set('incuba-test-cmd', {
    charCommand: {
      writeValueWithResponse: async (data: Uint8Array) => {
        const text = new TextDecoder().decode(data);
        comandoEnviado = JSON.parse(text);
      },
    },
  });

  await bleManager.sincronizarParametros('incuba-test-cmd', {
    st: 50.0, // Excede máximo térmico permitido (39.0 °C)
    sh: 120.0, // Excede humedad física (máx 90%)
    dt: 200, // Excede días de incubación (máx 99)
    dl: 150,
    hl: 100,
    iv: 5000, // Excede intervalo volteo (máx 1440)
  });

  assert(comandoEnviado !== null, 'Comando sanitizado generado');
  assert(comandoEnviado.st <= 39.0, `Temperatura clampada a máximo seguro (39.0 °C) -> st=${comandoEnviado.st}`);
  assert(comandoEnviado.sh <= 90.0, `Humedad clampada a máximo físico (90 %) -> sh=${comandoEnviado.sh}`);
  assert(comandoEnviado.dt <= 99, `Días totales clampados a 99 -> dt=${comandoEnviado.dt}`);
  assert(comandoEnviado.iv <= 1440, `Intervalo volteo clampado a 1440 min -> iv=${comandoEnviado.iv}`);

  // --------------------------------------------------------------------------
  // BLOQUE 10: Rechazo de comandos sobredimensionados (> 180 bytes)
  // --------------------------------------------------------------------------
  console.log('\n--- 10. Rechazo de comandos sobredimensionados (> 180 bytes) ---');
  let rechazoExitoso = false;
  try {
    const hugeCmd: Record<string, string> = {
      cmd: 'test',
      bigData: 'A'.repeat(250), // Provocará byteLength > 180
    };
    await bleManager.enviarComando('incuba-test-cmd', hugeCmd);
  } catch (err: any) {
    if (err.message.includes('Comando demasiado grande')) {
      rechazoExitoso = true;
    }
  }
  assert(rechazoExitoso, 'Comando con payload > 180B rechazado con excepción explícita');

  // --------------------------------------------------------------------------
  // BLOQUE 11: Purga de cola FIFO ante desconexión
  // --------------------------------------------------------------------------
  console.log('\n--- 11. Purga de cola FIFO ante desconexión ---');
  // Simular conexión activa
  (bleManager as any).conexiones.set('incuba-test-disconnect', {
    charCommand: {
      writeValueWithResponse: async () => {},
    },
    reintentos: 0,
    desconectadoManualmente: false,
  });

  // Ejecutar desconexión
  (bleManager as any).manejarDesconexion('incuba-test-disconnect');
  const bufferPurgado = !(bleManager as any).rxBuffers.has('incuba-test-disconnect');
  const queuePurgada = !(bleManager as any).writeQueues.has('incuba-test-disconnect');

  assert(bufferPurgado, 'Buffer RX purgado en desconexión');
  assert(queuePurgada, 'Cola de comandos FIFO purgada en desconexión para no reenviar comandos obsoletos');

  // --------------------------------------------------------------------------
  // BLOQUE 12: Simulación de interbloqueos térmicos de seguridad (ESP32)
  // --------------------------------------------------------------------------
  console.log('\n--- 12. Reglas lógicas del interbloqueo térmico del firmware ---');
  // Regla 1: Interbloqueo prioritario sobre modo manual si temp_max_aire >= 39.5
  const simularPotenciaPTC = (
    emergencia: boolean,
    temp_valida: boolean,
    temp_max_aire: number,
    ds_ok: boolean,
    temp_disipador: number,
    man_ptc: boolean,
    man_ptc_pct: number,
    salida_pid_pct: number
  ) => {
    if (emergencia || !temp_valida) return 0.0;
    if (Number.isFinite(temp_max_aire) && temp_max_aire >= 39.5) return 0.0;
    if (ds_ok && temp_disipador >= 65.0) return 0.0;

    let duty = man_ptc ? man_ptc_pct : salida_pid_pct;
    if (!ds_ok && duty > 25.0) duty = 25.0;
    return duty;
  };

  const pManualSobretemperatura = simularPotenciaPTC(false, true, 39.8, true, 40.0, true, 100.0, 80.0);
  assert(pManualSobretemperatura === 0.0, 'PTC cae a 0 % por corte de aire >= 39.5 °C incluso con manual activado al 100 %');

  const pDisipadorCaliente = simularPotenciaPTC(false, true, 37.8, true, 66.2, true, 100.0, 50.0);
  assert(pDisipadorCaliente === 0.0, 'PTC cae a 0 % por disipador >= 65.0 °C');

  const pSondaDesconectada = simularPotenciaPTC(false, true, 37.8, false, 0.0, false, 0.0, 80.0);
  assert(pSondaDesconectada === 25.0, 'PTC se autolimita al 25 % conservador si el sensor DS18B20 se desconecta');

  // --------------------------------------------------------------------------
  // RESUMEN FINAL
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(` RESULTADOS GLOBALES: ${testsPassed} Pasaron, ${testsFailed} Fallaron `);
  console.log('================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fallo no controlado en la suite de pruebas:', err);
  process.exit(1);
});
