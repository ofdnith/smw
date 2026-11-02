// Gera app-icon.png (1024x1024) a partir do sprite da Lumi, usando o Chromium headless.
import { chromium } from 'playwright';
import { createServer } from 'vite';
const server = await createServer({ server: { port: 5192, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
await page.goto('http://localhost:5192/?art=0');
await page.waitForTimeout(300);
await page.evaluate(() => {
  const g = window.__game; g.loop.stop();
  const r = g.renderer;
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 1024); grad.addColorStop(0, '#5fc3ff'); grad.addColorStop(1, '#1f6fae');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 1024);
  ctx.fillStyle = '#f2dca6'; ctx.fillRect(0, 820, 1024, 204);
  ctx.imageSmoothingEnabled = false;
  const img = window.__lumiFrame();
  ctx.drawImage(img, 0, 0, 16, 24, 256, 160, 512, 768);
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.appendChild(c);
});
await page.screenshot({ path: 'app-icon.png', clip: { x: 0, y: 0, width: 1024, height: 1024 } });
await browser.close(); await server.close();
console.log('app-icon.png gerado');
