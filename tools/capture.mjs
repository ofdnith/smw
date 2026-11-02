// Captura o buffer lógico (resolução nativa) de várias telas, para comparar antes e depois.
// node tools/capture.mjs <pasta> [escala]
// Cada tela vira <pasta>/<nome>.png ampliada por escala inteira (padrão 3).
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [, , outDir = 'capturas', scaleArg = '3'] = process.argv.filter((a) => a !== '--ui');
const scale = parseInt(scaleArg, 10);
const UI = process.argv.includes('--ui');
const SHOTS = UI ? ['select', 'options', 'extras', 'gallery', 'sound', 'credits', 'casino', 'bonus', 'gameover', 'cutscene', 'pause'].map((n) => [n, `ui=${n}`, n === 'cutscene' ? 200 : 60, '']) : [
  ['titulo', '', 90, ''],
  ['mapa', 'map&node=1-1', 60, ''],
  ['ilha1', 'level=1-1', 40, 'ArrowRight:70'],
  ['ilha2', 'level=2-1', 40, 'ArrowRight:70'],
  ['ilha3', 'level=3-1', 40, 'ArrowRight:70'],
  ['ilha4', 'level=4-1', 40, 'ArrowRight:70'],
  ['ilha5', 'level=5-1', 40, 'ArrowRight:70'],
  ['ilha6', 'level=6-1', 40, 'ArrowRight:70'],
  ['ilha7', 'level=7-1', 40, 'ArrowRight:70'],
  ['constelacoes', 'level=C-1', 40, 'ArrowRight:70'],
];
mkdirSync(outDir, { recursive: true });
const server = await createServer({ server: { port: 5197, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 896 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
for (const [name, query, frames, keys] of SHOTS) {
  await page.goto(`http://localhost:5197/?${query}`);
  await page.waitForTimeout(400);
  for (const k of keys.split(',').filter(Boolean)) {
    const [code, n] = k.split(':');
    await page.keyboard.down(code);
    await page.waitForTimeout((parseInt(n, 10) * 1000) / 60);
    await page.keyboard.up(code);
  }
  await page.waitForTimeout((frames * 1000) / 60);
  const url = await page.evaluate((s) => {
    const b = window.__game.renderer.buffer;
    const c = document.createElement('canvas');
    c.width = b.width * s;
    c.height = b.height * s;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(b, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }, scale);
  writeFileSync(join(outDir, `${name}.png`), Buffer.from(url.split(',')[1], 'base64'));
}
if (errors.length) console.log('erros:', errors);
console.log('ok', SHOTS.length, 'capturas em', outDir);
await browser.close();
await server.close();
