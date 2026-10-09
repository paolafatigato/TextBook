// Literature · Metaphors (pp. 50-59): the stopwatches and the two games
// (rule 3: the Stroop test, rule 4: "literally true?"), and the checks of the metaphors.

(() => {
  // write a result into a box of the book, so script.js saves it like a typed answer
  const fillIn = (id, value) => {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.value = value;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const avg = list => (list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : 0);
  const shuffle = list => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  /* ================= stopwatches (p. 54) ================= */
  // ⏱ Start → the button counts the seconds; ⏹ Stop → the time goes into the box next to it

  document.querySelectorAll('.mt-timer').forEach(btn => {
    let start = 0;
    let tick = null;
    btn.addEventListener('click', () => {
      if (tick) {
        clearInterval(tick);
        tick = null;
        btn.classList.remove('on');
        btn.textContent = '⏱ Again';
        fillIn(btn.dataset.for, ((performance.now() - start) / 1000).toFixed(1));
        return;
      }
      start = performance.now();
      btn.classList.add('on');
      const show = () => { btn.textContent = `⏹ Stop ${((performance.now() - start) / 1000).toFixed(1)}`; };
      show();
      tick = setInterval(show, 100);
    });
  });

  /* ================= the pop-up of the games ================= */

  const overlay = document.createElement('div');
  overlay.className = 'mt-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="mt-gbox">
      <button type="button" class="mt-gclose" aria-label="Close">✕</button>
      <div class="mt-gscreen"></div>
    </div>`;
  document.body.append(overlay);
  const box = overlay.querySelector('.mt-gbox');
  const screen = overlay.querySelector('.mt-gscreen');
  let game = null;
  let lastFocus = null;

  function open(g) {
    game = g;
    lastFocus = document.activeElement;
    box.style.setProperty('--gc', g.colour);
    overlay.setAttribute('aria-label', g.name);
    overlay.hidden = false;
    g.start();
  }
  function close() {
    overlay.hidden = true;
    game?.stop();
    game = null;
    lastFocus?.focus();
  }
  const shake = el => { el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); };

  overlay.querySelector('.mt-gclose').addEventListener('click', close);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) { close(); return; }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'close') close();
    else if (act) game?.act(act, e.target.closest('[data-act]'));
  });
  // while a game is open the keys play the game and do not turn the pages
  window.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    e.stopPropagation();
    if (e.key === 'Escape') { close(); return; }
    game?.key(e);
  }, true);

  /* ---------- rule 3: the Stroop game ---------- */
  // Level 1: the word and the ink are the same colour. Level 2: they are different.
  // Click the colour of the INK. The average time of each level is written on p. 54.

  const COLOURS = [
    { name: 'red', c: '#e53935' },
    { name: 'blue', c: '#1e5bd8' },
    { name: 'green', c: '#2e9e3a' },
    { name: 'orange', c: '#f08a00' },
    { name: 'purple', c: '#a62bc9' },
  ];
  const STROOP_TRIALS = 10;

  const stroop = (() => {
    let level, trial, shownAt, current, times, errors;

    function intro(n) {
      const text = n === 1
        ? 'Click the colour of the <b>INK</b>. In level 1 the word and the ink are the same colour. Easy!'
        : 'Now the word and the ink are <b>different</b>. Don’t read the word: click the colour of the <b>INK</b>!';
      screen.innerHTML = `
        <h2>Level ${n} ${n === 1 ? '🙂' : '🤯'}</h2>
        <p>${text}</p>
        <p><small>On a keyboard you can also press 1 2 3 4 5.</small></p>
        <button type="button" class="mt-gbtn" data-act="go">▶ Start level ${n}</button>`;
      screen.querySelector('[data-act=go]').focus();
    }
    function board() {
      screen.innerHTML = `
        <h2>Level ${level}</h2>
        <div class="mt-gbar"><i></i></div>
        <p class="mt-gword" aria-live="polite"></p>
        <div class="mt-gswatches">${COLOURS.map((col, i) =>
          `<button type="button" data-act="ink" data-i="${i}" style="--c:${col.c}" aria-label="${col.name}">${i + 1}</button>`).join('')}</div>`;
      next();
    }
    function next() {
      const word = pick(COLOURS);
      const ink = level === 1 ? word : pick(COLOURS.filter(c => c !== word));
      current = { word, ink };
      const el = screen.querySelector('.mt-gword');
      el.textContent = word.name;
      el.style.color = ink.c;
      screen.querySelector('.mt-gbar i').style.width = `${(trial / STROOP_TRIALS) * 100}%`;
      shownAt = performance.now();
    }
    function answer(i) {
      if (!current) return;
      if (COLOURS[i] !== current.ink) {
        errors[level]++;
        shake(screen.querySelector('.mt-gword'));
        return; // try again: the time keeps running
      }
      times[level].push(performance.now() - shownAt);
      trial++;
      if (trial < STROOP_TRIALS) { next(); return; }
      current = null;
      if (level === 1) { level = 2; trial = 0; intro(2); return; }
      results();
    }
    function results() {
      const a1 = avg(times[1]);
      const a2 = avg(times[2]);
      const diff = a2 - a1;
      const msg = diff > 0
        ? `Level 2 took you ${diff} ms longer for each word: that’s the Stroop effect! Your brain couldn’t stop reading the words.`
        : 'Wow, you were just as fast in level 2! Try again and see if it happens every time.';
      screen.innerHTML = `
        <h2>Results 🏁</h2>
        <div class="mt-gres">
          <div><small>Level 1 · same colour</small><b>${a1} ms</b><small>${plural(errors[1], 'mistake')}</small></div>
          <div><small>Level 2 · different colour</small><b>${a2} ms</b><small>${plural(errors[2], 'mistake')}</small></div>
        </div>
        <p class="mt-gmsg">${msg}</p>
        <p><small>1000 ms = 1 second. Your results are written on page 54.</small></p>
        <button type="button" class="mt-gbtn" data-act="again">↻ Play again</button><button type="button" class="mt-gbtn alt" data-act="close">Close</button>`;
      fillIn('mt-game-1', `${a1} ms · ${plural(errors[1], 'mistake')}`);
      fillIn('mt-game-2', `${a2} ms · ${plural(errors[2], 'mistake')}`);
      screen.querySelector('[data-act=again]').focus();
    }
    function start() {
      level = 1; trial = 0; current = null;
      times = { 1: [], 2: [] };
      errors = { 1: 0, 2: 0 };
      intro(1);
    }
    return {
      name: 'The Stroop game',
      colour: '#4aa8ec',
      start,
      stop() { current = null; },
      act(a, el) {
        if (a === 'go') board();
        if (a === 'again') start();
        if (a === 'ink') answer(Number(el.dataset.i));
      },
      key(e) {
        if (/^[1-5]$/.test(e.key) && current) { e.preventDefault(); answer(Number(e.key) - 1); }
      },
    };
  })();

  /* ---------- rule 4: literally true? ---------- */
  // The experiment of p. 55: say if a sentence is LITERALLY true or false, as fast as you can.
  // Metaphors are literally false, but the brain understands them anyway: saying "false" takes longer.

  const SENTENCES = [
    ['A cat is an animal.', 'true'], ['Snow is cold.', 'true'], ['Rome is in Italy.', 'true'],
    ['Fish live in water.', 'true'], ['A week has seven days.', 'true'], ['Apples grow on trees.', 'true'],
    ['A cat is a car.', 'false'], ['Snow is hot.', 'false'], ['Fish live in trees.', 'false'],
    ['A week has two days.', 'false'], ['Rome is in Japan.', 'false'], ['Apples are made of glass.', 'false'],
    ['My teacher is a dragon.', 'meta'], ['Life is a rollercoaster.', 'meta'], ['Her eyes are stars.', 'meta'],
    ['Time is a thief.', 'meta'], ['The classroom is a zoo.', 'meta'], ['Some jobs are jails.', 'meta'],
  ];

  const truth = (() => {
    let order, pos, shownAt, waiting, times, errors;

    function start() {
      order = shuffle(SENTENCES);
      pos = 0;
      waiting = false;
      times = { true: [], false: [], meta: [] };
      errors = 0;
      screen.innerHTML = `
        <h2>Literally true? 🔬</h2>
        <p>Read each sentence and decide as fast as you can: is it <b>LITERALLY</b> true?</p>
        <p>Careful: “My teacher is a dragon” is <b>not</b> literally true!</p>
        <p><small>Keyboard: T = true · F = false</small></p>
        <button type="button" class="mt-gbtn" data-act="go">▶ Start</button>`;
      screen.querySelector('[data-act=go]').focus();
    }
    function board() {
      screen.innerHTML = `
        <h2>Literally true?</h2>
        <div class="mt-gbar"><i></i></div>
        <p class="mt-gsent" aria-live="polite"></p>
        <div class="mt-gtf"><button type="button" class="t" data-act="ans" data-a="true">✓ TRUE</button><button type="button" class="f" data-act="ans" data-a="false">✗ FALSE</button></div>`;
      show();
    }
    function show() {
      const el = screen.querySelector('.mt-gsent');
      el.textContent = '';
      screen.querySelector('.mt-gbar i').style.width = `${(pos / order.length) * 100}%`;
      waiting = false;
      // a short pause between the sentences, so every sentence starts from zero
      setTimeout(() => {
        if (!game) return;
        el.textContent = order[pos][0];
        shownAt = performance.now();
        waiting = true;
      }, 350);
    }
    function answer(a) {
      if (!waiting) return;
      const [, kind] = order[pos];
      const right = kind === 'true' ? 'true' : 'false';
      if (a !== right) {
        errors++;
        shake(screen.querySelector('.mt-gsent'));
        return;
      }
      times[kind].push(performance.now() - shownAt);
      waiting = false;
      pos++;
      if (pos < order.length) show(); else results();
    }
    function results() {
      const f = avg(times.false);
      const m = avg(times.meta);
      const diff = m - f;
      const msg = diff > 0
        ? `You needed ${diff} ms more to say FALSE to a metaphor: your brain couldn’t ignore the metaphorical meaning!`
        : 'This time the metaphors didn’t slow you down. Play again: does it happen every time?';
      screen.innerHTML = `
        <h2>Results 🏁</h2>
        <div class="mt-gres">
          <div><small>False sentences<br>“A cat is a car.”</small><b>${f} ms</b></div>
          <div><small>Metaphors<br>“Time is a thief.”</small><b>${m} ms</b></div>
        </div>
        <p class="mt-gmsg">${msg}</p>
        <p><small>True sentences: ${avg(times.true)} ms · ${plural(errors, 'mistake')}. Your results are written on page 55.</small></p>
        <button type="button" class="mt-gbtn" data-act="again">↻ Play again</button><button type="button" class="mt-gbtn alt" data-act="close">Close</button>`;
      fillIn('mt-tr-false', `${f} ms`);
      fillIn('mt-tr-meta', `${m} ms`);
      screen.querySelector('[data-act=again]').focus();
    }
    return {
      name: 'Literally true?',
      colour: '#3aa04a',
      start,
      stop() { waiting = false; },
      act(a, el) {
        if (a === 'go') board();
        if (a === 'again') start();
        if (a === 'ans') answer(el.dataset.a);
      },
      key(e) {
        const k = e.key.toLowerCase();
        if (k === 't' || k === 'f') { e.preventDefault(); answer(k === 't' ? 'true' : 'false'); }
      },
    };
  })();

  const GAMES = { stroop, truth };
  document.querySelectorAll('.mt-play[data-game]').forEach(btn => btn.addEventListener('click', () => open(GAMES[btn.dataset.game])));

  /* ================= check the metaphors (p. 58) ================= */
  // data-rule on each box: plain · simile (with like/as) · metaphor (without like/as)
  // · extended (a metaphor with an explanation, at least 7 words)

  const hasLikeAs = t => /\b(like|as)\b/i.test(t);
  const words = t => t.trim().split(/\s+/).filter(Boolean).length;

  function judge(rule, text) {
    if (!text.trim()) return null;
    if (rule === 'plain') return { cls: 'ok' };
    if (rule === 'simile') return hasLikeAs(text) ? { cls: 'ok' } : { cls: 'no', tip: 'A simile needs “like” or “as”.' };
    if (hasLikeAs(text)) return { cls: 'no', tip: 'I still see “like” or “as”: that’s a simile! Cut it and say that A IS B.' };
    if (rule === 'extended' && words(text) < 7) return { cls: 'warn', tip: 'Good, it’s a metaphor! Now explain it: what does it do? Where is it? How does it feel?' };
    return { cls: 'ok' };
  }

  const checks = [...document.querySelectorAll('.check[data-mt-meta]')].map(btn => {
    const list = document.getElementById(btn.dataset.mtMeta);
    const fb = document.getElementById(`${btn.dataset.mtMeta}-fb`);
    const clear = () => {
      list.querySelectorAll('li').forEach(li => li.classList.remove('ok', 'no', 'warn'));
      if (fb) fb.textContent = '';
    };
    btn.addEventListener('click', () => {
      const tips = [];
      list.querySelectorAll('input[data-rule]').forEach(inp => {
        const li = inp.closest('li');
        li.classList.remove('ok', 'no', 'warn');
        const res = judge(inp.dataset.rule, inp.value);
        if (!res) return;
        li.classList.add(res.cls);
        if (res.tip && !tips.includes(res.tip)) tips.push(res.tip);
      });
      if (!fb) return;
      const done = list.querySelectorAll('li.ok').length;
      const total = list.querySelectorAll('input[data-rule]').length;
      fb.textContent = tips.length ? tips.join(' ') : done === total ? 'Great metaphors! 🎉' : '';
    });
    list.addEventListener('input', clear);
    return { clear };
  });

  // "🧹 Clear answers" empties the boxes: take away the marks too
  document.getElementById('clearBtn')?.addEventListener('click', () => setTimeout(() => {
    if (!document.getElementById('mt-cut-1')?.value) checks.forEach(c => c.clear());
  }));
})();
