// Printable games on pages of their own: index.html?sheet=<key> (the links of games/index.html).
// Each page shows all the games of one kind (all the Murdoku, all the crosswords…) and nothing else:
// the other exercises of the book page, the exercise numbers and the page numbers are taken away.
// A bar has "All games", "Open in the textbook" and "Print".
// These pages are open to everybody, also the ones of the teacher's part: only the games listed here.
// Nothing written here is saved (script.js treats it like a print copy).
(() => {
  'use strict';
  const key = new URLSearchParams(location.search).get('sheet');
  if (key === null) return;

  const each = (name, n) => Array.from({ length: n }, (_, i) => `${name}-${i + 1}`);
  const el = (tag, cls, html, style) => {
    const e = document.createElement(tag);
    e.className = cls;
    e.innerHTML = html;
    if (style) e.style.cssText = style;
    return e;
  };
  // an element placed as in the book: x, y and width in % of the page width
  const at = (x, y, w) => `--x:${x};--y:${y};--w:${w}`;
  const place = (e, vars) => e && Object.entries(vars).forEach(([k, v]) => e.style.setProperty(`--${k}`, v));
  // keep only these children of a page
  const keep = (page, selector) => [...page.children].forEach(c => { if (!c.matches(selector)) c.remove(); });

  /* ---------- how some pages become "only the game" ---------- */
  // the maze alone, in the middle of the page, with its instructions
  const maze = page => {
    keep(page, '.mz, .mz-label, [data-maze]');
    const box = page.querySelector('.mz');
    const [start, finish] = page.querySelectorAll('.mz-label');
    page.prepend(
      el('h1', 'abs gs-h', 'Possessive maze', at(5, 24, 90)),
      el('p', 'abs gs-p', 'Follow the story to find the way out. Begin at <b>START</b> and draw your path box by box until <b>FINISH</b>. You cannot cross a wall. Look carefully at <b>my, your, his, her, our</b> and <b>their</b>!', at(10, 36, 80)),
    );
    place(start, { x: 5.6, y: 55 });
    place(box, { x: 5, y: 58.5, w: 90, h: 45.6 });
    place(finish, { x: 73, y: 105.5 });
    place(page.querySelector('[data-maze]'), { x: 43, y: 112 });
  };
  // the jobs word search, moved down to the middle of the page
  const jobSearch = page => {
    keep(page, '.jb-note, .jb-h2, .jb-lab, .jb-ws-score, .jb-ws, .jb-ws-words');
    [...page.querySelectorAll('.jb-lab')].slice(1).forEach(e => e.remove());
    [...page.children].forEach(e => place(e, { y: parseFloat(e.style.getPropertyValue('--y')) + 28 }));
  };
  const emotionsCrossword = page => {
    page.querySelector('.em-cwbox')?.before(el('p', 'gs-p', 'Read the clues and write the words in the squares.'));
  };
  const fashionLeft = page => {
    page.querySelector('.cl-flow')?.remove();
    page.append(el('div', 'abs gs-mid', '<h1 class="gs-h">Fashion show board game</h1><p class="gs-p">A game for 2–4 players. You need a die and one counter each.</p>', at(15, 52, 80)));
  };
  const fashionRight = page => {
    page.querySelector('.cl-flow')?.remove();
    page.append(el('div', 'abs gs-mid', `<h2 class="gs-h2">How to play</h2><ol class="gs-ol">
      <li>Put your counters on <b>START</b>. Roll the die and move.</li>
      <li><b>Picture:</b> say a sentence about it with <b>am / is / are + -ing</b>.</li>
      <li><b>?</b> Take a question card and answer.</li>
      <li><b>Go forward / go back:</b> move your counter.</li>
      <li>The first player on <b>FINISH</b> wins.</li></ol>`, at(8, 40, 70)));
  };
  // the Murdoku cases: the "write one more clue" exercise goes
  const oneMoreClue = page => page.querySelectorAll('.mk-line').forEach(input => {
    input.previousElementSibling?.remove();
    input.remove();
  });

  // the dress-up game: only the game, without "Describe your model"
  const dressWords = page => {
    page.querySelector('.cl-lines')?.remove();
    page.querySelector('.du-start')?.remove();
    [...page.querySelectorAll('.cl-pill')].slice(1).forEach(e => e.remove());
    page.append(el('div', 'abs gs-mid', `<h2 class="gs-h2">How to play</h2><ol class="gs-ol">
      <li>Write the word under a picture to unlock the clothes.</li>
      <li>Drag them onto the model.</li>
      <li>Say what your model is wearing: <b>My model is wearing…</b></li></ol>`, at(12, 99, 76)));
  };
  // the paper clothes: a title and instructions above the drawings (the drawings are only made a bit smaller)
  const paperClothes = page => {
    const box = page.querySelector('.scf-in');
    box.querySelector('img').style.height = '117cqw';
    const first = page.classList.contains('page-left');
    box.prepend(
      el('h1', 'gs-h', first ? 'Dress the model!' : 'Your model', 'font-size:5cqw'),
      el('p', 'gs-p', first ? 'Color the clothes and cut them out.' : 'Cut out the model, dress it and say: <b>My model is wearing…</b>', 'margin-bottom:1.5cqw'),
    );
  };

  // pages: [spread, or "spread:L" / "spread:R", what to do with the page]
  const SHEETS = {
    'mazes': { title: 'Mazes', pages: [['own-mistakes:R', maze]] },
    'murdoku': { title: 'Murdoku', pages: [['mk-intro:L'], ['mk-intro:R', oneMoreClue], ['mk-party:L', oneMoreClue], ['mk-party:R'], ['mk-create:R']] },
    'crosswords': { title: 'Crosswords', pages: [['clothes-wearing:R'], ['emo-puzzle:L', emotionsCrossword]] },
    'word-searches': { title: 'Word searches', pages: [['jobs-vocab:R', jobSearch], ['wh-final:L']] },
    'routine-race': { title: 'Daily routine race', pages: [['ps-clil-race'], ['print-ps-clil-cards']] },
    'fashion-board': { title: 'Fashion board game', pages: [['clothes-pc-practice:L', fashionLeft], ['clothes-pc-practice:R', fashionRight], ['scaf-clothes-board-cards']] },
    'bingo': { title: 'Bingo', pages: [...each('bingo-class', 10), ...each('bingo-holiday', 6)].map(id => [id]) },
    'dress-up': { title: 'Dress the model', pages: [['clothes-dress:L', dressWords], ['clothes-dress:R'], ['clothes-dress2:L', dressWords], ['clothes-dress2:R']] },
    'paper-clothes': { title: 'Paper clothes: dress the model', pages: [['print-clothes-paper', paperClothes]] },
    'spoons': { title: 'Spoons', pages: each('spoons', 2).map(id => [id]) },
    'bullshit': { title: 'Bullshit cards', pages: each('bsdeck', 3).map(id => [id]) },
    'poker-deck': { title: 'Grammar Poker deck', pages: each('pokerdeck', 3).map(id => [id]) },
    'mime-cards': { title: 'Mime cards', pages: each('mimecards', 4).map(id => [id]) },
  };
  const sheet = Object.hasOwn(SHEETS, key) ? SHEETS[key] : null;

  const shown = [], pages = [];
  (sheet?.pages || []).forEach(([ref, prepare]) => {
    const [id, side] = ref.split(':');
    const spread = PAGES.spread(id);
    if (!spread) { console.error(`Sheet "${key}": no spread called "${id}"`); return; }
    const all = [...spread.querySelectorAll(':scope > .page')];
    const wanted = (side ? [all[side === 'R' ? 1 : 0]] : all).filter(Boolean);
    spread.classList.add('sheet-on');
    wanted.forEach(p => { p.classList.add('sheet-page'); pages.push({ page: p, prepare }); });
    shown.push(ref);
  });
  // no empty sheet of paper after the last page (last as the book has them, not as listed here)
  [...document.querySelectorAll('.page.sheet-page')].at(-1)?.classList.add('sheet-last');

  document.body.classList.add('game-sheet');
  document.title = `${sheet ? sheet.title : 'Game not found'} · Printable game | English Textbook`;

  // back to the part of the games page the sheet comes from
  const home = key === 'dress-up' ? 'digital'
    : ['mazes', 'murdoku', 'crosswords', 'word-searches', 'paper-clothes'].includes(key) ? 'printable' : 'teacher-printable';
  const bar = document.createElement('nav');
  bar.className = 'sheet-bar';
  bar.setAttribute('aria-label', 'Printable game');
  bar.innerHTML = `<a href="games/#${home}">← All games</a>
    <strong></strong>
    <span class="sheet-actions">${shown.length ? `<a href="#" data-book>📖 Open in the textbook</a>
    <button type="button">🖨️ Print</button>` : '<a href="index.html">📖 Open the textbook</a>'}</span>`;
  bar.querySelector('strong').textContent = sheet ? sheet.title : 'This game does not exist';
  if (shown.length) bar.querySelector('[data-book]').href = `index.html#s=${shown[0]}`;
  // a deck of cards has its own button, which opens the sheets of cards: "Print" does the same
  bar.querySelector('button')?.addEventListener('click', () => {
    const deck = document.querySelector('.sheet-on [data-act="print"]');
    if (deck) deck.click(); else window.print();
  });
  document.body.prepend(bar);

  // the dress-up game is played on screen: the two pages side by side, one day at a time
  // (no "Print" in the bar: the page has "Print my model")
  if (key === 'dress-up') {
    document.body.classList.add('game-play');
    bar.querySelector('button')?.remove();
    const days = [['clothes-dress', 'A casual day'], ['clothes-dress2', 'A fancy party']];
    const tabs = el('div', 'sheet-tabs', days.map(([, name]) => `<button type="button">${name}</button>`).join(''));
    const choose = n => {
      days.forEach(([id], i) => PAGES.spread(id)?.classList.toggle('sheet-on', i === n));
      [...tabs.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === n)));
      bar.querySelector('[data-book]').href = `index.html#s=${days[n][0]}`;
    };
    [...tabs.children].forEach((b, i) => b.addEventListener('click', () => choose(i)));
    bar.after(tabs);
    choose(0);
  }

  // after "load": the scripts of the games have drawn their boards and cards
  // (no "spreadchange": it would open the pop-ups that belong to these pages in the book)
  window.addEventListener('load', () => setTimeout(() => {
    // pictures far down the book are lazy: these ones are needed now (only now: a missing one calls a
    // function of the game's script to show its emoji instead)
    pages.forEach(({ page }) => page.querySelectorAll('img').forEach(img => { img.loading = 'eager'; }));
    // one that failed before that script was there gets its emoji now
    pages.forEach(({ page }) => page.querySelectorAll('img[onerror]').forEach(img => { if (img.complete && !img.naturalWidth) img.dispatchEvent(new Event('error')); }));
    pages.forEach(({ page, prepare }) => {
      prepare?.(page);
      // no exercise numbers (4.14, 7.2…)
      page.querySelectorAll('b, i.n').forEach(n => { if (/^\d+\.\d+$/.test(n.textContent.trim())) n.remove(); });
    });
    if (typeof redrawAllMatches === 'function') redrawAllMatches();
  }, 100));
})();
