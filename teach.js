// Teach Teaching ([teach-intro … teach-day]): the little experiments of the six labs.
// Everything here is something the pupils DO before they get the rule (induction), so no answer is printed
// on the page: a pupil presses, plays or guesses, the page reacts, and only then the rule is shown.
// The written answers, the choice buttons and the Check buttons are the generic ones of script.js.
// What is kept (in `saved`, script.js): the stars (tc-star-…) and the scores of the letter test (tc-lt-r1, tc-lt-r2).

(() => {
  const $ = id => document.getElementById(id);
  const store = (k, v) => { try { saved[k] = v; persist(); } catch { /* script.js not ready: skip */ } };
  const recall = k => { try { return saved[k]; } catch { return undefined; } };
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  // every timer of an experiment, so it can be stopped when the page is left
  const timers = new Set();
  const later = (f, ms) => { const t = setTimeout(() => { timers.delete(t); f(); }, ms); timers.add(t); return t; };
  const every = (f, ms) => { const t = setInterval(f, ms); timers.add(t); return t; };
  const stop = t => { clearTimeout(t); clearInterval(t); timers.delete(t); };

  /* ---------- a button that shows or hides a box: data-show="id" ---------- */
  document.querySelectorAll('[data-show]').forEach(b => b.addEventListener('click', () => {
    const t = $(b.dataset.show);
    if (!t) return;
    t.hidden = !t.hidden;
    b.classList.toggle('on', !t.hidden);
    if (b.dataset.label) b.textContent = t.hidden ? b.dataset.label : (b.dataset.labelOn || b.dataset.label);
  }));

  /* ---------- a poll: press a card (the right one has data-correct) and the box data-reveal opens ---------- */
  document.querySelectorAll('.tc-pick').forEach(box => box.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const right = b.hasAttribute('data-correct');
    if (box.dataset.free !== undefined) {           // no right answer: just show the vote
      box.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    } else {
      b.classList.remove('ok', 'no');
      b.classList.add(right ? 'ok' : 'no');
    }
    if (right || box.dataset.free !== undefined) { const r = $(box.dataset.reveal); if (r) r.hidden = false; }
  })));

  /* ---------- the neuron counter on the first page ---------- */
  // On the screen the pupil presses the button and the number counts up. On paper (the print copy, or the browser's own print)
  // the number is already there, and the button is not.
  const counter = $('tc-count');
  if (counter) {
    const FULL = (86e9).toLocaleString('en-US');
    const showFull = () => { counter.textContent = FULL; $('tc-count-say').hidden = false; $('tc-count-go').hidden = true; };
    const printCopy = typeof isPrintCopy !== 'undefined' && isPrintCopy;
    let before = null;
    $('tc-count-go').addEventListener('click', () => {
      const t0 = Date.now();
      const t = every(() => {
        const k = Math.min(1, (Date.now() - t0) / 1800);
        counter.textContent = Math.round(86e9 * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US');
        if (k >= 1) { stop(t); $('tc-count-say').hidden = false; }
      }, 40);
    });
    if (printCopy) showFull();
    window.addEventListener('beforeprint', () => { before = { text: counter.textContent, say: $('tc-count-say').hidden, go: $('tc-count-go').hidden }; showFull(); });
    window.addEventListener('afterprint', () => { if (!before) return; counter.textContent = before.text; $('tc-count-say').hidden = before.say; $('tc-count-go').hidden = before.go; before = null; });
  }

  /* ---------- lab 1 · two neurons: fire together, wire together ---------- */
  const wire = $('tc-wire');
  if (wire) {
    const L = ['', 'very weak', 'weak', 'getting stronger', 'strong', 'super strong!'];
    let level = 0;
    const set = n => {
      level = n;
      wire.dataset.level = n;
      wire.style.setProperty('--s', [1, 2, 4, 7, 11, 16][n]);
      $('tc-wire-say').textContent = n ? `The connection is ${L[n]}` : 'No practice yet: the connection is thin.';
      $('tc-wire-bar').style.setProperty('--p', n * 20);
      $('tc-wire-n').textContent = n;
    };
    const zap = () => {
      wire.classList.remove('zap'); void wire.offsetWidth; wire.classList.add('zap');
      wire.querySelectorAll('.tc-neuron').forEach(x => { x.classList.remove('fire'); void x.getBoundingClientRect(); x.classList.add('fire'); });
    };
    $('tc-wire-go').addEventListener('click', () => { if (level < 5) set(level + 1); zap(); });
    $('tc-wire-reset').addEventListener('click', () => set(0));
    wire.querySelectorAll('.tc-neuron').forEach(n => n.addEventListener('click', zap));
    set(0);
  }

  /* ---------- stars ---------- */
  const starBoxes = [...document.querySelectorAll('.tc-stars')];
  const paintStars = box => {
    const n = +recall(box.id) || 0;
    box.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i < n));
  };
  starBoxes.forEach(box => {
    box.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => {
      store(box.id, +recall(box.id) === i + 1 ? 0 : i + 1);
      paintStars(box);
      box.dispatchEvent(new CustomEvent('rated', { bubbles: true }));
    }));
    paintStars(box);
  });
  // the hooks: when all four are rated, tell which one won
  const hookBox = $('tc-hooks');
  if (hookBox) {
    const sum = () => {
      const rows = [...hookBox.querySelectorAll('.tc-stars')].map(b => ({ b, n: +recall(b.id) || 0 }));
      const out = $('tc-hook-sum');
      if (rows.some(r => !r.n)) { out.textContent = 'Rate all four hooks to see your favorite.'; return; }
      const top = Math.max(...rows.map(r => r.n));
      const w = rows.filter(r => r.n === top).map(r => r.b.dataset.letter);
      out.innerHTML = `Your favorite: <b>${w.join(' and ')}</b> (${top}★). What do they have in common?`;
    };
    hookBox.addEventListener('rated', sum);
    sum();
  }

  /* ---------- lab 2 · the letter test ---------- */
  const lt = $('tc-lt');
  if (lt) {
    const SENTENCE = 'MY DOG LOVES PIZZA';
    const LETTERS = SENTENCE.replace(/ /g, '');
    const screen = $('tc-lt-screen'), input = $('tc-lt-input'), res = $('tc-lt-res'), check = $('tc-lt-check');
    const starts = [$('tc-lt-s1'), $('tc-lt-s2')];
    let round = 0, shown = '', timer = null, r1 = '';
    const review = $('tc-lt-review');
    const scoreOf = (a, b) => { let n = 0; for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) n++; return n; };
    const paint = () => { ['r1', 'r2'].forEach(k => { const v = recall(`tc-lt-${k}`); $(`tc-lt-${k}`).textContent = v === undefined || v === '' ? '–' : v; }); };
    function go(r) {
      round = r; stop(timer);
      let letters = LETTERS;
      if (r === 1) { do { letters = shuffle(LETTERS.split('')).join(''); } while (letters === LETTERS); }
      shown = letters;
      if (r === 1) { r1 = letters; if (review) review.disabled = true; }
      const text = r === 1 ? letters.split('').join(' ') : SENTENCE.split(' ').map(w => w.split('').join(' ')).join('   ');
      screen.innerHTML = `<span>${text}</span>`;
      input.value = ''; input.disabled = true; check.disabled = true; res.textContent = '';
      starts.forEach(b => { b.disabled = true; });
      if (review) review.disabled = true;
      let t = 11;
      const cd = document.createElement('div'); cd.className = 't'; cd.textContent = `⏱ ${t}`; screen.append(cd);
      timer = every(() => {
        t--; cd.textContent = `⏱ ${t}`;
        if (t <= 0) {
          stop(timer);
          screen.innerHTML = '<span>Now type the letters!</span>';
          input.disabled = false; check.disabled = false; input.focus();
        }
      }, 1000);
    }
    // look at the letters of round 1 again, to check them against what was typed
    review?.addEventListener('click', () => {
      if (!r1) return;
      stop(timer);
      const before = screen.innerHTML;
      screen.innerHTML = '<div class="t">ROUND 1 · THE LETTERS</div><span>' + r1.split('').join(' ') + '</span>';
      review.disabled = true;
      later(() => { screen.innerHTML = before; review.disabled = false; }, 8000);
    });
    starts[0].addEventListener('click', () => go(1));
    starts[1].addEventListener('click', () => go(2));
    check.addEventListener('click', () => {
      const typed = input.value.toUpperCase().replace(/[^A-Z]/g, '');
      const n = scoreOf(typed, shown);
      store(`tc-lt-r${round}`, n); paint();
      res.innerHTML = `Round ${round}: <b>${n} / ${LETTERS.length}</b> letters in the right place.`;
      check.disabled = true; input.disabled = true;
      starts.forEach(b => { b.disabled = false; });
      if (review && r1) review.disabled = false;
      screen.innerHTML = `<span>${shown.length ? (round === 1 ? 'Round 2 uses the same letters…' : 'Compare your two scores!') : ''}</span>`;
    });
    paint();
  }

  /* ---------- lab 2 · the magic number ---------- */
  const magic = $('tc-magic');
  if (magic) {
    $('tc-magic-go').addEventListener('click', () => {
      const n = parseInt(magic.value, 10), out = $('tc-magic-say');
      if (!Number.isFinite(n)) { out.textContent = 'Type a number first!'; return; }
      out.textContent = n >= 5 && n <= 9 ? 'Yes! Right in the middle of 5 to 9.' : n < 5 ? 'A bit too low.' : 'Too high for a brain!';
      $('tc-magic-r').hidden = false;
    });
  }

  /* ---------- lab 3 · how much did Ebbinghaus forget? ---------- */
  document.querySelectorAll('.tc-eb .row').forEach(row => {
    const rng = row.querySelector('input[type=range]'), v = row.querySelector('.v'), btn = row.querySelector('button');
    const res = row.nextElementSibling, real = +row.dataset.forgot;
    const upd = () => { v.textContent = `${rng.value}%`; };
    rng.addEventListener('input', upd); upd();
    btn.addEventListener('click', () => {
      const guess = +rng.value, diff = Math.abs(guess - real);
      res.style.setProperty('--p', real); res.style.setProperty('--g', guess);
      res.querySelector('span').innerHTML = `He forgot <b>${real}%</b>. ${diff <= 10 ? 'Great guess!' : guess < real ? 'More!' : 'Less!'}`;
      res.classList.add('show'); btn.disabled = true; rng.disabled = true;
    });
  });
  const vs = $('tc-vs');
  if (vs) vs.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const right = b.dataset.choice === 'B';
    vs.querySelectorAll('button').forEach(x => x.classList.remove('ok', 'no'));
    b.classList.add(right ? 'ok' : 'no');
    const bars = $('tc-vs-bars'); bars.hidden = false;
    later(() => { $('tc-vs-a').style.width = '20%'; $('tc-vs-b').style.width = '65%'; }, 60);
    $('tc-vs-r').hidden = false;
  }));

  /* ---------- lab 3 · ten words flash ---------- */
  const fl = $('tc-flash');
  if (fl) {
    const WORDS = ['river', 'apple', 'guitar', 'window', 'tiger', 'pencil', 'bridge', 'cloud', 'bread', 'mirror'];
    const screen = $('tc-flash-screen'), input = $('tc-flash-input'), go = $('tc-flash-go'), check = $('tc-flash-check'), res = $('tc-flash-res');
    go.addEventListener('click', () => {
      go.disabled = true; check.disabled = true; input.disabled = true; input.value = ''; res.textContent = '';
      let i = 0;
      const next = () => {
        if (i >= WORDS.length) { screen.textContent = 'Now type the words!'; input.disabled = false; check.disabled = false; input.focus(); return; }
        screen.textContent = WORDS[i++]; later(() => { screen.textContent = ''; later(next, 250); }, 1200);
      };
      screen.textContent = '3… 2… 1…'; later(next, 1800);
    });
    check.addEventListener('click', () => {
      const typed = input.value.toLowerCase().split(/[^a-z]+/).filter(Boolean);
      const got = WORDS.filter(w => typed.includes(w));
      store('tc-flash-score', got.length);
      res.innerHTML = `You remembered <b>${got.length} / 10</b> words${got.length < 10 ? `. Missing: ${WORDS.filter(w => !got.includes(w)).join(', ')}` : '! 🏆'}`;
      go.disabled = false; check.disabled = true;
    });
  }

  /* ---------- lab 6 · the working memory bucket ---------- */
  const bk = $('tc-load');
  if (bk) {
    const water = $('tc-load-water'), say = $('tc-load-say'), n = $('tc-load-n');
    const upd = () => {
      const v = +bk.value; n.textContent = v;
      water.setAttribute('y', 112 - v * 9.2); water.setAttribute('height', v * 9.2 + 4);
      say.classList.toggle('over', v > 9);
      say.textContent = v <= 4 ? 'Easy: there is space in your head.' : v <= 7 ? 'Good! Your working memory can hold this.' : v <= 9 ? 'Full! This is the limit.' : 'It spills! Your brain forgets things.';
    };
    bk.addEventListener('input', upd); upd();
  }

  /* ---------- lab 5 · the two parts of the brain ---------- */
  document.querySelectorAll('.tc-brains button').forEach(b => b.addEventListener('click', () => {
    const on = !b.classList.contains('on');
    b.classList.toggle('on', on);
    const both = [...b.parentElement.children].every(x => x.classList.contains('on'));
    const r = $('tc-brains-r'); if (r) r.hidden = !both;
  }));

  /* ---------- lab 2 · paragraphs to put in order: drag them (by the letter) or press the arrows; the boxes get the numbers ---------- */
  document.querySelectorAll('.tc-order[data-drag]').forEach(ol => {
    const sync = () => [...ol.children].forEach((li, i) => {
      const inp = li.querySelector('input');
      li.classList.remove('ok', 'no');
      if (!inp) return;
      inp.value = String(i + 1); inp.classList.remove('ok', 'no');
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    let drag = null;
    ol.querySelectorAll(':scope > li').forEach(li => {
      li.querySelector('.lt')?.addEventListener('pointerdown', () => { li.draggable = true; });
      li.addEventListener('dragstart', e => { drag = li; li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'paragraph'); });
      li.addEventListener('dragend', () => { li.draggable = false; li.classList.remove('dragging'); if (drag) { drag = null; sync(); } });
      li.addEventListener('dragover', e => {
        if (!drag || drag === li) return;
        e.preventDefault();
        const r = li.getBoundingClientRect();
        ol.insertBefore(drag, e.clientY > r.top + r.height / 2 ? li.nextSibling : li);
      });
      li.addEventListener('drop', e => e.preventDefault());
      li.querySelector('.up')?.addEventListener('click', () => { if (li.previousElementSibling) { ol.insertBefore(li, li.previousElementSibling); sync(); } });
      li.querySelector('.dn')?.addEventListener('click', () => { if (li.nextElementSibling) { ol.insertBefore(li.nextElementSibling, li); sync(); } });
    });
  });

  window.addEventListener('hashchange', () => { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers.clear(); });
})();
