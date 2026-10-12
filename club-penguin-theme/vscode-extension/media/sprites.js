// Pixel-art sprites in the Club Penguin style. Shared by the VS Code webview
// (window.CPSprites) and by scripts/generate_images.js (require).
(function (root) {
  const OUTLINE = '#15121d';
  const WHITE = '#ffffff';
  const ORANGE = '#ffa514';
  const ORANGE_DARK = '#d97e06';
  const ORANGE_LIGHT = '#ffc04a';

  const PENGUIN_COLORS = {
    azul: '#1e63c9', rojo: '#d6262c', verde: '#3aa53a', rosa: '#ff8ad8', negro: '#33333b',
    morado: '#8a3fd1', naranja: '#ff7b1f', amarillo: '#ffd21f', 'verde-oscuro': '#1f6e2e',
    'azul-claro': '#42b4ff', cafe: '#8b5a2b', durazno: '#ffb38a', aqua: '#19c7b8', lima: '#9be22d'
  };
  const PUFFLE_COLORS = {
    azul: '#2d7ff9', rosa: '#ff7ac8', negro: '#2e2e36', verde: '#47c447', morado: '#9b51e0',
    rojo: '#e8343a', amarillo: '#ffd93b', blanco: '#eef2fb', naranja: '#ff9330', cafe: '#9a6233',
    dorado: '#f5c518'
  };

  function shade(hex, amount) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + amount * 255)));
    return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  const colorOf = (table, value, fallback) =>
    table[value] || (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value || '') ? value : fallback);

  // ---------- Pixel buffer ----------

  class Buf {
    constructor(w, h, ox = 0, oy = 0) {
      this.w = w; this.h = h; this.ox = ox; this.oy = oy; this.dy = 0;
      this.px = new Array(w * h).fill(null);
    }
    idx(x, y) {
      const ix = x + this.ox, iy = y + this.oy + this.dy;
      return ix < 0 || iy < 0 || ix >= this.w || iy >= this.h ? -1 : iy * this.w + ix;
    }
    get(x, y) { const i = this.idx(x, y); return i < 0 ? null : this.px[i]; }
    set(x, y, c, where) {
      const i = this.idx(x, y);
      if (i >= 0 && (!where || where(this.px[i], x, y))) this.px[i] = c;
    }
    rect(x0, y0, x1, y1, c, where) {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c, where);
    }
    ell(cx, cy, rx, ry, c, where) {
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) this.set(x, y, c, where);
        }
      }
    }
    // Filled polygon (even-odd), sampled at pixel centers.
    poly(points, c, where) {
      const ys = points.map((p) => p[1]);
      for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
        const py = y + 0.5, xs = [];
        for (let i = 0; i < points.length; i++) {
          const [ax, ay] = points[i], [bx, by] = points[(i + 1) % points.length];
          if ((ay <= py && by > py) || (by <= py && ay > py)) xs.push(ax + ((py - ay) / (by - ay)) * (bx - ax));
        }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          for (let x = Math.ceil(xs[k] - 0.5); x + 0.5 <= xs[k + 1]; x++) this.set(x, y, c, where);
        }
      }
    }
    outline(color) {
      const src = this.px.slice();
      for (let y = 0; y < this.h; y++) {
        for (let x = 0; x < this.w; x++) {
          if (src[y * this.w + x] !== null) continue;
          const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < this.w && yy < this.h && src[yy * this.w + xx] !== null;
          if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) this.px[y * this.w + x] = color;
        }
      }
      return this;
    }
    blit(src, x, y) {
      for (let sy = 0; sy < src.h; sy++) {
        for (let sx = 0; sx < src.w; sx++) {
          const c = src.px[sy * src.w + sx];
          if (c !== null) {
            const tx = x + sx, ty = y + sy;
            if (tx >= 0 && ty >= 0 && tx < this.w && ty < this.h) this.px[ty * this.w + tx] = c;
          }
        }
      }
    }
  }

  const on = (...colors) => (cur) => colors.includes(cur);
  const filled = (cur) => cur !== null;

  // ---------- Penguin (front view, CP proportions) ----------

  function drawHat(b, hat, frame) {
    switch (hat) {
      case 'gorra-helice': {
        b.ell(16, 7, 9.6, 5.5, '#e8343a', (c, x, y) => y <= 7);
        b.rect(11, 1, 13, 7, '#ffd21f', on('#e8343a'));
        b.rect(19, 1, 21, 7, '#2d7ff9', on('#e8343a'));
        b.rect(23, 6, 29, 7, '#2d7ff9');
        b.rect(15, -2, 16, 1, '#555566');
        if (frame % 2) b.rect(8, -3, 23, -3, '#ffd21f'); else b.rect(13, -3, 18, -3, '#ffd21f');
        break;
      }
      case 'fiesta': {
        b.poly([[16, -9], [23, 5], [9, 5]], '#ff5fb0');
        b.rect(0, -2, 31, -1, '#42b4ff', on('#ff5fb0'));
        b.rect(0, 2, 31, 3, '#ffd21f', on('#ff5fb0'));
        b.ell(16, -9.5, 2, 2, '#ffd21f');
        break;
      }
      case 'corona': {
        b.rect(9, 2, 22, 5, '#ffcc22');
        b.rect(9, -1, 10, 1, '#ffcc22'); b.rect(15, -2, 16, 1, '#ffcc22'); b.rect(21, -1, 22, 1, '#ffcc22');
        b.rect(9, 5, 22, 5, '#d99a00');
        b.rect(15, 3, 16, 4, '#e8343a'); b.set(11, 3, '#2d7ff9'); b.set(20, 3, '#47c447');
        break;
      }
      case 'bruja': {
        b.poly([[10, 4], [22, 4], [21, -2], [24, -9], [17, -6]], '#3b2160');
        b.rect(10, 1, 22, 3, '#ff8a1f', on('#3b2160'));
        b.rect(15, 1, 17, 3, '#ffd21f', on('#ff8a1f'));
        b.rect(16, 2, 16, 2, '#3b2160');
        b.rect(4, 4, 27, 5, '#2a1840');
        break;
      }
      case 'calabaza': {
        b.ell(16, 6, 11, 6.5, ORANGE, (c, x, y) => y <= 7);
        for (const x of [10, 16, 22]) b.rect(x, 0, x, 7, ORANGE_DARK, on(ORANGE));
        b.ell(12, 3, 2.5, 1.6, ORANGE_LIGHT, on(ORANGE));
        b.poly([[10, 6], [14, 6], [12, 3]], '#6b3300'); b.poly([[18, 6], [22, 6], [20, 3]], '#6b3300');
        b.rect(5, 7, 27, 7, ORANGE_DARK);
        b.rect(15, -3, 16, -1, '#3e8f2a'); b.set(17, -3, '#3e8f2a');
        break;
      }
      case 'copa': {
        b.rect(10, -7, 21, 4, '#24242c');
        b.rect(11, -6, 11, 3, '#3a3a46');
        b.rect(10, 1, 21, 2, '#d6262c');
        b.rect(6, 4, 25, 5, '#1b1b22');
        break;
      }
      case 'gorro-lana': {
        b.ell(16, 7, 10, 6, '#47c447', (c, x, y) => y <= 8);
        b.rect(6, 6, 25, 8, '#2e8a2e');
        for (let x = 8; x <= 24; x += 3) b.set(x, 3, WHITE, on('#47c447'));
        b.ell(16, 0.5, 2.6, 2.6, WHITE);
        break;
      }
    }
  }

  function drawAccessory(b, acc, body) {
    switch (acc) {
      case 'bufanda':
        b.rect(5, 20, 27, 22, '#d6262c', filled);
        for (let x = 6; x <= 26; x += 2) b.set(x, 21, '#ff8a8a', on('#d6262c'));
        b.rect(20, 23, 23, 30, '#b81f24');
        b.rect(20, 30, 23, 30, '#ff8a8a');
        break;
      case 'corbatin':
        b.poly([[11.5, 19.5], [16, 21.5], [11.5, 23.5]], '#d6262c');
        b.poly([[20.5, 19.5], [16, 21.5], [20.5, 23.5]], '#d6262c');
        b.rect(15, 21, 16, 22, '#9e161b');
        break;
      case 'lentes':
        b.rect(10, 10, 14, 13, '#111118'); b.rect(17, 10, 21, 13, '#111118'); b.rect(15, 11, 16, 11, '#111118');
        b.set(11, 10, '#8899aa'); b.set(18, 10, '#8899aa');
        break;
      case 'audifonos':
        b.ell(16, 12, 11, 11, '#444455', (c, x, y) => y <= 9 && (c === body || c === null) &&
          ((x + 0.5 - 16) / 9.6) ** 2 + ((y + 0.5 - 12) / 9.6) ** 2 > 1);
        b.rect(4, 10, 7, 16, '#ff5fb0'); b.rect(24, 10, 27, 16, '#ff5fb0');
        b.rect(5, 11, 5, 15, '#ff9ad2'); b.rect(25, 11, 25, 15, '#ff9ad2');
        break;
      case 'delantal':
        b.ell(16, 28, 9.5, 9.5, '#2f9e44', (c, x, y) => y >= 21 && c !== null);
        b.rect(9, 20, 22, 21, '#2f9e44', filled);
        b.rect(10, 19, 10, 20, '#2f9e44'); b.rect(21, 19, 21, 20, '#2f9e44');
        b.rect(13, 27, 18, 29, '#237a34');
        b.rect(13, 27, 18, 27, '#3fbf58');
        break;
    }
  }

  function penguin(cfg, pose = 'stand', frame = 0) {
    const B = colorOf(PENGUIN_COLORS, cfg.color, PENGUIN_COLORS.azul);
    const D = shade(B, -0.2), L = shade(B, 0.15);
    const b = new Buf(36, 52, 2, 11);
    const walk1 = pose === 'walk1', walk2 = pose === 'walk2';
    const ghost = cfg.accessory === 'fantasma';

    // Feet stay on the ground; body bobs up while stepping.
    b.ell(10, walk1 ? 36.6 : 37.6, 5.2, 2.3, ORANGE);
    b.ell(22, walk2 ? 36.6 : 37.6, 5.2, 2.3, ORANGE);
    b.rect(0, 38, 31, 40, ORANGE_DARK, on(ORANGE));
    b.dy = walk1 || walk2 ? -1 : 0;

    // Flippers
    b.ell(4.5, walk1 ? 24 : walk2 ? 26 : 25, 3, 7.5, D);
    if (pose === 'wave') b.ell(28.5, 13.5, 3, 7, D);
    else b.ell(27.5, walk2 ? 24 : walk1 ? 26 : 25, 3, 7.5, D);

    // Head + body: the classic CP pear shape
    b.ell(16, 26, 12, 12.6, B);
    b.ell(16, 19, 10.8, 6, B);
    b.ell(16, 12.5, 9.6, 9.6, B);
    b.ell(12, 7.5, 3.4, 2.2, L, on(B));
    b.ell(16, 26, 12, 12.6, D, (c, x, y) => c === B && x > 16 && ((x + 0.5 - 16) / 12) ** 2 + ((y + 0.5 - 26) / 12.6) ** 2 > 0.62);

    // Belly + white face mask
    b.ell(16, 28.5, 8.6, 9.6, WHITE);
    b.ell(19.5, 31, 5, 6, '#e6ebf3', (c, x, y) => c === WHITE && ((x + 0.5 - 16) / 8.6) ** 2 + ((y + 0.5 - 28.5) / 9.6) ** 2 > 0.6);
    b.ell(12.7, 12.4, 4.6, 5.1, WHITE);
    b.ell(19.3, 12.4, 4.6, 5.1, WHITE);
    b.ell(16, 15.6, 6.4, 3.4, WHITE);

    if (ghost) {
      const S = '#f4f6fb', SS = '#d5dbe8';
      b.ell(0.5, 21, 1.6, 2.6, B); b.ell(31.5, 21, 1.6, 2.6, B);
      b.ell(16, 13, 10.6, 10.6, S);
      b.ell(16, 26, 13.6, 12.6, S);
      b.rect(2, 26, 29, 34, S);
      for (let x = 2; x <= 29; x++) if ((x >> 1) % 2) b.set(x, 35, S);
      b.rect(0, 0, 31, 40, SS, (c, x, y) => c === S && x >= 23 && y >= 18);
      b.ell(12.7, 12.4, 2.6, 3, '#e6eaf3', on(S)); b.ell(19.3, 12.4, 2.6, 3, '#e6eaf3', on(S));
      // Pumpkin bucket
      b.rect(-1, 24, -1, 26, '#6b3300'); b.rect(5, 24, 5, 26, '#6b3300'); b.rect(-1, 24, 5, 24, '#6b3300');
      b.ell(2, 30, 4, 3.3, ORANGE);
      b.set(0, 29, '#ffe066'); b.set(4, 29, '#ffe066'); b.rect(0, 31, 4, 31, '#ffe066');
    }

    // Eyes
    if (pose === 'blink') {
      b.rect(11, 12, 13, 12, '#111118'); b.rect(18, 12, 20, 12, '#111118');
    } else {
      b.rect(11, 10, 13, 13, '#111118'); b.rect(18, 10, 20, 13, '#111118');
      b.set(13, 10, WHITE); b.set(20, 10, WHITE);
    }

    if (!ghost) {
      b.rect(14, 14, 17, 14, ORANGE_LIGHT);
      b.rect(13, 15, 18, 15, ORANGE);
      b.rect(14, 16, 17, 16, ORANGE_DARK);
      drawAccessory(b, cfg.accessory, B);
    }
    drawHat(b, cfg.hat, frame);
    b.dy = 0;
    return b.outline(OUTLINE);
  }

  // ---------- Puffle ----------

  function puffle(cfg, pose = 'stand') {
    const C = colorOf(PUFFLE_COLORS, cfg.puffleColor, PUFFLE_COLORS.rosa);
    const D = shade(C, -0.22), L = shade(C, 0.18);
    const b = new Buf(24, 24, 2, 5);
    const squash = pose === 'squash';
    const cy = squash ? 14 : 13;

    if (cfg.puffleHat !== 'calabaza') {
      for (const [x, y0] of [[6, 5], [8, 3], [10, 2], [12, 3], [14, 5]]) b.rect(x, y0 + cy - 13, x + 1, cy - 5, D);
    }
    b.ell(10, cy, squash ? 7.4 : 6.8, squash ? 5.6 : 6.4, C);
    b.ell(7, cy - 3.5, 2, 1.4, L, on(C));
    b.ell(10, cy, 6.8, 6.4, D, (c, x, y) => c === C && x > 11 && y > cy + 1);
    const ey = cy - 2;
    b.rect(6, ey, 8, ey + 3, WHITE); b.rect(11, ey, 13, ey + 3, WHITE);
    b.rect(7, ey + 1, 8, ey + 2, '#111118'); b.rect(12, ey + 1, 13, ey + 2, '#111118');
    b.rect(8, cy + 3, 11, cy + 3, '#111118'); b.set(7, cy + 2, '#111118'); b.set(12, cy + 2, '#111118');

    if (cfg.puffleHat === 'calabaza') {
      b.ell(10, cy - 4, 8.5, 5, ORANGE, (c, x, y) => y <= cy - 3);
      for (const x of [6, 10, 14]) b.rect(x, 0, x, cy - 3, ORANGE_DARK, on(ORANGE));
      b.ell(7, cy - 7, 1.8, 1, ORANGE_LIGHT, on(ORANGE));
      b.set(7, cy - 5, '#6b3300'); b.set(13, cy - 5, '#6b3300'); b.rect(8, cy - 4, 12, cy - 4, '#6b3300', on(ORANGE));
      b.rect(1, cy - 3, 19, cy - 3, ORANGE_DARK, (c) => c !== null);
      b.rect(10, cy - 11, 11, cy - 9, '#3e8f2a');
    }
    return b.outline(OUTLINE);
  }

  // ---------- Props for scenes ----------

  function jackOLantern(size = 1, lit = true) {
    const b = new Buf(18 * size, 16 * size, 1, 1);
    const s = size;
    b.ell(8 * s, 9 * s, 8 * s, 6 * s, ORANGE);
    for (const x of [4, 8, 12]) b.rect(x * s, 3 * s, x * s + s - 1, 15 * s, ORANGE_DARK, on(ORANGE));
    b.ell(4 * s, 6 * s, 2 * s, 1.2 * s, ORANGE_LIGHT, on(ORANGE));
    b.rect(7 * s, 0, 8 * s + s - 1, 3 * s - 1, '#3e8f2a');
    const face = lit ? '#ffe066' : '#6b3300';
    b.poly([[3 * s, 9 * s], [6.5 * s, 9 * s], [4.8 * s, 6 * s]], face);
    b.poly([[9.5 * s, 9 * s], [13 * s, 9 * s], [11.2 * s, 6 * s]], face);
    b.rect(4 * s, 11 * s, 12 * s, 12 * s, face, on(ORANGE, ORANGE_DARK));
    b.rect(6 * s, 11 * s, 6 * s + s - 1, 11 * s + s - 1, ORANGE);
    b.rect(10 * s, 12 * s, 10 * s + s - 1, 12 * s + s - 1, ORANGE);
    return b.outline(OUTLINE);
  }

  function gravestone() {
    const b = new Buf(12, 15, 1, 1);
    b.ell(5, 5, 5, 5, '#8a90a0', (c, x, y) => y <= 5);
    b.rect(0, 5, 9, 13, '#8a90a0');
    b.rect(7, 2, 9, 13, '#6e7486', on('#8a90a0'));
    b.rect(3, 5, 6, 5, '#5c6172'); b.rect(3, 8, 6, 8, '#5c6172');
    return b.outline(OUTLINE);
  }

  function bat() {
    const b = new Buf(13, 6, 0, 0);
    const k = '#120a1c';
    b.rect(5, 1, 7, 3, k); b.set(5, 0, k); b.set(7, 0, k);
    b.rect(1, 1, 4, 2, k); b.rect(8, 1, 11, 2, k); b.set(0, 2, k); b.set(12, 2, k);
    b.set(2, 3, k); b.set(4, 3, k); b.set(8, 3, k); b.set(10, 3, k);
    b.set(5, 2, '#ffcc33'); b.set(7, 2, '#ffcc33');
    return b;
  }

  const api = {
    Buf, shade, colorOf, penguin, puffle, jackOLantern, gravestone, bat,
    PENGUIN_COLORS, PUFFLE_COLORS, OUTLINE,
    HATS: ['ninguno', 'gorra-helice', 'fiesta', 'corona', 'bruja', 'calabaza', 'copa', 'gorro-lana'],
    ACCESSORIES: ['ninguno', 'bufanda', 'corbatin', 'lentes', 'audifonos', 'delantal', 'fantasma'],
    PUFFLE_HATS: ['ninguno', 'calabaza']
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CPSprites = api;
})(this);
