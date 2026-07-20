import { describe, it, expect } from 'vitest';
import { buildSubtitle, isUnsetRow, normalizeRecharge, splitCommand, usageOwnedIndices } from '../featuresPopup.shared';

const mad = (command: string, value: Record<string, string> = {}) => ({ command, value });

describe('usageOwnedIndices', () => {
  it('claims only the first AddUses — spell rows show in both tabs', () => {
    const mads = [
      mad('AddHitPoints', { amount: '5' }),
      mad('AddUses', { amount: '1' }),
      mad('AddSpells', { ID: 'sp1' }),      // concrete grant — ALSO an effect card
      mad('AddUses', { amount: '9' }),      // duplicate — stays an effect
      mad('AddSpells', { ID: 'choice', options: 'a,b' }), // choice form — stays an effect
      mad('RemoveSpells', { ID: 'sp2' }),   // removal — stays an effect
    ];
    expect([...usageOwnedIndices(mads)].sort()).toEqual([1]);
  });

  it('claims nothing on an empty or effect-only list', () => {
    expect(usageOwnedIndices([]).size).toBe(0);
    expect(usageOwnedIndices([mad('AddArmorClass', { bonus: '2' })]).size).toBe(0);
  });
});

describe('isUnsetRow', () => {
  const row = (commandCategory: string, value: Record<string, string> = {}) => ({ commandCategory, value });

  it('flags rows with no category or no committed value', () => {
    expect(isUnsetRow(row('', {}))).toBe(true);
    expect(isUnsetRow(row('Spells', {}))).toBe(true);
    expect(isUnsetRow(row('Spells', { ID: '  ' }))).toBe(true);
  });

  it('groupLabel alone is not a value — branch renaming writes it onto empty rows', () => {
    expect(isUnsetRow(row('Spells', { groupLabel: 'Thaumaturge' }))).toBe(true);
    expect(isUnsetRow(row('Spells', { groupLabel: 'Thaumaturge', ID: 'sp1' }))).toBe(false);
  });

  it('accepts any committed value', () => {
    expect(isUnsetRow(row('Spells', { ID: 'sp1' }))).toBe(false);
    expect(isUnsetRow(row('Uses', { amount: '1', recharge: 'Long Rest' }))).toBe(false);
  });
});

describe('normalizeRecharge', () => {
  it('canonicalizes stored variants', () => {
    expect(normalizeRecharge('short')).toBe('Short Rest');
    expect(normalizeRecharge('Short Rest')).toBe('Short Rest');
    expect(normalizeRecharge('long')).toBe('Long Rest');
    expect(normalizeRecharge(undefined)).toBe('Long Rest');
    expect(normalizeRecharge('')).toBe('Long Rest');
  });
});

describe('splitCommand', () => {
  it('splits Add/Remove commands and rejects unknown shapes', () => {
    expect(splitCommand('AddHitPoints')).toEqual({ commandType: 'Add', commandCategory: 'HitPoints' });
    expect(splitCommand('RemoveSpells')).toEqual({ commandType: 'Remove', commandCategory: 'Spells' });
    expect(splitCommand('')).toEqual({ commandType: '', commandCategory: '' });
    expect(splitCommand('Garbage')).toEqual({ commandType: '', commandCategory: '' });
  });
});

describe('buildSubtitle', () => {
  it('renders the full subclass form', () => {
    expect(buildSubtitle({ subclassName: 'Light Domain', className: 'Cleric', level: 2 }, ''))
      .toBe('Class feature · Light Domain — Cleric 2');
  });

  it('derives kind from machine tags', () => {
    expect(buildSubtitle({ className: 'Cleric', level: 4 }, 'ASI')).toBe('Ability Score Improvement — Cleric 4');
    expect(buildSubtitle({ className: 'Cleric', level: 3 }, 'Subclass')).toBe('Subclass level — Cleric 3');
  });

  it('drops missing segments without dangling separators', () => {
    expect(buildSubtitle({ className: 'Cleric' }, '')).toBe('Class feature — Cleric');
    expect(buildSubtitle({ level: 2 }, '')).toBe('Class feature — 2');
    expect(buildSubtitle({ kind: 'Background feature' }, '')).toBe('Background feature');
  });

  it('renders nothing with no context and no machine tag', () => {
    expect(buildSubtitle(undefined, '')).toBe('');
    expect(buildSubtitle(undefined, 'Channel Divinity')).toBe('');
  });
});
