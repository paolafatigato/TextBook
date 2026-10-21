// Witch hunt (CLIL): the small games and checks of the class pages.
//  1. The verbs of the nun: click the words in the past (the engine of .underlinable is in script.js), the button data-verbs checks them.
//  2. Past → present pairs: .wh-pairs with data-map="lived:live,…", the button data-pairs checks the two columns row by row.
//  3. The intruders: words that don't belong to a text; the first letters of all of them spell "herbalist" (button data-hunt).
//  4. The word search (.wh-ws): drag over the letters of a word, in any direction; the found words are kept.
//  5. The memory (.wh-mem): tools and jobs of the working men.

(() => {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9’' ]+/g, '').trim();
  const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const note = (id, txt) => { const o = document.getElementById(id + '-score'); if (o) o.textContent = txt; };

  /* ---------- 1 · the verbs in the past ---------- */
  document.querySelectorAll('.check[data-verbs]').forEach(btn => btn.addEventListener('click', () => {
    const box = document.getElementById(btn.dataset.verbs);
    const right = new Set(box.dataset.verbs.split(' '));
    const marked = [...box.querySelectorAll('.w.ul')];
    const got = new Set();
    box.querySelectorAll('.w').forEach(w => w.classList.remove('ok', 'no'));
    marked.forEach(w => { const t = norm(w.textContent); const ok = right.has(t); w.classList.add(ok ? 'ok' : 'no'); if (ok) got.add(t); });
    const bad = marked.length - marked.filter(w => w.classList.contains('ok')).length;
    note(box.id, `${got.size} / ${right.size} verbs found` + (bad ? ` · ${bad} word${bad > 1 ? 's' : ''} that ${bad > 1 ? 'are' : 'is'} not a past verb` : '') + (got.size === right.size && !bad ? ' 🎉' : ''));
  }));

  /* ---------- 2 · past → present ---------- */
  document.querySelectorAll('.check[data-pairs]').forEach(btn => btn.addEventListener('click', () => {
    const box = document.getElementById(btn.dataset.pairs);
    const map = Object.fromEntries(box.dataset.map.split(',').map(p => p.split(':')));
    const seen = new Set();
    let good = 0;
    box.querySelectorAll('li').forEach(li => {
      const [a, b] = li.querySelectorAll('input');
      [a, b].forEach(i => i.classList.remove('ok', 'no'));
      const past = norm(a.value), pres = norm(b.value);
      if (!past && !pres) return;
      const okPast = past in map && !seen.has(past);
      a.classList.add(okPast ? 'ok' : 'no');
      if (pres) { const okPres = okPast && map[past] === pres; b.classList.add(okPres ? 'ok' : 'no'); if (okPres) good++; }
      if (okPast) seen.add(past);
    });
    note(box.id, `${good} / ${Object.keys(map).length} pairs right` + (good === Object.keys(map).length ? ' 🎉' : ''));
  }));

  /* ---------- 3 · the intruders ---------- */
  document.querySelectorAll('.check[data-hunt]').forEach(btn => btn.addEventListener('click', () => {
    const bar = document.getElementById(btn.dataset.hunt);
    const words = [...document.querySelectorAll(`.wh-intr[data-grp="${bar.id}"]`)];
    let found = 0;
    words.forEach(w => { w.classList.remove('ok', 'no'); const on = w.classList.contains('on'); w.classList.add(on ? 'ok' : 'no'); if (on) found++; });
    const letters = [...bar.querySelectorAll('input')];
    let okL = 0;
    letters.forEach(i => { i.classList.remove('ok', 'no'); if (!i.value.trim()) return; const ok = norm(i.value) === i.dataset.answer; i.classList.add(ok ? 'ok' : 'no'); if (ok) okL++; });
    note(bar.id, `${found} / ${words.length} intruders found · ${okL} / ${letters.length} letters right` + (found === words.length && okL === letters.length ? ' 🎉' : ''));
  }));

  /* ---------- 4 · the word search ---------- */
  document.querySelectorAll('.wh-ws').forEach(box => {
    const words = box.dataset.words.split(',');
    const n = +getComputedStyle(box).getPropertyValue('--n') || 15;
    const cells = [...box.querySelectorAll('.c')];
    const at = (r, c) => cells[r * n + c];
    let found = [];
    try { found = JSON.parse(saved[box.id] || '[]'); } catch { found = []; }
    const paint = () => {
      cells.forEach(c => c.className = 'c');
      found.forEach((f, k) => f.cells.forEach(i => cells[i].classList.add('found', 'k' + (k % 6))));
      box.querySelectorAll('.wl li').forEach(li => li.classList.toggle('done', found.some(f => f.w === li.dataset.w)));
      const out = document.getElementById(box.id + '-score');
      if (out) out.textContent = `${found.length} / ${words.length} words found` + (found.length === words.length ? ' 🎉' : '');
    };
    let start = null, line = [];
    const lineTo = (a, b) => {
      const dr = b.r - a.r, dc = b.c - a.c;
      if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return [];
      const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1, sr = Math.sign(dr), sc = Math.sign(dc);
      return Array.from({ length: len }, (_, i) => (a.r + sr * i) * n + (a.c + sc * i));
    };
    const pos = el => ({ r: +el.dataset.r, c: +el.dataset.c });
    const show = () => cells.forEach((c, i) => c.classList.toggle('sel', line.includes(i)));
    const grid = box.querySelector('.grid');
    grid.addEventListener('pointerdown', e => {
      const el = e.target.closest('.c'); if (!el) return;
      grid.setPointerCapture(e.pointerId);
      start = pos(el); line = [start.r * n + start.c]; show();
    });
    grid.addEventListener('pointermove', e => {
      if (!start) return;
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.c');
      if (!el || !grid.contains(el)) return;
      const l = lineTo(start, pos(el));
      if (l.length) { line = l; show(); }
    });
    const end = () => {
      if (!start) return;
      const text = line.map(i => cells[i].textContent).join('');
      const w = words.find(x => (x === text || x === [...text].reverse().join('')) && !found.some(f => f.w === x));
      if (w && line.length > 1) { found.push({ w, cells: line.slice() }); saved[box.id] = JSON.stringify(found); persist(); }
      start = null; line = []; paint();
    };
    grid.addEventListener('pointerup', end);
    grid.addEventListener('pointercancel', () => { start = null; line = []; paint(); });
    document.querySelectorAll(`.check[data-wsreset="${box.id}"]`).forEach(b => b.addEventListener('click', () => { found = []; saved[box.id] = '[]'; persist(); paint(); }));
    paint();
  });

  /* ---------- 5 · the memory ---------- */
  document.querySelectorAll('.wh-mem').forEach(box => {
    const board = box.querySelector('.board');
    const mv = box.querySelector('.mv');
    let open = [], moves = 0, matched = 0, lock = false;
    const total = board.children.length / 2;
    const reset = () => {
      [...board.children].forEach(c => c.classList.remove('up', 'done'));
      shuffle([...board.children]).forEach(c => board.append(c));
      open = []; moves = 0; matched = 0; lock = false; mv.textContent = '0 moves';
    };
    board.addEventListener('click', e => {
      const c = e.target.closest('.mc');
      if (!c || lock || c.classList.contains('up') || c.classList.contains('done')) return;
      c.classList.add('up'); open.push(c);
      if (open.length < 2) return;
      moves++; mv.textContent = `${moves} move${moves > 1 ? 's' : ''}`;
      const [a, b] = open;
      if (a.dataset.p === b.dataset.p) { a.classList.add('done'); b.classList.add('done'); open = []; matched++; if (matched === total) mv.textContent = `${moves} moves · well done! 🎉`; }
      else { lock = true; setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); open = []; lock = false; }, 1100); }
    });
    document.querySelectorAll(`.check[data-memnew="${box.id}"]`).forEach(b => b.addEventListener('click', reset));
  });
})();
