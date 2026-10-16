// Jobs & CVs (pp. 144-155): the word search on p. 145 and the jobs games.
// The games open in a pop-up that looks like the Romeo & Juliet ones:
// a button with data-jb="who" opens that game, data-jb="" opens the menu with all the games.

(() => {
  const $ = id => document.getElementById(id);
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- p. 145: word search ---------- */
  // Click the first letter of a word, then the last one (or drag from the first to the last).
  // Words can go across, down or backwards; each found word gets a coloured capsule.
  const COLOURS = ['#f9b11a', '#6cc4b8', '#eab3d4', '#ee3a37', '#7a6bb5'];
  const wordSearch = (() => {
    const box = $('jb93');
    if (!box) return null;
    const rows = box.dataset.rows.split(' ');
    const size = rows.length;
    const items = [...$('jb93-words').children];
    const score = $('jb93-score');
    const key = w => w.toUpperCase().replace(/[^A-Z]/g, '');

    // where each word is in the grid: [r1, c1, r2, c2]
    const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    const place = {};
    items.forEach(li => {
      const w = key(li.textContent);
      for (let r = 0; r < size && !place[w]; r++) for (let c = 0; c < size && !place[w]; c++) for (const [dr, dc] of DIRS) {
        const end = [r + dr * (w.length - 1), c + dc * (w.length - 1)];
        if (end.some(v => v < 0 || v >= size)) continue;
        if ([...w].every((ch, k) => rows[r + dr * k][c + dc * k] === ch)) { place[w] = [r, c, ...end]; break; }
      }
    });

    box.innerHTML = `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true"></svg>` +
      rows.map((row, r) => [...row].map((ch, c) => `<button type="button" data-r="${r}" data-c="${c}">${ch}</button>`).join('')).join('');
    const svg = box.querySelector('svg');
    const cells = [...box.querySelectorAll('button')];
    const cell = (r, c) => cells[r * size + c];

    let found = [];
    try { found = JSON.parse(saved.jb93 || '[]'); } catch { found = []; }
    let start = null;

    function paint() {
      svg.innerHTML = found.filter(w => place[w]).map(w => {
        const [r1, c1, r2, c2] = place[w];
        const colour = COLOURS[items.findIndex(li => key(li.textContent) === w) % COLOURS.length];
        return `<line x1="${c1 + .5}" y1="${r1 + .5}" x2="${c2 + .5}" y2="${r2 + .5}" stroke="${colour}"/>`;
      }).join('');
      items.forEach(li => li.classList.toggle('found', found.includes(key(li.textContent))));
      score.textContent = `${found.length} / ${items.length} found` + (found.length === items.length ? ' 🎉' : '');
      cells.forEach(b => b.classList.toggle('start', b === start));
    }

    function tryWord(a, b) {
      const [r1, c1, r2, c2] = [+a.dataset.r, +a.dataset.c, +b.dataset.r, +b.dataset.c];
      const w = Object.keys(place).find(k => {
        const p = place[k];
        return (p[0] === r1 && p[1] === c1 && p[2] === r2 && p[3] === c2) || (p[0] === r2 && p[1] === c2 && p[2] === r1 && p[3] === c1);
      });
      if (w && !found.includes(w)) {
        found.push(w);
        saved.jb93 = JSON.stringify(found);
        persist();
      } else if (!w) {
        [a, b].forEach(x => { x.classList.add('miss'); setTimeout(() => x.classList.remove('miss'), 450); });
      }
    }

    box.addEventListener('pointerdown', e => {
      const b = e.target.closest('button');
      if (!b) return;
      e.preventDefault();
      if (start && start !== b) { tryWord(start, b); start = null; }
      else start = start === b ? null : b;
      paint();
    });
    // dragging: let go on the last letter
    box.addEventListener('pointerup', e => {
      if (!start) return;
      const b = document.elementFromPoint(e.clientX, e.clientY)?.closest('#jb93 button');
      if (b && b !== start) { tryWord(start, b); start = null; paint(); }
    });

    paint();
    return { reset() { found = []; start = null; paint(); } };
  })();
  $('clearBtn').addEventListener('click', () => setTimeout(() => {
    if (wordSearch && !saved.jb93) wordSearch.reset();
  }));

  /* ---------- the games ---------- */
  const DATA = {
    // Jobs Guess who: the fewer clues, the more points
    who: [
      { name: 'DOCTOR', options: ['DOCTOR', 'NURSE', 'DENTIST', 'VET'],
        clues: ['I work in a hospital or in a clinic.', 'I often wear a white coat.', 'I listen to your heart.', 'I write prescriptions for medicine.', 'I help sick people get better.'] },
      { name: 'PILOT', options: ['PILOT', 'BUS DRIVER', 'TRAIN DRIVER', 'SOLDIER'],
        clues: ['I wear a uniform.', 'I travel a lot.', 'I work with a crew.', 'I sit in a cockpit.', 'I fly planes.'] },
      { name: 'CHEF', options: ['CHEF', 'SHOP ASSISTANT', 'BUILDER', 'GARDENER'],
        clues: ['I often work in the evening and at weekends.', 'I wear a white hat.', 'I use knives and pans.', 'I work in a restaurant kitchen.', 'I cook delicious food.'] },
      { name: 'TEACHER', options: ['TEACHER', 'CHILDMINDER', 'AUTHOR', 'SECRETARY'],
        clues: ['I work with young people.', 'I need a lot of patience.', 'I correct a lot of homework.', 'I use a board and books.', 'I work in a school.'] },
      { name: 'FIRE OFFICER', options: ['FIRE OFFICER', 'POLICE OFFICER', 'PARAMEDIC', 'SOLDIER'],
        clues: ['I wear a helmet.', 'I work in a team.', 'I must be brave and fit.', 'I drive a big red truck.', 'I put out fires.'] },
      { name: 'VET', options: ['VET', 'DOCTOR', 'DENTIST', 'LANDSCAPE GARDENER'],
        clues: ['I studied for many years at university.', 'I can work on a farm or in a zoo.', 'My patients can\'t talk.', 'I help sick cats and dogs.', 'I am an animal doctor.'] },
      { name: 'WEBSITE DEVELOPER', options: ['WEBSITE DEVELOPER', 'SECRETARY', 'AUTHOR', 'MANAGER'],
        clues: ['I can work from home.', 'I sit in front of a screen all day.', 'I write code.', 'I use HTML and JavaScript.', 'I build websites.'] },
      { name: 'CAR MECHANIC', options: ['CAR MECHANIC', 'BUILDER', 'WELDER', 'TAXI DRIVER'],
        clues: ['My hands are often dirty.', 'I use tools like spanners.', 'I work in a garage.', 'I know engines very well.', 'I repair cars.'] },
    ],
    // [job, category]
    categories: [
      ['doctor', 'HEALTH'], ['nurse', 'HEALTH'], ['dentist', 'HEALTH'], ['vet', 'HEALTH'],
      ['pilot', 'TRANSPORT'], ['bus driver', 'TRANSPORT'], ['taxi driver', 'TRANSPORT'], ['train driver', 'TRANSPORT'],
      ['police officer', 'SAFETY'], ['fire officer', 'SAFETY'], ['soldier', 'SAFETY'],
      ['musician', 'ARTS'], ['author', 'ARTS'], ['fashion designer', 'ARTS'],
      ['CEO', 'BUSINESS'], ['manager', 'BUSINESS'], ['secretary', 'BUSINESS'], ['office worker', 'BUSINESS'],
      ['builder', 'BUILDING & REPAIRS'], ['welder', 'BUILDING & REPAIRS'], ['car mechanic', 'BUILDING & REPAIRS'],
    ],
    groups: { HEALTH: '🏥', TRANSPORT: '🚌', SAFETY: '🚨', ARTS: '🎨', BUSINESS: '💼', 'BUILDING & REPAIRS': '🔧' },
    // [statement, true?]
    tf: [
      ['A dentist looks after your teeth.', true], ['A vet looks after sick people.', false], ['A childminder looks after children.', true],
      ['A pilot works in a hospital.', false], ['A chef cooks in a restaurant.', true], ['A CEO is the person in charge of a company.', true],
      ['A landscape gardener designs gardens and parks.', true], ['A welder repairs teeth.', false], ['A paramedic helps people in an emergency.', true],
      ['A secretary flies planes.', false], ['An author writes books.', true], ['A shop assistant works in a garage.', false],
      ['A builder builds houses.', true], ['A website developer builds websites.', true], ['A fire officer puts out fires.', true],
      ['A nurse drives a train.', false], ['A sports coach trains teams and athletes.', true], ['A fashion designer repairs cars.', false],
    ],
    memory: [
      ['doctor', 'treats sick people'], ['teacher', 'helps students learn'], ['chef', 'cooks food'], ['pilot', 'flies planes'],
      ['builder', 'builds houses'], ['vet', 'treats animals'], ['author', 'writes books'], ['gardener', 'looks after plants'],
    ],
    // [sentence with ___, right answer, other answers]
    grammar: [
      ['I would like ___ a vet.', 'to be', ['be', 'being']], ['She dreams of ___ a pilot.', 'becoming', ['become', 'to become']],
      ['They want ___ with animals.', 'to work', ['work', 'working']], ['My uncle is ___ engineer.', 'an', ['a', '—']],
      ['My mum is ___ nurse.', 'a', ['an', '—']], ['He is ___ university teacher.', 'a', ['an', '—']],
      ['___ would you like to be?', 'What', ['Who', 'Where']], ['What ___ your dad do?', 'does', ['do', 'is']],
      ['A fire officer ___ brave.', 'must be', ['must to be', 'musts be']], ['Last summer I ___ at a dog shelter.', 'volunteered', ['volunteer', 'will volunteer']],
      ['In 2025 I ___ a photography contest.', 'won', ['winned', 'win']], ['Last year I ___ part in a school project.', 'took', ['taked', 'take']],
      ['I am good ___ maths.', 'at', ['in', 'on']], ['I am interested ___ technology.', 'in', ['at', 'on']],
    ],
    // [word, clue] for Word scramble and Hangman
    words: [
      ['DOCTOR', 'Helps sick people get better'], ['TEACHER', 'Works in a school'], ['PILOT', 'Flies planes'], ['DENTIST', 'Looks after your teeth'],
      ['GARDENER', 'Looks after plants'], ['NURSE', 'Works with doctors in a hospital'], ['BUILDER', 'Builds houses'], ['MANAGER', 'Leads a team at work'],
      ['SECRETARY', 'Answers the phone and organises the office'], ['PARAMEDIC', 'Arrives with the ambulance'], ['WELDER', 'Joins pieces of metal'],
      ['CHEF', 'Cooks in a restaurant'], ['AUTHOR', 'Writes books'], ['MUSICIAN', 'Plays music'], ['CHILDMINDER', 'Looks after children'],
      ['SOLDIER', 'Is part of the army'], ['RESUME', 'The American word for CV'], ['SKILLS', 'What you are good at'],
    ],
    // "Who am I?" (p. 149): the yes/no questions and, for each secret job, the questions with
    // the answer "yes" (y) and "sometimes" (s); every other answer is "no"
    questions: {
      money: 'Do I make a lot of money?', university: 'Do I need to go to university?', famous: 'Am I famous?',
      outside: 'Do I work outside?', standing: 'Do I work standing up?', uniform: 'Do I wear a uniform?',
      children: 'Do I work with children?', sick: 'Do I help sick people?', animals: 'Do I work with animals?',
      computer: 'Do I use a computer?', drive: 'Do I drive?', hands: 'Do I use my hands a lot?',
      night: 'Do I work at night?', food: 'Do I work with food?',
    },
    secrets: [
      { job: 'DOCTOR', y: 'money sick computer university', s: 'standing children night uniform' },
      { job: 'NURSE', y: 'standing uniform sick hands university night', s: 'children computer' },
      { job: 'VET', y: 'standing animals hands university', s: 'money outside uniform computer night' },
      { job: 'TEACHER', y: 'children standing computer university', s: '' },
      { job: 'CHEF', y: 'standing uniform hands night food', s: 'money famous' },
      { job: 'PILOT', y: 'money uniform computer night', s: 'university drive' },
      { job: 'POLICE OFFICER', y: 'outside standing uniform drive night', s: 'children animals sick computer' },
      { job: 'FIRE OFFICER', y: 'outside standing uniform drive hands night', s: 'sick animals' },
      { job: 'FARMER', y: 'outside standing animals hands drive food', s: '' },
      { job: 'BUILDER', y: 'outside standing hands drive', s: 'uniform' },
      { job: 'HAIRDRESSER', y: 'standing hands', s: 'children uniform famous' },
      { job: 'WEBSITE DEVELOPER', y: 'computer', s: 'money university night' },
      { job: 'TAXI DRIVER', y: 'drive night', s: 'computer' },
      { job: 'FOOTBALLER', y: 'money outside standing uniform famous', s: 'children night' },
      { job: 'CEO', y: 'money computer', s: 'university famous drive' },
      { job: 'SHOP ASSISTANT', y: 'standing', s: 'uniform computer food children' },
    ],
  };

  const INFO = {
    twenty: { icon: '🤔', name: 'Who am I?', text: 'The computer has a secret job: ask yes/no questions, then guess!' },
    who: { icon: '🎯', name: 'Guess the job', text: 'Who am I? Guess the job with as few clues as you can.' },
    categories: { icon: '🗂️', name: 'Job categories', text: 'Health, transport, arts…? Put each job in its group.' },
    speed: { icon: '⚡', name: 'True or false?', text: 'Answer before the time ends!' },
    memory: { icon: '🃏', name: 'Memory pairs', text: 'Find each job and what they do.' },
    grammar: { icon: '📝', name: 'Grammar challenge', text: 'would like to, a / an, past simple…' },
    scramble: { icon: '🔤', name: 'Word scramble', text: 'Put the letters in the right order.' },
    hangman: { icon: '🎡', name: 'Hangman', text: 'Find the job before you lose your hearts.' },
  };
  const ORDER = Object.keys(INFO);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="gq-overlay rj-modal jb-modal" id="jbModal" role="dialog" aria-modal="true" aria-labelledby="jbTitle" hidden>
      <div class="gq-box">
        <div class="gq-top">
          <button type="button" class="gq-back" id="jbBack" hidden>← Menu</button>
          <span class="gq-title" id="jbTitle"></span>
          <span class="gq-score" id="jbScore"></span>
          <button type="button" class="gq-close" id="jbClose" aria-label="Close">✕</button>
        </div>
        <div class="gq-area" id="jbArea"></div>
      </div>
    </div>`);
  const modal = $('jbModal');
  const area = $('jbArea');
  const setScore = s => { $('jbScore').textContent = s === null ? '' : `⭐ ${s}`; };

  // every timer of a game, so it can be stopped when the player leaves
  let timers = [];
  const later = (f, ms) => timers.push(setTimeout(f, ms));
  const every = (f, ms) => timers.push(setInterval(f, ms));
  const stop = () => { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; };

  function showMenu() {
    stop();
    $('jbBack').hidden = true;
    $('jbTitle').textContent = '💼 Jobs games';
    setScore(null);
    area.innerHTML = `<p class="gq-menu-intro">Play on your own: choose a game!</p><div class="gq-menu">${ORDER.map(id => `
      <button type="button" class="gq-game" data-play="${id}"><i>${INFO[id].icon}</i><span><b>${INFO[id].name}</b>${INFO[id].text}</span></button>`).join('')}</div>`;
  }

  function play(id) {
    stop();
    $('jbBack').hidden = false;
    $('jbTitle').textContent = `${INFO[id].icon} ${INFO[id].name}`;
    setScore(0);
    GAMES[id]();
    modal.querySelector('.gq-box').scrollTop = 0;
  }

  function open(id) {
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    id ? play(id) : showMenu();
    $('jbClose').focus();
  }

  function close() {
    stop();
    modal.hidden = true;
    document.documentElement.classList.remove('gq-open');
  }

  function end(score, max, id, extra = '') {
    stop();
    const pct = max ? score / max : 1;
    const face = pct >= .9 ? '🏆' : pct >= .6 ? '💼' : '💪';
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
    // like the forehead game: fewer questions = more points, a wrong guess costs 3 points
    twenty() {
      const rounds = shuffle(DATA.secrets).slice(0, 3);
      const all = DATA.secrets.map(x => x.job).sort();
      let i = 0, score = 0;
      const next = () => {
        if (i === rounds.length) return end(score, rounds.length * 12, 'twenty');
        const secret = rounds[i];
        const answer = key => {
          const v = secret.y.split(' ').includes(key) ? 'y' : secret.s.split(' ').includes(key) ? 's' : 'n';
          const am = DATA.questions[key].startsWith('Am');
          return [v, { y: am ? 'Yes, you are.' : 'Yes, you do.', n: am ? 'No, you aren\'t.' : 'No, you don\'t.', s: 'Sometimes.' }[v]];
        };
        let asked = 0, points = 12;
        area.innerHTML = `<div class="gq-card">
          <div class="gq-count">${i + 1} / ${rounds.length} · this job is worth <b id="jbPts">12</b> points</div>
          <p class="gq-instr">I have a secret job on my forehead… <em>Ask me questions!</em></p>
          <div class="jb-qs">${Object.entries(DATA.questions).map(([k, q]) => `<button type="button" class="gq-chip" data-q="${k}">${esc(q)}</button>`).join('')}</div>
          <ul class="jb-log" id="jbLog"></ul>
          <p class="gq-instr">Do you know? <em>Am I a…?</em></p>
          <div class="jb-guess">${all.map(j => `<button type="button" class="gq-choice" data-v="${esc(j)}">${esc(j)}</button>`).join('')}</div>
          <p class="gq-fb" id="jbFb"></p></div>`;
        const pts = () => { $('jbPts').textContent = Math.max(1, points); };
        area.querySelectorAll('.jb-qs .gq-chip').forEach(b => b.addEventListener('click', () => {
          b.disabled = true;
          asked++;
          if (asked > 2) points--; // the first two questions are free
          const [v, text] = answer(b.dataset.q);
          $('jbLog').insertAdjacentHTML('afterbegin', `<li><span>${esc(DATA.questions[b.dataset.q])}</span><b class="${v}">${text}</b></li>`);
          pts();
        }));
        const guesses = [...area.querySelectorAll('.jb-guess .gq-choice')];
        guesses.forEach(b => b.addEventListener('click', () => {
          if (b.dataset.v !== secret.job) {
            b.disabled = true;
            b.classList.add('c-fail');
            points -= 3;
            pts();
            $('jbFb').innerHTML = `<span class="no">✗ No, you aren't! Ask more questions.</span>`;
            return;
          }
          area.querySelectorAll('button').forEach(x => { x.disabled = true; });
          b.classList.add('c-ok');
          score += Math.max(1, points);
          setScore(score);
          $('jbFb').innerHTML = `<span class="ok">✓ Yes, you are! +${Math.max(1, points)} (${asked} questions)</span>`;
          later(() => { i++; next(); }, 1800);
        }));
      };
      next();
    },

    who() {
      const jobs = shuffle(DATA.who).slice(0, 5);
      let i = 0, score = 0;
      const next = () => {
        if (i === jobs.length) return end(score, jobs.length * 5, 'who');
        const p = jobs[i];
        const options = shuffle(p.options);
        let shown = 1;
        const render = () => {
          area.innerHTML = `<div class="gq-card">
            <div class="gq-count">${i + 1} / ${jobs.length} · this one is worth <b>${6 - shown}</b> points</div>
            <p class="gq-instr">What's my job? <em>Fewer clues = more points!</em></p>
            <ol class="rj-clues">${p.clues.slice(0, shown).map(c => `<li>${esc(c)}</li>`).join('')}</ol>
            <div class="gq-row"><button type="button" class="gq-btn alt" id="jbMore"${shown === p.clues.length ? ' disabled' : ''}>🔍 Another clue</button></div>
            <div class="gq-choices">${options.map(o => `<button type="button" class="gq-choice" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
            <p class="gq-fb" id="jbFb"></p></div>`;
          $('jbMore').addEventListener('click', () => { shown++; render(); });
          const buttons = [...area.querySelectorAll('.gq-choice')];
          buttons.forEach(b => b.addEventListener('click', () => {
            $('jbMore').disabled = true;
            if (judge(buttons, b, p.name, $('jbFb'), `Yes! +${6 - shown}`, () => { i++; next(); })) { score += 6 - shown; setScore(score); }
          }));
        };
        render();
      };
      next();
    },

    categories() {
      const qs = shuffle(DATA.categories).slice(0, 12);
      const groups = Object.keys(DATA.groups);
      let i = 0, score = 0;
      const next = () => {
        if (i === qs.length) return end(score, qs.length, 'categories');
        const [job, group] = qs[i];
        area.innerHTML = `<div class="gq-card">
          <div class="gq-count">${i + 1} / ${qs.length}</div>
          <p class="gq-big rj-q">${esc(job)}</p>
          <p class="gq-instr">Which group?</p>
          <div class="gq-choices">${groups.map(g => `<button type="button" class="gq-choice" data-v="${esc(g)}">${DATA.groups[g]} ${esc(g)}</button>`).join('')}</div>
          <p class="gq-fb" id="jbFb"></p></div>`;
        const buttons = [...area.querySelectorAll('.gq-choice')];
        buttons.forEach(b => b.addEventListener('click', () => {
          if (judge(buttons, b, group, $('jbFb'), 'Right!', () => { i++; next(); })) setScore(++score);
        }));
      };
      next();
    },

    speed() {
      const qs = shuffle(DATA.tf).slice(0, 10);
      let i = 0, score = 0;
      const next = () => {
        if (i === qs.length) return end(score, qs.length, 'speed');
        const [text, truth] = qs[i];
        area.innerHTML = `<div class="gq-card">
          <div class="gq-count">${i + 1} / ${qs.length}</div>
          <div class="gq-timer"><i id="jbBar"></i></div>
          <p class="gq-big rj-q">${esc(text)}</p>
          <div class="gq-choices"><button type="button" class="gq-choice rj-true" data-v="TRUE">✓ TRUE</button><button type="button" class="gq-choice rj-false" data-v="FALSE">✗ FALSE</button></div>
          <p class="gq-fb" id="jbFb"></p></div>`;
        const buttons = [...area.querySelectorAll('.gq-choice')];
        let left = 100, done = false;
        const answer = b => {
          if (done) return;
          done = true;
          stop();
          if (judge(buttons, b, truth ? 'TRUE' : 'FALSE', $('jbFb'), 'Right!', () => { i++; next(); })) setScore(++score);
        };
        buttons.forEach(b => b.addEventListener('click', () => answer(b)));
        every(() => { left -= 1.25; $('jbBar').style.width = Math.max(0, left) + '%'; if (left <= 0) answer(null); }, 100); // 8 seconds
      };
      next();
    },

    memory() {
      const cards = shuffle(DATA.memory.flatMap(([a, b], k) => [{ k, t: a, who: true }, { k, t: b }]));
      let open = [], found = 0, moves = 0;
      area.innerHTML = `<div class="gq-card"><p class="gq-instr">Turn two cards: a <em>job</em> and <em>what they do</em>.</p>
        <div class="rj-mem">${cards.map((c, n) => `<button type="button" class="rj-card${c.who ? ' who' : ''}" data-n="${n}"><span>${esc(c.t)}</span></button>`).join('')}</div>
        <p class="gq-fb" id="jbFb">Moves: 0</p></div>`;
      const btns = [...area.querySelectorAll('.rj-card')];
      btns.forEach(b => b.addEventListener('click', () => {
        if (open.length === 2 || b.classList.contains('up')) return;
        b.classList.add('up');
        open.push(b);
        if (open.length < 2) return;
        moves++;
        $('jbFb').textContent = `Moves: ${moves}`;
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

    grammar() {
      const qs = shuffle(DATA.grammar).slice(0, 10);
      let i = 0, score = 0;
      const next = () => {
        if (i === qs.length) return end(score, qs.length, 'grammar');
        const [text, right, others] = qs[i];
        area.innerHTML = `<div class="gq-card">
          <div class="gq-count">${i + 1} / ${qs.length}</div>
          <div class="gq-gapline">${esc(text).replace('___', '<span class="gq-gap" id="jbGap">?</span>')}</div>
          <div class="gq-choices">${shuffle([right, ...others]).map(o => `<button type="button" class="gq-choice" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
          <p class="gq-fb" id="jbFb"></p></div>`;
        const buttons = [...area.querySelectorAll('.gq-choice')];
        buttons.forEach(b => b.addEventListener('click', () => {
          $('jbGap').textContent = right;
          if (judge(buttons, b, right, $('jbFb'), 'Right!', () => { i++; next(); })) setScore(++score);
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
          <div class="rj-slots" id="jbSlots"></div>
          <div class="gq-bank" id="jbTiles">${letters.map((l, n) => `<button type="button" class="gq-chip" data-n="${n}">${l}</button>`).join('')}</div>
          <div class="gq-row"><button type="button" class="gq-btn alt" id="jbDel">⌫ Back</button><button type="button" class="gq-btn alt" id="jbSkip">Skip</button></div>
          <p class="gq-fb" id="jbFb"></p></div>`;
        const tiles = [...area.querySelectorAll('#jbTiles .gq-chip')];
        const paint = () => {
          $('jbSlots').innerHTML = [...word].map((_, n) => `<span>${typed[n] !== undefined ? letters[typed[n]] : ''}</span>`).join('');
          tiles.forEach((t, n) => { t.disabled = typed.includes(n); });
        };
        const finish = ok => {
          tiles.forEach(t => { t.disabled = true; });
          $('jbDel').disabled = $('jbSkip').disabled = true;
          $('jbFb').innerHTML = ok ? '<span class="ok">✓ Well done!</span>' : `<span class="no">The word is: ${word}</span>`;
          if (ok) setScore(++score);
          later(() => { i++; next(); }, ok ? 1000 : 1800);
        };
        tiles.forEach((t, n) => t.addEventListener('click', () => {
          typed.push(n);
          paint();
          if (typed.length < word.length) return;
          if (typed.map(k => letters[k]).join('') === word) finish(true);
          else {
            $('jbFb').innerHTML = '<span class="warn">Not quite… try again!</span>';
            later(() => { typed = []; paint(); $('jbFb').textContent = ''; }, 700);
          }
        }));
        $('jbDel').addEventListener('click', () => { typed.pop(); paint(); });
        $('jbSkip').addEventListener('click', () => finish(false));
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
          <p class="rj-lives" id="jbLives"></p>
          <div class="rj-slots" id="jbSlots"></div>
          <div class="rj-keys">${[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l => `<button type="button" data-l="${l}">${l}</button>`).join('')}</div>
          <p class="gq-fb" id="jbFb"></p></div>`;
        const keys = [...area.querySelectorAll('.rj-keys button')];
        const paint = () => {
          $('jbSlots').innerHTML = [...word].map(l => `<span>${guessed.has(l) ? l : ''}</span>`).join('');
          $('jbLives').textContent = '❤️'.repeat(lives) + '🤍'.repeat(6 - lives);
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
          $('jbFb').innerHTML = won ? '<span class="ok">✓ You found it!</span>' : `<span class="no">💀 The word is: ${word}</span>`;
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
  $('jbBack').addEventListener('click', showMenu);
  $('jbClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.querySelectorAll('[data-jb]').forEach(b => b.addEventListener('click', () => open(b.dataset.jb)));

  // while the pop-up is open the arrow keys must not turn the book's pages
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);
})();
