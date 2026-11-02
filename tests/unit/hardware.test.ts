import { describe, it, expect } from 'vitest';
import { collectSprites } from '../../src/tools/fiscal';
import { fitPalette, SPRITE_COLORS, type SpriteDef } from '../../src/engine/sprites';
import { q5, rgb555, mix555 } from '../../src/engine/console';
import { VIEW_W, VIEW_H } from '../../src/engine/renderer';

describe('console virtual', () => {
  it('quadro de 256x224', () => {
    expect([VIEW_W, VIEW_H]).toEqual([256, 224]);
  });
  it('cores em RGB555: 32 níveis por canal', () => {
    const levels = new Set<number>();
    for (let v = 0; v < 256; v++) levels.add(q5(v));
    expect(levels.size).toBe(32);
    expect(rgb555('#ffffff')).toBe('#ffffff');
    expect(rgb555('#000000')).toBe('#000000');
    expect(rgb555('#123456')).toBe(rgb555(rgb555('#123456')));
    expect(mix555('#000000', '#ffffff', 0.5)).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('encaixe de paleta reduz para 15 cores e preserva sprites dentro do limite', () => {
    const pal: Record<string, string> = {};
    const keys = 'abcdefghijklmnopqrstu';
    for (let i = 0; i < keys.length; i++) pal[keys[i]] = '#' + (0x101010 * (i + 1)).toString(16).padStart(6, '0');
    const def: SpriteDef = { palette: pal, frames: [keys] };
    const fit = fitPalette(def);
    expect(new Set(Object.values(fit).map((c) => rgb555(c!))).size).toBe(SPRITE_COLORS);
    const small: SpriteDef = { palette: { a: '#ff0000', b: '#00ff00' }, frames: ['ab'] };
    expect(fitPalette(small)).toBe(small.palette);
  });
});

describe('fiscal de hardware', () => {
  it('todo sprite cabe numa sub-paleta de 15 cores depois do encaixe', () => {
    const sprites = collectSprites();
    expect(sprites.length).toBeGreaterThan(50);
    for (const s of sprites) expect(s.colors, s.name).toBeLessThanOrEqual(SPRITE_COLORS);
  });
});
