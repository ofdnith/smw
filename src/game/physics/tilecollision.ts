/** Colisão AABB contra o tilemap, com rampas, plataformas atravessáveis e teto. */
import { T, TILE, isSolid, isSlope, isPlatform, slopeHeight, isWater, isClimb } from '../level/tiles';

const EPS = 0.01;

export interface TileMap {
  w: number;
  h: number;
  get(tx: number, ty: number): T;
}

export interface Body {
  x: number; // topo-esquerdo
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
  onSlope: number; // 0 = não; -1/+1 direção da rampa
  hitWall: number; // -1 esquerda, +1 direita, 0 nada
  hitCeiling: boolean;
  /** tile de teto atingido (para bater em blocos) */
  ceilTx: number;
  ceilTy: number;
  /** tile de chão sob os pés (centro) */
  groundTx: number;
  groundTy: number;
  groundType: T;
  /** quer descer de plataforma atravessável neste frame */
  dropThrough: boolean;
  inWater: boolean;
  /** ignora colisão com tiles (ex.: morrendo) */
  noclip: boolean;
  /** correção de quina: cabeça que raspa a quina de um bloco é empurrada para o lado (jogador) */
  cornerCorrect?: boolean;
  /** ajuda na borda: caindo rente a um degrau, sobe nele se os pés estão só um pouco abaixo (jogador) */
  ledgeAssist?: boolean;
}

/** Até quantos pixels de sobreposição a cabeça desliza para o lado em vez de bater. */
export const CORNER_SLIDE = 4;
/** Até quantos pixels abaixo da borda os pés ainda sobem no degrau. */
export const LEDGE_ASSIST = 5;

/** A caixa encosta em algum tile sólido? */
function boxHitsSolid(map: TileMap, x: number, y: number, w: number, h: number): boolean {
  const tx0 = Math.floor(x / TILE), tx1 = Math.floor((x + w - EPS) / TILE);
  const ty0 = Math.floor(y / TILE), ty1 = Math.floor((y + h - EPS) / TILE);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (isSolid(tileAt(map, tx, ty))) return true;
  return false;
}

export function makeBody(x: number, y: number, w: number, h: number): Body {
  return {
    x, y, w, h, vx: 0, vy: 0, onGround: false, onSlope: 0, hitWall: 0, hitCeiling: false,
    ceilTx: -1, ceilTy: -1, groundTx: -1, groundTy: -1, groundType: T.Empty, dropThrough: false, inWater: false, noclip: false,
  };
}

function tileAt(map: TileMap, tx: number, ty: number): T {
  if (tx < 0 || tx >= map.w) return T.Solid; // paredes laterais do mundo
  if (ty < 0) return T.Empty;
  if (ty >= map.h) return T.Empty;
  return map.get(tx, ty);
}

/** Altura do piso (em px, coordenada y) de uma rampa no tile (tx,ty) para o x do mundo wx. */
function slopeFloorY(t: T, tx: number, ty: number, wx: number): number {
  const lx = wx - tx * TILE;
  return (ty + 1) * TILE - slopeHeight(t, lx);
}

/**
 * Move o corpo aplicando vx e vy com colisão. Atualiza flags.
 * Corpos maiores que um tile são tratados testando todos os tiles sobrepostos.
 */
export function moveBody(b: Body, map: TileMap): void {
  b.hitWall = 0;
  b.hitCeiling = false;
  const wasOnGround = b.onGround;
  b.onGround = false;
  const prevSlope = b.onSlope;
  b.onSlope = 0;
  b.groundType = T.Empty;

  if (b.noclip) {
    b.x += b.vx;
    b.y += b.vy;
    return;
  }

  // ---------- eixo X ----------
  b.x += b.vx;
  {
    const feetX = b.x + b.w / 2;
    const feetY = b.y + b.h - EPS;
    const slopeRow = Math.floor(feetY / TILE);
    const feetTile = tileAt(map, Math.floor(feetX / TILE), slopeRow);
    const belowTile = tileAt(map, Math.floor(feetX / TILE), slopeRow + 1);
    const slopeImmune = isSlope(feetTile) || isSlope(belowTile) || (prevSlope !== 0 && wasOnGround);
    const ty0 = Math.floor(b.y / TILE);
    const ty1 = Math.floor((b.y + b.h - EPS) / TILE);
    const dir = b.vx > 0 ? 1 : b.vx < 0 ? -1 : 0;
    if (dir !== 0) {
      const tx = dir > 0 ? Math.floor((b.x + b.w - EPS) / TILE) : Math.floor(b.x / TILE);
      const blocked: number[] = [];
      for (let ty = ty0; ty <= ty1; ty++) {
        const t = tileAt(map, tx, ty);
        if (isSolid(t) && !(slopeImmune && ty >= slopeRow)) blocked.push(ty);
      }
      if (blocked.length) {
        // ajuda na borda: só a linha dos pés bate, os pés estão pouco abaixo do topo e há espaço em cima
        const feetRow = blocked.length === 1 && blocked[0] === ty1 ? ty1 : -1;
        const intrusion = b.y + b.h - feetRow * TILE;
        if (b.ledgeAssist && feetRow >= 0 && !wasOnGround && b.vy >= -0.5 && intrusion > 0 && intrusion <= LEDGE_ASSIST
          && !boxHitsSolid(map, b.x, feetRow * TILE - b.h, b.w, b.h)) {
          b.y = feetRow * TILE - b.h;
          b.vy = 0;
        } else {
          b.x = dir > 0 ? tx * TILE - b.w : (tx + 1) * TILE;
          b.vx = 0;
          b.hitWall = dir;
        }
      }
    }
  }

  // ---------- eixo Y ----------
  const prevBottom = b.y + b.h;
  b.y += b.vy;
  const bottom = b.y + b.h;
  const feetX = b.x + b.w / 2;
  const ftx = Math.floor(feetX / TILE);

  // rampas: tile do pé e o imediatamente abaixo
  let onSlopeNow = false;
  if (b.vy >= 0) {
    const fty = Math.floor((bottom - EPS) / TILE);
    for (const ty of [fty - 1, fty, fty + 1]) {
      const t = tileAt(map, ftx, ty);
      if (!isSlope(t)) continue;
      const floorY = slopeFloorY(t, ftx, ty, feetX);
      // gruda na rampa se estava no chão (desce sem "voar"), ou se atravessou o piso
      const stick = wasOnGround ? Math.abs(b.vx) + 4 : 0;
      if (bottom >= floorY - stick && bottom <= floorY + TILE) {
        if (bottom >= floorY - stick) {
          b.y = floorY - b.h;
          b.vy = 0;
          b.onGround = true;
          b.onSlope = t === T.SlopeUp || t === T.GentleUpLo || t === T.GentleUpHi ? 1 : -1;
          b.groundTx = ftx;
          b.groundTy = ty;
          b.groundType = t;
          onSlopeNow = true;
        }
        break;
      }
    }
  }

  const tx0 = Math.floor(b.x / TILE);
  const tx1 = Math.floor((b.x + b.w - EPS) / TILE);
  if (!onSlopeNow && b.vy > 0) {
    const ty = Math.floor((b.y + b.h - EPS) / TILE);
    let best = -1;
    let bestType = T.Empty;
    let bestTx = -1;
    for (let tx = tx0; tx <= tx1; tx++) {
      const t = tileAt(map, tx, ty);
      const top = ty * TILE;
      if (isSolid(t)) {
        // não pousa em sólido que está na linha de uma rampa que o pé ocupa (evita degrau)
        const ft = tileAt(map, ftx, ty);
        if (isSlope(ft)) continue;
        best = top; bestType = t; bestTx = tx;
        break;
      }
      if (isPlatform(t) && !b.dropThrough && prevBottom <= top + 1) {
        // só se o centro dos pés não estiver dentro de uma rampa
        best = top; bestType = t; bestTx = tx;
        break;
      }
    }
    if (best >= 0) {
      b.y = best - b.h;
      b.vy = 0;
      b.onGround = true;
      b.groundTx = bestTx;
      b.groundTy = ty;
      b.groundType = bestType;
    }
  } else if (b.vy < 0) {
    const ty = Math.floor(b.y / TILE);
    // correção de quina: um único tile raspando a borda da cabeça empurra o corpo para o lado
    if (b.cornerCorrect) {
      const hits: number[] = [];
      for (let tx = tx0; tx <= tx1; tx++) if (isSolid(tileAt(map, tx, ty))) hits.push(tx);
      if (hits.length === 1) {
        const tx = hits[0];
        const ov = Math.min(b.x + b.w, (tx + 1) * TILE) - Math.max(b.x, tx * TILE);
        const shift = tx * TILE + TILE / 2 < b.x + b.w / 2 ? (tx + 1) * TILE - b.x : tx * TILE - (b.x + b.w);
        if (ov > 0 && ov <= CORNER_SLIDE && !boxHitsSolid(map, b.x + shift, b.y, b.w, b.h)) {
          b.x += shift;
          return finishY(b, map);
        }
      }
    }
    // escolhe o tile mais sobreposto horizontalmente para bater (sensação de precisão)
    let bestTx = -1;
    let bestOverlap = 0;
    for (let tx = tx0; tx <= tx1; tx++) {
      const t = tileAt(map, tx, ty);
      if (isSolid(t) || t === T.Hidden) {
        const ov = Math.min(b.x + b.w, (tx + 1) * TILE) - Math.max(b.x, tx * TILE);
        if (ov > bestOverlap) {
          bestOverlap = ov;
          bestTx = tx;
        }
      }
    }
    if (bestTx >= 0) {
      const t = tileAt(map, bestTx, ty);
      if (t !== T.Hidden || bestOverlap >= 4) {
        b.y = (ty + 1) * TILE;
        b.vy = 0;
        b.hitCeiling = true;
        b.ceilTx = bestTx;
        b.ceilTy = ty;
      }
    }
  }

  finishY(b, map);
}

/** Fim do passo: chão quando parado em cima de sólido, e água pelo centro do corpo. */
function finishY(b: Body, map: TileMap): void {
  const tx0 = Math.floor(b.x / TILE);
  const tx1 = Math.floor((b.x + b.w - EPS) / TILE);
  if (!b.onGround && b.vy === 0) {
    const ty = Math.floor((b.y + b.h) / TILE);
    if ((b.y + b.h) % TILE === 0) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const t = tileAt(map, tx, ty);
        if (isSolid(t) || (isPlatform(t) && !b.dropThrough)) {
          b.onGround = true;
          b.groundTx = tx;
          b.groundTy = ty;
          b.groundType = t;
          break;
        }
      }
    }
  }
  const ct = tileAt(map, Math.floor((b.x + b.w / 2) / TILE), Math.floor((b.y + b.h / 2) / TILE));
  b.inWater = isWater(ct);
  b.dropThrough = false;
}

/** Tile sólido em um ponto do mundo? */
export function solidAt(map: TileMap, wx: number, wy: number): boolean {
  const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
  const t = tileAt(map, tx, ty);
  if (isSolid(t)) return true;
  if (isSlope(t)) return wy >= slopeFloorY(t, tx, ty, wx);
  return false;
}

export function tileTypeAt(map: TileMap, wx: number, wy: number): T {
  return tileAt(map, Math.floor(wx / TILE), Math.floor(wy / TILE));
}

export function climbableAt(map: TileMap, wx: number, wy: number): T {
  const t = tileAt(map, Math.floor(wx / TILE), Math.floor(wy / TILE));
  return isClimb(t) ? t : T.Empty;
}

/** Há chão (sólido/plataforma/rampa) logo abaixo do ponto? Usado por inimigos que não caem de bordas. */
export function groundAhead(map: TileMap, wx: number, wy: number): boolean {
  const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
  const t = tileAt(map, tx, ty);
  return isSolid(t) || isPlatform(t) || isSlope(t);
}

export function aabb(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
