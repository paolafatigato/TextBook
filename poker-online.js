// Grammar Poker online: two devices, one 4-letter code (book.rooms of cloud.js: the document duels/<CODE>).
// The room keeps, in the field `pk`: n0, n1 (the names; 0 = who made the room), mode, level, labels (the captions on the cards: the same for both), meaning ('check' | 'open'), gid + seed (a new game), left,
// and for every deal and every player one entry r<deal>p<player> = { a: [actions…], hand: [words], row: [words] }.
// Both devices deal from the same seed, so the cards are the same on both. Nobody writes for the other, and everything
// (chips, pots, who wins) is worked out by ledger() from the entries, so both devices always agree.
// Bets are sealed: at every step both players choose fold / check / bet <amount> ('bet:25'); the higher bet is matched by the other player.

(() => {
  const D = typeof GP_DATA !== 'undefined' ? GP_DATA : require('./poker-cards.js');
  const E = typeof GPE !== 'undefined' ? GPE : require('./poker-engine.js');
  const S = D.settings;

  const clientId = Math.random().toString(36).slice(2) + Date.now().toString(36); // new on every page load: one account can play on two devices
  const key = (round, player) => `r${round}p${player}`;
  const stepsOf = mode => (mode.shared ? 3 : 1);   // Texas: a bet after the flop, the turn and the river

  /* ---------- the same cards on both devices ---------- */
  const hash = s => {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  };
  const mulberry = a => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const shuffled = (arr, rng) => {
    const r = arr.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };

  // the deck of the game: the same on both devices, because it is made with the seed of the room
  const deckRng = seed => mulberry(hash(`${seed}:deck`));

  // my hand, the table cards (Texas) and what is left to draw from (the host draws from the front, the guest from the back)
  function dealFor(deck, seed, round, mode, me) {
    const pile = shuffled(deck, mulberry(hash(`${seed}:${round}`)));
    const h = mode.handSize;
    return {
      hand: pile.slice(me * h, me * h + h),
      table: pile.slice(2 * h, 2 * h + mode.shared),
      pile: pile.slice(2 * h + mode.shared),
    };
  }

  /* ---------- who has what: all worked out from the entries ---------- */
  // the hand a player has played: the row (a sentence if it is one), or all the cards if the row is empty
  // words = the cards of the game by their word (the deck is different in every game)
  function evalEntry(e, words) {
    if (e.row && e.row.length) {
      const cards = e.row.map(w => words[w]);
      const p = E.parse(cards);
      return E.bestHand(cards, p.ok ? E.asSentence(cards, p) : null);
    }
    return E.bestHand(e.hand.map(w => words[w]), null);
  }

  // → { chips: [c0, c1], rounds: { n: { status: 'play' | 'done', steps, pot, how, winner, foldBy, hands } } }
  function ledger(pk, mode, words) {
    const chips = [S.chips, S.chips], rounds = {}, steps = stepsOf(mode);
    for (let r = 1; r <= S.rounds; r++) {
      const e = [pk[key(r, 0)], pk[key(r, 1)]];
      if (!e[0] && !e[1]) break;
      const ante = Math.min(S.ante, chips[0], chips[1]);
      chips[0] -= ante; chips[1] -= ante;
      let pot = ante * 2;
      chips[0] += e[0]?.bonus ? 1 : 0; chips[1] += e[1]?.bonus ? 1 : 0;   // “Very clever!”: +1 chip for a second meaning
      const R = rounds[r] = { status: 'play', steps: 0 };
      for (let k = 0; k < steps; k++) {
        const a = [e[0]?.a?.[k], e[1]?.a?.[k]];
        if (a[0] === undefined || a[1] === undefined) break;           // somebody has not chosen yet
        if (a.includes('fold')) {
          R.status = 'done'; R.how = 'fold';
          if (a[0] === 'fold' && a[1] === 'fold') { R.winner = 'tie'; R.foldBy = null; }
          else { R.winner = a[0] === 'fold' ? 1 : 0; R.foldBy = 1 - R.winner; }
          break;
        }
        const bets = a.filter(x => x.startsWith('bet')).map(x => +x.split(':')[1] || S.bet);
        if (bets.length) {
          const st = Math.min(Math.max(...bets), chips[0], chips[1]);
          chips[0] -= st; chips[1] -= st; pot += st * 2;
        }
        R.steps = k + 1;
        if (k === steps - 1 && e[0].hand && e[1].hand) {
          R.hands = [evalEntry(e[0], words), evalEntry(e[1], words)];
          const c = E.compare(R.hands[0], R.hands[1]);
          R.winner = c > 0 ? 0 : c < 0 ? 1 : 'tie';
          R.status = 'done'; R.how = 'show';
        }
      }
      R.pot = pot;
      if (R.status === 'done') {
        if (R.winner === 'tie') { chips[0] += Math.floor(pot / 2); chips[1] += Math.ceil(pot / 2); }
        else chips[R.winner] += pot;
      }
    }
    return { chips, rounds };
  }

  /* ---------- the room ---------- */
  const rooms = () => (typeof window !== 'undefined' && window.book && window.book.rooms) || null;
  function errorText(e) {
    const c = (e && (e.code || e.message)) || '';
    if (/operation-not-allowed|admin-restricted/.test(c)) return 'Online play is not switched on yet. Ask your teacher!';
    if (/permission-denied/.test(c)) return 'Online play is not set up yet. Ask your teacher!';
    if (c === 'notfound') return 'There is no room with this code. Check the letters!';
    if (c === 'full') return 'This room already has two players.';
    if (c === 'expired') return 'This room is too old. Ask your friend to make a new one.';
    if (c === 'busy') return 'Could not make a room. Try again.';
    if (c === 'offline') return 'Online play needs the internet. Try again in a moment.';
    return 'Could not connect. Check the internet and try again.';
  }
  async function enter(make, code, name, mode, level, labels, meaning) {
    const R = rooms();
    if (!R) throw Object.assign(new Error('offline'), { code: 'offline' });
    let me = 0;
    if (make) code = await R.create(clientId); else me = await R.join(code, clientId);
    const patch = { [`pk.n${me}`]: name || `Player ${me + 1}` };
    if (make) Object.assign(patch, { 'pk.mode': mode, 'pk.level': level, 'pk.labels': labels, 'pk.meaning': meaning });
    await R.update(code, patch);
    return { code, me };
  }
  const watch = (code, onRoom, onError) => rooms().watch(code, onRoom, onError);
  const post = (code, patch) => { try { return rooms().update(code, patch).catch(() => {}); } catch { return null; } }; // offline: the friend just sees nothing new
  // a new game: new seed, the old entries are wiped
  function newGame(code, pk) {
    const patch = { 'pk.gid': (pk.gid || 0) + 1, 'pk.seed': Math.random().toString(36).slice(2, 8), 'pk.left': null };
    for (let r = 1; r <= S.rounds; r++) for (const p of [0, 1]) patch[`pk.${key(r, p)}`] = null;
    return post(code, patch);
  }
  const leave = (code, me) => post(code, { 'pk.left': me });

  const api = { clientId, key, stepsOf, deckRng, dealFor, evalEntry, ledger, errorText, enter, watch, post, newGame, leave };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.POKER_NET = api;
})();
