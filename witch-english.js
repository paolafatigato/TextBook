// Witch hunt (CLIL, witch-game.js): checks the accusation that the pupil types before the vote.
// The accusation counts only if it is a correct and sensible English sentence:
//   • a capital letter, a full stop, at least 4 words, a verb;
//   • it names the accused person and says that he or she is a witch / a thief / suspicious… (not a defence, not a question);
//   • every word is spelled right (the vocabulary is the core words below + the words printed in the Witch hunt chapter);
//   • a few typical grammar mistakes are caught: he take, the bishop are, a witches, is witch, an/a, much coins, more rich…
//   • "because …" must be a complete reason; a reason about the game (coins, night, forest, lies…) makes the accusation stronger.
// WITCH_ENGLISH.check(text, { nouns: ['bishop'] }) → { ok, problems: [html…], strong, reason }

(() => {
  const CORE = `a an the this that these those there here and or but because so if when while after before then than as of at in on to from by with without for about over under near between into out up down off through during since until again also too very really more most much many some any no not nor all every each both other another one two three four five six seven eight nine ten twenty hundred first second third last next only just even still always never often sometimes today tonight yesterday tomorrow now soon already ever once twice who whom whose what which where why how i me my mine you your yours he him his she her hers it its we us our ours they them their theirs myself himself herself themselves is am are was were be been being has have had having do does did done can could will would shall should may might must yes ok
  i'm i've i'd i'll he's she's it's we're you're they're we've they've that's there's what's let's isn't aren't wasn't weren't doesn't don't didn't can't couldn't won't wouldn't shouldn't hasn't haven't hadn't mustn't
  witch witches wizard magic magical spell spells curse cursed curses potion potions herb herbs forest wood woods wild night nights day days morning evening moon moonlight dark darkness black white red green blue yellow grey brown broom broomstick cat cats animal animals dog dogs crow raven toad owl bird birds fire stake hunt trial court judge guilty innocent evil devil demon sin church bishop monk nun priest lord lords noble nobles noblewoman maid midwife healer herbalist merchant blacksmith craftsman craftsmen innkeeper farmer farmers beggar squire spinner villager villagers village town people person man men woman women boy girl girls boys child children baby family neighbor neighbour neighbors neighbours friend friends enemy enemies king queen castle house home door window street road field fields crop crops harvest food bread meat milk water wine beer money coin coins gold silver rich richer richest poor poorer poorest tax taxes thief thieves price card cards game
  good bad better best worse worst big small little large old young new strange odd weird scary dangerous suspicious quiet loud happy sad angry afraid hungry ill sick dead alive lazy clever stupid kind mean greedy honest selfish proud strong weak fast slow tall short long ugly beautiful pretty secret secretly true false real fake sure certain possible impossible important different same enough free full empty hot cold warm dry wet clean dirty easy hard hungry famous
  something someone somebody anything anyone anybody nothing nobody everything everyone everybody thing things way time times year years week life death body face hand hands eye eyes head hair voice name word words reason reasons proof evidence truth lie lies liar liars trouble problem problems help power powers vote votes plan plans idea ideas place places place side top bottom end part lot lots bit piece
  here there where everywhere somewhere nowhere together alone away back out inside outside around behind next left right
  often usually finally suddenly quickly slowly carefully probably maybe perhaps surely certainly exactly almost nearly quite rather too enough
  please thank thanks sorry hello look
  `.split(/\s+/).filter(Boolean);

  const BASE = `take steal get give have go make buy sell look say see want keep hide use work help know find become bring show pay eat meet live lie tell speak visit collect own ask change wake come run walk kill burn curse send hold carry leave stay try need love hate like hear listen watch notice think believe suspect accuse blame lose win cast cook brew mix drink sleep dance sing talk whisper shout laugh cry hurt heal cure save protect trust fear scare hunt catch follow push pull open close enter start stop rob lend borrow spend cheat trick lead rule fight attack defend vote choose point call count rise fall grow plant pick wear sit stand turn throw read write remember forget invite pray die sneak spy swap tax cause hurt turn appear disappear seem feel smell taste touch bite kiss meet wait plan hope wish wonder agree disagree prove lock put cut let set sound visit`.split(/\s+/).filter(Boolean);
  const AMBIG = ['put', 'cut', 'let', 'set', 'read', 'hurt', 'cast'];   // their past tense looks like the base form: no "he take" check
  const IRREG = `took taken stole stolen got gotten gave given went gone made bought sold saw seen said told knew known found kept hid hidden had was were been did done came ran ate eaten met paid brought left held sent felt thought taught sat stood woke woken lost began spoke spoken wrote written broke broken drew drawn grew grown threw thrown built heard caught fought led slept dug stuck stopped robbed begged planned slipped dropped tapped hugged ran sat swam won shot`.split(/\s+/);

  const s3 = v => /(s|x|z|ch|sh|o)$/.test(v) ? v + 'es' : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + 'ies' : v + 's';
  const ed = v => /e$/.test(v) ? v + 'd' : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + 'ied' : v + 'ed';
  const ing = v => /ie$/.test(v) ? v.slice(0, -2) + 'ying' : /[^e]e$/.test(v) ? v.slice(0, -1) + 'ing' : v + 'ing';
  // nouns of the core list also get their plural
  const plural = w => /(s|x|z|ch|sh)$/.test(w) ? w + 'es' : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + 'ies' : w + 's';

  const VERBS = new Set(['is', 'am', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'does', 'do', 'did', 'can', 'could', 'will', 'would', 'should', 'must', 'may', 'might', "isn't", "aren't", "doesn't", "don't", "didn't", "can't", "hasn't", "haven't", "wasn't", "weren't", "he's", "she's", "it's", "i'm", "they're", "we're", "you're", "i've", "they've", "we've"]);
  const VOC = new Set(CORE);
  BASE.forEach(v => [v, s3(v), ed(v), ing(v)].forEach(f => { VOC.add(f); VERBS.add(f); }));
  IRREG.forEach(f => { VOC.add(f); VERBS.add(f); });
  CORE.forEach(w => { if (w.length > 2) VOC.add(plural(w)); });
  // names of the characters (witch-data.js) and every word printed in the chapter: the pupils have met them
  let learned = false;
  function learn() {
    if (learned) return;
    learned = true;
    const add = s => String(s || '').toLowerCase().replace(/[’`]/g, "'").match(/[a-z]+(?:'[a-z]+)?/g)?.forEach(w => { VOC.add(w); if (w.length > 2) VOC.add(plural(w)); });
    try { (window.WITCH_DATA?.CHARS || []).forEach(c => { add(c.name); add(c.desc); add(c.fun); }); } catch { /* data not ready */ }
    try { document.querySelectorAll('.spread[data-id^="wh-"]:not(.scaffold)').forEach(sp => add(sp.textContent)); } catch { /* no pages */ }
  }

  // words that make a reason about the game: coins, night, lies, the forest…
  const REASON = new Set(`coin coins money rich richer richest gold night nights dead died killed die forest strange herb herbs potion spell curse cursed steal steals stole stolen lies lied liar thief poor hungry moon black cat broom neighbor neighbour church lord tax alone always never often power powerful spy heard saw seen late dark secret secretly magic gets got more many lot sick ill hurt angry mean greedy`.split(/\s+/));
  const GUILTY = /\b(witch|witches|witchcraft|cursed?|curses|cursing|guilty|evil|thief|thieves|steals?|stole|stolen|suspicious|strange|dangerous|liar|lies|lied|devil|devil's|killed?|kills|killer|murderer)\b/i;
  const DEFENCE = /\b(isn't|aren't|is not|are not|not a witch|not guilty|innocent)\b|\b(is|are) (a |an )?(good|honest|kind|nice)\b(?! (liar|thief))/i;

  const lev = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  };
  const known = w => VOC.has(w) || (/'s$/.test(w) && VOC.has(w.slice(0, -2)));
  // the closest known word; on a tie, a word of the accusation vocabulary (witch, because, coins…) wins
  function nearest(w, nouns = []) {
    const max = w.length <= 4 ? 1 : 2;
    const wanted = v => REASON.has(v) || GUILTY.test(v) || nouns.includes(v) || v === 'because';
    let best = null, bd = max + 1;
    for (const v of VOC) {
      if (Math.abs(v.length - w.length) > max) continue;
      const d = lev(w, v);
      if (d < bd || (d === bd && best && !wanted(best) && wanted(v))) { best = v; bd = d; }
    }
    return best;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function check(text, target) {
    learn();
    const raw = String(text || '').replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim();
    const problems = [];
    const add = html => { if (!problems.includes(html)) problems.push(html); };
    if (!raw) return { ok: false, problems: ['Write a sentence first.'] };
    const words = raw.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
    const low = words.map(w => w.toLowerCase());
    const nouns = (target && target.nouns && target.nouns.length ? target.nouns : ['villager']).map(n => n.toLowerCase());
    const subj = nouns.map(n => n.replace(/[^a-z ]/g, '')).join('|');

    if (words.length < 4) add('Too short. Write a whole sentence, for example: <i>“The bishop is a witch.”</i>');
    if (/^[^A-Za-z]*[a-z]/.test(raw)) add('Start the sentence with a <b>capital letter</b>.');
    if (/\?\s*$/.test(raw)) add('An accusation is a statement, not a question. End it with a full stop.');
    else if (!/[.!]["”']?\s*$/.test(raw)) add('End the sentence with a <b>full stop</b> (.) or an exclamation mark (!).');
    if (/(^|[^A-Za-z'])i(?![A-Za-z'])/.test(raw)) add('Write <b>“I”</b> with a capital letter.');

    // who is accused, and for what
    if (!new RegExp(`\\b(${subj})\\b`, 'i').test(raw)) add(`Say who you accuse: write the name, for example <i>“the ${esc(nouns[0])}”</i>.`);
    const main = raw.split(/\b(because|since)\b/i)[0];

    // spelling: every word must be a word we know
    let wrong = 0;
    for (const w of low) {
      if (known(w) || wrong >= 3) continue;
      wrong++;
      const n = nearest(w, nouns);
      add(n ? `Spelling: <mark>${esc(w)}</mark> → <b>${esc(n)}</b>?` : `I don’t know the word <mark>${esc(w)}</mark>. Check the spelling or use a simpler word.`);
    }
    if (!wrong && !GUILTY.test(raw)) add('Say what is wrong with this person. For example: <i>“… is a witch”</i>, <i>“… is a thief”</i> or <i>“… steals coins”</i>.');
    else if (DEFENCE.test(main)) add('This is a defence, not an accusation. Say what the person did wrong.');

    // typical grammar mistakes
    const lowText = low.join(' ');
    const swap = { are: 'is', have: 'has', were: 'was', do: 'does' };
    let m = lowText.match(new RegExp(`\\b(${subj}|he|she|it) (are|have|were|do)\\b`));
    if (m) add(`One person: use <b>${swap[m[2]]}</b>, not <mark>${m[2]}</mark> (<i>${m[1] === 'he' || m[1] === 'she' || m[1] === 'it' ? m[1] : 'the ' + m[1]} ${swap[m[2]]}…</i>).`);
    m = lowText.match(new RegExp(`\\b(${subj}|he|she|it) (${BASE.filter(v => v.length > 2 && !AMBIG.includes(v)).join('|')})\\b`));
    if (m) add(`After <i>${/^(he|she|it)$/.test(m[1]) ? m[1] : 'the ' + m[1]}</i> the verb needs an <b>-s</b>: <mark>${m[2]}</mark> → <b>${s3(m[2])}</b>.`);
    m = lowText.match(/\b(i|you|we|they) (is|has|does)\b/) || lowText.match(/\bi are\b/);
    if (m) add(`Check the verb after <i>${m[1] || 'i'}</i>: <mark>${m[2] || 'are'}</mark> is not right.`);
    for (let k = 0; k < low.length - 1; k++) {
      const a = low[k], n = low[k + 1];
      if (a === 'a' && /^[aeiou]/.test(n) && !/^(uni|use|eu|one|ur[aeiu]|usu|uti)/.test(n)) add(`Before a vowel sound use <b>an</b>: <mark>a ${esc(n)}</mark> → <b>an ${esc(n)}</b>.`);
      if (a === 'an' && /^[^aeiou]/.test(n) && !/^(hour|honest|honou?r|heir)/.test(n)) add(`Before this sound use <b>a</b>: <mark>an ${esc(n)}</mark> → <b>a ${esc(n)}</b>.`);
      if (a === n && !['that', 'had'].includes(a)) add(`You wrote <mark>${esc(a)}</mark> twice.`);
    }
    m = lowText.match(/\b(is|was) (witch|thief|liar|spy|murderer|beggar|devil)\b/);
    if (m) add(`<mark>${m[1]} ${m[2]}</mark> → <b>${m[1]} a ${m[2]}</b> (you need <b>a</b>).`);
    if (/\ba (witches|coins|women|men|people|villagers|thieves|liars)\b/.test(lowText)) add('<b>a</b> goes with one thing: <i>a witch</i>. For many say <i>witches</i>.');
    if (/\bmuch (coins|witches|people|friends|villagers)\b/.test(lowText)) add('<mark>much coins</mark> → <b>many coins</b> (you can count coins).');
    if (/\bmany (money|gold|food|bread)\b/.test(lowText)) add('<mark>many money</mark> → <b>much money</b> (you cannot count money).');
    if (/\ba lot (coins|money|gold|food|people|friends)\b/.test(lowText)) add('<mark>a lot coins</mark> → <b>a lot of</b> coins.');
    if (/\bmore (rich|poor|strong|happy|old|young)\b/.test(lowText)) add('<mark>more rich</mark> → <b>richer</b> (short adjective + -er).');
    if (/\bmost (rich|poor|strong)\b/.test(lowText)) add('<mark>most rich</mark> → <b>richest</b>.');

    if (!low.some(w => VERBS.has(w))) add('A sentence needs a <b>verb</b>: is, has, steals…');

    // “because …” must be a whole reason
    let reason = false, strong = false;
    const bi = low.indexOf('because');
    if (bi >= 0) {
      const clause = low.slice(bi + 1);
      if (clause.length < 3 || !clause.some(w => VERBS.has(w))) add('After <b>because</b> write a whole reason, with a subject and a verb: <i>“because he has a lot of coins”</i>.');
      else { reason = true; strong = clause.some(w => REASON.has(w)); }
    }
    return { ok: !problems.length, problems: problems.slice(0, 4), reason, strong: !problems.length && strong };
  }

  window.WITCH_ENGLISH = { check };
})();
