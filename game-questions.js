// Questions for the Conversation Game (pp. 34-35), taken from GooseGame · Getting to Know Each Other.
// A string is an open question; an object has options and the right answer.
const GAME_QUESTIONS = [
  "JOIN THESE PAIRS WITH THE POSSESSIVE 'S OR ': THE BOYS / BIKES",
  "JOIN THESE PAIRS WITH THE POSSESSIVE 'S OR ': MY PARENTS / CAR",
  "JOIN THESE PAIRS WITH THE POSSESSIVE 'S OR ': THE TEACHER / PURSE",
  "JOIN THESE PAIRS WITH THE POSSESSIVE 'S OR ': EMILY / BROTHER",
  "JOIN THESE PAIRS WITH THE POSSESSIVE 'S OR ': THE TWINS / BEDROOM",
  {
    "text": "THE BOYS' / BOY'S JACKET IS BLUE.",
    "options": [
      "THE BOYS'",
      "BOY'S"
    ],
    "answer": "THE BOYS'"
  },
  {
    "text": "YOUR PARENTS' / PARENT'S ROOM IS UPSTAIRS.",
    "options": [
      "PARENTS'",
      "PARENT'S"
    ],
    "answer": "PARENTS'"
  },
  {
    "text": "THE DOG'S / DOGS' FOOD IS ON THE TABLE.",
    "options": [
      "THE DOG'S",
      "DOGS'"
    ],
    "answer": "THE DOG'S"
  },
  {
    "text": "THEIR AUNT'S / AUNTS' SISTER IS SHY.",
    "options": [
      "AUNT'S",
      "AUNTS'"
    ],
    "answer": "AUNT'S"
  },
  {
    "text": "YOUR SISTERS' / SISTER'S GIRLFRIEND IS CHATTY.",
    "options": [
      "SISTERS'",
      "SISTER'S"
    ],
    "answer": "SISTERS'"
  },
  {
    "text": "OUR TURTLES' / TURTLE'S NAME IS GRONK.",
    "options": [
      "TURTLES'",
      "TURTLE'S"
    ],
    "answer": "TURTLE'S"
  },
  "WRITE THE POSSESSIVE FORM: THE DOG OF LUCA",
  "WRITE THE POSSESSIVE FORM: THE SHOES OF THE GIRLS",
  "WRITE THE POSSESSIVE FORM: THE BEDROOM OF MY BROTHER",
  "WRITE THE POSSESSIVE FORM: THE BIKE OF YOUR DAD",
  "WRITE THE POSSESSIVE FORM: THE FRIENDS OF MARIA",
  "WRITE THE POSSESSIVE FORM: THE TOYS OF THE BABIES",
  "WRITE THE 3RD PERSON SINGULAR: RUN, STUDY, WATCH.",
  "WRITE THE 3RD PERSON SINGULAR: CARRY, FIX, WASH.",
  "WRITE THE 3RD PERSON SINGULAR: FLY, TEACH, CRY.",
  {
    "text": "SHE GO / GOES TO BED AT 10.",
    "options": [
      "GO",
      "GOES"
    ],
    "answer": "GOES"
  },
  {
    "text": "HE WATCH / WATCHES TV EVERY DAY.",
    "options": [
      "WATCH",
      "WATCHES"
    ],
    "answer": "WATCHES"
  },
  {
    "text": "THE TEACHER TEACH / TEACHES MATHS.",
    "options": [
      "TEACH",
      "TEACHES"
    ],
    "answer": "TEACHES"
  },
  {
    "text": "DO / DOES YOU DO DRAMA?",
    "options": [
      "DO",
      "DOES"
    ],
    "answer": "DO"
  },
  {
    "text": "THE DOG LIKE / LIKES APPLES.",
    "options": [
      "LIKE",
      "LIKES"
    ],
    "answer": "LIKES"
  },
  {
    "text": "THE TEACHERS NEED / NEEDS A DEGREE.",
    "options": [
      "NEED",
      "NEEDS"
    ],
    "answer": "NEED"
  },
  "CHANGE TO THE NEGATIVE: I LIKE HORROR FILMS.",
  "CHANGE TO THE NEGATIVE: SHE PLAYS THE PIANO EVERY DAY.",
  "CHANGE TO THE NEGATIVE: WE READ BOOKS IN ENGLISH.",
  "CHANGE TO THE NEGATIVE: MY DOG SLEEPS ON MY BED.",
  "CHANGE TO THE NEGATIVE: TOM EATS VEGETABLES.",
  "CHANGE TO THE NEGATIVE: ANNA STUDIES FRENCH.",
  "CHANGE TO THE NEGATIVE: MY BABY BROTHER CRIES AT NIGHT.",
  "CHANGE TO THE AFFIRMATIVE: THEY DON'T PLAY TENNIS.",
  "CHANGE TO THE AFFIRMATIVE: HE DOESN'T WATCH CARTOONS.",
  "CHANGE TO THE INTERROGATIVE: YOU LIKE MUSIC.",
  "CHANGE TO THE INTERROGATIVE: SHE PLAYS THE PIANO.",
  "CHANGE TO THE INTERROGATIVE: THEY LIVE IN MILAN.",
  "CHANGE TO THE INTERROGATIVE: WE GO TO THE SAME GYM.",
  "CHANGE TO THE INTERROGATIVE: YOU GO TO BED AT 10.",
  "CHANGE TO THE INTERROGATIVE: HE HAS A DOG.",
  {
    "text": "DO / DOES LINA DO VOLUNTARY WORK?",
    "options": [
      "DO",
      "DOES"
    ],
    "answer": "DOES"
  },
  {
    "text": "DO / DOES YOUR SISTER LISTEN TO ROCK MUSIC?",
    "options": [
      "DO",
      "DOES"
    ],
    "answer": "DOES"
  },
  {
    "text": "DO / DOES SHE PLAY IN YOUR TEAM?",
    "options": [
      "DO",
      "DOES"
    ],
    "answer": "DOES"
  },
  {
    "text": "DO / DOES YOUR FRIEND GO TO THE DEBATING CLUB?",
    "options": [
      "DO",
      "DOES"
    ],
    "answer": "DOES"
  },
  {
    "text": "DO / DOES YOUR CLASS STUDY GERMAN?",
    "options": [
      "DO",
      "DOES"
    ],
    "answer": "DOES"
  },
  {
    "text": "DO / DOES THEY PLAY IN A BAND?",
    "options": [
      "DO",
      "DOES"
    ],
    "answer": "DO"
  },
  "COMPLETE WITH POSSESSIVE ADJECTIVE: SHE HAS ___ PHONE IN HER HAND.",
  "COMPLETE WITH POSSESSIVE ADJECTIVE: THE CAT EATS ___ FOOD.",
  "COMPLETE WITH POSSESSIVE ADJECTIVE: ___ NAME IS LUCA.",
  "COMPLETE WITH POSSESSIVE ADJECTIVE: WE DO ___ HOMEWORK IN THE EVENING.",
  "COMPLETE WITH POSSESSIVE ADJECTIVE: TOM AND ANNA CLEAN ___ BIKES.",
  "COMPLETE WITH POSSESSIVE ADJECTIVE: ___ NAME IS JULIE.",
  {
    "text": "DO YOUR COUSINS HAVE A PET?",
    "options": [
      "YES, THEY DOES.",
      "NO, THEY DON'T.",
      "YES, HE DOES."
    ],
    "answer": "NO, THEY DON'T."
  },
  {
    "text": "DOES YOUR DAD WORK AT THE WEEKEND?",
    "options": [
      "YES, HE DOES.",
      "YES, THEY DO.",
      "NO, SHE DOESN'T."
    ],
    "answer": "YES, HE DOES."
  },
  {
    "text": "DO YOU AND YOUR SISTER WALK TO SCHOOL?",
    "options": [
      "YES, I DOES.",
      "NO, THEY DOESN'T.",
      "YES, WE DO."
    ],
    "answer": "YES, WE DO."
  },
  {
    "text": "DOES THE CAT SLEEP IN YOUR BED?",
    "options": [
      "YES, THEY DO.",
      "YES, IT DOES.",
      "NO, YOU DON'T."
    ],
    "answer": "YES, IT DOES."
  },
  {
    "text": "DO YOU LIKE READING?",
    "options": [
      "YES, I DO.",
      "NO, HE DOESN'T.",
      "YES, SHE DOES."
    ],
    "answer": "YES, I DO."
  },
  {
    "text": "DOES YOUR BEST FRIEND PLAY VIDEO GAMES?",
    "options": [
      "YES, HE DOES.",
      "NO, THEY DON'T.",
      "YES, YOU DO."
    ],
    "answer": "YES, HE DOES."
  },
  {
    "text": "DOES YOUR TEACHER LIVE NEAR THE SCHOOL?",
    "options": [
      "YES, SHE DOES.",
      "NO, YOU DON'T.",
      "YES, WE DO."
    ],
    "answer": "YES, SHE DOES."
  },
  {
    "text": "DO YOUR FRIENDS PLAY FOOTBALL?",
    "options": [
      "NO, HE DOESN'T.",
      "YES, THEY DO.",
      "YES, SHE DOES."
    ],
    "answer": "YES, THEY DO."
  },
  {
    "text": "DOES YOUR MUM LIKE PIZZA?",
    "options": [
      "YES, SHE DOES.",
      "NO, THEY DON'T.",
      "YES, WE DO."
    ],
    "answer": "YES, SHE DOES."
  }
];
