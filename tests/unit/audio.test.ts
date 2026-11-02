import { describe, it, expect } from 'vitest';
import { encode, decode, BLOCK, BLOCK_BYTES } from '../../src/engine/audio/adpcm';
import { instrument, INSTRUMENT_NAMES } from '../../src/engine/audio/instruments';
import { MUSIC } from '../../src/content/music';
import { DRUM_KIT } from '../../src/engine/audio/sequencer';
import { VOICES } from '../../src/engine/audio/synth';

describe('codec ADPCM de 4 bits', () => {
  it('9 bytes por bloco de 16 samples', () => {
    const s = new Float32Array(100);
    expect(encode(s).length).toBe(Math.ceil(100 / BLOCK) * BLOCK_BYTES);
  });
  it('seno passa com mais de 40 dB de relação sinal/ruído', () => {
    const s = new Float32Array(4096);
    for (let i = 0; i < s.length; i++) s[i] = 0.8 * Math.sin(i * 0.05);
    const d = decode(encode(s), s.length);
    let e = 0, p = 0;
    for (let i = 0; i < s.length; i++) { e += (d[i] - s[i]) ** 2; p += s[i] ** 2; }
    expect(10 * Math.log10(p / e)).toBeGreaterThan(40);
  });
  it('é determinístico', () => {
    const s = new Float32Array(512).map((_, i) => Math.sin(i * 0.3) * 0.5);
    expect(Array.from(encode(s))).toEqual(Array.from(encode(s)));
  });
});

describe('banco de instrumentos', () => {
  for (const name of INSTRUMENT_NAMES) {
    it(`${name}: sem estouro e com loop sem clique`, () => {
      const inst = instrument(name);
      let peak = 0;
      for (const v of inst.data) peak = Math.max(peak, Math.abs(v));
      expect(peak).toBeGreaterThan(0.3);
      expect(peak).toBeLessThanOrEqual(1);
      if (inst.loopStart !== undefined && inst.loopEnd !== undefined) {
        // o salto do fim do loop para o começo não pode ser maior que um passo típico da própria onda
        const jump = Math.abs(inst.data[inst.loopEnd - 1] - inst.data[inst.loopStart]);
        let maxStep = 0;
        for (let i = inst.loopStart + 1; i < inst.loopEnd; i++) maxStep = Math.max(maxStep, Math.abs(inst.data[i] - inst.data[i - 1]));
        expect(jump).toBeLessThanOrEqual(maxStep * 1.5 + 0.02);
      }
    });
  }
  it('cabe no orçamento de memória de som (512 KB, como um chip de 16 bits com folga)', () => {
    const total = INSTRUMENT_NAMES.reduce((a, n) => a + instrument(n).bytes, 0);
    expect(total).toBeLessThan(512 * 1024);
  });
});

describe('trilha no chip de 8 vozes', () => {
  for (const [name, song] of Object.entries(MUSIC)) {
    it(`${name}: no máximo 8 canais, todos com instrumento do banco`, () => {
      expect(song.channels.length).toBeLessThanOrEqual(VOICES);
      for (const c of song.channels) {
        if (c.drums) continue;
        expect(c.voice.inst, `${name}: canal sem sample`).toBeDefined();
        expect(INSTRUMENT_NAMES).toContain(c.voice.inst);
      }
    });
  }
  it('o kit de bateria só usa samples do banco', () => {
    for (const d of Object.values(DRUM_KIT)) expect(INSTRUMENT_NAMES).toContain(d.inst);
  });
});
