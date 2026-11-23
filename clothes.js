// The decorative drawings of the garments (img/clothes/art/<name>.png): until one is drawn, a drawing of the dress-up game (img/dress) stands in
// for it, the same garment when there is one, else the next of the others. Add the file in img/clothes/art and it takes its place.
const CL_ART_SAME = { tshirt: 't-shirt', sweater: 'oversize-sweater', jeans: 'jeans', gloves: 'gloves', skirt: 'skirt', hat: 'cap', boots: 'combat-boots', sneakers: 'sneakers', shorts: 'shorts', hoodie: 'hoodie', sunglasses: 'sunglasses', scarf: 'scarf', socks: 'socks', backpack: 'backpack', bag: 'backpack' };
const CL_ART_POOL = ['gym-outfit', 'overalls', 'skirt', 'bell-bottoms', 'jeans', 't-shirt', 'oversize-sweater', 'gloves'];
let clArtNext = 0;
function clArtFallback(img) {
  img.onerror = () => img.remove();
  const name = (img.getAttribute('src').match(/art\/([a-z0-9-]+)\.png/) || [])[1];
  img.src = `img/dress/${CL_ART_SAME[name] || CL_ART_POOL[clArtNext++ % CL_ART_POOL.length]}.png`;
}

// Clothes & Fashion show ([clothes-vocab … clothes-show-crew]): the A-Z counter on [clothes-accessories], the judges' totals on [clothes-auction:R],
// the fashion show bingo on [clothes-pc-story:R], the sentence builders on [clothes-show-build:R], the voice buttons (listen, record yourself)
// on the show-training pages and the host cards on [clothes-show-script].
// The answers themselves are saved by script.js.

(() => {
  const $ = id => document.getElementById(id);
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };


  // [clothes-wearing:R]: the grid. Type a letter and the cursor goes on along the word; Check marks the letters right or wrong.
  const cwCells = [...document.querySelectorAll('input.cw-c')];
  const cwAt = (x, y) => cwCells.find(c => +c.dataset.x === x && +c.dataset.y === y);
  const cwScore = $('cw-score');
  cwCells.forEach(c => {
    c.addEventListener('input', () => {
      c.value = c.value.replace(/[^a-z]/gi, '').slice(-1).toUpperCase();
      if (cwScore) cwScore.textContent = '';
      if (!c.value) return;
      const x = +c.dataset.x, y = +c.dataset.y;
      (cwAt(x + 1, y) || cwAt(x, y + 1))?.focus();
    });
    c.addEventListener('keydown', e => {
      const x = +c.dataset.x, y = +c.dataset.y;
      const go = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
      if (go) { const t = cwAt(x + go[0], y + go[1]); if (t) { e.preventDefault(); e.stopPropagation(); t.focus(); } }
      else if (e.key === 'Backspace' && !c.value) (cwAt(x - 1, y) || cwAt(x, y - 1))?.focus();
    });
    c.addEventListener('focus', () => c.select());
  });
  $('cw-check')?.addEventListener('click', () => {
    let right = 0, filled = 0;
    cwCells.forEach(c => {
      c.classList.remove('ok', 'no');
      if (!c.value.trim()) return;
      filled++;
      const ok = c.value.toUpperCase() === c.dataset.l;
      c.classList.add(ok ? 'ok' : 'no');
      if (ok) right++;
    });
    cwScore.textContent = right === cwCells.length ? '🎉 Perfect! All the letters are right.' : `${right} right · ${filled - right} wrong · ${cwCells.length - filled} still empty`;
  });
  $('cw-clear')?.addEventListener('click', () => {
    cwCells.forEach(c => { c.value = ''; c.classList.remove('ok', 'no'); c.dispatchEvent(new Event('input')); });
    if (cwScore) cwScore.textContent = '';
  });

  // [clothes-wearing:R]: click a picture of the crossword (digital book only) to see its word; click again to hide it
  document.querySelectorAll('.cw-pic').forEach(p => p.addEventListener('click', () => p.classList.toggle('show')));

  // [clothes-accessories]: how many letters of the alphabet game are filled in
  const abc = [...document.querySelectorAll('.cl-abc')];
  const count = $('cl-abc-count');
  const paintAbc = () => { if (count) count.textContent = `${abc.filter(i => i.value.trim()).length} / 26`; };
  abc.forEach(i => i.addEventListener('input', paintAbc));

  // [clothes-auction:R]: total of the three scores of each model
  const rows = [...document.querySelectorAll('tr[data-sum]')];
  const paintRows = () => rows.forEach(tr => {
    const scores = [...tr.querySelectorAll('.cl-n')].map(i => num(i.value));
    tr.querySelector('.cl-tot').textContent = scores.every(s => s === null) ? ' ' : String(scores.reduce((a, s) => a + (s || 0), 0));
  });
  rows.forEach(tr => tr.addEventListener('input', paintRows));

  // [clothes-pc-story:R]: fashion show bingo. A square is crossed when a name is written in it; 5 in a row = BINGO
  const bingo = $('cl-bingo');
  const bingoCards = bingo ? [...bingo.querySelectorAll('.cl-bingo-card')] : [];
  const bingoLines = (() => {
    const l = [];
    for (let i = 0; i < 5; i++) { l.push([0, 1, 2, 3, 4].map(j => i * 5 + j), [0, 1, 2, 3, 4].map(j => j * 5 + i)); }
    l.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
    return l;
  })();
  const paintFsw = () => {
    let any = false;
    bingoCards.forEach(card => {
      const cells = [...card.querySelectorAll('.cl-bc')];
      cells.forEach(c => c.classList.remove('line'));
      const done = cells.map(c => { const on = !!c.querySelector('input').value.trim(); c.classList.toggle('on', on); return on; });
      const won = bingoLines.filter(ln => ln.every(i => done[i]));
      won.forEach(ln => ln.forEach(i => cells[i].classList.add('line')));
      if (!card.hidden) {
        any = won.length > 0;
        $('cl-bingo-count').textContent = `${done.filter(Boolean).length} / 25`;
      }
    });
    if (bingo) $('cl-bingo-win').hidden = !any;
  };
  bingo?.addEventListener('input', paintFsw);
  bingo?.querySelectorAll('.cl-bingo-tab').forEach(tab => tab.addEventListener('click', () => {
    bingo.querySelectorAll('.cl-bingo-tab').forEach(t => t.classList.toggle('on', t === tab));
    bingoCards.forEach(c => { c.hidden = c.dataset.card !== tab.dataset.card; });
    paintFsw();
  }));

  // [clothes-show-script]: a host card writes the three sentences of the host from its fields
  const cards = [...document.querySelectorAll('.cl-hc')];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const paintCards = () => cards.forEach(card => {
    const field = (suffix) => card.querySelector(`input[id$="-${suffix}"]`).value.trim();
    const part = (v, hint) => (v ? { text: v, ok: true } : { text: hint, ok: false });
    const name = part(field('name'), 'the model');
    const cls = part(field('class'), '…');
    const top = part(field('top'), '…');
    const bottom = part(field('bottom'), '…');
    const extra = part(field('extra'), '…');
    const show = part(field('show'), '…');
    const mark = p => (p.ok ? esc(p.text) : '<u>…</u>');
    const plain = p => (p.ok ? p.text : '');
    card.querySelector('.cl-hc-out > div').innerHTML =
      `Next we have <b>${mark(name)}</b> from class <b>${mark(cls)}</b>.<br>` +
      `${esc(cap(name.text))} is wearing <b>${mark(top)}</b> and <b>${mark(bottom)}</b>. ${esc(cap(name.text))} is also wearing <b>${mark(extra)}</b>.<br>` +
      `${esc(cap(name.text))}, please show us your <b>${mark(show)}</b>.`;
    card.querySelector('.cl-hc-out').dataset.say =
      `Next we have ${plain(name) || 'the model'} from class ${plain(cls)}. ${cap(name.text)} is wearing ${plain(top)} and ${plain(bottom)}. ${cap(name.text)} is also wearing ${plain(extra)}. ${cap(name.text)}, please show us your ${plain(show)}.`;
  });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  cards.forEach(card => card.addEventListener('input', paintCards));

  const paintAll = () => { paintAbc(); paintRows(); paintFsw(); paintCards(); };
  paintAll();
  // script.js puts the saved answers back after the page has loaded
  window.addEventListener('load', () => setTimeout(paintAll));
  $('clearBtn')?.addEventListener('click', () => setTimeout(paintAll));
})();

// [clothes-show-build:R]: tap the words of a sentence in the right order
(() => {
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  document.querySelectorAll('.cl-build').forEach(box => {
    const words = box.dataset.sentence.split(' ');
    const out = box.querySelector('.out');
    const bank = box.querySelector('.bank');
    const msg = box.querySelector('.msg');
    const voice = box.querySelector('.cl-vbs');
    let order, used;
    // shuffled again if it comes out in the right order by chance
    const start = () => {
      do { order = shuffle(words.map((w, i) => i)); } while (words.length > 1 && order.every((n, i) => n === i));
      used = [];
      box.classList.remove('ok', 'no');
      msg.textContent = '';
      voice.hidden = true;
      paint();
    };
    const chip = i => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cl-chip';
      b.textContent = words[i];
      b.addEventListener('click', () => {
        if (used.includes(i)) used = used.filter(n => n !== i); else used.push(i);
        box.classList.remove('ok', 'no');
        msg.textContent = '';
        paint();
      });
      return b;
    };
    function paint() {
      out.replaceChildren(...used.map(chip));
      bank.replaceChildren(...order.filter(i => !used.includes(i)).map(chip));
    }
    box.dataset.say = box.dataset.sentence;
    box.querySelector('[data-b="check"]').addEventListener('click', () => {
      const ok = used.length === words.length && used.every((n, i) => words[n] === words[i]);
      box.classList.toggle('ok', ok);
      box.classList.toggle('no', !ok);
      msg.textContent = ok ? '✓ Great! Now say it out loud.' : '✗ Not yet. Tap a word to take it back.';
      voice.hidden = !ok;
    });
    box.querySelector('[data-b="reset"]').addEventListener('click', start);
    start();
  });
})();

// Voice buttons ([data-say] rows): 🔊 listen, 🐢 listen slowly (the voice of the browser), 🎤 record yourself, ▶ listen to yourself.
// The recording stays in this page and is never sent anywhere. Not printed.
(() => {
  const synth = window.speechSynthesis;
  const canRecord = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
  if (!synth) document.body.classList.add('cl-no-voice');
  if (!canRecord) document.body.classList.add('cl-no-rec');

  const voice = () => {
    const en = synth.getVoices().filter(v => v.lang.replace('_', '-').startsWith('en'));
    return en.find(v => v.lang.replace('_', '-') === 'en-US' && /female|zira|samantha|jenny|aria/i.test(v.name)) || en.find(v => v.lang.replace('_', '-') === 'en-US') || en[0];
  };
  let lit = null; // the button that is playing
  let clip = null; // the recording being played
  let rec = null; // { recorder, stream, btn, row }
  const clips = new WeakMap(); // row → address of its recording

  const stop = () => {
    synth?.cancel();
    clip?.pause();
    clip = null;
    lit?.classList.remove('on');
    lit = null;
  };
  const light = btn => { lit = btn; btn.classList.add('on'); };

  const speak = (btn, text, rate) => {
    const same = lit === btn;
    stop();
    if (same) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.voice = voice() || null;
    u.rate = rate;
    u.onend = u.onerror = () => { if (lit === btn) stop(); };
    light(btn);
    synth.speak(u);
  };

  const stopRecording = () => { if (rec) rec.recorder.state !== 'inactive' && rec.recorder.stop(); };
  const record = async (btn, row) => {
    if (rec) { const again = rec.btn === btn; stopRecording(); if (again) return; }
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      const mine = { recorder, stream, btn, row };
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        clearTimeout(mine.timer);
        btn.classList.remove('on');
        if (rec === mine) rec = null;
        if (chunks.length) {
          const old = clips.get(row);
          if (old) URL.revokeObjectURL(old);
          clips.set(row, URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })));
          row.querySelector('.cl-vb.me').disabled = false;
        }
      };
      mine.timer = setTimeout(stopRecording, 20000);
      rec = mine;
      btn.classList.add('on');
      recorder.start();
    } catch {
      btn.title = 'The microphone is blocked: allow it in the browser';
      btn.disabled = true;
    }
  };

  document.addEventListener('click', e => {
    const btn = e.target.closest('.cl-vb');
    if (!btn) return;
    const row = btn.closest('[data-say]');
    if (!row) return;
    if (btn.classList.contains('play')) speak(btn, row.dataset.say, 0.95);
    else if (btn.classList.contains('slow')) speak(btn, row.dataset.say, 0.55);
    else if (btn.classList.contains('rec')) record(btn, row);
    else if (btn.classList.contains('me')) {
      const url = clips.get(row);
      if (!url) return;
      const same = lit === btn;
      stop();
      if (same) return;
      clip = new Audio(url);
      clip.onended = () => { if (lit === btn) stop(); };
      light(btn);
      clip.play().catch(() => stop());
    }
  });

  // [clothes-pc-games]: roll the die of the board game on the page
  document.addEventListener('click', e => {
    const btn = e.target.closest('.cl-dice-btn');
    if (!btn) return;
    const face = btn.parentElement.querySelector('.cl-dice-face');
    const glyph = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    let ticks = 0;
    btn.disabled = true;
    const t = setInterval(() => {
      const n = 1 + Math.floor(Math.random() * 6);
      face.innerHTML = glyph[n - 1];
      if (++ticks < 9) return;
      clearInterval(t);
      face.innerHTML = `${glyph[n - 1]}<b>${n}</b>`;
      btn.disabled = false;
      btn.textContent = '🎲 Roll again';
    }, 70);
  });

  // [clothes-pc-practice]: goose game around the border of p.81-82 — ? squares open a question card, START has a die
  const RB_CARDS = [
    {"q":"Which time word is NOT normally used with the present simple?","o":["usually","never","right now"],"a":"c) right now — it goes with the present continuous."},
    {"q":"Which sentence is correct? Why?","o":["She wears a red coat every winter.","She is wearing a red coat every winter."],"a":"a) “Every winter” is a habit, so we use the present simple."},
    {"q":"What is the missing word?","t":"What ______ the model wearing today?","a":"is — What is the model wearing today?"},
    {"q":"Which time word is NOT normally used with the present continuous?","o":["at the moment","every day","today"],"a":"b) every day — it goes with the present simple."},
    {"q":"Finish the sentence: “I always …”","o":["wear sneakers to school.","am wearing sneakers to school.","wearing sneakers to school."],"a":"a) I always wear sneakers to school."},
    {"q":"Why do we use the present simple here?","t":"“Our school has a fashion club.”","a":"It is a fact that is always true (permanent), not something happening right now."},
    {"q":"Complete with the correct form.","t":"Please be quiet! The judges ______ (look) at the models.","a":"are looking"},
    {"q":"Correct this sentence.","t":"The models walking on the runway.","a":"The models are walking on the runway."},
    {"q":"Which sentence is correct?","o":["I don’t wear a hat in summer.","I’m not wear a hat in summer.","I not wear a hat in summer."],"a":"a) I don’t wear a hat in summer."},
    {"q":"Make a correct sentence with these words.","t":"we / try on / new jackets / right now","a":"We are trying on new jackets right now."},
    {"q":"Correct this sentence.","t":"Lucy is wanting a blue dress.","a":"Lucy wants a blue dress. (“want” does not take -ing)"},
    {"q":"Complete the sentence.","t":"My brother usually ______ (wear) jeans, but today he ______ (wear) a suit.","a":"wears · is wearing"},
    {"q":"Complete the sentence.","t":"Emma ______ (not like) pink, so she ______ (not try on) the pink skirt.","a":"doesn’t like · isn’t trying on"},
    {"q":"Correct this sentence.","t":"My sister doesn’t never wear shorts.","a":"My sister never wears shorts. / My sister doesn’t ever wear shorts."},
    {"q":"What is the difference in meaning?","o":["Tom plays the guitar.","Tom is playing the guitar."],"a":"a) It is a habit or a skill. b) He is doing it right now."},
    {"q":"Finish the sentence: “The tailors are sewing a dress …”","o":["every Monday.","at the moment.","usually."],"a":"b) at the moment."},
    {"q":"Complete the sentence.","t":"Mia ______ (not usually / wear) heels, but tonight she ______ (wear) high heels!","a":"doesn’t usually wear · is wearing"},
    {"q":"Finish the sentence: “I can’t talk now because …”","o":["I try on shoes.","I’m trying on shoes.","I tries on shoes."],"a":"b) I’m trying on shoes."},
    {"q":"Make a correct question.","t":"where / your cousin / buy / her clothes","a":"Where does your cousin buy her clothes?"},
    {"q":"Correct this sentence.","t":"Who are Anna go shopping with?","a":"Who does Anna go shopping with?"},
    {"q":"Choose the correct form.","t":"Look! The model ______ a red hat.","o":["wears","is wearing","wearing"],"a":"b) is wearing — “Look!” = right now."},
    {"q":"Which question is correct?","o":["Does she wears glasses?","Does she wear glasses?","Is she wear glasses?"],"a":"b) Does she wear glasses?"},
    {"q":"Complete the sentence.","t":"Every morning my dad ______ (put on) a tie.","a":"puts on"},
    {"q":"Correct this sentence.","t":"I am knowing the answer.","a":"I know the answer. (“know” does not take -ing)"},
    {"q":"Make a correct question.","t":"you / wear / a uniform / at school","a":"Do you wear a uniform at school?"},
    {"q":"Make a correct question.","t":"the judges / look at / the models / now","a":"Are the judges looking at the models now?"},
    {"q":"Complete the sentence.","t":"We ______ (not wear) shorts in winter.","a":"don’t wear"},
    {"q":"Complete the sentence.","t":"Be quiet! The baby ______ (sleep).","a":"is sleeping"},
    {"q":"Which time word goes with the present continuous?","o":["always","right now","every day"],"a":"b) right now"},
    {"q":"Correct this sentence.","t":"She don’t like high heels.","a":"She doesn’t like high heels."},
    {"q":"Finish the sentence: “Look at Ben! He …”","o":["wears a funny hat.","is wearing a funny hat."],"a":"b) is wearing a funny hat."},
    {"q":"Complete the question.","t":"What ______ you usually ______ (wear) to a party?","a":"do · wear"},
    {"q":"Correct this sentence.","t":"The students is trying on uniforms.","a":"The students are trying on uniforms."},
    {"q":"Which sentence is correct?","o":["He isn’t wearing a coat today.","He doesn’t wearing a coat today."],"a":"a) He isn’t wearing a coat today."},
    {"q":"Write the -ing form.","t":"take · run · tie · put","a":"taking · running · tying · putting"},
    {"q":"What is the difference in meaning?","o":["I wear sneakers.","I’m wearing sneakers."],"a":"a) It is a habit (usually). b) I am wearing them now."},
    {"q":"Complete the sentence.","t":"Listen! Mia ______ (sing) in the shower.","a":"is singing"},
    {"q":"Which sentence is correct?","o":["We are usually eating lunch at noon.","We usually eat lunch at noon."],"a":"b) We usually eat lunch at noon."},
    {"q":"Correct this question.","t":"What do the models wear now?","a":"What are the models wearing now?"},
    {"q":"Complete the sentence.","t":"My mother ______ (not work) on Sundays.","a":"doesn’t work"},
    {"q":"Make a correct sentence.","t":"she / never / wear / sandals / in winter","a":"She never wears sandals in winter."},
    {"q":"Finish the sentence: “Sorry, I can’t come. I …”","o":["study.","am studying.","studying."],"a":"b) I am studying. (right now)"},
    {"q":"Complete the question.","t":"______ your sister like pink?","a":"Does"},
    {"q":"Correct this question.","t":"Is Tom wear a jacket today?","a":"Is Tom wearing a jacket today?"},
    {"q":"Which time word goes with the present simple?","o":["at the moment","on Fridays","now"],"a":"b) on Fridays"},
    {"q":"Complete the sentence.","t":"Look! It ______ (rain) and the kids ______ (wear) raincoats.","a":"is raining · are wearing"},
    {"q":"Correct this sentence.","t":"He watch TV every night.","a":"He watches TV every night."},
    {"q":"Write the -ing form.","t":"write · sit · dance · swim","a":"writing · sitting · dancing · swimming"}
  ];
  let rbDeck = [], rbPop = null;
  const rbDraw = () => {
    if (!rbDeck.length) {
      rbDeck = RB_CARDS.map((_, i) => i);
      for (let i = rbDeck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rbDeck[i], rbDeck[j]] = [rbDeck[j], rbDeck[i]]; }
    }
    return rbDeck.pop();
  };
  const rbClose = () => { if (rbPop) { rbPop.remove(); rbPop = null; } };
  const rbOpen = () => {
    rbClose();
    const i = rbDraw(), c = RB_CARDS[i];
    rbPop = document.createElement('div');
    rbPop.className = 'rb-pop';
    rbPop.innerHTML = '<div class="rb-card" role="dialog" aria-label="Question card"><span class="rb-mark">?</span>'
      + '<p class="rb-qn"><b>' + (i + 1) + '.</b> ' + c.q + '</p>'
      + (c.t ? '<p class="rb-qt">' + c.t + '</p>' : '')
      + (c.o ? '<ol>' + c.o.map((x, j) => '<li><b>' + 'abc'[j] + ')</b> ' + x + '</li>').join('') + '</ol>' : '')
      + '<p class="rb-ans" hidden>✔ ' + c.a + '</p>'
      + '<div class="rb-btns"><button type="button" data-rb="show">Show answer</button><button type="button" data-rb="close" class="ghost">Close</button></div></div>';
    document.body.appendChild(rbPop);
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') rbClose(); });
  document.addEventListener('click', e => {
    if (rbPop) {
      const act = e.target.closest('[data-rb]');
      if (act && act.dataset.rb === 'show') { rbPop.querySelector('.rb-ans').hidden = false; act.hidden = true; return; }
      if (act || e.target === rbPop) { rbClose(); return; }
    }
    if (e.target.closest('.rb-q')) { rbOpen(); return; }
    const die = e.target.closest('.rb-die');
    if (!die || die.disabled) return;
    const glyph = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    let ticks = 0;
    die.disabled = true;
    const t = setInterval(() => {
      const n = 1 + Math.floor(Math.random() * 6);
      die.innerHTML = '<span>' + glyph[n - 1] + '</span>' + (ticks >= 8 ? '<b>' + n + '</b>' : '');
      if (++ticks > 8) { clearInterval(t); die.disabled = false; }
    }, 70);
  });
})();
