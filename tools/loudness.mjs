// Mede o volume (RMS) de cada música tocando no Chromium. Uso: node tools/loudness.mjs [segundos] [faixa,faixa]
import { chromium } from 'playwright';
import { createServer } from 'vite';
const secs = parseFloat(process.argv[2] ?? '6');
const only = process.argv[3] ?? '';
const server = await createServer({ server: { port: 5193, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.goto('http://localhost:5193/?level=1-1');
await page.waitForTimeout(300);
await page.evaluate((o) => { window.__only = o; }, only);
const res = await page.evaluate(async (secs) => {
  const a = window.__audio;
  a.synth.unlock();
  const c = a.synth.ctx;
  const an = c.createAnalyser();
  an.fftSize = 2048;
  a.synth.musicBus.connect(an);
  const buf = new Float32Array(an.fftSize);
  const out = {};
  const only = (window.__only ?? ''); for (const name of Object.keys(a.MUSIC)) { if (only !== '' && !only.split(',').includes(name)) continue;
    if (name === 'bonus') continue;
    a.sequencer.play(a.MUSIC[name]);
    await new Promise((r) => setTimeout(r, 500));
    let sum = 0, n = 0, peak = 0;
    const t0 = performance.now();
    while (performance.now() - t0 < secs * 1000) {
      an.getFloatTimeDomainData(buf);
      for (const v of buf) { sum += v * v; n++; peak = Math.max(peak, Math.abs(v)); }
      await new Promise((r) => setTimeout(r, 40));
    }
    out[name] = { rms: Math.sqrt(sum / n), peak, gain: a.MUSIC[name].gain ?? 1 };
    a.sequencer.stop(0.01);
    await new Promise((r) => setTimeout(r, 150));
  }
  return out;
}, secs);
const rows = Object.entries(res).sort((a, b) => b[1].rms - a[1].rms);
for (const [k, v] of rows) console.log(k.padEnd(12), (20 * Math.log10(v.rms)).toFixed(1).padStart(6) + ' dB', 'pico', v.peak.toFixed(2), 'ganho', v.gain);
console.log('JSON', JSON.stringify(Object.fromEntries(rows.map(([k, v]) => [k, v.rms]))));
await browser.close(); await server.close();
