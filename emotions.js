// Emotions ([emo-intro … emo-diary]).
// 1. The shapes of the chapter: the faces of the 15 feelings (a wobbly blob + eyes + mouth), a flower, a sparkle, a squiggle.
//    They are drawn once in a hidden sprite; the pages use them with <use href="#em-happy"> (the colors are in emotions-chapter.css).
// 2. The games that can only be played on the computer (Emotion Wheel, Coping Crew): they open in a pop-up (like the Sports games),
//    from the "game corner" buttons of [emo-vocab:R] and [emo-coping:R] (they are not on the Games list of the home page: they are not games).
//    A button with data-emo="wheel" opens that game, data-emo="" the menu.
// Only the best results are kept, in `saved` (script.js).

(() => {
  /* ================= 1 · the shapes ================= */
  const INK = 'var(--pal-forest)';
  const st = (w = 3.4) => `fill="none" style="stroke:${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const fi = c => `style="fill:${c}"`;
  const dot = (x, y, r = 4.2) => `<circle cx="${x}" cy="${y}" r="${r}" ${fi(INK)}/>`;
  const wide = (x, y, px = 0, py = 0) => `<circle cx="${x}" cy="${y}" r="8.2" style="fill:var(--pal-white);stroke:${INK}" stroke-width="2.2"/><circle cx="${x + px}" cy="${y + py}" r="3.6" ${fi(INK)}/>`;
  const arcUp = x => `<path d="M${x - 8} 49 Q${x} 37 ${x + 8} 49" ${st()}/>`;
  const arcDown = x => `<path d="M${x - 8} 43 Q${x} 52 ${x + 8} 43" ${st()}/>`;
  const spark = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -9C1 -3 3 -1 9 0C3 1 1 3 0 9C-1 3 -3 1 -9 0C-3 -1 -1 -3 0 -9Z" ${fi(INK)}/>`;
  const lid = x => `<path d="M${x - 8} 47 A8 8 0 0 0 ${x + 8} 47Z" ${fi(INK)}/><path d="M${x - 9} 47 H${x + 9}" ${st(3)}/>`;
  const brow = (a, b) => `<path d="M${a[0]} ${a[1]} L${a[2]} ${a[3]}" ${st(3.4)}/><path d="M${b[0]} ${b[1]} L${b[2]} ${b[3]}" ${st(3.4)}/>`;
  const blush = (c = 'var(--pal-salmon)', r = 6) => `<circle cx="22" cy="60" r="${r}" ${fi(c)}/><circle cx="78" cy="60" r="${r}" ${fi(c)}/>`;
  const drop = (x, y) => `<path d="M${x} ${y} Q${x - 6} ${y + 9} ${x} ${y + 14} Q${x + 6} ${y + 9} ${x} ${y}Z" style="fill:var(--pal-aqua);stroke:${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
  const tongue = '<path d="M44 63V74Q50 80 56 74V63" style="fill:var(--pal-pink);stroke:var(--pal-forest)" stroke-width="2.2" stroke-linejoin="round"/>';

  const FACES = {
    happy:     `${arcUp(34)}${arcUp(66)}<path d="M28 58Q50 86 72 58Z" ${fi(INK)}/><path d="M40 72Q50 66 60 72Q50 80 40 72Z" ${fi('var(--pal-pink)')}/>${blush()}`,
    sad:       `${dot(34, 47)}${dot(66, 47)}${brow([27, 40, 41, 34], [73, 40, 59, 34])}<path d="M36 74Q50 62 64 74" ${st()}/>${drop(28, 56)}`,
    angry:     `${dot(35, 48, 4.6)}${dot(65, 48, 4.6)}${brow([25, 34, 43, 42], [75, 34, 57, 42])}<path d="M34 72Q50 60 66 72" ${st()}/><path d="M38 70.5L62 70.5" ${st(2)}/>`,
    scared:    `${wide(34, 46, 0, 1)}${wide(66, 46, 0, 1)}<path d="M28 30Q34 24 40 29M60 29Q66 24 72 30" ${st(2.8)}/><path d="M33 70Q41 62 50 70T67 70" ${st(3)}/>${drop(80, 20)}`,
    surprised: `${wide(34, 45)}${wide(66, 45)}<path d="M26 28Q34 20 42 27M58 27Q66 20 74 28" ${st(3)}/><ellipse cx="50" cy="71" rx="7.5" ry="10" ${fi(INK)}/>`,
    bored:     `${lid(34)}${lid(66)}<path d="M38 70H62" ${st()}/>`,
    excited:   `${spark(34, 44, 1.1)}${spark(66, 44, 1.1)}<path d="M28 58Q50 90 72 58Z" ${fi(INK)}/><path d="M40 73Q50 66 60 73Q50 81 40 73Z" ${fi('var(--pal-pink)')}/>${blush('var(--pal-pink)', 5.4)}`,
    proud:     `${arcUp(34)}${arcUp(66)}<path d="M33 62Q50 76 68 58" ${st()}/>${blush()}<path d="M70 20 L72 14 L74 20 L80 22 L74 24 L72 30 L70 24 L64 22Z" ${fi(INK)}/>`,
    tired:     `<path d="M26 47H42M58 47H74" ${st()}/><path d="M30 53Q34 57 38 53M62 53Q66 57 70 53" ${st(2.2)}/><ellipse cx="50" cy="71" rx="7" ry="8.5" ${fi(INK)}/><path d="M72 18H80L72 27H80" ${st(2.6)}/>`,
    nervous:   `${dot(38, 47)}${dot(70, 47)}<path d="M30 68L38 62L46 68L54 62L62 68L70 62" ${st(3)}/>${drop(80, 22)}`,
    worried:   `${dot(34, 48)}${dot(66, 48)}${brow([26, 40, 42, 33], [74, 40, 58, 33])}<path d="M36 70Q43 64 50 70T64 70" ${st(3)}/>`,
    embarrassed:`${dot(35, 46)}${dot(65, 46)}${blush('var(--pal-coral)', 8.5)}<path d="M36 70Q43 64 50 70T64 68" ${st(3)}/>${drop(80, 22)}`,
    calm:      `${arcDown(34)}${arcDown(66)}<path d="M36 64Q50 74 64 64" ${st()}/>${blush('var(--pal-pink)', 5)}`,
    confused:  `${dot(34, 49, 3.8)}<circle cx="66" cy="46" r="6.4" style="fill:var(--pal-white);stroke:${INK}" stroke-width="2"/><circle cx="67" cy="46" r="2.6" ${fi(INK)}/><path d="M25 38Q34 33 43 38" ${st(3)}/><path d="M36 70Q44 62 50 69T66 66" ${st(3)}/><path d="M75 14Q75 6 83 6Q91 6 91 13Q91 18 83 20V24" ${st(2.8)}/>${dot(83, 29, 1.8)}`,
    disgusted: `<path d="M27 38L42 46L27 54M73 38L58 46L73 54" ${st()}/><path d="M33 64Q50 56 67 64" ${st()}/>${tongue}`,
  };

  const blobPath = (seed = 0) => {
    const pts = Array.from({ length: 72 }, (_, i) => {
      const a = i / 72 * Math.PI * 2;
      const r = 43 + 2.6 * Math.sin(a * 6 + seed) + 1.2 * Math.sin(a * 3 + seed * 2);
      return `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
    });
    return `M${pts.join('L')}Z`;
  };

  const petals = n => Array.from({ length: n }, (_, k) => {
    const a = (k * 360 / n - 90) * Math.PI / 180;
    return `<circle cx="${(50 + 30 * Math.cos(a)).toFixed(1)}" cy="${(50 + 30 * Math.sin(a)).toFixed(1)}" r="${n > 6 ? 15 : 20}"/>`;
  }).join('');

  const SPRITE = `<svg width="0" height="0" xmlns="http://www.w3.org/2000/svg">
    <symbol id="em-blob" viewBox="0 0 100 100"><path fill="currentColor" d="${blobPath(0)}"/></symbol>
    <symbol id="em-flower" viewBox="0 0 100 100"><g fill="currentColor">${petals(8)}</g><circle cx="50" cy="50" r="13" style="fill:var(--pal-white)"/></symbol>
    <symbol id="em-spark" viewBox="0 0 100 100"><path fill="currentColor" d="M50 0C54 34 66 46 100 50C66 54 54 66 50 100C46 66 34 54 0 50C34 46 46 34 50 0Z"/></symbol>
    <symbol id="em-squig" viewBox="0 0 100 24"><path fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" d="M5 12Q17 -2 29 12T53 12T77 12T97 12"/></symbol>
    <symbol id="em-zig" viewBox="0 0 100 24"><path fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" d="M5 18L22 6L38 18L54 6L70 18L86 6L97 14"/></symbol>
    ${Object.entries(FACES).map(([k, g], i) => `<symbol id="em-${k}" viewBox="0 0 100 100"><path fill="currentColor" d="${blobPath(i * 1.7)}"/>${g}</symbol>`).join('\n  ')}
  </svg>`;

  const sprite = document.createElement('div');
  sprite.setAttribute('aria-hidden', 'true');
  sprite.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  sprite.innerHTML = SPRITE;
  document.body.append(sprite);

  /* ================= 2 · the pop-up ================= */
  const $ = id => document.getElementById(id);
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const store = (k, v) => { try { saved[k] = v; persist(); } catch { /* script.js not ready: skip */ } };
  const recall = k => { try { return saved[k]; } catch { return undefined; } };
  const faceSvg = k => `<svg class="em-f ${k}" viewBox="0 0 100 100" aria-hidden="true"><use href="#em-${k}"/></svg>`;
  const pal = name => getComputedStyle(document.documentElement).getPropertyValue(`--pal-${name}`).trim() || '#ccc';

  const INFO = {
    wheel: { icon: 'excited', name: 'Emotion Wheel', text: 'Spin the wheel, land on a feeling and do the challenge. Alone, in pairs or with the class!' },
    crew: { icon: 'calm', name: 'Coping Crew', text: 'Five friends need help. Choose the best idea, play a quick round and win points for your team.' },
  };
  const ORDER = Object.keys(INFO);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="gq-overlay emo-modal" id="emoModal" role="dialog" aria-modal="true" aria-labelledby="emoTitle" hidden>
      <div class="gq-box">
        <div class="gq-top">
          <button type="button" class="gq-back" id="emoBack" hidden>← Menu</button>
          <span class="gq-title" id="emoTitle"></span>
          <span class="gq-score" id="emoScore"></span>
          <button type="button" class="gq-close" id="emoClose" aria-label="Close">✕</button>
        </div>
        <div class="gq-area" id="emoArea"></div>
      </div>
    </div>`);
  const modal = $('emoModal');
  const area = $('emoArea');
  const setScore = s => { $('emoScore').textContent = s === null ? '' : s; };

  // every timer of a game, so it can be stopped when the player leaves
  let timers = [];
  const later = (f, ms) => timers.push(setTimeout(f, ms));
  let raf = 0;
  const stop = () => { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; cancelAnimationFrame(raf); };

  function showMenu() {
    stop();
    $('emoBack').hidden = true;
    $('emoTitle').textContent = 'Emotions games';
    setScore(null);
    area.innerHTML = `<p class="gq-menu-intro">Choose a game!</p><div class="gq-menu">${ORDER.map(id => `
      <button type="button" class="gq-game" data-play="${id}"><i>${faceSvg(INFO[id].icon)}</i><span><b>${INFO[id].name}</b>${INFO[id].text}</span></button>`).join('')}</div>`;
  }

  function play(id) {
    stop();
    $('emoBack').hidden = false;
    $('emoTitle').innerHTML = `${faceSvg(INFO[id].icon)} ${INFO[id].name}`;
    setScore(null);
    GAMES[id]();
    modal.querySelector('.gq-box').scrollTop = 0;
  }

  function open(id) {
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    id ? play(id) : showMenu();
    $('emoClose').focus();
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
  $('emoBack').addEventListener('click', showMenu);
  $('emoClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  // while the pop-up is open the arrow keys must not turn the book's pages
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);
  document.querySelectorAll('[data-emo]').forEach(b => b.addEventListener('click', () => open(b.dataset.emo)));

  /* ================= 3 · Emotion Wheel ================= */
  const SEGMENTS = [
    ['happy', 'mustard'], ['sad', 'sky'], ['angry', 'coral'], ['scared', 'lilac'],
    ['surprised', 'lemon'], ['bored', 'cool-grey'], ['excited', 'salmon'], ['proud', 'green'],
  ];
  const TASKS = [
    w => `Say <b>3 things</b> that make you feel <b>${w}</b>!`,
    w => `Make a <b>face</b> and a <b>pose</b> for “${w}”. Hold it for 5 seconds!`,
    w => `Finish the sentence: <b>“I feel ${w} when …”</b>`,
    w => `Where do you feel <b>${w}</b> in your body? <b>“My … when I’m ${w}.”</b>`,
    w => `Say a sentence with <b>because</b>: <b>“I’m ${w} because …”</b>`,
    w => `Mime <b>${w}</b>. Your class asks: <b>“Are you ${w}?”</b>`,
    w => `What <b>color</b> is “${w}” for you? Say why!`,
    w => `Name a <b>song</b> or a <b>movie</b> that makes you feel <b>${w}</b>.`,
  ];

  function wheelGame() {
    area.innerHTML = `<div class="gq-card emw">
      <p class="gq-instr">Press <span>SPIN</span> and do the challenge. Everybody can play!</p>
      <div class="emw-wrap"><canvas id="emwCanvas" width="640" height="640" aria-label="The wheel of the feelings"></canvas><i class="emw-pointer" aria-hidden="true"></i>
        <button type="button" class="emw-spin" id="emwSpin">SPIN!</button></div>
      <div class="emw-res" id="emwRes"><p class="gq-instr">Spin the wheel to get your challenge!</p></div></div>`;
    const cv = $('emwCanvas');
    const ctx = cv.getContext('2d');
    const N = SEGMENTS.length, ARC = Math.PI * 2 / N;
    let angle = 0, spinning = false, spins = 0;
    const colors = SEGMENTS.map(s => pal(s[1]));
    const ink = pal('forest'), white = pal('white');

    function draw() {
      const R = cv.width / 2;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.save();
      ctx.translate(R, R);
      ctx.rotate(angle);
      SEGMENTS.forEach((s, i) => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R - 8, i * ARC, (i + 1) * ARC);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = ink;
        ctx.stroke();
        ctx.save();
        ctx.rotate(i * ARC + ARC / 2);
        ctx.fillStyle = ink;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = '700 38px Fredoka, Nunito, sans-serif';
        ctx.fillText(s[0].toUpperCase(), R - 36, 0);
        ctx.restore();
      });
      ctx.restore();
      ctx.beginPath();
      ctx.arc(R, R, 52, 0, Math.PI * 2);
      ctx.fillStyle = white;
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = ink;
      ctx.stroke();
    }

    function result() {
      // the pointer is at the top (-90°): which segment is there?
      const a = ((-Math.PI / 2 - angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const i = Math.floor(a / ARC) % N;
      const [word] = SEGMENTS[i];
      const task = TASKS[Math.floor(Math.random() * TASKS.length)](word);
      spins++;
      $('emwRes').innerHTML = `<div class="emw-card"><span class="emw-face">${faceSvg(word)}</span><div><h3>${word}</h3><p>${task}</p>
        <button type="button" class="gq-btn alt" id="emwTimer">30 seconds</button> <output id="emwClock"></output></div></div>`;
      $('emwTimer').addEventListener('click', () => {
        let t = 30;
        const out = $('emwClock');
        out.textContent = t;
        const iv = setInterval(() => { t--; out.textContent = t > 0 ? t : 'Time’s up!'; if (t <= 0) clearInterval(iv); }, 1000);
        timers.push(iv);
      });
      setScore(`Spins: ${spins}`);
      $('emwSpin').disabled = false;
      $('emwSpin').textContent = 'SPIN AGAIN!';
      spinning = false;
    }

    $('emwSpin').addEventListener('click', () => {
      if (spinning) return;
      spinning = true;
      $('emwSpin').disabled = true;
      $('emwRes').innerHTML = '<p class="gq-instr">…</p>';
      const from = angle, turns = 4 + Math.random() * 3, total = turns * Math.PI * 2, t0 = performance.now(), dur = 4200;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur);
        angle = from + total * (1 - Math.pow(1 - p, 3));
        draw();
        if (p < 1) raf = requestAnimationFrame(step); else result();
      };
      raf = requestAnimationFrame(step);
    });
    draw();
    document.fonts?.ready.then(draw);
  }

  /* ================= 4 · Coping Crew ================= */
  // best 30 points, ok 15, bad 0
  const FRIENDS = [
    { name: 'Alex', face: 'sad', feel: 'SAD', says: 'I study a lot, but I have a bad grade on my math test. I think: “I’m stupid.”',
      opts: [['Think: “It’s hard, but I can learn.”', 'best'], ['Make a study plan with the teacher.', 'best'], ['Go for a walk.', 'ok'], ['Play video games all day.', 'bad']],
      note: 'Kind thoughts help. “I’m stupid” is not true: it is only hard right now.' },
    { name: 'Mia', face: 'angry', feel: 'ANGRY', says: 'My best friend tells everyone my secret. I’m so angry! My heart beats fast.',
      opts: [['Breathe in, hold, breathe out. Repeat.', 'best'], ['Run, jump or dance for five minutes.', 'best'], ['Shout at your friend in front of everyone.', 'bad'], ['Say “I’m not angry” and smile.', 'bad']],
      note: 'When you are angry your body is hot and fast. Breathing and moving help it calm down.' },
    { name: 'Sam', face: 'nervous', feel: 'NERVOUS', says: 'Tomorrow I speak in front of the class. I can’t sleep and my stomach hurts.',
      opts: [['Talk to a friend or an adult.', 'best'], ['Say nice things to yourself: “I can do it!”', 'best'], ['Stay home tomorrow.', 'bad'], ['Drink five coffees.', 'bad']],
      note: 'Talking and kind words make a big problem smaller.' },
    { name: 'Lily', face: 'worried', feel: 'LONELY', says: 'I’m new at school. I don’t know anybody. At lunch I sit alone.',
      opts: [['Say hello to a classmate.', 'best'], ['Join a club you like.', 'best'], ['Hide in the bathroom.', 'bad'], ['Never talk to anyone.', 'bad']],
      note: 'Small steps help. One “hello” can start a friendship!' },
    { name: 'Leo', face: 'tired', feel: 'TIRED', says: 'I’m so tired. Every night I stay up late with my phone.',
      opts: [['Go to bed early and turn off the phone.', 'best'], ['Take a short walk outside.', 'ok'], ['Drink three energy drinks.', 'bad'], ['Watch videos until midnight.', 'bad']],
      note: 'Sleep helps your brain and your mood.' },
    { name: 'Zoe', face: 'embarrassed', feel: 'EMBARRASSED', says: 'I trip and fall in front of the whole class! My face is red.',
      opts: [['Smile and say: “Oops!”', 'best'], ['Laugh with your friends. Everybody makes mistakes.', 'best'], ['Never go to school again.', 'bad'], ['Tell yourself: “I’m so stupid.”', 'bad']],
      note: 'Everybody makes mistakes. A smile helps you and the others.' },
    { name: 'Ben', face: 'scared', feel: 'SCARED', says: 'I hear a strange noise in my room at night.',
      opts: [['Turn on the light and breathe slowly.', 'best'], ['Call your parents.', 'best'], ['Hide under the blanket all night.', 'ok'], ['Watch a horror movie.', 'bad']],
      note: 'Light and slow breathing make the night less scary.' },
    { name: 'Eva', face: 'excited', feel: 'EXCITED', says: 'Tomorrow is my birthday party! I can’t sit still in class.',
      opts: [['Draw the party in your notebook.', 'best'], ['Take deep breaths and count to ten.', 'best'], ['Shout in class: “It’s my party!”', 'bad'], ['Run around the classroom.', 'bad']],
      note: 'Use your energy in a safe way: draw, breathe, wait.' },
  ];
  const ANAGRAMS = [['BREATHE', 'What you do with your nose and mouth to calm down'], ['FRIEND', 'A person you like and trust'], ['SMILE', 'You do it with your mouth when you are happy'], ['MUSIC', 'You listen to it with headphones'], ['WALK', 'Go outside with your feet'], ['CALM', 'Not angry, not nervous: just quiet'], ['TALK', 'Say your feelings to someone'], ['HELP', 'Ask an adult for it']];
  const TFS = [
    ['Slow breathing can help you feel calm.', true, 'TRUE! It tells your body: “relax”.'],
    ['When you are angry, keep everything inside.', false, 'FALSE. Find a safe way to let it out: move, talk, draw.'],
    ['Talking to a friend can make a problem smaller.', true, 'TRUE! You are not alone.'],
    ['Exercise can help with anger.', true, 'TRUE! Moving uses the energy of the feeling.'],
    ['Counting to ten gives you time to think.', true, 'TRUE! A short pause is a good idea.'],
    ['“I’m stupid” is always true.', false, 'FALSE. It is a thought, not a fact.'],
    ['It is OK to ask an adult for help.', true, 'TRUE! It is a strong thing to do.'],
  ];
  const GAPS = [
    ['When I’m nervous, I can ___ slowly.', 'breathe', ['breathe', 'pizza', 'shoes']],
    ['I can talk to a trusted ___.', 'adult', ['adult', 'wall', 'stranger']],
    ['I listen to ___ when I’m sad.', 'music', ['music', 'homework', 'noise']],
    ['When I’m angry, I count to ___.', 'ten', ['ten', 'yes', 'blue']],
    ['A good friend ___ to me.', 'listens', ['listens', 'laughs', 'runs']],
    ['I go for a ___ to feel better.', 'walk', ['walk', 'test', 'bill']],
  ];

  function crewGame() {
    const ROUNDS = 5;
    area.innerHTML = `<div class="gq-card emc">
      <div class="emc-hero">${faceSvg('happy')}${faceSvg('calm')}${faceSvg('proud')}</div>
      <p class="gq-instr">Your friends have a problem. Choose the <span>best idea</span>, then play a quick round. <span>${ROUNDS} friends</span> · up to <span>45 points</span> each!</p>
      <label class="emc-team">Team name <input id="emcName" maxlength="18" value="The Crew" autocomplete="off"></label>
      <div class="gq-row"><button type="button" class="gq-btn" id="emcGo">▶ Start</button></div>
      <p class="gq-instr" id="emcBest" style="margin:10px 0 0"></p></div>`;
    const best = parseInt(recall('emo-crew-best'), 10);
    if (best) $('emcBest').textContent = `★ Best score: ${best} points`;
    $('emcGo').addEventListener('click', () => start($('emcName').value.trim() || 'The Crew'));

    function start(team) {
      const deck = shuffle(FRIENDS).slice(0, ROUNDS);
      let round = 0, total = 0;
      setScore(`★ 0`);

      function friend() {
        const f = deck[round];
        area.innerHTML = `<div class="gq-card emc">
          <div class="emc-top"><span>${team}</span><span>Friend ${round + 1} / ${ROUNDS}</span></div>
          <div class="emc-friend"><span class="av">${faceSvg(f.face)}</span><div class="emc-bub"><b>${f.name}</b><em>${f.feel}</em><p>${f.says}</p></div></div>
          <p class="emc-q">What can ${f.name} do? <span>Choose the best idea!</span></p>
          <div class="emc-opts">${shuffle(f.opts).map((o, k) => `<button type="button" class="emc-opt" data-t="${o[1]}"><i>${'ABCD'[k]}</i><span>${o[0]}</span></button>`).join('')}</div>
          <div id="emcFb"></div></div>`;
        area.querySelectorAll('.emc-opt').forEach(b => b.addEventListener('click', () => pick(b, f)));
      }

      function pick(b, f) {
        const t = b.dataset.t, pts = { best: 30, ok: 15, bad: 0 }[t];
        area.querySelectorAll('.emc-opt').forEach(x => { x.disabled = true; x.classList.add(x.dataset.t); });
        b.classList.add('chosen');
        total += pts;
        setScore(`★ ${total}`);
        const msg = { best: '✓ Great idea! +30', ok: 'OK idea. +15', bad: '✗ Not a good idea. 0' }[t];
        $('emcFb').innerHTML = `<p class="emc-msg ${t}">${msg}</p><p class="emc-note">${f.note}</p><div class="gq-row"><button type="button" class="gq-btn" id="emcNext">Quick round →</button></div>`;
        $('emcNext').addEventListener('click', mini);
      }

      function after(pts) {
        total += pts;
        setScore(`★ ${total}`);
        round++;
        round < ROUNDS ? friend() : end();
      }

      function mini() {
        const kind = round % 3;
        if (kind === 0) anagram(after); else if (kind === 1) trueFalse(after); else fillGap(after);
      }
      friend();

      function end() {
        const max = ROUNDS * 45, stars = total >= max * .75 ? 3 : total >= max * .5 ? 2 : total >= max * .25 ? 1 : 0;
        const old = parseInt(recall('emo-crew-best'), 10) || 0;
        if (total > old) store('emo-crew-best', String(total));
        area.innerHTML = `<div class="gq-result"><div class="emo-res">${faceSvg(stars === 3 ? 'excited' : stars ? 'happy' : 'calm')}</div><h3>${team}: ${total} points!</h3>
          <p class="pts">${stars === 3 ? 'Super team!' : stars === 2 ? 'Great work!' : stars === 1 ? 'Good try!' : 'Try again: you can do it!'}</p>
          <div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
          ${total > old ? '<p class="gq-instr">★ New best score!</p>' : ''}
          <div class="gq-row"><button type="button" class="gq-btn" id="emcAgain">↻ Play again</button><button type="button" class="gq-btn alt" data-menu>Other games</button></div></div>`;
        $('emcAgain').addEventListener('click', () => crewGame());
      }
    }

    // quick rounds: each one gives up to 15 points
    function anagram(done) {
      const [word, hint] = ANAGRAMS[Math.floor(Math.random() * ANAGRAMS.length)];
      let letters = shuffle([...word]);
      while (letters.join('') === word) letters = shuffle([...word]);
      let tries = 0;
      area.innerHTML = `<div class="gq-card emc"><p class="emc-q">Put the letters in order <span>(15 points)</span></p>
        <p class="gq-instr">${hint}</p>
        <div class="emc-answer" id="emcAns">${[...word].map(() => '<b></b>').join('')}</div>
        <div class="emc-tiles" id="emcTiles">${letters.map((l, i) => `<button type="button" data-i="${i}">${l}</button>`).join('')}</div>
        <p class="gq-fb" id="emcFb2"></p>
        <div class="gq-row"><button type="button" class="gq-btn alt" id="emcClear">↺ Clear</button></div></div>`;
      let typed = [];
      const paint = () => {
        [...$('emcAns').children].forEach((c, i) => { c.textContent = typed[i] ? letters[typed[i] - 1] : ''; });
        area.querySelectorAll('#emcTiles button').forEach(b => { b.disabled = typed.includes(+b.dataset.i + 1); });
      };
      area.querySelectorAll('#emcTiles button').forEach(b => b.addEventListener('click', () => {
        typed.push(+b.dataset.i + 1);
        paint();
        if (typed.length === word.length) {
          const got = typed.map(i => letters[i - 1]).join('');
          if (got === word) {
            $('emcFb2').innerHTML = `<span class="ok">✓ ${word}!</span>`;
            const pts = tries === 0 ? 15 : tries === 1 ? 10 : 5;
            later(() => done(pts), 900);
          } else {
            tries++;
            $('emcFb2').innerHTML = '<span class="no">✗ Try again!</span>';
            typed = [];
            if (tries >= 3) { $('emcFb2').innerHTML = `<span class="no">The word is <b>${word}</b>.</span>`; later(() => done(0), 1500); return; }
            later(paint, 500);
          }
        }
      }));
      $('emcClear').addEventListener('click', () => { typed = []; paint(); });
    }

    function trueFalse(done) {
      const qs = shuffle(TFS).slice(0, 3);
      let i = 0, pts = 0;
      const ask = () => {
        const [q, ans, fact] = qs[i];
        area.innerHTML = `<div class="gq-card emc"><p class="emc-q">True or false? <span>${i + 1} / 3 · 5 points each</span></p>
          <p class="gq-big">${q}</p>
          <div class="gq-choices"><button type="button" class="gq-choice" data-a="true">TRUE</button><button type="button" class="gq-choice" data-a="false">FALSE</button></div>
          <p class="gq-fb" id="emcFb2"></p></div>`;
        area.querySelectorAll('.gq-choice').forEach(b => b.addEventListener('click', () => {
          const ok = (b.dataset.a === 'true') === ans;
          area.querySelectorAll('.gq-choice').forEach(x => { x.disabled = true; });
          b.classList.add(ok ? 'c-ok' : 'c-fail');
          if (ok) pts += 5;
          $('emcFb2').innerHTML = `<span class="${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'} ${fact}</span>`;
          later(() => { i++; i < 3 ? ask() : done(pts); }, 1700);
        }));
      };
      ask();
    }

    function fillGap(done) {
      const qs = shuffle(GAPS).slice(0, 3);
      let i = 0, pts = 0;
      const ask = () => {
        const [q, ans, options] = qs[i];
        area.innerHTML = `<div class="gq-card emc"><p class="emc-q">Choose the word <span>${i + 1} / 3 · 5 points each</span></p>
          <p class="gq-gapline">${q.replace('___', '<span class="gq-gap" id="emcGap">&nbsp;</span>')}</p>
          <div class="gq-choices">${shuffle(options).map(o => `<button type="button" class="gq-choice" data-a="${o}">${o}</button>`).join('')}</div>
          <p class="gq-fb" id="emcFb2"></p></div>`;
        area.querySelectorAll('.gq-choice').forEach(b => b.addEventListener('click', () => {
          const ok = b.dataset.a === ans;
          area.querySelectorAll('.gq-choice').forEach(x => { x.disabled = true; });
          b.classList.add(ok ? 'c-ok' : 'c-fail');
          $('emcGap').textContent = ans;
          if (ok) pts += 5;
          $('emcFb2').innerHTML = `<span class="${ok ? 'ok' : 'no'}">${ok ? '✓ Yes!' : `✗ It is “${ans}”.`}</span>`;
          later(() => { i++; i < 3 ? ask() : done(pts); }, 1300);
        }));
      };
      ask();
    }
  }

  const GAMES = { wheel: wheelGame, crew: crewGame };

  /* ================= 5 · the Games list on the home page ================= */
  // grammar-games.js writes that list, so we add our pill once everything has loaded
  window.addEventListener('load', () => {
    const list = $('gameList');
    if (!list || typeof PAGES === 'undefined') return;
    // The Emotion Wheel and Coping Crew are activities, not games: they stay in the chapter (their buttons on the pages).
    // The games of the chapter are on paper, so the links go to their pages: Tic-Tac-Toe (two teams) and the crossword.
    const games = [[`${VS_SIGN} ✏️ Emotion Tic-Tac-Toe`, 'emo-ttt'], ['🧩 Coping crossword', 'emo-puzzle:L']];
    const pill = document.createElement('details');
    pill.className = 'game-topic';
    pill.style.setProperty('--c', 'var(--pal-magenta)');
    pill.innerHTML = `<summary>${VS_SIGN} Emotions <small>${games.length}</small></summary><div class="topic-pages">${games.map(([t, where]) =>
      `<a href="#p${PAGES.of(where)}">${t}</a>`).join('')}</div>`;
    list.append(pill);
    document.addEventListener('click', e => { if (!e.target.closest('#gameList')) pill.open = false; });
    list.addEventListener('toggle', e => {
      if (e.target.open) list.querySelectorAll('.game-topic').forEach(o => { if (o !== e.target) o.open = false; });
    }, true);
    window.hideClosedGames?.(); // hide the pill if the pages are not open to the students
  });
})();
