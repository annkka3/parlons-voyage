'use strict';
/* Grammar screens: the lesson list, one lesson (theory + examples) and the exercise runner. */
UI.lesson = null;
const lessonTitle = l => tt(l.en, l.ru);
function lessonBest(l) { const g = S.gram[l.id]; return g ? g : null; }

function screenGrammar() {
  if (UI.lesson) return screenLesson(UI.lesson);
  const done = LESSONS.filter(l => S.gram[l.id]).length;
  return [
    el('div', { class: 'row between' }, el('h1', { class: 'h1' }, tt('Learn', 'Курс')),
      seg([['days', tt('Phrases', 'Фразы')], ['grammar', tt('Grammar', 'Грамматика')]], UI.ctab, v => { UI.ctab = v; UI.lesson = null; render(); })),
    el('p', { class: 'muted' }, tt(`Basic grammar for travel, built on the phrases you learn. ${done} of ${LESSONS.length} lessons practised.`, `Базовая грамматика для путешествий на материале твоих фраз. Пройдено уроков: ${done} из ${LESSONS.length}.`)),
    el('div', { class: 'stack' }, LESSONS.map((l, i) => {
      const b = lessonBest(l);
      return el('button', { type: 'button', class: 'day', onclick: () => { UI.lesson = l.id; render(); window.scrollTo(0, 0); } },
        el('span', { class: 'bullet ' + (b && b.s >= b.n - 1 ? 'done' : '') }, b && b.s >= b.n - 1 ? '✓' : String(i + 1)),
        el('span', { class: 'grow cell' }, el('div', { class: 't' }, lessonTitle(l)),
          el('div', { class: 'muted small' }, b ? tt(`Best score ${b.s}/${b.n}`, `Лучший результат ${b.s}/${b.n}`) : tt('Not practised yet', 'Ещё не пройден'))),
        el('span', { style: { fontSize: '26px' } }, l.e));
    })),
  ];
}
function screenLesson(id) {
  const l = LESSONS.find(x => x.id === id), b = lessonBest(l);
  const out = [
    el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn icon-btn', 'aria-label': 'Back', onclick: () => { UI.lesson = null; render(); } }, icon('back')),
      el('div', { class: 'grow' }, el('div', { class: 'eyebrow' }, tt('Grammar', 'Грамматика')), el('h1', { class: 'h2' }, lessonTitle(l)))),
    el('section', { class: 'card stack' },
      l.sum.map(p => el('p', { class: 'lesson-p' }, tt(p.en, p.ru))),
      l.table ? el('div', { class: 'tablewrap' }, el('table', { class: 'gtable' },
        el('thead', null, el('tr', null, l.table.head.map(h => el('th', null, h)))),
        el('tbody', null, l.table.rows.map(r => el('tr', null, r.map((c, i) => el(i === 0 ? 'th' : 'td', null, c))))))) : null),
    el('section', { class: 'card stack' }, el('div', { class: 'eyebrow' }, tt('Examples', 'Примеры')),
      el('div', { class: 'stack', style: { gap: 0 } }, l.ex.map(([fr, en, ru]) => el('div', { class: 'list-row' },
        el('div', { class: 'grow cell' }, el('div', { class: 'frl', style: { fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: '20px' } }, fr), el('div', { class: 'muted small' }, tt(en, ru))),
        audioBtn({ fr }))))),
    el('section', { class: 'card flat stack' }, el('div', { class: 'eyebrow' }, tt('Watch out', 'Осторожно')), el('p', { class: 'lesson-p' }, tt(l.mist.en, l.mist.ru))),
    btn(tt(`Practise (${l.quiz.length} exercises)`, `Упражнения (${l.quiz.length})`), 'primary big block', () => startLesson(l.id)),
    b ? el('p', { class: 'muted small' }, tt(`Best score: ${b.s}/${b.n}`, `Лучший результат: ${b.s}/${b.n}`)) : null,
  ];
  return out;
}

/* ---------- exercises ---------- */
function fillSentence(q, ans) {
  const a = ans.replace(/\s*\(.*?\)\s*$/, '');
  const base = q.replace(/\s*\(.*?\)\s*$/, '');
  return a.endsWith('’') ? base.replace('___ ', a) : base.replace('___', a);
}
function prepQ(q) {
  if (q.t === 'mc') return { q, opts: shuffle(q.o.map((text, i) => ({ text, right: i === q.a }))), picked: null };
  if (q.t === 'build') return { q, tiles: shuffle(tokenize(q.a).map((w, id) => ({ w, id }))), line: [], msg: '' };
  return { q, typed: '', msg: '' };
}
function startLesson(id, only) {
  const l = LESSONS.find(x => x.id === id);
  const qs = (only || l.quiz).map(prepQ);
  const g = { l, qs, i: 0, ok: 0, missed: [], status: 'ask', first: true, retry: !!only };
  GAME = { g, view: () => lessonView(g) };
  renderOverlay();
}
function lessonAnswered(g, right) {
  const c = g.qs[g.i];
  g.status = 'done'; g.right = right;
  if (right && g.first) g.ok++;
  if (!right) g.missed.push(c.q);
  logAnswer(right && g.first ? 3 : 0, 0); persist();
  const ans = c.q.t === 'mc' ? c.q.o[c.q.a] : c.q.t === 'fill' ? c.q.a[0] : null;
  speak(ans ? fillSentence(c.q.q, ans) : c.q.a);
}
function lessonView(g) {
  if (g.i >= g.qs.length) return lessonSummary(g);
  const c = g.qs[g.i], q = c.q, done = g.status === 'done', body = [];
  body.push(el('div', { class: 'row between' }, el('span', { class: 'chip accent' }, tt('Grammar', 'Грамматика') + ' · ' + lessonTitle(g.l)), g.retry ? el('span', { class: 'chip bad' }, tt('Again', 'Ещё раз')) : null));
  if (q.t === 'build') {
    body.push(el('div', { class: 'prompt' }, tt(q.en, q.ru)), el('div', { class: 'muted' }, tt('Tap the words in order.', 'Нажимай слова по порядку.')));
    body.push(el('div', { class: 'answerline' }, c.line.map(t => el('button', { type: 'button', class: 'tilew', disabled: done ? true : null, onclick: () => { c.line = c.line.filter(x => x !== t); c.msg = ''; renderOverlay(); } }, t.w))));
    body.push(el('div', { class: 'tiles' }, c.tiles.map(t => el('button', { type: 'button', class: 'tilew', disabled: c.line.includes(t) || done ? true : null, onclick: () => { c.line.push(t); c.msg = ''; renderOverlay(); } }, t.w))));
    if (c.msg && !done) body.push(el('div', { class: 'chip bad', style: { alignSelf: 'flex-start', whiteSpace: 'normal' } }, c.msg));
  } else {
    const parts = q.q.split('___');
    const shown = done ? (q.t === 'mc' ? q.o[q.a] : q.a[0]) : '';
    body.push(el('div', { class: 'sentence' }, parts[0], el('span', { class: 'gap' + (done ? ' ok' : '') }, shown || '     '), parts[1] || ''));
    if (q.t === 'mc') {
      body.push(el('div', { class: 'stack' }, c.opts.map(o => el('button', {
        type: 'button', class: 'opt' + (done ? (o.right ? ' right' : c.picked === o ? ' wrong' : '') : ''), disabled: done ? true : null,
        onclick: () => { c.picked = o; lessonAnswered(g, o.right); renderOverlay(); },
      }, o.text))));
    } else {
      if (!done) body.push(el('div', { class: 'stack' },
        el('input', { id: 'ans', class: 'field', type: 'text', value: c.typed, autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', lang: 'fr', 'aria-label': tt('Fill the gap', 'Заполни пропуск'),
          onkeydown: e => { if (e.key === 'Enter') lessonCheck(g); }, oninput: e => { c.typed = e.target.value; } }),
        el('div', { class: 'accents' }, ['é', 'è', 'ê', 'à', 'â', 'ç', 'ô', 'î', 'û', 'ù', 'œ', '’'].map(ch => el('button', { type: 'button', 'aria-label': ch, onclick: () => { const a = $('#ans'); if (!a) return; const s0 = a.selectionStart == null ? a.value.length : a.selectionStart; a.value = a.value.slice(0, s0) + ch + a.value.slice(a.selectionEnd == null ? s0 : a.selectionEnd); a.focus(); a.setSelectionRange(s0 + 1, s0 + 1); c.typed = a.value; } }, ch))),
        c.msg ? el('div', { class: 'chip bad', style: { alignSelf: 'flex-start', whiteSpace: 'normal' } }, c.msg) : null));
    }
  }
  if (done) {
    body.push(el('div', { class: 'verdict g' + (g.right ? '3' : '0') }, el('span', null, g.right ? tt('Right!', 'Верно!') : tt('Not this time', 'В этот раз не вышло')),
      q.w ? el('span', { class: 'sub' }, tt(q.w.en, q.w.ru)) : null));
    const full = q.t === 'build' ? q.a : fillSentence(q.q, q.t === 'mc' ? q.o[q.a] : q.a[0]);
    body.push(el('div', { class: 'row' }, el('div', { class: 'plate sm grow' }, full), audioBtn({ fr: full })));
  }
  let foot;
  const last = g.i + 1 >= g.qs.length;
  if (done) foot = btn(last ? tt('Finish', 'Завершить') : tt('Next', 'Дальше'), 'primary big block', () => { g.i++; g.status = 'done'; g.status = 'ask'; g.first = true; renderOverlay(); if (g.qs[g.i] && g.qs[g.i].q.t === 'fill') focusAnswer(); });
  else if (q.t === 'fill') foot = el('div', { class: 'grid2' }, btn(tt('Show answer', 'Показать ответ'), '', () => { lessonAnswered(g, false); renderOverlay(); }), btn(tt('Check', 'Проверить'), 'primary', () => lessonCheck(g)));
  else if (q.t === 'build') foot = el('div', { class: 'grid2' }, btn(tt('Show answer', 'Показать ответ'), '', () => { c.line = c.tiles.slice().sort((a, b) => 0); g.status = 'done'; g.right = false; g.missed.push(q); logAnswer(0, 0); persist(); speak(q.a); renderOverlay(); }),
    btn(tt('Check', 'Проверить'), 'primary', () => {
      if (!c.line.length) return;
      if (c.line.map(t => t.w).join(' ') === tokenize(q.a).join(' ')) { lessonAnswered(g, true); }
      else { g.first = false; c.msg = tt('Not quite. Check the order and the small words.', 'Не совсем. Проверь порядок и короткие слова.'); }
      renderOverlay();
    }, c.line.length ? {} : { disabled: true }));
  else foot = null;
  return frame({ progress: g.i / g.qs.length, counter: `${g.i + 1}/${g.qs.length}`, body, foot });
}
function lessonCheck(g) {
  const c = g.qs[g.i], a = $('#ans');
  if (!a || !a.value.trim()) return;
  c.typed = a.value;
  const t = toks(a.value, S.cfg.accent);
  const ok = c.q.a.some(x => eqArr(t, toks(x, S.cfg.accent)));
  if (ok) { lessonAnswered(g, true); renderOverlay(); }
  else { g.first = false; c.msg = tt('Not quite. Try again or show the answer.', 'Не совсем. Попробуй ещё или покажи ответ.'); renderOverlay(); focusAnswer(); }
}
function lessonSummary(g) {
  const total = g.l.quiz.length;
  if (!g.retry) { markLesson(g.l.id, g.ok, total); persist(); }
  const missed = g.missed.filter((q, i, a) => a.indexOf(q) === i);
  return frame({
    progress: 1, counter: '',
    body: [
      el('div', { class: 'stack', style: { gap: '4px' } }, el('div', { class: 'eyebrow' }, lessonTitle(g.l)),
        el('div', { class: 'h1 num' }, g.retry ? tt('Practice done', 'Повторение завершено') : `${g.ok} / ${total}`),
        el('p', { class: 'muted' }, g.retry ? tt('Come back to the lesson text if something is still unclear.', 'Вернись к тексту урока, если что-то осталось непонятным.') : tt('Right on the first try.', 'Верно с первой попытки.'))),
    ],
    foot: el('div', { class: 'stack' },
      missed.length ? btn(tt(`Practise the ${missed.length} you missed`, `Повторить ошибки (${missed.length})`), 'primary big block', () => startLesson(g.l.id, missed)) : null,
      btn(tt('Back to the lesson', 'К уроку'), 'block', () => { closeAll(); UI.ctab = 'grammar'; UI.lesson = g.l.id; go('course'); UI.lesson = g.l.id; render(); }),
      btn(tt('All lessons', 'Все уроки'), 'block', () => { closeAll(); UI.ctab = 'grammar'; UI.lesson = null; go('course'); })),
  });
}
