'use strict';
/* Year grammar course screens: course map, topic pages, practice runner, plan, reference, progress, checkpoints. */
Object.assign(UI, { gsub: 'year', gv: 'course', gTopic: null, gStep: 0, gOpen: { A1: true }, gTravel: false, gPrN: 5, gPrMode: 'repeat', gPrTopic: '', gRef: 'terms', gq: '', gVerb: 'être' });
const fr = (text, cls) => el('span', { lang: 'fr', class: cls || null }, text);
function gcStatusChip(id) {
  const s = gcStatus(id);
  return el('span', { class: 'chip ' + (s === 'stable_in_app' ? 'good' : s === 'review_due' ? 'bad' : s === 'practising' ? 'accent' : s === 'introduced' ? 'hint' : '') }, gcStatusLabel(s));
}
const gcTravelSet = () => new Set(GC.data.travel_preview_module_ids);
function frKeys(getInput, onChange) {
  const chars = GC.data.grading_contract.show_french_keyboard_chars;
  return el('div', { class: 'accents' }, chars.map(ch => el('button', {
    type: 'button', 'aria-label': ch, onclick: () => {
      const a = getInput(); if (!a) return;
      const s0 = a.selectionStart == null ? a.value.length : a.selectionStart, s1 = a.selectionEnd == null ? s0 : a.selectionEnd;
      a.value = a.value.slice(0, s0) + ch + a.value.slice(s1); a.focus(); a.setSelectionRange(s0 + 1, s0 + 1);
      if (onChange) onChange(a.value);
    },
  }, ch)));
}

/* ---------- entry: Learn → Grammar ---------- */
function screenGrammar() {
  const head = el('div', { class: 'row between' }, el('h1', { class: 'h1' }, tt('Learn', 'Курс')),
    seg([['days', tt('Phrases', 'Фразы')], ['grammar', tt('Grammar', 'Грамматика')]], UI.ctab, v => { UI.ctab = v; UI.lesson = null; render(); }));
  const sub = seg([['year', tt('Year course', 'Курс на год')], ['quick', tt('Quick lessons', 'Быстрые уроки')]], UI.gsub, v => { UI.gsub = v; UI.lesson = null; UI.gTopic = null; render(); }, true);
  if (UI.gsub === 'quick') return UI.lesson ? screenLesson(UI.lesson) : [head, sub].concat(screenQuickLessons());
  gcLoad();
  if (GC.error) return [head, sub, el('section', { class: 'card stack' }, el('h2', { class: 'h2' }, tt('The course could not be loaded', 'Курс не загрузился')), el('p', { class: 'muted' }, GC.error),
    btn(tt('Try again', 'Повторить'), 'primary', () => { GC.error = ''; gcLoad(); render(); }))];
  if (!GC.data) return [head, sub, el('p', { class: 'muted' }, tt('Loading the course…', 'Загружаю курс…'))];
  if (UI.gTopic) return [gcTopicScreen(UI.gTopic)].flat();
  const views = [['course', tt('Course', 'Курс')], ['practice', tt('Practice', 'Практика')], ['plan', tt('Plan', 'План')], ['ref', tt('Reference', 'Справочник')], ['progress', tt('Progress', 'Прогресс')]];
  const nav = el('div', { class: 'subnav', role: 'tablist' }, views.map(([id, label]) => el('button', { type: 'button', role: 'tab', 'aria-selected': String(UI.gv === id), onclick: () => { UI.gv = id; render(); window.scrollTo(0, 0); } }, label)));
  const body = { course: gcCourseView, practice: gcPracticeView, plan: gcPlanView, ref: gcRefView, progress: gcProgressView }[UI.gv]();
  return [head, sub, nav].concat(body);
}

/* ---------- course map ---------- */
function gcCourseView() {
  const out = [], next = gcNextTopic(), due = gcDueTopics(), travel = gcTravelSet();
  out.push(el('section', { class: 'card stack' },
    el('div', { class: 'eyebrow' }, tt(`Week ${S.gc.week} · a guide, not a deadline`, `Неделя ${S.gc.week} · ориентир, не срок`)),
    el('div', { class: 'h2' }, next.title_ru),
    el('p', { class: 'muted' }, next.can_do_ru),
    el('div', { class: 'row wrapr' }, gcStatusChip(next.id), el('span', { class: 'chip' }, next.stage), travel.has(next.id) ? el('span', { class: 'chip hint' }, tt('for the trip', 'для поездки')) : null),
    btn(tt('Open the topic', 'Открыть тему'), 'primary big block', () => { UI.gTopic = next.id; UI.gStep = 0; render(); window.scrollTo(0, 0); })));
  if (due.length) out.push(el('section', { class: 'card flat row between' }, el('div', { class: 'grow cell' }, el('div', { style: { fontWeight: 700 } }, tt(`${due.length} ${due.length === 1 ? 'topic' : 'topics'} to review`, `Тем к повторению: ${due.length}`)), el('div', { class: 'muted small' }, tt('A short round of 3, 5 or 10 tasks is enough.', 'Хватит короткого подхода на 3, 5 или 10 заданий.'))),
    btn(tt('Practise', 'Повторить'), 'small primary', () => { UI.gv = 'practice'; render(); })));
  out.push(seg([[false, tt('All topics', 'Все темы')], [true, tt('For the trip', 'Для поездки')]], UI.gTravel, v => { UI.gTravel = v; render(); }, true));
  if (UI.gTravel) out.push(el('p', { class: 'muted small' }, GC.data.travel_preview_rule_ru));
  GC_STAGES.forEach(st => {
    const mods = GC.mods.filter(m => m.stage === st && (!UI.gTravel || travel.has(m.id)));
    if (!mods.length) return;
    const all = GC.mods.filter(m => m.stage === st);
    const stable = all.filter(m => gcStatus(m.id) === 'stable_in_app').length, open = UI.gOpen[st] !== undefined ? UI.gOpen[st] : false;
    out.push(el('section', { class: 'card stack', style: { gap: '8px' } },
      el('button', { type: 'button', class: 'row between', style: { background: 'none', border: 0, padding: 0, textAlign: 'left' }, 'aria-expanded': String(open), onclick: () => { UI.gOpen[st] = !open; render(); } },
        el('span', { class: 'row' }, el('span', { class: 'gstage ' + st }, st), el('span', { class: 'stack', style: { gap: '0' } }, el('b', { class: 'h2' }, tt('Block ', 'Блок ') + st), el('span', { class: 'muted small' }, tt(`${stable} of ${all.length} stable in the app`, `${stable} из ${all.length} устойчиво в приложении`)))),
        el('span', { class: 'muted' }, open ? '–' : '+')),
      open ? el('div', { class: 'stack', style: { gap: 0 } },
        st === 'B2' && !gcRouteB2() ? el('p', { class: 'muted small', style: { paddingBottom: '8px' } }, tt('This is the continuation to B2. Open it after the basics feel solid; nothing here is required for the main route.', 'Это продолжение к B2. Открывай после уверенной базы; для основного маршрута эти темы не обязательны.')) : null,
        mods.map(m => el('button', { type: 'button', class: 'phrase-row', onclick: () => { UI.gTopic = m.id; UI.gStep = 0; render(); window.scrollTo(0, 0); } },
          el('span', { class: 'chip', style: { minWidth: '34px', justifyContent: 'center' } }, String(m.order)),
          el('span', { class: 'grow cell stack', style: { gap: '2px' } }, el('span', { style: { fontWeight: 600 } }, m.title_ru),
            el('span', { class: 'muted small' }, tt(`week ${m.suggested_week}`, `нед. ${m.suggested_week}`) + (m.priority === 'extension' ? ' · ' + tt('extension', 'расширение') : m.priority === 'optional_reading' ? ' · ' + tt('for reading', 'для чтения') : '') + (travel.has(m.id) ? ' · ✈' : ''))),
          gcStatusChip(m.id)))) : null));
  });
  const c = gcCounts();
  out.push(el('p', { class: 'muted small' }, tt(`In this course: ${c.modules} topics, ${c.examples} examples, ${c.training} practice tasks, ${c.checkpointExercises} checkpoint tasks, ${c.weeks} weeks, ${c.verbs} verbs. Counted from the loaded file.`, `В курсе: тем ${c.modules}, примеров ${c.examples}, тренировочных заданий ${c.training}, контрольных ${c.checkpointExercises}, недель ${c.weeks}, глаголов ${c.verbs}. Числа посчитаны по загруженному файлу.`)));
  out.push(el('p', { class: 'muted small' }, GC.data.scope_ru));
  return out;
}

/* ---------- topic pages ---------- */
function gcTopicScreen(id) {
  const m = GC.mod[id], travel = gcTravelSet();
  const steps = m.rules_ru.length + 2, k = Math.min(UI.gStep, steps - 1);
  const out = [el('div', { class: 'row' },
    el('button', { type: 'button', class: 'btn icon-btn', 'aria-label': tt('Back', 'Назад'), onclick: () => { UI.gTopic = null; render(); } }, icon('back')),
    el('div', { class: 'grow cell' }, el('div', { class: 'row wrapr', style: { gap: '6px' } }, el('span', { class: 'chip' }, m.stage), el('span', { class: 'chip' }, tt(`week ${m.suggested_week}`, `нед. ${m.suggested_week}`)), travel.has(id) ? el('span', { class: 'chip hint' }, tt('for the trip', 'для поездки')) : null, gcStatusChip(id)),
      el('h1', { class: 'h2', style: { marginTop: '4px' } }, m.title_ru)))];
  if (k === 0) {
    out.push(el('section', { class: 'card stack' }, el('div', { class: 'eyebrow' }, tt('Goal', 'Цель')), el('p', { class: 'lesson-p' }, m.can_do_ru)));
    const miss = gcMissingPre(m);
    if (miss.length) out.push(el('section', { class: 'card flat stack' }, el('div', { class: 'eyebrow' }, tt('Better to know first', 'Лучше знать заранее')),
      el('p', { class: 'muted small' }, tt('A recommendation, not a lock: you can read this topic now.', 'Это рекомендация, а не запрет: тему можно читать уже сейчас.')),
      el('div', { class: 'row wrapr' }, miss.map(p => btn(GC.mod[p].title_ru, 'small', () => { UI.gTopic = p; UI.gStep = 0; render(); window.scrollTo(0, 0); })))));
  }
  if (k < m.rules_ru.length) {
    out.push(el('section', { class: 'card stack' }, el('div', { class: 'eyebrow' }, tt(`Rule ${k + 1} of ${m.rules_ru.length}`, `Правило ${k + 1} из ${m.rules_ru.length}`)), el('p', { class: 'lesson-p' }, m.rules_ru[k])));
  } else if (k === m.rules_ru.length) {
    out.push(el('section', { class: 'card stack' }, el('div', { class: 'eyebrow' }, tt('Examples', 'Примеры')),
      el('div', { class: 'stack', style: { gap: 0 } }, m.examples.map(x => el('div', { class: 'list-row' },
        el('div', { class: 'grow cell' }, el('div', { lang: 'fr', style: { fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: '21px' } }, x.fr), el('div', { class: 'muted small' }, x.ru)),
        audioBtn({ fr: x.tts_text }), audioBtn({ fr: x.tts_text }, true))))));
  } else {
    gcMarkSeen(id);
    const r = S.gc.topics[id] || { ex: {} }, day = today();
    out.push(el('section', { class: 'card stack' }, el('div', { class: 'eyebrow' }, tt('Practice', 'Практика')),
      el('p', { class: 'muted small' }, tt('One task at a time. Three checked tasks and one open task. The answer stays hidden until you try or ask to see it; a hint or a shown answer is not counted as independent success.', 'Задания выдаются по одному: три с проверкой и одно открытое. Ответ скрыт, пока ты не попробуешь или не попросишь показать; подсказка и показанный ответ не считаются самостоятельным успехом.')),
      el('div', { class: 'stack', style: { gap: 0 } }, m.exercises.map(e => { const x = r.ex[e.id] || {}; return el('div', { class: 'list-row' }, el('span', { class: 'chip' }, tt(GC_TYPE_LABEL[e.type][0], GC_TYPE_LABEL[e.type][1])), el('span', { class: 'grow' }), (x.okInd || []).includes(day) ? el('span', { class: 'chip good' }, tt('done today', 'сегодня верно')) : x.n ? el('span', { class: 'chip' }, tt(`tried ${x.n}×`, `попыток ${x.n}`)) : null); })),
      btn(tt('Start practice (4 tasks)', 'Начать практику (4 задания)'), 'primary big block', () => gcStart(m.exercises.map(e => ({ m, e })), { label: m.title_ru })),
      m.recommended_vocab_topic_ids.length ? el('div', { class: 'stack' }, el('div', { class: 'eyebrow' }, tt('Words for this topic', 'Слова к теме')),
        el('div', { class: 'row wrapr' }, m.recommended_vocab_topic_ids.filter(t => TOPIC[t]).map(t => btn(TOPIC[t].e + ' ' + topicName(t), 'small', () => { UI.gTopic = null; UI.topic = t; go('words'); })))) : null,
      el('p', { class: 'muted small' }, tt(`Suggested: about ${m.estimated_sessions.count} short sessions of ${m.estimated_sessions.minutes_each[0]}–${m.estimated_sessions.minutes_each[1]} minutes.`, `Ориентир: около ${m.estimated_sessions.count} коротких занятий по ${m.estimated_sessions.minutes_each[0]}–${m.estimated_sessions.minutes_each[1]} минут.`))));
  }
  out.push(el('div', { class: 'row between' },
    btn(tt('Back', 'Назад'), 'small', () => { UI.gStep = Math.max(0, k - 1); render(); window.scrollTo(0, 0); }, k === 0 ? { disabled: true } : {}),
    el('span', { class: 'dots' }, Array.from({ length: steps }, (_, i) => el('i', { class: i === k ? 'review' : i < k ? 'strong' : '' }))),
    k < steps - 1 ? btn(tt('Next', 'Дальше'), 'small primary', () => { UI.gStep = k + 1; render(); window.scrollTo(0, 0); }) : el('span', { style: { width: '80px' } })));
  return out;
}

/* ---------- practice ---------- */
function gcPracticeView() {
  const due = gcDueTopics(), n = UI.gPrN;
  const out = [el('section', { class: 'card stack' },
    el('h2', { class: 'h2' }, tt('Short rounds', 'Короткие подходы')),
    due.length ? el('p', null, tt(due.length === 1 ? '1 topic is due.' : `${due.length} topics are due.`, `К повторению тем: ${due.length}.`) + (due.length > n ? ' ' + tt(`The round takes only ${n} tasks; the rest wait, so a break does not turn into a pile of debts.`, `В подходе будет только ${n} заданий, остальное подождёт: перерыв не превращается в гору долгов.`) : '')) : el('p', { class: 'muted' }, tt('Nothing is due. Rounds then use topics you are working on, or the next topic of the plan.', 'Повторять пока нечего. Подход возьмёт темы, с которыми ты работаешь, или следующую тему плана.')),
    el('div', { class: 'stack' }, el('div', { style: { fontWeight: 700 } }, tt('Tasks in a round', 'Заданий в подходе')), seg([3, 5, 10].map(x => [x, String(x)]), n, v => { UI.gPrN = v; render(); }, true)),
    el('div', { class: 'stack' }, el('div', { style: { fontWeight: 700 } }, tt('What to practise', 'Что повторять')),
      seg([['repeat', tt('Repeat', 'Повторение')], ['topic', tt('One topic', 'Одна тема')], ['mistakes', tt('Mistakes', 'Ошибки')]], UI.gPrMode, v => { UI.gPrMode = v; render(); }, true)),
    UI.gPrMode === 'topic' ? el('select', { id: 'gprtopic', class: 'field', style: { fontSize: '16px', minHeight: '46px' }, onchange: e => { UI.gPrTopic = e.target.value; } },
      el('option', { value: '' }, tt('Choose a topic', 'Выбери тему')),
      GC_STAGES.map(st => el('optgroup', { label: st }, GC.mods.filter(m => m.stage === st).map(m => el('option', { value: m.id, selected: UI.gPrTopic === m.id ? true : null }, `${m.order}. ${m.title_ru}`))))) : null,
    UI.gPrMode === 'mistakes' ? el('p', { class: 'muted small' }, tt('Tasks you missed or needed to see the answer for.', 'Задания, в которых была ошибка или пришлось смотреть ответ.')) : null,
    btn(tt('Start', 'Начать'), 'primary big block', () => {
      const items = gcQueue(n, UI.gPrMode, UI.gPrTopic);
      if (UI.gPrMode === 'topic' && !UI.gPrTopic) { toast(tt('Choose a topic first.', 'Сначала выбери тему.')); return; }
      if (!items.length) { toast(tt('Nothing to practise yet.', 'Пока нечего повторять.')); return; }
      gcStart(items, { label: tt('Practice', 'Практика') });
    }))];
  return out;
}

/* ---------- plan ---------- */
function gcPlanView() {
  const out = [], cur = S.gc.week, travel = gcTravelSet();
  out.push(el('section', { class: 'card stack' },
    el('div', { class: 'row between' }, el('h2', { class: 'h2' }, tt('52 weeks, relative', '52 недели, относительно')), el('span', { class: 'chip accent' }, tt(`Week ${cur}`, `Неделя ${cur}`))),
    el('p', { class: 'muted small' }, tt('The calendar is a guide. Take one topic a week if time is short; the course stretches, it does not skip the basics. At most 2 new topics a week.', 'Календарь — ориентир. Если времени мало, бери одну тему в неделю: курс растянется, но база не пропускается. Новых тем не больше двух в неделю.')),
    el('div', { class: 'grid2' }, btn(tt('‹ Previous week', '‹ Назад'), 'small', () => { gcSetWeek(cur - 1); }, cur <= 1 ? { disabled: true } : {}), btn(tt('Next week ›', 'Вперёд ›'), 'small', () => { gcSetWeek(cur + 1); }, cur >= 52 ? { disabled: true } : {})),
    el('div', { class: 'stack' }, el('div', { style: { fontWeight: 700 } }, tt('Route', 'Маршрут')),
      seg(GC.data.routes.map(r => [r.id, r.id === 'b1_core' ? tt('Basics + B1', 'База и B1') : tt('Towards B2', 'К B2')]), S.gc.route, v => { S.gc.route = v; S.gc.rt = Date.now(); gcTouch(); render(); }, true),
      el('p', { class: 'muted small' }, GC.data.routes.find(r => r.id === S.gc.route).rule_ru))));
  GC.data.weeks.forEach(w => {
    const isCur = w.week === cur, dim = w.b2_requires_readiness && !gcRouteB2();
    out.push(el('section', { class: 'card stack', style: { gap: '8px', opacity: dim ? 0.82 : 1, borderColor: isCur ? 'var(--accent)' : null, borderWidth: isCur ? '2px' : null } },
      el('div', { class: 'row between' }, el('div', { class: 'row wrapr', style: { gap: '6px' } }, el('b', { class: 'h2' }, tt(`Week ${w.week}`, `Неделя ${w.week}`)), el('span', { class: 'chip' }, w.stage), el('span', { class: 'chip ' + (w.kind === 'assessment' ? 'hint' : w.kind === 'review' ? 'accent' : '') }, { new_topics: tt('new topics', 'новые темы'), review: tt('review', 'повторение'), assessment: tt('checkpoint', 'контрольная') }[w.kind])),
        isCur ? null : btn(tt('Set as current', 'Сделать текущей'), 'ghost small', () => gcSetWeek(w.week))),
      w.new_module_ids.length ? el('div', { class: 'row wrapr' }, w.new_module_ids.map(id => btn(GC.mod[id].title_ru, 'small', () => { UI.gv = 'course'; UI.gTopic = id; UI.gStep = 0; render(); window.scrollTo(0, 0); }))) : null,
      w.review_module_ids.length ? (w.review_module_ids.length > 6
        ? el('p', { class: 'muted small' }, tt(`Review: all topics of block ${w.stage} (${w.review_module_ids.length}). Start with the ones that are due.`, `Повторение: все темы блока ${w.stage} (${w.review_module_ids.length}). Начни с тех, что пора повторить.`))
        : el('div', { class: 'stack', style: { gap: '4px' } }, el('div', { class: 'muted small' }, tt('Review', 'Повторить')), el('div', { class: 'row wrapr' }, w.review_module_ids.map(id => btn(GC.mod[id].title_ru, 'small ghost', () => { UI.gv = 'course'; UI.gTopic = id; UI.gStep = 0; render(); window.scrollTo(0, 0); }))))) : null,
      w.checkpoint_id ? btn(tt(`Checkpoint ${GC.cp[w.checkpoint_id].stage}`, `Контрольная ${GC.cp[w.checkpoint_id].stage}`), 'primary small', () => gcStartCheckpoint(w.checkpoint_id)) : null,
      dim ? el('p', { class: 'muted small' }, (w.alternative_b1_route_ru ? w.alternative_b1_route_ru + ' ' : '') + tt('Advanced topics open after a readiness check.', 'Продвинутые темы открываются после проверки готовности.')) : null,
      el('p', { class: 'muted small' }, w.weekly_task_ru)));
  });
  return out;
}
function gcSetWeek(w) { S.gc.week = Math.max(1, Math.min(52, w)); S.gc.rt = Date.now(); gcTouch(); render(); }

/* ---------- reference ---------- */
function gcRefView() {
  const out = [seg([['terms', tt('Terms', 'Термины')], ['verbs', tt('Verbs', 'Глаголы')], ['examples', tt('Examples', 'Примеры')]], UI.gRef, v => { UI.gRef = v; render(); }, true)];
  const search = (ph, fill) => {
    const box = el('div', { id: 'gresults', class: 'stack', style: { gap: 0 } });
    out.push(el('div', { class: 'searchbox' }, icon('search'), el('input', { id: 'gsearch', class: 'field', type: 'search', placeholder: ph, value: UI.gq, autocomplete: 'off', oninput: e => { UI.gq = e.target.value; fill(box); } })));
    out.push(box); fill(box);
  };
  if (UI.gRef === 'terms') {
    search(tt('Search a term (Russian or French)', 'Найти термин (по-русски или по-французски)'), box => {
      const q = gcFold(UI.gq); box.replaceChildren();
      GC.data.glossary.filter(t => !q || gcFold(t.ru).includes(q) || gcFold(t.fr).includes(q) || gcFold(t.definition_ru).includes(q)).forEach(t => box.append(el('div', { class: 'list-row' }, el('div', { class: 'grow cell' }, el('div', { style: { fontWeight: 700 } }, t.ru + ' · ', fr(t.fr, 'muted')), el('div', { class: 'muted small' }, t.definition_ru)))));
    });
  } else if (UI.gRef === 'verbs') {
    const vr = GC.data.verb_reference, v = vr.items.find(x => x.infinitive === UI.gVerb) || vr.items[0];
    out.push(el('select', { id: 'gverb', class: 'field', style: { fontSize: '16px', minHeight: '46px' }, 'aria-label': tt('Verb', 'Глагол'), onchange: e => { UI.gVerb = e.target.value; render(); } }, vr.items.map(x => el('option', { value: x.infinitive, selected: x.infinitive === v.infinitive ? true : null }, x.infinitive))));
    out.push(el('section', { class: 'card stack' }, el('div', { class: 'row between' }, el('h2', { class: 'h2', lang: 'fr' }, v.infinitive), audioBtn({ fr: v.infinitive })),
      el('div', { class: 'tablewrap' }, el('table', { class: 'gtable' }, el('tbody', null, vr.person_order.map((p, i) => el('tr', null, el('th', null, p), el('td', { lang: 'fr' }, v.present_forms[i])))))),
      el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Past participle (base)', 'Причастие (основа)')), fr(v.past_participle_base)),
      el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Future / conditional stem', 'Основа futur / conditionnel')), fr(v.future_conditional_stem)),
      el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Auxiliary in the past', 'Вспомогательный в прошедшем')), fr(v.auxiliary_ru)),
      el('p', { class: 'muted small' }, vr.rule_ru)));
  } else {
    search(tt('Search an example (French or Russian)', 'Найти пример (по-французски или по-русски)'), box => {
      const q = gcFold(UI.gq); box.replaceChildren();
      if (q.length < 2) { box.append(el('p', { class: 'muted small' }, tt('Type at least two letters.', 'Введи хотя бы две буквы.'))); return; }
      let n = 0;
      GC.mods.forEach(m => m.examples.forEach(x => { if (n < 40 && (gcFold(x.fr).includes(q) || gcFold(x.ru).includes(q))) { n++; box.append(el('div', { class: 'list-row' }, el('div', { class: 'grow cell' }, el('div', { lang: 'fr', style: { fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: '19px' } }, x.fr), el('div', { class: 'muted small' }, x.ru + ' · ' + m.title_ru)), audioBtn({ fr: x.tts_text }))); } }));
      if (!n) box.append(el('p', { class: 'muted' }, tt('Nothing found.', 'Ничего не найдено.')));
    });
  }
  return out;
}

/* ---------- progress ---------- */
function gcProgressView() {
  const out = [], g = S.gc, due = gcDueTopics();
  GC_STAGES.forEach(st => {
    const mods = GC.mods.filter(m => m.stage === st), c = { not_started: 0, introduced: 0, practising: 0, review_due: 0, stable_in_app: 0 };
    mods.forEach(m => c[gcStatus(m.id)]++);
    out.push(el('section', { class: 'card stack', style: { gap: '8px' } },
      el('div', { class: 'row between' }, el('b', { class: 'h2' }, tt('Block ', 'Блок ') + st), el('span', { class: 'muted small num' }, `${c.stable_in_app}/${mods.length}`)),
      el('div', { class: 'bar' }, [['stable_in_app', 'strong'], ['practising', 'review'], ['review_due', 'review'], ['introduced', 'learning'], ['not_started', 'new']].map(([k, cls]) => el('i', { class: 'seg-' + cls, style: { width: (c[k] / mods.length * 100) + '%' } }))),
      el('div', { class: 'legend' }, Object.keys(c).filter(k => c[k]).map(k => el('span', null, gcStatusLabel(k) + ' ' + c[k])))));
  });
  out.push(el('p', { class: 'muted small' }, tt('“Stable in the app” is a local rule: independent answers on two different days at least a week apart, plus a self-checked open task. It is not a language level.', '«Устойчиво в приложении» — локальное правило: самостоятельные ответы в два разных дня с разницей не меньше недели и самооценённое открытое задание. Это не уровень владения языком.')));
  const log = g.log.slice(-60), closed = log.filter(l => GC.ex[l.ex] && GC.ex[l.ex].e.type !== 'production');
  out.push(el('section', { class: 'card stack', style: { gap: 0 } }, el('h2', { class: 'h2', style: { marginBottom: '6px' } }, tt('Recent closed tasks', 'Последние закрытые задания')),
    el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Right without a hint', 'Верно без подсказки')), el('b', { class: 'num' }, closed.filter(l => l.r === 'ok' && !l.hint).length + ' / ' + closed.length)),
    el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Hints used', 'Подсказок взято')), el('b', { class: 'num' }, closed.filter(l => l.hint).length)),
    el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Answers shown', 'Ответов показано')), el('b', { class: 'num' }, closed.filter(l => l.r === 'revealed').length)),
    el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Topics due for review', 'Тем к повторению')), el('b', { class: 'num' }, due.length))));
  const errs = g.log.slice().reverse().filter(l => ['bad', 'accent'].includes(l.r) && GC.ex[l.ex]).slice(0, 8);
  out.push(el('section', { class: 'card stack' }, el('div', { class: 'row between' }, el('h2', { class: 'h2' }, tt('Mistakes to revisit', 'Ошибки для повторения')), errs.length ? btn(tt('Practise', 'Повторить'), 'small primary', () => { const items = gcQueue(UI.gPrN, 'mistakes'); if (items.length) gcStart(items, { label: tt('Mistakes', 'Ошибки') }); }) : null),
    errs.length ? el('div', { class: 'stack', style: { gap: 0 } }, errs.map(l => { const x = GC.ex[l.ex]; return el('div', { class: 'list-row' }, el('div', { class: 'grow cell' }, el('div', { class: 'muted small' }, x.m.title_ru), el('div', { lang: 'fr', style: { fontWeight: 600 } }, x.e.stimulus_fr || x.e.prompt_ru), el('div', { class: 'small' }, tt('You: ', 'Твой ответ: '), fr(l.ans || '—'), ' · ', tt('right: ', 'верно: '), fr(gcSolution(x.e))))); })) : el('p', { class: 'muted' }, tt('No mistakes recorded yet.', 'Ошибок пока нет.'))));
  const prod = Object.entries(g.prod).filter(([id]) => GC.ex[id]);
  if (prod.length) out.push(el('section', { class: 'card stack' }, el('h2', { class: 'h2' }, tt('Open tasks', 'Открытые задания')),
    el('p', { class: 'muted small' }, tt('Your own rating. It is not a check by a teacher; mark “checked” only after a teacher has looked at it.', 'Это твоя самооценка, а не проверка преподавателя. Отмечай «проверено» только после того, как преподаватель посмотрел.')),
    el('div', { class: 'stack', style: { gap: 0 } }, prod.slice(-10).reverse().map(([id, p]) => { const x = GC.ex[id]; return el('div', { class: 'list-row' }, el('div', { class: 'grow cell' }, el('div', { class: 'small', style: { fontWeight: 600 } }, x.m.title_ru), el('div', { class: 'muted small' }, ({ self_ok: tt('self: done', 'самооценка: получилось'), self_part: tt('self: partly', 'самооценка: частично'), self_retry: tt('self: repeat', 'самооценка: повторить') })[p.self] || '')),
      p.teacher ? el('span', { class: 'chip good' }, tt('teacher checked', 'проверено преподавателем')) : btn(tt('Teacher checked', 'Проверено'), 'ghost small', () => { p.teacher = 'checked'; p.t = Date.now(); gcTouch(); render(); })); }))));
  out.push(el('section', { class: 'card stack' }, el('h2', { class: 'h2' }, tt('Checkpoints', 'Контрольные')),
    el('p', { class: 'muted small' }, tt('Short sample checks, not an exam and not a level. After the first attempt the tasks are no longer new; a retake is marked as a repeat.', 'Короткие выборочные проверки: не экзамен и не уровень. После первой попытки задания уже не новые, повтор помечается как повтор.')),
    GC.data.checkpoints.map(c => { const r = g.cp[c.id]; return el('div', { class: 'list-row' }, el('div', { class: 'grow cell' }, el('div', { style: { fontWeight: 700 } }, tt('Checkpoint ', 'Контрольная ') + c.stage), el('div', { class: 'muted small' }, r ? tt(`First attempt: ${r.closedOk} of ${r.closedTotal} closed tasks without a hint · attempts: ${r.takes}`, `Первая попытка: ${r.closedOk} из ${r.closedTotal} закрытых без подсказки · попыток: ${r.takes}`) : tt('Not taken', 'Не проходила'))), btn(r ? tt('Repeat', 'Повторить') : tt('Start', 'Начать'), 'small', () => gcStartCheckpoint(c.id))); })));
  out.push(el('section', { class: 'card stack' }, el('h2', { class: 'h2' }, tt('Report for a teacher', 'Отчёт для преподавателя')),
    el('p', { class: 'muted small' }, tt('Dates, topics, specific mistakes, hints, closed-task results; open tasks are marked as self-assessment. You pass it on by hand.', 'Даты, темы, конкретные ошибки, подсказки и результаты закрытых заданий; открытые задания помечены как самооценка. Передаёшь его вручную.')),
    el('textarea', { id: 'gcreport', class: 'field', readonly: true, rows: '8', style: { minHeight: '160px', fontSize: '13px' } }, gcReport()),
    btn(tt('Copy report', 'Скопировать отчёт'), 'primary', () => {
      const txt = gcReport(), ok = () => toast(tt('Report copied', 'Отчёт скопирован')), fb = () => { const t = $('#gcreport'); if (t) { t.focus(); t.select(); } toast(tt('Select and copy the text', 'Выдели и скопируй текст')); };
      try { navigator.clipboard.writeText(txt).then(ok, fb); } catch (e) { fb(); }
    })));
  return out;
}

/* ---------- the exercise runner (topics, practice rounds, checkpoints) ---------- */
function gcStart(items, opts) {
  const g = { items: items.map(it => ({ m: it.m, e: it.e, order: it.e.type === 'choice' ? shuffle(it.e.options.map(o => o.id)) : null, st: 'ask', typed: '', picked: null, hint: false, shown: false, res: null, pending: null, msg: '' })), i: 0, cp: opts.cp || null, retake: !!opts.retake, label: opts.label || '' };
  GAME = { g, view: () => gcView(g) };
  renderOverlay();
}
function gcStartCheckpoint(id) {
  const c = GC.cp[id], prev = S.gc.cp[id];
  const m = { id: c.id, stage: c.stage, title_ru: 'Контрольная ' + c.stage, rules_ru: [], exercises: c.exercises };
  const rec = S.gc.cp[id] || (S.gc.cp[id] = { t: Date.now(), exposed: true, takes: 0, closedOk: 0, closedTotal: 0, items: {} });
  rec.exposed = true; gcTouch();
  gcStart(c.exercises.map(e => ({ m, e })), { cp: c, retake: !!(prev && prev.takes > 0), label: tt('Checkpoint ', 'Контрольная ') + c.stage });
}
function gcCommit(g, q, res) {
  q.res = res; q.st = 'done';
  if (res.r === 'ok' && !res.hint) celebrate();
  if (g.cp) {
    const rec = S.gc.cp[g.cp.id]; rec.items[q.e.id] = { r: res.r, hint: res.hint ? 1 : 0 };
  } else if (q.e.type === 'transform' && res.r === 'bad') q.pending = res;
  else gcRecord(q.m, q.e, res);
  if (q.e.type !== 'production') { const sol = gcSolution(q.e); if (gcSpeakable(sol)) speak(sol); }   // the solution is only read aloud after an attempt
}
function gcNext(g) {
  const q = g.items[g.i];
  if (q && q.pending) { gcRecord(q.m, q.e, q.pending); q.pending = null; }
  g.i++;
  if (g.i >= g.items.length && g.cp) gcFinishCp(g);
  renderOverlay();
}
function gcFinishCp(g) {
  const rec = S.gc.cp[g.cp.id];
  const closed = g.items.filter(q => q.e.type !== 'production');
  const ok = closed.filter(q => q.res && q.res.r === 'ok' && !q.res.hint).length;
  rec.takes = (rec.takes || 0) + 1; rec.t = Date.now();
  if (rec.takes === 1) { rec.closedOk = ok; rec.closedTotal = closed.length; }
  rec.lastOk = ok;
  g.items.filter(q => q.e.type === 'production' && q.res).forEach(q => { rec.items[q.e.id] = { r: q.res.r, hint: 0, draft: (q.res.draft || '').slice(0, 800) }; });
  gcTouch();
}
function gcView(g) {
  if (g.i >= g.items.length) return gcSummary(g);
  const q = g.items[g.i], e = q.e, m = q.m, done = q.st === 'done', body = [];
  const sol = gcSolution(e);
  body.push(el('div', { class: 'row between' }, el('div', { class: 'row wrapr', style: { gap: '6px' } }, el('span', { class: 'chip accent' }, tt(GC_TYPE_LABEL[e.type][0], GC_TYPE_LABEL[e.type][1])), el('span', { class: 'chip' }, m.stage), g.retake ? el('span', { class: 'chip bad' }, tt('repeat', 'повтор')) : null),
    el('span', { class: 'muted small cell', style: { textAlign: 'right' } }, m.title_ru)));
  const mood = done && q.res ? (['ok', 'self_ok', 'self_part', 'variant'].includes(q.res.r) ? 'cheer' : 'think') : 'happy';
  body.push(el('div', { class: 'ask' + (done ? (mood === 'cheer' ? ' cheer' : ' think') : '') }, mascot(mood, 60), el('div', { class: 'speech' }, el('div', { class: 'prompt', style: { fontSize: '21px', lineHeight: '1.25' } }, e.prompt_ru))));

  const inputBox = (ph) => {
    const inp = el('input', { id: 'gans', class: 'field', type: 'text', value: q.typed, lang: 'fr', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', placeholder: ph || '', 'aria-label': tt('Your answer in French', 'Твой ответ по-французски'),
      onkeydown: ev => { if (ev.key === 'Enter') gcCheckTyped(g); }, oninput: ev => { q.typed = ev.target.value; } });
    return [inp, frKeys(() => $('#gans'), v => { q.typed = v; })];
  };
  if (e.type === 'cloze') {
    const parts = e.stimulus_fr.split('___');
    body.push(el('div', { class: 'sentence', lang: 'fr' }, parts[0], el('span', { class: 'gap' + (done ? ' ok' : '') }, done ? e.accepted_answers[0] : (q.typed || '    ')), parts[1] || ''));
    if (!done) body.push(el('div', { class: 'stack' }, inputBox(tt('Only the missing part', 'Только пропущенное')), q.msg ? el('div', { class: 'chip bad', style: { alignSelf: 'flex-start', whiteSpace: 'normal' } }, q.msg) : null));
  } else if (e.type === 'transform') {
    if (!done) body.push(el('div', { class: 'stack' }, inputBox(tt('The whole sentence', 'Предложение целиком')), q.msg ? el('div', { class: 'chip bad', style: { alignSelf: 'flex-start', whiteSpace: 'normal' } }, q.msg) : null));
    else body.push(el('div', { class: 'muted small' }, tt('Your answer: ', 'Твой ответ: '), fr(q.typed || '—')));
  } else if (e.type === 'choice') {
    body.push(el('div', { class: 'stack' }, q.order.map(id => { const o = e.options.find(x => x.id === id); const right = id === e.correct_option_id;
      return el('button', { type: 'button', lang: 'fr', class: 'opt' + (done ? (right ? ' right' : q.picked === id ? ' wrong' : '') : ''), disabled: done ? true : null, onclick: () => { q.picked = id; gcCommit(g, q, { r: right ? 'ok' : 'bad', hint: q.hint, ans: o.text }); renderOverlay(); } }, o.text); })));
  } else {
    body.push(el('div', { class: 'hintbox' }, el('div', { class: 'lab' }, tt('What counts', 'Что оценивается')), el('ul', { style: { margin: 0, paddingLeft: '18px' } }, (e.rubric_ru || []).map(r => el('li', null, r)))));
    if (q.shown) {
      if (e.model_answer_fr) body.push(el('div', { class: 'stack' }, el('div', { class: 'row' }, el('div', { class: 'plate sm grow', lang: 'fr' }, e.model_answer_fr), audioBtn({ fr: e.model_answer_fr })), el('p', { class: 'muted small' }, tt('One possible answer, not the only correct one.', 'Один из возможных ответов, не единственный верный.'))));
      if (e.model_explanation_ru) body.push(el('p', { class: 'note' }, e.model_explanation_ru));
    }
    if (!done) {
      body.push(el('div', { class: 'stack' }, el('textarea', { id: 'gans', class: 'field', lang: 'fr', value: q.typed, placeholder: tt('Optional draft: write it, or say it out loud', 'Черновик по желанию: напиши или скажи вслух'), 'aria-label': tt('Draft', 'Черновик'), rows: '4', style: { minHeight: '110px', fontFamily: 'var(--f-body)', fontSize: '17px' }, oninput: ev => { q.typed = ev.target.value; } }),
        frKeys(() => $('#gans'), v => { q.typed = v; }),
        el('p', { class: 'muted small' }, tt('The app does not hear you and does not check pronunciation. Say it aloud, then compare with the sample and rate yourself.', 'Приложение тебя не слышит и произношение не проверяет. Скажи вслух, затем сравни с образцом и оцени себя.'))));
    }
  }
  if (q.hint && !done) body.push(el('div', { class: 'hintbox' }, el('div', { class: 'lab' }, tt('Rule (counted as a hint)', 'Правило (засчитано как подсказка)')), (m.rules_ru || []).slice(0, 2).map(r => el('p', { style: { margin: 0 } }, r))));
  if (done && e.type !== 'production') {
    const r = q.res.r, v = r === 'ok' ? ['g3', tt('Right', 'Верно')] : r === 'accent' ? ['g2', tt('Almost: the accent differs', 'Почти: отличается акцент')] : r === 'revealed' ? ['g2', tt('Answer shown: not counted as independent', 'Ответ показан: самостоятельным не считается')] : r === 'variant' ? ['g2', tt('Saved as your variant for checking', 'Сохранено как твой вариант на проверку')] : ['g0', tt('Not this time', 'В этот раз не вышло')];
    body.push(el('div', { class: 'verdict ' + v[0] }, el('span', null, v[1]), q.res.hint && r === 'ok' ? el('span', { class: 'sub' }, tt('Right with a hint: not counted as independent.', 'Верно с подсказкой: самостоятельным не считается.')) : null, e.feedback_ru ? el('span', { class: 'sub' }, e.feedback_ru) : null,
      r === 'accent' ? el('span', { class: 'sub' }, tt('Words are right but an accent is wrong. Accents change the word: a / à, ou / où.', 'Слова верные, но не тот акцент. Акценты меняют слово: a / à, ou / où.')) : null));
    body.push(el('div', { class: 'row' }, el('div', { class: 'plate sm grow', lang: 'fr' }, sol), gcSpeakable(sol) ? audioBtn({ fr: sol }) : null));
  }
  if (done && e.type === 'production') body.push(el('div', { class: 'verdict g3' }, el('span', null, tt('Saved as self-assessment', 'Сохранено как самооценка')), e.feedback_ru ? el('span', { class: 'sub' }, e.feedback_ru) : null));

  let foot;
  const last = g.i + 1 >= g.items.length;
  const hintBtn = !g.cp && !q.hint && m.rules_ru && m.rules_ru.length ? el('button', { type: 'button', class: 'btn', onclick: () => { q.hint = true; renderOverlay(); } }, icon('bulb'), tt('Rule', 'Правило')) : null;
  if (done) {
    foot = el('div', { class: 'stack' }, q.pending && e.type === 'transform' ? btn(tt('My variant is also possible', 'Мой вариант тоже возможен'), '', () => { gcRecord(q.m, q.e, { r: 'variant', hint: q.hint, ans: q.typed }); q.res = { r: 'variant', hint: q.hint }; q.pending = null; renderOverlay(); }) : null,
      btn(last ? tt('Finish', 'Завершить') : tt('Next', 'Дальше'), 'primary big block', () => gcNext(g)));
  } else if (e.type === 'choice') {
    foot = el('div', { class: 'grid2' }, hintBtn, btn(tt('Show answer', 'Показать ответ'), '', () => { gcCommit(g, q, { r: 'revealed', hint: q.hint, ans: '' }); renderOverlay(); }));
  } else if (e.type === 'production') {
    foot = !q.shown ? el('div', { class: 'grid2' }, hintBtn, btn(tt('Show sample', 'Показать образец'), 'primary', () => { q.shown = true; speakFirstSample(e); renderOverlay(); }))
      : el('div', { class: 'stack' }, el('div', { class: 'muted small' }, tt('Rate yourself honestly (this is your own rating):', 'Оцени себя честно (это твоя самооценка):')),
        el('div', { class: 'rate' }, [['self_retry', tt('Repeat', 'Повторить'), tt('not yet', 'пока нет')], ['self_part', tt('Partly', 'Частично'), tt('some of it', 'отчасти')], ['self_ok', tt('Done', 'Получилось'), tt('my own words', 'своими словами')]].map(([r, a, b], i) => el('button', { type: 'button', class: 'btn' + (i === 2 ? ' primary' : ''), onclick: () => { gcCommit(g, q, { r, hint: q.hint, ans: '', draft: q.typed }); gcNext(g); } }, el('b', null, a), el('span', { class: 'small' }, b)))));
  } else {
    foot = el('div', { class: 'stack' }, el('div', { class: 'grid2' }, hintBtn, btn(tt('Show answer', 'Показать ответ'), '', () => { gcCommit(g, q, { r: 'revealed', hint: q.hint, ans: q.typed }); renderOverlay(); })), btn(tt('Check', 'Проверить'), 'primary big block', () => gcCheckTyped(g)));
  }
  if (!done && (e.type === 'cloze' || e.type === 'transform' || (e.type === 'production' && !q.shown))) setTimeout(() => { const a = $('#gans'); if (a && document.activeElement !== a) a.focus({ preventScroll: true }); }, 30);
  return frame({ progress: g.i / g.items.length, counter: `${g.i + 1}/${g.items.length}`, body, foot });
}
function speakFirstSample(e) { if (e.model_answer_fr) speak(e.model_answer_fr); }
function gcCheckTyped(g) {
  const q = g.items[g.i], a = $('#gans'); if (a) q.typed = a.value;
  const r = gcCheck(q.e, q.typed);
  if (r === 'empty') { q.msg = tt('Type an answer first, or tap “Show answer”.', 'Сначала введи ответ или нажми «Показать ответ».'); renderOverlay(); return; }
  gcCommit(g, q, { r, hint: q.hint, ans: q.typed }); renderOverlay();
}
function gcSummary(g) {
  const items = g.items, closed = items.filter(q => q.e.type !== 'production');
  const okInd = closed.filter(q => q.res && q.res.r === 'ok' && !q.res.hint).length;
  const wrong = items.filter(q => q.res && ['bad', 'accent', 'revealed'].includes(q.res.r));
  const prod = items.filter(q => q.e.type === 'production' && q.res);
  if (!g.cel && closed.length && okInd === closed.length) { g.cel = true; setTimeout(() => celebrate(true), 300); }
  const body = [el('div', { class: 'summary-head' }, mascot(okInd === closed.length ? 'cheer' : 'happy', 88), el('div', { class: 'eyebrow' }, g.label), el('h1', { class: 'h1' }, g.cp ? tt('Checkpoint finished', 'Контрольная завершена') : tt('Round finished', 'Подход завершён')))];
  body.push(el('section', { class: 'card stack', style: { gap: 0 } },
    el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Closed tasks right without a hint', 'Закрытых верно без подсказки')), el('b', { class: 'num' }, `${okInd} / ${closed.length}`)),
    el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('With a hint', 'С подсказкой')), el('b', { class: 'num' }, closed.filter(q => q.res && q.res.hint).length)),
    el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Answers shown', 'Ответов показано')), el('b', { class: 'num' }, closed.filter(q => q.res && q.res.r === 'revealed').length)),
    prod.length ? el('div', { class: 'kv' }, el('span', { class: 'muted' }, tt('Open tasks (self-assessment)', 'Открытых заданий (самооценка)')), el('b', { class: 'num' }, prod.length)) : null));
  if (g.cp) body.push(el('p', { class: 'muted' }, g.cp.suggested_review_trigger_ru + ' ' + (g.retake ? tt('This was a repeat: the tasks were no longer new, so it is not an independent check.', 'Это был повтор: задания уже не новые, поэтому это не независимая проверка.') : '') + ' ' + tt('The result is not a language level.', 'Результат не является уровнем языка.')));
  if (wrong.length) body.push(el('section', { class: 'card stack' }, el('h2', { class: 'h2' }, tt('To revisit', 'Стоит повторить')),
    el('div', { class: 'stack', style: { gap: 0 } }, wrong.map(q => el('div', { class: 'list-row' }, el('div', { class: 'grow cell' }, el('div', { class: 'muted small' }, q.m.title_ru), el('div', { lang: 'fr', style: { fontWeight: 600 } }, q.e.stimulus_fr || q.e.prompt_ru), el('div', { class: 'small' }, tt('right: ', 'верно: '), fr(gcSolution(q.e))), q.e.feedback_ru ? el('div', { class: 'muted small' }, q.e.feedback_ru) : null), gcSpeakable(gcSolution(q.e)) ? audioBtn({ fr: gcSolution(q.e) }) : null))),
    g.cp ? el('p', { class: 'muted small' }, tt(`The checkpoint tasks do not name a topic; review the topics of block ${g.cp.stage} that feel shaky.`, `Задания контрольной не привязаны к темам; повтори шаткие темы блока ${g.cp.stage}.`)) : null));
  return frame({ progress: 1, counter: '', body, foot: el('div', { class: 'stack' }, btn(tt('Back', 'Назад'), 'primary big block', () => { closeAll(); UI.ctab = 'grammar'; UI.gsub = 'year'; go('course'); UI.ctab = 'grammar'; render(); }),
    wrong.length && !g.cp ? btn(tt('Practise these again', 'Повторить эти'), 'block', () => gcStart(wrong.map(q => ({ m: q.m, e: q.e })), { label: tt('Mistakes', 'Ошибки') })) : null) });
}
