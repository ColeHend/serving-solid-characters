import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@solidjs/testing-library';

// Stub the headless orchestrator and the stats hook so the button is exercised
// in isolation (no pdf-lib, no Dexie, no real ability-bonus resolution).
const { sheetMock } = vi.hoisted(() => ({ sheetMock: vi.fn() }));
vi.mock('../../shared/sheetMapping/pdf/createCharacterSheet', () => ({ createCharacterSheet: sheetMock }));

const STATS = { str: 10, dex: 12, con: 14, int: 8, wis: 13, cha: 11 };
vi.mock('../../shared/customHooks/dndInfo/useGetFullStats', () => ({
  default: () => () => STATS,
}));

import { CreateSheetButton } from './createSheetButton';
import { Character } from '../../models/character.model';

afterEach(() => {
  cleanup();
  sheetMock.mockReset();
});

const gandalf = () => Object.assign(new Character(), { name: 'Gandalf' });

describe('CreateSheetButton', () => {
  it('click → createCharacterSheet with the character + computed stats', () => {
    const { getByRole } = render(() => <CreateSheetButton character={gandalf()} />);

    fireEvent.click(getByRole('button'));

    expect(sheetMock).toHaveBeenCalledTimes(1);
    expect(sheetMock.mock.calls[0][0].name).toBe('Gandalf');
    expect(sheetMock.mock.calls[0][1]).toEqual(STATS);
  });

  it('disables and never generates when no character is selected', () => {
    const { getByRole } = render(() => <CreateSheetButton character={undefined} />);
    const btn = getByRole('button') as HTMLButtonElement;

    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(sheetMock).not.toHaveBeenCalled();
  });
});
