// Witch hunt (CLIL, [wh-play]): the village game against the computer, in a pop-up (like the Sports and Emotions games).
// A "Lupus in tabula" with witches: 22 villagers (the characters of the teacher's PDF, witch-data.js), each with a power, coins and a vote.
// Three of them are secret WITCHES. The computer is the narrator: every night it says who opens their eyes (the spies, then the witches).
// A pupil whose character has the eyes closed skips that step; a pupil whose eyes are open sees what happens (who asks, who points at whom).
// The witches curse a villager every night and take the coins; every day the village votes who goes into exile.
// The witches win when no innocent is left (or when they are as many as the innocents: then they control every vote);
// the village wins when all the witches are in exile. At the end the game says that in real history witches never existed.
// Opened by a button with data-wh="play" ([wh-play]) and by the pill "Witch hunt" of the Games list on the home page.

(() => {
  const DATA = window.WITCH_DATA;
  if (!DATA) return;
  const CHARS = DATA.CHARS;
  const CHAR = Object.fromEntries(CHARS.map(c => [c.id, c]));
  const KCOL = { church: 'plum', nobility: 'mustard', people: 'coral' };
  const LABEL = { lord1: 'Lord I', lord2: 'Lord II', farmerM1: 'Farmer I', farmerM2: 'Farmer II', farmerF: 'Farmer (f)', merchantM: 'Merchant (m)',
    merchantF: 'Merchant (f)', innkeeperM: 'Innkeeper (m)', innkeeperF: 'Innkeeper (f)' };
  const SPIES = ['innkeeperM', 'innkeeperF', 'maid'];   // the order in which the narrator calls them
  const TAXERS = ['bishop', 'lord1', 'lord2'];
  const NWITCH = 4;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const roll = n => 1 + Math.floor(Math.random() * n);
  const store = (k, v) => { try { saved[k] = v; persist(); } catch { /* script.js not ready: skip */ } };
  const recall = k => { try { return saved[k]; } catch { return undefined; } };

  document.body.insertAdjacentHTML('beforeend', `
    <div class="gq-overlay wh-modal" id="whModal" role="dialog" aria-modal="true" aria-labelledby="whTitle" hidden>
      <div class="gq-box wg-box">
        <div class="gq-top">
          <span class="gq-title" id="whTitle">The Village Game</span>
          <span class="gq-score" id="whScore"></span>
          <button type="button" class="gq-close" id="whClose" aria-label="Close">✕</button>
        </div>
        <div class="gq-area wg-area" id="whArea"></div>
      </div>
    </div>`);
  const modal = $('whModal');
  const area = $('whArea');

  /* ---------- state ---------- */
  let P = [];            // the 22 people: a person keeps the tile, the role can be swapped
  let me = null;         // the pupil's person
  let round = 0, season = 'normal';
  let annulled = null, healerUsed = false, watching = false, night = false;
  let victim = null;     // who the witches cursed last night
  let pointing = new Map(); // tile index → labels of the witches who point at that tile (shown while the witches have their eyes open)
  let ledger = [];       // where the coins of the dead and of the exiled went
  let stats = { looted: 0, confiscated: 0 };
  let runId = 0, resolver = null;
  const STOP = Symbol('stop');
  const stale = id => id !== runId;

  const roleOf = p => CHAR[p.role];
  const label = p => LABEL[p.role] || roleOf(p).name;
  const alive = () => P.filter(p => p.alive);
  const holder = id => P.find(p => p.role === id);
  const isAlive = id => { const p = holder(id); return !!p && p.alive; };
  const sex = p => roleOf(p).sex;
  const cls = p => roleOf(p).cls;
  const group = p => cls(p) === 'people' ? 'people-' + sex(p) : cls(p);
  const liveWitches = () => P.filter(p => p.witch && p.alive);
  const innocents = () => P.filter(p => !p.witch && p.alive);
  const name = p => `<b>${esc(label(p))}</b>`;
  const weight = p => ({ bishop: 3, lord1: 2, lord2: 2 }[p.role] || 1);
  const voters = () => alive().filter(p => p !== annulled);
  const narr = html => `<p class="narr"><b>🎙 Narrator</b> ${html}</p>`;

  /* ---------- log, board, panel ---------- */
  function say(html, kind = '') {
    const ul = $('wgLog');
    if (!ul) return;
    ul.insertAdjacentHTML('beforeend', `<li class="${kind}">${html}</li>`);
    ul.scrollTop = ul.scrollHeight;
  }
  const ICON = { killed: '💀', exiled: '➜', starved: '☠' };
  function tileHtml(p, i) {
    const r = roleOf(p);
    const d = p.d ? `<em class="d ${p.d > 0 ? 'up' : 'down'}">${p.d > 0 ? '+' : '−'}${Math.abs(p.d)}</em>` : '';
    const ptr = pointing.get(i);
    const awake = night && me.alive && me.witch && p.witch && p.alive && p !== me;
    return `<button type="button" class="wg-tile ${p.alive ? '' : 'out ' + p.status} ${p === me ? 'me' : ''} ${ptr ? 'pointed' : ''} ${awake ? 'awake' : ''}" data-i="${i}" style="--k:var(--pal-${KCOL[r.cls]})" aria-label="${esc(label(p))}, ${p.coins} coins">
      <span class="pp"><img src="img/witch/${r.img}.png" alt="" loading="lazy"></span>
      <b>${esc(label(p))}</b>
      <span class="co"><i>●</i>${p.coins}${d}</span>
      ${p === me ? '<span class="you">YOU</span>' : ''}${ICON[p.status] ? `<span class="st">${ICON[p.status]}</span>` : ''}${awake ? '<span class="st">🧹</span>' : ''}
      ${ptr ? `<span class="ptr">☝ ${ptr.map(esc).join(', ')}</span>` : ''}
    </button>`;
  }
  function board() {
    const b = $('wgBoard');
    if (b) b.innerHTML = P.map(tileHtml).join('');
    const c = $('wgMe');
    if (!c || !me) return;
    const r = roleOf(me);
    const known = P.filter(p => me.known[p.i]).map(p => `${esc(label(p))}: <b>${me.known[p.i] === 'bad' ? 'WITCH' : 'good'}</b>`);
    const friends = liveWitches().filter(x => x !== me).map(label).map(esc).join(', ');
    c.innerHTML = `<div class="wg-arch" style="--k:var(--pal-${KCOL[r.cls]})"><img src="img/witch/${r.img}.png" alt=""></div>
      <div class="tx"><small>${esc(DATA.CLASSES[r.cls].name)}</small><h3>${esc(label(me))} <em>${esc(r.it)}</em></h3>
      <p class="ab">${esc(r.ab)}</p>
      <p class="team ${me.witch ? 'bad' : 'good'}">${me.witch ? '🧹 SECRET: you are a WITCH. Friends: ' + (friends || 'none left') : 'You are innocent. Find the four witches!'}</p>
      ${known.length ? `<p class="kn">You know: ${known.join(' · ')}</p>` : ''}
      <p class="status">${me.alive ? `Coins: <b>${me.coins}</b>` : `<b>You are out (${me.status}).</b>`}</p></div>`;
    $('whScore').textContent = round ? `Round ${round} · ${{ abundance: '🌾 abundance', famine: '🥀 famine', normal: '☁ normal year' }[season]}` : '';
  }
  function setPanel(html) { const p = $('wgPanel'); if (p) p.innerHTML = html; }

  // wait for a button: [{ label, value, cls }]
  function ask(html, buttons) {
    const id = runId;
    setPanel(`<div class="wg-say">${html}</div><div class="wg-btns">${buttons.map((b, k) => `<button type="button" class="wg-btn ${b.cls || ''}" data-k="${k}">${b.label}</button>`).join('')}</div>`);
    return new Promise((res, rej) => {
      resolver = v => { resolver = null; stale(id) ? rej(STOP) : res(v); };
      $('wgPanel').querySelectorAll('[data-k]').forEach(el => el.addEventListener('click', () => resolver && resolver(buttons[+el.dataset.k].value)));
    });
  }
  const next = (html, labelText = 'Next ▶') => ask(html, [{ label: labelText, value: true }]);
  const sleep = ms => { const id = runId; return new Promise((res, rej) => setTimeout(() => stale(id) ? rej(STOP) : res(), ms)); };

  // choose a tile: filter(p) tells which ones can be chosen; skipLabel adds a "nobody" button (it returns null)
  function pickTile(html, filter, skipLabel) {
    const id = runId;
    const b = $('wgBoard');
    b.querySelectorAll('.wg-tile').forEach((t, i) => t.classList.toggle('pickable', !!filter(P[i])));
    setPanel(`<div class="wg-say">${html}</div>${skipLabel ? `<div class="wg-btns"><button type="button" class="wg-btn ghost" data-skip>${skipLabel}</button></div>` : ''}`);
    return new Promise((res, rej) => {
      const done = v => { b.querySelectorAll('.wg-tile').forEach(t => t.classList.remove('pickable')); b.removeEventListener('click', onTile); resolver = null; stale(id) ? rej(STOP) : res(v); };
      const onTile = e => { const t = e.target.closest('.wg-tile.pickable'); if (t) done(P[+t.dataset.i]); };
      b.addEventListener('click', onTile);
      resolver = done;
      const sk = $('wgPanel').querySelector('[data-skip]');
      if (sk) sk.addEventListener('click', () => done(null));
    });
  }

  /* ---------- coins and deaths ---------- */
  function gain(p, n) {
    if (!n) return;
    const before = p.coins;
    p.coins = Math.max(0, p.coins + n);
    p.d += p.coins - before;
  }
  function move(from, to, n = 1) {
    n = Math.min(n, from.coins);
    if (n <= 0) return 0;
    gain(from, -n); gain(to, n);
    return n;
  }
  function died(p, how) {
    p.alive = false; p.status = how;
    if (how === 'killed' || how === 'starved') {
      const monk = holder('monk');
      if (monk && monk.alive && monk !== p) {
        // the four social groups of the book: Church, Nobility, working men, working women (the monk gets at most 3 coins)
        const payers = alive().filter(x => x !== monk && group(x) === group(p) && x.coins > 0).sort((x, y) => y.coins - x.coins).slice(0, 3);
        payers.forEach(x => move(x, monk, 1));
        if (payers.length) say(`✝ The monk gets ${payers.length} coin${payers.length > 1 ? 's' : ''} for the Mass of ${name(p)}.`);
      }
    }
    if (how === 'starved' && sex(p) === 'f') {
      const mw = holder('midwife');
      const men = alive().filter(x => sex(x) === 'm' && cls(x) === cls(p));
      if (mw && mw.alive && mw !== p && mw.coins > 0 && men.length) { const m = pick(men); move(mw, m, 1); say(`The midwife gives 1 coin to ${name(m)} (a man of the same class).`); }
    }
  }
  function nunCap() {
    const nun = holder('nun');
    if (!nun || !nun.alive || nun.coins <= 3) return;
    const extra = nun.coins - 3;
    const poorest = alive().filter(x => x !== nun).sort((a, b) => a.coins - b.coins)[0];
    if (poorest) { move(nun, poorest, extra); say(`🙏 The nun keeps only 3 coins. She gives ${extra} to ${name(poorest)}.`); }
  }

  /* ---------- the winner ---------- */
  function winner() {
    const w = liveWitches().length, inn = innocents().length;
    if (!w) return 'village';
    if (!inn || w >= inn) return 'witches';   // with as many witches as innocents, the witches control every vote
    return null;
  }

  /* ---------- setup ---------- */
  function setup() {
    const roles = shuffle(CHARS.map(c => c.id));
    // the tiles keep the order of the book (men, then women); the roles are dealt at random
    P = roles.map((role, i) => ({ i, role, coins: CHAR[role].coins, start: CHAR[role].coins, alive: true, status: 'alive', witch: false, d: 0, sus: {}, known: {}, claimed: false, human: false }));
    me = pick(P); me.human = true;
    shuffle(P).slice(0, NWITCH).forEach(p => { p.witch = true; });
    round = 0; season = 'normal'; annulled = null; healerUsed = false; watching = false; night = false; victim = null;
    pointing = new Map(); ledger = []; stats = { looted: 0, confiscated: 0 };
    area.innerHTML = `<div class="wg">
      <div class="wg-left"><div class="wg-board" id="wgBoard"></div></div>
      <div class="wg-right">
        <div class="wg-me" id="wgMe"></div>
        <div class="wg-panel" id="wgPanel"></div>
        <ul class="wg-log" id="wgLog" aria-live="polite"></ul>
      </div></div>`;
    board();
  }

  /* ---------- 1 · the season ---------- */
  async function playSeason() {
    P.forEach(p => { p.d = 0; });
    round++;
    season = pick(['abundance', 'abundance', 'famine', 'famine', 'normal', 'normal', 'normal']);
    const names = { abundance: ['🌾 ABUNDANCE', 'The harvest is good.'], famine: ['🥀 FAMINE', 'The harvest is bad. People are hungry and afraid.'], normal: ['☁ A NORMAL YEAR', 'Nothing special this year.'] };
    say(`<b>Round ${round}</b> · ${names[season][0]}`, 'head');
    const fx = [];
    const A = alive();
    const by = id => A.find(p => p.role === id);
    if (season === 'abundance') {
      ['merchantM', 'merchantF'].forEach(id => { const p = by(id); if (p) { gain(p, 2); fx.push(`${label(p)} +2`); } });
      const cr = by('craftsman');
      if (cr) { const g = isAlive('merchantM') ? 2 : 1; gain(cr, g); fx.push(`${label(cr)} +${g}`); }
      const sp = by('spinner'); if (sp) { gain(sp, 3); fx.push(`${label(sp)} +3`); }
    }
    if (season === 'famine') {
      const b = by('bishop');
      if (b) {
        const workers = A.filter(p => cls(p) === 'people').sort((x, y) => x.coins - y.coins).slice(0, 2);
        workers.forEach(w => { if (move(b, w, 1)) fx.push(`${label(b)} gives 1 coin to ${label(w)}`); });
      }
      const cr = by('craftsman'); if (cr) { gain(cr, -2); fx.push(`${label(cr)} −2`); }
      ['innkeeperM', 'innkeeperF'].forEach(id => { const p = by(id); if (p) { gain(p, 1); fx.push(`${label(p)} +1`); } });
      const h = by('herbalist');
      if (h) {
        if (Math.random() < .5) { gain(h, 3); fx.push('🪙 Herbalist: HEADS, people ask for help +3'); }
        else { gain(h, -2); fx.push('🪙 Herbalist: TAILS, “she is a witch!” −2'); }
      }
      // hunger: working people lose 1 coin; with 0 coins they die of hunger
      const hungry = A.filter(p => cls(p) === 'people' && !['innkeeperM', 'innkeeperF', 'herbalist', 'craftsman'].includes(p.role));
      const dead = [];
      hungry.forEach(p => { if (p.coins <= 0) dead.push(p); else gain(p, -1); });
      fx.push('Working people lose 1 coin (hunger).');
      dead.forEach(p => { died(p, 'starved'); say(`☠ ${name(p)} dies of hunger.`, 'bad'); });
    }
    // every turn
    alive().filter(p => ['farmerM1', 'farmerM2', 'farmerF'].includes(p.role)).forEach(p => {
      const r = roll(20);
      if (r > 16) { gain(p, 3); fx.push(`🎲 ${label(p)} rolls ${r}: +3`); }
    });
    const mw = by('midwife');
    if (mw && mw.alive) { const n = alive().filter(p => sex(p) === 'f' && p.role !== 'nun').length; gain(mw, n); fx.push(`${label(mw)} +${n} (one for each woman)`); }
    const sq = by('squire'), bs = by('blacksmith');
    if (sq && bs && sq.alive && bs.alive && sq.coins >= 5) { move(sq, bs, 1); fx.push(`${label(sq)} gives 1 coin to ${label(bs)}`); }
    nunCap();
    board();
    say(fx.length ? fx.map(esc).join(' · ') : 'No coins change.', 'fx');
    if (winner()) return;
    await next(`<h4>${names[season][0]}</h4><p>${names[season][1]}</p><p class="mute">Look at the coins on the board. Who is richer now?</p>`);
  }

  /* ---------- 2 · the night: the narrator calls the roles ---------- */
  // a witch who is a spy opens the eyes twice; a person with closed eyes skips the step
  async function spyStep(role) {
    const p = holder(role);
    if (!p || !p.alive) return false;
    const want = role === 'maid' ? 'f' : 'm';
    const targets = alive().filter(t => t !== p && sex(t) === want && !p.known[t.i]);
    if (!targets.length) return false;
    const who = `the ${esc(roleOf(p).name.toLowerCase())}`;
    if (p === me) {
      const t = await pickTile(`<h4>🌙 Your eyes are open</h4>${narr(`${role === 'maid' ? 'The maid' : 'The ' + roleOf(p).name.toLowerCase()} opens ${role === 'maid' ? 'her' : sex(p) === 'f' ? 'her' : 'his'} eyes and asks me: <em>“Is ${role === 'maid' ? 'a woman' : 'a man'} good or bad?”</em> Choose ${role === 'maid' ? 'a woman' : 'a man'}.`)}`, x => targets.includes(x));
      p.known[t.i] = t.witch ? 'bad' : 'good';
      say(`👂 You ask about ${name(t)}: <b>${t.witch ? 'a WITCH' : 'good'}</b>.`, 'me');
      board();
      await next(`<h4>🌙 The narrator answers</h4>${narr(`I nod ${t.witch ? '<b>(thumb down 👎)</b>' : '<b>(thumb up 👍)</b>'}: ${name(t)} is <b>${t.witch ? 'a WITCH' : 'good'}</b>. Close your eyes.`)}`, 'Close my eyes 😴');
      return true;
    }
    // the computer's spy (a witch spy already knows everybody)
    if (!p.witch) { const t = pick(targets); p.known[t.i] = t.witch ? 'bad' : 'good'; }
    return false;
  }

  async function witchesStep() {
    const ws = liveWitches();
    const targets = alive().filter(t => !t.witch);
    // the computer's witches point first
    const wt = t => 1 + t.coins + (SPIES.includes(t.role) ? 3 : 0) + (sex(t) === 'f' && cls(t) === 'people' ? 1 : 0);
    const choose = () => { let r = Math.random() * targets.reduce((s, t) => s + wt(t), 0); return targets.find(t => (r -= wt(t)) <= 0) || targets[0]; };
    const picks = new Map();
    ws.filter(w => !w.human).forEach(w => picks.set(w, choose()));
    let final;
    if (me.alive && me.witch) {
      const mark = () => { pointing = new Map(); picks.forEach((t, w) => pointing.set(t.i, [...(pointing.get(t.i) || []), label(w)])); };
      mark(); board();
      const friends = [...picks.entries()].map(([w, t]) => `${name(w)} points at ${name(t)}`);
      await next(`<h4>🌙 Your eyes are open</h4>${narr('The witches open their eyes and ask me: <em>“Whom do we curse tonight?”</em>')}
        <p>${friends.length ? 'Your friends point:' : 'You are the only witch left.'}</p>${friends.length ? `<ul class="wg-talk">${friends.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}`, 'Choose my victim ▶');
      const mine = await pickTile(`<h4>🌙 Whom do you curse?</h4>${narr('Point at somebody. The witches agree by majority; if you disagree, your choice counts as a tie-breaker.')}<p class="mute">Be careful: look at the coins, and at who could be a spy.</p>`, t => targets.includes(t));
      picks.set(me, mine);
      const count = new Map();
      picks.forEach(t => count.set(t, (count.get(t) || 0) + 1));
      const top = Math.max(...count.values());
      const best = [...count.entries()].filter(([, n]) => n === top).map(([t]) => t);
      final = best.includes(mine) ? mine : pick(best);
      pointing = new Map([[final.i, ['the witches']]]);
      board();
      say(`🧹 The witches curse ${name(final)}.`, 'me');
      await next(`<h4>🌙 The witches agree</h4>${narr(`${name(final)} is the victim. Witches, close your eyes.`)}`, 'Close my eyes 😴');
      pointing = new Map();
    } else {
      final = picks.size ? [...picks.values()][0] : choose();
      const count = new Map(); picks.forEach(t => count.set(t, (count.get(t) || 0) + 1));
      final = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
    return final;
  }

  async function playNight() {
    night = true;
    say('🌙 <b>Night.</b> The village sleeps.', 'head');
    board();
    await next(`<h4>🌙 Night</h4>${narr('The night falls on the village. <b>Everybody, close your eyes.</b>')}`, 'Close my eyes 😴');
    let awake = false;
    for (const role of SPIES) if (await spyStep(role)) awake = true;
    victim = await witchesStep();
    if (me.alive && me.witch) awake = true;
    if (!awake) {
      setPanel(`<div class="wg-say"><h4>💤 Zzz…</h4>${narr('Night. Some people open their eyes, but not you. <b>You are asleep.</b>')}</div>`);
      await sleep(1800);
    }
    // the curse
    const nw = holder('noblewoman');
    victim.cursed = true;
    if (victim.role === 'maid' && nw && nw.alive && !nw.witch) {
      say('🛡 The noblewoman protects her maid: the curse fails.', 'good');
      victim = null;
    } else {
      const loot = victim.role === 'blacksmith' ? 0 : victim.coins;
      const thief = pick(liveWitches());
      if (loot) {
        move(victim, thief, loot);
        stats.looted += loot;
        // some people notice who got richer
        alive().filter(v => !v.witch && !v.human).forEach(v => { if (Math.random() < .3) v.sus[thief.i] = (v.sus[thief.i] || 0) + 1; });
        ledger.push({ who: label(victim), coins: loot, dest: label(thief), how: 'cursed' });
      }
      died(victim, 'killed');
      if (me.witch && me.alive) say(`🧹 ${name(victim)} dies${loot ? ` and ${loot} coin${loot > 1 ? 's go' : ' goes'} to ${name(thief)}` : ''}.`, 'me');
    }
    night = false;
    board();
  }

  /* ---------- 3 · the morning ---------- */
  async function playMorning() {
    say('☀ <b>Morning.</b> The bell rings.', 'head');
    const lines = [];
    let head;
    if (victim) {
      say(`💀 ${name(victim)} is found dead!`, 'bad');
      head = `<h4>☀ The village wakes up</h4>${narr(`Everybody opens their eyes. ${name(victim)} is <b>dead</b>.`)}`;
    } else {
      head = `<h4>☀ The village wakes up</h4>${narr('Everybody opens their eyes. <b>Nobody died tonight.</b>')}`;
    }
    const talkers = alive().filter(x => !x.human);
    // an honest spy tells what he or she knows
    for (const s of talkers.filter(x => !x.witch && Object.values(x.known).includes('bad'))) {
      const id = +Object.keys(s.known).find(k => s.known[k] === 'bad');
      if (P[id].alive) { lines.push(`<b>${esc(label(s))}</b>: “I listened in the night. ${esc(label(P[id]))} is a <u>WITCH</u>!”`); P[id].claimed = true; }
    }
    // a witch who is a spy lies: he or she names an innocent person; other witches push innocents too
    const lie = liveWitches().find(a => !a.human && SPIES.includes(a.role));
    if (lie) {
      const t = pick(innocents().filter(x => x !== me || true));
      if (t) { lines.push(`<b>${esc(label(lie))}</b>: “I listened in the night. ${esc(label(t))} is a <u>WITCH</u>!”`); t.claimed = true; }
    }
    const other = liveWitches().filter(a => !a.human && a !== lie);
    if (other.length) {
      const t = pick(innocents());
      if (t) lines.push(`<b>${esc(label(pick(other)))}</b>: “I saw ${esc(label(t))} near the forest at night. Strange…”`);
    }
    if (!lines.length) lines.push('Nobody says anything. Everybody looks at the others…');
    board();
    await next(`${head}<ul class="wg-talk">${lines.map(l => `<li>${l}</li>`).join('')}</ul><p class="mute">Think: who gets richer? Who says strange things?</p>`, 'Use your powers ▶');
  }

  /* ---------- 4 · the powers of the day ---------- */
  async function playPowers() {
    annulled = null;
    if (me.alive) {
      const r = me.role;
      if (TAXERS.includes(r)) {
        const t = await pickTile('<h4>Your power: TAX</h4><p>Take 1 coin from a player.</p>', x => x !== me && x.alive && x.coins > 0, 'No tax today');
        if (t) { move(t, me, 1); say(`💰 You tax ${name(t)}: +1 coin.`, 'me'); board(); }
      } else if (r === 'beggar') {
        const t = await pickTile('<h4>Your power: STEAL</h4><p>Steal 1 coin from a churchman or a noble.</p>', x => x.alive && x.coins > 0 && ['church', 'nobility'].includes(cls(x)), 'Do nothing');
        if (t) { move(t, me, 1); say(`🪙 You steal 1 coin from ${name(t)}.`, 'me'); board(); }
      } else if (r === 'noblewoman') {
        const t = await pickTile('<h4>Your power: CANCEL A VOTE</h4><p>Choose a player. His or her vote does not count today.</p>', x => x !== me && x.alive, 'Nobody');
        if (t) { annulled = t; say(`✋ You cancel the vote of ${name(t)}.`, 'me'); }
      } else if (['merchantM', 'merchantF'].includes(r) && me.coins > 4) {
        const t = await pickTile(`<h4>Your power: SWAP ROLES</h4><p>You have more than 4 coins. Swap roles with another ${sex(me) === 'm' ? 'man' : 'woman'}?</p>`, x => x !== me && x.alive && sex(x) === sex(me), 'No, thanks');
        if (t) swap(me, t, true);
      } else if (r === 'healer' && !healerUsed && me.coins >= 2) {
        const dead = P.filter(x => !x.alive && ['killed', 'starved'].includes(x.status));
        if (dead.length) {
          const t = await pickTile('<h4>Your power: BRING BACK TO LIFE</h4><p>Pay 2 coins to bring back a person who was killed or died of hunger. You can do it only once.</p>', x => dead.includes(x), 'No, thanks');
          if (t) revive(t, me);
        }
      }
    }
    for (const p of alive().filter(x => !x.human)) {
      if (!p.alive) continue;
      const r = p.role;
      if (TAXERS.includes(r)) {
        const t = pick(alive().filter(x => x !== p && x.coins > 0 && cls(x) === 'people')) || pick(alive().filter(x => x !== p && x.coins > 0));
        if (t) { move(t, p, 1); say(`💰 ${name(p)} taxes ${name(t)}.`); }
      } else if (r === 'beggar') {
        const t = pick(alive().filter(x => x.coins > 0 && ['church', 'nobility'].includes(cls(x))));
        if (t) { move(t, p, 1); say(`🪙 ${name(p)} steals 1 coin from ${name(t)}.`); }
      } else if (r === 'noblewoman') {
        annulled = alive().filter(x => x !== p).sort((a, b) => suspicion(p, b) - suspicion(p, a))[0] || null;
        if (annulled === me) say('✋ The noblewoman cancels <b>your</b> vote today!', 'bad');
        else if (annulled) say(`✋ The noblewoman cancels the vote of ${name(annulled)}.`);
      } else if (['merchantM', 'merchantF'].includes(r) && p.coins > 4 && Math.random() < .35) {
        const t = pick(alive().filter(x => x !== p && sex(x) === sex(p) && ['bishop', 'lord1', 'lord2', 'noblewoman', 'healer'].includes(x.role)));
        if (t) swap(p, t, false);
      } else if (r === 'healer' && !healerUsed && p.coins >= 2 && Math.random() < .5) {
        const t = pick(P.filter(x => !x.alive && ['killed', 'starved'].includes(x.status)));
        if (t) revive(t, p);
      }
    }
    board();
  }
  function swap(a, b, human) {
    const ra = a.role; a.role = b.role; b.role = ra;
    say(`🔄 ${human ? 'You swap' : '<b>A merchant</b> swaps'} roles: now ${name(a)} and ${name(b)}.`, human ? 'me' : '');
    board();
  }
  function revive(t, healer) {
    if (healer.coins < 2) return;
    gain(healer, -2);
    healerUsed = true;
    t.alive = true; t.status = 'alive';
    if (t.coins < 1) gain(t, 1);
    say(`✨ ${name(healer)} brings ${name(t)} back to life!`, 'good');
    board();
  }
  // how much does voter v suspect person t?
  function suspicion(v, t) {
    let s = (v.sus[t.i] || 0) * .6 + Math.random() * .8;
    if (v.known[t.i] === 'bad') s += 5;
    if (v.known[t.i] === 'good') s -= 5;
    if (t.claimed) s += .7;
    return s;
  }

  /* ---------- 5 · the village meeting: who goes into exile? ---------- */
  async function playExile() {
    if (winner()) return;
    let mine = null;
    if (me.alive && me !== annulled) {
      mine = await pickTile(`<h4>🏚 The village meeting</h4><p>Who goes into exile? Choose a person, or nobody.</p><p class="mute">Your vote counts <b>${weight(me)}</b>. Who gets richer? Who says strange things?</p>`,
        p => p.alive && p !== me && !(me.role === 'squire' && p.role === 'blacksmith'), 'Nobody');
    } else if (me.alive) say('✋ Your vote is cancelled today.', 'bad');
    const tally = new Map(); let nobody = 0;
    const add = (t, w) => { if (!t) nobody += w; else tally.set(t, (tally.get(t) || 0) + w); };
    for (const p of voters()) {
      let t;
      if (p === me) t = mine;
      else if (p.witch) {
        const inn = innocents();
        const threat = inn.filter(x => x.claimed || SPIES.includes(x.role));
        t = Math.random() < .15 ? null : pick(threat.length && Math.random() < .6 ? threat : inn);
      } else if (Math.random() < .2) t = null;
      else {
        const list = alive().filter(x => x !== p && !(p.role === 'squire' && x.role === 'blacksmith'));
        const best = list.map(x => [x, suspicion(p, x)]).sort((a, b) => b[1] - a[1])[0];
        t = best && best[1] >= 1.05 ? best[0] : null;
      }
      add(t, weight(p));
    }
    const rank = [...tally.entries()].sort((a, b) => b[1] - a[1]);
    const top = rank[0];
    const list = rank.slice(0, 4).map(([t, w]) => `<span>${esc(label(t))} <b>${w}</b></span>`).join('') + (nobody ? `<span>Nobody <b>${nobody}</b></span>` : '');
    board();
    if (!top || top[1] <= nobody || (rank[1] && rank[1][1] === top[1])) {
      say('🏚 The village does not agree: nobody goes into exile.');
      await next(`<h4>🏚 The vote</h4><div class="wg-tally">${list}</div><p>Nobody goes into exile today.</p>`, 'Next ▶');
      return;
    }
    const t = top[0];
    const nw = holder('noblewoman');
    if (t.role === 'maid' && nw && nw.alive && nw !== annulled) {
      const nwVote = nw === me ? mine === t : Math.random() < .2;
      if (!nwVote) {
        say('🛡 The noblewoman protects her maid. Nobody goes into exile.');
        await next(`<h4>🏚 The vote</h4><div class="wg-tally">${list}</div><p>The noblewoman protects the maid. Nobody goes into exile.</p>`);
        return;
      }
    }
    t.alive = false; t.status = 'exiled';
    // the Church and the lords take the goods of the exiled
    let seized = '';
    if (t.coins > 0) {
      const lord = [holder('lord1'), holder('lord2')].find(l => l && l.alive);
      const boss = holder('bishop');
      const taker = (boss && boss.alive) ? boss : lord;
      if (taker) { const n = t.coins; move(t, taker, n); stats.confiscated += n; ledger.push({ who: label(t), coins: n, dest: label(taker), how: 'exiled' }); seized = `<p>The goods of ${name(t)} (${n} coin${n > 1 ? 's' : ''}) go to ${name(taker)}.</p>`; }
    }
    say(`➜ ${name(t)} goes into exile. ${t.witch ? '<b>A WITCH! Well done.</b>' : '<em>Innocent.</em>'}`, t.witch ? 'good' : 'bad');
    let extra = '';
    if (t.role === 'squire') {
      const r = roll(20);
      if (r > 15) { t.alive = true; t.status = 'alive'; gain(t, 5); extra = `<p>⚔ The squire goes on a crusade. D20: <b>${r}</b>. He comes back with 5 coins!</p>`; say(`⚔ The squire comes back from the crusade (D20: ${r}) with 5 coins.`, 'good'); }
      else extra = `<p>⚔ The squire goes on a crusade. D20: <b>${r}</b>. He does not come back.</p>`;
    }
    board();
    await next(`<h4>🏚 The vote</h4><div class="wg-tally">${list}</div><p>${name(t)} goes into exile.</p><p class="${t.witch ? 'goodtx' : 'badtx'}">${t.witch ? '🧹 Yes! This person was a WITCH.' : 'Oh no. This person was innocent.'}</p>${seized}${extra}`);
  }

  /* ---------- the end ---------- */
  function finish(w) {
    const youWin = (w === 'village') !== !!me.witch;
    store('wh-plays', (+recall('wh-plays') || 0) + 1);
    if (youWin) store('wh-wins', (+recall('wh-wins') || 0) + 1);
    const wit = P.filter(p => p.witch);
    const rich = P.slice().sort((a, b) => (b.coins - b.start) - (a.coins - a.start)).slice(0, 5);
    const why = w === 'village' ? 'All the witches are in exile.' : (innocents().length ? 'The witches are now as many as the innocents: they control every vote.' : 'No innocent is left in the village.');
    const out = { killed: '💀 dead', exiled: '➜ exiled', starved: '☠ hunger' };
    area.innerHTML = `<div class="wg-end">
      <div class="wg-endtop ${youWin ? 'win' : 'lose'}"><p class="k">${w === 'village' ? 'THE VILLAGE WINS' : 'THE WITCHES WIN'}</p><h2>${youWin ? '🏆 You win!' : 'You lose…'}</h2><p>${why}</p></div>
      <div class="wg-cols">
        <section><h3>🧹 The witches were</h3><ul>${wit.map(p => `<li><img src="img/witch/${roleOf(p).img}.png" alt=""><b>${esc(label(p))}</b> <span>${p.start} → ${p.coins} coins</span> <em>${out[p.status] || 'free'}</em></li>`).join('')}</ul></section>
        <section><h3>💰 Follow the money</h3>${ledger.length ? `<ul>${ledger.map(l => `<li><b>${esc(l.who)}</b> (${l.how === 'cursed' ? 'cursed' : 'exiled'}) had ${l.coins} coin${l.coins === 1 ? '' : 's'} → <span>${esc(l.dest)}</span></li>`).join('')}</ul>` : '<p>Nobody was cursed or exiled with coins.</p>'}
          <p class="sum">Taken by the witches: <b>${stats.looted}</b> coins · taken from the exiled by the bishop / lords: <b>${stats.confiscated}</b>.</p></section>
        <section><h3>📈 Who got richer?</h3><ul>${rich.map(p => `<li><img src="img/witch/${roleOf(p).img}.png" alt=""><b>${esc(label(p))}</b> <span>${p.coins - p.start >= 0 ? '+' : ''}${p.coins - p.start}</span>${p.witch ? ' <em>witch</em>' : ''}</li>`).join('')}</ul></section>
      </div>
      <div class="wg-reveal"><p class="k">AND IN REAL HISTORY…</p><h2>There were no witches.</h2><p>In this game the witches were real. In history they were never real: the people who were accused were herbalists, midwives, widows… and somebody <b>always</b> gained from the accusation (a neighbour, a lord, the Church). Look at “Follow the money”.</p></div>
      <div class="wg-btns end"><button type="button" class="wg-btn" id="wgAgain">↻ Play again</button><button type="button" class="wg-btn ghost" id="wgDone">Close</button></div>
    </div>`;
    $('whScore').textContent = '';
    $('wgAgain').addEventListener('click', () => game());
    $('wgDone').addEventListener('click', close);
    modal.querySelector('.gq-box').scrollTop = 0;
  }

  async function game() {
    ++runId;
    try {
      setup();
      const r = roleOf(me);
      const friends = liveWitches().filter(x => x !== me).map(label).map(esc).join(', ');
      await ask(`<h4>${me.witch ? '🧹 You are a WITCH' : 'You are innocent'}</h4>
        <p>Your card: <b>${esc(label(me))}</b> <em>(${esc(r.it)})</em></p>
        <p>${me.witch ? `Every night the witches open their eyes and curse a villager. Your friends: <b>${friends}</b>. You win when no innocent is left. Do not let the village find you!` : `Four villagers are secret <b>witches</b>. Every night the narrator calls the roles and the witches curse somebody. Find the witches and send them into exile!`}</p>
        <p class="mute">${esc(r.ab)}</p>`, [{ label: 'Start the game ▶', value: true }]);
      let w = null;
      while (!w) {
        await playSeason(); if ((w = winner())) break;
        await playNight(); if ((w = winner())) break;
        await playMorning();
        await playPowers();
        await playExile(); if ((w = winner())) break;
        if (!me.alive && !watching) {
          watching = true;
          await ask('<h4>You are out of the game</h4><p>You can watch how it ends.</p>', [{ label: 'Watch ▶', value: true }]);
        }
      }
      finish(w);
    } catch (e) { if (e !== STOP) throw e; }
  }

  /* ---------- open / close ---------- */
  function open() {
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    $('whClose').focus();
    game();
  }
  function close() {
    runId++; resolver = null;
    modal.hidden = true;
    document.documentElement.classList.remove('gq-open');
  }
  $('whClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);
  document.querySelectorAll('[data-wh="play"]').forEach(b => b.addEventListener('click', open));
  window.WITCH_GAME = { open, close };

  /* ---------- the Games list on the home page ---------- */
  window.addEventListener('load', () => {
    const list = $('gameList');
    if (!list || typeof PAGES === 'undefined') return;
    const pill = document.createElement('details');
    pill.className = 'game-topic';
    pill.style.setProperty('--c', 'var(--pal-plum)');
    const games = [['play', 'The Village Game', 'wh-play', () => open()], ['guess', 'Who am I? (Guess who)', 'wh-guess:R', () => window.WITCH_GUESS && window.WITCH_GUESS.open()]];
    pill.innerHTML = `<summary>Witch hunt <small>${games.length}</small></summary><div class="topic-pages">${games.map(([id, t, where]) => `<a href="#p${PAGES.of(where)}" data-wh-go="${id}">${t}</a>`).join('')}</div>`;
    list.append(pill);
    document.addEventListener('click', e => { if (!e.target.closest('#gameList')) pill.open = false; });
    list.addEventListener('toggle', e => {
      if (e.target.open) list.querySelectorAll('.game-topic').forEach(o => { if (o !== e.target) o.open = false; });
    }, true);
    pill.querySelectorAll('[data-wh-go]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      pill.open = false;
      const run = games.find(x => x[0] === a.dataset.whGo)[3];
      if (location.hash === a.getAttribute('href')) { run(); return; }
      document.addEventListener('spreadchange', () => run(), { once: true });
      location.hash = a.getAttribute('href');
    }));
    window.hideClosedGames?.();
  });
})();
