// Villain 2A: the 15 villains made by the pupils of 2A. Only the villains' names are used (never the pupils' names).
//
// Every villain comes from a villain file: powers, equipment, main attack, weakness and motto are the pupil's own.
// The numbers (fx) are the teacher's balance work; see engine.js for what each effect does and how a move is rated.
//
//   a power → one line in moves: M(id, name, story, uses, tags, [fx])
//   `story` is what the pupil's file says (written in simple English); the hint about its strength is added by engine.js
(function (root) {
  'use strict';
  const E = root.V2A;

  const M = (id, name, story, uses, tags, fx) => ({ id, name, story, uses, tags, fx });
  const B = (name, story, tags, fx) => ({ id: 'basic', name, story, uses: Infinity, tags, fx });
  const d = (v, n = 1, o = {}) => ({ k: 'dmg', v, n, ...o });

  const ROSTER = [
    {
      id: 'goget', name: 'Lord Goget Guess', emoji: '🐉', img: 'img/goget.jpg', color: '#3fae5a', role: 'Time & fire',
      blurb: 'Green spiky hair, a mark on the forehead and two knives. Became bad to defeat an even worse man.',
      says: 'I become a bad man to defeat the evil man.',
      q: { immuneBasic: true }, quirk: 'Forehead Mark: punches and basic attacks hardly hurt him. But his own headbutt is harmless!',
      moves: [
        M('fire', 'Dragon’s Fire', 'A dragon made of flames flies out of your hands.', 2, ['fire'], [d(22)]),
        M('knives', 'Knife Flurry', 'You throw your two knives again and again.', 2, ['phys'], [d(6, 3)]),
        M('time', 'Powers of Time', 'You stop the clock. Nobody moves but you.', 1, ['time'], [{ k: 'skip', n: 1 }]),
        M('galaxy', 'The Galaxy', 'You pull a whole galaxy down on the foe. Even you feel the pull.', 1, ['cosmic'], [d(28), { k: 'recoil', v: 10 }]),
      ],
      basic: B('Harmless Headbutt', 'You headbutt the foe. It does no harm… you just catch your breath.', ['phys'], [{ k: 'heal', v: 4 }]),
    },
    {
      id: 'kick', name: 'Kick Girl', emoji: '⚽', img: 'img/kick.jpg', color: '#f08a3c', role: 'Striker',
      blurb: 'Tall, slim, with big black glasses. She loves football, pizza and a messy bedroom.',
      says: 'To save the world, eat pizza and play football.',
      q: {}, weakTag: 'sweet', weakText: 'Pizza eater! Cannot resist sweet and tasty attacks: they hurt more.',
      moves: [
        M('spin', 'Super Spinning Kick', 'You spin round and round and kick with everything you have.', 2, ['phys'], [d(25)]),
        M('stretch', 'Stretchable Arms and Legs', 'Your arms and legs stretch around the foe’s shield.', 3, ['phys'], [d(14, 1, { pierce: true })]),
        M('sight', 'Super Sight', 'Your special glasses show the foe’s weak spot.', 3, [], [{ k: 'boost', m: 1.8, hits: 1 }, { k: 'pierce', n: 1 }]),
      ],
      basic: B('Football Shot', 'You kick a football at the foe.', ['phys'], [d(8)]),
    },
    {
      id: 'hands', name: 'Four Hands', emoji: '🖐️', img: 'img/hands.jpg', color: '#d9a21b', role: 'Grabber',
      blurb: 'She has four hands and curly hair. They said she could not hold anything. Now she holds everything.',
      says: 'I can hold everything.',
      q: { overload: true }, quirk: 'Grabs too many things: when Four Hands grabs the foe’s tricks, the foe’s anger and sleepiness come too!',
      moves: [
        M('slap', 'Four-Hand Slap', 'All four hands hit the foe, one after the other.', 3, ['phys'], [d(5, 4)]),
        M('wind', 'Flying in the Wind', 'The air helps you fly where nobody can reach you.', 2, [], [{ k: 'vanish', n: 1 }]),
        M('grab', 'Grab Everything', 'You grab the foe and take its shields and boosts.', 2, ['phys'], [d(12), { k: 'steal' }]),
        M('prison', 'Into Prison!', 'You catch the bad guy and put him in prison.', 1, ['phys'], [{ k: 'skip', n: 1 }]),
      ],
      basic: B('Hand Swipe', 'You swipe at the foe with one of your hands.', ['phys'], [d(8)]),
    },
    {
      id: 'cactus', name: 'Cactus King', emoji: '🌵', img: 'img/cactus.jpg', color: '#2e8b57', role: 'Counter-puncher',
      blurb: 'Brown hair, red eyes and a body full of thorns. Became bad when someone beat up the brother.',
      says: 'My bad says: you’re rude.',
      q: { thorns: 3 }, quirk: 'Body full of thorns: every hit with hands, feet or weapons hurts the attacker a little. Careful: the vase can break!',
      moves: [
        M('barrage', 'Thorn Barrage', 'You throw thorns at anyone who bothers your brother.', 3, ['thorn'], [d(5, 3)]),
        M('mirror', 'Brother’s Guard', 'Anyone who touches your brother gets the thorns back.', 2, ['thorn'], [{ k: 'reflect', p: .6, hits: 1 }]),
        M('armor', 'Cactus Armor', 'Your thorns grow thick and sharp.', 2, ['thorn'], [{ k: 'guard', p: .5, hits: 2 }]),
        M('vase', 'Vase Throw', 'You throw the big vase of your cactus. It is heavy… and it can break!', 1, ['phys'], [d(30), { k: 'recoil', v: 8 }]),
      ],
      basic: B('Prickle Poke', 'You poke the foe with a thorn.', ['thorn'], [d(8)]),
    },
    {
      id: 'honey', name: 'Honey Bear', emoji: '🐻', img: 'img/honey.jpg', color: '#b5651d', role: 'Trickster',
      blurb: 'A chubby brown bear with a purple hat and a strange tattoo. A purple jar of honey gave him his powers.',
      says: 'Taste my honey, forget what you’re doing.',
      q: { sealImmune: true }, quirk: 'Reminder spoon: he writes notes on a spoon, so nobody can make him forget a power.',
      weakTag: 'mind', weakText: 'Easily distracted: mind tricks and confusing attacks hurt him more.',
      moves: [
        M('memory', 'Memory Honey', 'You shoot sticky purple honey. The foe forgets what it was doing.', 3, ['sweet'], [d(13), { k: 'seal', n: 2 }]),
        M('forget', 'Forget Everything', 'The foe forgets all its plans, shields and tricks.', 2, ['mind'], [d(11), { k: 'dispel' }, { k: 'weak', m: .6, hits: 1 }]),
        M('run', 'Super Run', 'You run so fast that the foe only hits the air.', 2, [], [{ k: 'vanish', n: 1 }]),
        M('bee', 'Honey Bee Sting', 'Your honey bee stings the foe and makes it daydream.', 1, ['team'], [d(12), { k: 'skip', n: 1 }]),
      ],
      basic: B('Honey Slap', 'You slap the foe with a sticky paw.', ['sweet'], [d(8)]),
    },
    {
      id: 'skater', name: 'Shadow Skater', emoji: '🛹', img: null, color: '#4b4b63', role: 'Ghost',
      blurb: 'A dark villain with a black skateboard. He had a skateboard accident and was never the same.',
      says: 'Never give up.',
      q: {}, weakTag: 'team', weakText: 'Afraid of having friends: attacks that call friends or helpers hurt more.',
      moves: [
        M('invisible', 'Become Invisible', 'You disappear. Nobody can find you.', 2, [], [{ k: 'vanish', n: 1 }]),
        M('objects', 'Object Control', 'You lift objects in the air and throw them at the foe.', 3, ['magic'], [d(8, 2)]),
        M('kick', 'Shadow Kick', 'You come out of the shadows with a flying kick.', 2, ['phys'], [d(21)]),
        M('slide', 'Skateboard Slide', 'You slide on your black skateboard, ready for the next move.', 2, [], [{ k: 'guard', p: .4, hits: 1 }, { k: 'boost', m: 1.4, hits: 1 }]),
      ],
      basic: B('Skate Bump', 'You bump into the foe with your skateboard.', ['phys'], [d(8)]),
    },
    {
      id: 'mask', name: 'Silver Mask', emoji: '🎭', img: 'img/mask.jpg', color: '#5a6ea8', role: 'Shadow',
      blurb: 'Tall and slim, with a black cape, a silver mask and glowing blue eyes. A kind scientist until an experiment went wrong.',
      says: 'Darkness is my power.',
      q: {}, weakTag: 'light', weakText: 'Bright light makes the powers weaker: light attacks hurt more.',
      moves: [
        M('blast', 'Shadow Blast', 'A ball of pure shadow flies at the foe.', 3, ['dark'], [d(17)]),
        M('step', 'Silent Shadow Step', 'You disappear into the shadows and move without a sound.', 2, ['dark'], [{ k: 'vanish', n: 1 }, { k: 'boost', m: 1.3, hits: 1 }]),
        M('cloud', 'Dark Clouds', 'Dark clouds cover the sky. The foe cannot see well.', 1, ['dark'], [{ k: 'weak', m: .5, hits: 2 }]),
        M('ravens', 'Storm and Night', 'Your two small black ravens dive at the foe.', 2, ['team'], [d(7, 2)]),
      ],
      basic: B('Staff Tap', 'You tap the foe with your magic staff.', ['magic'], [d(8)]),
    },
    {
      id: 'anxious', name: 'Anxious Shadow', emoji: '😰', img: 'img/anxious.jpg', color: '#7b52c9', role: 'Mind games',
      blurb: 'A very shy girl in a purple hoodie. She talks a lot in her head, but never out loud. She became invisible when she was embarrassed.',
      says: 'Sorry, but can I maybe… never mind?',
      q: { noRepeat: true }, quirk: 'Too indecisive: can never use the same power twice in a row.',
      moves: [
        M('silence', 'The Awkward Silence', 'You become so shy that everyone feels awkward.', 1, ['mind'], [d(6), { k: 'skip', n: 1 }]),
        M('ray', 'Forgetful Ray', 'The foe forgets why it is fighting.', 2, ['mind'], [d(8), { k: 'weak', m: .5, hits: 1 }]),
        M('wave', 'Distraction Wave', 'Everyone is distracted and confused.', 2, ['mind'], [d(11), { k: 'confuse', n: 1 }]),
        M('shield', 'Invisibility Shield', 'When you feel embarrassed, you become invisible.', 2, [], [{ k: 'vanish', n: 1 }]),
        M('book', 'The Confidence Book', 'A magic book gives you powers, but you are too indecisive to choose the page.', 1, [], [{ k: 'randomPower' }]),
      ],
      basic: B('Nervous Fidget', 'You fidget so much that the foe gets nervous.', ['mind'], [d(7)]),
    },
    {
      id: 'vampire', name: 'Time Vampire', emoji: '🧛', img: 'img/vampire.jpg', color: '#c22d4a', role: 'Time-bender',
      blurb: 'A teenager with sharp teeth and long black hair. She found an ancient watch in the attic and time stopped.',
      says: 'Time stops, but I do not.',
      q: { tired: true }, quirk: 'Gets tired easily: every power makes the Vampire more tired. At 3 it has to rest and loses a turn. The drone helps!',
      moves: [
        M('clap', 'Clap Freeze', 'You clap your hands and time stops.', 2, ['time'], [{ k: 'skip', n: 1 }]),
        M('bomb', 'Time Bomb Combo', 'You freeze time, place an explosive, teleport behind the foe and attack.', 1, ['time'], [d(18), { k: 'skip', n: 1 }]),
        M('teleport', 'Teleport Strike', 'You teleport behind the foe, where there is no shield.', 3, [], [d(17, 1, { pierce: true })]),
        M('timeshield', 'Time Shield', 'Time slows down for the enemies near you.', 2, ['time'], [{ k: 'weak', m: .6, hits: 2 }]),
        M('shell', 'Cozy Shell', 'You hide in your shell and calm down.', 2, [], [{ k: 'guard', p: .8, hits: 1 }, { k: 'heal', v: 6 }, { k: 'cleanse' }]),
      ],
      basic: B('Drone Run', 'Your small drone runs for you, and you rest.', ['team'], [d(8), { k: 'mark', name: 'tired', n: -1, self: true }]),
    },
    {
      id: 'sixseven', name: 'Six Seven', emoji: '🎧', img: 'img/sixseven.jpg', color: '#e0559b', role: 'Rage-builder',
      blurb: 'A young girl with long brown hair and headphones. She loves music and loves saying “six seven!”',
      says: 'Six seven!',
      q: {}, weakTag: 'sound', weakText: 'Cannot fight without music: loud attacks drown it and hurt more.',
      moves: [
        M('sixseven', 'Six Seven!', 'You say it and the foe gets so angry that it will explode.', 3, ['sound'], [d(6), { k: 'mark', name: 'rage', n: 3 }]),
        M('music', 'Music Control', 'Powerful music waves control the foe’s mind.', 3, ['sound'], [d(8), { k: 'mark', name: 'rage', n: 2 }]),
        M('pillow', 'Pillow Throw', 'You are lazy, so you throw pillows from the sofa.', 3, ['phys'], [d(13)]),
        M('candy', 'Throat Candy', 'A six-seven throat candy for your voice.', 2, ['sweet'], [{ k: 'heal', v: 14 }]),
        M('cat', 'Giant Cat Energy', 'Your giant cat gives you lots of energy.', 1, ['team'], [{ k: 'boost', m: 1.6, hits: 1 }, { k: 'heal', v: 6 }]),
      ],
      basic: B('MP3 Beat', 'You turn up the beat of your MP3 player.', ['sound'], [d(7)]),
    },
    {
      id: 'lazy', name: 'The Lazy Girl', emoji: '😴', img: null, color: '#6aa6d6', role: 'Sleep-maker',
      blurb: 'Wavy brown hair in a messy ponytail and sleepy eyes. Her clothes are everywhere, but she always knows where the chocolate biscuits are.',
      says: 'Patience is the virtue of the strong, laziness is the virtue of the wise.',
      q: {}, weakTag: 'sweet', weakText: 'Often stops to eat a lot: sweet and tasty attacks hurt more.',
      moves: [
        M('yawn', 'Ultra Yawn', 'One of her yawns makes people faint.', 3, ['sound'], [d(10), { k: 'mark', name: 'sleepy', n: 2 }]),
        M('blanket', 'Sleepy Blanket', 'A blanket wraps around people and makes them fall asleep.', 2, [], [d(6), { k: 'guard', p: .4, hits: 1 }, { k: 'mark', name: 'sleepy', n: 1 }]),
        M('sleeper', 'Instant Sleeper', 'You fall asleep in two seconds and wake up feeling great.', 1, [], [{ k: 'heal', v: 28 }, { k: 'selfSkip', n: 1 }]),
        M('butler', 'Butler Service', 'You make people do things for you.', 2, ['team'], [d(14), { k: 'weak', m: .7, hits: 1 }]),
      ],
      basic: B('Pillow Plop', 'You drop a fluffy pillow on the foe.', ['phys'], [d(7)]),
    },
    {
      id: 'explodingball', name: 'Miss Explodingball', emoji: '🏐', img: 'img/explodingball.jpg', color: '#e8c20f', role: 'Storm',
      blurb: 'Tall, with frizzy hair, always with her little mouse Ginger. Lightning struck them on a rainy day and gave her superpowers.',
      says: 'Now I try it!',
      q: { needsGinger: true }, quirk: 'Without the little mouse Ginger there are no powers. A very big hit scares Ginger away. A volleyball serve calls Ginger back.',
      moves: [
        M('spike', 'Volleyball Spike', 'You jump and spike the ball at the foe.', 3, ['phys'], [d(15)]),
        M('lightning', 'Lightning Shield', 'A bolt of lightning blinds the foe and protects you.', 2, ['light'], [{ k: 'guard', p: .5, hits: 1 }, { k: 'weak', m: .5, hits: 1 }]),
        M('electro', 'Electrocute', 'You electrocute the foe. It gets confused.', 2, ['light'], [d(16), { k: 'confuse', n: 1 }]),
        M('expert', 'Instant Expert', 'You become an animal in 2 seconds.', 1, [], [{ k: 'boost', m: 1.6, hits: 2 }]),
      ],
      basic: B('Volleyball Serve', 'You serve a volleyball. Ginger runs back to you.', ['phys'], [d(8), { k: 'flag', name: 'ginger', v: true }]),
    },
    {
      id: 'dancer', name: 'The Dancer', emoji: '🩰', img: 'img/dancer.jpg', color: '#47a8d8', role: 'Dancer',
      blurb: 'A ballerina with a bun and a blue tutu. She crashed into a tree during a pirouette and woke up with superpowers.',
      says: 'It’s done like this!',
      q: { needsWarm: true }, quirk: 'Needs to warm up the legs: no powers until the warm-up stretch is done.',
      moves: [
        M('tutu', 'Tutu Shield', 'The tutu makes an invisible bubble around you.', 2, [], [{ k: 'guard', p: .9, hits: 1 }]),
        M('spin', 'The Spin Attack', 'You spin like a top and leave the foe confused.', 3, ['phys'], [d(18), { k: 'confuse', n: 1 }]),
        M('extension', 'Rubber-Band Kick', 'Your legs stretch like a rubber band. The foe is stunned for a moment.', 1, ['phys'], [d(16), { k: 'skip', n: 1 }]),
        M('crown', 'Precious Crown', 'The crown helps you focus.', 2, [], [{ k: 'boost', m: 1.6, hits: 1 }]),
      ],
      basic: B('Warm-Up Stretch', 'You stretch your legs. Now you are ready to dance!', ['phys'], [d(6), { k: 'flag', name: 'warm', v: true }]),
    },
    {
      id: 'wavy', name: 'Weavy Wavy Girl', emoji: '🌊', img: 'img/wavy.jpg', color: '#8a6bd1', role: 'Voice & hair',
      blurb: 'Tall, with long wavy brown hair and big eyes. She is chatty, touchy and a bit pessimistic.',
      says: 'My waves trap you and my voice stops you.',
      q: { lowConf: true }, quirk: 'Pessimistic: below half of the HP, the Weavy Wavy Girl stops believing in herself and hits weaker.',
      moves: [
        M('trap', 'Hair Trap', 'Your hair moves with magic and traps the foe.', 1, ['phys'], [d(12), { k: 'skip', n: 1 }]),
        M('scream', 'Loud Scream', 'You scream very loud and block the foe.', 3, ['sound'], [d(19)]),
        M('brush', 'Magic Hairbrush', 'You comb your beautiful wavy hair and feel good.', 2, [], [{ k: 'heal', v: 16 }, { k: 'cleanse' }]),
        M('wall', 'Wavy Wall', 'Your waves make a soft wall around you.', 2, [], [{ k: 'guard', p: .6, hits: 2 }]),
      ],
      basic: B('Hair Whip', 'You whip the foe with your hair.', ['phys'], [d(8)]),
    },
    {
      id: 'rebel', name: 'Rebel Rider', emoji: '🚲', img: 'img/rebel.jpg', color: '#e5603c', role: 'Speedster',
      blurb: 'Short, with long brown hair and small glasses. A truck almost hit the bike, but the power of speed saved the day.',
      says: 'I saved myself once. Now I save others.',
      q: {}, weakTag: 'mind', weakText: 'She is anxious: mind tricks and confusing attacks hurt her more.',
      moves: [
        M('speed', 'Super Speed', 'You move so fast that you act twice in a row.', 3, [], [{ k: 'haste' }]),
        M('dash', 'Dodge Dash', 'You speed away from the next attack.', 3, [], [{ k: 'vanish', n: 1 }]),
        M('barrage', 'Blur Barrage', 'You hit the foe again and again, too fast to see.', 3, ['phys'], [d(7, 3)]),
        M('glasses', 'Special Glasses', 'Your special glasses show you where to hit.', 2, [], [{ k: 'pierce', n: 1 }, { k: 'boost', m: 1.5, hits: 1 }]),
      ],
      basic: B('Bike Ram', 'You ride your bike into the foe.', ['phys'], [d(8)]),
    },
  ];


  // The challenges of real life: the heroes the computer plays in "Villain vs Computer".
  // They are the people who say "no" to a villain: the teacher, the coach, a tired parent, a little sibling.
  const HEROES = [
    {
      id: 'fatigato', name: 'Ms. Fatigato', emoji: '👩‍🏫', img: 'img/fatigato.png', color: '#f06054', role: 'Real-life hero · English teacher', hero: true,
      blurb: 'Short, with frizzy hair in small braids and 5 university degrees. She is always right and she talks a lot. Her confidence is her power! One day she crashed her skateboard into a science truck and got superpowers.',
      says: 'Do you want to know about…?',
      q: { tired: 'hungry' }, quirk: 'Needs to be fed or she cannot use her powers: every power makes her hungrier. At 3 she cannot act until she eats. The Boyfriend’s snack helps!',
      moves: [
        M('talk', 'The Endless Talk', 'She talks and talks and talks. Enemies get tired and confused.', 2, ['sound'], [d(6), { k: 'confuse', n: 1 }, { k: 'weak', m: .7, hits: 1 }]),
        M('ego', 'Ego Shield', 'A shield made of pure confidence. It stops attacks, especially offenses.', 2, [], [{ k: 'guard', p: .7, hits: 1 }]),
        M('expert', 'Instant Expert', 'She becomes an expert in anything in 5 seconds. She reads one page and knows everything.', 2, [], [{ k: 'boost', m: 1.5, hits: 1 }]),
        M('book', 'The Big Book', 'The Big Book contains all the facts. It is also very heavy.', 2, ['phys'], [d(17)]),
        M('pens', 'Rainbow Pens', 'Pens in chromatic order correct every mistake, one after the other.', 3, ['phys'], [d(4, 3)]),
      ],
      basic: B('The Boyfriend’s Snack', 'A snack arrives just in time. Tasty and useful.', ['team', 'sweet'], [d(6), { k: 'heal', v: 4 }, { k: 'mark', name: 'tired', n: -1, self: true }]),
    },
    {
      id: 'professor', name: 'The Professor', emoji: '📚', img: null, color: '#3b7dd8', role: 'Real-life hero · school', hero: true,
      blurb: 'Glasses, a red pen and a very big bag of tests. Every villain meets the Professor sooner or later.',
      says: 'Open your books. Surprise!',
      q: {}, weakTag: 'sound', weakText: 'Cannot teach in a noisy room: loud attacks hurt more.',
      moves: [
        M('quiz', 'Pop Quiz', 'A surprise test! The foe has no time to think.', 3, ['mind'], [d(18)]),
        M('pen', 'Red Pen', 'You find every mistake, one after the other.', 2, ['phys'], [d(7, 3)]),
        M('homework', 'Extra Homework', 'A mountain of homework falls on the foe.', 1, ['mind'], [{ k: 'weak', m: .6, hits: 2 }]),
        M('detention', 'Detention', 'The foe must stay in class and cannot move.', 2, [], [{ k: 'skip', n: 1 }]),
      ],
      basic: B('Stern Look', 'A look over the glasses. It works every time.', ['mind'], [d(8)]),
    },
    {
      id: 'coach', name: 'The Coach', emoji: '🏃', img: null, color: '#e8802b', role: 'Real-life hero · sport', hero: true,
      blurb: 'A whistle, a stopwatch and a lot of energy. The Coach says: one more lap!',
      says: 'One more lap! You can do it!',
      q: {}, weakTag: 'sweet', weakText: 'Hates sweets and junk food: sweet attacks hurt more.',
      moves: [
        M('whistle', 'Whistle Blast', 'A very loud whistle makes everyone freeze.', 1, ['sound'], [{ k: 'skip', n: 1 }]),
        M('sprint', 'Sprint Drill', 'You run at the foe at full speed.', 2, ['phys'], [d(20)]),
        M('dodge', 'Dodgeball Barrage', 'Three balls fly one after the other.', 3, ['phys'], [d(5, 3)]),
        M('pep', 'Pep Talk', 'You shout “Believe in yourself!” and feel great.', 2, [], [{ k: 'boost', m: 1.5, hits: 1 }, { k: 'heal', v: 8 }]),
      ],
      basic: B('Push-up Push', 'You push the foe like a push-up.', ['phys'], [d(8)]),
    },
    {
      id: 'parent', name: 'The Stressed Parent', emoji: '😩', img: null, color: '#a35bb5', role: 'Real-life hero · home', hero: true,
      blurb: 'Three bags, one phone and no time. The Stressed Parent cares about you so much that it gets a bit loud.',
      says: 'Where are your shoes?! We are LATE!',
      q: {}, weakTag: 'team', weakText: 'Cannot do everything alone: attacks that call friends or helpers hurt more.',
      moves: [
        M('nag', 'The Endless Nagging', 'Wash your hands! Tidy your room! Put on your shoes!', 3, ['sound'], [d(5, 3)]),
        M('grounded', 'You Are Grounded!', 'The foe cannot go anywhere.', 1, [], [{ k: 'skip', n: 1 }]),
        M('coffee', 'Emergency Coffee', 'A big hot coffee. Now you are almost calm.', 2, ['sweet'], [{ k: 'heal', v: 17 }]),
        M('hug', 'Hug of Doom', 'A hug so tight that no hit can get through.', 2, [], [{ k: 'guard', p: .7, hits: 1 }]),
        M('look', 'Tired Sigh', 'A very long sigh and the foe feels guilty.', 2, ['mind'], [d(12), { k: 'weak', m: .7, hits: 1 }]),
      ],
      basic: B('Phone Call', 'You answer the phone and shout at the foe by mistake.', ['sound'], [d(8)]),
    },
    {
      id: 'sibling', name: 'The Little Sibling', emoji: '🧸', img: null, color: '#d95f9b', role: 'Real-life hero · family', hero: true,
      blurb: 'Small, sticky and impossible to stop. The Little Sibling touches your things and nobody ever gets the blame.',
      says: 'Mine! Give it to me!',
      q: {}, weakTag: 'dark', weakText: 'Is afraid of the dark: shadow attacks hurt more.',
      moves: [
        M('tantrum', 'Tantrum Scream', 'You scream and scream and scream.', 3, ['sound'], [d(18)]),
        M('hide', 'Hide and Seek', 'You hide behind the sofa. Nobody can find you.', 2, [], [{ k: 'vanish', n: 1 }]),
        M('sticky', 'Sticky Fingers', 'Jam on the hands, jam on the foe.', 2, ['sweet'], [d(12), { k: 'weak', m: .7, hits: 1 }]),
        M('puppy', 'Puppy Eyes', 'The foe cannot say no to those eyes.', 2, ['mind'], [{ k: 'skip', n: 1 }]),
      ],
      basic: B('Tiny Kick', 'A kick on the leg. It does not hurt much.', ['phys'], [d(8)]),
    },
  ];

  // how much planning a villain needs (1 = easy to play, 3 = for experts): from the duels of the computer at the easy level
  const SKILL = { goget: 1, kick: 1, dancer: 1, wavy: 1, hands: 1, cactus: 1, skater: 2, mask: 2, explodingball: 2, honey: 2, anxious: 2, lazy: 3, vampire: 3, sixseven: 3, rebel: 3 };

  // add the strength of each move, the words that hint at it, and fill the gaps
  [...ROSTER, ...HEROES].forEach(k => {
    k.q = k.q || {};
    k.skill = SKILL[k.id] || 0;
    [...k.moves, k.basic].forEach(m => { m.rate = 0; });
    k.moves.filter(m => !m.fx.some(f => f.k === 'randomPower')).forEach(m => { m.rate = E.moveRate(m, k); });
    k.moves.filter(m => m.fx.some(f => f.k === 'randomPower')).forEach(m => { m.rate = E.moveRate(m, k); });
    k.basic.rate = E.moveRate(k.basic, k);
    [...k.moves, k.basic].forEach(m => { m.hint = E.hint(m); });
  });

  root.V2A.ROSTER = ROSTER;
  root.V2A.HEROES = HEROES;
  if (typeof module !== 'undefined') module.exports = ROSTER;
})(typeof window !== 'undefined' ? window : globalThis);
