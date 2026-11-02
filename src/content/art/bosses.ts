/** Chefes: sprites gerados por código + detalhes em texto. */
import type { SpriteDef } from '../../engine/sprites';
import { g } from './gen';

// ---- Rei Siri (32x24)
function kingCrab(legFrame: number, claw: 'down' | 'up' | 'stuck'): string {
  const G = g(32, 24);
  // corpo
  G.ellipse(16, 13, 11, 6, 'r');
  G.ellipse(16, 11, 9, 4, 'R');
  // concha-coroa
  G.ellipse(16, 8, 7, 5, 'p');
  G.rect(11, 2, 10, 2, 'y');
  for (let i = 0; i < 5; i++) G.set(11 + i * 2.25, 1, 'y');
  // olhos em hastes
  G.rect(11, 5, 2, 3, 'k');
  G.rect(19, 5, 2, 3, 'k');
  G.set(11, 4, 'w'); G.set(12, 4, 'w'); G.set(19, 4, 'w'); G.set(20, 4, 'w');
  G.set(12, 4, 'k'); G.set(19, 4, 'k');
  // pernas
  for (let i = 0; i < 3; i++) {
    const off = (i + legFrame) % 2;
    G.line(8 - i * 2, 16 + off, 4 - i * 2, 21 + off, 'R');
    G.line(23 + i * 2, 16 + off, 27 + i * 2, 21 + off, 'R');
  }
  // garra pequena esquerda
  G.ellipse(5, 13, 3, 2, 'r');
  // garra grande direita
  if (claw === 'down') {
    G.ellipse(27, 14, 4, 3, 'r');
    G.rect(29, 12, 3, 2, 'k');
  } else if (claw === 'up') {
    G.ellipse(27, 6, 4, 4, 'r');
    G.rect(29, 2, 3, 3, 'k');
    G.line(24, 10, 26, 8, 'r');
  } else {
    G.ellipse(28, 19, 4, 3, 'r');
    G.rect(27, 21, 5, 3, 'd');
  }
  G.outline();
  return G.toString();
}

// ---- Mãe-Musgo (32x18)
function motherSlug(frame: number, floor: boolean): string {
  const G = g(32, 18);
  G.ellipse(16, 11, 14, 6, 'g');
  G.ellipse(14, 9, 10, 4, 'm');
  for (let i = 0; i < 6; i++) G.set(6 + i * 4 + (frame % 2), 11 + (i % 2), 'G');
  // cabeça
  G.ellipse(27, 8, 4, 4, 'g');
  G.line(28, 4, 30, 1, 'k'); G.line(26, 4, 25, 1, 'k');
  G.set(30, 1, 'e'); G.set(25, 1, 'e');
  G.set(28, 8, 'e'); G.set(29, 8, 'k');
  if (floor) G.rect(2, 16, 28, 2, 'G');
  G.outline();
  return G.toString();
}

// ---- Barão Cata-Vento (28x28): moinho com quatro pás largas e um rosto no eixo
function blades(G: ReturnType<typeof g>, a0: number): void {
  for (let i = 0; i < 4; i++) {
    const a = a0 + (i * Math.PI) / 2;
    const dx = Math.cos(a), dy = Math.sin(a);
    const nx = -dy, ny = dx;
    for (let r = 4; r <= 13; r++) {
      const wdt = r < 7 ? 1 : 2;
      for (let k = -wdt; k <= wdt; k++) {
        const edge = Math.abs(k) === wdt || r === 13;
        G.set(14 + dx * r + nx * k, 14 + dy * r + ny * k, edge ? 'k' : k === 0 ? 'w' : 's');
      }
    }
  }
}
function baronHub(G: ReturnType<typeof g>, dizzy: boolean): void {
  G.circle(14, 14, 5, 'b');
  G.outline();
  G.set(12, 13, dizzy ? 'x' : 'e'); G.set(16, 13, dizzy ? 'x' : 'e');
  G.rect(12, dizzy ? 17 : 16, 5, 1, 'k');
  G.rect(11, 8, 7, 2, 'k');
  G.rect(12, 6, 5, 2, 'k');
  G.set(14, 9, 'y');
}
function baron(blade: number): string {
  const G = g(28, 28);
  blades(G, (blade * Math.PI) / 4);
  baronHub(G, false);
  return G.toString();
}
function baronStopped(): string {
  const G = g(28, 28);
  blades(G, Math.PI / 4);
  baronHub(G, true);
  return G.toString();
}

// ---- Medusa-Maré (26x26)
function medusa(frame: number, lit: boolean): string {
  const G = g(26, 26);
  G.ellipse(13, 9, 12, 8, lit ? 'w' : 'j');
  G.ellipse(13, 7, 9, 5, lit ? 'W' : 'J');
  G.set(9, 9, 'e'); G.set(17, 9, 'e');
  G.rect(11, 13, 4, 1, 'k');
  for (let i = 0; i < 6; i++) {
    const x = 3 + i * 4;
    for (let y = 16; y < 26; y++) {
      const wob = Math.round(Math.sin((y + frame * 3 + i * 2) / 3));
      G.set(x + wob, y, i % 2 ? (lit ? 'W' : 'J') : lit ? 'w' : 'j');
    }
  }
  G.outline(lit ? 'K' : 'k');
  return G.toString();
}

// ---- Velha Broca (28x22)
function drill(frame: number, dizzy: boolean): string {
  const G = g(28, 22);
  // máquina
  G.rect(4, 10, 20, 9, 'm');
  G.rect(5, 11, 18, 3, 'M');
  // rodas
  G.circle(8, 19, 3, 'k'); G.circle(20, 19, 3, 'k');
  G.set(8 + (frame % 2), 19, 'w'); G.set(20 - (frame % 2), 19, 'w');
  // broca
  for (let i = 0; i < 6; i++) G.rect(24 + i * 0.7, 12 + i, Math.max(1, 4 - i * 0.6), 1, i % 2 ? 'd' : 'D');
  // toupeira em cima
  G.ellipse(12, 6, 6, 5, 'b');
  G.set(10, 5, 'e'); G.set(14, 5, 'e');
  if (dizzy) { G.set(10, 5, 'x'); G.set(14, 5, 'x'); }
  G.rect(11, 8, 3, 1, 'p');
  // capacete
  G.rect(7, 1, 10, 2, 'y');
  G.rect(8, 0, 8, 1, 'y');
  G.outline();
  return G.toString();
}

// ---- Sombra de Lumi (16x24): silhueta
const SHADOW = `
......wwww......
.....wwwwww.....
......wwww......
.....kkkkkk.....
....kkkkkkkkk...
...kkkkkkkkkkk..
..kkkkkkkkkkkkk.
..kkkkkkkkkkkkk.
...kkkkkkkkkkk..
...kkekkkkkekk..
...kkkkkkkkkkk..
....kkkkkkkk....
.....kkkkkk.....
....kkkkkkkk....
...kkkkkkkkkk...
...kkkkkkkkkk...
..kkkkkkkkkkkk..
..kkkkkkkkkkkk..
.kkkkkkkkkkkkkk.
.kkkkkkkkkkkkkk.
.kkkkkkkkkkkkkk.
...kkkk..kkkk...
...kkkk..kkkk...
...kkkk..kkkk...`;

// ---- Capitão Brumo (18x30)
function brumo(frame: number, mode: 'walk' | 'dash' | 'stun'): string {
  const G = g(18, 30);
  // casaco (vazio por dentro, névoa)
  G.rect(3, 10, 12, 16, 'c');
  G.rect(4, 11, 10, 14, 'C');
  G.rect(8, 11, 2, 14, 'f'); // abertura com névoa
  // ombros/dragonas
  G.rect(2, 10, 3, 2, 'y'); G.rect(13, 10, 3, 2, 'y');
  // névoa que forma a cabeça
  G.ellipse(9, 6, 5, 4, 'f');
  G.ellipse(9, 7, 4, 3, 'F');
  // chapéu de capitão
  G.rect(3, 2, 12, 2, 'k');
  G.rect(5, 0, 8, 2, 'k');
  G.rect(8, 1, 2, 1, 'y');
  // olhos
  if (mode === 'stun') { G.set(7, 6, 'x'); G.set(11, 6, 'x'); } else { G.set(7, 6, 'e'); G.set(11, 6, 'e'); }
  // cachimbo
  G.line(12, 8, 15, 7, 'k'); G.set(16, 6, 'w');
  // pernas: névoa
  for (let i = 0; i < 3; i++) G.rect(5 + i * 3, 26 + (frame + i) % 2, 2, 3 - (frame + i) % 2, 'f');
  if (mode === 'dash') {
    G.rect(0, 14, 3, 8, 'f');
    G.rect(0, 16, 2, 4, 'F');
  }
  G.outline('k');
  return G.toString();
}

const BOSS_PAL = {
  kingcrab: { '.': null, k: '#2a1010', r: '#e8734a', R: '#b84b2a', p: '#f5b7c8', y: '#ffd24a', w: '#ffffff', d: '#8a6a4a' },
  motherslug: { '.': null, k: '#1a2a1a', g: '#7fbf5a', G: '#4f8a3a', m: '#a8d87a', e: '#ffffff' },
  baron: { '.': null, k: '#2a2a3a', s: '#d8d0c0', S: '#a89880', w: '#f4f0e8', b: '#8a7a5a', e: '#ffffff', x: '#ff6a6a', y: '#ffd24a' },
  medusa: { '.': null, k: '#2a3a5a', K: '#5a7aaa', j: '#6a7fb0', J: '#4a5f90', w: '#dfe8ff', W: '#bfe3ff', e: '#ffffff' },
  drill: { '.': null, k: '#2a1a1a', m: '#8a8a9a', M: '#5a5a6a', d: '#c0c0d0', D: '#808090', b: '#8a6a5a', e: '#1b1b2f', x: '#ff6a6a', p: '#f5a8a0', y: '#ffd24a', w: '#ffffff' },
  shadow: { '.': null, k: '#141428', w: '#3a3a5a', e: '#ff5a5a' },
  brumo: { '.': null, k: '#141c28', c: '#2f4f7f', C: '#1f3a5f', f: '#9fb3c8', F: '#6f829c', y: '#ffd24a', e: '#ff8a3a', x: '#ffffff', w: '#dfe8f2' },
};

export const BOSSES: Record<string, SpriteDef> = {
  kingcrab: { palette: BOSS_PAL.kingcrab, frames: [kingCrab(0, 'down'), kingCrab(1, 'down')] },
  kingcrabRaise: { palette: BOSS_PAL.kingcrab, frames: [kingCrab(0, 'up')] },
  kingcrabStuck: { palette: BOSS_PAL.kingcrab, frames: [kingCrab(0, 'stuck')] },
  motherslug: { palette: BOSS_PAL.motherslug, frames: [motherSlug(0, false), motherSlug(1, false)] },
  motherslugFloor: { palette: BOSS_PAL.motherslug, frames: [motherSlug(0, true), motherSlug(1, true)] },
  baron: { palette: BOSS_PAL.baron, frames: [baron(0), baron(1), baronStopped()] },
  gust: {
    palette: { '.': null, w: '#e8f6ff', W: '#bfe3ff' },
    frames: [`
..wwww..........
.w....ww........
......ww.wwwww..
....www.w.....w.
..ww...w........
.w....w..wwwww..
......w.........
...wwww.........
................`, `
................
...wwww.........
..w....ww.......
.......ww.wwwww.
.....www.w.....w
...ww...w.......
..w....w..wwwww.
.......w........
....wwww........`],
  },
  medusa: { palette: BOSS_PAL.medusa, frames: [medusa(0, false), medusa(1, false)] },
  medusaLit: { palette: BOSS_PAL.medusa, frames: [medusa(0, true), medusa(1, true)] },
  drill: { palette: BOSS_PAL.drill, frames: [drill(0, false), drill(1, false)] },
  drillDizzy: { palette: BOSS_PAL.drill, frames: [drill(0, true), drill(1, true)] },
  shadow: { palette: BOSS_PAL.shadow, frames: [SHADOW, SHADOW] },
  brumo: { palette: BOSS_PAL.brumo, frames: [brumo(0, 'walk'), brumo(1, 'walk')] },
  brumoDash: { palette: BOSS_PAL.brumo, frames: [brumo(0, 'dash'), brumo(1, 'dash')] },
  brumoStun: { palette: BOSS_PAL.brumo, frames: [brumo(0, 'stun'), brumo(1, 'stun')] },
  cannonball: {
    palette: { '.': null, k: '#141c28', g: '#5a6b7a', G: '#3a4652', w: '#9fb3c8' },
    frames: [`
...kkkk...
..kggggk..
.kgwgggGk.
kgwwggggGk
kgwgggggGk
kgggggggGk
kgggggGGGk
.kgGGGGGk.
..kGGGGk..
...kkkk...`],
  },
  stalactite: {
    palette: { '.': null, k: '#4a4a5a', w: '#f0ece0', g: '#c8c4b8' },
    frames: [`
kkkkkkkkkk
kwwwwwwggk
kwwwwwgggk
.kwwwwggk.
.kwwwwggk.
.kwwwgggk.
..kwwggk..
..kwwggk..
..kwwggk..
...kwgk...
...kwgk...
...kwgk...
....kk....
....kk....
....kk....
....kk....`],
  },
};
