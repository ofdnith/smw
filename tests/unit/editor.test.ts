import { describe, it, expect } from 'vitest';
import { blankDraft, draftToLevel, draftProblems, PALETTE, pieceName } from '../../src/tools/editor';
import { parseLevel, ENTITY_CHARS } from '../../src/game/level/format';
import { TILE_CHARS } from '../../src/game/level/tiles';

describe('editor de fases', () => {
  it('fase em branco é jogável', () => {
    const d = blankDraft();
    expect(draftProblems(d)).toEqual([]);
    const rooms = parseLevel(draftToLevel(d));
    expect(rooms[0].spawns.some((s) => s.kind === 'start')).toBe(true);
    expect(rooms[0].spawns.some((s) => s.kind === 'goal')).toBe(true);
  });
  it('testar do cursor move o início para lá', () => {
    const d = blankDraft(40, 14);
    const lvl = draftToLevel(d, { tx: 20, ty: 5 });
    const start = parseLevel(lvl)[0].spawns.filter((s) => s.kind === 'start');
    expect(start).toHaveLength(1);
    expect([start[0].tx, start[0].ty]).toEqual([20, 5]);
  });
  it('aponta o que falta', () => {
    const d = blankDraft(30, 14);
    d.rows = d.rows.map((r) => r.replace(/[sg]/g, '.'));
    expect(draftProblems(d).join(' ')).toMatch(/INICIO/);
    expect(draftProblems(d).join(' ')).toMatch(/CHEGADA/);
  });
  it('toda peça da paleta é um caractere válido do formato de fase', () => {
    for (const cat of PALETTE) {
      expect(cat.chars.length).toBeLessThanOrEqual(14);
      for (const ch of cat.chars) {
        const ok = ch in TILE_CHARS || ch in ENTITY_CHARS || '+0857'.includes(ch);
        expect(ok, `peça '${ch}' (${pieceName(ch)})`).toBe(true);
      }
    }
  });
});
