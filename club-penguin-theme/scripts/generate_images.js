// Generates the pixel-art PNGs (Chrome Halloween theme + VS Code icon).
//   node scripts/generate_images.js
// Uses the same sprites as the VS Code pet, so everything matches.
const path = require('path');
const S = require('../vscode-extension/media/sprites.js');
const { writePng } = require('./png.js');

const ROOT = path.resolve(__dirname, '..');
const { Buf } = S;

let seed = 1234;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function ditherBands(b, y0, y1, colors) {
  for (let y = y0; y < y1; y++) {
    const t = ((y - y0) / (y1 - y0)) * (colors.length - 1);
    const i = Math.floor(t), frac = t - i;
    for (let x = 0; x < b.w; x++) {
      const bayer = [[0, 0.5], [0.75, 0.25]][y % 2][x % 2];
      b.px[y * b.w + x] = colors[Math.min(colors.length - 1, i + (bayer < frac ? 1 : 0))];
    }
  }
}

function deadTree(b, x, base, height, dir, color) {
  b.rect(x, base - height, x + 5, base, color);
  b.rect(x - 2, base - 3, x + 7, base, color);
  const branches = [[0.25, 1, 18], [0.45, -1, 14], [0.65, 1, 12], [0.85, -1, 9]];
  for (const [f, side, len] of branches) {
    let bx = side * dir > 0 ? x + 5 : x, by = Math.round(base - height * f);
    for (let k = 0; k < len; k++) {
      b.rect(bx, by, bx + 1, by + 1, color);
      bx += side * dir;
      if (k % 3 === 0) by -= 1;
    }
    b.rect(bx, by - 3, bx, by, color);
  }
}

function hauntedHouse(b) {
  const wall = '#4f6070', plank = '#43525f', roof = '#6b3f8f', roofDark = '#56317a', trim = '#2a1a2e';
  const lit = '#ffd56b', litDark = '#e8a93a', board = '#7a5230';

  // Upper floor + roof
  b.rect(290, 28, 300, 60, '#5b3a3a'); b.rect(288, 26, 302, 29, '#43292b');
  b.rect(196, 70, 304, 112, wall);
  for (let x = 199; x < 304; x += 6) b.rect(x, 70, x, 112, plank);
  b.poly([[184, 74], [316, 74], [286, 36], [214, 36]], roof);
  b.poly([[232, 40], [268, 40], [250, 18]], roof);
  for (let y = 38; y < 74; y += 4) b.rect(180, y, 320, y, roofDark, (c) => c === roof);
  b.ell(250, 46, 6, 6, trim); b.ell(250, 46, 4.5, 4.5, lit); b.rect(246, 46, 254, 46, trim); b.rect(250, 41, 250, 51, trim);

  // Upper windows (one boarded)
  for (const [x0, boarded] of [[208, false], [276, true]]) {
    b.rect(x0 - 2, 78, x0 + 17, 99, trim);
    b.rect(x0, 80, x0 + 15, 97, lit);
    b.rect(x0, 92, x0 + 15, 97, litDark);
    b.rect(x0 + 7, 80, x0 + 8, 97, trim);
    if (boarded) { b.poly([[x0 - 3, 84], [x0 + 18, 88], [x0 + 18, 92], [x0 - 3, 88]], board); }
  }

  // Ground floor
  b.rect(176, 124, 324, 182, wall);
  for (let x = 179; x < 324; x += 6) b.rect(x, 124, x, 182, plank);
  b.poly([[158, 130], [342, 130], [326, 108], [174, 108]], roof);
  for (let y = 110; y < 130; y += 4) b.rect(150, y, 350, y, roofDark, (c) => c === roof);
  b.rect(158, 130, 342, 132, trim);

  for (const [x0, boarded] of [[188, true], [290, false]]) {
    b.rect(x0 - 2, 140, x0 + 21, 165, trim);
    b.rect(x0, 142, x0 + 19, 163, lit);
    b.rect(x0, 156, x0 + 19, 163, litDark);
    b.rect(x0 + 9, 142, x0 + 10, 163, trim);
    if (boarded) { b.poly([[x0 - 3, 146], [x0 + 22, 152], [x0 + 22, 156], [x0 - 3, 150]], board); b.rect(x0 - 3, 158, x0 + 22, 161, board); }
  }
  // Door
  b.rect(238, 146, 262, 182, trim);
  b.ell(250, 148, 12, 8, trim);
  b.rect(241, 150, 259, 182, '#3a2440');
  b.ell(250, 150, 9, 5.5, '#3a2440');
  b.rect(255, 165, 256, 166, '#ffd56b');

  // Porch, posts and steps
  b.rect(160, 180, 340, 190, '#3b2f45');
  for (let x = 160; x < 340; x += 8) b.rect(x, 180, x, 190, '#2e2437');
  for (const x of [168, 230, 268, 330]) b.rect(x, 132, x + 3, 180, '#8a9aa8');
  for (let k = 0; k < 4; k++) b.rect(234 - k * 2, 190 + k * 4, 266 + k * 2, 193 + k * 4, k % 2 ? '#7d8597' : '#8f97a8');
}

function ntpBackground() {
  const b = new Buf(480, 270);
  ditherBands(b, 0, 196, ['#0b0618', '#120a26', '#1b0f36', '#271446', '#361a56', '#4a2164', '#5e2a6c']);

  for (let i = 0; i < 160; i++) {
    const x = Math.floor(rnd() * 480), y = Math.floor(rnd() * 140);
    b.set(x, y, rnd() > 0.75 ? '#ffe9b0' : '#ffffff');
    if (rnd() > 0.92) { b.set(x - 1, y, '#8f7fb8'); b.set(x + 1, y, '#8f7fb8'); b.set(x, y - 1, '#8f7fb8'); b.set(x, y + 1, '#8f7fb8'); }
  }

  // Moon with a dithered halo
  b.ell(404, 50, 36, 36, '#3c2a5a', (c, x, y) => (x + y) % 2 === 0);
  b.ell(404, 50, 31, 31, '#4e3866', (c, x, y) => (x + y) % 2 === 0);
  b.ell(404, 50, 26, 26, '#fff1c1');
  b.ell(394, 42, 6, 5, '#efd99a'); b.ell(414, 60, 4, 4, '#efd99a'); b.ell(410, 38, 2.5, 2.5, '#efd99a'); b.ell(396, 62, 3, 2.5, '#efd99a');
  b.ell(412, 58, 22, 22, '#f6e2a8', (c, x, y) => c === '#fff1c1' && ((x - 404) ** 2 + (y - 50) ** 2) > 22 ** 2);

  // Far hills with spooky trees
  for (let x = 0; x < 480; x++) {
    const top = Math.round(170 + Math.sin(x / 37) * 6 + Math.sin(x / 13) * 2);
    b.rect(x, top, x, 196, '#211235');
  }
  for (const [x, h] of [[70, 40], [120, 28], [345, 34], [380, 46], [440, 30]]) deadTree(b, x, 178, h, x % 2 ? 1 : -1, '#211235');

  // Snowy ground and winding path
  ditherBands(b, 186, 270, ['#9ea2c8', '#b4b7da', '#c6c9e6', '#d3d6ee']);
  for (let y = 196; y < 270; y++) {
    const t = (y - 196) / 74;
    const cx = 250 + Math.sin(t * 3.2) * 30 * t, half = 16 + t * 40;
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) b.set(x, y, (x + y) % 7 === 0 ? '#8489b0' : '#979cc2');
  }

  hauntedHouse(b);

  // Graveyard + pumpkins
  for (const [x, y] of [[112, 196], [128, 202], [354, 198], [372, 204], [140, 214]]) b.blit(S.gravestone(), x, y);
  for (const [x, y] of [[172, 166], [190, 168], [306, 166], [322, 168], [222, 168], [272, 186]]) b.blit(S.jackOLantern(1), x, y);
  for (const [x, y] of [[96, 222], [380, 222], [404, 230]]) b.blit(S.jackOLantern(1), x, y);
  b.blit(S.jackOLantern(2), 14, 220);
  b.blit(S.jackOLantern(2), 404, 196);

  // Fence pieces
  for (let x = 64; x < 110; x += 9) { b.rect(x, 236, x + 3, 252, '#5b4a3a'); b.rect(x + 1, 234, x + 2, 235, '#5b4a3a'); }
  b.rect(64, 240, 110, 241, '#4a3b2e'); b.rect(64, 247, 110, 248, '#4a3b2e');

  // Bats
  for (const [x, y] of [[120, 40], [160, 62], [330, 30], [355, 88], [450, 90], [60, 80], [270, 10]]) b.blit(S.bat(), x, y);

  // Characters on the path
  b.blit(S.penguin({ color: 'azul', hat: 'ninguno', accessory: 'fantasma' }, 'stand', 0), 196, 196);
  b.blit(S.puffle({ puffleColor: 'blanco', puffleHat: 'calabaza' }, 'stand'), 236, 226);
  b.blit(S.penguin({ color: 'morado', hat: 'bruja', accessory: 'bufanda' }, 'wave', 0), 268, 200);
  b.blit(S.puffle({ puffleColor: 'negro', puffleHat: 'ninguno' }, 'stand'), 308, 230);

  writePng(path.join(ROOT, 'chrome-theme-halloween/images/ntp_background.png'), b, 4);
}

function frameImage() {
  const b = new Buf(300, 30);
  ditherBands(b, 0, 30, ['#2c1248', '#24103e', '#1c0b32']);
  for (let i = 0; i < 40; i++) b.set(Math.floor(rnd() * 300), Math.floor(rnd() * 30), '#ffdcae');
  for (const [x, y] of [[40, 6], [130, 16], [215, 5], [270, 18]]) b.blit(S.bat(), x, y);
  writePng(path.join(ROOT, 'chrome-theme-halloween/images/frame.png'), b, 4);
}

function icon() {
  const b = new Buf(64, 64);
  b.rect(0, 0, 63, 63, '#0b2a4a');
  ditherBands(b, 0, 48, ['#1e63c9', '#42b4ff', '#9fd6ff']);
  b.ell(32, 70, 44, 18, '#ffffff');
  for (const [x, y] of [[0, 0], [63, 0], [0, 63], [63, 63]]) {
    for (let k = 0; k < 4; k++) for (let j = 0; j < 4 - k; j++) {
      b.px[Math.abs(y - k) * 64 + Math.abs(x - j)] = null;
    }
  }
  b.blit(S.penguin({ color: 'azul', hat: 'gorra-helice', accessory: 'ninguno' }, 'stand', 1), 13, 7);
  writePng(path.join(ROOT, 'vscode-extension/media/icon.png'), b, 2);
}

ntpBackground();
frameImage();
icon();
console.log('Imágenes generadas ✔');
