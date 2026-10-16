// Future (pp. 168-189): "highlight the future" on p. 185, Mabel's fortune teller dice on p. 176
// and the future games. The games open in a pop-up like the Jobs ones:
// a button with data-ft="which" opens that game, data-ft="" opens the menu with all the games.

(() => {
  const $ = id => document.getElementById(id);
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- p. 171: highlight the future ---------- */
  // The words are made clickable by script.js (.underlinable). Each future in the letter is a .fut
  // with a group number: a future is found when at least one of its words is highlighted.
  // .fut-any is neither right nor wrong (I'm sketching non-stop).
  document.querySelectorAll('[data-ulcheck]').forEach(btn => {
    const box = $(btn.dataset.ulcheck);
    const card = box.closest('.ft-letter');
    const score = $(box.id + '-score');
    const words = [...box.querySelectorAll('.w')];
    const groups = new Set([...box.querySelectorAll('.fut')].map(f => f.dataset.g));
    const unmark = () => { words.forEach(w => w.classList.remove('ok', 'no')); score.textContent = ''; };

    btn.addEventListener('click', () => {
      unmark();
      const found = new Set();
      let wrong = 0;
      words.filter(w => w.classList.contains('ul')).forEach(w => {
        const fut = w.closest('.fut');
        if (fut) { found.add(fut.dataset.g); w.classList.add('ok'); }
        else if (!w.closest('.fut-any')) { wrong++; w.classList.add('no'); }
      });
      score.textContent = `${found.size} / ${groups.size} futures found` + (wrong ? ` · ${wrong} wrong` : '') + (found.size === groups.size && !wrong ? ' 🎉' : '');
    });
    box.addEventListener('click', unmark);
    document.querySelector(`[data-ulshow="${box.id}"]`)?.addEventListener('click', () => card.classList.toggle('show'));
    $('clearBtn').addEventListener('click', () => setTimeout(() => { unmark(); card.classList.remove('show'); }));
  });

  /* ---------- p. 180: Mabel rolls the dice ---------- */
  // one list of six predictions for each question (data-cat on the dice button)
  const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const PREDICTIONS = [
    ['You\'ll live in a treehouse.', 'You\'ll live in a mansion.', 'You\'ll live in a boat near a tropical island.', 'You\'ll live in a flat in New York.', 'You\'ll live in a camper van on the beach.', 'You\'ll live on the moon.'],
    ['You\'ll have a yellow bicycle.', 'You\'ll have a submarine.', 'You\'ll drive a racing car.', 'You\'ll have a horse.', 'You\'ll have a space hopper.', 'You\'ll have a helicopter.'],
    ['You\'ll wear a top hat every day.', 'You\'ll only wear purple clothes.', 'You\'ll dress up like a pirate on Fridays.', 'You\'ll wear sunglasses all the time.', 'You\'ll only wear green clothes.', 'You\'ll dress up like an astronaut every day.'],
    ['You\'ll be a zoo keeper.', 'You\'ll be a dancer.', 'You\'ll be an astronaut.', 'You\'ll be a singer.', 'You\'ll be a firefighter.', 'You\'ll be a pirate.'],
    ['You\'ll live in Spain.', 'You\'ll live in Australia.', 'You\'ll live in Japan.', 'You\'ll live in France.', 'You\'ll live in Egypt.', 'You\'ll live in Peru.'],
    ['You\'ll become the world champion table tennis player.', 'You\'ll sing opera.', 'You\'ll look after your 12 cats.', 'You\'ll learn juggling.', 'You\'ll write comics.', 'You\'ll take photographs of animals.'],
    ['Your best friend will be your favourite singer.', 'Your best friend will be your favourite actor.', 'Your best friend will be a pirate.', 'Your best friend will be a spy.', 'Your best friend will be your favourite sports star.', 'Your best friend will be your favourite writer.'],
    ['You\'ll have pancakes for breakfast every day.', 'You\'ll have orange juice and an orange every day.', 'You\'ll have pineapple pizza for breakfast every day.', 'You\'ll have banana ice cream for breakfast every day.', 'You\'ll have a cheese sandwich with no bread but extra cheese!', 'You\'ll have 100 biscuits for breakfast every day.'],
    ['You\'ll get up at 4 a.m. every day.', 'You\'ll get up at 7:23 a.m. every day.', 'You\'ll get up at 11 a.m. every day.', 'You\'ll get up at midday every day.', 'You\'ll get up at 3 p.m. every day.', 'You\'ll get up at 6 a.m. on Saturday, and 11 a.m. every other day.'],
    ['You\'ll go to bed at 6 p.m. every day.', 'You\'ll go to bed at 8 p.m. every day.', 'You\'ll go to bed at 8:32 p.m. every day.', 'You\'ll go to bed at 11 p.m. every day.', 'You\'ll go to bed at 2 a.m. every day.', 'You\'ll go to bed at 3 a.m. every day.'],
    ['You\'ll have a dog named Bruno.', 'You\'ll have two cats called Bill and Bob.', 'You\'ll have a pet donkey called Billy.', 'You\'ll have 25 pet spiders.', 'You\'ll have a pet hamster called Bella.', 'You\'ll have 100 dogs and 100 cats!'],
  ];
  const dice = [...document.querySelectorAll('.ft-roll')].map(btn => {
    const out = $(btn.id + '-out');
    const question = btn.closest('li').querySelector('input');
    const answers = PREDICTIONS[Number(btn.dataset.cat)];
    const paint = () => {
      const n = Number(saved[btn.id]);
      out.innerHTML = n ? `<b>${FACES[n - 1]}</b>${esc(answers[n - 1])}` : '';
    };
    btn.addEventListener('click', () => {
      if (!question.value.trim()) {
        question.placeholder = 'Write your question first!';
        question.focus();
        return;
      }
      btn.classList.remove('rolling');
      void btn.offsetWidth; // restart the animation
      btn.classList.add('rolling');
      let spins = 0;
      const spin = setInterval(() => {
        out.innerHTML = `<b>${FACES[Math.floor(Math.random() * 6)]}</b>`;
        if (++spins < 8) return;
        clearInterval(spin);
        saved[btn.id] = String(1 + Math.floor(Math.random() * 6));
        persist();
        paint();
      }, 70);
    });
    paint();
    return paint;
  });
  $('clearBtn').addEventListener('click', () => setTimeout(() => dice.forEach(paint => paint())));

  /* ---------- the games ---------- */
  const DATA = {
    // which future? the first option is the right one
    which: [
      { s: 'Look at those black clouds! It ___ .', o: ['is going to rain', 'will rain', 'is raining'], why: 'Prediction based on evidence (the clouds) → be going to.' },
      { s: '“I\'m cold.” “Wait, I ___ the window.”', o: ['\'ll close', '\'m closing', '\'m going to close'], why: 'Spontaneous decision → will.' },
      { s: 'We ___ a party on Saturday at 8. Can you come?', o: ['are having', 'will have', 'have'], why: 'Fixed plan with a time and a date → present continuous.' },
      { s: 'In 2100 people ___ on the Moon.', o: ['will live', 'are living', 'are going to live'], why: 'Far future you can\'t do anything about → will.' },
      { s: 'I\'ve decided: I ___ more vegetables this year.', o: ['am going to eat', 'will eat', 'am eating'], why: 'Intention / resolution → be going to.' },
      { s: 'I ___ the dentist tomorrow at 4.', o: ['am seeing', 'will see', 'see'], why: 'Appointment → present continuous.' },
      { s: 'I promise I ___ late again!', o: ['won\'t be', 'am not being', 'am not'], why: 'Promise → will / won\'t.' },
      { s: 'I think Italy ___ the next World Cup.', o: ['will win', 'is winning', 'wins'], why: 'Prediction without evidence (I think…) → will.' },
      { s: 'Careful! You ___ that glass!', o: ['\'re going to drop', '\'re dropping', 'drop'], why: 'You can see it is about to happen → be going to.' },
      { s: 'My sister ___ married in June. Everything is organised!', o: ['is getting', 'will get', 'gets'], why: 'Programmed event (a wedding) → present continuous.' },
      { s: 'I hope you ___ better soon.', o: ['\'ll feel', '\'re feeling', 'feel'], why: 'Hope → will.' },
      { s: '“What ___ this weekend?” “Nothing special.”', o: ['are you doing', 'will you do', 'do you do'], why: 'Asking about arrangements → present continuous.' },
      { s: 'When I grow up, I ___ a vet.', o: ['\'m going to be', '\'m being', 'be'], why: 'Plan for the general future → be going to.' },
      { s: 'Stop it or I ___ the teacher!', o: ['\'ll call', '\'m calling', 'call'], why: 'Threat → will.' },
      { s: '___ you help me with my homework, please?', o: ['Will', 'Are', 'Do'], why: 'Request → will.' },
      { s: 'We ___ to Rome by train next Friday. The tickets are booked.', o: ['are going', 'will go', 'go'], why: 'Fixed plan + verb of movement → present continuous (not “going to go”).' },
      { s: '“Breakfast is ready!” “Oops! We don\'t have any bread. I ___ some.”', o: ['\'ll buy', '\'m buying', 'buy'], why: 'Decision taken now, while speaking → will.' },
      { s: 'Look! The school bus ___ ! Hurry up!', o: ['is going to leave', 'will leave', 'leaves'], why: 'You can see it is about to happen → be going to.' },
      { s: '“What\'s your plan for summer?” “We ___ some historical places.”', o: ['are going to see', 'will see', 'see'], why: 'A plan already decided → be going to.' },
      { s: 'Ted is an amazing player. I\'m sure he ___ a goal today.', o: ['will score', 'is scoring', 'scores'], why: 'Prediction with I\'m sure… → will.' },
      { s: '“Tea or coffee?” “I ___ some tea, please.”', o: ['\'ll have', '\'m having', 'have'], why: 'Decision taken now → will.' },
    ],
    // be going to: form (the first option is the right one)
    going: [
      { s: 'My friends ___ basketball after school.', o: ['are going to play', 'is going to play', 'are going to playing'], why: 'they → are going to + base verb.' },
      { s: 'I ___ my grandparents on Sunday.', o: ['\'m going to visit', '\'m going visit', 'going to visit'], why: 'Don\'t forget BE (am) and TO: I\'m going to visit.' },
      { s: '___ your sister going to come to the party?', o: ['Is', 'Are', 'Does'], why: 'Questions: Is + she + going to…?' },
      { s: 'We ___ TV tonight.', o: ['aren\'t going to watch', 'don\'t going to watch', 'not going to watch'], why: 'Negative: aren\'t going to + base verb.' },
      { s: 'Look at those clouds! It ___ .', o: ['\'s going to rain', 'are going to rain', 'going to rain'], why: 'it → is going to.' },
      { s: 'He ___ a doctor when he grows up.', o: ['is going to be', 'is going to is', 'are going to be'], why: 'going to + base verb: be.' },
      { s: '“Are you going to buy it?” “Yes, I ___ .”', o: ['am', 'do', 'going'], why: 'Short answer: Yes, I am.' },
      { s: '“Is Marco going to play?” “No, he ___ .”', o: ['isn\'t', 'doesn\'t', 'won\'t'], why: 'Short answer: No, he isn\'t.' },
      { s: 'What ___ you going to do this summer?', o: ['are', 'is', 'do'], why: 'What + are + you + going to…?' },
      { s: 'This year I ___ less sugar. It\'s my resolution!', o: ['\'m going to eat', '\'m going to eating', 'going to eat'], why: 'Resolution → be going to + base verb.' },
      { s: 'Careful! You ___ that vase!', o: ['\'re going to break', '\'re going break', 'are going to broke'], why: 'Prediction with evidence → are going to + base verb.' },
    ],
    // present continuous: form and spelling
    pc: [
      { s: 'We ___ Giulia at the station at 6.', o: ['are meeting', 'are meet', 'meeting'], why: 'are + verb-ing.' },
      { s: 'She ___ to Paris on Friday.', o: ['is flying', 'are flying', 'is fly'], why: 'she → is + flying.' },
      { s: 'I ___ to school tomorrow: it\'s a holiday!', o: ['\'m not going', 'don\'t going', 'not going'], why: 'Negative: am not + -ing.' },
      { s: '___ you doing anything on Saturday?', o: ['Are', 'Do', 'Is'], why: 'Questions: Are + you + -ing?' },
      { s: 'swim → ___', o: ['swimming', 'swiming', 'swimeing'], why: 'Short vowel + consonant: double it.' },
      { s: 'write → ___', o: ['writing', 'writeing', 'writting'], why: 'Final -e: drop it → writing.' },
      { s: 'lie → ___', o: ['lying', 'lieing', 'liing'], why: '-ie → -ying.' },
      { s: 'Shh! The baby ___ .', o: ['is sleeping', 'sleeps', 'will sleep'], why: 'Happening now → present continuous.' },
      { s: 'The dentist ___ me at 4.30 tomorrow.', o: ['is seeing', 'sees', 'is see'], why: 'Appointment → present continuous.' },
      { s: '“Are they coming?” “No, they ___ .”', o: ['aren\'t', 'don\'t', 'isn\'t'], why: 'Short answer: No, they aren\'t.' },
      { s: 'run → ___', o: ['running', 'runing', 'runeing'], why: 'Short vowel + consonant: double it.' },
    ],
    // p = prediction / hope, i = spontaneous idea, a = plan / arrangement
    sort: [
      ['I don\'t think I\'ll ever be famous.', 'p'], ['We\'ll help you!', 'i'], ['Are you going to the cinema tomorrow?', 'a'],
      ['I\'ll hold the door for you.', 'i'], ['I\'m sure you\'ll enjoy it.', 'p'], ['It won\'t take long to get there.', 'p'],
      ['I\'ll wash, you dry.', 'i'], ['You\'ll feel better soon!', 'p'], ['He\'s playing baseball tonight.', 'a'],
      ['I\'m seeing Jean on Sunday.', 'a'], ['What are you doing next week?', 'a'], ['I\'m going to study more.', 'a'],
      ['Oh no, the bus is late! I\'ll walk.', 'i'], ['I hope it\'ll be sunny on Saturday.', 'p'], ['We\'re flying to London on 3rd May.', 'a'],
      ['The phone is ringing. I\'ll get it!', 'i'], ['In 2040 cars will fly.', 'p'], ['I\'m going to learn the guitar this summer.', 'a'],
    ],
    // the right sentence first, then the wrong one
    fix: [
      ['I will help you with your bags.', 'I will helping you with your bags.', 'After will → the base verb (no -ing, no to).'],
      ['She is going to study tonight.', 'She going to study tonight.', 'Don\'t forget the verb to be: she IS going to.'],
      ['Will you come to my party?', 'You will come to my party?', 'Questions: Will + subject + verb.'],
      ['We aren\'t meeting them tomorrow.', 'We don\'t meeting them tomorrow.', 'Present continuous negative: aren\'t + -ing.'],
      ['It won\'t rain today.', 'It willn\'t rain today.', 'will not = won\'t.'],
      ['Are you going to play football?', 'Do you going to play football?', 'Questions with going to: Are + subject + going to.'],
      ['He will be twelve next month.', 'He will is twelve next month.', 'After will → the base verb: be.'],
      ['They are going to visit Paris.', 'They are going visit Paris.', 'Don\'t forget TO: going TO visit.'],
      ['I\'m seeing the doctor at 5.', 'I seeing the doctor at 5.', 'Present continuous: am / is / are + -ing.'],
      ['I think it will be fun.', 'I think it will to be fun.', 'No “to” after will.'],
      ['What are you doing tonight?', 'What you are doing tonight?', 'Question word order: What + are + you + -ing?'],
      ['My parents are flying to Spain on Monday.', 'My parents flying to Spain on Monday.', 'Present continuous needs am / is / are.'],
    ],
    // put the words in order; e is the full stop or the question mark
    order: [
      { t: ['I', 'will', 'call', 'you', 'later'], e: '.' },
      { t: ['She', 'is', 'going', 'to', 'study', 'medicine'], e: '.' },
      { t: ['We', 'are', 'meeting', 'Luca', 'at', 'six'], e: '.' },
      { t: ['Will', 'you', 'help', 'me'], e: '?' },
      { t: ['They', 'won\'t', 'come', 'to', 'the', 'party'], e: '.' },
      { t: ['Are', 'you', 'going', 'to', 'buy', 'a', 'new', 'phone'], e: '?' },
      { t: ['What', 'are', 'you', 'doing', 'on', 'Saturday'], e: '?' },
      { t: ['It', 'isn\'t', 'going', 'to', 'rain', 'today'], e: '.' },
      { t: ['I', 'think', 'robots', 'will', 'teach', 'in', 'schools'], e: '.' },
      { t: ['My', 'cousins', 'are', 'arriving', 'tomorrow', 'morning'], e: '.' },
    ],
    ball: ['Yes, you will!', 'No, you won\'t.', 'Maybe… if you work hard.', 'Yes, but it will be a surprise.', 'Not now, but one day you will.',
      'Ask again tomorrow!', 'Definitely!', 'I don\'t think so…', 'The stars say YES!', 'It\'s going to happen very soon!'],
  };
  const KINDS = { p: ['k-pred', '🔮 prediction / hope'], i: ['k-idea', '💡 spontaneous idea'], a: ['k-plan', '📅 plan / arrangement'] };

  const INFO = {
    going: { icon: '🎯', name: 'Be going to', text: 'am, is or are going to…? Choose the right form!' },
    pc: { icon: '📅', name: 'Present continuous', text: 'Form, spelling of -ing and arrangements.' },
    which: { icon: '🔮', name: 'Which future?', text: 'will, be going to or present continuous? Answer before the time ends!' },
    sort: { icon: '🗂️', name: 'Sort it!', text: 'Prediction, spontaneous idea or plan?' },
    fix: { icon: '🩺', name: 'Spot the mistake', text: 'Two sentences: which one is correct?' },
    order: { icon: '🧩', name: 'Word order', text: 'Put the words in order to make a sentence.' },
    ball: { icon: '🔮', name: 'Crystal ball', text: 'Ask a question with WILL… the crystal ball answers!' },
  };
  const ORDER = Object.keys(INFO);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="gq-overlay ft-modal" id="ftModal" role="dialog" aria-modal="true" aria-labelledby="ftTitle" hidden>
      <div class="gq-box">
        <div class="gq-top">
          <button type="button" class="gq-back" id="ftBack" hidden>← Menu</button>
          <span class="gq-title" id="ftTitle"></span>
          <span class="gq-score" id="ftScore"></span>
          <button type="button" class="gq-close" id="ftClose" aria-label="Close">✕</button>
        </div>
        <div class="gq-area" id="ftArea"></div>
      </div>
    </div>`);
  const modal = $('ftModal');
  const area = $('ftArea');
  const setScore = s => { $('ftScore').textContent = s === null ? '' : `⭐ ${s}`; };

  // every timer of a game, so it can be stopped when the player leaves
  let timers = [];
  const later = (f, ms) => timers.push(setTimeout(f, ms));
  const every = (f, ms) => timers.push(setInterval(f, ms));
  const stop = () => { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; };

  function showMenu() {
    stop();
    $('ftBack').hidden = true;
    $('ftTitle').textContent = '🔮 Future games';
    setScore(null);
    area.innerHTML = `<p class="gq-menu-intro">Play on your own: choose a game!</p><div class="gq-menu">${ORDER.map(id => `
      <button type="button" class="gq-game" data-play="${id}"><i>${INFO[id].icon}</i><span><b>${INFO[id].name}</b>${INFO[id].text}</span></button>`).join('')}</div>`;
  }

  function play(id) {
    stop();
    $('ftBack').hidden = false;
    $('ftTitle').textContent = `${INFO[id].icon} ${INFO[id].name}`;
    setScore(0);
    GAMES[id]();
    modal.querySelector('.gq-box').scrollTop = 0;
  }

  function open(id) {
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    id ? play(id) : showMenu();
    $('ftClose').focus();
  }

  function close() {
    stop();
    modal.hidden = true;
    document.documentElement.classList.remove('gq-open');
  }

  function end(score, max, id) {
    stop();
    const pct = max ? score / max : 1;
    const face = pct >= .9 ? '🏆' : pct >= .6 ? '🔮' : '💪';
    area.innerHTML = `<div class="gq-card" style="text-align:center">
      <div class="gq-big">${face}</div>
      <p class="gq-instr">You scored <span>${score} / ${max}</span></p>
      <div class="gq-row"><button type="button" class="gq-btn" data-play="${id}">↻ Play again</button><button type="button" class="gq-btn alt" data-menu>Other games</button></div>
    </div>`;
  }

  // shows right / wrong on the choice buttons and the explanation, then a Next button
  function judge(buttons, picked, right, why, then) {
    buttons.forEach(b => {
      b.disabled = true;
      if (b.dataset.v === right) b.classList.add('c-ok');
      else if (b === picked) b.classList.add('c-fail');
    });
    const ok = picked?.dataset.v === right;
    $('ftNote').innerHTML = `<div class="gq-note ${ok ? 'good' : 'bad'}"><b>${ok ? '✅ Right!' : picked ? '❌ Not quite.' : '⏰ Time\'s up!'}</b><span>${why}</span></div>
      <div class="gq-row"><button type="button" class="gq-btn" id="ftNext">Next →</button></div>`;
    $('ftNext').addEventListener('click', then);
    $('ftNext').focus();
    return ok;
  }

  const choiceButtons = (box, values, cls = () => '') => values.map(v => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gq-choice ' + cls(v);
    b.dataset.v = v;
    b.textContent = v;
    box.append(b);
    return b;
  });

  // a sentence with a gap and three options against the clock: used by which, going and pc
  function quiz(id) {
    const qs = shuffle(DATA[id]).slice(0, 10);
    let i = 0, score = 0;
    const next = () => {
      stop();
      if (i === qs.length) return end(score, qs.length, id);
      const q = qs[i];
      area.innerHTML = `<div class="gq-card">
        <div class="gq-count">${i + 1} / ${qs.length}</div>
        <div class="gq-timer"><i id="ftBar"></i></div>
        <div class="gq-sentence">${esc(q.s).replace('___', '<span class="gq-gap" id="ftGap">?</span>')}</div>
        <div class="gq-choices" id="ftChoices"></div><div id="ftNote"></div></div>`;
      const buttons = choiceButtons($('ftChoices'), shuffle(q.o));
      let left = 100, done = false;
      const answer = b => {
        if (done) return;
        done = true;
        stop();
        $('ftGap').textContent = q.o[0];
        if (judge(buttons, b, q.o[0], q.why, () => { i++; next(); })) setScore(++score);
      };
      buttons.forEach(b => b.addEventListener('click', () => answer(b)));
      every(() => { left -= 1; $('ftBar').style.width = Math.max(0, left) + '%'; if (left <= 0) answer(null); }, 120); // 12 seconds
    };
    next();
  }

  const GAMES = {
    which: () => quiz('which'),
    going: () => quiz('going'),
    pc: () => quiz('pc'),

    sort() {
      const qs = shuffle(DATA.sort).slice(0, 12);
      let i = 0, score = 0;
      const next = () => {
        if (i === qs.length) return end(score, qs.length, 'sort');
        const [sentence, kind] = qs[i];
        area.innerHTML = `<div class="gq-card">
          <p class="gq-instr">Is it a <span>prediction</span>, a <span>spontaneous idea</span> or a <span>plan</span>?</p>
          <div class="gq-count">${i + 1} / ${qs.length}</div>
          <div class="gq-sentence">${esc(sentence)}</div>
          <div class="gq-choices" id="ftChoices"></div><div id="ftNote"></div></div>`;
        const labels = Object.values(KINDS).map(k => k[1]);
        const buttons = choiceButtons($('ftChoices'), labels, v => Object.values(KINDS).find(k => k[1] === v)[0]);
        const why = { p: 'We imagine or hope what will happen → will.', i: 'We decide now, while we are speaking → will.', a: 'It is already decided or organised → be going to / present continuous.' }[kind];
        buttons.forEach(b => b.addEventListener('click', () => {
          if (judge(buttons, b, KINDS[kind][1], why, () => { i++; next(); })) setScore(++score);
        }));
      };
      next();
    },

    fix() {
      const qs = shuffle(DATA.fix).slice(0, 10);
      let i = 0, score = 0;
      const next = () => {
        if (i === qs.length) return end(score, qs.length, 'fix');
        const [right, wrong, why] = qs[i];
        area.innerHTML = `<div class="gq-card">
          <p class="gq-instr">Doctor Grammar is here: <span>which sentence is correct?</span></p>
          <div class="gq-count">${i + 1} / ${qs.length}</div>
          <div class="gq-choices" id="ftChoices" style="flex-direction:column;align-items:stretch"></div><div id="ftNote"></div></div>`;
        const buttons = choiceButtons($('ftChoices'), shuffle([right, wrong]));
        buttons.forEach(b => b.addEventListener('click', () => {
          if (judge(buttons, b, right, why, () => { i++; next(); })) setScore(++score);
        }));
      };
      next();
    },

    order() {
      const qs = shuffle(DATA.order).slice(0, 8);
      let i = 0, score = 0;
      const next = () => {
        if (i === qs.length) return end(score, qs.length, 'order');
        const q = qs[i];
        const target = q.t.join(' ');
        const items = shuffle(q.t.map((text, k) => ({ text, k })));
        let built = [], tried = false;
        area.innerHTML = `<div class="gq-card">
          <p class="gq-instr">Tap the words <span>in the right order</span>. Tap a word in the sentence to take it back.</p>
          <div class="gq-count">${i + 1} / ${qs.length}</div>
          <div class="gq-zone empty" id="ftZone"></div><div class="gq-tokbank" id="ftBank"></div><div id="ftNote"></div></div>`;
        const tok = (it, placed) => `<button type="button" class="gq-tok${placed ? ' placed' : ''}" data-k="${it.k}">${esc(it.text)}</button>`;
        const draw = () => {
          const used = new Set(built.map(b => b.k));
          $('ftZone').classList.toggle('empty', !built.length);
          $('ftZone').innerHTML = built.map(b => tok(b, true)).join('') + (built.length === q.t.length ? `<b>${q.e}</b>` : '');
          $('ftBank').innerHTML = items.filter(it => !used.has(it.k)).map(it => tok(it, false)).join('');
        };
        area.querySelector('.gq-card').addEventListener('click', e => {
          const b = e.target.closest('.gq-tok');
          if (!b || area.querySelector('.gq-note.good')) return;
          const k = +b.dataset.k;
          if (b.classList.contains('placed')) built = built.filter(x => x.k !== k);
          else built.push(items.find(it => it.k === k));
          $('ftNote').innerHTML = '';
          draw();
          if (built.length < q.t.length) return;
          // words that appear twice can swap places: compare the text
          const ok = built.map(b => b.text).join(' ') === target;
          if (ok) {
            if (!tried) setScore(++score);
            $('ftNote').innerHTML = `<div class="gq-note good"><b>✅ ${tried ? 'Now it\'s right!' : 'Perfect!'}</b><span>${esc(target + q.e)}</span></div>
              <div class="gq-row"><button type="button" class="gq-btn" id="ftNext">Next →</button></div>`;
            $('ftNext').addEventListener('click', () => { i++; next(); });
          } else {
            tried = true;
            $('ftNote').innerHTML = '<div class="gq-note bad"><b>❌ Not yet!</b><span>Tap the words in the sentence to move them back and try again (no point this time).</span></div>';
          }
        });
        draw();
      };
      next();
    },

    ball() {
      let asked = 0;
      setScore(null);
      area.innerHTML = `<div class="gq-card" style="text-align:center">
        <p class="gq-instr">Ask the crystal ball a <span>question with WILL</span>: <em>Will I…? Will my team…?</em></p>
        <div class="ft-ball" id="ftBall">?</div>
        <input type="text" class="gq-text" id="ftAsk" placeholder="Will I be famous one day?" autocomplete="off" spellcheck="false">
        <div class="gq-row"><button type="button" class="gq-btn" id="ftGo">🔮 Ask</button></div>
        <div class="gq-fb" id="ftFb"></div></div>`;
      const input = $('ftAsk');
      // a few common mistakes with will questions
      const problem = q => {
        if (!/^will\b/i.test(q)) return 'Start with WILL: “Will I…?”, “Will my friends…?”';
        if (!/\?$/.test(q)) return 'Don\'t forget the question mark ?';
        const w = q.replace(/\?$/, '').split(/\s+/);
        if (w.length < 3) return 'Your question is too short: Will + who + verb…';
        const after = /^(i|you|he|she|it|we|they)$/i.test(w[1]) ? w[2].toLowerCase() : '';
        if (after === 'to') return 'No TO after will: “Will I go?”, not “Will I to go?”';
        if (['am', 'is', 'are'].includes(after)) return 'After will use BE: “Will I be…?”';
        if (/ing$/.test(after) && !['sing', 'bring', 'ring', 'swing', 'sting'].includes(after)) return 'After will use the base verb: “Will I go?”, not “Will I going?”';
        return '';
      };
      const ask = () => {
        const q = input.value.trim();
        const p = problem(q);
        if (p) { $('ftFb').innerHTML = `<span class="no">${esc(p)}</span>`; return; }
        $('ftFb').innerHTML = '';
        const ball = $('ftBall');
        ball.textContent = '…';
        ball.classList.remove('shake');
        void ball.offsetWidth; // restart the animation
        ball.classList.add('shake');
        later(() => {
          ball.textContent = DATA.ball[Math.floor(Math.random() * DATA.ball.length)];
          setScore(++asked);
          $('ftFb').innerHTML = '<span class="ok">✓ Great question! Ask another one.</span>';
          input.select();
        }, 800);
      };
      $('ftGo').addEventListener('click', ask);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ask(); } });
      input.focus();
    },
  };

  area.addEventListener('click', e => {
    const b = e.target.closest('[data-play], [data-menu]');
    if (!b) return;
    if (b.dataset.menu !== undefined) showMenu();
    else play(b.dataset.play);
  });
  $('ftBack').addEventListener('click', showMenu);
  $('ftClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  // while the pop-up is open the arrow keys must not turn the book's pages
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);
  document.querySelectorAll('[data-ft]').forEach(b => b.addEventListener('click', () => open(b.dataset.ft)));
})();
