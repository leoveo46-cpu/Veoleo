/* اختبارات محرك القوانين — تشغيل: node tests/engine.test.js
 * يحمّل المحرك من index.html (أو src/engine.js إن وُجد) */
const fs = require('fs'), path = require('path'), vm = require('vm');
function loadEngine() {
  const src = path.join(__dirname, '..', 'src', 'engine.js');
  let code;
  if (fs.existsSync(src)) code = fs.readFileSync(src, 'utf8');
  else {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const m = html.match(/\/\* ==ENGINE START== \*\/([\s\S]*?)\/\* ==ENGINE END== \*\//);
    code = m[1];
  }
  const ctx = { console, globalThis: {} }; ctx.globalThis = ctx; ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(code, ctx);
  return ctx.MonoEngine;
}
const E = loadEngine();
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓', name); }
  catch (e) { failed++; console.log('  ✗', name, '\n     ', e.message); }
}
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || ''} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`); }
function ok(c, msg) { if (!c) throw new Error(msg || 'assertion failed'); }
function throws(fn, re) { try { fn(); } catch (e) { if (re && !re.test(e.message)) throw new Error('wrong error: ' + e.message); return e.message; } throw new Error('expected error'); }

const game = (n = 2, extra = {}) => E.createGame(Object.assign({ seed: 42, allowForcedDice: true, players: Array.from({ length: n }, (_, i) => ({ name: 'P' + i })) }, extra));
const mv = (s, m) => E.applyMove(s, m);
const roll = (s, a, b) => mv(s, { type: 'roll', dice: [a, b] });
function own(s, pid, ...sqs) { sqs.forEach(i => { s.props[i].owner = pid; }); return s; }

console.log('\n— الإعداد');
test('2-8 لاعبين فقط', () => {
  throws(() => game(1), /بين 2 و 8/); throws(() => game(9), /بين 2 و 8/);
  [2, 3, 4, 5, 6, 7, 8].forEach(n => eq(game(n).players.length, n));
});
test('كل لاعب يبدأ بـ 1500 على الانطلاق', () => { const s = game(4); s.players.forEach(p => { eq(p.cash, 1500); eq(p.pos, 0); }); });
test('40 خانة و28 عقاراً و16+16 بطاقة', () => { eq(E.SQUARES.length, 40); eq(E.OWNABLE.length, 28); eq(E.CARDS.chance.length, 16); eq(E.CARDS.chest.length, 16); });

console.log('\n— الحركة والنرد');
test('الحركة حسب مجموع النرد', () => { let s = roll(game(), 2, 3); eq(s.players[0].pos, 5); s = game(); s = roll(s, 2, 4); eq(s.players[0].pos, 6); });
test('المرور بالانطلاق يعطي 200', () => {
  let s = game(); s.players[0].pos = 35; s = roll(s, 3, 4); // 42 -> 2 (صندوق المجتمع)
  eq(s.players[0].pos, 2); ok(s.events.some(e => e.type === 'money' && e.delta === 200 && e.reason === 'مرور بالانطلاق'));
});
test('الدبل يعطي رمية إضافية', () => { let s = roll(game(), 1, 1); eq(s.players[0].pos, 2); ok(['preRoll', 'debt', 'buyDecision'].includes(s.turnPhase)); if (s.turnPhase === 'preRoll') eq(s.current, 0); });
test('ثلاث دبلات متتالية = السجن', () => {
  let s = game(); s = roll(s, 1, 2); s = mv(s, { type: 'auction' }); // نتخلص من القرار
  s = game(); s.players[0].pos = 20; // موقف مجاني لتجنب القرارات
  s.doublesCount = 2; s.lastRollDoubles = true; s = roll(s, 5, 5);
  eq(s.players[0].inJail, true); eq(s.players[0].pos, 10); eq(s.turnPhase, 'postRoll');
});
test('لا يمكن الرمي بعد انتهاء الرمية', () => { let s = game(); s.players[0].pos = 18; s = roll(s, 1, 1); /* 20 parking */ s = roll(s, 2, 3); /* 25 RR */ throws(() => roll(s, 1, 2), /غير مسموحة/); });
test('إنهاء الدور ينقل للاعب التالي', () => { let s = game(3); s.players[0].pos = 15; s = roll(s, 2, 3); s = mv(s, { type: 'endTurn' }); eq(s.current, 1); });

console.log('\n— الشراء والمزاد');
test('شراء عقار غير مملوك', () => { let s = roll(game(), 1, 2); eq(s.turnPhase, 'buyDecision'); s = mv(s, { type: 'buy' }); eq(s.props[3].owner, 0); eq(s.players[0].cash, 1440); });
test('لا يمكن الشراء بدون مال كافٍ', () => { let s = game(); s.players[0].cash = 30; s = roll(s, 1, 2); throws(() => mv(s, { type: 'buy' }), /لا تملك ثمن/); });
test('المزاد: أعلى مزايد يفوز ويدفع', () => {
  let s = roll(game(3), 2, 4); // 6 حي النخيل
  s = mv(s, { type: 'auction' }); eq(s.turnPhase, 'auction'); eq(E.getActor(s), 0);
  s = mv(s, { type: 'bid', amount: 10 }); eq(E.getActor(s), 1);
  s = mv(s, { type: 'bid', amount: 50 });
  throws(() => mv(s, { type: 'bid', amount: 40 }), /أعلى من/);
  s = mv(s, { type: 'pass' }); // P2
  s = mv(s, { type: 'pass' }); // P0
  eq(s.props[6].owner, 1); eq(s.players[1].cash, 1450); eq(s.turnPhase, 'postRoll'); eq(s.current, 0);
});
test('المزاد بدون مزايدين يبقي العقار للبنك', () => { let s = roll(game(2), 2, 4); s = mv(s, { type: 'auction' }); s = mv(s, { type: 'pass' }); s = mv(s, { type: 'pass' }); eq(s.props[6].owner, null); eq(s.turnPhase, 'postRoll'); });
test('لا مزايدة أعلى من الرصيد', () => { let s = roll(game(2), 2, 4); s = mv(s, { type: 'auction' }); throws(() => mv(s, { type: 'bid', amount: 5000 }), /رصيدك/); });

console.log('\n— الإيجارات');
test('إيجار أساسي وضعف للمجموعة الكاملة', () => {
  let s = own(game(), 1, 3); s = roll(s, 1, 2); eq(s.players[0].cash, 1496); eq(s.players[1].cash, 1504);
  s = own(game(), 1, 1, 3); s = roll(s, 1, 2); eq(s.players[0].cash, 1492);
});
test('إيجار البيوت والفندق', () => {
  let s = own(game(), 1, 37, 39); s.props[39].houses = 3; s.players[0].pos = 30; s = mv(s, { type: 'roll', dice: [4, 5] });
  eq(s.players[0].pos, 39); eq(s.players[1].cash, 1500 + 1400);
  s = own(game(), 1, 37, 39); s.props[39].houses = 5; s.players[0].pos = 30; s.players[0].cash = 3000; s = roll(s, 4, 5); eq(s.players[1].cash, 3500);
});
test('لا إيجار على العقار المرهون', () => { let s = own(game(), 1, 3); s.props[3].mortgaged = true; s = roll(s, 1, 2); eq(s.players[0].cash, 1500); });
test('إيجار المحطات حسب العدد 25/50/100/200', () => {
  [[1, 25], [2, 50], [3, 100], [4, 200]].forEach(([n, r]) => { let s = own(game(), 1, ...[5, 15, 25, 35].slice(0, n)); s = roll(s, 2, 3); eq(1500 - s.players[0].cash, r, n + ' RR'); });
});
test('إيجار الشركات 4× و10× النرد', () => {
  let s = own(game(), 1, 12); s.players[0].pos = 7; s = roll(s, 2, 3); eq(1500 - s.players[0].cash, 20);
  s = own(game(), 1, 12, 28); s.players[0].pos = 7; s = roll(s, 2, 3); eq(1500 - s.players[0].cash, 50);
});

console.log('\n— الضرائب والبطاقات');
test('ضريبة الدخل 200 والرفاهية 100', () => {
  let s = roll(game(), 1, 3); eq(s.players[0].cash, 1300);
  s = game(); s.players[0].pos = 35; s = roll(s, 1, 2); eq(s.players[0].cash, 1400);
});
test('بطاقة الحظ تُسحب وتعود لأسفل المجموعة', () => {
  let s = game(); const top = s.decks.chance[0]; s = roll(s, 3, 4);
  ok(s.events.some(e => e.type === 'card' && e.id === top));
  if (top !== 'c8') eq(s.decks.chance[15], top); else eq(s.decks.chance.length, 15);
});
test('كل بطاقات الحظ والصندوق تعمل بلا أخطاء', () => {
  ['chance', 'chest'].forEach(deck => E.CARDS[deck].forEach(card => {
    let s = game(3); s.decks[deck] = [card.id, ...s.decks[deck].filter(x => x !== card.id)];
    s.players[0].pos = deck === 'chance' ? 4 : 0;
    s = roll(s, deck === 'chance' ? 1 : 1, deck === 'chance' ? 2 : 1); // 7 أو 2
    ok(s.events.some(e => e.type === 'card' && e.id === card.id), card.id);
  }));
});
test('بطاقة الذهاب للسجن', () => { let s = game(); s.decks.chance = ['c10', ...s.decks.chance.filter(x => x !== 'c10')]; s = roll(s, 3, 4); eq(s.players[0].inJail, true); eq(s.players[0].pos, 10); });
test('بطاقة أقرب محطة تدفع ضعف الإيجار', () => { let s = own(game(), 1, 15); s.decks.chance = ['c5', ...s.decks.chance.filter(x => x !== 'c5')]; s = roll(s, 3, 4); eq(s.players[0].pos, 15); eq(1500 - s.players[0].cash, 50); });
test('عيد الميلاد يجمع من كل لاعب', () => { let s = game(3); s.decks.chest = ['h9', ...s.decks.chest.filter(x => x !== 'h9')]; s = roll(s, 1, 1); eq(s.players[0].cash, 1520); eq(s.players[1].cash, 1490); });
test('دفع لكل لاعب 50', () => { let s = game(4); s.decks.chance = ['c15', ...s.decks.chance.filter(x => x !== 'c15')]; s = roll(s, 3, 4); eq(s.players[0].cash, 1350); eq(s.players[3].cash, 1550); });
test('الصيانة حسب البيوت والفنادق', () => { let s = own(game(), 0, 1, 3); s.props[1].houses = 2; s.props[3].houses = 5; s.decks.chance = ['c11', ...s.decks.chance.filter(x => x !== 'c11')]; s = roll(s, 3, 4); eq(1500 - s.players[0].cash, 2 * 25 + 100); });
test('ارجع 3 خانات', () => { let s = game(); s.decks.chance = ['c9', ...s.decks.chance.filter(x => x !== 'c9')]; s = roll(s, 3, 4); eq(s.players[0].pos, 4); eq(s.players[0].cash, 1300); });

console.log('\n— السجن');
test('الخروج بدفع 50', () => { let s = game(); s.players[0].inJail = true; s.players[0].pos = 10; s = mv(s, { type: 'payJail' }); eq(s.players[0].inJail, false); eq(s.players[0].cash, 1450); });
test('الخروج ببطاقة', () => { let s = game(); s.players[0].inJail = true; s.players[0].pos = 10; s.players[0].goojf = ['chance']; s.decks.chance = s.decks.chance.filter(x => x !== 'c8'); s = mv(s, { type: 'useJailCard' }); eq(s.players[0].inJail, false); eq(s.decks.chance.length, 16); });
test('الدبل في السجن يخرجك بلا رمية إضافية', () => { let s = game(); s.players[0].inJail = true; s.players[0].pos = 10; s = roll(s, 5, 5); eq(s.players[0].pos, 20); eq(s.players[0].inJail, false); eq(s.turnPhase, 'postRoll'); });
test('بدون دبل تبقى في السجن', () => { let s = game(); s.players[0].inJail = true; s.players[0].pos = 10; s = roll(s, 1, 2); eq(s.players[0].pos, 10); eq(s.players[0].jailTurns, 1); eq(s.turnPhase, 'postRoll'); });
test('المحاولة الثالثة الفاشلة: دفع 50 والتحرك', () => { let s = game(); Object.assign(s.players[0], { inJail: true, pos: 10, jailTurns: 2 }); s = roll(s, 4, 6); eq(s.players[0].pos, 20); eq(s.players[0].cash, 1450); eq(s.players[0].inJail, false); });
test('لا يمكن دفع الغرامة خارج السجن', () => { throws(() => mv(game(), { type: 'payJail' }), /غير مسموحة/); });
test('المالك في السجن ما زال يقبض الإيجار', () => { let s = own(game(), 1, 3); s.players[1].inJail = true; s.players[1].pos = 10; s = roll(s, 1, 2); eq(s.players[1].cash, 1504); });

console.log('\n— البناء والرهن');
test('لا بناء بدون مجموعة كاملة', () => { let s = own(game(), 0, 1); throws(() => mv(s, { type: 'build', sq: 1 }), /كامل المجموعة/); });
test('البناء المتوازن', () => {
  let s = own(game(), 0, 1, 3); s = mv(s, { type: 'build', sq: 1 }); eq(s.props[1].houses, 1); eq(s.bank.houses, 31);
  throws(() => mv(s, { type: 'build', sq: 1 }), /المتوازن/); s = mv(s, { type: 'build', sq: 3 }); s = mv(s, { type: 'build', sq: 1 }); eq(s.props[1].houses, 2);
});
test('الفندق يعيد 4 بيوت للبنك', () => { let s = own(game(), 0, 1, 3); s.props[1].houses = 4; s.props[3].houses = 4; s.bank.houses = 24; s = mv(s, { type: 'build', sq: 1 }); eq(s.props[1].houses, 5); eq(s.bank.hotels, 11); eq(s.bank.houses, 28); });
test('نقص البيوت في البنك', () => { let s = own(game(), 0, 1, 3); s.bank.houses = 0; throws(() => mv(s, { type: 'build', sq: 1 }), /لا توجد بيوت/); });
test('بيع البيت بنصف السعر والبيع المتوازن', () => { let s = own(game(), 0, 1, 3); s.props[1].houses = 2; s.props[3].houses = 1; s.bank.houses = 29; throws(() => mv(s, { type: 'sell', sq: 3 }), /المتوازن/); s = mv(s, { type: 'sell', sq: 1 }); eq(s.players[0].cash, 1525); });
test('الرهن نصف السعر وفكه +10%', () => { let s = own(game(), 0, 39); s = mv(s, { type: 'mortgage', sq: 39 }); eq(s.players[0].cash, 1700); s = mv(s, { type: 'unmortgage', sq: 39 }); eq(s.players[0].cash, 1700 - 220); });
test('لا رهن مع وجود مبانٍ في المجموعة', () => { let s = own(game(), 0, 1, 3); s.props[3].houses = 1; throws(() => mv(s, { type: 'mortgage', sq: 1 }), /بِع كل المباني/); });
test('لا بناء إذا كان في المجموعة عقار مرهون', () => { let s = own(game(), 0, 1, 3); s.props[3].mortgaged = true; throws(() => mv(s, { type: 'build', sq: 1 }), /مرهون/); });
test('لا إدارة في دور غيرك', () => { let s = own(game(), 1, 39); throws(() => mv(s, { type: 'mortgage', sq: 39 }), /ليست ملكك/); throws(() => mv(s, { type: 'roll', by: 1 }), /ليس دورك/); });

console.log('\n— الديون والإفلاس');
test('دين يمكن سداده بالرهن', () => {
  let s = own(game(), 1, 39); s.props[39].houses = 0; own(s, 0, 37); s.players[0].cash = 10; s.players[0].pos = 35; s = roll(s, 2, 2);
  eq(s.turnPhase, 'debt'); eq(E.getActor(s), 0); throws(() => mv(s, { type: 'payDebt' }), /أقل من الدين/);
  s = mv(s, { type: 'mortgage', sq: 37 }); s = mv(s, { type: 'payDebt' }); eq(s.players[0].cash, 10 + 175 - 50); eq(s.turnPhase, 'preRoll'); // دبل -> رمية أخرى
});
test('الإفلاس لصالح لاعب: يأخذ النقد فقط، والعقارات تعود للبنك', () => {
  let s = own(game(3), 1, 37, 39); s.props[39].houses = 5; own(s, 0, 1, 3); s.props[1].houses = 1; s.props[3].houses = 1; s.players[0].cash = 100; s.players[0].goojf = ['chest']; s.players[0].pos = 30; s = roll(s, 4, 5);
  eq(s.turnPhase, 'debt'); const before = s.players[1].cash; s = mv(s, { type: 'bankrupt' });
  eq(s.players[0].bankrupt, true); eq(s.props[1].owner, null); eq(s.props[3].owner, null); eq(s.props[1].houses, 0);
  eq(s.players[1].goojf, []); ok(s.decks.chest.includes('h5'), 'card back to deck'); eq(s.players[1].cash, before + 150, 'cash 100 + houses 50');
  eq(s.current, 1); eq(s.phase, 'playing');
});
test('عشوائية حقيقية: نفس الحالة مع مصادر مختلفة تعطي نرداً مختلفاً، ونفس المصدر يعطي نفس النتيجة', () => {
  const base = game(2); const seen = new Set();
  for (let k = 0; k < 60; k++) { const s = mv(base, { type: 'roll', entropy: (k * 2654435761) | 0 }); seen.add(s.dice.join()); }
  ok(seen.size >= 15, 'varied dice ' + seen.size);
  eq(mv(base, { type: 'roll', entropy: 12345 }).dice, mv(base, { type: 'roll', entropy: 12345 }).dice, 'deterministic');
});
test('توزيع النرد متوازن (60000 رمية)', () => {
  const c = [0, 0, 0, 0, 0, 0, 0]; let s = game(2); s.players[0].pos = 20;
  for (let k = 0; k < 30000; k++) { const t = mv(s, { type: 'roll', entropy: (Math.random() * 2 ** 31) | 0 }); c[t.dice[0]]++; c[t.dice[1]]++; }
  for (let f = 1; f <= 6; f++) ok(Math.abs(c[f] / 60000 - 1 / 6) < 0.01, `face ${f}: ${c[f]}`);
});
test('الإفلاس للبنك يعيد العقارات', () => { let s = own(game(3), 0, 1); s.players[0].cash = 50; s = roll(s, 1, 3); s = mv(s, { type: 'bankrupt' }); eq(s.props[1].owner, null); eq(s.players[0].bankrupt, true); });
test('آخر لاعب متبقٍّ يفوز', () => { let s = own(game(2), 1, 39); s.players[0].cash = 10; s.players[0].pos = 37; s = roll(s, 1, 1); s = mv(s, { type: 'bankrupt' }); eq(s.phase, 'gameOver'); eq(s.winner, 1); throws(() => mv(s, { type: 'roll' }), /انتهت/); });

console.log('\n— المقايضة');
test('مقايضة مقبولة', () => {
  let s = own(game(), 0, 1); own(s, 1, 3);
  s = mv(s, { type: 'proposeTrade', to: 1, give: { props: [1], cash: 100 }, get: { props: [3] } });
  eq(s.turnPhase, 'trade'); eq(E.getActor(s), 1); s = mv(s, { type: 'acceptTrade' });
  eq(s.props[1].owner, 1); eq(s.props[3].owner, 0); eq(s.players[0].cash, 1400); eq(s.turnPhase, 'preRoll');
});
test('مقايضة مرفوضة', () => { let s = own(game(), 1, 3); s = mv(s, { type: 'proposeTrade', to: 1, give: { cash: 100 }, get: { props: [3] } }); s = mv(s, { type: 'rejectTrade' }); eq(s.props[3].owner, 1); });
test('رسوم 10% على العقار المرهون المستلم', () => { let s = own(game(), 1, 39); s.props[39].mortgaged = true; s = mv(s, { type: 'proposeTrade', to: 1, give: { cash: 100 }, get: { props: [39] } }); s = mv(s, { type: 'acceptTrade' }); eq(s.players[0].cash, 1500 - 100 - 20); });
test('مقايضات غير صالحة', () => {
  let s = own(game(), 1, 3); s.props[1].owner = 1; s.props[1].houses = 1;
  throws(() => mv(s, { type: 'proposeTrade', to: 1, give: { cash: 9999 }, get: { props: [3] } }), /بِع مباني|المال/);
  throws(() => mv(s, { type: 'proposeTrade', to: 0, give: { cash: 1 } }), /لاعباً آخر/);
  throws(() => mv(s, { type: 'proposeTrade', to: 1, give: { cash: 5 }, get: { cash: 1 } }), /المال فقط/);
});

console.log('\n— الخرائط والإعدادات');
const gm = (map, rules, extra) => E.createGame(Object.assign({ seed: 42, allowForcedDice: true, map, rules, players: [{ name: 'P0' }, { name: 'P1' }] }, extra || {}));
test('الخرائط: أحجامها وعدد عقاراتها', () => {
  const exp = { original: [40, 28, 10], classic: [40, 28, 10], worldwide: [48, 35, 12], lucky: [40, 20, 10] };
  Object.entries(exp).forEach(([m, [n, own, jail]]) => { gm(m); eq(E.SQUARES.length, n, m); eq(E.OWNABLE.length, own, m); eq(E.C.JAIL_POS, jail, m); eq(E.CARDS.chance.length, 16); });
});
test('تبديل الخريطة تلقائياً حسب الحالة', () => { const a = gm('worldwide'), b = gm('original'); E.getValidMoves(a); eq(E.SQUARES.length, 48); E.getValidMoves(b); eq(E.SQUARES.length, 40); });
test('رأس مال 500 و1000', () => { [500, 1000].forEach(c => eq(gm('classic', null, { startCash: c }).players[0].cash, c)); });
test('كلاسيك: الحركة والسجن على الخريطة', () => { let s = gm('classic'); s = roll(s, 1, 2); eq(s.players[0].pos, 3); eq(E.SQUARES[3].name, 'ريو'); s = gm('worldwide'); s.players[0].pos = 30; s = roll(s, 3, 3); eq(s.players[0].inJail, true); eq(s.players[0].pos, 12); });
test('ضريبة الأرباح 10% من الرصيد', () => { let s = gm('classic'); s = roll(s, 1, 3); eq(s.players[0].cash, 1350); });
test('الاسترداد الضريبي +50', () => { let s = gm('lucky'); s.players[0].pos = 33; s = roll(s, 1, 3); eq(s.players[0].pos, 37); eq(s.players[0].cash, 1550); });
test('حول العالم: 3 شركات = 20× النرد', () => { const s = gm('worldwide'); own(s, 1, 15, 22, 33); eq(E.computeRent(s, 15, 7), 140); });
test('إيقاف مضاعفة الإيجار للمجموعة', () => { const a = own(gm('classic'), 1, 1, 3), b = own(gm('classic', { doubleSet: false }), 1, 1, 3); eq(E.computeRent(a, 1, 0), 4); eq(E.computeRent(b, 1, 0), 2); });
test('أموال الإجازة: تتجمع وتُقبض', () => {
  let s = gm('classic', { vacationCash: true }); s = roll(s, 1, 3); eq(s.pot, 150); s = mv(s, { type: 'endTurn' });
  s.players[1].pos = 16; s = roll(s, 1, 3); eq(s.players[1].pos, 20); eq(s.pot, 0); eq(s.players[1].cash, 1650);
});
test('بلا مزاد: التخطي يبقي العقار للبنك', () => { let s = gm('classic', { auction: false }); s = roll(s, 1, 2); ok(E.getValidMoves(s).some(m => m.type === 'decline')); throws(() => mv(s, { type: 'auction' }), /غير مسموحة/); s = mv(s, { type: 'decline' }); eq(s.props[3].owner, null); eq(s.turnPhase, 'postRoll'); });
test('لا إيجار أثناء السجن', () => { let s = own(gm('classic', { noRentInJail: true }), 1, 3); s.players[1].inJail = true; s.players[1].pos = 10; s = roll(s, 1, 2); eq(s.players[0].cash, 1500); });
test('تعطيل الرهن', () => { const s = own(gm('classic', { mortgage: false }), 0, 1); ok(/معطّل/.test(E.mortgageError(s, 0, 1))); eq(E.liquidationValue(s, 0), 0); });
test('إيقاف البناء المتساوي', () => { const s = own(gm('classic', { evenBuild: false }), 0, 1, 3); s.props[1].houses = 2; eq(E.buildError(s, 0, 1), null); ok(E.buildError(own(gm('classic'), 0, 1, 3), 0, 1) === null); });
test('الفرق: لا إيجار بين الزملاء', () => { let s = E.createGame({ seed: 3, allowForcedDice: true, players: [{ name: 'a', team: 0 }, { name: 'b', team: 1 }, { name: 'c', team: 0 }] }); eq(s.teams, true); own(s, 2, 3); s = roll(s, 1, 2); eq(s.players[0].cash, 1500); });
test('الفرق: يفوز الفريق عند إفلاس كل الخصوم', () => {
  for (let g = 0; g < 20; g++) {
    let s = E.createGame({ seed: 500 + g, players: [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ name: 'T' + i, isAI: true, team: i % 2 })) });
    let n = 0; while (s.phase === 'playing' && n++ < 40000) s = E.applyMove(s, E.aiMove(s));
    eq(s.phase, 'gameOver'); const t = s.players[s.winner].team; ok(s.players.filter(p => p.team !== t).every(p => p.bankrupt), 'other team bankrupt');
  }
});
Object.keys(E.MAPS).forEach(m => test(`مباريات AI كاملة على «${E.MAPS[m].name}» بكل الإعدادات`, () => {
  for (let g = 0; g < 15; g++) {
    let s = E.createGame({ seed: 77 + g, map: m, startCash: [500, 1000, 1500][g % 3], rules: { vacationCash: true, noRentInJail: g % 2 === 0, auction: g % 3 !== 0, evenBuild: g % 2 === 1, mortgage: g % 4 !== 0 }, players: [0, 1, 2].map(i => ({ name: 'A' + i, isAI: true })) });
    let n = 0; while (s.phase === 'playing' && n++ < 30000) s = E.applyMove(s, E.aiMove(s));
    eq(s.phase, 'gameOver', `game ${g}`);
  }
}));

/* ---------- محاكاة مباريات كاملة بالذكاء الاصطناعي ---------- */
console.log('\n— محاكاة مباريات كاملة (AI)');
function invariants(s) {
  let houses = 0, hotels = 0;
  E.OWNABLE.forEach(i => {
    const pr = s.props[i], sq = E.SQUARES[i];
    if (pr.houses === 5) hotels++; else houses += pr.houses;
    if (pr.houses) {
      if (!E.ownsGroup(s, pr.owner, sq.group)) throw new Error(`مبانٍ بدون مجموعة كاملة على ${i}`);
      if (pr.mortgaged) throw new Error(`عقار مرهون عليه مبانٍ ${i}`);
    }
    if (pr.owner !== null && s.players[pr.owner].bankrupt) throw new Error('عقار يملكه مفلس');
  });
  if (houses + s.bank.houses !== 32) throw new Error(`عدد البيوت ${houses}+${s.bank.houses} != 32`);
  if (hotels + s.bank.hotels !== 12) throw new Error('عدد الفنادق غير صحيح');
  s.players.forEach(p => { if (p.cash < 0) throw new Error(`رصيد سالب ${p.name} ${p.cash}`); });
  ['chance', 'chest'].forEach(d => { const held = s.players.reduce((n, p) => n + p.goojf.filter(x => x === d).length, 0); if (s.decks[d].length + held !== 16) throw new Error('بطاقات مفقودة ' + d); });
}
const stats = { games: 0, finished: 0, moves: 0, turns: [], trades: 0, auctions: 0, builds: 0, bankrupt: 0, jail: 0 };
const N = +process.env.SIMS || 300, MAX_MOVES = 30000;
for (let g = 0; g < N; g++) {
  const n = 2 + (g % 5);
  let s = E.createGame({ seed: 1000 + g, players: Array.from({ length: n }, (_, i) => ({ name: 'AI' + i, isAI: true })) });
  let m = 0;
  try {
    while (s.phase === 'playing' && m < MAX_MOVES) {
      const move = E.aiMove(s);
      const err = E.validateMove(s, move);
      if (err) throw new Error(`AI move rejected ${JSON.stringify(move)}: ${err}`);
      s = E.applyMove(s, move); m++;
      if (move.type === 'acceptTrade') stats.trades++;
      if (move.type === 'auction') stats.auctions++;
      if (move.type === 'build') stats.builds++;
      if (move.type === 'bankrupt') stats.bankrupt++;
      if (s.events.some(e => e.type === 'jail')) stats.jail++;
      invariants(s);
    }
  } catch (e) { failed++; console.log(`  ✗ game ${g} (seed ${1000 + g}, ${n}p) move ${m}: ${e.message}`); continue; }
  stats.games++; stats.moves += m;
  if (s.phase === 'gameOver') { stats.finished++; stats.turns.push(s.turn); if (s.players[s.winner].bankrupt) { failed++; console.log('  ✗ winner bankrupt'); } }
}
stats.turns.sort((a, b) => a - b);
console.log(`  مباريات: ${stats.games}/${N}، انتهت بفائز: ${stats.finished}، متوسط الحركات ${Math.round(stats.moves / Math.max(1, stats.games))}، وسيط الأدوار ${stats.turns[stats.turns.length >> 1]}`);
console.log(`  مقايضات مقبولة ${stats.trades}، مزادات ${stats.auctions}، مبانٍ ${stats.builds}، إفلاسات ${stats.bankrupt}، دخول سجن ${stats.jail}`);
if (stats.finished < N * 0.9) { failed++; console.log('  ✗ أقل من 90% من المباريات انتهت بفائز'); } else passed++;

console.log(`\n${passed} ناجح، ${failed} فاشل`);
process.exit(failed ? 1 : 0);
