/* اختبار اللعب أونلاين عبر خوادم MQTT (نفس الشيفرة التي تعمل في الإنتاج) بخادمين محليين:
 * - كل لاعب في سياق متصفح مستقل (كأنه جهاز مستقل، بلا تخزين مشترك)
 * - ضيف يصل إلى خادم واحد فقط (كأنه على شبكة مختلفة)
 * - انقطاع الخوادم، إعادة الاتصال، إعادة تحميل الصفحة للمضيف والضيف، ومباراة كاملة متزامنة
 * تشغيل: node tests/relay.test.js */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const { startBroker } = require('./helpers/mqtt-broker');
const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn) { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { failed++; console.log('  ✗', name, '\n     ', e.message.split('\n')[0]); } }
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m || ''} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  let A = await startBroker(0), B = await startBroker(0);
  const portA = A.port;
  const server = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); fs.createReadStream(path.join(ROOT, 'index.html')).pipe(r); }).listen(0);
  const URL = `http://127.0.0.1:${server.address().port}/`;
  const both = encodeURIComponent(`ws://127.0.0.1:${A.port}/mqtt,ws://127.0.0.1:${B.port}/mqtt`);
  const onlyB = encodeURIComponent(`ws://127.0.0.1:${B.port}/mqtt`);
  const browser = await chromium.launch();
  const errors = [];
  const device = async q => { const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } }); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); await p.goto(URL + q); return p; };
  const net = p => p.evaluate(() => window.__net.state());
  const view = p => p.evaluate(() => JSON.parse(render_game_to_text()));
  const seats = p => p.evaluate(() => window.__net.state().seats);

  console.log('\n— أونلاين عبر خوادم الوسيط (MQTT)');
  const host = await device(`?broker=${both}`);
  await host.click('[data-mode="online"]');
  await host.fill('[data-player-config="0"] input', 'المضيف');
  await host.click('[data-action="create-room"]');
  await host.waitForSelector('[data-room-code]', { timeout: 10000 });
  const code = await host.getAttribute('[data-room-code]', 'data-room-code');
  let g1, g2;

  await test('المضيف ينشئ غرفة ويتصل بالخادمين', async () => { ok(/^[A-Z0-9]{5}$/.test(code)); eq(A.count() >= 1 && B.count() >= 1, true, 'host on both brokers'); });
  await test('ضيف من «شبكة أخرى» (يصل لخادم واحد فقط) ينضم عبر الرابط', async () => {
    g1 = await device(`?room=${code}&broker=${onlyB}`);
    await g1.fill('[data-player-config="0"] input', 'ضيف1');
    await g1.click('[data-action="join-room"]');
    await host.waitForFunction(() => window.__net.state().seats === 2, null, { timeout: 15000 });
    await g1.waitForFunction(() => window.__net.state().seats === 2, null, { timeout: 15000 });
    eq((await net(g1)).role, 'guest');
  });
  await test('ضيف ثانٍ ينضم بكتابة الكود', async () => {
    g2 = await device(`?broker=${both}`);
    await g2.click('[data-mode="online"]');
    await g2.fill('[data-player-config="0"] input', 'ضيف2');
    await g2.fill('[data-join-code]', code);
    await g2.click('[data-action="join-room"]');
    await host.waitForFunction(() => window.__net.state().seats === 3, null, { timeout: 15000 });
  });
  await test('كود خاطئ يعطي رسالة واضحة', async () => {
    const x = await device(`?broker=${both}`);
    await x.click('[data-mode="online"]'); await x.fill('[data-join-code]', 'ZZZZ9'); await x.click('[data-action="join-room"]');
    await x.waitForFunction(() => /لم نجد غرفة/.test(window.__net.state().status), null, { timeout: 20000 });
    await x.context().close();
  });
  await test('المضيف يغيّر الإعدادات ويبدأ، والكل يرى نفس اللعبة', async () => {
    await host.click('[data-map="classic"]');
    await g1.waitForFunction(() => !!document.querySelector('.map-card.on[data-map="classic"]'), null, { timeout: 8000 });
    await host.evaluate(() => window.__ui.speed('instant'));
    await host.click('#start-btn');
    for (const g of [g1, g2]) await g.waitForSelector('[data-screen="game"]:not(.hidden)', { timeout: 10000 });
    eq((await view(g1)).players.map(p => p.name), ['المضيف', 'ضيف1', 'ضيف2']);
    eq((await net(g1)).mySeat, 1); eq((await net(g2)).mySeat, 2);
  });

  const pages = () => [host, g1, g2];
  const stats = { moves: 0, ms: 0 };
  async function play(maxSteps, until) {
    const deadline = Date.now() + Math.min(480000, maxSteps * 150);
    while (Date.now() < deadline) {
      const hv = await view(host);
      if (hv.phase === 'gameOver' || (until && until(hv))) return hv;
      const pg = pages()[hv.actor];
      if (!pg) { await sleep(30); continue; }
      const ck = pg.locator('[data-action="card-ok"]'); if (await ck.count()) { await ck.click().catch(() => {}); continue; }
      const idle = await pg.evaluate(() => window.__ui.isIdle() && !window.__ui.netBusy());
      if (!idle) { await sleep(25); continue; }
      const sig = JSON.stringify([hv.turn, hv.turnPhase, hv.actor, hv.players.map(p => p.cash), hv.auction && hv.auction.high]);
      const t0 = Date.now();
      await pg.evaluate(() => { const m = window.MonoEngine.aiMove(window.__ui.state()); return performMove(m); });
      stats.moves++;
      await host.waitForFunction(s => { const v = JSON.parse(render_game_to_text()); return v.phase === 'gameOver' || JSON.stringify([v.turn, v.turnPhase, v.actor, v.players.map(p => p.cash), v.auction && v.auction.high]) !== s; }, sig, { timeout: 10000 }).catch(() => {});
      stats.ms += Date.now() - t0;
    }
    return view(host);
  }
  const synced = async () => { await sleep(600); const hv = await view(host); for (const g of [g1, g2]) { const gv = await view(g); eq([gv.turn, gv.players.map(p => [p.cash, p.pos])], [hv.turn, hv.players.map(p => [p.cash, p.pos])], 'state sync'); } return hv; };

  await test('اللعب متزامن: النرد والحركة والأدوار عند الجميع', async () => {
    const hv0 = await view(host);
    const hv = await play(400, v => v.turn >= hv0.turn + 12);
    ok(hv.turn >= hv0.turn + 12, 'progressed'); await synced();
    ok((await g1.evaluate(() => document.querySelectorAll('.cell.owned').length)) === (await host.evaluate(() => document.querySelectorAll('.cell.owned').length)), 'board ownership drawn');
  });
  await test('انقطاع الخادم B فجأة: الضيف1 والمضيف يعيدان الاتصال تلقائياً ويكملان', async () => {
    B.dropAll();
    await sleep(3500);
    const hv0 = await view(host);
    const hv = await play(400, v => v.turn >= hv0.turn + 6);
    ok(hv.turn >= hv0.turn + 6, 'progressed after reconnect'); await synced();
  });
  await test('توقف الخادم A نهائياً: الضيف2 ينتقل تلقائياً للخادم B', async () => {
    await A.close();
    await sleep(14000);
    const hv0 = await view(host);
    const hv = await play(400, v => v.turn >= hv0.turn + 6);
    ok(hv.turn >= hv0.turn + 6, 'progressed after broker loss'); await synced();
    A = await startBroker(portA);
  });
  await test('الضيف يعيد تحميل الصفحة فيعود تلقائياً لمقعده', async () => {
    await g1.reload();
    await g1.waitForSelector('[data-screen="game"]:not(.hidden)', { timeout: 20000 });
    eq((await net(g1)).mySeat, 1);
    const hv0 = await view(host);
    const hv = await play(300, v => v.turn >= hv0.turn + 4); ok(hv.turn >= hv0.turn + 4); await synced();
  });
  await test('المضيف يعيد تحميل الصفحة فتعود الغرفة بنفس الكود ويكمل الجميع', async () => {
    const before = await view(host);
    await host.reload();
    await host.waitForSelector('[data-screen="game"]:not(.hidden)', { timeout: 20000 });
    eq((await net(host)).code, code); eq((await net(host)).role, 'host');
    eq((await view(host)).turn, before.turn, 'same turn');
    await host.evaluate(() => window.__ui.speed('instant'));
    const hv = await play(300, v => v.turn >= before.turn + 4); ok(hv.turn >= before.turn + 4, 'continues'); await synced();
  });
  await test('المباراة تكتمل حتى الفوز ويرى الجميع النتيجة', async () => {
    const hv = await play(8000);
    eq(hv.phase, 'gameOver');
    for (const g of [g1, g2]) await g.waitForFunction(() => JSON.parse(render_game_to_text()).phase === 'gameOver', null, { timeout: 10000 });
    console.log('     • الأدوار:', hv.turn, '— متوسط زمن الحركة حتى تصل للمضيف:', Math.round(stats.ms / stats.moves), 'ms عبر', stats.moves, 'حركة');
  });
  console.log(errors.length ? '  أخطاء: ' + errors.join(' | ') : '  لا أخطاء في الصفحات');
  if (errors.length) failed++;
  console.log(`\n${passed} ناجح، ${failed} فاشل`);
  await browser.close(); server.close(); await A.close(); await B.close();
  process.exit(failed ? 1 : 0);
})();
