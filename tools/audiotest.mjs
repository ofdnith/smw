import { chromium } from 'playwright';
import { createServer } from 'vite';
const server = await createServer({ server: { port: 5194, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:5194/?level=1-1');
await page.waitForTimeout(300);
const res = await page.evaluate(async () => {
  const a = window.__audio;
  a.synth.unlock();
  const out = { ready: a.synth.ready, state: a.synth.ctx && a.synth.ctx.state, songs: [] };
  for (const name of Object.keys(a.MUSIC)) {
    a.sequencer.play(a.MUSIC[name]);
    await new Promise((r) => setTimeout(r, 400));
    out.songs.push([name, a.sequencer.playing, a.synth.ctx.currentTime.toFixed(2)]);
  }
  for (const k of ['jump', 'stomp', 'amber', 'powerup', 'hurt', 'die', 'goal']) a.sfx(k);
  a.sequencer.stop();
  return out;
});
console.log(JSON.stringify(res));
if (errors.length) console.log('ERRORS', errors.slice(0, 5));
await browser.close(); await server.close();
