'use strict';
/* Games never touch the review schedule; they reuse the question view where possible. */
const known = filter => {
  const seen = PH.filter(p => S.cards[p.id] && filter(p));
  return seen.length >= 4 ? seen : PH.filter(p => filter(p) && p.d <= 3);
};

/* ---------- Listening drill (reuses the question view) ---------- */
function startListen() {
  const pool = known(() => true);
  const steps = shuffle(pool).slice(0, 10).map(p => ({ t: 'test', id: p.id, mode: 'hear', srs: false }));
  startSession(steps, { kind: 'listen', noRetry: true });
}

/* ---------- Build the phrase ---------- */
function tokenize(fr) {
  const out = [];
  fr.split(' ').forEach(w => {
    if (/^[!?;:]$/.test(w) && out.length) out[out.length - 1] += ' ' + w; else out.push(w);
  });
  return out;
}
function startBuild() {
  const g = { i: 0, ok: 0, items: shuffle(known(p => p.k === 's')).slice(0, 8), tiles: [], line: [], status: 'ask', msg: '', hint: false };
  buildRound(g);
  GAME = { g, view: () => buildView(g) };
  renderOverlay();
}
function buildRound(g) {
  const it = g.items[g.i], words = tokenize(it.fr);
  const lower = words.map(w => w.toLowerCase());
  const extra = shuffle(PH.filter(p => p.id !== it.id && p.d === it.d).flatMap(p => tokenize(p.fr)).filter(w => /\p{L}/u.test(w) && !lower.includes(w.toLowerCase()))).slice(0, 2);
  g.tiles = shuffle(words.concat(extra).map((w, id) => ({ w, id })));
  g.line = []; g.status = 'ask'; g.msg = ''; g.hint = false;
}
function buildView(g) {
  if (g.end) return endCard(tt('Phrases built', 'Фраз собрано'), `${g.ok} / ${g.items.length}`, tt('Right on the first check', 'Верно с первой проверки'), startBuild);
  const it = g.items[g.i], done = g.status === 'done';
  const target = tokenize(it.fr);
  const body = [
    el('div', { class: 'row' }, el('span', { class: 'chip accent' }, tt('Build the phrase', 'Собери фразу'))),
    el('div', { class: 'prompt' }, mean(it)),
    el('div', { class: 'answerline', 'aria-label': tt('Your phrase', 'Твоя фраза') }, g.line.map(t => el('button', {
      type: 'button', class: 'tilew', disabled: done ? true : null, onclick: () => { g.line = g.line.filter(x => x !== t); g.msg = ''; renderOverlay(); },
    }, t.w))),
    el('div', { class: 'tiles' }, g.tiles.map(t => el('button', {
      type: 'button', class: 'tilew', disabled: g.line.includes(t) || done ? true : null,
      onclick: () => { g.line.push(t); g.msg = ''; renderOverlay(); },
    }, t.w))),
    g.hint && !done ? el('div', { class: 'hintbox' }, el('div', { class: 'lab' }, tt('Starts with', 'Начинается так')), el('div', { class: 'mask' }, target.slice(0, 2).join(' ') + ' …')) : null,
    g.msg && !done ? el('div', { class: 'chip bad', style: { alignSelf: 'flex-start', whiteSpace: 'normal' } }, g.msg) : null,
  ];
  if (done) {
    body.push(el('div', { class: 'verdict g3' }, el('span', null, tt('Right!', 'Верно!'))));
    body.push(detailBlock(it, { scene: false }));
  }
  let foot;
  if (done) foot = btn(g.i + 1 < g.items.length ? tt('Next', 'Дальше') : tt('Finish', 'Завершить'), 'primary big block', () => {
    g.i++;
    if (g.i >= g.items.length) { g.end = true; renderOverlay(); return; }
    buildRound(g); renderOverlay();
  });
  else foot = el('div', { class: 'grid2' },
    el('button', { type: 'button', class: 'btn', onclick: () => { g.hint = true; renderOverlay(); } }, icon('bulb'), tt('Hint', 'Подсказка')),
    el('button', { type: 'button', class: 'btn primary', disabled: g.line.length ? null : true, onclick: () => {
      if (g.line.map(t => t.w).join(' ') === target.join(' ')) { g.status = 'done'; g.ok += g.msg === '' && !g.hint ? 1 : 0; celebrate(); sayIt(it); logAnswer(3, 0); persist(); }
      else g.msg = tt('Not quite. Check the order and the small words.', 'Не совсем. Проверь порядок и короткие слова.');
      renderOverlay();
    } }, tt('Check', 'Проверить')));
  return frame({ progress: g.i / g.items.length, counter: `${g.i + 1}/${g.items.length}`, body, foot });
}
function endCard(title, big, sub, again) {
  return frame({
    progress: 1, counter: '',
    body: [el('div', { class: 'summary-head' }, mascot('cheer', 92), el('div', { class: 'eyebrow' }, title), el('div', { class: 'h1 num' }, big), el('p', { class: 'muted' }, sub))],
    foot: el('div', { class: 'stack' }, btn(tt('Play again', 'Ещё раз'), 'primary big block', again), btn(tt('Close', 'Закрыть'), 'block', closeAll)),
  });
}

/* ---------- Pairs ---------- */
function startPairs() {
  const items = shuffle(known(p => p.fr.length <= 36)).slice(0, 6);
  const tiles = shuffle(items.flatMap(it => [{ it, type: 'fr' }, { it, type: 'mean' }]));
  const g = { items, tiles, up: [], matched: new Set(), moves: 0, lock: false };
  GAME = { g, view: () => pairsView(g) };
  renderOverlay();
}
function pairsView(g) {
  const all = g.matched.size === g.items.length;
  const tap = idx => {
    const t = g.tiles[idx];
    if (g.lock || g.matched.has(t.it.id) || g.up.includes(idx)) return;
    g.up.push(idx); g.flip = idx; g.pop = null;
    if (t.type === 'fr') sayIt(t.it);
    if (g.up.length === 2) {
      g.moves++;
      const [a, b] = g.up.map(i => g.tiles[i]);
      if (a.it.id === b.it.id && a.type !== b.type) { g.matched.add(a.it.id); g.up = []; g.pop = a.it.id; celebrate(); sayIt(a.it); }
      else { g.lock = true; setTimeout(() => { g.up = []; g.lock = false; renderOverlay(); }, 1100); }
    }
    renderOverlay();
  };
  const body = [
    el('div', { class: 'row between' }, el('span', { class: 'chip accent' }, tt('Pairs', 'Пары')), el('span', { class: 'muted small num' }, tt(`Moves: ${g.moves}`, `Ходов: ${g.moves}`))),
    el('p', { class: 'muted' }, tt('Match each French phrase with its meaning.', 'Найди для каждой французской фразы её смысл.')),
    el('div', { class: 'pairs' }, g.tiles.map((t, idx) => {
      const up = g.up.includes(idx), ok = g.matched.has(t.it.id);
      if (!up && !ok) return el('button', { type: 'button', class: 'pcard down', 'aria-label': tt('Hidden card', 'Закрытая карточка'), onclick: () => tap(idx) }, '?');
      return el('div', { class: 'pcard ' + (t.type === 'fr' ? 'fr ' : '') + (ok ? 'ok' : 'up') + (idx === g.flip && !ok ? ' flip' : '') + (ok && t.it.id === g.pop ? ' pop' : '') },
        t.type === 'fr' ? t.it.fr : el('span', null, el('span', { class: 'e' }, t.it.sc), mean(t.it)));
    })),
  ];
  if (all && !g.cel) { g.cel = true; setTimeout(() => celebrate(true), 300); }
  if (all) return endCard(tt('Pairs found', 'Пары найдены'), tt(`${g.moves} moves`, `${g.moves} ходов`), tt('Fewer moves is better. Try again with new phrases.', 'Чем меньше ходов, тем лучше. Попробуй с новыми фразами.'), startPairs);
  return frame({ progress: g.matched.size / g.items.length, counter: `${g.matched.size}/${g.items.length}`, body });
}

/* ---------- Numbers & prices ---------- */
function startNumbers() {
  const g = { stage: 'setup', range: '20', mode: 'hear', i: 0, n: 10, ok: 0, cur: null, status: 'ask', val: '', tries: 0 };
  GAME = { g, view: () => numbersView(g) };
  renderOverlay();
}
function nextNumber(g) {
  const r = g.range;
  if (r === 'price') {
    const p = Math.random() < 0.3 ? rnd(PRICES_FIXED) : [1 + Math.floor(Math.random() * 99), rnd([0, 0, 0, 10, 20, 30, 50, 50, 80, 90])];
    g.cur = { kind: 'price', e: p[0], c: p[1], fr: priceFr(p[0], p[1]), parts: priceParts(p[0], p[1]), digits: priceNum(p[0], p[1]) };
  } else {
    const max = r === '10' ? 10 : r === '20' ? 20 : 100;
    const n = Math.floor(Math.random() * (max + 1));
    g.cur = { kind: 'num', n, fr: frNum(n), digits: String(n) };
  }
  g.status = 'ask'; g.val = ''; g.tries = 0; g.shown = false;
}
function numbersView(g) {
  if (g.stage === 'setup') {
    return frame({
      progress: 0, counter: '',
      body: [
        el('h1', { class: 'h1' }, tt('Numbers & prices', 'Числа и цены')),
        el('div', { class: 'stack' }, el('div', { style: { fontWeight: 700 } }, tt('Range', 'Диапазон')),
          seg([['10', '0–10'], ['20', '0–20'], ['100', '0–100'], ['price', tt('Prices €', 'Цены €')]], g.range, v => { g.range = v; renderOverlay(); }, true)),
        el('div', { class: 'stack' }, el('div', { style: { fontWeight: 700 } }, tt('Mode', 'Режим')),
          seg([['hear', tt('Hear → type', 'Слышу → ввожу')], ['say', tt('See → say', 'Вижу → говорю')]], g.mode, v => { g.mode = v; renderOverlay(); }, true),
          el('p', { class: 'muted small' }, g.mode === 'hear' ? tt('You hear a number or price in French and type it with digits.', 'Слышишь число или цену по-французски и вводишь цифрами.') : tt('You see digits, say them in French, then check yourself.', 'Видишь цифры, говоришь по-французски, затем проверяешь себя.'))),
      ],
      foot: btn(tt('Start', 'Начать'), 'primary big block', () => { g.stage = 'play'; nextNumber(g); renderOverlay(); if (g.mode === 'hear') sayIt(g.cur); }),
    });
  }
  if (g.i >= g.n) return endCard(tt('Numbers', 'Числа'), `${g.ok} / ${g.n}`, tt('Right on the first try', 'Верно с первой попытки'), startNumbers);
  const c = g.cur, done = g.status === 'done';
  const body = [el('div', { class: 'row' }, el('span', { class: 'chip accent' }, g.mode === 'hear' ? tt('Understand', 'Пойми') : tt('Say it', 'Скажи')))];
  const finish = (good) => { g.status = 'done'; g.good = good; if (good && g.tries === 0) g.ok++; if (good) celebrate(); logAnswer(good ? 3 : 0, 0); persist(); renderOverlay(); sayIt(c); };
  const check = () => {
    const raw = ($('#numans') || {}).value || ''; g.val = raw; if (!raw.trim()) return;
    const v = Number(raw.replace(',', '.').replace(/[^\d.]/g, ''));
    const want = c.kind === 'price' ? c.e + c.c / 100 : c.n;
    if (Math.abs(v - want) < 0.001) finish(true); else { g.tries++; if (g.tries >= 2) finish(false); else renderOverlay(); }
  };
  if (g.mode === 'hear') {
    body.push(el('div', { class: 'listen' },
      el('button', { type: 'button', class: 'btn primary', onclick: () => sayIt(c) }, icon('vol'), tt('Play', 'Слушать')),
      el('button', { type: 'button', class: 'btn', onclick: () => sayIt(c, true) }, icon('vol'), tt('Slow', 'Медленно'))));
    body.push(el('div', { class: 'muted' }, c.kind === 'price' ? tt('Type the price in euros, for example 12,50', 'Введи цену в евро, например 12,50') : tt('Type the number.', 'Введи число.')));
    if (!done) {
      body.push(el('input', { id: 'numans', class: 'field', type: 'text', inputmode: 'decimal', autocomplete: 'off', value: g.val, 'aria-label': tt('Your answer', 'Твой ответ'), onkeydown: e => { if (e.key === 'Enter') check(); } }));
      if (g.tries) body.push(el('div', { class: 'chip bad', style: { alignSelf: 'flex-start' } }, tt('Not quite. Listen again, slowly.', 'Не совсем. Послушай ещё раз, медленно.')));
      if (g.shown) body.push(el('div', { class: 'hintbox' }, el('div', { class: 'lab' }, tt('The words', 'Слова')), el('div', { class: 'plate sm' }, c.fr)));
    }
  } else {
    body.push(el('div', { class: 'plate num-plate' }, c.digits));
    body.push(el('div', { class: 'muted' }, tt('Say it in French, then check.', 'Скажи по-французски, затем проверь.')));
  }
  if (done) {
    if (g.mode === 'hear') body.push(el('div', { class: 'verdict g' + (g.good ? '3' : '0') }, el('span', null, g.good ? tt('Right!', 'Верно!') : tt('Not this time', 'В этот раз не вышло'))));
    body.push(el('div', { class: 'stack' }, el('div', { class: 'plate' + (c.kind === 'num' ? ' num-plate' : '') }, c.fr),
      el('div', { class: 'row' }, el('b', { class: 'h2 num' }, c.digits), el('span', { class: 'grow' }), audioBtn(c), audioBtn(c, true))));
  }
  let foot;
  const nxt = () => { g.i++; if (g.i < g.n) { nextNumber(g); } renderOverlay(); if (g.i < g.n && g.mode === 'hear') sayIt(g.cur); };
  if (done) foot = btn(g.i + 1 < g.n ? tt('Next', 'Дальше') : tt('Finish', 'Завершить'), 'primary big block', nxt);
  else if (g.mode === 'hear') foot = el('div', { class: 'grid2' },
    el('button', { type: 'button', class: 'btn', onclick: () => { g.shown = true; g.tries = Math.max(g.tries, 1); renderOverlay(); } }, icon('bulb'), tt('Show words', 'Показать слова')),
    el('button', { type: 'button', class: 'btn primary', onclick: check }, tt('Check', 'Проверить')));
  else foot = btn(tt('Show answer', 'Показать ответ'), 'primary big block', () => { g.status = 'done'; g.good = null; renderOverlay(); sayIt(c); });
  if (done && g.mode === 'say') {
    foot = el('div', { class: 'rate', style: { gridTemplateColumns: '1fr 1fr' } },
      el('button', { type: 'button', class: 'btn', onclick: () => { logAnswer(0, 0); persist(); nxt(); } }, tt('Missed', 'Не вспомнила')),
      el('button', { type: 'button', class: 'btn primary', onclick: () => { g.ok++; logAnswer(3, 0); persist(); nxt(); } }, tt('Got it', 'Сказала верно')));
  }
  if (!done) setTimeout(() => { const a = $('#numans'); if (a && document.activeElement !== a) a.focus(); }, 30);
  return frame({ progress: g.i / g.n, counter: `${Math.min(g.i + 1, g.n)}/${g.n}`, body, foot });
}

/* ---------- Dialogues ---------- */
function startDialogueMenu() {
  GAME = {
    view: () => frame({
      progress: 0, counter: '',
      body: [el('h1', { class: 'h1' }, tt('Dialogues', 'Диалоги')),
        el('p', { class: 'muted' }, tt('You play the traveller. The other person’s lines are spoken aloud; every run changes the details, so you cannot memorise one script.', 'Ты играешь путешественницу. Реплики собеседника озвучиваются, а детали каждый раз меняются, поэтому один сценарий не выучить наизусть.')),
        el('div', { class: 'stack' }, SCEN.map(s => btn(`${s.e}  ${tt(s.en, s.ru)}`, 'big block', () => startDialogue(s.id))))],
    }),
  };
  renderOverlay();
}
function startDialogue(id) {
  const sc = SCEN.find(s => s.id === id);
  const g = { sc, steps: sc.build(), i: 0, rev: {}, hide: true, end: false };
  GAME = { g, view: () => dialogueView(g) };
  renderOverlay();
  if (g.steps[0].w === 'them') speak(g.steps[0].fr);
}
function dialogueView(g) {
  const cur = g.steps[g.i];
  if (g.end) {
    return frame({
      progress: 1, counter: '',
      body: [el('div', { class: 'stack' }, el('div', { class: 'eyebrow' }, tt(g.sc.en, g.sc.ru)), el('h1', { class: 'h1' }, tt('Dialogue finished', 'Диалог завершён')),
        el('p', { class: 'muted' }, tt('Run it again: the details will be different.', 'Сыграй ещё раз: детали будут другими.')))],
      foot: el('div', { class: 'stack' }, btn(tt('Again with new details', 'Ещё раз с новыми деталями'), 'primary big block', () => startDialogue(g.sc.id)), btn(tt('All dialogues', 'Все диалоги'), 'block', startDialogueMenu), btn(tt('Close', 'Закрыть'), 'block', closeAll)),
    });
  }
  const bubble = (s, j) => {
    const it = { fr: s.fr }, revealed = !!g.rev[j] || j < g.i;
    if (s.w === 'them') {
      const blur = g.hide && !revealed;
      return el('div', { class: 'bubble them' + (blur ? ' blur' : '') },
        el('div', { class: 'who' }, tt('Them', 'Собеседник')),
        el('div', { class: 'row' }, audioBtn(it), audioBtn(it, true),
          el('div', { class: 'grow cell' }, el('div', { class: 'frl' }, s.fr))),
        revealed ? el('div', { class: 'muted small' }, tt(s.en, s.ru)) : null,
        blur ? el('button', { type: 'button', class: 'btn small', onclick: () => { g.rev[j] = true; renderOverlay(); } }, tt('Show text', 'Показать текст')) : null);
    }
    return el('div', { class: 'bubble me' },
      el('div', { class: 'who' }, tt('You', 'Ты')),
      revealed ? el('div', { class: 'row' }, audioBtn(it), el('div', { class: 'grow cell' }, el('div', { class: 'frl' }, s.fr), el('div', { class: 'muted small' }, tt(s.en, s.ru))))
        : el('div', { class: 'stack', style: { gap: '4px' } }, el('div', { style: { fontWeight: 700, fontSize: '19px' } }, tt(s.en, s.ru)), el('div', { class: 'muted small' }, tt('Say it in French.', 'Скажи это по-французски.')),
          g.rev['h' + j] ? el('div', { class: 'mask', style: { color: 'var(--ink)' } }, s.fr.split(' ').slice(0, 2).join(' ') + ' …') : null));
  };
  const body = [
    el('div', { class: 'row between' }, el('span', { class: 'chip accent' }, `${g.sc.e} ${tt(g.sc.en, g.sc.ru)}`),
      seg([[true, tt('Text hidden', 'Текст скрыт')], [false, tt('Text shown', 'Текст виден')]], g.hide, v => { g.hide = v; renderOverlay(); })),
    el('div', { class: 'chat' }, g.steps.slice(0, g.i + 1).map(bubble)),
  ];
  const last = g.i + 1 >= g.steps.length;
  const adv = () => { if (last) g.end = true; else { g.i++; } renderOverlay(); if (!g.end && g.steps[g.i].w === 'them') speak(g.steps[g.i].fr); };
  let foot;
  if (cur.w === 'them') foot = el('div', { class: 'grid2' }, btn(tt('Play again', 'Ещё раз'), '', () => speak(cur.fr)), btn(last ? tt('Finish', 'Завершить') : tt('I understood', 'Поняла'), 'primary', adv));
  else if (!g.rev[g.i]) foot = el('div', { class: 'grid2' },
    btn(tt('Hint', 'Подсказка'), '', () => { g.rev['h' + g.i] = true; renderOverlay(); }),
    btn(tt('Show answer', 'Показать ответ'), 'primary', () => { g.rev[g.i] = true; renderOverlay(); speak(cur.fr); }));
  else foot = btn(last ? tt('Finish', 'Завершить') : tt('Next', 'Дальше'), 'primary big block', adv);
  setTimeout(() => { const ov = $('#ov'); if (ov) ov.scrollTop = ov.scrollHeight; }, 20);
  return frame({ progress: g.i / g.steps.length, counter: `${g.i + 1}/${g.steps.length}`, body, foot });
}
