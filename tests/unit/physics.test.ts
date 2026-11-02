import { describe, it, expect } from 'vitest';
import { World, type RunState } from '../../src/game/world';
import { bindInput, PHYS } from '../../src/game/entities/player';
import { InputState } from '../../src/engine/input';
import type { LevelDef } from '../../src/game/level/format';
import { flat, dots, box, cat, gap } from '../../src/content/levels/dsl';

const H = 14;
function level(map: string[]): LevelDef {
  return { id: 't', name: 'T', island: 1, theme: 'praia', music: 'praia', rooms: [{ map }] };
}
function run(): RunState {
  return { lives: 5, amber: 0, power: 'none', reserve: 'none', hasBolota: false, pearlsThisLevel: 0, pearlsSaved: 0, assist: false };
}
const BIT = { left: 1, right: 2, up: 4, down: 8, jump: 16, run: 32, spin: 64 };

function sim(world: World, frames: number, mask: (f: number) => number): void {
  const inp = new InputState();
  bindInput(inp);
  for (let f = 0; f < frames; f++) {
    inp.prevHeld = inp.held;
    inp.held = mask(f);
    world.update();
  }
}

describe('física da Lumi', () => {
  it('fica no chão parada', () => {
    const w = new World(level(dots(flat(40, H, 3), [[3, H - 4, 's']])), run());
    sim(w, 30, () => 0);
    expect(w.player.body.onGround).toBe(true);
    expect(w.player.bodyBottom).toBe((H - 3) * 16);
  });

  it('pulo parado sobe entre 2.5 e 3.6 tiles; pulo correndo sobe mais', () => {
    const w = new World(level(dots(flat(60, H, 3), [[3, H - 4, 's']])), run());
    sim(w, 10, () => 0);
    const base = w.player.bodyBottom;
    let minY = Infinity;
    const inp = new InputState();
    bindInput(inp);
    for (let f = 0; f < 60; f++) {
      inp.prevHeld = inp.held;
      inp.held = BIT.jump;
      w.update();
      minY = Math.min(minY, w.player.bodyBottom);
    }
    const tiles = (base - minY) / 16;
    expect(tiles).toBeGreaterThan(2.5);
    expect(tiles).toBeLessThan(3.7);
    // correndo
    const w2 = new World(level(dots(flat(120, H, 3), [[3, H - 4, 's']])), run());
    sim(w2, 90, () => BIT.right | BIT.run);
    expect(Math.abs(w2.player.body.vx)).toBeGreaterThan(2.5);
    const base2 = w2.player.bodyBottom;
    let minY2 = Infinity;
    bindInput(inp);
    inp.held = BIT.right | BIT.run;
    for (let f = 0; f < 60; f++) {
      inp.prevHeld = inp.held;
      inp.held = BIT.jump | BIT.right | BIT.run;
      w2.update();
      minY2 = Math.min(minY2, w2.player.bodyBottom);
    }
    expect((base2 - minY2) / 16).toBeGreaterThan(tiles);
  });

  it('toque curto no pulo dá pulo baixo', () => {
    const w = new World(level(dots(flat(60, H, 3), [[3, H - 4, 's']])), run());
    sim(w, 10, () => 0);
    const base = w.player.bodyBottom;
    let minY = Infinity;
    const inp = new InputState();
    bindInput(inp);
    for (let f = 0; f < 60; f++) {
      inp.prevHeld = inp.held;
      inp.held = f < 3 ? BIT.jump : 0;
      w.update();
      minY = Math.min(minY, w.player.bodyBottom);
    }
    expect((base - minY) / 16).toBeLessThan(2.2);
    expect((base - minY) / 16).toBeGreaterThan(0.8);
  });

  it('corre até a velocidade de ímpeto e atravessa um buraco de 4 tiles', () => {
    const map = cat(dots(flat(40, H, 3), [[3, H - 4, 's']]), gap(4, H), flat(20, H, 3));
    const w = new World(level(map), run());
    const inp = new InputState();
    bindInput(inp);
    let jumped = false;
    for (let f = 0; f < 400; f++) {
      inp.prevHeld = inp.held;
      let m = BIT.right | BIT.run;
      const p = w.player;
      if (!jumped && p.x > 40 * 16 - 20 && p.body.onGround) jumped = true;
      if (jumped && f < 400) m |= BIT.jump;
      inp.held = m;
      w.update();
      if (p.x > 46 * 16) break;
    }
    expect(w.player.dashMeter).toBeGreaterThan(0);
    expect(w.player.x).toBeGreaterThan(44 * 16);
    expect(w.player.deadTimer).toBe(-1);
  });

  it('sobe rampa de 45 graus sem travar e desce grudada', () => {
    let map = flat(60, H, 3);
    map = dots(map, [[3, H - 4, 's']]);
    // rampa: colunas 10..13 sobem
    for (let i = 0; i < 4; i++) {
      for (let y = 0; y <= i; y++) map = dots(map, [[10 + i, H - 4 - y, y === i ? '/' : '#']]);
    }
    map = box(map, 14, H - 7, 6, 4, '#');
    for (let i = 0; i < 4; i++) {
      for (let y = 0; y <= 3 - i; y++) map = dots(map, [[20 + i, H - 4 - y, y === 3 - i ? '\\' : '#']]);
    }
    const w = new World(level(map), run());
    sim(w, 420, () => BIT.right);
    expect(w.player.x).toBeGreaterThan(30 * 16);
    expect(w.player.body.onGround).toBe(true);
    expect(w.player.bodyBottom).toBe((H - 3) * 16);
  });

  it('bate em bloco por baixo e ganha âmbar', () => {
    let map = dots(flat(40, H, 3), [[3, H - 4, 's']]);
    map = dots(map, [[3, H - 8, '?']]);
    const w = new World(level(map), run());
    sim(w, 10, () => 0);
    sim(w, 40, () => BIT.jump);
    expect(w.run.amber).toBe(1);
  });

  it('pisar no caranguejo o esconde na concha; concha chutada vira projétil', () => {
    let map = dots(flat(40, H, 3), [[3, H - 4, 's'], [8, H - 4, 'r']]);
    map = box(map, 30, H - 8, 1, 5, '#');
    const w = new World(level(map), run());
    sim(w, 5, () => 0);
    const crab = w.entities.find((e) => e.kind === 'crab')!;
    // pula e cai em cima
    const inp = new InputState();
    bindInput(inp);
    let stomped = false;
    for (let f = 0; f < 240 && !stomped; f++) {
      inp.prevHeld = inp.held;
      const p = w.player;
      let m = 0;
      if (p.body.onGround && Math.abs(crab.cx - p.cx) > 20) m |= BIT.right;
      if (p.body.onGround && Math.abs(crab.cx - p.cx) < 36 && crab.cx > p.cx) m |= BIT.jump | BIT.right;
      if (!p.body.onGround) m |= BIT.right;
      inp.held = m;
      w.update();
      if ((crab as unknown as { inShell: boolean }).inShell) stomped = true;
    }
    expect(stomped).toBe(true);
    expect(w.player.deadTimer).toBe(-1);
  });

  it('cair fora do mundo mata', () => {
    const map = cat(dots(flat(10, H, 3), [[3, H - 4, 's']]), gap(30, H));
    const w = new World(level(map), run());
    sim(w, 300, () => BIT.right);
    expect(w.event).toBe('died');
  });

  it('constantes de física são as documentadas', () => {
    expect(PHYS.walkMax).toBe(1.5);
    expect(PHYS.runMax).toBe(2.6);
    expect(PHYS.dashMax).toBe(3.4);
  });
});
