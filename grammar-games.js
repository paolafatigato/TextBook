// Grammar games (from Grammar Base) in a pop-up. It opens by itself when you scroll to the end of
// pp. 20-21 (subject pronouns), 22-23 (to be) and 30-31 (present simple), and a button reopens it.
// Questions and sentences are in grammar-games-data.js.

(() => {
  const { SG_ORDER, SG_APOS, SG_TF, SG_FINAL, SUBJECTS, SF_EASY, SF_MED, SF_HARD, QF_DATA, SCATCH_DATA } = GQ_DATA;

  // spread (data-pages) → the games offered there
  const SETS = {
    '20-21': { title: 'Subject pronouns', intro: 'pp. 18–21 · Scegli un gioco!', games: ['speed', 'subject'] },
    '22-23': { title: 'The verb TO BE', intro: 'pp. 22–23 · Scegli un gioco!', games: ['tobe-rule', 'tobe-fire'] },
    '28-29': { title: 'The Saxon genitive', intro: 'pp. 28–29 · Scegli un gioco!', games: ['sg-order', 'sg-apos', 'sg-tf', 'sg-final'] },
    '30-31': { title: 'Present simple: the -s', intro: 'pp. 30–31 · Scegli un gioco!', games: ['s-rule', 's-catch'] },
  };
  const COLORS = { '20-21': '#4aa8ec', '22-23': '#7b3fc4', '28-29': '#4aa8ec', '30-31': '#c97df6' }; // as the topics on the home page
  const INFO = {
    speed: { icon: '⚡', name: 'Speed Clicker', text: 'Clicca il pronome giusto prima che scompaia. 5 vite!' },
    subject: { icon: '🎯', name: 'Subject Hunter', text: 'Trova il soggetto della frase e scegli il pronome.' },
    'tobe-rule': { icon: '📋', name: 'La Regola', text: 'Completa la tabella di TO BE.' },
    'tobe-fire': { icon: '🔥', name: 'Quick Fire', text: 'am, is o are? Hai 6 secondi per rispondere.' },
    's-rule': { icon: '📋', name: 'La Regola', text: 'Come cambia il verbo con HE / SHE / IT: +s, +es, +ies.' },
    'sg-order': { icon: '🧩', name: 'Word order', text: "Metti in ordine possessore + 's + oggetto." },
    'sg-apos': { icon: '✍️', name: 'The apostrophe', text: "Tocca il punto giusto per l'apostrofo: cousin's o cousins'?" },
    'sg-tf': { icon: '🤔', name: 'Correct or wrong?', text: "'s per persone e animali, OF per le cose." },
    'sg-final': { icon: '🏁', name: 'Final challenge', text: 'Riscrivi 8 frasi con il Saxon genitive (o con of).' },
    's-catch': { icon: '🧲', name: 'Acchiappa il Finale!', text: 'Clicca il finale giusto prima che tocchi terra.' },
  };

  // one colour per pronoun, all from the book's palette
  const PC = { I: '#4aa8ec', you: '#f7836d', he: '#c97df6', she: '#8e2de2', it: '#c9de3c', we: '#3aa04a', they: '#e3b505' };
  const PCT = { I: '#10244f', you: '#4a1308', he: '#2a0f45', she: '#fff', it: '#2a3000', we: '#fff', they: '#3a2b00' };
  const ALL_PRONOUNS = Object.keys(PC);
  const END_COLORS = { s: PC.I, es: PC.he, ies: PC.she, '—': '#dcdff0' };
  const END_TEXT = { s: PCT.I, es: PCT.he, ies: PCT.she, '—': '#4d527e' };
  const ALL_ENDINGS = Object.keys(END_COLORS);

  const $ = id => document.getElementById(id);
  const modal = $('gqModal');
  const area = $('gqArea');
  const fab = $('gqFab');
  const backBtn = $('gqBack');
  const flashEl = $('gqFlash');

  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ================= sounds and effects ================= */

  let audioCtx = null;
  function beep(freq = 440, dur = 0.12, type = 'sine', vol = 0.2) {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch { /* no sound */ }
  }
  const playOk = () => { beep(660, .08); setTimeout(() => beep(880, .12), 70); };
  const playFail = () => beep(220, .25, 'sawtooth', .15);
  const playWin = () => [660, 770, 880, 1100].forEach((f, i) => setTimeout(() => beep(f, .15), i * 80));

  function burst(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('div');
      const a = Math.random() * Math.PI * 2;
      const r = 50 + Math.random() * 80;
      p.className = 'gq-particle';
      p.style.cssText = `left:${x}px;top:${y}px;width:${6 + Math.random() * 6}px;height:${6 + Math.random() * 6}px;background:${color};--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px`;
      document.body.append(p);
      setTimeout(() => p.remove(), 800);
    }
  }
  const burstAt = (el, color) => {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, color);
  };

  function flash(type) {
    flashEl.className = 'gq-flash ' + type;
    void flashEl.offsetWidth; // restart the animation
    flashEl.classList.add('show');
  }
  const good = () => { playOk(); flash('ok'); };
  const bad = () => { playFail(); flash('fail'); };

  /* ================= pop-up frame ================= */

  let cleanup = null;      // stops the running game (timers, animation)
  let section = null;      // the SETS entry that is open

  const setTitle = t => { $('gqTitle').textContent = t; };
  const setScore = (s, m) => { $('gqScore').textContent = s === null ? '' : m ? `⭐ ${s}/${m}` : `⭐ ${s}`; };
  const setLives = (n, max = 3) => { $('gqLives').textContent = n === null ? '' : '❤️'.repeat(Math.max(0, n)) + '🖤'.repeat(Math.max(0, max - n)); };
  const say = (id, cls, html) => { const el = $(id); if (el) el.innerHTML = cls ? `<span class="${cls}">${html}</span>` : html; };
  const dots = (n, at) => Array.from({ length: n }, (_, i) => `<i class="gq-dot${i < at ? ' done' : i === at ? ' curr' : ''}"></i>`).join('');

  // timeouts of a game that was left (menu, close) must not touch the next screen
  let run = 0;
  const wait = (fn, ms) => { const id = run; setTimeout(() => { if (id === run) fn(); }, ms); };

  function stopGame() {
    run++;
    cleanup?.();
    cleanup = null;
  }

  function showMenu() {
    stopGame();
    backBtn.hidden = true;
    setTitle(section.title);
    setScore(null);
    setLives(null);
    area.innerHTML = `<p class="gq-menu-intro">${section.intro}</p><div class="gq-menu">${section.games.map(id => `
      <button type="button" class="gq-game" data-play="${id}">
        <i>${INFO[id].icon}</i><span><b>${INFO[id].name}</b>${INFO[id].text}</span>
      </button>`).join('')}</div>`;
    modal.querySelector('.gq-box').scrollTop = 0;
  }

  function play(id) {
    stopGame();
    backBtn.hidden = false;
    area.innerHTML = '';
    setScore(0);
    setLives(null);
    GAMES[id]();
    modal.querySelector('.gq-box').scrollTop = 0;
  }

  function open(key) {
    section = SETS[key];
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    fab.hidden = true;
    showMenu();
    $('gqClose').focus();
  }

  function close() {
    stopGame();
    modal.hidden = true;
    document.documentElement.classList.remove('gq-open');
    updateFab();
  }

  area.addEventListener('click', e => {
    const b = e.target.closest('[data-play], [data-menu]');
    if (!b) return;
    if (b.dataset.menu !== undefined) showMenu();
    else play(b.dataset.play);
  });
  backBtn.addEventListener('click', showMenu);
  $('gqClose').addEventListener('click', close);
  fab.addEventListener('click', () => open(currentSet().key));

  // while the pop-up is open the arrow keys must not turn the book's pages
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);

  function showResult(score, max, id) {
    const pct = max ? score / max : 1;
    const stars = pct >= .8 ? 3 : pct >= .5 ? 2 : 1;
    const msgs = ['Continua così! Puoi farcela 💪', 'Quasi perfetto! Ancora un po\'! 🌟', 'FANTASTICO! Sei una stella! 🏆'];
    area.innerHTML = `<div class="gq-result">
      <div class="emo">${pct >= .8 ? '🎉' : pct >= .5 ? '😊' : '😅'}</div>
      <h3>${msgs[stars - 1]}</h3>
      <p class="pts">${score} / ${max} risposte corrette</p>
      <div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <div class="gq-row">
        <button type="button" class="gq-btn" data-play="${id}">🔄 Riprova</button>
        <button type="button" class="gq-btn alt" data-menu>🏠 Menu</button>
      </div></div>`;
    if (pct >= .8) playWin(); else playOk();
  }

  /* ================= when to open ================= */

  function currentSet() {
    const s = document.querySelector('.spread.current');
    return s && SETS[s.dataset.pages] ? { spread: s, key: s.dataset.pages } : null;
  }

  const seen = new Set(); // sets that already popped up by themselves

  function updateFab() {
    fab.hidden = !modal.hidden || !currentSet();
  }

  // the student has scrolled to the very end of the page, below the last page of the spread
  const atBottom = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;

  function check() {
    updateFab();
    const cur = currentSet();
    if (!cur || !modal.hidden || seen.has(cur.key)) return;
    if (atBottom() && cur.spread.getBoundingClientRect().bottom <= window.innerHeight) {
      seen.add(cur.key);
      open(cur.key);
    }
  }

  let queued = false;
  const later = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; check(); });
  };
  window.addEventListener('scroll', later, { passive: true });
  window.addEventListener('wheel', e => { if (e.deltaY > 0) later(); }, { passive: true });
  window.addEventListener('resize', later);
  document.addEventListener('spreadchange', later);

  /* ================= the games ================= */

  const GAMES = {};

  /* ---------- Speed Clicker: click the pronoun for the subject ---------- */
  GAMES.speed = () => {
    setTitle('⚡ Speed Clicker');
    const subjects = shuffle(SUBJECTS);
    let subIdx = 0, score = 0, attempts = 0, speed = 130, lives = 5, elapsed = 0;
    let raf = null, timer = null, active = false, bubbles = [];
    let curr = subjects[0];
    setLives(lives, 5);

    area.innerHTML = `<div class="gq-card">
      <p class="gq-instr">Il soggetto è mostrato sopra. <span>Clicca il pronome corretto</span> prima che scompaia!<br>
      <em>Hai 5 vite – quanto riesci ad andare avanti? 🏆</em></p>
      <div class="gq-big" id="gqSpeedWord">${curr.emoji} ${curr.word} → ?</div>
      <div class="gq-arena" id="gqSpeedArena"></div>
      <div class="gq-meta"><span>⏱ <b id="gqSpeedTime">0</b>s</span><span>🚀 velocità: <b id="gqSpeedX">1.0</b>x</span></div></div>`;
    const arena = $('gqSpeedArena');

    function spawn() {
      bubbles.forEach(b => b.el.remove());
      const h = arena.clientHeight || 180;
      bubbles = shuffle(ALL_PRONOUNS).map((p, i) => {
        const el = document.createElement('div');
        el.className = 'gq-bubble';
        el.textContent = p;
        el.style.background = PC[p];
        el.style.color = PCT[p];
        el.style.top = Math.round(12 + (h - 50) * Math.random()) + 'px';
        const x = arena.clientWidth + 20 + i * 60;
        el.style.left = x + 'px';
        el.addEventListener('click', () => pick(p, el));
        arena.append(el);
        return { el, x, active: true };
      });
    }

    function pick(p, el) {
      if (!active) return;
      attempts++;
      const right = curr.pronouns || [curr.pronoun];
      if (right.includes(p)) {
        score++;
        setScore(score);
        good();
        burstAt(el, PC[p]);
        speed = Math.min(speed + 8, 440);
        $('gqSpeedX').textContent = (speed / 130).toFixed(1);
        curr = subjects[++subIdx % subjects.length];
        $('gqSpeedWord').textContent = `${curr.emoji} ${curr.word} → ?`;
        spawn();
      } else {
        lives--;
        setLives(lives, 5);
        bad();
        el.style.background = '#d6453d';
        el.style.color = '#fff';
        wait(() => { el.style.background = PC[p]; el.style.color = PCT[p]; }, 350);
        if (lives <= 0) wait(end, 400);
      }
    }

    let last = 0;
    function loop(t) {
      if (!active) return;
      const dt = Math.min((t - last) / 1000, .05);
      last = t;
      bubbles.forEach(b => {
        if (!b.active) return;
        b.x -= speed * dt;
        b.el.style.left = b.x + 'px';
        if (b.x < -110) { b.active = false; b.el.remove(); }
      });
      if (bubbles.every(b => !b.active)) spawn();
      raf = requestAnimationFrame(loop);
    }

    function stop() {
      active = false;
      cancelAnimationFrame(raf);
      clearInterval(timer);
    }
    function end() {
      if (!active) return;
      stop();
      showResult(score, Math.max(attempts, score), 'speed');
    }

    active = true;
    spawn();
    last = performance.now();
    raf = requestAnimationFrame(loop);
    timer = setInterval(() => {
      $('gqSpeedTime').textContent = ++elapsed;
      if (elapsed >= 300) end();
    }, 1000);
    cleanup = stop;
  };

  /* ---------- Subject Hunter: find the subject, then its pronoun ---------- */
  GAMES.subject = () => {
    setTitle('🎯 Subject Hunter');
    let data = null, qi = 0, score = 0, dif = 'easy', answered = false, missed = false;

    const total = () => data.length * 2; // one point for the subject, one for the pronoun

    area.innerHTML = `<div class="gq-card" style="text-align:center">
      <p class="gq-instr">Clicca sul <span>gruppo di parole che fa da soggetto</span> della frase.<br>
      Poi scegli il <span>pronome corretto</span>! (⭐ 1 punto a step)<br>
      Scegli il livello di difficoltà!</p>
      <div class="gq-difs">
        <button type="button" class="gq-dif easy" data-dif="easy">⭐ Facile<small>Soggetto sempre all'inizio</small></button>
        <button type="button" class="gq-dif med" data-dif="med">⭐⭐ Medio<small>Frasi più lunghe, soggetto non sempre primo</small></button>
        <button type="button" class="gq-dif hard" data-dif="hard">⭐⭐⭐ Difficile<small>Parola per parola: seleziona solo il soggetto!</small></button>
      </div></div>`;
    area.querySelectorAll('[data-dif]').forEach(b => b.addEventListener('click', () => {
      dif = b.dataset.dif;
      data = shuffle({ easy: SF_EASY, med: SF_MED, hard: SF_HARD }[dif]);
      qi = 0;
      score = 0;
      setScore(0, total());
      next();
    }));

    function next() {
      if (qi >= data.length) { showResult(score, total(), 'subject'); return; }
      answered = false;
      missed = false;
      if (dif === 'hard') hardQuestion(data[qi]); else groupQuestion(data[qi]);
    }

    const frame = (instr, step, body) => `<div class="gq-card">
      <p class="gq-instr">${instr}</p>
      <div class="gq-count">${qi + 1} / ${data.length} – step ${step}</div>
      <div class="gq-prog">${dots(data.length, qi)}</div>${body}</div>`;

    // step 2 (all levels): the pronoun
    function pronounStep(q, subjectText) {
      const choices = shuffle([q.pronoun, ...shuffle(ALL_PRONOUNS.filter(p => p !== q.pronoun)).slice(0, 3)]);
      area.innerHTML = `<div class="gq-card">
        <p class="gq-instr">Bene! Ora scegli il <span>pronome soggetto</span> corretto per:<br><em style="font-size:18px">“${subjectText}”</em></p>
        <div class="gq-count">${qi + 1} / ${data.length} – step 2</div>
        <div class="gq-choices" id="gqChoices"></div><div class="gq-fb" id="gqFb"></div></div>`;
      const box = $('gqChoices');
      choices.forEach(p => {
        const b = document.createElement('button');
        b.className = 'gq-choice';
        b.style.background = PC[p];
        b.style.color = PCT[p];
        b.textContent = p;
        b.addEventListener('click', () => {
          if (box.dataset.done) return;
          box.dataset.done = '1';
          if (p === q.pronoun) {
            b.classList.add('c-ok');
            score++;
            setScore(score, total());
            good();
            burstAt(b, PC[p]);
            say('gqFb', 'ok', `✅ Corretto! ${q.pronoun} – perfetto!`);
            wait(() => { qi++; next(); }, 750);
          } else {
            b.classList.add('c-fail');
            box.querySelectorAll('.gq-choice').forEach(x => { if (x.textContent === q.pronoun) x.classList.add('c-ok'); });
            bad();
            say('gqFb', 'no', `❌ Sbagliato! Il pronome corretto era: <strong>${q.pronoun}</strong>`);
            wait(() => { qi++; next(); }, 1200);
          }
        });
        box.append(b);
      });
    }

    // easy and medium: click the group of words
    function groupQuestion(q) {
      area.innerHTML = frame(`Clicca sul <span>gruppo di parole soggetto</span>! Chi o cosa compie l'azione?<br><em>Hint: ${q.hint}</em>`, 1,
        '<div class="gq-sent" id="gqSent"></div><div class="gq-hint" id="gqHint">&nbsp;</div>');
      q.groups.forEach((grp, gi) => {
        const w = document.createElement('div');
        w.className = 'gq-word';
        w.textContent = grp.join(' ');
        w.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          if (gi === q.si) {
            w.classList.add('ok');
            if (!missed) score++;
            setScore(score, total());
            good();
            burstAt(w, PC.she);
            say('gqHint', missed ? 'warn' : 'ok', missed
              ? '✅ Trovato! Ma hai sbagliato prima – nessun punto. Ora scegli il pronome!'
              : '✅ Corretto! Ora scegli il pronome!');
            wait(() => pronounStep(q, q.groups[q.si].join(' ')), 700);
          } else {
            missed = true;
            w.classList.add('fail', 'shake');
            bad();
            say('gqHint', 'no', '❌ Sbagliato! Nessun punto se sbagli. Riprova!');
            wait(() => { w.classList.remove('fail', 'shake'); answered = false; }, 700);
          }
        });
        $('gqSent').append(w);
      });
    }

    // hard: click every word of the subject, then confirm
    function hardQuestion(q) {
      const subject = new Set(q.subject);
      const picked = new Set();
      area.innerHTML = frame(`Clicca su <span>tutte e sole le parole del soggetto</span>, poi premi ➡️ Avanti!<br><em>${q.hint}</em>`, 1,
        `<div class="gq-sent" id="gqSent"></div><div class="gq-hint" id="gqHint">&nbsp;</div>
         <div class="gq-row"><button type="button" class="gq-btn" id="gqConfirm">➡️ Avanti</button></div>`);
      const sent = $('gqSent');
      q.words.forEach((word, idx) => {
        const w = document.createElement('div');
        w.className = 'gq-word';
        w.textContent = word;
        w.addEventListener('click', () => {
          if (answered) return;
          if (picked.delete(idx)) w.classList.remove('sel');
          else { picked.add(idx); w.classList.add('sel'); }
        });
        sent.append(w);
      });
      $('gqConfirm').addEventListener('click', () => {
        if (answered) return;
        if (!picked.size) { say('gqHint', 'warn', '⚠️ Seleziona almeno una parola prima di confermare!'); return; }
        answered = true;
        const right = picked.size === subject.size && [...picked].every(i => subject.has(i));
        const subjectText = q.subject.map(i => q.words[i]).join(' ');
        sent.querySelectorAll('.gq-word').forEach((w, idx) => {
          w.classList.remove('sel');
          if (subject.has(idx)) w.classList.add('ok');
          else if (!right && picked.has(idx)) w.classList.add('fail');
        });
        if (right) {
          score++;
          setScore(score, total());
          good();
          burstAt(sent, PC.she);
          say('gqHint', 'ok', '✅ Perfetto! Ora scegli il pronome!');
          wait(() => pronounStep(q, subjectText), 700);
        } else {
          bad();
          say('gqHint', 'no', '❌ Non esatto! Verde = soggetto corretto. Ora prova il pronome!');
          wait(() => pronounStep(q, subjectText), 2000);
        }
      });
    }
  };

  /* ---------- TO BE: fill the table ---------- */
  GAMES['tobe-rule'] = () => {
    setTitle('📋 TO BE – La Regola');
    const rows = [
      { who: 'I', aff: 'am', neg: 'am not', int: 'Am I…?' },
      { who: 'you', aff: 'are', neg: 'aren\'t', int: 'Are you…?' },
      { who: 'he / she / it', aff: 'is', neg: 'isn\'t', int: 'Is he/she/it…?' },
      { who: 'we / they', aff: 'are', neg: 'aren\'t', int: 'Are we/they…?' },
    ];
    const words = ['am', 'is', 'are', 'am not', 'isn\'t', 'aren\'t'];
    let selected = null, filled = 0;

    area.innerHTML = `<div class="gq-card">
      <p class="gq-instr"><span>1. Clicca una parola dalla banca.</span> 2. Clicca sulla casella vuota.<br>
      <em>Select a word from the bank, then click the empty cell to fill it in.</em></p>
      <div class="gq-bank" id="gqBank"></div>
      <table class="gq-tbl"><thead><tr><th>Pronome</th><th>✅ Affermativa</th><th>❌ Negativa</th><th>❓ Interrogativa</th></tr></thead>
        <tbody>${rows.map((r, i) => `<tr><td class="who">${r.who}</td>
          <td class="blank" data-row="${i}" data-col="aff">?</td><td class="blank" data-row="${i}" data-col="neg">?</td>
          <td class="dim">${r.int}</td></tr>`).join('')}</tbody></table>
      <div class="gq-row"><button type="button" class="gq-btn" id="gqCheck" hidden>✅ Controlla!</button></div>
      <div class="gq-fb" id="gqFb"></div></div>`;

    const chips = words.map(w => {
      const c = document.createElement('div');
      c.className = 'gq-chip' + (/not|'t/.test(w) ? ' neg' : '');
      c.textContent = w;
      c.addEventListener('click', () => {
        chips.forEach(x => x.classList.remove('sel'));
        c.classList.add('sel');
        selected = w;
      });
      $('gqBank').append(c);
      return c;
    });

    area.querySelectorAll('.blank').forEach(cell => cell.addEventListener('click', () => {
      if (!selected) return;
      if (!cell.classList.contains('filled')) filled++;
      cell.textContent = selected;
      cell.classList.remove('ok', 'wrong');
      cell.classList.add('filled');
      selected = null;
      chips.forEach(x => x.classList.remove('sel'));
      $('gqCheck').hidden = filled < rows.length * 2;
    }));

    $('gqCheck').addEventListener('click', () => {
      let ok = 0;
      area.querySelectorAll('.blank').forEach(cell => {
        const right = rows[cell.dataset.row][cell.dataset.col];
        cell.classList.remove('ok', 'wrong');
        const hit = cell.textContent === right;
        cell.classList.add(hit ? 'ok' : 'wrong');
        if (hit) ok++;
      });
      if (ok === rows.length * 2) { say('gqFb', 'ok', '🎉 PERFETTO! You\'ve mastered TO BE!'); playWin(); }
      else { say('gqFb', 'no', `${ok}/${rows.length * 2} corretti. Le celle rosse sono sbagliate, riprova!`); playFail(); }
    });
  };

  /* ---------- TO BE: choose am / is / are against the clock ---------- */
  GAMES['tobe-fire'] = () => {
    setTitle('🔥 TO BE – Quick Fire');
    const questions = shuffle(QF_DATA).slice(0, 14);
    const SECONDS = 6;
    const cols = [PC.I, PC.he, PC.she];
    const text = [PCT.I, PCT.he, PCT.she];
    let qi = 0, score = 0, t = SECONDS, answered = false, timer = null;
    setScore(0, questions.length);

    function render() {
      if (qi >= questions.length) { showResult(score, questions.length, 'tobe-fire'); return; }
      answered = false;
      t = SECONDS;
      const q = questions[qi];
      area.innerHTML = `<div class="gq-card">
        <p class="gq-instr">Scegli la forma giusta di TO BE! <span>${qi + 1}/${questions.length}</span></p>
        <div class="gq-timer"><i id="gqBar"></i></div>
        <div class="gq-gapline"><b>${q.pre}</b><span class="gq-gap" id="gqGap">___</span><span>${q.post}</span></div>
        <div class="gq-choices" id="gqChoices"></div><div class="gq-fb" id="gqFb"></div></div>`;
      shuffle(q.opts).forEach((o, i) => {
        const b = document.createElement('button');
        b.className = 'gq-choice';
        b.style.background = cols[i];
        b.style.color = text[i];
        b.textContent = o;
        b.addEventListener('click', () => answer(o, b));
        $('gqChoices').append(b);
      });
      clearInterval(timer);
      timer = setInterval(() => {
        t--;
        const bar = $('gqBar');
        if (bar) {
          bar.style.width = (t / SECONDS * 100) + '%';
          bar.style.background = t > 3 ? 'var(--gq-purple)' : t > 1 ? 'var(--gq-coral)' : 'var(--gq-fail)';
        }
        if (t <= 0 && !answered) {
          answered = true;
          clearInterval(timer);
          reveal(q);
          say('gqFb', 'no', `⏱ Tempo scaduto! Risposta: <strong>${q.ans}</strong>`);
          bad();
          wait(() => { qi++; render(); }, 1000);
        }
      }, 1000);
    }

    function reveal(q) {
      const gap = $('gqGap');
      gap.textContent = q.ans;
      gap.style.color = 'var(--gq-ok)';
    }

    function answer(ans, btn) {
      if (answered) return;
      answered = true;
      clearInterval(timer);
      const q = questions[qi];
      reveal(q);
      if (ans === q.ans) {
        btn.classList.add('c-ok');
        score++;
        setScore(score, questions.length);
        good();
        say('gqFb', 'ok', '✅ Corretto! / Correct!');
        burstAt(btn, PC.we);
        wait(() => { qi++; render(); }, 650);
      } else {
        btn.classList.add('c-fail');
        bad();
        say('gqFb', 'no', `❌ Risposta corretta: <strong>${q.ans}</strong>`);
        wait(() => { qi++; render(); }, 1000);
      }
    }

    render();
    cleanup = () => clearInterval(timer);
  };

  /* ---------- present simple: the -s rule ---------- */
  GAMES['s-rule'] = () => {
    setTitle('📋 La -S – La Regola');
    const rules = [
      { ending: 'la maggior parte dei verbi', examples: 'play → plays,  read → reads', ans: '+s' },
      { ending: '-sh, -ch, -o, -x, -ss', examples: 'watch → watches,  go → goes', ans: '+es' },
      { ending: 'consonante + -y (togli la -y)', examples: 'study → studies,  fly → flies', ans: '+ies' },
    ];
    const practice = [
      { s: 'she', v: 'play', a: 'plays' }, { s: 'he', v: 'watch', a: 'watches' }, { s: 'it', v: 'study', a: 'studies' },
      { s: 'she', v: 'go', a: 'goes' }, { s: 'he', v: 'eat', a: 'eats' }, { s: 'it', v: 'fly', a: 'flies' },
      { s: 'she', v: 'teach', a: 'teaches' }, { s: 'he', v: 'try', a: 'tries' },
    ];
    let selected = null, filled = 0;

    area.innerHTML = `<div class="gq-card">
      <p class="gq-instr">Con HE/SHE/IT il verbo cambia! <span>Seleziona un finale dalla banca e clicca la casella.</span><br>
      <em>With HE/SHE/IT the verb spelling changes. Select an ending then click the blank cell.</em></p>
      <div class="gq-bank" id="gqBank"></div>
      <table class="gq-tbl"><thead><tr><th>Finisce in…</th><th>Regola (HE/SHE/IT)</th><th>Esempi</th></tr></thead>
        <tbody>${rules.map((r, i) => `<tr><td class="dim">${r.ending}</td><td class="blank" data-i="${i}">?</td><td class="dim"><i>${r.examples}</i></td></tr>`).join('')}</tbody></table>
      <div class="gq-row"><button type="button" class="gq-btn" id="gqCheck" hidden>✅ Controlla!</button></div>
      <div class="gq-fb" id="gqFb"></div></div>
      <div class="gq-card">
        <p class="gq-practice-title">✏️ Pratica! Scrivi la forma HE/SHE/IT:</p>
        ${practice.map((p, i) => `<div class="gq-prow"><b>${p.s}</b><span>+ ${p.v} =</span>
          <input class="gq-input" data-i="${i}" type="text" placeholder="?" autocomplete="off" autocapitalize="off" spellcheck="false"></div>`).join('')}
      </div>`;

    const chips = ['+s', '+es', '+ies'].map(w => {
      const c = document.createElement('div');
      c.className = 'gq-chip';
      c.textContent = w;
      c.addEventListener('click', () => {
        chips.forEach(x => x.classList.remove('sel'));
        c.classList.add('sel');
        selected = w;
      });
      $('gqBank').append(c);
      return c;
    });

    area.querySelectorAll('.blank').forEach(cell => cell.addEventListener('click', () => {
      if (!selected) return;
      if (!cell.classList.contains('filled')) filled++;
      cell.textContent = selected;
      cell.classList.remove('ok', 'wrong');
      cell.classList.add('filled');
      selected = null;
      chips.forEach(x => x.classList.remove('sel'));
      $('gqCheck').hidden = filled < rules.length;
    }));

    $('gqCheck').addEventListener('click', () => {
      let ok = 0;
      area.querySelectorAll('.blank').forEach(cell => {
        const hit = cell.textContent === rules[cell.dataset.i].ans;
        cell.classList.remove('ok', 'wrong');
        cell.classList.add(hit ? 'ok' : 'wrong');
        if (hit) ok++;
      });
      if (ok === rules.length) { say('gqFb', 'ok', '🎉 PERFETTO! Hai capito la regola dello spelling!'); playWin(); }
      else { say('gqFb', 'no', `${ok}/${rules.length} corretti – controlla le celle rosse!`); playFail(); }
    });

    area.querySelectorAll('.gq-input').forEach(inp => inp.addEventListener('input', () => {
      const right = inp.value.toLowerCase().trim() === practice[inp.dataset.i].a;
      inp.classList.toggle('ok', right);
      if (right) playOk();
    }));
  };

  /* ---------- present simple: catch the right ending before it falls ---------- */
  GAMES['s-catch'] = () => {
    setTitle('🧲 Acchiappa il Finale!');
    const ROUND = 12;
    let qs = shuffle(SCATCH_DATA).slice(0, ROUND);
    let qi = 0, score = 0, lives = 5, played = 0;
    let raf = null, active = false, locked = false, falling = [];
    setScore(0);
    setLives(lives, 5);

    area.innerHTML = `<div class="gq-card">
      <p class="gq-instr">Clicca sul <span>finale corretto</span> prima che tocchi terra!<br><em>— significa "nessuna S necessaria" (forma base)</em></p>
      <div class="gq-prog" id="gqProg">${dots(qs.length, 0)}</div>
      <div class="gq-arena" id="gqCatchArena"><div class="gq-target" id="gqTarget"></div></div></div>`;
    const arena = $('gqCatchArena');

    const clearFalling = () => { falling.forEach(f => f.el.remove()); falling = []; };
    const stop = () => { active = false; cancelAnimationFrame(raf); };
    const progress = () => { $('gqProg').innerHTML = dots(qs.length, qi); };

    function gameOver() {
      stop();
      clearFalling();
      showResult(score, Math.max(played, score), 's-catch');
    }

    // the round is over (right, wrong or too late): go on with the next word
    function nextRound() {
      qi++;
      played++;
      if (qi >= qs.length) { qs = shuffle(SCATCH_DATA).slice(0, ROUND); qi = 0; }
      progress();
      startRound();
    }

    function missed(q) {
      lives--;
      setLives(lives, 5);
      bad();
      if (lives <= 0) { played++; gameOver(); return; }
      const ov = document.createElement('div');
      ov.className = 'gq-reveal';
      ov.innerHTML = `<div class="t">❌ Non corretto! La risposta giusta era:</div>
        <div class="a">${q.correct === '—' ? '—' : '+' + q.correct}</div>
        <div class="w">${q.verb} → <strong>${q.result}</strong></div>
        <div class="r">📚 Regola: ${q.rule}</div>`;
      arena.append(ov);
      wait(() => { ov.remove(); nextRound(); }, 2200);
    }

    function startRound() {
      locked = false;
      const q = qs[qi];
      $('gqTarget').innerHTML = `<span class="who">${q.sub}</span> ${q.verb}<span class="end" id="gqEnd"></span> <span class="eq">= ?</span>`;
      clearFalling();
      const w = arena.clientWidth || 360;
      const slot = Math.floor(w / ALL_ENDINGS.length);
      shuffle(ALL_ENDINGS).forEach((end, i) => {
        const el = document.createElement('div');
        el.className = 'gq-ending';
        el.textContent = end;
        el.style.background = END_COLORS[end];
        el.style.color = END_TEXT[end];
        el.style.left = clamp(slot * i + Math.floor((slot - 72) / 2), 4, w - 76) + 'px';
        el.style.top = '-76px';
        el.addEventListener('click', () => pick(end, el, q));
        arena.append(el);
        falling.push({ el, y: -76, speed: 78 + Math.random() * 28 + qi * 5 + Math.max(0, played - 20) * 3 });
      });
      active = true;
      let last = performance.now();
      const loop = now => {
        if (!active) return;
        const dt = Math.min((now - last) / 1000, .05);
        last = now;
        const floor = (arena.clientHeight || 380) - 90;
        for (const f of falling) {
          f.y += f.speed * dt;
          f.el.style.top = f.y + 'px';
          if (f.y >= floor && !locked) {
            // something reached the ground: the round is lost
            locked = true;
            stop();
            clearFalling();
            missed(q);
            return;
          }
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    function pick(end, el, q) {
      if (locked) return;
      locked = true;
      stop();
      el.classList.add('exploding');
      if (end === q.correct) {
        const slot = $('gqEnd');
        if (slot) slot.textContent = end === '—' ? '' : end;
        score++;
        setScore(score);
        good();
        burstAt(el, END_COLORS[end]);
        wait(() => { clearFalling(); nextRound(); }, 550);
      } else {
        wait(() => { clearFalling(); missed(q); }, 400);
      }
    }

    startRound();
    cleanup = () => { stop(); clearFalling(); };
  };

  /* ---------- Saxon genitive: shared helpers ---------- */
  const isMark = t => t === "'s" || t === "'";
  const joinTokens = tokens => tokens.reduce((out, t, i) => (i === 0 ? t : isMark(t) ? out + t : out + ' ' + t), '');
  const normalize = s => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim();
  const speak = text => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB';
      u.rate = .92;
      speechSynthesis.speak(u);
    } catch { /* no voice */ }
  };

  // the feedback box under a round: a line and an explanation
  const note = (cls, line, expl = '') => `<div class="gq-note ${cls}"><b>${line}</b>${expl ? `<span>${expl}</span>` : ''}</div>`;
  const nextBtn = (last, extra = '') => `<div class="gq-row"><button type="button" class="gq-btn" id="gqNext">${last ? 'See your results →' : 'Next →'}</button>${extra}</div>`;

  // put the words in order: tap a word to place it, tap it again to take it back
  function wordOrder(box, tokens, { onAttempt, onSuccess, onWrong }) {
    const items = shuffle(tokens.map((text, oi) => ({ text, oi })));
    let answer = [], locked = false, scored = false;
    box.innerHTML = '<div class="gq-zone empty"></div><div class="gq-tokbank"></div>';
    const zone = box.firstElementChild, bank = box.lastElementChild;
    const tok = (it, placed) => `<button type="button" class="gq-tok${isMark(it.text) ? ' mark' : ''}${placed ? ' placed' : ''}" data-oi="${it.oi}">${it.text}</button>`;

    function draw() {
      zone.classList.toggle('empty', !answer.length);
      zone.innerHTML = answer.map(it => tok(it, true)).join('');
      const used = new Set(answer.map(a => a.oi));
      bank.innerHTML = items.filter(it => !used.has(it.oi)).map(it => tok(it, false)).join('');
    }
    box.addEventListener('click', e => {
      const b = e.target.closest('.gq-tok');
      if (!b || locked) return;
      const oi = +b.dataset.oi;
      if (b.classList.contains('placed')) answer = answer.filter(a => a.oi !== oi);
      else answer.push(items.find(it => it.oi === oi));
      draw();
      if (answer.length === tokens.length) check();
    });
    function check() {
      const ok = answer.every((a, i) => a.oi === i);
      if (!scored) { scored = true; onAttempt?.(ok); }
      if (ok) { locked = true; onSuccess(); }
      else onWrong(() => { answer = []; draw(); });
    }
    draw();
  }

  /* ---------- Saxon genitive: put the words in order ---------- */
  GAMES['sg-order'] = () => {
    setTitle('🧩 Saxon genitive – Word order');
    const rounds = shuffle(SG_ORDER).slice(0, 8);
    let idx = 0, score = 0;
    setScore(0, rounds.length);

    function round() {
      if (idx >= rounds.length) { showResult(score, rounds.length, 'sg-order'); return; }
      const r = rounds[idx];
      const sentence = joinTokens(r.tokens) + '.';
      area.innerHTML = `<div class="gq-card">
        <p class="gq-instr">Metti le parole <span>in ordine</span>: prima il possessore, poi 's, poi l'oggetto!</p>
        <div class="gq-count">${idx + 1} / ${rounds.length}</div>
        <div class="gq-prog">${dots(rounds.length, idx)}</div>
        <div id="gqOrder"></div><div id="gqNoteBox"></div></div>`;
      wordOrder($('gqOrder'), r.tokens, {
        onAttempt: ok => { if (ok) { score++; setScore(score, rounds.length); } },
        onSuccess: () => {
          good();
          $('gqNoteBox').innerHTML = note('good', '✅ Correct!', sentence) +
            nextBtn(idx + 1 >= rounds.length, '<button type="button" class="gq-btn alt" id="gqSay">🔊 Listen</button>');
          $('gqNext').onclick = () => { idx++; round(); };
          $('gqSay').onclick = () => speak(sentence);
        },
        onWrong: reset => {
          bad();
          $('gqNoteBox').innerHTML = note('bad', "❌ Not quite, the order isn't right.", 'Tocca le parole nella frase per toglierle e riprova!') +
            '<div class="gq-row"><button type="button" class="gq-btn coral" id="gqRetry">🔁 Clear and try again</button></div>';
          $('gqRetry').onclick = () => { $('gqNoteBox').innerHTML = ''; reset(); };
        },
      });
    }
    round();
  };

  /* ---------- Saxon genitive: tap where the apostrophe goes ---------- */
  GAMES['sg-apos'] = () => {
    setTitle('✍️ Saxon genitive – The apostrophe');
    const rounds = SG_APOS;
    let idx = 0, score = 0, timer = null, anims = [];
    setScore(0, rounds.length);

    // every word is a row of letters with a clickable spot before, between and after them
    const sentenceHTML = words => words.map((w, wi) => {
      const spots = [...w].map((ch, g) => `<span class="gq-spot" data-w="${wi}" data-g="${g}" tabindex="0"></span><span class="gq-letter">${ch}</span>`).join('');
      return spots + `<span class="gq-spot" data-w="${wi}" data-g="${w.length}" tabindex="0"></span>` + (wi < words.length - 1 ? '<span class="gq-wspace"></span>' : '');
    }).join('');
    const revealHTML = (words, tw, cg) => words.map((w, wi) => {
      const letters = [...w].map((ch, g) => (wi === tw && g === cg ? '<span class="gq-letter mark">\'</span>' : '') + `<span class="gq-letter">${ch}</span>`).join('');
      return letters + (wi === tw && cg === w.length ? '<span class="gq-letter mark">\'</span>' : '') + (wi < words.length - 1 ? '<span class="gq-wspace"></span>' : '');
    }).join('');

    function round() {
      if (idx >= rounds.length) { showResult(score, rounds.length, 'sg-apos'); return; }
      const r = rounds[idx];
      let answered = false;
      area.innerHTML = `<div class="gq-card">
        <p class="gq-instr">Tocca il punto giusto per aggiungere <span>l'apostrofo</span>!</p>
        <div class="gq-count">${idx + 1} / ${rounds.length}</div>
        <div class="gq-prog">${dots(rounds.length, idx)}</div>
        <div class="gq-context">${r.context}</div>
        <div class="gq-timer"><i id="gqBar"></i></div>
        <div class="gq-trackbox"><div class="gq-track" id="gqTrack">${sentenceHTML(r.words)}</div></div>
        <p class="gq-instr" style="font-size:14px">La frase scorre lentamente: trova la parola giusta e tocca dove va l'apostrofo!</p>
        <div id="gqNoteBox"></div></div>`;
      const track = $('gqTrack');
      const ms = r.duration * 1000;
      anims = [
        track.animate([{ left: '100%' }, { left: '-100%' }], { duration: ms, easing: 'linear', fill: 'forwards' }),
        $('gqBar').animate([{ width: '100%' }, { width: '0%' }], { duration: ms, easing: 'linear', fill: 'forwards' }),
      ];
      timer = setTimeout(() => finish(false), ms + 150);

      track.querySelectorAll('.gq-spot').forEach(g => g.addEventListener('click', () => {
        if (!answered) finish(+g.dataset.w === r.targetWord && +g.dataset.g === r.correctGap);
      }));

      function finish(ok) {
        answered = true;
        clearTimeout(timer);
        track.style.left = getComputedStyle(track).left; // stop where it is
        anims.forEach(a => a.cancel());
        $('gqBar').style.width = '0%';
        if (ok) { score++; setScore(score, rounds.length); good(); } else bad();
        track.innerHTML = revealHTML(r.words, r.targetWord, r.correctGap);
        $('gqNoteBox').innerHTML = note(ok ? 'good' : 'bad', ok ? '✅ Correct!' : "❌ Almost! Here's the right spot:", r.explanation) + nextBtn(idx + 1 >= rounds.length);
        $('gqNext').onclick = () => { idx++; round(); };
      }
    }
    round();
    cleanup = () => { clearTimeout(timer); anims.forEach(a => a.cancel()); };
  };

  /* ---------- Saxon genitive: correct or wrong? ---------- */
  GAMES['sg-tf'] = () => {
    setTitle('🤔 Saxon genitive – Correct or wrong?');
    const rounds = shuffle(SG_TF).slice(0, 10);
    let idx = 0, score = 0;
    setScore(0, rounds.length);

    function round() {
      if (idx >= rounds.length) { showResult(score, rounds.length, 'sg-tf'); return; }
      const r = rounds[idx];
      area.innerHTML = `<div class="gq-card">
        <p class="gq-instr">La frase è <span>corretta</span> o <span>sbagliata</span>? (cose → OF, persone e animali → 's)</p>
        <div class="gq-count">${idx + 1} / ${rounds.length}</div>
        <div class="gq-prog">${dots(rounds.length, idx)}</div>
        <div class="gq-sentence">${r.sentence}</div>
        <div class="gq-row"><button type="button" class="gq-btn lime" data-tf="1">✅ Correct</button><button type="button" class="gq-btn coral" data-tf="0">❌ Wrong</button></div>
        <div id="gqNoteBox"></div></div>`;
      area.querySelectorAll('[data-tf]').forEach(b => b.addEventListener('click', () => {
        const ok = (b.dataset.tf === '1') === r.isTrue;
        area.querySelectorAll('[data-tf]').forEach(x => { x.disabled = true; });
        if (ok) { score++; setScore(score, rounds.length); good(); } else bad();
        $('gqNoteBox').innerHTML = note(ok ? 'good' : 'bad', ok ? '✅ Correct!' : r.isTrue ? '❌ It is actually CORRECT.' : '❌ It is actually WRONG.', r.explanation) + nextBtn(idx + 1 >= rounds.length);
        $('gqNext').onclick = () => { idx++; round(); };
      }));
    }
    round();
  };

  /* ---------- Saxon genitive: final challenge, rewrite the sentence ---------- */
  GAMES['sg-final'] = () => {
    setTitle('🏁 Saxon genitive – Final challenge');
    const rounds = shuffle(SG_FINAL);
    let idx = 0, score = 0;
    setScore(0, rounds.length);

    function round() {
      if (idx >= rounds.length) { showResult(score, rounds.length, 'sg-final'); return; }
      const r = rounds[idx];
      const right = joinTokens(r.tokens) + '.';
      let scored = false, hinted = false, locked = false;
      area.innerHTML = `<div class="gq-card">
        <p class="gq-instr">Riscrivi in inglese con il <span>Saxon genitive</span> (o con <span>of</span>)</p>
        <div class="gq-count">${idx + 1} / ${rounds.length}</div>
        <div class="gq-prog">${dots(rounds.length, idx)}</div>
        <div class="gq-sentence">${r.prompt}</div>
        <div id="gqAnswer">
          <input type="text" class="gq-text" id="gqText" placeholder="Type your sentence here..." autocomplete="off" autocapitalize="off" spellcheck="false">
          <div class="gq-row"><button type="button" class="gq-btn" id="gqCheckBtn">✅ Check</button><button type="button" class="gq-btn alt" id="gqHint">💡 Hint</button></div>
        </div>
        <div id="gqNoteBox"></div></div>`;
      const input = $('gqText');

      function success() {
        locked = true;
        good();
        $('gqNoteBox').innerHTML = note('good', hinted ? '👍 Sentence completed with the hint.' : '✅ Correct!', `${right}<br><em>${r.note}</em>`) + nextBtn(idx + 1 >= rounds.length);
        $('gqNext').onclick = () => { idx++; round(); };
      }
      function check() {
        if (locked || !input.value.trim()) return;
        const ok = normalize(input.value) === normalize(right);
        if (!scored) { scored = true; if (ok && !hinted) { score++; setScore(score, rounds.length); } }
        if (ok) { input.disabled = true; $('gqCheckBtn').disabled = true; $('gqHint').disabled = true; success(); }
        else { bad(); $('gqNoteBox').innerHTML = note('bad', '❌ Not quite right yet.', "Controlla l'ordine delle parole e l'apostrofo, poi riprova o chiedi un aiuto."); }
      }
      $('gqCheckBtn').onclick = check;
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      $('gqHint').onclick = () => {
        if (locked) return;
        hinted = true;
        scored = true;
        $('gqNoteBox').innerHTML = '';
        $('gqAnswer').innerHTML = '<p class="gq-instr">💡 Metti le parole in ordine:</p><div id="gqHintOrder"></div><div class="gq-fb" id="gqFb"></div>';
        wordOrder($('gqHintOrder'), r.tokens, {
          onSuccess: success,
          onWrong: reset => { say('gqFb', 'no', '❌ Not yet, try again!'); reset(); },
        });
      };
      input.focus();
    }
    round();
  };

  /* ================= index of the games on the home page ================= */

  $('gameList').innerHTML = Object.entries(SETS).map(([key, set]) => `
    <article class="topic" style="--c:${COLORS[key]}">
      <h3>${set.title}</h3>
      <div class="topic-pages">${set.games.map(id => `<a href="#p${key.split('-')[0]}" data-set="${key}" data-game="${id}">${INFO[id].icon} ${INFO[id].name}</a>`).join('')}</div>
    </article>`).join('');

  // go to the pages of the topic, then start the game over them
  $('gameList').addEventListener('click', e => {
    const a = e.target.closest('[data-game]');
    if (!a) return;
    e.preventDefault();
    const { set, game } = a.dataset;
    seen.add(set);
    document.addEventListener('spreadchange', () => { open(set); play(game); }, { once: true });
    location.hash = a.getAttribute('href');
  });

  // the page may already be at the end of a spread when the script loads
  updateFab();
})();
