import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);

  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.44;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded square mask
      const rx = Math.abs(x - cx);
      const ry = Math.abs(y - cy);
      const cornerRadius = width * 0.28;
      const bound = width * 0.44;

      let inBounds = false;
      if (rx <= bound && ry <= bound) {
        if (rx > bound - cornerRadius && ry > bound - cornerRadius) {
          const cdx = rx - (bound - cornerRadius);
          const cdy = ry - (bound - cornerRadius);
          inBounds = Math.sqrt(cdx * cdx + cdy * cdy) <= cornerRadius;
        } else {
          inBounds = true;
        }
      }

      if (inBounds) {
        // Gradient from #2563eb (37, 99, 235) to #7c3aed (124, 58, 237)
        const t = (x + y) / (width + height);
        const red = Math.round(37 + (124 - 37) * t);
        const green = Math.round(99 + (58 - 99) * t);
        const blue = Math.round(235 + (237 - 235) * t);

        // Center sparkle / star mark in white
        const starDist = Math.min(
          Math.abs(dx) * 2.5 + Math.abs(dy),
          Math.abs(dx) + Math.abs(dy) * 2.5
        );
        const isStar = (Math.abs(dx) < width * 0.08 && Math.abs(dy) < height * 0.28) ||
                       (Math.abs(dy) < height * 0.08 && Math.abs(dx) < width * 0.28) ||
                       (Math.abs(dx - width * 0.18) < width * 0.04 && Math.abs(dy + height * 0.18) < height * 0.14) ||
                       (Math.abs(dy + height * 0.18) < height * 0.04 && Math.abs(dx - width * 0.18) < width * 0.14);

        if (isStar) {
          buffer[idx] = 255;
          buffer[idx + 1] = 255;
          buffer[idx + 2] = 255;
          buffer[idx + 3] = 255;
        } else {
          buffer[idx] = red;
          buffer[idx + 1] = green;
          buffer[idx + 2] = blue;
          buffer[idx + 3] = 255;
        }
      } else {
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0; // Transparent
      }
    }
  }

  // Build raw scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    scanlines[y * (width * 4 + 1)] = 0; // Filter None
    buffer.copy(scanlines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatData = zlib.deflateSync(scanlines);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // Standard CRC32 table
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('extension/icons');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon16.png'), createPNG(16, 16));
fs.writeFileSync(path.join(outDir, 'icon48.png'), createPNG(48, 48));
fs.writeFileSync(path.join(outDir, 'icon128.png'), createPNG(128, 128));

console.log('Successfully generated extension icons: 16x16, 48x48, 128x128');
