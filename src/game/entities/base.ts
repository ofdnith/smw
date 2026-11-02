/** Entidade base: corpo físico opcional, ativação por câmera, colisão com Lumi. */
import type { Renderer } from '../../engine/renderer';
import { makeBody, type Body } from '../physics/tilecollision';
import type { World } from '../world';
import type { EntitySpawn } from '../level/format';

export type EntityLayer = 'back' | 'main' | 'front';

export abstract class Entity {
  body: Body;
  /** posição anterior (para interpolação visual) */
  px: number;
  py: number;
  dead = false;
  /** remover ao sair da tela? */
  despawnOffscreen = true;
  /** entidade persiste mesmo fora da câmera (plataformas, chefes) */
  alwaysActive = false;
  layer: EntityLayer = 'main';
  facing = -1;
  spawn: EntitySpawn | null = null;
  /** Pode ser carregada por Lumi? */
  carriable = false;
  /** Está sendo carregada */
  carried = false;
  /** Mata inimigos ao tocar (casco chutado, Bolota rolando) */
  projectile = false;
  /** Inimigo: Lumi pode pisar? recebe dano ao tocar? */
  isEnemy = false;
  stompable = true;
  spinKillable = true;
  spikyTop = false;
  /** Dano ao tocar quando não é pisada */
  hurts = true;
  /** Plataforma sólida para Lumi (plataformas móveis) */
  solidTop = false;
  /** Deslocamento aplicado a quem está em cima neste frame */
  carryDx = 0;
  carryDy = 0;
  /** Id de tipo para a lógica de interação */
  abstract readonly kind: string;
  /** Frames restantes de "atordoado" (0 = normal) */
  stun = 0;
  flash = 0;
  anim = 0;

  constructor(x: number, y: number, w: number, h: number) {
    this.body = makeBody(x, y, w, h);
    this.px = x;
    this.py = y;
  }

  get x(): number { return this.body.x; }
  get y(): number { return this.body.y; }
  get w(): number { return this.body.w; }
  get h(): number { return this.body.h; }
  get cx(): number { return this.body.x + this.body.w / 2; }
  get cy(): number { return this.body.y + this.body.h / 2; }
  get bottom(): number { return this.body.y + this.body.h; }

  /** Posição interpolada para desenhar */
  ix(alpha: number): number { return this.px + (this.body.x - this.px) * alpha; }
  iy(alpha: number): number { return this.py + (this.body.y - this.py) * alpha; }

  /** Chamado antes de update: guarda posição anterior. */
  preUpdate(): void {
    this.px = this.body.x;
    this.py = this.body.y;
    this.anim++;
    if (this.flash > 0) this.flash--;
  }

  abstract update(world: World): void;
  abstract draw(r: Renderer, alpha: number, world: World): void;

  /** Reação ao ser pisada por Lumi. Retorna true se consumiu o pisão (Lumi quica). */
  onStomp(_world: World, _spin: boolean): boolean { return false; }
  /** Reação ao ser atingida por projétil (casco, orbe, Bolota rolando). */
  onHit(_world: World, _source: Entity | null): void {}
  /** Tocada por Lumi sem ser pisão. Retorna true se causou dano. */
  onTouch(_world: World): boolean { return this.isEnemy && this.hurts && this.stun === 0; }
  /** Lumi pega/carrega */
  onPickup(_world: World): void {}
  /** Lumi soltou/chutou */
  onKick(_world: World, _dir: number, _up: boolean): void {}

  overlaps(o: Entity): boolean {
    const a = this.body, b = o.body;
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  overlapsRect(x: number, y: number, w: number, h: number): boolean {
    const a = this.body;
    return a.x < x + w && a.x + a.w > x && a.y < y + h && a.y + a.h > y;
  }

  kill(): void {
    this.dead = true;
  }
}
