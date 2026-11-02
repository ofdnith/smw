/** Mundo de uma fase: tilemap mutável, entidades, câmera, partículas e eventos. */
import { Rng, clamp } from '../engine/rng';
import { VIEW_W, VIEW_H } from '../engine/renderer';
import { sfx } from '../engine/audio/sfx';
import { T, TILE, isBlock } from './level/tiles';
import { parseLevel, type LevelDef, type Room, type EntitySpawn } from './level/format';
import type { TileMap } from './physics/tilecollision';
import type { Entity } from './entities/base';
import { Player } from './entities/player';
import { createEntity } from './entities/factory';
import { PowerUp, AmberDrop } from './entities/items';

export interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number;
  color: string; size: number; gravity: number; fade?: boolean;
}

export interface Popup { x: number; y: number; text: string; life: number; color: string }

export type WorldEvent = 'none' | 'goal' | 'secret' | 'died' | 'bonus';

export interface RunState {
  lives: number;
  amber: number;
  power: string;
  reserve: string;
  hasBolota: boolean;
  /** pérolas coletadas nesta fase (máscara) */
  pearlsThisLevel: number;
  /** pérolas já salvas (máscara) */
  pearlsSaved: number;
  assist: boolean;
}

export class World implements TileMap {
  level: LevelDef;
  rooms: Room[];
  roomIndex = 0;
  room!: Room;
  w = 0;
  h = 0;
  tiles!: Uint8Array;
  entities: Entity[] = [];
  player!: Player;
  camX = 0;
  camY = 0;
  camLockY: number | null = null;
  /** travas de câmera para salas de chefe */
  camMinX = 0;
  camMaxX = Infinity;
  autoscrollX = 0;
  particles: Particle[] = [];
  popups: Popup[] = [];
  rng: Rng;
  frame = 0;
  shake = 0;
  event: WorldEvent = 'none';
  eventTimer = 0;
  run: RunState;
  /** spawns já ativados nesta sala */
  private spawned = new Set<EntitySpawn>();
  /** spawns mortos (não voltam) por sala */
  private deadSpawns = new Set<string>();
  checkpoint: { room: number; x: number; y: number } | null = null;
  /** tempo na fase (frames) */
  time = 0;
  /** pérola da fase: índice ordinal por posição */
  pearlOrder: EntitySpawn[] = [];
  freezeTimer = 0;
  /** mensagem do faroleiro / placa */
  message: string[] | null = null;
  messageTimer = 0;
  bossHp = -1;
  bossName = '';
  /** tempo de slow-motion assistido */
  slowmo = false;
  /** nível da água dinâmico (maré) em px, -1 = usa tiles */
  tideY = -1;
  darkLights: { x: number; y: number; r: number }[] = [];
  /** blocos revelados pela lanterna (índices) */
  revealed = new Set<number>();
  /** flag: saída secreta encontrada nesta execução */
  foundSecret = false;
  /** entrada por checkpoint */
  startedFromCheckpoint = false;

  constructor(level: LevelDef, run: RunState, checkpoint: { room: number; x: number; y: number } | null = null, seed = 1) {
    this.level = level;
    this.rooms = parseLevel(level);
    this.run = run;
    this.rng = new Rng(seed);
    // ordem das pérolas: pela posição no nível (sala, x)
    for (const r of this.rooms) for (const s of r.spawns) if (s.kind === 'pearl') this.pearlOrder.push(s);
    this.pearlOrder.sort((a, b) => a.room - b.room || a.x - b.x || a.y - b.y);
    this.checkpoint = checkpoint;
    this.enterRoom(checkpoint ? checkpoint.room : 0, checkpoint ? { x: checkpoint.x, y: checkpoint.y } : null);
    this.startedFromCheckpoint = !!checkpoint;
  }

  get(tx: number, ty: number): T {
    return this.tiles[ty * this.w + tx] as T;
  }
  set(tx: number, ty: number, t: T): void {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return;
    this.tiles[ty * this.w + tx] = t;
  }

  enterRoom(index: number, at: { x: number; y: number } | null): void {
    this.roomIndex = index;
    this.room = this.rooms[index];
    this.w = this.room.w;
    this.h = this.room.h;
    this.tiles = new Uint8Array(this.room.tiles);
    this.entities = [];
    this.spawned.clear();
    this.particles = [];
    this.camLockY = this.room.def.lockY !== undefined ? this.room.def.lockY * TILE : null;
    this.camMinX = 0;
    this.camMaxX = Infinity;
    this.autoscrollX = this.room.def.autoscroll ?? 0;
    this.tideY = -1;
    let start = at;
    if (!start) {
      const s = this.room.spawns.find((sp) => sp.kind === 'start');
      start = s ? { x: s.x, y: s.y } : { x: 32, y: (this.h - 2) * TILE };
    }
    if (!this.player) {
      this.player = new Player(start.x, start.y);
    } else {
      this.player.placeAt(start.x, start.y);
    }
    this.player.world = this;
    // câmera inicial centrada
    this.camX = clamp(this.player.cx - VIEW_W / 2, 0, Math.max(0, this.w * TILE - VIEW_W));
    this.camY = this.camLockY ?? clamp(this.player.cy - VIEW_H / 2 - 20, 0, Math.max(0, this.h * TILE - VIEW_H));
    this.activateSpawns(true);
  }

  private spawnKey(s: EntitySpawn): string {
    return `${s.room}:${s.tx}:${s.ty}:${s.kind}`;
  }

  /** Marca um spawn como consumido para não voltar (inimigos derrotados, itens pegos). */
  consumeSpawn(e: Entity): void {
    if (e.spawn) this.deadSpawns.add(this.spawnKey(e.spawn));
  }

  activateSpawns(initial = false): void {
    const margin = initial ? VIEW_W : 48;
    const left = this.camX - margin, right = this.camX + VIEW_W + margin;
    const top = this.camY - 160, bottom = this.camY + VIEW_H + 160;
    for (const s of this.room.spawns) {
      if (this.spawned.has(s)) continue;
      if (s.kind === 'start') continue;
      if (this.deadSpawns.has(this.spawnKey(s))) continue;
      const alwaysKinds = s.kind === 'boss' || s.kind === 'platformH' || s.kind === 'platformV';
      if (!alwaysKinds && (s.x + TILE < left || s.x > right || s.y + TILE < top || s.y - 64 > bottom)) continue;
      const e = createEntity(s, this);
      if (!e) {
        this.spawned.add(s);
        continue;
      }
      e.spawn = s;
      this.spawned.add(s);
      this.entities.push(e);
    }
  }

  add(e: Entity): void {
    this.entities.push(e);
  }

  update(): void {
    this.frame++;
    this.time++;
    if (this.messageTimer > 0) this.messageTimer--;
    if (this.freezeTimer > 0) {
      this.freezeTimer--;
      return;
    }
    if (this.event !== 'none') {
      this.eventTimer++;
    }
    // maré
    const tide = this.room.def.tide;
    if (tide) {
      const phase = (this.frame % tide.period) / tide.period;
      const s = Math.sin(phase * Math.PI * 2); // a maré é cosmética/colisão simples; determinística o suficiente
      this.tideY = (tide.base + s * tide.amp) * TILE;
    }
    // autoscroll
    if (this.autoscrollX && this.event === 'none') {
      this.camMinX = Math.min(this.camMinX + this.autoscrollX, this.w * TILE - VIEW_W);
      this.camMaxX = this.camMinX;
    }

    this.player.preUpdate();
    this.player.update(this);

    for (const e of this.entities) {
      if (e.dead) continue;
      e.preUpdate();
      e.update(this);
      // despawn fora da tela
      if (e.despawnOffscreen && !e.alwaysActive && !e.carried) {
        const dx = e.cx - (this.camX + VIEW_W / 2);
        const dy = e.cy - (this.camY + VIEW_H / 2);
        if (Math.abs(dx) > VIEW_W + 96 || dy > VIEW_H + 200 || dy < -VIEW_H - 300) {
          e.dead = true;
          if (e.spawn) this.spawned.delete(e.spawn); // pode voltar quando a câmera voltar
        }
      }
    }
    // interações
    this.player.interact(this);
    this.entityInteractions();
    this.entities = this.entities.filter((e) => !e.dead);

    this.updateCamera();
    this.activateSpawns();
    this.updateParticles();
    for (const p of this.popups) p.life--;
    this.popups = this.popups.filter((p) => p.life > 0);
    if (this.shake > 0) this.shake--;
  }

  private entityInteractions(): void {
    const es = this.entities;
    for (let i = 0; i < es.length; i++) {
      const a = es[i];
      if (a.dead || !a.projectile) continue;
      for (let j = 0; j < es.length; j++) {
        if (i === j) continue;
        const b = es[j];
        if (b.dead || !b.isEnemy || b.carried) continue;
        if (a.overlaps(b)) b.onHit(this, a);
      }
    }
  }

  updateCamera(): void {
    const p = this.player;
    const maxX = Math.max(0, this.w * TILE - VIEW_W);
    const maxY = Math.max(0, this.h * TILE - VIEW_H);
    // horizontal: janela morta + olhar à frente
    const look = p.facing * 40 * Math.min(1, Math.abs(p.body.vx) / 2 + 0.3);
    const targetX = p.cx + look - VIEW_W / 2;
    const dz = 24;
    let cx = this.camX;
    if (targetX > cx + dz) cx += (targetX - (cx + dz)) * 0.14;
    else if (targetX < cx - dz) cx += (targetX - (cx - dz)) * 0.14;
    cx = clamp(cx, Math.max(0, this.camMinX), Math.min(maxX, this.camMaxX));
    this.camX = cx;
    // vertical
    if (this.camLockY !== null) {
      this.camY = clamp(this.camLockY, 0, maxY);
    } else {
      const want = p.body.y + p.body.h - VIEW_H * 0.62;
      let cy = this.camY;
      if (p.body.onGround || p.climbing || p.body.inWater) {
        cy += (want - cy) * 0.12;
      } else {
        // no ar: só move se Lumi sair da janela
        const topLimit = cy + 36;
        const botLimit = cy + VIEW_H - 48;
        if (p.body.y < topLimit) cy -= (topLimit - p.body.y) * 0.3;
        if (p.body.y + p.body.h > botLimit) cy += (p.body.y + p.body.h - botLimit) * 0.4;
      }
      this.camY = clamp(cy, 0, maxY);
    }
  }

  // ---------- blocos ----------

  /** Lumi (ou algo) bateu num bloco por baixo / Bolota rolou nele. */
  hitBlock(tx: number, ty: number, strong: boolean, byPlayer = true): void {
    const t = this.get(tx, ty);
    if (!isBlock(t) && t !== T.Used) return;
    const px = tx * TILE, py = ty * TILE;
    if (t === T.Crack) {
      if (strong) {
        this.set(tx, ty, T.Empty);
        this.breakEffect(px, py);
        sfx('blockbreak');
      } else {
        sfx('blockhit');
        this.bumpEnemiesAbove(tx, ty);
      }
      return;
    }
    const override = this.room.overrides.get(ty * this.w + tx);
    if (t === T.ItemAmber || t === T.Hidden) {
      this.set(tx, ty, T.Used);
      if (override === 'pearl') {
        this.add(new PowerUp(px, py - TILE, 'pearl', true));
        sfx('item');
      } else {
        this.run.amber++;
        this.add(new AmberDrop(px + 4, py - 8));
        sfx('amber');
        this.checkAmberLife();
      }
      this.bumpEnemiesAbove(tx, ty);
      return;
    }
    if (t === T.ItemPower) {
      this.set(tx, ty, T.Used);
      let kind = override ?? (this.level.island >= 6 ? 'lantern' : this.level.island >= 3 ? 'leaf' : 'shell');
      if (!override && this.run.power === 'none') kind = 'shell';
      this.add(new PowerUp(px, py - TILE, kind, true));
      sfx('item');
      this.bumpEnemiesAbove(tx, ty);
      return;
    }
    if (t === T.Used) {
      sfx('blockhit');
      if (byPlayer) this.bumpEnemiesAbove(tx, ty);
    }
  }

  private bumpEnemiesAbove(tx: number, ty: number): void {
    const x = tx * TILE, y = ty * TILE;
    for (const e of this.entities) {
      if (e.isEnemy && !e.dead && e.overlapsRect(x, y - 4, TILE, 4)) e.onHit(this, null);
    }
  }

  breakEffect(px: number, py: number): void {
    const colors = ['#a67c52', '#d9b382', '#6b4f2e'];
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: px + 4 + (i % 3) * 4, y: py + 4 + Math.floor(i / 3) * 6,
        vx: (i % 3 - 1) * 1.4 + this.rng.range(-0.4, 0.4), vy: -2.5 - this.rng.range(0, 1.5),
        life: 40, maxLife: 40, color: colors[i % 3], size: 3, gravity: 0.18,
      });
    }
  }

  dust(x: number, y: number, n = 3, color = '#e8dcc4'): void {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: x + this.rng.range(-3, 3), y: y + this.rng.range(-2, 0),
        vx: this.rng.range(-0.6, 0.6), vy: this.rng.range(-0.8, -0.2),
        life: 18, maxLife: 18, color, size: 2, gravity: 0, fade: true,
      });
    }
  }

  sparkle(x: number, y: number, color = '#fff7b0', n = 6, speed = 1.5): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.particles.push({
        x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        life: 24, maxLife: 24, color, size: 2, gravity: 0.02, fade: true,
      });
    }
  }

  poof(x: number, y: number, color = '#ffffff'): void {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.particles.push({ x, y, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2 - 0.5, life: 20, maxLife: 20, color, size: 3, gravity: 0.03, fade: true });
    }
  }

  popup(x: number, y: number, text: string, color = '#ffffff'): void {
    this.popups.push({ x, y, text, life: 50, color });
  }

  private updateParticles(): void {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life--;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  checkAmberLife(): void {
    if (this.run.amber >= 100) {
      this.run.amber -= 100;
      this.run.lives = Math.min(99, this.run.lives + 1);
      sfx('oneup');
      this.popup(this.player.cx, this.player.y - 10, '1 VIDA!', '#9cf29c');
    }
  }

  collectPearl(spawn: EntitySpawn | null): void {
    const idx = spawn ? this.pearlOrder.indexOf(spawn) : -1;
    if (idx >= 0) this.run.pearlsThisLevel |= 1 << idx;
    else this.run.pearlsThisLevel |= 4;
    sfx('pearl');
  }

  showMessage(lines: string[], frames = 240): void {
    this.message = lines;
    this.messageTimer = frames;
  }

  /** Lumi encontrou uma porta: troca de sala. */
  useDoor(id: number, fromTx: number, fromTy: number): void {
    // procura par: mesma sala primeiro (outra posição), depois outras salas
    const here = this.room.doors.get(id) ?? [];
    let target: { room: number; tx: number; ty: number } | null = null;
    for (const d of here) if (d.tx !== fromTx || d.ty !== fromTy) target = { room: this.roomIndex, ...d };
    if (!target) {
      for (let i = 0; i < this.rooms.length; i++) {
        if (i === this.roomIndex) continue;
        const ds = this.rooms[i].doors.get(id);
        if (ds && ds.length) {
          target = { room: i, ...ds[0] };
          break;
        }
      }
    }
    if (!target) return;
    sfx('door');
    const at = { x: target.tx * TILE + 2, y: (target.ty + 1) * TILE };
    this.enterRoom(target.room, at);
  }

  /** Fim de fase */
  finish(secret: boolean): void {
    if (this.event !== 'none') return;
    this.event = secret ? 'secret' : 'goal';
    this.eventTimer = 0;
    if (secret) this.foundSecret = true;
  }

  playerDied(): void {
    if (this.event !== 'none') return;
    this.event = 'died';
    this.eventTimer = 0;
  }

  /** Nível de água efetivo em uma coluna/ponto (considera maré). */
  waterAt(x: number, y: number): boolean {
    if (this.tideY >= 0 && y >= this.tideY) return true;
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return false;
    const t = this.get(tx, ty);
    return t === T.Water || t === T.WaterTop;
  }
}
