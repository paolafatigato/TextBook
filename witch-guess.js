// Witch hunt (CLIL, [wh-who:R]): "Who am I?", a Guess who against the computer, in a pop-up (the same game is played in class with the character
// cards on the forehead). The computer chooses a secret character; the pupil TYPES yes / no questions (the list is in witch-questions.js).
//  1. A question of the list (also with other accepted words) → the computer answers "Yes, you are." / "No, you aren't."
//  2. A question of the list with mistakes (spelling, word order, a missing or an extra word) → the computer shows the mistakes and asks to correct
//     the question BEFORE answering (hint after the 2nd try, the right question after the 3rd).
//  3. Anything else → "I don't know how to answer" + three questions to choose from (the ones that split the remaining characters best).
// A direct guess ("Am I a bishop?") is not a question: the pupil must use the button "I know who I am!".
// Opened by a button with data-wh="guess" and by the pill "Witch hunt" of the Games list on the home page.

(() => {
  const DATA = window.WITCH_DATA, QS = window.WITCH_QUESTIONS;
  if (!DATA || !QS) return;
  const CHARS = DATA.CHARS.filter(c => c.id !== 'lord2' && c.id !== 'farmerM2');   // 20 different cards
  const NAME = { lord1: 'Lord', farmerM1: 'Farmer (m)', farmerF: 'Farmer (f)', merchantM: 'Merchant (m)', merchantF: 'Merchant (f)', innkeeperM: 'Innkeeper (m)', innkeeperF: 'Innkeeper (f)' };
  const label = c => NAME[c.id] || c.name;
  const KCOL = { church: 'plum', nobility: 'mustard', people: 'coral' };
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const store = (k, v) => { try { saved[k] = v; persist(); } catch { /* script.js not ready: skip */ } };
  const recall = k => { try { return saved[k]; } catch { return undefined; } };

  /* ---------- understanding the typed question ---------- */
  const norm = s => s.toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const words = s => norm(s).split(' ').filter(Boolean);
  const FORMS = new Map();       // normalized form → question
  const ALL = [];                // every accepted form: { q, text, tokens }
  QS.forEach(q => [q.q, ...q.forms].forEach(f => { FORMS.set(norm(f), q); ALL.push({ q, text: f, tokens: words(f) }); }));
  // names of the characters: asking "Am I a bishop?" is a guess, not a question
  const NAMES = ['bishop', 'lord', 'squire', 'monk', 'merchant', 'blacksmith', 'craftsman', 'innkeeper', 'farmer', 'beggar', 'noblewoman', 'noble woman', 'maid', 'herbalist', 'healer', 'midwife', 'nun', 'spinner'];
  const isGuess = n => new RegExp(`^(am i|are you) (a |an |the )?(${NAMES.join('|')})( m| f| man| woman)?$`).test(n.replace(/[()]/g, ''));

  const lev = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  };
  const ARTICLES = ['a', 'an', 'the'];
  const wordSim = (a, b) => {
    if (a === b) return 1;
    if (ARTICLES.includes(a) && ARTICLES.includes(b)) return .6;
    if (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a))) return .75;
    return 1 - lev(a, b) / Math.max(a.length, b.length, 1);
  };

  // aligns the typed words with the words of a right question: ops for each step (ok, sub, extra, missing)
  function align(u, f) {
    const n = u.length, m = f.length;
    const d = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++) d[i][0] = i;
    for (let j = 1; j <= m; j++) d[0][j] = j;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (u[i - 1] === f[j - 1] ? 0 : 1 - wordSim(u[i - 1], f[j - 1])));
    const ops = [];
    for (let i = n, j = m; i > 0 || j > 0;) {
      if (i > 0 && j > 0 && Math.abs(d[i][j] - (d[i - 1][j - 1] + (u[i - 1] === f[j - 1] ? 0 : 1 - wordSim(u[i - 1], f[j - 1])))) < 1e-9) {
        ops.unshift(u[i - 1] === f[j - 1] ? { t: 'ok', i: i - 1 } : { t: 'sub', i: i - 1, sim: wordSim(u[i - 1], f[j - 1]), right: f[j - 1] }); i--; j--;
      } else if (i > 0 && Math.abs(d[i][j] - (d[i - 1][j] + 1)) < 1e-9) { ops.unshift({ t: 'extra', i: i - 1 }); i--; }
      else { ops.unshift({ t: 'missing', right: f[j - 1] }); j--; }
    }
    return { cost: d[n][m], ops };
  }
  // the right question that is closest to what was typed, if it is close enough to be "a question with mistakes"
  function nearest(typed) {
    const u = words(typed);
    if (u.length < 2) return null;
    let best = null;
    for (const f of ALL) {
      const seq = align(u, f.tokens);
      const bag = align(u.slice().sort(), f.tokens.slice().sort());
      const order = bag.cost + .3 < seq.cost;
      const r = order ? bag : seq;
      const cost = order ? bag.cost + .3 : seq.cost;
      if (cost > 1.3 || r.ops.some(o => o.t === 'sub' && o.sim < .7 && !(ARTICLES.includes(o.right)))) continue;
      if (!best || cost < best.cost) best = { cost, f, order, ops: order ? null : r.ops };
    }
    return best;
  }
  // "do i" → "D_ i"
  const firstLetters = text => words(text).map(w => w[0] + '_'.repeat(Math.max(0, w.length - 1))).join(' ');
  const ANS = { be: ['Yes, you are.', 'No, you aren’t.'], does: ['Yes, it does.', 'No, it doesn’t.'], can: ['Yes, you can.', 'No, you can’t.'], did: ['Yes, he did.', 'No, he didn’t.'], they: ['Yes, they can.', 'No, they can’t.'], do: ['Yes, you do.', 'No, you don’t.'] };
  const answerText = (q, yes) => ANS[q.aux][yes ? 0 : 1];

  /* ---------- the pop-up ---------- */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="gq-overlay wh-modal" id="whGuessModal" role="dialog" aria-modal="true" aria-labelledby="wqTitle" hidden>
      <div class="gq-box wg-box">
        <div class="gq-top">
          <span class="gq-title" id="wqTitle">Who am I? Guess who!</span>
          <span class="gq-score" id="wqScore"></span>
          <button type="button" class="gq-close" id="wqClose" aria-label="Close">✕</button>
        </div>
        <div class="gq-area wg-area" id="wqArea"></div>
      </div>
    </div>`);
  const modal = $('whGuessModal'), area = $('wqArea');

  let secret = null, asked = new Map(), nQ = 0, nFix = 0, nWrong = 0, pending = null, helper = false, done = false, guessing = null;
  const down = new Set();

  const consistent = () => CHARS.filter(c => [...asked.entries()].every(([qid, yes]) => QS.find(q => q.id === qid).yes.includes(c.id) === yes));
  // three questions that are not asked yet, the ones that cut the remaining characters best
  function suggest() {
    const rest = consistent();
    const free = QS.filter(q => !asked.has(q.id));
    const score = q => { const y = rest.filter(c => q.yes.includes(c.id)).length; return Math.min(y, rest.length - y) + Math.random() * .5; };
    return free.sort((a, b) => score(b) - score(a)).slice(0, 3);
  }

  function say(html, kind = '') { const b = $('wqBubble'); b.className = 'wq-bubble ' + kind; b.innerHTML = html; }
  function logAdd(html) { const ul = $('wqLog'); ul.insertAdjacentHTML('afterbegin', `<li>${html}</li>`); }
  function tiles() {
    $('wqBoard').innerHTML = CHARS.map(c => `<button type="button" class="wq-tile ${down.has(c.id) ? 'down' : ''}" data-id="${c.id}" style="--k:var(--pal-${KCOL[c.cls]})" aria-label="${esc(label(c))}">
      <span class="pp"><img src="img/witch/${c.img}.png" alt="" loading="lazy"></span><b>${esc(label(c))}</b></button>`).join('');
  }
  function score() { $('wqScore').textContent = `Questions: ${nQ}${nWrong ? ` · wrong guesses: ${nWrong}/3` : ''}`; }

  function start() {
    secret = pick(CHARS); asked = new Map(); nQ = 0; nFix = 0; nWrong = 0; pending = null; done = false; guessing = null; down.clear();
    area.innerHTML = `<div class="wq">
      <div class="wq-left"><div class="wq-board" id="wqBoard"></div></div>
      <div class="wq-right">
        <div class="wq-bubble" id="wqBubble"></div>
        <form class="wq-form" id="wqForm" autocomplete="off"><input id="wqInput" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Type your question…" aria-label="Your question"><button type="submit" class="wg-btn">Ask</button></form>
        <div class="wq-tools"><button type="button" class="wg-btn bad" id="wqKnow">☝ I know who I am!</button><label class="wq-help"><input type="checkbox" id="wqHelp"> flip the cards for me</label></div>
        <ul class="wq-log" id="wqLog" aria-live="polite"></ul>
      </div></div>`;
    tiles(); score();
    say('🎙 I have a secret character. <b>Ask me yes / no questions</b> to find out who you are. Type a question, for example: <em>“Am I a man?”</em>');
    $('wqInput').focus();
    $('wqBoard').addEventListener('click', onTile);
    $('wqForm').addEventListener('submit', e => { e.preventDefault(); ask($('wqInput').value); });
    $('wqKnow').addEventListener('click', () => {
      if (done) return;
      guessing = 'choose';
      say('☝ <b>Click the card</b> of the character you think you are.');
      $('wqBoard').classList.add('choosing');
    });
    $('wqHelp').addEventListener('change', e => { helper = e.target.checked; if (helper) autoFlip(); });
  }

  function autoFlip() {
    const keep = new Set(consistent().map(c => c.id));
    CHARS.forEach(c => { if (!keep.has(c.id)) down.add(c.id); });
    tiles();
  }

  function onTile(e) {
    const t = e.target.closest('.wq-tile');
    if (!t || done) return;
    const c = CHARS.find(x => x.id === t.dataset.id);
    if (guessing === 'choose') {
      guessing = null; $('wqBoard').classList.remove('choosing');
      say(`☝ You think you are the <b>${esc(label(c))}</b>. Are you sure?`);
      $('wqBubble').insertAdjacentHTML('beforeend', `<div class="wg-btns"><button type="button" class="wg-btn good" id="wqYes">Yes, I am sure!</button><button type="button" class="wg-btn ghost" id="wqNo">No, wait</button></div>`);
      $('wqYes').addEventListener('click', () => finalGuess(c));
      $('wqNo').addEventListener('click', () => say('OK! Ask another question.'));
      return;
    }
    down.has(c.id) ? down.delete(c.id) : down.add(c.id);
    t.classList.toggle('down');
  }

  function finalGuess(c) {
    if (c.id === secret.id) { end(true); return; }
    nWrong++; down.add(c.id); tiles(); score();
    if (nWrong >= 3) { end(false); return; }
    say(`❌ No, you are <b>not</b> the ${esc(label(c))}. You have ${3 - nWrong} guess${3 - nWrong > 1 ? 'es' : ''} left. Ask more questions!`, 'bad');
  }

  // a question of the list is answered
  function answer(q, typed, fixed, tips = []) {
    const yes = q.yes.includes(secret.id);
    const again = asked.has(q.id);
    asked.set(q.id, yes);
    if (!again) nQ++;
    pending = null;
    logAdd(`<span class="you">${esc(typed)}</span>${fixed ? ` <span class="fix">✎ ${esc(q.q)}</span>` : ''} <b class="${yes ? 'y' : 'n'}">${yes ? 'YES' : 'NO'}</b>`);
    say(`${again ? '📝 You asked this already. ' : ''}<span class="ans ${yes ? 'y' : 'n'}">${answerText(q, yes)}</span>${tips.length ? `<p class="tip">💡 ${tips.join(' ')}</p>` : ''}`, yes ? 'good' : 'no');
    if (helper) autoFlip();
    score();
  }

  function ask(text) {
    if (done) return;
    const typed = text.trim();
    if (!typed) return;
    $('wqInput').value = ''; $('wqInput').focus();
    const n = norm(typed);
    if (isGuess(n)) { say('☝ That is a <b>guess</b>, not a question! Ask about the job, the money, the power… When you know, click <b>“I know who I am!”</b>.', 'no'); return; }
    const exact = FORMS.get(n);
    if (exact) {
      const tips = [];
      if (!/\?\s*$/.test(typed)) tips.push('Remember the question mark (?).');
      if (/(^|\s)i(\s|\?|$)/.test(typed)) tips.push('Write “I” with a capital letter.');
      answer(exact, typed, pending && pending.q === exact, tips);
      return;
    }
    const near = nearest(typed);
    if (near) { correct(typed, near); return; }
    pending = null;
    const sg = suggest();
    say(`🤔 <b>I don’t know how to answer</b> this question. I only know some questions. Choose one of these:` +
      `<div class="wq-sug">${sg.map(q => `<button type="button" class="wq-sg" data-q="${q.id}">${esc(q.q)}</button>`).join('')}</div>`, 'no');
    logAdd(`<span class="you">${esc(typed)}</span> <b class="x">?</b>`);
    $('wqBubble').querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => { const q = QS.find(x => x.id === b.dataset.q); answer(q, q.q, false); }));
  }

  // a question with mistakes: show them and wait for the corrected question
  function correct(typed, near) {
    const q = near.f.q;
    if (pending && pending.q === q) pending.tries++; else { pending = { q, tries: 1 }; nFix++; }
    const toks = typed.replace(/\?/g, ' ').split(/\s+/).filter(Boolean);
    let shown, kinds = [];
    if (near.order) {
      shown = toks.map(w => `<mark>${esc(w)}</mark>`).join(' ');
      kinds.push('the words are not in the right order');
    } else {
      const out = [];
      near.ops.forEach(o => {
        if (o.t === 'ok') out.push(esc(toks[o.i]));
        else if (o.t === 'sub') { out.push(`<mark>${esc(toks[o.i])}</mark>`); kinds.push(o.sim >= .6 ? `“${esc(toks[o.i])}” is not spelled correctly` : `“${esc(toks[o.i])}” is not the right word`); }
        else if (o.t === 'extra') { out.push(`<mark>${esc(toks[o.i])}</mark>`); kinds.push(`“${esc(toks[o.i])}” is not needed`); }
        else { out.push('<mark class="gap">___</mark>'); kinds.push('a word is missing'); }
      });
      shown = out.join(' ');
    }
    const kindText = [...new Set(kinds)].join('; ');
    let help = '<p>Correct your question and ask again.</p>';
    if (pending.tries === 2) help = `<p>Correct your question and ask again.</p><p class="hint">Hint: <b>${esc(firstLetters(near.f.text))}</b></p>`;
    if (pending.tries >= 3) help = `<p>The right question is: <b class="rq">${esc(near.f.text)}</b></p><div class="wg-btns"><button type="button" class="wg-btn" id="wqFixed">Ask this question</button></div>`;
    say(`✏️ <b>Almost!</b> There is a mistake in your question: <span class="shown">${shown}?</span><p class="mute">${kindText.charAt(0).toUpperCase() + kindText.slice(1)}.</p>${help}`, 'fix');
    logAdd(`<span class="you">${esc(typed)}</span> <b class="x">✏️</b>`);
    const b = $('wqFixed');
    if (b) b.addEventListener('click', () => answer(near.f.q, near.f.text, true));
  }

  function end(win) {
    done = true;
    const c = secret;
    const best = +recall('wh-guess-best') || 0;
    const record = win && nQ > 0 && (!best || nQ < best);
    if (record) store('wh-guess-best', nQ);
    $('wqScore').textContent = '';
    area.innerHTML = `<div class="wq-end ${win ? 'win' : 'lose'}">
      <p class="k">${win ? 'YES, THAT IS YOU!' : 'GAME OVER'}</p>
      <h2>${win ? '🏆 You found yourself!' : 'You were…'}</h2>
      <div class="card" style="--k:var(--pal-${KCOL[c.cls]})"><div class="wg-arch"><img src="img/witch/${c.img}.png" alt=""></div>
        <div><h3>${esc(label(c))} <em>${esc(c.it)}</em></h3><p>${esc(c.desc)}</p><p class="mute">${esc(DATA.CLASSES[c.cls].name)}</p></div></div>
      <p class="st">Questions: <b>${nQ}</b> · questions with mistakes: <b>${nFix}</b> · wrong guesses: <b>${nWrong}</b>${record ? ' · <b>new best!</b>' : best ? ` · best: <b>${best}</b>` : ''}</p>
      <div class="wg-btns end"><button type="button" class="wg-btn" id="wqAgain">↻ Play again</button><button type="button" class="wg-btn ghost" id="wqDone">Close</button></div>
    </div>`;
    $('wqAgain').addEventListener('click', start);
    $('wqDone').addEventListener('click', close);
  }

  function open() {
    modal.hidden = false;
    document.documentElement.classList.add('gq-open');
    start();
  }
  function close() {
    modal.hidden = true;
    document.documentElement.classList.remove('gq-open');
  }
  $('wqClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);
  document.querySelectorAll('[data-wh="guess"]').forEach(b => b.addEventListener('click', open));
  window.WITCH_GUESS = { open, close, _test: { nearest, norm, FORMS, suggest } };
})();
