import { describe, it, expect } from 'vitest';
import { dealCards } from '../../src/game/scenes/casino';

describe('cassino de conchas', () => {
  it('distribui 6 pares de prêmios', () => {
    for (const seed of [1, 42, 9999, 123456]) {
      const cards = dealCards(seed);
      expect(cards).toHaveLength(12);
      const count = new Map<string, number>();
      for (const c of cards) count.set(c, (count.get(c) ?? 0) + 1);
      expect([...count.values()].every((n) => n === 2)).toBe(true);
      expect(count.size).toBe(6);
    }
  });
  it('é determinístico pela semente', () => {
    expect(dealCards(7)).toEqual(dealCards(7));
    expect(dealCards(7)).not.toEqual(dealCards(8));
  });
});
