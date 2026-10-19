// Sports & Hobbies ([sp-talents … sp-wrapup]).
// 1. The shapes of the chapter (daisy, sparkle, wobbly blob): drawn once in a hidden sprite, the pages use them with <use href="#sp-…">.
// 2. The games that can only be played on the computer. They have NO page (a printed book could not use them):
//    they open in a pop-up (like the Future games), from the "game corner" buttons at the bottom of
//    [sp-talents:R] (Mime charades), [sp-superhero:R] (Superpower workshop), [sp-vocab:L] (Memory pairs, Word search) and [sp-like:R] (Sports Day race), and from the pill "Sports & Hobbies"
//    of the Games list on the home page. A button with data-sph="race" opens that game, data-sph="" the menu.
// Only the best results and the words found in the word search are kept, in `saved` (script.js).

(() => {
  /* ================= 1 · the shapes ================= */
  const petals = [0, 1, 2, 3, 4].map(k => {
    const a = (k * 72 - 90) * Math.PI / 180;
    return `<circle cx="${(50 + 27 * Math.cos(a)).toFixed(1)}" cy="${(50 + 27 * Math.sin(a)).toFixed(1)}" r="21"/>`;
  }).join('');
  const blob = Array.from({ length: 96 }, (_, i) => {
    const a = i / 96 * Math.PI * 2, r = 39 + 4.6 * Math.sin(a * 8);
    return `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
  });
  const sprite = document.createElement('div');
  sprite.setAttribute('aria-hidden', 'true');
  sprite.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  sprite.innerHTML = `<svg width="0" height="0" xmlns="http://www.w3.org/2000/svg">
    <symbol id="sp-flower" viewBox="0 0 100 100"><g fill="currentColor">${petals}</g><circle cx="50" cy="50" r="13" fill="#fff6f3"/></symbol>
    <symbol id="sp-spark" viewBox="0 0 100 100"><path fill="currentColor" d="M50 0C54 34 66 46 100 50C66 54 54 66 50 100C46 66 34 54 0 50C34 46 46 34 50 0Z"/></symbol>
    <symbol id="sp-blob" viewBox="0 0 100 100"><path fill="currentColor" d="M${blob.join('L')}Z"/></symbol>
  </svg>`;
  document.body.append(sprite);

  const $ = id => document.getElementById(id);
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const store = (k, v) => { try { saved[k] = v; persist(); } catch { /* script.js not ready: skip */ } };
  const recall = k => { try { return saved[k]; } catch { return undefined; } };

  /* ================= 2 · the pop-up ================= */
  const INFO = {
    charades: { icon: '🎭', name: 'Mime charades', text: 'One pupil mimes, the class guesses. Easy, medium, hard or a mix of levels.' },
    workshop: { icon: '🦸', name: 'Superpower workshop', text: 'Start from something you can really do… and press ×1000 to make a superpower!' },
    race: { icon: '🏁', name: 'Sports Day race', text: 'Answer fast and run: can, -ing, love / like / hate, play / go / do. Beat the robots!' },
    memory: { icon: '🧠', name: 'Memory pairs', text: 'Turn two cards: find the picture and its word.' },
    search: { icon: '🔍', name: 'Word search', text: 'Find 8 hobby words hidden in the grid.' },
  };
  const ORDER = Object.keys(INFO);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="gq-overlay sph-modal" id="sphModal" role="dialog" aria-modal="true" aria-labelledby="sphTitle" hidden>
      <div class="gq-box">
        <div class="gq-top">
          <button type="button" class="gq-back" id="sphBack" hidden>← Menu</button>
          <span class="gq-title" id="sphTitle"></span>
          <span class="gq-score" id="sphScore"></span>
          <button type="button" class="gq-close" id="sphClose" aria-label="Close">✕</button>
        </div>
        <div class="gq-area" id="sphArea"></div>
      </div>
    </div>`);
  const modal = $('sphModal');
  const area = $('sphArea');
  const setScore = s => { $('sphScore').textContent = s === null ? '' : s; };

  // every timer of a game, so it can be stopped when the player leaves
  let timers = [];
  const later = (f, ms) => timers.push(setTimeout(f, ms));
  const stop = () => { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; };

  function showMenu() {
    stop();
    $('sphBack').hidden = true;
    $('sphTitle').textContent = '⚽ Sports & Hobbies games';
    setScore(null);
    area.innerHTML = `<p class="gq-menu-intro">Play on your own: choose a game!</p><div class="gq-menu">${ORDER.map(id => `
      <button type="button" class="gq-game" data-play="${id}"><i>${INFO[id].icon}</i><span><b>${INFO[id].name}</b>${INFO[id].text}</span></button>`).join('')}</div>`;
  }

  function play(id) {
    stop();
    $('sphBack').hidden = false;
    $('sphTitle').textContent = `${INFO[id].icon} ${INFO[id].name}`;
    setScore(null);
    GAMES[id]();
    modal.querySelector('.gq-box').scrollTop = 0;
  }

  function open(id) {
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    id ? play(id) : showMenu();
    $('sphClose').focus();
  }

  function close() {
    stop();
    modal.hidden = true;
    document.documentElement.classList.remove('gq-open');
  }

  area.addEventListener('click', e => {
    const b = e.target.closest('[data-play], [data-menu]');
    if (!b) return;
    if (b.dataset.menu !== undefined) showMenu();
    else play(b.dataset.play);
  });
  $('sphBack').addEventListener('click', showMenu);
  $('sphClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  // while the pop-up is open the arrow keys must not turn the book's pages
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);
  document.querySelectorAll('[data-sph]').forEach(b => b.addEventListener('click', () => open(b.dataset.sph)));

  /* ================= 3 · Sports Day race ================= */
  const blank = '<u>&nbsp;&nbsp;&nbsp;</u>';
  // can / can't: 1 = can, 0 = can't
  const CAN = [
    ['A fish', 'swim', 1], ['A dog', 'drive a car', 0], ['A cat', 'climb trees', 1], ['Penguins', 'fly', 0],
    ['Birds', 'sing', 1], ['A baby', 'ride a bike', 0], ['A snake', 'run', 0], ['Parrots', 'talk', 1],
    ['A cow', 'climb trees', 0], ['Kangaroos', 'jump very high', 1], ['Whales', 'walk', 0], ['Bats', 'fly', 1],
    ['Monkeys', 'climb', 1], ['Elephants', 'swim', 1],
  ].map(([s, v, c]) => ({ tag: 'can / can\'t', html: `${s} ${blank} ${v}.`, choices: ['can', 'can\'t'], answer: c ? 'can' : 'can\'t' }));

  // the -ing form: base, right, two wrong
  const ING = [
    ['dance', 'dancing', 'danceing', 'dancring'], ['run', 'running', 'runing', 'runeing'], ['swim', 'swimming', 'swiming', 'swimeing'],
    ['bake', 'baking', 'bakeing', 'bakking'], ['ride', 'riding', 'rideing', 'ridding'], ['shop', 'shopping', 'shoping', 'shopeing'],
    ['play', 'playing', 'plaiing', 'playying'], ['write', 'writing', 'writeing', 'writting'], ['skate', 'skating', 'skateing', 'skatting'],
    ['get', 'getting', 'geting', 'geteing'], ['hike', 'hiking', 'hikeing', 'hikking'], ['sit', 'sitting', 'siting', 'siteing'],
  ];
  const FRAMES = ['I love', 'She hates', 'We like', 'He loves', 'They don\'t mind', 'My dad likes', 'Do you like'];
  const ingQuestions = () => ING.map(([b, r, w1, w2]) => {
    const f = FRAMES[Math.floor(Math.random() * FRAMES.length)];
    return { tag: 'the -ing form', html: `${f} ${blank}${f === 'Do you like' ? '?' : '.'}<small>(${b})</small>`, choices: [r, w1, w2], answer: r };
  });

  // love, like, hate
  const LIKE = [
    ['Tom ' + blank + ' playing chess. He loves it!', ['loves', 'love', 'loving'], 'loves'],
    ['They ' + blank + ' cleaning. They always say “Yuck!”', ['hate', 'hates', 'hating'], 'hate'],
    ['I ' + blank + ' like running.', ['don\'t', 'doesn\'t', 'not'], 'don\'t'],
    ['She ' + blank + ' like skating.', ['doesn\'t', 'don\'t', 'isn\'t'], 'doesn\'t'],
    ['Mia loves ' + blank + ' comics.', ['drawing', 'draw', 'draws'], 'drawing'],
    ['We don\'t mind ' + blank + ' the dishes.', ['washing', 'wash', 'washs'], 'washing'],
    ['My brother ' + blank + ' swimming. He goes every day.', ['loves', 'love', 'loving'], 'loves'],
    ['Do you like ' + blank + ' video games?', ['playing', 'play', 'plays'], 'playing'],
    ['He ' + blank + ' getting up early. He is always tired.', ['hates', 'hate', 'hating'], 'hates'],
    ['My parents ' + blank + ' cooking. They cook every night.', ['love', 'loves', 'loving'], 'love'],
  ].map(([html, choices, answer]) => ({ tag: 'love, like, hate', html, choices, answer }));

  // play, go, do
  const PGD = [
    ['tennis', 'play'], ['yoga', 'do'], ['skiing', 'go'], ['chess', 'play'], ['karate', 'do'], ['hiking', 'go'],
    ['the guitar', 'play'], ['gymnastics', 'do'], ['cycling', 'go'], ['volleyball', 'play'], ['judo', 'do'],
    ['fishing', 'go'], ['basketball', 'play'], ['puzzles', 'do'], ['skating', 'go'],
  ].map(([w, v]) => ({ tag: 'play · go · do', html: `I ${blank} ${w} every week.`, choices: ['play', 'go', 'do'], answer: v }));

  const GOAL = 10;
  // ms between two steps of a robot: [min, max] (Tom is the slowest)
  const PACE = { slow: [5400, 8600], normal: [3600, 6000], fast: [2500, 4200] };
  let speed = 'normal';

  function raceGame() {
    area.innerHTML = `<div class="gq-card">
      <div class="spg-bar"><span>Robots: <span class="spg-speed" id="sgSpeed"><button type="button" data-s="slow">🐢 slow</button><button type="button" data-s="normal">🚶 normal</button><button type="button" data-s="fast">🚀 fast</button></span></span><span class="grow"></span><span>Steps: <output id="sgSteps">0 / ${GOAL}</output></span></div>
      <div class="spg-track">
        <div class="spg-lane you"><b>You</b><span class="spg-runner" id="sgRun-you">🏃</span></div>
        <div class="spg-lane"><b>Rita</b><span class="spg-runner" id="sgRun-rita">🐇</span></div>
        <div class="spg-lane"><b>Tom</b><span class="spg-runner" id="sgRun-tom">🐢</span></div>
      </div>
      <div class="spg-q" id="sgQ"><span class="tag">Get ready</span><p class="ask">Press <u>Start</u> and run! 🏃‍♀️</p></div>
      <div class="gq-row"><button type="button" class="gq-btn" id="sgGo">▶ Start the race</button></div>
      <p class="gq-instr" id="sgBest" style="margin:10px 0 0"></p></div>`;
    const lanes = { you: $('sgRun-you'), rita: $('sgRun-rita'), tom: $('sgRun-tom') };
    const WHO = { you: 'You', rita: 'Rita', tom: 'Tom' };
    const qBox = $('sgQ'), goBtn = $('sgGo');
    let running = false, locked = false, deck = [], steps, t0 = 0, cur = null;
    const move = k => lanes[k].style.setProperty('--p', Math.min(steps[k], GOAL) / GOAL);
    const reset = () => {
      steps = { you: 0, rita: 0, tom: 0 };
      Object.keys(lanes).forEach(k => { move(k); lanes[k].parentElement.classList.remove('win'); });
      $('sgSteps').textContent = `0 / ${GOAL}`;
    };
    const paintBest = () => {
      const b = parseFloat(recall('sp-race-best'));
      $('sgBest').textContent = b ? `🏆 Your best time: ${b.toFixed(0)} seconds` : '';
    };
    const paintSpeed = () => area.querySelectorAll('#sgSpeed button').forEach(x => x.classList.toggle('on', x.dataset.s === speed));

    function nextQ() {
      if (!running) return;
      if (!deck.length) deck = shuffle([...CAN, ...ingQuestions(), ...LIKE, ...PGD]);
      cur = deck.pop();
      locked = false;
      qBox.innerHTML = `<span class="tag">${cur.tag}</span><p class="ask">${cur.html}</p><div class="gq-choices"></div><p class="gq-fb"></p>`;
      const box = qBox.querySelector('.gq-choices');
      shuffle(cur.choices).forEach(c => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'gq-choice'; b.textContent = c;
        b.addEventListener('click', () => answer(b));
        box.append(b);
      });
    }

    function answer(btn) {
      if (!running || locked) return;
      locked = true;
      const fb = qBox.querySelector('.gq-fb');
      if (btn.textContent === cur.answer) {
        btn.classList.add('c-ok');
        steps.you++; move('you'); $('sgSteps').textContent = `${steps.you} / ${GOAL}`;
        fb.innerHTML = `<span class="ok">${['✓ Great!', '✓ Yes!', '✓ Go go go!', '✓ Perfect!'][Math.floor(Math.random() * 4)]}</span>`;
        if (steps.you >= GOAL) return finish('you');
        later(nextQ, 550);
      } else {
        btn.classList.add('c-fail');
        [...qBox.querySelectorAll('.gq-choice')].find(b => b.textContent === cur.answer)?.classList.add('c-ok');
        fb.innerHTML = `<span class="no">Not this time. It's “${cur.answer}”.</span>`;
        later(nextQ, 1500);
      }
    }

    function botStep(k, mult) {
      const [lo, hi] = PACE[speed];
      later(() => {
        if (!running) return;
        steps[k]++; move(k);
        if (steps[k] >= GOAL) return finish(k);
        botStep(k, mult);
      }, (lo + Math.random() * (hi - lo)) * mult);
    }

    function finish(winner) {
      running = false; stop();
      goBtn.textContent = '▶ Play again';
      lanes[winner].parentElement.classList.add('win');
      const secs = (Date.now() - t0) / 1000;
      const order = Object.keys(steps).sort((a, b) => steps[b] - steps[a] || (a === winner ? -1 : 0));
      let msg;
      if (winner === 'you') {
        msg = '🏆 You win!';
        const best = parseFloat(recall('sp-race-best'));
        if (!best || secs < best) { store('sp-race-best', String(secs)); paintBest(); }
      } else msg = `${WHO[winner]} wins… you are ${['1st', '2nd', '3rd'][order.indexOf('you')]}. Try again!`;
      qBox.innerHTML = `<span class="tag">Finish!</span><p class="spg-result">${msg}</p><p class="gq-instr">You took ${secs.toFixed(0)} seconds and ${steps.you} steps.</p>`;
    }

    goBtn.addEventListener('click', () => {
      if (running) {
        running = false; stop();
        goBtn.textContent = '▶ Start the race';
        qBox.innerHTML = '<span class="tag">Stopped</span><p class="ask">Press <u>Start</u> and run! 🏃‍♀️</p>';
        return;
      }
      stop(); reset(); deck = [];
      running = true; t0 = Date.now();
      goBtn.textContent = '■ Stop';
      botStep('rita', 1); botStep('tom', 1.25);
      nextQ();
    });
    area.querySelectorAll('#sgSpeed button').forEach(b => b.addEventListener('click', () => { speed = b.dataset.s; paintSpeed(); }));
    reset(); paintBest(); paintSpeed();
  }

  /* ================= 4 · Memory pairs ================= */
  const ITEMS = [
    ['⚽', 'soccer'], ['🏀', 'basketball'], ['🎾', 'tennis'], ['🏐', 'volleyball'], ['🏊', 'swimming'], ['🚴', 'cycling'],
    ['⛸️', 'skating'], ['🥋', 'karate'], ['🧘', 'yoga'], ['🎸', 'guitar'], ['🎨', 'painting'], ['🍳', 'cooking'],
    ['📚', 'reading'], ['🎮', 'video games'], ['💃', 'dancing'], ['📷', 'photography'], ['♟️', 'chess'], ['🎤', 'singing'],
  ];
  const PAIRS = 6;

  function memoryGame() {
    area.innerHTML = `<div class="gq-card">
      <div class="spg-bar"><span>Moves: <output id="sgMoves">0</output></span><span>Pairs: <output id="sgPairs">0 / ${PAIRS}</output></span><span class="grow"></span><button type="button" class="gq-btn alt" id="sgNew" style="padding:6px 16px;font-size:14px">🔀 New cards</button></div>
      <div class="spg-mem" id="sgMem"></div>
      <p class="spg-result" id="sgWin" style="text-align:center;min-height:36px;margin:12px 0 0"></p>
      <p class="gq-instr" id="sgBestM" style="margin:6px 0 0"></p></div>`;
    const mem = $('sgMem');
    let moves, found, first, busy;
    const paintBest = () => {
      const b = parseInt(recall('sp-mem-best'), 10);
      $('sgBestM').textContent = b ? `🏆 Your best: ${b} moves` : 'Say the word aloud every time you turn a card!';
    };

    function deal() {
      stop();
      moves = 0; found = 0; first = null; busy = false;
      $('sgMoves').textContent = '0'; $('sgPairs').textContent = `0 / ${PAIRS}`; $('sgWin').textContent = '';
      const cards = shuffle(shuffle(ITEMS).slice(0, PAIRS).flatMap(([e, w], i) => [{ i, pic: true, t: e }, { i, pic: false, t: w }]));
      mem.innerHTML = '';
      cards.forEach(c => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'spg-card3d';
        b.innerHTML = `<span class="back">✦</span><span class="front${c.pic ? ' pic' : ''}">${c.t}</span>`;
        b.addEventListener('click', () => flip(b, c));
        mem.append(b);
      });
    }

    function flip(b, c) {
      if (busy || b.classList.contains('open') || b.classList.contains('done')) return;
      b.classList.add('open');
      if (!first) { first = { b, c }; return; }
      moves++; $('sgMoves').textContent = moves;
      const a = first; first = null;
      if (a.c.i === c.i && a.c.pic !== c.pic) {
        [a.b, b].forEach(x => { x.classList.remove('open'); x.classList.add('done'); });
        found++; $('sgPairs').textContent = `${found} / ${PAIRS}`;
        if (found === PAIRS) {
          const best = parseInt(recall('sp-mem-best'), 10);
          if (!best || moves < best) store('sp-mem-best', String(moves));
          $('sgWin').textContent = `🎉 All pairs in ${moves} moves!`;
          paintBest();
        }
      } else {
        busy = true;
        [a.b, b].forEach(x => x.classList.add('wrong'));
        later(() => { [a.b, b].forEach(x => x.classList.remove('open', 'wrong')); busy = false; }, 950);
      }
    }

    $('sgNew').addEventListener('click', deal);
    deal(); paintBest();
  }

  /* ================= 5 · Word search ================= */
  const N = 10;
  const WORDS = [['SWIM', '🏊'], ['DANCE', '💃'], ['CHESS', '♟️'], ['SKATE', '⛸️'], ['GUITAR', '🎸'], ['COOK', '🍳'], ['DRAW', '🎨'], ['HIKE', '🥾']];
  // the grid is always the same: a small random generator with a fixed seed
  const grid = (() => {
    let seed = 2026;
    const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
    const cells = Array(N * N).fill('');
    const place = {};   // word → its cells
    WORDS.map(w => w[0]).sort((a, b) => b.length - a.length).forEach(word => {
      for (let tries = 0; tries < 500; tries++) {
        const [dx, dy] = DIRS[Math.floor(rnd() * DIRS.length)];
        const x0 = Math.floor(rnd() * N), y0 = Math.floor(rnd() * N);
        const x1 = x0 + dx * (word.length - 1), y1 = y0 + dy * (word.length - 1);
        if (x1 < 0 || x1 >= N || y1 < 0 || y1 >= N) continue;
        const path = [...word].map((ch, i) => ({ ch, at: (y0 + dy * i) * N + x0 + dx * i }));
        if (path.some(({ ch, at }) => cells[at] && cells[at] !== ch)) continue;
        path.forEach(({ ch, at }) => { cells[at] = ch; });
        place[word] = path.map(p => p.at);
        return;
      }
      console.error('Word search: no room for', word);
    });
    const LETTERS = 'ABCDEFGHILMNOPRSTUVW';
    for (let i = 0; i < cells.length; i++) if (!cells[i]) cells[i] = LETTERS[Math.floor(rnd() * LETTERS.length)];
    return { cells, place };
  })();

  function searchGame() {
    area.innerHTML = `<div class="gq-card">
      <p class="gq-instr">Find the <span>8 words</span>: across, down or diagonally. Tap the <span>first</span> letter, then the <span>last</span> one.</p>
      <div class="spg-ws" id="sgWs"></div>
      <ul class="spg-words" id="sgWords">${WORDS.map(([w, e]) => `<li data-w="${w}">${e} ${w.toLowerCase()}</li>`).join('')}</ul>
      <div class="spg-bar" style="margin:12px 0 0"><span>Found: <output id="sgCount">0 / ${WORDS.length}</output></span><span class="grow"></span><button type="button" class="gq-btn alt" id="sgHint" style="padding:6px 16px;font-size:14px">💡 Show me a first letter</button></div>
      <p class="spg-result" id="sgSWin" style="text-align:center;min-height:36px;margin:8px 0 0"></p></div>`;
    const ws = $('sgWs');
    const SHADES = ['', 'b', 'c', 'd'];
    let start = null;
    const btns = grid.cells.map((ch, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = ch; b.setAttribute('aria-label', `Row ${Math.floor(i / N) + 1}, column ${i % N + 1}: ${ch}`);
      b.addEventListener('click', () => pick(i));
      ws.append(b);
      return b;
    });
    const foundSet = () => { try { return new Set(JSON.parse(recall('sp-ws') || '[]')); } catch { return new Set(); } };

    function paint() {
      const got = foundSet();
      btns.forEach(b => { b.className = ''; });
      WORDS.forEach(([w], k) => {
        const on = got.has(w);
        area.querySelector(`[data-w="${w}"]`).classList.toggle('got', on);
        if (on) grid.place[w].forEach(at => btns[at].classList.add('found', ...(SHADES[k % 4] ? [SHADES[k % 4]] : [])));
      });
      if (start !== null) btns[start].classList.add('start');
      $('sgCount').textContent = `${got.size} / ${WORDS.length}`;
      $('sgSWin').textContent = got.size === WORDS.length ? '🎉 You found them all!' : '';
    }

    function pick(i) {
      if (start === null) { start = i; return paint(); }
      if (start === i) { start = null; return paint(); }
      const dx = i % N - start % N, dy = Math.floor(i / N) - Math.floor(start / N);
      const len = Math.max(Math.abs(dx), Math.abs(dy)) + 1;
      if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
        const sx = Math.sign(dx), sy = Math.sign(dy);
        const at = Array.from({ length: len }, (_, k) => (Math.floor(start / N) + sy * k) * N + start % N + sx * k);
        const text = at.map(a => grid.cells[a]).join('');
        const hit = WORDS.map(w => w[0]).find(w => w === text || w === [...text].reverse().join(''));
        if (hit) { const got = foundSet(); got.add(hit); store('sp-ws', JSON.stringify([...got])); }
      }
      start = null;
      paint();
    }

    $('sgHint').addEventListener('click', () => {
      const got = foundSet();
      const w = WORDS.map(x => x[0]).find(x => !got.has(x));
      if (!w) return;
      btns[grid.place[w][0]].classList.add('start');
      later(paint, 1600);
    });
    paint();
  }

  /* ================= Mime charades ================= */
  // One pupil mimes the card, the class guesses. The teacher chooses the levels (one, two or all: "mix"),
  // the time for each mime and the number of teams. The card stays hidden until the mimer taps "Show the card".
  const LEVELS = {
    easy: { name: 'Easy', stars: '⭐', text: 'one action or sport' },
    medium: { name: 'Medium', stars: '⭐⭐', text: 'action + object, more to mime' },
    hard: { name: 'Hard', stars: '⭐⭐⭐', text: 'a whole scene!' },
  };
  const MIMES = {
    easy: [
      'swim', 'run', 'jump', 'dance', 'sing', 'cook', 'read', 'draw', 'paint', 'ski', 'skate', 'fish', 'sleep', 'laugh',
      'climb', 'play soccer', 'play tennis', 'play basketball', 'play volleyball', 'play the guitar', 'play the piano',
      'ride a bike', 'drive a car', 'take a photo', 'do karate', 'do yoga', 'brush your teeth', 'knit', 'surf', 'box',
    ],
    medium: [
      'cook lasagna', 'bake a cake', 'paint a picture', 'play video games', 'walk the dog', 'iron a shirt', 'clean your room',
      'wash the dishes', 'ride a horse', 'play chess', 'play the drums', 'take a selfie', 'do gymnastics', 'knit a scarf',
      'fix a bike', 'plant a flower', 'build a sandcastle', 'shoot a basket', 'serve in tennis', 'catch a fish', 'dive into a pool',
      'sing in the shower', 'do a cartwheel', 'make a pizza', 'play the violin', 'go hiking', 'row a boat', 'throw a javelin',
    ],
    hard: [
      'play soccer in the rain', 'ski down a mountain with no poles', 'cook spaghetti and burn it', 'ride a bike with no hands',
      'swim with a shark', 'walk the dog while it runs away', 'bake a cake and drop it on the floor', 'play tennis with a very heavy racket',
      'do yoga on a moving train', 'take a selfie with a lion', 'play video games at 3 a.m. and fall asleep', 'run a marathon in flip-flops',
      'learn to skate and fall down', 'play the guitar for a crowd and forget the song', 'paint a portrait of a very angry cat',
      'go hiking and see a bear', 'catch a huge fish that pulls you into the water', 'dance with somebody who can\'t dance',
      'cook lasagna for twenty people', 'play basketball with a very tall giant', 'surf a giant wave and lose your board',
      'ride a horse that doesn\'t want to move', 'play chess against a robot and lose', 'row a boat in a storm',
    ],
  };
  const chSet = { levels: new Set(['easy', 'medium', 'hard']), time: 0, teams: 1 };

  function charadesGame() {
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const every = (f, ms) => timers.push(setInterval(f, ms));

    function setup() {
      stop();
      setScore(null);
      const lvBtn = k => `<button type="button" data-lv="${k}" class="${chSet.levels.has(k) ? 'on' : ''}">${LEVELS[k].stars} ${LEVELS[k].name}<small>${MIMES[k].length} cards</small></button>`;
      const opt = (attr, list, cur) => list.map(([v, t]) => `<button type="button" data-${attr}="${v}" class="${v === cur ? 'on' : ''}">${t}</button>`).join('');
      area.innerHTML = `<div class="gq-card">
        <p class="gq-instr">One pupil <span>mimes</span> the card without speaking, the others <span>guess</span>. Choose the levels: one, two or all of them (<em>mix</em>)!</p>
        <p class="spg-lab">Levels</p>
        <div class="spg-opts lv">${['easy', 'medium', 'hard'].map(lvBtn).join('')}</div>
        <p class="spg-lab">Time for each mime</p>
        <div class="spg-opts">${opt('t', [[0, 'No timer'], [30, '30 s'], [60, '60 s'], [90, '90 s']], chSet.time)}</div>
        <p class="spg-lab">Teams</p>
        <div class="spg-opts">${opt('n', [[1, '1 · everybody together'], [2, '2 teams, taking turns']], chSet.teams)}</div>
        <div class="gq-row"><button type="button" class="gq-btn" id="chStart">▶ Start</button></div></div>`;
      area.querySelectorAll('[data-lv]').forEach(b => b.addEventListener('click', () => {
        const k = b.dataset.lv;
        if (chSet.levels.has(k) && chSet.levels.size === 1) return; // at least one level
        chSet.levels.has(k) ? chSet.levels.delete(k) : chSet.levels.add(k);
        b.classList.toggle('on', chSet.levels.has(k));
      }));
      area.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => {
        chSet.time = +b.dataset.t;
        area.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b));
      }));
      area.querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', () => {
        chSet.teams = +b.dataset.n;
        area.querySelectorAll('[data-n]').forEach(x => x.classList.toggle('on', x === b));
      }));
      $('chStart').addEventListener('click', begin);
    }

    let deck, idx, score, team, state, left, started;

    function begin() {
      deck = shuffle([...chSet.levels].flatMap(l => MIMES[l].map(t => ({ t, l }))));
      idx = 0; score = [0, 0]; team = 0;
      card();
    }

    function card() {
      stop();
      if (idx >= deck.length) return result();
      state = 'hidden'; started = false; left = chSet.time;
      paint();
    }

    const scoreHead = () => setScore(chSet.teams === 1 ? `⭐ ${score[0]}` : null);

    function paint() {
      const c = deck[idx];
      scoreHead();
      const teams = chSet.teams === 2 ? `<div class="spg-teams">${[0, 1].map(i => `<div class="spg-team${i === team ? ' now' : ''}">Team ${i + 1}<b>${score[i]}</b></div>`).join('')}</div>` : '';
      let face, btns;
      if (state === 'hidden') {
        face = `<span class="lv">${LEVELS[c.l].stars} ${LEVELS[c.l].name}</span><p class="hid">🙈 ${chSet.teams === 2 ? `Team ${team + 1}: who mimes?` : 'Who mimes?'}</p><p class="gq-instr" style="margin:0">Nobody else looks! The mimer taps the button.</p>`;
        btns = `<button type="button" class="gq-btn" id="chShow">👀 Show the card</button>`;
      } else if (state === 'shown') {
        face = `<span class="lv">${LEVELS[c.l].stars} ${LEVELS[c.l].name}</span><p class="big">${esc(c.t)}</p>`;
        btns = `<button type="button" class="gq-btn alt" id="chHide">🙈 Hide</button><button type="button" class="gq-btn" id="chGot">✓ They got it!</button><button type="button" class="gq-btn alt" id="chSkip">⏭ Skip</button>`;
      } else {
        face = `<span class="lv">⏰ Time's up!</span><p class="big">${esc(c.t)}</p>`;
        btns = `<button type="button" class="gq-btn" id="chSkip">Next card →</button>`;
      }
      area.innerHTML = `<div class="gq-card">${teams}
        <div class="spg-bar"><span>Card ${idx + 1} / ${deck.length}</span><span class="grow"></span><button type="button" class="gq-btn alt" id="chEnd" style="padding:6px 14px;font-size:14px">■ Finish</button></div>
        ${chSet.time ? `<div class="gq-timer"><i id="chBar" style="width:${left / chSet.time * 100}%"></i></div>` : ''}
        <div class="spg-mime ${state}">${face}</div>
        <div class="gq-row">${btns}</div></div>`;
      $('chEnd').addEventListener('click', result);
      $('chShow')?.addEventListener('click', () => { state = 'shown'; paint(); if (chSet.time && !started) tick(); });
      $('chHide')?.addEventListener('click', () => { state = 'hidden'; paint(); });
      $('chGot')?.addEventListener('click', () => { score[team]++; nextCard(); });
      $('chSkip')?.addEventListener('click', nextCard);
    }

    function nextCard() { idx++; team = (team + 1) % chSet.teams; card(); }

    // the time starts when the card is shown for the first time
    function tick() {
      started = true;
      every(() => {
        left = Math.max(0, left - 0.1);
        const bar = $('chBar');
        if (bar) {
          bar.style.width = (left / chSet.time * 100) + '%';
          bar.style.background = left > chSet.time * .3 ? '' : left > chSet.time * .1 ? '#67288a' : '#d6453d';
        }
        if (left <= 0) { stop(); state = 'over'; paint(); }
      }, 100);
    }

    function result() {
      stop();
      setScore(null);
      const done = Math.min(idx, deck?.length || 0);
      let msg;
      if (chSet.teams === 1) msg = `${score[0]} of ${done} mimes guessed! ${score[0] >= done * .7 && done ? '🏆' : '👏'}`;
      else msg = score[0] === score[1] ? `It's a tie: ${score[0]} – ${score[1]} 🤝` : `Team ${score[0] > score[1] ? 1 : 2} wins: ${Math.max(...score)} – ${Math.min(...score)} 🏆`;
      area.innerHTML = `<div class="gq-card" style="text-align:center"><p class="gq-instr">${deck?.length && idx >= deck.length ? 'All the cards are finished!' : 'Game over'}</p>
        <p class="spg-result" style="margin:10px 0">${msg}</p>
        <div class="gq-row"><button type="button" class="gq-btn" id="chAgain">↻ Play again</button><button type="button" class="gq-btn alt" id="chSet">⚙ Change levels</button></div></div>`;
      $('chAgain').addEventListener('click', begin);
      $('chSet').addEventListener('click', setup);
    }

    setup();
  }

  /* ================= Superpower workshop ================= */
  // From an everyday ability to a superpower: pick something you can really do (or write your own),
  // press ×1000, choose (or write) the superpower, give it a name and a weakness → a superhero card.
  const ABILITIES = [
    { a: 'jump high', e: '🏐', hint: 'volleyball', ups: ['jump over buildings', 'jump from roof to roof across a whole city', 'jump all the way to the Moon'] },
    { a: 'listen to my friends', e: '👂', hint: 'when they tell me secrets', ups: ['read people\'s emotions', 'hear a whisper from across the city', 'feel when somebody needs help, anywhere'] },
    { a: 'run fast', e: '🏃', hint: '', ups: ['run faster than a plane', 'run around the world in one minute', 'run on water'] },
    { a: 'swim', e: '🏊', hint: '', ups: ['breathe underwater', 'swim faster than a shark', 'talk to fish and whales'] },
    { a: 'draw', e: '🎨', hint: '', ups: ['make your drawings come alive', 'draw a door to another world', 'paint a storm and make it rain'] },
    { a: 'cook', e: '🍳', hint: '', ups: ['cook a meal that makes anybody happy', 'cook for a whole city in one minute', 'make food that gives people powers'] },
    { a: 'sing', e: '🎤', hint: '', ups: ['calm angry people with your voice', 'break a wall with one high note', 'make flowers grow when you sing'] },
    { a: 'play video games', e: '🎮', hint: '', ups: ['see your enemies\' next move', 'slow down time', 'get a second life'] },
    { a: 'remember things', e: '🧠', hint: '', ups: ['remember everything you have ever seen', 'read people\'s memories', 'know what will happen next'] },
    { a: 'make people laugh', e: '😂', hint: '', ups: ['make anyone smile with one joke', 'stop a fight with a laugh', 'make a whole stadium laugh at once'] },
    { a: 'speak English', e: '🗣️', hint: '', ups: ['understand every language in the world', 'talk to animals', 'make anybody understand you'] },
    { a: 'kick a ball', e: '⚽', hint: '', ups: ['kick a ball to the Moon', 'score from anywhere on Earth', 'kick a ball so hard it makes a tornado'] },
  ];
  // the five questions that multiply an ability (shown when the pupil writes their own)
  const BOOST = [
    ['🔝', 'How BIG?', 'a building? the whole city? the planet?'], ['⚡', 'How FAST?', 'faster than a car? a plane? light?'],
    ['🌍', 'How FAR?', 'across the world? to the Moon?'], ['👥', 'For HOW MANY?', 'everybody? a thousand people at once?'],
    ['🌌', 'WHERE?', 'in the dark? underwater? in space?'],
  ];
  const HERO_NAMES = ['Captain Wow', 'Mega Max', 'Super Star', 'The Blaze', 'Doctor Zoom', 'Nova Boom', 'Miss Marvel-ous', 'Lightning Leo', 'The Great Gizmo'];
  const FLAWS = ['I can\'t resist pizza', 'I can\'t stay awake after 9 pm', 'I can\'t swim', 'I can\'t use my power when it rains', 'I can\'t control my power when I\'m angry', 'I can\'t use my power when somebody is looking'];

  function workshopGame() {
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const hero = { a: '', ups: null, power: '', name: '', flaw: '' };

    // 1 · pick an ability
    function pick() {
      stop(); setScore(null);
      Object.assign(hero, { a: '', ups: null, power: '', name: '', flaw: '' });
      area.innerHTML = `<div class="gq-card">
        <p class="gq-instr">Everybody can do something well. <span>Pick one thing you can do</span>… or write your own. Then press <span>×1000</span>!</p>
        <div class="spw-grid">${ABILITIES.map((x, i) => `<button type="button" data-i="${i}"><i>${x.e}</i><b>${esc(x.a)}</b>${x.hint ? `<small>${esc(x.hint)}</small>` : ''}</button>`).join('')}</div>
        <div class="spw-own"><label>✏️ My own: I can <input id="spwOwn" maxlength="40" placeholder="…" autocomplete="off"></label><button type="button" class="gq-btn" id="spwOwnGo">Next →</button></div></div>`;
      area.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { const x = ABILITIES[+b.dataset.i]; hero.a = x.a; hero.ups = x.ups; machine(); }));
      const go = () => { const v = $('spwOwn').value.trim().replace(/^i can\s+/i, ''); if (!v) { $('spwOwn').focus(); return; } hero.a = v; hero.ups = null; machine(); };
      $('spwOwnGo').addEventListener('click', go);
      $('spwOwn').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    }

    // 2 · the ×1000 machine
    function machine() {
      area.innerHTML = `<div class="gq-card spw-mach">
        <p class="gq-instr">Your real-life ability</p>
        <p class="spw-ab">I can <b>${esc(hero.a)}</b></p>
        <button type="button" class="spw-x" id="spwX" aria-label="Multiply by 1000">⚡<br>×1000</button>
        <div id="spwOut"></div>
        <div class="gq-row"><button type="button" class="gq-btn alt" id="spwBack">← Another ability</button></div></div>`;
      $('spwBack').addEventListener('click', pick);
      $('spwX').addEventListener('click', () => {
        const x = $('spwX');
        if (x.classList.contains('go')) return;
        x.classList.add('go');
        later(() => {
          x.classList.remove('go'); x.classList.add('done');
          if (hero.ups) {
            $('spwOut').innerHTML = `<p class="gq-instr">Boom! Pick the superpower you like best:</p><div class="spw-ups">${hero.ups.map((u, i) => `<button type="button" data-u="${i}">I can ${esc(u)}!</button>`).join('')}</div>
              <p class="gq-instr" style="margin:10px 0 0">…or <button type="button" class="spw-link" id="spwMine">write your own superpower</button></p>`;
            $('spwOut').querySelectorAll('[data-u]').forEach(b => b.addEventListener('click', () => { hero.power = hero.ups[+b.dataset.u]; naming(); }));
            $('spwMine').addEventListener('click', own);
          } else own();
          $('spwOut').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 900);
      });
    }

    // the pupil writes the superpower: five questions help
    function own() {
      $('spwOut').innerHTML = `<p class="gq-instr">Make it <span>×1000</span>! Ask yourself:</p>
        <ul class="spw-q">${BOOST.map(([e, q, t]) => `<li><i>${e}</i><b>${q}</b><span>${t}</span></li>`).join('')}</ul>
        <div class="spw-own"><label>My superpower: I can <input id="spwPow" maxlength="70" placeholder="…" autocomplete="off"></label><button type="button" class="gq-btn" id="spwPowGo">Next →</button></div>`;
      const go = () => { const v = $('spwPow').value.trim().replace(/^i can\s+/i, '').replace(/[!.]+$/, ''); if (!v) { $('spwPow').focus(); return; } hero.power = v; naming(); };
      $('spwPowGo').addEventListener('click', go);
      $('spwPow').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      $('spwPow').focus();
    }

    // 3 · a name and a weakness
    function naming() {
      const names = shuffle(HERO_NAMES).slice(0, 4);
      const flaws = shuffle(FLAWS).slice(0, 4);
      area.innerHTML = `<div class="gq-card">
        <p class="spw-pw">⚡ I can ${esc(hero.power)}!</p>
        <p class="spw-lab">Name your superhero</p>
        <div class="spw-chips" id="spwNames">${names.map(n => `<button type="button">${esc(n)}</button>`).join('')}</div>
        <input class="spw-in" id="spwName" maxlength="30" placeholder="…or write a name" autocomplete="off">
        <p class="spw-lab">Every hero has a weakness!</p>
        <div class="spw-chips" id="spwFlaws">${flaws.map(n => `<button type="button">${esc(n)}</button>`).join('')}</div>
        <input class="spw-in" id="spwFlaw" maxlength="70" placeholder="I can't…" autocomplete="off">
        <div class="gq-row"><button type="button" class="gq-btn" id="spwCard">🦸 Make my card</button></div></div>`;
      const chips = (box, input) => area.querySelectorAll(`#${box} button`).forEach(b => b.addEventListener('click', () => {
        input.value = b.textContent;
        area.querySelectorAll(`#${box} button`).forEach(x => x.classList.toggle('on', x === b));
      }));
      chips('spwNames', $('spwName')); chips('spwFlaws', $('spwFlaw'));
      $('spwCard').addEventListener('click', () => {
        hero.name = $('spwName').value.trim(); hero.flaw = $('spwFlaw').value.trim().replace(/[!.]+$/, '');
        if (!hero.name) { $('spwName').focus(); return; }
        if (!hero.flaw) { $('spwFlaw').focus(); return; }
        card();
      });
    }

    // 4 · the superhero card
    function card() {
      const flaw = hero.flaw.replace(/^(i\s+)?can['’]?t\s*/i, '');
      area.innerHTML = `<div class="gq-card" style="text-align:center">
        <div class="spw-hero">
          <span class="spw-star">⭐</span>
          <h3>${esc(hero.name)}</h3>
          <p><small>REAL LIFE</small>I can ${esc(hero.a)}.</p>
          <p class="x"><small>⚡ ×1000</small>I can ${esc(hero.power)}!</p>
          <p class="w"><small>WEAKNESS</small>I can't ${esc(flaw)}.</p>
        </div>
        <p class="gq-instr" style="margin-top:14px">✏️ Copy your card in your notebook and <span>draw your superhero</span>!</p>
        <div class="gq-row"><button type="button" class="gq-btn" id="spwAgain">↻ Another superhero</button><button type="button" class="gq-btn alt" data-menu>Other games</button></div></div>`;
      $('spwAgain').addEventListener('click', pick);
    }

    pick();
  }

  const GAMES = { charades: charadesGame, workshop: workshopGame, race: raceGame, memory: memoryGame, search: searchGame };

  /* ================= 6 · the Games list on the home page ================= */
  // grammar-games.js writes that list, so we add our pill once everything has loaded
  window.addEventListener('load', () => {
    const list = $('gameList');
    if (!list || typeof PAGES === 'undefined') return;
    const where = { charades: 'sp-talents:R', workshop: 'sp-superhero:R', race: 'sp-like:R', memory: 'sp-vocab', search: 'sp-vocab' };
    const pill = document.createElement('details');
    pill.className = 'game-topic';
    pill.style.setProperty('--c', '#f06054');
    pill.innerHTML = `<summary>Sports &amp; Hobbies <small>${ORDER.length}</small></summary><div class="topic-pages">${ORDER.map(id =>
      `<a href="#p${PAGES.of(where[id])}" data-sph-go="${id}">${INFO[id].icon} ${INFO[id].name}</a>`).join('')}</div>`;
    list.append(pill);
    document.addEventListener('click', e => { if (!e.target.closest('#gameList')) pill.open = false; });
    list.addEventListener('toggle', e => {
      if (e.target.open) list.querySelectorAll('.game-topic').forEach(o => { if (o !== e.target) o.open = false; });
    }, true);
    // go to the page the game belongs to, then open it
    pill.querySelectorAll('[data-sph-go]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      pill.open = false;
      const go = () => open(a.dataset.sphGo);
      if (location.hash === a.getAttribute('href')) { go(); return; }
      document.addEventListener('spreadchange', go, { once: true });
      location.hash = a.getAttribute('href');
    }));
    window.hideClosedGames?.(); // hide the pill if the pages are not open to the students
  });
})();
