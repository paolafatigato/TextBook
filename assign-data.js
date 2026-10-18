// "Assign work" (For the teacher): one chapter per topic, built by assign-pages.js.
// Each topic opens with its list (left page) and the page to give the things on it to a class (right page);
// every list the teacher saves becomes a page after it, with its date.
//
// To add something from the code: add it to `items` ('word' or ['emoji', 'word']).
// To add a topic: add an entry here (a new `key`, never used before): its chapter appears by itself.
//   key    the name of the topic: never change it, the saved lists are kept under it
//   per    how many things each student gets (the teacher can change it on the page)
//   unit   the heading of the column on the lists
// Things added or removed on the page by the teacher are kept in the cloud, on top of these lists.

const ASSIGN_TOPICS = [
  {
    key: 'jobs',
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
  {
    key: 'personality',
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
    key: 'pictures',
    title: 'Pictures',
    color: '#4aa8ec',
    per: 1,
    unit: 'Picture',
    items: Array.from({ length: 20 }, (_, i) => `picture ${i + 1}`),
  },
];
