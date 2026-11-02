/** Tipos de tile e legenda das fases em texto. */

export const TILE = 16;

export enum T {
  Empty = 0,
  Solid, // # chão temático
  Rock, // % pedra escura / interior
  Platform, // = atravessável por baixo
  Crack, // B bloco rachado (quebrável)
  ItemAmber, // ? bloco-baú com âmbar
  ItemPower, // ! bloco-baú com poder
  Hidden, // H bloco invisível
  Used, // bloco-baú já usado
  SlopeUp, // / sobe para a direita (0->16)
  SlopeDown, // \ desce para a direita (16->0)
  GentleUpLo, // { 0->8
  GentleUpHi, // } 8->16
  GentleDownHi, // [ 16->8
  GentleDownLo, // ] 8->0
  Spike, // ^
  Water, // ~
  WaterTop, // W
  Rope, // | escada/corda
  Net, // V rede (escalar em 2 eixos)
  Death, // X neblina letal / lava
  WindUp, // & corrente de vento para cima
  Amber, // $ gota de âmbar estática
  Crumble, // F plataforma que cai
  Ice, // I gelo escorregadio
  Conveyor, // > esteira para a direita
  ConveyorL, // < esteira para a esquerda
  BossMarker, // * marcador
  Bridge, // ~ ponte de corda? usamos '_' plataforma fina
  Pillar, // : decorativo não sólido (fundo)
  Lamp, // ; lâmpada decorativa (luz em fase escura)
  Door1, Door2, Door3, Door4, // 1-4 portas pareadas
}

export const TILE_CHARS: Record<string, T> = {
  '.': T.Empty, ' ': T.Empty, '"': T.Empty,
  '#': T.Solid, '%': T.Rock, '=': T.Platform, B: T.Crack, '?': T.ItemAmber, '!': T.ItemPower, H: T.Hidden,
  '/': T.SlopeUp, '\\': T.SlopeDown, '{': T.GentleUpLo, '}': T.GentleUpHi, '[': T.GentleDownHi, ']': T.GentleDownLo,
  '^': T.Spike, '~': T.Water, W: T.WaterTop, '|': T.Rope, V: T.Net, X: T.Death, '&': T.WindUp, $: T.Amber,
  F: T.Crumble, I: T.Ice, '>': T.Conveyor, '<': T.ConveyorL, '*': T.BossMarker, _: T.Bridge, ':': T.Pillar, ';': T.Lamp,
  '1': T.Door1, '2': T.Door2, '3': T.Door3, '4': T.Door4,
};

export function isSolid(t: T): boolean {
  return t === T.Solid || t === T.Rock || t === T.Crack || t === T.ItemAmber || t === T.ItemPower || t === T.Used || t === T.Ice || t === T.Conveyor || t === T.ConveyorL;
}
export function isSlope(t: T): boolean {
  return t >= T.SlopeUp && t <= T.GentleDownLo;
}
export function isPlatform(t: T): boolean {
  return t === T.Platform || t === T.Crumble || t === T.Bridge;
}
export function isBlock(t: T): boolean {
  return t === T.Crack || t === T.ItemAmber || t === T.ItemPower || t === T.Hidden;
}
export function isWater(t: T): boolean {
  return t === T.Water || t === T.WaterTop;
}
export function isClimb(t: T): boolean {
  return t === T.Rope || t === T.Net;
}
export function isDoor(t: T): boolean {
  return t >= T.Door1 && t <= T.Door4;
}

/** Altura do chão de um tile de rampa em x local (0..16). Retorna altura a partir da base (0 = base, 16 = topo). */
export function slopeHeight(t: T, lx: number): number {
  const x = Math.max(0, Math.min(16, lx));
  switch (t) {
    case T.SlopeUp: return x;
    case T.SlopeDown: return 16 - x;
    case T.GentleUpLo: return x / 2;
    case T.GentleUpHi: return 8 + x / 2;
    case T.GentleDownHi: return 16 - x / 2;
    case T.GentleDownLo: return 8 - x / 2;
    default: return 0;
  }
}
/** Direção da rampa: +1 sobe para a direita, -1 desce. */
export function slopeDir(t: T): number {
  return t === T.SlopeUp || t === T.GentleUpLo || t === T.GentleUpHi ? 1 : -1;
}
