// Clothes, "Dress to Impress" ([clothes-dress], [clothes-dress2]): the dress-up game with the model.
// Left page: spell the word → the piece of clothing is unlocked and can be dragged.
// Right page: drag it onto the model; click it to make it bigger/smaller, move it up/down (layers) or take it away.
// What students do is kept in `saved` (script.js), so "Clear answers" empties it too.

(() => {
  // w = width on the model, in % of the width of the dress-up area.
  // The drawing of a piece is img/dress/<name>.png (the name of the word, spaces → "-"), the model is img/dress/doll.png.
  // A drawing that is not there yet shows its emoji (the model: img/dress/doll.svg): add the file with that name and it appears.
  const SETS = [
    {
      id: '1', // [clothes-dress]: a casual day
      items: [
        { k: 'gym outfit', w: 30, emoji: '🎽' },
        { k: 'overalls', w: 30, emoji: '👖' },
        { k: 'sweatshirt', w: 28, emoji: '👕' },
        { k: 'oversize sweater', w: 32, emoji: '🧶' },
        { k: 'hoodie', w: 32, emoji: '🧥' },
        { k: 'cargo pants', w: 24, emoji: '👖' },
        { k: 'jeans', w: 24, emoji: '👖' },
        { k: 'shorts', w: 22, emoji: '🩳' },
        { k: 'colorful tights', w: 22, emoji: '🧦' },
        { k: 'sneakers', w: 18, emoji: '👟' },
        { k: 'combat boots', w: 18, emoji: '🥾' },
        { k: 'cap', w: 18, emoji: '🧢' },
        { k: 'sunglasses', w: 14, emoji: '🕶️' },
        { k: 'backpack', w: 18, emoji: '🎒' },
        { k: 'gloves', w: 14, emoji: '🧤' },
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
      ],
    },
  ];
  const BY_KEY = {};
  SETS.forEach(set => set.items.forEach(o => { BY_KEY[o.k] = o; }));
  const file = k => k.replace(/ /g, '-');

  const KEY = 'dress-up';
  const blank = () => ({ u: [], 1: [], 2: [] }); // unlocked words, pieces on each model
  let state;
  function load() {
    try { state = { ...blank(), ...JSON.parse(saved[KEY] || '{}') }; } catch { state = blank(); }
    state.u = state.u.filter(k => BY_KEY[k]); // words taken out of the game since the last visit
    SETS.forEach(set => { state[set.id] = state[set.id].filter(i => BY_KEY[i.k]); });
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
  });
  if (!SETS.every(set => set.cards && set.area)) return;
  const setOf = area => SETS.find(set => set.area === area);

  // a picture, or its emoji (a drawing that scales like the others) when the drawing is missing
  function picture(k, cls) {
    const img = document.createElement('img');
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
    const letters = word.replace(/ /g, '').toUpperCase().split('');
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

  // the first letter of each word is shown; the student types all the letters, no spaces
  function tiles(box, word, typed, done) {
    let n = 0;
    box.innerHTML = word.split('').map((ch, i) => {
      if (ch === ' ') return '<i class="gap"></i>';
      const t = typed[n++];
      if (done) return `<span class="done">${ch}</span>`;
      if (t) return `<span class="typed">${t}</span>`;
      const given = i === 0 || word[i - 1] === ' ';
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
    const letters = o.k.replace(/ /g, '');
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
    <button type="button" data-t="remove" title="Take it off">🗑</button>`;

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
      el.append(picture(item.k));
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
    tools.remove();
    document.querySelectorAll('.du-item.selected').forEach(el => el.classList.remove('selected'));
  }
  document.addEventListener('pointerdown', e => {
    if (selected && !e.target.closest?.('.du-item, .du-tools')) unselect();
  });

  tools.addEventListener('pointerdown', e => e.stopPropagation());
  tools.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || !selected) return;
    const { area, item } = selected;
    const items = state[setOf(area).id];
    const t = b.dataset.t;
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
