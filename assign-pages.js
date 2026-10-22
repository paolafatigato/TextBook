// "Assign work" (For the teacher): the pages of the topics in assign-data.js, made here at the end of the book.
// It runs before pages.js, so the pages are counted with the others.
//   asg-<key>          left: everything in the lists (add / remove) · right: give it to a class, change it, save it
//   asg-<key>-<n>      the saved lists, one per page with its date, the newest last
// A topic gives each student things from one list (`items`) or from several (`columns`: an animal and 3 flaws…).
// What the teacher changes (things added or removed, saved lists) is kept on this device and, through assign.js,
// in Classroom Manager, where the classes come from. When the saved lists change, the pages are made again
// and the book counts its pages again (book.spreadsChanged in script.js).

const ASSIGN = (() => {
  // { updated, topics: { <key>: { added, removed, per, lists, cols: { <column>: { added, removed, per } } } } }
  // (a topic with one list keeps added / removed / per on the topic itself)
  const KEY = 'libro-assign';
  const DRAFT_KEY = 'libro-assign-draft'; // the list being made, per topic: { cls, names, rows, heads } (this device only)
  const TOPICS = typeof ASSIGN_TOPICS === 'undefined' ? [] : ASSIGN_TOPICS;
  const main = document.querySelector('main');
  if (!main || !TOPICS.length) return null;

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const read = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };
  const dateOf = iso => new Date(iso).toLocaleDateString('en-GB');

  let state = read(KEY);
  state.topics ||= {};
  const drafts = read(DRAFT_KEY);
  let classes = null;   // from Classroom Manager: [{ id, name, students }], null = not connected yet
  let who = '';         // the Classroom Manager account

  const topicData = key => (state.topics[key] ||= {});
  const draft = key => (drafts[key] ||= { cls: '', names: '', rows: [] });
  const topic = key => TOPICS.find(t => t.key === key);

  /* ---------- the lists of a topic ---------- */

  // the columns of a topic: a topic with one list has one, called 'main'
  const cols = t => t.columns || [{ key: 'main', unit: t.unit, per: t.per, items: t.items }];
  const col = (t, key) => cols(t).find(c => c.key === key) || cols(t)[0];
  const colData = (t, c) => (c.key === 'main' ? topicData(t.key) : ((topicData(t.key).cols ||= {})[c.key] ||= {}));
  const per = (t, c) => Number(colData(t, c).per) || c.per || 1;

  // "🩺 doctor" or "adventurous"
  const label = it => (Array.isArray(it) ? it.filter(Boolean).join(' ') : String(it));
  const word = it => (Array.isArray(it) ? it[1] : String(it));
  // a list: the one in the code, without what was removed, with what was added
  function items(t, c) {
    const d = colData(t, c);
    const removed = new Set(d.removed || []);
    return [...c.items.filter(it => !removed.has(word(it))), ...(d.added || [])];
  }

  // the headings of the boxes of a row, each with its column: [{ h: 'Flaw 2', col: 'flaw' }…]
  const headsNow = t => cols(t).flatMap(c => Array.from({ length: per(t, c) }, (_, k) => ({ h: per(t, c) > 1 ? `${c.unit} ${k + 1}` : c.unit, col: c.key })));
  // the headings kept with a list (lists saved before there were columns have none: one list, as many boxes as needed)
  function headsOf(t, rows, kept) {
    const heads = (kept || headsNow(t)).slice();
    const n = Math.max(0, ...rows.map(r => r.items.length));
    const last = heads.at(-1) || { col: cols(t)[0].key };
    for (let k = heads.length; k < n; k++) heads.push({ h: `${col(t, last.col).unit} ${k + 1}`, col: last.col });
    return heads;
  }

  /* ---------- the pages ---------- */

  function table(t, rows, heads) {
    return `
      <table class="asg-table${heads.length > 2 ? ' many' : ''}">
        <thead><tr><th>#</th><th>Student</th>${heads.map(x => `<th>${esc(x.h)}</th>`).join('')}<th></th></tr></thead>
        <tbody>${rows.map((r, i) => `
          <tr data-i="${i}"><td class="asg-n">${i + 1}</td>
            <td><input class="asg-name" value="${esc(r.name)}" aria-label="Student ${i + 1}"></td>
            ${heads.map((x, k) => `<td><input class="asg-item" data-k="${k}" list="asg-opt-${t.key}-${x.col}" value="${esc(r.items[k] || '')}" aria-label="${esc(r.name)}: ${esc(x.h)}"></td>`).join('')}
            <td class="asg-row-tools"><button type="button" data-act="reroll" title="Draw again for this student">🎲</button><button type="button" data-act="row-del" title="Remove this row">✕</button></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  }

  function listPage(t, side) {
    const many = cols(t).length > 1;
    const block = c => {
      const d = colData(t, c);
      const all = items(t, c);
      const added = new Set((d.added || []).map(word));
      return `
      ${many ? `<h3 class="asg-col">${esc(c.title || c.unit + 's')} <small>${all.length}</small></h3>` : ''}
      <ul class="asg-items">${all.map(it => `
        <li${added.has(word(it)) ? ' class="mine"' : ''}>${Array.isArray(it) && it[0] ? `<span class="asg-emoji">${esc(it[0])}</span>` : ''}${esc(word(it))}<button type="button" data-act="item-del" data-col="${c.key}" data-w="${esc(word(it))}" aria-label="Remove ${esc(word(it))}">✕</button></li>`).join('')}
      </ul>
      <form class="asg-add asg-tools" data-col="${c.key}">
        <input name="e" placeholder="🙂" maxlength="8" aria-label="Emoji (optional)">
        <input name="w" placeholder="Add a new ${esc(c.unit.toLowerCase())}…" aria-label="New ${esc(c.unit.toLowerCase())}" required>
        <button type="submit">+ Add</button>
        ${(d.removed || []).length ? `<button type="button" data-act="item-restore" data-col="${c.key}">↺ Put back ${d.removed.length} removed</button>` : ''}
      </form>`;
    };
    return `
    <section class="page page-${side} asg-page asg-list-page"><div class="asg-in">
      <h1 class="asg-title">${esc(t.title)}</h1>
      <p class="asg-sub">${many ? '' : `${items(t, cols(t)[0]).length} in the list · `}✕ removes one · add your own under the list</p>
      ${t.note ? `<p class="asg-note">${esc(t.note)}</p>` : ''}
      ${cols(t).map(block).join('')}
      </div>
      <span class="pageno"></span>
    </section>`;
  }

  function assignPage(t, side) {
    const dr = draft(t.key);
    const options = classes
      ? `<option value="">— choose a class —</option>${classes.map(c => `<option value="${esc(c.id)}">${esc(c.name)} (${c.students.length})</option>`).join('')}`
      : '<option value="">— connect Classroom Manager —</option>';
    return `
    <section class="page page-${side} asg-page asg-make-page"><div class="asg-in">
      <h2 class="asg-title small">Give them to a class</h2>
      <p class="asg-who asg-tools">${classes
        ? `Classroom Manager: <b>${esc(who)}</b> <button type="button" class="asg-link" data-act="connect">change</button>`
        : '<button type="button" data-act="connect">🔗 Connect Classroom Manager</button>'}</p>
      <div class="asg-controls asg-tools">
        <select class="asg-class" aria-label="Class">${options}<option value="__names">✍️ Type the names…</option></select>
        ${cols(t).filter(c => c.per > 1).map(c => `<label>${esc(c.unit.toLowerCase())}s each <input class="asg-per" data-col="${c.key}" type="number" min="1" max="8" value="${per(t, c)}"></label>`).join('')}
        <button type="button" class="asg-go" data-act="draw">🎲 Draw</button>
      </div>
      <textarea class="asg-names asg-tools" rows="3" placeholder="One student per line"${dr.cls === '__names' ? '' : ' hidden'}>${esc(dr.names)}</textarea>
      <div class="asg-draft">${dr.rows.length ? table(t, dr.rows, headsOf(t, dr.rows, dr.heads)) + '<button type="button" class="asg-addrow asg-tools" data-act="row-add">+ Add a row</button>'
        : '<p class="asg-empty">Choose a class and press 🎲 Draw. You can change every name and every box, then save the list: it becomes the next page, with today’s date.</p>'}</div>
      <div class="asg-actions asg-tools">
        <button type="button" data-act="save"${dr.rows.length ? '' : ' disabled'}>💾 Save as a page</button>
        <button type="button" data-act="print"${dr.rows.length ? '' : ' disabled'}>🖨️ Print</button>
        <span class="asg-status" role="status"></span>
      </div>
      ${cols(t).map(c => `<datalist id="asg-opt-${t.key}-${c.key}">${items(t, c).map(it => `<option value="${esc(label(it))}">`).join('')}</datalist>`).join('')}
      </div>
      <span class="pageno"></span>
    </section>`;
  }

  function savedPage(t, list, side) {
    if (!list) return `<section class="page page-${side} asg-page asg-saved-page asg-blank"><div class="asg-in"><p class="asg-empty">The next list you save will be here.</p></div><span class="pageno"></span></section>`;
    return `
    <section class="page page-${side} asg-page asg-saved-page" data-list="${esc(list.id)}"><div class="asg-in">
      <p class="asg-date">📅 ${dateOf(list.date)}</p>
      <h2 class="asg-title small"><input class="asg-list-title" value="${esc(list.title)}" aria-label="Title"></h2>
      ${table(t, list.rows, headsOf(t, list.rows, list.heads))}
      <div class="asg-actions asg-tools">
        <button type="button" data-act="print">🖨️ Print</button>
        <button type="button" data-act="list-del">🗑️ Delete this list</button>
        <span class="asg-status" role="status"></span>
      </div>
      </div>
      <span class="pageno"></span>
    </section>`;
  }

  function spreadsOf(t) {
    const attrs = (id, name) => `class="spread" data-asg="${t.key}" data-id="${id}" data-title="Assign: ${esc(t.title)}" data-name="${esc(name)}"`;
    const lists = (topicData(t.key).lists || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    let html = `<div ${attrs(`asg-${t.key}`, `${t.title}: the list · give it to a class`)}>${listPage(t, 'left')}${assignPage(t, 'right')}</div>`;
    for (let i = 0; i < lists.length; i += 2) {
      const [a, b] = [lists[i], lists[i + 1]];
      const name = [a, b].filter(Boolean).map(l => `${dateOf(l.date)} ${l.title}`).join(' · ');
      html += `<div ${attrs(`asg-${t.key}-${i / 2 + 1}`, name)}>${savedPage(t, a, 'left')}${savedPage(t, b, 'right')}</div>`;
    }
    return html;
  }

  // make all the pages again (they are the last ones of the book)
  function build() {
    main.querySelectorAll('.spread[data-asg]').forEach(s => s.remove());
    main.insertAdjacentHTML('beforeend', TOPICS.map(spreadsOf).join(''));
    TOPICS.forEach(t => { const sel = main.querySelector(`[data-id="asg-${t.key}"] .asg-class`); if (sel) sel.value = draft(t.key).cls; });
  }

  function rebuild(focus) {
    build();
    window.book?.spreadsChanged?.();
    if (focus) main.querySelector(focus)?.focus();
  }

  /* ---------- keeping it ---------- */

  function save() {
    state.updated = Date.now();
    write(KEY, state);
    window.assignCloud?.push(state);
  }
  const saveDraft = () => write(DRAFT_KEY, drafts);

  /* ---------- drawing ---------- */

  // deal like cards: nobody gets the same thing twice while the pack lasts;
  // things that other rows already have are dealt last
  function dealer(t, c, avoid = []) {
    const pool = items(t, c).map(label);
    let pack = [];
    return () => {
      if (!pack.length) {
        const fresh = shuffle(pool);
        pack = [...fresh.filter(x => avoid.includes(x)), ...fresh.filter(x => !avoid.includes(x))];
      }
      return pack.pop();
    };
  }
  const decksFor = (t, avoid) => Object.fromEntries(cols(t).map(c => [c.key, dealer(t, c, avoid)]));
  // one row: for each heading, something from the deck of its column (never twice the same thing in a row)
  function hand(heads, decks) {
    const out = [];
    heads.forEach(x => {
      for (let k = 0; k < 40; k++) { const v = decks[x.col](); if (v && !out.includes(v)) { out.push(v); return; } }
      out.push(''); // the list is shorter than the boxes to fill
    });
    return out;
  }

  function students(t) {
    const dr = draft(t.key);
    if (dr.cls === '__names') return dr.names.split(/\n|,/).map(s => s.trim()).filter(Boolean);
    return classes?.find(c => c.id === dr.cls)?.students || [];
  }
  const className = t => classes?.find(c => c.id === draft(t.key).cls)?.name || '';

  /* ---------- print one list ---------- */

  function print(t, title, rows, heads) {
    const w = window.open('', '_blank');
    if (!w) { alert('Allow pop-ups for this site to print the list.'); return; }
    w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
      <style>
        @page { size: A4; margin: 14mm; }
        body { font: 15px 'Nunito', Arial, sans-serif; color: #222; }
        h1 { font-size: 22px; margin: 0 0 12px; color: ${t.color}; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #bbb; padding: 7px 9px; text-align: left; vertical-align: top; }
        th { background: #f4f1ec; }
        td:first-child, th:first-child { width: 28px; text-align: right; color: #888; }
        tr { break-inside: avoid; }
      </style></head><body>
      <h1>${esc(title)}</h1>
      <table><thead><tr><th>#</th><th>Student</th>${heads.map(x => `<th>${esc(x.h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}</td>${heads.map((_, k) => `<td>${esc(r.items[k] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  /* ---------- what the teacher does on the pages ---------- */

  const where = el => {
    const spread = el.closest('.spread[data-asg]');
    if (!spread) return null;
    const t = topic(spread.dataset.asg);
    const page = el.closest('.page');
    const listId = page?.dataset.list;
    const list = listId ? topicData(t.key).lists.find(l => l.id === listId) : null;
    const rows = list ? list.rows : draft(t.key).rows;
    const heads = headsOf(t, rows, list ? list.heads : draft(t.key).heads);
    return { t, page, list, rows, heads, i: Number(el.closest('tr')?.dataset.i) };
  };
  const status = (page, text) => { const s = page.querySelector('.asg-status'); if (s) s.textContent = text; };
  // a change to the draft or to a saved list: draw only that table again
  function repaint(w) {
    const box = w.list ? w.page : w.page.querySelector('.asg-draft');
    const old = box.querySelector('.asg-table');
    if (old) old.outerHTML = table(w.t, w.rows, w.heads);
    else rebuild(); // the first rows of a draft
  }
  const changed = w => { if (w.list) save(); else saveDraft(); };

  main.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    const w = b && where(b);
    if (!w) return;
    const { t, page } = w;
    const d = topicData(t.key);
    const dr = draft(t.key);
    switch (b.dataset.act) {
      case 'connect': window.assignCloud?.connect(); break;
      case 'draw': {
        const names = students(t);
        if (!names.length) { status(page, dr.cls ? 'There are no students.' : 'Choose a class first.'); return; }
        if (dr.rows.length && !confirm('Draw a new list? The one on this page will be replaced.')) return;
        dr.heads = headsNow(t);
        // the same decks for the whole class, so that nobody gets the same thing while the lists last
        const decks = decksFor(t);
        dr.rows = names.map(name => ({ name, items: hand(dr.heads, decks) }));
        saveDraft();
        rebuild();
        break;
      }
      case 'reroll':
        w.rows[w.i].items = hand(w.heads, decksFor(t, w.rows.flatMap((r, j) => (j === w.i ? [] : r.items))));
        repaint(w); changed(w); break;
      case 'row-del': w.rows.splice(w.i, 1); repaint(w); changed(w); break;
      case 'row-add':
        w.rows.push({ name: '', items: [] }); repaint(w); changed(w);
        page.querySelector('tr:last-child .asg-name')?.focus(); break;
      case 'save': {
        const cls = dr.cls === '__names' ? '' : className(t);
        const list = {
          id: Date.now().toString(36),
          date: new Date().toISOString(),
          title: `${t.title}${cls ? ' · ' + cls : ''}`,
          cls,
          heads: w.heads,
          rows: dr.rows.map(r => ({ name: r.name, items: w.heads.map((_, k) => r.items[k] || '') })),
        };
        (d.lists ||= []).push(list);
        dr.rows = [];
        saveDraft();
        save();
        rebuild();
        // go to the new page
        const at = main.querySelector(`[data-list="${list.id}"]`)?.closest('.spread');
        if (at) location.hash = `#p${at.dataset.pages.split('-')[0]}`;
        break;
      }
      case 'print':
        print(t, w.list ? w.list.title : `${t.title}${className(t) ? ' · ' + className(t) : ''} · ${dateOf(new Date())}`, w.rows, w.heads);
        break;
      case 'list-del':
        if (!confirm(`Delete "${w.list.title}" (${dateOf(w.list.date)})?`)) return;
        d.lists = d.lists.filter(l => l !== w.list);
        save();
        rebuild();
        break;
      case 'item-del': {
        const cd = colData(t, col(t, b.dataset.col));
        const x = b.dataset.w;
        if ((cd.added || []).some(it => word(it) === x)) cd.added = cd.added.filter(it => word(it) !== x);
        else (cd.removed ||= []).push(x);
        save();
        rebuild();
        break;
      }
      case 'item-restore': colData(t, col(t, b.dataset.col)).removed = []; save(); rebuild(); break;
    }
  });

  main.addEventListener('submit', e => {
    const form = e.target.closest('.asg-add');
    if (!form) return;
    e.preventDefault();
    const { t } = where(form);
    const c = col(t, form.dataset.col);
    const cd = colData(t, c);
    const x = form.w.value.trim();
    if (!x) return;
    if (items(t, c).some(it => word(it).toLowerCase() === x.toLowerCase())) { form.w.select(); return; }
    // something from the code that was removed comes back; anything else is added
    if ((cd.removed || []).includes(x)) cd.removed = cd.removed.filter(r => r !== x);
    else (cd.added ||= []).push(form.e.value.trim() ? [form.e.value.trim(), x] : x);
    save();
    rebuild(`[data-id="asg-${t.key}"] .asg-add[data-col="${c.key}"] [name="w"]`);
  });

  let typingTimer = null;
  let listsEdited = false;
  main.addEventListener('input', e => {
    const el = e.target;
    const w = where(el);
    if (!w) return;
    if (el.classList.contains('asg-name')) w.rows[w.i].name = el.value;
    else if (el.classList.contains('asg-item')) w.rows[w.i].items[Number(el.dataset.k)] = el.value;
    else if (el.classList.contains('asg-list-title')) w.list.title = el.value;
    else if (el.classList.contains('asg-names')) draft(w.t.key).names = el.value;
    else return;
    if (w.list) listsEdited = true;
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => { saveDraft(); if (listsEdited) save(); listsEdited = false; }, 500);
  });

  main.addEventListener('change', e => {
    const el = e.target;
    const w = where(el);
    if (!w) return;
    if (el.classList.contains('asg-class')) {
      draft(w.t.key).cls = el.value;
      saveDraft();
      w.page.querySelector('.asg-names').hidden = el.value !== '__names';
    } else if (el.classList.contains('asg-per')) {
      colData(w.t, col(w.t, el.dataset.col)).per = Math.max(1, Number(el.value) || 1);
      save();
    } else if (el.classList.contains('asg-list-title')) rebuild(); // the name of the page in the contents
  });

  build();

  // assign.js (Classroom Manager)
  return {
    getClasses: () => classes,
    setClasses(list, account) {
      classes = list;
      who = account || '';
      main.querySelectorAll('.spread[data-asg] .asg-make-page').forEach(p => {
        const t = topic(p.closest('.spread').dataset.asg);
        p.outerHTML = assignPage(t, 'right');
      });
      TOPICS.forEach(t => { const sel = main.querySelector(`[data-id="asg-${t.key}"] .asg-class`); if (sel) sel.value = draft(t.key).cls; });
      window.book?.spreadsChanged?.(); // the page numbers of the new pages
    },
    // what the cloud has: the newer one wins
    fromCloud(cloud) {
      if (cloud?.updated > (state.updated || 0)) {
        state = cloud;
        state.topics ||= {};
        write(KEY, state);
        rebuild();
      } else if ((state.updated || 0) > (cloud?.updated || 0)) window.assignCloud?.push(state);
    },
  };
})();
