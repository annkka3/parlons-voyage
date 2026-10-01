'use strict';
/* ---------- overlay plumbing ---------- */
function renderOverlay() {
  let ov = $('#ov');
  if (!SES && !GAME) { if (ov) ov.remove(); document.body.style.overflow = ''; return; }
  if (!ov) { ov = el('div', { id: 'ov', class: 'overlay' }); document.body.append(ov); }
  document.body.style.overflow = 'hidden';
  ov.replaceChildren(SES ? sessionView() : GAME.view());
  const v = ov.querySelector('.verdict');
  if (v) v.scrollIntoView({ block: 'center' });
  else if (ov.dataset.k !== (SES ? 's' + SES.i : 'g')) ov.scrollTop = 0;
  ov.dataset.k = SES ? 's' + SES.i : 'g';
}
function frame(o) {
  return el('div', { class: 'wrap' },
    el('div', { class: 's-top' }, el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn icon-btn', 'aria-label': tt('Close', 'Закрыть'), onclick: o.onClose || closeAll }, icon('close')),
      el('div', { class: 'meter', role: 'progressbar' }, el('i', { style: { width: Math.round((o.progress || 0) * 100) + '%' } })),
      el('span', { class: 'muted small num', style: { minWidth: '44px', textAlign: 'right' } }, o.counter || ''))),
    el('div', { class: 's-body' }, o.body),
    o.foot ? el('div', { class: 'sticky-bottom' }, o.foot) : null);
}
function closeAll() { if (GAME && GAME.dispose) GAME.dispose(); SES = null; GAME = null; try { window.speechSynthesis.cancel(); } catch (e) { /* no speech */ } renderOverlay(); render(); }

/* ---------- building sessions ---------- */
function addNew(steps, fresh) {
  fresh.forEach((it, i) => {
    steps.push({ t: 'intro', id: it.id });
    if (i >= 2) steps.push({ t: 'test', id: fresh[i - 2].id, srs: true, isNew: true });
  });
  for (let j = Math.max(0, fresh.length - 2); j < fresh.length; j++) steps.push({ t: 'test', id: fresh[j].id, srs: true, isNew: true });
}
function startSession(steps, opts) {
  if (!steps.length) { toast(tt('Nothing to practise right now.', 'Сейчас нечего повторять.')); return; }
  SES = { steps, i: 0, opts: opts || {}, stats: { n: 0, g3: 0, g2: 0, g1: 0, g0: 0, hints: 0 }, retries: {}, missed: [], Q: null, done: false };
  enterStep();
}
function startDaily() {
  const steps = [];
  dueItems().sort((a, b) => (S.cards[b.id].h - S.cards[a.id].h) || (S.cards[a.id].due < S.cards[b.id].due ? -1 : 1))
    .slice(0, 30).forEach(it => steps.push({ t: 'test', id: it.id, srs: true }));
  addNew(steps, newPhrases().slice(0, Math.min(newQuotaLeft(), newPhrases().length)));
  addNew(steps, newWords().slice(0, Math.min(newWordQuotaLeft(), newWords().length)));
  startSession(steps, { kind: 'daily' });
}
function startMore(kind) {
  const steps = [];
  addNew(steps, kind === 'ph' ? newPhrases().slice(0, 5) : newWords().slice(0, 10));
  startSession(steps, { kind: 'more' });
}
function startLearn(d) {
  const items = PH.filter(p => p.d === d), steps = [];
  items.filter(p => S.cards[p.id]).forEach(p => steps.push({ t: 'test', id: p.id, srs: isDue(S.cards[p.id]) }));
  addNew(steps, items.filter(p => !S.cards[p.id]));
  startSession(steps, { kind: 'day', day: d });
}
function startTopic(tp) {
  const items = WORDS.filter(w => w.tp === tp), steps = [];
  shuffle(items.filter(w => S.cards[w.id])).slice(0, 15).forEach(w => steps.push({ t: 'test', id: w.id, srs: isDue(S.cards[w.id]) }));
  addNew(steps, items.filter(w => !S.cards[w.id]).slice(0, 10));
  startSession(steps, { kind: 'topic' });
}
function startHard() {
  startSession(shuffle(hardItems()).slice(0, 40).map(it => ({ t: 'test', id: it.id, srs: true })), { kind: 'hard' });
}
function startWords(kind) {
  const pool = kind === 'nm' ? NUM : VOC;
  const steps = [];
  pool.filter(w => isDue(S.cards[w.id])).slice(0, 20).forEach(w => steps.push({ t: 'test', id: w.id, srs: true }));
  const seq = wordSequence(S.cfg.order).filter(w => w.kind === kind && !S.cards[w.id]);
  addNew(steps, seq.slice(0, 8));
  startSession(steps, { kind: 'words' });
}
function enterStep() {
  const st = SES.steps[SES.i];
  if (!st) { SES.done = true; SES.Q = null; renderOverlay(); return; }
  if (st.t === 'intro') { SES.Q = null; renderOverlay(); sayIt(IT[st.id]); return; }
  SES.Q = makeQ(st);
  renderOverlay();
  if (SES.Q.mode === 'hear') sayIt(SES.Q.it);
  else focusAnswer();
}
function nextStep() { SES.i++; enterStep(); }
function focusAnswer() { setTimeout(() => { const a = $('#ans'); if (a) a.focus(); }, 30); }

/* ---------- one question ---------- */
function distractors(it, n) {
  let pool = ITEMS.filter(x => x.kind === it.kind && x.id !== it.id && mean(x) !== mean(it));
  if (it.kind === 'ph') pool = shuffle(pool.filter(x => x.d === it.d)).concat(shuffle(pool.filter(x => x.d !== it.d)));
  else if (it.kind === 'nm') pool = shuffle(pool.sort((a, b) => Math.abs(a.n - it.n) - Math.abs(b.n - it.n)).slice(0, 8));
  else pool = shuffle(pool.filter(x => x.tp === it.tp)).concat(shuffle(pool.filter(x => x.tp !== it.tp)));
  return pool.slice(0, n);
}
function makeQ(st) {
  const it = IT[st.id], r = S.cards[it.id];
  let mode;
  if (st.mode) mode = st.mode;
  else if (it.kind === 'ph') mode = it.k === 'h' ? 'hear' : (!st.isNew && !st.retry && r && r.b >= 2 && Math.random() < 0.3 ? 'hear' : 'say');
  else if (it.kind === 'nm') mode = Math.random() < 0.5 ? 'hear' : 'say';
  else mode = (!st.isNew && !st.retry && r && r.b >= 2 && Math.random() < 0.3) ? 'hear' : 'say';
  const Q = {
    it, mode, ans: mode === 'hear' ? 'choice' : (S.cfg.ans === 'type' ? 'type' : 'speak'), hints: 0, tries: 0, typed: '', status: 'ask', grade: null,
    opts: [], wrong: new Set(), removed: new Set(), noSvp: false, msg: '', retry: !!st.retry, isNew: !!st.isNew, srs: !!st.srs && !st.retry, rec: null,
  };
  if (mode === 'hear') Q.opts = shuffle([it].concat(distractors(it, 3)));
  return Q;
}
function hintList(Q) {
  const it = Q.it, L = [];
  const sceneH = { id: 'scene', lab: tt('Picture the scene', 'Представь сцену'), node: () => el('div', { class: 'stack', style: { gap: '2px', alignItems: 'center' } }, el('div', { class: 'scene' }, it.sc), placeOf(it) ? el('div', { class: 'small' }, placeOf(it)) : null) };
  const hasScene = it.kind !== 'nm' && !!it.sc && !it.hideScene;
  if (Q.mode === 'say') {
    L.push({ id: 'mask', lab: it.kind === 'ph' ? tt('Shape of the words', 'Форма слов') : tt('Letters', 'Буквы'), node: () => el('div', { class: 'mask' }, maskNodes(it.fr, 'blank')) });
    L.push({ id: 'init', lab: tt('First letters', 'Первые буквы'), node: () => el('div', null, el('div', { class: 'mask' }, maskNodes(it.fr, 'init')), it.g ? el('div', { class: 'small' }, genderLabel(it.g)) : null) });
    if (hasScene) L.push(sceneH);
    if (it.kind === 'wd' && exampleFor(it)) L.push({ id: 'ex', lab: tt('In a phrase', 'Во фразе'), node: () => el('div', { class: 'mask', style: { fontSize: '21px' } }, exampleFor(it)) });
    else if (it.kind !== 'nm') L.push({ id: 'alt', lab: S.cfg.lang === 'ru' ? 'In English' : 'По-русски', node: () => el('div', { style: { fontSize: '19px', fontWeight: 600 } }, meanAlt(it)) });
    L.push({ id: 'audio', lab: tt('Listen', 'Послушай'), on: () => sayIt(it), node: () => el('div', { class: 'stack', style: { gap: '4px' } }, el('div', { class: 'row' }, audioBtn(it), audioBtn(it, true)), el('div', { class: 'cy' }, it.cy)) });
  } else {
    L.push({ id: 'slow', lab: tt('Slower', 'Медленнее'), on: () => sayIt(it, true), node: () => el('div', { class: 'small' }, tt('Played slowly. Listen for the key words.', 'Проиграно медленно. Лови ключевые слова.')) });
    L.push({ id: 'text', lab: tt('The words', 'Слова'), node: () => el('div', { class: 'plate sm' }, it.fr) });
    if (hasScene) L.push(sceneH);
    L.push({
      id: 'half', lab: '50 / 50', node: () => el('div', { class: 'small' }, tt('Two wrong answers removed.', 'Два неверных варианта убраны.')),
      on: () => { const w = Q.opts.filter(o => o.id !== it.id && !Q.wrong.has(o.id)); shuffle(w).slice(0, Math.max(0, Math.min(2, w.length - 1))).forEach(o => Q.removed.add(o.id)); },
    });
  }
  return L;
}
function useHint() {
  const Q = SES.Q, L = hintList(Q);
  if (Q.status !== 'ask' || Q.hints >= L.length) return;
  const h = L[Q.hints]; Q.hints++;
  if (h.on) h.on();
  renderOverlay();
}
const capByHints = h => (h === 0 ? 3 : h <= 2 ? 2 : 1);
function finishQ(grade) {
  const Q = SES.Q, it = Q.it;
  Q.status = 'done'; Q.grade = grade;
  SES.stats.n++; SES.stats['g' + grade]++; SES.stats.hints += Q.hints;
  if (Q.srs) Q.rec = applyGrade(it.id, grade);
  logAnswer(grade, Q.hints);
  persist();
  if (grade <= 1) {
    if (!SES.missed.includes(it.id)) SES.missed.push(it.id);
    if (!SES.opts.noRetry && (SES.retries[it.id] || 0) < 2) {
      SES.retries[it.id] = (SES.retries[it.id] || 0) + 1;
      SES.steps.splice(Math.min(SES.i + 5, SES.steps.length), 0, { t: 'test', id: it.id, retry: true });
    }
  }
}
function revealQ() {
  const Q = SES.Q;
  if (Q.status !== 'ask') return;
  if (Q.ans === 'speak') { Q.status = 'revealed'; renderOverlay(); sayIt(Q.it); }
  else { finishQ(0); renderOverlay(); sayIt(Q.it); }
}
function rateQ(sel) {
  const Q = SES.Q;
  const g = Math.min(sel, capByHints(Q.hints));
  finishQ(g);
  const msg = verdictFor(Q);
  toast(msg.sub || msg.head);
  nextStep();
}
function checkTyped() {
  const Q = SES.Q, a = $('#ans');
  if (!a || !a.value.trim() || Q.status !== 'ask') return;
  Q.typed = a.value;
  const m = matchAnswer(Q.it, a.value, S.cfg.accent);
  if (m.ok) {
    Q.noSvp = !!m.noSvp;
    finishQ(Q.tries === 0 && Q.hints === 0 ? 3 : (Q.hints >= 3 || Q.tries >= 3) ? 1 : 2);
    renderOverlay(); sayIt(Q.it);
  } else {
    Q.tries++;
    Q.msg = tt(`${m.hit} of ${m.total} words are right. Try again or take a hint.`, `Верно слов: ${m.hit} из ${m.total}. Попробуй ещё или возьми подсказку.`);
    renderOverlay(); focusAnswer();
  }
}
// Optional voice check: works where the browser offers speech recognition (Safari and Chrome tabs, not the iPhone home-screen app).
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
function micAvailable() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  return !!SpeechRec && !(ios && standalone);
}
function listenQ() {
  const Q = SES.Q;
  if (!SpeechRec || Q.listening || Q.status !== 'ask') return;
  let rec;
  try { rec = new SpeechRec(); } catch (e) { return; }
  rec.lang = 'fr-FR'; rec.interimResults = false; rec.maxAlternatives = 5; rec.continuous = false;
  Q.listening = true; Q.msg = ''; renderOverlay();
  rec.onresult = ev => {
    const alts = Array.from(ev.results[0] || []).map(a => a.transcript);
    Q.listening = false;
    if (alts.some(t => matchAnswer(Q.it, t, true).ok)) {
      finishQ(Q.tries === 0 && Q.hints === 0 ? 3 : (Q.hints >= 3 || Q.tries >= 3) ? 1 : 2);
      renderOverlay(); sayIt(Q.it);
    } else {
      Q.tries++;
      Q.msg = tt(`I heard: “${alts[0] || ''}”. Try again, or tap “Show answer”.`, `Я услышала: «${alts[0] || ''}». Попробуй ещё или нажми «Показать ответ».`);
      renderOverlay();
    }
  };
  rec.onerror = ev => {
    Q.listening = false;
    Q.msg = ev.error === 'not-allowed' || ev.error === 'service-not-allowed' ? tt('Microphone access was refused. Allow it in the browser settings.', 'Доступ к микрофону запрещён. Разреши его в настройках браузера.')
      : ev.error === 'no-speech' ? tt('I heard nothing. Try again.', 'Ничего не услышала. Попробуй ещё раз.')
        : tt('Voice check failed: ', 'Проверка голосом не сработала: ') + ev.error;
    renderOverlay();
  };
  rec.onend = () => { if (Q.listening) { Q.listening = false; renderOverlay(); } };
  try { rec.start(); } catch (e) { Q.listening = false; renderOverlay(); }
}
function pickOpt(o) {
  const Q = SES.Q;
  if (Q.status !== 'ask' || Q.wrong.has(o.id) || Q.removed.has(o.id)) return;
  if (o.id === Q.it.id) { finishQ(Q.tries === 0 && Q.hints === 0 ? 3 : (Q.hints >= 3 || Q.tries >= 2) ? 1 : 2); sayIt(Q.it); }
  else { Q.tries++; Q.wrong.add(o.id); if (Q.tries >= 2) { finishQ(0); sayIt(Q.it); } }
  renderOverlay();
}
function verdictFor(Q) {
  const g = Q.grade, r = Q.rec;
  const head = g === 3 ? tt('Right!', 'Верно!') : g === 2 ? tt('Right, with help', 'Верно, с помощью') : g === 1 ? tt('Needed a lot of help', 'Понадобилось много подсказок') : tt('Not this time', 'В этот раз не вышло');
  let sub = '';
  if (Q.srs && r) sub = r.h ? tt('Moved to the difficult pool. It comes back in a few cards.', 'Перенесено в трудный пул. Скоро вернётся.') : tt(`Review ${whenLabel(r.due)}`, `Повторим: ${whenLabel(r.due)}`);
  else if (g <= 1) sub = tt('It comes back in a few cards.', 'Вернётся через несколько карточек.');
  else if (Q.retry) sub = tt('Good. That one sticks better now.', 'Хорошо, теперь лучше запомнится.');
  if (Q.noSvp) sub = tt('Perfect. Add “s’il vous plaît” to sound polite. ', 'Верно. Добавь «s’il vous plaît» для вежливости. ') + sub;
  return { head, sub };
}

/* ---------- views ---------- */
function detailBlock(it, o) {
  return el('div', { class: 'stack' },
    el('div', { class: 'plate' + (it.kind === 'nm' ? ' num-plate' : '') }, it.fr),
    el('div', { class: 'row' }, audioBtn(it), audioBtn(it, true), el('div', { class: 'grow stack', style: { gap: '2px' } }, trLines(it))),
    el('div', { class: 'stack', style: { gap: '2px' } }, el('div', { class: 'h2' }, mean(it)), it.kind !== 'nm' ? el('div', { class: 'muted' }, meanAlt(it)) : null),
    it.ne ? el('p', { class: 'note' }, noteOf(it)) : null,
    o && o.scene && it.kind !== 'nm' ? el('div', { class: 'scene' }, it.sc) : null);
}
function sessionView() {
  const total = SES.steps.length;
  if (SES.done) return summaryView();
  const st = SES.steps[SES.i];
  const common = { progress: SES.i / total, counter: `${SES.i + 1}/${total}` };
  if (st.t === 'intro') return frame(Object.assign({}, common, {
    body: [
      el('div', { class: 'row between' }, el('span', { class: 'chip hint' }, tt('New', 'Новое')), IT[st.id].k === 'h' ? el('span', { class: 'chip' }, tt('You will hear this one', 'Эту фразу нужно понимать на слух')) : el('span', { class: 'chip' }, tt('You will say this one', 'Эту фразу нужно говорить'))),
      detailBlock(IT[st.id], { scene: true }),
      el('p', { class: 'muted small' }, tt('Say it aloud twice, then continue. You will be asked for it in a moment.', 'Скажи вслух два раза и продолжай. Скоро тебя о ней спросят.')),
    ],
    foot: btn(tt('Continue', 'Дальше'), 'primary big block', nextStep),
  }));
  return questionView(common);
}
function questionView(common) {
  const Q = SES.Q, it = Q.it, L = hintList(Q), body = [];
  const done = Q.status === 'done';
  body.push(el('div', { class: 'row between' },
    el('div', { class: 'row', style: { gap: '6px' } },
      el('span', { class: 'chip accent' }, Q.mode === 'say' ? tt('Say it', 'Скажи') : tt('Understand', 'Пойми')),
      Q.isNew ? el('span', { class: 'chip hint' }, tt('First check', 'Первая проверка')) : null,
      Q.retry ? el('span', { class: 'chip bad' }, tt('Again', 'Ещё раз')) : null,
      statusChipSmall(it)),
    Q.mode === 'say' && Q.status === 'ask' ? btn(Q.ans === 'type' ? tt('Say aloud instead', 'Говорить вслух') : tt('Type instead', 'Ввести'), 'small ghost', () => { Q.ans = Q.ans === 'type' ? 'speak' : 'type'; renderOverlay(); if (Q.ans === 'type') focusAnswer(); }) : null));

  if (Q.mode === 'say') {
    body.push(it.kind === 'nm'
      ? el('div', { class: 'stack' }, el('div', { class: 'plate num-plate' }, String(it.n)), el('div', { class: 'muted' }, tt('Say this number in French.', 'Скажи это число по-французски.')))
      : el('div', { class: 'stack', style: { gap: '4px' } }, el('div', { class: 'prompt' }, mean(it)),
        el('div', { class: 'muted' }, Q.ans === 'type' ? tt('Type it in French.', 'Напиши это по-французски.')
          : micAvailable() ? tt('Say it out loud in French. Tap the microphone to be checked, or “Show answer” to compare yourself.', 'Скажи вслух по-французски. Нажми микрофон, чтобы приложение проверило, или «Показать ответ», чтобы сравнить самой.')
            : tt('Say it out loud in French, then tap “Show answer” and compare with what you said.', 'Скажи вслух по-французски, затем нажми «Показать ответ» и сравни со своим вариантом.'))));
  } else {
    body.push(el('div', { class: 'listen' },
      el('button', { type: 'button', class: 'btn primary', onclick: () => sayIt(it) }, icon('vol'), tt('Play', 'Слушать')),
      el('button', { type: 'button', class: 'btn', onclick: () => sayIt(it, true) }, icon('vol'), tt('Slow', 'Медленно'))));
    body.push(el('div', { class: 'muted' }, it.kind === 'nm' ? tt('Which number is it?', 'Какое это число?') : tt('What does it mean?', 'Что это значит?')));
  }

  // hints that were opened
  L.slice(0, Q.hints).forEach(h => body.push(el('div', { class: 'hintbox' }, el('div', { class: 'lab' }, h.lab), h.node())));

  if (Q.mode === 'hear') {
    body.push(el('div', { class: 'stack' }, Q.opts.map(o => {
      const gone = Q.removed.has(o.id) && !done;
      if (gone) return null;
      const cls = done ? (o.id === it.id ? 'right' : Q.wrong.has(o.id) ? 'wrong' : '') : Q.wrong.has(o.id) ? 'wrong' : '';
      return el('button', { type: 'button', class: 'opt ' + cls, disabled: done || Q.wrong.has(o.id) ? true : null, onclick: () => pickOpt(o) }, it.kind === 'nm' ? String(o.n) : mean(o));
    })));
  } else if (Q.ans === 'type' && !done) {
    body.push(el('div', { class: 'stack' },
      el('input', { id: 'ans', class: 'field', type: 'text', value: Q.typed, autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', lang: 'fr', 'aria-label': tt('Your answer in French', 'Твой ответ по-французски'),
        onkeydown: e => { if (e.key === 'Enter') checkTyped(); }, oninput: e => { Q.typed = e.target.value; } }),
      el('div', { class: 'accents' }, ['é', 'è', 'ê', 'à', 'â', 'ç', 'ô', 'î', 'û', 'ù', 'œ', '’'].map(ch => el('button', { type: 'button', 'aria-label': ch, onclick: () => insertChar(ch) }, ch))),
      Q.msg ? el('div', { class: 'chip bad', style: { alignSelf: 'flex-start', whiteSpace: 'normal' } }, Q.msg) : null));
  }

  if (Q.ans === 'speak' && Q.mode === 'say' && Q.status === 'ask') {
    if (Q.listening) body.push(el('div', { class: 'chip accent', style: { alignSelf: 'flex-start' } }, tt('Listening… say it now', 'Слушаю… говори')));
    else if (Q.msg) body.push(el('div', { class: 'chip bad', style: { alignSelf: 'flex-start', whiteSpace: 'normal' } }, Q.msg));
  }

  // after the answer
  if (done) {
    const v = verdictFor(Q);
    body.push(el('div', { class: 'verdict g' + Q.grade }, el('span', null, v.head), v.sub ? el('span', { class: 'sub' }, v.sub) : null));
    body.push(detailBlock(it, { scene: true }));
    if (Q.mode === 'hear' && it.kind === 'ph') body.push(el('p', { class: 'muted small' }, tt('Now say it back aloud once.', 'Теперь повтори вслух один раз.')));
  } else if (Q.status === 'revealed') {
    body.push(detailBlock(it, { scene: false }));
    if (Q.hints) body.push(el('p', { class: 'muted small' }, tt(`Hints used: ${Q.hints}. Your best rating is capped accordingly.`, `Взято подсказок: ${Q.hints}. Лучшая оценка соответственно ограничена.`)));
  }

  // footer
  let foot;
  if (done) foot = btn(SES.i + 1 < SES.steps.length ? tt('Next', 'Дальше') : tt('Finish', 'Завершить'), 'primary big block', nextStep);
  else if (Q.status === 'revealed') foot = el('div', { class: 'rate' },
    el('button', { type: 'button', class: 'btn', onclick: () => rateQ(0) }, el('b', null, tt('Missed', 'Не вспомнила')), el('span', { class: 'small muted' }, tt('Difficult pool', 'В трудный пул'))),
    el('button', { type: 'button', class: 'btn', onclick: () => rateQ(2) }, el('b', null, tt('With effort', 'С трудом')), el('span', { class: 'small muted' }, tt('Soon again', 'Скоро снова'))),
    el('button', { type: 'button', class: 'btn primary', onclick: () => rateQ(3) }, el('b', null, tt('Nailed it', 'Легко')), el('span', { class: 'small' }, tt('Later', 'Позже'))));
  else {
    const left = L.length - Q.hints;
    const act = [];
    act.push(el('button', { type: 'button', class: 'btn', disabled: left <= 0 ? true : null, onclick: useHint }, icon('bulb'), tt('Hint', 'Подсказка') + (left > 0 ? ` · ${left}` : '')));
    if (Q.ans === 'type' && Q.mode === 'say') act.push(el('button', { type: 'button', class: 'btn primary', onclick: checkTyped }, tt('Check', 'Проверить')));
    else if (Q.mode === 'say') act.push(el('button', { type: 'button', class: 'btn primary', onclick: revealQ }, tt('Show answer', 'Показать ответ')));
    else act.push(el('button', { type: 'button', class: 'btn', onclick: revealQ }, tt('I don’t know', 'Не знаю')));
    const micRow = Q.ans === 'speak' && Q.mode === 'say' && micAvailable() ? el('button', { type: 'button', class: 'btn big', disabled: Q.listening ? true : null, onclick: listenQ }, icon('mic'), tt('Check my voice', 'Проверить голосом')) : null;
    foot = el('div', { class: 'stack' }, micRow, el('div', { class: 'grid2' }, act),
      Q.ans === 'type' && Q.mode === 'say' && Q.tries ? el('button', { type: 'button', class: 'btn ghost small', onclick: revealQ }, tt('Show answer', 'Показать ответ')) : null);
  }
  return frame(Object.assign({}, common, { body, foot }));
}
function statusChipSmall(it) {
  const r = S.cards[it.id];
  return r && r.h === 1 ? el('span', { class: 'chip bad' }, tt('Difficult', 'Трудная')) : null;
}
function insertChar(ch) {
  const a = $('#ans'); if (!a) return;
  const s = a.selectionStart == null ? a.value.length : a.selectionStart, e = a.selectionEnd == null ? s : a.selectionEnd;
  a.value = a.value.slice(0, s) + ch + a.value.slice(e);
  a.focus(); a.setSelectionRange(s + 1, s + 1);
  if (SES && SES.Q) SES.Q.typed = a.value;
}
function summaryView() {
  const s = SES.stats, missed = SES.missed.map(id => IT[id]);
  const pct = s.n ? Math.round(s.g3 / s.n * 100) : 0;
  const hardNow = hardItems().length;
  return frame({
    progress: 1, counter: '',
    body: [
      el('div', { class: 'stack', style: { gap: '4px' } }, el('div', { class: 'eyebrow' }, tt('Session complete', 'Тренировка завершена')),
        el('h1', { class: 'h1' }, pct >= 80 ? tt('Très bien !', 'Très bien !') : tt('Bien joué !', 'Bien joué !'))),
      el('section', { class: 'card stack', style: { gap: 0 } },
        el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Answers', 'Ответов')), el('b', { class: 'num' }, s.n)),
        el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Right without hints', 'Верно без подсказок')), el('b', { class: 'num' }, `${s.g3} (${pct}%)`)),
        el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Right with help', 'Верно с помощью')), el('b', { class: 'num' }, s.g2)),
        el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Went to the difficult pool', 'Ушло в трудный пул')), el('b', { class: 'num' }, s.g1 + s.g0)),
        el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Hints used', 'Взято подсказок')), el('b', { class: 'num' }, s.hints))),
      missed.length ? el('section', { class: 'card stack' }, el('h2', { class: 'h2' }, tt('Say these once more', 'Скажи ещё раз вслух')),
        el('div', { class: 'stack', style: { gap: 0 } }, missed.map(it => el('button', { type: 'button', class: 'phrase-row', onclick: () => sayIt(it) },
          el('span', { class: 'grow cell stack', style: { gap: '2px' } }, el('span', { class: 'fr' }, it.fr), el('span', { class: 'muted small' }, mean(it))), audioBtn(it))))) : null,
      el('p', { class: 'muted' }, tt('Right answers wait in “Review later”. Missed ones are in the difficult pool and come back more often.', 'Правильные ответы ждут в «Повторить позже». Ошибки лежат в трудном пуле и возвращаются чаще.')),
    ],
    foot: el('div', { class: 'stack' }, btn(tt('Back to Today', 'На главную'), 'primary big block', () => { closeAll(); go('today'); }),
      hardNow && SES.opts.kind !== 'hard' ? btn(tt(`Practise difficult pool (${hardNow})`, `Трудный пул (${hardNow})`), 'block', () => { SES = null; startHard(); }) : null),
  });
}
