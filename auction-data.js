// Error auction (teacher game 🔨 in teacher-games.js): sentences with a mistake that the pupils really wrote in the Jobs test
// (3A and 3B, November 2026): the mistakes the teacher marked in the CSVs of the test, checked on the scanned papers.
// No names: only the sentence. Class 3A / 3B = where the sentence comes from (it prints in the corner of the slip).
//
// One sentence per line:
//   [wrong = right]             the mistake and its correction
//   [wrong = right / other]     more corrections are fine (the first one is the one printed in the answer key)
//   # Category                  at the end of the line (only in the answer key and after the answer)
//   Context >> sentence         optional: a line of context shown ABOVE the sentence (not part of the correction)
//   @A  or  @B                  after the category: the sentence comes from class 3A or 3B
// Easy = the wrong translations of exercise 1 (Translate): "a nurse = dottoressa", the pupils correct the translation.
// Medium = the mistakes in the sentences of the test (all the lines under "basic"). Hard = two mistakes, Italian structures,
// a whole phrase to rewrite. Stakes: easy 10 · medium 20 · hard 30 coins (win +stake, lose -stake).
(() => {
  const LINES = {
    translate: `
a nurse = [dottoressa = infermiera / infermiere]   # Translate   @B
a shop assistant = [una lavoratrice = commessa / commesso]   # Translate   @A
to make money = [prendere soldi = fare soldi / guadagnare]   # Translate   @A
skills = [strumenti = abilità / capacità]   # Translate   @A
skills = [esperienza = abilità / capacità]   # Translate   @B
a uniform = [tuta = divisa / uniforme]   # Translate   @B
un cuoco = a [chof = chef / cook]   # Translate   @B
un parrucchiere = [a barber = a hairdresser / a hairstylist]   # Translate   @B
un parrucchiere = a [hairdresses = hairdresser]   # Translate   @A
un meccanico = a [mecchnic = mechanic]   # Translate   @A
un poliziotto = [a police = a police officer]   # Translate   @A
un contadino = [a gardener = a farmer]   # Translate   @B
un contadino = [a lawyer = a farmer]   # Translate   @B
un contadino = [farmers = a farmer / farmer]   # Translate   @A
un veterinario = [a veterinary = a vet]   # Translate   @B
un veterinario = [a nurse = a vet]   # Translate   @A
lavorare di notte = [a working in the night = to work at night / work at night / working at night]   # Translate   @B
un cliente = [a costumer = a customer / a client]   # Translate   @B
un cliente = [a patient = a customer / a client]   # Translate   @A
un pilota = a [pailot = pilot]   # Translate   @B
a taxi driver = [l'autista = il tassista / tassista]   # Translate   @A
the good side = [una buona posizione = il lato positivo / il lato buono / la parte positiva]   # Translate   @A
brave = [calmo = coraggioso]   # Translate   @A
brave = [forte = coraggioso]   # Translate   @A
le abilità = [a skils = skills]   # Translate   @A
una divisa = [a clothes = a uniform]   # Translate   @B
una divisa = a [uniformen = uniform]   # Translate   @A
a waiter = [scrittore = cameriere]   # Translate   @B
a salary = [una paghetta = uno stipendio / stipendio]   # Translate   @B
a customer = [costume = cliente]   # Translate   @B
tools = [accessori = strumenti / attrezzi]   # Translate   @A
tools = [oggetti = strumenti / attrezzi]   # Translate   @B
un tassista = [a taxi = a taxi driver]   # Translate   @A
lavorare di giorno = [work at day = work during the day / work in the day]   # Translate   @A
i pazienti = [the patient = the patients / patients]   # Translate   @B
`,
    basic: `
Now I [alweis = always] keep my notes and desk perfectly tidy.   # Spelling   @A
A doctor [have = has] a good salary.   # Subject-verb agreement   @A
Dream job: doctor >> I [working = work] in a hospital.   # Verb forms   @A
Dream job: doctor >> You [doesn't = don't] have a lot of free time.   # Subject-verb agreement   @A
Job card: plumber >> It [requiser = requires] a lot of commitment.   # Spelling   @A
Job card: plumber >> It is [farly = fairly] well-paid.   # Spelling   @A
Making games is difficult [an = and] long.   # Spelling   @A
Dream job: programmer >> I work [whit = with] a group.   # Spelling   @A
Job card: dentist >> They make [alot = a lot] of money.   # Spelling   @A
Job card: dentist >> [Its = It's] a very dangerous job.   # Apostrophe   @A
Job card: artist >> They draw [paintins = paintings].   # Spelling   @A
Job card: dentist >> They [used = use] the mask.   # Verb forms   @A
Dream job: doctor >> I like [cure = to cure / curing] [peoples = people].   # Plurals   @A
Job card: singer >> If someone [call = calls] me.   # Subject-verb agreement   @B
Dream job: doctor >> I work for like 18 [hour = hours].   # Plurals   @B
An actor makes a lot of money if the film [make = makes] a lot of views.   # Subject-verb agreement   @B
Some actors [dies = die] because sometimes it is dangerous.   # Subject-verb agreement   @B
Job card: astronaut >> I work with a team [wich = which] is better.   # Spelling   @B
Job card: fire officer >> [Yours = Your] tools are a fire hose or an extinguisher.   # Possessives   @B
Job card: teacher >> Clothes [is = are] normal.   # Subject-verb agreement   @B
Job card: teacher >> The people are [teacher = teachers], principal and students.   # Plurals   @B
Dream job: content creator >> I love that people are [whatching = watching] me.   # Spelling   @B
Dream job: beautician >> They make [mutch = much] money.   # Spelling   @B
Dream job: soccer player >> People [is = are] soccer players, referee and fans.   # Subject-verb agreement   @B

`,
    basicMore: `
I dream of becoming [a office = an office] worker.   # Articles   @A
Dream job: office worker >> You have to sit [in = at] a desk for [a many = many] hours.   # Prepositions   @A
I started helping my parents [to organized = to organize] their documents.   # Infinitive   @A
A taxi driver is someone who [transporter = transports] the passengers around the city.   # Verb forms   @A
Job card: taxi driver >> They make [not to much = not too much] money.   # Spelling   @A
I dream [becoming = of becoming] a doctor.   # Prepositions   @A
Dream job: doctor >> You [have study = have to study] for a lot of [year = years].   # Modals   @A
Job card: plumber >> You are not stuck working [a fixed place = in a fixed place].   # Prepositions   @A
A dentist is someone who fixes [peoples = people's] teeth.   # Possessives   @A
You have to be careful with [client's = clients'] teeth.   # Possessives   @A
The good side is to make clients happy [on = with] the result.   # Prepositions   @A
Job card: artist >> If [am = I am] famous my salary is high.   # Missing subject   @A
Job card: artist >> I work [to = with] clients.   # Prepositions   @A
Dream job: doctor >> Works with [a other = another] doctor, nurse and patients.   # Articles   @A
Dream job: doctor >> You can work in the morning, in the afternoon and [at the night = at night].   # Prepositions   @A
My dream job is the videogamer tester because [is = it is] interesting.   # Missing subject   @A
Job card: dentist >> They make enough [for live = to live].   # Infinitive   @A
Dream job: mechanic >> I want [created = to create] one.   # Infinitive   @A
My dream job is to be [an content = a content] creator.   # Articles   @B
I would like [be = to be] a voice actor.   # Infinitive   @B
Dream job: idol >> They go on stages [on = in] rich cities.   # Prepositions   @B
Dream job: idol >> They get paid [very much = a lot].   # Vocabulary   @B
A youtuber is not really [a work = a job].   # Vocabulary   @B
Job card: teacher >> I think the salary is 2000 euros [for month = a month].   # Prepositions   @B
`,
    hard: `
My dream job [is doctor = is to be a doctor / is being a doctor / is a doctor].   # Verb be   @A
Dream job: game developer >> It [depends how = depends on how] famous your games [be = are].   # Prepositions   @A
Dream job: office worker >> I [think accept = accept] these things because I love technology.   # Verbs   @A
Job card: dentist >> They have to [be graduated = have a degree / graduate].   # Vocabulary   @A
Job card: tour guide >> They work with [stranger people = strangers].   # Vocabulary   @A
Job card: tour guide >> You [can = have to] know everything about [story = history].   # Modals + vocabulary   @A
Dream job: doctor >> They [doesn't = don't] sit still [a desk = at a desk].   # Subject-verb agreement   @A
Job card: dentist >> They help just people, not animals, because [animal goes = animals go] to the vet.   # Plurals   @A
A youtuber [work = works] in [is = his / her] own room.   # Subject-verb agreement   @B
Job card: web developer >> He makes more money [than the most of the jobs = than most jobs].   # Vocabulary   @B
Dream job: voice actor >> I'm good [working a team = at working in a team].   # Prepositions   @B
Dream job: voice actor >> [Is very cool this job = This job is very cool] but it is very difficult.   # Word order   @B
Dream job: psychologist >> I [hope = help] them [to exit from = get out of] problems.   # Vocabulary   @B
Job card: taxi driver >> They drive the taxi [for take = to take] the people to [they're = their] destination.   # Infinitive   @B
Dream job: soccer player >> When you [do a error = make a mistake].   # Vocabulary   @B
Job card: pilot >> When he [drive = drives] the plane, [are hard = it is hard].   # Subject-verb agreement   @B
Dream job: goalkeeper >> When my family [look me on the TV = watches me on TV].   # Vocabulary   @B
Job card: fashion designer >> [They are make = They make] the dress.   # Verb forms   @B
Job card: taxi driver >> [They're salary it's = Their salary is] low.   # Possessives   @B
Job card: vet >> It's [a little likely = not very likely] to become famous.   # Vocabulary   @B
I think a PSG player [make = makes] 180 million [for year = a year].   # Prepositions   @B
Dream job: coroner >> [I more than willing = I am more than willing] to do it.   # Missing verb   @B
Dream job: actor >> [He have above money = He has a lot of money / He earns a lot].   # Vocabulary   @B
`,
  };

  // the three piles: x = what the team wins if it fixes the sentence and loses if it does not
  const levels = [
    { id: 'easy',   name: 'Easy',   stake: 10, color: '#1d9e75', icon: '🟢', pre: 'E' },
    { id: 'medium', name: 'Medium', stake: 20, color: '#e8a01c', icon: '🟡', pre: 'M' },
    { id: 'hard',   name: 'Hard',   stake: 30, color: '#e0584a', icon: '🔴', pre: 'H' },
  ];

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // one line → { wrong: the sentence the pupils read, right: the same with the fixes in bold (HTML), plain: the fixed sentence }
  function parse(line, lv, n) {
    let cl = '', cat = '', ctx = '';
    line = line.trim();
    const g = line.indexOf(' >> ');
    if (g >= 0) { ctx = line.slice(0, g).trim(); line = line.slice(g + 4).trim(); }
    const m = line.match(/\s@([AB])\s*$/);
    if (m) { cl = m[1]; line = line.slice(0, m.index).trim(); }
    const h = line.indexOf('#');
    if (h >= 0) { cat = line.slice(h + 1).trim(); line = line.slice(0, h).trim(); }
    let wrong = '', right = '', plain = '', fixes = 0, firstWrong = '';
    line.split(/(\[[^\]]+\])/).forEach(part => {
      const b = part.match(/^\[([^\]]+)\]$/);
      const eq = b ? b[1].indexOf('=') : -1;
      if (!b || eq < 0) { wrong += esc(part); right += esc(part); plain += part; return; }
      const w = b[1].slice(0, eq).trim(), answers = b[1].slice(eq + 1).split(';')[0].split('/').map(x => x.trim()).filter(Boolean);
      if (!fixes) firstWrong = w;
      fixes++;
      wrong += esc(w);
      right += answers.map(a => `<b>${esc(a)}</b>`).join(' / ');
      plain += answers[0];
    });
    return { id: lv.pre + n, lv: lv.id, n, cl, cat, ctx, wrong, right, plain, fixes, oneWord: fixes === 1 && !/\s/.test(firstWrong) };
  }

  const linesOf = txt => txt.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));
  const [easyLv, mediumLv, hardLv] = levels;
  const easy = linesOf(LINES.translate).map((l, i) => parse(l, easyLv, i + 1));
  const medium = [...linesOf(LINES.basic), ...linesOf(LINES.basicMore)].map((l, i) => parse(l, mediumLv, i + 1));
  const hard = linesOf(LINES.hard).map((l, i) => parse(l, hardLv, i + 1));
  const items = [...easy, ...medium, ...hard];
  window.AUCTION = { levels, items };
})();
