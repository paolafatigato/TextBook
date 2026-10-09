// Conversation Game (pp. 34-35): choose tokens, roll the dice, move on the board,
// answer a card when you land on a "?". Questions are in game-questions.js.

const TOKEN_EMOJI = ['🦆', '🤡', '👻', '🐞', '👽', '🤓', '🦑', '🦝', '💃', '🧜‍♀️', '🧚', '🦋', '🐥', '🤖', '😸', '🐷', '🐸', '🦊', '🐙', '🦄'];
const ANSWER_SECONDS = 6;
const PENALTY = 2;
const DICE_CHARS = '⚀⚁⚂⚃⚄⚅';
const SVGNS = 'http://www.w3.org/2000/svg';

const boards = [...document.querySelectorAll('.art-board > svg')];
const gDice = document.getElementById('diceBtn');
const gFace = document.getElementById('diceFace');
const gTurn = document.getElementById('gameTurn');
const $ = id => document.getElementById(id);

/* ---------- the path, read from the board drawing ---------- */
// Order of the squares as they are drawn in the SVG (start → finish).
const PATH_ORDER = [6, 5, 4, 3, 2, 1, 0, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
  18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
  39, 40, 41, 42, 43];

function readCells(svg) {
  const shapes = [...svg.children].filter(el => el.matches('rect, path'));
  const raw = shapes.map(el => {
    if (el.tagName === 'rect') {
      const [x, y, w, h] = ['x', 'y', 'width', 'height'].map(a => +el.getAttribute(a));
      return { cx: x + w / 2, cy: y + h / 2, w, h, q: el.getAttribute('fill') === '#dfee6a' };
    }
    const t = el.nextElementSibling?.getAttribute('transform')?.match(/rotate\([-\d.]+ ([\d.]+) ([\d.]+)\)/);
    return { cx: +t[1], cy: +t[2], w: 40, h: 40, q: el.getAttribute('fill') === '#dfee6a' };
  });
  return PATH_ORDER.map(i => raw[i]);
}

const cells = boards.length ? readCells(boards[0]) : [];
const LAST = cells.length - 1;

/* ---------- state ---------- */
let players = [];    // { emoji, pos }
let turn = 0;
let busy = false;    // a move or a card is in progress
let over = false;

/* ---------- drawing the tokens ---------- */
const layers = boards.map(svg => {
  const g = document.createElementNS(SVGNS, 'g');
  g.setAttribute('class', 'gm-layer');
  svg.append(g);
  return g;
});

function drawTokens() {
  layers.forEach(l => (l.innerHTML = ''));
  const byCell = {};
  players.forEach((p, i) => (byCell[p.pos] ||= []).push(i));
  Object.entries(byCell).forEach(([pos, list]) => {
    const c = cells[pos];
    const cols = Math.ceil(Math.sqrt(list.length));
    const rows = Math.ceil(list.length / cols);
    const size = Math.min(15, (c.w - 4) / cols, (c.h - 4) / rows) ;
    list.forEach((pi, k) => {
      const x = c.cx + ((k % cols) - (cols - 1) / 2) * size;
      const y = c.cy + (Math.floor(k / cols) - (rows - 1) / 2) * size;
      layers.forEach(l => {
        const t = document.createElementNS(SVGNS, 'text');
        t.setAttribute('x', x);
        t.setAttribute('y', y);
        t.setAttribute('font-size', size * 0.9);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'central');
        t.setAttribute('class', 'gm-token' + (pi === turn && !over ? ' gm-current' : ''));
        t.textContent = players[pi].emoji;
        l.append(t);
      });
    });
  });
}

function say(msg) { gTurn.innerHTML = msg; }
function announceTurn() {
  drawTokens();
  if (over) return;
  say(`${players[turn].emoji} <b>Player ${turn + 1}</b>, roll the dice!`);
}

/* ---------- token choice ---------- */
const tokenBox = $('gmTokens');
TOKEN_EMOJI.forEach(e => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'gm-tok';
  b.textContent = e;
  b.addEventListener('click', () => b.classList.toggle('on'));
  tokenBox.append(b);
});

const openSetup = () => { if (!busy) $('gmSetup').hidden = false; };
$('gameSetupBtn').addEventListener('click', openSetup);
$('gmCancel').addEventListener('click', () => ($('gmSetup').hidden = true));
$('gmPlay').addEventListener('click', () => {
  const chosen = [...tokenBox.querySelectorAll('.on')].map(b => b.textContent);
  if (!chosen.length) { alert('Choose at least one token.'); return; }
  players = chosen.map(emoji => ({ emoji, pos: 0 }));
  turn = 0;
  over = false;
  busy = false;
  $('gmSetup').hidden = true;
  gFace.textContent = '';
  announceTurn();
});

/* ---------- moving ---------- */
const wait = ms => new Promise(r => setTimeout(r, ms));

async function walk(p, steps) {
  const dir = Math.sign(steps);
  for (let i = 0; i < Math.abs(steps); i++) {
    p.pos += dir;
    drawTokens();
    await wait(260);
  }
}

async function takeTurn() {
  if (busy) return;
  if (!players.length) { openSetup(); return; }
  if (over) { openSetup(); return; }
  busy = true;
  const n = 1 + Math.floor(Math.random() * 6);
  gFace.textContent = DICE_CHARS[n - 1] + ' ' + n;
  gFace.classList.remove('roll');
  void gFace.offsetWidth; // restart the animation
  gFace.classList.add('roll');

  const p = players[turn];
  await wait(500);
  // too many: walk to the finish and bounce back
  const toEnd = Math.min(n, LAST - p.pos);
  await walk(p, toEnd);
  if (n > toEnd) await walk(p, -(n - toEnd));

  if (p.pos === LAST) {
    over = true;
    busy = false;
    drawTokens();
    say(`🏆 ${p.emoji} <b>Player ${turn + 1}</b> wins! Press “Players” to play again.`);
    return;
  }
  if (cells[p.pos].q) {
    const right = await askCard(p);
    if (!right) { say(`${p.emoji} Back ${PENALTY} squares!`); await walk(p, -Math.min(PENALTY, p.pos)); }
  }
  turn = (turn + 1) % players.length;
  busy = false;
  announceTurn();
}
gDice.addEventListener('click', takeTurn);

/* ---------- question cards ---------- */
const deck = [];
function nextQuestion() {
  if (!deck.length) {
    deck.push(...GAME_QUESTIONS);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }
  return deck.pop();
}

// Resolves to true (right answer) or false (wrong, or no answer in 6 seconds)
function askCard(p) {
  return new Promise(resolve => {
    const q = nextQuestion();
    const open = typeof q === 'string';
    const overlay = $('gmCard');
    const opts = $('gmOpts');
    const fb = $('gmFb');
    const next = $('gmNext');
    const judge = $('gmJudge');
    let done = false;
    let timer = null;

    $('gmWho').textContent = `${p.emoji} Player ${turn + 1} · the player on your left reads the card`;
    $('gmQ').textContent = open ? q : q.text;
    opts.innerHTML = '';
    fb.hidden = true;
    fb.className = 'gm-fb';
    next.hidden = true;
    judge.hidden = !open;
    const bar = $('gmBar');
    bar.style.transition = 'none';
    bar.style.width = '100%';
    void bar.offsetWidth;
    bar.style.transition = `width ${ANSWER_SECONDS}s linear`;
    bar.style.width = '0%';

    const finish = (right, message) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      bar.style.transition = 'none';
      judge.hidden = true;
      opts.querySelectorAll('button').forEach(b => {
        b.disabled = true;
        if (!open && b.textContent === q.answer) b.classList.add('ok');
      });
      fb.textContent = message;
      fb.className = 'gm-fb ' + (right ? 'ok' : 'no');
      fb.hidden = false;
      next.hidden = false;
      next.onclick = () => { overlay.hidden = true; resolve(right); };
    };

    if (!open) {
      q.options.forEach(o => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'gm-opt';
        b.textContent = o;
        b.addEventListener('click', () => {
          if (o !== q.answer) b.classList.add('no');
          finish(o === q.answer, o === q.answer ? '✅ Correct!' : `❌ The right answer is: ${q.answer}`);
        });
        opts.append(b);
      });
    }
    $('gmRight').onclick = () => finish(true, '✅ Right answer!');
    $('gmWrong').onclick = () => finish(false, '❌ Wrong answer.');
    timer = setTimeout(() => finish(false, "⏰ Time's up!"), ANSWER_SECONDS * 1000);
    overlay.hidden = false;
  });
}
