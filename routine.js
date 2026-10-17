// Daily routine ([ps-routine-pictures … ps-routine-linking]): the routine clock of [ps-routine-clock] and the missing vowels of [ps-routine-linking:R].
// The clock: drag the hands (or use the buttons) and read the time in words.
// Two games with Leo's day (the reading of [ps-routine-clock:R]): "Read it" (choose the right time)
// and "Set it" (move the hands to the time in the sentence).

(() => {
  /* ================= time in words ================= */
  const NUM = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const MIN = { 5: 'five', 10: 'ten', 15: 'quarter', 20: 'twenty', 25: 'twenty-five', 30: 'half' };
  const words = (h, m) => {
    if (m === 0) return `${NUM[h]} o’clock`;
    if (m <= 30) return `${MIN[m]} past ${NUM[h]}`;
    return `${MIN[60 - m]} to ${NUM[h % 12 + 1]}`;
  };
  const digital = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
  const cap = s => s[0].toUpperCase() + s.slice(1);

  // Leo's day ([ps-routine-clock:R])
  const LEO = [
    { e: '🥱', s: 'Leo wakes up', h: 7, m: 0 },
    { e: '🐕', s: 'Leo takes Pepper for a walk', h: 7, m: 10 },
    { e: '🥣', s: 'Leo has breakfast', h: 7, m: 25 },
    { e: '🚌', s: 'Leo goes to school by bus', h: 7, m: 45 },
    { e: '🏫', s: 'school starts', h: 8, m: 0 },
    { e: '🔔', s: 'school finishes', h: 1, m: 30 },
    { e: '🥪', s: 'Leo has lunch with his grandma', h: 1, m: 50 },
    { e: '📝', s: 'Leo does his homework', h: 3, m: 15 },
    { e: '⚽', s: 'Leo plays football in the park', h: 5, m: 0 },
    { e: '🍝', s: 'the family has dinner', h: 7, m: 30 },
    { e: '📖', s: 'Leo reads a comic in bed', h: 9, m: 5 },
    { e: '😴', s: 'Leo goes to sleep', h: 9, m: 30 },
  ];

  const box = document.getElementById('rt-clock');
  if (!box) return;
  const NS = 'http://www.w3.org/2000/svg';
  const R = 100;
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    parent?.append(n);
    return n;
  };
  const polar = (deg, r) => [Math.sin(deg * Math.PI / 180) * r, -Math.cos(deg * Math.PI / 180) * r];

  /* ================= the clock face ================= */
  const svg = el('svg', { viewBox: '-110 -110 220 220', role: 'img', 'aria-label': 'Clock' }, box);
  // a scalloped plate behind the clock (24 bumps)
  let plate = `M${polar(0, R + 6).join(',')}`;
  for (let i = 0; i < 24; i++) plate += ` Q${polar(i * 15 + 7.5, R + 17).join(',')} ${polar(i * 15 + 15, R + 6).join(',')}`;
  el('path', { class: 'plate', d: plate + 'Z' }, svg);
  el('circle', { class: 'rim', r: R + 4 }, svg);
  // right half = PAST, left half = TO
  el('path', { class: 'past', d: `M0,0 L0,${-R} A${R},${R} 0 0 1 0,${R} Z` }, svg);
  el('path', { class: 'to', d: `M0,0 L0,${R} A${R},${R} 0 0 1 0,${-R} Z` }, svg);
  el('circle', { class: 'ring', r: R - 4 }, svg);
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0;
    const [x1, y1] = polar(i * 6, R - (big ? 16 : 11));
    const [x2, y2] = polar(i * 6, R - 6);
    el('line', { class: big ? 'tick h' : 'tick', x1, y1, x2, y2 }, svg);
  }
  for (let h = 1; h <= 12; h++) {
    const [x, y] = polar(h * 30, R - 31);
    el('text', { class: 'num', x, y }, svg).textContent = h;
  }
  const emo = el('text', { class: 'emo', x: 0, y: 34 }, svg);
  const hourHand = el('line', { class: 'hand hr', x1: 0, y1: 0, x2: 0, y2: -48 }, svg);
  const minHand = el('line', { class: 'hand mn', x1: 0, y1: 0, x2: 0, y2: -78 }, svg);
  const hourHit = el('line', { class: 'hit', 'data-hand': 'h', x1: 0, y1: 0, x2: 0, y2: -48 }, svg);
  const minHit = el('line', { class: 'hit', 'data-hand': 'm', x1: 0, y1: 0, x2: 0, y2: -78 }, svg);
  el('circle', { class: 'pin', r: 6 }, svg);

  let h = 7, m = 0; // h 1-12, m 0-55 (5 minute steps)
  const read = document.getElementById('rt-read');

  function paint() {
    const hDeg = (h % 12) * 30 + m / 2;
    const mDeg = m * 6;
    [hourHand, hourHit].forEach(l => l.setAttribute('transform', `rotate(${hDeg})`));
    [minHand, minHit].forEach(l => l.setAttribute('transform', `rotate(${mDeg})`));
    read.innerHTML = `<time>${digital(h, m)}</time>It’s ${words(h, m)}.`;
  }

  const addMinutes = d => {
    let t = ((h % 12) * 60 + m + d) % 720;
    if (t < 0) t += 720;
    h = Math.floor(t / 60) || 12;
    m = t % 60;
    paint();
    clearFeedback();
  };

  /* ================= dragging the hands ================= */
  let drag = null;
  const angleAt = e => {
    const r = svg.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    return ((Math.atan2(x, -y) * 180 / Math.PI) + 360) % 360;
  };
  svg.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    const a = angleAt(e);
    let which = e.target.dataset?.hand;
    if (!which) {
      // on the face: take the hand closest to the pointer
      const diff = d => Math.min(Math.abs(a - d), 360 - Math.abs(a - d));
      which = diff(m * 6) <= diff((h % 12) * 30 + m / 2) ? 'm' : 'h';
    }
    drag = which;
    box.classList.add('drag');
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
    move(e);
  });
  function move(e) {
    const a = angleAt(e);
    if (drag === 'm') {
      const nm = Math.round(a / 30) * 5 % 60;
      // passing 12 moves the hour too
      if (m >= 45 && nm <= 15) addMinutes(60 - m + nm);
      else if (m <= 15 && nm >= 45) addMinutes(-(m + 60 - nm));
      else addMinutes(nm - m);
    } else {
      const nh = Math.round((a - m / 2) / 30 + 12) % 12 || 12;
      if (nh !== h) { h = nh; paint(); clearFeedback(); }
    }
  }
  svg.addEventListener('pointermove', e => { if (drag) move(e); });
  const stop = () => { drag = null; box.classList.remove('drag'); };
  svg.addEventListener('pointerup', stop);
  svg.addEventListener('pointercancel', stop);

  document.querySelectorAll('.rt-nudge [data-add]').forEach(b => b.addEventListener('click', () => addMinutes(Number(b.dataset.add))));

  /* ================= the games ================= */
  const q = document.getElementById('rt-q');
  const opts = document.getElementById('rt-opts');
  const say = document.getElementById('rt-say');
  const score = document.getElementById('rt-score');
  const checkBtn = document.getElementById('rt-check');
  const nextBtn = document.getElementById('rt-next');
  let mode = 'free', round = [], at = 0, points = 0, answered = false;

  const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  function clearFeedback() { if (mode === 'set' && !answered) { say.textContent = ''; say.className = 'rt-say'; } }
  const sentence = it => `At ${words(it.h, it.m)}, ${it.s}.`;

  function setMode(next) {
    mode = next;
    document.querySelectorAll('.rt-modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
    round = shuffle(LEO); at = 0; points = 0;
    opts.innerHTML = ''; say.textContent = ''; say.className = 'rt-say'; score.textContent = '';
    checkBtn.hidden = true; nextBtn.hidden = true;
    emo.textContent = '';
    if (mode === 'free') {
      q.innerHTML = 'Drag the hands or use the buttons. Say the time: <b>“It’s …”</b> and what you do at that time: <b>“At … I …”</b>';
      return;
    }
    ask();
  }

  function ask() {
    answered = false;
    const it = round[at];
    emo.textContent = it.e;
    say.textContent = ''; say.className = 'rt-say';
    score.textContent = `${at + 1} / ${round.length} · ⭐ ${points}`;
    nextBtn.hidden = true;
    if (mode === 'read') {
      h = it.h; m = it.m; paint();
      q.innerHTML = `<span class="big">${it.e}</span>What time is it? <b>${cap(it.s)}</b> at…`;
      // the right time and two times that are easy to confuse with it
      const near = [[it.h, (it.m + 30) % 60], [it.h % 12 + 1, it.m], [it.h, (it.m + 15) % 60], [it.h, (it.m + 45) % 60], [it.h === 1 ? 12 : it.h - 1, it.m]]
        .map(([a, b]) => words(a, b)).filter(w => w !== words(it.h, it.m));
      const choices = shuffle([words(it.h, it.m), ...shuffle([...new Set(near)]).slice(0, 2)]);
      opts.innerHTML = choices.map(c => `<button type="button">${cap(c)}</button>`).join('');
      opts.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        if (answered) return;
        const ok = b.textContent === cap(words(it.h, it.m));
        b.classList.add(ok ? 'ok' : 'no');
        if (!ok) { say.className = 'rt-say no'; say.textContent = 'Try again!'; return; }
        answered = true;
        points++;
        say.className = 'rt-say';
        say.textContent = `✓ ${sentence(it)}`;
        done();
      }));
      checkBtn.hidden = true;
    } else {
      h = 12; m = 0; paint();
      q.innerHTML = `<span class="big">${it.e}</span>${cap(it.s)} at <b>${words(it.h, it.m)}</b>. Set the clock!`;
      opts.innerHTML = '';
      checkBtn.hidden = false;
    }
  }

  function done() {
    score.textContent = `${at + 1} / ${round.length} · ⭐ ${points}`;
    checkBtn.hidden = true;
    if (at + 1 < round.length) { nextBtn.hidden = false; nextBtn.textContent = 'Next ›'; }
    else { nextBtn.hidden = false; nextBtn.textContent = '↻ Play again'; say.textContent += ` 🎉 ${points} / ${round.length}!`; }
  }

  checkBtn.addEventListener('click', () => {
    const it = round[at];
    if (h === it.h && m === it.m) {
      answered = true;
      points++;
      say.className = 'rt-say';
      say.textContent = `✓ ${sentence(it)}`;
      done();
    } else {
      say.className = 'rt-say no';
      say.textContent = `Not yet: the clock says ${words(h, m)}. Try again!`;
    }
  });
  nextBtn.addEventListener('click', () => {
    if (at + 1 < round.length) { at++; ask(); } else setMode(mode);
  });
  document.querySelectorAll('.rt-modes button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  paint();
  setMode('free');

  /* ================= [ps-routine-linking:R]: missing vowels ================= */
  // type a vowel and the cursor jumps to the next gap
  const gaps = [...document.querySelectorAll('.rt-vowels input.v')];
  gaps.forEach((inp, i) => inp.addEventListener('input', () => {
    if (inp.value.length >= 1 && gaps[i + 1]) gaps[i + 1].focus();
  }));
  gaps.forEach((inp, i) => inp.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !inp.value && gaps[i - 1]) { gaps[i - 1].focus(); }
  }));
})();
