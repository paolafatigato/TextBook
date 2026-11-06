// Games for the teacher (home page, only when the teacher is signed in).
// Played from the whiteboard (LIM) or from the teacher's phone: nothing for the pupils to open, no login, works offline.
// The teacher is the "game master": she clicks, the class plays out loud, on the floor, at the board.
//   🚩 Flag game (bandierina) · 🅰️ Four corners · 👋 Slap the word · ⏱ Beat the clock · 🧰 Class tools
// plus the two games that already exist (Job Flag Game, Grammar Race).
// To add cards: add a pair ['question', 'answer'] to a deck below. To add a deck: add an object to DECKS.
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  // a bag: every card comes once before any comes again
  const bag = list => { let q = []; return () => { if (!q.length) q = shuffle(list); return q.pop(); }; };

  /* ---------- the decks: [what the board shows, the answer] ---------- */
  const DECKS = [
    { id: 'subj', icon: '🙋', color: '#f05f4b', title: 'Subject pronouns', hint: 'Say the pronoun that replaces the words.', items: [
      ['Mary', 'she'], ['Tom and I', 'we'], ['the cat', 'it'], ['my brother', 'he'], ['you and Anna', 'you'], ['the teachers', 'they'],
      ['Ms. Fatigato', 'she'], ['the boys', 'they'], ['my sister and I', 'we'], ['the table', 'it'], ['Marco and Luca', 'they'], ['your dad', 'he'],
      ['the dogs', 'they'], ['Sara and you', 'you'], ['the window', 'it'], ['Giulia and I', 'we'] ] },
    { id: 'obj', icon: '🎯', color: '#e0902c', title: 'Object pronouns', hint: 'Say the pronoun for the underlined idea: I love ___.', items: [
      ['I like Tom → I like …', 'him'], ['She calls Anna → She calls …', 'her'], ['We see the dogs → We see …', 'them'], ['He helps my sister and me → He helps …', 'us'],
      ['They invite you → They invite …', 'you'], ['Look at the cat! → Look at …!', 'it'], ['Anna loves Marco and Luca → Anna loves …', 'them'], ['Listen to me! (Listen to I)', 'me'],
      ['Give the book to Tom → Give … the book', 'him'], ['Ask the teacher → Ask …', 'her'], ['Wait for Sara and me → Wait for …', 'us'], ['I miss my friends → I miss …', 'them'] ] },
    { id: 'poss', icon: '🎒', color: '#8fb82e', title: 'Possessive adjectives', hint: 'my · your · his · her · its · our · their', items: [
      ['(I) … book', 'my'], ['(you) … pen', 'your'], ['(he) … bike', 'his'], ['(she) … bag', 'her'], ['(we) … teacher', 'our'], ['(they) … house', 'their'],
      ['(the dog) … ball', 'its'], ['(Tom and Anna) … cat', 'their'], ['(my sister) … room', 'her'], ['(my brother and I) … dog', 'our'], ['(Marco) … phone', 'his'], ['(you and Luca) … homework', 'your'] ] },
    { id: 'be', icon: '🅱️', color: '#4aa8ec', title: 'To be', hint: 'am · is · are (and the short forms)', items: [
      ['I … Italian.', 'am'], ['She … my friend.', 'is'], ['They … at school.', 'are'], ['We … tired.', 'are'], ['He … a doctor.', 'is'], ['You … late!', 'are'],
      ['The cat … on the sofa.', 'is'], ['My parents … at work.', 'are'], ['It … a big dog.', 'is'], ['Tom and I … in class 2B.', 'are'],
      ['negative: I … hungry. (not)', "am not / I'm not"], ['negative: She … tall. (not)', "isn't / is not"], ['negative: They … ready. (not)', "aren't / are not"] ] },
    { id: 'ps3', icon: '🏃', color: '#3aa04a', title: 'Present simple: he / she / it', hint: 'Say the verb with the right ending.', items: [
      ['he (play)', 'plays'], ['she (watch)', 'watches'], ['it (go)', 'goes'], ['Tom (study)', 'studies'], ['my mom (have)', 'has'], ['the dog (eat)', 'eats'],
      ['she (do)', 'does'], ['he (wash)', 'washes'], ['Anna (fly)', 'flies'], ['it (need)', 'needs'], ['he (teach)', 'teaches'], ['my dad (cook)', 'cooks'],
      ['she (try)', 'tries'], ['the baby (cry)', 'cries'], ['he (fix)', 'fixes'] ] },
    { id: 'plur', icon: '👶', color: '#c35fb4', title: 'Plurals', hint: 'Say the plural.', items: [
      ['child', 'children'], ['man', 'men'], ['woman', 'women'], ['foot', 'feet'], ['tooth', 'teeth'], ['mouse', 'mice'], ['sheep', 'sheep'], ['box', 'boxes'],
      ['baby', 'babies'], ['knife', 'knives'], ['bus', 'buses'], ['city', 'cities'], ['person', 'people'], ['potato', 'potatoes'], ['fish', 'fish'], ['watch', 'watches'] ] },
    { id: 'past', icon: '⏪', color: '#1f2a6b', title: 'Irregular past', hint: 'Say the past simple.', items: [
      ['go', 'went'], ['see', 'saw'], ['eat', 'ate'], ['buy', 'bought'], ['have', 'had'], ['make', 'made'], ['take', 'took'], ['write', 'wrote'], ['come', 'came'],
      ['drink', 'drank'], ['think', 'thought'], ['know', 'knew'], ['give', 'gave'], ['sit', 'sat'], ['swim', 'swam'], ['bring', 'brought'], ['speak', 'spoke'], ['run', 'ran'] ] },
    { id: 'opp', icon: '↔️', color: '#f9b11a', title: 'Opposites', hint: 'Say the opposite.', items: [
      ['big', 'small'], ['hot', 'cold'], ['fast', 'slow'], ['early', 'late'], ['happy', 'sad'], ['old', 'young / new'], ['open', 'closed'], ['easy', 'difficult'],
      ['full', 'empty'], ['clean', 'dirty'], ['cheap', 'expensive'], ['strong', 'weak'], ['tall', 'short'], ['dark', 'light'], ['right', 'wrong'], ['noisy', 'quiet'] ] },
    { id: 'jobs', icon: '👩‍🔧', color: '#d6334f', title: 'Jobs', hint: 'Say the job.', items: [
      ['treats sick animals', 'a vet'], ['repairs cars', 'a mechanic'], ['teaches children', 'a teacher'], ['cooks in a restaurant', 'a chef'], ['flies a plane', 'a pilot'],
      ['puts out fires', 'a firefighter'], ['cuts your hair', 'a hairdresser'], ['takes care of sick people', 'a nurse'], ['builds houses', 'a builder'], ['catches thieves', 'a police officer'],
      ['grows food on a farm', 'a farmer'], ['writes articles for a newspaper', 'a journalist'], ['makes bread', 'a baker'], ['paints pictures', 'an artist'] ] },
    { id: 'prep', icon: '📍', color: '#12a4a4', title: 'Prepositions of place', hint: 'in · on · under · next to · behind · between…', items: [
      ['The cat is … the box. (inside)', 'in'], ['The book is … the table. (on top)', 'on'], ['The ball is … the chair. (below)', 'under'], ['The school is … the bank and the shop.', 'between'],
      ['I sit … my best friend. (at the side)', 'next to'], ['The garden is … the house. (at the back)', 'behind'], ['The picture is … the sofa. (up high)', 'above'], ['The teacher is … the class. (face to face)', 'in front of'],
      ['The bus stop is … the school. (opposite)', 'opposite'], ['Italy is … France and Slovenia.', 'between'] ] },
    { id: 'comp', icon: '⚖️', color: '#e0584a', title: 'Comparatives', hint: 'Say the comparative.', items: [
      ['tall', 'taller'], ['big', 'bigger'], ['good', 'better'], ['bad', 'worse'], ['happy', 'happier'], ['interesting', 'more interesting'], ['far', 'farther'],
      ['easy', 'easier'], ['expensive', 'more expensive'], ['hot', 'hotter'], ['funny', 'funnier'], ['beautiful', 'more beautiful'], ['small', 'smaller'], ['difficult', 'more difficult'] ] },
  ];
  const TOPICS = [
    ['🍕', 'Food and drinks'], ['🐾', 'Animals'], ['👕', 'Clothes'], ['🎒', 'Things in your school bag'], ['⚽', 'Sports and hobbies'], ['👨‍👩‍👧', 'Family members'],
    ['🌍', 'Countries and nationalities'], ['🏠', 'Rooms and furniture'], ['🕐', 'Things you do every day (verbs)'], ['💼', 'Jobs'], ['🎨', 'Colors and adjectives'],
    ['🏙️', 'Places in town'], ['🌦️', 'Weather and seasons'], ['😀', 'Feelings and emotions'], ['📅', 'Months, days, numbers'], ['🧍', 'Parts of the body'],
  ];

  /* ---------- the overlay (one for all the games) ---------- */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="tg-overlay" id="tgOverlay" role="dialog" aria-modal="true" aria-labelledby="tgTitle" hidden>
      <div class="tg-box">
        <header class="tg-top">
          <button type="button" class="tg-back" id="tgBack" hidden>‹ Back</button>
          <span class="tg-title" id="tgTitle"></span>
          <span class="tg-score" id="tgScore" hidden><b class="a" id="tgA">0</b><i>–</i><b class="b" id="tgB">0</b></span>
          <button type="button" class="tg-full" id="tgFull" title="Full screen" aria-label="Full screen">⛶</button>
          <button type="button" class="tg-close" id="tgClose" aria-label="Close">✕</button>
        </header>
        <div class="tg-area" id="tgArea"></div>
      </div>
    </div>`);
  const overlay = $('tgOverlay'), area = $('tgArea');
  let cleanup = null, back = null;
  const score = { a: 0, b: 0 };
  const paintScore = () => { $('tgA').textContent = score.a; $('tgB').textContent = score.b; };

  function openGame(title, { scored = false, onBack = null } = {}) {
    stop();
    overlay.hidden = false;
    document.documentElement.classList.add('gq-open');
    $('tgTitle').innerHTML = title;
    $('tgScore').hidden = !scored;
    back = onBack;
    $('tgBack').hidden = !onBack;
    paintScore();
  }
  function stop() { if (cleanup) { cleanup(); cleanup = null; } }
  function close() {
    stop();
    overlay.hidden = true;
    document.documentElement.classList.remove('gq-open');
    if (document.fullscreenElement) document.exitFullscreen?.();
  }
  $('tgClose').addEventListener('click', close);
  $('tgBack').addEventListener('click', () => back?.());
  $('tgFull').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen?.(); else overlay.requestFullscreen?.().catch(() => {});
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  // while a game is open the arrow keys must not turn the book's pages
  document.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    if (e.key === 'Escape' && !document.fullscreenElement) close();
    e.stopPropagation();
  }, true);

  // a short beep (a timer ends): the browser may refuse before the first click, then it stays silent
  let ac = null;
  function beep(times = 3) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      for (let i = 0; i < times; i++) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ac.destination);
        const t = ac.currentTime + i * 0.28;
        g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.001, t + .22);
        o.start(t); o.stop(t + .24);
      }
    } catch { /* silent */ }
  }

  // two-team score buttons (the same in the games that have teams)
  const pointButtons = (disabled) => `<div class="tg-pts">
    <button type="button" class="tg-pt a" data-t="a"${disabled ? ' disabled' : ''}>+1 Team A</button>
    <button type="button" class="tg-pt b" data-t="b"${disabled ? ' disabled' : ''}>+1 Team B</button></div>`;
  function givePoint(t, round) { score[t]++; round.point = true; paintScore(); }

  /* ---------- choose the deck (flag game, four corners, slap the word) ---------- */
  function deckPicker(name, intro, then, backTo) {
    openGame(name, { onBack: backTo });
    const chosen = new Set();
    area.innerHTML = `<div class="tg-card">
      <p class="tg-intro">${intro}</p>
      <p class="tg-label">Choose a topic <small>(or more than one: they get mixed)</small></p>
      <div class="tg-decks">${DECKS.map(d => `<button type="button" class="tg-deck" data-d="${d.id}" style="--c:${d.color}"><span>${d.icon}</span>${esc(d.title)}<small>${d.items.length} cards</small></button>`).join('')}</div>
      <div class="tg-row"><button type="button" class="tg-btn" id="tgDeckGo" disabled>Choose a topic first</button></div></div>`;
    const go = $('tgDeckGo');
    area.onclick = e => {
      const b = e.target.closest('.tg-deck');
      if (b) {
        const id = b.dataset.d;
        chosen.has(id) ? chosen.delete(id) : chosen.add(id);
        b.classList.toggle('on', chosen.has(id));
        go.disabled = !chosen.size;
        go.textContent = chosen.size ? `▶ Play (${chosen.size} topic${chosen.size > 1 ? 's' : ''})` : 'Choose a topic first';
      } else if (e.target === go && chosen.size) then(DECKS.filter(d => chosen.has(d.id)));
    };
  }

  /* ---------- 🚩 the flag game (bandierina) ---------- */
  function flagGame() {
    score.a = score.b = 0;
    const start = () => deckPicker('🚩 Flag game', 'Two teams. Every player has a <b>number</b>. The board shows a card, the teacher calls a number, and the two players with that number <b>run</b> to take the flag and give the answer!', decks => setup(decks), menu);
    const setup = decks => {
      let players = 12;
      openGame('🚩 Flag game', { onBack: start });
      area.innerHTML = `<div class="tg-card"><p class="tg-intro">${decks.map(d => d.icon + ' ' + esc(d.title)).join(' · ')}</p>
        <p class="tg-line"><span>Players in each team</span><button type="button" class="tg-btn alt" data-pl="-1">−</button><b class="tg-big" id="tgPl">${players}</b><button type="button" class="tg-btn alt" data-pl="1">+</button></p>
        <div class="tg-row"><button type="button" class="tg-btn go" id="tgStart">🚩 Start!</button></div></div>`;
      area.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.pl) { players = Math.min(30, Math.max(2, players + +b.dataset.pl)); $('tgPl').textContent = players; }
        else if (b.id === 'tgStart') play(decks, players);
      };
    };
    const play = (decks, players) => {
      openGame('🚩 Flag game', { scored: true, onBack: () => setup(decks) });
      const cards = decks.flatMap(d => d.items.map(([q, a]) => ({ q, a, d })));
      const nextCard = bag(cards), nextNum = bag(Array.from({ length: players }, (_, i) => i + 1));
      let r;
      const next = () => { r = { c: nextCard(), n: nextNum(), show: false, point: false }; paint(); };
      const paint = () => {
        area.innerHTML = `<div class="tg-round">
          <p class="tg-deckname" style="--c:${r.c.d.color}">${r.c.d.icon} ${esc(r.c.d.title)}</p>
          <p class="tg-prompt">${esc(r.c.q)}</p>
          <p class="tg-num"><small>number</small><b>${r.n}</b></p>
          <p class="tg-answer">${r.show ? '💡 ' + esc(r.c.a) : '<button type="button" class="tg-link" data-act="show">💡 Show the answer</button>'}</p>
          ${pointButtons(r.point)}
          <div class="tg-row"><button type="button" class="tg-btn alt" data-act="num">🔢 Another number</button><button type="button" class="tg-btn go" data-act="next">Next card ▶</button></div>
          <p class="tg-foot"><button type="button" class="tg-link" data-act="reset">↺ new game (scores to 0)</button></p></div>`;
      };
      area.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.t) { givePoint(b.dataset.t, r); paint(); }
        else if (b.dataset.act === 'show') { r.show = true; paint(); }
        else if (b.dataset.act === 'num') { r.n = nextNum(); paint(); }
        else if (b.dataset.act === 'next') next();
        else if (b.dataset.act === 'reset') { score.a = score.b = 0; paintScore(); next(); }
      };
      next();
    };
    start();
  }

  /* ---------- 🅰️ four corners ---------- */
  function cornersGame() {
    score.a = score.b = 0;
    const start = () => deckPicker('🅰️ Four corners', 'Stick the letters <b>A B C D</b> in the four corners of the room (or call them <i>left, right, front, back</i>). The board shows a question: the pupils walk to the corner they think is right. Then the answer appears!', play, menu);
    const play = decks => {
      openGame('🅰️ Four corners', { scored: true, onBack: start });
      const cards = decks.flatMap(d => d.items.map(([q, a]) => ({ q, a, d })));
      const pool = [...new Set(cards.map(c => c.a))];
      const nextCard = bag(cards);
      const COL = ['#f05f4b', '#4aa8ec', '#3aa04a', '#f9b11a'];
      let r;
      const next = () => {
        const c = nextCard();
        // wrong choices come from the other answers of the same topic(s), never the same word
        const wrong = shuffle(pool.filter(x => x !== c.a && !c.a.split(' / ').includes(x))).slice(0, 3);
        r = { c, opts: shuffle([c.a, ...wrong]), show: false, point: false };
        paint();
      };
      const paint = () => {
        area.innerHTML = `<div class="tg-round">
          <p class="tg-deckname" style="--c:${r.c.d.color}">${r.c.d.icon} ${esc(r.c.d.title)}</p>
          <p class="tg-prompt">${esc(r.c.q)}</p>
          <div class="tg-opts">${r.opts.map((o, i) => `<div class="tg-opt${r.show ? (o === r.c.a ? ' right' : ' dim') : ''}" style="--c:${COL[i]}"><b>${'ABCD'[i]}</b><span>${esc(o)}</span></div>`).join('')}</div>
          <div class="tg-row">${r.show ? '' : '<button type="button" class="tg-btn" data-act="show">👀 Show the answer</button>'}</div>
          <p class="tg-help">Points: give +1 to the team with more pupils in the right corner.</p>
          ${pointButtons(r.point)}
          <div class="tg-row"><button type="button" class="tg-btn go" data-act="next">Next question ▶</button></div></div>`;
      };
      area.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.t) { givePoint(b.dataset.t, r); paint(); }
        else if (b.dataset.act === 'show') { r.show = true; paint(); }
        else if (b.dataset.act === 'next') next();
      };
      next();
    };
    start();
  }

  /* ---------- 👋 slap the word (the "flyswatter" game) ---------- */
  function slapGame() {
    score.a = score.b = 0;
    const start = () => deckPicker('👋 Slap the word', 'Two players stand at the board, one for each team. The board shows six words. The teacher reads the clue: the first player to <b>slap the right word</b> wins the point!', play, menu);
    const play = decks => {
      openGame('👋 Slap the word', { scored: true, onBack: start });
      const cards = decks.flatMap(d => d.items.map(([q, a]) => ({ q, a, d })));
      const pool = [...new Set(cards.map(c => c.a))];
      const nextCard = bag(cards);
      let r;
      const next = () => {
        const c = nextCard();
        const wrong = shuffle(pool.filter(x => x !== c.a && !c.a.split(' / ').includes(x))).slice(0, 5);
        r = { c, opts: shuffle([c.a, ...wrong]), clue: false, reveal: false, point: false };
        paint();
      };
      const paint = () => {
        area.innerHTML = `<div class="tg-round">
          <div class="tg-slap">${r.opts.map(o => `<div class="tg-word${r.reveal && o === r.c.a ? ' right' : ''}">${esc(o)}</div>`).join('')}</div>
          <p class="tg-clue">${r.clue ? `<small>${r.c.d.icon} ${esc(r.c.d.title)}</small>${esc(r.c.q)}` : '<button type="button" class="tg-link" data-act="clue">🔊 Show the clue (read it aloud)</button>'}</p>
          ${r.clue && !r.reveal ? '<p><button type="button" class="tg-link" data-act="reveal">👀 Show the right word</button></p>' : ''}
          ${pointButtons(r.point)}
          <div class="tg-row"><button type="button" class="tg-btn go" data-act="next">Next ▶</button></div></div>`;
      };
      area.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.t) { givePoint(b.dataset.t, r); paint(); }
        else if (b.dataset.act === 'clue') { r.clue = true; paint(); }
        else if (b.dataset.act === 'reveal') { r.reveal = true; paint(); }
        else if (b.dataset.act === 'next') next();
      };
      next();
    };
    start();
  }

  /* ---------- ⏱ beat the clock ---------- */
  function clockGame() {
    score.a = score.b = 0;
    openGame('⏱ Beat the clock', { scored: true, onBack: menu });
    const nextTopic = bag(TOPICS);
    let secs = 30, topic = nextTopic(), left = secs, count = 0, team = 'a', timer = null, state = 'ready';
    cleanup = () => { clearInterval(timer); timer = null; };
    const paint = () => {
      area.innerHTML = `<div class="tg-round">
        <p class="tg-topic"><span>${topic[0]}</span>${esc(topic[1])}</p>
        <p class="tg-clock${state === 'run' && left <= 5 ? ' hot' : ''}${state === 'over' ? ' over' : ''}">${state === 'over' ? 'Time!' : left}</p>
        <p class="tg-help">${state === 'ready' ? `<b>Team ${team.toUpperCase()}</b>: say as many words as you can before the time is over. No repeating!` : state === 'run' ? `<b>Team ${team.toUpperCase()}</b>: press <b>+1</b> for each good word.` : `Team ${team.toUpperCase()} said <b>${count}</b> words.`}</p>
        <p class="tg-count"><button type="button" class="tg-btn alt" data-act="minus"${state !== 'run' ? ' disabled' : ''}>−</button><b class="tg-big">${count}</b><button type="button" class="tg-btn big" data-act="plus"${state !== 'run' ? ' disabled' : ''}>+1</button></p>
        <div class="tg-row">
          ${state === 'ready' ? `<button type="button" class="tg-btn go" data-act="go">▶ Start the clock</button>` : ''}
          ${state === 'run' ? `<button type="button" class="tg-btn alt" data-act="stop">■ Stop</button>` : ''}
          ${state === 'over' ? `<button type="button" class="tg-btn go" data-act="bank">✔ Add ${count} to Team ${team.toUpperCase()}</button>` : ''}
          <button type="button" class="tg-btn alt" data-act="topic">🔀 Other topic</button></div>
        <p class="tg-foot">Time <button type="button" data-s="20" class="${secs === 20 ? 'on' : ''}">20 s</button><button type="button" data-s="30" class="${secs === 30 ? 'on' : ''}">30 s</button><button type="button" data-s="60" class="${secs === 60 ? 'on' : ''}">60 s</button></p></div>`;
    };
    const tick = () => { left--; if (left <= 0) { left = 0; clearInterval(timer); timer = null; state = 'over'; beep(); } paint(); };
    area.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.s) { secs = +b.dataset.s; if (state !== 'run') { left = secs; } paint(); return; }
      const act = b.dataset.act;
      if (act === 'go') { state = 'run'; left = secs; count = 0; clearInterval(timer); timer = setInterval(tick, 1000); }
      else if (act === 'plus') count++;
      else if (act === 'minus') count = Math.max(0, count - 1);
      else if (act === 'stop') { clearInterval(timer); timer = null; state = 'over'; }
      else if (act === 'bank') { score[team] += count; paintScore(); team = team === 'a' ? 'b' : 'a'; state = 'ready'; count = 0; left = secs; topic = nextTopic(); }
      else if (act === 'topic') topic = nextTopic();
      paint();
    };
    paint();
  }

  /* ---------- 🧰 class tools: number picker, groups, timer, scoreboard ---------- */
  function toolsGame() {
    openGame('🧰 Class tools', { onBack: menu });
    const st = JSON.parse(localStorage.getItem('tg-tools') || 'null') || { n: 22, k: 4, teams: [0, 0, 0, 0], min: 5 };
    const save = () => { try { localStorage.setItem('tg-tools', JSON.stringify(st)); } catch { /* ignore */ } };
    const bagN = () => bag(Array.from({ length: st.n }, (_, i) => i + 1));
    let pick = bagN(), picked = null, groups = null, left = 0, timer = null, running = false;
    cleanup = () => { clearInterval(timer); timer = null; };
    const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const TEAMS = [['Team A', '#1d9e75'], ['Team B', '#d85a30'], ['Team C', '#4aa8ec'], ['Team D', '#c35fb4']];
    const paint = () => {
      area.innerHTML = `<div class="tg-tools">
        <section class="tg-tool"><h3>🔢 Who goes next?</h3>
          <p class="tg-line"><span>Pupils in the class</span><button type="button" class="tg-btn alt" data-n="-1">−</button><b class="tg-big">${st.n}</b><button type="button" class="tg-btn alt" data-n="1">+</button></p>
          <p class="tg-num"><b>${picked ?? '?'}</b></p>
          <div class="tg-row"><button type="button" class="tg-btn go" data-act="pick">🎲 Pick a number</button><button type="button" class="tg-btn alt" data-act="repick">↺ Everybody again</button></div></section>
        <section class="tg-tool"><h3>👥 Make groups</h3>
          <p class="tg-line"><span>Pupils in each group</span><button type="button" class="tg-btn alt" data-k="-1">−</button><b class="tg-big">${st.k}</b><button type="button" class="tg-btn alt" data-k="1">+</button></p>
          <div class="tg-groups">${groups ? groups.map((g, i) => `<div><b>Group ${i + 1}</b>${g.join(' · ')}</div>`).join('') : '<p class="tg-help">Press the button: pupils are shown by number.</p>'}</div>
          <div class="tg-row"><button type="button" class="tg-btn go" data-act="groups">🔀 Make groups</button></div></section>
        <section class="tg-tool"><h3>⏳ Timer</h3>
          <p class="tg-clock sm${left > 0 && left <= 10 ? ' hot' : ''}">${mmss(left || st.min * 60)}</p>
          <div class="tg-row">${[1, 3, 5, 10].map(m => `<button type="button" class="tg-btn alt${st.min === m ? ' sel' : ''}" data-min="${m}">${m} min</button>`).join('')}</div>
          <div class="tg-row"><button type="button" class="tg-btn go" data-act="${running ? 'pause' : 'start'}">${running ? '❚❚ Pause' : '▶ Start'}</button><button type="button" class="tg-btn alt" data-act="reset">↺</button></div></section>
        <section class="tg-tool"><h3>🏆 Scoreboard</h3>
          <div class="tg-board">${TEAMS.map(([n, c], i) => `<div style="--c:${c}"><b>${n}</b><span>${st.teams[i]}</span><p><button type="button" data-tm="${i}" data-d="-1">−</button><button type="button" data-tm="${i}" data-d="1">+1</button></p></div>`).join('')}</div>
          <div class="tg-row"><button type="button" class="tg-btn alt" data-act="zero">↺ Scores to 0</button></div></section></div>`;
    };
    const tick = () => { left--; if (left <= 0) { left = 0; running = false; clearInterval(timer); beep(4); } paint(); };
    area.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset;
      if (d.n) { st.n = Math.min(40, Math.max(2, st.n + +d.n)); pick = bagN(); picked = null; groups = null; }
      else if (d.k) st.k = Math.min(10, Math.max(2, st.k + +d.k));
      else if (d.min) { st.min = +d.min; if (!running) left = 0; }
      else if (d.tm) st.teams[+d.tm] = Math.max(0, st.teams[+d.tm] + +d.d);
      else if (d.act === 'pick') picked = pick();
      else if (d.act === 'repick') { pick = bagN(); picked = null; }
      else if (d.act === 'groups') {
        const all = shuffle(Array.from({ length: st.n }, (_, i) => i + 1)), n = Math.max(1, Math.round(st.n / st.k));
        groups = Array.from({ length: n }, () => []);
        all.forEach((x, i) => groups[i % n].push(x));
        groups.forEach(g => g.sort((p, q) => p - q));
      }
      else if (d.act === 'start') { if (!left) left = st.min * 60; running = true; clearInterval(timer); timer = setInterval(tick, 1000); }
      else if (d.act === 'pause') { running = false; clearInterval(timer); }
      else if (d.act === 'reset') { running = false; clearInterval(timer); left = 0; }
      else if (d.act === 'zero') st.teams = [0, 0, 0, 0];
      save(); paint();
    };
    paint();
  }

  /* ---------- 🔥 hot seat: topics of the book (literature) and of the vocabulary ---------- */
  const HOT = [
    // literature of the book
    { g: 'Literature', icon: '⚡', color: '#fe7366', title: 'Greek mythology', words: ['Zeus', 'Hades', 'Persephone', 'Demeter', 'Poseidon', 'Athena', 'Apollo', 'Hermes', 'Aphrodite', 'Hera', 'Circe', 'Odysseus', 'Medusa', 'Mount Olympus', 'the Underworld', 'a pomegranate', 'Cerberus', 'Dionysus', 'a god', 'a goddess'] },
    { g: 'Literature', icon: '🐇', color: '#c97df6', title: 'Alice in Wonderland', words: ['Alice', 'the White Rabbit', 'the Cheshire Cat', 'the Mad Hatter', 'the Queen of Hearts', 'the Caterpillar', 'the March Hare', 'the Dormouse', 'the Dodo', 'a tea party', 'the rabbit hole', '“Drink me”', 'croquet', 'a pocket watch', 'the Looking-Glass', 'Wonderland'] },
    { g: 'Literature', icon: '🌹', color: '#d6334f', title: 'Romeo & Juliet', words: ['Romeo', 'Juliet', 'Tybalt', 'Mercutio', 'Benvolio', 'the Nurse', 'Friar Laurence', 'Verona', 'the Montagues', 'the Capulets', 'the balcony', 'poison', 'a masked ball', 'a feud', 'a sword', 'a tomb', 'a secret wedding'] },
    { g: 'Literature', icon: '🖋️', color: '#b23a48', title: 'Shakespeare & sonnets', words: ['William Shakespeare', 'a sonnet', 'the Globe Theatre', 'Hamlet', 'Macbeth', 'a quill', 'a metaphor', 'a simile', 'a rhyme', 'a couplet', 'Stratford-upon-Avon', 'a play', 'an actor', 'a stage', 'a comedy', 'a tragedy', 'a poet', 'a verse'] },
    { g: 'Literature', icon: '🐷', color: '#262626', title: 'Animal Farm', words: ['Napoleon', 'Snowball', 'Boxer', 'Squealer', 'Old Major', 'Clover', 'Benjamin', 'Mollie', 'Mr. Jones', 'the windmill', 'Manor Farm', 'Beasts of England', 'the Seven Commandments', 'the Rebellion', 'the dogs', 'the sheep', 'Moses the raven', 'a pig', 'a farm'] },
    { g: 'Literature', icon: '👁️', color: '#7a1f2b', title: '1984', words: ['Big Brother', 'Winston', 'Julia', 'Newspeak', 'a telescreen', 'Room 101', 'the Thought Police', 'the Ministry of Truth', 'Oceania', 'doublethink', 'a diary', 'a rebel'] },
    { g: 'Literature', icon: '📚', color: '#e0902c', title: 'Matilda & Coraline', words: ['Matilda', 'Miss Honey', 'Miss Trunchbull', 'Mr. Wormwood', 'the Chokey', 'a library', 'Coraline', 'the Other Mother', 'button eyes', 'the little door', 'the black cat', 'Wybie', 'a stone with a hole', 'a doll'] },
    { g: 'Literature', icon: '🎭', color: '#7b3fc4', title: 'Figures of speech', words: ['a metaphor', 'a simile', 'personification', 'hyperbole', 'alliteration', 'an idiom', 'a rhyme', 'a syllable', 'a stanza', 'a poem', 'a poet', 'a symbol', 'irony', 'a contrast'] },
    // vocabulary
    { g: 'Vocabulary', icon: '👩‍🔧', color: '#e8820c', title: 'Jobs', words: ['a vet', 'a mechanic', 'a teacher', 'a chef', 'a pilot', 'a firefighter', 'a hairdresser', 'a nurse', 'a builder', 'a police officer', 'a farmer', 'a journalist', 'a baker', 'an artist', 'a doctor', 'a dentist', 'a waiter', 'an engineer'] },
    { g: 'Vocabulary', icon: '🐾', color: '#8fb82e', title: 'Animals', words: ['a hedgehog', 'a flamingo', 'a seahorse', 'an octopus', 'a rhino', 'a squirrel', 'a penguin', 'a giraffe', 'a bat', 'a snail', 'a goat', 'a duck', 'a shark', 'a butterfly', 'a camel', 'a kangaroo'] },
    { g: 'Vocabulary', icon: '👕', color: '#dc3394', title: 'Clothes', words: ['a sweater', 'a scarf', 'boots', 'a jacket', 'a skirt', 'a hat', 'sneakers', 'a dress', 'jeans', 'a belt', 'gloves', 'a raincoat', 'pajamas', 'a tie', 'a backpack'] },
    { g: 'Vocabulary', icon: '⚽', color: '#f06054', title: 'Sports & hobbies', words: ['volleyball', 'swimming', 'skiing', 'dancing', 'chess', 'painting', 'cooking', 'cycling', 'basketball', 'gymnastics', 'reading', 'photography', 'karate', 'surfing', 'knitting', 'gaming'] },
    { g: 'Vocabulary', icon: '😀', color: '#de3796', title: 'Emotions', words: ['happy', 'angry', 'nervous', 'jealous', 'proud', 'embarrassed', 'bored', 'excited', 'lonely', 'worried', 'surprised', 'scared', 'disappointed', 'relaxed'] },
    { g: 'Vocabulary', icon: '🏠', color: '#c9de3c', title: 'Home', words: ['a sofa', 'a fridge', 'a wardrobe', 'a bathtub', 'a mirror', 'a carpet', 'a lamp', 'a shelf', 'a microwave', 'a staircase', 'a balcony', 'a curtain', 'a pillow', 'a cupboard'] },
    { g: 'Vocabulary', icon: '🍕', color: '#3aa04a', title: 'Food', words: ['a pizza', 'a sandwich', 'spaghetti', 'a salad', 'ice cream', 'a hamburger', 'cheese', 'a cookie', 'soup', 'an egg', 'rice', 'a banana', 'chocolate', 'pancakes'] },
    { g: 'Vocabulary', icon: '🌍', color: '#4aa8ec', title: 'Countries & places', words: ['Italy', 'Spain', 'Japan', 'Egypt', 'Brazil', 'Canada', 'Australia', 'London', 'New York', 'a hospital', 'a library', 'a museum', 'a bakery', 'a bank', 'a park'] },
  ];

  function hotGame() {
    score.a = score.b = 0;
    const chosen = new Set();
    let secs = 60;
    const setup = () => {
      openGame('🔥 Hot seat', { scored: true, onBack: menu });
      const section = g => `<p class="tg-label">${g === 'Literature' ? '📖 Literature in the book' : '🔤 Vocabulary'}</p>
        <div class="tg-decks">${HOT.map((t, i) => t.g === g ? `<button type="button" class="tg-deck${chosen.has(i) ? ' on' : ''}" data-h="${i}" style="--c:${t.color}"><span>${t.icon}</span>${esc(t.title)}<small>${t.words.length} words</small></button>` : '').join('')}</div>`;
      area.innerHTML = `<div class="tg-card">
        <p class="tg-intro">One pupil sits on the <b>hot seat</b>, <b>with their back to the board</b>. The board shows a word: the class explains it <b>without saying it</b> (no translating, no spelling). The pupil guesses!</p>
        ${section('Literature')}${section('Vocabulary')}
        <p class="tg-foot">Time for each pupil <button type="button" data-s="45" class="${secs === 45 ? 'on' : ''}">45 s</button><button type="button" data-s="60" class="${secs === 60 ? 'on' : ''}">60 s</button><button type="button" data-s="90" class="${secs === 90 ? 'on' : ''}">90 s</button><button type="button" data-s="120" class="${secs === 120 ? 'on' : ''}">2 min</button>
          · <button type="button" class="tg-link" data-all="1">choose all</button> · <button type="button" class="tg-link" data-all="0">none</button></p>
        <div class="tg-row"><button type="button" class="tg-btn" id="tgHotGo"${chosen.size ? '' : ' disabled'}>${chosen.size ? `▶ Play (${chosen.size} topic${chosen.size > 1 ? 's' : ''})` : 'Choose at least one topic'}</button></div></div>`;
      area.onclick = setupClick;
    };
    const setupClick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.h) { const i = +b.dataset.h; chosen.has(i) ? chosen.delete(i) : chosen.add(i); setup(); }
      else if (b.dataset.s) { secs = +b.dataset.s; setup(); }
      else if (b.dataset.all) { chosen.clear(); if (b.dataset.all === '1') HOT.forEach((_, i) => chosen.add(i)); setup(); }
      else if (b.id === 'tgHotGo' && chosen.size) play();
    };
    const play = () => {
      openGame('🔥 Hot seat', { scored: true, onBack: setup });
      const words = [...chosen].flatMap(i => HOT[i].words.map(w => ({ w, t: HOT[i] })));
      const nextWord = bag(words);
      let team = 'a', state = 'ready', left = secs, cur = null, got = [], passed = [], timer = null;
      cleanup = () => { clearInterval(timer); timer = null; };
      const draw = () => { cur = nextWord(); };
      const paint = () => {
        const tm = team.toUpperCase();
        if (state === 'ready') {
          area.innerHTML = `<div class="tg-round"><p class="tg-topic"><span>🔥</span>Team ${tm}: who is in the hot seat?</p>
            <p class="tg-help">The pupil sits <b>with their back to the board</b>. Ready? The word appears when you start.</p>
            <div class="tg-row"><button type="button" class="tg-btn go" data-act="go">▶ Start (${secs} s)</button></div></div>`;
        } else if (state === 'run') {
          area.innerHTML = `<div class="tg-round"><p class="tg-hot-top"><span class="tg-hot-team ${team}">Team ${tm}</span><span class="tg-hot-time${left <= 10 ? ' hot' : ''}">⏱ ${left}</span><span class="tg-hot-n">✔ ${got.length}</span></p>
            <p class="tg-deckname" style="--c:${cur.t.color}">${cur.t.icon} ${esc(cur.t.title)}</p>
            <p class="tg-hotword">${esc(cur.w)}</p>
            <div class="tg-row"><button type="button" class="tg-btn go big2" data-act="ok">✔ Got it!</button><button type="button" class="tg-btn alt big2" data-act="pass">⏭ Pass</button></div></div>`;
        } else {
          area.innerHTML = `<div class="tg-round"><p class="tg-clock over" style="font-size:clamp(50px,10vw,100px)">Time!</p>
            <p class="tg-help">Team ${tm}: <b>${got.length}</b> word${got.length === 1 ? '' : 's'}</p>
            <div class="tg-hot-list"><div><b>✔ Guessed</b>${got.map(w => `<span>${esc(w)}</span>`).join('') || '<i>none</i>'}</div><div><b>✖ Passed / not guessed</b>${passed.map(w => `<span>${esc(w)}</span>`).join('') || '<i>none</i>'}</div></div>
            <div class="tg-row"><button type="button" class="tg-btn go" data-act="bank">✔ Add ${got.length} to Team ${tm} · next team</button></div></div>`;
        }
      };
      const tick = () => { left--; if (left <= 0) { left = 0; clearInterval(timer); timer = null; if (cur) passed.push(cur.w); state = 'over'; beep(); } paint(); };
      area.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        const act = b.dataset.act;
        if (act === 'go') { state = 'run'; left = secs; got = []; passed = []; draw(); clearInterval(timer); timer = setInterval(tick, 1000); }
        else if (act === 'ok') { got.push(cur.w); draw(); }
        else if (act === 'pass') { passed.push(cur.w); draw(); }
        else if (act === 'bank') { score[team] += got.length; paintScore(); team = team === 'a' ? 'b' : 'a'; state = 'ready'; }
        paint();
      };
      paint();
    };
    setup();
  }

  /* ---------- the tiles: they are in the "For the teacher" part of the home page (script.js renderHome), before the guided meditations ---------- */
  const ENTRIES = [
    { icon: '🔥', title: 'Hot seat', color: '#d6334f', text: 'A pupil guesses the word the class explains: literature of the book and vocabulary, you choose the topics.', run: hotGame },
    { icon: '🚩', title: 'Flag game', color: '#f05f4b', text: 'Bandierina: two teams, a number, a card on the board. Pronouns, to be, verbs, jobs…', run: flagGame },
    { icon: '🅰️', title: 'Four corners', color: '#3aa04a', text: 'A question and A-B-C-D: the class walks to the right corner of the room.', run: cornersGame },
    { icon: '👋', title: 'Slap the word', color: '#4aa8ec', text: 'Six words on the board, two players: slap the right one first!', run: slapGame },
    { icon: '⏱', title: 'Beat the clock', color: '#f9b11a', text: 'A topic and 30 seconds: how many words can your team say?', run: clockGame },
    { icon: '🧰', title: 'Class tools', color: '#1f2a6b', text: 'Who goes next? · groups · timer · scoreboard.', run: toolsGame },
    { icon: '👷', title: 'Job Flag Game', color: '#d6334f', text: 'The bandierina of the jobs (chapter Jobs &amp; CVs), with the parts to say.', run: () => window.JOB_FLAG?.open() },
    { icon: '🏁', title: 'Grammar Race', color: '#8e2de2', text: 'Timed race for the whole class: needs the pupils’ own devices.', run: () => window.GRAMMAR_RACE?.open?.() },
  ];
  function menu() {
    stop();
    close();
  }
  // HTML of the tiles for the home page: a small heading, the games, a heading for the materials that follow
  const tiles = () => `<h4 class="tg-sub">🎮 Games for the teacher <small>whiteboard (LIM) or phone · no pupil devices needed</small></h4>${
    ENTRIES.map((g, i) => `<button type="button" class="tg-tile" data-i="${i}" style="--c:${g.color}"><span class="tg-ico">${g.icon}</span><b>${esc(g.title)}</b><small>${g.text}</small></button>`).join('')
  }<h4 class="tg-sub">📄 Materials</h4>`;
  document.addEventListener('click', e => {
    const t = e.target.closest('.tg-tile'); if (t) ENTRIES[+t.dataset.i]?.run();
  });
  window.TEACHER_GAMES = { open: i => ENTRIES[i]?.run(), decks: DECKS, hot: HOT, tiles };
  // script.js drew the home page before this file was loaded: draw the teacher's part again
  if (typeof isTeacher === 'function' && isTeacher() && typeof renderHome === 'function') renderHome();
})();
