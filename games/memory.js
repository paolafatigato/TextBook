// games/memory.html: choose a topic (memory.html#jobs), then find the pairs, alone or in turns with a friend.
// TOPICS is written in the page: { id, title, text, pairs: [[card, card]], show: how many pairs in one game }
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const shuffle = list => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const bestKey = id => `memory-best-${id}`;
  const readBest = id => { try { return Number(localStorage.getItem(bestKey(id))) || 0; } catch { return 0; } };
  const writeBest = (id, n) => { try { localStorage.setItem(bestKey(id), n); } catch { /* not saved: fine */ } };

  let topic = null, players = 1, open = [], found = 0, moves = 0, turn = 0, score = [0, 0], total = 0, timer = 0;

  function status(end) {
    if (players === 2) {
      const winner = score[0] === score[1] ? 'A draw!' : `Player ${score[0] > score[1] ? 1 : 2} wins!`;
      $('status').textContent = `${end ? `🎉 ${winner}` : `Player ${turn + 1}, your turn`} · Player 1: ${score[0]} · Player 2: ${score[1]}`;
    } else {
      const best = readBest(topic.id);
      $('status').textContent = end ? `🎉 All the pairs in ${moves} moves!${best ? ` Your best: ${best}.` : ''}`
        : `Moves: ${moves} · Pairs: ${found} / ${total}${best ? ` · Your best: ${best}` : ''}`;
    }
  }

  function deal() {
    clearTimeout(timer);
    const pairs = shuffle(topic.pairs).slice(0, topic.show || topic.pairs.length);
    total = pairs.length;
    open = []; found = 0; moves = 0; turn = 0; score = [0, 0];
    const cards = shuffle(pairs.flatMap((pair, k) => pair.map((text, side) => ({ k, text, side }))));
    $('cards').replaceChildren(...cards.map((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      // a card with only a picture (an emoji) is written big
      b.className = `card${c.side ? ' second' : ''}${/[a-z]/i.test(c.text) ? '' : ' picture'}`;
      b.setAttribute('aria-label', `Card ${i + 1}`);
      b.innerHTML = '<span class="back" aria-hidden="true">?</span><span class="front"></span>';
      b.addEventListener('click', () => flip(b, c, i));
      return b;
    }));
    status();
  }

  function flip(button, card, index) {
    if (open.length === 2 || button.classList.contains('up')) return;
    button.classList.add('up');
    button.querySelector('.front').textContent = card.text;
    button.setAttribute('aria-label', card.text);
    open.push({ button, card, index });
    if (open.length < 2) return;
    moves++;
    const [a, b] = open;
    if (a.card.k === b.card.k) {
      open.forEach(o => o.button.classList.add('done'));
      open = [];
      found++;
      score[turn]++;
      const end = found === total;
      if (end && players === 1 && (!readBest(topic.id) || moves < readBest(topic.id))) writeBest(topic.id, moves);
      status(end);
      return;
    }
    status();
    timer = setTimeout(() => {
      open.forEach(o => {
        o.button.classList.remove('up');
        o.button.querySelector('.front').textContent = ''; // a hidden card keeps no answer on the page
        o.button.setAttribute('aria-label', `Card ${o.index + 1}`);
      });
      open = [];
      if (players === 2) turn = 1 - turn;
      status();
    }, 1200);
  }

  function route() {
    topic = TOPICS.find(t => `#${t.id}` === location.hash) || null;
    $('choose').hidden = !!topic;
    $('play').hidden = $('change').hidden = !topic;
    clearTimeout(timer);
    if (!topic) return;
    $('title').textContent = `${topic.icon} ${topic.title}`;
    $('how').textContent = `Turn two cards. ${topic.text}`;
    deal();
    window.scrollTo(0, 0);
  }

  const buttons = document.querySelectorAll('[data-players]');
  const paintPlayers = () => buttons.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.players === players)));
  buttons.forEach(b => b.addEventListener('click', () => { players = +b.dataset.players; paintPlayers(); deal(); }));
  $('again').addEventListener('click', deal);
  window.addEventListener('hashchange', route);
  paintPlayers();
  route();
})();
