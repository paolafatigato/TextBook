/* The deer with long wavy hair in the circle of the chapter "CLIL: Romans & Longobards" (home page) follows your mouse.
   contents.js: `follow: 'deer-home'` on the chapter, script.js (chapterCard) puts a <canvas class="home-deer"> in the circle.
   The frames img/home-deer/d-NNN.webp (360×360 px, white made transparent, 24 fps) come from videos/deer-home.mp4
   (the video has 240 frames; only the ones used here are kept):
     d-078 … d-120  she looks right, then up-right, then up      d-026 … d-054  her head turns to the left
     d-054 … d-062  at the far left she closes her eyes (a spontaneous blink, forwards and back)
     d-156          she looks down                                d-006 … d-024  the front view and a blink (d-018 closed)
     d-160 … d-239  the end of the video: she looks at you and blinks twice (played when the pointer is inside her card)
   As in deer-look.js: KEYS is a ring of poses ordered by the direction of the pointer seen from the circle (degrees,
   0 = right, 90 = up, 180 = left, 270 = down); between two keys of the same video the frames in between are played
   (she really turns her head), j:true = jump (cross-fade). She never closes her eyes while following, except for the
   spontaneous blink when the pointer stays at the far left. Near the circle she looks at you; when the pointer stays
   still for a while she blinks (forwards, then backwards, so she never jumps back). When the pointer is inside her
   card (the whole white-and-green box) the end of the video plays once and she stays on its last picture. */
(() => {
  const FPS = 24, FADE_MS = 200, NEAR = 1.1;          // NEAR: closer than 1.1 × the circle's width = she looks at you
  const IDLE_MS = 2500, BLINK_MIN = 2500, BLINK_MAX = 6000;
  // Geometry: the canvas is 1.2 × the circle wide and 1.3 × as high (CSS: left -10%, top -30%), so the ears can stick out above
  // the white circle. D = the circle's diameter, its centre is at 0.8 D from the top of the canvas. Below the centre the picture
  // is cut by the circle, above it nothing is cut. The deer is SCALE × D wide and ends at the bottom of the circle.
  const SCALE = 1.35, SHIFT = -0.1;               // SHIFT: moves her left (× D) so the right ear stays inside the card, whose edge cuts the circle
  const FRONT = 6, BLINK = [6, 24];
  const LEFT = 54, LEFT_CLOSED = 62, LEFT_HOLD_MS = 900;     // far left: d-054 (open) … d-062 (closed) … back
  const CARD = [160, 239];                                   // pointer inside her card
  const KEYS = [
    { a: -20, n: 78,  j: false },                    // right
    { a: 45,  n: 108, j: false },                    // up-right
    { a: 90,  n: 120, j: true  },                    // up
    { a: 150, n: 26,  j: false },                    // left (the head starts to turn)
    { a: 185, n: LEFT, j: true },                    // far left
    { a: 260, n: 156, j: true  },                    // down
  ];
  const idOf = n => 'd-' + String(n).padStart(3, '0');
  const P = [], K = [];
  KEYS.forEach((k, i) => {
    K.push({ pos: P.length, a: k.a });
    P.push(k.n);
    const nx = KEYS[i + 1];
    if (nx && !k.j) { const s = Math.sign(nx.n - k.n); for (let n = k.n + s; n !== nx.n; n += s) P.push(n); }
  });
  K.push({ pos: P.length, a: KEYS[0].a + 360 });
  const LEN = P.length;
  const posFor = (dx, dy) => {
    let t = Math.atan2(-dy, dx) * 180 / Math.PI;
    while (t < KEYS[0].a) t += 360;
    while (t >= KEYS[0].a + 360) t -= 360;
    for (let i = 0; i < K.length - 1; i++) if (t >= K[i].a && t < K[i + 1].a) return K[i].pos + (K[i + 1].pos - K[i].pos) * (t - K[i].a) / (K[i + 1].a - K[i].a);
    return 0;
  };
  const ringN = pos => P[((Math.round(pos) % LEN) + LEN) % LEN];

  const imgs = {};
  const load = n => new Promise(res => {
    if (imgs[n]) return res(imgs[n]);
    const im = new Image();
    im.onload = () => { imgs[n] = im; res(im); };
    im.onerror = () => res(null);
    im.src = `img/home-deer/${idOf(n)}.webp`;
  });
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  let started = false;
  const preload = async () => {
    if (started) return;
    started = true;
    await load(FRONT);
    const todo = [...new Set([...P, ...range(BLINK[0], BLINK[1]), ...range(LEFT, LEFT_CLOSED), ...range(CARD[0], CARD[1])])];
    let next = 0;
    const worker = async () => { while (next < todo.length) await load(todo[next++]); };
    await Promise.all([worker(), worker(), worker()]);
  };
  const nearestLoaded = n => { for (let d = 0; d < 40; d++) for (const q of [n - d, n + d]) if (imgs[q]) return q; return null; };

  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const items = new Map();                              // canvas → state
  let raf = 0, px = null, py = null, lastMove = performance.now();

  const paint = (st, n, prev, a) => {
    const cv = st.cv, ctx = cv.getContext('2d'), w = cv.width, D = w / 1.2, S = SCALE * D, x = (w - S) / 2 + SHIFT * D, y = 1.3 * D - S;
    ctx.clearRect(0, 0, w, cv.height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, 0.8 * D);                          // everything above the centre of the circle ...
    ctx.moveTo(w / 2 + 0.5 * D, 0.8 * D);
    ctx.arc(w / 2, 0.8 * D, 0.5 * D, 0, Math.PI * 2);    // ... plus the circle itself
    ctx.clip();
    if (prev) ctx.drawImage(prev, x, y, S, S);
    ctx.globalAlpha = a; ctx.drawImage(imgs[n], x, y, S, S); ctx.globalAlpha = 1;
    ctx.restore();
  };
  const show = (st, want, now) => {
    const n = nearestLoaded(want);
    if (n == null) return;
    if (n !== st.shown) {
      const joined = st.shown != null && Math.abs(st.shown - n) <= 3;
      st.fade = st.shown != null && !joined && imgs[st.shown] ? { from: imgs[st.shown], t0: now } : null;
      st.shown = n; st.dirty = false;
      paint(st, n, st.fade && st.fade.from, st.fade ? 0 : 1);
    } else if (st.fade) {
      const a = Math.min(1, (now - st.fade.t0) / FADE_MS);
      if (a >= 1) { paint(st, n, null, 1); st.fade = null; } else paint(st, n, st.fade.from, a);
    } else if (st.dirty) { st.dirty = false; paint(st, n, null, 1); }
  };
  const resize = st => {
    const w = Math.round(st.cv.clientWidth * dpr), h = Math.round(st.cv.clientHeight * dpr);
    if (w && (st.cv.width !== w || st.cv.height !== h)) { st.cv.width = w; st.cv.height = h; st.dirty = true; }
  };
  const later = (now, a, b) => now + a + Math.random() * (b - a);

  const tickOne = (st, now) => {
    resize(st);
    if (reduce) return show(st, FRONT, now);
    const rc = st.cv.getBoundingClientRect(), D0 = rc.width / 1.2;
    const r = { left: rc.left + 0.1 * D0, top: rc.top + 0.3 * D0, width: D0, height: D0, right: rc.left + 1.1 * D0, bottom: rc.top + 1.3 * D0 };   // the white circle
    const cx = r.left + D0 / 2, cy = r.top + D0 / 2;
    if (st.moved && px != null) {
      st.moved = false;
      const c = st.card ? st.card.getBoundingClientRect() : r;
      const inCard = px >= c.left && px <= c.right && py >= c.top && py <= c.bottom;
      const dx = px - cx, dy = py - cy;
      if (inCard) { if (st.mode !== 'card') { st.mode = 'card'; st.t0 = now; } }
      else if (Math.hypot(dx, dy) < NEAR * r.width) st.mode = 'face';
      else { const was = st.mode; st.mode = 'follow'; st.target = posFor(dx, dy); if (was !== 'follow') { st.cur = st.target; st.atLeft = 0; } }
    }
    if (st.mode === 'card') {                          // the end of the video: she looks at you and blinks twice, then stays
      show(st, Math.min(CARD[1], CARD[0] + Math.floor((now - st.t0) * FPS / 1000)), now);
    } else if (st.mode === 'follow') {
      let d = st.target - st.cur;                      // the ring is closed: take the short way round
      if (d > LEN / 2) d -= LEN; else if (d < -LEN / 2) d += LEN;
      st.cur += d * 0.25;
      if (Math.abs(d) < 0.4) st.cur = st.target;
      if (st.cur < 0) st.cur += LEN; else if (st.cur >= LEN) st.cur -= LEN;
      let want = ringN(st.cur);
      if (want === LEFT && st.cur === st.target) {     // kept at the far left: she blinks now and then (open → closed → open)
        if (!st.atLeft) { st.atLeft = now; st.lbAt = now + LEFT_HOLD_MS; st.lbT0 = 0; }
        if (!st.lbT0 && now >= st.lbAt) st.lbT0 = now;
        if (st.lbT0) {
          const k = Math.floor((now - st.lbT0) * FPS / 1000), h = LEFT_CLOSED - LEFT;
          if (k > 2 * h) { st.lbT0 = 0; st.lbAt = later(now, 2500, 5000); }
          else want = LEFT + (k <= h ? k : 2 * h - k);
        }
      } else { st.atLeft = 0; st.lbT0 = 0; }
      show(st, want, now);
    } else {                                           // face / idle: she looks at you; she blinks when nothing moves
      if (st.mode === 'face' && now - lastMove > IDLE_MS) { st.mode = 'idle'; st.blinkAt = now + 800; st.blinkT0 = 0; }
      let want = st.blinkDir > 0 ? BLINK[0] : BLINK[1];
      if (st.mode === 'idle') {
        if (st.blinkT0) {
          const k = Math.floor((now - st.blinkT0) * FPS / 1000);
          if (k > BLINK[1] - BLINK[0]) {
            st.blinkT0 = 0; st.blinkDir = -st.blinkDir; st.blinkAt = later(now, BLINK_MIN, BLINK_MAX);
            want = st.blinkDir > 0 ? BLINK[0] : BLINK[1];
          } else want = st.blinkDir > 0 ? BLINK[0] + k : BLINK[1] - k;
        } else if (now >= st.blinkAt) st.blinkT0 = now;
      } else want = FRONT;
      show(st, want, now);
    }
  };
  const tick = now => {
    raf = 0;
    let any = false;
    items.forEach(st => { if (st.visible && st.cv.isConnected) { any = true; tickOne(st, now); } });
    if (any) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  const io = new IntersectionObserver(es => es.forEach(e => {
    const st = items.get(e.target);
    if (!st) return;
    st.visible = e.isIntersecting;
    if (st.visible) { preload().then(() => { st.dirty = true; kick(); }); kick(); }
  }), { threshold: 0.05 });
  const add = cv => {
    if (items.has(cv)) return;
    items.set(cv, { cv, card: cv.closest('.chapter'), visible: false, shown: null, fade: null, dirty: true, mode: 'face',
      cur: 0, target: 0, moved: false, t0: 0, blinkAt: 0, blinkT0: 0, blinkDir: 1, atLeft: 0, lbAt: 0, lbT0: 0 });
    io.observe(cv);
  };
  const scan = () => document.querySelectorAll('canvas.home-deer').forEach(add);
  const move = e => { px = e.clientX; py = e.clientY; lastMove = performance.now(); items.forEach(st => { st.moved = true; }); kick(); };
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', move, { passive: true });
  window.addEventListener('resize', () => { items.forEach(st => { st.dirty = true; }); kick(); });
  let scanning = false;                                // the app changes the page a lot: look for new canvases at most once per frame
  new MutationObserver(() => { if (!scanning) { scanning = true; requestAnimationFrame(() => { scanning = false; scan(); }); } }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
