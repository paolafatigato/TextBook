// Vocabulary · Personality adjectives (pp. 62-63): the "missing letters" game in a pop-up.
// Click (or type) the letters of the adjective, or of its comparative/superlative, in the sentence.
// 10 pins for each word: a wrong letter knocks one down.

(() => {
  const QUESTIONS = [
    { sentence: "My sister is _______ than my brother; she helps me with homework, he doesn't.", word: 'KINDER', type: 'Comparative', hint: 'starts with K' },
    { sentence: 'She is the _______ person I have ever met; she always thinks of others first.', word: 'KINDEST', type: 'Superlative', hint: 'ends with -est' },
    { sentence: 'He is _______, always cracking jokes and making people laugh.', word: 'FUNNY', type: 'Adjective', hint: 'starts with F' },
    { sentence: 'This movie is _______ than the last one; we laughed much more.', word: 'FUNNIER', type: 'Comparative', hint: 'starts with F' },
    { sentence: 'That was the _______ comedy show I have ever seen; everyone was crying with laughter.', word: 'FUNNIEST', type: 'Superlative', hint: 'ends with -est' },
    { sentence: 'The _______ solution to this problem is very simple and smart.', word: 'CLEVER', type: 'Adjective', hint: 'starts with C' },
    { sentence: 'Her idea was _______ than the suggestions we received; it solved everything quickly.', word: 'CLEVERER', type: 'Comparative', hint: 'starts with C' },
    { sentence: 'That was the _______ move in the entire game; nobody expected it.', word: 'CLEVEREST', type: 'Superlative', hint: 'ends with -est' },
    { sentence: 'He has a very _______ personality that attracts many friends.', word: 'OUTGOING', type: 'Adjective', hint: 'starts with O' },
    { sentence: 'She is _______ than her twin sister; she always talks to new people first.', word: 'MORE OUTGOING', type: 'Comparative', hint: 'two words' },
    { sentence: 'He is the _______ person in our group; he talks to everyone at parties.', word: 'MOST OUTGOING', type: 'Superlative', hint: 'two words' },
    { sentence: 'I am more _______ than my brother; I love trying new things.', word: 'ADVENTUROUS', type: 'Adjective', hint: 'starts with A' },
    { sentence: 'John is _______ than Mark; he always studies and works hard.', word: 'MORE AMBITIOUS', type: 'Comparative', hint: 'two words' },
    { sentence: 'She is the _______ student in our class; she never gives up.', word: 'MOST AMBITIOUS', type: 'Superlative', hint: 'two words' },
    { sentence: 'Tom is very _______; he always helps people when they are scared.', word: 'BRAVE', type: 'Adjective', hint: 'starts with B' },
    { sentence: 'My sister is _______ than me; she never gets nervous before exams.', word: 'CALMER', type: 'Comparative', hint: 'ends with -er' },
    { sentence: 'Our teacher is the _______ person I know; nothing makes her angry.', word: 'CALMEST', type: 'Superlative', hint: 'ends with -est' },
    { sentence: 'He is very _______; he always thinks before he does anything dangerous.', word: 'CAUTIOUS', type: 'Adjective', hint: 'starts with C' },
    { sentence: "Anna is more _______ than me; she smiles all the time, I don't feel like smiling when I am tired.", word: 'CHEERFUL', type: 'Adjective', hint: 'starts with C' },
    { sentence: 'I am _______; I often drop things when I am nervous.', word: 'CLUMSY', type: 'Adjective', hint: 'starts with C' },
    { sentence: 'He is the _______ person in our group; he always has new ideas.', word: 'MOST CREATIVE', type: 'Superlative', hint: 'two words' },
    { sentence: 'Rachel is very _______; she easily adapts to every situation.', word: 'EASY GOING', type: 'Adjective', hint: 'two words' },
    { sentence: 'Sara is very _______; she always shouts and jumps at football matches.', word: 'ENTHUSIASTIC', type: 'Adjective', hint: 'starts with E' },
    { sentence: 'Lucy is more _______ than Tom; she loves big parties.', word: 'EXTROVERTED', type: 'Adjective', hint: 'starts with E' },
    { sentence: 'My neighbour is very _______; he talks to everyone kindly.', word: 'FRIENDLY', type: 'Adjective', hint: 'starts with F' },
    { sentence: 'He is the _______ boy in the class; he always shares his things.', word: 'KIND', type: 'Adjective', hint: 'starts with K' },
    { sentence: 'On Sundays I am _______ than on weekdays; I don’t want to do anything.', word: 'LAZIER', type: 'Comparative', hint: 'ends with -ier' },
    { sentence: 'She is very _______; she never shouts even when she is angry.', word: 'PATIENT', type: 'Adjective', hint: 'starts with P' },
    { sentence: 'He is the _______ student in the class; he always finishes his work on time.', word: 'MOST RESPONSIBLE', type: 'Superlative', hint: 'two words' },
    { sentence: 'Anna is _______ than her brother; she hates speaking in public.', word: 'SHYER', type: 'Comparative', hint: 'ends with -er' },
    { sentence: 'Mary is very _______; she loves big groups and new people.', word: 'SOCIABLE', type: 'Adjective', hint: 'starts with S' },
    { sentence: 'Jim is the _______ person in our class; he never stops talking.', word: 'MOST TALKATIVE', type: 'Superlative', hint: 'two words' },
    { sentence: 'After the good news, I felt _______ than yesterday.', word: 'MORE OPTIMISTIC', type: 'Comparative', hint: 'two words' },
    { sentence: 'She is very _______; her feelings get hurt easily.', word: 'SENSITIVE', type: 'Adjective', hint: 'starts with S' },
    { sentence: 'He is the _______ speaker in the group; he believes in himself.', word: 'MOST CONFIDENT', type: 'Superlative', hint: 'two words' },
  ];
  const MAX_STRIKES = 10;
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ '.split('');
  const AVATARS = Array.from({ length: 38 }, (_, i) => `img/personality/people/${i + 1}.png`);

  const shuffle = list => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  /* ================= the pop-up ================= */

  const overlay = document.createElement('div');
  overlay.className = 'pg-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Personality adjectives game');
  overlay.innerHTML = `
    <div class="pg-box">
      <button type="button" class="pg-close" aria-label="Close">✕</button>
      <img class="pg-avatar" alt="">
      <h2 class="pg-title">Personality Adjectives Game</h2>
      <p class="pg-sub">Adjectives, comparatives &amp; superlatives</p>
      <div class="pg-screen"></div>
    </div>`;
  document.body.append(overlay);
  const avatar = overlay.querySelector('.pg-avatar');
  const screen = overlay.querySelector('.pg-screen');
  let lastFocus = null;

  let questions = [];
  let current = 0;
  let strikes = 0;
  let guessed = [];
  let solved = 0;
  let locked = false;

  function open() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    intro();
    overlay.querySelector('.pg-close').focus();
  }
  function close() {
    overlay.hidden = true;
    lastFocus?.focus();
  }
  const randomAvatar = () => { avatar.src = AVATARS[Math.floor(Math.random() * AVATARS.length)]; };

  function intro() {
    randomAvatar();
    screen.innerHTML = `
      <div class="pg-instr"><b>How to play:</b><br>Click on the missing letters (or type them) to complete the personality adjective, or its comparative/superlative form, in the sentence.<br><small>Two words? Don't forget the <b>space</b>!</small></div>
      <button type="button" class="pg-btn start" data-act="start">Start game</button>`;
  }

  function start() {
    questions = shuffle(QUESTIONS);
    current = 0;
    solved = 0;
    screen.innerHTML = `
      <div class="pg-pins"></div>
      <div class="pg-card">
        <div class="pg-type"></div>
        <p class="pg-sentence"></p>
        <div class="pg-blanks" aria-live="polite"></div>
        <div class="pg-letters"></div>
      </div>
      <div class="pg-msg" aria-live="polite"></div>
      <button type="button" class="pg-bulb" data-act="hint" aria-label="Show a hint"><img src="img/personality/bulby.png" alt=""></button>
      <p class="pg-bulbtxt">Click the bulb for a hint</p>
      <div class="pg-hint"></div>
      <div class="pg-stats"></div>
      <div class="pg-nav">
        <button type="button" class="pg-btn" data-act="prev">← Previous</button>
        <button type="button" class="pg-btn" data-act="next">Next →</button>
        <button type="button" class="pg-btn" data-act="restart">Restart</button>
      </div>`;
    load();
  }

  const q = () => questions[current];
  const $ = sel => screen.querySelector(sel);

  function load() {
    strikes = 0;
    guessed = [];
    locked = false;
    randomAvatar();
    $('.pg-type').textContent = q().type;
    $('.pg-sentence').textContent = q().sentence;
    $('.pg-hint').textContent = '';
    $('.pg-msg').textContent = '';
    $('.pg-msg').className = 'pg-msg';
    draw();
  }

  function draw() {
    const word = q().word;
    $('.pg-blanks').innerHTML = word.split('').map(l =>
      `<span class="${l === ' ' ? 'gap' : ''}">${guessed.includes(l) ? (l === ' ' ? '&nbsp;' : l) : '_'}</span>`).join('');
    $('.pg-letters').innerHTML = LETTERS.map(l =>
      `<button type="button" data-act="letter" data-l="${l}" ${guessed.includes(l) || locked ? 'disabled' : ''} class="${l === ' ' ? 'space' : ''}">${l === ' ' ? 'space' : l}</button>`).join('');
    $('.pg-pins').innerHTML = Array.from({ length: MAX_STRIKES }, (_, i) => `<span class="${i < strikes ? 'knocked' : ''}">${i + 1}</span>`).join('');
    $('.pg-stats').textContent = `Question ${current + 1} / ${questions.length} · Strikes: ${strikes} / ${MAX_STRIKES} · Solved: ${solved}`;
    $('[data-act="prev"]').disabled = current === 0;
    $('[data-act="next"]').disabled = current === questions.length - 1;
  }

  function say(text, cls) {
    const m = $('.pg-msg');
    m.textContent = text;
    m.className = `pg-msg ${cls}`;
  }

  function guess(l) {
    if (locked || guessed.includes(l)) return;
    guessed.push(l);
    const word = q().word;
    if (!word.includes(l)) {
      strikes++;
      if (strikes >= MAX_STRIKES) {
        locked = true;
        say(`⚾ Game over for this word! It was: ${word}`, 'no');
      }
    } else if (word.split('').every(c => guessed.includes(c))) {
      locked = true;
      solved++;
      say(`🎉 Correct! ${word}`, 'ok');
      setTimeout(() => {
        if (overlay.hidden || !locked) return;
        if (current < questions.length - 1) { current++; load(); } else end();
      }, 1400);
    }
    draw();
  }

  function end() {
    randomAvatar();
    screen.innerHTML = `
      <h3 class="pg-end">Well done! 🎉</h3>
      <p>You solved <b>${solved}</b> of ${questions.length} adjectives.</p>
      <button type="button" class="pg-btn start" data-act="restart">Play again</button>`;
  }

  overlay.addEventListener('click', e => {
    if (e.target === overlay) { close(); return; }
    if (e.target.closest('.pg-close')) { close(); return; }
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    if (act === 'start' || act === 'restart') start();
    else if (act === 'letter') guess(btn.dataset.l);
    else if (act === 'hint') { const h = $('.pg-hint'); h.textContent = h.textContent ? '' : q().hint; }
    else if (act === 'next' && current < questions.length - 1) { current++; load(); }
    else if (act === 'prev' && current > 0) { current--; load(); }
  });

  // while the game is open the keys play the game and do not turn the pages
  window.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    e.stopPropagation();
    if (e.key === 'Escape') { close(); return; }
    if (!screen.querySelector('.pg-letters')) return;
    const k = e.key.toUpperCase();
    if (/^[A-Z ]$/.test(k)) { e.preventDefault(); guess(k); }
    else if (e.key === 'ArrowRight') $('[data-act="next"]').click();
    else if (e.key === 'ArrowLeft') $('[data-act="prev"]').click();
  }, true);

  document.querySelectorAll('.pg-play').forEach(btn => btn.addEventListener('click', open));
})();
