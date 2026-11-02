/**
 * Replays determinísticos: só a entrada quadro a quadro (compactada em corridas) é gravada.
 * Rodar a mesma fase com a mesma semente e a mesma entrada tem que dar o mesmo estado,
 * em qualquer motor JavaScript. O hash do estado final vira teste de regressão da física.
 */
import { World, type RunState } from './world';
import { bindInput } from './entities/player';
import { InputState } from '../engine/input';
import type { LevelDef } from './level/format';

export interface Replay {
  level: string;
  seed: number;
  /** máscaras de entrada em corridas: "mascaraxquadros,..." (ex.: "34x120,50x8") */
  inputs: string;
  /** quadros simulados */
  frames: number;
  /** evento esperado ao final ('goal', 'secret', 'died' ou 'none') */
  event: string;
  /** hash do estado ao final */
  hash: string;
  /** estado inicial da corrida (padrão: arquivo novo) */
  run?: RunState;
}

export function encodeInputs(masks: number[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < masks.length) {
    let j = i;
    while (j < masks.length && masks[j] === masks[i]) j++;
    out.push(`${masks[i]}x${j - i}`);
    i = j;
  }
  return out.join(',');
}

export function decodeInputs(s: string): number[] {
  const out: number[] = [];
  if (!s) return out;
  for (const part of s.split(',')) {
    const [m, n] = part.split('x').map((v) => parseInt(v, 10));
    for (let k = 0; k < n; k++) out.push(m);
  }
  return out;
}

/** Estado inicial padrão de uma corrida de replay (arquivo novo, sem poderes). */
export function replayRun(): RunState {
  return { lives: 5, amber: 0, power: 'none', reserve: 'none', hasBolota: false, pearlsThisLevel: 0, pearlsSaved: 0, assist: false };
}

/** Semente que a cena de fase usa para uma fase (mantém replays iguais ao jogo). */
export function levelSeed(level: LevelDef): number {
  return 1 + level.id.length;
}

const fnv = (s: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
};

/** Hash do estado relevante do mundo. */
export function stateHash(w: World): string {
  const p = w.player;
  const parts: string[] = [
    `t${w.time} r${w.roomIndex} e${w.event}`,
    `p${p.x.toFixed(3)},${p.y.toFixed(3)},${p.body.vx.toFixed(4)},${p.body.vy.toFixed(4)},${p.power},${p.mounted ? 1 : 0},${p.dashMeter}`,
    `a${w.run.amber} l${w.run.lives} pr${w.run.pearlsThisLevel} b${w.bossHp}`,
  ];
  const ents = w.entities.filter((e) => !e.dead).map((e) => `${e.kind}@${e.x.toFixed(1)},${e.y.toFixed(1)}`).sort();
  parts.push(ents.join(';'));
  return fnv(parts.join('|'));
}

/**
 * Roda uma fase com uma sequência de máscaras. Para no fim da entrada ou quando um evento
 * (chegada, segredo, morte) termina de acontecer.
 */
export function simulate(level: LevelDef, masks: number[], seed = levelSeed(level), run: RunState = replayRun()): { world: World; frames: number } {
  const world = new World(level, run, null, seed);
  const inp = new InputState();
  bindInput(inp);
  let f = 0;
  for (; f < masks.length; f++) {
    inp.prevHeld = inp.held;
    inp.held = masks[f];
    world.update();
  }
  return { world, frames: f };
}

/** Confere um replay: devolve o hash e o evento obtidos. */
export function checkReplay(level: LevelDef, r: Replay): { hash: string; event: string } {
  const { world } = simulate(level, decodeInputs(r.inputs), r.seed, r.run ? { ...r.run } : replayRun());
  return { hash: stateHash(world), event: world.event };
}
