// "Assign work" (For the teacher): the pages of the topics in assign-data.js, made here at the end of the book.
// It runs before pages.js, so the pages are counted with the others.
//   asg-<key>          left: everything in the list (add / remove) · right: give it to a class, change it, save it
//   asg-<key>-<n>      the saved lists, one per page with its date, the newest last
// What the teacher changes (things added or removed, saved lists) is kept on this device and, through assign.js,
// in Classroom Manager, where the classes come from. When the saved lists change, the pages are made again
// and the book counts its pages again (book.spreadsChanged in script.js).

const ASSIGN = (() => {
  const KEY = 'libro-assign';         // { updated, topics: { <key>: { added, removed, per, lists } } }
  const DRAFT_KEY = 'libro-assign-draft'; // the list being made, per topic: { cls, names, rows } (this device only)
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
  const per = t => Number(topicData(t.key).per) || t.per || 1;

  // "🩺 doctor" or "adventurous"
  const label = it => (Array.isArray(it) ? it.filter(Boolean).join(' ') : String(it));
  const word = it => (Array.isArray(it) ? it[1] : String(it));
  // the list of a topic: the one in the code, without what was removed, with what was added
  function items(t) {
    const d = topicData(t.key);
    const removed = new Set(d.removed || []);
    return [...t.items.filter(it => !removed.has(word(it))), ...(d.added || [])];
  }

  /* ---------- the pages ---------- */

  const head = (t, k, n) => `${esc(t.unit)}${n > 1 ? ' ' + (k + 1) : ''}`;

  function table(t, rows, editable) {
    const n = Math.max(per(t), ...rows.map(r => r.items.length));
    const cell = (v, cls, extra) => (editable ? `<input class="${cls}" value="${esc(v)}" list="asg-opt-${t.key}"${extra}>` : esc(v));
    return `
      <table class="asg-table">
        <thead><tr><th>#</th><th>Student</th>${Array.from({ length: n }, (_, k) => `<th>${head(t, k, n)}</th>`).join('')}${editable ? '<th></th>' : ''}</tr></thead>
        <tbody>${rows.map((r, i) => `
          <tr data-i="${i}"><td class="asg-n">${i + 1}</td>
            <td>${editable ? `<input class="asg-name" value="${esc(r.name)}" aria-label="Student ${i + 1}">` : esc(r.name)}</td>
            ${Array.from({ length: n }, (_, k) => `<td>${cell(r.items[k] || '', 'asg-item', ` data-k="${k}" aria-label="${esc(r.name)} ${k + 1}"`)}</td>`).join('')}
            ${editable ? '<td class="asg-row-tools"><button type="button" data-act="reroll" title="Draw again for this student">🎲</button><button type="button" data-act="row-del" title="Remove this row">✕</button></td>' : ''}
          </tr>`).join('')}
        </tbody>
      </table>`;
  }

  function listPage(t, side) {
    const d = topicData(t.key);
    const all = items(t);
    const added = new Set((d.added || []).map(word));
    return `
    <section class="page page-${side} asg-page asg-list-page"><div class="asg-in">
      <h1 class="asg-title">${esc(t.title)}</h1>
      <p class="asg-sub">${all.length} in the list · ✕ removes one · add your own at the bottom</p>
      <ul class="asg-items">${all.map(it => `
        <li${added.has(word(it)) ? ' class="mine"' : ''}>${Array.isArray(it) && it[0] ? `<span class="asg-emoji">${esc(it[0])}</span>` : ''}${esc(word(it))}<button type="button" data-act="item-del" data-w="${esc(word(it))}" aria-label="Remove ${esc(word(it))}">✕</button></li>`).join('')}
      </ul>
      <form class="asg-add asg-tools">
        <input name="e" placeholder="🙂" maxlength="8" aria-label="Emoji (optional)">
        <input name="w" placeholder="Add a new one…" aria-label="New item" required>
        <button type="submit">+ Add</button>
        ${(d.removed || []).length ? `<button type="button" data-act="item-restore">↺ Put back ${d.removed.length} removed</button>` : ''}
      </form>
      </div>
      <span class="pageno"></span>
    </section>`;
  }

  function assignPage(t, side) {
    const dr = draft(t.key);
    const many = t.per > 1;
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
        ${many ? `<label>each <input class="asg-per" type="number" min="1" max="8" value="${per(t)}"></label>` : ''}
        <button type="button" class="asg-go" data-act="draw">🎲 Draw</button>
      </div>
      <textarea class="asg-names asg-tools" rows="3" placeholder="One student per line"${dr.cls === '__names' ? '' : ' hidden'}>${esc(dr.names)}</textarea>
      <div class="asg-draft">${dr.rows.length ? table(t, dr.rows, true) + '<button type="button" class="asg-addrow asg-tools" data-act="row-add">+ Add a row</button>'
        : '<p class="asg-empty">Choose a class and press 🎲 Draw. You can change every name and every box, then save the list: it becomes the next page, with today’s date.</p>'}</div>
      <div class="asg-actions asg-tools">
        <button type="button" data-act="save"${dr.rows.length ? '' : ' disabled'}>💾 Save as a page</button>
        <button type="button" data-act="print"${dr.rows.length ? '' : ' disabled'}>🖨️ Print</button>
        <span class="asg-status" role="status"></span>
      </div>
      <datalist id="asg-opt-${t.key}">${items(t).map(it => `<option value="${esc(label(it))}">`).join('')}</datalist>
      </div>
      <span class="pageno"></span>
    </section>`;
  }

  function savedPage(t, list, side) {
    if (!list) return `<section class="page page-${side} asg-page asg-saved-page asg-blank"><div class="asg-in"><p class="asg-empty">The next list you save will be here.</p><span class="pageno"></span></section>`;
    return `
    <section class="page page-${side} asg-page asg-saved-page" data-list="${esc(list.id)}"><div class="asg-in">
      <p class="asg-date">📅 ${dateOf(list.date)}</p>
      <h2 class="asg-title small"><input class="asg-list-title" value="${esc(list.title)}" aria-label="Title"></h2>
      ${table(t, list.rows, true)}
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
    let html = `<div ${attrs(`asg-${t.key}`, 'The list · give it to a class')}>${listPage(t, 'left')}${assignPage(t, 'right')}</div>`;
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
  function dealer(t, avoid = []) {
    const pool = items(t).map(label);
    let pack = [];
    return () => {
      if (!pack.length) {
        const fresh = shuffle(pool);
        pack = [...fresh.filter(x => avoid.includes(x)), ...fresh.filter(x => !avoid.includes(x))];
      }
      return pack.pop();
    };
  }
  function hand(t, next) {
    const out = [];
    for (let k = 0; out.length < per(t) && k < per(t) * 20; k++) { const x = next(); if (x && !out.includes(x)) out.push(x); }
    return out;
  }

  function students(t) {
    const dr = draft(t.key);
    if (dr.cls === '__names') return dr.names.split(/\n|,/).map(s => s.trim()).filter(Boolean);
    return classes?.find(c => c.id === dr.cls)?.students || [];
  }
  const className = t => classes?.find(c => c.id === draft(t.key).cls)?.name || '';

  /* ---------- print one list ---------- */

  function print(t, title, rows) {
    const n = Math.max(1, ...rows.map(r => r.items.length));
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
      <table><thead><tr><th>#</th><th>Student</th>${Array.from({ length: n }, (_, k) => `<th>${head(t, k, n)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}</td>${Array.from({ length: n }, (_, k) => `<td>${esc(r.items[k] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>
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
    return { t, page, list, rows, i: Number(el.closest('tr')?.dataset.i) };
  };
  const status = (page, text) => { const s = page.querySelector('.asg-status'); if (s) s.textContent = text; };
  // a change to the draft or to a saved list: draw only that table again
  function repaint(w) {
    const box = w.list ? w.page : w.page.querySelector('.asg-draft');
    const old = box.querySelector('.asg-table');
    if (old) old.outerHTML = table(w.t, w.rows, true);
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
        const next = dealer(t);
        dr.rows = names.map(name => ({ name, items: hand(t, next) }));
        saveDraft();
        rebuild();
        break;
      }
      case 'reroll':
        w.rows[w.i].items = hand(t, dealer(t, w.rows.flatMap((r, j) => (j === w.i ? [] : r.items))));
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
          rows: dr.rows.map(r => ({ name: r.name, items: r.items.filter(Boolean) })),
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
        print(t, w.list ? w.list.title : `${t.title}${className(t) ? ' · ' + className(t) : ''} · ${dateOf(new Date())}`, w.rows);
        break;
      case 'list-del':
        if (!confirm(`Delete "${w.list.title}" (${dateOf(w.list.date)})?`)) return;
        d.lists = d.lists.filter(l => l !== w.list);
        save();
        rebuild();
        break;
      case 'item-del': {
        const x = b.dataset.w;
        if ((d.added || []).some(it => word(it) === x)) d.added = d.added.filter(it => word(it) !== x);
        else (d.removed ||= []).push(x);
        save();
        rebuild();
        break;
      }
      case 'item-restore': d.removed = []; save(); rebuild(); break;
    }
  });

  main.addEventListener('submit', e => {
    const form = e.target.closest('.asg-add');
    if (!form) return;
    e.preventDefault();
    const { t } = where(form);
    const d = topicData(t.key);
    const x = form.w.value.trim();
    if (!x) return;
    if (items(t).some(it => word(it).toLowerCase() === x.toLowerCase())) { form.w.select(); return; }
    // something from the code that was removed comes back; anything else is added
    if ((d.removed || []).includes(x)) d.removed = d.removed.filter(r => r !== x);
    else (d.added ||= []).push(form.e.value.trim() ? [form.e.value.trim(), x] : x);
    save();
    rebuild(`[data-id="asg-${t.key}"] .asg-add [name="w"]`);
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
      topicData(w.t.key).per = Math.max(1, Number(el.value) || 1);
      save();
    } else if (el.classList.contains('asg-list-title')) rebuild(); // the name of the page in the contents
  });

  build();

  // assign.js (Classroom Manager)
  return {
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
