/** Colisões mais justas: correção de quina, ajuda na borda, área de dano menor e espinhos fiéis à arte. */
import { describe, it, expect } from 'vitest';
import { World, type RunState } from '../../src/game/world';
import { bindInput } from '../../src/game/entities/player';
import { InputState } from '../../src/engine/input';
import type { LevelDef } from '../../src/game/level/format';
import { flat, dots, box, put } from '../../src/content/levels/dsl';
import { makeBody, moveBody, CORNER_SLIDE, LEDGE_ASSIST, type TileMap } from '../../src/game/physics/tilecollision';
import { T } from '../../src/game/level/tiles';

const H = 14;
const BIT = { left: 1, right: 2, up: 4, down: 8, jump: 16, run: 32 };
const level = (map: string[]): LevelDef => ({ id: 't', name: 'T', island: 1, theme: 'praia', music: 'praia', rooms: [{ map }] });
const run = (): RunState => ({ lives: 5, amber: 0, power: 'none', reserve: 'none', hasBolota: false, pearlsThisLevel: 0, pearlsSaved: 0, assist: false });
function step(w: World, inp: InputState, mask: number, n = 1): void {
  for (let i = 0; i < n; i++) { inp.prevHeld = inp.held; inp.held = mask; w.update(); }
}
function mapOf(rows: string[]): TileMap {
  const w = rows[0].length, h = rows.length;
  return { w, h, get: (tx, ty) => (rows[ty][tx] === '#' ? T.Solid : T.Empty) };
}

describe('correção de quina', () => {
  // bloco no tile (5, 2): x 80..96, base em y = 48
  const rows = ['................', '................', '.....#..........', '................', '................', '................', '################'];
  it(`cabeça que raspa até ${CORNER_SLIDE}px na quina desliza para o lado e continua subindo`, () => {
    const b = makeBody(96 - 3, 50, 10, 20); // 3px sob o bloco, à direita
    b.cornerCorrect = true;
    b.vy = -4;
    moveBody(b, mapOf(rows));
    expect(b.hitCeiling).toBe(false);
    expect(b.vy).toBe(-4);
    expect(b.x).toBe(96);
  });
  it('raspão grande ainda bate a cabeça', () => {
    const b = makeBody(96 - 8, 52, 10, 20);
    b.cornerCorrect = true;
    b.vy = -6;
    moveBody(b, mapOf(rows));
    expect(b.hitCeiling).toBe(true);
    expect(b.vy).toBe(0);
  });
  it('sem a opção (inimigos), bate como antes', () => {
    const b = makeBody(96 - 3, 52, 10, 20);
    b.vy = -6;
    moveBody(b, mapOf(rows));
    expect(b.hitCeiling).toBe(true);
  });
});

describe('ajuda na borda', () => {
  // degrau: chão alto a partir de x = 80, topo em y = 64
  const rows = ['................', '................', '................', '................', '.....###########', '.....###########', '################'];
  it(`pés até ${LEDGE_ASSIST}px abaixo da borda sobem no degrau`, () => {
    const b = makeBody(80 - 10 - 1, 64 - 20 + 3, 10, 20); // pés 3px abaixo do topo, encostando
    b.ledgeAssist = true;
    b.vx = 2; b.vy = 1;
    moveBody(b, mapOf(rows));
    expect(b.y + b.h).toBe(64);
    expect(b.hitWall).toBe(0);
    expect(b.x).toBeGreaterThan(70);
  });
  it('mais fundo que isso, bate na parede e cai', () => {
    const b = makeBody(80 - 10 - 1, 64 - 20 + 10, 10, 20);
    b.ledgeAssist = true;
    b.vx = 2; b.vy = 1;
    moveBody(b, mapOf(rows));
    expect(b.hitWall).toBe(1);
  });
  it('andando no chão não escala degraus', () => {
    const w = new World(level(dots(put(flat(30, H, 3), 12, H - 4, '#'), [[3, H - 4, 's']])), run());
    const inp = new InputState(); bindInput(inp);
    step(w, inp, 0, 5);
    step(w, inp, BIT.right, 120);
    expect(w.player.body.x + w.player.body.w).toBeLessThanOrEqual(12 * 16 + 0.01);
  });
});

describe('área de dano', () => {
  it('encostar de raspão no caranguejo não machuca; encostar fundo machuca', () => {
    const map = dots(flat(40, H, 3), [[3, H - 4, 's'], [20, H - 4, 'r']]);
    const w = new World(level(map), run());
    const inp = new InputState(); bindInput(inp);
    step(w, inp, 0, 2);
    const crab = w.entities.find((e) => e.kind === 'crab')!;
    const p = w.player;
    // raspão: 1px de sobreposição lateral
    crab.body.vx = 0;
    p.placeAt(crab.body.x - p.body.w + 1, crab.body.y + crab.body.h);
    expect(p.overlaps(crab)).toBe(true);
    expect(p.hurtboxTouches(crab)).toBe(false);
    // fundo: metade do corpo dentro
    p.placeAt(crab.body.x - p.body.w / 2, crab.body.y + crab.body.h);
    expect(p.hurtboxTouches(crab)).toBe(true);
  });
  it('lado de um tile de espinho, sem tocar as pontas, não machuca', () => {
    let map = dots(flat(40, H, 3), [[3, H - 4, 's']]);
    map = box(map, 10, H - 4, 1, 1, '^');
    const w = new World(level(map), run());
    const inp = new InputState(); bindInput(inp);
    step(w, inp, 0, 2);
    // Lumi pulando ao lado, acima das pontas: corpo encosta no tile mas acima da linha das pontas
    w.player.placeAt(10 * 16 - 9, (H - 4) * 16 + 2);
    w.player.body.vy = -1;
    const lives = w.run.lives;
    step(w, inp, 0, 1);
    expect(w.player.invuln).toBe(0);
    expect(w.run.lives).toBe(lives);
  });
});
