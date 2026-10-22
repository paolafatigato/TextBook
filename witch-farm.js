// Witch hunt (CLIL, p. 166-167, card of the Farmer): "Village Farm", a farming game for the PC (pop-up, against the computer).
// The pupil is a peasant who does NOT own the land and saves coins to buy a piece of land of his or her own (GOAL). A bit of strategy:
//  · Plants are unlocked ONCE by writing their English name (the trader shows 4 new seeds in year 1, 2 every following spring).
//  · Every plant has its own traits (PLANTS): price of the seed, price at the market, water it needs, tender (dies in frost) or hardy,
//    drought-proof, rots when it is wet. The market price changes every year (common = cheap, rare = dear) and many plants of the same
//    kind lower their own price (glut). So: which plants to buy, how many, where.
//  · The weather of the year is hidden (WEATHER): the old shepherd gives a forecast that is right 7 times out of 10. Dry summer = plants need
//    1 more drop; wet summer = some plants rot; cold = frost kills the tender ones (seen only in autumn).
//  · Every year: spring (new seeds, choose and sow) → summer (rain: click the words of the cloud's category, +1 water; a wrong word = mud −1)
//    → autumn (harvest, sell, taxes: Lord 35%, Church 10%, mill and oven 5%: the farmer keeps half, as on the page).
// The harvest is automatic for now: when the harvesting mini-game is ready, it goes in market() instead of the line marked HARVEST.
// Opened by a button with data-wh="farm" (page of the Farmer).

(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
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
  const SEASON = { learn: '🌱 Spring · new seeds', sow: '🌱 Spring · sowing', rain: '🌧 Summer · rain', market: '🧺 Autumn · harvest and taxes' };

  // cost = price of the seed, price = coins of a full crop, need = drops of water, tender = dies in frost, dry = drought-proof, wet = rots when wet
  const PLANTS = [
    { id: 'wheat', n: 'wheat', e: '🌾', ok: ['wheat'], cost: 1, price: 4, need: 2, tender: false, dry: true, wet: false },
    { id: 'carrot', n: 'carrot', e: '🥕', ok: ['carrot', 'carrots'], cost: 1, price: 6, need: 2, tender: false, dry: false, wet: false },
    { id: 'onion', n: 'onion', e: '🧅', ok: ['onion', 'onions'], cost: 1, price: 6, need: 1, tender: false, dry: false, wet: true },
    { id: 'garlic', n: 'garlic', e: '🧄', ok: ['garlic'], cost: 1, price: 8, need: 1, tender: false, dry: true, wet: true },
    { id: 'cabbage', n: 'cabbage', e: '🥬', ok: ['cabbage', 'cabbages'], cost: 1, price: 6, need: 2, tender: false, dry: false, wet: false },
    { id: 'beans', n: 'beans', e: '🫘', ok: ['beans', 'bean'], cost: 1, price: 6, need: 2, tender: true, dry: false, wet: false },
    { id: 'strawberry', n: 'strawberry', e: '🍓', ok: ['strawberry', 'strawberries'], cost: 2, price: 12, need: 3, tender: true, dry: false, wet: true },
    { id: 'grapes', n: 'grapes', e: '🍇', ok: ['grapes', 'grape'], cost: 3, price: 14, need: 2, tender: true, dry: true, wet: false },
    { id: 'apple', n: 'apple', e: '🍎', ok: ['apple', 'apples'], cost: 3, price: 12, need: 3, tender: false, dry: false, wet: false },
    { id: 'pear', n: 'pear', e: '🍐', ok: ['pear', 'pears'], cost: 3, price: 12, need: 2, tender: true, dry: true, wet: false },
    { id: 'cherry', n: 'cherry', e: '🍒', ok: ['cherry', 'cherries'], cost: 3, price: 14, need: 2, tender: true, dry: false, wet: true },
    { id: 'peach', n: 'peach', e: '🍑', ok: ['peach', 'peaches'], cost: 4, price: 16, need: 3, tender: true, dry: false, wet: false },
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

  let year = 1, coins = 0, known = new Set(), weather = 'mild', forecast = null, prices = {}, sel = null;
  let field = [], queue = [], qi = 0, failed = [], tries = 0, shown = new Set(), water = 0, phase = 'closed', raf = 0, run = 0;

  const norm = s => s.toLowerCase().replace(/[^a-z]/g, '');
  const lev = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };
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
  function top() {
    const pct = Math.min(100, Math.round(coins / GOAL * 100));
    $('fvTop').innerHTML = `<span class="fv-chip">📅 Year ${year}</span><span class="fv-chip season">${SEASON[phase] || SEASON.sow}</span>
      <span class="fv-chip coin">👛 ${coins} coin${coins === 1 ? '' : 's'}</span>
      <div class="fv-goal" aria-label="Coins for your land"><i style="width:${pct}%"></i><b>🏡 Your own land: ${GOAL} coins</b></div>`;
  }
  function drawField(final) {
    $('fvField').innerHTML = field.map((x, i) => {
      if (!x.p) return `<div class="fv-plot empty ${phase === 'sow' && sel ? 'can' : ''}" data-i="${i}"><span class="ic"></span></div>`;
      const need = needOf(x.p);
      let ico, cls;
      if (phase === 'sow' || phase === 'learn') { ico = x.p.e; cls = 'young'; }
      else if (final) { ico = x.w >= need ? x.p.e : x.w > 0 ? '🌿' : '🥀'; cls = x.w >= need ? 'ripe' : ''; }
      else { ico = x.w >= need ? x.p.e : x.w > 0 ? '🌿' : '🌱'; cls = x.w >= need ? 'ripe' : ''; }
      const dots = phase === 'rain' || phase === 'market' ? `<span class="fv-w">${'💧'.repeat(Math.min(x.w, need))}${'<i>◌</i>'.repeat(Math.max(0, need - x.w))}</span>` : '';
      return `<div class="fv-plot ${cls}" data-i="${i}"><span class="ic">${ico}</span>${dots}</div>`;
    }).join('');
  }

  /* ---------- start ---------- */
  function intro() {
    phase = 'sow'; year = 1; coins = START; known = new Set(); run++; sel = null;
    shell(); top(); field = Array.from({ length: N }, () => ({ p: null, w: 0 })); drawField(); legend('');
    panel(`<div class="fv-say">
      <h4>You are a peasant</h4>
      <p>You work the land, but the land is <b>not yours</b>: it belongs to the Lord. Every year you pay <b>taxes</b> and you keep only about half of what you sell.</p>
      <p><b>Your dream:</b> save <b>${GOAL} coins</b> and buy a piece of land of your own.</p>
      <ol class="fv-steps">
        <li><span>🌱</span><div><b>Spring</b> — a trader shows you new seeds: <b>write the name</b> once and you can plant it for ever. Then choose <b>what to plant</b>.</div></li>
        <li><span>🌧</span><div><b>Summer</b> — catch the <b>raindrops</b> with words of the category in the cloud.</div></li>
        <li><span>🧺</span><div><b>Autumn</b> — sell the harvest and <b>pay the taxes</b>. Beware of the weather and of the prices!</div></li>
      </ol>
      <div class="wg-btns"><button type="button" class="wg-btn good" id="fvGo">▶ Start the first year</button></div></div>`);
    $('fvGo').addEventListener('click', startYear);
  }

  function startYear() {
    run++; water = 0; sel = null;
    // the weather (the first year is a kind one) and what the shepherd says
    const roll = Object.entries(WEATHER);
    weather = year === 1 ? 'mild' : (() => { let r = Math.random() * 100; for (const [k, v] of roll) { r -= v.w; if (r < 0) return k; } return 'mild'; })();
    const right = year === 1 || Math.random() < .7;
    const said = right ? weather : pick(Object.keys(WEATHER).filter(k => k !== weather));
    forecast = { text: pick(WEATHER[said].say), said };
    // the prices of the year
    prices = {}; PLANTS.forEach(p => { const r = Math.random(); prices[p.id] = year === 1 ? 'normal' : r < .22 ? 'common' : r < .44 ? 'rare' : 'normal'; });
    if (coins < 3) coins = 3;                      // the monks give some coins to a poor farmer: you can always plant something
    field = Array.from({ length: N }, () => ({ p: null, w: 0 }));
    // new seeds to learn: 4 in the first year, then 2 every spring
    const unknown = shuffle(PLANTS.filter(p => !known.has(p.id)));
    queue = unknown.slice(0, year === 1 ? 4 : 2); qi = 0; failed = [];
    if (queue.length) { phase = 'learn'; top(); drawField(); legend(''); nextLearn(); }
    else sowing();
  }

  /* ---------- 1. spring: the trader, write the name of the new seed (once) ---------- */
  function blanks(p) {
    return [...p.n].map((c, i) => `<i class="${shown.has(i) ? 'on' : ''}">${shown.has(i) ? c.toUpperCase() : ''}</i>`).join('');
  }
  function nextLearn() {
    if (qi >= queue.length) {
      if (known.size < 3 && failed.length) { queue = failed; failed = []; qi = 0; }          // at the beginning you need at least 3 plants
      else return sowing();
    }
    const p = queue[qi];
    tries = 0; shown = new Set(year <= 2 ? [0] : []);
    legend('The plants you know are the ones you can plant.');
    panel(`<div class="fv-say fv-seed">
      <h4>🧑‍🌾 The trader shows you a new seed (${qi + 1} of ${queue.length})</h4>
      <div class="fv-pic" id="fvPic">${p.e}</div>
      <div class="fv-blanks" id="fvBlanks">${blanks(p)}</div>
      <form class="wq-form" id="fvForm" autocomplete="off"><input id="fvInput" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="What is it? Write the name…" aria-label="Name of the seed"><button type="submit" class="wg-btn">Buy the seed</button></form>
      <p class="fv-msg" id="fvMsg">Write its name once, and you can plant it in every year. ${year <= 2 ? 'The first letter helps you.' : 'No help this year!'}</p>
      <p class="fv-tries" id="fvTries">Tries: ${'🌰'.repeat(3)}</p></div>`);
    $('fvForm').addEventListener('submit', e => { e.preventDefault(); guess($('fvInput').value); });
    $('fvInput').focus();
  }
  function msg(t, cls = '') { const m = $('fvMsg'); m.className = 'fv-msg ' + cls; m.innerHTML = t; }
  function guess(txt) {
    const p = queue[qi], t = norm(txt);
    if (!t || $('fvInput').disabled) return;
    if (p.ok.includes(t)) {
      $('fvInput').disabled = true; known.add(p.id);
      p.n.split('').forEach((_, i) => shown.add(i)); $('fvBlanks').innerHTML = blanks(p);
      msg(`✓ Yes, <b>${esc(p.n)}</b>! Now you can plant it.`, 'good');
      later(900, () => { qi++; nextLearn(); });
      return;
    }
    tries++;
    $('fvTries').textContent = 'Tries: ' + '🌰'.repeat(3 - tries) + '·'.repeat(tries);
    if (tries >= 3) {
      $('fvInput').disabled = true; failed.push(p);
      p.n.split('').forEach((_, i) => shown.add(i)); $('fvBlanks').innerHTML = blanks(p);
      msg(`✗ The trader goes away. It was <b>${esc(p.n)}</b>. He will come back another year.`, 'bad');
      later(2200, () => { qi++; nextLearn(); });
      return;
    }
    const close = p.ok.some(o => lev(t, o) === 1);
    let k = 0; while (shown.has(k) && k < p.n.length) k++;
    if (k < p.n.length) shown.add(k);
    $('fvBlanks').innerHTML = blanks(p);
    $('fvInput').value = ''; $('fvInput').focus();
    $('fvPic').classList.remove('shake'); void $('fvPic').offsetWidth; $('fvPic').classList.add('shake');
    msg(close ? '✗ Almost! Check the spelling. Here is one more letter.' : '✗ Not this one. Here is one more letter.', 'bad');
  }

  /* ---------- 2. spring: choose what to plant ---------- */
  const traits = p => `<span class="t w" title="Water">💧 ×${needOf(p)}</span>` +
    (p.tender ? '<span class="t c">🥶 tender</span>' : '<span class="t h">❄ hardy</span>') +
    (p.dry ? '<span class="t d">☀ drought-proof</span>' : '') + (p.wet ? '<span class="t m">🍄 rots when wet</span>' : '');
  function cards() {
    return PLANTS.filter(p => known.has(p.id)).map(p => {
      const m = MARKET[prices[p.id]];
      return `<button type="button" class="fv-card ${sel === p.id ? 'sel' : ''}" data-id="${p.id}">
        <span class="e">${p.e}</span><b>${esc(p.n)}</b>
        <span class="pr">Seed <i>${p.cost}</i> · sells <i class="${prices[p.id]}">${priceOf(p)}</i></span>
        <small class="mk ${prices[p.id]}">${m.tx}</small>
        <span class="tr">${traits(p)}</span></button>`;
    }).join('');
  }
  function sowing() {
    phase = 'sow'; top(); drawField();
    const locked = PLANTS.length - known.size;
    legend('Click a plant, then click the empty plots. Click a planted plot to take the seed back.');
    panel(`<div class="fv-say fv-sow">
      <p class="fv-forecast">🐑 <b>The old shepherd says:</b> “${esc(forecast.text)}” <small>(he is right about 7 times out of 10)</small></p>
      <div class="fv-cards" id="fvCards">${cards()}</div>
      <p class="fv-key"><b>Tender</b> plants die in the frost; <b>hardy</b> plants survive. 💧 = drops of water. If many plots have the same plant, its price goes down.</p>
      ${locked ? `<p class="fv-lock">🔒 ${locked} plants are still unknown. The trader brings new seeds every spring.</p>` : ''}
      <p class="fv-msg" id="fvMsg">Choose a plant.</p>
      <div class="wg-btns"><button type="button" class="wg-btn good" id="fvSown">☔ Done sowing</button></div></div>`);
    $('fvCards').addEventListener('click', e => {
      const c = e.target.closest('.fv-card'); if (!c) return;
      sel = c.dataset.id; $('fvCards').innerHTML = cards(); drawField();
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
    const cats = shuffle(Object.keys(CATS)).slice(0, 2);
    const D = 20000, TOTAL = D * 2, speed = 1 + .07 * (year - 1);
    panel(`<div class="fv-arena" id="fvArena"><div class="fv-cloud" id="fvCloud"></div></div>
      <div class="fv-rbar"><span class="fv-wat" id="fvWat">💧 0</span><div class="fv-time"><i id="fvTime"></i></div></div>`);
    const arena = $('fvArena');
    let drops = [], ci = -1, t0 = 0, last = 0, spawn = .3;
    const setCloud = c => {
      ci = c; drops.forEach(d => d.el.remove()); drops = [];
      $('fvCloud').innerHTML = `<small>${c === 0 ? '1st cloud' : '2nd cloud'}</small><b>${CATS[cats[c]].label}</b>`;
      $('fvCloud').classList.remove('new'); void $('fvCloud').offsetWidth; $('fvCloud').classList.add('new');
    };
    const toast = (t, cls, x, y) => {
      const el = document.createElement('span'); el.className = 'fv-toast ' + cls; el.textContent = t;
      el.style.left = Math.max(4, Math.min(x, arena.clientWidth - 150)) + 'px'; el.style.top = y + 'px'; arena.appendChild(el);
      setTimeout(() => el.remove(), 900);
    };
    const spawnDrop = () => {
      const ok = Math.random() < .5, own = cats[ci];
      const pool = ok ? CATS[own].words : Object.keys(CATS).filter(k => k !== own).flatMap(k => CATS[k].words);
      const inUse = new Set(drops.map(d => d.word));
      const free = pool.filter(w => !inUse.has(w));
      const word = pick(free.length ? free : pool);
      const el = document.createElement('div'); el.className = 'fv-drop'; el.textContent = word;
      arena.appendChild(el);
      drops.push({ el, word, ok, x: 6 + Math.random() * Math.max(10, arena.clientWidth - el.offsetWidth - 14), y: 78, v: (70 + Math.random() * 40) * speed });
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
      spawn -= dt; if (spawn <= 0) { spawnDrop(); spawn = (.55 + Math.random() * .35) / speed; }
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
    top(); drawField(true);
    const frozen = rows.filter(r => r.note === '🥶').length, rotten = rows.filter(r => r.note === '🍄').length;
    const ev = weather === 'cold' ? `❄ <b>Early frost!</b> ${frozen ? `${frozen} tender plant${frozen > 1 ? 's' : ''} froze 🥶. Hardy plants are fine.` : 'No tender plant in your field: you are lucky.'}`
      : weather === 'dry' ? '☀ It was a <b>dry year</b>. Drought-proof plants were happy.'
      : weather === 'wet' ? `🌧 It was a <b>wet year</b>. ${rotten ? `${rotten} plant${rotten > 1 ? 's' : ''} rotted 🍄 (half crop).` : 'Nothing rotted.'}`
      : '🌤 A <b>mild year</b>. Nothing special: just sun and rain.';
    const was = forecast.said === weather ? '🐑 The shepherd was right!' : '🐑 The shepherd was wrong this time…';
    const plural = n => /^(wheat|garlic|grapes|beans)$/.test(n) ? n : n.endsWith('y') ? n.slice(0, -1) + 'ies' : /(ch|s)$/.test(n) ? n + 'es' : n + 's';
    const glutNames = PLANTS.filter(p => count[p.id] > 3).map(p => plural(p.n));
    const won = coins >= GOAL;
    panel(`<div class="fv-say fv-market">
      <p class="fv-ev ${weather === 'mild' ? 'good' : 'bad'}">${ev} <small>${was}</small></p>
      <div class="fv-crops">${rows.map(r => `<span class="${r.coins ? '' : 'dead'}">${r.note || r.x.p.e} ${esc(r.x.p.n)} <b>${r.coins}</b></span>`).join('')}</div>
      ${glutNames.length ? `<p class="fv-key">Too many ${glutNames.join(' and ')}: the price went down.</p>` : ''}
      <table class="fv-tax"><tr class="sold"><td>🪙</td><td>You sell the harvest</td><td></td><td><b>+${gross}</b></td></tr>
        ${paid.map(t => `<tr><td>${t.ico}</td><td>${t.name}</td><td>${t.pct}%</td><td>−${t.amount}</td></tr>`).join('')}
        <tr class="keep"><td>👛</td><td>You keep</td><td>${gross ? Math.round(keep / gross * 100) + '%' : ''}</td><td><b>+${keep}</b></td></tr></table>
      <p class="fv-sum">${won ? `You have <b>${coins} coins</b>: enough for your land!` : `You have <b>${coins} coins</b>. You need <b>${GOAL - coins}</b> more for your land.`}</p>
      <div class="wg-btns">${won ? '<button type="button" class="wg-btn good" id="fvBuy">🏡 Buy your land!</button>' : '<button type="button" class="wg-btn" id="fvNext">Next year →</button>'}</div></div>`);
    if (won) $('fvBuy').addEventListener('click', win);
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

  function open() {
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    intro();
  }
  function close() {
    phase = 'closed'; run++; cancelAnimationFrame(raf);
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
  window.WITCH_FARM = { open, close, _test: { CATS, PLANTS, get state() { return { year, coins, field, phase, weather, known: [...known], prices }; } } };
})();
