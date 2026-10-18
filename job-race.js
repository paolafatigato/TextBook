// Happy Job Race ([jobs-pros:L]): who gets happy first with their job?
//
// Every player makes a "Me card": they share 12 hearts among the 10 things that can matter in a job
// (money, free time, family time, fame…). Then they choose a job and 4 of its 6 reasons ("It makes a lot
// of money", "You can become famous"…). In the race each player plays one reason per turn: it gives
// happiness, and more happiness when the player cares about it (more hearts). First to 100 wins.
// The first player starts from the hearts of 9.17 in the book ([jobs-career:L]), if they used 12 or fewer.
//
//   - a reason can be played only a few times (the pips); "An ordinary day" can always be played
//   - dream reasons (fame, a fortune…) are a gamble: most times a little frustration, sometimes a HUGE joy.
//     Every miss makes the next try a bit more likely to work
//   - every job has 2 bad sides: on some turns one of them happens, and it hurts more if the player cares
//     about what it takes away (a doctor who loves family time suffers from night shifts)
// The numbers live in this file only: the pupil reads the reasons and their hearts, and decides.
//
// How to add things:
//   a job → one entry in JOBS: 6 reasons R(text, value, archetype) and 2 bad sides B(text, value)
//   (the text of a reason must read well after "because": the end screen writes "I would like to be a vet because…")

(() => {
  const GOAL = 100;
  const HEARTS = 12;        // hearts to share on the Me card
  const MAX_H = 4;          // hearts on one value at most
  const BAD_CHANCE = .3;    // chance of a bad day after each turn
  const MULT = [.3, .8, 1.2, 1.6, 2];  // happiness × this, by the hearts on that value

  /* ================= data ================= */

  const VALUES = [
    { k: 'money', icon: '💰', name: 'Money' },
    { k: 'time', icon: '🏖️', name: 'Free time' },
    { k: 'family', icon: '🏡', name: 'Family time' },
    { k: 'help', icon: '🤝', name: 'Helping people' },
    { k: 'fame', icon: '⭐', name: 'Being famous' },
    { k: 'travel', icon: '✈️', name: 'Travel & adventure' },
    { k: 'create', icon: '🎨', name: 'Being creative' },
    { k: 'nature', icon: '🌳', name: 'Nature & animals' },
    { k: 'team', icon: '👫', name: 'Friends & teamwork' },
    { k: 'safe', icon: '🔒', name: 'A safe, steady job' },
  ];
  const VAL = Object.fromEntries(VALUES.map(v => [v.k, v]));

  // the archetype fixes the numbers and the hint shown in the race (the pupil chooses from the text only)
  const ARCH = {
    daily: { uses: 5, gain: 5, hint: 'A small joy, almost every day.' },
    good:  { uses: 3, gain: 8, hint: 'A good feeling, a few times.' },
    big:   { uses: 2, gain: 13, hint: 'A big joy, but not very often.' },
    wow:   { uses: 1, gain: 22, hint: 'An amazing moment, only once!' },
    grow:  { uses: 2, gain: 3, hint: 'A small joy now, and your next reason gives double!' },
    calm:  { uses: 2, gain: 4, hint: 'A small joy, and your next bad day will not hurt.' },
    dream: { uses: Infinity, hint: 'It almost never happens… but when it does, WOW! Most times you feel a bit sad. Every try makes your chance grow.' },
  };
  const DREAM = { start: .12, step: .07, max: .5, jackpot: 45, miss: 3 };
  const BAD = 6;            // a bad day: -6 × the hearts multiplier
  const ORDINARY = { text: 'An ordinary day', arch: 'basic', uses: Infinity, gain: 3, hint: 'Nothing special: a little bit of happiness. You can always play it.' };

  const R = (text, v, arch) => ({ text, v, arch, uses: ARCH[arch].uses });
  const B = (text, v) => ({ text, v });

  const JOBS = [
    { k: 'doctor', icon: '🩺', name: 'doctor', reasons: [
      R('You help sick people every day.', 'help', 'daily'),
      R('You save a life!', 'help', 'wow'),
      R('It makes good money.', 'money', 'good'),
      R('It is a safe job: hospitals always need doctors.', 'safe', 'good'),
      R('You work in a big team.', 'team', 'good'),
      R('You could discover a new cure and become famous.', 'fame', 'dream'),
    ], bad: [B('Night shifts: you miss dinner with your family.', 'family'), B('Long hours: almost no free time.', 'time')] },
    { k: 'teacher', icon: '🧑‍🏫', name: 'teacher', reasons: [
      R('It has long summer holidays.', 'time', 'big'),
      R('You help children learn every day.', 'help', 'daily'),
      R('You prepare a really creative lesson.', 'create', 'grow'),
      R('It is a safe, steady job.', 'safe', 'good'),
      R('You finish early and see your family in the afternoon.', 'family', 'good'),
      R('One of your students becomes famous and thanks you on TV.', 'fame', 'dream'),
    ], bad: [B('It makes medium money, not a lot.', 'money'), B('You correct homework at the weekend.', 'time')] },
    { k: 'youtuber', icon: '📹', name: 'YouTuber', reasons: [
      R('You can become really famous.', 'fame', 'dream'),
      R('You are creative every day.', 'create', 'daily'),
      R('You choose your own hours.', 'time', 'good'),
      R('You make videos all over the world.', 'travel', 'good'),
      R('A big sponsor can pay you a fortune.', 'money', 'dream'),
      R('You make friends with other creators.', 'team', 'good'),
    ], bad: [B('It is not a safe job: some months you make no money.', 'safe'), B('Mean comments online make you sad.', 'fame')] },
    { k: 'footballer', icon: '⚽', name: 'footballer', reasons: [
      R('You can become world famous.', 'fame', 'dream'),
      R('If you play for a big team, you make millions.', 'money', 'dream'),
      R('You play in a team every day.', 'team', 'daily'),
      R('You travel to play matches.', 'travel', 'good'),
      R('You train hard and get better and better.', 'team', 'grow'),
      R('You score the winning goal in the final!', 'fame', 'wow'),
    ], bad: [B('An injury: you can’t play for months.', 'safe'), B('Matches every weekend, far from your family.', 'family')] },
    { k: 'chef', icon: '👩‍🍳', name: 'chef', reasons: [
      R('You invent new dishes.', 'create', 'daily'),
      R('You work with a happy team in the kitchen.', 'team', 'good'),
      R('You can become a famous chef on TV.', 'fame', 'dream'),
      R('You can work in any country in the world.', 'travel', 'good'),
      R('Customers love your food.', 'help', 'good'),
      R('Your restaurant is full every night: good money!', 'money', 'big'),
    ], bad: [B('You work in the evenings and at weekends.', 'family'), B('A hot, busy kitchen: no time to rest.', 'time')] },
    { k: 'vet', icon: '🐾', name: 'vet', reasons: [
      R('You work with animals every day.', 'nature', 'daily'),
      R('You help animals get better.', 'help', 'good'),
      R('You save a dog’s life!', 'help', 'wow'),
      R('It makes good money.', 'money', 'good'),
      R('You visit farms in the countryside.', 'nature', 'good'),
      R('You work with a small, friendly team.', 'team', 'good'),
    ], bad: [B('Emergency calls at night.', 'family'), B('Some days are sad: you can’t save every animal.', 'help')] },
    { k: 'engineer', icon: '👷', name: 'engineer', reasons: [
      R('It makes a lot of money.', 'money', 'big'),
      R('It is a safe job: everybody needs engineers.', 'safe', 'daily'),
      R('You design bridges and machines.', 'create', 'good'),
      R('You take a course and learn new skills.', 'safe', 'grow'),
      R('You travel to building sites around the world.', 'travel', 'good'),
      R('Your invention changes the world and you become famous.', 'fame', 'dream'),
    ], bad: [B('Long hours in the office.', 'time'), B('You sit at a desk, far from nature.', 'nature')] },
    { k: 'astronaut', icon: '🚀', name: 'astronaut', reasons: [
      R('You go to space!', 'travel', 'wow'),
      R('Everybody knows your name.', 'fame', 'good'),
      R('You see the whole Earth from space.', 'nature', 'big'),
      R('You work in a small, amazing team.', 'team', 'good'),
      R('You train for every possible problem.', 'safe', 'calm'),
      R('You could be the first person on Mars.', 'fame', 'dream'),
    ], bad: [B('Months away from your family.', 'family'), B('Years of training: no free time.', 'time')] },
    { k: 'farmer', icon: '🚜', name: 'farmer', reasons: [
      R('You work outdoors in nature every day.', 'nature', 'daily'),
      R('You work with your family.', 'family', 'good'),
      R('You grow food for everybody.', 'help', 'good'),
      R('You save money for the winter.', 'safe', 'calm'),
      R('A perfect harvest brings good money!', 'money', 'big'),
      R('Your cheese wins a prize at the fair.', 'fame', 'good'),
    ], bad: [B('Bad weather ruins the harvest.', 'money'), B('You work every day, even on Sunday.', 'time')] },
    { k: 'firefighter', icon: '🚒', name: 'firefighter', reasons: [
      R('You save people from a fire!', 'help', 'wow'),
      R('You help your town every day.', 'help', 'daily'),
      R('Your team is like a family.', 'team', 'good'),
      R('You train with your team, ready for anything.', 'team', 'calm'),
      R('After long shifts you have many days off.', 'time', 'good'),
      R('You are a hero in the newspaper.', 'fame', 'good'),
    ], bad: [B('It is a dangerous job.', 'safe'), B('Night shifts: you miss family dinners.', 'family')] },
    { k: 'artist', icon: '🎨', name: 'artist', reasons: [
      R('You create beautiful things every day.', 'create', 'daily'),
      R('You choose when to work.', 'time', 'good'),
      R('You can paint outdoors.', 'nature', 'good'),
      R('You show your paintings around the world.', 'travel', 'good'),
      R('One painting can sell for a million.', 'money', 'dream'),
      R('You can become a famous artist.', 'fame', 'dream'),
    ], bad: [B('It is not a safe job.', 'safe'), B('Some months you sell nothing.', 'money')] },
    { k: 'pilot', icon: '✈️', name: 'pilot', reasons: [
      R('You travel all over the world.', 'travel', 'daily'),
      R('It makes a lot of money.', 'money', 'big'),
      R('It has many days off between flights.', 'time', 'good'),
      R('You fly over mountains and seas.', 'nature', 'good'),
      R('You follow a checklist, so nothing goes wrong.', 'safe', 'calm'),
      R('You land safely in a storm and 200 passengers clap!', 'help', 'wow'),
    ], bad: [B('Nights in hotels, far from your family.', 'family'), B('Jet lag: you are always tired.', 'time')] },
    { k: 'actor', icon: '🎭', name: 'actor', reasons: [
      R('You can become a movie star.', 'fame', 'dream'),
      R('You can be anybody: a pirate, a king, a robot…', 'create', 'daily'),
      R('You work with a fun team.', 'team', 'good'),
      R('You film in amazing places.', 'travel', 'good'),
      R('A big film can make you rich.', 'money', 'dream'),
      R('People laugh and cry with you.', 'help', 'good'),
    ], bad: [B('It is not a safe job: many months without work.', 'safe'), B('Long days on set, far from home.', 'family')] },
    { k: 'programmer', icon: '💻', name: 'programmer', reasons: [
      R('It makes a lot of money.', 'money', 'big'),
      R('You can work from home, near your family.', 'family', 'good'),
      R('It is a safe job: everybody needs programmers.', 'safe', 'good'),
      R('You create apps and games.', 'create', 'daily'),
      R('You learn a new programming language.', 'create', 'grow'),
      R('Your app becomes famous all over the world.', 'fame', 'dream'),
    ], bad: [B('You sit in front of a screen all day.', 'nature'), B('Deadlines! You work late at night.', 'time')] },
    // the unusual jobs of [jobs-career:R] (odd: they get an "unusual!" label)
    { k: 'taster', icon: '🍦', name: 'ice-cream taster', odd: true, reasons: [
      R('You invent crazy new flavours.', 'create', 'daily'),
      R('You eat ice cream at work!', 'time', 'good'),
      R('People smile when they taste your ice cream.', 'help', 'good'),
      R('Your tongue is insured for a million dollars!', 'money', 'big'),
      R('You work with a small, friendly team.', 'team', 'good'),
      R('Your new flavour becomes famous all over the world.', 'fame', 'dream'),
    ], bad: [B('No spicy food, no hot drinks: you must protect your tongue.', 'time'), B('It is a rare job: there are very few in the world.', 'safe')] },
    { k: 'storm', icon: '🌪️', name: 'storm chaser', odd: true, reasons: [
      R('You chase tornadoes across the country.', 'travel', 'daily'),
      R('You see the wildest nature on Earth.', 'nature', 'big'),
      R('Your data helps to warn people about storms.', 'help', 'good'),
      R('You work with a brave team.', 'team', 'good'),
      R('You check the radar again and again, so you are ready.', 'safe', 'calm'),
      R('You film the perfect tornado and your video goes viral.', 'fame', 'dream'),
    ], bad: [B('It can be dangerous!', 'safe'), B('Weeks on the road, far from your family.', 'family')] },
    { k: 'gametester', icon: '🎮', name: 'video game tester', odd: true, reasons: [
      R('You play new games before everybody else.', 'time', 'daily'),
      R('You find a big bug and save the game!', 'help', 'big'),
      R('You give ideas to make the game better.', 'create', 'good'),
      R('You work with other gamers.', 'team', 'good'),
      R('You can work from home.', 'family', 'good'),
      R('Your name is in the credits of a famous game.', 'fame', 'dream'),
    ], bad: [B('You play the same level a hundred times.', 'time'), B('It makes medium money, not a lot.', 'money')] },
    { k: 'panda', icon: '🐼', name: 'panda keeper', odd: true, reasons: [
      R('You play with baby pandas every day.', 'nature', 'daily'),
      R('You help to save an animal in danger.', 'help', 'big'),
      R('A baby panda is born!', 'nature', 'wow'),
      R('You live in the mountains of China.', 'travel', 'good'),
      R('You work in a team of animal experts.', 'team', 'good'),
      R('Your panda video is seen all over the world.', 'fame', 'dream'),
    ], bad: [B('You clean a lot of panda poo, every day.', 'time'), B('You live far away from your family.', 'family')] },
    { k: 'stunt', icon: '🎬', name: 'stunt performer', odd: true, reasons: [
      R('You jump, fall and fight in films.', 'travel', 'daily'),
      R('You crash a car in a big film!', 'travel', 'wow'),
      R('You work with a great team.', 'team', 'good'),
      R('You train hard and you are ready for anything.', 'safe', 'calm'),
      R('You meet famous actors.', 'fame', 'good'),
      R('It makes good money.', 'money', 'good'),
    ], bad: [B('You can get hurt.', 'safe'), B('Nobody knows your name: the actor gets the glory.', 'fame')] },
    { k: 'bed', icon: '🛏️', name: 'bed tester', odd: true, reasons: [
      R('You get paid to sleep!', 'time', 'daily'),
      R('You sleep a week in a palace hotel!', 'travel', 'big'),
      R('You help people sleep better.', 'help', 'good'),
      R('You can work near your family.', 'family', 'good'),
      R('A long nap makes you ready for anything.', 'safe', 'calm'),
      R('Your sleep blog becomes famous.', 'fame', 'dream'),
    ], bad: [B('It makes little money.', 'money'), B('Some beds are hard and noisy: you can’t sleep!', 'time')] },
  ];
  const JOB = Object.fromEntries(JOBS.map(j => [j.k, j]));

  // what a dream says when it works / when it does not
  const DREAM_TEXT = {
    fame: ['⭐ WOW! You are famous! Everybody knows your name!', '😕 Nobody noticed you today…'],
    money: ['💰 JACKPOT! You made a fortune!', '😕 No big money this time…'],
  };

  const AVATARS = ['🧒', '👧', '👦', '🧑', '👩', '🧔', '👱‍♀️', '👩‍🦱', '👨‍🦰', '🧑‍🦱', '👩‍🦳', '🦊', '🐱', '🐼', '🦄', '🐸'];
  const BOTS = [{ name: 'Robo-Rita', avatar: '🤖' }, { name: 'Robo-Max', avatar: '👾' }];

  /* ================= the race (no screen here) ================= */

  const mult = (p, v) => MULT[p.hearts[v] || 0];

  function makePlayer({ name, avatar, hearts, job, picks, bot = false }) {
    const j = JOB[job];
    return {
      name, avatar, hearts, job, bot, joy: 0, turns: 0, double: false, shield: false,
      cards: picks.map(i => ({ ...j.reasons[i], left: j.reasons[i].uses, chance: DREAM.start, got: 0 })),
      basic: { ...ORDINARY, left: Infinity, got: 0 },
    };
  }

  // one turn: play a card, then maybe a bad day. Returns what happened, for the screen
  function play(p, card) {
    const out = { card, gain: 0, dream: null, doubled: false, bad: null };
    if (card.uses !== Infinity) card.left--;
    if (card.arch === 'dream') {
      const win = Math.random() < card.chance;
      out.dream = { win, chance: card.chance };
      if (win) { out.gain = Math.round(DREAM.jackpot * mult(p, card.v)); card.chance = DREAM.start; }
      else { out.gain = -Math.round(DREAM.miss * mult(p, card.v)); card.chance = Math.min(DREAM.max, card.chance + DREAM.step); }
    } else if (card.arch === 'basic') out.gain = card.gain;
    else out.gain = Math.round(ARCH[card.arch].gain * mult(p, card.v));
    if (out.gain > 0 && p.double && card.arch !== 'grow') { out.gain *= 2; out.doubled = true; p.double = false; }
    if (card.arch === 'grow') p.double = true;
    if (card.arch === 'calm') p.shield = true;
    p.joy = Math.max(0, p.joy + out.gain);
    card.got += out.gain;
    p.turns++;
    if (p.joy < GOAL && Math.random() < BAD_CHANCE) {
      const b = JOB[p.job].bad[Math.floor(Math.random() * 2)];
      if (p.shield) { p.shield = false; out.bad = { ...b, loss: 0, blocked: true }; }
      else {
        const loss = Math.round(BAD * mult(p, b.v));
        p.joy = Math.max(0, p.joy - loss);
        out.bad = { ...b, loss };
      }
    }
    return out;
  }

  // how much a card is worth on average for this player (the computer players use it)
  function worth(p, c) {
    if (c.arch === 'basic') return c.gain;
    const m = mult(p, c.v);
    if (c.arch === 'dream') return (c.chance * DREAM.jackpot - (1 - c.chance) * DREAM.miss) * m;
    const a = ARCH[c.arch];
    return a.gain * m + (c.arch === 'grow' ? 7 : c.arch === 'calm' ? 2 : 0);
  }
  const playable = p => [...p.cards.filter(c => c.left > 0), p.basic];

  function botPick(p) {
    const list = playable(p);
    // save the "once only" moments for a doubled turn, keep the rest roughly in order of value
    const score = c => worth(p, c) * (p.double && c.arch !== 'grow' ? 2 : 1) * (.8 + Math.random() * .4);
    return list.reduce((best, c) => (score(c) > score(best) ? c : best), list[0]);
  }

  // a computer player: random hearts, the job that fits them best, its 4 best reasons
  function makeBot(i) {
    const hearts = {};
    let left = HEARTS;
    while (left > 0) {
      const v = VALUES[Math.floor(Math.random() * VALUES.length)].k;
      if ((hearts[v] || 0) < MAX_H) { hearts[v] = (hearts[v] || 0) + 1; left--; }
    }
    const tmp = { hearts };
    const rank = j => j.reasons.map((r, k) => ({ k, w: worth(tmp, { ...r, chance: DREAM.start }) * (r.uses === Infinity ? 4 : r.uses) }))
      .sort((a, b) => b.w - a.w).slice(0, 4);
    const fit = j => rank(j).reduce((t, x) => t + x.w, 0) - j.bad.reduce((t, b) => t + BAD * mult(tmp, b.v), 0) * 2 + Math.random() * 12;
    const job = JOBS.reduce((best, j) => (fit(j) > fit(best) ? j : best), JOBS[0]);
    return makePlayer({ ...BOTS[i], hearts, job: job.k, picks: rank(job).map(x => x.k), bot: true });
  }

  const api = { GOAL, HEARTS, VALUES, ARCH, JOBS, makePlayer, makeBot, play, botPick, worth };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof document === 'undefined') return;

  /* ================= the pop-up ================= */

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const an = w => (/^[aeiou]/i.test(w) ? 'an' : 'a');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const lower = t => t.charAt(0).toLowerCase() + t.slice(1).replace(/[.!]+$/, '');

  const overlay = document.createElement('div');
  overlay.className = 'jr-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Happy Job Race');
  overlay.innerHTML = '<div class="jr-box"><button type="button" class="jr-close" aria-label="Close">✕</button><div class="jr-screen"></div></div>';
  document.body.append(overlay);
  const screen = overlay.querySelector('.jr-screen');
  const $ = sel => screen.querySelector(sel);
  let lastFocus = null;

  let humans = 1;           // how many people play (1 = against the computer)
  let maker = 0;            // which player is making their card now
  let made = [];            // the setups made so far: { name, avatar, hearts, job, picks }
  let draft = null;         // the setup being made
  let race = null;          // { players, turn, round, busy, over, token, log }

  function open() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    modes();
    overlay.querySelector('.jr-close').focus();
  }
  function close() {
    if (race) race.token = null;
    overlay.hidden = true;
    lastFocus?.focus();
  }

  const heartsLeft = () => HEARTS - Object.values(draft.hearts).reduce((t, n) => t + n, 0);
  const heartRow = n => '❤️'.repeat(n) || '<i class="jr-zero">–</i>';

  // the hearts of 9.17 in the book ([jobs-career:L]): each value is an .opt with the buttons 1 2 3 4
  function bookHearts() {
    const hearts = {};
    let total = 0;
    VALUES.forEach(v => {
      const n = +(document.querySelector(`#jb917-${v.k} button.on`)?.textContent || 0);
      if (n) { hearts[v.k] = n; total += n; }
    });
    return { hearts, total };
  }

  // the job written on [jobs-pros:R], question 1 ("What job would you like…?"), if it is one of ours
  function dreamJob() {
    const t = (document.getElementById('jb912-0')?.value || '').toLowerCase();
    return JOBS.find(j => t.includes(j.name.toLowerCase()))?.k || '';
  }

  /* ---- 0. how many players ---- */
  function modes() {
    if (race) race.token = null;
    race = null; made = []; maker = 0;
    screen.innerHTML = `
      <h2 class="jr-title">Happy Job Race</h2>
      <p class="jr-sub">Choose a job, play your reasons and be the first to reach <b>${GOAL} happiness</b>!</p>
      <div class="jr-modes">
        <button type="button" class="jr-mode" data-act="mode" data-n="1"><i>🧒 🏁 🤖🤖</i><b>Me vs the computer</b><span>1 player. You race against two robots.</span></button>
        <div class="jr-mode many">
          <i>🧒 🏁 👧</i><b>Friends on one computer</b><span>2, 3 or 4 players (or teams!). Take turns at the keyboard.</span>
          <div class="jr-nums">${[2, 3, 4].map(n => `<button type="button" class="jr-btn" data-act="mode" data-n="${n}">${n} players</button>`).join('')}</div>
        </div>
      </div>
      <div class="jr-how">
        <b>How to play</b>
        <ol>
          <li>Make your <b>Me card</b>: give your ${HEARTS} ❤️ to the things that matter to you in a job.</li>
          <li>Choose a <b>job</b> and <b>4 reasons</b> why you want it.</li>
          <li>In the race, play <b>one reason</b> each turn. The more ❤️ you gave to it, the happier you get!</li>
          <li><b>Dreams</b> 🎲 like fame are a gamble: they rarely come true… but when they do, WOW!</li>
          <li>Careful: every job has a <b>bad side</b> 😬 too.</li>
        </ol>
      </div>`;
  }

  /* ---- 1. the Me card: name, picture, hearts ---- */
  function meCard() {
    const p = humans > 1 ? `Player ${maker + 1}` : 'Your';
    screen.innerHTML = `
      <h2 class="jr-title">${humans > 1 ? `${p}: your Me card` : 'Your Me card'}</h2>
      <p class="jr-sub">${draft.fromBook ? `These are your hearts from exercise 9.17! You can still change them.` : `What makes you happy in a job? Give your <b>${HEARTS} hearts</b> (up to ${MAX_H} for one thing).`}</p>
      <label class="jr-name">My name <input type="text" maxlength="18" autocomplete="off" value="${esc(draft.name)}" placeholder="e.g. Maya"></label>
      <div class="jr-avs">${AVATARS.map(a => `<button type="button" class="jr-av${a === draft.avatar ? ' on' : ''}" data-act="avatar" data-a="${a}" aria-label="Picture ${a}">${a}</button>`).join('')}</div>
      <div class="jr-values">${VALUES.map(v => `
        <div class="jr-val" data-v="${v.k}">
          <span class="jr-vname"><i>${v.icon}</i>${v.name}</span>
          <span class="jr-hearts">${Array.from({ length: MAX_H }, (_, i) => `<button type="button" data-act="heart" data-v="${v.k}" data-n="${i + 1}" aria-label="${v.name}: ${i + 1} heart${i ? 's' : ''}">♥</button>`).join('')}</span>
        </div>`).join('')}
      </div>
      <p class="jr-count" aria-live="polite"></p>
      <div class="jr-nav">
        ${maker === 0 ? '<button type="button" class="jr-btn" data-act="modes">◀ Back</button>' : ''}
        <button type="button" class="jr-btn go" data-act="jobs">Choose a job ▶</button>
      </div>`;
    paintHearts();
  }

  function paintHearts() {
    screen.querySelectorAll('.jr-val').forEach(row => {
      const n = draft.hearts[row.dataset.v] || 0;
      row.classList.toggle('on', n > 0);
      row.querySelectorAll('[data-act="heart"]').forEach(b => b.classList.toggle('on', +b.dataset.n <= n));
    });
    const left = heartsLeft();
    $('.jr-count').textContent = left > 0 ? `You have ${left} heart${left === 1 ? '' : 's'} left.` : 'All your hearts are on your Me card! Click a heart again to take it off.';
    $('[data-act="jobs"]').disabled = left > 0;
  }

  function setHeart(v, n) {
    const now = draft.hearts[v] || 0;
    const want = n === now ? n - 1 : n;  // click the last full heart to take it off
    const room = heartsLeft() + now;
    draft.hearts[v] = Math.min(want, room);
    paintHearts();
    if (want > room) $('.jr-count').textContent = 'No hearts left! Take one off from something else first.';
  }

  const readName = () => { const i = $('.jr-name input'); if (i) draft.name = i.value.trim().slice(0, 18); };

  /* ---- 2. choose a job ---- */
  const valueIcons = j => [...new Set(j.reasons.map(r => r.v))].map(v => `<i title="${VAL[v].name}">${VAL[v].icon}</i>`).join('');

  function jobs() {
    readName();
    const dream = maker === 0 ? dreamJob() : '';
    screen.innerHTML = `
      <h2 class="jr-title">Choose a job</h2>
      <p class="jr-sub">Look at your hearts: which job gives you what <b>you</b> care about?</p>
      <div class="jr-mine">${myHearts(draft.hearts)}</div>
      <div class="jr-jobs">${JOBS.map(j => `
        <button type="button" class="jr-job${j.k === draft.job ? ' on' : ''}" data-act="job" data-k="${j.k}">
          ${j.k === dream ? '<small class="jr-dream">your dream job!</small>' : j.odd ? '<small class="jr-dream odd">unusual!</small>' : ''}
          <span class="jr-jicon">${j.icon}</span><b>${an(j.name)} ${j.name}</b><span class="jr-jvals">${valueIcons(j)}</span>
        </button>`).join('')}
      </div>
      <div class="jr-nav">
        <button type="button" class="jr-btn" data-act="me">◀ Back</button>
      </div>`;
  }
  const myHearts = h => VALUES.filter(v => h[v.k]).map(v => `<span>${v.icon} ${v.name} <b>${'❤️'.repeat(h[v.k])}</b></span>`).join('');

  /* ---- 3. choose 4 reasons ---- */
  function reasons() {
    const j = JOB[draft.job];
    screen.innerHTML = `
      <h2 class="jr-title">${j.icon} Why ${an(j.name)} ${j.name}?</h2>
      <p class="jr-sub">Choose the <b>4 reasons</b> you will play in the race. Read them carefully: how often? how strong? Nobody tells you, you decide!</p>
      <div class="jr-mine">${myHearts(draft.hearts)}</div>
      <div class="jr-rgrid">${j.reasons.map((r, i) => `
        <button type="button" class="jr-rcard" data-act="reason" data-i="${i}">
          <span class="jr-rval">${VAL[r.v].icon} ${VAL[r.v].name} ${heartRow(draft.hearts[r.v] || 0)}</span>
          <b>${esc(r.text)}</b>${r.arch === 'dream' ? '<span class="jr-tag">🎲 a dream</span>' : ''}
        </button>`).join('')}
      </div>
      <div class="jr-badbox"><b>😬 The bad side of this job</b>${j.bad.map(b => `<p>${VAL[b.v].icon} ${esc(b.text)} <span>${heartRow(draft.hearts[b.v] || 0)}</span></p>`).join('')}<small>A bad side hurts more if you gave hearts to what it takes away.</small></div>
      <p class="jr-count" aria-live="polite"></p>
      <div class="jr-nav">
        <button type="button" class="jr-btn" data-act="jobs">◀ Another job</button>
        <button type="button" class="jr-btn go" data-act="ready">${maker + 1 < humans ? `Done! Next player ▶` : 'Start the race! 🏁'}</button>
      </div>`;
    paintReasons();
  }

  function paintReasons() {
    screen.querySelectorAll('.jr-rcard').forEach(b => b.classList.toggle('on', draft.picks.includes(+b.dataset.i)));
    const n = draft.picks.length;
    $('.jr-count').textContent = n < 4 ? `Choose ${4 - n} more reason${n === 3 ? '' : 's'}.` : 'Four reasons chosen! Click one to take it off.';
    $('[data-act="ready"]').disabled = n !== 4;
  }

  function toggleReason(i) {
    const at = draft.picks.indexOf(i);
    if (at >= 0) draft.picks.splice(at, 1);
    else if (draft.picks.length < 4) draft.picks.push(i);
    else { $('.jr-count').textContent = 'Only 4 reasons! Click one you chose to take it off.'; return; }
    paintReasons();
  }

  function newDraft() {
    const used = made.map(m => m.avatar);
    const free = AVATARS.filter(a => !used.includes(a));
    // the first player starts from the hearts of 9.17 in the book (if they are not more than 12)
    const book = maker === 0 ? bookHearts() : null;
    draft = { name: '', avatar: free[Math.floor(Math.random() * Math.min(free.length, 10))], hearts: book && book.total <= HEARTS ? book.hearts : {}, job: '', picks: [], fromBook: !!book && book.total > 0 && book.total <= HEARTS };
  }

  function done() {
    draft.name = draft.name || (humans > 1 ? `Player ${maker + 1}` : 'Me');
    made.push(draft);
    if (maker + 1 < humans) {
      maker++;
      newDraft();
      screen.innerHTML = `
        <div class="jr-pass">
          <div class="jr-big">🔄</div>
          <h2 class="jr-title">Player ${maker + 1}, your turn!</h2>
          <p>${esc(made[maker - 1].name)} is ready to be ${an(JOB[made[maker - 1].job].name)} ${JOB[made[maker - 1].job].name}. Now make your Me card.</p>
          <button type="button" class="jr-btn go" data-act="me">I am Player ${maker + 1} ▶</button>
        </div>`;
      return;
    }
    start();
  }

  /* ---- 4. the race ---- */
  function start() {
    const players = made.map(m => makePlayer(m));
    if (humans === 1) players.push(makeBot(0), makeBot(1));
    race = { players, turn: 0, round: 1, busy: false, over: false, token: {}, log: [] };
    screen.innerHTML = `
      <div class="jr-track"></div>
      <div class="jr-log" aria-live="polite"></div>
      <div class="jr-play"></div>
      <div class="jr-nav"><button type="button" class="jr-btn" data-act="quit">Stop the race</button></div>`;
    const bots = players.filter(p => p.bot);
    say(bots.length ? `The race starts! ${bots.map(b => `${b.avatar} ${esc(b.name)} is ${an(JOB[b.job].name)} ${JOB[b.job].name}`).join(', ')}.` : 'The race starts! Who will be happy first?');
    paint();
    next();
  }

  function say(text, cls = '') {
    race.log.push({ text, cls });
    const box = $('.jr-log');
    if (box) box.innerHTML = race.log.slice(-4).map((l, i, all) => `<p class="${l.cls}${i === all.length - 1 ? ' last' : ''}">${l.text}</p>`).join('');
  }

  function paintTrack() {
    $('.jr-track').innerHTML = race.players.map((p, i) => {
      const pct = Math.min(100, p.joy / GOAL * 100);
      const j = JOB[p.job];
      return `
        <div class="jr-lane${i === race.turn && !race.over ? ' now' : ''}" data-i="${i}">
          <span class="jr-who"><b>${esc(p.name)}</b><small>${j.icon} ${j.name}</small></span>
          <span class="jr-road"><span class="jr-fill" style="width:${pct}%"></span><span class="jr-runner" style="left:${pct}%">${p.avatar}</span><span class="jr-goal">🏁</span></span>
          <span class="jr-joy">${p.joy}<small>😊</small></span>
          <span class="jr-st">${p.double ? '<i title="Your next reason gives double">✖️2</i>' : ''}${p.shield ? '<i title="Your next bad day will not hurt">☂️</i>' : ''}</span>
        </div>`;
    }).join('');
  }

  const pips = c => c.uses === Infinity ? '<i class="jr-inf">always</i>'
    : Array.from({ length: c.uses }, (_, k) => `<i class="${k < c.left ? 'on' : ''}"></i>`).join('');

  function paintHand() {
    const p = race.players[race.turn];
    const box = $('.jr-play');
    if (race.over) { box.innerHTML = ''; return; }
    if (p.bot) { box.innerHTML = `<p class="jr-wait">${p.avatar} <b>${esc(p.name)}</b> is thinking…</p>`; return; }
    const list = [...p.cards, p.basic];
    box.innerHTML = `
      <p class="jr-turn">${p.avatar} <b>${esc(p.name)}</b>, it’s your turn! Which reason do you play?</p>
      <div class="jr-hand">${list.map((c, i) => `
        <button type="button" class="jr-card${c.arch === 'dream' ? ' dream' : ''}" data-act="card" data-i="${i}" ${race.busy || c.left <= 0 ? 'disabled' : ''}>
          ${c.v ? `<span class="jr-rval">${VAL[c.v].icon} ${heartRow(p.hearts[c.v] || 0)}</span>` : '<span class="jr-rval">☕</span>'}
          <b>${esc(c.text)}</b>
          <span class="jr-hint">${esc(c.arch === 'basic' ? c.hint : ARCH[c.arch].hint)}</span>
          ${c.arch === 'dream' ? `<span class="jr-chance">🎲 chance: <b>${Math.round(c.chance * 100)}%</b></span>` : ''}
          <span class="jr-pips">${pips(c)}</span>
        </button>`).join('')}
      </div>`;
  }

  function paint() { paintTrack(); paintHand(); }

  function floatOn(i, text, cls) {
    const lane = $(`.jr-lane[data-i="${i}"] .jr-road`);
    if (!lane) return;
    const f = document.createElement('span');
    f.className = `jr-float ${cls}`;
    f.textContent = text;
    lane.append(f);
    setTimeout(() => f.remove(), 1400);
  }

  // whose turn: a computer player plays by itself
  async function next() {
    const g = race, tok = g.token;
    const p = g.players[g.turn];
    paint();
    if (!p.bot) return;
    g.busy = true;
    await wait(900); if (g.token !== tok) return;
    await turn(botPick(p));
  }

  async function turn(card) {
    const g = race, tok = g.token, i = g.turn, p = g.players[i];
    g.busy = true;
    paintHand();
    const out = play(p, card);
    const sign = n => (n > 0 ? `+${n}` : `${n}`);
    if (out.dream) {
      $('.jr-play').innerHTML = `<p class="jr-roll">🎲 <b>${esc(p.name)}</b> tries: “${esc(card.text)}” <span>${Math.round(out.dream.chance * 100)}% chance…</span></p>`;
      await wait(1100); if (g.token !== tok) return;
      const [yes, no] = DREAM_TEXT[card.v] || ['🌟 WOW! Your dream comes true!', '😕 Not this time…'];
      say(`<b>${esc(p.name)}</b>: “${esc(card.text)}” ${out.dream.win ? yes : no} <em>${sign(out.gain)} 😊</em>`, out.dream.win ? 'win' : 'miss');
      if (out.dream.win) overlay.querySelector('.jr-box').classList.add('jr-flash');
      setTimeout(() => overlay.querySelector('.jr-box').classList.remove('jr-flash'), 900);
    } else {
      say(`<b>${esc(p.name)}</b>: “${esc(card.text)}” <em>${sign(out.gain)} 😊</em>${out.doubled ? ' (double!)' : ''}${card.arch === 'grow' ? ' Next reason: double!' : ''}${card.arch === 'calm' ? ' ☂️ Ready for a bad day.' : ''}`, p.bot ? 'bot' : 'me');
    }
    floatOn(i, `${sign(out.gain)} 😊`, out.gain >= 0 ? 'up' : 'down');
    paintTrack();
    if (p.joy >= GOAL) { await wait(900); if (g.token !== tok) return; finish(p); return; }
    if (out.bad) {
      await wait(1100); if (g.token !== tok) return;
      say(out.bad.blocked ? `😬 Bad day for <b>${esc(p.name)}</b>: “${esc(out.bad.text)}” …but ☂️ it doesn’t hurt!` : `😬 Bad day for <b>${esc(p.name)}</b>: “${esc(out.bad.text)}” <em>-${out.bad.loss} 😊</em>`, 'bad');
      if (out.bad.loss) floatOn(i, `-${out.bad.loss} 😬`, 'down');
      paintTrack();
    }
    await wait(p.bot ? 1200 : 1000); if (g.token !== tok) return;
    g.turn = (g.turn + 1) % g.players.length;
    if (g.turn === 0) g.round++;
    g.busy = false;
    next();
  }

  /* ---- 5. the end ---- */
  function finish(winner) {
    race.over = true;
    const human = race.players.filter(p => !p.bot);
    const sentence = p => {
      const best = [...p.cards].filter(c => c.got > 0).sort((a, b) => b.got - a.got).slice(0, 2);
      const j = JOB[p.job];
      return best.length ? `I would like to be ${an(j.name)} ${j.name} because ${best.map(c => lower(c.text)).join(' and ')}.` : `I would like to be ${an(j.name)} ${j.name}.`;
    };
    const rank = [...race.players].sort((a, b) => b.joy - a.joy);
    screen.innerHTML = `
      <div class="jr-end">
        <div class="jr-big">${winner.bot ? '🤖' : '🏆'}</div>
        <h2 class="jr-title">${esc(winner.name)} is the happiest!</h2>
        <p>${winner.avatar} ${esc(winner.name)}, ${an(JOB[winner.job].name)} ${JOB[winner.job].name}, reached ${GOAL} happiness in ${winner.turns} turns.</p>
        <ol class="jr-rank">${rank.map(p => `<li>${p.avatar} <b>${esc(p.name)}</b> · ${JOB[p.job].icon} ${JOB[p.job].name} · ${Math.min(p.joy, GOAL)} 😊</li>`).join('')}</ol>
        <div class="jr-why"><b>✏️ Now say it in English!</b> Your best reasons in this race:
          ${human.map(p => `<p>${p.avatar} <i>${esc(sentence(p))}</i></p>`).join('')}
          <small>Is it true for you too? Use it in exercise 9.27!</small>
        </div>
        <button type="button" class="jr-btn go" data-act="again">Race again with the same jobs 🏁</button>
        <button type="button" class="jr-btn" data-act="modes">New game</button>
      </div>`;
  }

  /* ---- clicks ---- */
  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target.closest('.jr-close')) { close(); return; }
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    if (act === 'mode') { humans = +btn.dataset.n; maker = 0; made = []; newDraft(); meCard(); }
    else if (act === 'modes') modes();
    else if (act === 'avatar') { draft.avatar = btn.dataset.a; screen.querySelectorAll('.jr-av').forEach(b => b.classList.toggle('on', b === btn)); }
    else if (act === 'heart') setHeart(btn.dataset.v, +btn.dataset.n);
    else if (act === 'me') meCard();
    else if (act === 'jobs') jobs();
    else if (act === 'job') { if (draft.job !== btn.dataset.k) draft.picks = []; draft.job = btn.dataset.k; reasons(); }
    else if (act === 'reason') toggleReason(+btn.dataset.i);
    else if (act === 'ready') done();
    else if (act === 'card') { if (!race || race.busy || race.over) return; const p = race.players[race.turn]; const c = [...p.cards, p.basic][+btn.dataset.i]; if (c && c.left > 0) turn(c); }
    else if (act === 'again') start();
    else if (act === 'quit') modes();
  });

  // the name typed on the Me card is kept when going back and forth
  overlay.addEventListener('input', e => { if (e.target.closest('.jr-name') && draft) draft.name = e.target.value.trim().slice(0, 18); });

  // while the pop-up is open the keys do not turn the pages
  window.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    e.stopPropagation();
    if (e.key === 'Escape') close();
  }, true);

  document.querySelectorAll('.jr-start').forEach(b => b.addEventListener('click', open));

  /* ================= 9.17 in the book: how many hearts are used ================= */
  // script.js saves and paints the hearts (they are .opt); here we only count them
  const sheet = document.getElementById('jb917'), counter = document.getElementById('jb917-count');
  function countHearts() {
    const { total } = bookHearts();
    counter.innerHTML = total > HEARTS ? `Too many! <b>❤ ${total} / ${HEARTS}</b>` : `<b>❤ ${total} / ${HEARTS}</b>`;
    counter.classList.toggle('over', total > HEARTS);
  }
  if (sheet && counter) {
    sheet.addEventListener('click', () => setTimeout(countHearts));
    document.addEventListener('spreadchange', countHearts); // the answers may arrive later from the cloud
    countHearts();
  }

  /* ================= opens by itself at the end of its page ================= */
  // like Villain Battle: when the pupil scrolls to the very end of the spread, the pop-up appears (once)
  const SPREAD = 'jobs-pros';
  let shown = false;
  const atBottom = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
  function check() {
    const cur = document.querySelector('.spread.current');
    if (shown || !cur || cur.dataset.id !== SPREAD || !overlay.hidden) return;
    if (document.documentElement.classList.contains('gq-open')) return;
    if (atBottom() && cur.getBoundingClientRect().bottom <= window.innerHeight) { shown = true; open(); }
  }
  let queued = false;
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; check(); }); } };
  window.addEventListener('scroll', later, { passive: true });
  window.addEventListener('wheel', e => { if (e.deltaY > 0) later(); }, { passive: true });
  window.addEventListener('resize', later);
  document.addEventListener('spreadchange', later);

  /* ================= the Games list on the home page ================= */
  window.addEventListener('load', () => {
    const list = document.getElementById('gameList');
    if (!list || typeof PAGES === 'undefined') return;
    const at = PAGES.of('jobs-pros');
    const pill = document.createElement('details');
    pill.className = 'game-topic';
    pill.style.setProperty('--c', '#e8820c');
    pill.innerHTML = `<summary>Jobs <small>1</small></summary><div class="topic-pages"><a href="#p${at}" data-jr>🏁 Happy Job Race</a></div>`;
    list.append(pill);
    document.addEventListener('click', e => { if (!e.target.closest('#gameList')) pill.open = false; });
    pill.addEventListener('toggle', () => {
      if (pill.open) list.querySelectorAll('.game-topic').forEach(o => { if (o !== pill) o.open = false; });
    });
    pill.querySelector('[data-jr]').addEventListener('click', e => {
      e.preventDefault();
      pill.open = false;
      if (location.hash === `#p${at}`) { open(); return; }
      document.addEventListener('spreadchange', open, { once: true });
      location.hash = `#p${at}`;
    });
    window.hideClosedGames?.();
  });
})();
