import { describe, it, expect } from 'vitest';
import { LEVEL_LIST } from '../../src/content/levels';
import { parseLevel } from '../../src/game/level/format';
import { NODES, EDGES, nodeById } from '../../src/content/world';

describe('fases', () => {
  for (const lvl of LEVEL_LIST) {
    it(`${lvl.id} ${lvl.name} faz parse e tem início e fim`, () => {
      const rooms = parseLevel(lvl);
      expect(rooms.length).toBeGreaterThan(0);
      const spawns = rooms.flatMap((r) => r.spawns);
      expect(spawns.some((s) => s.kind === 'start')).toBe(true);
      const hasEnd = spawns.some((s) => s.kind === 'goal' || s.kind === 'boss');
      expect(hasEnd).toBe(true);
      if (lvl.hasSecret) expect(spawns.some((s) => s.kind === 'secretGoal' || s.kind === 'lock')).toBe(true);
      if (lvl.boss) expect(spawns.some((s) => s.kind === 'boss')).toBe(true);
      // pérolas: 3 por fase normal
      const pearls = spawns.filter((s) => s.kind === 'pearl').length + rooms.reduce((n, r) => n + [...r.overrides.values()].filter((v) => v === 'pearl').length, 0);
      if (lvl.kind === 'normal' || lvl.kind === 'desafio') expect(pearls).toBeGreaterThanOrEqual(2);
      // portas pareadas
      for (const r of rooms) for (const [id, list] of r.doors) {
        const total = rooms.reduce((n, rr) => n + (rr.doors.get(id)?.length ?? 0), 0);
        expect(total, `porta ${id} em ${lvl.id}`).toBeGreaterThanOrEqual(2);
        void list;
      }
    });
  }
  it('mapa: todo nó de fase aponta para uma fase existente e todas as arestas referenciam nós', () => {
    const ids = new Set(LEVEL_LIST.map((l) => l.id));
    for (const n of NODES) if (n.level) expect(ids.has(n.level), n.level).toBe(true);
    for (const e of EDGES) { nodeById(e.a); nodeById(e.b); if (e.req) expect(ids.has(e.req)).toBe(true); if (e.secret) expect(ids.has(e.secret)).toBe(true); }
    for (const id of ids) expect(NODES.some((n) => n.level === id), `fase ${id} sem nó`).toBe(true);
  });
});
