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
// The data is in TOPICS (folders): Jobs and Summer. Jobs: easy = the wrong translations of exercise 1 (Translate): "a nurse = dottoressa", the pupils correct the translation.
// Medium = the mistakes in the sentences of the test (all the lines under "basic"). Hard = two mistakes, Italian structures,
// a whole phrase to rewrite. Stakes: easy 10 · medium 20 · hard 30 coins (win +stake, lose -stake).
(() => {
  const LINES = {
    translate: `
a nurse = [dottoressa = infermiera / infermiere ; dentista / cameriera]   # Translate   @B
a shop assistant = [una lavoratrice = commessa / commesso ; cassiera / compratrice]   # Translate   @A
to make money = [prendere soldi = fare soldi / guadagnare ; spendere soldi / perdere soldi]   # Translate   @A
skills = [strumenti = abilità / capacità ; abitudini / sacrifici]   # Translate   @A
skills = [esperienza = abilità / capacità ; abitudini / difficoltà]   # Translate   @B
a uniform = [tuta = divisa / uniforme ; maglietta / scarpe]   # Translate   @B
un cuoco = a [chof = chef / cook ; chief / shef]   # Translate   @B
un parrucchiere = [a barber = a hairdresser / a hairstylist ; a hairdryer / a haircut]   # Translate   @B
un parrucchiere = a [hairdresses = hairdresser ; hairdreser / hairdrasser]   # Translate   @A
un meccanico = a [mecchnic = mechanic ; mechanik / mecanic]   # Translate   @A
un poliziotto = [a police = a police officer ; a polices / a police's]   # Translate   @A
un contadino = [a gardener = a farmer ; a farm / a farming]   # Translate   @B
un contadino = [a lawyer = a farmer ; a fermer / a farmar]   # Translate   @B
un contadino = [farmers = a farmer / farmer ; a farmers / the farmers]   # Translate   @A
un veterinario = [a veterinary = a vet ; a vetrinary / a vettor]   # Translate   @B
un veterinario = [a nurse = a vet ; a vit / a vat]   # Translate   @A
lavorare di notte = [a working in the night = to work at night / work at night / working at night ; to work in night / to working at night]   # Translate   @B
un cliente = [a costumer = a customer / a client ; a custumer / a clinet]   # Translate   @B
un cliente = [a patient = a customer / a client ; a costumer / a visitor]   # Translate   @A
un pilota = a [pailot = pilot ; pilote / pylot]   # Translate   @B
a taxi driver = [l'autista = il tassista / tassista ; il pilota / il camionista]   # Translate   @A
the good side = [una buona posizione = il lato positivo / il lato buono / la parte positiva ; il lato negativo / la buona notizia]   # Translate   @A
brave = [calmo = coraggioso ; stanco / simpatico]   # Translate   @A
brave = [forte = coraggioso ; veloce / furbo]   # Translate   @A
le abilità = [a skils = skills ; skeels / a skills]   # Translate   @A
una divisa = [a clothes = a uniform ; a clothe / an uniform]   # Translate   @B
una divisa = a [uniformen = uniform ; unyform / uniforme]   # Translate   @A
a waiter = [scrittore = cameriere ; cuoco / cassiere]   # Translate   @B
a salary = [una paghetta = uno stipendio / stipendio ; una pensione / una spesa]   # Translate   @B
a customer = [costume = cliente ; costumista / cassiere]   # Translate   @B
tools = [accessori = strumenti / attrezzi ; giocattoli / materiali]   # Translate   @A
tools = [oggetti = strumenti / attrezzi ; vestiti / giochi]   # Translate   @B
un tassista = [a taxi = a taxi driver ; a taxist / a taxi's driver]   # Translate   @A
lavorare di giorno = [work at day = work during the day / work in the day ; work on day / works at the day]   # Translate   @A
i pazienti = [the patient = the patients / patients ; the pacients / the patientes]   # Translate   @B
`,
    basic: `
Now I [alweis = always ; allways / olways] keep my notes and desk perfectly tidy.   # Spelling   @A
A doctor [have = has ; haves / having] a good salary.   # Subject-verb agreement   @A
Dream job: doctor >> I [working = work ; works / am work] in a hospital.   # Verb forms   @A
Dream job: doctor >> You [doesn't = don't ; isn't / not] have a lot of free time.   # Subject-verb agreement   @A
Job card: plumber >> It [requiser = requires ; requirs / require] a lot of commitment.   # Spelling   @A
Job card: plumber >> It is [farly = fairly ; fairy / fairlly] well-paid.   # Spelling   @A
Making games is difficult [an = and ; end / ad] long.   # Spelling   @A
Dream job: programmer >> I work [whit = with ; wiht / whith] a group.   # Spelling   @A
Job card: dentist >> They make [alot = a lot ; a lots / allot] of money.   # Spelling   @A
Job card: dentist >> [Its = It's ; Its' / It] a very dangerous job.   # Apostrophe   @A
Job card: artist >> They draw [paintins = paintings ; paintengs / paintinks].   # Spelling   @A
Job card: dentist >> They [used = use ; uses / using] the mask.   # Verb forms   @A
Dream job: doctor >> I like [cure = to cure / curing ; cures / cured] [peoples = people ; peopel / persons].   # Plurals   @A
Job card: singer >> If someone [call = calls ; calling / called] me.   # Subject-verb agreement   @B
Dream job: doctor >> I work for like 18 [hour = hours ; houres / hour's].   # Plurals   @B
An actor makes a lot of money if the film [make = makes ; making / made] a lot of views.   # Subject-verb agreement   @B
Some actors [dies = die ; dying / died] because sometimes it is dangerous.   # Subject-verb agreement   @B
Job card: astronaut >> I work with a team [wich = which ; witch / whitch] is better.   # Spelling   @B
Job card: fire officer >> [Yours = Your ; You / You're] tools are a fire hose or an extinguisher.   # Possessives   @B
Job card: teacher >> Clothes [is = are ; am / be] normal.   # Subject-verb agreement   @B
Job card: teacher >> The people are [teacher = teachers ; teachers' / teacher's], principal and students.   # Plurals   @B
Dream job: content creator >> I love that people are [whatching = watching ; wathing / watchin] me.   # Spelling   @B
Dream job: beautician >> They make [mutch = much ; mush / mouch] money.   # Spelling   @B
Dream job: soccer player >> People [is = are ; am / be] soccer players, referee and fans.   # Subject-verb agreement   @B

`,
    basicMore: `
I dream of becoming [a office = an office ; a offices / an offices] worker.   # Articles   @A
Dream job: office worker >> You have to sit [in = at ; on / to] a desk for [a many = many ; a much / much of] hours.   # Prepositions   @A
I started helping my parents [to organized = to organize ; to organizes / organized] their documents.   # Infinitive   @A
A taxi driver is someone who [transporter = transports ; transport / transporting] the passengers around the city.   # Verb forms   @A
Job card: taxi driver >> They make [not to much = not too much ; no too much / not to many] money.   # Spelling   @A
I dream [becoming = of becoming ; to becoming / for becoming] a doctor.   # Prepositions   @A
Dream job: doctor >> You [have study = have to study ; must to study / have studying] for a lot of [year = years ; yers / year's].   # Modals   @A
Job card: plumber >> You are not stuck working [a fixed place = in a fixed place ; on a fixed place / to a fixed place].   # Prepositions   @A
A dentist is someone who fixes [peoples = people's ; peoples' / peopless] teeth.   # Possessives   @A
You have to be careful with [client's = clients' ; clients / clientes'] teeth.   # Possessives   @A
The good side is to make clients happy [on = with ; to / in] the result.   # Prepositions   @A
Job card: artist >> If [am = I am ; I be / me am] famous my salary is high.   # Missing subject   @A
Job card: artist >> I work [to = with ; at / on] clients.   # Prepositions   @A
Dream job: doctor >> Works with [a other = another ; an other / the another] doctor, nurse and patients.   # Articles   @A
Dream job: doctor >> You can work in the morning, in the afternoon and [at the night = at night ; on the night / at nights].   # Prepositions   @A
My dream job is the videogamer tester because [is = it is ; that is / they are] interesting.   # Missing subject   @A
Job card: dentist >> They make enough [for live = to live ; to living / for to live].   # Infinitive   @A
Dream job: mechanic >> I want [created = to create ; creating / create] one.   # Infinitive   @A
My dream job is to be [an content = a content ; the content / an contents] creator.   # Articles   @B
I would like [be = to be ; being / been] a voice actor.   # Infinitive   @B
Dream job: idol >> They go on stages [on = in ; at / by] rich cities.   # Prepositions   @B
Dream job: idol >> They get paid [very much = a lot ; very lot / much a lot].   # Vocabulary   @B
A youtuber is not really [a work = a job ; an job / a works].   # Vocabulary   @B
Job card: teacher >> I think the salary is 2000 euros [for month = a month ; in month / for a months].   # Prepositions   @B
`,
    hard: `
My dream job [is doctor = is to be a doctor / is being a doctor / is a doctor ; is a doctors / is be doctor].   # Verb be   @A
Dream job: game developer >> It [depends how = depends on how ; depends of how / depends to how] famous your games [be = are ; is / were].   # Prepositions   @A
Dream job: office worker >> I [think accept = accept ; accepting / think to accept] these things because I love technology.   # Verbs   @A
Job card: dentist >> They have to [be graduated = have a degree / graduate ; be graduate / have graduate].   # Vocabulary   @A
Job card: tour guide >> They work with [stranger people = strangers ; strangers people / strange peoples].   # Vocabulary   @A
Job card: tour guide >> You [can = have to ; may / will] know everything about [story = history ; stories / histories].   # Modals + vocabulary   @A
Dream job: doctor >> They [doesn't = don't ; isn't / aren't] sit still [a desk = at a desk ; on a desk / in a desk].   # Subject-verb agreement   @A
Job card: dentist >> They help just people, not animals, because [animal goes = animals go ; animals goes / animal go] to the vet.   # Plurals   @A
A youtuber [work = works ; working / worked] in [is = his / her ; he / their] own room.   # Subject-verb agreement   @B
Job card: web developer >> He makes more money [than the most of the jobs = than most jobs ; than most of jobs / that most jobs].   # Vocabulary   @B
Dream job: voice actor >> I'm good [working a team = at working in a team ; to work a team / in working on a team].   # Prepositions   @B
Dream job: voice actor >> [Is very cool this job = This job is very cool ; This job very is cool / Very cool is this job] but it is very difficult.   # Word order   @B
Dream job: psychologist >> I [hope = help ; hop / helps] them [to exit from = get out of ; to go out from / to exit of] problems.   # Vocabulary   @B
Job card: taxi driver >> They drive the taxi [for take = to take ; for taking / to taking] the people to [they're = their ; there / theirs] destination.   # Infinitive   @B
Dream job: soccer player >> When you [do a error = make a mistake ; do an error / make a mistakes].   # Vocabulary   @B
Job card: pilot >> When he [drive = drives ; driving / driven] the plane, [are hard = it is hard ; is hard / they are hard].   # Subject-verb agreement   @B
Dream job: goalkeeper >> When my family [look me on the TV = watches me on TV ; looks me on the TV / watch me on TV].   # Vocabulary   @B
Job card: fashion designer >> [They are make = They make ; They makes / They does make] the dress.   # Verb forms   @B
Job card: taxi driver >> [They're salary it's = Their salary is ; Their salary it's / They're salary is] low.   # Possessives   @B
Job card: vet >> It's [a little likely = not very likely ; a little unlikely / few likely] to become famous.   # Vocabulary   @B
I think a PSG player [make = makes ; making / made] 180 million [for year = a year ; in year / for a years].   # Prepositions   @B
Dream job: coroner >> [I more than willing = I am more than willing ; I be more than willing / I is more than willing] to do it.   # Missing verb   @B
Dream job: actor >> [He have above money = He has a lot of money / He earns a lot ; He have a lot money / He has above money].   # Vocabulary   @B
`,
  };

  // Topic SUMMER: the mistakes of Error Breaker (same line format; the part after ';' = wrong choices, used only by Error Breaker).
  // No class tag. They go into the piles by themselves: easy = ONE wrong word, medium = a few words, hard = two mistakes or three+ words.
  const SUMMER = `
Yesterday [i = I ; me / my] went to the beach with my family.   # Capital I
My friends and [i = I ; me / my] played football every day.   # Capital I
In August [i = I ; me / my] visited my grandparents.   # Capital I
I had a [picnic my = picnic with my ; picnic to my / picnic at my] friend.   # Prepositions
We [eat = ate ; eated / eaten] and played.   # Past simple
My cousin made a [handmade = craft / handicraft ; handwork / handmake].   # Vocabulary
She [find = finds / found ; finded / founded] a companion.   # Verbs
I went to my [cousin's = cousins' / cousins ; cousin / cousines] house, swam in [their = his / her ; there / they're] pool.   # Possessives
We played [with videogames = videogames / video games ; to videogames / at videogames].   # Prepositions
The book is about [the girl = a girl ; an girl / girls].   # Articles
The book is [in = about / on ; at / of] a girl called Noga.   # Prepositions
It's the story of a girl [the name = called / named / whose name is ; the called / name is] Nadia.   # Vocabulary
She [not accepted = didn't accept / did not accept / doesn't accept / does not accept ; didn't accepted / not accept] the color of her hair.   # Negatives
He is a dog, [He's = his ; he / him] best friend is Spiaccigatto.   # Possessives
As a second step, [I riding horse = I went horse riding / I went horseback riding / I went riding / I rode a horse / I rode horses ; I riding a horse / I was ride horse].   # Verbs
Then I went [in my house = home / to my house / into my house ; at my house / on my house].   # Prepositions
She tries volleyball [whit = with ; wiht / wit] Elisa's team.   # Spelling
We went to Rovigo to pick up my uncle [an = and ; a / am] aunt.   # Spelling
This book [help = helps / helped / has helped ; helping / helpes] me in many ways.   # Verbs
I [reccomend = recommend ; reccomend / recomend] this book to teenagers.   # Spelling
She also [talk = talks / talked ; talkes / talking] about friendship and love.   # Verbs
[Me and Soffia = Soffia and I ; I and Soffia / Soffia and me] were playing together.   # Pronouns
The protagonists [four girls = are four girls ; is four girls / have four girls].   # Verb be
The [firster = first / first one / eldest / oldest ; firstest / firsty] is called Meg.   # Vocabulary
The oldest had [the delicate hands = delicate hands ; a delicate hands / the delicates hands].   # Articles
Geronimo [it's = is ; its / are] a rat and a journalist.   # Verb be
Geronimo [make = makes / made ; making / maked] the newspaper.   # Verbs
He [have = has / had ; haves / having] the task to go to a haunted house.   # Verbs
He has the task to go to a [hunted = haunted ; hanted / hunting] house.   # Spelling
The ghost [it's = is ; its / are] furious.   # Verb be
He doesn't want [persons = people / anyone / anybody ; peoples / persones] in his house.   # Vocabulary
The moment Geronimo [entered at = entered / went into / walked into ; entered in / entered to] the house, the ghost scared him.   # Prepositions
He [try = tries / tried ; trys / trying] really hard to win the match.   # Verbs
He tries every [mode = way ; mood / mod] to scare him.   # Vocabulary
It's very dangerous [stay = to stay ; stays / stayed] at the beach during a tornado.   # Infinitive
We went [at the hotel = to the hotel ; in the hotel / at hotel].   # Prepositions
The [character is = characters are ; character are / characters is] Giacomino, Chiara and the fox.   # Plurals
Last summer I [go = went ; goed / gone] to Rimini.   # Past simple
I [see = saw ; seed / seen] some little fish and crabs, it was so much fun!   # Past simple
That happened [at = in ; on / to] July and August.   # Prepositions
In July I went [the = to ; at / in] Alessandria.   # Prepositions
They want to travel [the America = to America / across America / around America ; at America / to the America].   # Articles
I really [enjoy = enjoyed ; enjoied / enjoying] my vacation! I'm sad it's over!   # Past simple
[Me and my family = My family and I ; I and my family / My family and me] visited Zurich shopping malls.   # Pronouns
[For = To / In order to ; For to / So] leave the mask, she had to scare it.   # Infinitive
He had another [mask scarier = scarier mask ; more scary mask / mask more scarier].   # Adjectives
Her brother found the hat and [dressed = wore ; weared / dressed up] it.   # Vocabulary
The film [talk = talks ; talking / talkes] about 2 guys.   # Verbs
[Their name is = Their names are ; Their name are / Theirs names are] Ahmed and Hassan.   # Plurals
My little brother needed to go to school [all the month = the whole month ; the all month / all month] of June.   # Vocabulary
My dad [decide = decided ; decides / deciding] to stay in Italy and not go in July.   # Past simple
I [realy = really ; rially / reely] liked this book because it captures you from beginning to end.   # Spelling
I learned so much [nature = about nature ; of nature / on nature]!   # Prepositions
Last summer [i = I ; me / my] found a dead jellyfish.   # Capital I
The character who killed [the parent's of harry = the parents of Harry / Harry's parents ; the parent of Harry / Harry parents] is the villain.   # Possessives
Professor McGranit [learne = teaches / taught ; learns / learned] the magic to Harry.   # Vocabulary
[In this summer = This summer / Last summer ; On this summer / At this summer] I saw my cousins and uncle.   # Prepositions
Last summer I went [in = to ; at / on] Morocco.   # Prepositions
When I [returning = returned / was returning ; returnning / returns] to Italy, I went to the beach.   # Verbs
[Un = One ; An / Uno] day Nick puts glue on the teacher's chair.   # Spelling
She [want = wants ; wantes / wanting] to find Tefiti's heart and save the ocean.   # Verbs
`;

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
    let wrong = '', right = '', plain = '', fixes = 0, firstWrong = '', wrongWords = 0;
    line.split(/(\[[^\]]+\])/).forEach(part => {
      const b = part.match(/^\[([^\]]+)\]$/);
      const eq = b ? b[1].indexOf('=') : -1;
      if (!b || eq < 0) { wrong += esc(part); right += esc(part); plain += part; return; }
      const w = b[1].slice(0, eq).trim(), answers = b[1].slice(eq + 1).split(';')[0].split('/').map(x => x.trim()).filter(Boolean);
      if (!fixes) firstWrong = w;
      wrongWords += w.split(/\s+/).length;
      fixes++;
      wrong += esc(w);
      right += answers.map(a => `<b>${esc(a)}</b>`).join(' / ');
      plain += answers[0];
    });
    return { id: lv.pre + n, lv: lv.id, n, cl, cat, ctx, wrong, right, plain, fixes, wrongWords, oneWord: fixes === 1 && !/\s/.test(firstWrong) };
  }

  const linesOf = txt => txt.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('//'));
  const [easyLv, mediumLv, hardLv] = levels;
  const lvById = { easy: easyLv, medium: mediumLv, hard: hardLv };

  // TOPICS (the folders of the game): add one here = a new folder in the Error auction and in Error Breaker.
  //   raw   = all the lines (Error Breaker plays them all)
  //   piles = the lines of each pile: easy / medium / hard (if a topic has no piles, they are sorted by the rules above)
  const topics = [
    { id: 'jobs', name: 'Jobs', icon: '💼', raw: [LINES.translate, LINES.basic, LINES.basicMore, LINES.hard].join('\n'),
      piles: { easy: linesOf(LINES.translate), medium: [...linesOf(LINES.basic), ...linesOf(LINES.basicMore)], hard: linesOf(LINES.hard) } },
    { id: 'summer', name: 'Summer', icon: '☀️', raw: SUMMER, lines: linesOf(SUMMER) },
  ];

  const items = [];
  topics.forEach(tp => {
    let piles = tp.piles;
    if (!piles) { // sort the lines of the topic into the piles
      piles = { easy: [], medium: [], hard: [] };
      tp.lines.forEach(l => {
        const x = parse(l, easyLv, 0);
        piles[x.fixes > 1 || x.wrongWords >= 3 ? 'hard' : x.oneWord ? 'easy' : 'medium'].push(l);
      });
    }
    ['easy', 'medium', 'hard'].forEach(id => piles[id].forEach((l, i) => {
      const x = parse(l, lvById[id], i + 1); x.tp = tp.id; items.push(x);
    }));
    tp.count = Object.values(piles).reduce((n, a) => n + a.length, 0);
  });
  window.AUCTION = { levels, items, topics: topics.map(({ id, name, icon, raw, count }) => ({ id, name, icon, raw, count })) };
})();
