/** Cria entidades a partir dos spawns da fase. */
import type { EntitySpawn } from '../level/format';
import type { World } from '../world';
import type { Entity } from './base';
import { Pearl, Feather, Key, Lock, Checkpoint, Goal, SecretGoal, Ghost, Sign } from './items';
import { Crab, Gull, Urchin, Slug, Puppet, Octopus, Kite, Jelly, Fish, Mole, Bat, Sailor, Flame } from './enemies';
import { Bolota } from './bolota';
import { MovingPlatform, FallingPlatform, Spring, Cannon, Swing, Sawblade, Minecart } from './hazards';
import { createBoss } from './bosses';
import { Door } from './door';

export function createEntity(s: EntitySpawn, world: World): Entity | null {
  const { x, y } = s;
  switch (s.kind) {
    case 'pearl': return new Pearl(x, y);
    case 'feather': return new Feather(x, y);
    case 'key': return new Key(x, y);
    case 'lock': return new Lock(x, y);
    case 'checkpoint': return new Checkpoint(x, y);
    case 'goal': return new Goal(x, y);
    case 'secretGoal': return new SecretGoal(x, y);
    case 'ghost': return new Ghost(x, y);
    case 'sign': return new Sign(x, y);
    case 'bolota': {
      // só aparece se Lumi não está montada e não há outra Bolota
      if (world.player.mounted) return null;
      if (world.entities.some((e) => e.kind === 'bolota')) return null;
      const skin = world.level.island === 5 ? (s.tx % 2 === 0 ? 'pedra' : 'seda') : 'normal';
      return new Bolota(x, y, world.level.bolotaSkin ?? skin);
    }
    case 'crab': return new Crab(x, y);
    case 'gull': return new Gull(x, y);
    case 'urchin': return new Urchin(x, y);
    case 'slug': return new Slug(x, y);
    case 'puppet': return new Puppet(x, y);
    case 'octopus': return new Octopus(x, y);
    case 'kite': return new Kite(x, y);
    case 'jelly': return new Jelly(x, y);
    case 'fish': return new Fish(x, y);
    case 'mole': return new Mole(x, y);
    case 'bat': return new Bat(x, y);
    case 'sailor': return new Sailor(x, y);
    case 'flame': return new Flame(x, y);
    case 'platformH': return new MovingPlatform(x, y, false);
    case 'platformV': return new MovingPlatform(x, y, true);
    case 'fallPlat': return new FallingPlatform(x, y);
    case 'spring': return new Spring(x, y);
    case 'cannon': return new Cannon(x, y, 1);
    case 'cannonL': return new Cannon(x, y, -1);
    case 'swing': return new Swing(x, y);
    case 'sawblade': return new Sawblade(x, y);
    case 'minecart': return new Minecart(x, y);
    case 'boss': return world.level.boss ? createBoss(world.level.boss, x, y) : null;
    default:
      if (s.kind.startsWith('door')) return new Door(x, y, s.kind);
      return null;
  }
}

declare module '../level/format' {
  interface LevelDef {
    bolotaSkin?: 'normal' | 'pedra' | 'seda';
  }
}
