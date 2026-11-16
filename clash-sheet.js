// Rome vs Longobards ([ps-clash-hero], right page): the hero sheet in the book, made like a CV.
// The pupil chooses the people (Romans / Longobards): the page changes colors, symbols and decorations to fit the culture.
// Then man or woman and the job from a list: the job fills in 9 points of stats and the perk by itself, the pupil gives 3 more points
// (max 5 in a stat = 12 in total), writes 3 adjectives, chooses the look and a game and a hobby of that culture and time,
// and can draw the hero (or add a picture). A little text about the hero writes itself while the pupil fills in the sheet.
// The hero is sent to the teacher with book.clash.sendHero (cloud.js). Two heroes can be made (tabs Hero 1 / Hero 2).
// Everything the pupil writes is saved by script.js like any other answer; the options of the lists are all in the page and are hidden or shown here.

(() => {
  const D = window.CLASH_DATA;
  const root = document.querySelector('.spread[data-id="ps-clash-hero"]');
  const pg = document.getElementById('lr-hero-page');
  if (!root || !pg || !D) return;
  const KEYS = ['str', 'agi', 'end', 'wis'];
  const E = (s, k) => document.getElementById(`lr-c${s}-${k}`);
  const onText = el => el?.querySelector('button.on')?.textContent || '';
  const pOf = s => ({ Romans: 'R', Longobards: 'L' })[onText(E(s, 'people'))] || '';
  const rOf = s => ({ 'a man': 'man', 'a woman': 'woman' })[onText(E(s, 'role'))] || '';
  const jobOf = s => { const v = E(s, 'job').value; if (!v) return null; const [p, r, k] = v.split('-'); return D.JOBS[p]?.[r]?.find(j => j.k === k) || null; };
  const changed = el => el.dispatchEvent(new Event('input', { bubbles: true })); // so that script.js saves the new value
  const BONUS = D.BONUS_POINTS || 3;
  const saved = () => (window.book && window.book.getSaved && window.book.getSaved()) || {};
  let slot = 1;

  // hide the options of the other culture / role
  function filterOptions(sel, ok) {
    [...sel.options].forEach(o => { if (!o.dataset.p) return; const show = ok(o); o.hidden = !show; o.disabled = !show; });
    if (sel.selectedOptions[0]?.disabled) { sel.value = ''; changed(sel); }
  }
  const an = w => (/^[aeiou]/i.test(w) ? 'an' : 'a');
  const like = v => v.replace(/^[RL]:/, '');

  /* ---------- the hero, as it is sent ---------- */
  function hero(s) {
    const P = pOf(s), role = rOf(s), j = jobOf(s), v = k => E(s, k).value.trim();
    const bonus = KEYS.map(k => +onText(E(s, 'b-' + k)) || 0);
    const stats = j ? Object.fromEntries(KEYS.map((k, i) => [k, j.base[i] + bonus[i]])) : {};
    return { slot: s, name: v('name'), people: P, role, job: j?.k || '', jobName: j?.n || '', ...stats, bonus,
      adj: [1, 2, 3].map(n => v('adj' + n)), hair: v('hair'), style: v('style'), eyes: v('eyes'), build: v('build'), feature: v('feat'),
      game: like(v('game')), hobby: like(v('hobby')), desc: v('desc'), daily: v('daily') };
  }
  // a small picture of the drawing (about 240 x 320) to send with the hero
  function smallPic(s) {
    const id = `lr-c${s}-pic`;
    if (!saved()[id]) return '';
    try {
      const src = document.getElementById(id).querySelector('canvas'), c = document.createElement('canvas');
      c.width = 240; c.height = 320;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 240, 320); x.drawImage(src, 0, 0, 240, 320);
      const url = c.toDataURL('image/webp', .6);
      return url.length < 90000 ? url : '';
    } catch { return ''; }
  }
  function missing(s) {
    const h = hero(s), m = [];
    if (!h.name) m.push('your hero’s name');
    if (!h.people || !h.role) m.push('people and man / woman');
    if (!h.job) m.push('the job');
    if (KEYS.reduce((n, k) => n + (+onText(E(s, 'b-' + k)) || 0), 0) !== BONUS || KEYS.some(k => h[k] > 5)) m.push('the 3 points of stats');
    if (h.adj.some(a => !a)) m.push('3 adjectives');
    if (!h.hair || !h.style || !h.eyes || !h.build) m.push('the look (hair, eyes, build)');
    if (!h.game || !h.hobby) m.push('the favorite game and hobby');
    return m;
  }

  // the text about the hero writes itself (present simple, first person)
  function story(s) {
    const h = hero(s), P = h.people === 'R' ? 'Roman' : h.people === 'L' ? 'Longobard' : '';
    const t = [];
    if (h.name) t.push(`I am ${h.name}${h.jobName ? `, ${an(P || h.jobName)} ${P ? P + ' ' : ''}${h.jobName.toLowerCase()}` : P ? `, ${an(P)} ${P}` : ''}.`);
    if (h.adj.every(Boolean)) t.push(`I am ${h.adj[0]}, ${h.adj[1]} and ${h.adj[2]}.`);
    if (h.hair && h.style && h.eyes) t.push(`I have ${h.hair} ${h.style} hair and ${h.eyes} eyes.`);
    if (h.build) t.push(`I am ${h.build}.`);
    if (h.hobby) t.push(`I love ${h.hobby}.`);
    if (h.game) t.push(`My favorite game is ${h.game}.`);
    return t.length ? t.join(' ') : 'Choose your people and your job: the story of your hero writes itself here.';
  }

  function paint(s) {
    const P = pOf(s), role = rOf(s);
    if (s === slot) {   // the page looks like the culture
      pg.classList.remove('both', 'lb', 'rm');
      pg.classList.add(P === 'R' ? 'rm' : P === 'L' ? 'lb' : 'both');
    }
    filterOptions(E(s, 'job'), o => !!P && !!role && o.dataset.p === P && o.dataset.r === role);
    ['game', 'hobby'].forEach(k => filterOptions(E(s, k), o => !!P && o.dataset.p === P));
    // the job fills the stats
    const j = jobOf(s), base = j && j.base;
    let used = 0, over = false;
    KEYS.forEach((k, i) => {
      const b = +onText(E(s, 'b-' + k)) || 0;
      used += b;
      E(s, 'base-' + k).textContent = base ? base[i] : '–';
      const fin = base ? base[i] + b : null;
      E(s, 'fin-' + k).textContent = fin == null ? '–' : fin;
      E(s, 'fin-' + k).classList.toggle('no', fin != null && fin > 5);
      if (fin != null && fin > 5) over = true;
    });
    E(s, 'perk').textContent = j ? `${j.e} ${j.n}: ${j.perk}` : 'Choose your people, then your job: the stats fill in by themselves.';
    const left = BONUS - used, pts = E(s, 'pts');
    pts.className = 'lr-pts' + (left === 0 && !over ? ' ok' : left < 0 || over ? ' no' : '');
    pts.textContent = over ? 'a stat can’t be more than 5' : left === 0 ? '✓ 3 points given' : left < 0 ? `${-left} too many` : `${left} point${left === 1 ? '' : 's'} left`;
    // the tiles of the favorites, the text about the hero, the placeholder of the picture
    E(s, 'gi').textContent = D.ICON[like(E(s, 'game').value)] || '🎲';
    E(s, 'hi').textContent = D.ICON[like(E(s, 'hobby').value)] || '🎭';
    E(s, 'intro').textContent = story(s);
    E(s, 'ph').hidden = !!saved()[`lr-c${s}-pic`];
    pg.querySelectorAll(`.lr-slot[data-slot="${s}"] .hp-langs`).forEach(el => { el.dataset.p = P; });
  }

  /* ---------- sending ---------- */
  const msg = t => { const el = document.getElementById('lr-sendmsg'); if (el) el.textContent = t; };
  document.getElementById('lr-send')?.addEventListener('click', async e => {
    const miss = missing(slot);
    if (miss.length) { msg('Still to do: ' + miss.join(' · ') + '.'); return; }
    const api = window.book?.clash;
    if (!api) { msg('Sending only works on the internet version of the book.'); return; }
    e.target.disabled = true; msg('Sending…');
    try {
      await api.sendHero(slot, { ...hero(slot), pic: smallPic(slot) });
      msg(`✅ Hero ${slot} sent to your teacher (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). You can change it and send it again.`);
    } catch (err) {
      const c = (err && (err.code || err.message)) || '';
      msg(/signin/.test(c) ? 'Sign in with your Google account first (the button at the top right).' : /permission/.test(c) ? 'Your teacher must open the hero box first. Tell her!' : 'Could not send. Check the internet and try again.');
    }
    e.target.disabled = false;
  });
  async function showSent() {
    try {
      const d = await window.book?.clash?.myHero(slot);
      if (d) msg(`Hero ${slot} was sent on ${new Date(d.updated).toLocaleDateString()}. Send it again if you change it.`);
      else msg(window.book?.clash ? `Hero ${slot} is not sent yet.` : 'Sign in with your Google account (top right) to send your hero.');
    } catch { /* not signed in */ }
  }

  /* ---------- tabs: Hero 1 / Hero 2 ---------- */
  function showSlot(s) {
    slot = s;
    pg.querySelectorAll('.lr-htab').forEach(t => t.classList.toggle('on', +t.dataset.slot === s));
    pg.querySelectorAll('.lr-slot').forEach(el => { el.hidden = +el.dataset.slot !== s; });
    paint(s); showSent();
  }
  pg.querySelectorAll('.lr-htab').forEach(t => t.addEventListener('click', () => showSlot(+t.dataset.slot)));

  /* ---------- events ---------- */
  [1, 2].forEach(s => {
    ['people', 'role', ...KEYS.map(k => 'b-' + k)].forEach(k => E(s, k)?.addEventListener('click', () => paint(s)));
    ['job', 'game', 'hobby', 'hair', 'style', 'eyes', 'build'].forEach(k => E(s, k)?.addEventListener('change', () => paint(s)));
    ['name', 'adj1', 'adj2', 'adj3'].forEach(k => E(s, k)?.addEventListener('input', () => paint(s)));
    // the picture: the placeholder goes away when the pupil starts to draw or adds a picture, and comes back when it is cleared
    const wrap = document.getElementById(`lr-c${s}-pic`);
    wrap?.querySelector('canvas').addEventListener('pointerdown', () => { E(s, 'ph').hidden = true; });
    wrap?.querySelector('input[type=file]')?.addEventListener('change', () => { E(s, 'ph').hidden = true; });
    wrap?.querySelector('.pd-clear')?.addEventListener('click', () => setTimeout(() => paint(s), 50));
  });
  setTimeout(() => { paint(1); paint(2); showSlot(1); }, 150); // script.js has painted the saved answers by now
  setTimeout(showSent, 2500);
})();
