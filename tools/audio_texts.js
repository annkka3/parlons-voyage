// Collects every French text the app can speak and writes tools/audio_texts.json: [{key, text}].
// Run: node tools/audio_texts.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const ctx = { console, document: { createTextNode() {}, createElement() { return {}; } }, window: {}, Math, Date, Object, Set, Map, JSON };
vm.createContext(ctx);
// grammar.js declares a global named X and data.js a global named T_; evaluate in one context like the browser does
const code = ['js/vocab.js', 'js/data.js', 'js/grammar.js', 'js/audio.js'].map(read).join('\n');
vm.runInContext(code + '\n;globalThis.__out = { PH, WORDS, LESSONS, SCEN, frNum, clipText, clipKey };', ctx);
const { PH, WORDS, LESSONS, SCEN, frNum, clipText, clipKey } = ctx.__out;
const texts = new Map();
const add = t => { const c = clipText(t); if (c && !/[А-Яа-яЁё]/.test(c)) texts.set(clipKey(t), c); };   // Russian is never recorded with the French voice
PH.forEach(p => add(p.fr));
WORDS.forEach(w => add(w.fr));
// grammar: examples, sentences after each exercise (mirrors fillSentence in js/lessons.js)
const fillSentence = (q, ans) => { const a = ans.replace(/\s*\(.*?\)\s*$/, ''), base = q.replace(/\s*\(.*?\)\s*$/, ''); return a.endsWith('’') ? base.replace('___ ', a) : base.replace('___', a); };
LESSONS.forEach(l => {
  l.ex.forEach(e => add(e[0]));
  l.quiz.forEach(q => { if (q.t === 'build') add(q.a); else add(fillSentence(q.q, q.t === 'mc' ? q.o[q.a] : q.a[0])); });
});
// year grammar course: examples, the solution of every task (read aloud only after an attempt) and the verb infinitives
// (mirrors gcSolution in js/gc_core.js)
const gc = JSON.parse(read('data/grammar_course.json'));
const gcSol = e => e.type === 'cloze' ? e.stimulus_fr.replace('___', e.accepted_answers[0]).replace(/\s*\([^)]*\)\s*$/, '').replace(/([’'])\s+/g, '$1')
  : e.type === 'transform' ? e.accepted_answers[0] : e.type === 'choice' ? e.options.find(o => o.id === e.correct_option_id).text : (e.model_answer_fr || '');
gc.modules.forEach(m => { m.examples.forEach(x => add(x.tts_text)); m.exercises.forEach(e => add(gcSol(e))); });
gc.checkpoints.forEach(c => c.exercises.forEach(e => add(gcSol(e))));
gc.verb_reference.items.forEach(v => add(v.infinitive));
// dialogues: sample every scenario many times so each random variant is covered
SCEN.forEach(sc => { for (let i = 0; i < 6000; i++) sc.build().forEach(s => add(s.fr)); });
// numbers and the money words, played one after another for prices
for (let n = 0; n <= 100; n++) add(frNum(n));
add('euro'); add('euros');
const out = [...texts.entries()].map(([key, text]) => ({ key, text })).sort((a, b) => a.text.localeCompare(b.text));
fs.writeFileSync(path.join(__dirname, 'audio_texts.json'), JSON.stringify(out, null, 0));
console.log('texts', out.length, 'chars', out.reduce((s, o) => s + o.text.length, 0));
console.log('collisions', out.length - new Set(out.map(o => o.key)).size);
