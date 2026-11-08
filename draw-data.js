// Draw blind (teacher game ✏️, teacher-games.js drawGame): the word pairs for the cards.
// Every card has two words: [easy to draw (1 point), hard to draw (2 points)].
// To add a topic: add an object to DRAW_SETS. To add cards: add a pair ['easy', 'hard'] to its `cards`. Words are American English.
window.DRAW_SETS = [
  { id: 'home', icon: '🏠', color: '#2f9e6f', title: 'Home', cards: [
    ['bed', 'wardrobe'], ['table', 'bookcase'], ['chair', 'armchair'], ['door', 'doorbell'], ['window', 'curtains'], ['lamp', 'chandelier'],
    ['sofa', 'cushion'], ['TV', 'remote control'], ['stairs', 'balcony'], ['roof', 'chimney'], ['kitchen', 'fridge'], ['bath', 'shower'],
    ['clock', 'mirror'], ['carpet', 'blanket'], ['key', 'lock'], ['plate', 'frying pan'], ['spoon', 'knife and fork'], ['garden', 'fence'],
    ['bedroom', 'dresser'], ['toilet', 'washing machine'], ['cup', 'teapot'], ['floor', 'ceiling'] ] },
  { id: 'person', icon: '🧍', color: '#e0584a', title: 'Face and body', cards: [
    ['eye', 'eyebrow'], ['nose', 'nostril'], ['mouth', 'tongue'], ['hand', 'fingernail'], ['foot', 'ankle'], ['hair', 'ponytail'],
    ['arm', 'elbow'], ['leg', 'knee'], ['head', 'neck'], ['ear', 'earring'], ['tooth', 'smile'], ['finger', 'thumb'],
    ['heart', 'brain'], ['beard', 'moustache'], ['face', 'wrinkles'], ['back', 'shoulder'], ['stomach', 'belly button'], ['skeleton', 'skull'],
    ['glasses', 'braces'], ['freckles', 'dimples'], ['curly hair', 'bald'], ['tall', 'chubby'] ] },
  { id: 'clothes', icon: '👕', color: '#4aa8ec', title: 'Clothes', cards: [
    ['T-shirt', 'sweater'], ['jeans', 'overalls'], ['dress', 'skirt'], ['hat', 'beanie'], ['socks', 'tights'], ['shoes', 'high heels'],
    ['scarf', 'gloves'], ['coat', 'raincoat'], ['shorts', 'swimsuit'], ['cap', 'helmet'], ['belt', 'suspenders'], ['pocket', 'zipper'],
    ['bag', 'backpack'], ['boots', 'flip-flops'], ['tie', 'bow tie'], ['umbrella', 'sunglasses'], ['pajamas', 'slippers'], ['watch', 'bracelet'],
    ['button', 'collar'], ['jacket', 'vest'], ['necklace', 'ring'], ['uniform', 'suit'] ] },
  { id: 'jobs', icon: '👩‍🔧', color: '#d6334f', title: 'Jobs', cards: [
    ['doctor', 'dentist'], ['teacher', 'professor'], ['cook', 'waiter'], ['farmer', 'gardener'], ['pilot', 'astronaut'], ['singer', 'conductor'],
    ['painter', 'photographer'], ['builder', 'plumber'], ['police officer', 'detective'], ['firefighter', 'lifeguard'], ['driver', 'mechanic'], ['nurse', 'vet'],
    ['baker', 'butcher'], ['soldier', 'sailor'], ['clown', 'magician'], ['king', 'judge'], ['hairdresser', 'tailor'], ['fisherman', 'shepherd'],
    ['programmer', 'scientist'], ['postman', 'cashier'], ['dancer', 'acrobat'], ['writer', 'journalist'] ] },
  { id: 'animals', icon: '🐶', color: '#8fb82e', title: 'Animals', cards: [
    ['dog', 'puppy'], ['cat', 'kitten'], ['fish', 'shark'], ['bird', 'owl'], ['cow', 'goat'], ['horse', 'zebra'],
    ['pig', 'hedgehog'], ['duck', 'swan'], ['rabbit', 'squirrel'], ['mouse', 'bat'], ['snake', 'crocodile'], ['frog', 'turtle'],
    ['elephant', 'giraffe'], ['lion', 'tiger'], ['monkey', 'gorilla'], ['bee', 'butterfly'], ['spider', 'octopus'], ['sheep', 'camel'],
    ['whale', 'dolphin'], ['penguin', 'flamingo'], ['snail', 'worm'], ['wolf', 'fox'] ] },
  { id: 'food', icon: '🍕', color: '#e8820c', title: 'Food and drinks', cards: [
    ['apple', 'pineapple'], ['banana', 'grapes'], ['pizza', 'lasagna'], ['egg', 'omelette'], ['cake', 'cupcake'], ['ice cream', 'milkshake'],
    ['bread', 'sandwich'], ['cheese', 'butter'], ['milk', 'yogurt'], ['carrot', 'broccoli'], ['tomato', 'pepper'], ['potato', 'french fries'],
    ['pasta', 'spaghetti'], ['chicken', 'sausage'], ['fish', 'shrimp'], ['hamburger', 'hot dog'], ['coffee', 'teapot'], ['juice', 'bottle of water'],
    ['cookie', 'donut'], ['soup', 'salad'], ['watermelon', 'strawberry'], ['honey', 'jam'] ] },
  { id: 'town', icon: '🏙️', color: '#12a4a4', title: 'Town and transport', cards: [
    ['car', 'truck'], ['bus', 'tram'], ['bike', 'scooter'], ['train', 'subway'], ['plane', 'helicopter'], ['boat', 'submarine'],
    ['house', 'skyscraper'], ['school', 'library'], ['shop', 'supermarket'], ['bridge', 'tunnel'], ['road', 'roundabout'], ['traffic light', 'zebra crossing'],
    ['church', 'castle'], ['hospital', 'ambulance'], ['park', 'fountain'], ['bank', 'post office'], ['station', 'airport'], ['street lamp', 'bench'],
    ['cinema', 'theater'], ['restaurant', 'pizzeria'], ['police car', 'fire engine'], ['market', 'swimming pool'] ] },
  { id: 'school', icon: '🎒', color: '#f05f4b', title: 'School, sports and free time', cards: [
    ['pen', 'highlighter'], ['book', 'dictionary'], ['desk', 'blackboard'], ['ruler', 'compass'], ['scissors', 'glue'], ['backpack', 'pencil case'],
    ['ball', 'net'], ['soccer', 'rugby'], ['basketball', 'volleyball'], ['swimming', 'diving'], ['running', 'jumping'], ['tennis', 'badminton'],
    ['guitar', 'violin'], ['piano', 'drums'], ['camera', 'headphones'], ['phone', 'laptop'], ['game', 'chess'], ['party', 'balloon'],
    ['gift', 'birthday cake'], ['tent', 'campfire'], ['skiing', 'snowboarding'], ['fishing', 'hiking'] ] },
];
