/** Mapa-múndi: ilhas, nós e caminhos. */

export type NodeKind = 'dock' | 'level' | 'forte' | 'farol' | 'bonus' | 'casino' | 'junction' | 'bridge' | 'final' | 'desafio';

export interface MapNode {
  id: string;
  x: number;
  y: number;
  kind: NodeKind;
  level?: string;
  island: number;
}

export interface MapEdge {
  a: string;
  b: string;
  /** exige fase concluída (saída normal) */
  req?: string;
  /** exige saída secreta dessa fase */
  secret?: string;
}

export interface Island {
  id: number;
  name: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  color: string;
  edge: string;
  theme: string;
}

export const ISLANDS: Island[] = [
  { id: 1, name: 'PRAIA DO SINO', x: 112, y: 226, rx: 86, ry: 36, color: '#f2dca6', edge: '#d9b77a', theme: 'praia' },
  { id: 2, name: 'BOSQUE ENCHARCADO', x: 104, y: 142, rx: 72, ry: 34, color: '#4f8a3a', edge: '#3a6a2a', theme: 'bosque' },
  { id: 3, name: 'PENHASCO DOS VENTOS', x: 112, y: 56, rx: 72, ry: 30, color: '#8a8a9a', edge: '#5a5a6a', theme: 'penhasco' },
  { id: 4, name: 'RECIFE PROFUNDO', x: 266, y: 226, rx: 64, ry: 34, color: '#f49ac1', edge: '#d9a066', theme: 'recife' },
  { id: 5, name: 'MINAS DE SAL', x: 262, y: 142, rx: 64, ry: 32, color: '#e0dcd0', edge: '#9a968a', theme: 'minas' },
  { id: 6, name: 'VALE SEM LUA', x: 278, y: 58, rx: 64, ry: 30, color: '#2a3a4a', edge: '#1a2a3a', theme: 'vale' },
  { id: 7, name: 'FAROL MESTRE', x: 410, y: 154, rx: 55, ry: 66, color: '#5a5f6e', edge: '#3a3f4e', theme: 'farol' },
  { id: 8, name: 'ROTA DAS CONSTELACOES', x: 418, y: 48, rx: 60, ry: 30, color: '#4a3a9a', edge: '#2a2a5a', theme: 'ceu' },
];

export const NODES: MapNode[] = [
  // Ilha 1
  { id: 'i1-start', x: 40, y: 240, kind: 'dock', island: 1 },
  { id: 'l1-1', x: 70, y: 232, kind: 'level', level: '1-1', island: 1 },
  { id: 'l1-2', x: 100, y: 240, kind: 'level', level: '1-2', island: 1 },
  { id: 'l1-3', x: 128, y: 228, kind: 'level', level: '1-3', island: 1 },
  { id: 'l1-s', x: 118, y: 205, kind: 'level', level: '1-S', island: 1 },
  { id: 'b1', x: 148, y: 205, kind: 'bonus', island: 1 },
  { id: 'l1-6', x: 150, y: 248, kind: 'level', level: '1-6', island: 1 },
  { id: 'l1-4', x: 172, y: 240, kind: 'forte', level: '1-4', island: 1 },
  { id: 'l1-5', x: 186, y: 218, kind: 'farol', level: '1-5', island: 1 },
  { id: 'j1', x: 60, y: 200, kind: 'junction', island: 1 },
  // Ilha 2
  { id: 'l2-1', x: 48, y: 160, kind: 'level', level: '2-1', island: 2 },
  { id: 'l2-2', x: 78, y: 148, kind: 'level', level: '2-2', island: 2 },
  { id: 'l2-3', x: 108, y: 156, kind: 'level', level: '2-3', island: 2 },
  { id: 'l2-s', x: 96, y: 125, kind: 'level', level: '2-S', island: 2 },
  { id: 'l2-6', x: 128, y: 168, kind: 'level', level: '2-6', island: 2 },
  { id: 'l2-7', x: 150, y: 160, kind: 'level', level: '2-7', island: 2 },
  { id: 'l2-4', x: 162, y: 140, kind: 'forte', level: '2-4', island: 2 },
  { id: 'l2-5', x: 142, y: 122, kind: 'farol', level: '2-5', island: 2 },
  { id: 'b2', x: 62, y: 125, kind: 'bonus', island: 2 },
  { id: 'c2', x: 120, y: 132, kind: 'casino', island: 2 },
  { id: 'j2', x: 150, y: 95, kind: 'junction', island: 2 },
  // Ilha 3
  { id: 'l3-1', x: 160, y: 70, kind: 'level', level: '3-1', island: 3 },
  { id: 'l3-2', x: 136, y: 78, kind: 'level', level: '3-2', island: 3 },
  { id: 'l3-3', x: 112, y: 70, kind: 'level', level: '3-3', island: 3 },
  { id: 'l3-6', x: 90, y: 78, kind: 'level', level: '3-6', island: 3 },
  { id: 'l3-7', x: 68, y: 72, kind: 'level', level: '3-7', island: 3 },
  { id: 'l3-8', x: 56, y: 54, kind: 'level', level: '3-8', island: 3 },
  { id: 'l3-4', x: 74, y: 40, kind: 'forte', level: '3-4', island: 3 },
  { id: 'l3-5', x: 98, y: 34, kind: 'farol', level: '3-5', island: 3 },
  { id: 'b3', x: 130, y: 44, kind: 'bonus', island: 3 },
  { id: 'j3', x: 180, y: 50, kind: 'junction', island: 3 },
  // Ilha 4
  { id: 'j4', x: 205, y: 240, kind: 'junction', island: 4 },
  { id: 'l4-1', x: 222, y: 226, kind: 'level', level: '4-1', island: 4 },
  { id: 'l4-2', x: 240, y: 246, kind: 'level', level: '4-2', island: 4 },
  { id: 'l4-3', x: 260, y: 232, kind: 'level', level: '4-3', island: 4 },
  { id: 'l4-6', x: 280, y: 250, kind: 'level', level: '4-6', island: 4 },
  { id: 'l4-7', x: 298, y: 236, kind: 'level', level: '4-7', island: 4 },
  { id: 'l4-8', x: 318, y: 224, kind: 'level', level: '4-8', island: 4 },
  { id: 'l4-4', x: 306, y: 206, kind: 'forte', level: '4-4', island: 4 },
  { id: 'l4-5', x: 284, y: 204, kind: 'farol', level: '4-5', island: 4 },
  { id: 'b4', x: 250, y: 208, kind: 'bonus', island: 4 },
  { id: 'c4', x: 232, y: 212, kind: 'casino', island: 4 },
  // Ilha 5
  { id: 'j5', x: 316, y: 180, kind: 'junction', island: 5 },
  { id: 'l5-1', x: 304, y: 150, kind: 'level', level: '5-1', island: 5 },
  { id: 'l5-2', x: 282, y: 162, kind: 'level', level: '5-2', island: 5 },
  { id: 'l5-3', x: 258, y: 156, kind: 'level', level: '5-3', island: 5 },
  { id: 'l5-6', x: 234, y: 166, kind: 'level', level: '5-6', island: 5 },
  { id: 'l5-7', x: 214, y: 150, kind: 'level', level: '5-7', island: 5 },
  { id: 'l5-8', x: 222, y: 130, kind: 'level', level: '5-8', island: 5 },
  { id: 'l5-4', x: 245, y: 124, kind: 'forte', level: '5-4', island: 5 },
  { id: 'l5-5', x: 268, y: 122, kind: 'farol', level: '5-5', island: 5 },
  { id: 'b5', x: 298, y: 128, kind: 'bonus', island: 5 },
  // Ilha 6
  { id: 'j6', x: 240, y: 95, kind: 'junction', island: 6 },
  { id: 'l6-1', x: 230, y: 64, kind: 'level', level: '6-1', island: 6 },
  { id: 'l6-2', x: 252, y: 74, kind: 'level', level: '6-2', island: 6 },
  { id: 'l6-3', x: 274, y: 62, kind: 'level', level: '6-3', island: 6 },
  { id: 'l6-6', x: 296, y: 74, kind: 'level', level: '6-6', island: 6 },
  { id: 'l6-7', x: 318, y: 64, kind: 'level', level: '6-7', island: 6 },
  { id: 'l6-4', x: 326, y: 44, kind: 'forte', level: '6-4', island: 6 },
  { id: 'l6-5', x: 302, y: 42, kind: 'farol', level: '6-5', island: 6 },
  { id: 'b6', x: 270, y: 40, kind: 'bonus', island: 6 },
  { id: 'c6', x: 248, y: 50, kind: 'casino', island: 6 },
  // Ilha 7
  { id: 'j7', x: 365, y: 124, kind: 'junction', island: 7 },
  { id: 'l7-1', x: 392, y: 194, kind: 'level', level: '7-1', island: 7 },
  { id: 'l7-2', x: 424, y: 176, kind: 'level', level: '7-2', island: 7 },
  { id: 'l7-4', x: 440, y: 150, kind: 'level', level: '7-4', island: 7 },
  { id: 'l7-5', x: 420, y: 128, kind: 'level', level: '7-5', island: 7 },
  { id: 'l7-3', x: 400, y: 108, kind: 'final', level: '7-3', island: 7 },
  // Constelações
  { id: 'lc-1', x: 378, y: 62, kind: 'desafio', level: 'C-1', island: 8 },
  { id: 'lc-2', x: 398, y: 68, kind: 'desafio', level: 'C-2', island: 8 },
  { id: 'lc-3', x: 420, y: 64, kind: 'desafio', level: 'C-3', island: 8 },
  { id: 'lc-4', x: 442, y: 60, kind: 'desafio', level: 'C-4', island: 8 },
  { id: 'lc-5', x: 458, y: 44, kind: 'desafio', level: 'C-5', island: 8 },
  { id: 'lc-6', x: 440, y: 34, kind: 'desafio', level: 'C-6', island: 8 },
  { id: 'lc-7', x: 418, y: 30, kind: 'desafio', level: 'C-7', island: 8 },
  { id: 'lc-8', x: 396, y: 36, kind: 'desafio', level: 'C-8', island: 8 },
];

export const EDGES: MapEdge[] = [
  { a: 'i1-start', b: 'l1-1' },
  { a: 'l1-1', b: 'l1-2', req: '1-1' },
  { a: 'l1-2', b: 'l1-3', req: '1-2' },
  { a: 'l1-3', b: 'l1-6', req: '1-3' },
  { a: 'l1-6', b: 'l1-4', req: '1-6' },
  { a: 'l1-3', b: 'l1-s', secret: '1-3' },
  { a: 'l1-s', b: 'b1', req: '1-S' },
  { a: 'b1', b: 'l1-5' },
  { a: 'l1-4', b: 'l1-5', req: '1-4' },
  { a: 'l1-1', b: 'j1', req: '1-5' },
  { a: 'j1', b: 'l2-1' },
  // Ilha 2
  { a: 'l2-1', b: 'l2-2', req: '2-1' },
  { a: 'l2-2', b: 'l2-3', req: '2-2' },
  { a: 'l2-3', b: 'l2-6', req: '2-3' },
  { a: 'l2-6', b: 'l2-7', req: '2-6' },
  { a: 'l2-7', b: 'l2-4', req: '2-7' },
  { a: 'l2-3', b: 'l2-s', secret: '2-3' },
  { a: 'l2-s', b: 'b2', req: '2-S' },
  { a: 'b2', b: 'l2-1' },
  { a: 'l2-2', b: 'c2', req: '2-2' },
  { a: 'l2-4', b: 'l2-5', req: '2-4' },
  { a: 'l2-5', b: 'j2', req: '2-5' },
  { a: 'j2', b: 'l3-1' },
  // Ilha 3
  { a: 'l3-1', b: 'l3-2', req: '3-1' },
  { a: 'l3-2', b: 'l3-3', req: '3-2' },
  { a: 'l3-3', b: 'l3-6', req: '3-3' },
  { a: 'l3-6', b: 'l3-7', req: '3-6' },
  { a: 'l3-7', b: 'l3-8', req: '3-7' },
  { a: 'l3-8', b: 'l3-4', req: '3-8' },
  { a: 'l3-3', b: 'b3', secret: '3-3' },
  { a: 'b3', b: 'l3-5' },
  { a: 'l3-4', b: 'l3-5', req: '3-4' },
  { a: 'l3-1', b: 'j3', req: '3-5' },
  { a: 'j3', b: 'j6' },
  { a: 'j6', b: 'j5' },
  { a: 'j5', b: 'j4' },
  // Ilha 4
  { a: 'j4', b: 'l4-1' },
  { a: 'l4-1', b: 'l4-2', req: '4-1' },
  { a: 'l4-2', b: 'l4-3', req: '4-2' },
  { a: 'l4-3', b: 'l4-6', req: '4-3' },
  { a: 'l4-6', b: 'l4-7', req: '4-6' },
  { a: 'l4-7', b: 'l4-8', req: '4-7' },
  { a: 'l4-8', b: 'l4-4', req: '4-8' },
  { a: 'l4-3', b: 'b4', secret: '4-3' },
  { a: 'b4', b: 'l4-5' },
  { a: 'l4-1', b: 'c4', req: '4-1' },
  { a: 'l4-4', b: 'l4-5', req: '4-4' },
  { a: 'l4-5', b: 'l5-1', req: '4-5' },
  // Ilha 5
  { a: 'l5-1', b: 'l5-2', req: '5-1' },
  { a: 'l5-2', b: 'l5-3', req: '5-2' },
  { a: 'l5-3', b: 'l5-6', req: '5-3' },
  { a: 'l5-6', b: 'l5-7', req: '5-6' },
  { a: 'l5-7', b: 'l5-8', req: '5-7' },
  { a: 'l5-8', b: 'l5-4', req: '5-8' },
  { a: 'l5-3', b: 'b5', secret: '5-3' },
  { a: 'b5', b: 'l5-5' },
  { a: 'l5-4', b: 'l5-5', req: '5-4' },
  { a: 'l5-5', b: 'l6-1', req: '5-5' },
  // Ilha 6
  { a: 'l6-1', b: 'l6-2', req: '6-1' },
  { a: 'l6-2', b: 'l6-3', req: '6-2' },
  { a: 'l6-3', b: 'l6-6', req: '6-3' },
  { a: 'l6-6', b: 'l6-7', req: '6-6' },
  { a: 'l6-7', b: 'l6-4', req: '6-7' },
  { a: 'l6-3', b: 'b6', secret: '6-3' },
  { a: 'b6', b: 'l6-5' },
  { a: 'l6-1', b: 'c6', req: '6-1' },
  { a: 'l6-4', b: 'l6-5', req: '6-4' },
  { a: 'l6-5', b: 'j7', req: '6-5' },
  // Ilha 7
  { a: 'j7', b: 'l7-1' },
  { a: 'l7-1', b: 'l7-2', req: '7-1' },
  { a: 'l7-2', b: 'l7-4', req: '7-2' },
  { a: 'l7-4', b: 'l7-5', req: '7-4' },
  { a: 'l7-5', b: 'l7-3', req: '7-5' },
  // Constelações: cada saída secreta abre uma fase; a última exige as sete anteriores
  { a: 'j7', b: 'lc-1', secret: '1-3' },
  { a: 'lc-1', b: 'lc-2', secret: '3-3' },
  { a: 'lc-2', b: 'lc-3', secret: '5-3' },
  { a: 'lc-3', b: 'lc-4', secret: '6-3' },
  { a: 'lc-4', b: 'lc-5', secret: '2-7' },
  { a: 'lc-5', b: 'lc-6', secret: '4-7' },
  { a: 'lc-6', b: 'lc-7', secret: '5-7' },
  { a: 'lc-7', b: 'lc-8', req: 'C-7' },
];

export const MAP_W = 480;
export const MAP_H = 270;

export function nodeById(id: string): MapNode {
  const n = NODES.find((x) => x.id === id);
  if (!n) throw new Error('nó inexistente: ' + id);
  return n;
}
