// Scaffolding (teacher-only spreads with no page numbers, see pages.js).
// [scaf-jobs-stories] "A job for a person": each group gets a different person card (the right page)
// and 5 different jobs. The last draw is kept in this browser, to find it again the next lesson.

(() => {
  const spread = document.querySelector('[data-id="scaf-jobs-stories"]');
  if (!spread) return;
  const KEY = 'libro-scaf-jobs-draw';
  const JOBS = [
    'doctor', 'nurse', 'dentist', 'vet', 'teacher', 'chef', 'pilot', 'police officer', 'fire officer',
    'farmer', 'builder', 'car mechanic', 'hairdresser', 'shop assistant', 'taxi driver', 'astronaut',
    'actor', 'singer', 'footballer', 'photographer', 'journalist', 'author', 'artist', 'fashion designer',
    'website developer', 'scientist', 'lawyer', 'waiter', 'CEO', 'childminder', 'paramedic', 'plumber',
    'electrician', 'engineer', 'architect', 'baker', 'pharmacist', 'librarian', 'flight attendant',
    'lifeguard', 'YouTuber', 'tour guide', 'musician', 'ice-cream taster', 'storm chaser',
    'video game tester', 'panda keeper', 'stunt performer', 'bed tester',
  ];
  const people = [...spread.querySelectorAll('.scf-people article')]
    .map(a => ({ face: a.querySelector('h3 i').textContent, name: a.querySelector('h3').childNodes[1].textContent.trim() }));
  const groups = spread.querySelector('.scf-groups');
  const out = spread.querySelector('.scf-result');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };

  function paint(draw) {
    out.innerHTML = (draw || []).map(g => `
      <li><b>${esc(g.face)} ${esc(g.name)}</b><span>${g.jobs.map(esc).join(' · ')}</span></li>`).join('');
  }

  spread.querySelector('.scf-go').addEventListener('click', () => {
    const n = Math.max(1, Math.min(people.length, parseInt(groups.value, 10) || 1));
    groups.value = n;
    // no job twice in the same group, and as few as possible repeated between groups
    let deck = [];
    const draw = shuffle(people).slice(0, n).map(p => {
      const jobs = [];
      while (jobs.length < 5) {
        if (!deck.length) deck = shuffle(JOBS);
        const j = deck.pop();
        if (!jobs.includes(j)) jobs.push(j);
      }
      return { ...p, jobs };
    });
    paint(draw);
    try { localStorage.setItem(KEY, JSON.stringify({ n, draw })); } catch { /* storage unavailable */ }
  });

  try {
    const last = JSON.parse(localStorage.getItem(KEY));
    if (last) { groups.value = last.n; paint(last.draw); }
  } catch { /* nothing drawn yet */ }
})();
