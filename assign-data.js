// "Assign work" (For the teacher): one chapter per topic, built by assign-pages.js.
// Each topic opens with its list (left page) and the page to give the things on it to a class (right page);
// every list the teacher saves becomes a page after it, with its date.
//
// To add something from the code: add it to `items` ('word' or ['emoji', 'word']).
// To add a topic: add an entry here (a new `key`, never used before): its chapter appears by itself.
// The topics are in the order of the chapters of the book they go with (`chapter`): put a new one in its place.
//   key    the name of the topic: never change it, the saved lists are kept under it
//   per    how many things each student gets (the teacher can change it on the page)
//   unit   the heading of the column on the lists
// Things added or removed on the page by the teacher are kept in the cloud, on top of these lists.

const ASSIGN_TOPICS = [
  {
    key: 'pictures',
    chapter: 'Describing people', // the chapter of the book it goes with
    title: 'Pictures',
    color: '#f96d5a',
    per: 1,
    unit: 'Picture',
    items: Array.from({ length: 20 }, (_, i) => `picture ${i + 1}`),
  },
  {
    key: 'personality',
    chapter: 'Personality', // the chapter of the book it goes with
    title: 'Personality',
    color: '#c08be8',
    per: 3,
    unit: 'Adjective',
    items: [
      'adventurous', 'ambitious', 'brave', 'calm', 'caring', 'cautious',
      'cheerful', 'clumsy', 'confident', 'creative', 'easy-going', 'enthusiastic',
      'extroverted', 'friendly', 'generous', 'hardworking', 'honest', 'jealous',
      'kind', 'lazy', 'modest', 'optimistic', 'outgoing', 'patient',
      'pessimistic', 'quiet', 'realistic', 'relaxed', 'reserved', 'responsible',
      'sensitive', 'shy', 'sociable', 'sweet', 'taciturn', 'talkative',
      'unconventional',
    ],
  },
  {
    // Villain Lab (pers-villain-words … ): each student draws and describes a new avatar,
    // and the best ones can become new villains of Villain Battle (img/personality/villains/)
    key: 'villains',
    chapter: 'Personality', // the chapter of the book it goes with
    title: 'Villain avatars',
    color: '#c08be8',
    note: 'An animal and 3 flaws each: the student draws the villain and describes it. The animals already drawn for Villain Battle (raccoon, ram, panda, sloth, crow, rabbit, scorpion, crocodile, cat, bull, owl) are not in the list.',
    // a topic with more lists: `columns` instead of `items` (each column: key, unit, per, items)
    columns: [
      {
        key: 'animal',
        unit: 'Animal',
        per: 1,
        items: [
          ['🦊', 'fox'], ['🐺', 'wolf'], ['🐻', 'bear'], ['🦁', 'lion'], ['🐯', 'tiger'], ['🐒', 'monkey'],
          ['🦍', 'gorilla'], ['🐘', 'elephant'], ['🦒', 'giraffe'], ['🦓', 'zebra'], ['🦛', 'hippo'], ['🦏', 'rhino'],
          ['🦘', 'kangaroo'], ['🐨', 'koala'], ['🐧', 'penguin'], ['🦅', 'eagle'], ['🦜', 'parrot'], ['🦩', 'flamingo'],
          ['🦚', 'peacock'], ['🦆', 'duck'], ['🐸', 'frog'], ['🐍', 'snake'], ['🐢', 'turtle'], ['🦎', 'lizard'],
          ['🦈', 'shark'], ['🐙', 'octopus'], ['🐬', 'dolphin'], ['🐳', 'whale'], ['🦀', 'crab'], ['🐝', 'bee'],
          ['🕷️', 'spider'], ['🐌', 'snail'], ['🦋', 'butterfly'], ['🐜', 'ant'], ['🐭', 'mouse'], ['🦔', 'hedgehog'],
          ['🦇', 'bat'], ['🦨', 'skunk'], ['🦫', 'beaver'], ['🐐', 'goat'], ['🐷', 'pig'], ['🐴', 'horse'],
        ],
      },
      {
        // the flaws of Villain Battle (FLAW_GROUPS in villain-battle.js): only these have powers in the game
        key: 'flaw',
        unit: 'Flaw',
        per: 3,
        items: [
          'messy', 'chaotic', 'forgetful', 'always late', 'distracted',
          'shy', 'anxious', 'touchy', 'pessimistic', 'hot-tempered',
          'bossy', 'pushy', 'arrogant', 'greedy', 'superficial', 'clingy', 'chatty',
          'lazy', 'impatient', 'stubborn', 'indecisive',
        ],
      },
    ],
  },
  {
    key: 'jobs',
    chapter: 'Jobs & CVs', // the chapter of the book it goes with
    title: 'Jobs',
    color: '#e8820c',
    per: 1,
    unit: 'Job',
    items: [
      ['🩺', 'doctor'], ['💉', 'nurse'], ['🦷', 'dentist'], ['🐶', 'vet'],
      ['📚', 'teacher'], ['🍳', 'chef'], ['✈️', 'pilot'], ['🚓', 'police officer'],
      ['🚒', 'fire officer'], ['🚜', 'farmer'], ['🧱', 'builder'], ['🔧', 'car mechanic'],
      ['✂️', 'hairdresser'], ['🛍️', 'shop assistant'], ['🚕', 'taxi driver'], ['🚚', 'driver'],
      ['🚀', 'astronaut'], ['🎭', 'actor'], ['🎤', 'singer'], ['⚽', 'footballer'],
      ['📷', 'photographer'], ['📰', 'journalist'], ['✍️', 'author'], ['🎨', 'artist'],
      ['👗', 'fashion designer'], ['💻', 'website developer'], ['🔬', 'scientist'], ['⚖️', 'lawyer'],
      ['🍽️', 'waiter'], ['💼', 'CEO'], ['🧸', 'childminder'], ['🚑', 'paramedic'],
      ['💆', 'physiotherapist'], ['🚰', 'plumber'], ['💡', 'electrician'], ['⚙️', 'engineer'],
      ['📐', 'architect'], ['🥐', 'baker'], ['📮', 'postal worker'], ['💊', 'pharmacist'],
      ['📖', 'librarian'], ['🧳', 'flight attendant'], ['🛟', 'lifeguard'], ['📹', 'YouTuber'],
      ['🛎️', 'receptionist'], ['🧽', 'cleaner'], ['🗺️', 'tour guide'], ['🎻', 'musician'],
    ],
  },
];
