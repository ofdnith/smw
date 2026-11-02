import { describe, it, expect } from 'vitest';
import { MUSIC } from '../../src/content/music';
import { parsePattern } from '../../src/engine/audio/sequencer';
import { SFX } from '../../src/engine/audio/sfx';

describe('trilha sonora', () => {
  for (const [name, song] of Object.entries(MUSIC)) {
    it(`${name}: todos os canais fazem parse e têm comprimento múltiplo de 16`, () => {
      expect(song.channels.length).toBeGreaterThan(0);
      for (const ch of song.channels) {
        const p = parsePattern(ch.pattern, ch.drums, ch.transpose ?? 0);
        expect(p.length % 16, `${name} canal com ${p.length} passos`).toBe(0);
        expect(p.events.length).toBeGreaterThan(0);
        for (const ev of p.events) if (!ev.drum) expect(ev.midi).toBeGreaterThan(20);
      }
      const lens = new Set(song.channels.map((ch) => parsePattern(ch.pattern, ch.drums).length));
      // canais podem ter comprimentos diferentes, mas o maior deve ser múltiplo dos menores
      const max = Math.max(...lens);
      for (const l of lens) expect(max % l, `${name}: ${l} não divide ${max}`).toBe(0);
    });
  }
  it('efeitos sonoros existem', () => {
    for (const k of ['jump', 'stomp', 'amber', 'pearl', 'powerup', 'hurt', 'die', 'goal', 'bosshit', 'bossdie']) expect(SFX[k]).toBeTypeOf('function');
  });
});
