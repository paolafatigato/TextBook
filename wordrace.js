// Photo words (teacher-only scaffolding spread [scaf-dp-wordrace]).
// A photo + a 5-minute timer; pupils write words in their notebooks. At the end the teacher clicks
// "Reveal bonus": 2 words worth 3 points and 4 words worth 2 points, drawn at random from the photo's pool
// (every other word that is really in the photo is worth 1 point).
// To add a photo: copy the image into img/wordrace/ and add an entry to PHOTOS (w = word, alt = also accepted).

(() => {
  const spread = document.querySelector('[data-id="scaf-dp-wordrace"]');
  if (!spread) return;

  const SECONDS = 300, N3 = 2, N2 = 4;

  const PHOTOS = [ // p3 = rarer or harder words (3 points), p2 = medium words (2 points)
    {
      src: 'img/wordrace/festival.jpg', title: 'The festival',
      p3: [ { w: 'nurse' }, { w: 'costume', alt: 'uniform' }, { w: 'bucket hat' }, { w: 'mustache', alt: 'moustache' }, { w: 'tattoo' }, { w: 'fan' }, { w: 'afro' }, { w: 'heart' }, { w: 'peace sign', alt: 'victory sign' }, { w: 'festival', alt: 'concert' }, { w: 'fanny pack', alt: 'belt bag; bum bag' }, { w: 'bracelet', alt: 'wristband' }, { w: 'bun' }, { w: 'cross', alt: 'red cross' } ],
      p2: [ { w: 'cap' }, { w: 'sunglasses', alt: 'glasses' }, { w: 'beard' }, { w: 'beer', alt: 'cup' }, { w: 'watch' }, { w: 'necklace' }, { w: 'earrings', alt: 'earring' }, { w: 'bag', alt: 'backpack' }, { w: 'jeans' }, { w: 'belt' }, { w: 'phone' }, { w: 'T-shirt', alt: 'shirt' }, { w: 'jacket' }, { w: 'curly' }, { w: 'blonde' }, { w: 'crowd' }, { w: 'dancing' }, { w: 'smiling' }, { w: 'laughing' }, { w: 'drinking' }, { w: 'holding' }, { w: 'waving', alt: 'raising arms' }, { w: 'sunny' }, { w: 'crowded' }, { w: 'happy' }, { w: 'hair' }, { w: 'arms' }, { w: 'people' }, { w: 'man' }, { w: 'woman' } ],
    },
    {
      src: 'img/wordrace/street-vendor.jpg', title: 'The street',
      p3: [ { w: 'conical hat', alt: 'straw hat' }, { w: 'vendor', alt: 'seller' }, { w: 'basket' }, { w: 'scooter', alt: 'motorbike' }, { w: 'helmet' }, { w: 'traffic' }, { w: 'plastic bag' }, { w: 'handlebars' }, { w: 'sandals' }, { w: 'ponytail' }, { w: 'awning' }, { w: 'market' }, { w: 'oranges', alt: 'tangerines' } ],
      p2: [ { w: 'bike', alt: 'bicycle' }, { w: 'fruit' }, { w: 'hat' }, { w: 'shirt' }, { w: 'pants', alt: 'trousers' }, { w: 'bag' }, { w: 'motorcycle' }, { w: 'street', alt: 'road' }, { w: 'walking' }, { w: 'pushing' }, { w: 'riding' }, { w: 'carrying' }, { w: 'selling' }, { w: 'wheel' }, { w: 'tree' }, { w: 'people' }, { w: 'woman' }, { w: 'man' }, { w: 'red' }, { w: 'green' }, { w: 'busy' }, { w: 'crowded' }, { w: 'city' }, { w: 'sign' }, { w: 'orange' }, { w: 'yellow' } ],
    },
    {
      src: 'img/wordrace/school-kids.jpg', title: 'The school',
      p3: [ { w: 'uniform' }, { w: 'hijab', alt: 'headscarf' }, { w: 'backpack' }, { w: 'skirt' }, { w: 'pointing' }, { w: 'trophies', alt: 'cups; awards' }, { w: 'flower', alt: 'orchid' }, { w: 'badge' }, { w: 'shorts' }, { w: 'balcony' }, { w: 'courtyard', alt: 'school yard' }, { w: 'linking arms', alt: 'arm in arm' }, { w: 'display case', alt: 'cabinet' }, { w: 'socks' } ],
      p2: [ { w: 'children', alt: 'kids' }, { w: 'girl' }, { w: 'girls' }, { w: 'boy' }, { w: 'school' }, { w: 'smiling' }, { w: 'laughing' }, { w: 'walking' }, { w: 'looking' }, { w: 'shirt' }, { w: 'white' }, { w: 'red' }, { w: 'blue' }, { w: 'building' }, { w: 'wall' }, { w: 'friends' }, { w: 'happy' }, { w: 'hair' }, { w: 'bag' }, { w: 'shoes' }, { w: 'together' }, { w: 'tiles' }, { w: 'plants' } ],
    },
    {
      src: 'img/wordrace/restaurant.jpg', title: 'The restaurant',
      p3: [ { w: 'napkin' }, { w: 'bracelet' }, { w: 'ring' }, { w: 'cucumber' }, { w: 'carrot' }, { w: 'lemon' }, { w: 'olives' }, { w: 'leaves', alt: 'lettuce' }, { w: 'wine' }, { w: 'fork' }, { w: 'bowl' }, { w: 'wooden table', alt: 'wood' }, { w: 'sleeve' }, { w: 'vegetables' } ],
      p2: [ { w: 'salad' }, { w: 'plate' }, { w: 'glass' }, { w: 'eating' }, { w: 'food' }, { w: 'table' }, { w: 'hand' }, { w: 'women', alt: 'girls' }, { w: 'friends' }, { w: 'drinking' }, { w: 'holding' }, { w: 'red' }, { w: 'green' }, { w: 'white' }, { w: 'healthy' }, { w: 'delicious' }, { w: 'restaurant' }, { w: 'knife' }, { w: 'hair' }, { w: 'lunch', alt: 'dinner' }, { w: 'orange' }, { w: 'tasting' } ],
    },
    {
      src: 'img/wordrace/hotel.jpg', title: 'The hotel',
      p3: [ { w: 'receptionist', alt: 'reception' }, { w: 'snowboard' }, { w: 'goggles' }, { w: 'helmet' }, { w: 'waistcoat', alt: 'vest' }, { w: 'bow tie' }, { w: 'lamp', alt: 'light bulb' }, { w: 'clock' }, { w: 'flowers' }, { w: 'parka', alt: 'coat; fur hood' }, { w: 'beard' }, { w: 'ponytail' }, { w: 'sign' }, { w: 'desk' }, { w: 'plant' }, { w: 'guest', alt: 'tourist' } ],
      p2: [ { w: 'man' }, { w: 'woman' }, { w: 'coat' }, { w: 'jacket' }, { w: 'smiling' }, { w: 'talking' }, { w: 'pointing' }, { w: 'standing' }, { w: 'working' }, { w: 'light' }, { w: 'black' }, { w: 'white' }, { w: 'blue' }, { w: 'wall' }, { w: 'door' }, { w: 'books' }, { w: 'hotel' }, { w: 'hair' }, { w: 'hand' }, { w: 'people' }, { w: 'sports', alt: 'skiing' } ],
    },
    {
      src: 'img/wordrace/fashion-show.jpg', title: 'The fashion show',
      p3: [ { w: 'runway', alt: 'catwalk' }, { w: 'model' }, { w: 'dress' }, { w: 'audience' }, { w: 'spotlights', alt: 'lights' }, { w: 'screen' }, { w: 'handbag', alt: 'bag' }, { w: 'belt' }, { w: 'sleeves' }, { w: 'reflection' }, { w: 'camera' }, { w: 'stage' }, { w: 'fashion' }, { w: 'high heels', alt: 'shoes' }, { w: 'scarf' }, { w: 'glasses' } ],
      p2: [ { w: 'woman' }, { w: 'people' }, { w: 'red' }, { w: 'long' }, { w: 'night' }, { w: 'dark' }, { w: 'sitting' }, { w: 'standing' }, { w: 'walking' }, { w: 'watching' }, { w: 'taking photos' }, { w: 'phone' }, { w: 'smiling' }, { w: 'trees' }, { w: 'building' }, { w: 'black' }, { w: 'blue' }, { w: 'big' }, { w: 'beautiful' }, { w: 'photographer' } ],
    },
    {
      src: 'img/wordrace/cafe.jpg', title: 'The cafe',
      p3: [ { w: 'laptop' }, { w: 'headphones' }, { w: 'saucer' }, { w: 'tattoo' }, { w: 'notebook' }, { w: 'pendant lamp', alt: 'lamp' }, { w: 'hanging plants', alt: 'plants' }, { w: 'menu' }, { w: 'poster' }, { w: 'sweatshirt' }, { w: 'bench', alt: 'bench seat' }, { w: 'window', alt: 'big window' }, { w: 'curly' } ],
      p2: [ { w: 'cafe', alt: 'coffee shop' }, { w: 'coffee' }, { w: 'table' }, { w: 'chair' }, { w: 'cup' }, { w: 'plant' }, { w: 'phone' }, { w: 'reading' }, { w: 'working' }, { w: 'typing' }, { w: 'sitting' }, { w: 'drinking' }, { w: 'holding' }, { w: 'wearing' }, { w: 'sunny' }, { w: 'book' }, { w: 'woman' }, { w: 'man' }, { w: 'girl' }, { w: 'glasses' }, { w: 'hair' }, { w: 'light' }, { w: 'shirt' }, { w: 'people' }, { w: 'relaxed' }, { w: 'quiet' } ],
    },
  ];

  const $ = s => spread.querySelector(s);
  const img = $('.wr-photo-wrap img'), time = $('.wr-time'), clock = $('.wr-clock'), bar = $('.wr-bar i');
  const bStart = $('.wr-start'), bReset = $('.wr-reset'), bReveal = $('.wr-reveal'), bNew = $('.wr-new');
  const grid = $('.wr-bonus'), zoom = $('.wr-zoom');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  document.body.appendChild(zoom); // pages are size containers: a fixed overlay must live outside them

  let photo = 0, left = SECONDS, endAt = 0, tick = 0, revealed = false;

  const pick = (arr, n) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, n);
  };
  const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, .35, .7].forEach(t => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + t + .3);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + .3);
      });
    } catch (e) { /* no sound: fine */ }
  }

  function draw() {
    time.textContent = fmt(left);
    bar.style.transform = 'scaleX(' + (left / SECONDS) + ')';
    clock.classList.toggle('low', left <= 30 && left > 0);
    clock.classList.toggle('done', left === 0);
    bReveal.classList.toggle('ready', left === 0 && !revealed);
  }

  function stop() { clearInterval(tick); tick = 0; bStart.textContent = left === 0 ? '▶ Start' : '▶ Continue'; }

  function run() {
    if (left === 0) left = SECONDS;
    endAt = Date.now() + left * 1000;
    bStart.textContent = '⏸ Pause';
    tick = setInterval(() => {
      left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      draw();
      if (left === 0) { stop(); bStart.textContent = '▶ Start'; beep(); }
    }, 250);
    draw();
  }

  function resetTime() { stop(); left = SECONDS; bStart.textContent = '▶ Start'; draw(); }

  function reveal() {
    if (revealed) return;
    revealed = true;
    const p = PHOTOS[photo];
    const cards = [...pick(p.p3, N3).map(x => ({ ...x, pts: 3 })), ...pick(p.p2, N2).map(x => ({ ...x, pts: 2 }))];
    grid.innerHTML = cards.map((c, i) =>
      `<div class="wr-card p${c.pts}" style="animation-delay:${i * .45}s"><em>${c.pts}</em><b>${esc(c.w)}</b>${c.alt ? `<small>also: ${esc(c.alt)}</small>` : ''}</div>`
    ).join('');
    bReveal.disabled = true;
    bReveal.classList.remove('ready');
  }

  const thumbs = $('.wr-thumbs'), count = $('.wr-count');
  thumbs.innerHTML = PHOTOS.map((p, i) => '<button type="button" aria-label="Photo ' + (i + 1) + '"><img src="' + p.src + '" alt=""></button>').join('');

  // show photo i with a fresh timer and no bonus words (also used for "New round" on the same photo)
  function show(i) {
    photo = (i + PHOTOS.length) % PHOTOS.length;
    resetTime();
    revealed = false; grid.innerHTML = ''; bReveal.disabled = false;
    img.src = PHOTOS[photo].src;
    count.textContent = (photo + 1) + ' / ' + PHOTOS.length;
    [...thumbs.children].forEach((b, k) => b.classList.toggle('on', k === photo));
    draw();
  }

  bStart.addEventListener('click', () => { tick ? (left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000)), stop()) : run(); });
  bReset.addEventListener('click', resetTime);
  bReveal.addEventListener('click', reveal);
  bNew.addEventListener('click', () => show(photo));
  $('.wr-arrow.prev').addEventListener('click', () => show(photo - 1));
  $('.wr-arrow.next').addEventListener('click', () => show(photo + 1));
  [...thumbs.children].forEach((b, k) => b.addEventListener('click', () => show(k)));
  img.addEventListener('click', () => { zoom.querySelector('img').src = img.src; zoom.classList.add('on'); });
  zoom.addEventListener('click', () => zoom.classList.remove('on'));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') zoom.classList.remove('on');
    if (e.key === ' ' && spread.offsetParent && !/INPUT|TEXTAREA|BUTTON/.test(document.activeElement.tagName)) { e.preventDefault(); bStart.click(); }
  });

  show(0);
})();
