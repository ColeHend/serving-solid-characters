import { render, fireEvent, screen, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { homebrewManager } from '../../../../../../shared/customHooks/homebrewManager';
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
  useSearchParams: () => [{ name: 'Wizard' }]
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
// Keep real Stats/Proficiencies/Items to observe prefill side-effects. Still mock heavier tables.
vi.mock('../featureTable', () => ({ FeatureTable: () => <div data-mock="FeatureTable" /> }));
// Lightweight header with name input (real component not essential for these tests)
vi.mock('../header', () => ({ Header: () => <div data-mock="Header"><label>Name<input aria-label="name" onInput={(e: any) => (globalThis as any).__FORM_NAME__ = e.currentTarget.value} /></label></div> }));

import { Classes } from '../classes';

// Fake adapter side-effects already inside component; ensure clean state
beforeEach(() => {
  // reset manager state (private API not exposed; mimic by reloading page objects if needed)
  // For simplicity just ensure starting length used in assertions.
});

describe('Classes component prefill', () => {

  it('prefills primary stat (INT) and saving throws from existing class (expected failing before fix)', async () => {
    const { container } = render(() => <Classes />);
    const formEl = container.querySelector('[data-testid="class-form"]') as HTMLElement;
    await waitFor(() => {
      expect(formEl.getAttribute('data-primary-stat')).toBe(String(Stat.INT));
    });
    const saving = formEl.getAttribute('data-saving-throws')?.split(',') ?? [];
    expect(saving).toEqual(expect.arrayContaining([String(Stat.INT), String(Stat.WIS)]));
  });

  it('prefills proficiencies and starting equipment (expected failing before fix)', async () => {
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
