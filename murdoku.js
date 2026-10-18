// Murdoku: logic puzzles with prepositions of place ([mk-intro], [mk-party], [mk-create]).
// Each map is a grid of squares divided into rooms. Everybody is in one square, with exactly ONE person in
// every row and every column. Nobody can be in a square with a "block" thing (hatched). The victim is alone
// in a room with ONE other person: the murderer.
// A puzzle is drawn in <div class="mk-board" data-puzzle="mk-p1">: the student picks a person (or ✗)
// and taps the squares. The squares are saved in saved['mk-p1'] (script.js), like every other answer.
// The clues are written here next to a small code (c) that a checker uses to prove there is only one solution.
// col = the color of the person's dot: when the clothes have a color (red skirt, pink vest…), the dot has that color
// (ink = the color of the letter, for light dots).

const MURDOKU = {
  // what can be in a square: e = emoji, k = drawn with CSS, block = nobody can stand there
  things: {
    c: { e: '🪑', name: 'chair' },
    s: { e: '🛋️', name: 'sofa' },
    b: { e: '🛏️', name: 'bed' },
    h: { e: '🛁', name: 'bathtub' },
    r: { k: 'rug', name: 'rug' },
    R: { k: 'carpet', name: 'red carpet' },
    t: { k: 'table', name: 'table' },
    p: { e: '🪴', name: 'plant', block: true },
    m: { e: '🪞', name: 'mirror', block: true },
    k: { e: '👗', name: 'clothes rack', block: true },
    v: { e: '📺', name: 'TV', block: true },
    u: { e: '🍳', name: 'stove', block: true },
    x: { e: '📦', name: 'boxes', block: true },
    y: { e: '📷', name: 'camera', block: true },
    a: { e: '🧥', name: 'coat stand', block: true },
    o: { e: '🎹', name: 'piano', block: true },
  },

  puzzles: {
    // [mk-intro:L] the easy one, only names
    'mk-p1': {
      rooms: ['DDMM', 'DDMM', 'HHHM', 'SSSS'],
      roomNames: { D: 'dressing room', M: 'makeup room', H: 'hallway', S: 'stage' },
      map: ['.c.p', 'm.c.', 'k...', '.RR.'],
      people: [
        { n: 'Coco', who: 'the model', col: '#e0457b', victim: true },
        { n: 'Finn', who: 'the hairdresser', col: '#3d7be0' },
        { n: 'Lola', who: 'the makeup artist', col: '#f2a516' },
        { n: 'Max', who: 'the photographer', col: '#3aa04a' },
      ],
      clues: [
        { t: 'Coco is sitting <b>on</b> a chair <b>in</b> the makeup room.', c: ['and', ['on', 'Coco', 'c'], ['in', 'Coco', 'M']] },
        { t: 'Lola is standing <b>on</b> the red carpet.', c: ['on', 'Lola', 'R'] },
        { t: 'Max is <b>next to</b> the mirror.', c: ['nextTo', 'Max', 'm'] },
      ],
      solution: { Coco: [1, 2], Finn: [2, 3], Lola: [3, 1], Max: [0, 0] },
      murderer: 'Finn',
    },

    // [mk-intro:R] the suspects are described by their clothes (review of the Clothes chapter)
    'mk-p2': {
      rooms: ['SSSWW', 'SSSWW', 'SSSFF', 'KKBFF', 'KKBBB'],
      roomNames: { S: 'shop', W: 'workroom', F: 'fitting room', K: 'kitchen', B: 'bathroom' },
      map: ['p.r.c', 'k.rtt', '...m.', '.c..c', 'x.h..'],
      people: [
        { n: 'Mr. Button', who: 'the tailor', col: '#7a5230', victim: true },
        { n: 'Rosa', who: 'red maxi skirt, sunglasses', col: '#d62828' },
        { n: 'Ted', who: 'cowboy boots, pink vest', col: '#f7a1c4', ink: '#7a1f48' },
        { n: 'Ivy', who: 'fur coat, black gloves', col: '#262626' },
        { n: 'Sam', who: 'top hat, striped tie', col: '#3d7be0' },
      ],
      clues: [
        { t: 'Mr. Button is lying <b>under</b> the table.', c: ['under', 'Mr. Button', 't'] },
        { t: 'The woman in the fur coat is sitting <b>on</b> a chair.', c: ['on', 'Ivy', 'c'] },
        { t: 'The woman with the red maxi skirt is relaxing <b>in</b> the bathtub.', c: ['on', 'Rosa', 'h'] },
        { t: 'The man in cowboy boots is <b>in</b> the kitchen.', c: ['in', 'Ted', 'K'] },
        { t: 'The man in the top hat is <b>next to</b> the clothes rack.', c: ['nextTo', 'Sam', 'k'] },
      ],
      solution: { 'Mr. Button': [1, 3], Rosa: [4, 2], Ted: [3, 1], Ivy: [0, 4], Sam: [2, 0] },
      murderer: 'Ivy',
    },

    // [mk-party:L]
    'mk-p3': {
      rooms: ['LLLKK', 'LLLKK', 'LLLBB', 'DDHBB', 'DDHHH'],
      roomNames: { L: 'living room', K: 'kitchen', B: 'bathroom', D: 'bedroom', H: 'hall' },
      map: ['p.v.u', '.rrt.', 'ss..h', 'b....', 'bx.a.'],
      people: [
        { n: 'Lady Velvet', who: 'the fashion designer', col: '#7b1f4b', victim: true },
        { n: 'Dex', who: 'purple oversize sweater, combat boots', col: '#8e2de2' },
        { n: 'Nina', who: 'bell-bottoms, blond wig', col: '#f1d36b', ink: '#5a4300' },
        { n: 'Omar', who: 'fancy jacket, suit pants', col: '#3d7be0' },
        { n: 'Pia', who: 'overalls, colorful tights', col: '#3aa04a' },
      ],
      clues: [
        { t: 'Lady Velvet is lying <b>on</b> the bed.', c: ['on', 'Lady Velvet', 'b'] },
        { t: 'The man in the purple sweater is standing <b>in front of</b> the TV.', c: ['front', 'Dex', 'v'] },
        { t: 'The woman in the wig is <b>next to</b> the boxes.', c: ['nextTo', 'Nina', 'x'] },
        { t: 'The girl in overalls is <b>in</b> the bathtub.', c: ['on', 'Pia', 'h'] },
        { t: 'The man in the fancy jacket is <b>next to</b> the stove.', c: ['nextTo', 'Omar', 'u'] },
      ],
      solution: { 'Lady Velvet': [4, 0], Dex: [1, 2], Nina: [3, 1], Omar: [0, 3], Pia: [2, 4] },
      murderer: 'Nina',
    },

    // [mk-party:R] the big one: the fashion show
    'mk-p4': {
      rooms: ['UUURKK', 'UUURKK', 'UUURKK', 'PPPRMM', 'CCCRMM', 'CCCRMM'],
      roomNames: { U: 'audience', R: 'runway', K: 'backstage', P: 'photo corner', M: 'makeup room', C: 'café' },
      map: ['cccRkk', '..cR.a', '..pRx.', 'y..Rcm', 'tt.R..', 'c..R.p'],
      people: [
        { n: 'Bella', who: 'the top model', col: '#e0457b', victim: true },
        { n: 'Gus', who: 'cargo pants, sunglasses', col: '#3aa04a' },
        { n: 'Zoe', who: 'colorful coat, maxi skirt', col: '#f2a516' },
        { n: 'Leo', who: 'gym outfit, sneakers', col: '#4aa8ec' },
        { n: 'Mia', who: 'oversize sweater, loafers', col: '#8e2de2' },
        { n: 'Rex', who: 'suit, top hat', col: '#262626' },
      ],
      clues: [
        { t: 'Bella is <b>between</b> the mirror and the plant.', c: ['between', 'Bella', 'm', 'p'] },
        { t: 'The woman in the oversize sweater is walking <b>on</b> the runway.', c: ['in', 'Mia', 'R'] },
        { t: 'The man with sunglasses is <b>in</b> the café, <b>on</b> a chair.', c: ['and', ['in', 'Gus', 'C'], ['on', 'Gus', 'c']] },
        { t: 'The woman in the colorful coat is sitting <b>on</b> a chair <b>in</b> the audience.', c: ['and', ['in', 'Zoe', 'U'], ['on', 'Zoe', 'c']] },
        { t: 'The man in the gym outfit is sitting <b>on</b> a chair <b>next to</b> a plant.', c: ['and', ['on', 'Leo', 'c'], ['nextTo', 'Leo', 'p']] },
      ],
      solution: { Bella: [4, 5], Gus: [5, 0], Zoe: [0, 1], Leo: [1, 2], Mia: [2, 3], Rex: [3, 4] },
      murderer: 'Rex',
    },
  },
};

(() => {
  const T = MURDOKU.things;
  // the colors of the rooms, in the order they first appear on the map
  const ROOM_COLORS = ['#fde9c8', '#d9ecfb', '#e3f4d6', '#f8dbe8', '#ece1fa', '#fff6b8'];
  // "Mr. Button" → B, "Lady Velvet" → V
  const initial = n => n.replace(/^(Mr\.|Mrs\.|Ms\.|Lady|Sir)\s+/, '')[0].toUpperCase();

  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  // one square: thick borders where the next square is another room, and its thing
  function paintCell(cell, { room, thing, n, r, c, roomAt, thingAt, color }) {
    cell.className = 'mk-cell';
    cell.style.background = color;
    const wall = (rr, cc) => rr < 0 || cc < 0 || rr >= n || cc >= n || roomAt(rr, cc) !== room;
    if (wall(r - 1, c)) cell.classList.add('wt');
    if (wall(r, c + 1)) cell.classList.add('wr');
    if (wall(r + 1, c)) cell.classList.add('wb');
    if (wall(r, c - 1)) cell.classList.add('wl');
    cell.querySelector('.mk-thing')?.remove();
    const t = T[thing];
    if (!t) return;
    if (t.block) cell.classList.add('block');
    const th = el('span', `mk-thing${t.k ? ` mk-${t.k}` : ''}`, t.e || '');
    th.title = t.name;
    // tables, rugs and carpets of more than one square are drawn as one piece
    if (t.k) {
      if (thingAt(r, c + 1) === thing) th.classList.add('jr');
      if (thingAt(r, c - 1) === thing) th.classList.add('jl');
      if (thingAt(r + 1, c) === thing) th.classList.add('jb');
      if (thingAt(r - 1, c) === thing) th.classList.add('jt');
    }
    cell.prepend(th);
  }

  function tokenFor(p) {
    const tk = el('span', 'mk-token', p.ini);
    tk.style.setProperty('--c', p.col);
    if (p.ink) tk.style.setProperty('--tk-ink', p.ink);
    if (p.victim) tk.classList.add('victim');
    return tk;
  }

  // a row of pen buttons; returns a function that gives the key of the chosen one
  function makePens(box, pens, first = pens[0].key) {
    let pen = first;
    pens.forEach(p => {
      const b = el('button', 'mk-pen');
      b.type = 'button';
      b.append(p.icon);
      if (p.label) b.append(el('small', '', p.label));
      b.setAttribute('aria-label', p.aria);
      if (p.key === pen) b.classList.add('on');
      b.addEventListener('click', () => {
        pen = p.key;
        b.closest('.mk-pens').querySelectorAll('.mk-pen').forEach(x => x.classList.toggle('on', x === b));
      });
      box.append(b);
    });
    return () => pen;
  }

  // ✓ Check, ↺ Start again and the message under a map
  function makeBar(label, onCheck, onReset) {
    const bar = el('div', 'mk-bar');
    const check = el('button', 'check', label);
    check.type = 'button';
    const reset = el('button', 'mk-reset', '↺ Start again');
    reset.type = 'button';
    const msg = el('span', 'mk-msg');
    check.addEventListener('click', () => onCheck(msg));
    reset.addEventListener('click', () => { if (onReset()) msg.textContent = ''; });
    bar.append(check, reset, msg);
    return bar;
  }

  /* ---------- the puzzles ---------- */
  document.querySelectorAll('.mk-board[data-puzzle]').forEach(board => {
    const id = board.dataset.puzzle;
    const P = MURDOKU.puzzles[id];
    const n = P.rooms.length;
    const people = P.people.map(p => ({ ...p, ini: initial(p.n) }));
    const byIni = Object.fromEntries(people.map(p => [p.ini, p]));
    const roomOrder = [...new Set(P.rooms.join(''))];
    const roomAt = (r, c) => P.rooms[r]?.[c];
    const thingAt = (r, c) => [...(P.map[r] || '')][c];
    const solved = people.map(p => P.solution[p.n][0] * n + P.solution[p.n][1]);

    // the marks, row by row: '' / 'x' (nobody here) / a person's initial
    let marks = Array(n * n).fill('');
    try { const s = JSON.parse(saved[id] || 'null'); if (Array.isArray(s) && s.length === n * n) marks = s; } catch { /* nothing saved */ }
    const save = () => { saved[id] = JSON.stringify(marks); persist(); };

    const grid = el('div', 'mk-grid');
    grid.style.setProperty('--n', n);
    const cells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const cell = el('button');
      cell.type = 'button';
      const room = roomAt(r, c);
      paintCell(cell, { room, thing: thingAt(r, c), n, r, c, roomAt, thingAt, color: ROOM_COLORS[roomOrder.indexOf(room)] });
      const t = T[thingAt(r, c)];
      cell.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, ${P.roomNames[room]}${t ? `, ${t.name}` : ''}`);
      cells.push(cell);
      grid.append(cell);
    }
    // the name of each room, in its first square
    roomOrder.forEach(k => cells[P.rooms.join('').indexOf(k)].append(el('span', 'mk-room', P.roomNames[k])));

    const draw = () => cells.forEach((cell, i) => {
      cell.classList.remove('ok', 'no');
      cell.querySelector('.mk-token, .mk-x')?.remove();
      if (marks[i] === 'x') cell.append(el('span', 'mk-x', '✗'));
      else if (byIni[marks[i]]) cell.append(tokenFor(byIni[marks[i]]));
    });

    const pens = el('div', 'mk-pens');
    const pen = makePens(pens, [
      ...people.map(p => ({ key: p.ini, icon: tokenFor(p), label: p.n, aria: `Put ${p.n}` })),
      { key: 'x', icon: el('span', 'mk-x', '✗'), label: 'nobody', aria: 'Mark: nobody here' },
      { key: '', icon: el('span', 'mk-erase', '⌫'), label: 'erase', aria: 'Erase' },
    ]);

    cells.forEach((cell, i) => cell.addEventListener('click', () => {
      const k = pen();
      if (k && cell.classList.contains('block')) return; // nobody can stand there
      if (marks[i] === k) marks[i] = '';
      else {
        if (byIni[k]) marks = marks.map(m => (m === k ? '' : m)); // a person is in one square only
        marks[i] = k;
      }
      draw();
      save();
    }));

    // the people in the right square turn green, the wrong ones red (and a ✗ where somebody is)
    const bar = makeBar('✓ Check', msg => {
      draw();
      let right = 0;
      people.forEach((p, k) => {
        const i = marks.indexOf(p.ini);
        if (i < 0) return;
        if (i === solved[k]) { right++; cells[i].classList.add('ok'); } else cells[i].classList.add('no');
      });
      marks.forEach((m, i) => { if (m === 'x' && solved.includes(i)) cells[i].classList.add('no'); });
      msg.textContent = right === n ? '🔎 Case closed! Everybody is in the right place.' : `${right} of ${n} people in the right place`;
    }, () => {
      if (!marks.some(Boolean) || !confirm('Clear the whole map?')) return false;
      marks = Array(n * n).fill('');
      draw();
      save();
      return true;
    });

    board.append(grid, pens, bar);
    draw();
  });

  // the symbols ([mk-intro:L]): the things you can be on / in / under, then the hatched ones
  document.querySelectorAll('[data-mk-legend]').forEach(box => {
    const free = el('ul', 'mk-legend');
    const blocked = el('ul', 'mk-legend');
    Object.values(T).forEach(t => {
      const li = el('li', t.block ? 'block' : '');
      li.append(el('span', `mk-thing${t.k ? ` mk-${t.k}` : ''}`, t.e || ''), el('small', '', t.name));
      (t.block ? blocked : free).append(li);
    });
    const marks = el('ul', 'mk-legend');
    const x = el('li');
    x.append(el('span', 'mk-x', '✗'), el('small', '', 'you write: nobody here'));
    const v = el('li');
    v.append(tokenFor({ ini: 'V', col: '#262626', victim: true }), el('small', '', 'dashed circle: the victim'));
    marks.append(v, x);
    box.append(el('b', '', '✓ You can be on / in / under:'), free, el('b', '', '✗ Hatched: nobody can be here'), blocked, el('b', '', 'On the map'), marks);
  });

  // the suspects and the clues of a puzzle, written where the page asks for them
  document.querySelectorAll('[data-mk-people]').forEach(list => {
    MURDOKU.puzzles[list.dataset.mkPeople].people.forEach(p => {
      const li = el('li', p.victim ? 'victim' : '');
      li.append(tokenFor({ ...p, ini: initial(p.n) }), el('div', '', `<b>${p.n}</b><span>${p.victim ? '☠ victim · ' : ''}${p.who}</span>`));
      list.append(li);
    });
  });
  document.querySelectorAll('[data-mk-clues]').forEach(list => {
    MURDOKU.puzzles[list.dataset.mkClues].clues.forEach(cl => list.append(el('li', '', cl.t)));
  });

  /* ---------- make your own Murdoku ([mk-create:R]) ---------- */
  document.querySelectorAll('.mk-board[data-editor]').forEach(board => {
    const id = board.dataset.editor;
    const n = +board.dataset.size || 5;
    const COLS = ['#e0457b', '#3d7be0', '#f2a516', '#3aa04a', '#8e2de2'];
    const PEOPLE = [
      { ini: 'V', col: '#262626', victim: true, n: 'the victim' },
      ...['A', 'B', 'C', 'D', 'E'].slice(0, n - 1).map((ini, i) => ({ ini, col: COLS[i], n: `suspect ${ini}` })),
    ];
    const byIni = Object.fromEntries(PEOPLE.map(p => [p.ini, p]));
    const empty = () => ({ rooms: Array(n * n).fill(0), things: Array(n * n).fill(''), people: Array(n * n).fill('') });

    // every square: its room (0–4), its thing (a key of MURDOKU.things or '') and its person ('' or an initial)
    let st = empty();
    try { const s = JSON.parse(saved[id] || 'null'); if (s?.rooms?.length === n * n) st = s; } catch { /* nothing saved */ }
    const save = () => { saved[id] = JSON.stringify(st); persist(); };

    const grid = el('div', 'mk-grid');
    grid.style.setProperty('--n', n);
    const cells = [];
    for (let i = 0; i < n * n; i++) {
      const cell = el('button');
      cell.type = 'button';
      cell.setAttribute('aria-label', `Row ${Math.floor(i / n) + 1}, column ${(i % n) + 1}`);
      cells.push(cell);
      grid.append(cell);
    }
    const inside = (r, c) => r >= 0 && c >= 0 && r < n && c < n;
    const draw = () => cells.forEach((cell, i) => {
      paintCell(cell, {
        room: st.rooms[i], thing: st.things[i], n, r: Math.floor(i / n), c: i % n,
        roomAt: (r, c) => (inside(r, c) ? st.rooms[r * n + c] : undefined),
        thingAt: (r, c) => (inside(r, c) ? st.things[r * n + c] : undefined),
        color: ROOM_COLORS[st.rooms[i]],
      });
      cell.querySelector('.mk-token')?.remove();
      if (byIni[st.people[i]]) cell.append(tokenFor(byIni[st.people[i]]));
    });

    const swatch = k => { const s = el('span', 'mk-swatch'); s.style.background = ROOM_COLORS[k]; return s; };
    const thingIcon = k => el('span', `mk-thing${T[k].k ? ` mk-${T[k].k}` : ''}${T[k].block ? ' block' : ''}`, T[k].e || '');
    const pensBox = el('div', 'mk-pens mk-pens-editor');
    const groups = [
      ['1 · Rooms', [0, 1, 2, 3, 4].map(k => ({ key: `room${k}`, icon: swatch(k), aria: `Room color ${k + 1}` }))],
      ['2 · Things', Object.keys(T).map(k => ({ key: `thing${k}`, icon: thingIcon(k), aria: T[k].name, label: T[k].name }))],
      ['3 · People', PEOPLE.map(p => ({ key: `person${p.ini}`, icon: tokenFor(p), aria: `Put ${p.n}` }))],
      ['', [{ key: 'erase', icon: el('span', 'mk-erase', '⌫'), label: 'erase', aria: 'Erase the thing and the person' }]],
    ];
    // one pen for the whole palette (makePens lights up only the last button clicked in .mk-pens)
    let pen = 'room1';
    groups.forEach(([title, list]) => {
      const g = el('div', 'mk-pen-group');
      if (title) g.append(el('b', '', title));
      const box = el('div');
      g.append(box);
      pensBox.append(g);
      makePens(box, list, pen);
      [...box.children].forEach((b, i) => b.addEventListener('click', () => { pen = list[i].key; }));
    });

    cells.forEach((cell, i) => cell.addEventListener('click', () => {
      if (pen.startsWith('room')) st.rooms[i] = +pen.slice(4);
      else if (pen.startsWith('thing')) {
        const k = pen.slice(5);
        st.things[i] = st.things[i] === k ? '' : k;
        if (T[k].block) st.people[i] = '';
      } else if (pen.startsWith('person')) {
        const k = pen.slice(6);
        if (T[st.things[i]]?.block) return; // nobody can stand there
        if (st.people[i] === k) st.people[i] = '';
        else { st.people = st.people.map(m => (m === k ? '' : m)); st.people[i] = k; }
      } else { st.things[i] = ''; st.people[i] = ''; }
      draw();
      save();
    }));

    // the rules: everybody on the map, one person per row and column, the victim in a room with ONE suspect
    const bar = makeBar('✓ Check my rules', msg => {
      const where = Object.fromEntries(PEOPLE.map(p => [p.ini, st.people.indexOf(p.ini)]));
      const problems = [];
      const missing = PEOPLE.filter(p => where[p.ini] < 0).map(p => p.ini);
      if (missing.length) problems.push(`put ${missing.join(', ')} on the map`);
      for (let k = 0; k < n; k++) {
        if (st.people.filter((m, i) => m && Math.floor(i / n) === k).length > 1) problems.push(`row ${k + 1} has two people`);
        if (st.people.filter((m, i) => m && i % n === k).length > 1) problems.push(`column ${k + 1} has two people`);
      }
      if (where.V >= 0) {
        const withV = PEOPLE.filter(p => !p.victim && where[p.ini] >= 0 && st.rooms[where[p.ini]] === st.rooms[where.V]).length;
        if (withV !== 1) problems.push(`the victim must be in a room with ONE suspect (now ${withV})`);
      }
      msg.classList.toggle('bad', problems.length > 0);
      msg.textContent = problems.length ? `Not yet: ${problems.join(' · ')}` : '✓ Your map follows the rules! Now write the clues.';
    }, () => {
      if (!confirm('Clear your whole map?')) return false;
      st = empty();
      draw();
      save();
      return true;
    });

    const wrap = el('div', 'mk-editor');
    wrap.append(grid, pensBox);
    board.append(wrap, bar);
    draw();
  });
})();
