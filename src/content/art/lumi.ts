/**
 * Lumi — esculpida em pixel art 16 bits (16x24, pés na linha 22, contorno na 23).
 * Poses paramétricas: pernas, braços, rosto e inclinação combinam para os 19 movimentos.
 * A capa muda de cor com o poder (material 'coat').
 */
import type { Palette } from '../../engine/sprites';
import type { Power } from '../../game/entities/player';
import { Canvas, Materials } from '../../engine/pixelart';

export const LUMI_MATS = new Materials({
  coat: '#f6c22e',
  hat: '#2f4a8c',
  pom: '#eef2ff',
  skin: ['#a8644a', '#e6a07c', '#f7c39b', '#ffdcbe', '#fff1e2'],
  hair: '#7a4428',
  boots: '#d8362a',
  cheek: '#ff8a8a',
});

export const LUMI_PALETTE: Palette = LUMI_MATS.palette();

type Legs = 'stand' | 'walk1' | 'walk2' | 'walk3' | 'run1' | 'run2' | 'run3' | 'jump' | 'fall' | 'tucked' | 'climb1' | 'climb2' | 'kick' | 'sit';
type Arms = 'down' | 'swingF' | 'swingB' | 'up' | 'side' | 'carry' | 'back' | 'out' | 'wave' | 'climbL' | 'climbR' | 'none';
type Face = 'normal' | 'blink' | 'lookup' | 'hurt' | 'back' | 'front' | 'happy';

interface Pose { legs: Legs; arms: Arms; face: Face; lean?: number; drop?: number }

function boot(c: Canvas, x: number, y: number, lift = 0): void {
  c.rect(x, y - lift, 3, 2, 'boots', 'box', 0);
  c.set(x + 2, y - lift + 1, 'boots', 0);
  c.set(x, y - lift, 'boots', 4);
}

function drawLegs(c: Canvas, legs: Legs, dx: number, base: number): void {
  // base = linha do topo das botas (normalmente 21)
  switch (legs) {
    case 'stand': boot(c, 5 + dx, base); boot(c, 9 + dx, base); break;
    case 'walk1': boot(c, 4 + dx, base); boot(c, 10 + dx, base, 1); break;
    case 'walk2': boot(c, 6 + dx, base); boot(c, 8 + dx, base); break;
    case 'walk3': boot(c, 4 + dx, base, 1); boot(c, 10 + dx, base); break;
    case 'run1': boot(c, 3 + dx, base - 1); boot(c, 11 + dx, base, 0); break;
    case 'run2': boot(c, 6 + dx, base, 1); boot(c, 8 + dx, base - 2); break;
    case 'run3': boot(c, 3 + dx, base); boot(c, 11 + dx, base - 1); break;
    case 'jump': boot(c, 4 + dx, base - 1); boot(c, 10 + dx, base - 3); break;
    case 'fall': boot(c, 3 + dx, base); boot(c, 11 + dx, base); break;
    case 'kick': boot(c, 3 + dx, base); boot(c, 11 + dx, base - 2); break;
    case 'tucked': boot(c, 5 + dx, base - 2); boot(c, 9 + dx, base - 2); break;
    case 'climb1': boot(c, 5 + dx, base - 2); boot(c, 9 + dx, base); break;
    case 'climb2': boot(c, 5 + dx, base); boot(c, 9 + dx, base - 2); break;
    case 'sit': boot(c, 10 + dx, base); boot(c, 13 + dx, base); break;
  }
}

/** Braço: ombro → mão; manga da capa e mão de pele. */
function arm(c: Canvas, sx: number, sy: number, hx: number, hy: number, front: boolean): void {
  c.line(sx, sy, hx, hy, 'coat', front ? 3 : 1, 2);
  c.rect(hx, hy + 1, 2, 2, 'skin', 'box');
}

function drawArms(c: Canvas, arms: Arms, dx: number, dy: number, behind: boolean): void {
  const L = (sx: number, sy: number, hx: number, hy: number): void => arm(c, sx + dx, sy + dy, hx + dx, hy + dy, false);
  const R = (sx: number, sy: number, hx: number, hy: number): void => arm(c, sx + dx, sy + dy, hx + dx, hy + dy, true);
  if (behind) {
    switch (arms) {
      case 'down': L(5, 15, 3, 18); break;
      case 'swingF': L(5, 15, 3, 17); break;
      case 'swingB': L(5, 15, 5, 18); break;
      case 'up': L(5, 15, 2, 11); break;
      case 'side': L(5, 15, 1, 15); break;
      case 'carry': L(6, 15, 11, 12); break;
      case 'back': L(5, 15, 2, 17); break;
      case 'out': L(5, 15, 1, 14); break;
      case 'wave': L(5, 15, 3, 18); break;
      case 'climbL': L(5, 15, 3, 10); break;
      case 'climbR': L(5, 15, 4, 13); break;
      default: break;
    }
    return;
  }
  switch (arms) {
    case 'down': R(11, 15, 12, 18); break;
    case 'swingF': R(11, 15, 13, 17); break;
    case 'swingB': R(11, 15, 10, 18); break;
    case 'up': R(11, 15, 13, 10); break;
    case 'side': R(11, 15, 14, 15); break;
    case 'carry': R(11, 15, 13, 12); break;
    case 'back': R(10, 15, 8, 18); break;
    case 'out': R(11, 15, 14, 13); break;
    case 'wave': R(11, 15, 13, 9); break;
    case 'climbL': R(11, 15, 12, 13); break;
    case 'climbR': R(11, 15, 12, 10); break;
    default: break;
  }
}

function drawCoat(c: Canvas, dx: number, dy: number, short = false): void {
  const top = 14 + dy, bot = (short ? 18 : 20) + dy;
  c.poly([[5 + dx, top], [12 + dx, top], [13.6 + dx, bot + 0.95], [3.4 + dx, bot + 0.95]], 'coat', 'sphere');
  for (let x = 4; x <= 13; x++) c.tone(x + dx, bot, -1);
  // costura central e botões
  c.set(9 + dx, top + 2, 'coat', 0).set(9 + dx, top + 4, 'coat', 0);
  // brilho do plástico
  c.set(5 + dx, top + 2, 'coat', 4).set(5 + dx, top + 3, 'coat', 4).set(6 + dx, top + 1, 'coat', 4);
}

function drawHead(c: Canvas, face: Face, dx: number, dy: number): void {
  const X = (v: number): number => v + dx, Y = (v: number): number => v + dy;
  const fx = face === 'front' || face === 'back' ? 8 : 8.8;
  if (face === 'back') {
    c.ellipse(X(8), Y(11.2), 4.8, 3.9, 'hair', 'sphere');
  } else {
    c.ellipse(X(fx - 1.8), Y(10.8), 4, 3.4, 'hair', 'sphere');
    c.ellipse(X(fx), Y(11.5), 4.5, 3.8, 'skin', 'sphere');
    // franja sob a aba
    c.set(X(fx - 3), Y(9), 'hair', 2).set(X(fx - 2), Y(9), 'hair', 1).set(X(fx - 1), Y(9), 'hair', 2).set(X(fx + 2), Y(9), 'hair', 1);
  }
  // gorro: domo, faixa e aba
  c.ellipse(X(8), Y(5.8), 5.4, 3.2, 'hat', 'sphere');
  c.rect(X(3), Y(7), 11, 2, 'hat', 'flat', 0, -1);
  for (let x = 3; x < 14; x += 2) c.tone(X(x), Y(7), 1);
  c.circle(X(8), Y(2.2), 1.9, 'pom', 'sphere');
  if (face === 'back') return;
  // olhos e expressão (virada para a direita)
  const ex1 = face === 'front' ? 6 : 9, ex2 = face === 'front' ? 10 : 12;
  const ey = face === 'lookup' ? 10 : 11;
  const eye = (x: number): void => {
    if (face === 'blink') { c.ink(X(x), Y(ey + 1)); return; }
    if (face === 'happy') { c.ink(X(x - 1), Y(ey + 1)).ink(X(x), Y(ey)).ink(X(x + 1), Y(ey + 1)); return; }
    if (face === 'hurt') { c.ink(X(x - 1), Y(ey)).ink(X(x), Y(ey + 1)).ink(X(x + 1), Y(ey)); return; }
    c.ink(X(x), Y(ey)).ink(X(x), Y(ey + 1));
  };
  eye(ex1);
  eye(ex2);
  c.set(X(ex1 - 1), Y(13), 'cheek', 3);
  if (face === 'front') c.set(X(ex2 + 1), Y(13), 'cheek', 3);
  if (face === 'happy') c.set(X(ex2 - 1), Y(14), 'boots', 1).set(X(ex2 - 2), Y(14), 'boots', 1);
  if (face === 'hurt') c.ink(X(ex2 - 1), Y(14));
}

function lumiFrame(p: Pose): string {
  const c = new Canvas(16, 24, LUMI_MATS);
  const dx = p.lean ?? 0, drop = p.drop ?? 0;
  // camada: cada parte ganha seu próprio contorno antes de ser composta
  const part = (fn: (l: Canvas) => void): void => { const l = c.layer(); fn(l); l.outline(); c.draw(l, 0, 0); };
  if (p.legs === 'tucked') {
    part((l) => drawLegs(l, 'tucked', 0, 21));
    part((l) => drawCoat(l, 0, drop, true));
    part((l) => drawHead(l, p.face, 0, drop - 1));
    part((l) => drawArms(l, 'carry', 0, drop, false));
  } else {
    part((l) => drawArms(l, p.arms, dx, drop, true));
    part((l) => { drawLegs(l, p.legs, 0, 21); drawCoat(l, dx, drop, p.legs === 'sit'); });
    part((l) => drawHead(l, p.face, dx, drop));
    part((l) => drawArms(l, p.arms, dx, drop, false));
  }
  c.innerLine('hat', 'skin');
  c.innerLine('hat', 'hair');
  c.outline();
  return c.toString();
}

const P = (legs: Legs, arms: Arms, face: Face = 'normal', lean = 0, drop = 0): string => lumiFrame({ legs, arms, face, lean, drop });

export type LumiPose =
  | 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'skid' | 'crouch' | 'spin' | 'carryidle' | 'carrywalk' | 'carryjump'
  | 'climb' | 'swim' | 'glide' | 'fly' | 'hurt' | 'victory' | 'lookup' | 'slide';

export const LUMI: Record<LumiPose, string[]> = {
  idle: [P('stand', 'down'), P('stand', 'down', 'blink')],
  walk: [P('walk1', 'swingF'), P('walk2', 'down'), P('walk3', 'swingB'), P('walk2', 'down')],
  run: [P('run1', 'swingF', 'normal', 1), P('run2', 'side', 'normal', 1), P('run3', 'swingB', 'normal', 1), P('run2', 'side', 'normal', 1)],
  jump: [P('jump', 'up')],
  fall: [P('fall', 'out')],
  skid: [P('kick', 'back', 'hurt', -1)],
  crouch: [P('tucked', 'none', 'normal', 0, 4)],
  spin: [P('tucked', 'none', 'front', 0, 2), P('tucked', 'none', 'normal', 0, 2), P('tucked', 'none', 'back', 0, 2), P('tucked', 'none', 'normal', 0, 2)],
  carryidle: [P('stand', 'carry')],
  carrywalk: [P('walk1', 'carry'), P('walk2', 'carry'), P('walk3', 'carry'), P('walk2', 'carry')],
  carryjump: [P('jump', 'carry')],
  climb: [P('climb1', 'climbL', 'back'), P('climb2', 'climbR', 'back')],
  swim: [P('walk1', 'side'), P('walk3', 'up')],
  glide: [P('fall', 'up')],
  fly: [P('run1', 'out', 'normal', 2), P('run3', 'out', 'normal', 2)],
  hurt: [P('fall', 'up', 'hurt')],
  victory: [P('stand', 'wave', 'happy')],
  lookup: [P('stand', 'down', 'lookup')],
  slide: [P('sit', 'back', 'happy', 0, 2)],
};

/** Paleta por poder: a capa muda de cor para leitura instantânea. */
export function lumiDef(power: Power): { palette: Palette } {
  switch (power) {
    case 'shell': return { palette: LUMI_MATS.palette({ coat: '#ff9a7a' }) };
    case 'leaf': return { palette: LUMI_MATS.palette({ coat: '#8ed65a' }) };
    case 'lantern': return { palette: LUMI_MATS.palette({ coat: '#5ab8f0' }) };
    default: return { palette: LUMI_PALETTE };
  }
}

// ------------------------------------------------------------------ acessórios dos poderes

const ACC_MATS = new Materials({ shell: '#f7a8c4', leaf: '#8ed65a', glass: '#9fd8ff', metal: '#9a8a6a', flame: '#ffffff' });
const accSprite = (w: number, h: number, fn: (c: Canvas) => void): string => {
  const c = new Canvas(w, h, ACC_MATS);
  fn(c);
  c.outline();
  return c.toString();
};

export const ACCESSORY = {
  shell: {
    palette: ACC_MATS.palette(),
    frames: [accSprite(7, 6, (c) => {
      c.ellipse(3.5, 3, 2.6, 2.1, 'shell', 'sphere');
      c.set(2, 2, 'shell', 1).set(3, 1, 'shell', 1).set(4, 2, 'shell', 1).set(3, 3, 'shell', 1);
    })],
  },
  leaf: {
    palette: ACC_MATS.palette(),
    frames: [
      accSprite(8, 6, (c) => { c.poly([[1, 4], [4, 1], [7, 0.5], [6, 3], [2, 5]], 'leaf', 'sphere'); c.line(2, 4, 6, 1, 'leaf', 1); }),
      accSprite(8, 6, (c) => { c.poly([[1, 3.5], [4, 1.5], [7, 1.5], [6, 4], [2, 5]], 'leaf', 'sphere'); c.line(2, 4, 6, 2, 'leaf', 1); }),
    ],
  },
  lantern: {
    palette: ACC_MATS.palette(),
    frames: [
      accSprite(4, 6, (c) => { c.rect(1, 1, 2, 1, 'metal', 'flat'); c.rect(1, 2, 2, 3, 'glass', 'box'); c.set(1, 3, 'flame', 4); }),
      accSprite(4, 6, (c) => { c.rect(1, 1, 2, 1, 'metal', 'flat'); c.rect(1, 2, 2, 3, 'glass', 'box'); c.set(2, 3, 'flame', 4); }),
    ],
  },
};
