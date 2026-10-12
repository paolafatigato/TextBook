// Romeo & Juliet (pp. 112-123): the games of the Romeo Quiz, made for one player, in a pop-up
// that looks like the grammar games. A button with data-rj="speed" opens that game,
// data-rj="" opens the menu with all the games.
// Also here: the role buttons of the scripts (click your character and your lines light up).

(() => {
  const DATA = {
    // [statement, true?]
    tf: [
      ['Romeo is a Capulet.', false], ['The story is set in Verona.', true], ['Juliet is 13 years old.', true],
      ['Tybalt kills Mercutio.', true], ['Romeo kills Tybalt.', true], ['Romeo and Juliet get married in secret.', true],
      ['Friar Lawrence marries them.', true], ['Paris wants to marry Juliet.', true], ['Benvolio is Romeo\'s enemy.', false],
      ['The Nurse is Juliet\'s mother.', false], ['Romeo is banished to Mantua.', true], ['The play ends happily.', false],
      ['Juliet drinks a potion that makes her look dead.', true], ['Romeo gets Friar Lawrence\'s letter in time.', false],
      ['At the beginning Romeo loves Rosaline.', true], ['At the end the two families make peace.', true],
      ['Mercutio is Romeo\'s best friend.', true], ['The balcony is in the Montagues\' garden.', false],
    ],
    who: [
      { name: 'JULIET', options: ['JULIET', 'ROSALINE', 'LADY CAPULET', 'THE NURSE'],
        clues: ['I am a Capulet.', 'I meet a boy at a party.', 'I am only 13 years old.', 'I speak from my balcony at night.', 'My name starts with J.'] },
      { name: 'ROMEO', options: ['ROMEO', 'BENVOLIO', 'PARIS', 'MERCUTIO'],
        clues: ['I am a Montague.', 'At the beginning I love Rosaline.', 'I climb the orchard walls for love.', 'I am banished to Mantua.', 'I am Juliet\'s husband.'] },
      { name: 'FRIAR LAWRENCE', options: ['FRIAR LAWRENCE', 'FRIAR JOHN', 'THE PRINCE', 'BENVOLIO'],
        clues: ['I am a religious man.', 'I know a lot about plants and herbs.', 'I marry the two lovers in secret.', 'I give Juliet a sleeping potion.', 'My plan fails.'] },
      { name: 'MERCUTIO', options: ['MERCUTIO', 'BENVOLIO', 'TYBALT', 'PARIS'],
        clues: ['I love jokes and word games.', 'I am not a Montague and not a Capulet.', 'I am Romeo\'s best friend.', 'Tybalt kills me.', 'I say: "A plague on both your houses!"'] },
      { name: 'TYBALT', options: ['TYBALT', 'PARIS', 'GREGORY', 'SAMPSON'],
        clues: ['I am always angry.', 'I hate the word "peace".', 'I am Juliet\'s cousin.', 'I kill Mercutio.', 'Romeo kills me.'] },
      { name: 'THE NURSE', options: ['THE NURSE', 'LADY CAPULET', 'LADY MONTAGUE', 'ROSALINE'],
        clues: ['I talk a lot!', 'I work for the Capulets.', 'I take care of Juliet since she was a baby.', 'I carry messages to Romeo.', 'I know about the secret wedding.'] },
      { name: 'THE PRINCE', options: ['THE PRINCE', 'LORD CAPULET', 'FRIAR LAWRENCE', 'PARIS'],
        clues: ['I am the most important man in Verona.', 'I am tired of the fights in the streets.', 'I say: the next fight means death!', 'I banish Romeo.', 'At the end I say: "never was a story of more woe".'] },
      { name: 'PARIS', options: ['PARIS', 'ROMEO', 'TYBALT', 'BENVOLIO'],
        clues: ['I am young, rich and noble.', 'I am a relative of the Prince.', 'I ask Lord Capulet for his daughter.', 'I want to marry Juliet.', 'Romeo kills me at the tomb.'] },
    ],
    memory: [
      ['Romeo', 'a Montague'], ['Juliet', 'a Capulet'], ['Tybalt', 'Juliet\'s cousin'], ['Benvolio', 'Romeo\'s cousin'],
      ['Mercutio', 'Romeo\'s best friend'], ['Friar Lawrence', 'marries the lovers'], ['the Nurse', 'takes care of Juliet'], ['Paris', 'wants to marry Juliet'],
    ],
    quotes: [
      ['O Romeo, Romeo! Wherefore art thou Romeo?', 'JULIET'], ['A plague on both your houses!', 'MERCUTIO'],
      ['What\'s in a name? That which we call a rose by any other word would smell as sweet.', 'JULIET'],
      ['These violent delights have violent ends.', 'FRIAR LAWRENCE'], ['Wisely and slow; they stumble that run fast.', 'FRIAR LAWRENCE'],
      ['For never was a story of more woe than this of Juliet and her Romeo.', 'PRINCE'],
      ['My only love sprung from my only hate!', 'JULIET'], ['Thus with a kiss I die.', 'ROMEO'],
      ['Did my heart love till now? Forswear it, sight!', 'ROMEO'], ['I hate the word "peace", as I hate hell, all Montagues, and thee.', 'TYBALT'],
      ['Good night, good night! Parting is such sweet sorrow.', 'JULIET'], ['O, I am fortune\'s fool!', 'ROMEO'],
    ],
    characters: ['ROMEO', 'JULIET', 'MERCUTIO', 'TYBALT', 'FRIAR LAWRENCE', 'PRINCE'],
    // [sentence with ___, right answer, other answers]
    grammar: [
      ['Romeo ___ a Montague.', 'is', ['are', 'am']], ['Juliet ___ a cousin called Tybalt.', 'has', ['have', 'is']],
      ['The two families ___ enemies.', 'are', ['is', 'am']], ['___ Juliet love Romeo?', 'Does', ['Do', 'Is']],
      ['___ the Capulets and the Montagues hate each other?', 'Do', ['Does', 'Are']],
      ['Last night Romeo ___ over the orchard walls.', 'climbed', ['climbs', 'will climb']],
      ['In Act I, Romeo ___ Juliet at a party.', 'met', ['meets', 'meeted']], ['In Act III, Tybalt ___ Mercutio.', 'killed', ['kills', 'killer']],
      ['Yesterday Juliet ___ the potion.', 'drank', ['drinked', 'drinks']], ['The Nurse ___ a message to Romeo yesterday.', 'brought', ['bringed', 'brings']],
      ['In Act III, Romeo ___ Tybalt to avenge Mercutio.', 'fought', ['fighted', 'fights']],
      ['Romeo will speak to Juliet. → Last night Romeo ___ to Juliet.', 'spoke', ['speaked', 'will speak']],
      ['Juliet won\'t tell her parents. → Juliet ___ her parents.', 'didn\'t tell', ['didn\'t told', 'won\'t tell']],
      ['They will meet again. → They ___ again the next day.', 'met', ['meet', 'will met']],
      ['Tomorrow Juliet ___ the sleeping potion.', 'will drink', ['drank', 'drinks']],
      ['If my family sees you, they ___ you!', 'will kill', ['killed', 'kills']],
    ],
    // [word, clue] for Word scramble and Hangman
    words: [
      ['VERONA', 'The city of the story'], ['TYBALT', 'Juliet\'s angry cousin'], ['BALCONY', 'Juliet speaks from here at night'],
      ['POISON', 'Romeo buys it in Mantua'], ['MERCUTIO', 'Romeo\'s best friend'], ['CAPULET', 'Juliet\'s family'],
      ['MONTAGUE', 'Romeo\'s family'], ['PILGRIM', 'A person who travels to a holy place'], ['DAGGER', 'Juliet uses it at the end'],
      ['POTION', 'Friar Lawrence gives it to Juliet'], ['FEUD', 'A long fight between two families'], ['MANTUA', 'Romeo is banished here'],
      ['ORCHARD', 'A garden with fruit trees'], ['NURSE', 'She takes care of Juliet'], ['PRINCE', 'He rules Verona'], ['TOMB', 'The last scene happens here'],
    ],
  };

  const INFO = {
    speed: { icon: '⚡', name: 'True or false?', text: 'Answer before the time ends!' },
    who: { icon: '🎯', name: 'Who am I?', text: 'Guess the character with as few clues as you can.' },
    memory: { icon: '🃏', name: 'Memory pairs', text: 'Find each character and who they are.' },
    quotes: { icon: '💬', name: 'Quote match', text: 'Who says these famous words?' },
    grammar: { icon: '📝', name: 'Grammar challenge', text: 'Present, past or future? Choose the right verb.' },
    scramble: { icon: '🔤', name: 'Word scramble', text: 'Put the letters in the right order.' },
    hangman: { icon: '🎡', name: 'Hangman', text: 'Find the word before you lose your hearts.' },
  };
  const ORDER = Object.keys(INFO);

  const $ = id => document.getElementById(id);
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  document.body.insertAdjacentHTML('beforeend', `
    <div class="gq-overlay rj-modal" id="rjModal" role="dialog" aria-modal="true" aria-labelledby="rjTitle" hidden>
      <div class="gq-box">
        <div class="gq-top">
          <button type="button" class="gq-back" id="rjBack" hidden>← Menu</button>
          <span class="gq-title" id="rjTitle"></span>
          <span class="gq-score" id="rjScore"></span>
          <button type="button" class="gq-close" id="rjClose" aria-label="Close">✕</button>
        </div>
        <div class="gq-area" id="rjArea"></div>
      </div>
    </div>`);
  const modal = $('rjModal');
  const area = $('rjArea');
  const setScore = s => { $('rjScore').textContent = s === null ? '' : `⭐ ${s}`; };

  // every timer of a game, so it can be stopped when the player leaves
  let timers = [];
  const later = (f, ms) => timers.push(setTimeout(f, ms));
  const every = (f, ms) => timers.push(setInterval(f, ms));
  const stop = () => { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; };

  function showMenu() {
    stop();
    $('rjBack').hidden = true;
    $('rjTitle').textContent = '🌹 Romeo & Juliet games';
    setScore(null);
    area.innerHTML = `<p class="gq-menu-intro">Play on your own: choose a game!</p><div class="gq-menu">${ORDER.map(id => `
      <button type="button" class="gq-game" data-play="${id}"><i>${INFO[id].icon}</i><span><b>${INFO[id].name}</b>${INFO[id].text}</span></button>`).join('')}</div>`;
  }

  function play(id) {
    stop();
    $('rjBack').hidden = false;
    $('rjTitle').textContent = `${INFO[id].icon} ${INFO[id].name}`;
    setScore(0);
    GAMES[id]();
    modal.querySelector('.gq-box').scrollTop = 0;
  }

  function open(id) {
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    id ? play(id) : showMenu();
    $('rjClose').focus();
  }

  function close() {
    stop();
    modal.hidden = true;
    document.documentElement.classList.remove('gq-open');
  }

  function end(score, max, id, extra = '') {
    stop();
    const pct = max ? score / max : 1;
    const face = pct >= .9 ? '🏆' : pct >= .6 ? '🌹' : '💪';
    area.innerHTML = `<div class="gq-card" style="text-align:center">
      <div class="gq-big">${face}</div>
      <p class="gq-instr">You scored <span>${score} / ${max}</span>${extra}</p>
      <div class="gq-row"><button type="button" class="gq-btn" data-play="${id}">↻ Play again</button><button type="button" class="gq-btn alt" data-menu>Other games</button></div>
    </div>`;
  }

  // shows right / wrong on the choice buttons, then goes on
  function judge(buttons, picked, right, fb, okText, then) {
    buttons.forEach(b => {
      b.disabled = true;
      if (b.dataset.v === right) b.classList.add('c-ok');
      else if (b === picked) b.classList.add('c-fail');
    });
    const ok = picked?.dataset.v === right;
    fb.innerHTML = ok ? `<span class="ok">✓ ${okText}</span>` : `<span class="no">✗ ${picked ? 'No!' : '⏰ Time\'s up!'} The answer is: ${esc(right)}</span>`;
    later(then, ok ? 1000 : 1900);
    return ok;
  }

  const GAMES = {
    speed() {
      const qs = shuffle(DATA.tf).slice(0, 10);
      let i = 0, score = 0;
      const next = () => {
        if (i === qs.length) return end(score, qs.length, 'speed');
        const [text, truth] = qs[i];
        area.innerHTML = `<div class="gq-card">
          <div class="gq-count">${i + 1} / ${qs.length}</div>
          <div class="gq-timer"><i id="rjBar"></i></div>
          <p class="gq-big rj-q">${esc(text)}</p>
          <div class="gq-choices"><button type="button" class="gq-choice rj-true" data-v="TRUE">✓ TRUE</button><button type="button" class="gq-choice rj-false" data-v="FALSE">✗ FALSE</button></div>
          <p class="gq-fb" id="rjFb"></p></div>`;
        const buttons = [...area.querySelectorAll('.gq-choice')];
        let left = 100, done = false;
        const answer = b => {
          if (done) return;
          done = true;
          stop();
          if (judge(buttons, b, truth ? 'TRUE' : 'FALSE', $('rjFb'), 'Right!', () => { i++; next(); })) setScore(++score);
        };
        buttons.forEach(b => b.addEventListener('click', () => answer(b)));
        every(() => { left -= 1.25; $('rjBar').style.width = Math.max(0, left) + '%'; if (left <= 0) answer(null); }, 100); // 8 seconds
      };
      next();
    },

    who() {
      const people = shuffle(DATA.who).slice(0, 5);
      let i = 0, score = 0;
      const next = () => {
        if (i === people.length) return end(score, people.length * 5, 'who');
        const p = people[i];
        const options = shuffle(p.options);
        let shown = 1;
        const render = () => {
          area.innerHTML = `<div class="gq-card">
            <div class="gq-count">${i + 1} / ${people.length} · this one is worth <b>${6 - shown}</b> points</div>
            <p class="gq-instr">Who am I? <em>Fewer clues = more points!</em></p>
            <ol class="rj-clues">${p.clues.slice(0, shown).map(c => `<li>${esc(c)}</li>`).join('')}</ol>
            <div class="gq-row"><button type="button" class="gq-btn alt" id="rjMore"${shown === p.clues.length ? ' disabled' : ''}>🔍 Another clue</button></div>
            <div class="gq-choices">${options.map(o => `<button type="button" class="gq-choice" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
            <p class="gq-fb" id="rjFb"></p></div>`;
          $('rjMore').addEventListener('click', () => { shown++; render(); });
          const buttons = [...area.querySelectorAll('.gq-choice')];
          buttons.forEach(b => b.addEventListener('click', () => {
            $('rjMore').disabled = true;
            if (judge(buttons, b, p.name, $('rjFb'), `Yes! +${6 - shown}`, () => { i++; next(); })) { score += 6 - shown; setScore(score); }
          }));
        };
        render();
      };
      next();
    },

    memory() {
      const cards = shuffle(DATA.memory.flatMap(([a, b], k) => [{ k, t: a, who: true }, { k, t: b }]));
      let open = [], found = 0, moves = 0;
      area.innerHTML = `<div class="gq-card"><p class="gq-instr">Turn two cards: a <em>character</em> and <em>who they are</em>.</p>
        <div class="rj-mem">${cards.map((c, n) => `<button type="button" class="rj-card${c.who ? ' who' : ''}" data-n="${n}"><span>${esc(c.t)}</span></button>`).join('')}</div>
        <p class="gq-fb" id="rjFb">Moves: 0</p></div>`;
      const btns = [...area.querySelectorAll('.rj-card')];
      btns.forEach(b => b.addEventListener('click', () => {
        if (open.length === 2 || b.classList.contains('up')) return;
        b.classList.add('up');
        open.push(b);
        if (open.length < 2) return;
        moves++;
        $('rjFb').textContent = `Moves: ${moves}`;
        const [x, y] = open.map(o => cards[o.dataset.n]);
        if (x.k === y.k && x.who !== y.who) {
          open.forEach(o => o.classList.add('done'));
          open = [];
          found++;
          setScore(found);
          if (found === DATA.memory.length) later(() => end(found, found, 'memory', `<br>in <span>${moves}</span> moves (the best is ${found})`), 700);
        } else later(() => { open.forEach(o => o.classList.remove('up')); open = []; }, 1000);
      }));
    },

    quotes() {
      const qs = shuffle(DATA.quotes).slice(0, 8);
      let i = 0, score = 0;
      const next = () => {
        if (i === qs.length) return end(score, qs.length, 'quotes');
        const [quote, who] = qs[i];
        area.innerHTML = `<div class="gq-card">
          <div class="gq-count">${i + 1} / ${qs.length}</div>
          <p class="rj-quote">“${esc(quote)}”</p>
          <p class="gq-instr">Who says it?</p>
          <div class="gq-choices">${DATA.characters.map(c => `<button type="button" class="gq-choice" data-v="${c}">${c}</button>`).join('')}</div>
          <p class="gq-fb" id="rjFb"></p></div>`;
        const buttons = [...area.querySelectorAll('.gq-choice')];
        buttons.forEach(b => b.addEventListener('click', () => {
          if (judge(buttons, b, who, $('rjFb'), 'Right!', () => { i++; next(); })) setScore(++score);
        }));
      };
      next();
    },

    grammar() {
      const qs = shuffle(DATA.grammar).slice(0, 10);
      let i = 0, score = 0;
      const next = () => {
        if (i === qs.length) return end(score, qs.length, 'grammar');
        const [text, right, others] = qs[i];
        area.innerHTML = `<div class="gq-card">
          <div class="gq-count">${i + 1} / ${qs.length}</div>
          <div class="gq-gapline">${esc(text).replace('___', '<span class="gq-gap" id="rjGap">?</span>')}</div>
          <div class="gq-choices">${shuffle([right, ...others]).map(o => `<button type="button" class="gq-choice" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
          <p class="gq-fb" id="rjFb"></p></div>`;
        const buttons = [...area.querySelectorAll('.gq-choice')];
        buttons.forEach(b => b.addEventListener('click', () => {
          $('rjGap').textContent = right;
          if (judge(buttons, b, right, $('rjFb'), 'Right!', () => { i++; next(); })) setScore(++score);
        }));
      };
      next();
    },

    scramble() {
      const ws = shuffle(DATA.words).slice(0, 6);
      let i = 0, score = 0;
      const next = () => {
        if (i === ws.length) return end(score, ws.length, 'scramble');
        const [word, clue] = ws[i];
        let letters;
        do letters = shuffle([...word]); while (letters.join('') === word);
        let typed = [];
        area.innerHTML = `<div class="gq-card" style="text-align:center">
          <div class="gq-count">${i + 1} / ${ws.length}</div>
          <p class="gq-instr">💡 ${esc(clue)}</p>
          <div class="rj-slots" id="rjSlots"></div>
          <div class="gq-bank" id="rjTiles">${letters.map((l, n) => `<button type="button" class="gq-chip" data-n="${n}">${l}</button>`).join('')}</div>
          <div class="gq-row"><button type="button" class="gq-btn alt" id="rjDel">⌫ Back</button><button type="button" class="gq-btn alt" id="rjSkip">Skip</button></div>
          <p class="gq-fb" id="rjFb"></p></div>`;
        const tiles = [...area.querySelectorAll('#rjTiles .gq-chip')];
        const paint = () => {
          $('rjSlots').innerHTML = [...word].map((_, n) => `<span>${typed[n] !== undefined ? letters[typed[n]] : ''}</span>`).join('');
          tiles.forEach((t, n) => { t.disabled = typed.includes(n); });
        };
        const finish = ok => {
          tiles.forEach(t => { t.disabled = true; });
          $('rjDel').disabled = $('rjSkip').disabled = true;
          $('rjFb').innerHTML = ok ? '<span class="ok">✓ Well done!</span>' : `<span class="no">The word is: ${word}</span>`;
          if (ok) setScore(++score);
          later(() => { i++; next(); }, ok ? 1000 : 1800);
        };
        tiles.forEach((t, n) => t.addEventListener('click', () => {
          typed.push(n);
          paint();
          if (typed.length < word.length) return;
          if (typed.map(k => letters[k]).join('') === word) finish(true);
          else {
            $('rjFb').innerHTML = '<span class="warn">Not quite… try again!</span>';
            later(() => { typed = []; paint(); $('rjFb').textContent = ''; }, 700);
          }
        }));
        $('rjDel').addEventListener('click', () => { typed.pop(); paint(); });
        $('rjSkip').addEventListener('click', () => finish(false));
        paint();
      };
      next();
    },

    hangman() {
      const ws = shuffle(DATA.words).slice(0, 5);
      let i = 0, score = 0;
      const next = () => {
        if (i === ws.length) return end(score, ws.length, 'hangman');
        const [word, clue] = ws[i];
        const guessed = new Set();
        let lives = 6;
        area.innerHTML = `<div class="gq-card" style="text-align:center">
          <div class="gq-count">${i + 1} / ${ws.length}</div>
          <p class="gq-instr">💡 ${esc(clue)}</p>
          <p class="rj-lives" id="rjLives"></p>
          <div class="rj-slots" id="rjSlots"></div>
          <div class="rj-keys">${[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l => `<button type="button" data-l="${l}">${l}</button>`).join('')}</div>
          <p class="gq-fb" id="rjFb"></p></div>`;
        const keys = [...area.querySelectorAll('.rj-keys button')];
        const paint = () => {
          $('rjSlots').innerHTML = [...word].map(l => `<span>${guessed.has(l) ? l : ''}</span>`).join('');
          $('rjLives').textContent = '❤️'.repeat(lives) + '🤍'.repeat(6 - lives);
        };
        keys.forEach(k => k.addEventListener('click', () => {
          const l = k.dataset.l;
          k.disabled = true;
          guessed.add(l);
          if (word.includes(l)) k.classList.add('hit');
          else { k.classList.add('miss'); lives--; }
          paint();
          const won = [...word].every(c => guessed.has(c));
          if (!won && lives > 0) return;
          keys.forEach(b => { b.disabled = true; });
          if (won) setScore(++score);
          $('rjFb').innerHTML = won ? '<span class="ok">✓ You found it!</span>' : `<span class="no">💀 The word is: ${word}</span>`;
          later(() => { i++; next(); }, won ? 1200 : 2000);
        }));
        paint();
      };
      next();
    },
  };

  area.addEventListener('click', e => {
    const b = e.target.closest('[data-play], [data-menu]');
    if (!b) return;
    if (b.dataset.menu !== undefined) showMenu();
    else play(b.dataset.play);
  });
  $('rjBack').addEventListener('click', showMenu);
  $('rjClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.querySelectorAll('[data-rj]').forEach(b => b.addEventListener('click', () => open(b.dataset.rj)));

  // while the pop-up is open the arrow keys must not turn the book's pages
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);

  /* ---------- scripts: choose your role ---------- */
  const roles = [...document.querySelectorAll('.rj-roles')].map(box => {
    const script = $(box.dataset.script);
    const key = 'rj-role-' + box.dataset.script;
    const paint = () => {
      const mine = saved[key] || '';
      box.querySelectorAll('button[data-role]').forEach(b => b.classList.toggle('on', b.dataset.role === mine));
      script.querySelectorAll('[data-who]').forEach(p => p.classList.toggle('mine', p.dataset.who === mine));
    };
    box.addEventListener('click', e => {
      const b = e.target.closest('button[data-role]');
      if (!b) return;
      saved[key] = saved[key] === b.dataset.role ? '' : b.dataset.role;
      persist();
      paint();
    });
    paint();
    return paint;
  });
  $('clearBtn').addEventListener('click', () => setTimeout(() => roles.forEach(paint => paint())));
})();
