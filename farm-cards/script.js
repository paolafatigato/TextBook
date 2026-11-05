/**
 * ANIMAL FARM CARDS - interface (you are player 0, Robo is player 1).
 * The engine (engine.js) runs the game and asks this file whenever the human has to decide (the "io" object).
 */
(() => {
  'use strict';
  const E = FarmEngine;
  const BY = E.BY;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ME = 0, OPP = 1;

  let G = null, S = null;
  const ui = { sel: null, pick: null, main: null };

  // images: img/<id>.png, then .jpg, .jpeg, .webp, then the emoji
  window.fcImg = img => {
    const exts = ['png', 'jpg', 'jpeg', 'webp'];
    const n = (+img.dataset.n || 0) + 1;
    if (n < exts.length) { img.dataset.n = n; img.src = `img/${img.dataset.id}.${exts[n]}`; return; }
    const d = document.createElement('div');
    d.className = 'emoji'; d.textContent = img.dataset.emoji;
    img.replaceWith(d);
  };
  const art = c => `<div class="art"><img src="img/${c.id}.png" data-id="${c.id}" data-emoji="${c.emoji}" alt="${esc(c.name)}" onerror="fcImg(this)"></div>`;

  // ------------------------------------------------------------ cards
  function fullCard(c, inst, hl) {
    const val = k => (inst && G ? G.stat(inst, k) : c.stats[k]);
    const cls = k => { const v = val(k); return v > c.stats[k] ? 'up' : v < c.stats[k] ? 'down' : ''; };
    return `<div class="card">
      <div class="c-head"><b>${esc(c.name)}</b><span class="c-score" title="Score = Grain to play it">🌾 ${c.score}</span></div>
      ${art(c)}
      <div class="c-kind">${c.kind}</div>
      <div class="c-power"><b>⚡ ${esc(c.power.name)}</b><i>${WHEN[c.power.when]}</i><p>${esc(c.power.text)}</p></div>
      <p class="c-desc">${esc(c.desc)}</p>
      <ul class="c-stats">${STATS.map(([k, l]) => `<li class="${hl === k ? 'hl' : ''}"><span>${l}</span><b class="${cls(k)}">${val(k)}</b></li>`).join('')}</ul>
    </div>`;
  }

  function mini(c, inst, extra) {
    const short = { power: 'POW', intelligence: 'INT', productivity: 'PRO', loyalty: 'LOY', kindness: 'KIN' };
    const val = k => (inst ? G.stat(inst, k) : c.stats[k]);
    const cls = k => { const v = val(k); return v > c.stats[k] ? 'up' : v < c.stats[k] ? 'down' : ''; };
    let flags = '';
    if (inst) {
      if (inst.entered === S.turnNo) flags += '💤';
      if (inst.noAtk >= S.turnNo) flags += '🎀';
      if (inst.survived) flags += '🩹';
      if (S.used[inst.id] && ['jones', 'frederick', 'napoleon', 'mollie', 'benjamin', 'sheep', 'moses', 'clover', 'squealer', 'pilkington'].includes(inst.id)) flags += '✔';
    }
    return `<div class="mini ${extra || ''}" ${inst ? `data-uid="${inst.uid}"` : `data-hand="${c.id}"`}>
      <div class="m-name">${esc(c.name)}</div><span class="m-cost">🌾${c.score}</span>
      ${art(c)}
      <div class="m-stats">${STATS.map(([k]) => `<span>${short[k]}<b class="${cls(k)}">${val(k)}</b></span>`).join('')}</div>
      <div class="m-flags" title="💤 just played · 🎀 can't attack · 🩹 hurt · ✔ power used">${flags}</div>
    </div>`;
  }

  // ------------------------------------------------------------ rendering
  function render(state) {
    if (state) S = state;
    if (!S || !G) return;
    const me = S.players[ME], op = S.players[OPP];
    const myTurn = S.cur === ME && !S.over;

    $('turnInfo').textContent = `Turn ${Math.max(me.turns, op.turns)} of ${E.CFG.MAX_TURNS} · ${S.cur === ME ? 'Your turn' : "Robo's turn"}`;
    const bar = (p, i) => `<span class="nm">${i === ME ? '👤' : '🤖'} ${esc(p.name)}</span>
      ${p.legacy ? '<span class="tag" title="Old Major\'s legacy">+1 Power (Animals)</span>' : ''}
      ${G.silenced(i) ? '<span class="tag">🔇 powers silenced</span>' : ''}
      <span class="life" id="life${i}">❤️ ${p.life}</span>
      <span title="Grain to spend this turn">🌾 ${S.cur === i ? p.grain : '–'}</span>
      <span title="Cards in hand / in the deck">🃏 ${p.hand.length} · 📚 ${p.deck.length}</span>`;
    $('oppBar').innerHTML = bar(op, OPP);
    $('myBar').innerHTML = bar(me, ME);

    const pickValid = ui.pick ? ui.pick.valid : null;
    const field = (p, mine) => p.field.length ? p.field.map(i => {
      let x = '';
      if (pickValid) x = pickValid.has(i.uid) ? 'valid' : 'dim';
      else {
        if (mine && myTurn && ui.main && G.canAttack(i)) x += ' ready';
        if (mine && myTurn && ui.main && !G.canAttack(i)) x += ' cant';
        if (ui.sel && ui.sel.uid === i.uid) x += ' sel';
      }
      return mini(BY[i.id], i, x);
    }).join('') : '<span class="empty">no cards on the field</span>';
    $('oppField').innerHTML = field(op, false);
    $('myField').innerHTML = field(me, true);

    $('myHand').innerHTML = me.hand.length ? me.hand.map(id => {
      let x = '';
      if (ui.sel && ui.sel.id === id) x += ' sel';
      if (!(myTurn && ui.main && G.canPlay(ME, id))) x += ' cant';
      return mini(BY[id], null, x);
    }).join('') : '<span class="empty">your hand is empty</span>';

    // prompt + buttons
    const pr = $('prompt');
    if (S.over) pr.textContent = '';
    else if (ui.pick) pr.textContent = ui.pick.title;
    else if (myTurn && ui.main) pr.textContent = 'Your turn: play cards, attack, use powers — then end your turn.';
    else if (S.cur === OPP) pr.textContent = 'Robo is playing…';
    else pr.textContent = '';
    $('cancelBtn').hidden = !(ui.pick && ui.pick.cancel);
    $('endBtn').hidden = !(myTurn && ui.main && !ui.pick);
    renderPreview();
  }

  function selectedInfo() {
    if (!ui.sel) return null;
    if (ui.sel.id && ui.sel.hand) return { c: BY[ui.sel.id], inst: null };
    const all = S.players[ME].field.concat(S.players[OPP].field);
    const inst = all.find(i => i.uid === ui.sel.uid);
    return inst ? { c: BY[inst.id], inst } : null;
  }

  function renderPreview() {
    const el = $('preview');
    const info = selectedInfo();
    if (!info) { ui.sel = null; el.innerHTML = '<div class="hint">Click a card to read it.<br><br>🌾 = Grain: the cost of the card.<br>Green glow = it can attack now.</div>'; return; }
    const { c, inst } = info;
    let acts = '', why = '';
    const myTurn = S.cur === ME && !!ui.main && !ui.pick && !S.over;
    if (!inst) {   // card in hand
      if (myTurn) {
        const ok = G.canPlay(ME, c.id);
        acts = `<button class="btn btn-gold" data-act="play" ${ok ? '' : 'disabled'}>Play (🌾 ${c.score})</button>`;
        if (!ok) why = S.players[ME].grain < c.score ? 'Not enough Grain.' : '';
      }
    } else if (inst.owner === ME && myTurn) {
      const can = G.canAttack(inst);
      const foeEmpty = S.players[OPP].field.length === 0;
      acts = `<button class="btn btn-gold" data-act="attack" ${can ? '' : 'disabled'}>${foeEmpty ? 'Hit the farm' : 'Attack'}</button>`;
      const hasActive = ['jones', 'frederick', 'napoleon', 'mollie', 'benjamin', 'sheep', 'snowball'].includes(inst.id);
      if (hasActive) {
        const block = G.powerBlock(inst);
        acts += `<button class="btn" data-act="power" ${block ? 'disabled' : ''}>⚡ ${esc(c.power.name)}</button>`;
        if (block) why = `Power: ${block}.`;
      }
      if (!can) why = (why ? why + ' ' : '') + (inst.entered === S.turnNo ? 'Just played: it cannot attack yet.' : inst.attacked ? 'Already attacked.' : inst.noAtk >= S.turnNo ? 'Mollie\'s ribbons: it cannot attack.' : '');
    }
    el.innerHTML = fullCard(c, inst) + (acts || why ? `<div class="actions">${acts}${why ? `<span class="why">${esc(why)}</span>` : ''}</div>` : '');
  }

  // ------------------------------------------------------------ modal helper
  function modal(html, autoMs) {
    return new Promise(res => {
      const m = $('modal'), box = $('modalBox');
      box.innerHTML = html;
      m.hidden = false;
      let timer = null;
      const done = v => { clearTimeout(timer); m.hidden = true; box.onclick = null; res(v); };
      box.onclick = e => { const b = e.target.closest('[data-v]'); if (b) done(b.dataset.v); };
      if (autoMs) timer = setTimeout(() => done('auto'), autoMs);
    });
  }

  // ------------------------------------------------------------ io: what the human decides
  const io = {
    render,
    log(msg) {
      const li = document.createElement('li');
      li.textContent = msg;
      if (msg.startsWith('—')) { li.className = 'turn'; li.textContent = msg.replace(/—/g, '').trim(); }
      $('log').appendChild(li);
      $('log').scrollTop = 1e9;
    },
    hit(pi) { const e = $('life' + pi); if (e) { e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash'); } },
    mainAction() { return new Promise(res => { ui.main = res; render(); }); },
    pickTarget(pi, title, list) {
      return new Promise(res => {
        ui.pick = { title, valid: new Set(list.map(i => i.uid)), cancel: true, done: uid => res(uid ? list.find(i => i.uid === uid) : null) };
        render();
      });
    },
    confirm(pi, title, text) {
      return modal(`<h2>⚡ ${esc(title)}</h2><p>${esc(text)}</p><div class="row"><button class="btn btn-gold" data-v="y">Yes</button><button class="btn" data-v="n">No</button></div>`).then(v => v === 'y');
    },
    pickStat(pi, title) {
      return modal(`<h2>${esc(title)}</h2><div class="statpick">${STATS.map(([k, l]) => `<button data-v="${k}"><span>${l}</span></button>`).join('')}</div><div class="row"><button class="btn btn-ghost" data-v="">Cancel</button></div>`);
    },
    chooseStat(pi, att, target, asDefender) {
      const mine = asDefender ? target : att, theirs = asDefender ? att : target;
      const rows = STATS.map(([k, l]) => {
        const a = G.stat(mine, k), b = G.stat(theirs, k), m = a - b;
        const cls = m >= 2 ? 'win' : m <= -2 ? 'lose' : '';
        return `<button class="${cls}" data-v="${k}"><span>${l}</span><span>${a}</span><em>vs</em><span>${b}</span></button>`;
      }).join('');
      return modal(`<h2>Choose the stat</h2>
        <p>${esc(BY[mine.id].name)} (yours) vs ${esc(BY[theirs.id].name)}.<br>Win by <b>2 or more</b> to destroy the other card; lose by 2 or more and yours is destroyed.</p>
        <div class="statpick">${rows}</div>`);
    },
    duel({ att, target, k, a, d, result }) {
      const label = STATS.find(s => s[0] === k)[1];
      const txt = result === 'win' ? `${BY[target.id].name} is destroyed!` : result === 'lose' ? `${BY[att.id].name} is destroyed!` : 'Stand-off: nothing happens.';
      return modal(`<div class="duel">
        ${fullCard(BY[att.id], att, k).replace('class="card"', 'class="card" style="width:210px"')}
        <div class="vs">${a} – ${d}<small>${label}</small></div>
        ${fullCard(BY[target.id], target, k).replace('class="card"', 'class="card" style="width:210px"')}
        <div class="res">${esc(txt)}</div></div>
        <div class="row"><button class="btn btn-gold" data-v="ok">Continue</button></div>`, 6000);
    },
    peek(pi, hand) {
      return modal(`<h2>📖 Benjamin reads the wall</h2><p>This is your opponent's hand:</p>
        <div class="gallery">${hand.map(id => fullCard(BY[id]).replace('class="card"', 'class="card" style="width:200px"')).join('') || '<p>(empty)</p>'}</div>
        <div class="row"><button class="btn btn-gold" data-v="ok">OK</button></div>`);
    },
    end(st) {
      ui.main = null; ui.pick = null; render();
      const won = st.winner === ME;
      modal(`<h2>${st.winner === null ? '🤝 A draw' : won ? '🏆 You win!' : '🐷 Robo wins'}</h2><p>${esc(st.reason)}</p>
        <div class="row"><button class="btn btn-gold" data-v="again">Play again</button><button class="btn" data-v="menu">Menu</button></div>`).then(v => { if (v === 'again') start(); else leave(); });
    },
  };

  // ------------------------------------------------------------ clicks
  function resolveMain(a) { const r = ui.main; if (r) { ui.main = null; ui.sel = null; r(a); } }
  function finishPick(uid) { const p = ui.pick; if (!p) return; ui.pick = null; p.done(uid); }

  $('board').addEventListener('click', e => {
    const el = e.target.closest('[data-uid],[data-hand]');
    if (!el) return;
    if (ui.pick) {
      const uid = +el.dataset.uid;
      if (uid && ui.pick.valid.has(uid)) { finishPick(uid); return; }
    }
    ui.sel = el.dataset.hand ? { hand: true, id: el.dataset.hand } : { uid: +el.dataset.uid };
    render();
  });

  $('preview').addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b || !ui.main) return;
    const info = selectedInfo();
    if (!info) return;
    const act = b.dataset.act;
    if (act === 'play') resolveMain({ type: 'play', id: info.c.id });
    else if (act === 'power') resolveMain({ type: 'power', uid: info.inst.uid });
    else if (act === 'attack') {
      if (!S.players[OPP].field.length) { resolveMain({ type: 'attack', uid: info.inst.uid, target: null }); return; }
      const uid = info.inst.uid;
      ui.pick = { title: `Choose the card ${info.c.name} attacks`, valid: new Set(S.players[OPP].field.map(i => i.uid)), cancel: true, done: t => { if (t) resolveMain({ type: 'attack', uid, target: t }); } };
      render();
    }
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const a = b.dataset.action;
    if (a === 'start') start();
    else if (a === 'rules') openRules();
    else if (a === 'gallery') openGallery();
    else if (a === 'leave') { if (confirm('Leave the game?')) leave(); }
    else if (a === 'endTurn') resolveMain({ type: 'end' });
    else if (a === 'cancelPick') finishPick(null);
  });

  // ------------------------------------------------------------ screens
  function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }

  function start() {
    $('modal').hidden = true;
    $('log').innerHTML = '';
    ui.sel = null; ui.pick = null; ui.main = null;
    if (tok) tok.dead = true;         // a game left behind can no longer touch the screen
    tok = { dead: false };
    G = E.create({ human: [true, false], io: wrapIo(tok), names: ['You', 'Robo'] });
    S = G.S;
    show('game');
    G.run();
  }
  let tok = null;
  // every io call of a game that was left (or restarted) just hangs forever: the old game simply stops
  function wrapIo(t) {
    const o = {};
    Object.keys(io).forEach(k => { o[k] = (...a) => (t.dead ? new Promise(() => {}) : io[k](...a)); });
    return o;
  }
  function leave() {
    if (tok) tok.dead = true;
    if (G) G.S.over = true;
    G = null; S = null; ui.main = null; ui.pick = null;
    $('modal').hidden = true;
    show('lobby');
  }

  function openGallery() {
    modal(`<h2>All 16 cards</h2><p>Sorted by score. Score = Grain to play the card.</p>
      <div class="gallery">${CARDS.map(c => fullCard(c)).join('')}</div>
      <div class="row"><button class="btn" data-v="x">Close</button></div>`);
  }

  function openRules() {
    const C = E.CFG;
    modal(`<div class="rules"><h2>Rules</h2>
      <h3>The cards</h3><ul>
        <li>There are 16 characters. Each player gets 8 of them. The deal is fair: both decks have the same total score (${CARDS.reduce((n, c) => n + c.score, 0) / 2} Grain).</li>
        <li>Every card has a <b>score</b> (🌾 = what it costs), a <b>power</b> and five <b>stats</b> from 1 to 10: Power, Intelligence, Productivity, Loyalty, Kindness.</li></ul>
      <h3>Your turn</h3><ul>
        <li>You start with ${C.START_HAND} cards (the second player gets ${C.START_HAND + C.SECOND_BONUS}). You draw a card at the start of every turn.</li>
        <li>You get Grain every turn: your turn number + ${C.GRAIN_BASE} (max ${C.GRAIN_MAX}). Grain does not carry over.</li>
        <li>Play cards from your hand to your field by paying their score. Use powers. Attack. Then end your turn.</li></ul>
      <h3>Attack: the stat duel</h3><ul>
        <li>A card cannot attack on the turn it is played, and it attacks once per turn.</li>
        <li>Choose an enemy card, then choose <b>one of the five stats</b>. Compare the numbers:</li>
        <li><b>+2 or more</b> for the attacker: the defender is destroyed. <b>−2 or less</b>: the attacker is destroyed. In between: stand-off, nothing happens.</li>
        <li>If the enemy has <b>no cards on the field</b>, you hit the farm: they lose Life equal to half your card's Power (rounded up).</li></ul>
      <h3>Winning</h3><ul>
        <li>Each player has ${C.LIFE} Life. Reach 0 and you lose. After ${C.MAX_TURNS} turns each, the player with more Life wins.</li></ul>
      <h3>Powers</h3><ul>
        <li><b>Your turn</b> powers have a button on the card. <b>Reaction</b> powers pop up when your cards are attacked or destroyed. <b>Always on</b> powers work by themselves.</li>
        <li>Most powers work <b>once per game</b>. Silenced powers (by the sheep) do not work.</li></ul>
      <div class="row"><button class="btn btn-gold" data-v="x">Got it</button></div></div>`);
  }

  // first screen: the cards and the powers are the same for everybody, nothing to load
  show('lobby');
})();
