import { describe, it, expect } from 'vitest';
import { getAbilityModifier, getProficiencyBonus, signed } from './dndMath';

describe('signed', () => {
  it('prefixes non-negative numbers with + (including zero)', () => {
    expect(signed(0)).toBe('+0');
    expect(signed(3)).toBe('+3');
  });

  it('keeps the native minus sign for negatives', () => {
    expect(signed(-1)).toBe('-1');
    expect(signed(-4)).toBe('-4');
  });
});

describe('getAbilityModifier', () => {
  it('floors (score - 10) / 2', () => {
    expect(getAbilityModifier(10)).toBe(0);
    expect(getAbilityModifier(8)).toBe(-1);
    expect(getAbilityModifier(18)).toBe(4);
    expect(getAbilityModifier(15)).toBe(2);
  });
});

describe('getProficiencyBonus', () => {
  it('scales +2 at level 1 up to +6 at level 20', () => {
    expect(getProficiencyBonus(1)).toBe(2);
    expect(getProficiencyBonus(5)).toBe(3);
    expect(getProficiencyBonus(20)).toBe(6);
  });
});
