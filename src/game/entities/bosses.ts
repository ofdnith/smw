/** Chefes: um por farol, mais o Capitão Brumo. */
import type { Renderer } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import { approach, tsin, tcos, clamp } from '../../engine/rng';
import { T, TILE } from '../level/tiles';
import { moveBody, solidAt } from '../physics/tilecollision';
import { Entity } from './base';
import type { World } from '../world';
import { Enemy, Crab, Ink, Sailor, sign } from './enemies';
import { BOSSES } from '../../content/art/bosses';

export abstract class Boss extends Enemy {
  hp = 3;
  maxHp = 3;
  dying = 0;
  abstract readonly bossName: string;
  intro = 90;
  constructor(x: number, y: number, w: number, h: number) {
    super(x, y, w, h);
    this.alwaysActive = true;
    this.despawnOffscreen = false;
  }
  damage(world: World, n = 1): void {
    if (this.dying > 0 || this.flash > 0) return;
    this.hp -= n;
    this.flash = 40;
    sfx('bosshit');
    world.shake = 8;
    world.freezeTimer = 6;
    if (this.hp <= 0) {
      this.dying = 1;
      this.isEnemy = false;
      this.hurts = false;
      sfx('bossdie');
      world.bossHp = 0;
    }
  }
  protected updateDying(world: World): void {
    this.dying++;
    this.body.vx = 0;
    if (this.dying % 8 === 0) {
      world.poof(this.x + world.rng.range(0, this.w), this.y + world.rng.range(0, this.h), world.rng.pick(['#ffffff', '#ffd27a', '#ff9a9a']));
      sfx('pop');
    }
    if (this.dying > 120) {
      this.dead = true;
      world.consumeSpawn(this);
      world.bossHp = -1;
      world.run.amber += 30;
      world.checkAmberLife();
      world.popup(this.cx, this.y, '+30', '#ffd27a');
      world.finish(false);
    }
  }
  override update(world: World): void {
    world.bossHp = this.dying > 0 ? 0 : this.hp;
    world.bossName = this.bossName;
    if (this.dying > 0) return this.updateDying(world);
    if (this.intro > 0) {
      this.intro--;
      this.body.vy = Math.min(4, this.body.vy + this.gravity);
      moveBody(this.body, world);
      return;
    }
    this.think(world);
  }
  abstract think(world: World): void;
  override onHit(world: World, source: Entity | null): void {
    if (source && (source.kind === 'crab' || source.kind === 'orb' || source.kind === 'urchin')) this.damage(world);
  }
  override draw(r: Renderer, alpha: number): void {
    const spr = BOSSES[this.spriteName()];
    if (!spr) return;
    const first = spr.frames[0].split('\n').filter((l) => l.trim().length);
    const fw = Math.max(...first.map((l) => l.length)), fh = first.length;
    const x = this.ix(alpha) + this.w / 2 - fw / 2;
    const y = this.iy(alpha) + this.h - fh;
    const vis = this.flash > 0 && Math.floor(this.flash / 3) % 2 === 0 ? 0.4 : 1;
    r.drawSprite(spr, this.spriteFrame(), x, y + (this.dying > 0 ? Math.floor(this.dying / 10) : 0), this.facing > 0, true, vis);
  }
}

/** 1. Rei Siri: anda, ergue a garra e crava no chão; fica preso e pode ser pisado. */
export class KingCrab extends Boss {
  readonly kind = 'boss-reisiri';
  readonly bossName = 'REI SIRI';
  state: 'walk' | 'raise' | 'stuck' = 'walk';
  t = 0;
  constructor(x: number, y: number) {
    super(x, y, 30, 22);
    this.speed = 0.7;
    this.spikyTop = true;
    this.stompable = true;
  }
  think(world: World): void {
    const p = world.player;
    const b = this.body;
    this.t++;
    if (this.state === 'walk') {
      this.spikyTop = true;
      this.walk(world, 0.7 + (this.maxHp - this.hp) * 0.3);
      if (this.t > 120 && Math.abs(p.cx - this.cx) < 70) {
        this.state = 'raise';
        this.t = 0;
        this.facing = sign(p.cx - this.cx) || this.facing;
      }
    } else if (this.state === 'raise') {
      b.vx = 0;
      b.vy = Math.min(4, b.vy + this.gravity);
      moveBody(b, world);
      if (this.t === 30) {
        // crava: onda de choque
        sfx('cannon');
        world.shake = 10;
        world.dust(this.cx + this.facing * 18, this.bottom, 8, '#e8d8b0');
        const sx = this.cx + this.facing * 20;
        if (Math.abs(p.cx - sx) < 20 && p.bottom >= this.bottom - 4 && p.body.onGround) p.hurt(world);
        if (this.hp < this.maxHp) {
          // um caranguejo sai por trás do rei, andando para longe de Lumi
          const c = new Crab(this.cx - this.facing * 24, this.bottom);
          c.facing = -this.facing;
          world.add(c);
        }
        this.state = 'stuck';
        this.t = 0;
        this.spikyTop = false;
      }
    } else {
      b.vx = 0;
      b.vy = Math.min(4, b.vy + this.gravity);
      moveBody(b, world);
      if (this.t > 110) {
        this.state = 'walk';
        this.t = 0;
      }
    }
  }
  override onStomp(world: World): boolean {
    if (this.state !== 'stuck') return false;
    this.damage(world);
    this.state = 'walk';
    this.t = -40;
    return true;
  }
  protected spriteName(): string {
    return this.state === 'walk' ? 'kingcrab' : this.state === 'raise' ? 'kingcrabRaise' : 'kingcrabStuck';
  }
  protected override spriteFrame(): number {
    return this.state === 'walk' ? Math.floor(this.anim / 10) % 2 : 0;
  }
}

/** 2. Mãe-Musgo: lesma gigante no teto; desce para o chão e aí pode ser atingida. */
export class MotherSlug extends Boss {
  readonly kind = 'boss-maemusgo';
  readonly bossName = 'MAE-MUSGO';
  state: 'ceiling' | 'drop' | 'floor' | 'rise' = 'ceiling';
  t = 0;
  ceilY: number;
  floorY = 0;
  constructor(x: number, y: number) {
    super(x, y, 30, 18);
    this.ceilY = this.body.y - 96;
    this.body.y = this.ceilY;
    this.body.noclip = true;
    this.spikyTop = true;
    this.spinKillable = false;
    this.gravity = 0;
  }
  think(world: World): void {
    const p = world.player;
    const b = this.body;
    this.t++;
    if (this.state === 'ceiling') {
      this.spikyTop = true;
      b.x = approach(b.x, p.cx - b.w / 2, 0.6 + (this.maxHp - this.hp) * 0.2);
      b.y = this.ceilY;
      if (this.t % 70 === 0) {
        world.add(new Ink(this.cx, this.bottom, 0, 0.5));
        sfx('ink');
      }
      if (this.t > 260) {
        this.state = 'drop';
        this.t = 0;
      }
    } else if (this.state === 'drop') {
      b.vy = Math.min(5, b.vy + 0.25);
      b.y += b.vy;
      if (solidAt(world, this.cx, this.bottom + 1)) {
        b.y = Math.floor((this.bottom) / TILE) * TILE - b.h;
        this.state = 'floor';
        this.t = 0;
        this.spikyTop = false;
        this.spinKillable = true;
        b.vy = 0;
        world.shake = 8;
        sfx('cannon');
        world.dust(this.cx, this.bottom, 10, '#9bc27a');
      }
    } else if (this.state === 'floor') {
      b.vx = this.facing * 0.5;
      b.x += b.vx;
      if (solidAt(world, this.facing > 0 ? b.x + b.w + 1 : b.x - 1, this.cy)) this.facing = -this.facing;
      if (this.t > 180) {
        this.state = 'rise';
        this.t = 0;
        this.spikyTop = true;
        this.spinKillable = false;
      }
    } else {
      b.y = approach(b.y, this.ceilY, 1.2);
      if (b.y === this.ceilY) {
        this.state = 'ceiling';
        this.t = 0;
      }
    }
  }
  override onStomp(world: World, spin: boolean): boolean {
    if (this.state !== 'floor') return false;
    if (spin) this.damage(world);
    return true;
  }
  override onHit(world: World, source: Entity | null): void {
    if (this.state === 'floor' || (source && source.kind === 'player')) this.damage(world);
  }
  protected spriteName(): string {
    return this.state === 'floor' ? 'motherslugFloor' : 'motherslug';
  }
  protected override spriteFrame(): number {
    return Math.floor(this.anim / 14) % 2;
  }
}

/** 3. Barão Cata-Vento: paira no alto; quando as pás param, o eixo pode ser pisado. */
export class WindBaron extends Boss {
  readonly kind = 'boss-catavento';
  readonly bossName = 'BARAO CATA-VENTO';
  spinning = true;
  t = 0;
  baseY: number;
  constructor(x: number, y: number) {
    super(x, y, 26, 26);
    this.baseY = this.body.y - 64;
    this.body.y = this.baseY;
    this.body.noclip = true;
    this.gravity = 0;
    this.spikyTop = true;
    this.spinKillable = false;
  }
  think(world: World): void {
    const p = world.player;
    const b = this.body;
    this.t++;
    const cycle = 300 - (this.maxHp - this.hp) * 40;
    const ph = this.t % cycle;
    this.spinning = ph < cycle - 110;
    this.spikyTop = this.spinning;
    this.hurts = this.spinning;
    if (this.spinning) {
      b.x = world.camX + 160 + tsin(this.t / 240) * 100 - b.w / 2;
      b.y = this.baseY + tsin(this.t / 90) * 8;
      if (ph % 45 === 0) {
        // rajada: empurra Lumi
        sfx('gust');
        const dir = sign(p.cx - this.cx) || 1;
        for (let i = 0; i < 6; i++) world.particles.push({ x: this.cx, y: this.cy + i * 3, vx: dir * 3, vy: 0.5, life: 30, maxLife: 30, color: '#e8f6ff', size: 2, gravity: 0, fade: true });
        world.add(new Gust(this.cx, this.cy, dir * 2.4));
      }
    } else {
      // pás paradas: desce um pouco
      b.y = approach(b.y, this.baseY + 40, 1.5);
    }
  }
  override onStomp(world: World, _spin: boolean): boolean {
    if (this.spinning) return false;
    this.damage(world);
    this.t += 200;
    return true;
  }
  protected spriteName(): string {
    return 'baron';
  }
  protected override spriteFrame(): number {
    return this.spinning ? Math.floor(this.anim / 3) % 2 : 2;
  }
}

/** Rajada de vento horizontal (projétil do Barão). */
export class Gust extends Entity {
  readonly kind = 'gust';
  constructor(x: number, y: number, vx: number) {
    super(x - 8, y - 8, 16, 16);
    this.body.vx = vx;
    this.body.noclip = true;
  }
  update(world: World): void {
    this.body.x += this.body.vx;
    this.body.y += 0.4;
    const p = world.player;
    if (this.overlaps(p)) {
      p.body.vx += this.body.vx * 0.5;
      p.body.vy -= 0.4;
    }
    if (this.anim > 90) this.dead = true;
  }
  override onTouch(): boolean {
    return false;
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(BOSSES.gust, Math.floor(this.anim / 4) % 2, this.ix(alpha), this.iy(alpha), this.body.vx < 0, true, 0.8);
  }
}

/** 4. Medusa-Maré: flutua; pulsa luz; a maré sobe e desce. Ataque quando apagada. */
export class TideMedusa extends Boss {
  readonly kind = 'boss-medusa';
  readonly bossName = 'MEDUSA-MARE';
  t = 0;
  baseY: number;
  constructor(x: number, y: number) {
    super(x, y, 26, 26);
    this.baseY = this.body.y - 58;
    this.body.y = this.baseY;
    this.body.noclip = true;
    this.gravity = 0;
  }
  get lit(): boolean {
    const c = 240 - (this.maxHp - this.hp) * 30;
    return this.t % c < c * 0.5;
  }
  /** acabou de acender: aviso sem dano */
  get warming(): boolean {
    const c = 240 - (this.maxHp - this.hp) * 30;
    return this.t % c < 24;
  }
  /** frames até a próxima troca de fase */
  get phaseLeft(): number {
    const c = 240 - (this.maxHp - this.hp) * 30;
    const k = this.t % c;
    return k < c * 0.5 ? c * 0.5 - k : c - k;
  }
  think(world: World): void {
    const p = world.player;
    const b = this.body;
    this.t++;
    this.hurts = this.lit && !this.warming;
    this.stompable = !this.lit;
    this.spikyTop = this.lit;
    b.x = approach(b.x, p.cx - b.w / 2, this.lit ? 0.35 : 0.2);
    b.y = this.baseY + tsin(this.t / 200) * 18;
    if (this.lit && !this.warming && this.t % 90 === 0) {
      world.add(new Ink(this.cx, this.bottom, 0, 1.0));
      sfx('ink');
    }
  }
  override onStomp(world: World): boolean {
    if (this.lit) return false;
    this.damage(world);
    return true;
  }
  override onHit(world: World): void {
    if (!this.lit) this.damage(world);
  }
  override onTouch(): boolean {
    return this.lit && !this.warming;
  }
  protected spriteName(): string {
    return this.lit ? 'medusaLit' : 'medusa';
  }
  protected override spriteFrame(): number {
    return Math.floor(this.anim / 12) % 2;
  }
  override draw(r: Renderer, alpha: number): void {
    super.draw(r, alpha);
  }
}

/** 5. Velha Broca: toupeira com máquina; some no chão, surge sob Lumi, avança e fica tonta. */
export class OldDrill extends Boss {
  readonly kind = 'boss-broca';
  readonly bossName = 'VELHA BROCA';
  state: 'hidden' | 'warn' | 'dash' | 'dizzy' = 'hidden';
  t = 0;
  constructor(x: number, y: number) {
    super(x, y, 28, 22);
    this.spikyTop = true;
    this.stompable = true;
  }
  think(world: World): void {
    const p = world.player;
    const b = this.body;
    this.t++;
    if (this.state === 'hidden') {
      this.isEnemy = false;
      if (this.t > 60) {
        b.x = clamp(p.cx - b.w / 2, world.camX + 16, world.camX + 320 - 16 - b.w);
        b.y = world.h * TILE; // abaixo do chão
        this.state = 'warn';
        this.t = 0;
      }
    } else if (this.state === 'warn') {
      if (this.t % 3 === 0) world.dust(b.x + world.rng.range(0, b.w), Math.floor(p.bottom / TILE) * TILE, 1, '#e8e4d8');
      if (this.t > 45) {
        // emerge no chão onde Lumi está
        const gy = this.findGround(world, this.cx, p.bottom - 8);
        b.y = gy - b.h;
        b.vy = -1.5;
        this.isEnemy = true;
        this.spikyTop = false;
        this.state = 'dash';
        this.t = 0;
        this.facing = sign(p.cx - this.cx) || 1;
        sfx('dig');
        world.shake = 6;
        world.dust(this.cx, gy, 10, '#e8e4d8');
      }
    } else if (this.state === 'dash') {
      this.walk(world, 2.2 + (this.maxHp - this.hp) * 0.4);
      if (b.hitWall !== 0 || this.t > 150) {
        this.state = 'dizzy';
        this.t = 0;
        this.spikyTop = false;
        b.vx = 0;
        world.shake = 6;
        sfx('blockhit');
        // estalactites caem
        for (let i = 0; i < 3; i++) world.add(new Stalactite(world.camX + 40 + i * 110 + world.rng.range(-20, 20), world.camY - 8));
      }
    } else {
      b.vx = 0;
      b.vy = Math.min(4, b.vy + this.gravity);
      moveBody(b, world);
      if (this.t > 150) {
        this.state = 'hidden';
        this.t = 0;
        world.dust(this.cx, this.bottom, 8, '#e8e4d8');
      }
    }
  }
  private findGround(world: World, x: number, fromY: number): number {
    let y = fromY;
    while (y < world.h * TILE && !solidAt(world, x, y)) y += 4;
    return Math.floor(y / TILE) * TILE;
  }
  override onStomp(world: World): boolean {
    if (this.state !== 'dizzy') return this.state === 'dash'; // na máquina em movimento, só quica
    this.damage(world);
    this.state = 'hidden';
    this.t = 0;
    return true;
  }
  override onHit(world: World, source: Entity | null): void {
    if (source && source.kind === 'stalactite' && this.state !== 'hidden') this.damage(world);
    else if (this.state === 'dizzy') super.onHit(world, source);
  }
  protected spriteName(): string {
    return this.state === 'dizzy' ? 'drillDizzy' : 'drill';
  }
  protected override spriteFrame(): number {
    return Math.floor(this.anim / 6) % 2;
  }
  override draw(r: Renderer, alpha: number): void {
    if (this.state === 'hidden' || this.state === 'warn') return;
    super.draw(r, alpha);
  }
}

export class Stalactite extends Entity {
  readonly kind = 'stalactite';
  constructor(x: number, y: number) {
    super(x, y, 10, 16);
    this.projectile = true;
    this.hurts = true;
  }
  update(world: World): void {
    const b = this.body;
    b.vy = Math.min(5, b.vy + 0.2);
    moveBody(b, world);
    if (b.onGround) {
      this.dead = true;
      world.dust(this.cx, this.bottom, 5, '#f0ece0');
      sfx('blockbreak');
    }
  }
  override onTouch(): boolean {
    return true;
  }
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(BOSSES.stalactite, 0, this.ix(alpha) - 1, this.iy(alpha));
  }
}

/** 6. Sombra de Lumi: segue os passos de Lumi com 1 s de atraso, andando pelo chão e repetindo os pulos. */
export class ShadowLumi extends Boss {
  readonly kind = 'boss-sombra';
  readonly bossName = 'SOMBRA';
  history: { x: number; jumped: boolean }[] = [];
  delay = 60;
  cool = 0;
  constructor(x: number, y: number) {
    super(x, y, 10, 20);
    this.hp = 3;
    this.maxHp = 3;
    this.intro = 60;
    this.gravity = 0.5;
  }
  think(world: World): void {
    const p = world.player;
    this.history.push({ x: p.x, jumped: p.jumping && p.body.vy < -3 });
    const d = this.delay - (this.maxHp - this.hp) * 12;
    const b = this.body;
    if (this.history.length > d) {
      const h = this.history.shift()!;
      const dx = h.x - b.x;
      b.vx = approach(b.vx, clamp(dx * 0.2, -1.8, 1.8), 0.25);
      // repete o pulo só quando longe de Lumi: perto, fica no chão e pode ser pisada
      if (h.jumped && b.onGround && Math.abs(p.cx - this.cx) > 60) {
        b.vy = -5;
        sfx('jump');
      }
      if (Math.abs(b.vx) > 0.1) this.facing = sign(b.vx);
    } else b.vx = 0;
    b.vy = Math.min(4.5, b.vy + this.gravity);
    moveBody(b, world);
    if (this.cool > 0) this.cool--;
    this.hurts = this.cool === 0;
    this.isEnemy = this.cool === 0;
    world.darkLights.push({ x: this.cx, y: this.cy, r: 24 });
  }
  override onStomp(world: World): boolean {
    this.damage(world);
    this.cool = 70;
    this.body.vx = 0;
    return true;
  }
  override onHit(world: World, source: Entity | null): void {
    if (source && source.kind === 'orb') this.damage(world);
  }
  protected spriteName(): string {
    return 'shadow';
  }
  protected override spriteFrame(): number {
    return Math.floor(this.anim / 8) % 2;
  }
  override draw(r: Renderer, alpha: number): void {
    const x = this.ix(alpha) - 3, y = this.iy(alpha) - 4;
    r.drawSprite(BOSSES.shadow, this.spriteFrame(), x, y, this.facing < 0, true, this.cool > 0 && this.anim % 2 === 0 ? 0.3 : 0.9);
  }
}

/** 7. Capitão Brumo: três fases num só combate. */
export class CaptainBrumo extends Boss {
  readonly kind = 'boss-brumo';
  readonly bossName = 'CAPITAO BRUMO';
  state: 'walk' | 'throw' | 'mist' | 'dash' | 'stun' = 'walk';
  t = 0;
  constructor(x: number, y: number) {
    super(x, y, 18, 30);
    this.hp = 6;
    this.maxHp = 6;
    this.speed = 0.6;
    this.intro = 120;
  }
  get phase(): number {
    return this.hp > 4 ? 1 : this.hp > 2 ? 2 : 3;
  }
  think(world: World): void {
    const p = world.player;
    const b = this.body;
    this.t++;
    if (this.phase >= 3 && this.t % 240 === 0 && world.entities.filter((e) => e.kind === 'sailor').length < 2) {
      world.add(new Sailor(world.camX + (this.t % 480 === 0 ? 16 : 288), world.camY + 100));
    }
    switch (this.state) {
      case 'walk': {
        this.hurts = true;
        this.facing = sign(p.cx - this.cx) || this.facing;
        this.walk(world, 0.5 + this.phase * 0.2);
        if (this.t > 90) {
          this.state = this.phase === 1 || world.rng.chance(0.4) ? 'throw' : 'mist';
          this.t = 0;
        }
        break;
      }
      case 'throw': {
        b.vx = 0;
        b.vy = Math.min(4, b.vy + this.gravity);
        moveBody(b, world);
        if (this.t === 30) {
          const dx = p.cx - this.cx;
          world.add(new Cannonball(this.cx, this.y + 6, clamp(dx / 50, -3, 3), -4.5));
          sfx('throw_');
        }
        if (this.t > 60) {
          this.state = 'walk';
          this.t = 0;
        }
        break;
      }
      case 'mist': {
        // some na névoa e reaparece atrás de Lumi
        this.hurts = false;
        this.isEnemy = false;
        if (this.t === 1) {
          world.poof(this.cx, this.cy, '#9fb3c8');
          sfx('warp');
        }
        if (this.t === 40) {
          b.x = clamp(p.cx - p.facing * 90 - b.w / 2, world.camX + 8, world.camX + 320 - 8 - b.w);
          b.y = p.y + p.h - b.h;
          this.facing = sign(p.cx - this.cx) || 1;
          world.poof(this.cx, this.cy, '#9fb3c8');
        }
        if (this.t > 60) {
          this.isEnemy = true;
          this.hurts = true;
          this.state = 'dash';
          this.t = 0;
        }
        break;
      }
      case 'dash': {
        b.vx = this.facing * 3.2;
        b.vy = Math.min(4, b.vy + this.gravity);
        moveBody(b, world);
        if (this.t % 4 === 0) world.dust(this.cx - this.facing * 8, this.bottom, 1, '#9fb3c8');
        if (b.hitWall !== 0 || this.t > 70) {
          this.state = 'stun';
          this.t = 0;
          b.vx = 0;
          if (b.hitWall !== 0) {
            world.shake = 6;
            sfx('blockhit');
          }
        }
        break;
      }
      case 'stun': {
        b.vx = 0;
        b.vy = Math.min(4, b.vy + this.gravity);
        moveBody(b, world);
        this.hurts = false;
        if (this.t > 100) {
          this.state = 'walk';
          this.t = 0;
          this.hurts = true;
        }
        break;
      }
    }
  }
  override onStomp(world: World): boolean {
    if (this.state === 'mist') return false;
    this.damage(world);
    this.state = 'mist';
    this.t = 0;
    return true;
  }
  override onHit(world: World, source: Entity | null): void {
    if (source && source.kind === 'orb') {
      this.damage(world);
      this.state = 'mist';
      this.t = 0;
    } else if (source && source.kind !== 'player') this.damage(world);
  }
  protected spriteName(): string {
    return this.state === 'stun' ? 'brumoStun' : this.state === 'dash' ? 'brumoDash' : 'brumo';
  }
  protected override spriteFrame(): number {
    return Math.floor(this.anim / 12) % 2;
  }
  override draw(r: Renderer, alpha: number): void {
    if (this.state === 'mist' && this.t > 2 && this.t < 40) return;
    super.draw(r, alpha);
  }
}

export class Cannonball extends Entity {
  readonly kind = 'cannonball';
  constructor(x: number, y: number, vx: number, vy: number) {
    super(x - 5, y - 5, 10, 10);
    this.body.vx = vx;
    this.body.vy = vy;
    this.isEnemy = true;
    this.stompable = false;
    this.spinKillable = false;
  }
  update(world: World): void {
    const b = this.body;
    b.vy = Math.min(5, b.vy + 0.2);
    moveBody(b, world);
    if (b.onGround || b.hitWall !== 0 || this.anim > 200) {
      this.dead = true;
      world.poof(this.cx, this.cy, '#5a6b7a');
      // quebra blocos ao redor
      const tx = Math.floor(this.cx / TILE), ty = Math.floor((this.bottom + 2) / TILE);
      if (ty < world.h && world.get(clamp(tx, 0, world.w - 1), ty) === T.Crack) world.hitBlock(tx, ty, true, false);
    }
  }
  override onHit(): void {}
  draw(r: Renderer, alpha: number): void {
    r.drawSprite(BOSSES.cannonball, 0, this.ix(alpha) - 1, this.iy(alpha) - 1);
  }
}

export function createBoss(name: string, x: number, y: number): Boss | null {
  switch (name) {
    case 'reisiri': return new KingCrab(x, y);
    case 'maemusgo': return new MotherSlug(x, y);
    case 'catavento': return new WindBaron(x, y);
    case 'medusa': return new TideMedusa(x, y);
    case 'broca': return new OldDrill(x, y);
    case 'sombra': return new ShadowLumi(x, y);
    case 'brumo': return new CaptainBrumo(x, y);
    default: return null;
  }
}

export { tcos };
