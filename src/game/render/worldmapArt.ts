/**
 * Arte do mapa-múndi, esculpida uma vez: ilhas com costa irregular, água rasa, praia,
 * planalto com paredão sombreado e decoração temática que evita nós e caminhos.
 */
import { Canvas, Materials, canvasToFrame } from '../../engine/pixelart';
import type { Frame } from '../../engine/sprites';
import { ISLANDS, NODES, EDGES, MAP_W, MAP_H, nodeById, type Island } from '../../content/world';

function hsh(x: number, y = 0): number {
  let v = (x * 374761393 + y * 668265263) | 0;
  v = (v ^ (v >> 13)) * 1274126177;
  return ((v ^ (v >> 16)) >>> 0) / 4294967296;
}

/** Raio da ilha num ângulo (elipse com costa ondulada). */
export function islandRadius(isl: Island, a: number): number {
  const wob = 1 + Math.sin(a * 3 + isl.id * 1.7) * 0.06 + Math.sin(a * 7 + isl.id * 3.1) * 0.035 + Math.sin(a * 13 + isl.id) * 0.018;
  const c = Math.cos(a), s = Math.sin(a);
  return wob / Math.sqrt((c * c) / (isl.rx * isl.rx) + (s * s) / (isl.ry * isl.ry));
}
/** Distância normalizada ao centro (1 = costa). */
function insideness(isl: Island, x: number, y: number): number {
  const dx = x - isl.x, dy = y - isl.y;
  return Math.hypot(dx, dy) / islandRadius(isl, Math.atan2(dy, dx));
}

interface Look { top: string; cliff: string; beach: string; deco: 'palm' | 'tree' | 'peak' | 'coral' | 'crystal' | 'darktree' | 'rock' | 'star' }
const LOOKS: Record<string, Look> = {
  praia: { top: '#f4dc9c', cliff: '#c8964e', beach: '#fff0c8', deco: 'palm' },
  bosque: { top: '#5ab43e', cliff: '#7a5230', beach: '#e8d49a', deco: 'tree' },
  penhasco: { top: '#8ec86a', cliff: '#7a7a92', beach: '#d8d0c0', deco: 'peak' },
  recife: { top: '#f8a8c8', cliff: '#c87a5a', beach: '#ffe0c8', deco: 'coral' },
  minas: { top: '#e8e4dc', cliff: '#8a8a9c', beach: '#f4f0e8', deco: 'crystal' },
  vale: { top: '#2e5a4a', cliff: '#2a2a3e', beach: '#6a6a7a', deco: 'darktree' },
  farol: { top: '#7a8090', cliff: '#4a4e5c', beach: '#a8a8b0', deco: 'rock' },
  ceu: { top: '#6a5ac8', cliff: '#3a2e7a', beach: '#b8a8f0', deco: 'star' },
};

let cached: Frame | null = null;

/** Distância de um ponto a um segmento. */
function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax, vy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}
function nearRoute(x: number, y: number, margin: number): boolean {
  for (const n of NODES) if (Math.hypot(n.x - x, n.y - y) < margin + 4) return true;
  for (const e of EDGES) {
    const a = nodeById(e.a), b = nodeById(e.b);
    if (segDist(x, y, a.x, a.y, b.x, b.y) < margin) return true;
  }
  return false;
}

export function mapBaseFrame(): Frame {
  if (cached) return cached;
  const matDefs: Record<string, string> = { shallow: '#5cc8e8', foam: '#d8f4ff' };
  for (const isl of ISLANDS) {
    const lk = LOOKS[isl.theme] ?? LOOKS.praia;
    matDefs[`top${isl.id}`] = lk.top;
    matDefs[`cliff${isl.id}`] = lk.cliff;
    matDefs[`beach${isl.id}`] = lk.beach;
  }
  Object.assign(matDefs, { palmT: '#a8743e', palmL: '#3faa4a', tree: '#2f8a3a', trunk: '#6a4424', snow: '#f4f8ff', peak: '#8a8aa2', coralP: '#ff7ab0', coralY: '#ffc860', salt: '#ffffff', saltB: '#a8c8e8', dtree: '#1a3a30', rock: '#5a5e6c', star: '#fff6b0' });
  const mats = new Materials(matDefs, '#14202e');
  const c = new Canvas(MAP_W, MAP_H, mats);
  const CLIFF = 5;

  for (const isl of ISLANDS) {
    const lk = LOOKS[isl.theme] ?? LOOKS.praia;
    const x0 = Math.floor(isl.x - isl.rx * 1.3) - 8, x1 = Math.ceil(isl.x + isl.rx * 1.3) + 8;
    const y0 = Math.floor(isl.y - isl.ry * 1.3) - 8, y1 = Math.ceil(isl.y + isl.ry * 1.3) + CLIFF + 8;
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
        const q = insideness(isl, x, y);
        const qc = insideness(isl, x, y - CLIFF); // planalto deslocado para cima: o que sobra embaixo é paredão
        if (q <= 1.0) {
          // planalto: luz de cima-esquerda
          const nx = (x - isl.x) / isl.rx, ny = (y - isl.y) / isl.ry;
          let t = 2;
          if (q > 0.86) t = nx + ny < -0.2 ? 3 : 1;
          else if (nx + ny < -0.9) t = 3;
          if (hsh(x, y) < 0.03) t = Math.max(0, t - 1);
          c.set(x, y, `top${isl.id}`, t);
          if (q > 0.93) c.set(x, y, `beach${isl.id}`, nx + ny < 0 ? 3 : 2);
        } else if (qc <= 1.0 && y > isl.y) {
          // paredão sob o planalto
          const band = (y - isl.y) % 3 === 0 ? 1 : 2;
          c.set(x, y, `cliff${isl.id}`, insideness(isl, x, y - 1) <= 1 ? 3 : band);
        } else if (Math.min(q, qc) <= 1.18 && !c.get(x, y)) {
          c.set(x, y, 'shallow', hsh(x, y) < 0.12 ? 3 : 2);
        }
      }
    // espuma na borda da água rasa
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const p = c.get(x, y);
        if (!p || p.m !== mats.get('shallow').index) continue;
        if (!c.get(x, y + 1) || !c.get(x + 1, y) || !c.get(x - 1, y) || !c.get(x, y - 1)) c.set(x, y, 'foam', (x + y) % 3 ? 3 : 4);
      }
    void lk;
  }
  // contorno da costa (entre terra e água rasa)
  const shallow = mats.get('shallow').index, foam = mats.get('foam').index;
  const land = (x: number, y: number): boolean => { const p = c.get(x, y); return !!p && p.m !== shallow && p.m !== foam && p.m >= 0; };
  const marks: [number, number][] = [];
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const p = c.get(x, y);
    if (p && (p.m === shallow || p.m === foam) && (land(x + 1, y) || land(x - 1, y) || land(x, y + 1) || land(x, y - 1))) marks.push([x, y]);
  }
  for (const [x, y] of marks) c.ink(x, y);

  // decoração: grade com espaçamento mínimo, longe de nós e caminhos
  for (const isl of ISLANDS) {
    const lk = LOOKS[isl.theme] ?? LOOKS.praia;
    const step = lk.deco === 'star' ? 9 : 10;
    let k = 0;
    for (let gy = isl.y - isl.ry; gy <= isl.y + isl.ry; gy += step)
      for (let gx = isl.x - isl.rx; gx <= isl.x + isl.rx; gx += step) {
        k++;
        const x = Math.round(gx + (hsh(k, isl.id) - 0.5) * step * 0.7), y = Math.round(gy + (hsh(k, isl.id + 50) - 0.5) * step * 0.7);
        if (insideness(isl, x, y) > 0.8 || insideness(isl, x, y - 10) > 0.85) continue;
        if (hsh(k, isl.id + 99) > 0.62) continue;
        if (nearRoute(x, y, 7) || nearRoute(x, y - 6, 6)) continue;
        deco(c, lk.deco, x, y, k);
      }
  }
  cached = canvasToFrame(c);
  return cached;
}

function deco(c: Canvas, kind: Look['deco'], x: number, y: number, k: number): void {
  const L = c.layer();
  switch (kind) {
    case 'palm':
      for (let i = 0; i < 7; i++) L.set(x + Math.round(Math.sin(i / 3) * 1), y - i, 'palmT', i % 2 ? 1 : 3);
      for (const [dx, dy] of [[-4, -6], [4, -6], [-3, -9], [3, -9], [0, -10]] as [number, number][]) L.line(x, y - 7, x + dx, y + dy + 1, 'palmL', 2, 1);
      break;
    case 'tree':
      L.rect(x - 1, y - 3, 2, 4, 'trunk', 'cyl');
      L.circle(x, y - 6, 3.6, 'tree', 'sphere');
      break;
    case 'darktree':
      L.rect(x - 1, y - 3, 2, 4, 'trunk', 'cyl', 0, -1);
      L.poly([[x - 4, y - 2], [x, y - 11], [x + 4, y - 2]], 'dtree', 'vgrad');
      break;
    case 'peak':
      L.poly([[x - 6, y + 1], [x, y - 9], [x + 6, y + 1]], 'peak', 'vgrad');
      L.poly([[x - 2.5, y - 5], [x, y - 9], [x + 2.5, y - 5]], 'snow', 'flat', 1);
      break;
    case 'coral':
      L.line(x, y, x, y - 6, k % 2 ? 'coralP' : 'coralY', 2, 2).line(x, y - 3, x - 3, y - 6, k % 2 ? 'coralP' : 'coralY', 3).line(x, y - 2, x + 3, y - 5, k % 2 ? 'coralP' : 'coralY', 3);
      break;
    case 'crystal':
      L.poly([[x - 2, y + 1], [x - 1, y - 7], [x + 1, y - 8], [x + 2, y + 1]], 'salt', 'cyl');
      L.poly([[x + 2, y + 1], [x + 3, y - 4], [x + 5, y - 3], [x + 5, y + 1]], 'saltB', 'cyl');
      break;
    case 'rock':
      L.ellipse(x, y - 2, 4, 3, 'rock', 'sphere');
      break;
    case 'star':
      L.set(x, y - 3, 'star', 4).set(x - 1, y - 2, 'star', 3).set(x + 1, y - 2, 'star', 3).set(x, y - 1, 'star', 3).set(x, y - 2, 'star', 4);
      c.draw(L, 0, 0);
      return;
  }
  L.outline();
  c.draw(L, 0, 0);
}
