// The online games of games/index.html: turn the pages of each checkerboard, search, and the "?" card of a game.
(() => {
  'use strict';
  const info = document.getElementById('info');
  const LIGHT = ['lime', 'lilac', 'blush', 'lime'];

  document.querySelectorAll('.games').forEach(section => {
    const gallery = section.querySelector('.gallery');
    if (!gallery) return;
    const track = gallery.querySelector('.track');
    const pages = [...track.children];
    const cells = [...track.querySelectorAll('.cell:not(.empty)')];
    const [prev, next] = gallery.querySelectorAll('.turn');
    const search = section.querySelector('.search input');
    const footer = section.querySelector('.gallery-footer');
    const counter = footer.querySelector('.counter');
    const none = section.querySelector('.none');
    const tones = cells.map(c => c.classList[1]); // the colors of the checkerboard, to put back after a search
    let current = 0;

    const dots = pages.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Page ${i + 1}`);
      b.addEventListener('click', () => show(i));
      footer.querySelector('.dots').append(b);
      return b;
    });
    const tone = (cell, name) => { cell.classList.remove('dark', ...LIGHT); cell.classList.add(name); };

    function show(i) {
      current = i;
      track.style.transform = `translateX(-${i * 100}%)`;
      pages.forEach((p, n) => { p.inert = n !== i; }); // the keyboard only reaches the page on screen
      dots.forEach((d, n) => d.classList.toggle('active', n === i));
      prev.disabled = i === 0;
      next.disabled = i === pages.length - 1;
      counter.textContent = `${i * 9 + 1}–${Math.min((i + 1) * 9, cells.length)} of ${cells.length}`;
    }
    prev.addEventListener('click', () => show(current - 1));
    next.addEventListener('click', () => show(current + 1));

    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      gallery.classList.toggle('searching', !!q);
      footer.hidden = !!q;
      let found = 0;
      cells.forEach((c, i) => {
        c.hidden = !!q && !c.querySelector('.cell-link').textContent.toLowerCase().includes(q);
        if (!q) tone(c, tones[i]);
        else if (!c.hidden) { tone(c, found % 2 ? LIGHT[(found >> 1) % LIGHT.length] : 'dark'); found++; }
      });
      none.hidden = !q || found > 0;
      if (q) pages.forEach(p => { p.inert = false; }); else show(current);
    });
    show(0);
  });

  document.addEventListener('click', e => {
    const button = e.target.closest('.cell-info');
    if (!button) return;
    const cell = button.closest('.cell'), link = cell.querySelector('.cell-link');
    info.querySelector('.info-tag').textContent = cell.querySelector('.cell-tag').textContent;
    info.querySelector('h2').textContent = cell.querySelector('.cell-title').textContent;
    info.querySelector('p').textContent = cell.dataset.text;
    const links = [['Play', link.getAttribute('href')]];
    if (cell.dataset.how) links.push(['How to play', cell.dataset.how]);
    info.querySelector('.info-links').replaceChildren(...links.map(([label, href]) => {
      const a = document.createElement('a');
      a.className = 'btn';
      a.href = href;
      a.textContent = label;
      return a;
    }));
    info.showModal();
  });
  info.addEventListener('click', e => { if (e.target === info || e.target.closest('.info-close')) info.close(); });
})();
