import { describe, it, expect, vi } from 'vitest';
import { Character } from '../../../models/character.model';

// Mock the SRD spell reference (mirrors how characterToSheetValues.test mocks classes).
const { mockSpells } = vi.hoisted(() => ({
  mockSpells: [
    { name: 'Fireball', level: '3', castingTime: '1 action', range: '150 feet', concentration: false, ritual: false, isMaterial: true, damageType: 'fire' },
    { name: 'Counterspell', level: '3', castingTime: '1 reaction', range: '60 feet', concentration: false, ritual: false, isMaterial: false, damageType: '' },
    { name: 'Mage Hand', level: '0', castingTime: '1 action', range: '30 feet', concentration: false, ritual: false, isMaterial: false, damageType: '' },
    { name: 'Fire Bolt', level: '0', castingTime: '1 action', range: '120 feet', concentration: false, ritual: false, isMaterial: false, damageType: 'fire' },
    { name: 'Hex', level: '1', castingTime: '1 bonus action', range: '90 feet', concentration: true, ritual: false, isMaterial: true, damageType: 'necrotic' },
    { name: 'Detect Magic', level: '1', castingTime: '1 action', range: 'Self', concentration: true, ritual: true, isMaterial: false, damageType: '' },
  ],
}));
vi.mock('../../customHooks/dndInfo/info/all/spells', () => ({
  useDnDSpells: () => () => mockSpells,
}));

import {
  spellTableRows,
  chunkRows,
  attackCantrips,
  rowBaseline,
  attackCantripBaseline,
  defaultSpellTableConfig,
  defaultAttackCantripConfig,
  SPELL_TABLE,
  ATTACK_CANTRIP_TABLE,
  type SpellRow,
} from './spellTable';

function charWith(spells: { name: string; prepared: boolean }[]): Character {
  const c = new Character();
  c.spells = spells;
  return c;
}

describe('spellTableRows — sorting', () => {
  it('sorts by numeric level then case-insensitive name', () => {
    const rows = spellTableRows(
      charWith([
        { name: 'Fireball', prepared: true },
        { name: 'Mage Hand', prepared: false },
        { name: 'Counterspell', prepared: true },
        { name: 'Hex', prepared: false },
      ]),
    );
    expect(rows.map((r) => `${r.level}:${r.name}`)).toEqual([
      '0:Mage Hand', // cantrip first
      '1:Hex',
      '3:Counterspell', // within level 3, Counterspell < Fireball
      '3:Fireball',
    ]);
  });
});

describe('spellTableRows — column + marker mapping', () => {
  const rows = spellTableRows(
    charWith([
      { name: 'Fireball', prepared: true },
      { name: 'Detect Magic', prepared: false },
    ]),
  );
  const byName = (n: string) => rows.find((r) => r.name === n) as SpellRow;

  it('copies casting time / range and the C/R/M booleans from the reference', () => {
    expect(byName('Fireball')).toMatchObject({
      level: 3,
      castingTime: '1 action',
      range: '150 feet',
      concentration: false,
      ritual: false,
      material: true,
      damageType: 'fire',
    });
    expect(byName('Detect Magic')).toMatchObject({ concentration: true, ritual: true, material: false });
  });
});

describe('spellTableRows — fallback + empties', () => {
  it('keeps an unknown spell as a level-0 blank row (never dropped)', () => {
    const rows = spellTableRows(charWith([{ name: 'Homebrew Zap', prepared: true }]));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      level: 0,
      name: 'Homebrew Zap',
      castingTime: '',
      range: '',
      concentration: false,
      ritual: false,
      material: false,
      damageType: '',
    });
  });

  it('returns [] for no character and for an empty spell list', () => {
    expect(spellTableRows(undefined)).toEqual([]);
    expect(spellTableRows(charWith([]))).toEqual([]);
  });
});

describe('chunkRows', () => {
  const make = (n: number): SpellRow[] =>
    Array.from({ length: n }, (_, i) => ({
      level: 0,
      name: `S${i}`,
      castingTime: '',
      range: '',
      concentration: false,
      ritual: false,
      material: false,
      damageType: '',
    }));

  it('pages by 30 with the remainder on the last page', () => {
    expect(chunkRows(make(0))).toEqual([]);
    expect(chunkRows(make(30)).map((c) => c.length)).toEqual([30]);
    expect(chunkRows(make(31)).map((c) => c.length)).toEqual([30, 1]);
    expect(chunkRows(make(60)).map((c) => c.length)).toEqual([30, 30]);
    expect(chunkRows(make(61)).map((c) => c.length)).toEqual([30, 30, 1]);
  });
});

describe('rowBaseline / attackCantripBaseline geometry', () => {
  it('matches the calibrated default constants', () => {
    // 792 − (194.7 + 7) for row 0; 792 − (194.7 + 29*19.57 + 7) for the last row.
    expect(rowBaseline(0)).toBeCloseTo(590.3, 4);
    expect(rowBaseline(29)).toBeCloseTo(22.77, 2);
    expect(attackCantripBaseline(0)).toBeCloseTo(578, 4);
  });

  it('shifts the baseline by the config delta (vertical position / row pitch)', () => {
    const moved = { ...SPELL_TABLE, firstRowTopFromTop: SPELL_TABLE.firstRowTopFromTop + 10 };
    expect(rowBaseline(0, moved)).toBeCloseTo(rowBaseline(0) - 10, 4);
    const stretched = { ...SPELL_TABLE, rowPitch: SPELL_TABLE.rowPitch + 1 };
    expect(rowBaseline(2, stretched)).toBeCloseTo(rowBaseline(2) - 2, 4); // 2 rows × +1pt
  });
});

describe('default*Config factories', () => {
  it('return deep copies that do not alias the constants', () => {
    const s = defaultSpellTableConfig();
    s.cols.name.x = 999;
    s.markers.concentration.x = 1;
    expect(SPELL_TABLE.cols.name.x).not.toBe(999);
    expect(SPELL_TABLE.markers.concentration.x).not.toBe(1);

    const a = defaultAttackCantripConfig();
    a.cols.detail.x = 999;
    expect(ATTACK_CANTRIP_TABLE.cols.detail.x).not.toBe(999);
  });
});

describe('attackCantrips', () => {
  it('keeps only level-0 spells that have a damage type', () => {
    const rows = spellTableRows(
      charWith([
        { name: 'Fire Bolt', prepared: false }, // cantrip, fire → included
        { name: 'Mage Hand', prepared: false }, // cantrip, no damage → excluded
        { name: 'Fireball', prepared: true }, // level 3 → excluded
      ]),
    );
    expect(attackCantrips(rows).map((r) => r.name)).toEqual(['Fire Bolt']);
  });
});
