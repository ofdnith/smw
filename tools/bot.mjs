// Bot de teste: joga uma fase com heurística simples e relata se chegou ao fim.
// node tools/bot.mjs 1-1 [maxFrames] [shotPrefix]
import { chromium } from 'playwright';
import { createServer } from 'vite';

const [, , levelId = '1-1', maxArg = '9000', shotPrefix = ''] = process.argv;
const server = await createServer({ server: { port: 5198, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://localhost:5198/?level=${levelId}`);
await page.waitForTimeout(400);

const result = await page.evaluate(async ([maxFrames, prefix]) => {
  const g = window.__game;
  g.loop.stop();
  g.slot.lives = 99; g.scenes[g.scenes.length - 1].run.lives = 99;
  let lastEvent = 'none';
  const BIT = { left: 1, right: 2, up: 4, down: 8, jump: 16, run: 32, spin: 64 };
  let frames = 0, deaths = 0, maxX = 0, stuck = 0, lastX = 0, result = 'timeout', jumpHold = 0, dir = 1, backT = 0, spinT = 0;
  let rngS = 7;
  const rnd = () => { rngS = (rngS * 1103515245 + 12345) & 0x7fffffff; return rngS / 0x7fffffff; };
  const solidAhead = (w, p, dx, dy) => {
    const tx = Math.floor((p.x + (dx > 0 ? p.w + dx : dx)) / 16), ty = Math.floor((p.y + dy) / 16);
    if (tx < 0 || tx >= w.w || ty < 0 || ty >= w.h) return tx < 0 || tx >= w.w;
    const t = w.get(tx, ty);
    return [1, 2, 4, 5, 6, 8, 23, 24, 25].includes(t) || (t >= 9 && t <= 14);
  };
  const groundAhead = (w, p, dx) => {
    const x = p.x + (dx > 0 ? p.w + dx : dx);
    for (let k = 1; k <= 6; k++) {
      const tx = Math.floor(x / 16), ty = Math.floor((p.y + p.h + k * 16 - 2) / 16);
      if (ty >= w.h) return false;
      if (tx < 0 || tx >= w.w) return true;
      const t = w.get(tx, ty);
      if (t !== 0 && t !== 15 && t !== 16 && t !== 17 && t !== 20 && t !== 22 && t !== 21 && t !== 27 && t !== 30 && t !== 31) return true;
    }
    return false;
  };
  const policy = () => {
    const top = g.scenes[g.scenes.length - 1];
    const w = top && top.world;
    if (!w) return 0;
    const p = w.player;
    let m = BIT.run;
    if (backT > 0) { backT--; m |= dir > 0 ? BIT.left : BIT.right; if (backT === 0) jumpHold = 14; return m; }
    m |= dir > 0 ? BIT.right : BIT.left;
    const wall = solidAhead(w, p, dir * 6, p.h - 4) || solidAhead(w, p, dir * 6, 4) || solidAhead(w, p, dir * 20, p.h - 4);
    const gapA = !groundAhead(w, p, dir * 4) || !groundAhead(w, p, dir * 14);
    let enemy = false;
    for (const e of w.entities) {
      if (e.isEnemy && !e.dead && Math.abs(e.cx - p.cx) < 52 && Math.sign(e.cx - p.cx) === dir && Math.abs(e.cy - p.cy) < 28) enemy = true;
      if (e.kind === 'ink' && Math.abs(e.cx - p.cx) < 24) enemy = true;
    }
    if (p.body.onGround && jumpHold === 0 && (wall || gapA || enemy || rnd() < 0.02)) jumpHold = wall ? 20 : enemy ? 16 : 18;
    if (!p.body.onGround && p.body.vy < 0 && jumpHold > 0) m |= BIT.jump;
    if (!p.body.onGround && p.body.inWater && rnd() < 0.2) m |= BIT.jump;
    if (p.climbing) m |= BIT.up;
    for (const e of w.entities) if (e.kind.startsWith('door') && e.overlaps(p) && p.body.onGround) m |= BIT.up;
    if (jumpHold > 0) { m |= BIT.jump; jumpHold--; }
    if (spinT > 0) { m |= BIT.spin; spinT--; }
    // escada/rede: sobe
    return m;
  };
  const shots = [];
  const trail = [];
  while (frames < maxFrames) {
    const top = g.scenes[g.scenes.length - 1];
    const w = top && top.world;
    if (!w) { g.update(); frames++; continue; }
    const p = w.player;
    if (w.event === 'goal' || w.event === 'secret') { result = w.event; break; }
    if (w.event === 'died' && lastEvent !== 'died') deaths++;
    lastEvent = w.event;
    if (w.run.lives < 0) { result = 'gameover'; break; }
    g.input.override = policy;
    g.update();
    g.input.override = null;
    frames++;
    if (p.x > maxX) maxX = p.x;
    if (Math.abs(p.x - lastX) < 1) stuck++; else stuck = 0;
    lastX = p.x;
    if (stuck > 120) { backT = 25 + Math.floor(rnd() * 40); stuck = 0; if (rnd() < 0.3) spinT = 10; }
    if (frames % 1200 === 0) trail.push([Math.round(p.x), Math.round(p.y), p.pose, w.run.lives]);
    if (w.event === 'died') { while (g.scenes[g.scenes.length - 1].world === w) { g.update(); frames++; if (frames > maxFrames) break; } }
    if (prefix && frames % 600 === 0) { g.render(0); shots.push(frames); }
  }
  const top = g.scenes[g.scenes.length - 1];
  const w = top && top.world;
  return { result, frames, deaths, maxX: Math.round(maxX), levelW: w ? w.w * 16 : 0, amber: w ? w.run.amber : 0, pearls: w ? w.run.pearlsThisLevel : 0, lives: w ? w.run.lives : 0, trail };
}, [parseInt(maxArg, 10), shotPrefix]);
if (shotPrefix) await page.screenshot({ path: `${shotPrefix}.png` });
console.log(JSON.stringify({ level: levelId, ...result }));
if (errors.length) console.log('ERRORS:', errors.slice(0, 5).join('\n'));
await browser.close();
await server.close();
