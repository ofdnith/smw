// Folha de contato de uma fase: várias capturas ao longo do nível, lado a lado.
// node tools/sheet.mjs <level> <out.png> [cols]
import { chromium } from 'playwright';
import { createServer } from 'vite';
const [, , levelId = '1-1', out = 'sheet.png', colsArg = '3'] = process.argv;
const server = await createServer({ server: { port: 5196, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`http://localhost:5196/?level=${levelId}`);
await page.waitForTimeout(300);
const info = await page.evaluate(() => {
  const g = window.__game; g.loop.stop();
  const w = g.scenes[g.scenes.length - 1].world;
  return { rooms: w.rooms.map((r) => [r.w, r.h]) };
});
const shots = [];
for (let ri = 0; ri < info.rooms.length; ri++) {
  const [rw, rh] = info.rooms[ri];
  const n = Math.max(1, Math.ceil((rw * 16) / 320));
  for (let i = 0; i < n; i++) {
    const camX = Math.min(i * 320, rw * 16 - 320);
    for (let j = 0; j < Math.max(1, Math.ceil((rh * 16) / 180)); j++) {
      const camY = Math.min(j * 180, Math.max(0, rh * 16 - 180));
      await page.evaluate(([ri, camX, camY]) => {
        const g = window.__game; const w = g.scenes[g.scenes.length - 1].world;
        if (w.roomIndex !== ri) w.enterRoom(ri, null);
        w.camLockY = camY; w.camMinX = camX; w.camMaxX = camX; w.camX = camX; w.camY = camY;
        w.player.placeAt(camX + 16, camY - 100); w.player.body.noclip = true; w.player.frozen = true;
        w.activateSpawns(true);
        for (let k = 0; k < 30; k++) { w.player.body.vy = 0; w.update(); w.camX = camX; w.camY = camY; }
        g.render(0);
      }, [ri, camX, camY]);
      shots.push(await page.screenshot());
    }
  }
}
await browser.close(); await server.close();
// monta a folha com PIL via python
import { writeFileSync, mkdtempSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';
const dir = mkdtempSync(join(tmpdir(), 'sheet-'));
shots.forEach((b, i) => writeFileSync(join(dir, `${String(i).padStart(3, '0')}.png`), b));
execSync(`python3 -c "
import glob
from PIL import Image
files = sorted(glob.glob('${dir}/*.png'))
cols = ${colsArg}
ims = [Image.open(f) for f in files]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * h), (0, 0, 0))
for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.save('${out}')
"`);
console.log(JSON.stringify({ level: levelId, shots: shots.length, errors }));
