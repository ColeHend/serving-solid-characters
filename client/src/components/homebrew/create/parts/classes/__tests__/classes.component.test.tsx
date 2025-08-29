import { render, fireEvent, screen, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { homebrewManager } from '../../../../../../shared/customHooks/homebrewManager';

// Mocks (must come before importing target component)
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/classesFiltered', () => ({
  useDnDClassesFiltered: () => (() => [])
}));
vi.mock('../../../../../../shared/customHooks/userSettings', () => ({
  getUserSettings: () => [() => ({ dndSystem: '2024' })]
}));
vi.mock('../../../../../../shared/customHooks/components/Snackbar/snackbar', () => ({
  default: () => null
}));
// Mock heavy child feature components to reduce surface / avoid table generics executing
vi.mock('../items', () => ({ Items: () => <div data-mock="Items" /> }));
vi.mock('../featureTable', () => ({ FeatureTable: () => <div data-mock="FeatureTable" /> }));
vi.mock('../proficiencies', () => ({ Proficiencies: () => <div data-mock="Proficiencies" /> }));
vi.mock('../stats', () => ({ Stats: () => <div data-mock="Stats" /> }));
vi.mock('../header', () => ({ Header: () => <div data-mock="Header"><label>Name<input aria-label="name" onInput={(e: any) => (globalThis as any).__FORM_NAME__ = e.currentTarget.value} /></label></div> }));

import { Classes } from '../classes';

// Fake adapter side-effects already inside component; ensure clean state
beforeEach(() => {
  // reset manager state (private API not exposed; mimic by reloading page objects if needed)
  // For simplicity just ensure starting length used in assertions.
});

describe('Classes component', () => {
  it('submits minimal form and persists new class via unified homebrewManager', async () => {
    const startLen = homebrewManager.classes().length;
    render(() => <Classes />);
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement | null;
    if (nameInput) {
      fireEvent.input(nameInput, { target: { value: 'MyNewClass' } });
    }
    const submitBtn = screen.getByText(/submit/i);
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(homebrewManager.classes().length).toBeGreaterThan(startLen);
    });
    expect(homebrewManager.classes().some(c => c.name === 'MyNewClass')).toBe(true);
  });
});
