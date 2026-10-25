// School trip (p. 320, "Money"): "Travel Agent", a timed game for the PC (pop-up, on your own), in the spirit of Cooking Fever.
// The pupil runs a travel agency for 5 days (70 seconds each). Customers arrive and WAIT IN LINE (5 places), every one with a patience bar.
//  · Click a customer, read the request (cheapest / closest / "less than €60"…) and click the ONE right offer among three.
//  · Quick and right = 5 stars and good money; slow, or a wrong offer first = fewer stars. A customer who waits too long leaves ANGRY:
//    1 star and a refund. A line that is too long turns people away too (2 stars, no refund).
//  · The rating is the average of the last 8 reviews. A bad rating means fewer customers (they stop coming): below 2 stars the agency is closed.
//  · Every evening the rent is paid. Money below zero = bankrupt. Survive 5 days and the agency is a success.
// The requests are made on the spot from random offers and are checked: exactly ONE offer fits (see build()).
// They revise the chapter: polite requests, prices (per night / in total, per person), comparatives and superlatives, travel words.
// Opened by a button with data-trip="agency" (page 320, left).

(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const store = (k, v) => { try { saved[k] = v; persist(); } catch { /* script.js not ready: skip */ } };
  const recall = k => { try { return saved[k]; } catch { return undefined; } };
  // n different numbers from lo to hi (every step), at least `gap` apart
  const distinct = (n, lo, hi, step = 1, gap = 1) => {
    const out = [];
    for (let g = 0; out.length < n && g < 500; g++) {
      const v = lo + step * Math.floor(Math.random() * ((hi - lo) / step + 1));
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
      const cards = shuffle(HOTELS).slice(0, 3).map((n, i) => ({ e: '🏨', name: n, price: price[i], min: min[i], bf: Math.random() < .5 }));
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
  const pickKind = () => { let x = Math.random() * 100; for (const [k, v] of Object.entries(KIND)) { if ((x -= v.w) < 0) return k; } return 'hotel'; };

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
  let today = null, refs = new Map(), deskRef = null, hud = {};

  const rating = () => { const r = [4, 4, 4, ...all.map(v => v.s)].slice(-8); return r.reduce((a, b) => a + b, 0) / r.length; };
  const crowd = () => { const r = rating(); return r >= 4.5 ? .85 : r >= 3.5 ? 1 : r >= 2.5 ? 1.35 : 1.9; };   // the lower the rating, the fewer the customers
  const moodOf = f => (f > .6 ? '😀' : f > .35 ? '🙂' : f > .15 ? '😐' : '😠');
  const barCls = f => (f > .5 ? 'ok' : f > .25 ? 'mid' : 'low');

  /* ---------- screens ---------- */
  function intro() {
    cancelAnimationFrame(raf); run++; phase = 'intro';
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
      <div class="ta-btns"><button type="button" class="ta-btn go" id="taGo">▶ Open the agency</button></div></div>`;
    $('taGo').addEventListener('click', () => { day = 1; money = START_MONEY; all = []; startDay(); });
  }

  function startDay() {
    run++; phase = 'play'; left = DAY_S * 1000; q = []; cur = null; spawnIn = 0; uid = 0;
    today = { served: 0, happy: 0, unhappy: 0, turned: 0, earned: 0, refunds: 0, st: [] };
    area.innerHTML = `<div class="ta">
      <div class="ta-hud">
        <span class="ta-chip" id="taDay"></span>
        <span class="ta-chip time"><i id="taTimeBar"></i><b id="taTime"></b></span>
        <span class="ta-chip money" id="taMoney"></span>
        <span class="ta-chip rate" id="taRate"></span>
      </div>
      <div class="ta-queue" id="taQueue" aria-label="The line"></div>
      <div class="ta-desk" id="taDesk"></div>
      <div class="ta-reviews" id="taRev" aria-live="polite"></div>
      <div class="ta-pops" id="taPops"></div></div>`;
    hud = { day: $('taDay'), bar: $('taTimeBar'), time: $('taTime'), money: $('taMoney'), rate: $('taRate') };
    $('taQueue').addEventListener('click', e => { const b = e.target.closest('.ta-slot[data-id]'); if (b) take(+b.dataset.id); });
    $('taDesk').addEventListener('click', e => { const b = e.target.closest('.ta-card'); if (b && !b.disabled) choose(+b.dataset.i); });
    drawQueue(); drawDesk(); drawReviews(); drawHud();
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
        ? `<button type="button" class="ta-slot ${cur === c ? 'on' : ''}" data-id="${c.id}" aria-label="Customer ${i + 1}"><span class="who">${c.face}</span><span class="kind">${KIND[c.kind].ico}</span><span class="mood"></span><span class="bar"><i></i></span></button>`
        : '<span class="ta-slot empty"></span>');
    }
    $('taQueue').innerHTML = `<span class="ta-door">🚪<small>door</small></span>${slots.join('')}<span class="ta-desk-sign">🧑‍💼<small>you</small></span>`;
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
    const el = document.createElement('div');
    el.className = `ta-pop ${cls || ''}`; el.innerHTML = html;
    $('taPops').appendChild(el);
    const r = run; setTimeout(() => { if (r === run) el.remove(); }, 2200);
  }

  /* ---------- the day ---------- */
  function spawn() {
    const c = { id: ++uid, face: pick(FACES), kind: pickKind() };
    c.req = build(c.kind, day);
    c.max = c.pat = PATIENCE[day - 1] * 1000 * (.9 + Math.random() * .25) * (1 + (c.req.lvl - 1) * .12);
    c.wrong = 0;
    if (q.length >= QMAX) {                       // the line is too long: the customer goes away
      review(c, 2, 'The line was too long.'); today.turned++;
      pop(`${c.face} The line is too long: a customer went away! <b>★★☆☆☆</b>`, 'bad');
      return;
    }
    q.push(c); drawQueue();
    if (!cur) drawDesk();
  }
  function review(c, s, text) { all.push({ s, t: text || pick(REVIEW[s]), face: c.face }); today.st.push(s); drawReviews(); }

  function take(id) {
    const c = q.find(x => x.id === id); if (!c || c === cur || phase !== 'play') return;
    cur = c; drawQueue(); drawDesk();
  }
  function leave(c) {
    q = q.filter(x => x !== c);
    if (cur === c) cur = null;
    drawQueue(); drawDesk();
  }
  function choose(i) {
    if (!cur || phase !== 'play') return;
    const c = cur, o = c.req.cards[i];
    if (c.req.pred(o)) {
      const f = c.pat / c.max, base = f > .6 ? 5 : f > .4 ? 4 : f > .2 ? 3 : 2, s = Math.max(1, base - c.wrong), earn = pay(s);
      money += earn; today.earned += earn; today.served++; if (s >= 4) today.happy++;
      review(c, s);
      pop(`${c.face} <b>${stars(s)}</b> <span>+€${earn}</span>`, 'good');
      leave(c); drawHud();
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
    leave(c); drawHud();
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
    if (spawnIn <= 0 && left > 0) { spawn(); spawnIn = GAP[day - 1] * 1000 * crowd() * (.8 + Math.random() * .4); }
    for (const c of q.slice()) {
      c.pat -= dt;
      if (c.pat <= 0) angry(c);
    }
    if (phase !== 'play') return;
    if (lose()) return;
    if (left <= 0) { endDay(); return; }
    paintBars(); drawHud();
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
    const rent = RENT[day - 1], avg = today.st.length ? (today.st.reduce((a, b) => a + b, 0) / today.st.length).toFixed(1) : '–';
    const before = money;
    money -= rent;
    const broke = money < 0, won = !broke && day === DAYS;
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
      ${broke ? '' : `<p class="ta-note">${money < 60 ? '⚠️ Careful: you have little money. Serve the customers faster!' : 'Well done! Tomorrow there will be more customers, and they will be less patient.'}</p>`}
      <div class="ta-btns"><button type="button" class="ta-btn go" id="taNext">${broke ? 'Oh no…' : won ? '🏆 See your result' : `▶ Day ${day + 1}`}</button></div></div>`;
    $('taNext').addEventListener('click', () => { if (broke) over('bankrupt'); else if (won) over('win'); else { day++; startDay(); } });
  }
  function over(why) {
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

  /* ---------- open and close ---------- */
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
