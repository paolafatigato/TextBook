/**
 * ANIMAL FARM CARDS - interface (you are player 0, Robo is player 1).
 * The engine (engine.js) runs the game and asks this file whenever the human has to decide (the "io" object).
 * A target is either a card on a field (its uid, a number) or a card in the Market ('m:' + id).
 */
(() => {
  'use strict';
  const E = FarmEngine;
  const BY = E.BY;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ME = 0, OPP = 1;
  const costOf = c => (c.cost !== undefined ? c.cost : c.score);

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
  // c = card data, inst = the card on a field (its stats can be changed by effects), price = what you pay now
  function fullCard(c, inst, price) {
    const val = k => (inst && G ? G.stat(inst, k) : c.stats[k]);
    const cls = k => { const v = val(k); return (FADED[k] ? 'fade ' : '') + (v > c.stats[k] ? 'up' : v < c.stats[k] ? 'down' : ''); };
    const p = price === undefined ? costOf(c) : price;
    return `<div class="card">
      <div class="c-head"><b>${esc(c.name)}</b><span class="c-pow" title="Power: what it is worth when you control it">⚡${c.score}</span><span class="c-score" title="Price in Grain">🌾${p}</span></div>
      ${art(c)}
      <div class="c-kind">${c.kind}${G && inst ? ` · makes 🌾${G.income(inst)} a turn` : ` · makes 🌾${Math.ceil(c.stats.productivity / 4)} a turn`}</div>
      <div class="c-power"><b>${esc(c.power.name)}</b><i>${WHEN[c.power.when]}</i><p>${esc(c.power.text)}</p></div>
      <p class="c-desc">${esc(c.desc)}</p>
      <ul class="c-stats">${STATS.map(([k, l]) => `<li class="${FADED[k] ? 'fade' : ''}"><span>${l}</span><b class="${cls(k)}">${val(k)}</b></li>`).join('')}</ul>
    </div>`;
  }

  function mini(c, inst, extra, price) {
    const short = { attack: 'ATK', defense: 'DEF', productivity: 'PRO', loyalty: 'LOY', kindness: 'KIN' };
    const val = k => (inst ? G.stat(inst, k) : c.stats[k]);
    const cls = k => { const v = val(k); return (FADED[k] ? 'fade ' : '') + (v > c.stats[k] ? 'up' : v < c.stats[k] ? 'down' : ''); };
    let flags = '';
    if (inst) {
      if (inst.entered === S.turnNo || inst.entered === S.turnNo - 1) flags += inst.owner === S.cur ? '💤' : '🛡️';
      if (G.atkGuard(inst)) flags += '🌼';
      if (inst.survived) flags += '🩹';
    }
    const p = price === undefined ? costOf(c) : price;
    return `<div class="mini ${extra || ''}" ${inst ? `data-uid="${inst.uid}"` : `data-market="${c.id}"`}>
      <div class="m-name">${esc(c.name)}</div>
      <div class="m-badges"><span class="m-pow">⚡${c.score}</span><span class="m-cost">🌾${p}</span></div>
      ${art(c)}
      <div class="m-stats">${STATS.map(([k]) => `<span class="${FADED[k] ? 'fade' : ''}">${short[k]}<b class="${cls(k)}">${val(k)}</b></span>`).join('')}</div>
      <div class="m-flags" title="💤 just bought: cannot attack yet · 🛡️ just bought: cannot be attacked yet · 🌼 protected by Clover · 🩹 hurt">${flags}</div>
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
      ${G.silenced(i) ? '<span class="tag">🔇 effects silenced</span>' : ''}
      <span class="powbar" title="Power: ${G.power(i)} of ${E.CFG.TARGET} needed to win"><i style="width:${Math.min(100, 100 * G.power(i) / E.CFG.TARGET)}%"></i><b>⚡ ${G.power(i)} / ${E.CFG.TARGET}</b></span>
      <span title="Grain you have now">🌾 ${p.grain}</span>
      <span title="Grain you get at the start of your turn">+${G.incomeOf(i)}/turn</span>`;
    $('oppBar').innerHTML = bar(op, OPP);
    $('myBar').innerHTML = bar(me, ME);

    const pickValid = ui.pick ? ui.pick.valid : null;
    const field = (p, mine) => p.field.length ? p.field.map(i => {
      let x = '';
      if (pickValid) x = pickValid.has(i.uid) ? 'valid' : 'dim';
      else {
        if (mine && myTurn && ui.main && G.canAttack(i)) x += ' ready';
        if (ui.sel && ui.sel.uid === i.uid) x += ' sel';
      }
      return mini(BY[i.id], i, x);
    }).join('') : `<span class="empty">${mine ? 'buy cards from the Market' : 'no cards yet'}</span>`;
    $('oppField').innerHTML = field(op, false);
    $('myField').innerHTML = field(me, true);

    $('market').innerHTML = S.market.length ? S.market.map(id => {
      let x = '';
      const key = 'm:' + id;
      if (pickValid) x = pickValid.has(key) ? 'valid' : 'dim';
      else {
        if (myTurn && ui.main && G.canBuy(ME, id)) x += ' ready';
        else x += ' cant';
        if (ui.sel && ui.sel.market === id) x += ' sel';
      }
      return mini(BY[id], null, x, G.price(ME, id));
    }).join('') : '<span class="empty">the Market is empty</span>';

    const pr = $('prompt');
    if (S.over) pr.textContent = '';
    else if (ui.pick) pr.textContent = ui.pick.title;
    else if (myTurn && ui.main) pr.textContent = 'Your turn: buy a card, attack, use effects — then end your turn.';
    else if (S.cur === OPP) pr.textContent = 'Robo is playing…';
    else pr.textContent = '';
    $('cancelBtn').hidden = !(ui.pick && ui.pick.cancel);
    $('endBtn').hidden = !(myTurn && ui.main && !ui.pick);
    renderPreview();
  }

  function selectedInfo() {
    if (!ui.sel) return null;
    if (ui.sel.market) return { c: BY[ui.sel.market], inst: null, market: ui.sel.market };
    const all = S.players[ME].field.concat(S.players[OPP].field);
    const inst = all.find(i => i.uid === ui.sel.uid);
    return inst ? { c: BY[inst.id], inst } : null;
  }

  function renderPreview() {
    const el = $('preview');
    const info = selectedInfo();
    if (!info) { ui.sel = null; el.innerHTML = '<div class="hint">Click a card to read it.<br><br>⚡ = Power (26 wins)<br>🌾 = Grain (the price)<br>Green glow = you can buy it or attack with it.</div>'; return; }
    const { c, inst, market } = info;
    let acts = '', why = '';
    const myTurn = S.cur === ME && !!ui.main && !ui.pick && !S.over;
    if (market) {
      const pr = G.price(ME, market);
      if (myTurn) {
        const ok = G.canBuy(ME, market);
        acts = `<button class="btn btn-gold" data-act="buy" ${ok ? '' : 'disabled'}>Buy (🌾 ${pr})</button>`;
        if (!ok) why = S.players[ME].bought >= E.CFG.BUYS ? 'You already bought a card this turn.' : S.players[ME].grain < pr ? 'Not enough Grain.' : '';
      }
      el.innerHTML = fullCard(c, null, pr) + (acts || why ? `<div class="actions">${acts}${why ? `<span class="why">${esc(why)}</span>` : ''}</div>` : '');
      return;
    }
    if (inst.owner === ME && myTurn) {
      const can = G.canAttack(inst);
      acts = `<button class="btn btn-gold" data-act="attack" ${can ? '' : 'disabled'}>Attack (🌾 ${E.CFG.ATTACK_COST})</button>`;
      if (E.ACT_IDS.includes(inst.id)) {
        const block = G.powerBlock(inst);
        acts += `<button class="btn" data-act="power" ${block ? 'disabled' : ''}>${esc(c.power.name)}</button>`;
        if (block) why = `Effect: ${block}.`;
      }
      if (!can) {
        const r = inst.id === 'napoleon' ? 'Napoleon never fights himself.' : inst.entered === S.turnNo ? 'Just bought: it cannot attack yet.' : inst.attacked ? 'Already attacked.'
          : S.players[ME].attacks >= E.CFG.ATTACKS ? 'One attack per turn.' : S.players[ME].grain < E.CFG.ATTACK_COST ? 'Not enough Grain.' : 'No enemy card can be attacked now.';
        why = (why ? why + ' ' : '') + r;
      }
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
  const keyOf = x => (typeof x === 'string' ? x : x.uid);

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
    mainAction() { return new Promise(res => { ui.main = res; render(); }); },
    pickTarget(pi, title, list) {
      return new Promise(res => {
        ui.pick = { title, valid: new Set(list.map(keyOf)), cancel: true, done: key => res(key === null ? null : list.find(x => keyOf(x) === key)) };
        render();
      });
    },
    pickStat(pi, title, keys) {
      return modal(`<h2>${esc(title)}</h2><div class="statpick">${keys.map(k => `<button data-v="${k}"><span>${STATS.find(s => s[0] === k)[1]}</span></button>`).join('')}</div><div class="row"><button class="btn btn-ghost" data-v="">Cancel</button></div>`);
    },
    duel({ att, target, a, d, win }) {
      const small = x => x.replace('class="card"', 'class="card" style="width:210px"');
      return modal(`<div class="duel">
        ${small(fullCard(BY[att.id], att))}
        <div class="vs">${a} – ${d}<small>Attack vs Defense</small></div>
        ${small(fullCard(BY[target.id], target))}
        <div class="res">${win ? `${esc(BY[target.id].name)} goes back to the Market!` : 'The attack fails.'}</div></div>
        <div class="row"><button class="btn btn-gold" data-v="ok">Continue</button></div>`, 6000);
    },
    end(st) {
      ui.main = null; ui.pick = null; render();
      const won = st.winner === ME;
      modal(`<h2>${st.winner === null ? '🤝 A draw' : won ? '🏆 You take the farm!' : '🐷 Robo takes the farm'}</h2><p>${esc(st.reason)}</p>
        <div class="row"><button class="btn btn-gold" data-v="again">Play again</button><button class="btn" data-v="menu">Menu</button></div>`).then(v => { if (v === 'again') start(); else leave(); });
    },
  };

  // ------------------------------------------------------------ clicks
  function resolveMain(a) { const r = ui.main; if (r) { ui.main = null; ui.sel = null; r(a); } }
  function finishPick(key) { const p = ui.pick; if (!p) return; ui.pick = null; p.done(key); }

  $('board').addEventListener('click', e => {
    const el = e.target.closest('[data-uid],[data-market]');
    if (!el) return;
    const key = el.dataset.market ? 'm:' + el.dataset.market : +el.dataset.uid;
    if (ui.pick && ui.pick.valid.has(key)) { finishPick(key); return; }
    ui.sel = el.dataset.market ? { market: el.dataset.market } : { uid: +el.dataset.uid };
    render();
  });

  $('preview').addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b || !ui.main) return;
    const info = selectedInfo();
    if (!info) return;
    const act = b.dataset.act;
    if (act === 'buy') resolveMain({ type: 'buy', id: info.market });
    else if (act === 'power') resolveMain({ type: 'power', uid: info.inst.uid });
    else if (act === 'attack') {
      const uid = info.inst.uid, targets = G.attackTargets(info.inst);
      ui.pick = { title: `Choose the card ${info.c.name} attacks`, valid: new Set(targets.map(t => t.uid)), cancel: true, done: t => { if (t !== null) resolveMain({ type: 'attack', uid, target: t }); } };
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

  let tok = null;
  // every io call of a game that was left (or restarted) just hangs forever: the old game simply stops
  function wrapIo(t) {
    const o = {};
    Object.keys(io).forEach(k => { o[k] = (...a) => (t.dead ? new Promise(() => {}) : io[k](...a)); });
    return o;
  }
  function start() {
    $('modal').hidden = true;
    $('log').innerHTML = '';
    ui.sel = null; ui.pick = null; ui.main = null;
    if (tok) tok.dead = true;
    tok = { dead: false };
    G = E.create({ human: [true, false], io: wrapIo(tok), names: ['You', 'Robo'] });
    S = G.S;
    show('game');
    G.run();
  }
  function leave() {
    if (tok) tok.dead = true;
    if (G) G.S.over = true;
    G = null; S = null; ui.main = null; ui.pick = null;
    $('modal').hidden = true;
    show('lobby');
  }

  function openGallery() {
    modal(`<h2>All 16 cards</h2><p>⚡ = Power (26 of the 50 wins the farm) · 🌾 = price in Grain. Loyalty and Kindness are paler: only effects use them.</p>
      <div class="gallery">${CARDS.map(c => fullCard(c)).join('')}</div>
      <div class="row"><button class="btn" data-v="x">Close</button></div>`);
  }

  function openRules() {
    const C = E.CFG, total = CARDS.reduce((n, c) => n + c.score, 0);
    modal(`<div class="rules"><h2>Rules</h2>
      <h3>The goal</h3><ul>
        <li>Win the farm! Every card is worth some <b>⚡ Power</b>. The 16 cards are worth ${total} Power in all. <b>Control ${C.TARGET} or more</b> and you win.</li>
        <li>Cards never die: a card that is beaten goes back to the <b>Market</b>, and anybody can buy it.</li></ul>
      <h3>The five stats</h3><ul>
        <li><b>Attack</b> and <b>Defense</b>: used when you attack.</li>
        <li><b>Productivity</b>: the Grain 🌾 a card makes for you every turn (Productivity ÷ 4, rounded up).</li>
        <li><b>Loyalty</b> and <b>Kindness</b> (the paler ones): only effects use them, for example "enemy cards with Loyalty 3 or less cost just 1 Grain".</li></ul>
      <h3>Your turn</h3><ul>
        <li><b>Harvest.</b> You get ${C.BASE_INCOME} Grain from the farm, plus the Grain of your cards. Grain is kept from turn to turn.</li>
        <li><b>Buy.</b> You can buy <b>one</b> card from the Market. The price is on the card (🌾). It is yours at once.</li>
        <li><b>Attack.</b> A card that was on your field at the start of your turn can attack. An attack costs ${C.ATTACK_COST} Grain and you can attack <b>once</b> per turn. Choose an enemy card: if your <b>Attack</b> is at least ${C.MARGIN} more than its <b>Defense</b>, it goes back to the Market. A card the enemy has just bought is safe until their next turn.</li>
        <li><b>Effects.</b> Each card has an effect: some work by themselves, some you use on your turn (once per turn or once per game). They can buy enemy cards, protect yours, make Grain...</li>
        <li><b>End.</b> The Market is filled up to ${C.MARKET} cards.</li></ul>
      <h3>Winning</h3><ul>
        <li>Reach ${C.TARGET} Power. After ${C.MAX_TURNS} turns each, the player with more Power wins.</li></ul>
      <div class="row"><button class="btn btn-gold" data-v="x">Got it</button></div></div>`);
  }

  show('lobby');
})();
