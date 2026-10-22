(() => {
  const q = new URLSearchParams(location.search); const a = +q.get('a'), b = +q.get('b');
  const all = [...document.querySelectorAll('.spread')].filter(s => /^wh-/.test(s.dataset.id));
  document.querySelectorAll('.spread').forEach(s => { s.style.display = 'none'; });
  document.querySelectorAll('.toolbar,.side,.toc,#home,nav').forEach(e => e.style.display = 'none');
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:6px;background:#888;position:absolute;top:0;left:0;width:1700px;z-index:9999';
  all.slice(a, b).forEach(s => { s.style.cssText = 'display:flex;width:830px;margin:0;--zoom:1'; wrap.append(s); const l = document.createElement('div'); l.textContent = s.dataset.id; l.style.cssText='position:absolute;color:#fff;font:12px monospace'; });
  document.body.append(wrap);
})();
