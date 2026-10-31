// Clothes, "Dress to Impress" ([clothes-dress], [clothes-dress2]): the dress-up game with the model.
// Left page: spell the word → the piece of clothing is unlocked and can be dragged.
// Right page: drag it onto the model; click it to make it bigger/smaller, move it up/down (layers) or take it away.
// A piece on the model can be painted: only the white of the drawing takes the color, the lines stay black.
// "Print my model" prints the dressed model alone on an A4 sheet.
// What students do is kept in `saved` (script.js), so "Clear answers" empties it too.

(() => {
  // w = width on the model, in % of the width of the dress-up area. The drawings of the pieces done so far were drawn on the same
  // page as the model, so w = pixel width of the piece (after the 50% scale) × 91.4 / 1492 (the model picture is 1492 px high and 91.4% of the area high).
  // The drawing of a piece is img/dress/<name>.png (the name of the word, spaces → "-"), the model is img/dress/doll.png.
  // A drawing that is not there yet shows its emoji (the model: img/dress/doll.svg): add the file with that name and it appears.
  const SETS = [
    {
      id: '1', // [clothes-dress]: a casual day
      items: [
        { k: 'gym outfit', w: 51.6, emoji: '🎽' },
        { k: 'overalls', w: 23.4, emoji: '👖' },
        { k: 'sweatshirt', w: 28, emoji: '👕' },
        { k: 'oversize sweater', w: 51.2, emoji: '🧶' },
        { k: 'hoodie', w: 49.8, emoji: '🧥' },
        { k: 'cargo pants', w: 23.5, emoji: '👖' },
        { k: 'jeans', w: 23.8, emoji: '👖' },
        { k: 'shorts', w: 23.9, emoji: '🩳' },
        { k: 'colorful tights', w: 22.1, emoji: '🧦' },
        { k: 'sneakers', w: 23.6, emoji: '👟' },
        { k: 'combat boots', w: 23.9, emoji: '🥾' },
        { k: 'cap', w: 27.1, emoji: '🧢' },
        { k: 'sunglasses', w: 14, emoji: '🕶️' },
        { k: 'backpack', w: 18, emoji: '🎒' },
        { k: 'gloves', w: 62.3, emoji: '🧤' },
        { k: 't-shirt', w: 27, emoji: '👕' },
        { k: 'skirt', w: 26.2, emoji: '👗' },
        { k: 'socks', w: 14, emoji: '🧦' },
        { k: 'scarf', w: 24, emoji: '🧣' },
        { k: 'raincoat', w: 57.5, emoji: '🌧️' },
      ],
    },
    {
      id: '2', // [clothes-dress2]: a fancy party
      items: [
        { k: 'fancy jacket', w: 32, emoji: '🧥' },
        { k: 'vest', w: 26, emoji: '🦺' },
        { k: 'colorful coat', w: 38, emoji: '🌈' },
        { k: 'fur coat', w: 38, emoji: '🐻' },
        { k: 'shirt', w: 28, emoji: '👔' },
        { k: 'dress', w: 30, emoji: '👗' },
        { k: 'suit pants', w: 24, emoji: '👖' },
        { k: 'bell bottoms', w: 26, emoji: '🔔' },
        { k: 'maxi skirt', w: 28, emoji: '👘' },
        { k: 'loafers', w: 18, emoji: '👞' },
        { k: 'cowboy boots', w: 18, emoji: '🤠' },
        { k: 'high heels', w: 16, emoji: '👠' },
        { k: 'top hat', w: 20, emoji: '🎩' },
        { k: 'tie', w: 9, emoji: '🎀' },
        { k: 'wig', w: 22, emoji: '💇' },
        { k: 'necklace', w: 16, emoji: '📿' },
        { k: 'earrings', w: 8, emoji: '💎' },
        { k: 'handbag', w: 18, emoji: '👜' },
        { k: 'belt', w: 22, emoji: '🥋' },
        { k: 'bracelet', w: 10, emoji: '⌚' },
      ],
    },
  ];
  const BY_KEY = {};
  SETS.forEach(set => set.items.forEach(o => { BY_KEY[o.k] = o; }));
  const file = k => k.replace(/ /g, '-');

  const KEY = 'dress-up';
  const COLOR = /^#[0-9a-f]{6}$/i;
  const BACKGROUNDS = ['#efb5d3', '#ffd6e0', '#ffe3b3', '#fff3a8', '#c9efc3', '#b5e6e3', '#b9d7f5', '#d4c2f2', '#ffffff', '#6b6b78', '#2b2733'];
  const PAINTS = ['#ff6b6b', '#ff9f43', '#ffd93d', '#6bcb77', '#4dd0c8', '#4d96ff', '#9b5de5', '#f15bb5', '#a0693b', '#4a4a4a'];
  const blank = () => ({ u: [], 1: [], 2: [], bg: {} }); // unlocked words, pieces on each model, background color of each
  let state;
  function load() {
    try { state = { ...blank(), ...JSON.parse(saved[KEY] || '{}') }; } catch { state = blank(); }
    if (!state.bg || typeof state.bg !== 'object') state.bg = {};
    state.u = state.u.filter(k => BY_KEY[k]); // words taken out of the game since the last visit
    SETS.forEach(set => {
      state[set.id] = state[set.id].filter(i => BY_KEY[i.k]);
      state[set.id].forEach(i => { if (!COLOR.test(i.c)) delete i.c; });
    });
  }
  function store() {
    saved[KEY] = JSON.stringify(state);
    persist();
  }
  load();

  const $ = id => document.getElementById(id);
  // the page elements of each set: #du-cards-1, #du-doll-1, #du-score-1…
  SETS.forEach(set => {
    set.cards = $(`du-cards-${set.id}`);
    set.area = $(`du-doll-${set.id}`);
    set.score = $(`du-score-${set.id}`);
    set.reset = $(`du-reset-${set.id}`);
    set.print = $(`du-print-${set.id}`);
    set.bgBtn = $(`du-bg-${set.id}`);
  });
  if (!SETS.every(set => set.cards && set.area)) return;
  const setOf = area => SETS.find(set => set.area === area);

  // Painting = multiplying the picture by a color: white becomes the color, black stays black, the outside stays clear.
  // An SVG filter does it (drawing on a canvas is blocked when the book is opened from a file).
  const filters = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  filters.setAttribute('width', '0');
  filters.setAttribute('height', '0');
  filters.setAttribute('aria-hidden', 'true');
  filters.style.position = 'absolute';
  document.body.append(filters);
  function tint(c) {
    const id = `du-tint-${c.slice(1).toLowerCase()}`;
    if (!filters.querySelector(`#${id}`)) {
      const [r, g, b] = [1, 3, 5].map(i => (parseInt(c.slice(i, i + 2), 16) / 255).toFixed(3));
      filters.insertAdjacentHTML('beforeend', `<filter id="${id}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0"/></filter>`);
    }
    return `url(#${id})`;
  }

  // a picture, or its emoji (a drawing that scales like the others) when the drawing is missing
  function picture(k, cls, color) {
    const img = document.createElement('img');
    if (color) img.style.filter = tint(color);
    img.src = `img/dress/${file(k)}.png`;
    img.alt = k;
    img.draggable = false;
    img.className = cls || '';
    img.onerror = () => {
      img.onerror = null;
      img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="52" font-size="78" text-anchor="middle" dominant-baseline="central">${BY_KEY[k].emoji}</text></svg>`)}`;
      img.title = `${k}: drawing to add (img/dress/${file(k)}.png)`;
    };
    return img;
  }

  /* ================= left page: spell → unlock ================= */

  const shuffle = word => {
    const letters = word.replace(/[ -]/g, '').toUpperCase().split('');
    const original = letters.join('');
    if (new Set(letters).size < 2) return letters;
    do {
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
    } while (letters.join('') === original);
    return letters;
  };

  // the first letter of each word is shown; the student types all the letters, no spaces or hyphens
  function tiles(box, word, typed, done) {
    let n = 0;
    box.innerHTML = word.split('').map((ch, i) => {
      if (ch === ' ') return '<i class="gap"></i>';
      if (ch === '-') return '<i class="dash">-</i>';
      const t = typed[n++];
      if (done) return `<span class="done">${ch}</span>`;
      if (t) return `<span class="typed">${t}</span>`;
      const given = i === 0 || word[i - 1] === ' ' || word[i - 1] === '-';
      return given ? `<span class="given">${ch}</span>` : '<span>_</span>';
    }).join('');
  }

  function card(set, o) {
    const unlocked = state.u.includes(o.k);
    const el = document.createElement('div');
    el.className = `du-card${unlocked ? ' unlocked' : ''}`;
    el.dataset.k = o.k;
    const pic = document.createElement('div');
    pic.className = 'du-pic';
    const tile = document.createElement('span');
    tile.className = 'du-model';
    tile.append(picture(o.k));
    pic.append(tile);
    if (unlocked) {
      tile.title = 'Drag me onto the model';
      dragSource(tile, () => ({ k: o.k, set }));
    } else pic.insertAdjacentHTML('beforeend', '<span class="du-lock">🔒</span>');
    const tl = document.createElement('div');
    tl.className = 'du-tiles';
    tiles(tl, o.k.toUpperCase(), '', unlocked);
    el.append(pic, tl);

    if (unlocked) {
      el.insertAdjacentHTML('beforeend', '<span class="du-status">✔ drag it onto the model →</span>');
      return el;
    }
    const row = document.createElement('div');
    row.className = 'du-row';
    const inp = document.createElement('input');
    const letters = o.k.replace(/[ -]/g, '');
    inp.className = 'du-in';
    inp.maxLength = letters.length;
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    inp.setAttribute('aria-label', `Word ${set.items.indexOf(o) + 1}: ${o.k.length} characters`);
    const hint = document.createElement('button');
    hint.type = 'button';
    hint.className = 'du-hint';
    hint.textContent = '💡';
    hint.title = 'Show the letters';
    const scr = document.createElement('div');
    scr.className = 'du-scramble';
    scr.hidden = true;
    let mixed = null;

    function update() {
      inp.value = inp.value.replace(/[^a-z]/gi, '').toUpperCase();
      tiles(tl, o.k.toUpperCase(), inp.value, false);
      if (!scr.hidden) scramble();
      if (inp.value === letters.toUpperCase()) {
        inp.classList.add('ok');
        setTimeout(() => unlock(set, o.k), 350);
      }
    }
    // the letters typed (or clicked) are grayed out
    function scramble() {
      const used = mixed.map(() => false);
      inp.value.split('').forEach(ch => { const i = mixed.findIndex((m, j) => !used[j] && m === ch); if (i >= 0) used[i] = true; });
      scr.innerHTML = mixed.map((ch, i) => `<button type="button" ${used[i] ? 'disabled' : ''} data-l="${ch}">${ch}</button>`).join('') +
        `<button type="button" class="back" data-l="" ${inp.value ? '' : 'disabled'} aria-label="Delete the last letter">⌫</button>`;
    }
    inp.addEventListener('input', update);
    hint.addEventListener('click', () => {
      mixed ||= shuffle(o.k);
      scr.hidden = !scr.hidden;
      hint.classList.toggle('on', !scr.hidden);
      if (!scr.hidden) scramble();
    });
    scr.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      inp.value = b.dataset.l ? inp.value + b.dataset.l : inp.value.slice(0, -1);
      update();
    });
    row.append(inp, hint);
    el.append(row, scr);
    return el;
  }

  function unlock(set, k) {
    if (state.u.includes(k)) return;
    state.u.push(k);
    store();
    const old = set.cards.querySelector(`[data-k="${k}"]`);
    const fresh = card(set, BY_KEY[k]);
    fresh.classList.add('pop');
    old.replaceWith(fresh);
    score(set);
  }

  function score(set) {
    set.score.textContent = `🔓 ${set.items.filter(o => state.u.includes(o.k)).length} / ${set.items.length} unlocked`;
  }

  function drawCards(set) {
    set.cards.replaceChildren(...set.items.map(o => card(set, o)));
    score(set);
  }

  /* ================= dragging ================= */
  // From a card onto the model of its spread. Works with mouse, pen and fingers (pointer events).

  let ghost = null;

  function dragSource(el, info) {
    el.classList.add('du-grab');
    el.addEventListener('pointerdown', e => {
      if (e.button) return;
      e.preventDefault();
      const start = { x: e.clientX, y: e.clientY };
      const { k, set } = info();
      const move = ev => {
        if (!ghost && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 5) return;
        if (!ghost) {
          ghost = document.createElement('div');
          ghost.className = 'du-ghost';
          ghost.append(picture(k));
          document.body.append(ghost);
        }
        ghost.style.left = `${ev.clientX}px`;
        ghost.style.top = `${ev.clientY}px`;
        set.area.classList.toggle('over', !!dropAt(ev, set));
      };
      const up = ev => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        set.area.classList.remove('over');
        if (!ghost) return;
        ghost.remove();
        ghost = null;
        if (ev.type === 'pointerup' && dropAt(ev, set)) drop(set, k, ev.clientX, ev.clientY);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
  }

  function dropAt(ev, set) {
    const r = set.area.getBoundingClientRect();
    return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom ? set.area : null;
  }

  function drop(set, k, cx, cy) {
    const area = set.area;
    const r = area.getBoundingClientRect();
    const items = state[set.id];
    const item = { k, w: BY_KEY[k].w, z: Math.max(0, ...items.map(i => i.z)) + 1 };
    item.x = (cx - r.left) / r.width * 100 - item.w / 2;
    item.y = (cy - r.top) / r.height * 100 - 5;
    items.push(item);
    store();
    drawArea(area);
    select(area, item);
    const el = area.querySelector(`.du-item[data-i="${items.indexOf(item)}"]`);
    // put the center under the pointer when the size is known
    const fix = () => {
      const h = el.getBoundingClientRect().height / r.height * 100;
      item.y = (cy - r.top) / r.height * 100 - h / 2;
      el.style.top = `${item.y}%`;
      store();
      place();
    };
    const pic = el.querySelector('img');
    if (pic && !pic.complete) pic.addEventListener('load', fix, { once: true }); else fix();
  }

  /* ================= pieces on the model ================= */

  let selected = null; // { area, item }
  const tools = document.createElement('div');
  tools.className = 'du-tools';
  tools.innerHTML = `
    <button type="button" data-t="bigger" title="Bigger">➕</button>
    <button type="button" data-t="smaller" title="Smaller">➖</button>
    <button type="button" data-t="front" title="Bring to the front">⬆</button>
    <button type="button" data-t="back" title="Send to the back">⬇</button>
    <button type="button" data-t="paint" title="Color it">🎨</button>
    <button type="button" data-t="remove" title="Take it off">🗑</button>
    <div class="du-colors">
      <button type="button" data-c="" class="none" title="White, as drawn"></button>
      ${PAINTS.map(c => `<button type="button" data-c="${c}" style="background:${c}" title="${c}"></button>`).join('')}
      <label title="Any color"><input type="color" value="#ff6b6b" aria-label="Pick a color"></label>
    </div>`;

  function drawArea(area) {
    area.querySelectorAll('.du-item').forEach(el => el.remove());
    state[setOf(area).id].forEach((item, i) => {
      const el = document.createElement('div');
      el.className = 'du-item';
      el.dataset.i = i;
      el.dataset.k = item.k;
      el.style.left = `${item.x}%`;
      el.style.top = `${item.y}%`;
      el.style.width = `${item.w}%`;
      el.style.zIndex = 10 + item.z;
      el.append(picture(item.k, '', item.c));
      el.title = item.k;
      movable(area, el, item);
      area.append(el);
    });
    if (selected?.area === area) {
      if (state[setOf(area).id].includes(selected.item)) select(area, selected.item); else unselect();
    }
  }

  function movable(area, el, item) {
    el.addEventListener('pointerdown', e => {
      if (e.button) return;
      e.preventDefault();
      e.stopPropagation();
      const r = area.getBoundingClientRect();
      const start = { x: e.clientX, y: e.clientY, ix: item.x, iy: item.y };
      let moved = false;
      el.setPointerCapture(e.pointerId);
      const move = ev => {
        const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
        if (!moved && Math.hypot(dx, dy) < 4) return;
        moved = true;
        item.x = start.ix + dx / r.width * 100;
        item.y = start.iy + dy / r.height * 100;
        el.style.left = `${item.x}%`;
        el.style.top = `${item.y}%`;
        if (selected?.item === item) place();
      };
      const up = () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        if (moved) store();
        select(area, item);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
  }

  function select(area, item) {
    if (selected?.item !== item) tools.classList.remove('paint');
    selected = { area, item };
    const i = state[setOf(area).id].indexOf(item);
    area.querySelectorAll('.du-item').forEach(el => el.classList.toggle('selected', +el.dataset.i === i));
    area.append(tools);
    place();
  }
  function place() {
    if (!selected) return;
    const { item } = selected;
    tools.style.left = `${Math.max(12, Math.min(item.x + item.w / 2, 88))}%`;
    tools.style.top = `${Math.max(item.y, 10)}%`;
  }
  function unselect() {
    selected = null;
    tools.classList.remove('paint');
    tools.remove();
    document.querySelectorAll('.du-item.selected').forEach(el => el.classList.remove('selected'));
  }
  document.addEventListener('pointerdown', e => {
    if (selected && !e.target.closest?.('.du-item, .du-tools')) unselect();
  });

  tools.addEventListener('pointerdown', e => e.stopPropagation());
  // paint the selected piece (c = '' → back to the white of the drawing)
  function paint(c) {
    const { area, item } = selected;
    if (c) item.c = c; else delete item.c;
    const img = area.querySelector(`.du-item[data-i="${state[setOf(area).id].indexOf(item)}"] img`);
    if (img) img.style.filter = c ? tint(c) : '';
    store();
  }
  tools.querySelector('input').addEventListener('input', e => { if (selected) paint(e.target.value); });

  tools.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || !selected) return;
    if ('c' in b.dataset) { paint(b.dataset.c); return; }
    const { area, item } = selected;
    const items = state[setOf(area).id];
    const t = b.dataset.t;
    if (t === 'paint') { tools.classList.toggle('paint'); return; }
    if (t === 'bigger' || t === 'smaller') {
      // a little bigger / smaller, around its center
      const el = area.querySelector(`.du-item[data-i="${items.indexOf(item)}"]`);
      const h = el.offsetHeight / area.offsetHeight * 100;
      const w = Math.max(4, Math.min(item.w * (t === 'bigger' ? 1.1 : 1 / 1.1), 80));
      item.x -= (w - item.w) / 2;
      item.y -= (h * w / item.w - h) / 2;
      item.w = w;
    }
    if (t === 'front') item.z = Math.max(...items.map(i => i.z)) + 1;
    if (t === 'back') item.z = Math.min(...items.map(i => i.z)) - 1;
    if (t === 'remove') { items.splice(items.indexOf(item), 1); selected = null; tools.remove(); }
    store();
    drawArea(area);
  });

  /* ================= background of the model ================= */
  // the pink of the book until a color is chosen
  const backgroundOf = set => (COLOR.test(state.bg[set.id]) ? state.bg[set.id] : '');
  function applyBg(set) { set.area.style.background = backgroundOf(set); }
  function chooseBg(set, c) {
    if (c) state.bg[set.id] = c; else delete state.bg[set.id];
    applyBg(set);
    store();
  }
  SETS.forEach(set => {
    if (!set.bgBtn) return;
    const pal = document.createElement('div');
    pal.className = 'du-bgpal abs';
    pal.hidden = true;
    pal.style.cssText = set.bgBtn.style.cssText.replace(/--y:[\d.]+/, `--y:${parseFloat(set.bgBtn.style.getPropertyValue('--y')) + 4.4}`);
    pal.innerHTML = BACKGROUNDS.map((c, i) => `<button type="button" data-c="${i ? c : ''}" style="background:${c}" title="${i ? c : 'Pink, as in the book'}"></button>`).join('') +
      '<label title="Any color"><input type="color" value="#efb5d3" aria-label="Pick a background color"></label>';
    set.bgBtn.after(pal);
    set.bgBtn.addEventListener('click', () => { pal.hidden = !pal.hidden; });
    pal.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) chooseBg(set, b.dataset.c);
    });
    pal.querySelector('input').addEventListener('input', e => chooseBg(set, e.target.value));
  });

  /* ================= print the model ================= */
  // The dressed model alone on an A4 sheet, printed from a hidden frame (the book itself is not touched).
  function printModel(set) {
    const abs = f => new URL(f, document.baseURI).href;
    const items = [...state[set.id]].sort((a, b) => a.z - b.z);
    items.forEach(i => { if (i.c) tint(i.c); });
    const theme = set.area.closest('.page')?.querySelector('.du-theme')?.lastChild?.textContent || '';
    const pieces = items.map(i => `<div class="it" style="left:${i.x}%;top:${i.y}%;width:${i.w}%"><img src="${abs(`img/dress/${file(i.k)}.png`)}" alt="${i.k}"${i.c ? ` style="filter:${tint(i.c)}"` : ''}></div>`).join('');
    const fr = document.createElement('iframe');
    fr.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:0';
    fr.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>My model</title><style>
      @page { size: A4 portrait; margin: 12mm; }
      body { margin: 0; text-align: center; font-family: 'Nunito', Arial, sans-serif; color: #555; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      h1 { margin: 0 0 1mm; font: 700 28pt 'Fredoka', 'Nunito', Arial, sans-serif; color: #8e2de2; }
      p { margin: 0 0 5mm; font-size: 13pt; }
      .area { position: relative; width: 184mm; height: 184mm; margin: 0 auto 6mm; overflow: hidden; border: 1mm solid #dc3394; border-radius: 6mm; background: ${backgroundOf(set) || 'linear-gradient(#efb5d3 0 82%, #d98fba 82% calc(82% + .5mm), #e8a6c9 calc(82% + .5mm))'}; }
      .doll { position: absolute; left: 50%; top: 3%; height: 91.4%; transform: translateX(-50%); }
      .it { position: absolute; }
      .it img { display: block; width: 100%; height: auto; }
      .name { text-align: left; margin: 0 4mm; font-size: 13pt; }
      </style></head><body>
      <h1>My model</h1><p>${theme}</p>
      <div class="area"><img class="doll" src="${abs('img/dress/doll.png')}" onerror="this.onerror=null;this.src='${abs('img/dress/doll.svg')}'" alt="">${pieces}</div>
      <p class="name">Name: ______________________ &nbsp; My model is wearing …</p>
      ${filters.outerHTML}</body></html>`;
    const done = () => fr.remove();
    fr.onload = async () => {
      const w = fr.contentWindow;
      await Promise.all([...w.document.images].map(im => (im.complete ? null : new Promise(r => { im.onload = im.onerror = r; }))));
      w.addEventListener('afterprint', done);
      setTimeout(done, 5 * 60 * 1000);
      w.focus();
      w.print();
    };
    document.body.append(fr);
  }
  SETS.forEach(set => set.print?.addEventListener('click', () => printModel(set)));

  SETS.forEach(set => set.reset?.addEventListener('click', () => {
    state[set.id] = [];
    store();
    unselect();
    drawArea(set.area);
  }));

  /* ================= start ================= */

  function drawAll() {
    unselect();
    SETS.forEach(set => {
      drawCards(set);
      applyBg(set);
      drawArea(set.area);
    });
  }
  drawAll();

  // "Clear answers" (script.js) empties `saved`: start again
  $('clearBtn').addEventListener('click', () => {
    if (saved[KEY]) return;
    load();
    drawAll();
  });
})();
