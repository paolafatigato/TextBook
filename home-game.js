// Home (pp. 40-43): the logic of "Home Sweet Vocab".
// p. 40: spell the word → the object is unlocked.
// p. 41: drag the unlocked objects into the house (as many as you like).
// p. 43: room missions, every object once: the missions check the prepositions of place.
// What students do is kept in `saved` (script.js), so "Clear answers" empties it too.

(() => {
  // w = width in the house, in % of the house width.
  // A drawing that is not in img/home/ yet shows its emoji: add the file with that name and it appears.
  const WORDS = [
    { k: 'bed', w: 13, emoji: '🛏️' },
    { k: 'wardrobe', w: 8, emoji: '🚪' },
    { k: 'bedside table', w: 5, emoji: '🗄️' },
    { k: 'shelf', w: 9, emoji: '📚' },
    { k: 'mirror', w: 4.5, emoji: '🪞' },
    { k: 'curtains', w: 8, emoji: '🪟' },
    { k: 'sofa', w: 13, emoji: '🛋️' },
    { k: 'armchair', w: 7, emoji: '💺' },
    { k: 'table', w: 11, emoji: '🪵' },
    { k: 'chair', w: 4.5, emoji: '🪑' },
    { k: 'lamp', w: 3.5, emoji: '💡' },
    { k: 'clock', w: 4, emoji: '🕰️' },
    { k: 'plant', w: 4.5, emoji: '🪴' },
    { k: 'window', w: 11, emoji: '🪟' },
    { k: 'fridge', w: 5.5, emoji: '🧊' },
    { k: 'cooker', w: 7, emoji: '🍳' },
    { k: 'sink', w: 9, emoji: '🚰' },
    { k: 'kettle', w: 3, emoji: '🫖' },
    { k: 'cupboard', w: 9, emoji: '🗄️' },
    { k: 'pot', w: 4, emoji: '🍲' },
    { k: 'toilet', w: 4, emoji: '🚽' },
    { k: 'shower', w: 6, emoji: '🚿' },
    { k: 'bath', w: 12, emoji: '🛁' },
    { k: 'computer', w: 5.5, emoji: '💻' },
  ];
  const BY_KEY = Object.fromEntries(WORDS.map(o => [o.k, o]));
  const src = k => `img/home/${k.replace(/ /g, '-')}.png`;

  // p. 43: the objects of the room (w = % of the room width) and the missions
  const ROOM = { window: 18, table: 22, computer: 10, chair: 9, plant: 8, sofa: 28, clock: 7, shelf: 18, lamp: 6, bin: 7 };
  const EXTRA = { bin: { k: 'bin', emoji: '🗑️' } };
  const MISSIONS = [
    { a: 'table', rel: 'under', b: 'window' },
    { a: 'computer', rel: 'on', b: 'table' },
    { a: 'chair', rel: 'in front of', b: 'table' },
    { a: 'plant', rel: 'between', b: 'table', c: 'sofa' },
    { a: 'clock', rel: 'above', b: 'sofa' },
    { a: 'shelf', rel: 'next to', b: 'window' },
    { a: 'lamp', rel: 'on', b: 'shelf' },
    { a: 'bin', rel: 'behind', b: 'chair' },
  ];

  const KEY = 'home-game';
  const blank = () => ({ u: [], h: [], r: [] }); // unlocked words, house objects, room objects
  let state;
  function load() {
    try { state = { ...blank(), ...JSON.parse(saved[KEY] || '{}') }; } catch { state = blank(); }
  }
  function store() {
    saved[KEY] = JSON.stringify(state);
    persist();
  }
  load();

  const $ = id => document.getElementById(id);
  const cardsBox = $('hm-cards');
  const house = $('hm-house');
  const room = $('hm-room');
  if (!cardsBox || !house || !room) return;

  // a picture, or its emoji when the drawing is missing
  function picture(k, cls) {
    const o = BY_KEY[k] || EXTRA[k];
    const img = document.createElement('img');
    img.src = src(k);
    img.alt = k;
    img.draggable = false;
    img.className = cls || '';
    img.onerror = () => {
      const em = document.createElement('span');
      em.className = `hm-emoji ${cls || ''}`;
      em.textContent = o.emoji;
      em.title = `${k}: drawing to add (img/home/${k.replace(/ /g, '-')}.png)`;
      img.replaceWith(em);
    };
    return img;
  }

  /* ================= p. 40: spell → unlock ================= */

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

  function card(o) {
    const unlocked = state.u.includes(o.k);
    const el = document.createElement('div');
    el.className = `hm-card${unlocked ? ' unlocked' : ''}`;
    el.dataset.k = o.k;
    const pic = document.createElement('div');
    pic.className = 'hm-pic';
    pic.append(picture(o.k));
    if (!unlocked) pic.insertAdjacentHTML('beforeend', '<span class="hm-lock">🔒</span>');
    else {
      pic.title = 'Drag me into the house (p. 41)';
      dragSource(pic, () => ({ k: o.k, zone: 'h' }));
    }
    const tl = document.createElement('div');
    tl.className = 'hm-tiles';
    tiles(tl, o.k.toUpperCase(), '', unlocked);
    el.append(pic, tl);

    if (unlocked) {
      el.insertAdjacentHTML('beforeend', '<span class="hm-status">✔ drag it to p. 41 →</span>');
      return el;
    }
    const row = document.createElement('div');
    row.className = 'hm-row';
    const inp = document.createElement('input');
    const letters = o.k.replace(/ /g, '');
    inp.className = 'hm-in';
    inp.maxLength = letters.length;
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    inp.setAttribute('aria-label', `Word ${WORDS.indexOf(o) + 1}: ${o.k.length} characters`);
    const hint = document.createElement('button');
    hint.type = 'button';
    hint.className = 'hm-hint';
    hint.textContent = '💡';
    hint.title = 'Show the letters';
    const scr = document.createElement('div');
    scr.className = 'hm-scramble';
    scr.hidden = true;
    let mixed = null;

    function update() {
      inp.value = inp.value.replace(/[^a-z]/gi, '').toUpperCase();
      tiles(tl, o.k.toUpperCase(), inp.value, false);
      if (!scr.hidden) scramble();
      if (inp.value === letters.toUpperCase()) {
        inp.classList.add('ok');
        setTimeout(() => unlock(o.k), 350);
      }
    }
    // the letters typed (or clicked) are greyed out
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

  function unlock(k) {
    if (state.u.includes(k)) return;
    state.u.push(k);
    store();
    const old = cardsBox.querySelector(`[data-k="${k}"]`);
    const fresh = card(BY_KEY[k]);
    fresh.classList.add('pop');
    old.replaceWith(fresh);
    score();
  }

  function score() {
    $('hm-score').textContent = `🔓 ${state.u.length} / ${WORDS.length} unlocked`;
  }

  function drawCards() {
    cardsBox.replaceChildren(...WORDS.map(card));
    score();
  }

  /* ================= dragging ================= */
  // From a card (p. 40) or the palette (p. 43) into a .hm-drop area.
  // Works with mouse, pen and fingers (pointer events).

  let ghost = null;

  function dragSource(el, info) {
    el.classList.add('hm-grab');
    el.addEventListener('pointerdown', e => {
      if (e.button) return;
      e.preventDefault();
      const start = { x: e.clientX, y: e.clientY };
      const { k, zone } = info();
      const move = ev => {
        if (!ghost && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 5) return;
        if (!ghost) {
          ghost = document.createElement('div');
          ghost.className = 'hm-ghost';
          ghost.append(picture(k));
          document.body.append(ghost);
        }
        ghost.style.left = `${ev.clientX}px`;
        ghost.style.top = `${ev.clientY}px`;
        document.querySelectorAll('.hm-drop').forEach(d => d.classList.toggle('over', d === dropAt(ev, zone)));
      };
      const up = ev => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        document.querySelectorAll('.hm-drop.over').forEach(d => d.classList.remove('over'));
        if (!ghost) return;
        ghost.remove();
        ghost = null;
        const area = ev.type === 'pointerup' && dropAt(ev, zone);
        if (area) drop(area, k, ev.clientX, ev.clientY);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
  }

  // the drop area under the pointer, if it is the right one
  function dropAt(ev, zone) {
    const r = (zone === 'h' ? house : room).getBoundingClientRect();
    const inside = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
    return inside ? (zone === 'h' ? house : room) : null;
  }

  const list = area => (area === house ? state.h : state.r);
  const sizeOf = (area, k) => (area === house ? BY_KEY[k].w : ROOM[k]);

  function drop(area, k, cx, cy) {
    const r = area.getBoundingClientRect();
    const items = list(area);
    // in the room every object is there once: dropping it again moves it
    let item = area === room ? items.find(i => i.k === k) : null;
    const z = Math.max(0, ...items.map(i => i.z)) + 1;
    if (!item) {
      item = { k, w: sizeOf(area, k), z };
      items.push(item);
    } else item.z = z;
    // centre of the object under the pointer (the height is known once the image is drawn)
    item.x = (cx - r.left) / r.width * 100 - item.w / 2;
    item.y = (cy - r.top) / r.height * 100 - 5;
    store();
    drawArea(area);
    select(area, item);
    const el = area.querySelector(`.hm-item[data-i="${items.indexOf(item)}"]`);
    // put the centre under the pointer when the size is known
    const fix = () => {
      const h = el.getBoundingClientRect().height / r.height * 100;
      item.y = (cy - r.top) / r.height * 100 - h / 2;
      el.style.top = `${item.y}%`;
      store();
      if (area === room) missions();
    };
    const pic = el.querySelector('img');
    if (pic && !pic.complete) pic.addEventListener('load', fix, { once: true }); else fix();
  }

  /* ================= objects in the house / in the room ================= */

  let selected = null; // { area, item }
  const tools = document.createElement('div');
  tools.className = 'hm-tools';
  tools.innerHTML = `
    <button type="button" data-t="bigger" title="Bigger">➕</button>
    <button type="button" data-t="smaller" title="Smaller">➖</button>
    <button type="button" data-t="front" title="Bring to the front">⬆</button>
    <button type="button" data-t="back" title="Send to the back">⬇</button>
    <button type="button" data-t="remove" title="Take it away">🗑</button>`;

  function drawArea(area) {
    area.querySelectorAll('.hm-item').forEach(el => el.remove());
    list(area).forEach((item, i) => {
      const el = document.createElement('div');
      el.className = 'hm-item';
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
      const i = list(area).indexOf(selected.item);
      if (i < 0) unselect(); else select(area, selected.item);
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
        if (moved) {
          store();
          if (area === room) missions();
        }
        select(area, item);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
  }

  function select(area, item) {
    selected = { area, item };
    area.querySelectorAll('.hm-item').forEach(el => el.classList.toggle('selected', +el.dataset.i === list(area).indexOf(item)));
    area.append(tools);
    place();
  }
  function place() {
    const { item } = selected;
    tools.style.left = `${Math.max(0, Math.min(item.x + item.w / 2, 100))}%`;
    tools.style.top = `${item.y}%`;
  }
  function unselect() {
    selected = null;
    tools.remove();
    document.querySelectorAll('.hm-item.selected').forEach(el => el.classList.remove('selected'));
  }
  document.addEventListener('pointerdown', e => {
    if (selected && !e.target.closest?.('.hm-item, .hm-tools')) unselect();
  });

  tools.addEventListener('pointerdown', e => e.stopPropagation());
  tools.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || !selected) return;
    const { area, item } = selected;
    const items = list(area);
    const t = b.dataset.t;
    if (t === 'bigger') { item.w = Math.min(item.w * 1.15, 60); item.x -= item.w * 0.065; }
    if (t === 'smaller') { item.w = Math.max(item.w / 1.15, 2); item.x += item.w * 0.075; }
    if (t === 'front') item.z = Math.max(...items.map(i => i.z)) + 1;
    if (t === 'back') item.z = Math.min(...items.map(i => i.z)) - 1;
    if (t === 'remove') { items.splice(items.indexOf(item), 1); selected = null; tools.remove(); }
    store();
    drawArea(area);
    if (area === room) missions();
  });

  /* ================= p. 43: room missions ================= */

  const palette = $('hm-palette');
  const missionList = $('hm-missions');

  function drawPalette() {
    palette.replaceChildren(...Object.keys(ROOM).map(k => {
      const b = document.createElement('div');
      b.className = 'hm-chip';
      b.dataset.k = k;
      b.append(picture(k));
      b.insertAdjacentHTML('beforeend', `<span>${k}</span>`);
      b.classList.toggle('used', state.r.some(i => i.k === k));
      dragSource(b, () => ({ k, zone: 'r' }));
      return b;
    }));
  }

  // where the object really is: the box of its picture
  function boxOf(k) {
    const el = room.querySelector(`.hm-item[data-k="${k}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2, z: +el.style.zIndex };
  }
  const overlap = (a1, a2, b1, b2) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
  const hOv = (a, b) => overlap(a.left, a.right, b.left, b.right) / Math.min(a.w, b.w);
  const vOv = (a, b) => overlap(a.top, a.bottom, b.top, b.bottom) / Math.min(a.h, b.h);

  const RELATIONS = {
    on: (a, b, H) => a.cx >= b.left && a.cx <= b.right && a.top < b.top &&
      a.bottom >= b.top - 0.04 * H && a.bottom <= b.top + Math.max(0.45 * b.h, 0.04 * H),
    under: (a, b) => hOv(a, b) >= 0.4 && a.top >= b.top + 0.6 * b.h,
    above: (a, b) => hOv(a, b) >= 0.3 && a.bottom <= b.top + 0.15 * b.h,
    'next to': (a, b, H, W) => vOv(a, b) >= 0.3 && hOv(a, b) <= 0.3 &&
      Math.max(a.left - b.right, b.left - a.right) <= Math.max(0.1 * W, 0.6 * Math.min(a.w, b.w)),
    'in front of': (a, b) => hOv(a, b) >= 0.3 && vOv(a, b) >= 0.3 && a.z > b.z,
    behind: (a, b) => hOv(a, b) >= 0.3 && vOv(a, b) >= 0.3 && a.z < b.z,
    between: (a, b, H, W, c) => a.cx > Math.min(b.cx, c.cx) && a.cx < Math.max(b.cx, c.cx) &&
      vOv(a, b) >= 0.2 && vOv(a, c) >= 0.2 && hOv(a, b) <= 0.5 && hOv(a, c) <= 0.5,
  };

  function missions() {
    const R = room.getBoundingClientRect();
    if (!R.width) return; // spread not visible
    let done = 0;
    missionList.innerHTML = MISSIONS.map(m => {
      const a = boxOf(m.a), b = boxOf(m.b), c = m.c ? boxOf(m.c) : null;
      const ok = !!(a && b && (!m.c || c) && RELATIONS[m.rel](a, b, R.height, R.width, c));
      if (ok) done++;
      const rest = m.c ? `the ${m.b} and the ${m.c}` : `the ${m.b}`;
      return `<li class="${ok ? 'ok' : ''}"><i>${ok ? '✓' : ''}</i>The ${m.a} is <b>${m.rel.toUpperCase()}</b> ${rest}.</li>`;
    }).join('') + `<li class="hm-done">${done === MISSIONS.length ? '🎉 All missions done! Great job!' : `Missions done: ${done} / ${MISSIONS.length}`}</li>`;
    palette.querySelectorAll('.hm-chip').forEach(ch => ch.classList.toggle('used', state.r.some(i => i.k === ch.dataset.k)));
  }

  $('hm-room-reset').addEventListener('click', () => {
    state.r = [];
    store();
    unselect();
    drawArea(room);
    missions();
  });

  /* ================= p. 42: drawings still to be added ================= */

  document.querySelectorAll('img[data-missing]').forEach(img => {
    const empty = () => {
      const box = document.createElement('span');
      box.className = 'hm-missing';
      box.textContent = `✏️ ${img.dataset.missing}`;
      box.title = `Drawing to add: ${img.getAttribute('src')}`;
      img.replaceWith(box);
    };
    if (img.complete && !img.naturalWidth) empty(); else img.addEventListener('error', empty);
  });

  /* ================= start ================= */

  function drawAll() {
    unselect();
    drawCards();
    drawArea(house);
    drawArea(room);
    drawPalette();
    missions();
  }
  drawAll();
  document.addEventListener('spreadchange', missions);
  window.addEventListener('resize', missions);

  // "Clear answers" (script.js) empties `saved`: start again
  $('clearBtn').addEventListener('click', () => {
    if (saved[KEY]) return;
    load();
    drawAll();
  });
})();
