/** Cada chefe pode ser derrotado com a mecânica prevista; a derrota termina a fase. */
import { describe, it, expect } from 'vitest';
import { World, type RunState } from '../../src/game/world';
import { bindInput } from '../../src/game/entities/player';
import { InputState } from '../../src/engine/input';
import type { LevelDef } from '../../src/game/level/format';
import { LEVELS } from '../../src/content/levels';
import type { Entity } from '../../src/game/entities/base';

const DEBUG = (globalThis as unknown as { process?: { env: Record<string, string> } }).process?.env.BOSS_DEBUG === '1';
const BIT = { left: 1, right: 2, up: 4, down: 8, jump: 16, run: 32, spin: 64 };

function run(power = 'shell'): RunState {
  return { lives: 5, amber: 0, power, reserve: 'none', hasBolota: false, pearlsThisLevel: 0, pearlsSaved: 0, assist: false };
}

type Vuln = (boss: Entity & Record<string, unknown>) => boolean;

/** Política: foge do chefe quando ele não está vulnerável; pula em cima quando está. */
type Policy = (f: number, p: World['player'], boss: Entity & Record<string, unknown>, w: World) => number;
function fight(lvl: LevelDef, vulnerable: Vuln, opts: { power?: string; spin?: boolean; maxFrames?: number; useOrbs?: boolean; policy?: Policy } = {}): World {
  // entra direto na sala do chefe
  const bossRoom = lvl.rooms.length - 1;
  const roomDef = lvl.rooms[bossRoom];
  const w = new World(lvl, run(opts.power ?? 'shell'), { room: bossRoom, x: 2 * 16 + 2, y: (roomDef.map.length - 2) * 16 });
  const inp = new InputState();
  bindInput(inp);
  const step = (m: number): void => {
    inp.prevHeld = inp.held;
    inp.held = m;
    w.update();
  };
  for (let i = 0; i < 10; i++) step(0);
  const max = opts.maxFrames ?? 9000;
  let orbT = 0;
  for (let f = 0; f < max && w.event === 'none'; f++) {
    const boss = w.entities.find((e) => e.kind.startsWith('boss')) as (Entity & Record<string, unknown>) | undefined;
    if (!boss) {
      step(0);
      continue;
    }
    const p = w.player;
    const bx = boss.cx;
    const d = bx - p.cx;
    let m = 0;
    const vul = vulnerable(boss);
    if (opts.policy) {
      m = opts.policy(f, p, boss, w);
    } else if (opts.useOrbs && p.power === 'lantern') {
      // vira para o chefe e atira
      m |= d > 0 ? BIT.right : BIT.left;
      if (Math.abs(d) < 24) m |= d > 0 ? BIT.left : BIT.right;
      if (orbT++ % 20 === 0) m |= BIT.run;
      if (p.body.onGround && Math.abs(d) < 30) m |= BIT.jump;
    } else if (vul) {
      if (p.body.onGround) {
        if (Math.abs(d) > 40) m |= d > 0 ? BIT.right : BIT.left;
        else m |= BIT.jump | (d > 0 ? BIT.right : BIT.left) | (opts.spin ? BIT.spin : 0);
      } else {
        m |= BIT.jump;
        if (Math.abs(d) > 3) m |= d > 0 ? BIT.right : BIT.left;
        if (p.body.vy > 0 && Math.abs(d) < 12 && boss.cy > p.cy) m |= opts.spin ? BIT.spin : 0;
      }
    } else {
      // mantém distância, pulando projéteis/inimigos próximos; se encurralada, pula por cima rumo ao centro
      const wantLeft = d > 0;
      const cornered = (wantLeft && p.x < 40) || (!wantLeft && p.x > w.w * 16 - 50);
      if (cornered) {
        m |= wantLeft ? BIT.right : BIT.left;
        if (p.body.onGround && Math.abs(d) < 60) m |= BIT.jump;
        if (!p.body.onGround) m |= BIT.jump;
      } else {
        m |= wantLeft ? BIT.left : BIT.right;
        if (p.body.onGround && Math.abs(d) < 34) m |= BIT.jump;
      }
      for (const e of w.entities) if (e !== boss && e.isEnemy && Math.abs(e.cx - p.cx) < 28 && p.body.onGround) m |= BIT.jump;
    }
    // na água: braçadas para subir
    if (p.body.inWater && f % 10 === 0) m |= BIT.jump;
    // no chão, solta o pulo um frame para poder apertar de novo
    if (p.body.onGround && (inp.held & BIT.jump) && (m & BIT.jump)) m &= ~BIT.jump;
    step(m);
    if (DEBUG && (f % 30 === 0 || p.hurtT === 24 || p.deadTimer === 0)) console.log(f, 'L', Math.round(p.x), Math.round(p.y), p.pose, p.power, 'B', Math.round(boss.x), Math.round(boss.y), boss.state, boss.hp, 'vul', vul, 'ents', w.entities.length);
  }
  return w;
}

describe('chefes', () => {
  it('Rei Siri cai ao ser pisado quando preso', () => {
    const w = fight(LEVELS['1-5'], (b) => b.state === 'stuck');
    expect(w.event).toBe('goal');
  });
  it('Mãe-Musgo cai com cambalhotas quando está no chão', () => {
    const w = fight(LEVELS['2-5'], (b) => b.state === 'floor', { spin: true });
    expect(w.event).toBe('goal');
  });
  it('Barão Cata-Vento cai quando as pás param', () => {
    const w = fight(LEVELS['3-5'], (b) => !(b.spinning as boolean), { maxFrames: 14000 });
    expect(w.event).toBe('goal');
  });
  it('Medusa-Maré cai quando apagada', () => {
    const w = fight(LEVELS['4-5'], (b) => !(b.lit as boolean), {
      maxFrames: 16000,
      policy: (f, p, boss, w) => {
        const d = boss.cx - p.cx;
        let m = 0;
        if (!(boss.lit as boolean)) {
          // fica embaixo dela e pula/nada para cima
          if (Math.abs(d) > 6) m |= d > 0 ? BIT.right : BIT.left;
          else if (f % 5 === 0 && ((boss.phaseLeft as number) > 45 || !p.body.onGround)) m |= BIT.jump;
        } else {
          // acesa: afunda até o chão (ela flutua acima) e se afasta
          const dn = p.body.inWater ? BIT.down : 0;
          m |= dn | (d > 0 ? BIT.left : BIT.right);
          if (p.x < 24) m = dn | BIT.right;
          if (p.x > w.w * 16 - 40) m = dn | BIT.left;
        }
        const inks = w.entities.filter((e) => e.kind === 'ink' && e.cy < p.cy && Math.abs(e.cx - p.cx) < 40).sort((a, b) => Math.abs(a.cx - p.cx) - Math.abs(b.cx - p.cx));
        if (inks.length) {
          const avg = inks.reduce((acc, e) => acc + e.cx, 0) / inks.length;
          m = (m & ~(BIT.left | BIT.right | BIT.jump)) | (avg >= p.cx ? BIT.left : BIT.right);
        }
        return m;
      },
    });
    expect(w.event).toBe('goal');
  });
  it('Velha Broca cai quando tonta', () => {
    const w = fight(LEVELS['5-5'], (b) => b.state === 'dizzy', {
      maxFrames: 14000,
      policy: (f, p, boss, w) => {
        const d = boss.cx - p.cx;
        let m = 0;
        if (boss.state === 'dizzy') {
          if (p.body.onGround) m |= Math.abs(d) > 40 ? BIT.run | (d > 0 ? BIT.right : BIT.left) : BIT.jump | (d > 0 ? BIT.right : BIT.left);
          else { m |= BIT.jump; if (Math.abs(d) > 3) m |= d > 0 ? BIT.right : BIT.left; }
        } else if (boss.state === 'dash') {
          // pula por cima quando ela vem
          const bvx = (boss.body as { vx: number }).vx;
          const coming = Math.sign(bvx) === -Math.sign(d) && Math.abs(d) < 64;
          if (p.body.onGround && coming) m |= BIT.jump;
          else if (p.body.onGround) m |= d > 0 ? BIT.left : BIT.right;
          if (!p.body.onGround) m |= BIT.jump | (bvx < 0 ? BIT.right : BIT.left);
        } else if (boss.state === 'warn') {
          // sai de cima do lugar onde ela vai surgir
          m |= p.x < w.w * 8 ? BIT.right : BIT.left;
        } else {
          m |= d > 0 ? BIT.left : BIT.right;
        }
        if (p.body.onGround && (m & BIT.jump) && f % 2 === 0) m &= ~BIT.jump;
        return m;
      },
    });
    expect(w.event).toBe('goal');
  });
  it('Sombra cai ao ser pisada', () => {
    // espera a sombra chegar, pula reto e desce em cima dela
    const w = fight(LEVELS['6-5'], (b) => (b.cool as number) === 0, {
      maxFrames: 14000,
      policy: (f, p, boss) => {
        const d = boss.cx - p.cx;
        let m = 0;
        if ((boss.cool as number) > 0) {
          m |= d > 0 ? BIT.left : BIT.right; // afasta enquanto ela pisca
        } else if (p.body.onGround) {
          if (Math.abs(d) < 26 && f % 2 === 0) m |= BIT.jump;
        } else {
          m |= BIT.jump;
          if (p.body.vy > 0 && Math.abs(d) > 2) m |= d > 0 ? BIT.right : BIT.left;
        }
        return m;
      },
    });
    expect(w.event).toBe('goal');
  });
  it('Capitão Brumo cai com pisões (e orbes)', () => {
    const w = fight(LEVELS['7-3'], (b) => b.state !== 'mist', { maxFrames: 20000, power: 'lantern', useOrbs: true });
    expect(w.event).toBe('goal');
  });
});
