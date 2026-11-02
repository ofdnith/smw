/** Porta entre salas (apertar cima). */
import type { Renderer } from '../../engine/renderer';
import { Entity } from './base';
import type { World } from '../world';
import { OBJECTS } from '../../content/art/objects';

export class Door extends Entity {
  readonly kind: string;
  constructor(x: number, y: number, kind: string) {
    super(x + 2, y - 32, 12, 32);
    this.kind = kind;
    this.body.noclip = true;
    this.despawnOffscreen = false;
  }
  update(_world: World): void {}
  override onTouch(): boolean {
    return false;
  }
  draw(r: Renderer, alpha: number, world: World): void {
    const near = this.overlaps(world.player);
    r.drawSprite(OBJECTS.door, near ? 1 : 0, this.ix(alpha) - 2, this.iy(alpha));
  }
}
