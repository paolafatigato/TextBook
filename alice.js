// Literature: Alice (alice-colours … alice-marx): the small tools of the chapter.
// 1. Highlighters: pick a colour in .ac-pal, click a sentence (or a word) in .ac-hl; "✓ Check" compares with data-a; .ac-tally counts the colours.
// 2. Timers (.ac-timer): one minute for each station of the rain warm-up.
// 3. Breathing circle (.ac-breath): in – hold – out.
// 4. Posture machine (.ac-machine): the same frame, a different posture each time (dice and locks).
// 5. Secret rules (.ac-secret) and the Desert Island (.ac-island): guess the rule from the answers can / can't.
// 6. Random variation of the warm-up (.ac-variation).
// Nothing here is sent anywhere: only what script.js saves (the inputs, the toggles) and the colours of the highlighters.

(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const speak = text => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = .9;
    synth.speak(u);
  };
  const store = (id, v) => { try { saved[id] = JSON.stringify(v); persist(); } catch { /* script.js not ready */ } };
  const load = id => { try { return JSON.parse(saved[id] || '{}'); } catch { return {}; } };

  /* ================= 1 · the highlighters ================= */
  $$('.spread').forEach(spread => {
    const pals = $$('.ac-pal', spread);
    const boxes = $$('.ac-hl', spread);
    if (!boxes.length) return;
    let cur = pals[0] ? pals[0].querySelector('button')?.dataset.c : '1';
    pals.forEach(p => p.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      cur = b.dataset.c;
      pals.forEach(q => q.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.c === cur)));
    })));
    pals.forEach(q => q.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.c === cur)));

    const tallies = $$('.ac-tally', spread);
    const count = () => tallies.forEach(t => {
      const box = document.getElementById(t.dataset.for);
      if (!box) return;
      const marks = Object.values(load(box.id));
      t.querySelectorAll('span[data-c]').forEach(sp => {
        const n = marks.filter(c => c === sp.dataset.c).length;
        sp.style.setProperty('--n', n);
        sp.querySelector('b').textContent = n;
      });
    });

    boxes.forEach(box => {
      // words: every word of the .ac-text paragraphs becomes clickable; sentences: the .s are already in the HTML
      if (box.classList.contains('words')) {
        const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
        nodes.forEach(node => {
          const frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span');
            w.className = 's'; w.textContent = part;
            frag.append(w);
          });
          node.replaceWith(frag);
        });
      }
      const items = $$('.s', box);
      const paint = () => {
        const st = load(box.id);
        items.forEach((el, i) => {
          el.classList.remove('c1', 'c2', 'c3', 'c4', 'c5', 'ok', 'no');
          if (st[i]) el.classList.add('c' + st[i]);
        });
        count();
      };
      items.forEach((el, i) => el.addEventListener('click', () => {
        const st = load(box.id);
        if (cur === 'x' || st[i] === cur) delete st[i]; else st[i] = cur;
        store(box.id, st);
        paint();
      }));
      paint();
      spread.querySelectorAll(`.check[data-hl="${box.id}"]`).forEach(btn => btn.addEventListener('click', () => {
        const st = load(box.id);
        items.forEach((el, i) => {
          el.classList.remove('ok', 'no');
          if (!el.dataset.a || !st[i]) return;
          el.classList.add(el.dataset.a.split(',').includes(st[i]) ? 'ok' : 'no');
        });
      }));
    });
  });

  /* ================= 2 · timers ================= */
  $$('.ac-timer').forEach(btn => {
    const total = +btn.dataset.sec || 60;
    const t = btn.querySelector('.t'), ic = btn.querySelector('i');
    const show = s => { t.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    let left = total, iv = null;
    const stop = () => { clearInterval(iv); iv = null; };
    show(total);
    btn.addEventListener('click', () => {
      if (iv) { stop(); left = total; show(total); btn.classList.remove('run'); ic.textContent = '▶'; return; }
      if (btn.classList.contains('done')) { btn.classList.remove('done'); left = total; show(total); ic.textContent = '▶'; return; }
      btn.classList.add('run'); ic.textContent = '■';
      iv = setInterval(() => {
        left--; show(left);
        if (left <= 0) { stop(); btn.classList.remove('run'); btn.classList.add('done'); ic.textContent = '✓'; }
      }, 1000);
    });
  });

  /* ================= 3 · breathing ================= */
  $$('.ac-breath').forEach(box => {
    const lab = box.querySelector('.lab'), go = box.querySelector('.go');
    const PH = [['in', 'Breathe in', 4], ['hold', 'Hold', 2], ['out', 'Breathe out', 4]];
    let timer = null, round = 0;
    const stop = () => { clearInterval(timer); timer = null; delete box.dataset.ph; lab.innerHTML = 'Ready?'; go.textContent = '▶ Start'; };
    stop();
    go.addEventListener('click', () => {
      if (timer) { stop(); return; }
      go.textContent = '■ Stop';
      let p = 0, s = PH[0][2];
      const apply = () => { box.dataset.ph = PH[p][0]; lab.innerHTML = `${PH[p][1]}<small>${s}</small>`; };
      round = 0; apply();
      timer = setInterval(() => {
        s--;
        if (s <= 0) { p = (p + 1) % PH.length; s = PH[p][2]; if (p === 0) round++; }
        apply();
      }, 1000);
    });
  });

  /* ================= 4 · the posture machine ================= */
  $$('.ac-machine').forEach(table => {
    const rows = $$('tr', table);
    const sentOf = tr => tr.querySelector('.sent');
    const optsOf = tr => tr.dataset.opts.split('|');
    const roll = (tr, done) => {
      if (tr.classList.contains('locked')) { done?.(); return; }
      const opts = optsOf(tr), cell = sentOf(tr), old = cell.textContent;
      tr.classList.add('roll');
      let n = 0;
      const iv = setInterval(() => {
        cell.textContent = pick(opts);
        if (++n >= 7) {
          clearInterval(iv); tr.classList.remove('roll');
          const others = opts.filter(o => o !== old);
          cell.textContent = pick(others.length ? others : opts);
          done?.();
        }
      }, 70);
    };
    rows.forEach(tr => {
      sentOf(tr).textContent = optsOf(tr)[0];
      tr.querySelector('.die')?.addEventListener('click', () => roll(tr));
      tr.querySelector('.lock')?.addEventListener('click', () => tr.classList.toggle('locked'));
    });
    const spread = table.closest('.page');
    spread?.querySelectorAll('.ac-roll').forEach(b => b.addEventListener('click', () => rows.forEach(tr => roll(tr))));
    spread?.querySelectorAll('.ac-say').forEach(b => b.addEventListener('click', () => speak(rows.map(tr => sentOf(tr).textContent).join(' '))));
    // first posture at random, so the page does not always open the same way
    rows.forEach(tr => { sentOf(tr).textContent = pick(optsOf(tr)); });
  });

  /* ================= 5 · secret rules and the desert island ================= */
  const hideLater = (el, ms = 6000) => { clearTimeout(el._t); el._t = setTimeout(() => { el.classList.remove('show'); el.textContent = el.dataset.hidden; }, ms); };

  // the teacher's secret rules for the class (nobody can see them until the teacher asks)
  const VERBS = ['talk', 'walk', 'sit down', 'stand up', 'laugh', 'clap', 'sing', 'jump'];
  const CONDS = ['you are a girl', 'you are a boy', 'you have a sister', 'you have a pet', 'your name has the letter A', 'you are wearing something blue',
    'you have a brother', 'your birthday is in summer', 'you are wearing white shoes', 'you like pizza', 'you are the tallest in your row', 'you have long hair'];
  $$('.ac-secret').forEach(box => {
    const rule = box.querySelector('.rule'), peek = box.querySelector('.peek'), nw = box.querySelector('.new');
    let text = '';
    rule.dataset.hidden = '🔒 The rule is secret…';
    rule.textContent = rule.dataset.hidden;
    nw.addEventListener('click', () => {
      text = `You can ${pick(VERBS)} only if ${pick(CONDS)}.`;
      rule.classList.remove('show'); rule.textContent = '🔒 New rule ready. Only the teacher knows it!';
    });
    peek.addEventListener('click', () => {
      if (!text) { rule.textContent = 'Press “New secret rule” first.'; return; }
      rule.classList.add('show'); rule.textContent = text; hideLater(rule);
    });
  });

  // the desert island: the pupil taps a thing, the machine says Yes, you can / No, you can't
  const THINGS = [
    ['🍌', 'banana', { food: 1, yellow: 1 }], ['🍎', 'apple', { food: 1, red: 1, round: 1 }], ['🍕', 'pizza', { food: 1, round: 1 }],
    ['🍊', 'orange', { food: 1, round: 1 }], ['🍓', 'strawberry', { food: 1, red: 1 }], ['🐱', 'cat', { animal: 1, legs4: 1 }],
    ['🐶', 'dog', { animal: 1, legs4: 1 }], ['🐴', 'horse', { animal: 1, legs4: 1 }], ['🦆', 'duck', { animal: 1 }],
    ['🐟', 'fish', { animal: 1 }], ['🐘', 'elephant', { animal: 1, legs4: 1 }], ['🐻', 'bear', { animal: 1, legs4: 1 }],
    ['⚽', 'ball', { round: 1 }], ['📚', 'book', {}], ['🎸', 'guitar', {}], ['📱', 'phone', {}], ['🪑', 'chair', { legs4: 1 }],
    ['🛏️', 'bed', {}], ['🚲', 'bike', {}], ['🚌', 'bus', {}], ['⏰', 'clock', { round: 1 }], ['🌹', 'rose', { red: 1 }],
    ['🎒', 'bag', {}], ['🦁', 'lion', { animal: 1, legs4: 1 }],
  ].map(([e, n, p]) => ({ e, n, p }));
  const RULES = [
    ['You can take only food.', t => t.p.food],
    ['You can take only animals.', t => t.p.animal],
    ['You can take only things that start with B.', t => t.n[0] === 'b'],
    ['You can take only things that start with a vowel.', t => 'aeiou'.includes(t.n[0])],
    ['You can take only things with four legs.', t => t.p.legs4],
    ['You can take only round things.', t => t.p.round],
    ['You can take only red things.', t => t.p.red],
    ['You can take only things with five letters.', t => t.n.length === 5],
    ['You can take only things with two syllables.', t => ['apple', 'orange', 'pizza', 'guitar', 'lion'].includes(t.n)],
  ];
  $$('.ac-island').forEach(box => {
    const grid = box.querySelector('.grid'), say = box.querySelector('.say'), rule = box.querySelector('.rule');
    const yes = box.querySelector('.lists .yes ul'), no = box.querySelector('.lists .no ul'), cnt = box.querySelector('.count');
    let cur = null, asked = 0;
    rule.dataset.hidden = '🔒 The rule is secret…';
    grid.innerHTML = THINGS.map((t, i) => `<button type="button" data-i="${i}"><i aria-hidden="true">${t.e}</i>${t.n}</button>`).join('');
    const reset = () => {
      cur = pick(RULES); asked = 0;
      yes.innerHTML = ''; no.innerHTML = ''; cnt.textContent = 'Questions: 0';
      say.className = 'say'; say.textContent = 'Ask: “Can I take a … to the desert island?” Tap a thing!';
      rule.classList.remove('show'); rule.textContent = rule.dataset.hidden;
      grid.querySelectorAll('button').forEach(b => b.classList.remove('yes', 'no'));
    };
    box.querySelector('.new').addEventListener('click', reset);
    box.querySelector('.peek').addEventListener('click', () => {
      if (!cur) { reset(); }
      rule.classList.add('show'); rule.textContent = cur[0]; hideLater(rule, 8000);
    });
    grid.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (!cur) reset();
      const t = THINGS[+b.dataset.i];
      if (b.classList.contains('yes') || b.classList.contains('no')) return;
      const ok = !!cur[1](t);
      asked++; cnt.textContent = `Questions: ${asked}`;
      b.classList.add(ok ? 'yes' : 'no');
      const art = 'aeiou'.includes(t.n[0]) ? 'an' : 'a';
      say.className = 'say ' + (ok ? 'yes' : 'no');
      say.textContent = ok ? `✅ Yes, you can take ${art} ${t.n}!` : `❌ No, you can’t take ${art} ${t.n}.`;
      (ok ? yes : no).insertAdjacentHTML('beforeend', `<li>${t.e} ${t.n}</li>`);
    });
    reset();
  });

  /* ================= 6 · random variation of the warm-up ================= */
  $$('.ac-variation').forEach(box => {
    const out = box.querySelector('.out'), items = (box.dataset.items || '').split('|');
    box.querySelector('button').addEventListener('click', () => {
      let n = 0;
      const iv = setInterval(() => { out.textContent = pick(items); if (++n > 8) clearInterval(iv); }, 70);
    });
  });
})();

// Yoga self-assessment: the five rows [alice-yoga:R] give a grade out of 10 (4 to 10, like the tests of the book)
(() => {
  const box = document.getElementById('ac-grade');
  if (!box) return;
  const rows = [...document.querySelectorAll('.yg-row.opt')];
  const num = box.querySelector('.num'), msg = box.querySelector('.msg');
  const show = () => {
    const lv = rows.map(r => [...r.querySelectorAll('button')].findIndex(b => b.classList.contains('on')) + 1);
    const done = lv.filter(Boolean).length;
    if (done < rows.length) { num.textContent = '–'; msg.textContent = `choose a level for each trait (${done}/${rows.length})`; return; }
    const sum = lv.reduce((a, b) => a + b, 0);                       // 5 … 20
    const g = Math.round((4 + (sum - rows.length) / (3 * rows.length) * 6) * 2) / 2; // 4 … 10, steps of 0.5
    num.textContent = String(g).replace('.', ',');
    msg.textContent = `${sum} points out of ${4 * rows.length}`;
  };
  rows.forEach(r => new MutationObserver(show).observe(r, { attributes: true, subtree: true, attributeFilter: ['class'] }));
  show();
})();
