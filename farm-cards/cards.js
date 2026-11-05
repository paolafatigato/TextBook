/**
 * ANIMAL FARM CARDS - the 16 cards.
 * Stats (0-10) come from the "Animal Farm Top Trumps" cards.
 * score  = the card's value: it is the Grain you pay to play it.
 * power  = { name, when, text }   (the game logic lives in engine.js)
 * The array is sorted by score on purpose: engine.js deals the cards in pairs of equal value,
 * so both players always get a deck of the same strength (25 Grain each).
 * Images: put them in /img named <id>.png (or .jpg / .webp). Until then the card shows an emoji.
 */
const STATS = [
  ['power', 'Power'],
  ['intelligence', 'Intelligence'],
  ['productivity', 'Productivity'],
  ['loyalty', 'Loyalty'],
  ['kindness', 'Kindness'],
];

const WHEN = {
  play: 'When played',
  passive: 'Always on',
  turn: 'Your turn · once per game',
  turnEach: 'Your turn · once per turn',
  react: 'Reaction · once per game',
  duel: 'In a duel · once per game',
};

const CARDS = [
  {
    id: 'rats', name: 'The rats', kind: 'Animal', score: 1, emoji: '🐀',
    stats: { power: 2, intelligence: 1, productivity: 1, loyalty: 2, kindness: 4 },
    desc: 'Wild, small and hungry. Are they comrades? The animals vote: yes.',
    power: { name: 'Gnaw the Sacks', when: 'play', text: 'Your opponent has 2 less Grain on their next turn.' },
  },
  {
    id: 'mollie', name: 'Mollie', kind: 'Animal', score: 2, emoji: '🐴',
    stats: { power: 3, intelligence: 3, productivity: 3, loyalty: 2, kindness: 3 },
    desc: 'A vain white mare who loves ribbons and sugar more than the Revolution.',
    power: { name: 'Ribbons and Sugar', when: 'turn', text: 'Choose an enemy card: it cannot attack on its owner\'s next turn.' },
  },
  {
    id: 'moses', name: 'Moses', kind: 'Animal', score: 2, emoji: '🐦‍⬛',
    stats: { power: 6, intelligence: 6, productivity: 1, loyalty: 5, kindness: 5 },
    desc: 'Mr Jones\'s tame raven. He tells tales of Sugarcandy Mountain, where it is Sunday every day.',
    power: { name: 'Sugarcandy Mountain', when: 'react', text: 'When one of your cards would be destroyed, it goes back to your hand instead.' },
  },
  {
    id: 'hens', name: 'The hens', kind: 'Animal', score: 2, emoji: '🐔',
    stats: { power: 2, intelligence: 4, productivity: 7, loyalty: 6, kindness: 6 },
    desc: 'They lay the eggs the farm needs, and they fight hard when Napoleon wants to sell them.',
    power: { name: 'Fresh Eggs', when: 'passive', text: 'At the start of your turn, gain +1 Grain while the hens are on the field.' },
  },
  {
    id: 'sheep', name: 'The sheep', kind: 'Animal', score: 2, emoji: '🐑',
    stats: { power: 4, intelligence: 2, productivity: 5, loyalty: 8, kindness: 5 },
    desc: 'Not very clever, but very loud. They bleat the slogans all day long.',
    power: { name: 'Four Legs Good!', when: 'turn', text: 'Your opponent\'s powers are silenced until the end of their next turn.' },
  },
  {
    id: 'jones', name: 'Mr Jones', kind: 'Human', score: 3, emoji: '🧔',
    stats: { power: 6, intelligence: 6, productivity: 2, loyalty: 2, kindness: 2 },
    desc: 'The drunken owner of Manor Farm. He forgets to feed the animals, and they drive him out.',
    power: { name: 'Shotgun', when: 'turn', text: 'Destroy one enemy Animal with Power 4 or less.' },
  },
  {
    id: 'frederick', name: 'Mr Frederick', kind: 'Human', score: 3, emoji: '🤠',
    stats: { power: 6, intelligence: 7, productivity: 7, loyalty: 2, kindness: 2 },
    desc: 'The hard, tricky owner of Pinchfield. He pays with fake banknotes and blows up the windmill.',
    power: { name: 'Dynamite', when: 'turn', text: 'Destroy one enemy card with Productivity 7 or more.' },
  },
  {
    id: 'pilkington', name: 'Mr Pilkington', kind: 'Human', score: 3, emoji: '🎣',
    stats: { power: 6, intelligence: 7, productivity: 4, loyalty: 3, kindness: 4 },
    desc: 'The easygoing owner of Foxwood. He likes fishing, and he cheats at cards.',
    power: { name: 'Ace of Spades', when: 'duel', text: 'In a duel with Pilkington in it, he gets +4 to the stat being compared.' },
  },
  {
    id: 'squealer', name: 'Squealer', kind: 'Animal', score: 3, emoji: '🐷',
    stats: { power: 6, intelligence: 7, productivity: 5, loyalty: 7, kindness: 4 },
    desc: 'Napoleon\'s spokespig. He can make black look white, and wrong look right.',
    power: { name: 'Black Is White', when: 'react', text: 'When one of your cards is attacked, you choose the stat instead of the attacker.' },
  },
  {
    id: 'benjamin', name: 'Benjamin', kind: 'Animal', score: 3, emoji: '🫏',
    stats: { power: 4, intelligence: 7, productivity: 4, loyalty: 6, kindness: 6 },
    desc: 'The oldest, grumpiest donkey. He reads as well as any pig, but he rarely does.',
    power: { name: 'Reads the Wall', when: 'turn', text: 'Look at your opponent\'s hand. They discard their most expensive card, and you draw a card.' },
  },
  {
    id: 'clover', name: 'Clover', kind: 'Animal', score: 3, emoji: '🐎',
    stats: { power: 4, intelligence: 3, productivity: 5, loyalty: 8, kindness: 8 },
    desc: 'A gentle, motherly mare. She looks after the others and sees more than she says.',
    power: { name: 'Warning Whinny', when: 'react', text: 'When the enemy attacks one of your other cards, cancel that attack.' },
  },
  {
    id: 'dogs', name: 'The dogs', kind: 'Animal', score: 4, emoji: '🐕',
    stats: { power: 8, intelligence: 5, productivity: 5, loyalty: 8, kindness: 1 },
    desc: 'Nine fierce dogs raised by Napoleon. They growl at anyone who disagrees.',
    power: { name: 'Napoleon\'s Enforcers', when: 'passive', text: '+2 Power while Napoleon is on your field. When the dogs destroy a card in a duel, your opponent loses 2 Life.' },
  },
  {
    id: 'major', name: 'Old Major', kind: 'Animal', score: 4, emoji: '🐖',
    stats: { power: 5, intelligence: 8, productivity: 4, loyalty: 8, kindness: 7 },
    desc: 'The old prize boar. His dream of a farm without humans starts the Rebellion.',
    power: { name: 'Beasts of England', when: 'play', text: 'Draw a card. When Major is destroyed, all your Animals get +1 Power for the rest of the game.' },
  },
  {
    id: 'boxer', name: 'Boxer', kind: 'Animal', score: 5, emoji: '🐴',
    stats: { power: 8, intelligence: 2, productivity: 10, loyalty: 10, kindness: 7 },
    desc: 'The strongest horse on the farm. His motto: "I will work harder!"',
    power: { name: 'I Will Work Harder', when: 'passive', text: 'The first time Boxer would be destroyed, he survives, but loses 2 from every stat for the rest of the game.' },
  },
  {
    id: 'napoleon', name: 'Napoleon', kind: 'Animal', score: 5, emoji: '🐗',
    stats: { power: 9, intelligence: 9, productivity: 3, loyalty: 3, kindness: 2 },
    desc: 'A fierce, silent pig who always gets his way. He raises the puppies in secret.',
    power: { name: 'Purge', when: 'turn', text: 'Destroy one enemy Animal with Loyalty 7 or less.' },
  },
  {
    id: 'snowball', name: 'Snowball', kind: 'Animal', score: 5, emoji: '🐽',
    stats: { power: 7, intelligence: 8, productivity: 8, loyalty: 8, kindness: 7 },
    desc: 'A brilliant pig full of ideas, from committees to the windmill. Napoleon\'s dogs chase him away.',
    power: { name: 'Fiery Speech', when: 'turnEach', text: 'Once per turn, give one of your cards +2 to one stat until the end of the turn.' },
  },
];

if (typeof module !== 'undefined') module.exports = { CARDS, STATS, WHEN };
