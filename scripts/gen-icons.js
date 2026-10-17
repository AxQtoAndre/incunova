import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([139, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with filter byte (0) per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Draw warm terracota egg shape
      const dx = (x - width / 2) / (width * 0.38);
      const dy = (y - height / 2) / (height * 0.44);
      // egg elongation at top
      const eggFactor = 1 - 0.2 * (y / height);
      const dist = Math.sqrt((dx * dx) / (eggFactor * eggFactor) + dy * dy);

      if (dist < 0.95) {
        // Terracotta egg #E05A36 with warm highlight
        const hl = Math.max(0, 1 - Math.hypot(dx + 0.2, dy + 0.3));
        rawData[pxOffset] = Math.min(255, Math.floor(r + hl * 40));
        rawData[pxOffset + 1] = Math.min(255, Math.floor(g + hl * 30));
        rawData[pxOffset + 2] = Math.min(255, Math.floor(b + hl * 20));
        rawData[pxOffset + 3] = a;
      } else {
        // Warm cream background #FFFDF9
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 253;
        rawData[pxOffset + 2] = 249;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate 192x192, 512x512, apple-touch-icon (180x180)
const icon192 = createPNG(192, 192, 224, 90, 54);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);

const icon512 = createPNG(512, 512, 224, 90, 54);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), icon512);

const iconApple = createPNG(180, 180, 224, 90, 54);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), iconApple);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), iconApple);

console.log('Icons generated successfully.');
