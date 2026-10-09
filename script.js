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
// Three columns (p. 48): a .match-set holds the lists and two .match layers,
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

/* ================= dice ================= */

const diceBtn = document.getElementById('diceBtn');
const diceFace = document.getElementById('diceFace');
diceBtn?.addEventListener('click', () => {
  const n = 1 + Math.floor(Math.random() * 6);
  diceFace.textContent = '⚀⚁⚂⚃⚄⚅'[n - 1] + ' ' + n;
  diceFace.classList.remove('roll');
  void diceFace.offsetWidth; // restart the animation
  diceFace.classList.add('roll');
});

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

/* ================= half-page flap (p. 46-47) ================= */
// the flap hides the English words on one page or the other

document.querySelectorAll('.flap').forEach(flap => flap.addEventListener('click', () => {
  flap.closest('.spread').classList.toggle('flap-left');
}));

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
  const { chapters = [], topics = [] } = typeof CONTENTS === 'undefined' ? {} : CONTENTS;

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

  document.getElementById('topicList').innerHTML = topics.map(t => `
    <article class="topic" style="--c:${esc(t.color || '#7b3fc4')}">
      <h3>${esc(t.title)}</h3>
      <div class="topic-pages">${t.pages.map(([a, b]) => pageLink(a, b ?? a)).join('')}</div>
    </article>`).join('');
}

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
