// Holiday Bingo ([summer-bingo:L]): the 12 "find someone who…" cards. The student picks the card the teacher
// gave them (the .opt "su-bg-card"), this writes its 16 squares; a full row, column or diagonal says BINGO.
// The squares clicked (.toggle) and the names (.fill) are saved by script.js, like every other answer.

(() => {
  const grid = document.getElementById('su-bg-grid');
  if (!grid) return;

  // the cards in the order of the printed sheets, row by row
  const CARDS = [
    { pic: '⭐', sq: [
      'spent the summer with a brother', 'visited the mountains', 'swam in a lake', 'swam at least 5 times',
      'got sunburned', 'played tennis', 'took the plane', 'had pizza by the sea',
      'watched a whole TV series', 'saw fireworks', 'learned a new skill', 'made a new friend',
      'got a haircut', 'posted more than 10 photos on social media', 'walked barefoot in the sand', 'made a painting'] },
    { pic: '🩴', sq: [
      'spent one week with a grandma', "didn't go further than 2 hours from home", 'went hiking in nature', 'visited a new city',
      'ate ice cream', 'played beach volleyball', 'took the train', 'built a sand volcano',
      'finished a video game', 'got sunburned', 'kissed someone for the first time', 'read at least two books',
      'had a birthday', 'spent a whole day without using the phone', 'saw a teacher “in the wild”', 'got stung by a jellyfish'] },
    { pic: '🦩', sq: [
      'visited their cousins', 'traveled for more than 3 hours', 'camped in a tent', 'played beach volleyball',
      'ate popsicles', 'went to a place they know very well', 'spent one night home alone', 'collected seashells',
      'watched a horror movie', 'went on a boat', 'tried paddle boarding', 'read at least two books',
      'had a birthday', 'held their breath underwater for 20 seconds', 'saw a teacher “in the wild”', 'got stung by a jellyfish'] },
    { pic: '🏄', sq: [
      'spent one month with a sister', 'never left town', 'camped in a tent', 'played beach volleyball',
      'ate coconut', 'went to a new place', 'visited a different continent', 'collected seashells',
      'went to the hospital', 'finished the homework in the first week', 'tried surfing', 'did crossword puzzles',
      'had a birthday', 'saw some snow', 'texted you', 'went snorkeling'] },
    { pic: '📷', sq: [
      'took more than 10 pictures', 'tried a new food for the first time', 'stayed in a camper', 'played beach soccer',
      'ate coconut', 'found money on the ground', 'visited a different country', 'built sandcastles',
      'got a fever', 'finished the homework just yesterday', 'tried something scary', 'cooked for 3 people',
      'went to a birthday party', 'saw some snow', 'texted you', 'got separated from their siblings'] },
    { pic: '🏐', sq: [
      'forgot to pack something', 'tried a new food for the first time', 'stayed in a bungalow', 'played with an inflatable toy',
      'went to bed past 2 am', 'had a nosebleed', 'visited a place whose name starts with M', 'dug a hole in the sand',
      'got a fever', 'finished the homework just yesterday', 'went to the cinema twice', 'ate mussels',
      'played Minecraft', 'saw some snow', 'texted a classmate', 'got separated from their parents'] },
    { pic: '🕶️', sq: [
      'had no air conditioning', 'saw a special fish', 'stayed in a hotel', 'played with an inflatable toy',
      'went to bed past 2 am', 'had a nosebleed', 'visited a place whose name starts with L', 'built a rock pile',
      'got a fever', "read a book you haven't read", "watched a movie they didn't enjoy", 'had broth',
      'played Fortnite', 'opened their eyes underwater', 'hung out with a schoolmate', 'saw their great-grandparents'] },
    { pic: '🏰', sq: [
      'had no air conditioning', 'saw a special fish', 'built a sandcastle', 'played with an inflatable toy',
      'went to bed past 2 am', 'had a nosebleed', 'visited a place whose name starts with C', 'had “the best summer of their life”',
      'started a new relationship', "read a book you haven't read", 'watched a movie they loved', 'learned a new TikTok dance',
      'played cards', 'opened their eyes underwater', 'hung out with a classmate', 'kept a diary for a week'] },
    { pic: '🍦', sq: [
      'worked', 'saw a special fish', 'built a sandcastle', 'played with an inflatable toy',
      'went to bed past 2 am', 'visited a place whose name starts with V', 'babysat for a day', 'had “the worst summer of their life”',
      'started a new relationship', 'read a book you love', 'ate ice cream twice in a day', 'learned a new TikTok dance',
      'played cards', 'opened their eyes underwater', 'hung out with a classmate', 'recommended a book to somebody'] },
    { pic: '🍨', sq: [
      'ate food from the ground', 'got a tattoo', 'built a sandcastle', 'went snorkeling',
      'went to bed past 2 am', 'visited a place whose name starts with G', 'babysat for a day', 'fell asleep on the beach',
      'started a new relationship', 'read a book they would recommend', 'called you', 'spent a month without TikTok',
      'played cards', 'opened their eyes underwater', 'saw a weird animal', 'helped somebody with homework'] },
    { pic: '🧳', sq: [
      'traveled with a bag without wheels', 'changed hairstyle', 'played in the street', 'went snorkeling',
      'watched a romantic movie', 'had a date', 'washed the dishes for a month', 'fell asleep at the pool',
      'painted with watercolors', 'read a book they would recommend', 'called you', 'spent a month without Instagram',
      'played cards', 'spoke another language', 'touched an exotic animal', 'helped somebody with homework'] },
    { pic: '🏷️', sq: [
      'brought too many things in their bag', 'changed hairstyle', 'played in the street', 'went snorkeling',
      "did something they weren't supposed to", 'had a date', 'washed the dishes for a month', 'swam in a pool',
      'hiked up a mountain', 'read a comic', 'spent the summer with a cousin', 'spent a month without Instagram',
      'played cards', 'spoke another language', 'touched an exotic animal', 'finished their homework in July'] },
  ];

  const LINES = [
    [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
    [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
    [0, 5, 10, 15], [3, 6, 9, 12],
  ];

  const squares = [...grid.querySelectorAll('.su-sq')];
  const cells = [...grid.querySelectorAll('.su-cell')];
  const picker = document.getElementById('su-bg-card');
  const pic = document.getElementById('su-bg-pic');
  const win = document.getElementById('su-bg-win');

  // card 1 until the student picks one
  const cardNo = () => {
    const n = parseInt(window.book.getSaved()['su-bg-card'], 10);
    return n >= 1 && n <= CARDS.length ? n : 1;
  };

  function paint() {
    const card = CARDS[cardNo() - 1];
    squares.forEach((b, i) => { b.textContent = card.sq[i]; });
    pic.textContent = card.pic;
    const done = LINES.filter(l => l.every(i => squares[i].classList.contains('on')));
    cells.forEach((c, i) => c.classList.toggle('win', done.some(l => l.includes(i))));
    win.classList.toggle('show', done.length > 0);
  }

  // script.js has already listened to these clicks (it saves them), so this runs after it
  picker.querySelectorAll('button').forEach(b => b.addEventListener('click', paint));
  squares.forEach(b => b.addEventListener('click', paint));
  paint();
  // script.js puts the saved answers back after the page has loaded
  window.addEventListener('load', () => setTimeout(paint));
  document.getElementById('clearBtn')?.addEventListener('click', () => setTimeout(paint));
})();
