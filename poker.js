// Grammar Poker: the pop-up game against Robo (menu → 5 deals → summary).
// Words and rules: poker-cards.js · grammar and hands: poker-engine.js · look: poker.css

(() => {
  const D = GP_DATA, E = GPE, S = D.settings, RULES = D.rules;

  const $ = (sel, root = overlay) => root.querySelector(sel);
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const store = {
    get: k => { try { return localStorage.getItem('gp-' + k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem('gp-' + k, v); } catch { /* private window */ } },
  };

  /* ================= sounds ================= */
  let audioCtx = null, sound = store.get('sound') !== '0';
  function beep(freq = 440, dur = 0.12, type = 'sine', vol = 0.12) {
    if (!sound) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch { /* no sound */ }
  }
  const playOk = () => { beep(660, .08); setTimeout(() => beep(880, .12), 70); };
  const playFail = () => beep(200, .25, 'sawtooth', .09);
  const playClever = () => [880, 1320, 1760].forEach((f, i) => setTimeout(() => beep(f, .12, 'triangle', .1), i * 70));
  const playWin = () => [660, 770, 880, 1100].forEach((f, i) => setTimeout(() => beep(f, .15), i * 80));

  /* ================= the pop-up ================= */
  const overlay = document.createElement('div');
  overlay.className = 'gp-overlay' + (store.get('labels') === '0' ? ' gp-nolabels' : '');
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'gpTitle');
  overlay.innerHTML = `
    <div class="gp-box" tabindex="-1">
      <div class="gp-top">
        <button type="button" class="gp-title" id="gpTitle" data-top="home" title="Back to the start"><span class="gp-suits" aria-hidden="true">♠♥♦♣</span> Grammar Poker</button>
        <span class="gp-info" id="gpInfo"></span>
        <button type="button" class="gp-ib" data-top="tip" title="Grammar tip">💡<span> Grammar tip</span></button>
        <button type="button" class="gp-ib" data-top="hands" title="The hands">🃏<span> Hands</span></button>
        <button type="button" class="gp-ib" data-top="labels" title="Show or hide the small labels on the cards">🏷</button>
        <button type="button" class="gp-ib" data-top="sound" title="Sound on / off">🔊</button>
        <button type="button" class="gp-ib gp-x" data-top="close" aria-label="Close">✕</button>
      </div>
      <div class="gp-area" id="gpArea"></div>
    </div>
    <div class="gp-pop" id="gpPop" hidden><div class="gp-pop-box" role="document"></div></div>`;
  document.body.append(overlay);
  const area = $('#gpArea'), pop = $('#gpPop'), box = $('.gp-box');

  /* ================= the game state ================= */
  let G = null;     // the game (null = menu)
  let lastLevel = 1, lastMode = D.modes[0].id;
  let lastMeaning = store.get('meaning') === 'open' ? 'open' : 'check';   // does the meaning count, or only the grammar?
  let hint = '';    // a line in the menu (when the game is opened from a chapter)
  let pollT = null; // asks the room again now and then while we wait (the live updates may not arrive)
  let NS = null;    // the room when we play online (null = against Robo): see "online" below
  const NET = window.POKER_NET;
  let netName = store.get('name') || '';

  const sortHand = h => h.sort((a, b) => Object.keys(D.suits).indexOf(a.suit) - Object.keys(D.suits).indexOf(b.suit) || a.subtype.localeCompare(b.subtype) || a.level - b.level);

  // a new game: the deck is made now (random words in the slots; with the seed of the room when we play online)
  const freshGame = (level, mode, rng, meaning = 'check') => {
    const deck = E.deckFor(level, rng);
    E.setRules({ royalMin: mode.royalMin, pairBy: D.levels[level - 1].pairBy, level, order: mode.order, meaning });
    return {
    level, mode, meaning, deck, words: Object.fromEntries(deck.map(c => [c.word, c])), round: 0, tipN: 0,
    chips: { you: S.chips, bot: S.chips },
    stats: { sentences: [], rules: {}, errors: [], tips: 0, won: 0, lost: 0, tied: 0, folded: 0, best: null },
    };
  };
  function startGame(level) {
    lastLevel = level;
    G = freshGame(level, D.modes.find(m => m.id === lastMode) || D.modes[0], undefined, lastMeaning);
    deal();
  }
  // the host and the guest draw from the two ends of the same pile
  const drawCard = () => (G.net && G.net.me === 0 ? G.pile.shift() : G.pile.pop());

  function deal() {
    G.round++;
    const m = G.mode;
    if (G.net) {
      // online: the cards come from the seed of the room, the chips from the entries of both players
      const d = NET.dealFor(G.deck, G.net.seed, G.round, m, G.net.me);
      G.hand = d.hand; G.table = d.table; G.pile = d.pile; G.bot = [];
      G.step = 0;
      G.entry = { a: [] };
      NET.post(G.net.code, { ['pk.' + NET.key(G.round, G.net.me)]: G.entry }, netFail);
    } else {
      const pile = shuffle(G.deck);
      const ante = Math.min(S.ante, G.chips.you, G.chips.bot);
      G.chips.you -= ante; G.chips.bot -= ante;
      G.pot = ante * 2;
      G.hand = pile.splice(0, m.handSize);
      G.bot = pile.splice(0, m.handSize);
      G.table = pile.splice(0, m.shared);   // Texas: the cards on the table, shown a few at a time
      G.pile = pile;
    }
    if (!m.shared) sortHand(G.hand);
    G.shared = new Set();
    G.shown = 0;
    G.phase = m.swaps ? 'swap' : 'build';
    G.sel = new Set();
    G.line = [];
    G.checked = null;
    G.cleverPaid = false;
    G.rejected = false; G.judged = false; G.oddInfo = null;
    G.fb = null;
    G.result = null;
    G.botSwapped = 0;
    G.lastError = null;
    G.errIndex = -1;
    G.msg = `Deal ${G.round}. Tap up to ${m.swaps} cards you don’t need, then press Swap. Or keep them all.`;
    if (m.shared) { showTable(3); G.msg = `Deal ${G.round}. The flop: 3 cards on the table (gold line) are for both of you. Put the cards you play in the row, then bet.`; }
    render();
  }

  // Texas: turn up cards from the table; they join your hand (and Robo’s)
  function showTable(n) {
    G.table.slice(G.shown, G.shown + n).forEach(c => { G.hand.push(c); G.shared.add(c); });
    G.shown += n;
  }
  const botCards = () => G.bot.concat(G.table.slice(0, G.shown));

  /* ---------- Robo ---------- */
  // Robo finds its best sentence with the chance of the level; sometimes it misses and plays a shorter one
  function botBestHand(cards) {
    const sols = E.solve(cards);
    const poker = E.pokerHand(cards);
    const skill = D.levels[G.level - 1].botSkill;
    let pick = 0;
    while (pick < sols.length - 1 && Math.random() > skill) pick++;
    const sh = sols[pick];
    return sh && E.compare(sh, poker) > 0 ? sh : poker;
  }
  function botSwap() {
    const cur = botBestHand(G.bot);
    const keep = new Set(cur.used);
    const spare = G.bot.filter(c => !keep.has(c)).sort((a, b) => a.level - b.level);
    const out = spare.slice(0, G.mode.swaps);
    out.forEach(c => { G.bot[G.bot.indexOf(c)] = G.pile.pop(); });
    G.botSwapped = out.length;
    G.botBest = botBestHand(G.bot);
  }

  function swapCards() {
    const idx = [...G.sel];
    idx.forEach(i => { G.hand[i] = drawCard(); });
    if (!G.net) botSwap();
    G.sel = new Set();
    G.phase = 'build';
    G.msg = `You swapped ${idx.length}${G.net ? '' : `, Robo swapped ${G.botSwapped}`}. Now tap the cards you want to PLAY, in order: they go in the row. A correct sentence is a strong hand!`;
    render();
  }

  /* ---------- the sentence line ---------- */
  const lineCards = () => G.line.map(i => G.hand[i]);

  function checkLine() {
    const cards = lineCards();
    if (!cards.length) { G.fb = { ok: false, html: 'Tap some cards first!' }; return render(); }
    const p = E.parse(cards);
    const text = E.sentenceText(cards);
    if (p.ok) {
      const sent = E.asSentence(cards, p);
      const sh = E.sentenceHand(sent);
      if (!G.checked || E.compare(sh, E.sentenceHand(G.checked)) > 0) G.checked = sent;
      if (!G.stats.sentences.some(s => s.text === text)) G.stats.sentences.push({ text, rules: p.rules, round: G.round, royal: sh.key === 'royal', len: cards.length, clever: !!p.clever, odd: !!p.odd });
      p.rules.forEach(r => { G.stats.rules[r] = (G.stats.rules[r] || 0) + 1; });
      G.fb = { ok: true, html: `<b>${esc(text)}</b> ${sh.key === 'royal' ? '👑 ROYAL SENTENCE!' : '✅ Correct!'}<div class="gp-badges">${p.rules.map(badge).join('')}</div>${p.clever ? sparkHTML(p.altWords, awardClever()) : ''}${p.odd ? oddHTML(cards, p) : ''}` };
      G.lastError = null;
      p.clever ? playClever() : playOk();
    } else {
      const r = RULES[p.error.rule] || RULES.unexpected;
      const word = cards[p.error.index]?.word;
      const penalty = G.net ? 0 : Math.min(S.wrongTry, G.chips.you);   // online the chips come from the room: no penalty
      G.chips.you -= penalty;
      G.stats.errors.push({ text: text.replace(/\.$/, ''), rule: p.error.rule, round: G.round });
      G.lastError = p.error.rule;
      G.errIndex = p.error.index;
      G.fb = { ok: false, html: `<b>❌ ${esc(text.replace(/\.$/, ''))}</b><p>${explain(p, cards).msg}</p><p class="gp-it">🇮🇹 ${esc(r.it)}</p>${penalty ? `<small>−${penalty} chip</small>` : ''}` };
      playFail();
    }
    render();
  }
  // why a row of cards is not a sentence (used by Check and by the show-down screen)
  function explain(p, cards) {
    const r = RULES[p.error.rule] || RULES.unexpected;
    const word = cards[p.error.index]?.word;
    const msg = p.error.rule === 'unexpected' && word ? `“${esc(word)}” is not in the right place.`
      : p.error.rule === 'meaning' && word ? `“${esc(word)}” doesn’t make sense here. ${esc(r.wrong)}`
      : esc(r.wrong || r.tip);
    return { msg, it: r.it };
  }
  // a sentence that needs the second meaning of a word: a spark and 1 chip (once in a deal)
  function awardClever() {
    if (G.cleverPaid) return false;
    G.cleverPaid = true;
    if (G.net) { G.entry.bonus = 1; NET.post(NS.code, { ['pk.' + NET.key(G.round, NS.me)]: G.entry }, netFail); }
    else G.chips.you += 1;
    return true;
  }
  const sparkHTML = (words, paid) => `<div class="gp-spark"><i class="s1">✨</i><i class="s2">✨</i><i class="s3">✨</i><b>Very clever!</b> ${words.map(w => `“${esc(w.word)}” has a second meaning here: ${esc(w.note)}.`).join(' ')}${paid ? ' <em>+1 chip</em>' : ''}</div>`;
  // grammar only: the sentence is correct but strange
  const oddHTML = (cards, p) => `<div class="gp-odd">🤔 <b>Strange sentence!</b> “${esc(cards[p.oddIndex].word)}” doesn’t make sense here. ${G.net ? 'Talk about it with your friend.' : 'Be ready to explain a situation where it is true: the class decides at the show-down.'}</div>`;
  const badge = id => `<span class="gp-badge">${esc(RULES[id]?.name || id)}</span>`;

  /* ---------- betting ---------- */
  // The cards in the row are the cards you play. In that order they can be a sentence; if they are not,
  // the best poker combination among them counts. Row empty = all your cards, poker only.
  function strength() {
    if (!G.line.length) return E.bestHand(G.hand, null);
    const cards = lineCards();
    const p = E.parse(cards);
    return E.bestHand(cards, p.ok && !G.rejected ? E.asSentence(cards, p) : null);   // rejected = the class did not accept the strange sentence
  }

  // a big bet scares Robo: the weaker its hand, the more
  function botCalls(amt) {
    const p = { high: .3, pair: .55, two: .8, s3: .8, s4: .85, trips: .9 }[G.botBest.key];   // the strong hands always call
    const scare = amt > S.bet ? Math.min(.6, .15 * Math.log2(amt / S.bet)) : -.05;
    return Math.random() < (p === undefined ? 1 : Math.min(1, Math.max(.05, p - scare)));
  }
  // Robo raises: more when its hand is strong
  const botRaiseAmount = () => betAmount(['full', 's6', 'four', 'flush', 'royal'].includes(G.botBest.key) ? S.bets[S.bets.length - 1] : ['trips', 's5'].includes(G.botBest.key) ? S.bet : S.bets[0]);
  function botRaises() {
    return Math.random() < ({ high: .05, pair: .08, two: .2, s3: .2, s4: .3, trips: .4 }[G.botBest.key] ?? .6);
  }
  // the most that can be bet: the chips of the poorer player (that is ALL IN)
  const maxBet = () => Math.max(0, Math.min(G.chips.you, G.chips.bot));
  const betAmount = x => Math.min(maxBet(), Math.max(1, Math.round(x) || S.bet));

  function act(a, amount) {
    if (G.net) return netAct(a === 'bet' ? `bet:${betAmount(amount)}` : a);
    if (a === 'fold') return finishRound('you-fold');
    if (a === 'bet') {
      const amt = betAmount(amount);
      G.chips.you -= amt; G.chips.bot -= amt; G.pot += amt * 2; // Robo’s half goes in if it calls
      if (!botCalls(amt)) { G.chips.bot += amt; G.pot -= amt; return finishRound('bot-fold'); }
      G.msg = `You bet ${amt}. Robo calls!`;
      return afterBet();
    }
    if (a === 'check') {
      const amt = botRaiseAmount();
      if (amt > 0 && botRaises()) {
        G.raise = amt; G.phase = 'call';
        G.msg = `Robo bets ${amt} chips! Do you call or fold?`;
        return render();
      }
      return afterBet();
    }
    if (a === 'call') {
      const amt = G.raise;
      G.chips.you -= amt; G.chips.bot -= amt; G.pot += amt * 2;
      return afterBet();
    }
  }

  // Texas: after the bets of a step the next card of the table is turned up
  function afterBet() {
    if (G.mode.shared && G.shown < G.mode.shared) {
      showTable(1);
      G.phase = 'build';
      G.msg = G.shown === 4 ? 'The turn: a 4th card on the table. Choose your cards, then bet.' : 'The river: the last card! Choose the cards you play, then the final bet.';
      return render();
    }
    finishRound('show');
  }

  function finishRound(how) {
    if (G.mode.shared) G.botBest = botBestHand(botCards());
    if (how === 'show' && !G.net && !G.judged) {   // a strange sentence: the player explains it, the class decides
      const s0 = strength().sentence;
      if (s0 && s0.odd) { G.judgeHow = how; G.phase = 'judge'; G.msg = '🗣 Explain your sentence to the class!'; return render(); }
    }
    const mine = strength();
    const bot = G.botBest;
    let outcome;
    if (how === 'you-fold') outcome = 'lost';
    else if (how === 'bot-fold') outcome = 'won';
    else { const c = E.compare(mine, bot); outcome = c > 0 ? 'won' : c < 0 ? 'lost' : 'tied'; }

    if (outcome === 'won') G.chips.you += G.pot;
    else if (outcome === 'lost') G.chips.bot += G.pot;
    else { G.chips.you += G.pot / 2; G.chips.bot += G.pot / 2; }
    G.chips.you = Math.round(G.chips.you); G.chips.bot = Math.round(G.chips.bot);
    conclude(how, outcome, mine, bot, G.pot);
  }

  // the end of a deal (against Robo or online): the statistics, the mistakes in the row, and the result screen
  function conclude(how, outcome, mine, bot, pot) {
    const sols = E.solve(G.hand);
    const missed = sols[0] && E.compare(sols[0], mine) > 0 ? sols[0] : null;
    const st = G.stats;
    if (how === 'you-fold' || how === 'both-fold') st.folded++;
    st[outcome]++;
    if (!st.best || E.compare(mine, st.best) > 0) st.best = mine;

    let rowFb = null; // the row is not a sentence: say why
    if (G.line.length >= S.minSentence && !mine.sentence) {
      const cards = lineCards(), p = E.parse(cards);
      if (!p.ok) {
        const text = E.sentenceText(cards).replace(/\.$/, '');
        rowFb = { cards, errIndex: p.error.index, text, why: whyNot(cards, mine), ...explain(p, cards) };
        if (!st.errors.some(e => e.text === text && e.round === G.round)) st.errors.push({ text, rule: p.error.rule, round: G.round });
      }
    }
    if (mine.sentence) {
      const text = E.sentenceText(mine.sentence.cards);
      if (!st.sentences.some(x => x.text === text)) {
        st.sentences.push({ text, rules: mine.sentence.rules, round: G.round, royal: mine.key === 'royal', len: mine.len, clever: !!mine.sentence.clever });
        mine.sentence.rules.forEach(r => { st.rules[r] = (st.rules[r] || 0) + 1; });
      }
    }
    // played without pressing Check: the second meaning is rewarded here
    const clever = mine.sentence && mine.sentence.clever ? { words: mine.sentence.altWords, paid: awardClever() } : null;
    const odd = G.oddInfo || (mine.sentence && mine.sentence.odd ? { text: E.sentenceText(mine.sentence.cards), word: mine.sentence.cards[mine.sentence.oddIndex].word, accepted: null } : null);
    G.result = { how, outcome, mine, bot, missed, rowFb, clever, odd, pot };
    G.phase = 'result';
    outcome === 'won' ? playWin() : outcome === 'lost' ? playFail() : playOk();
    render();
  }

  function judge(ok) {
    const s = strength().sentence;
    G.oddInfo = { text: E.sentenceText(s.cards), word: s.cards[s.oddIndex].word, accepted: ok };
    G.judged = true;
    if (!ok) G.rejected = true;
    finishRound(G.judgeHow);
  }
  function judgeHTML() {
    const s = strength().sentence;
    return `<div class="gp-result judge"><h3>🗣 Explain your sentence!</h3>
      <div class="gp-sent">${s.cards.map((c, k) => tile(c, k === s.oddIndex ? 'err' : '')).join('')}</div>
      <p><b>${esc(E.sentenceText(s.cards))}</b></p>
      <p>The grammar is right, but “${esc(s.cards[s.oddIndex].word)}” is strange here. Can you tell the class a situation where it is true?</p>
      <p class="gp-it">🇮🇹 Spiega alla classe una situazione in cui la frase ha senso. La classe decide.</p>
      <div class="gp-actions"><button type="button" class="gp-btn go" data-act="judge-yes">👍 Convincing: it counts</button><button type="button" class="gp-btn bad" data-act="judge-no">👎 Not convincing</button></div></div>`;
  }

  function next() {
    if (G.round >= S.rounds || G.chips.you <= 0 || G.chips.bot <= 0) { G.phase = 'over'; return render(); }
    deal();
  }

  /* ================= online: two devices, one room ================= */
  // The rules of the exchange are in poker-online.js. Here: the screens and what happens when the room changes.
  const foe = () => (G && G.net ? NS.pk['n' + (1 - NS.me)] || 'your friend' : 'Robo');

  // the chips and the pot are not kept here: both devices work them out from the entries of the room
  function syncChips() {
    if (!G || !G.net) return;
    const L = NET.ledger(NS.pk, G.mode, G.words);
    G.chips = { you: L.chips[NS.me], bot: L.chips[1 - NS.me] };
    G.pot = L.rounds[G.round] ? L.rounds[G.round].pot : 0;
    G.ledger = L;
  }

  // my choice of this step (fold / check / bet), sealed: the friend sees it only when both have chosen
  function netAct(a) {
    const e = G.entry;
    e.a.push(a);
    if (a !== 'fold' && G.step >= NET.stepsOf(G.mode) - 1) {   // the last step: show the cards that I play
      e.hand = G.hand.map(c => c.word);
      e.row = G.line.map(i => G.hand[i].word);
    }
    NET.post(NS.code, { ['pk.' + NET.key(G.round, NS.me)]: e }, netFail);
    G.phase = 'wait';
    G.msg = `⏳ Waiting for ${foe()}…`;
    render();
    netSync();
  }

  // something changed in the room: is the friend ready?
  function netSync() {
    if (!G || !G.net || G.phase !== 'wait') return;
    syncChips();
    const R = G.ledger.rounds[G.round];
    if (!R) return;
    if (R.status === 'done') return finishNet(R);
    if (R.steps > G.step) {   // both have chosen: Texas turns up the next card
      G.step = R.steps;
      showTable(1);
      G.phase = 'build';
      G.msg = G.shown === 4 ? 'The turn: a 4th card on the table. Choose your cards, then bet.' : 'The river: the last card! Choose the cards you play, then the final bet.';
      render();
    }
  }

  function finishNet(R) {
    const me = NS.me;
    const how = R.how === 'fold' ? (R.foldBy === me ? 'you-fold' : R.foldBy === null ? 'both-fold' : 'bot-fold') : 'show';
    const outcome = R.winner === 'tie' ? 'tied' : R.winner === me ? 'won' : 'lost';
    let bot = null;
    if (R.hands) {
      bot = R.hands[1 - me];
      G.bot = NS.pk[NET.key(G.round, 1 - me)].hand.map(w => G.words[w]).filter(c => !G.table.includes(c));
    }
    conclude(how, outcome, strength(), bot, R.pot);
  }

  // the room could not be written: say it (it used to stay silent)
  function netFail(e) {
    console.warn('[poker online]', e);
    const t = NET.errorText(e);
    if (G && G.net) G.msg = '⚠️ ' + t; else if (NS) NS.msg = t;
    render();
  }
  // while we wait for the friend, ask the room again every few seconds; if the live updates are stuck, this makes the game go on
  function managePoll() {
    const need = !!(NS && NS.code && (NS.screen === 'lobby' || (G && G.net && G.phase === 'wait')));
    if (need && !pollT) {
      pollT = setInterval(() => {
        if (!NS || !NS.code) return;
        NET.read(NS.code).then(room => { if (room && NS && JSON.stringify(room.pk || {}) !== NS.lastPk) onRoom(room); }).catch(() => {});
      }, 2500);
    } else if (!need && pollT) { clearInterval(pollT); pollT = null; }
  }

  function netDrop() {
    if (!NS) return;
    const s = NS;
    NS = null;
    s.unsub?.();
    if (s.code) NET.leave(s.code, s.me);
  }
  function netMenu(msg = '') {
    netDrop();
    NS = { screen: 'menu', msg, pk: {}, gid: 0, seed: '' };
    G = null;
    render();
  }
  async function netEnter(make) {
    netName = ($('#gpName')?.value || '').trim().slice(0, 18);
    store.set('name', netName);
    const code = make ? '' : ($('#gpCode')?.value || '').toUpperCase().replace(/[^A-Z]/g, '');
    NS.codeInput = code;
    if (!make && code.length !== 4) { NS.msg = 'The code has 4 letters.'; return render(); }
    NS.msg = make ? 'Making the room…' : 'Joining…';
    render();
    try {
      const mine = NS;
      const r = await NET.enter(make, code, netName, lastMode, lastLevel, store.get('labels') !== '0', lastMeaning);
      if (NS !== mine) return;   // the player went back meanwhile
      NS.code = r.code; NS.me = r.me; NS.screen = 'lobby'; NS.msg = '';
      NS.unsub = NET.watch(r.code, onRoom, e => { NS.msg = NET.errorText(e); render(); });
      render();
    } catch (e) { if (NS) { NS.msg = NET.errorText(e); render(); } }
  }
  // every change of the room comes here (also what this device wrote)
  function onRoom(room) {
    if (!NS) return;
    if (!room) { netMenu('This room is gone.'); return; }
    NS.lastPk = JSON.stringify(room.pk || {});
    NS.pk = room.pk || {};
    const pk = NS.pk;
    if (pk.left === 1 - NS.me && !(G && G.phase === 'over')) { NS.screen = 'left'; G = null; render(); return; }
    if (!pk.gid) { NS.screen = 'lobby'; render(); return; }
    if (pk.gid !== NS.gid) {   // a new game
      NS.gid = pk.gid; NS.seed = pk.seed; NS.screen = 'game';
      lastMode = pk.mode; lastLevel = pk.level;
      G = freshGame(pk.level, D.modes.find(m => m.id === pk.mode) || D.modes[0], NET.deckRng(pk.seed), pk.meaning === 'open' ? 'open' : 'check');
      G.net = NS;
      deal();
      return;
    }
    netSync();
  }

  function netScreen() {
    const pk = NS.pk, host = NS.me === 0;
    if (NS.screen === 'left') {
      area.innerHTML = `<div class="gp-net"><h2>👋</h2><p>${esc(foe())} left the game.</p><div class="gp-actions"><button type="button" class="gp-btn" data-act="net-leave">Back to the start</button></div></div>`;
    } else if (NS.screen === 'lobby') {
      const mode = D.modes.find(m => m.id === pk.mode) || D.modes[0], lvl = D.levels.find(l => l.id === pk.level) || D.levels[0];
      const names = [0, 1].map(i => `<li class="${pk['n' + i] ? 'on' : ''}">🧑 <b>${pk['n' + i] ? esc(pk['n' + i]) : '…'}</b>${i === NS.me ? ' <small>(you)</small>' : ''}</li>`).join('');
      area.innerHTML = `<div class="gp-net"><h2>Grammar Poker online</h2>
        <p>Room code: <b class="gp-code">${NS.code}</b></p>
        <ol class="gp-lobby">${names}</ol>
        ${host ? `<h3 class="gp-step">The poker</h3>
          <div class="gp-modes">${D.modes.map(m => `<button type="button" class="gp-mode ${m.id === mode.id ? 'on' : ''}" data-act="net-pmode" data-mode="${m.id}"><b>${esc(m.name)}</b><small>${esc(m.text)}</small></button>`).join('')}</div>
          <h3 class="gp-step">The small labels on the cards</h3>
          <div class="gp-modes"><button type="button" class="gp-mode on" data-act="net-plabels"><b>${pk.labels === false ? 'Hidden' : 'Shown'}</b><small>${pk.labels === false ? 'Harder: nobody sees “plural noun”, “verb BE”… Press to show them.' : 'They help to find pairs and to build sentences. Press to hide them.'}</small></button></div>
          <h3 class="gp-step">Does the meaning count?</h3>
          <div class="gp-modes"><button type="button" class="gp-mode on" data-act="net-pmeaning"><b>${pk.meaning === 'open' ? D.meaning[1].name : D.meaning[0].name}</b><small>${pk.meaning === 'open' ? 'Strange sentences count, and you talk about them. Press to let the game check the meaning.' : 'A sentence that makes no sense does not count. Press to play with only the grammar.'}</small></button></div>
          <h3 class="gp-step">The level</h3>
          <div class="gp-modes">${D.levels.map(l => `<button type="button" class="gp-mode ${l.id === lvl.id ? 'on' : ''}" data-act="net-plevel" data-level="${l.id}"><b>${esc(l.name)}</b><small>${esc(l.title)}</small></button>`).join('')}</div>`
        : `<p>${esc(pk.n0 || 'Your friend')} chose <b>${esc(mode.name)}</b>, <b>${esc(lvl.name)}</b>, labels on the cards <b>${pk.labels === false ? 'hidden' : 'shown'}</b>, meaning <b>${pk.meaning === 'open' ? 'open (only the grammar)' : 'checked by the game'}</b>.</p>`}
        <p class="gp-netmsg">${!pk.n1 ? 'Tell this code to your friend: they choose “Join a room”.' : host ? 'Your friend is here! Press Start when you are ready.' : `Waiting for ${esc(pk.n0 || 'your friend')} to start…`}</p>
        <p class="gp-neterr" aria-live="polite">${esc(NS.msg || '')}</p>
        <div class="gp-actions"><button type="button" class="gp-btn ghost" data-act="net-leave">Leave</button>${host ? `<button type="button" class="gp-btn go" data-act="net-start" ${pk.n1 ? '' : 'disabled'}>🎲 Start!</button>` : ''}</div></div>`;
    } else {
      area.innerHTML = `<div class="gp-net"><h2>👥 Play with a friend</h2>
        <p>Each player uses <b>a different device</b>. You get the <b>same cards</b>. Bets are secret: you both choose fold, check or a bet, then the cards are shown. The higher bet is matched by both. Texas Hold’em shows the table cards together.</p>
        <label class="gp-nm">My name <input id="gpName" type="text" maxlength="18" autocomplete="off" placeholder="e.g. Maya" value="${esc(netName)}"></label>
        <div class="gp-netcols">
          <div class="gp-netbox"><b>🆕 Make a room</b><span>You choose the poker and the level (now: ${esc((D.modes.find(m => m.id === lastMode) || D.modes[0]).name)}, ${esc(D.levels[lastLevel - 1].name)}). You get a 4-letter code.</span><button type="button" class="gp-btn go" data-act="net-make">Make a room</button></div>
          <div class="gp-netbox"><b>🔑 Join a room</b><span>Write the code of your friend.</span><input id="gpCode" type="text" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD" aria-label="Room code" value="${esc(NS.codeInput || '')}"><button type="button" class="gp-btn" data-act="net-join">Join ▶</button></div>
        </div>
        <p class="gp-neterr" aria-live="polite">${esc(NS.msg || '')}</p>
        <div class="gp-actions"><button type="button" class="gp-btn ghost" data-act="net-back">◀ Back</button></div></div>`;
    }
  }

  // the title: back to the start (asks first if a game is going on)
  function askHome() {
    if (!G || G.phase === 'over') { goHome(); return; }
    pop.firstElementChild.innerHTML = `
      <h3>Leave this game?</h3>
      <p class="gp-tip">${G.net ? 'Your friend will be told that you left.' : 'The game will stop and you go back to the start.'}</p>
      <div class="gp-pop-actions"><button type="button" class="gp-btn ghost" data-pop="close">Keep playing</button><button type="button" class="gp-btn bad" data-pop="home">Yes, leave</button></div>`;
    pop.hidden = false;
  }
  function goHome() {
    netDrop();
    G = null;
    pop.hidden = true;
    render();
  }

  /* ================= tips ================= */
  function showTip(forRule) {
    const lvl = G ? G.level : 3;
    let id = forRule;
    if (!id) {
      const pool = Object.keys(RULES).filter(k => !RULES[k].hidden && (!RULES[k].decks || RULES[k].decks.includes(lvl)));
      pool.sort((a, b) => (G?.stats.rules[a] || 0) - (G?.stats.rules[b] || 0) || Math.random() - .5);
      showTip.i = ((showTip.i ?? -1) + 1) % pool.length;
      id = pool[showTip.i];
    }
    const r = RULES[id];
    if (G) G.stats.tips++;
    pop.firstElementChild.innerHTML = `
      <h3>💡 ${esc(r.name)}</h3>
      <p class="gp-tip">${esc(r.tip)}</p>
      <p class="gp-it">🇮🇹 ${esc(r.it)}</p>
      <p class="gp-ex"><span class="ok">✅ ${esc(r.ok)}</span>${r.no ? `<span class="no">❌ ${esc(r.no)}</span>` : ''}</p>
      <div class="gp-pop-actions"><button type="button" class="gp-btn ghost" data-pop="another">Another tip</button><button type="button" class="gp-btn" data-pop="close">OK</button></div>`;
    pop.hidden = false;
  }
  // the hands of the poker that is played (or chosen), from the weakest to the strongest
  const handsOrder = () => (G ? G.mode : D.modes.find(m => m.id === lastMode) || D.modes[0]).order.map(k => D.hands.find(h => h.key === k));
  function showHands() {
    pop.firstElementChild.innerHTML = `
      <h3>🃏 The hands <small>(weak → strong)</small></h3>
      <ol class="gp-hands">${handsOrder().map(h => `<li class="${h.sentence ? 'sent' : ''}"><b>${esc(h.name)}</b><span>${esc(h.how)}</span>${h.example ? `<em>${esc(h.example)}</em>` : ''}</li>`).join('')}</ol>
      <p class="gp-it">${esc(D.tieBreak)}</p>
      <p class="gp-it">●●● on the cards = how difficult the word is.</p>
      <div class="gp-suitkey">${Object.values(D.suits).map(s => `<span><i>${s.symbol}</i> ${s.name}</span>`).join('')}</div>
      <div class="gp-pop-actions"><button type="button" class="gp-btn" data-pop="close">OK</button></div>`;
    pop.hidden = false;
  }

  /* ================= drawing the screens ================= */
  const label = c => {
    const l = D.subtypes[c.suit][c.subtype];
    if (c.suit !== 'verb') return l;
    // the caption shows what makes the pair in this deck: the person (present deck) or the kind of verb, with the tense
    if (G && D.levels[G.level - 1].pairBy.verb === 'person') return `${l} · ${c.person === '3rd' ? '3rd person' : 'other persons'}`;
    return c.tense === 'past' ? `${l} · past` : l;
  };
  function cardHTML(c, attrs = '', cls = '') {
    const s = D.suits[c.suit];
    return `<button type="button" class="gp-card ${cls}" style="--c:${s.color}" ${attrs} aria-label="${esc(c.word)}, ${esc(label(c))}">
      <i class="gp-glyph">${s.symbol}</i><em class="gp-dots" title="difficulty ${c.level} of 3">${'●'.repeat(c.level)}${'○'.repeat(3 - c.level)}</em><b>${esc(c.word)}</b><small>${esc(label(c))}</small><i class="gp-glyph br">${s.symbol}</i></button>`;
  }
  const backHTML = n => Array.from({ length: n }, () => '<span class="gp-card back" aria-hidden="true"></span>').join('');
  const tile = (c, cls = '') => `<span class="gp-tile ${cls}" style="--c:${D.suits[c.suit].color}"><i>${D.suits[c.suit].symbol}</i>${esc(c.word)}</span>`;
  const handName = h => (h.key === 's6' || h.key === 'royal' ? `${h.name} (${h.len} cards)` : h.name);

  // online the captions are the choice of the room (the same for both players); the 🏷 button is only for playing alone
  const inRoom = () => !!(NS && NS.code);
  function applyLabels() {
    const off = inRoom() && NS.pk.labels !== undefined ? NS.pk.labels === false : store.get('labels') === '0';
    overlay.classList.toggle('gp-nolabels', off);
    const btn = $('[data-top="labels"]');
    btn.disabled = inRoom();
    btn.title = inRoom() ? 'In an online game the host chooses this' : 'Show or hide the small labels on the cards';
  }

  // the name of the type of a card: what makes a pair in this deck (so “we” and “you” are the same type, “in” is not)
  const typeName = c => {
    const by = D.levels[G.level - 1].pairBy[c.suit] || 'subtype';
    if (c.suit === 'noun' && by === 'number') return c.number === 'plural' ? 'plural noun' : 'singular noun';
    if (c.suit === 'verb' && by === 'person') return c.person === '3rd' ? 'verb in the 3rd person' : 'verb, not 3rd person';
    return D.subtypes[c.suit][c.subtype];
  };
  // “It was played as a Pair”: and why it is not more
  function whyNot(cards, mine) {
    const rest = cards.filter(c => !mine.used.includes(c));
    if (mine.key === 'high') return 'No two cards are the same type, so only the card with the most dots ●●● counts.';
    if (mine.key !== 'pair' || !rest.length) return '';
    const [a, b] = mine.used, o = rest.find(c => c.suit === a.suit) || rest[0];
    return `“${a.word}” and “${b.word}” are the same type (${typeName(a)}). “${o.word}” is a different type (${typeName(o)}), so it is not three of a kind.`;
  }

  function render() { draw(); managePoll(); }
  function draw() {
    applyLabels();
    syncChips();
    $('#gpInfo').textContent = G && G.phase !== 'over' ? `Deal ${G.round}/${S.rounds}${G.net ? ' · online' : ''}` : '';
    $('[data-top="sound"]').textContent = sound ? '🔊' : '🔇';
    if (!G) return NS ? netScreen() : menu();
    if (G.phase === 'over') return summary();
    table();
  }

  function menu() {
    area.innerHTML = `
      <div class="gp-menu">
        <h2>Beat Robo with words!</h2>
        ${hint ? `<p class="gp-hint">${esc(hint)}</p>` : ''}
        <p>You and Robo get word cards. Make the best <b>hand</b>: pairs of the same type, or a <b>correct sentence</b>. The best hand wins the chips in the pot.</p>
        <h3 class="gp-step">1 · Choose the poker</h3>
        <div class="gp-modes">${D.modes.map(m => `<button type="button" class="gp-mode ${m.id === lastMode ? 'on' : ''}" data-act="mode" data-mode="${m.id}"><b>${esc(m.name)}</b><small>${esc(m.text)}</small></button>`).join('')}</div>
        <h3 class="gp-step">2 · Does the meaning count?</h3>
        <div class="gp-modes">${D.meaning.map(m => `<button type="button" class="gp-mode ${m.id === lastMeaning ? 'on' : ''}" data-act="meaning" data-m="${m.id}"><b>${esc(m.name)}</b><small>${esc(m.text)}</small></button>`).join('')}</div>
        <h3 class="gp-step">3 · Choose the level</h3>
        <div class="gp-levels">${D.levels.map(l => `
          <button type="button" class="gp-level l${l.id}${l.id === lastLevel ? ' ready' : ''}" data-act="start" data-level="${l.id}">
            <b>${esc(l.name)}</b><span>${esc(l.title)}</span><small>${esc(l.text)}</small><em>52 cards, new words every game</em>
          </button>`).join('')}</div>
        <h3 class="gp-step">or</h3>
        <button type="button" class="gp-btn" data-act="net">👥 Play online with a friend (a code)</button>
        <div class="gp-suitkey">${Object.values(D.suits).map(s => `<span style="--c:${s.color}"><i>${s.symbol}</i> ${s.name}</span>`).join('')}</div>
        <ol class="gp-how">
          <li><b>Swap</b> cards (in Texas Hold’em the table cards come one by one instead).</li>
          <li><b>Play</b> the cards you want: tap them in order and they go in the row. A correct sentence is a strong hand! <b>Check ✓</b> tells you if it is one.</li>
          <li><b>Bet</b>, check or fold… then show your hand!</li>
        </ol>
        <button type="button" class="gp-btn ghost" data-act="hands">🃏 See all the hands</button>
      </div>`;
  }

  function table() {
    const mine = strength();
    const cards = G.hand.map((c, i) => {
      const inLine = G.line.includes(i);
      const cls = [G.shared.has(c) ? 'shared' : '', G.sel.has(i) ? 'sel' : '', inLine ? 'used' : '', G.phase === 'bet' && mine.used.includes(c) ? 'glow' : ''].join(' ');
      return cardHTML(c, `data-act="card" data-i="${i}"${G.phase === 'swap' || G.phase === 'build' ? '' : ' disabled'}`, cls);
    }).join('');

    const lineHTML = G.line.length
      ? G.line.map((i, k) => `<button type="button" class="gp-tile ${G.errIndex === k && G.fb && !G.fb.ok ? 'err' : ''}" style="--c:${D.suits[G.hand[i].suit].color}" data-act="unline" data-i="${i}" aria-label="Remove ${esc(G.hand[i].word)}"><i>${D.suits[G.hand[i].suit].symbol}</i>${esc(G.hand[i].word)}</button>`).join('')
      : '<span class="gp-placeholder">The cards you play – tap them below, in order</span>';

    const you = G.chips.you, bot = G.chips.bot;
    let buttons = '';
    if (G.phase === 'swap') {
      buttons = `<button type="button" class="gp-btn" data-act="swap" ${G.sel.size ? '' : 'disabled'}>🔄 Swap ${G.sel.size ? G.sel.size : ''} selected</button>
                 <button type="button" class="gp-btn ghost" data-act="keep">Keep all</button>`;
    } else if (G.phase === 'build') {
      buttons = `<button type="button" class="gp-btn" data-act="check">Check ✓</button>
                 <button type="button" class="gp-btn ghost" data-act="clear">Clear</button>
                 <button type="button" class="gp-btn go" data-act="tobet">Ready → bet</button>`;
    } else if (G.phase === 'bet') {
      const max = maxBet();
      const opts = max > 0 ? [...new Set([...S.bets.filter(x => x < max), max])] : [];
      buttons = `<button type="button" class="gp-btn bad" data-act="fold">Fold</button>
                 <button type="button" class="gp-btn ghost" data-act="check-bet">Check</button>
                 ${opts.map(x => `<button type="button" class="gp-btn go" data-act="bet" data-amt="${x}">${x === max ? 'All in' : 'Bet'} ${x}</button>`).join('')}`;
    } else if (G.phase === 'call') {
      buttons = `<button type="button" class="gp-btn bad" data-act="fold">Fold</button>
                 <button type="button" class="gp-btn go" data-act="call">Call ${G.raise}</button>`;
    }

    const showBanner = G.phase === 'build' || G.phase === 'bet' || G.phase === 'call';
    area.innerHTML = `
      <div class="gp-table">
        <div class="gp-chips"><span>🧑 You <b>${you}</b></span><span class="pot">🪙 Pot <b>${G.pot}</b></span><span>${G.net ? '🧑' : '🤖'} ${esc(foe())} <b>${bot}</b></span></div>
        <div class="gp-robo" aria-label="${esc(foe())}’s cards">${G.phase === 'result' ? botReveal() : backHTML(G.mode.handSize)}</div>
        <p class="gp-coach" role="status">${esc(G.msg)}</p>
        ${G.phase === 'result' ? resultHTML() : G.phase === 'judge' ? judgeHTML() : `
          <div class="gp-line ${G.line.length ? '' : 'empty'}">${lineHTML}</div>
          ${G.fb ? `<div class="gp-fb ${G.fb.ok ? 'ok' : 'no'}" role="status">${G.fb.html}</div>` : ''}
          <div class="gp-handbar"><span>Your cards – drag to reorder${G.mode.shared ? ' · gold line = on the table' : ''}</span><button type="button" class="gp-ib" data-act="sort" ${G.phase === 'swap' || G.phase === 'build' ? '' : 'disabled'}>↔ Sort</button></div>
          <div class="gp-hand">${cards}</div>
          ${showBanner ? `<p class="gp-banner">${G.line.length ? 'Your played hand' : 'Nothing in the row: your best combination'}: <b>${esc(handName(mine))}</b></p>` : ''}
          <div class="gp-actions">${buttons}</div>`}
      </div>`;
  }

  function botReveal() {
    const b = G.result.bot;
    if (!b) return backHTML(G.mode.handSize);   // nobody showed the cards (a fold)
    const used = new Set(b.used);
    return G.bot.map(c => cardHTML(c, 'disabled', used.has(c) ? 'glow' : '')).join('');
  }

  function resultHTML() {
    const r = G.result;
    const head = { won: '🎉 You win!', lost: `😬 ${foe()} wins`, tied: '🤝 Tie – we share the pot' }[r.outcome];
    let body = '';
    if (r.how === 'bot-fold') body = `<p>${esc(foe())} folds. You win <b>${r.pot}</b> chips.</p>`;
    else if (r.how === 'you-fold') body = `<p>You folded. ${esc(foe())} takes <b>${r.pot}</b> chips.</p>`;
    else if (r.how === 'both-fold') body = '<p>You both folded: the pot is shared.</p>';
    else body = `<p>Pot: <b>${r.pot}</b> chips.</p>`;
    const sentenceOf = h => h.sentence ? `<div class="gp-sent">${h.sentence.cards.map(c => tile(c)).join('')}</div>` : '';
    const rows = r.how === 'show' ? `
      <div class="gp-vs">
        <div class="${r.outcome === 'won' ? 'win' : ''}"><small>You</small><b>${esc(handName(r.mine))}</b>${sentenceOf(r.mine)}</div>
        <div class="${r.outcome === 'lost' ? 'win' : ''}"><small>${esc(foe())}</small><b>${esc(handName(r.bot))}</b>${sentenceOf(r.bot)}</div>
      </div>` : '';
    const row = r.rowFb ? `<div class="gp-rowfb"><b>Your row was not a sentence:</b><div class="gp-sent">${r.rowFb.cards.map((c, k) => tile(c, k === r.rowFb.errIndex ? 'err' : '')).join('')}</div><p>❌ ${r.rowFb.msg}</p><p class="gp-it">🇮🇹 ${esc(r.rowFb.it)}</p><small>It was played as: ${esc(handName(r.mine))}.</small>${r.rowFb.why ? `<p class="gp-why">${esc(r.rowFb.why)}</p>` : ''}</div>` : '';
    const missed = r.missed ? `<p class="gp-missed">💡 You had a ${r.missed.key === 'royal' ? 'ROYAL SENTENCE' : 'sentence'} hidden in your cards:<span class="gp-sent">${r.missed.used.map(c => tile(c)).join('')}</span></p>` : '';
    const oddNote = !r.odd ? '' : r.odd.accepted === true ? `<p class="gp-odd">👍 The class accepted “${esc(r.odd.text)}”</p>` : r.odd.accepted === false ? `<p class="gp-odd bad">👎 The class did not accept “${esc(r.odd.text)}”: your hand was played as ${esc(handName(r.mine))}.</p>` : `<p class="gp-odd">🤔 Strange sentence: “${esc(r.odd.word)}” does not make sense here.</p>`;
    const spark = r.clever && r.clever.paid ? sparkHTML(r.clever.words, true) : '';
    const last = G.round >= S.rounds || G.chips.you <= 0 || G.chips.bot <= 0;
    return `<div class="gp-result ${r.outcome}"><h3>${head}</h3>${body}${rows}${spark}${oddNote}${row}${missed}
      <div class="gp-actions"><button type="button" class="gp-btn go" data-act="next">${last ? 'See the summary →' : 'Next deal →'}</button></div></div>`;
  }

  function summary() {
    const st = G.stats, you = G.chips.you, bot = G.chips.bot;
    const verdict = you > bot ? `🏆 You beat ${foe()}!` : you < bot ? `${G.net ? '🏅' : '🤖'} ${foe()} wins this time` : '🤝 A tie!';
    const used = Object.entries(st.rules).sort((a, b) => b[1] - a[1]);
    const errCount = {};
    st.errors.forEach(e => { errCount[e.rule] = (errCount[e.rule] || 0) + 1; });
    const errRules = Object.entries(errCount).sort((a, b) => b[1] - a[1]);
    area.innerHTML = `
      <div class="gp-summary">
        <h2>${verdict}</h2>
        <div class="gp-score"><span>🧑 You <b>${you}</b></span><span>${G.net ? '🧑' : '🤖'} ${esc(foe())} <b>${bot}</b></span></div>
        <p class="gp-sub">${st.won} won · ${st.lost} lost · ${st.tied} tied · ${st.folded} folded · best hand: <b>${st.best ? esc(handName(st.best)) : '–'}</b> · tips used: ${st.tips}</p>

        <section><h3>📝 Sentences you made <small>${st.sentences.length}</small></h3>
          ${st.sentences.length ? `<ul class="gp-list">${st.sentences.map(s => `<li><b>${esc(s.text)}</b> ${s.royal ? '👑' : ''}${s.clever ? ' ✨' : ''}${s.odd ? ' 🤔' : ''}<span class="gp-badges">${s.rules.map(badge).join('')}</span></li>`).join('')}</ul>` : '<p class="gp-none">No sentences this time. Next time, try “I + am + happy”!</p>'}
        </section>
        <section><h3>📚 Rules you used <small>${used.length}</small></h3>
          ${used.length ? `<ul class="gp-list">${used.map(([id, n]) => `<li><b>${esc(RULES[id]?.name || id)}</b> <span class="gp-n">×${n}</span><span class="gp-rule">${esc(RULES[id]?.tip || '')}</span></li>`).join('')}</ul>` : '<p class="gp-none">–</p>'}
        </section>
        <section><h3>⚠️ Mistakes <small>${st.errors.length}</small></h3>
          ${st.errors.length ? `<ul class="gp-list">${st.errors.map(e => `<li><b>❌ ${esc(e.text)}</b><span class="gp-rule">${esc(RULES[e.rule]?.wrong || RULES[e.rule]?.tip || '')}</span></li>`).join('')}</ul>
            <h4>Rules to practice</h4><ul class="gp-list">${errRules.map(([id, n]) => `<li><b>${esc(RULES[id]?.name || id)}</b> <span class="gp-n">×${n}</span><span class="gp-rule">${esc(RULES[id]?.it || '')}</span><span class="gp-ex"><span class="ok">✅ ${esc(RULES[id]?.ok || '')}</span></span></li>`).join('')}</ul>` : '<p class="gp-none">No mistakes. Perfect! 🌟</p>'}
        </section>
        ${G.net ? `<div class="gp-actions">${NS.me === 0 ? '<button type="button" class="gp-btn go" data-act="net-again">▶ Play again</button>' : `<span class="gp-netmsg">${esc(foe())} can start a new game.</span>`}<button type="button" class="gp-btn ghost" data-act="net-leave">Leave</button></div>` : '<div class="gp-actions"><button type="button" class="gp-btn go" data-act="again">▶ Play again</button><button type="button" class="gp-btn ghost" data-act="menu">Change level</button></div>'}
      </div>`;
  }

  /* ================= reordering the hand ================= */
  // the sentence line and the swap marks follow the cards to their new places
  function reorder(arr) {
    const at = G.hand.map(c => arr.indexOf(c));
    G.line = G.line.map(i => at[i]);
    G.sel = new Set([...G.sel].map(i => at[i]));
    G.hand = arr;
  }
  function moveCard(from, to) {
    const arr = G.hand.slice();
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    reorder(arr);
  }
  let drag = null, justDragged = false;
  area.addEventListener('pointerdown', e => {
    const el = e.target.closest('.gp-hand .gp-card');
    if (!el || !G || (G.phase !== 'swap' && G.phase !== 'build') || e.button > 0) return;
    drag = { el, i: +el.dataset.i, to: +el.dataset.i, x: e.clientX, y: e.clientY, moved: false };
  });
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 10) return;
      drag.moved = true;
      drag.el.classList.add('drag');
    }
    drag.el.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
    let near = null, best = Infinity;
    area.querySelectorAll('.gp-hand .gp-card').forEach(c => {
      if (c === drag.el) return;
      c.classList.remove('drop');
      const r = c.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      if (d < best) { best = d; near = c; }
    });
    if (near) { near.classList.add('drop'); drag.to = +near.dataset.i; } else drag.to = drag.i;
  });
  const endDrag = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moved) return;
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 80);
    if (d.to !== d.i) moveCard(d.i, d.to);
    render();
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  /* ================= clicks ================= */
  area.addEventListener('click', e => {
    if (justDragged) return;
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const i = +b.dataset.i;
    switch (b.dataset.act) {
      case 'start': startGame(+b.dataset.level); return;
      case 'hands': showHands(); return;
      case 'menu': G = null; render(); return;
      case 'net': netMenu(); return;
      case 'net-back': netDrop(); G = null; render(); return;
      case 'net-leave': netMenu(); return;
      case 'net-make': netEnter(true); return;
      case 'net-join': netEnter(false); return;
      case 'net-start': case 'net-again': NET.newGame(NS.code, NS.pk, netFail); return;
      case 'net-pmode': NET.post(NS.code, { 'pk.mode': b.dataset.mode }, netFail); return;
      case 'net-plabels': NET.post(NS.code, { 'pk.labels': NS.pk.labels === false }, netFail); return;
      case 'net-plevel': NET.post(NS.code, { 'pk.level': +b.dataset.level }, netFail); return;
      case 'again': startGame(lastLevel); return;
      case 'card':
        if (G.phase === 'swap') {
          if (G.sel.has(i)) G.sel.delete(i); else if (G.sel.size < G.mode.swaps) G.sel.add(i);
        } else if (G.phase === 'build' && !G.line.includes(i)) { G.line.push(i); G.fb = null; G.errIndex = -1; }
        break;
      case 'unline': G.line = G.line.filter(x => x !== i); G.fb = null; G.errIndex = -1; break;
      case 'sort': reorder(sortHand(G.hand.slice())); break;
      case 'swap': return swapCards();
      case 'mode': lastMode = b.dataset.mode; break;
      case 'meaning': lastMeaning = b.dataset.m; store.set('meaning', lastMeaning); break;
      case 'judge-yes': case 'judge-no': return judge(b.dataset.act === 'judge-yes');
      case 'net-pmeaning': NET.post(NS.code, { 'pk.meaning': NS.pk.meaning === 'open' ? 'check' : 'open' }, netFail); return;
      case 'keep': G.sel = new Set(); return swapCards();
      case 'check': return checkLine();
      case 'clear': G.line = []; G.fb = null; G.errIndex = -1; break;
      case 'tobet':
        G.phase = 'bet'; G.fb = null;
        if (G.mode.shared && !G.net) G.botBest = botBestHand(botCards());
        G.msg = strength().sentence ? 'You play a sentence! Fold, check or bet?' : 'Fold, check or bet?';
        break;
      case 'fold': return act('fold');
      case 'check-bet': return act('check');
      case 'bet': return act('bet', +b.dataset.amt);
      case 'call': return act('call');
      case 'next': return next();
    }
    render();
  });

  overlay.addEventListener('click', e => {
    const top = e.target.closest('[data-top]');
    if (top) {
      const k = top.dataset.top;
      if (k === 'close') close();
      else if (k === 'home') askHome();
      else if (k === 'tip') showTip(G && G.lastError);
      else if (k === 'hands') showHands();
      else if (k === 'labels') { if (inRoom()) return; store.set('labels', store.get('labels') === '0' ? '1' : '0'); render(); }
      else if (k === 'sound') { sound = !sound; store.set('sound', sound ? '1' : '0'); render(); }
      return;
    }
    const p = e.target.closest('[data-pop]');
    if (p) { if (p.dataset.pop === 'another') showTip(); else if (p.dataset.pop === 'home') goHome(); else pop.hidden = true; return; }
    if (e.target === pop) pop.hidden = true;
  });

  // from the Present simple chapter: Level 1 (the deck of the present simple) is the one that is ready
  function open(opts = {}) {
    if (opts.level && (!G || G.phase === 'over')) { G = null; lastLevel = opts.level; hint = opts.hint || ''; }
    else if (!opts.level && !G) hint = '';
    overlay.hidden = false;
    document.documentElement.classList.add('gp-open');
    render();
    box.focus();
  }
  function close() {
    overlay.hidden = true;
    pop.hidden = true;
    document.documentElement.classList.remove('gp-open');
  }
  document.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') { if (!pop.hidden) pop.hidden = true; else close(); }
    e.stopPropagation(); // the arrows must not turn the pages behind
  }, true);

  window.GRAMMAR_POKER = { open, close };

  /* ================= the Games list on the home page ================= */
  window.addEventListener('load', () => {
    const list = document.getElementById('gameList');
    if (!list) return;
    const pill = document.createElement('details');
    pill.className = 'game-topic';
    pill.style.setProperty('--c', '#8e2de2');
    pill.dataset.at = Number(PAGES.of('ps-affirmative')) + 0.1; // the list is in the order of the book: poker comes right after the present simple
    pill.innerHTML = `<summary>${VS_SIGN} Grammar Poker <small>1</small></summary><div class="topic-pages"><a href="#" data-gp-go>${VS_SIGN} ♠ ♥ ♦ ♣ Grammar Poker</a></div>`;
    // in the home page: right after the games of the present simple
    const ps = [...list.querySelectorAll('.game-topic')].find(d => /^present simple/i.test(d.querySelector('summary')?.textContent.trim() || ''));
    ps ? ps.after(pill) : list.append(pill);
    document.addEventListener('click', e => { if (!e.target.closest('#gameList')) pill.open = false; });
    list.addEventListener('toggle', e => {
      if (e.target.open) list.querySelectorAll('.game-topic').forEach(o => { if (o !== e.target) o.open = false; });
    }, true);
    // in the Present simple chapter the button is in the pop-up of the -s games (grammar-games.js): window.GRAMMAR_POKER.open({ level: 1, hint })
    pill.querySelector('[data-gp-go]').addEventListener('click', e => { e.preventDefault(); pill.open = false; open(); });
    window.hideClosedGames?.();
  });
})();
