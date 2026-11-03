/* اختبار اللعب أونلاين (مضيف + ضيف) عبر نقل BroadcastChannel التجريبي: node tests/online.test.js */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn) { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { failed++; console.log('  ✗', name, '\n     ', e.message.split('\n')[0]); } }
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m || ''} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`); };

(async () => {
  const server = http.createServer((q, r) => { const f = path.join(ROOT, 'index.html'); r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); fs.createReadStream(f).pipe(r); }).listen(0);
  const URL = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const errors = [];
  const open = async q => { const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); await p.goto(URL + q); return p; };
  const net = p => p.evaluate(() => window.__net.state());
  const view = p => p.evaluate(() => JSON.parse(render_game_to_text()));

  console.log('\n— أونلاين');
  const host = await open('?transport=bc');
  await host.click('[data-mode="online"]');
  await host.fill('[data-player-config="0"] input', 'المضيف');
  await host.click('[data-action="create-room"]');
  await host.waitForSelector('[data-room-code]');
  const code = await host.getAttribute('[data-room-code]', 'data-room-code');
  let guest, guest2;

  await test('إنشاء غرفة بكود من 5 خانات', async () => { ok(/^[A-Z0-9]{5}$/.test(code), code); eq((await net(host)).role, 'host'); });
  await test('الضيف ينضم عبر رابط الغرفة', async () => {
    guest = await open(`?room=${code}&transport=bc`);
    eq(await guest.inputValue('[data-join-code]'), code);
    await guest.fill('[data-player-config="0"] input', 'الضيف');
    await guest.click('[data-action="join-room"]');
    await host.waitForFunction(() => window.__net.state().seats === 2);
    await guest.waitForFunction(() => window.__net.state().seats === 2);
    eq((await net(guest)).role, 'guest');
    ok(await guest.isVisible('#guest-wait'), 'guest waits');
    ok(!(await guest.isVisible('#start-btn')), 'no start for guest');
    ok(await host.locator('[data-player-config="1"] input').inputValue() === 'الضيف', 'host sees guest name');
  });
  await test('ضيف ثانٍ ينضم بالكود، والمضيف يضيف كمبيوتر ويفعّل الفرق', async () => {
    guest2 = await open('?transport=bc');
    await guest2.click('[data-mode="online"]');
    await guest2.fill('[data-join-code]', code.toLowerCase());
    await guest2.click('[data-action="join-room"]');
    await host.waitForFunction(() => window.__net.state().seats === 3);
    await host.click('[data-action="add-bot"]');
    await host.click('[data-map="lucky"]');
    await host.click('[data-rule="teams"]');
    await guest.waitForFunction(() => window.__net.state().seats === 4);
    ok(await guest.locator('.map-card.on[data-map="lucky"]').count() === 1, 'guest sees map');
    eq(await guest.locator('.team-chip').count(), 4, 'team chips');
  });
  await test('بدء اللعبة يظهر عند الجميع بنفس الحالة', async () => {
    await host.evaluate(() => window.__ui.speed('fast'));
    await host.click('#start-btn');
    await guest.waitForSelector('[data-screen="game"]:not(.hidden)');
    await guest2.waitForSelector('[data-screen="game"]:not(.hidden)');
    const hv = await view(host), gv = await view(guest);
    eq(gv.players.map(p => p.name), hv.players.map(p => p.name));
    eq(gv.players.length, 4); eq(await guest.locator('.cell').count(), 40);
    eq((await net(guest)).mySeat, 1); eq((await net(guest2)).mySeat, 2);
  });
  await test('الضيف لا يستطيع اللعب في غير دوره، ويلعب في دوره', async () => {
    await host.evaluate(() => window.__ui.speed('instant'));
    const r = await guest.evaluate(() => performMove({ type: 'roll' }));
    eq(r.success, false, 'not my turn');
    eq(await guest.locator('#actions [data-action="roll"]').count(), 0, 'no roll button for guest');
    // المضيف (المقعد 0) يلعب دوره بالنقر
    await host.click('#actions [data-action="roll"]');
    await host.waitForFunction(() => window.__ui.isIdle());
  });
  await test('مباراة كاملة: كل جهاز يلعب مقعده حتى الفوز', async () => {
    const pages = [host, guest, guest2];
    let steps = 0, last = '', lastTurn = 0, lastProgress = Date.now();
    const deadline = Date.now() + 15 * 60000;
    while (Date.now() < deadline) {
      steps++;
      const hv = await view(host);
      if (hv.phase === 'gameOver') break;
      if (hv.turn > lastTurn) { lastTurn = hv.turn; lastProgress = Date.now(); }
      if (Date.now() - lastProgress > 60000) throw new Error(`stuck at turn ${hv.turn} phase ${hv.turnPhase} actor ${hv.actor}`);
      const a = hv.actor;
      const seatPage = a === 0 ? host : a === 1 ? guest : a === 2 ? guest2 : null;
      if (seatPage) {
        const idle = await seatPage.evaluate(() => window.__ui.isIdle() && !window.__ui.netBusy() && !document.querySelector('[data-action="card-ok"]'));
        const sig = JSON.stringify([hv.turn, hv.turnPhase, a, hv.players.map(p => p.cash)]);
        if (!idle) { const ck = seatPage.locator('[data-action="card-ok"]'); if (await ck.count()) await ck.click(); await seatPage.waitForTimeout(20); continue; }
        await seatPage.evaluate(() => { const S = window.__ui.state(); const m = window.MonoEngine.aiMove(S); return performMove(m); });
        await host.waitForFunction(s => JSON.stringify([JSON.parse(render_game_to_text()).turn, JSON.parse(render_game_to_text()).turnPhase, JSON.parse(render_game_to_text()).actor, JSON.parse(render_game_to_text()).players.map(p => p.cash)]) !== s || JSON.parse(render_game_to_text()).phase === 'gameOver', sig, { timeout: 8000 }).catch(() => {});
        last = sig;
      } else await host.waitForTimeout(30);
    }
    const hv = await view(host);
    eq(hv.phase, 'gameOver', 'finished');
    await guest.waitForFunction(() => JSON.parse(render_game_to_text()).phase === 'gameOver', null, { timeout: 8000 });
    const gv = await view(guest);
    eq(gv.players.map(p => p.cash), hv.players.map(p => p.cash), 'synced');
    console.log('     • steps', steps, 'turns', hv.turn);
  });
  await test('المضيف يعود للغرفة بعد النهاية والضيوف معه، ثم انقطاع ضيف يجعله كمبيوتر', async () => {
    await host.click('[data-modal="gameover"] [data-action="new-game"]');
    await guest.waitForSelector('[data-screen="lobby"]:not(.hidden)');
    eq((await net(guest)).role, 'guest');
    await host.click('#start-btn');
    await guest.waitForSelector('[data-screen="game"]:not(.hidden)');
    await guest2.close();
    await host.waitForFunction(() => JSON.parse(render_game_to_text()).players[2].isAI === true, null, { timeout: 5000 });
  });
  console.log(errors.length ? '  أخطاء: ' + errors.join(' | ') : '  لا أخطاء في الصفحات');
  if (errors.length) failed++;
  console.log(`\n${passed} ناجح، ${failed} فاشل`);
  await browser.close(); server.close();
  process.exit(failed ? 1 : 0);
})();
