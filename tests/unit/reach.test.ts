/**
 * Validador de alcançabilidade: BFS sobre o grid com um modelo simplificado de pulo.
 * Garante que, em toda fase, o fim (ou o chefe), os checkpoints e as pérolas são alcançáveis
 * sem Bolota nem poderes (caminho principal), e que a saída secreta é alcançável.
 */
import { describe, it, expect } from 'vitest';
import { LEVEL_LIST } from '../../src/content/levels';
import { parseLevel, type Room } from '../../src/game/level/format';
import { T, isSolid, isSlope, isPlatform, isWater, isClimb } from '../../src/game/level/tiles';

const JUMP_UP = 3; // tiles para cima (pulo parado ~3.1; correndo ~4.3)
const JUMP_UP_RUN = 4;
const JUMP_DX = 7; // alcance horizontal correndo

interface Pos { room: number; tx: number; ty: number }

function tile(r: Room, tx: number, ty: number): T {
  if (tx < 0 || tx >= r.w) return T.Solid;
  if (ty < 0 || ty >= r.h) return T.Empty;
  return r.tiles[ty * r.w + tx] as T;
}
function blocking(t: T): boolean {
  return isSolid(t) || t === T.Hidden;
}
/** Pode ficar em pé em (tx, ty): célula livre com suporte embaixo. */
function standable(r: Room, tx: number, ty: number): boolean {
  const here = tile(r, tx, ty);
  if (blocking(here) || here === T.Spike || here === T.Death) return false;
  const below = tile(r, tx, ty + 1);
  if (isSlope(here)) return true;
  if (isSolid(below) || isPlatform(below) || isSlope(below) || below === T.Hidden) return true;
  return false;
}
function free(r: Room, tx: number, ty: number): boolean {
  const t = tile(r, tx, ty);
  return !blocking(t) && t !== T.Spike && t !== T.Death;
}
/** Células livres com 2 de altura (Lumi tem 20px) */
function fits(r: Room, tx: number, ty: number): boolean {
  return free(r, tx, ty) && (ty - 1 < 0 || !blocking(tile(r, tx, ty - 1)));
}

function reachable(rooms: Room[], entities: { kind: string; spawns: { room: number; tx: number; ty: number }[] }): Set<string> {
  const start = rooms[0].spawns.find((s) => s.kind === 'start')!;
  const key = (p: Pos): string => `${p.room}:${p.tx}:${p.ty}`;
  const seen = new Set<string>();
  const queue: Pos[] = [{ room: start.room, tx: start.tx, ty: start.ty }];
  seen.add(key(queue[0]));
  // plataformas móveis: tratadas como chão em toda a faixa horizontal/vertical de 6 tiles
  const movers = rooms.flatMap((r, ri) => r.spawns.filter((s) => s.kind === 'platformH' || s.kind === 'platformV' || s.kind === 'fallPlat' || s.kind === 'minecart').map((s) => ({ ...s, room: ri })));
  const moverCells = new Set<string>();
  for (const m of movers) {
    if (m.kind === 'platformH' || m.kind === 'minecart') for (let dx = -6; dx <= 8; dx++) moverCells.add(`${m.room}:${m.tx + dx}:${m.ty}`);
    else if (m.kind === 'platformV') for (let dy = -6; dy <= 6; dy++) for (let dx = 0; dx < 2; dx++) moverCells.add(`${m.room}:${m.tx + dx}:${m.ty + dy}`);
    else for (let dx = 0; dx < 2; dx++) moverCells.add(`${m.room}:${m.tx + dx}:${m.ty}`);
  }
  const springs = new Set(rooms.flatMap((r, ri) => r.spawns.filter((s) => s.kind === 'spring').map((s) => `${ri}:${s.tx}:${s.ty}`)));
  const swings = rooms.flatMap((r, ri) => r.spawns.filter((s) => s.kind === 'swing').map((s) => ({ ...s, room: ri })));
  const stand = (room: number, tx: number, ty: number): boolean => standable(rooms[room], tx, ty) || moverCells.has(`${room}:${tx}:${ty}`);

  const push = (p: Pos): void => {
    const k = key(p);
    if (seen.has(k)) return;
    const r = rooms[p.room];
    if (p.tx < 0 || p.tx >= r.w || p.ty < 0 || p.ty >= r.h) return;
    seen.add(k);
    queue.push(p);
  };

  while (queue.length) {
    const p = queue.shift()!;
    const r = rooms[p.room];
    const inWater = isWater(tile(r, p.tx, p.ty)) || (r.def.tide !== undefined && p.ty >= r.def.tide.base - r.def.tide.amp);
    // andar
    for (const dx of [-1, 1]) {
      const nx = p.tx + dx;
      // mesmo nível
      if (fits(r, nx, p.ty) && stand(p.room, nx, p.ty)) push({ room: p.room, tx: nx, ty: p.ty });
      // rampa: sobe/desce 1
      if (fits(r, nx, p.ty - 1) && stand(p.room, nx, p.ty - 1) && (isSlope(tile(r, nx, p.ty - 1)) || isSlope(tile(r, p.tx, p.ty)))) push({ room: p.room, tx: nx, ty: p.ty - 1 });
      if (fits(r, nx, p.ty + 1) && stand(p.room, nx, p.ty + 1)) push({ room: p.room, tx: nx, ty: p.ty + 1 });
      // cair de uma borda: desce até achar chão (ou água)
      if (fits(r, nx, p.ty) && !stand(p.room, nx, p.ty)) {
        for (let y = p.ty + 1; y < r.h; y++) {
          if (!free(r, nx, y)) break;
          if (isWater(tile(r, nx, y))) { push({ room: p.room, tx: nx, ty: y }); break; }
          if (stand(p.room, nx, y)) { push({ room: p.room, tx: nx, ty: y }); break; }
        }
      }
    }
    // nadar: na água move-se livremente para vizinhos livres (inclusive para cima, saindo 1 acima da superfície)
    if (inWater) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0, -2]]) {
        const nx = p.tx + dx, ny = p.ty + dy;
        if (!fits(r, nx, ny)) continue;
        if (isWater(tile(r, nx, ny)) || stand(p.room, nx, ny) || dy < 0) push({ room: p.room, tx: nx, ty: ny });
      }
    }
    // escalar
    if (isClimb(tile(r, p.tx, p.ty)) || isClimb(tile(r, p.tx, p.ty - 1))) {
      for (const dy of [-1, 1]) {
        const ny = p.ty + dy;
        if (fits(r, p.tx, ny) && (isClimb(tile(r, p.tx, ny)) || stand(p.room, p.tx, ny))) push({ room: p.room, tx: p.tx, ty: ny });
      }
      // sai da escada pelos lados
      for (const dx of [-1, 1]) for (const dy of [-1, 0]) if (fits(r, p.tx + dx, p.ty + dy) && stand(p.room, p.tx + dx, p.ty + dy)) push({ room: p.room, tx: p.tx + dx, ty: p.ty + dy });
    }
    // vento: sobe pela coluna enquanto houver vento (e um pouco acima)
    if (tile(r, p.tx, p.ty) === T.WindUp || tile(r, p.tx, p.ty - 1) === T.WindUp) {
      for (let y = p.ty - 1; y >= 0; y--) {
        if (!free(r, p.tx, y)) break;
        const w = tile(r, p.tx, y) === T.WindUp;
        for (const dx of [-2, -1, 0, 1, 2]) if (fits(r, p.tx + dx, y) && stand(p.room, p.tx + dx, y)) push({ room: p.room, tx: p.tx + dx, ty: y });
        if (fits(r, p.tx, y) && (w || tile(r, p.tx, y + 1) === T.WindUp)) push({ room: p.room, tx: p.tx, ty: y });
        if (!w && tile(r, p.tx, y + 1) !== T.WindUp) break;
      }
    }
    // pulo: só do chão (ou água na superfície)
    const canJump = stand(p.room, p.tx, p.ty) || inWater || tile(r, p.tx, p.ty) === T.WindUp;
    if (canJump) {
      const up = springs.has(key(p)) ? 7 : JUMP_UP_RUN;
      for (let dy = -up; dy <= 0; dy++) {
        // altura máxima menor em pulo parado, mas assumimos corrida quando há espaço
        const maxDx = dy === 0 ? JUMP_DX : Math.max(2, JUMP_DX - Math.abs(dy) + 1);
        for (let dx = -maxDx; dx <= maxDx; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = p.tx + dx, ny = p.ty + dy;
          if (!fits(r, nx, ny)) continue;
          const windTarget = tile(r, nx, ny) === T.WindUp || isClimb(tile(r, nx, ny));
          if (!stand(p.room, nx, ny) && !windTarget) continue;
          // caminho livre aproximado: a coluna de origem até a altura do pulo e a coluna de destino
          let ok = true;
          const apex = Math.min(ny - 1, p.ty - Math.min(JUMP_UP, Math.max(1, Math.ceil(Math.abs(dx) / 2.5))));
          for (let y = p.ty - 1; y >= Math.max(0, apex - 1) && ok; y--) if (blocking(tile(r, p.tx, y))) ok = false;
          for (let y = ny; y >= Math.max(0, apex - 1) && ok; y--) if (blocking(tile(r, nx, y)) && y !== ny) ok = false;
          // linha horizontal no ápice
          const stepX = Math.sign(dx);
          for (let x = p.tx; x !== nx && ok; x += stepX) if (blocking(tile(r, x, Math.max(0, apex)))) ok = false;
          if (ok) push({ room: p.room, tx: nx, ty: ny });
        }
      }
      // pulo para baixo com alcance maior (cair de longe)
      for (let dx = -JUMP_DX - 2; dx <= JUMP_DX + 2; dx++) {
        const nx = p.tx + dx;
        for (let y = p.ty + 1; y < r.h; y++) {
          if (!free(r, nx, y)) break;
          if (stand(p.room, nx, y) || isWater(tile(r, nx, y))) { if (fits(r, nx, y)) push({ room: p.room, tx: nx, ty: y }); break; }
        }
      }
    }
    // cavar: em cima de um bloco rachado, a cambalhota quebra e desce
    if (tile(r, p.tx, p.ty + 1) === T.Crack) {
      const k = `${p.room}:${p.tx}:${p.ty + 1}`;
      if (!seen.has(k)) { seen.add(k); queue.push({ room: p.room, tx: p.tx, ty: p.ty + 1 }); }
    }
    if (tile(r, p.tx, p.ty) === T.Crack) {
      // dentro de um bloco quebrado: continua caindo até chão ou cava o próximo
      for (let y = p.ty + 1; y < r.h; y++) {
        const t = tile(r, p.tx, y);
        if (t === T.Crack) { const k = `${p.room}:${p.tx}:${y}`; if (!seen.has(k)) { seen.add(k); queue.push({ room: p.room, tx: p.tx, ty: y }); } break; }
        if (!free(r, p.tx, y)) break;
        if (stand(p.room, p.tx, y)) { push({ room: p.room, tx: p.tx, ty: y }); break; }
      }
    }
    // cordas de balanço: alcançam até 6 tiles adiante e 4 acima
    for (const sw of swings) {
      if (sw.room !== p.room || Math.abs(sw.tx - p.tx) > 5 || sw.ty < p.ty - 8 || sw.ty > p.ty + 2) continue;
      for (let dx = -7; dx <= 7; dx++) for (let dy = -5; dy <= 6; dy++) {
        const nx = sw.tx + dx, ny = sw.ty + dy;
        if (fits(r, nx, ny) && stand(p.room, nx, ny)) push({ room: p.room, tx: nx, ty: ny });
      }
    }
    // portas
    for (const [id, list] of r.doors) {
      if (!list.some((d) => d.tx === p.tx && d.ty === p.ty)) continue;
      const here = list.filter((d) => d.tx !== p.tx || d.ty !== p.ty);
      for (const d of here) push({ room: p.room, tx: d.tx, ty: d.ty });
      rooms.forEach((rr, ri) => {
        if (ri === p.room) return;
        for (const d of rr.doors.get(id) ?? []) push({ room: ri, tx: d.tx, ty: d.ty });
      });
    }
  }
  void entities;
  return seen;
}

describe('alcançabilidade das fases', () => {
  for (const lvl of LEVEL_LIST) {
    it(`${lvl.id} ${lvl.name}: fim, checkpoints e pérolas alcançáveis`, () => {
      const rooms = parseLevel(lvl);
      const seen = reachable(rooms, { kind: '', spawns: [] });
      const near = (room: number, tx: number, ty: number, radius = 1): boolean => {
        for (let dy = -radius; dy <= radius + 1; dy++) for (let dx = -radius; dx <= radius; dx++) if (seen.has(`${room}:${tx + dx}:${ty + dy}`)) return true;
        return false;
      };
      const misses: string[] = [];
      rooms.forEach((r, ri) => {
        for (const s of r.spawns) {
          if (s.kind === 'goal' || s.kind === 'boss' || s.kind === 'checkpoint' || s.kind === 'lock' || s.kind === 'secretGoal') {
            if (!near(ri, s.tx, s.ty, s.kind === 'goal' ? 2 : 1)) misses.push(`${s.kind}@${ri}:${s.tx},${s.ty}`);
          }
          if (s.kind === 'pearl' || s.kind === 'key') {
            // pérolas podem estar até 4 tiles acima de uma célula alcançável (pulo), 8 com mola
            const spring = r.spawns.some((q) => q.kind === 'spring' && Math.abs(q.tx - s.tx) <= 3 && q.ty > s.ty);
            let ok = false;
            for (let dy = 0; dy <= (spring ? 8 : 4) && !ok; dy++) for (let dx = -2; dx <= 2 && !ok; dx++) if (seen.has(`${ri}:${s.tx + dx}:${s.ty + dy}`)) ok = true;
            if (!ok) misses.push(`${s.kind}@${ri}:${s.tx},${s.ty}`);
          }
        }
        // blocos com pérola
        for (const [idx, v] of r.overrides) {
          if (v !== 'pearl') continue;
          const tx = idx % r.w, ty = Math.floor(idx / r.w);
          let ok = false;
          for (let dy = 1; dy <= 4 && !ok; dy++) for (let dx = -1; dx <= 1 && !ok; dx++) if (seen.has(`${ri}:${tx + dx}:${ty + dy}`)) ok = true;
          if (!ok) misses.push(`pearlblock@${ri}:${tx},${ty}`);
        }
      });
      if (misses.length && (globalThis as unknown as { process?: { env: Record<string, string> } }).process?.env.REACH_DEBUG === lvl.id) {
        rooms.forEach((r, ri) => {
          const lines: string[] = [];
          for (let y = 0; y < r.h; y++) {
            let row = '';
            for (let x = 0; x < r.w; x++) {
              const t = r.tiles[y * r.w + x] as T;
              const sp = r.spawns.find((q) => q.tx === x && q.ty === y);
              row += seen.has(`${ri}:${x}:${y}`) ? 'o' : sp ? sp.kind[0].toUpperCase() : t === T.Empty ? '.' : isSolid(t) ? '#' : isPlatform(t) ? '=' : isSlope(t) ? '/' : isWater(t) ? '~' : t === T.WindUp ? '&' : isClimb(t) ? '|' : '?';
            }
            lines.push(row);
          }
          console.log(`sala ${ri}\n` + lines.join('\n'));
        });
      }
      expect(misses, misses.join(' ')).toEqual([]);
    });
  }
});
