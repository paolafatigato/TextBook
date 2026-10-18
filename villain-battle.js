// Villain Battle ([pers-villain-powers:L]): the pupil's tiny villain fights a random hero.
//
// Three ways to play: villain vs a random hero (1 player), villain vs villain on one computer (passing it),
// or villain vs villain online, each on their own device with a 4-letter room code (rooms live in cloud.js).
// The pupil picks 3 flaws, reads the 6 powers of each flaw and chooses 3 of them as the villain's special attacks.
// The hero only has attacks that come from virtues.
// The pupil can read what an attack does, but never how many points it is worth:
// the numbers (`fx`) live in this file only, and the descriptions have to give a hint about them.
//
// How to add things:
//   a power  → one line in ATTACKS (6 per flaw): P(name, story, archetype); the archetype fixes the numbers (ARCH)
//   a hero   → one entry in HEROES (4 attacks, all from virtues)
//
// An attack is { name, desc, uses, fx: [ … ] } where fx is a list of effects:
//   { k: 'dmg', v }                  damage
//   { k: 'chaos', a, b }             damage between a and b
//   { k: 'drain', v, heal }          damage and the user heals
//   { k: 'recoil', v }               the user is hurt too
//   { k: 'heal', v }                 the user heals
//   { k: 'guard', p, hits }          the next `hits` hits on the user do p less (p = 1: none)
//   { k: 'reflect', p, hits }        the next `hits` hits on the user go back to the attacker (p = how much)
//   { k: 'weak', m, hits }           the foe's next `hits` damaging attacks are multiplied by m (< 1)
//   { k: 'boost', m, hits }          the user's next `hits` damaging attacks are multiplied by m (> 1)
//   { k: 'skip', n }                 the foe cannot act for n turns

(() => {
  const MAX_HP = 60;

  /* ================= data ================= */

  const FLAW_GROUPS = [
    { name: 'Disorganized', color: '#c9de3c', flaws: [['messy', 'Messy'], ['chaotic', 'Chaotic'], ['forgetful', 'Forgetful'], ['alwayslate', 'Always late'], ['distracted', 'Distracted']] },
    { name: 'Feelings', color: '#4aa8ec', flaws: [['shy', 'Shy'], ['anxious', 'Anxious'], ['touchy', 'Touchy'], ['pessimistic', 'Pessimistic'], ['hottempered', 'Hot-tempered']] },
    { name: 'Attitude to others', color: '#f96d5a', flaws: [['bossy', 'Bossy'], ['pushy', 'Pushy'], ['arrogant', 'Arrogant'], ['greedy', 'Greedy'], ['superficial', 'Superficial'], ['clingy', 'Clingy'], ['chatty', 'Chatty']] },
    { name: 'Will & energy', color: '#c08be8', flaws: [['lazy', 'Lazy'], ['impatient', 'Impatient'], ['stubborn', 'Stubborn'], ['indecisive', 'Indecisive']] },
  ];

  // A power is written as its story + the archetype it belongs to. The archetype fixes the numbers
  // (damage, uses…) and adds a sentence that gives a hint about its strength, so that the pupil can judge
  // from the description alone ("small, quick hit", "strong hit", "huge hit, but you get burned too"…).
  const ARCH = {
    small:     { uses: 4, fx: [{ k: 'dmg', v: 11 }], hint: 'A small, quick hit you can use again and again.' },
    medium:    { uses: 3, fx: [{ k: 'dmg', v: 15 }], hint: 'A solid hit you can use a few times.' },
    strong:    { uses: 2, fx: [{ k: 'dmg', v: 19 }], hint: 'A strong hit.' },
    huge:      { uses: 2, fx: [{ k: 'dmg', v: 26 }, { k: 'recoil', v: 8 }], hint: 'A huge hit, but you get burned too.' },
    double:    { uses: 2, fx: [{ k: 'dmg', v: 20 }], hint: 'Two hits at once!' },
    chaos:     { uses: 3, fx: [{ k: 'chaos', a: 3, b: 29 }], hint: 'It could be a tickle or a huge blast. Who knows?' },
    hitWeak:   { uses: 2, fx: [{ k: 'dmg', v: 14 }, { k: 'weak', m: .6, hits: 1 }], hint: 'A medium hit, and the hero’s next attack comes out weaker.' },
    hitSkip:   { uses: 1, fx: [{ k: 'dmg', v: 12 }, { k: 'skip', n: 1 }], hint: 'A small hit, but the hero cannot move next turn.' },
    drain:     { uses: 2, fx: [{ k: 'drain', v: 12, heal: 10 }], hint: 'You hurt the hero a bit and you heal a bit.' },
    skip:      { uses: 1, fx: [{ k: 'skip', n: 2 }], hint: 'The hero is dizzy and cannot act for two turns.' },
    weakBig:   { uses: 2, fx: [{ k: 'weak', m: .1, hits: 1 }], hint: 'The hero’s next attack is almost harmless.' },
    weakTwo:   { uses: 1, fx: [{ k: 'weak', m: .4, hits: 2 }], hint: 'The hero’s next two attacks are much weaker.' },
    boostBig:  { uses: 2, fx: [{ k: 'boost', m: 2.4, hits: 1 }], hint: 'Your next attack will be twice as strong, or more!' },
    boostTwo:  { uses: 1, fx: [{ k: 'boost', m: 1.6, hits: 2 }], hint: 'Your next two attacks are much stronger.' },
    guardFull: { uses: 2, fx: [{ k: 'guard', p: 1, hits: 1 }], hint: 'It blocks the next attack completely.' },
    guardMost: { uses: 2, fx: [{ k: 'guard', p: .9, hits: 1 }], hint: 'The next attack will hardly hurt you.' },
    guardLong: { uses: 1, fx: [{ k: 'guard', p: .6, hits: 2 }], hint: 'The next two attacks do much less damage to you.' },
    reflect:   { uses: 1, fx: [{ k: 'reflect', p: .9, hits: 1 }], hint: 'The next attack goes straight back to the hero.' },
    sneak:     { uses: 1, fx: [{ k: 'guard', p: 1, hits: 1 }, { k: 'boost', m: 1.5, hits: 1 }], hint: 'The next attack cannot touch you, and your next attack is stronger.' },
    healS:     { uses: 3, fx: [{ k: 'heal', v: 15 }], hint: 'You heal a little.' },
    healM:     { uses: 2, fx: [{ k: 'heal', v: 20 }], hint: 'You heal a good amount.' },
    healB:     { uses: 1, fx: [{ k: 'heal', v: 26 }], hint: 'You heal a lot, but only once.' },
  };
  // `story` is what the pupil reads when choosing (no hint, they decide how strong it is); `desc` = story + hint, shown in the fight
  const P = (name, story, arch) => ({ name, uses: ARCH[arch].uses, story, desc: `${story} ${ARCH[arch].hint}`, fx: ARCH[arch].fx, arch });

  // six powers for each flaw (key = the flaw's key in FLAW_GROUPS)
  const ATTACKS = {
    messy: [
      P('Clutter Storm', 'A whirlwind of junk hits the hero and confuses it.', 'hitWeak'),
      P('Chaos Trail', 'Small hazards appear behind you everywhere you walk.', 'medium'),
      P('Junk Wall', 'You pile up trash into a messy wall.', 'guardMost'),
      P('Pocket Surprise', 'You throw everything that is in your pockets.', 'small'),
      P('Lost & Found', 'You find your lost snack in the mess.', 'healS'),
      P('Avalanche of Stuff', 'Everything on your desk falls on the hero.', 'strong'),
    ],
    chaotic: [
      P('Random Roll', 'Every attack you make is different.', 'chaos'),
      P('Wild Card', 'You change one rule of the fight, just once.', 'weakBig'),
      P('Spin the Room', 'The whole room starts to spin.', 'skip'),
      P('Surprise Shield', 'A shield appears, but nobody knows why.', 'guardFull'),
      P('Mayhem Burst', 'You make a big, messy explosion.', 'huge'),
      P('Lucky Break', 'Something lucky happens at the right time.', 'healS'),
    ],
    forgetful: [
      P('Memory Wipe', 'One touch and the hero forgets why it was fighting.', 'weakBig'),
      P('Blank Slate', 'You forget pain and fear on command.', 'healS'),
      P('Where Was I?', 'The hero forgets what it was doing and just stands there.', 'skip'),
      P('Flying Homework', 'You throw all the homework you forgot to do.', 'medium'),
      P('Fog of Forgetting', 'A gray fog makes the hero forget its next moves.', 'weakTwo'),
      P('Forgotten Fireball', 'You forgot you had it! A sudden blast.', 'strong'),
    ],
    alwayslate: [
      P('Delay Field', 'The hero’s attacks always arrive one second too late.', 'weakTwo'),
      P('Time Skip', 'You jump five minutes into the future and the next attack misses.', 'guardFull'),
      P('Last-Minute Rush', 'At the very last second you run in at full speed.', 'strong'),
      P('Running Late', 'You run so fast that everything shakes.', 'small'),
      P('Snooze Button', 'You press snooze and rest for five more minutes.', 'healM'),
      P('Stopped Clock', 'Time freezes for the hero.', 'skip'),
    ],
    distracted: [
      P('Split Focus', 'You watch five things at once and see every weak point.', 'boostBig'),
      P('Wandering Eye', 'You spot the one weak point everyone else missed.', 'strong'),
      P('Daydream Shield', 'You start daydreaming and the next attack passes right through you.', 'guardMost'),
      P('Shiny Thing!', 'You point at something shiny and the hero looks away.', 'skip'),
      P('Five Things at Once', 'You do five small things at the same time.', 'double'),
      P('Doodle Break', 'You draw a little doodle and relax.', 'healS'),
    ],
    shy: [
      P('Ghost Step', 'You turn invisible and get ready for a sneaky strike.', 'sneak'),
      P('Quiet Storm', 'Your silence slowly builds into a shockwave.', 'strong'),
      P('Under the Desk', 'You hide under the desk and nobody can reach you.', 'guardLong'),
      P('Blush Beam', 'Your red cheeks heat up into a beam.', 'small'),
      P('Whisper Spell', 'You whisper a spell that confuses the hero.', 'weakBig'),
      P('Cozy Shell', 'You hide in your shell and calm down.', 'healM'),
    ],
    anxious: [
      P('Nervous Energy', 'Your racing heartbeat gives you extra speed.', 'boostTwo'),
      P('Early Warning', 'You sense danger seconds before it happens.', 'guardMost'),
      P('Panic Shout', 'You scream so loudly that the walls shake.', 'medium'),
      P('Jitter Shake', 'Your trembling shakes the ground under the hero.', 'hitSkip'),
      P('Worst-Case Plan', 'You are ready for everything that could go wrong.', 'guardLong'),
      P('Deep Worry Breath', 'You breathe slowly and your heart calms down.', 'healS'),
    ],
    touchy: [
      P('Instant Armor', 'The moment someone insults you, your skin turns hard as steel.', 'guardMost'),
      P('Echo Sting', 'Insults bounce off you and go back to the sender.', 'reflect'),
      P('Thorny Words', 'Sharp words fly at the hero like little needles.', 'small'),
      P('Hurt Feelings Blast', 'Your hurt feelings burst out in a big wave.', 'strong'),
      P('Sulk Corner', 'You sulk in a corner until you feel better.', 'healM'),
      P('Prickle Cloud', 'A cloud of tiny thorns surrounds you.', 'weakBig'),
    ],
    pessimistic: [
      P('Storm Caller', 'Your gloomy mood brings rain, fog and darkness.', 'strong'),
      P('Gray Cloud', 'A personal raincloud follows you, ready to strike.', 'medium'),
      P('Bad Omen', 'You announce bad news and the hero loses courage.', 'weakBig'),
      P('Umbrella of Doom', 'You open a big black umbrella.', 'guardMost'),
      P('It Will Fail', 'You say that nothing will work, and the hero starts to believe it.', 'weakTwo'),
      P('Gloomy Snack', 'A sad little snack makes you feel a bit better.', 'healS'),
    ],
    hottempered: [
      P('Flash Fire', 'Your anger turns instantly into a burst of flame.', 'huge'),
      P('Short Fuse', 'The angrier you get, the stronger you get.', 'boostBig'),
      P('Steam Burst', 'Hot steam comes out of your ears.', 'medium'),
      P('Tantrum Stomp', 'You stamp your feet and the floor cracks.', 'strong'),
      P('Cool Down', 'You count to ten and calm down.', 'healS'),
      P('Red Mist', 'A red mist of anger blinds the hero.', 'hitSkip'),
    ],
    bossy: [
      P('Command Voice', 'For ten seconds, everyone must do exactly what you say.', 'strong'),
      P('Lead the Pack', 'You give orders and your next moves become stronger.', 'boostTwo'),
      P('Stop Right There!', 'You give an order and the hero must obey.', 'skip'),
      P('Do It Again!', 'You make the hero repeat its own mistake.', 'hitWeak'),
      P('Boss Barrier', 'You build a wall and say: “Nobody passes.”', 'guardMost'),
      P('Pointing Finger', 'You point your finger and the hero feels small.', 'small'),
    ],
    pushy: [
      P('Telekinetic Shove', 'You push things and people without touching them.', 'small'),
      P('Wave Force', 'You send a blast of force in a straight line.', 'medium'),
      P('Elbow Through', 'You push through everything with your elbows.', 'strong'),
      P('Push Back', 'You push the next attack away.', 'guardMost'),
      P('Off Balance', 'You push the hero so hard that it falls over.', 'hitSkip'),
      P('Pep Talk', 'You push yourself to keep going.', 'healS'),
    ],
    arrogant: [
      P('Ego Shield', 'Your confidence forms a shield.', 'guardFull'),
      P('Spotlight', 'You become impossible to ignore, and the hero cannot look away.', 'skip'),
      P('Golden Crown', 'You put on a golden crown and feel untouchable.', 'guardMost'),
      P('Look at Me!', 'Everyone watches you and you feel unstoppable.', 'boostBig'),
      P('Superior Smirk', 'You smile in a way that makes the hero feel small.', 'hitWeak'),
      P('Mirror Admire', 'You look in the mirror and love what you see.', 'healM'),
    ],
    greedy: [
      P('Power Feast', 'You steal a little of the hero’s power.', 'drain'),
      P('Collector', 'You pull small objects across the room into your hand.', 'small'),
      P('Treasure Toss', 'You throw a bag full of heavy gold coins.', 'strong'),
      P('Gold Armor', 'You cover yourself in shiny gold.', 'guardMost'),
      P('Hoard Snack', 'You eat everything you saved for a bad day.', 'healB'),
      P('Grab It All', 'You grab the hero’s weapon and run.', 'hitSkip'),
    ],
    superficial: [
      P('Mirror Shine', 'Light bounces off you.', 'reflect'),
      P('Dazzle', 'You create bright illusions that distract the hero.', 'weakBig'),
      P('Glitter Bomb', 'You throw a big cloud of glitter.', 'medium'),
      P('Fancy Cloak', 'A beautiful cloak shines around you.', 'guardMost'),
      P('Selfie Flash', 'A huge camera flash blinds the hero.', 'skip'),
      P('Makeover', 'A quick makeover and you feel brand new.', 'healM'),
    ],
    clingy: [
      P('Stretch Grip', 'Your arms stretch and hold the hero tight.', 'hitSkip'),
      P('Stick Tight', 'You stick to the hero and slow it down.', 'weakTwo'),
      P('Koala Hug', 'You hug a tree and recharge.', 'healM'),
      P('Octopus Arms', 'You grab the hero with many arms.', 'double'),
      P('Velcro Shield', 'A sticky shield catches the next attack.', 'guardMost'),
      P('Don’t Leave Me!', 'You squeeze the hero with all your might.', 'medium'),
    ],
    chatty: [
      P('The Endless Talk', 'You talk so much that the hero gets dizzy.', 'skip'),
      P('Word Web', 'Your sentences turn into sticky threads.', 'weakTwo'),
      P('Noisy Chatter', 'Your non-stop words buzz around the hero’s head.', 'small'),
      P('Gossip Storm', 'A storm of rumors hits the hero.', 'medium'),
      P('Talking Shield', 'You talk so fast that nothing can reach you.', 'guardMost'),
      P('Story Time', 'You tell a long story and feel relaxed.', 'healS'),
    ],
    lazy: [
      P('Time Nap', 'You close your eyes for one second and an hour passes.', 'healM'),
      P('Slow Field', 'Anyone who comes near you starts moving in slow motion.', 'weakTwo'),
      P('Sofa Fort', 'You build a fort out of sofa cushions.', 'guardLong'),
      P('Lazy Roll', 'You roll over and bump into the hero.', 'small'),
      P('Yawn Wave', 'A giant yawn makes the hero fall asleep for a moment.', 'skip'),
      P('Do It Tomorrow', 'The hero starts to feel that nothing matters today.', 'weakBig'),
    ],
    impatient: [
      P('Flash Rush', 'You move faster and faster.', 'small'),
      P('Countdown', 'You set a timer, and the hero must obey it.', 'skip'),
      P('Tap Tap Tap', 'You tap your foot and the ground shakes.', 'medium'),
      P('Hurry Up!', 'You rush and your next moves become stronger.', 'boostTwo'),
      P('Impatient Kick', 'You can’t wait any longer and kick the hero.', 'strong'),
      P('Sprint Away', 'You sprint away from the next attack.', 'guardMost'),
    ],
    stubborn: [
      P('Iron Root', 'Once you plant your feet, nothing can move you.', 'guardLong'),
      P('Unbreakable Will', 'No power can work on you.', 'guardFull'),
      P('Crossed Arms', 'You cross your arms and refuse to move.', 'medium'),
      P('Mule Kick', 'You kick back with all your stubborn strength.', 'strong'),
      P('Not Moving', 'You refuse to move and the hero wastes its energy.', 'weakBig'),
      P('Stubborn Snack', 'You are not leaving until you finish your snack.', 'healS'),
    ],
    indecisive: [
      P('Copy Split', 'You split in two and each copy decides differently.', 'double'),
      P('Maybe Field', 'The hero becomes as unsure as you and freezes.', 'skip'),
      P('Coin Flip', 'You can’t decide, so you flip a coin.', 'chaos'),
      P('Two Doors Shield', 'You stand between two doors and nobody can reach you.', 'guardMost'),
      P('Hesitation Haze', 'A cloud of doubt surrounds the hero.', 'weakTwo'),
      P('Change My Mind', 'You change your mind and feel better.', 'healS'),
    ],
  };

  const BASIC_VILLAIN = { name: 'Evil Glare', uses: Infinity, desc: 'A weak attack you can always use.', fx: [{ k: 'dmg', v: 7 }] };
  const BASIC_HERO = { name: 'Hero Punch', uses: Infinity, desc: 'A weak punch.', fx: [{ k: 'dmg', v: 7 }] };

  const HEROES = [
    { name: 'Captain Courage', emoji: '🦸', virtues: ['brave', 'honest', 'responsible'], attacks: [
      { name: 'Brave Charge', uses: 3, desc: 'runs straight at the villain without any fear.', fx: [{ k: 'dmg', v: 19 }] },
      { name: 'Honest Word', uses: 2, desc: 'tells the truth so clearly that the villain feels ashamed. The villain’s next attack is weaker.', fx: [{ k: 'dmg', v: 8 }, { k: 'weak', m: .6, hits: 1 }] },
      { name: 'Safe Guard', uses: 2, desc: 'lifts a big shield. Half of the next attack is blocked.', fx: [{ k: 'guard', p: .5, hits: 1 }] },
      { name: 'Never Give Up', uses: 1, desc: 'takes a deep breath and keeps going. Heals a lot.', fx: [{ k: 'heal', v: 18 }] },
    ] },
    { name: 'Lady Kindness', emoji: '🦸‍♀️', virtues: ['kind', 'generous', 'friendly'], attacks: [
      { name: 'Gift of Light', uses: 3, desc: 'shares a bright beam of light.', fx: [{ k: 'dmg', v: 17 }] },
      { name: 'Warm Hug', uses: 3, desc: 'gives herself a warm, comforting hug. Heals a little.', fx: [{ k: 'heal', v: 15 }] },
      { name: 'Friendly Wave', uses: 2, desc: 'waves so nicely that the villain cannot stay angry. The villain’s next attack is weaker.', fx: [{ k: 'weak', m: .5, hits: 1 }] },
      { name: 'Shield of Friends', uses: 1, desc: 'her friends make a wall around her. The next attack almost cannot touch her.', fx: [{ k: 'guard', p: .8, hits: 1 }] },
    ] },
    { name: 'Professor Brain', emoji: '🧑‍🔬', virtues: ['hardworking', 'creative', 'curious'], attacks: [
      { name: 'Genius Idea', uses: 1, desc: 'has a brilliant idea that hits like a bomb.', fx: [{ k: 'dmg', v: 30 }] },
      { name: 'Endless Practice', uses: 4, desc: 'trains again and again. A small hit she can repeat.', fx: [{ k: 'dmg', v: 13 }] },
      { name: 'Curious Trap', uses: 1, desc: 'asks so many questions that the villain gets confused and cannot act next turn.', fx: [{ k: 'skip', n: 1 }] },
      { name: 'Study Plan', uses: 2, desc: 'makes a perfect plan. Her next attack is much stronger.', fx: [{ k: 'boost', m: 1.8, hits: 1 }] },
    ] },
    { name: 'Master Calm', emoji: '🧘', virtues: ['calm', 'patient', 'cautious'], attacks: [
      { name: 'Patient Strike', uses: 2, desc: 'waits for the perfect moment, then strikes. A strong hit.', fx: [{ k: 'dmg', v: 24 }] },
      { name: 'Deep Breath', uses: 2, desc: 'breathes slowly and relaxes. Heals a good amount.', fx: [{ k: 'heal', v: 20 }] },
      { name: 'Still Water', uses: 1, desc: 'stays perfectly still. The next attack cannot touch the master.', fx: [{ k: 'guard', p: 1, hits: 1 }] },
      { name: 'Quiet Mind', uses: 1, desc: 'brings silence all around. The villain’s next attack is much weaker.', fx: [{ k: 'weak', m: .4, hits: 1 }] },
    ] },
    { name: 'Sunny Spark', emoji: '🌞', virtues: ['cheerful', 'optimistic', 'confident'], attacks: [
      { name: 'Rainbow Beam', uses: 3, desc: 'shoots a happy rainbow. A good hit.', fx: [{ k: 'dmg', v: 18 }] },
      { name: 'Big Smile', uses: 2, desc: 'smiles so brightly that the villain cannot aim. The villain’s next attack is weaker.', fx: [{ k: 'weak', m: .5, hits: 1 }] },
      { name: 'Confidence Boost', uses: 1, desc: 'believes in herself. Her next two attacks are stronger.', fx: [{ k: 'boost', m: 1.5, hits: 2 }] },
      { name: 'Sunny Day', uses: 2, desc: 'the sun comes out and she feels better. Heals a little.', fx: [{ k: 'heal', v: 14 }] },
    ] },
  ];

  /* ================= the fight (no screen here: the tests run it too) ================= */

  const rand = (a, b) => a + Math.random() * (b - a);

  function fighter(name, attacks, basic) {
    return {
      name, hp: MAX_HP, basic,
      attacks: attacks.map(a => ({ ...a, left: a.uses })),
      guard: null, reflect: null, weak: null, boost: null, skip: 0,
    };
  }

  // one attack: changes `me` and `foe`, and returns what happened (for the log and the floating numbers)
  function use(att, me, foe) {
    const out = { dealt: 0, healed: 0, hurtSelf: 0, reflected: 0, blocked: false, notes: [] };
    let dmg = 0, heal = 0, recoil = 0;
    for (const f of att.fx) {
      if (f.k === 'dmg') dmg += f.v;
      else if (f.k === 'chaos') dmg += Math.round(rand(f.a, f.b));
      else if (f.k === 'drain') { dmg += f.v; heal += f.heal; }
      else if (f.k === 'recoil') recoil += f.v;
      else if (f.k === 'heal') heal += f.v;
      else if (f.k === 'guard') { me.guard = { p: f.p, hits: f.hits }; out.notes.push('shield'); }
      else if (f.k === 'reflect') { me.reflect = { p: f.p, hits: f.hits }; out.notes.push('mirror'); }
      else if (f.k === 'weak') { foe.weak = { m: f.m, hits: f.hits }; out.notes.push('weak'); }
      else if (f.k === 'boost') { me.boost = { m: f.m, hits: f.hits }; out.notes.push('boost'); }
      else if (f.k === 'skip') { foe.skip += f.n; out.notes.push('skip'); }
    }
    if (dmg > 0) {
      if (me.boost) { dmg *= me.boost.m; if (--me.boost.hits <= 0) me.boost = null; }
      if (me.weak) { dmg *= me.weak.m; if (--me.weak.hits <= 0) me.weak = null; out.notes.push('weakened'); }
      if (foe.reflect) {
        out.reflected = Math.round(dmg * foe.reflect.p);
        out.blocked = true;
        if (--foe.reflect.hits <= 0) foe.reflect = null;
        me.hp = Math.max(0, me.hp - out.reflected);
        dmg = 0;
      } else if (foe.guard) {
        const full = dmg;
        dmg *= 1 - foe.guard.p;
        out.blocked = dmg < full * .5;
        if (--foe.guard.hits <= 0) foe.guard = null;
      }
      out.dealt = Math.round(dmg);
      foe.hp = Math.max(0, foe.hp - out.dealt);
    }
    if (heal > 0) { out.healed = Math.min(heal, MAX_HP - me.hp); me.hp += out.healed; }
    if (recoil > 0) { out.hurtSelf = recoil; me.hp = Math.max(0, me.hp - recoil); }
    return out;
  }

  // what the computer hero does: it only sees what a player would see (HP and its own status)
  function heroPick(hero, villain) {
    const options = hero.attacks.filter(a => a.left > 0);
    const list = options.length ? options : [hero.basic];
    const weights = list.map(a => {
      const k = a.fx.map(f => f.k);
      let w = 1;
      if (k.includes('dmg')) w += 1;
      if (k.includes('heal')) w = hero.hp < 45 ? 4 : hero.hp > 75 ? .1 : 1;
      if (k.includes('guard') || k.includes('reflect')) w = hero.guard || hero.reflect ? .2 : 1.1;
      if (k.includes('skip')) w = villain.skip > 0 ? .1 : .9;
      if (k.includes('weak')) w = villain.weak ? .2 : 1;
      if (k.includes('boost')) w = hero.boost ? .2 : .9;
      if (k.includes('dmg') && a.fx.some(f => f.k === 'dmg' && f.v >= villain.hp)) w += 6; // it can finish the fight
      return w;
    });
    let r = Math.random() * weights.reduce((t, w) => t + w, 0);
    for (let i = 0; i < list.length; i++) { r -= weights[i]; if (r <= 0) return list[i]; }
    return list[list.length - 1];
  }

  const spend = a => { if (a.uses !== Infinity && a.left > 0) a.left--; };

  const api = { MAX_HP, FLAW_GROUPS, ATTACKS, HEROES, BASIC_VILLAIN, BASIC_HERO, fighter, use, heroPick, spend };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof document === 'undefined') return;

  /* ================= the pop-up ================= */

  const shuffle = list => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ICONS = {
    guard: ['🛡️', 'Shield: the next attack will hurt less.'],
    reflect: ['🪞', 'Mirror: the next attack goes back.'],
    skip: ['💫', 'Dizzy: cannot act next turn.'],
    weak: ['🔻', 'Weakened: the next attack is weaker.'],
    boost: ['⬆️', 'Powered up: the next attack is stronger.'],
  };

  const overlay = document.createElement('div');
  overlay.className = 'vb-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Villain Battle');
  overlay.innerHTML = '<div class="vb-box"><button type="button" class="vb-close" aria-label="Close">✕</button><div class="vb-screen"></div></div>';
  document.body.append(overlay);
  const screen = overlay.querySelector('.vb-screen');
  const $ = sel => screen.querySelector(sel);
  let lastFocus = null;

  let picked = [];            // the flaw keys chosen by the pupil (3)
  let chosen = [];            // the powers chosen: { k: flaw key, i: index in ATTACKS[k] } (3)
  let villainName = '';
  let icon = '';              // 'drawn' (the drawing of the villain file) or 'v:raccoon' (an animal villain, img/personality/villains)
  let drawn = '';             // the pupil's drawing of the villain file, if there is one
  let game = null;            // { villain, hero, busy, over, token } (+ duel: true, turnOf, ready in a 2 player fight)
  let mode = '1p';            // '1p' villain vs hero · '2p' villain vs villain
  let player = 1;             // 2 players: which one is making a villain
  let players = [null, null]; // 2 players: { name, icon, drawn, picked, chosen } of each
  let netState = null;        // online: { code, me: 0|1, unsub, room, mine, begun }
  const clientId = Math.random().toString(36).slice(2) + Date.now().toString(36); // tells the two players apart (new on every page load)
  const rooms = () => window.book && window.book.rooms;

  function open() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    modes();
    overlay.querySelector('.vb-close').focus();
  }
  function close() {
    netLeave();
    if (game) game.token = null;
    overlay.hidden = true;
    lastFocus?.focus();
  }

  // the animal villains drawn for the book: img/personality/villains/<name>.png (color, for the game; the black and white ones for printing are in villains/bw/)
  const VILLAINS = ['raccoon', 'ram', 'panda', 'sloth', 'crow', 'rabbit', 'scorpion', 'crocodile', 'cat', 'bull', 'owl'].map(n => 'v:' + n);

  // the drawing of the villain file, if the pupil has drawn one
  function readDrawing() {
    try {
      const c = document.querySelector('#vl-draw canvas');
      if (c) {
        const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return c.toDataURL('image/webp', .85);
      }
    } catch { /* the canvas cannot be read (e.g. opened from a file) */ }
    return '';
  }
  const pictureHtml = (id, d = drawn) => id === 'drawn' ? `<img class="drawn" src="${d}" alt="">`
    : id.startsWith('e:') ? `<span class="vb-emo">${id.slice(2)}</span>`
    : `<img src="img/personality/villains/${id.slice(2)}.png" alt="">`;
  const groupColor = k => FLAW_GROUPS.find(g => g.flaws.some(f => f[0] === k)).color;
  const flawName = k => FLAW_GROUPS.flatMap(g => g.flaws).find(f => f[0] === k)[1];

  /* ---- 0. one player or two ---- */
  function modes() {
    netLeave();
    game = null; players = [null, null]; player = 1;
    screen.innerHTML = `
      <h2 class="vb-title">Villain Battle</h2>
      <p class="vb-sub">Make a tiny villain and fight!</p>
      <div class="vb-modes">
        <button type="button" class="vb-mode" data-act="mode" data-m="1p"><i>🦹 ⚔ 🦸</i><b>Villain vs Hero</b><span>1 player. Your villain fights a hero chosen by the computer.</span></button>
        <button type="button" class="vb-mode" data-act="mode" data-m="2p"><i>🦹 ⚔ 🦹</i><b>Villain vs Villain</b><span>2 players, 1 computer. Each player makes a villain, then you pass the computer from one to the other.</span></button>
        <button type="button" class="vb-mode" data-act="mode" data-m="net"><i>📱 ⚔ 💻</i><b>Online with a code</b><span>2 players, 2 devices. Make a room, tell the 4-letter code to a friend and fight from your own device.</span></button>
      </div>`;
  }
  function chooseMode(m) {
    mode = m; player = 1; players = [null, null];
    picked = []; chosen = []; icon = ''; villainName = '';
    if (m === 'net') onlineMenu(); else intro();
  }

  /* ---- 1. make the villain: name, picture, 3 flaws ---- */
  function intro() {
    const two = mode === '2p', netm = mode === 'net';
    drawn = player === 1 && !netm ? readDrawing() : ''; // a drawing is too big to send online
    villainName = (player === 1 && document.getElementById('vl-s-name')?.value.trim()) || villainName || '';
    if (!icon || (icon === 'drawn' && !drawn)) icon = drawn ? 'drawn' : VILLAINS[Math.floor(Math.random() * VILLAINS.length)];
    const ids = [...(drawn ? ['drawn'] : []), ...VILLAINS];
    screen.innerHTML = `
      <h2 class="vb-title">${netm ? 'Your villain' : two ? `Player ${player}` : 'Villain Battle'}</h2>
      <p class="vb-sub">${netm ? `Room code: <b class="vb-roomcode">${netState ? netState.code : ''}</b>` : two ? `Player ${player}: make your villain! ${player === 1 ? 'Player 2, look away 🙈' : 'Player 1, look away 🙈'}` : 'Make a tiny villain and fight a hero!'}</p>
      <div class="vb-how">
        <b>How to play</b>
        <ol>
          <li>Choose a <b>name</b>, a <b>picture</b> and <b>3 flaws</b>.</li>
          <li>Each flaw has 6 <b>superpowers</b>. Read them and choose <b>3</b> for your villain.</li>
          ${netm
            ? `<li>Press <b>Ready</b> when your villain is done. The fight starts when <b>both</b> players are ready.</li>
          <li>You fight <b>one turn each</b>. The <b>points are secret</b>: read what each attack does, and choose which to use and when.</li>
          <li>Take away all your friend’s villain’s <b>HP</b> to win!</li>`
            : two
            ? `<li>Then you <b>pass the computer</b> and the other player makes a villain too.</li>
          <li>The villains fight, <b>one turn each</b>. The <b>points are secret</b>: read what each attack does, and choose which to use and when.</li>
          <li>Take away all the other villain’s <b>HP</b> to win!</li>`
            : `<li>You meet a random <b>hero</b>. Its attacks come from its <b>virtues</b>.</li>
          <li>The <b>points are secret</b>! Read what each attack does, and choose which to use and when.</li>
          <li>Take away all the hero’s <b>HP</b> to win!</li>`}
        </ol>
      </div>
      <label class="vb-name">My villain’s name <input type="text" maxlength="24" autocomplete="off" value="${esc(villainName)}" placeholder="e.g. Doctor Doom"></label>
      <b class="vb-ph">My villain’s picture</b>
      <div class="vb-icons">${ids.map(id => `<button type="button" class="vb-ic${id === icon ? ' on' : ''}" data-act="icon" data-id="${esc(id)}" aria-label="${id === 'drawn' ? 'My drawing' : 'Picture'}">${id === 'drawn' ? '<img class="drawn" src="' + drawn + '" alt=""><small>my drawing</small>' : pictureHtml(id)}</button>`).join('')}</div>
      <b class="vb-ph">My villain’s flaws</b>
      <div class="vb-groups">${FLAW_GROUPS.map(g => `
        <div class="vb-group" style="--c:${g.color}">
          <span class="vb-gname">${g.name}</span>
          ${g.flaws.map(([k, n]) => `<button type="button" class="vb-flaw${picked.includes(k) ? ' on' : ''}" data-act="flaw" data-k="${k}">${n}</button>`).join('')}
        </div>`).join('')}
      </div>
      <p class="vb-count" aria-live="polite"></p>
      <div class="vb-nav">
        ${player === 1 ? '<button type="button" class="vb-btn" data-act="modes">◀ Change mode</button>' : ''}
        <button type="button" class="vb-btn start inline" data-act="next">Choose superpowers ▶</button>
      </div>`;
    paintFlaws();
  }

  function paintFlaws() {
    screen.querySelectorAll('.vb-flaw').forEach(b => b.classList.toggle('on', picked.includes(b.dataset.k)));
    $('.vb-count').textContent = picked.length < 3 ? `Choose ${3 - picked.length} more flaw${picked.length === 2 ? '' : 's'}.` : 'Three flaws chosen! Click a flaw to take it off.';
    $('[data-act="next"]').disabled = picked.length !== 3;
  }

  function toggleFlaw(k) {
    if (picked.includes(k)) { picked = picked.filter(x => x !== k); chosen = chosen.filter(c => c.k !== k); }
    else if (picked.length < 3) picked.push(k);
    else { $('.vb-count').textContent = 'Only 3 flaws! Click one you chose to take it off.'; return; }
    paintFlaws();
  }

  function chooseIcon(id) {
    icon = id;
    screen.querySelectorAll('.vb-ic').forEach(b => b.classList.toggle('on', b.dataset.id === id));
  }

  /* ---- 1b. choose 3 of the 18 superpowers ---- */
  const pips = a => a.uses === Infinity ? '<i class="vb-inf">always ready</i>'
    : Array.from({ length: a.uses }, (_, i) => `<i class="${i < a.left ? 'on' : ''}"></i>`).join('');

  function powers() {
    villainName = ($('.vb-name input')?.value.trim() || villainName).slice(0, 24);
    screen.innerHTML = `
      <h2 class="vb-title">${mode === '2p' ? `Player ${player}: choose 3 superpowers` : 'Choose 3 superpowers'}</h2>
      <p class="vb-sub">Read every power carefully and think: is it strong? Is it useful? Nobody tells you, you decide!</p>
      ${picked.map(k => `
        <div class="vb-psec" style="--c:${groupColor(k)}">
          <span class="vb-pflaw">${flawName(k)}</span>
          <div class="vb-pgrid">${ATTACKS[k].map((a, i) => `
            <button type="button" class="vb-pcard" data-act="power" data-k="${k}" data-i="${i}"><b>${esc(a.name)}</b><span>${esc(a.story)}</span></button>`).join('')}
          </div>
        </div>`).join('')}
      <p class="vb-count" aria-live="polite"></p>
      <div class="vb-nav">
        <button type="button" class="vb-btn" data-act="back">◀ Back</button>
        <button type="button" class="vb-btn start inline" data-act="start">${mode === 'net' ? 'Ready! ▶' : mode === '1p' ? 'Meet the hero ▶' : player === 1 ? 'Done! Pass the computer ▶' : 'Fight! ⚔'}</button>
      </div>`;
    paintPowers();
  }

  function paintPowers() {
    screen.querySelectorAll('.vb-pcard').forEach(b => b.classList.toggle('on', chosen.some(c => c.k === b.dataset.k && c.i === +b.dataset.i)));
    $('.vb-count').textContent = chosen.length < 3 ? `Choose ${3 - chosen.length} more superpower${chosen.length === 2 ? '' : 's'}.` : 'Three superpowers chosen! Click one to take it off.';
    $('[data-act="start"]').disabled = chosen.length !== 3;
  }

  function togglePower(k, i) {
    const at = chosen.findIndex(c => c.k === k && c.i === i);
    if (at >= 0) chosen.splice(at, 1);
    else if (chosen.length < 3) chosen.push({ k, i });
    else { $('.vb-count').textContent = 'Only 3 superpowers! Click one you chose to take it off.'; return; }
    paintPowers();
  }

  // the villain is ready: against the hero, or (2 players) on to the next player / the duel
  function finishCreation() {
    villainName = villainName || (mode === '2p' ? `Player ${player}` : 'My villain');
    if (mode === 'net') { netReady(); return; }
    if (mode === '1p') { startBattle(); return; }
    players[player - 1] = { name: villainName, icon, drawn, picked: [...picked], chosen: chosen.map(c => ({ ...c })) };
    if (player === 2) { duelStart(); return; }
    player = 2; picked = []; chosen = []; icon = ''; villainName = '';
    screen.innerHTML = `
      <div class="vb-pass">
        <div class="vb-big">🔄</div>
        <h2 class="vb-title">Pass the computer to Player 2!</h2>
        <p>Player 1, your villain is ready. Don’t look at the next screens 🙈</p>
        <button type="button" class="vb-btn start" data-act="pass2">I am Player 2 ▶</button>
      </div>`;
  }

  /* ---- 2. the fight ---- */
  function startBattle() {
    villainName = villainName || 'My villain';
    const hero = HEROES[Math.floor(Math.random() * HEROES.length)];
    game = {
      villain: fighter(villainName, chosen.map(c => ATTACKS[c.k][c.i]), BASIC_VILLAIN),
      hero: fighter(hero.name, shuffle(hero.attacks), BASIC_HERO),
      heroInfo: hero, busy: false, over: false, token: {}, log: [], turn: 1,
    };
    screen.innerHTML = `
      <div class="vb-arena">
        <div class="vb-side villain">
          <div class="vb-pic">${pictureHtml(icon)}</div>
          <b class="vb-fname">${esc(villainName)}</b>
          <div class="vb-hpbar"><span></span><em></em></div>
          <div class="vb-virtues flaws">${picked.map(k => `<i>${flawName(k)}</i>`).join('')}</div>
          <div class="vb-status"></div>
        </div>
        <div class="vb-vs">VS</div>
        <div class="vb-side hero">
          <div class="vb-pic emoji">${hero.emoji}</div>
          <b class="vb-fname">${esc(hero.name)}</b>
          <div class="vb-hpbar"><span></span><em></em></div>
          <div class="vb-virtues">${hero.virtues.map(v => `<i>${v}</i>`).join('')}</div>
          <div class="vb-status"></div>
        </div>
      </div>
      <div class="vb-log" aria-live="polite"></div>
      <p class="vb-turn"></p>
      <div class="vb-attacks"></div>
      <div class="vb-nav"><button type="button" class="vb-btn" data-act="quit">Give up</button></div>`;
    say(`${hero.name} appears! Its virtues are ${hero.virtues.join(', ')}. Choose your attack!`);
    paintBattle();
  }

  function say(text, cls = '') {
    game.log.push({ text, cls });
    const box = $('.vb-log');
    if (!box) return;
    box.innerHTML = game.log.slice(-5).map((l, i, all) => `<p class="${l.cls}${i === all.length - 1 ? ' last' : ''}">${l.text}</p>`).join('');
  }

  function statusIcons(f) {
    const on = [];
    if (f.guard) on.push('guard');
    if (f.reflect) on.push('reflect');
    if (f.skip > 0) on.push('skip');
    if (f.weak) on.push('weak');
    if (f.boost) on.push('boost');
    return on.map(k => `<span title="${ICONS[k][1]}">${ICONS[k][0]}</span>`).join('');
  }

  function paintBattle() {
    const { villain, hero } = game;
    [[villain, '.villain'], [hero, '.hero']].forEach(([f, sel]) => {
      const side = $(`.vb-side${sel}`);
      const pct = Math.round(f.hp / MAX_HP * 100);
      side.querySelector('.vb-hpbar span').style.width = `${pct}%`;
      side.querySelector('.vb-hpbar').classList.toggle('low', pct <= 30);
      side.querySelector('.vb-hpbar em').textContent = `${f.hp} HP`;
      side.querySelector('.vb-status').innerHTML = statusIcons(f);
    });
    const who = game.net ? (game.turnOf === game.me ? villain : hero) : game.duel && game.turnOf === 1 ? hero : villain;
    $('.vb-turn').textContent = game.over ? '' : game.duel ? `Turn ${game.turn} · ${who.name}’s turn` : `Turn ${game.turn}`;
    if (game.net && !game.over && game.turnOf !== game.me) {
      $('.vb-attacks').innerHTML = `<div class="vb-pass inline"><p>⏳ Waiting for <b>${esc(hero.name)}</b> to choose an attack…</p></div>`;
      return;
    }
    if (game.duel && !game.net && !game.ready && !game.over) {
      $('.vb-attacks').innerHTML = `<div class="vb-pass inline"><p>🔄 Pass the computer to <b>${esc(who.name)}</b>!</p><button type="button" class="vb-btn start" data-act="ready">I am ${esc(who.name)} ▶</button></div>`;
      return;
    }
    const list = [...who.attacks, who.basic];
    $('.vb-attacks').innerHTML = list.map((a, i) => `
      <button type="button" class="vb-atk" data-act="attack" data-i="${i}" ${game.busy || game.over || (a.uses !== Infinity && a.left <= 0) ? 'disabled' : ''}>
        <b>${esc(a.name)}</b><span>${esc(a.desc)}</span><span class="vb-pips">${pips(a)}</span>
      </button>`).join('');
  }

  const floatUp = (sel, text, cls) => {
    const side = $(`.vb-side${sel}`);
    if (!side) return;
    const f = document.createElement('span');
    f.className = `vb-float ${cls}`;
    f.textContent = text;
    side.append(f);
    setTimeout(() => f.remove(), 1300);
  };

  // log + floating numbers for what one attack did
  function report(att, who, out, collect = false) {
    const mine = who === game.villain;
    const meSel = mine ? '.villain' : '.hero', foeSel = mine ? '.hero' : '.villain';
    const foe = mine ? game.hero : game.villain;
    const parts = [];
    const float = collect ? () => {} : floatUp; // online: the numbers come from the change of HP, on both devices
    if (out.reflected) { parts.push(`the attack bounces back: ${who.name} loses ${out.reflected} HP`); float(meSel, `-${out.reflected}`, 'dmg'); }
    else if (out.dealt) { parts.push(`${foe.name} loses ${out.dealt} HP`); float(foeSel, `-${out.dealt}`, 'dmg'); }
    else if (out.blocked) parts.push('the attack is blocked completely');
    if (out.dealt && out.blocked) parts.push('(most of it was blocked)');
    if (out.healed) { parts.push(`${who.name} heals ${out.healed} HP`); float(meSel, `+${out.healed}`, 'heal'); }
    if (out.hurtSelf) { parts.push(`${who.name} is burned: -${out.hurtSelf} HP`); float(meSel, `-${out.hurtSelf}`, 'dmg'); }
    if (out.notes.includes('shield')) parts.push('a shield protects the next hit');
    if (out.notes.includes('mirror')) parts.push('a mirror is ready');
    if (out.notes.includes('weak')) parts.push(`${foe.name}’s next attack will be weaker`);
    if (out.notes.includes('boost')) parts.push(`${who.name}’s next attack will be stronger`);
    if (out.notes.includes('skip')) parts.push(`${foe.name} cannot act next turn`);
    const lines = [{ text: `<b>${esc(who.name)}</b> uses <b>${esc(att.name)}</b>! ${parts.length ? parts.join('. ') + '.' : ''}`, cls: mine ? 'me' : 'foe' }];
    // the hero's attacks are written so that they read after its name: "Professor Brain trains again and again…"
    if (!mine && /^[a-z]/.test(att.desc)) lines.push({ text: `${esc(who.name)} ${esc(att.desc)}`, cls: 'foe note' });
    if (!collect) lines.forEach(l => say(l.text, l.cls));
    return lines;
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));

  async function playerAttack(i) {
    if (!game || game.busy || game.over) return;
    const g = game, tok = g.token;
    const { villain, hero } = g;
    const att = [...villain.attacks, villain.basic][i];
    if (!att || (att.uses !== Infinity && att.left <= 0)) return;
    g.busy = true;
    spend(att);
    report(att, villain, use(att, villain, hero));
    paintBattle();
    if (await finished()) return;
    await wait(1300); if (g.token !== tok) return;
    // the hero acts (and again, if the villain is too dizzy to act)
    do {
      if (hero.skip > 0) { hero.skip--; say(`<b>${esc(hero.name)}</b> is dizzy and cannot act!`, 'me'); paintBattle(); }
      else {
        const h = heroPick(hero, villain);
        spend(h);
        report(h, hero, use(h, hero, villain));
        paintBattle();
        if (await finished()) return;
      }
      if (villain.skip > 0) {
        villain.skip--;
        await wait(1300); if (g.token !== tok) return;
        say(`<b>${esc(villain.name)}</b> is dizzy and cannot act!`, 'foe');
        paintBattle();
        await wait(1000); if (g.token !== tok) return;
      } else break;
    } while (!g.over);
    g.turn++;
    g.busy = false;
    paintBattle();
  }

  /* ---- 2b. two villains: they take turns, the computer is passed from one player to the other ---- */
  function duelStart() {
    const [a, b] = players;
    const nameB = a.name.toLowerCase() === b.name.toLowerCase() ? `${b.name} 2` : b.name;
    const build = (n, p) => fighter(n, p.chosen.map(c => ATTACKS[c.k][c.i]), BASIC_VILLAIN);
    game = { duel: true, villain: build(a.name, a), hero: build(nameB, b), turnOf: 0, ready: false, busy: false, over: false, token: {}, log: [], turn: 1 };
    const side = (cls, name, p) => `
        <div class="vb-side ${cls}">
          <div class="vb-pic">${pictureHtml(p.icon, p.drawn)}</div>
          <b class="vb-fname">${esc(name)}</b>
          <div class="vb-hpbar"><span></span><em></em></div>
          <div class="vb-virtues flaws">${p.picked.map(k => `<i>${flawName(k)}</i>`).join('')}</div>
          <div class="vb-status"></div>
        </div>`;
    screen.innerHTML = `
      <div class="vb-arena">${side('villain', a.name, a)}<div class="vb-vs">VS</div>${side('hero duel', nameB, b)}</div>
      <div class="vb-log" aria-live="polite"></div>
      <p class="vb-turn"></p>
      <div class="vb-attacks"></div>
      <div class="vb-nav"><button type="button" class="vb-btn" data-act="quit">Stop</button></div>`;
    say(`${esc(a.name)} and ${esc(nameB)} are ready to fight! ${esc(a.name)} goes first.`);
    paintBattle();
  }

  async function duelAttack(i) {
    const g = game;
    if (!g || g.busy || g.over || !g.ready) return;
    const tok = g.token;
    const me = g.turnOf === 0 ? g.villain : g.hero, foe = g.turnOf === 0 ? g.hero : g.villain;
    const att = [...me.attacks, me.basic][i];
    if (!att || (att.uses !== Infinity && att.left <= 0)) return;
    g.busy = true;
    spend(att);
    report(att, me, use(att, me, foe));
    paintBattle();
    if (await finished()) return;
    await wait(1500); if (g.token !== tok) return;
    if (foe.skip > 0) { // the other villain is dizzy: the same player acts again
      foe.skip--;
      say(`<b>${esc(foe.name)}</b> is dizzy and cannot act! ${esc(me.name)} goes again.`, g.turnOf === 0 ? 'me' : 'foe');
    } else {
      g.turnOf = 1 - g.turnOf;
      g.ready = false;
      if (g.turnOf === 0) g.turn++;
    }
    g.busy = false;
    paintBattle();
  }

  /* ---- 2c. online: two devices, a room with a 4-letter code ---- */
  const netText = e => {
    const c = (e && (e.code || e.message)) || '';
    if (/operation-not-allowed|admin-restricted/.test(c)) return 'Online play is not switched on yet. Ask your teacher!';
    if (/permission-denied/.test(c)) return 'Online play is not set up yet. Ask your teacher!';
    if (c === 'notfound') return 'There is no room with this code. Check the letters!';
    if (c === 'full') return 'This room already has two players.';
    if (c === 'expired') return 'This room is too old. Ask your friend to make a new one.';
    if (c === 'busy') return 'Could not make a room. Try again.';
    return 'Could not connect. Check the internet and try again.';
  };

  function onlineMenu(msg = '') {
    netLeave();
    mode = 'net'; game = null;
    screen.innerHTML = `
      <h2 class="vb-title">Online with a code</h2>
      <p class="vb-sub">Each player uses their own device.</p>
      <div class="vb-modes">
        <button type="button" class="vb-mode" data-act="net-create"><i>🆕</i><b>Make a room</b><span>You get a 4-letter code. Tell it to your friend.</span></button>
        <div class="vb-mode join">
          <i>🔑</i><b>Join a room</b><span>Write the code of your friend.</span>
          <input class="vb-code" type="text" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD" aria-label="Room code">
          <button type="button" class="vb-btn start" data-act="net-join">Join ▶</button>
        </div>
      </div>
      <p class="vb-neterr" aria-live="polite">${esc(msg)}</p>
      <div class="vb-nav"><button type="button" class="vb-btn" data-act="modes">◀ Back</button></div>`;
  }
  const netMsg = t => { const el = $('.vb-neterr'); if (el) el.textContent = t; };

  async function netEnter(make) {
    const R = rooms();
    if (!R) { netMsg('Online play needs the internet. Try again in a moment.'); return; }
    let code;
    if (!make) {
      code = ($('.vb-code').value || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (code.length !== 4) { netMsg('The code has 4 letters.'); return; }
    }
    netMsg(make ? 'Making the room…' : 'Joining…');
    try {
      let me = 0;
      if (make) code = await R.create(clientId); else me = await R.join(code, clientId);
      netState = { code, me, unsub: null, room: null, mine: null, begun: false };
      netState.unsub = R.watch(code, onRoom, e => { netMsg(netText(e)); });
      picked = []; chosen = []; icon = ''; villainName = ''; player = 1;
      intro();
    } catch (e) { netState = null; netMsg(netText(e)); }
  }

  function netLeave() {
    if (!netState) return;
    const st = netState;
    netState = null;
    st.unsub?.();
    if (game?.net && !game.over) { try { rooms()?.update(st.code, { left: st.me }); } catch { /* nobody to tell */ } }
  }

  // my villain is ready: put it in the room and wait for the other one
  async function netReady() {
    const data = { name: villainName, icon: icon === 'drawn' ? VILLAINS[0] : icon, picked: [...picked], chosen: chosen.map(c => ({ k: c.k, i: c.i })), ready: true };
    netState.mine = data;
    screen.innerHTML = '<div class="vb-pass"><div class="vb-big">⏳</div><h2 class="vb-title">Sending your villain…</h2></div>';
    try { await rooms().update(netState.code, { ['p' + netState.me]: data }); }
    catch (e) { onlineMenu(netText(e)); return; }
    netWait(netState.room);
  }

  function netWait(room) {
    if (!netState || game) return;
    const joined = room && room.guest;
    screen.innerHTML = `
      <div class="vb-pass">
        <div class="vb-big">⏳</div>
        <h2 class="vb-title">Your villain is ready!</h2>
        <p>Room code: <b class="vb-roomcode">${netState.code}</b></p>
        <p class="vb-waitmsg">${joined ? 'Waiting for your friend to finish their villain…' : 'Waiting for your friend to join with this code…'}</p>
        <button type="button" class="vb-btn" data-act="modes">Leave</button>
      </div>`;
  }

  const netFighter = (p, nameFix) => fighter(nameFix || p.name, p.chosen.map(c => ATTACKS[c.k][c.i]), BASIC_VILLAIN);
  const ser = f => ({ hp: f.hp, guard: f.guard, reflect: f.reflect, weak: f.weak, boost: f.boost, skip: f.skip, left: f.attacks.map(a => a.left) });
  const applyF = (f, st) => {
    f.hp = st.hp; f.guard = st.guard || null; f.reflect = st.reflect || null; f.weak = st.weak || null; f.boost = st.boost || null; f.skip = st.skip || 0;
    (st.left || []).forEach((n, i) => { if (f.attacks[i]) f.attacks[i].left = n; });
  };

  // every change of the room comes here
  function onRoom(room) {
    if (!netState) return;
    netState.room = room;
    if (!room) { netMsg('This room is gone.'); return; }
    if (game && game.net) { netRender(room); return; }
    if (netState.mine && room.p0 && room.p1) { netBegin(room); return; }
    if (netState.mine) netWait(room);
  }

  function netBegin(room) {
    const me = netState.me, mine = room['p' + me], other = room['p' + (1 - me)];
    const otherName = other.name.toLowerCase() === mine.name.toLowerCase() ? `${other.name} 2` : other.name;
    game = { duel: true, net: true, me, villain: netFighter(mine), hero: netFighter(other, otherName), turnOf: room.turnOf || 0, turn: room.turn || 1, ready: true, busy: false, over: false, token: {}, log: [], logSeen: room.logN || 0, shown: null };
    const side = (cls, name, p) => `
        <div class="vb-side ${cls}">
          <div class="vb-pic">${pictureHtml(p.icon)}</div>
          <b class="vb-fname">${esc(name)}</b>
          <div class="vb-hpbar"><span></span><em></em></div>
          <div class="vb-virtues flaws">${p.picked.map(k => `<i>${flawName(k)}</i>`).join('')}</div>
          <div class="vb-status"></div>
        </div>`;
    screen.innerHTML = `
      <div class="vb-arena">${side('villain', mine.name, mine)}<div class="vb-vs">VS</div>${side('hero duel', otherName, other)}</div>
      <div class="vb-log" aria-live="polite"></div>
      <p class="vb-turn"></p>
      <div class="vb-attacks"></div>
      <div class="vb-nav"><button type="button" class="vb-btn" data-act="quit">Leave the fight</button></div>`;
    say(`${esc(mine.name)} and ${esc(otherName)} are ready to fight! ${esc(room.p0.name)} goes first.`);
    if (room.st) { applyF(game.me === 0 ? game.villain : game.hero, room.st.f0); applyF(game.me === 1 ? game.villain : game.hero, room.st.f1); }
    game.shown = { v: game.villain.hp, h: game.hero.hp };
    paintBattle();
    netRender(room);
  }

  // draw what the room says: HP, whose turn it is, the new lines of the log, the end
  function netRender(room) {
    const g = game;
    if (room.st) {
      applyF(g.me === 0 ? g.villain : g.hero, room.st.f0);
      applyF(g.me === 1 ? g.villain : g.hero, room.st.f1);
    }
    if (g.shown) {
      const dv = g.villain.hp - g.shown.v, dh = g.hero.hp - g.shown.h;
      if (dv) floatUp('.villain', dv > 0 ? `+${dv}` : String(dv), dv > 0 ? 'heal' : 'dmg');
      if (dh) floatUp('.hero', dh > 0 ? `+${dh}` : String(dh), dh > 0 ? 'heal' : 'dmg');
    }
    g.shown = { v: g.villain.hp, h: g.hero.hp };
    g.turnOf = room.turnOf;
    g.turn = room.turn || g.turn;
    (room.log || []).filter(l => l.i >= g.logSeen).forEach(l => say(l.t, (l.a === g.me ? 'me' : 'foe') + (l.n ? ' note' : '')));
    g.logSeen = room.logN || 0;
    g.busy = false;
    if (room.left !== null && room.left !== undefined && room.left !== g.me && !room.over && !g.over) {
      g.over = true;
      $('.vb-attacks').innerHTML = '<div class="vb-pass inline"><p>👋 Your friend left the fight.</p><button type="button" class="vb-btn start" data-act="modes">Back to the menu</button></div>';
      return;
    }
    if (room.over && !g.over) {
      g.over = true;
      paintBattle();
      const tok = g.token;
      setTimeout(() => { if (game === g && g.token === tok) endNet(room.winner); }, 1500);
      return;
    }
    if (!g.over) paintBattle();
  }

  // my turn: I work out the result, write it in the room, both devices draw it
  async function netAttack(i) {
    const g = game;
    if (!g || !g.net || g.busy || g.over || g.turnOf !== g.me || !netState) return;
    const me = g.villain, foe = g.hero;
    const att = [...me.attacks, me.basic][i];
    if (!att || (att.uses !== Infinity && att.left <= 0)) return;
    g.busy = true;
    paintBattle();
    const room = netState.room;
    spend(att);
    const lines = report(att, me, use(att, me, foe), true);
    const over = me.hp <= 0 || foe.hp <= 0;
    let turnOf = g.me, turn = g.turn;
    if (!over) {
      if (foe.skip > 0) { // the other villain is dizzy: I act again
        foe.skip--;
        lines.push({ text: `<b>${esc(foe.name)}</b> is dizzy and cannot act! ${esc(me.name)} goes again.`, cls: 'me' });
      } else { turnOf = 1 - g.me; if (turnOf === 0) turn++; }
    }
    const logN = (room.logN || 0) + lines.length;
    const old = (room.log || []).slice(-10);
    const log = [...old, ...lines.map((l, k) => ({ i: (room.logN || 0) + k, t: l.text, a: g.me, n: /note/.test(l.cls) }))];
    const patch = {
      st: { ['f' + g.me]: ser(me), ['f' + (1 - g.me)]: ser(foe) },
      turnOf, turn, logN, log, seq: (room.seq || 0) + 1,
      over, winner: over ? (me.hp > 0 ? g.me : foe.hp > 0 ? 1 - g.me : -1) : null,
    };
    try { await rooms().update(netState.code, patch); }
    catch (e) { // not sent: draw the room again as it was
      g.busy = false;
      if (netState?.room) { netBegin(netState.room); say('Your move was not sent. Try again!', 'foe'); }
    }
  }

  function endNet(winner) {
    const g = game, me = g.me;
    const text = winner === -1 ? 'It’s a draw!' : winner === me ? 'You win!' : `${esc(g.hero.name)} wins!`;
    screen.innerHTML = `
      <div class="vb-end ${winner === me ? 'won' : 'lost'}">
        <div class="vb-big">${winner === -1 ? '🤝' : winner === me ? '🏆' : '💥'}</div>
        <h2 class="vb-title">${text}</h2>
        <p>${winner === me ? 'Great choices!' : winner === -1 ? 'Both villains fell at the same time.' : 'Think about which attack to use, and when. Try again!'}</p>
        <button type="button" class="vb-btn start" data-act="modes">New game</button>
      </div>`;
  }

  async function finished() {
    const g = game;
    if (g.villain.hp > 0 && g.hero.hp > 0) return false;
    g.over = true;
    paintBattle();
    const tok = g.token;
    await wait(1400);
    if (g.token !== tok) return true;
    if (g.duel) endDuel();
    else end(g.hero.hp <= 0 && g.villain.hp > 0);
    return true;
  }

  /* ---- 3. the end ---- */
  function end(won) {
    const heroName = game.hero.name;
    screen.innerHTML = `
      <div class="vb-end ${won ? 'won' : 'lost'}">
        <div class="vb-big">${won ? '🏆' : '💥'}</div>
        <h2 class="vb-title">${won ? 'Your villain wins!' : `${esc(heroName)} wins!`}</h2>
        <p>${won
          ? `${esc(villainName)} beat ${esc(heroName)} in ${game.turn} turn${game.turn === 1 ? '' : 's'}. Great choices!`
          : `${esc(villainName)} fought bravely. Think about which attack to use, and when. Try again!`}</p>
        <button type="button" class="vb-btn start" data-act="again">Fight again ⚔</button>
        <button type="button" class="vb-btn" data-act="change">Change flaws</button>
      </div>`;
  }

  function endDuel() {
    const { villain, hero } = game;
    const winner = villain.hp > 0 ? villain : hero.hp > 0 ? hero : null;
    screen.innerHTML = `
      <div class="vb-end won">
        <div class="vb-big">${winner ? '🏆' : '🤝'}</div>
        <h2 class="vb-title">${winner ? `${esc(winner.name)} wins!` : 'It’s a draw!'}</h2>
        <p>${winner ? `${esc(winner.name)} won after ${game.turn} turn${game.turn === 1 ? '' : 's'}. Well played, both of you!` : 'Both villains fell at the same time.'}</p>
        <button type="button" class="vb-btn start" data-act="again">Fight again ⚔</button>
        <button type="button" class="vb-btn" data-act="change">New game</button>
      </div>`;
  }

  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target.closest('.vb-close')) { close(); return; }
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    if (act === 'flaw') toggleFlaw(btn.dataset.k);
    else if (act === 'icon') chooseIcon(btn.dataset.id);
    else if (act === 'next') powers();
    else if (act === 'power') togglePower(btn.dataset.k, +btn.dataset.i);
    else if (act === 'back') intro();
    else if (act === 'mode') chooseMode(btn.dataset.m);
    else if (act === 'net-create') netEnter(true);
    else if (act === 'net-join') netEnter(false);
    else if (act === 'modes') modes();
    else if (act === 'pass2') intro();
    else if (act === 'ready') { game.ready = true; paintBattle(); }
    else if (act === 'start') finishCreation();
    else if (act === 'again') { if (game?.duel) duelStart(); else startBattle(); }
    else if (act === 'attack') { if (game?.net) netAttack(+btn.dataset.i); else if (game?.duel) duelAttack(+btn.dataset.i); else playerAttack(+btn.dataset.i); }
    else if (act === 'change') { if (mode === '2p') modes(); else { game = null; chosen = []; intro(); } }
    else if (act === 'quit') { if (game) game.token = null; if (mode === '2p' || mode === 'net') modes(); else { game = null; intro(); } }
  });

  overlay.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList.contains('vb-code')) { e.preventDefault(); netEnter(false); }
  });

  // while the pop-up is open the keys do not turn the pages
  window.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    e.stopPropagation();
    if (e.key === 'Escape') close();
  }, true);

  document.querySelectorAll('.vb-play').forEach(b => b.addEventListener('click', open));

  /* ================= opens by itself at the end of its page ================= */
  // as the grammar games: when the pupil scrolls down to the very end of the spread, the pop-up appears (once)
  const SPREAD = 'pers-villain-powers';
  let shown = false;
  const atBottom = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
  function check() {
    const cur = document.querySelector('.spread.current');
    if (shown || !cur || cur.dataset.id !== SPREAD || !overlay.hidden) return;
    if (document.documentElement.classList.contains('gq-open')) return;
    if (atBottom() && cur.getBoundingClientRect().bottom <= window.innerHeight) { shown = true; open(); }
  }
  let queued = false;
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; check(); }); } };
  window.addEventListener('scroll', later, { passive: true });
  window.addEventListener('wheel', e => { if (e.deltaY > 0) later(); }, { passive: true });
  window.addEventListener('resize', later);
  document.addEventListener('spreadchange', later);

  /* ================= the Games list on the home page ================= */
  // grammar-games.js writes that list, so we add our pill once everything has loaded
  window.addEventListener('load', () => {
    const list = document.getElementById('gameList');
    if (!list || typeof PAGES === 'undefined') return;
    const at = PAGES.of('pers-villain-powers');
    const pill = document.createElement('details');
    pill.className = 'game-topic';
    pill.style.setProperty('--c', '#c08be8');
    pill.innerHTML = `<summary>Personality <small>1</small></summary><div class="topic-pages"><a href="#p${at}" data-vb>⚔ Villain Battle</a></div>`;
    list.append(pill);
    document.addEventListener('click', e => { if (!e.target.closest('#gameList')) pill.open = false; });
    list.addEventListener('toggle', e => {
      if (e.target.open) list.querySelectorAll('.game-topic').forEach(o => { if (o !== e.target) o.open = false; });
    }, true);
    pill.querySelector('[data-vb]').addEventListener('click', e => {
      e.preventDefault();
      pill.open = false;
      // go to the page of the battle (so the pupil can see the villain file), then open it
      if (location.hash === `#p${at}`) { open(); return; }
      document.addEventListener('spreadchange', open, { once: true });
      location.hash = `#p${at}`;
    });
    window.hideClosedGames?.(); // hide the pill if the page is not open to the students
  });
})();
