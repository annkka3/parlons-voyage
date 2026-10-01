'use strict';
/* Year grammar course A1–B2: content is data/grammar_course.json (read only), progress lives in S.gc.
   Principles from the course brief: honest checking (no automatic CEFR level, hints and shown answers never count as
   independent success, open tasks are self-assessed), simple repeat schedule 1/3/7/14/30 days, held-out checkpoint tasks. */
const GC_COURSE_ID = 'french-grammar-a1-b2-year-v1';
const GC_INT = [1, 3, 7, 14, 30];
const GC_STAGES = ['A1', 'A2', 'B1', 'B2'];
const GC_TYPES = ['cloze', 'choice', 'transform', 'production'];
const GC_TYPE_LABEL = { cloze: ['Gap', 'Пропуск'], choice: ['Choice', 'Выбор'], transform: ['Transform', 'Преобразование'], production: ['Open answer', 'Свободный ответ'] };
const GC_STATUS = {
  not_started: ['Not started', 'Не начато'], introduced: ['Introduced', 'Знакомство'], practising: ['Practising', 'Практика'],
  review_due: ['Review due', 'Пора повторить'], stable_in_app: ['Stable in app', 'Устойчиво в приложении'],
};
const GC = { data: null, loading: false, error: '', mods: [], mod: {}, ex: {}, cp: {}, week: {} };

/* ---------- loading and validation ---------- */
function gcValidate(d) {
  if (!d || d.course_id !== GC_COURSE_ID) return 'course_id';
  if (!/^1\./.test(d.schema_version || '')) return 'schema_version ' + d.schema_version;
  if (!Array.isArray(d.modules) || !Array.isArray(d.weeks) || !Array.isArray(d.checkpoints)) return 'structure';
  const ids = new Set(), mods = new Set(d.modules.map(m => m.id));
  const dup = id => { if (ids.has(id)) return true; ids.add(id); return false; };
  const badEx = e => {
    if (dup(e.id)) return 'duplicate ' + e.id;
    if (!GC_TYPES.includes(e.type)) return 'type ' + e.id;
    if (e.type === 'choice' && !(e.options || []).some(o => o.id === e.correct_option_id)) return 'choice ' + e.id;
    if (e.type === 'cloze' && !String(e.stimulus_fr).includes('___')) return 'cloze ' + e.id;
    if ((e.type === 'cloze' || e.type === 'transform') && !(e.accepted_answers || []).length) return 'answers ' + e.id;
    return null;
  };
  for (const m of d.modules) {
    if (dup(m.id)) return 'duplicate ' + m.id;
    for (const p of m.prerequisites || []) if (!mods.has(p)) return 'prerequisite ' + p + ' in ' + m.id;
    for (const e of m.exercises || []) { const b = badEx(e); if (b) return b; }
  }
  for (const c of d.checkpoints) {
    if (dup(c.id)) return 'duplicate ' + c.id;
    for (const e of c.exercises || []) { const b = badEx(e); if (b) return b; }
  }
  return null;
}
function gcLoad() {
  if (GC.data || GC.loading) return;
  GC.loading = true; GC.error = '';
  fetch('data/grammar_course.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(d => {
    const bad = gcValidate(d);
    if (bad) throw new Error(tt('The course file did not pass the check: ', 'Файл курса не прошёл проверку: ') + bad);
    GC.data = d; GC.mods = d.modules.slice().sort((a, b) => a.order - b.order);
    GC.mod = Object.fromEntries(GC.mods.map(m => [m.id, m]));
    GC.ex = {}; GC.mods.forEach(m => m.exercises.forEach(e => { GC.ex[e.id] = { m, e }; }));
    GC.cp = Object.fromEntries(d.checkpoints.map(c => [c.id, c]));
    GC.week = Object.fromEntries(d.weeks.map(w => [w.week, w]));
    GC.loading = false;
    if (!SES && !GAME) render();
  }).catch(e => { GC.loading = false; GC.error = String((e && e.message) || e); if (!SES && !GAME) render(); });
}
const gcCounts = () => ({
  modules: GC.mods.length, examples: GC.mods.reduce((s, m) => s + m.examples.length, 0),
  training: GC.mods.reduce((s, m) => s + m.exercises.length, 0), checkpoints: GC.data.checkpoints.length,
  checkpointExercises: GC.data.checkpoints.reduce((s, c) => s + c.exercises.length, 0), weeks: GC.data.weeks.length, verbs: GC.data.verb_reference.items.length,
});
const gcClosed = m => m.exercises.filter(e => e.type !== 'production');
const gcTitle = m => m.title_ru;

/* ---------- checking answers ---------- */
// Allowed: Unicode form, straight vs curly apostrophe, letter case, repeated spaces, final punctuation, hyphen variants.
// Not allowed: dropping accents (a / à, ou / où are different answers).
function gcNorm(s) {
  return String(s).normalize('NFC').replace(/[’‘`´]/g, "'").replace(/[‐‑–—]/g, '-').toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?…]+$/, '').trim();
}
const gcFold = s => gcNorm(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
function gcCheck(e, typed) {
  const t = gcNorm(typed);
  if (!t) return 'empty';
  if (e.accepted_answers.some(a => gcNorm(a) === t)) return 'ok';
  const f = gcFold(typed);
  if (e.accepted_answers.some(a => gcFold(a) === f)) return 'accent';   // right words, wrong accent: explained apart, still not correct
  return 'bad';
}
function gcFill(e) {
  return e.stimulus_fr.replace('___', e.accepted_answers[0]).replace(/\s*\([^)]*\)\s*$/, '').replace(/([’'])\s+/g, '$1');
}
// Russian is never sent to the French voice
const gcSpeakable = t => !!t && !/[А-Яа-яЁё]/.test(t);
function gcSolution(e) {
  if (e.type === 'cloze') return gcFill(e);
  if (e.type === 'transform') return e.accepted_answers[0];
  if (e.type === 'choice') return e.options.find(o => o.id === e.correct_option_id).text;
  return e.model_answer_fr || '';
}

/* ---------- progress per topic ---------- */
const gcTopic = (id, create) => {
  const g = S.gc; let r = g.topics[id];
  if (!r && create) r = g.topics[id] = { t: Date.now(), seen: 0, n: 0, step: 0, due: null, ind: [], prodOk: false, stable: false, ex: {} };
  return r;
};
function gcStatus(id) {
  const r = S.gc.topics[id];
  if (!r || (!r.seen && !r.n)) return 'not_started';
  if (r.stable) return r.due && r.due <= today() ? 'review_due' : 'stable_in_app';
  if (r.n > 0) return r.due && r.due <= today() ? 'review_due' : 'practising';
  return 'introduced';
}
const gcStatusLabel = s => tt(GC_STATUS[s][0], GC_STATUS[s][1]);
function gcTouch() { S.gc.t = Date.now(); gcDirty = true; persist(); }
function gcMarkSeen(id) {
  const r = gcTopic(id, true);
  if (!r.seen) { r.seen = 1; r.t = Date.now(); gcTouch(); }
}
// Which prerequisites are not yet at least introduced (a recommendation, never a lock)
const gcMissingPre = m => m.prerequisites.filter(p => gcStatus(p) === 'not_started');

// Records one answer. res.r: ok | accent | bad | revealed | variant | self_ok | self_part | self_retry
function gcRecord(m, e, res) {
  const day = today(), t = Date.now(), r = gcTopic(m.id, true);
  r.t = t;
  const x = r.ex[e.id] || (r.ex[e.id] = { n: 0, ok: 0, okInd: [], last: 0 });
  x.n++; x.last = t;
  if (e.type !== 'production') {
    r.n = (r.n || 0) + 1;
    const indep = res.r === 'ok' && !res.hint;
    if (res.r === 'ok') x.ok++;
    if (indep && !x.okInd.includes(day)) { x.okInd.push(day); x.okInd = x.okInd.slice(-6); }
    if (res.r !== 'variant') gcSchedule(m, r, day, indep);
  } else {
    x.self = res.r;
    if (res.r === 'self_ok' && !res.hint) r.prodOk = true;
  }
  S.gc.log.push({ id: t + '-' + Math.floor(Math.random() * 1e4), t, topic: m.id, ex: e.id, r: res.r, hint: res.hint ? 1 : 0, ans: String(res.ans || '').slice(0, 200) });
  if (S.gc.log.length > 300) S.gc.log = S.gc.log.slice(-300);
  if (e.type === 'production') {
    S.gc.prod[e.id] = { t, self: res.r, draft: String(res.draft || '').slice(0, 800), teacher: (S.gc.prod[e.id] || {}).teacher || null };
  }
  gcTouch();
}
// Review schedule: only a success on a due topic moves it on; a mistake sends it back; several rounds in one day never jump ahead.
function gcSchedule(m, r, day, indep) {
  const ids = gcClosed(m).map(e => e.id);
  if (!r.due) { r.step = 0; r.due = addDays(day, GC_INT[0]); }
  const allToday = ids.every(id => ((r.ex[id] || {}).okInd || []).includes(day));
  if (allToday && !r.ind.includes(day)) {
    r.ind.push(day);
    if (r.due <= day) { r.step = Math.min(r.step + 1, GC_INT.length - 1); r.due = addDays(day, GC_INT[r.step]); }
  }
  if (!indep) {
    r.step = Math.max(0, r.step - 1);
    const soon = addDays(day, GC_INT[r.step]);
    if (!r.due || r.due > soon) r.due = soon;
    if (r.stable) { r.stable = false; r.ind = []; }   // a mistake on a stable topic: it has to earn stability again on new days
  }
  if (!r.stable && r.ind.length >= 2 && daysBetween(r.ind[0], r.ind[r.ind.length - 1]) >= 7 && r.prodOk) r.stable = true;
}

/* ---------- plan, route, next topic ---------- */
const gcRouteB2 = () => S.gc.route === 'b2_extension';
function gcNextTopic() {
  const okMod = m => gcRouteB2() || m.stage !== 'B2';
  for (let w = Math.max(1, S.gc.week); w <= 52; w++) {
    const wk = GC.week[w];
    for (const id of (wk && wk.new_module_ids) || []) {
      const m = GC.mod[id];
      if (m && okMod(m) && ['not_started', 'introduced'].includes(gcStatus(id))) return m;
    }
  }
  return GC.mods.find(m => okMod(m) && gcStatus(m.id) !== 'stable_in_app') || GC.mods[0];
}
const gcDueTopics = () => GC.mods.filter(m => gcStatus(m.id) === 'review_due').sort((a, b) => (S.gc.topics[a.id].due < S.gc.topics[b.id].due ? -1 : 1));

/* ---------- session queue (3, 5 or 10 tasks) ---------- */
function gcQueue(n, mode, topicId) {
  let topics = [];
  if (mode === 'topic' && topicId) topics = [GC.mod[topicId]];
  else if (mode === 'mistakes') {
    const seen = new Set(), list = [];
    S.gc.log.slice().reverse().forEach(l => { if (['bad', 'accent', 'revealed'].includes(l.r) && !seen.has(l.ex) && GC.ex[l.ex]) { seen.add(l.ex); list.push(GC.ex[l.ex]); } });
    return list.slice(0, n).map(x => ({ m: x.m, e: x.e }));
  } else {
    topics = gcDueTopics();
    const rest = GC.mods.filter(m => ['practising', 'introduced'].includes(gcStatus(m.id)))
      .sort((a, b) => ((S.gc.topics[a.id] || {}).t || 0) - ((S.gc.topics[b.id] || {}).t || 0));
    topics = topics.concat(rest);
    if (!topics.length) topics = [gcNextTopic()];
  }
  const out = [];
  const pick = m => {
    const r = S.gc.topics[m.id] || { ex: {} }, day = today();
    return m.exercises.filter(e => mode === 'topic' || e.type !== 'production' || n >= 5)
      .map(e => ({ e, x: r.ex[e.id] || {} }))
      .sort((a, b) => ((a.x.okInd || []).includes(day) - (b.x.okInd || []).includes(day)) || ((a.x.last || 0) - (b.x.last || 0)))
      .map(o => o.e);
  };
  const lists = topics.map(m => ({ m, es: pick(m) }));
  let guard = 0;
  while (out.length < n && guard++ < 60) {
    let added = false;
    for (const l of lists) {
      if (out.length >= n) break;
      const e = l.es.shift();
      if (e && !out.some(o => o.e.id === e.id)) { out.push({ m: l.m, e }); added = true; }
    }
    if (!added) break;
  }
  return out;
}

/* ---------- report for a teacher ---------- */
function gcReport() {
  const d = today(), g = S.gc, lines = [];
  const lab = r => ({ ok: 'верно', accent: 'ошибка в акценте', bad: 'ошибка', revealed: 'ответ показан', variant: 'свой вариант (на проверку)', self_ok: 'самооценка: получилось', self_part: 'самооценка: частично', self_retry: 'самооценка: нужно повторить' }[r] || r);
  lines.push(`Отчёт по грамматике · ${d}`);
  lines.push(`Маршрут: ${gcRouteB2() ? 'продолжение к B2' : 'база и B1'} · ориентир недели: ${g.week}`);
  const byStatus = {};
  GC.mods.forEach(m => { const s = gcStatus(m.id); byStatus[s] = (byStatus[s] || 0) + 1; });
  lines.push('Темы: ' + Object.keys(GC_STATUS).map(s => `${GC_STATUS[s][1]} — ${byStatus[s] || 0}`).join('; '));
  const log = g.log.slice(-60);
  const closed = log.filter(l => GC.ex[l.ex] && GC.ex[l.ex].e.type !== 'production');
  const okInd = closed.filter(l => l.r === 'ok' && !l.hint).length;
  lines.push(`Закрытые задания (последние ${closed.length}): верно без подсказки — ${okInd}; с подсказкой — ${closed.filter(l => l.hint).length}; ответ показан — ${closed.filter(l => l.r === 'revealed').length}.`);
  const errs = log.filter(l => ['bad', 'accent'].includes(l.r) && GC.ex[l.ex]);
  if (errs.length) {
    lines.push('Ошибки:');
    errs.slice(-20).forEach(l => {
      const x = GC.ex[l.ex], dt = new Date(l.t).toISOString().slice(0, 10);
      lines.push(`- ${dt} · ${x.m.title_ru} · «${x.e.stimulus_fr || x.e.prompt_ru}» · ответ: «${l.ans}» · верно: «${gcSolution(x.e)}» (${lab(l.r)})`);
    });
  }
  const prod = Object.entries(g.prod);
  if (prod.length) {
    lines.push('Открытые задания (самооценка, это не проверка преподавателя):');
    prod.slice(-15).forEach(([id, p]) => { const x = GC.ex[id]; if (x) lines.push(`- ${x.m.title_ru}: ${lab(p.self)}${p.teacher ? '; преподаватель: ' + p.teacher : ''}${p.draft ? ' · черновик: «' + p.draft.replace(/\s+/g, ' ') + '»' : ''}`); });
  }
  const cps = Object.entries(g.cp);
  if (cps.length) {
    lines.push('Контрольные блоки:');
    cps.forEach(([id, c]) => { const def = GC.cp[id]; lines.push(`- ${def ? def.stage : id}: закрытых верно самостоятельно ${c.closedOk} из ${c.closedTotal}; попыток ${c.takes}${c.takes > 1 ? ' (повтор не считается независимой проверкой)' : ''}. Это не оценка уровня.`); });
  }
  return lines.join('\n');
}
