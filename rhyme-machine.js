// The rhyme machine (p. 115) and the rhyme exercises (pp. 115-116).
// Words rhyme when they are in the same family: the families go by SOUND,
// so "blue" and "through" are together, "love" and "move" are not.
// To add a word, put it in the right family (a word can be in one family only).

const RHYME_FAMILIES = [
  'night light bright white sight right write fight kite bite flight might tight quite polite delight tonight invite',
  'day play say way stay grey away may today okay they pray weigh obey stray holiday',
  'blue true you do new two too who shoe through view knew flew zoo glue few',
  'me see sea tree free be key three tea agree he she we knee degree',
  'love above glove dove shove',
  'move prove groove improve approve',
  'heart art start part apart smart chart cart dart',
  'eyes skies cries lies flies tries rise wise size prize surprise sunrise disguise goodbyes',
  'rain pain again train brain plane lane spain chain remain explain insane',
  'more door floor four before shore war store score roar bore pour your',
  'old cold gold hold told bold sold fold rolled controlled',
  'sound ground round found around bound pound crowned drowned',
  'go know slow snow show so though below grow throw toe glow sew although',
  'now how wow cow allow bow eyebrow',
  'head red said bed bread dead fed led spread instead ahead thread wed',
  'paid made afraid played stayed shade lemonade parade',
  'sweet feet street meet eat heat seat beat sheet complete repeat treat neat',
  'sun fun run one done won son none gun begun everyone',
  'fire wire desire tire higher liar choir inspire entire',
  'time rhyme climb crime lime prime chime dime',
  'face place space race grace case lace base embrace chase',
  'rare hair care air there where bear chair fair stare compare wear pear square',
  'mind kind find behind blind signed designed',
  'ear near hear here fear clear dear year tear cheer deer appear disappear',
  'beard weird feared cleared appeared',
  'heard word bird third nerd absurd blurred',
  'cool school pool rule fool tool',
  'still will hill fill kill chill ill until skill thrill pill',
  'all ball call fall small tall wall hall crawl',
  'sing king ring spring thing wing bring swing string everything',
  'song long strong wrong along belong',
  'make take cake lake wake snake mistake break steak ache',
  'smile while mile style file aisle isle crocodile',
  'moon soon noon spoon june tune balloon afternoon',
  'cat hat that sat flat chat bat rat fat mat',
  'dog fog log frog jog blog',
  'dress less mess yes guess press success princess mistress confess',
  'dark park mark spark shark bark remark',
  'think drink pink ink blink sink link wink',
  'friend end send bend spend lend pretend weekend attend',
  'ever never clever forever whatever',
  'dream cream team stream scream seem theme extreme beam',
  'ice nice rice price twice dice advice paradise mice',
  'ride side hide wide inside outside pride tried cried died guide slide bride',
  'town down brown crown clown frown gown noun',
  'phone alone stone bone own known shown grown tone zone throne',
  'home comb foam roam dome',
  'come some drum mum thumb become',
  'good wood could should would stood hood',
  'food mood rude dude attitude include',
  'our hour flower power tower shower',
  'on gone upon swan',
  'enough stuff rough tough cuff puff',
  'sleep deep keep sheep cheap leap sweep weep',
  'late great wait eight straight gate plate hate date mate weight state',
].map(f => f.split(' '));

const familyOf = new Map();
RHYME_FAMILIES.forEach((f, i) => f.forEach(w => familyOf.set(w, i)));

const rhymeClean = s => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z]/g, '');

// how many letters at the end are the same: "stove" / "dove" -> 3
function sameEnd(a, b) {
  let n = 0;
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
  return n;
}

// { sure: true, words } when the word is in the dictionary,
// { sure: false, words } with words that only END the same way (to check by ear)
function findRhymes(word) {
  const w = rhymeClean(word);
  if (!w) return null;
  if (familyOf.has(w)) return { sure: true, words: RHYME_FAMILIES[familyOf.get(w)].filter(x => x !== w) };
  let best = 1, found = [];
  RHYME_FAMILIES.forEach(f => {
    const s = Math.max(...f.map(x => sameEnd(x, w)));
    if (s > best) { best = s; found = [f]; } else if (s === best && s > 1) found.push(f);
  });
  return { sure: false, words: [...new Set(found.flat())].filter(x => x !== w) };
}

// 'ok', 'no' or 'maybe' (a word the machine doesn't know)
function rhymeVerdict(target, word) {
  const t = rhymeClean(target), w = rhymeClean(word);
  if (!w || !t) return null;
  if (w === t) return 'no';
  const ft = familyOf.get(t), fw = familyOf.get(w);
  if (ft === undefined || fw === undefined) return 'maybe';
  return ft === fw ? 'ok' : 'no';
}

/* ---------- the machine ---------- */

const rmOut = document.getElementById('shr-out');
let rmTarget = null; // the box (7.13) where a clicked word goes

document.addEventListener('focusin', e => {
  if (!e.target.matches('.sh-rm-target')) return;
  rmTarget?.classList.remove('armed');
  rmTarget = e.target;
  rmTarget.classList.add('armed');
});

function writeWord(word) {
  if (!rmTarget) {
    rmOut.querySelector('.sh-rm-msg')?.classList.add('shake');
    return;
  }
  rmTarget.value = word;
  rmTarget.dispatchEvent(new Event('input')); // saved like every other answer
  // next empty box in the same row
  const next = [...rmTarget.closest('li').querySelectorAll('.sh-rm-target')].find(i => !i.value);
  if (next) {
    rmTarget.classList.remove('armed');
    rmTarget = next;
    rmTarget.classList.add('armed');
  }
}

function wordButton(word, maybe) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'sh-rw' + (maybe ? ' maybe' : '');
  b.textContent = word;
  b.addEventListener('click', () => writeWord(word));
  return b;
}

function showRhymes(word) {
  const res = findRhymes(word);
  if (!res) return;
  const msg = document.createElement('span');
  msg.className = 'sh-rm-msg';
  const shown = rhymeClean(word);
  if (res.sure) msg.textContent = `✓ These words rhyme with “${shown}”. Click one to write it in your box.`;
  else if (res.words.length) msg.textContent = `🤔 I don't know “${shown}”. These words END the same way: say them aloud, do they SOUND the same?`;
  else msg.textContent = `😕 I don't know “${shown}”. Try another word or ask your teacher!`;
  rmOut.replaceChildren(msg, ...res.words.map(w => wordButton(w, !res.sure)));
}

document.getElementById('shr-find')?.addEventListener('submit', e => {
  e.preventDefault();
  showRhymes(document.getElementById('shr-word').value);
});

// SPIN: three reels stop on three words of the same family
const reels = [...document.querySelectorAll('.sh-reel')];
const allWords = RHYME_FAMILIES.flat();
const pick = list => list[Math.floor(Math.random() * list.length)];
reels.forEach(r => r.addEventListener('click', () => { if (r.dataset.word) writeWord(r.dataset.word); }));

document.getElementById('shr-spin')?.addEventListener('click', e => {
  const btn = e.currentTarget;
  btn.disabled = true;
  const family = pick(RHYME_FAMILIES.filter(f => f.length >= 3));
  const words = [...family].sort(() => Math.random() - .5).slice(0, 3);
  reels.forEach((r, i) => {
    r.classList.add('rolling');
    delete r.dataset.word;
    const roll = setInterval(() => { r.textContent = pick(allWords); }, 70);
    setTimeout(() => {
      clearInterval(roll);
      r.textContent = r.dataset.word = words[i];
      r.classList.remove('rolling');
      if (i === reels.length - 1) btn.disabled = false;
    }, 600 + i * 400);
  });
});

/* ---------- checking the rhymes students write (7.13, 7.16) ---------- */

document.querySelectorAll('.check[data-rhymecheck]').forEach(btn => btn.addEventListener('click', () => {
  document.getElementById(btn.dataset.rhymecheck).querySelectorAll('input[data-rhyme], input[data-rhyme-from]').forEach(inp => {
    inp.classList.remove('ok', 'no', 'maybe');
    const target = inp.dataset.rhyme || document.getElementById(inp.dataset.rhymeFrom)?.value || '';
    const v = rhymeVerdict(target, inp.value);
    if (v) inp.classList.add(v);
  });
}));

document.querySelectorAll('input[data-rhyme], input[data-rhyme-from]').forEach(inp => {
  inp.addEventListener('input', () => inp.classList.remove('maybe'));
});
// "Clear answers" empties the boxes: take away the yellow too
document.getElementById('clearBtn').addEventListener('click', () => setTimeout(() => {
  document.querySelectorAll('input.maybe').forEach(inp => { if (!inp.value) inp.classList.remove('maybe'); });
}));
