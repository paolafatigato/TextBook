// Grammar Poker: the deck to see and print (teacher only: spreads pokerdeck-1, -2, -3 at the end of the book).
// The cards come from poker-cards.js (GP_DATA): change a word there and the deck changes here.
// The cards are printed on A4 sheets, one next to the other (a gap of 0-2 mm), so that a single cut along each line is enough.
// What the teacher chose (level, cards taken out, sizes) is kept in this browser.

(() => {
  const D = typeof GP_DATA === 'undefined' ? null : GP_DATA;
  const sp1 = document.querySelector('[data-id="pokerdeck-1"]');
  const sp2 = document.querySelector('[data-id="pokerdeck-2"]');
  const sp3 = document.querySelector('[data-id="pokerdeck-3"]');
  if (!D || !sp1 || !sp2 || !sp3) return;

  const KEY = 'libro-poker-deck';
  const SIZES = {
    poker: { name: 'Poker · 63 × 88 mm', w: 63, h: 88, cols: 3, rows: 3 },
    small: { name: 'Small · 47 × 66 mm', w: 47, h: 66, cols: 4, rows: 4 },
  };
  const LEVEL_COLORS = ['#3b9ae0', '#8e2de2', '#f05f4b'];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const DEFAULTS = { off: [], size: 'poker', gap: 1, labels: true, dots: true, backs: false, copies: 1 };
  let st = { ...DEFAULTS };
  try { st = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { /* no storage: the defaults */ }
  if (!SIZES[st.size]) st.size = DEFAULTS.size;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* not saved */ } };

  const cards = D.cards.map((c, i) => ({ ...c, i }));
  const isOn = c => !st.off.includes(c.i);
  const deck = () => cards.filter(isOn);

  /* ---------- one card ---------- */
  const caption = c => {
    const l = D.subtypes[c.suit][c.subtype];
    return c.suit === 'verb' ? `${l} · ${c.person === '3rd' ? '3rd person' : 'other persons'}` : l;
  };
  const sizeClass = w => (w.length <= 4 ? '' : w.length <= 6 ? 's2' : w.length <= 8 ? 's3' : 's4');
  function cardHTML(c, tag = 'div', extra = '') {
    const s = D.suits[c.suit];
    return `<${tag} class="pd-card ${extra}" style="--c:${s.color}"${tag === 'button' ? ` type="button" data-i="${c.i}" aria-pressed="${isOn(c)}" aria-label="${esc(c.word)}, ${esc(caption(c))}"` : ''}>
      <i class="pd-g">${s.symbol}</i><b class="pd-w ${sizeClass(c.word)}">${esc(c.word)}</b><small class="pd-t">${esc(caption(c))}</small>
      <span class="pd-lv" aria-hidden="true">${'<i></i>'.repeat(c.level)}</span><i class="pd-g br">${s.symbol}</i></${tag}>`;
  }
  const backHTML = () => `<div class="pd-card back" style="--c:#fff"><div class="pd-bk"><b>${Object.values(D.suits).map(s => `<i>${s.symbol}</i>`).join('')}</b><span>Grammar<br>Poker</span></div></div>`;

  /* ---------- the sheets ---------- */
  // every card of every copy, in the order of the deck (copies one after the other)
  const allCards = () => Array.from({ length: Math.max(1, st.copies) }, deck).flat();
  const perSheet = () => SIZES[st.size].cols * SIZES[st.size].rows;
  const sheetCount = () => Math.ceil(allCards().length / perSheet());

  // the sheet n (0-based): fronts, or backs (in the mirrored place: the sheet is turned on the long edge)
  function sheetHTML(n, back) {
    const z = SIZES[st.size], g = st.gap;
    const items = allCards().slice(n * perSheet(), (n + 1) * perSheet());
    const gw = z.cols * z.w + (z.cols - 1) * g, gh = z.rows * z.h + (z.rows - 1) * g;
    const x0 = (210 - gw) / 2, y0 = (297 - gh) / 2;
    const mm = v => `calc(var(--mm) * ${+v.toFixed(2)})`;
    const cells = items.map((c, k) => {
      const r = Math.floor(k / z.cols);
      const col = back ? z.cols - 1 - (k % z.cols) : k % z.cols;
      return `<div style="position:absolute;left:${mm(x0 + col * (z.w + g))};top:${mm(y0 + r * (z.h + g))}">${back ? backHTML() : cardHTML(c)}</div>`;
    }).join('');
    // the lines to cut: small ticks outside the cards, in the middle of each gap
    const xs = [x0, ...Array.from({ length: z.cols - 1 }, (_, k) => x0 + (k + 1) * (z.w + g) - g / 2), x0 + gw];
    const ys = [y0, ...Array.from({ length: z.rows - 1 }, (_, k) => y0 + (k + 1) * (z.h + g) - g / 2), y0 + gh];
    const t = 0.2;
    const ticks = [
      ...xs.flatMap(x => [[x - t / 2, y0 - 5.5, t, 3], [x - t / 2, y0 + gh + 2.5, t, 3]]),
      ...ys.flatMap(y => [[x0 - 5.5, y - t / 2, 3, t], [x0 + gw + 2.5, y - t / 2, 3, t]]),
    ].map(([x, y, w, h]) => `<i class="pd-cut" style="left:${mm(x)};top:${mm(y)};width:${mm(w)};height:${mm(h)}"></i>`).join('');
    const cls = `pd-sheet${st.labels ? '' : ' no-labels'}${st.dots ? '' : ' no-dots'}`;
    return `<div class="${cls}"><span class="pd-no">Grammar Poker · sheet ${n + 1} of ${sheetCount()} · ${back ? 'backs' : 'fronts'}</span>${ticks}${cells}</div>`;
  }
  function allSheets() {
    return Array.from({ length: sheetCount() }, (_, n) => sheetHTML(n, false) + (st.backs ? sheetHTML(n, true) : '')).join('');
  }

  /* ---------- the window that prints ---------- */
  function printDeck() {
    if (!deck().length) { alert('The deck is empty: put some cards back first.'); return; }
    const w = window.open('', '_blank');
    if (!w) { alert('Allow pop-ups for this site to print the cards.'); return; }
    const css = new URL('poker-deck.css', location.href).href;
    const sheets = sheetCount() * (st.backs ? 2 : 1);
    w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Grammar Poker cards</title>
      <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="${css}"></head>
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
  const levelOf = () => {
    const l = D.levels.find(l => cards.every(c => isOn(c) === (c.level <= l.maxCardLevel)));
    return l ? l.id : 0;
  };

  function paintControls() {
    const lv = levelOf();
    left.innerHTML = `
      <h2>1 · Choose the level</h2>
      <div class="pd-levels">${D.levels.map((l, k) => `<button type="button" data-level="${l.id}" class="${lv === l.id ? 'on' : ''}" style="--k:${LEVEL_COLORS[k % 3]}"><b>${esc(l.name)} · ${cards.filter(c => c.level <= l.maxCardLevel).length} cards</b><small>${esc(l.title)}: ${esc(l.text)}</small></button>`).join('')}</div>
      <h2>2 · Take cards out <small>(if you want)</small></h2>
      <p>On the next pages click a card to take it out of the deck or to put it back. ${lv ? '' : '<b>Your own deck.</b>'}</p>
      <p class="pd-count"></p>
      <h2>3 · The sheets</h2>
      <div class="pd-opt"><span>Size</span>${seg('size', Object.entries(SIZES).map(([k, z]) => [k, `${z.name} · ${z.cols * z.rows} per sheet`]))}</div>
      <div class="pd-opt"><span>Space between</span>${seg('gap', [[0, 'none'], [1, '1 mm'], [2, '2 mm']])}<small>1 mm: one cut in the middle</small></div>
      <div class="pd-opt"><span>On the cards</span><label><input type="checkbox" data-opt="labels" ${st.labels ? 'checked' : ''}> small captions</label><label><input type="checkbox" data-opt="dots" ${st.dots ? 'checked' : ''}> ● level dots</label></div>
      <div class="pd-opt"><span>Backs</span><label><input type="checkbox" data-opt="backs" ${st.backs ? 'checked' : ''}> a sheet of backs behind each sheet</label></div>
      <div class="pd-opt"><span>Decks</span><input type="number" min="1" max="12" value="${st.copies}" data-opt="copies" aria-label="Number of decks"><small>one for each group</small></div>
      <div class="pd-actions"><button type="button" class="pd-btn go" data-act="print">🖨️ Print the cards</button><button type="button" class="pd-btn" data-act="all">👁 Show the whole deck again</button></div>
      <p class="pd-tip">The cards touch (or almost): cut once along each line with the knife and a ruler. The little ticks outside the cards show where to cut. For a double-sided print, flip the sheet on the <b>long edge</b>.</p>`;
    paintCount();
  }

  function paintCount() {
    const d = deck(), by = Object.entries(D.suits).map(([k, s]) => `${s.symbol} ${d.filter(c => c.suit === k).length}`).join(' · ');
    const n = d.length * Math.max(1, st.copies), sh = sheetCount();
    const el = left.querySelector('.pd-count');
    el.textContent = d.length
      ? `${d.length} cards (${by})${st.copies > 1 ? ` × ${st.copies} decks = ${n} cards` : ''} → ${sh} sheet${sh === 1 ? '' : 's'}${st.backs ? ` + ${sh} of backs` : ''}.`
      : 'The deck is empty.';
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

  /* ---------- pages 2 and 3: all the cards, to see and to take out ---------- */
  const suitKeys = Object.keys(D.suits);
  const holders = [...sp2.querySelectorAll('[data-suit]'), ...sp3.querySelectorAll('[data-suit]')];
  function paintCards() {
    holders.forEach(h => {
      const k = h.dataset.suit, s = D.suits[k], mine = cards.filter(c => c.suit === k);
      const title = h.closest('.pd-in').querySelector('.pd-suit-title');
      title.innerHTML = `<i style="color:${s.color}">${s.symbol}</i> ${esc(s.name)} <small>· ${mine.filter(isOn).length} of ${mine.length} in the deck</small>`;
      h.className = `pd-view${st.labels ? '' : ' no-labels'}${st.dots ? '' : ' no-dots'}`;
      h.innerHTML = mine.map(c => cardHTML(c, 'button', isOn(c) ? '' : 'off')).join('');
    });
  }

  const refresh = () => { save(); paintControls(); paintPreview(); paintCards(); };
  suitKeys.forEach(k => { if (!holders.some(h => h.dataset.suit === k)) console.error(`Poker deck: no place for the suit "${k}"`); });

  /* ---------- what the teacher does ---------- */
  sp1.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.level) {
      const max = D.levels.find(l => l.id === +b.dataset.level).maxCardLevel;
      st.off = cards.filter(c => c.level > max).map(c => c.i);
      return refresh();
    }
    if (b.dataset.act === 'all') { st.off = []; return refresh(); }
    if (b.dataset.act === 'print') return printDeck();
    const sg = b.closest('[data-seg]');
    if (sg) { st[sg.dataset.seg] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; return refresh(); }
    if (b.dataset.nav === 'back') { showBacks = !showBacks; return paintPreview(); }
    if (b.dataset.nav) { shown += +b.dataset.nav; return paintPreview(); }
  });
  sp1.addEventListener('change', e => {
    const o = e.target.dataset.opt;
    if (!o) return;
    st[o] = o === 'copies' ? Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 1)) : e.target.checked;
    refresh();
  });
  [sp2, sp3].forEach(sp => sp.addEventListener('click', e => {
    const b = e.target.closest('.pd-card');
    if (!b) return;
    const i = +b.dataset.i;
    st.off = st.off.includes(i) ? st.off.filter(x => x !== i) : [...st.off, i];
    refresh();
  }));

  refresh();
})();
