import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { backgroundsStore } from '../../../../../../shared/stores/backgroundsStore';

// Mock remote data hooks BEFORE importing component (must match import spec in component)
vi.mock('../../../../../shared/customHooks/dndInfo/info/all/backgrounds', () => ({ useDnDBackgrounds: () => () => [] }));
vi.mock('../../../../../shared/customHooks/dndInfo/info/all/feats', () => ({ useDnDFeats: () => () => [] }));

import Backgrounds from '../backgrounds';

describe('Backgrounds equipment integration', () => {
  beforeEach(() => {
    // reset selection state through provided API
    (backgroundsStore as any).state.selection.activeName = undefined;
    (backgroundsStore as any).state.form.equipmentOptionKey = undefined;
  });

  async function initNewDraft() {
    render(() => <Backgrounds />);
    backgroundsStore.selectNew();
    // ensure UI reflects new draft (Save button present)
    await waitFor(()=> expect(screen.getByText('Save As Homebrew')).toBeTruthy());
  }

  it('adds pending item then commits group (A: Backpack)', async () => {
    await initNewDraft();
    const equipHeading = screen.getByText('🧰 Equipment');
    const sectionRoot = equipHeading.closest('div')!.parentElement!.parentElement!;
    const editBtn = Array.from(sectionRoot.querySelectorAll('button')).find(b => b.textContent === 'Edit')!;
    fireEvent.click(editBtn);
    fireEvent.click(screen.getByText('Pick / Add Items'));
    fireEvent.click(screen.getByText('Backpack'));
    // Option keys input
    const optionField = Array.from(document.querySelectorAll('[data-mock="FormField"]')).find(f => f.getAttribute('name') === 'Option Keys (comma sep)')!;
    const keyInput = optionField.querySelector('input')!;
    fireEvent.input(keyInput, { target: { value: 'A' } });
    const commitBtn = screen.getByText('Commit Group') as HTMLButtonElement;
    await waitFor(()=> expect(commitBtn.disabled).toBe(false));
  fireEvent.click(commitBtn);
  // Chip mock doesn't render value text; assert group count indicator increments instead
  await waitFor(()=> expect(screen.getAllByText(/1\s+groups/).length).toBeGreaterThan(0));
  });
});
