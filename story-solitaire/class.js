/**
 * STORY SOLITAIRE - class game. Everybody plays the same deal (same 4 stories, same shuffle) and wins
 *   ⚡ the pupil who clears the table FIRST (time since the teacher pressed Start)   🎯 the pupil who clears it with the FEWEST MOVES.
 * Teacher:  story-solitaire/index.html?teacher  (a tile in "Games for the teacher"): pick 4 stories → a 4-letter code → Start → live ranking.
 * Pupils:   "👥 Class game" in the top bar: code + name, then they wait for the Start.
 * A move = a card (or a group) moved; drawing from the stock is free; an undo counts as a move; no hints in a class game.
 * The rooms are on Firebase (online.js). The teacher's device sends the ranking (field `board` of the room) every 4 seconds, so the
 * pupils read one document and not 30. If the teacher closes the tab, the ranking freezes.
 * ?fake uses an in-memory room (window.__ssFake) so the screens can be tested without the internet.
 */
(() => {
  'use strict';
  const N = 40;                                   // cards on the story piles when the table is clear
  const BIG = 1e9;                                // "time" of a finished pupil whose time is not known yet

  /* ---------- the ranking (pure: it is tested in Node) ---------- */
  // a player of the board: { i: id, n: name, mv: moves, p: cards on the piles, d: 1 if finished, s: seconds at the finish }
  const rankPlayers = list => list.slice().sort((a, b) =>
    (b.d - a.d) || (a.d ? ((a.s - b.s) || (a.mv - b.mv)) : ((b.p - a.p) || (a.mv - b.mv))) || String(a.n).localeCompare(String(b.n)));
  function winners(list) {
    const fin = list.filter(x => x.d);
    if (!fin.length) return null;
    const pick = (a, b) => fin.slice().sort((x, y) => (x[a] - y[a]) || (x[b] - y[b]))[0];
    const f = pick('s', 'mv'), m = pick('mv', 's');
    return { fast: { i: f.i, n: f.n, s: f.s, mv: f.mv }, few: { i: m.i, n: m.n, s: m.s, mv: m.mv } };
  }
  const fmt = sec => (sec >= BIG ? '…' : `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`);
  const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  const ms = t => (t && typeof t.toMillis === 'function' ? t.toMillis() : typeof t === 'number' ? t : null);

  if (typeof document === 'undefined') { module.exports = { rankPlayers, winners, fmt, ordinal }; return; }

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const params = new URLSearchParams(location.search);
  const FAKE = params.has('fake'), TEACHER = params.has('teacher');

  /* ---------- the room: Firebase (online.js) or, for the tests, a room in memory ---------- */
  const store = window.__ssFake = { rooms: {}, players: {}, subs: [] };
  const clone = o => JSON.parse(JSON.stringify(o));
  const notify = (kind, code) => store.subs.filter(s => s.kind === kind && s.code === code).forEach(s =>
    s.cb(kind === 'room' ? clone(store.rooms[code] || null) : Object.values(store.players[code] || {}).map(clone)));
  const fake = {
    clientId: 'fake', ttl: 1e12,
    ready: async () => {},
    createRoom: async rc => { store.rooms.TEST = { code: 'TEST', host: 'fake', updated: Date.now(), rc, phase: 'wait', board: [], win: null }; store.players.TEST = {}; return 'TEST'; },
    getRoom: async code => (store.rooms[code] ? clone(store.rooms[code]) : null),
    watchRoom: (code, cb) => { const s = { kind: 'room', code, cb }; store.subs.push(s); setTimeout(() => cb(clone(store.rooms[code] || null)), 0); return () => { store.subs = store.subs.filter(x => x !== s); }; },
    updateRoom: async (code, patch) => { Object.assign(store.rooms[code], clone(patch), { updated: Date.now() }); if (patch.t0 !== undefined) store.rooms[code].t0 = patch.t0; notify('room', code); },
    setPlayer: async (code, id, data) => { store.players[code] = store.players[code] || {}; store.players[code][id] = Object.assign(store.players[code][id] || { id }, clone(data), { id }); notify('players', code); },
    watchPlayers: (code, cb) => { const s = { kind: 'players', code, cb }; store.subs.push(s); setTimeout(() => cb(Object.values(store.players[code] || {}).map(clone)), 0); return () => { store.subs = store.subs.filter(x => x !== s); }; },
    serverTime: () => Date.now(),
  };
  const B = () => (FAKE ? fake : window.StoryOnline);
  const needOnline = () => {
    if (B()) return true;
    show('<h2>👥 Class game</h2><p>The online part could not load. Open the game from the book (with the internet) and try again.</p><div class="row"><button class="btn" data-cls="close">Close</button></div>');
    return false;
  };

  /* ---------- the window ---------- */
  function show(html, cls = '') { const b = $('classBox'); b.innerHTML = `<div class="cls-card ${cls}">${html}</div>`; b.hidden = false; }
  function hide() { $('classBox').hidden = true; }
  const setErr = t => { const e = $('clsErr'); if (e) e.textContent = t || ''; };
  const winnersHtml = (w, meId) => (w
    ? `<div class="cls-win"><div class="${w.fast.i === meId ? 'me' : ''}">⚡ <b>Fastest</b><span>${esc(w.fast.n)}</span><small>${fmt(w.fast.s)}</small></div>
       <div class="${w.few.i === meId ? 'me' : ''}">🎯 <b>Fewest moves</b><span>${esc(w.few.n)}</span><small>${w.few.mv} moves</small></div></div>`
    : '<p class="cls-none">Nobody has cleared the table yet.</p>');

  /* =============================================================== a pupil */
  let me = null, room = null, started = false, finished = false, last = null, sent = { mv: -1, p: -1 }, sendTimer = 0, unsubRoom = null;

  function joinDialog(msg) {
    let name = ''; try { name = localStorage.getItem('story-solitaire-name') || ''; } catch (e) { /* fine */ }
    show(`<h2>👥 Class game</h2>
      <p>Your teacher shows you a code with 4 letters.</p>
      <label>Code <input id="clsCode" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD"></label>
      <label>Your name <input id="clsName" maxlength="14" autocomplete="off" placeholder="Anna" value="${esc(name)}"></label>
      <p class="cls-err" id="clsErr">${esc(msg || '')}</p>
      <div class="row"><button class="btn btn-main" data-cls="join">Join</button><button class="btn" data-cls="close">Cancel</button></div>`);
    $('clsCode').focus();
  }

  async function join() {
    if (!needOnline()) return;
    const code = $('clsCode').value.trim().toUpperCase(), name = $('clsName').value.trim();
    if (!/^[A-Z]{4}$/.test(code)) return setErr('Write the 4 letters of the code.');
    if (!name) return setErr('Write your name.');
    setErr('Connecting…');
    try {
      await B().ready();
      const r = await B().getRoom(code);
      if (!r || !r.rc || r.rc.kind !== 'solitaire') return setErr('There is no class game with this code.');
      if (Date.now() - (r.updated || 0) > B().ttl) return setErr('This class game is over.');
      me = { code, name, id: Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12) };
      try { localStorage.setItem('story-solitaire-name', name); } catch (e) { /* fine */ }
      await B().setPlayer(code, me.id, { n: name, mv: 0, p: 0, d: 0, joined: Date.now() });
      unsubRoom = B().watchRoom(code, onRoom, () => {});
      waiting();
    } catch (e) { setErr('Could not connect. Check the internet and try again.'); }
  }

  function waiting() {
    const n = room && room.board ? room.board.length : 1;
    show(`<h2>You are in, ${esc(me.name)}! 🎉</h2><p>Code <b>${me.code}</b>. Wait for your teacher to press Start.</p>
      <p class="cls-count">${n} ${n === 1 ? 'player' : 'players'} so far</p>`);
  }

  function onRoom(r) {
    room = r;
    if (!r) { show('<h2>The class game is closed</h2><div class="row"><button class="btn" data-cls="close">OK</button></div>'); return; }
    if (r.phase === 'play' && !started) startGame();
    if (!started && r.phase === 'wait') waiting();
    if (r.phase === 'end') showEnd();
    else if (finished && !$('classBox').hidden) showFinished();
    updateBar();
  }

  function startGame() {
    started = true; hide();
    if (window.SSGame.startClass(room.rc.stories, room.rc.seed, { change: onChange, win: onWin }) === false) {
      show('<h2>Reload the page</h2><p>Your page is out of date. Press <b>Ctrl + F5</b> (or close and open the game again), then join again.</p>');
      return;
    }
    $('classBar').hidden = false;
    updateBar();
  }

  function onChange(i) {
    last = i; updateBar();
    if (finished || (i.moves === sent.mv && i.piles === sent.p) || sendTimer) return;
    sendTimer = setTimeout(flush, 1200);               // not after every click: at most once in a while
  }
  function flush() {
    sendTimer = 0;
    if (finished || !last) return;
    sent = { mv: last.moves, p: last.piles };
    B().setPlayer(me.code, me.id, { mv: last.moves, p: last.piles }).catch(() => {});
  }
  function onWin(i) {
    finished = true; last = i; clearTimeout(sendTimer); sendTimer = 0;
    B().setPlayer(me.code, me.id, { mv: i.moves, p: i.piles, d: 1, doneAt: B().serverTime() }).catch(() => {});
    showFinished();
  }

  const myRow = () => ((room && room.board) || []).find(x => x.i === me.id);
  function showFinished() {
    const row = myRow(), w = room && room.win;
    show(`<h2>🎉 You cleared the table!</h2>
      <p class="cls-big"><b>${last ? last.moves : '?'}</b> moves${row && row.d ? ` · <b>${fmt(row.s)}</b>` : ''}</p>
      ${row && row.d ? '' : '<p class="cls-none">Your time is on its way…</p>'}
      ${winnersHtml(w, me.id)}
      <p class="cls-none">Your teacher will say who won when everybody has finished.</p>
      <div class="row"><button class="btn btn-main" data-cls="close">Watch the table</button></div>`);
  }
  function showEnd() {
    const board = (room && room.board) || [], ranked = rankPlayers(board), idx = ranked.findIndex(x => x.i === me.id);
    show(`<h2>🏁 The class game is over</h2>
      ${winnersHtml(room.win, me.id)}
      <p class="cls-big">${idx >= 0 ? `You are <b>${ordinal(idx + 1)}</b> of ${ranked.length}` : ''}</p>
      <div class="row"><button class="btn btn-main" data-cls="leave">Back to the normal game</button></div>`);
  }
  function updateBar() {
    const bar = $('classBar');
    if (!started || !me) { bar.hidden = true; return; }
    const ranked = rankPlayers((room && room.board) || []), idx = ranked.findIndex(x => x.i === me.id), lead = ranked[0];
    bar.hidden = false;
    bar.innerHTML = `<b>👥 ${me.code}</b>${idx >= 0 ? `<span>${ordinal(idx + 1)} of ${ranked.length}</span>` : ''}
      <span>Cards home <b>${last ? last.piles : 0}/${N}</b></span><span>Moves <b>${last ? last.moves : 0}</b></span>
      ${lead && lead.i !== me.id ? `<span>Leader: <b>${esc(lead.n)}</b> ${lead.d ? '✔ ' + fmt(lead.s) : lead.p + '/' + N}</span>` : ''}`;
  }
  function leave() {
    if (unsubRoom) unsubRoom();
    unsubRoom = null; me = null; room = null; started = false; finished = false; last = null;
    $('classBar').hidden = true; hide();
    window.SSGame.leaveClass();
  }

  /* =============================================================== the teacher */
  const T = { picked: [], code: null, rc: null, players: [], room: null, unsubP: null, unsubR: null, timer: 0, dirty: false, lastSig: '' };
  const groups = () => {
    const g = new Map();
    window.STORIES.forEach(s => { const k = s.source ? s.source.author : 'Stories written for this book'; if (!g.has(k)) g.set(k, []); g.get(k).push(s); });
    return [...g];
  };

  function pickScreen(msg) {
    show(`<h2>🃏 Story Solitaire: class game</h2>
      <p>Choose <b>4 stories</b>. Everybody plays the same cards. Wins ⚡ who clears the table first and 🎯 who needs fewer moves.</p>
      ${groups().map(([author, list]) => `<h4>${esc(author)}</h4><div class="cls-chips">${list.map(s =>
        `<button type="button" class="cls-chip${T.picked.includes(s.id) ? ' on' : ''}" data-id="${s.id}" title="${esc(s.source ? s.source.book : s.title)}">${s.emoji} ${esc(s.title)}</button>`).join('')}</div>`).join('')}
      <p class="cls-count"><b>${T.picked.length}</b> / 4 stories</p>
      <p class="cls-err" id="clsErr">${esc(msg || '')}</p>
      <div class="row"><button class="btn" data-cls="random">🎲 Pick 4 for me</button><button class="btn" data-cls="clear">Clear</button>
      <button class="btn btn-main" data-cls="create"${T.picked.length === 4 ? '' : ' disabled'}>Create the room</button></div>`, 'wide');
  }

  async function create() {
    if (T.picked.length !== 4) return;
    if (!needOnline()) return;
    setErr('Making the room…');
    const rc = { kind: 'solitaire', stories: T.picked.slice(), seed: Math.floor(Math.random() * 2147483647) };
    try {
      await B().ready();
      T.code = await B().createRoom(rc); T.rc = rc; T.players = []; T.room = null; T.dirty = true; T.lastSig = '';
      T.unsubP = B().watchPlayers(T.code, list => { T.players = list; T.dirty = true; teacherScreen(); });
      T.unsubR = B().watchRoom(T.code, r => { T.room = r; teacherScreen(); });
      T.timer = setInterval(sendBoard, 4000);
      teacherScreen();
    } catch (e) { setErr('Could not make the room. Check the internet and try again.'); }
  }

  // the ranking as the teacher's device sees it
  function buildBoard() {
    const t0 = T.room ? ms(T.room.t0) : null;
    return T.players.map(p => ({
      i: p.id, n: p.n || '?', mv: p.mv || 0, p: p.p || 0, d: p.d ? 1 : 0,
      s: p.d ? (ms(p.doneAt) != null && t0 != null ? Math.max(0, (ms(p.doneAt) - t0) / 1000) : BIG) : null,
    }));
  }
  function sendBoard(force) {
    if (!T.code || !T.room || (!T.dirty && !force)) return;
    const board = buildBoard(), win = winners(board), sig = JSON.stringify([board, win]);
    T.dirty = false;
    if (sig === T.lastSig && !force) return;
    T.lastSig = sig;
    B().updateRoom(T.code, { board, win }).catch(() => { T.dirty = true; });
  }

  function teacherScreen() {
    if (!T.code || !T.room) return;
    const board = buildBoard(), ranked = rankPlayers(board), w = winners(board), phase = T.room.phase;
    const done = board.filter(x => x.d).length;
    if (phase === 'wait') {
      show(`<h2>🃏 Class game</h2>
        <div class="cls-code">${T.code}</div>
        <p>Pupils: open <b>Story Solitaire</b> → <b>👥 Class game</b> → write this code and their name.</p>
        <p class="cls-stories">${T.rc.stories.map(id => { const s = window.STORIES.find(x => x.id === id); return s ? `<span class="cls-chip on">${s.emoji} ${esc(s.title)}</span>` : ''; }).join('')}</p>
        <p class="cls-count"><b>${board.length}</b> ${board.length === 1 ? 'player' : 'players'} in the room</p>
        <div class="cls-names">${ranked.map(x => `<span>${esc(x.n)}</span>`).join('')}</div>
        <div class="row"><button class="btn btn-main" data-cls="start"${board.length ? '' : ' disabled'}>▶ Start</button><button class="btn" data-cls="newroom">Cancel</button></div>`, 'wide');
    } else {
      const rows = ranked.map((x, k) => `<tr class="${x.d ? 'done' : ''}"><td>${k + 1}</td><td>${esc(x.n)}</td>
        <td><div class="cls-bar-p"><i style="width:${Math.round(100 * x.p / N)}%"></i><span>${x.p}/${N}</span></div></td><td>${x.mv}</td><td>${x.d ? '✔ ' + fmt(x.s) : '…'}</td></tr>`).join('');
      show(`<h2>${phase === 'end' ? '🏁 Final result' : '🃏 Class game'} <small>code ${T.code} · ${done}/${board.length} finished</small></h2>
        ${winnersHtml(w, '')}
        <table class="cls-table"><thead><tr><th>#</th><th>Name</th><th>Cards home</th><th>Moves</th><th>Time</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="row">${phase === 'end'
          ? '<button class="btn btn-main" data-cls="newroom">New class game</button>'
          : '<button class="btn btn-main" data-cls="end">🏁 End the game and show the winners</button>'}</div>`, 'wide');
    }
  }

  function teacherReset() {
    clearInterval(T.timer); if (T.unsubP) T.unsubP(); if (T.unsubR) T.unsubR();
    Object.assign(T, { code: null, rc: null, players: [], room: null, unsubP: null, unsubR: null, timer: 0, dirty: false, lastSig: '' });
  }

  /* =============================================================== buttons */
  document.addEventListener('click', e => {
    const chip = e.target.closest('.cls-chip[data-id]');
    if (chip) {
      const id = chip.dataset.id, k = T.picked.indexOf(id);
      if (k >= 0) T.picked.splice(k, 1); else if (T.picked.length < 4) T.picked.push(id); else { pickScreen('Only 4 stories: take one away first.'); return; }
      pickScreen(); return;
    }
    const b = e.target.closest('[data-cls]'); if (!b) return;
    const a = b.dataset.cls;
    if (a === 'open') { if (needOnline()) joinDialog(); }
    else if (a === 'close') hide();
    else if (a === 'join') join();
    else if (a === 'leave') leave();
    else if (a === 'random') { T.picked = window.SSGame.stories().map(s => s.id).sort(() => Math.random() - 0.5).slice(0, 4); pickScreen(); }
    else if (a === 'clear') { T.picked = []; pickScreen(); }
    else if (a === 'create') create();
    else if (a === 'start') B().updateRoom(T.code, { phase: 'play', t0: B().serverTime() }).catch(() => {});
    else if (a === 'end') { sendBoard(true); B().updateRoom(T.code, { phase: 'end' }).catch(() => {}); }
    else if (a === 'newroom') { teacherReset(); pickScreen(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && $('clsCode') && !$('classBox').hidden) join(); });

  if (TEACHER) pickScreen();
  window.StoryClass = { rankPlayers, winners };
})();
