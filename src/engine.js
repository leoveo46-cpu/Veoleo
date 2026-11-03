/* ============================================================
 * محرك القوانين — دوال صافية (Pure). لا يلمس DOM.
 * applyMove(state, move) => newState  (العشوائية من بذرة محفوظة داخل الحالة)
 * ============================================================ */
(function (root) {
'use strict';

/* ---------- الثوابت ---------- */
const C = {
  MIN_PLAYERS: 2, MAX_PLAYERS: 8,
  START_CASH: 1500, GO_SALARY: 200,
  BOARD_SIZE: 40, SIDE: 9, JAIL_POS: 10, GOTO_JAIL_POS: 30, PARKING_POS: 20,
  JAIL_FINE: 50, MAX_JAIL_TURNS: 3, MAX_DOUBLES: 3,
  BANK_HOUSES: 32, BANK_HOTELS: 12, HOTEL_LEVEL: 5, HOUSES_PER_HOTEL: 4,
  MORTGAGE_INTEREST: 0.10,
  RR_RENT: [0, 25, 50, 100, 200],
  UTIL_MULT: [0, 4, 10, 20],
  CARD_UTIL_MULT: 10, CARD_RR_MULT: 2,
  LOG_LIMIT: 300,
};

const GROUPS = {
  brown:    { name: 'البني',       color: '#7a4a2a' },
  lightblue:{ name: 'السماوي',     color: '#8fd3f0' },
  pink:     { name: 'الوردي',      color: '#d6418f' },
  orange:   { name: 'البرتقالي',   color: '#f08a1c' },
  red:      { name: 'الأحمر',      color: '#d7262e' },
  yellow:   { name: 'الأصفر',      color: '#f3d21b' },
  green:    { name: 'الأخضر',      color: '#1f9a4d' },
  darkblue: { name: 'الأزرق',      color: '#1f4fa8' },
  railroad: { name: 'المحطات',     color: '#222' },
  utility:  { name: 'الشركات',     color: '#888' },
};

function P(name, group, price, rent, house) { return { type: 'property', name, group, price, rent, house }; }
function R(name) { return { type: 'railroad', name, group: 'railroad', price: 200 }; }
function U(name, icon) { return { type: 'utility', name, group: 'utility', price: 150, icon }; }

const SQUARES = [
  { type: 'go', name: 'انطلاق' },
  P('شارع الزيتون', 'brown', 60, [2, 10, 30, 90, 160, 250], 50),
  { type: 'chest', name: 'صندوق المجتمع' },
  P('شارع الرمّان', 'brown', 60, [4, 20, 60, 180, 320, 450], 50),
  { type: 'tax', name: 'ضريبة الدخل', amount: 200 },
  R('محطة الشمال'),
  P('حي النخيل', 'lightblue', 100, [6, 30, 90, 270, 400, 550], 50),
  { type: 'chance', name: 'الحظ' },
  P('حي الياسمين', 'lightblue', 100, [6, 30, 90, 270, 400, 550], 50),
  P('حي الزهور', 'lightblue', 120, [8, 40, 100, 300, 450, 600], 50),
  { type: 'jail', name: 'السجن' },
  P('سوق الحرير', 'pink', 140, [10, 50, 150, 450, 625, 750], 100),
  U('شركة الكهرباء', 'bolt'),
  P('سوق العطّارين', 'pink', 140, [10, 50, 150, 450, 625, 750], 100),
  P('سوق الصاغة', 'pink', 160, [12, 60, 180, 500, 700, 900], 100),
  R('محطة الشرق'),
  P('ساحة النافورة', 'orange', 180, [14, 70, 200, 550, 750, 950], 100),
  { type: 'chest', name: 'صندوق المجتمع' },
  P('ساحة الساعة', 'orange', 180, [14, 70, 200, 550, 750, 950], 100),
  P('ساحة الفنون', 'orange', 200, [16, 80, 220, 600, 800, 1000], 100),
  { type: 'parking', name: 'موقف مجاني' },
  P('كورنيش البحر', 'red', 220, [18, 90, 250, 700, 875, 1050], 150),
  { type: 'chance', name: 'الحظ' },
  P('كورنيش النهر', 'red', 220, [18, 90, 250, 700, 875, 1050], 150),
  P('مرفأ اللؤلؤ', 'red', 240, [20, 100, 300, 750, 925, 1100], 150),
  R('محطة الجنوب'),
  P('برج الشمس', 'yellow', 260, [22, 110, 330, 800, 975, 1150], 150),
  P('برج القمر', 'yellow', 260, [22, 110, 330, 800, 975, 1150], 150),
  U('شركة المياه', 'drop'),
  P('برج النجوم', 'yellow', 280, [24, 120, 360, 850, 1025, 1200], 150),
  { type: 'gotojail', name: 'اذهب إلى السجن' },
  P('جزيرة المرجان', 'green', 300, [26, 130, 390, 900, 1100, 1275], 200),
  P('جزيرة الياقوت', 'green', 300, [26, 130, 390, 900, 1100, 1275], 200),
  { type: 'chest', name: 'صندوق المجتمع' },
  P('جزيرة الزمرّد', 'green', 320, [28, 150, 450, 1000, 1200, 1400], 200),
  R('محطة الغرب'),
  { type: 'chance', name: 'الحظ' },
  P('قصر الأمير', 'darkblue', 350, [35, 175, 500, 1100, 1300, 1500], 200),
  { type: 'tax', name: 'ضريبة الرفاهية', amount: 100 },
  P('القصر الذهبي', 'darkblue', 400, [50, 200, 600, 1400, 1700, 2000], 200),
];
SQUARES.forEach((s, i) => { s.index = i; });

const OWNABLE = SQUARES.filter(s => s.price).map(s => s.index);
const GROUP_MEMBERS = {};
OWNABLE.forEach(i => { const g = SQUARES[i].group; (GROUP_MEMBERS[g] = GROUP_MEMBERS[g] || []).push(i); });

/* ---------- البطاقات ---------- */
const CARDS = {
  chance: [
    { id: 'c1',  text: 'تقدّم إلى خانة الانطلاق واقبض 200$', a: { k: 'advance', to: 0 } },
    { id: 'c2',  text: 'تقدّم إلى مرفأ اللؤلؤ. إن مررت بالانطلاق اقبض 200$', a: { k: 'advance', to: 24 } },
    { id: 'c3',  text: 'تقدّم إلى سوق الحرير. إن مررت بالانطلاق اقبض 200$', a: { k: 'advance', to: 11 } },
    { id: 'c4',  text: 'تقدّم إلى أقرب شركة. إن كانت مملوكة ارمِ النرد وادفع 10 أضعاف الرقم', a: { k: 'nearestUtil' } },
    { id: 'c5',  text: 'تقدّم إلى أقرب محطة وادفع لمالكها ضعف الإيجار', a: { k: 'nearestRR' } },
    { id: 'c6',  text: 'تقدّم إلى أقرب محطة وادفع لمالكها ضعف الإيجار', a: { k: 'nearestRR' } },
    { id: 'c7',  text: 'البنك يدفع لك أرباح أسهم بقيمة 50$', a: { k: 'collect', amount: 50 } },
    { id: 'c8',  text: 'اخرج من السجن مجاناً — احتفظ بهذه البطاقة حتى تحتاجها', a: { k: 'goojf' } },
    { id: 'c9',  text: 'ارجع ثلاث خانات إلى الخلف', a: { k: 'back', n: 3 } },
    { id: 'c10', text: 'اذهب إلى السجن مباشرة دون المرور بالانطلاق', a: { k: 'jail' } },
    { id: 'c11', text: 'صيانة عامة لعقاراتك: ادفع 25$ عن كل بيت و100$ عن كل فندق', a: { k: 'repairs', house: 25, hotel: 100 } },
    { id: 'c12', text: 'مخالفة سرعة! ادفع 15$', a: { k: 'pay', amount: 15 } },
    { id: 'c13', text: 'رحلة إلى محطة الشمال. إن مررت بالانطلاق اقبض 200$', a: { k: 'advance', to: 5 } },
    { id: 'c14', text: 'تقدّم إلى القصر الذهبي', a: { k: 'advance', to: 39 } },
    { id: 'c15', text: 'انتُخبت رئيساً لمجلس الإدارة: ادفع لكل لاعب 50$', a: { k: 'payEach', amount: 50 } },
    { id: 'c16', text: 'استحق قرض البناء الخاص بك: اقبض 150$', a: { k: 'collect', amount: 150 } },
  ],
  chest: [
    { id: 'h1',  text: 'تقدّم إلى خانة الانطلاق واقبض 200$', a: { k: 'advance', to: 0 } },
    { id: 'h2',  text: 'خطأ مصرفي لصالحك: اقبض 200$', a: { k: 'collect', amount: 200 } },
    { id: 'h3',  text: 'أتعاب الطبيب: ادفع 50$', a: { k: 'pay', amount: 50 } },
    { id: 'h4',  text: 'ربحت من بيع أسهم: اقبض 50$', a: { k: 'collect', amount: 50 } },
    { id: 'h5',  text: 'اخرج من السجن مجاناً — احتفظ بهذه البطاقة حتى تحتاجها', a: { k: 'goojf' } },
    { id: 'h6',  text: 'اذهب إلى السجن مباشرة دون المرور بالانطلاق', a: { k: 'jail' } },
    { id: 'h7',  text: 'استحق صندوق العطلات: اقبض 100$', a: { k: 'collect', amount: 100 } },
    { id: 'h8',  text: 'استرداد ضريبة الدخل: اقبض 20$', a: { k: 'collect', amount: 20 } },
    { id: 'h9',  text: 'إنه عيد ميلادك! اقبض 10$ من كل لاعب', a: { k: 'collectEach', amount: 10 } },
    { id: 'h10', text: 'استحق تأمين الحياة: اقبض 100$', a: { k: 'collect', amount: 100 } },
    { id: 'h11', text: 'فاتورة المستشفى: ادفع 100$', a: { k: 'pay', amount: 100 } },
    { id: 'h12', text: 'رسوم المدرسة: ادفع 50$', a: { k: 'pay', amount: 50 } },
    { id: 'h13', text: 'أتعاب استشارة: اقبض 25$', a: { k: 'collect', amount: 25 } },
    { id: 'h14', text: 'إصلاح الشوارع: ادفع 40$ عن كل بيت و115$ عن كل فندق', a: { k: 'repairs', house: 40, hotel: 115 } },
    { id: 'h15', text: 'فزت بالمركز الثاني في مسابقة جمال: اقبض 10$', a: { k: 'collect', amount: 10 } },
    { id: 'h16', text: 'ورثت مبلغاً: اقبض 100$', a: { k: 'collect', amount: 100 } },
  ],
};
const CARD_BY_ID = {};
Object.keys(CARDS).forEach(d => CARDS[d].forEach(c => { c.deck = d; CARD_BY_ID[c.id] = c; }));
const DECK_NAME = { chance: 'الحظ', chest: 'صندوق المجتمع' };

/* ============================================================
 * الخرائط — كل خريطة لها خاناتها ومجموعاتها وبطاقاتها.
 * الخريطة الحالية تُنسخ داخل SQUARES/GROUPS/... (نفس الكائنات) عبر setMap
 * ============================================================ */
const RENT_TABLE = [
  [60, [2, 10, 30, 90, 160, 250]], [100, [6, 30, 90, 270, 400, 550]], [120, [8, 40, 100, 300, 450, 600]],
  [140, [10, 50, 150, 450, 625, 750]], [160, [12, 60, 180, 500, 700, 900]], [180, [14, 70, 200, 550, 750, 950]],
  [200, [16, 80, 220, 600, 800, 1000]], [220, [18, 90, 250, 700, 875, 1050]], [240, [20, 100, 300, 750, 925, 1100]],
  [260, [22, 110, 330, 800, 975, 1150]], [280, [24, 120, 360, 850, 1025, 1200]], [300, [26, 130, 390, 900, 1100, 1275]],
  [320, [28, 150, 450, 1000, 1200, 1400]], [350, [35, 175, 500, 1100, 1300, 1500]], [400, [50, 200, 600, 1400, 1700, 2000]],
];
function rentFor(price) { // استيفاء خطي بين أسعار الجدول الرسمي
  for (let k = 0; k < RENT_TABLE.length; k++) {
    const [p, r] = RENT_TABLE[k];
    if (price === p) return r.slice();
    if (price < p) {
      if (k === 0) return r.slice();
      const [p0, r0] = RENT_TABLE[k - 1], f = (price - p0) / (p - p0);
      return r0.map((v, j) => Math.round((v + (r[j] - v) * f) / 5) * 5 || v);
    }
  }
  return RENT_TABLE[RENT_TABLE.length - 1][1].slice();
}
const houseFor = price => price <= 120 ? 50 : price <= 200 ? 100 : price <= 280 ? 150 : 200;
function W(name, group, price) { return { type: 'property', name, group, price, rent: rentFor(price), house: houseFor(price) }; }
const AIR = name => ({ type: 'railroad', name, group: 'railroad', price: 200, icon: 'plane' });
const S_ = {
  go: () => ({ type: 'go', name: 'البداية' }),
  jail: () => ({ type: 'jail', name: 'السجن' }),
  vac: () => ({ type: 'parking', name: 'إجازة' }),
  gtj: () => ({ type: 'gotojail', name: 'اذهب للسجن' }),
  sur: () => ({ type: 'chance', name: 'مفاجأة' }),
  tre: () => ({ type: 'chest', name: 'كنز' }),
  earn: () => ({ type: 'tax', name: 'ضريبة الأرباح', pct: 10 }),
  prem: () => ({ type: 'tax', name: 'ضريبة فاخرة', amount: 75 }),
  refund: () => ({ type: 'refund', name: 'استرداد ضريبي', amount: 50 }),
  power: () => ({ type: 'utility', name: 'شركة الكهرباء', group: 'utility', price: 150, icon: 'bolt' }),
  water: () => ({ type: 'utility', name: 'شركة المياه', group: 'utility', price: 150, icon: 'drop' }),
  gas: () => ({ type: 'utility', name: 'شركة الغاز', group: 'utility', price: 150, icon: 'flame' }),
};
const WORLD_GROUPS = {
  br: { name: 'البرازيل', color: '#27c27a', flag: 'br' },
  il: { name: 'إسرائيل', color: '#3d8bfd', flag: 'il' },
  in: { name: 'الهند', color: '#ff9933', flag: 'in', light: true },
  it: { name: 'إيطاليا', color: '#00b39f', flag: 'it' },
  de: { name: 'ألمانيا', color: '#f5c518', flag: 'de', light: true },
  cn: { name: 'الصين', color: '#e63946', flag: 'cn' },
  fr: { name: 'فرنسا', color: '#6c63ff', flag: 'fr' },
  jp: { name: 'اليابان', color: '#ff6b9d', flag: 'jp' },
  uk: { name: 'بريطانيا', color: '#a855f7', flag: 'uk' },
  us: { name: 'أمريكا', color: '#2563eb', flag: 'us' },
  tr: { name: 'تركيا', color: '#f97316', flag: 'tr' },
  ro: { name: 'رومانيا', color: '#0ea5e9', flag: 'ro' },
  ie: { name: 'أيرلندا', color: '#84cc16', flag: 'ie', light: true },
  railroad: { name: 'المطارات', color: '#94a3b8' },
  utility: { name: 'الشركات', color: '#22d3ee' },
};
function worldCards(sq) {
  const props = sq.filter(s => s.type === 'property').map(s => s.index);
  const rr = sq.filter(s => s.type === 'railroad').map(s => s.index);
  const hasUtil = sq.some(s => s.type === 'utility');
  const nm = i => sq[i].name;
  const a = props[Math.floor(props.length * 0.62)], b = props[Math.floor(props.length * 0.28)], last = props[props.length - 1];
  return {
    chance: [
      { id: 'c1',  text: 'تقدّم إلى البداية واقبض 200$', a: { k: 'advance', to: 0 } },
      { id: 'c2',  text: `سافر إلى ${nm(a)}. إن مررت بالبداية اقبض 200$`, a: { k: 'advance', to: a } },
      { id: 'c3',  text: `سافر إلى ${nm(b)}. إن مررت بالبداية اقبض 200$`, a: { k: 'advance', to: b } },
      hasUtil ? { id: 'c4', text: 'تقدّم إلى أقرب شركة. إن كانت مملوكة ارمِ النرد وادفع 10 أضعاف الرقم', a: { k: 'nearestUtil' } }
              : { id: 'c4', text: 'توجّه إلى أقرب مطار وادفع لمالكه ضعف الإيجار', a: { k: 'nearestRR' } },
      { id: 'c5',  text: 'توجّه إلى أقرب مطار وادفع لمالكه ضعف الإيجار', a: { k: 'nearestRR' } },
      { id: 'c6',  text: 'توجّه إلى أقرب مطار وادفع لمالكه ضعف الإيجار', a: { k: 'nearestRR' } },
      { id: 'c7',  text: 'أرباح أسهمك وصلت: اقبض 50$', a: { k: 'collect', amount: 50 } },
      { id: 'c8',  text: 'اخرج من السجن مجاناً — احتفظ بهذه البطاقة حتى تحتاجها', a: { k: 'goojf' } },
      { id: 'c9',  text: 'ارجع ثلاث خانات إلى الخلف', a: { k: 'back', n: 3 } },
      { id: 'c10', text: 'اذهب إلى السجن مباشرة دون المرور بالبداية', a: { k: 'jail' } },
      { id: 'c11', text: 'صيانة عامة لعقاراتك: ادفع 25$ عن كل بيت و100$ عن كل فندق', a: { k: 'repairs', house: 25, hotel: 100 } },
      { id: 'c12', text: 'مخالفة سرعة! ادفع 15$', a: { k: 'pay', amount: 15 } },
      { id: 'c13', text: `رحلة عبر ${nm(rr[0])}. إن مررت بالبداية اقبض 200$`, a: { k: 'advance', to: rr[0] } },
      { id: 'c14', text: `تقدّم إلى ${nm(last)}`, a: { k: 'advance', to: last } },
      { id: 'c15', text: 'انتُخبت رئيساً لمجلس الإدارة: ادفع لكل لاعب 50$', a: { k: 'payEach', amount: 50 } },
      { id: 'c16', text: 'استحق قرض البناء الخاص بك: اقبض 150$', a: { k: 'collect', amount: 150 } },
    ],
    chest: [
      { id: 'h1',  text: 'تقدّم إلى البداية واقبض 200$', a: { k: 'advance', to: 0 } },
      { id: 'h2',  text: 'خطأ مصرفي لصالحك: اقبض 200$', a: { k: 'collect', amount: 200 } },
      { id: 'h3',  text: 'أتعاب الطبيب: ادفع 50$', a: { k: 'pay', amount: 50 } },
      { id: 'h4',  text: 'ربحت من بيع أسهم: اقبض 50$', a: { k: 'collect', amount: 50 } },
      { id: 'h5',  text: 'اخرج من السجن مجاناً — احتفظ بهذه البطاقة حتى تحتاجها', a: { k: 'goojf' } },
      { id: 'h6',  text: 'اذهب إلى السجن مباشرة دون المرور بالبداية', a: { k: 'jail' } },
      { id: 'h7',  text: 'وجدت كنزاً صغيراً: اقبض 100$', a: { k: 'collect', amount: 100 } },
      { id: 'h8',  text: 'استرداد ضريبة الدخل: اقبض 20$', a: { k: 'collect', amount: 20 } },
      { id: 'h9',  text: 'إنه عيد ميلادك! اقبض 10$ من كل لاعب', a: { k: 'collectEach', amount: 10 } },
      { id: 'h10', text: 'استحق تأمين الحياة: اقبض 100$', a: { k: 'collect', amount: 100 } },
      { id: 'h11', text: 'فاتورة المستشفى: ادفع 100$', a: { k: 'pay', amount: 100 } },
      { id: 'h12', text: 'رسوم المدرسة: ادفع 50$', a: { k: 'pay', amount: 50 } },
      { id: 'h13', text: 'أتعاب استشارة: اقبض 25$', a: { k: 'collect', amount: 25 } },
      { id: 'h14', text: 'إصلاح الشوارع: ادفع 40$ عن كل بيت و115$ عن كل فندق', a: { k: 'repairs', house: 40, hotel: 115 } },
      { id: 'h15', text: 'فزت في مسابقة: اقبض 10$', a: { k: 'collect', amount: 10 } },
      { id: 'h16', text: 'ورثت مبلغاً: اقبض 100$', a: { k: 'collect', amount: 100 } },
    ],
  };
}
const MAPS = {
  original: { id: 'original', name: 'الأصلية', desc: 'اللوحة العربية الكلاسيكية — 40 خانة', icon: 'castle',
    squares: SQUARES.slice(), groups: Object.assign({}, GROUPS), cards: { chance: CARDS.chance, chest: CARDS.chest }, decks: { chance: 'الحظ', chest: 'صندوق المجتمع' } },
  classic: { id: 'classic', name: 'كلاسيك', desc: 'مدن العالم — 40 خانة', icon: 'city', groups: WORLD_GROUPS, decks: { chance: 'مفاجأة', chest: 'كنز' },
    squares: [S_.go(), W('سلفادور', 'br', 60), S_.tre(), W('ريو', 'br', 60), S_.earn(), AIR('مطار TLV'), W('تل أبيب', 'il', 100), W('حيفا', 'il', 110), S_.sur(), W('القدس', 'il', 120),
      S_.jail(), W('البندقية', 'it', 130), S_.power(), W('ميلانو', 'it', 140), W('روما', 'it', 160), AIR('مطار MUC'), W('فرانكفورت', 'de', 180), S_.tre(), W('ميونخ', 'de', 190), W('برلين', 'de', 200),
      S_.vac(), W('شنتشن', 'cn', 210), S_.sur(), W('بكين', 'cn', 220), W('شنغهاي', 'cn', 240), AIR('مطار CDG'), W('ليون', 'fr', 260), S_.water(), W('تولوز', 'fr', 270), W('باريس', 'fr', 280),
      S_.gtj(), W('ليفربول', 'uk', 290), W('مانشستر', 'uk', 300), S_.tre(), W('لندن', 'uk', 320), AIR('مطار JFK'), S_.sur(), W('سان فرانسيسكو', 'us', 360), S_.prem(), W('نيويورك', 'us', 400)] },
  worldwide: { id: 'worldwide', name: 'حول العالم', desc: 'لوحة كبيرة — 48 خانة و3 شركات', icon: 'globe', groups: WORLD_GROUPS, decks: { chance: 'مفاجأة', chest: 'كنز' },
    squares: [S_.go(), W('سلفادور', 'br', 60), S_.tre(), W('ريو', 'br', 60), S_.earn(), W('تل أبيب', 'il', 100), AIR('مطار TLV'), W('حيفا', 'il', 100), W('القدس', 'il', 110), S_.sur(), W('مومباي', 'in', 120), W('نيودلهي', 'in', 130),
      S_.jail(), W('البندقية', 'it', 140), W('بولونيا', 'it', 140), S_.power(), W('ميلانو', 'it', 160), W('روما', 'it', 160), AIR('مطار MUC'), W('فرانكفورت', 'de', 180), S_.tre(), W('ميونخ', 'de', 180), S_.gas(), W('برلين', 'de', 200),
      S_.vac(), W('شنتشن', 'cn', 220), S_.sur(), W('بكين', 'cn', 220), S_.tre(), W('شنغهاي', 'cn', 240), AIR('مطار CDG'), W('تولوز', 'fr', 260), W('باريس', 'fr', 260), S_.water(), W('يوكوهاما', 'jp', 280), W('طوكيو', 'jp', 280),
      S_.gtj(), W('ليفربول', 'uk', 300), W('مانشستر', 'uk', 300), S_.tre(), W('برمنغهام', 'uk', 320), W('لندن', 'uk', 320), AIR('مطار JFK'), W('لوس أنجلوس', 'us', 350), S_.sur(), W('سان فرانسيسكو', 'us', 360), S_.prem(), W('نيويورك', 'us', 400)] },
  lucky: { id: 'lucky', name: 'عجلة الحظ', desc: 'مفاجآت وكنوز في كل مكان — 40 خانة', icon: 'clover', groups: WORLD_GROUPS, decks: { chance: 'مفاجأة', chest: 'كنز' },
    squares: [S_.go(), W('أنطاليا', 'tr', 60), W('إسطنبول', 'tr', 80), W('براشوف', 'ro', 100), W('بوخارست', 'ro', 120), AIR('مطار TLV'), W('ميلانو', 'it', 140), W('روما', 'it', 160), W('ميونخ', 'de', 180), W('برلين', 'de', 200),
      S_.jail(), S_.tre(), S_.earn(), S_.sur(), S_.tre(), AIR('مطار MUC'), S_.sur(), S_.tre(), S_.prem(), S_.sur(),
      S_.vac(), W('بكين', 'cn', 220), W('شنغهاي', 'cn', 240), W('بلفاست', 'ie', 260), W('دبلن', 'ie', 280), AIR('مطار CDG'), W('مانشستر', 'uk', 300), W('لندن', 'uk', 320), W('سان فرانسيسكو', 'us', 350), W('نيويورك', 'us', 400),
      S_.gtj(), S_.tre(), S_.sur(), S_.prem(), S_.tre(), AIR('مطار JFK'), S_.sur(), S_.refund(), S_.tre(), S_.sur()] },
};
Object.values(MAPS).forEach(m => {
  m.squares.forEach((s, i) => { s.index = i; });
  if (!m.cards) m.cards = worldCards(m.squares);
  m.size = m.squares.length; m.side = (m.size - 4) / 4;
  // المجموعات المستخدمة فعلاً فقط
  const used = {}; m.squares.forEach(s => { if (s.group) used[s.group] = m.groups[s.group]; }); m.groups = used;
});
let CUR_MAP = 'original';
function replaceObj(target, src) { Object.keys(target).forEach(k => delete target[k]); Object.assign(target, src); }
function setMap(id) {
  if (!MAPS[id]) id = 'original';
  if (CUR_MAP === id) return;
  const m = MAPS[id];
  CUR_MAP = id;
  SQUARES.length = 0; m.squares.forEach(s => SQUARES.push(s));
  replaceObj(GROUPS, m.groups);
  OWNABLE.length = 0; SQUARES.forEach(s => { if (s.price) OWNABLE.push(s.index); });
  const gm = {}; OWNABLE.forEach(i => { const g = SQUARES[i].group; (gm[g] = gm[g] || []).push(i); }); replaceObj(GROUP_MEMBERS, gm);
  CARDS.chance = m.cards.chance; CARDS.chest = m.cards.chest;
  const byId = {}; Object.keys(CARDS).forEach(d => CARDS[d].forEach(c => { c.deck = d; byId[c.id] = c; })); replaceObj(CARD_BY_ID, byId);
  replaceObj(DECK_NAME, m.decks);
  C.BOARD_SIZE = m.size; C.SIDE = m.side;
  C.JAIL_POS = SQUARES.findIndex(s => s.type === 'jail'); C.GOTO_JAIL_POS = SQUARES.findIndex(s => s.type === 'gotojail');
  C.PARKING_POS = SQUARES.findIndex(s => s.type === 'parking');
}
const ensureMap = s => { if (s && s.config) setMap(s.config.map || 'original'); };
const DEFAULT_RULES = { doubleSet: true, vacationCash: false, auction: true, noRentInJail: false, mortgage: true, evenBuild: true };
const rules = s => Object.assign({}, DEFAULT_RULES, (s.config && s.config.rules) || {});

/* ---------- أدوات ---------- */
const clone = s => JSON.parse(JSON.stringify(s));
const money = n => '$' + Math.round(n).toLocaleString('en-US');

function rand(state) { // mulberry32 — البذرة جزء من الحالة
  state.seed = (state.seed + 0x6D2B79F5) | 0;
  let t = state.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function mixSeed(seed, e) { // خلط بذرة بمصدر عشوائي خارجي (murmur3 finalizer)
  let h = (seed ^ Math.imul(e | 0, 0x9E3779B1)) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B); h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
  return (h ^ (h >>> 16)) | 0;
}
const rollDie = s => 1 + Math.floor(rand(s) * 6);
function shuffle(state, arr) {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rand(state) * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

function log(state, text, kind) {
  state.log.push({ t: text, k: kind || 'info', turn: state.turn });
  if (state.log.length > C.LOG_LIMIT) state.log.splice(0, state.log.length - C.LOG_LIMIT);
}
const ev = (state, e) => state.events.push(e);
const pl = (state, id) => state.players[id];
const activePlayers = s => s.players.filter(p => !p.bankrupt);
const sameTeam = (s, a, b) => !!s.teams && a !== b && s.players[a].team !== null && s.players[a].team === s.players[b].team;
const TEAM_NAMES = ['الفريق الأحمر', 'الفريق الأزرق', 'الفريق الأخضر', 'الفريق الذهبي'];

/* ---------- إنشاء اللعبة ---------- */
function createGame(config) {
  const cfg = Object.assign({ startCash: C.START_CASH, seed: (Date.now() ^ 0x5bd1e995) | 0, allowForcedDice: false, map: 'original' }, config || {});
  if (!MAPS[cfg.map]) cfg.map = 'original';
  setMap(cfg.map);
  const players = cfg.players || [];
  if (players.length < C.MIN_PLAYERS || players.length > C.MAX_PLAYERS)
    throw new Error(`عدد اللاعبين ${players.length} غير صالح — يجب أن يكون بين ${C.MIN_PLAYERS} و ${C.MAX_PLAYERS}`);
  const teamIds = players.map(p => p.team).filter(x => Number.isInteger(x));
  const teamsOn = teamIds.length === players.length && new Set(teamIds).size >= 2;
  const state = {
    version: 1, phase: 'playing', seed: cfg.seed | 0,
    config: { startCash: cfg.startCash, allowForcedDice: !!cfg.allowForcedDice, map: cfg.map, rules: Object.assign({}, DEFAULT_RULES, cfg.rules || {}) },
    pot: 0, teams: teamsOn,
    players: players.map((p, i) => ({
      id: i, name: p.name || `لاعب ${i + 1}`, isAI: !!p.isAI, token: p.token ?? i, color: p.color ?? i,
      cash: cfg.startCash, pos: 0, inJail: false, jailTurns: 0, goojf: [], bankrupt: false,
      team: Number.isInteger(p.team) ? p.team : null,
    })),
    props: {}, bank: { houses: C.BANK_HOUSES, hotels: C.BANK_HOTELS },
    decks: {}, current: 0, turn: 1, turnPhase: 'preRoll',
    dice: null, doublesCount: 0, lastRollDoubles: false,
    pendingBuy: null, auction: null, trade: null, debts: [], debtResume: null,
    tradesThisTurn: 0, tradeCooldown: {}, winner: null, log: [], events: [], lastCard: null,
  };
  OWNABLE.forEach(i => { state.props[i] = { owner: null, houses: 0, mortgaged: false }; });
  state.decks.chance = shuffle(state, CARDS.chance.map(c => c.id));
  state.decks.chest = shuffle(state, CARDS.chest.map(c => c.id));
  log(state, `بدأت اللعبة على خريطة «${MAPS[cfg.map].name}» بـ ${players.length} لاعبين، لكل لاعب ${money(cfg.startCash)}`, 'system');
  if (!teamsOn) state.players.forEach(p => { p.team = null; });
  else log(state, `وضع الفرق: ${[...new Set(teamIds)].length} فرق — لا إيجار بين أعضاء الفريق الواحد`, 'system');
  log(state, `الدور على ${state.players[0].name}`, 'turn');
  return state;
}

/* ---------- استعلامات ---------- */
function ownsGroup(state, pid, group) {
  return GROUP_MEMBERS[group].every(i => state.props[i].owner === pid);
}
function groupHasBuildings(state, group) {
  return GROUP_MEMBERS[group].some(i => state.props[i].houses > 0);
}
function countOwned(state, pid, group) {
  return GROUP_MEMBERS[group].filter(i => state.props[i].owner === pid).length;
}
function computeRent(state, i, diceTotal, opts) {
  opts = opts || {};
  const sq = SQUARES[i], pr = state.props[i];
  if (pr.owner === null || pr.mortgaged) return 0;
  if (sq.type === 'property') {
    if (pr.houses > 0) return sq.rent[pr.houses];
    return (rules(state).doubleSet && ownsGroup(state, pr.owner, sq.group)) ? sq.rent[0] * 2 : sq.rent[0];
  }
  if (sq.type === 'railroad') {
    const n = countOwned(state, pr.owner, 'railroad');
    return C.RR_RENT[n] * (opts.rrMult || 1);
  }
  if (sq.type === 'utility') {
    const n = countOwned(state, pr.owner, 'utility');
    const mult = opts.utilMult || C.UTIL_MULT[n];
    return diceTotal * mult;
  }
  return 0;
}
const mortgageValue = i => SQUARES[i].price / 2;
const ceilMoney = x => Math.ceil(Math.round(x * 100) / 100); // يتجنب أخطاء الفاصلة العائمة
const mortgageFee = i => ceilMoney(mortgageValue(i) * C.MORTGAGE_INTEREST);
const unmortgageCost = i => mortgageValue(i) + mortgageFee(i);

/* ما يمكن جمعه إذا باع اللاعب كل مبانيه ورهن كل عقاراته */
function liquidationValue(state, pid) {
  let v = 0;
  OWNABLE.forEach(i => {
    const pr = state.props[i];
    if (pr.owner !== pid) return;
    const sq = SQUARES[i];
    if (pr.houses) v += pr.houses * sq.house / 2;
    if (!pr.mortgaged && rules(state).mortgage) v += mortgageValue(i);
  });
  return v;
}
function netWorth(state, pid) {
  const p = pl(state, pid);
  let v = p.cash;
  OWNABLE.forEach(i => {
    const pr = state.props[i];
    if (pr.owner !== pid) return;
    v += pr.mortgaged ? mortgageValue(i) : SQUARES[i].price;
    if (pr.houses) v += pr.houses * SQUARES[i].house;
  });
  return v;
}

function getActor(state) {
  if (state.phase !== 'playing') return null;
  switch (state.turnPhase) {
    case 'auction': return state.auction.order[state.auction.idx];
    case 'trade': return state.trade.to;
    case 'debt': return state.debts[0].debtor;
    default: return state.current;
  }
}

/* ---------- المال والديون ---------- */
function give(state, pid, amount, reason) {
  if (amount <= 0) return;
  pl(state, pid).cash += amount;
  ev(state, { type: 'money', player: pid, delta: amount, reason });
}
function take(state, pid, amount, reason) {
  if (amount <= 0) return;
  pl(state, pid).cash -= amount;
  ev(state, { type: 'money', player: pid, delta: -amount, reason });
}
/* creditor: رقم لاعب | 'bank' | 'each' (كل اللاعبين الآخرين) */
function payTo(state, debtor, amount, creditor, reason) {
  take(state, debtor, amount, reason);
  if (creditor === 'each') {
    const others = activePlayers(state).filter(p => p.id !== debtor);
    const share = amount / others.length;
    others.forEach(o => give(state, o.id, share, reason));
  } else if (creditor !== 'bank') give(state, creditor, amount, reason);
  else addPot(state, amount);
}
function addPot(state, amount) { if (rules(state).vacationCash) state.pot = (state.pot || 0) + amount; }
function charge(state, debtor, amount, creditor, reason, after) {
  if (amount <= 0) return true;
  const p = pl(state, debtor);
  if (p.cash >= amount) { payTo(state, debtor, amount, creditor, reason); return true; }
  state.debts.push({ debtor, amount, creditor, reason, after: after || null });
  log(state, `${p.name} لا يملك ما يكفي لدفع ${money(amount)} (${reason}) — عليه بيع مبانٍ أو رهن عقارات أو إعلان الإفلاس`, 'warn');
  return false;
}

/* ---------- الحركة ---------- */
function moveSteps(state, pid, steps) {
  const p = pl(state, pid), from = p.pos;
  const path = [];
  let pos = from;
  const dir = steps >= 0 ? 1 : -1;
  for (let k = 0; k < Math.abs(steps); k++) { pos = (pos + dir + C.BOARD_SIZE) % C.BOARD_SIZE; path.push(pos); }
  p.pos = pos;
  ev(state, { type: 'move', player: pid, from, to: pos, path });
  if (dir > 0 && from + steps >= C.BOARD_SIZE) {
    give(state, pid, C.GO_SALARY, 'مرور بالانطلاق');
    log(state, `${p.name} مرّ بالانطلاق واستلم ${money(C.GO_SALARY)}`, 'money');
  }
}
function advanceTo(state, pid, target) {
  const p = pl(state, pid);
  const steps = (target - p.pos + C.BOARD_SIZE) % C.BOARD_SIZE;
  moveSteps(state, pid, steps === 0 ? C.BOARD_SIZE : steps);
}
function sendToJail(state, pid, why) {
  const p = pl(state, pid);
  p.pos = C.JAIL_POS; p.inJail = true; p.jailTurns = 0;
  state.lastRollDoubles = false;
  ev(state, { type: 'jail', player: pid });
  log(state, `${p.name} ذهب إلى السجن (${why})`, 'jail');
}

/* حلّ الخانة التي وقف عليها اللاعب. ترجع true إن كانت تنتظر قرار شراء */
function resolveSquare(state, pid, opts) {
  opts = opts || {};
  const p = pl(state, pid), sq = SQUARES[p.pos];
  ev(state, { type: 'land', player: pid, sq: p.pos });
  switch (sq.type) {
    case 'property': case 'railroad': case 'utility': {
      const pr = state.props[p.pos];
      if (pr.owner === null) { state.pendingBuy = p.pos; state.turnPhase = 'buyDecision'; return true; }
      if (pr.owner === pid) { log(state, `${p.name} وصل إلى ${sq.name} التي يملكها`); return false; }
      if (pr.mortgaged) { log(state, `${sq.name} مرهونة — لا إيجار`); return false; }
      if (sameTeam(state, pid, pr.owner)) { log(state, `${sq.name} لزميل في الفريق — لا إيجار`); return false; }
      if (rules(state).noRentInJail && pl(state, pr.owner).inJail) { log(state, `${pl(state, pr.owner).name} في السجن — لا إيجار على ${sq.name}`); return false; }
      let total = state.dice ? state.dice[0] + state.dice[1] : 0;
      if (sq.type === 'utility' && opts.utilMult) {
        const d = [rollDie(state), rollDie(state)];
        total = d[0] + d[1];
        ev(state, { type: 'dice', dice: d, extra: true });
        log(state, `${p.name} رمى النرد للشركة: ${d[0]} + ${d[1]}`);
      }
      const rent = computeRent(state, p.pos, total, opts);
      const owner = pl(state, pr.owner);
      log(state, `${p.name} يدفع إيجار ${money(rent)} لـ ${owner.name} عن ${sq.name}`, 'rent');
      ev(state, { type: 'sound', name: 'rent' });
      charge(state, pid, rent, pr.owner, `إيجار ${sq.name}`);
      return false;
    }
    case 'tax': {
      const amt = sq.pct ? Math.ceil(Math.max(0, p.cash) * sq.pct / 100) : sq.amount;
      log(state, `${p.name} يدفع ${sq.name} ${money(amt)}${sq.pct ? ` (${sq.pct}% من رصيده)` : ''}`, 'money');
      charge(state, pid, amt, 'bank', sq.name);
      return false;
    }
    case 'refund':
      give(state, pid, sq.amount, sq.name);
      log(state, `${p.name} حصل على ${sq.name} ${money(sq.amount)}`, 'money');
      return false;
    case 'parking':
      if (rules(state).vacationCash && state.pot > 0) {
        const pot = state.pot; state.pot = 0;
        give(state, pid, pot, 'أموال الإجازة');
        log(state, `🏝 ${p.name} في ${sq.name} وربح كل الأموال المجمّعة ${money(pot)}`, 'buy');
      } else log(state, `${p.name} يستريح في ${sq.name}`);
      return false;
    case 'chance': case 'chest':
      return drawCard(state, pid, sq.type);
    case 'gotojail':
      sendToJail(state, pid, 'خانة اذهب إلى السجن');
      return false;
    default:
      if (sq.type === 'jail') log(state, `${p.name} في زيارة للسجن فقط`);
      return false;
  }
}

function drawCard(state, pid, deck) {
  const p = pl(state, pid);
  const id = state.decks[deck].shift();
  const card = CARD_BY_ID[id];
  if (card.a.k !== 'goojf') state.decks[deck].push(id);
  state.lastCard = { deck, id, text: card.text, player: pid };
  ev(state, { type: 'card', deck, id, text: card.text, player: pid });
  log(state, `${p.name} سحب بطاقة ${DECK_NAME[deck]}: «${card.text}»`, 'card');
  const a = card.a;
  switch (a.k) {
    case 'advance': advanceTo(state, pid, a.to); return resolveSquare(state, pid);
    case 'back': moveSteps(state, pid, -a.n); return resolveSquare(state, pid);
    case 'nearestRR': case 'nearestUtil': {
      const type = a.k === 'nearestRR' ? 'railroad' : 'utility';
      let t = p.pos;
      do { t = (t + 1) % C.BOARD_SIZE; } while (SQUARES[t].type !== type);
      advanceTo(state, pid, t);
      return resolveSquare(state, pid, a.k === 'nearestRR' ? { rrMult: C.CARD_RR_MULT } : { utilMult: C.CARD_UTIL_MULT });
    }
    case 'collect': give(state, pid, a.amount, 'بطاقة'); return false;
    case 'pay': charge(state, pid, a.amount, 'bank', 'بطاقة'); return false;
    case 'goojf': p.goojf.push(deck); return false;
    case 'jail': sendToJail(state, pid, 'بطاقة'); return false;
    case 'repairs': {
      let h = 0, H = 0;
      OWNABLE.forEach(i => { const pr = state.props[i]; if (pr.owner === pid) { if (pr.houses === C.HOTEL_LEVEL) H++; else h += pr.houses; } });
      const cost = h * a.house + H * a.hotel;
      log(state, `تكلفة الصيانة: ${h} بيت و ${H} فندق = ${money(cost)}`, 'money');
      charge(state, pid, cost, 'bank', 'صيانة');
      return false;
    }
    case 'payEach': {
      const others = activePlayers(state).filter(o => o.id !== pid);
      charge(state, pid, a.amount * others.length, 'each', 'بطاقة');
      return false;
    }
    case 'collectEach': {
      activePlayers(state).filter(o => o.id !== pid).forEach(o => charge(state, o.id, a.amount, pid, 'عيد ميلاد'));
      return false;
    }
  }
  return false;
}

function finishMovement(state) {
  const p = pl(state, state.current);
  const next = (state.lastRollDoubles && !p.inJail && !p.bankrupt) ? 'preRoll' : 'postRoll';
  if (state.debts.length) { state.debtResume = next; state.turnPhase = 'debt'; }
  else state.turnPhase = next;
  if (next === 'preRoll' && state.turnPhase === 'preRoll') log(state, `${p.name} رمى دبل — يرمي مرة أخرى`, 'turn');
}
function moveAndResolve(state, pid, steps) {
  moveSteps(state, pid, steps);
  const waiting = resolveSquare(state, pid);
  if (!waiting) finishMovement(state);
}

function nextTurn(state) {
  const n = state.players.length;
  let i = state.current;
  do { i = (i + 1) % n; } while (state.players[i].bankrupt);
  state.current = i; state.turn++;
  state.turnPhase = 'preRoll'; state.doublesCount = 0; state.lastRollDoubles = false;
  state.dice = null; state.tradesThisTurn = 0; state.pendingBuy = null;
  log(state, `الدور على ${state.players[i].name}`, 'turn');
  ev(state, { type: 'turn', player: i });
}

/* ---------- البناء ---------- */
function buildError(state, pid, i) {
  const sq = SQUARES[i];
  if (!sq || sq.type !== 'property') return `الخانة ${i} ليست أرضاً قابلة للبناء`;
  const pr = state.props[i];
  if (pr.owner !== pid) return `${sq.name} ليست ملكك`;
  if (!ownsGroup(state, pid, sq.group)) return `يجب امتلاك كامل المجموعة ${GROUPS[sq.group].name} قبل البناء`;
  const mem = GROUP_MEMBERS[sq.group];
  if (mem.some(j => state.props[j].mortgaged)) return `لا يمكن البناء — يوجد عقار مرهون في المجموعة ${GROUPS[sq.group].name}`;
  if (pr.houses >= C.HOTEL_LEVEL) return `${sq.name} عليها فندق بالفعل (الحد الأقصى)`;
  const min = Math.min(...mem.map(j => state.props[j].houses));
  if (rules(state).evenBuild && pr.houses > min) return `قاعدة البناء المتوازن: ابنِ أولاً على العقارات الأقل مباني في المجموعة`;
  if (pr.houses === C.HOUSES_PER_HOTEL) { if (state.bank.hotels < 1) return 'لا توجد فنادق متبقية في البنك'; }
  else if (state.bank.houses < 1) return 'لا توجد بيوت متبقية في البنك';
  if (pl(state, pid).cash < sq.house) return `تحتاج ${money(sq.house)} للبناء ولديك ${money(pl(state, pid).cash)}`;
  return null;
}
function sellError(state, pid, i) {
  const sq = SQUARES[i];
  if (!sq || sq.type !== 'property') return `الخانة ${i} ليست أرضاً`;
  const pr = state.props[i];
  if (pr.owner !== pid) return `${sq.name} ليست ملكك`;
  if (pr.houses === 0) return `لا توجد مبانٍ على ${sq.name}`;
  const max = Math.max(...GROUP_MEMBERS[sq.group].map(j => state.props[j].houses));
  if (rules(state).evenBuild && pr.houses < max) return 'قاعدة البيع المتوازن: بِع أولاً من العقارات الأكثر مباني في المجموعة';
  return null;
}
function mortgageError(state, pid, i) {
  const sq = SQUARES[i];
  if (!sq || !sq.price) return `الخانة ${i} ليست عقاراً`;
  const pr = state.props[i];
  if (pr.owner !== pid) return `${sq.name} ليست ملكك`;
  if (pr.mortgaged) return `${sq.name} مرهونة بالفعل`;
  if (!rules(state).mortgage) return 'الرهن معطّل في إعدادات هذه اللعبة';
  if (sq.type === 'property' && groupHasBuildings(state, sq.group)) return `بِع كل المباني في المجموعة ${GROUPS[sq.group].name} قبل الرهن`;
  return null;
}
function unmortgageError(state, pid, i) {
  const sq = SQUARES[i];
  if (!sq || !sq.price) return `الخانة ${i} ليست عقاراً`;
  const pr = state.props[i];
  if (pr.owner !== pid) return `${sq.name} ليست ملكك`;
  if (!pr.mortgaged) return `${sq.name} ليست مرهونة`;
  if (pl(state, pid).cash < unmortgageCost(i)) return `فك الرهن يكلف ${money(unmortgageCost(i))} ولديك ${money(pl(state, pid).cash)}`;
  return null;
}
function tradeTransferable(state, pid, i) {
  const sq = SQUARES[i];
  if (!sq || !sq.price) return `الخانة ${i} ليست عقاراً`;
  if (state.props[i].owner !== pid) return `${sq.name} ليست ملك ${pl(state, pid).name}`;
  if (sq.type === 'property' && groupHasBuildings(state, sq.group)) return `لا يمكن مقايضة ${sq.name} — بِع مباني مجموعتها أولاً`;
  return null;
}
/* مفتاح للمقايضة (بدون المبالغ) لمنع الكمبيوتر من تكرار عرض مرفوض */
function tradeKey(t) { return `${t.from}>${t.to}:${(t.give.props || []).join(',')}|${(t.get.props || []).join(',')}`; }
function tradeFees(state, props) { return props.reduce((s, i) => s + (state.props[i].mortgaged ? mortgageFee(i) : 0), 0); }
function tradeError(state, from, t) {
  if (typeof t.to !== 'number' || !state.players[t.to] || state.players[t.to].bankrupt || t.to === from) return 'اختر لاعباً آخر نشطاً للمقايضة';
  const give = t.give || {}, get = t.get || {};
  const gp = give.props || [], tp = get.props || [];
  const gc = give.cash || 0, tc = get.cash || 0, gk = give.cards || 0, tk = get.cards || 0;
  if ([gc, tc, gk, tk].some(v => !Number.isInteger(v) || v < 0)) return 'المبالغ وعدد البطاقات يجب أن تكون أعداداً صحيحة موجبة';
  if (!gp.length && !tp.length && !gc && !tc && !gk && !tk) return 'العرض فارغ — أضف عقاراً أو مالاً أو بطاقة';
  if (!gp.length && !tp.length && !gk && !tk) return 'المقايضة يجب أن تتضمن عقاراً أو بطاقة (لا يمكن تبادل المال فقط)';
  for (const i of gp) { const e = tradeTransferable(state, from, i); if (e) return e; }
  for (const i of tp) { const e = tradeTransferable(state, t.to, i); if (e) return e; }
  const A = pl(state, from), B = pl(state, t.to);
  if (gk > A.goojf.length) return `${A.name} لا يملك ${gk} بطاقة خروج من السجن`;
  if (tk > B.goojf.length) return `${B.name} لا يملك ${tk} بطاقة خروج من السجن`;
  const aCash = A.cash - gc + tc - tradeFees(state, tp);
  const bCash = B.cash - tc + gc - tradeFees(state, gp);
  if (gc > A.cash || aCash < 0) return `${A.name} لا يملك المال الكافي لهذه المقايضة (يشمل رسوم الرهن 10%)`;
  if (tc > B.cash || bCash < 0) return `${B.name} لا يملك المال الكافي لهذه المقايضة (يشمل رسوم الرهن 10%)`;
  return null;
}

/* ---------- الإفلاس ---------- */
function bankrupt(state, debt) {
  const p = pl(state, debt.debtor);
  const toPlayer = typeof debt.creditor === 'number' && !pl(state, debt.creditor).bankrupt;
  // بيع كل المباني للبنك بنصف السعر
  OWNABLE.forEach(i => {
    const pr = state.props[i];
    if (pr.owner !== p.id || !pr.houses) return;
    if (pr.houses === C.HOTEL_LEVEL) state.bank.hotels++; else state.bank.houses += pr.houses;
    p.cash += pr.houses * SQUARES[i].house / 2; pr.houses = 0;
  });
  // عقارات المفلس لا تنتقل لأي لاعب: تعود كلها للبنك متاحة للشراء من جديد.
  // الدائن (إن كان لاعباً) يأخذ ما تبقى من نقد المفلس فقط.
  if (toPlayer && p.cash > 0) {
    const cr = pl(state, debt.creditor);
    cr.cash += p.cash;
    ev(state, { type: 'money', player: cr.id, delta: p.cash, reason: 'نقد مفلس' });
  }
  OWNABLE.forEach(i => { const pr = state.props[i]; if (pr.owner === p.id) { pr.owner = null; pr.mortgaged = false; pr.houses = 0; } });
  p.goojf.forEach(d => { const id = CARDS[d].find(c => c.a.k === 'goojf').id; state.decks[d].push(id); });
  log(state, toPlayer ? `💥 ${p.name} أفلس! أخذ ${pl(state, debt.creditor).name} ما تبقى من نقده، وعادت عقاراته إلى البنك` : `💥 ${p.name} أفلس! عادت عقاراته إلى البنك`, 'bankrupt');
  p.goojf = []; p.cash = 0; p.bankrupt = true; p.inJail = false;
  ev(state, { type: 'bankrupt', player: p.id });
  // ديون أخرى على اللاعب المفلس تُلغى، وديون له تذهب للبنك
  state.debts = state.debts.filter(d => d.debtor !== p.id);
  state.debts.forEach(d => { if (d.creditor === p.id) d.creditor = 'bank'; });
  const alive = activePlayers(state);
  const aliveTeams = state.teams ? new Set(alive.map(a => a.team)) : null;
  if (alive.length === 1 || (aliveTeams && aliveTeams.size === 1)) {
    const best = alive.slice().sort((a, b) => netWorth(state, b.id) - netWorth(state, a.id))[0];
    state.phase = 'gameOver'; state.winner = best.id; state.turnPhase = 'gameOver';
    state.winnerTeam = state.teams ? best.team : null;
    log(state, state.teams ? `🏆 ${TEAM_NAMES[best.team]} فاز باللعبة!` : `🏆 ${best.name} فاز باللعبة!`, 'win');
    ev(state, { type: 'win', player: best.id });
    return;
  }
  if (p.id === state.current) { state.debts = []; nextTurn(state); return; }
  state.turnPhase = state.debts.length ? 'debt' : state.debtResume;
}

/* ---------- المزاد ---------- */
function startAuction(state) {
  const sq = state.pendingBuy;
  const n = state.players.length, order = [];
  for (let k = 0; k < n; k++) { const id = (state.current + k) % n; if (!state.players[id].bankrupt) order.push(id); }
  state.auction = { sq, high: 0, bidder: null, order, idx: 0, passed: [] };
  state.pendingBuy = null; state.turnPhase = 'auction';
  log(state, `🔨 بدأ مزاد على ${SQUARES[sq].name}`, 'auction');
  ev(state, { type: 'auctionStart', sq });
}
function advanceAuction(state) {
  const a = state.auction;
  const remaining = a.order.filter(id => !a.passed.includes(id));
  if (remaining.length === 0 || (remaining.length === 1 && remaining[0] === a.bidder)) return endAuction(state);
  let i = a.idx;
  do { i = (i + 1) % a.order.length; } while (a.passed.includes(a.order[i]) || a.order[i] === a.bidder);
  a.idx = i;
}
function endAuction(state) {
  const a = state.auction;
  if (a.bidder !== null) {
    const w = pl(state, a.bidder);
    take(state, w.id, a.high, 'مزاد');
    state.props[a.sq].owner = w.id;
    log(state, `🔨 ${w.name} ربح المزاد على ${SQUARES[a.sq].name} بمبلغ ${money(a.high)}`, 'auction');
    ev(state, { type: 'buy', player: w.id, sq: a.sq });
  } else log(state, `🔨 لم يزايد أحد — ${SQUARES[a.sq].name} تبقى للبنك`, 'auction');
  ev(state, { type: 'auctionEnd', sq: a.sq, winner: a.bidder });
  state.auction = null;
  finishMovement(state);
}

/* ---------- الحركات المتاحة ---------- */
function manageAllowed(state, pid) {
  if (state.phase !== 'playing') return false;
  if (state.turnPhase === 'debt') return state.debts[0].debtor === pid;
  return pid === state.current && ['preRoll', 'postRoll', 'buyDecision'].includes(state.turnPhase);
}

function getValidMoves(state) {
  const actor = getActor(state);
  if (actor === null) return [];
  const p = pl(state, actor), moves = [];
  const tp = state.turnPhase;
  if (tp === 'preRoll') {
    moves.push({ type: 'roll' });
    if (p.inJail) {
      if (p.cash >= C.JAIL_FINE) moves.push({ type: 'payJail' });
      if (p.goojf.length) moves.push({ type: 'useJailCard' });
    }
  } else if (tp === 'buyDecision') {
    if (p.cash >= SQUARES[state.pendingBuy].price) moves.push({ type: 'buy' });
    moves.push({ type: rules(state).auction ? 'auction' : 'decline' });
  } else if (tp === 'postRoll') {
    moves.push({ type: 'endTurn' });
  } else if (tp === 'auction') {
    const a = state.auction;
    if (p.cash > a.high) moves.push({ type: 'bid', min: a.high + 1, max: p.cash });
    moves.push({ type: 'pass' });
  } else if (tp === 'trade') {
    if (!tradeError(state, state.trade.from, state.trade)) moves.push({ type: 'acceptTrade' });
    moves.push({ type: 'rejectTrade' });
  } else if (tp === 'debt') {
    if (p.cash >= state.debts[0].amount) moves.push({ type: 'payDebt' });
    moves.push({ type: 'bankrupt' });
  }
  if (manageAllowed(state, actor)) {
    OWNABLE.forEach(i => {
      if (state.props[i].owner !== actor) return;
      if (tp !== 'debt' && !buildError(state, actor, i)) moves.push({ type: 'build', sq: i });
      if (!sellError(state, actor, i)) moves.push({ type: 'sell', sq: i });
      if (!mortgageError(state, actor, i)) moves.push({ type: 'mortgage', sq: i });
      if (tp !== 'debt' && !unmortgageError(state, actor, i)) moves.push({ type: 'unmortgage', sq: i });
    });
    if ((tp === 'preRoll' || tp === 'postRoll')) moves.push({ type: 'proposeTrade', template: true });
  }
  return moves;
}

const PHASE_AR = { preRoll: 'قبل رمي النرد', buyDecision: 'قرار الشراء', postRoll: 'بعد الرمي', auction: 'المزاد', trade: 'عرض المقايضة', debt: 'سداد الدين', gameOver: 'انتهت اللعبة' };

function validateMove(state, move) {
  if (!move || typeof move.type !== 'string') return 'حركة غير صالحة: يجب أن تحتوي على الحقل type';
  if (state.phase !== 'playing') return 'اللعبة انتهت — لا يمكن تنفيذ حركات';
  const actor = getActor(state);
  if (move.by !== undefined && move.by !== actor)
    return `ليس دورك: الدور الآن على ${pl(state, actor).name} (اللاعب ${actor})`;
  const valid = getValidMoves(state);
  const t = move.type;
  const p = pl(state, actor);
  if (['build', 'sell', 'mortgage', 'unmortgage'].includes(t)) {
    if (!manageAllowed(state, actor)) return `لا يمكن إدارة العقارات في مرحلة «${PHASE_AR[state.turnPhase]}»`;
    if (t === 'build' && state.turnPhase === 'debt') return 'لا يمكن البناء أثناء سداد دين';
    if (t === 'unmortgage' && state.turnPhase === 'debt') return 'لا يمكن فك الرهن أثناء سداد دين';
    const fn = { build: buildError, sell: sellError, mortgage: mortgageError, unmortgage: unmortgageError }[t];
    return fn(state, actor, move.sq);
  }
  if (t === 'proposeTrade') {
    if (!valid.some(m => m.type === 'proposeTrade')) return `المقايضة متاحة فقط في دورك قبل أو بعد رمي النرد (المرحلة الحالية: ${PHASE_AR[state.turnPhase]})`;
    return tradeError(state, actor, move);
  }
  if (t === 'bid') {
    if (state.turnPhase !== 'auction') return 'لا يوجد مزاد جارٍ';
    const a = state.auction;
    if (!Number.isInteger(move.amount)) return 'قيمة المزايدة يجب أن تكون عدداً صحيحاً';
    if (move.amount <= a.high) return `المزايدة يجب أن تكون أعلى من ${money(a.high)}`;
    if (move.amount > p.cash) return `لا تملك ${money(move.amount)} — رصيدك ${money(p.cash)}`;
    return null;
  }
  if (!valid.some(m => m.type === t)) {
    const names = valid.map(m => m.type).filter((x, i, a) => a.indexOf(x) === i).join(', ');
    if (t === 'buy' && state.turnPhase === 'buyDecision') return `لا تملك ثمن ${SQUARES[state.pendingBuy].name} (${money(SQUARES[state.pendingBuy].price)}) — اختر المزاد أو ارهن عقاراً`;
    if (t === 'payDebt' && state.turnPhase === 'debt') return `رصيدك ${money(p.cash)} أقل من الدين ${money(state.debts[0].amount)} — بِع مباني أو ارهن عقارات`;
    return `الحركة «${t}» غير مسموحة في مرحلة «${PHASE_AR[state.turnPhase]}». الحركات المتاحة: ${names}`;
  }
  if (t === 'roll' && move.dice) {
    if (!state.config.allowForcedDice) return 'تحديد النرد مسموح فقط في وضع الاختبار';
    if (!Array.isArray(move.dice) || move.dice.length !== 2 || move.dice.some(d => !Number.isInteger(d) || d < 1 || d > 6)) return 'النرد يجب أن يكون [a,b] بقيم 1-6';
  }
  return null;
}

/* ---------- تطبيق الحركة ---------- */
function applyMove(prev, move) {
  const err = validateMove(prev, move);
  if (err) throw new Error(err);
  const state = clone(prev);
  state.events = []; state.lastCard = null;
  // عشوائية حقيقية: الواجهة (أو المضيف) تضيف لكل حركة رقماً من مولّد التشفير في المتصفح ويُمزج في البذرة.
  // المحرك يبقى نقياً: نفس الحالة + نفس الحركة = نفس النتيجة.
  if (Number.isInteger(move.entropy)) state.seed = mixSeed(state.seed, move.entropy);
  const actor = getActor(state);
  const p = pl(state, actor);
  switch (move.type) {
    case 'roll': {
      const d = move.dice ? move.dice.slice() : [rollDie(state), rollDie(state)];
      state.dice = d;
      const dbl = d[0] === d[1], total = d[0] + d[1];
      ev(state, { type: 'dice', dice: d });
      log(state, `${p.name} رمى ${d[0]} + ${d[1]} = ${total}${dbl ? ' (دبل!)' : ''}`, 'dice');
      if (p.inJail) {
        state.lastRollDoubles = false;
        if (dbl) {
          p.inJail = false; p.jailTurns = 0;
          log(state, `${p.name} خرج من السجن بالدبل`, 'jail');
          moveAndResolve(state, actor, total);
        } else {
          p.jailTurns++;
          if (p.jailTurns >= C.MAX_JAIL_TURNS) {
            p.inJail = false; p.jailTurns = 0;
            log(state, `${p.name} أكمل 3 محاولات — يدفع غرامة ${money(C.JAIL_FINE)} ويتحرك`, 'jail');
            if (charge(state, actor, C.JAIL_FINE, 'bank', 'غرامة السجن', { k: 'move', steps: total })) moveAndResolve(state, actor, total);
            else { state.turnPhase = 'debt'; state.debtResume = null; }
          } else {
            log(state, `${p.name} يبقى في السجن (المحاولة ${p.jailTurns} من ${C.MAX_JAIL_TURNS})`, 'jail');
            state.turnPhase = 'postRoll';
          }
        }
        break;
      }
      state.lastRollDoubles = dbl;
      if (dbl) state.doublesCount++;
      if (state.doublesCount >= C.MAX_DOUBLES) { sendToJail(state, actor, '3 دبل متتالية'); state.turnPhase = 'postRoll'; break; }
      moveAndResolve(state, actor, total);
      break;
    }
    case 'payJail':
      take(state, actor, C.JAIL_FINE, 'غرامة السجن'); addPot(state, C.JAIL_FINE);
      p.inJail = false; p.jailTurns = 0;
      log(state, `${p.name} دفع ${money(C.JAIL_FINE)} وخرج من السجن`, 'jail');
      break;
    case 'useJailCard': {
      const d = p.goojf.shift();
      state.decks[d].push(CARDS[d].find(c => c.a.k === 'goojf').id);
      p.inJail = false; p.jailTurns = 0;
      log(state, `${p.name} استخدم بطاقة الخروج من السجن`, 'jail');
      break;
    }
    case 'buy': {
      const i = state.pendingBuy;
      take(state, actor, SQUARES[i].price, 'شراء');
      state.props[i].owner = actor; state.pendingBuy = null;
      log(state, `${p.name} اشترى ${SQUARES[i].name} بمبلغ ${money(SQUARES[i].price)}`, 'buy');
      ev(state, { type: 'buy', player: actor, sq: i });
      finishMovement(state);
      break;
    }
    case 'auction': startAuction(state); break;
    case 'decline':
      log(state, `${p.name} تخطّى شراء ${SQUARES[state.pendingBuy].name}`);
      state.pendingBuy = null; finishMovement(state);
      break;
    case 'bid':
      state.auction.high = move.amount; state.auction.bidder = actor;
      log(state, `${p.name} زايد بـ ${money(move.amount)}`, 'auction');
      ev(state, { type: 'bid', player: actor, amount: move.amount });
      advanceAuction(state);
      break;
    case 'pass':
      state.auction.passed.push(actor);
      log(state, `${p.name} انسحب من المزاد`, 'auction');
      advanceAuction(state);
      break;
    case 'endTurn': nextTurn(state); break;
    case 'build': {
      const i = move.sq, pr = state.props[i], sq = SQUARES[i];
      take(state, actor, sq.house, 'بناء');
      if (pr.houses === C.HOUSES_PER_HOTEL) { state.bank.hotels--; state.bank.houses += C.HOUSES_PER_HOTEL; }
      else state.bank.houses--;
      pr.houses++;
      log(state, `${p.name} بنى ${pr.houses === C.HOTEL_LEVEL ? 'فندقاً' : 'بيتاً'} على ${sq.name}`, 'build');
      ev(state, { type: 'build', sq: i, player: actor });
      break;
    }
    case 'sell': {
      const i = move.sq, pr = state.props[i], sq = SQUARES[i];
      if (pr.houses === C.HOTEL_LEVEL) {
        state.bank.hotels++;
        const back = Math.min(C.HOUSES_PER_HOTEL, state.bank.houses);
        state.bank.houses -= back;
        give(state, actor, (C.HOTEL_LEVEL - back) * sq.house / 2, 'بيع مبانٍ');
        pr.houses = back;
      } else { state.bank.houses++; pr.houses--; give(state, actor, sq.house / 2, 'بيع مبانٍ'); }
      log(state, `${p.name} باع مبنى من ${sq.name}`, 'build');
      ev(state, { type: 'sell', sq: i, player: actor });
      break;
    }
    case 'mortgage':
      state.props[move.sq].mortgaged = true;
      give(state, actor, mortgageValue(move.sq), 'رهن');
      log(state, `${p.name} رهن ${SQUARES[move.sq].name} مقابل ${money(mortgageValue(move.sq))}`, 'money');
      break;
    case 'unmortgage':
      take(state, actor, unmortgageCost(move.sq), 'فك رهن');
      state.props[move.sq].mortgaged = false;
      log(state, `${p.name} فكّ رهن ${SQUARES[move.sq].name} بمبلغ ${money(unmortgageCost(move.sq))}`, 'money');
      break;
    case 'proposeTrade':
      state.trade = { from: actor, to: move.to,
        give: { props: (move.give && move.give.props || []).slice(), cash: move.give && move.give.cash || 0, cards: move.give && move.give.cards || 0 },
        get: { props: (move.get && move.get.props || []).slice(), cash: move.get && move.get.cash || 0, cards: move.get && move.get.cards || 0 },
        resume: state.turnPhase };
      state.tradesThisTurn++;
      state.turnPhase = 'trade';
      log(state, `${p.name} عرض مقايضة على ${pl(state, move.to).name}`, 'trade');
      ev(state, { type: 'tradeOffer' });
      break;
    case 'acceptTrade': case 'rejectTrade': {
      const t = state.trade, A = pl(state, t.from), B = pl(state, t.to);
      if (move.type === 'acceptTrade') {
        A.cash += t.get.cash - t.give.cash - tradeFees(state, t.get.props);
        B.cash += t.give.cash - t.get.cash - tradeFees(state, t.give.props);
        t.give.props.forEach(i => { state.props[i].owner = B.id; });
        t.get.props.forEach(i => { state.props[i].owner = A.id; });
        for (let k = 0; k < t.give.cards; k++) B.goojf.push(A.goojf.shift());
        for (let k = 0; k < t.get.cards; k++) A.goojf.push(B.goojf.shift());
        log(state, `🤝 ${B.name} وافق على المقايضة مع ${A.name}`, 'trade');
        ev(state, { type: 'tradeDone', accepted: true });
      } else {
        if (!state.tradeCooldown) state.tradeCooldown = {};
        state.tradeCooldown[tradeKey(t)] = state.turn;
        log(state, `✋ ${B.name} رفض المقايضة`, 'trade');
        ev(state, { type: 'tradeDone', accepted: false });
      }
      state.turnPhase = t.resume; state.trade = null;
      break;
    }
    case 'payDebt': {
      const d = state.debts.shift();
      payTo(state, d.debtor, d.amount, d.creditor, d.reason);
      log(state, `${p.name} سدّد ${money(d.amount)}`, 'money');
      if (d.after && d.after.k === 'move') moveAndResolve(state, d.debtor, d.after.steps);
      else if (!state.debts.length) state.turnPhase = state.debtResume;
      break;
    }
    case 'bankrupt': {
      const d = state.debts[0];
      bankrupt(state, d);
      break;
    }
  }
  return state;
}

/* ---------- عرض اللاعب (لا معلومات مخفية سوى ترتيب البطاقات) ---------- */
function getPlayerView(state, playerId) {
  const v = clone(state);
  v.decks = { chance: state.decks.chance.length, chest: state.decks.chest.length };
  delete v.seed;
  v.localPlayerId = playerId;
  v.actor = getActor(state);
  v.validMoves = getValidMoves(state);
  return v;
}

/* ============================================================
 * الذكاء الاصطناعي
 * ============================================================ */
function aiPropValue(state, pid, i) {
  const sq = SQUARES[i];
  const owned = countOwned(state, pid, sq.group), size = GROUP_MEMBERS[sq.group].length;
  let v = sq.price;
  if (owned === size - 1 && state.props[i].owner !== pid) v *= 1.6;      // يكمل مجموعتي
  // يمنع خصماً من إكمال مجموعته
  state.players.forEach(o => { if (o.id !== pid && !o.bankrupt && countOwned(state, o.id, sq.group) === size - 1 && state.props[i].owner === null) v *= 1.25; });
  return v;
}
function aiReserve(state) { return state.turn < 30 ? 80 : 150; }

function aiMove(state) {
  const actor = getActor(state);
  if (actor === null) return null;
  const p = pl(state, actor), tp = state.turnPhase;
  const valid = getValidMoves(state);
  const has = t => valid.find(m => m.type === t);

  if (tp === 'debt') {
    const d = state.debts[0];
    if (p.cash >= d.amount) return { type: 'payDebt' };
    if (p.cash + liquidationValue(state, actor) < d.amount) return { type: 'bankrupt' };
    const sells = valid.filter(m => m.type === 'sell');
    if (sells.length) return sells.sort((a, b) => state.props[b.sq].houses - state.props[a.sq].houses)[0];
    const morts = valid.filter(m => m.type === 'mortgage');
    if (morts.length) {
      morts.sort((a, b) => {
        const ga = ownsGroup(state, actor, SQUARES[a.sq].group) ? 1 : 0, gb = ownsGroup(state, actor, SQUARES[b.sq].group) ? 1 : 0;
        return ga - gb || SQUARES[a.sq].price - SQUARES[b.sq].price;
      });
      return morts[0];
    }
    return { type: 'bankrupt' };
  }
  if (tp === 'auction') {
    const a = state.auction;
    if (a.bidder !== null && sameTeam(state, actor, a.bidder)) return { type: 'pass' };
    const limit = Math.min(Math.floor(aiPropValue(state, actor, a.sq) * 0.95), p.cash - aiReserve(state));
    const step = a.high < SQUARES[a.sq].price * 0.5 ? 20 : 10;
    const bid = Math.max(a.high + step, 10);
    if (bid <= limit) return { type: 'bid', amount: bid };
    return { type: 'pass' };
  }
  if (tp === 'trade') {
    const t = state.trade;
    let gain = 0;
    t.give.props.forEach(i => {
      const g = SQUARES[i].group, size = GROUP_MEMBERS[g].length;
      let v = SQUARES[i].price * (state.props[i].mortgaged ? 0.55 : 1);
      if (countOwned(state, actor, g) === size - 1) v *= 2.5; // يكمل مجموعتي
      gain += v;
    });
    t.get.props.forEach(i => {
      let v = SQUARES[i].price * (state.props[i].mortgaged ? 0.55 : 1);
      const g = SQUARES[i].group, size = GROUP_MEMBERS[g].length;
      if (countOwned(state, t.from, g) === size - 1) v *= 2.2; // يمنح الخصم مجموعة كاملة
      gain -= v;
    });
    gain += t.give.cash - t.get.cash + 50 * (t.give.cards - t.get.cards);
    return (gain > 0 && has('acceptTrade')) ? { type: 'acceptTrade' } : { type: 'rejectTrade' };
  }
  if (tp === 'buyDecision') {
    const i = state.pendingBuy, price = SQUARES[i].price;
    const completes = countOwned(state, actor, SQUARES[i].group) === GROUP_MEMBERS[SQUARES[i].group].length - 1;
    if (has('buy') && (p.cash - price >= aiReserve(state) || (completes && p.cash >= price))) return { type: 'buy' };
    return { type: has('auction') ? 'auction' : 'decline' };
  }
  if (tp === 'preRoll') {
    if (p.inJail) {
      if (has('useJailCard')) return { type: 'useJailCard' };
      const unowned = OWNABLE.filter(i => state.props[i].owner === null).length;
      if (has('payJail') && unowned > 8 && p.cash > 300) return { type: 'payJail' };
    }
    return { type: 'roll' };
  }
  if (tp === 'postRoll') {
    // فك الرهن عن عقارات المجموعات الكاملة أولاً
    const unm = valid.filter(m => m.type === 'unmortgage' && p.cash - unmortgageCost(m.sq) > 400);
    if (unm.length) return unm.sort((a, b) => (ownsGroup(state, actor, SQUARES[b.sq].group) ? 1 : 0) - (ownsGroup(state, actor, SQUARES[a.sq].group) ? 1 : 0))[0];
    const builds = valid.filter(m => m.type === 'build' && p.cash - SQUARES[m.sq].house >= 200);
    if (builds.length) return builds.sort((a, b) => state.props[a.sq].houses - state.props[b.sq].houses || SQUARES[b.sq].price - SQUARES[a.sq].price)[0];
    if (state.tradesThisTurn === 0 && has('proposeTrade')) {
      const t = aiFindTrade(state, actor);
      if (t) return t;
    }
    return { type: 'endTurn' };
  }
  return valid[0] || null;
}

/* يبحث عن مقايضة تكمل مجموعة للذكاء الاصطناعي */
function aiFindTrade(state, pid) {
  const p = pl(state, pid);
  const cooldown = 6 * activePlayers(state).length;
  const fresh = t => { const k = tradeKey({ from: pid, to: t.to, give: t.give, get: t.get }); const at = (state.tradeCooldown || {})[k]; return at === undefined || state.turn - at >= cooldown; };
  for (const g of Object.keys(GROUP_MEMBERS)) {
    if (g === 'railroad' || g === 'utility') continue;
    const mem = GROUP_MEMBERS[g];
    const missing = mem.filter(i => state.props[i].owner !== pid);
    if (missing.length !== 1 || countOwned(state, pid, g) < 1) continue;
    const i = missing[0], owner = state.props[i].owner;
    if (owner === null || owner === pid || tradeTransferable(state, owner, i)) continue;
    // تبادل: هل أملك ما يكمل مجموعة للطرف الآخر؟
    for (const g2 of Object.keys(GROUP_MEMBERS)) {
      if (g2 === g || g2 === 'railroad' || g2 === 'utility') continue;
      const m2 = GROUP_MEMBERS[g2].filter(j => state.props[j].owner !== owner);
      if (m2.length === 1 && state.props[m2[0]].owner === pid && !tradeTransferable(state, pid, m2[0])) {
        const t = { type: 'proposeTrade', to: owner, give: { props: [m2[0]], cash: 0, cards: 0 }, get: { props: [i], cash: 0, cards: 0 } };
        if (!tradeError(state, pid, t) && fresh(t)) return t;
      }
    }
    // العرض يزيد مع ثروة اللاعب حتى لا تتجمد اللعبة
    const offer = Math.round(SQUARES[i].price * 2.4 + 20 + Math.max(0, p.cash - 1500) * 0.15);
    if (p.cash - offer >= 250) {
      const t = { type: 'proposeTrade', to: owner, give: { props: [], cash: offer, cards: 0 }, get: { props: [i], cash: 0, cards: 0 } };
      if (!tradeError(state, pid, t) && fresh(t)) return t;
    }
  }
  return null;
}

const withMap = fn => function (s, ...rest) { ensureMap(s); return fn(s, ...rest); };
const API = { TEAM_NAMES, C, GROUPS, SQUARES, OWNABLE, GROUP_MEMBERS, CARDS, CARD_BY_ID, DECK_NAME, PHASE_AR, MAPS, DEFAULT_RULES,
  setMap, ensureMap, rules, createGame, mortgageValue, unmortgageCost, mortgageFee, money, clone };
Object.entries({ applyMove, validateMove, getValidMoves, getActor, getPlayerView, computeRent,
  ownsGroup, countOwned, liquidationValue, netWorth, buildError, sellError, mortgageError, unmortgageError,
  tradeError, tradeTransferable, aiMove }).forEach(([k, fn]) => { API[k] = withMap(fn); });
if (typeof module !== 'undefined' && module.exports) module.exports = API;
else root.MonoEngine = API;
})(typeof window !== 'undefined' ? window : globalThis);
