// The Games list on the home page: the chapters that have no pill of their own in the script of their games.
// (Jobs, Witch hunt, Emotions, Sports, Personality and Present simple make theirs; script.js puts all the pills in the order of the book.)
// A link goes to the page of the game. If it has `open`, the pop-up of the game opens when the page is there;
// without it the game is on the page itself (the maze, the house).
window.addEventListener('load', () => {
  const list = document.getElementById('gameList');
  if (!list || typeof PAGES === 'undefined') return;
  const pills = [
    { title: 'Owners', color: '#8fb82e', games: [['🧭 Possessive maze', 'own-mistakes:R']] },
    { title: 'Home', color: '#c9de3c', games: [['🛋️ Decorate the house', 'home-vocab:R']] },
    { title: 'Romeo &amp; Juliet', color: '#d6334f', games: [
      ['🎯 Who am I?', 'rj-verona', () => window.RJ_GAMES?.open('who')],
      ['🃏 Memory pairs', 'rj-verona', () => window.RJ_GAMES?.open('memory')],
    ] },
    { title: 'Orwell', color: '#262626', games: [
      ['🎯 Who am I?', 'af-rules', () => window.ORWELL_GAMES?.open('who')],
      ['🃏 Memory: Farm &amp; history', 'af-rules', () => window.ORWELL_GAMES?.open('memory')],
    ] },
  ];
  pills.forEach(({ title, color, games }) => {
    const pill = document.createElement('details');
    pill.className = 'game-topic';
    pill.style.setProperty('--c', color);
    pill.innerHTML = `<summary>${title} <small>${games.length}</small></summary><div class="topic-pages">${games.map(([t, where], i) =>
      `<a href="#p${PAGES.of(where)}" data-hp="${i}">${t}</a>`).join('')}</div>`;
    list.append(pill);
    document.addEventListener('click', e => { if (!e.target.closest('#gameList')) pill.open = false; });
    pill.querySelectorAll('[data-hp]').forEach(a => {
      const run = games[+a.dataset.hp][2];
      if (!run) return; // the game is on the page: the link only goes there
      a.addEventListener('click', e => {
        e.preventDefault();
        pill.open = false;
        if (location.hash === a.getAttribute('href')) { run(); return; }
        document.addEventListener('spreadchange', run, { once: true });
        location.hash = a.getAttribute('href');
      });
    });
  });
  list.addEventListener('toggle', e => {
    if (e.target.open) list.querySelectorAll('.game-topic').forEach(o => { if (o !== e.target) o.open = false; });
  }, true);
  window.hideClosedGames?.(); // hide a pill whose page is not open to the students
});
