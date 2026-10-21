// Witch hunt (CLIL, [wh-intro … wh-today]).
// 1. The shapes of the chapter, drawn once in a hidden sprite: a sparkle, a crescent moon, the "seed of life" circles, a flower, a flourish.
//    The pages use them with <use href="#wh-…">; their colors are set in the pages (style="color:var(--pal-…)").
// 2. The village game against the computer (pop-up, below), opened by a button with data-wh="play" ([wh-play]) and by the
//    pill "Witch hunt" of the Games list on the home page.

(() => {
  /* ================= 1 · the shapes ================= */
  const circles = (() => {
    let s = '<circle cx="50" cy="50" r="18"/>';
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;
      s += `<circle cx="${(50 + 18 * Math.cos(a)).toFixed(2)}" cy="${(50 + 18 * Math.sin(a)).toFixed(2)}" r="18"/>`;
    }
    return s + '<circle cx="50" cy="50" r="45"/>';
  })();
  const petals = Array.from({ length: 8 }, (_, k) => {
    const a = (k * 45 - 90) * Math.PI / 180;
    return `<circle cx="${(50 + 30 * Math.cos(a)).toFixed(1)}" cy="${(50 + 30 * Math.sin(a)).toFixed(1)}" r="15"/>`;
  }).join('');
  const SPRITE = `<svg width="0" height="0" xmlns="http://www.w3.org/2000/svg">
    <symbol id="wh-spark" viewBox="0 0 100 100"><path fill="currentColor" d="M50 0C54 34 66 46 100 50C66 54 54 66 50 100C46 66 34 54 0 50C34 46 46 34 50 0Z"/></symbol>
    <symbol id="wh-moon" viewBox="0 0 100 100"><path fill="currentColor" d="M62 6A46 46 0 1 0 94 68A38 38 0 1 1 62 6Z"/></symbol>
    <symbol id="wh-seed" viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="1.1">${circles}</g></symbol>
    <symbol id="wh-flower" viewBox="0 0 100 100"><g fill="currentColor">${petals}</g><circle cx="50" cy="50" r="13" style="fill:var(--pal-cream)"/></symbol>
    <symbol id="wh-flourish" viewBox="0 0 100 10"><g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M2 5H36C40 5 41 2 44 2C47 2 47 5 50 5C53 5 53 2 56 2C59 2 60 5 64 5H98"/></g><path fill="currentColor" d="M50 1.2L52.2 5L50 8.8L47.8 5Z"/></symbol>
  </svg>`;
  const sprite = document.createElement('div');
  sprite.setAttribute('aria-hidden', 'true');
  sprite.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  sprite.innerHTML = SPRITE;
  document.body.append(sprite);
})();

/* ================= 3 · words stuck together (texts of the class pages) ================= */
// <span class="wh-glue" id="…" data-words="at seven to live in"></span> shows the words without spaces: a click on a letter puts a slash after it
// (a second click takes it away). The right slashes are the ends of the words. The button data-glue="<id of the section>" checks all the chains of the section.
(() => {
  const chains = [...document.querySelectorAll('.wh-glue')].map(box => {
    const words = box.dataset.words.split(' ');
    const text = words.join('');
    const right = new Set();
    let end = -1;
    words.slice(0, -1).forEach(x => { end += x.length; right.add(end); });
    let cuts = new Set();
    try { cuts = new Set(JSON.parse(saved[box.id] || '[]')); } catch { cuts = new Set(); }
    const letters = [...text].map((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      if (i < text.length - 1) s.addEventListener('click', () => {
        cuts.has(i) ? cuts.delete(i) : cuts.add(i);
        saved[box.id] = JSON.stringify([...cuts]);
        persist();
        paint();
      });
      return s;
    });
    box.append(...letters);
    function paint(checked) {
      letters.forEach((s, i) => {
        s.classList.toggle('cut', cuts.has(i));
        s.classList.remove('ok', 'no');
        if (checked && cuts.has(i)) s.classList.add(right.has(i) ? 'ok' : 'no');
      });
      box.classList.toggle('missed', !!checked && [...right].some(i => !cuts.has(i)));
    }
    paint();
    return { box, right, cuts: () => cuts, paint };
  });
  document.querySelectorAll('.check[data-glue]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.glue;
    const mine = chains.filter(c => c.box.closest('#' + id));
    let good = 0, all = 0, bad = 0;
    mine.forEach(c => { c.paint(true); all += c.right.size; const g = [...c.cuts()].filter(i => c.right.has(i)).length; good += g; bad += c.cuts().size - g; });
    const out = document.getElementById(id + '-score');
    if (out) out.textContent = `${good} / ${all} slashes in the right place` + (bad ? ` · ${bad} in the wrong place` : '') + (good === all && !bad ? ' 🎉' : '');
  }));
})();
