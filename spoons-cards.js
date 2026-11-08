// Spoons: the cards (used by spoons-deck.js, For the teacher > Spoons).
// 5 word classes with exactly 12 cards each (8 easy + 4 harder), so that a player has the same chance of getting
// "four of a kind" with every kind of card. No articles (a / an / the): there are too few to make a set of four.
// A set of four wins if the four words are all adjectives / all verbs / ... OR make a sentence that makes sense
// (verbs may take -s / -ed / -ing, nouns -s). Words in American English.
// level: 1 = easy, 2 = harder.
window.SPOON_DATA = {
  classes: {
    adj:  { name: 'adjectives',    one: 'adjective',   color: '#e8503c' },
    verb: { name: 'verbs',         one: 'verb',        color: '#2f6fd6' },
    noun: { name: 'nouns',         one: 'noun',        color: '#2e9e5b' },
    adv:  { name: 'adverbs',       one: 'adverb',      color: '#8e2de2' },
    fun:  { name: 'little words',  one: 'little word', color: '#c98a00' }, // pronouns, possessives, prepositions, conjunctions
  },
  cards: [
    ...['happy', 'tiny', 'old', 'funny', 'cold', 'kind', 'hungry', 'noisy'].map(w => ({ w, cls: 'adj', level: 1 })),
    ...['curious', 'exhausted', 'ancient', 'generous'].map(w => ({ w, cls: 'adj', level: 2 })),
    ...['eat', 'play', 'run', 'love', 'buy', 'sleep', 'cook', 'draw'].map(w => ({ w, cls: 'verb', level: 1 })),
    ...['borrow', 'whisper', 'deserve', 'wander'].map(w => ({ w, cls: 'verb', level: 2 })),
    ...['dog', 'pizza', 'school', 'friend', 'music', 'book', 'bike', 'night'].map(w => ({ w, cls: 'noun', level: 1 })),
    ...['secret', 'adventure', 'neighbor', 'journey'].map(w => ({ w, cls: 'noun', level: 2 })),
    ...['always', 'never', 'quickly', 'today', 'often', 'here', 'slowly', 'well'].map(w => ({ w, cls: 'adv', level: 1 })),
    ...['suddenly', 'secretly', 'carefully', 'luckily'].map(w => ({ w, cls: 'adv', level: 2 })),
    ...['I', 'she', 'we', 'they', 'my', 'in', 'with', 'and'].map(w => ({ w, cls: 'fun', level: 1 })),
    ...['because', 'although', 'without', 'between'].map(w => ({ w, cls: 'fun', level: 2 })),
  ],
};
