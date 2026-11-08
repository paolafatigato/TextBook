// Spoons: the cards to make and print (teacher only: spreads spoons-1, -2, -3, after the Bullshit cards).
// The words come from spoons-cards.js (SPOON_DATA): 5 word classes with the same number of cards each.
// The sheets are made like the Grammar Poker deck (poker-deck.css: .pd-sheet, .pd-card, .pd-cut, the controls);
// what the teacher chose is kept in this browser.

(() => {
  const D = typeof SPOON_DATA === 'undefined' ? null : SPOON_DATA;
  const sp1 = document.querySelector('[data-id="spoons-1"]');
  if (!D || !sp1) return;
  const views = [...document.querySelectorAll('[data-id^="spoons-"] [data-words]')];

  const KEY = 'libro-spoons-deck';
  const SIZES = {
    poker: { name: 'Poker · 63 × 88 mm', w: 63, h: 88, cols: 3, rows: 3 },
    small: { name: 'Small · 47 × 66 mm', w: 47, h: 66, cols: 4, rows: 4 },
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const DEFAULTS = { cls: Object.keys(D.classes), level: 'all', off: [], size: 'poker', gap: 1, backs: false, copies: 1, seed: 0 };
  let st = { ...DEFAULTS };
  try { st = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { /* no storage: the defaults */ }
  if (!SIZES[st.size]) st.size = DEFAULTS.size;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* not saved */ } };

  const cards = D.cards.map((c, i) => ({ ...c, i }));
  // why a card is not in the deck: '' = it is in
  const outBy = c => (!st.cls.includes(c.cls) ? 'cls' : st.level !== 'all' && String(c.level) !== st.level ? 'level' : st.off.includes(c.i) ? 'off' : '');

  // the same "random" order until the teacher shuffles again (seed 0 = the order of the list)
  function mixed(list) {
    if (!st.seed) return list;
    let a = st.seed >>> 0;
    const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const r = list.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  }
  const deck = () => mixed(cards.filter(c => !outBy(c)));

  /* ---------- one card ---------- */
  const sizeClass = w => (w.length <= 4 ? '' : w.length <= 6 ? 's2' : w.length <= 7 ? 's3' : 's4');
  // the colour is only decoration and has nothing to do with the kind of word: the pupils must recognize it
  const PALETTE = ['#e8503c', '#2f6fd6', '#2e9e5b', '#8e2de2', '#c98a00', '#d6458f', '#1596a8', '#6b8e23'];
  const colorOf = c => PALETTE[(c.i * 5 + Math.floor(c.i / 7)) % PALETTE.length];
  function cardHTML(c) {
    return `<div class="pd-card sd-card" style="--c:${colorOf(c)}">
      <span class="pd-g" aria-hidden="true">🥄</span>
      <span class="pd-w ${sizeClass(c.w)}">${esc(c.w)}</span>
      <span class="pd-g br" aria-hidden="true">🥄</span></div>`;
  }
  const backHTML = () => `<div class="pd-card sd-card back"><div class="sd-bk"><b>🥄</b><span>Spoons</span></div></div>`;

  /* ---------- the sheets (as in bullshit-deck.js) ---------- */
  const allCards = () => Array.from({ length: Math.max(1, st.copies) }, deck).flat();
  const perSheet = () => SIZES[st.size].cols * SIZES[st.size].rows;
  const sheetCount = () => Math.ceil(allCards().length / perSheet());

  function sheetHTML(n, back) {
    const z = SIZES[st.size], g = st.gap;
    const all = allCards(), first = n * perSheet();
    const items = all.slice(first, first + perSheet());
    const gw = z.cols * z.w + (z.cols - 1) * g, gh = z.rows * z.h + (z.rows - 1) * g;
    const x0 = (210 - gw) / 2, y0 = (297 - gh) / 2;
    const mm = v => `calc(var(--mm) * ${+v.toFixed(2)})`;
    const cells = items.map((c, k) => {
      const r = Math.floor(k / z.cols);
      const col = back ? z.cols - 1 - (k % z.cols) : k % z.cols;
      return `<div style="position:absolute;left:${mm(x0 + col * (z.w + g))};top:${mm(y0 + r * (z.h + g))}">${back ? backHTML() : cardHTML(c)}</div>`;
    }).join('');
    const xs = [x0, ...Array.from({ length: z.cols - 1 }, (_, k) => x0 + (k + 1) * (z.w + g) - g / 2), x0 + gw];
    const ys = [y0, ...Array.from({ length: z.rows - 1 }, (_, k) => y0 + (k + 1) * (z.h + g) - g / 2), y0 + gh];
    const t = 0.2;
    const ticks = [
      ...xs.flatMap(x => [[x - t / 2, y0 - 5.5, t, 3], [x - t / 2, y0 + gh + 2.5, t, 3]]),
      ...ys.flatMap(y => [[x0 - 5.5, y - t / 2, 3, t], [x0 + gw + 2.5, y - t / 2, 3, t]]),
    ].map(([x, y, w, h]) => `<i class="pd-cut" style="left:${mm(x)};top:${mm(y)};width:${mm(w)};height:${mm(h)}"></i>`).join('');
    return `<div class="pd-sheet sd-sheet" data-size="${st.size}"><span class="pd-no">Spoons · sheet ${n + 1} of ${sheetCount()} · ${back ? 'backs' : 'fronts'}</span>${ticks}${cells}</div>`;
  }
  const allSheets = () => Array.from({ length: sheetCount() }, (_, n) => sheetHTML(n, false) + (st.backs ? sheetHTML(n, true) : '')).join('');

  /* ---------- the window that prints ---------- */
  function printDeck() {
    if (!deck().length) { alert('The deck is empty: choose some cards first.'); return; }
    const w = window.open('', '_blank');
    if (!w) { alert('Allow pop-ups for this site to print the cards.'); return; }
    const css = ['poker-deck.css', 'spoons-deck.css'].map(f => `<link rel="stylesheet" href="${new URL(f, location.href).href}">`).join('');
    const sheets = sheetCount() * (st.backs ? 2 : 1);
    w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Spoons</title>
      <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
      ${css}</head>
      <body class="pd-print"><div class="pd-bar"><button type="button" onclick="print()">🖨️ Print</button>
      <span>${sheets} A4 sheet${sheets === 1 ? '' : 's'}${st.backs ? ' (fronts and backs: print double-sided, flip on the long edge)' : ''}. Print at 100% / “Actual size”, not “Fit to page”.</span></div>
      ${allSheets()}</body></html>`);
    w.document.close();
    w.focus();
  }

  /* ---------- page 1: the controls, and the sheet as it will be printed ---------- */
  const left = sp1.querySelector('.pd-controls');
  const right = sp1.querySelector('.pd-prev');
  let shown = 0, showBacks = false;
  const seg = (name, items) => `<span class="pd-seg" data-seg="${name}">${items.map(([v, t]) => `<button type="button" data-v="${v}" class="${String(st[name]) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</span>`;

  function paintControls() {
    left.innerHTML = `
      <h2>1 · Choose the cards</h2>
      <div class="sd-cats">${Object.entries(D.classes).map(([k, c]) => `<button type="button" data-cls="${k}" class="${st.cls.includes(k) ? 'on' : ''}" style="--c:${c.color}">${esc(c.name)} <small>${cards.filter(x => x.cls === k).length}</small></button>`).join('')}</div>
      <div class="pd-opt"><span>Level</span>${seg('level', [['all', 'all'], ['1', 'easy'], ['2', 'harder']])}</div>
      <p class="sd-note">The colours of the cards are random and the kind of word is not written on them: the pupils must recognize it. Every kind of word has the same number of cards, so every kind of set is equally easy to make. If you take a kind out, take out the others in the same way.</p>
      <h2>2 · Take words out <small>(if you want)</small></h2>
      <p>On the next page click a word to take it out of the deck or to put it back.</p>
      <p class="pd-count"></p>
      <h2>3 · The sheets</h2>
      <div class="pd-opt"><span>Size</span>${seg('size', Object.entries(SIZES).map(([k, z]) => [k, `${z.name} · ${z.cols * z.rows} per sheet`]))}</div>
      <div class="pd-opt"><span>Space between</span>${seg('gap', [[0, 'none'], [1, '1 mm'], [2, '2 mm']])}</div>
      <div class="pd-opt"><span>Backs</span><label><input type="checkbox" data-opt="backs" ${st.backs ? 'checked' : ''}> a sheet of backs behind each sheet</label></div>
      <div class="pd-opt"><span>Decks</span><input type="number" min="1" max="12" value="${st.copies}" data-opt="copies" aria-label="Number of decks"><small>one for each group</small></div>
      <div class="pd-actions"><button type="button" class="pd-btn go" data-act="print">🖨️ Print the cards</button><button type="button" class="pd-btn" data-act="mix">🔀 ${st.seed ? 'Shuffle again' : 'Shuffle'}</button>${st.seed ? '<button type="button" class="pd-btn" data-act="order">↺ Original order</button>' : ''}<button type="button" class="pd-btn" data-act="all">👁 Put back all the cards</button></div>
      <p class="pd-tip">The cards touch (or almost): cut once along each line with the knife and a ruler. For a double-sided print, flip the sheet on the <b>long edge</b>.</p>`;
    paintCount();
  }

  function paintCount() {
    const d = deck().length, n = d * Math.max(1, st.copies), sh = sheetCount();
    // 4 cards for each player, and at least 8 cards left to draw from
    const players = Math.max(0, Math.floor((n - 8) / 4));
    left.querySelector('.pd-count').textContent = d
      ? `${d} cards${st.copies > 1 ? ` × ${st.copies} decks = ${n} cards` : ''} → ${sh} sheet${sh === 1 ? '' : 's'}${st.backs ? ` + ${sh} of backs` : ''}. Enough for ${players ? `up to ${players} players per group` : 'nobody: add some cards'}.`
      : 'The deck is empty: choose some cards.';
  }

  function paintPreview() {
    const sh = sheetCount();
    if (shown >= sh) shown = Math.max(0, sh - 1);
    if (!st.backs) showBacks = false;
    right.innerHTML = `
      <h2>The sheet <small>as it will be printed</small></h2>
      <div class="pd-nav"><button type="button" data-nav="-1" ${shown <= 0 ? 'disabled' : ''} aria-label="Previous sheet">◀</button>
        <span>Sheet ${sh ? shown + 1 : 0} of ${sh}</span>
        <button type="button" data-nav="1" ${shown >= sh - 1 ? 'disabled' : ''} aria-label="Next sheet">▶</button>
        ${st.backs ? `<button type="button" data-nav="back">${showBacks ? 'Show the fronts' : 'Show the backs'}</button>` : ''}</div>
      ${sh ? sheetHTML(shown, showBacks) : '<p>No cards.</p>'}`;
  }

  /* ---------- the next page: all the words, to take out or put back ---------- */
  const WHY = { cls: 'not in the kinds you chose', level: 'another level', off: 'taken out' };
  function paintLists() {
    views.forEach(v => {
      v.innerHTML = v.dataset.words.split(' ').map(k => {
        const cl = D.classes[k], mine = cards.filter(c => c.cls === k);
        return `<section class="sd-list" style="--c:${cl.color}"><h3>${esc(cl.name)} <small>· ${mine.filter(c => !outBy(c)).length} of ${mine.length} in the deck</small></h3>
          <div>${mine.map(c => {
            const why = outBy(c);
            return `<button type="button" data-i="${c.i}" class="${why ? `out ${why}` : ''}" aria-pressed="${!why}" title="${why ? esc(WHY[why]) : 'in the deck: click to take it out'}">${esc(c.w)} <small>${c.level === 1 ? 'easy' : 'harder'}</small></button>`;
          }).join('')}</div></section>`;
      }).join('');
    });
  }

  const refresh = () => { save(); paintControls(); paintPreview(); paintLists(); };

  /* ---------- what the teacher does ---------- */
  sp1.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.cls) {
      const k = b.dataset.cls;
      st.cls = st.cls.includes(k) ? st.cls.filter(x => x !== k) : [...st.cls, k];
      return refresh();
    }
    if (b.dataset.act === 'all') { st.off = []; return refresh(); }
    if (b.dataset.act === 'mix') { st.seed = 1 + Math.floor(Math.random() * 2 ** 31); return refresh(); }
    if (b.dataset.act === 'order') { st.seed = 0; return refresh(); }
    if (b.dataset.act === 'print') return printDeck();
    const sg = b.closest('[data-seg]');
    if (sg) { st[sg.dataset.seg] = sg.dataset.seg === 'level' || isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; return refresh(); }
    if (b.dataset.nav === 'back') { showBacks = !showBacks; return paintPreview(); }
    if (b.dataset.nav) { shown += +b.dataset.nav; return paintPreview(); }
  });
  sp1.addEventListener('change', e => {
    const o = e.target.dataset.opt;
    if (!o) return;
    st[o] = o === 'copies' ? Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 1)) : e.target.checked;
    refresh();
  });
  views.forEach(v => v.addEventListener('click', e => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    const c = cards[+b.dataset.i], why = outBy(c);
    if (why && why !== 'off') { alert(`This card is out: ${WHY[why]}. Change the choices on the first page to put it back.`); return; }
    st.off = st.off.includes(c.i) ? st.off.filter(x => x !== c.i) : [...st.off, c.i];
    refresh();
  }));

  refresh();
})();
