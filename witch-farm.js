// Witch hunt (CLIL, p. 166-167, card of the Farmer): "Village Farm", a farming game for the PC (pop-up, against the computer).
// The pupil is a peasant who does NOT own the land and saves coins to buy a piece of land of his or her own (GOAL). A bit of strategy:
//  · Every spring the trader asks 4 grammar questions (A1, Middle Ages: verbs in year 1, pronouns in year 2, possessives and object pronouns later).
//    Every right answer = one more kind of seed to buy (chosen by the pupil); the cheapest seed (wheat) is always for sale: with 0 right answers it is the only one.
//  · Every plant has its own traits (PLANTS): price of the seed, price at the market, water it needs, tender (dies in frost) or hardy,
//    drought-proof, rots when it is wet. The market price changes every year (common = cheap, rare = dear) and many plants of the same
//    kind lower their own price (glut). So: which plants to buy, how many, where.
//  · The weather of the year is hidden (WEATHER): the old shepherd gives a forecast that is right 7 times out of 10. Dry summer = plants need
//    1 more drop; wet summer = some plants rot; cold = frost kills the tender ones (seen only in autumn).
//  · Every year: spring (new seeds, choose and sow) → summer (rain: click the words of the cloud's category, +1 water; a wrong word = mud −1)
//    → autumn (harvest, sell, taxes: Lord 35%, Church 10%, mill and oven 5%: the farmer keeps half, as on the page).
// The harvest is automatic for now: when the harvesting mini-game is ready, it goes in market() instead of the line marked HARVEST.
// Online (two devices, one 4-letter code, book.rooms of cloud.js): both players get exactly the same weather, prices, questions and raindrops
// (everything random comes from a shared seed); a year ends when both have finished it; the first to buy the land wins.
// Opened by a button with data-wh="farm" (page of the Farmer).

(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = (a, rnd = Math.random) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const pick = (a, rnd = Math.random) => a[Math.floor(rnd() * a.length)];
  const store = (k, v) => { try { saved[k] = v; persist(); } catch { /* script.js not ready: skip */ } };
  const recall = k => { try { return saved[k]; } catch { return undefined; } };

  const GOAL = 50;                       // coins to buy the land
  const START = 10;                      // coins at the beginning
  const N = 9;                           // plots of the field
  const MAXNEED = 4;
  const TAXES = [
    { ico: '🏰', name: 'Rent to the Lord', pct: 35 },
    { ico: '⛪', name: 'Tithe to the Church', pct: 10 },
    { ico: '🍞', name: 'Mill and oven', pct: 5 },
  ];
  const SEASON = { quiz: '🌱 Spring · the trader', sow: '🌱 Spring · sowing', rain: '🌧 Summer · rain', market: '🧺 Autumn · harvest and taxes' };

  // cost = price of the seed, price = coins of a full crop, need = drops of water, tender = dies in frost, dry = drought-proof, wet = rots when wet
  const PLANTS = [
    { id: 'wheat', n: 'wheat', e: '🌾', cost: 1, price: 4, need: 2, tender: false, dry: true, wet: false },
    { id: 'carrot', n: 'carrot', e: '🥕', cost: 1, price: 6, need: 2, tender: false, dry: false, wet: false },
    { id: 'onion', n: 'onion', e: '🧅', cost: 1, price: 6, need: 1, tender: false, dry: false, wet: true },
    { id: 'garlic', n: 'garlic', e: '🧄', cost: 1, price: 8, need: 1, tender: false, dry: true, wet: true },
    { id: 'cabbage', n: 'cabbage', e: '🥬', cost: 1, price: 6, need: 2, tender: false, dry: false, wet: false },
    { id: 'beans', n: 'beans', e: '🫘', cost: 1, price: 6, need: 2, tender: true, dry: false, wet: false },
    { id: 'strawberry', n: 'strawberry', e: '🍓', cost: 2, price: 12, need: 3, tender: true, dry: false, wet: true },
    { id: 'grapes', n: 'grapes', e: '🍇', cost: 3, price: 14, need: 2, tender: true, dry: true, wet: false },
    { id: 'apple', n: 'apple', e: '🍎', cost: 3, price: 12, need: 3, tender: false, dry: false, wet: false },
    { id: 'pear', n: 'pear', e: '🍐', cost: 3, price: 12, need: 2, tender: true, dry: true, wet: false },
    { id: 'cherry', n: 'cherry', e: '🍒', cost: 3, price: 14, need: 2, tender: true, dry: false, wet: true },
    { id: 'peach', n: 'peach', e: '🍑', cost: 4, price: 16, need: 3, tender: true, dry: false, wet: false },
  ];
  const BY = Object.fromEntries(PLANTS.map(p => [p.id, p]));

  // the weather of the year (hidden) and what the old shepherd says about it
  const WEATHER = {
    mild: { w: 35, say: ['The swallows fly high and the sky is clear. A kind year.', 'The sunsets are red and calm. Nothing bad is coming.'] },
    cold: { w: 22, say: ['The geese are flying south very early. A cold winter is coming!', 'The sheep have thick wool this year. Frost will come early.'] },
    dry: { w: 23, say: ['The river is low and the ground is hard. There will be little rain.', 'No clouds for weeks… The summer will be dry.'] },
    wet: { w: 20, say: ['The frogs are singing loudly. There will be a lot of rain and mud.', 'The swallows fly very low. A wet summer is coming.'] },
  };
  const MARKET = { common: { m: .6, tx: 'common · cheap' }, normal: { m: 1, tx: 'normal' }, rare: { m: 1.5, tx: 'rare · dear' } };

  // the clouds: every word belongs to ONE category only
  const CATS = {
    vegetables: { label: 'Vegetables', words: ['carrot', 'onion', 'garlic', 'cabbage', 'turnip', 'leek', 'bean', 'pea', 'lettuce', 'radish', 'cucumber', 'spinach'] },
    fruit: { label: 'Fruit', words: ['apple', 'pear', 'plum', 'cherry', 'grape', 'peach', 'fig', 'strawberry', 'lemon', 'melon', 'orange'] },
    tools: { label: 'Farm tools', words: ['plough', 'spade', 'rake', 'hoe', 'sickle', 'scythe', 'pitchfork', 'bucket', 'shovel', 'axe', 'hammer', 'wheelbarrow'] },
    animals: { label: 'Farm animals', words: ['cow', 'pig', 'sheep', 'goat', 'horse', 'hen', 'duck', 'goose', 'ox', 'donkey', 'rooster', 'rabbit'] },
    weather: { label: 'Weather', words: ['rain', 'snow', 'wind', 'sun', 'storm', 'fog', 'cloud', 'frost', 'hail', 'thunder', 'rainbow'] },
  };
  const CAT_OF = {};
  Object.entries(CATS).forEach(([k, c]) => c.words.forEach(w => { CAT_OF[w] = k; }));

  /* ---------- the pop-up ---------- */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="gq-overlay wh-modal fv-modal" id="whFarmModal" role="dialog" aria-modal="true" aria-labelledby="fvTitle" hidden>
      <div class="gq-box wg-box">
        <div class="gq-top">
          <span class="gq-title" id="fvTitle">Village Farm</span>
          <span class="gq-score" id="fvScore"></span>
          <button type="button" class="gq-close" id="fvClose" aria-label="Close">✕</button>
        </div>
        <div class="gq-area wg-area" id="fvArea"></div>
      </div>
    </div>`);
  const modal = $('whFarmModal'), area = $('fvArea');

  let year = 1, coins = 0, avail = new Set(), weather = 'mild', forecast = null, prices = {}, sel = null;
  let field = [], quiz = [], qi = 0, score = 0, used = new Set(), water = 0, phase = 'closed', raf = 0, run = 0;
  let net = null, lastEnd = 0, pushT = 0, lastSched = null;      // net: the room when two devices play (see "online")

  const later = (ms, fn) => { const r = run; setTimeout(() => { if (r === run && phase !== 'closed') fn(); }, ms); };
  const needOf = p => (weather === 'dry' && !p.dry) ? Math.min(MAXNEED, p.need + 1) : p.need;
  const priceOf = p => Math.round(p.price * MARKET[prices[p.id]].m);
  const planted = () => field.filter(x => x.p);

  /* ---------- the frame: status bar, field, panel ---------- */
  function shell() {
    area.innerHTML = `<div class="fv">
      <div class="fv-top" id="fvTop"></div>
      <div class="fv-left"><div class="fv-field" id="fvField"></div><p class="fv-legend" id="fvLegend"></p></div>
      <div class="fv-panel" id="fvPanel"></div></div>`;
    $('fvField').addEventListener('click', e => { const el = e.target.closest('.fv-plot'); if (el) onPlot(+el.dataset.i); });
  }
  const panel = html => { $('fvPanel').innerHTML = html; };
  const legend = t => { $('fvLegend').innerHTML = t; };
  const oppChip = () => {
    if (!net) return '';
    const m = net.room?.fm || {}, p = m['p' + (1 - net.me)], n = esc(m['n' + (1 - net.me)] || 'Friend');
    return `<span class="fv-chip opp">🧑 ${n}: ${p ? `${p.c} 🪙 · year ${p.y}${SEASON[p.st] ? ' · ' + SEASON[p.st].replace(/^\S+ /, '') : ''}` : 'getting ready…'}</span>`;
  };
  function renderTop() {
    const pct = Math.min(100, Math.round(coins / GOAL * 100));
    $('fvTop').innerHTML = `<span class="fv-chip">📅 Year ${year}</span><span class="fv-chip season">${SEASON[phase] || SEASON.sow}</span>
      <span class="fv-chip coin">👛 ${coins} coin${coins === 1 ? '' : 's'}</span>${oppChip()}
      <div class="fv-goal" aria-label="Coins for your land"><i style="width:${pct}%"></i><b>🏡 Your own land: ${GOAL} coins</b></div>`;
  }
  function top() { renderTop(); schedulePush(); }
  function drawField(final) {
    $('fvField').innerHTML = field.map((x, i) => {
      if (!x.p) return `<div class="fv-plot empty ${phase === 'sow' && sel ? 'can' : ''}" data-i="${i}"><span class="ic"></span></div>`;
      const need = needOf(x.p);
      let ico, cls;
      if (phase === 'sow' || phase === 'quiz') { ico = x.p.e; cls = 'young'; }
      else if (final) { ico = x.w >= need ? x.p.e : x.w > 0 ? '🌿' : '🥀'; cls = x.w >= need ? 'ripe' : ''; }
      else { ico = x.w >= need ? x.p.e : x.w > 0 ? '🌿' : '🌱'; cls = x.w >= need ? 'ripe' : ''; }
      const dots = phase === 'rain' || phase === 'market' ? `<span class="fv-w">${'💧'.repeat(Math.min(x.w, need))}${'<i>◌</i>'.repeat(Math.max(0, need - x.w))}</span>` : '';
      return `<div class="fv-plot ${cls}" data-i="${i}"><span class="ic">${ico}</span>${dots}</div>`;
    }).join('');
  }

  /* ---------- start ---------- */
  function intro() {
    netLeave(); phase = 'sow'; year = 1; coins = START; avail = new Set(); used = new Set(); run++; sel = null; cancelAnimationFrame(raf);
    shell(); top(); field = Array.from({ length: N }, () => ({ p: null, w: 0 })); drawField(); legend('');
    panel(`<div class="fv-say">
      <h4>You are a peasant</h4>
      <p>You work the land, but the land is <b>not yours</b>: it belongs to the Lord. Every year you pay <b>taxes</b> and you keep only about half of what you sell.</p>
      <p><b>Your dream:</b> save <b>${GOAL} coins</b> and buy a piece of land of your own.</p>
      <ol class="fv-steps">
        <li><span>🌱</span><div><b>Spring</b> — the trader asks you <b>4 grammar questions</b>. Every right answer gives you <b>one more kind of seed</b>. Then choose <b>what to plant</b>.</div></li>
        <li><span>🌧</span><div><b>Summer</b> — catch the <b>raindrops</b> with words of the category in the cloud.</div></li>
        <li><span>🧺</span><div><b>Autumn</b> — sell the harvest and <b>pay the taxes</b>. Beware of the weather and of the prices!</div></li>
      </ol>
      <div class="wg-btns"><button type="button" class="wg-btn good" id="fvGo">▶ Start the first year</button><button type="button" class="wg-btn" id="fvOnline">👥 Play with a friend</button></div></div>`);
    $('fvGo').addEventListener('click', startYear);
    $('fvOnline').addEventListener('click', () => netMenu());
  }

  function startYear() {
    run++; water = 0; sel = null;
    // the weather (the first year is a kind one) and what the shepherd says
    const rw = rngFor('w'), roll = Object.entries(WEATHER);
    const x = rw() * 100, right = rw() < .7, other = rw(), say = rw(), price = PLANTS.map(() => rw());
    weather = year === 1 ? 'mild' : (() => { let r = x; for (const [k, v] of roll) { r -= v.w; if (r < 0) return k; } return 'mild'; })();
    const wrong = Object.keys(WEATHER).filter(k => k !== weather);
    const said = year === 1 || right ? weather : wrong[Math.floor(other * wrong.length)];
    forecast = { text: WEATHER[said].say[Math.floor(say * WEATHER[said].say.length)], said };
    // the prices of the year
    prices = {}; PLANTS.forEach((p, i) => { const r = price[i]; prices[p.id] = year === 1 ? 'normal' : r < .22 ? 'common' : r < .44 ? 'rare' : 'normal'; });
    if (coins < 3) coins = 3;                      // the monks give some coins to a poor farmer: you can always plant something
    field = Array.from({ length: N }, () => ({ p: null, w: 0 }));
    phase = 'quiz'; top(); drawField(); makeQuiz(); nextQ();
  }

  /* ---------- 1. spring: the trader asks grammar questions; every right answer = one more kind of seed ---------- */
  // [sentence, right word, wrong, wrong, why]: A1, Middle Ages. Level 1 (year 1) verbs; level 2 (year 2) subject pronouns; level 3 (year 3+) possessives and object pronouns.
  const Q1 = [
    ['The lord ___ rich and he lives in a castle.', 'is', 'are', 'am', 'He / she / it → is.'],
    ['The peasants ___ poor.', 'are', 'is', 'am', 'They → are.'],
    ['I ___ a farmer.', 'am', 'is', 'are', 'I → am.'],
    ['The farmer ___ a plough.', 'has', 'have', 'is', 'He / she / it → has.'],
    ['The knights ___ big swords.', 'have', 'has', 'are', 'They → have.'],
    ['The monks ___ in a monastery.', 'live', 'lives', 'living', 'They → live (no -s).'],
    ['The baker ___ bread every morning.', 'makes', 'make', 'making', 'He / she / it → verb + s.'],
    ['We ___ in the fields all day.', 'work', 'works', 'working', 'We → work (no -s).'],
    ['A knight ___ ride a horse.', 'can', 'cans', 'is', '“Can” never takes -s.'],
    ['___ the miller grind the wheat?', 'Does', 'Do', 'Is', 'Questions: he / she / it → Does.'],
    ['The cows ___ in the field.', 'are', 'is', 'am', 'They → are.'],
    ['There ___ a church in the village.', 'is', 'are', 'has', 'One church → there is.'],
    ['The queen ___ a golden crown.', 'wears', 'wear', 'wearing', 'He / she / it → verb + s.'],
    ['The children ___ go to school. They work.', 'don’t', 'doesn’t', 'isn’t', 'They → don’t.'],
    ['The blacksmith ___ work on Sunday.', 'doesn’t', 'don’t', 'isn’t', 'He / she / it → doesn’t.'],
  ];
  const Q2 = [
    ['Anna is a farmer. ___ grows carrots.', 'She', 'He', 'It', 'Anna is a woman → she.'],
    ['The knights are strong. ___ have swords.', 'They', 'He', 'We', 'More than one person → they.'],
    ['I have a horse. ___ is brown.', 'It', 'He', 'She', 'An animal or a thing → it.'],
    ['My brother and I live in a village. ___ work in the fields.', 'We', 'They', 'You', 'My brother and I → we.'],
    ['Tom is a blacksmith. ___ makes horseshoes.', 'He', 'She', 'It', 'Tom is a man → he.'],
    ['The mill is old. ___ is near the river.', 'It', 'He', 'They', 'A thing → it.'],
    ['John and Anna are peasants. ___ are poor.', 'They', 'We', 'He', 'John and Anna → they.'],
    ['The queen is kind. ___ helps the poor.', 'She', 'He', 'It', 'The queen is a woman → she.'],
    ['Peter, you are a good farmer! ___ work very hard.', 'You', 'He', 'We', 'Peter, you … → you.'],
    ['The lord has a big castle. ___ is very rich.', 'He', 'She', 'It', 'The lord is a man → he.'],
    ['The cow is hungry. ___ eats grass.', 'It', 'He', 'They', 'An animal → it.'],
    ['My sister and I make cheese. ___ sell it at the market.', 'We', 'They', 'She', 'My sister and I → we.'],
  ];
  const Q3 = [
    ['The lord has a castle. ___ castle is big.', 'His', 'Her', 'Its', 'The lord is a man → his.'],
    ['Anna is a weaver. ___ cloth is beautiful.', 'Her', 'His', 'Their', 'Anna is a woman → her.'],
    ['We are peasants. This is ___ field.', 'our', 'their', 'your', 'We → our.'],
    ['The knights are brave. ___ swords are sharp.', 'Their', 'Our', 'His', 'The knights → their.'],
    ['The baker is kind. I like ___.', 'him', 'he', 'his', 'After a verb we use him / her / it / them.'],
    ['The queen is wise. The people love ___.', 'her', 'she', 'his', 'After a verb we use him / her / it / them.'],
    ['The cow is sick. The farmer helps ___.', 'it', 'he', 'they', 'A cow is an animal → it.'],
    ['You are my friends. I help ___.', 'you', 'your', 'they', 'After a verb we use you.'],
    ['I am a monk. ___ name is Tom.', 'My', 'Me', 'I', 'My = of me.'],
    ['The villagers are hungry. The lord gives ___ bread.', 'them', 'they', 'their', 'After a verb we use them.'],
  ];
  const LEVELS = { 1: 'verbs', 2: 'pronouns', 3: 'pronouns and possessives' };
  const QN = 4;                                             // questions every spring
  const BASE = PLANTS.slice().sort((a, b) => (a.price - a.cost) - (b.price - b.cost))[0];   // the least convenient seed (wheat): always for sale
  let lvl = 1, marks = '', chosen = new Set();

  function makeQuiz() {
    lvl = Math.min(3, year);
    const r = rngFor('q');
    const bank = lvl === 1 ? Q1 : lvl === 2 ? Q2 : Q3;
    const take = (list, n) => {
      let fresh = list.filter(q => !used.has(q[0]));
      if (fresh.length < n) { list.forEach(q => used.delete(q[0])); fresh = list.slice(); }
      return shuffle(fresh, r).slice(0, n);
    };
    const qs = lvl === 3 ? [...take(Q3, 3), ...take(Q2, 1)] : take(bank, QN);
    qs.forEach(q => used.add(q[0]));
    quiz = shuffle(qs, r).map(([t, a, w1, w2, why]) => ({ t, a, o: shuffle([a, w1, w2], r), why }));
    qi = 0; score = 0; marks = '';
  }
  function nextQ() {
    if (qi >= quiz.length) return endQuiz();
    const q = quiz[qi];
    legend('Right answers = more kinds of seed. The first year is the easiest!');
    panel(`<div class="fv-say fv-quiz">
      <h4>🧑‍🌾 The trader’s questions (${qi + 1} of ${quiz.length})</h4>
      <p class="fv-lvl">Level ${lvl} · ${LEVELS[lvl]}</p>
      <p class="fv-q">${esc(q.t).replace('___', '<span class="gap" id="fvGap">?</span>')}</p>
      <div class="fv-opts" id="fvOpts">${q.o.map(o => `<button type="button" class="wg-btn fv-opt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      <p class="fv-msg" id="fvMsg">Choose the right word. Every right answer gives you one more kind of seed.</p>
      <p class="fv-marks">${marks || '·'}</p>
      <div class="wg-btns" id="fvQnext"></div></div>`);
    $('fvOpts').addEventListener('click', e => {
      const b = e.target.closest('.fv-opt'); if (!b || $('fvOpts').dataset.done) return;
      $('fvOpts').dataset.done = 1;
      const ok = b.dataset.o === q.a;
      $('fvGap').textContent = q.a; $('fvGap').classList.add(ok ? 'good' : 'bad');
      $('fvOpts').querySelectorAll('.fv-opt').forEach(x => { if (x.dataset.o === q.a) x.classList.add('good'); else if (x === b) x.classList.add('bad'); x.disabled = true; });
      if (ok) score++;
      marks += ok ? '✅ ' : '❌ ';
      msg(ok ? `✓ Yes! <b>${esc(q.a)}</b>. ${esc(q.why)}` : `✗ The right word is <b>${esc(q.a)}</b>. ${esc(q.why)}`, ok ? 'good' : 'bad');
      $('fvQnext').innerHTML = `<button type="button" class="wg-btn ${ok ? 'good' : ''}" id="fvQgo">${qi + 1 < quiz.length ? 'Next question →' : 'See what the trader sells →'}</button>`;
      $('fvQgo').addEventListener('click', () => { qi++; nextQ(); });
    });
  }
  function msg(t, cls = '') { const m = $('fvMsg'); m.className = 'fv-msg ' + cls; m.innerHTML = t; }
  function endQuiz() {
    if (!score) {
      avail = new Set([BASE.id]);
      panel(`<div class="fv-say"><h4>🧑‍🌾 0 right answers</h4>
        <p class="fv-marks">${marks}</p>
        <p>The trader shakes his head. “I don’t trust you!” He sells you only <b>${BASE.e} ${BASE.n}</b>, the cheapest seed.</p>
        <p class="fv-forecast">${forecastLine()}</p>
        <div class="wg-btns"><button type="button" class="wg-btn" id="fvToField">To the field →</button></div></div>`);
      $('fvToField').addEventListener('click', sowing);
      return;
    }
    pickSeeds();
  }
  const forecastLine = () => `🐑 <b>The old shepherd says:</b> “${esc(forecast.text)}” <small>(he is right about 7 times out of 10)</small>`;
  // the pupil chooses as many kinds of seed as right answers (+ the wheat that is always for sale), knowing the prices and the forecast
  function pickSeeds() {
    chosen = new Set();
    const list = PLANTS.filter(p => p.id !== BASE.id);
    panel(`<div class="fv-say fv-sow">
      <h4>🧑‍🌾 ${score} of ${quiz.length} right!</h4>
      <p class="fv-marks">${marks}</p>
      <p>The trader sells you <b>${BASE.e} ${BASE.n}</b> and <b>${score}</b> more kind${score > 1 ? 's' : ''} of seed. <b>Choose ${score}</b>, looking at the prices and at the weather.</p>
      <p class="fv-forecast">${forecastLine()}</p>
      <div class="fv-cards" id="fvCards">${cards(list, p => chosen.has(p.id))}</div>
      <p class="fv-key"><b>Tender</b> plants die in the frost; <b>hardy</b> plants survive. 💧 = drops of water.</p>
      <p class="fv-msg" id="fvMsg">Chosen: 0 of ${score}.</p>
      <div class="wg-btns"><button type="button" class="wg-btn good" id="fvPickOk">Buy the seeds →</button></div></div>`);
    $('fvCards').addEventListener('click', e => {
      const c = e.target.closest('.fv-card'); if (!c) return;
      const id = c.dataset.id;
      if (chosen.has(id)) chosen.delete(id);
      else if (chosen.size >= score) { msg(`✗ You can choose only ${score}. Click a chosen seed to change it.`, 'bad'); return; }
      else chosen.add(id);
      $('fvCards').innerHTML = cards(list, p => chosen.has(p.id));
      msg(`Chosen: ${chosen.size} of ${score}.`);
    });
    $('fvPickOk').addEventListener('click', () => {
      if (chosen.size < score) { msg(`✗ Choose ${score - chosen.size} more.`, 'bad'); return; }
      avail = new Set([BASE.id, ...chosen]); sowing();
    });
  }

  /* ---------- 2. spring: choose what to plant ---------- */
  const traits = p => `<span class="t w" title="Water">💧 ×${needOf(p)}</span>` +
    (p.tender ? '<span class="t c">🥶 tender</span>' : '<span class="t h">❄ hardy</span>') +
    (p.dry ? '<span class="t d">☀ drought-proof</span>' : '') + (p.wet ? '<span class="t m">🍄 rots when wet</span>' : '');
  function cards(list, isSel) {
    return list.map(p => {
      const m = MARKET[prices[p.id]];
      return `<button type="button" class="fv-card ${isSel(p) ? 'sel' : ''}" data-id="${p.id}">
        <span class="e">${p.e}</span><b>${esc(p.n)}</b>
        <span class="pr">Seed <i>${p.cost}</i> · sells <i class="${prices[p.id]}">${priceOf(p)}</i></span>
        <small class="mk ${prices[p.id]}">${m.tx}</small>
        <span class="tr">${traits(p)}</span></button>`;
    }).join('');
  }
  function sowing() {
    phase = 'sow'; top(); drawField();
    legend('Click a plant, then click the empty plots. Click a planted plot to take the seed back.');
    panel(`<div class="fv-say fv-sow">
      <p class="fv-forecast">${forecastLine()}</p>
      <div class="fv-cards" id="fvCards">${cards(PLANTS.filter(p => avail.has(p.id)), p => sel === p.id)}</div>
      <p class="fv-key"><b>Tender</b> plants die in the frost; <b>hardy</b> plants survive. 💧 = drops of water. If many plots have the same plant, its price goes down.</p>
      <p class="fv-lock">🔒 The trader sold you only these seeds this spring. Next spring: new questions, new seeds.</p>
      <p class="fv-msg" id="fvMsg">Choose a plant.</p>
      <div class="wg-btns"><button type="button" class="wg-btn good" id="fvSown">☔ Done sowing</button></div></div>`);
    $('fvCards').addEventListener('click', e => {
      const c = e.target.closest('.fv-card'); if (!c) return;
      sel = c.dataset.id; $('fvCards').innerHTML = cards(PLANTS.filter(p => avail.has(p.id)), p => sel === p.id); drawField();
      msg(`${esc(BY[sel].n)}: now click the plots. The seed costs ${BY[sel].cost} 🪙.`);
    });
    $('fvSown').addEventListener('click', afterSowing);
  }
  function onPlot(i) {
    if (phase !== 'sow') return;
    const x = field[i];
    if (x.p) { coins += x.p.cost; x.p = null; }
    else if (!sel) { msg('Choose a plant first.', 'bad'); return; }
    else if (coins < BY[sel].cost) { msg('✗ Not enough coins for this seed.', 'bad'); return; }
    else { x.p = BY[sel]; coins -= x.p.cost; }
    top(); drawField();
  }
  function afterSowing() {
    if (!planted().length) { msg('✗ Plant at least one seed!', 'bad'); return; }
    phase = 'rain'; top(); drawField(); legend('Every plant drinks the drops it needs. A dot ◌ is a missing drop.');
    const dry = weather === 'dry', wet = weather === 'wet';
    panel(`<div class="fv-say">
      <h4>🌧 It’s time for rain!</h4>
      <p>You planted <b>${planted().length}</b> seeds. Your plants are thirsty.</p>
      ${dry ? '<p class="fv-ev bad">☀ <b>A dry summer!</b> Most plants need 1 more 💧 this year.</p>' : wet ? '<p class="fv-ev">🌧 <b>A wet summer.</b> There is a lot of water, but some plants rot in the mud 🍄.</p>' : ''}
      <p>A <b>cloud</b> shows a category. <b>Click the drops</b> with words of that category: each one is <b>+1 💧</b> for your field.</p>
      <p>A drop with a wrong word is <b>mud</b>: <b>−1 💧</b>. There are two clouds, 20 seconds each.</p>
      <div class="wg-btns"><button type="button" class="wg-btn good" id="fvRain">☔ Make it rain</button></div></div>`);
    $('fvRain').addEventListener('click', rain);
  }

  /* ---------- 3. summer: rain, click the words of the category ---------- */
  // the water is shared among the plants: always to the one that is the most thirsty (max = its need)
  function share(W) {
    const pl = planted();
    pl.forEach(x => { x.w = 0; });
    for (let left = W; left > 0; left--) {
      const free = pl.filter(x => x.w < needOf(x.p));
      if (!free.length) break;
      free.sort((a, b) => a.w / needOf(a.p) - b.w / needOf(b.p))[0].w++;
    }
  }
  function rain() {
    run++; const myRun = run; phase = 'rain'; water = 0; share(0); top(); drawField();
    const cats = shuffle(Object.keys(CATS), rngFor('c')).slice(0, 2);
    const D = 20000, TOTAL = D * 2, speed = 1 + .07 * (year - 1);
    lastSched = null;
    // every drop of the 2 clouds is drawn now (when it appears, the word, where, how fast): the friend gets the same ones
    const rd = rngFor('d');
    const sched = [0, 1].map(c => {
      const own = cats[c], list = [], others = Object.keys(CATS).filter(k => k !== own).flatMap(k => CATS[k].words);
      let t = .3, recent = [];
      while (t < D / 1000 - 1.5) {
        const ok = rd() < .5, word = pick((ok ? CATS[own].words : others).filter(w => !recent.includes(w)), rd);
        recent = [word, ...recent].slice(0, 4);
        list.push({ t, word, ok, f: rd(), v: (70 + rd() * 40) * speed });
        t += (.55 + rd() * .35) / speed;
      }
      return list;
    });
    panel(`<div class="fv-arena" id="fvArena"><div class="fv-cloud" id="fvCloud"></div></div>
      <div class="fv-rbar"><span class="fv-wat" id="fvWat">💧 0</span><div class="fv-time"><i id="fvTime"></i></div></div>`);
    const arena = $('fvArena');
    lastSched = sched;
    let drops = [], ci = -1, t0 = 0, last = 0, ptr = 0;
    const setCloud = c => {
      ci = c; ptr = 0; drops.forEach(d => d.el.remove()); drops = [];
      $('fvCloud').innerHTML = `<small>${c === 0 ? '1st cloud' : '2nd cloud'}</small><b>${CATS[cats[c]].label}</b>`;
      $('fvCloud').classList.remove('new'); void $('fvCloud').offsetWidth; $('fvCloud').classList.add('new');
    };
    const toast = (t, cls, x, y) => {
      const el = document.createElement('span'); el.className = 'fv-toast ' + cls; el.textContent = t;
      el.style.left = Math.max(4, Math.min(x, arena.clientWidth - 150)) + 'px'; el.style.top = y + 'px'; arena.appendChild(el);
      setTimeout(() => el.remove(), 900);
    };
    const spawnDrop = e => {
      const el = document.createElement('div'); el.className = 'fv-drop'; el.textContent = e.word;
      arena.appendChild(el);
      drops.push({ el, word: e.word, ok: e.ok, x: 6 + e.f * Math.max(10, arena.clientWidth - el.offsetWidth - 14), y: 78, v: e.v });
    };
    arena.addEventListener('pointerdown', e => {
      const el = e.target.closest('.fv-drop'); if (!el) return;
      const d = drops.find(x => x.el === el); if (!d || d.dead) return;
      d.dead = true;
      if (d.ok) { water++; el.classList.add('good'); toast('+1 💧', 'good', d.x, d.y - 20); }
      else {
        water = Math.max(0, water - 1); el.classList.add('bad'); toast(`mud! ${d.word}: ${CATS[CAT_OF[d.word]].label.toLowerCase()}`, 'bad', d.x - 20, d.y - 20);
        arena.classList.remove('hit'); void arena.offsetWidth; arena.classList.add('hit');
      }
      setTimeout(() => { el.remove(); drops = drops.filter(x => x !== d); }, 260);
      $('fvWat').textContent = '💧 ' + water; share(water); drawField();
    });
    const frame = now => {
      if (phase !== 'rain' || myRun !== run) return;
      if (!t0) { t0 = last = now; setCloud(0); }
      const dt = Math.min(now - last, 60) / 1000, el = now - t0; last = now;
      if (el >= TOTAL) return endRain();
      const c = Math.floor(el / D); if (c !== ci) setCloud(c);
      const lt = (el - ci * D) / 1000;
      while (sched[ci][ptr] && sched[ci][ptr].t <= lt) spawnDrop(sched[ci][ptr++]);
      const H = arena.clientHeight;
      drops.forEach(d => { if (d.dead) return; d.y += d.v * dt; d.el.style.transform = `translate(${d.x}px,${d.y}px)`; });
      drops.filter(d => !d.dead && d.y > H - 34).forEach(d => { d.el.remove(); d.dead = true; });
      drops = drops.filter(d => !d.dead || d.el.isConnected);
      $('fvTime').style.width = Math.round(el / TOTAL * 100) + '%';
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }
  function endRain() {
    cancelAnimationFrame(raf);
    share(water); drawField(true);
    const pl = planted(), dry = pl.filter(x => x.w === 0).length, full = pl.filter(x => x.w >= needOf(x.p)).length;
    panel(`<div class="fv-say"><h4>☔ The rain is over!</h4>
      <p>You caught <b>${water} 💧</b> for ${pl.length} plants.</p>
      <p><b>${full}</b> plant${full === 1 ? ' has' : 's have'} enough water. ${dry ? `<b>${dry}</b> plant${dry > 1 ? 's' : ''} died of thirst 🥀.` : 'No plant died of thirst.'}</p>
      <div class="wg-btns"><button type="button" class="wg-btn good" id="fvHarvest">🧺 Harvest and sell</button></div></div>`);
    $('fvHarvest').addEventListener('click', market);
  }

  /* ---------- 4. autumn: the weather decides, sell the crops, pay the taxes ---------- */
  function outcome(x) {
    let f = x.w >= needOf(x.p) ? 1 : x.w > 0 ? .5 : 0, note = f === 0 ? '🥀' : f < 1 ? '🌿' : '';
    if (f > 0 && weather === 'cold' && x.p.tender) { f = 0; note = '🥶'; }
    else if (f > 0 && weather === 'wet' && x.p.wet) { f *= .5; note = '🍄'; }
    return { f, note };
  }
  function market() {
    phase = 'market';
    const count = {}; planted().forEach(x => { count[x.p.id] = (count[x.p.id] || 0) + 1; });
    const glut = p => Math.max(.5, 1 - .1 * Math.max(0, count[p.id] - 3));
    const rows = planted().map(x => { const o = outcome(x); return { x, ...o, coins: Math.round(priceOf(x.p) * o.f * glut(x.p)) }; });
    const gross = rows.reduce((s, r) => s + r.coins, 0);       // HARVEST: the harvesting mini-game will replace this line
    const paid = TAXES.map(t => ({ ...t, amount: Math.round(gross * t.pct / 100) }));
    const keep = gross - paid.reduce((s, t) => s + t.amount, 0);
    coins += keep;
    if (net) lastEnd = year;
    top(); drawField(true);
    if (net) pushNow();
    const frozen = rows.filter(r => r.note === '🥶').length, rotten = rows.filter(r => r.note === '🍄').length;
    const ev = weather === 'cold' ? `❄ <b>Early frost!</b> ${frozen ? `${frozen} tender plant${frozen > 1 ? 's' : ''} froze 🥶. Hardy plants are fine.` : 'No tender plant in your field: you are lucky.'}`
      : weather === 'dry' ? '☀ It was a <b>dry year</b>. Drought-proof plants were happy.'
      : weather === 'wet' ? `🌧 It was a <b>wet year</b>. ${rotten ? `${rotten} plant${rotten > 1 ? 's' : ''} rotted 🍄 (half crop).` : 'Nothing rotted.'}`
      : '🌤 A <b>mild year</b>. Nothing special: just sun and rain.';
    const was = forecast.said === weather ? '🐑 The shepherd was right!' : '🐑 The shepherd was wrong this time…';
    const plural = n => /^(wheat|garlic|grapes|beans)$/.test(n) ? n : n.endsWith('y') ? n.slice(0, -1) + 'ies' : /(ch|s)$/.test(n) ? n + 'es' : n + 's';
    const glutNames = PLANTS.filter(p => count[p.id] > 3).map(p => plural(p.n));
    const enough = coins >= GOAL, won = !net && enough;
    panel(`<div class="fv-say fv-market">
      <p class="fv-ev ${weather === 'mild' ? 'good' : 'bad'}">${ev} <small>${was}</small></p>
      <div class="fv-crops">${rows.map(r => `<span class="${r.coins ? '' : 'dead'}">${r.note || r.x.p.e} ${esc(r.x.p.n)} <b>${r.coins}</b></span>`).join('')}</div>
      ${glutNames.length ? `<p class="fv-key">Too many ${glutNames.join(' and ')}: the price went down.</p>` : ''}
      <table class="fv-tax"><tr class="sold"><td>🪙</td><td>You sell the harvest</td><td></td><td><b>+${gross}</b></td></tr>
        ${paid.map(t => `<tr><td>${t.ico}</td><td>${t.name}</td><td>${t.pct}%</td><td>−${t.amount}</td></tr>`).join('')}
        <tr class="keep"><td>👛</td><td>You keep</td><td>${gross ? Math.round(keep / gross * 100) + '%' : ''}</td><td><b>+${keep}</b></td></tr></table>
      <p class="fv-sum">${enough ? `You have <b>${coins} coins</b>: enough for your land!` : `You have <b>${coins} coins</b>. You need <b>${GOAL - coins}</b> more for your land.`}</p>
      ${net ? '<div id="fvSync"></div>' : `<div class="wg-btns">${won ? '<button type="button" class="wg-btn good" id="fvBuy">🏡 Buy your land!</button>' : '<button type="button" class="wg-btn" id="fvNext">Next year →</button>'}</div>`}</div>`);
    if (net) syncArea();
    else if (won) $('fvBuy').addEventListener('click', win);
    else $('fvNext').addEventListener('click', () => { year++; startYear(); });
  }

  function win() {
    phase = 'win'; top();
    const best = recall('farmBest'), record = !best || year < best;
    if (record) store('farmBest', year);
    panel(`<div class="fv-say fv-win">
      <h2>🏡 It’s your land!</h2>
      <p>You saved <b>${GOAL} coins</b> in <b>${year}</b> year${year > 1 ? 's' : ''} and you bought your own land. You are a <b>free farmer</b> now!${record ? ' <b>New best!</b>' : best ? ` Your best: <b>${best}</b> year${best > 1 ? 's' : ''}.` : ''}</p>
      <p class="fx"><b>DID YOU KNOW?</b> Most peasants never owned land: many were <b>serfs</b>, tied to the Lord’s land. Some saved money to buy their freedom or a small piece of land, but it was rare and could take many years. After the Black Death (1348) there were fewer workers, so some peasants could rent or buy land more easily.</p>
      <div class="wg-btns"><button type="button" class="wg-btn" id="fvAgain">↻ Play again</button><button type="button" class="wg-btn ghost" id="fvDone">Close</button></div></div>`);
    $('fvAgain').addEventListener('click', intro);
    $('fvDone').addEventListener('click', close);
  }

  /* ---------- online: two devices, one room (book.rooms of cloud.js: the document duels/<CODE>), the same seed = the same conditions ---------- */
  // The field `fm` of the room: n0, n1 (the names, 0 = who made the room), gid + seed (a new game), p0, p1 = { y, st, c, end } (year, phase, coins and
  // the last year finished by that player), left. Everything that is random in a year (weather, shepherd, prices, the questions with their options,
  // the clouds and every raindrop) comes from the seed and the year: both players get EXACTLY the same year. A year ends when both players have
  // finished it. The first to have GOAL coins wins (more coins, if both have them in the same year). Nobody writes for the other.
  const clientId = Math.random().toString(36).slice(2) + Date.now().toString(36);   // new on every page load: one account can play on two devices
  const rooms = () => window.book && window.book.rooms;
  let netName = '';
  const netText = e => {
    const c = (e && (e.code || e.message)) || '';
    if (/operation-not-allowed|admin-restricted/.test(c)) return 'Online play is not switched on yet. Ask your teacher!';
    if (/permission-denied/.test(c)) return 'Online play is not set up yet. Ask your teacher!';
    if (c === 'notfound') return 'There is no room with this code. Check the letters!';
    if (c === 'full') return 'This room already has two players.';
    if (c === 'expired') return 'This room is too old. Ask your friend to make a new one.';
    if (c === 'busy') return 'Could not make a room. Try again.';
    return 'Could not connect. Check the internet and try again.';
  };
  const netMsg = t => { const el = $('fvNetErr'); if (el) el.textContent = t; };
  const hash = s => {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  };
  const mulberry = a => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // a stream of random numbers for one thing of one year: the same on both devices online, Math.random alone
  function rngFor(tag) { return net ? mulberry(hash(`${net.seed}:${year}:${tag}`)) : Math.random; }

  function pushNow() {
    if (!net) return;
    clearTimeout(pushT);
    try { rooms().update(net.code, { ['fm.p' + net.me]: { y: year, st: phase, c: coins, end: lastEnd } }).catch(() => {}); } catch { /* offline: the other device just sees nothing new */ }
  }
  function schedulePush() { if (!net) return; clearTimeout(pushT); pushT = setTimeout(pushNow, 350); }

  function netMenu(msg = '') {
    netLeave(); run++; cancelAnimationFrame(raf); phase = 'net';
    area.innerHTML = `<div class="fv-net"><div class="fv-say">
      <h4>👥 Play with a friend</h4>
      <p>Each player uses <b>a different device</b>. You get <b>exactly the same year</b>: the same weather, prices, questions and clouds. The first to buy the land wins!</p>
      <label class="fv-nm">My name <input id="fvName" type="text" maxlength="18" autocomplete="off" placeholder="e.g. Maya" value="${esc(netName)}"></label>
      <div class="fv-netcols">
        <div class="fv-netbox"><b>🆕 Make a room</b><span>You get a 4-letter code. Tell it to your friend.</span><button type="button" class="wg-btn good" id="fvMake">Make a room</button></div>
        <div class="fv-netbox"><b>🔑 Join a room</b><span>Write the code of your friend.</span><input id="fvCode" type="text" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD" aria-label="Room code"><button type="button" class="wg-btn" id="fvJoin">Join ▶</button></div>
      </div>
      <p class="fv-msg bad" id="fvNetErr" aria-live="polite">${esc(msg)}</p>
      <div class="wg-btns"><button type="button" class="wg-btn ghost" id="fvNetBack">◀ Back</button></div></div></div>`;
    $('fvMake').addEventListener('click', () => netEnter(true));
    $('fvJoin').addEventListener('click', () => netEnter(false));
    $('fvCode').addEventListener('keydown', e => { if (e.key === 'Enter') netEnter(false); });
    $('fvNetBack').addEventListener('click', intro);
  }
  async function netEnter(make) {
    const R = rooms();
    netName = ($('fvName').value || '').trim().slice(0, 18);
    if (!R) { netMsg('Online play needs the internet. Try again in a moment.'); return; }
    let code;
    if (!make) {
      code = ($('fvCode').value || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (code.length !== 4) { netMsg('The code has 4 letters.'); return; }
    }
    netMsg(make ? 'Making the room…' : 'Joining…');
    try {
      let me = 0;
      if (make) code = await R.create(clientId); else me = await R.join(code, clientId);
      net = { code, me, unsub: null, room: null, gid: 0, seed: '' };
      await R.update(code, { [`fm.n${me}`]: netName || `Player ${me + 1}` });
      if (net) net.unsub = R.watch(code, onRoom, e => netMsg(netText(e)));
    } catch (e) { net = null; netMsg(netText(e)); }
  }
  function netLeave() {
    if (!net) return;
    const st = net;
    net = null; clearTimeout(pushT);
    st.unsub?.();
    try { rooms()?.update(st.code, { 'fm.left': st.me }).catch(() => {}); } catch { /* nobody to tell */ }
  }
  // every change of the room comes here (also what this device wrote)
  function onRoom(room) {
    if (!net || phase === 'closed') return;
    net.room = room;
    if (!room) { netLeave(); netMenu('This room is gone.'); return; }
    const m = room.fm || {};
    if (m.left === 1 - net.me) {
      run++; cancelAnimationFrame(raf); phase = 'net';
      area.innerHTML = '<div class="fv-net"><div class="fv-say fv-win"><h2>👋</h2><p>Your friend left the game.</p><div class="wg-btns"><button type="button" class="wg-btn" id="fvBackMenu">Back to the menu</button></div></div></div>';
      $('fvBackMenu').addEventListener('click', intro);
      return;
    }
    if (!m.gid) { netLobby(m); return; }
    if (m.gid !== net.gid) { net.gid = m.gid; net.seed = m.seed; startOnline(); return; }
    renderTop();
    if (phase === 'market') syncArea();
  }
  // before the game: who is in the room
  function netLobby(m) {
    const host = net.me === 0;
    area.innerHTML = `<div class="fv-net"><div class="fv-say">
      <h4>Village Farm online</h4>
      <p>Room code: <b class="fv-roomcode">${net.code}</b></p>
      <ol class="fv-lobby">${[0, 1].map(i => `<li class="${m['n' + i] ? 'on' : ''}">🧑‍🌾 <b>${m['n' + i] ? esc(m['n' + i]) : '…'}</b>${i === net.me ? ' <small>(you)</small>' : ''}</li>`).join('')}</ol>
      <p class="fv-msg">${!m.n1 ? 'Tell this code to your friend: they choose “Join a room”.' : host ? 'Your friend is here! Press Start when you are ready.' : `Waiting for ${esc(m.n0 || 'your friend')} to start…`}</p>
      <p class="fv-msg bad" id="fvNetErr" aria-live="polite"></p>
      <div class="wg-btns"><button type="button" class="wg-btn ghost" id="fvLeave">Leave</button>${host ? `<button type="button" class="wg-btn good" id="fvStart" ${m.n1 ? '' : 'disabled'}>🎲 Start!</button>` : ''}</div></div></div>`;
    $('fvLeave').addEventListener('click', () => { netLeave(); netMenu(); });
    if (host) $('fvStart').addEventListener('click', netStart);
  }
  // the host draws the seed of a new game: from this seed come all the years of both players
  async function netStart() {
    if (!net) return;
    const m = net.room?.fm || {};
    try { await rooms().update(net.code, { 'fm.gid': (m.gid || 0) + 1, 'fm.seed': Math.random().toString(36).slice(2, 8), 'fm.p0': null, 'fm.p1': null, 'fm.left': null }); }
    catch (e) { netMsg(netText(e)); }
  }
  function startOnline() {
    year = 1; coins = START; avail = new Set(); used = new Set(); lastEnd = 0; sel = null; run++; cancelAnimationFrame(raf);
    shell(); startYear();
  }
  // at the end of the market: wait for the friend; when both have finished the year, the game goes on or somebody has won
  function syncArea() {
    const el = $('fvSync'); if (!el || !net) return;
    const m = net.room?.fm || {}, opp = m['p' + (1 - net.me)], oname = m['n' + (1 - net.me)] || 'your friend';
    if (!opp || (opp.end || 0) < year) { el.innerHTML = `<p class="fv-wait">⏳ Waiting for <b>${esc(oname)}</b> to finish year ${year}…</p>`; return; }
    if (coins >= GOAL || opp.c >= GOAL) { netOver(opp.c, oname); return; }
    el.innerHTML = `<p class="fv-sum">${esc(oname)} has <b>${opp.c}</b> coins.</p><div class="wg-btns"><button type="button" class="wg-btn" id="fvNext">Next year →</button></div>`;
    $('fvNext').addEventListener('click', () => { year++; startYear(); });
  }
  function netOver(oc, oname) {
    phase = 'win'; renderTop();
    const res = coins > oc ? 'win' : coins < oc ? 'lose' : 'draw', host = net.me === 0;
    panel(`<div class="fv-say fv-win">
      <h2>${res === 'win' ? '🏡 You bought your land first!' : res === 'lose' ? `🏘 ${esc(oname)} bought the land first` : '🤝 It’s a draw!'}</h2>
      <p>After <b>${year}</b> year${year > 1 ? 's' : ''}: you have <b>${coins}</b> coins, ${esc(oname)} has <b>${oc}</b>.</p>
      <p class="fx"><b>DID YOU KNOW?</b> Most peasants never owned land: many were <b>serfs</b>, tied to the Lord’s land. Some saved money to buy their freedom or a small piece of land, but it was rare and could take many years. After the Black Death (1348) there were fewer workers, so some peasants could rent or buy land more easily.</p>
      <div class="wg-btns">${host ? '<button type="button" class="wg-btn" id="fvAgain">↻ Play again</button>' : '<span class="fv-wait">Your friend can start a new game.</span>'}<button type="button" class="wg-btn ghost" id="fvDone">Close</button></div></div>`);
    if (host) $('fvAgain').addEventListener('click', netStart);
    $('fvDone').addEventListener('click', close);
  }

  function open() {
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    intro();
  }
  function close() {
    netLeave(); phase = 'closed'; run++; cancelAnimationFrame(raf);
    modal.hidden = true;
    document.documentElement.classList.remove('gq-open');
  }
  $('fvClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);
  document.querySelectorAll('[data-wh="farm"]').forEach(b => b.addEventListener('click', open));
  window.WITCH_FARM = { open, close, _test: { CATS, PLANTS, get q() { return quiz[qi]; }, get sched() { return lastSched; }, get state() { return { year, coins, field, phase, weather, avail: [...avail], prices, quiz: quiz.map(q => q.t + '|' + q.o.join(',')), forecast: forecast && forecast.text }; } } };
})();
