'use strict';
/* Crossword built on the fly from the words you are learning. The clue is the meaning; type the French word
   (accents optional) for the clue you tap. */
function cwCandidates() {
  const ok = w => {
    if (w.fr.includes(' / ')) return false;
    const core = stripArt(w.fr);
    if (/\s/.test(core)) return false;
    const L = letters(core);
    if (L.length < 3 || L.length > 10) return false;
    const clue = (S.cfg.lang === 'ru' ? w.ru : w.en).toLowerCase();
    return !letters(clue).includes(L);
  };
  const all = WORDS.filter(w => w.kind === 'wd' && ok(w));
  const known = all.filter(w => S.cards[w.id]);
  if (known.length >= 10) return known;
  const fresh = wordSequence(S.cfg.order).filter(w => w.kind === 'wd' && !S.cards[w.id] && ok(w)).slice(0, 40);
  return known.concat(fresh);
}
function cwTry(order) {
  const cells = new Map(), placed = [];
  const key = (x, y) => x + ',' + y;
  const canPlace = (a, x, y, dir) => {
    const dx = dir === 'A' ? 1 : 0, dy = dir === 'D' ? 1 : 0;
    if (cells.has(key(x - dx, y - dy)) || cells.has(key(x + a.length * dx, y + a.length * dy))) return -1;
    let cross = 0;
    for (let k = 0; k < a.length; k++) {
      const cx = x + k * dx, cy = y + k * dy, c = cells.get(key(cx, cy));
      if (c) { if (c.ch !== a[k] || c.dirs.has(dir)) return -1; cross++; }
      else if (cells.has(key(cx + dy, cy + dx)) || cells.has(key(cx - dy, cy - dx))) return -1;
    }
    return cross;
  };
  const put = (it, x, y, dir) => {
    const dx = dir === 'A' ? 1 : 0, dy = dir === 'D' ? 1 : 0;
    for (let k = 0; k < it.a.length; k++) {
      const kk = key(x + k * dx, y + k * dy), c = cells.get(kk);
      if (c) c.dirs.add(dir); else cells.set(kk, { ch: it.a[k], dirs: new Set([dir]) });
    }
    placed.push({ w: it.w, a: it.a, x, y, dir });
  };
  put(order[0], 0, 0, 'A');
  for (let n = 1; n < order.length; n++) {
    const it = order[n]; let best = null, bestScore = 0;
    for (const p of placed) {
      for (let i = 0; i < p.a.length; i++) for (let j = 0; j < it.a.length; j++) {
        if (p.a[i] !== it.a[j]) continue;
        const dir = p.dir === 'A' ? 'D' : 'A';
        const x = p.dir === 'A' ? p.x + i : p.x - j, y = p.dir === 'A' ? p.y - j : p.y + i;
        const sc = canPlace(it.a, x, y, dir);
        if (sc >= 1 && sc + Math.random() > bestScore) { best = { x, y, dir }; bestScore = sc + Math.random(); }
      }
    }
    if (best) put(it, best.x, best.y, best.dir);
  }
  return placed;
}
function buildCrossword(words) {
  const items = words.map(w => ({ w, a: letters(stripArt(w.fr)) }));
  let best = null;
  for (let t = 0; t < 60; t++) {
    const order = items.slice().sort((x, y) => (y.a.length - x.a.length) + (t ? (Math.random() - 0.5) * 4 : 0));
    const placed = cwTry(order);
    const xs = placed.flatMap(p => [p.x, p.x + (p.dir === 'A' ? p.a.length - 1 : 0)]), ys = placed.flatMap(p => [p.y, p.y + (p.dir === 'D' ? p.a.length - 1 : 0)]);
    const area = (Math.max(...xs) - Math.min(...xs) + 1) * (Math.max(...ys) - Math.min(...ys) + 1);
    if (!best || placed.length > best.placed.length || (placed.length === best.placed.length && area < best.area)) best = { placed, area };
    if (best.placed.length >= items.length && t > 8) break;
  }
  const placed = best.placed;
  const minX = Math.min(...placed.map(p => p.x)), minY = Math.min(...placed.map(p => p.y));
  placed.forEach(p => { p.x -= minX; p.y -= minY; });
  const cols = Math.max(...placed.map(p => p.x + (p.dir === 'A' ? p.a.length : 1))), rows = Math.max(...placed.map(p => p.y + (p.dir === 'D' ? p.a.length : 1)));
  const starts = [...new Set(placed.map(p => p.y * 100 + p.x))].sort((a, b) => a - b);
  placed.forEach(p => { p.num = starts.indexOf(p.y * 100 + p.x) + 1; });
  placed.sort((a, b) => a.num - b.num || (a.dir < b.dir ? -1 : 1));
  return { placed, cols, rows };
}
function startCrossword() {
  const cand = cwCandidates();
  if (cand.length < 6) { toast(tt('Not enough words yet. Learn a few more first.', 'Пока мало слов. Сначала выучи ещё несколько.')); return; }
  let layout = null;
  for (let t = 0; t < 6 && (!layout || layout.placed.length < 6); t++) layout = buildCrossword(shuffle(cand).slice(0, 10));
  const g = { layout, solved: new Set(), rev: {}, active: 0, typed: '', msg: '', hints: 0 };
  GAME = { g, view: () => crosswordView(g) };
  renderOverlay();
}
function crosswordView(g) {
  const { placed, cols, rows } = g.layout;
  const owner = new Map(); // cell -> [{idx, k}]
  placed.forEach((p, idx) => {
    for (let k = 0; k < p.a.length; k++) {
      const x = p.x + (p.dir === 'A' ? k : 0), y = p.y + (p.dir === 'D' ? k : 0);
      const kk = x + ',' + y; if (!owner.has(kk)) owner.set(kk, []); owner.get(kk).push({ idx, k, ch: p.a[k] });
    }
  });
  const all = g.solved.size === placed.length;
  const act = placed[g.active];
  const cellsEls = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const o = owner.get(x + ',' + y);
    if (!o) { cellsEls.push(el('i', { class: 'cw-empty' })); continue; }
    const shown = o.some(r => g.solved.has(r.idx) || (g.rev[r.idx] || 0) > r.k);
    const num = placed.filter(p => p.x === x && p.y === y).map(p => p.num)[0];
    const isAct = act && o.some(r => r.idx === g.active);
    cellsEls.push(el('div', { class: 'cw-cell' + (isAct ? ' act' : '') + (o.some(r => g.solved.has(r.idx)) ? ' ok' : '') }, num ? el('span', { class: 'cw-n' }, String(num)) : null, shown ? o[0].ch : ''));
  }
  const body = [
    el('div', { class: 'row between' }, el('span', { class: 'chip accent' }, tt('Crossword', 'Кроссворд')), el('span', { class: 'muted small num' }, `${g.solved.size}/${placed.length}`)),
    el('div', { class: 'cw-wrap' }, el('div', { class: 'cw-grid', style: { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: (cols * 42) + 'px' } }, cellsEls)),
    el('div', { class: 'stack', style: { gap: 0 } }, placed.map((p, idx) => el('button', { type: 'button', class: 'phrase-row' + (idx === g.active && !all ? ' cw-active' : ''), onclick: () => { g.active = idx; g.typed = ''; g.msg = ''; renderOverlay(); focusAnswer(); } },
      el('span', { class: 'chip', style: { minWidth: '44px', justifyContent: 'center' } }, `${p.num}${p.dir === 'A' ? '→' : '↓'}`),
      el('span', { class: 'grow cell stack', style: { gap: '2px' } },
        el('span', { style: { fontWeight: 600 } }, S.cfg.lang === 'ru' ? p.w.ru : p.w.en),
        el('span', { class: 'muted small' }, g.solved.has(idx) ? `${p.w.fr}  ·  ${p.w.cy}` : tt(`${p.a.length} letters`, `${p.a.length} ${plural(p.a.length, 'буква', 'буквы', 'букв')}`))),
      g.solved.has(idx) ? el('span', { class: 'chip good' }, '✓') : null))),
  ];
  let foot = null;
  if (all) {
    body.push(el('div', { class: 'verdict g3' }, el('span', null, tt('Crossword complete!', 'Кроссворд решён!')), el('span', { class: 'sub' }, tt(`Hints used: ${g.hints}`, `Подсказок взято: ${g.hints}`))));
    foot = el('div', { class: 'stack' }, btn(tt('New crossword', 'Новый кроссворд'), 'primary big block', startCrossword), btn(tt('Close', 'Закрыть'), 'block', closeAll));
  } else {
    const check = () => {
      const a = $('#ans'); if (!a || !a.value.trim()) return;
      g.typed = a.value;
      if (letters(a.value) === act.a) { g.solved.add(g.active); logAnswer(3, 0); persist(); speak(act.w.fr); const nx = placed.findIndex((p, i) => !g.solved.has(i)); g.active = nx < 0 ? g.active : nx; g.typed = ''; g.msg = ''; }
      else g.msg = tt('Not quite. Check the letters or take a hint.', 'Не совсем. Проверь буквы или возьми подсказку.');
      renderOverlay(); focusAnswer();
    };
    foot = el('div', { class: 'stack' },
      el('div', { class: 'row' }, el('span', { class: 'chip accent' }, `${act.num}${act.dir === 'A' ? '→' : '↓'}`), el('span', { class: 'grow cell small' }, (S.cfg.lang === 'ru' ? act.w.ru : act.w.en) + ' · ' + act.a.length)),
      el('input', { id: 'ans', class: 'field', type: 'text', value: g.typed, autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', lang: 'fr', 'aria-label': tt('Your answer', 'Твой ответ'), onkeydown: e => { if (e.key === 'Enter') check(); }, oninput: e => { g.typed = e.target.value; } }),
      g.msg ? el('div', { class: 'chip bad', style: { alignSelf: 'flex-start', whiteSpace: 'normal' } }, g.msg) : null,
      el('div', { class: 'grid2' },
        el('button', { type: 'button', class: 'btn', onclick: () => { const r = g.rev[g.active] || 0; if (r < act.a.length - 1) { g.rev[g.active] = r + 1; g.hints++; } renderOverlay(); focusAnswer(); } }, icon('bulb'), tt('Hint', 'Подсказка')),
        btn(tt('Check', 'Проверить'), 'primary', check)));
  }
  if (!all) setTimeout(() => { const a = $('#ans'); if (a && document.activeElement !== a && !g.solved.has(g.active)) a.focus({ preventScroll: true }); }, 30);
  return frame({ progress: g.solved.size / placed.length, counter: '', body, foot });
}
