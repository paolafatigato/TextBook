/**
 * ANIMAL FARM CARDS - the 16 cards.
 * Stats (0-10) come from the "Animal Farm Top Trumps" cards:
 *   attack (was Power) · defense (was Intelligence) · productivity (Grain each turn) · loyalty and kindness (only used by effects).
 * score = the card's POWER VALUE. cost = its price in Grain (if missing, the same as the score). The 16 cards are worth 50 Power: 26 wins the farm.
 * power = { name, when, text }   (the game logic lives in engine.js)
 * Images: put them in /img named <id>.png (or .jpg / .webp). Until then the card shows an emoji.
 */
const STATS = [
  ['attack', 'Attack'],
  ['defense', 'Defense'],
  ['productivity', 'Productivity'],
  ['loyalty', 'Loyalty'],
  ['kindness', 'Kindness'],
];
const FADED = { loyalty: true, kindness: true };   // shown paler: they only matter inside effects

const WHEN = {
  passive: 'Always on',
  turn: 'Your turn · once per turn',
  game: 'Your turn · once per game',
};

const CARDS = [
  {
    id: 'rats', name: 'The rats', kind: 'Animal', score: 1, emoji: '🐀',
    stats: { attack: 2, defense: 1, productivity: 1, loyalty: 2, kindness: 4 },
    desc: 'Wild, small and hungry. Are they comrades? The animals vote: yes.',
    power: { name: 'Gnaw the Sacks', when: 'turn', text: 'Your opponent loses 1 Grain.' },
  },
  {
    id: 'mollie', name: 'Mollie', kind: 'Animal', score: 2, emoji: '🐴',
    stats: { attack: 3, defense: 3, productivity: 3, loyalty: 2, kindness: 3 },
    desc: 'A vain white mare who loves ribbons and sugar more than the Revolution.',
    power: { name: 'Ribbons and Sugar', when: 'turn', text: 'Buy an enemy card with Loyalty 3 or less for its score +1 Grain.' },
  },
  {
    id: 'moses', name: 'Moses', kind: 'Animal', score: 2, emoji: '🐦‍⬛',
    stats: { attack: 6, defense: 6, productivity: 1, loyalty: 5, kindness: 5 },
    desc: 'Mr Jones\'s tame raven. He tells tales of Sugarcandy Mountain, where it is Sunday every day.',
    power: { name: 'Sugarcandy Mountain', when: 'passive', text: 'Market cards with Kindness 5 or less cost you 1 Grain less (never below 1).' },
  },
  {
    id: 'hens', name: 'The hens', kind: 'Animal', score: 2, emoji: '🐔',
    stats: { attack: 2, defense: 4, productivity: 7, loyalty: 6, kindness: 6 },
    desc: 'They lay the eggs the farm needs, and they fight hard when Napoleon wants to sell them.',
    power: { name: 'Fresh Eggs', when: 'passive', text: 'You get +1 Grain every turn.' },
  },
  {
    id: 'sheep', name: 'The sheep', kind: 'Animal', score: 2, emoji: '🐑',
    stats: { attack: 4, defense: 2, productivity: 5, loyalty: 8, kindness: 5 },
    desc: 'Not very clever, but very loud. They bleat the slogans all day long.',
    power: { name: 'Four Legs Good!', when: 'game', text: 'Your opponent\'s effects are silenced until the end of their next turn.' },
  },
  {
    id: 'jones', name: 'Mr Jones', kind: 'Human', score: 3, emoji: '🧔',
    stats: { attack: 6, defense: 6, productivity: 2, loyalty: 2, kindness: 2 },
    desc: 'The drunken owner of Manor Farm. He forgets to feed the animals, and they drive him out.',
    power: { name: 'Shotgun', when: 'game', text: 'Send an enemy Animal with Defense 4 or less back to the Market.' },
  },
  {
    id: 'frederick', name: 'Mr Frederick', kind: 'Human', score: 3, emoji: '🤠',
    stats: { attack: 6, defense: 7, productivity: 7, loyalty: 2, kindness: 2 },
    desc: 'The hard, tricky owner of Pinchfield. He pays with fake banknotes and blows up the windmill.',
    power: { name: 'Dynamite', when: 'game', text: 'Send an enemy card with Productivity 7 or more back to the Market.' },
  },
  {
    id: 'pilkington', name: 'Mr Pilkington', kind: 'Human', score: 3, emoji: '🎣',
    stats: { attack: 6, defense: 7, productivity: 4, loyalty: 3, kindness: 4 },
    desc: 'The easygoing owner of Foxwood. He likes fishing, and he cheats at cards.',
    power: { name: 'Ace of Spades', when: 'game', text: 'Buy a Market card with Kindness 4 or less for just 1 Grain, on top of your normal purchase.' },
  },
  {
    id: 'squealer', name: 'Squealer', kind: 'Animal', score: 3, emoji: '🐷',
    stats: { attack: 6, defense: 7, productivity: 5, loyalty: 7, kindness: 4 },
    desc: 'Napoleon\'s spokespig. He can make black look white, and wrong look right.',
    power: { name: 'Black Is White', when: 'turn', text: 'Buy an enemy card with Kindness 4 or less for its score +1 Grain.' },
  },
  {
    id: 'benjamin', name: 'Benjamin', kind: 'Animal', score: 3, emoji: '🫏',
    stats: { attack: 4, defense: 7, productivity: 4, loyalty: 6, kindness: 6 },
    desc: 'The oldest, grumpiest donkey. He reads as well as any pig, but he rarely does.',
    power: { name: 'Reads the Wall', when: 'passive', text: 'The enemy cannot buy your cards with Loyalty 3 or less with effects.' },
  },
  {
    id: 'clover', name: 'Clover', kind: 'Animal', score: 3, emoji: '🐎',
    stats: { attack: 4, defense: 3, productivity: 5, loyalty: 8, kindness: 8 },
    desc: 'A gentle, motherly mare. She looks after the others and sees more than she says.',
    power: { name: 'Gentle Care', when: 'passive', text: 'Your cards with Kindness 7 or more cannot be attacked.' },
  },
  {
    id: 'dogs', name: 'The dogs', kind: 'Animal', score: 4, emoji: '🐕',
    stats: { attack: 8, defense: 5, productivity: 5, loyalty: 8, kindness: 1 },
    desc: 'Nine fierce dogs raised by Napoleon. They growl at anyone who disagrees.',
    power: { name: 'Napoleon\'s Enforcers', when: 'passive', text: '+2 Attack while Napoleon is yours. When the dogs win an attack, your opponent loses 2 Grain.' },
  },
  {
    id: 'major', name: 'Old Major', kind: 'Animal', score: 4, emoji: '🐖',
    stats: { attack: 5, defense: 8, productivity: 4, loyalty: 8, kindness: 7 },
    desc: 'The old prize boar. His dream of a farm without humans starts the Rebellion.',
    power: { name: 'Beasts of England', when: 'passive', text: 'Each of your cards with Loyalty 8 or more produces +1 Grain.' },
  },
  {
    id: 'boxer', name: 'Boxer', kind: 'Animal', score: 5, emoji: '🐴',
    stats: { attack: 8, defense: 2, productivity: 10, loyalty: 10, kindness: 7 },
    desc: 'The strongest horse on the farm. His motto: "I will work harder!"',
    power: { name: 'I Will Work Harder', when: 'passive', text: 'The first time Boxer would go back to the Market, he stays, but loses 2 Attack for the rest of the game.' },
  },
  {
    id: 'napoleon', name: 'Napoleon', kind: 'Animal', score: 5, cost: 7, emoji: '🐗',
    stats: { attack: 9, defense: 9, productivity: 3, loyalty: 3, kindness: 2 },
    desc: 'A fierce, silent pig who always gets his way. He raises the puppies in secret.',
    power: { name: 'Purge', when: 'turn', text: 'Buy an enemy card with Loyalty 3 or less for just 1 Grain. Napoleon never fights himself: the dogs do it for him (he cannot attack).' },
  },
  {
    id: 'snowball', name: 'Snowball', kind: 'Animal', score: 5, cost: 6, emoji: '🐽',
    stats: { attack: 7, defense: 8, productivity: 8, loyalty: 8, kindness: 7 },
    desc: 'A brilliant pig full of ideas, from committees to the windmill. Napoleon\'s dogs chase him away.',
    power: { name: 'Fiery Speech', when: 'turn', text: 'Give one of your cards +2 Attack or +2 Defense until the end of the turn.' },
  },
];

if (typeof module !== 'undefined') module.exports = { CARDS, STATS, WHEN, FADED };
