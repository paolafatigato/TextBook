/**
 * ANIMAL FARM CARDS - rules engine (no DOM).
 *
 * RULES
 *  - 16 cards, 8 each. The deal is balanced: the cards are sorted by score and dealt in pairs of equal value.
 *  - Life 12. Grain (coins) each turn = your turn number + 2, max 8. A card costs its score in Grain.
 *  - Start: 3 cards in hand (the player who goes second gets 4), draw 1 at the start of each turn.
 *  - A card cannot attack on the turn it is played, and attacks once per turn.
 *  - ATTACK: choose an enemy card, then choose one of the 5 stats (like Top Trumps).
 *      attacker - defender >= 2  -> the defender is destroyed
 *      attacker - defender <= -2 -> the attacker is destroyed
 *      otherwise                 -> stand-off, nothing happens
 *  - If the enemy field is empty you hit the farm directly: Life loss = Power / 2 (rounded up).
 *  - After MAX_TURNS turns each, the higher Life wins.
 *
 * The game is run with FarmEngine.create({ human:[true,false], io }) and game.run().
 * Anything a human has to decide goes through the io object (see script.js); AI players decide here.
 */
(function (root) {
  'use strict';
  const CARDS_ = typeof CARDS !== 'undefined' ? CARDS : require('./cards.js').CARDS;
  const STATS_ = typeof STATS !== 'undefined' ? STATS : require('./cards.js').STATS;

  const CFG = { LIFE: 12, START_HAND: 3, SECOND_BONUS: 1, GRAIN_BASE: 2, GRAIN_MAX: 8, MAX_TURNS: 10, KILL: 2 };
  const KEYS = STATS_.map(s => s[0]);
  const BY = {};
  CARDS_.forEach(c => { BY[c.id] = c; });

  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function create(opt) {
    const io = opt.io || {};
    const human = opt.human || [false, false];
    const speed = opt.speed === undefined ? 1 : opt.speed;
    const names = opt.names || ['You', 'Robo'];

    const S = {
      turnNo: 0, cur: 0, over: false, winner: null, reason: '', log: [], used: {}, uid: 0,
      players: [0, 1].map(i => ({ name: names[i], life: CFG.LIFE, grain: 0, deck: [], hand: [], field: [], grave: [], turns: 0, penalty: 0, silencedUntil: -1, legacy: false })),
    };
    const P = i => S.players[i];
    const card = i => BY[i.id];
    const nm = i => BY[i.id].name;
    const isAnimal = i => card(i).kind === 'Animal';
    const pause = ms => (speed ? new Promise(r => setTimeout(r, ms * speed)) : Promise.resolve());
    // "You lose" but "Robo loses"; "your" but "Robo's"
    const V = (pi, verb) => (names[pi] !== 'You' ? verb : verb === 'has' ? 'have' : verb === 'loses' ? 'lose' : verb.replace(/s$/, ''));
    const POSS = pi => (names[pi] === 'You' ? 'your' : names[pi] + "'s");
    const changed = () => { if (io.render) io.render(S); };
    const log = msg => { S.log.push(msg); if (io.log) io.log(msg); changed(); };

    // ------------------------------------------------------------------ setup
    function deal() {
      const sorted = CARDS_.slice().sort((a, b) => a.score - b.score);
      for (let k = 0; k < sorted.length; k += 2) {
        const flip = rnd(2);
        P(flip).deck.push(sorted[k].id);
        P(1 - flip).deck.push(sorted[k + 1].id);
      }
      S.cur = rnd(2);
      [0, 1].forEach(i => {
        shuffle(P(i).deck);
        const n = CFG.START_HAND + (i === S.cur ? 0 : CFG.SECOND_BONUS);
        for (let k = 0; k < n; k++) P(i).hand.push(P(i).deck.pop());
      });
    }

    // ------------------------------------------------------------------ stats
    function stat(i, k) {
      const pl = P(i.owner);
      let v = card(i).stats[k] + (i.perm[k] || 0) + (i.temp[k] || 0);
      if (i.id === 'dogs' && k === 'power' && pl.field.some(x => x.id === 'napoleon')) v += 2;
      if (pl.legacy && isAnimal(i) && k === 'power') v += 1;
      return Math.max(0, v);
    }
    const silenced = pi => P(pi).silencedUntil >= S.turnNo;
    const onField = i => P(i.owner).field.includes(i);
    const canAttack = i => i.owner === S.cur && onField(i) && i.entered < S.turnNo && !i.attacked && !(i.noAtk >= S.turnNo);
    const bestMargin = (a, t) => Math.max(...KEYS.map(k => stat(a, k) - stat(t, k)));
    const bestStat = (a, t) => KEYS.reduce((b, k) => (stat(a, k) - stat(t, k) > stat(a, b) - stat(t, b) ? k : b), KEYS[0]);
    const worth = i => card(i).score + (S.used[i.id] ? 0 : 1);

    // ------------------------------------------------------------------ active powers
    const ACT = {
      jones: { once: true, targets: pi => P(1 - pi).field.filter(i => isAnimal(i) && stat(i, 'power') <= 4) },
      frederick: { once: true, targets: pi => P(1 - pi).field.filter(i => stat(i, 'productivity') >= 7) },
      napoleon: { once: true, targets: pi => P(1 - pi).field.filter(i => isAnimal(i) && stat(i, 'loyalty') <= 7) },
      mollie: { once: true, targets: pi => P(1 - pi).field.filter(i => !(i.noAtk >= S.turnNo + 1)) },
      benjamin: { once: true, need: pi => P(1 - pi).hand.length > 0 },
      sheep: { once: true },
      snowball: { once: false, targets: pi => P(pi).field },
    };
    // is this card's active power usable right now? (returns '' if yes, else the reason)
    function powerBlock(i) {
      const a = ACT[i.id];
      if (!a) return 'no active power';
      if (i.owner !== S.cur) return 'not your turn';
      if (silenced(i.owner)) return 'powers are silenced';
      if (a.once ? S.used[i.id] : i.usedTurn === S.turnNo) return a.once ? 'already used' : 'used this turn';
      if (a.targets && !a.targets(i.owner).length) return 'no target';
      if (a.need && !a.need(i.owner)) return 'nothing to use it on';
      return '';
    }
    // reactions: which of your cards could react right now?
    const reactor = (pi, id) => P(pi).field.find(x => x.id === id && !S.used[id] && !silenced(pi));

    // ------------------------------------------------------------------ helpers that ask a human (or decide for the AI)
    async function ask(pi, title, text, aiAnswer) {
      if (human[pi] && io.confirm) return io.confirm(pi, title, text);
      return aiAnswer;
    }

    function hurt(pi, n, why) {
      const pl = P(pi);
      pl.life = Math.max(0, pl.life - n);
      log(`${pl.name} ${V(pi,'loses')} ${n} Life (${why}).`);
      if (io.hit) io.hit(pi, n);
      checkOver();
    }
    function checkOver() {
      if (S.over) return;
      [0, 1].forEach(i => { if (P(i).life <= 0 && !S.over) { S.over = true; S.winner = 1 - i; S.reason = `${P(i).name} ${V(i,'has')} no Life left.`; } });
    }

    async function destroy(i, why) {
      if (!onField(i)) return false;
      const pl = P(i.owner);
      if (i.id === 'boxer' && !i.survived) {
        i.survived = true;
        KEYS.forEach(k => { i.perm[k] = (i.perm[k] || 0) - 2; });
        log(`Boxer survives: "I will work harder!" He loses 2 from every stat.`);
        return false;
      }
      if (pl.field.some(x => x.id === 'moses') && !S.used.moses && !silenced(i.owner)) {
        const yes = await ask(i.owner, 'Sugarcandy Mountain', `${nm(i)} is going to be destroyed (${why}). Send it back to your hand instead?`, true);
        if (yes) {
          S.used.moses = true;
          pl.field.splice(pl.field.indexOf(i), 1);
          pl.hand.push(i.id);
          log(`Moses sends ${nm(i)} to Sugarcandy Mountain: back to ${POSS(i.owner)} hand.`);
          return false;
        }
      }
      pl.field.splice(pl.field.indexOf(i), 1);
      pl.grave.push(i.id);
      log(`${nm(i)} is destroyed (${why}).`);
      if (io.gone) io.gone(i);
      if (i.id === 'major' && !pl.legacy) { pl.legacy = true; log(`Old Major's dream lives on: ${POSS(i.owner)} Animals get +1 Power for the rest of the game.`); }
      return true;
    }

    // ------------------------------------------------------------------ playing cards
    function canPlay(pi, id) {
      return pi === S.cur && P(pi).hand.includes(id) && BY[id].score <= P(pi).grain;
    }
    async function play(pi, id) {
      if (!canPlay(pi, id)) return false;
      const pl = P(pi), c = BY[id];
      pl.grain -= c.score;
      pl.hand.splice(pl.hand.indexOf(id), 1);
      const inst = { uid: ++S.uid, id, owner: pi, entered: S.turnNo, attacked: false, perm: {}, temp: {}, noAtk: -1, usedTurn: -1 };
      pl.field.push(inst);
      log(`${pl.name} ${V(pi,'plays')} ${c.name}.`);
      if (id === 'major') {
        if (pl.deck.length) { pl.hand.push(pl.deck.pop()); log(`${c.name} dreams of a better farm: ${pl.name} ${V(pi,'draws')} a card.`); }
        else log(`${c.name} dreams of a better farm, but the deck is empty.`);
      }
      if (id === 'rats') { P(1 - pi).penalty += 2; log(`The rats gnaw the sacks: ${P(1 - pi).name} will have 2 less Grain next turn.`); }
      return true;
    }

    // ------------------------------------------------------------------ using powers
    async function pickTarget(pi, title, list, aiPick) {
      if (human[pi] && io.pickTarget) return io.pickTarget(pi, title, list);
      return aiPick(list);
    }
    async function usePower(i, preset) {
      if (powerBlock(i)) return false;
      const pi = i.owner, a = ACT[i.id], pn = card(i).power.name, foe = P(1 - pi);
      let t = null, k = null;
      if (a.targets) {
        const list = a.targets(pi);
        t = preset && preset.target ? preset.target : await pickTarget(pi, `${nm(i)}: ${pn}`, list, l => l.slice().sort((x, y) => worth(y) - worth(x))[0]);
        if (!t) return false;
        if (i.id === 'snowball') {
          k = preset && preset.stat ? preset.stat : (human[pi] && io.pickStat ? await io.pickStat(pi, `Fiery Speech: which stat of ${nm(t)} gets +2?`, t) : KEYS[rnd(5)]);
          if (!k) return false;
        }
      }
      if (a.once) S.used[i.id] = true; else i.usedTurn = S.turnNo;
      switch (i.id) {
        case 'jones': log(`${nm(i)} fires his shotgun at ${nm(t)}!`); await destroy(t, 'shot by Mr Jones'); break;
        case 'frederick': log(`${nm(i)} blows up ${nm(t)} with dynamite!`); await destroy(t, 'dynamite'); break;
        case 'napoleon': log(`Napoleon accuses ${nm(t)} of treason: purged!`); await destroy(t, 'purged by Napoleon'); break;
        case 'mollie': t.noAtk = S.turnNo + 1; log(`Mollie shows her ribbons: ${nm(t)} cannot attack next turn.`); break;
        case 'sheep': foe.silencedUntil = S.turnNo + 1; log(`The sheep bleat "Four legs good!": ${POSS(1 - pi)} powers are silenced until the end of their next turn.`); break;
        case 'snowball': t.temp[k] = (t.temp[k] || 0) + 2; log(`Snowball's speech: ${nm(t)} gets +2 ${k} this turn.`); break;
        case 'benjamin': {
          if (io.peek && human[pi]) await io.peek(pi, foe.hand.slice());
          const top = foe.hand.slice().sort((x, y) => BY[y].score - BY[x].score)[0];
          foe.hand.splice(foe.hand.indexOf(top), 1); foe.grave.push(top);
          log(`Benjamin reads the wall and finds the plan: ${foe.name} ${V(1 - pi,'discards')} ${BY[top].name}.`);
          if (P(pi).deck.length) { P(pi).hand.push(P(pi).deck.pop()); log(`${P(pi).name} ${V(pi,'draws')} a card.`); }
          break;
        }
      }
      return true;
    }

    // ------------------------------------------------------------------ combat
    const rankFor = (m, side, attSide) => {   // how good is margin m (attacker - defender) for `side`? 2 = best
      const mine = side === attSide ? m : -m;
      return mine >= CFG.KILL ? 2 : mine <= -CFG.KILL ? 0 : 1;
    };

    async function attack(att, target) {
      const A = att.owner, D = 1 - A;
      att.attacked = true;
      if (!target) {
        const n = Math.ceil(stat(att, 'power') / 2);
        log(`${nm(att)} attacks the farm directly!`);
        if (io.direct) await io.direct(att, n);
        hurt(D, n, `hit by ${nm(att)}`);
        return;
      }
      log(`${nm(att)} attacks ${nm(target)}.`);

      // reaction: Clover cancels the attack
      const cl = target.id !== 'clover' && reactor(D, 'clover');
      if (cl) {
        const sqKills = reactor(D, 'squealer') && Math.max(...KEYS.map(k => stat(target, k) - stat(att, k))) >= CFG.KILL;
        const yes = await ask(D, 'Warning Whinny', `${nm(att)} attacks ${nm(target)}. Cancel the attack with Clover?`, bestMargin(att, target) >= CFG.KILL && !sqKills);
        if (yes) { S.used.clover = true; log(`Clover whinnies a warning: the attack is cancelled.`); return; }
      }
      // reaction: Squealer takes the choice of the stat
      let chooser = A;
      if (reactor(D, 'squealer')) {
        const yes = await ask(D, 'Black Is White', `${nm(att)} attacks ${nm(target)}. Let Squealer choose the stat instead of the attacker?`,
          Math.max(...KEYS.map(k => stat(target, k) - stat(att, k))) >= CFG.KILL || bestMargin(att, target) >= CFG.KILL);
        if (yes) { S.used.squealer = true; chooser = D; log(`Squealer talks: ${P(D).name} ${V(D,'chooses')} the stat!`); }
      }
      // choose the stat
      let k;
      if (human[chooser] && io.chooseStat) k = await io.chooseStat(chooser, att, target, chooser === D);
      else k = chooser === A ? bestStat(att, target) : KEYS.reduce((b, x) => (stat(target, x) - stat(att, x) > stat(target, b) - stat(att, b) ? x : b), KEYS[0]);

      // Ace of Spades
      let bA = 0, bD = 0;
      for (const side of [D, A]) {
        const pk = [att, target].find(x => x.id === 'pilkington' && x.owner === side);
        if (!pk || S.used.pilkington || silenced(side)) continue;
        const m = stat(att, k) + bA - stat(target, k) - bD;
        const gain = side === A ? 4 : -4;
        const better = rankFor(m + gain, side, A) > rankFor(m, side, A);
        const yes = await ask(side, 'Ace of Spades', `${nm(att)} ${stat(att, k) + bA} vs ${nm(target)} ${stat(target, k) + bD} (${k}). Pilkington cheats: +4 for him?`, better);
        if (yes) { S.used.pilkington = true; if (side === A) bA = 4; else bD = 4; log(`Pilkington plays the Ace of Spades: +4 ${k}!`); }
      }

      const a = stat(att, k) + bA, d = stat(target, k) + bD, m = a - d;
      const result = m >= CFG.KILL ? 'win' : m <= -CFG.KILL ? 'lose' : 'tie';
      log(`${k.toUpperCase()}: ${nm(att)} ${a} vs ${nm(target)} ${d}.`);
      if (io.duel) await io.duel({ att, target, k, a, d, result, chooser });
      if (result === 'win') {
        const gone = await destroy(target, `lost the ${k} duel`);
        if (gone && att.id === 'dogs') hurt(D, 2, 'the dogs spread fear');
      } else if (result === 'lose') {
        const gone = await destroy(att, `lost the ${k} duel`);
        if (gone && target.id === 'dogs') hurt(A, 2, 'the dogs spread fear');
      } else {
        log(`Stand-off: nobody is destroyed.`);
      }
    }

    // ------------------------------------------------------------------ AI
    async function aiTurn(pi) {
      const pl = P(pi), foe = P(1 - pi);
      await pause(700);
      // 1. play cards: hens first, then the most expensive card it can pay
      for (let guard = 0; guard < 10 && !S.over; guard++) {
        const opts = pl.hand.filter(id => BY[id].score <= pl.grain);
        if (!opts.length) break;
        opts.sort((x, y) => (BY[y].score + (y === 'hens' ? 9 : 0)) - (BY[x].score + (x === 'hens' ? 9 : 0)));
        await play(pi, opts[0]);
        await pause(600);
      }
      // 2. powers
      const use = async (i, preset) => { if (await usePower(i, preset)) await pause(700); };
      for (const i of pl.field.slice()) {
        if (S.over || powerBlock(i)) continue;
        const list = ACT[i.id].targets ? ACT[i.id].targets(pi).slice().sort((x, y) => worth(y) - worth(x)) : [];
        switch (i.id) {
          case 'jones': if (list[0] && card(list[0]).score >= 2) await use(i, { target: list[0] }); break;
          case 'frederick': if (list[0] && card(list[0]).score >= 2) await use(i, { target: list[0] }); break;
          case 'napoleon': if (list[0] && card(list[0]).score >= 3) await use(i, { target: list[0] }); break;
          case 'mollie': if (list[0] && card(list[0]).score >= 3) await use(i, { target: list[0] }); break;
          case 'benjamin': await use(i); break;
          case 'sheep': if (foe.field.some(x => !S.used[x.id] && ['clover', 'squealer', 'moses', 'pilkington', 'napoleon', 'jones', 'frederick', 'mollie', 'benjamin'].includes(x.id))) await use(i); break;
        }
      }
      // 3. attacks
      for (let guard = 0; guard < 12 && !S.over; guard++) {
        const atk = pl.field.filter(canAttack);
        if (!atk.length) break;
        let best = null;
        if (!foe.field.length) {
          best = { a: atk.slice().sort((x, y) => stat(y, 'power') - stat(x, 'power'))[0], t: null };
        } else {
          const sq = !!reactor(1 - pi, 'squealer');
          const risky = (a, t) => sq && Math.max(...KEYS.map(k => stat(t, k) - stat(a, k))) >= CFG.KILL;
          let bestVal = -1;
          for (const a of atk) for (const t of foe.field) {
            const m = bestMargin(a, t);
            if (m < CFG.KILL || risky(a, t)) continue;
            const val = worth(t) * 3 + m - card(a).score * 0.1;
            if (val > bestVal) { bestVal = val; best = { a, t }; }
          }
          if (!best) {
            // Snowball's speech could turn a stand-off into a win
            const sn = pl.field.find(x => x.id === 'snowball' && !powerBlock(x));
            let found = null;
            if (sn) {
              let bv = -1;
              for (const a of atk) for (const t of foe.field) for (const k of KEYS) {
                if (risky(a, t) || stat(a, k) + 2 - stat(t, k) < CFG.KILL || bestMargin(a, t) >= CFG.KILL) continue;
                const val = worth(t);
                if (val > bv) { bv = val; found = { a, t, k }; }
              }
            }
            if (found) { await use(sn, { target: found.a, stat: found.k }); continue; }
          }
        }
        if (!best) break;
        await attack(best.a, best.t);
        await pause(500);
      }
    }

    // ------------------------------------------------------------------ turns
    async function humanTurn(pi) {
      while (!S.over) {
        const a = await io.mainAction(pi);
        if (!a || a.type === 'end') break;
        const pl = P(pi);
        if (a.type === 'play') await play(pi, a.id);
        else {
          const i = pl.field.find(x => x.uid === a.uid);
          if (!i) continue;
          if (a.type === 'attack' && canAttack(i)) {
            const t = a.target == null ? null : P(1 - pi).field.find(x => x.uid === a.target);
            if (a.target == null ? P(1 - pi).field.length === 0 : !!t) await attack(i, t);
          } else if (a.type === 'power') await usePower(i);
        }
        changed();
      }
    }

    async function turn() {
      const pi = S.cur, pl = P(pi);
      S.turnNo++; pl.turns++;
      let g = Math.min(CFG.GRAIN_MAX, pl.turns + CFG.GRAIN_BASE);
      if (pl.field.some(x => x.id === 'hens')) { g += 1; }
      g = Math.max(0, g - pl.penalty);
      const lost = pl.penalty; pl.penalty = 0;
      pl.grain = g;
      pl.field.forEach(x => { x.attacked = false; });
      if (pl.deck.length) pl.hand.push(pl.deck.pop());
      log(`— Turn ${pl.turns}: ${pl.name} ${V(pi,'has')} ${g} Grain${lost ? ` (${lost} gnawed by rats)` : ''}${pl.field.some(x => x.id === 'hens') ? ' (+1 eggs)' : ''}. —`);
      if (io.turnStart) await io.turnStart(pi);
      if (human[pi]) await humanTurn(pi); else await aiTurn(pi);
      [0, 1].forEach(i => P(i).field.forEach(x => { x.temp = {}; }));
      S.cur = 1 - pi;
      changed();
    }

    function limitResult() {
      const a = P(0), b = P(1);
      S.over = true;
      if (a.life !== b.life) { S.winner = a.life > b.life ? 0 : 1; S.reason = `Time is up: ${P(S.winner).name} ${V(S.winner,'has')} more Life.`; return; }
      const sc = p => p.field.reduce((n, x) => n + BY[x.id].score, 0) + p.hand.reduce((n, id) => n + BY[id].score, 0);
      if (sc(a) !== sc(b)) { S.winner = sc(a) > sc(b) ? 0 : 1; S.reason = `Time is up, same Life: ${P(S.winner).name} ${V(S.winner,'has')} the stronger cards left.`; return; }
      S.winner = null; S.reason = 'Time is up: a draw.';
    }

    async function run() {
      deal();
      changed();
      while (!S.over) {
        await turn();
        if (S.over) break;
        if (P(0).turns >= CFG.MAX_TURNS && P(1).turns >= CFG.MAX_TURNS) limitResult();
      }
      log(S.winner === null ? S.reason : `${P(S.winner).name} ${V(S.winner,'wins')}! ${S.reason}`);
      if (io.end) io.end(S);
      return S;
    }

    return { S, CFG, run, stat, canAttack, canPlay, powerBlock, reactor, silenced, bestMargin };
  }

  const api = { create, CFG, KEYS, BY };
  if (typeof module !== 'undefined') module.exports = api; else root.FarmEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
