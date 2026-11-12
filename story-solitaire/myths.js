/**
 * STORY SOLITAIRE - GREEK MYTHS in the PRESENT SIMPLE, for Year 1 (prima media). Loaded after chapters.js, before grammar.js.
 * Vocabulary and grammar: present simple, verb to be, possessives, Saxon genitive (Demeter’s daughter), American English.
 * The other stories of the game are in the past simple, so these ones have  tense: 'present'  and grammar.js does not let a present card
 * join a past card inside the same sentence (a new sentence after a full stop is always fine).
 * Format = chapters.js: sentences separated by " / ", every sentence cut in 1-4 cards by " | " (10 cards in all); spec = grammar tokens.
 */
(() => {
  window.EXTRA_NAMES = (window.EXTRA_NAMES || []).concat(['Persephone', 'Demeter', 'Hades', 'Orpheus', 'Eurydice', 'Prometheus', 'Zeus', 'Hera', 'Hephaestus', 'Heracles']);
  const MYTHS = [
    { id: 'persephone', title: 'Persephone and the Seasons', emoji: '🌸', book: 'Persephone and Hades',
      text: 'Persephone is Demeter’s daughter. / One morning, | Hades kidnaps her | and takes her to the Underworld. / Demeter is very sad, | so the earth gets cold and dry. / In the Underworld, | Persephone eats six red seeds, | so she stays there for six months. / That is why winter comes every year.',
      spec: 'S ADV CL2+m+act+tr AND:vp CLc:H SO ADV CL2+m+act+tr SO S' },
    { id: 'prometheus', title: 'Prometheus and the Fire', emoji: '🔥', book: 'Prometheus',
      text: 'Prometheus is a clever Titan | and he loves people. / The people on Earth are cold and hungry. / One night, | he steals fire from the gods | and brings it to the people. / Zeus is very angry, | so he ties Prometheus to a rock. / An eagle attacks him every day, | but Heracles frees him at last.',
      spec: 'CLn:H AND:cl S ADV CL2+m+act+tr AND:vp CLc:H SO CLc:A+act BUT' },
    { id: 'orpheus-pres', title: 'Orpheus and Eurydice', emoji: '🎵', book: 'Orpheus and Eurydice',
      text: 'Orpheus and Eurydice are in love. / But one day, | a snake bites Eurydice and she dies. / Orpheus goes to the Underworld | to bring her back. / He plays his lyre | for Hades. / Hades loves the music, | and allows Eurydice to follow her husband | on one condition: Orpheus never looks back.',
      spec: 'S ADV CL2 CLn:H+act+mot INF CLn:H+act+tr PP:BEN CLc:H AND:vp+m+act+tr PP:WITH' },
    { id: 'zeus', title: 'Zeus and the Headache', emoji: '⚡', book: 'The birth of Athena',
      text: 'Zeus is the king of the gods on Mount Olympus | and Hera is his wife. / One morning, | Zeus has a terrible headache. / Then, | his son Hephaestus takes an axe | and opens Zeus’s head. / Suddenly, | a girl in golden armor jumps out! / She is Athena, the goddess of wisdom, and Zeus is happy.',
      spec: 'CLn:H AND:cl ADV CL2 ADV CL2+m+act+tr AND:vp ADV CL2 S' },
  ];

  MYTHS.forEach(c => {
    const halves = c.text.split(' / ').flatMap(x => x.split(' | ')).map(s => s.trim());
    if (halves.length !== 10) console.error('myths.js:', c.id, 'has', halves.length, 'cards');
    STORIES.push({
      id: c.id, title: c.title, emoji: c.emoji, tense: 'present', source: { book: c.book, author: 'Greek myths (present simple)', myth: true },
      lines: halves, sets: { hard: halves, medium: halves, easy: halves }, specStr: c.spec,
    });
  });
})();
