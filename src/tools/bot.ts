/**
 * Bot heurístico que joga sobre o World (sem navegador). Usado para gerar replays de regressão.
 * Corre para a direita, pula paredes, buracos e inimigos; quando empaca, recua e tenta de novo.
 */
import type { World } from '../game/world';
import { T, TILE, isSolid, isSlope, isPlatform, isWater, isClimb } from '../game/level/tiles';
import { Rng } from '../engine/rng';

const B = { left: 1, right: 2, up: 4, down: 8, jump: 16, run: 32, spin: 64 };

export class Bot {
  private rng: Rng;
  private jumpHold = 0;
  private backT = 0;
  private spinT = 0;
  private stuck = 0;
  private lastX = 0;
  private dir = 1;
  private jumpProb: number;

  constructor(seed: number) {
    this.rng = new Rng(seed);
    this.jumpProb = 0.005 + this.rng.next() * 0.03;
  }

  private tile(w: World, px: number, py: number): T {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || tx >= w.w) return T.Solid;
    if (ty < 0 || ty >= w.h) return T.Empty;
    return w.get(tx, ty);
  }

  private solidAt(w: World, px: number, py: number): boolean {
    const t = this.tile(w, px, py);
    return isSolid(t) || t === T.Spike;
  }

  private groundBelow(w: World, px: number, py: number): boolean {
    for (let k = 0; k < 7; k++) {
      const t = this.tile(w, px, py + k * TILE);
      if (t === T.Death || t === T.Spike) return false;
      if (isSolid(t) || isPlatform(t) || isSlope(t) || isWater(t) || isClimb(t)) return true;
      if (py + k * TILE >= w.h * TILE) return false;
    }
    return false;
  }

  /** Máscara de entrada para este quadro. */
  next(w: World): number {
    const p = w.player;
    const b = p.body;
    let m = B.run;
    if (Math.abs(p.x - this.lastX) < 0.5) this.stuck++;
    else this.stuck = 0;
    this.lastX = p.x;
    if (this.stuck > 90) {
      this.backT = 18 + this.rng.int(0, 30);
      this.stuck = 0;
      if (this.rng.chance(0.35)) this.spinT = 12;
    }
    if (this.backT > 0) {
      this.backT--;
      m |= this.dir > 0 ? B.left : B.right;
      if (this.backT === 0) this.jumpHold = 22;
      return m;
    }
    m |= this.dir > 0 ? B.right : B.left;
    const front = this.dir > 0 ? p.x + p.w + 4 : p.x - 4;
    const wall = this.solidAt(w, front, p.y + p.h - 4) || this.solidAt(w, front + this.dir * 12, p.y + p.h - 4) || this.solidAt(w, front, p.y + 2);
    const gapAhead = !this.groundBelow(w, front + this.dir * 4, p.y + p.h + 2) || !this.groundBelow(w, front + this.dir * 18, p.y + p.h + 2);
    let enemy = false;
    for (const e of w.entities) {
      if (e.dead) continue;
      const dx = e.cx - p.cx, dy = e.cy - p.cy;
      if (e.isEnemy && Math.sign(dx) === this.dir && Math.abs(dx) < 56 && Math.abs(dy) < 30) enemy = true;
      if (e.kind === 'ink' && Math.abs(dx) < 28 && Math.abs(dy) < 40) enemy = true;
    }
    if (b.onGround && this.jumpHold === 0 && (wall || gapAhead || enemy || this.rng.chance(this.jumpProb))) {
      this.jumpHold = wall ? 22 : gapAhead ? 20 : 16;
    }
    if (b.inWater && this.rng.chance(0.18)) m |= B.jump;
    if (p.climbing) m |= B.up;
    if (isClimb(this.tile(w, p.cx, p.y + 2)) && this.rng.chance(0.5)) m |= B.up;
    for (const e of w.entities) if (e.kind.startsWith('door') && e.overlaps(p) && b.onGround) m |= B.up;
    if (this.jumpHold > 0) { m |= B.jump; this.jumpHold--; if (b.onGround && this.jumpHold < 10) this.jumpHold = 0; }
    if (this.spinT > 0) { m |= B.spin; this.spinT--; }
    return m;
  }
}
