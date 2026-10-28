// Grammar Race, the parts with no screen (so they can be tested in Node): the exercises of a race, the answers, the ranking.
// The same seed gives the same exercises in the same order on every device: the race is fair.

(() => {
  const D = typeof RACE_DATA !== 'undefined' ? RACE_DATA : require('./race-data.js');

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

  const countFor = minutes => Math.max(4, Math.round(minutes * D.settings.perMinute / 4) * 4);   // the same number from every topic

  // the exercises of a race: the same number from every topic, mixed, with the buttons of a choice already in their order
  // → [{ id, topic, t, q, o?: [words], a: [accepted answers] }]
  function makeSet(seed, minutes) {
    const rng = mulberry(hash(`${seed}:set`));
    const keys = Object.keys(D.topics);
    const each = Math.floor(countFor(minutes) / keys.length);
    const list = [];
    keys.forEach(k => {
      // about one exercise in three is a 'write' one (the pool has 10 'choose' and 5 'write' for every topic)
      const all = D.topics[k].items.map((it, i) => ({ it, id: `${k}${i}` }));
      const nType = Math.round(each / 3);
      const pick = (t, n) => shuffled(all.filter(x => x.it.t === t), rng).slice(0, n);
      [...pick('type', nType), ...pick('choice', each - nType)].forEach(({ it, id }) => {
        if (it.t === 'choice') list.push({ id, topic: k, t: 'choice', q: it.q, o: shuffled(it.o, rng), a: [it.o[it.a]] });
        else list.push({ id, topic: k, t: 'type', q: it.q, a: it.a });
      });
    });
    return inGroups(list, rng);
  }

  // like the book: groups of 4-8 exercises on the same topic and with the same mechanism (choose / write), the groups in a mixed order
  // (never two of the same topic one after the other, if it can be avoided). Every exercise knows its place: g (group), gi (in the group), gn (size).
  function chunks(arr, rng) {
    const rest = arr.slice(), out = [];
    while (rest.length) {
      let n = rest.length <= 8 ? rest.length : 4 + Math.floor(rng() * 4);
      if (rest.length - n > 0 && rest.length - n < 3) n = rest.length - 3;
      out.push(rest.splice(0, n));
    }
    return out;
  }
  function inGroups(list, rng) {
    let groups = [];
    Object.keys(D.topics).forEach(k => ['choice', 'type'].forEach(t => {
      const items = list.filter(e => e.topic === k && e.t === t);
      if (items.length) groups.push(...chunks(shuffled(items, rng), rng));
    }));
    let best = null;
    for (let tries = 0; tries < 300; tries++) {
      const g = shuffled(groups, rng);
      const clash = g.filter((x, i) => i && x[0].topic === g[i - 1][0].topic).length;
      if (!best || clash < best.clash) best = { g, clash };
      if (!clash) break;
    }
    groups = best.g;
    return groups.flatMap((g, gi) => g.map((e, i) => ({ ...e, g: gi, gi: i, gn: g.length })));
  }

  const clean = s => String(s == null ? '' : s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim();
  const isRight = (ex, answer) => clean(answer) !== '' && ex.a.some(a => clean(a) === clean(answer));

  // where a player is on the line (0 … n): the answers given, or, after Finish, the exercises that are right
  const posOf = (p, n) => (p.pos != null ? p.pos : p.fin ? n : p.phase === 'fix' ? n - (p.rem || 0) : Math.min(p.a || 0, n));

  // the ranking: who has finished (the first to finish is first), then the furthest on the line; the one who got there first is ahead
  function rank(players, n) {
    return players.map(p => ({ ...p, pos: posOf(p, n) })).sort((x, y) => {
      if (!!x.fin !== !!y.fin) return x.fin ? -1 : 1;
      if (x.fin) return x.fin - y.fin;
      return y.pos - x.pos || (x.t || 0) - (y.t || 0) || String(x.id).localeCompare(String(y.id));
    });
  }

  // the row of the ranking that the teacher's device sends to everybody (short names of the fields: 60 players must fit in one document)
  const boardRow = p => ({ i: p.id, n: p.n, p: p.pos, f: p.fin || 0, m: p.mis || 0 });

  const api = { makeSet, isRight, clean, rank, posOf, boardRow, countFor, hash, mulberry };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.RACE_CORE = api;
})();
