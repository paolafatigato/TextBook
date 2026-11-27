// Links from the games page (games/index.html) that open a game of the book:
//   index.html#play=sp-like:R/sports-day-race → the link "Sports Day race" of the Games list, on that spread
//   index.html#play=grammar-poker             → a game of the Games list with no page of its own
//   index.html#play=teacher/Four%20corners    → a game for the teacher (only a signed-in teacher can open it)
(() => {
  'use strict';
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // pages and sign-in arrive from the cloud a moment after the page
  async function until(test) {
    for (let i = 0; i < 24; i++) { if (test()) return true; await wait(250); }
    return test();
  }

  async function play() {
    const m = location.hash.match(/^#play=(.+)$/);
    if (!m) return;
    let key;
    try { key = decodeURIComponent(m[1]); } catch { return; }
    const cut = key.indexOf('/');
    const where = cut < 0 ? '' : key.slice(0, cut), name = key.slice(cut + 1);
    history.replaceState(null, '', '#home'); // so "Back" and a reload do not open the game again
    await Promise.race([userReady, wait(6000)]);

    if (where === 'teacher') {
      if (!await until(isTeacher)) { alert('This game is for teachers. Sign in with your teacher account, then open it again.'); return; }
      const b = document.createElement('button'); // teacher-games.js opens a game on a click on [data-tg-game]
      b.dataset.tgGame = name;
      b.hidden = true;
      document.body.append(b);
      b.click();
      b.remove();
      return;
    }

    if (where && !await until(() => { const s = PAGES.spread(where.split(':')[0]); return !!s && canSee(s); })) {
      alert('This game is on a page that is not open yet. Sign in, or ask your teacher.');
      return;
    }
    const href = where ? '#p' + PAGES.of(where) : '#';
    const link = [...document.querySelectorAll('#gameList .topic-pages a')]
      .find(a => slug(a.textContent) === name && a.getAttribute('href') === href);
    link?.click();
  }

  // after "load" every game has added its link to the Games list
  window.addEventListener('load', () => setTimeout(play, 50));
  window.addEventListener('hashchange', play);
})();
