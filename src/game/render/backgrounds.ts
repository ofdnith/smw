/** Fundos com parallax por tema, desenhados proceduralmente. */
import { Renderer, VIEW_W, VIEW_H } from '../../engine/renderer';
import type { Theme } from '../level/format';

function h(x: number, y = 0): number {
  let v = (x * 374761393 + y * 668265263) | 0;
  v = (v ^ (v >> 13)) * 1274126177;
  return ((v ^ (v >> 16)) >>> 0) / 4294967296;
}

export interface BgOpts {
  dark?: boolean;
  night?: boolean;
  frame: number;
}

export function drawBackground(r: Renderer, theme: Theme, camX: number, camY: number, o: BgOpts): void {
  const f = o.frame;
  switch (theme) {
    case 'praia': {
      r.gradient([[0, '#5fc3ff'], [0.6, '#bfe9ff'], [1, '#fff2c8']]);
      sun(r, 260, 30, '#fff7b0');
      clouds(r, camX, 0.15, 20, '#ffffff', f);
      // mar ao fundo
      const seaY = 110 - camY * 0.1;
      r.fillRect(0, seaY, VIEW_W, VIEW_H - seaY, '#3fa7d6');
      for (let i = 0; i < 12; i++) {
        const x = ((i * 37 - camX * 0.25 + f * 0.3) % (VIEW_W + 40)) - 20;
        r.fillRect(x, seaY + 4 + (i % 3) * 9, 14, 1, '#bfe9ff');
      }
      // dunas
      hills(r, camX, 0.4, 130 - camY * 0.3, '#f2dca6', 60, 20, 3);
      hills(r, camX, 0.6, 150 - camY * 0.5, '#e8c98a', 40, 14, 5);
      palms(r, camX, 0.6, 150 - camY * 0.5);
      break;
    }
    case 'bosque': {
      r.gradient([[0, '#6a9a7a'], [1, '#c8e0b0']]);
      clouds(r, camX, 0.1, 15, '#e8f0e0', f);
      trees(r, camX, 0.3, 120 - camY * 0.2, '#4a7a5a', '#3a5a4a', 50);
      trees(r, camX, 0.55, 150 - camY * 0.4, '#2f5a3f', '#1f3a2f', 38);
      // chuva fina
      for (let i = 0; i < 30; i++) {
        const x = (i * 53 + h(i) * 40 - camX * 0.8) % VIEW_W;
        const y = (f * 4 + i * 71) % VIEW_H;
        r.fillRect(((x % VIEW_W) + VIEW_W) % VIEW_W, y, 1, 4, 'rgba(220,240,255,0.5)');
      }
      break;
    }
    case 'penhasco': {
      r.gradient([[0, '#7fc8ff'], [1, '#e8f6ff']]);
      clouds(r, camX, 0.2, 30, '#ffffff', f);
      clouds(r, camX, 0.35, 70, '#f4faff', f + 300);
      hills(r, camX, 0.3, 120 - camY * 0.2, '#8a9ab0', 90, 40, 2);
      windmills(r, camX, 0.45, 130 - camY * 0.3, f);
      hills(r, camX, 0.6, 160 - camY * 0.5, '#6a7a90', 50, 18, 4);
      break;
    }
    case 'recife': {
      r.gradient([[0, '#2f8fcf'], [0.5, '#1f6fae'], [1, '#143f6f']]);
      // raios de luz
      for (let i = 0; i < 5; i++) {
        const x = ((i * 90 - camX * 0.2) % (VIEW_W + 60)) - 30;
        r.ctx.globalAlpha = 0.08;
        r.ctx.fillStyle = '#ffffff';
        r.ctx.beginPath();
        r.ctx.moveTo(x, 0); r.ctx.lineTo(x + 30, 0); r.ctx.lineTo(x + 60 + Math.sin(f / 60 + i) * 6, VIEW_H); r.ctx.lineTo(x + 10, VIEW_H);
        r.ctx.fill();
        r.ctx.globalAlpha = 1;
      }
      corals(r, camX, 0.4, 150 - camY * 0.3);
      // bolhas
      for (let i = 0; i < 14; i++) {
        const x = ((i * 47 + Math.sin((f + i * 20) / 40) * 6 - camX * 0.5) % VIEW_W + VIEW_W) % VIEW_W;
        const y = (VIEW_H - ((f * 0.6 + i * 50) % (VIEW_H + 20)));
        r.fillRect(x, y, 2, 2, 'rgba(220,240,255,0.5)');
      }
      break;
    }
    case 'minas': {
      r.gradient([[0, '#3a3a4a'], [1, '#6a6a7a']]);
      // cristais de sal
      for (let i = 0; i < 16; i++) {
        const x = ((i * 61 - camX * 0.3) % (VIEW_W + 40) + VIEW_W + 40) % (VIEW_W + 40) - 20;
        const hh = 20 + h(i) * 40;
        const y = 60 + h(i, 1) * 80 - camY * 0.2;
        r.fillRect(x, y, 6, hh, '#8a8a9a');
        r.fillRect(x + 2, y - 4, 2, hh + 4, '#c8c4b8');
      }
      for (let i = 0; i < 24; i++) {
        const x = ((i * 43 - camX * 0.55) % (VIEW_W + 40) + VIEW_W + 40) % (VIEW_W + 40) - 20;
        const y = 100 + h(i, 2) * 70 - camY * 0.4;
        r.fillRect(x, y, 10, 60, '#5a5a6a');
        r.fillRect(x + 3, y - 3, 3, 63, '#9a968a');
      }
      break;
    }
    case 'vale': {
      r.gradient([[0, '#05060f'], [1, '#141830']]);
      stars(r, camX, f, 40);
      moonless(r);
      trees(r, camX, 0.3, 120 - camY * 0.2, '#0f1a24', '#0a1218', 56);
      trees(r, camX, 0.55, 150 - camY * 0.4, '#0a1018', '#05080c', 44);
      // vaga-lumes
      for (let i = 0; i < 16; i++) {
        const x = ((i * 59 + Math.sin((f + i * 30) / 50) * 10 - camX * 0.7) % VIEW_W + VIEW_W) % VIEW_W;
        const y = 60 + h(i, 3) * 100 + Math.sin((f + i * 17) / 37) * 6;
        const a = 0.4 + 0.6 * Math.abs(Math.sin((f + i * 23) / 30));
        r.fillRect(x, y, 2, 2, `rgba(200,255,150,${a.toFixed(2)})`);
      }
      break;
    }
    case 'farol':
    case 'navio': {
      r.gradient([[0, '#1a2440'], [0.7, '#3a4a70'], [1, '#6a7a9a']]);
      stars(r, camX, f, 25);
      clouds(r, camX, 0.15, 30, '#55658a', f);
      // mar revolto
      const seaY = 120 - camY * 0.15;
      r.fillRect(0, seaY, VIEW_W, VIEW_H - seaY, '#1f3a5f');
      for (let i = 0; i < 20; i++) {
        const x = ((i * 31 - camX * 0.3 + f * 0.5) % (VIEW_W + 40)) - 20;
        const y = seaY + 6 + (i % 4) * 12 + Math.sin((f + i * 10) / 20) * 2;
        r.fillRect(x, y, 12, 1, '#6f829c');
      }
      // farol mestre ao fundo
      const lx = 240 - camX * 0.08;
      r.fillRect(lx, seaY - 70, 14, 70, '#8a8f9e');
      r.fillRect(lx, seaY - 70, 14, 8, '#c9ccd6');
      r.fillRect(lx + 2, seaY - 66, 10, 6, (f % 120) < 60 ? '#ffe08a' : '#5a5f6e');
      for (let i = 0; i < 4; i++) r.fillRect(lx, seaY - 60 + i * 16, 14, 4, '#c0392b');
      break;
    }
    case 'ceu': {
      r.gradient([[0, '#1a1050'], [0.6, '#4a3a9a'], [1, '#ff9a8a']]);
      stars(r, camX, f, 60);
      clouds(r, camX, 0.3, 100 - camY * 0.3, '#ffd8e8', f);
      clouds(r, camX, 0.5, 140 - camY * 0.5, '#ffffff', f + 500);
      break;
    }
    case 'forte': {
      r.gradient([[0, '#1a1020'], [1, '#2a1a30']]);
      // janelas góticas
      for (let i = 0; i < 6; i++) {
        const x = ((i * 110 - camX * 0.3) % (VIEW_W + 60) + VIEW_W + 60) % (VIEW_W + 60) - 30;
        const y = 40 - camY * 0.2;
        r.fillRect(x, y, 16, 40, '#3a2a4a');
        r.fillRect(x + 4, y + 4, 8, 28, (f + i * 20) % 90 < 45 ? '#6a4a8a' : '#5a3a7a');
      }
      // correntes
      for (let i = 0; i < 8; i++) {
        const x = ((i * 77 - camX * 0.5) % (VIEW_W + 60) + VIEW_W + 60) % (VIEW_W + 60) - 30;
        for (let y = 0; y < VIEW_H; y += 6) r.fillRect(x + ((y / 6) % 2) * 2, y - camY * 0.4, 2, 4, '#4a3a5a');
      }
      break;
    }
  }
  if (o.night) r.dim(0.35, '#0a1030');
}

function sun(r: Renderer, x: number, y: number, c: string): void {
  r.circle(x, y, 14, c, false);
  r.circle(x, y, 10, '#ffffff', false);
}

function clouds(r: Renderer, camX: number, speed: number, baseY: number, color: string, f: number): void {
  for (let i = 0; i < 7; i++) {
    const w = 30 + h(i) * 40;
    const x = ((i * 97 + h(i, 1) * 50 - camX * speed + f * 0.1) % (VIEW_W + 120) + VIEW_W + 120) % (VIEW_W + 120) - 60;
    const y = baseY + h(i, 2) * 30;
    r.fillRect(x, y + 4, w, 6, color);
    r.fillRect(x + 6, y, w - 12, 5, color);
    r.fillRect(x + 10, y - 3, w * 0.4, 4, color);
  }
}

function hills(r: Renderer, camX: number, speed: number, baseY: number, color: string, period: number, amp: number, seed: number): void {
  const c = r.ctx;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, VIEW_H);
  for (let x = 0; x <= VIEW_W; x += 4) {
    const wx = x + camX * speed;
    const y = baseY - (Math.sin(wx / period + seed) * amp + Math.sin(wx / (period * 0.37) + seed * 2) * amp * 0.3);
    c.lineTo(x, y);
  }
  c.lineTo(VIEW_W, VIEW_H);
  c.fill();
}

function palms(r: Renderer, camX: number, speed: number, baseY: number): void {
  for (let i = 0; i < 5; i++) {
    const x = ((i * 140 + h(i, 7) * 60 - camX * speed) % (VIEW_W + 80) + VIEW_W + 80) % (VIEW_W + 80) - 40;
    const y = baseY - 10 + h(i, 8) * 10;
    r.fillRect(x, y - 30, 3, 32, '#a8844a');
    for (let k = -2; k <= 2; k++) r.fillRect(x - 10 + k * 5, y - 34 + Math.abs(k) * 2, 8, 3, '#4fa36a');
  }
}

function trees(r: Renderer, camX: number, speed: number, baseY: number, c1: string, c2: string, hgt: number): void {
  for (let i = 0; i < 9; i++) {
    const x = ((i * 70 + h(i, 11) * 30 - camX * speed) % (VIEW_W + 80) + VIEW_W + 80) % (VIEW_W + 80) - 40;
    const hh = hgt * (0.7 + h(i, 12) * 0.5);
    r.fillRect(x + 8, baseY - hh * 0.4, 6, hh * 0.4 + 40, c2);
    r.fillRect(x, baseY - hh, 22, hh * 0.65, c1);
    r.fillRect(x + 4, baseY - hh - 8, 14, 10, c1);
  }
  r.fillRect(0, baseY + 30, VIEW_W, VIEW_H, c2);
}

function windmills(r: Renderer, camX: number, speed: number, baseY: number, f: number): void {
  for (let i = 0; i < 3; i++) {
    const x = ((i * 180 + 60 - camX * speed) % (VIEW_W + 100) + VIEW_W + 100) % (VIEW_W + 100) - 50;
    const y = baseY - 10;
    r.fillRect(x - 4, y - 30, 8, 30, '#d8d0c0');
    r.fillRect(x - 6, y - 34, 12, 5, '#8a7a5a');
    const c = r.ctx;
    c.strokeStyle = '#f4f4f8';
    c.lineWidth = 2;
    for (let k = 0; k < 4; k++) {
      const a = f / 90 + (k * Math.PI) / 2;
      c.beginPath();
      c.moveTo(x, y - 30);
      c.lineTo(x + Math.cos(a) * 16, y - 30 + Math.sin(a) * 16);
      c.stroke();
    }
  }
}

function corals(r: Renderer, camX: number, speed: number, baseY: number): void {
  for (let i = 0; i < 12; i++) {
    const x = ((i * 55 + h(i, 21) * 30 - camX * speed) % (VIEW_W + 60) + VIEW_W + 60) % (VIEW_W + 60) - 30;
    const hh = 14 + h(i, 22) * 26;
    const col = ['#f49ac1', '#f2c98a', '#8fd1b0'][i % 3];
    r.fillRect(x, baseY - hh, 4, hh + 30, col);
    r.fillRect(x - 3, baseY - hh + 6, 10, 3, col);
    r.fillRect(x + 2, baseY - hh - 4, 3, 6, col);
  }
  r.fillRect(0, baseY + 20, VIEW_W, VIEW_H, '#143f6f');
}

function stars(r: Renderer, camX: number, f: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const x = ((i * 83 + h(i, 31) * 50 - camX * 0.05) % VIEW_W + VIEW_W) % VIEW_W;
    const y = h(i, 32) * 120;
    const tw = (f + i * 13) % 90 < 10 ? 2 : 1;
    r.fillRect(x, y, tw, tw, '#ffffff');
  }
}

function moonless(r: Renderer): void {
  // "Vale Sem Lua": só um halo onde a lua deveria estar
  r.ctx.globalAlpha = 0.08;
  r.circle(250, 30, 16, '#ffffff', false);
  r.ctx.globalAlpha = 1;
}
