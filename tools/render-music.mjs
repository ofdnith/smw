// Renderiza músicas do chip de samples para WAV (OfflineAudioContext no Chromium) e mede o volume.
// Uso: node tools/render-music.mjs [segundos] [faixa,faixa] [pasta-de-saída]
// Sem pasta, só mede (RMS e pico); com pasta, grava <faixa>.wav.
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const secs = parseFloat(process.argv[2] ?? '12');
const only = (process.argv[3] ?? '').split(',').filter(Boolean);
const outDir = process.argv[4];
const server = await createServer({ server: { port: 5194, strictPort: true }, logLevel: 'silent' });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5194/?art');
await page.waitForFunction(() => !!window.__audio);
const names = await page.evaluate(() => Object.keys(window.__audio.MUSIC).filter((n) => n !== 'bonus'));
const rows = [];
for (const name of names) {
  if (only.length && !only.includes(name)) continue;
  const r = await page.evaluate(async ({ name, secs, wav }) => {
    const { synth, sequencer, MUSIC } = window.__audio;
    const SRo = 44100;
    const ctx = new OfflineAudioContext(2, Math.round(SRo * secs), SRo);
    synth.attach(ctx);
    sequencer.stop(0.001);
    sequencer.play(MUSIC[name], 0.001);
    sequencer.scheduleAhead(secs);
    const buf = await ctx.startRendering();
    sequencer.stop(0.001);
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    let sum = 0, peak = 0;
    const skip = Math.round(SRo * 0.5);
    for (let i = skip; i < L.length; i++) { sum += L[i] * L[i] + R[i] * R[i]; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
    const rms = Math.sqrt(sum / (2 * (L.length - skip)));
    let b64 = '';
    if (wav) {
      const n = L.length, data = new DataView(new ArrayBuffer(44 + n * 4));
      const w = (o, s) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); data.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt ');
      data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 2, true);
      data.setUint32(24, SRo, true); data.setUint32(28, SRo * 4, true); data.setUint16(32, 4, true); data.setUint16(34, 16, true);
      w(36, 'data'); data.setUint32(40, n * 4, true);
      for (let i = 0; i < n; i++) {
        data.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true);
        data.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true);
      }
      const bytes = new Uint8Array(data.buffer);
      let s = '';
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      b64 = btoa(s);
    }
    return { rms, peak, gain: MUSIC[name].gain ?? 1, b64 };
  }, { name, secs, wav: !!outDir });
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, `${name}.wav`), Buffer.from(r.b64, 'base64'));
  }
  rows.push([name, r]);
}
rows.sort((a, b) => b[1].rms - a[1].rms);
for (const [k, v] of rows) console.log(k.padEnd(12), (20 * Math.log10(v.rms)).toFixed(1).padStart(6) + ' dB', 'pico', v.peak.toFixed(2), 'ganho', v.gain);
await browser.close();
await server.close();
