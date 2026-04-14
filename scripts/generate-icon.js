/**
 * Generates assets/icon.png — a modern rounded-square icon with a
 * warm orange gradient background and a white pause symbol.
 * Uses only Node.js built-ins.
 */
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 ──────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const tb  = Buffer.from(type, 'ascii');
  const ci  = Buffer.concat([tb, data]);
  const crc = crc32(ci);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const cb  = Buffer.alloc(4); cb.writeUInt32BE(crc, 0);
  return Buffer.concat([len, tb, data, cb]);
}

// ── Geometry helpers ───────────────────────────────────────────────────────────

/** Is (px, py) inside a rounded square centred at (cx,cy) with half-size R and corner radius cr? */
function inRoundedSquare(px, py, cx, cy, R, cr) {
  const dx = Math.max(Math.abs(px - cx) - (R - cr), 0);
  const dy = Math.max(Math.abs(py - cy) - (R - cr), 0);
  return dx * dx + dy * dy <= cr * cr;
}

/** Is (px, py) inside a rounded rectangle? (rx,ry) = top-left corner */
function inRoundedRect(px, py, rx, ry, rw, rh, cr) {
  const mx = rx + rw / 2, my = ry + rh / 2;
  const dx = Math.max(Math.abs(px - mx) - rw / 2 + cr, 0);
  const dy = Math.max(Math.abs(py - my) - rh / 2 + cr, 0);
  return dx * dx + dy * dy <= cr * cr;
}

// ── PNG generation ─────────────────────────────────────────────────────────────

function createIconPNG(size) {
  const stride = 1 + size * 4;
  const pixels = Buffer.alloc(size * stride, 0);

  const cx = size / 2;
  const cy = size / 2;

  // Rounded square background
  const bgR  = size * 0.46;   // half-size (leaves ~4% edge gap)
  const bgCr = size * 0.20;   // corner radius

  // Gradient: top #ff7c3a → bottom #e85d04
  const topRGB    = [255, 124, 58];
  const bottomRGB = [232, 93,  4];

  // Pause bar dimensions (two vertical rounded rects)
  const barW  = size * 0.10;
  const barH  = size * 0.36;
  const barCr = size * 0.04;
  const gap   = size * 0.095;           // center-to-center half-gap
  const barY  = cy - barH / 2;
  const bar1X = cx - gap - barW / 2;
  const bar2X = cx + gap - barW / 2;

  for (let y = 0; y < size; y++) {
    pixels[y * stride] = 0; // PNG filter byte: None
    for (let x = 0; x < size; x++) {
      const px  = x + 0.5;
      const py  = y + 0.5;
      const pos = y * stride + 1 + x * 4;

      if (!inRoundedSquare(px, py, cx, cy, bgR, bgCr)) {
        // fully transparent outside
        pixels[pos] = pixels[pos+1] = pixels[pos+2] = pixels[pos+3] = 0;
        continue;
      }

      // Vertical gradient for background
      const t  = py / size;
      const r  = Math.round(topRGB[0] * (1-t) + bottomRGB[0] * t);
      const g  = Math.round(topRGB[1] * (1-t) + bottomRGB[1] * t);
      const b  = Math.round(topRGB[2] * (1-t) + bottomRGB[2] * t);

      // White pause bars
      const inPause = inRoundedRect(px, py, bar1X, barY, barW, barH, barCr)
                   || inRoundedRect(px, py, bar2X, barY, barW, barH, barCr);

      if (inPause) {
        pixels[pos] = pixels[pos+1] = pixels[pos+2] = 255;
        pixels[pos+3] = 255;
      } else {
        pixels[pos]   = r;
        pixels[pos+1] = g;
        pixels[pos+2] = b;
        pixels[pos+3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(pixels, { level: 9 });
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13, 0);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Write file ─────────────────────────────────────────────────────────────────
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const iconPath = path.join(assetsDir, 'icon.png');
fs.writeFileSync(iconPath, createIconPNG(256));
console.log('Icon generated:', iconPath);
