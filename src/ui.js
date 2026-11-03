/* ============================================================
 * الواجهة — تقرأ من الحالة فقط وتعرضها. كل حركة تمر عبر performMove
 * ============================================================ */
(function () {
'use strict';
const E = window.MonoEngine;
const { SQUARES, GROUPS, OWNABLE, GROUP_MEMBERS, C, money } = E;
const $ = s => document.querySelector(s);
function h(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'style') n.style.cssText = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(c => { if (c !== null && c !== undefined && c !== false) n.append(c.nodeType ? c : document.createTextNode(c)); });
  return n;
}
const M = n => h('span', { class: 'money' }, money(n));

/* ---------- الأيقونات ---------- */
const ICON = {
  train: 'M12 2c-4 0-8 .5-8 4v9.5A3.5 3.5 0 007.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19a3.5 3.5 0 003.5-3.5V6c0-3.5-4-4-8-4zM7.5 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM11 10H6V6h5v4zm2 0V6h5v4h-5zm3.5 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z',
  bolt: 'M7 2v11h3v9l7-12h-4l4-8z',
  drop: 'M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2z',
  chest: 'M3 9a4 4 0 014-4h10a4 4 0 014 4v2H3zM3 12h18v8H3zm7-1v4h4v-4z',
  ring: 'M12 8a6 6 0 100 12 6 6 0 000-12zm0 2.2a3.8 3.8 0 110 7.6 3.8 3.8 0 010-7.6zM8.5 2h7l2 2.6L12 7.4 6.5 4.6z',
  coins: 'M12 3C7.6 3 4 4.3 4 6v3c0 1.7 3.6 3 8 3s8-1.3 8-3V6c0-1.7-3.6-3-8-3zm-8 9v3c0 1.7 3.6 3 8 3s8-1.3 8-3v-3c0 1.7-3.6 3-8 3s-8-1.3-8-3zm0 6v1c0 1.7 3.6 3 8 3s8-1.3 8-3v-1c0 1.7-3.6 3-8 3s-8-1.3-8-3z',
  car: 'M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11v8h-2v-2H7v2H5zm2.5 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM7 10h10l-1-3H8z',
  badge: 'M12 2l8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5zm0 5l1.5 3 3.3.4-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.4z',
  arrow: 'M21 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H21z',
  bars: 'M4 3h2v18H4zm4.5 0h2v18h-2zm4.5 0h2v18h-2zm4.5 0h2v18h-2zM3 3h18v2H3zm0 16h18v2H3z',
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z',
  flame: 'M13.5.7s.7 2.7.7 4.8c0 2-1.3 3.7-3.4 3.7-2 0-3.5-1.7-3.5-3.7l.03-.36C5.2 7.4 4 10.4 4 13.5 4 17.9 7.6 21.5 12 21.5s8-3.6 8-8C20 8.1 17.4 3.3 13.5.7z',
  umbrella: 'M12 2A10 10 0 002 12h9v7a1 1 0 01-2 0H7a3 3 0 006 0v-7h9A10 10 0 0012 2z',
  lock: 'M12 1a5 5 0 00-5 5v3H5v14h14V9h-2V6a5 5 0 00-5-5zm-3 8V6a3 3 0 016 0v3zm3 4a2 2 0 011 3.7V19h-2v-2.3A2 2 0 0112 13z',
  start: 'M3 5l8 7-8 7zm9 0l8 7-8 7z',
  gift: 'M20 7h-2.2A3 3 0 0012 3.4 3 3 0 006.2 7H4a1 1 0 00-1 1v3h8V7h2v4h8V8a1 1 0 00-1-1zM9 7a1 1 0 110-2 1 1 0 011 1v1zm6 0h-1V6a1 1 0 111 1zM4 13v8h7v-8zm9 0v8h7v-8z',
  hammer: 'M2 19.6L13.4 8.2l2.4 2.4L4.4 22zM14.8 2l7.2 7.2-2.8 2.8L12 4.8z',
  bank: 'M12 2L2 7v2h20V7zM4 11v7h3v-7zm6.5 0v7h3v-7zM17 11v7h3v-7zM2 20h20v2H2z',
  home: 'M12 3l10 9h-3v9h-5v-6h-4v6H5v-9H2z',
  team: 'M9 11a3.5 3.5 0 110-7 3.5 3.5 0 010 7zm7 0a3 3 0 110-6 3 3 0 010 6zM2 20v-1.5C2 15.5 5.6 13 9 13s7 2.5 7 5.5V20zm15.5 0v-1.5c0-1.6-.6-3-1.7-4.1 3.3.2 6.2 2 6.2 4.6v1z',
  x2: 'M4 6h3l2.5 4L12 6h3l-4 6 4 6h-3l-2.5-4L7 18H4l4-6zm12 6.5c0-1.9 1.3-3 3-3s3 1 3 2.6c0 1.2-.6 2-1.8 3l-1.3 1.1H22V18h-6v-1.5l2.9-2.6c.7-.6 1-1 1-1.5 0-.6-.4-1-1-1s-1 .5-1 1.1z',
  soundOn: 'M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0014 8v8a4.5 4.5 0 002.5-4zM14 3.2v2.1a7 7 0 010 13.4v2.1a9 9 0 000-17.6z',
  soundOff: 'M16.5 12A4.5 4.5 0 0014 8v2.2l2.5 2.5V12zM19 12a7 7 0 01-.6 2.8l1.5 1.5A9 9 0 0014 3.2v2.1A7 7 0 0119 12zM4.3 3L3 4.3 7.7 9H3v6h4l5 5v-6.7l4.3 4.3a7 7 0 01-2.3 1.2v2.1a9 9 0 003.7-1.8l2 2 1.3-1.3zM12 4L9.9 6.1 12 8.2z',
};
const svg = (path, extra) => `<svg viewBox="0 0 24 24" ${extra || ''}><path d="${path}"/></svg>`;
const starPts = (cx, cy, R, r, n) => Array.from({ length: (n || 5) * 2 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / (n || 5), d = k % 2 ? r : R; return `${(cx + d * Math.cos(a)).toFixed(2)},${(cy + d * Math.sin(a)).toFixed(2)}`; }).join(' ');
/* القطع: شخصيات بأشكال مختلفة لها عيون — تُلوَّن بلون اللاعب */
const TOKENS = [
  { name: 'فقاعة', body: '<circle cx="20" cy="21" r="15.5"/>', eyes: [15, 25, 20] },
  { name: 'مكعّب', body: '<rect x="5" y="6" width="30" height="30" rx="10"/>', eyes: [14.5, 25.5, 20] },
  { name: 'هرم', body: '<path d="M20 4q2.2 0 3.6 2.5L36 30q1.6 4-3 4H7q-4.6 0-3-4L16.4 6.5Q17.8 4 20 4z"/>', eyes: [16, 24, 25] },
  { name: 'نجمة', body: `<polygon points="${starPts(20, 21.5, 17, 8.6)}" stroke-width="4" stroke-linejoin="round"/>`, eyes: [16, 24, 22] },
  { name: 'سداسي', body: '<polygon points="20,4 34.5,12.5 34.5,29.5 20,38 5.5,29.5 5.5,12.5" stroke-width="3" stroke-linejoin="round"/>', eyes: [15, 25, 20] },
  { name: 'شبح', body: '<path d="M6.5 35V18a13.5 13.5 0 0127 0v17l-4.5-3.6L24.5 35 20 31.4 15.5 35 11 31.4z"/>', eyes: [15, 25, 18] },
  { name: 'ماسة', body: '<path d="M20 3l17 17.5L20 38 3 20.5z" stroke-width="4" stroke-linejoin="round"/>', eyes: [15.5, 24.5, 20] },
  { name: 'قطرة', body: '<path d="M20 3s14 13.5 14 22a14 14 0 01-28 0C6 16.5 20 3 20 3z"/>', eyes: [15, 25, 25] },
];
const COLORS = 8;
function tokenSVG(shape) {
  const t = TOKENS[shape % TOKENS.length], [l, r, y] = t.eyes;
  const eye = x => `<ellipse cx="${x}" cy="${y}" rx="3.9" ry="4.6" fill="#fff"/><circle cx="${x + .9}" cy="${y + 1}" r="2.1" fill="#16122b"/><circle cx="${x + 1.6}" cy="${y + .1}" r=".7" fill="#fff"/>`;
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><g style="fill:var(--tc);stroke:var(--tc)">${t.body}</g>`
    + `<ellipse cx="13" cy="11" rx="5" ry="3" fill="#fff" opacity=".28" transform="rotate(-25 13 11)"/>${eye(l)}${eye(r)}</svg>`;
}
const pColor = p => `var(--color-player-${p.color % COLORS})`;
function tokenEl(p, cls) {
  return h('span', { class: (cls || '') + ' tk', style: `--tc:${pColor(p)}`, html: tokenSVG(p.token), title: p.name });
}

/* ---------- الأعلام (SVG بسيطة تُقص دائرياً) ---------- */
const v3 = (a, b, c) => `<rect width="10" height="30" fill="${a}"/><rect x="10" width="10" height="30" fill="${b}"/><rect x="20" width="10" height="30" fill="${c}"/>`;
const h3 = (a, b, c) => `<rect width="30" height="10" fill="${a}"/><rect y="10" width="30" height="10" fill="${b}"/><rect y="20" width="30" height="10" fill="${c}"/>`;
const FLAGS = {
  br: `<rect width="30" height="30" fill="#009c3b"/><polygon points="15,4 28,15 15,26 2,15" fill="#ffdf00"/><circle cx="15" cy="15" r="6" fill="#002776"/>`,
  il: `<rect width="30" height="30" fill="#fff"/><rect y="4" width="30" height="3.4" fill="#0038b8"/><rect y="22.6" width="30" height="3.4" fill="#0038b8"/><g fill="none" stroke="#0038b8" stroke-width="1.4"><polygon points="15,9.2 20.2,18 9.8,18"/><polygon points="15,20.8 9.8,12 20.2,12"/></g>`,
  in: h3('#ff9933', '#fff', '#138808') + `<circle cx="15" cy="15" r="3.4" fill="none" stroke="#000080" stroke-width="1.2"/>`,
  it: v3('#009246', '#fff', '#ce2b37'),
  de: h3('#000', '#dd0000', '#ffce00'),
  cn: `<rect width="30" height="30" fill="#de2910"/><polygon points="${starPts(10, 10, 5.5, 2.2)}" fill="#ffde00"/><polygon points="${starPts(18, 5.5, 1.6, .7)}" fill="#ffde00"/><polygon points="${starPts(21, 9.5, 1.6, .7)}" fill="#ffde00"/><polygon points="${starPts(21, 14, 1.6, .7)}" fill="#ffde00"/><polygon points="${starPts(18, 18, 1.6, .7)}" fill="#ffde00"/>`,
  fr: v3('#0055a4', '#fff', '#ef4135'),
  jp: `<rect width="30" height="30" fill="#fff"/><circle cx="15" cy="15" r="7.5" fill="#bc002d"/>`,
  uk: `<rect width="30" height="30" fill="#012169"/><path d="M0 0L30 30M30 0L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0L30 30M30 0L0 30" stroke="#c8102e" stroke-width="2"/><path d="M15 0v30M0 15h30" stroke="#fff" stroke-width="10"/><path d="M15 0v30M0 15h30" stroke="#c8102e" stroke-width="6"/>`,
  us: `<rect width="30" height="30" fill="#fff"/>${[0, 2, 4, 6, 8, 10, 12].map(k => `<rect y="${k * 30 / 13}" width="30" height="${30 / 13}" fill="#b22234"/>`).join('')}<rect width="15" height="16.2" fill="#3c3b6e"/>${[[3, 3], [7.5, 3], [12, 3], [5.2, 6.5], [9.8, 6.5], [3, 10], [7.5, 10], [12, 10], [5.2, 13.5], [9.8, 13.5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#fff"/>`).join('')}`,
  tr: `<rect width="30" height="30" fill="#e30a17"/><circle cx="12.5" cy="15" r="7" fill="#fff"/><circle cx="14.3" cy="15" r="5.6" fill="#e30a17"/><polygon points="${starPts(20.5, 15, 3, 1.2)}" fill="#fff" transform="rotate(-18 20.5 15)"/>`,
  ro: v3('#002b7f', '#fcd116', '#ce1126'),
  ie: v3('#169b62', '#fff', '#ff883e'),
};
const flagEl = code => h('span', { class: 'flag', html: `<svg viewBox="0 0 30 30" preserveAspectRatio="xMidYMid slice">${FLAGS[code]}</svg>` });

/* ---------- رسوم معالم بسيطة في خلفية كل خانة (حسب المدينة ثم الدولة/المنطقة) ---------- */
const P_ = d => `<path d="${d}"/>`;
const ART = {
  eiffel: P_('M20 2l1.2 8h-2.4zM18.6 10h2.8l1.4 9h-5.6zM16.8 19h6.4l5.8 19h-4.6l-2.6-7h-3.6l-2.6 7H11z'),
  bigben: '<path fill-rule="evenodd" d="M20 1l3 6h-6zM16.5 7h7v4h-7zM16 11h8v27h-8zM20 13.2a2.8 2.8 0 100 5.6 2.8 2.8 0 100-5.6z"/>',
  liberty: P_('M20 7h3v5h-3zM23 7l3-5 1.2.8-3 5zM19 12h5l1 10h-7zM17 22h9v6h-9zM14 28h15v10H14zM19.5 4.5l1.5-2.5 1.5 2.5 2-.5-1 2h-5l-1-2z'),
  skyline: P_('M4 38V22h6v16zM11 38V12h7v26zM19 38V4h6v34zM26 38V16h5v22zM32 38V24h5v14z'),
  bridge: P_('M2 30h36v2.5H2zM10 6h2.5v32H10zM27.5 6H30v32h-2.5zM11 9q9 16 18 0v2q-9 15-18 0zM2 24q5-1 9-14v2.5Q7 24 2 26zM38 24q-5-1-9-14v2.5q4 11.5 9 13.5z'),
  colosseum: '<path fill-rule="evenodd" d="M3 38V16q17-8 34 0v22zM6 20v6h3v-6zM12 18.5v7h3v-7zM18.5 18v7h3v-7zM25 18.5v7h3v-7zM31 20v6h3v-6zM6 30v6h3v-6zM12 30v6h3v-6zM18.5 30v6h3v-6zM25 30v6h3v-6zM31 30v6h3v-6z"/>',
  gondola: P_('M2 27q18 9 36-7l-1.5 5Q20 36 3 31zM27 9h1.5v15H27zM15 17a2 2 0 110 .1zM14 19.5h2.4l.6 7h-3.6z'),
  gate: P_('M4 12h32v4H4zM8 9h24v3H8zM6 16h3v22H6zM12.3 16h3v22h-3zM18.5 16h3v22h-3zM24.7 16h3v22h-3zM31 16h3v22h-3zM17 4h6v5h-6z'),
  pagoda: P_('M20 2l2 4h-4zM10 10q10-6 20 0l-3 1H13zM13.5 11h13v4h-13zM8 18q12-6 24 0l-3 1H11zM12 19h16v5H12zM6 27q14-6 28 0l-3 1H9zM11 28h18v10H11z'),
  fuji: '<path fill-rule="evenodd" d="M1 38L15 13q2-3 5-3t5 3l14 25zM15.5 14.5l3 3.5 1.5-2 1.5 2 3-3.5q-1.6-2.6-4.5-2.6t-4.5 2.6z"/>',
  taj: P_('M20 4q6.5 6 6.5 12h-13Q13.5 10 20 4zM19.4 1h1.2v4h-1.2zM12 16h16v4H12zM8 20h24v18H8zM3 10h2.5v28H3zM34.5 10H37v28h-2.5z'),
  christ: P_('M18.8 3.5h2.4v4h-2.4zM6 8.5h28v2.6H22.2V22l1 9h-6.4l1-9V11.1H6zM0 40q20-12 40 0z'),
  dome: P_('M20 6q9.5 0 9.5 10h-19Q10.5 6 20 6zM19.4 2h1.2v4h-1.2zM8 16h24v22H8z'),
  mosque: P_('M20 8q8.5 0 8.5 9h-17q0-9 8.5-9zM19.5 4h1v4h-1zM10 17h20v21H10zM4 7l1.2-5 1.2 5v31H4zM33.6 7l1.2-5 1.2 5v31h-2.4z'),
  castle: P_('M6 14l3-8 3 8zM28 14l3-8 3 8zM6 14h6v24H6zM28 14h6v24h-6zM12 20h16v18H12zM12 17h3v3h-3zM18.5 17h3v3h-3zM25 17h3v3h-3z'),
  shamrock: '<circle cx="20" cy="11" r="6.2"/><circle cx="12.6" cy="19.5" r="6.2"/><circle cx="27.4" cy="19.5" r="6.2"/><path d="M19 20h2.4l4 17h-2.6z"/>',
  palm: P_('M19 15h2.6l1.4 23h-5.4zM20 16Q11 7 2 13q10-2 18 3zM20 16q9-9 18-3-10-2-18 3zM20 16q-3-10-12-12 9 3 12 12zM20 16q3-10 12-12-9 3-12 12z'),
  houses: P_('M3 38V24l7-6 7 6v14zM15.5 38V18l8.5-8 8.5 8v20zM31 38V27l3.5-3.5L38 27v11z'),
  arch: P_('M4 38V12h32v26h-8V25q-8-11-16 0v13zM2 9h36v3H2z'),
  fountain: P_('M18.5 5h3l-.6 11h-1.8zM8 18q12 6 24 0v3q-12 6-24 0zM12.5 24h15l-2 8h-11zM6 34h28v4H6z'),
  waves: P_('M2 21q4-4 9 0t9 0 9 0 9 0v4q-4-4-9 0t-9 0-9 0-9 0zM2 30q4-4 9 0t9 0 9 0 9 0v4q-4-4-9 0t-9 0-9 0-9 0z'),
  tower: P_('M17 3h6v4h-6zM15 7h10v4H15zM16 11h8v24h-8zM13 35h14v3H13z'),
  island: P_('M2 32q18-9 36 0v6H2zM18.6 15h2.4l1 16h-4.4zM20 16q-6-6-13-2 7-1.5 13 2zM20 16q6-6 13-2-7-1.5-13 2zM20 16q-2-7-8-9 6 2.5 8 9zM20 16q2-7 8-9-6 2.5-8 9z'),
  palace: P_('M20 3q5.5 4 5.5 9h-11Q14.5 7 20 3zM13 12h14v4H13zM6 16h28v22H6zM9 9l1.2-4 1.2 4v7H9zM28.6 9l1.2-4L31 9v7h-2.4z'),
};
const ART_BY_GROUP = { br: 'christ', il: 'dome', in: 'taj', it: 'colosseum', de: 'gate', cn: 'pagoda', fr: 'eiffel', jp: 'fuji', uk: 'bigben', us: 'skyline', tr: 'mosque', ro: 'castle', ie: 'shamrock',
  brown: 'palm', lightblue: 'houses', pink: 'arch', orange: 'fountain', red: 'waves', yellow: 'tower', green: 'island', darkblue: 'palace' };
const ART_BY_NAME = { 'باريس': 'eiffel', 'لندن': 'bigben', 'نيويورك': 'liberty', 'سان فرانسيسكو': 'bridge', 'البندقية': 'gondola', 'طوكيو': 'fuji', 'يوكوهاما': 'pagoda' };
const artEl = sq => { const k = ART_BY_NAME[sq.name] || ART_BY_GROUP[sq.group]; return k ? h('div', { class: 'art', style: `color:${GROUPS[sq.group].color}`, html: `<svg viewBox="0 0 40 40">${ART[k]}</svg>` }) : null; };
const MAP_ICON = { castle: '🏰', city: '🏙️', globe: '🌍', clover: '🍀' };

/* ---------- الصوت (Web Audio — بلا ملفات): أصوات خشبية وأجراس ناعمة ---------- */
const Snd = {
  ctx: null, on: true, out: null,
  init() {
    if (this.ctx || !this.on) return;
    try {
      const c = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
      const master = c.createGain(); master.gain.value = 0.9;
      // صدى خفيف لإحساس الغرفة
      const dl = c.createDelay(); dl.delayTime.value = 0.11; const fb = c.createGain(); fb.gain.value = 0.18; const wet = c.createGain(); wet.gain.value = 0.16;
      master.connect(comp); master.connect(dl); dl.connect(fb).connect(dl); dl.connect(wet).connect(comp); comp.connect(c.destination);
      this.out = master;
    } catch (e) { this.on = false; }
  },
  env(g, t, a, d, v) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
  osc(type, f, t, a, d, v, to) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + a + d);
    this.env(g, t, a, d, v); o.connect(g).connect(this.out); o.start(t); o.stop(t + a + d + 0.05);
  },
  mallet(f, at, v) { const t = this.ctx.currentTime + (at || 0); v = v || 0.18; this.osc('sine', f, t, 0.004, 0.42, v); this.osc('sine', f * 4, t, 0.002, 0.07, v * 0.35); this.osc('triangle', f * 2, t, 0.003, 0.16, v * 0.2); },
  bell(f, at, v, d) { const t = this.ctx.currentTime + (at || 0); v = v || 0.12; d = d || 0.9; this.osc('sine', f, t, 0.005, d, v); this.osc('sine', f * 2.76, t, 0.003, d * 0.5, v * 0.4); this.osc('sine', f * 5.4, t, 0.002, d * 0.25, v * 0.2); },
  noise(dur, v, freq, at, q, type, toFreq) {
    const c = this.ctx, t = c.currentTime + (at || 0);
    const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq || 2000, t); if (toFreq) f.frequency.exponentialRampToValueAtTime(toFreq, t + dur); f.Q.value = q || 1; g.gain.value = v || 0.3;
    s.connect(f).connect(g).connect(this.out); s.start(t);
  },
  wood(f, at, v) { const t = this.ctx.currentTime + (at || 0); this.osc('sine', f, t, 0.001, 0.06, v || 0.2, f * 0.7); this.noise(0.03, (v || 0.2) * 1.2, f * 3, at, 4); },
  play(name) {
    if (!this.on) return; this.init(); if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const C5 = 523.25, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5, D5 = 587.33, G4 = 392, E4 = 329.63, C4 = 261.63, A4 = 440, F4 = 349.23;
    switch (name) {
      case 'dice': for (let i = 0; i < 9; i++) this.wood(700 + Math.random() * 900, i * 0.055 + Math.random() * 0.02, 0.12 + Math.random() * 0.08); this.wood(500, 0.58, 0.25); this.wood(620, 0.66, 0.16); break;
      case 'step': this.wood(1100 + Math.random() * 120, 0, 0.09); break;
      case 'coin': this.bell(1568, 0, 0.09, 0.5); this.bell(2093, 0.07, 0.09, 0.7); break;
      case 'pay': this.mallet(G4, 0, 0.15); this.mallet(E4, 0.1, 0.15); this.mallet(C4, 0.2, 0.13); break;
      case 'card': this.noise(0.35, 0.22, 1200, 0, 0.7, 'highpass', 5000); this.bell(E5, 0.18, 0.07, 0.6); break;
      case 'jail': this.bell(110, 0, 0.22, 1.6); this.noise(0.12, 0.35, 3000, 0, 6); this.noise(0.12, 0.3, 2600, 0.14, 6); break;
      case 'buy': [C5, E5, G5, C6].forEach((f, i) => this.mallet(f, i * 0.075, 0.16)); this.bell(C6 * 2, 0.32, 0.05, 0.6); break;
      case 'build': this.wood(300, 0, 0.3); this.wood(340, 0.13, 0.28); this.wood(420, 0.26, 0.22); break;
      case 'rent': this.mallet(A4, 0, 0.14); this.mallet(F4, 0.12, 0.14); break;
      case 'turn': this.bell(G5, 0, 0.06, 0.6); this.bell(C6, 0.09, 0.06, 0.8); break;
      case 'bid': this.mallet(A5, 0, 0.12); break;
      case 'hammer': this.wood(220, 0, 0.4); this.noise(0.08, 0.4, 700, 0, 2); this.wood(200, 0.16, 0.3); break;
      case 'error': this.osc('triangle', 200, this.ctx.currentTime, 0.005, 0.18, 0.08, 150); this.osc('triangle', 150, this.ctx.currentTime + 0.1, 0.005, 0.2, 0.08, 110); break;
      case 'click': this.wood(1600, 0, 0.06); break;
      case 'bankrupt': [G4, F4, E4, C4].forEach((f, i) => this.mallet(f * 0.5, i * 0.22, 0.2)); this.bell(65, 0.9, 0.15, 1.5); break;
      case 'win': [C5, E5, G5, C6, G5, C6, E5 * 2].forEach((f, i) => this.mallet(f, i * 0.12, 0.17)); [C5, E5, G5].forEach(f => this.bell(f, 0.9, 0.06, 1.6)); break;
      case 'join': this.bell(D5, 0, 0.07, 0.5); this.bell(A5, 0.08, 0.07, 0.7); break;
    }
  },
};

/* ---------- حالة الواجهة ---------- */
let S = null;                               // الحالة الوحيدة للعبة
const SPEEDS = { normal: { step: 190, dice: 1050, ai: 750, card: 2300 }, fast: { step: 90, dice: 600, ai: 300, card: 1300 }, instant: { step: 0, dice: 0, ai: 0, card: 0 } };
const ui = { speed: 'normal', netWait: false, pending: 0, queue: Promise.resolve(), aiTimer: null, modal: null, tokenPos: {}, displayCash: null, spin: [0, 0], cardOpen: false, msg: '' };
const SAVE_KEY = 'monopoly-save-v2';
const sp = () => SPEEDS[ui.speed];
const wait = ms => new Promise(r => setTimeout(r, ms));
const actor = () => S ? E.getActor(S) : null;
/* من يتحكم بهذا اللاعب على هذا الجهاز؟ أونلاين: مقعدي فقط. على نفس الجهاز: كل البشر */
const canControl = pid => pid !== null && pid !== undefined && !!S && (isOnline() ? pid === Net.mySeat && !S.players[pid].isAI : !S.players[pid].isAI);
const isHumanActor = () => canControl(actor());

function save() { if (isOnline()) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify({ state: S, speed: ui.speed, sound: Snd.on })); } catch (e) { /* التخزين غير متاح */ } }
function loadSave() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); return d && d.state && d.state.phase === 'playing' ? d : null; } catch (e) { return null; } }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* */ } }

function toast(text, ms) {
  const t = h('div', { class: 'toast', role: 'status' }, text);
  document.body.append(t); setTimeout(() => t.remove(), ms || 2600);
}

const DEFAULT_NAMES = ['سالم', 'ليلى', 'كريم', 'نور', 'يوسف', 'هدى', 'ريم', 'علي'];
const TEAM_SHORT = ['الأحمر', 'الأزرق', 'الأخضر', 'الذهبي'];
const RULES_UI = [
  { k: 'doubleSet', icon: 'x2', t: 'مضاعفة الإيجار للمجموعة الكاملة', d: 'إذا امتلك اللاعب مجموعة عقارات كاملة يتضاعف الإيجار الأساسي' },
  { k: 'vacationCash', icon: 'umbrella', t: 'أموال الإجازة', d: 'كل الأموال المدفوعة كضرائب وغرامات للبنك تتجمّع، ويربحها من يقف على خانة الإجازة' },
  { k: 'auction', icon: 'hammer', t: 'المزاد', d: 'إذا تخطّى اللاعب شراء العقار الذي وقف عليه يُباع في مزاد لأعلى مزايد' },
  { k: 'noRentInJail', icon: 'bars', t: 'لا إيجار أثناء السجن', d: 'لا يُقبض الإيجار عند الوقوف على عقارات مالكها في السجن' },
  { k: 'mortgage', icon: 'bank', t: 'الرهن', d: 'ارهن عقاراتك مقابل 50% من سعرها، ولا يُقبض إيجارها أثناء الرهن' },
  { k: 'evenBuild', icon: 'home', t: 'البناء المتساوي', d: 'يجب بناء البيوت والفنادق وبيعها بالتساوي داخل المجموعة' },
];
const LOBBY_KEY = 'monopoly-lobby-v3';
const lobby = { mode: 'local', count: 3, cash: C.START_CASH, speed: 'normal', map: 'classic', teams: { on: false, n: 2 },
  rules: { doubleSet: true, vacationCash: true, auction: true, noRentInJail: true, mortgage: true, evenBuild: true },
  players: DEFAULT_NAMES.map((n, i) => ({ name: i === 0 ? 'أنت' : n, isAI: i !== 0, token: i, color: i, team: i % 2 })) };
try {
  const d = JSON.parse(localStorage.getItem(LOBBY_KEY));
  if (d) {
    ['count', 'cash', 'speed', 'map'].forEach(k => { if (d[k] !== undefined) lobby[k] = d[k]; });
    if (d.rules) Object.assign(lobby.rules, d.rules); if (d.teams) Object.assign(lobby.teams, d.teams);
    if (d.me) Object.assign(lobby.players[0], d.me, { isAI: false });
    if (!E.MAPS[lobby.map]) lobby.map = 'classic';
    lobby.count = Math.min(C.MAX_PLAYERS, Math.max(C.MIN_PLAYERS, lobby.count | 0));
  }
} catch (e) { /* */ }
const saveLobby = () => { try { const me = lobby.players[0]; localStorage.setItem(LOBBY_KEY, JSON.stringify({ count: lobby.count, cash: lobby.cash, speed: lobby.speed, map: lobby.map, rules: lobby.rules, teams: lobby.teams, me: { name: me.name, token: me.token, color: me.color } })); } catch (e) { /* */ } };
function miniBoard(m) {
  const n = m.side, g = h('div', { class: 'mini-board', style: `grid-template-columns:repeat(${n + 2},1fr);grid-template-rows:repeat(${n + 2},1fr)` });
  m.squares.forEach((sq, i) => {
    const p = gridPosN(i, n);
    const col = sq.group && m.groups[sq.group] ? m.groups[sq.group].color : sq.type === 'chance' ? '#9c2f52' : sq.type === 'chest' ? '#a5a79b' : i % (n + 1) === 0 ? '#c9cbc0' : '#f3e6d3';
    g.append(h('i', { style: `grid-row:${p.r};grid-column:${p.c};background:${col}` }));
  });
  g.append(h('span', { class: 'mb-ico' }, MAP_ICON[m.icon] || ''));
  return g;
}

/* ============================================================
 * الشبكة — اللعب أونلاين: المضيف يملك الحالة ويطبق القوانين، والضيوف يرسلون حركاتهم فقط.
 * النقل: خوادم MQTT عامة عبر WebSocket آمن (يعمل بين أي شبكتين وعلى أي استضافة ثابتة مثل Vercel).
 * ?broker=ws://... لتحديد خادم (للاختبار)، ?transport=bc للاختبار داخل متصفح واحد.
 * ============================================================ */
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
const useBC = /[?&]transport=bc\b/.test(location.search);
const Net = {
  role: null, code: null, peer: null, conns: {}, host: null, seats: [], snapshot: null, mySeat: null, seq: 0, status: '', busy: false,
  seatCids: [], wasHuman: {}, inGame: false,
  cid: (() => { try { let c = sessionStorage.getItem('mono-cid'); if (!c) { c = Math.random().toString(36).slice(2, 10); sessionStorage.setItem('mono-cid', c); } return c; } catch (e) { return Math.random().toString(36).slice(2, 10); } })(),
};
const isOnline = () => !!Net.role;
const isGuest = () => Net.role === 'guest';
const isHost = () => Net.role === 'host';
const roomLink = code => location.origin + location.pathname + '?room=' + code + (useBC ? '&transport=bc' : '') + ((location.search.match(/[?&](broker=[^&]+)/) || [])[1] ? '&' + location.search.match(/[?&](broker=[^&]+)/)[1] : '');

/* ---------- عميل MQTT مصغّر فوق WebSocket (MQTT 3.1.1، QoS 0) — بلا مكتبات ----------
 * كل لاعب يتصل للخارج بخادم وسيط عام عبر wss، فيعمل الاتصال بين أي شبكتين (بيت، جامعة، بيانات الهاتف)
 * دون الحاجة لاتصال مباشر بين الأجهزة. المضيف يتصل بعدة خوادم في الوقت نفسه احتياطاً. */
const BROKERS = (() => {
  const q = (location.search.match(/[?&]broker=([^&]+)/) || [])[1];
  if (q) return decodeURIComponent(q).split(',').map(url => ({ url }));
  return [
    { url: 'wss://broker.emqx.io:8084/mqtt' },
    { url: 'wss://broker.hivemq.com:8884/mqtt' },
    { url: 'wss://public.cloud.shiftr.io', user: 'public', pass: 'public' },
    { url: 'wss://test.mosquitto.org:8081/mqtt' },
  ];
})();
const enc = new TextEncoder(), dec = new TextDecoder();
const mqStr = s => { const b = enc.encode(s); return [b.length >> 8, b.length & 255, ...b]; };
const mqLen = n => { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return o; };
const mqPacket = (b0, body) => { const head = [b0, ...mqLen(body.length)]; const out = new Uint8Array(head.length + body.length); out.set(head, 0); out.set(body, head.length); return out; };
class Mqtt {
  constructor(cfg, opts) { this.cfg = cfg; this.o = opts || {}; this.subs = new Set(); this.hs = {}; this.pid = 1; this.closed = false; this.connected = false; this.retry = 0; this.q = []; this.buf = new Uint8Array(0); }
  on(ev, f) { (this.hs[ev] = this.hs[ev] || []).push(f); }
  emit(ev, ...a) { (this.hs[ev] || []).forEach(f => { try { f(...a); } catch (e) { console.error(e); } }); }
  connect(timeout) {
    return new Promise((res, rej) => {
      let done = false, ws;
      const fail = err => { if (done) return; done = true; clearTimeout(t); try { ws && ws.close(); } catch (e) { /* */ } rej(err); };
      const t = setTimeout(() => fail(new Error('timeout')), timeout || 7000);
      try { ws = this.ws = new WebSocket(this.cfg.url, ['mqtt']); } catch (e) { fail(e); return; }
      ws.binaryType = 'arraybuffer';
      this.buf = new Uint8Array(0);
      ws.onopen = () => ws.send(this.pkConnect());
      ws.onmessage = e => this.feed(new Uint8Array(e.data), ok => { if (done) return; done = true; clearTimeout(t); ok ? res() : rej(new Error('refused')); });
      ws.onerror = () => {};
      ws.onclose = () => {
        const was = this.connected; this.connected = false; clearInterval(this.pingT);
        if (!done) { fail(new Error('closed')); return; }
        if (!this.closed) { if (was) this.emit('offline'); this.reconnectLater(); }
      };
    });
  }
  reconnectLater() {
    if (this.closed || this.rT) return;
    const delay = Math.min(8000, 400 * Math.pow(2, this.retry++)) + Math.random() * 300;
    this.rT = setTimeout(() => { this.rT = null; if (this.closed) return; this.connect().catch(() => this.reconnectLater()); }, delay);
  }
  pkConnect() {
    const o = this.o, c = this.cfg, will = o.will;
    let flags = 0x02; if (will) flags |= 0x04; if (c.user) flags |= 0x80; if (c.pass) flags |= 0x40;
    this.clientId = 'mn' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-5);
    const body = [...mqStr('MQTT'), 4, flags, 0, 30, ...mqStr(this.clientId)];
    if (will) body.push(...mqStr(will.topic), ...mqStr(will.payload));
    if (c.user) body.push(...mqStr(c.user)); if (c.pass) body.push(...mqStr(c.pass));
    return mqPacket(0x10, body);
  }
  feed(chunk, onConnack) {
    const b = new Uint8Array(this.buf.length + chunk.length); b.set(this.buf, 0); b.set(chunk, this.buf.length); this.buf = b;
    for (;;) {
      const buf = this.buf; if (buf.length < 2) return;
      let len = 0, mult = 1, i = 1, byte;
      do { if (i >= buf.length) return; byte = buf[i++]; len += (byte & 127) * mult; mult *= 128; } while (byte & 128);
      if (buf.length < i + len) return;
      const type = buf[0] >> 4, flags = buf[0] & 15, p = buf.subarray(i, i + len);
      this.buf = buf.slice(i + len);
      if (type === 2) { // CONNACK
        const ok = p[1] === 0;
        if (ok) {
          this.connected = true; this.retry = 0;
          this.subs.forEach(tp => this.sendSub(tp));
          clearInterval(this.pingT); this.pingT = setInterval(() => { try { this.ws.send(new Uint8Array([0xC0, 0])); } catch (e) { /* */ } }, 20000);
          const q = this.q; this.q = []; q.forEach(([tp, pl]) => this.publish(tp, pl));
          this.emit('online');
        }
        onConnack && onConnack(ok);
      } else if (type === 3) { // PUBLISH
        const tl = (p[0] << 8) | p[1], topic = dec.decode(p.subarray(2, 2 + tl));
        const off = 2 + tl + (((flags >> 1) & 3) ? 2 : 0);
        this.emit('message', topic, dec.decode(p.subarray(off)));
      }
    }
  }
  sendSub(topic) { const id = this.pid = (this.pid % 65535) + 1; try { this.ws.send(mqPacket(0x82, [id >> 8, id & 255, ...mqStr(topic), 0])); } catch (e) { /* */ } }
  subscribe(topic) { this.subs.add(topic); if (this.connected) this.sendSub(topic); }
  publish(topic, payload) {
    if (!this.connected) { this.q.push([topic, payload]); if (this.q.length > 30) this.q.shift(); return false; }
    try { this.ws.send(mqPacket(0x30, [...mqStr(topic), ...enc.encode(payload)])); return true; } catch (e) { return false; }
  }
  close() { this.closed = true; clearTimeout(this.rT); clearInterval(this.pingT); try { if (this.connected) this.ws.send(new Uint8Array([0xE0, 0])); this.ws.close(); } catch (e) { /* */ } this.connected = false; }
}
const topicOf = code => `mnply2/${code}/`;
class Emitter { constructor() { this.hs = {}; } on(ev, f) { (this.hs[ev] = this.hs[ev] || []).push(f); } emit(ev, x) { (this.hs[ev] || []).forEach(f => { try { f(x); } catch (e) { console.error(e); } }); } }

/* نقل تجريبي عبر BroadcastChannel بنفس الواجهة */
class BCConn extends Emitter {
  constructor(ch, me, other) { super(); this.ch = ch; this.me = me; this.other = other; this.open = true; }
  send(d) { this.ch.postMessage({ to: this.other, from: this.me, k: 'data', d: JSON.parse(JSON.stringify(d)) }); }
  close() { if (!this.open) return; this.open = false; try { this.ch.postMessage({ to: this.other, from: this.me, k: 'close' }); } catch (e) { /* */ } this.emit('close'); }
}
/* المضيف: يتصل بكل الخوادم المتاحة، يستقبل من الضيوف على /u ويرسل على /d */
function hostTransport(code, onConn) {
  if (useBC) {
    const ch = new BroadcastChannel('mono-' + code), conns = {};
    ch.onmessage = e => {
      const m = e.data; if (m.to !== 'host') return;
      if (m.k === 'open') { const c = new BCConn(ch, 'host', m.from); conns[m.from] = c; ch.postMessage({ to: m.from, from: 'host', k: 'ack' }); onConn(c); }
      else if (conns[m.from]) { if (m.k === 'data') conns[m.from].emit('data', m.d); if (m.k === 'close') { conns[m.from].open = false; conns[m.from].emit('close'); delete conns[m.from]; } }
    };
    return Promise.resolve({ destroy() { Object.values(conns).forEach(c => c.close()); ch.close(); } });
  }
  const T = topicOf(code), conns = {};
  const clients = BROKERS.map(b => new Mqtt(b, { will: { topic: T + 'd', payload: JSON.stringify({ to: '*', d: { t: 'hostdrop' } }) } }));
  const pub = obj => { const s = JSON.stringify(obj); let n = 0; clients.forEach(c => { if (c.connected && c.publish(T + 'd', s)) n++; }); return n; };
  const drop = c => { if (conns[c.cid] !== c) return; delete conns[c.cid]; c.open = false; c.emit('close'); };
  const vconn = cid => { const c = new Emitter(); Object.assign(c, { cid, open: true, lastSeen: Date.now(), send: d => pub({ to: cid, d }), close: () => drop(c) }); return c; };
  const handle = (topic, txt) => {
    let m; try { m = JSON.parse(txt); } catch (e) { return; }
    if (!m || typeof m.from !== 'string' || !m.d || typeof m.d.t !== 'string') return;
    let c = conns[m.from];
    if (m.d.t === 'bye') { if (c) drop(c); return; }
    if (!c) { c = conns[m.from] = vconn(m.from); onConn(c); if (m.d.t !== 'hello') c.send({ t: 'who' }); }
    c.lastSeen = Date.now();
    if (m.d.t !== 'ping') c.emit('data', m.d);
  };
  clients.forEach(c => { c.subscribe(T + 'u'); c.on('message', handle); });
  const hb = setInterval(() => pub({ to: '*', d: { t: 'hb' } }), 3000);
  const sweep = setInterval(() => { const now = Date.now(); Object.values(conns).forEach(c => { if (now - c.lastSeen > 15000) drop(c); }); }, 3000);
  const api = { broadcast: d => pub({ to: '*', d }), online: () => clients.filter(c => c.connected).length,
    destroy() { clearInterval(hb); clearInterval(sweep); clients.forEach(c => c.close()); } };
  return new Promise((res, rej) => {
    let left = clients.length, resolved = false;
    clients.forEach(c => c.connect(7000).then(() => {
      if (!resolved) { resolved = true; setTimeout(() => res(api), 600); pub({ to: '*', d: { t: 'hb' } }); }
    }, () => { c.reconnectLater(); if (--left === 0 && !resolved) { api.destroy(); rej(new Error('تعذّر الوصول إلى خوادم الاتصال — تحقق من الإنترنت ثم حاول مجدداً')); } }));
  });
}
/* الضيف: يجرّب الخوادم بالتوازي ويختار أول خادم يسمع عليه نبض المضيف */
function guestTransport(code) {
  if (useBC) return new Promise((res, rej) => {
    const ch = new BroadcastChannel('mono-' + code), me = 'g-' + Net.cid;
    const conn = new BCConn(ch, me, 'host');
    const timer = setTimeout(() => { ch.close(); rej(new Error('لم نجد غرفة بهذا الكود')); }, 2500);
    ch.onmessage = e => { const m = e.data; if (m.to !== me) return; if (m.k === 'ack') { clearTimeout(timer); res(conn); } else if (m.k === 'data') conn.emit('data', m.d); else if (m.k === 'close') { conn.open = false; conn.emit('close'); } };
    conn.destroy = () => { conn.close(); ch.close(); };
    ch.postMessage({ to: 'host', from: me, k: 'open' });
  });
  const T = topicOf(code), me = Net.cid;
  return new Promise((res, rej) => {
    let chosen = null, reachable = 0, failed = 0;
    const clients = BROKERS.map(b => new Mqtt(b, { will: { topic: T + 'u', payload: JSON.stringify({ from: me, d: { t: 'bye' } }) } }));
    const finish = (first) => {
      chosen = first; clearTimeout(timer);
      clients.forEach(c => { if (c !== first) c.close(); });
      const conn = new Emitter();
      let client = null, lastHost = Date.now(), waiting = false, alive = true, offlineSince = 0, switching = false;
      const send = d => client && client.publish(T + 'u', JSON.stringify({ from: me, d }));
      const onMsg = (tp, txt) => {
        let m; try { m = JSON.parse(txt); } catch (e) { return; }
        if (!m || !m.d || (m.to !== me && m.to !== '*')) return;
        lastHost = Date.now();
        if (waiting) { waiting = false; conn.emit('status', 'back'); }
        if (m.d.t === 'hb') return;
        if (m.d.t === 'hostdrop') { waiting = true; conn.emit('status', 'hostdrop'); return; }
        conn.emit('data', m.d);
      };
      const attach = c => {
        client = c; offlineSince = 0;
        c.on('message', (tp, txt) => { if (client === c) onMsg(tp, txt); });
        c.on('offline', () => { if (client !== c) return; offlineSince = Date.now(); conn.emit('status', 'offline'); });
        c.on('online', () => { if (client !== c) return; offlineSince = 0; conn.emit('reconnect'); });
      };
      attach(first);
      // إن بقي الخادم الحالي غير متاح، ننتقل لخادم آخر (المضيف متصل بكل الخوادم)
      const trySwitch = () => {
        if (switching || !alive) return; switching = true;
        const old = client;
        const cands = BROKERS.filter(b => b !== old.cfg).map(b => new Mqtt(b, { will: { topic: T + 'u', payload: JSON.stringify({ from: me, d: { t: 'bye' } }) } }));
        let pending = cands.length, won = false;
        if (!pending) { switching = false; return; }
        cands.forEach(c => { c.subscribe(T + 'd'); c.connect(6000).then(() => {
          if (won || !alive || client !== old || old.connected) { c.close(); if (--pending === 0) switching = false; return; }
          won = true; old.close(); attach(c); switching = false; conn.emit('reconnect');
          cands.forEach(o => { if (o !== c) o.close(); });
        }, () => { c.close(); if (--pending === 0 && !won) switching = false; }); });
      };
      const ping = setInterval(() => send({ t: 'ping' }), 4000);
      const watch = setInterval(() => {
        const gap = Date.now() - lastHost;
        if (offlineSince && Date.now() - offlineSince > 6000) trySwitch();
        if (gap > 10000 && !waiting) { waiting = true; conn.emit('status', 'waiting'); }
        if (gap > 120000 && alive) { alive = false; conn.destroy(); conn.emit('close'); }
      }, 2000);
      conn.send = send;
      conn.destroy = () => { alive = false; clearInterval(ping); clearInterval(watch); try { send({ t: 'bye' }); } catch (e) { /* */ } const c = client; setTimeout(() => c && c.close(), 150); };
      conn.close = conn.destroy;
      res(conn);
    };
    const timer = setTimeout(() => {
      clients.forEach(c => c.close());
      rej(new Error(reachable ? 'لم نجد غرفة بهذا الكود — تأكد منه، وأن صفحة الغرفة ما زالت مفتوحة عند المضيف' : 'تعذّر الوصول إلى خوادم الاتصال — تحقق من الإنترنت ثم حاول مجدداً'));
    }, 12000);
    clients.forEach(c => {
      c.subscribe(T + 'd');
      c.on('message', (tp, txt) => { if (chosen) return; let m; try { m = JSON.parse(txt); } catch (e) { return; } if (m && (m.to === '*' || m.to === me)) finish(c); });
      c.connect(7000).then(() => { reachable++; c.publish(T + 'u', JSON.stringify({ from: me, d: { t: 'ping' } })); },
        () => { if (++failed === clients.length) { clearTimeout(timer); rej(new Error('تعذّر الوصول إلى خوادم الاتصال — تحقق من الإنترنت ثم حاول مجدداً')); } });
    });
  });
}
const cleanProfile = m => ({ name: String(m.name || 'لاعب').trim().slice(0, 14) || 'لاعب', token: (m.token | 0) % TOKENS.length, color: (m.color | 0) % COLORS });
function fixDupes(seat) { // لا يتكرر الشكل/اللون داخل الغرفة
  const others = Net.seats.filter(s => s !== seat);
  while (others.some(o => o.token === seat.token)) seat.token = (seat.token + 1) % TOKENS.length;
  while (others.some(o => o.color === seat.color)) seat.color = (seat.color + 1) % COLORS;
}
function lobbySnapshot() {
  return { players: Net.seats.map(s => ({ name: s.name, token: s.token, color: s.color, team: s.team, isAI: !!s.isAI, cid: s.cid || null })),
    map: lobby.map, cash: lobby.cash, speed: lobby.speed, rules: Object.assign({}, lobby.rules), teams: Object.assign({}, lobby.teams) };
}
function netBroadcast(msg) {
  if (Net.peer && Net.peer.broadcast) { Net.peer.broadcast(msg); return; } // رسالة واحدة لكل الضيوف
  Object.values(Net.conns).forEach(c => { try { c.send(msg); } catch (e) { /* */ } });
}
function broadcastLobby() { if (isHost()) { netBroadcast({ t: 'lobby', lobby: lobbySnapshot(), code: Net.code }); saveHostSession(); } }
function broadcastState(anim) { if (!isHost() || !S) return; Net.seq++; netBroadcast({ t: 'state', state: S, seq: Net.seq, anim: !!anim }); saveHostSession(); }
/* حفظ جلسة المضيف في هذا التبويب: إن أعاد تحميل الصفحة تعود الغرفة بنفس الكود ويكمل الجميع */
const HOST_KEY = 'mono-host-session', GUEST_KEY = 'mono-guest-room';
let hostSaveT = null;
function saveHostSession() {
  if (!isHost()) return;
  clearTimeout(hostSaveT);
  hostSaveT = setTimeout(() => { try { sessionStorage.setItem(HOST_KEY, JSON.stringify({ code: Net.code, seats: Net.seats.map(s => Object.assign({}, s)), seatCids: Net.seatCids, wasHuman: Net.wasHuman, inGame: Net.inGame, seq: Net.seq, state: Net.inGame ? S : null, speed: ui.speed, at: Date.now() })); } catch (e) { /* */ } }, 300);
}
function saveHostSessionNow() { clearTimeout(hostSaveT); try { sessionStorage.setItem(HOST_KEY, JSON.stringify({ code: Net.code, seats: Net.seats.map(s => Object.assign({}, s)), seatCids: Net.seatCids, wasHuman: Net.wasHuman, inGame: Net.inGame, seq: Net.seq, state: Net.inGame ? S : null, speed: ui.speed, at: Date.now() })); } catch (e) { /* */ } }
const helloMsg = () => { const me = lobby.players[0]; return { t: 'hello', cid: Net.cid, name: me.name, token: me.token, color: me.color }; };
async function resumeHost(d) {
  Net.busy = true; Net.status = 'جارٍ استعادة الغرفة…'; renderLobby();
  try {
    const peer = await hostTransport(d.code, onHostConn);
    lobby.mode = 'online';
    Object.assign(Net, { role: 'host', code: d.code, peer, conns: {}, mySeat: 0, seq: d.seq || 0, inGame: !!d.inGame, wasHuman: d.wasHuman || {}, seatCids: d.seatCids || [], status: '' });
    Net.seats = d.seats || []; Net.seats[0] = Object.assign(lobby.players[0], Net.seats[0] || {}, { cid: Net.cid, isAI: false });
    if (Net.inGame && d.state) { S = d.state; ui.speed = d.speed || 'normal'; enterGame(); broadcastState(false); toast('عادت الغرفة — يكمل الجميع من حيث توقفوا', 3000); }
    else { broadcastLobby(); }
  } catch (e) { Net.status = e.message; toast(e.message, 4000); }
  Net.busy = false; if (!S) renderLobby();
}

async function createRoom() {
  if (Net.busy) return;
  Net.busy = true; Net.status = 'جارٍ إنشاء الغرفة…'; renderLobby();
  try {
    let peer = null, code = null;
    for (let k = 0; k < 4 && !peer; k++) {
      code = newCode();
      try { peer = await hostTransport(code, onHostConn); } catch (e) { if (!e.taken) throw e; }
    }
    if (!peer) throw new Error('تعذّر إنشاء الغرفة');
    Object.assign(Net, { role: 'host', code, peer, conns: {}, mySeat: 0, seq: 0, inGame: false, wasHuman: {}, seatCids: [], status: '' });
    const me = lobby.players[0]; me.isAI = false;
    Net.seats = [Object.assign(me, { cid: Net.cid })];
    saveHostSession();
    try { history.replaceState(null, '', roomLink(code)); } catch (e) { /* */ }
  } catch (e) { Net.status = e.message; toast(e.message, 4000); }
  Net.busy = false; renderLobby();
}
function onHostConn(conn) {
  conn.on('data', m => onHostMsg(conn, m));
  conn.on('close', () => onHostClose(conn));
}
function onHostMsg(conn, m) {
  if (!m || typeof m.t !== 'string') return;
  if (m.t === 'hello') {
    if (!m.cid) return;
    conn.cid = m.cid;
    if (Net.conns[m.cid] && Net.conns[m.cid] !== conn) { try { Net.conns[m.cid].close(); } catch (e) { /* */ } }
    Net.conns[m.cid] = conn;
    if (Net.inGame && S) {
      const seat = Net.seatCids.indexOf(m.cid);
      if (seat < 0) { conn.send({ t: 'error', msg: 'اللعبة بدأت بالفعل — انتظر الجولة القادمة', fatal: true }); delete Net.conns[m.cid]; return; }
      if (Net.wasHuman[seat] && S.players[seat].isAI && !S.players[seat].bankrupt) {
        S = E.clone(S); S.players[seat].isAI = false; delete Net.wasHuman[seat];
        S.log.push({ t: `${S.players[seat].name} عاد إلى اللعبة`, k: 'system', turn: S.turn });
        renderAll();
      }
      conn.send({ t: 'start', state: S, seat, seq: Net.seq, speed: ui.speed });
      broadcastState(false); Snd.play('join');
      return;
    }
    let seat = Net.seats.find(s => s.cid === m.cid);
    if (!seat) {
      if (Net.seats.length >= C.MAX_PLAYERS) { conn.send({ t: 'error', msg: `الغرفة ممتلئة (${C.MAX_PLAYERS} لاعبين)`, fatal: true }); delete Net.conns[m.cid]; return; }
      seat = { cid: m.cid, isAI: false, remote: true, team: Net.seats.length % Math.max(2, lobby.teams.n) }; Net.seats.push(seat);
      toast(`${cleanProfile(m).name} انضم إلى الغرفة`); Snd.play('join');
    }
    Object.assign(seat, cleanProfile(m)); fixDupes(seat);
    renderLobby(); broadcastLobby();
  } else if (m.t === 'profile' && !Net.inGame) {
    const seat = Net.seats.find(s => s.cid === conn.cid); if (!seat) return;
    Object.assign(seat, cleanProfile(m)); fixDupes(seat); renderLobby(); broadcastLobby();
  } else if (m.t === 'move' && Net.inGame && S && m.move && typeof m.move.type === 'string') {
    const seat = Net.seatCids.indexOf(conn.cid); if (seat < 0) return;
    const r = performMove(Object.assign({}, m.move, { by: seat }));
    if (!r.success) conn.send({ t: 'error', msg: r.error });
  }
}
function onHostClose(conn) {
  if (!conn.cid || Net.conns[conn.cid] !== conn) return;
  delete Net.conns[conn.cid];
  if (!Net.inGame) {
    const s = Net.seats.find(x => x.cid === conn.cid);
    if (s) { Net.seats = Net.seats.filter(x => x !== s); toast(`${s.name} غادر الغرفة`); renderLobby(); broadcastLobby(); }
    return;
  }
  const seat = Net.seatCids.indexOf(conn.cid);
  if (seat >= 0 && S && !S.players[seat].bankrupt && !S.players[seat].isAI) {
    S = E.clone(S); S.players[seat].isAI = true; Net.wasHuman[seat] = true;
    S.log.push({ t: `${S.players[seat].name} انقطع اتصاله — يلعب الكمبيوتر بدلاً منه حتى يعود`, k: 'warn', turn: S.turn });
    toast(`${S.players[seat].name} انقطع اتصاله`);
    if (!ui.pending) renderAll();
    broadcastState(false); scheduleAI();
  }
}
async function joinRoom(code) {
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 5) { toast('اكتب كود الغرفة المكوّن من 5 خانات'); return; }
  if (Net.busy) return;
  Net.busy = true; Net.status = 'جارٍ الاتصال بالغرفة…'; renderLobby();
  try {
    const conn = await guestTransport(code);
    Object.assign(Net, { role: 'guest', code, host: conn, snapshot: null, mySeat: null, status: 'متصل — بانتظار المضيف ليبدأ اللعبة' });
    try { sessionStorage.setItem(GUEST_KEY, code); } catch (e) { /* */ }
    conn.on('data', onGuestMsg);
    conn.on('reconnect', () => { if (Net.host === conn) { conn.send(helloMsg()); toast('عاد الاتصال ✓', 1800); } });
    conn.on('status', s => {
      if (Net.host !== conn) return;
      if (s === 'offline') toast('انقطع الإنترنت — نحاول إعادة الاتصال…', 3000);
      else if (s === 'hostdrop' || s === 'waiting') { toast('المضيف غير متصل حالياً — بانتظار عودته…', 3500); Net.status = 'بانتظار عودة المضيف…'; if (!S) renderLobby(); }
      else if (s === 'back') { conn.send(helloMsg()); Net.status = S ? '' : 'متصل — بانتظار المضيف ليبدأ اللعبة'; toast('عاد المضيف ✓', 1800); if (!S) renderLobby(); }
    });
    conn.on('close', () => {
      if (Net.host !== conn) return;
      toast('انقطع الاتصال بالمضيف', 4000);
      const c = Net.code; leaveRoom(true);
      Net.status = 'انقطع الاتصال — يمكنك إعادة الانضمام بالكود ' + c; lobby.joinCode = c;
      if (S) showLobby(); else renderLobby();
    });
    conn.send(helloMsg());
    try { history.replaceState(null, '', roomLink(code)); } catch (e) { /* */ }
  } catch (e) { Net.status = e.message; toast(e.message, 4000); }
  Net.busy = false; renderLobby();
}
function onGuestMsg(m) {
  if (!m || typeof m.t !== 'string') return;
  if (m.t === 'who') { Net.host && Net.host.send(helloMsg()); return; }
  if (m.t === 'lobby') {
    Net.snapshot = m.lobby; Net.mySeat = m.lobby.players.findIndex(p => p.cid === Net.cid);
    if (S) { S = null; Net.inGame = false; closeModal(true); $('#game').classList.add('hidden'); $('#lobby').classList.remove('hidden'); }
    renderLobby();
  } else if (m.t === 'start') {
    Net.mySeat = m.seat; Net.seq = m.seq; Net.inGame = true; ui.speed = m.speed || 'normal'; ui.netWait = false;
    S = m.state; enterGame(); Snd.play('turn');
  } else if (m.t === 'state') {
    if (!S || m.seq <= Net.seq) return; Net.seq = m.seq; applyRemote(m.state, m.anim);
  } else if (m.t === 'error') {
    toast(m.msg, 3500); ui.netWait = false; if (S) renderTurn();
    if (m.fatal) { leaveRoom(true); Net.status = m.msg; renderLobby(); }
  } else if (m.t === 'end') {
    toast('أغلق المضيف الغرفة', 3500); leaveRoom(true); if (S) showLobby(); else renderLobby();
  }
}
function applyRemote(ns, anim) {
  ui.netWait = false;
  const prev = S, wasMine = prev && E.getActor(prev) === Net.mySeat;
  S = ns;
  const notify = () => { if (S && S.phase === 'playing' && !wasMine && E.getActor(S) === Net.mySeat) { toast('دورك!', 1800); Snd.play('turn'); } };
  if (!anim || !prev) { if (!ui.pending) renderAll(); notify(); return; }
  ui.pending++; renderTurn();
  ui.queue = ui.queue.then(() => animate(S.events || [], prev)).catch(e => console.error(e)).then(() => { ui.pending--; if (!ui.pending) { renderAll(); notify(); } });
}
function leaveRoom(silent) {
  if (isHost()) { netBroadcast({ t: 'end' }); Object.values(Net.conns).forEach(c => { try { c.close(); } catch (e) { /* */ } }); try { Net.peer && Net.peer.destroy(); } catch (e) { /* */ } }
  if (isGuest()) { try { Net.host.destroy ? Net.host.destroy() : Net.host.close(); } catch (e) { /* */ } }
  Object.assign(Net, { role: null, code: null, peer: null, conns: {}, host: null, seats: [], snapshot: null, mySeat: null, inGame: false, seatCids: [], wasHuman: {}, status: silent ? Net.status : '' });
  clearTimeout(hostSaveT); try { sessionStorage.removeItem(HOST_KEY); sessionStorage.removeItem(GUEST_KEY); } catch (e) { /* */ }
  lobby.players[0].isAI = false;
  try { const bq = (location.search.match(/[?&](broker=[^&]+)/) || [])[1]; history.replaceState(null, '', location.pathname + (useBC ? '?transport=bc' : bq ? '?' + bq : '')); } catch (e) { /* */ }
}
let profileTimer = null;
function sendProfile() {
  clearTimeout(profileTimer);
  profileTimer = setTimeout(() => { if (isGuest() && Net.host) { const me = lobby.players[0]; Net.host.send({ t: 'profile', name: me.name, token: me.token, color: me.color }); } saveLobby(); }, 250);
}
function copyText(txt, okMsg) {
  const done = () => toast(okMsg || 'تم النسخ');
  try { navigator.clipboard.writeText(txt).then(done, () => { prompt('انسخ:', txt); }); } catch (e) { prompt('انسخ:', txt); }
}

/* ============================================================
 * الردهة
 * ============================================================ */
function lobbyPlayers() {
  if (lobby.mode !== 'online') return lobby.players.slice(0, lobby.count);
  if (isHost()) return Net.seats;
  if (isGuest()) return Net.snapshot ? Net.snapshot.players : [];
  return [lobby.players[0]];
}
const lobbyCfg = () => (isGuest() && Net.snapshot) ? Net.snapshot : lobby;
function renderLobby() {
  const L = lobbyCfg(), online = lobby.mode === 'online', locked = isGuest();
  // تبويب الوضع
  const mt = $('#mode-tabs'); mt.innerHTML = '';
  [['local', 'على نفس الجهاز'], ['online', 'أونلاين']].forEach(([k, t]) => mt.append(h('button', { class: k === lobby.mode ? 'on' : '', 'data-mode': k, disabled: isOnline() && k === 'local',
    onclick: () => { if (isOnline()) return; lobby.mode = k; renderLobby(); } }, t)));
  // عدد اللاعبين
  const cp = $('#count-picker'); cp.innerHTML = '';
  if (!online) for (let n = C.MIN_PLAYERS; n <= C.MAX_PLAYERS; n++)
    cp.append(h('button', { class: n === lobby.count ? 'on' : '', 'data-count': n, onclick: () => { lobby.count = n; renderLobby(); } }, String(n)));
  else if (isOnline()) cp.append(h('span', { class: 'seat-count' }, `${lobbyPlayers().length} / ${C.MAX_PLAYERS}`));
  // لوحة الأونلاين
  const op = $('#online-panel'); op.innerHTML = ''; op.classList.toggle('hidden', !online);
  if (online) {
    if (!isOnline()) {
      const codeInp = h('input', { class: 'code-input', value: lobby.joinCode || '', maxlength: 5, placeholder: 'ABCDE', 'aria-label': 'كود الغرفة', dir: 'ltr', 'data-join-code': '',
        oninput: e => { e.target.value = e.target.value.toUpperCase(); lobby.joinCode = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') joinRoom(e.target.value); } });
      op.append(h('p', { class: 'hint' }, 'عدّل اسمك وقطعتك في الأسفل، ثم أنشئ غرفة وشارك الكود أو الرابط مع أصدقائك، أو انضم إلى غرفة.'),
        h('div', { class: 'online-actions' },
          btn('أنشئ غرفة', createRoom, 'big', { 'data-action': 'create-room', disabled: Net.busy }),
          h('div', { class: 'join-row' }, codeInp, btn('انضم', () => joinRoom(codeInp.value), 'success', { 'data-action': 'join-room', disabled: Net.busy }))));
    } else {
      const link = roomLink(Net.code);
      op.append(h('div', { class: 'room-box' },
        h('div', null, h('small', null, 'كود الغرفة'), h('div', { class: 'room-code', 'data-room-code': Net.code, dir: 'ltr' }, Net.code)),
        h('div', { class: 'room-btns' }, btn('انسخ الرابط', () => copyText(link, 'تم نسخ رابط الغرفة'), 'secondary'), btn('انسخ الكود', () => copyText(Net.code, 'تم نسخ الكود'), 'ghost'))),
        h('div', { class: 'room-link', dir: 'ltr' }, link));
    }
    if (Net.status) op.append(h('p', { class: 'hint status' }, Net.status));
  }
  // اللاعبون
  const pc = $('#player-config'); pc.innerHTML = '';
  const list = lobbyPlayers(), teamsOn = L.teams && L.teams.on, nTeams = (L.teams && L.teams.n) || 2;
  list.forEach((p, i) => {
    const mine = !online || (!isOnline() && i === 0) || p.cid === Net.cid;
    const editable = mine || (isHost() && p.isAI);
    const commit = () => { if (isHost()) broadcastLobby(); else if (isGuest() || (online && !isOnline())) sendProfile(); renderLobby(); };
    const tokBtn = h('button', { class: 'token-btn', title: 'غيّر شكل القطعة', 'aria-label': `قطعة ${TOKENS[p.token % TOKENS.length].name}`, style: `--tc:var(--color-player-${p.color % COLORS})`, html: tokenSVG(p.token), disabled: !editable,
      onclick: () => { const used = list.map(x => x.token); let t = p.token; do { t = (t + 1) % TOKENS.length; } while (used.includes(t) && t !== p.token); if (isGuest()) lobby.players[0].token = t; p.token = t; commit(); } });
    const colBtn = h('button', { class: 'color-btn', title: 'غيّر اللون', 'aria-label': 'غيّر اللون', style: `background:var(--color-player-${p.color % COLORS})`, disabled: !editable,
      onclick: () => { const used = list.map(x => x.color); let c = p.color; do { c = (c + 1) % COLORS; } while (used.includes(c) && c !== p.color); if (isGuest()) lobby.players[0].color = c; p.color = c; commit(); } });
    const inp = h('input', { value: p.name, maxlength: 14, 'aria-label': `اسم اللاعب ${i + 1}`, disabled: !editable,
      oninput: e => { p.name = e.target.value; if (isGuest()) lobby.players[0].name = e.target.value; if (isHost()) broadcastLobby(); else if (isGuest()) sendProfile(); else saveLobby(); } });
    let tail;
    if (!online) tail = h('div', { class: 'pc-type' },
      h('button', { class: p.isAI ? '' : 'on', onclick: () => { p.isAI = false; renderLobby(); } }, 'إنسان'),
      h('button', { class: p.isAI ? 'on' : '', onclick: () => { p.isAI = true; renderLobby(); } }, 'كمبيوتر'));
    else if (isOnline()) {
      tail = h('div', { class: 'pc-tags' },
        h('span', { class: 'badge' + (p.isAI ? ' ai' : '') }, p.isAI ? 'كمبيوتر' : i === 0 ? 'المضيف' : p.cid === Net.cid ? 'أنت' : 'متصل'),
        isHost() && i > 0 ? btn('×', () => { const c = Net.conns[p.cid]; if (c) { try { c.send({ t: 'error', msg: 'أخرجك المضيف من الغرفة', fatal: true }); c.close(); } catch (e) { /* */ } delete Net.conns[p.cid]; } Net.seats.splice(i, 1); renderLobby(); broadcastLobby(); }, 'ghost kick', { title: 'إزالة', 'aria-label': 'إزالة' }) : null);
    }
    const teamChip = teamsOn && (!online || isOnline()) ? h('button', { class: 'team-chip', style: `background:var(--team-${p.team % nTeams})`, title: 'غيّر الفريق', disabled: locked || (online && !isHost()), 'data-team-of': i,
      onclick: () => { p.team = ((p.team | 0) + 1) % nTeams; if (isHost()) broadcastLobby(); renderLobby(); } }, TEAM_SHORT[p.team % nTeams]) : null;
    pc.append(h('div', { class: 'pc-row' + (teamsOn ? ' with-team' : ''), 'data-player-config': i }, tokBtn, colBtn, inp, teamChip, tail));
  });
  if (isHost() && Net.seats.length < C.MAX_PLAYERS)
    pc.append(btn('+ أضف لاعب كمبيوتر', () => {
      const used = Net.seats.map(s => s.token), usedC = Net.seats.map(s => s.color);
      const free = DEFAULT_NAMES.find(n => !Net.seats.some(s => s.name === n)) || 'بوت';
      const s = { name: free, isAI: true, token: [...Array(TOKENS.length).keys()].find(k => !used.includes(k)) ?? 0, color: [...Array(COLORS).keys()].find(k => !usedC.includes(k)) ?? 0, team: Net.seats.length % nTeams, cid: null };
      Net.seats.push(s); renderLobby(); broadcastLobby();
    }, 'ghost add-bot', { 'data-action': 'add-bot' }));
  // ملخص الفرق
  const ts = $('#team-summary'); ts.innerHTML = '';
  if (teamsOn && (!online || isOnline())) {
    const counts = Array.from({ length: nTeams }, (_, k) => list.filter(p => (p.team % nTeams) === k).length);
    ts.append(...counts.map((c, k) => h('span', { class: 'team-pill', style: `--tcol:var(--team-${k})` }, `${TEAM_SHORT[k]}: ${c}`)));
  }
  // الأزرار
  const startBtn = $('#start-btn');
  startBtn.classList.toggle('hidden', online && !isHost());
  startBtn.textContent = isHost() ? 'ابدأ اللعبة للجميع' : 'ابدأ اللعبة';
  $('#resume-btn').classList.toggle('hidden', online || !loadSave());
  $('#leave-btn').classList.toggle('hidden', !isOnline());
  $('#guest-wait').classList.toggle('hidden', !isGuest());
  // الإعدادات
  $('#settings-card').classList.toggle('locked', locked);
  $('#settings-note').classList.toggle('hidden', !locked);
  const mp = $('#map-picker'); mp.innerHTML = '';
  Object.values(E.MAPS).forEach(m => mp.append(h('button', { class: 'map-card' + (m.id === L.map ? ' on' : ''), 'data-map': m.id, disabled: locked, onclick: () => { lobby.map = m.id; broadcastLobby(); renderLobby(); } },
    miniBoard(m), h('b', null, m.name), h('small', null, m.desc))));
  const cs = $('#cash-seg'); cs.innerHTML = '';
  [500, 1000, 1500, 2000, 2500].forEach(v => cs.append(h('button', { class: v === L.cash ? 'on' : '', 'data-cash-opt': v, disabled: locked, onclick: () => { lobby.cash = v; broadcastLobby(); renderLobby(); } }, M(v))));
  const ss = $('#speed-seg'); ss.innerHTML = '';
  [['normal', 'عادية'], ['fast', 'سريعة']].forEach(([k, t]) => ss.append(h('button', { class: k === L.speed ? 'on' : '', disabled: locked, onclick: () => { lobby.speed = k; broadcastLobby(); renderLobby(); } }, t)));
  const rt = $('#rules-toggles'); rt.innerHTML = '';
  RULES_UI.forEach(r => rt.append(h('div', { class: 'setting' }, h('span', { class: 's-ico', html: svg(ICON[r.icon]) }), h('div', null, h('b', null, r.t), h('small', null, r.d)),
    h('button', { class: 'switch', role: 'switch', 'aria-checked': String(!!L.rules[r.k]), 'aria-label': r.t, 'data-rule': r.k, disabled: locked, onclick: () => { lobby.rules[r.k] = !lobby.rules[r.k]; broadcastLobby(); renderLobby(); } }))));
  // الفرق
  const tc = $('#teams-ctl'); tc.innerHTML = '';
  tc.append(h('div', { class: 'setting' }, h('span', { class: 's-ico', html: svg(ICON.team) }),
    h('div', null, h('b', null, 'وضع الفرق'), h('small', null, 'العب ضمن فرق: لا إيجار بين أعضاء الفريق، ويفوز الفريق الذي يبقى آخراً. اضغط على لون الفريق بجانب كل لاعب لتغييره.')),
    h('button', { class: 'switch', role: 'switch', 'aria-checked': String(!!teamsOn), 'aria-label': 'وضع الفرق', 'data-rule': 'teams', disabled: locked,
      onclick: () => { lobby.teams.on = !lobby.teams.on; if (lobby.teams.on) autoTeams(); broadcastLobby(); renderLobby(); } })));
  if (teamsOn) {
    const seg = h('div', { class: 'seg' });
    [2, 3, 4].forEach(n => seg.append(h('button', { class: n === nTeams ? 'on' : '', 'data-teams-n': n, disabled: locked, onclick: () => { lobby.teams.n = n; autoTeams(); broadcastLobby(); renderLobby(); } }, `${n} فرق`)));
    tc.append(h('div', { class: 'lobby-row' }, h('label', null, 'عدد الفرق'), seg, btn('توزيع تلقائي', () => { autoTeams(); broadcastLobby(); renderLobby(); }, 'ghost', { disabled: locked, 'data-action': 'auto-teams' })));
  }
  saveLobby();
}
function autoTeams() { const n = lobby.teams.n; (lobby.mode === 'online' && isHost() ? Net.seats : lobby.players).forEach((p, i) => { p.team = i % n; }); }
function teamError(list) {
  if (!lobby.teams.on) return null;
  const n = lobby.teams.n;
  for (let k = 0; k < n; k++) if (!list.some(p => p.team % n === k)) return `${TEAM_SHORT[k]} بلا لاعبين — أضف لاعباً لكل فريق أو قلّل عدد الفرق`;
  return null;
}
function lobbyStart() {
  Snd.init();
  const list = lobby.mode === 'online' ? Net.seats : lobby.players.slice(0, lobby.count);
  if (lobby.mode === 'online' && !isHost()) return;
  if (list.length < C.MIN_PLAYERS) { toast('تحتاج لاعبَين على الأقل — شارك الكود أو أضف لاعب كمبيوتر', 3500); return; }
  const te = teamError(list); if (te) { toast(te, 3500); return; }
  const players = list.map(p => ({ name: p.name, isAI: !!p.isAI, token: p.token, color: p.color, team: lobby.teams.on ? p.team % lobby.teams.n : undefined }));
  if (isHost()) { Net.seatCids = Net.seats.map(s => s.cid || null); Net.inGame = true; Net.wasHuman = {}; }
  startGame({ players, startCash: lobby.cash, speed: lobby.speed, map: lobby.map, rules: Object.assign({}, lobby.rules) });
  if (isHost()) Object.values(Net.conns).forEach(c => { const seat = Net.seatCids.indexOf(c.cid); if (seat >= 0) c.send({ t: 'start', state: S, seat, seq: Net.seq, speed: ui.speed }); });
  saveHostSession();
}
function showLobby() {
  if (ui.aiTimer) { clearTimeout(ui.aiTimer); ui.aiTimer = null; }
  closeModal(true);
  S = null;
  if (isHost()) { // العودة للغرفة نفسها: يبقى المتصلون فقط
    Net.inGame = false;
    Net.seats = Net.seats.filter(s => !s.cid || s.cid === Net.cid || Net.conns[s.cid]);
    broadcastLobby();
  }
  $('#game').classList.add('hidden'); $('#lobby').classList.remove('hidden');
  renderLobby();
}

/* ============================================================
 * اللوحة
 * ============================================================ */
/* البداية أعلى اليسار والحركة مع عقارب الساعة. n = عدد الخانات بين الزاويتين */
function gridPosN(i, n) {
  const s = n + 1;
  if (i <= s) return { r: 1, c: 1 + i, side: 'top' };
  if (i < 2 * s) return { r: 1 + (i - s), c: n + 2, side: 'right' };
  if (i <= 3 * s) return { r: n + 2, c: n + 2 - (i - 2 * s), side: 'bottom' };
  return { r: n + 2 - (i - 3 * s), c: 1, side: 'left' };
}
const gridPos = i => gridPosN(i, C.SIDE);
const SQUARE_ICON = sq => ({ railroad: sq.icon === 'plane' ? ICON.plane : ICON.train, utility: ICON[sq.icon] || ICON.bolt, chest: ICON.chest, tax: sq.pct ? ICON.coins : ICON.ring, refund: ICON.gift })[sq.type];
const SQUARE_FILL = sq => ({ railroad: '#590907', utility: { bolt: '#c08a1e', drop: '#3b7bb8', flame: '#d0601e' }[sq.icon] || '#c08a1e', chest: 'var(--color-chest)', tax: '#84867a', refund: '#4e7a45' })[sq.type];
function buildBoard() {
  const board = $('#board');
  board.querySelectorAll('.cell').forEach(n => n.remove());
  board.style.setProperty('--n', C.SIDE);
  const ctr = $('#center'); ctr.style.gridRow = ctr.style.gridColumn = `2 / ${C.SIDE + 2}`;
  SQUARES.forEach((sq, i) => {
    const g = gridPos(i);
    const corner = i % (C.SIDE + 1) === 0;
    const cell = h('div', { class: `cell side-${g.side}${corner ? ' corner' : ''}`, 'data-sq': i, tabindex: 0, role: 'button', 'aria-label': sq.name, style: `grid-row:${g.r};grid-column:${g.c}`,
      onclick: () => openDeed(i), onkeydown: e => { if (e.key === 'Enter') openDeed(i); } });
    const inner = h('div', { class: 'inner' });
    if (corner) {
      if (sq.type === 'go') { cell.classList.add('c-go'); inner.append(h('div', { class: 'cicon', html: svg(ICON.start) }), h('div', { class: 'go-big' }, sq.name), h('div', { class: 'sub' }, 'اقبض $200')); }
      else if (sq.type === 'jail') { cell.classList.add('c-jail'); inner.append(h('div', { class: 'jail-box' }, 'في السجن'), h('div', { class: 'jail-visit' }, 'زيارة')); }
      else if (sq.type === 'parking') { cell.classList.add('c-park'); inner.append(h('div', { class: 'cicon', html: svg(ICON.umbrella) }), sq.name, h('div', { class: 'pot', 'data-pot': '' })); }
      else { cell.classList.add('c-gotojail'); inner.append(h('div', { class: 'cicon', html: svg(ICON.lock) }), sq.name); }
    } else if (sq.type === 'property') {
      const gr = GROUPS[sq.group];
      inner.append(...[artEl(sq), h('div', { class: 'price' }, M(sq.price)), h('div', { class: 'name' }, sq.name), gr.flag ? flagEl(gr.flag) : null, h('div', { class: 'bar', style: `background:${gr.color};--bar-c:${gr.color}` })].filter(Boolean));
    } else {
      const label = sq.price ? M(sq.price) : sq.type === 'tax' ? (sq.pct ? `${sq.pct}%` : M(sq.amount)) : sq.type === 'refund' ? h('span', null, '+', M(sq.amount)) : null;
      if (label) inner.append(h('div', { class: 'price' }, label));
      inner.append(h('div', { class: 'name', style: 'flex:none' }, sq.name));
      if (sq.type === 'chance') inner.append(h('div', { class: 'icon', style: `font-family:var(--font-display);font-weight:900;font-size:calc(var(--cell-font)*3.2);color:var(--color-chance);line-height:1` }, '?'));
      else inner.append(h('div', { class: 'icon', html: svg(SQUARE_ICON(sq), `style="fill:${SQUARE_FILL(sq)}"`) }));
    }
    cell.append(inner, h('div', { class: 'owner-strip' }));
    board.append(cell);
  });
  // النرد
  const tray = $('#dice-tray'); tray.innerHTML = '';
  for (let k = 0; k < 2; k++) {
    const die = h('div', { class: 'die', 'data-die': k });
    const PIPS = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
    for (let f = 1; f <= 6; f++) {
      const face = h('div', { class: `face f${f}` });
      for (let c = 1; c <= 9; c++) face.append(PIPS[f].includes(c) ? h('span', { class: 'pip' + (f === 1 ? ' red' : '') }) : h('span'));
      die.append(face);
    }
    tray.append(h('div', { class: 'die-wrap' }, die, h('div', { class: 'die-shadow' })));
  }
}
const DIE_ROT = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };
function setDice(d, animate) {
  if (!d) d = [5, 6];
  if (animate) { ui.spin[0] += 720; ui.spin[1] += 1080; }
  document.querySelectorAll('.die').forEach((die, k) => {
    const [rx, ry] = DIE_ROT[d[k]];
    const sx = ui.spin[0] * (k ? -1 : 1), sy = ui.spin[1];
    die.style.transitionDuration = animate ? sp().dice + 'ms' : '0ms';
    die.style.transform = `rotateX(${rx + sx}deg) rotateY(${ry + sy}deg)`;
    die.dataset.value = d[k];
    if (animate) { const w = die.parentElement; w.classList.remove('bounce'); void w.offsetWidth; w.style.animationDuration = sp().dice + 'ms'; w.classList.add('bounce'); }
  });
}

function sizeBoard() {
  const W = window.innerWidth, H = window.innerHeight;
  const bs = Math.max(280, Math.floor(W > 980 ? Math.min(H - 32, W - 450, 960) : Math.min(W - 16, Math.max(H - 250, 300), 760)));
  const n = C.SIDE, gap = bs < 520 ? 2 : 3;
  const corner = Math.round(bs * (n > 9 ? 0.115 : 0.13));
  const cw = (bs - 2 * gap - (n + 1) * gap - 2 * corner) / n;
  const st = document.documentElement.style;
  st.setProperty('--bs', bs + 'px'); st.setProperty('--gap', gap + 'px'); st.setProperty('--corner', corner + 'px');
  st.setProperty('--cw', cw.toFixed(2) + 'px'); st.setProperty('--cell-font', Math.max(6.5, cw * 0.165).toFixed(2) + 'px');
  if (S) placeTokens(false);
}
const setXY = (t, x, y) => { t.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`; };

/* ---------- القطع ---------- */
function tokenXY(p, pos, jailed) {
  const cell = document.querySelector(`.cell[data-sq="${pos}"]`);
  const bs = cell.parentElement.offsetWidth;
  let x = cell.offsetLeft + cell.offsetWidth / 2, y = cell.offsetTop + cell.offsetHeight / 2;
  if (pos === C.JAIL_POS) { // السجن أعلى اليمين: الزنزانة نحو الداخل والزوار على الحافتين
    if (jailed) { x -= cell.offsetWidth * 0.17; y += cell.offsetHeight * 0.17; }
    else { x += cell.offsetWidth * 0.3; y -= cell.offsetHeight * 0.3; }
  }
  // توزيع القطع المتعددة على الخانة نفسها
  const same = S.players.filter(o => !o.bankrupt && (ui.tokenPos[o.id] ?? o.pos) === pos && (pos !== C.JAIL_POS || !!o.inJail === !!jailed));
  const k = same.findIndex(o => o.id === p.id), n = same.length;
  if (n > 1) {
    const step = bs * 0.024;
    if (pos === C.JAIL_POS && !jailed) {
      const along = (k - (n - 1) / 2) * step; // على حافتي الزيارة
      x += k % 2 ? -Math.abs(along) * 1.4 : 0; y += k % 2 ? 0 : Math.abs(along) * 1.4;
    } else {
      const cols = n > 4 ? 3 : 2, r = Math.floor(k / cols), c = k % cols, rows = Math.ceil(n / cols);
      x += (c - (cols - 1) / 2) * step * 1.3; y += (r - (rows - 1) / 2) * step * 1.3;
    }
  }
  return { x, y };
}
function placeTokens(useDisplay) {
  const layer = $('#tokens');
  S.players.forEach(p => {
    let t = layer.querySelector(`[data-token="${p.id}"]`);
    let fresh = false;
    if (!t) { t = h('div', { class: 'token', 'data-token': p.id, style: `--tc:${pColor(p)}` }, h('span', { class: 'tb', html: tokenSVG(p.token) })); layer.append(t); fresh = true; }
    t.classList.toggle('hidden', p.bankrupt);
    const pos = useDisplay && ui.tokenPos[p.id] !== undefined ? ui.tokenPos[p.id] : p.pos;
    const jailed = p.inJail && pos === C.JAIL_POS;
    const { x, y } = tokenXY(p, pos, jailed);
    if (fresh) { t.style.transition = 'none'; setXY(t, x, y); void t.offsetWidth; t.style.transition = ''; } else setXY(t, x, y);
    t.classList.toggle('jailed', jailed);
    t.classList.toggle('active', S.phase === 'playing' && p.id === S.current);
  });
}

/* ============================================================
 * العرض
 * ============================================================ */
function renderBoardState() {
  OWNABLE.forEach(i => {
    const cell = document.querySelector(`.cell[data-sq="${i}"]`), pr = S.props[i];
    const strip = cell.querySelector('.owner-strip');
    strip.style.background = pr.owner !== null ? pColor(S.players[pr.owner]) : 'transparent';
    cell.classList.toggle('owned', pr.owner !== null);
    if (pr.owner !== null) cell.style.setProperty('--own', pColor(S.players[pr.owner])); else cell.style.removeProperty('--own');
    cell.dataset.owner = pr.owner ?? '';
    cell.classList.toggle('mortgaged', pr.mortgaged);
    const bar = cell.querySelector('.bar');
    if (bar) {
      bar.innerHTML = '';
      bar.classList.toggle('has-b', pr.houses > 0);
      if (pr.houses === C.HOTEL_LEVEL) bar.append(h('span', { class: 'hotel' }));
      else for (let k = 0; k < pr.houses; k++) bar.append(h('span', { class: 'house' }));
      cell.dataset.houses = pr.houses;
    }
  });
  const potEl = document.querySelector('[data-pot]');
  if (potEl) potEl.replaceChildren(E.rules(S).vacationCash ? M(S.pot || 0) : '');
  document.querySelectorAll('.cell.highlight').forEach(c => c.classList.remove('highlight'));
  const hl = S.turnPhase === 'buyDecision' ? S.pendingBuy : S.auction ? S.auction.sq : null;
  if (hl !== null && hl !== undefined) document.querySelector(`.cell[data-sq="${hl}"]`).classList.add('highlight');
}
function renderCenter() {
  const cur = S.players[S.current];
  const ct = $('#center-turn'); ct.innerHTML = '';
  if (S.phase === 'playing') ct.append(tokenEl(cur, ''), `الدور: ${cur.name}`);
  else ct.append('🏆 ', S.players[S.winner].name);
  ct.querySelector('.tk') && (ct.querySelector('.tk').style.cssText += ';width:1.6em;height:1.6em');
  const last = [...S.log].reverse().find(l => l.k !== 'turn') || S.log[S.log.length - 1];
  $('#center-msg').textContent = last ? last.t : '';
  $('#center-pot').replaceChildren(E.rules(S).vacationCash ? h('span', null, '🏝 أموال الإجازة: ', M(S.pot || 0)) : '');
}
function cashOf(p) { return ui.displayCash ? ui.displayCash[p.id] : p.cash; }
function renderPlayers() {
  const box = $('#players'); box.innerHTML = '';
  S.players.forEach(p => {
    const chips = h('div', { class: 'chips' });
    Object.keys(GROUP_MEMBERS).forEach(g => GROUP_MEMBERS[g].forEach(i => {
      if (S.props[i].owner === p.id) chips.append(h('span', { class: 'chip' + (S.props[i].mortgaged ? ' m' : ''), title: SQUARES[i].name, style: `background:${GROUPS[g].color}` }));
    }));
    const badges = [];
    if (S.teams && p.team !== null) badges.push(h('span', { class: 'badge team', style: `background:var(--team-${p.team})` }, TEAM_SHORT[p.team]));
    if (isOnline() && p.id === Net.mySeat) badges.push(h('span', { class: 'badge me' }, 'أنت'));
    if (p.isAI) badges.push(h('span', { class: 'badge ai' }, 'كمبيوتر'));
    if (p.inJail) badges.push(h('span', { class: 'badge jail' }, 'في السجن'));
    if (p.goojf.length) badges.push(h('span', { class: 'badge card', title: 'بطاقة خروج من السجن' }, '🗝 ' + p.goojf.length));
    if (p.bankrupt) badges.push(h('span', { class: 'badge' }, 'مفلس'));
    box.append(h('div', { class: `prow${p.id === S.current && S.phase === 'playing' ? ' active' : ''}${p.bankrupt ? ' out' : ''}`, 'data-player': p.id, style: `--pcol:${pColor(p)}`, onclick: () => openPortfolio(p.id) },
      tokenEl(p, ''), h('div', null, h('div', { class: 'pname' }, p.name, ...badges), chips),
      h('div', { class: 'pcash', 'data-cash': p.id }, M(cashOf(p)))));
  });
}
function renderLog() {
  const ol = $('#log'); ol.innerHTML = '';
  S.log.slice(-80).forEach(l => ol.append(h('li', { class: l.k }, l.t)));
}
function btn(label, onclick, cls, data) { return h('button', Object.assign({ class: cls || '', onclick }, data || {}), label); }
function act(move) { Snd.play('click'); return performMove(move); }

function renderTurn() {
  const head = $('#turn-head'), info = $('#turn-info'), actions = $('#actions');
  head.innerHTML = ''; info.innerHTML = ''; actions.innerHTML = '';
  if (S.phase !== 'playing') {
    const w = S.players[S.winner];
    $('#turn-panel').style.setProperty('--pc', pColor(w));
    head.append(tokenEl(w, ''), h('div', null, h('div', { class: 'turn-name' }, S.teams ? `${E.TEAM_NAMES[w.team]} فاز!` : `${w.name} فاز!`), h('div', { class: 'turn-phase' }, 'انتهت اللعبة')));
    actions.append(btn('لعبة جديدة', showLobby, 'big', { 'data-action': 'new-game' }));
    return;
  }
  const a = actor(), p = S.players[a], cur = S.players[S.current];
  $('#turn-panel').style.setProperty('--pc', pColor(p));
  head.append(tokenEl(p, ''), h('div', null, h('div', { class: 'turn-name', 'data-current-player': a }, p.name), h('div', { class: 'turn-phase' }, phaseText())));
  const busy = ui.pending > 0 || ui.netWait;
  info.append(infoText());
  if (!canControl(a)) { actions.append(h('div', { class: 'turn-phase wait-msg' }, busy ? '…' : p.isAI ? `${p.name} يفكّر…` : `بانتظار ${p.name}…`)); return; }
  const valid = E.getValidMoves(S);
  const has = t => valid.some(m => m.type === t);
  const B = (label, move, cls) => { const b = btn(label, () => act(move), cls, { 'data-action': move.type }); b.disabled = busy; return b; };
  const tp = S.turnPhase;
  if (tp === 'preRoll') {
    actions.append(B(cur.inJail ? 'ارمِ لمحاولة الدبل' : (S.dice && S.lastRollDoubles ? 'ارمِ مرة أخرى' : 'ارمِ النرد'), { type: 'roll' }, 'big'));
    if (has('payJail')) actions.append(B(h('span', null, 'ادفع ', M(C.JAIL_FINE)), { type: 'payJail' }, 'secondary'));
    if (has('useJailCard')) actions.append(B('استخدم بطاقة الخروج', { type: 'useJailCard' }, 'secondary'));
  } else if (tp === 'buyDecision') {
    const sq = SQUARES[S.pendingBuy];
    if (has('buy')) actions.append(B(h('span', null, 'اشترِ بـ ', M(sq.price)), { type: 'buy' }, 'big success'));
    if (has('auction')) actions.append(B('اطرحه في المزاد', { type: 'auction' }, 'secondary'));
    else actions.append(B('تخطَّ', { type: 'decline' }, 'secondary'));
  } else if (tp === 'postRoll') {
    actions.append(B('إنهاء الدور', { type: 'endTurn' }, 'big'));
  } else if (tp === 'auction') {
    actions.append(btn('افتح المزاد', () => syncAutoModal(true), 'big'));
  } else if (tp === 'trade') {
    actions.append(btn('راجع العرض', () => syncAutoModal(true), 'big'));
  } else if (tp === 'debt') {
    const d = S.debts[0];
    if (has('payDebt')) actions.append(B(h('span', null, 'سدّد ', M(d.amount)), { type: 'payDebt' }, 'big success'));
    const bk = btn('أعلن الإفلاس', () => confirmBankrupt(), 'secondary', { 'data-action': 'bankrupt' }); bk.disabled = busy; actions.append(bk);
  }
  if (E.getValidMoves(S).some(m => ['build', 'sell', 'mortgage', 'unmortgage'].includes(m.type)) || ['preRoll', 'postRoll', 'buyDecision', 'debt'].includes(tp)) {
    const row = h('div', { class: 'row-tools' });
    const mb = btn(tp === 'debt' ? 'بِع أو ارهن' : 'عقاراتي', openManage, 'secondary', { 'data-action': 'manage' }); mb.disabled = busy; row.append(mb);
    if (has('proposeTrade')) { const tb = btn('مقايضة', openTradeBuilder, 'secondary', { 'data-action': 'trade' }); tb.disabled = busy; row.append(tb); }
    actions.append(row);
  }
}
function phaseText() {
  const a = actor(), cur = S.players[S.current];
  switch (S.turnPhase) {
    case 'preRoll': return cur.inJail ? `في السجن — المحاولة ${cur.jailTurns + 1} من ${C.MAX_JAIL_TURNS}` : 'ارمِ النرد للتحرك';
    case 'buyDecision': return E.rules(S).auction ? 'اشترِ العقار أو اطرحه في المزاد' : 'اشترِ العقار أو تخطَّه';
    case 'postRoll': return 'أدِر عقاراتك أو أنهِ دورك';
    case 'auction': return `مزاد على ${SQUARES[S.auction.sq].name}`;
    case 'trade': return `عرض مقايضة من ${S.players[S.trade.from].name}`;
    case 'debt': return `عليه دين — ${a === S.current ? 'دوره' : 'خارج دوره'}`;
  }
  return '';
}
function infoText() {
  const tp = S.turnPhase;
  if (tp === 'debt') {
    const d = S.debts[0];
    const to = d.creditor === 'bank' ? 'البنك' : d.creditor === 'each' ? 'كل اللاعبين' : S.players[d.creditor].name;
    return h('span', null, 'المطلوب ', M(d.amount), ` لـ ${to} (${d.reason}). رصيدك `, M(S.players[d.debtor].cash), '. بِع مبانيَ أو ارهن عقارات ثم سدّد.');
  }
  if (tp === 'buyDecision') { const sq = SQUARES[S.pendingBuy]; return h('span', null, `${sq.name} — السعر `, M(sq.price), E.rules(S).auction ? '. إن لم تشترِه يُطرح في مزاد للجميع.' : '. إن لم تشترِه يبقى للبنك.'); }
  if (tp === 'auction') { const a = S.auction; return h('span', null, 'أعلى مزايدة ', M(a.high), a.bidder !== null ? ` من ${S.players[a.bidder].name}` : ''); }
  if (S.dice) return h('span', null, `آخر رمية: ${S.dice[0]} + ${S.dice[1]} = ${S.dice[0] + S.dice[1]}`);
  return h('span', null, 'رصيد البنك: ', `${S.bank.houses} بيت و ${S.bank.hotels} فندق`);
}

function renderAll() {
  if (!S) return;
  renderBoardState(); placeTokens(false); renderPlayers(); renderLog(); renderCenter(); renderTurn();
  syncAutoModal(false);
  if (ui.modal && ui.modal.refresh) ui.modal.refresh();
}

/* ============================================================
 * النوافذ
 * ============================================================ */
function openModal(key, kind, build, opts) {
  closeModal(true);
  const root = $('#modal-root');
  const box = h('div', { class: 'modal' + (opts && opts.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'data-modal': key });
  const back = h('div', { class: 'modal-back', onclick: e => { if (e.target === back && kind === 'manual') closeModal(); } }, box);
  root.append(back);
  ui.modal = { key, kind, box, refresh: null };
  const refresh = () => { box.innerHTML = ''; build(box); };
  ui.modal.refresh = (opts && opts.static) ? null : refresh;
  build(box);
  const f = box.querySelector('button:not([disabled])'); if (f && !(opts && opts.noFocus)) f.focus({ preventScroll: true });
}
function closeModal(silent) {
  $('#modal-root').innerHTML = '';
  const was = ui.modal; ui.modal = null;
  if (!silent && was && S) syncAutoModal(false);
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && ui.modal && ui.modal.kind === 'manual') closeModal();
  if ((e.key === ' ' || e.key === 'Enter') && S && !ui.modal && !ui.cardOpen && document.activeElement === document.body && isHumanActor() && !ui.pending) {
    const v = E.getValidMoves(S);
    const m = v.find(x => x.type === 'roll') || v.find(x => x.type === 'endTurn');
    if (m) { e.preventDefault(); act({ type: m.type }); }
  }
});

/* نوافذ تلقائية تتبع المرحلة: الشراء، المزاد، رد المقايضة، نهاية اللعبة */
function syncAutoModal(force) {
  if (!S || ui.cardOpen) return;
  if (ui.pending && !force) return;
  if (ui.modal && ui.modal.kind === 'manual' && !force) return;
  const tp = S.phase === 'gameOver' ? 'gameOver' : S.turnPhase;
  const human = isHumanActor();
  let want = null;
  if (tp === 'gameOver') want = 'gameover';
  else if (tp === 'buyDecision' && human) want = 'buy';
  else if (tp === 'auction') want = 'auction';
  else if (tp === 'trade' && human) want = 'tradeReply';
  if (!want) { if (ui.modal && ui.modal.kind === 'auto') closeModal(true); return; }
  if (ui.modal && ui.modal.key === want) { ui.modal.refresh && ui.modal.refresh(); return; }
  if (want === 'buy') openModal('buy', 'auto', buildBuyModal);
  if (want === 'auction') openModal('auction', 'auto', buildAuctionModal, { noFocus: true });
  if (want === 'tradeReply') openModal('tradeReply', 'auto', buildTradeReply);
  if (want === 'gameover') openModal('gameover', 'auto', buildGameOver, { static: true });
}

function deedEl(i) {
  const sq = SQUARES[i], pr = S.props[i];
  const d = h('div', { class: 'deed' });
  if (sq.type === 'property') {
    const gr = GROUPS[sq.group];
    d.append(h('div', { class: 'deed-head' + (['yellow', 'lightblue'].includes(sq.group) || gr.light ? ' light' : ''), style: `background:${gr.color}` }, gr.flag ? flagEl(gr.flag) : null, h('small', null, gr.flag ? gr.name : 'سند ملكية'), h('b', null, sq.name)));
    const dbl = E.rules(S).doubleSet;
    const rows = [['الإيجار', sq.rent[0], 0], dbl ? ['مع المجموعة كاملة', sq.rent[0] * 2, -1] : null, ['مع بيت واحد', sq.rent[1], 1], ['مع بيتين', sq.rent[2], 2], ['مع 3 بيوت', sq.rent[3], 3], ['مع 4 بيوت', sq.rent[4], 4], ['مع فندق', sq.rent[5], 5]].filter(Boolean);
    const t = h('table');
    rows.forEach(([l, v, lv]) => t.append(h('tr', { class: pr.owner !== null && lv > 0 && pr.houses === lv ? 'now' : '' }, h('td', null, l), h('td', null, M(v)))));
    t.append(h('tr', { class: 'sep' }, h('td', null, 'تكلفة البيت / الفندق'), h('td', null, M(sq.house))));
    t.append(h('tr', null, h('td', null, 'قيمة الرهن'), h('td', null, M(sq.price / 2))));
    d.append(t);
  } else if (sq.type === 'railroad') {
    const air = sq.icon === 'plane', unit = air ? 'مطار' : 'محطة';
    d.append(h('div', { class: 'deed-head', style: 'background:linear-gradient(140deg,#7a1712,#3b0504)' }, h('div', { style: 'width:30px;height:30px', html: svg(air ? ICON.plane : ICON.train, 'style="fill:#fbf5ec"') }), h('small', null, air ? 'مطار' : 'محطة قطار'), h('b', null, sq.name)));
    const t = h('table');
    [['الإيجار', 25], [`إن امتلك ${unit}ين`, 50], [`إن امتلك 3`, 100], [`إن امتلك 4`, 200], ['قيمة الرهن', 100]].forEach(([l, v]) => t.append(h('tr', null, h('td', null, l), h('td', null, M(v)))));
    d.append(t);
  } else if (sq.type === 'utility') {
    d.append(h('div', { class: 'deed-head', style: 'background:linear-gradient(140deg,#a5a79b,#6d6f64)' }, h('div', { style: 'width:30px;height:30px', html: svg(SQUARE_ICON(sq), 'style="fill:#fbf5ec"') }), h('small', null, 'شركة'), h('b', null, sq.name)));
    const nU = (GROUP_MEMBERS.utility || []).length;
    for (let k = 1; k <= nU; k++) d.append(h('p', { style: 'font-size:.9rem;margin:6px 8px' }, `إن امتلك ${k === 1 ? 'شركة واحدة' : k === nU && k === 2 ? 'الشركتين' : k + ' شركات'}: الإيجار ${C.UTIL_MULT[k]} أضعاف مجموع النرد.`));
    const t = h('table'); t.append(h('tr', null, h('td', null, 'قيمة الرهن'), h('td', null, M(75)))); d.append(t);
  }
  const ownerTxt = pr.owner === null ? h('span', null, 'للبيع — ', M(sq.price)) : h('span', null, `المالك: ${S.players[pr.owner].name}${pr.mortgaged ? ' (مرهون)' : ''}`);
  d.append(h('div', { class: 'owner' }, ownerTxt));
  return d;
}
const SQUARE_HELP = {
  go: 'كل مرة تمر بهذه الخانة أو تقف عليها تقبض $200 من البنك.',
  refund: 'اقبض $50 من البنك عند الوقوف هنا.',
  jail: 'إن كنت مجرد زائر فلا شيء عليك. السجين يخرج بدفع $50 أو ببطاقة أو برمي دبل، وبعد 3 محاولات يدفع إجبارياً.',
  parking: 'استرح! لا شيء يحدث هنا.',
  vacation: 'استرح! ومع تفعيل «أموال الإجازة» تربح كل الضرائب والغرامات المتجمّعة.',
  gotojail: 'اذهب مباشرة إلى السجن دون المرور بالانطلاق.',
  chance: 'اسحب بطاقة من هذه المجموعة ونفّذها.',
  chest: 'اسحب بطاقة من هذه المجموعة ونفّذها.',
};
function openDeed(i) {
  if (!S) return;
  const sq = SQUARES[i];
  openModal('deed', 'manual', box => {
    if (sq.price) box.append(deedEl(i));
    else box.append(h('h2', null, sq.name), h('p', null, sq.type === 'tax' ? (sq.pct ? `ادفع ${sq.pct}% من رصيدك للبنك عند الوقوف هنا.` : h('span', null, 'ادفع ', M(sq.amount), ' للبنك عند الوقوف هنا.'))
      : sq.type === 'parking' && E.rules(S).vacationCash ? h('span', null, SQUARE_HELP.vacation, ' المتجمّع الآن: ', M(S.pot || 0)) : SQUARE_HELP[sq.type]));
    const here = S.players.filter(p => !p.bankrupt && p.pos === i);
    if (here.length) box.append(h('p', { style: 'text-align:center;margin-top:12px' }, 'هنا الآن: ', here.map(p => p.name).join('، ')));
    box.append(h('div', { class: 'btns' }, btn('إغلاق', () => closeModal(), 'secondary')));
  });
}
function buildBuyModal(box) {
  const i = S.pendingBuy, sq = SQUARES[i], p = S.players[actor()];
  const can = p.cash >= sq.price;
  box.append(h('h2', { style: 'text-align:center' }, `${p.name} وصل إلى ${sq.name}`), deedEl(i));
  box.append(h('p', { style: 'text-align:center' }, 'رصيدك ', M(p.cash), can ? '' : ' — لا يكفي للشراء، يمكنك الرهن أولاً'));
  const b = h('div', { class: 'btns' });
  if (can) b.append(btn(h('span', null, 'اشترِ بـ ', M(sq.price)), () => act({ type: 'buy' }), 'success', { 'data-action': 'buy' }));
  if (E.rules(S).auction) b.append(btn('مزاد', () => act({ type: 'auction' }), 'secondary', { 'data-action': 'auction' }));
  else b.append(btn('تخطَّ', () => act({ type: 'decline' }), 'secondary', { 'data-action': 'decline' }));
  b.append(btn('عقاراتي', openManage, 'ghost'));
  box.append(b);
}
function buildAuctionModal(box) {
  const a = S.auction; if (!a) return;
  const sq = SQUARES[a.sq], who = S.players[actor()];
  box.append(h('h2', { style: 'text-align:center' }, '🔨 مزاد علني'), deedEl(a.sq));
  box.append(h('div', { class: 'auction-high' }, h('div', { class: 'turn-phase' }, a.bidder !== null ? `أعلى مزايدة من ${S.players[a.bidder].name}` : 'لا مزايدات بعد'), h('div', { class: 'amt money', 'data-high-bid': a.high }, money(a.high))));
  const bidders = h('div', { class: 'bidders' });
  a.order.forEach(id => { const p = S.players[id]; bidders.append(h('span', { class: `bidder${id === who.id ? ' now' : ''}${a.passed.includes(id) ? ' out' : ''}` }, tokenEl(p, ''), p.name)); });
  box.append(bidders);
  if (!canControl(who.id) || ui.pending || ui.netWait) { box.append(h('p', { style: 'text-align:center;margin-top:12px' }, `${who.name} يقرّر…`)); return; }
  box.append(h('p', { style: 'text-align:center;font-weight:800;margin-top:12px' }, `دور ${who.name} — رصيدك `, M(who.cash)));
  const bb = h('div', { class: 'bid-btns' });
  [1, 10, 50, 100].forEach(inc => { const amt = a.high + inc; const b = btn(h('span', { class: 'money' }, '+' + inc), () => act({ type: 'bid', amount: amt }), '', { 'data-bid': inc }); b.disabled = amt > who.cash; bb.append(b); });
  box.append(bb);
  const inp = h('input', { type: 'number', min: a.high + 1, max: who.cash, placeholder: 'مبلغ آخر', style: 'flex:1', 'aria-label': 'مبلغ المزايدة' });
  const err = h('div', { class: 'err' });
  box.append(h('div', { class: 'btns' }, inp, btn('زايد', () => { const r = act({ type: 'bid', amount: parseInt(inp.value, 10) }); if (!r.success) err.textContent = r.error; }, 'success'), btn('انسحب', () => act({ type: 'pass' }), 'secondary', { 'data-action': 'pass' })), err);
}

function rentNow(i) {
  const sq = SQUARES[i], pr = S.props[i];
  if (pr.mortgaged) return 'مرهون';
  if (sq.type === 'utility') return `${C.UTIL_MULT[E.countOwned(S, pr.owner, 'utility')]}× النرد`;
  return money(E.computeRent(S, i, 7));
}
function propRows(pid, editable) {
  const list = h('div', { class: 'manage-list' });
  let any = false;
  Object.keys(GROUP_MEMBERS).forEach(g => GROUP_MEMBERS[g].forEach(i => {
    const pr = S.props[i]; if (pr.owner !== pid) return; any = true;
    const sq = SQUARES[i];
    const status = [];
    if (pr.houses === C.HOTEL_LEVEL) status.push('فندق'); else if (pr.houses) status.push(`${pr.houses} بيت`);
    if (pr.mortgaged) status.push('مرهون');
    if (sq.type === 'property' && E.ownsGroup(S, pid, g)) status.push('مجموعة كاملة');
    const btns = h('div', { class: 'mbtns' });
    if (editable) {
      const mk = (label, type, errFn) => { const e = errFn(S, pid, i); const b = btn(label, () => { const r = act({ type, sq: i }); if (!r.success) toast(r.error); }, type === 'build' || type === 'unmortgage' ? 'success' : 'secondary', { 'data-manage': type, 'data-sq': i, title: e || '' }); b.disabled = !!e || ui.pending > 0 || (S.turnPhase === 'debt' && (type === 'build' || type === 'unmortgage')); return b; };
      if (sq.type === 'property') { btns.append(mk(h('span', null, 'ابنِ ', M(sq.house)), 'build', E.buildError)); if (pr.houses) btns.append(mk(h('span', null, 'بيع +', M(sq.house / 2)), 'sell', E.sellError)); }
      if (pr.mortgaged) btns.append(mk(h('span', null, 'فك ', M(E.unmortgageCost(i))), 'unmortgage', E.unmortgageError));
      else if (E.rules(S).mortgage) btns.append(mk(h('span', null, 'ارهن +', M(E.mortgageValue(i))), 'mortgage', E.mortgageError));
    }
    list.append(h('div', { class: 'mrow', 'data-prop': i }, h('span', { class: 'sw', style: `background:${GROUPS[g].color}` }),
      h('div', null, h('div', { class: 'mname' }, sq.name), h('div', { class: 'msub' }, (status.join(' · ') || 'بلا مبانٍ'), ' — الإيجار: ', rentNow(i))), btns));
  }));
  if (!any) list.append(h('div', { class: 'empty' }, 'لا يملك عقارات بعد. اشترِ عقاراً عندما تقف عليه.'));
  return list;
}
function openManage() {
  openModal('manage', 'manual', box => {
    const a = actor(); if (a === null) { box.append(h('p', null, 'لا يوجد لاعب نشط')); return; }
    const p = S.players[a];
    box.append(h('h2', null, `عقارات ${p.name}`));
    box.append(h('p', null, 'الرصيد ', M(p.cash), ` · البنك: ${S.bank.houses} بيت، ${S.bank.hotels} فندق`));
    if (S.turnPhase === 'debt') box.append(h('p', { class: 'err' }, 'عليك دين ', M(S.debts[0].amount), ' — بِع المباني أو ارهن العقارات ثم سدّد.'));
    box.append(propRows(a, canControl(a)));
    const b = h('div', { class: 'btns' });
    if (S.turnPhase === 'debt' && E.getValidMoves(S).some(m => m.type === 'payDebt')) b.append(btn(h('span', null, 'سدّد ', M(S.debts[0].amount)), () => { act({ type: 'payDebt' }); closeModal(); }, 'success'));
    b.append(btn('تم', () => closeModal(), 'secondary', { 'data-action': 'close' }));
    box.append(b);
  }, { wide: true });
}
function openPortfolio(pid) {
  openModal('portfolio', 'manual', box => {
    const p = S.players[pid];
    box.append(h('h2', { style: 'display:flex;align-items:center;gap:8px' }, tokenEl(p, ''), p.name));
    box.append(h('p', null, 'النقد ', M(p.cash), ' · صافي الثروة ', M(E.netWorth(S, pid)), p.goojf.length ? ` · بطاقات خروج: ${p.goojf.length}` : ''));
    box.append(propRows(pid, false));
    box.append(h('div', { class: 'btns' }, btn('إغلاق', () => closeModal(), 'secondary')));
  }, { wide: true });
}
function confirmBankrupt() {
  const p = S.players[actor()];
  const can = p.cash + E.liquidationValue(S, p.id);
  openModal('confirm', 'manual', box => {
    box.append(h('h2', null, 'إعلان الإفلاس؟'));
    box.append(h('p', null, `${p.name} يستطيع جمع حتى `, M(can), ' ببيع المباني ورهن العقارات، والدين ', M(S.debts[0].amount), '.'));
    if (can >= S.debts[0].amount) box.append(h('p', { class: 'err' }, 'ما زال بإمكانك السداد — جرّب البيع أو الرهن أولاً.'));
    box.append(h('p', null, 'سيخرج اللاعب من اللعبة نهائياً.'));
    box.append(h('div', { class: 'btns' }, btn('نعم، أعلن الإفلاس', () => { closeModal(true); act({ type: 'bankrupt' }); }, '', { 'data-action': 'confirm-bankrupt' }), btn('تراجع', () => closeModal(), 'secondary')));
  });
}

/* ---------- المقايضة ---------- */
function openTradeBuilder() {
  const me = actor();
  const others = S.players.filter(p => !p.bankrupt && p.id !== me);
  const draft = { to: others[0].id, give: { props: [], cash: 0, cards: 0 }, get: { props: [], cash: 0, cards: 0 } };
  openModal('trade', 'manual', box => {
    box.append(h('h2', null, 'عرض مقايضة'));
    const seg = h('div', { class: 'seg', style: 'margin-bottom:12px' });
    others.forEach(o => seg.append(h('button', { class: o.id === draft.to ? 'on' : '', onclick: () => { draft.to = o.id; draft.get = { props: [], cash: 0, cards: 0 }; ui.modal.refresh(); } }, o.name)));
    box.append(h('div', { class: 'lobby-row' }, h('label', null, 'مع'), seg));
    const col = (pid, side, title) => {
      const p = S.players[pid], c = h('div', { class: 'trade-col' }, h('h4', null, tokenEl(p, ''), title));
      let any = false;
      OWNABLE.forEach(i => {
        if (S.props[i].owner !== pid) return; any = true;
        const e = E.tradeTransferable(S, pid, i), sq = SQUARES[i];
        const checked = draft[side].props.includes(i);
        const cb = h('input', { type: 'checkbox', checked, disabled: !!e, 'data-trade-prop': i });
        cb.addEventListener('change', () => { const arr = draft[side].props; if (cb.checked) arr.push(i); else arr.splice(arr.indexOf(i), 1); upd(); });
        c.append(h('label', { class: 'tprop' + (e ? ' disabled' : ''), title: e || '' }, cb, h('span', { class: 'sw', style: `background:${GROUPS[sq.group].color}` }), sq.name, S.props[i].mortgaged ? ' (مرهون)' : ''));
      });
      if (!any) c.append(h('div', { class: 'empty', style: 'padding:6px' }, 'لا عقارات'));
      const ci = h('input', { type: 'number', min: 0, max: p.cash, value: draft[side].cash || '', placeholder: '0', 'data-trade-cash': side });
      ci.addEventListener('input', () => { draft[side].cash = Math.max(0, parseInt(ci.value, 10) || 0); upd(); });
      c.append(h('div', { class: 'tcash' }, 'مال $', ci, h('span', { style: 'white-space:nowrap;color:var(--color-ink-soft)' }, '/ ', M(p.cash))));
      if (p.goojf.length) {
        const ki = h('input', { type: 'number', min: 0, max: p.goojf.length, value: draft[side].cards || '', placeholder: '0' });
        ki.addEventListener('input', () => { draft[side].cards = Math.max(0, parseInt(ki.value, 10) || 0); upd(); });
        c.append(h('div', { class: 'tcash' }, 'بطاقات خروج', ki));
      }
      return c;
    };
    box.append(h('div', { class: 'trade-grid' }, col(me, 'give', 'تعطي'), col(draft.to, 'get', 'تطلب')));
    const err = h('div', { class: 'err', style: 'margin-top:8px' });
    const send = btn('أرسل العرض', () => {
      const r = act({ type: 'proposeTrade', to: draft.to, give: draft.give, get: draft.get });
      if (r.success) closeModal(true); else err.textContent = r.error;
    }, 'success', { 'data-action': 'send-trade' });
    function upd() { const e = E.tradeError(S, me, draft); err.textContent = e || ''; send.disabled = !!e; }
    box.append(err, h('div', { class: 'btns' }, send, btn('إلغاء', () => closeModal(), 'secondary')));
    upd();
  }, { wide: true, static: false });
  ui.modal.refresh = null; // لا تعيد البناء مع كل عرض (يحفظ المسودة)
  ui.modal.rebuild = true;
}
function tradeSummary(t) {
  const A = S.players[t.from], B = S.players[t.to];
  const list = side => {
    const items = side.props.map(i => SQUARES[i].name + (S.props[i].mortgaged ? ' (مرهون)' : ''));
    if (side.cash) items.push(money(side.cash));
    if (side.cards) items.push(`${side.cards} بطاقة خروج من السجن`);
    return h('ul', null, items.length ? items.map(x => h('li', null, x)) : h('li', null, 'لا شيء'));
  };
  return h('div', { class: 'trade-summary trade-grid' },
    h('div', { class: 'trade-col' }, h('h4', null, tokenEl(A, ''), `${A.name} يعطي`), list(t.give)),
    h('div', { class: 'trade-col' }, h('h4', null, tokenEl(B, ''), `${B.name} يعطي`), list(t.get)));
}
function buildTradeReply(box) {
  const t = S.trade; if (!t) return;
  const B = S.players[t.to];
  box.append(h('h2', null, `عرض مقايضة إلى ${B.name}`), tradeSummary(t));
  const fees = t.give.props.filter(i => S.props[i].mortgaged);
  if (fees.length) box.append(h('p', { class: 'turn-phase' }, 'ستدفع رسوم 10% عن العقارات المرهونة التي تستلمها.'));
  const v = E.getValidMoves(S);
  const acc = btn('موافق', () => act({ type: 'acceptTrade' }), 'success', { 'data-action': 'acceptTrade' }); acc.disabled = !v.some(m => m.type === 'acceptTrade') || ui.pending > 0;
  box.append(h('div', { class: 'btns' }, acc, btn('رفض', () => act({ type: 'rejectTrade' }), 'secondary', { 'data-action': 'rejectTrade' })));
}
function buildGameOver(box) {
  const w = S.players[S.winner];
  box.classList.add('winner');
  box.append(tokenEl(w, ''), h('h2', null, S.teams ? `${E.TEAM_NAMES[w.team]} فاز!` : `${w.name} فاز!`), h('p', null, `بعد ${S.turn} دوراً، بثروة `, M(E.netWorth(S, w.id))));
  S.players.filter(p => p.id !== w.id).forEach(p => box.append(h('div', { class: 'rank' }, h('span', null, p.name), h('span', null, p.bankrupt ? 'أفلس' : money(E.netWorth(S, p.id))))));
  box.append(h('div', { class: 'btns' }, btn('لعبة جديدة', () => { clearSave(); showLobby(); }, '', { 'data-action': 'new-game' }), btn('شاهد اللوحة', () => closeModal(true), 'secondary')));
}
function openRules() {
  openModal('rules', 'manual', box => {
    box.append(h('h2', null, 'قواعد اللعب'), h('div', { class: 'rules-text', html: `
      <h3>الهدف</h3><ul><li>كن آخر لاعب غير مفلس.</li></ul>
      <h3>الدور</h3><ul><li>ارمِ النردين وتحرك بمجموعهما. المرور بالانطلاق يعطيك $200.</li><li>الدبل يمنحك رمية إضافية، وثلاث دبلات متتالية ترسلك إلى السجن.</li></ul>
      <h3>العقارات</h3><ul><li>عند الوقوف على عقار غير مملوك: اشترِه أو اطرحه في مزاد يشارك فيه الجميع.</li><li>عند الوقوف على عقار غيرك: ادفع الإيجار. لا إيجار على المرهون.</li><li>امتلاك مجموعة لون كاملة يضاعف الإيجار ويسمح بالبناء.</li><li>المحطات: $25، $50، $100، $200 حسب العدد. الشركات: 4× أو 10× مجموع النرد.</li></ul>
      <h3>البناء والرهن</h3><ul><li>ابنِ بالتوازن: لا يزيد عقار عن آخر في المجموعة بأكثر من بيت. بعد 4 بيوت يأتي الفندق.</li><li>البنك يملك 32 بيتاً و12 فندقاً فقط.</li><li>بيع المباني بنصف سعرها. الرهن يعطيك نصف السعر، وفكّه بالقيمة + 10%.</li></ul>
      <h3>السجن</h3><ul><li>اخرج بدفع $50، أو ببطاقة الخروج، أو برمي دبل. بعد 3 محاولات فاشلة تدفع $50 وتتحرك.</li><li>صاحب العقار في السجن ما زال يقبض الإيجار.</li></ul>
      <h3>المقايضة والإفلاس</h3><ul><li>في دورك يمكنك عرض عقارات ومال وبطاقات على أي لاعب.</li><li>إن لم تستطع الدفع: بِع وارهن، وإلا أعلن إفلاسك وتنتقل أصولك للدائن.</li></ul>
      <h3>الخرائط</h3><ul><li>الأصلية وكلاسيك وعجلة الحظ: 40 خانة. حول العالم: 48 خانة مع 3 شركات (4× / 10× / 20× النرد).</li><li>ضريبة الأرباح = 10% من رصيدك، الضريبة الفاخرة $75، الاسترداد الضريبي +$50.</li></ul>
      <h3>اختصارات</h3><ul><li>مفتاح المسافة أو Enter: ارمِ النرد / أنهِ الدور. اضغط أي خانة لعرض تفاصيلها.</li></ul>` }),
      S ? h('div', { class: 'rules-text' }, h('h3', null, 'إعدادات هذه اللعبة'), h('ul', null, RULES_UI.map(r => h('li', { class: E.rules(S)[r.k] ? 'on' : 'off' }, (E.rules(S)[r.k] ? '✓ ' : '✕ ') + r.t)))) : null,
      h('div', { class: 'btns' }, btn('فهمت', () => closeModal(), 'secondary')));
  }, { wide: true });
}

/* ---------- بطاقة الحظ / الصندوق ---------- */
function showCard(e) {
  return new Promise(resolve => {
    ui.cardOpen = true;
    const deckC = e.deck === 'chance' ? 'var(--burgundy)' : 'var(--sage-d)';
    const human = canControl(e.player) && ui.speed !== 'instant';
    const flip = h('div', { class: 'card-flip', style: `--deck-c:${deckC}` }, h('div', { class: 'card-inner' },
      h('div', { class: 'card-face front' }, h('h3', null, E.DECK_NAME[e.deck]), h('p', null, e.text)),
      h('div', { class: 'card-face back' }, e.deck === 'chance' ? '?' : '$')));
    const layer = h('div', { class: 'modal-back', style: 'z-index:55', 'data-card': e.id });
    const done = () => { if (!layer.isConnected) return; layer.remove(); ui.cardOpen = false; resolve(); };
    const box = h('div', { style: 'display:flex;flex-direction:column;gap:16px;align-items:center' }, flip,
      h('div', { style: 'color:#fff;font-weight:700' }, S.players[e.player].name),
      human ? btn('حسناً', done, 'big', { 'data-action': 'card-ok' }) : null);
    layer.append(box); document.body.append(layer);
    Snd.play('card');
    requestAnimationFrame(() => requestAnimationFrame(() => flip.classList.add('open')));
    if (human) box.querySelector('button').focus({ preventScroll: true });
    else setTimeout(done, sp().card);
  });
}

/* ============================================================
 * الحركة والمؤثرات
 * ============================================================ */
function floatMoney(pid, delta) {
  const row = document.querySelector(`.prow[data-player="${pid}"] .pcash`);
  if (!row) return;
  const r = row.getBoundingClientRect();
  const f = h('div', { class: 'float-money ' + (delta > 0 ? 'plus' : 'minus'), style: `left:${r.left + r.width / 2 - 20}px;top:${r.top - 6}px` }, (delta > 0 ? '+' : '−') + money(Math.abs(delta)));
  document.body.append(f); setTimeout(() => f.remove(), 1400);
  row.classList.remove('bump'); void row.offsetWidth; row.classList.add('bump');
}
function flashCell(i) { const c = document.querySelector(`.cell[data-sq="${i}"]`); if (!c) return; c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); }
function confetti() {
  const colors = ['#590907', '#a5a79b', '#e8d2b5', '#7a1712', '#c9cbc0', '#d8a64a'];
  for (let k = 0; k < 90; k++) {
    const c = h('div', { class: 'confetti', style: `left:${Math.random() * 100}vw;background:${colors[k % colors.length]};animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random() * .8}s` });
    document.body.append(c); setTimeout(() => c.remove(), 5500);
  }
}

async function animate(events, prev) {
  const instant = ui.speed === 'instant';
  ui.displayCash = prev.players.map(p => p.cash);
  // أثناء الحركة تبقى القطع في مواقعها السابقة
  prev.players.forEach(p => { ui.tokenPos[p.id] = p.pos; });
  const prevJail = prev.players.map(p => p.inJail);
  const temp = S; // للعرض الجزئي: نستخدم الحالة الجديدة مع مواقع مؤقتة
  const setPos = (pid, pos) => { ui.tokenPos[pid] = pos; placeTokensAnim(prevJail); };
  let moneySoundAt = 0;
  for (const e of events) {
    if (temp !== S) break;
    switch (e.type) {
      case 'dice':
        Snd.play('dice'); setDice(e.dice, !instant);
        if (!instant) await wait(sp().dice * (e.extra ? 0.7 : 1));
        break;
      case 'move':
        prevJail[e.player] = false;
        for (const pos of e.path) {
          setPos(e.player, pos);
          if (!instant) {
            const t = document.querySelector(`[data-token="${e.player}"]`);
            t.style.transitionDuration = sp().step + 'ms';
            t.classList.remove('hop'); void t.offsetWidth; t.classList.add('hop');
            Snd.play('step'); await wait(sp().step);
          }
        }
        break;
      case 'jail':
        prevJail[e.player] = true; Snd.play('jail'); setPos(e.player, C.JAIL_POS);
        if (!instant) await wait(500);
        break;
      case 'land': flashCell(e.sq); break;
      case 'card': await showCard(e); break;
      case 'money':
        ui.displayCash[e.player] += e.delta;
        const cashEl = document.querySelector(`[data-cash="${e.player}"]`);
        if (cashEl) cashEl.innerHTML = '', cashEl.append(M(ui.displayCash[e.player]));
        if (!instant) {
          floatMoney(e.player, e.delta);
          const now = Date.now();
          if (now - moneySoundAt > 200) { Snd.play(e.delta > 0 ? 'coin' : 'pay'); moneySoundAt = now; }
        }
        break;
      case 'buy': Snd.play('buy'); flashCell(e.sq); renderBoardState(); if (!instant) await wait(300); break;
      case 'build': case 'sell': Snd.play('build'); renderBoardState(); flashCell(e.sq); break;
      case 'bid': Snd.play('bid'); break;
      case 'auctionStart': case 'auctionEnd': Snd.play('hammer'); break;
      case 'rent': break;
      case 'tradeDone': Snd.play(e.accepted ? 'coin' : 'error'); if (!isHumanTarget(prev)) toast(e.accepted ? '🤝 تمت المقايضة' : '✋ رُفض العرض'); break;
      case 'turn': Snd.play('turn'); break;
      case 'bankrupt': Snd.play('bankrupt'); break;
      case 'win': Snd.play('win'); confetti(); break;
    }
  }
  ui.displayCash = null; ui.tokenPos = {};
}
function isHumanTarget(prev) { return !!prev.trade && canControl(prev.trade.to); }
function placeTokensAnim(jailMap) {
  const layer = $('#tokens');
  S.players.forEach(p => {
    const t = layer.querySelector(`[data-token="${p.id}"]`); if (!t) return;
    const pos = ui.tokenPos[p.id] ?? p.pos;
    const jailed = pos === C.JAIL_POS && jailMap[p.id];
    const fake = Object.assign({}, p, { inJail: jailed });
    const { x, y } = tokenXYWith(fake, pos, jailed, jailMap);
    setXY(t, x, y); t.classList.toggle('jailed', !!jailed);
  });
}
function tokenXYWith(p, pos, jailed, jailMap) {
  const saved = S.players.map(o => o.inJail);
  S.players.forEach(o => { o.inJail = !!jailMap[o.id]; });
  const r = tokenXY(p, pos, jailed);
  S.players.forEach((o, k) => { o.inJail = saved[k]; });
  return r;
}

/* ============================================================
 * تنفيذ الحركات + الذكاء الاصطناعي
 * ============================================================ */
function performMove(move) {
  if (!S) return { success: false, error: 'لا توجد لعبة جارية — ابدأ لعبة من الردهة' };
  if (isGuest()) { // الضيف يرسل حركته للمضيف وينتظر الحالة الجديدة
    const err = E.validateMove(S, Object.assign({}, move, { by: Net.mySeat }));
    if (err) { Snd.play('error'); return { success: false, error: err, state: viewText() }; }
    if (ui.netWait) return { success: false, error: 'بانتظار المضيف…' };
    ui.netWait = true; Net.host.send({ t: 'move', move }); renderTurn();
    setTimeout(() => { if (ui.netWait) { ui.netWait = false; if (S) renderTurn(); } }, 8000);
    return { success: true, state: viewText() };
  }
  const err = E.validateMove(S, move);
  if (err) { Snd.play('error'); return { success: false, error: err, state: viewText() }; }
  const prev = S;
  S = E.applyMove(S, move);
  save(); broadcastState(true);
  const events = S.events;
  ui.pending++;
  if (ui.modal && ui.modal.kind === 'auto') { /* يحدَّث بعد الحركة */ }
  renderTurn();
  ui.queue = ui.queue.then(() => animate(events, prev)).catch(e => console.error(e)).then(() => {
    ui.pending--;
    if (!ui.pending) { renderAll(); scheduleAI(); }
  });
  return { success: true, state: viewText() };
}
function scheduleAI() {
  if (isGuest()) return;
  if (!S || S.phase !== 'playing' || ui.pending || ui.aiTimer) return;
  const a = actor();
  if (a === null || !S.players[a].isAI) return;
  ui.aiTimer = setTimeout(() => {
    ui.aiTimer = null;
    if (!S || ui.pending || S.phase !== 'playing') return;
    const b = actor(); if (b === null || !S.players[b].isAI) return;
    const m = E.aiMove(S);
    const r = performMove(m);
    if (!r.success) console.error('AI move rejected', m, r.error);
  }, sp().ai);
}

function viewText() {
  if (!S) return { phase: 'lobby' };
  const a = E.getActor(S);
  return {
    phase: S.phase, turn: S.turn, current: S.current, actor: a, turnPhase: S.turnPhase, winner: S.winner,
    dice: S.dice, doublesCount: S.doublesCount, pendingBuy: S.pendingBuy, auction: S.auction, trade: S.trade, debts: S.debts,
    bank: S.bank, decks: { chance: S.decks.chance.length, chest: S.decks.chest.length },
    players: S.players.map(p => ({ id: p.id, name: p.name, isAI: p.isAI, cash: p.cash, pos: p.pos, square: SQUARES[p.pos].name, inJail: p.inJail, jailTurns: p.jailTurns, goojf: p.goojf.length, bankrupt: p.bankrupt,
      properties: OWNABLE.filter(i => S.props[i].owner === p.id).map(i => ({ sq: i, name: SQUARES[i].name, houses: S.props[i].houses, mortgaged: S.props[i].mortgaged })) })),
    validMoves: E.getValidMoves(S).map(m => m.sq !== undefined ? { type: m.type, sq: m.sq } : { type: m.type }),
    lastLog: S.log.slice(-6).map(l => l.t), ui: { busy: ui.pending > 0 || !!ui.aiTimer || ui.cardOpen, modal: ui.modal ? ui.modal.key : null },
  };
}

/* ---------- البدء ---------- */
function startGame(config) {
  config = config || {};
  ui.speed = config.speed || lobby.speed || 'normal';
  if (config.sound === false) Snd.on = false;
  const players = (config.players || []).map((p, i) => ({ name: (p.name || '').trim() || DEFAULT_NAMES[i], isAI: !!p.isAI, token: p.token ?? i, color: p.color ?? p.token ?? i, team: p.team }));
  S = E.createGame({ players, startCash: config.startCash || C.START_CASH, seed: config.seed, allowForcedDice: !!config.allowForcedDice, map: config.map || 'original', rules: config.rules });
  enterGame();
  return viewText();
}
function enterGame() {
  if (ui.aiTimer) { clearTimeout(ui.aiTimer); ui.aiTimer = null; }
  ui.pending = 0; ui.queue = Promise.resolve(); ui.tokenPos = {}; ui.displayCash = null;
  $('#lobby').classList.add('hidden'); $('#game').classList.remove('hidden');
  $('#tokens').innerHTML = '';
  closeModal(true);
  E.ensureMap(S); buildBoard();
  $('#map-name').textContent = 'خريطة ' + E.MAPS[S.config.map || 'original'].name;
  $('#deck-chance').textContent = E.DECK_NAME.chance; $('#deck-chest').textContent = E.DECK_NAME.chest;
  sizeBoard(); setDice(S.dice, false);
  renderSoundBtn();
  save(); renderAll(); scheduleAI();
}
function renderSoundBtn() { $('#sound-btn').innerHTML = svg(Snd.on ? ICON.soundOn : ICON.soundOff); }

function init() {
  buildBoard();
  renderLobby();
  $('#start-btn').addEventListener('click', lobbyStart);
  $('#leave-btn').addEventListener('click', () => { leaveRoom(); renderLobby(); });
  const qRoom = (location.search.match(/[?&]room=([A-Za-z0-9]{5})/) || [])[1];
  let hostSess = null, guestRoom = null;
  try { hostSess = JSON.parse(sessionStorage.getItem(HOST_KEY)); guestRoom = sessionStorage.getItem(GUEST_KEY); } catch (e) { /* */ }
  if (qRoom && hostSess && hostSess.code === qRoom.toUpperCase()) resumeHost(hostSess); // المضيف أعاد تحميل الصفحة
  else if (qRoom) {
    lobby.mode = 'online'; lobby.joinCode = qRoom.toUpperCase(); renderLobby();
    if (guestRoom === lobby.joinCode) joinRoom(lobby.joinCode); // الضيف أعاد تحميل الصفحة: انضمام تلقائي لمقعده
    else { toast('اكتب اسمك واختر قطعتك ثم اضغط «انضم»', 4000); setTimeout(() => { const i = $('[data-player-config="0"] input'); i && i.focus(); }, 50); }
  }
  $('#resume-btn').addEventListener('click', () => {
    const d = loadSave(); if (!d) return;
    Snd.init(); S = d.state; ui.speed = d.speed || 'normal'; Snd.on = d.sound !== false;
    enterGame();
  });
  $('#lobby-rules-btn').addEventListener('click', openRules);
  $('#rules-btn').addEventListener('click', openRules);
  $('#sound-btn').addEventListener('click', () => { Snd.on = !Snd.on; if (Snd.on) Snd.init(); renderSoundBtn(); save(); Snd.play('click'); });
  $('#menu-btn').addEventListener('click', () => openModal('menu', 'manual', box => {
    box.append(h('h2', null, isGuest() ? 'مغادرة الغرفة؟' : 'لعبة جديدة؟'), h('p', null, isGuest() ? 'ستخرج من هذه اللعبة الأونلاين ويلعب الكمبيوتر بدلاً منك.' : isHost() ? 'ستنتهي اللعبة لجميع اللاعبين وتعودون إلى الغرفة.' : 'ستنتهي اللعبة الحالية وتعود إلى شاشة الإعداد.'),
      h('div', { class: 'btns' }, btn(isGuest() ? 'نعم، غادر' : 'نعم، لعبة جديدة', () => { clearSave(); if (isGuest()) leaveRoom(); showLobby(); }, '', { 'data-action': 'confirm-new' }), btn('تابع اللعب', () => closeModal(), 'secondary')));
  }));
  window.addEventListener('resize', () => { sizeBoard(); });
  window.addEventListener('pagehide', () => { // إعادة التحميل لا تُنهي الغرفة: الجلسة محفوظة وتعود تلقائياً
    try { if (isGuest() && Net.host) Net.host.destroy(); if (isHost() && Net.peer) { saveHostSessionNow(); Net.peer.broadcast({ t: 'hostdrop' }); Net.peer.destroy(); } } catch (e) { /* */ }
  });
  sizeBoard();
}

/* ---------- واجهة الاختبار ---------- */
window.render_game_to_text = () => JSON.stringify(viewText());
window.performMove = performMove;
window.startGame = startGame;
window.getPlayerView = (state, id) => E.getPlayerView(state || S, id);
window.__net = { state: () => ({ role: Net.role, code: Net.code, mySeat: Net.mySeat, seats: (isHost() ? Net.seats : (Net.snapshot || { players: [] }).players).length, inGame: Net.inGame, status: Net.status }), createRoom, joinRoom, leaveRoom };
window.__ui = { netBusy: () => ui.netWait, isIdle: () => !!S && ui.pending === 0 && !ui.aiTimer && !ui.cardOpen, state: () => S, setState: s => { S = s; renderAll(); scheduleAI(); }, openManage, openTradeBuilder, closeModal, speed: v => { ui.speed = v; } };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
