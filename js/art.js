'use strict';
/* Small original illustrations (inline SVG), the croissant mascot, passport stamps and the confetti burst.
   Colours come from CSS variables (--c-*) so the art follows light and dark themes. */
const SVGNS = 'http://www.w3.org/2000/svg';
function SV(tag, attrs, ...kids) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
  kids.flat().forEach(c => { if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(c)); });
  return n;
}
const INK = 'var(--c-ink)';     // outlines: dark on light themes, light on dark ones
const FACE = 'var(--c-face)';   // always dark: eyes, letters on bright shapes
const ART = {
  headphones: () => [
    SV('path', { d: 'M13 38 C13 19 21 11 32 11 C43 11 51 19 51 38', fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round' }),
    SV('rect', { x: 8, y: 34, width: 14, height: 21, rx: 7, fill: 'var(--c-red)' }), SV('rect', { x: 42, y: 34, width: 14, height: 21, rx: 7, fill: 'var(--c-red)' }),
    SV('rect', { x: 11, y: 38, width: 5, height: 13, rx: 2.5, fill: 'rgba(255,255,255,.55)' }), SV('rect', { x: 48, y: 38, width: 5, height: 13, rx: 2.5, fill: 'rgba(255,255,255,.55)' }),
  ],
  puzzle: () => [
    SV('path', { d: 'M14 18 H26 a6 6 0 1 1 12 0 H50 V30 a6 6 0 1 1 0 12 V54 H38 a6 6 0 1 0 -12 0 H14 V42 a6 6 0 1 0 0 -12 Z', fill: 'var(--c-sun)', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
    SV('circle', { cx: 32, cy: 36, r: 4, fill: 'rgba(255,255,255,.7)' }),
  ],
  cards: () => [
    SV('rect', { x: 9, y: 14, width: 28, height: 38, rx: 5, fill: 'var(--c-blue)', transform: 'rotate(-12 23 33)' }),
    SV('text', { x: 23, y: 40, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, fill: '#fff', transform: 'rotate(-12 23 33)', style: 'font-family:var(--f-display)' }, '?'),
    SV('rect', { x: 28, y: 12, width: 28, height: 38, rx: 5, fill: '#fff', stroke: INK, 'stroke-width': 2.5, transform: 'rotate(10 42 31)' }),
    SV('path', { d: 'M42 38 l-7 -8 a4.5 4.5 0 0 1 7 -5.5 a4.5 4.5 0 0 1 7 5.5 z', fill: 'var(--c-red)', transform: 'rotate(10 42 31)' }),
  ],
  coin: () => [
    SV('circle', { cx: 32, cy: 33, r: 23, fill: 'var(--c-sun)', stroke: INK, 'stroke-width': 2.5 }),
    SV('circle', { cx: 32, cy: 33, r: 17, fill: 'none', stroke: 'rgba(29,42,74,.35)', 'stroke-width': 2, 'stroke-dasharray': '3 3' }),
    SV('text', { x: 32, y: 42, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 800, fill: FACE, style: 'font-family:var(--f-display)' }, '€'),
  ],
  bubbles: () => [
    SV('path', { d: 'M10 14 h30 a6 6 0 0 1 6 6 v14 a6 6 0 0 1 -6 6 h-16 l-9 8 v-8 h-5 a6 6 0 0 1 -6 -6 v-14 a6 6 0 0 1 6 -6 z', fill: 'var(--c-blue)' }),
    SV('circle', { cx: 19, cy: 27, r: 2.6, fill: '#fff' }), SV('circle', { cx: 28, cy: 27, r: 2.6, fill: '#fff' }), SV('circle', { cx: 37, cy: 27, r: 2.6, fill: '#fff' }),
    SV('path', { d: 'M34 36 h16 a6 6 0 0 1 6 6 v6 a6 6 0 0 1 -6 6 h-2 v6 l-8 -6 h-6 a6 6 0 0 1 -6 -6 v-6 a6 6 0 0 1 6 -6 z', fill: '#fff', stroke: INK, 'stroke-width': 2.2, transform: 'translate(-2 -4)' }),
  ],
  grid: () => {
    const cells = [[0, 0, 'var(--c-white)'], [1, 0, 'var(--c-blue)'], [2, 0, 'var(--c-white)'], [0, 1, 'var(--c-sun)'], [1, 1, 'var(--c-white)'], [2, 1, 'var(--c-green)'], [0, 2, 'var(--c-white)'], [1, 2, 'var(--c-rose)'], [2, 2, 'var(--c-white)']];
    return cells.map(([x, y, f]) => SV('rect', { x: 9 + x * 16, y: 9 + y * 16, width: 14, height: 14, rx: 3, fill: f, stroke: INK, 'stroke-width': 2 }));
  },
  tiles: () => [
    ['F', 'var(--c-green)', 4], ['R', 'var(--c-sun)', 24], ['?', 'var(--c-white)', 44],
  ].flatMap(([ch, f, x]) => [SV('rect', { x, y: 20, width: 17, height: 24, rx: 4, fill: f, stroke: INK, 'stroke-width': 2.2 }), SV('text', { x: x + 8.5, y: 38, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: FACE, style: 'font-family:var(--f-display)' }, ch)]),
  book: () => [
    SV('path', { d: 'M32 17 C25 12 15 12 8 15 V50 C15 47 25 47 32 52 Z', fill: 'var(--c-white)', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
    SV('path', { d: 'M32 17 C39 12 49 12 56 15 V50 C49 47 39 47 32 52 Z', fill: 'var(--c-sky)', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
    SV('path', { d: 'M14 23 C18 22 22 22 26 24 M14 30 C18 29 22 29 26 31 M14 37 C18 36 22 36 26 38', fill: 'none', stroke: 'rgba(29,42,74,.45)', 'stroke-width': 2, 'stroke-linecap': 'round' }),
  ],
  croissant: () => [
    SV('g', { stroke: 'var(--c-crust2)', 'stroke-width': 2, 'stroke-linejoin': 'round' },
      SV('ellipse', { cx: 12, cy: 41, rx: 7, ry: 10, transform: 'rotate(-58 12 41)', fill: 'var(--c-crust)' }),
      SV('ellipse', { cx: 52, cy: 41, rx: 7, ry: 10, transform: 'rotate(58 52 41)', fill: 'var(--c-crust)' }),
      SV('ellipse', { cx: 22, cy: 31, rx: 10, ry: 14, transform: 'rotate(-30 22 31)', fill: 'var(--c-crust)' }),
      SV('ellipse', { cx: 42, cy: 31, rx: 10, ry: 14, transform: 'rotate(30 42 31)', fill: 'var(--c-crust)' }),
      SV('ellipse', { cx: 32, cy: 28, rx: 12, ry: 16, fill: 'var(--c-dough)' })),
    SV('path', { d: 'M24 18 C28 16 36 16 40 18 M22 28 C27 26 37 26 42 28', fill: 'none', stroke: 'var(--c-crust2)', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.7 }),
  ],
  coffee: () => [
    SV('path', { d: 'M24 12 c-3 4 3 6 0 10 M32 10 c-3 4 3 6 0 10 M40 12 c-3 4 3 6 0 10', fill: 'none', stroke: 'rgba(29,42,74,.4)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
    SV('path', { d: 'M12 26 h36 v8 a16 16 0 0 1 -16 16 h-4 a16 16 0 0 1 -16 -16 z', fill: 'var(--c-white)', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
    SV('path', { d: 'M48 29 h3 a6 6 0 0 1 0 12 h-5', fill: 'none', stroke: INK, 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
    SV('path', { d: 'M12 26 h36 v5 h-36 z', fill: 'var(--c-red)' }), SV('ellipse', { cx: 30, cy: 56, rx: 20, ry: 3.5, fill: 'rgba(29,42,74,.18)' }),
  ],
  suitcase: () => [
    SV('path', { d: 'M24 18 v-4 a4 4 0 0 1 4 -4 h8 a4 4 0 0 1 4 4 v4', fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' }),
    SV('rect', { x: 8, y: 18, width: 48, height: 34, rx: 7, fill: 'var(--c-red)', stroke: INK, 'stroke-width': 2.5 }),
    SV('rect', { x: 18, y: 18, width: 5, height: 34, fill: 'rgba(29,42,74,.28)' }), SV('rect', { x: 41, y: 18, width: 5, height: 34, fill: 'rgba(29,42,74,.28)' }),
    SV('circle', { cx: 32, cy: 35, r: 6, fill: 'var(--c-sun)', stroke: INK, 'stroke-width': 2 }),
  ],
  pin: () => [
    SV('path', { d: 'M32 56 C21 42 16 34 16 26 a16 16 0 0 1 32 0 c0 8 -5 16 -16 30 z', fill: 'var(--c-red)', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
    SV('circle', { cx: 32, cy: 26, r: 6, fill: '#fff' }),
  ],
  ticket: () => [
    SV('path', { d: 'M8 20 h48 v8 a4 4 0 0 0 0 8 v8 h-48 v-8 a4 4 0 0 0 0 -8 z', fill: 'var(--c-sun)', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
    SV('path', { d: 'M42 21 v22', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '3 3' }), SV('path', { d: 'M15 30 h20 M15 36 h14', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' }),
  ],
  flame: () => [
    SV('path', { d: 'M32 6 C34 18 46 22 46 38 a14 14 0 0 1 -28 0 c0 -8 5 -12 8 -17 c1 5 4 7 6 7 c1 -7 -2 -13 0 -22 z', fill: 'var(--c-red)' }),
    SV('path', { d: 'M32 28 c1 6 8 9 8 17 a8 8 0 0 1 -16 0 c0 -5 4 -7 8 -17 z', fill: 'var(--c-sun)' }),
  ],
  star: () => [SV('path', { d: 'M32 6 l7.5 16 17 2 -12.5 12 3.5 17 -15.5 -8.5 -15.5 8.5 3.5 -17 -12.5 -12 17 -2 z', fill: 'var(--c-sun)', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' })],
  metro: () => [
    SV('circle', { cx: 32, cy: 32, r: 24, fill: 'var(--c-blue)', stroke: INK, 'stroke-width': 2.5 }),
    SV('path', { d: 'M18 44 V22 l14 14 14 -14 v22', fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  ],
  bell: () => [
    SV('path', { d: 'M12 46 a20 20 0 0 1 40 0 z', fill: 'var(--c-sun)', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
    SV('circle', { cx: 32, cy: 22, r: 4, fill: FACE }), SV('rect', { x: 8, y: 46, width: 48, height: 6, rx: 3, fill: 'var(--c-red)', stroke: INK, 'stroke-width': 2 }),
  ],
};
function art(name, size, cls) {
  const s = SV('svg', { viewBox: '0 0 64 64', width: size || 48, height: size || 48, 'aria-hidden': 'true', class: 'art' + (cls ? ' ' + cls : '') });
  (ART[name] ? ART[name]() : []).forEach(n => s.append(n));
  return s;
}

/* ---------- mascot: a croissant who teaches French ---------- */
function mascot(mood, size, cls) {
  const s = SV('svg', { viewBox: '0 0 100 84', width: size || 64, height: Math.round((size || 64) * 0.84), class: 'mascot ' + (cls || ''), role: 'img', 'aria-label': 'mascot' });
  s.append(SV('ellipse', { cx: 50, cy: 78, rx: 30, ry: 4, fill: 'rgba(29,42,74,.16)' }));
  s.append(SV('g', { stroke: 'var(--c-crust2)', 'stroke-width': 2.4, 'stroke-linejoin': 'round' },
    SV('ellipse', { cx: 13, cy: 56, rx: 9, ry: 13, transform: 'rotate(-56 13 56)', fill: 'var(--c-crust)' }),
    SV('ellipse', { cx: 87, cy: 56, rx: 9, ry: 13, transform: 'rotate(56 87 56)', fill: 'var(--c-crust)' }),
    SV('ellipse', { cx: 29, cy: 42, rx: 14, ry: 19, transform: 'rotate(-30 29 42)', fill: 'var(--c-crust)' }),
    SV('ellipse', { cx: 71, cy: 42, rx: 14, ry: 19, transform: 'rotate(30 71 42)', fill: 'var(--c-crust)' }),
    SV('ellipse', { cx: 50, cy: 40, rx: 19, ry: 25, fill: 'var(--c-dough)' })));
  s.append(SV('path', { d: 'M38 22 C44 19 56 19 62 22 M16 46 C20 41 24 40 28 41 M72 41 C76 40 80 41 84 46', fill: 'none', stroke: 'var(--c-crust2)', 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0.55 }));
  // face
  const eye = (x, y) => [SV('ellipse', { cx: x, cy: y, rx: 3.2, ry: mood === 'cheer' ? 1.7 : 4, fill: 'var(--c-face)' }), mood === 'cheer' ? null : SV('circle', { cx: x + 1.1, cy: y - 1.4, r: 1.2, fill: '#fff' })];
  if (mood === 'cheer') { s.append(SV('path', { d: 'M42 38 q4 -5 8 0 M54 38 q4 -5 8 0', fill: 'none', stroke: 'var(--c-face)', 'stroke-width': 3, 'stroke-linecap': 'round' })); }
  else { [...eye(44, 38), ...eye(58, 38)].filter(Boolean).forEach(n => s.append(n)); }
  if (mood === 'think') s.append(SV('path', { d: 'M54 31 q5 -3 9 0', fill: 'none', stroke: 'var(--c-face)', 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
  s.append(SV('ellipse', { cx: 38, cy: 47, rx: 4.5, ry: 3, fill: 'var(--c-rose)', opacity: 0.55 }), SV('ellipse', { cx: 64, cy: 47, rx: 4.5, ry: 3, fill: 'var(--c-rose)', opacity: 0.55 }));
  if (mood === 'cheer') s.append(SV('path', { d: 'M42 46 q9 12 18 0 z', fill: 'var(--c-face)', stroke: 'var(--c-face)', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }), SV('path', { d: 'M47 52 q4 3 8 0 q-4 -2 -8 0 z', fill: 'var(--c-rose)' }));
  else if (mood === 'think') s.append(SV('path', { d: 'M46 51 q4 -2 8 1', fill: 'none', stroke: 'var(--c-face)', 'stroke-width': 2.6, 'stroke-linecap': 'round' }));
  else s.append(SV('path', { d: 'M44 48 q7 8 14 0', fill: 'none', stroke: 'var(--c-face)', 'stroke-width': 2.8, 'stroke-linecap': 'round' }));
  return s;
}

/* ---------- passport stamps ---------- */
// kind: day | words | streak | grammar | lesson
function stampNode(st, earned, i) {
  const rot = [-7, 5, -3, 8, -5, 3, -9, 6][i % 8];
  const color = { day: 'var(--c-blue)', words: 'var(--c-green)', streak: 'var(--c-red)', grammar: 'var(--c-lav)', lesson: 'var(--c-sky)' }[st.kind];
  const svg = SV('svg', { viewBox: '0 0 72 72', width: 72, height: 72, class: 'stamp' + (earned ? ' on' : ''), role: 'img', 'aria-label': st.label + (earned ? '' : ' (locked)') });
  if (earned) {
    svg.append(SV('g', { transform: `rotate(${rot} 36 36)`, fill: 'none', stroke: color }, SV('circle', { cx: 36, cy: 36, r: 32, 'stroke-width': 3 }), SV('circle', { cx: 36, cy: 36, r: 27, 'stroke-width': 1.2, 'stroke-dasharray': '2 2.5' }),
      SV('text', { x: 36, y: 40, 'text-anchor': 'middle', 'font-size': st.big.length > 3 ? 15 : 22, 'font-weight': 800, fill: color, stroke: 'none', style: 'font-family:var(--f-display)' }, st.big),
      SV('text', { x: 36, y: 53, 'text-anchor': 'middle', 'font-size': 8.5, 'font-weight': 700, fill: color, stroke: 'none', 'letter-spacing': '.8', style: 'font-family:var(--f-display)' }, st.cap)));
  } else {
    svg.append(SV('circle', { cx: 36, cy: 36, r: 31, fill: 'none', stroke: 'var(--line)', 'stroke-width': 2.5, 'stroke-dasharray': '4 4' }),
      SV('text', { x: 36, y: 43, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: 'var(--line)', style: 'font-family:var(--f-display)' }, '?'));
  }
  return svg;
}

// the big ink stamp that lands at the end of a session
function bigStamp(l1, l2, color) {
  const t = (y, size, txt, extra) => SV('text', Object.assign({ x: 80, y, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800, fill: color, stroke: 'none', style: 'font-family:var(--f-display)', 'letter-spacing': '1.5' }, extra || {}), txt);
  return SV('svg', { viewBox: '0 0 160 160', width: 168, height: 168, role: 'img', 'aria-label': l1 },
    SV('g', { fill: 'none', stroke: color, opacity: 0.92 }, SV('circle', { cx: 80, cy: 80, r: 74, 'stroke-width': 5 }), SV('circle', { cx: 80, cy: 80, r: 64, 'stroke-width': 1.6, 'stroke-dasharray': '3 4' }),
      t(84, l1.length > 8 ? 25 : 30, l1), t(106, 12, l2, { 'font-weight': 700, 'letter-spacing': '2.5' }), t(56, 14, '★ ★ ★', { 'letter-spacing': '4' }), t(130, 14, '★ ★ ★', { 'letter-spacing': '4' })));
}

/* ---------- celebration ---------- */
const CONFETTI = ['var(--c-red)', 'var(--c-sun)', 'var(--c-blue)', 'var(--c-green)', 'var(--c-rose)', 'var(--c-sky)'];
function celebrate(big) {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const host = document.createElement('div');
    host.className = 'confetti' + (big ? ' big' : ''); host.setAttribute('aria-hidden', 'true');
    const n = big ? 34 : 16;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i'), a = Math.random() * Math.PI * 2, d = (big ? 120 : 70) + Math.random() * (big ? 160 : 90);
      p.style.setProperty('--dx', Math.round(Math.cos(a) * d) + 'px'); p.style.setProperty('--dy', Math.round(Math.sin(a) * d - 60) + 'px');
      p.style.setProperty('--r', Math.round(Math.random() * 720 - 360) + 'deg'); p.style.background = CONFETTI[i % CONFETTI.length];
      p.style.animationDelay = Math.round(Math.random() * 90) + 'ms';
      if (i % 3 === 0) p.style.borderRadius = '50%';
      host.append(p);
    }
    document.body.append(host);
    setTimeout(() => host.remove(), 1500);
  } catch (e) { /* decoration only */ }
}
