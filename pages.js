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
// Each school year has its own page numbers. Inside, every page keeps ONE unique number for the whole book
// (data-page, data-pages, #p12 links, PAGES.of …): that is the one the scripts work with. What the pupils read
// (the number at the foot of the page, "p. 12", the index) is the number of the page in ITS year's book:
//   1st year: starts at 2 (page 1 is the cover) · 2nd year and 3rd year: start again from 1
// A year starts at the spread named in YEARS below. Pages of the 2nd and 3rd year also carry a small
// "2nd year" / "3rd year" tag next to their number (style.css, .pageno[data-yr]); a reference to a page of another
// year says its year too: "p. 12 (1st year)".
// PAGES.shown(n) → the number written for page n · PAGES.yearOf(n) → 0, 1, 2 · PAGES.internal(year, shown) → n
//
// Scaffolding: <div class="spread scaffold" …> is a teacher-only spread that does not count. Its pages get
// no number and its data-pages is the page just before it ("28-28"), so no page number leads to it:
// it is opened by turning the page, or by its name (#s=its-data-id).

const PAGES = (() => {
  const FIRST = 2; // the first spread starts on page 2 (page 1 is the cover)
  // the school years: the spread each one starts at (the first year starts with the book) and the number of its first page
  const YEARS = [
    { tag: '1st year', start: null, from: 2 },
    { tag: '2nd year', start: 'people-body', from: 1 },
    { tag: '3rd year', start: 'summer-homework', from: 1 },
  ];
  const bases = [0, 0, 0]; // the unique number of the first page of each year

  const byId = new Map();

  function count() {
    byId.clear();
    let n = FIRST;
    let year = 0;
    bases[0] = FIRST; bases[1] = bases[2] = Infinity;
    for (const s of document.querySelectorAll('.spread')) {
      const id = s.dataset.id;
      if (!id) console.error('A spread has no data-id:', s);
      else if (byId.has(id)) console.error(`Two spreads are called "${id}"`);
      // printouts (class "printout") are not counted either, but students can see them (script.js)
      if (s.classList.contains('scaffold') || s.classList.contains('printout')) { s.dataset.pages = `${n - 1}-${n - 1}`; byId.set(id, s); continue; }
      const startOf = YEARS.findIndex((y, i) => i > year && y.start === id);
      if (startOf > 0) { year = startOf; bases[year] = n; }
      const pages = [...s.querySelectorAll(':scope > .page')];
      const first = n;
      pages.forEach(p => {
        p.dataset.page = n;
        p.dataset.year = year;
        const shown = shownOf(n, year);
        if (!p.hasAttribute('aria-label') || /^Page( [0-9]+.*)?$/.test(p.getAttribute('aria-label'))) p.setAttribute('aria-label', `Page ${shown}${year ? ` (${YEARS[year].tag})` : ''}`);
        p.querySelectorAll('.pageno').forEach(el => {
          el.textContent = shown;
          if (year) el.dataset.yr = YEARS[year].tag; else delete el.dataset.yr;
        });
        n++;
      });
      s.dataset.pages = `${first}-${n - 1}`;
      byId.set(id, s);
    }

    // fill in the references written in index.html
    document.querySelectorAll('[data-page]:not(.page)').forEach(el => {
      const p = of(el.dataset.page);
      if (el.tagName === 'A') el.href = `#p${p}`;
      else {
        // a page of another year says which year it is
        const own = el.closest('.page')?.dataset.year;
        const y = yearOf(p);
        el.textContent = shownOf(p) + (own !== undefined && +own !== y ? ` (${YEARS[y].tag})` : '');
      }
    });
  }

  // the year a page belongs to (0, 1, 2): the last year that has started by then
  function yearOf(n) {
    let y = 0;
    bases.forEach((b, i) => { if (n >= b) y = i; });
    return y;
  }
  // the number written for page n (in the book of its year)
  function shownOf(n, year = yearOf(n)) { return n - bases[year] + YEARS[year].from; }
  // the other way round: the unique number of page `shown` of the book of `year`
  const internal = (year, shown) => shown - YEARS[year].from + bases[year];

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

  return { of, end, ofEl, spread: id => byId.get(id), first, last, recount: count, years: YEARS, yearOf, shown: shownOf, internal };
})();
