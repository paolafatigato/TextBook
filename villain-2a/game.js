// Villain 2A: the screens. The rules are in engine.js, the villains in villains.js.
//
// Ways to play: villain vs villain on one computer (the two players take turns on the same screen),
// villain vs the computer (easy / normal / hard), or watch the computer fight itself (#demo).
// The points of every power are secret: the pupils only read words ("a strong hit", "the foe loses a turn").
// The teacher's page (#teacher) shows all the numbers and can run a balance simulation.
(() => {
  const E = window.V2A, ROSTER = E.ROSTER, HEROES = E.HEROES;
  const app = document.getElementById('app');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wait = ms => new Promise(r => setTimeout(r, ms));

  const state = {
    mode: '2p',            // '2p' · 'cpu' · 'demo'
    level: 'normal',       // the computer: easy / normal / hard
    picks: [null, null],   // the kits (seat 0 = player 1, seat 1 = player 2 or the computer)
    who: 0,                // who is choosing now
    stage: 'villain',      // 'villain' · 'hero' (in Villain vs Computer the player then chooses the challenge)
    sel: null,             // the villain on show in the choosing screen
    g: null, names: ['', ''], log: [], busy: false, first: 0, token: 0,
  };
  const STARS = ['', '★☆☆ easy to play', '★★☆ some tricks', '★★★ for experts'];
  const LEVEL_NAME = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };

  /* ================= small pieces ================= */

  const pic = (k, cls = '') => `<div class="pic ${cls}" style="--c:${k.color}">${k.img
    ? `<img src="${k.img}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'emo',textContent:'${k.emoji}'}))">`
    : `<span class="emo">${k.emoji}</span>`}</div>`;
  const pips = (m, left = m.uses) => m.uses === Infinity ? '<span class="pips"><i class="inf">always ready</i></span>'
    : `<span class="pips">${Array.from({ length: m.uses }, (_, i) => `<i class="${i < left ? 'on' : ''}"></i>`).join('')}</span>`;
  const isHuman = seat => state.mode === '2p' || (state.mode === 'cpu' && seat === 0);

  // a villain's file: picture, who it is, its quirk and weak spot, all its powers
  function card(k, withPick = false) {
    return `
      <div class="detail">
        ${pic(k, 'big')}
        <div>
          <h3>${esc(k.name)}</h3>
          <div class="chips"><span class="chip">${esc(k.role)}</span><span class="chip">${k.hero ? '🦸 real-life challenge' : STARS[k.skill]}</span></div>
          <p style="margin:0">${esc(k.blurb)}</p>
          <p class="says">“${esc(k.says)}”</p>
          ${k.quirk ? `<div class="note"><b>🧩 Quirk:</b> ${esc(k.quirk)}</div>` : ''}
          ${k.weakText ? `<div class="note weak"><b>💔 Weak spot:</b> ${esc(k.weakText)}</div>` : ''}
        </div>
        <div class="powers">
          ${[...k.moves, k.basic].map((m, i, all) => `
            <div class="pw${i === all.length - 1 ? ' basic' : ''}"><b>${esc(m.name)}</b>${esc(m.story)}<span class="hint">${esc(m.hint)}</span>${pips(m)}</div>`).join('')}
        </div>
      </div>`;
  }

  /* ================= 0. home ================= */

  function home() {
    state.token++; state.g = null;
    app.innerHTML = `
      <div class="box">
        <h1 class="title">VILLAIN 2A<small>the villains of our class · duel!</small></h1>
        <p class="sub">${ROSTER.length} villains made by 2A. Choose one, read its powers and win the duel!</p>
        <div class="modes">
          <button type="button" class="mode" data-act="mode" data-m="2p"><i>🦹 ⚔ 🦹</i><b>Villain vs Villain</b><span>2 players, 1 computer. Each player chooses a villain and you take turns.</span></button>
          <button type="button" class="mode" data-act="mode" data-m="cpu"><i>🦹 ⚔ 🤖</i><b>Villain vs Challenge</b><span>1 player. Your villain fights a hero from real life: the Professor, the Coach, the Stressed Parent…</span></button>
          <button type="button" class="mode" data-act="mode" data-m="demo"><i>🍿</i><b>Watch a duel</b><span>The computer plays both villains. Good for the whole class on the big screen!</span></button>
        </div>
        <div class="levels" role="radiogroup" aria-label="Computer level"><span style="align-self:center;font-weight:800">Computer:</span>
          ${['easy', 'normal', 'hard'].map(l => `<label><input type="radio" name="lv" value="${l}" ${state.level === l ? 'checked' : ''}>${LEVEL_NAME[l]}</label>`).join('')}
        </div>
        <div class="how">
          <h3>How to play</h3>
          <ol>
            <li>Choose a villain. <b>Read all its powers</b>: they come from the villain files of 2A.</li>
            <li>Every power can be used only a <b>few times</b> (the dots). The <b>basic move</b> is always ready, but it is weak.</li>
            <li>The <b>points are secret</b>! The words tell you how strong a power is: <i>a light hit → a solid hit → a strong hit → a very strong hit → a huge hit</i>.</li>
            <li><b>The order matters!</b> Use a power to prepare, then strike. Stop the foe, then hit hard. Make the foe sleepy or angry, then watch what happens. Use a shield <i>before</i> the big attack arrives.</li>
            <li>Every villain has a <b>quirk</b> and often a <b>weak spot</b>. Read the foe’s file and use it!</li>
            <li>The player who goes <b>second</b> gets a few extra HP. At round ${12} the fight becomes <b>sudden death</b>.</li>
          </ol>
          <ul class="legend">
            <li><b>🛡️</b>Shield: hurts less</li><li><b>🪞</b>Mirror: the hit goes back</li><li><b>👻</b>Vanished: the next attack misses</li>
            <li><b>🎯</b>Sharp: the next attack cannot be blocked</li><li><b>⬆️</b>Powered up</li><li><b>🔻</b>Weakened</li>
            <li><b>😵</b>Confused: the next attack hurts the attacker too</li><li><b>💫</b>Loses the next turn</li><li><b>🔒</b>Forgot a power</li>
            <li><b>😡</b>Anger: at 7… boom!</li><li><b>😴</b>Sleepy: at 3 it falls asleep</li><li><b>🥱</b>Tired: at 3 it has to rest</li>
          </ul>
        </div>
      </div>`;
    app.querySelectorAll('input[name=lv]').forEach(r => r.addEventListener('change', () => { state.level = r.value; }));
  }

  /* ================= 1. choose the villains ================= */

  function startMode(m) {
    state.mode = m; state.picks = [null, null]; state.who = 0; state.sel = null; state.stage = 'villain';
    if (m === 'demo') {
      const a = ROSTER[Math.floor(Math.random() * ROSTER.length)];
      const b = ROSTER[Math.floor(Math.random() * ROSTER.length)];
      state.picks = [a, b]; fight(Math.random() < .5 ? 0 : 1); return;
    }
    choose();
  }

  function choose() {
    const two = state.mode === '2p', list = state.stage === 'hero' ? HEROES : ROSTER;
    const title = state.stage === 'hero' ? 'Choose your challenge' : two ? `Player ${state.who + 1}: choose your villain` : 'Choose your villain';
    const sub = state.stage === 'hero' ? `Who will your villain fight? The computer is on ${LEVEL_NAME[state.level]} level.` : two ? (state.who === 0 ? 'Player 2, look away! 🙈 You will choose without seeing this.' : 'Player 1, look away! 🙈') : `Then you will meet a challenge from real life.`;
    app.innerHTML = `
      <div class="box">
        <h2 class="h2">${title}</h2>
        <p class="sub">${sub}</p>
        <div class="roster">
          ${list.map((k, i) => `
            <button type="button" class="vcard${state.sel === i ? ' on' : ''}" data-act="sel" data-i="${i}" style="--c:${k.color}">
              ${pic(k)}<b>${esc(k.name)}</b><span class="role">${esc(k.role)}</span>${k.hero ? '' : `<span class="stars">${'★'.repeat(k.skill)}${'☆'.repeat(3 - k.skill)}</span>`}
            </button>`).join('')}
        </div>
        <div id="detail">${state.sel === null ? '<p class="sub">Click one to read its file.</p>' : card(list[state.sel])}</div>
        <div class="picked nav">
          <button type="button" class="btn" data-act="${state.stage === 'hero' ? 'backvillain' : 'home'}">◀ Back</button>
          <button type="button" class="btn" data-act="random">🎲 Random</button>
          <button type="button" class="btn go" data-act="ok" ${state.sel === null ? 'disabled' : ''}>${state.sel === null ? 'Choose one' : `${state.stage === 'hero' ? 'Fight' : 'I choose'} ${esc(list[state.sel].name)} ▶`}</button>
        </div>
      </div>`;
  }

  function select(i) {
    state.sel = i;
    app.querySelectorAll('.vcard').forEach((c, j) => c.classList.toggle('on', j === i));
    const k = (state.stage === 'hero' ? HEROES : ROSTER)[i];
    document.getElementById('detail').innerHTML = card(k);
    const ok = app.querySelector('[data-act=ok]');
    ok.disabled = false; ok.textContent = `${state.stage === 'hero' ? 'Fight' : 'I choose'} ${k.name} ▶`;
    document.getElementById('detail').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function confirmPick() {
    if (state.sel === null) return;
    if (state.mode === 'cpu') {
      if (state.stage === 'villain') { state.picks[0] = ROSTER[state.sel]; state.stage = 'hero'; state.sel = null; choose(); return; }
      state.picks[1] = HEROES[state.sel]; state.sel = null; state.stage = 'villain';
      fight(Math.random() < .5 ? 0 : 1); return;
    }
    state.picks[state.who] = ROSTER[state.sel];
    state.sel = null;
    if (state.who === 0) {
      state.who = 1;
      app.innerHTML = `
        <div class="box"><div class="pass">
          <div class="bigemo">🔄</div>
          <h2 class="h2">Pass the computer to Player 2!</h2>
          <p>Player 1, your villain is ready. Don’t look at the next screen 🙈</p>
          <button type="button" class="btn go" data-act="pass2">I am Player 2 ▶</button>
        </div></div>`;
      return;
    }
    fight(Math.random() < .5 ? 0 : 1);
  }

  /* ================= 2. the fight ================= */

  function fight(first) {
    state.first = first; state.token++;
    const [a, b] = state.picks;
    state.names = a === b || a.name === b.name ? [a.name, `${b.name} 2`] : [a.name, b.name];
    state.g = E.newGame(a, b, first);
    state.log = []; state.busy = false;
    const second = 1 - first;
    app.innerHTML = `
      <div class="box">
        <div class="arena" id="arena"></div>
        <div class="log" id="log" aria-live="polite"></div>
        <p class="turn-banner" id="banner"></p>
        <div class="attacks" id="attacks"></div>
        <div class="nav">
          <button type="button" class="btn" data-act="quit">${state.mode === 'demo' ? 'Stop' : 'Give up'}</button>
        </div>
      </div>`;
    say(`🪙 <b>${esc(state.names[first])}</b> goes first. ${esc(state.names[second])} starts with ${E.SECOND_BONUS} extra HP.`, 'sys');
    paint();
    next();
  }

  function say(text, cls = '') {
    state.log.push({ text, cls });
    const box = document.getElementById('log');
    if (!box) return;
    box.innerHTML = state.log.slice(-6).map((l, i, all) => `<p class="${l.cls}${i === all.length - 1 ? ' last' : ''}">${l.text}</p>`).join('');
  }

  const ICONS = {
    guard: ['🛡️', 'Shield: the next hit hurts less', 'good'], reflect: ['🪞', 'Mirror: the next hit goes back', 'good'],
    vanish: ['👻', 'Vanished: the next attack misses', 'good'], pierce: ['🎯', 'Sharp: the next attack cannot be blocked', 'good'],
    boost: ['⬆️', 'Powered up: the next attack is stronger', 'good'], weak: ['🔻', 'Weakened: the next attack is weaker', 'bad'],
    confuse: ['😵', 'Confused: the next attack hurts the attacker too', 'bad'], skip: ['💫', 'Loses the next turn', 'bad'],
  };
  function chips(f) {
    const out = [];
    const add = (k, extra = '') => out.push(`<span class="st ${ICONS[k][2]}" title="${ICONS[k][1]}">${ICONS[k][0]}${extra}</span>`);
    if (f.guard) add('guard'); if (f.reflect) add('reflect'); if (f.vanish) add('vanish', f.vanish > 1 ? ' ×2' : ''); if (f.pierce) add('pierce');
    if (f.boost) add('boost'); if (f.weak) add('weak'); if (f.confuse) add('confuse'); if (f.skip > 0) add('skip');
    if (f.seal) out.push(`<span class="st bad" title="Forgot how to use ${esc(f.kit.moves[f.seal.i].name)}">🔒 ${esc(f.kit.moves[f.seal.i].name)}</span>`);
    if (f.marks.rage) out.push(`<span class="st bad" title="Anger: at ${E.RAGE_AT} it explodes!">😡 ${f.marks.rage}/${E.RAGE_AT}</span>`);
    if (f.marks.sleepy) out.push(`<span class="st bad" title="Sleepy: at ${E.SLEEP_AT} it falls asleep">😴 ${f.marks.sleepy}/${E.SLEEP_AT}</span>`);
    if (f.marks.tired) out.push(f.kit.q.tired === 'hungry' ? `<span class="st bad" title="Hungry: at ${E.TIRED_AT} no more powers until a snack">🍽️ ${f.marks.tired}/${E.TIRED_AT}</span>` : `<span class="st bad" title="Tired: at ${E.TIRED_AT} it has to rest">🥱 ${f.marks.tired}/${E.TIRED_AT}</span>`);
    if (f.kit.q.needsGinger) out.push(`<span class="st ${f.flags.ginger ? 'good' : 'bad'}" title="Without Ginger no powers">🐭 ${f.flags.ginger ? 'Ginger is here' : 'Ginger is away'}</span>`);
    if (f.kit.q.needsWarm) out.push(`<span class="st ${f.flags.warm ? 'good' : 'bad'}" title="No powers before the warm-up">🔥 ${f.flags.warm ? 'Warmed up' : 'Cold legs'}</span>`);
    return out.join('') || '&nbsp;';
  }

  function paintSide(seat) {
    const g = state.g, f = g.f[seat], k = f.kit;
    const pct = Math.round(f.hp / f.maxHp * 100);
    return `
      <div class="side s${seat}${g.cur === seat && !g.over ? ' turn' : ''}" data-seat="${seat}">
        <button type="button" class="info" data-act="info" data-seat="${seat}" aria-label="Read the file of ${esc(k.name)}">i</button>
        ${pic(k)}
        <b class="fname">${esc(state.names[seat])}<small>${esc(k.role)}${state.mode === 'cpu' && seat === 1 ? ' · 🤖 computer' : ''}</small></b>
        <div class="hpbar${pct <= 30 ? ' low' : ''}"><span style="width:${pct}%"></span><em>${f.hp} / ${f.maxHp} HP</em></div>
        <div class="status">${chips(f)}</div>
        <div class="kit">${k.moves.map((m, i) => `<span class="${f.left[i] <= 0 ? 'gone' : f.seal && f.seal.i === i ? 'sealed' : ''}" title="${esc(m.story)}">${esc(m.name)}${pips(m, f.left[i])}</span>`).join('')}</div>
      </div>`;
  }
  function paint() {
    const arena = document.getElementById('arena');
    if (!arena) return;
    arena.innerHTML = paintSide(0) + '<div class="vs">VS</div>' + paintSide(1);
    paintPanel();
  }

  function paintPanel() {
    const g = state.g, banner = document.getElementById('banner'), box = document.getElementById('attacks');
    if (!box) return;
    if (g.over) { banner.textContent = ''; box.innerHTML = ''; return; }
    const seat = g.cur, f = g.f[seat];
    banner.className = 'turn-banner s' + seat;
    if (!isHuman(seat)) {
      banner.textContent = `${state.names[seat]} is thinking…`;
      box.innerHTML = '';
      return;
    }
    banner.textContent = state.mode === '2p' ? `${state.names[seat]}: choose an attack!` : 'Your turn: choose an attack!';
    const moves = [...f.kit.moves, f.kit.basic];
    box.innerHTML = moves.map((m, i) => {
      const why = E.blocked(f, i);
      return `<button type="button" class="atk${i === f.kit.moves.length ? ' basic' : ''}" data-act="attack" data-i="${i}" ${why || state.busy ? 'disabled' : ''}>
        <b>${esc(m.name)}</b><span>${esc(m.story)}</span><span class="hint">${esc(m.hint)}</span>${why ? `<span class="why">${esc(why)}</span>` : ''}${pips(m, f.left[i])}
      </button>`;
    }).join('');
  }

  /* ---- what happened, in words and numbers that float ---- */
  function narrate(ev) {
    const g = state.g, N = s => esc(state.names[s]);
    const lines = [], floats = [];
    let line = null;
    const start = (who, text) => { line = { who, parts: [text] }; lines.push(line); };
    const add = t => { if (line) line.parts.push(t); else lines.push({ who: undefined, parts: [t] }); };
    const sys = t => { line = null; lines.push({ who: undefined, parts: [t] }); };
    for (const e of ev) {
      switch (e.t) {
        case 'use': start(e.who, `<b>${N(e.who)}</b> ${e.free ? 'opens a page of the book:' : 'uses'} <b>${esc(e.name)}</b>!`); break;
        case 'dodged': add(`${N(e.who)} has vanished: the attack misses!`); break;
        case 'hit': {
          const actor = 1 - e.who;
          if (e.dmg > 0) { add(`${N(e.who)} loses ${e.dmg} HP${e.hits > 1 ? ` (${e.hits} hits)` : ''}.`); floats.push([e.who, `-${e.dmg}`, 'dmg']); if (e.shielded) add('(most of it was blocked)'); }
          else if (!e.back) add('Everything is blocked!');
          if (e.back) { add(`The attack goes back: ${N(actor)} loses ${e.back} HP.`); floats.push([actor, `-${e.back}`, 'dmg']); }
          if (e.selfHit) { add(`Confused! ${N(actor)} loses ${e.selfHit} HP too.`); floats.push([actor, `-${e.selfHit}`, 'dmg']); }
          if (e.thorns) { add(`Thorns! ${N(actor)} loses ${e.thorns} HP.`); floats.push([actor, `-${e.thorns}`, 'dmg']); }
          break;
        }
        case 'heal': if (e.v > 0) { add(`${N(e.who)} heals ${e.v} HP.`); floats.push([e.who, `+${e.v}`, 'heal']); } break;
        case 'recoil': add(`${N(e.who)} is hurt too: -${e.v}.`); floats.push([e.who, `-${e.v}`, 'dmg']); break;
        case 'status': add({
          guard: `A shield protects ${N(e.who)}.`, reflect: 'A mirror is ready.', vanish: `${N(e.who)} disappears from sight.`, pierce: `The next attack of ${N(e.who)} cannot be blocked.`,
          boost: `The next attack of ${N(e.who)} will be stronger.`, weak: `The next attack of ${N(e.who)} will be weaker.`, confuse: `${N(e.who)} is confused.`,
          skip: `${N(e.who)} will lose a turn.`, selfskip: `${N(e.who)} will lose the next turn.`, dispel: `${N(e.who)} loses all shields and boosts.`, cleanse: `${N(e.who)} feels better.`,
        }[e.s]); break;
        case 'mark': add(e.name === 'rage' ? `${N(e.who)} gets angrier!` : e.name === 'sleepy' ? `${N(e.who)} gets sleepier!` : e.n < 0 ? `${N(e.who)} is ${state.g.f[e.who].kit.q.tired === 'hungry' ? 'less hungry' : 'less tired'}.` : `${N(e.who)} is more tired.`); break;
        case 'asleep': add(`😴 ${N(e.who)} falls asleep!`); break;
        case 'exhausted': add(state.g.f[e.who].kit.q.tired === 'hungry' ? `🍽️ ${N(e.who)} is too hungry to act!` : `🥱 ${N(e.who)} is exhausted and has to rest!`); break;
        case 'explode': add(`💥 ${N(e.who)} explodes with anger! -${e.dmg} HP`); floats.push([e.who, `-${e.dmg}`, 'dmg']); break;
        case 'sealed': add(`${N(e.who)} forgets how to use <b>${esc(e.name)}</b>!`); break;
        case 'immune': add(`${N(e.who)} has a reminder spoon: nothing is forgotten!`); break;
        case 'stole': add(e.got ? `${N(e.who)} grabs the foe’s tricks!` : 'There is nothing to grab.'); break;
        case 'overload': add(`${N(e.who)} grabs too much: the ${e.name === 'rage' ? 'anger' : 'sleepiness'} comes too!`); break;
        case 'flag': add(e.name === 'ginger' ? (e.v ? '🐭 Ginger runs back!' : '🐭 Ginger runs away!') : e.v ? `${N(e.who)} is warmed up!` : ''); break;
        case 'skipped': sys(`${N(e.who)} cannot act this turn!`); break;
        case 'again': sys(`${N(e.who)} acts again!`); break;
        case 'sudden': sys(`⏳ Sudden death! Both villains lose ${e.dmg} HP.`); floats.push([0, `-${e.dmg}`, 'dmg'], [1, `-${e.dmg}`, 'dmg']); break;
      }
    }
    return { lines: lines.map(l => ({ text: l.parts.join(' '), cls: l.who === undefined ? 'sys' : 's' + l.who })), floats };
  }

  const floatUp = (seat, text, cls) => {
    const side = document.querySelector(`.side[data-seat="${seat}"]`);
    if (!side) return;
    const f = document.createElement('span');
    f.className = `float ${cls}`; f.textContent = text;
    side.append(f); setTimeout(() => f.remove(), 1300);
  };

  function doAct(i) {
    const g = state.g, tok = state.token;
    if (!g || g.over || state.token !== tok) return;
    const ev = E.act(g, i);
    const { lines, floats } = narrate(ev);
    lines.forEach(l => say(l.text, l.cls));
    paint();
    floats.forEach(([s, t, c]) => floatUp(s, t, c));
    if (g.over) { state.busy = true; paintPanel(); setTimeout(() => { if (state.token === tok) end(); }, 1600); return; }
    next();
  }

  // whose turn is it: a player chooses (after a moment, so that a double click does not play twice) · the computer thinks
  function next() {
    const g = state.g, tok = state.token;
    if (isHuman(g.cur)) {
      state.busy = true; paintPanel();
      setTimeout(() => { if (state.token === tok) { state.busy = false; paintPanel(); } }, state.mode === '2p' ? 600 : 300);
      return;
    }
    state.busy = true; paintPanel();
    const level = state.mode === 'demo' ? 'normal' : state.level;
    setTimeout(() => { if (state.token === tok && !g.over) doAct(E.pick(g, level)); }, state.mode === 'demo' ? 1700 : 1300);
  }

  /* ================= 3. the end ================= */

  function end() {
    const g = state.g, w = g.winner;
    const text = w === -1 ? 'It’s a draw!' : `${esc(state.names[w])} wins!`;
    const rounds = Math.ceil(g.actions / 2);
    const human = state.mode === 'cpu' ? (w === 0 ? 'Great choices! 🏆' : w === 1 ? 'Think about the order of your powers. Try again!' : '') : '';
    app.innerHTML = `
      <div class="box"><div class="end">
        <div class="bigemo">${w === -1 ? '🤝' : '🏆'}</div>
        <h2 class="h2">${text}</h2>
        ${w >= 0 ? `<div style="display:flex;justify-content:center">${pic(g.f[w].kit, 'big')}</div>` : ''}
        <p>${w === -1 ? 'Both villains fell at the same time.' : `Won after ${rounds} round${rounds === 1 ? '' : 's'}${g.timeout ? ' (more HP at the end)' : ''}.`} ${human}</p>
        <button type="button" class="btn go" data-act="rematch">Fight again ⚔ <small>(the other goes first)</small></button>
        <button type="button" class="btn" data-act="again">New villains</button>
        <button type="button" class="btn" data-act="home">Home</button>
      </div></div>`;
  }

  /* ================= villain file pop-up ================= */

  function showCard(k) {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = `<div class="box"><button type="button" class="close" aria-label="Close">✕</button>${card(k)}</div>`;
    const off = () => { o.remove(); document.removeEventListener('keydown', key); };
    const key = e => { if (e.key === 'Escape') off(); };
    o.addEventListener('click', e => { if (e.target === o || e.target.closest('.close')) off(); });
    document.addEventListener('keydown', key);
    document.body.append(o);
  }

  /* ================= teacher page (#teacher): the numbers and a balance simulation ================= */

  function fxText(fx) {
    const pc = x => Math.round(x * 100) + '%';
    switch (fx.k) {
      case 'dmg': return `danno ${fx.v}${fx.n > 1 ? '×' + fx.n : ''}${fx.pierce ? ' (aggira scudi)' : ''}`;
      case 'heal': return `cura ${fx.v}`;
      case 'recoil': return `contraccolpo ${fx.v}`;
      case 'guard': return `scudo ${pc(fx.p)} per ${fx.hits} col${fx.hits > 1 ? 'pi' : 'po'}`;
      case 'reflect': return `specchio ${pc(fx.p)} per ${fx.hits} colpo`;
      case 'vanish': return 'schivata totale del prossimo attacco';
      case 'pierce': return 'prossimo attacco non bloccabile';
      case 'boost': return `i tuoi prossimi ${fx.hits} attacchi ×${fx.m}`;
      case 'weak': return `i prossimi ${fx.hits} attacchi avversari ×${fx.m}`;
      case 'confuse': return 'avversario confuso (40% del colpo gli torna)';
      case 'skip': return `l’avversario salta ${fx.n} turno`;
      case 'selfSkip': return `salti ${fx.n} turno`;
      case 'haste': return 'agisci di nuovo subito';
      case 'seal': return `blocca l’ultimo potere ${fx.n} turni`;
      case 'dispel': return 'annulla scudi/boost avversari';
      case 'steal': return 'ruba scudi/boost avversari';
      case 'mark': return `${fx.name === 'rage' ? 'rabbia' : fx.name === 'sleepy' ? 'sonno' : 'stanchezza'} ${fx.n > 0 ? '+' : ''}${fx.n}${fx.self ? ' (a sé)' : ''}`;
      case 'cleanse': return 'toglie malus';
      case 'flag': return fx.name === 'ginger' ? 'richiama Ginger' : 'riscaldamento fatto';
      case 'randomPower': return 'usa gratis un altro potere a caso';
      default: return fx.k;
    }
  }

  function teacher() {
    state.token++;
    app.innerHTML = `
      <div class="box teacher">
        <h2 class="h2">Pagina dell’insegnante</h2>
        <p class="sub">Qui si vedono i numeri segreti dei poteri e si può verificare il bilanciamento. Gli alunni vedono solo le parole.</p>
        <button type="button" class="btn" data-act="home">◀ Torna al gioco</button>
        <h2>Come sono stati calcolati i poteri</h2>
        <ul>
          <li>Ogni villain ha <b>3–5 poteri</b> presi dalla sua scheda (poteri, equipaggiamento, attacco principale), una <b>mossa base</b> sempre disponibile (danno ≈ 8) e un <b>tratto</b> (quirk) ricavato dal punto debole che l’alunno ha scritto.</li>
          <li>Ogni potere vale in “punti danno”: un turno d’attacco medio vale circa ${E.fxValue({ k: 'guard', p: 1, hits: 1 })}. Esempi: un colpo da 20 = 20; uno scudo al 50% su 2 colpi = 16; saltare un turno ≈ 19; schivata ≈ 18; guarire X ≈ 0,9X; il danno a se stessi si sottrae.</li>
          <li>Poi ogni kit è stato <b>messo a punto con migliaia di duelli simulati</b> (computer contro computer): ogni villain vince tra il 46% e il 56% dei duelli di livello Normal; chi parte per primo vince il 53%, e per questo chi gioca per secondo parte con ${E.SECOND_BONUS} HP in più.</li>
          <li><b>L’ordine conta</b>: un giocatore che ragiona batte uno che sceglie a caso il 91% delle volte (test fatto con <code>node tools/balance.js</code>). Combinazioni principali: Super Sight → colpo forte; stop-tempo → attacco; sbadigli + coperta (sonno 3); Six Seven! + Music Control (rabbia 7 = esplosione); scudo prima del colpo grosso; Honey Bear che “fa dimenticare” il potere appena usato; Four Hands che ruba scudi e boost.</li>
          <li><b>Le sfide della vita reale</b> (Professor, Coach, Stressed Parent, Little Sibling) sono gli avversari del computer in “Villain vs Challenge”. Sono state bilanciate contro tutti i 15 villain: vincono tra il 45% e il 57% dei duelli (livello Normal) e ognuna ha almeno un villain che la batte facilmente: bisogna sceglierlo con cura.</li>
          <li>Ogni villain è forte contro qualcuno e debole contro qualcun altro (punti deboli: dolce, mente, suono, luce, “aiutanti”). Il livello di difficoltà (★) indica quanto serve pianificare.</li>
        </ul>
        <h2>Simulazione di bilanciamento</h2>
        <p class="legend2">Ogni coppia di villain combatte più volte (l’IA di livello Normal gioca entrambi, alternando chi parte per primo). Dura circa 10 secondi.</p>
        <button type="button" class="btn go" data-act="sim">▶ Avvia la simulazione</button>
        <div class="sim-out" id="sim"></div>
        <h2>Tutti i poteri e i loro numeri</h2>
        <div class="tbl"><table>
          <tr><th>Villain</th><th>Potere</th><th>Usi</th><th>Effetti</th><th>Valore per uso</th><th>Valore totale</th></tr>
          ${[...ROSTER, ...HEROES].map(k => {
            const all = [...k.moves, k.basic];
            return all.map((m, i) => `<tr>${i === 0 ? `<td rowspan="${all.length}"><b>${esc(k.name)}</b><br>${esc(k.role)}<br>${k.hero ? '🦸 sfida' : '★'.repeat(k.skill)}<br><small>Tratto: ${esc(k.quirk || '–')}<br>Punto debole: ${esc(k.weakText || '–')}</small></td>` : ''}
              <td>${esc(m.name)}</td><td class="n">${m.uses === Infinity ? '∞' : m.uses}</td><td>${m.fx.map(fxText).join(' · ')}</td><td class="n">${m.rate}</td><td class="n">${m.uses === Infinity ? '–' : Math.round(m.rate * m.uses)}</td></tr>`).join('')
              + `<tr><td colspan="5" class="n"><b>Totale ${esc(k.name)}</b></td><td class="n"><b>${E.kitRate(k)}</b></td></tr>`;
          }).join('')}
        </table></div>
      </div>`;
  }

  async function simulate() {
    const out = document.getElementById('sim'), btn = app.querySelector('[data-act=sim]');
    btn.disabled = true;
    const n = ROSTER.length, per = 8;
    const wins = ROSTER.map(() => ROSTER.map(() => 0)), games = ROSTER.map(() => ROSTER.map(() => 0));
    let rounds = 0, total = 0, firstWins = 0, done = 0;
    const pairs = n * (n - 1) / 2;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      for (let first = 0; first < 2; first++) for (let k = 0; k < per; k++) {
        const g = E.newGame(ROSTER[i], ROSTER[j], first);
        while (!g.over) E.act(g, E.pick(g, 'normal'));
        games[i][j]++; games[j][i]++;
        if (g.winner === 0) wins[i][j]++; else if (g.winner === 1) wins[j][i]++; else { wins[i][j] += .5; wins[j][i] += .5; }
        if (g.winner === first) firstWins++;
        rounds += Math.ceil(g.actions / 2); total++;
      }
      out.textContent = `Simulazione… ${Math.round(++done / pairs * 100)}%`;
      await wait(0);
    }
    const rate = ROSTER.map((_, i) => { let w = 0, t = 0; for (let j = 0; j < n; j++) if (j !== i) { w += wins[i][j]; t += games[i][j]; } return w / t; });
    const order = ROSTER.map((k, i) => i).sort((a, b) => rate[b] - rate[a]);
    const col = w => { const x = Math.max(0, Math.min(1, w)); return x < .5 ? `rgb(249,${Math.round(109 + 146 * x * 2)},${Math.round(90 + 165 * x * 2)})` : `rgb(${Math.round(255 - 112 * (x - .5) * 2)},${Math.round(255 - 60 * (x - .5) * 2)},${Math.round(255 - 76 * (x - .5) * 2)})`; };
    out.innerHTML = `
      <p><b>${total}</b> duelli · durata media <b>${(rounds / total).toFixed(1)}</b> round · chi parte per primo vince il <b>${Math.round(100 * firstWins / total)}%</b> (il secondo ha già +${E.SECOND_BONUS} HP)</p>
      <div class="tbl"><table>
        ${order.map(i => `<tr><td>${esc(ROSTER[i].name)}</td><td class="n">${Math.round(rate[i] * 100)}%</td><td style="width:50%"><div class="bar" style="width:${rate[i] * 100}%"></div></td></tr>`).join('')}
      </table></div>
      <p class="legend2">Matrice: percentuale di vittorie della riga contro la colonna (rosso = perde, verde = vince).</p>
      <div class="tbl"><table class="heat"><tr><th></th>${order.map(i => `<th class="v">${esc(ROSTER[i].name)}</th>`).join('')}</tr>
        ${order.map(a => `<tr><th>${esc(ROSTER[a].name)}</th>${order.map(b => a === b ? '<td style="background:#ddd">–</td>' : `<td style="background:${col(wins[a][b] / games[a][b])}">${Math.round(100 * wins[a][b] / games[a][b])}</td>`).join('')}</tr>`).join('')}
      </table></div>`;
    btn.disabled = false;
  }

  /* ================= clicks and the address ================= */

  app.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const act = b.dataset.act;
    if (act === 'mode') startMode(b.dataset.m);
    else if (act === 'sel') select(+b.dataset.i);
    else if (act === 'random') { state.sel = Math.floor(Math.random() * (state.stage === 'hero' ? HEROES : ROSTER).length); choose(); }
    else if (act === 'backvillain') { state.stage = 'villain'; state.sel = null; choose(); }
    else if (act === 'ok') confirmPick();
    else if (act === 'pass2') choose();
    else if (act === 'attack') { if (!state.busy && isHuman(state.g.cur)) { state.busy = true; doAct(+b.dataset.i); } }
    else if (act === 'info') showCard(state.g.f[+b.dataset.seat].kit);
    else if (act === 'rematch') fight(1 - state.first);
    else if (act === 'again') { state.mode === 'demo' ? startMode('demo') : startMode(state.mode); }
    else if (act === 'quit') { state.token++; home(); }
    else if (act === 'home') { location.hash = ''; home(); }
    else if (act === 'sim') simulate();
  });

  const route = () => {
    if (location.hash === '#teacher') teacher();
    else if (location.hash === '#demo') startMode('demo');
    else home();
  };
  window.addEventListener('hashchange', route);
  route();
})();
