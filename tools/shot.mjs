// Tira screenshots do jogo em headless: node tools/shot.mjs "<query>" <frames> <out.png> [keys...]
// keys: sequência de "code:frames" para segurar, ex. "ArrowRight:120,Space:10"
import { chromium } from 'playwright';
import { createServer } from 'vite';

const [, , query = '', framesArg = '60', out = 'shot.png', keysArg = '', teleport = ''] = process.argv;
const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://localhost:5199/?${query}`);
await page.waitForTimeout(300);
if (teleport) {
  const [tx, ty] = teleport.split(':').map(Number);
  await page.evaluate(([tx, ty]) => { const g = window.__game; const w = g.scenes[g.scenes.length - 1].world; w.player.placeAt(tx * 16, ty * 16); w.camX = Math.max(0, tx * 16 - 160); w.activateSpawns(true); }, [tx, ty]);
  await page.waitForTimeout(100);
}
// avança frames deterministicamente controlando o loop
const steps = keysArg ? keysArg.split(',').filter(Boolean).map((k) => { const [code, n] = k.split(':'); return { code, n: parseInt(n, 10) }; }) : [];
for (const st of steps) {
  await page.keyboard.down(st.code);
  await page.waitForTimeout((st.n * 1000) / 60);
  await page.keyboard.up(st.code);
}
await page.waitForTimeout((parseInt(framesArg, 10) * 1000) / 60);
await page.screenshot({ path: out });
const info = await page.evaluate(() => {
  const g = window.__game;
  const top = g.scenes[g.scenes.length - 1];
  const w = top && top.world;
  return w ? { x: w.player.x, y: w.player.y, vx: w.player.body.vx, onGround: w.player.body.onGround, ent: w.entities.length, event: w.event, lives: w.run.lives, amber: w.run.amber, power: w.player.power, pose: w.player.pose, cam: [w.camX, w.camY] } : { scene: top && top.constructor.name };
});
console.log(JSON.stringify(info));
if (errors.length) console.log('ERRORS:', errors.join('\n'));
await browser.close();
await server.close();
