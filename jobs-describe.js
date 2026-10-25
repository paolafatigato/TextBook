// [jobs-describe]: getting ready for the jobs test ([scaf-jobs-test-a] …).
// Left page (9.43): the pupil picks a random job and, for every part of the text (where, when, money…),
// chooses the right words out of three; at the end the sentences become a text to copy.
// Right page (9.44): the Job Flag Game, for the whole class: the teacher holds the flag, clicks for a job
// (level 2: also the part of the job to talk about) and calls a number.
// The colors of the parts are the ones of the legend of the model test (style.css .k-what, .k-where…).

(() => {
  const $ = id => document.getElementById(id);
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // the parts of the text: the label, the start of the sentence, the question for the flag game
  const PARTS = [
    { k: 'what', label: 'what', start: j => `${cap(j.a)} is someone who…`, q: 'What do they do?' },
    { k: 'where', label: 'where', start: () => 'They work…', q: 'Where do they work?' },
    { k: 'when', label: 'when', start: () => 'They work…', q: 'When do they work?' },
    { k: 'money', label: 'money', start: () => 'They make…', q: 'How much money do they make?' },
    { k: 'who', label: 'who with', start: () => 'They work with…', q: 'Who do they work with?' },
    { k: 'tools', label: 'tools', start: () => 'They use…', q: 'What do they use?' },
    { k: 'skills', label: 'skills', start: () => 'They have to be…', q: 'What do they have to be good at?' },
    { k: 'good', label: 'good side', start: () => 'The good side is that you can…', q: 'What is the good side?' },
    { k: 'bad', label: 'bad side', start: () => 'The bad side is that you have to…', q: 'What is the bad side?' },
  ];
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const MONEY = { lot: 'a lot of money', quite: 'quite a lot of money', little: 'not much money' };

  // for every part: [the right answer, two wrong ones]; money is one of MONEY (the three are always the options)
  const JOBS = [
    { a: 'a doctor', pic: '🩺',
      what: ['helps sick people get better', 'cuts and styles hair', 'grows food and keeps animals'],
      where: ['in a hospital', 'in a garage', 'on a farm'],
      when: ['day and night, in shifts', 'only on the weekend', 'only in the summer'],
      money: 'lot',
      who: ['patients and nurses', 'passengers', 'cows and chickens'],
      tools: ['a stethoscope', 'a hammer and nails', 'scissors and a comb'],
      skills: ['calm and good at science', 'good at drawing', 'good at soccer'],
      good: ['save people\'s lives', 'play all day', 'travel to space'],
      bad: ['work at night and study for many years', 'wear a clown costume', 'work alone in the woods'] },
    { a: 'a nurse', pic: '💉',
      what: ['looks after patients in a hospital', 'sells things in a shop', 'flies planes'],
      where: ['in a hospital', 'in a restaurant kitchen', 'at a stadium'],
      when: ['day and night, in shifts', 'only on Monday morning', 'only in the summer'],
      money: 'quite',
      who: ['patients and doctors', 'customers in a shop', 'animals on a farm'],
      tools: ['thermometers and syringes', 'knives and pans', 'a tractor'],
      skills: ['kind and patient', 'famous', 'good at singing'],
      good: ['help people every day', 'become famous', 'sleep at work'],
      bad: ['work long shifts, also at night', 'wear a helmet in space', 'drive a truck all day'] },
    { a: 'a vet', pic: '🐶',
      what: ['treats sick animals', 'repairs cars', 'teaches children'],
      where: ['in an animal hospital', 'in a school', 'on a plane'],
      when: ['in the day, and sometimes at night for emergencies', 'only at night', 'only on Sundays'],
      money: 'quite',
      who: ['animals and their owners', 'passengers', 'students'],
      tools: ['a stethoscope and bandages', 'a microphone', 'bricks and cement'],
      skills: ['good with animals and calm', 'good at cooking', 'good at dancing'],
      good: ['save a dog\'s life', 'eat a lot of ice cream', 'travel to the moon'],
      bad: ['see sick animals, and some animals bite', 'work under the sea', 'fly planes at night'] },
    { a: 'a teacher', pic: '📚',
      what: ['helps students learn', 'puts out fires', 'repairs cars'],
      where: ['in a school', 'in a garage', 'at a fire station'],
      when: ['in the day, from Monday to Friday', 'at night, in shifts', 'only on the weekend'],
      money: 'quite',
      who: ['students and other teachers', 'passengers', 'patients'],
      tools: ['books, a board and a computer', 'a tractor', 'a hose and a helmet'],
      skills: ['patient and organized', 'very strong', 'good at flying planes'],
      good: ['have long summer vacations', 'sleep in class', 'drive fast cars'],
      bad: ['correct a lot of homework at home', 'work in the rain all day', 'wear a space suit'] },
    { a: 'a chef', pic: '🍳',
      what: ['cooks in a restaurant', 'flies planes', 'treats sick animals'],
      where: ['in a restaurant kitchen', 'in a classroom', 'in a police car'],
      when: ['in the evening and on the weekend', 'only on Monday morning', 'only in the winter'],
      money: 'quite',
      who: ['a team in the kitchen', 'patients', 'students'],
      tools: ['knives and pans', 'a stethoscope', 'a wrench and a screwdriver'],
      skills: ['creative and fast', 'good with animals', 'good at swimming'],
      good: ['create new dishes', 'play video games at work', 'travel to space'],
      bad: ['stand all day in a hot kitchen', 'study for ten years at college', 'fly at night'] },
    { a: 'a pilot', pic: '✈️',
      what: ['flies planes', 'builds houses', 'cuts hair'],
      where: ['on a plane and at the airport', 'on a farm', 'in a hair salon'],
      when: ['day and night, also on the weekend', 'only from 9 to 5', 'only on Mondays'],
      money: 'lot',
      who: ['passengers and a crew', 'cows and sheep', 'children in a classroom'],
      tools: ['a lot of computers and a radio', 'scissors', 'a hammer'],
      skills: ['calm under pressure and good at English', 'good at drawing animals', 'good at cooking'],
      good: ['see the whole world', 'stay at home every day', 'play soccer at work'],
      bad: ['be away from home for many days', 'work in a dirty garage', 'look after sick animals'] },
    { a: 'a police officer', pic: '🚓',
      what: ['keeps people safe', 'cooks pizza', 'designs clothes'],
      where: ['in the streets and at the police station', 'in a restaurant kitchen', 'in a hair salon'],
      when: ['day and night, in shifts', 'only in the afternoon', 'only on vacation'],
      money: 'quite',
      who: ['a partner and people in the street', 'cows and horses', 'babies'],
      tools: ['a radio and a police car', 'scissors and a hairdryer', 'knives and pans'],
      skills: ['brave and fit', 'good at drawing', 'good at singing'],
      good: ['help people in danger', 'sleep all day', 'eat cake at work'],
      bad: ['be in dangerous situations', 'cut people\'s hair', 'fly planes'] },
    { a: 'a fire officer', pic: '🚒',
      what: ['puts out fires', 'teaches math', 'sells clothes'],
      where: ['at the fire station and at fires', 'in a school', 'in a shop'],
      when: ['day and night, in shifts', 'only in the morning', 'only in the summer'],
      money: 'quite',
      who: ['a team', 'customers', 'students'],
      tools: ['a hose, a helmet and a fire truck', 'books and a board', 'a cash register'],
      skills: ['brave, strong and fit', 'good at drawing', 'good at fashion'],
      good: ['save people\'s lives', 'sleep all day', 'travel to the moon'],
      bad: ['go into hot and dangerous places', 'correct homework', 'sit at a desk all day'] },
    { a: 'a farmer', pic: '🚜',
      what: ['grows food and keeps animals', 'flies planes', 'repairs teeth'],
      where: ['on a farm, outside', 'in an office', 'on a plane'],
      when: ['very early in the morning, every day', 'only in the evening', 'only on the weekend'],
      money: 'little',
      who: ['animals', 'passengers', 'patients'],
      tools: ['a tractor', 'a stethoscope', 'a microphone'],
      skills: ['strong and hard-working', 'good at fashion', 'famous'],
      good: ['work in nature', 'become famous on TV', 'wear elegant clothes'],
      bad: ['work outside in the rain and the cold', 'fly at night', 'wear a suit and tie'] },
    { a: 'a car mechanic', pic: '🔧',
      what: ['repairs cars', 'looks after children', 'writes books'],
      where: ['in a garage', 'in a hospital', 'in a library'],
      when: ['in the day, from Monday to Friday', 'only at night', 'only on Sundays'],
      money: 'quite',
      who: ['customers and a small team', 'patients', 'students'],
      tools: ['a wrench and a screwdriver', 'a stethoscope', 'a microphone'],
      skills: ['good with their hands', 'good at singing', 'good at fashion'],
      good: ['fix things and help people', 'travel all over the world', 'become famous'],
      bad: ['work in a dirty and noisy place', 'work in space', 'study for ten years'] },
    { a: 'a hairdresser', pic: '✂️',
      what: ['cuts and styles hair', 'puts out fires', 'flies planes'],
      where: ['in a hair salon', 'at a fire station', 'on a farm'],
      when: ['in the day, and on Saturday too', 'only at night', 'only in the summer'],
      money: 'little',
      who: ['customers', 'patients', 'animals'],
      tools: ['scissors, a comb and a hairdryer', 'a hose and a helmet', 'a tractor'],
      skills: ['creative and good with people', 'brave in fires', 'good at math'],
      good: ['make people feel beautiful', 'fly planes', 'sleep at work'],
      bad: ['stand all day', 'go into fires', 'work on a farm'] },
    { a: 'a shop assistant', pic: '🛍️',
      what: ['sells things in a shop', 'treats animals', 'builds houses'],
      where: ['in a shop', 'in a hospital', 'on a building site'],
      when: ['in the day, and on Saturday too', 'at night, in shifts', 'only in the summer'],
      money: 'little',
      who: ['customers', 'patients', 'animals'],
      tools: ['a cash register and a computer', 'a tractor', 'a hose'],
      skills: ['kind and good with people', 'very brave', 'good with animals'],
      good: ['meet a lot of people', 'travel to space', 'save lives'],
      bad: ['stand all day, also with rude customers', 'go into fires', 'fly at night'] },
    { a: 'a builder', pic: '🧱',
      what: ['builds houses', 'cooks food', 'teaches English'],
      where: ['on a building site, outside', 'in a classroom', 'in a restaurant kitchen'],
      when: ['in the day, from Monday to Friday', 'at night, in shifts', 'only on Sundays'],
      money: 'quite',
      who: ['a team', 'students', 'patients'],
      tools: ['a hammer, bricks and cement', 'scissors', 'a stethoscope'],
      skills: ['strong and good with their hands', 'good at singing', 'good at languages'],
      good: ['see the houses you build', 'travel to space', 'sleep at work'],
      bad: ['work outside in the cold and in the heat', 'wear a white coat', 'correct homework'] },
    { a: 'a taxi driver', pic: '🚕',
      what: ['drives people around the city', 'cuts hair', 'grows food'],
      where: ['in a car, in the city', 'on a farm', 'in a school'],
      when: ['day and night, also on the weekend', 'only in the morning', 'only in the summer'],
      money: 'little',
      who: ['passengers', 'animals', 'students'],
      tools: ['a car and a GPS', 'a tractor', 'books'],
      skills: ['good at driving and calm in traffic', 'good at cooking', 'good at drawing'],
      good: ['meet new people every day', 'fly planes', 'become famous'],
      bad: ['sit in traffic for many hours', 'work on a farm', 'go into fires'] },
    { a: 'a dentist', pic: '🦷',
      what: ['looks after your teeth', 'repairs cars', 'puts out fires'],
      where: ['in a dental office', 'in a garage', 'at a fire station'],
      when: ['in the day, from Monday to Friday', 'only at night', 'only on the weekend'],
      money: 'lot',
      who: ['patients and an assistant', 'passengers', 'cows'],
      tools: ['a little mirror and a drill', 'a hose', 'a tractor'],
      skills: ['careful and good at science', 'good at soccer', 'good at singing'],
      good: ['help people smile', 'play all day', 'travel to space'],
      bad: ['study for many years and see scared patients', 'work outside in the rain', 'drive at night'] },
    { a: 'a soccer player', pic: '⚽',
      what: ['plays soccer for a team', 'sells clothes', 'treats animals'],
      where: ['on the field and in the gym', 'in an office', 'in a hospital'],
      when: ['every day, with games on the weekend', 'only from Monday to Friday, 9 to 5', 'only at night'],
      money: 'lot',
      who: ['a team and a coach', 'patients', 'customers in a shop'],
      tools: ['a ball and soccer cleats', 'a stethoscope', 'a cash register'],
      skills: ['physically fit and a team player', 'good at math', 'good at cooking'],
      good: ['become famous and travel', 'sleep all day', 'eat junk food every day'],
      bad: ['train every day and eat healthy food', 'correct homework', 'work in a dirty garage'] },
  ];
  const right = (j, k) => (k === 'money' ? MONEY[j.money] : j[k][0]);
  const options = (j, k) => (k === 'money' ? Object.values(MONEY) : shuffle(j[k]));

  // a bag: every item once, in random order, then again
  const bag = items => {
    let left = [];
    return () => {
      if (!left.length) left = shuffle(items);
      return left.pop();
    };
  };

  /* ---------- 9.43: pick a job and choose ---------- */
  const box = $('jbd');
  if (box) {
    const nextJob = bag(JOBS);
    let job = null, done = {};

    const sentence = (j, p) => {
      const start = p.start(j).replace('…', '');
      return `<mark class="k-${p.k}">${esc(start)} ${esc(right(j, p.k))}.</mark>`;
    };

    function draw() {
      job = nextJob();
      done = {};
      render();
    }

    // before the draw the rows are already there, with empty choices
    const NONE = { a: 'a …', pic: '❔' };

    function render() {
      const j = job || NONE;
      const n = Object.values(done).filter(Boolean).length;
      const opts = p => (!job ? ['', '', ''] : done[p.k] ? [right(job, p.k)] : options(job, p.k));
      box.innerHTML = `
        <div class="jbd-head">
          <span class="jbd-pic">${j.pic}</span>
          <p><small>your job</small><b>${job ? esc(job.a) : 'Which job will you get?'}</b></p>
          ${job ? `<span class="jbd-score">${n} / ${PARTS.length}</span>` : ''}
          <button type="button" class="jbd-go">🎲 ${job ? 'Another job' : 'Pick a job!'}</button>
        </div>
        <ol class="jbd-rows">${PARTS.map(p => `
          <li class="k-${p.k}${done[p.k] ? ' ok' : ''}" data-k="${p.k}">
            <span class="jbd-tag">${p.label}</span>
            <span class="jbd-start">${esc(p.start(j))}</span>
            <span class="jbd-opts">${opts(p).map(o => !job
              ? '<button type="button" class="empty" disabled></button>'
              : `<button type="button" data-v="${esc(o)}"${done[p.k] ? ' class="right" disabled' : ''}>${esc(o)}</button>`).join('')}</span>
          </li>`).join('')}
        </ol>
        ${job && n === PARTS.length ? `<div class="jbd-text"><p><b>📝 Your text</b> · copy it in your notebook!</p>
          <p class="jbd-para">${PARTS.map(p => sentence(job, p)).join(' ')}</p></div>` : ''}`;
    }

    box.addEventListener('click', e => {
      if (e.target.closest('.jbd-go')) return draw();
      const b = e.target.closest('.jbd-opts button');
      if (!b || b.disabled) return;
      const k = b.closest('li').dataset.k;
      if (b.dataset.v === right(job, k)) {
        done[k] = true;
        render();
      } else {
        b.classList.add('wrong');
        b.disabled = true;
      }
    });

    render();
  }

  /* ---------- 9.44: the Job Flag Game ---------- */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="gq-overlay jf-modal" id="jfModal" role="dialog" aria-modal="true" aria-labelledby="jfTitle" hidden>
      <div class="gq-box jf-box">
        <div class="gq-top">
          <span class="gq-title" id="jfTitle">🚩 The Job Flag Game</span>
          <span class="jf-score"><b class="a" id="jfA">0</b><i>–</i><b class="b" id="jfB">0</b></span>
          <button type="button" class="gq-close" id="jfClose" aria-label="Close">✕</button>
        </div>
        <div class="gq-area" id="jfArea"></div>
      </div>
    </div>`);
  const modal = $('jfModal');
  const area = $('jfArea');
  let players = 12, level = 1, score = { a: 0, b: 0 };
  let nextJob = bag(JOBS), nextPart = bag(PARTS), nextNum = null;
  let round = null;

  const paintScore = () => { $('jfA').textContent = score.a; $('jfB').textContent = score.b; };

  function setup() {
    area.innerHTML = `<div class="gq-card jf-setup">
      <p class="gq-instr">Two teams. Every player has a number: the two players with the same number try to take the flag!</p>
      <p class="jf-line"><span>Players in each team</span>
        <button type="button" class="gq-btn alt" data-pl="-1">−</button><b id="jfPl">${players}</b><button type="button" class="gq-btn alt" data-pl="1">+</button></p>
      <p class="jf-line"><span>Level</span>
        <button type="button" class="gq-btn${level === 1 ? '' : ' alt'}" data-lv="1">1 · the job</button>
        <button type="button" class="gq-btn${level === 2 ? '' : ' alt'}" data-lv="2">2 · the job + what to say</button></p>
      <div class="gq-row"><button type="button" class="gq-btn jf-start">🚩 Start!</button></div>
    </div>`;
  }

  function next() {
    round = { job: nextJob(), part: nextPart(), num: nextNum(), answer: false, point: false };
    show();
  }

  function show() {
    const { job, part, num } = round;
    area.innerHTML = `<div class="jf-round">
      <div class="jf-job"><span class="jf-pic">${job.pic}</span><b>${esc(job.a)}</b></div>
      ${level === 2 ? `<p class="jf-part k-${part.k}"><span>${part.label}</span>${esc(part.q)}</p>` : ''}
      <p class="jf-num"><small>number</small><b>${num}</b></p>
      <p class="jf-answer">${round.answer
        ? `💡 ${level === 2 ? esc(`${part.start(job).replace('…', '')} ${right(job, part.k)}.`)
          : PARTS.slice(1, 4).map(p => esc(`${p.start(job).replace('…', '')} ${right(job, p.k)}.`)).join(' ')}`
        : '<button type="button" class="jf-show">💡 Show an answer</button>'}</p>
      <div class="jf-pts">
        <button type="button" class="jf-pt a" data-t="a"${round.point ? ' disabled' : ''}>+1 Team A</button>
        <button type="button" class="jf-pt b" data-t="b"${round.point ? ' disabled' : ''}>+1 Team B</button>
      </div>
      <div class="gq-row">
        <button type="button" class="gq-btn alt jf-num-again">🔢 Another number</button>
        <button type="button" class="gq-btn jf-next">Next job ▶</button>
      </div>
      <p class="jf-foot">Level <button type="button" data-lv="1"${level === 1 ? ' class="on"' : ''}>1</button><button type="button" data-lv="2"${level === 2 ? ' class="on"' : ''}>2</button>
        · <button type="button" class="jf-reset">↺ new game</button></p>
    </div>`;
  }

  area.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.pl) {
      players = Math.min(30, Math.max(2, players + +t.dataset.pl));
      $('jfPl').textContent = players;
    } else if (t.dataset.lv) {
      level = +t.dataset.lv;
      round ? show() : setup();
    } else if (t.classList.contains('jf-start')) {
      nextNum = bag(Array.from({ length: players }, (_, i) => i + 1));
      next();
    } else if (t.classList.contains('jf-next')) next();
    else if (t.classList.contains('jf-num-again')) { round.num = nextNum(); show(); }
    else if (t.classList.contains('jf-show')) { round.answer = true; show(); }
    else if (t.dataset.t) {
      score[t.dataset.t]++;
      round.point = true;
      paintScore();
      show();
    } else if (t.classList.contains('jf-reset')) {
      score = { a: 0, b: 0 };
      round = null;
      paintScore();
      setup();
    }
  });

  function open() {
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    round ? show() : setup();
    $('jfClose').focus();
  }
  function close() {
    modal.hidden = true;
    document.documentElement.classList.remove('gq-open');
  }
  $('jfClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.querySelectorAll('.jf-open').forEach(b => b.addEventListener('click', open));

  // while the pop-up is open the arrow keys must not turn the book's pages
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);
})();
