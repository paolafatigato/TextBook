// Daily routine race ([ps-clil-race]): play on the computer.
// Two ways to move: the online dice (press "Roll", the token walks along the road) or your own real dice
// (roll it, then click the square where your token lands). The squares come from the road drawing itself:
// every segment has data-k (l = Wulf, r = Aemilia, x = special, q = grammar card, go = start / finish).
// The ❓ squares use the fill-in cards of the print-out [print-ps-clil-cards] (read from the page, so they stay in one place).

(() => {
  const spread = document.querySelector('.spread[data-id="ps-clil-race"]');
  if (!spread) return;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);
  const TOKENS = ['🦆', '🤡', '👻', '🐞', '👽', '🤓', '🦑', '🦝', '💃', '🧚', '🦋', '🐥', '🤖', '😸', '🐷', '🐸', '🦊', '🐙', '🦄', '🐴'];
  const DICE = '⚀⚁⚂⚃⚄⚅';
  const PENALTY = 2;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  const svgs = [...spread.querySelectorAll('.lr-road svg')];
  const cells = [...svgs[0].querySelectorAll('.labs g')].map(g => {
    const m = g.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/);
    return { cx: +m[1], cy: +m[2], k: g.dataset.k, t: g.dataset.t };
  });
  const LAST = cells.length - 1;
  const layers = svgs.map(svg => { const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'lr-tokens'); svg.append(g); return g; });

  let players = [];      // { emoji, pos, skip }
  let turn = 0;
  let mode = 'dice';     // 'dice' = the online dice, 'own' = my own dice: click the square
  let busy = false;
  let over = false;

  const say = html => { $('lr-turn').innerHTML = html; };
  const who = () => players[turn];
  const name = () => `${who().emoji} <b>Player ${turn + 1}</b>`;

  /* ---------- tokens on the road ---------- */
  function draw() {
    layers.forEach(l => (l.innerHTML = ''));
    const by = {};
    players.forEach((p, i) => (by[p.pos] ||= []).push(i));
    Object.entries(by).forEach(([pos, list]) => {
      const c = cells[pos];
      const cols = Math.ceil(Math.sqrt(list.length)), rows = Math.ceil(list.length / cols);
      const size = Math.min(6.4, 12 / cols, 12 / rows);
      list.forEach((pi, k) => {
        const x = c.cx + ((k % cols) - (cols - 1) / 2) * size;
        const y = c.cy + (Math.floor(k / cols) - (rows - 1) / 2) * size;
        layers.forEach(l => {
          const disc = document.createElementNS(NS, 'circle');
          disc.setAttribute('cx', x); disc.setAttribute('cy', y); disc.setAttribute('r', size * .56);
          disc.setAttribute('class', 'lr-disc' + (pi === turn && !over ? ' cur' : ''));
          const t = document.createElementNS(NS, 'text');
          t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('font-size', size * .8);
          t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'central');
          t.textContent = players[pi].emoji;
          l.append(disc, t);
        });
      });
    });
  }

  function announce() {
    draw();
    if (over) return;
    $('lr-roll').hidden = mode !== 'dice';
    spread.querySelectorAll('.lr-road').forEach(r => r.classList.toggle('own', mode === 'own'));
    say(mode === 'dice' ? `${name()}: roll the dice!` : `${name()}: roll your dice, then click your square (1–6 steps).`);
  }

  /* ---------- setup ---------- */
  const tokBox = $('lr-tokens');
  TOKENS.forEach(e => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'gm-tok'; b.textContent = e;
    b.addEventListener('click', () => b.classList.toggle('on'));
    tokBox.append(b);
  });
  const setMode = m => {
    mode = m;
    $('lr-mode').textContent = m === 'dice' ? '🎲 Online dice' : '🎯 My own dice';
    spread.querySelectorAll('#lr-setup [data-mode]').forEach(b => b.classList.toggle('alt', b.dataset.mode !== m));
    if (players.length && !over) announce();
  };
  const openSetup = () => { if (!busy) $('lr-setup').hidden = false; };
  $('lr-players').addEventListener('click', openSetup);
  $('lr-cancel').addEventListener('click', () => ($('lr-setup').hidden = true));
  spread.querySelectorAll('#lr-setup [data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('lr-mode').addEventListener('click', () => setMode(mode === 'dice' ? 'own' : 'dice'));
  $('lr-play').addEventListener('click', () => {
    const chosen = [...tokBox.querySelectorAll('.on')].map(b => b.textContent);
    if (!chosen.length) { alert('Choose at least one token.'); return; }
    players = chosen.map(emoji => ({ emoji, pos: 0, skip: false }));
    turn = 0; over = false; busy = false;
    $('lr-setup').hidden = true;
    $('lr-face').textContent = '';
    announce();
  });
  setMode('dice');

  /* ---------- moving ---------- */
  async function walk(p, to) {
    const dir = Math.sign(to - p.pos);
    while (p.pos !== to) { p.pos += dir; draw(); await wait(230); }
  }

  /* ---------- a card / a judge window ---------- */
  const norm = s => s.toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const cards = () => [...document.querySelectorAll('.lr-gcard p')].map(p => [...p.childNodes].map(n => (n.nodeType === 3 ? { t: n.textContent } : { a: n.dataset.answer })));
  let deck = [];
  const nextCard = () => {
    if (!deck.length) { deck = cards(); for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; } }
    return deck.pop();
  };
  // returns a promise: true = right, false = wrong. kind: 'card' (fill in the gap), 'judge' (✓ / ✗ by the partner), 'info' (just Continue)
  function popup({ kind, title, body, wrong = 'Mistake' }) {
    return new Promise(resolve => {
      const ov = $('lr-card'), s = $('lr-gm-s'), fb = $('lr-gm-fb');
      $('lr-gm-who').innerHTML = `${name()} · ${title}`;
      s.innerHTML = '';
      fb.hidden = true; fb.className = 'gm-fb';
      const check = $('lr-gm-check'), ok = $('lr-gm-ok'), no = $('lr-gm-no'), next = $('lr-gm-next');
      check.hidden = kind !== 'card'; ok.hidden = no.hidden = kind !== 'judge'; next.hidden = kind !== 'info';
      no.textContent = '✗ ' + wrong;
      let gaps = [];
      if (kind === 'card') {
        body.forEach(part => {
          if (part.t !== undefined) s.append(document.createTextNode(part.t));
          else { const i = document.createElement('input'); i.className = 'lr-gm-gap'; i.dataset.answer = part.a; i.autocomplete = 'off'; i.setAttribute('aria-label', 'missing word'); s.append(i); gaps.push(i); }
        });
      } else s.innerHTML = body;
      const done = (right, msg) => {
        fb.textContent = msg; fb.className = 'gm-fb ' + (right ? 'ok' : 'no'); fb.hidden = false;
        check.hidden = ok.hidden = no.hidden = true; next.hidden = false;
        next.onclick = () => { ov.hidden = true; resolve(right); };
      };
      check.onclick = () => {
        const right = gaps.every(i => i.dataset.answer.split('|').map(norm).includes(norm(i.value)));
        gaps.forEach(i => { i.disabled = true; i.classList.add(i.dataset.answer.split('|').map(norm).includes(norm(i.value)) ? 'ok' : 'no'); });
        done(right, right ? '✅ Correct!' : '❌ Right answer: ' + gaps.map(i => i.dataset.answer.split('|')[0]).join(' / '));
      };
      ok.onclick = () => done(true, '✅ Correct!');
      no.onclick = () => done(false, '❌ A mistake.');
      next.onclick = () => { ov.hidden = true; resolve(true); };
      ov.hidden = false;
      gaps[0]?.focus();
    });
  }

  /* ---------- what happens on a square ---------- */
  async function landed(p) {
    const c = cells[p.pos];
    if (p.pos === LAST) { over = true; busy = false; draw(); say(`🏆 ${p.emoji} <b>Player ${turn + 1}</b> wins! Press “Players” to play again.`); return true; }
    if (c.k === 'q') {
      const right = await popup({ kind: 'card', title: '❓ grammar card: fill in the missing word', body: nextCard() });
      if (!right) { say(`${p.emoji} Back ${PENALTY} squares!`); await walk(p, Math.max(0, p.pos - PENALTY)); }
    } else if (c.k === 'x' && /Sleepy/.test(c.t)) {
      await popup({ kind: 'info', title: '😴 Sleepy!', body: '<b>Sleepy!</b> You miss your next turn.' });
      p.skip = true;
    } else if (c.k === 'x') {
      const right = await popup({ kind: 'judge', title: '⭐ bonus', body: `<b>${c.t}</b><br>Say a sentence. Your partner decides.`, wrong: 'No bonus' });
      if (right) { await walk(p, Math.min(LAST, p.pos + 2)); if (p.pos === LAST) return landed(p); }
    } else if (c.k === 'l' || c.k === 'r') {
      const he = c.k === 'l';
      const right = await popup({ kind: 'judge', title: he ? 'Wulf' : 'Aemilia', body: `<b>${c.t}</b><br>Say a sentence with <b>${he ? 'he' : 'she'}</b> + the verb (with <b>-s</b>!) and <b>a time</b> or <b>an adverb</b>. Your partner decides.`, wrong: 'Mistake: back 1' });
      if (!right) await walk(p, Math.max(0, p.pos - 1));
    }
    return false;
  }

  async function finishTurn() {
    const ended = await landed(who());
    if (ended) return;
    turn = (turn + 1) % players.length;
    // a sleepy player misses this turn
    while (who().skip) { who().skip = false; say(`${name()} is sleeping… ✋ skipped`); draw(); await wait(1200); turn = (turn + 1) % players.length; }
    busy = false;
    announce();
  }

  /* ---------- the online dice ---------- */
  $('lr-roll').addEventListener('click', async () => {
    if (!players.length || over) { openSetup(); return; }
    if (busy || mode !== 'dice') return;
    busy = true;
    const n = 1 + Math.floor(Math.random() * 6), face = $('lr-face');
    face.textContent = DICE[n - 1] + ' ' + n;
    face.classList.remove('roll'); void face.offsetWidth; face.classList.add('roll');
    const p = who();
    await wait(500);
    const toEnd = Math.min(n, LAST - p.pos);
    await walk(p, p.pos + toEnd);
    if (n > toEnd) await walk(p, p.pos - (n - toEnd)); // too many: bounce back from the finish
    await finishTurn();
  });

  /* ---------- my own dice: click the square ---------- */
  spread.addEventListener('click', async e => {
    const seg = e.target.closest('polyline[data-i]');
    if (!seg || mode !== 'own') return;
    if (!players.length || over) { openSetup(); return; }
    if (busy) return;
    const p = who(), to = +seg.dataset.i, d = Math.abs(to - p.pos);
    if (!d || d > 6) { say(`${name()}: click a square 1–6 steps from your token.`); return; }
    busy = true;
    await walk(p, to);
    await finishTurn();
  });
})();
