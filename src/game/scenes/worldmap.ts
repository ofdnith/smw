/** Mapa-múndi: Lumi caminha entre nós; entra em fases e casas de bônus. */
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import { sfx } from '../../engine/audio/sfx';
import { sequencer } from '../../engine/audio/sequencer';
import { synth } from '../../engine/audio/synth';
import { clamp } from '../../engine/rng';
import type { Game, Scene } from '../game';
import { NODES, EDGES, ISLANDS, MAP_W, MAP_H, nodeById, type MapNode, type MapEdge } from '../../content/world';
import { LEVELS } from '../../content/levels';
import { LevelScene } from './level';
import { BonusScene } from './bonus';
import { CutsceneScene, CUTSCENES } from './cutscene';
import { MUSIC } from '../../content/music';
import { LUMI, LUMI_PALETTE, lumiDef } from '../../content/art/lumi';
import { ITEMS } from '../../content/art/items';
import { MAP_ICONS } from '../../content/art/mapicons';
import type { SaveSlot } from '../../engine/save';
import { CreditsScene } from './credits';

export interface MapArrival {
  justCleared: string;
  secret: boolean;
}

export class WorldMapScene implements Scene {
  node: MapNode;
  moving: { from: MapNode; to: MapNode; t: number; edge: MapEdge } | null = null;
  camX = 0;
  camY = 0;
  frame = 0;
  revealEdge: MapEdge | null = null;
  revealT = 0;
  arrival: MapArrival | null;
  walkT = 0;
  facing = 1;
  musicStarted = false;
  queue: (() => void)[] = [];
  banner = 0;

  constructor(game: Game, arrival: MapArrival | null) {
    this.arrival = arrival;
    const slot = game.slot;
    this.node = NODES.find((n) => n.id === slot.node) ?? nodeById('i1-start');
    this.camX = clamp(this.node.x - VIEW_W / 2, 0, MAP_W - VIEW_W);
    this.camY = clamp(this.node.y - VIEW_H / 2, 0, MAP_H - VIEW_H);
    // caminho novo para revelar
    if (arrival) {
      const newly = EDGES.filter((e) => (arrival.secret ? e.secret === arrival.justCleared : e.req === arrival.justCleared) && (e.a === this.node.id || e.b === this.node.id));
      if (newly.length) {
        this.revealEdge = newly[0];
        this.revealT = 0;
      }
      // história
      this.queueStory(game, arrival.justCleared);
    }
  }

  private queueStory(game: Game, clearedId: string): void {
    const slot = game.slot;
    const lvl = LEVELS[clearedId];
    if (!lvl) return;
    const flag = `farol-${lvl.island}`;
    if (lvl.kind === 'farol' && !slot.flags.includes(flag) && CUTSCENES[flag]) {
      slot.flags.push(flag);
      game.persist();
      this.queue.push(() => game.push(new CutsceneScene(CUTSCENES[flag], () => game.pop())));
      if (lvl.island === 7) {
        this.queue.push(() => game.transitionTo(() => game.push(new CreditsScene(() => game.transitionTo(() => game.pop(), 'fade'))), 'fade'));
      }
    }
  }

  onEnter(game: Game): void {
    const slot = game.slot;
    if (!slot.flags.includes('intro')) {
      slot.flags.push('intro');
      game.persist();
      game.push(new CutsceneScene(CUTSCENES.intro, () => game.pop()));
    }
  }

  private unlocked(e: MapEdge, slot: SaveSlot): boolean {
    if (e.req && !slot.cleared.includes(e.req)) return false;
    if (e.secret && !slot.secret.includes(e.secret)) return false;
    return true;
  }

  private neighbors(slot: SaveSlot): { node: MapNode; edge: MapEdge }[] {
    const out: { node: MapNode; edge: MapEdge }[] = [];
    for (const e of EDGES) {
      if (!this.unlocked(e, slot)) continue;
      if (e === this.revealEdge && this.revealT < 60) continue;
      if (e.a === this.node.id) out.push({ node: nodeById(e.b), edge: e });
      else if (e.b === this.node.id) out.push({ node: nodeById(e.a), edge: e });
    }
    return out;
  }

  update(game: Game): void {
    this.frame++;
    const slot = game.slot;
    const inp = game.input.state;
    if (!this.musicStarted && synth.ready) {
      this.musicStarted = true;
      sequencer.play(MUSIC.mapa);
    }
    if (this.revealEdge) {
      this.revealT++;
      if (this.revealT === 1) sfx('mapclear');
      if (this.revealT > 90) this.revealEdge = null;
    }
    if (this.queue.length && !this.revealEdge && !game.transition) {
      const fn = this.queue.shift()!;
      fn();
      return;
    }
    if (this.banner > 0) this.banner--;

    if (this.moving) {
      const m = this.moving;
      m.t += 0.035;
      if (this.frame % 14 === 0) sfx('mapstep');
      this.walkT++;
      if (m.t >= 1) {
        this.node = m.to;
        slot.node = m.to.id;
        game.persist();
        this.moving = null;
        // nós de junção: continua automaticamente se só há um caminho adiante
        const nb = this.neighbors(slot).filter((n) => n.node !== m.from);
        if ((this.node.kind === 'junction' || this.node.kind === 'bridge') && nb.length === 1) {
          this.startMove(nb[0].node, nb[0].edge);
        }
      }
    } else {
      const dx = inp.axisX;
      const dy = (inp.isHeld('down') ? 1 : 0) - (inp.isHeld('up') ? 1 : 0);
      if ((dx !== 0 || dy !== 0) && (inp.isPressed('left') || inp.isPressed('right') || inp.isPressed('up') || inp.isPressed('down'))) {
        const nb = this.neighbors(slot);
        let best: { node: MapNode; edge: MapEdge } | null = null;
        let bestDot = 0.3;
        for (const n of nb) {
          const vx = n.node.x - this.node.x, vy = n.node.y - this.node.y;
          const len = Math.hypot(vx, vy) || 1;
          const dot = (vx / len) * dx + (vy / len) * dy;
          if (dot > bestDot) {
            bestDot = dot;
            best = n;
          }
        }
        if (best) this.startMove(best.node, best.edge);
        else sfx('menu');
      }
      if (inp.isPressed('jump') || inp.isPressed('pause') || inp.isPressed('run')) {
        this.enter(game);
      }
    }
    // câmera
    const px = this.lumiX(), py = this.lumiY();
    this.camX += (clamp(px - VIEW_W / 2, 0, MAP_W - VIEW_W) - this.camX) * 0.1;
    this.camY += (clamp(py - VIEW_H / 2, 0, MAP_H - VIEW_H) - this.camY) * 0.1;
  }

  private startMove(to: MapNode, edge: MapEdge): void {
    this.moving = { from: this.node, to, t: 0, edge };
    this.facing = to.x >= this.node.x ? 1 : -1;
  }

  private enter(game: Game): void {
    const n = this.node;
    if (n.kind === 'bonus') {
      sfx('select');
      game.transitionTo(() => game.push(new BonusScene(n.island)), 'iris', this.lumiX() - this.camX, this.lumiY() - this.camY);
      return;
    }
    if (!n.level) return;
    const def = LEVELS[n.level];
    if (!def) return;
    sfx('select');
    sequencer.stop(0.3);
    game.transitionTo(() => game.replace(new LevelScene(def, game)), 'iris', this.lumiX() - this.camX, this.lumiY() - this.camY);
  }

  lumiX(): number {
    if (!this.moving) return this.node.x;
    const m = this.moving;
    return m.from.x + (m.to.x - m.from.x) * m.t;
  }
  lumiY(): number {
    if (!this.moving) return this.node.y;
    const m = this.moving;
    return m.from.y + (m.to.y - m.from.y) * m.t;
  }

  // ------------------------------------------------------------- desenho

  draw(r: Renderer, _alpha: number, game: Game): void {
    const slot = game.slot;
    const camX = Math.round(this.camX), camY = Math.round(this.camY);
    r.camX = camX;
    r.camY = camY;
    r.shakeX = 0;
    r.shakeY = 0;
    // mar
    r.gradient([[0, '#1f6fae'], [1, '#2f8fcf']]);
    for (let i = 0; i < 40; i++) {
      const x = ((i * 53 + this.frame * 0.3) % (MAP_W + 40)) - 20;
      const y = (i * 37) % MAP_H;
      r.fillRect(x, y + Math.sin((this.frame + i * 10) / 30) * 2, 10, 1, 'rgba(255,255,255,0.35)', true);
    }
    // neblina sobre ilhas não liberadas
    for (const isl of ISLANDS) {
      // sombra/costa
      r.ctx.fillStyle = isl.edge;
      r.ctx.beginPath();
      r.ctx.ellipse(isl.x - camX, isl.y - camY + 3, isl.rx + 4, isl.ry + 4, 0, 0, Math.PI * 2);
      r.ctx.fill();
      r.ctx.fillStyle = isl.color;
      r.ctx.beginPath();
      r.ctx.ellipse(isl.x - camX, isl.y - camY, isl.rx, isl.ry, 0, 0, Math.PI * 2);
      r.ctx.fill();
      // detalhes por tema
      this.islandDetails(r, isl, camX, camY);
    }
    // caminhos
    for (const e of EDGES) {
      const unlocked = this.unlocked(e, slot);
      if (!unlocked) continue;
      const a = nodeById(e.a), b = nodeById(e.b);
      if (!this.nodeReachable(a, slot) || !this.nodeReachable(b, slot)) continue;
      let frac = 1;
      if (e === this.revealEdge) frac = clamp(this.revealT / 60, 0, 1);
      const n = Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 6);
      // revela a partir do nó atual
      const fromA = a.id === this.node.id;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        if (fromA ? t > frac : 1 - t > frac) continue;
        r.fillRect(a.x + (b.x - a.x) * t - 1, a.y + (b.y - a.y) * t - 1, 2, 2, 'rgba(255,255,255,0.8)', true);
      }
    }
    // névoa nas ilhas sem acesso
    for (const isl of ISLANDS) {
      const reachable = NODES.some((n) => n.island === isl.id && this.nodeReachable(n, slot));
      if (!reachable) {
        r.ctx.globalAlpha = 0.75;
        r.ctx.fillStyle = '#9fb3c8';
        r.ctx.beginPath();
        r.ctx.ellipse(isl.x - camX + Math.sin(this.frame / 60) * 2, isl.y - camY, isl.rx + 6, isl.ry + 6, 0, 0, Math.PI * 2);
        r.ctx.fill();
        r.ctx.globalAlpha = 1;
      }
    }
    // nós
    for (const n of NODES) {
      if (!this.nodeReachable(n, slot)) continue;
      this.drawNode(r, n, slot);
    }
    // Lumi
    const lx = Math.round(this.lumiX() - camX), ly = Math.round(this.lumiY() - camY);
    const def = lumiDef(slot.power as 'none');
    const walking = this.moving !== null;
    const frames = walking ? LUMI.walk : LUMI.idle;
    const fi = walking ? Math.floor(this.walkT / 6) % frames.length : Math.floor(this.frame / 40) % 6 === 5 ? 1 : 0;
    r.ctx.globalAlpha = 0.3;
    r.circle(lx, ly + 2, 6, '#000000', false);
    r.ctx.globalAlpha = 1;
    r.drawSprite({ palette: def.palette, frames }, fi, lx - 8, ly - 26 + (walking ? Math.abs(Math.sin(this.walkT / 4)) * -2 : 0), this.facing < 0, false);

    // HUD do mapa
    r.fillRect(0, 0, VIEW_W, 14, 'rgba(0,0,0,0.45)');
    const isl = ISLANDS.find((i) => i.id === this.node.island);
    r.text(isl ? isl.name : '', VIEW_W / 2, 3, '#ffd24a', 'center');
    r.drawSprite({ palette: LUMI_PALETTE, frames: [LUMI.idle[0]] }, 0, 4, -2, false, false);
    r.text(`x${slot.lives}`, 20, 3, '#ffffff');
    r.drawSprite(ITEMS.amber, Math.floor(this.frame / 8) % 4, VIEW_W - 50, 3, false, false);
    r.text(`${slot.amber}`.padStart(2, '0'), VIEW_W - 40, 3, '#ffffff');
    const totalPearls = Object.values(slot.pearls).reduce((s, m) => s + ((m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1)), 0);
    r.drawSprite(ITEMS.pearl, 0, VIEW_W - 110, 2, false, false);
    r.text(`${totalPearls}`, VIEW_W - 98, 3, '#dff6ff');
    // nome da fase
    if (!this.moving && this.node.level) {
      const lvl = LEVELS[this.node.level];
      if (lvl) {
        r.fillRect(0, VIEW_H - 24, VIEW_W, 24, 'rgba(0,0,0,0.55)');
        r.text(`${this.node.level}  ${lvl.name}`, VIEW_W / 2, VIEW_H - 19, '#ffffff', 'center');
        const pm = slot.pearls[this.node.level] ?? 0;
        for (let i = 0; i < 3; i++) {
          r.ctx.globalAlpha = (pm & (1 << i)) ? 1 : 0.25;
          r.drawSprite(ITEMS.pearl, 0, VIEW_W / 2 - 16 + i * 12, VIEW_H - 11, false, false);
          r.ctx.globalAlpha = 1;
        }
        if (slot.secret.includes(this.node.level)) r.text('SEGREDO', VIEW_W - 50, VIEW_H - 11, '#ffd24a');
        else if (lvl.hasSecret) r.text('?', VIEW_W - 20, VIEW_H - 11, '#ffd24a');
      }
    } else if (!this.moving && this.node.kind === 'bonus') {
      r.fillRect(0, VIEW_H - 24, VIEW_W, 24, 'rgba(0,0,0,0.55)');
      r.text('TENDA DA ONDINA', VIEW_W / 2, VIEW_H - 15, '#ffd1dc', 'center');
    }
    if (slot.reserve !== 'none') {
      r.box(VIEW_W / 2 - 11, 16, 22, 22, 'rgba(10,20,40,0.7)', '#c9ccd6');
      const spr = ITEMS[slot.reserve];
      if (spr) r.drawSprite(spr, 0, VIEW_W / 2 - 8, 20, false, false);
    }
  }

  private reachCache: { key: string; set: Set<string> } | null = null;
  private reachable(slot: SaveSlot): Set<string> {
    const key = slot.cleared.join(',') + '|' + slot.secret.join(',');
    if (this.reachCache && this.reachCache.key === key) return this.reachCache.set;
    const set = new Set<string>(['i1-start']);
    const stack = ['i1-start'];
    while (stack.length) {
      const id = stack.pop()!;
      for (const e of EDGES) {
        if (!this.unlocked(e, slot)) continue;
        const other = e.a === id ? e.b : e.b === id ? e.a : null;
        if (other && !set.has(other)) {
          set.add(other);
          stack.push(other);
        }
      }
    }
    this.reachCache = { key, set };
    return set;
  }
  private nodeReachable(n: MapNode, slot: SaveSlot): boolean {
    return this.reachable(slot).has(n.id);
  }

  private drawNode(r: Renderer, n: MapNode, slot: SaveSlot): void {
    const x = n.x, y = n.y;
    const cleared = n.level ? slot.cleared.includes(n.level) : false;
    const secret = n.level ? slot.secret.includes(n.level) : false;
    switch (n.kind) {
      case 'dock':
        r.drawSprite(MAP_ICONS.dock, 0, x - 8, y - 8);
        break;
      case 'level':
      case 'desafio':
        r.drawSprite(MAP_ICONS.level, cleared ? (secret ? 2 : 1) : 0, x - 6, y - 12);
        break;
      case 'forte':
        r.drawSprite(MAP_ICONS.forte, cleared ? 1 : 0, x - 8, y - 16);
        break;
      case 'farol':
      case 'final':
        r.drawSprite(MAP_ICONS.farol, cleared ? 1 + (Math.floor(this.frame / 20) % 2) : 0, x - 8, y - 24);
        break;
      case 'bonus':
        r.drawSprite(MAP_ICONS.tent, 0, x - 8, y - 12);
        break;
      case 'junction':
      case 'bridge':
        r.fillRect(x - 1, y - 1, 3, 3, 'rgba(255,255,255,0.8)', true);
        break;
    }
  }

  private islandDetails(r: Renderer, isl: { id: number; x: number; y: number; rx: number; ry: number }, camX: number, camY: number): void {
    const x = isl.x - camX, y = isl.y - camY;
    const h = (i: number): number => ((Math.sin(i * 12.9898 + isl.id * 78.233) * 43758.5453) % 1 + 1) % 1;
    for (let i = 0; i < 10; i++) {
      const a = h(i) * Math.PI * 2, d = 0.3 + h(i + 50) * 0.6;
      const px = x + Math.cos(a) * isl.rx * d, py = y + Math.sin(a) * isl.ry * d;
      switch (isl.id) {
        case 1: r.fillRect(px, py - 6, 1, 6, '#a8844a', false); r.fillRect(px - 3, py - 8, 7, 2, '#4fa36a', false); break;
        case 2: r.fillRect(px - 2, py - 4, 5, 5, '#2f6a2a', false); r.fillRect(px, py - 6, 1, 3, '#2f6a2a', false); break;
        case 3: r.fillRect(px - 2, py - 3, 4, 4, '#b8b8c8', false); break;
        case 4: r.fillRect(px, py - 2, 2, 3, ['#ff9ac1', '#8fd1b0', '#f2c98a'][i % 3], false); break;
        case 5: r.fillRect(px - 1, py - 4, 2, 5, '#ffffff', false); break;
        case 6: r.fillRect(px - 2, py - 5, 4, 6, '#0f1a24', false); break;
        case 7: if (i < 4) r.fillRect(px - 1, py - 4, 3, 4, '#8a8f9e', false); break;
        case 8: if (this.frame % 60 < 30 || i % 2) r.fillRect(px, py, 1, 1, '#ffffff', false); break;
      }
    }
  }
}
