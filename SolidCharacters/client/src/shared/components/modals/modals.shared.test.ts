import { describe, it, expect, beforeEach, vi } from 'vitest';

interface Row {
  id?: string;
  name?: string;
  source?: string;
  legacy?: boolean;
  parentClass?: string;
  details?: { name?: string };
}

const h = vi.hoisted(() => ({
  spells: [] as unknown[],
  classes: [] as unknown[],
  subclasses: [] as unknown[],
  races: [] as unknown[],
  subraces: [] as unknown[],
  feats: [] as unknown[],
  backgrounds: [] as unknown[],
  items: [] as unknown[],
  magicItems: [] as unknown[],
}));

vi.mock('../../customHooks/homebrewManager', () => ({
  homebrewManager: {
    spells: () => h.spells,
    classes: () => h.classes,
    subclasses: () => h.subclasses,
    races: () => h.races,
    subraces: () => h.subraces,
    feats: () => h.feats,
    backgrounds: () => h.backgrounds,
    items: () => h.items,
    magicItems: () => h.magicItems,
  },
}));

import { sourceLabel } from './modals.shared';

beforeEach(() => {
  h.spells = [];
  h.classes = [];
  h.subclasses = [];
  h.races = [];
  h.subraces = [];
  h.feats = [];
  h.backgrounds = [];
  h.items = [];
  h.magicItems = [];
});

describe('sourceLabel', () => {
  describe('layer 1: merge-time homebrew marker', () => {
    it('overrides the SRD source/legacy/id a clone inherits', () => {
      const clone: Row & { __homebrew: boolean } = {
        __homebrew: true, id: 'spell-1', name: 'Fireball', source: 'SRD 5.1', legacy: true,
      };
      expect(sourceLabel(clone, 'spell')).toBe('Homebrew');
    });

    it('treats inherited SRD labels case-insensitively', () => {
      expect(sourceLabel({ __homebrew: true, source: 'srd 5.2' }, 'spell')).toBe('Homebrew');
    });

    it('shows a user-typed custom sourcebook verbatim on marked rows', () => {
      expect(sourceLabel({ __homebrew: true, source: 'My Grimoire' }, 'spell')).toBe('My Grimoire');
    });
  });

  describe('layer 2: explicit source', () => {
    it('returns stamped SRD sources verbatim', () => {
      expect(sourceLabel({ source: 'SRD 5.1', legacy: true }, 'spell')).toBe('SRD 5.1');
      expect(sourceLabel({ source: 'SRD 5.2', legacy: false }, 'spell')).toBe('SRD 5.2');
    });

    it('does not mislabel an SRD original whose clone (same id) sits in the homebrew store', () => {
      h.spells = [{ id: 'spell-1', name: 'Fireball', source: 'SRD 5.1', legacy: true }];
      const original: Row = { id: 'spell-1', name: 'Fireball', source: 'SRD 5.1', legacy: true };
      expect(sourceLabel(original, 'spell')).toBe('SRD 5.1');
    });
  });

  describe('layer 3: homebrew-store membership (source-less entities)', () => {
    it('matches by id for entities that never passed through the aggregators', () => {
      h.spells = [{ id: 'hb-1', name: 'Custom Zap' }];
      expect(sourceLabel({ id: 'hb-1', name: 'Custom Zap' }, 'spell')).toBe('Homebrew');
    });

    it('matches id-less entities by name', () => {
      h.spells = [{ name: 'Zap' }];
      expect(sourceLabel({ name: 'Zap' }, 'spell')).toBe('Homebrew');
    });

    it('never lets a same-named homebrew row claim an entity that has an id', () => {
      h.spells = [{ name: 'Zap' }];
      expect(sourceLabel({ id: 'srd-9', name: 'Zap', legacy: false }, 'spell')).toBe('SRD 5.2');
    });

    it('requires the parent class to match for id-less subclasses', () => {
      h.subclasses = [{ name: 'Tester', parentClass: 'Fighter' }];
      expect(sourceLabel({ name: 'Tester', parentClass: 'Wizard' }, 'subclass')).toBe('SRD 5.2');
      expect(sourceLabel({ name: 'Tester', parentClass: 'Fighter' }, 'subclass')).toBe('Homebrew');
    });

    it('checks both the mundane and magic item stores for the item kind', () => {
      h.magicItems = [{ id: 'mi-1', name: 'Glow Ring' }];
      expect(sourceLabel({ id: 'mi-1', name: 'Glow Ring' }, 'item')).toBe('Homebrew');
    });

    it('matches feats through details.name', () => {
      h.feats = [{ name: 'Lucky' }];
      expect(sourceLabel({ details: { name: 'Lucky' } }, 'feat')).toBe('Homebrew');
    });
  });

  describe('layer 4: legacy fallback (stale rows without source)', () => {
    it('maps the ruleset flag to the SRD label', () => {
      expect(sourceLabel({ name: 'Old Row', legacy: true }, 'spell')).toBe('SRD 5.1');
      expect(sourceLabel({ name: 'New Row', legacy: false }, 'spell')).toBe('SRD 5.2');
      expect(sourceLabel({ name: 'Unknown Row' }, 'spell')).toBe('SRD 5.2');
    });

    it('defaults to SRD 5.2 for a missing entity', () => {
      expect(sourceLabel(undefined, 'spell')).toBe('SRD 5.2');
    });
  });
});
