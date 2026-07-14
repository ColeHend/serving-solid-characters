import { describe, it, expect, vi } from 'vitest';
import { createRoot, createSignal } from 'solid-js';
import { createTableFilter, FilterFieldConfig, TableFilterConfig } from './tableFilter';
import { SortState } from './tableSort';

interface TestSpell {
  name: string;
  school: string;
  level: string;
  damageType?: string;
  concentration: boolean;
  classes: string[];
  legacy?: boolean;
}

const rows: TestSpell[] = [
  { name: 'Fireball', school: 'Evocation', level: '3', damageType: 'Fire', concentration: false, classes: ['Sorcerer', 'Wizard'], legacy: true },
  { name: 'Web', school: 'Conjuration', level: '2', damageType: '', concentration: true, classes: ['Sorcerer', 'Wizard'] },
  { name: 'Guidance', school: 'Divination', level: '0', concentration: true, classes: ['Cleric', 'Druid'], legacy: false },
  { name: 'Meteor Storm', school: 'Evocation', level: '10', damageType: 'Fire', concentration: false, classes: ['Wizard'] },
];

const yesNo = (v: string) => (v === 'true' ? 'Yes' : 'No');

const fields: FilterFieldConfig<TestSpell>[] = [
  { key: 'level', label: 'Level' },
  { key: 'school', label: 'School' },
  { key: 'damageType', label: 'Damage type' },
  { key: 'concentration', label: 'Concentration', format: yesNo },
  { key: 'classes', label: 'Class', getValues: (s) => s.classes },
];

function setup(config?: Partial<TableFilterConfig<TestSpell>>) {
  return createRoot(() => {
    const [source, setSource] = createSignal<TestSpell[]>(rows);
    const filter = createTableFilter<TestSpell>({
      source,
      fields,
      ...config,
    });
    return { source, setSource, ...filter };
  });
}

function setupWithSort(initial: SortState = { sortKey: 'level', isAsc: true }) {
  const [currentSort, setCurrentSort] = createSignal<SortState>(initial);
  const setSort = vi.fn((state: SortState) => setCurrentSort(state));
  const bridge = {
    currentSort,
    setSort,
    initial,
    options: [
      { key: 'name', label: 'Name' },
      { key: 'level', label: 'Level' },
    ],
  };
  return { ...setup({ sort: bridge, legacy: {} }), setSort };
}

describe('createTableFilter option derivation', () => {
  it('dedupes values and sorts numeric strings numerically', () => {
    const { optionsFor } = setup();

    // lexicographic order would put '10' before '2'
    expect(optionsFor('level').map(o => o.value)).toEqual(['0', '2', '3', '10']);
    expect(optionsFor('school').map(o => o.value)).toEqual(['Conjuration', 'Divination', 'Evocation']);
  });

  it('skips empty, null and undefined values', () => {
    const { optionsFor } = setup();

    // Web has damageType '', Guidance has none at all
    expect(optionsFor('damageType').map(o => o.value)).toEqual(['Fire']);
  });

  it('flattens array fields into individual options', () => {
    const { optionsFor } = setup();

    expect(optionsFor('classes').map(o => o.value)).toEqual(['Cleric', 'Druid', 'Sorcerer', 'Wizard']);
  });

  it('formats option labels while keeping raw values', () => {
    const { optionsFor } = setup();

    expect(optionsFor('concentration')).toEqual([
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ]);
  });
});

describe('createTableFilter filtering', () => {
  it('returns the source unchanged when nothing is selected', () => {
    const { filteredData, source } = setup();

    expect(filteredData()).toBe(source());
  });

  it('ORs values within a field', () => {
    const { filteredData, setFieldValues } = setup();

    setFieldValues('school', ['Evocation', 'Divination']);

    expect(filteredData().map(s => s.name)).toEqual(['Fireball', 'Guidance', 'Meteor Storm']);
  });

  it('ANDs across fields', () => {
    const { filteredData, setFieldValues } = setup();

    setFieldValues('school', ['Evocation']);
    setFieldValues('level', ['3']);

    expect(filteredData().map(s => s.name)).toEqual(['Fireball']);
  });

  it('matches array fields when any selected value is present', () => {
    const { filteredData, setFieldValues } = setup();

    setFieldValues('classes', ['Sorcerer']);
    expect(filteredData().map(s => s.name)).toEqual(['Fireball', 'Web']);

    setFieldValues('classes', ['Cleric', 'Sorcerer']);
    expect(filteredData().map(s => s.name)).toEqual(['Fireball', 'Web', 'Guidance']);
  });

  it('filters boolean fields through their string values', () => {
    const { filteredData, setFieldValues } = setup();

    setFieldValues('concentration', ['true']);

    expect(filteredData().map(s => s.name)).toEqual(['Web', 'Guidance']);
  });

  it('keeps the selections object identity when set with identical values (Select echo safety)', () => {
    const { selections, setFieldValues } = setup();

    setFieldValues('school', ['Evocation']);
    const before = selections();

    setFieldValues('school', ['Evocation']);
    expect(selections()).toBe(before);

    setFieldValues('level', []);
    expect(selections()).toBe(before);
  });

  it('treats an emptied selection as inactive again', () => {
    const { filteredData, setFieldValues, source } = setup();

    setFieldValues('school', ['Evocation']);
    setFieldValues('school', []);

    expect(filteredData()).toBe(source());
  });
});

describe('createTableFilter legacy tri-state', () => {
  it('keeps only legacy items in legacy mode', () => {
    const { filteredData, setLegacyMode } = setup({ legacy: {} });

    setLegacyMode('legacy');

    expect(filteredData().map(s => s.name)).toEqual(['Fireball']);
  });

  it('keeps false and undefined legacy items in nonLegacy mode', () => {
    const { filteredData, setLegacyMode } = setup({ legacy: {} });

    setLegacyMode('nonLegacy');

    expect(filteredData().map(s => s.name)).toEqual(['Web', 'Guidance', 'Meteor Storm']);
  });

  it('combines the legacy mode with field selections', () => {
    const { filteredData, setLegacyMode, setFieldValues } = setup({ legacy: {} });

    setLegacyMode('nonLegacy');
    setFieldValues('school', ['Evocation']);

    expect(filteredData().map(s => s.name)).toEqual(['Meteor Storm']);
  });

  it('uses a custom legacy getValue when provided', () => {
    const { filteredData, setLegacyMode } = setup({
      legacy: { getValue: (s) => s.level === '10' },
    });

    setLegacyMode('legacy');

    expect(filteredData().map(s => s.name)).toEqual(['Meteor Storm']);
  });

  it('ignores the legacy mode when legacy is not configured', () => {
    const { filteredData, setLegacyMode, source } = setup();

    setLegacyMode('legacy');

    expect(filteredData()).toBe(source());
  });
});

describe('createTableFilter chips', () => {
  it('builds labelled chips for every selected value', () => {
    const { chips, setFieldValues } = setup();

    setFieldValues('school', ['Evocation']);
    setFieldValues('concentration', ['true']);

    expect(chips().map(c => c.label)).toEqual(['School: Evocation', 'Concentration: Yes']);
  });

  it('adds a legacy chip for non-default legacy modes', () => {
    const { chips, setLegacyMode } = setup({ legacy: {} });

    setLegacyMode('legacy');
    expect(chips().map(c => c.label)).toEqual(['Legacy only']);

    setLegacyMode('nonLegacy');
    expect(chips().map(c => c.label)).toEqual(['Non-legacy']);
  });

  it('shows a sort chip only when the sort differs from the initial state', () => {
    const { chips, setSort } = setupWithSort();

    expect(chips()).toEqual([]);

    setSort({ sortKey: 'name', isAsc: false });
    expect(chips().map(c => c.label)).toEqual(['Sort: Name ▼']);

    setSort({ sortKey: 'level', isAsc: true });
    expect(chips()).toEqual([]);
  });

  it('removes a single value via its chip', () => {
    const { chips, setFieldValues, removeChip, filteredData } = setup();

    setFieldValues('school', ['Evocation', 'Divination']);
    removeChip(chips()[0]);

    expect(chips().map(c => c.label)).toEqual(['School: Divination']);
    expect(filteredData().map(s => s.name)).toEqual(['Guidance']);
  });

  it('resets legacy to all when its chip is removed', () => {
    const { chips, setLegacyMode, removeChip, legacyMode } = setup({ legacy: {} });

    setLegacyMode('legacy');
    removeChip(chips()[0]);

    expect(legacyMode()).toBe('all');
    expect(chips()).toEqual([]);
  });

  it('resets the sort to initial when the sort chip is removed', () => {
    const { chips, removeChip, setSort } = setupWithSort();

    setSort({ sortKey: 'name', isAsc: false });
    setSort.mockClear();
    removeChip(chips()[0]);

    expect(setSort).toHaveBeenCalledWith({ sortKey: 'level', isAsc: true });
    expect(chips()).toEqual([]);
  });
});

describe('createTableFilter clearAll and isActive', () => {
  it('clears selections, legacy mode and resets the sort', () => {
    const { chips, isActive, setFieldValues, setLegacyMode, setSort, clearAll, legacyMode, filteredData, source } = setupWithSort();

    setFieldValues('school', ['Evocation']);
    setLegacyMode('legacy');
    setSort({ sortKey: 'name', isAsc: false });
    expect(isActive()).toBe(true);

    setSort.mockClear();
    clearAll();

    expect(chips()).toEqual([]);
    expect(isActive()).toBe(false);
    expect(legacyMode()).toBe('all');
    expect(setSort).toHaveBeenCalledWith({ sortKey: 'level', isAsc: true });
    expect(filteredData()).toBe(source());
  });
});

describe('createTableFilter source reactivity', () => {
  it('recomputes options and filtered data when the source changes', () => {
    const { optionsFor, filteredData, setFieldValues, setSource } = setup();

    setFieldValues('school', ['Evocation']);
    expect(filteredData().map(s => s.name)).toEqual(['Fireball', 'Meteor Storm']);

    // simulate a 2014 -> 2024 version switch swapping the data set
    setSource([
      { name: 'Chill Touch', school: 'Necromancy', level: '0', concentration: false, classes: ['Wizard'] },
    ]);

    expect(optionsFor('school').map(o => o.value)).toEqual(['Necromancy']);
    // stale selection simply matches nothing
    expect(filteredData()).toEqual([]);
  });
});

describe('createTableFilter static options and custom matching', () => {
  const availableAt: FilterFieldConfig<TestSpell> = {
    key: 'availLevel',
    label: 'Level',
    options: ['1', '2', '3', '4', '5'],
    // threshold semantics: a row passes when its level is at or below a selected level
    matches: (s, selected) => selected.some(sel => Number(s.level) <= Number(sel)),
  };

  it('serves a static options list in given order, ignoring the data', () => {
    const { optionsFor } = setup({
      fields: [{ key: 'school', label: 'School', options: ['Necromancy', 'Abjuration', 'Evocation'] }],
    });

    // not collator-sorted, includes values absent from the rows
    expect(optionsFor('school').map(o => o.value)).toEqual(['Necromancy', 'Abjuration', 'Evocation']);
  });

  it('formats static option labels while keeping raw values', () => {
    const { optionsFor } = setup({
      fields: [{ ...availableAt, format: (v) => `Level ${v}` }],
    });

    expect(optionsFor('availLevel')[0]).toEqual({ value: '1', label: 'Level 1' });
  });

  it('filters through a custom matches predicate instead of exact values', () => {
    const { filteredData, setFieldValues } = setup({ fields: [availableAt] });

    // no row has level '5'; exact matching would return nothing
    setFieldValues('availLevel', ['5']);

    expect(filteredData().map(s => s.name)).toEqual(['Fireball', 'Web', 'Guidance']);
  });

  it('ANDs a matches field with default exact-match fields', () => {
    const { filteredData, setFieldValues } = setup({
      fields: [availableAt, { key: 'school', label: 'School' }],
    });

    setFieldValues('availLevel', ['5']);
    setFieldValues('school', ['Evocation']);

    // Meteor Storm is Evocation but level 10; Web is level 2 but Conjuration
    expect(filteredData().map(s => s.name)).toEqual(['Fireball']);
  });
});
