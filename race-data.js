// Grammar Race: ALL the exercises and the settings (race.js reads them; edit the words here).
// Topics so far: subject pronouns · the verb to be · possessive adjectives · the Saxon genitive (up to p. 39).
//
// An exercise is one of:
//   { t: 'choice', q: 'I ___ 11 years old.', o: ['am', 'is', 'are'], a: 0 }   → tap the right word (a = the place of the right one; the buttons are shuffled)
//   { t: 'type',   q: 'My cat ___ black. (be)', a: ['is'] }                   → write the word(s); a = every answer that is accepted
// ___ marks the gap. Capital letters and the final . ! ? do not matter; ’ and ' are the same.
// `how` = the line under the coloured name of the topic (one for each kind of exercise). In a race the exercises come in groups
// of 4-8 of the same topic and the same kind, like the exercises of the book.
// A new topic = a new key in `topics` (the race takes the same number of exercises from every topic).

(() => {
  const topics = {
    pronouns: { label: 'Subject pronouns', color: '#3b9ae0', how: { choice: 'Choose the pronoun.', type: 'Write the pronoun.' }, items: [
      { t: 'choice', q: 'Anna is my friend. ___ is from Rome.', o: ['She', 'He', 'It'], a: 0 },
      { t: 'choice', q: 'Marco and I are cousins. ___ are in the same class.', o: ['We', 'They', 'You'], a: 0 },
      { t: 'choice', q: 'My brother is 12. ___ is very tall.', o: ['He', 'She', 'It'], a: 0 },
      { t: 'choice', q: 'The dogs are in the garden. ___ are hungry.', o: ['They', 'It', 'We'], a: 0 },
      { t: 'choice', q: 'Mr. and Mrs. Rossi are teachers. ___ are from Milan.', o: ['They', 'We', 'She'], a: 0 },
      { t: 'choice', q: 'Look at the cat! ___ is so small.', o: ['It', 'He', 'They'], a: 0 },
      { t: 'choice', q: 'Luca, ___ are late!', o: ['you', 'he', 'we'], a: 0 },
      { t: 'choice', q: 'Sara and Anna are twins. ___ are ten.', o: ['They', 'She', 'We'], a: 0 },
      { t: 'choice', q: 'My mom is a nurse. ___ works at the hospital.', o: ['She', 'He', 'It'], a: 0 },
      { t: 'choice', q: '___ am in class 1B.', o: ['I', 'He', 'It'], a: 0 },
      { t: 'type', q: 'My sister and I → ___ (one word)', a: ['we'] },
      { t: 'type', q: 'The books → ___ (one word)', a: ['they'] },
      { t: 'type', q: 'Mr. Smith → ___ (one word)', a: ['he'] },
      { t: 'type', q: 'The table → ___ (one word)', a: ['it'] },
      { t: 'type', q: 'Marta and Giulia → ___ (one word)', a: ['they'] },
    ] },
    be: { label: 'Verb to be', color: '#8e2de2', how: { choice: 'Choose the right form of to be.', type: 'Write the form of to be.' }, items: [
      { t: 'choice', q: 'I ___ 11 years old.', o: ['am', 'is', 'are'], a: 0 },
      { t: 'choice', q: 'My parents ___ at work.', o: ['are', 'is', 'am'], a: 0 },
      { t: 'choice', q: 'Tom ___ happy today.', o: ['is', 'are', 'am'], a: 0 },
      { t: 'choice', q: 'We ___ in the library.', o: ['are', 'is', 'am'], a: 0 },
      { t: 'choice', q: '___ you from Spain?', o: ['Are', 'Is', 'Am'], a: 0 },
      { t: 'choice', q: '___ she your sister?', o: ['Is', 'Are', 'Am'], a: 0 },
      { t: 'choice', q: 'I ___ not tired.', o: ['am', 'is', 'are'], a: 0 },
      { t: 'choice', q: 'Are you hungry? — Yes, I ___.', o: ['am', 'are', 'is'], a: 0 },
      { t: 'choice', q: 'Is Luca a doctor? — No, he ___.', o: ["isn't", "aren't", "am not"], a: 0 },
      { t: 'choice', q: 'The children ___ in the park.', o: ['are', 'is', 'am'], a: 0 },
      { t: 'type', q: 'My cat ___ black. (be)', a: ['is'] },
      { t: 'type', q: 'You ___ my best friend. (be)', a: ['are'] },
      { t: 'type', q: "They are at home. → Say NO: They ___ at home.", a: ["aren't", 'are not'] },
      { t: 'type', q: 'The boys are ready. → ___ the boys ready?', a: ['are'] },
      { t: 'type', q: 'It ___ a cold day. (be)', a: ['is'] },
    ] },
    possessives: { label: 'Possessive adjectives', color: '#f05f4b', how: { choice: 'Choose my, your, his, her, its, our or their.', type: 'Write the possessive adjective.' }, items: [
      { t: 'choice', q: 'I love ___ dog.', o: ['my', 'me', 'mine'], a: 0 },
      { t: 'choice', q: 'Anna loves ___ new phone.', o: ['her', 'his', 'she'], a: 0 },
      { t: 'choice', q: 'Tom and I love ___ school.', o: ['our', 'their', 'my'], a: 0 },
      { t: 'choice', q: 'Is this ___ pen, Marco?', o: ['your', 'you', 'yours'], a: 0 },
      { t: 'choice', q: 'The dog is playing with ___ ball.', o: ['its', "it's", 'his'], a: 0 },
      { t: 'choice', q: 'Mr. Rossi is a teacher. This is ___ classroom.', o: ['his', 'her', 'their'], a: 0 },
      { t: 'choice', q: 'My parents love ___ garden.', o: ['their', 'there', "they're"], a: 0 },
      { t: 'choice', q: "___ going to the cinema tonight.", o: ["They're", 'Their', 'There'], a: 0 },
      { t: 'choice', q: 'Anna and Giulia are sisters. ___ room is blue.', o: ['Their', 'Her', 'Your'], a: 0 },
      { t: 'choice', q: 'The cat is cleaning ___ paws.', o: ['its', "it's", 'her'], a: 0 },
      { t: 'type', q: 'Marco and Luca: ___ mom is a teacher. (their / his / her?)', a: ['their'] },
      { t: 'type', q: 'He → ___ bike (one word)', a: ['his'] },
      { t: 'type', q: 'We → ___ teacher (one word)', a: ['our'] },
      { t: 'type', q: 'She → ___ name (one word)', a: ['her'] },
      { t: 'type', q: 'I → ___ bag (one word)', a: ['my'] },
    ] },
    saxon: { label: 'Possessive ’s', color: '#2e9e4f', how: { choice: 'Choose the right ’s.', type: 'Write the owner with ’s.' }, items: [
      { t: 'choice', q: 'The book of Anna → ___ book', o: ["Anna's", 'Annas', "Annas'"], a: 0 },
      { t: 'choice', q: 'The cars of my parents → my ___ cars', o: ["parents'", "parent's", 'parents'], a: 0 },
      { t: 'choice', q: 'This is my ___ bike.', o: ["brother's", 'brothers', "brothers's"], a: 0 },
      { t: 'choice', q: 'The ___ toys are in the box.', o: ["children's", "childrens'", 'childrens'], a: 0 },
      { t: 'choice', q: 'My two dogs have long tails. → My two ___ tails are long.', o: ["dogs'", "dog's", 'dogs'], a: 0 },
      { t: 'choice', q: 'Choose the right sentence.', o: ["My dad's car is new.", 'The car of my dad is new.', 'My dads car is new.'], a: 0 },
      { t: 'choice', q: 'Choose the right sentence.', o: ['The dogs are hungry.', "The dog's are hungry.", "The dogs' are hungry."], a: 0 },
      { t: 'choice', q: "Whose bag is it? — It's ___.", o: ["Marta's", 'Marta', 'Martas'], a: 0 },
      { t: 'choice', q: 'The phone of Luca → ___ phone', o: ["Luca's", 'Lucas', "Lucas'"], a: 0 },
      { t: 'choice', q: 'The room of my two sisters → my ___ room', o: ["sisters'", "sister's", "sisters's"], a: 0 },
      { t: 'type', q: 'the house of my grandma → my ___ house', a: ["grandma's"] },
      { t: 'type', q: 'the bag of the teacher → the ___ bag', a: ["teacher's"] },
      { t: 'type', q: 'the pencil case of Sara → ___ pencil case', a: ["sara's"] },
      { t: 'type', q: 'the toys of the babies → the ___ toys', a: ["babies'"] },
      { t: 'type', q: 'the dog of my friend (one friend) → my ___ dog', a: ["friend's"] },
    ] },
  };

  const settings = {
    perMinute: 2,        // exercises per minute of the race (20 minutes = 40 exercises, 10 per topic)
    presets: [10, 20, 30],
    defaultMinutes: 20,
    maxPlayers: 60,
    nameMax: 14,
    boardEvery: 4000,    // the teacher's device sends the ranking every 4 seconds
    maxMinutes: 30,      // the pool has 15 exercises per topic = 60: enough for 30 minutes
  };

  const api = { topics, settings };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.RACE_DATA = api;
})();
