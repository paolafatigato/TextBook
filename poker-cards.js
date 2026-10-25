// Grammar Poker: ALL the data. Edit the words, the levels and the texts here; the logic is in
// poker-engine.js (the grammar and the hands) and poker.js (the screens).
//
// The deck of a game has 52 cards (13 for each suit) and it is made at the start of every game:
// every card here is a SLOT of the deck. A slot has
//   decks    = the Levels whose deck has the slot (1, 2, 3). Level 1 = present simple, Level 2 = all the verbs in the past,
//              Level 3 = modals (can, must…) and comparatives. Every deck has 52 slots.
//   variants = other words that can take the place of the slot, chosen at random in every game (Anna → Paola, bunnies → horses).
//              A variant is a word (everything else stays the same) or { word, …the fields that change }.
//              A variant MUST have the same characteristics as the slot (same suit, subtype, number, kind, takes…).
//   level    = how difficult the card is (1 easy … 3): only for the tie-break, "more difficult cards win".
//   subtype  = the "rank" of the card: two cards with the same suit AND subtype make a pair (see pairBy in "levels").
//
// Fields the grammar looks at:
//   noun      number 'singular' | 'plural'; subtype 'countable' (needs a / an / the), 'plural', 'uncountable', 'proper'
//             kind 'person' | 'animal' | 'food' | 'drink' | 'thing' | 'place'  (the meaning check: persons and animals are "animate")
//             edible: true = an animal that people eat (bunnies, horses): eat / cooked accept it as food, but it stays an animal (it can still be a subject)
//   verb      subjectKind 'animate' = only people and animals do it; objectKinds = the kinds it can have as object
//   modifier  needs 'animate' = only people and animals can be it (happy, hungry)
//   verb      tense 'present' | 'past'; person '3rd' (is, has, likes, runs) | 'other' (the rank for pairs, see pairBy)
//             agrees  who can be the subject: 'I', 'you', 'sg' (he / she / it / one thing), 'pl' (we / they / more things), 'any'
//             takes   what comes after: 'np' (object), 'adj', 'pp' (in / to / with …), 'none' (nothing needed), 'base' (modals: a base verb)
//             base    true = this form can follow can / must
//   modifier  subtype 'adjective' | 'adverb' | 'comparative'
//             adverb kind: 'manner' (quickly) | 'frequency' (always) | 'degree' (very) | 'time' (yesterday)
//             comparative asAdverb: true = it can also go after a verb (runs faster)
//   any card  alt: [ {…} ] = a SECOND MEANING (for the sentences only; for pairs and flushes the card stays what it is printed):
//             the fields of the other reading (suit, subtype, …) + note (shown with the “Very clever!” spark). Sentences that need it give +1 chip.
//   function  subtype 'pronoun' (person: 'I' | 'you' | 'sg' | 'pl'), 'article', 'preposition', 'connector'

const GP_DATA = {

  suits: {
    noun:     { symbol: '♠', name: 'NOUNS',          color: '#f05f4b' },
    verb:     { symbol: '♥', name: 'VERBS',          color: '#3b9ae0' },
    modifier: { symbol: '♦', name: 'MODIFIERS',      color: '#8e2de2' },
    function: { symbol: '♣', name: 'FUNCTION WORDS', color: '#3aa04a' },
  },

  // the kinds of poker (the grammar and the hands are the same, only the deal changes)
  modes: [
    // Taken out for now (it is not a real poker): remove the // to get it back. 7 cards, one swap of up to 3.
    // { id: 'grammar', name: 'Grammar Poker', text: '7 cards, swap up to 3, build a sentence.',                  handSize: 7, swaps: 3, shared: 0, royalMin: 6, order: ['high', 'pair', 'two', 's3', 's4', 'trips', 's5', 'full', 's6', 'four', 'flush', 'royal'] },
    { id: 'italian', name: 'Poker all’italiana', text: '5 cards, one swap of any cards (even all 5).',         handSize: 5, swaps: 5, shared: 0, royalMin: 5,
      order: ['high', 'pair', 's3', 'two', 'trips', 's4', 's5', 'full', 'four', 'flush', 'royal'] },
    { id: 'texas',   name: 'Texas Hold’em', text: '2 cards of yours + 5 on the table, shown one step at a time.', handSize: 2, swaps: 0, shared: 5, royalMin: 6,
      // no High card in the Texas Hold’em: with no combination you have no hand. The same hand (the same sentence length) = the pot is shared:
      // the dots ●●● are not used for the tie-break.
      tieDots: false, tieBreak: 'No pair and no sentence? Then you have no hand. The same hand? The pot is shared. (A longer sentence is stronger than a shorter one.)',
      order: ['pair', 'two', 's3', 's4', 'trips', 's5', 'full', 's6', 'four', 'flush', 'royal'] },
  ],

  // the small caption on the cards (it shows what the "rank" of the card is)
  subtypes: {
    noun:     { countable: 'countable · singular', plural: 'plural noun', uncountable: 'uncountable · singular', proper: 'name · singular' },
    verb:     { be: 'verb BE', have: 'verb HAVE', regular: 'regular verb', irregular: 'irregular verb', modal: 'modal verb' },
    modifier: { adjective: 'adjective', adverb: 'adverb', comparative: 'comparative' },
    function: { pronoun: 'pronoun', article: 'article', preposition: 'preposition', connector: 'connector', comparison: 'comparison word' },
  },

  // The three decks. botSkill = how often Robo finds its best sentence.
  // pairBy = what makes a pair: cards with the same suit AND the same value of this field (default: the subtype). Nouns pair by number
  // (all the singular nouns together, even countable + uncountable, and all the plurals); in the present deck the verbs pair by person
  // (3rd person -s together, the others together); in the other decks the verbs have no person, so they pair by subtype.
  levels: [
    { id: 1, name: 'Level 1', title: 'Present simple',         text: 'All the verbs are in the present: I like, she likes, they are…', botSkill: 0.55, pairBy: { noun: 'number', verb: 'person' } },
    { id: 2, name: 'Level 2', title: 'Past simple',            text: 'All the verbs are in the past: I was, she went, they ate…',       botSkill: 0.75, pairBy: { noun: 'number' } },
    { id: 3, name: 'Level 3', title: 'Can, must & bigger than', text: 'Modals (can, must, should, will) and comparatives (bigger than).', botSkill: 0.9,  pairBy: { noun: 'number' } },
  ],

  // Does the meaning count? 'check' = the game refuses sentences that make no sense (“I ate nice people”: only people and animals eat…).
  // 'open' = only the grammar counts; a strange sentence is flagged 🤔 and, against Robo, the class decides if it is convincing
  // (the player must explain a situation where it is true: “I was a cannibal…”).
  meaning: [
    { id: 'check', name: '🧠 The game checks the meaning', text: 'A sentence that makes no sense does not count.' },
    { id: 'open',  name: '🗣 Open: only the grammar',       text: 'Strange sentences count if you can explain a situation where they are true. The class decides.' },
  ],

  settings: {
    rounds: 0,        // deals in a game: 0 = you play until somebody has no chips left (you lose when YOUR chips are over)
    maxRounds: 60,    // the most deals of a game when rounds is 0 (a safety limit: then the one with more chips wins)
    chips: 100,       // chips at the start
    ante: 5,          // everybody puts this in the pot before the deal
    bet: 10,          // the usual bet (Robo raises with it)
    bets: [5, 10, 25], // the bets you can choose; the last button is always ALL IN (all the chips of the poorer player)
    handSize: 7,      // cards in a hand
    swaps: 3,         // cards you can swap once
    minSentence: 3,   // cards in the shortest sentence
    wrongTry: 1,      // chips you lose for a wrong "Check" (0 = nothing)
  },

  // The hands. Each poker has its own ORDER (modes: order, from the weakest to the strongest), because the order follows how RARE a hand is,
  // counted on thousands of random hands (percentage of hands that can make it; first number 7 cards, second 5 cards):
  //   pair 84-94 / 56-74 · two pairs 31-52 / 6-13 · sentence of 3 cards 37-46 / 16-22 · of 4 cards 28-35 / 7-11 · three of a kind 20-30 / 6-10
  //   sentence of 5 cards 15-20 / 1-2 · full house 7-15 / ~1 · sentence of 6+ cards 4-6 · four of a kind 2-5 / ~1 · flush 2-4 / ~0 · Royal Sentence 3-5 / ~1
  // So with 7 cards a sentence of 3 cards is about as common as two pairs, one of 4 cards as three of a kind, one of 5 cards as a full house;
  // with 5 cards the sentences are even more common than two pairs. A longer sentence is always stronger than a shorter one.
  // "sentence: true" = the hands made with a correct sentence.
  hands: [
    { key: 'high',  name: 'High card',       how: 'No combination. The card with the most dots (the most difficult word ●●●) counts.', example: '' },
    { key: 'pair',  name: 'Pair',             how: '2 cards of the same type: 2 plural nouns ♠, 2 singular nouns ♠ (even countable + uncountable), 2 verbs in the 3rd person ♥ (is + has)…', example: 'books + bunnies · dog + pizza · is + has' },
    { key: 'two',   name: 'Two pairs',        how: '2 different pairs.', example: 'books + bunnies, dog + cat' },
    { key: 's3',    name: 'Sentence of 3 cards', sentence: true, how: 'A correct sentence with 3 cards.', example: 'Anna likes pizza.' },
    { key: 's4',    name: 'Sentence of 4 cards', sentence: true, how: 'A correct sentence with 4 cards.', example: 'The dog runs quickly.' },
    { key: 'trips', name: 'Three of a kind',  how: '3 cards of the same type.', example: 'is + am + are' },
    { key: 's5',    name: 'Sentence of 5 cards', sentence: true, how: 'A correct sentence with 5 cards.', example: 'Anna likes pizza with friends.' },
    { key: 'full',  name: 'Full house',       how: 'Three of a kind + a pair.', example: 'is + am + are + books + bunnies' },
    { key: 's6',    name: 'Sentence of 6+ cards', sentence: true, how: 'A correct sentence with 6 or more cards. A longer sentence is stronger.', example: 'Anna and I like pizza with friends.' },
    { key: 'four',  name: 'Four of a kind',   how: '4 cards of the same type.', example: 'I + you + she + they' },
    { key: 'flush', name: 'Flush',            how: '5 cards of the same suit (for example 5 nouns ♠).', example: '5 × ♥' },
    { key: 'royal', name: 'Royal Sentence',   sentence: true, how: 'A correct sentence that uses all 4 suits ♠ ♥ ♦ ♣ and has 6 or more cards (5 in the poker with 5 cards).', example: 'The happy dog likes pizza quickly.' },
  ],
  tieBreak: 'Same hand? The longer sentence wins. Then the hand with the more difficult cards wins: the dots ●●● on the cards say how difficult a word is (● easy, ●● harder, ●●● the hardest).',

  cards: [
    // ♠ NOUNS: the same 13 slots in every deck
    { word: 'dog',      decks: [1, 2, 3], suit: 'noun', subtype: 'countable',   number: 'singular', level: 1, kind: 'animal', variants: ['dragon', 'axolotl'] },
    { word: 'cat',      decks: [1, 2, 3], suit: 'noun', subtype: 'countable',   number: 'singular', level: 1, kind: 'animal', variants: ['bird', 'mouse'] },
    { word: 'apple',    decks: [1, 2, 3], suit: 'noun', subtype: 'countable',   number: 'singular', level: 1, kind: 'food',   variants: ['orange', 'banana', 'sandwich'] },
    { word: 'teacher',  decks: [1, 2, 3], suit: 'noun', subtype: 'countable',   number: 'singular', level: 1, kind: 'person', variants: ['doctor', 'student', 'boy', 'girl'] },
    { word: 'books',    decks: [1, 2, 3], suit: 'noun', subtype: 'plural',      number: 'plural',   level: 1, kind: 'thing',  // no variants: its second meaning is a verb (to book)
      alt: [{ suit: 'verb', subtype: 'regular', tense: 'present', agrees: ['sg'], person: '3rd', takes: ['np'], subjectKind: 'animate', objectKinds: ['event'], note: 'to book = to reserve (prenotare)', decks: [1, 3] }] },
    { word: 'bunnies',  decks: [1, 2, 3], suit: 'noun', subtype: 'plural',      number: 'plural',   level: 1, kind: 'animal', edible: true, variants: ['horses', 'ducks', 'frogs'] },   // animals: subject AND object
    { word: 'friends',  decks: [1, 2, 3], suit: 'noun', subtype: 'plural',      number: 'plural',   level: 1, kind: 'person', variants: ['cousins', 'parents', 'classmates'] },
    { word: 'children', decks: [1, 2, 3], suit: 'noun', subtype: 'plural',      number: 'plural',   level: 2, kind: 'person', irregular: true, variants: ['people', 'men', 'women'] },
    { word: 'water',    decks: [1, 2, 3], suit: 'noun', subtype: 'uncountable', number: 'singular', level: 1, kind: 'drink',  variants: ['milk', 'juice', 'tea'] },
    { word: 'homework', decks: [1, 2, 3], suit: 'noun', subtype: 'uncountable', number: 'singular', level: 1, kind: 'thing',  variants: ['music', 'money'] },
    { word: 'pizza',    decks: [1, 2, 3], suit: 'noun', subtype: 'uncountable', number: 'singular', level: 1, kind: 'food',   variants: ['rice', 'bread', 'pasta', 'cheese'] },
    { word: 'Anna',     decks: [1, 2, 3], suit: 'noun', subtype: 'proper',      number: 'singular', level: 1, kind: 'person', variants: ['Paola', 'Giulia', 'Omar', 'Ahmed', 'Sara'] },
    { word: 'London',   decks: [1, 2, 3], suit: 'noun', subtype: 'proper',      number: 'singular', level: 2, kind: 'place',  variants: ['Rome', 'Paris', 'Milan', 'Italy'] },

    // ♥ VERBS
    //   Level 1 (present): am is are · have has · play plays like likes · eat eats · run runs
    { word: 'am',     decks: [1, 3], suit: 'verb', subtype: 'be',        tense: 'present', agrees: ['I'],              person: 'other', takes: ['adj', 'np', 'pp'], level: 1 },
    { word: 'is',     decks: [1, 3], suit: 'verb', subtype: 'be',        tense: 'present', agrees: ['sg'],             person: '3rd',   takes: ['adj', 'np', 'pp'], level: 1 },
    { word: 'are',    decks: [1, 3], suit: 'verb', subtype: 'be',        tense: 'present', agrees: ['you', 'pl'],      person: 'other', takes: ['adj', 'np', 'pp'], level: 1 },
    { word: 'have',   decks: [1, 3], suit: 'verb', subtype: 'have',      tense: 'present', agrees: ['I', 'you', 'pl'], person: 'other', takes: ['np'], base: true, level: 1, subjectKind: 'animate', objectKinds: ['person', 'animal', 'food', 'drink', 'thing', 'event'] },
    { word: 'has',    decks: [1],    suit: 'verb', subtype: 'have',      tense: 'present', agrees: ['sg'],             person: '3rd',   takes: ['np'], level: 1, subjectKind: 'animate', objectKinds: ['person', 'animal', 'food', 'drink', 'thing', 'event'] },
    { word: 'play',   decks: [1, 3], suit: 'verb', subtype: 'regular',   tense: 'present', agrees: ['I', 'you', 'pl'], person: 'other', takes: ['none'], base: true, level: 1, subjectKind: 'animate',   // no variants: its second meaning is a noun (a play)
      alt: [{ suit: 'noun', subtype: 'countable', number: 'singular', kind: 'event', note: 'a play = a show in the theater (un’opera teatrale)', decks: [1, 3] }] },
    { word: 'plays',  decks: [1],    suit: 'verb', subtype: 'regular',   tense: 'present', agrees: ['sg'],             person: '3rd',   takes: ['none'], level: 1, subjectKind: 'animate', variants: ['walks', 'works'] },
    { word: 'like',   decks: [1, 3], suit: 'verb', subtype: 'regular',   tense: 'present', agrees: ['I', 'you', 'pl'], person: 'other', takes: ['np'], base: true, level: 1, subjectKind: 'animate', variants: ['love', 'want'] },
    { word: 'likes',  decks: [1],    suit: 'verb', subtype: 'regular',   tense: 'present', agrees: ['sg'],             person: '3rd',   takes: ['np'], level: 1, subjectKind: 'animate', variants: ['loves', 'wants'] },
    { word: 'eat',    decks: [1, 3], suit: 'verb', subtype: 'irregular', tense: 'present', agrees: ['I', 'you', 'pl'], person: 'other', takes: ['np', 'none'], base: true, level: 1, subjectKind: 'animate', objectKinds: ['food', 'drink'] },
    { word: 'eats',   decks: [1],    suit: 'verb', subtype: 'irregular', tense: 'present', agrees: ['sg'],             person: '3rd',   takes: ['np', 'none'], level: 1, subjectKind: 'animate', objectKinds: ['food', 'drink'] },
    { word: 'run',    decks: [1, 3], suit: 'verb', subtype: 'irregular', tense: 'present', agrees: ['I', 'you', 'pl'], person: 'other', takes: ['none'], base: true, level: 1, subjectKind: 'animate', variants: ['go'] },
    { word: 'runs',   decks: [1],    suit: 'verb', subtype: 'irregular', tense: 'present', agrees: ['sg'],             person: '3rd',   takes: ['none'], level: 1, subjectKind: 'animate', variants: ['goes'] },
    //   Level 2 (all the verbs in the past): was were · had · played liked watched cooked helped · ate ran went saw bought
    { word: 'was',    decks: [2],    suit: 'verb', subtype: 'be',        tense: 'past', agrees: ['I', 'sg'],           person: 'other', takes: ['adj', 'np', 'pp'], level: 2 },
    { word: 'were',   decks: [2],    suit: 'verb', subtype: 'be',        tense: 'past', agrees: ['you', 'pl'],         person: 'other', takes: ['adj', 'np', 'pp'], level: 2 },
    { word: 'had',    decks: [2],    suit: 'verb', subtype: 'have',      tense: 'past', agrees: ['any'],               person: 'other', takes: ['np'], level: 2, subjectKind: 'animate', objectKinds: ['person', 'animal', 'food', 'drink', 'thing', 'event'] },
    { word: 'played', decks: [2],    suit: 'verb', subtype: 'regular',   tense: 'past', agrees: ['any'],               person: 'other', takes: ['none'], level: 2, subjectKind: 'animate', variants: ['walked', 'worked'] },
    { word: 'liked',  decks: [2],    suit: 'verb', subtype: 'regular',   tense: 'past', agrees: ['any'],               person: 'other', takes: ['np'], level: 2, subjectKind: 'animate', variants: ['loved', 'wanted'] },
    { word: 'watched', decks: [2],   suit: 'verb', subtype: 'regular',   tense: 'past', agrees: ['any'],               person: 'other', takes: ['np'], level: 2, subjectKind: 'animate', objectKinds: ['person', 'animal', 'event', 'thing'] },
    { word: 'cooked', decks: [2],    suit: 'verb', subtype: 'regular',   tense: 'past', agrees: ['any'],               person: 'other', takes: ['np'], level: 2, subjectKind: 'animate', objectKinds: ['food'] },
    { word: 'helped', decks: [2],    suit: 'verb', subtype: 'regular',   tense: 'past', agrees: ['any'],               person: 'other', takes: ['np'], level: 2, subjectKind: 'animate', objectKinds: ['person', 'animal'] },
    { word: 'ate',    decks: [2],    suit: 'verb', subtype: 'irregular', tense: 'past', agrees: ['any'],               person: 'other', takes: ['np', 'none'], level: 2, subjectKind: 'animate', objectKinds: ['food', 'drink'] },
    { word: 'ran',    decks: [2],    suit: 'verb', subtype: 'irregular', tense: 'past', agrees: ['any'],               person: 'other', takes: ['none'], level: 2, subjectKind: 'animate', variants: ['swam', 'sat'] },
    { word: 'went',   decks: [2],    suit: 'verb', subtype: 'irregular', tense: 'past', agrees: ['any'],               person: 'other', takes: ['none'], level: 2, subjectKind: 'animate', variants: ['flew', 'came'] },
    { word: 'saw',    decks: [2],    suit: 'verb', subtype: 'irregular', tense: 'past', agrees: ['any'],               person: 'other', takes: ['np'], level: 2, subjectKind: 'animate', objectKinds: ['person', 'animal', 'event', 'thing'],
      alt: [{ suit: 'noun', subtype: 'countable', number: 'singular', kind: 'thing', note: 'a saw = a tool for cutting wood (una sega)', decks: [2] }] },
    { word: 'bought', decks: [2],    suit: 'verb', subtype: 'irregular', tense: 'past', agrees: ['any'],               person: 'other', takes: ['np'], level: 2, subjectKind: 'animate', objectKinds: ['food', 'drink', 'thing', 'animal'], variants: ['sold'] },
    //   Level 3 (modals): can must should will + be (the base form after a modal) · have play like eat run
    { word: 'be',     decks: [3],    suit: 'verb', subtype: 'be',        tense: 'present', agrees: [],                 person: 'other', takes: ['adj', 'np', 'pp'], base: true, level: 2 },
    { word: 'can',    decks: [3],    suit: 'verb', subtype: 'modal',     tense: 'present', agrees: ['any'],            person: 'other', takes: ['base'], level: 2, subjectKind: 'animate', variants: ['could'] },
    { word: 'must',   decks: [3],    suit: 'verb', subtype: 'modal',     tense: 'present', agrees: ['any'],            person: 'other', takes: ['base'], level: 2, subjectKind: 'animate' },
    { word: 'should', decks: [3],    suit: 'verb', subtype: 'modal',     tense: 'present', agrees: ['any'],            person: 'other', takes: ['base'], level: 3, subjectKind: 'animate' },
    { word: 'will',   decks: [3],    suit: 'verb', subtype: 'modal',     tense: 'present', agrees: ['any'],            person: 'other', takes: ['base'], level: 3, subjectKind: 'animate', variants: ['would'] },

    // ♦ MODIFIERS
    { word: 'happy',     decks: [1, 2, 3], suit: 'modifier', subtype: 'adjective', level: 1, needs: 'animate', variants: ['sad', 'tired', 'angry'] },
    { word: 'big',       decks: [1, 2, 3], suit: 'modifier', subtype: 'adjective', level: 1, variants: ['long', 'heavy', 'cold'] },
    { word: 'old',       decks: [1, 2], suit: 'modifier', subtype: 'adjective', level: 1, variants: ['dirty', 'cheap'] },
    { word: 'hungry',    decks: [1, 2, 3], suit: 'modifier', subtype: 'adjective', level: 1, needs: 'animate', variants: ['thirsty', 'sleepy'] },
    { word: 'new',       decks: [1, 2, 3], suit: 'modifier', subtype: 'adjective', level: 1, variants: ['clean', 'nice'] },
    { word: 'small',     decks: [1, 2], suit: 'modifier', subtype: 'adjective', level: 1, variants: ['little', 'short'] },
    { word: 'tall',      decks: [1, 2], suit: 'modifier', subtype: 'adjective', level: 1, needs: 'animate', variants: ['strong', 'young', 'kind'] },
    { word: 'red',       decks: [1, 2], suit: 'modifier', subtype: 'adjective', level: 1, variants: ['blue', 'green', 'yellow'] },
    { word: 'quickly',   decks: [1, 2, 3], suit: 'modifier', subtype: 'adverb', kind: 'manner',    level: 1, variants: ['slowly', 'carefully'] },
    { word: 'well',      decks: [1, 2], suit: 'modifier', subtype: 'adverb', kind: 'manner',    level: 1, after: true, variants: ['badly', 'loudly'] },
    { word: 'always',    decks: [1, 2, 3], suit: 'modifier', subtype: 'adverb', kind: 'frequency', level: 2, variants: ['usually'] },
    { word: 'often',     decks: [1],    suit: 'modifier', subtype: 'adverb', kind: 'frequency', level: 2, variants: ['sometimes'] },
    { word: 'very',      decks: [1, 2, 3], suit: 'modifier', subtype: 'adverb', kind: 'degree',    level: 2, variants: ['really'] },
    { word: 'yesterday', decks: [2],    suit: 'modifier', subtype: 'adverb', kind: 'time',      level: 2 },
    { word: 'bigger',    decks: [3],    suit: 'modifier', subtype: 'comparative', asAdverb: false, level: 2, variants: ['longer', 'colder'] },
    { word: 'smaller',   decks: [3],    suit: 'modifier', subtype: 'comparative', asAdverb: false, level: 2, variants: ['shorter'] },
    { word: 'older',     decks: [3],    suit: 'modifier', subtype: 'comparative', asAdverb: false, level: 2, variants: ['newer'] },
    { word: 'taller',    decks: [3],    suit: 'modifier', subtype: 'comparative', asAdverb: false, level: 2, needs: 'animate', variants: ['stronger', 'younger'] },
    { word: 'faster',    decks: [3],    suit: 'modifier', subtype: 'comparative', asAdverb: true,  level: 3, needs: 'animate', variants: ['slower'] },
    { word: 'better',    decks: [3],    suit: 'modifier', subtype: 'comparative', asAdverb: true,  level: 3, variants: ['worse'] },

    // ♣ FUNCTION WORDS (because is only in Levels 1-2, than only in Level 3)
    { word: 'I',       decks: [1, 2, 3], suit: 'function', subtype: 'pronoun',     person: 'I',   level: 1, kind: 'person' },
    { word: 'you',     decks: [1, 2, 3], suit: 'function', subtype: 'pronoun',     person: 'you', level: 1, kind: 'person', asObject: true },
    { word: 'she',     decks: [1, 2, 3], suit: 'function', subtype: 'pronoun',     person: 'sg',  level: 1, kind: 'person', variants: ['he'] },
    { word: 'they',    decks: [1, 2, 3], suit: 'function', subtype: 'pronoun',     person: 'pl',  level: 1, kind: 'person', variants: ['we'] },
    { word: 'the',     decks: [1, 2, 3], suit: 'function', subtype: 'article',     level: 1 },
    { word: 'a',       decks: [1, 2, 3], suit: 'function', subtype: 'article',     level: 1 },
    { word: 'an',      decks: [1, 2, 3], suit: 'function', subtype: 'article',     level: 1 },
    { word: 'in',      decks: [1, 2, 3], suit: 'function', subtype: 'preposition', level: 2, variants: ['on', 'at'] },
    { word: 'to',      decks: [1, 2, 3], suit: 'function', subtype: 'preposition', level: 2 },
    { word: 'with',    decks: [1, 2, 3], suit: 'function', subtype: 'preposition', level: 2 },
    { word: 'and',     decks: [1, 2, 3], suit: 'function', subtype: 'connector',   level: 3 },
    { word: 'but',     decks: [1, 2, 3], suit: 'function', subtype: 'connector',   level: 3 },
    { word: 'because', decks: [1, 2], suit: 'function', subtype: 'connector',   level: 3 },
    { word: 'than',    decks: [3],    suit: 'function', subtype: 'comparison',  level: 2 },
  ],

  // The grammar rules. "tip" is the Grammar tip (simple English), "it" the same in Italian,
  // "ok" / "no" are examples, "wrong" is what the pupil reads when the rule is broken.
  // level = from which Level the tip is offered; hidden = only shown after a mistake.
  rules: {
    // ---- Level 1
    'svo':        { level: 1, name: 'Subject + verb + object', tip: 'Say WHO first, then the verb, then WHAT.', it: 'Prima chi (il soggetto), poi il verbo, poi l’oggetto.', ok: 'Anna likes pizza.', no: 'Likes Anna pizza.' },
    'be-adj':     { level: 1, name: 'Be + adjective', tip: 'After am / is / are we can put an adjective.', it: 'Dopo am / is / are puoi mettere un aggettivo.', ok: 'The dog is happy.', no: 'The dog happy.' },
    'be-noun':    { level: 1, name: 'Be + noun', tip: 'After am / is / are we can put a noun, with a, an or the.', it: 'Dopo am / is / are puoi mettere un nome, con a, an o the.', ok: 'Anna is a teacher.', no: 'Anna is teacher.' },
    'be-complement': { level: 1, hidden: true, name: 'Be needs a friend', tip: 'Am / is / are need an adjective or a noun after them.', it: 'Am / is / are vogliono un aggettivo o un nome dopo.', ok: 'I am happy.', no: 'I am.',
                  wrong: 'After am / is / are you need an adjective or a noun: I am happy.' },
    'be-number':  { level: 1, name: 'One or more after be', tip: 'After IS and AM the noun is singular (a friend). After ARE it is plural (friends).', it: 'Dopo is/am il nome è singolare, dopo are è plurale.', ok: 'She is a friend. · They are friends.', no: 'She is friends.',
                  wrong: 'The noun after am / is / are must match the subject: she is a friend, they are friends.' },
    'agree-be':   { name: 'am / is / are · was / were', tip: 'I AM or WAS. He, she, it or ONE thing IS or WAS. You, we, they or MANY things ARE or WERE.', it: 'I am/was · he/she/it is/was · you/we/they are/were.', ok: 'They were friends.', no: 'They was friends.',
                  wrong: 'Look at the verb be: I AM / WAS, she IS / WAS, you and they ARE / WERE.' },
    'agree-s':    { decks: [1], level: 1, name: 'The verb with he / she / it', tip: 'With he, she, it or ONE thing the verb takes -s: likes, has, runs. With I, you, they: play, have, eat.', it: 'Con he/she/it o una cosa il verbo prende la -s. Con I/you/they no.', ok: 'She likes pizza.', no: 'She play.',
                  wrong: 'The verb does not match the subject. She / one thing → likes, has, runs. I / you / they / many things → play, have, eat.' },
    'a-an':       { level: 1, name: 'A or AN?', tip: 'Use AN before the letters a, e, i, o, u: an apple. Use A before the other letters: a dog.', it: 'AN davanti a vocale (an apple), A davanti a consonante (a dog).', ok: 'an old dog', no: 'a old dog',
                  wrong: 'Look at the next word: AN before a, e, i, o, u – A before the other letters.' },
    'a-singular': { level: 1, hidden: true, name: 'A / an = ONE thing', tip: 'A and an are only for ONE thing you can count: a cat. Not for books, water or Anna.', it: 'A e an solo per UNA cosa che puoi contare.', ok: 'a cat', no: 'a books · a water',
                  wrong: 'A / an only go with ONE thing you can count (a cat). Not with books, water or Anna.' },
    'countable-det': { level: 1, name: 'One thing needs a word before it', tip: 'A singular noun you can count needs a, an or the before it.', it: 'Un nome singolare numerabile vuole a, an o the davanti.', ok: 'The dog runs.', no: 'Dog runs.',
                  wrong: 'A singular noun needs a, an or the before it: the dog, a cat.' },
    'proper-no-article': { level: 1, hidden: true, name: 'Names have no article', tip: 'We don’t use a / an / the with names: Anna, London.', it: 'Con i nomi propri non si usa l’articolo.', ok: 'Anna is happy.', no: 'The Anna is happy.',
                  wrong: 'We don’t use a / an / the with names (Anna, London).' },
    'adj-noun':   { level: 1, name: 'Adjective before the noun', tip: 'In English the adjective comes BEFORE the noun: a big dog.', it: 'L’aggettivo viene PRIMA del nome.', ok: 'the happy dog', no: 'the dog happy' },
    'adv-manner': { name: 'How? quickly, well', tip: 'Words like quickly and well say HOW. They go after the verb: runs quickly, plays well.', it: 'Quickly e well dicono COME. Vanno dopo il verbo.', ok: 'The dog runs quickly.', no: 'The dog quickly is.',
                  wrong: 'Put the “how” word after the verb: runs quickly, plays well. It can’t go before am / is / are or can / must.' },
    'need-verb':  { level: 1, hidden: true, name: 'A sentence needs a verb', tip: 'Every sentence has a verb ♥: is, likes, runs…', it: 'Ogni frase ha un verbo ♥.', ok: 'The dog runs.', no: 'The dog.',
                  wrong: 'After WHO or WHAT you need a verb ♥ (is, likes, runs…).' },
    'need-subject': { level: 1, hidden: true, name: 'Start with WHO or WHAT', tip: 'Start with a noun ♠ or a pronoun (I, you, she, they).', it: 'Comincia con un nome ♠ o un pronome.', ok: 'She runs.', no: 'Runs.',
                  wrong: 'Start with WHO or WHAT: a noun ♠ or a pronoun (I, you, she, they).' },
    'need-object': { level: 1, hidden: true, name: 'Some verbs need an object', tip: 'Have and likes need something after them: I have a dog.', it: 'Have e likes vogliono qualcosa dopo.', ok: 'Anna has a cat.', no: 'Anna has.',
                  wrong: 'This needs a noun after it (the object): Anna likes pizza.' },
    'np-needs-noun': { level: 1, hidden: true, name: 'A noun is missing', tip: 'After a, an, the and adjectives there is always a noun ♠.', it: 'Dopo a, an, the e gli aggettivi c’è sempre un nome ♠.', ok: 'the big dog', no: 'the big',
                  wrong: 'After a / the (and adjectives) you need a noun ♠.' },
    'pronoun-object': { level: 1, hidden: true, name: 'I, she, they = subject', tip: 'I, she and they go BEFORE the verb. YOU can go before and after.', it: 'I, you, she, they vanno PRIMA del verbo.', ok: 'She likes pizza.', no: 'Anna likes she.',
                  wrong: 'I, she and they can only be the subject (before the verb). Only YOU can also go after the verb: she likes you.' },
    'intransitive': { level: 1, hidden: true, name: 'No object after runs / went', tip: 'Some verbs (runs, went) have no object. Use quickly or a place.', it: 'Alcuni verbi (runs, went) non hanno oggetto.', ok: 'The dog runs quickly.', no: 'The dog runs pizza.',
                  wrong: 'Runs and went don’t take an object. Try: runs quickly.' },
    'too-short':  { level: 1, hidden: true, name: 'At least 3 cards', tip: 'A sentence for the game needs 3 cards or more.', it: 'Per il gioco servono almeno 3 carte.', ok: 'I am happy.', no: 'I am.',
                  wrong: 'A sentence needs at least 3 cards.' },
    'meaning':    { level: 1, hidden: true, name: 'It must make sense', tip: 'The grammar is not enough: the sentence must make sense. Only people and animals can be happy, hungry, eat or run. We eat food, not homework!', it: 'Non basta la grammatica: la frase deve avere senso. Solo persone e animali sono happy/hungry, mangiano, corrono.', ok: 'The hungry dog eats pizza.', no: 'The hungry water eats the books.',
                  wrong: 'The grammar is right, but it does not make sense. Think about the meaning!' },
    'unexpected': { level: 1, hidden: true, name: 'Word in the wrong place', tip: 'Check the order: who → verb → what / how / where.', it: 'Controlla l’ordine: chi → verbo → cosa / come / dove.', ok: 'Anna plays with friends.', no: 'Anna with plays friends.',
                  wrong: 'This word is not in the right place.' },

    'second-meaning': { level: 1, name: 'Two meanings', tip: 'Many words have two meanings: a play (a show) and to play. A word can be a noun or a verb: look at the whole sentence!', it: 'Molte parole hanno due significati: a play (uno spettacolo) e to play.', ok: 'Anna went to a play. · Anna books a play.', no: '' },

    // ---- Level 2
    'past-simple': { decks: [2], level: 2, name: 'Past simple', tip: 'The past simple is the same for all persons: I played, she played, they went.', it: 'Il passato è uguale per tutte le persone.', ok: 'They played.', no: 'They playeds.' },
    'adv-time':   { decks: [2], level: 2, name: 'yesterday = past', tip: 'Yesterday goes with the PAST: they went yesterday.', it: 'Yesterday va con il PASSATO.', ok: 'They went yesterday.', no: 'They run yesterday.',
                  wrong: 'Yesterday talks about the past: use played or went.' },
    'time-past':  { decks: [2], level: 2, hidden: true, name: 'yesterday = past', tip: 'Yesterday goes with the PAST: they went yesterday.', it: 'Yesterday va con il PASSATO.', ok: 'They went yesterday.', no: 'They run yesterday.',
                  wrong: 'Yesterday talks about the past: use played or went.' },
    'adv-freq':   { level: 2, name: 'always', tip: 'Always goes BEFORE the verb, but AFTER am / is / are.', it: 'Always va PRIMA del verbo, ma DOPO am / is / are.', ok: 'She always plays. · She is always happy.', no: 'She plays always.' },
    'freq-position': { level: 2, hidden: true, name: 'always', tip: 'Always goes BEFORE the verb, but AFTER am / is / are.', it: 'Always va PRIMA del verbo, ma DOPO am / is / are.', ok: 'She always plays. · She is always happy.', no: 'She is always happy → not: She always is happy.',
                  wrong: 'Always goes before the verb (always plays) but after am / is / are (is always).' },
    'adv-degree': { level: 2, name: 'very', tip: 'Very goes right before an adjective: very big.', it: 'Very va subito prima di un aggettivo.', ok: 'The dog is very big.', no: 'The dog very is big.' },
    'degree-position': { level: 2, hidden: true, name: 'very', tip: 'Very goes right before an adjective: very big.', it: 'Very va subito prima di un aggettivo.', ok: 'The dog is very big.', no: 'very bigger',
                  wrong: 'Very goes right before an adjective: very big (not very bigger).' },
    'comparative': { decks: [3], level: 2, name: 'Comparatives', tip: 'Bigger, faster, better compare things. Short adjectives take -er.', it: 'Bigger, faster, better confrontano. Gli aggettivi corti prendono -er.', ok: 'The dog is bigger.', no: 'The dog is more big.' },
    'comparative-adv': { decks: [3], level: 2, hidden: true, name: 'Comparatives', tip: 'Bigger describes a noun. After a verb we use faster or better.', it: 'Bigger descrive un nome. Dopo un verbo usa faster o better.', ok: 'The dog runs faster.', no: 'The dog runs bigger.',
                  wrong: 'Bigger describes a noun (a bigger dog). After a verb use faster or better.' },
    'prep-phrase': { level: 2, name: 'in / to / with', tip: 'In, to and with are followed by a noun: with friends.', it: 'In, to, with sono seguite da un nome.', ok: 'Anna went to London.', no: 'Anna went to.' },
    'prep-needs-noun': { level: 2, hidden: true, name: 'in / to / with', tip: 'In, to and with are followed by a noun: with friends.', it: 'In, to, with sono seguite da un nome.', ok: 'Anna went to London.', no: 'Anna went to.',
                  wrong: 'After in / to / with you need a noun (to London).' },

    // ---- Level 3 (comparatives with than)
    'comparative-than': { decks: [3], name: 'bigger THAN', tip: 'Use THAN after a comparative to say what you compare: the dog is bigger THAN the cat.', it: 'Dopo il comparativo si usa THAN: bigger than.', ok: 'The dog is bigger than the cat.', no: 'The dog is bigger the cat.' },
    'than-missing': { decks: [3], hidden: true, name: 'bigger THAN', tip: 'After a comparative use THAN to say what you compare: bigger THAN the cat.', it: 'Dopo il comparativo serve THAN.', ok: 'The dog is bigger than the cat.', no: 'The dog is bigger the cat.',
                  wrong: 'After a comparative you need THAN: bigger THAN the cat.' },
    'than-comparative': { decks: [3], hidden: true, name: 'bigger THAN', tip: 'Than goes right after a comparative: bigger than, faster than.', it: 'Than va subito dopo un comparativo.', ok: 'She runs faster than you.', no: 'She runs than you.',
                  wrong: 'Than goes right after a comparative (bigger than the cat, faster than you).' },

    // ---- Level 3
    'modal':      { decks: [3], name: 'can / must / should / will', tip: 'After can, must, should and will the verb does not change: she can play, not she can plays.', it: 'Dopo can, must, should, will il verbo non cambia.', ok: 'She can play. · She must be happy.', no: 'She can plays.' },
    'modal-base': { decks: [3], hidden: true, name: 'can / must / should / will', tip: 'After can, must, should and will the verb does not change: she can play, not she can plays.', it: 'Dopo can, must, should, will il verbo non cambia.', ok: 'She can play.', no: 'She can plays.',
                  wrong: 'After can / must / should / will use the base verb: play, like, eat, run, have, be (no -s, no -ed).' },
    'connector':  { level: 3, name: 'and / but / because', tip: 'Join two sentences: I play but she eats. BECAUSE gives a reason.', it: 'Unisci due frasi. BECAUSE dà la ragione.', ok: 'I am happy because you play.', no: 'I am happy because.' },
    'connector-clause': { level: 3, hidden: true, name: 'and / but / because', tip: 'After and / but / because write a whole new sentence: who + verb…', it: 'Dopo and / but / because scrivi una frase intera.', ok: 'I play but she eats.', no: 'I play but.',
                  wrong: 'After and / but / because write a whole new sentence (who + verb…).' },
    'and-list':   { level: 3, name: 'And joins words', tip: 'And can join two nouns or two adjectives: books and bunnies.', it: 'And può unire due nomi o due aggettivi.', ok: 'I have books and bunnies.', no: 'I have books and.' },
    'and-subject': { level: 3, name: 'Two subjects = plural', tip: 'Two subjects with AND are plural: Anna and I play.', it: 'Due soggetti con AND sono plurale.', ok: 'Anna and I play.', no: 'Anna and I plays.' },
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = GP_DATA;
