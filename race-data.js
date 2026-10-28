// Grammar Race: ALL the exercises and the settings (race.js reads them; edit the words here).
// Topics so far: subject pronouns · the verb to be · possessive adjectives · the Saxon genitive (up to p. 39).
//
// An exercise is one of:
//   { t: 'choice', q: 'I ___ 11 years old.', o: ['am', 'is', 'are'], a: 0 }   → tap the right word (a = the place of the right one; the buttons are shuffled)
//   { t: 'type',   q: 'My cat ___ black. (be)', a: ['is'] }                   → write the word(s); a = every answer that is accepted
// ___ marks the gap. Capital letters and the final . ! ? do not matter; ’ and ' are the same.
// `how` = the line under the coloured name of the topic (one for each kind of exercise). In a race the exercises come in groups
// of 4-8 of the same topic and the same kind, like the exercises of the book.
// `fromMinutes: 20` = only in the long races (the translation exercises).
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
    exceptions: { label: 'Saxon genitive: exceptions', color: '#0f9d9a', how: { choice: 'Watch the exceptions: plurals, two owners, things.', type: 'Write the owner with ’s or ’.' }, items: [
      { t: 'choice', q: "The toys of the children → the ___ toys", o: ["children's","childrens'","childrens"], a: 0 },
      { t: 'choice', q: "The shoes of the men → the ___ shoes", o: ["men's","mens'","mens"], a: 0 },
      { t: 'choice', q: "Anna and Luca have one room. → ___ room", o: ["Anna and Luca's","Anna's and Luca's","Annas and Lucas"], a: 0 },
      { t: 'choice', q: "The team of the women → the ___ team", o: ["women's","womens'","womens"], a: 0 },
      { t: 'choice', q: "The books of the students → the ___ books", o: ["students'","student's","students"], a: 0 },
      { t: 'choice', q: "The legs ___ the table are broken.", o: ["of","'s","for"], a: 0 },
      { t: 'choice', q: "The toy of the baby → the ___ toy", o: ["baby's","babies'","babys"], a: 0 },
      { t: 'choice', q: "The dresses of the ladies → the ___ dresses", o: ["ladies'","lady's","ladys"], a: 0 },
      { t: 'choice', q: "Which is right? (a thing, not a person)", o: ["The door of the bathroom is blue.","The bathroom's door is blue.","The bathrooms door is blue."], a: 0 },
      { t: 'type', q: "the bikes of the children → the ___ bikes", a: ["children's"] },
      { t: 'type', q: "the hats of the men → the ___ hats", a: ["men's"] },
      { t: 'type', q: "the cat of Anna and Luca (one cat) → ___ cat", a: ["Anna and Luca's"] },
      { t: 'type', q: "the room of the women → the ___ room", a: ["women's"] },
    ] },
    hisis: { label: 'His or is?', color: '#d98a00', how: { choice: 'Choose his or is.', type: 'Write his or is.' }, items: [
      { t: 'choice', q: "Tom loves ___ new bike.", o: ["his","is","he's"], a: 0 },
      { t: 'choice', q: "Tom ___ happy today.", o: ["is","his","he's"], a: 0 },
      { t: 'choice', q: "This is Luca’s pencil case. It is ___ pencil case.", o: ["his","is","its"], a: 0 },
      { t: 'choice', q: "My brother ___ 12 years old.", o: ["is","his","its"], a: 0 },
      { t: 'choice', q: "He ___ a good player.", o: ["is","his","hes"], a: 0 },
      { t: 'choice', q: "Marco forgot ___ phone.", o: ["his","is","he's"], a: 0 },
      { t: 'choice', q: "___ he your cousin?", o: ["Is","His","He's"], a: 0 },
      { t: 'choice', q: "Where ___ the cat?", o: ["is","his","its"], a: 0 },
      { t: 'choice', q: "My dad has ___ keys.", o: ["his","is","he is"], a: 0 },
      { t: 'choice', q: "“He’s a doctor” = He ___ a doctor.", o: ["is","his","are"], a: 0 },
      { t: 'type', q: "Paul ___ from Spain. (is / his)", a: ["is"] },
      { t: 'type', q: "Paul loves ___ dog. (is / his)", a: ["his"] },
      { t: 'type', q: "Anna is Paul’s sister. She loves ___ brother. (is / his)", a: ["his"] },
      { t: 'type', q: "The sky ___ blue. (is / his)", a: ["is"] },
    ] },
    youre: { label: 'Your or you’re?', color: '#c2398f', how: { choice: 'Choose your or you’re.', type: 'Write your or you’re.' }, items: [
      { t: 'choice', q: "___ my best friend.", o: ["You're","Your","Youre"], a: 0 },
      { t: 'choice', q: "Is this ___ bag, Marta?", o: ["your","you're","yours"], a: 0 },
      { t: 'choice', q: "___ late for school!", o: ["You're","Your","Youre"], a: 0 },
      { t: 'choice', q: "What is ___ name?", o: ["your","you're","you"], a: 0 },
      { t: 'choice', q: "I think ___ right.", o: ["you're","your","youre"], a: 0 },
      { t: 'choice', q: "Tom, ___ dog is so cute!", o: ["your","you're","you"], a: 0 },
      { t: 'choice', q: "You're = you ___", o: ["are","is","our"], a: 0 },
      { t: 'choice', q: "Where are ___ shoes?", o: ["your","you're","you"], a: 0 },
      { t: 'choice', q: "___ going to the party, right?", o: ["You're","Your","Youre"], a: 0 },
      { t: 'choice', q: "Please, open ___ books.", o: ["your","you're","you"], a: 0 },
      { t: 'type', q: "___ very tall! (your / you're)", a: ["you're","you are"] },
      { t: 'type', q: "Is this ___ phone? (your / you're)", a: ["your"] },
      { t: 'type', q: "Open ___ notebook, please. (your / you're)", a: ["your"] },
      { t: 'type', q: "___ my friend. (your / you're)", a: ["you're","you are"] },
    ] },
    translate: { label: 'Translate', color: '#5b6ee1', fromMinutes: 20, how: { type: 'Translate into English. Use ’s.' }, items: [
      { t: 'type', q: "La canzone di Michael Jackson", a: ["Michael Jackson's song"] },
      { t: 'type', q: "Lo zaino di mio figlio", a: ["My son's backpack","My son's bag","My son's rucksack"] },
      { t: 'type', q: "Le uniformi degli studenti", a: ["The students' uniforms","Students' uniforms"] },
      { t: 'type', q: "Il cane di Marta", a: ["Marta's dog"] },
      { t: 'type', q: "La casa dei miei nonni", a: ["My grandparents' house","My grandparents' home"] },
      { t: 'type', q: "I giocattoli dei bambini", a: ["The children's toys","Children's toys"] },
      { t: 'type', q: "La bicicletta di mio fratello", a: ["My brother's bike","My brother's bicycle"] },
      { t: 'type', q: "Il telefono di Giulia", a: ["Giulia's phone","Giulia's cell phone"] },
      { t: 'type', q: "Le scarpe delle ragazze", a: ["The girls' shoes","Girls' shoes","The girls' sneakers"] },
      { t: 'type', q: "La stanza di Anna e Luca", a: ["Anna and Luca's room","Anna and Luca's bedroom"] },
      { t: 'type', q: "Il gatto di mia sorella", a: ["My sister's cat"] },
      { t: 'type', q: "La macchina di mio padre", a: ["My father's car","My dad's car"] },
    ] },
  };

  const settings = {
    perMinute: 2.2,      // exercises per minute: the same number from every topic that is in the race
    // the three versions. The minutes are only the length it is planned for (the clock just goes forward): they decide how many exercises.
    presets: [{ name: 'Short', minutes: 10 }, { name: 'Medium', minutes: 15 }, { name: 'Long', minutes: 25 }],
    defaultMinutes: 15,
    maxPlayers: 60,
    nameMax: 14,
    boardEvery: 4000,    // the teacher's device sends the ranking every 4 seconds
  };

  const api = { topics, settings };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.RACE_DATA = api;
})();
