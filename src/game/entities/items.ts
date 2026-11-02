/** Itens, colecionáveis, checkpoint, portal de fim de fase e NPCs. */
import type { Renderer } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import { approach, tsin } from '../../engine/rng';
import { T, TILE } from '../level/tiles';
import { moveBody } from '../physics/tilecollision';
import { Entity } from './base';
import type { World } from '../world';
import { ITEMS, GOAL_ARCH, GHOST, SIGN, BELL } from '../../content/art/items';
import { Player, type Power } from './player';

export class PowerUp extends Entity {
  readonly kind = 'powerup';
  rise = 0;
  fromReserve = false;
  constructor(x: number, y: number, public item: string, fromBlock: boolean) {
    super(x + 2, y + (fromBlock ? TILE : 0), 12, 14);
    this.rise = fromBlock ? 16 : 0;
    this.facing = 1;
    this.despawnOffscreen = true;
  }
  update(world: World): void {
    const b = this.body;
    if (this.rise > 0) {
      this.rise -= 0.5;
      b.y -= 0.5;
      return;
    }
    if (this.item === 'shell' || this.item === 'feather' && false) {
      b.vx = this.facing * 1.0;
      b.vy = Math.min(4, b.vy + 0.25);
      moveBody(b, world);
      if (b.hitWall !== 0) this.facing = -b.hitWall;
    } else if (this.item === 'leaf') {
      // folha cai em zigue-zague
      b.vy = Math.min(0.7, b.vy + 0.05);
      b.vx = tsin(this.anim / 90) * 1.2;
      moveBody(b, world);
      if (b.onGround) b.vx = 0;
    } else if (this.item === 'feather') {
      b.vy = Math.min(0.5, b.vy + 0.03);
      b.vx = tsin(this.anim / 70) * 0.9;
      moveBody(b, world);
    } else if (this.fromReserve) {
      b.vy = Math.min(1.2, b.vy + 0.1);
      moveBody(b, world);
    } else {
      b.vy = Math.min(4, b.vy + 0.25);
      moveBody(b, world);
    }
  }
  override onTouch(world: World): boolean {
    if (this.rise > 8) return false;
    const p = world.player;
    this.dead = true;
    world.consumeSpawn(this);
    if (this.item === 'pearl') {
      world.collectPearl(this.spawn);
      world.sparkle(this.cx, this.cy, '#ffffff', 10, 2);
      world.popup(this.cx, this.y - 8, 'PEROLA!', '#dff6ff');
      return false;
    }
    if (this.item === 'feather') {
      world.run.lives = Math.min(99, world.run.lives + 1);
      sfx('oneup');
      world.popup(this.cx, this.y - 8, '1 VIDA!', '#9cf29c');
      return false;
    }
    const pw = this.item as Power;
    if (p.power === 'none') {
      p.power = pw === 'shell' ? 'shell' : pw;
      world.run.power = p.power;
    } else if (p.power === 'shell' && pw !== 'shell') {
      p.power = pw;
      world.run.power = pw;
    } else {
      // já tem poder igual ou melhor: vai para a reserva
      if (world.run.reserve === 'none') world.run.reserve = pw;
      else if (world.run.reserve === 'shell' && pw !== 'shell') world.run.reserve = pw;
      else if (pw !== 'shell' && world.run.reserve !== pw) world.run.reserve = pw;
    }
    sfx('powerup');
    world.sparkle(p.cx, p.cy, '#fff7b0', 8, 1.5);
    world.freezeTimer = 10;
    return false;
  }
  draw(r: Renderer, alpha: number): void {
    const spr = ITEMS[this.item];
    if (!spr) return;
    const f = this.item === 'pearl' ? Math.floor(this.anim / 10) % spr.frames.length : this.item === 'leaf' ? (this.body.vx > 0 ? 0 : 1) % spr.frames.length : Math.floor(this.anim / 12) % spr.frames.length;
    r.drawSprite(spr, f, this.ix(alpha) - 2, this.iy(alpha) - 2 + (this.item === 'pearl' ? tsin(this.anim / 60) * 2 : 0));
  }
}

/** Gota de âmbar saltando de um bloco. */
export class AmberDrop extends Entity {
  readonly kind = 'amberdrop';
  constructor(x: number, y: number) {
    super(x, y, 8, 8);
    this.body.vy = -3.6;
    this.body.noclip = true;
  }
  update(world: World): void {
    this.body.vy += 0.25;
    this.body.y += this.body.vy;
    if (this.anim > 28) {
      this.dead = true;
      world.sparkle(this.cx, this.cy, '#ffd27a', 4, 0.8);
    }
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(ITEMS.amber, Math.floor(this.anim / 4) % 4, this.ix(alpha), this.iy(alpha));
  }
}

/** Orbe de luz da Lanterna Viva. */
export class LightOrb extends Entity {
  readonly kind = 'orb';
  bounces = 0;
  constructor(x: number, y: number, vx: number, vy: number) {
    super(x - 4, y - 4, 8, 8);
    this.body.vx = vx;
    this.body.vy = vy;
    this.projectile = true;
    this.hurts = false;
  }
  update(world: World): void {
    const b = this.body;
    b.vy = Math.min(4, b.vy + 0.3);
    moveBody(b, world);
    if (b.onGround) {
      b.vy = -3.2;
      b.onGround = false;
      this.bounces++;
    }
    if (b.hitWall !== 0 || this.anim > 110 || this.bounces > 4) {
      this.dead = true;
      world.sparkle(this.cx, this.cy, '#bfe3ff', 6, 1);
    }
    // revela blocos invisíveis por perto
    if (this.anim % 4 === 0) {
      const tx0 = Math.floor((this.cx - 24) / TILE), tx1 = Math.floor((this.cx + 24) / TILE);
      const ty0 = Math.floor((this.cy - 24) / TILE), ty1 = Math.floor((this.cy + 24) / TILE);
      for (let ty = Math.max(0, ty0); ty <= Math.min(world.h - 1, ty1); ty++) {
        for (let tx = Math.max(0, tx0); tx <= Math.min(world.w - 1, tx1); tx++) {
          if (world.get(tx, ty) === T.Hidden) {
            const idx = ty * world.w + tx;
            if (!world.revealed.has(idx)) {
              world.revealed.add(idx);
              sfx('reveal');
              world.sparkle(tx * TILE + 8, ty * TILE + 8, '#fff7b0', 4, 0.6);
            }
          }
        }
      }
    }
    if (this.anim % 3 === 0) world.particles.push({ x: this.cx, y: this.cy, vx: 0, vy: 0, life: 10, maxLife: 10, color: '#bfe3ff', size: 2, gravity: 0, fade: true });
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(ITEMS.orb, Math.floor(this.anim / 3) % 2, this.ix(alpha), this.iy(alpha));
  }
}

export class Pearl extends Entity {
  readonly kind = 'pearl';
  constructor(x: number, y: number) {
    super(x + 3, y - 14, 10, 12);
    this.body.noclip = true;
  }
  update(_world: World): void {}
  override onTouch(world: World): boolean {
    this.dead = true;
    world.consumeSpawn(this);
    world.collectPearl(this.spawn);
    world.sparkle(this.cx, this.cy, '#ffffff', 10, 2);
    world.popup(this.cx, this.y - 8, 'PEROLA!', '#dff6ff');
    return false;
  }
  draw(r: Renderer, alpha: number, world: World): void {
    const idx = this.spawn ? world.pearlOrder.indexOf(this.spawn) : 0;
    const saved = idx >= 0 && (world.run.pearlsSaved & (1 << idx)) !== 0;
    r.drawSprite(ITEMS.pearl, Math.floor(this.anim / 10) % 4, this.ix(alpha) - 3, this.iy(alpha) - 2 + tsin(this.anim / 60) * 2, false, true, saved ? 0.45 : 1);
  }
}

export class Feather extends Entity {
  readonly kind = 'feather';
  constructor(x: number, y: number) {
    super(x + 2, y - 14, 12, 12);
    this.body.noclip = true;
  }
  update(_world: World): void {}
  override onTouch(world: World): boolean {
    this.dead = true;
    world.consumeSpawn(this);
    world.run.lives = Math.min(99, world.run.lives + 1);
    sfx('oneup');
    world.popup(this.cx, this.y - 8, '1 VIDA!', '#9cf29c');
    return false;
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(ITEMS.feather, 0, this.ix(alpha) - 2, this.iy(alpha) - 2 + tsin(this.anim / 50) * 2);
  }
}

export class Key extends Entity {
  readonly kind = 'key';
  constructor(x: number, y: number) {
    super(x + 2, y - 14, 12, 14);
    this.carriable = true;
    this.stun = 1; // sempre "pegável"
    this.despawnOffscreen = false;
    this.alwaysActive = true;
  }
  update(world: World): void {
    if (this.carried) return;
    this.stun = 1;
    const b = this.body;
    b.vy = Math.min(4, b.vy + 0.3);
    b.vx = approach(b.vx, 0, b.onGround ? 0.1 : 0.01);
    moveBody(b, world);
    if (b.onGround) b.vx = approach(b.vx, 0, 0.2);
    // chegou na fechadura?
    for (const e of world.entities) {
      if (e.kind === 'lock' && this.overlaps(e)) {
        this.dead = true;
        world.finish(true);
        sfx('goal');
        world.sparkle(e.cx, e.cy, '#ffe08a', 12, 2);
      }
    }
  }
  override onKick(_world: World, dir: number, up: boolean): void {
    this.body.vx = dir * 2;
    this.body.vy = up ? -4 : -1;
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(ITEMS.key, 0, this.ix(alpha) - 2, this.iy(alpha) - 1);
  }
}

export class Lock extends Entity {
  readonly kind = 'lock';
  constructor(x: number, y: number) {
    super(x, y - 32, 16, 32);
    this.despawnOffscreen = false;
    this.alwaysActive = true;
  }
  update(world: World): void {
    // Lumi carregando a chave encosta: abre
    const p = world.player;
    if (p.carrying && p.carrying.kind === 'key' && this.overlaps(p)) {
      p.carrying.dead = true;
      p.carrying = null;
      world.finish(true);
      sfx('goal');
      world.sparkle(this.cx, this.cy, '#ffe08a', 12, 2);
    }
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(ITEMS.lock, Math.floor(this.anim / 20) % 2, this.ix(alpha), this.iy(alpha));
  }
}

export class Checkpoint extends Entity {
  readonly kind = 'checkpoint';
  rung = false;
  ringT = 0;
  constructor(x: number, y: number) {
    super(x + 2, y - 32, 12, 32);
    this.body.noclip = true;
    this.despawnOffscreen = false;
  }
  update(world: World): void {
    if (this.ringT > 0) this.ringT--;
    if (!this.rung && world.checkpoint && world.checkpoint.room === world.roomIndex && Math.abs(world.checkpoint.x - this.x) < 20) this.rung = true;
  }
  override onTouch(world: World): boolean {
    if (this.rung) return false;
    this.rung = true;
    this.ringT = 60;
    world.checkpoint = { room: world.roomIndex, x: this.x, y: this.bottom };
    sfx('checkpoint');
    world.sparkle(this.cx, this.y + 6, '#ffe08a', 8, 1.5);
    // sino dá a concha se estiver sem poder
    if (world.player.power === 'none') {
      world.add(new PowerUp(this.x, this.y - 4, 'shell', false));
    }
    return false;
  }
  draw(r: Renderer, alpha: number): void {
    const sway = this.ringT > 0 ? Math.round(tsin(this.ringT / 8) * 2) : 0;
    r.drawSprite(BELL, this.rung ? 1 : 0, this.ix(alpha) - 2 + sway, this.iy(alpha));
  }
}

/** Arco de corda com bandeirola: fim de fase. Quanto mais alto Lumi toca, mais âmbar. */
export class Goal extends Entity {
  readonly kind = 'goal';
  flagY = 0;
  constructor(x: number, y: number) {
    super(x + 8, y - 64, 16, 64);
    this.body.noclip = true;
    this.despawnOffscreen = false;
    this.alwaysActive = true;
  }
  update(world: World): void {
    this.flagY = (this.anim * 1.3) % 56;
    // barreira: Lumi não passa sem tocar
    const p = world.player;
    if (world.event === 'none' && p.x + p.w > this.x && p.x < this.x + this.w && p.y + p.h > this.y && p.y < this.y + this.h) {
      this.onTouch(world);
    }
  }
  override onTouch(world: World): boolean {
    if (world.event !== 'none') return false;
    const p = world.player;
    const rel = 1 - (p.cy - this.y) / this.h; // 0 embaixo, 1 em cima
    const bonus = Math.max(1, Math.round(rel * 10)) * (rel > 0.85 ? 3 : 1);
    const hitFlag = Math.abs(p.cy - (this.y + this.flagY + 6)) < 10;
    const total = bonus + (hitFlag ? 10 : 0);
    world.run.amber += total;
    world.checkAmberLife();
    world.popup(this.cx, this.y - 6, `+${total}`, hitFlag ? '#ffe08a' : '#ffffff');
    if (hitFlag) world.sparkle(this.cx, this.y + this.flagY, '#ffe08a', 12, 2);
    world.finish(false);
    sfx('goal');
    return false;
  }
  draw(r: Renderer, alpha: number): void {
    const x = this.ix(alpha) - 8, y = this.iy(alpha);
    r.drawSprite(GOAL_ARCH, 0, x, y);
    // bandeirola que sobe e desce
    r.drawSprite(ITEMS.flag, Math.floor(this.anim / 8) % 2, x + 12, y + this.flagY + 2);
  }
}

/** Saída secreta direta (sem chave): porta dourada. */
export class SecretGoal extends Entity {
  readonly kind = 'secretgoal';
  constructor(x: number, y: number) {
    super(x, y - 32, 16, 32);
    this.body.noclip = true;
    this.despawnOffscreen = false;
  }
  update(_world: World): void {}
  override onTouch(world: World): boolean {
    if (world.event !== 'none') return false;
    world.finish(true);
    sfx('goal');
    world.sparkle(this.cx, this.cy, '#ffe08a', 12, 2);
    return false;
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(ITEMS.goldDoor, Math.floor(this.anim / 15) % 2, this.ix(alpha), this.iy(alpha));
  }
}

/** Faroleiro-fantasma: dá a dica da fase ao apertar cima. */
export class Ghost extends Entity {
  readonly kind = 'ghost';
  constructor(x: number, y: number) {
    super(x, y - 24, 16, 24);
    this.body.noclip = true;
  }
  update(world: World): void {
    const p = world.player;
    if (this.overlaps(p) && world.messageTimer === 0 && (p as Player).body.onGround) {
      const hint = world.level.hint ?? 'A NEBLINA TEME A LUZ.';
      world.showMessage(wrap(hint), 200);
      sfx('text');
    }
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(GHOST, Math.floor(this.anim / 16) % 2, this.ix(alpha), this.iy(alpha) + tsin(this.anim / 80) * 3, false, true, 0.85);
  }
}

export class Sign extends Entity {
  readonly kind = 'sign';
  index = 0;
  constructor(x: number, y: number) {
    super(x, y - 16, 16, 16);
    this.body.noclip = true;
  }
  update(world: World): void {
    const p = world.player;
    if (this.overlaps(p) && world.messageTimer === 0) {
      const signs = world.level.signs ?? [];
      const all = world.room.spawns.filter((s) => s.kind === 'sign').sort((a, b) => a.x - b.x);
      const idx = this.spawn ? all.indexOf(this.spawn) : 0;
      const text = signs[idx] ?? 'SIGA EM FRENTE!';
      world.showMessage(wrap(text), 150);
    }
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(SIGN, 0, this.ix(alpha), this.iy(alpha));
  }
}

export function wrap(text: string, max = 30): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      lines.push(cur.trim());
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

declare module '../level/format' {
  interface LevelDef {
    signs?: string[];
  }
}
