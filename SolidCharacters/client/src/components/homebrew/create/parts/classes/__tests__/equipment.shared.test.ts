import { describe, it, expect } from 'vitest';
import {
  addCustomEntry,
  addItemEntry,
  choiceHasContent,
  coerceEquipmentChoices,
  emptyEquipmentChoice,
  entryToString,
  optionToString,
  parseOptionString,
  parseSegment,
  removeEntry,
  setEntryQty,
} from '../wizard/equipment.shared';
import type { EquipmentOption } from '../wizard/equipment.shared';

const knownItems = new Map([
  ['chain mail', 'Chain Mail'],
  ['greatsword', 'Greatsword'],
  ['javelin', 'Javelin'],
  ['longbow', 'Longbow'],
]);

describe('entryToString / optionToString', () => {
  it('serializes items bare at qty 1 and as "Name xN" above', () => {
    expect(entryToString({ kind: 'item', name: 'Chain Mail', qty: 1 })).toBe('Chain Mail');
    expect(entryToString({ kind: 'item', name: 'Chain Mail' })).toBe('Chain Mail');
    expect(entryToString({ kind: 'item', name: 'Javelin', qty: 8 })).toBe('Javelin x8');
  });

  it('serializes custom entries verbatim', () => {
    expect(entryToString({ kind: 'custom', name: '155 GP' })).toBe('155 GP');
    expect(entryToString({ kind: 'custom', name: 'any martial weapon' })).toBe('any martial weapon');
  });

  it('joins an option with ", " and drops empty segments', () => {
    const option: EquipmentOption = {
      entries: [
        { kind: 'item', name: 'Chain Mail', qty: 1 },
        { kind: 'custom', name: '   ' },
        { kind: 'item', name: 'Javelin', qty: 8 },
        { kind: 'custom', name: '4 GP' },
      ],
    };
    expect(optionToString(option)).toBe('Chain Mail, Javelin x8, 4 GP');
    expect(optionToString({ entries: [] })).toBe('');
  });
});

describe('parseSegment', () => {
  it('treats an xN suffix as an item even without a known-item map', () => {
    expect(parseSegment('Javelin x8')).toEqual({ kind: 'item', name: 'Javelin', qty: 8 });
    expect(parseSegment('Javelin ×8')).toEqual({ kind: 'item', name: 'Javelin', qty: 8 });
  });

  it('matches bare known names case-insensitively and recovers canonical casing', () => {
    expect(parseSegment('chain mail', knownItems)).toEqual({ kind: 'item', name: 'Chain Mail', qty: 1 });
  });

  it('falls back to a custom entry for currency and unknown text', () => {
    expect(parseSegment('155 GP', knownItems)).toEqual({ kind: 'custom', name: '155 GP' });
    expect(parseSegment('any martial weapon', knownItems)).toEqual({ kind: 'custom', name: 'any martial weapon' });
    expect(parseSegment('Longbow')).toEqual({ kind: 'custom', name: 'Longbow' }); // no map loaded
  });

  it('strips a leading "and " before classifying', () => {
    expect(parseSegment('and 4 GP', knownItems)).toEqual({ kind: 'custom', name: '4 GP' });
    expect(parseSegment('and longbow', knownItems)).toEqual({ kind: 'item', name: 'Longbow', qty: 1 });
  });
});

describe('parseOptionString round-trip', () => {
  it('re-serializes a structured option string unchanged', () => {
    const raw = 'Chain Mail, Greatsword, Javelin x8, 4 GP';
    expect(optionToString({ entries: parseOptionString(raw, knownItems) })).toBe(raw);
  });

  it('keeps legacy comma-free text as one lossless custom entry', () => {
    const raw = 'a martial weapon and a shield';
    const entries = parseOptionString(raw, knownItems);
    expect(entries).toEqual([{ kind: 'custom', name: raw }]);
    expect(optionToString({ entries })).toBe(raw);
  });
});

describe('option mutations', () => {
  const base: EquipmentOption = { entries: [{ kind: 'item', name: 'Javelin', qty: 1 }] };

  it('addItemEntry increments an existing item (case-insensitive) and appends new ones', () => {
    const bumped = addItemEntry(base, 'javelin');
    expect(bumped.entries).toEqual([{ kind: 'item', name: 'Javelin', qty: 2 }]);
    const appended = addItemEntry(base, 'Shield');
    expect(appended.entries).toHaveLength(2);
    expect(appended.entries[1]).toEqual({ kind: 'item', name: 'Shield', qty: 1 });
    expect(base.entries).toHaveLength(1); // immutably rebuilt
  });

  it('addCustomEntry appends trimmed text and ignores blanks', () => {
    expect(addCustomEntry(base, '  155 GP ').entries[1]).toEqual({ kind: 'custom', name: '155 GP' });
    expect(addCustomEntry(base, '   ')).toBe(base);
  });

  it('setEntryQty updates and removes at zero; removeEntry drops by index', () => {
    expect(setEntryQty(base, 0, 5).entries[0].qty).toBe(5);
    expect(setEntryQty(base, 0, 0).entries).toEqual([]);
    expect(removeEntry(base, 0).entries).toEqual([]);
  });
});

describe('coerceEquipmentChoices', () => {
  it('migrates legacy {a,b} rows to structured custom entries', () => {
    const coerced = coerceEquipmentChoices([
      { a: 'a martial weapon and a shield', b: 'two martial weapons' },
    ]);
    expect(coerced).toEqual([{
      options: [
        { entries: [{ kind: 'custom', name: 'a martial weapon and a shield' }] },
        { entries: [{ kind: 'custom', name: 'two martial weapons' }] },
      ],
    }]);
  });

  it('passes the structured shape through and drops garbage', () => {
    const structured = { options: [{ entries: [] }, { entries: [] }] };
    expect(coerceEquipmentChoices([structured, 42, null])).toEqual([structured]);
    expect(coerceEquipmentChoices('nope')).toEqual([]);
    expect(coerceEquipmentChoices(undefined)).toEqual([]);
  });
});

describe('choiceHasContent', () => {
  it('is false for freshly added rows and true once any option has an entry', () => {
    expect(choiceHasContent(emptyEquipmentChoice())).toBe(false);
    const withEntry = addItemEntry(emptyEquipmentChoice().options[0], 'Shield');
    expect(choiceHasContent({ options: [withEntry, { entries: [] }] })).toBe(true);
  });
});
