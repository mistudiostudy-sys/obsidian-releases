// @ts-check
(function () {
  const vscode = acquireVsCodeApi();

  const PENGUIN_COLORS = {
    azul: '#1d5fd1', rojo: '#d6262c', verde: '#3aa53a', rosa: '#ff8ad8', negro: '#2b2b2b',
    morado: '#8a3fd1', naranja: '#ff8a1f', amarillo: '#ffd21f', 'verde-oscuro': '#1f6e2e',
    'azul-claro': '#42b4ff', cafe: '#8b5a2b', durazno: '#ffb38a', aqua: '#19c7b8', lima: '#9be22d'
  };
  const PUFFLE_COLORS = {
    azul: '#2d7ff9', rosa: '#ff7ac8', negro: '#2b2b2b', verde: '#47c447', morado: '#9b51e0',
    rojo: '#e8343a', amarillo: '#ffd93b', blanco: '#f4f8ff', naranja: '#ff9330', cafe: '#9a6233',
    dorado: '#f5c518'
  };
  const HATS = ['ninguno', 'gorra-helice', 'fiesta', 'corona', 'vikingo', 'gorro-lana', 'bruja', 'copa'];
  const ACCESSORIES = ['ninguno', 'bufanda', 'corbatin', 'lentes', 'audifonos'];
  const PUFFLE_LINES = ['¡Brrr! 💕', '*boing boing*', '¡Puff puff!', '¿Me das una galleta? 🍪', '*ronronea feliz*', '¡Wiii!'];

  /** @type {any} */
  let config = {
    name: 'Pingüi', color: 'azul', hat: 'gorra-helice', accessory: 'bufanda', puffleColor: 'rosa',
    showPuffle: true, speed: 1, messages: ['¡Waddle on! 🐧']
  };

  const scene = /** @type {HTMLElement} */ (document.getElementById('scene'));
  const penguinEl = /** @type {HTMLElement} */ (document.getElementById('penguin'));
  const puffleEl = /** @type {HTMLElement} */ (document.getElementById('puffle'));
  const bubble = /** @type {HTMLElement} */ (document.getElementById('bubble'));
  const customizer = /** @type {HTMLElement} */ (document.getElementById('customizer'));
  const customizeBtn = /** @type {HTMLElement} */ (document.getElementById('customizeBtn'));

  const colorOf = (table, value, fallback) =>
    table[value] || (/^#[0-9a-f]{3,8}$/i.test(value || '') ? value : fallback);

  function shade(hex, amount) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + amount * 255)));
    return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  // ---------- Drawing ----------

  function hatSVG(hat) {
    switch (hat) {
      case 'gorra-helice':
        return `<path d="M17 17 Q32 -1 47 17 Z" fill="#e8343a"/>
          <path d="M32 2 Q24 6 21 16 L27 16 Q28 8 32 2Z" fill="#ffd21f"/>
          <path d="M32 2 Q40 6 43 16 L37 16 Q36 8 32 2Z" fill="#2d7ff9"/>
          <path d="M44 15 Q56 14 54 18 L44 18Z" fill="#2d7ff9"/>
          <rect x="31" y="-3" width="2" height="6" fill="#444"/>
          <g class="propeller"><ellipse cx="32" cy="-3" rx="10" ry="1.8" fill="#ffd21f" stroke="#c99700" stroke-width=".6"/></g>`;
      case 'fiesta':
        return `<path d="M23 15 L32 -10 L41 15Z" fill="#ff5fb0"/>
          <path d="M26.5 6 L37.5 6 L39 10 L25 10Z" fill="#ffd21f"/>
          <path d="M29.5 -2 L34.5 -2 L35.6 1 L28.4 1Z" fill="#42b4ff"/>
          <circle cx="32" cy="-10" r="3" fill="#ffd21f"/>`;
      case 'corona':
        return `<path d="M20 14 L20 3 L26 8.5 L32 0 L38 8.5 L44 3 L44 14Z" fill="#ffd21f" stroke="#c99700" stroke-width="1"/>
          <circle cx="32" cy="10" r="2" fill="#e8343a"/><circle cx="25" cy="11" r="1.5" fill="#2d7ff9"/><circle cx="39" cy="11" r="1.5" fill="#47c447"/>`;
      case 'vikingo':
        return `<path d="M18 13 Q8 9 9 -3 Q14 7 21 8Z" fill="#f4ecd8" stroke="#b8a77f" stroke-width=".8"/>
          <path d="M46 13 Q56 9 55 -3 Q50 7 43 8Z" fill="#f4ecd8" stroke="#b8a77f" stroke-width=".8"/>
          <path d="M16 18 Q32 -4 48 18Z" fill="#9aa4ae"/>
          <rect x="16" y="14" width="32" height="4.5" rx="1.5" fill="#7a5230"/>
          <circle cx="22" cy="16.2" r="1" fill="#ffd21f"/><circle cx="32" cy="16.2" r="1" fill="#ffd21f"/><circle cx="42" cy="16.2" r="1" fill="#ffd21f"/>`;
      case 'gorro-lana':
        return `<path d="M17 18 Q32 -2 47 18Z" fill="#47c447"/>
          <rect x="16" y="13.5" width="32" height="5.5" rx="2" fill="#2e8a2e"/>
          <path d="M20 9 L44 9" stroke="#fff" stroke-width="1.6" stroke-dasharray="2 2"/>
          <circle cx="32" cy="2" r="4.5" fill="#fff"/>`;
      case 'bruja':
        return `<path d="M22 13 L33 -14 L37 -8 L42 13Z" fill="#3b2160"/>
          <path d="M23.3 9.5 L40.9 9.5 L41.7 13 L22.5 13Z" fill="#ff8a1f"/>
          <ellipse cx="32" cy="14" rx="21" ry="3.6" fill="#2a1840"/>`;
      case 'copa':
        return `<rect x="22" y="-9" width="20" height="22" rx="1.5" fill="#222"/>
          <rect x="22" y="7" width="20" height="3.5" fill="#d6262c"/>
          <ellipse cx="32" cy="13.5" rx="18" ry="3" fill="#111"/>`;
      default:
        return '';
    }
  }

  function accessorySVG(accessory) {
    switch (accessory) {
      case 'bufanda':
        return `<path d="M16 37 Q32 46 48 37 L48 42.5 Q32 51 16 42.5Z" fill="#d6262c"/>
          <path d="M18 39 L46 39" stroke="#fff" stroke-width="1" stroke-dasharray="3 3" opacity=".7"/>
          <rect x="37" y="42" width="7" height="15" rx="2" fill="#b81f24" transform="rotate(-12 40 42)"/>`;
      case 'corbatin':
        return `<path d="M25 38 L32 41.5 L25 45Z M39 38 L32 41.5 L39 45Z" fill="#d6262c"/>
          <circle cx="32" cy="41.5" r="2" fill="#b81f24"/>`;
      case 'lentes':
        return `<rect x="20" y="19.5" width="11" height="7.5" rx="2.5" fill="#111"/>
          <rect x="33" y="19.5" width="11" height="7.5" rx="2.5" fill="#111"/>
          <path d="M31 22 L33 22" stroke="#111" stroke-width="1.5"/>
          <path d="M22 21 L25 21" stroke="#fff" stroke-width=".9" opacity=".7"/>
          <path d="M35 21 L38 21" stroke="#fff" stroke-width=".9" opacity=".7"/>`;
      case 'audifonos':
        return `<path d="M15 27 Q15 7 32 7 Q49 7 49 27" stroke="#333" stroke-width="3" fill="none"/>
          <rect x="11" y="21" width="7" height="12" rx="3" fill="#ff5fb0"/>
          <rect x="46" y="21" width="7" height="12" rx="3" fill="#ff5fb0"/>`;
      default:
        return '';
    }
  }

  function penguinSVG(c) {
    const body = colorOf(PENGUIN_COLORS, c.color, PENGUIN_COLORS.azul);
    const dark = shade(body, -0.18);
    const hasGlasses = c.accessory === 'lentes';
    return `<svg viewBox="0 -16 64 96" xmlns="http://www.w3.org/2000/svg">
      <g class="feet">
        <ellipse class="foot left" cx="24" cy="76" rx="8" ry="3.5" fill="#ffa000" stroke="#c96a00" stroke-width=".8"/>
        <ellipse class="foot right" cx="40" cy="76" rx="8" ry="3.5" fill="#ffa000" stroke="#c96a00" stroke-width=".8"/>
      </g>
      <g class="flipper left"><ellipse cx="13" cy="48" rx="5" ry="14" fill="${dark}" transform="rotate(22 13 48)"/></g>
      <g class="flipper right"><ellipse cx="51" cy="48" rx="5" ry="14" fill="${dark}" transform="rotate(-22 51 48)"/></g>
      <ellipse cx="32" cy="51" rx="20" ry="24" fill="${body}"/>
      <circle cx="32" cy="26" r="16" fill="${body}"/>
      <ellipse cx="32" cy="55" rx="14" ry="19" fill="#fff"/>
      <path d="M19 26 Q19 14 26.5 15.5 Q32 17.5 37.5 15.5 Q45 14 45 26 Q45 35 32 35.5 Q19 35 19 26Z" fill="#fff"/>
      ${hasGlasses ? '' : `<g class="eyes">
        <ellipse cx="27" cy="23" rx="2.7" ry="3.7" fill="#111"/>
        <ellipse cx="37" cy="23" rx="2.7" ry="3.7" fill="#111"/>
        <circle cx="27.9" cy="21.6" r=".95" fill="#fff"/><circle cx="37.9" cy="21.6" r=".95" fill="#fff"/>
      </g>`}
      <path d="M25.5 29 Q32 25.8 38.5 29 Q32 34.5 25.5 29Z" fill="#ffa000" stroke="#c96a00" stroke-width=".8"/>
      <ellipse cx="22" cy="30" rx="2.4" ry="1.4" fill="#ff8aa8" opacity=".55"/>
      <ellipse cx="42" cy="30" rx="2.4" ry="1.4" fill="#ff8aa8" opacity=".55"/>
      ${accessorySVG(c.accessory)}
      ${hatSVG(c.hat)}
    </svg>`;
  }

  function puffleSVG(c) {
    const color = colorOf(PUFFLE_COLORS, c.puffleColor, PUFFLE_COLORS.rosa);
    const dark = shade(color, -0.2);
    return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 13 Q9 2 17 8 Q19 -1 22 8 Q29 1 27 13Z" fill="${dark}"/>
      <circle cx="20" cy="25" r="14" fill="${color}"/>
      <ellipse cx="15" cy="16.5" rx="4" ry="2" fill="#fff" opacity=".35"/>
      <ellipse cx="15.5" cy="23" rx="3.8" ry="4.8" fill="#fff"/>
      <ellipse cx="25.5" cy="23" rx="3.8" ry="4.8" fill="#fff"/>
      <circle cx="16.8" cy="23.8" r="2.1" fill="#111"/>
      <circle cx="26.8" cy="23.8" r="2.1" fill="#111"/>
      <path d="M17 30 Q21 33.5 25 30" stroke="#111" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  function render() {
    penguinEl.innerHTML = penguinSVG(config);
    puffleEl.innerHTML = puffleSVG(config);
    puffleEl.style.display = config.showPuffle ? '' : 'none';
  }

  // ---------- Movement ----------

  const PENGUIN_W = 64;
  const PUFFLE_W = 30;
  const state = {
    x: 20, dir: 1, target: 120, pauseUntil: 0,
    px: 0, pdir: 1, talkingUntil: 0
  };

  function sceneWidth() {
    return Math.max(scene.clientWidth, PENGUIN_W + 10);
  }

  function pickTarget() {
    const max = sceneWidth() - PENGUIN_W - 4;
    state.target = 4 + Math.random() * Math.max(1, max - 4);
  }

  function tick(now) {
    const speed = Math.max(0.25, Math.min(3, Number(config.speed) || 1));
    const idle = now < state.pauseUntil || now < state.talkingUntil;

    if (!idle) {
      const dx = state.target - state.x;
      if (Math.abs(dx) < 1.5) {
        // Arrived: sometimes rest a little before walking again.
        state.pauseUntil = now + (Math.random() < 0.6 ? 1200 + Math.random() * 3500 : 0);
        pickTarget();
      } else {
        state.dir = dx > 0 ? 1 : -1;
        state.x += state.dir * 0.7 * speed;
      }
    }
    state.x = Math.max(0, Math.min(sceneWidth() - PENGUIN_W, state.x));
    penguinEl.classList.toggle('walking', !idle);
    penguinEl.style.transform = `translateX(${state.x}px)`;

    // Puffle trails behind the penguin.
    const goal = state.x + (state.dir === 1 ? -PUFFLE_W - 4 : PENGUIN_W + 4);
    const clamped = Math.max(0, Math.min(sceneWidth() - PUFFLE_W, goal));
    const pdx = clamped - state.px;
    state.px += pdx * 0.04 * speed;
    if (Math.abs(pdx) > 2) state.pdir = pdx > 0 ? 1 : -1;
    puffleEl.classList.toggle('hopping', Math.abs(pdx) > 3);
    puffleEl.style.transform = `translateX(${state.px}px) scaleX(${state.pdir})`;

    if (!bubble.classList.contains('hidden')) positionBubble();
    requestAnimationFrame(tick);
  }

  // ---------- Speech bubble ----------

  let bubbleTimer = 0;
  let lastMessage = -1;

  function positionBubble() {
    const w = bubble.offsetWidth;
    const center = state.x + PENGUIN_W / 2;
    const left = Math.max(4, Math.min(sceneWidth() - w - 4, center - w / 2));
    bubble.style.left = left + 'px';
    bubble.style.setProperty('--tail', `${center - left}px`);
  }

  function say(text, title) {
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
    state.talkingUntil = performance.now() + 3200;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.add('hidden'), 3200);
  }

  penguinEl.addEventListener('click', () => {
    const msgs = Array.isArray(config.messages) && config.messages.length ? config.messages : ['¡Waddle on!'];
    let i = Math.floor(Math.random() * msgs.length);
    if (msgs.length > 1 && i === lastMessage) i = (i + 1) % msgs.length;
    lastMessage = i;
    penguinEl.classList.remove('wave');
    void penguinEl.offsetWidth;
    penguinEl.classList.add('wave');
    say(msgs[i], config.name);
  });

  puffleEl.addEventListener('click', () => {
    puffleEl.classList.remove('jump');
    void puffleEl.offsetWidth;
    puffleEl.classList.add('jump');
    say(PUFFLE_LINES[Math.floor(Math.random() * PUFFLE_LINES.length)], 'Puffle');
  });

  // ---------- Snow ----------

  const snow = /** @type {HTMLElement} */ (document.getElementById('snow'));
  for (let i = 0; i < 18; i++) {
    const flake = document.createElement('i');
    flake.style.left = Math.random() * 100 + '%';
    flake.style.animationDuration = 5 + Math.random() * 6 + 's';
    flake.style.animationDelay = -Math.random() * 10 + 's';
    flake.style.opacity = String(0.4 + Math.random() * 0.6);
    flake.style.width = flake.style.height = 2 + Math.random() * 3 + 'px';
    snow.appendChild(flake);
  }

  // ---------- Customizer ----------

  let draft = null;

  function swatches(table, key) {
    return Object.entries(table)
      .map(([name, hex]) =>
        `<button class="swatch${draft[key] === name ? ' selected' : ''}" data-key="${key}" data-value="${name}" title="${name}" style="background:${hex}"></button>`)
      .join('');
  }

  function options(list, key) {
    return list.map((v) => `<option value="${v}"${draft[key] === v ? ' selected' : ''}>${v.replace('-', ' ')}</option>`).join('');
  }

  function renderCustomizer() {
    customizer.innerHTML = `
      <h3>🎨 Personaliza tu pingüino</h3>
      <label>Nombre <input id="cName" type="text" maxlength="20"></label>
      <div class="label">Color</div>
      <div class="swatches">${swatches(PENGUIN_COLORS, 'color')}</div>
      <label>Sombrero <select data-key="hat">${options(HATS, 'hat')}</select></label>
      <label>Accesorio <select data-key="accessory">${options(ACCESSORIES, 'accessory')}</select></label>
      <div class="label">Puffle <label class="inline"><input id="cShowPuffle" type="checkbox"${draft.showPuffle ? ' checked' : ''}> mostrar</label></div>
      <div class="swatches">${swatches(PUFFLE_COLORS, 'puffleColor')}</div>
      <div class="actions">
        <button id="cCancel" class="secondary">Cancelar</button>
        <button id="cSave">Guardar</button>
      </div>`;
    /** @type {HTMLInputElement} */ (customizer.querySelector('#cName')).value = draft.name || '';
  }

  function preview() {
    const saved = config;
    config = draft;
    render();
    config = saved;
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
          puffleColor: draft.puffleColor, showPuffle: draft.showPuffle
        }
      });
      say('¡Me encanta mi nuevo look! ✨', config.name);
    }
    draft = null;
    customizer.classList.add('hidden');
    render();
  }

  customizer.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target.classList.contains('swatch')) {
      draft[target.dataset.key] = target.dataset.value;
      renderCustomizer();
      preview();
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
    preview();
  });
  customizer.addEventListener('input', (e) => {
    const target = /** @type {HTMLInputElement} */ (e.target);
    if (target.id === 'cName') draft.name = target.value;
  });
  customizeBtn.addEventListener('click', () =>
    customizer.classList.contains('hidden') ? openCustomizer() : closeCustomizer(false));

  // ---------- Messages from the extension ----------

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'config') {
      config = { ...config, ...msg.config };
      if (!draft) render();
    } else if (msg.type === 'openCustomizer') {
      openCustomizer();
    }
  });

  render();
  pickTarget();
  state.px = state.x;
  vscode.postMessage({ type: 'ready' });
  requestAnimationFrame(tick);
})();
