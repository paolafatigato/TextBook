// Persephone, the play (greek-play): online, a click on a word says it, and the little speaker at the end of a line says the whole line.
// It uses the voices of the browser (speechSynthesis); without them nothing is added. Not printed.
(() => {
  if (!('speechSynthesis' in window)) return;
  const spread = document.querySelector('.spread[data-id="greek-play"]');
  if (!spread) return;

  // the cast: Hades and Zeus have a male voice, each with a pitch of its own (lower if the device has no male voice)
  const CAST = { persephone: { pitch: 1.35 }, demeter: { pitch: 1.05 }, hades: { male: true, pitch: .85, low: .65 }, zeus: { male: true, pitch: .95, low: .8 } };
  let current = null; // the element being read

  const MALE = /(?<!fe)male|david|mark|guy|james|george|daniel|alex|fred|ryan|christopher|eric|davis|tony|brian|andrew|roger|steffan/i;
  const voice = male => {
    const en = speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').startsWith('en'));
    const us = en.filter(v => v.lang.replace('_', '-') === 'en-US');
    if (male) return us.find(v => MALE.test(v.name)) || en.find(v => MALE.test(v.name)); // none: undefined, the pitch does the job
    return us.find(v => /female|zira|samantha|jenny|aria/i.test(v.name)) || us[0] || en[0];
  };
  let clip = null; // the recording being played
  const stop = () => {
    speechSynthesis.cancel();
    clip?.pause();
    clip = null;
    current?.classList.remove('pv-on');
    current = null;
  };
  // a line: the recording audio/persephone/Persephone <scene>.<line>.mp3 (a scene is one block of the text) if it is there, otherwise the voice of the browser
  const sayLine = (p, name, who) => {
    const same = current === p;
    stop();
    if (same) return;
    const a = new Audio(encodeURI(`audio/persephone/Persephone ${name}.mp3`));
    clip = a;
    current = p;
    p.classList.add('pv-on');
    a.onended = () => { if (clip === a) stop(); };
    a.onerror = () => { if (clip === a) { stop(); say(lineText(p), p, who); } }; // no file: the browser voice
    a.play().catch(() => {}); // a missing file ends in onerror
  };
  const say = (text, el, who) => {
    const same = current === el;
    stop();
    if (same) return; // a second click on the same thing stops it
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    const c = CAST[who] || { pitch: 1 };
    const v = voice(c.male);
    u.voice = v || voice(false) || null;
    u.rate = .9;
    u.pitch = c.male && !v ? c.low : c.pitch;
    u.onend = u.onerror = () => { if (current === el) { el.classList.remove('pv-on'); current = null; } };
    current = el;
    el.classList.add('pv-on');
    speechSynthesis.speak(u);
  };

  // the words of a line: no name before the colon and no stage directions in italics
  const lineText = p => {
    const copy = p.cloneNode(true);
    copy.querySelectorAll('b, i, .pv-say').forEach(n => n.remove());
    return copy.textContent.replace(/^[\s:]+/, '').replace(/\s+/g, ' ').trim();
  };

  let last = '';
  spread.querySelectorAll('.play').forEach((scene, s) => scene.querySelectorAll('p').forEach((p, i) => {
    // every word in its own span (the text nodes only, so b and i stay as they are)
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const parts = node.textContent.split(/(\s+)/);
      if (parts.length < 2 && !node.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      parts.forEach(part => {
        if (!part.trim()) return frag.append(part);
        const w = document.createElement('span');
        w.className = 'pv-w';
        w.textContent = part;
        frag.append(w);
      });
      node.replaceWith(frag);
    });

    // a line without a name goes on with the last speaker
    const who = p.dataset.speaker = (p.className.match(/who-(?!none)(\w+)/) || [])[1] || last;
    last = who;
    if (!lineText(p)) return; // only a stage direction: nothing to listen to
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pv-say';
    btn.title = 'Listen to this line';
    btn.setAttribute('aria-label', 'Listen to this line');
    btn.textContent = '🔊';
    btn.addEventListener('click', e => {
      e.stopPropagation();
      sayLine(p, `${s + 1}.${i + 1}`, who);
    });
    p.append(btn);
  }));

  // the Underworld scenes are printed upside down (the reader turns the book): on screen a button turns the whole spread, drawing included
  const turn = document.createElement('button');
  turn.type = 'button';
  turn.className = 'pv-turn abs';
  turn.style.cssText = '--x:39.7;--y:20.4';
  const label = () => { turn.textContent = spread.classList.contains('pv-turned') ? '🔄 Turn the book back' : '🔄 Turn the book around'; };
  label();
  turn.addEventListener('click', () => { spread.classList.toggle('pv-turned'); label(); });
  spread.querySelector('.page-left').append(turn);

  spread.addEventListener('click', e => {
    const w = e.target.closest('.pv-w');
    if (!w) return;
    const text = w.textContent.replace(/[^\p{L}'’-]/gu, '');
    if (text) say(text, w, w.closest('p').dataset.speaker);
  });

  document.addEventListener('spreadchange', stop);
  window.addEventListener('beforeprint', stop);
})();
