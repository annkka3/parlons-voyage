'use strict';
/* ---------- icons ---------- */
const IC = {
  today: [['rect', { x: 4, y: 5, width: 16, height: 15, rx: 3 }], ['path', { d: 'M4 10h16M8 3v4M16 3v4M9 15l2 2 4-4' }]],
  course: [['path', { d: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14' }]],
  play: [['rect', { x: 3, y: 3, width: 18, height: 18, rx: 4 }], ['circle', { cx: 8.5, cy: 8.5, r: 1.2 }], ['circle', { cx: 15.5, cy: 15.5, r: 1.2 }], ['circle', { cx: 12, cy: 12, r: 1.2 }]],
  words: [['path', { d: 'M4 7V5h16v2M12 5v14M9 19h6' }]],
  me: [['path', { d: 'M5 20V11M12 20V4M19 20v-6' }]],
  vol: [['path', { d: 'M4 9v6h4l5 4V5L8 9z' }], ['path', { d: 'M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12' }]],
  close: [['path', { d: 'M6 6l12 12M18 6L6 18' }]],
  bulb: [['path', { d: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z' }]],
  back: [['path', { d: 'M15 5l-7 7 7 7' }]],
  search: [['circle', { cx: 11, cy: 11, r: 6 }], ['path', { d: 'M20 20l-4-4' }]],
};
function icon(name) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  (IC[name] || []).forEach(([tag, attrs]) => {
    const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    s.append(n);
  });
  return s;
}

/* ---------- shared bits ---------- */
const UI = { tab: 'today', ctab: 'days', day: null, topic: null, wtab: 'words', confirmReset: false, q: '', auth: { email: '', pw: '', msg: '', busy: false } };
let SES = null, GAME = null;
const STATUS_LABEL = { new: ['New', 'Новая'], learning: ['Learning', 'Учу'], review: ['Reviewing', 'Повторяю'], strong: ['Mastered', 'Выучено'] };
const stLabel = s => tt(STATUS_LABEL[s][0], STATUS_LABEL[s][1]);
function btn(label, cls, onclick, extra) { return el('button', Object.assign({ type: 'button', class: 'btn ' + (cls || ''), onclick }, extra || {}), label); }
function audioBtn(it, slow) {
  return el('button', {
    type: 'button', class: 'btn icon-btn', 'aria-label': slow ? tt('Play slowly', 'Медленно') : tt('Play', 'Озвучить'),
    onclick: e => { e.stopPropagation(); sayIt(it, slow); },
  }, icon('vol'), slow ? el('span', { class: 'small' }, '½') : null);
}
function seg(options, value, onpick, wide) {
  return el('div', { class: 'seg' + (wide ? ' wide' : ''), role: 'group' },
    options.map(([v, label]) => el('button', { type: 'button', 'aria-pressed': String(v === value), onclick: () => onpick(v) }, label)));
}
function statusChip(id) {
  const r = S.cards[id], s = statusOf(id);
  if (r && r.h === 1) return el('span', { class: 'chip bad' }, tt('Difficult', 'Трудная'));
  return el('span', { class: 'chip ' + (s === 'strong' ? 'good' : s === 'new' ? '' : s === 'learning' ? 'hint' : 'accent') }, stLabel(s));
}
function syncLabel() {
  if (!Cloud.configured) return tt('Saved on this device only', 'Сохранено только на этом устройстве');
  if (!Cloud.user) return tt('Not signed in: progress stays on this device', 'Вход не выполнен: прогресс только на этом устройстве');
  const m = {
    syncing: tt('Syncing…', 'Синхронизация…'),
    synced: tt('Synced', 'Синхронизировано'),
    offline: tt('Offline: will sync when you are back online', 'Нет сети: синхронизируется, когда появится'),
    error: tt('Sync problem: progress is safe on this device', 'Ошибка синхронизации: прогресс сохранён на устройстве'),
    denied: tt('Access denied by the database rules', 'База отклонила доступ (проверь правила Firestore)'),
  };
  return m[Cloud.status] || '';
}
function refreshBadge() {
  const s = Cloud.user ? Cloud.status : 'local';
  document.querySelectorAll('.sync').forEach(b => { b.dataset.s = s; b.title = syncLabel(); b.setAttribute('aria-label', syncLabel()); });
  const l = $('#synclabel'); if (l) l.textContent = syncLabel();
}
let remoteTm;
function onRemoteChange() {
  clearTimeout(remoteTm);
  remoteTm = setTimeout(() => { if (!SES && !GAME && !(document.activeElement && document.activeElement.tagName === 'INPUT')) render(); }, 400);
}

/* ---------- shell ---------- */
function render() {
  const app = $('#app');
  const nav = [['today', tt('Today', 'Сегодня')], ['course', tt('Learn', 'Курс')], ['play', tt('Play', 'Игры')], ['words', tt('Words', 'Слова')], ['me', tt('Me', 'Я')]];
  const screens = { today: screenToday, course: screenCourse, play: screenPlay, words: screenWords, me: screenMe };
  app.replaceChildren(
    el('header', { class: 'top' }, el('div', { class: 'wrap' },
      el('div', { class: 'brand' }, el('span', { class: 'mark' }, 'FR'), el('span', null, 'Parlons Voyage')),
      el('div', { class: 'tools' },
        el('span', { class: 'sync', 'data-s': Cloud.user ? Cloud.status : 'local', title: syncLabel() }),
        seg([['en', 'EN'], ['ru', 'RU']], S.cfg.lang, v => { setCfg({ lang: v }); render(); }))),
    ),
    el('main', { class: 'wrap main' }, screens[UI.tab]()),
    el('nav', { class: 'nav', 'aria-label': 'Main' }, el('div', { class: 'wrap' }, nav.map(([id, label]) =>
      el('button', { type: 'button', 'aria-current': UI.tab === id ? 'page' : null, onclick: () => go(id) }, icon(id), label)))),
  );
  renderOverlay();
}
function go(tab) { UI.tab = tab; UI.day = null; UI.topic = null; render(); window.scrollTo(0, 0); }

/* ---------- sheet: one card in detail ---------- */
function openSheet(it) {
  closeSheet();
  const r = S.cards[it.id];
  const close = () => closeSheet();
  const node = el('div', { class: 'sheet-back', id: 'sheet', onclick: e => { if (e.target.classList.contains('sheet-back')) close(); } },
    el('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' },
      el('div', { class: 'row between' },
        el('div', { class: 'row wrapr' }, statusChip(it.id), it.d ? el('span', { class: 'chip' }, tt('Day ', 'День ') + it.d) : it.tp ? el('span', { class: 'chip' }, TOPIC[it.tp].e + ' ' + topicName(it.tp)) : null),
        el('button', { type: 'button', class: 'btn icon-btn', 'aria-label': 'Close', onclick: close }, icon('close'))),
      el('div', { class: 'plate' + (it.kind === 'nm' ? ' num-plate' : '') }, it.fr),
      el('div', { class: 'row' }, audioBtn(it, false), audioBtn(it, true), el('div', { class: 'grow stack', style: { gap: '2px' } }, trLines(it))),
      it.sc && it.kind !== 'nm' ? el('div', { class: 'scene' }, it.sc) : null,
      el('div', { class: 'stack', style: { gap: '4px' } },
        el('div', { class: 'h2' }, it.kind === 'nm' ? it.n0 || String(it.n) : mean(it)), it.kind === 'nm' ? el('div', { class: 'muted' }, mean({ ru: it.ru0, en: it.en0 })) : el('div', { class: 'muted' }, meanAlt(it))),
      it.ne ? el('p', { class: 'note' }, noteOf(it)) : null,
      it.g ? el('p', { class: 'note' }, genderLabel(it.g)) : null,
      el('div', { class: 'kv small' }, el('span', { class: 'muted' }, tt('Next review', 'Следующее повторение')), el('span', null, r && r.b >= 1 ? whenLabel(r.due) : '—')),
    ));
  document.body.append(node);
  sayIt(it);
}
function closeSheet() { const s = $('#sheet'); if (s) s.remove(); }
const genderLabel = g => ({ m: tt('masculine', 'мужской род'), f: tt('feminine', 'женский род'), pl: tt('plural', 'мн. число') }[g] || '');

/* ---------- TODAY ---------- */
function plan() {
  const due = dueItems();
  return {
    due: Math.min(due.length, 30), dueAll: due.length,
    fp: Math.min(newQuotaLeft(), newPhrases().length), fw: Math.min(newWordQuotaLeft(), newWords().length),
  };
}
function plural(n, a, b, c) { const m = n % 100, k = n % 10; return m > 10 && m < 20 ? c : k === 1 ? a : k >= 2 && k <= 4 ? b : c; }
function screenToday() {
  const p = plan(), st = streak(), hard = hardItems().length;
  const total = p.due + p.fp + p.fw;
  const nextNew = newPhrases()[0];
  const parts = [];
  parts.push(el('div', { class: 'row between' },
    el('div', { class: 'stack', style: { gap: '2px' } },
      el('div', { class: 'h1' }, 'Bonjour !'),
      el('div', { class: 'muted' }, new Date().toLocaleDateString(S.cfg.lang === 'ru' ? 'ru-RU' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }))),
    el('span', { class: 'chip ' + (st ? 'good' : '') }, st ? tt(`${st}-day streak`, `Серия: ${st} дн.`) : tt('No streak yet', 'Серии пока нет'))));

  if (Cloud.configured && !Cloud.user) {
    parts.push(el('section', { class: 'card flat row between' },
      el('div', { class: 'grow cell' }, el('div', { style: { fontWeight: 700 } }, tt('Sync between iPhone and Mac', 'Синхронизация iPhone и Mac')),
        el('div', { class: 'muted small' }, tt('Sign in once on each device to keep one progress.', 'Войди один раз на каждом устройстве, и прогресс будет общим.'))),
      btn(tt('Sign in', 'Войти'), 'small primary', () => { UI.focusAccount = true; go('me'); })));
  }

  const sc = el('section', { class: 'card stack' });
  if (total > 0) {
    sc.append(el('div', { class: 'eyebrow' }, tt('Today’s session', 'Сегодняшняя тренировка')),
      el('div', { class: 'h1 num' }, tt(`${total} ${total === 1 ? 'card' : 'cards'}`, `${total} ${plural(total, 'карточка', 'карточки', 'карточек')}`)),
      el('div', { class: 'row wrapr' },
        p.due ? el('span', { class: 'chip accent' }, tt(`${p.due} to review`, `${p.due} повторить`)) : null,
        p.fp ? el('span', { class: 'chip hint' }, tt(`${p.fp} new phrases`, `${p.fp} новых фраз`) + (nextNew ? ' · ' + tt('Day ', 'День ') + nextNew.d : '')) : null,
        p.fw ? el('span', { class: 'chip hint' }, tt(`${p.fw} new words`, `${p.fw} новых слов`)) : null),
      p.dueAll > p.due ? el('p', { class: 'muted small' }, tt(`${p.dueAll - p.due} more are waiting; they come in the next session.`, `Ещё ${p.dueAll - p.due} ждут: они войдут в следующую тренировку.`)) : null,
      btn(tt('Start session', 'Начать'), 'primary big block', () => startDaily()));
  } else {
    const nextDue = Object.values(S.cards).filter(r => r.b >= 1).map(r => r.due).sort()[0];
    sc.append(el('div', { class: 'eyebrow' }, tt('Today’s session', 'Сегодняшняя тренировка')),
      el('div', { class: 'h1' }, newPhrases().length || newWords().length || nextDue ? tt('All done for today', 'На сегодня всё') : tt('Everything learned', 'Всё пройдено')),
      nextDue ? el('p', { class: 'muted' }, tt('Next review: ', 'Следующее повторение: ') + whenLabel(nextDue)) : null,
      el('div', { class: 'grid2' },
        newPhrases().length ? btn(tt('5 more phrases', 'Ещё 5 фраз'), 'primary', () => startMore('ph')) : null,
        newWords().length ? btn(tt('10 more words', 'Ещё 10 слов'), 'primary', () => startMore('wd')) : null));
  }
  parts.push(sc);

  // pools
  const c = { new: 0, learning: 0, review: 0, strong: 0 };
  ITEMS.forEach(x => c[statusOf(x.id)]++);
  const later = Object.entries(S.cards).filter(([, r]) => r.b >= 1 && r.h !== 1 && r.due > today());
  const byDate = {};
  later.forEach(([, r]) => { byDate[r.due] = (byDate[r.due] || 0) + 1; });
  const dates = Object.keys(byDate).sort().slice(0, 3);
  parts.push(el('section', { class: 'card stack' },
    el('div', { class: 'row between' }, el('h2', { class: 'h2' }, tt('Your pools', 'Твои пулы')), el('span', { class: 'muted small num' }, tt(`${PH.length} phrases · ${WORDS.length} words`, `${PH.length} фраз · ${WORDS.length} слов`))),
    el('div', { class: 'bar', role: 'img', 'aria-label': 'progress' }, ['strong', 'review', 'learning', 'new'].map(k => el('i', { class: 'seg-' + k, style: { width: (c[k] / ITEMS.length * 100) + '%' } }))),
    el('div', { class: 'legend' }, ['strong', 'review', 'learning', 'new'].map(k => el('span', null, el('i', { class: 'seg-' + k }), stLabel(k) + ' ' + c[k]))),
    el('div', { class: 'stack', style: { gap: '0' } },
      el('div', { class: 'list-row' },
        el('div', { class: 'grow' }, el('div', { style: { fontWeight: 700 } }, tt('Review later', 'Повторить позже') + ' · ' + later.length),
          el('div', { class: 'muted small' }, dates.length ? dates.map(d => `${whenLabel(d)}: ${byDate[d]}`).join(' · ') : tt('Right answers wait here until they are due again', 'Сюда уходят правильные ответы до следующего повторения')))),
      el('div', { class: 'list-row' },
        el('div', { class: 'grow' }, el('div', { style: { fontWeight: 700 } }, tt('Difficult pool', 'Трудный пул') + ' · ' + hard),
          el('div', { class: 'muted small' }, hard ? tt('Shown more often until you get them right twice in a row', 'Показываются чаще, пока не ответишь верно два раза подряд') : tt('Missed cards land here', 'Сюда попадают ошибки'))),
        hard ? btn(tt('Practice', 'Тренировать'), 'small', startHard) : null))));

  parts.push(el('section', { class: 'stack' },
    el('div', { class: 'eyebrow' }, tt('Quick practice', 'Быстрая практика')),
    el('div', { class: 'grid2' },
      btn(tt('Listening drill', 'Слушаем и понимаем'), '', () => startListen()),
      btn(tt('Numbers & prices', 'Числа и цены'), '', () => startNumbers()),
      btn(tt('Dialogues', 'Диалоги'), '', () => startDialogueMenu()),
      btn(tt('Wordle', 'Wordle'), '', () => startWordle()))));
  return parts;
}

/* ---------- COURSE (phrases + grammar) ---------- */
function dayInfo(d) {
  const items = PH.filter(p => p.d === d);
  const seen = items.filter(p => S.cards[p.id]).length;
  const learned = items.filter(p => ['review', 'strong'].includes(statusOf(p.id))).length;
  return { items, seen, learned };
}
function screenCourse() {
  if (UI.ctab === 'grammar') return screenGrammar();
  if (UI.day) return screenDay(UI.day);
  const nowDay = DAYS.find(x => !x.review && dayInfo(x.d).seen < dayInfo(x.d).items.length);
  return [
    el('div', { class: 'row between' }, el('h1', { class: 'h1' }, tt('Learn', 'Курс')),
      seg([['days', tt('Phrases', 'Фразы')], ['grammar', tt('Grammar', 'Грамматика')]], UI.ctab, v => { UI.ctab = v; UI.lesson = null; render(); })),
    el('p', { class: 'muted' }, tt('56 phrases for cafés, shops, hotels and getting around. Days 7 and 10 have no new phrases.', '56 фраз для кафе, магазинов, отелей и дороги. В днях 7 и 10 новых фраз нет.')),
    el('div', { class: 'stack' }, DAYS.map(x => {
      const inf = dayInfo(x.d);
      const cls = x.review ? '' : inf.seen === inf.items.length ? 'done' : nowDay && nowDay.d === x.d ? 'now' : '';
      return el('button', { type: 'button', class: 'day', onclick: () => { UI.day = x.d; render(); window.scrollTo(0, 0); } },
        el('span', { class: 'bullet ' + cls }, cls === 'done' ? '✓' : String(x.d)),
        el('span', { class: 'grow cell' }, el('div', { class: 't' }, dayName(x.d)),
          x.review ? el('div', { class: 'muted small' }, tt('No new phrases · dialogues', 'Без новых фраз · диалоги'))
            : el('div', { class: 'row', style: { gap: '10px', marginTop: '4px' } },
              el('span', { class: 'dots' }, inf.items.map(p => el('i', { class: statusOf(p.id) + (S.cards[p.id] && S.cards[p.id].h ? ' hard' : '') }))),
              el('span', { class: 'muted small num' }, `${inf.learned}/${inf.items.length}`))),
        el('span', { style: { fontSize: '26px' } }, x.e));
    })),
  ];
}
function screenDay(d) {
  const x = DAY[d], inf = dayInfo(d);
  const out = [
    el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn icon-btn', 'aria-label': 'Back', onclick: () => { UI.day = null; render(); } }, icon('back')),
      el('div', { class: 'grow' }, el('div', { class: 'eyebrow' }, tt('Day ', 'День ') + d), el('h1', { class: 'h2' }, dayName(d)))),
  ];
  if (x.review) {
    const sc = SCEN.filter(s => s.days.includes(d));
    out.push(el('p', { class: 'muted' }, tt('No new phrases today. Replay what you know in role-play dialogues; every run changes the details (what you order, prices, directions).', 'Новых фраз нет. Разыграй знакомое в диалогах: каждый раз детали меняются (заказ, цены, маршрут).')));
    out.push(el('div', { class: 'stack' }, sc.map(s => btn(`${s.e}  ${tt(s.en, s.ru)}`, 'big block', () => startDialogue(s.id)))));
    out.push(btn(tt('Review due cards', 'Повторить карточки'), 'block', () => startDaily()));
    return out;
  }
  const unseen = inf.items.filter(p => !S.cards[p.id]).length;
  out.push(el('div', { class: 'stack' },
    btn(unseen ? tt(`Learn ${unseen} new phrases`, `Выучить ${unseen} нов. ${plural(unseen, 'фразу', 'фразы', 'фраз')}`) : tt('Practise this day', 'Потренировать день'), 'primary big block', () => startLearn(d))));
  out.push(el('section', { class: 'card' }, inf.items.map(p =>
    el('button', { type: 'button', class: 'phrase-row', onclick: () => openSheet(p) },
      el('span', { class: 'grow cell stack', style: { gap: '2px' } },
        el('span', { class: 'fr' }, p.fr), el('span', { class: 'muted small' }, mean(p))),
      el('span', { class: 'stack', style: { alignItems: 'flex-end', gap: '4px' } },
        statusChip(p.id), p.k === 'h' ? el('span', { class: 'chip' }, tt('Listen', 'На слух')) : null)))));
  return out;
}

/* ---------- PLAY ---------- */
function screenPlay() {
  const tile = (e, title, desc, fn) => el('button', { type: 'button', class: 'tile', onclick: fn },
    el('span', { class: 'e' }, e), el('span', { class: 't' }, title), el('span', { class: 'muted small' }, desc));
  return [
    el('div', { class: 'stack', style: { gap: '4px' } }, el('h1', { class: 'h1' }, tt('Practice games', 'Игры и практика')),
      el('p', { class: 'muted' }, tt('Games do not change your review schedule. They add variety and train your ear.', 'Игры не меняют расписание повторений: они добавляют разнообразия и тренируют слух.'))),
    el('div', { class: 'grid2' },
      tile('👂', tt('Listening drill', 'Слушаем и понимаем'), tt('Hear a phrase, pick its meaning', 'Слышишь фразу — выбираешь смысл'), () => startListen()),
      tile('🧩', tt('Build the phrase', 'Собери фразу'), tt('Tap the words in order', 'Нажимай слова по порядку'), () => startBuild()),
      tile('🃏', tt('Pairs', 'Пары'), tt('Match French with its meaning', 'Найди пары: фраза и смысл'), () => startPairs()),
      tile('💶', tt('Numbers & prices', 'Числа и цены'), tt('Hear the amount, type it', 'Услышь сумму и введи цифрами'), () => startNumbers()),
      tile('🎭', tt('Dialogues', 'Диалоги'), tt('Role-play with changing details', 'Ролевые диалоги, детали меняются'), () => startDialogueMenu()),
      tile('🔤', tt('Crossword', 'Кроссворд'), tt('From words you are learning', 'Из слов, которые ты учишь'), () => startCrossword()),
      tile('🟩', tt('Wordle', 'Wordle'), tt('Guess a French word in 6 tries', 'Угадай слово за 6 попыток'), () => startWordle()),
      tile('📘', tt('Grammar', 'Грамматика'), tt('Short lessons with exercises', 'Короткие уроки с упражнениями'), () => { UI.ctab = 'grammar'; UI.lesson = null; go('course'); })),
  ];
}

/* ---------- WORDS ---------- */
function topicInfo(tp) {
  const items = WORDS.filter(w => w.tp === tp);
  const learned = items.filter(w => ['review', 'strong'].includes(statusOf(w.id))).length;
  const seen = items.filter(w => S.cards[w.id]).length;
  return { items, learned, seen };
}
function wordRow(w) {
  return el('div', { class: 'list-row' },
    el('span', { style: { fontSize: '24px', width: '34px', textAlign: 'center' } }, w.sc || '·'),
    el('button', { type: 'button', class: 'grow cell', style: { background: 'none', border: 0, textAlign: 'left', padding: 0 }, onclick: () => openSheet(w) },
      el('div', { style: { fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: '20px' } }, w.fr),
      el('div', { class: 'muted small' }, w.kind === 'nm' ? `${w.n}` : mean(w))),
    statusChip(w.id), audioBtn(w));
}
function screenWords() {
  if (UI.topic) return screenTopic(UI.topic);
  const out = [
    el('div', { class: 'row between' }, el('h1', { class: 'h1' }, tt('Words & numbers', 'Слова и числа')),
      seg([['words', tt('Words', 'Слова')], ['nums', tt('Numbers', 'Числа')]], UI.wtab, v => { UI.wtab = v; render(); })),
  ];
  if (UI.wtab === 'words') {
    const due = VOC.filter(w => isDue(S.cards[w.id])).length, fresh = newWords().filter(w => w.kind === 'wd').length;
    const c = { new: 0, learning: 0, review: 0, strong: 0 };
    VOC.forEach(w => c[statusOf(w.id)]++);
    out.push(el('section', { class: 'card stack' },
      el('p', { class: 'muted small' }, tt(`${VOC.length} core words in 20 topics. New words come in daily sessions (${S.cfg.perDayWords} a day) in the order set in Me.`, `${VOC.length} базовых слов в 20 темах. Новые слова приходят в ежедневных тренировках (${S.cfg.perDayWords} в день) в порядке из раздела «Я».`)),
      el('div', { class: 'bar' }, ['strong', 'review', 'learning', 'new'].map(k => el('i', { class: 'seg-' + k, style: { width: (c[k] / VOC.length * 100) + '%' } }))),
      el('div', { class: 'legend' }, ['strong', 'review', 'learning', 'new'].map(k => el('span', null, el('i', { class: 'seg-' + k }), stLabel(k) + ' ' + c[k]))),
      el('div', { class: 'grid2' }, btn(tt('Learn new words', 'Новые слова'), 'primary', () => startMore('wd')),
        btn(due ? tt(`Review (${due})`, `Повторить (${due})`) : tt('Nothing due', 'Нечего повторять'), '', () => startWords('wd'), due ? {} : { disabled: true }))));
    const results = el('div', { id: 'wresults', class: 'stack', style: { gap: 0 } });
    const fill = () => {
      const q = norm(UI.q, true);
      results.replaceChildren();
      if (q.length < 2) return;
      const hits = WORDS.filter(w => norm(w.fr, true).includes(q) || norm(w.ru0, true).includes(q) || norm(w.en0, true).includes(q)).slice(0, 60);
      if (!hits.length) { results.append(el('p', { class: 'muted' }, tt('Nothing found.', 'Ничего не найдено.'))); return; }
      hits.forEach(w => results.append(wordRow(w)));
    };
    out.push(el('div', { class: 'stack' },
      el('div', { class: 'searchbox' }, icon('search'), el('input', { id: 'wsearch', class: 'field', type: 'search', placeholder: tt('Search a word (French, English or Russian)', 'Найти слово (по-французски, по-английски или по-русски)'), value: UI.q, autocomplete: 'off', 'aria-label': 'Search',
        oninput: e => { UI.q = e.target.value; fill(); } })),
      results));
    fill();
    out.push(el('div', { class: 'eyebrow' }, tt('Topics', 'Темы')));
    const order = S.cfg.order === 'list' ? TOPICS.map(t => t.id) : TOPIC_ORDER_TRAVEL;
    out.push(el('div', { class: 'stack' }, order.map(id => {
      const t = TOPIC[id], inf = topicInfo(id);
      return el('button', { type: 'button', class: 'day', onclick: () => { UI.topic = id; render(); window.scrollTo(0, 0); } },
        el('span', { style: { fontSize: '28px', width: '40px', textAlign: 'center' } }, t.e),
        el('span', { class: 'grow cell' }, el('div', { class: 't' }, topicName(id)),
          el('div', { class: 'row', style: { gap: '10px', marginTop: '4px' } },
            el('div', { class: 'bar', style: { flex: 1, height: '6px' } }, el('i', { class: 'seg-strong', style: { width: (inf.learned / inf.items.length * 100) + '%' } }), el('i', { class: 'seg-learning', style: { width: ((inf.seen - inf.learned) / inf.items.length * 100) + '%' } })),
            el('span', { class: 'muted small num' }, `${inf.learned}/${inf.items.length}`))));
    })));
  } else {
    const due = NUM.filter(w => isDue(S.cards[w.id])).length, fresh = NUM.filter(w => !S.cards[w.id]).length;
    out.push(el('section', { class: 'card stack' },
      el('p', { class: 'muted small' }, tt('Start with 0–10, then add 11–20 and the tens. Tap a number to hear it.', 'Начни с 0–10, потом добавляй 11–20 и десятки. Нажми на число, чтобы услышать.')),
      el('div', { class: 'row wrapr' }, due ? el('span', { class: 'chip accent' }, tt(`${due} due`, `${due} к повторению`)) : null, el('span', { class: 'chip' }, tt(`${fresh} new`, `${fresh} новых`))),
      el('div', { class: 'grid2' }, btn(tt('Practise numbers', 'Тренировать числа'), 'primary', () => startWords('nm')), btn(tt('Prices by ear', 'Цены на слух'), '', () => startNumbers()))));
    out.push(el('section', { class: 'card stack' },
      el('div', { class: 'numgrid' }, NUM.map(n => el('button', { type: 'button', onclick: () => sayIt(n), 'aria-label': n.fr }, el('b', { class: 'num' }, n.n), el('span', null, n.fr))))));
    out.push(el('section', { class: 'card stack' },
      el('div', { class: 'eyebrow' }, tt('Sample prices', 'Примеры цен')),
      PRICES_FIXED.map(([e, c]) => {
        const it = { fr: priceFr(e, c) };
        return el('div', { class: 'list-row' }, el('b', { class: 'num', style: { width: '84px', fontFamily: 'var(--f-display)', fontSize: '20px' } }, priceNum(e, c)),
          el('span', { class: 'grow cell' }, it.fr), audioBtn(it));
      })));
  }
  return out;
}
function screenTopic(tp) {
  const t = TOPIC[tp], inf = topicInfo(tp);
  const fresh = inf.items.filter(w => !S.cards[w.id]).length;
  return [
    el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn icon-btn', 'aria-label': 'Back', onclick: () => { UI.topic = null; render(); } }, icon('back')),
      el('div', { class: 'grow' }, el('div', { class: 'eyebrow' }, t.e + ' ' + tt('Topic', 'Тема') + ' ' + tp), el('h1', { class: 'h2' }, topicName(tp)))),
    btn(fresh ? tt(`Learn ${Math.min(10, fresh)} new words from this topic`, `Выучить ${Math.min(10, fresh)} нов. слов из темы`) : tt('Practise this topic', 'Потренировать тему'), 'primary big block', () => startTopic(tp)),
    el('section', { class: 'card' }, inf.items.map(wordRow)),
  ];
}

/* ---------- ME (progress, settings, account) ---------- */
const AUTH_ERR = {
  'auth/invalid-credential': ['Wrong email or password.', 'Неверная почта или пароль.'],
  'auth/wrong-password': ['Wrong email or password.', 'Неверная почта или пароль.'],
  'auth/user-not-found': ['No account with this email. Use “Create account”.', 'Такого аккаунта нет. Нажми «Создать аккаунт».'],
  'auth/invalid-email': ['That email does not look right.', 'Почта указана неверно.'],
  'auth/email-already-in-use': ['This email already has an account. Use “Sign in”.', 'Для этой почты уже есть аккаунт. Нажми «Войти».'],
  'auth/weak-password': ['Password needs at least 6 characters.', 'Пароль должен быть не короче 6 символов.'],
  'auth/network-request-failed': ['No connection. Try again when you are online.', 'Нет связи. Попробуй, когда появится интернет.'],
  'auth/too-many-requests': ['Too many attempts. Wait a minute and retry.', 'Слишком много попыток. Подожди минуту.'],
  'auth/operation-not-allowed': ['Sign-up is switched off for this project.', 'Регистрация в этом проекте отключена.'],
};
function authError(e) { const m = AUTH_ERR[e && e.code]; return m ? tt(m[0], m[1]) : tt('Could not sign in: ', 'Не удалось войти: ') + ((e && e.code) || 'error'); }
function accountCard() {
  const a = UI.auth;
  const box = el('section', { class: 'card stack', id: 'account' }, el('h2', { class: 'h2' }, tt('Account & sync', 'Аккаунт и синхронизация')));
  if (!Cloud.configured) {
    box.append(el('p', { class: 'muted' }, tt('Cloud sync is not set up in this build. Progress stays on this device; use the backup below to move it.', 'Облачная синхронизация в этой версии не подключена. Прогресс остаётся на устройстве; для переноса используй копию ниже.')));
    return box;
  }
  if (Cloud.user) {
    box.append(
      el('div', { class: 'row' }, el('span', { class: 'sync', 'data-s': Cloud.status }), el('div', { class: 'grow cell' }, el('div', { style: { fontWeight: 700, overflowWrap: 'anywhere' } }, Cloud.user.email), el('div', { id: 'synclabel', class: 'muted small' }, syncLabel()))),
      el('p', { class: 'muted small' }, tt('Progress is saved on this device first and sent to your cloud storage when the connection allows, so the app works without internet. Sign in with the same account on your other device.', 'Прогресс сначала сохраняется на устройстве и отправляется в облако, когда есть связь, поэтому приложение работает без интернета. На другом устройстве войди под тем же аккаунтом.')),
      el('div', { class: 'grid2' }, btn(tt('Sync now', 'Синхронизировать'), 'small', () => { Cloud.flush(); toast(tt('Sent', 'Отправлено')); }), btn(tt('Sign out', 'Выйти'), 'small', async () => { try { await window.__auth.signOut(); } catch (e) { /* ignore */ } })));
    return box;
  }
  const act = async kind => {
    const email = ($('#authmail').value || '').trim(), pw = $('#authpw').value || '';
    a.email = email; a.pw = pw;
    if (!window.__auth) { a.msg = tt('The cloud module is still loading. Try again in a moment.', 'Облачный модуль ещё загружается. Попробуй через секунду.'); render(); return; }
    if (!email || !pw) { a.msg = tt('Enter your email and password.', 'Введи почту и пароль.'); render(); return; }
    a.busy = true; a.msg = ''; render();
    try {
      if (kind === 'in') await window.__auth.signIn(email, pw); else await window.__auth.signUp(email, pw);
      a.pw = ''; a.msg = '';
    } catch (e) { a.msg = authError(e); }
    a.busy = false; render();
  };
  box.append(
    el('p', { class: 'muted small' }, tt('Use the same email and password as in your other app (Slide-uchet), or create a new account. Sign in once on each device.', 'Используй ту же почту и пароль, что в «Слайд-учёте», или создай новый аккаунт. Войти нужно один раз на каждом устройстве.')),
    el('input', { id: 'authmail', class: 'field', type: 'email', inputmode: 'email', autocomplete: 'username', autocapitalize: 'off', placeholder: tt('Email', 'Почта'), value: a.email, 'aria-label': 'Email', onkeydown: e => { if (e.key === 'Enter') $('#authpw').focus(); } }),
    el('input', { id: 'authpw', class: 'field', type: 'password', autocomplete: 'current-password', placeholder: tt('Password', 'Пароль'), value: a.pw, 'aria-label': 'Password', onkeydown: e => { if (e.key === 'Enter') act('in'); } }),
    a.msg ? el('div', { class: 'chip bad', style: { alignSelf: 'flex-start', whiteSpace: 'normal' } }, a.msg) : null,
    el('div', { class: 'grid2' }, btn(a.busy ? '…' : tt('Sign in', 'Войти'), 'primary', () => act('in'), a.busy ? { disabled: true } : {}), btn(tt('Create account', 'Создать аккаунт'), '', () => act('up'), a.busy ? { disabled: true } : {})),
    btn(tt('Forgot password', 'Забыли пароль'), 'ghost small', async () => {
      const email = ($('#authmail').value || '').trim(); a.email = email;
      if (!email) { a.msg = tt('Enter your email first.', 'Сначала введи почту.'); render(); return; }
      try { await window.__auth.reset(email); a.msg = tt('We sent a reset link to that email.', 'Отправили ссылку для сброса на эту почту.'); } catch (e) { a.msg = authError(e); }
      render();
    }));
  return box;
}
function screenMe() {
  const out = [el('h1', { class: 'h1' }, tt('Progress & settings', 'Прогресс и настройки'))];
  const dates = []; for (let i = 13; i >= 0; i--) dates.push(addDays(today(), -i));
  const tot = Object.values(S.days).reduce((a, d) => ({ a: a.a + d.a, k: a.k + d.k }), { a: 0, k: 0 });
  const mastered = ITEMS.filter(x => statusOf(x.id) === 'strong').length;
  const lessonsDone = Object.keys(S.gram).length;
  out.push(el('section', { class: 'card stack' },
    el('div', { class: 'row between' }, el('h2', { class: 'h2' }, tt('Last 14 days', 'Последние 14 дней')), el('span', { class: 'chip ' + (streak() ? 'good' : '') }, tt(`Streak ${streak()}`, `Серия ${streak()}`))),
    el('div', { class: 'cal' }, dates.map(d => el('i', { class: S.days[d] ? (S.days[d].a >= 10 ? 'on' : 'part') : '', title: d + (S.days[d] ? ' · ' + S.days[d].a : '') }))),
    el('div', { class: 'cal-lab' }, dates.map(d => el('span', null, String(Number(d.slice(8)))))),
    el('div', { class: 'stack', style: { gap: 0 } },
      el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Answers given', 'Дано ответов')), el('b', { class: 'num' }, tot.a)),
      el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Right without hints', 'Верно без подсказок')), el('b', { class: 'num' }, tot.a ? Math.round(tot.k / tot.a * 100) + '%' : '—')),
      el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Mastered cards', 'Выучено карточек')), el('b', { class: 'num' }, `${mastered} / ${ITEMS.length}`)),
      el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Grammar lessons done', 'Уроков грамматики')), el('b', { class: 'num' }, `${lessonsDone} / ${LESSONS.length}`)))));
  const hard = hardItems();
  out.push(el('section', { class: 'card stack' },
    el('div', { class: 'row between' }, el('h2', { class: 'h2' }, tt('Difficult pool', 'Трудный пул') + ' · ' + hard.length), hard.length ? btn(tt('Practice', 'Тренировать'), 'small primary', startHard) : null),
    hard.length ? el('div', { class: 'stack', style: { gap: 0 } }, hard.slice(0, 40).map(it => el('button', { type: 'button', class: 'phrase-row', onclick: () => openSheet(it) },
      el('span', { class: 'grow cell stack', style: { gap: '2px' } }, el('span', { class: 'fr' }, it.fr), el('span', { class: 'muted small' }, it.kind === 'nm' ? String(it.n) : mean(it))),
      audioBtn(it))))
      : el('p', { class: 'muted' }, tt('Nothing here. Cards you miss or need many hints for will appear in this pool.', 'Пока пусто. Сюда попадут карточки, в которых ты ошиблась или взяла много подсказок.'))));

  out.push(accountCard());

  const c = S.cfg;
  const row = (label, node, hint) => el('div', { class: 'stack', style: { gap: '6px' } }, el('div', { style: { fontWeight: 700 } }, label), node, hint ? el('div', { class: 'muted small' }, hint) : null);
  const voices = TTS.voices;
  const vSel = el('select', { id: 'voicesel', class: 'field', style: { fontSize: '16px', minHeight: '46px' }, onchange: e => { DEV.voice = e.target.value; saveDev(); sayIt(PH[7]); } },
    el('option', { value: '' }, tt('Automatic (best French voice)', 'Автоматически (лучший французский голос)')),
    voices.map(v => el('option', { value: v.voiceURI, selected: DEV.voice === v.voiceURI ? true : null }, `${v.name} (${v.lang})${v.localService ? '' : ' · online'}`)));
  out.push(el('section', { class: 'card stack' },
    el('h2', { class: 'h2' }, tt('Settings', 'Настройки')),
    row(tt('Language of prompts and menus', 'Язык подсказок и меню'), seg([['en', 'English'], ['ru', 'Русский']], c.lang, v => { setCfg({ lang: v }); render(); }, true)),
    row(tt('Pronunciation shown as', 'Транскрипция'), seg([['both', tt('Both', 'Обе')], ['ipa', 'IPA'], ['cy', 'Рус'], ['off', tt('Off', 'Выкл')]], c.tr, v => { setCfg({ tr: v }); render(); }, true),
      tt('IPA is the international notation; “Рус” is a rough Russian respelling (н/м at the end of a syllable only nasalizes the vowel).', 'IPA — международная запись; «Рус» — приблизительная запись кириллицей (н/м в конце слога лишь делают гласную носовой).')),
    row(tt('Saying a phrase', 'Как отвечать'), seg([['speak', tt('Say aloud', 'Вслух')], ['type', tt('Type', 'Вводом')]], c.ans, v => { setCfg({ ans: v }); render(); }, true),
      tt('Aloud: you say it, reveal the answer and rate yourself. Type: the app checks your spelling.', 'Вслух: говоришь, открываешь ответ и сама оцениваешь. Вводом: приложение проверяет написание.')),
    row(tt('Accents when typing', 'Акценты при вводе'), seg([[true, tt('Forgive missing', 'Не требовать')], [false, tt('Strict', 'Строго')]], c.accent, v => { setCfg({ accent: v }); render(); }, true)),
    row(tt('New phrases per day', 'Новых фраз в день'), seg([3, 4, 5, 6, 7].map(n => [n, String(n)]), c.perDay, v => { setCfg({ perDay: v }); render(); }, true),
      tt('The deck suggests 7; take 3–5 if it feels heavy. Finishing the list matters less than remembering.', 'В колоде 7; бери 3–5, если тяжело. Пройти список менее важно, чем запомнить.')),
    row(tt('New words per day', 'Новых слов в день'), seg([0, 5, 10, 15, 20].map(n => [n, String(n)]), c.perDayWords, v => { setCfg({ perDayWords: v }); render(); }, true)),
    row(tt('Order of word topics', 'Порядок тем слов'), seg([['travel', tt('Travel first', 'Сначала путешествия')], ['list', tt('As in the list', 'Как в списке')]], c.order, v => { setCfg({ order: v }); render(); }, true),
      tt('Travel first starts with basics, numbers, transport, city and hotel, restaurant, directions.', 'Сначала основы, числа, транспорт, город и отель, ресторан, направления.')),
    row(tt('French voice (this device)', 'Французский голос (это устройство)'), el('div', { class: 'stack' },
      voices.length ? vSel : el('p', { class: 'note' }, tt('No French voice found. On iPhone: Settings → Accessibility → Spoken Content → Voices → French. On Mac: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices.', 'Французский голос не найден. На iPhone: Настройки → Универсальный доступ → Речь → Голоса → Французский. На Mac: Системные настройки → Универсальный доступ → Речь → Системный голос → Управлять голосами.')),
      el('div', { class: 'row' }, el('span', { class: 'muted small' }, tt('Speed', 'Скорость')),
        el('input', { type: 'range', min: '0.6', max: '1.2', step: '0.05', value: String(DEV.rate), id: 'rate', style: { flex: 1 }, oninput: e => { DEV.rate = Number(e.target.value); saveDev(); }, onchange: () => sayIt(PH[7]) })),
      btn(tt('Test voice', 'Проверить голос'), 'small', () => sayIt(PH[7]))))));

  out.push(el('section', { class: 'card stack' },
    el('h2', { class: 'h2' }, tt('Backup', 'Резервная копия')),
    el('div', { class: 'grid2' },
      btn(tt('Save backup file', 'Сохранить файл копии'), 'small', saveBackup),
      btn(tt('Copy backup code', 'Копировать код копии'), 'small', copyBackup)),
    el('textarea', { id: 'importbox', class: 'field', placeholder: tt('Paste a backup code here to restore', 'Вставь код копии, чтобы восстановить'), 'aria-label': 'Backup code' }),
    btn(tt('Restore from code', 'Восстановить из кода'), 'small', () => {
      try { importCode($('#importbox').value.trim()); toast(tt('Progress restored', 'Прогресс восстановлен')); render(); }
      catch (e) { toast(tt('That code is not valid', 'Код не подходит')); }
    })));

  out.push(el('section', { class: 'card stack' },
    el('h2', { class: 'h2' }, tt('Reset', 'Сброс')),
    UI.confirmReset
      ? el('div', { class: 'stack' }, el('p', null, tt('Erase all progress on every synced device? Settings stay.', 'Стереть весь прогресс на всех синхронизированных устройствах? Настройки останутся.')),
        el('div', { class: 'grid2' }, btn(tt('Cancel', 'Отмена'), '', () => { UI.confirmReset = false; render(); }),
          btn(tt('Erase progress', 'Стереть'), 'danger', () => { resetAll(); UI.confirmReset = false; toast(tt('Progress erased', 'Прогресс стёрт')); render(); })))
      : btn(tt('Reset progress…', 'Сбросить прогресс…'), 'danger small', () => { UI.confirmReset = true; render(); })));
  if (UI.focusAccount) { UI.focusAccount = false; setTimeout(() => { const a = $('#account'); if (a) a.scrollIntoView({ block: 'start' }); }, 30); }
  return out;
}
function saveBackup() {
  const txt = exportCode(), name = 'parlons-voyage-backup-' + today() + '.json';
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = name;
    document.body.append(a); a.click(); a.remove();
    toast(tt('Backup file saved', 'Файл копии сохранён'));
  } catch (e) { copyBackup(); }
}
function copyBackup() {
  const txt = exportCode();
  const ok = () => toast(tt('Backup code copied', 'Код скопирован'));
  const fallback = () => { const t = $('#importbox'); if (t) { t.value = txt; t.select(); } toast(tt('Select and copy the code in the box', 'Выдели и скопируй код в поле')); };
  try { navigator.clipboard.writeText(txt).then(ok, fallback); } catch (e) { fallback(); }
}
