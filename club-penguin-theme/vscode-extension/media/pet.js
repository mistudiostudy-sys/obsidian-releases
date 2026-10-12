// @ts-check
(function () {
  const vscode = acquireVsCodeApi();
  const S = /** @type {any} */ (window).CPSprites;

  const PUFFLE_LINES = ['¡Brrr! 💕', '*boing boing*', '¡Puff puff!', '¿Me das una galleta? 🍪', '*ronronea feliz*', '¡Wiii!'];

  /** @type {any} */
  let config = {
    name: 'Pingüi', color: 'azul', hat: 'gorra-helice', accessory: 'bufanda', puffleColor: 'rosa',
    puffleHat: 'ninguno', showPuffle: true, speed: 1, size: 3, scene: 'nieve', messages: ['¡Waddle on! 🐧']
  };

  const scene = /** @type {HTMLElement} */ (document.getElementById('scene'));
  const bg = /** @type {HTMLCanvasElement} */ (document.getElementById('bg'));
  const penguinEl = /** @type {HTMLCanvasElement} */ (document.getElementById('penguin'));
  const puffleEl = /** @type {HTMLCanvasElement} */ (document.getElementById('puffle'));
  const bubble = /** @type {HTMLElement} */ (document.getElementById('bubble'));
  const customizer = /** @type {HTMLElement} */ (document.getElementById('customizer'));
  const customizeBtn = /** @type {HTMLElement} */ (document.getElementById('customizeBtn'));

  const scale = () => Math.max(2, Math.min(5, Math.round(Number(config.size) || 3)));

  // ---------- Pixel rendering ----------

  const rgbCache = new Map();
  function rgb(hex) {
    if (!rgbCache.has(hex)) {
      const n = parseInt(hex.slice(1, 7), 16);
      rgbCache.set(hex, [n >> 16, (n >> 8) & 255, n & 255]);
    }
    return rgbCache.get(hex);
  }

  /** Paints a sprite buffer into a canvas at native resolution (CSS scales it up). */
  function paint(canvas, buf) {
    if (canvas.width !== buf.w) canvas.width = buf.w;
    if (canvas.height !== buf.h) canvas.height = buf.h;
    const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    const img = ctx.createImageData(buf.w, buf.h);
    buf.px.forEach((c, i) => {
      if (c === null) return;
      const [r, g, b] = rgb(c);
      img.data.set([r, g, b, 255], i * 4);
    });
    ctx.putImageData(img, 0, 0);
  }

  let frameCache = new Map();
  function frame(kind, pose, sub) {
    const key = `${kind}|${pose}|${sub}`;
    if (!frameCache.has(key)) {
      frameCache.set(key, kind === 'penguin' ? S.penguin(config, pose, sub) : S.puffle(config, pose));
    }
    return frameCache.get(key);
  }

  // ---------- Background (pixel scene) ----------

  function drawBackground() {
    const s = scale();
    const w = Math.ceil(scene.clientWidth / s), h = Math.ceil(scene.clientHeight / s);
    if (w <= 0 || h <= 0) return;
    const b = new S.Buf(w, h);
    const night = config.scene === 'halloween';
    const sky = night ? ['#120a24', '#1d0f36', '#2b1648', '#3d1d5c'] : ['#5bb8f5', '#7cc7ff', '#9fd6ff', '#c2e5ff'];
    const groundTop = h - 9;
    for (let y = 0; y < groundTop; y++) {
      const t = (y / groundTop) * (sky.length - 1);
      const i = Math.floor(t), frac = t - i;
      for (let x = 0; x < w; x++) {
        // Ordered dithering between bands, for that retro look.
        const dither = ((x + y) % 2 === 0 ? 0.25 : 0.75) < frac;
        b.px[y * w + x] = sky[Math.min(sky.length - 1, i + (dither ? 1 : 0))];
      }
    }
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    if (night) {
      for (let k = 0; k < (w * h) / 120; k++) b.set(Math.floor(rnd() * w), Math.floor(rnd() * groundTop * 0.8), rnd() > 0.7 ? '#ffe9b0' : '#ffffff');
      b.ell(w - 14, 10, 6.5, 6.5, '#fff1c1');
      b.ell(w - 16, 9, 1.6, 1.6, '#eedb9c'); b.ell(w - 12, 13, 1.2, 1.2, '#eedb9c');
    } else {
      for (const [cx, cy] of [[w * 0.2, 8], [w * 0.7, 14]]) {
        b.ell(cx, cy, 7, 2.5, '#ffffff'); b.ell(cx + 4, cy - 1.5, 4, 2.5, '#ffffff');
      }
    }
    // Snowy ground with a little hill
    const snow = night ? '#c9cbe6' : '#ffffff', snowShade = night ? '#a9abd0' : '#d6ecff';
    for (let x = 0; x < w; x++) {
      const top = groundTop + Math.round(Math.sin(x / 9) * 1.2);
      for (let y = top; y < h; y++) b.px[y * w + x] = y === top + 2 || y > h - 3 ? snowShade : snow;
    }
    if (night) {
      b.blit(S.gravestone(), 3, groundTop - 12);
      b.blit(S.jackOLantern(1), Math.max(16, w - 22), groundTop - 12);
    }
    paint(bg, b);
    bg.style.width = w * s + 'px';
    bg.style.height = h * s + 'px';
  }

  function applyLook() {
    frameCache = new Map();
    const s = scale();
    const p = frame('penguin', 'stand', 0), f = frame('puffle', 'stand', 0);
    penguinEl.style.width = p.w * s + 'px'; penguinEl.style.height = p.h * s + 'px';
    puffleEl.style.width = f.w * s + 'px'; puffleEl.style.height = f.h * s + 'px';
    // Sprites have a few transparent rows under the feet; tuck them into the snow.
    penguinEl.style.bottom = 2 * s + 'px';
    puffleEl.style.bottom = 2 * s + 'px';
    puffleEl.style.display = config.showPuffle ? '' : 'none';
    document.body.classList.toggle('night', config.scene === 'halloween');
    drawBackground();
  }

  // ---------- Movement & animation ----------

  const state = { x: 20, dir: 1, target: 120, pauseUntil: 0, px: 0, pdir: 1, talkingUntil: 0, jumpUntil: 0, nextBlink: 0 };
  const penguinW = () => penguinEl.offsetWidth || 108;
  const puffleW = () => puffleEl.offsetWidth || 72;
  const sceneWidth = () => Math.max(scene.clientWidth, penguinW() + 10);

  function pickTarget() {
    const max = sceneWidth() - penguinW();
    state.target = Math.random() * Math.max(1, max);
  }

  function tick(now) {
    const speed = Math.max(0.25, Math.min(3, Number(config.speed) || 1));
    const talking = now < state.talkingUntil;
    const idle = now < state.pauseUntil || talking;

    if (!idle) {
      const dx = state.target - state.x;
      if (Math.abs(dx) < 1.5) {
        state.pauseUntil = now + (Math.random() < 0.6 ? 1200 + Math.random() * 3500 : 0);
        pickTarget();
      } else {
        state.dir = dx > 0 ? 1 : -1;
        state.x += state.dir * 0.6 * speed * (scale() / 3);
      }
    }
    state.x = Math.max(0, Math.min(sceneWidth() - penguinW(), state.x));

    // Penguin pose
    const step = Math.floor(now / (170 / speed)) % 4;
    let pose = 'stand';
    if (talking) pose = Math.floor(now / 220) % 2 ? 'wave' : 'stand';
    else if (!idle) pose = ['walk1', 'stand', 'walk2', 'stand'][step];
    else {
      if (now > state.nextBlink) state.nextBlink = now + 2500 + Math.random() * 3000;
      if (state.nextBlink - now > 2350 && state.nextBlink - now < 2500) pose = 'blink';
    }
    paint(penguinEl, frame('penguin', pose, Math.floor(now / 90) % 2));
    penguinEl.style.transform = `translateX(${Math.round(state.x)}px) scaleX(${state.dir})`;

    // Puffle trails behind the penguin, hopping.
    const goal = state.x + (state.dir === 1 ? -puffleW() + 6 : penguinW() - 6);
    const clamped = Math.max(0, Math.min(sceneWidth() - puffleW(), goal));
    const pdx = clamped - state.px;
    state.px += pdx * 0.04 * speed;
    if (Math.abs(pdx) > 2) state.pdir = pdx > 0 ? 1 : -1;
    const moving = Math.abs(pdx) > 3;
    const s = scale();
    let lift = 0;
    let ppose = 'stand';
    if (now < state.jumpUntil) {
      const t = 1 - (state.jumpUntil - now) / 600;
      lift = Math.round(Math.sin(t * Math.PI) * 8) * s;
    } else if (moving) {
      const t = (now / (380 / speed)) % 1;
      lift = Math.round(Math.sin(t * Math.PI) * 3) * s;
      if (t < 0.12) ppose = 'squash';
    }
    paint(puffleEl, frame('puffle', ppose, 0));
    puffleEl.style.transform = `translate(${Math.round(state.px)}px, ${-lift}px) scaleX(${state.pdir})`;

    if (!bubble.classList.contains('hidden')) positionBubble();
    requestAnimationFrame(tick);
  }

  // ---------- Speech bubble ----------

  let bubbleTimer = 0;
  let lastMessage = -1;
  let bubbleOwner = 'penguin';

  function positionBubble() {
    const w = bubble.offsetWidth;
    const owner = bubbleOwner === 'penguin' ? penguinEl : puffleEl;
    const ownerX = bubbleOwner === 'penguin' ? state.x : state.px;
    const center = ownerX + owner.offsetWidth / 2;
    const left = Math.max(4, Math.min(sceneWidth() - w - 4, center - w / 2));
    bubble.style.left = left + 'px';
    bubble.style.bottom = owner.offsetHeight + 2 * scale() + 6 + 'px';
    bubble.style.setProperty('--tail', `${center - left}px`);
  }

  function say(text, title, owner = 'penguin') {
    bubbleOwner = owner;
    bubble.innerHTML = '';
    if (title) {
      const strong = document.createElement('strong');
      strong.textContent = title;
      bubble.appendChild(strong);
    }
    const span = document.createElement('span');
    span.textContent = text;
    bubble.appendChild(span);
    bubble.classList.remove('hidden');
    positionBubble();
    if (owner === 'penguin') state.talkingUntil = performance.now() + 1300;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.add('hidden'), 3400);
  }

  penguinEl.addEventListener('click', () => {
    const msgs = Array.isArray(config.messages) && config.messages.length ? config.messages : ['¡Waddle on!'];
    let i = Math.floor(Math.random() * msgs.length);
    if (msgs.length > 1 && i === lastMessage) i = (i + 1) % msgs.length;
    lastMessage = i;
    say(msgs[i], config.name);
  });

  puffleEl.addEventListener('click', () => {
    state.jumpUntil = performance.now() + 600;
    say(PUFFLE_LINES[Math.floor(Math.random() * PUFFLE_LINES.length)], 'Puffle', 'puffle');
  });

  // ---------- Snow ----------

  const snow = /** @type {HTMLElement} */ (document.getElementById('snow'));
  for (let i = 0; i < 16; i++) {
    const flake = document.createElement('i');
    flake.style.left = Math.random() * 100 + '%';
    flake.style.animationDuration = 6 + Math.random() * 6 + 's';
    flake.style.animationDelay = -Math.random() * 12 + 's';
    snow.appendChild(flake);
  }

  // ---------- Customizer ----------

  /** @type {any} */
  let draft = null;

  const LABELS = {
    'gorra-helice': 'gorra con hélice', 'gorro-lana': 'gorro de lana', corbatin: 'corbatín',
    audifonos: 'audífonos', delantal: 'delantal de café', fantasma: 'disfraz de fantasma',
    calabaza: 'calabaza', nieve: 'nieve de día', halloween: 'noche de Halloween'
  };

  function swatches(table, key) {
    return Object.entries(table)
      .map(([name, hex]) =>
        `<button class="swatch${draft[key] === name ? ' selected' : ''}" data-key="${key}" data-value="${name}" title="${name}" style="background:${hex}"></button>`)
      .join('');
  }

  function options(list, key) {
    return list.map((v) => `<option value="${v}"${draft[key] === v ? ' selected' : ''}>${LABELS[v] || v}</option>`).join('');
  }

  function renderCustomizer() {
    customizer.innerHTML = `
      <h3>🎨 Personaliza tu pingüino</h3>
      <canvas id="cPreview"></canvas>
      <label>Nombre <input id="cName" type="text" maxlength="20"></label>
      <div class="label">Color</div>
      <div class="swatches">${swatches(S.PENGUIN_COLORS, 'color')}</div>
      <label>Sombrero <select data-key="hat">${options(S.HATS, 'hat')}</select></label>
      <label>Ropa / accesorio <select data-key="accessory">${options(S.ACCESSORIES, 'accessory')}</select></label>
      <div class="label">Puffle <label class="inline"><input id="cShowPuffle" type="checkbox"${draft.showPuffle ? ' checked' : ''}> mostrar</label></div>
      <div class="swatches">${swatches(S.PUFFLE_COLORS, 'puffleColor')}</div>
      <label>Gorro del puffle <select data-key="puffleHat">${options(S.PUFFLE_HATS, 'puffleHat')}</select></label>
      <label>Escenario <select data-key="scene">${options(['nieve', 'halloween'], 'scene')}</select></label>
      <div class="actions">
        <button id="cCancel" class="secondary">Cancelar</button>
        <button id="cSave">Guardar</button>
      </div>`;
    /** @type {HTMLInputElement} */ (customizer.querySelector('#cName')).value = draft.name || '';
    drawPreview();
  }

  function drawPreview() {
    const canvas = /** @type {HTMLCanvasElement} */ (customizer.querySelector('#cPreview'));
    const b = new S.Buf(62, 52);
    b.blit(S.penguin(draft, 'stand', 0), 0, 0);
    if (draft.showPuffle) b.blit(S.puffle(draft, 'stand'), 36, 26);
    paint(canvas, b);
  }

  function openCustomizer() {
    draft = { ...config };
    renderCustomizer();
    customizer.classList.remove('hidden');
  }

  function closeCustomizer(save) {
    if (save && draft) {
      config = { ...draft };
      vscode.postMessage({
        type: 'save',
        config: {
          name: draft.name, color: draft.color, hat: draft.hat, accessory: draft.accessory,
          puffleColor: draft.puffleColor, puffleHat: draft.puffleHat, showPuffle: draft.showPuffle, scene: draft.scene
        }
      });
      applyLook();
      say('¡Me encanta mi nuevo look! ✨', config.name);
    }
    draft = null;
    customizer.classList.add('hidden');
  }

  customizer.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target.classList.contains('swatch')) {
      draft[/** @type {string} */ (target.dataset.key)] = target.dataset.value;
      renderCustomizer();
    } else if (target.id === 'cSave') {
      closeCustomizer(true);
    } else if (target.id === 'cCancel') {
      closeCustomizer(false);
    }
  });
  customizer.addEventListener('change', (e) => {
    const target = /** @type {HTMLInputElement} */ (e.target);
    if (target.dataset.key) draft[target.dataset.key] = target.value;
    if (target.id === 'cShowPuffle') draft.showPuffle = target.checked;
    drawPreview();
  });
  customizer.addEventListener('input', (e) => {
    const target = /** @type {HTMLInputElement} */ (e.target);
    if (target.id === 'cName') draft.name = target.value;
  });
  customizeBtn.addEventListener('click', () =>
    customizer.classList.contains('hidden') ? openCustomizer() : closeCustomizer(false));

  // ---------- Wiring ----------

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'config') {
      config = { ...config, ...msg.config };
      applyLook();
    } else if (msg.type === 'openCustomizer') {
      openCustomizer();
    }
  });

  new ResizeObserver(drawBackground).observe(scene);

  applyLook();
  pickTarget();
  state.px = state.x;
  vscode.postMessage({ type: 'ready' });
  requestAnimationFrame(tick);
})();
