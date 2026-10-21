// Witch hunt (CLIL, [wh-play]): the village game against the computer, in a pop-up (like the Sports and Emotions games).
// One pupil plays against the computer: 22 villagers (the characters of the teacher's PDF, witch-data.js), each with a power, coins and a vote.
// Three of them are secret ACCUSERS. Every night the accusers point at somebody ("Witch!") and rob a coin; every day the village votes:
// is the accused guilty (burned at the stake)? and who goes into exile? The village wins when all the accusers are exiled.
// Nobody is ever a witch: when a person is burned the card says so, and at the end the game shows who got the coins.
// Opened by a button with data-wh="play" ([wh-play]) and by the pill "Witch hunt" of the Games list on the home page.

(() => {
  const DATA = window.WITCH_DATA;
  if (!DATA) return;
  const CHARS = DATA.CHARS;
  const CHAR = Object.fromEntries(CHARS.map(c => [c.id, c]));
  const KCOL = { church: 'plum', nobility: 'mustard', people: 'coral' };
  const LABEL = { lord1: 'Lord I', lord2: 'Lord II', farmerM1: 'Farmer I', farmerM2: 'Farmer II', farmerF: 'Farmer (f)', merchantM: 'Merchant (m)',
    merchantF: 'Merchant (f)', innkeeperM: 'Innkeeper (m)', innkeeperF: 'Innkeeper (f)' };
  const SPIES = ['innkeeperM', 'innkeeperF', 'maid'];
  const TAXERS = ['bishop', 'lord1', 'lord2'];
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
  let accused = null, annulled = null, healerUsed = false, watching = false;
  let ledger = [];       // who got the coins of the burned people
  let stats = { robbed: 0, inherited: 0, confiscated: 0 };
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
  const liveAccusers = () => P.filter(p => p.accuser && p.alive);
  const name = p => `<b>${esc(label(p))}</b>`;
  const weight = p => ({ bishop: 3, lord1: 2, lord2: 2 }[p.role] || 1);
  const voters = () => alive().filter(p => p !== annulled);

  /* ---------- log, board, panel ---------- */
  function say(html, kind = '') {
    const ul = $('wgLog');
    if (!ul) return;
    ul.insertAdjacentHTML('beforeend', `<li class="${kind}">${html}</li>`);
    ul.scrollTop = ul.scrollHeight;
  }
  function tileHtml(p, i) {
    const r = roleOf(p);
    const d = p.d ? `<em class="d ${p.d > 0 ? 'up' : 'down'}">${p.d > 0 ? '+' : '−'}${Math.abs(p.d)}</em>` : '';
    const st = { burned: '🔥', exiled: '➜', starved: '☠' }[p.status] || (p.accused ? '⚑' : '');
    return `<button type="button" class="wg-tile ${p.alive ? '' : 'out ' + p.status} ${p.accused ? 'accused' : ''} ${p === me ? 'me' : ''}" data-i="${i}" style="--k:var(--pal-${KCOL[r.cls]})" aria-label="${esc(label(p))}, ${p.coins} coins">
      <span class="pp"><img src="img/witch/${r.img}.png" alt="" loading="lazy"></span>
      <b>${esc(label(p))}</b>
      <span class="co"><i>●</i>${p.coins}${d}</span>
      ${p === me ? '<span class="you">YOU</span>' : ''}${st ? `<span class="st">${st}</span>` : ''}
    </button>`;
  }
  function board() {
    const b = $('wgBoard');
    if (b) b.innerHTML = P.map(tileHtml).join('');
    const c = $('wgMe');
    if (!c || !me) return;
    const r = roleOf(me);
    const known = P.filter(p => me.known[p.i]).map(p => `${esc(label(p))}: <b>${me.known[p.i] === 'bad' ? 'BAD' : 'good'}</b>`);
    const friends = liveAccusers().filter(x => x !== me).map(label).map(esc).join(', ');
    c.innerHTML = `<div class="wg-arch" style="--k:var(--pal-${KCOL[r.cls]})"><img src="img/witch/${r.img}.png" alt=""></div>
      <div class="tx"><small>${esc(DATA.CLASSES[r.cls].name)}</small><h3>${esc(label(me))} <em>${esc(r.it)}</em></h3>
      <p class="ab">${esc(r.ab)}</p>
      <p class="team ${me.accuser ? 'bad' : 'good'}">${me.accuser ? '⚑ SECRET: you are an ACCUSER. Friends: ' + (friends || 'none left') : 'You are a villager. Find the three accusers!'}</p>
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
    p.alive = false; p.status = how; p.accused = false;
    if (how === 'burned' || how === 'starved') {
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
    const bad = liveAccusers().length, good = alive().length - bad;
    if (!bad) return 'village';
    if (good <= bad) return 'accusers';
    const total = alive().reduce((s, p) => s + p.coins, 0);
    if (round >= 3 && total && liveAccusers().reduce((s, p) => s + p.coins, 0) * 2 > total) return 'accusers';
    return null;
  }

  /* ---------- setup ---------- */
  function setup() {
    const roles = shuffle(CHARS.map(c => c.id));
    // the tiles keep the order of the book (men, then women); the roles are dealt at random
    P = roles.map((role, i) => ({ i, role, coins: CHAR[role].coins, start: CHAR[role].coins, alive: true, status: 'alive', accuser: false, accused: false, d: 0, sus: {}, known: {}, claimed: false, human: false }));
    me = pick(P); me.human = true;
    shuffle(P).slice(0, 3).forEach(p => { p.accuser = true; });
    round = 0; season = 'normal'; accused = null; annulled = null; healerUsed = false; watching = false;
    ledger = []; stats = { robbed: 0, inherited: 0, confiscated: 0 };
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

  /* ---------- 2 · the night ---------- */
  async function playNight() {
    say('🌙 <b>Night.</b> The village sleeps.', 'head');
    // the spies listen
    for (const p of alive().filter(x => SPIES.includes(x.role))) {
      if (!p.alive || p.accuser) continue;
      const want = p.role === 'maid' ? 'f' : 'm';
      const targets = alive().filter(t => t !== p && sex(t) === want && !p.known[t.i]);
      if (!targets.length) continue;
      if (p === me) {
        const t = await pickTile(`<h4>🌙 Night: you listen</h4><p>${p.role === 'maid' ? 'Choose a woman' : 'Choose a man'}. Is this person good or bad?</p>`, x => targets.includes(x));
        p.known[t.i] = t.accuser ? 'bad' : 'good';
        say(`👂 You listen to ${name(t)}: <b>${t.accuser ? 'BAD' : 'good'}</b>.`, 'me');
        board();
      } else {
        const t = pick(targets);
        p.known[t.i] = t.accuser ? 'bad' : 'good';
      }
    }
    // the accusers point at somebody and rob a coin
    const targets = alive().filter(t => !t.accuser);
    let victim, thief;
    if (me.alive && me.accuser) {
      victim = await pickTile('<h4>🌙 Night: you are an accuser</h4><p>Point at somebody: <em>“Witch!”</em> You also take 1 coin. Be careful: the village must not find you.</p>', t => targets.includes(t));
      thief = me;
    } else {
      const wt = t => 1 + t.coins + (SPIES.includes(t.role) ? 3 : 0) + (sex(t) === 'f' && cls(t) === 'people' ? 1 : 0);
      let r = Math.random() * targets.reduce((s, t) => s + wt(t), 0);
      victim = targets.find(t => (r -= wt(t)) <= 0) || targets[0];
      thief = pick(liveAccusers());
      await sleep(400);
    }
    accused = victim;
    victim.accused = true;
    if (victim.role !== 'blacksmith' && victim.coins > 0) {
      move(victim, thief, 1);
      stats.robbed++;
      // some people notice who got richer
      alive().filter(v => !v.accuser && !v.human).forEach(v => { if (Math.random() < .3) v.sus[thief.i] = (v.sus[thief.i] || 0) + 1; });
    }
    if (me.alive && me.accuser) say(`⚑ You accuse ${name(victim)}${victim.role === 'blacksmith' ? ' (nobody can rob a blacksmith)' : ' and take 1 coin'}.`, 'me');
    board();
  }

  /* ---------- 3 · the morning ---------- */
  async function playMorning() {
    say('☀ <b>Morning.</b> The bell rings.', 'head');
    const v = accused;
    say(`⚑ ${name(v)} is accused of witchcraft!`, 'bad');
    const lines = [];
    lines.push(`<b>${esc(label(v))}</b>: “I am not a witch! I am just a ${esc(roleOf(v).name.toLowerCase())}.”`);
    const liars = liveAccusers().filter(a => a !== v && !a.human);
    if (liars.length) lines.push(`<b>${esc(label(pick(liars)))}</b>: “I saw ${esc(label(v))} near the forest at night. It’s a witch!”`);
    for (const s of alive().filter(x => !x.human && !x.accuser && Object.values(x.known).includes('bad'))) {
      const id = +Object.keys(s.known).find(k => s.known[k] === 'bad');
      if (P[id].alive) { lines.push(`<b>${esc(label(s))}</b>: “I listened in the night. ${esc(label(P[id]))} is <u>BAD</u>!”`); P[id].claimed = true; }
    }
    // an accuser who is a spy lies: he or she names an innocent person
    const lie = liveAccusers().find(a => !a.human && SPIES.includes(a.role));
    if (lie) {
      const t = pick(alive().filter(x => !x.accuser && x !== v));
      if (t) { lines.push(`<b>${esc(label(lie))}</b>: “I listened in the night. ${esc(label(t))} is <u>BAD</u>!”`); t.claimed = true; }
    }
    board();
    await next(`<h4>⚑ ${esc(label(v))} is accused!</h4><ul class="wg-talk">${lines.map(l => `<li>${l}</li>`).join('')}</ul><p class="mute">Think: who gains from this accusation?</p>`, 'Use your powers ▶');
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
        const dead = P.filter(x => !x.alive && ['burned', 'starved'].includes(x.status));
        if (dead.length) {
          const t = await pickTile('<h4>Your power: BRING BACK TO LIFE</h4><p>Pay 2 coins to bring back a person who was burned or died of hunger. You can do it only once.</p>', x => dead.includes(x), 'No, thanks');
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
        const t = pick(P.filter(x => !x.alive && ['burned', 'starved'].includes(x.status)));
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
    gain(t, Math.max(1, t.coins) - t.coins + 0);
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

  /* ---------- 5 · the trial ---------- */
  async function playTrial() {
    const v = accused;
    if (!v || !v.alive) return;
    let g = 0, n = 0;
    const votes = [];
    const mustFree = p => p.role === 'squire' && v.role === 'blacksmith';
    let mine = null;
    if (me.alive && me !== v && me !== annulled) {
      mine = await ask(`<h4>⚖ The trial</h4><p>${name(v)} is accused of witchcraft. Is the accused guilty?</p><p class="mute">Your vote counts <b>${weight(me)}</b>.${mustFree(me) ? ' (You cannot vote against the blacksmith.)' : ''}</p>`,
        [{ label: '🔥 Guilty: burn', value: 'g', cls: 'bad' }, { label: '🕊 Not guilty: free', value: 'n', cls: 'good' }]);
      if (mustFree(me)) mine = 'n';
    } else if (me.alive && me === annulled) say('✋ Your vote is cancelled today.', 'bad');
    for (const p of voters()) {
      if (p === v) continue;
      let guilty;
      if (p === me) guilty = mine === 'g';
      else if (mustFree(p)) guilty = false;
      else if (p.accuser) guilty = Math.random() < .95;
      else {
        let pr = .45 + (season === 'famine' ? .2 : season === 'abundance' ? -.1 : 0) + (sex(v) === 'f' && cls(v) === 'people' ? .08 : 0) + (cls(p) !== 'people' && cls(v) === 'people' ? .08 : 0);
        if (p.known[v.i] === 'good') pr = .08;
        guilty = Math.random() < pr;
      }
      if (guilty) g += weight(p); else n += weight(p);
      votes.push({ p, guilty });
    }
    // the maid cannot be burned without the vote of the noblewoman
    const nw = holder('noblewoman');
    let protect = false;
    if (v.role === 'maid' && nw && nw.alive && nw !== annulled) {
      const nv = votes.find(x => x.p === nw);
      if (!nv || !nv.guilty) protect = true;
    }
    const total = g + n || 1;
    const bar = `<div class="wg-bar"><span class="g" style="width:${Math.round(g / total * 100)}%">🔥 ${g}</span><span class="n" style="width:${Math.round(n / total * 100)}%">🕊 ${n}</span></div>`;
    if (g > n && !protect) {
      await next(`<h4>⚖ The vote</h4>${bar}<p>The village says: <b>GUILTY</b>.</p>`, 'The stake 🔥');
      burn(v);
      board();
      await next(`<div class="wg-flip"><div class="front">NOT A WITCH</div></div><h4>🔥 ${esc(label(v))} is burned.</h4><p><b>Witches do not exist.</b> ${esc(label(v))} was innocent. Look at the coins: who got them?</p>`);
    } else {
      v.accused = false;
      say(`🕊 ${name(v)} is set free.`, 'good');
      board();
      await next(`<h4>⚖ The vote</h4>${bar}<p>${protect && g > n ? 'The noblewoman does not vote against her maid: <b>she is free</b>.' : 'The village says: <b>NOT GUILTY</b>. ' + esc(label(v)) + ' is free.'}</p>`);
    }
    accused = null;
  }
  function burn(v) {
    const coins = v.coins;
    died(v, 'burned');
    const bad = liveAccusers();
    const dest = [];
    if (coins > 0) {
      const toAcc = Math.ceil(coins / 2), rest = coins - toAcc;
      const acc = bad.length ? pick(bad) : null;
      if (acc) { gain(acc, toAcc); stats.inherited += toAcc; dest.push(`${toAcc} → ${label(acc)}`); }
      const lord = [holder('lord1'), holder('lord2')].find(l => l && l.alive);
      const bishop = holder('bishop');
      const taker = (bishop && bishop.alive) ? bishop : lord || acc;
      if (taker && rest) { gain(taker, rest); stats.confiscated += rest; dest.push(`${rest} → ${label(taker)}`); }
      v.d -= coins; v.coins = 0;
    }
    ledger.push({ who: label(v), coins, dest: dest.join(' · ') || '–' });
    say(`🔥 ${name(v)} is burned at the stake. <em>Not a witch.</em> ${coins ? `${coins} coin${coins > 1 ? 's' : ''} go to: ${dest.map(esc).join(', ')}.` : ''}`, 'bad');
  }

  /* ---------- 6 · the exile ---------- */
  async function playExile() {
    if (winner()) return;
    let mine = null;
    if (me.alive && me !== annulled) {
      mine = await pickTile(`<h4>🏚 The village meeting</h4><p>Does somebody go into exile? Choose a person, or nobody.</p><p class="mute">Your vote counts <b>${weight(me)}</b>. Who gets richer? Who says strange things?</p>`,
        p => p.alive && p !== me && !(me.role === 'squire' && p.role === 'blacksmith'), 'Nobody');
    } else if (me.alive) say('✋ Your vote is cancelled today.', 'bad');
    const tally = new Map(); let nobody = 0;
    const add = (t, w) => { if (!t) nobody += w; else tally.set(t, (tally.get(t) || 0) + w); };
    for (const p of voters()) {
      let t;
      if (p === me) t = mine;
      else if (p.accuser) {
        const inn = alive().filter(x => !x.accuser);
        const threat = inn.filter(x => x.claimed || SPIES.includes(x.role));
        t = Math.random() < .2 ? null : pick(threat.length && Math.random() < .6 ? threat : inn);
      } else if (Math.random() < .25) t = null;
      else {
        const list = alive().filter(x => x !== p && !(p.role === 'squire' && x.role === 'blacksmith'));
        const best = list.map(x => [x, suspicion(p, x)]).sort((a, b) => b[1] - a[1])[0];
        t = best && best[1] >= 1.1 ? best[0] : null;
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
      const nwVote = tally.size && nw === me ? mine === t : Math.random() < .2;
      if (!nwVote) {
        say('🛡 The noblewoman protects her maid. Nobody goes into exile.');
        await next(`<h4>🏚 The vote</h4><div class="wg-tally">${list}</div><p>The noblewoman protects the maid. Nobody goes into exile.</p>`);
        return;
      }
    }
    t.alive = false; t.status = 'exiled'; t.accused = false;
    say(`➜ ${name(t)} goes into exile. ${t.accuser ? '<b>An ACCUSER! Well done.</b>' : '<em>Innocent.</em>'}`, t.accuser ? 'good' : 'bad');
    let extra = '';
    if (t.role === 'squire') {
      const r = roll(20);
      if (r > 15) { t.alive = true; t.status = 'alive'; gain(t, 5); extra = `<p>⚔ The squire goes on a crusade. D20: <b>${r}</b>. He comes back with 5 coins!</p>`; say(`⚔ The squire comes back from the crusade (D20: ${r}) with 5 coins.`, 'good'); }
      else extra = `<p>⚔ The squire goes on a crusade. D20: <b>${r}</b>. He does not come back.</p>`;
    }
    board();
    await next(`<h4>🏚 The vote</h4><div class="wg-tally">${list}</div><p>${name(t)} goes into exile.</p><p class="${t.accuser ? 'goodtx' : 'badtx'}">${t.accuser ? '⚑ Yes! This person was an ACCUSER.' : 'Oh no. This person was innocent.'}</p>${extra}`);
  }

  /* ---------- the end ---------- */
  function finish(w) {
    const youWin = (w === 'village') !== !!me.accuser;
    store('wh-plays', (+recall('wh-plays') || 0) + 1);
    if (youWin) store('wh-wins', (+recall('wh-wins') || 0) + 1);
    const acc = P.filter(p => p.accuser);
    const rich = P.slice().sort((a, b) => (b.coins - b.start) - (a.coins - a.start)).slice(0, 5);
    const why = w === 'village' ? 'The village found all the accusers.' : (liveAccusers().length * 2 >= alive().length ? 'The accusers are now half of the village.' : 'The accusers have more than half of the coins.');
    const out = { burned: '🔥 burned', exiled: '➜ exiled', starved: '☠ hunger' };
    area.innerHTML = `<div class="wg-end">
      <div class="wg-endtop ${youWin ? 'win' : 'lose'}"><p class="k">${w === 'village' ? 'THE VILLAGE WINS' : 'THE ACCUSERS WIN'}</p><h2>${youWin ? '🏆 You win!' : 'You lose…'}</h2><p>${why}</p></div>
      <div class="wg-reveal"><p class="k">THE TRUTH</p><h2>There were no witches.</h2><p>Every person who was burned was innocent. But somebody <b>always</b> gained from the accusation.</p></div>
      <div class="wg-cols">
        <section><h3>⚑ The accusers were</h3><ul>${acc.map(p => `<li><img src="img/witch/${roleOf(p).img}.png" alt=""><b>${esc(label(p))}</b> <span>${p.start} → ${p.coins} coins</span> <em>${out[p.status] || 'free'}</em></li>`).join('')}</ul></section>
        <section><h3>💰 Follow the money</h3>${ledger.length ? `<ul>${ledger.map(l => `<li><b>${esc(l.who)}</b> had ${l.coins} coin${l.coins === 1 ? '' : 's'} → <span>${esc(l.dest)}</span></li>`).join('')}</ul>` : '<p>Nobody was burned.</p>'}
          <p class="sum">Robbed in the night: <b>${stats.robbed}</b> · Coins of burned people: accusers <b>${stats.inherited}</b>, bishop / lords <b>${stats.confiscated}</b>.</p></section>
        <section><h3>📈 Who got richer?</h3><ul>${rich.map(p => `<li><img src="img/witch/${roleOf(p).img}.png" alt=""><b>${esc(label(p))}</b> <span>${p.coins - p.start >= 0 ? '+' : ''}${p.coins - p.start}</span>${p.accuser ? ' <em>accuser</em>' : ''}</li>`).join('')}</ul></section>
      </div>
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
      const friends = liveAccusers().filter(x => x !== me).map(label).map(esc).join(', ');
      await ask(`<h4>${me.accuser ? '⚑ You are an ACCUSER' : 'You are a villager'}</h4>
        <p>Your card: <b>${esc(label(me))}</b> <em>(${esc(r.it)})</em></p>
        <p>${me.accuser ? `Every night you point at somebody and say <em>“Witch!”</em>, and you take a coin. Your friends: <b>${friends}</b>. Do not let the village find you!` : 'Three villagers are secret <b>accusers</b>. Watch the coins and listen to what people say. Send all the accusers into exile!'}</p>
        <p class="mute">${esc(r.ab)}</p>`, [{ label: 'Start the game ▶', value: true }]);
      let w = null;
      while (!w) {
        await playSeason(); if ((w = winner())) break;
        await playNight();
        await playMorning();
        await playPowers();
        await playTrial(); if ((w = winner())) break;
        await playExile(); if ((w = winner())) break;
        if (!me.alive && !watching) {
          watching = true;
          await ask('<h4>You are out of the game</h4><p>You can watch how it ends.</p>', [{ label: 'Watch ▶', value: true }]);
        }
        P.forEach(p => { p.accused = false; });
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
  document.querySelectorAll('[data-wh]').forEach(b => b.addEventListener('click', open));
  window.WITCH_GAME = { open, close };

  /* ---------- the Games list on the home page ---------- */
  window.addEventListener('load', () => {
    const list = $('gameList');
    if (!list || typeof PAGES === 'undefined') return;
    const pill = document.createElement('details');
    pill.className = 'game-topic';
    pill.style.setProperty('--c', 'var(--pal-plum)');
    const href = `#p${PAGES.of('wh-play')}`;
    pill.innerHTML = `<summary>Witch hunt <small>1</small></summary><div class="topic-pages"><a href="${href}" data-wh-go>The Village Game</a></div>`;
    list.append(pill);
    document.addEventListener('click', e => { if (!e.target.closest('#gameList')) pill.open = false; });
    list.addEventListener('toggle', e => {
      if (e.target.open) list.querySelectorAll('.game-topic').forEach(o => { if (o !== e.target) o.open = false; });
    }, true);
    pill.querySelector('[data-wh-go]').addEventListener('click', e => {
      e.preventDefault();
      pill.open = false;
      if (location.hash === href) { open(); return; }
      document.addEventListener('spreadchange', () => open(), { once: true });
      location.hash = href;
    });
    window.hideClosedGames?.();
  });
})();
