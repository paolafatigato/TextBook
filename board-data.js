// Board race: the topics for the printable A4 sheets (teacher-games.js, boardGame).
// Every topic has two levels of exactly 12 pictures [emoji, word], to fill a 3 × 4 table.
// Level 1 = easy, common words. Level 2 = harder words. Words are American English.
// To add a topic: add an object to BOARD_SETS (levels: [level 1, level 2], 12 pairs each).
window.BOARD_SETS = [
  { id: 'school', icon: '🎒', color: '#f05f4b', title: 'School things', levels: [
    [['🖊️', 'pen'], ['✏️', 'pencil'], ['📕', 'book'], ['📓', 'notebook'], ['📏', 'ruler'], ['✂️', 'scissors'], ['🎒', 'schoolbag'], ['💻', 'computer'], ['🌍', 'globe'], ['🕐', 'clock'], ['📎', 'paperclip'], ['🎨', 'paints']],
    [['🔬', 'microscope'], ['🧲', 'magnet'], ['📐', 'set square'], ['🖌️', 'paintbrush'], ['📌', 'pushpin'], ['🔔', 'bell'], ['📅', 'calendar'], ['🗺️', 'map'], ['🧪', 'test tube'], ['📊', 'chart'], ['🔦', 'flashlight'], ['🎤', 'microphone']] ] },
  { id: 'clothes', icon: '👕', color: '#4aa8ec', title: 'Clothes', levels: [
    [['👕', 'T-shirt'], ['👖', 'jeans'], ['👗', 'dress'], ['🧢', 'cap'], ['👟', 'sneakers'], ['🧦', 'socks'], ['🧣', 'scarf'], ['🧤', 'gloves'], ['👒', 'hat'], ['👜', 'handbag'], ['👓', 'glasses'], ['🩳', 'shorts']],
    [['👔', 'shirt'], ['🧥', 'coat'], ['👢', 'boots'], ['👠', 'high heels'], ['🩱', 'swimsuit'], ['👚', 'blouse'], ['💍', 'ring'], ['⌚', 'watch'], ['🎩', 'top hat'], ['👛', 'purse'], ['🕶️', 'sunglasses'], ['🩴', 'sandals']] ] },
  { id: 'jobs', icon: '👩‍🔧', color: '#d6334f', title: 'Jobs', levels: [
    [['👩‍⚕️', 'doctor'], ['👨‍🍳', 'chef'], ['👮', 'police officer'], ['👩‍🏫', 'teacher'], ['👨‍🚒', 'firefighter'], ['👨‍✈️', 'pilot'], ['👩‍🌾', 'farmer'], ['👨‍🔧', 'mechanic'], ['🧑‍🎨', 'artist'], ['🧑‍🚀', 'astronaut'], ['🧑‍🎤', 'singer'], ['👩‍⚖️', 'judge']],
    [['👷', 'builder'], ['🧑‍🔬', 'scientist'], ['🧑‍💻', 'programmer'], ['🕵️', 'detective'], ['🧑‍💼', 'office worker'], ['🧑‍🏭', 'factory worker'], ['💂', 'guard'], ['🤡', 'clown'], ['🧑‍🎓', 'student'], ['🦸', 'superhero'], ['🧙', 'wizard'], ['🥷', 'ninja']] ] },
  { id: 'animals', icon: '🐶', color: '#8fb82e', title: 'Animals', levels: [
    [['🐶', 'dog'], ['🐱', 'cat'], ['🐴', 'horse'], ['🐮', 'cow'], ['🐷', 'pig'], ['🐑', 'sheep'], ['🐔', 'chicken'], ['🐰', 'rabbit'], ['🐟', 'fish'], ['🐦', 'bird'], ['🐭', 'mouse'], ['🦆', 'duck']],
    [['🦁', 'lion'], ['🐘', 'elephant'], ['🦒', 'giraffe'], ['🐒', 'monkey'], ['🐍', 'snake'], ['🐢', 'turtle'], ['🦈', 'shark'], ['🐧', 'penguin'], ['🦉', 'owl'], ['🐝', 'bee'], ['🦋', 'butterfly'], ['🐸', 'frog']] ] },
  { id: 'food', icon: '🍎', color: '#e0902c', title: 'Food', levels: [
    [['🍎', 'apple'], ['🍌', 'banana'], ['🍞', 'bread'], ['🧀', 'cheese'], ['🥚', 'egg'], ['🥛', 'milk'], ['🍕', 'pizza'], ['🍦', 'ice cream'], ['🍪', 'cookie'], ['🍇', 'grapes'], ['🍓', 'strawberry'], ['🥕', 'carrot']],
    [['🍅', 'tomato'], ['🥔', 'potato'], ['🧅', 'onion'], ['🌽', 'corn'], ['🥦', 'broccoli'], ['🍍', 'pineapple'], ['🍉', 'watermelon'], ['🥪', 'sandwich'], ['🍔', 'hamburger'], ['🍟', 'french fries'], ['🍰', 'cake'], ['🍫', 'chocolate']] ] },
  { id: 'home', icon: '🛋️', color: '#3aa04a', title: 'Home', levels: [
    [['🛏️', 'bed'], ['🚪', 'door'], ['🪑', 'chair'], ['🛋️', 'sofa'], ['🚿', 'shower'], ['🛁', 'bathtub'], ['🪟', 'window'], ['💡', 'lamp'], ['📺', 'TV'], ['🔑', 'key'], ['🚽', 'toilet'], ['🪞', 'mirror']],
    [['🧹', 'broom'], ['🪣', 'bucket'], ['🧺', 'basket'], ['🧸', 'teddy bear'], ['🕯️', 'candle'], ['🖼️', 'picture'], ['🪴', 'plant'], ['🔌', 'plug'], ['🧽', 'sponge'], ['🪥', 'toothbrush'], ['⏰', 'alarm clock'], ['🧼', 'soap']] ] },
  { id: 'sports', icon: '⚽', color: '#12a4a4', title: 'Sports', levels: [
    [['⚽', 'soccer'], ['🏀', 'basketball'], ['🎾', 'tennis'], ['🏊', 'swimming'], ['🚴', 'cycling'], ['🏃', 'running'], ['⛷️', 'skiing'], ['🏐', 'volleyball'], ['🏓', 'ping-pong'], ['🥊', 'boxing'], ['🏈', 'football'], ['⛸️', 'ice skating']],
    [['🤸', 'gymnastics'], ['🏋️', 'weightlifting'], ['🧗', 'climbing'], ['🏄', 'surfing'], ['🤺', 'fencing'], ['🏇', 'horse riding'], ['⛳', 'golf'], ['🏹', 'archery'], ['🥋', 'judo'], ['🤾', 'handball'], ['🛹', 'skateboarding'], ['🏂', 'snowboarding']] ] },
  { id: 'transport', icon: '🚗', color: '#7a5cc9', title: 'Transport', levels: [
    [['🚗', 'car'], ['🚌', 'bus'], ['🚲', 'bike'], ['✈️', 'plane'], ['🚂', 'train'], ['🚢', 'ship'], ['🚁', 'helicopter'], ['🚑', 'ambulance'], ['🚒', 'fire truck'], ['🛵', 'scooter'], ['🚕', 'taxi'], ['🚀', 'rocket']],
    [['🚜', 'tractor'], ['🏍️', 'motorcycle'], ['🛶', 'canoe'], ['🚠', 'cable car'], ['🚇', 'subway'], ['🛴', 'kick scooter'], ['⛵', 'sailboat'], ['🚚', 'truck'], ['🚓', 'police car'], ['🛷', 'sled'], ['🚤', 'speedboat'], ['🚋', 'tram']] ] },
];
