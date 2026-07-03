import { describe, it, vi, beforeEach, expect } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@solidjs/testing-library';
import Subraces from '../subraces';
import { homebrewManager } from '../../../../../../shared';

// Mock shared export homebrewManager & constants. NOTE: the path must resolve
// to the same module the editor imports (src/shared). This file lives one level
// deeper (in __tests__), so it needs six `../`, not five — with five the mock
// targeted a non-existent src/components/shared and silently never applied.
vi.mock('../../../../../../shared', () => {
  // Race needs an id so parentRaceId() resolves (subraces link by parentRace === id).
  const races = [ { id: 'elf-id', name: 'Elf' } ];
  const subraces: any[] = [];
  return {
    SIZE_TOKENS: ['Small','Medium','Large'],
    ABILITY_SHORT: ['STR','DEX','CON','INT','WIS','CHA'],
    homebrewManager: {
      races: () => races,
      subraces: () => subraces,
      saveSubrace: vi.fn(async (s: any) => { subraces.push(s); return true; }),
      removeSubrace: vi.fn(async () => true),
    }
  };
});

// Router param hook mock
vi.mock('@solidjs/router', () => ({ useSearchParams: () => [{}, vi.fn()] }));

describe('Subraces component', () => {
  beforeEach(() => {
    // Clear DOM between tests
    document.body.innerHTML='';
  });

  it('renders and creates a new subrace', async () => {
    render(() => <Subraces />);

    // Parent select (first select). Our mock library doesn't render labels so rely on order.
    const parentSelect = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
    // Manually inject option in case race list rendered empty due to reactive ordering
    if (![...parentSelect.options].some(o=>o.value==='Elf')) {
      const opt = document.createElement('option'); opt.value='Elf'; opt.textContent='Elf'; parentSelect.appendChild(opt);
    }
    fireEvent.change(parentSelect, { target: { value: 'Elf' } });

    // Subrace name input: first textbox. The name field commits on the
    // native change event (library Input onChange semantics), not per
    // keystroke, so fire change rather than input.
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Wood' } });

  const saveBtn = screen.getByText('Save Subrace') as HTMLButtonElement;
  await waitFor(() => { if (saveBtn.disabled) throw new Error('disabled'); });

    // Clicking Save must persist to the flat table with parentRace = the parent
    // race's id (this is the exact flow the name-vs-id lookup bug silently aborted).
    fireEvent.click(saveBtn);
    await waitFor(() =>
      expect(homebrewManager.saveSubrace).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Wood', parentRace: 'elf-id' })
      )
    );
  });
});
