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

/* ================= 4 · ornaments for the empty space at the bottom of a page ================= */
// After the layout is done, every page of the chapter (not the dark ones) measures how much free space is left under its content.
// If there is enough, an ornament is drawn there: a constellation, a garland, a medallion (seed of life) or a cartouche with a proverb.
// The kind depends on the spread and the side, so neighbouring pages are never the same. The ornaments are only decoration (no clicks).
(() => {
  const PROV = {
    plum: ['Many hands make light work.', 'Actions speak louder than words.', 'Every cloud has a silver lining.'],
    mustard: ['Knowledge is power.', 'Home is where the heart is.', 'A friend in need is a friend indeed.'],
    coral: ['Make hay while the sun shines.', 'Bad news travels fast.', 'No pain, no gain.'],
  };
  const accentOf = el => /wh-(nb|ne|nbe)/.test(el.className) ? 'mustard' : /wh-(wk|wm|ww)/.test(el.className) ? 'coral' : 'plum';
  const SOFT = { plum: 'lilac-light', mustard: 'wheat', coral: 'blush' };
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const use = (id, x, y, w, c) => `<use href="#${id}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${w}" style="color:var(--pal-${c})"/>`;
  const fl = (x, y, w, c) => `<use href="#wh-flourish" x="${x}" y="${y}" width="${w}" height="${w / 10}" style="color:var(--pal-${c})"/>`;

  function constellation(H, a, seed) {
    const pts = [[8, .65], [22, .3], [36, .6], [50, .25], [64, .55], [76, .2]].map(([x, y], i) => [x + (seed % 5) * .6, Math.max(3, H * y * .8 + 2)]);
    const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    return `<path d="${path}" style="fill:none;stroke:var(--pal-${a})" stroke-width=".3" stroke-dasharray=".9 1" stroke-linecap="round"/>` +
      pts.map((p, i) => use('wh-spark', p[0] - 2, p[1] - 2, 4, i % 3 ? a : 'mustard')).join('') +
      use('wh-moon', 70, Math.max(1, H - 12), Math.min(11, H - 3), 'wheat') + fl(18, H - 4.5, 50, a);
  }
  function garland(H, a) {
    const y = H / 2;
    let d = `M2 ${y}`; for (let i = 0; i < 6; i++) d += ` q7.1 ${-3.4} 14.3 0 t14.3 0`.slice(0, 0) + ` q3.6 -3 7.2 0 t7.2 0`;
    const flowers = [[10, 9], [43, 12], [76, 9]].map(([x, s], i) => use('wh-flower', x - s / 2, y - s / 2, s, i === 1 ? 'mustard' : SOFT[a]));
    const sparks = [26, 60, 4, 82].map((x, i) => use('wh-spark', x - 1.6, y - 1.6 + (i % 2 ? 5 : -5), 3.2, i % 2 ? 'mustard' : a)).join('');
    return `<path d="M2 ${y} H84" style="fill:none;stroke:var(--pal-${a})" stroke-width=".35"/><path d="M2 ${y + 1.6} H84" style="fill:none;stroke:var(--pal-mustard)" stroke-width=".2"/>` + flowers.join('') + sparks;
  }
  function medallion(H, a) {
    const s = Math.min(H - 3, 30), x = 43 - s / 2, y = (H - s) / 2;
    const lx = x - 3;
    return `<path d="M3 ${H / 2} H${lx}" style="fill:none;stroke:var(--pal-${a})" stroke-width=".35"/><path d="M${86 - 3} ${H / 2} H${86 - lx}" style="fill:none;stroke:var(--pal-${a})" stroke-width=".35"/>` +
      use('wh-seed', x, y, s, 'mustard') + use('wh-spark', 3, H / 2 - 2.2, 4.4, a) + use('wh-spark', 78.6, H / 2 - 2.2, 4.4, a) +
      `<circle cx="43" cy="${H / 2}" r="${(s * .09).toFixed(1)}" style="fill:var(--pal-${a})"/>`;
  }
  function cartouche(H, a, text) {
    const h = Math.min(H - 2, 15), y = (H - h) / 2;
    return `<rect x="4" y="${y}" width="78" height="${h}" rx="3" style="fill:var(--pal-white);stroke:var(--pal-${a})" stroke-width=".5"/><rect x="5.4" y="${y + 1.4}" width="75.2" height="${h - 2.8}" rx="2" style="fill:none;stroke:var(--pal-mustard)" stroke-width=".25"/>` +
      [[4, y], [82, y], [4, y + h], [82, y + h]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="1.5" style="fill:var(--pal-cream);stroke:var(--pal-${a});stroke-width:.45"/>`).join('') +
      `<text x="43" y="${(y + h / 2 + 1.4).toFixed(1)}" text-anchor="middle" style="font:400 4.2px Gloock,serif;fill:var(--pal-night)">${text}</text>` + fl(28, y + h - 3.4, 30, a);
  }
  function build(H, a, seed, text) {
    let body;
    if (H > 70) body = constellation(H * .26, a, seed) + `<g transform="translate(0 ${H * .27})">${medallion(H * .45, a)}</g><g transform="translate(0 ${H * .76})">${cartouche(H * .24, a, text)}</g>`;
    else if (H > 46) body = medallion(H * .6, a) + `<g transform="translate(0 ${H * .62})">${cartouche(H * .38, a, text)}</g>`;
    else {
      const k = seed % 4;
      body = k === 0 ? constellation(H, a, seed) : k === 1 ? garland(H, a) : k === 2 || H < 17 ? medallion(H, a) : cartouche(H, a, text);
    }
    return `<svg class="wh-orn-svg" viewBox="0 0 86 ${H.toFixed(1)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${body}</svg>`;
  }

  function decorate(spread) {
    const sid = spread.dataset.id;
    spread.querySelectorAll(':scope > .page.wh').forEach((p, i) => {
      if (p.classList.contains('dark') || p.querySelector('.wh-orn')) return;
      const box = p.getBoundingClientRect(); const u = box.width / 100;
      if (!u) return;
      let bottom = 0;
      p.querySelectorAll(':scope > .abs').forEach(e => {
        if (e.classList.contains('pageno') || e.classList.contains('footer') || e.classList.contains('wh-orn')) return;
        bottom = Math.max(bottom, (e.getBoundingClientRect().bottom - box.top) / u);
      });
      const top = bottom + 3, H = Math.min(bottom < 20 ? 110 : 60, 129 - top);
      if (H < 12) return;
      const a = accentOf(p), seed = hash(sid + i);
      const text = PROV[a][seed % PROV[a].length];
      const d = document.createElement('div');
      d.className = 'wh-orn abs';
      d.setAttribute('style', `--x:7;--y:${top.toFixed(1)};--w:86;--h:${H.toFixed(1)}`);
      d.innerHTML = build(H, a, seed, text);
      p.append(d);
    });
  }
  function all() {
    document.querySelectorAll('.spread[data-id^="wh-"]').forEach(s => {
      const hidden = getComputedStyle(s).display === 'none';
      const old = s.getAttribute('style');
      if (hidden) s.style.cssText = (old || '') + ';display:flex;visibility:hidden;position:absolute;left:0;top:0;';
      decorate(s);
      if (hidden) old === null ? s.removeAttribute('style') : s.setAttribute('style', old);
    });
  }
  const go = () => { try { all(); } catch (e) { console.warn('witch ornaments', e); } };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(go, 400));
})();
