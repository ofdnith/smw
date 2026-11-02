/** Cena de fase: mundo, renderização, HUD, eventos de fim/morte. */
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import { sequencer } from '../../engine/audio/sequencer';
import { synth } from '../../engine/audio/synth';
import type { Game, Scene } from '../game';
import { World, type RunState } from '../world';
import type { LevelDef } from '../level/format';
import { T, TILE, isSolid, isSlope, isWater } from '../level/tiles';
import { tileFrame, THEMES } from '../../content/art/tilesets';
import { drawBackground } from '../render/backgrounds';
import { drawHud } from '../hud';
import { PauseScene } from './pause';
import { WorldMapScene } from './worldmap';
import { GameOverScene } from './gameover';
import { MUSIC } from '../../content/music';
import { PHYS } from '../entities/player';
import { ITEMS } from '../../content/art/items';
import { encodeInputs, levelSeed, stateHash, type Replay } from '../replay';

export class LevelScene implements Scene {
  world: World;
  level: LevelDef;
  run: RunState;
  checkpoint: { room: number; x: number; y: number } | null = null;
  resultT = 0;
  tileAnim = 0;
  /** chamado ao terminar (para testes/replays) */
  onFinish: ((result: 'goal' | 'secret' | 'died') => void) | null = null;
  musicStarted = false;
  returnToMap = true;
  /** contra-relógio: não toca no arquivo; morrer reinicia do começo; o tempo vira recorde */
  readonly timeAttack: boolean;
  finalTime = -1;
  newRecord = false;
  /** gravação de replay (F8): entrada de cada quadro simulado e estado inicial */
  recording: { masks: number[]; run: RunState } | null = null;

  constructor(level: LevelDef, game: Game, checkpoint: { room: number; x: number; y: number } | null = null, opts: { timeAttack?: boolean } = {}) {
    this.level = level;
    this.timeAttack = opts.timeAttack ?? false;
    if (this.timeAttack) {
      this.run = { lives: 9, amber: 0, power: 'none', reserve: 'none', hasBolota: false, pearlsThisLevel: 0, pearlsSaved: 0, assist: false };
      checkpoint = null;
    } else {
      const slot = game.slot;
      this.run = {
        lives: slot.lives,
        amber: slot.amber,
        power: slot.power,
        reserve: slot.reserve,
        hasBolota: slot.hasBolota,
        pearlsThisLevel: 0,
        pearlsSaved: slot.pearls[level.id] ?? 0,
        assist: game.save.settings.assist,
      };
    }
    this.checkpoint = checkpoint;
    this.world = new World(level, { ...this.run }, checkpoint, game.seed + level.id.length);
    this.run = this.world.run;
    this.world.player.power = this.run.power as 'none';
    if (checkpoint) this.world.checkpoint = checkpoint;
  }

  onEnter(game: Game): void {
    void game;
    this.startMusic();
  }

  private startMusic(): void {
    const name = this.world.room.def.music ?? this.level.music;
    const song = MUSIC[name];
    if (song) sequencer.play(song);
  }

  update(game: Game): void {
    const w = this.world;
    const inp = game.input.state;
    if (!this.musicStarted && synth.ready) {
      this.musicStarted = true;
      this.startMusic();
    }
    if (inp.isPressed('pause') && w.event === 'none' && w.player.deadTimer < 0) {
      sfx('pause');
      game.push(new PauseScene(this));
      return;
    }
    const prevRoom = w.roomIndex;
    if (this.recording) this.recording.masks.push(inp.held);
    w.update();
    if (this.recording && w.event !== 'none' && w.eventTimer === 30) this.saveRecording();
    this.tileAnim = Math.floor(w.frame / 8);
    if (w.roomIndex !== prevRoom) {
      const name = w.room.def.music ?? this.level.music;
      if (sequencer.currentName !== (MUSIC[name]?.name ?? '')) this.startMusic();
    }
    // camadas de música
    sequencer.setLayer('ride', w.player.mounted);
    synth.setUnderwater(w.player.body.inWater);

    if (w.event !== 'none') this.handleEvent(game);
  }

  /** Começa a gravar um replay (a fase deve ter acabado de começar). */
  startRecording(): void {
    this.recording = { masks: [], run: { ...this.run } };
  }

  /** Encerra a gravação e baixa o replay como JSON (formato de tests/replays). */
  saveRecording(): Replay | null {
    const rec = this.recording;
    if (!rec) return null;
    this.recording = null;
    const replay: Replay = {
      level: this.level.id, seed: levelSeed(this.level), inputs: encodeInputs(rec.masks), frames: rec.masks.length,
      event: this.world.event, hash: stateHash(this.world), run: rec.run,
    };
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(replay, null, 1)], { type: 'application/json' }));
      a.download = `${this.level.id}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* sem download (testes) */ }
    return replay;
  }

  /** Sai do contra-relógio de volta para a lista de fases. */
  leaveTimeAttack(game: Game): void {
    game.stopMusic();
    game.transitionTo(() => { game.pop(); game.top?.onEnter?.(game); }, 'fade');
  }

  /** Recomeça a mesma fase no contra-relógio. */
  restartTimeAttack(game: Game): void {
    game.transitionTo(() => { game.pop(); game.push(new LevelScene(this.level, game, null, { timeAttack: true })); }, 'fade');
  }

  private handleTimeAttack(game: Game): void {
    const w = this.world;
    if (w.event === 'died') {
      if (w.eventTimer === 1) sequencer.stop(0.2);
      if (w.eventTimer === 50) {
        this.onFinish?.('died');
        game.transitionTo(() => { game.pop(); game.push(new LevelScene(this.level, game, null, { timeAttack: true })); }, 'iris', w.player.cx - w.camX, w.player.cy - w.camY);
      }
      return;
    }
    if (w.eventTimer === 1) {
      this.finalTime = w.time;
      const best = game.save.records[this.level.id];
      if (this.level.id !== 'EDITOR' && (best === undefined || this.finalTime < best)) {
        game.save.records[this.level.id] = this.finalTime;
        this.newRecord = true;
        game.persist();
      }
      sequencer.stop(0.4);
    }
    if (w.eventTimer === 40) sequencer.play(MUSIC.vitoria);
    if (w.eventTimer === 220) {
      this.onFinish?.(w.event === 'secret' ? 'secret' : 'goal');
      this.leaveTimeAttack(game);
    }
  }

  private handleEvent(game: Game): void {
    if (this.timeAttack) { this.handleTimeAttack(game); return; }
    const w = this.world;
    const slot = game.slot;
    if (w.event === 'died') {
      if (w.eventTimer === 1) {
        sequencer.stop(0.2);
        this.run.lives--;
        slot.deaths++;
      }
      if (w.eventTimer === 60) {
        this.commitRun(game, false);
        if (this.run.lives < 0) {
          this.onFinish?.('died');
          game.transitionTo(() => game.replace(new GameOverScene()), 'fade');
        } else {
          this.onFinish?.('died');
          // reinicia (do checkpoint, se houver)
          const cp = w.checkpoint;
          game.transitionTo(() => game.replace(new LevelScene(this.level, game, cp)), 'iris', w.player.cx - w.camX, w.player.cy - w.camY);
        }
      }
      return;
    }
    // goal / secret
    if (w.eventTimer === 1) {
      sequencer.stop(0.4);
    }
    if (w.eventTimer === 40) {
      const song = MUSIC.vitoria;
      if (song) sequencer.play(song);
    }
    if (w.eventTimer === 200) {
      const secret = w.event === 'secret';
      if (!slot.cleared.includes(this.level.id)) slot.cleared.push(this.level.id);
      if (secret && !slot.secret.includes(this.level.id)) slot.secret.push(this.level.id);
      slot.pearls[this.level.id] = (slot.pearls[this.level.id] ?? 0) | this.run.pearlsThisLevel;
      this.commitRun(game, true);
      this.onFinish?.(secret ? 'secret' : 'goal');
      if (this.returnToMap) game.transitionTo(() => game.replace(new WorldMapScene(game, { justCleared: this.level.id, secret })), 'fade', VIEW_W / 2, VIEW_H / 2, 30);
    }
  }

  private commitRun(game: Game, keepPower: boolean): void {
    const slot = game.slot;
    slot.lives = Math.max(0, this.run.lives);
    slot.amber = this.run.amber;
    slot.power = keepPower ? (this.world.player.power as string) : 'none';
    slot.reserve = this.run.reserve;
    slot.hasBolota = slot.hasBolota || this.run.hasBolota;
    slot.playtimeFrames += this.world.time;
    game.persist();
  }

  // ------------------------------------------------------------- desenho

  draw(r: Renderer, alpha: number, game: Game): void {
    const w = this.world;
    const theme = w.room.theme;
    const camX = Math.round(w.camX);
    const camY = Math.round(w.camY);
    r.camX = camX;
    r.camY = camY;
    if (w.shake > 0) {
      r.shakeX = (w.frame % 2 === 0 ? 1 : -1) * Math.min(3, w.shake / 2);
      r.shakeY = (w.frame % 3 === 0 ? 1 : 0);
    } else {
      r.shakeX = 0;
      r.shakeY = 0;
    }
    w.darkLights = [];

    drawBackground(r, theme, camX, camY, { frame: w.frame, dark: w.room.def.dark, underwater: w.room.def.water !== undefined });
    this.drawTiles(r, camX, camY, 'back');
    for (const e of w.entities) if (e.layer === 'back' && !e.dead) e.draw(r, alpha, w);
    this.drawTiles(r, camX, camY, 'main');
    for (const e of w.entities) if (e.layer === 'main' && !e.dead && !e.carried) e.draw(r, alpha, w);
    w.player.draw(r, alpha, w);
    for (const e of w.entities) if (e.carried && !e.dead) e.draw(r, alpha, w);
    for (const e of w.entities) if (e.layer === 'front' && !e.dead) e.draw(r, alpha, w);
    this.drawTiles(r, camX, camY, 'front');
    // maré
    if (w.tideY >= 0) {
      r.ctx.globalAlpha = 0.55;
      r.fillRect(camX, w.tideY, VIEW_W, w.h * TILE - w.tideY, THEMES[theme].a, true);
      r.ctx.globalAlpha = 1;
      for (let x = 0; x < VIEW_W; x += 8) r.fillRect(camX + x, w.tideY + Math.sin((x + w.frame * 2) / 10) * 1.5, 5, 1, '#ffffff', true);
    }
    // partículas
    for (const p of w.particles) {
      const a = p.fade ? p.life / p.maxLife : 1;
      if (a < 1) r.ctx.globalAlpha = a;
      r.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, p.color, true);
      if (a < 1) r.ctx.globalAlpha = 1;
    }
    // escuridão
    if (w.room.def.dark) {
      const lights = [...w.darkLights];
      const p = w.player;
      lights.push({ x: p.cx, y: p.cy, r: p.power === 'lantern' ? 70 : 34 });
      for (const e of w.entities) if (e.kind === 'orb') lights.push({ x: e.cx, y: e.cy, r: 40 });
      // lâmpadas do cenário
      const tx0 = Math.floor(camX / TILE), tx1 = Math.ceil((camX + VIEW_W) / TILE);
      const ty0 = Math.floor(camY / TILE), ty1 = Math.ceil((camY + VIEW_H) / TILE);
      for (let ty = Math.max(0, ty0); ty < Math.min(w.h, ty1); ty++)
        for (let tx = Math.max(0, tx0); tx < Math.min(w.w, tx1); tx++)
          if (w.get(tx, ty) === T.Lamp) lights.push({ x: tx * TILE + 8, y: ty * TILE + 9, r: 44 });
      r.darkness(lights, 0.94);
    }
    // popups
    for (const p of w.popups) r.text(p.text, p.x - camX, p.y - camY - (50 - p.life) * 0.4, p.color, 'center', '#000000');

    drawHud(r, w, this.level, game, this.timeAttack ? { time: this.finalTime >= 0 ? this.finalTime : w.time, best: game.save.records[this.level.id], record: this.newRecord } : undefined);

    if (game.debug) this.drawDebug(r, game);
    if (this.recording && Math.floor(w.frame / 20) % 2 === 0) { r.circle(VIEW_W - 8, VIEW_H - 8, 3, '#ff3a3a', false); r.text('REC', VIEW_W - 14, VIEW_H - 11, '#ff3a3a', 'right'); }
  }

  private drawTiles(r: Renderer, camX: number, camY: number, pass: 'back' | 'main' | 'front'): void {
    const w = this.world;
    const theme = w.room.theme;
    const tx0 = Math.floor(camX / TILE) - 1, tx1 = Math.ceil((camX + VIEW_W) / TILE) + 1;
    const ty0 = Math.floor(camY / TILE) - 1, ty1 = Math.ceil((camY + VIEW_H) / TILE) + 1;
    const c = r.ctx;
    for (let ty = Math.max(0, ty0); ty < Math.min(w.h, ty1); ty++) {
      for (let tx = Math.max(0, tx0); tx < Math.min(w.w, tx1); tx++) {
        const t = w.get(tx, ty);
        if (t === T.Empty) continue;
        const isBack = t === T.Pillar || t === T.Lamp || t === T.Rope || t === T.Net || t === T.WindUp;
        const isFront = isWater(t);
        if (pass === 'back' && !isBack) continue;
        if (pass === 'main' && (isBack || isFront)) continue;
        if (pass === 'front' && !isFront) continue;
        let mask = 0;
        if (t === T.Solid || t === T.Rock || t === T.Ice) {
          const n = (x: number, y: number): boolean => {
            if (x < 0 || x >= w.w) return true;
            if (y < 0) return false;
            if (y >= w.h) return true;
            const tt = w.get(x, y);
            return isSolid(tt) || isSlope(tt);
          };
          mask = (n(tx, ty - 1) ? 1 : 0) | (n(tx + 1, ty) ? 2 : 0) | (n(tx, ty + 1) ? 4 : 0) | (n(tx - 1, ty) ? 8 : 0);
        }
        if (t === T.Hidden) {
          if (w.revealed.has(ty * w.w + tx)) {
            c.globalAlpha = 0.5;
            const f = tileFrame(theme, T.ItemAmber, 0, tx, ty, 0);
            if (f) r.drawFrame(f, tx * TILE, ty * TILE);
            c.globalAlpha = 1;
          }
          continue;
        }
        const f = tileFrame(theme, t, mask, tx, ty, this.tileAnim);
        if (!f) continue;
        if (isFront) c.globalAlpha = 0.62;
        r.drawFrame(f, tx * TILE, ty * TILE);
        if (isFront) c.globalAlpha = 1;
      }
    }
  }

  private drawDebug(r: Renderer, game: Game): void {
    const w = this.world;
    const p = w.player;
    const lines = [
      `X ${p.x.toFixed(1)} Y ${p.y.toFixed(1)} VX ${p.body.vx.toFixed(2)} VY ${p.body.vy.toFixed(2)}`,
      `CHAO ${p.body.onGround ? 1 : 0} RAMPA ${p.body.onSlope} IMPETO ${p.dashMeter} POSE ${p.pose.toUpperCase()}`,
      `ENT ${w.entities.length} PART ${w.particles.length} FRAME ${w.frame} SALA ${w.roomIndex}`,
      `F2/F3 PULO ${PHYS.jumpV.toFixed(2)} F4/F5 GRAV ${PHYS.grav.toFixed(2)} F6/F7 CORRER ${PHYS.runMax.toFixed(2)}`,
    ];
    r.fillRect(0, VIEW_H - 40, VIEW_W, 40, 'rgba(0,0,0,0.6)');
    lines.forEach((l, i) => r.text(l, 2, VIEW_H - 38 + i * 9, '#9cf29c'));
    // hitboxes
    r.ctx.strokeStyle = '#ff00ff';
    r.ctx.strokeRect(Math.round(p.x - r.camX) + 0.5, Math.round(p.y - r.camY) + 0.5, p.w, p.h);
    for (const e of w.entities) r.ctx.strokeRect(Math.round(e.x - r.camX) + 0.5, Math.round(e.y - r.camY) + 0.5, e.w, e.h);
    void game;
  }
}

export { ITEMS };
