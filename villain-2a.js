// Villain 2A: the duel with the villains made by the pupils of 2A (the game is in the folder villain-2a/).
// It opens full screen over the book and is a game of the Personality pill, next to Villain Battle.
(() => {
  const overlay = document.createElement('div');
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Villain 2A');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100;background:#8e2de2';
  overlay.innerHTML = '<button type="button" aria-label="Close" style="position:absolute;top:8px;right:10px;z-index:2;width:38px;height:38px;border:2px solid #2a2a30;border-radius:50%;background:#fff;color:#2a2a30;font:700 17px/1 Nunito,sans-serif;cursor:pointer">✕</button><iframe title="Villain 2A" style="width:100%;height:100%;border:0"></iframe>';
  document.body.append(overlay);
  const frame = overlay.querySelector('iframe');
  let lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    if (!frame.getAttribute('src')) frame.src = 'villain-2a/index.html'; // loaded the first time it is opened
    overlay.hidden = false;
    overlay.querySelector('button').focus();
  }
  function close() {
    overlay.hidden = true;
    lastFocus?.focus();
  }
  overlay.querySelector('button').addEventListener('click', close);
  window.addEventListener('keydown', e => { if (!overlay.hidden && e.key === 'Escape') { e.stopPropagation(); close(); } }, true);
  window.VILLAIN_2A = { open };

  // the link in the Games list: it goes with the Personality pill
  window.addEventListener('load', () => {
    const box = [...document.querySelectorAll('#gameList .game-topic')].find(p => p.querySelector('a[data-vb]'))?.querySelector('.topic-pages');
    if (!box) return;
    const a = document.createElement('a');
    a.href = box.querySelector('a[data-vb]').getAttribute('href');
    a.textContent = '😈 Villain 2A';
    a.addEventListener('click', e => { e.preventDefault(); a.closest('details')?.removeAttribute('open'); open(); });
    box.append(a);
    const n = box.closest('details').querySelector('summary small');
    if (n) n.textContent = box.children.length;
  });
})();
