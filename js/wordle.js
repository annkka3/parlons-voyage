'use strict';
/* French Wordle: guess a five-letter word from your vocabulary in six tries. Accents are ignored while guessing. */
const WORDLE_ROWS = ['AZERTYUIOP', 'QSDFGHJKLM', '↵WXCVBN⌫'];
function wordlePool() {
  const ok = w => {
    if (w.fr.includes(' / ') || /\s/.test(stripArt(w.fr))) return false;
    return letters(stripArt(w.fr)).length === 5;
  };
  const all = WORDS.filter(ok);
  const known = all.filter(w => S.cards[w.id]);
  return known.length >= 12 ? known : all;
}
function wordleEval(guess, target) {
  const res = Array(5).fill('absent'), pool = target.split('');
  for (let i = 0; i < 5; i++) if (guess[i] === target[i]) { res[i] = 'correct'; pool[i] = null; }
  for (let i = 0; i < 5; i++) {
    if (res[i] === 'correct') continue;
    const j = pool.indexOf(guess[i]);
    if (j >= 0) { res[i] = 'present'; pool[j] = null; }
  }
  return res;
}
function startWordle() {
  const pool = wordlePool();
  if (!pool.length) { toast(tt('No five-letter words found.', 'Нет слов из пяти букв.')); return; }
  const w = rnd(pool), g = { w, target: letters(stripArt(w.fr)), guesses: [], cur: '', keys: {}, status: 'play', hint: false, msg: '' };
  const onkey = e => {
    if (!GAME || GAME.g !== g || g.status !== 'play') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter') { wordleKey(g, '↵'); e.preventDefault(); }
    else if (e.key === 'Backspace') wordleKey(g, '⌫');
    else if (/^[a-zA-Z]$/.test(e.key)) wordleKey(g, e.key.toUpperCase());
  };
  document.addEventListener('keydown', onkey);
  GAME = { g, view: () => wordleView(g), dispose: () => document.removeEventListener('keydown', onkey) };
  renderOverlay();
}
function wordleKey(g, k) {
  if (g.status !== 'play') return;
  g.msg = '';
  if (k === '⌫') g.cur = g.cur.slice(0, -1);
  else if (k === '↵') {
    if (g.cur.length < 5) { g.msg = tt('Five letters needed.', 'Нужно пять букв.'); renderOverlay(); return; }
    const res = wordleEval(g.cur, g.target);
    g.guesses.push({ word: g.cur, res });
    const rank = { absent: 1, present: 2, correct: 3 };
    g.cur.split('').forEach((ch, i) => { if (!g.keys[ch] || rank[res[i]] > rank[g.keys[ch]]) g.keys[ch] = res[i]; });
    if (g.cur === g.target) { g.status = 'won'; logAnswer(g.hint ? 2 : 3, g.hint ? 1 : 0); persist(); speak(g.w.fr); }
    else if (g.guesses.length >= 6) { g.status = 'lost'; logAnswer(0, 0); persist(); speak(g.w.fr); }
    g.cur = '';
  } else if (g.cur.length < 5) g.cur += k;
  renderOverlay();
}
function wordleView(g) {
  const rows = [];
  for (let r = 0; r < 6; r++) {
    const gu = g.guesses[r], cur = r === g.guesses.length && g.status === 'play';
    const tiles = [];
    for (let c = 0; c < 5; c++) {
      let ch = '', cls = 'wd-tile';
      if (gu) { ch = gu.word[c]; cls += ' ' + gu.res[c]; }
      else if (cur) { ch = g.cur[c] || (c === 0 && g.hint && !g.cur ? g.target[0] : ''); if (ch) cls += ' typed'; if (!g.cur[c] && ch) cls += ' ghost'; }
      tiles.push(el('div', { class: cls }, ch));
    }
    rows.push(el('div', { class: 'wd-row' }, tiles));
  }
  const body = [
    el('div', { class: 'row between' }, el('span', { class: 'chip accent' }, 'Wordle'), el('span', { class: 'muted small num' }, `${g.guesses.length}/6`)),
    el('div', { class: 'row wrapr' }, el('span', { class: 'chip hint' }, mean(g.w.kind === 'nm' ? { ru: g.w.ru0, en: g.w.en0 } : g.w)), g.w.tp && (g.guesses.length >= 2 || g.status !== 'play') ? el('span', { class: 'chip' }, TOPIC[g.w.tp].e + ' ' + topicName(g.w.tp)) : null),
    el('div', { class: 'wd-board' }, rows),
    g.msg ? el('div', { class: 'chip bad', style: { alignSelf: 'center' } }, g.msg) : null,
  ];
  if (g.status !== 'play') {
    body.push(el('div', { class: 'verdict ' + (g.status === 'won' ? 'g3' : 'g0') }, el('span', null, g.status === 'won' ? tt('Bravo!', 'Браво!') : tt('The word was:', 'Загаданное слово:'))));
    body.push(detailBlock(g.w, { scene: true }));
  } else {
    body.push(el('div', { class: 'wd-kb' }, WORDLE_ROWS.map(r => el('div', { class: 'wd-krow' }, [...r].map(k => el('button', { type: 'button', class: 'wd-key ' + (g.keys[k] || '') + (k.length && (k === '↵' || k === '⌫') ? ' wide' : ''), 'aria-label': k === '↵' ? 'Enter' : k === '⌫' ? 'Backspace' : k, onclick: () => wordleKey(g, k) }, k))))));
    body.push(el('p', { class: 'muted small', style: { textAlign: 'center' } }, tt('Any five letters count as a guess; accents are ignored.', 'Любые пять букв считаются попыткой; акценты не нужны.')));
  }
  let foot = null;
  if (g.status !== 'play') foot = el('div', { class: 'stack' }, btn(tt('New word', 'Новое слово'), 'primary big block', () => { if (GAME.dispose) GAME.dispose(); startWordle(); }), btn(tt('Close', 'Закрыть'), 'block', closeAll));
  else foot = el('div', { class: 'grid2' }, el('button', { type: 'button', class: 'btn', disabled: g.hint ? true : null, onclick: () => { g.hint = true; renderOverlay(); } }, icon('bulb'), tt('First letter', 'Первая буква')), btn(tt('Give up', 'Сдаться'), '', () => { g.status = 'lost'; logAnswer(0, 0); persist(); speak(g.w.fr); renderOverlay(); }));
  return frame({ progress: g.guesses.length / 6, counter: '', body, foot });
}
