// Page turning, saving what students write (in this browser),
// checking exercises and the "connect the words" activities.

const KEY = 'libro-u1l1';
// a copy of the book opened by the print panel (index.html?print&from=…): it only prints.
// Nothing written in it is saved, and with &blank it starts with no answers.
const PRINT_JOB = new URLSearchParams(location.search);
const isPrintCopy = PRINT_JOB.has('print');
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { saved = {}; }
if (isPrintCopy && PRINT_JOB.has('blank')) saved = {};

function persist() {
  if (isPrintCopy) return;
  try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* storage unavailable */ }
  window.book.onSaved?.(); // cloud.js sends it to Firebase when a student is signed in
}

/* ================= access: login and visible pages ================= */
// cloud.js (Firebase) fills this in. Students see only the spreads the teacher ticked;
// the teacher sees everything and can tick them in the panel.

// the visible spreads are kept by name (data-id), so adding pages never changes them
const VISIBLE_KEY = 'libro-visible-v6';
let visibleSpreads = new Set();
try { visibleSpreads = new Set(JSON.parse(localStorage.getItem(VISIBLE_KEY)) || []); } catch { /* none yet */ }
let account = null; // { name, email, teacher }
const isTeacher = () => !!account?.teacher;

let userKnown;
const userReady = new Promise(r => { userKnown = r; }); // cloud.js has said who is signed in

window.book = {
  storageKey: KEY,
  printCopy: isPrintCopy, // cloud.js does not sync a print copy
  getSaved: () => saved,
  replaceSaved(data) {
    if (isPrintCopy) return;
    saved = data;
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* storage unavailable */ }
  },
  forgetLocal() {
    if (isPrintCopy) return;
    try { localStorage.removeItem(KEY); localStorage.removeItem(KEY + ':spread'); } catch { /* ignore */ }
  },
  setVisible(list) {
    visibleSpreads = new Set(list);
    try { localStorage.setItem(VISIBLE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
    refreshAccess();
  },
  setUser(u) { account = u; refreshAccess(); userKnown(); },
  setSyncState(s) { syncState = s; paintAccount(); },
};
let syncState = '';

/* ================= page turning ================= */

const spreads = [...document.querySelectorAll('.spread')];
const pageInput = document.getElementById('pageInput');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const spreadTitle = document.getElementById('spreadTitle');

const pagesOf = s => s.dataset.pages.split('-').map(Number);
const firstPage = pagesOf(spreads[0])[0];
const lastPage = pagesOf(spreads[spreads.length - 1]).at(-1);
document.getElementById('pageTotal').textContent = lastPage;
pageInput.min = firstPage;
pageInput.max = lastPage;

let current = 0;

const home = document.getElementById('home');

/* chapters (contents.js): each one goes from its `start` spread to the start of the next one */
const PARTS = (typeof CONTENTS === 'undefined' ? [] : CONTENTS.parts || []).map(part => ({
  ...part,
  chapters: part.chapters.map(ch => ({ ...ch, teacher: !!part.teacher, items: [] })),
}));
const CHAPTERS = PARTS.flatMap(p => p.chapters);
{
  const started = CHAPTERS
    .filter(ch => ch.start)
    .map(ch => ({ ch, at: spreads.indexOf(PAGES.spread(ch.start)) }))
    .filter(({ ch, at }) => at >= 0 || console.error(`Chapter "${ch.title}": no spread called "${ch.start}"`))
    .sort((x, y) => x.at - y.at);
  started.forEach(({ ch, at }, k) => { ch.items = spreads.slice(at, started[k + 1]?.at ?? spreads.length); });
}
const chapterOf = new Map(CHAPTERS.flatMap(ch => ch.items.map(s => [s, ch])));
// the materials for the teacher: students never see them, whatever is ticked
const teacherOnly = s => !!chapterOf.get(s)?.teacher;

// students only get the spreads the teacher made visible
const isVisible = s => visibleSpreads.has(s.dataset.id) && !teacherOnly(s);
const canSee = s => isTeacher() || isVisible(s);
// the closest spread we can open from i, going forward (+1) or back (-1); -1 if there is none
const visibleFrom = (i, dir) => {
  for (let k = i; k >= 0 && k < spreads.length; k += dir) if (canSee(spreads[k])) return k;
  return -1;
};

function show(index) {
  index = Math.max(0, Math.min(spreads.length - 1, index));
  if (!canSee(spreads[index])) { showHome(); return; }
  current = index;
  home.hidden = true;
  document.body.classList.remove('at-home');
  spreads.forEach((s, i) => s.classList.toggle('current', i === current));
  const [first] = pagesOf(spreads[current]);
  pageInput.value = first;
  spreadTitle.textContent = spreads[current].dataset.title;
  prevBtn.disabled = visibleFrom(current - 1, -1) < 0;
  nextBtn.disabled = visibleFrom(current + 1, 1) < 0;
  history.replaceState(null, '', `#p${first}`);
  try { localStorage.setItem(KEY + ':spread', spreads[current].dataset.id); } catch { /* ignore */ }
  window.scrollTo(0, 0);
  redrawAllMatches();
  document.dispatchEvent(new Event('spreadchange'));
}

function goToPage(n) {
  if (!Number.isFinite(n)) return;
  // the spread holding page n if the reader can open it, otherwise the closest one they can open
  let best = -1, bestDist = Infinity;
  spreads.forEach((s, i) => {
    if (!canSee(s)) return;
    const [a, b] = pagesOf(s);
    const dist = n < a ? a - n : n > b ? n - b : 0;
    if (dist < bestDist) { best = i; bestDist = dist; }
  });
  if (best < 0) { showHome(); return; }
  show(best);
}

function showHome() {
  spreads.forEach(s => s.classList.remove('current'));
  home.hidden = false;
  document.body.classList.add('at-home');
  spreadTitle.textContent = 'Contents';
  pageInput.value = '';
  updateContinueLink();
  window.scrollTo(0, 0);
  document.dispatchEvent(new Event('spreadchange'));
}

// #home → home page, #p6 → page 6, nothing → home page
function route() {
  const m = location.hash.match(/^#p(\d+(?:\.\d+)?)/);
  if (m) goToPage(parseFloat(m[1]));
  else showHome();
}
window.addEventListener('hashchange', route);

const step = dir => { const i = visibleFrom(current + dir, dir); if (i >= 0) show(i); };
prevBtn.addEventListener('click', () => step(-1));
nextBtn.addEventListener('click', () => step(1));
document.getElementById('gotoForm').addEventListener('submit', e => {
  e.preventDefault();
  goToPage(parseFloat(pageInput.value));
  pageInput.blur();
});
document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea') || !home.hidden) return;
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});

/* ================= written answers ================= */

const inputs = document.querySelectorAll('.fill');
inputs.forEach(inp => {
  if (saved[inp.id]) inp.value = saved[inp.id];
  inp.addEventListener('input', () => {
    saved[inp.id] = inp.value;
    inp.classList.remove('ok', 'no');
    inp.closest('li')?.classList.remove('ok', 'no');
    persist();
  });
});

// "are  We together in this ?" -> "are we together in this"
const norm = s => s.toLowerCase()
  .replace(/[’`]/g, "'")
  .replace(/[^a-z0-9' ]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

document.querySelectorAll('.check[data-list]').forEach(btn => {
  btn.addEventListener('click', () => {
    const list = document.getElementById(btn.dataset.list);
    list.querySelectorAll('li').forEach(li => {
      li.classList.remove('ok', 'no');
      const blanks = [...li.querySelectorAll('input[data-answer]')];
      const results = blanks.map(inp => {
        inp.classList.remove('ok', 'no');
        if (!inp.value.trim()) return null;
        // several right answers are separated by "|"
        const answers = inp.dataset.answer.split('|').map(norm);
        // accept the answer with or without the words already printed on the page
        const ok = answers.includes(norm(`${inp.dataset.given} ${inp.value}`)) || answers.includes(norm(inp.value));
        inp.classList.add(ok ? 'ok' : 'no');
        return ok;
      });
      if (results.includes(false)) li.classList.add('no');
      else if (results.length && results.every(Boolean)) li.classList.add('ok');
    });
  });
});

// Gaps in a text: one or more boxes ("data-gaps" lists their ids), each blank is checked on its own
document.querySelectorAll('.check[data-gaps]').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.dataset.gaps.split(' ').forEach(id => document.getElementById(id).querySelectorAll('input[data-answer]').forEach(inp => {
      inp.classList.remove('ok', 'no');
      if (!inp.value.trim()) return;
      inp.classList.add(inp.dataset.answer.split('|').map(norm).includes(norm(inp.value)) ? 'ok' : 'no');
    }));
  });
});

/* ================= connect the words ================= */

// The x of the centre of the dot that CSS draws next to a button (::after for words, ::before for meanings),
// or null when there is no dot. The CSS values are scaled like the page (zoom).
function dotCentreX(el, pseudo) {
  const cs = getComputedStyle(el, pseudo);
  if (cs.content === 'none' || cs.display === 'none') return null;
  const left = parseFloat(cs.left), width = parseFloat(cs.width);
  if (!Number.isFinite(left) || !Number.isFinite(width)) return null;
  const m = cs.transform.match(/^matrix\(([^)]+)\)$/);
  const tx = m ? parseFloat(m[1].split(',')[4]) : 0;
  const r = el.getBoundingClientRect();
  const k = el.offsetWidth ? r.width / el.offsetWidth : 1;
  return r.left + (left + tx + width / 2) * k;
}

// Click a word, then its meaning (or the other way round) to draw a line,
// or drag the line from one to the other. Click a connected item again to remove its line.
// Three columns ([greek-gods]): a .match-set holds the lists and two .match layers,
// each one says which buttons it connects (data-words / data-defs).

const matches = [...document.querySelectorAll('.match')].map(box => {
  const root = box.closest('.match-set') || box;
  const words = [...root.querySelectorAll(box.dataset.words || '.match-words button')];
  const defs = [...root.querySelectorAll(box.dataset.defs || '.match-defs button')];
  const svg = box.querySelector('.match-lines');
  let links = []; // [wordIndex, defIndex]
  let selected = null;
  let checked = false;
  // an example already connected in the book, e.g. data-example="4-0"
  const example = box.dataset.example ? [box.dataset.example.split('-').map(Number)] : [];
  const fresh = () => example.map(l => [...l]);
  try { links = saved[box.id] ? JSON.parse(saved[box.id]) : fresh(); } catch { links = fresh(); }

  function store() {
    saved[box.id] = JSON.stringify(links);
    persist();
  }

  const curved = box.classList.contains('gm-layer'); // [greek-gods]: curved coloured lines
  function draw() {
    const base = box.getBoundingClientRect();
    if (!base.width) return; // spread not visible
    words.forEach(b => b.classList.toggle('linked-w', links.some(l => words[l[0]] === b)));
    defs.forEach(b => b.classList.toggle('linked-d', links.some(l => defs[l[1]] === b)));
    svg.innerHTML = links.map(([w, d]) => {
      const a = words[w].getBoundingClientRect();
      const b = defs[d].getBoundingClientRect();
      const dot = a.height * 0.3; // dot sits just outside each button
      // from the centre of one dot to the centre of the other
      let [x1, y1] = [(dotCentreX(words[w], '::after') ?? a.right + dot) - base.left, a.top + a.height / 2 - base.top];
      if (curved && words[w].closest('.gm-defs')) [x1, y1] = rotatedEnd(words[w], base, dot);
      const x2 = (dotCentreX(defs[d], '::before') ?? b.left - dot) - base.left, y2 = b.top + b.height / 2 - base.top;
      const cls = checked ? (words[w].dataset.key === defs[d].dataset.key ? 'ok' : 'no') : '';
      if (!curved) return `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      // one colour per god, so the line from its meaning and the line to its adjective match
      const god = [words[w], defs[d]].find(el => el.closest('[data-shared]'));
      const hue = GOD_LINES[[...god.closest('ul').querySelectorAll('button')].indexOf(god) % GOD_LINES.length];
      return `<path class="${cls}" d="${curve(x1, y1, x2, y2)}"${cls ? '' : ` style="stroke:${hue}"`}/>`;
    }).join('');
  }

  function unselect() {
    selected?.el.classList.remove('selected');
    selected = null;
  }

  // a line was drawn in the other layer of the same set: forget what was picked here
  function linkedElsewhere() {
    matches.filter(m => m.root === root && m.id !== box.id).forEach(m => m.unselect());
  }

  function pick(side, index, e) {
    if (e.matchDone && e.matchDone !== box) { unselect(); return; }
    const list = side === 'w' ? words : defs;
    const pos = side === 'w' ? 0 : 1;
    checked = false;
    const existing = links.findIndex(l => l[pos] === index);
    // the middle column belongs to two layers: clicking it never removes a line
    if (existing >= 0 && !selected && !list[index].closest('[data-shared]')) {
      links.splice(existing, 1);
      store(); draw();
      e.matchDone = box;
      return;
    }
    if (selected && selected.side !== side) {
      const pair = side === 'w' ? [index, selected.index] : [selected.index, index];
      links = links.filter(l => l[0] !== pair[0] && l[1] !== pair[1]);
      links.push(pair);
      unselect();
      store(); draw();
      e.matchDone = box;
      linkedElsewhere();
      return;
    }
    selected?.el.classList.remove('selected');
    selected = { side, index, el: list[index] };
    list[index].classList.add('selected');
  }

  // drag & drop: hold a word, drag the line to its meaning and let go (clicking works too)
  let drag = null;
  let dragged = false; // a drag just ended: ignore the click that may follow it
  const dotOf = (el, side) => {
    const base = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const dot = r.height * 0.3;
    if (side === 'w' && el.closest('.gm-defs')) return rotatedEnd(el, base, dot);
    const x = side === 'w' ? (dotCentreX(el, '::after') ?? r.right + dot) : (dotCentreX(el, '::before') ?? r.left - dot);
    return [x - base.left, r.top + r.height / 2 - base.top];
  };

  function startDrag(side, index, e) {
    if (e.button > 0) return;
    drag = { side, index, x: e.clientX, y: e.clientY, moved: false };
  }

  document.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    // the middle column belongs to two layers: only the layer in the direction of the drag answers
    const toRight = e.clientX > drag.x;
    if ((drag.side === 'w') !== toRight) { if (drag.moved) { drag.moved = false; draw(); } return; }
    drag.moved = true;
    const [x1, y1] = dotOf((drag.side === 'w' ? words : defs)[drag.index], drag.side);
    const base = box.getBoundingClientRect();
    draw();
    svg.insertAdjacentHTML('beforeend', curved
      ? `<path class="drag" d="${curve(x1, y1, e.clientX - base.left, e.clientY - base.top)}"/>`
      : `<line class="drag" x1="${x1}" y1="${y1}" x2="${e.clientX - base.left}" y2="${e.clientY - base.top}"/>`);
  });

  document.addEventListener('pointercancel', () => { if (drag) { drag = null; draw(); } });

  document.addEventListener('pointerup', e => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moved) return;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('button');
    const other = d.side === 'w' ? defs : words;
    const index = other.indexOf(target);
    if (index >= 0) {
      const pair = d.side === 'w' ? [d.index, index] : [index, d.index];
      links = links.filter(l => l[0] !== pair[0] && l[1] !== pair[1]);
      links.push(pair);
      checked = false;
      unselect();
      store();
      linkedElsewhere();
    }
    draw();
    dragged = true;
    setTimeout(() => { dragged = false; });
  });

  words.forEach((b, i) => {
    b.addEventListener('pointerdown', e => startDrag('w', i, e));
    b.addEventListener('click', e => { if (!dragged) pick('w', i, e); });
  });
  defs.forEach((b, i) => {
    b.addEventListener('pointerdown', e => startDrag('d', i, e));
    b.addEventListener('click', e => { if (!dragged) pick('d', i, e); });
  });

  return {
    id: box.id,
    root,
    unselect,
    draw,
    check() { checked = true; draw(); },
    reset() { links = fresh(); checked = false; unselect(); draw(); },
  };
});

// [greek-gods]: the meanings are rotated text; the line starts just after its right-most letter
function rotatedEnd(el, base, dot) {
  const o = el.offsetParent.getBoundingClientRect();
  const ang = 38 * Math.PI / 180; // same angle as .gm-defs button in style.css
  const [cos, sin] = [Math.cos(ang), Math.sin(ang)];
  // measure the text unrotated, relative to the top-left corner the rotation turns around
  const saved = el.style.transform;
  el.style.transform = 'none';
  const r = document.createRange();
  r.selectNodeContents(el);
  const b = el.getBoundingClientRect();
  const ends = [...r.getClientRects()].map(l => {
    const [lx, ly] = [l.right - b.left + l.height * 0.6, l.top + l.height / 2 - b.top];
    return [lx * cos - ly * sin, lx * sin + ly * cos];
  });
  el.style.transform = saved;
  const [x, y] = ends.reduce((m, p) => (p[0] > m[0] ? p : m));
  return [o.left + el.offsetLeft + x - base.left, o.top + el.offsetTop + y - base.top];
}
// S-shaped line between two points (horizontal at both ends)
const curve = (x1, y1, x2, y2) => { const k = Math.max(Math.abs(x2 - x1) / 2, 60); return `M${x1},${y1} C${x1 + k},${y1} ${x2 - k},${y2} ${x2},${y2}`; };
const GOD_LINES = ['#ffffff', '#fdf27a', '#c6f5a0', '#bfe6ff', '#e9ccff', '#ffd9a0', '#a8f0e0'];
function redrawAllMatches() { matches.forEach(m => m.draw()); }
window.addEventListener('resize', redrawAllMatches);
document.fonts?.ready.then(redrawAllMatches);

document.querySelectorAll('.check[data-match]').forEach(btn => {
  // one button can check several layers: data-match="gm-a gm-b"
  const ids = btn.dataset.match.split(' ');
  btn.addEventListener('click', () => matches.filter(m => ids.includes(m.id)).forEach(m => m.check()));
});

/* ================= true / false ================= */

const tfs = [...document.querySelectorAll('.tf, .opt')];
function paintTf(tf) {
  tf.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.textContent === saved[tf.id]));
}
tfs.forEach(tf => {
  paintTf(tf);
  tf.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    saved[tf.id] = saved[tf.id] === b.textContent ? '' : b.textContent;
    tf.classList.remove('ok', 'no');
    paintTf(tf);
    persist();
  }));
});

document.querySelectorAll('.check[data-tf]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.tf).querySelectorAll('.tf[data-answer], .opt[data-answer]').forEach(tf => {
      tf.classList.remove('ok', 'no');
      if (saved[tf.id]) tf.classList.add(saved[tf.id] === tf.dataset.answer ? 'ok' : 'no');
    });
  });
});

/* ================= click words to underline them ================= */

const underlinables = [...document.querySelectorAll('.underlinable')].map(box => {
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.append(part); return; }
      const w = document.createElement('span');
      w.className = 'w';
      w.textContent = part;
      frag.append(w);
    });
    node.replaceWith(frag);
  });
  const words = [...box.querySelectorAll('.w')];
  const paint = () => {
    const on = new Set(JSON.parse(saved[box.id] || '[]'));
    words.forEach((w, i) => w.classList.toggle('ul', on.has(i)));
  };
  words.forEach((w, i) => w.addEventListener('click', () => {
    const on = new Set(JSON.parse(saved[box.id] || '[]'));
    on.has(i) ? on.delete(i) : on.add(i);
    saved[box.id] = JSON.stringify([...on]);
    persist();
    paint();
  }));
  paint();
  return { paint };
});

/* ================= apostrophes ================= */
// Click a word to cycle: sisters → sister's → sisters' → sisters

const aposWords = [...document.querySelectorAll('.apos')].map(el => {
  const base = el.textContent;
  const forms = [...new Set([base, base.replace(/s$/, '') + "'s", base + "'", base + "'s"])];
  const paint = () => {
    const i = Number(saved[el.id]) || 0;
    el.textContent = forms[i];
    el.classList.toggle('changed', i > 0);
  };
  el.addEventListener('click', () => {
    saved[el.id] = String(((Number(saved[el.id]) || 0) + 1) % forms.length);
    el.closest('li')?.classList.remove('ok', 'no');
    persist();
    paint();
  });
  paint();
  return { paint };
});

document.querySelectorAll('.check[data-apos]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.apos).querySelectorAll('li').forEach(li => {
      const words = [...li.querySelectorAll('.apos')];
      const ok = words.every(w => w.dataset.answer.split('|').map(norm).includes(norm(w.textContent)));
      li.classList.remove('ok', 'no');
      li.classList.add(ok ? 'ok' : 'no');
    });
  });
});

/* ================= tick buttons ================= */

const ticks = [...document.querySelectorAll('.tick')];
ticks.forEach(t => {
  t.classList.toggle('on', saved[t.id] === '1');
  t.addEventListener('click', () => {
    saved[t.id] = saved[t.id] === '1' ? '' : '1';
    t.classList.toggle('on', saved[t.id] === '1');
    persist();
  });
});

/* ================= click to mark (highlight, cross out) ================= */

const toggles = [...document.querySelectorAll('.toggle')];
toggles.forEach(el => {
  el.classList.toggle('on', saved[el.id] === '1');
  el.addEventListener('click', () => {
    saved[el.id] = saved[el.id] === '1' ? '' : '1';
    el.classList.toggle('on', saved[el.id] === '1');
    el.classList.remove('ok', 'no');
    persist();
  });
});

/* ================= maze: drag a thread from START ([own-mistakes:R]) ================= */
// Press on the first cell (or on the end of the thread) and drag: the thread goes into the next
// cell only when no wall is in between; dragging back onto the cell before rolls it up again.
// A click on the next cell lengthens the thread by one step.

const mazes = [...document.querySelectorAll('.mz')].map(box => {
  const cols = +box.dataset.cols, rows = +box.dataset.rows;
  const cells = [...box.querySelectorAll('.mz-cell')];
  const walls = box.querySelector('svg');
  const [, , W, H] = walls.getAttribute('viewBox').split(' ').map(Number);
  const cw = W / cols, ch = H / rows;
  const segs = [...walls.querySelectorAll('path')].map(p => p.getAttribute('d').match(/[\d.]+/g).map(Number));
  const near = (a, b) => Math.abs(a - b) < .01;
  // is there a wall on the line x (vertical) or y (horizontal) between from and to?
  const wallV = (x, y1, y2) => segs.some(([a, b, c, d]) => near(a, x) && near(c, x) && Math.min(b, d) <= y1 + .01 && Math.max(b, d) >= y2 - .01);
  const wallH = (y, x1, x2) => segs.some(([a, b, c, d]) => near(b, y) && near(d, y) && Math.min(a, c) <= x1 + .01 && Math.max(a, c) >= x2 - .01);
  const open = (i, j) => {
    const [r, c] = [Math.floor(i / cols), i % cols], [s, t] = [Math.floor(j / cols), j % cols];
    if (r === s && Math.abs(c - t) === 1) return !wallV(Math.max(c, t) * cw, r * ch, (r + 1) * ch);
    if (c === t && Math.abs(r - s) === 1) return !wallH(Math.max(r, s) * ch, c * cw, (c + 1) * cw);
    // diagonal: only across a corner where the four walls around it are all missing
    if (Math.abs(r - s) === 1 && Math.abs(c - t) === 1) {
      const x = Math.max(c, t) * cw, y = Math.max(r, s) * ch;
      return !wallV(x, y - ch, y) && !wallV(x, y, y + ch) && !wallH(y, x - cw, x) && !wallH(y, x, x + cw);
    }
    return false;
  };
  // the way out is the gap in the bottom wall
  let last = -1;
  for (let c = 0; c < cols; c++) if (!wallH(H, c * cw, (c + 1) * cw)) last = (rows - 1) * cols + c;

  const thread = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  thread.setAttribute('viewBox', `0 0 ${W} ${H}`);
  thread.setAttribute('class', 'mz-thread');
  thread.setAttribute('aria-hidden', 'true');
  thread.style.overflow = 'visible';
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  thread.append(line);
  box.prepend(thread);

  const trail = () => JSON.parse(saved[box.id] || '[]');
  const centre = i => [(i % cols + .5) * cw, (Math.floor(i / cols) + .5) * ch];
  const paint = () => {
    const t = trail();
    const pts = t.map(centre);
    if (t.length) pts.unshift([centre(t[0])[0], -.4]); // in from START
    if (t.at(-1) === last) pts.push([centre(last)[0], H + .4]); // out to FINISH
    line.setAttribute('points', pts.map(p => p.join(',')).join(' '));
    cells.forEach((el, i) => el.classList.toggle('on', t.includes(i)));
  };
  const store = t => {
    saved[box.id] = t.length ? JSON.stringify(t) : '';
    cells.forEach(el => el.classList.remove('ok', 'no'));
    persist();
    paint();
  };

  let drawing = false;
  const cellAt = e => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.mz-cell');
    return el && el.parentNode.parentNode === box ? cells.indexOf(el) : -1;
  };
  box.addEventListener('pointerdown', e => {
    const i = cellAt(e);
    if (i < 0) return;
    let t = trail();
    if (t.includes(i)) t = t.slice(0, t.indexOf(i) + 1); // go on from any point of the thread
    else if (!t.length && i === 0) t = [0];
    else if (t.length && open(t.at(-1), i)) t = [...t, i]; // click the next step to lengthen the thread
    else return;
    drawing = true;
    box.setPointerCapture(e.pointerId);
    e.preventDefault();
    store(t);
  });
  box.addEventListener('pointermove', e => {
    if (!drawing) return;
    const i = cellAt(e);
    const t = trail();
    if (i < 0 || i === t.at(-1)) return;
    if (i === t.at(-2)) { t.pop(); store(t); return; }
    if (!t.includes(i) && open(t.at(-1), i)) { t.push(i); store(t); }
  });
  const stop = () => { drawing = false; };
  box.addEventListener('pointerup', stop);
  box.addEventListener('pointercancel', stop);

  paint();
  return {
    id: box.id,
    paint,
    check() {
      const t = trail();
      cells.forEach((el, i) => {
        el.classList.remove('ok', 'no');
        if (t.includes(i)) el.classList.add(el.dataset.should === '1' ? 'ok' : 'no');
      });
    },
    reset() { cells.forEach(el => el.classList.remove('ok', 'no')); paint(); },
  };
});

document.querySelectorAll('.check[data-maze]').forEach(btn => {
  btn.addEventListener('click', () => mazes.find(m => m.id === btn.dataset.maze)?.check());
});

document.querySelectorAll('.check[data-toggles]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.toggles).querySelectorAll('.toggle[data-should]').forEach(el => {
      const ok = el.classList.contains('on') === (el.dataset.should === '1');
      el.classList.remove('ok', 'no');
      el.classList.add(ok ? 'ok' : 'no');
    });
  });
});

/* the dice of the conversation game ([ps-conversation-game]) lives in game.js */

/* ================= Big 5 scores ================= */
// each sentence gets 0, 1 or 2: the total of the trait is added up by itself

const b5Sections = [...document.querySelectorAll('.b5-sec')];
function b5Totals() {
  b5Sections.forEach(sec => {
    const scores = [...sec.querySelectorAll('.b5-score')].map(inp => inp.value).filter(v => v !== '');
    sec.querySelector('.b5-tot output').textContent = scores.length ? scores.reduce((t, v) => t + Number(v), 0) : ' ';
  });
}
document.querySelectorAll('.b5-score').forEach(inp => inp.addEventListener('input', () => {
  inp.value = inp.value.replace(/[^012]/g, '').slice(-1);
  saved[inp.id] = inp.value;
  persist();
  b5Totals();
}));
b5Totals();

/* ================= evaluation grid ([greek-acting:R]) ================= */
// performance + pronunciation + creativity = total

const egScores = [...document.querySelectorAll('.eg-n')];
function egTotal() {
  const out = document.getElementById('eg-total');
  if (!out) return;
  const vals = egScores.map(i => i.value).filter(v => v !== '');
  out.textContent = vals.length ? vals.reduce((t, v) => t + Number(v), 0) : '';
}
egScores.forEach(inp => inp.addEventListener('input', () => {
  inp.value = inp.value.replace(/[^1-4]/g, '').slice(-1);
  saved[inp.id] = inp.value;
  persist();
  egTotal();
}));
egTotal();

/* ================= half-page flap ([pers-adjectives]) ================= */
// the flap hides the English words on one page or the other

document.querySelectorAll('.flap').forEach(flap => flap.addEventListener('click', () => {
  flap.closest('.spread').classList.toggle('flap-left');
}));

/* ================= detective games ([people-slash-draw … people-ladder]) ================= */

// Text without spaces: click a letter to put a slash after it (click again to take it away).
// data-words holds the real words; the correct slashes are the ends of the words.
const slashables = [...document.querySelectorAll('.slashable')].map(box => {
  const words = box.dataset.words.split(' ');
  const text = words.join('');
  const right = new Set();
  let end = -1;
  words.slice(0, -1).forEach(w => { end += w.length; right.add(end); });
  let cuts = new Set();
  try { cuts = new Set(JSON.parse(saved[box.id] || '[]')); } catch { cuts = new Set(); }
  const score = document.getElementById(box.id + '-score');

  const letters = [...text].map((c, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = c;
    if (i < text.length - 1) s.addEventListener('click', () => {
      cuts.has(i) ? cuts.delete(i) : cuts.add(i);
      saved[box.id] = JSON.stringify([...cuts]);
      persist();
      paint();
    });
    return s;
  });
  box.append(...letters);

  function paint(checked) {
    letters.forEach((s, i) => {
      s.classList.toggle('cut', cuts.has(i));
      s.classList.remove('ok', 'no');
      if (checked && cuts.has(i)) s.classList.add(right.has(i) ? 'ok' : 'no');
    });
    if (!score) return;
    score.classList.toggle('done', !!checked);
    if (!checked) { score.textContent = ''; return; }
    const good = [...cuts].filter(i => right.has(i)).length;
    const bad = cuts.size - good;
    score.textContent = `${good} / ${right.size} slashes in the right place` + (bad ? ` · ${bad} in the wrong place` : '') + (good === right.size && !bad ? ' 🎉' : '');
  }
  paint();
  return { box, paint, reset() { cuts = new Set(); paint(); } };
});

document.querySelectorAll('.check[data-slash]').forEach(btn => btn.addEventListener('click', () => {
  slashables.find(s => s.box.id === btn.dataset.slash)?.paint(true);
}));

// Drawing areas: pick a colour, draw with the mouse or a finger. The drawing is saved in this browser.
const drawings = [...document.querySelectorAll('.pd-draw')].map(wrap => {
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let colour = '#222';
  let last = null;
  ctx.lineCap = ctx.lineJoin = 'round';

  if (saved[wrap.id]) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = saved[wrap.id];
  }

  const at = e => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height];
  };
  const line = (a, b) => {
    ctx.globalCompositeOperation = colour === 'erase' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = colour === 'erase' ? '#000' : colour;
    ctx.lineWidth = colour === 'erase' ? 36 : 5;
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  };
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    last = at(e);
    line(last, [last[0] + .01, last[1]]);
  });
  canvas.addEventListener('pointermove', e => {
    if (!last) return;
    const p = at(e);
    line(last, p);
    last = p;
  });
  const stop = () => {
    if (!last) return;
    last = null;
    saved[wrap.id] = canvas.toDataURL('image/webp', .85);
    persist();
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);

  wrap.querySelectorAll('.pd-sw').forEach(b => b.addEventListener('click', () => {
    colour = b.dataset.c;
    wrap.querySelectorAll('.pd-sw').forEach(o => o.classList.toggle('on', o === b));
  }));
  // "Add a photo": the picture is drawn in the same box, so it can be drawn over or rubbed out
  const fileInput = wrap.querySelector('input[type=file]');
  wrap.querySelector('.pd-photo-btn')?.addEventListener('click', () => fileInput.click());
  fileInput?.addEventListener('change', () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.max(canvas.width / img.width, canvas.height / img.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, (canvas.width - img.width * k) / 2, (canvas.height - img.height * k) / 2, img.width * k, img.height * k);
      URL.revokeObjectURL(url);
      saved[wrap.id] = canvas.toDataURL('image/webp', .85);
      persist();
    };
    img.src = url;
  });
  const reset = () => { ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, canvas.width, canvas.height); };
  wrap.querySelector('.pd-clear').addEventListener('click', () => {
    if (!confirm('Clear this drawing?')) return;
    reset();
    saved[wrap.id] = '';
    persist();
  });
  return { reset };
});

// Sorting exercise: type a number and the sentence jumps there; drag a sentence and the numbers follow.
// A number stays light grey until the student types it.
const sorts = [...document.querySelectorAll('.pd-sort')].map(list => {
  const items = [...list.children];
  const byKey = k => items.find(li => li.dataset.k === k);
  const start = () => ({ order: items.map(li => li.dataset.k), set: [] });
  let st = start();
  try {
    const sv = JSON.parse(saved[list.id] || 'null');
    if (sv && sv.order?.length === items.length && sv.order.every(k => byKey(k))) st = sv;
  } catch { st = start(); }

  function paint(checked) {
    st.order.forEach(k => list.append(byKey(k)));
    [...list.children].forEach((li, i) => {
      const n = li.querySelector('.pd-num');
      if (document.activeElement !== n || n.value === '') n.value = i + 1;
      n.classList.toggle('set', st.set.includes(li.dataset.k));
      li.classList.remove('ok', 'no');
    });
    if (!checked) return;
    // two orders are accepted: use the one that fits better
    const rows = [...list.children];
    const hits = key => rows.filter((li, i) => Number(li.dataset[key]) === i + 1).length;
    const key = hits('alt') > hits('answer') ? 'alt' : 'answer';
    rows.forEach((li, i) => li.classList.add(Number(li.dataset[key]) === i + 1 ? 'ok' : 'no'));
  }
  const save = () => { saved[list.id] = JSON.stringify(st); persist(); };
  const move = (k, to) => { st.order = st.order.filter(x => x !== k); st.order.splice(to, 0, k); };

  items.forEach(li => {
    const k = li.dataset.k;
    const num = li.querySelector('.pd-num');
    num.addEventListener('focus', () => num.select());
    num.addEventListener('input', () => {
      const v = Number(num.value.replace(/[^1-8]/g, '').slice(-1));
      if (!v || v > items.length) { num.value = ''; return; }
      if (!st.set.includes(k)) st.set.push(k);
      move(k, v - 1);
      save();
      num.value = v;
      paint();
      const again = byKey(k).querySelector('.pd-num');
      again.focus();
    });
    num.addEventListener('blur', () => paint());

    li.querySelector('.grip').addEventListener('pointerdown', e => {
      e.preventDefault();
      li.classList.add('drag');
      const rowH = li.getBoundingClientRect().height;
      const onMove = ev => {
        const top = list.getBoundingClientRect().top;
        const to = Math.max(0, Math.min(items.length - 1, Math.floor((ev.clientY - top) / rowH)));
        if (st.order.indexOf(k) !== to) { move(k, to); paint(); }
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        li.classList.remove('drag');
        save();
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    });
  });
  paint();
  return { id: list.id, paint, reset() { st = start(); paint(); } };
});
document.querySelectorAll('.check[data-order]').forEach(btn => btn.addEventListener('click', () => {
  sorts.find(x => x.id === btn.dataset.order)?.paint(true);
}));

// Evidence table: click a cell to cycle  empty → ✓ → ✗
const marks = [...document.querySelectorAll('.pd-mark')];
const paintMark = m => {
  m.classList.toggle('yes', saved[m.id] === 'y');
  m.classList.toggle('nope', saved[m.id] === 'n');
};
marks.forEach(m => {
  paintMark(m);
  m.addEventListener('click', () => {
    saved[m.id] = { '': 'y', y: 'n', n: '' }[saved[m.id] || ''];
    persist();
    paintMark(m);
  });
});

/* ================= Shakespeare ([shk-sonnet … shk-rhyme-machine]) ================= */

// Rhymes: click the last word of a line to give it a letter: A → B → … → G → nothing.
const RHYMES = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
const rhymes = [...document.querySelectorAll('.sh-rhyme')];
const paintRhyme = b => { b.dataset.l = saved[b.id] || ''; };
rhymes.forEach(b => {
  paintRhyme(b);
  b.addEventListener('click', () => {
    saved[b.id] = RHYMES[(RHYMES.indexOf(saved[b.id] || '') + 1) % RHYMES.length];
    b.classList.remove('ok', 'no');
    persist();
    paintRhyme(b);
  });
});
document.querySelectorAll('.check[data-rhyme]').forEach(btn => btn.addEventListener('click', () => {
  document.getElementById(btn.dataset.rhyme).querySelectorAll('.sh-rhyme').forEach(b => {
    b.classList.remove('ok', 'no');
    // several right letters are separated by "|" (e.g. "D|B": the same sound as before)
    if (saved[b.id]) b.classList.add(b.dataset.answer.split('|').includes(saved[b.id]) ? 'ok' : 'no');
  });
}));

// Syllables: click a letter to put a | after it (click again to take it away).
// data-line marks the syllables inside a word with "-": "Co-ral is far…".
// A | at the end of a word is always right; inside a word only the number counts,
// so "da|masked" and "dam|asked" are both right.
const syllableLines = [...document.querySelectorAll('.sh-syl')].map(box => {
  const words = box.dataset.line.split(' ').map(w => {
    const parts = w.split('-');
    const text = parts.join('');
    let last = text.length - 1; // last letter: punctuation after it counts as the end of the word
    while (last > 0 && !/[a-z]/i.test(text[last])) last--;
    return { text, inside: parts.length - 1, last };
  });
  const need = words.reduce((t, w) => t + w.inside, 0) + words.length - 1;
  const score = document.getElementById(box.id + '-score');
  let cuts = new Set();
  try { cuts = new Set(JSON.parse(saved[box.id] || '[]')); } catch { cuts = new Set(); }

  const toggle = key => {
    cuts.has(key) ? cuts.delete(key) : cuts.add(key);
    saved[box.id] = JSON.stringify([...cuts]);
    persist();
    paint();
  };
  const spans = words.map((w, wi) => {
    const lastWord = wi === words.length - 1;
    const row = [...w.text].map((c, ci) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      const end = ci >= w.last;
      if (!(end && lastWord)) s.addEventListener('click', () => toggle(`${wi}.${end ? w.last : ci}`));
      return s;
    });
    box.append(...row);
    if (!lastWord) {
      const sp = document.createElement('span');
      sp.className = 'sp';
      sp.textContent = ' ';
      sp.addEventListener('click', () => toggle(`${wi}.${w.last}`));
      box.append(sp);
    }
    return row;
  });

  function paint(checked) {
    spans.flat().forEach(s => s.classList.remove('cut', 'ok', 'no'));
    let good = 0, bad = 0;
    words.forEach((w, wi) => {
      const mine = [...cuts].filter(k => k.startsWith(wi + '.')).map(k => Number(k.split('.')[1]));
      const insideOk = mine.filter(c => c < w.last).length === w.inside;
      mine.forEach(c => {
        const s = c >= w.last ? spans[wi].at(-1) : spans[wi][c];
        s.classList.add('cut');
        if (!checked) return;
        const ok = c >= w.last || insideOk;
        s.classList.add(ok ? 'ok' : 'no');
        ok ? good++ : bad++;
      });
    });
    if (score) score.textContent = checked ? `${good} / ${need} |` + (good === need && !bad ? ' 🎉' : '') : '';
  }
  paint();
  return { box, paint };
});
document.querySelectorAll('.check[data-syl]').forEach(btn => btn.addEventListener('click', () => {
  const list = document.getElementById(btn.dataset.syl);
  syllableLines.filter(s => list.contains(s.box)).forEach(s => s.paint(true));
}));

// The student's sonnet: an approximate syllable count next to each line.
// One syllable for each group of vowels, after taking away a silent final e
// (like, makes, loved — but not little, roses, wanted); li-on, roy-al are two.
function countSyllables(line) {
  return line.toLowerCase().replace(/['’]/g, '').split(/[^a-z]+/).filter(Boolean).reduce((t, w) => {
    w = w.replace(/qu/g, 'q')
      .replace(/(?:[^laeiouytd]ed|[^laeiouysxzcg]es|[^laeiouy]e)$/, '')
      .replace(/^y/, '');
    const groups = (w.match(/[aeiouy]+/g) || []).length + (w.match(/i[aou]|oya|ua|uo/g) || []).length;
    return t + Math.max(1, groups);
  }, 0);
}
const sonnetCounts = [...document.querySelectorAll('.sh-sonnet input.fill')].map(inp => {
  const out = inp.parentElement.querySelector('output');
  const paint = () => {
    const n = countSyllables(inp.value);
    out.textContent = n ? `≈ ${n}` : '';
    out.classList.toggle('ten', n === 10);
  };
  inp.addEventListener('input', paint);
  paint();
  return paint;
});

/* ================= Villain Lab: "My flaws" circles ([pers-villain-mine]) ================= */
// click the 4th circle = 4 out of 10; click the same one again to start over
const flawRows = [...document.querySelectorAll('.vl-flaw')].map(row => {
  const dots = [...row.querySelectorAll('button')];
  const paint = () => dots.forEach((d, i) => d.classList.toggle('on', i < (Number(saved[row.id]) || 0)));
  dots.forEach((d, i) => d.addEventListener('click', () => {
    saved[row.id] = String((Number(saved[row.id]) || 0) === i + 1 ? 0 : i + 1);
    persist();
    paint();
  }));
  paint();
  return { paint };
});

/* ================= drag the phrases to the right place ================= */
// A .dd-set has a .dd-bank of .dd-chip and some empty .dd-slot: drag a chip into a slot
// (or click the chip, then the slot). Drag it back to the bank to take it away.
// A chip is right when its data-key is the same as the slot's.

const dragSets = [...document.querySelectorAll('.dd-set')].map(set => {
  const bank = set.querySelector('.dd-bank');
  const chips = [...bank.querySelectorAll('.dd-chip')];
  const slots = [...set.querySelectorAll('.dd-slot:not(.given)')];
  let place = {}; // slot id → chip id
  try { place = JSON.parse(saved[set.id] || '{}'); } catch { place = {}; }
  let picked = null;

  function paint(checked) {
    chips.forEach(c => bank.append(c));
    slots.forEach(s => {
      s.classList.remove('ok', 'no');
      const c = chips.find(x => x.id === place[s.id]);
      if (c) s.append(c);
      if (checked && c) s.classList.add(c.dataset.key === s.dataset.key ? 'ok' : 'no');
    });
    chips.forEach(c => c.classList.toggle('picked', c === picked));
  }
  function put(chip, slot) {
    Object.keys(place).forEach(k => { if (place[k] === chip.id) delete place[k]; });
    if (slot) place[slot.id] = chip.id; // a chip already there goes back to the bank
    picked = null;
    saved[set.id] = JSON.stringify(place);
    persist();
    paint();
  }
  const dropTarget = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el?.closest('.dd-slot:not(.given)') || (el?.closest('.dd-bank') ? bank : null);
  };

  chips.forEach(chip => chip.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    e.preventDefault();
    const r = chip.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    let ghost = null, over = null;
    const move = ev => {
      if (!ghost) {
        if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 6) return;
        ghost = chip.cloneNode(true);
        ghost.classList.add('dd-ghost');
        const cs = getComputedStyle(chip);
        Object.assign(ghost.style, { width: r.width + 'px', fontSize: cs.fontSize, padding: cs.padding, borderRadius: cs.borderRadius });
        document.body.append(ghost);
        chip.classList.add('dragging');
      }
      ghost.style.left = ev.clientX - dx + 'px';
      ghost.style.top = ev.clientY - dy + 'px';
      const t = dropTarget(ev.clientX, ev.clientY);
      if (t !== over) { over?.classList.remove('over'); over = t; over?.classList.add('over'); }
    };
    const up = ev => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      over?.classList.remove('over');
      chip.classList.remove('dragging');
      if (!ghost) { // a click: pick the chip (click again to put it down)
        picked = picked === chip ? null : chip;
        paint();
        return;
      }
      ghost.remove();
      if (ev.type === 'pointercancel') return;
      const t = dropTarget(ev.clientX, ev.clientY);
      if (t) put(chip, t === bank ? null : t);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  }));

  // click mode: after picking a chip, click a slot (or the bank)
  slots.forEach(s => s.addEventListener('click', e => {
    if (picked && !e.target.closest('.dd-chip')) put(picked, s);
  }));
  bank.addEventListener('click', e => {
    if (picked && !e.target.closest('.dd-chip')) put(picked, null);
  });

  paint();
  return { id: set.id, paint, reset() { place = {}; picked = null; paint(); } };
});
document.querySelectorAll('.check[data-dd]').forEach(btn => btn.addEventListener('click', () => {
  dragSets.find(d => d.id === btn.dataset.dd)?.paint(true);
}));

/* ================= unscramble: the letters already used turn red ================= */
// [shk-id-card] 7.4: each letter typed in the box uses one tile with that letter;
// clicking a tile writes its letter (or takes it away when it is already used)

const tileRows = [...document.querySelectorAll('.shx-tiles')].map(tiles => {
  const inp = tiles.parentElement.querySelector('input.fill');
  const paint = () => {
    const left = [...inp.value.toUpperCase().replace(/[^A-Z]/g, '')];
    tiles.querySelectorAll('b').forEach(t => {
      const i = left.indexOf(t.textContent);
      t.classList.toggle('used', i >= 0);
      if (i >= 0) left.splice(i, 1);
    });
  };
  inp.addEventListener('input', paint);
  // click a white tile: its letter is written; click a red tile: the letter is taken away
  tiles.querySelectorAll('b').forEach(t => t.addEventListener('click', () => {
    const letter = t.textContent.toLowerCase();
    if (!t.classList.contains('used')) inp.value += letter;
    else {
      const i = inp.value.toLowerCase().lastIndexOf(letter);
      if (i >= 0) inp.value = inp.value.slice(0, i) + inp.value.slice(i + 1);
    }
    inp.dispatchEvent(new Event('input')); // saved like a typed answer
  }));
  paint();
  return paint;
});
document.getElementById('clearBtn').addEventListener('click', () => setTimeout(() => tileRows.forEach(paint => paint())));

/* ================= pictures still to come ================= */
// <img data-pic="img/shakespeare/rose">: tries rose.png, .jpg, .jpeg, .webp.
// While no file exists, the placeholder next to it stays visible.

document.querySelectorAll('img[data-pic]').forEach(img => {
  const exts = ['png', 'jpg', 'jpeg', 'webp'];
  let i = 0;
  const next = () => { if (i < exts.length) img.src = `${img.dataset.pic}.${exts[i++]}`; else img.remove(); };
  img.addEventListener('error', next);
  img.addEventListener('load', () => img.parentElement.classList.add('has-pic'));
  next();
});

/* ================= toolbar ================= */

/* zoom: scales the spread width (the page content scales with it) */
{
  const ZOOM_MIN = 0.5, ZOOM_MAX = 3, ZOOM_STEP = 0.25;
  const level = document.getElementById('zoomLevel');
  let zoom = 1;
  try { zoom = parseFloat(localStorage.getItem('zoom')) || 1; } catch (e) {}
  const setZoom = z => {
    zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));
    document.documentElement.style.setProperty('--zoom', zoom);
    document.body.classList.toggle('zoomed', zoom > 1);
    level.textContent = Math.round(zoom * 100) + '%';
    try { localStorage.setItem('zoom', zoom); } catch (e) {}
  };
  document.getElementById('zoomIn').addEventListener('click', () => setZoom(zoom + ZOOM_STEP));
  document.getElementById('zoomOut').addEventListener('click', () => setZoom(zoom - ZOOM_STEP));
  level.addEventListener('click', () => setZoom(1));
  setZoom(zoom);
}

/* "Print": the two pages open now, or (for the teacher) a range of pages, a chapter or the whole book.
   Many pages are printed by a copy of the book in a new window (index.html?print&from=…&to=…),
   so the book open here is left as it is. */
// (if index.html lost the panel, only printing is missing: the rest of the book still works)
if (!document.getElementById('ppWhat')) console.error('Print panel: #ppWhat is missing in index.html');
else {
  const pp = document.getElementById('printPanel');
  const what = document.getElementById('ppWhat');
  const from = document.getElementById('ppFrom');
  const to = document.getElementById('ppTo');
  const chapter = document.getElementById('ppChapter');
  const radio = v => pp.querySelector(`[name="ppRange"][value="${v}"]`);
  const range = () => pp.querySelector('[name="ppRange"]:checked').value;
  const atSpread = () => spreads[current].classList.contains('current');
  [from, to].forEach(inp => { inp.min = firstPage; inp.max = lastPage; inp.addEventListener('input', () => { radio('range').checked = true; }); });

  document.getElementById('printBtn').addEventListener('click', () => {
    what.hidden = !isTeacher();
    if (isTeacher()) {
      // the chapters with their pages: choosing one writes its pages in "from … to"
      chapter.innerHTML = '<option value="">… or choose a chapter</option>' + CHAPTERS
        .map(ch => ch.items.filter(canSee))
        .map((items, i) => items.length ? `<option value="${pagesOf(items[0])[0]}-${pagesOf(items.at(-1)).at(-1)}">${esc(CHAPTERS[i].title)} (p. ${pagesOf(items[0])[0]}–${pagesOf(items.at(-1)).at(-1)})</option>` : '')
        .join('');
      // every time: the two pages open now are chosen (or "Pages … to …" on the contents page)
      radio('spread').disabled = !atSpread();
      radio(atSpread() ? 'spread' : 'range').checked = true;
      chapter.value = '';
      if (atSpread()) [from.value, to.value] = [pagesOf(spreads[current])[0], pagesOf(spreads[current]).at(-1)];
    }
    pp.showModal();
  });
  chapter.addEventListener('change', () => {
    if (!chapter.value) return;
    [from.value, to.value] = chapter.value.split('-');
    radio('range').checked = true;
  });
  pp.querySelector('.pp-cancel').addEventListener('click', () => pp.close());
  pp.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
    const eco = b.dataset.mode === 'eco';
    const blank = document.getElementById('ppBlank').checked;
    // the two pages open now, with the answers: printed right here
    if (!isTeacher() || (range() === 'spread' && !blank)) {
      pp.close();
      document.body.classList.toggle('eco-print', eco);
      setTimeout(() => window.print(), 50);
      return;
    }
    let [a, z] = range() === 'all' ? [firstPage, lastPage]
      : range() === 'spread' ? [pagesOf(spreads[current])[0], pagesOf(spreads[current]).at(-1)]
      : [parseInt(from.value, 10), parseInt(to.value, 10)];
    if (!Number.isFinite(a) || !Number.isFinite(z)) { from.focus(); return; }
    if (a > z) [a, z] = [z, a];
    const q = new URLSearchParams({ print: '', from: a, to: z });
    if (eco) q.set('eco', '');
    if (blank) q.set('blank', '');
    if (document.getElementById('ppDuplex').checked) q.set('duplex', '');
    if (document.getElementById('ppFour').checked) q.set('four', '');
    pp.close();
    window.open(`${location.pathname}?${q}`, '_blank');
  }));
  window.addEventListener('afterprint', () => document.body.classList.remove('eco-print'));
}

/* the print copy: show only the pages asked for, add the blank pages, wait for pictures and fonts, print */
if (isPrintCopy) (async () => {
  document.body.classList.add('print-job');
  document.body.classList.toggle('eco-print', PRINT_JOB.has('eco'));
  const note = document.createElement('p');
  note.className = 'print-job-note';
  note.textContent = '🖨️ Preparing the pages to print…';
  document.body.prepend(note);

  // who is signed in decides which pages can be printed (cloud.js; at most a few seconds)
  await Promise.race([userReady, new Promise(r => setTimeout(r, 6000))]);
  const a = Number(PRINT_JOB.get('from')), z = Number(PRINT_JOB.get('to'));
  const pages = spreads.filter(canSee)
    .flatMap(s => [...s.querySelectorAll(':scope > .page')])
    .filter(p => +p.dataset.page >= a && +p.dataset.page <= z);
  if (!pages.length) { note.textContent = 'There are no pages to print here.'; return; }

  const blankSheet = () => Object.assign(document.createElement('div'), { className: 'print-pad' });
  let sheets = 0;
  const startSide = +pages[0].dataset.page % 2; // the first page is always on the front of the first sheet
  pages.forEach(p => {
    // double-sided: the pages keep their sides as in the book (a blank one only where a page is missing)
    if (PRINT_JOB.has('duplex') && sheets % 2 !== (+p.dataset.page - startSide) % 2) { p.before(blankSheet()); sheets++; }
    p.classList.add('print-on');
    p.closest('.spread').classList.add('print-on');
    sheets++;
  });
  if (PRINT_JOB.has('four')) while (sheets % 4) { pages.at(-1).after(blankSheet()); sheets++; }
  [...document.querySelectorAll('.page.print-on, .print-pad')].at(-1).classList.add('print-last'); // no empty sheet after it
  note.textContent = `🖨️ Preparing ${sheets} pages to print…`;

  // pictures far down the book are loaded only now that their pages are shown
  const imgs = pages.flatMap(p => [...p.querySelectorAll('img')]);
  imgs.forEach(img => { img.loading = 'eager'; });
  await Promise.all(imgs.map(img => (img.complete ? null : new Promise(r => { img.onload = img.onerror = r; }))));
  await document.fonts?.ready;
  redrawAllMatches();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.addEventListener('afterprint', () => window.close());
  window.print();
})();

/* "Clear answers": these pages or the whole book.
   #clearBtn is the "Whole book" button of the panel: the other scripts listen to its click. */
{
  const cp = document.getElementById('clearPanel');
  const pageBtn = document.getElementById('clearPageBtn');
  document.getElementById('clearMenuBtn').addEventListener('click', () => {
    pageBtn.disabled = !spreads.some(s => s.classList.contains('current'));
    cp.showModal();
  });
  cp.querySelector('.pp-cancel').addEventListener('click', () => cp.close());
  document.getElementById('clearBtn').addEventListener('click', () => cp.close());

  // the answers of the open spread: their key is the id of a box on it
  // (two keys are not ids: 'rj-role-<script id>' and 'home-game', shared by the home-… spreads)
  const onSpread = (k, spread) => {
    if (k === 'home-game') return spread.dataset.id.startsWith('home-');
    const el = document.getElementById(k) || document.getElementById(k.replace(/^rj-role-/, ''));
    return !!el && spread.contains(el);
  };
  pageBtn.addEventListener('click', async () => {
    const spread = spreads.find(s => s.classList.contains('current'));
    if (!spread) return;
    pageBtn.disabled = true;
    Object.keys(saved).forEach(k => { if (onSpread(k, spread)) delete saved[k]; });
    persist();
    await window.book.flush?.(); // cloud.js: send it before reloading
    location.reload(); // every box of the book is drawn again from what is saved
  });
}

document.getElementById('clearBtn').addEventListener('click', () => {
  saved = {};
  persist();
  inputs.forEach(inp => { inp.value = ''; inp.classList.remove('ok', 'no'); inp.closest('li')?.classList.remove('ok', 'no'); });
  matches.forEach(m => m.reset());
  tfs.forEach(tf => { tf.classList.remove('ok', 'no'); paintTf(tf); });
  underlinables.forEach(u => u.paint());
  aposWords.forEach(a => a.paint());
  document.querySelectorAll('.apos-list li').forEach(li => li.classList.remove('ok', 'no'));
  ticks.forEach(t => t.classList.remove('on'));
  toggles.forEach(t => t.classList.remove('on', 'ok', 'no'));
  mazes.forEach(m => m.reset());
  b5Totals();
  egTotal();
  slashables.forEach(sl => sl.reset());
  sorts.forEach(so => so.reset());
  flawRows.forEach(r => { r.paint(); });
  drawings.forEach(d => d.reset());
  marks.forEach(paintMark);
  rhymes.forEach(b => { b.classList.remove('ok', 'no'); paintRhyme(b); });
  syllableLines.forEach(s => s.paint());
  sonnetCounts.forEach(paint => paint());
  dragSets.forEach(d => d.reset());
});

/* ================= home page ================= */

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const range = (a, b) => (a === b ? `p. ${a}` : `p. ${a}–${b}`);

// a topic page in contents.js ('id', 'id:L', 'id:R' or [from, to]) → [first page, last page]
const topicPages = item => {
  if (Array.isArray(item)) return [PAGES.of(item[0]), PAGES.end(item[1] ?? item[0])];
  return [PAGES.of(item), PAGES.end(item)];
};

// a link to a page range ('' when the reader cannot open it)
function pageLink(a, b, label = '') {
  const text = label ? `<b>${range(a, b)}</b> ${esc(label)}` : range(a, b);
  const spread = spreads.find(s => { const [x, y] = pagesOf(s); return a >= x && a <= y; });
  if (!spread || !canSee(spread)) return ''; // the teacher has not opened it yet
  const off = !isVisible(spread) && !teacherOnly(spread) ? ' class="off" title="Hidden from students"' : '';
  return `<a href="#p${a}"${off}>${text}</a>`;
}

// topics shown under each chapter before the rest goes into a drop-down
const MAX_LINKS = 3;

function chapterCard(ch) {
  const color = esc(ch.color || '#f05f4b');
  const pic = ch.image ? `<span class="chapter-pic"><img src="${esc(ch.image)}" alt=""${ch.zoom ? ` style="--zoom:${+ch.zoom}${ch.dy ? `;--dy:${+ch.dy}%` : ""}"` : ''}></span>` : '';
  // not written yet: only the teacher sees it, to have the plan of the year in view
  if (!ch.items.length) {
    return isTeacher() ? `
      <article class="chapter chapter-soon" style="--c:${color}">
        <div class="chapter-cover">${pic}<span class="chapter-pages">coming soon</span><h3>${esc(ch.title)}</h3></div>
      </article>` : '';
  }
  const inside = ch.items.filter(canSee);
  if (!inside.length) return ''; // nothing opened in this chapter yet
  const links = inside.map(s => {
    const [a, b] = pagesOf(s);
    const c = ch.linkColors && ch.linkColors[s.dataset.id];
    return `<li${c ? ` style="--c:${esc(c)}"` : ''}>${pageLink(a, b, s.dataset.name || '')}</li>`;
  });
  const off = !ch.teacher && !inside.some(isVisible);
  return `
    <article class="chapter${off ? ' off' : ''}" data-ch="${esc(ch.title)}" style="--c:${color}">
      <a class="chapter-cover" href="#p${pagesOf(inside[0])[0]}">
        ${pic}
        <span class="chapter-pages">${range(pagesOf(ch.items[0])[0], pagesOf(ch.items.at(-1))[1])}</span>
        <h3>${esc(ch.title)}</h3>
      </a>
      <ul class="chapter-links">${links.slice(0, MAX_LINKS).join('')}</ul>
      ${links.length > MAX_LINKS ? `
      <details class="chapter-more">
        <summary>+ ${links.length - MAX_LINKS} more</summary>
        <ul class="chapter-links">${links.slice(MAX_LINKS).join('')}</ul>
      </details>` : ''}
    </article>`;
}

function renderHome() {
  // one block per school year (and the teacher's materials): a heading, then its chapters
  document.getElementById('chapterGrid').innerHTML = PARTS.map(part => {
    const cards = part.chapters.map(chapterCard).join('');
    return cards.trim() ? `<h3 class="part-h${part.teacher ? ' teacher' : ''}">${esc(part.title)}</h3>${cards}` : '';
  }).join('');

  renderTopics();
  renderToc();
}

/* ================= the index on the left ================= */
// On a wide screen it is open on the home page and closed on the pages (☰ Index or ✕ change that until the
// reader goes back home or to the pages); on a small screen ☰ opens it over the page.

const toc = document.getElementById('toc');
const tocBtn = document.getElementById('tocBtn');
const wide = matchMedia('(min-width: 1100px)');
const tocWanted = { home: true, pages: false }; // wide screen: open or closed, on the home page / on the pages
const tocPlace = () => (home.hidden ? 'pages' : 'home');

// which years and chapters are open: kept when the index is built again (login, visible pages)
let tocYearsClosed = new Set();
try { tocYearsClosed = new Set(JSON.parse(localStorage.getItem('toc-years-closed')) || []); } catch { /* ignore */ }
const tocChaptersOpen = new Set();

// each year has a colour of the book: coral, green, blue; the teacher's materials are navy
const YEAR_COLORS = ['#f05f4b', '#3aa04a', '#4aa8ec'];

function renderToc() {
  toc.innerHTML = `
    <div class="toc-head">
      <span class="toc-title">Index</span>
      <button type="button" class="toc-close" aria-label="Close the index" title="Close">✕</button>
    </div>`
    + PARTS.map((part, pi) => {
      const chapters = part.chapters.map(ch => {
        const inside = ch.items.filter(canSee);
        if (!inside.length) return '';
        const [a] = pagesOf(inside[0]);
        const [, b] = pagesOf(inside.at(-1));
        return `
        <details class="toc-ch" data-ch="${esc(ch.title)}" style="--c:${esc(ch.color || '#f05f4b')}"${tocChaptersOpen.has(ch.title) ? ' open' : ''}>
          <summary><i class="toc-dot"></i><span>${esc(ch.title)}</span><small>${a}–${b}</small></summary>
          <ul>${inside.map(s => {
            const [x, y] = pagesOf(s);
            const off = isVisible(s) || teacherOnly(s) ? '' : ' class="off" title="Hidden from students"';
            return `<li><a href="#p${x}" data-id="${esc(s.dataset.id)}"${off}><b>${x}–${y}</b><span>${esc(s.dataset.name || s.dataset.title || '')}</span></a></li>`;
          }).join('')}</ul>
        </details>`;
      }).join('');
      if (!chapters.trim()) return '';
      const color = part.teacher ? '#1f2a6b' : YEAR_COLORS[pi % YEAR_COLORS.length];
      const badge = part.teacher ? '🔒' : pi + 1;
      const [title, sub] = part.title.split(' · ');
      return `
      <details class="toc-year${part.teacher ? ' teacher' : ''}" data-year="${esc(part.title)}" style="--y:${color}"${tocYearsClosed.has(part.title) ? '' : ' open'}>
        <summary><b class="toc-badge">${badge}</b><span>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</span></summary>
        <div class="toc-chs">${chapters}</div>
      </details>`;
    }).join('');
  markToc();
}

// on the home page, a click on a chapter in the index also scrolls to its card
toc.addEventListener('click', e => {
  const sum = e.target.closest('.toc-ch > summary');
  if (!sum || home.hidden) return; // only on the home page
  const title = sum.parentElement.dataset.ch;
  const card = [...document.querySelectorAll('#chapterGrid .chapter[data-ch]')].find(a => a.dataset.ch === title);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  card.classList.remove('flash');
  void card.offsetWidth; // start the animation again
  card.classList.add('flash');
});

// remember what the reader opens and closes
toc.addEventListener('toggle', e => {
  const d = e.target;
  if (d.dataset.year) {
    if (d.open) tocYearsClosed.delete(d.dataset.year); else tocYearsClosed.add(d.dataset.year);
    try { localStorage.setItem('toc-years-closed', JSON.stringify([...tocYearsClosed])); } catch { /* ignore */ }
  } else if (d.dataset.ch) {
    if (d.open) tocChaptersOpen.add(d.dataset.ch); else tocChaptersOpen.delete(d.dataset.ch);
  }
}, true);

// the spread on screen is highlighted, and its chapter opened
function markToc() {
  const id = home.hidden ? spreads[current]?.dataset.id : null;
  toc.querySelectorAll('.here').forEach(el => el.classList.remove('here'));
  const a = id && toc.querySelector(`a[data-id="${CSS.escape(id)}"]`);
  if (!a) return;
  a.classList.add('here');
  const ch = a.closest('.toc-ch');
  const year = a.closest('.toc-year');
  ch.classList.add('here');
  year.classList.add('here');
  if (!year.open) year.open = true;
  if (!ch.open) ch.open = true;
  // keep it in view inside the index, without moving the page
  const r = a.getBoundingClientRect(), t = toc.getBoundingClientRect();
  if (r.top < t.top + 40 || r.bottom > t.bottom - 10) toc.scrollTop += r.top - t.top - t.height / 3;
}

function paintToc() {
  const open = wide.matches ? tocWanted[tocPlace()] : document.body.classList.contains('toc-over');
  document.body.classList.toggle('toc-open', open);
  tocBtn.setAttribute('aria-expanded', open);
}

tocBtn.addEventListener('click', () => {
  if (wide.matches) tocWanted[tocPlace()] = !tocWanted[tocPlace()];
  else document.body.classList.toggle('toc-over');
  paintToc();
  markToc();
});
toc.addEventListener('click', e => {
  if (e.target.closest('.toc-close') && wide.matches) tocWanted[tocPlace()] = false;
  else if (!e.target.closest('.toc-close, a')) return;
  document.body.classList.remove('toc-over'); // small screen: it closes after choosing a page
  paintToc();
});
wide.addEventListener('change', paintToc);
// the index starts just below the toolbar (which can take two lines)
const toolbar = document.querySelector('.toolbar');
new ResizeObserver(() => document.documentElement.style.setProperty('--tb', `${toolbar.offsetHeight}px`)).observe(toolbar);
document.addEventListener('spreadchange', () => { paintToc(); markToc(); });
paintToc();

// topics are listed only while something is typed in the search bar
function renderTopics() {
  const list = document.getElementById('topicList');
  const words = norm(document.getElementById('topicSearch').value).split(' ').filter(Boolean);
  if (!words.length) { list.innerHTML = ''; return; }
  const topics = (typeof CONTENTS === 'undefined' ? [] : CONTENTS.topics || []).filter(t => {
    // a word matches the title, or a number falls inside one of the pages
    const pages = t.pages.map(topicPages);
    return words.every(w => norm(t.title).includes(w) || (/^\d+$/.test(w) && pages.some(([a, b]) => +w >= a && +w <= b)));
  });
  const cards = topics.map(t => {
    const links = t.pages.map(topicPages).map(([a, b]) => pageLink(a, b)).join('');
    return links && `
    <article class="topic" style="--c:${esc(t.color || '#7b3fc4')}">
      <h3>${esc(t.title)}</h3>
      <div class="topic-pages">${links}</div>
    </article>`;
  }).filter(Boolean);
  list.innerHTML = cards.length ? cards.join('') : '<p class="topic-none">No topic found.</p>';
}
document.getElementById('topicSearch').addEventListener('input', renderTopics);

function updateContinueLink() {
  const link = document.getElementById('continueLink');
  let spread = null;
  try { spread = PAGES.spread(localStorage.getItem(KEY + ':spread')); } catch { /* ignore */ }
  link.hidden = !spread || !canSee(spread);
  if (!link.hidden) {
    const [last] = pagesOf(spread);
    link.href = `#p${last}`;
    link.textContent = `Continue from page ${last} →`;
  }
}

/* ================= account bar + teacher panel ================= */

const accountBtn = document.getElementById('accountBtn');
const teacherBtn = document.getElementById('teacherBtn');
const panel = document.getElementById('teacherPanel');
const SYNC_TEXT = { saving: '⏳ saving…', ok: '☁️ saved', error: '⚠️ not saved (offline?)' };

function paintAccount() {
  teacherBtn.hidden = !isTeacher();
  if (!account) {
    accountBtn.textContent = '👤 Sign in';
    accountBtn.title = 'Sign in with Google to keep your answers on every device';
    return;
  }
  const first = (account.name || '').split(' ')[0];
  accountBtn.textContent = `${first} · sign out`;
  accountBtn.title = `${account.email} ${SYNC_TEXT[syncState] || ''}`.trim();
}

accountBtn.addEventListener('click', () => {
  if (!account) window.book.signIn?.();
  else if (confirm('Sign out? Your answers stay saved in your account.')) window.book.signOut?.();
});

// something about who is signed in or what is visible changed
function refreshAccess() {
  paintAccount();
  renderHome();
  if (home.hidden && !canSee(spreads[current])) showHome();
  else updateContinueLink();
  hideClosedGames();
  syncPanel();
}

// game pills on the home page: hide the ones that start on a page students cannot open
function hideClosedGames() {
  document.querySelectorAll('#gameList .game-topic').forEach(d => {
    const links = [...d.querySelectorAll('a[href^="#p"]')];
    const open = links.some(a => {
      const n = parseFloat(a.getAttribute('href').slice(2));
      const s = spreads.find(x => { const [p, q] = pagesOf(x); return n >= p && n <= q; });
      return !s || canSee(s);
    });
    d.hidden = !open;
  });
}

/* the teacher's panel: tick the chapters and pages students can see */

// the chapters students can be given (the teacher's materials are not in the list)
function groups() {
  const list = CHAPTERS.filter(ch => !ch.teacher && ch.items.length)
    .map(ch => ({ title: ch.title, color: ch.color, items: ch.items }));
  const rest = spreads.filter(s => !chapterOf.has(s));
  if (rest.length) list.push({ title: 'Other pages', color: '#999', items: rest });
  return list;
}

function buildPanel() {
  const body = panel.querySelector('.tp-body');
  body.innerHTML = groups().map((g, gi) => `
    <fieldset class="tp-chapter" style="--c:${esc(g.color || '#f05f4b')}">
      <legend><label><input type="checkbox" class="tp-all" data-g="${gi}"> <b>${esc(g.title)}</b></label></legend>
      ${g.items.map(s => `
        <label class="tp-page"><input type="checkbox" class="tp-one" data-g="${gi}" value="${esc(s.dataset.id)}">
          <b>${range(...pagesOf(s))}</b> ${esc(s.dataset.name || s.dataset.title || '')}</label>`).join('')}
    </fieldset>`).join('') + '<p class="tp-help">🔒 The materials for the teacher (tests, exit tickets, cards to print) are never shown to students.</p>';
  syncPanel();
}

// show the current state in the boxes (the chapter box is "half ticked" when only some pages are)
function syncPanel() {
  panel.querySelectorAll('.tp-one').forEach(c => { c.checked = visibleSpreads.has(c.value); });
  panel.querySelectorAll('.tp-all').forEach(all => {
    const ones = [...panel.querySelectorAll(`.tp-one[data-g="${all.dataset.g}"]`)];
    const n = ones.filter(c => c.checked).length;
    all.checked = n === ones.length;
    all.indeterminate = n > 0 && n < ones.length;
  });
}

let saveTimer = null;
function savePanel() {
  const list = [...panel.querySelectorAll('.tp-one:checked')].map(c => c.value);
  const status = panel.querySelector('.tp-status');
  status.textContent = 'Saving…';
  window.book.setVisible(list);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try { await window.book.onSaveVisible(list); status.textContent = 'Saved ✓ Students see it right away.'; }
    catch (err) { status.textContent = 'Could not save: ' + err.message; }
  }, 300);
}

panel.addEventListener('change', e => {
  const c = e.target;
  if (c.classList.contains('tp-all')) {
    panel.querySelectorAll(`.tp-one[data-g="${c.dataset.g}"]`).forEach(o => { o.checked = c.checked; });
  } else if (!c.classList.contains('tp-one')) return;
  savePanel();
});
panel.querySelector('.tp-everything').addEventListener('click', () => {
  panel.querySelectorAll('.tp-one').forEach(c => { c.checked = true; });
  savePanel();
});
panel.querySelector('.tp-nothing').addEventListener('click', () => {
  panel.querySelectorAll('.tp-one').forEach(c => { c.checked = false; });
  savePanel();
});
panel.querySelector('.tp-close').addEventListener('click', () => panel.close());
teacherBtn.addEventListener('click', () => {
  if (!panel.querySelector('.tp-one')) buildPanel();
  panel.querySelector('.tp-status').textContent = '';
  panel.showModal();
});

/* ================= start ================= */

renderHome();
route();
paintAccount();
window.addEventListener('load', hideClosedGames); // the game pills are built by grammar-games.js, after this file
