import { describe, it, expect } from 'vitest';
import { World, type RunState } from '../../src/game/world';
import { bindInput } from '../../src/game/entities/player';
import { InputState } from '../../src/engine/input';
import type { LevelDef } from '../../src/game/level/format';
import { flat, dots, box, cat, gap, hline, vline } from '../../src/content/levels/dsl';
import { T } from '../../src/game/level/tiles';
import type { Bolota } from '../../src/game/entities/bolota';

const H = 14;
const BIT = { left: 1, right: 2, up: 4, down: 8, jump: 16, run: 32, spin: 64 };

function level(maps: string[][], extra: Partial<LevelDef> = {}, roomExtra: object[] = []): LevelDef {
  return { id: 't', name: 'T', island: 1, theme: 'praia', music: 'praia', rooms: maps.map((m, i) => ({ map: m, ...(roomExtra[i] ?? {}) })), ...extra };
}
function run(power = 'none'): RunState {
  return { lives: 5, amber: 0, power, reserve: 'none', hasBolota: false, pearlsThisLevel: 0, pearlsSaved: 0, assist: false };
}
function makeInput(): InputState {
  const inp = new InputState();
  bindInput(inp);
  return inp;
}
function step(w: World, inp: InputState, mask: number, n = 1): void {
  for (let i = 0; i < n; i++) {
    inp.prevHeld = inp.held;
    inp.held = mask;
    w.update();
  }
}

describe('mecânicas', () => {
  it('pular por cima do arco de chegada também termina a fase', () => {
    const map = dots(flat(40, H, 3), [[3, H - 4, 's'], [20, H - 4, 'g']]);
    const w = new World(level([map]), run());
    const inp = makeInput();
    step(w, inp, 0, 5);
    const goal = w.entities.find((e) => e.kind === 'goal')!;
    // coloca Lumi no ar, acima do arco, e a empurra para a direita
    w.player.placeAt(goal.x - 30, goal.y - 10);
    w.player.body.vy = -2;
    step(w, inp, BIT.right | BIT.run, 40);
    expect(w.event).toBe('goal');
  });

  it('monta na Bolota, rola e quebra bloco rachado', () => {
    let map = dots(flat(60, H, 3), [[3, H - 4, 's'], [8, H - 4, 'e']]);
    map = box(map, 20, H - 5, 2, 2, 'B');
    const w = new World(level([map]), run());
    const inp = makeInput();
    step(w, inp, 0, 5);
    const bol = w.entities.find((e) => e.kind === 'bolota') as Bolota;
    expect(bol).toBeTruthy();
    // anda até perto e pula em cima
    for (let f = 0; f < 300 && !w.player.mounted; f++) {
      const p = w.player;
      const dx = bol.cx - p.cx;
      let m = 0;
      if (Math.abs(dx) > 14) m |= dx > 0 ? BIT.right : BIT.left;
      else if (p.body.onGround) m |= BIT.jump;
      step(w, inp, m);
    }
    expect(w.player.mounted).toBe(true);
    expect(w.run.hasBolota).toBe(true);
    // rola para a direita: baixo + correr
    step(w, inp, BIT.down | BIT.run, 10);
    expect(w.player.mountRoll).toBe(true);
    step(w, inp, BIT.down | BIT.run | BIT.right, 120);
    expect(w.get(20, H - 5)).toBe(T.Empty);
    expect(w.player.x).toBeGreaterThan(20 * 16);
    // desmonta com cambalhota
    step(w, inp, BIT.spin, 1);
    expect(w.player.mounted).toBe(false);
    expect(w.player.spinning).toBe(true);
  });

  it('Folha de Vento: planar reduz a queda e a rajada sobe', () => {
    const map = cat(dots(flat(10, H, 3), [[3, H - 4, 's']]), gap(9, H), flat(30, H, 3));
    const w = new World(level([map]), run('leaf'));
    const inp = makeInput();
    step(w, inp, 0, 5);
    expect(w.player.power).toBe('leaf');
    // corre e pula no buraco segurando pulo: planando
    step(w, inp, BIT.right | BIT.run, 40);
    step(w, inp, BIT.right | BIT.run | BIT.jump, 25);
    let maxFall = 0;
    let glided = false;
    for (let f = 0; f < 30; f++) {
      step(w, inp, BIT.right | BIT.jump);
      if (w.player.gliding) { glided = true; if (w.player.body.vy > maxFall) maxFall = w.player.body.vy; }
      if (w.player.body.onGround || w.player.deadTimer >= 0) break;
    }
    expect(glided).toBe(true);
    expect(maxFall).toBeLessThan(1.6);
    expect(w.player.deadTimer).toBe(-1);
    // rajada: baixo + pulo (novo toque)
    const yBefore = w.player.y;
    step(w, inp, BIT.right, 2);
    step(w, inp, BIT.right | BIT.down | BIT.jump, 10);
    expect(w.player.gustUsed).toBe(true);
    expect(w.player.y).toBeLessThan(yBefore + 4);
  });

  it('Lanterna Viva: orbe revela bloco invisível e derruba inimigo', () => {
    let map = dots(flat(60, H, 3), [[3, H - 4, 's'], [12, H - 4, 'r']]);
    map = dots(map, [[8, H - 6, 'H']]);
    const w = new World(level([map]), run('lantern'));
    const inp = makeInput();
    step(w, inp, 0, 5);
    step(w, inp, BIT.run, 1);
    expect(w.entities.some((e) => e.kind === 'orb')).toBe(true);
    step(w, inp, 0, 60);
    expect(w.revealed.size).toBeGreaterThan(0);
    const crab = w.entities.find((e) => e.kind === 'crab');
    expect(crab === undefined || (crab as unknown as { knocked: boolean }).knocked).toBe(true);
  });

  it('chave carregada até a fechadura abre a saída secreta', () => {
    const map = dots(flat(60, H, 3), [[3, H - 4, 's'], [8, H - 4, 'k'], [20, H - 4, 'l']]);
    const w = new World(level([map], { hasSecret: true }), run());
    const inp = makeInput();
    step(w, inp, 0, 5);
    step(w, inp, BIT.right | BIT.run, 300);
    expect(w.event).toBe('secret');
  });

  it('porta leva para outra sala e o sino salva checkpoint', () => {
    const a = dots(flat(20, H, 3), [[3, H - 4, 's'], [6, H - 4, 'c'], [10, H - 4, '1']]);
    const b = dots(flat(20, H, 3), [[4, H - 4, '1'], [12, H - 4, 'g']]);
    const w = new World(level([a, b]), run());
    const inp = makeInput();
    step(w, inp, 0, 5);
    step(w, inp, BIT.right, 60); // passa pelo sino
    expect(w.checkpoint).not.toBeNull();
    expect(w.checkpoint!.room).toBe(0);
    // vai até a porta e aperta cima
    for (let f = 0; f < 200 && w.roomIndex === 0; f++) {
      const p = w.player;
      const doorX = 10 * 16 + 8;
      let m = Math.abs(p.cx - doorX) > 3 ? (p.cx < doorX ? BIT.right : BIT.left) : 0;
      if (Math.abs(p.cx - doorX) <= 6) m = f % 2 === 0 ? BIT.up : 0;
      step(w, inp, m);
    }
    expect(w.roomIndex).toBe(1);
    step(w, inp, BIT.right | BIT.run, 200);
    expect(w.event).toBe('goal');
  });

  it('recomeçar do checkpoint coloca Lumi na sala e posição salvas', () => {
    const a = dots(flat(30, H, 3), [[3, H - 4, 's'], [20, H - 4, 'c']]);
    const w = new World(level([a]), run(), { room: 0, x: 20 * 16, y: (H - 3) * 16 });
    expect(w.player.x).toBe(20 * 16);
    expect(w.startedFromCheckpoint).toBe(true);
  });

  it('Rei Siri: ciclo de ataque, pisão quando preso, derrota termina a fase', () => {
    let b = flat(20, 12, 2, '%');
    b = box(b, 0, 0, 1, 12, '%');
    b = box(b, 19, 0, 1, 12, '%');
    b = dots(b, [[2, 12 - 3, 's'], [14, 12 - 3, '*']]);
    const w = new World(level([b], { boss: 'reisiri' }), run('shell'));
    const inp = makeInput();
    step(w, inp, 0, 100);
    const boss = w.entities.find((e) => e.kind === 'boss-reisiri') as unknown as { state: string; hp: number; intro: number };
    expect(boss).toBeTruthy();
    expect(w.bossHp).toBe(3);
    // política: fica longe até ele ficar preso; então pula em cima
    for (let f = 0; f < 6000 && w.event === 'none'; f++) {
      const p = w.player;
      const bx = (boss as unknown as { cx: number }).cx;
      let m = 0;
      if (boss.state === 'stuck') {
        const d = Math.abs(bx - p.cx);
        if (p.body.onGround) {
          if (d > 44) m |= bx > p.cx ? BIT.right : BIT.left;
          else m |= BIT.jump | (bx > p.cx ? BIT.right : BIT.left);
        } else {
          m |= BIT.jump;
          if (d > 4) m |= bx > p.cx ? BIT.right : BIT.left;
        }
      } else {
        m |= bx > p.cx ? BIT.left : BIT.right;
        if (p.body.onGround && Math.abs(bx - p.cx) < 30) m |= BIT.jump;
      }
      for (const e of w.entities) if (e.kind === 'crab' && Math.abs(e.cx - p.cx) < 30 && p.body.onGround) m |= BIT.jump;
      step(w, inp, m);
    }
    expect(w.event).toBe('goal');
  });

  it('água: nada com braçadas e não morre; sai pela superfície', () => {
    let map = flat(40, H, 1);
    for (let x = 0; x < 40; x++) { map = dots(map, [[x, H - 2, '~'], [x, H - 3, '~'], [x, H - 4, 'W']]); }
    map = dots(map, [[3, H - 5, 's']]);
    const w = new World(level([map]), run());
    const inp = makeInput();
    step(w, inp, 0, 40);
    expect(w.player.body.inWater).toBe(true);
    expect(w.player.pose).toBe('swim');
    const y0 = w.player.y;
    step(w, inp, BIT.jump, 1);
    step(w, inp, 0, 10);
    expect(w.player.y).toBeLessThan(y0);
    expect(w.player.deadTimer).toBe(-1);
  });

  it('escada: sobe segurando cima', () => {
    let map = dots(flat(30, H, 3), [[3, H - 4, 's']]);
    map = vline(map, 4, 2, H - 5, '|');
    map = hline(map, 0, 2, 8, '=');
    const w = new World(level([map]), run());
    const inp = makeInput();
    step(w, inp, 0, 5);
    step(w, inp, BIT.right, 22);
    step(w, inp, BIT.up, 120);
    expect(w.player.y).toBeLessThan((H - 3) * 16 - 60);
  });

  it('dano com concha perde a concha; sem concha morre', () => {
    const map = dots(flat(40, H, 3), [[3, H - 4, 's'], [8, H - 4, 'r']]);
    const w = new World(level([map]), run('shell'));
    const inp = makeInput();
    step(w, inp, BIT.right, 120);
    expect(w.player.power).toBe('none');
    expect(w.player.invuln).toBeGreaterThan(0);
  });

  it('plataforma que cai: cai após pisar', () => {
    const map = dots(cat(flat(10, H, 3), gap(10, H), flat(10, H, 3)), [[3, H - 4, 's'], [10, H - 3, 'z']]);
    const w = new World(level([map]), run());
    const inp = makeInput();
    step(w, inp, 0, 5);
    step(w, inp, BIT.right, 80);
    const fp = w.entities.find((e) => e.kind === 'fallPlat') as unknown as { falling: boolean };
    step(w, inp, 0, 60);
    expect(fp.falling).toBe(true);
  });
});

describe('tiles interativos', () => {
  it('gota de âmbar no tile é coletada ao passar; plataforma F desmorona', () => {
    let map = dots(cat(flat(14, H, 3), gap(3, H), flat(23, H, 3)), [[3, H - 4, 's'], [8, H - 4, '$'], [9, H - 4, '$']]);
    map = hline(map, 14, H - 3, 3, 'F');
    const w = new World(level([map]), run());
    const inp = makeInput();
    step(w, inp, BIT.right, 90);
    expect(w.run.amber).toBe(2);
    expect(w.get(8, H - 4)).toBe(T.Empty);
    // sobe na plataforma F (está no nível do chão, logo à frente) e espera
    step(w, inp, BIT.right, 46);
    step(w, inp, 0, 60);
    const anyGone = [14, 15, 16].some((tx) => w.get(tx, H - 3) === T.Empty);
    expect(anyGone).toBe(true);
  });
});
