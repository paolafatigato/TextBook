// Witch hunt (CLIL, [wh-play]): "The Village Detective", the game for ONE pupil against the computer (the class game with the teacher is witch-game.js).
// An "Among Us" in the Middle Ages: 10 villagers (you + 9), 2 secret WITCHES. Every day has 3 times (morning, afternoon, evening):
//   · you CHOOSE where to go (church, market, mill, tavern, well, forest) and you see only the people who are in the same place;
//   · the computer's villagers walk around; a witch can curse a villager only when they are ALONE together (being alone is dangerous: you too!);
//   · at the end of the day the village finds the body: where and when. Then the COUNCIL: you interrogate people ("Where were you in the
//     afternoon? Who did you see?"), you compare their answers with your notebook, you accuse in correct English (witch-english.js) and the village votes.
//   · the honest tell the truth; the witch who cursed lies about that time (a place where nobody can say "I saw you", or the alibi of the other witch).
//   · small grammar jobs in the places (find and correct the mistake in an A1 sentence about the Middle Ages) give clue coins: 3 coins = one more question.
// The village wins when both witches are burned; the witches win when they are as many as the innocents, or when they curse you.
// The logic (state, walking, curses, answers, votes) is in the first block and does not touch the page: it is exported as WITCH_DETECTIVE_LOGIC (tests).
// Opened by a button with data-wh="detective" ([wh-play]) and by the Games list on the home page.

(() => {
  const DATA = (typeof window !== 'undefined' && window.WITCH_DATA) || null;
  if (!DATA) return;

  const PLACES = [
    { id: 'church', ico: '⛪', n: 'church', at: 'at the church' },
    { id: 'market', ico: '🧺', n: 'market', at: 'at the market' },
    { id: 'mill', ico: '🌾', n: 'mill', at: 'at the mill' },
    { id: 'tavern', ico: '🍺', n: 'tavern', at: 'at the tavern' },
    { id: 'well', ico: '💧', n: 'well', at: 'at the well' },
    { id: 'forest', ico: '🌲', n: 'forest', at: 'in the forest' },
  ];
  const PL = Object.fromEntries(PLACES.map(p => [p.id, p]));
  const SLOTS = [{ n: 'morning', ico: '🌅' }, { n: 'afternoon', ico: '☀️' }, { n: 'evening', ico: '🌆' }];
  const NVILL = 10, NWITCH = 2, QUESTIONS = 3;
  // the grammar jobs: A1 sentences about the Middle Ages with ONE mistake: [wrong|right]. Tap the wrong word, then write the right one.
  const COST = 3;   // clue coins for one more question in the council
  const GRAMMAR = [
    'The farmer [work|works] in the field.', 'The bishop [have|has] a big church.', 'The lord [live|lives] in a castle.',
    'The monks [is|are] in the monastery.', 'The blacksmith makes [a|an] iron axe.', 'There [is|are] three nuns in the church.',
    'The merchant [sell|sells] cloth and spices.', 'I [is|am] a farmer in a small village.', 'The herbalist [know|knows] many plants.',
    'The peasants [pays|pay] taxes to the lord.', 'The innkeeper [don’t|doesn’t] have a big inn.', 'The beggar [haven’t|hasn’t] got a house.',
    'The midwife [help|helps] the women.', 'The spinner [make|makes] thread from wool.', 'The villagers [is|are] afraid of the witch.',
    'There [are|is] a well in the village.', 'The nun [pray|prays] every day.', 'A knight can [goes|go] to war.',
    'We [has|have] a lot of bread.', 'The farmers [works|work] from sunrise to sunset.', 'The Church [have|has] a lot of power.',
    'The maids [doesn’t|don’t] have free time.', 'My brother [are|is] a monk.', 'She [don’t|doesn’t] like the lord.',
    'This is [an|a] witch.', 'The lord has two [horse|horses].', 'There are many [child|children] in the village.',
    'The woman [have|has] a black cat.', 'They [is|are] very poor.', 'He [go|goes] to the market on Sunday.',
    'The monk [copy|copies] books by hand.', 'The squire [study|studies] with the knights.', 'People [doesn’t|don’t] have electricity in the Middle Ages.',
    'The castle [are|is] big and cold.', 'The beggar [ask|asks] for bread.', 'I [has|have] a bad harvest this year.',
    'You [is|are] a good villager.', 'The healer [help|helps] sick people.', 'The craftsmen [makes|make] shoes and barrels.',
    'The noblewoman [wear|wears] a long dress.', 'A hungry man [need|needs] food.', 'We [doesn’t|don’t] see the witch.',
  ];
  const parseG = t => {
    const m = t.match(/\[([^|]+)\|([^\]]+)\]/);
    const before = t.slice(0, m.index), after = t.slice(m.index + m[0].length);
    return { words: (before + m[1] + after).split(/\s+/), at: before.split(/\s+/).filter(Boolean).length, wrong: m[1], right: m[2], fixed: before + m[2] + after };
  };

  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

  /* ====================== the logic (no page) ====================== */
  const label = p => p.role.name;
  const the = p => 'the ' + label(p).toLowerCase();

  function newGame() {
    const seen = new Set();
    const chars = shuffle(DATA.CHARS).filter(c => !seen.has(c.name) && seen.add(c.name)).slice(0, NVILL);   // one card per name: "the nun" is only one person
    const P = chars.map((role, i) => ({ i, role, alive: true, witch: false, status: '', star: false }));
    const me = P[0];
    shuffle(P.slice(1)).slice(0, NWITCH).forEach(p => { p.witch = true; });
    return { P, me, day: 0, coins: 0, today: null, history: [], chores: 0, asked: 0 };
  }
  const aliveOf = G => G.P.filter(p => p.alive);
  const liveWitches = G => G.P.filter(p => p.witch && p.alive);
  const innocents = G => G.P.filter(p => !p.witch && p.alive);

  function startDay(G) {
    G.day++;
    G.today = { pos: [{}, {}, {}], saw: [null, null, null], kill: null, claims: {}, qLeft: QUESTIONS };
  }

  // who is in the place at the time (people who walked that time, also the one who was cursed then)
  const peopleAt = (G, s, place) => Object.keys(G.today.pos[s]).map(Number).filter(i => G.today.pos[s][i] === place);

  // everybody walks to a place; maybe a witch curses somebody who is alone. Returns true if the pupil was cursed.
  function simSlot(G, s, myPlace) {
    const T = G.today, pos = T.pos[s], prev = s ? T.pos[s - 1] : {};
    const alive = aliveOf(G);
    pos[G.me.i] = myPlace;
    alive.forEach(p => {
      if (p === G.me) return;
      pos[p.i] = prev[p.i] && Math.random() < 0.3 ? prev[p.i] : pick(PLACES).id;   // some stay where they were
    });
    if (!T.kill && Math.random() < [0.3, 0.55, 1][s]) {
      const at = pl => alive.filter(p => pos[p.i] === pl).length;
      let cands = alive.filter(p => !p.witch && at(pos[p.i]) === 1);
      if (G.day === 1 || Math.random() < 0.75) cands = cands.filter(p => p !== G.me);   // the first day you are safe; later, not always
      const hunters = liveWitches(G);
      if (cands.length && hunters.length) {
        const v = pick(cands), h = pick(hunters);
        pos[h.i] = pos[v.i];
        v.alive = false; v.status = 'cursed';
        T.kill = { who: v.i, hunter: h.i, slot: s, place: pos[v.i] };
      }
    }
    const here = peopleAt(G, s, myPlace).filter(i => i !== G.me.i);
    T.saw[s] = { place: myPlace, with: here };
    return !!T.kill && T.kill.who === G.me.i && T.kill.slot === s;
  }

  // what a villager answers to "Where were you in the <slot>? Who did you see?" (the same answer if asked again)
  function claim(G, x, s) {
    const T = G.today;
    T.claims[x] = T.claims[x] || {};
    if (T.claims[x][s]) return T.claims[x][s];
    const p = G.P[x], pos = T.pos[s];
    const place = pos[x];
    let c = { place, with: peopleAt(G, s, place).filter(i => i !== x), lie: false };
    const k = T.kill;
    if (p.witch && k) {
      const other = G.P.find(q => q.witch && q.alive && q.i !== k.hunter);
      if (k.hunter === x && k.slot === s) {   // the witch who cursed: where was she? A place where nobody can contradict her
        const others = PLACES.map(q => q.id).filter(id => id !== k.place);
        const pres = id => peopleAt(G, s, id);
        const friend = other && others.find(id => pres(id).length && pres(id).every(i => G.P[i].witch));   // the other witch is there alone: perfect alibi
        const empty = others.filter(id => !pres(id).length);
        const id = Math.random() < 0.35 ? pick(others) : friend || (empty.length ? pick(empty) : pick(others));   // sometimes she is careless: a place where people can say "I did not see you"
        c = { place: id, with: pres(id), lie: true };
      } else if (k.slot === s && other && other.i === x) {   // the other witch covers her friend
        const h = claim(G, k.hunter, s);
        if (h.place === place && !c.with.includes(k.hunter)) { c.with = c.with.concat(k.hunter); c.lie = true; }
      }
    }
    T.claims[x][s] = c;
    return c;
  }

  // votes of the computer's villagers. accused = { i, w } (w: weight of the pupil's accusation, 0 if none). Returns [{ from, to }] (to = null: skip).
  function votes(G, accused) {
    const T = G.today, k = T.kill;
    const alive = aliveOf(G);
    const out = [];
    const target = (() => {   // the witches vote together
      if (accused && accused.w && !G.P[accused.i].witch) return accused.i;                  // they love an accusation against an innocent
      if (accused && accused.w && G.P[accused.i].witch && G.me.alive) return G.me.i;        // an accusation against a witch: they accuse the accuser
      const inn = innocents(G).filter(p => p !== G.me);
      return inn.length ? pick(inn).i : null;
    })();
    alive.forEach(p => {
      if (p === G.me) return;
      if (p.witch) { out.push({ from: p.i, to: Math.random() < 0.85 ? target : null }); return; }
      // an honest villager knows only what she saw: the people who were with her when the curse happened are not the witch
      const cleared = new Set(k ? peopleAt(G, k.slot, T.pos[k.slot][p.i]) : []);
      const cands = alive.filter(q => q !== p && !cleared.has(q.i));
      if (!k && !(accused && accused.w)) { out.push({ from: p.i, to: Math.random() < 0.7 ? null : pick(cands).i }); return; }
      const bag = [];
      cands.forEach(q => { const w = 1 + (accused && accused.i === q.i ? accused.w : 0); for (let n = 0; n < w; n++) bag.push(q.i); });
      out.push({ from: p.i, to: !bag.length || Math.random() < 0.12 ? null : pick(bag) });
    });
    return out;
  }
  // the one with most votes goes to the stake; a tie (or most skips) = nobody
  function tally(G, ballots) {
    const n = {}; let skip = 0;
    ballots.forEach(b => { if (b.to == null) skip++; else n[b.to] = (n[b.to] || 0) + 1; });
    const list = Object.entries(n).map(([i, c]) => [+i, c]).sort((a, b) => b[1] - a[1]);
    const top = list[0];
    const burned = top && top[1] > skip && (!list[1] || top[1] > list[1][1]) ? top[0] : null;
    return { n, skip, burned };
  }
  function winner(G) {
    if (!G.me.alive) return 'witches';
    const w = liveWitches(G).length;
    if (!w) return 'village';
    if (w >= innocents(G).length) return 'witches';
    return null;
  }

  window.WITCH_DETECTIVE_LOGIC = { PLACES, SLOTS, newGame, startDay, simSlot, claim, votes, tally, winner, peopleAt };
  if (typeof document === 'undefined') return;

  /* ====================== the page ====================== */
  const KCOL = { church: 'plum', nobility: 'mustard', people: 'coral' };
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = (k, v) => { try { saved[k] = v; persist(); } catch { /* script.js not ready: skip */ } };
  const recall = k => { try { return saved[k]; } catch { return undefined; } };
  const EN = () => window.WITCH_ENGLISH;
  const nounsOf = p => { const n = label(p).toLowerCase(); return n === 'noblewoman' ? ['noblewoman', 'noble woman'] : [n]; };
  const he = p => (p.role.sex === 'f' ? 'she' : 'he');
  const list = (G, ids) => {
    const names = ids.map(i => (i === G.me.i ? 'you' : the(G.P[i])));
    return names.length < 2 ? names.join('') : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  };

  document.body.insertAdjacentHTML('beforeend', `
    <div class="gq-overlay wh-modal wd-modal" id="wdModal" role="dialog" aria-modal="true" aria-labelledby="wdTitle" hidden>
      <div class="gq-box wg-box">
        <div class="gq-top">
          <span class="gq-title" id="wdTitle">The Village Detective</span>
          <span class="gq-score" id="wdScore"></span>
          <button type="button" class="gq-close" id="wdClose" aria-label="Close">✕</button>
        </div>
        <div class="gq-area wg-area" id="wdArea"></div>
      </div>
    </div>`);
  const modal = $('wdModal');
  const area = $('wdArea');

  let G = null, runId = 0, resolver = null, curOpts = [], picking = null, here = new Set(), phase = '';
  const stale = id => id !== runId;

  /* ---------- the screen: board on the left, panel + notebook on the right ---------- */
  function frame() {
    area.innerHTML = `<div class="wg wd">
      <div class="wd-left"><div class="wd-bar" id="wdBar"></div><div class="wg-board wd-board" id="wdBoard"></div></div>
      <div class="wg-right"><div class="wg-panel wd-panel" id="wdPanel"></div><div class="wd-note" id="wdNote"></div></div></div>`;
    $('wdPanel').addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (!b || !resolver) return;
      const r = resolver; resolver = null; r(curOpts[+b.dataset.v].value);
    });
    $('wdBoard').addEventListener('click', e => {
      const s = e.target.closest('[data-star]');
      if (s) { const p = G.P[+s.dataset.star]; p.star = !p.star; board(); return; }
      const t = e.target.closest('.wg-tile');
      if (!t || !picking || !resolver) return;
      const p = G.P[+t.dataset.i];
      if (!picking(p)) return;
      const r = resolver; resolver = null; picking = null; r({ tile: p.i });
    });
  }
  function tileHtml(p) {
    const can = picking && picking(p);
    return `<button type="button" class="wg-tile ${p.alive ? '' : 'out'} ${p === G.me ? 'me' : ''} ${here.has(p.i) ? 'here' : ''} ${can ? 'pickable' : ''}" data-i="${p.i}" style="--k:var(--pal-${KCOL[p.role.cls]})" aria-label="${esc(label(p))}">
      <span class="pp"><img src="img/witch/${p.role.img}.png" alt="" loading="lazy"></span><b>${esc(label(p))}</b>
      ${p === G.me ? '<span class="you">YOU</span>' : ''}${!p.alive ? `<span class="st">${p.status === 'burned' ? '🔥' : '💀'}</span>` : ''}
      ${p.alive && p !== G.me ? `<span class="wd-star ${p.star ? 'on' : ''}" role="button" tabindex="0" data-star="${p.i}" title="Mark as suspect">★</span>` : ''}</button>`;
  }
  function board() {
    $('wdBoard').innerHTML = G.P.map(tileHtml).join('');
    const T = G.today;
    $('wdBar').innerHTML = `<span class="wd-day">Day ${G.day}</span>${SLOTS.map((s, i) => `<span class="wd-slot ${phase === 'day' && T && T.saw[i] ? 'done' : ''} ${phase === 'day' && T && T.cur === i ? 'now' : ''}">${s.ico} ${s.n}</span>`).join('')}
      <span class="wd-clues" title="Clue coins: 3 coins = one more question in the council">🪙 ${G.coins}</span>`;
    $('wdScore').textContent = G.day ? `Day ${G.day} · ${liveWitches(G).length} witch${liveWitches(G).length === 1 ? '' : 'es'} still hide${liveWitches(G).length === 1 ? 's' : ''}` : '';
    note();
  }

  /* ---------- the notebook ---------- */
  function note() {
    const T = G.today;
    let h = '<h4>📓 My notebook</h4>';
    if (G.history.length) h += `<div class="wd-hist"><b>Before:</b> ${G.history.map(x => x).join(' · ')}</div>`;
    if (T) {
      const eyes = T.saw.map((s, i) => s ? `<li><span>${SLOTS[i].ico} ${SLOTS[i].n}</span> ${PL[s.place].ico} ${PL[s.place].n} — ${s.with.length ? list(G, s.with) : 'nobody'}</li>` : '').join('');
      if (eyes) h += `<div class="wd-sec"><b>👁 I saw</b><ul>${eyes}</ul></div>`;
      if (phase === 'council' && T.kill) {
        const k = T.kill, v = G.P[k.who];
        h += `<div class="wd-body"><b>💀 ${esc(label(v))}</b> was cursed ${PL[k.place].at}, ${SLOTS[k.slot].ico} <b>${SLOTS[k.slot].n}</b>.</div>`;
        const rows = aliveOf(G).filter(p => p !== G.me).map(p => {
          const c = T.claims[p.i] && T.claims[p.i][k.slot];
          const seen = [];
          aliveOf(G).forEach(q => { if (q === G.me || q === p) return; const d = T.claims[q.i] && T.claims[q.i][k.slot]; if (d && d.with.includes(p.i)) seen.push(`${PL[d.place].ico} ${esc(label(q))}`); });
          const mine = T.saw[k.slot];
          if (mine && mine.with.includes(p.i)) seen.push(`👁 ${PL[mine.place].ico} me`);
          return `<tr><td>${esc(label(p))}</td><td>${c ? `${PL[c.place].ico} ${c.with.length ? '+' + c.with.length : 'alone'}` : '<i>?</i>'}</td><td>${seen.length ? seen.join(', ') : '<i>nobody</i>'}</td></tr>`;
        }).join('');
        h += `<div class="wd-sec"><b>🔎 ${SLOTS[k.slot].ico} ${SLOTS[k.slot].n}: who was where?</b><table class="wd-tab"><tr><th>Villager</th><th>says</th><th>seen by</th></tr>${rows}</table></div>`;
      }
      const told = Object.keys(T.claims).map(Number).map(i => {
        const parts = Object.keys(T.claims[i]).map(Number).sort().map(s => { const c = T.claims[i][s]; return `${SLOTS[s].ico} ${PL[c.place].ico}${c.with.length ? ' with ' + list(G, c.with) : ' alone'}`; });
        return parts.length ? `<li><b>${esc(label(G.P[i]))}</b>: ${parts.join(' · ')}</li>` : '';
      }).join('');
      if (told) h += `<div class="wd-sec"><b>🗣 They told me</b><ul>${told}</ul></div>`;
    }
    h += '<p class="wd-tip">Tip: tap ★ on a card to mark a suspect.</p>';
    $('wdNote').innerHTML = h;
  }

  /* ---------- the panel ---------- */
  function setPanel(html, opts = [], cls = 'wg-btns') {
    curOpts = opts;
    $('wdPanel').innerHTML = `<div class="wg-say">${html}</div>${opts.length ? `<div class="${cls}">${opts.map((o, i) => `<button type="button" class="${o.place ? 'wd-place' : 'wg-btn ' + (o.cls || '')}" data-v="${i}">${o.label}</button>`).join('')}</div>` : ''}`;
  }
  function wait(html, opts = [], cls) {
    return new Promise((res, rej) => {
      const id = runId;
      resolver = v => (stale(id) ? rej(STOP) : res(v));
      setPanel(html, opts, cls);
    });
  }
  const STOP = Symbol('stop');
  const next = (html, label = 'Continue ▶') => wait(html, [{ label, value: true }]);
  const pickTile = (html, filter, opts = []) => {
    picking = filter; board();
    return wait(html, opts).finally(() => { picking = null; });
  };
  function typeBox(html) {
    return new Promise((res, rej) => {
      const id = runId;
      setPanel(`${html}<form class="wd-type" id="wdType"><input type="text" id="wdText" autocomplete="off" spellcheck="false" aria-label="Your sentence"><button class="wg-btn" type="submit">Say it ▶</button><button class="wg-btn ghost" type="button" id="wdNo">Never mind</button></form>`);
      resolver = () => {};
      const f = $('wdType');
      $('wdText').focus();
      f.addEventListener('submit', e => { e.preventDefault(); stale(id) ? rej(STOP) : res($('wdText').value); });
      $('wdNo').addEventListener('click', () => (stale(id) ? rej(STOP) : res(null)));
    });
  }

  /* ---------- a day ---------- */
  const placeButtons = () => PLACES.map(p => ({ label: `<span class="i">${p.ico}</span><b>${p.n}</b>`, value: p.id, place: true }));

  // find and correct the mistake: 2 tries to tap the wrong word, 2 tries to write the right one; 1 clue coin
  const used = new Set();
  async function chore() {
    const left = GRAMMAR.filter(t => !used.has(t));
    const t = pick(left.length ? left : GRAMMAR);
    used.add(t);
    const g = parseG(t);
    const show = (hl) => `<p class="wd-sent">${g.words.map((w, i) => (hl && i === g.at ? `<mark>${esc(w)}</mark>` : esc(w))).join(' ')}</p>`;
    let msg = '';
    for (let n = 0; ; n++) {
      if (n === 2) { await next(`<h4>The mistake was here</h4>${show(true)}<p>Right: <b>“${esc(g.fixed)}”</b></p><p class="mute">No coin this time.</p>`); return; }
      const v = await wait(`<h4>🧩 Find the mistake</h4><p>There is <b>one wrong word</b>. Tap it.</p>${msg}`, g.words.map((w, i) => ({ label: esc(w), value: i, cls: 'ghost wd-word' })), 'wd-words');
      if (v === g.at) break;
      msg = '<p class="badtx">No, this word is correct. Look again.</p>';
    }
    msg = '';
    for (let n = 0; ; n++) {
      if (n === 2) { await next(`<h4>The right word is “${esc(g.right)}”</h4>${show(false).replace(esc(g.words[g.at]), `<mark>${esc(g.words[g.at])}</mark>`)}<p>Right: <b>“${esc(g.fixed)}”</b></p><p class="mute">No coin this time.</p>`); return; }
      const a = await typeBox(`<h4>✔ That is the wrong word!</h4>${show(true)}<p>Write the <b>right word</b> to replace <mark>${esc(g.wrong)}</mark>.</p>${msg}`);
      if (a === null) return;
      if (a.trim().toLowerCase().replace(/'/g, '’') === g.right.toLowerCase()) { G.coins++; board(); await next(`<h4>🎉 Correct!</h4><p class="shown">“${esc(g.fixed)}”</p><p class="goodtx">You get <b>1 clue coin</b> 🪙. <span class="mute">(${COST} coins = 1 more question in the council)</span></p>`); return; }
      msg = '<p class="badtx">Not this word. Try again.</p>';
    }
  }

  async function playSlot(s) {
    const T = G.today;
    T.cur = s; here = new Set(); board();
    const place = await wait(`<h4>${SLOTS[s].ico} ${SLOTS[s].n[0].toUpperCase() + SLOTS[s].n.slice(1)}: where do you go?</h4><p>You see only the people who are in the same place. <b>Alone is dangerous!</b> A witch can curse you when nobody else is there.</p>`, placeButtons(), 'wd-map');
    const dead = simSlot(G, s, place);
    if (dead) return 'dead';
    const saw = T.saw[s];
    here = new Set(saw.with); board();
    const where = PL[place];
    let msg = saw.with.length ? `<p>You meet: <b>${esc(list(G, saw.with))}</b>.</p>` : `<p>You are <b>alone</b>. 😬 You hear a noise… but nobody comes.</p>`;
    const r = await wait(`<h4>${where.ico} You are ${where.at}</h4>${msg}`, [{ label: '🧩 Find the mistake (+1 🪙)', value: 'chore' }, { label: 'Continue ▶', value: 'go', cls: 'ghost' }]);
    if (r === 'chore') await chore();
    here = new Set();
    return 'ok';
  }

  /* ---------- the council ---------- */
  async function interrogate() {
    const T = G.today;
    for (;;) {
      const can = T.qLeft > 0 || G.coins >= COST;
      const r = await pickTile(`<h4>🗣 The council</h4><p>${can ? `Choose a villager to <b>question</b>. ${T.qLeft > 0 ? `Free questions today: <b>${T.qLeft}</b>.` : `No free questions left: one more question costs <b>${COST} 🪙</b> (you have ${G.coins}).`}` : 'You have no questions left.'} <span class="mute">The same question gets the same answer.</span></p>`,
        p => can && p.alive && p !== G.me, [{ label: 'Go to the vote ▶', value: 'vote' }]);
      if (r === 'vote') return;
      const p = G.P[r.tile];
      const s = await wait(`<h4>Question for ${esc(label(p))}</h4><p>“Where were you… and who did you see?”</p>`, [...SLOTS.map((x, i) => ({ label: `${x.ico} in the ${x.n}`, value: i })), { label: '← Back', value: -1, cls: 'ghost' }]);
      if (s < 0) continue;
      const fresh = !(T.claims[p.i] && T.claims[p.i][s]);
      if (fresh) { if (T.qLeft > 0) T.qLeft--; else { G.coins -= COST; } }
      const c = claim(G, p.i, s);
      const text = `In the ${SLOTS[s].n} I was ${PL[c.place].at}. ${c.with.length ? `I saw ${list(G, c.with)}.` : 'I was alone.'}`;
      board();
      await next(`<div class="wd-speak"><img src="img/witch/${p.role.img}.png" alt=""><div><b>${esc(label(p))}</b><p class="shown">“${esc(text)}”</p></div></div><p class="mute">Is this true? Compare it with your notebook and with the others.</p>`, 'Go on ▶');
    }
  }

  // the pupil accuses in correct English; returns { i, w } or null
  async function accuse() {
    for (;;) {
      const r = await pickTile('<h4>☝ The vote</h4><p>Who goes to the <b>stake</b>? Tap a villager. Then say <b>why</b> in one correct sentence: the village listens to a good reason.</p>', p => p.alive && p !== G.me, [{ label: 'Skip the vote', value: 'skip', cls: 'ghost' }]);
      if (r === 'skip') return null;
      const t = G.P[r.tile], n = nounsOf(t)[0];
      let fb = '', tries = 0;
      for (;;) {
        const text = await typeBox(`<h4>☝ You accuse ${esc(label(t))}</h4><p>Write your accusation. Name the person and say why.</p><p class="mute">Example: <i>“I think the ${esc(n)} is a witch because ${he(t)} was alone in the afternoon.”</i></p>${fb}`);
        if (text === null) break;
        const c = EN().check(text, { nouns: nounsOf(t) });
        tries++;
        if (c.ok) {
          await next(`<h4>✔ The village listens to you</h4><p class="shown">“${esc(text.trim())}”</p><p class="goodtx">${esc(label(t))} is now ${c.strong ? '<b>very</b> ' : ''}suspect${c.strong ? ' — a good reason!' : '.'}</p>${c.strong ? '' : '<p class="mute">Tip: add <i>“because …”</i> with a reason about the places and the times.</p>'}`, 'Vote ▶');
          return { i: t.i, w: c.strong ? 5 : 3 };
        }
        fb = `<div class="wg-fix"><b>The villagers do not understand you.</b> Correct your sentence:<ul>${c.problems.map(x => `<li>${x}</li>`).join('')}</ul>${tries >= 2 ? `<p class="mute">Pattern: <i>“I think the ${esc(n)} is a witch because ${he(t)} …”</i></p>` : ''}</div>`;
      }
    }
  }

  async function council() {
    const T = G.today, k = T.kill;
    phase = 'council'; here = new Set(); board();
    if (k) await next(`<h4>💀 A body!</h4><p>The villagers find <b>${esc(label(G.P[k.who]))}</b> ${PL[k.place].at}. The witches cursed ${G.P[k.who].role.sex === 'f' ? 'her' : 'him'} <b>${SLOTS[k.slot].ico} in the ${SLOTS[k.slot].n}</b>.</p><p>Who was ${PL[k.place].at} at that time? The witch is still here, among you.</p>`, 'Open the council ▶');
    else await next('<h4>🌙 A quiet day</h4><p>Nobody was cursed today. But the witches are still here… Do you want to question somebody?</p>', 'Open the council ▶');
    await interrogate();
    const acc = await accuse();
    const ballots = votes(G, acc);
    ballots.push({ from: G.me.i, to: acc ? acc.i : null });
    const t = tally(G, ballots);
    const lines = ballots.map(b => `<li><b>${b.from === G.me.i ? 'You' : esc(label(G.P[b.from]))}</b> → ${b.to == null ? '<i>skip</i>' : esc(label(G.P[b.to]))}</li>`).join('');
    const counts = Object.entries(t.n).sort((a, b) => b[1] - a[1]).map(([i, c]) => `<span>${esc(label(G.P[i]))}: <b>${c}</b></span>`).join('') + (t.skip ? `<span>skip: <b>${t.skip}</b></span>` : '');
    await next(`<h4>🗳 The votes</h4><ul class="wd-votes">${lines}</ul><div class="wg-tally">${counts}</div>`, 'Count ▶');
    if (t.burned == null) {
      await next('<h4>Nobody is burned</h4><p>The village could not decide. Night falls…</p>');
      G.history.push(`Day ${G.day}: ${k ? esc(label(G.P[k.who])) + ' cursed' : 'quiet'}, nobody burned`);
      return;
    }
    const b = G.P[t.burned];
    b.alive = false; b.status = 'burned';
    board();
    await next(`<h4>🔥 ${esc(label(b))} goes to the stake</h4><div class="wg-flip"><div class="front">${b.witch ? '🧹 WITCH' : 'INNOCENT'}</div></div><p>${b.witch ? `<span class="goodtx">Yes! ${esc(label(b))} was a witch.</span>` : `<span class="badtx">Oh no… ${esc(label(b))} was innocent.</span>`}</p>`);
    G.history.push(`Day ${G.day}: ${k ? esc(label(G.P[k.who])) + ' cursed, ' : ''}${esc(label(b))} burned (${b.witch ? 'witch' : 'innocent'})`);
  }

  /* ---------- the end ---------- */
  function finish(w) {
    const win = w === 'village';
    store('wd-plays', (+recall('wd-plays') || 0) + 1);
    if (win) store('wd-wins', (+recall('wd-wins') || 0) + 1);
    const why = win ? 'Both witches are burned.' : (!G.me.alive && G.me.status === 'cursed' ? 'The witches cursed you.' : !G.me.alive ? 'The village burned you.' : 'The witches are now as many as the innocents: they control every vote.');
    const wit = G.P.filter(p => p.witch);
    const out = p => (p.status === 'burned' ? '🔥 burned' : p.status === 'cursed' ? '💀 cursed' : 'free');
    phase = 'end'; G.today = null; here = new Set(); board();
    area.innerHTML = `<div class="wg-end">
      <div class="wg-endtop ${win ? 'win' : 'lose'}"><p class="k">${win ? 'THE VILLAGE WINS' : 'THE WITCHES WIN'}</p><h2>${win ? '🏆 You found the witches!' : 'You lose…'}</h2><p>${why}</p></div>
      <div class="wg-cols"><section><h3>🧹 The witches were</h3><ul>${wit.map(p => `<li><img src="img/witch/${p.role.img}.png" alt=""><b>${esc(label(p))}</b> <em>${out(p)}</em></li>`).join('')}</ul></section>
        <section><h3>📅 What happened</h3><ul>${G.history.length ? G.history.map(x => `<li>${x}</li>`).join('') : '<li>Nothing.</li>'}</ul></section></div>
      <div class="wg-reveal"><p class="k">AND IN REAL HISTORY…</p><h2>There were no witches.</h2><p>In this game the witches were real. In history they were never real: the people who were accused were herbalists, midwives, widows… and somebody <b>always</b> gained from the accusation. Did you accuse somebody only because they were alone?</p></div>
      <div class="wg-btns end"><button type="button" class="wg-btn" id="wdAgain">↻ Play again</button><button type="button" class="wg-btn ghost" id="wdDone">Close</button></div></div>`;
    $('wdAgain').addEventListener('click', game);
    $('wdDone').addEventListener('click', close);
    modal.querySelector('.gq-box').scrollTop = 0;
  }

  async function game() {
    ++runId;
    try {
      G = newGame(); phase = 'intro'; frame(); board();
      const r = G.me.role;
      await next(`<h4>🔎 The Village Detective</h4><p>You are <b>the ${esc(label(G.me))}</b> <em>(${esc(r.it)})</em>. You are innocent. But <b>${NWITCH} of the ${NVILL} villagers are secret witches</b>.</p>
        <p>Every day you go to <b>three places</b>. You see only who is there with you. A witch curses somebody <b>only when they are alone together</b>. Then the village meets: <b>question</b> the villagers, find who is lying, and vote.</p>
        <p class="mute">Write your notes in the notebook. In every place you can find the mistake in a sentence: each win is 1 clue coin 🪙, and <b>3 coins buy one more question</b>.</p>`, 'Start the game ▶');
      let w = null;
      while (!w) {
        startDay(G); phase = 'day'; board();
        let dead = false;
        for (let s = 0; s < 3 && !dead; s++) dead = (await playSlot(s)) === 'dead';
        if (dead) {
          here = new Set(); board();
          await next(`<h4>💀 Somebody comes…</h4><p>You are alone ${PL[G.today.kill.place].at}. A shadow… A <b>witch</b>! ${esc(label(G.P[G.today.kill.hunter]))} curses you.</p>`, 'Oh no… ▶');
          G.history.push(`Day ${G.day}: you were cursed`);
          break;
        }
        await council();
        if ((w = winner(G))) break;
        if (!G.me.alive) break;
      }
      finish(w || 'witches');
    } catch (e) { if (e !== STOP) throw e; }
  }

  /* ---------- open / close ---------- */
  function open() {
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    $('wdClose').focus();
    game();
  }
  function close() {
    runId++; resolver = null; picking = null;
    modal.hidden = true;
    document.documentElement.classList.remove('gq-open');
  }
  $('wdClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);
  document.querySelectorAll('[data-wh="detective"]').forEach(b => b.addEventListener('click', open));
  window.WITCH_DETECTIVE = { open, close };
})();
