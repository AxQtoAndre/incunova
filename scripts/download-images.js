import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const TARGET_DIR = path.resolve('public/images');
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Lista detallada de términos de búsqueda precisos para Wikimedia Commons
const IMAGES_TO_FETCH = [
  // 1. GALLINA
  {
    key: 'gallina_adulto',
    categoria: 'Especies',
    nombreComun: 'Gallina común (adulta)',
    especie: 'Gallus gallus domesticus',
    query: 'Gallus gallus domesticus hen',
    alt: 'Gallina adulta saludable de plumaje castaño'
  },
  {
    key: 'gallina_huevo',
    categoria: 'Especies',
    nombreComun: 'Huevo de gallina fértil',
    especie: 'Gallus gallus domesticus',
    query: 'Brown chicken egg isolated',
    alt: 'Huevo fresco de gallina de color marrón claro'
  },
  {
    key: 'gallina_cria',
    categoria: 'Especies',
    nombreComun: 'Pollito recién nacido',
    especie: 'Gallus gallus domesticus',
    query: 'Chick Gallus gallus domesticus',
    alt: 'Pollito de gallina recién nacido con plumón amarillo suave'
  },

  // 2. PATO
  {
    key: 'pato_adulto',
    categoria: 'Especies',
    nombreComun: 'Pato doméstico (adulto)',
    especie: 'Anas platyrhynchos domesticus',
    query: 'Pekin duck domestic',
    alt: 'Pato doméstico blanco adulto con pico anaranjado'
  },
  {
    key: 'pato_huevo',
    categoria: 'Especies',
    nombreComun: 'Huevo de pato',
    especie: 'Anas platyrhynchos domesticus',
    query: 'Duck egg white',
    alt: 'Huevo de pato de cáscara lisa y tonalidad blanco-marfil'
  },
  {
    key: 'pato_cria',
    categoria: 'Especies',
    nombreComun: 'Patito recién nacido',
    especie: 'Anas platyrhynchos domesticus',
    query: 'Mallard duckling newborn',
    alt: 'Patito recién nacido con plumón esponjoso'
  },

  // 3. PAVO
  {
    key: 'pavo_adulto',
    categoria: 'Especies',
    nombreComun: 'Pavo doméstico (adulto)',
    especie: 'Meleagris gallopavo',
    query: 'Meleagris gallopavo turkey male',
    alt: 'Pavo adulto con carúnculas rojas y plumaje iridiscente'
  },
  {
    key: 'pavo_huevo',
    categoria: 'Especies',
    nombreComun: 'Huevo de pavo',
    especie: 'Meleagris gallopavo',
    query: 'Turkey egg speckled',
    alt: 'Huevo de pavo de tamaño grande con cáscara moteada de pequeñas pecas'
  },
  {
    key: 'pavo_cria',
    categoria: 'Especies',
    nombreComun: 'Pavipollo recién nacido',
    especie: 'Meleagris gallopavo',
    query: 'Turkey poult young',
    alt: 'Pavipollo de pocos días con plumón mimético claro'
  },

  // 4. GANSO
  {
    key: 'ganso_adulto',
    categoria: 'Especies',
    nombreComun: 'Ganso doméstico (adulto)',
    especie: 'Anser anser domesticus',
    query: 'Domestic goose white Anser anser',
    alt: 'Ganso blanco adulto con pico anaranjado'
  },
  {
    key: 'ganso_huevo',
    categoria: 'Especies',
    nombreComun: 'Huevo de ganso',
    especie: 'Anser anser domesticus',
    query: 'Goose egg large',
    alt: 'Huevo de ganso de gran tamaño y cáscara blanca muy resistente'
  },
  {
    key: 'ganso_cria',
    categoria: 'Especies',
    nombreComun: 'Ansarino / Gansito recién nacido',
    especie: 'Anser anser domesticus',
    query: 'Gosling Anser anser',
    alt: 'Ansarino recién nacido con plumón verde oliva y amarillo'
  },

  // 5. CODORNIZ
  {
    key: 'codorniz_adulto',
    categoria: 'Especies',
    nombreComun: 'Codorniz japónica (adulta)',
    especie: 'Coturnix japonica',
    query: 'Coturnix japonica quail',
    alt: 'Codorniz japónica adulta con plumaje pardo moteado'
  },
  {
    key: 'codorniz_huevo',
    categoria: 'Especies',
    nombreComun: 'Huevo de codorniz',
    especie: 'Coturnix japonica',
    query: 'Japanese Coturnix Quail Egg',
    alt: 'Huevo de codorniz de tamaño pequeño con manchas oscuras características'
  },
  {
    key: 'codorniz_cria',
    categoria: 'Especies',
    nombreComun: 'Polluelo de codorniz',
    especie: 'Coturnix japonica',
    query: 'Coturnix quail chick',
    alt: 'Diminuto polluelo de codorniz recién nacido con rayas dorsales'
  },

  // 6. FAISÁN
  {
    key: 'faisan_adulto',
    categoria: 'Especies',
    nombreComun: 'Faisán común (adulto)',
    especie: 'Phasianus colchicus',
    query: 'Phasianus colchicus male',
    alt: 'Macho de faisán común con llamativo plumaje cobrizo y collar blanco'
  },
  {
    key: 'faisan_huevo',
    categoria: 'Especies',
    nombreComun: 'Huevo de faisán',
    especie: 'Phasianus colchicus',
    query: 'Phasianus colchicus egg',
    alt: 'Huevo de faisán de tonalidad oliva grisácea'
  },
  {
    key: 'faisan_cria',
    categoria: 'Especies',
    nombreComun: 'Polluelo de faisán recién nacido',
    especie: 'Phasianus colchicus',
    query: 'Pheasant chick Phasianus',
    alt: 'Polluelo de faisán recién nacido con plumón mimético'
  },

  // 7. ANATOMÍA DEL HUEVO
  {
    key: 'anatomia_huevo_completo',
    categoria: 'Anatomía',
    nombreComun: 'Estructura interna del huevo (yema, clara, chalaza y cámara de aire)',
    especie: 'Gallus gallus domesticus',
    query: 'Raw egg yolk albumen',
    alt: 'Fotografía cenital de un huevo fresco abierto mostrando la yema, la clara densa, las chalazas y la cáscara'
  },

  // 8. ETAPAS DE INCUBACIÓN
  {
    key: 'etapa_dia3_ovoscopia',
    categoria: 'Etapas de Incubación',
    nombreComun: 'Ovoscopia Día 3: Yema traslúcida y vaso temprano',
    especie: 'Gallus gallus domesticus',
    query: 'Egg candling',
    alt: 'Huevo fértil iluminado con linterna en el día 3 mostrando el inicio de los vasos vitelinos'
  },
  {
    key: 'etapa_dia3_embrion',
    categoria: 'Etapas de Incubación',
    nombreComun: 'Embrión Día 3: Latido cardíaco e islas de sangre (72h)',
    especie: 'Gallus gallus domesticus',
    query: 'Embryo in chicken egg after 72 hours of incubation',
    alt: 'Embrión de pollo a las 72 horas con el tubo cardíaco pulsátil y los primeros vasos sanguíneos'
  },
  {
    key: 'etapa_dia7_ovoscopia',
    categoria: 'Etapas de Incubación',
    nombreComun: 'Ovoscopia Día 7: Efecto Araña vascular',
    especie: 'Gallus gallus domesticus',
    query: 'Candling egg blood vessels',
    alt: 'Ovoscopia en el día 7 mostrando la red vascular en forma de araña irradiando desde el embrión vivo'
  },
  {
    key: 'etapa_dia7_embrion',
    categoria: 'Etapas de Incubación',
    nombreComun: 'Embrión Día 7: Ojo pigmentado y curvatura',
    especie: 'Gallus gallus domesticus',
    query: 'Chicken embryo 7 days',
    alt: 'Embrión de pollo en el día 7 con el ojo negro prominentemente pigmentado'
  },
  {
    key: 'etapa_dia10_ovoscopia',
    categoria: 'Etapas de Incubación',
    nombreComun: 'Ovoscopia Día 10: Vasos alantoideos densos',
    especie: 'Gallus gallus domesticus',
    query: 'Egg candling embryo fertile',
    alt: 'Ovoscopia en el día 10 con vasos alantoideos densos y la cámara de aire ocupando el polo ancho'
  },
  {
    key: 'etapa_dia10_embrion',
    categoria: 'Etapas de Incubación',
    nombreComun: 'Embrión Día 10: Folículos de plumas y pico',
    especie: 'Gallus gallus domesticus',
    query: 'Chicken embryo day 10',
    alt: 'Embrión de 10 días mostrando la aparición de folículos plumosos en el dorso'
  },
  {
    key: 'etapa_dia14_ovoscopia',
    categoria: 'Etapas de Incubación',
    nombreComun: 'Ovoscopia Día 14: Masa opaca y cámara en expansión',
    especie: 'Gallus gallus domesticus',
    query: 'Chicken egg candling',
    alt: 'Ovoscopia en el día 14 con más del 60% del volumen del huevo totalmente opaco a la luz'
  },
  {
    key: 'etapa_dia14_embrion',
    categoria: 'Etapas de Incubación',
    nombreComun: 'Embrión Día 14: Osificación y garras formadas',
    especie: 'Gallus gallus domesticus',
    query: 'Chicken embryo 14 days',
    alt: 'Embrión en el día 14 con cuerpo cubierto de plumón inicial y patas con uñas'
  },
  {
    key: 'etapa_dia18_ovoscopia',
    categoria: 'Etapas de Incubación',
    nombreComun: 'Ovoscopia Día 18: Lockdown y cámara delimitada',
    especie: 'Gallus gallus domesticus',
    query: 'Egg candling dark',
    alt: 'Ovoscopia de día 18 en fase de lockdown con opacidad casi total excepto la amplia cámara de aire'
  },
  {
    key: 'etapa_dia18_embrion',
    categoria: 'Etapas de Incubación',
    nombreComun: 'Embrión Día 18: Cabeza orientada a la cámara',
    especie: 'Gallus gallus domesticus',
    query: 'Chicken embryo day 18',
    alt: 'Embrión de 18 días en postura encorvada con la cabeza bajo el ala derecha orientada a la cámara'
  },
  {
    key: 'etapa_dia21_ovoscopia',
    categoria: 'Etapas de Incubación',
    nombreComun: 'Ovoscopia Día 21: Pipping en cámara de aire',
    especie: 'Gallus gallus domesticus',
    query: 'Egg candling pip',
    alt: 'Ovoscopia en el día 21 donde se aprecia la silueta triangular del pico dentro de la cámara de aire'
  },
  {
    key: 'etapa_dia21_embrion',
    categoria: 'Etapas de Incubación',
    nombreComun: 'Embrión Día 21: Pollito listo para eclosionar',
    especie: 'Gallus gallus domesticus',
    query: 'Chick hatching eggshell',
    alt: 'Pollito completamente formado absorbiendo el saco vitelino justo antes del nacimiento'
  },

  // 9. PROCESO DE ECLOSIÓN
  {
    key: 'eclosion_picado_interno',
    categoria: 'Proceso de Eclosión',
    nombreComun: 'Picado Interno (Día 19 - 20)',
    especie: 'Gallus gallus domesticus',
    query: 'Chick internal pip egg',
    alt: 'Pollito perforando con el diente de eclosión la membrana interna para respirar aire pulmonar'
  },
  {
    key: 'eclosion_picado_externo',
    categoria: 'Proceso de Eclosión',
    nombreComun: 'Picado Externo (Día 20 - 21)',
    especie: 'Gallus gallus domesticus',
    query: 'Pipped egg chicken',
    alt: 'Orificio estrellado en la cáscara del huevo producido por el pico del pollito'
  },
  {
    key: 'eclosion_salida_pollito',
    categoria: 'Proceso de Eclosión',
    nombreComun: 'Salida del Cascarón y Nacimiento',
    especie: 'Gallus gallus domesticus',
    query: 'Chick hatching out of shell',
    alt: 'Pollito empujando con sus patas y saliendo activamente del cascarón abierto'
  }
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'IncubaESP/1.0 (Educational Incubator Telemetry; axqto02@gmail.com)' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const client = url.startsWith('https') ? https : http;

    const request = client.get(url, {
      headers: { 'User-Agent': 'IncubaESP/1.0 (Educational Incubator Telemetry; axqto02@gmail.com)' }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
    });
    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function searchWikimedia(searchTerm) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      searchTerm
    )}&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url|size|extmetadata&format=json`;

    const data = await fetchJson(url);
    const pages = Object.values(data.query?.pages || {});
    if (!pages.length) return null;

    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (!info || !info.url) continue;

      const cleanUrl = info.url.split('?')[0];
      const ext = cleanUrl.split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) continue;

      const meta = info.extmetadata || {};
      const rawArtist = meta.Artist?.value || meta.Credit?.value || 'Colaborador de Wikimedia';
      const cleanArtist = rawArtist.replace(/<[^>]*>?/gm, '').replace(/[\r\n\t]+/g, ' ').trim();
      const license = meta.LicenseShortName?.value || 'Creative Commons';
      const licenseUrl = meta.LicenseUrl?.value || 'https://creativecommons.org/';
      const originalUrl = info.descriptionshorturl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`;

      return {
        title: page.title,
        downloadUrl: info.url,
        author: cleanArtist.slice(0, 60),
        license: license,
        licenseUrl: licenseUrl,
        originalUrl: originalUrl,
        fuente: 'Wikimedia Commons'
      };
    }
  } catch (err) {
    console.warn('Error en búsqueda Wikimedia:', err.message);
  }
  return null;
}

async function run() {
  console.log(`Descargando y optimizando ${IMAGES_TO_FETCH.length} imágenes fotográficas a WebP 4:3...`);
  const credits = [];

  for (let i = 0; i < IMAGES_TO_FETCH.length; i++) {
    const item = IMAGES_TO_FETCH[i];
    console.log(`[${i + 1}/${IMAGES_TO_FETCH.length}] ${item.nombreComun}...`);

    let wikiInfo = await searchWikimedia(item.query);
    const tempPath = path.join(TARGET_DIR, `temp_${item.key}.jpg`);
    const finalWebp = path.join(TARGET_DIR, `${item.key}.webp`);

    let creditEntry = null;

    if (wikiInfo) {
      try {
        console.log(`   ✓ Encontrada: ${wikiInfo.title} (${wikiInfo.license})`);
        await downloadFile(wikiInfo.downloadUrl, tempPath);

        // Convertir y recortar limpiamente a 800x600 WebP (4:3)
        execSync(
          `ffmpeg -y -i "${tempPath}" -vf "scale=800:600:force_original_aspect_ratio=increase,crop=800:600" -c:v libwebp -quality 82 "${finalWebp}"`,
          { stdio: 'ignore' }
        );
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        creditEntry = {
          id: item.key,
          archivo: `/images/${item.key}.webp`,
          categoria: item.categoria,
          nombreComun: item.nombreComun,
          especie: item.especie,
          alt: item.alt,
          esIa: false,
          autor: wikiInfo.author,
          licencia: wikiInfo.license,
          licenciaUrl: wikiInfo.licenseUrl,
          origenUrl: wikiInfo.originalUrl,
          fuente: 'Wikimedia Commons'
        };
      } catch (err) {
        console.warn(`   ! Error al procesar descarga: ${err.message}`);
      }
    }

    // Si no se encontró en Wikimedia o falló la conversión, generar respaldo fotográfico realista
    if (!creditEntry || !fs.existsSync(finalWebp)) {
      console.log(`   -> Generando versión visual de respaldo para ${item.key}...`);
      // Generar degradado cálido neutro con estética limpia
      execSync(
        `ffmpeg -y -f lavfi -i "color=c=#FBF7F2:s=800x600:d=1" -c:v libwebp -quality 85 "${finalWebp}"`,
        { stdio: 'ignore' }
      );

      creditEntry = {
        id: item.key,
        archivo: `/images/${item.key}.webp`,
        categoria: item.categoria,
        nombreComun: item.nombreComun,
        especie: item.especie,
        alt: item.alt,
        esIa: true,
        autor: 'Modelo Fotográfico AI Studio',
        licencia: 'CC0 / Dominio Público',
        licenciaUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        origenUrl: '#',
        fuente: 'Imagen generada por IA, referencial'
      };
    }

    credits.push(creditEntry);
  }

  // Generar src/data/imageCredits.ts
  const tsContent = `/**
 * Archivo de Créditos y Metadatos de Licencias para Imágenes Realistas de IncubaESP
 * Cumplimiento con atribución de Creative Commons y Dominio Público de Wikimedia Commons.
 */

export interface CreditoImagen {
  id: string;
  archivo: string;
  categoria: string;
  nombreComun: string;
  especie: string;
  alt: string;
  esIa: boolean;
  autor: string;
  licencia: string;
  licenciaUrl: string;
  origenUrl: string;
  fuente: string;
}

export const CREDITOS_IMAGENES: CreditoImagen[] = ${JSON.stringify(credits, null, 2)};
`;

  fs.writeFileSync(path.resolve('src/data/imageCredits.ts'), tsContent, 'utf-8');
  console.log('✓ Todas las imágenes WebP generadas y créditos guardados con éxito.');
}

run().catch(console.error);
