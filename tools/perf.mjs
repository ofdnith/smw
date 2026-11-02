import { chromium } from 'playwright';
import { createServer } from 'vite';
const server = await createServer({ server: { port: 5193, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
for (const lv of ['1-1', '4-2', '6-2', '7-1', 'C-3']) {
  await page.goto(`http://localhost:5193/?level=${lv}`);
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const g = window.__game; g.loop.stop();
    g.input.override = () => 2 | 32 | 16;
    const t0 = performance.now();
    for (let i = 0; i < 600; i++) g.update();
    const t1 = performance.now();
    for (let i = 0; i < 120; i++) g.render(0);
    const t2 = performance.now();
    g.input.override = null;
    return { update: ((t1 - t0) / 600).toFixed(3), render: ((t2 - t1) / 120).toFixed(3) };
  });
  console.log(lv, 'update ms/frame', r.update, 'render ms/frame', r.render);
}
await browser.close(); await server.close();
