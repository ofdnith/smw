/** Plataformas móveis, plataformas que caem, molas, canhões, corda de balanço, serra. */
import type { Renderer } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import { tsin, approach } from '../../engine/rng';
import { TILE } from '../level/tiles';
import { solidAt, moveBody } from '../physics/tilecollision';
import { Entity } from './base';
import type { World } from '../world';
import { OBJECTS } from '../../content/art/objects';
import { Crab } from './enemies';

export class MovingPlatform extends Entity {
  readonly kind: string;
  ridden = false;
  dir = 1;
  range = 0;
  origin: number;
  constructor(x: number, y: number, vertical: boolean) {
    super(x, y - 8, 32, 8);
    this.kind = vertical ? 'platformV' : 'platformH';
    this.solidTop = true;
    this.body.noclip = true;
    this.alwaysActive = true;
    this.despawnOffscreen = false;
    this.origin = vertical ? this.body.y : this.body.x;
  }
  update(world: World): void {
    const b = this.body;
    const speed = 0.8;
    const vertical = this.kind === 'platformV';
    const nx = vertical ? b.x : b.x + this.dir * speed;
    const ny = vertical ? b.y + this.dir * speed : b.y;
    // vira ao encostar em sólido ou após 6 tiles
    const probeX = vertical ? nx + b.w / 2 : this.dir > 0 ? nx + b.w + 1 : nx - 1;
    const probeY = vertical ? (this.dir > 0 ? ny + b.h + 1 : ny - 1) : ny + b.h / 2;
    const dist = Math.abs((vertical ? ny : nx) - this.origin);
    if (solidAt(world, probeX, probeY) || dist > TILE * 6) {
      this.dir = -this.dir;
      this.carryDx = 0;
      this.carryDy = 0;
      return;
    }
    this.carryDx = nx - b.x;
    this.carryDy = ny - b.y;
    b.x = nx;
    b.y = ny;
    this.ridden = false;
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(OBJECTS.platform, 0, this.ix(alpha), this.iy(alpha));
  }
}

/** Plataforma que cai quando Lumi pisa. */
export class FallingPlatform extends Entity {
  readonly kind = 'fallPlat';
  ridden = false;
  shake = 0;
  falling = false;
  constructor(x: number, y: number) {
    super(x, y - 8, 32, 8);
    this.solidTop = true;
    this.body.noclip = true;
  }
  update(world: World): void {
    if (this.falling) {
      this.body.vy = Math.min(4, this.body.vy + 0.15);
      this.body.y += this.body.vy;
      this.carryDy = this.body.vy;
      if (this.body.y > world.h * TILE + 32) this.dead = true;
      return;
    }
    if (this.ridden) {
      this.shake++;
      if (this.shake > 24) {
        this.falling = true;
        this.solidTop = true;
      }
    }
    this.ridden = false;
  }
  draw(r: Renderer, alpha: number): void {
    const dx = this.shake > 0 && !this.falling ? (this.anim % 2) * 2 - 1 : 0;
    r.drawSprite(OBJECTS.fallPlatform, 0, this.ix(alpha) + dx, this.iy(alpha));
  }
}

/** Mola de concha: lança Lumi para cima. */
export class Spring extends Entity {
  readonly kind = 'spring';
  squash = 0;
  constructor(x: number, y: number) {
    super(x + 1, y - 10, 14, 10);
    this.body.noclip = true;
  }
  update(world: World): void {
    if (this.squash > 0) this.squash--;
    const p = world.player;
    if (p.body.vy > 0 && p.overlaps(this) && p.prevBottom <= this.y + 6) {
      p.body.y = this.y - p.body.h;
      p.body.vy = p.world && (window as unknown as { __hold?: boolean }).__hold ? -8 : -7.2;
      p.jumping = true;
      p.spinning = false;
      p.body.onGround = false;
      this.squash = 10;
      sfx('bounce');
      world.dust(this.cx, this.y, 4, '#ffd1dc');
    }
    // objetos chutados também quicam
    for (const e of world.entities) {
      if (e !== this && e.projectile && e.body.vy > 0 && e.overlaps(this)) {
        e.body.vy = -6;
        e.body.y = this.y - e.body.h;
      }
    }
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(OBJECTS.spring, this.squash > 0 ? 1 : 0, this.ix(alpha) - 1, this.iy(alpha));
  }
}

/** Canhão de areia: dispara cascos de caranguejo periodicamente. */
export class Cannon extends Entity {
  readonly kind = 'cannon';
  dir: number;
  constructor(x: number, y: number, dir: number) {
    super(x, y - 16, 16, 16);
    this.dir = dir;
    this.body.noclip = true;
    this.despawnOffscreen = false;
    this.facing = dir;
  }
  update(world: World): void {
    if ((this.anim + 90) % 200 === 0 && Math.abs(world.player.cx - this.cx) < 260) {
      const crab = new Crab(this.x + this.dir * 16, this.y + 16 - 2);
      crab.inShell = true;
      crab.kickShell(world, this.dir);
      crab.body.y = this.y + 2;
      world.add(crab);
      sfx('cannon');
      world.dust(this.cx + this.dir * 10, this.cy, 5, '#d9c9a8');
      world.shake = 4;
    }
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(OBJECTS.cannon, (this.anim + 90) % 200 < 10 ? 1 : 0, this.ix(alpha), this.iy(alpha), this.dir < 0);
  }
}

/** Corda de balanço: Lumi agarra e pula com impulso. */
export class Swing extends Entity {
  readonly kind = 'swing';
  anchorX: number;
  anchorY: number;
  length = 56;
  angle = 0.9;
  angVel = 0;
  cooldown = 0;
  constructor(x: number, y: number) {
    super(x, y - TILE, 16, 16);
    this.anchorX = x + 8;
    this.anchorY = y - TILE + 2;
    this.body.noclip = true;
    this.alwaysActive = true;
    this.despawnOffscreen = false;
  }
  update(world: World): void {
    if (this.cooldown > 0) this.cooldown--;
    // pêndulo simples (determinístico)
    const g = 0.0045;
    this.angVel += -g * Math.sin(this.angle);
    this.angVel *= 0.999;
    this.angle += this.angVel;
    // mantém balanço vivo
    if (Math.abs(this.angVel) < 0.02 && Math.abs(this.angle) < 0.15) this.angVel += this.angle >= 0 ? 0.004 : -0.004;
    const ex = this.anchorX + Math.sin(this.angle) * this.length;
    const ey = this.anchorY + Math.cos(this.angle) * this.length;
    this.body.x = ex - 6;
    this.body.y = ey - 10;
    this.body.w = 12;
    this.body.h = 14;
    const p = world.player;
    if (!p.swingRope && this.cooldown === 0 && !p.body.onGround && !p.mounted && p.overlaps(this) && p.deadTimer < 0) {
      p.swingRope = this;
      p.body.vx = 0;
      p.body.vy = 0;
      p.flying = 0;
      p.gliding = false;
      this.angVel += p.body.vx * 0.004;
      sfx('mapstep');
    }
  }
  detach(): void {
    this.cooldown = 20;
  }
  draw(r: Renderer, alpha: number): void {
    const c = r.ctx;
    c.strokeStyle = '#c9a66b';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(Math.round(this.anchorX - r.camX) + 0.5, Math.round(this.anchorY - r.camY) + 0.5);
    c.lineTo(Math.round(this.ix(alpha) + 6 - r.camX) + 0.5, Math.round(this.iy(alpha) + 4 - r.camY) + 0.5);
    c.stroke();
    r.fillRect(this.anchorX - 3, this.anchorY - 3, 6, 6, '#7a5a3a', true);
    r.drawSprite(OBJECTS.knot, 0, this.ix(alpha) + 2, this.iy(alpha) + 2);
  }
}

/** Serra de madeira (forte): gira e anda no trilho até bater. */
export class Sawblade extends Entity {
  readonly kind = 'sawblade';
  dir = 1;
  constructor(x: number, y: number) {
    super(x + 1, y - 14, 14, 14);
    this.isEnemy = true;
    this.stompable = false;
    this.spinKillable = false;
    this.body.noclip = true;
    this.despawnOffscreen = false;
    this.alwaysActive = true;
  }
  update(world: World): void {
    const b = this.body;
    b.x += this.dir * 1.0;
    if (solidAt(world, this.dir > 0 ? b.x + b.w + 1 : b.x - 1, this.cy)) this.dir = -this.dir;
    if (!solidAt(world, this.cx, b.y + b.h + 2)) this.dir = -this.dir;
  }
  override onHit(): void {}
  override onStomp(_w: World, spin: boolean): boolean {
    return spin;
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(OBJECTS.saw, Math.floor(this.anim / 3) % 2, this.ix(alpha) - 1, this.iy(alpha) - 1);
  }
}

/** Vagonete de minas: Lumi em cima anda nos trilhos (plataforma que se move com ela). */
export class Minecart extends Entity {
  readonly kind = 'minecart';
  ridden = false;
  moving = false;
  constructor(x: number, y: number) {
    super(x, y - 10, 24, 10);
    this.solidTop = true;
    this.alwaysActive = true;
    this.despawnOffscreen = false;
    this.facing = 1;
  }
  update(world: World): void {
    const b = this.body;
    if (this.ridden) this.moving = true;
    if (this.moving) {
      b.vx = approach(b.vx, this.facing * 2.4, 0.08);
      if (this.anim % 20 === 0) sfx('minecart');
    } else b.vx = approach(b.vx, 0, 0.1);
    b.vy = Math.min(4, b.vy + 0.3);
    const ox = b.x, oy = b.y;
    moveBody(b, world);
    if (b.hitWall !== 0) {
      this.facing = -b.hitWall;
      b.vx = 0;
    }
    this.carryDx = b.x - ox;
    this.carryDy = b.y - oy;
    this.ridden = false;
    if (b.y > world.h * TILE + 32) this.dead = true;
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(OBJECTS.minecart, Math.floor(this.anim / 4) % 2, this.ix(alpha), this.iy(alpha) - 6);
  }
}

export { tsin };
