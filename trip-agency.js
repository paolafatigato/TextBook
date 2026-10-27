// School trip (p. 320, "Money"): "Travel Agent", a timed game for the PC (pop-up, on your own), in the spirit of Cooking Fever.
// The pupil runs a travel agency for 5 days (70 seconds each). Customers arrive and WAIT IN LINE (5 places), every one with a patience bar.
//  · Click a customer, read the request (cheapest / closest / "less than €60"…) and click the ONE right offer among three.
//  · Quick and right = 5 stars and good money; slow, or a wrong offer first = fewer stars. A customer who waits too long leaves ANGRY:
//    1 star and a refund. A line that is too long turns people away too (2 stars, no refund).
//  · The rating is the average of the last 8 reviews. A bad rating means fewer customers (they stop coming): below 2 stars the agency is closed.
//  · Every evening the rent is paid. Money below zero = bankrupt. Survive 5 days and the agency is a success.
// The requests are made on the spot from random offers and are checked: exactly ONE offer fits (see build()).
// They revise the chapter: polite requests, prices (per night / in total, per person), comparatives and superlatives, travel words.
// Online (two devices, one 4-letter code, book.rooms of cloud.js): both agencies get EXACTLY the same customers, in the same line, at the same
// time (everything random comes from a shared seed). Whoever answers right FIRST takes the customer: the other one loses him. Each agency has
// its own money, stars and rent; a customer nobody serves leaves angry for both. The richest agency after 5 days wins; if one agency closes, the other wins.
// Opened by a button with data-trip="agency" (page 320, left).

(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let rnd = Math.random;       // a seeded stream while a customer is made online: the same customer on both devices
  const rint = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = a => a[Math.floor(rnd() * a.length)];
  const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const store = (k, v) => { try { saved[k] = v; persist(); } catch { /* script.js not ready: skip */ } };
  const recall = k => { try { return saved[k]; } catch { return undefined; } };
  // n different numbers from lo to hi (every step), at least `gap` apart
  const distinct = (n, lo, hi, step = 1, gap = 1) => {
    const out = [];
    for (let g = 0; out.length < n && g < 500; g++) {
      const v = lo + step * Math.floor(rnd() * ((hi - lo) / step + 1));
      if (out.every(o => Math.abs(o - v) >= gap)) out.push(v);
    }
    return out;
  };

  const DAYS = 5;
  const DAY_S = 70;                                  // seconds of one day
  const QMAX = 5;                                    // places in the line
  const START_MONEY = 100;
  const RENT = [70, 100, 130, 160, 190];              // paid every evening
  const GAP = [8, 7, 6, 5.5, 5];                      // seconds between two customers, day 1…5
  const PATIENCE = [32, 29, 26, 23, 20];         // seconds a customer waits, day 1…5
  const REFUND = 15;                                 // an angry customer gets this back
  const WRONG_COST = .15;                            // a wrong offer takes this part of the patience
  const pay = stars => 6 + 4 * stars;
  const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

  const FACES = ['👩', '👨', '🧑', '👵', '👴', '🧒', '👧', '👦', '🧔', '👱'];
  const KIND = {
    hotel: { ico: '🏨', name: 'Hotel desk', w: 40 },
    transport: { ico: '🎫', name: 'Tickets', w: 35 },
    activity: { ico: '🎟️', name: 'Visits and tours', w: 25 },
  };
  const CITIES = ['Rome', 'Paris', 'London', 'Berlin', 'Madrid', 'Vienna', 'Prague', 'Athens', 'Lisbon', 'Amsterdam'];
  const HOTELS = ['Hostel Sunny', 'Hotel Central', 'Hotel Park', 'Hostel Blue', 'Hotel Rose', 'Hotel Lake', 'Hostel Green', 'Hotel Palace', 'Hotel Mountain', 'B&B Anna', 'Hotel Star', 'Hostel Oak'];
  const MODES = [
    { e: '🚆', n: 'Train', h: [3, 6], p: [40, 90] },
    { e: '🚌', n: 'Bus', h: [6, 10], p: [15, 45] },
    { e: '✈️', n: 'Plane', h: [1, 2], p: [70, 150] },
    { e: '🚗', n: 'Carpool', h: [4, 7], p: [25, 60] },
  ];
  const ACTS = [
    { e: '🖼️', n: 'Art museum', say: ['I love paintings and sculptures.', 'We want to see famous pictures and statues.'] },
    { e: '🔬', n: 'Science museum', say: ['My kids love dinosaurs, robots and space.', 'I’d like to learn about science with my children.'] },
    { e: '🏰', n: 'Castle visit', say: ['I’d like to see an old castle with towers and a king’s room.', 'We love medieval history: kings, walls and towers.'] },
    { e: '🚤', n: 'Boat tour', say: ['We’d like to see the city from the water.', 'I’d like a trip on the river.'] },
    { e: '🌳', n: 'Nature park', say: ['I want to walk in nature and see animals and trees.', 'We’d like a quiet walk in the green.'] },
    { e: '🎻', n: 'Concert', say: ['I’d like to listen to an orchestra tonight.', 'We want to hear live music.'] },
    { e: '🍝', n: 'Food tour', say: ['We want to taste the local food.', 'I’d like to try typical dishes.'] },
    { e: '🗼', n: 'City tower', say: ['We’d like to go up and see the whole city from above.', 'I want a view from the top, please.'] },
  ];
  const REVIEW = {
    5: ['Perfect trip! Thank you!', 'Fast and friendly. 10 out of 10!', 'Exactly what I wanted!'],
    4: ['Very good service.', 'Nice offer, quick answer.', 'Good job, thanks!'],
    3: ['It was OK, but a bit slow.', 'Fine, but I waited a long time.'],
    2: ['Too slow… and not what I asked for.', 'I waited too long.'],
    1: ['Terrible! I’m going to another agency.', 'Nobody helped me. Never again!'],
  };

  /* ---------- the offers: three cards at a time ---------- */
  const CARDS = {
    hotel() {
      const price = distinct(3, 18, 95, 1, 8), min = shuffle([3, 5, 8, 10, 12, 15, 20, 25, 30, 35, 40]).slice(0, 3);
      const cards = shuffle(HOTELS).slice(0, 3).map((n, i) => ({ e: '🏨', name: n, price: price[i], min: min[i], bf: rnd() < .5 }));
      cards.forEach(c => { c.lines = [`€${c.price} / night`, `${c.min} minutes from the center`, c.bf ? 'breakfast included' : 'no breakfast']; });
      return { cards, city: pick(CITIES) };
    },
    transport() {
      const city = pick(CITIES);
      const cards = shuffle(MODES).slice(0, 3).map(m => ({ e: m.e, name: m.n, plane: m.n === 'Plane', price: rint(...m.p), h: rint(...m.h) }));
      cards.forEach(c => { c.lines = [`€${c.price} one way`, `${c.h} hour${c.h === 1 ? '' : 's'}`]; });
      return { cards, city };
    },
    activity() {
      const price = distinct(3, 4, 30, 1, 3);
      const cards = shuffle(ACTS).slice(0, 3).map((a, i) => ({ e: a.e, name: a.n, say: a.say, price: price[i], h: rint(1, 4) }));
      cards.forEach(c => { c.lines = [`€${c.price} per person`, `${c.h} hour${c.h === 1 ? '' : 's'}`]; });
      return { cards, city: pick(CITIES) };
    },
  };

  // the requests: d = first day it can appear; f(cards, set) → { say, pred } (pred says if one offer is right)
  const lowest = (cards, key, ok = () => true) => { const v = cards.filter(ok).map(c => c[key]); return v.length ? Math.min(...v) : NaN; };
  const highest = (cards, key) => Math.max(...cards.map(c => c[key]));
  const MAKERS = {
    hotel: [
      { d: 1, f: cards => ({ say: pick(['Hello! I’d like the cheapest room, please.', 'Good morning. Could I have the cheapest hotel?']), pred: c => c.price === lowest(cards, 'price') }) },
      { d: 1, f: cards => ({ say: pick(['Could I have the hotel closest to the center?', 'I’d like a hotel close to the center. The closest, please!']), pred: c => c.min === lowest(cards, 'min') }) },
      { d: 1, f: cards => ({ say: 'It’s our wedding trip! I’d like the most expensive hotel, please.', pred: c => c.price === highest(cards, 'price') }) },
      { d: 2, f: cards => { const cheap = cards.find(c => c.price === lowest(cards, 'price')); if (cheap.bf) return null;     // trap: the cheapest has no breakfast
          return { say: 'I’d like the cheapest hotel, but breakfast must be included.', pred: c => c.bf && c.price === lowest(cards, 'price', a => a.bf) }; } },
      { d: 3, f: cards => { const near = cards.find(c => c.min === lowest(cards, 'min')); const x = rint(30, 85); if (near.price <= x) return null;     // trap: the closest is too dear
          return { say: `I want the closest hotel to the center, but I can’t pay more than €${x} per night.`, pred: c => c.price <= x && c.min === lowest(cards, 'min', a => a.price <= x) }; } },
      { d: 2, f: cards => { const x = rint(25, 90); return { say: `Could I have a room with breakfast? I can’t pay more than €${x} a night.`, pred: c => c.bf && c.price <= x }; } },
      { d: 2, f: cards => { const n = rint(2, 4), t = rint(8, 30) * 10; return { say: `We’re staying ${n} nights and we have only €${t} in total. Which hotel can we pay?`, pred: c => c.price * n <= t }; } },
      { d: 3, f: cards => { const m = pick([10, 15, 20, 30]), x = rint(30, 85); return { say: `I’d like to be less than ${m} minutes from the center, and I can’t pay more than €${x} per night.`, pred: c => c.min < m && c.price <= x }; } },
    ],
    transport: [
      { d: 1, f: (cards, s) => ({ say: `I’d like to go to ${s.city}. What’s the cheapest way?`, pred: c => c.price === lowest(cards, 'price') }) },
      { d: 1, f: (cards, s) => ({ say: `I’d like to go to ${s.city}, and I’m in a hurry! The fastest way, please.`, pred: c => c.h === lowest(cards, 'h') }) },
      { d: 2, f: (cards, s) => ({ say: `I’m afraid of flying. Could I have the cheapest way to ${s.city}?`, pred: c => !c.plane && c.price === lowest(cards, 'price', a => !a.plane) }) },
      { d: 2, f: (cards, s) => { const x = rint(30, 140); return { say: `I have only €${x}. What’s the fastest way to ${s.city} I can pay?`, pred: c => c.price <= x && c.h === lowest(cards, 'h', a => a.price <= x) }; } },
      { d: 2, f: (cards, s) => { const fast = cards.find(c => c.h === lowest(cards, 'h')); if (!fast.plane) return null;     // trap: the fastest is the plane, but…
          return { say: pick([`I’m in a rush, but I have a fear of flying. Could I have the fastest way to ${s.city}?`, `I’m late! But I never fly. What’s the fastest way to ${s.city}, please?`]), pred: c => !c.plane && c.h === lowest(cards, 'h', a => !a.plane) }; } },
      { d: 3, f: (cards, s) => { const h = rint(3, 8); return { say: `I want to arrive in ${s.city} in less than ${h} hours, but I don’t want to spend a lot. The cheapest, please!`, pred: c => c.h < h && c.price === lowest(cards, 'price', a => a.h < h) }; } },
    ],
    activity: [
      { d: 1, f: cards => { const t = pick(cards); return { say: pick(t.say), pred: c => c.name === t.name }; } },
      { d: 1, f: cards => ({ say: 'I’m a student, so the cheapest visit, please.', pred: c => c.price === lowest(cards, 'price') }) },
      { d: 2, f: cards => { const n = rint(3, 5), t = rint(6, 30) * 5; return { say: `We’re ${n} people and we have €${t}. Which visit can we pay?`, pred: c => c.price * n <= t }; } },
      { d: 2, f: cards => { const cheap = cards.find(c => c.price === lowest(cards, 'price')); if (!/museum/.test(cheap.name)) return null;     // trap: the cheapest is a museum
          return { say: 'I’m a student, but I hate museums. What’s the cheapest visit?', pred: c => !/museum/.test(c.name) && c.price === lowest(cards, 'price', a => !/museum/.test(a.name)) }; } },
      { d: 3, f: cards => ({ say: 'We have a lot of time today: we want the longest visit!', pred: c => c.h === highest(cards, 'h') }) },
    ],
  };
  // a request is good when exactly ONE of the three offers fits
  function build(kind, day) {
    for (let t = 0; t < 300; t++) {
      const set = CARDS[kind]();
      const m = t < 200 ? pick(MAKERS[kind].filter(x => x.d <= day)) : MAKERS[kind][0];
      const r = m.f(set.cards, set);
      if (r && set.cards.filter(r.pred).length === 1) return { ...r, cards: set.cards, city: set.city, lvl: m.d };
    }
    throw new Error('no request for ' + kind);
  }
  const pickKind = () => { let x = rnd() * 100; for (const [k, v] of Object.entries(KIND)) { if ((x -= v.w) < 0) return k; } return 'hotel'; };

  /* ---------- the pop-up ---------- */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="gq-overlay trip-modal ta-modal" id="taModal" role="dialog" aria-modal="true" aria-labelledby="taTitle" hidden>
      <div class="gq-box ta-box">
        <div class="gq-top">
          <span class="gq-title" id="taTitle">Travel Agent</span>
          <button type="button" class="gq-close" id="taClose" aria-label="Close">✕</button>
        </div>
        <div class="gq-area ta-area" id="taArea"></div>
      </div>
    </div>`);
  const modal = $('taModal'), area = $('taArea');

  let day = 1, left = 0, money = 0, all = [], q = [], cur = null, spawnIn = 0, phase = 'closed', raf = 0, run = 0, last = 0, uid = 0;
  let today = null, refs = new Map(), deskRef = null, hud = {}, spawned = 0;
  let net = null, pushT = 0;      // net: the room when two devices play (see "online")

  const rating = () => { const r = [4, 4, 4, ...all.map(v => v.s)].slice(-8); return r.reduce((a, b) => a + b, 0) / r.length; };
  const crowd = () => { if (net) return 1;  const r = rating(); return r >= 4.5 ? .85 : r >= 3.5 ? 1 : r >= 2.5 ? 1.35 : 1.9; };   // the lower the rating, the fewer the customers
  const moodOf = f => (f > .6 ? '😀' : f > .35 ? '🙂' : f > .15 ? '😐' : '😠');
  const barCls = f => (f > .5 ? 'ok' : f > .25 ? 'mid' : 'low');

  /* ---------- screens ---------- */
  function intro() {
    netLeave(); cancelAnimationFrame(raf); run++; phase = 'intro';
    const best = recall('taBest');
    area.innerHTML = `<div class="ta-say-box">
      <h4>Welcome to your travel agency!</h4>
      <p>Customers arrive and <b>wait in line</b>. Serve them before they get angry. You have <b>${DAYS} days</b>, ${DAY_S} seconds each.</p>
      <ol class="ta-steps">
        <li><span>👆</span><div><b>Click a customer</b> in the line and read what they want.</div></li>
        <li><span>✅</span><div>Click the <b>one offer</b> that fits the request. A wrong offer makes the customer lose patience!</div></li>
        <li><span>⭐</span><div><b>Quick and right</b> = 5 stars and more money. <b>Angry customers</b> leave 1 star and you pay them back <b>€${REFUND}</b>.</div></li>
        <li><span>🏠</span><div>Every evening you pay the <b>rent</b>. No money left, or too few stars (people stop coming)? <b>The agency closes.</b></div></li>
      </ol>
      <p class="ta-words"><b>Useful words:</b> cheap → cheaper → <i>the cheapest</i> · close → closer → <i>the closest</i> · fast → faster → <i>the fastest</i> · per night · per person · in total</p>
      ${best ? `<p class="ta-best">🏆 Your best: ${best.d} day${best.d === 1 ? '' : 's'} · €${best.m}</p>` : ''}
      <div class="ta-btns"><button type="button" class="ta-btn go" id="taGo">▶ Open the agency</button><button type="button" class="ta-btn" id="taOnline">👥 Play with a friend</button></div></div>`;
    $('taGo').addEventListener('click', () => { netLeave(); day = 1; money = START_MONEY; all = []; startDay(); });
    $('taOnline').addEventListener('click', () => netMenu());
  }

  function startDay() {
    run++; phase = 'play'; left = DAY_S * 1000; q = []; cur = null; spawnIn = 0; uid = 0; spawned = 0;
    today = { served: 0, happy: 0, unhappy: 0, turned: 0, earned: 0, refunds: 0, st: [] };
    area.innerHTML = `<div class="ta">
      <div class="ta-hud">
        <span class="ta-chip" id="taDay"></span>
        <span class="ta-chip time"><i id="taTimeBar"></i><b id="taTime"></b></span>
        <span class="ta-chip money" id="taMoney"></span>
        <span class="ta-chip rate" id="taRate"></span>
        ${net ? '<span class="ta-chip opp" id="taOpp"></span>' : ''}
      </div>
      <div class="ta-queue" id="taQueue" aria-label="The line"></div>
      <div class="ta-desk" id="taDesk"></div>
      <div class="ta-reviews" id="taRev" aria-live="polite"></div>
      <div class="ta-pops" id="taPops"></div></div>`;
    hud = { opp: $('taOpp'), day: $('taDay'), bar: $('taTimeBar'), time: $('taTime'), money: $('taMoney'), rate: $('taRate') };
    $('taQueue').addEventListener('click', e => { const b = e.target.closest('.ta-slot[data-id]'); if (b) take(+b.dataset.id); });
    $('taDesk').addEventListener('click', e => { const b = e.target.closest('.ta-card'); if (b && !b.disabled) choose(+b.dataset.i); });
    drawQueue(); drawDesk(); drawReviews(); drawHud(); oppChip();
    last = performance.now(); raf = requestAnimationFrame(frame);
  }

  /* ---------- drawing ---------- */
  function drawHud() {
    const r = rating(), sec = Math.max(0, Math.ceil(left / 1000));
    hud.day.textContent = `📅 Day ${day} / ${DAYS}`;
    hud.time.textContent = `⏱ ${sec}s`;
    hud.bar.style.width = `${Math.max(0, left / (DAY_S * 10))}%`;
    hud.money.textContent = `💰 €${money}`;
    hud.money.classList.toggle('neg', money < 40);
    hud.rate.innerHTML = `<span class="st">${stars(Math.round(r))}</span> ${r.toFixed(1)}`;
    hud.rate.classList.toggle('neg', r < 2.8);
  }
  function drawQueue() {
    refs = new Map();
    const slots = [];
    for (let i = 0; i < QMAX; i++) {
      const c = q[i];
      slots.push(c
        ? `<button type="button" class="ta-slot ${cur === c ? 'on' : ''} ${c.shown ? 'old' : ''}" data-id="${c.id}" aria-label="Customer ${i + 1}"><span class="who">${c.face}</span>${net && net.opp && net.opp.cur === c.key ? '<span class="eye" title="Your friend is serving this customer">👀</span>' : ''}<span class="kind">${KIND[c.kind].ico}</span><span class="mood"></span><span class="bar"><i></i></span></button>`
        : '<span class="ta-slot empty"></span>');
    }
    $('taQueue').innerHTML = `<span class="ta-door">🚪<small>door</small></span>${slots.join('')}<span class="ta-desk-sign">🧑‍💼<small>you</small></span>`;
    q.forEach(c => { c.shown = true; });
    $('taQueue').querySelectorAll('.ta-slot[data-id]').forEach(b => {
      refs.set(+b.dataset.id, { bar: b.querySelector('.bar i'), mood: b.querySelector('.mood'), el: b });
    });
    paintBars();
  }
  function drawDesk() {
    const box = $('taDesk'); deskRef = null;
    if (!cur) {
      box.innerHTML = `<div class="ta-idle">${q.length ? '👆 Click a customer in the line.' : '☕ Waiting for the next customer…'}</div>`;
      return;
    }
    const c = cur, k = KIND[c.kind];
    box.innerHTML = `<div class="ta-say"><div class="who">${c.face}<span class="mood"></span></div>
        <div class="bub"><small>${k.ico} ${k.name} · 📍 ${esc(c.req.city)}</small><p>“${esc(c.req.say)}”</p><span class="bar"><i></i></span></div></div>
      <div class="ta-cards">${c.req.cards.map((o, i) => `<button type="button" class="ta-card" data-i="${i}"><span class="e">${o.e}</span><b>${esc(o.name)}</b>${o.lines.map(l => `<i>${esc(l)}</i>`).join('')}<kbd>${i + 1}</kbd></button>`).join('')}</div>
      <p class="ta-msg" id="taMsg"></p>`;
    deskRef = { bar: box.querySelector('.bar i'), mood: box.querySelector('.mood') };
    paintBars();
  }
  function drawReviews() {
    const r = all.slice(-3).reverse();
    $('taRev').innerHTML = r.length
      ? r.map(v => `<div class="ta-rv s${v.s}"><span>${v.face}</span><b class="st">${stars(v.s)}</b><i>“${esc(v.t)}”</i></div>`).join('')
      : '<div class="ta-rv none">The customers’ reviews will appear here.</div>';
  }
  function paintBars() {
    for (const c of q) {
      const r = refs.get(c.id); if (!r) continue;
      const f = Math.max(0, c.pat / c.max);
      r.bar.style.width = `${f * 100}%`; r.bar.className = barCls(f); r.mood.textContent = moodOf(f);
    }
    if (cur && deskRef) {
      const f = Math.max(0, cur.pat / cur.max);
      deskRef.bar.style.width = `${f * 100}%`; deskRef.bar.className = barCls(f); deskRef.mood.textContent = moodOf(f);
    }
  }
  function pop(html, cls) {
    const box = $('taPops'); if (!box) return;      // a screen without the line (the end of a day, the wait)
    const el = document.createElement('div');
    el.className = `ta-pop ${cls || ''}`; el.innerHTML = html;
    box.appendChild(el);
    const r = run; setTimeout(() => { if (r === run) el.remove(); }, 2200);
  }

  /* ---------- the day ---------- */
  function spawn() {
    const n = ++spawned, key = `${day}_${n}`;
    if (net && net.taken.has(key)) return;        // the friend has served him already
    if (net) rnd = mulberry(hash(`${net.seed}:${key}`));     // the same customer on both devices
    let c;
    try {
      c = { id: ++uid, key, face: pick(FACES), kind: pickKind() };
      c.req = build(c.kind, day);
      c.max = c.pat = PATIENCE[day - 1] * 1000 * (.9 + rnd() * .25) * (1 + (c.req.lvl - 1) * .12);
      c.wrong = 0;
    } finally { rnd = Math.random; }
    if (q.length >= QMAX) {                       // the line is too long: the customer goes away
      review(c, 2, 'The line was too long.'); today.turned++;
      pop(`${c.face} The line is too long: a customer went away! <b>★★☆☆☆</b>`, 'bad');
      return;
    }
    q.push(c); drawQueue();
    if (!cur) drawDesk();
  }
  function review(c, s, text) { const v = { s, t: text || pick(REVIEW[s]), face: c.face }; all.push(v); today.st.push(s); drawReviews(); return v; }

  function take(id) {
    const c = q.find(x => x.id === id); if (!c || c === cur || phase !== 'play') return;
    cur = c; drawQueue(); drawDesk(); pushMy({ cur: c.key });
  }
  function leave(c) {
    q = q.filter(x => x !== c);
    if (cur === c) { cur = null; pushMy({ cur: null }); }
    drawQueue(); drawDesk();
  }
  function choose(i) {
    if (!cur || phase !== 'play') return;
    const c = cur, o = c.req.cards[i];
    if (c.req.pred(o)) {
      const f = c.pat / c.max, base = f > .6 ? 5 : f > .4 ? 4 : f > .2 ? 3 : 2, s = Math.max(1, base - c.wrong), earn = pay(s);
      money += earn; today.earned += earn; today.served++; if (s >= 4) today.happy++;
      const v = review(c, s);
      pop(`${c.face} <b>${stars(s)}</b> <span>+€${earn}</span>`, 'good');
      if (net) { const t = Date.now(); net.mine.set(c.key, { t, earn, s, v }); net.taken.add(c.key); rooms().update(net.code, { [`fm.s${net.gid}_${c.key}_${net.me}`]: { t } }).catch(() => {}); }
      leave(c); drawHud(); pushMy({ c: money });
    } else {
      c.wrong++; c.pat = Math.max(1, c.pat - c.max * WRONG_COST);
      const b = $('taDesk').querySelector(`.ta-card[data-i="${i}"]`);
      if (b) { b.disabled = true; b.classList.add('bad'); }
      $('taMsg').textContent = pick(['That’s not what I asked for!', 'No, no… read it again!', 'Hmm, that’s wrong.']);
      paintBars();
    }
  }
  function angry(c) {
    money -= REFUND; today.refunds += REFUND; today.unhappy++;
    review(c, 1);
    pop(`${c.face} 😠 left angry! <b>★☆☆☆☆</b> <span>−€${REFUND}</span>`, 'bad');
    leave(c); drawHud(); pushMy({ c: money });
  }

  function frame(now) {
    const dt = Math.min(200, now - last); last = now;
    tick(dt);
    if (phase === 'play') raf = requestAnimationFrame(frame);
  }
  // one step of the clock (the frames call it; the tests too)
  function tick(dt) {
    if (phase !== 'play') return;
    left -= dt;
    spawnIn -= dt;
    if (spawnIn <= 0 && left > 0) { spawn(); spawnIn = GAP[day - 1] * 1000 * crowd() * (.8 + (net ? mulberry(hash(`${net.seed}:${day}:gap${spawned}`))() : Math.random()) * .4); }
    for (const c of q.slice()) {
      c.pat -= dt;
      if (c.pat <= 0) angry(c);
    }
    if (phase !== 'play') return;
    if (lose()) return;
    if (left <= 0) { endDay(); return; }
    paintBars(); drawHud(); schedulePush();
  }
  // false while the agency is open
  function lose() {
    if (money < 0) { over('bankrupt'); return true; }
    if (all.length >= 5 && rating() < 2) { over('reputation'); return true; }
    return false;
  }

  /* ---------- the end of a day, of the game ---------- */
  function endDay() {
    phase = 'summary'; cancelAnimationFrame(raf); run++;
    const rent = Math.round(RENT[day - 1] * (net ? .6 : 1)),   // online the customers are shared: a lower rent
       avg = today.st.length ? (today.st.reduce((a, b) => a + b, 0) / today.st.length).toFixed(1) : '–';
    const before = money;
    money -= rent;
    const broke = money < 0, won = !broke && day === DAYS;
    if (net) pushMy({ end: day });
    area.innerHTML = `<div class="ta-say-box">
      <h4>🌙 Closing time · day ${day}</h4>
      <table class="ta-tab"><tbody>
        <tr><td>Customers served</td><td>${today.served}</td></tr>
        <tr><td>Happy customers (4–5 stars)</td><td>${today.happy}</td></tr>
        <tr><td>Angry customers</td><td>${today.unhappy + today.turned}</td></tr>
        <tr><td>Stars today (average)</td><td>${avg === '–' ? avg : `⭐ ${avg}`}</td></tr>
        <tr><td>Rating of the agency</td><td>⭐ ${rating().toFixed(1)}</td></tr>
        <tr class="sep"><td>You earned</td><td class="plus">+€${today.earned}</td></tr>
        <tr><td>You paid back</td><td class="minus">−€${today.refunds}</td></tr>
        <tr><td>Rent of the agency</td><td class="minus">−€${rent}</td></tr>
        <tr class="tot"><td>Money</td><td>€${before} → <b>€${money}</b></td></tr>
      </tbody></table>
      ${net ? '<p class="ta-note" id="taOppLine"></p>' : ''}
      ${broke ? '' : `<p class="ta-note">${money < 60 ? '⚠️ Careful: you have little money. Serve the customers faster!' : 'Well done! Tomorrow there will be more customers, and they will be less patient.'}</p>`}
      <div class="ta-btns"><button type="button" class="ta-btn go" id="taNext">${broke ? 'Oh no…' : won ? '🏆 See your result' : `▶ Day ${day + 1}`}</button></div></div>`;
    $('taNext').addEventListener('click', () => {
      if (broke) over('bankrupt');
      else if (net) {      // wait until the friend is ready too
        net.final = won; net.ready = won ? 99 : day + 1; phase = 'wait';
        area.innerHTML = `<div class="ta-say-box ta-end"><h4>${won ? '🏁 Last evening' : '🌙 Ready for day ' + (day + 1)}</h4><p class="ta-msg ok" id="taWaitTxt">⏳</p></div>`;
        pushMy({ rd: net.ready }); onlineSync(net.room?.fm || {});
      } else if (won) over('win'); else { day++; startDay(); }
    });
    if (net) onlineSync(net.room?.fm || {});
  }
  function over(why) {
    if (net) { netLost(why); return; }
    phase = 'over'; cancelAnimationFrame(raf); run++;
    const days = why === 'win' ? DAYS : day - 1;       // the days that were survived
    const r = rating().toFixed(1), m = Math.max(0, money), ok = why === 'win';
    if (ok || days > 0) {
      const best = recall('taBest');
      if (!best || days > best.d || (days === best.d && m > best.m)) store('taBest', { d: days, m });
    }
    const t = {
      win: ['🏆 Your agency is a success!', `You survived <b>${DAYS} days</b> with <b>€${money}</b> and a rating of <b>⭐ ${r}</b>. The customers love you!`],
      bankrupt: ['💸 Bankrupt!', 'You have no money left: you can’t pay the refunds and the rent. Be faster, and choose the right offer the first time!'],
      reputation: ['😠 Nobody comes anymore…', `Your rating is <b>⭐ ${r}</b>. Too many angry customers wrote bad reviews, so people stopped coming. The agency is closed.`],
    }[why];
    area.innerHTML = `<div class="ta-say-box ta-end ${ok ? 'win' : 'lose'}">
      <h2>${t[0]}</h2><p>${t[1]}</p>
      <div class="ta-reviews">${all.slice(-3).reverse().map(v => `<div class="ta-rv s${v.s}"><span>${v.face}</span><b class="st">${stars(v.s)}</b><i>“${esc(v.t)}”</i></div>`).join('')}</div>
      <div class="ta-btns"><button type="button" class="ta-btn go" id="taAgain">↻ Try again</button><button type="button" class="ta-btn" id="taDone">Close</button></div></div>`;
    $('taAgain').addEventListener('click', intro);
    $('taDone').addEventListener('click', close);
  }

  /* ---------- online: two devices, one room (book.rooms of cloud.js: the document duels/<CODE>) ---------- */
  // The field `fm` of the room: n0, n1 (the names, 0 = who made the room), gid + seed (a new game), p0, p1 = { d, c, r, end, rd, cur, out }
  // (the day, money, rating, the last day finished, the day it is ready for, the customer it is serving, why its agency closed) and, for every
  // customer served, s<gid>_<day>_<n>_<player> = { t } (the time of the right answer: the earliest one keeps the customer).
  // Every customer comes from the seed, the day and his number: both devices get the same one. Nobody writes the other's fields.
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
  const netMsg = t => { const el = $('taNetErr'); if (el) el.textContent = t; };
  const hash = s => {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  };
  const mulberry = a => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const oppName = () => (net && net.room && net.room.fm && net.room.fm['n' + (1 - net.me)]) || 'Your friend';

  // what this device tells the other: money, rating, the customer it is serving
  function pushMy(patch) {
    if (!net) return;
    Object.assign(net.my, patch, { c: money, r: +rating().toFixed(1) });
    clearTimeout(pushT); pushT = 0;
    try { rooms().update(net.code, { ['fm.p' + net.me]: net.my }).catch(() => {}); } catch { /* offline: the other device just sees nothing new */ }
  }
  function schedulePush() { if (!net || pushT) return; pushT = setTimeout(() => { pushT = 0; pushMy({}); }, 1500); }
  function oppChip() {
    if (!net || !hud.opp) return;
    const o = net.opp;
    hud.opp.textContent = o && o.d ? `🧑 ${oppName()}: €${o.c} · ⭐ ${Number(o.r).toFixed(1)}` : `🧑 ${oppName()}: getting ready…`;
  }

  function netMenu(msg = '') {
    netLeave(); run++; cancelAnimationFrame(raf); phase = 'net';
    area.innerHTML = `<div class="ta-say-box ta-net">
      <h4>👥 Play with a friend</h4>
      <p>Each player uses <b>a different device</b>. You both get <b>the same customers in the same line</b>. The <b>first</b> to give the right offer <b>takes the customer</b>: the other agency loses him! After ${DAYS} days the richest agency wins.</p>
      <label class="ta-nm">My name <input id="taName" type="text" maxlength="18" autocomplete="off" placeholder="e.g. Maya" value="${esc(netName)}"></label>
      <div class="ta-netcols">
        <div class="ta-netbox"><b>🆕 Make a room</b><span>You get a 4-letter code. Tell it to your friend.</span><button type="button" class="ta-btn go" id="taMake">Make a room</button></div>
        <div class="ta-netbox"><b>🔑 Join a room</b><span>Write the code of your friend.</span><input id="taCode" type="text" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD" aria-label="Room code"><button type="button" class="ta-btn" id="taJoin">Join ▶</button></div>
      </div>
      <p class="ta-msg" id="taNetErr" aria-live="polite">${esc(msg)}</p>
      <div class="ta-btns"><button type="button" class="ta-btn" id="taNetBack">◀ Back</button></div></div>`;
    $('taMake').addEventListener('click', () => netEnter(true));
    $('taJoin').addEventListener('click', () => netEnter(false));
    $('taCode').addEventListener('keydown', e => { if (e.key === 'Enter') netEnter(false); });
    $('taNetBack').addEventListener('click', intro);
  }
  async function netEnter(make) {
    const R = rooms();
    netName = ($('taName').value || '').trim().slice(0, 18);
    if (!R) { netMsg('Online play needs the internet. Try again in a moment.'); return; }
    let code;
    if (!make) {
      code = ($('taCode').value || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (code.length !== 4) { netMsg('The code has 4 letters.'); return; }
    }
    netMsg(make ? 'Making the room…' : 'Joining…');
    try {
      let me = 0;
      if (make) code = await R.create(clientId); else me = await R.join(code, clientId);
      net = { code, me, unsub: null, room: null, gid: 0, seed: '', mine: new Map(), taken: new Set(), my: {}, opp: null, ready: 0, final: false };
      await R.update(code, { [`fm.n${me}`]: netName || `Player ${me + 1}` });
      if (net) net.unsub = R.watch(code, onRoom, e => netMsg(netText(e)));
    } catch (e) { net = null; netMsg(netText(e)); }
  }
  function netLeave() {
    if (!net) return;
    const st = net;
    net = null; clearTimeout(pushT); pushT = 0;
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
      area.innerHTML = '<div class="ta-say-box ta-end"><h2>👋</h2><p>Your friend left the game.</p><div class="ta-btns"><button type="button" class="ta-btn" id="taBackMenu">Back to the menu</button></div></div>';
      $('taBackMenu').addEventListener('click', intro);
      return;
    }
    if (!m.gid) { netLobby(m); return; }
    if (m.gid !== net.gid) { net.gid = m.gid; net.seed = m.seed; startOnline(); return; }
    onlineSync(m);
  }
  function netLobby(m) {
    const host = net.me === 0;
    area.innerHTML = `<div class="ta-say-box ta-net">
      <h4>Travel Agent online</h4>
      <p>Room code: <b class="ta-roomcode">${net.code}</b></p>
      <ol class="ta-lobby">${[0, 1].map(i => `<li class="${m['n' + i] ? 'on' : ''}">🧑‍💼 <b>${m['n' + i] ? esc(m['n' + i]) : '…'}</b>${i === net.me ? ' <small>(you)</small>' : ''}</li>`).join('')}</ol>
      <p class="ta-msg ok">${!m.n1 ? 'Tell this code to your friend: they choose “Join a room”.' : host ? 'Your friend is here! Press Start when you are ready.' : `Waiting for ${esc(m.n0 || 'your friend')} to start…`}</p>
      <p class="ta-msg" id="taNetErr" aria-live="polite"></p>
      <div class="ta-btns"><button type="button" class="ta-btn" id="taLeave">Leave</button>${host ? `<button type="button" class="ta-btn go" id="taStart" ${m.n1 ? '' : 'disabled'}>🎲 Start!</button>` : ''}</div></div>`;
    $('taLeave').addEventListener('click', () => { netLeave(); netMenu(); });
    if (host) $('taStart').addEventListener('click', netStart);
  }
  // the host draws the seed of a new game: from it come all the customers of both players
  async function netStart() {
    if (!net) return;
    const m = net.room?.fm || {};
    try { await rooms().update(net.code, { 'fm.gid': (m.gid || 0) + 1, 'fm.seed': Math.random().toString(36).slice(2, 8), 'fm.p0': null, 'fm.p1': null, 'fm.left': null }); }
    catch (e) { netMsg(netText(e)); }
  }
  function startOnline() {
    day = 1; money = START_MONEY; all = []; today = { served: 0, happy: 0, unhappy: 0, turned: 0, earned: 0, refunds: 0, st: [] };
    net.mine = new Map(); net.taken = new Set(); net.opp = null; net.ready = 0; net.final = false;
    net.my = { d: 1, end: 0, rd: 0, cur: null, out: null };
    pushMy({});
    countdown(startDay);
  }
  function countdown(then) {
    phase = 'count'; run++; cancelAnimationFrame(raf);
    const r = run; let n = 3;
    const step = () => {
      if (r !== run || phase === 'closed') return;
      area.innerHTML = `<div class="ta-say-box ta-end"><h4>${net ? `You and ${esc(oppName())}` : ''} · day ${day}</h4><h2>${n || 'Go!'}</h2><p>The same customers come to both agencies. Be the first!</p></div>`;
      if (n === 0) { setTimeout(() => { if (r === run) then(); }, 600); return; }
      n--; setTimeout(step, 800);
    };
    step();
  }
  // the room changed: what the friend did (customers taken, money, the end of a day), and what to do next
  function onlineSync(m) {
    const o = net.me ? 0 : 1, opp = m['p' + o] || {}, oname = oppName();
    const prev = net.opp && net.opp.cur;
    net.opp = opp;
    // the customers the friend has served: if I have served him too, the earliest answer keeps him
    const pre = `s${net.gid}_`, post = `_${o}`;
    for (const f in m) {
      if (!f.startsWith(pre) || !f.endsWith(post) || !m[f]) continue;
      const key = f.slice(pre.length, -post.length), mine = net.mine.get(key);
      if (mine && (m[f].t < mine.t || (m[f].t === mine.t && net.me === 1))) undo(key, oname);
      if (net.taken.has(key)) continue;
      net.taken.add(key);
      const c = q.find(x => x.key === key);
      if (c) { pop(`${c.face} <b>${esc(oname)}</b> was faster: the customer is gone!`, 'bad'); leave(c); }
    }
    oppChip();
    if (phase === 'play' && prev !== opp.cur) drawQueue();
    if (opp.out && phase !== 'over') { netWon(opp.out); return; }
    const line = $('taOppLine'); if (line) line.innerHTML = opp.end >= day ? `${esc(oname)} finished day ${day} with <b>€${opp.c}</b> · ⭐ ${Number(opp.r).toFixed(1)}.` : `⏳ ${esc(oname)} is still working…`;
    if (phase === 'wait') {
      const w = $('taWaitTxt');
      if (net.final) { if ((opp.end || 0) >= DAYS) netResult(opp); else if (w) w.textContent = `Waiting for ${oname} to finish day ${DAYS}…`; }
      else if ((opp.rd || 0) >= net.ready) countdown(() => { day++; startDay(); });
      else if (w) w.textContent = `Waiting for ${oname} to be ready…`;
    }
  }
  // both answered the same customer and the friend was first: it is his
  function undo(key, oname) {
    const m = net.mine.get(key); if (!m) return;
    net.mine.delete(key); net.taken.add(key);
    money -= m.earn; today.earned -= m.earn; today.served--; if (m.s >= 4) today.happy--;
    const i = all.indexOf(m.v); if (i >= 0) all.splice(i, 1);
    const j = today.st.indexOf(m.s); if (j >= 0) today.st.splice(j, 1);
    if (phase === 'play') { drawReviews(); drawHud(); pop(`😮 ${esc(oname)} was faster! <span>−€${m.earn}</span>`, 'bad'); }
    pushMy({});
  }
  function netEndScreen(h, p, cls) {
    phase = 'over'; cancelAnimationFrame(raf); run++;
    const host = net && net.me === 0;
    area.innerHTML = `<div class="ta-say-box ta-end ${cls}"><h2>${h}</h2><p>${p}</p>
      <div class="ta-btns">${!net ? '' : host ? '<button type="button" class="ta-btn go" id="taAgain">↻ Play again</button>' : '<span class="ta-msg ok">Your friend can start a new game.</span>'}<button type="button" class="ta-btn" id="taDone">Close</button></div></div>`;
    $('taAgain')?.addEventListener('click', netStart);
    $('taDone').addEventListener('click', close);
  }
  // after the last evening: the richest agency wins
  function netResult(opp) {
    const mine = rating(), theirs = Number(opp.r) || 0, oname = esc(oppName());
    const res = money > opp.c ? 'win' : money < opp.c ? 'lose' : mine > theirs ? 'win' : mine < theirs ? 'lose' : 'draw';
    const head = { win: '🏆 Your agency is the best!', lose: `🏘 ${oname}’s agency is the best`, draw: '🤝 It’s a draw!' }[res];
    netEndScreen(head, `After ${DAYS} days: you have <b>€${money}</b> and <b>⭐ ${mine.toFixed(1)}</b>, ${oname} has <b>€${opp.c}</b> and <b>⭐ ${theirs.toFixed(1)}</b>.`, res === 'lose' ? 'lose' : 'win');
  }
  function netWon(why) {
    const oname = esc(oppName());
    netEndScreen('🏆 You win!', `${oname}’s agency is closed: ${why === 'bankrupt' ? 'no money left' : 'too many angry customers, so people stopped coming'}. You still have <b>€${Math.max(0, money)}</b> and <b>⭐ ${rating().toFixed(1)}</b>.`, 'win');
  }
  function netLost(why) {
    pushMy({ out: why });
    const oname = esc(oppName());
    netEndScreen(why === 'bankrupt' ? '💸 Bankrupt!' : '😠 Nobody comes anymore…', `${why === 'bankrupt' ? 'You have no money left.' : `Your rating is <b>⭐ ${rating().toFixed(1)}</b>: too many angry customers.`} Your agency is closed: <b>${oname} wins</b>.`, 'lose');
  }

  /* ---------- open and close ---------- */
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
  $('taClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    else if (phase === 'play' && /^[1-3]$/.test(e.key) && cur && cur.req.cards[+e.key - 1]) choose(+e.key - 1);
    e.stopPropagation();
  }, true);
  document.querySelectorAll('[data-trip="agency"]').forEach(b => b.addEventListener('click', open));
  window.TRIP_AGENCY = {
    open, close,
    _test: {
      build, tick, take, choose, KIND, DAYS, QMAX,
      start(d = 1) { modal.hidden = false; day = d; money = START_MONEY; all = []; startDay(); },
      get s() { return { day, left, money, q, cur, phase, all, rating: rating(), today }; },
    },
  };
})();
