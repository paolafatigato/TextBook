/* Wulf (the Longobard cat, spread ps-clil-wulf) moves with your mouse: the video frames replace the static drawing.
   The frames img/wolf/a-NNN.webp (videos/WOLF (1).mp4: turns and looks UP, then looks at you, blinks) and
   img/wolf/b-NNN.webp (videos/WOLF (2).mp4: the blink) are 360×640 px, transparent webp (lime background cut away), 24 fps,
   body aligned. They are drawn on the lime panel behind him (.lr-photo.wolf canvas.wolf-cv, one per page, each shows the whole
   panel). On paper (print) the drawing img/clil/wulf.png is shown instead (see history-chapter.css).

   BEHAVIOUR
   rest      he looks like the drawing (a-000).
   up        the pointer is ABOVE HIS EARS (the top EAR_Y of the page): a-000 … a-UP_END plays, he turns his head and looks up;
             he stays looking up (upHold) as long as the pointer stays up there.
   down      the pointer comes BELOW his ears: the rest of the video plays (a-UP_END … a-DOWN_END: he looks back at you and blinks)
             and he stays on the last picture (downHold). Pointer up again: it starts again from the beginning.
   blink     the pointer stays still in the middle or lower part for a while: he blinks (b-000 … b-BLINK_END, then the next
             time backwards, so he never jumps back), again and again at random pauses.
   Pictures that are not neighbours in a video are joined with a short cross-fade (FADE_MS). */
(() => {
  const FW = 360, FH = 640;                // frame size (px)
  const EAR_Y = 0.09;                      // his ears end at 9% of the page height: above that line the pointer is "up"
  const UP_END = 44, DOWN_END = 95, BLINK_END = 18;
  const IDLE_MS = 2500, BLINK_MIN = 3000, BLINK_MAX = 6500, FADE_MS = 200, FPS = 24;
  const idOf = (p, n) => p + '-' + String(n).padStart(3, '0');
  const num = id => +id.slice(2);
  const imgs = {};
  const load = id => new Promise(res => {
    if (imgs[id]) return res(imgs[id]);
    const im = new Image();
    im.onload = () => { imgs[id] = im; res(im); };
    im.onerror = () => res(null);
    im.src = `img/wolf/${id}.webp`;
  });
  let started = false;
  const preload = async () => {
    if (started) return;
    started = true;
    await load(idOf('a', 0));
    window.dispatchEvent(new Event('wolf-loaded'));
    const todo = [];
    for (let n = 0; n <= DOWN_END; n++) todo.push(idOf('a', n));
    for (let n = 0; n <= BLINK_END; n++) todo.push(idOf('b', n));
    let next = 0;
    const worker = async () => { while (next < todo.length) { await load(todo[next++]); } };
    await Promise.all([worker(), worker(), worker(), worker()]);
  };
  const nearestLoaded = id => {
    if (imgs[id]) return id;
    for (let d = 1; d < 40; d++) for (const q of [num(id) - d, num(id) + d]) { const o = idOf(id[0], q); if (imgs[o]) return o; }
    return imgs[idOf('a', 0)] ? idOf('a', 0) : null;
  };

  const setup = spread => {
    const cvs = [...spread.querySelectorAll('canvas.wolf-cv')];
    if (!cvs.length) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let visible = false, raf = 0, shown = null, fade = null, resized = true;
    let mode = 'rest', t0 = 0, from = 0, dir = 1, holdId = idOf('a', 0), blinkEnd = 0;
    let lastMove = performance.now(), nextBlink = lastMove + IDLE_MS, above = false;

    const size = () => cvs.forEach(cv => {
      const w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
      if (w && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; resized = true; }
    });
    const paint = (id, prev, a) => cvs.forEach(cv => {
      const ctx = cv.getContext('2d'), cw = cv.width, ch = cv.height;
      if (!cw) return;
      const s = Math.max(cw / FW, ch / FH), w = FW * s, h = FH * s;    // like object-fit: cover, bottom aligned
      const put = im => ctx.drawImage(im, (cw - w) / 2, ch - h, w, h);
      ctx.clearRect(0, 0, cw, ch);
      if (prev) put(prev);
      ctx.globalAlpha = a; put(imgs[id]); ctx.globalAlpha = 1;
    });
    const show = (want, now) => {
      const id = nearestLoaded(want);
      if (!id) return;
      if (id !== shown) {
        const joined = shown && shown[0] === id[0] && Math.abs(num(shown) - num(id)) <= 3;
        fade = shown && !joined && imgs[shown] ? { from: imgs[shown], t0: now } : null;
        shown = id; resized = false;
        paint(id, fade && fade.from, fade ? 0 : 1);
      } else if (fade) {
        const a = Math.min(1, (now - fade.t0) / FADE_MS);
        if (a >= 1) { paint(id, null, 1); fade = null; } else paint(id, fade.from, a);
      } else if (resized) { resized = false; paint(id, null, 1); }
    };

    const startUp = now => { mode = 'up'; t0 = now; };
    const startDown = now => { mode = 'down'; t0 = now; };
    const startBlink = now => { mode = 'blink'; t0 = now; dir = (blinkEnd === BLINK_END && holdId[0] === 'b' && holdId === idOf('b', BLINK_END)) ? -1 : 1; };
    const onPointer = e => {
      if (!visible) return;
      const now = performance.now(), r = cvs[0].getBoundingClientRect();
      lastMove = now;
      above = e.clientY < r.top + EAR_Y * r.height;
      if (above && mode !== 'up' && mode !== 'upHold') startUp(now);
      else if (!above && mode === 'upHold') startDown(now);
      kick();
    };

    const tick = now => {
      raf = 0;
      if (!visible) return;
      const seqI = (a) => a + Math.floor((now - t0) * FPS / 1000);
      if (mode === 'rest') {
        show(idOf('a', 0), now);
      } else if (mode === 'up') {
        const i = seqI(0);
        if (i >= UP_END) { holdId = idOf('a', UP_END); if (above) mode = 'upHold'; else startDown(now); show(holdId, now); }
        else show(idOf('a', i), now);
      } else if (mode === 'upHold') {
        show(holdId, now);
      } else if (mode === 'down') {
        const i = seqI(UP_END);
        if (i >= DOWN_END) { mode = 'downHold'; holdId = idOf('a', DOWN_END); blinkEnd = 0; nextBlink = now + BLINK_MIN; show(holdId, now); }
        else show(idOf('a', i), now);
      } else if (mode === 'blink') {
        const n = Math.floor((now - t0) * FPS / 1000);
        if (n > BLINK_END) {
          blinkEnd = dir > 0 ? BLINK_END : 0;
          holdId = idOf('b', blinkEnd);
          mode = 'blinkHold'; nextBlink = now + BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN);
          show(holdId, now);
        } else show(idOf('b', dir > 0 ? n : BLINK_END - n), now);
      } else {                                           // downHold / blinkHold
        show(holdId, now);
      }
      // waiting in the middle or lower part: blink
      if (!above && now - lastMove > IDLE_MS && now >= nextBlink && (mode === 'rest' || mode === 'downHold' || mode === 'blinkHold')) {
        if (mode !== 'blinkHold') blinkEnd = 0;
        if (mode === 'rest') holdId = idOf('a', 0);
        startBlink(now);
      }
      raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (visible && !raf) raf = requestAnimationFrame(tick); };

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    window.addEventListener('resize', () => { size(); resized = true; });
    window.addEventListener('wolf-loaded', () => { size(); resized = true; shown = null; kick(); });

    new IntersectionObserver(es => {
      visible = es.some(e => e.isIntersecting);
      if (visible) { preload(); size(); resized = true; shown = null; lastMove = performance.now(); nextBlink = lastMove + IDLE_MS; kick(); }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0.05 }).observe(cvs[0]);
    new ResizeObserver(() => { size(); resized = true; }).observe(cvs[0]);
  };

  const go = () => document.querySelectorAll('.spread').forEach(s => { if (s.querySelector('canvas.wolf-cv')) setup(s); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
