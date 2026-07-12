import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { backgroundsStore } from '../../../../../../shared/stores/backgroundsStore';

// Stub router primitives: component calls useSearchParams for ?name= URL sync, which requires a
// Route context. Empty params + noop setter keep selection driven by the store API.
vi.mock('@solidjs/router', () => ({ useSearchParams: () => [{}, () => {}] }));

// Mock remote data hooks BEFORE importing component (paths resolve relative to THIS file, so
// they need six ../ segments to reach src/shared from __tests__)
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/backgrounds', () => ({ useDnDBackgrounds: () => () => [] }));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/feats', () => ({ useDnDFeats: () => () => [] }));

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
    // Equipment section is a FlatCard: title in the card header, Edit button in extraHeaderJsx
    const equipHeading = screen.getByText('Equipment');
    const card = equipHeading.closest('[data-mock="Container"]')!;
    const editBtn = Array.from(card.querySelectorAll('button')).find(b => b.textContent === 'Edit')!;
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
  // Chip mock doesn't render value text; assert group count indicator increments instead.
  // Count and label live in separate spans, so match on the card's combined text.
  await waitFor(()=> expect(card.textContent).toMatch(/1\s*groups/));
  });
});
