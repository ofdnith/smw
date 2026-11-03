import { chromium } from 'playwright';
import { createServer } from 'vite';
import { writeFileSync } from 'node:fs';
const S = process.argv[2];
const server = await createServer({ server: { port: 5189, strictPort: true }, logLevel: 'silent' });
await server.listen();
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1024, height: 896 } });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await p.goto('http://localhost:5189/?level=1-1');
await p.waitForTimeout(400);
const res = await p.evaluate(() => {
  const g = window.__game;
  g.loop.stop?.();
  const sc = g.scenes[g.scenes.length - 1];
  const w = sc.world;
  const inp = g.input.state;
  const rows = [];
  const shots = {};
  const r = g.renderer;
  const snap = (name) => {
    sc.draw(r, 1, g);
    const c = document.createElement('canvas'); c.width = 512; c.height = 448;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(r.buffer, 0, 0, 512, 448);
    shots[name] = c.toDataURL();
  };
  const step = (mask, n, tag) => {
    for (let i = 0; i < n; i++) {
      inp.prevHeld = inp.held; inp.held = mask;
      w.update();
      rows.push({ tag, i, sx: Math.round((w.player.cx - w.camX) * 10) / 10, vx: Math.round(w.player.body.vx * 100) / 100, f: w.player.facing, cam: Math.round(w.camX * 10) / 10 });
    }
  };
  step(2 | 32, 90, 'dir');   // corre para a direita
  snap('a-correndo');
  step(1 | 32, 3, 'esq');    // vira
  snap('b-virou3f');
  step(1 | 32, 12, 'esq');
  snap('c-virou15f');
  step(1 | 32, 30, 'esq');
  snap('d-virou45f');
  return { rows: rows.slice(84), shots };
});
for (const r of res.rows) console.log(r.tag, String(r.i).padStart(3), 'sx', String(r.sx).padStart(6), 'vx', String(r.vx).padStart(6), 'f', r.f, 'cam', r.cam);
for (const [n, u] of Object.entries(res.shots)) writeFileSync(`${S}/${n}.png`, Buffer.from(u.split(',')[1], 'base64'));
console.log('erros:', errors.length ? errors : 'nenhum');
await b.close(); await server.close();
