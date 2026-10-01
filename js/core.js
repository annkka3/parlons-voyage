'use strict';
/* ---------- tiny DOM helpers ---------- */
const $ = (s, e) => (e || document).querySelector(s);
function el(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return e;
}

/* ---------- state (local-first, one local copy per account) ---------- */
const LS_ANON = 'pv_state_v1', LS_UID = 'pv_last_uid', DEV_KEY = 'pv_dev_v1';
const defCfg = () => ({ lang: 'en', tr: 'both', ans: 'speak', accent: true, perDay: 7, perDayWords: 10, order: 'travel' });
const freshGc = () => ({ v: 1, t: 0, rt: 0, route: 'b1_core', week: 1, topics: {}, log: [], prod: {}, cp: {} });
const freshState = () => ({ v: 1, cfg: defCfg(), cfgT: 0, cards: {}, days: {}, gram: {}, rst: 0, gc: freshGc() });
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
const keyFor = uid => (uid ? LS_ANON + '_' + uid : LS_ANON);
function parseState(raw) {
  try {
    const s = JSON.parse(raw);
    if (s && s.v === 1) {
      s.cfg = Object.assign(defCfg(), s.cfg); s.cards = s.cards || {}; s.days = s.days || {}; s.gram = s.gram || {};
      s.rst = s.rst || 0; s.cfgT = s.cfgT || 0;
      if (!s.gc || s.gc.v !== 1) {
        // first start with the year grammar course: keep a copy of the state as it was before
        if (Object.keys(s.cards).length && lsGet('pv_backup_pre_gc') == null) lsSet('pv_backup_pre_gc', raw);
        s.gc = freshGc();
      }
      return s;
    }
  } catch (e) { /* ignore */ }
  return null;
}
// Whoever signed in last on this device owns the local copy; a signed-out device has its own anonymous copy.
let CUR_UID = lsGet(LS_UID) || null;
let S = parseState(lsGet(keyFor(CUR_UID))) || freshState();
const saveLocal = () => lsSet(keyFor(CUR_UID), JSON.stringify(S));
const hasProgress = s => Object.keys(s.cards).length > 0 || Object.keys(s.days).length > 0 || Object.keys(s.gram).length > 0;
function switchAccount(uid) {
  if (uid === CUR_UID) return;
  saveLocal();
  const outgoing = S, wasAnon = CUR_UID === null;
  CUR_UID = uid;
  if (uid) lsSet(LS_UID, uid); else lsDel(LS_UID);
  let incoming = parseState(lsGet(keyFor(uid)));
  if (!incoming) {
    if (uid && wasAnon && hasProgress(outgoing)) { incoming = outgoing; lsSet(keyFor(null), JSON.stringify(freshState())); } // first sign-in on this device keeps what was practised before signing in
    else incoming = freshState();
  }
  S = incoming; dirtyCards.clear(); metaDirty = false; gcDirty = false;
  saveLocal();
}
let DEV = (() => {
  let d = {};
  try { d = JSON.parse(lsGet(DEV_KEY)) || {}; } catch (e) { /* ignore */ }
  return Object.assign({ voice: '', rate: 0.95, loud: true }, d);
})();
const dirtyCards = new Set();
let metaDirty = false, gcDirty = false;
function saveDev() { lsSet(DEV_KEY, JSON.stringify(DEV)); }
function persist() {
  saveLocal();
  Cloud.soon();
}
function setCfg(patch) {
  Object.assign(S.cfg, patch); S.cfgT = Date.now(); metaDirty = true; persist();
}
const tt = (en, ru) => (S.cfg.lang === 'ru' ? ru : en);
const mean = it => (S.cfg.lang === 'ru' ? it.ru : it.en);          // the prompt language
const meanAlt = it => (S.cfg.lang === 'ru' ? it.en : it.ru);       // the extra-hint language
const noteOf = it => (S.cfg.lang === 'ru' ? it.nr : it.ne);
const dayName = d => tt(DAY[d].en, DAY[d].ru);
const topicName = id => tt(TOPIC[id].en, TOPIC[id].ru);
const placeOf = it => (it.d ? dayName(it.d) : it.tp ? topicName(it.tp) : '');

/* ---------- dates ---------- */
function dstr(d) { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
const today = () => dstr();
function addDays(ds, n) { const [y, m, d] = ds.split('-').map(Number); return dstr(new Date(y, m - 1, d + n)); }
function daysBetween(a, b) { const f = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((f(b) - f(a)) / 864e5); }
function whenLabel(ds) {
  const n = daysBetween(today(), ds);
  if (n <= 0) return tt('today', 'сегодня');
  if (n === 1) return tt('tomorrow', 'завтра');
  return tt(`in ${n} days`, `через ${n} дн.`);
}

/* ---------- spaced repetition (Leitner boxes) ---------- */
// box 1..6, interval in days. Box 6 counts as "mastered".
const INT = [0, 1, 3, 7, 14, 30, 60];
function statusOf(id) {
  const r = S.cards[id];
  if (!r || r.b < 1) return 'new';
  if (r.b <= 2) return 'learning';
  if (r.b <= 4) return 'review';
  return 'strong';
}
const isDue = r => r && r.b >= 1 && r.due <= today();
// grade: 3 = clean, 2 = right with help, 1 = needed lots of help, 0 = missed
function applyGrade(id, grade) {
  const r = S.cards[id] || { b: 0, n: 0, l: 0, c: 0, h: 0, f: today(), t: 0, due: today() };
  r.n++; r.t = Date.now();
  if (grade === 3) { r.b = Math.min(6, r.b + 1); r.c++; if (r.c >= 2) r.h = 0; }
  else if (grade === 2) { r.b = Math.max(1, r.b); r.c = 0; }
  else { r.b = 1; r.c = 0; r.h = 1; if (grade === 0) r.l++; }
  const gap = grade === 2 ? Math.max(1, Math.ceil(INT[r.b] / 2)) : INT[r.b];
  r.due = addDays(today(), gap);
  S.cards[id] = r;
  dirtyCards.add(id);
  return r;
}
function logAnswer(grade, hints) {
  const t = today();
  const d = S.days[t] || { a: 0, k: 0, h: 0, t: 0 };
  d.a++; if (grade === 3) d.k++; d.h += hints; d.t = Date.now();
  S.days[t] = d; metaDirty = true;
}
function markLesson(id, score, total) {
  const g = S.gram[id] || { s: 0, n: total, t: 0 };
  g.s = Math.max(g.s, score); g.n = total; g.t = Date.now();
  S.gram[id] = g; metaDirty = true;
}
function streak() {
  let n = 0, d = today();
  if (!(S.days[d] && S.days[d].a > 0)) d = addDays(d, -1);
  while (S.days[d] && S.days[d].a > 0) { n++; d = addDays(d, -1); }
  return n;
}
const dueItems = () => ITEMS.filter(it => isDue(S.cards[it.id]));
const hardItems = () => ITEMS.filter(it => S.cards[it.id] && S.cards[it.id].h === 1);
const newPhrases = () => PH.filter(p => !S.cards[p.id]);
const newWords = () => wordSequence(S.cfg.order).filter(w => !S.cards[w.id]);
function quotaLeft(kindIsWord) {
  const t = today();
  const used = ITEMS.filter(x => (x.kind !== 'ph') === kindIsWord && S.cards[x.id] && S.cards[x.id].f === t).length;
  return Math.max(0, (kindIsWord ? S.cfg.perDayWords : S.cfg.perDay) - used);
}
const newQuotaLeft = () => quotaLeft(false);
const newWordQuotaLeft = () => quotaLeft(true);

/* ---------- text helpers ---------- */
function norm(s, fold) {
  s = String(s).normalize('NFC').toLowerCase().replace(/[’‘`´]/g, "'").replace(/œ/g, 'oe').replace(/æ/g, 'ae');
  if (fold) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return s.replace(/[.,!?;:«»"“”()€/]/g, ' ').replace(/['\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
}
const toks = (s, fold) => { const n = norm(s, fold); return n ? n.split(' ') : []; };
const eqArr = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
// one letters-only word, accents removed (crossword, wordle)
const letters = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae').toUpperCase().replace(/[^A-Z]/g, '');
function stripArt(s) {
  return s.replace(/’/g, "'").replace(/^(un|une|le|la|les|des|du|de la|de l'|l'|d')\s*/i, '');
}
function matchAnswer(it, typed, fold) {
  const t = toks(typed, fold);
  const full = toks(it.fr, fold);
  if (eqArr(t, full)) return { ok: true };
  if (it.kind !== 'ph') {
    const forms = it.fr.split(' / ');
    for (const f of forms) {
      if (eqArr(t, toks(f, fold)) || eqArr(t, toks(stripArt(f), fold))) return { ok: true };
    }
  } else {
    const svp = toks('s’il vous plaît', fold);
    if (full.length > svp.length && eqArr(full.slice(-svp.length), svp) && eqArr(t, full.slice(0, -svp.length))) return { ok: true, noSvp: true };
  }
  const pool = full.slice(); let hit = 0;
  t.forEach(w => { const i = pool.indexOf(w); if (i >= 0) { hit++; pool.splice(i, 1); } });
  return { ok: false, hit, total: full.length };
}
// Masked text as DOM nodes: letters become blanks, 'init' keeps the first letter of each word.
function maskNodes(text, mode) {
  const out = []; let buf = '', prev = false;
  const flush = () => { if (buf) { out.push(document.createTextNode(buf)); buf = ''; } };
  for (const ch of text) {
    if (/\p{L}/u.test(ch)) {
      flush();
      out.push(mode === 'init' && !prev ? el('b', null, ch) : el('i', { class: 'bl' }));
      prev = true;
    } else { buf += ch; prev = false; }
  }
  flush();
  return out;
}
function exampleFor(it) {
  if (it.kind !== 'wd' || it.fr.includes(' / ')) return null;
  const full = it.fr.replace(/’/g, "'").toLowerCase();
  const noun = stripArt(it.fr).toLowerCase();
  if (noun.length < 3) return null;
  for (const p of PH) {
    const hay = p.fr.replace(/’/g, "'").toLowerCase();
    let at = hay.indexOf(full);
    if (at >= 0) at += full.length - noun.length; else at = hay.indexOf(noun);
    if (at < 0) continue;
    return [document.createTextNode(p.fr.slice(0, at)), ...maskNodes(p.fr.slice(at, at + noun.length), 'blank'), document.createTextNode(p.fr.slice(at + noun.length))];
  }
  return null;
}
function trLines(it) {
  const m = S.cfg.tr, out = [];
  if (m === 'ipa' || m === 'both') out.push(el('div', { class: 'ipa', title: 'IPA' }, '/' + it.ipa + '/'));
  if (m === 'cy' || m === 'both') out.push(el('div', { class: 'cy', title: tt('Read it like this', 'Читается так') }, it.cy));
  return out;
}

/* ---------- speech (device voice) ---------- */
const TTS = { voices: [] };
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  TTS.voices = speechSynthesis.getVoices().filter(v => /^fr/i.test(v.lang));
}
if ('speechSynthesis' in window) {
  loadVoices();
  try { speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch (e) { speechSynthesis.onvoiceschanged = loadVoices; }
}
function bestVoice() {
  if (DEV.voice) { const v = TTS.voices.find(x => x.voiceURI === DEV.voice); if (v) return v; }
  const sc = v => (/fr[-_]FR/i.test(v.lang) ? 100 : 0) + (/premium|enhanced|siri/i.test(v.name + v.voiceURI) ? 40 : 0) + (v.localService ? 10 : 0) + (/thomas|audrey|amélie|aurélie|marie/i.test(v.name) ? 5 : 0);
  return TTS.voices.slice().sort((a, b) => sc(b) - sc(a))[0] || null;
}
// The iPhone mutes the device voice (speechSynthesis) when the silent switch is on and no web trick reliably
// changes that. So the app plays recorded clips (js/audio.js): they count as media playback and ignore the switch.
// The device voice is the fallback for texts without a clip, and the choice when "Sound in silent mode" is off.
let curUtt = null, unlocked = false;
function audioMode() {
  try { if (navigator.audioSession) navigator.audioSession.type = DEV.loud ? 'playback' : 'auto'; } catch (e) { /* not supported */ }
  if (!DEV.loud) AudioPlayer.stop();
}
// Safari only lets a page play sound after a real tap (touchend/click/key), so unlock audio and speech on the first one.
function unlockSpeech() {
  AudioPlayer.unlock();
  if (!unlocked && 'speechSynthesis' in window) {
    unlocked = true;
    try { const u = new SpeechSynthesisUtterance(''); u.volume = 0; speechSynthesis.speak(u); } catch (e) { /* ignore */ }
  }
}
['touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlockSpeech, { capture: true, passive: true }));
audioMode();

function speakTTS(text, slow) {
  const ss = window.speechSynthesis;
  if (!ss) { toast(tt('This browser cannot speak.', 'Этот браузер не умеет озвучивать.')); return; }
  try {
    if (!TTS.voices.length) loadVoices();
    const u = new SpeechSynthesisUtterance(String(text).replace(/ \/ /g, ', '));
    const v = bestVoice();
    u.lang = v ? v.lang : 'fr-FR'; if (v) u.voice = v;
    u.rate = slow ? Math.max(0.45, DEV.rate - 0.32) : DEV.rate;
    u.onerror = e => { if (e && e.error && e.error !== 'interrupted' && e.error !== 'canceled') toast(tt('Sound problem: ', 'Проблема со звуком: ') + e.error); };
    curUtt = u; // keep a reference: Safari can drop an utterance that is only held by the queue
    if (ss.resume) ss.resume();
    // cancel() and speak() in the same tick can leave iOS silent, so cancel only when something is playing and wait a moment
    if (ss.speaking || ss.pending) { ss.cancel(); setTimeout(() => ss.speak(u), 80); } else ss.speak(u);
  } catch (e) { /* ignore */ }
}
function speak(text, slow) {
  if (DEV.loud && AudioPlayer.has(text)) {
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    AudioPlayer.play(text, slow).catch(() => speakTTS(text, slow));
  } else { AudioPlayer.stop(); speakTTS(text, slow); }
}
// A price is played as separate clips: twelve, euros, fifty
function speakParts(parts, slow) {
  if (DEV.loud && parts.every(p => AudioPlayer.has(p))) {
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    AudioPlayer.play(parts, slow).catch(() => speakTTS(parts.join(' '), slow));
  } else { AudioPlayer.stop(); speakTTS(parts.join(' '), slow); }
}
const sayIt = (it, slow) => (it.parts ? speakParts(it.parts, slow) : speak(it.fr, slow));

/* ---------- toast ---------- */
let toastTm;
function toast(msg) {
  let t = $('#toast');
  if (!t) { t = el('div', { id: 'toast', class: 'toast', role: 'status' }); document.body.append(t); }
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastTm); toastTm = setTimeout(() => t.classList.remove('on'), 2600);
}

/* ---------- merging progress between devices ---------- */
// A card is replaced by the copy with the newer last-answer time.
function adoptCard(id, d) {
  if (!d || (d.t || 0) < S.rst) return false;
  const l = S.cards[id];
  if (!l || (d.t || 0) > (l.t || 0)) { S.cards[id] = d; return true; }
  return false;
}
// Settings, daily stats and lesson results: newest settings win, per-day and per-lesson records keep the larger one.
function adoptMeta(d) {
  if (!d) return false;
  const before = JSON.stringify([S.cfg, S.days, S.gram, S.rst]);
  S.rst = Math.max(S.rst || 0, d.rst || 0);
  if ((d.cfgT || 0) > (S.cfgT || 0)) { S.cfg = Object.assign(defCfg(), d.cfg); S.cfgT = d.cfgT; }
  Object.keys(d.days || {}).forEach(k => { const x = S.days[k], y = d.days[k]; if ((y.t || 0) >= S.rst && (!x || (y.a || 0) > (x.a || 0))) S.days[k] = y; });
  Object.keys(d.gram || {}).forEach(k => { const x = S.gram[k], y = d.gram[k]; if (!x || (y.t || 0) > (x.t || 0)) S.gram[k] = y; });
  Object.keys(S.cards).forEach(id => { if ((S.cards[id].t || 0) < S.rst) delete S.cards[id]; });
  if (S.gc) { Object.keys(S.gc.topics).forEach(id => { if ((S.gc.topics[id].t || 0) < S.rst) delete S.gc.topics[id]; }); S.gc.log = S.gc.log.filter(l => (l.t || 0) >= S.rst); }
  return before !== JSON.stringify([S.cfg, S.days, S.gram, S.rst]);
}
// Grammar progress: per topic the newer copy wins, the attempt log and open-task records are merged.
function adoptGc(d) {
  if (!d || d.v !== 1) return false;
  const g = S.gc, before = JSON.stringify(g);
  Object.keys(d.topics || {}).forEach(id => { const y = d.topics[id], x = g.topics[id]; if ((y.t || 0) >= S.rst && (!x || (y.t || 0) > (x.t || 0))) g.topics[id] = y; });
  const seen = new Set(g.log.map(l => l.id));
  (d.log || []).forEach(l => { if (!seen.has(l.id) && (l.t || 0) >= S.rst) { g.log.push(l); seen.add(l.id); } });
  g.log.sort((a, b) => a.t - b.t); if (g.log.length > 300) g.log = g.log.slice(-300);
  Object.keys(d.prod || {}).forEach(id => { const y = d.prod[id], x = g.prod[id]; if (!x || (y.t || 0) > (x.t || 0)) g.prod[id] = y; });
  Object.keys(d.cp || {}).forEach(id => { const y = d.cp[id], x = g.cp[id]; if (!x || (y.t || 0) > (x.t || 0)) g.cp[id] = y; });
  if ((d.rt || 0) > (g.rt || 0)) { g.route = d.route; g.week = d.week; g.rt = d.rt; }
  g.t = Math.max(g.t || 0, d.t || 0);
  return before !== JSON.stringify(g);
}
const metaPayload = () => JSON.parse(JSON.stringify({ v: 1, cfg: S.cfg, cfgT: S.cfgT, days: S.days, gram: S.gram, rst: S.rst }));

/* ---------- cloud sync (Firebase, same project and rules as the other app) ---------- */
const Cloud = {
  api: null, user: null, status: 'local', tm: null, remote: {}, firstCards: true, firstMeta: true, firstGc: true, unsubs: [],
  configured: !!window.FIREBASE_CONFIG,
  soon() { if (!this.api) return; clearTimeout(this.tm); this.tm = setTimeout(() => this.flush(), 1000); },
  flush() {
    if (!this.api) return;
    dirtyCards.forEach(id => { const r = S.cards[id]; if (r) this.api.setCard(id, r); });
    dirtyCards.clear();
    if (metaDirty) { this.api.setMeta(metaPayload()); metaDirty = false; }
    if (gcDirty && this.api.setGc) { this.api.setGc(JSON.parse(JSON.stringify(S.gc))); gcDirty = false; }
  },
  setStatus(meta) {
    this.status = !navigator.onLine ? 'offline' : (meta && (meta.hasPendingWrites || meta.fromCache)) ? 'syncing' : 'synced';
    refreshBadge();
  },
  fail(e) { this.status = (e && e.code === 'permission-denied') ? 'denied' : 'error'; refreshBadge(); },
  attach(user, api) {
    this.detach(); this.user = user; this.api = api; this.status = 'syncing'; this.remote = {};
    this.firstCards = true; this.firstMeta = true; this.firstGc = true; refreshBadge();
    this.unsubs.push(api.onCards((changes, meta) => {
      let changed = false;
      changes.forEach(ch => {
        if (ch.type === 'removed') return;
        this.remote[ch.id] = (ch.data && ch.data.t) || 0;
        if (adoptCard(ch.id, ch.data)) changed = true;
      });
      if (this.firstCards && !meta.fromCache) {
        this.firstCards = false;
        Object.keys(S.cards).forEach(id => { if (!(id in this.remote) || (S.cards[id].t || 0) > this.remote[id]) dirtyCards.add(id); });
        this.flush();
      }
      if (changed) { saveLocal(); onRemoteChange(); }
      this.setStatus(meta);
    }, e => this.fail(e)));
    this.unsubs.push(api.onMeta((data, meta) => {
      const changed = adoptMeta(data);
      if (this.firstMeta && !meta.fromCache) { this.firstMeta = false; metaDirty = true; this.flush(); }
      if (changed) { saveLocal(); onRemoteChange(); }
      this.setStatus(meta);
    }, e => this.fail(e)));
    if (api.onGc) this.unsubs.push(api.onGc((data, meta) => {
      const changed = adoptGc(data);
      if (this.firstGc && !meta.fromCache) { this.firstGc = false; gcDirty = true; this.flush(); }
      if (changed) { saveLocal(); onRemoteChange(); }
      this.setStatus(meta);
    }, e => this.fail(e)));
  },
  detach() { this.unsubs.forEach(u => { try { u(); } catch (e) { /* ignore */ } }); this.unsubs = []; this.api = null; this.user = null; this.status = 'local'; },
};
window.__onAuth = (user, api) => {
  if (user && api) { switchAccount(user.uid); Cloud.attach(user, api); } else { Cloud.detach(); switchAccount(null); }
  refreshBadge(); if (typeof render === 'function' && !SES && !GAME) render();
};
window.addEventListener('online', () => { if (Cloud.api) { Cloud.status = 'syncing'; refreshBadge(); Cloud.flush(); } });
window.addEventListener('offline', () => { if (Cloud.api) { Cloud.status = 'offline'; refreshBadge(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) Cloud.flush(); });

/* ---------- backup ---------- */
const exportCode = () => JSON.stringify(S);
function importCode(txt) {
  const o = JSON.parse(txt);
  if (!o || o.v !== 1 || typeof o.cards !== 'object') throw new Error('bad');
  Object.keys(o.cards).forEach(id => { if (adoptCard(id, o.cards[id])) dirtyCards.add(id); });
  adoptMeta(o); metaDirty = true;
  if (o.gc && adoptGc(o.gc)) gcDirty = true;
  persist();
}
function resetAll() {
  const keep = Object.assign({}, S.cfg), keepT = S.cfgT;
  S = freshState(); S.cfg = keep; S.cfgT = Math.max(keepT, Date.now()); S.rst = Date.now();
  dirtyCards.clear(); metaDirty = true; gcDirty = true;
  persist();
}
