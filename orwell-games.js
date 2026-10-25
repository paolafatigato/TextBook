// Orwell ([author-meet … n1984]): the games for one player, in a pop-up like the Romeo & Juliet games.
// A button with data-ow="life" opens that game, data-ow="" opens the menu with all the games.
// Before the detectives' game ([author-meet … author-clues]) no game may tell facts about Orwell's life:
// only "life" does, and it is not in the menu (its button is on [author-case:R], after the game).
// Also here: "Put in order" of the facts ([author-clues:R]) and the quiz "Which animal are you?" ([af-quiz:R]).

(() => {
  const DATA = {
    // [statement, true?] about Orwell's life
    life: [
      ['Orwell was born in India.', true], ['His real name was Eric Blair.', true], ['He studied at Oxford University.', false],
      ['He worked as a policeman in Burma.', true], ['He washed dishes in a hotel in Paris.', true], ['He was a soldier in the Second World War.', false],
      ['A sniper shot him in the throat in Spain.', true], ['He worked for the BBC radio.', true], ['All the publishers loved Animal Farm immediately.', false],
      ['He wrote 1984 on a Scottish island.', true], ['He had three daughters.', false], ['He died in 1950, when he was 46.', true],
      ['He took the name Orwell from an English river.', true], ['He hated tea.', false], ['He kept goats and hens.', true],
      ['He was very short.', false], ['He was married twice.', true], ['He lived in a big castle in London.', false],
    ],
    // [sentence with ___, right answer, other answers]: Animal Farm, 1984 and the class game, never Orwell's life
    grammar: [
      ['___ the animals like Mr. Jones?', 'Did', ['Were', 'Was']], ['___ Boxer a strong horse?', 'Was', ['Did', 'Were']],
      ['___ the pigs clever?', 'Were', ['Did', 'Was']], ['___ Snowball want to build a windmill?', 'Did', ['Was', 'Were']],
      ['Old Major ___ the animals about his dream.', 'told', ['telled', 'tells']], ['The animals ___ Mr. Jones off the farm.', 'drove', ['drived', 'were drive']],
      ['The pigs ___ into the farmhouse.', 'moved', ['moveed', 'were move']], ['Napoleon ___ nine puppies in secret.', 'raised', ['raise', 'was raise']],
      ['While the animals ___, the pigs changed the rules.', 'were sleeping', ['slept', 'was sleeping']],
      ['Squealer ___ the commandments when the animals found him.', 'was changing', ['changed', 'were changing']],
      ['Winston ___ in his diary when he heard a knock.', 'was writing', ['wrote', 'were writing']],
      ['Winston ___ a secret note from Julia.', 'got', ['getted', 'was get']],
      ['While we ___ at the clues, the author smiled.', 'were looking', ['looked', 'was looking']],
      ['Our team ___ the answer first!', 'found', ['finded', 'was find']],
    ],
    // Question builder: the words of a yes / no question in the past (neutral: no facts about the author)
    builder: [
      'Did you live in a big city ?', 'Were you a good student ?', 'Was your father a doctor ?', 'Did you have a dog ?',
      'Were you working in 1930 ?', 'Did your family have a lot of money ?', 'Was your wife a writer ?', 'Did you travel a lot ?',
      'Were you famous when you were young ?', 'Did you write your books by hand ?', 'Was your school near your house ?', 'Did you like your job ?',
    ],
    // Ask it right: [right question, wrong, wrong]
    askright: [
      ['Did you live in Italy?', 'Did you lived in Italy?', 'You did live in Italy?'], ['Were you born in Europe?', 'Did you born in Europe?', 'Was you born in Europe?'],
      ['Was your father rich?', 'Did your father rich?', 'Were your father rich?'], ['Did you have a dog?', 'Did you had a dog?', 'Had you a dog?'],
      ['Were you working in 1930?', 'Did you working in 1930?', 'Was you working in 1930?'], ['Did your parents like music?', 'Did your parents liked music?', 'Do your parents liked music?'],
      ['Were your books popular?', 'Was your books popular?', 'Did your books popular?'], ['Did you go to school in a big city?', 'Did you went to school in a big city?', 'Went you to school in a big city?'],
      ['Did you speak French?', 'Did you spoke French?', 'Spoke you French?'], ['Was it difficult?', 'Did it difficult?', 'Were it difficult?'],
      ['Were you happy at school?', 'Did you happy at school?', 'Was you happy at school?'], ['Did your wife work?', 'Did your wife worked?', 'Was your wife work?'],
    ],
    who: [
      { name: 'NAPOLEON', options: ['NAPOLEON', 'SNOWBALL', 'SQUEALER', 'OLD MAJOR'],
        clues: ['I am a big, fierce-looking pig.', 'I don\'t speak much, but I always get my way.', 'I take nine puppies and raise them in secret.', 'My dogs chase Snowball off the farm.', 'In the end I walk on two legs, like a man.'] },
      { name: 'SNOWBALL', options: ['SNOWBALL', 'NAPOLEON', 'SQUEALER', 'BOXER'],
        clues: ['I am a pig with lots of ideas.', 'I give great speeches.', 'I organize committees and teach the animals to read.', 'I want to build a windmill.', 'Nine dogs chase me away from the farm.'] },
      { name: 'SQUEALER', options: ['SQUEALER', 'NAPOLEON', 'BENJAMIN', 'MOSES'],
        clues: ['I am a small, fat pig.', 'I speak very well.', 'They say I can turn black into white.', 'I explain why the pigs need the milk and the apples.', 'One night they find me on a ladder near the commandments.'] },
      { name: 'BOXER', options: ['BOXER', 'CLOVER', 'BENJAMIN', 'MOLLIE'],
        clues: ['I am a huge, strong horse.', 'I am not very clever.', 'My answer to every problem is: "I will work harder!"', 'I also say: "Napoleon is always right."', 'When I am ill, the pigs sell me.'] },
      { name: 'OLD MAJOR', options: ['OLD MAJOR', 'NAPOLEON', 'SNOWBALL', 'MR JONES'],
        clues: ['I am an old, respected pig.', 'I have a strange dream.', 'I tell the animals that Man is their only enemy.', 'I teach them the song "Beasts of England".', 'I die a few nights after my speech.'] },
      { name: 'BENJAMIN', options: ['BENJAMIN', 'BOXER', 'CLOVER', 'MOSES'],
        clues: ['I am the oldest animal on the farm.', 'I can read as well as any pig.', 'I am cynical and I never laugh.', 'I say: "Donkeys live a long time."', 'I am Boxer\'s best friend.'] },
      { name: 'MOLLIE', options: ['MOLLIE', 'CLOVER', 'BOXER', 'MURIEL'],
        clues: ['I am a young and pretty white mare.', 'I love sugar.', 'I love the ribbons in my hair.', 'I don\'t like hard work.', 'I run away to work for another human.'] },
      { name: 'MOSES', options: ['MOSES', 'SQUEALER', 'BENJAMIN', 'OLD MAJOR'],
        clues: ['I am a bird.', 'I am Mr. Jones\'s pet.', 'I don\'t work at all.', 'I tell stories about a happy place in the sky.', 'I talk about Sugarcandy Mountain.'] },
      { name: 'MR JONES', options: ['MR JONES', 'MR PILKINGTON', 'MR FREDERICK', 'MR WHYMPER'],
        clues: ['I am a human.', 'I am the owner of Manor Farm.', 'I drink too much.', 'I forget to feed the animals.', 'The animals drive me off my farm.'] },
    ],
    memory: [
      ['Old Major', 'Marx & Lenin'], ['Napoleon', 'Stalin'], ['Snowball', 'Trotsky'], ['Mr. Jones', 'the Tsar'],
      ['Boxer', 'the workers'], ['the dogs', 'the secret police'], ['Squealer', 'propaganda'], ['Moses', 'the Church'],
    ],
    // [text, is it one of the original Seven Commandments?]
    laws: [
      ['Whatever goes upon two legs is an enemy.', true], ['Whatever goes upon four legs, or has wings, is a friend.', true],
      ['No animal shall wear clothes.', true], ['No animal shall sleep in a bed.', true], ['No animal shall drink alcohol.', true],
      ['No animal shall kill any other animal.', true], ['All animals are equal.', true],
      ['No animal shall use human tools.', false], ['No animal shall take orders from another animal.', false],
      ['No animal shall sleep in a bed with sheets.', false], ['No animal shall drink alcohol to excess.', false],
      ['No animal shall kill any other animal without cause.', false], ['All animals are equal, but some animals are more equal than others.', false],
      ['Four legs good, two legs better!', false], ['No animal shall eat apples.', false],
    ],
    // [normal English, Newspeak, other answers]
    newspeak: [
      ['bad', 'ungood', ['nogood', 'antigood']], ['very good', 'plusgood', ['moregood', 'supergood']],
      ['extremely good', 'doubleplusgood', ['plusplusgood', 'megagood']], ['very bad', 'plusungood', ['unplusgood', 'doublebad']],
      ['extremely bad', 'doubleplusungood', ['plusdoubleungood', 'ultrabad']], ['warm', 'uncold', ['notcold', 'plushot']],
      ['very cold', 'pluscold', ['coldplus', 'doublecold']], ['dark', 'unlight', ['nolight', 'antilight']],
      ['fast', 'speedful', ['speedy', 'plusfast']], ['quickly', 'speedwise', ['speedfully', 'quickful']],
    ],
    // [word, clue] for Word scramble and Hangman
    words: [
      ['REBELLION', 'The animals fight against Mr. Jones'], ['WINDMILL', 'Snowball\'s big project'], ['COMMANDMENT', 'A rule on the wall of the barn'],
      ['PROPAGANDA', 'Using words to control what people think'], ['COMRADE', 'What the animals call each other'], ['FARMHOUSE', 'The pigs move in here'],
      ['TELESCREEN', 'It watches you in 1984'], ['NEWSPEAK', 'The language of the Party'], ['DIARY', 'Winston writes in it in secret'],
      ['BARN', 'The animals meet here at night'], ['WINSTON', 'The hero of 1984'], ['MINISTRY', 'Winston works at the ___ of Truth'],
      ['NAPOLEON', 'The pig who becomes the leader'], ['SQUEALER', 'He can turn black into white'], ['PIGS', 'The cleverest animals on the farm'],
    ],
  };

  const INFO = {
    life: { icon: '⚡', name: 'How much do you remember?', text: 'Orwell\'s life: true or false? Answer before the time ends!' },
    builder: { icon: '🧩', name: 'Question builder', text: 'Put the words in order: a yes / no question in the past.' },
    askright: { icon: '🩺', name: 'Ask it right', text: 'Only one question is correct. Which one?' },
    grammar: { icon: '📝', name: 'Past challenge', text: 'Did, was, were and the past tenses.' },
    who: { icon: '🎯', name: 'Who am I?', text: 'Guess the Animal Farm character with as few clues as you can.' },
    memory: { icon: '🃏', name: 'Farm & history', text: 'Find each animal and who it is in history.' },
    laws: { icon: '📜', name: 'Real law or fake?', text: 'Is it one of the original Seven Commandments?' },
    newspeak: { icon: '🗣️', name: 'Newspeak', text: 'Translate into the language of 1984.' },
    scramble: { icon: '🔤', name: 'Word scramble', text: 'Put the letters in the right order.' },
    hangman: { icon: '🎡', name: 'Hangman', text: 'Find the word before you lose your hearts.' },
  };
  const ORDER = Object.keys(INFO).filter(id => id !== 'life'); // "life" tells the answers of the game: only from [author-case:R]

  const $ = id => document.getElementById(id);
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  document.body.insertAdjacentHTML('beforeend', `
    <div class="gq-overlay rj-modal ow-modal" id="owModal" role="dialog" aria-modal="true" aria-labelledby="owTitle" hidden>
      <div class="gq-box">
        <div class="gq-top">
          <button type="button" class="gq-back" id="owBack" hidden>← Menu</button>
          <span class="gq-title" id="owTitle"></span>
          <span class="gq-score" id="owScore"></span>
          <button type="button" class="gq-close" id="owClose" aria-label="Close">✕</button>
        </div>
        <div class="gq-area" id="owArea"></div>
      </div>
    </div>`);
  const modal = $('owModal');
  const area = $('owArea');
  const setScore = s => { $('owScore').textContent = s === null ? '' : `⭐ ${s}`; };

  // every timer of a game, so it can be stopped when the player leaves
  let timers = [];
  const later = (f, ms) => timers.push(setTimeout(f, ms));
  const every = (f, ms) => timers.push(setInterval(f, ms));
  const stop = () => { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; };

  function showMenu() {
    stop();
    $('owBack').hidden = true;
    $('owTitle').textContent = 'Games'; // no author name: the games open before the detectives' game too
    setScore(null);
    area.innerHTML = `<p class="gq-menu-intro">Play on your own: choose a game!</p><div class="gq-menu">${ORDER.map(id => `
      <button type="button" class="gq-game" data-play="${id}"><i>${INFO[id].icon}</i><span><b>${INFO[id].name}</b>${INFO[id].text}</span></button>`).join('')}</div>`;
  }

  function play(id) {
    stop();
    $('owBack').hidden = false;
    $('owTitle').textContent = `${INFO[id].icon} ${INFO[id].name}`;
    setScore(0);
    GAMES[id]();
    modal.querySelector('.gq-box').scrollTop = 0;
  }

  function open(id) {
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    id ? play(id) : showMenu();
    $('owClose').focus();
  }
  window.ORWELL_GAMES = { open };   // used by the Games list on the home page (home-puzzles.js)

  function close() {
    stop();
    modal.hidden = true;
    document.documentElement.classList.remove('gq-open');
  }

  function end(score, max, id, extra = '') {
    stop();
    const pct = max ? score / max : 1;
    const face = pct >= .9 ? '🏆' : pct >= .6 ? '🐷' : '💪';
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

  // two buttons against the clock: used by "True or false?" and "Real law or fake?"
  function quickFire(id, list, yes, no) {
    const qs = shuffle(list).slice(0, 10);
    let i = 0, score = 0;
    const next = () => {
      if (i === qs.length) return end(score, qs.length, id);
      const [text, truth] = qs[i];
      area.innerHTML = `<div class="gq-card">
        <div class="gq-count">${i + 1} / ${qs.length}</div>
        <div class="gq-timer"><i id="owBar"></i></div>
        <p class="gq-big rj-q">${esc(text)}</p>
        <div class="gq-choices"><button type="button" class="gq-choice rj-true" data-v="${yes}">✓ ${yes}</button><button type="button" class="gq-choice rj-false" data-v="${no}">✗ ${no}</button></div>
        <p class="gq-fb" id="owFb"></p></div>`;
      const buttons = [...area.querySelectorAll('.gq-choice')];
      let left = 100, done = false;
      const answer = b => {
        if (done) return;
        done = true;
        stop();
        if (judge(buttons, b, truth ? yes : no, $('owFb'), 'Right!', () => { i++; next(); })) setScore(++score);
      };
      buttons.forEach(b => b.addEventListener('click', () => answer(b)));
      every(() => { left -= 1.25; $('owBar').style.width = Math.max(0, left) + '%'; if (left <= 0) answer(null); }, 100); // 8 seconds
    };
    next();
  }

  // a sentence with a gap and three answers: used by "Past challenge" and "Newspeak"
  function gapGame(id, list, intro = '') {
    const qs = shuffle(list).slice(0, 10);
    let i = 0, score = 0;
    const next = () => {
      if (i === qs.length) return end(score, qs.length, id);
      const [text, right, others] = qs[i];
      area.innerHTML = `<div class="gq-card">
        <div class="gq-count">${i + 1} / ${qs.length}</div>
        ${intro}
        <div class="gq-gapline">${esc(text).replace('___', '<span class="gq-gap" id="owGap">?</span>')}</div>
        <div class="gq-choices">${shuffle([right, ...others]).map(o => `<button type="button" class="gq-choice" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
        <p class="gq-fb" id="owFb"></p></div>`;
      const buttons = [...area.querySelectorAll('.gq-choice')];
      buttons.forEach(b => b.addEventListener('click', () => {
        $('owGap').textContent = right;
        if (judge(buttons, b, right, $('owFb'), 'Right!', () => { i++; next(); })) setScore(++score);
      }));
    };
    next();
  }

  const GAMES = {
    life: () => quickFire('life', DATA.life, 'TRUE', 'FALSE'),
    laws: () => quickFire('laws', DATA.laws, 'REAL', 'FAKE'),
    grammar: () => gapGame('grammar', DATA.grammar),

    askright() {
      const qs = shuffle(DATA.askright).slice(0, 8);
      let i = 0, score = 0;
      const next = () => {
        if (i === qs.length) return end(score, qs.length, 'askright');
        const [right, ...wrong] = qs[i];
        area.innerHTML = `<div class="gq-card">
          <div class="gq-count">${i + 1} / ${qs.length}</div>
          <p class="gq-instr">The author answers only correct questions! Which one can you ask?</p>
          <div class="gq-choices">${shuffle([right, ...wrong]).map(o => `<button type="button" class="gq-choice" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
          <p class="gq-fb" id="owFb"></p></div>`;
        const buttons = [...area.querySelectorAll('.gq-choice')];
        buttons.forEach(b => b.addEventListener('click', () => {
          if (judge(buttons, b, right, $('owFb'), 'Right! Now ask it!', () => { i++; next(); })) setScore(++score);
        }));
      };
      next();
    },

    builder() {
      const qs = shuffle(DATA.builder).slice(0, 6);
      let i = 0, score = 0;
      const next = () => {
        if (i === qs.length) return end(score, qs.length, 'builder');
        const words = qs[i].split(' ');
        let tiles;
        do tiles = shuffle(words.map((w, n) => ({ w, n }))); while (tiles.every((t, n) => t.w === words[n]));
        let typed = [];
        area.innerHTML = `<div class="gq-card" style="text-align:center">
          <div class="gq-count">${i + 1} / ${qs.length}</div>
          <p class="gq-instr">Click the words in the right order.</p>
          <p class="gq-gapline" id="owLine">&nbsp;</p>
          <div class="gq-bank" id="owTiles">${tiles.map((t, n) => `<button type="button" class="gq-chip" data-n="${n}">${esc(t.w)}</button>`).join('')}</div>
          <div class="gq-row"><button type="button" class="gq-btn alt" id="owDel">⌫ Back</button><button type="button" class="gq-btn alt" id="owSkip">Skip</button></div>
          <p class="gq-fb" id="owFb"></p></div>`;
        const chips = [...area.querySelectorAll('#owTiles .gq-chip')];
        const paint = () => {
          $('owLine').textContent = typed.length ? typed.map(k => tiles[k].w).join(' ').replace(' ?', '?') : '\u00a0';
          chips.forEach((ch, n) => { ch.disabled = typed.includes(n); });
        };
        const finish = ok => {
          chips.forEach(ch => { ch.disabled = true; });
          $('owDel').disabled = $('owSkip').disabled = true;
          $('owFb').innerHTML = ok ? '<span class="ok">✓ Well done!</span>' : `<span class="no">The question is: ${esc(qs[i].replace(' ?', '?'))}</span>`;
          if (ok) setScore(++score);
          later(() => { i++; next(); }, ok ? 1100 : 2200);
        };
        chips.forEach((ch, n) => ch.addEventListener('click', () => {
          typed.push(n);
          paint();
          if (typed.length < words.length) return;
          if (typed.map(k => tiles[k].w).join(' ') === qs[i]) finish(true);
          else {
            $('owFb').innerHTML = '<span class="warn">Not quite… try again!</span>';
            later(() => { typed = []; paint(); $('owFb').textContent = ''; }, 800);
          }
        }));
        $('owDel').addEventListener('click', () => { typed.pop(); paint(); });
        $('owSkip').addEventListener('click', () => finish(false));
        paint();
      };
      next();
    },
    newspeak: () => gapGame('newspeak', DATA.newspeak.map(([en, ns, others]) => [`${en} = ___`, ns, others]),
      '<p class="gq-instr">un- = not · plus- = very · doubleplus- = extremely</p>'),

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
            <div class="gq-row"><button type="button" class="gq-btn alt" id="owMore"${shown === p.clues.length ? ' disabled' : ''}>🔍 Another clue</button></div>
            <div class="gq-choices">${options.map(o => `<button type="button" class="gq-choice" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
            <p class="gq-fb" id="owFb"></p></div>`;
          $('owMore').addEventListener('click', () => { shown++; render(); });
          const buttons = [...area.querySelectorAll('.gq-choice')];
          buttons.forEach(b => b.addEventListener('click', () => {
            $('owMore').disabled = true;
            if (judge(buttons, b, p.name, $('owFb'), `Yes! +${6 - shown}`, () => { i++; next(); })) { score += 6 - shown; setScore(score); }
          }));
        };
        render();
      };
      next();
    },

    memory() {
      const cards = shuffle(DATA.memory.flatMap(([a, b], k) => [{ k, t: a, who: true }, { k, t: b }]));
      let open = [], found = 0, moves = 0;
      area.innerHTML = `<div class="gq-card"><p class="gq-instr">Turn two cards: an <em>Animal Farm character</em> and <em>who it is in history</em>.</p>
        <div class="rj-mem">${cards.map((c, n) => `<button type="button" class="rj-card${c.who ? ' who' : ''}" data-n="${n}"><span>${esc(c.t)}</span></button>`).join('')}</div>
        <p class="gq-fb" id="owFb">Moves: 0</p></div>`;
      const btns = [...area.querySelectorAll('.rj-card')];
      btns.forEach(b => b.addEventListener('click', () => {
        if (open.length === 2 || b.classList.contains('up')) return;
        b.classList.add('up');
        open.push(b);
        if (open.length < 2) return;
        moves++;
        $('owFb').textContent = `Moves: ${moves}`;
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
          <div class="rj-slots" id="owSlots"></div>
          <div class="gq-bank" id="owTiles">${letters.map((l, n) => `<button type="button" class="gq-chip" data-n="${n}">${l}</button>`).join('')}</div>
          <div class="gq-row"><button type="button" class="gq-btn alt" id="owDel">⌫ Back</button><button type="button" class="gq-btn alt" id="owSkip">Skip</button></div>
          <p class="gq-fb" id="owFb"></p></div>`;
        const tiles = [...area.querySelectorAll('#owTiles .gq-chip')];
        const paint = () => {
          $('owSlots').innerHTML = [...word].map((_, n) => `<span>${typed[n] !== undefined ? letters[typed[n]] : ''}</span>`).join('');
          tiles.forEach((t, n) => { t.disabled = typed.includes(n); });
        };
        const finish = ok => {
          tiles.forEach(t => { t.disabled = true; });
          $('owDel').disabled = $('owSkip').disabled = true;
          $('owFb').innerHTML = ok ? '<span class="ok">✓ Well done!</span>' : `<span class="no">The word is: ${word}</span>`;
          if (ok) setScore(++score);
          later(() => { i++; next(); }, ok ? 1000 : 1800);
        };
        tiles.forEach((t, n) => t.addEventListener('click', () => {
          typed.push(n);
          paint();
          if (typed.length < word.length) return;
          if (typed.map(k => letters[k]).join('') === word) finish(true);
          else {
            $('owFb').innerHTML = '<span class="warn">Not quite… try again!</span>';
            later(() => { typed = []; paint(); $('owFb').textContent = ''; }, 700);
          }
        }));
        $('owDel').addEventListener('click', () => { typed.pop(); paint(); });
        $('owSkip').addEventListener('click', () => finish(false));
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
          <p class="rj-lives" id="owLives"></p>
          <div class="rj-slots" id="owSlots"></div>
          <div class="rj-keys">${[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l => `<button type="button" data-l="${l}">${l}</button>`).join('')}</div>
          <p class="gq-fb" id="owFb"></p></div>`;
        const keys = [...area.querySelectorAll('.rj-keys button')];
        const paint = () => {
          $('owSlots').innerHTML = [...word].map(l => `<span>${guessed.has(l) ? l : ''}</span>`).join('');
          $('owLives').textContent = '❤️'.repeat(lives) + '🤍'.repeat(6 - lives);
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
          $('owFb').innerHTML = won ? '<span class="ok">✓ You found it!</span>' : `<span class="no">💀 The word is: ${word}</span>`;
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
  $('owBack').addEventListener('click', showMenu);
  $('owClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.querySelectorAll('[data-ow]').forEach(b => b.addEventListener('click', () => open(b.dataset.ow)));

  // while the pop-up is open the arrow keys must not turn the book's pages
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);

  /* ---------- [author-clues:R]: our facts, then in order ---------- */
  // "Put in order" sorts the facts by the year written next to them; facts without a year go after,
  // empty lines go to the end. The values move from line to line, so they stay saved.
  document.querySelectorAll('.check[data-tl]').forEach(btn => btn.addEventListener('click', () => {
    const list = $(btn.dataset.tl);
    const rows = [...list.querySelectorAll('li')].map(li => [...li.querySelectorAll('input.fill')]);
    const year = v => { const m = v.match(/\d{3,4}/); return m ? +m[0] : Infinity; };
    const rank = ([y, f]) => (!f.trim() && !y.trim() ? 2 : 0) + (year(y) === Infinity ? 1 : 0);
    const values = rows.map(r => r.map(inp => inp.value))
      .sort((a, b) => rank(a) - rank(b) || year(a[0]) - year(b[0]));
    rows.forEach((r, i) => r.forEach((inp, k) => { inp.value = values[i][k]; saved[inp.id] = inp.value; }));
    persist();
    list.classList.remove('sorted');
    void list.offsetWidth; // restart the flash
    list.classList.add('sorted');
  }));

  /* ---------- [af-quiz:R]: Which animal are you? ---------- */
  // each question is an .opt (script.js saves the chosen sentence); the 1st answer is A, the 5th is E.
  // The letter chosen most often lights up its animal (a tie lights up all of them).
  const quiz = $('af99');
  if (quiz) {
    const questions = [...quiz.querySelectorAll('.opt')];
    const cards = [...document.querySelectorAll('#af99-res [data-l]')];
    const msg = $('af99-msg');
    const paint = () => {
      const count = { A: 0, B: 0, C: 0, D: 0, E: 0 };
      let answered = 0;
      questions.forEach(q => {
        const i = [...q.querySelectorAll('button')].findIndex(b => b.textContent === saved[q.id]);
        if (i >= 0) { count['ABCDE'[i]]++; answered++; }
      });
      const best = Math.max(...Object.values(count));
      const done = answered === questions.length;
      cards.forEach(c => c.classList.toggle('win', done && count[c.dataset.l] === best));
      msg.textContent = done
        ? 'Your animal is lit up! Do you agree? Compare with a partner.'
        : `Answer all the questions: your animal lights up here ↓ (${answered} / ${questions.length})`;
    };
    quiz.addEventListener('click', () => setTimeout(paint)); // after script.js has saved the answer
    $('clearBtn').addEventListener('click', () => setTimeout(paint));
    paint();
  }

  // the topic chips of [af-rules] can also be pressed with the keyboard
  document.querySelectorAll('.ow-topic').forEach(t => t.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t.click(); }
  }));
})();
