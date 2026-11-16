// Rome vs Longobards: the Clash. A class game: two teams (Romans / Longobards), each team is made of "families" (a man and a woman).
// The pupils create their heroes in the book ([ps-clash-hero]) and send them to the teacher; on the day of the game the teacher (Games for the
// teacher → Rome vs Longobards) loads the heroes, makes the families and opens a MATCH with a 4-letter code: every group joins with a PC
// ("Join the battle" in the book) and answers the grammar questions. Families fight one against one: every round starts with a grammar
// question, the right answers give a boost, then the heroes act (men fight, women fight or flee depending on the culture) with dice and
// their D&D-like stats. Data (jobs, questions, lists): clash-data.js. The roster is saved in this browser (localStorage), the war is not.
//
// Online (needs the internet, cloud.js): the teacher's device is the host: it writes the state of the battle in the room (field `cl` of
// duels/<CODE>, never the right answer); every group writes only its own answer in duels/<CODE>/players/<id> (the same rooms of the Grammar Race).

(() => {
  const D = window.CLASH_DATA;
  if (!D) return;
  const KEY = 'libro-clash-v1';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const d6 = () => 1 + Math.floor(Math.random() * 6);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const rand = n => Array.from({ length: n }, () => Math.random().toString(36)[2]).join('');
  const SIDE = { R: { name: 'Romans', icon: '🏛️' }, L: { name: 'Longobards', icon: '🌲' } };
  const STATS = [['str', 'STR', '⚔️', 'attack'], ['agi', 'AGI', '🛡️', 'defense and escape'], ['end', 'END', '❤️', 'hit points'], ['wis', 'WIS', '🧠', 'helps the escape']];
  const TOTAL = 12;
  const norm = s => String(s).toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const store = {
    get: k => { try { return localStorage.getItem('cl-' + k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem('cl-' + k, v); } catch { /* private window */ } },
  };
  const rooms = () => window.book && window.book.rooms;
  const race = () => window.book && window.book.race;
  const hero$ = () => window.book && window.book.clash;
  function errorText(e) {
    const c = (e && (e.code || e.message)) || '';
    if (/permission-denied/.test(c)) return 'The database says no: the Firestore rules must be published (see firestore.rules).';
    if (c === 'notfound') return 'There is no battle with this code. Check the letters!';
    if (c === 'expired') return 'This battle is too old. Ask your teacher for a new code.';
    if (c === 'busy') return 'Could not make a code. Try again.';
    if (!rooms()) return 'The online part works only in the internet version of the book.';
    return 'Could not connect. Check the internet and try again.';
  }

  /* ================= the roster (saved) ================= */
  let cfg = (() => {
    try { const c = JSON.parse(localStorage.getItem(KEY)); if (c && c.fams) return c; } catch { /* nothing saved */ }
    return { women: { R: 'flee', L: 'fight' }, fams: { R: [], L: [] } };
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch { /* storage unavailable */ } };
  const uid = () => rand(6);
  const job = (side, role, k) => D.JOBS[side][role].find(j => j.k === k) || D.JOBS[side][role][0];
  const randStats = () => {
    const s = { str: 1, agi: 1, end: 1, wis: 1 };
    for (let left = TOTAL - 4; left > 0;) { const k = pick(Object.keys(s)); if (s[k] < 5) { s[k]++; left--; } }
    return s;
  };
  const randHero = (side, role, name) => ({ name, job: pick(D.JOBS[side][role]).k, ...randStats() });
  const randFamily = (side, used) => {
    const N = D.NAMES[side];
    const free = N.fam.filter(n => !used.includes(n));
    return { id: uid(), name: pick(free.length ? free : N.fam), man: randHero(side, 'man', pick(N.man)), woman: randHero(side, 'woman', pick(N.woman)) };
  };
  const total = h => h.str + h.agi + h.end + h.wis;
  // a hero sent by a pupil → a member of a family
  const fromHero = p => { const h = p.hero; return { name: h.name, job: h.job, str: h.str, agi: h.agi, end: h.end, wis: h.wis, pid: p.id, who: p.name || p.email || '', meta: { adj: h.adj || [], hair: h.hair, style: h.style, eyes: h.eyes, build: h.build, feature: h.feature, game: h.game, hobby: h.hobby, pic: h.pic || '', desc: h.desc || '', daily: h.daily || '' } }; };
  const about = m => { const x = m.meta; return x ? `${(x.adj || []).filter(Boolean).join(', ')}${x.hobby ? ' · loves ' + x.hobby : ''}${x.daily ? ' · Every day: ' + x.daily : ''}` : ''; };

  /* ================= the window ================= */
  let root = null, war = null, bat = null, bag = [];
  let pool = [];                 // the heroes of the pupils (loaded from the cloud)
  let net = null;                // the online match (host): { code, rid, players, no }
  let me = null;                 // a group's PC (player): { code, fam, pid, unsub, ... }
  function build() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'cl-overlay'; root.id = 'clOverlay'; root.hidden = true;
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
    root.innerHTML = `<div class="cl-box">
      <header class="cl-top">
        <span class="cl-title">⚔️ Rome <i>vs</i> Longobards</span>
        <span class="cl-code" id="clCode" hidden></span>
        <span class="cl-score" id="clScore" hidden><b class="R" id="clSR">0</b><i>–</i><b class="L" id="clSL">0</b></span>
        <button type="button" class="cl-btn light" id="clHome" hidden>⚙️ Families</button>
        <button type="button" class="cl-btn light" id="clFull" title="Full screen">⛶</button>
        <button type="button" class="cl-btn light" id="clClose" aria-label="Close">✕</button>
      </header>
      <div class="cl-area" id="clArea"></div></div>`;
    document.body.append(root);
    $('clClose').addEventListener('click', close);
    $('clFull').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen?.(); else root.requestFullscreen?.().catch(() => {}); });
    $('clHome').addEventListener('click', () => { if (!bat || confirm('Leave this battle?')) { bat = null; war = null; setup(); } });
    // while the game is open the arrow keys must not turn the book's pages
    document.addEventListener('keydown', e => { if (root.hidden) return; if (e.key === 'Escape' && !document.fullscreenElement) close(); if (!e.target.closest('input, select')) e.stopPropagation(); }, true);
  }
  function open() { me?.unsub?.(); me = null; build(); root.hidden = false; document.documentElement.classList.add('gq-open'); paintCode(); war ? lobby() : setup(); }
  function close() { root.hidden = true; document.documentElement.classList.remove('gq-open'); if (document.fullscreenElement) document.exitFullscreen?.(); if (me) { me.unsub?.(); me = null; } }
  const area = () => $('clArea');
  const paintScore = s => { const sc = s || war?.score; $('clScore').hidden = !sc; if (sc) { $('clSR').textContent = sc.R; $('clSL').textContent = sc.L; } $('clHome').hidden = !war; };
  function paintCode() { const c = $('clCode'); if (!c) return; c.hidden = !net; if (net) c.innerHTML = `📡 code <b>${net.code}</b>`; }

  /* ================= 1. setup: the families ================= */
  function heroForm(side, fam, role) {
    const h = fam[role], J = D.JOBS[side][role], t = total(h);
    const used = new Set(['R', 'L'].flatMap(s => cfg.fams[s].flatMap(f => [f.man.pid, f.woman.pid])).filter(Boolean));
    const opts = pool.filter(p => p.hero.people === side && p.hero.role === role && (!used.has(p.id) || p.id === h.pid));
    return `<div class="cl-hero" data-role="${role}">
      <div class="cl-hero-top"><span class="cl-role">${role === 'man' ? '👨 Man' : '👩 Woman'}</span>
        <input class="cl-in" data-f="name" value="${esc(h.name)}" placeholder="Name" aria-label="${role} name">
        <button type="button" class="cl-mini" data-act="rand" title="Random stats">🎲</button></div>
      ${opts.length ? `<select class="cl-in cl-pick" data-f="pick" aria-label="Pick a hero of a pupil"><option value="">📥 a pupil’s hero…</option>${opts.map(p => `<option value="${esc(p.id)}"${p.id === h.pid ? ' selected' : ''}>${esc(p.hero.name)} · ${esc(p.hero.jobName)} — ${esc(p.name || p.email)}</option>`).join('')}</select>` : ''}
      <select class="cl-in" data-f="job" aria-label="${role} job">${J.map(j => `<option value="${j.k}"${j.k === h.job ? ' selected' : ''}>${j.e} ${j.n} — ${j.perk}</option>`).join('')}</select>
      <div class="cl-stats">${STATS.map(([k, n, e]) => `<label title="${n}">${e}<select class="cl-in" data-f="${k}" aria-label="${n}">${[1, 2, 3, 4, 5].map(v => `<option${v === h[k] ? ' selected' : ''}>${v}</option>`).join('')}</select></label>`).join('')}
        <b class="cl-tot ${t === TOTAL ? 'ok' : 'no'}">${t}/${TOTAL}</b></div>
      ${h.who ? `<div class="cl-who" title="${esc(about(h))}">📥 ${esc(h.who)} <small>${esc(about(h))}</small></div>` : ''}</div>`;
  }
  function famCard(side, fam) {
    return `<div class="cl-fam ${side}" data-id="${fam.id}">
      <div class="cl-fam-top"><span>${SIDE[side].icon}</span><input class="cl-in big" data-f="fname" value="${esc(fam.name)}" aria-label="Family name"><button type="button" class="cl-mini" data-act="del" title="Remove the family">✕</button></div>
      ${heroForm(side, fam, 'man')}${heroForm(side, fam, 'woman')}</div>`;
  }
  function poolSummary() {
    if (!pool.length) return '';
    const n = (p, r) => pool.filter(x => x.hero.people === p && x.hero.role === r).length;
    return `<details class="cl-pool"><summary>📥 ${pool.length} heroes received · 🏛️ ${n('R', 'man')} men, ${n('R', 'woman')} women · 🌲 ${n('L', 'man')} men, ${n('L', 'woman')} women</summary>
      <ul>${pool.map(p => `<li>${p.hero.people === 'R' ? '🏛️' : '🌲'} <b>${esc(p.hero.name)}</b> · ${esc(p.hero.jobName)} (${p.hero.role === 'man' ? '♂' : '♀'}) — ${esc(p.name || p.email)} <small>${esc((p.hero.adj || []).join(', '))}</small> <button type="button" class="cl-mini" data-act="delhero" data-id="${esc(p.id)}" title="Delete this hero">🗑</button></li>`).join('')}</ul></details>`;
  }
  function setup(msg = '') {
    war = null; bat = null;
    paintScore(); paintCode();
    const col = side => `<section class="cl-col ${side}">
      <h3>${SIDE[side].icon} ${SIDE[side].name} <small>${cfg.fams[side].length} families</small></h3>
      <div class="cl-rule">Women: <button type="button" class="cl-seg${cfg.women[side] === 'fight' ? ' on' : ''}" data-act="women" data-side="${side}" data-v="fight">⚔️ fight</button><button type="button" class="cl-seg${cfg.women[side] === 'flee' ? ' on' : ''}" data-act="women" data-side="${side}" data-v="flee">🏃 flee</button></div>
      ${cfg.fams[side].map(f => famCard(side, f)).join('') || '<p class="cl-empty">No families yet.</p>'}
      <button type="button" class="cl-btn ${side}" data-act="add" data-side="${side}">＋ Add a family</button></section>`;
    area().innerHTML = `<div class="cl-setup">
      <p class="cl-intro">The pupils send their heroes from the book. Press <b>Load the heroes</b>, then <b>Make the families</b> (or pick the heroes by hand, or type them). Every family has a man and a woman; 4 stats from 1 to 5, <b>12 points</b> in total.</p>
      <div class="cl-actions top"><button type="button" class="cl-btn" data-act="load">📥 Load the heroes of the pupils</button><button type="button" class="cl-btn" data-act="auto">🪄 Make the families</button></div>
      <p class="cl-msg" id="clMsg">${esc(msg)}</p>${poolSummary()}
      <div class="cl-cols">${col('R')}${col('L')}</div>
      <div class="cl-actions"><button type="button" class="cl-btn light" data-act="demo">🎲 Random families (3 + 3)</button><button type="button" class="cl-btn light" data-act="clear">🗑 Clear all</button>
        <button type="button" class="cl-btn go" data-act="start">▶ Start the war</button></div></div>`;
  }
  const say$ = t => { const m = $('clMsg'); if (m) m.textContent = t; };
  async function loadHeroes() {
    if (!hero$()) { say$('Loading the heroes works only in the internet version of the book, signed in as the teacher.'); return; }
    say$('Loading…');
    try {
      pool = (await hero$().allHeroes()).filter(p => p.hero && p.hero.people && p.hero.role && p.hero.job);
      setup(`${pool.length} heroes loaded.`);
    } catch (e) { say$(errorText(e)); }
  }
  function autoFamilies() {
    if (!pool.length) { say$('Load the heroes first.'); return; }
    const used = new Set(['R', 'L'].flatMap(s => cfg.fams[s].flatMap(f => [f.man.pid, f.woman.pid])).filter(Boolean));
    const lines = [];
    ['R', 'L'].forEach(s => {
      const men = shuffle(pool.filter(p => p.hero.people === s && p.hero.role === 'man' && !used.has(p.id)));
      const women = shuffle(pool.filter(p => p.hero.people === s && p.hero.role === 'woman' && !used.has(p.id)));
      const names = cfg.fams[s].map(f => f.name);
      while (men.length && women.length) {
        const man = men.pop(), woman = women.pop(), fn = D.NAMES[s].fam.find(n => !names.includes(n)) || 'Family ' + (names.length + 1);
        names.push(fn);
        cfg.fams[s].push({ id: uid(), name: fn, man: fromHero(man), woman: fromHero(woman) });
      }
      if (men.length || women.length) lines.push(`${SIDE[s].icon} ${men.length ? men.length + (men.length === 1 ? ' man' : ' men') : women.length + (women.length === 1 ? ' woman' : ' women')} left without a partner`);
    });
    save(); setup('Families made.' + (lines.length ? ' ' + lines.join(' · ') + ': ask the class, or pick the heroes by hand.' : ''));
  }
  function setupClick(e) {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act, card = b.closest('.cl-fam'), side = b.dataset.side || (card?.classList.contains('L') ? 'L' : card ? 'R' : '');
    if (act === 'women') { cfg.women[side] = b.dataset.v; save(); setup(); }
    else if (act === 'add') { cfg.fams[side].push(randFamily(side, cfg.fams[side].map(f => f.name))); save(); setup(); }
    else if (act === 'del') { cfg.fams[side] = cfg.fams[side].filter(f => f.id !== card.dataset.id); save(); setup(); }
    else if (act === 'rand') {
      const fam = cfg.fams[side].find(f => f.id === card.dataset.id), role = b.closest('.cl-hero').dataset.role;
      Object.assign(fam[role], randStats()); save(); setup();
    } else if (act === 'demo') {
      ['R', 'L'].forEach(s => { while (cfg.fams[s].length < 3) cfg.fams[s].push(randFamily(s, cfg.fams[s].map(f => f.name))); });
      save(); setup();
    } else if (act === 'clear') { if (confirm('Remove all the families?')) { cfg.fams = { R: [], L: [] }; save(); setup(); } }
    else if (act === 'load') loadHeroes();
    else if (act === 'auto') autoFamilies();
    else if (act === 'delhero') { if (confirm('Delete this hero from the database?')) hero$()?.deleteHero(b.dataset.id).then(() => { pool = pool.filter(p => p.id !== b.dataset.id); setup('Hero deleted.'); }).catch(err => say$(errorText(err))); }
    else if (act === 'start') {
      if (!cfg.fams.R.length || !cfg.fams.L.length) { alert('You need at least one Roman and one Longobard family.'); return; }
      war = { score: { R: 0, L: 0 }, done: {}, pts: {} };
      lobby();
    }
  }
  function setupChange(e) {
    const el = e.target.closest('[data-f]'); const card = el?.closest('.cl-fam'); if (!card) return;
    const side = card.classList.contains('L') ? 'L' : 'R', fam = cfg.fams[side].find(f => f.id === card.dataset.id), f = el.dataset.f;
    if (f === 'fname') { fam.name = el.value; save(); return; }
    const role = el.closest('.cl-hero').dataset.role, h = fam[role];
    if (f === 'pick') {   // a hero of a pupil
      const p = pool.find(x => x.id === el.value);
      if (p) fam[role] = fromHero(p); else fam[role] = { name: h.name, job: h.job, str: h.str, agi: h.agi, end: h.end, wis: h.wis };
      save(); return setup();
    }
    h[f] = f === 'name' || f === 'job' ? el.value : +el.value;
    save();
    if (STATS.some(s => s[0] === f)) { const t = card.querySelector(`.cl-hero[data-role="${role}"] .cl-tot`); t.textContent = total(h) + '/' + TOTAL; t.className = 'cl-tot ' + (total(h) === TOTAL ? 'ok' : 'no'); }
  }

  /* ================= 2. the war: choose the next battle (and the online match) ================= */
  let sel = { R: null, L: null };
  function lobby() {
    paintScore(); paintCode();
    const left = s => cfg.fams[s].filter(f => !war.done[f.id]);
    if (!sel.R || war.done[sel.R] || !cfg.fams.R.some(f => f.id === sel.R)) sel.R = left('R')[0]?.id || null;
    if (!sel.L || war.done[sel.L] || !cfg.fams.L.some(f => f.id === sel.L)) sel.L = left('L')[0]?.id || null;
    if (!sel.R || !sel.L) return warEnd();
    const col = s => `<section class="cl-col ${s}"><h3>${SIDE[s].icon} ${SIDE[s].name}</h3>
      ${cfg.fams[s].map(f => `<button type="button" class="cl-chip ${s}${sel[s] === f.id ? ' on' : ''}${war.done[f.id] ? ' done' : ''}" data-side="${s}" data-id="${f.id}"${war.done[f.id] ? ' disabled' : ''}>
        <b>${esc(f.name)}</b> <span>${job(s, 'man', f.man.job).e}${esc(f.man.name)} · ${job(s, 'woman', f.woman.job).e}${esc(f.woman.name)}</span>${war.done[f.id] ? `<em>+${war.pts[f.id] || 0}</em>` : ''}</button>`).join('')}</section>`;
    area().innerHTML = `<div class="cl-lobby">${netBox()}<p class="cl-intro">Choose the two families of the next battle, then press the button.</p>
      <div class="cl-cols">${col('R')}${col('L')}</div>
      <div class="cl-actions"><button type="button" class="cl-btn light" id="clRandPair">🎲 Random families</button><button type="button" class="cl-btn go" id="clFight">⚔️ Start the battle</button><button type="button" class="cl-btn light" id="clStop">🏁 End the war</button></div></div>`;
    publish();
  }
  function netBox() {
    if (net) return `<div class="cl-net on"><span>📡 Code <b class="cl-bigcode">${net.code}</b> — the groups join from the book (“Join the battle”).</span><span id="clPlayers">${playersText()}</span></div>`;
    return `<div class="cl-net"><span>📡 The groups play on their PCs: they join with a code.</span><button type="button" class="cl-btn" id="clMakeCode">Make the code</button></div>`;
  }
  const playersText = () => { const ids = new Set((net?.players || []).map(p => p.fam)); return `${ids.size} of ${cfg.fams.R.length + cfg.fams.L.length} families connected`; };
  function warEnd() {
    paintScore(); publish();
    const { R, L } = war.score, win = R === L ? null : R > L ? 'R' : 'L';
    const rows = s => cfg.fams[s].filter(f => war.done[f.id]).sort((a, b) => (war.pts[b.id] || 0) - (war.pts[a.id] || 0))
      .map(f => `<li><b>${esc(f.name)}</b> <span>${job(s, 'man', f.man.job).e} ${esc(f.man.name)} · ${job(s, 'woman', f.woman.job).e} ${esc(f.woman.name)}</span><em>${war.pts[f.id] || 0}</em></li>`).join('');
    area().innerHTML = `<div class="cl-end ${win || ''}"><h2>${win ? `${SIDE[win].icon} The ${SIDE[win].name} win the war!` : '🤝 The war ends in a draw!'}</h2>
      <p class="cl-big">${R} – ${L}</p><div class="cl-cols"><section class="cl-col R"><h3>${SIDE.R.icon} Romans</h3><ol class="cl-rank">${rows('R')}</ol></section><section class="cl-col L"><h3>${SIDE.L.icon} Longobards</h3><ol class="cl-rank">${rows('L')}</ol></section></div>
      <div class="cl-actions"><button type="button" class="cl-btn go" id="clAgain">↺ New war</button></div></div>`;
  }

  /* ---------- the online match: the host ---------- */
  async function makeMatch() {
    try {
      await rooms().ready();
      const rid = rand(6), code = await rooms().create(rid);
      net = { code, rid, players: [], no: 0, unsub: null };
      net.unsub = race().watchPlayers(code, list => { net.players = list; const p = $('clPlayers'); if (p) p.textContent = playersText(); const a = $('clAns'); if (a) a.textContent = answersText(); }, () => { /* the next snapshot will come */ });
      paintCode(); publishNow(); war ? lobby() : setup();
    } catch (e) { alert(errorText(e)); }
  }
  const pubHero = (s, role, h) => { const j = job(s, role, h.job); return { n: h.name, e: j.e, jn: j.n, perk: j.perk, str: h.str, agi: h.agi, end: h.end, wis: h.wis, about: about(h) }; };
  const pubMember = m => ({ n: m.name, e: m.j.e, jn: m.j.n, role: m.role, hp: Math.max(0, m.hp), max: m.max, mode: m.mode, st: m.state, str: m.str, agi: m.agi, end: m.end, wis: m.wis });
  function snapshot() {
    const cl = { v: 1, rid: net.rid, status: bat ? 'battle' : war ? 'lobby' : 'setup', women: cfg.women, score: war ? war.score : { R: 0, L: 0 }, done: war ? war.pts : {},
      fams: { R: cfg.fams.R.map(f => ({ id: f.id, name: f.name, man: pubHero('R', 'man', f.man), woman: pubHero('R', 'woman', f.woman) })), L: cfg.fams.L.map(f => ({ id: f.id, name: f.name, man: pubHero('L', 'man', f.man), woman: pubHero('L', 'woman', f.woman) })) },
      bat: null };
    if (bat) {
      cl.bat = { R: bat.fam.R.id, L: bat.fam.L.id, round: bat.round, phase: bat.phase, rid: roundId(), m: { R: bat.m.R.map(pubMember), L: bat.m.L.map(pubMember) },
        q: bat.phase === 'ask' ? { q: bat.q.q, t: bat.q.t || 'choice', o: bat.q.o || null } : null,
        log: bat.log.slice(-6).map(l => ({ t: l.t, s: l.s || '' })), result: bat.result || '', right: bat.right || '', ok: bat.ok || null, winner: bat.winner || null, pts: bat.pointsText || '' };
    }
    return cl;
  }
  let pubT = null;
  function publishNow() { if (!net) return; clearTimeout(pubT); rooms().update(net.code, { cl: snapshot() }).catch(() => { /* the next change will send it again */ }); }
  function publish() { if (!net) return; clearTimeout(pubT); pubT = setTimeout(publishNow, 250); }
  const roundId = () => `${net ? net.no : 0}-${bat ? bat.round : 0}`;
  const answersText = () => { if (!net || !bat) return ''; const rid = roundId(); const ids = new Set(net.players.filter(p => p.rid === rid).map(p => p.fam)); return `📡 ${ids.size} of ${cfg.fams.R.length + cfg.fams.L.length} families answered`; };

  /* ================= 3. the battle ================= */
  const mk = (side, role, h, fam) => {
    const j = job(side, role, h.job), women = cfg.women[side];
    return { side, role, fam: fam.name, name: h.name || (role === 'man' ? 'Hero' : 'Heroine'), pic: h.meta?.pic || '', j, str: h.str, agi: h.agi, end: h.end, wis: h.wis,
      max: 4 + 2 * h.end + (j.hp || 0), hp: 4 + 2 * h.end + (j.hp || 0), mode: role === 'man' || women === 'fight' ? 'fight' : 'flee', state: 'ready' };
  };
  const alive = m => m.hp > 0;
  const fighters = s => bat.m[s].filter(m => alive(m) && m.mode === 'fight' && m.state !== 'safe');
  function startBattle() {
    const fr = cfg.fams.R.find(f => f.id === sel.R), fl = cfg.fams.L.find(f => f.id === sel.L);
    if (net) net.no++;
    bat = { fam: { R: fr, L: fl }, m: { R: [mk('R', 'man', fr.man, fr), mk('R', 'woman', fr.woman, fr)], L: [mk('L', 'man', fl.man, fl), mk('L', 'woman', fl.woman, fl)] },
      round: 0, phase: 'ask', q: null, ans: { R: null, L: null }, log: [], over: false, safe: { R: 0, L: 0 } };
    nextRound();
  }
  function nextQuestion() { if (!bag.length) bag = shuffle(D.Q); return bag.pop(); }
  function nextRound() {
    bat.round++; bat.phase = 'ask'; bat.q = nextQuestion(); bat.ans = { R: null, L: null }; bat.result = null; bat.right = ''; bat.ok = null;
    arena();
  }
  const bar = m => `<i style="width:${Math.max(0, m.hp / m.max * 100)}%"></i>`;
  function memberCard(m) {
    const st = m.hp <= 0 ? ['💀', 'down'] : m.state === 'safe' ? ['🏠', 'safe'] : m.mode === 'flee' ? ['🏃', 'flee'] : ['⚔️', 'fight'];
    return `<div class="cl-mem ${m.side} ${st[1]}${m.fx ? ' ' + m.fx : ''}"><span class="cl-av">${m.pic ? `<img src="${esc(m.pic)}" alt="">` : m.j.e}</span>
      <div><b>${esc(m.name)}</b> <small>${m.j.n}</small>
        <div class="cl-hp">${bar(m)}<span>${Math.max(0, m.hp)}/${m.max}</span></div>
        <div class="cl-st">⚔️${m.str} 🛡️${m.agi} ❤️${m.end} 🧠${m.wis}</div></div><span class="cl-state" title="${st[1]}">${st[0]}</span></div>`;
  }
  const side = s => `<section class="cl-side ${s}"><h3>${SIDE[s].icon} ${esc(bat.fam[s].name)} <small>${SIDE[s].name}</small></h3>${bat.m[s].map(memberCard).join('')}</section>`;
  const blanked = t => esc(t).replace('___', '<span class="cl-blank">_____</span>');
  function stage() {
    const q = bat.q;
    if (bat.phase === 'ask') {
      const widget = s => q.t === 'gap'
        ? `<input class="cl-gap ${s}" data-s="${s}" autocomplete="off" placeholder="Type the answer" aria-label="${SIDE[s].name} answer">`
        : `<div class="cl-opts ${s}">${q.o.map((o, i) => `<button type="button" class="cl-opt ${s}${bat.ans[s] === i ? ' on' : ''}" data-s="${s}" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
      return `<div class="cl-q"><div class="cl-round">Round ${bat.round} · grammar question</div><p class="cl-qtext">${blanked(q.q)}</p>
        ${net ? `<p class="cl-netline" id="clAns">${answersText()}</p>` : ''}
        <div class="cl-answers"><div>${SIDE.R.icon} <b>${SIDE.R.name}</b>${widget('R')}</div><div>${SIDE.L.icon} <b>${SIDE.L.name}</b>${widget('L')}</div></div>
        <button type="button" class="cl-btn go" id="clReveal">✓ Show the answer</button></div>`;
    }
    if (bat.phase === 'fight') return `<div class="cl-q"><div class="cl-round">Round ${bat.round} · ${bat.result}</div><p class="cl-wait">⚔️ …</p></div>`;
    if (bat.phase === 'next') return `<div class="cl-q"><div class="cl-round">Round ${bat.round} · ${bat.result}</div><button type="button" class="cl-btn go" id="clNext">Next round ▶</button></div>`;
    const w = bat.winner;
    return `<div class="cl-q over ${w || ''}"><h2>${w ? `${SIDE[w].icon} The ${esc(bat.fam[w].name)} family win!` : '🤝 Nobody wins: a draw!'}</h2>
      <p class="cl-wait">${bat.pointsText}</p><button type="button" class="cl-btn go" id="clBack">Back to the war ▶</button></div>`;
  }
  const logHtml = () => `<ul class="cl-log" id="clLog">${bat.log.slice(-7).map(l => `<li class="${l.s || ''}">${l.t}</li>`).join('')}</ul>`;
  function arena() {
    paintScore();
    // typed answers must survive a repaint of the arena
    const typed = { R: document.querySelector('.cl-gap.R')?.value, L: document.querySelector('.cl-gap.L')?.value };
    area().innerHTML = `<div class="cl-arena">${side('R')}<div class="cl-mid">${stage()}</div>${side('L')}</div>${logHtml()}`;
    ['R', 'L'].forEach(s => { const g = document.querySelector(`.cl-gap.${s}`); if (g && typed[s]) g.value = typed[s]; });
    publish();
  }
  const say = (t, s) => { bat.log.push({ t, s }); };

  /* the dice */
  const bonus = (m, k) => m.j[k] || 0;
  const boost = (s, right) => (right ? Math.min(4, 2 + bat.m[s].filter(alive).reduce((n, m) => n + bonus(m, 'boost'), 0)) : 0);
  const isRight = (q, a) => (q.t === 'gap' ? typeof a === 'string' && q.a.split('|').map(norm).includes(norm(a)) : a === q.a);
  async function reveal() {
    const q = bat.q, ok = {}, famOf = id => ['R', 'L'].find(s => cfg.fams[s].some(f => f.id === id));
    // the answers of the groups' PCs for this round (the last one of every family)
    const latest = {};
    if (net) net.players.filter(p => p.rid === roundId()).forEach(p => { if (!latest[p.fam] || (p.t || 0) >= (latest[p.fam].t || 0)) latest[p.fam] = p; });
    const support = { R: 0, L: 0 };
    ['R', 'L'].forEach(s => {
      const online = latest[bat.fam[s].id];
      if (online) ok[s] = isRight(q, online.a);
      else if (q.t === 'gap') ok[s] = isRight(q, document.querySelector(`.cl-gap.${s}`)?.value || '');
      else ok[s] = isRight(q, bat.ans[s]);
    });
    // the families that wait help their people: +1 boost for every right answer (max +2)
    Object.entries(latest).forEach(([fid, p]) => { const s = famOf(fid); if (s && fid !== bat.fam.R.id && fid !== bat.fam.L.id && isRight(q, p.a)) support[s]++; });
    const right = q.t === 'gap' ? q.a.split('|')[0] : q.o[q.a];
    bat.boost = { R: boost('R', ok.R) + Math.min(2, support.R), L: boost('L', ok.L) + Math.min(2, support.L) };
    bat.phase = 'fight'; bat.right = right; bat.ok = ok;
    bat.result = `The answer is “${esc(right)}”`;
    say(`❓ The right answer: <b>${esc(right)}</b>. ${ok.R ? '✅' : '❌'} Romans · ${ok.L ? '✅' : '❌'} Longobards${support.R || support.L ? ` · friends who help: ${support.R ? '+' + Math.min(2, support.R) + ' Romans ' : ''}${support.L ? '+' + Math.min(2, support.L) + ' Longobards' : ''}` : ''}${bat.boost.R || bat.boost.L ? ` — boost: ${bat.boost.R ? '+' + bat.boost.R + ' Romans ' : ''}${bat.boost.L ? '+' + bat.boost.L + ' Longobards' : ''}` : ' — no boost'}`);
    arena();
    await wait(900);
    await actions();
  }
  const sleepFx = async (m, fx) => { m.fx = fx; arena(); await wait(650); m.fx = ''; };
  async function actions() {
    const B = bat.boost;
    // 1. the heroes who flee
    for (const s of ['R', 'L']) for (const m of bat.m[s]) {
      if (m.mode !== 'flee' || !alive(m) || m.state === 'safe') continue;
      const enemy = fighters(s === 'R' ? 'L' : 'R');
      if (!enemy.length) { m.state = 'safe'; bat.safe[s]++; say(`🏃 ${esc(m.name)} runs away. Nobody follows her: she is safe!`, s); arena(); await wait(700); continue; }
      const r = d6(), t = r + m.agi + bonus(m, 'flee') + (m.wis >= 4 ? 1 : 0) + (B[s] ? 1 : 0);
      if (t >= 8) {
        m.state = 'safe'; bat.safe[s]++;
        let extra = '';
        if (m.j.heal) { const ally = bat.m[s].filter(a => a !== m && alive(a)).sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; if (ally && ally.hp < ally.max) { ally.hp = Math.min(ally.max, ally.hp + m.j.heal); extra = ` She heals ${esc(ally.name)} (+${m.j.heal} HP).`; } }
        say(`🏃 ${esc(m.name)} runs away: 🎲${r} + ${t - r} = <b>${t}</b> (8 needed). She is safe!${extra}`, s);
        await sleepFx(m, 'win');
      } else {
        m.hp -= 2; say(`🏃 ${esc(m.name)} tries to run away: 🎲${r} + ${t - r} = <b>${t}</b>. An enemy catches her! −2 HP`, s);
        await sleepFx(m, 'hit');
      }
    }
    // 2. the heroes who fight, in a random order
    for (const a of shuffle([...bat.m.R, ...bat.m.L])) {
      if (a.mode !== 'fight' || !alive(a) || a.state === 'safe') continue;
      const foes = fighters(a.side === 'R' ? 'L' : 'R'); if (!foes.length) continue;
      const t = pick(foes), os = t.side;
      const ra = d6(), rd = d6();
      const atk = ra + a.str + bonus(a, 'atk') + B[a.side], def = rd + t.agi + bonus(t, 'def') + (B[os] ? 1 : 0);
      if (atk > def) {
        const dmg = Math.min(8, 2 + atk - def); t.hp -= dmg;
        say(`⚔️ ${esc(a.name)} attacks ${esc(t.name)}: 🎲${ra} → <b>${atk}</b> vs 🎲${rd} → <b>${def}</b>. A hit! −${dmg} HP${t.hp <= 0 ? ` — ${esc(t.name)} falls!` : ''}`, a.side);
        await sleepFx(t, 'hit');
      } else {
        say(`⚔️ ${esc(a.name)} attacks ${esc(t.name)}: <b>${atk}</b> vs <b>${def}</b>. ${esc(t.name)} dodges.`, a.side);
        await sleepFx(t, 'dodge');
      }
    }
    // 3. is the battle over?
    const fr = fighters('R').length, fl = fighters('L').length;
    for (const s of ['R', 'L']) if (!(s === 'R' ? fr : fl)) for (const m of bat.m[s]) {
      if (m.mode === 'flee' && alive(m) && m.state !== 'safe') { m.state = 'safe'; bat.safe[s]++; say(`🏠 In the confusion ${esc(m.name)} escapes to a safe place.`, s); }
    }
    if (!fr || !fl || bat.round >= 8) {
      const hpOf = s => bat.m[s].reduce((n, m) => n + Math.max(0, m.hp) / m.max, 0);
      bat.winner = fr && !fl ? 'R' : fl && !fr ? 'L' : (!fr && !fl) ? null : hpOf('R') === hpOf('L') ? null : hpOf('R') > hpOf('L') ? 'R' : 'L';
      return finish();
    }
    bat.phase = 'next'; bat.result = 'Fight!';
    arena();
  }
  function finish() {
    const pts = { R: bat.safe.R, L: bat.safe.L };
    if (bat.winner) pts[bat.winner] += 3; else { pts.R += 1; pts.L += 1; }
    war.score.R += pts.R; war.score.L += pts.L;
    war.done[bat.fam.R.id] = 1; war.done[bat.fam.L.id] = 1;
    war.pts[bat.fam.R.id] = pts.R; war.pts[bat.fam.L.id] = pts.L;
    bat.phase = 'over';
    bat.pointsText = `${SIDE.R.icon} ${esc(bat.fam.R.name)}: <b>+${pts.R}</b> · ${SIDE.L.icon} ${esc(bat.fam.L.name)}: <b>+${pts.L}</b><br><small>3 points for the winner, 1 for every hero who escapes.</small>`;
    arena();
  }

  /* ================= 4. a group's PC: join the battle ================= */
  const pid = () => { let p = store.get('pid'); if (!p) { p = rand(10); store.set('pid', p); } return p; };
  function join() {
    build(); root.hidden = false; document.documentElement.classList.add('gq-open');
    if (net) { /* a teacher testing: leave the host as it is */ }
    $('clHome').hidden = true; $('clScore').hidden = true; $('clCode').hidden = true;
    joinScreen();
  }
  function joinScreen(msg = '') {
    me?.unsub?.(); me = null;
    area().innerHTML = `<div class="cl-join"><h2>⚔️ Join the battle</h2><p>Your teacher shows a 4-letter code. Type it here.</p>
      <input class="cl-codein" id="clJoinCode" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD" value="${esc(store.get('code') || '')}">
      <button type="button" class="cl-btn go" id="clJoinGo">Join ▶</button><p class="cl-msg" id="clJoinMsg">${esc(msg)}</p></div>`;
    const go = () => doJoin($('clJoinCode').value);
    $('clJoinGo').onclick = go;
    $('clJoinCode').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); });
    $('clJoinCode').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    $('clJoinCode').focus();
  }
  async function doJoin(code) {
    code = (code || '').toUpperCase();
    if (code.length !== 4) return joinScreen('The code has 4 letters.');
    try {
      await rooms().ready();
      const d = await rooms().read(code);
      if (!d || !d.cl) throw Object.assign(new Error('notfound'), { code: 'notfound' });
      store.set('code', code);
      chooseFamily(code, d.cl);
    } catch (e) { joinScreen(errorText(e)); }
  }
  function chooseFamily(code, cl) {
    const saved = store.get('fam-' + code);
    const list = s => cl.fams[s].map(f => `<button type="button" class="cl-chip ${s}${saved === f.id ? ' on' : ''}" data-fam="${esc(f.id)}"><b>${esc(f.name)}</b> <span>${esc(f.man.e)} ${esc(f.man.n)} · ${esc(f.woman.e)} ${esc(f.woman.n)}</span></button>`).join('');
    area().innerHTML = `<div class="cl-join wide"><h2>Which family are you?</h2><p>Click your family. One PC for every group.</p>
      <div class="cl-cols"><section class="cl-col R"><h3>${SIDE.R.icon} Romans</h3>${list('R') || '<p class="cl-empty">…</p>'}</section><section class="cl-col L"><h3>${SIDE.L.icon} Longobards</h3>${list('L') || '<p class="cl-empty">…</p>'}</section></div>
      <div class="cl-actions"><button type="button" class="cl-btn light" id="clJoinBack">‹ Back</button></div></div>`;
    $('clJoinBack').onclick = () => joinScreen();
    area().querySelectorAll('[data-fam]').forEach(b => { b.onclick = () => { store.set('fam-' + code, b.dataset.fam); startPlayer(code, b.dataset.fam); }; });
  }
  function startPlayer(code, famId) {
    me = { code, fam: famId, key: '', sent: null, unsub: null };
    area().innerHTML = `<div class="cl-player"><div id="clPHead"></div><div id="clPQ"></div><div id="clPArena"></div></div>`;
    me.unsub = rooms().watch(code, d => renderPlayer(d && d.cl), () => { $('clPHead').innerHTML = '<p class="cl-msg">Connection problem… trying again.</p>'; });
  }
  function renderPlayer(cl) {
    if (!me || !$('clPHead')) return;
    if (!cl) { $('clPHead').innerHTML = '<p class="cl-msg">This battle is over.</p>'; return; }
    const side = ['R', 'L'].find(s => cl.fams[s].some(f => f.id === me.fam)), fam = side && cl.fams[side].find(f => f.id === me.fam);
    if (!fam) { $('clPHead').innerHTML = '<p class="cl-msg">Your family is not in this battle any more.</p>'; return; }
    paintScore(cl.score);
    $('clPHead').innerHTML = `<div class="cl-pfam ${side}"><h2>${SIDE[side].icon} ${esc(fam.name)} <small>${SIDE[side].name}</small></h2>
      <div class="cl-pheroes">${['man', 'woman'].map(r => `<div><span class="cl-av">${esc(fam[r].e)}</span><b>${esc(fam[r].n)}</b> <small>${esc(fam[r].jn)}</small><div class="cl-st">⚔️${fam[r].str} 🛡️${fam[r].agi} ❤️${fam[r].end} 🧠${fam[r].wis}</div><small>${esc(fam[r].about)}</small></div>`).join('')}</div>
      <p class="cl-pscore">${SIDE.R.icon} ${cl.score.R} – ${cl.score.L} ${SIDE.L.icon}</p></div>`;
    const b = cl.bat, key = b ? `${b.rid}|${b.phase}` : cl.status;
    if (key !== me.key) { me.key = key; me.sent = null; $('clPQ').innerHTML = playerQuestion(cl, b, side); bindPlayer(b, side); }
    else if (b && b.phase !== 'ask') $('clPQ').innerHTML = playerQuestion(cl, b, side);
    $('clPArena').innerHTML = b ? `<div class="cl-arena small">${['R', 'L'].map(s => `<section class="cl-side ${s}"><h3>${SIDE[s].icon} ${esc(cl.fams[s].find(f => f.id === b[s])?.name || '')}</h3>${b.m[s].map(m => `<div class="cl-mem ${s} ${m.hp <= 0 ? 'down' : m.st === 'safe' ? 'safe' : ''}"><span class="cl-av">${esc(m.e)}</span><div><b>${esc(m.n)}</b> <small>${esc(m.jn)}</small><div class="cl-hp"><i style="width:${Math.max(0, m.hp / m.max * 100)}%"></i><span>${m.hp}/${m.max}</span></div></div></div>`).join('')}</section>`).join('')}</div>
      <ul class="cl-log">${b.log.map(l => `<li class="${l.s}">${l.t}</li>`).join('')}</ul>` : standings(cl);
  }
  function standings(cl) {
    const row = s => cl.fams[s].map(f => `<li><b>${esc(f.name)}</b>${cl.done[f.id] != null ? `<em>+${cl.done[f.id]}</em>` : ''}</li>`).join('');
    return `<div class="cl-cols"><section class="cl-col R"><h3>${SIDE.R.icon} Romans</h3><ul class="cl-rank">${row('R')}</ul></section><section class="cl-col L"><h3>${SIDE.L.icon} Longobards</h3><ul class="cl-rank">${row('L')}</ul></section></div>`;
  }
  function playerQuestion(cl, b, side) {
    if (!b) return `<div class="cl-q"><p class="cl-wait">${cl.status === 'setup' ? '⏳ The teacher makes the families…' : '⏳ Waiting for the next battle…'}</p></div>`;
    const fighting = b.R === me.fam || b.L === me.fam;
    if (b.phase === 'ask' && b.q) {
      const w = fighting ? '⚔️ Your family fights! Answer now!' : '👀 Your family watches. A right answer helps your people (+1 boost)!';
      const widget = b.q.t === 'gap' ? `<input class="cl-gap ${side}" id="clPGap" autocomplete="off" placeholder="Type the answer"><button type="button" class="cl-btn go" id="clPSend">Send ▶</button>`
        : `<div class="cl-opts ${side}">${b.q.o.map((o, i) => `<button type="button" class="cl-opt ${side}" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
      return `<div class="cl-q"><div class="cl-round">Round ${b.round} · grammar question</div><p class="cl-pwho">${w}</p><p class="cl-qtext">${esc(b.q.q).replace('___', '<span class="cl-blank">_____</span>')}</p>${widget}<p class="cl-sent" id="clPSent"></p></div>`;
    }
    if (b.phase === 'over') return `<div class="cl-q over ${b.winner || ''}"><h2>${b.winner ? `${SIDE[b.winner].icon} ${esc(cl.fams[b.winner].find(f => f.id === b[b.winner])?.name)} win!` : '🤝 A draw!'}</h2><p class="cl-wait">${b.pts}</p></div>`;
    const mine = fighting ? (b.R === me.fam ? b.ok?.R : b.ok?.L) : null;
    return `<div class="cl-q"><div class="cl-round">Round ${b.round}</div><p class="cl-wait">The answer: <b>${esc(b.right)}</b>${mine == null ? '' : mine ? ' ✅' : ' ❌'}</p></div>`;
  }
  function bindPlayer(b, side) {
    if (!b || b.phase !== 'ask') return;
    const send = a => {
      me.sent = a;
      race().setPlayer(me.code, pid(), { id: pid(), fam: me.fam, rid: b.rid, a, n: '', t: Date.now() }).then(() => { const s = $('clPSent'); if (s) s.textContent = '✅ Answer sent. You can change it until the teacher shows the answer.'; }).catch(() => { const s = $('clPSent'); if (s) s.textContent = 'Could not send. Try again.'; });
    };
    area().querySelectorAll('#clPQ .cl-opt').forEach(btn => btn.onclick = () => { area().querySelectorAll('#clPQ .cl-opt').forEach(x => x.classList.toggle('on', x === btn)); send(+btn.dataset.i); });
    $('clPSend')?.addEventListener('click', () => { const v = $('clPGap').value.trim(); if (v) send(v); });
    $('clPGap')?.addEventListener('keydown', e => { if (e.key === 'Enter') $('clPSend').click(); });
  }

  /* ================= clicks ================= */
  document.addEventListener('click', e => {
    const j = e.target.closest('[data-clash="join"]'); if (j) { e.preventDefault(); return join(); }
    if (!root || root.hidden || !root.contains(e.target)) return;
    const t = e.target;
    if (t.closest('.cl-setup')) return setupClick(e);
    const chip = t.closest('.cl-chip[data-side]'); if (chip) { sel[chip.dataset.side] = chip.dataset.id; return lobby(); }
    const opt = t.closest('.cl-opt[data-s]'); if (opt && bat?.phase === 'ask') { bat.ans[opt.dataset.s] = +opt.dataset.i; return arena(); }
    switch (t.id) {
      case 'clRandPair': { const l = s => cfg.fams[s].filter(f => !war.done[f.id]); sel = { R: pick(l('R')).id, L: pick(l('L')).id }; return lobby(); }
      case 'clFight': return startBattle();
      case 'clStop': return warEnd();
      case 'clAgain': war = null; sel = { R: null, L: null }; return setup();
      case 'clReveal': return reveal();
      case 'clNext': return nextRound();
      case 'clBack': bat = null; return lobby();
      case 'clMakeCode': return makeMatch();
      default:
    }
  });
  document.addEventListener('change', e => { if (root && !root.hidden && e.target.closest('.cl-setup')) setupChange(e); });
  document.addEventListener('input', e => { if (root && !root.hidden && e.target.closest('.cl-setup') && e.target.matches('input')) setupChange(e); });

  window.CLASH = { open, join };
})();
