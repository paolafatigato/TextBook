// Romeo & Juliet ([rj-verona … rj-words]): "The Verona Challenge", the games of the Romeo Quiz that only work
// on a screen (timer, hidden clues, face-down cards, the falling rose), alone or in 2–4 teams, in a pop-up
// with the look of the chapter (rj-challenge.css). The activities you can do with a pen are on the pages
// [rj-revise] and [rj-words].
// A button with data-rj="speed" opens that game, data-rj="" opens the pop-up with all of them.
// Also here: the role buttons of the scripts (click your character and your lines light up)
// and the letter boxes of the word tower.

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
      ['The two families are old friends.', false], ['The story is set in Venice.', false],
      ['Juliet is a Montague.', false], ['Tybalt is Juliet\'s cousin.', true],
      ['Romeo meets Juliet at a party.', true], ['The Capulets invite the Montagues to their party.', false],
      ['Benvolio tries to keep the peace.', true], ['Tybalt loves the word "peace".', false],
      ['The Nurse carries messages between the lovers.', true], ['Juliet wants to marry Paris.', false],
      ['Romeo buys poison.', true], ['Juliet wakes up before Romeo drinks the poison.', false],
      ['The Prince sends Romeo away from Verona.', true], ['Friar Lawrence\'s plan works perfectly.', false],
    ],
    who: [
      { name: 'Juliet', clues: ['I speak a lot about names and roses.', 'My family is rich and important.', 'I am only 13 years old.', 'I speak from my balcony at night.', 'My name starts with J.'], options: ['Juliet', 'Rosaline', 'Lady Capulet', 'the Nurse'] },
      { name: 'Romeo', clues: ['I often feel sad about love.', 'At the beginning I love Rosaline.', 'I climb the orchard walls.', 'I am banished to Mantua.', 'I am Juliet\'s husband.'], options: ['Romeo', 'Benvolio', 'Paris', 'Mercutio'] },
      { name: 'Friar Lawrence', clues: ['I know a lot about plants and herbs.', 'I hope the two families can make peace.', 'I marry two young people in secret.', 'I give Juliet a sleeping potion.', 'My letter never arrives.'], options: ['Friar Lawrence', 'Friar John', 'the Prince', 'Benvolio'] },
      { name: 'Mercutio', clues: ['I love jokes and word games.', 'I am not a Montague and not a Capulet.', 'I am Romeo\'s best friend.', 'Tybalt kills me.', 'I say: "A plague on both your houses!"'], options: ['Mercutio', 'Benvolio', 'Tybalt', 'Paris'] },
      { name: 'Tybalt', clues: ['I am very good with a sword.', 'I am always angry.', 'I hate the word "peace".', 'I am Juliet\'s cousin.', 'Romeo kills me.'], options: ['Tybalt', 'Paris', 'Abram', 'Sampson'] },
      { name: 'the Nurse', clues: ['I talk a lot!', 'I work for the Capulets.', 'I have known Juliet since she was a baby.', 'I carry messages to Romeo.', 'I know about the secret wedding.'], options: ['the Nurse', 'Lady Capulet', 'Lady Montague', 'Rosaline'] },
      { name: 'the Prince', clues: ['I am tired of the fights in the streets.', 'I am the most important man in Verona.', 'I say: the next fight means death!', 'I send Romeo away.', 'At the end I speak about "a story of more woe".'], options: ['the Prince', 'Lord Capulet', 'Friar Lawrence', 'Paris'] },
      { name: 'Paris', clues: ['I am young, rich and noble.', 'I am a relative of the Prince.', 'I talk to Lord Capulet about his daughter.', 'I want to marry Juliet.', 'My wedding day is Thursday.'], options: ['Paris', 'Romeo', 'Tybalt', 'Benvolio'] },
      { name: 'Benvolio', clues: ['I don\'t like fights.', 'I am a Montague.', 'I tell the servants to put their swords away.', 'I take my friend to a party.', 'I am Romeo\'s cousin.'], options: ['Benvolio', 'Mercutio', 'Abram', 'Tybalt'] },
      { name: 'Lord Capulet', clues: ['I like giving parties.', 'I stop Tybalt at my party.', 'I get very angry with my daughter.', 'I want her to marry Paris.', 'I am Juliet\'s father.'], options: ['Lord Capulet', 'Lord Montague', 'the Prince', 'Friar Lawrence'] },
    ],
    memory: [
      ['Romeo', 'a Montague'], ['Juliet', 'a girl of 13'], ['Tybalt', 'Juliet\'s cousin'], ['Benvolio', 'Romeo\'s cousin'],
      ['Mercutio', 'Romeo\'s best friend'], ['Friar Lawrence', 'marries the lovers'], ['the Nurse', 'takes care of Juliet'], ['Paris', 'wants to marry Juliet'],
    ],
    // [word, clue]
    words: [
      ['VERONA', 'The city of the story'], ['TYBALT', 'Juliet\'s angry cousin'], ['BALCONY', 'Juliet speaks from here at night'],
      ['POISON', 'Romeo buys it in Mantua'], ['MERCUTIO', 'Romeo\'s best friend'], ['CAPULET', 'Juliet\'s family'],
      ['MONTAGUE', 'Romeo\'s family'], ['PILGRIM', 'A person who travels to a holy place'], ['DAGGER', 'Juliet uses it at the end'],
      ['POTION', 'The Friar gives it to Juliet'], ['FEUD', 'A long fight between two families'], ['MANTUA', 'Romeo goes to live here'],
      ['ORCHARD', 'A garden with fruit trees'], ['NURSE', 'She takes care of Juliet'], ['PRINCE', 'He rules Verona'], ['TOMB', 'The last scene happens here'],
    ],
  };

  const GAMES = {
    speed: { icon: '⚡', name: 'Speed round', line: 'True or false, against the clock',
      rules: ['8 sentences for each player or team.', 'You have 10 seconds for every sentence.', 'Right in 3 seconds: 15 points · in 6 seconds: 12 · later: 10.'] },
    choice: { icon: '🎯', name: 'The final choice', line: 'Guess the character, clue by clue',
      rules: ['One clue is open. Type the name, or ask for help.', '50 points with one clue; every new clue costs 10.', '“Show 4 names” costs 10. After a wrong answer, the next team can steal!'] },
    memory: { icon: '🃏', name: 'Memory pairs', line: 'Who is who? Find the eight pairs',
      rules: ['Turn two cards: a character and who they are.', 'A pair is 10 points and you play again.', 'No pair? It is the next team’s turn.'] },
    rose: { icon: '🌹', name: 'The falling rose', line: 'Find the word before the petals fall',
      rules: ['Choose a letter. Right: 10 points and you go on.', 'Wrong: a petal falls and the turn passes.', 'The last letter of the word gives 30 more points.'] },
  };
  const ORDER = Object.keys(GAMES);
  const SIDES = [['Montagues', '⚔️'], ['Capulets', '🎭'], ['The Court', '👑'], ['The Lovers', '🕊️']];
  const EMBLEMS = ['⚔️', '🎭', '👑', '🕊️', '🌹', '🗝️', '🛡️', '🦁', '🦅', '🏰', '🌙', '📜'];

  const $ = id => document.getElementById(id);
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  document.body.insertAdjacentHTML('beforeend', `
    <div class="gq-overlay rjv" id="rjModal" role="dialog" aria-modal="true" aria-labelledby="rjTitle" hidden>
      <div class="gq-box">
        <div class="gq-top">
          <button type="button" class="gq-back" id="rjBack" hidden>← Menu</button>
          <span class="gq-title" id="rjTitle"></span>
          <button type="button" class="gq-close" id="rjClose" aria-label="Close">✕</button>
        </div>
        <div class="rjv-board" id="rjBoard" hidden></div>
        <div class="gq-area" id="rjArea"></div>
      </div>
    </div>`);
  const modal = $('rjModal');
  const area = $('rjArea');
  const board = $('rjBoard');

  // players: 1 = alone; the names and emblems stay while the book is open
  let count = 1;
  const sides = SIDES.map(([name, emblem]) => ({ name, emblem }));
  let teams = [];
  let turn = 0;
  const solo = () => teams.length === 1;
  const who = (i = turn) => `${teams[i].emblem} ${esc(teams[i].name)}`;
  const paintBoard = () => {
    board.innerHTML = teams.map((t, i) => `<div class="rjv-team${i === turn ? ' on' : ''}"><i>${t.emblem}</i><span>${esc(t.name)}</span><b>${t.score}</b></div>`).join('');
  };
  const nextTurn = () => { turn = (turn + 1) % teams.length; paintBoard(); };
  const give = n => { teams[turn].score += n; paintBoard(); };

  // every timer of a game, so it can be stopped when the player leaves
  let timers = [];
  let onKey = null; // the keyboard of the computer, in the falling rose
  const later = (f, ms) => timers.push(setTimeout(f, ms));
  const every = (f, ms) => timers.push(setInterval(f, ms));
  const stop = () => { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; onKey = null; };

  const top = () => { modal.querySelector('.gq-box').scrollTop = 0; };
  const head = (kicker, title) => `<p class="rjv-kicker">${kicker}</p><h3 class="rjv-h">${title}</h3>`;
  let inLobby = ''; // the game whose rules are on screen

  function players() {
    return `<div class="rjv-players">
      <div class="rjv-seg" role="group" aria-label="Who plays?">${[1, 2, 3, 4].map(n => `<button type="button" data-count="${n}"${n === count ? ' class="on"' : ''}>${n === 1 ? 'Just me' : `${n} teams`}</button>`).join('')}</div>
      ${count > 1 ? `<div class="rjv-sides">${sides.slice(0, count).map((s, i) => `<div><button type="button" class="rjv-emb" data-emb="${i}" title="change the emblem">${s.emblem}</button><input data-name="${i}" value="${esc(s.name)}" maxlength="18" autocomplete="off" aria-label="Name of team ${i + 1}"></div>`).join('')}</div>` : ''}
    </div>`;
  }

  function showMenu() {
    stop();
    inLobby = '';
    $('rjBack').hidden = true;
    board.hidden = true;
    $('rjTitle').textContent = 'Romeo & Juliet';
    area.innerHTML = `${head('The Verona challenge', 'Choose your <em>fate</em>')}${players()}
      <div class="rjv-menu">${ORDER.map(id => `<button type="button" class="rjv-door" data-game="${id}"><i>${GAMES[id].icon}</i><b>${GAMES[id].name}</b><span>${GAMES[id].line}</span></button>`).join('')}</div>`;
    top();
  }

  // the rules and who plays, before every game
  function lobby(id) {
    stop();
    inLobby = id;
    $('rjBack').hidden = false;
    board.hidden = true;
    $('rjTitle').textContent = 'Romeo & Juliet';
    const g = GAMES[id];
    area.innerHTML = `<div class="rjv-arch">${g.icon}</div>${head(g.line, g.name)}
      <ol class="rjv-rules">${g.rules.map(r => `<li>${r}</li>`).join('')}</ol>${players()}
      <div class="rjv-row"><button type="button" class="rjv-btn" data-start="${id}">Start ✦</button></div>`;
    top();
  }

  function start(id) {
    stop();
    inLobby = '';
    teams = count === 1
      ? [{ name: 'Your score', emblem: '🌹', score: 0 }]
      : sides.slice(0, count).map((s, i) => ({ name: s.name.trim() || SIDES[i][0], emblem: s.emblem, score: 0 }));
    turn = 0;
    board.hidden = false;
    $('rjBack').hidden = false;
    $('rjTitle').textContent = `${GAMES[id].icon} ${GAMES[id].name}`;
    paintBoard();
    PLAY[id]();
    top();
  }

  function end(id, note = '') {
    stop();
    board.hidden = true;
    const rank = teams.slice().sort((a, b) => b.score - a.score);
    const best = rank[0].score;
    const tie = !solo() && rank[1].score === best;
    const title = solo() ? 'The curtain <em>falls</em>' : tie ? 'A <em>tie!</em>' : `${esc(rank[0].name)} <em>win!</em>`;
    area.innerHTML = `${head(GAMES[id].name, title)}
      <div class="rjv-podium">${rank.map(t => `<div class="${t.score === best ? 'first' : ''}" style="--h:${best ? Math.max(.35, t.score / best) : .35}"><i>${t.emblem}</i><p><b>${t.score}</b>${solo() ? 'points' : esc(t.name)}</p></div>`).join('')}</div>
      ${note ? `<p class="rjv-note">${note}</p>` : ''}
      <div class="rjv-row"><button type="button" class="rjv-btn" data-start="${id}">↻ Play again</button><button type="button" class="rjv-btn line" data-menu>Other games</button></div>`;
    top();
  }

  const PLAY = {
    speed() {
      const deck = shuffle(DATA.tf);
      const PER = 8;
      let t = 0;
      const ready = () => {
        turn = t;
        paintBoard();
        if (solo()) return round();
        area.innerHTML = `${head(`Round ${t + 1} of ${teams.length}`, `<em>${who()}</em>, get ready!`)}<div class="rjv-row"><button type="button" class="rjv-btn" id="rjGo">We are ready ✦</button></div>`;
        $('rjGo').addEventListener('click', round);
      };
      const round = () => {
        const qs = deck.slice(t * PER, (t + 1) * PER);
        let i = 0;
        const ask = () => {
          if (i === qs.length) { t++; return t === teams.length ? end('speed') : ready(); }
          const [text, truth] = qs[i];
          area.innerHTML = `<p class="rjv-kicker">${solo() ? '' : `${who()} · `}${i + 1} / ${qs.length}</p>
            <div class="rjv-time"><i id="rjBar"></i></div>
            <p class="rjv-statement">${esc(text)}</p>
            <div class="rjv-tf"><button type="button" data-v="1">True</button><button type="button" data-v="0">False</button></div>
            <p class="rjv-fb" id="rjFb" aria-live="polite"></p>`;
          const buttons = [...area.querySelectorAll('.rjv-tf button')];
          const from = Date.now();
          let done = false;
          const answer = b => {
            if (done) return;
            done = true;
            stop();
            const secs = (Date.now() - from) / 1000;
            const ok = !!b && (b.dataset.v === '1') === truth;
            buttons.forEach(x => {
              x.disabled = true;
              if ((x.dataset.v === '1') === truth) x.classList.add('ok');
              else if (x === b) x.classList.add('no');
            });
            const pts = !ok ? 0 : secs < 3 ? 15 : secs < 6 ? 12 : 10;
            if (pts) give(pts);
            $('rjFb').innerHTML = ok ? `<span class="ok">✓ +${pts}</span>` : `<span class="no">${b ? '✗ No!' : '⏳ Too late!'} It is ${truth ? 'true' : 'false'}.</span>`;
            later(() => { i++; ask(); }, ok ? 900 : 1800);
          };
          buttons.forEach(b => b.addEventListener('click', () => answer(b)));
          every(() => {
            const left = 1 - (Date.now() - from) / 10000;
            $('rjBar').style.width = `${Math.max(0, left) * 100}%`;
            if (left <= 0) answer(null);
          }, 100);
        };
        ask();
      };
      ready();
    },

    choice() {
      const people = shuffle(DATA.who).slice(0, solo() ? 5 : teams.length * 2);
      // "the" does not count, and a few short names are right too ("friar laurence", "nurse", "escalus"…)
      const plain = s => s.toLowerCase().replace(/laurence/g, 'lawrence').replace(/\bthe\b/g, ' ').replace(/[^a-z]+/g, ' ').trim();
      const SHORT = { 'Friar Lawrence': ['friar', 'lawrence'], 'the Prince': ['prince escalus', 'escalus'], 'Lord Capulet': ['capulet', 'mr capulet', 'juliet s father'] };
      const right = (typed, name) => plain(typed) === plain(name) || !!SHORT[name]?.includes(plain(typed));
      let r = 0;
      const next = () => {
        if (r === people.length) return end('choice');
        const p = people[r];
        const options = shuffle(p.options);
        let open = 1, names = false;
        const out = new Set(); // teams that already gave a wrong answer in this round
        turn = r % teams.length;
        paintBoard();
        const worth = () => Math.max(10, 50 - (open - 1) * 10 - (names ? 10 : 0));
        const finish = msg => {
          area.querySelectorAll('.rjv-answer input, .rjv-answer button, .rjv-names button, #rjMore, #rjNames').forEach(x => { x.disabled = true; });
          area.querySelector(`.rjv-names [data-v="${p.name}"]`)?.classList.add('ok');
          $('rjFb').innerHTML = msg;
          $('rjNext').hidden = false;
          $('rjNext').focus();
        };
        const render = (msg = '') => {
          area.innerHTML = `<p class="rjv-kicker">Mystery ${r + 1} / ${people.length}${solo() ? '' : ` · ${who()}`}</p>
            <h3 class="rjv-h">Who <em>am I?</em></h3>
            <p class="rjv-worth"><b>${worth()}</b> points</p>
            <ol class="rjv-clues">${p.clues.map((c, n) => `<li${n < open ? '' : ' class="shut"'}>${n < open ? esc(c) : '✦ ✦ ✦'}</li>`).join('')}</ol>
            <div class="rjv-row"><button type="button" class="rjv-btn line" id="rjMore"${open === p.clues.length ? ' disabled' : ''}>Open a clue (−10)</button>${names ? '' : '<button type="button" class="rjv-btn line" id="rjNames">Show 4 names (−10)</button>'}</div>
            ${names
              ? `<div class="rjv-names">${options.map(o => `<button type="button" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`
              : '<form class="rjv-answer" id="rjForm"><input id="rjName" placeholder="I think it is…" autocomplete="off" spellcheck="false" aria-label="Your answer"><button type="submit" class="rjv-btn">Answer</button></form>'}
            <p class="rjv-fb" id="rjFb" aria-live="polite">${msg}</p>
            <div class="rjv-row"><button type="button" class="rjv-btn" id="rjNext" hidden>Next ✦</button></div>`;
          $('rjMore').addEventListener('click', () => { open++; render(); });
          $('rjNames')?.addEventListener('click', () => { names = true; render(); });
          $('rjNext').addEventListener('click', () => { r++; next(); });
          const guess = value => {
            if (!value.trim()) return;
            if (right(value, p.name)) {
              const pts = worth();
              give(pts);
              return finish(`<span class="ok">✓ Yes, it is ${esc(p.name)}! +${pts}</span>`);
            }
            out.add(turn);
            if (out.size === teams.length) return finish(`<span class="no">✗ It was ${esc(p.name)}.</span>`);
            do nextTurn(); while (out.has(turn));
            render(`<span class="no">✗ Not ${esc(value)}.</span> ${who()}, you can steal!`);
          };
          $('rjForm')?.addEventListener('submit', e => { e.preventDefault(); guess($('rjName').value); });
          area.querySelectorAll('.rjv-names button').forEach(b => b.addEventListener('click', () => guess(b.dataset.v)));
        };
        render();
      };
      next();
    },

    memory() {
      const cards = shuffle(DATA.memory.flatMap(([a, b], k) => [{ k, t: a, who: true }, { k, t: b }]));
      let open = [], found = 0, moves = 0;
      area.innerHTML = `<p class="rjv-kicker">A character and who they are</p>
        <div class="rjv-mem">${cards.map((c, n) => `<button type="button" class="rjv-card${c.who ? ' who' : ''}" data-n="${n}" aria-label="Card ${n + 1}"><span>${esc(c.t)}</span></button>`).join('')}</div>
        <p class="rjv-fb" id="rjFb" aria-live="polite"></p>`;
      const say = () => { $('rjFb').innerHTML = `${solo() ? '' : `${who()}, your turn · `}moves: ${moves}`; };
      say();
      area.querySelectorAll('.rjv-card').forEach(b => b.addEventListener('click', () => {
        if (open.length === 2 || b.classList.contains('up')) return;
        b.classList.add('up');
        b.setAttribute('aria-label', cards[b.dataset.n].t);
        open.push(b);
        if (open.length < 2) return;
        moves++;
        say();
        const [x, y] = open.map(o => cards[o.dataset.n]);
        if (x.k === y.k) {
          open.forEach(o => o.classList.add('done'));
          open = [];
          found++;
          give(10);
          say();
          if (found === DATA.memory.length) later(() => end('memory', `All the pairs in <b>${moves}</b> moves (the best is ${found}).`), 900);
        } else later(() => {
          open.forEach(o => { o.classList.remove('up'); o.setAttribute('aria-label', `Card ${+o.dataset.n + 1}`); });
          open = [];
          nextTurn();
          say();
        }, 1300);
      }));
    },

    rose() {
      const ws = shuffle(DATA.words).slice(0, solo() ? 5 : Math.max(4, teams.length * 2));
      let i = 0, roses = 0;
      const next = () => {
        if (i === ws.length) return end('rose', `Roses saved: <b>${roses} / ${ws.length}</b>`);
        const [word, clue] = ws[i];
        const guessed = new Set();
        let petals = 6, over = false;
        turn = i % teams.length;
        paintBoard();
        area.innerHTML = `<p class="rjv-kicker">Rose ${i + 1} / ${ws.length}</p>
          <div class="rjv-garden">
            <svg class="rjv-rose" id="rjRose" viewBox="0 0 120 170" role="img">
              <path class="stem" d="M60 76 C 58 108 66 130 58 166"/>
              <path class="leaf" d="M60 118 C 78 100 98 104 102 108 C 92 126 72 128 60 118 Z"/>
              <path class="leaf" d="M61 140 C 44 124 26 128 20 133 C 32 149 50 150 61 140 Z"/>
              ${[0, 1, 2, 3, 4, 5].map(n => `<g transform="rotate(${n * 60} 60 50)"><path class="petal" d="M60 50 C 34 40 32 8 60 5 C 88 8 86 40 60 50 Z"/></g>`).join('')}
              <circle class="heart" cx="60" cy="50" r="13"/><path class="swirl" d="M60 50 c 4 -4 9 2 3 6 c -8 5 -15 -6 -6 -12 c 9 -6 18 3 13 11"/>
            </svg>
            <div><p class="rjv-clue">${esc(clue)}</p><div class="rjv-slots" id="rjSlots"></div><p class="rjv-fb" id="rjFb" aria-live="polite">${solo() ? '' : `${who()}, choose a letter`}</p></div>
          </div>
          <div class="rjv-keys">${[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l => `<button type="button" data-l="${l}">${l}</button>`).join('')}</div>
          <div class="rjv-row"><button type="button" class="rjv-btn" id="rjNext" hidden>Next ✦</button></div>`;
        const keys = [...area.querySelectorAll('.rjv-keys button')];
        const leaves = [...area.querySelectorAll('.petal')];
        const paint = () => {
          $('rjSlots').innerHTML = [...word].map(l => `<span${over && !guessed.has(l) ? ' class="missed"' : ''}>${over || guessed.has(l) ? l : ''}</span>`).join('');
          $('rjRose').setAttribute('aria-label', `A rose with ${petals} petals`);
        };
        const press = l => {
          const k = keys.find(x => x.dataset.l === l);
          if (over || !k || k.disabled) return;
          k.disabled = true;
          const hit = word.includes(l);
          if (hit) { k.classList.add('hit'); guessed.add(l); give(10); }
          else leaves[--petals].classList.add('fallen');
          const won = [...word].every(c => guessed.has(c));
          over = won || petals === 0;
          if (won) { give(30); roses++; }
          if (!hit && !over && !solo()) nextTurn();
          paint();
          $('rjFb').innerHTML = won ? '<span class="ok">✓ You saved the rose! +30</span>'
            : over ? '<span class="no">The rose has no petals…</span>'
            : solo() ? (hit ? '<span class="ok">✓ +10</span>' : '<span class="no">✗ A petal falls.</span>')
            : `${who()}, ${hit ? 'go on!' : 'your turn'}`;
          if (!over) return;
          keys.forEach(b => { b.disabled = true; });
          $('rjNext').hidden = false;
          $('rjNext').focus();
        };
        keys.forEach(k => k.addEventListener('click', () => press(k.dataset.l)));
        $('rjNext').addEventListener('click', () => { i++; next(); });
        onKey = press;
        paint();
      };
      next();
    },
  };

  function open(id) {
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    GAMES[id] ? lobby(id) : showMenu();
    $('rjClose').focus();
  }
  window.RJ_GAMES = { open };   // used by the Games list on the home page (home-puzzles.js)

  function close() {
    stop();
    modal.hidden = true;
    document.documentElement.classList.remove('gq-open');
  }

  area.addEventListener('click', e => {
    const b = e.target.closest('[data-game], [data-start], [data-menu], [data-count], [data-emb]');
    if (!b) return;
    const d = b.dataset;
    if (d.game) lobby(d.game);
    else if (d.start) start(d.start);
    else if (d.menu !== undefined) showMenu();
    else if (d.count) { count = +d.count; inLobby ? lobby(inLobby) : showMenu(); }
    else if (d.emb) {
      const s = sides[+d.emb];
      s.emblem = EMBLEMS[(EMBLEMS.indexOf(s.emblem) + 1) % EMBLEMS.length];
      b.textContent = s.emblem;
    }
  });
  area.addEventListener('input', e => { if (e.target.dataset.name !== undefined) sides[+e.target.dataset.name].name = e.target.value; });
  $('rjBack').addEventListener('click', showMenu);
  $('rjClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.querySelectorAll('[data-rj]').forEach(b => b.addEventListener('click', () => open(b.dataset.rj)));

  // while the pop-up is open the arrow keys must not turn the book's pages
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    else if (onKey && !e.ctrlKey && !e.metaKey && !e.altKey && /^[a-z]$/i.test(e.key)) onKey(e.key.toUpperCase());
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

  /* ---------- [rj-words] the word tower: one letter in every box, then the cursor moves on ---------- */
  document.querySelectorAll('.rjw-tower').forEach(tower => {
    const boxes = [...tower.querySelectorAll('input.rjw-l')];
    boxes.forEach((inp, i) => {
      inp.addEventListener('focus', () => inp.select());
      inp.addEventListener('input', () => { if (inp.value) boxes[i + 1]?.focus(); });
      inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !inp.value) { e.preventDefault(); boxes[i - 1]?.focus(); } });
    });
  });
})();
