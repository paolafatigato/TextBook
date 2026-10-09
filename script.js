// Page turning, saving what students write (in this browser),
// checking exercises and the "connect the words" activities.

const KEY = 'libro-u1l1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { saved = {}; }

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* storage unavailable */ }
}

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

function show(index) {
  current = Math.max(0, Math.min(spreads.length - 1, index));
  home.hidden = true;
  document.body.classList.remove('at-home');
  spreads.forEach((s, i) => s.classList.toggle('current', i === current));
  const [first] = pagesOf(spreads[current]);
  pageInput.value = first;
  spreadTitle.textContent = spreads[current].dataset.title;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === spreads.length - 1;
  history.replaceState(null, '', `#p${first}`);
  try { localStorage.setItem(KEY + ':page', first); } catch { /* ignore */ }
  window.scrollTo(0, 0);
  redrawAllMatches();
  document.dispatchEvent(new Event('spreadchange'));
}

function goToPage(n) {
  if (!Number.isFinite(n)) return;
  n = Math.max(firstPage, Math.min(lastPage, n));
  const i = spreads.findIndex(s => { const [a, b] = pagesOf(s); return n >= a && n <= b; });
  // a page that is not in the book yet: go to the closest spread before it
  show(i >= 0 ? i : spreads.findLastIndex(s => pagesOf(s)[0] <= n));
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
  const m = location.hash.match(/^#p(\d+)/);
  if (m) goToPage(parseInt(m[1], 10));
  else showHome();
}
window.addEventListener('hashchange', route);

prevBtn.addEventListener('click', () => show(current - 1));
nextBtn.addEventListener('click', () => show(current + 1));
document.getElementById('gotoForm').addEventListener('submit', e => {
  e.preventDefault();
  goToPage(parseInt(pageInput.value, 10));
  pageInput.blur();
});
document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea') || !home.hidden) return;
  if (e.key === 'ArrowLeft') show(current - 1);
  if (e.key === 'ArrowRight') show(current + 1);
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

/* ================= connect the words ================= */
// Click a word, then its meaning (or the other way round) to draw a line.
// Click a connected item again to remove its line.
// Three columns (p. 64): a .match-set holds the lists and two .match layers,
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

  function draw() {
    const base = box.getBoundingClientRect();
    if (!base.width) return; // spread not visible
    words.forEach(b => b.classList.toggle('linked-w', links.some(l => words[l[0]] === b)));
    defs.forEach(b => b.classList.toggle('linked-d', links.some(l => defs[l[1]] === b)));
    svg.innerHTML = links.map(([w, d]) => {
      const a = words[w].getBoundingClientRect();
      const b = defs[d].getBoundingClientRect();
      const dot = a.height * 0.3; // dot sits just outside each button
      const x1 = a.right - base.left + dot, y1 = a.top + a.height / 2 - base.top;
      const x2 = b.left - base.left - dot, y2 = b.top + b.height / 2 - base.top;
      const cls = checked ? (words[w].dataset.key === defs[d].dataset.key ? 'ok' : 'no') : '';
      return `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
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

  words.forEach((b, i) => b.addEventListener('click', e => pick('w', i, e)));
  defs.forEach((b, i) => b.addEventListener('click', e => pick('d', i, e)));

  return {
    id: box.id,
    root,
    unselect,
    draw,
    check() { checked = true; draw(); },
    reset() { links = fresh(); checked = false; unselect(); draw(); },
  };
});

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

document.querySelectorAll('.check[data-toggles]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.toggles).querySelectorAll('.toggle[data-should]').forEach(el => {
      const ok = el.classList.contains('on') === (el.dataset.should === '1');
      el.classList.remove('ok', 'no');
      el.classList.add(ok ? 'ok' : 'no');
    });
  });
});

/* the dice of the conversation game (pp. 34-35) lives in game.js */

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

/* ================= evaluation grid (p. 71) ================= */
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

/* ================= half-page flap (pp. 62-63) ================= */
// the flap hides the English words on one page or the other

document.querySelectorAll('.flap').forEach(flap => flap.addEventListener('click', () => {
  flap.closest('.spread').classList.toggle('flap-left');
}));

/* ================= detective games (pp. 42-47) ================= */

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

/* ================= toolbar ================= */

document.getElementById('printBtn').addEventListener('click', () => window.print());

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Clear all the answers in the book?')) return;
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
  b5Totals();
  egTotal();
  slashables.forEach(sl => sl.reset());
  sorts.forEach(so => so.reset());
  drawings.forEach(d => d.reset());
  marks.forEach(paintMark);
});

/* ================= home page ================= */

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const range = (a, b) => (a === b ? `p. ${a}` : `p. ${a}–${b}`);

// a link to a page range, or a grey "coming soon" label when the pages are not online yet
function pageLink(a, b, label = '') {
  const text = label ? `<b>${range(a, b)}</b> ${esc(label)}` : range(a, b);
  return a <= lastPage
    ? `<a href="#p${a}">${text}</a>`
    : `<span class="soon">${text} <i>coming soon</i></span>`;
}

function renderHome() {
  const { chapters = [] } = typeof CONTENTS === 'undefined' ? {} : CONTENTS;

  document.getElementById('chapterGrid').innerHTML = chapters.map(ch => {
    const [start, end] = ch.pages;
    const inside = spreads.filter(s => { const [a] = pagesOf(s); return a >= start && a <= end; });
    const links = inside.map(s => { const [a, b] = pagesOf(s); return `<li>${pageLink(a, b, s.dataset.name || '')}</li>`; });
    if (lastPage < end) links.push(`<li>${pageLink(Math.max(start, lastPage + 1), end)}</li>`);
    return `
      <article class="chapter" style="--c:${esc(ch.color || '#f05f4b')}">
        <a class="chapter-cover" href="#p${start}">
          ${ch.image ? `<img src="${esc(ch.image)}" alt="">` : ''}
          <span class="chapter-pages">${range(start, end)}</span>
          <h3>${esc(ch.title)}</h3>
        </a>
        <ul class="chapter-links">${links.join('')}</ul>
      </article>`;
  }).join('');

  renderTopics();
}

// topics are listed only while something is typed in the search bar
function renderTopics() {
  const list = document.getElementById('topicList');
  const words = norm(document.getElementById('topicSearch').value).split(' ').filter(Boolean);
  if (!words.length) { list.innerHTML = ''; return; }
  const topics = (typeof CONTENTS === 'undefined' ? [] : CONTENTS.topics || []).filter(t => {
    // a word matches the title, or a number falls inside one of the pages
    const pages = t.pages.map(([a, b]) => [a, b ?? a]);
    return words.every(w => norm(t.title).includes(w) || (/^\d+$/.test(w) && pages.some(([a, b]) => +w >= a && +w <= b)));
  });
  list.innerHTML = topics.length ? topics.map(t => `
    <article class="topic" style="--c:${esc(t.color || '#7b3fc4')}">
      <h3>${esc(t.title)}</h3>
      <div class="topic-pages">${t.pages.map(([a, b]) => pageLink(a, b ?? a)).join('')}</div>
    </article>`).join('') : '<p class="topic-none">No topic found.</p>';
}
document.getElementById('topicSearch').addEventListener('input', renderTopics);

function updateContinueLink() {
  const link = document.getElementById('continueLink');
  let last = NaN;
  try { last = parseInt(localStorage.getItem(KEY + ':page'), 10); } catch { /* ignore */ }
  link.hidden = !Number.isFinite(last);
  if (!link.hidden) {
    link.href = `#p${last}`;
    link.textContent = `Continue from page ${last} →`;
  }
}

/* ================= start ================= */

renderHome();
route();
