import { render, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Stat } from '../../../../../../shared/models/stats';

// Mocks (must come before importing target component)
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/classesFiltered', () => ({
  useDnDClassesFiltered: () => (() => [])
}));

// Provide a deterministic SRD + homebrew merged list with a Wizard for prefill tests
const wizardClass = {
  id: 1,
  name: 'Wizard',
  hit_die: 'd6',
  primary_ability: 'INT',
  saving_throws: ['INT','WIS'],
  starting_equipment: [ { item: { name: 'Spellbook' } } ],
  proficiencies: { armor: ['Light'], weapons: ['Simple'], tools: ['Alchemist\'s Supplies'], skills: ['Arcana'] },
  features: { 1: [{ name: 'Arcane Recovery', description: 'Regain spell slots.' }] },
  classSpecific: { arcane_recovery_levels: { 1: '1' } }
};

vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/classes', () => ({
  useDnDClasses: () => (() => [wizardClass])
}));
vi.mock('@solidjs/router', () => ({
  useSearchParams: () => [{ name: 'Wizard' }],
  useNavigate: () => () => {}
}));
// Items hook returns empty arrays so Items component renders but without async fetch
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/items', () => ({
  useDnDItems: () => (() => [])
}));
vi.mock('../../../../../../shared/customHooks/userSettings', () => ({
  getUserSettings: () => [() => ({ dndSystem: '2024' })]
}));
vi.mock('../../../../../../shared/customHooks/components/Snackbar/snackbar', () => ({
  default: () => null
}));
// The shared FeaturesPopup is heavy (mads editors, SRD catalogs) — the wizard shell mounts it
// closed; stub it out for these prefill tests.
vi.mock('../../../../Parts/featuresPopup/featuresPopup', () => ({
  FeaturesPopup: () => null
}));

import { Classes } from '../classes';

// The environment's localStorage global is a partial stub; give the wizard's draft-autosave a
// real in-memory Storage, fresh per test, so a leftover draft can never show the resume banner
// and gate the ?name= prefill these tests assert on.
const memoryStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  } as Storage;
};

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
});

describe('Classes component prefill', () => {

  it('prefills primary stat (INT) and saving throws from existing class', async () => {
    const { container } = render(() => <Classes />);
    const formEl = container.querySelector('[data-testid="class-form"]') as HTMLElement;
    await waitFor(() => {
      expect(formEl.getAttribute('data-primary-stat')).toBe(String(Stat.INT));
    });
    const saving = formEl.getAttribute('data-saving-throws')?.split(',') ?? [];
    expect(saving).toEqual(expect.arrayContaining([String(Stat.INT), String(Stat.WIS)]));
  });

  it('prefills proficiencies and starting equipment', async () => {
    const { container } = render(() => <Classes />);
    const formEl = container.querySelector('[data-testid="class-form"]') as HTMLElement;
    await waitFor(() => {
      expect(formEl.getAttribute('data-armor-profs')).toContain('Light');
    });
    expect(formEl.getAttribute('data-weapon-profs')).toContain('Simple');
    expect(formEl.getAttribute('data-tool-profs')).toContain("Alchemist's Supplies");
    expect(formEl.getAttribute('data-item-start')).toContain('Spellbook');
  });
});
