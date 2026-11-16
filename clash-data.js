// Rome vs Longobards: the Clash (clash.js). The data: jobs ("classes" of the heroes) and the grammar questions.
// Rules of the game in one place (also on the book pages [ps-clash-intro], [ps-clash-hero] and the teacher notes [scaf-ps-clash]):
//  - A hero has 4 stats from 1 to 5, total 12: STR (attack), AGI (defense / escape), END (hit points = 4 + 2 x END), WIS (helps the escape).
//  - A family = a man + a woman. Men always fight. Women: depending on the culture they FIGHT or FLEE (the teacher can change it in the setup).
//  - Every round starts with a grammar question: the family that answers right gets a boost.

window.CLASH_DATA = {
  // perk fields: atk / def (added to the roll), hp (more hit points), flee (added to the escape roll), heal (HP given back when she escapes), boost (more boost for the family when it answers right)
  JOBS: {
    R: {
      man: [
        { k: 'legionary', e: '🛡️', n: 'Legionary', perk: '+1 defense', def: 1 },
        { k: 'gladiator', e: '⚔️', n: 'Gladiator', perk: '+1 attack', atk: 1 },
        { k: 'centurion', e: '🎖️', n: 'Centurion', perk: '+1 boost for the family', boost: 1 },
        { k: 'farmer', e: '🌾', n: 'Farmer', perk: '+2 hit points', hp: 2 },
        { k: 'merchant', e: '💰', n: 'Merchant', perk: '+1 defense (he runs fast)', def: 1 },
      ],
      woman: [
        { k: 'weaver', e: '🧶', n: 'Weaver', perk: '+1 to escape', flee: 1 },
        { k: 'healer', e: '🌿', n: 'Healer', perk: 'heals 2 HP when she escapes', heal: 2 },
        { k: 'priestess', e: '🏛️', n: 'Priestess', perk: '+1 boost for the family', boost: 1 },
        { k: 'baker', e: '🍞', n: 'Baker', perk: '+1 attack (strong arms)', atk: 1 },
        { k: 'scribe', e: '📜', n: 'Scribe', perk: '+1 to escape and +1 defense', flee: 1, def: 1 },
      ],
    },
    L: {
      man: [
        { k: 'warrior', e: '🪓', n: 'Warrior', perk: '+1 attack', atk: 1 },
        { k: 'horseman', e: '🐴', n: 'Horseman', perk: '+1 defense', def: 1 },
        { k: 'hunter', e: '🏹', n: 'Hunter', perk: '+1 attack and +1 to escape', atk: 1, flee: 1 },
        { k: 'smith', e: '🔨', n: 'Smith', perk: '+2 hit points', hp: 2 },
        { k: 'noble', e: '👑', n: 'Noble', perk: '+1 boost for the family', boost: 1 },
      ],
      woman: [
        { k: 'shieldmaiden', e: '🛡️', n: 'Shield-maiden', perk: '+1 defense', def: 1 },
        { k: 'herbalist', e: '🌿', n: 'Herbalist', perk: 'heals 2 HP when she escapes', heal: 2 },
        { k: 'weaver', e: '🧶', n: 'Weaver', perk: '+1 to escape', flee: 1 },
        { k: 'storyteller', e: '📖', n: 'Storyteller', perk: '+1 boost for the family', boost: 1 },
        { k: 'rider', e: '🐎', n: 'Rider', perk: '+1 attack and +1 to escape', atk: 1, flee: 1 },
      ],
    },
  },

  // the grammar questions. choice: { q, o: [options], a: index of the right one }  ·  gap: { q, a: 'right|other right' }
  Q: [
    { q: 'Wulf ___ his face with cold water.', o: ['wash', 'washes', 'washing'], a: 1 },
    { q: 'The warriors ___ with swords every day.', o: ['train', 'trains', 'training'], a: 0 },
    { q: 'Aemilia ___ Latin with her tutor.', o: ['study', 'studies', 'studys'], a: 1 },
    { q: '___ the Romans speak Latin?', o: ['Do', 'Does', 'Is'], a: 0 },
    { q: 'Wulf ___ eat lunch alone.', o: ["don't", "doesn't", "isn't"], a: 1 },
    { q: 'The slaves ___ the food to the table.', o: ['bring', 'brings', 'bringing'], a: 0 },
    { q: 'My father always ___ me up before sunrise.', o: ['wake', 'wakes', 'waking'], a: 1 },
    { q: 'A girl from a good family ___ goes out alone.', o: ['always', 'never', 'sometimes'], a: 1 },
    { q: 'Wulf ___ falls asleep by the fire. (50%)', o: ['always', 'sometimes', 'never'], a: 1 },
    { q: 'Training starts ___ sunrise.', o: ['in', 'on', 'at'], a: 2 },
    { q: 'They have dinner ___ the evening.', o: ['at', 'in', 'on'], a: 1 },
    { q: 'Wulf eats bread ___ breakfast.', o: ['for', 'at', 'in'], a: 0 },
    { q: 'Does Aemilia ___ Greek?', o: ['learn', 'learns', 'learning'], a: 0 },
    { q: 'The older boys ___ at Wulf.', o: ['laugh', 'laughs', 'laughing'], a: 0 },
    { q: 'She ___ her mother in the garden.', o: ['help', 'helps', 'helping'], a: 1 },
    { q: 'Which sentence is correct?', o: ['He go to bed.', 'He goes to bed.', 'He is go to bed.'], a: 1 },
    { q: 'Which sentence is correct?', o: ['Do Wulf ride a horse?', 'Does Wulf ride a horse?', 'Does Wulf rides a horse?'], a: 1 },
    { q: 'Which word starts the routine?', o: ['Finally', 'First', 'After'], a: 1 },
    { q: 'Which word ends the routine?', o: ['Finally', 'First', 'Then'], a: 0 },
    { q: 'The Longobards enter Italy in …', o: ['476 AD', '568 AD', '774 AD'], a: 1 },
    { q: 'Aemilia lives in …', o: ['Pavia', 'Mediolanum', 'Ravenna'], a: 1 },
    { q: 'Rich Romans ___ on couches at dinner.', o: ['recline', 'reclines', 'reclining'], a: 0 },
    { q: 'The Romans live in a ___ with an atrium.', o: ['domus', 'castle', 'hut'], a: 0 },
    { q: 'The first Roman emperor is …', o: ['Augustus', 'Alboin', 'Charlemagne'], a: 0 },
    { q: 'The king who leads the Longobards into Italy is …', o: ['Romulus', 'Alboin', 'Philon'], a: 1 },
    { q: 'Wulf ___ a wooden sword.', o: ['use', 'uses', 'using'], a: 1 },
    { q: 'Her brothers ___ at dinner.', o: ['argue', 'argues', 'arguing'], a: 0 },
    { q: 'What time ___ she wake up?', o: ['do', 'does', 'is'], a: 1 },
    { q: 'Marta ___ water to the house.', t: 'gap', a: 'carries' },
    { q: 'Wulf ___ (wake) up before sunrise.', t: 'gap', a: 'wakes' },
    { q: 'Aemilia ___ (go) to bed early.', t: 'gap', a: 'goes' },
    { q: 'Liutwald ___ (watch) his son in training.', t: 'gap', a: 'watches' },
    { q: 'The Roman girl ___ (not choose) her clothes.', t: 'gap', a: "doesn't choose|does not choose" },
    { q: 'The warriors ___ (not talk) at lunch.', t: 'gap', a: "don't talk|do not talk" },
    { q: '___ Wulf ride a horse? (Do / Does)', t: 'gap', a: 'does' },
    { q: 'Aemilia ___ (have) breakfast with her mother.', t: 'gap', a: 'has' },
    { q: 'Wulf ___ (fall) asleep by the fire.', t: 'gap', a: 'falls' },
    { q: 'He ___ (try) again and again.', t: 'gap', a: 'tries' },
    { q: 'Training starts ___ sunrise. (at / in / on)', t: 'gap', a: 'at' },
    { q: '___ the evening, they sit around the fire. (At / In / On)', t: 'gap', a: 'in' },
    { q: 'The Longobards ___ (enter) Italy in 568 AD.', t: 'gap', a: 'enter' },
    { q: 'The Romans ___ (build) roads and baths.', t: 'gap', a: 'build' },
    { q: 'She ___ (study) Latin and Greek.', t: 'gap', a: 'studies' },
    { q: 'Philon ___ (teach) Aemilia.', t: 'gap', a: 'teaches' },
    { q: 'Does Aemilia go out alone? No, she ___.', t: 'gap', a: "doesn't|does not" },
    { q: 'Wulf ___ (not use) a real sword.', t: 'gap', a: "doesn't use|does not use" },
    { q: 'First, I wake up. ___, I get dressed. (Then / Before)', t: 'gap', a: 'then' },
    { q: 'He ___ (do) his homework after dinner.', t: 'gap', a: 'does' },
  ],

  // names for the "random families" button
  NAMES: {
    R: { fam: ['Aelius', 'Valerius', 'Cornelius', 'Julius', 'Claudius', 'Flavius', 'Livius', 'Septimius'], man: ['Marcus', 'Lucius', 'Gaius', 'Titus', 'Quintus', 'Decimus'], woman: ['Aemilia', 'Livia', 'Julia', 'Claudia', 'Octavia', 'Cornelia'] },
    L: { fam: ['Alboin', 'Rothari', 'Agilulf', 'Grimoald', 'Liutprand', 'Authari', 'Gisulf', 'Ratchis'], man: ['Wulf', 'Liutwald', 'Aistulf', 'Garibald', 'Theudo', 'Walbert'], woman: ['Rosamund', 'Theodelinda', 'Gundeberga', 'Ildiko', 'Hildegard', 'Waldrada'] },
  },
};

// ---- the hero sheet in the book ([ps-clash-hero]): every job gives 9 points of base stats [STR, AGI, END, WIS]; the pupil adds 3 points (max 5 in a stat) = 12 in total ----
(() => {
  const BASE = {
    R: { man: { legionary: [3, 2, 3, 1], gladiator: [4, 2, 2, 1], centurion: [3, 1, 2, 3], farmer: [2, 1, 4, 2], merchant: [1, 3, 2, 3] },
         woman: { weaver: [1, 3, 2, 3], healer: [1, 2, 2, 4], priestess: [1, 1, 3, 4], baker: [3, 1, 3, 2], scribe: [1, 3, 1, 4] } },
    L: { man: { warrior: [4, 2, 2, 1], horseman: [2, 4, 2, 1], hunter: [3, 3, 2, 1], smith: [3, 1, 4, 1], noble: [2, 2, 2, 3] },
         woman: { shieldmaiden: [3, 3, 2, 1], herbalist: [1, 2, 2, 4], weaver: [1, 3, 2, 3], storyteller: [1, 2, 2, 4], rider: [2, 4, 2, 1] } },
  };
  const J = window.CLASH_DATA.JOBS;
  for (const s of ['R', 'L']) for (const role of ['man', 'woman']) J[s][role].forEach(j => { j.base = BASE[s][role][j.k]; });
  window.CLASH_DATA.BONUS_POINTS = 3;
  // favorite games and hobbies that fit the culture and the time (Romans about 350 AD, Longobards about 600 AD)
  window.CLASH_DATA.LIKES = {
    R: {
      game: ['knucklebones (tali)', 'Roman chess (latrunculi)', 'backgammon (tabula)', 'hoop and stick', 'ball games', 'dice', 'nuts and marbles', 'odds and evens'],
      hobby: ['going to the baths', 'reading and poetry', 'playing the lyre', 'watching chariot races', 'going to the theater', 'gardening', 'singing', 'walking in the forum', 'watching gladiator shows'],
    },
    L: {
      game: ['dice games', 'a board game (tafl)', 'knucklebones', 'wrestling', 'horse races', 'archery contests', 'ball games', 'knife throwing'],
      hobby: ['hunting in the forest', 'riding horses', 'listening to stories', 'playing the lyre or the horn', 'fishing in the river', 'taking care of the horses', 'making jewelry', 'wood carving', 'feasts with music'],
    },
  };
  window.CLASH_DATA.LOOK = {
    hair: ['black', 'dark brown', 'light brown', 'blond', 'red', 'gray'],
    style: ['long', 'short', 'curly', 'straight', 'braided'],
    eyes: ['brown', 'green', 'blue', 'gray', 'black'],
    build: ['tall and strong', 'tall and slim', 'short and strong', 'short and quick', 'medium'],
  };
  window.CLASH_DATA.ADJ = ['brave', 'kind', 'clever', 'funny', 'shy', 'proud', 'loyal', 'curious', 'calm', 'generous', 'honest', 'quiet', 'cheerful', 'stubborn', 'patient', 'serious', 'friendly', 'careful', 'lazy', 'strong-willed'];
})();

// an emoji for every game and hobby (the hero sheet shows it on a little tile, like the hobbies of a CV)
(() => {
  window.CLASH_DATA.ICON = {
    'knucklebones (tali)': '🦴', 'Roman chess (latrunculi)': '♟️', 'backgammon (tabula)': '🎲', 'hoop and stick': '⭕', 'ball games': '⚽', 'dice': '🎲', 'nuts and marbles': '🌰', 'odds and evens': '✋',
    'going to the baths': '🛁', 'reading and poetry': '📜', 'playing the lyre': '🎶', 'watching chariot races': '🐎', 'going to the theater': '🎭', 'gardening': '🌿', 'singing': '🎤', 'walking in the forum': '🏛️', 'watching gladiator shows': '⚔️',
    'dice games': '🎲', 'a board game (tafl)': '♟️', 'knucklebones': '🦴', 'wrestling': '🤼', 'horse races': '🏇', 'archery contests': '🏹', 'knife throwing': '🔪',
    'hunting in the forest': '🦌', 'riding horses': '🐴', 'listening to stories': '📖', 'playing the lyre or the horn': '🎶', 'fishing in the river': '🎣', 'taking care of the horses': '🐎', 'making jewelry': '💍', 'wood carving': '🪵', 'feasts with music': '🍖',
  };
})();
