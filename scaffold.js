// Scaffolding (teacher-only spreads with no page numbers, see pages.js).
// [scaf-jobs-stories] "A job for a person": each group gets a different person card (the right page)
// and 5 different jobs. The last draw is kept in this browser, to find it again the next lesson.

(() => {
  const spread = document.querySelector('[data-id="scaf-jobs-stories"]');
  if (!spread) return;
  const KEY = 'libro-scaf-jobs-draw';
  const JOBS = [
    'doctor', 'nurse', 'dentist', 'vet', 'teacher', 'chef', 'pilot', 'police officer', 'fire officer',
    'farmer', 'builder', 'car mechanic', 'hairdresser', 'shop assistant', 'taxi driver', 'astronaut',
    'actor', 'singer', 'footballer', 'photographer', 'journalist', 'author', 'artist', 'fashion designer',
    'website developer', 'scientist', 'lawyer', 'waiter', 'CEO', 'childminder', 'paramedic', 'plumber',
    'electrician', 'engineer', 'architect', 'baker', 'pharmacist', 'librarian', 'flight attendant',
    'lifeguard', 'YouTuber', 'tour guide', 'musician', 'ice-cream taster', 'storm chaser',
    'video game tester', 'panda keeper', 'stunt performer', 'bed tester',
  ];
  const people = [...spread.querySelectorAll('.scf-people article')]
    .map(a => ({ face: a.querySelector('h3 i').textContent, name: a.querySelector('h3').childNodes[1].textContent.trim() }));
  const groups = spread.querySelector('.scf-groups');
  const out = spread.querySelector('.scf-result');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };

  function paint(draw) {
    out.innerHTML = (draw || []).map(g => `
      <li><b>${esc(g.face)} ${esc(g.name)}</b><span>${g.jobs.map(esc).join(' · ')}</span></li>`).join('');
  }

  spread.querySelector('.scf-go').addEventListener('click', () => {
    const n = Math.max(1, Math.min(people.length, parseInt(groups.value, 10) || 1));
    groups.value = n;
    // no job twice in the same group, and as few as possible repeated between groups
    let deck = [];
    const draw = shuffle(people).slice(0, n).map(p => {
      const jobs = [];
      while (jobs.length < 5) {
        if (!deck.length) deck = shuffle(JOBS);
        const j = deck.pop();
        if (!jobs.includes(j)) jobs.push(j);
      }
      return { ...p, jobs };
    });
    paint(draw);
    try { localStorage.setItem(KEY, JSON.stringify({ n, draw })); } catch { /* storage unavailable */ }
  });

  try {
    const last = JSON.parse(localStorage.getItem(KEY));
    if (last) { groups.value = last.n; paint(last.draw); }
  } catch { /* nothing drawn yet */ }
})();

// [scaf-animals-hotseat] "Animal roulette": a random animal emoji, the pupil says the name, asks a classmate
// a question and the classmate answers. The name and the true answers stay hidden until the teacher shows them.
// Every animal comes up once before the deck is shuffled again.
(() => {
  const spread = document.querySelector('[data-id="scaf-animals-hotseat"]');
  if (!spread) return;
  const ANIMALS = [
    ['🦒', 'giraffe', 'a mammal · lives in Africa · eats leaves · runs fast · has a very long neck and spots'],
    ['🐘', 'elephant', 'a mammal · lives in Africa and Asia · eats grass and leaves · swims · has a trunk, tusks and big ears'],
    ['🐧', 'penguin', 'a bird · lives in cold places · eats fish · swims, can’t fly · has wings and feathers'],
    ['🐍', 'snake', 'a reptile · lives in many places · eats mice and eggs · swims and climbs · has scales, no legs'],
    ['🕷️', 'spider', 'a small animal, not an insect · lives in houses and gardens · eats flies · climbs · has eight legs, no wings'],
    ['🐢', 'turtle', 'a reptile · lives on land or in water · eats plants and fish · walks slowly · has a hard shell'],
    ['🦓', 'zebra', 'a mammal · lives in Africa · eats grass · runs fast · has black and white stripes'],
    ['🦉', 'owl', 'a bird · lives in forests · eats mice · flies at night · has big eyes and soft feathers'],
    ['🦁', 'lion', 'a mammal · lives in Africa · eats meat · runs fast · has sharp claws and a tail'],
    ['🐒', 'monkey', 'a mammal · lives in forests · eats fruit · climbs very well · has a long tail'],
    ['🐬', 'dolphin', 'a mammal · lives in the ocean · eats fish · swims and jumps · has fins, no legs'],
    ['🦈', 'shark', 'a fish · lives in the ocean · eats fish · swims fast · has fins and sharp teeth'],
    ['🦇', 'bat', 'a mammal · lives in caves · eats insects and fruit · flies at night · has wings and fur'],
    ['🐸', 'frog', 'an amphibian · lives near water · eats insects · jumps and swims · has four legs, no tail'],
    ['🐰', 'rabbit', 'a mammal · lives in fields or at home · eats grass and carrots · jumps · has long ears and fur'],
    ['🐴', 'horse', 'a mammal · lives on a farm · eats grass · runs fast · has four legs, hooves and a mane'],
    ['🐄', 'cow', 'a mammal · lives on a farm · eats grass · gives us milk · has four legs and a tail'],
    ['🐖', 'pig', 'a mammal · lives on a farm · eats almost everything · has four legs and a curly tail'],
    ['🐑', 'sheep', 'a mammal · lives on a farm · eats grass · has four legs and wool'],
    ['🐔', 'chicken', 'a bird · lives on a farm · eats seeds and insects · can’t fly well · has wings, feathers and a beak'],
    ['🦆', 'duck', 'a bird · lives near water · eats plants and insects · flies and swims · has feathers and a beak'],
    ['🐻', 'bear', 'a mammal · lives in forests · eats fruit, fish and honey · swims and climbs · has fur and claws'],
    ['🐺', 'wolf', 'a mammal · lives in forests · eats meat · runs fast · has fur and sharp teeth'],
    ['🦊', 'fox', 'a mammal · lives in forests and cities · eats small animals and fruit · runs · has fur and a bushy tail'],
    ['🦘', 'kangaroo', 'a mammal · lives in Australia · eats grass · jumps · has strong back legs and a tail'],
    ['🐊', 'crocodile', 'a reptile · lives in rivers · eats fish and meat · swims · has scales and sharp teeth'],
    ['🦋', 'butterfly', 'an insect · lives in gardens · eats nectar · flies · has six legs and colorful wings'],
    ['🐝', 'bee', 'an insect · lives in a hive · eats nectar · flies · has six legs, wings and a stinger'],
    ['🐪', 'camel', 'a mammal · lives in the desert · eats plants · walks far · has humps and long legs'],
    ['🦛', 'hippo', 'a mammal · lives in rivers in Africa · eats grass · swims · has a very big mouth and short legs'],
    ['🦏', 'rhino', 'a mammal · lives in Africa and Asia · eats grass · runs · has a horn and thick skin'],
    ['🦜', 'parrot', 'a bird · lives in tropical forests · eats fruit and seeds · flies and talks · has colorful feathers'],
    ['🦩', 'flamingo', 'a bird · lives near lakes · eats small water animals · flies · has pink feathers and long legs'],
    ['🐙', 'octopus', 'a sea animal · lives in the ocean · eats crabs and fish · swims · has eight arms, no bones'],
    ['🐋', 'whale', 'a mammal · lives in the ocean · eats small fish · swims and dives · has fins and a big tail, no legs'],
    ['🐯', 'tiger', 'a mammal · lives in Asia · eats meat · swims and runs · has stripes and sharp claws'],
    ['🦍', 'gorilla', 'a mammal · lives in African forests · eats plants and fruit · climbs · has strong arms, no tail'],
    ['🐿️', 'squirrel', 'a mammal · lives in forests and parks · eats nuts · climbs and jumps · has fur and a bushy tail'],
    ['🦔', 'hedgehog', 'a mammal · lives in gardens · eats insects and worms · rolls into a ball · has spines and short legs'],
  ];
  const STARTERS = [
    ['is', 'Is it a … ?'], ['is', 'Is it … ? (big, small, dangerous)'], ['can', 'Can it … ?'],
    ['have', 'Does it have … ?'], ['live', 'Does it live in … ?'], ['eat', 'Does it eat … ?'],
  ];
  const $ = s => spread.querySelector(s);
  const emoji = $('.hs-emoji'), nameEl = $('.hs-name'), askEl = $('.hs-ask'), factsEl = $('.hs-facts'), countEl = $('.hs-count');
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  let deck = [], done = 0, cur = null;
  const article = n => (/^[aeiou]/.test(n) ? 'an ' : 'a ') + n;
  const showName = () => { nameEl.textContent = article(cur[1]); nameEl.classList.remove('hidden'); };

  $('.hs-next').addEventListener('click', () => {
    if (!deck.length) { deck = shuffle(ANIMALS); done = 0; }
    cur = deck.pop(); done++;
    emoji.textContent = cur[0];
    nameEl.textContent = '???'; nameEl.classList.add('hidden');
    askEl.textContent = ''; factsEl.textContent = '';
    countEl.textContent = `${done} / ${ANIMALS.length}`;
  });
  $('.hs-show').addEventListener('click', () => { if (cur) showName(); });
  $('.hs-q').addEventListener('click', () => {
    const [k, t] = STARTERS[Math.floor(Math.random() * STARTERS.length)];
    const s = document.createElement('span');
    s.className = k; s.textContent = t;
    askEl.replaceChildren(s);
  });
  $('.hs-key').addEventListener('click', () => {
    if (!cur) return;
    showName();
    const b = document.createElement('b');
    b.textContent = 'It’s ';
    factsEl.replaceChildren(b, cur[2]);
  });
})();
