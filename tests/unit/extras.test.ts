import { describe, it, expect } from 'vitest';
import { buildKeymap, buildPadmap, keyLabel, DEFAULT_KEYMAP } from '../../src/engine/input';
import { formatTime, slotPearls, newSlot } from '../../src/engine/save';
import { GALLERY } from '../../src/game/scenes/extras';
import { MUSIC, TRACK_TITLES } from '../../src/content/music';

describe('remapeamento', () => {
  it('sem escolhas, usa o padrão', () => {
    expect(buildKeymap({})).toEqual(DEFAULT_KEYMAP);
    expect(buildPadmap({}).jump).toEqual([0]);
  });
  it('a tecla escolhida passa a valer e rouba a tecla de outra ação', () => {
    const km = buildKeymap({ jump: 'KeyX' });
    expect(km.KeyX).toBe('jump');
    expect(km.KeyZ).toBe('jump');
    expect(km.ShiftLeft).toBe('run');
  });
  it('o botão escolhido substitui os padrões da ação e sai das outras', () => {
    const pm = buildPadmap({ spin: 2 });
    expect(pm.spin).toEqual([2]);
    expect(pm.run).not.toContain(2);
    expect(pm.run.length).toBeGreaterThan(0);
  });
  it('nomes de tecla legíveis', () => {
    expect(keyLabel('KeyZ')).toBe('Z');
    expect(keyLabel('Space')).toBe('ESPACO');
    expect(keyLabel(undefined)).toBe('-');
  });
});

describe('extras', () => {
  it('formata tempos', () => {
    expect(formatTime(0)).toBe('0:00.00');
    expect(formatTime(60)).toBe('0:01.00');
    expect(formatTime(60 * 75 + 30)).toBe('1:15.50');
  });
  it('conta pérolas pela máscara', () => {
    const s = newSlot();
    s.pearls = { '1-1': 7, '1-2': 1, '1-3': 6 };
    expect(slotPearls(s)).toBe(6);
  });
  it('galeria só referencia sprites existentes', () => {
    for (const cat of GALLERY) for (const e of cat.entries) {
      expect(e.def, e.name).toBeTruthy();
      expect(e.def.frames.length, e.name).toBeGreaterThan(0);
    }
  });
  it('sala de som: toda faixa listada existe', () => {
    for (const [k] of TRACK_TITLES) expect(MUSIC[k], k).toBeTruthy();
  });
});
