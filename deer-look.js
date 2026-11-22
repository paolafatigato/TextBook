/* Aemilia the deer looks at your mouse (spread ps-clil-aemilia).
   The frames come from videos made with Google Flow (24 fps, 480×679 px, transparent webp, background cut away,
   BODY ALIGNED: the tunic and the brooch sit on the same pixels in every frame) in img/deer/:
     s-NNN  videos/cerbiattabianca.mp4        sideways          u-NNN  videos/cerbiattabianca-up.mp4   up and up-right
     m-NNN  videos/Deer_girl_moving_head_*.mp4  down            n-NNN  videos/arriccia naso.mp4         nose wrinkle, then looks at you
     l-NNN  videos/left a lot.mp4  head turns left (l-096 … l-152)   k-NNN  videos/left e bottom left.mp4  pupils up-left (not used yet)
   The first version (old video) is archived in img/archive/deer-v1/.
   A video with only one keyframe cannot be scrubbed smoothly, a row of pictures can.
   The deer is drawn IN FRONT of the page, so her ears can leave the coloured panel.

   MODES (seq = one-shot sequence, she stays on its last picture until the pointer moves away)
   follow  the pointer is far from her face: KEYS is a ring of poses ordered by the direction of the pointer seen from her
           face (angle in degrees, 0 = right, 90 = up, 180 = left, 270 = down). Between two keys of the same video the frames
           in between are played (she really turns her head); j:true = "jump" (the frames in between show a blink / squint /
           a clipped ear: she must never close her eyes while following). The pointer angle picks a place in the ring.
   face    the pointer is on her face: she looks straight at you (FACE).
   nose    the pointer touches her NOSE (or you click it): the whole nose sequence NOSE_SEQ plays (cross-eyed, wrinkles the
           nose), then she goes back to follow / face with a short cross-fade.
   chest   the pointer is on her CHEST: she looks down with half-closed eyes (SEQS.chest, video "left e bottom left").
   blink   the pointer stays at the far LEFT for a moment: she blinks naturally while her head comes back (SEQS.blink, "left a lot").
   idle    the pointer has not moved for IDLE_MS: she waits and blinks now and then (BLINK frames, random pauses).
   Two pictures that are not neighbours in a video are joined with a short cross-fade (FADE_MS).
   On paper (print) the drawing img/clil/aemilia.png is shown instead (see history-chapter.css).
   Geometry is in "cqw" = 1% of the page width; the spread goes from 0 (left edge of the left page) to 200. Each page has
   its own canvas (data-ox = where it starts on the spread, data-w = its width, see the CSS), both draw the same deer. */
(() => {
  const FW = 480, FH = 679;                // frame size (px)
  const PAGE_H = 141.4;                    // page height in cqw
  const XD = 42, WD = 92;                  // the deer starts at spread x = 42 and is 92 wide (face near the fold, ears stay on the panel)
  const HD = WD * FH / FW;                 // her height
  const EYE_X = 0.50, EYE_Y = 0.46;        // the middle of her face inside a frame (fractions)
  const NOSE_X = 0.60, NOSE_Y = 0.557, NOSE_R = 0.05;   // her nose in the FACE picture (fractions; radius = fraction of her width)
  const FACE = 'n-150', FACE_R = 0.16;     // she looks at you when the pointer is closer than 16% of her height to her face
  const NOSE_SEQ = [0, 112];               // frames n-000 … n-112, then she stays on the last one
  const CHEST = { x: 0.50, y: 0.74, rx: 0.20, ry: 0.11 };   // her chest (ellipse in the frame; rx = fraction of her width, ry = of her height)
  const SEQS = {                           // one-shot sequences: she plays them once and stays on the last picture
    nose:  ['n', NOSE_SEQ[0], NOSE_SEQ[1]],   // pointer on her nose / click
    chest: ['k', 164, 172],                   // pointer on her chest: she looks down with half-closed eyes
    blink: ['l', 152, 166],                   // pointer kept far LEFT: she blinks naturally while her head comes back
  };
  const LEFT_HOLD_MS = 900;                // so long at the far left, then the 'blink' sequence
  const BLINK = ['u', 8, 25];              // idle blink: u-008 (open) … u-025 (open again)
  const IDLE_MS = 6000, BLINK_MIN = 2500, BLINK_MAX = 6000, FADE_MS = 200, FPS = 24;
  const KEYS = [                           // angle, frame, jump to the next key?
    { a: -20, id: 's-006', j: true  },     // right (pupils to the right; to be replaced by a better video)
    { a: 10,  id: 'u-048', j: false },     // right / up-right
    { a: 45,  id: 'u-090', j: false },     // up-right
    { a: 90,  id: 'u-120', j: false },     // up
    { a: 125, id: 'u-144', j: true  },     // up-left
    { a: 155, id: 'l-096', j: false },     // left: she turns her head to the left (video "left a lot"), pupils to the left
    { a: 190, id: 'l-152', j: true  },     // far left
    { a: 255, id: 'm-100', j: false },     // down-left (head turns while the pointer goes round to the right)
    { a: 310, id: 'm-160', j: true  },     // down-right
  ];
  const idOf = (p, n) => p + '-' + String(n).padStart(3, '0');
  const num = id => +id.slice(2);
  // the ring: P = list of frames, K[i] = {pos in P, angle}
  const P = [], K = [];
  KEYS.forEach((k, i) => {
    K.push({ pos: P.length, a: k.a });
    P.push(k.id);
    const nx = KEYS[i + 1];
    if (nx && !k.j && k.id[0] === nx.id[0]) {
      const a = num(k.id), b = num(nx.id), s = Math.sign(b - a);
      for (let n = a + s; n !== b; n += s) P.push(idOf(k.id[0], n));
    }
  });
  K.push({ pos: P.length, a: KEYS[0].a + 360 });     // closes the ring: back to the first key
  const LEN = P.length;                              // positions 0 … LEN (LEN = same picture as 0)
  const posFor = (dx, dy) => {
    let t = Math.atan2(-dy, dx) * 180 / Math.PI;     // -180 … 180
    while (t < KEYS[0].a) t += 360;
    while (t >= KEYS[0].a + 360) t -= 360;
    for (let i = 0; i < K.length - 1; i++) {
      if (t >= K[i].a && t < K[i + 1].a) return K[i].pos + (K[i + 1].pos - K[i].pos) * (t - K[i].a) / (K[i + 1].a - K[i].a);
    }
    return 0;
  };
  const ringId = pos => P[((Math.round(pos) % LEN) + LEN) % LEN];

  const imgs = {};
  const load = id => new Promise(res => {
    if (imgs[id]) return res(imgs[id]);
    const im = new Image();
    im.onload = () => { imgs[id] = im; res(im); };
    im.onerror = () => res(null);
    im.src = `img/deer/${id}.webp`;
  });
  const wanted = () => {
    const l = [FACE, ...P];
    for (const [p, a, b] of Object.values(SEQS)) for (let n = a; n <= b; n++) l.push(idOf(p, n));
    for (let n = BLINK[1]; n <= BLINK[2]; n++) l.push(idOf(BLINK[0], n));
    return [...new Set(l)];
  };
  let started = false;
  const preload = async () => {
    if (started) return;
    started = true;
    await load(FACE);
    window.dispatchEvent(new Event('deer-loaded'));
    const todo = wanted();
    let next = 0;
    const worker = async () => { while (next < todo.length) { await load(todo[next++]); } };
    await Promise.all([worker(), worker(), worker(), worker()]);
  };
  const nearestLoaded = id => {                      // the picture itself, or the closest loaded one of the same video
    if (imgs[id]) return id;
    for (let d = 1; d < 40; d++) for (const q of [num(id) - d, num(id) + d]) { const o = idOf(id[0], q); if (imgs[o]) return o; }
    return imgs[FACE] ? FACE : null;
  };

  const setup = spread => {
    const cvs = [...spread.querySelectorAll('canvas.deer-cv')];
    if (!cvs.length) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let visible = false, raf = 0, shown = null, fade = null, resized = true;
    let mode = 'face', cur = 0, target = 0;            // follow: place in the ring
    let lastMove = performance.now(), last = null;     // last pointer event
    let seq = null, seqT0 = 0, holdId = null, noseDone = false, atLeft = 0;   // running sequence, the picture she holds after it, nose flag
    let blinkAt = 0, blinkT0 = 0, blinkDir = 1;   // blinks play forwards, then backwards, ...: she stays where the last one ended

    const size = () => cvs.forEach(cv => {
      const w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
      if (w && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; resized = true; }
    });
    const paint = (id, from, a) => cvs.forEach(cv => {
      const ctx = cv.getContext('2d'), cw = cv.width, ch = cv.height;
      if (!cw) return;
      const k = cw / (+cv.dataset.w), ox = +cv.dataset.ox;   // pixels per cqw, start of this canvas on the spread
      ctx.clearRect(0, 0, cw, ch);
      const put = im => ctx.drawImage(im, (XD - ox) * k, (PAGE_H - HD) * k, WD * k, HD * k);
      if (from) put(from);
      ctx.globalAlpha = a; put(imgs[id]); ctx.globalAlpha = 1;
    });
    const show = (want, now) => {
      const id = nearestLoaded(want);
      if (!id) return;
      if (id !== shown) {
        const joined = shown && shown[0] === id[0] && Math.abs(num(shown) - num(id)) <= 3;
        fade = shown && !joined && imgs[shown] ? { from: imgs[shown], t0: now } : null;
        shown = id;
        resized = false;
        paint(id, fade && fade.from, fade ? 0 : 1);
      } else if (fade) {
        const a = Math.min(1, (now - fade.t0) / FADE_MS);
        if (a >= 1) { paint(id, null, 1); fade = null; } else paint(id, fade.from, a);
      } else if (resized) { resized = false; paint(id, null, 1); }
    };

    // geometry on the screen (from the left canvas)
    const geo = () => {
      const c = cvs[0], r = c.getBoundingClientRect(), k = r.width / +c.dataset.w, ox = +c.dataset.ox;
      const X = f => r.left + (XD + f * WD - ox) * k, Y = f => r.top + (PAGE_H - HD + f * HD) * k;
      return { fx: X(EYE_X), fy: Y(EYE_Y), nx: X(NOSE_X), ny: Y(NOSE_Y), nr: NOSE_R * WD * k, fr: FACE_R * HD * k,
               cx: X(CHEST.x), cy: Y(CHEST.y), crx: CHEST.rx * WD * k, cry: CHEST.ry * HD * k };
    };
    const startSeq = (name, now) => { mode = 'seq'; seq = name; seqT0 = now; holdId = null; fade = null; };
    const evaluate = (e, now, click) => {              // choose the mode from the pointer position
      const g = geo(), onNose = Math.hypot(e.clientX - g.nx, e.clientY - g.ny) < g.nr;
      if (!onNose) noseDone = false;
      if (mode === 'seq') return;                       // a sequence always plays to its end
      const faceish = mode === 'face' || mode === 'idle' || mode === 'hold';
      if (onNose && !noseDone && (click || mode === 'face')) { startSeq('nose', now); noseDone = false; return; }
      const dx = e.clientX - g.fx, dy = e.clientY - g.fy;
      if (Math.hypot(dx, dy) < g.fr) { mode = 'face'; return; }
      if (((e.clientX - g.cx) / g.crx) ** 2 + ((e.clientY - g.cy) / g.cry) ** 2 < 1) {   // on her chest
        if (mode === 'hold' && holdId === idOf(SEQS.chest[0], SEQS.chest[2])) return;     // already looking down: stay
        startSeq('chest', now); return;
      }
      mode = 'follow'; atLeft = 0;
      target = posFor(dx, dy);
      if (faceish) cur = target;                        // from the face picture: go straight to the new look (cross-faded)
    };
    const onPointer = click => e => {
      if (!visible) return;
      const now = performance.now();
      last = e; lastMove = now;
      if (mode === 'idle') mode = 'face';
      evaluate(e, now, click);
      kick();
    };

    const tick = now => {
      raf = 0;
      if (!visible) return;
      if (mode === 'seq') {
        const [p, a, b] = SEQS[seq], i = a + Math.floor((now - seqT0) * FPS / 1000);
        if (i > b) {
          if (seq === 'nose') noseDone = true;
          lastMove = now;
          mode = 'hold'; holdId = idOf(p, b);          // she stays still on the last picture of the sequence
          show(holdId, now);
        } else show(idOf(p, i), now);
      } else if (mode === 'hold') {
        show(holdId, now);
      } else if (mode === 'follow') {
        let d = target - cur;                           // the ring is closed: take the short way round
        if (d > LEN / 2) d -= LEN; else if (d < -LEN / 2) d += LEN;
        cur += d * 0.25;
        if (Math.abs(d) < 0.4) cur = target;
        if (cur < 0) cur += LEN; else if (cur >= LEN) cur -= LEN;
        show(ringId(cur), now);
        if (ringId(cur) === 'l-152' && cur === target) {            // kept at the far left: she blinks (once), head comes back
          if (!atLeft) atLeft = now;
          else if (now - atLeft > LEFT_HOLD_MS) { atLeft = 0; startSeq('blink', now); }
        } else atLeft = 0;
        if (mode === 'follow' && now - lastMove > IDLE_MS && cur === target) { mode = 'idle'; blinkAt = now + 1200; blinkT0 = 0; }
      } else if (mode === 'face') {
        show(FACE, now);
        if (now - lastMove > IDLE_MS) { mode = 'idle'; blinkAt = now + 1200; blinkT0 = 0; }
      }
      if (mode === 'idle') {                            // waiting: open eyes, blinks now and then
        const a = blinkDir > 0 ? BLINK[1] : BLINK[2], b = blinkDir > 0 ? BLINK[2] : BLINK[1];   // this blink goes from a to b
        let id = idOf(BLINK[0], a);
        if (blinkT0) {
          const n = Math.floor((now - blinkT0) * FPS / 1000);
          if (n > BLINK[2] - BLINK[1]) { blinkT0 = 0; blinkDir = -blinkDir; blinkAt = now + BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN); id = idOf(BLINK[0], b); }
          else id = idOf(BLINK[0], a + blinkDir * n);
        } else if (now >= blinkAt) { blinkT0 = now; }
        show(id, now);
      }
      raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (visible && !raf) raf = requestAnimationFrame(tick); };

    window.addEventListener('pointermove', onPointer(false), { passive: true });
    window.addEventListener('pointerdown', onPointer(true), { passive: true });
    window.addEventListener('resize', () => { size(); resized = true; });
    window.addEventListener('deer-loaded', () => { size(); resized = true; shown = null; kick(); });

    new IntersectionObserver(es => {
      visible = es.some(e => e.isIntersecting);
      if (visible) { preload(); size(); resized = true; shown = null; lastMove = performance.now(); kick(); }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0.05 }).observe(cvs[0]);
    new ResizeObserver(() => { size(); resized = true; }).observe(cvs[0]);
  };

  const go = () => document.querySelectorAll('.spread').forEach(s => { if (s.querySelector('canvas.deer-cv')) setup(s); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
