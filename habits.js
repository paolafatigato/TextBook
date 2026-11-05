// Tiny habits ([hb-intro … hb-project]): the small tools of the chapter.
// 1. The 1.01 / 0.99 curves with a slider ([hb-intro:R]).
// 2. The habit-loop ruler: click a part to read an example ([hb-loop]).
// 3. The sentence builders: tap chips to make "I will… at… in…" and "After I… I will…" ([hb-plan]); 🔊 reads it aloud.
// 4. Flip cards (good habit ⇄ bad habit) ([hb-bad:R]).
// 5. The 14-day chain: the day buttons are `.toggle`s (script.js saves them); this only counts the streak ([hb-project:R]).
// 6. Advice roulette: a random problem, the pupil answers with "should" ([hb-advice:R]).
// Nothing here is a game against the computer, and nothing is sent anywhere: only what script.js saves (the toggles, the inputs).

(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const speak = text => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = .9;
    synth.speak(u);
  };

  /* ================= 1 · the curves ================= */
  $$('.hb-grow').forEach(box => {
    const slider = box.querySelector('input[type=range]');
    const [up, dn] = [box.querySelector('.up'), box.querySelector('.dn')];
    const [pu, pd] = [box.querySelector('.pu'), box.querySelector('.pd')];
    const X0 = 12, X1 = 188, BASE = 46;
    // value -> height: above the dotted line it goes up to 37.78, below it goes down to 0.03 (not to scale: to be seen)
    const yOf = v => (v >= 1 ? BASE - (v - 1) * (40 / 36.78) : BASE + (1 - v) * 18);
    const xOf = t => X0 + (X1 - X0) * (t / 365);
    const path = f => { let d = ''; for (let t = 0; t <= 365; t += 5) d += `${t ? 'L' : 'M'}${xOf(t).toFixed(1)} ${yOf(f(t)).toFixed(1)}`; return d + `L${xOf(365).toFixed(1)} ${yOf(f(365)).toFixed(1)}`; };
    const [fu, fd] = [t => Math.pow(1.01, t), t => Math.pow(.99, t)];
    up.setAttribute('d', path(fu)); dn.setAttribute('d', path(fd));
    const show = () => {
      const t = +slider.value;
      const [a, b] = [fu(t), fd(t)];
      pu.setAttribute('cx', xOf(t)); pu.setAttribute('cy', yOf(a));
      pd.setAttribute('cx', xOf(t)); pd.setAttribute('cy', yOf(b));
      box.querySelector('.d').textContent = t;
      box.querySelector('.vu').textContent = a < 10 ? a.toFixed(2) : a.toFixed(1);
      box.querySelector('.vd').textContent = b.toFixed(2);
      box.querySelector('.mu').textContent = t === 365 ? '37 times better!' : 'times better';
      box.querySelector('.md').textContent = t === 365 ? 'almost nothing left' : 'of where you started';
    };
    slider.addEventListener('input', show);
    show();
  });

  /* ================= 2 · the habit loop ================= */
  const LOOP = [
    '<b>Cue</b> — something you see, hear or feel, and it starts the habit. <i>Your phone buzzes on the desk.</i>',
    '<b>Craving</b> — you want something. <i>You want to know who wrote to you.</i>',
    '<b>Response</b> — what you do. <i>You pick up the phone and read the message.</i>',
    '<b>Reward</b> — what you get, so your brain says “do it again!”. <i>You feel happy and connected.</i>',
  ];
  $$('.hb-loop').forEach(box => {
    const say = box.querySelector('.say');
    const btns = $$('.ruler button', box);
    btns.forEach((b, i) => b.addEventListener('click', () => {
      btns.forEach(x => x.classList.toggle('on', x === b));
      say.innerHTML = LOOP[i];
    }));
  });

  /* ================= 3 · sentence builders ================= */
  // <div class="hb-build" data-tpl="I will {0} at {1} in {2}.">: one .grp per {n}, its buttons are the chips
  $$('.hb-build').forEach(box => {
    const tpl = box.dataset.tpl;
    const picks = {};
    const out = box.querySelector('.out .txt');
    const hint = box.dataset.hint || 'Tap one chip in each row.';
    const render = () => {
      const groups = $$('.grp', box).length;
      const done = Array.from({ length: groups }, (_, i) => picks[i]).every(Boolean);
      if (!Object.keys(picks).length) { out.innerHTML = `<span class="ph">${esc(hint)}</span>`; return; }
      out.innerHTML = tpl.replace(/\{(\d)\}/g, (_, n) => picks[n] ? `<em>${esc(picks[n])}</em>` : '<em>…</em>');
      out.dataset.done = done ? '1' : '';
    };
    $$('.grp', box).forEach((g, gi) => $$('button', g).forEach(b => b.addEventListener('click', () => {
      const same = b.classList.contains('on');
      $$('button', g).forEach(x => x.classList.remove('on'));
      if (same) delete picks[gi]; else { b.classList.add('on'); picks[gi] = b.textContent.trim(); }
      render();
    })));
    box.querySelector('.say')?.addEventListener('click', () => speak(out.textContent.replace(/…/g, '')));
    render();
  });

  /* ================= 4 · flip cards ================= */
  $$('.hb-flip').forEach(c => c.addEventListener('click', () => c.classList.toggle('on')));

  /* ================= 5 · the chain ================= */
  $$('.hb-chain').forEach(chain => {
    const out = document.getElementById(chain.dataset.out);
    const count = () => {
      const days = $$('button.toggle', chain);
      const on = days.map(d => d.classList.contains('on'));
      let best = 0, run = 0;
      on.forEach(v => { run = v ? run + 1 : 0; best = Math.max(best, run); });
      if (out) out.innerHTML = `<b>${on.filter(Boolean).length}</b> days done · longest chain <b>${best}</b>`;
    };
    // script.js flips the class on click and then saves: count after it
    chain.addEventListener('click', () => setTimeout(count));
    setTimeout(count, 300);
  });

  /* ================= 6 · advice roulette ================= */
  const PROBLEMS = [
    ['I’m always tired at school.', 'sleep'], ['I can’t stop scrolling at night.', 'phone'], ['I never have time to read.', 'reading'],
    ['I want to learn the guitar, but I never practice.', 'music'], ['I forget my homework all the time.', 'school'],
    ['I want to save money for a new phone.', 'money'], ['I don’t like vegetables.', 'food'], ['I’m nervous before tests.', 'stress'],
    ['I want to be more active, but I hate the gym.', 'sport'], ['My room is always a mess.', 'room'], ['I start new habits and quit after three days.', 'chain'],
    ['I can’t wake up in the morning.', 'sleep'], ['I want to learn French.', 'languages'], ['I spend too much time on video games.', 'phone'],
  ];
  $$('.hb-spin').forEach(box => {
    const card = box.querySelector('.card');
    const starters = ['You should…', 'You shouldn’t…', 'Why don’t you…?', 'How about…?', 'You could…', 'I think you should…'];
    const starterEl = box.querySelector('.starter b');
    let last = -1, timer = 0;
    const draw = () => {
      let i; do { i = Math.floor(Math.random() * PROBLEMS.length); } while (i === last);
      last = i;
      return i;
    };
    const spin = () => {
      clearInterval(timer);
      card.classList.add('rolling');
      let n = 0;
      timer = setInterval(() => {
        card.innerHTML = `<span>${esc(PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)][0])}</span>`;
        if (++n > 9) {
          clearInterval(timer);
          const i = draw();
          card.classList.remove('rolling');
          card.innerHTML = `<span><b>Your friend says</b>“${esc(PROBLEMS[i][0])}”</span>`;
          if (starterEl) starterEl.textContent = starters[Math.floor(Math.random() * starters.length)];
        }
      }, 70);
    };
    box.querySelector('[data-spin]')?.addEventListener('click', spin);
    box.querySelector('[data-say]')?.addEventListener('click', () => speak(card.textContent.replace('Your friend says', '')));
  });
})();
