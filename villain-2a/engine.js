// Villain 2A: the rules of the duel (no screen here: the browser and the balance tests both use this file).
//
// A fighter has a kit: up to 5 powers with a few uses each + a basic move that is always ready.
// A move is { name, story, uses, tags, fx: [ … ] }. The numbers (fx) are secret for the pupils; the descriptions
// are written from the numbers by hint() so that the words always match the points.
//
// Effects (k):
//   dmg {v, n}            n hits of v damage each (every hit meets the shield / mirror on its own)
//   heal {v}              heals the user
//   recoil {v}            the user is hurt too
//   guard {p, hits}       the next `hits` hits on the user do p less (1 = nothing)
//   reflect {p, hits}     the next `hits` hits go back to the attacker (p = how much)
//   vanish {n}            the next attack of the foe misses completely (damage and effects)
//   pierce {n}            the user's next attack ignores shields, mirrors and vanishing
//   boost {m, hits}       the user's next `hits` attacks are multiplied by m (> 1)
//   weak {m, hits}        the foe's next `hits` attacks are multiplied by m (< 1)
//   confuse {n}           the foe's next attack hurts the foe too (40% of it comes back)
//   skip {n}              the foe loses n turns
//   selfSkip {n}          the user loses n turns
//   haste                 the user acts again right away
//   seal {n}              the foe cannot use its last power for n of its turns
//   dispel                removes the foe's shield, mirror, vanish, pierce and boost
//   steal                 takes the foe's shield, mirror, vanish, pierce, boost (and, if the quirk says so, its marks)
//   mark {name, n, self}  rage (7 = explosion) · sleepy (3 = falls asleep) · tired (3 = has to rest)
//   cleanse               removes weakness, confusion, seal, rage and sleepy from the user
//   flag {name, v}        warm / ginger
//   randomPower           the user uses one of its other powers for free, chosen by chance
//
// Quirks (kit.q): immuneBasic · thorns (n) · sealImmune · noRepeat · lowConf · tired · needsWarm · needsGinger · overload
// Weak spot (kit.weakTag): takes 25% more from attacks with that tag.

(function (root) {
  'use strict';

  const MAX_HP = 80;
  const SECOND_BONUS = 4; // the player who goes second starts with more HP
  const AVG = 16;          // an average hit, used to put a value on defence and control moves
  const WEAK_TAG = 1.25;
  const RAGE_AT = 7, RAGE_BLAST = 24, SLEEP_AT = 3, TIRED_AT = 3;
  const SUDDEN_ROUND = 12; // from this round on, both lose HP at the end of every round (so a fight always ends)
  const MAX_ROUNDS = 30;   // safety: after this the one with more HP wins
  const GINGER_HIT = 18;   // a hit this big scares Ginger away

  const HOSTILE = new Set(['dmg', 'weak', 'confuse', 'skip', 'seal', 'dispel', 'steal']);
  const isHostile = fx => HOSTILE.has(fx.k) || (fx.k === 'mark' && !fx.self);

  /* ============ the state ============ */

  function newFighter(kit, seat) {
    return {
      kit, seat, hp: MAX_HP, maxHp: MAX_HP,
      left: kit.moves.map(m => m.uses),
      guard: null, reflect: null, weak: null, boost: null,
      confuse: 0, vanish: 0, pierce: 0, skip: 0, extra: 0,
      marks: { rage: 0, sleepy: 0, tired: 0 },
      seal: null,                       // { i, t }
      flags: { warm: false, ginger: true },
      last: -1,                         // the last power used
    };
  }

  function newGame(kitA, kitB, first, rng) {
    const f = [newFighter(kitA, 0), newFighter(kitB, 1)];
    f[first === 1 ? 0 : 1].maxHp = f[first === 1 ? 0 : 1].hp = MAX_HP + SECOND_BONUS;
    return {
      f,
      cur: first === 1 ? 1 : 0, actions: 0, over: false, winner: null, timeout: false,
      rng: rng || Math.random,
    };
  }

  function clone(g) {
    return {
      f: g.f.map(f => ({
        ...f, left: f.left.slice(), marks: { ...f.marks }, flags: { ...f.flags },
        guard: f.guard && { ...f.guard }, reflect: f.reflect && { ...f.reflect },
        weak: f.weak && { ...f.weak }, boost: f.boost && { ...f.boost }, seal: f.seal && { ...f.seal },
      })),
      cur: g.cur, actions: g.actions, over: g.over, winner: g.winner, timeout: g.timeout, rng: g.rng,
    };
  }

  /* ============ what can be used ============ */

  // why a move cannot be used right now ('' = it can)
  function blocked(f, i) {
    const k = f.kit;
    if (i === k.moves.length) return '';
    if (f.left[i] <= 0) return 'no uses left';
    if (f.seal && f.seal.i === i) return 'forgotten (sealed)';
    if (k.q.needsWarm && !f.flags.warm) return 'needs a warm-up';
    if (k.q.needsGinger && !f.flags.ginger) return 'Ginger is away';
    if (k.q.noRepeat && f.last === i) return 'cannot repeat';
    return '';
  }
  function legal(g, seat = g.cur) {
    const f = g.f[seat], out = [];
    for (let i = 0; i <= f.kit.moves.length; i++) if (!blocked(f, i)) out.push(i);
    return out;
  }

  /* ============ one action ============ */

  // returns the list of events (the screen writes them down; the tests ignore them)
  function act(g, i) {
    const ev = [];
    const me = g.f[g.cur], foe = g.f[1 - g.cur];
    const isBasic = i === me.kit.moves.length;
    const move = isBasic ? me.kit.basic : me.kit.moves[i];
    if (!isBasic) { me.left[i]--; me.last = i; }
    resolve(g, me, foe, move, isBasic, ev, i);
    if (!isBasic && me.kit.q.tired) { me.marks.tired++; }
    checkMarks(me, ev); checkMarks(foe, ev);
    // a seal runs out after the sealed fighter's own turns
    if (me.seal && --me.seal.t <= 0) me.seal = null;
    g.actions++;
    if (g.actions % 2 === 0 && g.actions / 2 >= SUDDEN_ROUND && !(me.hp <= 0 || foe.hp <= 0)) {
      const d = 2 * (g.actions / 2 - SUDDEN_ROUND + 1);
      const a = me.hp, b = foe.hp;
      me.hp = Math.max(0, a - d); foe.hp = Math.max(0, b - d);
      if (me.hp <= 0 && foe.hp <= 0 && a !== b) { if (a > b) me.hp = 1; else foe.hp = 1; } // the one with more HP survives
      ev.push({ t: 'sudden', dmg: d });
    }
    finish(g, ev);
    if (!g.over) advance(g, ev);
    return ev;
  }

  function finish(g, ev) {
    const [a, b] = g.f;
    if (a.hp <= 0 || b.hp <= 0) {
      g.over = true;
      g.winner = a.hp <= 0 && b.hp <= 0 ? -1 : a.hp <= 0 ? 1 : 0;
    } else if (g.actions >= MAX_ROUNDS * 2) {
      g.over = true; g.timeout = true;
      g.winner = a.hp === b.hp ? -1 : a.hp > b.hp ? 0 : 1;
    }
    if (g.over) ev.push({ t: 'end', winner: g.winner, timeout: g.timeout });
  }

  // who is next: skipped turns are lost, 'haste' gives the same fighter another action
  function advance(g, ev) {
    const me = g.f[g.cur];
    if (me.extra > 0) { me.extra--; ev.push({ t: 'again', who: g.cur }); return; }
    let nxt = 1 - g.cur;
    for (let k = 0; k < 8; k++) {
      const f = g.f[nxt];
      if (f.skip > 0) { f.skip--; ev.push({ t: 'skipped', who: nxt }); nxt = 1 - nxt; continue; }
      break;
    }
    g.cur = nxt;
  }

  function checkMarks(f, ev) {
    if (f.marks.sleepy >= SLEEP_AT) { f.marks.sleepy = 0; f.skip += 1; ev.push({ t: 'asleep', who: f.seat }); }
    if (f.marks.tired >= TIRED_AT) { f.marks.tired = 0; f.skip += 1; ev.push({ t: 'exhausted', who: f.seat }); }
    if (f.marks.rage >= RAGE_AT) { f.marks.rage = 0; f.hp = Math.max(0, f.hp - RAGE_BLAST); ev.push({ t: 'explode', who: f.seat, dmg: RAGE_BLAST }); }
  }

  function resolve(g, me, foe, move, isBasic, ev, idx, free) {
    ev.push({ t: 'use', who: me.seat, name: move.name, free: !!free });
    const hostile = move.fx.some(isHostile);
    const piercing = me.pierce > 0;
    let dodged = false;
    if (hostile && foe.vanish > 0) {
      if (piercing) { /* it sees where the foe is */ }
      else { foe.vanish--; dodged = true; ev.push({ t: 'dodged', who: foe.seat }); }
    }
    for (const fx of move.fx) {
      if (dodged && isHostile(fx)) continue;
      switch (fx.k) {
        case 'dmg': strike(me, foe, move, isBasic, fx, piercing, ev); break;
        case 'heal': { const h = Math.min(fx.v, me.maxHp - me.hp); me.hp += h; ev.push({ t: 'heal', who: me.seat, v: h }); break; }
        case 'recoil': me.hp = Math.max(0, me.hp - fx.v); ev.push({ t: 'recoil', who: me.seat, v: fx.v }); break;
        case 'guard': me.guard = { p: fx.p, hits: fx.hits }; ev.push({ t: 'status', who: me.seat, s: 'guard' }); break;
        case 'reflect': me.reflect = { p: fx.p, hits: fx.hits }; ev.push({ t: 'status', who: me.seat, s: 'reflect' }); break;
        case 'vanish': me.vanish = Math.min(2, me.vanish + fx.n); ev.push({ t: 'status', who: me.seat, s: 'vanish' }); break;
        case 'pierce': me.pierce = fx.n; ev.push({ t: 'status', who: me.seat, s: 'pierce' }); break;
        case 'boost': me.boost = { m: fx.m, hits: fx.hits }; ev.push({ t: 'status', who: me.seat, s: 'boost' }); break;
        case 'weak': foe.weak = { m: fx.m, hits: fx.hits }; ev.push({ t: 'status', who: foe.seat, s: 'weak' }); break;
        case 'confuse': foe.confuse = fx.n; ev.push({ t: 'status', who: foe.seat, s: 'confuse' }); break;
        case 'skip': foe.skip += fx.n; ev.push({ t: 'status', who: foe.seat, s: 'skip' }); break;
        case 'selfSkip': me.skip += fx.n; ev.push({ t: 'status', who: me.seat, s: 'selfskip' }); break;
        case 'haste': me.extra += 1; break;
        case 'seal': doSeal(foe, fx, ev); break;
        case 'dispel': foe.boost = foe.guard = foe.reflect = null; foe.vanish = foe.pierce = 0; ev.push({ t: 'status', who: foe.seat, s: 'dispel' }); break;
        case 'steal': doSteal(me, foe, ev); break;
        case 'mark': { const t = fx.self ? me : foe; t.marks[fx.name] = Math.max(0, t.marks[fx.name] + fx.n); ev.push({ t: 'mark', who: t.seat, name: fx.name, n: fx.n }); break; }
        case 'cleanse': me.weak = null; me.confuse = 0; me.seal = null; me.marks.rage = 0; me.marks.sleepy = 0; ev.push({ t: 'status', who: me.seat, s: 'cleanse' }); break;
        case 'flag': if (me.flags[fx.name] !== fx.v) { me.flags[fx.name] = fx.v; ev.push({ t: 'flag', who: me.seat, name: fx.name, v: fx.v }); } break;
        case 'randomPower': {
          const pool = me.kit.moves.map((m, j) => j).filter(j => j !== idx);
          const j = pool[Math.floor(g.rng() * pool.length)];
          resolve(g, me, foe, me.kit.moves[j], false, ev, j, true);
          break;
        }
      }
    }
    if (hostile && piercing) me.pierce--; // a pierce is used up by the next attack
  }

  function strike(me, foe, move, isBasic, fx, piercing, ev) {
    const hits = fx.n || 1;
    let mult = 1;
    if (me.boost) mult *= me.boost.m;
    if (me.weak) mult *= me.weak.m;
    if (me.kit.q.lowConf && me.hp < me.maxHp / 2) mult *= 0.8;
    if (foe.kit.weakTag && move.tags.includes(foe.kit.weakTag)) mult *= WEAK_TAG;
    const confused = me.confuse > 0;
    const ignore = piercing || fx.pierce;
    let total = 0, back = 0, selfHit = 0, bigHit = 0;
    for (let h = 0; h < hits; h++) {
      let d = fx.v * mult;
      if (isBasic && foe.kit.q.immuneBasic) d *= 0.25;
      if (confused) { selfHit += d * 0.4; d *= 0.6; }
      if (!ignore && foe.reflect && d > 0) {
        const r = d * foe.reflect.p;
        back += r;
        if (--foe.reflect.hits <= 0) foe.reflect = null;
        d = 0;
      } else if (!ignore && foe.guard && d > 0) {
        d *= 1 - foe.guard.p;
        if (--foe.guard.hits <= 0) foe.guard = null;
      }
      d = Math.round(d);
      total += d;
      if (d > bigHit) bigHit = d;
    }
    foe.hp = Math.max(0, foe.hp - total);
    const thorns = foe.kit.q.thorns && move.tags.includes('phys') ? foe.kit.q.thorns : 0; // once per attack, not once per hit
    if (thorns) me.hp = Math.max(0, me.hp - thorns);
    back = Math.round(back);
    if (back) me.hp = Math.max(0, me.hp - back);
    selfHit = Math.round(selfHit);
    if (selfHit) me.hp = Math.max(0, me.hp - selfHit);
    ev.push({ t: 'hit', who: foe.seat, dmg: total, hits, back, selfHit, thorns, shielded: fx.v > 0 && total < fx.v * hits * mult * 0.5 });
    // used up
    if (me.boost && --me.boost.hits <= 0) me.boost = null;
    if (me.weak && --me.weak.hits <= 0) me.weak = null;
    if (confused) me.confuse--;
    if (foe.kit.q.needsGinger && foe.flags.ginger && bigHit >= GINGER_HIT) { foe.flags.ginger = false; ev.push({ t: 'flag', who: foe.seat, name: 'ginger', v: false }); }
  }

  function doSeal(foe, fx, ev) {
    if (foe.kit.q.sealImmune) { ev.push({ t: 'immune', who: foe.seat }); return; }
    let i = foe.last;
    if (i < 0 || foe.left[i] <= 0) { // nothing used yet: the one it has most of
      let best = -1;
      foe.kit.moves.forEach((m, j) => { if (foe.left[j] > 0 && (best < 0 || m.rate > foe.kit.moves[best].rate)) best = j; });
      i = best;
    }
    if (i < 0) return;
    foe.seal = { i, t: fx.n };
    ev.push({ t: 'sealed', who: foe.seat, name: foe.kit.moves[i].name });
  }

  function doSteal(me, foe, ev) {
    let got = false;
    for (const k of ['boost', 'guard', 'reflect']) if (foe[k]) { me[k] = foe[k]; foe[k] = null; got = true; }
    if (foe.vanish) { me.vanish = Math.min(2, me.vanish + foe.vanish); foe.vanish = 0; got = true; }
    if (foe.pierce) { me.pierce += foe.pierce; foe.pierce = 0; got = true; }
    if (me.kit.q.overload) for (const n of ['rage', 'sleepy']) if (foe.marks[n]) { me.marks[n] += foe.marks[n]; foe.marks[n] = 0; got = true; ev.push({ t: 'overload', who: me.seat, name: n }); }
    ev.push({ t: 'stole', who: me.seat, got });
  }

  /* ============ how strong is a move? (for the teacher and for the computer) ============ */

  // value in "damage points". One attack turn is worth about AVG.
  function fxValue(fx, kit) {
    switch (fx.k) {
      case 'dmg': return fx.v * (fx.n || 1) * (fx.pierce ? 1.15 : 1);
      case 'heal': return fx.v * 0.9;
      case 'recoil': return -fx.v;
      case 'guard': return fx.p * fx.hits * AVG;
      case 'reflect': return fx.p * fx.hits * AVG * 1.8;
      case 'vanish': return fx.n * AVG * 1.1;
      case 'pierce': return 7 * fx.n;
      case 'boost': return (fx.m - 1) * fx.hits * AVG;
      case 'weak': return (1 - fx.m) * fx.hits * AVG;
      case 'confuse': return 0.35 * AVG * fx.n;
      case 'skip': return fx.n * AVG * 1.2;
      case 'selfSkip': return -fx.n * AVG * 0.9;
      case 'haste': return AVG * 1.1;
      case 'seal': return 6 * fx.n;
      case 'dispel': return 8;
      case 'steal': return 10;
      case 'mark': return fx.name === 'rage' ? fx.n * 3.4 : fx.name === 'sleepy' ? fx.n * 7 : fx.n * -4;
      case 'cleanse': return 5;
      case 'flag': return 0;
      case 'randomPower': return kit ? kit.moves.filter(m => !m.fx.some(f => f.k === 'randomPower')).reduce((t, m) => t + m.rate, 0) / Math.max(1, kit.moves.length - 1) : 14;
      default: return 0;
    }
  }
  const moveRate = (move, kit) => Math.round(move.fx.reduce((t, fx) => t + fxValue(fx, kit), 0) * 10) / 10;
  const kitRate = kit => Math.round(kit.moves.reduce((t, m) => t + m.rate * m.uses, 0));

  /* ============ words that hint at the strength (never the number) ============ */

  const hit = v => v <= 8 ? 'a light hit' : v <= 13 ? 'a solid hit' : v <= 19 ? 'a strong hit' : v <= 25 ? 'a very strong hit' : 'a huge hit';
  const pl = n => n === 1 ? '' : 's';
  function hint(move) {
    const out = [];
    for (const fx of move.fx) {
      switch (fx.k) {
        case 'dmg': out.push(fx.n > 1 ? `${fx.n} separate hits (a shield stops one at a time)` : hit(fx.v) + (fx.pierce ? ' that goes around shields' : '')); break;
        case 'heal': out.push(fx.v <= 8 ? 'You heal a little' : fx.v <= 16 ? 'You heal a good amount' : 'You heal a lot'); break;
        case 'recoil': out.push('but you get hurt too'); break;
        case 'guard': out.push(fx.p >= .85 ? `The next ${fx.hits > 1 ? fx.hits + ' hits' : 'hit'} will hardly touch you` : fx.p >= .55 ? `Blocks more than half of the next ${fx.hits > 1 ? fx.hits + ' hits' : 'hit'}` : `Blocks some of the next ${fx.hits > 1 ? fx.hits + ' hits' : 'hit'}`); break;
        case 'reflect': out.push('The next hit goes back to the attacker'); break;
        case 'vanish': out.push('The next attack misses you completely'); break;
        case 'pierce': out.push('Your next attack cannot be blocked or dodged'); break;
        case 'boost': out.push(fx.m >= 1.6 ? `Your next attack${fx.hits > 1 ? 's are' : ' is'} much stronger` : `Your next attack${fx.hits > 1 ? 's are' : ' is'} a bit stronger`); break;
        case 'weak': out.push(fx.m <= .5 ? `The foe’s next attack${fx.hits > 1 ? 's are' : ' is'} much weaker` : `The foe’s next attack${fx.hits > 1 ? 's are' : ' is'} weaker`); break;
        case 'confuse': out.push('The foe’s next attack hurts the foe too'); break;
        case 'skip': out.push(fx.n > 1 ? `The foe loses ${fx.n} turns` : 'The foe loses a turn'); break;
        case 'selfSkip': out.push('but you lose your next turn'); break;
        case 'haste': out.push('You act again right away'); break;
        case 'seal': out.push('The foe forgets how to use its last power for a while'); break;
        case 'dispel': out.push('Wipes away the foe’s shields, boosts and tricks'); break;
        case 'steal': out.push('You grab the foe’s shields and boosts'); break;
        case 'mark': out.push(fx.name === 'rage' ? 'The foe gets angrier (too much anger = boom!)' : fx.name === 'sleepy' ? 'The foe gets sleepier (3 yawns = asleep)' : fx.n < 0 ? 'You are less tired' : 'The foe is a bit more marked'); break;
        case 'cleanse': out.push('Clears bad effects from you'); break;
        case 'randomPower': out.push('Opens a random page: you use one of your other powers for free'); break;
      }
    }
    return out.map((s, i) => i === 0 ? s : s.charAt(0).toLowerCase() === s.charAt(0) ? s : s).join('. ').replace(/^./, c => c.toUpperCase()) + '.';
  }

  /* ============ the computer ============ */

  // how good is this position for `seat`? (HP, what is left to use, what is working on each side)
  function score(g, seat) {
    if (g.over) return g.winner === seat ? 1000 : g.winner === -1 ? 0 : -1000;
    const side = f => {
      let s = f.hp;
      f.kit.moves.forEach((m, i) => { s += Math.min(f.left[i], 2) * m.rate * 0.12; });
      if (f.guard) s += f.guard.p * f.guard.hits * 5;
      if (f.reflect) s += 8;
      if (f.vanish) s += 8 * f.vanish;
      if (f.boost) s += (f.boost.m - 1) * 10;
      if (f.pierce) s += 4;
      if (f.weak) s -= (1 - f.weak.m) * 12;
      if (f.confuse) s -= 5;
      s -= f.skip * 14;
      s -= f.marks.rage * 2.6 + f.marks.sleepy * 6 + f.marks.tired * 3;
      if (f.kit.q.needsWarm && !f.flags.warm) s -= 15;
      if (f.kit.q.needsGinger && !f.flags.ginger) s -= 15;
      return s;
    };
    return side(g.f[seat]) - side(g.f[1 - seat]);
  }

  function search(g, depth, root, alpha, beta) {
    if (g.over || depth === 0) return score(g, root);
    const maximizing = g.cur === root;
    let best = maximizing ? -Infinity : Infinity;
    for (const i of legal(g)) {
      const c = clone(g); c.rng = () => 0.5;
      act(c, i);
      const v = search(c, depth - 1, root, alpha, beta);
      if (maximizing) { if (v > best) best = v; if (best > alpha) alpha = best; }
      else { if (v < best) best = v; if (best < beta) beta = best; }
      if (beta <= alpha) break;
    }
    return best;
  }

  const LEVELS = { easy: { depth: 1, noise: 22 }, normal: { depth: 3, noise: 10 }, hard: { depth: 4, noise: 1.5 } };
  // level: 'easy' | 'normal' | 'hard'
  function pick(g, level = 'normal', rng = Math.random) {
    const L = LEVELS[level] || LEVELS.normal;
    const root = g.cur;
    const options = legal(g);
    let best = options[0], bestV = -Infinity;
    for (const i of options) {
      const c = clone(g); c.rng = () => 0.5;
      act(c, i);
      const v = search(c, L.depth - 1, root, -Infinity, Infinity) + (rng() - 0.5) * 2 * L.noise;
      if (v > bestV) { bestV = v; best = i; }
    }
    return best;
  }
  const randomPick = (g, rng = Math.random) => { const o = legal(g); return o[Math.floor(rng() * o.length)]; };

  const api = { MAX_HP, SECOND_BONUS, MAX_ROUNDS, RAGE_AT, SLEEP_AT, TIRED_AT, newGame, clone, legal, blocked, act, pick, randomPick, moveRate, kitRate, fxValue, hint, score };
  root.V2A = Object.assign(root.V2A || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
