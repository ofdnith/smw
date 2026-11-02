import { chromium } from 'playwright';
import { createServer } from 'vite';
const server = await createServer({ server: { port: 5197, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERR', String(e)));
await page.goto('http://localhost:5197/?level=' + (process.argv[2] || '1-1'));
await page.waitForTimeout(400);
const out = await page.evaluate(() => {
  const g = window.__game; g.loop.stop();
  const log = [];
  for (let i = 0; i < 12; i++) {
    window.__step(30, (f) => 2 | 32 | ((f % 60) < 10 ? 16 : 0));
    const w = g.scenes[g.scenes.length - 1].world;
    log.push([Math.round(w.player.x), Math.round(w.player.y), w.player.body.vx.toFixed(2), w.player.body.onGround, w.player.pose, w.run.lives, w.event, w.player.invuln]);
  }
  return log;
});
console.log(out.map(r => r.join(' ')).join('\n'));
await browser.close(); await server.close();
