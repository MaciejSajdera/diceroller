// Generuje ikony PWA (PNG + SVG) bez zewnętrznych zależności: rasteryzacja w czystym Node + zlib.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const BG = [0x14, 0x14, 0x1f], DIE = [0x22, 0xc5, 0x5e], PIP = [0x05, 0x2e, 0x14];
// kość "5": pozycje oczek w układzie 0..1 w obrębie kości
const PIPS = [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, { dieFrac, bgRound }) {
  const SS = 4; // supersampling
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const d0 = (1 - dieFrac) / 2, d1 = 1 - d0, dr = dieFrac * 0.2, pr = dieFrac * 0.09;
  const inRound = (x, y, x0, y0, x1, y1, r) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const cx = Math.min(Math.max(x, x0 + r), x1 - r), cy = Math.min(Math.max(y, y0 + r), y1 - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  };
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let acc = [0, 0, 0, 0];
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const x = (px + (sx + 0.5) / SS) / size, y = (py + (sy + 0.5) / SS) / size;
        let col = null;
        if (inRound(x, y, 0, 0, 1, 1, bgRound)) col = BG;
        if (inRound(x, y, d0, d0, d1, d1, dr)) {
          col = DIE;
          for (const [ux, uy] of PIPS) {
            const cx = d0 + ux * dieFrac, cy = d0 + uy * dieFrac;
            if ((x - cx) ** 2 + (y - cy) ** 2 <= pr * pr) col = PIP;
          }
        }
        if (col) { acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2]; acc[3] += 255; }
      }
      const n = SS * SS, o = py * (size * 4 + 1) + 1 + px * 4;
      const a = acc[3] / n;
      raw[o] = a ? acc[0] / (acc[3] / 255) : 0; raw[o + 1] = a ? acc[1] / (acc[3] / 255) : 0;
      raw[o + 2] = a ? acc[2] / (acc[3] / 255) : 0; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

mkdirSync('public', { recursive: true });
writeFileSync('public/icon-192.png', png(192, { dieFrac: 0.7, bgRound: 0.22 }));
writeFileSync('public/icon-512.png', png(512, { dieFrac: 0.7, bgRound: 0.22 }));
writeFileSync('public/icon-maskable-512.png', png(512, { dieFrac: 0.56, bgRound: 0 })); // safe zone 80%
writeFileSync('public/apple-touch-icon.png', png(180, { dieFrac: 0.66, bgRound: 0 }));
const pips = PIPS.map(([x, y]) => `<circle cx="${15 + x * 70}" cy="${15 + y * 70}" r="6.3" fill="#052e14"/>`).join('');
writeFileSync('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#14141f"/><rect x="15" y="15" width="70" height="70" rx="14" fill="#22c55e"/>${pips}</svg>\n`);
console.log('ikony wygenerowane');
