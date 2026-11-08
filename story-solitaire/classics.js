/**
 * STORY SOLITAIRE - stories inspired by famous books and tales (loaded after levels.js, before grammar.js).
 * They join the other stories: every deal takes 4 at random. When the pupils read the story they get a line that sends them to the original.
 * To add one: copy a block. text = 5 short sentences, each cut in two halves with " | " (sentences separated by " / "), so 10 cards.
 * spec = the 10 grammar tokens, see grammar.js (use X for a half that does not fit with anything else).
 * Write them in your own words (short summary of the plot, past simple, American English).
 */
(() => {
  const CLASSICS = [
    // ---- Oscar Wilde
    { id: 'prince', title: 'The Happy Prince', emoji: '💎', book: 'The Happy Prince', author: 'Oscar Wilde',
      text: 'A golden statue | stood high above the city. / One night, | a little swallow rested at its feet. / The statue was crying, | so the swallow carried its jewels to the poor. / Winter came | and the swallow froze. / The statue’s heart | broke in two.',
      spec: 'NP:O VP:HAWO ADV CL2 CLc:O SO CLn:O AND:cl NP:O VP:O' },
    { id: 'giant', title: 'The Selfish Giant', emoji: '🌳', book: 'The Selfish Giant', author: 'Oscar Wilde',
      text: 'A selfish giant | built a high wall around his garden. / The children couldn’t play there, | so winter stayed in the garden. / One morning, | the giant heard a bird singing outside. / The children crept back in, | and the garden turned green again. / The giant knocked down the wall | and played with the children every day.',
      spec: 'NP:H VP:HW CLc:H SO ADV CL2 CLc:H AND:cl CLn:H+act+tr AND:vp' },
    { id: 'canterville', title: 'The Canterville Ghost', emoji: '🏰', book: 'The Canterville Ghost', author: 'Oscar Wilde',
      text: 'An American family | bought an old English castle. / Every night, | the ghost rattled his chains in the hall. / The family wasn’t afraid, | so the ghost felt very sad. / A kind girl named Virginia | listened to his sad story. / She helped him find peace | and the ghost disappeared forever.',
      spec: 'NP:H VP:H ADV CL2 CLc:H SO NP:H VP:HW CLn:H+act AND:cl' },
    { id: 'nightingale', title: 'The Nightingale and the Rose', emoji: '🌹', book: 'The Nightingale and the Rose', author: 'Oscar Wilde',
      text: 'A student wanted | to give a red rose to a girl. / There was no red rose | in his garden. / A nightingale heard him | and decided to help. / She pressed her heart against a thorn | and sang all night. / The rose turned red, | but the girl refused it.',
      spec: 'VI INF CLn:O PP:LOC CLn:A+act AND:vp CLn:A+act+tr AND:vp CLc:O BUT' },
    { id: 'dorian', title: 'The Magic Portrait', emoji: '🖼️', book: 'The Picture of Dorian Gray', author: 'Oscar Wilde',
      text: 'A handsome young man | had his portrait painted. / He wished | to stay young forever. / Years passed | but he never got older. / The face in the painting | became old and cruel. / He destroyed the picture | and died that same night.',
      spec: 'NP:H VP:H VI INF CLn:O BUT NP:O VP:HO CLn:H+act+tr AND:vp' },
    // ---- Edgar Allan Poe
    { id: 'telltale', title: 'The Beating Heart', emoji: '❤️', book: 'The Tell-Tale Heart', author: 'Edgar Allan Poe',
      text: 'An old man | had a pale blue eye. / The narrator hated it, | so he killed the old man. / Then he hid the body | under the floor. / When the police arrived, | he heard a loud heartbeat. / He couldn’t stand it, | so he confessed everything.',
      spec: 'NP:H VP:HAW CLc:H SO CLn:H+act+tr PP:LOC ADV CL2 CLc:H SO' },
    { id: 'raven', title: 'The Midnight Visitor', emoji: '🌙', book: 'The Raven', author: 'Edgar Allan Poe',
      text: 'At midnight, | a sad man sat alone in his room. / He read old books, | but he could not forget Lenore. / Suddenly, | a black raven flew in through the window. / The man asked questions, | and the raven answered “Nevermore.” / The raven sat on a statue, | and it never left.',
      spec: 'ADV CL2 CLc:H BUT ADV CL2 CLc:H AND:cl CLc:A AND:cl' },
    { id: 'cask', title: 'The Wine Cellar', emoji: '🍷', book: 'The Cask of Amontillado', author: 'Edgar Allan Poe',
      text: 'Montresor hated Fortunato, | so he made a plan. / He invited him | to taste a rare wine. / They walked | into the dark cellar. / Fortunato was drunk, | so he followed without a word. / At the end, | Montresor built a wall and left him there.',
      spec: 'CLc:H SO CLn:H+act+tr INF CLn:H+act+mot+dur+toh PP:TOHOUSE CLc:H SO ADV CL2' },
    { id: 'goldbug', title: 'The Golden Bug', emoji: '🪲', book: 'The Gold-Bug', author: 'Edgar Allan Poe',
      text: 'A strange man named Legrand | found a golden bug. / A piece of paper | showed a secret code. / Legrand solved the code | and followed the clues. / They dug a deep hole | beside a big tree. / Inside the hole, | they found a chest full of gold.',
      spec: 'NP:H VP:H NP:O VP:HWO CLn:H+act+tr AND:vp CLn:H+act+tr+dur PP:LOC ADV CL2' },
    // ---- other classics
    { id: 'alice', title: 'The White Rabbit', emoji: '🐇', book: 'Alice’s Adventures in Wonderland', author: 'Lewis Carroll',
      text: 'Alice saw a white rabbit | with a watch. / She followed it | and fell down a deep hole. / At the bottom, | she drank a little bottle and became tiny. / The Queen of Hearts | shouted, “Off with her head!” / Suddenly, Alice woke up | under a big tree.',
      spec: 'CLn:H+act+tr PP:INSTR CLn:H+act+tr AND:vp ADV CL2 NP:H VP:H CLn:H+act PP:LOC' },
    { id: 'christmas', title: 'The Grumpy Old Man', emoji: '🎄', book: 'A Christmas Carol', author: 'Charles Dickens',
      text: 'Old Scrooge hated Christmas | and loved only money. / On Christmas Eve, | the ghost of his partner appeared. / Three spirits | took him through his past and future. / He saw his own grave, | and he finally understood. / The next morning, | Scrooge gave gifts to everyone.',
      spec: 'CLn:H AND:vp ADV CL2 NP:W VP:HW CLc:H AND:cl ADV CL2' },
    { id: 'jekyll', title: 'The Strange Potion', emoji: '🧪', book: 'Strange Case of Dr Jekyll and Mr Hyde', author: 'Robert Louis Stevenson',
      text: 'Doctor Jekyll | invented a strange potion. / When he drank it, | he became the cruel Mister Hyde. / At night, | Hyde walked through London and hurt people. / Soon the potion | stopped working. / Hyde stayed forever, | and Doctor Jekyll disappeared.',
      spec: 'NP:H VP:H ADV CL2 ADV CL2 NP:O VP:HO CLc:H AND:cl' },
    { id: 'hound', title: 'The Hound on the Moor', emoji: '🐕', book: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle',
      text: 'A deadly legend | said a giant hound haunted the moor. / Sir Henry arrived | at the old house on the moor. / One night, | Holmes and Watson heard a terrible howl. / They followed the footprints | across the dark moor. / The hound was only a dog, | and its master was the real villain.',
      spec: 'NP:W VP:HW CLn:H+act+mot PP:LOC ADV CL2 CLn:H+act+tr+mot PP:LOC CLc:A AND:cl' },
  ];

  CLASSICS.forEach(c => {
    const halves = c.text.split(' / ').flatMap(x => x.split(' | ')).map(s => s.trim());
    if (halves.length !== 10) console.error('classics.js:', c.id, 'has', halves.length, 'cards');
    STORIES.push({
      id: c.id, title: c.title, emoji: c.emoji, source: { book: c.book, author: c.author },
      lines: halves, sets: { hard: halves, medium: halves, easy: halves }, specStr: c.spec,
    });
  });
})();
