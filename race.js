// Grammar Race: a timed exercise race for the whole class (up to 60 players, one 4-letter code, no login).
// Exercises and settings: race-data.js · the parts with no screen: race-core.js · look: race.css · online: book.race in cloud.js.
//
// The teacher's device makes the room (host) and sends the ranking ("board") to everybody every few seconds;
// every player writes only their own small document, so 60 children never write the same one.
// Everybody gets the same exercises in the same order (the seed of the room). Nobody is told which answers are wrong until Finish:
// then the wrong ones come back, and the first to have everything right is the winner. The others go on until the teacher closes the race.

(() => {
  const D = RACE_DATA, C = RACE_CORE, ST = D.settings;

  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const store = {
    get: k => { try { return localStorage.getItem('rc-' + k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem('rc-' + k, v); } catch { /* private window */ } },
    del: k => { try { localStorage.removeItem('rc-' + k); } catch { /* private window */ } },
  };
  const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const rand = n => Array.from({ length: n }, () => Math.random().toString(36)[2]).join('');
  const roomApi = () => window.book && window.book.rooms;
  const raceApi = () => window.book && window.book.race;

  function errorText(e) {
    const c = (e && (e.code || e.message)) || '';
    if (/operation-not-allowed|admin-restricted/.test(c)) return 'You must sign in with your Google account to play the race.';
    if (/permission-denied/.test(c)) return 'The race is not set up yet. Ask your teacher!';
    if (c === 'notfound') return 'There is no race with this code. Check the letters!';
    if (c === 'expired') return 'This race is too old. Ask your teacher for a new code.';
    if (c === 'busy') return 'Could not make a race. Try again.';
    return 'Could not connect. Check the internet and try again.';
  }

  /* ================= the pop-up ================= */
  const overlay = document.createElement('div');
  overlay.className = 'rc-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'rcTitle');
  overlay.innerHTML = `
    <div class="rc-box" tabindex="-1">
      <div class="rc-top">
        <button type="button" class="rc-title" id="rcTitle" title="Back to the start">🏁 Grammar Race</button>
        <span class="rc-clock" id="rcClock" hidden></span>
        <button type="button" class="rc-x" id="rcClose" aria-label="Close">✕</button>
      </div>
      <div class="rc-track" id="rcTrack" hidden></div>
      <div class="rc-area" id="rcArea"></div>
    </div>`;
  document.body.append(overlay);
  const box = overlay.querySelector('.rc-box'), area = overlay.querySelector('#rcArea'), trackEl = overlay.querySelector('#rcTrack'), clockEl = overlay.querySelector('#rcClock');

  /* ================= the state ================= */
  let role = null;      // 'host' | 'kid' | null (start screen)
  let view = 'home';
  let code = '', unsub = null, unsubPlayers = null, pollT = null, tickT = null, boardT = null, repaintT = null;
  let R = null;         // the race as the room says: { rid, minutes, seed, n, status, el, board, cnt } + recvAt (when we heard)
  let set = [];         // the exercises
  let me = null;        // a player: { id, n, answers: [], a, phase: 'play' | 'fix' | 'done', fin, mis, t }
  let players = [];     // host only: the player documents of this race
  let lastSig = '', lastSent = 0;
  let offline = false;
  let startMinutes = ST.defaultMinutes;
  let rot = 0;          // in the fix phase: which of the wrong exercises comes now (a wrong try sends it to the back)
  let doneT = null;     // looks again at the ranking after Finish

  const elapsed = () => (R && R.status === 'run' ? Math.max(0, (R.el || 0) + (Date.now() - R.recvAt)) : R && R.status === 'over' ? (R.el || 0) : 0);
  const wrongList = () => set.map((ex, i) => i).filter(i => !C.isRight(set[i], me.answers[i]));

  /* ---------- the player's document ---------- */
  function pushMe() {
    store.set('me', JSON.stringify({ code, rid: R.rid, me }));
    const rem = me.phase === 'fix' ? wrongList().length : 0;
    return raceApi().setPlayer(code, me.id, { id: me.id, rid: R.rid, n: me.n, a: me.a, phase: me.phase, rem, fin: me.fin || 0, mis: me.mis || 0, t: me.t || 0 })
      .then(() => { if (offline) { offline = false; paintTrack(); } })
      .catch(() => { offline = true; paintTrack(); });
  }
  const myRow = () => ({ id: me.id, n: me.n, a: me.a, phase: me.phase, rem: me.phase === 'fix' ? wrongList().length : 0, fin: me.fin || 0, t: Infinity });

  /* ---------- the ranking, as the kid sees it ---------- */
  function standings() {
    const others = (R.board || []).filter(r => r.i !== me.id).map((r, k) => ({ id: r.i, n: r.n, pos: r.p, fin: r.f, mis: r.m, t: k }));
    return C.rank([...others, myRow()], R.n);
  }

  /* ================= screens ================= */
  const set$ = (html) => { area.innerHTML = html; box.scrollTop = 0; };
  const hideBar = () => { trackEl.hidden = true; clockEl.hidden = true; };

  function home(msg = '') {
    teardown(); role = null; view = 'home'; hideBar();
    const saved = (() => { try { return JSON.parse(store.get('me')); } catch { return null; } })();
    const hosted = (() => { try { return JSON.parse(store.get('host')); } catch { return null; } })();
    set$(`
      <div class="rc-menu">
        <h2>Grammar Race</h2>
        <p class="rc-sub">Answer the exercises as fast as you can. Be the first with <b>no mistakes</b>!</p>
        <div class="rc-join">
          <label>Race code <input id="rcCode" class="rc-code" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD" value="${esc(saved ? saved.code : '')}"></label>
          <label>Your name <input id="rcName" class="rc-name" maxlength="${ST.nameMax}" autocomplete="off" placeholder="Your name" value="${esc(store.get('name') || '')}"></label>
          <button type="button" class="rc-btn go" id="rcJoin">Join the race ▶</button>
          <p class="rc-msg" id="rcMsg">${esc(msg)}</p>
        </div>
        <p class="rc-teacher">Teacher? <button type="button" class="rc-link" id="rcMake">Make a race</button>${hosted ? ` · <button type="button" class="rc-link" id="rcResume">Go back to race ${esc(hosted.code)}</button>` : ''}</p>
        <ul class="rc-how">
          <li>Everybody has the same exercises. Answer them one by one.</li>
          <li>When you finish, press <b>Finish</b>. The wrong answers come back: fix them!</li>
          <li>The first player with everything right wins. The others can go on.</li>
        </ul>
      </div>`);
    const go = () => joinRace(area.querySelector('#rcCode').value, area.querySelector('#rcName').value);
    area.querySelector('#rcJoin').onclick = go;
    area.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }));
    area.querySelector('#rcCode').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); });
    area.querySelector('#rcMake').onclick = () => hostSetup();
    area.querySelector('#rcResume')?.addEventListener('click', () => resumeHost(hosted));
    (area.querySelector('#rcCode').value ? area.querySelector('#rcName') : area.querySelector('#rcCode')).focus();
  }

  /* ---------- the teacher ---------- */
  function hostSetup(msg = '') {
    view = 'setup';
    set$(`
      <div class="rc-menu">
        <h2>Make a race</h2>
        <p class="rc-sub">The exercises are about the pronouns, the verb <i>to be</i>, <i>my, your, his…</i> and the <i>’s</i>.</p>
        <div class="rc-mins" role="radiogroup" aria-label="Minutes">
          ${ST.presets.map(p => `<button type="button" class="rc-min${p.minutes === startMinutes ? ' on' : ''}" data-m="${p.minutes}"><b>${p.name}</b>about ${p.minutes} minutes<small>${C.countFor(p.minutes)} exercises</small></button>`).join('')}
        </div>
        <button type="button" class="rc-btn go" id="rcMakeGo">Make the race ▶</button>
        <button type="button" class="rc-btn ghost" id="rcBack">‹ Back</button>
        <p class="rc-msg" id="rcMsg">${esc(msg)}</p>
      </div>`);
    area.querySelectorAll('.rc-min').forEach(b => b.onclick = () => { startMinutes = +b.dataset.m; area.querySelectorAll('.rc-min').forEach(x => x.classList.toggle('on', x === b)); });
    area.querySelector('#rcBack').onclick = () => home();
    area.querySelector('#rcMakeGo').onclick = async e => {
      e.target.disabled = true;
      try {
        await roomApi().ready();
        const rid = rand(6), seed = rand(6);
        code = await roomApi().create(rid);
        R = { rid, minutes: startMinutes, seed, n: C.countFor(startMinutes), status: 'lobby', el: 0, board: [], cnt: 0, recvAt: Date.now() };
        await roomApi().update(code, { rc: { rid, minutes: R.minutes, seed, n: R.n, status: 'lobby', start: 0, el: 0, board: [], cnt: 0 } });
        store.set('host', JSON.stringify({ code, rid, minutes: R.minutes, seed, n: R.n }));
        startHost();
      } catch (err) { hostSetup(errorText(err)); }
    };
  }

  async function resumeHost(h) {
    try {
      const d = await raceApi().open(h.code);
      if (d.rc.rid !== h.rid) throw Object.assign(new Error('expired'), { code: 'expired' });
      code = h.code;
      R = { ...d.rc, recvAt: Date.now() };
      if (R.status === 'run') R.el = Date.now() - d.rc.start;   // this device's own clock
      startHost();
    } catch (err) { store.del('host'); home(errorText(err)); }
  }

  function startHost() {
    role = 'host'; set = C.makeSet(R.seed, R.minutes); players = []; lastSig = '';
    unsubPlayers = raceApi().watchPlayers(code, list => {
      players = list.filter(p => p.rid === R.rid).slice(0, ST.maxPlayers);
      clearTimeout(repaintT); repaintT = setTimeout(paintHost, 500);
    }, () => { /* the next snapshot will come */ });
    boardT = setInterval(() => sendBoard(false), ST.boardEvery);
    tickT = setInterval(tick, 1000);
    hostView();
  }

  function sendBoard(force, extra = {}) {
    if (role !== 'host') return;
    const rows = C.rank(players, R.n).map(C.boardRow);
    const sig = JSON.stringify(rows) + R.status;
    if (!force && sig === lastSig && Date.now() - lastSent < 15000) return;   // nothing new (but every 15 s the clock is sent again)
    lastSig = sig; lastSent = Date.now();
    R.board = rows; R.cnt = rows.length;
    roomApi().update(code, { 'rc.board': rows, 'rc.cnt': rows.length, 'rc.el': Math.round(elapsed()), ...extra }).catch(() => { /* try again at the next board */ });
  }

  function hostView() {
    view = R.status === 'lobby' ? 'host-lobby' : R.status === 'run' ? 'host-run' : 'host-over';
    clockEl.hidden = R.status === 'lobby';
    trackEl.hidden = true;
    const head = `<p class="rc-bigcode">Code <b>${esc(code)}</b></p>`;
    if (R.status === 'lobby') {
      set$(`<div class="rc-menu">
        <h2>Waiting for the players</h2>${head}
        <p class="rc-sub">Everybody opens the book, presses <b>Grammar Race</b> and types this code and their name.<br>about ${R.minutes} minutes · ${R.n} exercises</p>
        <p class="rc-count" id="rcCount"></p>
        <div class="rc-names" id="rcNames"></div>
        <div class="rc-actions">
          <button type="button" class="rc-btn go" id="rcStart">▶ Start the race!</button>
          <button type="button" class="rc-btn ghost" id="rcLeave">Close this race</button>
        </div></div>`);
      area.querySelector('#rcStart').onclick = () => {
        R.status = 'run'; R.el = 0; R.recvAt = Date.now();
        roomApi().update(code, { 'rc.status': 'run', 'rc.start': Date.now(), 'rc.el': 0 });
        sendBoard(true);
        hostView();
      };
      area.querySelector('#rcLeave').onclick = () => { if (confirm('Close this race?')) { roomApi().update(code, { 'rc.status': 'over' }).catch(() => {}); store.del('host'); home(); } };
    } else {
      set$(`<div class="rc-host">
        <div class="rc-hostbar">${head}<span id="rcHostInfo"></span>
          ${R.status === 'run' ? '<button type="button" class="rc-btn bad" id="rcEnd">⏹ Close the race</button>' : '<button type="button" class="rc-btn go" id="rcNew">New race</button>'}</div>
        <div class="rc-board" id="rcBoard"></div></div>`);
      area.querySelector('#rcEnd')?.addEventListener('click', () => {
        if (!confirm('Close the race now? The players will see the final ranking.')) return;
        R.status = 'over'; R.el = Math.round(elapsed());
        sendBoard(true, { 'rc.status': 'over' });
        hostView();
      });
      area.querySelector('#rcNew')?.addEventListener('click', () => { store.del('host'); home(); });
    }
    paintHost(); tick();
  }

  function paintHost() {
    if (role !== 'host') return;
    const count = area.querySelector('#rcCount');
    if (count) {
      count.textContent = players.length ? `${players.length} player${players.length > 1 ? 's' : ''} ready` : 'Nobody yet…';
      area.querySelector('#rcNames').innerHTML = players.map(p => `<span>${esc(p.n)}</span>`).join('');
    }
    const board = area.querySelector('#rcBoard');
    if (!board) return;
    const rows = C.rank(players, R.n);
    const done = rows.filter(p => p.fin).length;
    area.querySelector('#rcHostInfo').textContent = `${rows.length} players · ${done} finished`;
    board.innerHTML = `<table><thead><tr><th>#</th><th>Name</th><th>Progress</th><th>Mistakes</th><th>Time</th></tr></thead><tbody>${rows.map((p, i) => `
      <tr class="${p.fin ? 'fin' : p.phase === 'fix' ? 'fix' : ''}"><td>${p.fin && i === 0 ? '🏆' : i + 1}</td><td>${esc(p.n)}</td>
      <td><span class="rc-bar"><i style="width:${Math.round(p.pos / R.n * 100)}%"></i></span> ${p.fin ? '✅' : p.phase === 'fix' ? `fixing ${p.rem}` : `${p.pos}/${R.n}`}</td>
      <td>${p.mis ? p.mis : p.fin ? '0' : ''}</td><td>${p.fin ? fmt(p.fin) : ''}</td></tr>`).join('')}</tbody></table>`;
    sendBoard(false);
  }

  /* ---------- a player joins ---------- */
  async function joinRace(c, name) {
    c = (c || '').toUpperCase().replace(/[^A-Z]/g, ''); name = (name || '').trim().slice(0, ST.nameMax);
    const msg = area.querySelector('#rcMsg');
    if (c.length !== 4) { msg.textContent = 'The code has 4 letters.'; return; }
    if (!name) { msg.textContent = 'Write your name!'; area.querySelector('#rcName').focus(); return; }
    area.querySelector('#rcJoin').disabled = true; msg.textContent = 'Joining…';
    try {
      const d = await raceApi().open(c);
      let saved = null;
      try { saved = JSON.parse(store.get('me')); } catch { /* none */ }
      const back = saved && saved.code === c && saved.rid === d.rc.rid && saved.me;      // the same child, after the page was reloaded
      if (!back && d.rc.cnt >= ST.maxPlayers) throw Object.assign(new Error('full'), { code: 'full' });
      code = c; role = 'kid';
      R = { ...d.rc, recvAt: Date.now() };
      set = C.makeSet(R.seed, R.minutes);
      me = back ? { ...saved.me, n: name } : { id: rand(10) + Date.now().toString(36), n: name, answers: [], a: 0, phase: 'play', fin: 0, mis: 0, t: 0 };
      store.set('name', name);
      offline = false;
      await pushMe();   // if our name cannot be written (rules, no internet) we must know now, not play alone
      if (offline) throw Object.assign(new Error('permission-denied'), { code: 'permission-denied' });
      listen();
      kidView();
    } catch (err) {
      role = null; R = null; me = null;
      area.querySelector('#rcJoin').disabled = false;
      msg.textContent = err.code === 'full' ? 'This race is full.' : errorText(err);
      // not signed in: a button to do it (the book's own sign-in), then try again
      if (/operation-not-allowed|admin-restricted/.test(err.code || err.message || '') && window.book.signIn) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'rc-btn'; b.textContent = 'Sign in with Google';
        b.onclick = () => window.book.signIn();
        msg.after(b);
      }
    }
  }

  function listen() {
    unsub = roomApi().watch(code, onRoom, () => { /* the poll will try again */ });
    pollT = setInterval(() => roomApi().read(code).then(onRoom).catch(() => {}), 8000);
    tickT = setInterval(tick, 1000);
  }

  function onRoom(d) {
    if (!d || !d.rc || d.rc.rid !== R.rid) return;
    const was = R.status;
    const fresh = d.rc.el !== R.el || d.rc.status !== R.status;   // the same document read again must not move the clock back
    R = { ...R, ...d.rc, recvAt: fresh ? Date.now() : R.recvAt };
    if (role === 'kid') {
      if (was !== R.status) kidView();
      else if (view === 'done' || view === 'over' || view === 'lobby') kidView(true);
      paintTrack();
    }
  }

  function tick() {
    if (!R) return;
    if (R.status === 'lobby') { clockEl.hidden = true; return; }
    clockEl.hidden = false;   // the time only goes forward
    clockEl.textContent = R.status === 'over' ? '🏁 Race closed' : `⏱ ${fmt(elapsed())}`;
  }

  /* ---------- the player: waiting, playing ---------- */
  function kidView(soft) {
    if (R.status === 'over') return overView();
    if (R.status === 'lobby') {
      view = 'lobby'; trackEl.hidden = true;
      const names = (R.board || []).map(r => `<span>${esc(r.n)}</span>`).join('');
      set$(`<div class="rc-menu"><h2>You are in, ${esc(me.n)}!</h2><p class="rc-sub">Waiting for the teacher to start the race…</p>
        <p class="rc-bigcode">Code <b>${esc(code)}</b></p><p class="rc-count">${R.cnt || 0} player${R.cnt === 1 ? '' : 's'} ready</p><div class="rc-names">${names}</div></div>`);
      return;
    }
    tick();
    if (soft && view === 'done') return doneView();
    if (me.phase === 'done') return doneView();
    if (me.phase === 'play' && me.a >= R.n) return endView();
    if (me.phase === 'fix' && wrongList().length === 0) return endView();
    questionView();
  }

  function questionView() {
    view = 'question';
    const fixing = me.phase === 'fix';
    const wl = fixing ? wrongList() : [];
    const i = fixing ? wl[rot % wl.length] : me.a;
    const ex = set[i];
    const T = D.topics[ex.topic], how = T.how ? T.how[ex.t] : '';
    const gap = esc(ex.q).replace('___', '<span class="rc-gap">＿＿＿</span>');
    set$(`<div class="rc-card${fixing ? ' fixing' : ''}" style="--tc:${T.color}">
      <div class="rc-topic"><b>${esc(T.label)}</b><span>${esc(how)}</span><em>${ex.gi + 1}/${ex.gn}</em></div>
      ${fixing ? `<p class="rc-fixmsg">✋ Not all right! Fix this one. <b>${wrongList().length}</b> to go.</p>` : ''}
      <p class="rc-num">${fixing ? 'Exercise ' + (i + 1) : `Exercise ${i + 1} of ${R.n}`}</p>
      <p class="rc-q">${gap}</p>
      ${ex.t === 'choice'
        ? `<div class="rc-opts">${ex.o.map(o => `<button type="button" class="rc-opt" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`
        : `<div class="rc-type"><input id="rcAns" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer" placeholder="Write here"><button type="button" class="rc-btn go" id="rcNext">Next ›</button></div>`}
      <p class="rc-tryagain" id="rcTry" hidden>Not yet. Try again!</p>
    </div>`);
    paintTrack();
    if (ex.t === 'choice') area.querySelectorAll('.rc-opt').forEach(b => b.onclick = () => answer(b.dataset.v, b));
    else {
      const inp = area.querySelector('#rcAns');
      const go = () => answer(inp.value);
      area.querySelector('#rcNext').onclick = go;
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      inp.focus();
    }
  }

  function answer(value, btn) {
    if (!String(value).trim()) return;
    me.t = Math.round(elapsed());
    if (me.phase === 'play') {
      me.answers[me.a] = value; me.a++;
      pushMe();
      if (btn) { btn.classList.add('picked'); area.querySelectorAll('.rc-opt').forEach(b => { b.disabled = true; }); setTimeout(() => kidView(), 180); } else kidView();
      return;
    }
    // fixing: now we say if it is right
    const wl = wrongList(), i = wl[rot % wl.length];
    if (C.isRight(set[i], value)) {
      me.answers[i] = value; pushMe();
      if (wrongList().length) kidView(); else finish();   // everything is right now: you are a finisher, no more clicks
    } else {
      btn?.classList.add('wrong'); if (btn) btn.disabled = true;
      area.querySelector('#rcTry').hidden = false;
      const inp = area.querySelector('#rcAns'); if (inp) { inp.select(); inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400); }
      // the exercise comes back later: the next wrong one is shown now
      if (wl.length > 1) setTimeout(() => { if (view === 'question' && me.phase === 'fix') { rot++; kidView(); } }, 1100);
    }
  }

  function endView() {
    view = 'end';
    const fixing = me.phase === 'fix';
    set$(`<div class="rc-card rc-end">
      <h2>${fixing ? 'All fixed! 🎉' : 'All answered! 🎉'}</h2>
      <p class="rc-sub">${fixing ? 'Press Finish to see if you are the winner.' : 'Press Finish. If something is wrong, it comes back to you.'}</p>
      <button type="button" class="rc-btn go big" id="rcFinish">🏁 Finish</button></div>`);
    paintTrack();
    area.querySelector('#rcFinish').onclick = finish;
  }

  function finish() {
    const w = wrongList();
    me.t = Math.round(elapsed());
    if (w.length) {
      if (me.phase === 'play') me.mis = w.length;
      me.phase = 'fix'; rot = 0; pushMe(); kidView();
    } else {
      me.phase = 'done'; me.fin = Math.max(1, me.t); me.doneAt = Date.now(); pushMe(); doneView();
    }
  }

  /* ---------- the player: finished, closed ---------- */
  function ranking(list, you) {
    return `<ol class="rc-rank">${list.slice(0, 10).map((p, i) => `<li class="${p.id === you ? 'me' : ''}${p.fin ? ' fin' : ''}"><b>${p.fin && i === 0 ? '🏆' : i + 1}</b><span>${esc(p.n)}</span><em>${p.fin ? fmt(p.fin) : `${p.pos}/${R.n}`}</em></li>`).join('')}</ol>`;
  }
  function doneView() {
    view = 'done';
    const st = standings();
    const place = st.findIndex(p => p.id === me.id) + 1;
    const first = place === 1;
    // the ranking comes from the teacher's device every few seconds: until it has seen our finish, the others may be ahead
    const seen = (R.board || []).some(r => r.i === me.id && r.f);
    if (!seen && me.doneAt && Date.now() - me.doneAt < 20000) {
      set$(`<div class="rc-card rc-done"><h2>🏁 You finished!</h2><p class="rc-sub">Your time: <b>${fmt(me.fin)}</b><br>Checking the ranking…</p></div>`);
      paintTrack();
      clearTimeout(doneT); doneT = setTimeout(() => { if (view === 'done') doneView(); }, 2000);
      return;
    }
    set$(`<div class="rc-card rc-done">
      <h2>${first ? '🏆 You won!' : `You finished: ${place}${place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'} place`}</h2>
      <p class="rc-sub">${me.mis ? `You fixed ${me.mis} mistake${me.mis > 1 ? 's' : ''}. ` : 'No mistakes! '}Your time: <b>${fmt(me.fin)}</b></p>
      ${ranking(st, me.id)}
      <p class="rc-note">The ranking changes while the others finish.</p></div>`);
    paintTrack();
  }

  function overView() {
    view = 'over'; clockEl.hidden = false; tick();
    trackEl.hidden = true;
    const st = role === 'kid' ? standings() : [];
    const place = st.findIndex(p => p.id === me.id) + 1;
    set$(`<div class="rc-card rc-done"><h2>🏁 The race is over!</h2>
      <p class="rc-sub">${me.phase === 'done' ? `You finished ${place === 1 ? 'first' : 'in place ' + place}.` : `You answered ${me.a} of ${R.n}.`}</p>
      ${ranking(st, me.id)}
      <button type="button" class="rc-btn go" id="rcHome">OK</button></div>`);
    area.querySelector('#rcHome').onclick = () => { store.del('me'); home(); };
  }

  /* ---------- the line at the top: the first, who is just before me, me, who is just behind ---------- */
  function paintTrack() {
    if (role !== 'kid' || !R || R.status !== 'run' || view === 'lobby' || view === 'over') { trackEl.hidden = true; return; }
    const st = standings(), r = st.findIndex(p => p.id === me.id);
    const lead = st[0], ahead = r > 0 ? st[r - 1] : null, behind = st[r + 1] || null;
    const x = p => Math.min(100, Math.max(0, p.pos / R.n * 100));
    const dot = (p, cls) => `<i class="rc-dot ${cls}" style="left:${x(p)}%" title="${esc(p.n)}">${cls === 'tiny' ? '' : esc([...p.n][0].toUpperCase())}</i>`;
    const chip = (cls, icon, p, note) => `<span class="rc-chip ${cls}"><b>${icon}</b> ${esc(p.n)}<small>${note}</small></span>`;
    const note = p => (p.fin ? 'finished' : `${p.pos}/${R.n}`);
    const special = new Set([lead, ahead, behind].filter(Boolean).map(p => p.id));
    special.add(me.id);
    const chips = [];
    if (r === 0) chips.push(chip('first me', '🥇', { n: 'You' }, 'first!'));
    else {
      chips.push(chip('first', '🥇', lead, note(lead)));
      if (ahead && ahead.id !== lead.id) chips.push(chip('ahead', '⬆', ahead, note(ahead)));
      chips.push(chip('me', '👉', { n: 'You', pos: C.posOf(myRow(), R.n) }, `#${r + 1} of ${st.length}`));
    }
    if (behind) chips.push(chip('behind', '⬇', behind, note(behind)));
    trackEl.hidden = false;
    trackEl.innerHTML = `<div class="rc-line"><span class="rc-end s">START</span><span class="rc-end f">🏁</span>
      <div class="rc-rail">${st.filter(p => !special.has(p.id)).map(p => dot(p, 'tiny')).join('')}${[lead, ahead, behind].filter((p, i, a) => p && p.id !== me.id && a.indexOf(p) === i).map(p => dot(p, p === lead ? 'lead' : p === ahead ? 'ahead' : 'behind')).join('')}${dot({ ...myRow(), n: me.n, pos: C.posOf(myRow(), R.n) }, 'me')}</div></div>
      <div class="rc-chips">${chips.join('')}${offline ? '<span class="rc-chip off">⚠ offline</span>' : ''}</div>`;
  }

  /* ================= open / close ================= */
  function teardown() {
    [unsub, unsubPlayers].forEach(f => { try { f && f(); } catch { /* already closed */ } });
    unsub = unsubPlayers = null;
    clearInterval(pollT); clearInterval(tickT); clearInterval(boardT); clearTimeout(repaintT); clearTimeout(doneT);
    pollT = tickT = boardT = repaintT = null;
    R = null; me = null; players = []; set = [];
  }
  function open() {
    overlay.hidden = false;
    document.documentElement.classList.add('rc-open');
    if (!role) home();
    box.focus();
  }
  function close() {
    overlay.hidden = true;
    document.documentElement.classList.remove('rc-open');
  }
  // the title goes back to the start; the cross hides the pop-up (the race goes on in the background)
  overlay.querySelector('#rcTitle').onclick = () => {
    if (!role) return home();
    if (confirm(role === 'host' ? 'Leave the teacher screen? You can come back to this race from the start.' : 'Leave the race?')) {
      if (role === 'kid') store.del('me');
      home();
    }
  };
  overlay.querySelector('#rcClose').onclick = () => {
    if (role === 'kid' && me && me.phase !== 'done' && R && R.status === 'run' && !confirm('Close the race? You can come back with the same code.')) return;
    close();
  };
  document.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') overlay.querySelector('#rcClose').click();
    e.stopPropagation(); // the arrows must not turn the pages behind
  }, true);

  window.GRAMMAR_RACE = { open, close };

  /* ================= the Games list on the home page, and the button on the page ================= */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-race-open]');
    if (b) { e.preventDefault(); open(); }
  });
  window.addEventListener('load', () => {
    const list = document.getElementById('gameList');
    if (!list) return;
    const pill = document.createElement('details');
    pill.className = 'game-topic';
    pill.style.setProperty('--c', '#f05f4b');
    pill.innerHTML = `<summary>${typeof VS_SIGN === 'string' ? VS_SIGN : ''} Grammar Race <small>1</small></summary><div class="topic-pages"><a href="#p${PAGES.of('own-mistakes:R')}" data-race-open>${typeof VS_SIGN === 'string' ? VS_SIGN : ''} 🏁 Grammar Race</a></div>`;
    list.append(pill);
    document.addEventListener('click', e => { if (!e.target.closest('#gameList')) pill.open = false; });
    list.addEventListener('toggle', e => {
      if (e.target.open) list.querySelectorAll('.game-topic').forEach(o => { if (o !== e.target) o.open = false; });
    }, true);
    window.hideClosedGames?.();
  });
})();
