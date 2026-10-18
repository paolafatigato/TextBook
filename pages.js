// Page numbers are not written in index.html: they are counted here, from the order of the spreads.
// To add pages anywhere, paste the new spread where it goes and give it a new data-id: every number
// in the book (page numbers, "see p. 82", links, contents, games) follows by itself.
//
// Every spread has a name that never changes: <div class="spread" data-id="own-saxon" …>
// A page is written with the name of its spread:
//   'own-saxon'    → the left page of that spread
//   'own-saxon:R'  → the right page
// In index.html:
//   <span data-page="own-saxon:R"></span>   → writes the number (e.g. 29)
//   <a data-page="own-saxon">…</a>          → a link to that page
//   <span class="pageno …"></span>          → the number of the page it is on
// In the other scripts: PAGES.of('own-saxon:R') → 29 · PAGES.ofEl(el) → the page el is on
// From outside the book (AgendaProf): index.html#s=own-saxon:R opens that page (script.js, route)
//
// It runs before every other script, and writes data-pages="28-29" on each spread for them.
// Spreads made later (the saved lists of "Assign work", assign-pages.js): PAGES.recount() counts again.
//
// Scaffolding: <div class="spread scaffold" …> is a teacher-only spread that does not count. Its pages get
// no number and its data-pages is the page just before it ("28-28"), so no page number leads to it:
// it is opened by turning the page, or by its name (#s=its-data-id).

const PAGES = (() => {
  const FIRST = 2; // the first spread starts on page 2 (page 1 is the cover)

  const byId = new Map();

  function count() {
    byId.clear();
    let n = FIRST;
    for (const s of document.querySelectorAll('.spread')) {
      const id = s.dataset.id;
      if (!id) console.error('A spread has no data-id:', s);
      else if (byId.has(id)) console.error(`Two spreads are called "${id}"`);
      if (s.classList.contains('scaffold')) { s.dataset.pages = `${n - 1}-${n - 1}`; byId.set(id, s); continue; }
      const pages = [...s.querySelectorAll(':scope > .page')];
      const first = n;
      pages.forEach(p => {
        p.dataset.page = n;
        if (!p.hasAttribute('aria-label') || /^Page d+$/.test(p.getAttribute('aria-label'))) p.setAttribute('aria-label', `Page ${n}`);
        p.querySelectorAll('.pageno').forEach(el => { el.textContent = n; });
        n++;
      });
      s.dataset.pages = `${first}-${n - 1}`;
      byId.set(id, s);
    }

    // fill in the references written in index.html
    document.querySelectorAll('[data-page]:not(.page)').forEach(el => {
      const p = of(el.dataset.page);
      if (el.tagName === 'A') el.href = `#p${p}`;
      else el.textContent = p;
    });
  }

  const first = s => +s.dataset.pages.split('-')[0];
  const last = s => +s.dataset.pages.split('-')[1];

  // 'id' → left page, 'id:R' → right page; NaN (and an error) for a name that does not exist
  function of(ref) {
    const [id, side] = String(ref).split(':');
    const s = byId.get(id);
    if (!s) { console.error(`No spread called "${id}" (page reference "${ref}")`); return NaN; }
    return side === 'R' ? last(s) : first(s);
  }

  // the end of a range: a bare spread name means the whole spread, so its right page
  const end = ref => (String(ref).includes(':') ? of(ref) : last(byId.get(ref) || { dataset: { pages: 'NaN-NaN' } }));

  const ofEl = el => +el.closest('.page')?.dataset.page;

  count();

  return { of, end, ofEl, spread: id => byId.get(id), first, last, recount: count };
})();
