// Grammar Poker: the engine. No DOM here.
//   GPE.deckFor(level)      the cards of a Level
//   GPE.parse(cards)        is this ordered list of cards a correct sentence? → { ok, rules, error:{ rule, index } }
//   GPE.solve(hand)         the best sentences hidden in a hand
//   GPE.bestHand(hand, s)   best hand of a hand (poker combinations + the sentence s, if there is one)
//   GPE.compare(a, b)       > 0 if a wins, < 0 if b wins, 0 = tie
// Words, levels and rules live in poker-cards.js.

(() => {
  const D = typeof GP_DATA !== 'undefined' ? GP_DATA : require('./poker-cards.js');
  const S = D.settings;
  const VOWELS = 'aeiou';

  const is = (c, suit, sub) => !!c && c.suit === suit && (sub === undefined || c.subtype === sub);
  const isAdj = c => is(c, 'modifier', 'adjective');
  const isComp = c => is(c, 'modifier', 'comparative');
  const isAdv = (c, kind) => is(c, 'modifier', 'adverb') && (!kind || c.kind === kind);
  const isAnd = c => is(c, 'function', 'connector') && c.word === 'and';
  const agrees = (v, cls) => v.agrees.includes('any') || v.agrees.includes(cls);
  const uniq = a => [...new Set(a)];
  const animate = c => c.kind === 'person' || c.kind === 'animal';

  // The deck of a game: every slot of the Level takes one of its words at random (Anna → Paola, eggs → carrots…); no word twice.
  // rng = Math.random, or the seeded generator of the room when two devices play (same deck on both).
  const deckFor = (level, rng = Math.random) => {
    const slots = D.cards.filter(c => c.decks.includes(level));
    const bases = new Set(slots.map(c => c.word));
    const taken = new Set();
    return slots.map(slot => {
      const { variants = [], decks, ...rest } = slot;
      const free = variants.filter(v => { const w = typeof v === 'string' ? v : v.word; return !bases.has(w) && !taken.has(w); });
      const options = [null, ...free];
      const v = options[Math.floor(rng() * options.length)];
      if (v === null) { taken.add(slot.word); return rest; }
      const card = typeof v === 'string' ? { ...rest, word: v } : { ...rest, ...v };
      if (typeof v === 'string' || !v.alt) delete card.alt;   // a variant does not keep the second meaning of the slot
      taken.add(card.word);
      return card;
    });
  };

  /* ================= grammar ================= */

  // A card with a second meaning (alt) is tried in all its readings; the sentence is right if one way of reading works.
  // clever = it needed a second meaning. The error is the one of the usual readings.
  function parse(cards, strict) {
    const sx = strict === undefined ? cfg.meaning !== 'open' : strict;   // strict = the meaning is checked too
    const opts = cards.map(c => {
      const alts = (c.alt || []).filter(a => !a.decks || a.decks.includes(cfg.level));
      return alts.length ? [c, ...alts.map(a => ({ word: c.word, level: c.level, ...a, base: c }))] : [c];
    });
    let first = null;
    const pick = [];
    const go = i => {
      if (i === cards.length) {
        const r = parseOne(pick.slice(), sx);
        first ||= r;
        if (!r.ok) return null;
        const alts = pick.map((c, k) => (c !== cards[k] ? c : null));
        const clever = alts.some(Boolean);
        const rules = clever ? uniq([...r.rules, 'second-meaning']) : r.rules;
        return { ...r, rules, clever, altWords: alts.filter(Boolean).map(c => ({ word: c.word, note: c.note })), suits: pick.map(c => c.suit) };
      }
      for (const c of opts[i]) {
        pick[i] = c;
        const r = go(i + 1);
        if (r) return r;
      }
      return null;
    };
    const res = go(0) || first;
    if (res && res.ok && !sx) {   // grammar only: is the sentence strange? (it would not pass the meaning check)
      const st = parse(cards, true);
      if (!st.ok && st.error.rule === 'meaning') { res.odd = true; res.oddIndex = st.error.index; }
    }
    return res;
  }
  // a parsed sentence, ready for the hand: the cards, the rules, the suits really used
  const asSentence = (cards, p) => ({ cards, rules: p.rules, suits: p.suits, clever: p.clever, altWords: p.altWords, odd: p.odd, oddIndex: p.oddIndex });

  function parseOne(cards, strict) {
    const n = cards.length;
    if (!n) return { ok: false, error: { rule: 'empty', index: -1 } };
    if (!cards.some(c => c.suit === 'verb')) return { ok: false, error: { rule: 'need-verb', index: -1 } };
    if (!cards.some(c => c.suit === 'noun' || c.subtype === 'pronoun')) return { ok: false, error: { rule: 'need-subject', index: -1 } };

    let worst = null; // the failure that happened furthest on = the most useful message
    const bad = (i, rule, force) => {
      if (worst && worst.rule === 'meaning' && rule !== 'meaning') return []; // "it makes no sense" is the most useful message
      if (!worst || i > worst.index || (force && i === worst.index) || rule === 'meaning') worst = { rule, index: i };
      return [];
    };
    const R = (i, rules = [], more) => Object.assign({ i, rules }, more);
    const carry = (r, rules) => R(r.i, rules, { tense: r.tense, time: r.time, timeIdx: r.timeIdx });

    // one noun phrase: [a / an / the] [adjectives] noun, or a subject pronoun
    function np(i, ctx) {
      const t = cards[i];
      if (!t) return bad(i, ctx === 'subject' ? 'need-subject' : 'need-object');
      if (t.subtype === 'pronoun') return ctx === 'subject' || t.asObject ? [R(i + 1, [], { cls: t.person, heads: [i] })] : bad(i, 'pronoun-object');
      let j = i, det = null;
      const rules = [];
      if (t.subtype === 'article') { det = t; j++; }
      const adjStart = j;
      while (cards[j]) {
        if (isAdj(cards[j]) || isComp(cards[j])) { if (isComp(cards[j])) rules.push('comparative'); j++; }
        else if (isAdv(cards[j], 'degree') && isAdj(cards[j + 1])) { rules.push('adv-degree'); j += 2; }
        else if (isAdv(cards[j], 'degree')) return bad(j, 'degree-position');
        else break;
      }
      const nn = cards[j];
      if (!is(nn, 'noun')) return bad(j, det || j > i ? 'np-needs-noun' : ctx === 'subject' ? 'need-subject' : 'need-object');
      if (strict) for (let k = adjStart; k < j; k++) if (cards[k].needs === 'animate' && !animate(nn)) return bad(k, 'meaning');
      if (det) {
        if (det.word === 'a' || det.word === 'an') {
          if (nn.subtype !== 'countable') return bad(i, 'a-singular');
          const vowel = VOWELS.includes(cards[i + 1].word[0].toLowerCase());
          if ((det.word === 'a') === vowel) return bad(i, 'a-an');
          rules.push('a-an');
        }
        if (nn.subtype === 'proper') return bad(i, 'proper-no-article');
      } else if (nn.subtype === 'countable') return bad(j, 'countable-det');
      if (j > adjStart) rules.push('adj-noun');
      return [R(j + 1, rules, { cls: nn.subtype === 'plural' ? 'pl' : 'sg', heads: [j] })];
    }

    // noun phrases joined by AND
    function npList(i, ctx) {
      const out = [];
      let cur = np(i, ctx);
      while (cur.length) {
        out.push(...cur);
        const next = [];
        for (const r of cur) {
          if (!isAnd(cards[r.i])) continue;
          for (const s of np(r.i + 1, ctx)) next.push(R(s.i, [...r.rules, ...s.rules, ctx === 'subject' ? 'and-subject' : 'and-list'], { cls: 'pl', heads: [...r.heads, ...s.heads] }));
        }
        cur = next;
      }
      return out;
    }

    // after BE: [very] adjective / comparative, joined by AND
    function adjOne(i) {
      const t = cards[i];
      if (isAdv(t, 'degree')) return isAdj(cards[i + 1]) ? [R(i + 2, ['adv-degree', 'be-adj'])] : bad(i, 'degree-position');
      if (isAdj(t)) return [R(i + 1, ['be-adj'])];
      if (isComp(t)) return [R(i + 1, ['comparative', 'be-adj'])];
      return [];
    }
    function adjList(i) {
      const out = [];
      let cur = adjOne(i);
      while (cur.length) {
        out.push(...cur);
        const next = [];
        for (const r of cur) if (isAnd(cards[r.i])) for (const s of adjOne(r.i + 1)) next.push(R(s.i, [...r.rules, ...s.rules, 'and-list']));
        cur = next;
      }
      return out;
    }

    function pp(i) {
      if (!is(cards[i], 'function', 'preposition')) return [];
      const r = npList(i + 1, 'object');
      if (!r.length) return bad(i + 1, 'prep-needs-noun', true);
      return r.map(x => R(x.i, ['prep-phrase', ...x.rules]));
    }

    const startsNP = c => !!c && (c.suit === 'noun' || is(c, 'function', 'article') || (c.subtype === 'pronoun' && c.asObject));
    // than + noun phrase, right after a comparative (bigger THAN the cat)
    function thanPhrase(i) {
      if (!is(cards[i], 'function', 'comparison')) return [];
      return npList(i + 1, 'object').map(x => R(x.i, ['comparative-than', ...x.rules]));
    }

    // what can close a clause: in/on/with …, an adverb of manner, a time word
    function tail(i, isBe) {
      const base = [R(i, []), ...pp(i)];
      const mid = [...base];
      if (!isBe) {
        for (const b of base) {
          const a = cards[b.i];
          if (isAdv(a, 'manner')) mid.push(R(b.i + 1, [...b.rules, 'adv-manner']));
          else if (isAdv(a, 'degree') && isAdv(cards[b.i + 1], 'manner')) mid.push(R(b.i + 2, [...b.rules, 'adv-degree', 'adv-manner']));
          else if (isComp(a)) {
            if (a.asAdverb) {
              mid.push(R(b.i + 1, [...b.rules, 'comparative']));
              for (const t of thanPhrase(b.i + 1)) mid.push(R(t.i, [...b.rules, 'comparative', ...t.rules]));
              if (startsNP(cards[b.i + 1])) bad(b.i + 1, 'than-missing', true);
            } else bad(b.i, 'comparative-adv');
          }
          else if (isAdv(a, 'frequency')) bad(b.i, 'freq-position');
        }
      }
      for (const b of base) if (is(cards[b.i], 'function', 'comparison')) bad(b.i, 'than-comparative', true);
      const all = [...mid];
      for (const m of mid) {
        const a = cards[m.i];
        if (isAdv(a, 'time')) all.push(R(m.i + 1, [...m.rules, 'adv-time'], { time: a, timeIdx: m.i }));
      }
      return all;
    }

    function beComp(i, heads, cls) {
      const out = [];
      const starts = [R(i, [])];
      if (isAdv(cards[i], 'frequency')) starts.push(R(i + 1, ['adv-freq']));
      for (const s of starts) {
        const found = [];
        const subjAnimate = !strict || heads.every(h => animate(cards[h]));
        for (const r of adjList(s.i)) {
          const k = cards.slice(s.i, r.i).findIndex(c => c.needs === 'animate');
          if (k >= 0 && !subjAnimate) bad(s.i + k, 'meaning');
          else {
            found.push(r);
            if (isComp(cards[r.i - 1])) {
              for (const t of thanPhrase(r.i)) found.push(R(t.i, [...r.rules, ...t.rules]));
              if (startsNP(cards[r.i])) bad(r.i, 'than-missing', true);   // bigger the cat → bigger THAN the cat
            }
          }
        }
        for (const r of npList(s.i, 'object')) {
          if (cards[r.heads[0]].subtype === 'pronoun') bad(r.heads[0], 'pronoun-object');
          else if (!subjAnimate || (strict && !r.heads.every(h => animate(cards[h])))) bad(r.heads[0], 'meaning');
          else if (cls !== 'you' && (cls === 'pl') !== (r.cls === 'pl')) bad(r.heads[0], 'be-number');
          else found.push(R(r.i, [...r.rules, 'be-noun']));
        }
        found.push(...pp(s.i));
        for (const r of found) for (const t of tail(r.i, true)) out.push(R(t.i, [...s.rules, ...r.rules, ...t.rules], { time: t.time, timeIdx: t.timeIdx }));
      }
      if (!out.length && !(worst && (worst.rule === 'be-number' || worst.rule === 'pronoun-object'))) bad(i, 'be-complement', true);
      return out;
    }

    // what comes after a main verb
    function after(v, i) {
      const objs = [];
      if (v.takes.includes('np')) for (const o of npList(i, 'object')) {
        const h = strict && v.objectKinds ? o.heads.find(x => !v.objectKinds.includes(cards[x].kind)) : undefined;
        if (h !== undefined) bad(h, 'meaning'); else objs.push(R(o.i, ['svo', ...o.rules]));
      }
      if (v.takes.includes('none')) objs.push(R(i, []));
      if (!v.takes.includes('np') && (is(cards[i], 'noun') || is(cards[i], 'function', 'article'))) bad(i, 'intransitive');
      const out = [];
      for (const o of objs) for (const t of tail(o.i, false)) out.push(R(t.i, [...o.rules, ...t.rules], { time: t.time, timeIdx: t.timeIdx }));
      return out;
    }

    function vp(i, cls, heads) {
      let j = i, pre = [], kind = null;
      if (isAdv(cards[j], 'frequency')) { kind = 'freq-position'; pre = ['adv-freq']; j++; }
      else if (isAdv(cards[j], 'manner')) { if (cards[j].after) return bad(j, 'adv-manner'); kind = 'adv-manner'; pre = ['adv-manner']; j++; }
      const t = cards[j];
      if (!is(t, 'verb')) return bad(j, 'need-verb');

      const odd = strict && t.subjectKind === 'animate' ? heads.find(h => !animate(cards[h])) : undefined;
      if (odd !== undefined) return bad(odd, 'meaning');
      if (t.subtype === 'be') {
        if (kind) return bad(j - 1, kind);
        if (!agrees(t, cls)) return bad(j, 'agree-be');
        return beComp(j + 1, heads, cls).map(r => R(r.i, ['agree-be', ...(t.tense === 'past' ? ['past-simple'] : []), ...r.rules], { tense: t.tense, time: r.time, timeIdx: r.timeIdx }));
      }
      if (t.subtype === 'modal') {
        if (kind) return bad(j - 1, kind);
        const out = [];
        const opts = [R(j + 1, [])];
        if (isAdv(cards[j + 1], 'frequency')) opts.push(R(j + 2, ['adv-freq']));
        for (const o of opts) {
          const v = cards[o.i];
          if (!is(v, 'verb') || !v.base) { bad(o.i, 'modal-base'); continue; }
          if (v.subtype === 'be') {   // she can BE happy
            for (const r of beComp(o.i + 1, heads, cls)) out.push(R(r.i, ['modal', ...o.rules, ...r.rules], { tense: 'present', time: r.time, timeIdx: r.timeIdx }));
            continue;
          }
          for (const r of after(v, o.i + 1)) out.push(R(r.i, ['modal', ...o.rules, ...r.rules], { tense: 'present', time: r.time, timeIdx: r.timeIdx }));
        }
        return out;
      }
      if (!agrees(t, cls)) return bad(j, 'agree-s');
      const rules = [...pre];
      if (t.tense === 'past') rules.push('past-simple');
      else if (t.agrees[0] === 'sg') rules.push('agree-s');
      return after(t, j + 1).map(r => R(r.i, [...rules, ...r.rules], { tense: t.tense, time: r.time, timeIdx: r.timeIdx }));
    }

    function clause(i) {
      const out = [];
      const starts = [R(i, [])];
      if (isAdv(cards[i], 'time')) starts.push(R(i + 1, ['adv-time'], { time: cards[i], timeIdx: i }));
      for (const s of starts) {
        for (const sj of npList(s.i, 'subject')) {
          for (const v of vp(sj.i, sj.cls, sj.heads)) {
            const time = s.time || v.time;
            if (time && v.tense !== 'past') { bad(s.time ? s.timeIdx : v.timeIdx, 'time-past', true); continue; }
            out.push(R(v.i, [...s.rules, ...sj.rules, ...v.rules], { tense: v.tense }));
          }
        }
      }
      return out;
    }

    function sentence(i) {
      const out = [];
      for (const c of clause(i)) {
        out.push(c);
        if (is(cards[c.i], 'function', 'connector')) {
          const more = sentence(c.i + 1);
          if (!more.length) bad(c.i + 1, 'connector-clause', true);
          for (const d of more) out.push(R(d.i, [...c.rules, 'connector', ...d.rules]));
        }
      }
      return out;
    }

    const res = sentence(0);
    const full = res.find(r => r.i === n);
    if (full) {
      if (n < S.minSentence) return { ok: false, error: { rule: 'too-short', index: -1 } };
      return { ok: true, rules: uniq(full.rules) };
    }
    const reach = res.reduce((m, r) => Math.max(m, r.i), 0);
    if (res.length && (!worst || worst.index < reach)) return { ok: false, error: { rule: 'unexpected', index: reach } };
    return { ok: false, error: worst || { rule: 'unexpected', index: 0 } };
  }

  /* ================= hands ================= */

  const hard = cards => cards.reduce((s, c) => s + c.level, 0);
  const byLevel = (a, b) => b.level - a.level;
  const BY_KEY = Object.fromEntries(D.hands.map(h => [h.key, h]));
  const ranksOf = order => Object.fromEntries(order.map((k, i) => [k, i + 1]));   // the rank of a hand: its place in the order of the poker
  // set by the game: the poker that is played (royalMin, see modes) and the Level (what makes a pair, which second meanings count)
  const cfg = { royalMin: 6, level: 1, pairBy: D.levels[0].pairBy, ranks: ranksOf(D.modes[0].order) };
  const setRules = r => { Object.assign(cfg, r); if (r.order) cfg.ranks = ranksOf(r.order); };
  const rankOf = key => cfg.ranks[key];

  // key 'none' = no hand at all (the pokers without a High card)
  const mk = (key, used, extra) => ({ key, rank: cfg.ranks[key] ?? 0, name: BY_KEY[key]?.name || 'No hand', used, hard: hard(used), len: used.length, ...extra });

  // the poker combinations (a pair is 2 cards with the same suit AND subtype)
  function pokerHand(cards) {
    const groups = {}, suits = {};
    for (const c of cards) {
      (groups[c.suit + ':' + c[cfg.pairBy?.[c.suit] || 'subtype']] ||= []).push(c);
      (suits[c.suit] ||= []).push(c);
    }
    const gs = Object.values(groups).map(g => g.slice().sort(byLevel));
    const best = (min, skip) => gs.filter(g => g.length >= min && g !== skip).sort((a, b) => hard(b.slice(0, min)) - hard(a.slice(0, min)))[0];
    // all the combinations that the cards make; the strongest of this poker counts
    const cand = [];
    const flush = Object.values(suits).filter(g => g.length >= 5).map(g => g.slice().sort(byLevel).slice(0, 5)).sort((a, b) => hard(b) - hard(a))[0];
    if (flush) cand.push(mk('flush', flush));
    const four = best(4);
    if (four) cand.push(mk('four', four.slice(0, 4)));
    const trips = best(3);
    const pair2 = trips && best(2, trips);
    if (trips && pair2) cand.push(mk('full', [...trips.slice(0, 3), ...pair2.slice(0, 2)]));
    if (trips) cand.push(mk('trips', trips.slice(0, 3)));
    const p1 = best(2), p2 = p1 && best(2, p1);
    if (p1 && p2) cand.push(mk('two', [...p1.slice(0, 2), ...p2.slice(0, 2)]));
    if (p1) cand.push(mk('pair', p1.slice(0, 2)));
    cand.push(cfg.ranks.high ? mk('high', [cards.slice().sort(byLevel)[0]]) : mk('none', []));
    return cand.sort((a, b) => b.rank - a.rank)[0];
  }

  const isRoyal = (cards, suits) => cards.length >= cfg.royalMin && new Set(suits || cards.map(c => c.suit)).size === 4;
  // the hand of a sentence: Royal Sentence, or by its length (3, 4, 5, 6+ cards)
  const sentenceKey = (cards, suits) => {
    if (cfg.ranks.royal && isRoyal(cards, suits)) return 'royal';
    let n = Math.min(cards.length, 6);
    while (n > 3 && !cfg.ranks['s' + n]) n--;
    return 's' + n;
  };
  const sentenceHand = s => mk(sentenceKey(s.cards, s.suits || parse(s.cards).suits), s.cards, { sentence: s });

  function compare(a, b) {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (a.sentence && b.sentence && a.len !== b.len) return a.len - b.len;
    return cfg.tieDots === false ? 0 : a.hard - b.hard;   // the dots decide a tie, unless the poker shares the pot
  }

  function bestHand(hand, sentence) {
    let h = pokerHand(hand);
    if (sentence) {
      const sh = sentenceHand(sentence);
      if (compare(sh, h) > 0) h = sh;
    }
    return h;
  }

  /* ================= finding the sentences in a hand ================= */

  // every correct sentence made with the cards of the hand (best first)
  function solve(hand) {
    const n = hand.length, found = [];
    const used = new Array(n).fill(false), seq = [];
    const starter = c => c.suit === 'noun' || c.subtype === 'pronoun' || c.subtype === 'article' || c.suit === 'modifier';
    const rec = () => {
      if (seq.length >= S.minSentence) {
        const cards = seq.map(i => hand[i]);
        const p = parse(cards, true);   // Robo and the hints only look for sentences that make sense
        if (p.ok) found.push(asSentence(cards, p));
      }
      if (seq.length === n) return;
      for (let i = 0; i < n; i++) {
        if (used[i]) continue;
        if (!seq.length && !starter(hand[i])) continue;
        used[i] = true; seq.push(i);
        rec();
        seq.pop(); used[i] = false;
      }
    };
    rec();
    return found.map(sentenceHand).sort((a, b) => compare(b, a));
  }

  const sentenceText = cards => {
    const t = cards.map(c => c.word).join(' ');
    return t[0].toUpperCase() + t.slice(1) + '.';
  };

  const api = { rankOf, setRules, asSentence, deckFor, parse, solve, pokerHand, sentenceHand, bestHand, compare, isRoyal, sentenceText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.GPE = api;
})();
