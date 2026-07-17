import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks (must come before importing target component)
const h = vi.hoisted(() => ({
  params: {} as Record<string, string>,
  setParams: vi.fn(),
  navigate: vi.fn(),
  snackbar: vi.fn(),
  /** Active-ruleset SRD list served by useGetSrdRaces. */
  srd: [] as unknown[],
  /** Homebrew-only lists served by homebrewManager. */
  homebrewRaces: [] as unknown[],
  subraces: [] as unknown[],
  saveSubrace: vi.fn().mockResolvedValue(true),
}));

vi.mock('@solidjs/router', () => ({
  useSearchParams: () => [h.params, h.setParams],
  useNavigate: () => h.navigate,
}));
// Spy on snackbar calls (no SnackbarController is mounted in tests, so messages
// never reach the DOM); everything else stays the real library.
vi.mock('coles-solid-library', async (importOriginal) => {
  const actual = await importOriginal<typeof import('coles-solid-library')>();
  return { ...actual, addSnackbar: h.snackbar };
});
vi.mock('../../../../../../shared/customHooks/homebrewManager', () => ({
  homebrewManager: {
    races: () => h.homebrewRaces,
    subraces: () => h.subraces,
    saveSubrace: h.saveSubrace,
  },
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/srd/races', () => ({
  useGetSrdRaces: () => (() => h.srd),
}));
vi.mock('../../../../../../shared/customHooks/userSettings', () => {
  const getUserSettings = () => [() => ({ dndSystem: '2024' })];
  return { default: getUserSettings, getUserSettings };
});
// The shared FeaturesPopup is heavy (mads editors, SRD catalogs) — the wizard shell mounts
// it closed; stub it out for these tests.
vi.mock('../../../../Parts/featuresPopup/featuresPopup', () => ({
  FeaturesPopup: () => null,
}));

import Subraces from '../subraces';

// The environment's localStorage global is a partial stub; give the wizard's draft-autosave a
// real in-memory Storage, fresh per test, so a leftover draft can never show the resume banner
// and gate the deep-link prefill these tests assert on.
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
  vi.clearAllMocks();
  h.params = {};
  h.srd = [];
  h.homebrewRaces = [];
  h.subraces = [];
  h.saveSubrace.mockResolvedValue(true);
});

const hbElf = () => ({
  id: 'race-1',
  name: 'Elf',
  size: 'Medium',
  speed: 30,
  languages: ['Common', 'Elvish'],
  abilityBonuses: [{ stat: 1, value: 2 }],
  traits: [],
});

const srdDwarf = () => ({
  id: 'srd-dwarf',
  name: 'Dwarf',
  legacy: false,
  size: 'Medium',
  speed: 25,
  languages: ['Common', 'Dwarvish'],
  abilityBonuses: [{ stat: 2, value: 2 }],
  traits: [],
});

const highElf = () => ({
  id: 'sub-1',
  name: 'High Elf',
  parentRace: 'race-1',
  size: 'Medium',
  speed: 30,
  languages: [],
  languageChoice: { amount: 1, options: [] },
  abilityBonuses: [{ stat: 3, value: 1 }],
  traits: [{
    id: 'feat-1',
    details: { id: 'fd-1', name: 'Cantrip', description: 'One wizard cantrip.' },
    prerequisites: [],
  }],
  descriptions: { desc: 'Magic-touched.', age: '' },
});

describe('Subraces wizard', () => {
  it('starts on the Identity step and walks forward via the footer', async () => {
    render(() => <Subraces />);
    expect(screen.getByText('Who are they descended from?')).toBeTruthy();
    fireEvent.click(screen.getByText('Continue to Abilities →'));
    await waitFor(() => {
      expect(screen.getByText('What does this lineage add?')).toBeTruthy();
    });
  });

  it('prefills from a ?race=&subrace= deep link once both rows hydrate', async () => {
    h.params = { race: 'Elf', subrace: 'High Elf' };
    h.homebrewRaces = [hbElf()];
    h.subraces = [highElf()];
    const { container } = render(() => <Subraces />);
    const formEl = container.querySelector('[data-testid="subrace-form"]') as HTMLElement;
    await waitFor(() => {
      expect(formEl.getAttribute('data-name')).toBe('High Elf');
    });
    expect(formEl.getAttribute('data-parent')).toBe('Elf');
    expect(formEl.getAttribute('data-abilities')).toBe('INT +1');
    expect(formEl.getAttribute('data-traits')).toBe('Cantrip');
  });

  it('publishes an edited subrace through saveSubrace with id and parent preserved', async () => {
    h.params = { race: 'Elf', subrace: 'High Elf' };
    h.homebrewRaces = [hbElf()];
    h.subraces = [highElf()];
    const { container } = render(() => <Subraces />);
    const formEl = container.querySelector('[data-testid="subrace-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('High Elf'));

    fireEvent.click(screen.getByText('Review')); // stepper jump
    fireEvent.click(await screen.findByText(/^Publish/));

    await waitFor(() => expect(h.saveSubrace).toHaveBeenCalledTimes(1));
    const saved = h.saveSubrace.mock.calls[0][0];
    expect(saved.id).toBe('sub-1');
    expect(saved.parentRace).toBe('race-1');
    expect(saved.name).toBe('High Elf');
    expect(saved.descriptions.desc).toBe('Magic-touched.');
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith('/homebrew'));
    expect(h.snackbar).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', message: expect.stringContaining('updated') }),
    );
  });

  it('creates a subrace of an SRD parent (?race= alone preselects it)', async () => {
    h.params = { race: 'Dwarf' };
    h.srd = [srdDwarf()];
    h.homebrewRaces = [];
    const { container } = render(() => <Subraces />);
    const formEl = container.querySelector('[data-testid="subrace-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-parent')).toBe('Dwarf'));

    fireEvent.change(screen.getByPlaceholderText('Enter subrace name...'), { target: { value: 'Hill Dwarf' } });
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Hill Dwarf'));

    fireEvent.click(screen.getByText('Review'));
    fireEvent.click(await screen.findByText(/^Publish/));

    await waitFor(() => expect(h.saveSubrace).toHaveBeenCalledTimes(1));
    const saved = h.saveSubrace.mock.calls[0][0];
    expect(saved.parentRace).toBe('srd-dwarf'); // links by the SRD race's id
    expect(saved.name).toBe('Hill Dwarf');
    expect(saved.id).toBeTruthy();
  });

  it('blocks publishing without a parent race', async () => {
    render(() => <Subraces />);
    fireEvent.change(screen.getByPlaceholderText('Enter subrace name...'), { target: { value: 'Orphan' } });
    fireEvent.click(screen.getByText('Review'));
    fireEvent.click(await screen.findByText(/^Publish/));

    await waitFor(() => expect(h.snackbar).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning', message: expect.stringContaining('parent race') }),
    ));
    expect(h.saveSubrace).not.toHaveBeenCalled();
  });

  it('blocks a name that collides with any stored subrace (the table is name-keyed)', async () => {
    h.homebrewRaces = [hbElf()];
    // Same name under a DIFFERENT parent still collides — Dexie keys subraces by name alone.
    h.subraces = [{ ...highElf(), id: 'sub-2', parentRace: 'race-2' }];
    localStorage.setItem('hb:subraceDraft:_:new', JSON.stringify({
      v: 1,
      form: { parentRaceKey: 'race-1', parentRaceName: 'Elf', name: 'High Elf' },
      extras: { traits: [] },
      step: 5,
    }));
    render(() => <Subraces />);
    fireEvent.click(await screen.findByText('Resume draft'));

    fireEvent.click(await screen.findByText(/^Publish/));

    await waitFor(() => expect(h.snackbar).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning', message: expect.stringContaining('already exists') }),
    ));
    expect(h.saveSubrace).not.toHaveBeenCalled();
  });

  it('stays on the wizard when saveSubrace reports failure', async () => {
    h.params = { race: 'Elf', subrace: 'High Elf' };
    h.homebrewRaces = [hbElf()];
    h.subraces = [highElf()];
    h.saveSubrace.mockResolvedValue(false);
    const { container } = render(() => <Subraces />);
    const formEl = container.querySelector('[data-testid="subrace-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('High Elf'));

    fireEvent.click(screen.getByText('Review'));
    fireEvent.click(await screen.findByText(/^Publish/));

    await waitFor(() => expect(h.saveSubrace).toHaveBeenCalledTimes(1));
    expect(h.navigate).not.toHaveBeenCalled();
    // saveSubrace toasts its own error; the wizard adds no success snackbar.
    expect(h.snackbar).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
  });

  it('edits a subrace of an SRD parent even when a same-named homebrew race shadows it', async () => {
    const srdElf = { id: 'srd-elf', name: 'Elf', legacy: false, size: 'Medium', speed: 30, languages: [], abilityBonuses: [], traits: [] };
    h.params = { race: 'Elf', subrace: 'High Elf' };
    h.srd = [srdElf];
    h.homebrewRaces = [hbElf()]; // homebrew race also named 'Elf' (id race-1)
    h.subraces = [{ ...highElf(), parentRace: 'srd-elf' }]; // row belongs to the SRD Elf
    const { container } = render(() => <Subraces />);
    const formEl = container.querySelector('[data-testid="subrace-form"]') as HTMLElement;
    // Resolved by subrace name first, then parent by stored id — the homebrew
    // shadow must not blank the edit form or steal the row.
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('High Elf'));
    expect(formEl.getAttribute('data-parent')).toBe('Elf');

    fireEvent.click(screen.getByText('Review'));
    fireEvent.click(await screen.findByText(/^Publish/));
    await waitFor(() => expect(h.saveSubrace).toHaveBeenCalledTimes(1));
    const saved = h.saveSubrace.mock.calls[0][0];
    expect(saved.parentRace).toBe('srd-elf'); // stays on the original SRD parent
    expect(saved.id).toBe('sub-1');
  });

  it('publishes under a parent that exists only in the live homebrewManager list', async () => {
    // The stale useDnDRaces homebrew snapshot would miss a race created this
    // session; the wizard must resolve parents from homebrewManager.races().
    h.srd = [];
    h.homebrewRaces = [hbElf()];
    localStorage.setItem('hb:subraceDraft:_:new', JSON.stringify({
      v: 1,
      form: { parentRaceKey: 'race-1', parentRaceName: 'Elf', name: 'Wood Elf' },
      extras: { traits: [] },
      step: 5,
    }));
    render(() => <Subraces />);
    fireEvent.click(await screen.findByText('Resume draft'));
    fireEvent.click(await screen.findByText(/^Publish/));

    await waitFor(() => expect(h.saveSubrace).toHaveBeenCalledTimes(1));
    expect(h.saveSubrace.mock.calls[0][0].parentRace).toBe('race-1');
  });

  it('shows the existing-lineage picker once the chosen parent has subraces', async () => {
    h.homebrewRaces = [hbElf()];
    h.subraces = [highElf()];
    localStorage.setItem('hb:subraceDraft:_:new', JSON.stringify({
      v: 1,
      form: { parentRaceKey: 'race-1', parentRaceName: 'Elf', name: '' },
      extras: { traits: [] },
      step: 0,
    }));
    render(() => <Subraces />);
    fireEvent.click(await screen.findByText('Resume draft'));

    await waitFor(() => expect(screen.getByText('Edit an existing lineage')).toBeTruthy());
  });

  it('offers to resume a saved draft and restores its parent + step', async () => {
    localStorage.setItem('hb:subraceDraft:_:new', JSON.stringify({
      v: 1,
      form: { parentRaceKey: 'race-1', parentRaceName: 'Elf', name: 'Drafty', languages: ['Sylvan'] },
      extras: { traits: [] },
      step: 2,
    }));
    const { container } = render(() => <Subraces />);
    fireEvent.click(await screen.findByText('Resume draft'));

    const formEl = container.querySelector('[data-testid="subrace-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Drafty'));
    expect(formEl.getAttribute('data-parent')).toBe('Elf');
    expect(formEl.getAttribute('data-languages')).toBe('Sylvan');
    expect(screen.getByText('What tongues do they add?')).toBeTruthy();
  });
});
