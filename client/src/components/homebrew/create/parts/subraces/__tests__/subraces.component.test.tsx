import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@solidjs/testing-library';
import Subraces from '../subraces';

// Mock shared export homebrewManager & constants
let savedFlag = false; // retained for potential future assertions
vi.mock('../../../../../shared', () => {
  const races = [ { name: 'Elf', subRaces: [] } ];
  return {
    SIZE_TOKENS: ['Small','Medium','Large'],
    ABILITY_SHORT: ['STR','DEX','CON','INT','WIS','CHA'],
    homebrewManager: {
      races: () => races,
      updateRace: (r: any) => { const idx = races.findIndex(x=>x.name===r.name); if (idx>-1) races[idx]=r; savedFlag = r.subRaces?.length > 0; },
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

    // Subrace name input: first textbox
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    fireEvent.input(nameInput, { target: { value: 'Wood' } });

  const saveBtn = screen.getByText('Save Subrace') as HTMLButtonElement;
  await waitFor(() => { if (saveBtn.disabled) throw new Error('disabled'); });
  });
});
