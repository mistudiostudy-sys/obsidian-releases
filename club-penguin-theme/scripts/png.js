// Minimal PNG writer for Buf pixel buffers (no dependencies).
const fs = require('fs');
const zlib = require('zlib');

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

const hexCache = new Map();
function rgba(hex) {
  if (hex === null) return [0, 0, 0, 0];
  if (!hexCache.has(hex)) {
    const n = parseInt(hex.slice(1, 7), 16);
    hexCache.set(hex, [n >> 16, (n >> 8) & 255, n & 255, 255]);
  }
  return hexCache.get(hex);
}

/** Writes a Buf to a PNG file, upscaled by an integer factor (nearest neighbour). */
function writePng(file, buf, scale = 1) {
  const W = buf.w * scale, H = buf.h * scale;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    const row = y * (W * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < W; x++) {
      const [r, g, b, a] = rgba(buf.px[Math.floor(y / scale) * buf.w + Math.floor(x / scale)]);
      const o = row + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]));
}

module.exports = { writePng };
