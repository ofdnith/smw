/** Inimigos comuns das sete ilhas. Todos originais. */
import type { Renderer } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import { approach, tsin, tcos, sign, clamp } from '../../engine/rng';
import { T, TILE } from '../level/tiles';
import { moveBody, groundAhead, solidAt } from '../physics/tilecollision';
import { Entity } from './base';
import type { World } from '../world';
import { ENEMIES } from '../../content/art/enemies';

/** Base de inimigo com gravidade, caminhar, atordoar e ser derrotado. */
export abstract class Enemy extends Entity {
  gravity = 0.3;
  speed = 0.5;
  turnsAtEdge = true;
  knocked = false;
  knockT = 0;
  wakeT = 0;
  constructor(x: number, y: number, w: number, h: number) {
    super(x + (TILE - w) / 2, y - h, w, h);
    this.isEnemy = true;
    this.facing = -1;
  }

  /** Derrota: cai da tela girando. */
  knockOut(world: World, dir: number): void {
    if (this.knocked) return;
    this.knocked = true;
    this.isEnemy = false;
    this.hurts = false;
    this.body.noclip = true;
    this.body.vy = -3.5;
    this.body.vx = dir * 1.5;
    world.consumeSpawn(this);
    world.run.amber += 1;
    world.checkAmberLife();
    world.popup(this.cx, this.y - 6, '+1', '#ffd27a');
  }

  /** Derrota: some em fumaça. */
  poofOut(world: World): void {
    this.dead = true;
    world.consumeSpawn(this);
    world.poof(this.cx, this.cy);
    world.run.amber += 1;
    world.checkAmberLife();
    world.popup(this.cx, this.y - 6, '+1', '#ffd27a');
  }

  protected updateKnocked(): void {
    const b = this.body;
    b.vy += 0.3;
    b.x += b.vx;
    b.y += b.vy;
    this.knockT++;
    if (this.knockT > 90) this.dead = true;
  }

  /** Andar padrão: gravidade, vira em paredes e bordas. */
  protected walk(world: World, speed = this.speed): void {
    const b = this.body;
    if (this.stun > 0) {
      b.vx = approach(b.vx, 0, 0.1);
    } else {
      b.vx = this.facing * speed;
    }
    b.vy = Math.min(4, b.vy + this.gravity);
    moveBody(b, world);
    if (b.hitWall !== 0) this.facing = -b.hitWall;
    if (this.turnsAtEdge && b.onGround && this.stun === 0) {
      const aheadX = this.facing > 0 ? b.x + b.w + 1 : b.x - 1;
      if (!groundAhead(world, aheadX, b.y + b.h + 2)) this.facing = -this.facing;
    }
  }

  override onHit(world: World, source: Entity | null): void {
    this.knockOut(world, source ? sign(this.cx - source.cx) || 1 : 1);
    sfx('kick');
  }

  draw(r: Renderer, alpha: number, _world: World): void {
    this.drawSprite(r, alpha, this.spriteName(), this.spriteFrame());
  }
  protected abstract spriteName(): string;
  protected spriteFrame(): number {
    return Math.floor(this.anim / 10) % 2;
  }
  protected drawSprite(r: Renderer, alpha: number, name: string, frame: number, dy = 0): void {
    const spr = ENEMIES[name];
    if (!spr) return;
    const sp = spr.frames.length ? spr : spr;
    const fw = parseFrameW(sp.frames[0]);
    const fh = parseFrameH(sp.frames[0]);
    const x = this.ix(alpha) + this.body.w / 2 - fw / 2;
    const y = this.iy(alpha) + this.body.h - fh + dy;
    if (this.knocked) {
      // de cabeça para baixo: desenha espelhado em y via escala
      const s = r.ctx;
      s.save();
      s.translate(Math.round(x - r.camX + fw / 2), Math.round(y - r.camY + fh / 2));
      s.scale(1, -1);
      const img = getFrameImg(spr, frame, this.facing < 0);
      s.drawImage(img, -fw / 2, -fh / 2);
      s.restore();
      return;
    }
    r.drawSprite(spr, frame, x, y, this.facing > 0, true, this.flash > 0 && this.flash % 2 === 0 ? 0.5 : 1);
  }
}

import { getSprite } from '../../engine/sprites';
import type { SpriteDef } from '../../engine/sprites';
function getFrameImg(def: SpriteDef, frame: number, flip: boolean): CanvasImageSource {
  const s = getSprite(def, flip);
  return s.frames[frame % s.frames.length].img;
}
const dimCache = new Map<string, [number, number]>();
function dims(frame: string): [number, number] {
  let d = dimCache.get(frame);
  if (!d) {
    const lines = frame.split('\n').filter((l) => l.trim().length > 0);
    d = [Math.max(...lines.map((l) => l.length)), lines.length];
    dimCache.set(frame, d);
  }
  return d;
}
function parseFrameW(f: string): number { return dims(f)[0]; }
function parseFrameH(f: string): number { return dims(f)[1]; }

// ---------------------------------------------------------------- Ilha 1

/** Caranguejo-Ermitão: anda de lado; pisado, entra na concha (chutável). */
export class Crab extends Enemy {
  readonly kind = 'crab';
  inShell = false;
  constructor(x: number, y: number) {
    super(x, y, 14, 12);
    this.speed = 0.55;
  }
  update(world: World): void {
    if (this.knocked) return this.updateKnocked();
    const b = this.body;
    if (this.inShell) {
      if (this.carried) return;
      if (this.projectile) {
        b.vx = this.facing * 3.6;
        b.vy = Math.min(4, b.vy + 0.35);
        moveBody(b, world);
        if (b.hitWall !== 0) {
          this.facing = -b.hitWall;
          sfx('blockhit');
          // quebra blocos rachados
          const tx = b.hitWall > 0 ? Math.floor((b.x + b.w + 1) / TILE) : Math.floor((b.x - 1) / TILE);
          const ty = Math.floor((b.y + b.h / 2) / TILE);
          const t = world.get(clamp(tx, 0, world.w - 1), clamp(ty, 0, world.h - 1));
          if (t === T.Crack || t === T.ItemAmber || t === T.ItemPower) world.hitBlock(tx, ty, true, false);
        }
        if (b.onGround && this.anim % 6 === 0) world.dust(this.cx, b.y + b.h, 1);
        return;
      }
      // parado na concha
      b.vx = approach(b.vx, 0, 0.1);
      b.vy = Math.min(4, b.vy + 0.35);
      moveBody(b, world);
      this.wakeT++;
      if (this.wakeT > 300) {
        this.inShell = false;
        this.stun = 0;
        this.carriable = false;
        this.hurts = true;
        this.isEnemy = true;
      }
      return;
    }
    this.walk(world);
  }
  override onStomp(world: World, _spin: boolean): boolean {
    if (!this.inShell) {
      this.inShell = true;
      this.stun = 1;
      this.carriable = true;
      this.wakeT = 0;
      this.hurts = false;
      this.body.vx = 0;
      return true;
    }
    if (this.projectile) {
      // pisar no casco em movimento: para
      this.projectile = false;
      this.hurts = false;
      this.wakeT = 0;
      this.stun = 1;
      this.carriable = true;
      this.body.vx = 0;
      return true;
    }
    // casco parado pisado: chuta para o lado oposto de Lumi
    const p = world.player;
    this.kickShell(world, sign(this.cx - p.cx) || p.facing);
    return true;
  }
  override onTouch(world: World): boolean {
    if (this.inShell && !this.projectile && !this.carried) {
      // encostar no casco parado = chutar
      const p = world.player;
      if (!(p.carrying) && this.stun > 0) {
        this.kickShell(world, sign(this.cx - p.cx) || p.facing);
        p.kickGrace = 12;
      }
      return false;
    }
    if (this.projectile) return world.player.kickGrace === 0;
    return !this.inShell;
  }
  kickShell(world: World, dir: number): void {
    this.projectile = true;
    this.hurts = true;
    this.facing = dir;
    this.stun = 0;
    this.carriable = false;
    this.body.vx = dir * 3.6;
    sfx('kick');
    world.dust(this.cx, this.bottom, 3);
  }
  override onKick(world: World, dir: number, up: boolean): void {
    this.carried = false;
    if (up) {
      this.projectile = true;
      this.hurts = true;
      this.facing = dir;
      this.body.vy = -5.5;
      this.body.vx = dir * 0.8;
      this.stun = 0;
      this.carriable = false;
      return;
    }
    this.kickShell(world, dir);
  }
  override onPickup(_world: World): void {
    this.projectile = false;
    this.hurts = false;
  }
  override onHit(world: World, source: Entity | null): void {
    if (this.projectile && source && source.kind === 'crab') {
      // dois cascos colidem: ambos saem
      this.knockOut(world, sign(this.cx - source.cx) || 1);
      return;
    }
    super.onHit(world, source);
  }
  protected spriteName(): string {
    return this.inShell ? 'crabShell' : 'crab';
  }
  protected override spriteFrame(): number {
    if (this.inShell) return this.projectile ? Math.floor(this.anim / 3) % 4 : this.wakeT > 240 && Math.floor(this.anim / 4) % 2 === 0 ? 1 : 0;
    return Math.floor(this.anim / 8) % 2;
  }
}

/** Gaivota-Ladra: voa em seno e mergulha quando Lumi está embaixo. */
export class Gull extends Enemy {
  readonly kind = 'gull';
  baseY: number;
  diving = 0;
  constructor(x: number, y: number) {
    super(x, y, 14, 10);
    this.baseY = this.body.y;
    this.body.noclip = true;
    this.speed = 0.8;
  }
  update(world: World): void {
    if (this.knocked) return this.updateKnocked();
    const b = this.body;
    const p = world.player;
    if (this.diving > 0) {
      this.diving--;
      b.vy = this.diving > 30 ? 2.6 : -1.6;
      b.x += b.vx;
      b.y += b.vy;
      if (this.diving === 0) this.baseY = b.y;
      return;
    }
    b.vx = this.facing * this.speed;
    b.x += b.vx;
    b.y = this.baseY + tsin(this.anim / 120) * 10;
    if (Math.abs(b.x - world.camX - 160) > 190) this.facing = -this.facing;
    if (Math.abs(p.cx - this.cx) < 24 && p.y > b.y + 16 && p.y - b.y < 120 && this.anim % 20 === 0) {
      this.diving = 60;
      this.facing = sign(p.cx - this.cx) || this.facing;
      b.vx = this.facing * 0.8;
    }
  }
  override onStomp(world: World): boolean {
    this.poofOut(world);
    return true;
  }
  protected spriteName(): string {
    return 'gull';
  }
  protected override spriteFrame(): number {
    return this.diving > 30 ? 1 : Math.floor(this.anim / 7) % 2;
  }
}

/** Ouriço-Bomba: espinhos em cima; atordoado vira bomba carregável que explode. */
export class Urchin extends Enemy {
  readonly kind = 'urchin';
  fuse = -1;
  constructor(x: number, y: number) {
    super(x, y, 14, 12);
    this.speed = 0.35;
    this.spikyTop = true;
    this.spinKillable = true;
  }
  update(world: World): void {
    if (this.knocked) return this.updateKnocked();
    const b = this.body;
    if (this.carried) {
      this.tickFuse(world);
      return;
    }
    if (this.stun > 0) {
      b.vx = approach(b.vx, 0, this.projectile ? 0 : 0.08);
      b.vy = Math.min(4, b.vy + 0.3);
      moveBody(b, world);
      if (this.projectile && (b.hitWall !== 0 || b.onGround && Math.abs(b.vx) < 0.5)) this.explode(world);
      this.tickFuse(world);
      return;
    }
    this.walk(world);
  }
  private tickFuse(world: World): void {
    if (this.fuse < 0) return;
    this.fuse--;
    if (this.fuse % 10 === 0 && this.fuse < 60) this.flash = 4;
    if (this.fuse === 0) this.explode(world);
  }
  explode(world: World): void {
    if (this.dead) return;
    this.dead = true;
    world.consumeSpawn(this);
    const p = world.player;
    if (p.carrying === this) p.carrying = null;
    sfx('cannon');
    world.shake = 10;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      world.particles.push({ x: this.cx, y: this.cy, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, life: 24, maxLife: 24, color: i % 2 ? '#ffb347' : '#ffe8a0', size: 3, gravity: 0.05, fade: true });
    }
    // quebra blocos e derruba inimigos num raio
    const R = 28;
    for (let ty = Math.floor((this.cy - R) / TILE); ty <= Math.floor((this.cy + R) / TILE); ty++) {
      for (let tx = Math.floor((this.cx - R) / TILE); tx <= Math.floor((this.cx + R) / TILE); tx++) {
        if (tx < 0 || ty < 0 || tx >= world.w || ty >= world.h) continue;
        const t = world.get(tx, ty);
        if (t === T.Crack || t === T.ItemAmber || t === T.ItemPower || t === T.Hidden) world.hitBlock(tx, ty, true, false);
      }
    }
    for (const e of world.entities) {
      if (e !== this && e.isEnemy && Math.abs(e.cx - this.cx) < R + 8 && Math.abs(e.cy - this.cy) < R + 8) e.onHit(world, this);
    }
    if (Math.abs(p.cx - this.cx) < R && Math.abs(p.cy - this.cy) < R && !this.carried) p.hurt(world);
  }
  override onHit(world: World, source: Entity | null): void {
    if (source && source.kind === 'orb' && this.stun === 0) {
      this.stun = 1;
      this.carriable = true;
      this.hurts = false;
      this.spikyTop = false;
      this.fuse = 200;
      this.body.vx = 0;
      sfx('blockhit');
      world.poof(this.cx, this.y, '#bfe3ff');
      return;
    }
    super.onHit(world, source);
  }
  override onStomp(world: World, spin: boolean): boolean {
    if (spin) {
      this.poofOut(world);
      return true;
    }
    if (this.stun > 0) {
      this.explode(world);
      return true;
    }
    return false;
  }
  override onPickup(_world: World): void {
    if (this.fuse < 0) this.fuse = 200;
  }
  override onKick(_world: World, dir: number, up: boolean): void {
    this.carried = false;
    this.projectile = true;
    this.hurts = false;
    this.body.vx = dir * (up ? 1 : 3);
    this.body.vy = up ? -5 : -1;
    if (this.fuse < 0 || this.fuse > 60) this.fuse = Math.min(this.fuse < 0 ? 60 : this.fuse, 60);
  }
  override onTouch(world: World): boolean {
    if (this.stun > 0) return false;
    return super.onTouch(world);
  }
  protected spriteName(): string {
    return this.stun > 0 ? 'urchinStun' : 'urchin';
  }
  protected override spriteFrame(): number {
    return this.stun > 0 ? (this.fuse >= 0 && this.fuse < 60 && Math.floor(this.anim / 4) % 2 === 0 ? 1 : 0) : Math.floor(this.anim / 12) % 2;
  }
}

// ---------------------------------------------------------------- Ilha 2

/** Lesma-Musgo: rasteja por qualquer superfície (chão, parede, teto). */
export class Slug extends Enemy {
  readonly kind = 'slug';
  /** direção da "gravidade": 0 baixo, 1 direita, 2 cima, 3 esquerda */
  g = 0;
  dir = 1; // +1 = sentido horário ao redor do bloco
  constructor(x: number, y: number) {
    super(x, y, 12, 10);
    this.body.noclip = true;
    this.speed = 0.4;
  }
  update(world: World): void {
    if (this.knocked) return this.updateKnocked();
    const b = this.body;
    // vetor gravidade e tangente
    const G: [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const [gx, gy] = G[this.g];
    // tangente no sentido horário: rotacionar g 90° anti-horário
    const tx = -gy * this.dir, ty = gx * this.dir;
    const nx = b.x + tx * this.speed, ny = b.y + ty * this.speed;
    const cx = nx + b.w / 2, cy = ny + b.h / 2;
    // ponto "abaixo" (na direção da gravidade) na frente
    const belowX = cx + gx * (b.w / 2 + 2) + tx * (b.w / 2), belowY = cy + gy * (b.h / 2 + 2) + ty * (b.h / 2);
    const aheadX = cx + tx * (b.w / 2 + 1), aheadY = cy + ty * (b.h / 2 + 1);
    if (solidAt(world, aheadX, aheadY)) {
      // parede à frente: gira para subir a parede (gravidade passa a apontar para a parede)
      this.g = (this.g + (this.dir > 0 ? 1 : 3)) % 4;
    } else if (!solidAt(world, belowX, belowY)) {
      // borda: contorna
      b.x = nx + gx * 1;
      b.y = ny + gy * 1;
      this.g = (this.g + (this.dir > 0 ? 3 : 1)) % 4;
      // avança um pouco ao redor da quina
      const [ngx, ngy] = G[this.g];
      b.x += ngx * 2;
      b.y += ngy * 2;
    } else {
      b.x = nx;
      b.y = ny;
    }
    // se está no chão normal, pode ser pisada; no teto ou paredes, machuca
    this.stompable = this.g === 0;
    if (b.y > world.h * TILE + 32) this.dead = true;
  }
  override onStomp(world: World): boolean {
    this.poofOut(world);
    return true;
  }
  protected spriteName(): string {
    return 'slug';
  }
  override draw(r: Renderer, alpha: number): void {
    const spr = ENEMIES.slug;
    const f = Math.floor(this.anim / 12) % 2;
    const c = r.ctx;
    const x = Math.round(this.ix(alpha) - r.camX + this.w / 2), y = Math.round(this.iy(alpha) - r.camY + this.h / 2);
    c.save();
    c.translate(x, y);
    c.rotate((this.g * Math.PI) / 2);
    const img = getFrameImg(spr, f, this.dir * (this.g === 2 || this.g === 3 ? -1 : 1) > 0);
    c.drawImage(img, -8, -5);
    c.restore();
  }
}

/** Fantoche de Névoa: só se move quando Lumi está de costas. */
export class Puppet extends Enemy {
  readonly kind = 'puppet';
  visible = 0;
  constructor(x: number, y: number) {
    super(x, y, 12, 20);
    this.speed = 1.1;
    this.turnsAtEdge = true;
  }
  update(world: World): void {
    if (this.knocked) return this.updateKnocked();
    const p = world.player;
    const facingMe = sign(this.cx - p.cx) === p.facing;
    if (!facingMe) {
      this.facing = sign(p.cx - this.cx) || this.facing;
      this.walk(world, this.speed);
      this.visible = approach(this.visible, 1, 0.05);
    } else {
      this.body.vx = 0;
      this.body.vy = Math.min(4, this.body.vy + this.gravity);
      moveBody(this.body, world);
      this.visible = approach(this.visible, 0.35, 0.04);
    }
  }
  override onStomp(world: World): boolean {
    this.poofOut(world);
    return true;
  }
  override onHit(world: World, source: Entity | null): void {
    if (source && source.kind === 'orb') {
      this.poofOut(world);
      return;
    }
    super.onHit(world, source);
  }
  protected spriteName(): string {
    return 'puppet';
  }
  override draw(r: Renderer, alpha: number): void {
    const spr = ENEMIES.puppet;
    const f = Math.floor(this.anim / 10) % 2;
    r.drawSprite(spr, f, this.ix(alpha) - 2, this.iy(alpha) - 4, this.facing > 0, true, this.knocked ? 1 : this.visible);
  }
}

// ---------------------------------------------------------------- Ilha 3

/** Polvo-Cano: sai do cano, cospe tinta em arco. */
export class Octopus extends Enemy {
  readonly kind = 'octopus';
  phase = 0;
  homeY: number;
  constructor(x: number, y: number) {
    super(x, y, 14, 16);
    this.homeY = this.body.y + 16;
    this.body.y = this.homeY;
    this.body.noclip = true;
    this.hurts = true;
    this.despawnOffscreen = false;
    this.layer = 'back';
  }
  update(world: World): void {
    if (this.knocked) return this.updateKnocked();
    this.phase = (this.anim + 60) % 240;
    const b = this.body;
    const p = world.player;
    if (this.phase < 60) {
      b.y = approach(b.y, this.homeY - 16, 0.6); // sobe
      this.isEnemy = true;
    } else if (this.phase < 150) {
      b.y = this.homeY - 16;
      this.facing = sign(p.cx - this.cx) || 1;
      if (this.phase === 90 && Math.abs(p.cx - this.cx) < 200) {
        world.add(new Ink(this.cx, this.y + 4, this.facing * 1.6, -3.2));
        sfx('ink');
      }
    } else if (this.phase < 200) {
      b.y = approach(b.y, this.homeY, 0.5);
    } else {
      b.y = this.homeY;
    }
    // escondido no cano: não interage
    this.isEnemy = b.y < this.homeY - 6;
  }
  override onStomp(world: World): boolean {
    this.poofOut(world);
    return true;
  }
  protected spriteName(): string {
    return 'octopus';
  }
  protected override spriteFrame(): number {
    return this.phase >= 80 && this.phase < 100 ? 1 : 0;
  }
}

export class Ink extends Entity {
  readonly kind = 'ink';
  constructor(x: number, y: number, vx: number, vy: number) {
    super(x - 3, y - 3, 6, 6);
    this.body.vx = vx;
    this.body.vy = vy;
    this.body.noclip = true;
    this.isEnemy = true;
    this.stompable = false;
  }
  update(world: World): void {
    this.body.vy += 0.12;
    this.body.x += this.body.vx;
    this.body.y += this.body.vy;
    if (this.anim > 120 || solidAt(world, this.cx, this.cy)) {
      this.dead = true;
      world.dust(this.cx, this.cy, 3, '#2a2140');
    }
  }
  override onHit(): void {}
  override onTouch(): boolean {
    return true;
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(ENEMIES.ink, Math.floor(this.anim / 6) % 2, this.ix(alpha) - 1, this.iy(alpha) - 1);
  }
}

/** Pipa-Espinho: orbita presa a um fio. Indestrutível; cambalhota quica. */
export class Kite extends Enemy {
  readonly kind = 'kite';
  ax: number;
  ay: number;
  radius = 40;
  constructor(x: number, y: number) {
    super(x, y, 12, 12);
    this.ax = this.body.x + 6;
    this.ay = this.body.y + 6;
    this.body.noclip = true;
    this.spikyTop = true;
    this.spinKillable = false;
    this.stompable = true;
    this.despawnOffscreen = false;
    this.alwaysActive = true;
  }
  update(world: World): void {
    const t = this.anim / 180;
    this.body.x = this.ax + tcos(t) * this.radius - 6;
    this.body.y = this.ay + tsin(t) * this.radius - 6;
    void world;
  }
  override onStomp(_world: World, spin: boolean): boolean {
    return spin; // quica só com cambalhota
  }
  override onHit(): void {}
  protected spriteName(): string {
    return 'kite';
  }
  override draw(r: Renderer, alpha: number): void {
    // fio
    const c = r.ctx;
    c.strokeStyle = '#d8d8d8';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(Math.round(this.ax - r.camX) + 0.5, Math.round(this.ay - r.camY) + 0.5);
    c.lineTo(Math.round(this.ix(alpha) + 6 - r.camX) + 0.5, Math.round(this.iy(alpha) + 6 - r.camY) + 0.5);
    c.stroke();
    r.fillRect(this.ax - 2, this.ay - 2, 4, 4, '#5a4632', true);
    r.drawSprite(ENEMIES.kite, Math.floor(this.anim / 8) % 2, this.ix(alpha) - 2, this.iy(alpha) - 2);
  }
}

// ---------------------------------------------------------------- Ilha 4

/** Água-Viva-Lâmpada: pulsa luz; só pode ser atacada apagada. */
export class Jelly extends Enemy {
  readonly kind = 'jelly';
  baseY: number;
  constructor(x: number, y: number) {
    super(x, y, 14, 14);
    this.baseY = this.body.y;
    this.body.noclip = true;
  }
  get lit(): boolean {
    return (this.anim % 180) < 90;
  }
  update(world: World): void {
    if (this.knocked) return this.updateKnocked();
    this.body.y = this.baseY + tsin(this.anim / 150) * 14;
    this.body.x += tsin(this.anim / 230) * 0.3;
    this.hurts = this.lit;
    this.stompable = !this.lit;
    void world;
  }
  override onStomp(world: World): boolean {
    if (this.lit) return false;
    this.poofOut(world);
    return true;
  }
  override onHit(world: World, source: Entity | null): void {
    if (this.lit) return;
    super.onHit(world, source);
  }
  override onTouch(): boolean {
    return this.lit;
  }
  protected spriteName(): string {
    return this.lit ? 'jellyLit' : 'jelly';
  }
  override draw(r: Renderer, alpha: number, world: World): void {
    super.draw(r, alpha, world);
    if (this.lit) world.darkLights.push({ x: this.cx, y: this.cy, r: 28 });
  }
}

/** Peixe-Agulha: nada em linha, vira nas paredes. */
export class Fish extends Enemy {
  readonly kind = 'fish';
  constructor(x: number, y: number) {
    super(x, y, 14, 8);
    this.body.noclip = true;
    this.speed = 0.9;
    this.stompable = true;
  }
  update(world: World): void {
    if (this.knocked) return this.updateKnocked();
    const b = this.body;
    b.x += this.facing * this.speed;
    b.y += tsin(this.anim / 60) * 0.3;
    if (solidAt(world, this.facing > 0 ? b.x + b.w + 1 : b.x - 1, this.cy) || !world.waterAt(this.facing > 0 ? b.x + b.w + 8 : b.x - 8, this.cy)) this.facing = -this.facing;
  }
  override onStomp(world: World): boolean {
    this.poofOut(world);
    return true;
  }
  protected spriteName(): string {
    return 'fish';
  }
}

// ---------------------------------------------------------------- Ilha 5

/** Toupeira-Mineira: escondida, aparece embaixo de Lumi. */
export class Mole extends Enemy {
  readonly kind = 'mole';
  state: 'hidden' | 'warn' | 'out' = 'hidden';
  t = 0;
  constructor(x: number, y: number) {
    super(x, y, 14, 14);
    this.speed = 0.9;
    this.despawnOffscreen = false;
  }
  update(world: World): void {
    if (this.knocked) return this.updateKnocked();
    const p = world.player;
    const b = this.body;
    if (this.state === 'hidden') {
      this.isEnemy = false;
      if (Math.abs(p.cx - this.cx) < 80 && Math.abs(p.bottom - this.bottom) < 24) {
        this.state = 'warn';
        this.t = 0;
        // posiciona sob Lumi
        b.x = clamp(p.cx - b.w / 2, this.cx - 60, this.cx + 60);
      }
    } else if (this.state === 'warn') {
      this.t++;
      if (this.t % 4 === 0) world.dust(this.cx, this.bottom, 1, '#d8d0c0');
      if (this.t > 40) {
        this.state = 'out';
        this.isEnemy = true;
        b.vy = -3.5;
        this.facing = sign(p.cx - this.cx) || 1;
        sfx('dig');
        this.t = 0;
      }
    } else {
      this.t++;
      this.walk(world, this.speed);
      if (this.t > 240 && b.onGround) {
        this.state = 'hidden';
        this.isEnemy = false;
        world.dust(this.cx, this.bottom, 4, '#d8d0c0');
      }
    }
  }
  override onStomp(world: World): boolean {
    this.poofOut(world);
    return true;
  }
  protected spriteName(): string {
    return 'mole';
  }
  override draw(r: Renderer, alpha: number, world: World): void {
    if (this.state === 'hidden') return;
    if (this.state === 'warn') {
      r.drawSprite(ENEMIES.moleHole, 0, this.ix(alpha) - 1, this.iy(alpha) + 8);
      return;
    }
    super.draw(r, alpha, world);
  }
}

// ---------------------------------------------------------------- Ilha 6

/** Morcego-Fole: pendurado; infla e explode em rajada de vento. */
export class Bat extends Enemy {
  readonly kind = 'bat';
  inflate = 0;
  constructor(x: number, y: number) {
    super(x, y, 12, 12);
    this.body.noclip = true;
    this.body.y = y - TILE; // pendurado no topo do tile
  }
  update(world: World): void {
    if (this.knocked) return this.updateKnocked();
    const p = world.player;
    if (this.inflate === 0) {
      if (Math.abs(p.cx - this.cx) < 48 && p.cy > this.cy && p.cy - this.cy < 96) this.inflate = 1;
    } else {
      this.inflate++;
      if (this.inflate === 2) sfx('inflate');
      if (this.inflate > 70) {
        // estoura: rajada
        sfx('pop');
        world.poof(this.cx, this.cy, '#9b8bb4');
        const dx = p.cx - this.cx, dy = p.cy - this.cy;
        const d = Math.max(16, Math.hypot(dx, dy));
        if (d < 80) {
          p.body.vx += (dx / d) * 5;
          p.body.vy += (dy / d) * 4 - 1;
          p.flying = 0;
        }
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          world.particles.push({ x: this.cx, y: this.cy, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, life: 18, maxLife: 18, color: '#e9e4f5', size: 2, gravity: 0, fade: true });
        }
        this.dead = true;
        world.consumeSpawn(this);
      }
    }
  }
  override onStomp(world: World): boolean {
    this.poofOut(world);
    return true;
  }
  override onHit(world: World, source: Entity | null): void {
    super.onHit(world, source);
  }
  protected spriteName(): string {
    return this.inflate > 40 ? 'batBig' : this.inflate > 0 ? 'batMid' : 'bat';
  }
  protected override spriteFrame(): number {
    return Math.floor(this.anim / 12) % 2;
  }
  override draw(r: Renderer, alpha: number, world: World): void {
    const spr = ENEMIES[this.spriteName()];
    const fw = parseFrameW(spr.frames[0]);
    const fh = parseFrameH(spr.frames[0]);
    const x = this.ix(alpha) + this.w / 2 - fw / 2;
    const y = this.iy(alpha) + this.h / 2 - fh / 2;
    r.drawSprite(spr, this.spriteFrame(), x, y, this.facing > 0);
    void world;
  }
}

// ---------------------------------------------------------------- Ilha 7

/** Marujo de Bruma: bloqueia ataques frontais com o remo. */
export class Sailor extends Enemy {
  readonly kind = 'sailor';
  constructor(x: number, y: number) {
    super(x, y, 12, 20);
    this.speed = 0.6;
  }
  update(world: World): void {
    if (this.knocked) return this.updateKnocked();
    const p = world.player;
    if (Math.abs(p.cx - this.cx) < 120) this.facing = sign(p.cx - this.cx) || this.facing;
    this.walk(world, Math.abs(p.cx - this.cx) < 120 ? 0.75 : 0.5);
  }
  override onStomp(world: World): boolean {
    this.poofOut(world);
    return true;
  }
  override onHit(world: World, source: Entity | null): void {
    if (source && sign(source.cx - this.cx) === this.facing && source.kind !== 'player') {
      // bloqueia: rebate o projétil
      source.facing = -source.facing;
      source.body.vx = -source.body.vx;
      sfx('blockhit');
      this.flash = 6;
      return;
    }
    super.onHit(world, source);
  }
  protected spriteName(): string {
    return 'sailor';
  }
}

/** Chama de forte: pula do chão periodicamente. */
export class Flame extends Enemy {
  readonly kind = 'flame';
  baseY: number;
  constructor(x: number, y: number) {
    super(x, y, 10, 14);
    this.baseY = this.body.y + 16;
    this.body.y = this.baseY;
    this.body.noclip = true;
    this.stompable = false;
    this.despawnOffscreen = false;
    this.spinKillable = false;
  }
  update(_world: World): void {
    const t = (this.anim + 100) % 200;
    if (t < 100) {
      const k = t / 100;
      this.body.y = this.baseY - Math.sin(k * Math.PI) * 80;
      this.isEnemy = true;
    } else {
      this.body.y = this.baseY + 40;
      this.isEnemy = false;
    }
  }
  override onHit(): void {}
  override onStomp(): boolean {
    return false;
  }
  protected spriteName(): string {
    return 'flame';
  }
  protected override spriteFrame(): number {
    return Math.floor(this.anim / 5) % 2;
  }
}

export { sign };
