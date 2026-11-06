// Paper Basket (Games for the teacher): the question is on the board, the pupils write the answer on a slip of paper,
// crumple it and shoot it into the basket. Data of the game; the game itself is in teacher-games.js.
// A set = { id, y: [school years 0-2], icon, color, title, kind, secs (time to write), hint, items: [[question, answer, pill?, family?], ...] }
// To add a card: add a pair ['question', 'answer'] to the items of a set. To add a set: add an object to BASKET_SETS.
// Translation sets: the board shows the Italian, the pupils write the English (AmE). Variants are separated by " / ".
(() => {
  // the verb paradigms of Paradigms Basket: [question, answer, how the board asks, family of the verb]
  const FAMILIES = {"pod":"🫛 3 Peas in a Pod","burger":"🍔 The Hamburger","ought":"💭 The -ought Gang","short":"🔠 Short Vowel Switch","tee":"✉️ The T-Ending","iau":"🎤 The i-a-u Singers","eww":"💨 The -ew Group","riders":"🚴 The Riders","en":"📝 The -en Group","loners":"🌟 The Loners"};
  const VERBS = [
  ["to risk money 🎲", "bet – bet – bet", "verb", "pod"],
  ["bet 🎲", "bet – bet – bet", "verb", "pod"],
  ["to divide something with scissors ✂️", "cut – cut – cut", "meaning", "pod"],
  ["✂️", "cut – cut – cut", "emoji", "pod"],
  ["to strike with force 👊", "hit – hit – hit", "meaning", "pod"],
  ["👊", "hit – hit – hit", "emoji", "pod"],
  ["to cause pain 🤕", "hurt – hurt – hurt", "meaning", "pod"],
  ["hurt 🤕", "hurt – hurt – hurt", "verb", "pod"],
  ["to place something down 📍", "put – put – put", "meaning", "pod"],
  ["put 📍", "put – put – put", "verb", "pod"],
  ["📖", "read – read – read", "emoji", "pod"],
  ["to allow someone to do something 🚪", "let – let – let", "meaning", "pod"],
  ["to have a price 💸", "cost – cost – cost", "meaning", "pod"],
  ["to transform 🦋", "become – became – become", "meaning", "burger"],
  ["to move toward someone 🚶", "come – came – come", "meaning", "burger"],
  ["🏃", "run – ran – run", "emoji", "burger"],
  ["to move fast on foot 🏃", "run – ran – run", "meaning", "burger"],
  ["overcome 💪", "overcome – overcame – overcome", "verb", "burger"],
  ["to carry something with you 📦", "bring – brought – brought", "meaning", "ought"],
  ["bring 📦", "bring – brought – brought", "verb", "ought"],
  ["🛒", "buy – bought – bought", "emoji", "ought"],
  ["to purchase something 🛒", "buy – bought – bought", "meaning", "ought"],
  ["🤔", "think – thought – thought", "emoji", "ought"],
  ["to use your brain 🤔", "think – thought – thought", "meaning", "ought"],
  ["to help others learn 👩‍🏫", "teach – taught – taught", "meaning", "ought"],
  ["teach 👩‍🏫", "teach – taught – taught", "verb", "ought"],
  ["to grab something moving fast 🧤", "catch – caught – caught", "meaning", "ought"],
  ["to fight in a battle ⚔️", "fight – fought – fought", "meaning", "ought"],
  ["to obtain something ✅", "get – got – got", "meaning", "short"],
  ["🪑", "sit – sat – sat", "emoji", "short"],
  ["to be seated 🪑", "sit – sat – sat", "meaning", "short"],
  ["🏆", "win – won – won", "emoji", "short"],
  ["to be victorious 🏆", "win – won – won", "meaning", "short"],
  ["to be upright on your feet 🧍", "stand – stood – stood", "meaning", "short"],
  ["to grip tightly 🤝", "hold – held – held", "meaning", "short"],
  ["to encounter someone 👋", "meet – met – met", "meaning", "short"],
  ["🏗️", "build – built – built", "emoji", "tee"],
  ["to construct a building 🏗️", "build – built – built", "meaning", "tee"],
  ["to loan money to someone 💰", "lend – lent – lent", "meaning", "tee"],
  ["📬", "send – sent – sent", "emoji", "tee"],
  ["to mail something 📬", "send – sent – sent", "meaning", "tee"],
  ["to use money 💵", "spend – spent – spent", "meaning", "tee"],
  ["to experience an emotion ❤️", "feel – felt – felt", "meaning", "tee"],
  ["😴", "sleep – slept – slept", "emoji", "tee"],
  ["to rest with eyes closed 😴", "sleep – slept – slept", "meaning", "tee"],
  ["to continue to have something 🔒", "keep – kept – kept", "meaning", "tee"],
  ["to go away from a place 👋", "leave – left – left", "meaning", "tee"],
  ["🎵", "sing – sang – sung", "emoji", "iau"],
  ["to make music with your voice 🎵", "sing – sang – sung", "meaning", "iau"],
  ["🥤", "drink – drank – drunk", "emoji", "iau"],
  ["to swallow a liquid 🥤", "drink – drank – drunk", "meaning", "iau"],
  ["🏊", "swim – swam – swum", "emoji", "iau"],
  ["to move in water 🏊", "swim – swam – swum", "meaning", "iau"],
  ["to start something ▶️", "begin – began – begun", "meaning", "iau"],
  ["🔔", "ring – rang – rung", "emoji", "iau"],
  ["to make a bell sound 🔔", "ring – rang – rung", "meaning", "iau"],
  ["💨", "blow – blew – blown", "emoji", "eww"],
  ["to push air with your mouth 💨", "blow – blew – blown", "meaning", "eww"],
  ["to become bigger 🌱", "grow – grew – grown", "meaning", "eww"],
  ["to have information about something 💡", "know – knew – known", "meaning", "eww"],
  ["⚾", "throw – threw – thrown", "emoji", "eww"],
  ["to launch something through the air ⚾", "throw – threw – thrown", "meaning", "eww"],
  ["✈️", "fly – flew – flown", "emoji", "eww"],
  ["to move through the sky ✈️", "fly – flew – flown", "meaning", "eww"],
  ["🚴", "ride – rode – ridden", "emoji", "riders"],
  ["to sit on and control a bike 🚴", "ride – rode – ridden", "meaning", "riders"],
  ["✍️", "write – wrote – written", "emoji", "riders"],
  ["to form words with a pen ✍️", "write – wrote – written", "meaning", "riders"],
  ["🚗", "drive – drove – driven", "emoji", "riders"],
  ["to control a vehicle 🚗", "drive – drove – driven", "meaning", "riders"],
  ["to go up or come up ☀️", "rise – rose – risen", "meaning", "riders"],
  ["🍽️", "eat – ate – eaten", "emoji", "en"],
  ["to put food in your mouth 🍽️", "eat – ate – eaten", "meaning", "en"],
  ["to use your voice to talk 🗣️", "speak – spoke – spoken", "meaning", "en"],
  ["💔", "break – broke – broken", "emoji", "en"],
  ["to separate something into pieces 💔", "break – broke – broken", "meaning", "en"],
  ["to take illegally 🦹", "steal – stole – stolen", "meaning", "en"],
  ["to pick one option ✅", "choose – chose – chosen", "meaning", "en"],
  ["🍂", "fall – fell – fallen", "emoji", "en"],
  ["to drop to the ground 🍂", "fall – fell – fallen", "meaning", "en"],
  ["🎁", "give – gave – given", "emoji", "en"],
  ["to offer something to someone 🎁", "give – gave – given", "meaning", "en"],
  ["to exist ⭐", "be – was/were – been", "meaning", "loners"],
  ["to move away from here 🚶‍♂️", "go – went – gone", "meaning", "loners"],
  ["to complete a task ✅", "do – did – done", "meaning", "loners"],
  ["👁️", "see – saw – seen", "emoji", "loners"],
  ["to use your eyes 👁️", "see – saw – seen", "meaning", "loners"],
  ["🤚", "take – took – taken", "emoji", "loners"],
  ["to grab something 🤚", "take – took – taken", "meaning", "loners"],
  ["⏰", "wake – woke – woken", "emoji", "loners"],
  ["to stop sleeping ⏰", "wake – woke – woken", "meaning", "loners"],
  ["👕", "wear – wore – worn", "emoji", "loners"],
  ["to have clothes on your body 👕", "wear – wore – worn", "meaning", "loners"],
  ["to let others see something 👉", "show – showed – shown", "meaning", "loners"],
  ["to possess something 🤲", "have – had – had", "meaning", "loners"],
  ["to create or produce something 🛠️", "make – made – made", "meaning", "loners"]
  ];
  const PILL = { verb: '🔤 write the 3 forms', meaning: '💬 write the 3 forms', emoji: '🖼️ which verb is this? write the 3 forms' };
  const BASKET_SETS = [
    { id: 'paradigms', y: [1, 2], icon: '🏀', color: '#8e2de2', title: 'Verb paradigms', kind: 'Paradigms', secs: 18, hint: 'Write the 3 forms: infinitive – past simple – past participle.',
      items: VERBS.map(([q, a, t, g]) => [q, a, PILL[t], FAMILIES[g]]) },

    /* ----- single words: Italian → English ----- */
    { id: 'w-school', y: [0], icon: '🎒', color: '#f05f4b', title: 'School things', kind: 'Words IT → EN', secs: 12, hint: 'Write the English word.', items: [
      ['zaino', 'backpack'], ['penna', 'pen'], ['matita', 'pencil'], ['gomma', 'eraser'], ['righello', 'ruler'], ['quaderno', 'notebook'], ['astuccio', 'pencil case'], ['lavagna', 'board / blackboard'],
      ['banco', 'desk'], ['sedia', 'chair'], ['finestra', 'window'], ['porta', 'door'], ['forbici', 'scissors'], ['colla', 'glue'], ['libro', 'book'], ['compiti', 'homework'], ['aula', 'classroom'], ['palestra', 'gym'] ] },
    { id: 'w-food', y: [0], icon: '🍕', color: '#e0902c', title: 'Food and drinks', kind: 'Words IT → EN', secs: 12, hint: 'Write the English word.', items: [
      ['pane', 'bread'], ['latte', 'milk'], ['formaggio', 'cheese'], ['uovo', 'egg'], ['mela', 'apple'], ['fragola', 'strawberry'], ['pollo', 'chicken'], ['pesce', 'fish'], ['riso', 'rice'], ['succo di frutta', 'juice'],
      ['acqua', 'water'], ['biscotto', 'cookie'], ['gelato', 'ice cream'], ['verdure', 'vegetables'], ['carota', 'carrot'], ['patate', 'potatoes'], ['colazione', 'breakfast'], ['cena', 'dinner'] ] },
    { id: 'w-animals', y: [0], icon: '🐾', color: '#3aa04a', title: 'Animals', kind: 'Words IT → EN', secs: 12, hint: 'Write the English word.', items: [
      ['cane', 'dog'], ['gatto', 'cat'], ['cavallo', 'horse'], ['mucca', 'cow'], ['maiale', 'pig'], ['pecora', 'sheep'], ['coniglio', 'rabbit'], ['topo', 'mouse'], ['uccello', 'bird'],
      ['rana', 'frog'], ['serpente', 'snake'], ['ragno', 'spider'], ['farfalla', 'butterfly'], ['leone', 'lion'], ['scimmia', 'monkey'], ['lupo', 'wolf'], ['tartaruga', 'turtle'] ] },
    { id: 'w-body', y: [0], icon: '🧍', color: '#c35fb4', title: 'Family and body', kind: 'Words IT → EN', secs: 12, hint: 'Write the English word.', items: [
      ['nonna', 'grandmother / grandma'], ['zio', 'uncle'], ['cugino / cugina', 'cousin'], ['fratello', 'brother'], ['sorella', 'sister'], ['genitori', 'parents'], ['mano', 'hand'], ['piede', 'foot'],
      ['testa', 'head'], ['gamba', 'leg'], ['braccio', 'arm'], ['occhi', 'eyes'], ['orecchio', 'ear'], ['naso', 'nose'], ['dente', 'tooth'], ['schiena', 'back'], ['ginocchio', 'knee'], ['capelli', 'hair'] ] },
    { id: 'w-verbs1', y: [0, 1], icon: '🏃', color: '#4aa8ec', title: 'Everyday verbs', kind: 'Words IT → EN', secs: 12, hint: 'Write the verb in English (infinitive).', items: [
      ['svegliarsi', 'wake up'], ['alzarsi', 'get up'], ['lavarsi', 'wash'], ['mangiare', 'eat'], ['bere', 'drink'], ['giocare', 'play'], ['guardare', 'watch / look at'], ['ascoltare', 'listen to'],
      ['aiutare', 'help'], ['imparare', 'learn'], ['aprire', 'open'], ['chiudere', 'close'], ['camminare', 'walk'], ['correre', 'run'], ['ridere', 'laugh'], ['piangere', 'cry'], ['cucinare', 'cook'], ['dormire', 'sleep'] ] },
    { id: 'w-town', y: [1], icon: '🏙️', color: '#12a4a4', title: 'Town, house and clothes', kind: 'Words IT → EN', secs: 12, hint: 'Write the English word.', items: [
      ['negozio', 'shop / store'], ['ospedale', 'hospital'], ['biblioteca', 'library'], ['stazione', 'station'], ['ponte', 'bridge'], ['incrocio', 'intersection'], ['marciapiede', 'sidewalk'], ['appartamento', 'apartment'],
      ['cucina', 'kitchen'], ['soffitta', 'attic'], ['scale', 'stairs'], ['giacca', 'jacket'], ['maglione', 'sweater'], ['calzini', 'socks'], ['stivali', 'boots'], ['cappello', 'hat'], ['sciarpa', 'scarf'], ['gonna', 'skirt'] ] },
    { id: 'w-adj', y: [1], icon: '😀', color: '#e0584a', title: 'Adjectives and feelings', kind: 'Words IT → EN', secs: 12, hint: 'Write the English adjective.', items: [
      ['arrabbiato', 'angry'], ['annoiato', 'bored'], ['spaventato', 'scared / afraid'], ['stanco', 'tired'], ['orgoglioso', 'proud'], ['geloso', 'jealous'], ['timido', 'shy'], ['pigro', 'lazy'],
      ['simpatico', 'nice / friendly'], ['generoso', 'generous'], ['coraggioso', 'brave'], ['divertente', 'funny'], ['maleducato', 'rude'], ['preoccupato', 'worried'], ['curioso', 'curious'], ['pericoloso', 'dangerous'] ] },
    { id: 'w-hard', y: [2], icon: '🎓', color: '#1f2a6b', title: 'Harder words', kind: 'Words IT → EN', secs: 15, hint: 'Write the English word.', items: [
      ['ambiente', 'environment'], ['governo', 'government'], ['scelta', 'choice'], ['successo', 'success'], ['sicurezza', 'safety / security'], ['cittadino', 'citizen'], ['lavoro', 'job / work'], ['esperienza', 'experience'],
      ['sviluppare', 'develop'], ['sconfiggere', 'defeat / beat'], ['promettere', 'promise'], ['prendere in prestito', 'borrow'], ['prestare', 'lend'], ['ricordare', 'remember'], ['dimenticare', 'forget'], ['crescere', 'grow'],
      ['fiducia', 'trust'], ['straniero', 'foreigner'], ['sciopero', 'strike'], ['vittima', 'victim'] ] },
    { id: 'w-false', y: [1, 2], icon: '🪤', color: '#d6334f', title: 'False friends', kind: 'Words IT → EN', secs: 15, hint: 'Careful! The English word is NOT the one that looks the same.', items: [
      ['parenti', 'relatives'], ['biblioteca', 'library'], ['libreria', 'bookstore'], ['magazzino', 'warehouse'], ['attualmente', 'currently / at the moment'], ['eventualmente', 'possibly'],
      ['fabbrica', 'factory'], ['educato', 'polite'], ['pretendere', 'demand / expect'], ['assistere a', 'attend'], ['camera (stanza)', 'room'], ['sensibile', 'sensitive'], ['morbido', 'soft'], ['ritirare, andare a prendere', 'pick up'] ] },

    /* ----- sentences: Italian → English ----- */
    { id: 's-1', y: [0], icon: '💬', color: '#f05f4b', title: 'Phrases 1', kind: 'Phrases IT → EN', secs: 30, hint: 'Write the whole sentence in English.', items: [
      ['Come ti chiami?', "What's your name?"], ['Ho dodici anni.', "I'm twelve (years old)."], ['Sono italiano.', "I'm Italian."], ['Abito a Milano.', 'I live in Milan.'],
      ['Ho un fratello e due sorelle.', 'I have a brother and two sisters.'], ['Mi piace la pizza.', 'I like pizza.'], ['Non mi piacciono i ragni.', "I don't like spiders."], ['Che ore sono?', 'What time is it?'],
      ['Dov’è la scuola?', 'Where is the school?'], ['Il mio gatto è nero.', 'My cat is black.'], ['Posso andare in bagno?', 'Can I go to the bathroom?'], ['Non capisco.', "I don't understand."],
      ['Puoi ripetere, per favore?', 'Can you repeat, please?'], ['Lei ha i capelli lunghi.', 'She has long hair.'], ['Che giorno è oggi?', 'What day is it today?'], ['Dove sei?', 'Where are you?'] ] },
    { id: 's-2', y: [1], icon: '🗣️', color: '#3aa04a', title: 'Phrases 2', kind: 'Phrases IT → EN', secs: 35, hint: 'Write the whole sentence in English. Watch the tense!', items: [
      ['Ieri sono andato al cinema.', 'Yesterday I went to the movies.'], ['Che cosa hai fatto nel weekend?', 'What did you do on the weekend?'], ['Domani giocherò a calcio.', "Tomorrow I'll play soccer."],
      ['Sto leggendo un libro.', "I'm reading a book."], ['Lui si alza alle sette.', 'He gets up at seven.'], ['Lei non mangia carne.', "She doesn't eat meat."], ['Quanto costa?', 'How much is it?'],
      ['Mio fratello è più alto di me.', 'My brother is taller than me.'], ['Questo è il film più bello.', 'This is the best movie.'], ['Devo fare i compiti.', 'I have to do my homework.'],
      ['Posso aiutarti?', 'Can I help you?'], ['Non so nuotare.', "I can't swim."], ['Vado a scuola in autobus.', 'I go to school by bus.'], ['Hai mai visto un delfino?', 'Have you ever seen a dolphin?'],
      ['Stavo dormendo quando hai chiamato.', 'I was sleeping when you called.'], ['Perché sei in ritardo?', 'Why are you late?'] ] },
    { id: 's-3', y: [2], icon: '📜', color: '#1f2a6b', title: 'Phrases 3', kind: 'Phrases IT → EN', secs: 45, hint: 'Write the whole sentence in English. Think about the grammar!', items: [
      ['Se avessi tempo, viaggerei di più.', 'If I had time, I would travel more.'], ['Se piove, resteremo a casa.', "If it rains, we'll stay home."], ['Questo libro è stato scritto nel 1950.', 'This book was written in 1950.'],
      ['Vivo qui da cinque anni.', "I've lived here for five years."], ['Mi ha detto che era stanco.', 'He told me (that) he was tired.'], ['Non avresti dovuto mentire.', "You shouldn't have lied."],
      ['Ho smesso di fumare.', 'I stopped smoking.'], ['Non vedo l’ora di vederti.', "I'm looking forward to seeing you."], ['È troppo difficile per me.', "It's too difficult for me."],
      ['Sono abbastanza grande per guidare.', "I'm old enough to drive."], ['La ragazza che vive accanto è una cantante.', 'The girl who lives next door is a singer.'], ['Mi sono perso.', 'I got lost.'],
      ['Ci conosciamo da anni.', 'We have known each other for years.'], ['Quanto tempo ci vuole?', 'How long does it take?'], ['Preferisco il tè al caffè.', 'I prefer tea to coffee.'], ['Avrei voluto aiutarti.', 'I would have liked to help you.'] ] },
    { id: 's-talk', y: [0, 1, 2], icon: '☎️', color: '#8fb82e', title: 'Useful class talk', kind: 'Phrases IT → EN', secs: 25, hint: 'Say it in English like in a real class!', items: [
      ['Posso uscire?', 'Can I go out? / May I go out?'], ['Come si dice “gatto” in inglese?', 'How do you say “gatto” in English?'], ['Non ho la penna.', "I don't have a pen."], ['Ho dimenticato il quaderno.', 'I forgot my notebook.'],
      ['Puoi parlare più piano?', 'Can you speak more slowly?'], ['Che cosa significa?', 'What does it mean?'], ['Non ho finito.', "I haven't finished."], ['Posso avere un foglio?', 'Can I have a sheet of paper?'],
      ['Mi presti la gomma?', 'Can I borrow your eraser?'], ['A che pagina siamo?', 'What page are we on?'], ['Ho una domanda.', 'I have a question.'], ['Scusi, sono in ritardo.', "Sorry, I'm late."] ] },

    /* ----- the other way: English → Italian ----- */
    { id: 'r-words', y: [1, 2], icon: '🔁', color: '#e8820c', title: 'English → Italian', kind: 'Words EN → IT', secs: 12, hint: 'Write the Italian word.', items: [
      ['although', 'anche se / sebbene'], ['however', 'tuttavia / però'], ['actually', 'in realtà'], ['already', 'già'], ['enough', 'abbastanza / basta'], ['whether', 'se'], ['borrow', 'prendere in prestito'], ['lend', 'prestare'],
      ['fridge', 'frigorifero'], ['lawyer', 'avvocato'], ['neighbor', 'vicino (di casa)'], ['pillow', 'cuscino'], ['kitten', 'gattino'], ['cheap', 'economico'], ['fair', 'giusto / equo'], ['wise', 'saggio'], ['to improve', 'migliorare'], ['to achieve', 'raggiungere / ottenere'] ] },
  ];
  window.BASKET_SETS = BASKET_SETS;
})();
