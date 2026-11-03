/* اختبارات المتصفح (Playwright): node tests/browser.test.js */
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
let passed = 0, failed = 0;
const results = [];
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ✓', name); }
  catch (e) { failed++; console.log('  ✗', name, '\n     ', e.message.split('\n')[0]); }
}
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m || ''} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`); };

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  async function newPage(vp) {
    const page = await browser.newPage({ viewport: vp || { width: 1366, height: 860 } });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(URL);
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    return page;
  }
  const view = p => p.evaluate(() => JSON.parse(render_game_to_text()));
  const idle = (p, t) => p.waitForFunction(() => window.__ui.isIdle(), null, { timeout: t || 20000 });
  const move = (p, m) => p.evaluate(m => performMove(m), m);
  const start = (p, cfg) => p.evaluate(c => startGame(c), Object.assign({ seed: 11, speed: 'instant', sound: false, allowForcedDice: true }, cfg));
  const humans = n => Array.from({ length: n }, (_, i) => ({ name: 'P' + i, token: i }));

  console.log('\n— الردهة والإعداد');
  await test('الردهة تظهر وتدعم 2-8 لاعبين وتبدأ اللعبة بالنقر', async () => {
    const p = await newPage();
    ok(await p.isVisible('[data-screen="lobby"]'));
    for (const n of [2, 8, 4]) { await p.click(`[data-count="${n}"]`); eq(await p.locator('[data-player-config]').count(), n); }
    await p.click('#start-btn');
    ok(await p.isVisible('[data-screen="game"]'));
    eq(await p.locator('.cell').count(), 40, 'cells');
    eq(await p.locator('.token').count(), 4, 'tokens');
    const v = await view(p); eq(v.players.length, 4); eq(v.players.every(x => x.cash === 1500), true);
    ok(await p.evaluate(() => document.documentElement.dir === 'rtl'), 'RTL');
    await p.close();
  });

  console.log('\n— اللعب عبر الواجهة');
  await test('رمي النرد بالزر يحرك القطعة ويظهر نافذة الشراء، والشراء بالنقر', async () => {
    const p = await newPage();
    await start(p, { players: humans(2), speed: 'fast' });
    await move(p, { type: 'roll', dice: [1, 2] }); // شارع الرمّان
    await idle(p);
    ok(await p.isVisible('[data-modal="buy"]'), 'buy modal');
    const tok = await p.evaluate(() => { const t = document.querySelector('[data-token="0"]').getBoundingClientRect(); const c = document.querySelector('.cell[data-sq="3"]').getBoundingClientRect(); return t.left >= c.left - 20 && t.right <= c.right + 20; });
    ok(tok, 'token on square 3');
    await p.click('[data-modal="buy"] [data-action="buy"]'); await idle(p);
    const v = await view(p); eq(v.players[0].cash, 1440); eq(v.players[0].properties[0].sq, 3);
    ok(await p.evaluate(() => document.querySelector('.cell[data-sq="3"]').dataset.owner === '0'), 'owner strip');
    await p.click('[data-action="endTurn"]'); await idle(p);
    eq((await view(p)).current, 1);
    await p.click('[data-action="roll"]'); await idle(p);
    ok((await view(p)).dice, 'dice rolled via button');
    await p.close();
  });
  await test('المزاد عبر الواجهة', async () => {
    const p = await newPage();
    await start(p, { players: humans(3) });
    await move(p, { type: 'roll', dice: [2, 4] }); await idle(p);
    await p.click('[data-modal="buy"] [data-action="auction"]'); await idle(p);
    ok(await p.isVisible('[data-modal="auction"]'));
    await p.click('[data-bid="10"]'); await idle(p);
    await p.click('[data-bid="50"]'); await idle(p);   // P1 = 60
    await p.click('[data-action="pass"]'); await idle(p); // P2
    await p.click('[data-action="pass"]'); await idle(p); // P0
    const v = await view(p);
    eq(v.players[1].properties.map(x => x.sq), [6]); eq(v.players[1].cash, 1440); eq(v.turnPhase, 'postRoll');
    ok(!(await p.isVisible('[data-modal="auction"]')), 'auction closed');
    await p.close();
  });
  await test('بطاقة الحظ تظهر وتُغلق بالنقر وتُطبَّق', async () => {
    const p = await newPage();
    await start(p, { players: humans(2), speed: 'fast' });
    await p.evaluate(() => { const s = __ui.state(); s.decks.chance = ['c7', ...s.decks.chance.filter(x => x !== 'c7')]; });
    await move(p, { type: 'roll', dice: [3, 4] });
    await p.waitForSelector('[data-card="c7"]', { timeout: 5000 });
    await p.waitForTimeout(400);
    await p.click('[data-action="card-ok"]'); await idle(p);
    eq((await view(p)).players[0].cash, 1550);
    await p.close();
  });
  await test('السجن: ثلاث دبلات ثم الخروج بالدفع', async () => {
    const p = await newPage();
    await start(p, { players: humans(2) });
    await p.evaluate(() => { const s = __ui.state(); s.players[0].pos = 18; });
    await move(p, { type: 'roll', dice: [1, 1] }); await idle(p);
    let v = await view(p); if (v.turnPhase === 'buyDecision') { await move(p, { type: 'auction' }); await move(p, { type: 'pass' }); await move(p, { type: 'pass' }); await idle(p); }
    v = await view(p); if (v.turnPhase === 'debt') await move(p, { type: 'payDebt' });
    await p.evaluate(() => { __ui.state().doublesCount = 2; __ui.state().turnPhase = 'preRoll'; __ui.setState(__ui.state()); });
    await move(p, { type: 'roll', dice: [2, 2] }); await idle(p);
    v = await view(p); eq(v.players[0].inJail, true); eq(v.players[0].pos, 10);
    ok(await p.evaluate(() => document.querySelector('[data-token="0"]').classList.contains('jailed')), 'jailed token');
    await p.click('[data-action="endTurn"]'); await idle(p);
    await move(p, { type: 'roll', dice: [1, 2] }); await idle(p); // P1
    v = await view(p); if (v.turnPhase === 'buyDecision') { await move(p, { type: 'auction' }); await move(p, { type: 'pass' }); await move(p, { type: 'pass' }); }
    await idle(p); await move(p, { type: 'endTurn' }); await idle(p);
    ok(await p.isVisible('[data-action="payJail"]'), 'pay jail button');
    await p.click('[data-action="payJail"]'); await idle(p);
    v = await view(p); eq(v.players[0].inJail, false); eq(v.players[0].cash, 1450);
    await p.close();
  });
  await test('البناء عبر نافذة العقارات', async () => {
    const p = await newPage();
    await start(p, { players: humans(2) });
    await p.evaluate(() => { const s = __ui.state(); s.props[1].owner = 0; s.props[3].owner = 0; __ui.setState(s); });
    await p.click('[data-action="manage"]');
    await p.click('[data-manage="build"][data-sq="1"]'); await idle(p);
    ok(await p.locator('[data-manage="build"][data-sq="1"]').isDisabled(), 'even-build rule disables second house');
    await p.click('[data-manage="build"][data-sq="3"]'); await idle(p);
    const v = await view(p); eq(v.players[0].properties.map(x => x.houses), [1, 1]); eq(v.bank.houses, 30); eq(v.players[0].cash, 1400);
    eq(await p.locator('.cell[data-sq="1"] .house').count(), 1, 'house drawn');
    await p.click('[data-manage="sell"][data-sq="1"]'); await idle(p);
    eq((await view(p)).players[0].cash, 1425);
    await p.click('[data-action="close"]');
    await p.close();
  });
  await test('المقايضة عبر الواجهة (إنسان مع إنسان)', async () => {
    const p = await newPage();
    await start(p, { players: humans(2) });
    await p.evaluate(() => { const s = __ui.state(); s.props[1].owner = 0; s.props[3].owner = 1; __ui.setState(s); });
    await p.click('[data-action="trade"]');
    await p.check('[data-trade-prop="1"]'); await p.check('[data-trade-prop="3"]');
    await p.fill('[data-trade-cash="give"]', '50');
    await p.click('[data-action="send-trade"]'); await idle(p);
    ok(await p.isVisible('[data-modal="tradeReply"]'), 'reply modal');
    await p.click('[data-action="acceptTrade"]'); await idle(p);
    const v = await view(p); eq(v.players[0].properties.map(x => x.sq), [3]); eq(v.players[1].properties.map(x => x.sq), [1]); eq(v.players[0].cash, 1450);
    await p.close();
  });
  await test('الدين: الرهن ثم السداد عبر الواجهة', async () => {
    const p = await newPage();
    await start(p, { players: humans(2) });
    await p.evaluate(() => { const s = __ui.state(); s.props[39].owner = 1; s.props[37].owner = 0; s.players[0].cash = 10; s.players[0].pos = 37; __ui.setState(s); });
    await move(p, { type: 'roll', dice: [1, 1] }); await idle(p);
    eq((await view(p)).turnPhase, 'debt');
    await p.click('[data-action="manage"]');
    await p.click('[data-manage="mortgage"][data-sq="37"]'); await idle(p);
    await p.click('[data-action="close"]');
    await p.click('[data-action="payDebt"]'); await idle(p);
    const v = await view(p); eq(v.players[0].cash, 135); eq(v.players[1].cash, 1550);
    await p.close();
  });

  console.log('\n— حركات غير قانونية');
  await test('رفض الحركات غير القانونية برسائل واضحة', async () => {
    const p = await newPage();
    await start(p, { players: humans(3) });
    let r = await move(p, { type: 'endTurn' }); ok(!r.success && /غير مسموحة/.test(r.error), r.error);
    r = await move(p, { type: 'roll', by: 2 }); ok(!r.success && /ليس دورك/.test(r.error), r.error);
    r = await move(p, { type: 'build', sq: 1 }); ok(!r.success && /ليست ملكك/.test(r.error), r.error);
    r = await move(p, { type: 'roll', dice: [7, 1] }); ok(!r.success && /1-6/.test(r.error), r.error);
    r = await move(p, { type: 'bid', amount: 5 }); ok(!r.success && /مزاد/.test(r.error), r.error);
    r = await move(p, { type: 'proposeTrade', to: 1, give: { cash: 10 } }); ok(!r.success, 'cash-only trade');
    eq((await view(p)).turn, 1, 'state unchanged');
    await p.close();
  });

  console.log('\n— مباريات كاملة');
  await test('مباراة كاملة 4 لاعبين كمبيوتر حتى الفوز (عبر الواجهة)', async () => {
    const p = await newPage();
    await start(p, { seed: 2024, allowForcedDice: false, players: [0, 1, 2, 3].map(i => ({ name: 'AI' + i, isAI: true, token: i })) });
    await p.waitForFunction(() => JSON.parse(render_game_to_text()).phase === 'gameOver', null, { timeout: 120000, polling: 250 });
    await idle(p).catch(() => {});
    await p.waitForSelector('[data-modal="gameover"]', { timeout: 5000 });
    const v = await view(p);
    ok(v.winner !== null && !v.players[v.winner].bankrupt, 'winner'); eq(v.players.filter(x => !x.bankrupt).length, 1);
    results.push(`AI game finished in ${v.turn} turns, winner ${v.players[v.winner].name}`);
    await p.close();
  });
  await test('مباراة كاملة: إنسان (ينقر الأزرار) ضد 2 كمبيوتر', async () => {
    const p = await newPage();
    await start(p, { seed: 77, allowForcedDice: false, players: [{ name: 'أنا' }, { name: 'AI1', isAI: true, token: 1 }, { name: 'AI2', isAI: true, token: 2 }] });
    const seen = new Set();
    for (let step = 0; step < 6000; step++) {
      const v = await view(p);
      if (v.phase === 'gameOver') break;
      if (v.actor !== 0 || v.ui.busy) { await p.waitForTimeout(20); continue; }
      const click = async sel => { if (await p.isVisible(sel)) { await p.click(sel); seen.add(sel); return true; } return false; };
      await idle(p);
      const t = v.turnPhase;
      if (t === 'buyDecision') { if (!(await click('[data-modal="buy"] [data-action="buy"]'))) await click('[data-modal="buy"] [data-action="auction"]'); }
      else if (t === 'auction') { if (v.auction.high < 40 && v.players[0].cash > 300) await click('[data-bid="10"]') || await click('[data-action="pass"]'); else await click('[data-action="pass"]'); }
      else if (t === 'trade') { await click('[data-action="rejectTrade"]'); }
      else if (t === 'debt') {
        if (!(await click('[data-action="payDebt"]'))) {
          await click('[data-action="manage"]');
          const b = p.locator('[data-manage="sell"]:not([disabled]), [data-manage="mortgage"]:not([disabled])').first();
          if (await b.count()) { await b.click(); seen.add('debt-raise'); await idle(p); await click('[data-action="close"]'); }
          else { await click('[data-action="close"]'); await click('[data-action="bankrupt"]'); await click('[data-action="confirm-bankrupt"]'); }
        }
      } else if (t === 'preRoll') { if (!(await click('[data-action="roll"]'))) await p.waitForTimeout(30); }
      else if (t === 'postRoll') {
        const canBuild = v.validMoves.some(m => m.type === 'build') && v.players[0].cash > 400;
        if (canBuild) { await click('[data-action="manage"]'); const b = p.locator('[data-manage="build"]:not([disabled])').first(); if (await b.count()) { await b.click(); seen.add('build'); await idle(p); } await click('[data-action="close"]'); }
        else await click('[data-action="endTurn"]');
      }
      await idle(p).catch(() => {});
    }
    const v = await view(p);
    eq(v.phase, 'gameOver', 'game finished');
    ok(seen.has('[data-action="roll"]') && seen.has('[data-action="endTurn"]'), 'used UI buttons');
    results.push(`Human-vs-AI game finished in ${v.turn} turns, winner ${v.players[v.winner].name}; UI paths: ${[...seen].length}`);
    await p.close();
  });

  console.log('\n— الخرائط والإعدادات');
  await test('الردهة: اختيار الخريطة ورأس المال والإعدادات ثم مباراة كاملة على «حول العالم»', async () => {
    const p = await newPage();
    await p.click('[data-map="worldwide"]'); await p.click('[data-cash-opt="1000"]');
    await p.click('[data-rule="auction"]');
    eq(await p.getAttribute('[data-rule="auction"]', 'aria-checked'), 'false');
    await p.click('[data-count="3"]');
    await p.click('#start-btn');
    eq(await p.locator('.cell').count(), 48, 'cells');
    eq(await p.locator('.cell .flag').count() > 20, true, 'flags');
    let v = await view(p); eq(v.players.every(x => x.cash === 1000), true);
    await p.evaluate(() => { const s = window.__ui.state(); s.players.forEach(pl => { pl.isAI = true; }); window.__ui.speed('instant'); window.__ui.setState(s); });
    await p.waitForFunction(() => JSON.parse(render_game_to_text()).phase === 'gameOver', null, { timeout: 120000 });
    await p.close();
  });
  await test('كلاسيك بلا مزاد: زر التخطي يعمل', async () => {
    const p = await newPage();
    await start(p, { players: humans(2), map: 'classic', rules: { auction: false } });
    await move(p, { type: 'roll', dice: [1, 2] }); await idle(p);
    ok(await p.isVisible('[data-modal="buy"] [data-action="decline"]'), 'decline btn');
    await p.click('[data-modal="buy"] [data-action="decline"]'); await idle(p);
    const v = await view(p); eq(v.turnPhase, 'postRoll');
    await p.close();
  });

  console.log('\n— الحفظ والموبايل');
  await test('الحفظ التلقائي والمتابعة بعد إعادة التحميل', async () => {
    const p = await newPage();
    await start(p, { players: humans(2) });
    await move(p, { type: 'roll', dice: [2, 3] }); await idle(p);
    const before = await view(p);
    await p.reload(); await p.route(/fonts/, r => r.abort());
    ok(await p.isVisible('#resume-btn'), 'resume visible');
    await p.click('#resume-btn'); await idle(p);
    const after = await view(p);
    eq(after.players.map(x => [x.pos, x.cash]), before.players.map(x => [x.pos, x.cash]));
    eq(after.turnPhase, before.turnPhase);
    await p.close();
  });
  await test('الموبايل: بلا تمرير أفقي واللوحة كاملة الظهور', async () => {
    const p = await newPage({ width: 375, height: 740 });
    await p.click('[data-count="6"]'); await p.click('#start-btn');
    await p.evaluate(() => __ui.speed('instant'));
    const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth, b: document.getElementById('board').getBoundingClientRect() }));
    ok(m.sw <= m.w + 1, `scrollWidth ${m.sw} > ${m.w}`); ok(m.b.left >= 0 && m.b.right <= m.w, 'board inside viewport');
    await p.tap('[data-action="roll"]').catch(() => p.click('[data-action="roll"]'));
    await idle(p);
    ok((await view(p)).dice, 'rolled on mobile');
    await p.close();
  });

  console.log(errors.length ? '\n  أخطاء الكونسول:\n   ' + errors.slice(0, 10).join('\n   ') : '\n  لا أخطاء في الكونسول');
  if (errors.length) failed++;
  results.forEach(r => console.log('  •', r));
  console.log(`\n${passed} ناجح، ${failed} فاشل`);
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
