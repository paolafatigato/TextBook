// Ribbons of words (marquees) in the chapters: they slide slowly, a click stops or restarts them.
// The sliding is done in CSS (.paused stops it); the metaphors ribbon is an SVG animation, handled in metaphors.js.
(() => {
  // jb-marquee and wh-marq: make the text long enough for a seamless loop of two identical halves
  document.querySelectorAll('.jb-marquee > span').forEach(span => {
    const half = (span.textContent.trim() + ' ').repeat(2);
    span.textContent = half + half;
  });
  document.addEventListener('click', e => {
    const ribbon = e.target.closest('.jb-marquee, .wh-marq, .em-marq, .sp-ribbon');
    if (ribbon) ribbon.classList.toggle('paused');
  });
})();

// Daily routine: the words written along the wave slide like the metaphors ribbon (same trick: startOffset animation)
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ribbons = [...document.querySelectorAll('.rt-wavetext')];
  function start() {
    ribbons.forEach(svg => {
      const text = svg.querySelector('textPath');
      if (svg.dataset.moving || !text) return;
      const copy = text.textContent.trim() + ' ';
      text.textContent = copy;
      const length = svg.querySelector('text').getComputedTextLength();
      if (!length) return; // the spread is not visible yet
      svg.dataset.moving = 1;
      text.textContent = copy.repeat(4);
      const move = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      move.setAttribute('attributeName', 'startOffset');
      move.setAttribute('from', 0);
      move.setAttribute('to', -length);
      move.setAttribute('dur', `${length / 4}s`); // about 4 units a second
      move.setAttribute('repeatCount', 'indefinite');
      text.appendChild(move);
      svg.style.pointerEvents = 'auto'; // a click stops or restarts it
      svg.style.cursor = 'pointer';
      svg.addEventListener('click', () => svg.animationsPaused() ? svg.unpauseAnimations() : svg.pauseAnimations());
    });
  }
  document.addEventListener('spreadchange', start);
  document.fonts?.ready.then(start);
  start();
})();
