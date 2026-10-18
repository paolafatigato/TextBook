// Two games in the same pop-up and with the same jobs: the Happy Job Race on [jobs-pros:L], Make Them Happy! on [jobs-story:L]
//   Happy Job Race    who gets happy first with their job?
//   Make Them Happy!  everybody gets the same character: who finds the job that makes them happiest in 5 turns?
//                     (the order is drawn and two players can’t choose the same job; each character also has
//                     2 jobs made for them, mixed among the others; it can be played online, 2 devices)
// Dreams (fame, a fortune…) spin a wheel of fortune: they win only if it stops on the coloured slice.
//
// Every player makes a "Me card": they share 12 hearts among the 10 things that can matter in a job
// (money, free time, family time, fame…). Then they choose a job and 4 of its 6 reasons ("It makes a lot
// of money", "You can become famous"…). In the race each player plays one reason per turn: it gives
// happiness, and more happiness when the player cares about it (more hearts). First to 100 wins.
// The first player starts from the hearts of 9.17 in the book ([jobs-career:L]), if they used 12 or fewer.
//
//   - a reason can be played only a few times (the pips); "An ordinary day" can always be played
//   - dream reasons (fame, a fortune…) are a gamble: most times a little frustration, sometimes a HUGE joy.
//     Every miss makes the next try a bit more likely to work
//   - every job has 2 bad sides: on some turns one of them happens, and it hurts more if the player cares
//     about what it takes away (a doctor who loves family time suffers from night shifts)
// The numbers live in this file only: the pupil reads the reasons and their hearts, and decides.
//
// How to add things:
//   a job → one entry in JOBS: 6 reasons R(text, value, archetype) and 2 bad sides B(text, value)
//   (the text of a reason must read well after "because": the end screen writes "I would like to be a vet because…")

(() => {
  const GOAL = 100;
  const HEARTS = 12;        // hearts to share on the Me card
  const MAX_H = 4;          // hearts on one value at most
  const BAD_CHANCE = .3;    // chance of a bad day after each turn
  const MULT = [.3, .8, 1.2, 1.6, 2];  // happiness × this, by the hearts on that value

  /* ================= data ================= */

  const VALUES = [
    { k: 'money', icon: '💰', name: 'Money' },
    { k: 'time', icon: '🏖️', name: 'Free time' },
    { k: 'family', icon: '🏡', name: 'Family time' },
    { k: 'help', icon: '🤝', name: 'Helping people' },
    { k: 'fame', icon: '⭐', name: 'Being famous' },
    { k: 'travel', icon: '✈️', name: 'Travel & adventure' },
    { k: 'create', icon: '🎨', name: 'Being creative' },
    { k: 'nature', icon: '🌳', name: 'Nature & animals' },
    { k: 'team', icon: '👫', name: 'Friends & teamwork' },
    { k: 'safe', icon: '🔒', name: 'A safe, steady job' },
  ];
  const VAL = Object.fromEntries(VALUES.map(v => [v.k, v]));

  // the archetype fixes the numbers and the hint shown in the race (the pupil chooses from the text only)
  const ARCH = {
    daily: { uses: 5, gain: 5, hint: 'A small joy, almost every day.' },
    good:  { uses: 3, gain: 8, hint: 'A good feeling, a few times.' },
    big:   { uses: 2, gain: 13, hint: 'A big joy, but not very often.' },
    wow:   { uses: 1, gain: 22, hint: 'An amazing moment, only once!' },
    grow:  { uses: 2, gain: 3, hint: 'A small joy now, and your next reason gives double!' },
    calm:  { uses: 2, gain: 4, hint: 'A small joy, and your next bad day will not hurt.' },
    dream: { uses: Infinity, hint: 'It almost never happens… but when it does, WOW! Most times you feel a bit sad. Every try makes your chance grow.' },
  };
  const DREAM = { start: .12, step: .07, max: .5, jackpot: 45, miss: 3 };
  const BAD = 6;            // a bad day: -6 × the hearts multiplier
  const ORDINARY = { text: 'An ordinary day', arch: 'basic', uses: Infinity, gain: 3, hint: 'Nothing special: a little bit of happiness. You can always play it.' };

  const R = (text, v, arch) => ({ text, v, arch, uses: ARCH[arch].uses });
  const B = (text, v) => ({ text, v });

  const JOBS = [
    { k: 'doctor', icon: '🩺', name: 'doctor', reasons: [
      R('You help sick people every day.', 'help', 'daily'),
      R('You save a life!', 'help', 'wow'),
      R('It makes good money.', 'money', 'good'),
      R('It is a safe job: hospitals always need doctors.', 'safe', 'good'),
      R('You work in a big team.', 'team', 'good'),
      R('You could discover a new cure and become famous.', 'fame', 'dream'),
    ], bad: [B('Night shifts: you miss dinner with your family.', 'family'), B('Long hours: almost no free time.', 'time')] },
    { k: 'teacher', icon: '🧑‍🏫', name: 'teacher', reasons: [
      R('It has long summer holidays.', 'time', 'big'),
      R('You help children learn every day.', 'help', 'daily'),
      R('You prepare a really creative lesson.', 'create', 'grow'),
      R('It is a safe, steady job.', 'safe', 'good'),
      R('You finish early and see your family in the afternoon.', 'family', 'good'),
      R('One of your students becomes famous and thanks you on TV.', 'fame', 'dream'),
    ], bad: [B('It makes medium money, not a lot.', 'money'), B('You correct homework at the weekend.', 'time')] },
    { k: 'youtuber', icon: '📹', name: 'YouTuber', reasons: [
      R('You can become really famous.', 'fame', 'dream'),
      R('You are creative every day.', 'create', 'daily'),
      R('You choose your own hours.', 'time', 'good'),
      R('You make videos all over the world.', 'travel', 'good'),
      R('A big sponsor can pay you a fortune.', 'money', 'dream'),
      R('You make friends with other creators.', 'team', 'good'),
    ], bad: [B('It is not a safe job: some months you make no money.', 'safe'), B('Mean comments online make you sad.', 'fame')] },
    { k: 'footballer', icon: '⚽', name: 'footballer', reasons: [
      R('You can become world famous.', 'fame', 'dream'),
      R('If you play for a big team, you make millions.', 'money', 'dream'),
      R('You play in a team every day.', 'team', 'daily'),
      R('You travel to play matches.', 'travel', 'good'),
      R('You train hard and get better and better.', 'team', 'grow'),
      R('You score the winning goal in the final!', 'fame', 'wow'),
    ], bad: [B('An injury: you can’t play for months.', 'safe'), B('Matches every weekend, far from your family.', 'family')] },
    { k: 'chef', icon: '👩‍🍳', name: 'chef', reasons: [
      R('You invent new dishes.', 'create', 'daily'),
      R('You work with a happy team in the kitchen.', 'team', 'good'),
      R('You can become a famous chef on TV.', 'fame', 'dream'),
      R('You can work in any country in the world.', 'travel', 'good'),
      R('Customers love your food.', 'help', 'good'),
      R('Your restaurant is full every night: good money!', 'money', 'big'),
    ], bad: [B('You work in the evenings and at weekends.', 'family'), B('A hot, busy kitchen: no time to rest.', 'time')] },
    { k: 'vet', icon: '🐾', name: 'vet', reasons: [
      R('You work with animals every day.', 'nature', 'daily'),
      R('You help animals get better.', 'help', 'good'),
      R('You save a dog’s life!', 'help', 'wow'),
      R('It makes good money.', 'money', 'good'),
      R('You visit farms in the countryside.', 'nature', 'good'),
      R('You work with a small, friendly team.', 'team', 'good'),
    ], bad: [B('Emergency calls at night.', 'family'), B('Some days are sad: you can’t save every animal.', 'help')] },
    { k: 'engineer', icon: '👷', name: 'engineer', reasons: [
      R('It makes a lot of money.', 'money', 'big'),
      R('It is a safe job: everybody needs engineers.', 'safe', 'daily'),
      R('You design bridges and machines.', 'create', 'good'),
      R('You take a course and learn new skills.', 'safe', 'grow'),
      R('You travel to building sites around the world.', 'travel', 'good'),
      R('Your invention changes the world and you become famous.', 'fame', 'dream'),
    ], bad: [B('Long hours in the office.', 'time'), B('You sit at a desk, far from nature.', 'nature')] },
    { k: 'astronaut', icon: '🚀', name: 'astronaut', reasons: [
      R('You go to space!', 'travel', 'wow'),
      R('Everybody knows your name.', 'fame', 'good'),
      R('You see the whole Earth from space.', 'nature', 'big'),
      R('You work in a small, amazing team.', 'team', 'good'),
      R('You train for every possible problem.', 'safe', 'calm'),
      R('You could be the first person on Mars.', 'fame', 'dream'),
    ], bad: [B('Months away from your family.', 'family'), B('Years of training: no free time.', 'time')] },
    { k: 'farmer', icon: '🚜', name: 'farmer', reasons: [
      R('You work outdoors in nature every day.', 'nature', 'daily'),
      R('You work with your family.', 'family', 'good'),
      R('You grow food for everybody.', 'help', 'good'),
      R('You save money for the winter.', 'safe', 'calm'),
      R('A perfect harvest brings good money!', 'money', 'big'),
      R('Your cheese wins a prize at the fair.', 'fame', 'good'),
    ], bad: [B('Bad weather ruins the harvest.', 'money'), B('You work every day, even on Sunday.', 'time')] },
    { k: 'firefighter', icon: '🚒', name: 'firefighter', reasons: [
      R('You save people from a fire!', 'help', 'wow'),
      R('You help your town every day.', 'help', 'daily'),
      R('Your team is like a family.', 'team', 'good'),
      R('You train with your team, ready for anything.', 'team', 'calm'),
      R('After long shifts you have many days off.', 'time', 'good'),
      R('You are a hero in the newspaper.', 'fame', 'good'),
    ], bad: [B('It is a dangerous job.', 'safe'), B('Night shifts: you miss family dinners.', 'family')] },
    { k: 'artist', icon: '🎨', name: 'artist', reasons: [
      R('You create beautiful things every day.', 'create', 'daily'),
      R('You choose when to work.', 'time', 'good'),
      R('You can paint outdoors.', 'nature', 'good'),
      R('You show your paintings around the world.', 'travel', 'good'),
      R('One painting can sell for a million.', 'money', 'dream'),
      R('You can become a famous artist.', 'fame', 'dream'),
    ], bad: [B('It is not a safe job.', 'safe'), B('Some months you sell nothing.', 'money')] },
    { k: 'pilot', icon: '✈️', name: 'pilot', reasons: [
      R('You travel all over the world.', 'travel', 'daily'),
      R('It makes a lot of money.', 'money', 'big'),
      R('It has many days off between flights.', 'time', 'good'),
      R('You fly over mountains and seas.', 'nature', 'good'),
      R('You follow a checklist, so nothing goes wrong.', 'safe', 'calm'),
      R('You land safely in a storm and 200 passengers clap!', 'help', 'wow'),
    ], bad: [B('Nights in hotels, far from your family.', 'family'), B('Jet lag: you are always tired.', 'time')] },
    { k: 'actor', icon: '🎭', name: 'actor', reasons: [
      R('You can become a movie star.', 'fame', 'dream'),
      R('You can be anybody: a pirate, a king, a robot…', 'create', 'daily'),
      R('You work with a fun team.', 'team', 'good'),
      R('You film in amazing places.', 'travel', 'good'),
      R('A big film can make you rich.', 'money', 'dream'),
      R('People laugh and cry with you.', 'help', 'good'),
    ], bad: [B('It is not a safe job: many months without work.', 'safe'), B('Long days on set, far from home.', 'family')] },
    { k: 'programmer', icon: '💻', name: 'programmer', reasons: [
      R('It makes a lot of money.', 'money', 'big'),
      R('You can work from home, near your family.', 'family', 'good'),
      R('It is a safe job: everybody needs programmers.', 'safe', 'good'),
      R('You create apps and games.', 'create', 'daily'),
      R('You learn a new programming language.', 'create', 'grow'),
      R('Your app becomes famous all over the world.', 'fame', 'dream'),
    ], bad: [B('You sit in front of a screen all day.', 'nature'), B('Deadlines! You work late at night.', 'time')] },
    // the unusual jobs of [jobs-career:R] (odd: they get an "unusual!" label)
    { k: 'taster', icon: '🍦', name: 'ice-cream taster', odd: true, reasons: [
      R('You invent crazy new flavours.', 'create', 'daily'),
      R('You eat ice cream at work!', 'time', 'good'),
      R('People smile when they taste your ice cream.', 'help', 'good'),
      R('Your tongue is insured for a million dollars!', 'money', 'big'),
      R('You work with a small, friendly team.', 'team', 'good'),
      R('Your new flavour becomes famous all over the world.', 'fame', 'dream'),
    ], bad: [B('No spicy food, no hot drinks: you must protect your tongue.', 'time'), B('It is a rare job: there are very few in the world.', 'safe')] },
    { k: 'storm', icon: '🌪️', name: 'storm chaser', odd: true, reasons: [
      R('You chase tornadoes across the country.', 'travel', 'daily'),
      R('You see the wildest nature on Earth.', 'nature', 'big'),
      R('Your data helps to warn people about storms.', 'help', 'good'),
      R('You work with a brave team.', 'team', 'good'),
      R('You check the radar again and again, so you are ready.', 'safe', 'calm'),
      R('You film the perfect tornado and your video goes viral.', 'fame', 'dream'),
    ], bad: [B('It can be dangerous!', 'safe'), B('Weeks on the road, far from your family.', 'family')] },
    { k: 'gametester', icon: '🎮', name: 'video game tester', odd: true, reasons: [
      R('You play new games before everybody else.', 'time', 'daily'),
      R('You find a big bug and save the game!', 'help', 'big'),
      R('You give ideas to make the game better.', 'create', 'good'),
      R('You work with other gamers.', 'team', 'good'),
      R('You can work from home.', 'family', 'good'),
      R('Your name is in the credits of a famous game.', 'fame', 'dream'),
    ], bad: [B('You play the same level a hundred times.', 'time'), B('It makes medium money, not a lot.', 'money')] },
    { k: 'panda', icon: '🐼', name: 'panda keeper', odd: true, reasons: [
      R('You play with baby pandas every day.', 'nature', 'daily'),
      R('You help to save an animal in danger.', 'help', 'big'),
      R('A baby panda is born!', 'nature', 'wow'),
      R('You live in the mountains of China.', 'travel', 'good'),
      R('You work in a team of animal experts.', 'team', 'good'),
      R('Your panda video is seen all over the world.', 'fame', 'dream'),
    ], bad: [B('You clean a lot of panda poo, every day.', 'time'), B('You live far away from your family.', 'family')] },
    { k: 'stunt', icon: '🎬', name: 'stunt performer', odd: true, reasons: [
      R('You jump, fall and fight in films.', 'travel', 'daily'),
      R('You crash a car in a big film!', 'travel', 'wow'),
      R('You work with a great team.', 'team', 'good'),
      R('You train hard and you are ready for anything.', 'safe', 'calm'),
      R('You meet famous actors.', 'fame', 'good'),
      R('It makes good money.', 'money', 'good'),
    ], bad: [B('You can get hurt.', 'safe'), B('Nobody knows your name: the actor gets the glory.', 'fame')] },
    { k: 'bed', icon: '🛏️', name: 'bed tester', odd: true, reasons: [
      R('You get paid to sleep!', 'time', 'daily'),
      R('You sleep a week in a palace hotel!', 'travel', 'big'),
      R('You help people sleep better.', 'help', 'good'),
      R('You can work near your family.', 'family', 'good'),
      R('A long nap makes you ready for anything.', 'safe', 'calm'),
      R('Your sleep blog becomes famous.', 'fame', 'dream'),
    ], bad: [B('It makes little money.', 'money'), B('Some beds are hard and noisy: you can’t sleep!', 'time')] },
  ];
  // Make Them Happy!: jobs made for one character (CLIENTS[].jobs). They appear only in that character's
  // game, mixed among the other jobs at random places, with no label: the players have to spot them
  const EXTRA = [
    { k: 'gardener', icon: '🌻', name: 'gardener', reasons: [
      R('You work outdoors among flowers every day.', 'nature', 'daily'),
      R('You grow vegetables for the whole family.', 'family', 'good'),
      R('Your garden makes people happy.', 'help', 'good'),
      R('You work in a small, friendly team.', 'team', 'good'),
      R('Your roses win first prize at the flower show!', 'nature', 'big'),
      R('You finish early and see your grandchildren.', 'family', 'good'),
    ], bad: [B('Rain, rain, rain: a cold, wet day.', 'time'), B('It makes little money.', 'money')] },
    { k: 'childminder', icon: '👶', name: 'childminder', reasons: [
      R('You look after little children every day.', 'family', 'daily'),
      R('You help busy parents.', 'help', 'good'),
      R('You take the children to the park.', 'nature', 'good'),
      R('A child gives you a drawing: “I love you!”', 'family', 'big'),
      R('You meet other childminders at the playground.', 'team', 'good'),
      R('You read stories and help them grow.', 'help', 'good'),
    ], bad: [B('Children are noisy: you are always tired.', 'time'), B('It makes little money.', 'money')] },
    { k: 'popstar', icon: '🎤', name: 'pop star', reasons: [
      R('You sing in front of 50,000 fans!', 'fame', 'good'),
      R('You write new songs.', 'create', 'daily'),
      R('You go on a world tour.', 'travel', 'good'),
      R('Your song is number 1!', 'fame', 'wow'),
      R('You can sell millions of albums.', 'money', 'dream'),
      R('Fans scream your name everywhere.', 'fame', 'good'),
    ], bad: [B('Photographers follow you everywhere.', 'family'), B('Concerts every night: no free time.', 'time')] },
    { k: 'presenter', icon: '📺', name: 'TV presenter', reasons: [
      R('Everybody knows your face.', 'fame', 'daily'),
      R('You invent new shows.', 'create', 'good'),
      R('You film in different countries.', 'travel', 'good'),
      R('It makes a lot of money.', 'money', 'good'),
      R('You interview a famous star!', 'fame', 'big'),
      R('Your show can win a big prize.', 'fame', 'dream'),
    ], bad: [B('If people don’t watch your show, it closes.', 'safe'), B('You get up at 4 a.m. for the morning show.', 'time')] },
    { k: 'guide', icon: '🏔️', name: 'mountain guide', reasons: [
      R('You climb mountains every day.', 'nature', 'daily'),
      R('You take groups on adventures.', 'travel', 'good'),
      R('You reach the top of a famous mountain!', 'travel', 'big'),
      R('You work with a brave team.', 'team', 'good'),
      R('You see eagles and wild goats.', 'nature', 'good'),
      R('You have long winters off.', 'time', 'good'),
    ], bad: [B('It can be dangerous.', 'safe'), B('Bad weather: you can’t go out.', 'nature')] },
    { k: 'marine', icon: '🐬', name: 'marine biologist', reasons: [
      R('You dive in the ocean every day.', 'nature', 'daily'),
      R('You study dolphins and whales.', 'nature', 'good'),
      R('You sail around the world.', 'travel', 'big'),
      R('You work on a ship with a great team.', 'team', 'good'),
      R('You help to protect the sea.', 'help', 'good'),
      R('You can discover a new kind of fish.', 'fame', 'dream'),
    ], bad: [B('Months on a ship, far from home.', 'family'), B('It doesn’t make much money.', 'money')] },
    { k: 'banker', icon: '🏦', name: 'bank manager', reasons: [
      R('It makes a lot of money.', 'money', 'good'),
      R('It is a very safe job.', 'safe', 'daily'),
      R('You get a big bonus at Christmas!', 'money', 'big'),
      R('You have a quiet office.', 'safe', 'good'),
      R('You finish at 5 p.m. every day.', 'family', 'good'),
      R('You manage a team.', 'team', 'good'),
    ], bad: [B('Meetings, meetings, meetings.', 'time'), B('It isn’t very creative.', 'create')] },
    { k: 'accountant', icon: '🧮', name: 'accountant', reasons: [
      R('You count money all day.', 'money', 'daily'),
      R('It is a safe, steady job.', 'safe', 'good'),
      R('Everything is in perfect order.', 'safe', 'calm'),
      R('It makes good money.', 'money', 'good'),
      R('You work from home on Fridays.', 'family', 'good'),
      R('You have long holidays in August.', 'time', 'good'),
    ], bad: [B('In spring you work every evening.', 'time'), B('Numbers, numbers… and nothing else.', 'create')] },
    { k: 'inventor', icon: '💡', name: 'inventor', reasons: [
      R('You invent something new every day.', 'create', 'daily'),
      R('Your invention works at last!', 'create', 'big'),
      R('Your invention is on TV.', 'fame', 'good'),
      R('You choose your own hours.', 'time', 'good'),
      R('You present your ideas around the world.', 'travel', 'good'),
      R('Your invention can make you a millionaire.', 'money', 'dream'),
    ], bad: [B('Many inventions don’t work.', 'safe'), B('You work alone in your lab.', 'team')] },
    { k: 'designer', icon: '🕹️', name: 'game designer', reasons: [
      R('You create new worlds.', 'create', 'daily'),
      R('You work with a team of artists.', 'team', 'good'),
      R('You have a crazy new idea!', 'create', 'big'),
      R('You can work from anywhere in the world.', 'travel', 'good'),
      R('You have flexible hours.', 'time', 'good'),
      R('Millions of people can play your game.', 'fame', 'dream'),
    ], bad: [B('Deadlines! You work late at night.', 'time'), B('Some players are very angry with you.', 'fame')] },
    { k: 'schoolnurse', icon: '🩹', name: 'school nurse', reasons: [
      R('You work at your children’s school.', 'family', 'daily'),
      R('You help children who feel ill.', 'help', 'good'),
      R('It is a safe, steady job.', 'safe', 'good'),
      R('You have the school holidays off.', 'time', 'good'),
      R('You help a child in an emergency!', 'help', 'big'),
      R('You finish at 3 p.m.', 'family', 'good'),
    ], bad: [B('It makes medium money, not a lot.', 'money'), B('Lots of forms to fill in.', 'create')] },
    { k: 'pharmacist', icon: '💊', name: 'pharmacist', reasons: [
      R('You help people every day.', 'help', 'daily'),
      R('It is a very safe job.', 'safe', 'good'),
      R('It makes good money.', 'money', 'good'),
      R('Your pharmacy is near your home.', 'family', 'good'),
      R('Your advice saves a life!', 'help', 'big'),
      R('You learn about new medicines.', 'safe', 'grow'),
    ], bad: [B('You work some Saturdays.', 'family'), B('You stand up all day.', 'time')] },
    { k: 'zookeeper', icon: '🦒', name: 'zookeeper', reasons: [
      R('You feed lions, giraffes and penguins.', 'nature', 'daily'),
      R('You help animals in danger.', 'help', 'good'),
      R('A baby giraffe is born!', 'nature', 'wow'),
      R('You teach children about animals.', 'help', 'good'),
      R('You build fun toys for the monkeys.', 'create', 'good'),
      R('You work outdoors all day.', 'nature', 'good'),
    ], bad: [B('You clean a lot of animal poo.', 'time'), B('Weekends and holidays at the zoo.', 'family')] },
    { k: 'dogtrainer', icon: '🐕', name: 'dog trainer', reasons: [
      R('You play with dogs every day.', 'nature', 'daily'),
      R('You choose your own hours.', 'time', 'good'),
      R('You help families with their dogs.', 'help', 'good'),
      R('You invent fun games for dogs.', 'create', 'good'),
      R('Your dog wins a big competition!', 'nature', 'big'),
      R('You go for long walks in the park.', 'time', 'good'),
    ], bad: [B('It is not a safe job.', 'safe'), B('It doesn’t make much money.', 'money')] },
    { k: 'partyplanner', icon: '🎉', name: 'party planner', reasons: [
      R('You organise parties every weekend.', 'team', 'daily'),
      R('You work with a big, fun team.', 'team', 'good'),
      R('You have long breaks between parties.', 'time', 'good'),
      R('You plan a party on a beach in Spain.', 'travel', 'good'),
      R('A VIP party: a big tip!', 'money', 'good'),
      R('It’s the best party of the year!', 'team', 'wow'),
    ], bad: [B('You work every Saturday night.', 'family'), B('Some months there are no parties.', 'safe')] },
    { k: 'tourguide', icon: '🗺️', name: 'tour guide', reasons: [
      R('You meet new people every day.', 'team', 'daily'),
      R('You travel to beautiful cities.', 'travel', 'good'),
      R('Winter is free: long holidays!', 'time', 'big'),
      R('You tell funny stories.', 'create', 'good'),
      R('Tourists give you good tips.', 'money', 'good'),
      R('Your group loves you.', 'team', 'good'),
    ], bad: [B('You walk 20 km a day.', 'time'), B('You are far from your family all summer.', 'family')] },
  ];
  const JOB = Object.fromEntries([...JOBS, ...EXTRA].map(j => [j.k, j]));

  // what a dream says when it works / when it does not
  const DREAM_TEXT = {
    fame: ['⭐ WOW! You are famous! Everybody knows your name!', '😕 Nobody noticed you today…'],
    money: ['💰 JACKPOT! You made a fortune!', '😕 No big money this time…'],
  };

  const AVATARS = ['🧒', '👧', '👦', '🧑', '👩', '🧔', '👱‍♀️', '👩‍🦱', '👨‍🦰', '🧑‍🦱', '👩‍🦳', '🦊', '🐱', '🐼', '🦄', '🐸'];
  const BOTS = [{ name: 'Robo-Rita', avatar: '🤖' }, { name: 'Robo-Max', avatar: '👾' }];

  // Make Them Happy!: the characters who need a job (12 hearts each, like a Me card).
  // The end screen says "Rosa should be a vet because she cares about…": CARE is how each value reads there
  const ROUNDS = 5;
  const CLIENTS = [
    { name: 'Grandma Rosa', jobs: ['gardener', 'childminder'], icon: '👵', she: true, hearts: { family: 4, nature: 3, help: 3, team: 2 },
      bio: 'Rosa is 70. She has nine grandchildren and a big garden full of flowers. She hates being alone, and she doesn’t care about money at all.' },
    { name: 'Leo', jobs: ['popstar', 'presenter'], icon: '🧑‍🎤', hearts: { fame: 4, create: 3, travel: 3, money: 2 },
      bio: 'Leo is 19. He sings in the shower, he dances in the street and he wants everybody in the world to know his name.' },
    { name: 'Captain Zoe', jobs: ['guide', 'marine'], icon: '🧗‍♀️', she: true, hearts: { travel: 4, nature: 4, team: 2, time: 2 },
      bio: 'Zoe is 28. She climbs mountains, swims with sharks and never stays at home for more than a week.' },
    { name: 'Mr Grey', jobs: ['banker', 'accountant'], icon: '👨‍💼', hearts: { money: 4, safe: 4, time: 2, family: 2 },
      bio: 'Mr Grey is 45. He likes numbers, a quiet office and a big salary at the end of every month. He hates surprises!' },
    { name: 'Kim', jobs: ['inventor', 'designer'], icon: '👩‍🔬', she: true, hearts: { create: 4, team: 2, fame: 2, time: 2, travel: 2 },
      bio: 'Kim is 23. She is always inventing something: robots, recipes, songs… She gets bored very easily.' },
    { name: 'Sam', jobs: ['schoolnurse', 'pharmacist'], icon: '👨‍👧‍👦', hearts: { family: 4, help: 3, safe: 3, time: 2 },
      bio: 'Sam is 35 and has three small children. He wants to see them every afternoon, and he likes helping other people too.' },
    { name: 'Lily', jobs: ['zookeeper', 'dogtrainer'], icon: '👩‍🌾', she: true, hearts: { nature: 4, help: 3, time: 3, create: 2 },
      bio: 'Lily is 25. She loves animals more than people! She has two dogs, a cat, a parrot and a snake called Bob.' },
    { name: 'Max', jobs: ['partyplanner', 'tourguide'], icon: '🥳', hearts: { team: 4, time: 4, travel: 2, money: 2 },
      bio: 'Max is 30. He loves parties and friends, and he hates working alone. Long holidays are very important for him!' },
  ];
  const CARE = { money: 'money', time: 'free time', family: 'family time', help: 'helping people', fame: 'being famous', travel: 'travel and adventure', create: 'being creative', nature: 'nature and animals', team: 'friends and teamwork', safe: 'having a safe, steady job' };

  // The story at the end of Make Them Happy! (storyHtml): how each character's story begins, and the endings
  // written for the jobs that suit them best ({friend} = the player who found the job). Other jobs get an ending
  // made from the game. Past simple, A2–B1.
  const OPENINGS = {
    'Grandma Rosa': 'Rosa was seventy. Every morning she watered her flowers and counted the days until her grandchildren’s next visit. Her house was clean, her garden was perfect… and her days were very, very quiet. “I’m not old,” she told her cat one evening. “I’m just bored!” So Rosa decided to find a job.',
    'Leo': 'Leo was nineteen, and he had a big voice and an even bigger dream. He sang in the shower, on the bus and in the supermarket queue. People looked at him strangely, but Leo didn’t care. “One day,” he said, “everybody will know my name.” So Leo started looking for a job.',
    'Captain Zoe': 'Captain Zoe was twenty-eight. Her suitcase was always open on the floor, because she was never at home for long. She climbed mountains in Peru, she swam with sharks in Australia, and she hated offices. “I need a job,” she said, “but I need the sky above my head!”',
    'Mr Grey': 'Mr Grey was forty-five. Every morning he ate the same breakfast, wore the same grey suit and took the same bus at 7.42. He loved numbers, quiet rooms and the safe feeling of a big salary at the end of the month. He hated surprises. So when he decided to change his job, he did it very, very carefully.',
    'Kim': 'Kim was twenty-three, and her flat was full of strange machines: a robot that made pancakes, a lamp that sang, a bicycle that charged her phone. Kim had a new idea every hour, but she got bored very easily. “I need a job that is never the same,” she said.',
    'Sam': 'Sam was thirty-five. He had three small children, a very busy kitchen and not much free time. Every afternoon he wanted to be at the school gate when his kids came out. He also loved helping people: his neighbours called him “Super Sam”. Sam needed a new job, but not just any job.',
    'Lily': 'Lily was twenty-five, and she lived with two dogs, a cat, a parrot and a snake called Bob. She understood animals better than people, and animals loved her too: when she walked in the park, every dog ran to say hello. “My job,” she said, “must have paws, wings or tails!”',
    'Max': 'Max was thirty, and he was the life of every party. He knew everybody’s name, he told the best jokes and he hated being alone. For Max, work was not important: holidays, friends and fun were important! But one day his bank account said: “Max, you need a job.”',
  };

  const ENDINGS = {
    'Grandma Rosa': {
      gardener: 'So Rosa became a gardener, and her quiet days were over! Every morning she worked among roses and tomatoes with her new friends from the town garden, and every afternoon her grandchildren came to help her. When her roses won first prize at the flower show, the whole family was there to clap. Rosa didn’t make much money, but she didn’t care at all. “I’m rich in flowers,” she laughed. Thank you, {friend}!',
      childminder: 'So Rosa became a childminder, and her house was never quiet again! There were drawings on the fridge, songs in the kitchen and little shoes in the garden. The children called her “Nonna Rosa”, and their parents brought her cakes to say thank you. In the evening Rosa was tired… but she was never, ever bored. Thank you, {friend}!',
      farmer: 'So Rosa became a farmer! She bought three goats, ten chickens and a very old tractor. On Sundays her grandchildren came to collect the eggs, and in summer the whole family picked cherries together. Rosa worked hard, but she smiled every single day. Thank you, {friend}!',
    },
    'Leo': {
      popstar: 'So Leo became a pop star! His first song was on every radio, and one year later he sang in front of fifty thousand fans. They screamed his name, his name!, every night of his world tour. Leo was tired and he didn’t have much free time, but he finally had what he always wanted: everybody knew his name. Thank you, {friend}!',
      presenter: 'So Leo became a TV presenter! Every morning millions of people had breakfast with him. He interviewed film stars, he travelled to different countries for his show, and he invented a game that everybody played at school the next day. Getting up at four was hard, but Leo loved the little red light of the camera. Thank you, {friend}!',
      youtuber: 'So Leo became a YouTuber! He filmed his songs in the street, in the shower and on top of a mountain. For months only his mum watched them… and then one video went viral: ten million views! Leo still had bad days and some mean comments, but now people stopped him in the street to take a selfie. Thank you, {friend}!',
    },
    'Captain Zoe': {
      guide: 'So Zoe became a mountain guide! Every week she took a new group up into the clouds, and she showed them eagles, wild goats and sunsets that nobody ever forgets. One day she reached the top of a famous mountain with her team, and they all cried with happiness. In winter, when the snow was too deep, Zoe rested… and planned her next adventure. Thank you, {friend}!',
      marine: 'So Zoe became a marine biologist! She lived on a ship, she dived with dolphins and she followed the whales across the ocean. Sometimes she missed her family, but every evening she watched the sun go down into the sea and thought: “This is my office!” Thank you, {friend}!',
      astronaut: 'So Zoe became an astronaut! After years of training, she flew into space with a small, amazing team. From the window she saw the whole Earth: the mountains she climbed, the seas she swam in, all of it, blue and white and beautiful. It was the biggest adventure of all. Thank you, {friend}!',
    },
    'Mr Grey': {
      banker: 'So Mr Grey became a bank manager! Now he had a quiet office, a team that worked well and a big salary at the end of every month. He still ate the same breakfast and took the same bus at 7.42, but at Christmas there was a surprise (a nice one, for once): a big bonus! Mr Grey smiled. Just a little. Thank you, {friend}!',
      accountant: 'So Mr Grey became an accountant! Every number was in the right place, every bill was paid on time and every day was the same. Perfect! In August he took long, quiet holidays by the lake. Spring was busy, with long evenings at the office, but Mr Grey didn’t complain: he loved order, and now his whole life was in order. Thank you, {friend}!',
      engineer: 'So Mr Grey became an engineer! He designed bridges with a ruler, a pencil and a lot of patience. His bridges were safe, strong and never, ever surprising, and the salary was very good. Thank you, {friend}!',
    },
    'Kim': {
      inventor: 'So Kim became an inventor! Her flat turned into a real laboratory. Many inventions didn’t work (the flying umbrella was a disaster), but one day her new machine worked at last, and it was on TV the next morning. Kim never got bored again: every day brought a new problem and a new idea. Thank you, {friend}!',
      designer: 'So Kim became a game designer! She created new worlds with dragons, robots and pancake castles, and she worked with a team of crazy artists just like her. When millions of kids played her game, Kim laughed out loud. Deadlines were hard, but boring? Never. Thank you, {friend}!',
      programmer: 'So Kim became a programmer! She created apps and games, she learnt new programming languages just for fun, and she worked from her flat, between the pancake robot and the singing lamp. Thank you, {friend}!',
    },
    'Sam': {
      schoolnurse: 'So Sam became a school nurse, at his own children’s school! He helped kids with headaches, scraped knees and broken hearts, and one day he helped a child in a real emergency. Everybody called him a hero. And at three o’clock he walked home with his three children. The money wasn’t great, but for Sam it was perfect. Thank you, {friend}!',
      pharmacist: 'So Sam became a pharmacist! His pharmacy was just around the corner from his house, so he had lunch with his family every day. People came in worried and went out smiling, because Sam always listened and gave good advice. They still called him “Super Sam”. Thank you, {friend}!',
      teacher: 'So Sam became a teacher! He helped children learn every day, he finished early and he spent long summer holidays with his own kids. Some weekends he corrected homework, but his children helped him, with a red pen and a lot of jokes. Thank you, {friend}!',
    },
    'Lily': {
      zookeeper: 'So Lily became a zookeeper! She fed the lions, she built toys for the monkeys and she taught school groups about penguins. Then one spring morning a baby giraffe was born, and Lily was the first person it saw. She cleaned a lot of poo and she worked at weekends, but Lily was the happiest person in the zoo. Thank you, {friend}!',
      dogtrainer: 'So Lily became a dog trainer! Every morning she walked in the park with a happy crowd of dogs, big and small. She invented games, she helped families with naughty puppies, and one day her dog won a big competition. Bob the snake was a bit jealous, but Lily was finally at home. Thank you, {friend}!',
      vet: 'So Lily became a vet! She helped sick animals every day, from tiny hamsters to enormous horses. One night she saved a dog’s life, and the dog’s family cried and hugged her. Lily went home tired, and two dogs, a cat, a parrot and a snake were waiting for her at the door. Thank you, {friend}!',
    },
    'Max': {
      partyplanner: 'So Max became a party planner! He organised birthday parties, weddings and a crazy party on a beach in Spain. He worked with a big, fun team, and between one party and the next he had long, lazy breaks. Saturday nights were always busy, but for Max a Saturday night at a party was never work. Thank you, {friend}!',
      tourguide: 'So Max became a tour guide! Every day he met new people from all over the world, and he showed them beautiful cities with funny stories that made everybody laugh. His groups loved him and gave him good tips. In summer he walked twenty kilometres a day; in winter he did nothing at all. Perfect! Thank you, {friend}!',
      pilot: 'So Max became a pilot! He flew all over the world with a friendly crew, and between flights he had lots of days off. He sent a postcard from every city to all his friends, and he had a lot of friends. Thank you, {friend}!',
    },
  };
  // The reasons and the bad sides told in the story: past simple, third person ({s} she/he, {o} her/him, {p} her/his).
  // A dream has two forms: [it came true, what the character hoped] ("She hoped to…, but it never happened").
  const PAST = {
    // doctor
    'You help sick people every day.': '{s} helped sick people every day.',
    'You save a life!': '{s} saved a life!',
    'It makes good money.': 'it made good money.',
    'It is a safe job: hospitals always need doctors.': 'it was a safe job, because hospitals always need doctors.',
    'You work in a big team.': '{s} worked in a big team.',
    'You could discover a new cure and become famous.': ['{s} discovered a new cure and became famous!', 'to discover a new cure and become famous'],
    // teacher
    'It has long summer holidays.': 'there were long summer holidays.',
    'You help children learn every day.': '{s} helped children learn every day.',
    'You prepare a really creative lesson.': '{s} prepared some really creative lessons.',
    'It is a safe, steady job.': 'it was a safe, steady job.',
    'You finish early and see your family in the afternoon.': '{s} finished early and saw {p} family in the afternoon.',
    'One of your students becomes famous and thanks you on TV.': ['one of {p} students became famous and thanked {o} on TV!', 'that one of {p} students would become famous and thank {o} on TV'],
    // YouTuber
    'You can become really famous.': ['{s} became really famous!', 'to become really famous'],
    'You are creative every day.': '{s} was creative every day.',
    'You choose your own hours.': '{s} chose {p} own hours.',
    'You make videos all over the world.': '{s} made videos all over the world.',
    'A big sponsor can pay you a fortune.': ['a big sponsor paid {o} a fortune!', 'that a big sponsor would pay {o} a fortune'],
    'You make friends with other creators.': '{s} made friends with other creators.',
    // footballer
    'You can become world famous.': ['{s} became world famous!', 'to become world famous'],
    'If you play for a big team, you make millions.': ['{s} played for a big team and made millions!', 'to play for a big team and make millions'],
    'You play in a team every day.': '{s} played in a team every day.',
    'You travel to play matches.': '{s} travelled to play matches.',
    'You train hard and get better and better.': '{s} trained hard and got better and better.',
    'You score the winning goal in the final!': '{s} scored the winning goal in the final!',
    // chef
    'You invent new dishes.': '{s} invented new dishes.',
    'You work with a happy team in the kitchen.': '{s} worked with a happy team in the kitchen.',
    'You can become a famous chef on TV.': ['{s} became a famous chef on TV!', 'to become a famous chef on TV'],
    'You can work in any country in the world.': '{s} could work in any country in the world.',
    'Customers love your food.': 'customers loved {p} food.',
    'Your restaurant is full every night: good money!': '{p} restaurant was full every night, and that meant good money!',
    // vet
    'You work with animals every day.': '{s} worked with animals every day.',
    'You help animals get better.': '{s} helped animals get better.',
    'You save a dog’s life!': '{s} saved a dog’s life!',
    'You visit farms in the countryside.': '{s} visited farms in the countryside.',
    'You work with a small, friendly team.': '{s} worked with a small, friendly team.',
    // engineer
    'It makes a lot of money.': 'it made a lot of money.',
    'It is a safe job: everybody needs engineers.': 'it was a safe job, because everybody needs engineers.',
    'You design bridges and machines.': '{s} designed bridges and machines.',
    'You take a course and learn new skills.': '{s} took a course and learnt new skills.',
    'You travel to building sites around the world.': '{s} travelled to building sites around the world.',
    'Your invention changes the world and you become famous.': ['{p} invention changed the world and {s} became famous!', 'that {p} invention would change the world'],
    // astronaut
    'You go to space!': '{s} went to space!',
    'Everybody knows your name.': 'everybody knew {p} name.',
    'You see the whole Earth from space.': '{s} saw the whole Earth from space.',
    'You work in a small, amazing team.': '{s} worked in a small, amazing team.',
    'You train for every possible problem.': '{s} trained for every possible problem.',
    'You could be the first person on Mars.': ['{s} was the first person on Mars!', 'to be the first person on Mars'],
    // farmer
    'You work outdoors in nature every day.': '{s} worked outdoors in nature every day.',
    'You work with your family.': '{s} worked with {p} family.',
    'You grow food for everybody.': '{s} grew food for everybody.',
    'You save money for the winter.': '{s} saved money for the winter.',
    'A perfect harvest brings good money!': 'a perfect harvest brought good money!',
    'Your cheese wins a prize at the fair.': '{p} cheese won a prize at the fair.',
    // firefighter
    'You save people from a fire!': '{s} saved people from a fire!',
    'You help your town every day.': '{s} helped {p} town every day.',
    'Your team is like a family.': '{p} team was like a family.',
    'You train with your team, ready for anything.': '{s} trained with {p} team, ready for anything.',
    'After long shifts you have many days off.': 'after long shifts, {s} had many days off.',
    'You are a hero in the newspaper.': '{s} was a hero in the newspaper.',
    // artist
    'You create beautiful things every day.': '{s} created beautiful things every day.',
    'You choose when to work.': '{s} chose when to work.',
    'You can paint outdoors.': '{s} painted outdoors.',
    'You show your paintings around the world.': '{s} showed {p} paintings around the world.',
    'One painting can sell for a million.': ['one of {p} paintings sold for a million!', 'to sell a painting for a million'],
    'You can become a famous artist.': ['{s} became a famous artist!', 'to become a famous artist'],
    // pilot
    'You travel all over the world.': '{s} travelled all over the world.',
    'It has many days off between flights.': 'there were many days off between flights.',
    'You fly over mountains and seas.': '{s} flew over mountains and seas.',
    'You follow a checklist, so nothing goes wrong.': '{s} followed a checklist, so nothing went wrong.',
    'You land safely in a storm and 200 passengers clap!': '{s} landed safely in a storm, and 200 passengers clapped!',
    // actor
    'You can become a movie star.': ['{s} became a movie star!', 'to become a movie star'],
    'You can be anybody: a pirate, a king, a robot…': '{s} could be anybody: a pirate, a king, a robot…',
    'You work with a fun team.': '{s} worked with a fun team.',
    'You film in amazing places.': '{s} filmed in amazing places.',
    'A big film can make you rich.': ['a big film made {o} rich!', 'that a big film would make {o} rich'],
    'People laugh and cry with you.': 'people laughed and cried with {o}.',
    // programmer
    'You can work from home, near your family.': '{s} worked from home, near {p} family.',
    'It is a safe job: everybody needs programmers.': 'it was a safe job, because everybody needs programmers.',
    'You create apps and games.': '{s} created apps and games.',
    'You learn a new programming language.': '{s} learnt a new programming language.',
    'Your app becomes famous all over the world.': ['{p} app became famous all over the world!', 'that {p} app would become famous all over the world'],
    // ice-cream taster
    'You invent crazy new flavours.': '{s} invented crazy new flavours.',
    'You eat ice cream at work!': '{s} ate ice cream at work!',
    'People smile when they taste your ice cream.': 'people smiled when they tasted {p} ice cream.',
    'Your tongue is insured for a million dollars!': '{p} tongue was insured for a million dollars!',
    'Your new flavour becomes famous all over the world.': ['{p} new flavour became famous all over the world!', 'that {p} new flavour would become famous all over the world'],
    // storm chaser
    'You chase tornadoes across the country.': '{s} chased tornadoes across the country.',
    'You see the wildest nature on Earth.': '{s} saw the wildest nature on Earth.',
    'Your data helps to warn people about storms.': '{p} data helped to warn people about storms.',
    'You work with a brave team.': '{s} worked with a brave team.',
    'You check the radar again and again, so you are ready.': '{s} checked the radar again and again, so {s} was always ready.',
    'You film the perfect tornado and your video goes viral.': ['{s} filmed the perfect tornado and {p} video went viral!', 'to film the perfect tornado'],
    // video game tester
    'You play new games before everybody else.': '{s} played new games before everybody else.',
    'You find a big bug and save the game!': '{s} found a big bug and saved the game!',
    'You give ideas to make the game better.': '{s} gave ideas to make the game better.',
    'You work with other gamers.': '{s} worked with other gamers.',
    'You can work from home.': '{s} worked from home.',
    'Your name is in the credits of a famous game.': ['{p} name was in the credits of a famous game!', 'to see {p} name in the credits of a famous game'],
    // panda keeper
    'You play with baby pandas every day.': '{s} played with baby pandas every day.',
    'You help to save an animal in danger.': '{s} helped to save an animal in danger.',
    'A baby panda is born!': 'a baby panda was born!',
    'You live in the mountains of China.': '{s} lived in the mountains of China.',
    'You work in a team of animal experts.': '{s} worked in a team of animal experts.',
    'Your panda video is seen all over the world.': ['{p} panda video was seen all over the world!', 'that {p} panda video would go viral'],
    // stunt performer
    'You jump, fall and fight in films.': '{s} jumped, fell and fought in films.',
    'You crash a car in a big film!': '{s} crashed a car in a big film!',
    'You work with a great team.': '{s} worked with a great team.',
    'You train hard and you are ready for anything.': '{s} trained hard, and {s} was ready for anything.',
    'You meet famous actors.': '{s} met famous actors.',
    // bed tester
    'You get paid to sleep!': '{s} got paid to sleep!',
    'You sleep a week in a palace hotel!': '{s} slept for a week in a palace hotel!',
    'You help people sleep better.': '{s} helped people sleep better.',
    'You can work near your family.': '{s} worked near {p} family.',
    'A long nap makes you ready for anything.': 'a long nap made {o} ready for anything.',
    'Your sleep blog becomes famous.': ['{p} sleep blog became famous!', 'that {p} sleep blog would become famous'],
    // gardener
    'You work outdoors among flowers every day.': '{s} worked outdoors among flowers every day.',
    'You grow vegetables for the whole family.': '{s} grew vegetables for the whole family.',
    'Your garden makes people happy.': '{p} garden made people happy.',
    'You work in a small, friendly team.': '{s} worked in a small, friendly team.',
    'Your roses win first prize at the flower show!': '{p} roses won first prize at the flower show!',
    'You finish early and see your grandchildren.': '{s} finished early and saw {p} grandchildren.',
    // childminder
    'You look after little children every day.': '{s} looked after little children every day.',
    'You help busy parents.': '{s} helped busy parents.',
    'You take the children to the park.': '{s} took the children to the park.',
    'A child gives you a drawing: “I love you!”': 'a child gave {o} a drawing that said “I love you!”',
    'You meet other childminders at the playground.': '{s} met other childminders at the playground.',
    'You read stories and help them grow.': '{s} read stories to the children and helped them grow.',
    // pop star
    'You sing in front of 50,000 fans!': '{s} sang in front of 50,000 fans!',
    'You write new songs.': '{s} wrote new songs.',
    'You go on a world tour.': '{s} went on a world tour.',
    'Your song is number 1!': '{p} song was number 1!',
    'You can sell millions of albums.': ['{s} sold millions of albums!', 'to sell millions of albums'],
    'Fans scream your name everywhere.': 'fans screamed {p} name everywhere.',
    // TV presenter
    'Everybody knows your face.': 'everybody knew {p} face.',
    'You invent new shows.': '{s} invented new shows.',
    'You film in different countries.': '{s} filmed in different countries.',
    'You interview a famous star!': '{s} interviewed a famous star!',
    'Your show can win a big prize.': ['{p} show won a big prize!', 'that {p} show would win a big prize'],
    // mountain guide
    'You climb mountains every day.': '{s} climbed mountains every day.',
    'You take groups on adventures.': '{s} took groups on adventures.',
    'You reach the top of a famous mountain!': '{s} reached the top of a famous mountain!',
    'You see eagles and wild goats.': '{s} saw eagles and wild goats.',
    'You have long winters off.': '{s} had long winters off.',
    // marine biologist
    'You dive in the ocean every day.': '{s} dived in the ocean every day.',
    'You study dolphins and whales.': '{s} studied dolphins and whales.',
    'You sail around the world.': '{s} sailed around the world.',
    'You work on a ship with a great team.': '{s} worked on a ship with a great team.',
    'You help to protect the sea.': '{s} helped to protect the sea.',
    'You can discover a new kind of fish.': ['{s} discovered a new kind of fish!', 'to discover a new kind of fish'],
    // bank manager
    'It is a very safe job.': 'it was a very safe job.',
    'You get a big bonus at Christmas!': '{s} got a big bonus at Christmas!',
    'You have a quiet office.': '{s} had a quiet office.',
    'You finish at 5 p.m. every day.': '{s} finished at 5 p.m. every day.',
    'You manage a team.': '{s} managed a team.',
    // accountant
    'You count money all day.': '{s} counted money all day.',
    'Everything is in perfect order.': 'everything was in perfect order.',
    'You work from home on Fridays.': '{s} worked from home on Fridays.',
    'You have long holidays in August.': '{s} had long holidays in August.',
    // inventor
    'You invent something new every day.': '{s} invented something new every day.',
    'Your invention works at last!': '{p} invention worked at last!',
    'Your invention is on TV.': '{p} invention was on TV.',
    'You present your ideas around the world.': '{s} presented {p} ideas around the world.',
    'Your invention can make you a millionaire.': ['{p} invention made {o} a millionaire!', 'that {p} invention would make {o} a millionaire'],
    // game designer
    'You create new worlds.': '{s} created new worlds.',
    'You work with a team of artists.': '{s} worked with a team of artists.',
    'You have a crazy new idea!': '{s} had a crazy new idea!',
    'You can work from anywhere in the world.': '{s} worked from different places around the world.',
    'You have flexible hours.': '{s} had flexible hours.',
    'Millions of people can play your game.': ['millions of people played {p} game!', 'that millions of people would play {p} game'],
    // school nurse
    'You work at your children’s school.': '{s} worked at {p} children’s school.',
    'You help children who feel ill.': '{s} helped children who felt ill.',
    'You have the school holidays off.': '{s} had the school holidays off.',
    'You help a child in an emergency!': '{s} helped a child in an emergency!',
    'You finish at 3 p.m.': '{s} finished at 3 p.m.',
    // pharmacist
    'You help people every day.': '{s} helped people every day.',
    'Your pharmacy is near your home.': '{p} pharmacy was near {p} home.',
    'Your advice saves a life!': '{p} advice saved a life!',
    'You learn about new medicines.': '{s} learnt about new medicines.',
    // zookeeper
    'You feed lions, giraffes and penguins.': '{s} fed lions, giraffes and penguins.',
    'You help animals in danger.': '{s} helped animals in danger.',
    'A baby giraffe is born!': 'a baby giraffe was born!',
    'You teach children about animals.': '{s} taught children about animals.',
    'You build fun toys for the monkeys.': '{s} built fun toys for the monkeys.',
    'You work outdoors all day.': '{s} worked outdoors all day.',
    // dog trainer
    'You play with dogs every day.': '{s} played with dogs every day.',
    'You help families with their dogs.': '{s} helped families with their dogs.',
    'You invent fun games for dogs.': '{s} invented fun games for dogs.',
    'Your dog wins a big competition!': '{p} dog won a big competition!',
    'You go for long walks in the park.': '{s} went for long walks in the park.',
    // party planner
    'You organise parties every weekend.': '{s} organised parties every weekend.',
    'You work with a big, fun team.': '{s} worked with a big, fun team.',
    'You have long breaks between parties.': '{s} had long breaks between parties.',
    'You plan a party on a beach in Spain.': '{s} planned a party on a beach in Spain.',
    'A VIP party: a big tip!': '{s} organised a VIP party and got a big tip!',
    'It’s the best party of the year!': '{s} organised the best party of the year!',
    // tour guide
    'You meet new people every day.': '{s} met new people every day.',
    'You travel to beautiful cities.': '{s} travelled to beautiful cities.',
    'Winter is free: long holidays!': 'winter was free: long holidays!',
    'You tell funny stories.': '{s} told funny stories.',
    'Tourists give you good tips.': 'tourists gave {o} good tips.',
    'Your group loves you.': '{p} groups loved {o}.',

    // the bad sides
    'Night shifts: you miss dinner with your family.': 'because of the night shifts, {s} missed dinner with {p} family.',
    'Long hours: almost no free time.': 'the hours were long, and {s} had almost no free time.',
    'It makes medium money, not a lot.': 'it made medium money, not a lot.',
    'You correct homework at the weekend.': '{s} corrected homework at the weekend.',
    'It is not a safe job: some months you make no money.': 'it wasn’t a safe job: some months {s} made no money.',
    'Mean comments online make you sad.': 'mean comments online made {o} sad.',
    'An injury: you can’t play for months.': 'after an injury, {s} couldn’t play for months.',
    'Matches every weekend, far from your family.': 'there were matches every weekend, far from {p} family.',
    'You work in the evenings and at weekends.': '{s} worked in the evenings and at weekends.',
    'A hot, busy kitchen: no time to rest.': 'the kitchen was hot and busy, and there was no time to rest.',
    'Emergency calls at night.': 'there were emergency calls at night.',
    'Some days are sad: you can’t save every animal.': 'some days were sad, because {s} couldn’t save every animal.',
    'Long hours in the office.': '{s} spent long hours in the office.',
    'You sit at a desk, far from nature.': '{s} sat at a desk, far from nature.',
    'Months away from your family.': '{s} spent months away from {p} family.',
    'Years of training: no free time.': 'there were years of training and no free time.',
    'Bad weather ruins the harvest.': 'bad weather ruined the harvest.',
    'You work every day, even on Sunday.': '{s} worked every day, even on Sunday.',
    'It is a dangerous job.': 'it was a dangerous job.',
    'Night shifts: you miss family dinners.': 'because of the night shifts, {s} missed family dinners.',
    'It is not a safe job.': 'it wasn’t a safe job.',
    'Some months you sell nothing.': 'some months {s} sold nothing.',
    'Nights in hotels, far from your family.': '{s} spent many nights in hotels, far from {p} family.',
    'Jet lag: you are always tired.': 'because of jet lag, {s} was always tired.',
    'It is not a safe job: many months without work.': 'it wasn’t a safe job: there were many months without work.',
    'Long days on set, far from home.': 'there were long days on set, far from home.',
    'You sit in front of a screen all day.': '{s} sat in front of a screen all day.',
    'Deadlines! You work late at night.': 'there were deadlines, and {s} worked late at night.',
    'No spicy food, no hot drinks: you must protect your tongue.': '{s} couldn’t have spicy food or hot drinks, because {s} had to protect {p} tongue.',
    'It is a rare job: there are very few in the world.': 'it was a rare job, with very few in the world.',
    'It can be dangerous!': 'it was dangerous!',
    'Weeks on the road, far from your family.': '{s} spent weeks on the road, far from {p} family.',
    'You play the same level a hundred times.': '{s} played the same level a hundred times.',
    'You clean a lot of panda poo, every day.': '{s} cleaned a lot of panda poo, every day.',
    'You live far away from your family.': '{s} lived far away from {p} family.',
    'You can get hurt.': '{s} got hurt.',
    'Nobody knows your name: the actor gets the glory.': 'nobody knew {p} name: the actors got the glory.',
    'It makes little money.': 'it made little money.',
    'Some beds are hard and noisy: you can’t sleep!': 'some beds were hard and noisy, and {s} couldn’t sleep!',
    'Rain, rain, rain: a cold, wet day.': 'it rained and rained, and the days were cold and wet.',
    'Children are noisy: you are always tired.': 'the children were noisy, and {s} was always tired.',
    'Photographers follow you everywhere.': 'photographers followed {o} everywhere.',
    'Concerts every night: no free time.': 'there were concerts every night and no free time.',
    'If people don’t watch your show, it closes.': '{s} was always afraid that people wouldn’t watch {p} show.',
    'You get up at 4 a.m. for the morning show.': '{s} got up at 4 a.m. for the morning show.',
    'It can be dangerous.': 'it was dangerous.',
    'Bad weather: you can’t go out.': 'in bad weather, {s} couldn’t go out.',
    'Months on a ship, far from home.': '{s} spent months on a ship, far from home.',
    'It doesn’t make much money.': 'it didn’t make much money.',
    'Meetings, meetings, meetings.': 'there were meetings, meetings, meetings.',
    'It isn’t very creative.': 'it wasn’t very creative.',
    'In spring you work every evening.': 'in spring {s} worked every evening.',
    'Numbers, numbers… and nothing else.': 'it was numbers, numbers… and nothing else.',
    'Many inventions don’t work.': 'many inventions didn’t work.',
    'You work alone in your lab.': '{s} worked alone in {p} lab.',
    'Some players are very angry with you.': 'some players were very angry with {o}.',
    'Lots of forms to fill in.': 'there were lots of forms to fill in.',
    'You work some Saturdays.': '{s} worked some Saturdays.',
    'You stand up all day.': '{s} stood up all day.',
    'You clean a lot of animal poo.': '{s} cleaned a lot of animal poo.',
    'Weekends and holidays at the zoo.': '{s} spent weekends and holidays at the zoo.',
    'You work every Saturday night.': '{s} worked every Saturday night.',
    'Some months there are no parties.': 'some months there were no parties.',
    'You walk 20 km a day.': '{s} walked 20 km a day.',
    'You are far from your family all summer.': '{s} was far from {p} family all summer.',
  };

  // the past simple forms that can be in a story, for the exercise on [jobs-story:R] (past → base form)
  const PAST_VERBS = {
    ate: 'eat', became: 'become', brought: 'bring', built: 'build', chose: 'choose', could: 'can', did: 'do', dived: 'dive',
    fed: 'feed', fell: 'fall', flew: 'fly', fought: 'fight', found: 'find', gave: 'give', got: 'get', grew: 'grow', had: 'have',
    knew: 'know', learnt: 'learn', made: 'make', meant: 'mean', met: 'meet', paid: 'pay', ran: 'run', sang: 'sing', sat: 'sit',
    saw: 'see', said: 'say', slept: 'sleep', sold: 'sell', spent: 'spend', stood: 'stand', taught: 'teach', thought: 'think',
    told: 'tell', took: 'take', went: 'go', was: 'be', were: 'be', won: 'win', wrote: 'write', read: 'read',
    tried: 'try', decided: 'decide', studied: 'study', helped: 'help', worked: 'work', loved: 'love', liked: 'like', saved: 'save',
    played: 'play', travelled: 'travel', invented: 'invent', created: 'create', finished: 'finish', hoped: 'hope', happened: 'happen',
    visited: 'visit', designed: 'design', climbed: 'climb', organised: 'organise', reached: 'reach', missed: 'miss', walked: 'walk',
  };


  /* ================= the race (no screen here) ================= */

  const mult = (p, v) => MULT[p.hearts[v] || 0];

  function makePlayer({ name, avatar, hearts, job, picks, bot = false }) {
    const j = JOB[job];
    return {
      name, avatar, hearts, job, bot, joy: 0, turns: 0, double: false, shield: false,
      cards: picks.map(i => ({ ...j.reasons[i], left: j.reasons[i].uses, chance: DREAM.start, got: 0 })),
      basic: { ...ORDINARY, left: Infinity, got: 0 },
    };
  }

  // one turn: play a card, then maybe a bad day. Returns what happened, for the screen
  // A dream spins the wheel of fortune: `spin` (0–1) is where it stops, the coloured slice is 0 → chance.
  // `mid` is the happiness after the reason and before a bad day (the screen shows the two steps)
  function play(p, card) {
    const out = { card, gain: 0, dream: null, doubled: false, bad: null, mid: 0 };
    if (card.uses !== Infinity) card.left--;
    if (card.arch === 'dream') {
      const spin = Math.random();
      const win = spin < card.chance;
      out.dream = { win, chance: card.chance, spin };
      if (win) { out.gain = Math.round(DREAM.jackpot * mult(p, card.v)); card.chance = DREAM.start; }
      else { out.gain = -Math.round(DREAM.miss * mult(p, card.v)); card.chance = Math.min(DREAM.max, card.chance + DREAM.step); }
    } else if (card.arch === 'basic') out.gain = card.gain;
    else out.gain = Math.round(ARCH[card.arch].gain * mult(p, card.v));
    if (out.gain > 0 && p.double && card.arch !== 'grow') { out.gain *= 2; out.doubled = true; p.double = false; }
    if (card.arch === 'grow') p.double = true;
    if (card.arch === 'calm') p.shield = true;
    p.joy = Math.max(0, p.joy + out.gain);
    out.mid = p.joy;
    card.got += out.gain;
    p.turns++;
    if (p.joy < GOAL && Math.random() < BAD_CHANCE) {
      const b = JOB[p.job].bad[Math.floor(Math.random() * 2)];
      if (p.shield) { p.shield = false; out.bad = { ...b, loss: 0, blocked: true }; }
      else {
        const loss = Math.round(BAD * mult(p, b.v));
        p.joy = Math.max(0, p.joy - loss);
        out.bad = { ...b, loss };
      }
    }
    return out;
  }

  // how much a card is worth on average for this player (the computer players use it)
  function worth(p, c) {
    if (c.arch === 'basic') return c.gain;
    const m = mult(p, c.v);
    if (c.arch === 'dream') return (c.chance * DREAM.jackpot - (1 - c.chance) * DREAM.miss) * m;
    const a = ARCH[c.arch];
    return a.gain * m + (c.arch === 'grow' ? 7 : c.arch === 'calm' ? 2 : 0);
  }
  const playable = p => [...p.cards.filter(c => c.left > 0), p.basic];

  function botPick(p) {
    const list = playable(p);
    // save the "once only" moments for a doubled turn, keep the rest roughly in order of value
    const score = c => worth(p, c) * (p.double && c.arch !== 'grow' ? 2 : 1) * (.8 + Math.random() * .4);
    return list.reduce((best, c) => (score(c) > score(best) ? c : best), list[0]);
  }

  // the job that fits these hearts best (not one of the `taken` ones) and its 4 best reasons
  function choose(hearts, taken = [], list = JOBS) {
    const tmp = { hearts };
    const rank = j => j.reasons.map((r, k) => ({ k, w: worth(tmp, { ...r, chance: DREAM.start }) * (r.uses === Infinity ? 4 : r.uses) }))
      .sort((a, b) => b.w - a.w).slice(0, 4);
    const fit = j => rank(j).reduce((t, x) => t + x.w, 0) - j.bad.reduce((t, b) => t + BAD * mult(tmp, b.v), 0) * 2 + Math.random() * 12;
    const free = list.filter(j => !taken.includes(j.k));
    const job = free.reduce((best, j) => (fit(j) > fit(best) ? j : best), free[0]);
    return { job: job.k, picks: rank(job).map(x => x.k) };
  }

  // the jobs of a Make Them Happy! game: all the jobs, with the character's own jobs at random places
  function jobListFor(c) {
    const list = JOBS.slice();
    (c.jobs || []).forEach(k => list.splice(Math.floor(Math.random() * (list.length + 1)), 0, JOB[k]));
    return list;
  }

  // a computer player for the race: random hearts, then the job that fits them best
  function makeBot(i) {
    const hearts = {};
    let left = HEARTS;
    while (left > 0) {
      const v = VALUES[Math.floor(Math.random() * VALUES.length)].k;
      if ((hearts[v] || 0) < MAX_H) { hearts[v] = (hearts[v] || 0) + 1; left--; }
    }
    return makePlayer({ ...BOTS[i], hearts, ...choose(hearts), bot: true });
  }

  const api = { GOAL, HEARTS, VALUES, ARCH, JOBS, EXTRA, CLIENTS, ROUNDS, makePlayer, makeBot, choose, jobListFor, play, botPick, worth };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof document === 'undefined') return;

  /* ================= the pop-up ================= */

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const an = w => (/^[aeiou]/i.test(w) ? 'an' : 'a');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const lower = t => t.charAt(0).toLowerCase() + t.slice(1).replace(/[.!]+$/, '');

  const overlay = document.createElement('div');
  overlay.className = 'jr-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Happy Job Race');
  overlay.innerHTML = '<div class="jr-box"><button type="button" class="jr-close" aria-label="Close">✕</button><div class="jr-screen"></div></div>';
  document.body.append(overlay);
  const screen = overlay.querySelector('.jr-screen');
  const $ = sel => screen.querySelector(sel);
  let lastFocus = null;

  let humans = 1;           // how many people play (1 = against the computer)
  let maker = 0;            // which player is making their card now
  let made = [];            // the setups made so far: { name, avatar, hearts, job, picks }
  let draft = null;         // the setup being made
  let race = null;          // { kind: 'race' | 'match', players, turn, round, busy, over, token, log }
  let game = 'race';        // which game: 'race' (Happy Job Race) or 'match' (Make Them Happy!)
  let crew = [];            // Make Them Happy!: the players { name, avatar, bot } (+ job, picks once chosen)
  let order = [];           // the crew in the order drawn
  let pickAt = 0;           // whose turn it is to choose a job
  let client = null;        // the character of this game (CLIENTS)
  let jobList = [];         // the jobs of this game: all of them + the character's own jobs (jobListFor)
  let net = null;           // online: { code, me, unsub, room, gid, intro, seen, shownPick, chain }
  let flow = 0;             // changes when the pop-up closes or goes back to a menu: the waiting steps stop

  function open(g) {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    game = g === 'match' ? 'match' : 'race'; // (when it opens after a spreadchange, g is the event)
    if (game === 'match') matchModes(); else modes();
    overlay.querySelector('.jr-close').focus();
  }
  function close() {
    if (race) race.token = null;
    flow++;
    netLeave();
    overlay.hidden = true;
    lastFocus?.focus();
  }

  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };

  const heartsLeft = () => HEARTS - Object.values(draft.hearts).reduce((t, n) => t + n, 0);
  const heartRow = n => '❤️'.repeat(n) || '<i class="jr-zero">–</i>';

  // the hearts of 9.17 in the book ([jobs-career:L]): each value is an .opt with the buttons 1 2 3 4
  function bookHearts() {
    const hearts = {};
    let total = 0;
    VALUES.forEach(v => {
      const n = +(document.querySelector(`#jb917-${v.k} button.on`)?.textContent || 0);
      if (n) { hearts[v.k] = n; total += n; }
    });
    return { hearts, total };
  }

  // the job written on [jobs-pros:R], question 1 ("What job would you like…?"), if it is one of ours
  function dreamJob() {
    const t = (document.getElementById('jb912-0')?.value || '').toLowerCase();
    return JOBS.find(j => t.includes(j.name.toLowerCase()))?.k || '';
  }

  /* ---- 0. how many players ---- */
  function modes() {
    if (race) race.token = null;
    race = null; made = []; maker = 0; game = 'race'; flow++;
    netLeave();
    screen.innerHTML = `
      <h2 class="jr-title">Happy Job Race</h2>
      <p class="jr-sub">Choose a job, play your reasons and be the first to reach <b>${GOAL} happiness</b>!</p>
      <div class="jr-modes">
        <button type="button" class="jr-mode" data-act="mode" data-n="1"><i>🧒 🏁 🤖🤖</i><b>Me vs the computer</b><span>1 player. You race against two robots.</span></button>
        <button type="button" class="jr-mode" data-act="mode" data-n="2"><i>🧒 🏁 👧</i><b>Friends on one computer</b><span>2 players (or 2 teams!). Take turns at the keyboard.</span></button>
      </div>
      <div class="jr-how">
        <b>How to play</b>
        <ol>
          <li>Make your <b>Me card</b>: give your ${HEARTS} ❤️ to the things that matter to you in a job.</li>
          <li>Choose a <b>job</b> and <b>4 reasons</b> why you want it.</li>
          <li>In the race, play <b>one reason</b> each turn. The more ❤️ you gave to it, the happier you get!</li>
          <li><b>Dreams</b> 🎲 like fame are a gamble: they rarely come true… but when they do, WOW!</li>
          <li>Careful: every job has a <b>bad side</b> 😬 too.</li>
        </ol>
      </div>`;
  }

  /* ---- 1. the Me card: name, picture, hearts ---- */
  function meCard() {
    const p = humans > 1 ? `Player ${maker + 1}` : 'Your';
    screen.innerHTML = `
      <h2 class="jr-title">${humans > 1 ? `${p}: your Me card` : 'Your Me card'}</h2>
      <p class="jr-sub">${draft.fromBook ? `These are your hearts from exercise 9.17! You can still change them.` : `What makes you happy in a job? Give your <b>${HEARTS} hearts</b> (up to ${MAX_H} for one thing).`}</p>
      <label class="jr-name">My name <input type="text" maxlength="18" autocomplete="off" value="${esc(draft.name)}" placeholder="e.g. Maya"></label>
      <div class="jr-avs">${AVATARS.map(a => `<button type="button" class="jr-av${a === draft.avatar ? ' on' : ''}" data-act="avatar" data-a="${a}" aria-label="Picture ${a}">${a}</button>`).join('')}</div>
      <div class="jr-values">${VALUES.map(v => `
        <div class="jr-val" data-v="${v.k}">
          <span class="jr-vname"><i>${v.icon}</i>${v.name}</span>
          <span class="jr-hearts">${Array.from({ length: MAX_H }, (_, i) => `<button type="button" data-act="heart" data-v="${v.k}" data-n="${i + 1}" aria-label="${v.name}: ${i + 1} heart${i ? 's' : ''}">♥</button>`).join('')}</span>
        </div>`).join('')}
      </div>
      <p class="jr-count" aria-live="polite"></p>
      <div class="jr-nav">
        ${maker === 0 ? '<button type="button" class="jr-btn" data-act="modes">◀ Back</button>' : ''}
        <button type="button" class="jr-btn go" data-act="jobs">Choose a job ▶</button>
      </div>`;
    paintHearts();
  }

  function paintHearts() {
    screen.querySelectorAll('.jr-val').forEach(row => {
      const n = draft.hearts[row.dataset.v] || 0;
      row.classList.toggle('on', n > 0);
      row.querySelectorAll('[data-act="heart"]').forEach(b => b.classList.toggle('on', +b.dataset.n <= n));
    });
    const left = heartsLeft();
    $('.jr-count').textContent = left > 0 ? `You have ${left} heart${left === 1 ? '' : 's'} left.` : 'All your hearts are on your Me card! Click a heart again to take it off.';
    $('[data-act="jobs"]').disabled = left > 0;
  }

  function setHeart(v, n) {
    const now = draft.hearts[v] || 0;
    const want = n === now ? n - 1 : n;  // click the last full heart to take it off
    const room = heartsLeft() + now;
    draft.hearts[v] = Math.min(want, room);
    paintHearts();
    if (want > room) $('.jr-count').textContent = 'No hearts left! Take one off from something else first.';
  }

  const readName = () => { const i = $('.jr-name input'); if (i) draft.name = i.value.trim().slice(0, 18); };

  /* ---- 2. choose a job ---- */
  const valueIcons = j => [...new Set(j.reasons.map(r => r.v))].map(v => `<i title="${VAL[v].name}">${VAL[v].icon}</i>`).join('');

  function jobs() {
    readName();
    const dream = maker === 0 ? dreamJob() : '';
    screen.innerHTML = `
      <h2 class="jr-title">Choose a job</h2>
      <p class="jr-sub">Look at your hearts: which job gives you what <b>you</b> care about?</p>
      <div class="jr-mine">${myHearts(draft.hearts)}</div>
      <div class="jr-jobs">${JOBS.map(j => `
        <button type="button" class="jr-job${j.k === draft.job ? ' on' : ''}" data-act="job" data-k="${j.k}">
          ${j.k === dream ? '<small class="jr-dream">your dream job!</small>' : j.odd ? '<small class="jr-dream odd">unusual!</small>' : ''}
          <span class="jr-jicon">${j.icon}</span><b>${an(j.name)} ${j.name}</b><span class="jr-jvals">${valueIcons(j)}</span>
        </button>`).join('')}
      </div>
      <div class="jr-nav">
        <button type="button" class="jr-btn" data-act="me">◀ Back</button>
      </div>`;
  }
  const myHearts = h => VALUES.filter(v => h[v.k]).map(v => `<span>${v.icon} ${v.name} <b>${'❤️'.repeat(h[v.k])}</b></span>`).join('');

  /* ---- 3. choose 4 reasons ---- */
  function reasons() {
    const j = JOB[draft.job];
    screen.innerHTML = `
      <h2 class="jr-title">${j.icon} Why ${an(j.name)} ${j.name}?</h2>
      <p class="jr-sub">Choose the <b>4 reasons</b> you will play ${game === 'match' ? `to make ${esc(client.name)} happy` : 'in the race'}. Read them carefully: how often? how strong? Nobody tells you, you decide!</p>
      <div class="jr-mine">${myHearts(draft.hearts)}</div>
      <div class="jr-rgrid">${j.reasons.map((r, i) => `
        <button type="button" class="jr-rcard" data-act="reason" data-i="${i}">
          <span class="jr-rval">${VAL[r.v].icon} ${VAL[r.v].name} ${heartRow(draft.hearts[r.v] || 0)}</span>
          <b>${esc(r.text)}</b>${r.arch === 'dream' ? '<span class="jr-tag">🎲 a dream</span>' : ''}
        </button>`).join('')}
      </div>
      <div class="jr-badbox"><b>😬 The bad side of this job</b>${j.bad.map(b => `<p>${VAL[b.v].icon} ${esc(b.text)} <span>${heartRow(draft.hearts[b.v] || 0)}</span></p>`).join('')}<small>A bad side hurts more when there are hearts on what it takes away.</small></div>
      <p class="jr-count" aria-live="polite"></p>
      <div class="jr-nav">
        <button type="button" class="jr-btn" data-act="jobs">◀ Another job</button>
        <button type="button" class="jr-btn go" data-act="ready">${game === 'match' ? 'Done! ▶' : maker + 1 < humans ? `Done! Next player ▶` : 'Start the race! 🏁'}</button>
      </div>`;
    paintReasons();
  }

  function paintReasons() {
    screen.querySelectorAll('.jr-rcard').forEach(b => b.classList.toggle('on', draft.picks.includes(+b.dataset.i)));
    const n = draft.picks.length;
    $('.jr-count').textContent = n < 4 ? `Choose ${4 - n} more reason${n === 3 ? '' : 's'}.` : 'Four reasons chosen! Click one to take it off.';
    $('[data-act="ready"]').disabled = n !== 4;
  }

  function toggleReason(i) {
    const at = draft.picks.indexOf(i);
    if (at >= 0) draft.picks.splice(at, 1);
    else if (draft.picks.length < 4) draft.picks.push(i);
    else { $('.jr-count').textContent = 'Only 4 reasons! Click one you chose to take it off.'; return; }
    paintReasons();
  }

  function newDraft() {
    const used = made.map(m => m.avatar);
    const free = AVATARS.filter(a => !used.includes(a));
    // the first player starts from the hearts of 9.17 in the book (if they are not more than 12)
    const book = maker === 0 ? bookHearts() : null;
    draft = { name: '', avatar: free[Math.floor(Math.random() * Math.min(free.length, 10))], hearts: book && book.total <= HEARTS ? book.hearts : {}, job: '', picks: [], fromBook: !!book && book.total > 0 && book.total <= HEARTS };
  }

  function done() {
    draft.name = draft.name || (humans > 1 ? `Player ${maker + 1}` : 'Me');
    made.push(draft);
    if (maker + 1 < humans) {
      maker++;
      newDraft();
      screen.innerHTML = `
        <div class="jr-pass">
          <div class="jr-big">🔄</div>
          <h2 class="jr-title">Player ${maker + 1}, your turn!</h2>
          <p>${esc(made[maker - 1].name)} is ready to be ${an(JOB[made[maker - 1].job].name)} ${JOB[made[maker - 1].job].name}. Now make your Me card.</p>
          <button type="button" class="jr-btn go" data-act="me">I am Player ${maker + 1} ▶</button>
        </div>`;
      return;
    }
    start();
  }

  /* ---- 4. the race ---- */
  function start() {
    const players = made.map(m => makePlayer(m));
    if (humans === 1) players.push(makeBot(0), makeBot(1));
    begin(players, 'race');
    const bots = players.filter(p => p.bot);
    say(bots.length ? `The race starts! ${bots.map(b => `${b.avatar} ${esc(b.name)} is ${an(JOB[b.job].name)} ${JOB[b.job].name}`).join(', ')}.` : 'The race starts! Who will be happy first?');
    next();
  }

  // the race screen, for both games
  function begin(players, kind) {
    race = { kind, players, turn: 0, round: 1, busy: false, over: false, token: {}, log: [] };
    screen.innerHTML = `
      <div class="jr-track"></div>
      <div class="jr-log" aria-live="polite"></div>
      <div class="jr-play"></div>
      <div class="jr-nav"><button type="button" class="jr-btn" data-act="quit">${kind === 'match' ? 'Stop the game' : 'Stop the race'}</button></div>`;
    paint();
  }

  function say(text, cls = '') {
    race.log.push({ text, cls });
    const box = $('.jr-log');
    if (box) box.innerHTML = race.log.slice(-4).map((l, i, all) => `<p class="${l.cls}${i === all.length - 1 ? ' last' : ''}">${l.text}</p>`).join('');
  }

  function paintTrack() {
    const match = race.kind === 'match';
    // Make Them Happy! has no finish line: the bars grow towards the best score so far
    const scale = match ? Math.max(60, ...race.players.map(p => p.joy)) * 1.1 : GOAL;
    $('.jr-track').innerHTML = (match ? `<p class="jr-round">${client.icon} <b>${esc(client.name)}</b> · turn <b>${Math.min(race.round, ROUNDS)}</b> of ${ROUNDS}</p>` : '') + race.players.map((p, i) => {
      const pct = Math.min(100, p.joy / scale * 100);
      const j = JOB[p.job];
      return `
        <div class="jr-lane${i === race.turn && !race.over ? ' now' : ''}" data-i="${i}">
          <span class="jr-who"><b>${esc(p.name)}</b><small>${j.icon} ${j.name}</small></span>
          <span class="jr-road"><span class="jr-fill" style="width:${pct}%"></span><span class="jr-runner" style="left:${pct}%">${p.avatar}</span><span class="jr-goal">${match ? client.icon : '🏁'}</span></span>
          <span class="jr-joy">${p.joy}<small>😊</small></span>
          <span class="jr-st">${p.double ? '<i title="Your next reason gives double">✖️2</i>' : ''}${p.shield ? '<i title="Your next bad day will not hurt">☂️</i>' : ''}</span>
        </div>`;
    }).join('');
  }

  const pips = c => c.uses === Infinity ? '<i class="jr-inf">always</i>'
    : Array.from({ length: c.uses }, (_, k) => `<i class="${k < c.left ? 'on' : ''}"></i>`).join('');

  function paintHand() {
    const p = race.players[race.turn];
    const box = $('.jr-play');
    if (race.over) { box.innerHTML = ''; return; }
    if (p.bot) { box.innerHTML = `<p class="jr-wait">${p.avatar} <b>${esc(p.name)}</b> is thinking…</p>`; return; }
    if (p.remote) { box.innerHTML = `<p class="jr-wait">⏳ ${p.avatar} <b>${esc(p.name)}</b> is choosing a reason on their device…</p>`; return; }
    const list = [...p.cards, p.basic];
    box.innerHTML = `
      <p class="jr-turn">${p.avatar} <b>${esc(p.name)}</b>, it’s your turn! ${race.kind === 'match' ? `Make ${esc(client.name)} happy: which reason do you play?` : 'Which reason do you play?'}</p>
      <div class="jr-hand">${list.map((c, i) => `
        <button type="button" class="jr-card${c.arch === 'dream' ? ' dream' : ''}" data-act="card" data-i="${i}" ${race.busy || c.left <= 0 ? 'disabled' : ''}>
          ${c.v ? `<span class="jr-rval">${VAL[c.v].icon} ${heartRow(p.hearts[c.v] || 0)}</span>` : '<span class="jr-rval">☕</span>'}
          <b>${esc(c.text)}</b>
          <span class="jr-hint">${esc(c.arch === 'basic' ? c.hint : ARCH[c.arch].hint)}</span>
          ${c.arch === 'dream' ? `<span class="jr-chance">🎲 chance: <b>${Math.round(c.chance * 100)}%</b></span>` : ''}
          <span class="jr-pips">${pips(c)}</span>
        </button>`).join('')}
      </div>`;
  }

  function paint() { paintTrack(); paintHand(); }

  function floatOn(i, text, cls) {
    const lane = $(`.jr-lane[data-i="${i}"] .jr-road`);
    if (!lane) return;
    const f = document.createElement('span');
    f.className = `jr-float ${cls}`;
    f.textContent = text;
    lane.append(f);
    setTimeout(() => f.remove(), 1400);
  }

  // whose turn: a computer player plays by itself
  async function next() {
    const g = race, tok = g.token;
    const p = g.players[g.turn];
    paint();
    if (!p.bot) return;
    g.busy = true;
    await wait(900); if (g.token !== tok) return;
    await turn(botPick(p));
  }

  // the wheel of fortune of a dream: the coloured slice is the chance; it wins only if it stops on the slice.
  // The wheel turns so that the point `spin` (0–1, clockwise from the top) ends under the arrow
  async function spinWheel(p, card, d) {
    const tok = race.token;
    const deg = d.chance * 360;
    $('.jr-play').innerHTML = `
      <div class="jr-wheelbox">
        <div class="jr-wheel-wrap">
          <span class="jr-pointer" aria-hidden="true"></span>
          <div class="jr-wheel" style="--win:${deg}deg"><span class="jr-wlabel" style="--a:${deg / 2}deg">${Math.round(d.chance * 100)}%</span></div>
          <span class="jr-hub">${VAL[card.v].icon}</span>
        </div>
        <p class="jr-roll"><b>${esc(p.name)}</b> spins the wheel: “${esc(card.text)}”<br><small>It must stop on the yellow slice!</small></p>
      </div>`;
    const w = $('.jr-wheel');
    w.getBoundingClientRect(); // so that the turn starts from 0
    w.style.transform = `rotate(${360 * 5 - d.spin * 360}deg)`;
    await wait(3100); if (race.token !== tok) return false;
    $('.jr-wheelbox').classList.add(d.win ? 'win' : 'miss');
    $('.jr-roll small').textContent = d.win ? '🎉 YES! It stopped on the yellow slice!' : '😕 So close… not on the yellow slice.';
    await wait(1200);
    return race.token === tok;
  }

  // a turn: play a reason (here or, online, on the other device), then show it
  async function turn(card) {
    const g = race, i = g.turn, p = g.players[i];
    g.busy = true;
    paintHand();
    const ci = [...p.cards, p.basic].indexOf(card);
    const out = play(p, card);
    if (net && g.kind === 'match') {
      // online the turns are shown one after the other, mine and my friend's (net.chain)
      netSend(i, ci, out);
      net.chain = net.chain.then(async () => { if (await show(i, card, out)) advance(); });
      return;
    }
    if (!await show(i, card, out)) return;
    advance();
  }

  // what happened in a turn: the wheel, the log, the numbers flying up, a bad day. False if the game was stopped
  async function show(i, card, out) {
    const g = race, tok = g.token, p = g.players[i];
    const end = p.joy;
    p.joy = out.mid; // first the reason, then the bad day
    // what happened, for the story at the end of Make Them Happy!
    (p.story ||= []).push({ text: card.text, v: card.v || '', arch: card.arch, gain: out.gain, dream: out.dream ? out.dream.win : null, bad: out.bad && !out.bad.blocked ? out.bad.text : '' });
    const sign = n => (n > 0 ? `+${n}` : `${n}`);
    if (out.dream) {
      if (!await spinWheel(p, card, out.dream)) return false;
      const [yes, no] = DREAM_TEXT[card.v] || ['🌟 WOW! Your dream comes true!', '😕 Not this time…'];
      say(`<b>${esc(p.name)}</b>: “${esc(card.text)}” ${out.dream.win ? yes : no} <em>${sign(out.gain)} 😊</em>`, out.dream.win ? 'win' : 'miss');
      if (out.dream.win) overlay.querySelector('.jr-box').classList.add('jr-flash');
      setTimeout(() => overlay.querySelector('.jr-box').classList.remove('jr-flash'), 900);
      paintHand();
    } else {
      say(`<b>${esc(p.name)}</b>: “${esc(card.text)}” <em>${sign(out.gain)} 😊</em>${out.doubled ? ' (double!)' : ''}${card.arch === 'grow' ? ' Next reason: double!' : ''}${card.arch === 'calm' ? ' ☂️ Ready for a bad day.' : ''}`, p.bot || p.remote ? 'bot' : 'me');
    }
    floatOn(i, `${sign(out.gain)} 😊`, out.gain >= 0 ? 'up' : 'down');
    paintTrack();
    if (out.bad) {
      await wait(1100); if (g.token !== tok) return false;
      p.joy = end;
      say(out.bad.blocked ? `😬 Bad day for <b>${esc(p.name)}</b>: “${esc(out.bad.text)}” …but ☂️ it doesn’t hurt!` : `😬 Bad day for <b>${esc(p.name)}</b>: “${esc(out.bad.text)}” <em>-${out.bad.loss} 😊</em>`, 'bad');
      if (out.bad.loss) floatOn(i, `-${out.bad.loss} 😬`, 'down');
      paintTrack();
    }
    p.joy = end;
    await wait(p.bot ? 1200 : 1000);
    return g.token === tok;
  }

  // the next player (or the end)
  function advance() {
    const g = race, p = g.players[g.turn];
    if (g.kind === 'race' && p.joy >= GOAL) { finish(p); return; }
    g.turn = (g.turn + 1) % g.players.length;
    if (g.turn === 0) g.round++;
    if (g.kind === 'match' && g.round > ROUNDS) { matchEnd(); return; }
    g.busy = false;
    next();
  }

  /* ---- 5. the end ---- */
  function finish(winner) {
    race.over = true;
    const human = race.players.filter(p => !p.bot);
    const sentence = p => {
      const best = [...p.cards].filter(c => c.got > 0).sort((a, b) => b.got - a.got).slice(0, 2);
      const j = JOB[p.job];
      return best.length ? `I would like to be ${an(j.name)} ${j.name} because ${best.map(c => lower(c.text)).join(' and ')}.` : `I would like to be ${an(j.name)} ${j.name}.`;
    };
    const rank = [...race.players].sort((a, b) => b.joy - a.joy);
    screen.innerHTML = `
      <div class="jr-end">
        <div class="jr-big">${winner.bot ? '🤖' : '🏆'}</div>
        <h2 class="jr-title">${esc(winner.name)} is the happiest!</h2>
        <p>${winner.avatar} ${esc(winner.name)}, ${an(JOB[winner.job].name)} ${JOB[winner.job].name}, reached ${GOAL} happiness in ${winner.turns} turns.</p>
        <ol class="jr-rank">${rank.map(p => `<li>${p.avatar} <b>${esc(p.name)}</b> · ${JOB[p.job].icon} ${JOB[p.job].name} · ${Math.min(p.joy, GOAL)} 😊</li>`).join('')}</ol>
        <div class="jr-why"><b>✏️ Now say it in English!</b> Your best reasons in this race:
          ${human.map(p => `<p>${p.avatar} <i>${esc(sentence(p))}</i></p>`).join('')}
          <small>Is it true for you too? Use it in exercise 9.27!</small>
        </div>
        <button type="button" class="jr-btn go" data-act="again">Race again with the same jobs 🏁</button>
        <button type="button" class="jr-btn" data-act="modes">New game</button>
      </div>`;
  }

  /* ================= Make Them Happy! ================= */
  // Everybody gets the same character (CLIENTS). The order is drawn, then each player chooses a job for
  // the character, never a job already taken, and its 4 reasons. Then 5 turns: the happiest character wins.

  const HUMAN_AVATARS = ['🧒', '👧', '🧑', '👩'];
  const she = () => (client.she ? 'she' : 'he');
  const her = () => (client.she ? 'her' : 'him');

  function matchModes() {
    if (race) race.token = null;
    race = null; game = 'match'; flow++;
    netLeave();
    screen.innerHTML = `
      <h2 class="jr-title">Make Them Happy!</h2>
      <p class="jr-sub">Someone needs a job. Who can make them the happiest in <b>${ROUNDS} turns</b>?</p>
      <div class="jr-modes">
        <button type="button" class="jr-mode" data-act="mmode" data-n="1"><i>🧒 💞 🤖🤖</i><b>Me vs the computer</b><span>1 player. You and two robots look for the best job.</span></button>
        <button type="button" class="jr-mode" data-act="mmode" data-n="2"><i>🧒 💞 👧</i><b>Friends on one computer</b><span>2 players (or 2 teams!). Take turns at the keyboard.</span></button>
        <button type="button" class="jr-mode" data-act="mnet"><i>📱 💞 💻</i><b>Online with a code</b><span>2 players, 2 devices. Make a room, tell the 4-letter code to a friend and play from your own device.</span></button>
      </div>
      <div class="jr-how">
        <b>How to play</b>
        <ol>
          <li>Meet your <b>character</b>: read about them and look at their ❤️.</li>
          <li>🎲 The computer draws the order. The first player chooses a job first: <b>two players can’t choose the same job!</b></li>
          <li>Choose <b>4 reasons</b> that can make the character happy.</li>
          <li>Play <b>one reason</b> each turn. After <b>${ROUNDS} turns</b>, the happiest character wins!</li>
        </ol>
      </div>`;
  }

  // the names of the players (the robots join when you play alone)
  function matchNames() {
    screen.innerHTML = `
      <h2 class="jr-title">Who is playing?</h2>
      <p class="jr-sub">Write your names (or the names of your teams).</p>
      <div class="jr-names">${Array.from({ length: humans }, (_, i) => `
        <label class="jr-name"><i>${HUMAN_AVATARS[i]}</i>${humans > 1 ? `Player ${i + 1}` : 'My name'}<input type="text" maxlength="18" autocomplete="off" data-i="${i}" value="${esc(crew[i] && !crew[i].bot ? crew[i].name : '')}" placeholder="${humans > 1 ? 'name or team' : 'e.g. Maya'}"></label>`).join('')}
      </div>
      <div class="jr-nav">
        <button type="button" class="jr-btn" data-act="match">◀ Back</button>
        <button type="button" class="jr-btn go" data-act="mclient">Meet the character ▶</button>
      </div>`;
    screen.querySelector('input')?.focus();
  }

  function readCrew() {
    const inputs = [...screen.querySelectorAll('.jr-names input')];
    crew = inputs.map((inp, i) => ({ name: inp.value.trim().slice(0, 18) || (humans > 1 ? `Player ${i + 1}` : 'Me'), avatar: HUMAN_AVATARS[i], bot: false }));
    if (humans === 1) crew.push(...BOTS.map(b => ({ ...b, bot: true })));
  }

  function matchClient() {
    const others = CLIENTS.filter(c => c !== client);
    client = others[Math.floor(Math.random() * others.length)];
    jobList = jobListFor(client);
    screen.innerHTML = `
      <h2 class="jr-title">Meet ${esc(client.name)}!</h2>
      <p class="jr-sub">${esc(client.name)} needs a job. Read carefully: what makes ${her()} happy?</p>
      <div class="jr-client"><span class="jr-cface">${client.icon}</span><div><b>${esc(client.name)}</b><p>${esc(client.bio)}</p></div></div>
      <div class="jr-mine big">${myHearts(client.hearts)}</div>
      <div class="jr-nav">
        <button type="button" class="jr-btn" data-act="mclient">🔄 Another character</button>
        <button type="button" class="jr-btn go" data-act="morder">🎲 Who chooses first? ▶</button>
      </div>`;
  }

  // the draw: the names appear one by one in the new order
  async function matchOrder() {
    const f = flow;
    if (!net) order = shuffle(crew).map(p => ({ ...p, job: '', picks: [] })); // online: already drawn (netNewGame)
    pickAt = 0;
    screen.innerHTML = `
      <h2 class="jr-title">🎲 Who chooses first?</h2>
      <p class="jr-sub">The first player has the most jobs to choose from!</p>
      <ol class="jr-order">${order.map(p => `<li>${p.avatar} <b>${esc(p.name)}</b></li>`).join('')}</ol>
      <div class="jr-nav"></div>`;
    const items = [...screen.querySelectorAll('.jr-order li')];
    for (const li of items) {
      await wait(650); if (f !== flow) return;
      li.classList.add('on');
    }
    await wait(400); if (f !== flow) return;
    $('.jr-nav').innerHTML = net
      ? '<button type="button" class="jr-btn go" data-act="net-go">Let’s go! ▶</button>'
      : `<button type="button" class="jr-btn go" data-act="mpick">${order[0].avatar} ${esc(order[0].name)}, choose a job! ▶</button>`;
  }

  // whose turn to choose: a robot chooses by itself, a person goes to the jobs
  async function matchPick() {
    if (pickAt >= order.length) { matchStart(); return; }
    const p = order[pickAt];
    if (!p.bot) {
      draft = { name: p.name, avatar: p.avatar, hearts: client.hearts, job: '', picks: [] };
      matchJobs();
      return;
    }
    const f = flow;
    Object.assign(p, choose(client.hearts, order.slice(0, pickAt).map(o => o.job), jobList));
    const j = JOB[p.job];
    screen.innerHTML = `<div class="jr-pass"><div class="jr-big">${p.avatar}</div><h2 class="jr-title">${esc(p.name)} is choosing…</h2><p class="jr-wait">🤔</p></div>`;
    await wait(1100); if (f !== flow) return;
    $('.jr-wait').innerHTML = `${esc(p.name)} chooses: <b>${j.icon} ${an(j.name)} ${j.name}</b>!`;
    await wait(1400); if (f !== flow) return;
    pickAt++;
    matchPick();
  }

  function matchJobs() {
    const taken = Object.fromEntries(order.slice(0, pickAt).map(o => [o.job, o]));
    screen.innerHTML = `
      <h2 class="jr-title">${draft.avatar} ${esc(draft.name)}: a job for ${esc(client.name)}</h2>
      <p class="jr-sub">Look at ${esc(client.name)}’s hearts. The jobs already taken are closed!</p>
      <div class="jr-mine"><span class="jr-cname">${client.icon} ${esc(client.name)}</span>${myHearts(client.hearts)}</div>
      <div class="jr-jobs">${jobList.map(j => taken[j.k] ? `
        <button type="button" class="jr-job taken" disabled>
          <small class="jr-dream taken">${taken[j.k].avatar} ${esc(taken[j.k].name)}</small>
          <span class="jr-jicon">${j.icon}</span><b>${an(j.name)} ${j.name}</b><span class="jr-jvals">${valueIcons(j)}</span>
        </button>` : `
        <button type="button" class="jr-job${j.k === draft.job ? ' on' : ''}" data-act="job" data-k="${j.k}">
          ${j.odd ? '<small class="jr-dream odd">unusual!</small>' : ''}
          <span class="jr-jicon">${j.icon}</span><b>${an(j.name)} ${j.name}</b><span class="jr-jvals">${valueIcons(j)}</span>
        </button>`).join('')}
      </div>`;
  }

  function matchReady() {
    const p = order[pickAt];
    p.job = draft.job;
    p.picks = [...draft.picks];
    if (net) { netPicked(p); return; }
    pickAt++;
    matchPick();
  }

  function matchStart() {
    const players = order.map(o => makePlayer({ ...o, hearts: client.hearts }));
    begin(players, 'match');
    say(`Who can make ${esc(client.name)} the happiest in ${ROUNDS} turns? ${players.map(p => `${p.avatar} ${esc(p.name)}: ${JOB[p.job].icon} ${JOB[p.job].name}`).join(' · ')}`);
    next();
  }

  function matchEnd() {
    race.over = true;
    theStory(); // the reading on [jobs-story] becomes this story
    const rank = [...race.players].sort((a, b) => b.joy - a.joy);
    const top = rank.filter(p => p.joy === rank[0].joy);
    // "Rosa should be a vet because she cares about nature and animals and helping people."
    const sentence = p => {
      const j = JOB[p.job];
      const vals = [...new Set([...p.cards].filter(c => c.got > 0).sort((a, b) => b.got - a.got).map(c => c.v))].slice(0, 2);
      return `${client.name} should be ${an(j.name)} ${j.name}${vals.length ? ` because ${she()} cares about ${vals.map(v => CARE[v]).join(' and ')}` : ''}.`;
    };
    const w = top[0], wj = JOB[w.job];
    screen.innerHTML = `
      <div class="jr-end">
        <div class="jr-big">${top.length > 1 ? '🤝' : w.bot ? '🤖' : '🏆'}</div>
        <h2 class="jr-title">${top.length > 1 ? 'It’s a draw!' : `${esc(w.name)} wins!`}</h2>
        <p>${client.icon} ${esc(client.name)} is happiest as ${top.map(p => `${an(JOB[p.job].name)} <b>${JOB[p.job].name}</b>`).join(' or as ')}: ${w.joy} 😊 in ${ROUNDS} turns.</p>
        <ol class="jr-rank">${rank.map(p => `<li>${p.avatar} <b>${esc(p.name)}</b> · ${JOB[p.job].icon} ${JOB[p.job].name} · ${p.joy} 😊</li>`).join('')}</ol>
        <div class="jr-why"><b>✏️ Now say it in English!</b>
          <p>${client.icon} <i>${esc(sentence(w))}</i></p>
          <small>Do you agree? Which job would <b>you</b> choose for ${esc(client.name)}? Why? ${wj.icon}</small>
        </div>
        <button type="button" class="jr-btn go" data-act="story">📖 Read the story of ${esc(client.name)}</button>
        <button type="button" class="jr-btn" data-act="${net ? 'net-start' : 'mclient'}">Play again with a new character 🎲</button>
        <button type="button" class="jr-btn" data-act="match">${net ? 'Leave the room' : 'Menu'}</button>
      </div>`;
  }

  /* ---- the story of the character (end of Make Them Happy!), to read and to print ---- */
  // How the friends suggest a job: each story uses them in a random order, so no two paragraphs sound the same
  const IDEAS = [
    j => `“Why don’t you become ${j}?”`,
    j => `“I think you may like working as ${j}.”`,
    j => `“Try becoming ${j}!”`,
    j => `“You should try being ${j}.”`,
    j => `“What about a job as ${j}?”`,
  ];
  const SAYS = ['had an idea:', 'said:', 'suggested:', 'smiled and said:'];
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

  // a reason or a bad side told in the story (PAST), with the character's pronouns; `hope` = what a dream hoped for
  function tell(text, pr, hope = false) {
    const t = PAST[text];
    const s = Array.isArray(t) ? t[hope ? 1 : 0] : t;
    return s ? s.replace(/\{s\}/g, pr.s).replace(/\{o\}/g, pr.o).replace(/\{p\}/g, pr.p) : '';
  }

  // The story of the game that just ended, as data: shown at the end of the game, printed, and kept for the
  // reading on [jobs-story] (with the facts the exercises there are made from)
  function buildStory() {
    const pr = client.she ? { s: 'she', o: 'her', p: 'her', S: 'She' } : { s: 'he', o: 'him', p: 'his', S: 'He' };
    const name = client.name, n = race.players.length;
    const ideas = shuffle(IDEAS), says = shuffle(SAYS);
    const jobName = p => `${an(JOB[p.job].name)} ${JOB[p.job].name}`;
    // the reasons that made the character happy, the best first, each one once (a reason can be played many times)
    const happy = (p, dreams) => (p.story || []).filter(e => e.gain > 0 && e.arch !== 'basic' && (dreams || e.dream === null))
      .sort((a, b) => b.gain - a.gain).filter((e, i, all) => all.findIndex(x => x.text === e.text) === i);
    const good = p => happy(p, false);
    const moodOf = j => (j >= 90 ? 'really happy' : j >= 60 ? 'happy' : j >= 30 ? 'quite happy' : 'not very happy');
    const paras = race.players.map((p, k) => {
      const st = p.story || [];
      const [best, second] = good(p);
      const dreamWin = st.find(e => e.dream === true);
      const dreamMiss = !dreamWin && st.find(e => e.dream === false);
      const bad = st.find(e => e.bad);
      const when = k && k === n - 1 ? 'Finally' : ['First', 'Then', 'After that', 'Next'][k] || 'Then';
      let t = `${when}, ${p.name} ${says[k % says.length]} ${ideas[k % ideas.length](jobName(p))} `;
      t += best ? `${name} tried, and ${pr.s} liked it: ${tell(best.text, pr)} ` : `${name} tried. `;
      if (second) t += `Also, ${tell(second.text, pr)} `;
      if (dreamWin) t += `And then something amazing happened: ${tell(dreamWin.text, pr)} `;
      else if (dreamMiss) t += `${pr.S} hoped ${tell(dreamMiss.text, pr, true)}, but it never happened. `;
      if (bad) t += `But there were bad days too: ${tell(bad.bad, pr)} `;
      t += p.joy >= 90 ? `${pr.S} was really, really happy.` : p.joy >= 60 ? `${pr.S} was happy.` : p.joy >= 30 ? `${pr.S} was quite happy, but not completely.` : `It wasn’t the right job for ${pr.o}.`;
      return { icon: JOB[p.job].icon, text: t };
    });
    const rank = [...race.players].sort((a, b) => b.joy - a.joy);
    const top = rank.filter(p => p.joy === rank[0].joy), w = top[0];
    const loves = happy(w, true);
    const cares = VALUES.filter(v => client.hearts[v.k]).sort((a, b) => client.hearts[b.k] - client.hearts[a.k]).slice(0, 2).map(v => CARE[v.k]);
    const vals = [...new Set(loves.map(e => e.v).filter(Boolean))].slice(0, 2).map(v => CARE[v]);
    const written = top.length === 1 && ENDINGS[name]?.[w.job];
    const final = top.length > 1
      ? `So which job did ${name} choose? ${pr.S} couldn’t decide! ${pr.S} was just as happy as ${top.map(jobName).join(' and as ')}. Maybe one day ${pr.s} will do both…`
      : written
        ? written.replace('{friend}', w.name)
        : `So ${name} became ${jobName(w)}! ${vals.length ? `It was perfect for ${pr.o}, because ${pr.s} cares about ${vals.join(' and ')}. ` : ''}${loves[0] ? `The best moment? When ${tell(loves[0].text, pr)} ` : ''}Thank you, ${w.name}!`;
    return {
      id: `${Date.now()}`, name, icon: client.icon, she: !!client.she,
      opening: `${OPENINGS[name] || `${client.bio} One day, ${name} decided to find a new job.`} ${pr.S} tried ${n} different jobs.`,
      paras, final,
      facts: {
        n, cares,
        jobs: race.players.map(p => ({ job: JOB[p.job].name, by: p.name, mood: moodOf(p.joy) })),
        winner: top.length === 1 ? JOB[w.job].name : null,
      },
    };
  }

  // the story on the screen and on paper
  function storyHtml(d) {
    return `
      <h2 class="jr-stitle">How ${esc(d.name)} found happiness</h2>
      <div class="jr-shead"><span class="jr-cface">${d.icon}</span><p>${esc(d.opening)}</p></div>
      ${d.paras.map(p => `<p><span class="jr-sicon">${p.icon}</span>${esc(p.text)}</p>`).join('')}
      <p class="jr-sfinal">${esc(d.final)}</p>
      <p class="jr-send">⭐ The end ⭐</p>`;
  }

  // the story of this game: made once (the friends' words are drawn at random), kept for the reading in the book
  function theStory() {
    if (!race.storyData) {
      race.storyData = buildStory();
      try { localStorage.setItem(STORY_KEY, JSON.stringify(race.storyData)); } catch { /* storage unavailable */ }
      bookStory();
    }
    return race.storyData;
  }

  function storyScreen() {
    screen.innerHTML = `
      <div class="jr-story">${storyHtml(theStory())}</div>
      <p class="jr-other">📖 This story is now the reading on p. ${typeof PAGES !== 'undefined' ? PAGES.of('jobs-story') : ''} of your book!</p>
      <div class="jr-nav">
        <button type="button" class="jr-btn" data-act="mend">◀ Back</button>
        <button type="button" class="jr-btn go" data-act="print">🖨️ Print the story</button>
      </div>`;
  }

  // printing: only the story is printed (job-race.css hides the book while html has .jr-printing)
  function printStory() {
    const d = theStory();
    let box = document.getElementById('jr-print');
    if (!box) { box = document.createElement('div'); box.id = 'jr-print'; document.body.append(box); }
    const names = race.players.filter(p => !p.bot).map(p => esc(p.name)).join(', ');
    box.innerHTML = `
      <div class="jr-story print">${storyHtml(d)}
        <div class="jr-sdraw"><span>✏️ Draw ${esc(d.name)} at work!</span></div>
        <div class="jr-sopinion"><b>Do you agree? Which job would you choose for ${esc(d.name)}? Why?</b><i></i><i></i><i></i></div>
        <p class="jr-sby">Make Them Happy! · ${names ? `played by ${names} · ` : ''}${new Date().toLocaleDateString('en-GB')}</p>
      </div>`;
    document.documentElement.classList.add('jr-printing');
    window.addEventListener('afterprint', () => document.documentElement.classList.remove('jr-printing'), { once: true });
    window.print();
  }

  /* ================= the reading on [jobs-story]: the story of the last game ================= */
  // Until somebody plays, it is the story of Mr Grey (GREY). After a game of Make Them Happy! the last story is
  // kept in this browser (STORY_KEY) and the two pages are made again from it: the text, and exercises made
  // from its facts (true/false, questions, the past simple verbs in the text, a summary).
  // The exercises are drawn with a random seed from the story id, so they stay the same until the next game;
  // the answers are kept per story (ANS_KEY).
  const STORY_KEY = 'jr-story-last', ANS_KEY = 'jr-story-answers';
  const GREY = {
    id: 'grey', name: 'Mr Grey', icon: '👨‍💼', she: false,
    opening: 'Mr Grey was forty-five. Every morning he ate the same breakfast, wore the same grey suit and took the same bus at 7.42. He loved numbers, quiet rooms and the safe feeling of a big salary at the end of the month. He hated surprises. So when he decided to change his job, he did it very, very carefully: he asked three young friends for help, Rita, Maya and Tom.',
    paras: [
      { icon: '🏦', text: 'First, Rita had an idea: “Why don’t you become a bank manager?” Mr Grey tried, and he liked it. The office was quiet, the salary was big and his team worked well. There were bad days too: the job wasn’t very creative, and sometimes the hours felt very long. But he was happy.' },
      { icon: '🩺', text: 'Then Maya said: “I think you may like working as a doctor. You could discover a new cure and become famous!” Mr Grey put on a white coat and tried. He worked at night, he had almost no free time and he was always tired. He waited and waited for his great discovery… but it never happened. It wasn’t the right job for him.' },
      { icon: '🧮', text: 'Finally, Tom said: “You should try being an accountant. It’s a safe, steady job.” Mr Grey counted money all day, and everything was in perfect order. But it was numbers, numbers… and nothing else. He was happy, but not as happy as at the bank.' },
    ],
    final: 'So Mr Grey became a bank manager! Now he had a quiet office, a team that worked well and a big salary at the end of every month. He still ate the same breakfast and took the same bus at 7.42, but at Christmas there was a surprise (a nice one, for once): a big bonus! Mr Grey smiled. Just a little. “Thank you, Rita,” he said. “You found the perfect job for me.”',
    facts: {
      n: 3, cares: ['money', 'having a safe, steady job'], winner: 'bank manager',
      jobs: [{ job: 'bank manager', by: 'Rita', mood: 'happy' }, { job: 'doctor', by: 'Maya', mood: 'not very happy' }, { job: 'accountant', by: 'Tom', mood: 'quite happy' }],
    },
  };

  const lastStory = () => { try { return JSON.parse(localStorage.getItem(STORY_KEY)) || GREY; } catch { return GREY; } };
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five'];

  // a random generator with a seed: the same story always gets the same exercises
  function seeded(text) {
    let h = 1779033703;
    for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353);
    return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  }

  // the exercises of a story, from its facts
  function exercisesFor(d) {
    const rnd = seeded(d.id);
    const pick = a => a[Math.floor(rnd() * a.length)];
    const mix = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
    const f = d.facts, N = d.name, S = d.she ? 'She' : 'He', s = S.toLowerCase();
    const a = j => `${an(j)} ${j}`;
    const others = mix(JOBS.map(j => j.name).filter(j => !f.jobs.some(x => x.job === j)));
    const names = f.jobs.map(x => x.by);
    const otherNames = mix(['Tom', 'Rita', 'Maya', 'Leo', 'Sara', 'Luca', 'Emma', 'Omar'].filter(x => !names.includes(x)));
    const flip = m => (m === 'not very happy' || m === 'quite happy' ? 'really happy' : 'not very happy');

    // true or false: some true facts, some false ones, mixed
    const tf = [
      { t: `${N} tried ${NUM[f.n] || f.n} different jobs.`, a: 'T' },
      { t: `${N} tried ${NUM[f.n + 1] || f.n + 1} different jobs.`, a: 'F' },
      { t: `${N}’s first job was ${a(f.jobs[0].job)}.`, a: 'T' },
      { t: `${N}’s first job was ${a(f.jobs[f.jobs.length - 1].job)}.`, a: 'F' },
    ];
    f.jobs.forEach((x, k) => {
      tf.push({ t: `${x.by} suggested ${a(x.job)}.`, a: 'T' });
      tf.push({ t: `${names[(k + 1) % names.length] === x.by ? otherNames[0] : names[(k + 1) % names.length]} suggested ${a(x.job)}.`, a: 'F' });
      tf.push(rnd() < .5 ? { t: `${S} was ${x.mood} as ${a(x.job)}.`, a: 'T' } : { t: `${S} was ${flip(x.mood)} as ${a(x.job)}.`, a: 'F' });
    });
    if (f.winner) tf.push({ t: `In the end, ${N} became ${a(f.winner)}.`, a: 'T' }, { t: `In the end, ${N} became ${a(others[0])}.`, a: 'F' });
    const trues = mix(tf.filter(x => x.a === 'T')), falses = mix(tf.filter(x => x.a === 'F'));
    const tfList = mix([...trues.slice(0, 4), ...falses.slice(0, 3)]);

    // questions with three answers
    const three = (right, wrong) => mix([right, ...mix(wrong.filter(x => x !== right)).slice(0, 2)]);
    const k = Math.floor(rnd() * f.jobs.length);
    const mc = [
      { q: `How many jobs did ${N} try?`, a: NUM[f.n], o: three(NUM[f.n], [NUM[f.n - 1], NUM[f.n + 1], 'five'].filter(Boolean)) },
      { q: `Who suggested ${a(f.jobs[k].job)}?`, a: f.jobs[k].by, o: three(f.jobs[k].by, [...names, ...otherNames]) },
      { q: `What was ${N}’s first job?`, a: f.jobs[0].job, o: three(f.jobs[0].job, [...f.jobs.map(x => x.job), ...others]) },
      f.winner
        ? { q: `Which job made ${N} the happiest?`, a: f.winner, o: three(f.winner, [...f.jobs.map(x => x.job), ...others]) }
        : { q: `What was ${N}’s last job?`, a: f.jobs[f.jobs.length - 1].job, o: three(f.jobs[f.jobs.length - 1].job, [...f.jobs.map(x => x.job), ...others]) },
      { q: `What does ${N} care about most?`, a: f.cares[0], o: three(f.cares[0], mix(Object.values(CARE).filter(c => !f.cares.includes(c)))) },
    ];

    // the past simple verbs in the text (irregular ones first)
    const words = new Set(`${d.opening} ${d.paras.map(p => p.text).join(' ')} ${d.final}`.toLowerCase().match(/[a-z]+/g));
    const found = Object.entries(PAST_VERBS).filter(([past, base]) => words.has(past) && past !== 'could' && past !== 'were' && past !== 'read');
    const irregular = ([past, base]) => !past.endsWith('ed');
    const verbs = mix([...mix(found.filter(irregular)), ...mix(found.filter(v => !irregular(v)))].slice(0, 8)).map(([past, base]) => ({ base, past }));

    // the summary: three blanks
    const last = f.jobs[f.jobs.length - 1].job;
    const sum = [
      { pre: `${N} tried`, post: 'different jobs.', a: [NUM[f.n], String(f.n)] },
      { pre: `First, ${s} tried to be`, post: '.', a: [f.jobs[0].job, a(f.jobs[0].job)] },
      f.winner ? { pre: `In the end, ${s} became`, post: '.', a: [a(f.winner), f.winner] }
        : { pre: `The last job ${s} tried was`, post: '.', a: [last, a(last)] },
    ];
    return { tf: tfList, mc, verbs, sum };
  }

  // draw the two pages of the reading
  function bookStory() {
    const text = document.getElementById('jbs-text');
    if (!text) return;
    const d = lastStory(), ex = exercisesFor(d);
    let ans = {};
    try { ans = (JSON.parse(localStorage.getItem(ANS_KEY)) || {})[d.id] || {}; } catch { /* none yet */ }
    const own = d.id !== 'grey';
    document.getElementById('jbs-kicker').textContent = own ? '// reading · the story of your last game' : '// reading · a story from the game';
    document.getElementById('jbs-title').innerHTML = `How ${esc(d.name)} <span>found happiness</span>`;
    document.getElementById('jbs-face').textContent = d.icon;
    const all = [d.opening, ...d.paras.map(p => p.text), d.final];
    text.innerHTML = all.map((t, i) => `<p><i class="jb-pn">${i + 1}</i>${esc(t)}</p>`).join('');
    const opt = (id, list, chosen) => `<span class="opt" data-q="${id}">${list.map(o => `<button type="button" class="${o === chosen ? 'on' : ''}">${esc(o)}</button>`).join('')}</span>`;
    document.getElementById('jbs-tf').innerHTML = ex.tf.map((x, i) => `<p><span><i>${i + 1}.</i>${esc(x.t)}</span>${opt(`tf${i}`, ['T', 'F'], ans[`tf${i}`])}</p>`).join('');
    document.getElementById('jbs-mc').innerHTML = ex.mc.map((x, i) => `<li><p><i>${i + 1}.</i>${esc(x.q)}</p>${opt(`mc${i}`, x.o, ans[`mc${i}`])}</li>`).join('');
    document.getElementById('jbs-verbs').innerHTML = ex.verbs.map((v, i) => `<li><span>${v.base} →</span><input class="fill" data-q="v${i}" value="${esc(ans[`v${i}`] || '')}" autocomplete="off" aria-label="Past simple of ${v.base}"></li>`).join('');
    document.getElementById('jbs-sum').innerHTML = ex.sum.map((x, i) => `<p class="mt-line"><span>${esc(x.pre)}</span><input class="fill" data-q="s${i}" value="${esc(ans[`s${i}`] || '')}" autocomplete="off" aria-label="Summary, gap ${i + 1}"><span>${esc(x.post)}</span></p>`).join('');
    bookStory.current = { d, ex };
    fitStory();
  }

  // the text gets smaller when the story is long (only when the page is on the screen: it can be measured)
  function fitStory() {
    const el = document.getElementById('jbs-text');
    if (!el || !el.offsetParent) return;
    let size = 1.66;
    el.style.fontSize = `${size}cqw`;
    while (el.scrollHeight > el.clientHeight + 1 && size > 1.1) { size -= .04; el.style.fontSize = `${size}cqw`; }
  }

  function saveAnswer(q, value) {
    const cur = bookStory.current;
    if (!cur) return;
    try {
      const all = JSON.parse(localStorage.getItem(ANS_KEY)) || {};
      all[cur.d.id] = { ...(all[cur.d.id] || {}), [q]: value };
      localStorage.setItem(ANS_KEY, JSON.stringify({ [cur.d.id]: all[cur.d.id] })); // only the last story is kept
    } catch { /* storage unavailable */ }
  }

  const norm = t => t.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  function checkBook(what) {
    const cur = bookStory.current;
    if (!cur) return;
    const { ex } = cur;
    if (what === 'tf' || what === 'mc') {
      document.querySelectorAll(`#jbs-${what} .opt`).forEach((o, i) => {
        const on = o.querySelector('button.on');
        o.classList.remove('ok', 'no');
        if (on) o.classList.add(on.textContent === (what === 'tf' ? ex.tf[i].a : ex.mc[i].a) ? 'ok' : 'no');
      });
    } else {
      const list = what === 'verbs' ? ex.verbs.map(v => [v.past]) : ex.sum.map(x => x.a);
      document.querySelectorAll(`#jbs-${what} input`).forEach((inp, i) => {
        inp.classList.remove('ok', 'no');
        if (inp.value.trim()) inp.classList.add(list[i].map(norm).includes(norm(inp.value)) ? 'ok' : 'no');
      });
    }
  }

  const bookPages = document.querySelector('.spread[data-id="jobs-story"]');
  if (bookPages) {
    bookPages.addEventListener('click', e => {
      const b = e.target.closest('[data-jbs]');
      if (b) { checkBook(b.dataset.jbs); return; }
      const btn = e.target.closest('.opt[data-q] button');
      if (!btn) return;
      const o = btn.parentElement, was = btn.classList.contains('on');
      o.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      if (!was) btn.classList.add('on');
      o.classList.remove('ok', 'no');
      saveAnswer(o.dataset.q, was ? '' : btn.textContent);
    });
    bookPages.addEventListener('input', e => {
      const inp = e.target.closest('input[data-q]');
      if (!inp) return;
      inp.classList.remove('ok', 'no');
      saveAnswer(inp.dataset.q, inp.value);
    });
    bookStory();
    document.addEventListener('spreadchange', fitStory);
    window.addEventListener('resize', fitStory);
    document.fonts?.ready.then(fitStory);
  }

  /* ================= Make Them Happy! online: two devices, one room ================= */
  // The room is the same document as in Villain Battle (book.rooms in cloud.js, duels/<CODE>, 2 players):
  // this game writes only in its field `mh`. Each device writes only when it acts (its job, its turns),
  // the other device draws what changed. In mh:
  //   n0, n1                 the names (0 = who made the room)
  //   gid                    the number of the game in the room (a new character = a new game)
  //   client, list, order    the character (index in CLIENTS), the jobs in their order, who chooses first ([1, 0]…)
  //   phase                  'pick' → 'play' → 'over';  pickAt, k0, k1: the job and reasons of each (by position)
  //   st, turn, round        the players (by position) after the last turn
  //   ev                     the last turn { seq, by, pos, ci, out, st }: both devices show it (the wheel too)
  //   left                   the player who left

  const clientId = Math.random().toString(36).slice(2) + Date.now().toString(36); // new on every page load
  const rooms = () => window.book && window.book.rooms;
  let netName = '';
  const netText = e => {
    const c = (e && (e.code || e.message)) || '';
    if (/operation-not-allowed|admin-restricted/.test(c)) return 'Online play is not switched on yet. Ask your teacher!';
    if (/permission-denied/.test(c)) return 'Online play is not set up yet. Ask your teacher!';
    if (c === 'notfound') return 'There is no room with this code. Check the letters!';
    if (c === 'full') return 'This room already has two players.';
    if (c === 'expired') return 'This room is too old. Ask your friend to make a new one.';
    if (c === 'busy') return 'Could not make a room. Try again.';
    return 'Could not connect. Check the internet and try again.';
  };
  const netMsg = t => { const el = $('.jr-neterr'); if (el) el.textContent = t; };

  function netMenu(msg = '') {
    netLeave();
    screen.innerHTML = `
      <h2 class="jr-title">Online with a code</h2>
      <p class="jr-sub">Make Them Happy! with a friend: each player uses their own device.</p>
      <div class="jr-names"><label class="jr-name"><i>🧒</i>My name<input type="text" class="jr-netname" maxlength="18" autocomplete="off" data-i="net" placeholder="e.g. Maya" value="${esc(netName)}"></label></div>
      <div class="jr-modes">
        <button type="button" class="jr-mode" data-act="net-create"><i>🆕</i><b>Make a room</b><span>You get a 4-letter code. Tell it to your friend.</span></button>
        <div class="jr-mode many">
          <i>🔑</i><b>Join a room</b><span>Write the code of your friend.</span>
          <input class="jr-code" type="text" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD" aria-label="Room code">
          <button type="button" class="jr-btn go" data-act="net-join">Join ▶</button>
        </div>
      </div>
      <p class="jr-neterr" aria-live="polite">${esc(msg)}</p>
      <div class="jr-nav"><button type="button" class="jr-btn" data-act="match">◀ Back</button></div>`;
  }

  async function netEnter(make) {
    const R = rooms();
    netName = ($('.jr-netname')?.value || '').trim().slice(0, 18);
    if (!R) { netMsg('Online play needs the internet. Try again in a moment.'); return; }
    let code;
    if (!make) {
      code = ($('.jr-code').value || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (code.length !== 4) { netMsg('The code has 4 letters.'); return; }
    }
    netMsg(make ? 'Making the room…' : 'Joining…');
    try {
      let me = 0;
      if (make) code = await R.create(clientId); else me = await R.join(code, clientId);
      net = { code, me, unsub: null, room: null, gid: 0, intro: false, seen: 0, shownPick: '', chain: Promise.resolve() };
      await R.update(code, { [`mh.n${me}`]: netName || `Player ${me + 1}` });
      if (net) net.unsub = R.watch(code, onRoom, e => netMsg(netText(e)));
    } catch (e) { net = null; netMsg(netText(e)); }
  }

  function netLeave() {
    if (!net) return;
    const st = net;
    net = null;
    st.unsub?.();
    try { rooms()?.update(st.code, { 'mh.left': st.me }).catch(() => {}); } catch { /* nobody to tell */ }
  }

  // every change of the room comes here
  function onRoom(room) {
    if (!net) return;
    net.room = room;
    if (!room) { netLeave(); netMenu('This room is gone.'); return; }
    const m = room.mh || {};
    if (m.left === 1 - net.me) {
      if (race) race.token = null;
      flow++;
      screen.innerHTML = '<div class="jr-pass"><div class="jr-big">👋</div><h2 class="jr-title">Your friend left the game.</h2><button type="button" class="jr-btn go" data-act="match">Back to the menu</button></div>';
      return;
    }
    if (!m.gid) { netLobby(m); return; }
    if (m.gid !== net.gid) { netNewLocal(m); return; }
    if (net.intro) netStep();
  }

  // before the first game: who is in the room
  function netLobby(m) {
    const host = net.me === 0;
    screen.innerHTML = `
      <h2 class="jr-title">Make Them Happy! online</h2>
      <p class="jr-sub">Room code: <b class="jr-roomcode">${net.code}</b></p>
      <ol class="jr-order lobby">${[0, 1].map(i => `<li class="on">${HUMAN_AVATARS[i]} <b>${m['n' + i] ? esc(m['n' + i]) : '…'}</b>${i === net.me ? ' <small>(you)</small>' : ''}</li>`).join('')}</ol>
      <p class="jr-wait">${!m.n1 ? 'Tell this code to your friend: they choose “Join a room”.' : host ? 'Your friend is here! Press Start when you are ready.' : `Waiting for ${esc(m.n0 || 'your friend')} to start…`}</p>
      <p class="jr-neterr" aria-live="polite"></p>
      <div class="jr-nav">
        <button type="button" class="jr-btn" data-act="match">Leave</button>
        ${host ? `<button type="button" class="jr-btn go" data-act="net-start" ${m.n1 ? '' : 'disabled'}>🎲 Start!</button>` : ''}
      </div>`;
  }

  // a new game: the character, the jobs and the order are drawn here and written in the room
  async function netNewGame() {
    if (!net) return;
    const m = net.room?.mh || {};
    const others = CLIENTS.map((c, i) => i).filter(i => i !== m.client);
    const c = others[Math.floor(Math.random() * others.length)];
    const patch = {
      'mh.gid': (m.gid || 0) + 1, 'mh.phase': 'pick', 'mh.client': c, 'mh.list': jobListFor(CLIENTS[c]).map(j => j.k),
      'mh.order': shuffle([0, 1]), 'mh.pickAt': 0, 'mh.k0': null, 'mh.k1': null,
      'mh.st': null, 'mh.turn': 0, 'mh.round': 1, 'mh.ev': null, 'mh.left': null,
    };
    try { await rooms().update(net.code, patch); } catch (e) { netMsg(netText(e)); }
  }

  // a new game arrived from the room: meet the character, then the draw (matchOrder), then netStep
  function netNewLocal(m) {
    if (race) race.token = null;
    race = null;
    flow++;
    Object.assign(net, { gid: m.gid, intro: false, seen: 0, shownPick: '', chain: Promise.resolve() });
    client = CLIENTS[m.client];
    jobList = (m.list || []).map(k => JOB[k]).filter(Boolean);
    order = m.order.map(i => ({ name: m['n' + i] || `Player ${i + 1}`, avatar: HUMAN_AVATARS[i], bot: false, remote: i !== net.me, job: '', picks: [] }));
    screen.innerHTML = `
      <h2 class="jr-title">Meet ${esc(client.name)}!</h2>
      <p class="jr-sub">${esc(client.name)} needs a job. Read carefully: what makes ${her()} happy?</p>
      <div class="jr-client"><span class="jr-cface">${client.icon}</span><div><b>${esc(client.name)}</b><p>${esc(client.bio)}</p></div></div>
      <div class="jr-mine big">${myHearts(client.hearts)}</div>
      <div class="jr-nav"><button type="button" class="jr-btn go" data-act="net-order">🎲 Who chooses first? ▶</button></div>`;
  }

  // draw the room as it is now: whose turn to choose, or the turns of the game
  function netStep() {
    const m = net.room?.mh;
    if (!m || m.gid !== net.gid) return;
    order.forEach((o, k) => { const pk = m['k' + k]; if (pk) { o.job = pk.job; o.picks = pk.picks; } });
    if (m.phase === 'pick') {
      pickAt = m.pickAt || 0;
      const p = order[pickAt];
      if (!p) return;
      const key = `${m.gid}:${pickAt}`;
      if (net.shownPick === key && !p.remote) return; // already choosing: don't lose what was clicked
      net.shownPick = key;
      if (!p.remote) {
        draft = { name: p.name, avatar: p.avatar, hearts: client.hearts, job: '', picks: [] };
        matchJobs();
        return;
      }
      const taken = order.filter(o => o.job);
      screen.innerHTML = `
        <div class="jr-pass">
          <div class="jr-big">${p.avatar}</div>
          <h2 class="jr-title">${esc(p.name)} is choosing a job for ${esc(client.name)}…</h2>
          <p class="jr-wait">⏳ Look at the hearts and think: which job would <b>you</b> choose?</p>
          <div class="jr-mine"><span class="jr-cname">${client.icon} ${esc(client.name)}</span>${myHearts(client.hearts)}</div>
          ${taken.length ? `<p>${taken.map(o => `${o.avatar} ${esc(o.name)}: <b>${JOB[o.job].icon} ${an(JOB[o.job].name)} ${JOB[o.job].name}</b>`).join(' · ')}</p>` : ''}
        </div>`;
      return;
    }
    if (!race || race.gid !== m.gid) netBegin(m);
    const ev = m.ev;
    if (ev && ev.seq > net.seen) {
      net.seen = ev.seq;
      if (ev.by !== net.me) net.chain = net.chain.then(() => netShow(ev, m.gid));
    }
  }

  function netBegin(m) {
    const players = order.map(o => Object.assign(makePlayer({ ...o, hearts: client.hearts }), { remote: o.remote }));
    begin(players, 'match');
    race.gid = m.gid;
    if (m.st) netApply(m.st);
    race.turn = m.turn || 0;
    race.round = m.round || 1;
    net.seen = m.ev ? m.ev.seq : 0;
    say(`Who can make ${esc(client.name)} the happiest in ${ROUNDS} turns? ${players.map(p => `${p.avatar} ${esc(p.name)}: ${JOB[p.job].icon} ${JOB[p.job].name}`).join(' · ')}`);
    paint();
  }

  // the players as they are written in the room (Infinity → -1: a dream can always be played)
  const ser = p => ({
    joy: p.joy, turns: p.turns, double: p.double, shield: p.shield, basic: p.basic.got,
    cards: p.cards.map(c => ({ left: c.left === Infinity ? -1 : c.left, chance: c.chance, got: c.got })),
  });
  function netApply(st) {
    race.players.forEach((p, k) => {
      const x = st[k];
      if (!x) return;
      Object.assign(p, { joy: x.joy, turns: x.turns, double: x.double, shield: x.shield });
      p.basic.got = x.basic;
      x.cards.forEach((c, j) => { if (p.cards[j]) Object.assign(p.cards[j], { left: c.left < 0 ? Infinity : c.left, chance: c.chance, got: c.got }); });
    });
  }

  // my turn: it goes to the room (the other device shows it), while this device shows it too
  function netSend(i, ci, out) {
    const g = race;
    const nt = (i + 1) % g.players.length, nr = g.round + (nt === 0 ? 1 : 0);
    const st = g.players.map(ser);
    const { card, ...o } = out;
    const ev = { seq: net.seen + 1, by: net.me, pos: i, ci, out: o, st };
    net.seen = ev.seq;
    rooms().update(net.code, { 'mh.ev': ev, 'mh.st': st, 'mh.turn': nt, 'mh.round': nr, 'mh.phase': nr > ROUNDS ? 'over' : 'play' })
      .catch(() => say('⚠️ Your turn was not sent: check the internet!', 'bad'));
  }

  // the other player's turn, shown here
  async function netShow(ev, gid) {
    if (!race || race.gid !== gid || !net) return;
    race.busy = true;
    race.turn = ev.pos;
    const p = race.players[ev.pos];
    netApply(ev.st);
    if (!await show(ev.pos, [...p.cards, p.basic][ev.ci], ev.out)) return;
    advance();
  }

  // my job and reasons are chosen: they go to the room
  async function netPicked(p) {
    const k = pickAt;
    screen.innerHTML = '<div class="jr-pass"><div class="jr-big">⏳</div><h2 class="jr-title">Sending…</h2></div>';
    try {
      await rooms().update(net.code, { [`mh.k${k}`]: { job: p.job, picks: p.picks }, 'mh.pickAt': k + 1, 'mh.phase': k + 1 >= order.length ? 'play' : 'pick' });
    } catch (e) {
      if (!net) return;
      net.shownPick = '';
      netStep();
      netMsg(netText(e));
    }
  }

  /* ---- clicks ---- */
  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target.closest('.jr-close')) { close(); return; }
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    if (act === 'mode') { humans = +btn.dataset.n; maker = 0; made = []; newDraft(); meCard(); }
    else if (act === 'modes') modes();
    else if (act === 'avatar') { draft.avatar = btn.dataset.a; screen.querySelectorAll('.jr-av').forEach(b => b.classList.toggle('on', b === btn)); }
    else if (act === 'heart') setHeart(btn.dataset.v, +btn.dataset.n);
    else if (act === 'me') meCard();
    else if (act === 'jobs') { if (game === 'match') matchJobs(); else jobs(); }
    else if (act === 'job') { if (draft.job !== btn.dataset.k) draft.picks = []; draft.job = btn.dataset.k; reasons(); }
    else if (act === 'reason') toggleReason(+btn.dataset.i);
    else if (act === 'ready') { if (game === 'match') matchReady(); else done(); }
    else if (act === 'card') { if (!race || race.busy || race.over) return; const p = race.players[race.turn]; const c = [...p.cards, p.basic][+btn.dataset.i]; if (c && c.left > 0) turn(c); }
    else if (act === 'again') start();
    else if (act === 'quit') { if (game === 'match') matchModes(); else modes(); }
    // Make Them Happy!
    else if (act === 'race') modes();
    else if (act === 'match') matchModes();
    else if (act === 'mmode') { humans = +btn.dataset.n; crew = []; matchNames(); }
    else if (act === 'mclient') { if (screen.querySelector('.jr-names')) readCrew(); matchClient(); }
    else if (act === 'morder') matchOrder();
    else if (act === 'mpick') matchPick();
    else if (act === 'mnet') netMenu();
    else if (act === 'story') storyScreen();
    else if (act === 'mend') matchEnd();
    else if (act === 'print') printStory();
    else if (act === 'net-create') netEnter(true);
    else if (act === 'net-join') netEnter(false);
    else if (act === 'net-start') netNewGame();
    else if (act === 'net-order') matchOrder();
    else if (act === 'net-go') { if (net) { net.intro = true; netStep(); } }
  });

  // the name typed on the Me card is kept when going back and forth
  overlay.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList.contains('jr-code')) { e.preventDefault(); netEnter(false); }
  });
  overlay.addEventListener('input', e => { if (e.target.closest('.jr-name') && !e.target.dataset.i && draft) draft.name = e.target.value.trim().slice(0, 18); });

  // while the pop-up is open the keys do not turn the pages
  window.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    e.stopPropagation();
    if (e.key === 'Escape') close();
  }, true);

  // a button with data-game="match" opens Make Them Happy!, the others the Happy Job Race
  document.querySelectorAll('.jr-start').forEach(b => b.addEventListener('click', () => open(b.dataset.game)));

  /* ================= 9.17 in the book: how many hearts are used ================= */
  // script.js saves and paints the hearts (they are .opt); here we only count them
  const sheet = document.getElementById('jb917'), counter = document.getElementById('jb917-count');
  function countHearts() {
    const { total } = bookHearts();
    counter.innerHTML = total > HEARTS ? `Too many! <b>❤ ${total} / ${HEARTS}</b>` : `<b>❤ ${total} / ${HEARTS}</b>`;
    counter.classList.toggle('over', total > HEARTS);
  }
  if (sheet && counter) {
    sheet.addEventListener('click', () => setTimeout(countHearts));
    document.addEventListener('spreadchange', countHearts); // the answers may arrive later from the cloud
    countHearts();
  }

  /* ================= opens by itself at the end of its page ================= */
  // like Villain Battle: when the pupil scrolls to the very end of the spread, the pop-up appears (once)
  const SPREAD = 'jobs-pros';
  let shown = false;
  const atBottom = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
  function check() {
    const cur = document.querySelector('.spread.current');
    if (shown || !cur || cur.dataset.id !== SPREAD || !overlay.hidden) return;
    if (document.documentElement.classList.contains('gq-open')) return;
    if (atBottom() && cur.getBoundingClientRect().bottom <= window.innerHeight) { shown = true; open(); }
  }
  let queued = false;
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; check(); }); } };
  window.addEventListener('scroll', later, { passive: true });
  window.addEventListener('wheel', e => { if (e.deltaY > 0) later(); }, { passive: true });
  window.addEventListener('resize', later);
  document.addEventListener('spreadchange', later);

  /* ================= the Games list on the home page ================= */
  window.addEventListener('load', () => {
    const list = document.getElementById('gameList');
    if (!list || typeof PAGES === 'undefined') return;
    const at = PAGES.of('jobs-pros'), atStory = PAGES.of('jobs-story'); // the race is on [jobs-pros:L], Make Them Happy! on [jobs-story:L]
    const pill = document.createElement('details');
    pill.className = 'game-topic';
    pill.style.setProperty('--c', '#e8820c');
    pill.innerHTML = `<summary>Jobs <small>2</small></summary><div class="topic-pages"><a href="#p${at}" data-jr="race">🏁 Happy Job Race</a><a href="#p${atStory}" data-jr="match">💞 Make Them Happy!</a></div>`;
    list.append(pill);
    document.addEventListener('click', e => { if (!e.target.closest('#gameList')) pill.open = false; });
    pill.addEventListener('toggle', () => {
      if (pill.open) list.querySelectorAll('.game-topic').forEach(o => { if (o !== pill) o.open = false; });
    });
    pill.querySelectorAll('[data-jr]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      pill.open = false;
      const go = () => open(a.dataset.jr);
      const page = a.getAttribute('href');
      if (location.hash === page) { go(); return; }
      document.addEventListener('spreadchange', go, { once: true });
      location.hash = page;
    }));
    window.hideClosedGames?.();
  });
})();
