/**
 * ANIMAL FARM CARDS - rules engine (no DOM).
 *
 * GOAL: win the farm. Every card is worth its score in POWER (the 16 cards are worth 50): control 26 or more.
 * Cards never die: a card that is beaten goes back to the MARKET, where anybody can buy it.
 *
 * TURN
 *  1. Harvest: you get 1 Grain, plus the Grain your cards produce (ceil(Productivity / 4) each, effects may add more).
 *  2. Actions, in any order:
 *       - buy ONE card from the Market: it costs its score in Grain (effects can change the price);
 *       - attack with the cards that were on your field at the start of your turn (1 Grain each):
 *         Attack > Defense and the enemy card goes back to the Market. A card bought during the last enemy turn is safe;
 *       - use effects. Loyalty and Kindness are only used here: "enemy cards with Loyalty 3 or less cost just 1 Grain".
 *  3. The Market is filled up to 5 cards.
 * After MAX_TURNS turns each, the player with more Power wins.
 *
 * Run it with FarmEngine.create({ human:[true,false], io }).run(). What a human decides goes through the io object
 * (see script.js); the AI decides here.
 */
(function (root) {
  'use strict';
  const CARDS_ = typeof CARDS !== 'undefined' ? CARDS : require('./cards.js').CARDS;
  const STATS_ = typeof STATS !== 'undefined' ? STATS : require('./cards.js').STATS;

  const DEFAULTS = { TARGET: 26, START_GRAIN: 2, SECOND_BONUS: 1, BASE_INCOME: 1, MARKET: 5, MAX_TURNS: 12, ATTACK_COST: 2, ATTACKS: 1, MARGIN: 2, BUYS: 1 };
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
    const CFG = Object.assign({}, DEFAULTS, opt.cfg || {});

    const S = {
      turnNo: 0, cur: 0, over: false, winner: null, reason: '', log: [], used: {}, uid: 0, market: [], pile: [],
      players: [0, 1].map(i => ({ name: names[i], grain: 0, field: [], turns: 0, bought: 0, attacks: 0, silencedUntil: -1 })),
    };
    const P = i => S.players[i];
    const card = i => BY[i.id];
    const nm = i => BY[i.id].name;
    const isAnimal = i => card(i).kind === 'Animal';
    const pause = ms => (speed ? new Promise(r => setTimeout(r, ms * speed)) : Promise.resolve());
    const changed = () => { if (io.render) io.render(S); };
    const log = msg => { S.log.push(msg); if (io.log) io.log(msg); changed(); };
    // "You lose" but "Robo loses"; "your" but "Robo's"
    const V = (pi, verb) => (names[pi] !== 'You' ? verb : verb === 'has' ? 'have' : verb === 'loses' ? 'lose' : verb.replace(/s$/, ''));
    const POSS = pi => (names[pi] === 'You' ? 'your' : names[pi] + "'s");

    // ------------------------------------------------------------------ setup
    function deal() {
      const ids = shuffle(CARDS_.map(c => c.id));
      const cheap = ids.filter(id => BY[id].score <= 2).slice(0, 2);      // the Market always starts with 2 cheap cards
      const rest = ids.filter(id => !cheap.includes(id));
      S.market = cheap.concat(rest.slice(0, CFG.MARKET - 2));
      S.pile = rest.slice(CFG.MARKET - 2);
      S.cur = rnd(2);
      [0, 1].forEach(i => { P(i).grain = CFG.START_GRAIN + (i === S.cur ? 0 : CFG.SECOND_BONUS); });
    }
    const refill = () => { while (S.market.length < CFG.MARKET && S.pile.length) S.market.push(S.pile.pop()); };

    // ------------------------------------------------------------------ stats, grain, power
    const has = (pi, id) => P(pi).field.some(x => x.id === id);
    function stat(i, k) {
      let v = card(i).stats[k] + (i.perm[k] || 0) + (i.temp[k] || 0);
      if (i.id === 'dogs' && k === 'attack' && has(i.owner, 'napoleon')) v += 2;
      return Math.max(0, v);
    }
    const income = i => Math.ceil(stat(i, 'productivity') / 4) + (has(i.owner, 'major') && stat(i, 'loyalty') >= 8 ? 1 : 0);
    const incomeOf = pi => CFG.BASE_INCOME + (has(pi, 'hens') ? 1 : 0) + P(pi).field.reduce((n, i) => n + income(i), 0);
    const power = pi => P(pi).field.reduce((n, i) => n + BY[i.id].score, 0);
    const silenced = pi => P(pi).silencedUntil >= S.turnNo;
    const onField = i => P(i.owner).field.includes(i);

    // price of a Market card for a player
    function price(pi, id) {
      let p = BY[id].cost !== undefined ? BY[id].cost : BY[id].score;
      if (has(pi, 'moses') && BY[id].stats.kindness <= 5) p = Math.max(1, p - 1);
      return p;
    }
    const buyGuard = t => has(t.owner, 'benjamin') && stat(t, 'loyalty') <= 3;          // enemy effects cannot buy it
    const atkGuard = t => has(t.owner, 'clover') && stat(t, 'kindness') >= 7;           // it cannot be attacked
    const attackable = t => t.entered <= S.turnNo - 2;                                  // a card bought last turn is safe

    function checkOver() {
      if (S.over) return;
      for (const i of [0, 1]) {
        if (power(i) >= CFG.TARGET) { S.over = true; S.winner = i; S.reason = `${P(i).name} ${V(i, 'has')} ${power(i)} Power: the farm is ${POSS(i)}.`; return; }
      }
    }
    const newInst = (id, pi, old) => ({ uid: ++S.uid, id, owner: pi, entered: S.turnNo, attacked: false, perm: old ? Object.assign({}, old.perm) : {}, temp: {}, usedTurn: -1, survived: old ? old.survived : false });

    // a card goes back to the Market. Returns false if it stays (Boxer).
    function sendToMarket(i, why) {
      if (!onField(i)) return false;
      if (i.id === 'boxer' && !i.survived) {
        i.survived = true; i.perm.attack = (i.perm.attack || 0) - 2;
        log(`Boxer stays: "I will work harder!" He loses 2 Attack for the rest of the game.`);
        return false;
      }
      P(i.owner).field.splice(P(i.owner).field.indexOf(i), 1);
      S.market.push(i.id);
      log(`${nm(i)} goes back to the Market (${why}).`);
      checkOver();
      return true;
    }

    // ------------------------------------------------------------------ buying
    const canBuy = (pi, id) => !(CFG.BAN0 && pi === 0 && id === CFG.BAN0) && pi === S.cur && !S.over && S.market.includes(id) && P(pi).bought < CFG.BUYS && P(pi).grain >= price(pi, id);
    function buy(pi, id) {
      if (!canBuy(pi, id)) return false;
      const pr = price(pi, id);
      P(pi).grain -= pr; P(pi).bought++;
      S.market.splice(S.market.indexOf(id), 1);
      P(pi).field.push(newInst(id, pi));
      log(`${P(pi).name} ${V(pi, 'buys')} ${BY[id].name} for ${pr} Grain.`);
      checkOver();
      return true;
    }
    function takeCard(pi, t, pr) {
      P(pi).grain -= pr;
      P(t.owner).field.splice(P(t.owner).field.indexOf(t), 1);
      P(pi).field.push(newInst(t.id, pi, t));
      log(`${P(pi).name} ${V(pi, 'buys')} ${nm(t)} from ${P(1 - pi).name} for ${pr} Grain!`);
      checkOver();
    }

    // ------------------------------------------------------------------ effects
    const foeBuy = (pred, cost) => ({ once: 'turn', cost, targets: pi => P(1 - pi).field.filter(t => pred(t) && !buyGuard(t) && P(pi).grain >= cost(t)) });
    const ACT = {
      rats: { once: 'turn', need: pi => P(1 - pi).grain > 0 },
      sheep: { once: 'game' },
      jones: { once: 'game', targets: pi => P(1 - pi).field.filter(i => isAnimal(i) && stat(i, 'defense') <= 4) },
      frederick: { once: 'game', targets: pi => P(1 - pi).field.filter(i => stat(i, 'productivity') >= 7) },
      mollie: foeBuy(t => stat(t, 'loyalty') <= 3, t => BY[t.id].score + 1),
      squealer: foeBuy(t => stat(t, 'kindness') <= 4, t => BY[t.id].score + 1),
      napoleon: foeBuy(t => stat(t, 'loyalty') <= 3, () => 1),
      pilkington: { once: 'game', market: true, targets: pi => (P(pi).grain >= 1 ? S.market.filter(id => BY[id].stats.kindness <= 4).map(id => 'm:' + id) : []) },
      snowball: { once: 'turn', targets: pi => P(pi).field },
    };
    // '' if the effect of this card can be used now, otherwise the reason
    function powerBlock(i) {
      const a = ACT[i.id];
      if (!a) return 'no effect to use';
      if (i.owner !== S.cur) return 'not your turn';
      if (silenced(i.owner)) return 'effects are silenced';
      if (a.once === 'game' ? S.used[i.id] : i.usedTurn === S.turnNo) return a.once === 'game' ? 'already used' : 'used this turn';
      if (a.targets && !a.targets(i.owner).length) return 'no target (or not enough Grain)';
      if (a.need && !a.need(i.owner)) return 'nothing to use it on';
      return '';
    }

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
        t = preset && preset.target ? preset.target : await pickTarget(pi, `${nm(i)}: ${pn}`, list, l => l[0]);
        if (!t) return false;
        if (i.id === 'snowball') {
          k = preset && preset.stat ? preset.stat : (human[pi] && io.pickStat ? await io.pickStat(pi, `Fiery Speech: +2 to which stat of ${nm(t)}?`, ['attack', 'defense']) : 'attack');
          if (!k) return false;
        }
      }
      if (a.once === 'game') S.used[i.id] = true; else i.usedTurn = S.turnNo;
      switch (i.id) {
        case 'rats': foe.grain = Math.max(0, foe.grain - 1); log(`The rats gnaw the sacks: ${foe.name} ${V(1 - pi, 'loses')} 1 Grain.`); break;
        case 'sheep': foe.silencedUntil = S.turnNo + 1; log(`The sheep bleat "Four legs good!": ${POSS(1 - pi)} effects are silenced until the end of their next turn.`); break;
        case 'jones': log(`Mr Jones fires his shotgun at ${nm(t)}!`); sendToMarket(t, 'shot'); break;
        case 'frederick': log(`Mr Frederick blows up ${nm(t)} with dynamite!`); sendToMarket(t, 'dynamite'); break;
        case 'mollie': case 'squealer': case 'napoleon': takeCard(pi, t, a.cost(t)); break;
        case 'pilkington': {
          const id = t.slice(2);
          S.market.splice(S.market.indexOf(id), 1);
          P(pi).grain -= 1;
          P(pi).field.push(newInst(id, pi));
          log(`Pilkington plays the Ace of Spades: ${P(pi).name} ${V(pi, 'buys')} ${BY[id].name} for 1 Grain.`);
          checkOver();
          break;
        }
        case 'snowball': t.temp[k] = (t.temp[k] || 0) + 2; log(`Snowball's speech: ${nm(t)} gets +2 ${k} this turn.`); break;
      }
      return true;
    }

    // ------------------------------------------------------------------ attacking
    const attackTargets = att => P(1 - att.owner).field.filter(t => attackable(t) && !atkGuard(t));
    const canAttack = att => att.id !== 'napoleon' && att.owner === S.cur && !S.over && onField(att) && att.entered < S.turnNo && !att.attacked && P(att.owner).grain >= CFG.ATTACK_COST && P(att.owner).attacks < CFG.ATTACKS && attackTargets(att).length > 0;

    async function attack(att, t) {
      const A = att.owner, D = 1 - A;
      P(A).grain -= CFG.ATTACK_COST;
      att.attacked = true; P(A).attacks++;
      const a = stat(att, 'attack'), d = stat(t, 'defense');
      log(`${nm(att)} attacks ${nm(t)}: Attack ${a} vs Defense ${d}.`);
      const win = a - d >= CFG.MARGIN;
      if (io.duel) await io.duel({ att, target: t, a, d, win });
      if (win) {
        const gone = sendToMarket(t, 'beaten');
        if (gone && att.id === 'dogs') { P(D).grain = Math.max(0, P(D).grain - 2); log(`The dogs spread fear: ${P(D).name} ${V(D, 'loses')} 2 Grain.`); }
      } else log(`The attack fails.`);
    }

    // ------------------------------------------------------------------ AI
    const worth = i => BY[i.id].score + income(i) * 0.5;
    function buyValue(pi, id) {
      const c = BY[id], pl = P(pi);
      const econ = Math.max(0, 7 - pl.turns) * 0.6;
      const inc = Math.ceil(c.stats.productivity / 4) + (id === 'hens' ? 1 : 0) + (id === 'major' ? 1 : 0);
      return c.score + econ * inc + (id === 'napoleon' ? 1.5 : id === 'squealer' ? 0.5 : id === 'clover' ? 0.5 : 0);
    }
    async function aiTurn(pi) {
      const pl = P(pi), foe = P(1 - pi);
      await pause(700);
      const use = async (i, preset) => { if (await usePower(i, preset)) await pause(700); };
      // 1. effects
      for (const i of pl.field.slice()) {
        if (S.over || powerBlock(i)) continue;
        const a = ACT[i.id];
        const list = a.targets ? a.targets(pi) : [];
        switch (i.id) {
          case 'rats': await use(i); break;
          case 'sheep': if (foe.field.some(x => ACT[x.id] && ACT[x.id].targets && !(ACT[x.id].once === 'game' ? S.used[x.id] : false))) await use(i); break;
          case 'jones': case 'frederick': {
            const best = list.slice().sort((x, y) => worth(y) - worth(x))[0];
            if (best && worth(best) >= 3.5) await use(i, { target: best });
            break;
          }
          case 'mollie': case 'squealer': case 'napoleon': {
            const best = list.slice().sort((x, y) => (worth(y) - a.cost(y)) - (worth(x) - a.cost(x)))[0];
            if (best && worth(best) - a.cost(best) >= 1) await use(i, { target: best });
            break;
          }
          case 'pilkington': {
            const best = list.slice().sort((x, y) => buyValue(pi, y.slice(2)) - buyValue(pi, x.slice(2)))[0];
            if (best && buyValue(pi, best.slice(2)) >= 3) await use(i, { target: best });
            break;
          }
        }
      }
      // 2. attacks
      for (let guard = 0; guard < 12 && !S.over; guard++) {
        const atk = pl.field.filter(canAttack);
        if (!atk.length) break;
        let best = null, bv = 0;
        for (const a of atk) for (const t of attackTargets(a)) {
          if (stat(a, 'attack') - stat(t, 'defense') < CFG.MARGIN) continue;
          const val = BY[t.id].score * 2 + income(t) * 0.5;
          if (val > bv && val >= 3) { bv = val; best = { a, t }; }
        }
        if (!best) {
          const sn = pl.field.find(x => x.id === 'snowball' && !powerBlock(x));
          let found = null;
          if (sn) {
            let fv = 0;
            for (const a of atk) for (const t of attackTargets(a)) {
              if (stat(a, 'attack') + 2 - stat(t, 'defense') < CFG.MARGIN) continue;
              const val = BY[t.id].score * 2 + income(t) * 0.5;
              if (val > fv && val >= 3) { fv = val; found = { a, t }; }
            }
          }
          if (found) { await use(sn, { target: found.a, stat: 'attack' }); continue; }
          break;
        }
        await attack(best.a, best.t);
        await pause(500);
      }
      // 3. buy (the cards that were just beaten are in the Market too)
      if (!S.over && pl.bought < CFG.BUYS) {
        const opts = S.market.filter(id => canBuy(pi, id)).sort((x, y) => buyValue(pi, y) - buyValue(pi, x));
        const best = opts[0];
        if (best) {
          const wait = BY[best].score <= 1 && S.market.some(id => BY[id].score >= 4 && price(pi, id) <= pl.grain + incomeOf(pi) - 1);
          if (!wait) { buy(pi, best); await pause(600); }
        }
      }
    }

    // ------------------------------------------------------------------ turns
    async function humanTurn(pi) {
      while (!S.over) {
        const a = await io.mainAction(pi);
        if (!a || a.type === 'end') break;
        if (a.type === 'buy') buy(pi, a.id);
        else {
          const i = P(pi).field.find(x => x.uid === a.uid);
          if (!i) continue;
          if (a.type === 'attack' && canAttack(i)) {
            const t = P(1 - pi).field.find(x => x.uid === a.target);
            if (t && attackTargets(i).includes(t)) await attack(i, t);
          } else if (a.type === 'power') await usePower(i);
        }
        changed();
      }
    }

    async function turn() {
      const pi = S.cur, pl = P(pi);
      S.turnNo++; pl.turns++; pl.bought = 0; pl.attacks = 0;
      pl.field.forEach(x => { x.attacked = false; });
      const inc = incomeOf(pi);
      pl.grain += inc;
      log(`— Turn ${pl.turns}: ${pl.name} ${V(pi, 'gets')} ${inc} Grain (${pl.grain} in all). —`);
      if (human[pi]) await humanTurn(pi); else await aiTurn(pi);
      [0, 1].forEach(i => P(i).field.forEach(x => { x.temp = {}; }));
      refill();
      S.cur = 1 - pi;
      changed();
    }

    function limitResult() {
      const a = power(0), b = power(1);
      S.over = true;
      if (a !== b) { S.winner = a > b ? 0 : 1; S.reason = `Time is up: ${P(S.winner).name} ${V(S.winner, 'has')} more Power (${Math.max(a, b)} to ${Math.min(a, b)}).`; return; }
      if (P(0).grain !== P(1).grain) { S.winner = P(0).grain > P(1).grain ? 0 : 1; S.reason = `Time is up, same Power: ${P(S.winner).name} ${V(S.winner, 'has')} more Grain.`; return; }
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
      log(S.winner === null ? S.reason : `${P(S.winner).name} ${V(S.winner, 'wins')}! ${S.reason}`);
      if (io.end) io.end(S);
      return S;
    }

    return { S, CFG, run, stat, income, incomeOf, power, price, canBuy, canAttack, attackTargets, powerBlock, silenced, atkGuard, buyGuard, attackable };
  }

  const api = { create, CFG: DEFAULTS, KEYS, BY, ACT_IDS: ['rats', 'sheep', 'jones', 'frederick', 'mollie', 'squealer', 'napoleon', 'pilkington', 'snowball'] };
  if (typeof module !== 'undefined') module.exports = api; else root.FarmEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
