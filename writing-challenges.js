// Writing challenges ([wc-1 … wc-9]): the word counter under each writing box.
// Nothing else: the text itself is saved by script.js like every other answer (textarea.fill with an id).
(() => {
  const count = ta => {
    const out = ta.closest('.wc-write')?.querySelector('.wc-count');
    if (!out) return;
    const n = (ta.value.match(/[\p{L}\p{N}’'-]+/gu) || []).length;
    out.querySelector('b').textContent = n;
    out.classList.toggle('done', n >= Number(out.dataset.goal));
  };
  const all = () => [...document.querySelectorAll('textarea.wc-ta')];
  document.addEventListener('input', e => { if (e.target.matches?.('textarea.wc-ta')) count(e.target); });
  // the saved answers are put in the boxes after the page loads (and again when a spread opens)
  const refresh = () => all().forEach(count);
  document.addEventListener('spreadchange', refresh);
  window.addEventListener('load', () => { refresh(); setTimeout(refresh, 1500); });
})();
