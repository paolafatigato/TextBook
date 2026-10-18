// Big 5 wheel ([pers-test]): 20 situations, one per number of a d20.
// Online the wheel spins; on paper the pupils roll a d20 and read the same number in the list.
// Situation n belongs to trait (n - 1) % 5: O, C, E, A, N (same colors as the Big 5 cards).
(() => {
  const wheel = document.getElementById('b5-wheel');
  const list = document.getElementById('b5-sit');
  const result = document.getElementById('b5-result');
  if (!wheel || !list || !result) return;

  const TRAITS = [
    { key: 'O', name: 'Openness', color: '#8fc4ab' },
    { key: 'C', name: 'Conscientiousness', color: '#dfee6a' },
    { key: 'E', name: 'Extraversion', color: '#ee6a68' },
    { key: 'A', name: 'Agreeableness', color: '#b99ad6' },
    { key: 'N', name: 'Neuroticism', color: '#6a93a8' },
  ];
  const SITUATIONS = [
    'A new food from another country is on your plate.',
    'It’s homework time, but your favorite show is on.',
    'You arrive at a party where you know nobody.',
    'Two friends argue and both want you on their side.',
    'Tomorrow is a big test and you can’t sleep.',
    'Your teacher says: “Today you choose, no routine!”',
    'You are late and your bag is a mess.',
    'It’s Saturday and you are alone at home.',
    'Your friend wants to watch a film you don’t like.',
    'You say something silly and the class laughs.',
    'A friend invites you to a city you don’t know.',
    'You have a big project with ten small steps.',
    'You must speak in front of the whole school.',
    'A classmate is crying alone at break.',
    'You hear a strange noise at night.',
    'You find an old box with a mysterious key.',
    'You are tired, but your task is not finished.',
    'You sit next to a stranger on a long train trip.',
    'Someone breaks your favorite pen. They say sorry.',
    'Your friend doesn’t answer your message for days.',
  ];
  const N = SITUATIONS.length, STEP = 360 / N;
  const traitOf = i => TRAITS[i % TRAITS.length];

  /* ---- the wheel (angles run clockwise from the top) ---- */
  const pt = (r, deg) => {
    const a = deg * Math.PI / 180;
    return [(r * Math.sin(a)).toFixed(2), (-r * Math.cos(a)).toFixed(2)];
  };
  let slices = '';
  for (let i = 0; i < N; i++) {
    const [x0, y0] = pt(96, i * STEP - STEP / 2);
    const [x1, y1] = pt(96, i * STEP + STEP / 2);
    slices += `<path class="b5-slice" data-n="${i + 1}" d="M0 0L${x0} ${y0}A96 96 0 0 1 ${x1} ${y1}Z" fill="${traitOf(i).color}"/>`
      + `<text class="b5-num" transform="rotate(${i * STEP}) translate(0 -77)" text-anchor="middle" dominant-baseline="central"${[6, 9].includes(i + 1) ? " text-decoration=\"underline\"" : ""}>${i + 1}</text>`;
  }
  wheel.innerHTML = `
    <svg viewBox="-104 -104 208 208" role="img" aria-label="Wheel with 20 numbered situations">
      <circle r="102" class="b5-rim"/>
      <g class="b5-disc">${slices}</g>
      <circle r="24" class="b5-hub"/>
      <path class="b5-pointer" d="M-9 -108H9L0 -88Z"/>
    </svg>
    <button type="button" class="b5-spin">SPIN</button>`;
  const disc = wheel.querySelector('.b5-disc');
  const spinBtn = wheel.querySelector('.b5-spin');

  /* ---- the list of situations (the same numbers as the d20) ---- */
  list.innerHTML = SITUATIONS.map((s, i) =>
    `<li><button type="button" data-n="${i + 1}" style="--tc:${traitOf(i).color}"><b>${i + 1}</b><span>${s}</span></button></li>`).join('');

  /* ---- show a situation ---- */
  function show(n) {
    const t = traitOf(n - 1);
    result.style.setProperty('--tc', t.color);
    result.classList.add('on');
    result.innerHTML = `<b class="b5-rn">${n}</b><p>${SITUATIONS[n - 1]}<span class="b5-ask">Friends: <q>What do you do?</q> &nbsp;You: <i>“I …”</i></span></p>`;
    list.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.n === n));
  }

  /* ---- spin ---- */
  let rotation = 0, spinning = false;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function spin() {
    if (spinning) return;
    const k = Math.floor(Math.random() * N);                       // the winning slice (0-based)
    const jitter = (Math.random() - .5) * (STEP * .7);             // stops anywhere inside the slice
    const turn = (((-k * STEP - rotation + jitter) % 360) + 360) % 360;
    rotation += 360 * (4 + Math.floor(Math.random() * 2)) + turn;
    spinning = true;
    spinBtn.disabled = true;
    const done = () => {
      if (!spinning) return;
      spinning = false;
      spinBtn.disabled = false;
      show(k + 1);
    };
    if (still) { disc.style.transform = `rotate(${rotation}deg)`; done(); return; }
    disc.style.transform = `rotate(${rotation}deg)`;
    disc.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 4600);                                         // in case the transition never ends
  }
  spinBtn.addEventListener('click', spin);
  list.addEventListener('click', e => {
    const b = e.target.closest('button[data-n]');
    if (b) show(+b.dataset.n);
  });
  wheel.addEventListener('click', e => {
    const s = e.target.closest('.b5-slice');
    if (s && !spinning) show(+s.dataset.n);
  });
})();
