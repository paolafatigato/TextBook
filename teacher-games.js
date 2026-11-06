// Games for the teacher (home page, only when the teacher is signed in).
// Played from the whiteboard (LIM) or from the teacher's phone: nothing for the pupils to open, no login, works offline.
// The teacher is the "game master": she clicks, the class plays out loud, on the floor, at the board.
//   🏀 Paper basket (data: basket-data.js) · 🚩 Flag game (bandierina) · 🅰️ Four corners · 👋 Slap the word · ⏱ Beat the clock · 🧰 Class tools
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
      ['I have a dog → … dog', 'my dog'], ['You have a bike → … bike', 'your bike'], ['He has a cat → … cat', 'his cat'], ['She has a phone → … phone', 'her phone'],
      ['We have a car → … car', 'our car'], ['They have a house → … house', 'their house'], ['The dog has a bone → … bone', 'its bone'], ['I have two sisters → … sisters', 'my sisters'],
      ['You have a new teacher → … teacher', 'your teacher'], ['He has a red bag → … bag', 'his bag'], ['She has two brothers → … brothers', 'her brothers'], ['We have a big garden → … garden', 'our garden'],
      ['They have a small boat → … boat', 'their boat'], ['The bird has a nest → … nest', 'its nest'], ['I have a blue pen → … pen', 'my pen'], ['You have a funny friend → … friend', 'your friend'],
      ['My brother and I are the owners of the dog: it is … dog', 'our'], ['Tom and Anna are the owners of the cat: it is … cat', 'their'], ['Marco is the owner of the bike: it is … bike', 'his'], ['Sara is the owner of the bag: it is … bag', 'her'],
      ['I am the owner of the book: it is … book', 'my'], ['You are the owner of the pen: it is … pen', 'your'], ['You and Luca are the owners of the house: it is … house', 'your'], ['The dog is the owner of the ball: it is … ball', 'its'],
      ['My mom and dad are the owners of the shop: it is … shop', 'their'], ['Giulia and I are the owners of the cat: it is … cat', 'our'], ['Mr. Rossi is the owner of the restaurant: it is … restaurant', 'his'], ['Ms. Fatigato is the owner of the laptop: it is … laptop', 'her'],
      ['This is my sister. … name is Anna.', 'Her'], ['This is my brother. … name is Luca.', 'His'], ['These are my friends. … names are Sam and Eli.', 'Their'], ['We are in class 2B. … classroom is big.', 'Our'],
      ['I love dogs. … dog is called Rex.', 'My'], ['Do you like pizza? What is … favorite?', 'your'], ['The cat is hungry. … bowl is empty.', 'Its'], ['Tom and I are friends. … friendship is important.', 'Our'],
      ['Anna and Sara are twins. … birthday is in May.', 'Their'], ['Marco is a pilot. … plane is big.', 'His'], ['Is this … pencil case? (to a boy, talking to him)', 'your'], ['Giulia loves music. … favorite singer is Billie.', 'Her'],
      ['The teachers are late. … bus is in the traffic.', 'Their'], ['I am Italian. … country is beautiful.', 'My'], ['What is … name? (asking a friend)', 'your'], ['The sun shines. … light is warm.', 'Its'] ] },
    { id: 'be', noFlag: true, icon: '🅱️', color: '#4aa8ec', title: 'To be', hint: 'am · is · are (and the short forms)', items: [
      ['I … Italian.', 'am'], ['She … my friend.', 'is'], ['They … at school.', 'are'], ['We … tired.', 'are'], ['He … a doctor.', 'is'], ['You … late!', 'are'],
      ['The cat … on the sofa.', 'is'], ['My parents … at work.', 'are'], ['It … a big dog.', 'is'], ['Tom and I … in class 2B.', 'are'],
      ['negative: I … hungry. (not)', "am not / I'm not"], ['negative: She … tall. (not)', "isn't / is not"], ['negative: They … ready. (not)', "aren't / are not"] ] },
    { id: 'ps3', noFlag: true, icon: '🏃', color: '#3aa04a', title: 'Present simple: he / she / it', hint: 'Say the verb with the right ending.', items: [
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
      ['treats sick animals', 'a vet'], ['repairs cars', 'a mechanic'], ['teaches children', 'a teacher'], ['cooks in a restaurant', 'a chef'], ['flies a plane', 'a pilot'], ['puts out fires', 'a firefighter'], ['cuts your hair', 'a hairdresser'], ['takes care of sick people in a hospital', 'a nurse'], ['builds houses', 'a builder'], ['catches thieves', 'a police officer'], ['grows food on a farm', 'a farmer'], ['writes articles for a newspaper', 'a journalist'], ['makes bread and cakes', 'a baker'], ['paints pictures', 'an artist'], ['looks after your teeth', 'a dentist'], ['brings you food at the table', 'a waiter'], ['designs bridges and machines', 'an engineer'], ['drives a bus', 'a bus driver'], ['fixes the pipes in your house', 'a plumber'], ['fixes the lights and the wires', 'an electrician'], ['sells things in a shop', 'a shop assistant'], ['works with computers and writes code', 'a programmer'], ['takes photos', 'a photographer'], ['plays music in a band', 'a musician'], ['acts in films and plays', 'an actor'], ['helps people in court', 'a lawyer'], ['studies the stars and planets', 'an astronomer'], ['makes clothes', 'a tailor'], ['looks after money in a bank', 'a bank clerk'], ['delivers letters and parcels', 'a postman'], ['plays soccer for a team', 'a soccer player'], ['trains athletes', 'a coach'], ['works in a lab and does experiments', 'a scientist'], ['cleans the streets', 'a street cleaner'], ['draws buildings and houses', 'an architect'], ['serves coffee in a café', 'a barista'], ['looks after children when parents work', 'a babysitter'], ['catches fish at sea', 'a fisherman'], ['translates from one language to another', 'a translator'], ['flies in space', 'an astronaut'] ] },
    // Jobs & CVs "level 2" of the Job Flag Game (jobs-describe.js): a job + a part to say something about. Only in the flag game.
    { id: 'jobtalk', flag: true, icon: '👷', color: '#e8820c', title: 'Jobs & CVs: talk about the job', hint: 'Say a sentence about the job.',
      get items() {
        const J = window.JOB_FLAG; if (!J) return [];
        return J.JOBS.flatMap(job => J.PARTS.map(p => [`${job.pic} ${job.a}: ${p.q}`, `${p.start(job).replace('…', '')} ${J.right(job, p.k)}.`]));
      } },
    { id: 'prep', icon: '📍', color: '#12a4a4', title: 'Prepositions of place', hint: 'in · on · under · next to · behind · between…', items: [
      ['The cat is … the box. (inside)', 'in'], ['The book is … the table. (on top)', 'on'], ['The ball is … the chair. (below)', 'under'], ['The school is … the bank and the shop.', 'between'],
      ['I sit … my best friend. (at the side)', 'next to'], ['The garden is … the house. (at the back)', 'behind'], ['The picture is … the sofa. (up high)', 'above'], ['The teacher is … the class. (face to face)', 'in front of'],
      ['The bus stop is … the school. (opposite)', 'opposite'], ['Italy is … France and Slovenia.', 'between'] ] },
    { id: 'comp', icon: '⚖️', color: '#e0584a', title: 'Comparatives', hint: 'Say the comparative.', items: [
      ['tall', 'taller'], ['big', 'bigger'], ['good', 'better'], ['bad', 'worse'], ['happy', 'happier'], ['interesting', 'more interesting'], ['far', 'farther'],
      ['easy', 'easier'], ['expensive', 'more expensive'], ['hot', 'hotter'], ['funny', 'funnier'], ['beautiful', 'more beautiful'], ['small', 'smaller'], ['difficult', 'more difficult'] ] },
  ];

  // more cards (🇮🇹 = the pupil translates from Italian)
  const more = (id, cards) => DECKS.find(d => d.id === id).items.push(...cards);
  more('subj', [
    ['my mother', 'she'], ['the girls', 'they'], ['Tom, Anna and I', 'we'], ['the book', 'it'], ['your uncle', 'he'], ['the students', 'they'], ['Anna, you and Marco', 'you'], ['Mr. Brown', 'he'], ['my parents and I', 'we'], ['the weather', 'it'], ['Ms. Fatigato and Mr. Rossi', 'they'], ['the baby (a girl)', 'she'], ['the baby (a boy)', 'he'], ['the shoes', 'they'], ['the city', 'it'], ['you and I', 'we'], ['🇮🇹 lui', 'he'], ['🇮🇹 lei', 'she'], ['🇮🇹 noi', 'we'], ['🇮🇹 loro', 'they'], ['🇮🇹 io', 'I'], ['🇮🇹 tu', 'you'], ['🇮🇹 voi', 'you'], ['🇮🇹 esso (il cane)', 'it'], ['🇮🇹 Lei è un’insegnante. → … is a teacher.', 'she'], ['🇮🇹 Loro sono stanchi. → … are tired.', 'they'], ['🇮🇹 Noi abitiamo a Napoli. → … live in Naples.', 'we'], ['🇮🇹 Lui ha un cane. → … has a dog.', 'he'], ['🇮🇹 Piove. → … is raining.', 'it'], ['🇮🇹 Io sono italiana. → … am Italian.', 'I'], ['past: Yesterday Tom played soccer. … was happy.', 'he'], ['past: Last night my sister and I watched a movie. … loved it.', 'we'], ['past: Anna and Sara went shopping. … bought a dress.', 'they'], ['past: I called Maria, but … didn’t answer.', 'she'], ['past: We saw a big dog. … was very friendly.', 'it'], ['past: Where were Luca and Giulia? … were at the cinema.', 'they'] ]);
  more('obj', [
    ['She loves Tom → She loves …', 'him'], ['I know Anna → I know …', 'her'], ['They help the old man → They help …', 'him'], ['He calls my sister and me → He calls …', 'us'], ['Look at the stars! → Look at …!', 'them'], ['Tell Anna the story → Tell … the story', 'her'], ['I see you and Marco → I see …', 'you'], ['Wait for Tom and Anna → Wait for …', 'them'], ['Talk to the teacher → Talk to …', 'her'], ['Come with Luca and me → Come with …', 'us'], ['Pass me the ball → Pass … the ball (to Tom)', 'him'], ['She hates spiders → She hates …', 'them'], ['I love my dog → I love …', 'it'], ['Dad drives my brother → Dad drives …', 'him'], ['Take the keys → Take …', 'them'], ['🇮🇹 Lo vedo. (Tom) → I see …', 'him'], ['🇮🇹 La conosco. (Anna) → I know …', 'her'], ['🇮🇹 Parlo con loro. → I talk to …', 'them'], ['🇮🇹 Ci chiama. → He calls …', 'us'], ['🇮🇹 Mi aiuti? → Can you help …?', 'me'], ['🇮🇹 Ti amo. → I love …', 'you'], ['🇮🇹 Dallo a lui. → Give it to …', 'him'], ['🇮🇹 Vieni con noi! → Come with …!', 'us'], ['🇮🇹 Guardala! (la foto) → Look at …!', 'it'], ['🇮🇹 Chiamali! (i ragazzi) → Call …!', 'them'], ['past: Yesterday I met Tom and I invited … to my party.', 'him'], ['past: We saw Anna and gave … a present.', 'her'], ['past: The teacher called Luca and me and told … the news.', 'us'], ['past: I found your keys and gave … to your mom.', 'them'], ['past: She didn’t like the movie, so she left … early. (the cinema)', 'it'], ['past: They asked me and I helped …', 'them'] ]);
  more('past', [
    ['do', 'did'], ['say', 'said'], ['get', 'got'], ['find', 'found'], ['leave', 'left'], ['meet', 'met'], ['read (pronounced “red”)', 'read'], ['sleep', 'slept'], ['tell', 'told'], ['understand', 'understood'], ['win', 'won'], ['lose', 'lost'], ['forget', 'forgot'], ['feel', 'felt'], ['hear', 'heard'], ['send', 'sent'], ['wear', 'wore'], ['begin', 'began'], ['break', 'broke'], ['drive', 'drove'], ['fly', 'flew'], ['sing', 'sang'], ['steal', 'stole'], ['wake up', 'woke up'], ['pay', 'paid'], ['sell', 'sold'], ['stand', 'stood'], ['fall', 'fell'], ['🇮🇹 andai → I … (go)', 'went'], ['🇮🇹 mangiò → she … (eat)', 'ate'], ['🇮🇹 vedemmo → we … (see)', 'saw'], ['🇮🇹 comprarono → they … (buy)', 'bought'], ['🇮🇹 scrissi → I … (write)', 'wrote'], ['🇮🇹 ebbe → he … (have)', 'had'], ['🇮🇹 dissero → they … (say)', 'said'], ['🇮🇹 presi → I … (take)', 'took'], ['🇮🇹 vinse → she … (win)', 'won'], ['🇮🇹 persi → I … (lose)', 'lost'], ['Yesterday I … pizza. (eat)', 'ate'], ['Last summer we … to Spain. (go)', 'went'], ['She … a letter to her friend. (write)', 'wrote'], ['They … a new car last year. (buy)', 'bought'], ['He … his keys. (lose)', 'lost'] ]);

  // the topics in the order they are taught at school (1st year → 3rd year)
  ['subj', 'obj', 'poss', 'be', 'ps3', 'plur', 'opp', 'prep', 'comp', 'past', 'jobs', 'jobtalk']
    .forEach((id, i) => { DECKS.find(d => d.id === id).order = i; });
  DECKS.sort((a, b) => a.order - b.order);

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
  function deckPicker(name, intro, then, backTo, extra = false) {
    openGame(name, { onBack: backTo });
    const chosen = new Set();
    area.innerHTML = `<div class="tg-card">
      <p class="tg-intro">${intro}</p>
      <p class="tg-label">Choose a topic <small>(or more than one: they get mixed)</small></p>
      <div class="tg-decks">${DECKS.filter(d => (extra ? !d.noFlag : !d.flag)).map(d => `<button type="button" class="tg-deck" data-d="${d.id}" style="--c:${d.color}"><span>${d.icon}</span>${esc(d.title)}<small>${d.items.length} cards</small></button>`).join('')}</div>
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
    const start = () => deckPicker('🚩 Flag game', 'Two teams. Every player has a <b>number</b>. The board shows a card, the teacher calls a number, and the two players with that number <b>run</b> to take the flag and give the answer!', decks => setup(decks), menu, true);
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
      const pool = [...new Map(cards.map(c => [c.a.toLowerCase(), c.a])).values()];
      const nextCard = bag(cards);
      const COL = ['#f05f4b', '#4aa8ec', '#3aa04a', '#f9b11a'];
      let r;
      const next = () => {
        const c = nextCard();
        // wrong choices come from the other answers of the same topic(s), never the same word
        const wrong = shuffle(pool.filter(x => x.toLowerCase() !== c.a.toLowerCase() && !c.a.split(' / ').includes(x))).slice(0, 3);
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
      const pool = [...new Map(cards.map(c => [c.a.toLowerCase(), c.a])).values()];
      const nextCard = bag(cards);
      let r;
      const next = () => {
        const c = nextCard();
        const wrong = shuffle(pool.filter(x => x.toLowerCase() !== c.a.toLowerCase() && !c.a.split(' / ').includes(x))).slice(0, 5);
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


  /* ---------- 🧩 word matrix: prefixes + root + suffixes, the team with more real words (with the meaning) wins ---------- */
  // pre / suf: the pieces of the matrix; words: some of the real words (the teacher shows them at the end)
  const MATRICES = [
    { root: 'mit', mean: 'send',
      L: { col: [['ad', 'e', 'inter', 'o', 'per', 'sub', 'trans'], { row: [['non', 'sub'], ['com']] }, { row: [['un'], ['re']] }] },
      R: { col: [['able', 'al', 'ed', 's'], { row: [['ance'], ['es']] }, { row: [['ee'], ['s']] }, { row: [['ent', 'ing'], ['ly']] }] }, pre: ['ad', 'e', 'inter', 'o', 'per', 'sub', 'trans', 'com', 'non', 'un', 're'], suf: ['able', 'al', 'ed', 's', 'ance', 'es', 'ee', 'ing', 'ent', 'ly'],
      words: [['admit', 'to allow in; to say it is true'], ['emit', 'to send out (light, sound)'], ['omit', 'to leave out'], ['permit', 'to allow'], ['submit', 'to hand in; to give in'], ['transmit', 'to send across'],
        ['commit', 'to promise; to do (a crime)'], ['remit', 'to send back (money)'], ['intermittent', 'starting and stopping again and again'], ['admittance', 'the right to go in'], ['permitted', 'allowed'],
        ['committee', 'a group chosen to decide something'], ['noncommittal', 'not saying clearly yes or no'], ['transmittable', 'that can be sent or passed on']] },
    { root: 'struct', mean: 'build',
      L: { col: [{ row: [['re', 'de'], ['con']] }, { row: [['in'], ['de']] }, ['in', 'ob', 'sub', 'super', 'infra']] },
      R: { col: [['s', 'ed', 'ing', 'ion', 'or'], { row: [['ive'], ['ly', 'ity', 'ness']] }, { row: [['ure'], { col: [['es', 'ed', 'ing'], { row: [['al'], ['ly', 'ism', 'ist']] }] }] }] }, pre: ['re', 'de', 'con', 'in', 'ob', 'sub', 'super', 'infra'], suf: ['s', 'ed', 'ing', 'ion', 'or', 'ive', 'ly', 'ity', 'ness', 'ure', 'al', 'ism', 'ist', 'es'],
      words: [['construct', 'to build'], ['destruct', 'to destroy on purpose'], ['instruct', 'to teach; to give orders'], ['obstruct', 'to block'], ['structure', 'the way something is built'], ['structural', 'about the structure'],
        ['construction', 'a building; the act of building'], ['destruction', 'a lot of damage'], ['instruction', 'a teaching; an order'], ['instructor', 'a teacher'], ['constructive', 'useful, helpful'], ['obstructive', 'blocking things'],
        ['substructure', 'a base under a building'], ['superstructure', 'the part above the base'], ['infrastructure', 'roads, bridges, pipes of a country'], ['restructure', 'to build or organize again'], ['deconstruct', 'to take to pieces']] },
    { root: 'port', mean: 'carry', pre: ['ex', 'im', 're', 'trans', 'sup', 'de', 'com'], suf: ['s', 'ed', 'ing', 'er', 'able', 'ation', 'ant', 'ive'],
      words: [['export', 'to send goods to another country'], ['import', 'to bring goods into a country'], ['report', 'to tell what happened'], ['transport', 'to carry from place to place'], ['support', 'to hold up; to help'], ['deport', 'to send a person out of a country'],
        ['portable', 'easy to carry'], ['porter', 'a person who carries bags'], ['important', 'that carries a lot of weight; very needed'], ['reporter', 'a person who tells the news'], ['transportation', 'ways of carrying people and things'], ['supporter', 'a fan; a person who helps'],
        ['deportation', 'sending a person out of a country'], ['comport', 'to behave']] },
    { root: 'dict', mean: 'say', pre: ['pre', 'con', 'tra', 'in', 'ver', 'e', 'bene', 'un'], suf: ['s', 'ed', 'ing', 'ion', 'or', 'ive', 'able', 'ate', 'ary', 'ory'],
      words: [['predict', 'to say what will happen'], ['prediction', 'what you say will happen'], ['unpredictable', 'impossible to know before'], ['contradict', 'to say the opposite'], ['dictate', 'to say aloud for others to write'], ['dictator', 'a ruler who says what everybody must do'],
        ['dictation', 'words said aloud to be written'], ['dictionary', 'a book of words'], ['diction', 'the way you say words'], ['verdict', 'the decision of a court'], ['edict', 'an official order'], ['benediction', 'a blessing (good saying)'], ['indicate', 'to show']] },
    { root: 'scrib / script', mean: 'write', pre: ['de', 'in', 'pre', 'sub', 'trans', 'manu', 'post', 'con', 'a'], suf: ['e', 'ed', 'ing', 'tion', 'er', 'ure', 's', 'ble'],
      words: [['describe', 'to say what something is like'], ['description', 'words that say what something is like'], ['inscribe', 'to write on a surface'], ['inscription', 'words written on a stone'], ['prescribe', 'to write a medicine for a patient'],
        ['prescription', 'the doctor’s paper for a medicine'], ['subscribe', 'to sign up'], ['subscription', 'a paid sign-up'], ['transcribe', 'to copy in writing'], ['transcript', 'a written copy of what was said'], ['script', 'the written words of a film or play'],
        ['manuscript', 'a text written by hand'], ['postscript', 'P.S.: written after the letter'], ['scribe', 'a person who copies texts'], ['scripture', 'a holy writing'], ['conscript', 'a person called to the army']] },
    { root: 'spect', mean: 'look', pre: ['in', 're', 'pro', 'ex', 'sus', 'per', 'retro', 'circum', 'intro', 'a'], suf: ['s', 'ed', 'ing', 'or', 'ion', 'ive', 'acle', 'acular'],
      words: [['inspect', 'to look at closely'], ['inspector', 'a person who checks things'], ['respect', 'to look up to; to admire'], ['prospect', 'a view of the future; a chance'], ['expect', 'to look forward to'], ['suspect', 'to think someone did something bad'],
        ['perspective', 'a way of looking at something'], ['retrospective', 'looking back at the past'], ['spectator', 'a person who watches'], ['spectacle', 'a great show to look at'], ['spectacular', 'amazing to look at'], ['aspect', 'one way of looking at a thing'],
        ['introspection', 'looking at your own thoughts'], ['circumspect', 'looking around carefully']] },
    { root: 'ject', mean: 'throw', pre: ['in', 're', 'e', 'sub', 'pro', 'ob', 'tra', 'de', 'inter', 'con'], suf: ['s', 'ed', 'ing', 'ion', 'or', 'ive', 'ure'],
      words: [['inject', 'to put a liquid into the body'], ['reject', 'to say no; to throw back'], ['eject', 'to throw out'], ['subject', 'a topic; a school class'], ['project', 'a plan; a piece of work'], ['object', 'a thing; to say you do not agree'],
        ['trajectory', 'the path of a thing thrown'], ['dejected', 'sad, thrown down'], ['interject', 'to say something while others speak'], ['conjecture', 'a guess'], ['injection', 'a shot with a needle'], ['rejection', 'a no'],
        ['projector', 'a machine that throws images on a wall'], ['objective', 'a goal']] },
    { root: 'vis / vid', mean: 'see', pre: ['tele', 'pro', 're', 'super', 'in', 'e', 'pre', 'ad', 'inter', 'en'], suf: ['ion', 'ible', 'it', 'or', 'ual', 'e', 'ent', 'ence', 'eo', 'ed', 's'],
      words: [['vision', 'the power to see'], ['visible', 'that you can see'], ['invisible', 'that you cannot see'], ['visit', 'to go and see'], ['visitor', 'a person who comes to see'], ['visual', 'about seeing'], ['visualize', 'to see in your mind'],
        ['television', 'seeing from far away'], ['video', 'I see: a recording'], ['revise', 'to look again (to study)'], ['supervise', 'to watch over'], ['provide', 'to give what is needed'], ['evident', 'easy to see'], ['evidence', 'proof you can see'],
        ['preview', 'a look before'], ['review', 'a second look'], ['interview', 'a meeting to ask questions'], ['advise', 'to give an opinion'], ['envision', 'to imagine']] },
  ];

  // a layout: an array = one box (its words one under the other), {col: [...]} = boxes one under the other, {row: [...]} = side by side
  const mxSize = n => (Array.isArray(n) ? n.length : (n.col || n.row).reduce((t, x) => t + mxSize(x), 0));
  function mxNode(n) {
    if (Array.isArray(n)) return '<div class="mxb" style="flex:' + n.length + ' 1 0;--n:' + n.length + '">' + n.map(w => '<span>' + esc(w) + '</span>').join('') + '</div>';
    if (n.col) return '<div class="mxc">' + n.col.map(x => '<div class="mxi" style="flex:' + mxSize(x) + ' 1 0">' + mxNode(x) + '</div>').join('') + '</div>';
    return '<div class="mxr">' + n.row.map(x => '<div class="mxi" style="flex:1 1 0">' + mxNode(x) + '</div>').join('') + '</div>';
  }
  // matrices with no hand-made layout: the pieces are cut in a big box and two small ones
  function mxAuto(list) {
    const k = Math.ceil(list.length / 2), rest = list.slice(k);
    if (list.length <= 3) return list;
    if (rest.length < 2) return { col: [list.slice(0, k), rest] };
    const h = Math.ceil(rest.length / 2);
    return { col: [list.slice(0, k), { row: [rest.slice(0, h), rest.slice(h)] }] };
  }
  function matrixHtml(m) {
    return '<div class="tg-mx"><div class="tg-mx-side">' + mxNode(m.L || mxAuto(m.pre)) + '</div>' +
      '<div class="tg-mx-mid"><b>' + esc(m.root) + '</b><i>“' + esc(m.mean) + '”</i></div>' +
      '<div class="tg-mx-side">' + mxNode(m.R || mxAuto(m.suf)) + '</div></div>';
  }

  function matrixGame() {
    score.a = score.b = 0;
    let secs = 180;
    const start = () => {
      openGame('🧩 Word matrix', { scored: true, onBack: menu });
      area.innerHTML = '<div class="tg-card">' +
        '<p class="tg-intro">The board shows a <b>root</b> with <b>prefixes</b> (before) and <b>suffixes</b> (after). In the time you have, each team writes <b>real words</b> made with the pieces, <b>with their meaning</b>. The team with more correct words wins!</p>' +
        '<p class="tg-label">Choose a root</p><div class="tg-decks">' +
        MATRICES.map((m, i) => '<button type="button" class="tg-deck" data-m="' + i + '" style="--c:#8e2de2"><span class="tg-mx-root">' + esc(m.root) + '</span>“' + esc(m.mean) + '”<small>' + m.words.length + ' example words</small></button>').join('') +
        '</div><p class="tg-foot">Time <button type="button" data-s="120" class="' + (secs === 120 ? 'on' : '') + '">2 min</button><button type="button" data-s="180" class="' + (secs === 180 ? 'on' : '') + '">3 min</button><button type="button" data-s="300" class="' + (secs === 300 ? 'on' : '') + '">5 min</button><button type="button" data-s="480" class="' + (secs === 480 ? 'on' : '') + '">8 min</button></p></div>';
      area.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.s) { secs = +b.dataset.s; start(); } else if (b.dataset.m) play(MATRICES[+b.dataset.m]);
      };
    };
    const play = m => {
      openGame('🧩 Word matrix', { scored: true, onBack: start });
      let left = secs, state = 'ready', timer = null, show = false, a = 0, b = 0;
      cleanup = () => { clearInterval(timer); timer = null; };
      const mmss = t => Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
      const matrix = () => matrixHtml(m);
      const paint = () => {
        const clock = '<p class="tg-clock sm' + (state === 'run' && left <= 10 ? ' hot' : '') + (state === 'over' ? ' over' : '') + '">' + (state === 'over' ? 'Time!' : mmss(left)) + '</p>';
        let ctl = '';
        if (state === 'ready') ctl = '<div class="tg-row"><button type="button" class="tg-btn go" data-act="go">▶ Start (' + mmss(secs) + ')</button></div><p class="tg-help">Write on paper or on the board: <b>prefix + root + suffix</b> and what it means.</p>';
        else if (state === 'run') ctl = '<div class="tg-row"><button type="button" class="tg-btn alt" data-act="stop">■ Stop</button></div><p class="tg-help">Write words <b>with their meaning</b>. Only real words count!</p>';
        else ctl = '<p class="tg-help">Check the papers: count only <b>real words with the right meaning</b>.</p>' +
          '<div class="tg-count2"><div class="a"><b>Team A</b><p><button type="button" data-d="a-1">−</button><span>' + a + '</span><button type="button" data-d="a1">+1</button></p></div>' +
          '<div class="b"><b>Team B</b><p><button type="button" data-d="b-1">−</button><span>' + b + '</span><button type="button" data-d="b1">+1</button></p></div></div>' +
          '<div class="tg-row"><button type="button" class="tg-btn alt" data-act="reveal">' + (show ? 'Hide' : '👀 Show') + ' example words</button><button type="button" class="tg-btn go" data-act="bank">✔ Winner: ' + (a === b ? 'draw' : a > b ? 'Team A' : 'Team B') + ' · add to scores</button></div>' +
          (show ? '<ul class="tg-mx-words">' + m.words.map(([w, d]) => '<li><b>' + esc(w) + '</b> ' + esc(d) + '</li>').join('') + '</ul>' : '');
        area.innerHTML = '<div class="tg-round tg-mxbox">' + matrix() + clock + ctl + '</div>';
      };
      const tick = () => { left--; if (left <= 0) { left = 0; clearInterval(timer); timer = null; state = 'over'; beep(); } paint(); };
      area.onclick = e => {
        const t = e.target.closest('button'); if (!t) return;
        const d = t.dataset;
        if (d.act === 'go') { state = 'run'; left = secs; clearInterval(timer); timer = setInterval(tick, 1000); }
        else if (d.act === 'stop') { clearInterval(timer); timer = null; state = 'over'; }
        else if (d.act === 'reveal') show = !show;
        else if (d.act === 'bank') {
          if (a > b) score.a++; else if (b > a) score.b++; else { score.a++; score.b++; }
          paintScore(); state = 'ready'; left = secs; a = b = 0; show = false;
        } else if (d.d) { const k = d.d[0], v = +d.d.slice(1); if (k === 'a') a = Math.max(0, a + v); else b = Math.max(0, b + v); }
        paint();
      };
      paint();
    };
    start();
  }


  /* ---------- 📷 photo words (it was a scaffolding spread of Describing photos): a photo + 5 minutes, then bonus words ---------- */
  // Every word that is really in the photo is worth 1 point; "Reveal bonus" draws 2 words worth 3 points and 4 worth 2 points.
  // To add a photo: copy the image into img/wordrace/ and add an entry to PHOTOS (w = word, alt = also accepted).
  const PHOTOS = [ // p3 = rarer or harder words (3 points), p2 = medium words (2 points)
    {
      src: 'img/wordrace/festival.jpg', title: 'The festival',
      p3: [ { w: 'nurse' }, { w: 'costume', alt: 'uniform' }, { w: 'bucket hat' }, { w: 'mustache', alt: 'moustache' }, { w: 'tattoo' }, { w: 'fan' }, { w: 'afro' }, { w: 'heart' }, { w: 'peace sign', alt: 'victory sign' }, { w: 'festival', alt: 'concert' }, { w: 'fanny pack', alt: 'belt bag; bum bag' }, { w: 'bracelet', alt: 'wristband' }, { w: 'bun' }, { w: 'cross', alt: 'red cross' } ],
      p2: [ { w: 'cap' }, { w: 'sunglasses', alt: 'glasses' }, { w: 'beard' }, { w: 'beer', alt: 'cup' }, { w: 'watch' }, { w: 'necklace' }, { w: 'earrings', alt: 'earring' }, { w: 'bag', alt: 'backpack' }, { w: 'jeans' }, { w: 'belt' }, { w: 'phone' }, { w: 'T-shirt', alt: 'shirt' }, { w: 'jacket' }, { w: 'curly' }, { w: 'blonde' }, { w: 'crowd' }, { w: 'dancing' }, { w: 'smiling' }, { w: 'laughing' }, { w: 'drinking' }, { w: 'holding' }, { w: 'waving', alt: 'raising arms' }, { w: 'sunny' }, { w: 'crowded' }, { w: 'happy' }, { w: 'hair' }, { w: 'arms' }, { w: 'people' }, { w: 'man' }, { w: 'woman' } ],
    },
    {
      src: 'img/wordrace/street-vendor.jpg', title: 'The street',
      p3: [ { w: 'conical hat', alt: 'straw hat' }, { w: 'vendor', alt: 'seller' }, { w: 'basket' }, { w: 'scooter', alt: 'motorbike' }, { w: 'helmet' }, { w: 'traffic' }, { w: 'plastic bag' }, { w: 'handlebars' }, { w: 'sandals' }, { w: 'ponytail' }, { w: 'awning' }, { w: 'market' }, { w: 'oranges', alt: 'tangerines' } ],
      p2: [ { w: 'bike', alt: 'bicycle' }, { w: 'fruit' }, { w: 'hat' }, { w: 'shirt' }, { w: 'pants', alt: 'trousers' }, { w: 'bag' }, { w: 'motorcycle' }, { w: 'street', alt: 'road' }, { w: 'walking' }, { w: 'pushing' }, { w: 'riding' }, { w: 'carrying' }, { w: 'selling' }, { w: 'wheel' }, { w: 'tree' }, { w: 'people' }, { w: 'woman' }, { w: 'man' }, { w: 'red' }, { w: 'green' }, { w: 'busy' }, { w: 'crowded' }, { w: 'city' }, { w: 'sign' }, { w: 'orange' }, { w: 'yellow' } ],
    },
    {
      src: 'img/wordrace/school-kids.jpg', title: 'The school',
      p3: [ { w: 'uniform' }, { w: 'hijab', alt: 'headscarf' }, { w: 'backpack' }, { w: 'skirt' }, { w: 'pointing' }, { w: 'trophies', alt: 'cups; awards' }, { w: 'flower', alt: 'orchid' }, { w: 'badge' }, { w: 'shorts' }, { w: 'balcony' }, { w: 'courtyard', alt: 'school yard' }, { w: 'linking arms', alt: 'arm in arm' }, { w: 'display case', alt: 'cabinet' }, { w: 'socks' } ],
      p2: [ { w: 'children', alt: 'kids' }, { w: 'girl' }, { w: 'girls' }, { w: 'boy' }, { w: 'school' }, { w: 'smiling' }, { w: 'laughing' }, { w: 'walking' }, { w: 'looking' }, { w: 'shirt' }, { w: 'white' }, { w: 'red' }, { w: 'blue' }, { w: 'building' }, { w: 'wall' }, { w: 'friends' }, { w: 'happy' }, { w: 'hair' }, { w: 'bag' }, { w: 'shoes' }, { w: 'together' }, { w: 'tiles' }, { w: 'plants' } ],
    },
    {
      src: 'img/wordrace/restaurant.jpg', title: 'The restaurant',
      p3: [ { w: 'napkin' }, { w: 'bracelet' }, { w: 'ring' }, { w: 'cucumber' }, { w: 'carrot' }, { w: 'lemon' }, { w: 'olives' }, { w: 'leaves', alt: 'lettuce' }, { w: 'wine' }, { w: 'fork' }, { w: 'bowl' }, { w: 'wooden table', alt: 'wood' }, { w: 'sleeve' }, { w: 'vegetables' } ],
      p2: [ { w: 'salad' }, { w: 'plate' }, { w: 'glass' }, { w: 'eating' }, { w: 'food' }, { w: 'table' }, { w: 'hand' }, { w: 'women', alt: 'girls' }, { w: 'friends' }, { w: 'drinking' }, { w: 'holding' }, { w: 'red' }, { w: 'green' }, { w: 'white' }, { w: 'healthy' }, { w: 'delicious' }, { w: 'restaurant' }, { w: 'knife' }, { w: 'hair' }, { w: 'lunch', alt: 'dinner' }, { w: 'orange' }, { w: 'tasting' } ],
    },
    {
      src: 'img/wordrace/hotel.jpg', title: 'The hotel',
      p3: [ { w: 'receptionist', alt: 'reception' }, { w: 'snowboard' }, { w: 'goggles' }, { w: 'helmet' }, { w: 'waistcoat', alt: 'vest' }, { w: 'bow tie' }, { w: 'lamp', alt: 'light bulb' }, { w: 'clock' }, { w: 'flowers' }, { w: 'parka', alt: 'coat; fur hood' }, { w: 'beard' }, { w: 'ponytail' }, { w: 'sign' }, { w: 'desk' }, { w: 'plant' }, { w: 'guest', alt: 'tourist' } ],
      p2: [ { w: 'man' }, { w: 'woman' }, { w: 'coat' }, { w: 'jacket' }, { w: 'smiling' }, { w: 'talking' }, { w: 'pointing' }, { w: 'standing' }, { w: 'working' }, { w: 'light' }, { w: 'black' }, { w: 'white' }, { w: 'blue' }, { w: 'wall' }, { w: 'door' }, { w: 'books' }, { w: 'hotel' }, { w: 'hair' }, { w: 'hand' }, { w: 'people' }, { w: 'sports', alt: 'skiing' } ],
    },
    {
      src: 'img/wordrace/fashion-show.jpg', title: 'The fashion show',
      p3: [ { w: 'runway', alt: 'catwalk' }, { w: 'model' }, { w: 'dress' }, { w: 'audience' }, { w: 'spotlights', alt: 'lights' }, { w: 'screen' }, { w: 'handbag', alt: 'bag' }, { w: 'belt' }, { w: 'sleeves' }, { w: 'reflection' }, { w: 'camera' }, { w: 'stage' }, { w: 'fashion' }, { w: 'high heels', alt: 'shoes' }, { w: 'scarf' }, { w: 'glasses' } ],
      p2: [ { w: 'woman' }, { w: 'people' }, { w: 'red' }, { w: 'long' }, { w: 'night' }, { w: 'dark' }, { w: 'sitting' }, { w: 'standing' }, { w: 'walking' }, { w: 'watching' }, { w: 'taking photos' }, { w: 'phone' }, { w: 'smiling' }, { w: 'trees' }, { w: 'building' }, { w: 'black' }, { w: 'blue' }, { w: 'big' }, { w: 'beautiful' }, { w: 'photographer' } ],
    },
    {
      src: 'img/wordrace/cafe.jpg', title: 'The cafe',
      p3: [ { w: 'laptop' }, { w: 'headphones' }, { w: 'saucer' }, { w: 'tattoo' }, { w: 'notebook' }, { w: 'pendant lamp', alt: 'lamp' }, { w: 'hanging plants', alt: 'plants' }, { w: 'menu' }, { w: 'poster' }, { w: 'sweatshirt' }, { w: 'bench', alt: 'bench seat' }, { w: 'window', alt: 'big window' }, { w: 'curly' } ],
      p2: [ { w: 'cafe', alt: 'coffee shop' }, { w: 'coffee' }, { w: 'table' }, { w: 'chair' }, { w: 'cup' }, { w: 'plant' }, { w: 'phone' }, { w: 'reading' }, { w: 'working' }, { w: 'typing' }, { w: 'sitting' }, { w: 'drinking' }, { w: 'holding' }, { w: 'wearing' }, { w: 'sunny' }, { w: 'book' }, { w: 'woman' }, { w: 'man' }, { w: 'girl' }, { w: 'glasses' }, { w: 'hair' }, { w: 'light' }, { w: 'shirt' }, { w: 'people' }, { w: 'relaxed' }, { w: 'quiet' } ],
    },
  ];

  function photoGame() {
    openGame('📷 Photo words', { onBack: menu });
    const SECONDS = 300, N3 = 2, N2 = 4;
    let photo = 0, left = SECONDS, endAt = 0, timer = 0, revealed = false, cards = [];
    cleanup = () => { clearInterval(timer); timer = 0; };
    const fmt = t => Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
    const draw = () => {
      const t = $('tgPhTime'); if (!t) return;
      t.textContent = fmt(left);
      $('tgPhBar').style.transform = 'scaleX(' + (left / SECONDS) + ')';
      $('tgPhClock').className = 'tg-ph-clock' + (left <= 30 && left > 0 ? ' low' : '') + (left === 0 ? ' done' : '');
      $('tgPhReveal').classList.toggle('ready', left === 0 && !revealed);
    };
    const paint = () => {
      const p = PHOTOS[photo];
      area.innerHTML = '<div class="tg-ph"><div class="tg-ph-left">' +
        '<div class="tg-ph-pic"><img src="' + p.src + '" alt=""><button type="button" class="tg-ph-arrow prev" data-go="-1" aria-label="Previous photo">‹</button><button type="button" class="tg-ph-arrow next" data-go="1" aria-label="Next photo">›</button><span>' + (photo + 1) + ' / ' + PHOTOS.length + '</span></div>' +
        '<p class="tg-ph-task">Write as many words as you can about this photo!</p>' +
        '<p class="tg-help">Nouns, adjectives and <b>-ing</b> verbs, in the notebook. Every word you can see is worth <b>1 point</b>; the <b>bonus words</b> are worth 2 or 3.</p></div>' +
        '<div class="tg-ph-right"><div class="tg-ph-clock" id="tgPhClock"><div id="tgPhTime">5:00</div><div class="tg-ph-bar"><i id="tgPhBar"></i></div></div>' +
        '<div class="tg-row" style="margin-top:0"><button type="button" class="tg-btn go" id="tgPhStart" data-act="start">' + (timer ? '⏸ Pause' : left === SECONDS ? '▶ Start' : left === 0 ? '▶ Start' : '▶ Continue') + '</button><button type="button" class="tg-btn alt" data-act="reset">↺ 5:00</button></div>' +
        '<button type="button" class="tg-btn tg-ph-reveal" id="tgPhReveal" data-act="reveal"' + (revealed ? ' disabled' : '') + '>⭐ Reveal bonus</button>' +
        '<div class="tg-ph-bonus">' + cards.map((c, i) => '<div class="tg-ph-card p' + c.pts + '" style="animation-delay:' + i * .45 + 's"><em>' + c.pts + '</em><b>' + esc(c.w) + '</b>' + (c.alt ? '<small>also: ' + esc(c.alt) + '</small>' : '') + '</div>').join('') + '</div>' +
        '<div class="tg-row" style="margin-top:0"><button type="button" class="tg-btn alt" data-act="new">New words</button></div></div></div>';
      draw();
    };
    const stopClock = () => { clearInterval(timer); timer = 0; };
    const run = () => {
      if (left === 0) left = SECONDS;
      endAt = Date.now() + left * 1000;
      timer = setInterval(() => {
        left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        draw();
        if (left === 0) { stopClock(); beep(); paint(); }
      }, 250);
    };
    const show = i => { stopClock(); photo = (i + PHOTOS.length) % PHOTOS.length; left = SECONDS; revealed = false; cards = []; paint(); };
    const pick = (arr, n) => shuffle(arr).slice(0, n);
    area.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset;
      if (d.go) show(photo + +d.go);
      else if (d.ph) show(+d.ph);
      else if (d.act === 'start') { if (timer) { left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000)); stopClock(); } else run(); paint(); }
      else if (d.act === 'reset') { stopClock(); left = SECONDS; paint(); }
      else if (d.act === 'reveal' && !revealed) {
        revealed = true; const p = PHOTOS[photo];
        cards = [...pick(p.p3, N3).map(x => ({ ...x, pts: 3 })), ...pick(p.p2, N2).map(x => ({ ...x, pts: 2 }))];
        paint();
      } else if (d.act === 'new') show(photo);
    };
    paint();
  }


  /* ---------- 🎡 word wheel: letters in a circle, words with the middle letter; the team with more words wins ---------- */
  // ring = the outer letters, mid = the middle letter, big = the long word hidden in the letters (shown at the end),
  // words = examples for the teacher (every one is made only from the letters and has the middle letter)
  const WHEELS = [
    { big: 'CLIMATE', ring: 'CLIMTE', mid: 'A', words: 'ace act aim ail ale ate cat cam eat mat mac tea tam lac acme mail male meal mate meat team tame tail tale late teal calm clam claim metal camel malice email mica malt climate'.split(' ') },
    { big: 'TEACHER', ring: 'TEHCER', mid: 'A', words: 'tea eat ate ear era are art rat tar car arc ace act cat hat hate heat hare hear heart earth ache each reach teach cheat chart trace crate react cater create eater reheat hater cheater teacher'.split(' ') },
    { big: 'CHRISTMAS', ring: 'CTRHSIM', mid: 'A', words: 'art arc air rat tar car cat chat cast cash mat mash mast harm hams chart charm march match chair stair trash starch chasm smart marsh charts charms'.split(' ') },
    { big: 'HOLIDAYS', ring: 'HOLIDYS', mid: 'A', words: 'aid ail aids ash lad lay day has hay say sad lady dash hail halo hails also daily dial dials sail slay soda dais lash days holidays'.split(' ') },
    { big: 'ADVENTURE', ring: 'DVENTURE', mid: 'A', words: 'and ant art are ate ear eat era ran rat tan tar tea date dare dear read near neat tear aunt tuna trade tread nature avenue adventure'.split(' ') },
    { big: 'BIRTHDAY', ring: 'BIRTHDY', mid: 'A', words: 'bad bar bat day had hat hay ray art air aid bait bard dairy bath bay birthday hairy hard dray yard'.split(' ') },
  ];
  // can this word be made from the letters (each letter once, the middle letter inside)?
  const wheelOk = (w, wh) => {
    w = w.toUpperCase().replace(/[^A-Z]/g, '');
    if (w.length < 3 || !w.includes(wh.mid)) return false;
    const pool = (wh.ring + wh.mid).split('');
    return [...w].every(ch => { const i = pool.indexOf(ch); if (i < 0) return false; pool.splice(i, 1); return true; });
  };

  function wheelGame() {
    score.a = score.b = 0;
    let secs = 180, idx = 0;
    const play = () => {
      const wh = WHEELS[idx];
      openGame('🎡 Word wheel', { scored: true, onBack: menu });
      let left = secs, state = 'ready', timer = null, show = false, a = 0, b = 0, ring = shuffle(wh.ring.split('')), tilt = ring.map(() => Math.round((Math.random() - .5) * 40)), check = null;
      cleanup = () => { clearInterval(timer); timer = null; };
      const mmss = t => Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
      const wheel = () => {
        const n = ring.length;
        return '<div class="tg-wh-row"><button type="button" class="tg-ph-arrow2" data-go="-1" aria-label="Previous wheel">‹</button><div class="tg-wh">' + ring.map((ch, i) => {
          const t = i / n * 2 * Math.PI;
          return '<b style="left:' + (50 + 41 * Math.sin(t)).toFixed(1) + '%;top:' + (50 - 41 * Math.cos(t)).toFixed(1) + '%;transform:translate(-50%,-50%) rotate(' + tilt[i] + 'deg)">' + ch + '</b>';
        }).join('') + '<b class="mid">' + wh.mid + '</b></div><button type="button" class="tg-ph-arrow2" data-go="1" aria-label="Next wheel">›</button></div><p class="tg-help">Wheel ' + (idx + 1) + ' / ' + WHEELS.length + '</p>';
      };
      const paint = () => {
        const clock = '<p class="tg-clock sm' + (state === 'run' && left <= 10 ? ' hot' : '') + (state === 'over' ? ' over' : '') + '">' + (state === 'over' ? 'Time!' : mmss(left)) + '</p>';
        let ctl = '';
        if (state === 'ready') ctl = '<div class="tg-row"><button type="button" class="tg-btn go" data-act="go">▶ Start (' + mmss(secs) + ')</button><button type="button" class="tg-btn alt" data-act="shuffle">🔀 Shuffle the letters</button></div><p class="tg-foot">Time <button type="button" data-s="120" class="' + (secs === 120 ? 'on' : '') + '">2 min</button><button type="button" data-s="180" class="' + (secs === 180 ? 'on' : '') + '">3 min</button><button type="button" data-s="300" class="' + (secs === 300 ? 'on' : '') + '">5 min</button></p>';
        else if (state === 'run') ctl = '<div class="tg-row"><button type="button" class="tg-btn alt" data-act="stop">■ Stop</button></div><p class="tg-help">Words of 3+ letters with the <b>middle letter</b>. Only real words count!</p>';
        else ctl = '<p class="tg-help">Check the papers: count only <b>real words</b> made with the letters.</p>' +
          '<div class="tg-count2"><div class="a"><b>Team A</b><p><button type="button" data-d="a-1">−</button><span>' + a + '</span><button type="button" data-d="a1">+1</button></p></div>' +
          '<div class="b"><b>Team B</b><p><button type="button" data-d="b-1">−</button><span>' + b + '</span><button type="button" data-d="b1">+1</button></p></div></div>' +
          '<form class="tg-check" data-act="check"><input id="tgWord" autocomplete="off" placeholder="Check a word…" aria-label="Check a word"><button type="submit" class="tg-btn alt">Check</button>' + (check ? '<span class="' + (check.ok ? 'ok' : 'no') + '">' + (check.ok ? '✔ ' + esc(check.w) + ': the letters are right' : '✖ ' + esc(check.w) + ': not with these letters') + '</span>' : '') + '</form>' +
          '<div class="tg-row"><button type="button" class="tg-btn alt" data-act="reveal">' + (show ? 'Hide' : '👀 Show') + ' example words</button><button type="button" class="tg-btn go" data-act="bank">✔ Winner: ' + (a === b ? 'draw' : a > b ? 'Team A' : 'Team B') + ' · add to scores</button></div>' +
          (show ? '<p class="tg-help">The long word: <b>' + wh.big + '</b></p><ul class="tg-mx-words tg-wh-words">' + wh.words.map(w => '<li>' + esc(w) + '</li>').join('') + '</ul>' : '');
        area.innerHTML = '<div class="tg-round">' + wheel() + clock + ctl + '</div>';
      };
      const tick = () => { left--; if (left <= 0) { left = 0; clearInterval(timer); timer = null; state = 'over'; beep(); } paint(); };
      area.onsubmit = e => { e.preventDefault(); const w = $('tgWord').value.trim(); if (w) { check = { w, ok: wheelOk(w, wh) }; paint(); $('tgWord').focus(); } };
      area.onclick = e => {
        const t = e.target.closest('button'); if (!t || t.type === 'submit') return;
        const d = t.dataset;
        if (d.go) { idx = (idx + +d.go + WHEELS.length) % WHEELS.length; play(); return; }
        if (d.s) { secs = +d.s; play(); return; }
        if (d.act === 'go') { state = 'run'; left = secs; clearInterval(timer); timer = setInterval(tick, 1000); }
        else if (d.act === 'shuffle') { ring = shuffle(ring); tilt = ring.map(() => Math.round((Math.random() - .5) * 40)); }
        else if (d.act === 'stop') { clearInterval(timer); timer = null; state = 'over'; }
        else if (d.act === 'reveal') show = !show;
        else if (d.act === 'bank') {
          if (a > b) score.a++; else if (b > a) score.b++; else { score.a++; score.b++; }
          paintScore(); state = 'ready'; left = secs; a = b = 0; show = false; check = null; ring = shuffle(ring); tilt = ring.map(() => Math.round((Math.random() - .5) * 40));
        } else if (d.d) { const k = d.d[0], v = +d.d.slice(1); if (k === 'a') a = Math.max(0, a + v); else b = Math.max(0, b + v); }
        paint();
      };
      paint();
    };
    play();
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
  // the topics in the order they are taught at school (1st year → 3rd year)
  const HOT_ORDER = ['Greek mythology', 'Alice in Wonderland', 'Matilda & Coraline', 'Romeo & Juliet', 'Shakespeare & sonnets', 'Figures of speech', 'Animal Farm', '1984',
    'Countries & places', 'Animals', 'Home', 'Sports & hobbies', 'Emotions', 'Clothes', 'Food', 'Jobs'];
  HOT.sort((a, b) => HOT_ORDER.indexOf(a.title) - HOT_ORDER.indexOf(b.title));

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

  /* ---------- 🏀 paper basket: write on a slip of paper, crumple it, shoot! (data: basket-data.js) ---------- */
  function basketGame() {
    score.a = score.b = 0;
    const SETS = window.BASKET_SETS || [];
    const KINDS = ['Paradigms', 'Words IT → EN', 'Words EN → IT', 'Phrases IT → EN'];
    const start = () => {
      openGame('🏀 Paper basket', { onBack: menu });
      const chosen = new Set();
      const kinds = [...new Set(SETS.map(s => s.kind))].sort((a, b) => KINDS.indexOf(a) - KINDS.indexOf(b));
      area.innerHTML = `<div class="tg-card">
        <p class="tg-intro">The board shows a question. <b>Every pupil writes the answer on a slip of paper</b>, crumples it and <b>shoots it into the basket</b> (a bin, a box…) before the time is over! Check the papers with the answer, then give a point to the team.</p>
        <p class="tg-label">Choose a set <small>(or more than one: they get mixed)</small></p>
        ${kinds.map(k => `<p class="tg-label">${esc(k)}</p><div class="tg-decks">${SETS.filter(s => s.kind === k).map(s => `<button type="button" class="tg-deck" data-d="${s.id}" style="--c:${s.color}"><span>${s.icon}</span>${esc(s.title)}<small>${s.items.length} cards · ${s.secs} s</small></button>`).join('')}</div>`).join('')}
        <div class="tg-row"><button type="button" class="tg-btn" id="tgDeckGo" disabled>Choose a set first</button></div></div>`;
      const go = $('tgDeckGo');
      area.onclick = e => {
        const b = e.target.closest('.tg-deck');
        if (b) {
          const id = b.dataset.d;
          chosen.has(id) ? chosen.delete(id) : chosen.add(id);
          b.classList.toggle('on', chosen.has(id));
          go.disabled = !chosen.size;
          go.textContent = chosen.size ? `▶ Play (${chosen.size} set${chosen.size > 1 ? 's' : ''})` : 'Choose a set first';
        } else if (e.target === go && chosen.size) play(SETS.filter(s => chosen.has(s.id)));
      };
    };
    const play = sets => {
      openGame('🏀 Paper basket', { scored: true, onBack: start });
      const cards = sets.flatMap(s => s.items.map(([q, a, pill, fam]) => ({ q, a, pill, fam, s })));
      const nextCard = bag(cards);
      let r, left = 0, timer = null;
      cleanup = () => { clearInterval(timer); timer = null; };
      const next = () => {
        const c = nextCard();
        r = { c, state: 'write', show: false, point: false };
        left = c.s.secs;
        clearInterval(timer); timer = setInterval(tick, 1000);
        paint();
      };
      const tick = () => {
        left--;
        if (left <= 0) { left = 0; clearInterval(timer); timer = null; r.state = 'shoot'; beep(); }
        paint();
      };
      const paint = () => {
        const c = r.c, writing = r.state === 'write';
        area.innerHTML = `<div class="tg-round">
          <p class="tg-deckname" style="--c:${c.s.color}">${c.s.icon} ${esc(c.pill || c.s.hint)}</p>
          <p class="tg-prompt${c.q.length > 28 ? ' long' : ''}">${esc(c.q)}</p>
          <p class="tg-clock sm${writing && left <= 5 ? ' hot' : ''}${r.state === 'shoot' ? ' over' : ''}">${writing ? left : '🏀 Shoot!'}</p>
          <p class="tg-help">${writing ? '✍️ Write the answer on your paper…' : 'Paper down, crumple it and shoot it into the basket!'}${writing && c.fam && left <= 8 ? `<br><b>${esc(c.fam)}</b>` : ''}</p>
          <p class="tg-answer">${r.show ? '💡 ' + esc(c.a) : '<button type="button" class="tg-link" data-act="show">💡 Show the answer</button>'}</p>
          ${pointButtons(r.point)}
          <div class="tg-row"><button type="button" class="tg-btn alt" data-act="skip">⏭ Skip</button><button type="button" class="tg-btn go" data-act="next">Next question ▶</button></div>
          <p class="tg-foot"><button type="button" class="tg-link" data-act="reset">↺ new game (scores to 0)</button></p></div>`;
      };
      area.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.t) { givePoint(b.dataset.t, r); paint(); }
        else if (b.dataset.act === 'show') { r.show = true; clearInterval(timer); timer = null; if (r.state === 'write') r.state = 'shoot'; paint(); }
        else if (b.dataset.act === 'next' || b.dataset.act === 'skip') next();
        else if (b.dataset.act === 'reset') { score.a = score.b = 0; paintScore(); next(); }
      };
      next();
    };
    start();
  }

  /* ---------- the tiles: they are in the "For the teacher" part of the home page (script.js renderHome), before the guided meditations ---------- */
  const ENTRIES = [
    { icon: '🧰', title: 'Class tools', color: '#1f2a6b', text: 'Who goes next? · groups · timer · scoreboard.', run: toolsGame },
    { icon: '🔥', title: 'Hot seat', color: '#d6334f', text: 'A pupil guesses the word the class explains: literature of the book and vocabulary, you choose the topics.', run: hotGame },
    { icon: '🚩', title: 'Flag game', color: '#f05f4b', text: 'Bandierina: two teams, a number, a card on the board. Pronouns, to be, verbs, jobs…', run: flagGame },
    { icon: '🏀', title: 'Paper basket', color: '#8e2de2', text: 'The class writes the answer on a paper, crumples it and shoots: verb paradigms, words and phrases to translate, at every level.', run: basketGame },
    { icon: '🅰️', title: 'Four corners', color: '#3aa04a', text: 'A question and A-B-C-D: the class walks to the right corner of the room.', run: cornersGame },
    { icon: '👋', title: 'Slap the word', color: '#4aa8ec', text: 'Six words on the board, two players: slap the right one first!', run: slapGame },
    { icon: '⏱', title: 'Beat the clock', color: '#f9b11a', text: 'A topic and 30 seconds: how many words can your team say?', run: clockGame },
    { icon: '🧩', title: 'Word matrix', color: '#8e2de2', text: 'A root with prefixes and suffixes: which team writes more real words, with their meaning?', run: matrixGame },
    { icon: '🎡', title: 'Word wheel', color: '#12a4a4', text: 'Letters in a circle: which team finds more words with the middle letter?', run: wheelGame },
    { icon: '📷', title: 'Photo words', color: '#46d9c0', text: 'A photo and 5 minutes: write words about it. Then bonus words worth 2 or 3 points.', run: photoGame },
    { icon: '🏁', title: 'Grammar Race', color: '#8e2de2', text: 'Timed race for the whole class: needs the pupils’ own devices.', run: () => window.GRAMMAR_RACE?.open?.() },
  ];
  function menu() {
    stop();
    close();
  }
  // HTML of the tiles for the home page: a small heading, the games, a heading for the materials that follow
  const tiles = () => `<h4 class="tg-sub">🎮 Games for the teacher <small>whiteboard (LIM) or phone · no pupil devices needed</small></h4>
    <div class="tg-pills">${ENTRIES.map((g, i) => `<button type="button" class="tg-tile" data-i="${i}" style="--c:${g.color}" title="${esc(g.text.replace(/&amp;/g, '&'))}">${g.icon} ${esc(g.title)}</button>`).join('')}</div>
    <h4 class="tg-sub">📄 Materials</h4>`;
  // the entry of the index on the left: a folder with the games inside
  const toc = open => `<details class="toc-ch" data-ch="Games for the teacher" style="--c:#d6334f"${open ? ' open' : ''}>
    <summary><i class="toc-dot"></i><span>Games for the teacher</span><small>${ENTRIES.length}</small></summary>
    <ul>${ENTRIES.map((g, i) => `<li><a href="#" data-tg="${i}"><b>${g.icon}</b><span>${esc(g.title)}</span></a></li>`).join('')}</ul></details>`;
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-tg-game]');
    if (g) { e.preventDefault(); ENTRIES.find(x => x.title === g.dataset.tgGame)?.run(); return; }
    const l = e.target.closest('a[data-tg]');
    if (l) { e.preventDefault(); ENTRIES[+l.dataset.tg]?.run(); return; }
    const t = e.target.closest('.tg-tile'); if (t) ENTRIES[+t.dataset.i]?.run();
  });
  window.TEACHER_GAMES = { open: i => ENTRIES[i]?.run(), decks: DECKS, hot: HOT, tiles, toc };
  // script.js drew the home page before this file was loaded: draw the teacher's part again
  if (typeof isTeacher === 'function' && isTeacher() && typeof renderHome === 'function') renderHome();
})();
