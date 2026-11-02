/**
 * Replays de regressão: cada arquivo em tests/replays guarda a entrada de uma partida até o fim de uma fase.
 * Se a física, a colisão, os inimigos ou as fases mudarem, o hash muda e o teste aponta.
 * Mudança intencional? Regere com: npx vite-node tools/make-replays.ts <fase>
 */
import { describe, it, expect } from 'vitest';
import { LEVELS } from '../../src/content/levels';
import { checkReplay, decodeInputs, encodeInputs, type Replay } from '../../src/game/replay';

const modules = import.meta.glob<Replay>('../replays/*.json', { eager: true, import: 'default' });
const replays = Object.keys(modules).sort().map((k) => modules[k]);

describe('replays determinísticos', () => {
  it('codificação de entrada é reversível', () => {
    const masks = [0, 0, 0, 34, 34, 50, 50, 50, 50, 2, 0];
    expect(decodeInputs(encodeInputs(masks))).toEqual(masks);
    expect(encodeInputs(masks)).toBe('0x3,34x2,50x4,2x1,0x1');
  });
  it('há replays suficientes para cobrir o motor', () => {
    expect(replays.length).toBeGreaterThanOrEqual(10);
  });
  for (const r of replays) {
    it(`${r.level}: chega ao mesmo estado (${r.event})`, () => {
      const level = LEVELS[r.level];
      expect(level, `fase ${r.level} não existe mais`).toBeTruthy();
      const res = checkReplay(level, r);
      expect(res.event).toBe(r.event);
      expect(res.hash).toBe(r.hash);
    });
    it(`${r.level}: duas execuções dão o mesmo resultado`, () => {
      const a = checkReplay(LEVELS[r.level], r);
      const b = checkReplay(LEVELS[r.level], r);
      expect(a).toEqual(b);
    });
  }
});
