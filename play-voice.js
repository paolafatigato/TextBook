// Persephone, the play (greek-play): online, a click on a word says it, and the little speaker at the end of a line says the whole line.
// It uses the voices of the browser (speechSynthesis); without them nothing is added. Not printed.
(() => {
  if (!('speechSynthesis' in window)) return;
  const spread = document.querySelector('.spread[data-id="greek-play"]');
  if (!spread) return;

  // a different pitch for each character, so the lines sound like a cast
  const PITCH = { persephone: 1.35, demeter: 1.05, hades: .65, zeus: .8 };
  let current = null; // the element being read

  const voice = () => {
    const all = speechSynthesis.getVoices();
    return all.find(v => v.lang === 'en-US' && /female|zira|samantha|jenny|aria/i.test(v.name)) || all.find(v => v.lang === 'en-US') || all.find(v => v.lang.startsWith('en'));
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
  const sayLine = (p, name, pitch) => {
    const same = current === p;
    stop();
    if (same) return;
    const a = new Audio(encodeURI(`audio/persephone/Persephone ${name}.mp3`));
    clip = a;
    current = p;
    p.classList.add('pv-on');
    a.onended = () => { if (clip === a) stop(); };
    a.onerror = () => { if (clip === a) { stop(); say(lineText(p), p, pitch); } }; // no file: the browser voice
    a.play().catch(() => {}); // a missing file ends in onerror
  };
  const say = (text, el, pitch = 1) => {
    const same = current === el;
    stop();
    if (same) return; // a second click on the same thing stops it
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.voice = voice() || null;
    u.rate = .9;
    u.pitch = pitch;
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

    const who = (p.className.match(/who-(\w+)/) || [])[1];
    if (!lineText(p)) return; // only a stage direction: nothing to listen to
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pv-say';
    btn.title = 'Listen to this line';
    btn.setAttribute('aria-label', 'Listen to this line');
    btn.textContent = '🔊';
    btn.addEventListener('click', e => {
      e.stopPropagation();
      sayLine(p, `${s + 1}.${i + 1}`, PITCH[who]);
    });
    p.append(btn);
  }));

  spread.addEventListener('click', e => {
    const w = e.target.closest('.pv-w');
    if (!w) return;
    const text = w.textContent.replace(/[^\p{L}'’-]/gu, '');
    if (text) say(text, w, PITCH[(w.closest('p').className.match(/who-(\w+)/) || [])[1]]);
  });

  document.addEventListener('spreadchange', stop);
  window.addEventListener('beforeprint', stop);
})();
