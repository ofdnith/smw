/** Lumi: movimento, pulo, cambalhota, carregar, nadar, escalar, planar, montaria. */
import { VIEW_W } from '../../engine/renderer';
import type { Renderer } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import { approach, clamp, sign } from '../../engine/rng';
import { T, TILE, isClimb, isDoor } from '../level/tiles';
import { moveBody, climbableAt, tileTypeAt, aabb } from '../physics/tilecollision';
import { Entity } from './base';
import type { World } from '../world';
import type { InputState } from '../../engine/input';
import { LUMI, lumiDef, ACCESSORY, type LumiPose } from '../../content/art/lumi';
import { BOLOTA } from '../../content/art/bolota';
import { LightOrb, PowerUp } from './items';

/** Constantes de física (ajustáveis pelo painel F1). */
export const PHYS = {
  walkMax: 1.5,
  runMax: 2.6,
  dashMax: 3.4,
  accWalk: 0.055,
  accRun: 0.075,
  decel: 0.06,
  skid: 0.16,
  airControl: 0.75,
  jumpV: -5.2,
  jumpVelBonus: 0.3,
  spinJumpV: -4.3,
  gravHold: 0.26,
  grav: 0.62,
  maxFall: 4.5,
  glideFall: 0.9,
  coyote: 6,
  jumpBuffer: 7,
  bounce: -3.8,
  bounceHold: -5.4,
  dashFillFrames: 8,
  dashDrainFrames: 4,
  swimGrav: 0.09,
  swimKick: -2.1,
  swimMax: 1.45,
  climbSpeed: 1.1,
  iceFactor: 0.35,
};

export type Power = 'none' | 'shell' | 'leaf' | 'lantern';

export let input: InputState;
export function bindInput(i: InputState): void {
  input = i;
}

const SMALL_H = 20;
/** Área de dano: recuo lateral e no topo em relação ao corpo (encostar de raspão não machuca). */
const HURT_INSET_X = 2;
const HURT_INSET_TOP = 4;
const MOUNT_H = 28;
const BODY_W = 10;

export class Player extends Entity {
  readonly kind = 'player';
  world!: World;
  power: Power = 'none';
  dashMeter = 0; // 0..7*dashFillFrames
  coyote = 0;
  jumpBuf = 0;
  jumping = false;
  spinning = false;
  spinT = 0;
  crouching = false;
  sliding = false;
  skidding = false;
  carrying: Entity | null = null;
  invuln = 0;
  deadTimer = -1;
  climbing = false;
  gliding = false;
  gustUsed = false;
  flying = 0;
  swimT = 0;
  mounted = false;
  mountRoll = false;
  mountDoubleJump = false;
  mountAnim = 0;
  lanternCd = 0;
  /** pose atual para desenho */
  pose: LumiPose = 'idle';
  animT = 0;
  walkFrame = 0;
  goalT = -1;
  kickGrace = 0;
  stepSound = 0;
  bolotaSkin: 'normal' | 'pedra' | 'seda' = 'normal';
  swingRope: Entity | null = null;
  frozen = false;
  prevBottom = 0;
  enteringDoor = 0;
  blinkT = 0;
  hurtT = 0;

  constructor(x: number, y: number) {
    super(x, y - SMALL_H, BODY_W, SMALL_H);
    this.facing = 1;
    this.body.cornerCorrect = true;
    this.body.ledgeAssist = true;
  }

  placeAt(x: number, y: number): void {
    this.body.x = x;
    this.body.y = y - this.body.h;
    this.px = this.body.x;
    this.py = this.body.y;
    this.body.vx = 0;
    this.body.vy = 0;
    this.carrying = null;
    this.climbing = false;
    this.gliding = false;
    this.flying = 0;
    this.swingRope = null;
  }

  get protectedLayer(): boolean {
    return this.power !== 'none';
  }

  get bodyBottom(): number {
    return this.body.y + this.body.h;
  }

  /** Centro da cabeça (para luz da lanterna etc.) */
  get headY(): number {
    return this.body.y + 4;
  }

  setMounted(on: boolean): void {
    if (this.mounted === on) return;
    const bottom = this.bodyBottom;
    this.mounted = on;
    this.body.h = on ? MOUNT_H : SMALL_H;
    this.body.y = bottom - this.body.h;
    this.mountRoll = false;
    this.mountDoubleJump = false;
    if (on) sfx('mount');
  }

  update(world: World): void {
    this.world = world;
    if (this.invuln > 0) this.invuln--;
    if (this.kickGrace > 0) this.kickGrace--;
    if (this.lanternCd > 0) this.lanternCd--;
    if (this.hurtT > 0) this.hurtT--;
    this.animT++;
    this.prevBottom = this.bodyBottom;

    if (this.deadTimer >= 0) {
      this.updateDead(world);
      return;
    }
    if (world.event === 'goal' || world.event === 'secret') {
      this.updateGoal(world);
      return;
    }
    if (this.enteringDoor > 0) {
      this.enteringDoor--;
      this.pose = 'idle';
      return;
    }
    if (this.frozen) {
      this.pose = 'idle';
      return;
    }

    const b = this.body;
    const inp = input;
    const ax = inp.axisX;
    const wind = world.room.def.wind ?? 0;

    // ----- escalada -----
    if (this.climbing) {
      this.updateClimb(world);
      return;
    }
    // ----- corda de balanço -----
    if (this.swingRope) {
      this.updateSwing(world);
      return;
    }
    // ----- água -----
    const water = world.waterAt(this.cx, this.cy) && !(this.mounted && this.bolotaSkin === 'pedra');
    if (water) {
      this.updateSwim(world);
      return;
    }
    this.swimT = 0;

    // ----- entrar em escada/rede -----
    if ((inp.isHeld('up') || (inp.isHeld('down') && !b.onGround)) && !this.mounted && !this.carrying) {
      const t = climbableAt(world, this.cx, this.cy);
      if (t !== T.Empty) {
        this.climbing = true;
        this.gliding = false;
        this.flying = 0;
        b.vx = 0;
        b.vy = 0;
        // centraliza na coluna
        b.x = Math.floor(this.cx / TILE) * TILE + (TILE - b.w) / 2;
        return;
      }
    }

    // ----- porta -----
    if (inp.isPressed('up') && b.onGround) {
      for (const e of world.entities) {
        if (e.kind.startsWith('door') && this.overlaps(e)) {
          const id = parseInt(e.kind.slice(4), 10);
          this.enteringDoor = 20;
          world.useDoor(id, e.spawn!.tx, e.spawn!.ty);
          return;
        }
      }
    }

    const onIce = b.groundType === T.Ice && b.onGround;
    const conveyor = b.onGround ? (b.groundType === T.Conveyor ? 1 : b.groundType === T.ConveyorL ? -1 : 0) : 0;

    // ----- agachar / deslizar -----
    const wantCrouch = inp.isHeld('down') && b.onGround && !this.carrying && !this.mounted;
    this.crouching = wantCrouch && !this.sliding;
    if (wantCrouch && b.onSlope !== 0 && !this.mountRoll) {
      // deslizar sentada na rampa
      this.sliding = true;
    }
    if (this.sliding) {
      if (!b.onGround || (!inp.isHeld('down') && Math.abs(b.vx) < 1.2) || (b.onSlope === 0 && Math.abs(b.vx) < 0.4)) {
        this.sliding = false;
      } else {
        const dir = b.onSlope !== 0 ? -b.onSlope : sign(b.vx);
        b.vx = approach(b.vx, dir * 3.6, b.onSlope !== 0 ? 0.12 : -0.04);
        if (b.onSlope === 0) b.vx = approach(b.vx, 0, 0.05);
        if (b.vx !== 0) this.facing = sign(b.vx);
        if (world.frame % 4 === 0) world.dust(this.cx, this.bodyBottom, 1);
      }
    }

    // ----- rolagem da Bolota -----
    if (this.mounted) {
      if (inp.isHeld('down') && inp.isHeld('run') && b.onGround && !this.mountRoll && Math.abs(ax) === 0) {
        this.mountRoll = true;
        sfx('roll');
      }
      if (this.mountRoll) {
        if (!inp.isHeld('run') || (inp.isHeld('up'))) this.mountRoll = false;
        else {
          const dir = ax !== 0 ? ax : this.facing;
          this.facing = dir;
          b.vx = approach(b.vx, dir * 3.4, 0.25);
          // quebra blocos rachados à frente; sobe degraus de 1 tile
          if (b.hitWall !== 0 && b.onGround) {
            const tx = clamp(Math.floor((b.hitWall > 0 ? b.x + b.w + 1 : b.x - 1) / TILE), 0, world.w - 1);
            const ty0 = Math.floor(b.y / TILE), ty1 = Math.floor((b.y + b.h - 1) / TILE);
            let broke = false;
            for (let ty = Math.max(0, ty0); ty <= Math.min(world.h - 1, ty1); ty++) {
              const t = world.get(tx, ty);
              if (t === T.Crack || t === T.ItemAmber || t === T.ItemPower) {
                world.hitBlock(tx, ty, true, true);
                broke = true;
              }
            }
            const ty = ty1;
            const above = world.get(tx, clamp(ty - 1, 0, world.h - 1));
            const above2 = world.get(tx, clamp(ty - 2, 0, world.h - 1));
            if (broke) {
              b.vx = dir * 3.0;
            } else if (above === T.Empty && above2 === T.Empty) {
              b.y -= TILE;
              b.vx = dir * 3.0;
            } else {
              this.mountRoll = false;
              b.vx = -dir * 1.5;
            }
          }
          if (world.frame % 3 === 0) world.dust(this.cx - this.facing * 8, this.bodyBottom, 1);
        }
      }
    }

    // ----- movimento horizontal -----
    const running = inp.isHeld('run');
    const dashFull = this.dashMeter >= 7 * PHYS.dashFillFrames;
    let maxSpeed = running ? (dashFull ? PHYS.dashMax : PHYS.runMax) : PHYS.walkMax;
    if (this.carrying && !running) maxSpeed = PHYS.walkMax;
    if (this.mounted) maxSpeed *= 1.08;
    if (this.crouching && !this.sliding) maxSpeed = 0;
    const acc = (running ? PHYS.accRun : PHYS.accWalk) * (b.onGround ? 1 : PHYS.airControl) * (onIce ? PHYS.iceFactor : 1);

    if (!this.sliding && !this.mountRoll) {
      if (ax !== 0 && !this.crouching) {
        if (b.onGround && sign(b.vx) === -ax && Math.abs(b.vx) > 1.0) {
          // freada
          b.vx = approach(b.vx, 0, PHYS.skid * (onIce ? 0.3 : 1));
          if (!this.skidding) {
            sfx('skid');
          }
          this.skidding = true;
          if (world.frame % 3 === 0) world.dust(this.cx - ax * 4, this.bodyBottom, 1);
        } else {
          this.skidding = false;
          if (Math.abs(b.vx) < maxSpeed) b.vx = approach(b.vx, ax * maxSpeed, acc);
          else b.vx = approach(b.vx, ax * maxSpeed, b.onGround ? 0.05 : 0.02);
          this.facing = ax;
        }
      } else {
        this.skidding = false;
        const dec = b.onGround ? (onIce ? PHYS.decel * PHYS.iceFactor : PHYS.decel) : 0.01;
        b.vx = approach(b.vx, 0, dec);
      }
    }
    if (conveyor !== 0) b.x += conveyor * 0.8;
    if (wind !== 0 && !b.onGround) b.vx = clamp(b.vx + wind, -4, 4);

    // ----- medidor de ímpeto -----
    const fullMeter = 7 * PHYS.dashFillFrames;
    if (b.onGround && running && Math.abs(b.vx) >= PHYS.runMax - 0.2 && !this.carrying) {
      this.dashMeter = Math.min(fullMeter, this.dashMeter + 1);
    } else if (!b.onGround && dashFull && Math.abs(b.vx) >= PHYS.runMax - 0.2) {
      // mantém no ar enquanto rápido
    } else {
      this.dashMeter = Math.max(0, this.dashMeter - PHYS.dashFillFrames / PHYS.dashDrainFrames);
    }
    if (dashFull && this.dashMeter >= fullMeter && world.frame % 3 === 0 && Math.abs(b.vx) > 2.5) {
      world.particles.push({ x: this.cx - this.facing * 6, y: this.bodyBottom - 4 - (world.frame % 7), vx: -this.facing * 0.5, vy: -0.3, life: 14, maxLife: 14, color: '#fff2a8', size: 2, gravity: 0, fade: true });
    }

    // ----- pulo -----
    if (b.onGround) {
      this.coyote = PHYS.coyote;
      this.jumping = false;
      this.spinning = false;
      this.gliding = false;
      this.gustUsed = false;
      this.mountDoubleJump = false;
      if (this.flying > 0) this.flying = 0;
    } else if (this.coyote > 0) this.coyote--;
    if (inp.isPressed('jump')) this.jumpBuf = PHYS.jumpBuffer;
    else if (this.jumpBuf > 0) this.jumpBuf--;

    const spinPressed = inp.isPressed('spin');
    // desmontar com cambalhota
    if (spinPressed && this.mounted) {
      this.dismount(world, true);
    } else if ((this.jumpBuf > 0 || spinPressed) && (b.onGround || this.coyote > 0) && !this.mountRoll) {
      if (this.crouching && this.isOnPlatformTile(world) && inp.isHeld('down') && !spinPressed) {
        // descer de plataforma
        b.dropThrough = true;
        b.y += 2;
        this.jumpBuf = 0;
      } else {
        this.doJump(world, spinPressed);
      }
    } else if (this.jumpBuf > 0 && this.mounted && !b.onGround && !this.mountDoubleJump && b.vy > -1) {
      // pulo duplo da Bolota
      b.vy = -3.3;
      this.mountDoubleJump = true;
      this.jumpBuf = 0;
      sfx('bounce');
      world.dust(this.cx, this.bodyBottom, 4, '#cfeedd');
    } else if (this.jumpBuf > 0 && !b.onGround && this.power === 'leaf' && !this.mounted) {
      // planar / rajada
      if (inp.isHeld('down') && !this.gustUsed) {
        b.vy = -3.4;
        this.gustUsed = true;
        this.jumpBuf = 0;
        sfx('gust');
        world.dust(this.cx, this.bodyBottom, 5, '#c8f7c5');
      } else if (dashFull && this.flying === 0 && this.jumpBuf > 0 && b.vy > -1 && !this.gliding) {
        this.flying = 120;
        this.jumpBuf = 0;
        sfx('wind');
      }
    }

    // ----- gravidade -----
    const holdJump = inp.isHeld('jump');
    if (this.flying > 0) {
      this.flying--;
      // voo baixo: segurando pulo sobe devagar, soltando desce
      b.vy = approach(b.vy, holdJump ? -1.1 : 0.9, 0.12);
      if (this.flying % 4 === 0) world.dust(this.cx - this.facing * 8, this.cy, 1, '#dff7dc');
      if (!running || Math.abs(b.vx) < 1.2) this.flying = 0;
    } else {
      this.gliding = this.power === 'leaf' && !b.onGround && b.vy > 0 && holdJump && !this.mounted && !this.carrying;
      const g = (this.jumping && holdJump && b.vy < 0) ? PHYS.gravHold : PHYS.grav;
      if (this.gliding) {
        b.vy = approach(b.vy, PHYS.glideFall, b.vy > PHYS.glideFall ? 0.35 : 0.08);
      } else {
        b.vy += g;
        if (b.vy > PHYS.maxFall) b.vy = PHYS.maxFall;
      }
      if (this.gliding && world.frame % 6 === 0) world.dust(this.cx - this.facing * 5, this.y + 2, 1, '#c8f7c5');
    }
    // corrente de vento
    const tcenter = tileTypeAt(world, this.cx, this.cy);
    if (tcenter === T.WindUp) {
      b.vy = approach(b.vy, -2.6, 0.2);
      this.gustUsed = false;
      if (world.frame % 3 === 0) world.particles.push({ x: this.x + world.rng.range(-6, 16), y: this.bodyBottom, vx: 0, vy: -2.5, life: 20, maxLife: 20, color: '#e8f6ff', size: 1, gravity: 0, fade: true });
    }

    // ----- plataformas móveis (antes de mover) -----
    this.ridePlatforms(world);

    // ----- mover -----
    const prevOnGround = b.onGround;
    moveBody(b, world);
    if (b.onGround && !prevOnGround) {
      this.onLand(world);
    }
    if (b.hitCeiling) {
      world.hitBlock(b.ceilTx, b.ceilTy, this.protectedLayer || this.mounted, true);
      // bloco invisível revelado por baixo
      if (world.get(b.ceilTx, b.ceilTy) === T.Hidden) world.hitBlock(b.ceilTx, b.ceilTy, false, true);
    }
    // espinhos / morte
    this.checkHazards(world);

    // ----- cambalhota contínua -----
    if (this.spinning) {
      this.spinT++;
      if (b.onGround) this.spinning = false;
    }

    // ----- carregar -----
    this.updateCarry(world);

    // ----- lanterna -----
    if (this.power === 'lantern' && inp.isPressed('run') && !this.carrying && this.lanternCd === 0 && !this.mounted && !this.crouching) {
      const orbs = world.entities.filter((e) => e.kind === 'orb').length;
      if (orbs < 2) {
        world.add(new LightOrb(this.cx + this.facing * 6, this.y + 8, this.facing * 3.2 + b.vx * 0.3, -1.4));
        this.lanternCd = 14;
        sfx('shoot');
        this.hurtT = 0;
        this.animT = 0;
      }
    }

    // ----- item reservado -----
    if (inp.isPressed('item') && world.run.reserve !== 'none') {
      const kind = world.run.reserve;
      world.run.reserve = 'none';
      const p = new PowerUp(world.camX + VIEW_W / 2 - 8, world.camY + 16, kind, false);
      p.fromReserve = true;
      world.add(p);
      sfx('item');
    }

    // ----- queda fora do mundo -----
    if (b.y > world.h * TILE + 48) {
      this.die(world, true);
    }

    this.choosePose();
    this.mountAnim += Math.abs(b.vx) * 0.25 + (this.mountRoll ? 0.6 : 0);
  }

  private isOnPlatformTile(world: World): boolean {
    const t = world.get(clamp(this.body.groundTx, 0, world.w - 1), clamp(this.body.groundTy, 0, world.h - 1));
    return t === T.Platform || t === T.Bridge || t === T.Crumble;
  }

  doJump(world: World, spin: boolean): void {
    const b = this.body;
    const bonus = PHYS.jumpVelBonus * Math.abs(b.vx);
    b.vy = (spin ? PHYS.spinJumpV : PHYS.jumpV) - bonus * (spin ? 0.6 : 1);
    if (this.mounted) b.vy *= 1.1;
    this.jumping = true;
    this.spinning = spin;
    this.spinT = 0;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.sliding = false;
    this.crouching = false;
    b.onGround = false;
    sfx(spin ? 'spin' : 'jump');
    world.dust(this.cx, this.bodyBottom, 2);
    if (spin && this.carrying) {
      // cambalhota solta o objeto
      this.release(world, false, true);
    }
  }

  private onLand(world: World): void {
    world.dust(this.cx, this.bodyBottom, 2);
    if (this.spinning) this.spinning = false;
    this.flying = 0;
    // pisão em bloco rachado com cambalhota
    const b = this.body;
    if (this.spinT > 0 || this.mountRoll) {
      const tx = b.groundTx, ty = b.groundTy;
      if (b.groundType === T.Crack) {
        world.hitBlock(tx, ty, true);
        b.onGround = false;
        b.vy = -2;
      }
    }
    this.spinT = 0;
  }

  private checkHazards(world: World): void {
    const b = this.body;
    // espinhos: tile sob os pés ou tocando o corpo
    const pts: [number, number][] = [
      [b.x + 3, b.y + b.h - 1], [b.x + b.w - 3, b.y + b.h - 1], [b.x + 3, b.y + 3], [b.x + b.w - 3, b.y + 3],
      [b.x + 2, b.y + b.h / 2], [b.x + b.w - 2, b.y + b.h / 2],
    ];
    for (const [x, y] of pts) {
      const t = tileTypeAt(world, x, y);
      // só conta onde a arte tem pontas (espinhos ocupam a parte de baixo do tile) ou névoa (abaixo da crista)
      const ly = ((y % TILE) + TILE) % TILE;
      if (t === T.Spike && ly < 6) continue;
      if (t === T.Death && ly < 3) continue;
      if (t === T.Spike) {
        if (this.mounted && y > b.y + b.h - 4) {
          // Bolota aguenta espinhos no chão
          continue;
        }
        this.hurt(world);
        return;
      }
      if (t === T.Death) {
        this.die(world, false);
        return;
      }
    }
  }

  private ridePlatforms(world: World): void {
    const b = this.body;
    for (const e of world.entities) {
      if (!e.solidTop || e.dead) continue;
      const top = e.body.y;
      const overlapX = b.x + b.w > e.body.x + 1 && b.x < e.body.x + e.body.w - 1;
      if (!overlapX) continue;
      const bottom = b.y + b.h;
      if (b.vy >= 0 && this.prevBottom <= top + 2 + Math.max(0, e.carryDy) && bottom + b.vy >= top - 1) {
        b.y = top - b.h;
        b.vy = 0;
        b.onGround = true;
        b.x += e.carryDx;
        b.y += e.carryDy;
        if (e.carryDy > 0) b.y = e.body.y + e.carryDy - b.h;
        this.coyote = PHYS.coyote;
        (e as Entity & { ridden?: boolean }).ridden = true;
      }
    }
  }

  private updateClimb(world: World): void {
    const b = this.body;
    const inp = input;
    const t = climbableAt(world, this.cx, this.cy);
    if (t === T.Empty) {
      this.climbing = false;
      return;
    }
    b.vx = 0;
    b.vy = 0;
    const ay = (inp.isHeld('down') ? 1 : 0) - (inp.isHeld('up') ? 1 : 0);
    b.y += ay * PHYS.climbSpeed;
    if (t === T.Net) {
      b.x += inp.axisX * PHYS.climbSpeed;
      if (inp.axisX !== 0) this.facing = inp.axisX;
    }
    if (ay !== 0 && world.frame % 10 === 0) sfx('mapstep');
    // chegou ao chão por baixo
    if (ay > 0) {
      const below = tileTypeAt(world, this.cx, b.y + b.h + 1);
      if (below === T.Solid || below === T.Rock || below === T.Platform) {
        this.climbing = false;
        b.onGround = true;
      }
    }
    if (inp.isPressed('jump')) {
      this.climbing = false;
      b.vy = PHYS.jumpV * 0.8;
      this.jumping = true;
      b.vx = inp.axisX * 1.2;
      sfx('jump');
    }
    this.pose = 'climb';
    this.animT += ay !== 0 ? 1 : 0;
  }

  private updateSwing(_world: World): void {
    const rope = this.swingRope!;
    const b = this.body;
    const r = rope as Entity & { angle: number; length: number; angVel: number; anchorX: number; anchorY: number; detach: () => void };
    b.x = r.anchorX + Math.sin(r.angle) * r.length - b.w / 2;
    b.y = r.anchorY + Math.cos(r.angle) * r.length - 8;
    this.facing = r.angVel > 0 ? 1 : -1;
    if (input.isPressed('jump')) {
      b.vx = Math.cos(r.angle) * r.angVel * r.length * 1.1;
      b.vy = Math.min(-2.5, -Math.abs(Math.sin(r.angle) * r.angVel * r.length) - 3);
      this.jumping = true;
      this.swingRope = null;
      r.detach();
      sfx('jump');
    }
    this.pose = 'climb';
    if (this.swingRope) this.swingRope.carried = false;
  }

  private updateSwim(world: World): void {
    const b = this.body;
    const inp = input;
    if (this.swimT === 0) {
      sfx('splash');
      world.dust(this.cx, b.y + 4, 6, '#bfe9ff');
      if (b.vy > 2) b.vy = 1;
      this.flying = 0;
      this.gliding = false;
    }
    this.swimT++;
    const ax = inp.axisX;
    b.vx = approach(b.vx, ax * PHYS.swimMax, 0.12);
    if (ax !== 0) this.facing = ax;
    b.vy += PHYS.swimGrav;
    if (inp.isPressed('jump')) {
      b.vy = PHYS.swimKick;
      this.jumping = false;
      sfx('swim');
      this.animT = 0;
    }
    if (inp.isHeld('down')) b.vy += 0.04;
    b.vy = clamp(b.vy, -2.6, 1.6);
    // pulo para fora da água na superfície
    const surface = !world.waterAt(this.cx, b.y - 2);
    if (surface && b.vy < 0 && inp.isHeld('jump')) {
      b.vy = Math.min(b.vy, -3.6);
    }
    moveBody(b, world);
    if (b.hitCeiling) world.hitBlock(b.ceilTx, b.ceilTy, this.protectedLayer, true);
    this.checkHazards(world);
    this.updateCarry(world);
    if (this.mounted) this.dismount(world, false);
    this.pose = 'swim';
    if (b.y > world.h * TILE + 48) this.die(world, true);
  }

  private updateCarry(world: World): void {
    const c = this.carrying;
    if (!c) return;
    if (c.dead) {
      this.carrying = null;
      return;
    }
    const b = this.body;
    c.body.x = b.x + (this.facing > 0 ? b.w - 2 : -c.body.w + 2);
    c.body.y = b.y + b.h - c.body.h - 4;
    c.body.vx = 0;
    c.body.vy = 0;
    if (!input.isHeld('run')) {
      const up = input.isHeld('up');
      const down = input.isHeld('down');
      this.release(world, up, down);
    }
  }

  release(world: World, up: boolean, gentle: boolean): void {
    const c = this.carrying;
    if (!c) return;
    this.carrying = null;
    c.carried = false;
    const dir = this.facing;
    c.body.x = this.body.x + (dir > 0 ? this.body.w + 1 : -c.body.w - 1);
    c.onKick(world, dir, up);
    if (gentle && !up) {
      c.body.vx = dir * 0.6;
      c.body.vy = 0;
      c.projectile = false;
      sfx('throw_');
    } else if (up) {
      c.body.vx = this.body.vx * 0.5;
      c.body.vy = -5.5;
      sfx('throw_');
    } else {
      sfx('kick');
    }
    this.kickGrace = 12;
  }

  dismount(world: World, hop: boolean): void {
    if (!this.mounted) return;
    this.setMounted(false);
    const bol = world.entities.find((e) => e.kind === 'bolota' && (e as Entity & { ridden: boolean }).ridden);
    if (bol) {
      const bb = bol as Entity & { ridden: boolean; dismountedAt: number };
      bb.ridden = false;
      bb.dismountedAt = world.frame;
      bol.body.x = this.body.x - 3;
      bol.body.y = this.bodyBottom - bol.body.h;
      bol.body.vx = 0;
      bol.body.vy = hop ? 0 : 0;
      bol.carried = false;
    }
    if (hop) {
      this.body.vy = PHYS.spinJumpV;
      this.spinning = true;
      this.jumping = true;
      this.body.onGround = false;
      sfx('spin');
    }
  }

  /** Interações com entidades: pisar, tocar, pegar. */
  interact(world: World): void {
    if (this.deadTimer >= 0 || world.event !== 'none' || this.enteringDoor > 0) return;
    const b = this.body;
    for (const e of world.entities) {
      if (e.dead || e === this.carrying) continue;
      if (!this.overlaps(e)) continue;
      // montar na Bolota
      if (e.kind === 'bolota') {
        const bb = e as Entity & { ridden: boolean; dismountedAt: number; fleeing: number };
        if (!this.mounted && !bb.ridden && bb.fleeing === 0 && world.frame - (bb.dismountedAt ?? -100) > 20 && b.vy > 0 && this.prevBottom <= e.body.y + 8) {
          bb.ridden = true;
          e.carried = true;
          this.bolotaSkin = (e as Entity & { skin: 'normal' | 'pedra' | 'seda' }).skin;
          this.setMounted(true);
          this.spinning = false;
          this.world.run.hasBolota = true;
          b.y = e.body.y + e.body.h - b.h;
          b.vy = 0;
          this.jumping = false;
        }
        continue;
      }
      if (e.carriable && e.stun > 0 && !e.isEnemy && input.isHeld('run') && !this.carrying && !this.mounted && !this.spinning) {
        this.carrying = e;
        e.carried = true;
        e.onPickup(world);
        continue;
      }
      if (e.isEnemy) {
        this.enemyContact(world, e);
        continue;
      }
      if (e.projectile) {
        if (this.kickGrace === 0 && e.hurts && !(e.kind === 'orb') && this.hurtboxTouches(e)) this.hurt(world);
        continue;
      }
      // itens, gatilhos: a própria entidade trata
      e.onTouch(world);
    }
  }

  private enemyContact(world: World, e: Entity): void {
    const b = this.body;
    // chefe recém-atingido não revida na hora
    if (e.kind.startsWith('boss') && e.flash > 0) return;
    const falling = b.vy > 0 || (this.prevBottom <= e.body.y + 4);
    // na água, só conta como pisão um mergulho claro por cima
    const stomp = falling && this.prevBottom <= e.body.y + (b.inWater ? 4 : e.body.h * 0.5 + 2) && (!b.inWater || b.vy > 0.3);
    const spin = this.spinning || this.mountRoll;
    if (this.mountRoll && e.isEnemy) {
      e.onHit(world, this);
      return;
    }
    // pegar inimigo atordoado
    if (e.carriable && e.stun > 0 && input.isHeld('run') && !this.carrying && !this.mounted && !this.spinning) {
      this.carrying = e;
      e.carried = true;
      e.onPickup(world);
      return;
    }
    if (stomp && e.stompable) {
      if (e.spikyTop && !spin && !this.mounted) {
        this.hurt(world);
        return;
      }
      if (spin && e.spinKillable) {
        e.onHit(world, this);
        b.vy = input.isHeld('jump') ? -4.6 : -3.0;
        sfx('stomp');
        world.poof(e.cx, e.cy);
        return;
      }
      const consumed = e.onStomp(world, spin);
      if (consumed || e.spikyTop) {
        b.vy = input.isHeld('jump') ? PHYS.bounceHold : PHYS.bounce;
        if (this.mounted) b.vy *= 1.05;
        this.jumping = true;
        this.spinning = spin;
        sfx('stomp');
        world.dust(e.cx, e.body.y, 3, '#ffffff');
      }
      return;
    }
    // contato de raspão com inimigo ativo não machuca: a área de dano é menor que o corpo
    if (e.isEnemy && e.stun === 0 && !this.hurtboxTouches(e)) return;
    if (e.onTouch(world)) this.hurt(world);
  }

  /** Área de dano da Lumi (menor que o corpo) contra a caixa do inimigo levemente encolhida. */
  hurtboxTouches(e: Entity): boolean {
    const b = this.body, o = e.body;
    const ex = o.x + Math.min(2, o.w / 4), ew = Math.max(2, o.w - Math.min(4, o.w / 2));
    const ey = o.y + Math.min(2, o.h / 4), eh = Math.max(2, o.h - Math.min(2, o.h / 4));
    return aabb(b.x + HURT_INSET_X, b.y + HURT_INSET_TOP, b.w - HURT_INSET_X * 2, b.h - HURT_INSET_TOP, ex, ey, ew, eh);
  }

  hurt(world: World): void {
    if (this.invuln > 0 || this.deadTimer >= 0 || world.event !== 'none') return;
    if (this.mounted) {
      // Bolota foge
      const bol = world.entities.find((e) => e.kind === 'bolota' && (e as Entity & { ridden: boolean }).ridden);
      this.setMounted(false);
      if (bol) {
        const bb = bol as Entity & { ridden: boolean; fleeing: number; dismountedAt: number };
        bb.ridden = false;
        bb.fleeing = 150;
        bb.dismountedAt = world.frame;
        bol.carried = false;
        bol.body.x = this.body.x;
        bol.body.y = this.bodyBottom - bol.body.h;
        bol.body.vx = this.facing * 1.6;
        bol.body.vy = -3;
        sfx('flee');
      }
      this.body.vy = -3;
      this.invuln = 90;
      this.hurtT = 20;
      return;
    }
    if (this.power !== 'none') {
      this.power = this.power === 'shell' ? 'none' : 'shell';
      if (this.power === 'none') {
        world.run.power = 'none';
      } else world.run.power = this.power;
      this.invuln = 110;
      this.hurtT = 24;
      this.flying = 0;
      this.gliding = false;
      sfx('hurt');
      world.poof(this.cx, this.cy, '#ffd1dc');
      return;
    }
    if (world.run.assist && this.invuln === 0 && world.rng.chance(0.5)) {
      // modo assistido: 50% de chance de só perder o impulso
      this.invuln = 90;
      this.hurtT = 20;
      sfx('hurt');
      return;
    }
    this.die(world, false);
  }

  die(world: World, fell: boolean): void {
    if (this.deadTimer >= 0) return;
    this.deadTimer = 0;
    this.body.noclip = true;
    this.body.vx = 0;
    this.body.vy = fell ? 0 : -5;
    this.carrying = null;
    this.climbing = false;
    this.swingRope = null;
    if (this.mounted) this.setMounted(false);
    world.run.deathsFlag = true;
    sfx('die');
    world.freezeTimer = 20;
  }

  private updateDead(world: World): void {
    this.deadTimer++;
    const b = this.body;
    b.vy += 0.3;
    b.y += b.vy;
    this.pose = 'hurt';
    if (this.deadTimer > 110) world.playerDied();
  }

  private updateGoal(world: World): void {
    const b = this.body;
    if (this.goalT < 0) {
      this.goalT = 0;
      this.carrying = null;
      this.flying = 0;
      this.gliding = false;
      this.mountRoll = false;
    }
    this.goalT++;
    b.vy += PHYS.grav;
    if (b.vy > PHYS.maxFall) b.vy = PHYS.maxFall;
    if (this.goalT < 40) {
      b.vx = approach(b.vx, 0, 0.1);
      if (b.onGround) this.pose = 'victory';
    } else {
      b.vx = approach(b.vx, 1.2, 0.05);
      this.facing = 1;
      this.pose = b.onGround ? 'walk' : 'fall';
      if (b.onGround) this.animT++;
    }
    moveBody(b, world);
  }

  private choosePose(): void {
    const b = this.body;
    const inp = input;
    const speed = Math.abs(b.vx);
    if (this.hurtT > 0 && !this.mounted) {
      this.pose = 'hurt';
      return;
    }
    if (this.flying > 0) {
      this.pose = 'fly';
      return;
    }
    if (this.spinning) {
      this.pose = 'spin';
      return;
    }
    if (this.sliding) {
      this.pose = 'slide';
      return;
    }
    if (this.crouching) {
      this.pose = 'crouch';
      return;
    }
    if (!b.onGround) {
      if (this.gliding) this.pose = 'glide';
      else this.pose = b.vy < 0 ? 'jump' : 'fall';
      if (this.carrying) this.pose = 'carryjump';
      return;
    }
    if (this.skidding) {
      this.pose = 'skid';
      return;
    }
    if (speed > 0.2) {
      const rate = speed >= PHYS.dashMax - 0.2 ? 2 : speed >= PHYS.runMax - 0.3 ? 3 : 5;
      if (this.animT % rate === 0) this.walkFrame++;
      this.pose = this.carrying ? 'carrywalk' : speed >= PHYS.runMax - 0.3 ? 'run' : 'walk';
      if (this.stepSound++ % (speed > 2 ? 8 : 14) === 0 && speed > 0.8) {
        /* passos silenciosos por padrão (a música carrega o ritmo) */
      }
      return;
    }
    if (inp.isHeld('up') && !this.carrying) {
      this.pose = 'lookup';
      return;
    }
    this.pose = this.carrying ? 'carryidle' : 'idle';
  }

  draw(r: Renderer, alpha: number, world: World): void {
    const x = Math.round(this.ix(alpha));
    const y = Math.round(this.iy(alpha));
    if (this.invuln > 0 && this.deadTimer < 0 && Math.floor(this.invuln / 3) % 2 === 0 && world.event === 'none') return;
    const flip = this.facing < 0;
    const def = lumiDef(this.power);
    const bottom = y + this.body.h;
    // Bolota embaixo
    if (this.mounted) {
      const bf = this.mountRoll ? 4 + (Math.floor(this.mountAnim / 2) % 4) : Math.abs(this.body.vx) > 0.3 ? 1 + (Math.floor(this.mountAnim / 3) % 3) : this.body.onGround ? 0 : 1;
      const skin = BOLOTA[this.bolotaSkin];
      r.drawSprite(skin, bf, x + this.body.w / 2 - 10, bottom - 16, flip);
    }
    const poseFrames = LUMI[this.pose];
    const frame = this.pose === 'walk' || this.pose === 'run' || this.pose === 'carrywalk' ? this.walkFrame % poseFrames.length
      : this.pose === 'spin' ? Math.floor(this.spinT / 2) % poseFrames.length
      : this.pose === 'climb' ? Math.floor(this.animT / 8) % poseFrames.length
      : this.pose === 'swim' ? Math.floor(this.animT / 10) % poseFrames.length
      : this.pose === 'fly' ? Math.floor(this.animT / 4) % poseFrames.length
      : this.pose === 'idle' ? (Math.floor(this.animT / 40) % 6 === 5 ? 1 : 0)
      : 0;
    const spriteBottom = this.mounted ? bottom - 10 : bottom;
    const sx = x + this.body.w / 2 - 8;
    const sy = spriteBottom - 24;
    const flipPose = this.pose === 'spin' ? Math.floor(this.spinT / 2) % 4 >= 2 : flip;
    r.drawSprite({ palette: def.palette, frames: poseFrames }, frame, sx, sy, flipPose);
    // acessório do poder
    if (this.power === 'shell' && this.pose !== 'spin') {
      r.drawSprite(ACCESSORY.shell, 0, sx + (flip ? 9 : -1), sy + 10, flip);
    } else if (this.power === 'leaf') {
      r.drawSprite(ACCESSORY.leaf, Math.floor(this.animT / 12) % 2, sx + (flip ? 8 : 2), sy - 3, flip);
    } else if (this.power === 'lantern' && this.pose !== 'spin') {
      r.drawSprite(ACCESSORY.lantern, Math.floor(this.animT / 8) % 2, sx + (flip ? -4 : 12), sy + 10, flip);
    }
  }
}

// extensão de RunState para a flag de morte (evita import circular)
declare module '../world' {
  interface RunState {
    deathsFlag?: boolean;
  }
}

export { aabb, isClimb, isDoor };
