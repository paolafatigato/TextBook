// [jobs-differ] the job maps of 9.10 and 9.14: the pupil types a job (or picks it from the list) in the
// "My job" box at the top of the page, and the words that fit that job light up in both maps.
// The words are the texts of the pills in the maps (index.html .jb-map span): write them exactly as there.
// To add a job: add a line to JOBS (name, then the words separated by |). Words not in a map are ignored.

(() => {
  // shorthand for the groups that come back often
  const DAY = 'weekdays|morning|afternoon|full-time';
  const SHIFT = 'morning|afternoon|evening|night|weekdays|weekends|full-time|long hours|shifts';

  const JOBS = {
    'doctor': `indoors|hospital|intellectual work|standing|walking|${SHIFT}|adults|children|patients|colleagues|team|uniform|computer|high salary|well paid|regular salary|careful|organized|patient|good with people|help people|save lives`,
    'nurse': `indoors|hospital|physical work|standing|walking|${SHIFT}|adults|children|patients|colleagues|team|uniform|computer|regular salary|careful|strong|patient|good with people|help people|save lives`,
    'dentist': `indoors|office|manual work|sitting|standing|${DAY}|adults|children|patients|colleagues|team|uniform|computer|high salary|well paid|regular salary|careful|patient|good with people|help people|fix things`,
    'vet': `indoors|outdoors|farm|manual work|standing|walking|${DAY}|evening|adults|customers|colleagues|team|uniform|high salary|well paid|careful|patient|good with people|help people|save lives`,
    'teacher': `indoors|school|intellectual work|standing|walking|${DAY}|short hours|children|teenagers|colleagues|team|computer|books|blackboard|regular salary|creative|patient|organized|good with people|teach people`,
    'firefighter': `indoors|outdoors|street|building site|physical work|manual work|standing|walking|traveling|${SHIFT}|adults|children|colleagues|team|uniform|vehicles|regular salary|strong|fast|careful|good with people|help people|save lives`,
    'police officer': `indoors|outdoors|street|physical work|standing|walking|traveling|${SHIFT}|adults|teenagers|colleagues|team|uniform|vehicles|regular salary|strong|fast|careful|good with people|help people|save lives`,
    'paramedic': `indoors|outdoors|hospital|street|physical work|standing|traveling|${SHIFT}|adults|children|patients|colleagues|team|uniform|vehicles|regular salary|strong|fast|careful|good with people|help people|save lives`,
    'farmer': `outdoors|farm|physical work|manual work|walking|standing|traveling|morning|afternoon|evening|weekdays|weekends|long hours|vehicles|hammer|low salary|strong|patient|careful|make things`,
    'gardener': `outdoors|home|physical work|manual work|standing|walking|morning|afternoon|weekdays|full-time|part-time|customers|vehicles|scissors|hammer|low salary|strong|patient|creative|careful|make things`,
    'chef': `indoors|restaurant|physical work|manual work|standing|walking|afternoon|evening|night|weekends|full-time|long hours|colleagues|team|customers|uniform|scissors|well paid|regular salary|creative|fast|organized|careful|make things|entertain people`,
    'waiter': `indoors|restaurant|physical work|standing|walking|afternoon|evening|night|weekends|part-time|full-time|long hours|shifts|adults|children|customers|colleagues|team|uniform|low salary|badly paid|tips|fast|organized|good with people|sell things`,
    'shop assistant': `indoors|shop|physical work|standing|walking|morning|afternoon|evening|weekdays|weekends|full-time|part-time|shifts|adults|teenagers|children|customers|colleagues|team|computer|uniform|low salary|badly paid|regular salary|organized|good with people|good at math|sell things`,
    'cashier': `indoors|shop|sitting|standing|morning|afternoon|evening|weekends|part-time|full-time|shifts|adults|customers|colleagues|computer|uniform|low salary|badly paid|regular salary|fast|careful|good at math|good with people|sell things`,
    'builder': `outdoors|building site|physical work|manual work|standing|walking|morning|afternoon|weekdays|full-time|long hours|colleagues|team|vehicles|hammer|uniform|regular salary|strong|careful|make things|fix things`,
    'carpenter': `indoors|outdoors|building site|home|physical work|manual work|standing|morning|afternoon|weekdays|full-time|colleagues|customers|hammer|regular salary|strong|careful|creative|patient|make things|fix things`,
    'electrician': `indoors|outdoors|building site|home|physical work|manual work|standing|walking|traveling|morning|afternoon|weekdays|full-time|customers|colleagues|vehicles|hammer|well paid|regular salary|careful|good at math|fix things|make things`,
    'plumber': `indoors|home|building site|physical work|manual work|standing|traveling|morning|afternoon|weekdays|weekends|full-time|customers|vehicles|hammer|well paid|strong|careful|fix things`,
    'mechanic': `indoors|factory|physical work|manual work|standing|morning|afternoon|weekdays|full-time|colleagues|team|customers|hammer|uniform|regular salary|strong|careful|patient|fix things`,
    'hairdresser': `indoors|shop|physical work|manual work|standing|morning|afternoon|weekdays|weekends|full-time|part-time|adults|children|teenagers|customers|scissors|uniform|tips|regular salary|creative|careful|good with people|make things`,
    'baker': `indoors|shop|factory|physical work|manual work|standing|morning|night|weekends|full-time|long hours|colleagues|customers|uniform|regular salary|strong|fast|organized|creative|make things|sell things`,
    'bus driver': `outdoors|street|sitting|traveling|${SHIFT}|adults|children|teenagers|passengers|vehicles|uniform|regular salary|careful|patient|good with people|help people`,
    'taxi driver': `outdoors|street|sitting|traveling|evening|night|weekends|long hours|shifts|adults|passengers|customers|vehicles|tips|careful|patient|good with people`,
    'truck driver': `outdoors|street|sitting|traveling|morning|night|weekdays|long hours|vehicles|regular salary|careful|patient|strong`,
    'pilot': `indoors|sitting|traveling|${SHIFT}|adults|children|passengers|colleagues|team|vehicles|uniform|computer|high salary|well paid|careful|organized|fast|good at math|good at languages|good with people|help people`,
    'flight attendant': `indoors|standing|walking|traveling|${SHIFT}|adults|children|passengers|colleagues|team|vehicles|uniform|well paid|regular salary|careful|fast|organized|good at languages|good with people|help people|sell things`,
    'astronaut': `indoors|physical work|intellectual work|traveling|colleagues|team|vehicles|uniform|computer|high salary|well paid|regular salary|strong|careful|patient|organized|good at math|good at languages|good with people|make things|fix things`,
    'programmer': `indoors|office|home|intellectual work|sitting|${DAY}|part-time|colleagues|team|customers|computer|high salary|well paid|regular salary|creative|patient|careful|good at math|make things|fix things|help people`,
    'web developer': `indoors|office|home|intellectual work|sitting|${DAY}|colleagues|team|customers|computer|high salary|well paid|regular salary|creative|patient|organized|good at math|make things|fix things`,
    'office worker': `indoors|office|intellectual work|sitting|weekdays|morning|afternoon|full-time|colleagues|team|customers|computer|books|regular salary|organized|careful|good at math|good at languages`,
    'accountant': `indoors|office|intellectual work|sitting|weekdays|morning|afternoon|full-time|colleagues|customers|computer|well paid|regular salary|organized|careful|good at math|help people`,
    'ceo': `indoors|office|intellectual work|sitting|traveling|weekdays|morning|afternoon|full-time|long hours|adults|colleagues|team|customers|computer|high salary|well paid|regular salary|organized|fast|good with people|good at math|good at languages|make things|sell things`,
    'lawyer': `indoors|office|intellectual work|sitting|standing|weekdays|morning|afternoon|full-time|long hours|adults|customers|colleagues|computer|books|high salary|well paid|regular salary|organized|careful|good at languages|good with people|help people`,
    'journalist': `indoors|outdoors|office|street|intellectual work|sitting|walking|traveling|${DAY}|evening|long hours|adults|colleagues|team|computer|books|regular salary|fast|creative|careful|good at languages|good with people|make things`,
    'author': `indoors|home|intellectual work|sitting|morning|afternoon|evening|weekends|full-time|part-time|adults|children|teenagers|computer|books|low salary|creative|patient|good at languages|organized|make things|entertain people|teach people`,
    'actor': `indoors|outdoors|physical work|standing|walking|traveling|evening|night|weekends|long hours|shifts|adults|children|colleagues|team|uniform|high salary|well paid|creative|good at languages|good with people|entertain people`,
    'singer': `indoors|outdoors|standing|traveling|evening|night|weekends|long hours|adults|teenagers|children|colleagues|team|high salary|well paid|creative|good with people|entertain people|make things`,
    'musician': `indoors|outdoors|sitting|standing|traveling|evening|night|weekends|long hours|adults|colleagues|team|high salary|well paid|creative|patient|careful|entertain people|make things`,
    'footballer': `outdoors|physical work|walking|traveling|afternoon|evening|weekends|full-time|colleagues|team|uniform|vehicles|high salary|well paid|regular salary|strong|fast|good with people|entertain people`,
    'basketball player': `indoors|physical work|walking|traveling|afternoon|evening|weekends|full-time|colleagues|team|uniform|high salary|well paid|regular salary|strong|fast|good with people|entertain people`,
    'fashion designer': `indoors|office|home|intellectual work|sitting|standing|${DAY}|colleagues|team|customers|computer|scissors|well paid|creative|careful|organized|make things|sell things`,
    'photographer': `indoors|outdoors|street|standing|walking|traveling|morning|afternoon|weekends|part-time|adults|children|customers|computer|creative|patient|careful|make things|entertain people`,
    'scientist': `indoors|intellectual work|sitting|standing|weekdays|morning|afternoon|full-time|colleagues|team|computer|books|well paid|regular salary|careful|patient|organized|good at math|make things|help people`,
    'engineer': `indoors|outdoors|office|factory|building site|intellectual work|sitting|walking|weekdays|morning|afternoon|full-time|colleagues|team|customers|computer|high salary|well paid|regular salary|organized|careful|good at math|creative|make things|fix things`,
    'architect': `indoors|office|building site|intellectual work|sitting|walking|weekdays|morning|afternoon|full-time|colleagues|team|customers|computer|well paid|creative|organized|careful|good at math|make things`,
    'pharmacist': `indoors|shop|standing|walking|weekdays|morning|afternoon|full-time|shifts|adults|children|customers|colleagues|uniform|computer|well paid|regular salary|careful|organized|good at math|good with people|help people|sell things`,
    'librarian': `indoors|school|sitting|standing|walking|weekdays|morning|afternoon|full-time|part-time|adults|children|teenagers|customers|colleagues|computer|books|low salary|regular salary|organized|patient|careful|good with people|help people`,
    'social worker': `indoors|office|home|intellectual work|sitting|walking|traveling|weekdays|morning|afternoon|full-time|adults|children|teenagers|colleagues|team|computer|regular salary|patient|organized|good with people|help people`,
    'childminder': `indoors|home|physical work|standing|walking|morning|afternoon|evening|weekdays|part-time|full-time|children|colleagues|low salary|badly paid|patient|careful|creative|strong|good with people|help people|teach people`,
    'babysitter': `indoors|home|walking|standing|evening|night|weekends|part-time|short hours|children|low salary|badly paid|patient|careful|creative|good with people|help people`,
    'cleaner': `indoors|office|school|hospital|home|physical work|manual work|standing|walking|morning|evening|night|part-time|full-time|colleagues|low salary|badly paid|strong|fast|careful|organized|help people`,
    'postal worker': `outdoors|street|physical work|walking|traveling|morning|weekdays|full-time|customers|vehicles|uniform|regular salary|strong|fast|organized|careful|help people`,
    'pizza delivery driver': `outdoors|street|physical work|traveling|evening|night|weekends|part-time|shifts|customers|vehicles|uniform|tips|low salary|badly paid|fast|careful|sell things`,
    'soldier': `indoors|outdoors|physical work|walking|traveling|morning|afternoon|evening|night|full-time|long hours|shifts|colleagues|team|uniform|vehicles|regular salary|strong|fast|careful|organized|help people|save lives`,
    'dancer': `indoors|physical work|standing|walking|traveling|evening|night|weekends|long hours|adults|children|colleagues|team|uniform|creative|strong|patient|entertain people|make things|teach people`,
    'artist': `indoors|home|manual work|physical work|standing|sitting|morning|afternoon|weekends|part-time|customers|books|low salary|creative|patient|careful|make things|sell things|entertain people`,
    'youtuber': `indoors|home|intellectual work|sitting|standing|morning|afternoon|evening|weekends|long hours|teenagers|children|adults|customers|team|computer|creative|fast|good with people|entertain people|make things|teach people`,
    'soccer player': null, // alias of footballer
  };
  JOBS['soccer player'] = JOBS['footballer'];
  JOBS['computer programmer'] = JOBS['programmer'];
  JOBS['police'] = JOBS['police officer'];
  JOBS['pizza delivery guy'] = JOBS['pizza delivery driver'];
  JOBS['landscape gardener'] = JOBS['gardener'];
  JOBS['fireman'] = JOBS['firefighter'];

  const spans = [...document.querySelectorAll('.jb-map span')];
  const maps = [...document.querySelectorAll('.jb-map')];
  const inputs = [...document.querySelectorAll('.jb-pick input')];
  if (!inputs.length) return;

  // the list of jobs under the box (the real names, not the aliases)
  const ALIASES = new Set(['soccer player', 'computer programmer', 'police', 'pizza delivery guy', 'landscape gardener', 'fireman']);
  const names = Object.keys(JOBS).filter(n => !ALIASES.has(n)).sort();
  const list = document.createElement('datalist');
  list.id = 'jb-jobs-list';
  list.innerHTML = names.map(n => `<option value="${n}">`).join('');
  document.body.append(list);
  inputs.forEach(i => i.setAttribute('list', list.id));

  const clean = s => s.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^(a|an|the) /, '');
  function find(text) {
    const t = clean(text);
    if (!t) return null;
    if (JOBS[t]) return JOBS[t];
    if (t.endsWith('s') && JOBS[t.slice(0, -1)]) return JOBS[t.slice(0, -1)]; // "teachers"
    const start = Object.keys(JOBS).filter(n => n.startsWith(t));
    return t.length >= 3 && start.length === 1 ? JOBS[start[0]] : undefined;
  }

  function paint(source) {
    const text = source.value;
    const words = find(text);
    inputs.forEach(i => { if (i !== source && i.value !== text) { i.value = text; i.dispatchEvent(new Event('input', { bubbles: true })); } });
    const set = words ? new Set(words.split('|')) : null;
    let n = 0;
    spans.forEach(s => {
      const on = !!set && set.has(s.textContent.trim());
      s.classList.toggle('sel', on);
      if (on) n++;
    });
    maps.forEach(m => m.classList.toggle('has-job', !!set));
    inputs.forEach(i => {
      const msg = i.parentElement.querySelector('em');
      msg.textContent = !text.trim() ? '' : set ? '✓ ' + n + ' words' : find(text) === undefined && clean(text).length < 3 ? '' : 'not in my list yet';
    });
  }
  inputs.forEach(i => {
    i.addEventListener('input', () => paint(i));
    i.addEventListener('change', () => paint(i));
  });
  // "Clear answers" empties the boxes without an input event
  document.addEventListener('click', () => setTimeout(() => paint(inputs[0].value ? inputs[0] : inputs.find(i => i.value) || inputs[0]), 80));
  paint(inputs.find(i => i.value) || inputs[0]);
})();
