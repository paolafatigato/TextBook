// Clothes & Fashion show (pp. 90-103): the A-Z counter on p. 92 and the judges' totals on p. 99.
// The answers themselves are saved by script.js.

(() => {
  const $ = id => document.getElementById(id);
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };

  // p. 92: how many letters of the alphabet game are filled in
  const abc = [...document.querySelectorAll('.cl-abc')];
  const count = $('cl-abc-count');
  const paintAbc = () => { if (count) count.textContent = `${abc.filter(i => i.value.trim()).length} / 26`; };
  abc.forEach(i => i.addEventListener('input', paintAbc));

  // p. 99: total of the three scores of each model
  const rows = [...document.querySelectorAll('tr[data-sum]')];
  const paintRows = () => rows.forEach(tr => {
    const scores = [...tr.querySelectorAll('.cl-n')].map(i => num(i.value));
    tr.querySelector('.cl-tot').textContent = scores.every(s => s === null) ? ' ' : String(scores.reduce((a, s) => a + (s || 0), 0));
  });
  rows.forEach(tr => tr.addEventListener('input', paintRows));

  const paintAll = () => { paintAbc(); paintRows(); };
  paintAll();
  // script.js puts the saved answers back after the page has loaded
  window.addEventListener('load', () => setTimeout(paintAll));
  $('clearBtn')?.addEventListener('click', () => setTimeout(paintAll));
})();
