/** Bolota: o besouro montaria. Quando livre, anda devagar; quando foge, corre. */
import type { Renderer } from '../../engine/renderer';
import { approach } from '../../engine/rng';
import { moveBody, groundAhead } from '../physics/tilecollision';
import { Entity } from './base';
import type { World } from '../world';
import { BOLOTA } from '../../content/art/bolota';
import { sign } from './enemies';

export class Bolota extends Entity {
  readonly kind = 'bolota';
  ridden = false;
  fleeing = 0;
  dismountedAt = -100;
  skin: 'normal' | 'pedra' | 'seda' = 'normal';
  idleT = 0;
  constructor(x: number, y: number, skin: 'normal' | 'pedra' | 'seda' = 'normal') {
    super(x - 2, y - 16, 20, 16);
    this.skin = skin;
    this.despawnOffscreen = false;
    this.alwaysActive = true;
    this.facing = 1;
  }
  update(world: World): void {
    const b = this.body;
    if (this.ridden) {
      // segue Lumi (desenhada por ela)
      const p = world.player;
      b.x = p.cx - b.w / 2;
      b.y = p.bottom - b.h;
      return;
    }
    if (this.fleeing > 0) {
      this.fleeing--;
      b.vx = approach(b.vx, this.facing * 2.2, 0.1);
      b.vy = Math.min(4, b.vy + 0.3);
      if (b.onGround && this.fleeing % 24 === 0) b.vy = -2.5;
      moveBody(b, world);
      if (b.hitWall !== 0) this.facing = -b.hitWall;
      if (this.fleeing === 0) b.vx = 0;
      return;
    }
    // livre: anda um pouquinho e para
    this.idleT++;
    if (this.idleT % 180 < 60) {
      b.vx = this.facing * 0.4;
      if (b.onGround && !groundAhead(world, this.facing > 0 ? b.x + b.w + 2 : b.x - 2, b.y + b.h + 2)) {
        this.facing = -this.facing;
        b.vx = 0;
      }
    } else b.vx = approach(b.vx, 0, 0.05);
    if (this.idleT % 180 === 0 && world.rng.chance(0.5)) this.facing = sign(world.player.cx - this.cx) || this.facing;
    b.vy = Math.min(4, b.vy + 0.3);
    moveBody(b, world);
    if (b.hitWall !== 0) this.facing = -b.hitWall;
    if (b.y > world.h * 16 + 32) {
      // caiu: volta perto de Lumi depois de um tempo
      this.dead = true;
    }
  }
  override onTouch(): boolean {
    return false;
  }
  draw(r: Renderer, alpha: number): void {
    if (this.ridden) return;
    const spr = BOLOTA[this.skin];
    const moving = Math.abs(this.body.vx) > 0.1;
    const f = this.fleeing > 0 ? 1 + (Math.floor(this.anim / 3) % 3) : moving ? 1 + (Math.floor(this.anim / 6) % 3) : 0;
    r.drawSprite(spr, f, this.ix(alpha), this.iy(alpha), this.facing < 0);
    if (!moving && this.fleeing === 0 && Math.floor(this.anim / 50) % 5 === 4) {
      r.drawSprite(BOLOTA.blink, 0, this.ix(alpha) + (this.facing < 0 ? 3 : 11), this.iy(alpha) + 5, this.facing < 0);
    }
  }
}
