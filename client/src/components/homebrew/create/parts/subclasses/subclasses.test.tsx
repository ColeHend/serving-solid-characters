import { describe, test, expect } from 'vitest';
import { render } from '@solidjs/testing-library';
import { Router, Route } from '@solidjs/router';
import Subclasses from './subclasses';
import { buildDataSpellcasting, parseDataSpellcasting } from './subclassAdapter';
import { SpellsKnown } from './SpellsKnown';

// Minimal mock for global homebrewManager used inside component (if not already provided by test env)
// We only stub the methods we call in onSave path; tests here focus on rendering + adapters.
// @ts-ignore
global.homebrewManager = global.homebrewManager || {
  subclasses: () => [],
  addSubclass: () => {},
  updateSubclass: () => {},
};

describe('Subclasses Component', () => {
  test('renders route without crashing', () => {
    render(() => (
      <Router>
        <Route path='/homebrew/create/subclasses' component={Subclasses} />
      </Router>
    ));
    // No explicit assertions: absence of throw implies success similar to backgrounds test style.
  });
});

describe('subclassAdapter build/parse roundtrip', () => {
  test('buildDataSpellcasting returns undefined for no ui state', () => {
    expect(buildDataSpellcasting(undefined as any, [])).toBeUndefined();
  });

  test('buildDataSpellcasting maps half caster with calculated known spells', () => {
    const ui = {
      info: [],
      castingLevels: [
        { level: 1, spellcasting: { cantrips_known: 2, spell_slots_level_1: 1 } },
        { level: 2, spellcasting: { cantrips_known: 2, spell_slots_level_1: 2 } },
      ],
      name: 'Test Subclass',
      spellcastingAbility: 'Intelligence',
      casterType: 'half',
      spellsKnownCalc: SpellsKnown.Level, // will map to 'full' calc in adapter
      spellsKnownRoundup: true,
      ritualCasting: true,
    } as any;
    const result = buildDataSpellcasting(ui, []);
    expect(result).toBeTruthy();
    expect(result?.metadata.casterType).toBeDefined();
    expect(result?.metadata.slots[1].cantripsKnown).toBe(2);
    expect(result?.known_type).toBe('calc');
    expect((result?.spells_known as any).level).toBe('full'); // Level -> full
  });

  test('buildDataSpellcasting maps custom known counts when SpellsKnown.Other', () => {
    const ui = {
      info: [],
      castingLevels: [],
      name: 'Custom Known',
      spellcastingAbility: 'Wisdom',
      casterType: 'full',
      spellsKnownCalc: SpellsKnown.Other,
    } as any;
    const result = buildDataSpellcasting(ui, [{ level: 3, amount: 5 }]);
    expect(result?.known_type).toBe('number');
    expect(result?.spells_known).toMatchObject({ 3: 5 });
  });

  test('parseDataSpellcasting recreates custom known list', () => {
    const built = buildDataSpellcasting({
      info: [],
      castingLevels: [],
      name: 'Parse Custom',
      spellcastingAbility: 'Wisdom',
      casterType: 'full',
      spellsKnownCalc: SpellsKnown.Other,
    } as any, [{ level: 5, amount: 7 }]);
    const parsed = parseDataSpellcasting(built as any);
    expect(parsed?.spellsKnownCalc).toBe(SpellsKnown.Other);
    expect(parsed?.customKnown).toEqual([{ level: 5, amount: 7 }]);
  });

  test('parseDataSpellcasting maps calc full vs half properly', () => {
    const fullCalc = buildDataSpellcasting({
      info: [],
      castingLevels: [],
      name: 'Full',
      spellcastingAbility: 'Charisma',
      casterType: 'full',
      spellsKnownCalc: SpellsKnown.Level,
    } as any, []);
    const halfCalc = buildDataSpellcasting({
      info: [],
      castingLevels: [],
      name: 'Half',
      spellcastingAbility: 'Charisma',
      casterType: 'half',
      spellsKnownCalc: SpellsKnown.HalfLevel,
    } as any, []);
    const parsedFull = parseDataSpellcasting(fullCalc as any);
    const parsedHalf = parseDataSpellcasting(halfCalc as any);
    expect(parsedFull?.spellsKnownCalc).toBe(SpellsKnown.Level);
    expect(parsedHalf?.spellsKnownCalc).toBe(SpellsKnown.HalfLevel);
  });
});
