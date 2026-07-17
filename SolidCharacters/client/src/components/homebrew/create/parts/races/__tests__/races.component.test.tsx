import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks (must come before importing target component)
const h = vi.hoisted(() => ({
  params: {} as Record<string, string>,
  navigate: vi.fn(),
  snackbar: vi.fn(),
  /** Merged SRD+homebrew list served by useDnDRaces. */
  all: [] as unknown[],
  /** Homebrew-only list served by homebrewManager.races(). */
  homebrew: [] as unknown[],
  addRace: vi.fn(),
  updateRace: vi.fn().mockResolvedValue(undefined),
  removeRace: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@solidjs/router', () => ({
  useSearchParams: () => [h.params],
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
    races: () => h.homebrew,
    addRace: h.addRace,
    updateRace: h.updateRace,
    removeRace: h.removeRace,
  },
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/races', () => ({
  useDnDRaces: () => (() => h.all),
}));
// The shared FeaturesPopup is heavy (mads editors, SRD catalogs) — the wizard shell mounts
// it closed; stub it out for these tests.
vi.mock('../../../../Parts/featuresPopup/featuresPopup', () => ({
  FeaturesPopup: () => null,
}));

import Races from '../races';

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
  vi.clearAllMocks();
  h.params = {};
  h.all = [];
  h.homebrew = [];
  h.updateRace.mockResolvedValue(undefined);
  h.removeRace.mockResolvedValue(undefined);
});

const elf = () => ({
  id: 'race-1',
  name: 'Elf',
  size: 'Medium',
  speed: 30,
  languages: ['Common', 'Elvish'],
  languageChoice: { amount: 1, options: ['Sylvan'] },
  abilityBonuses: [{ stat: 1, value: 2 }],
  abilityBonusChoice: { amount: 1, options: [] },
  traits: [{
    id: 'feat-1',
    details: {
      id: 'fd-1', name: 'Darkvision', description: 'See in dim light.',
      metadata: { category: 'Race trait', mads: [{ command: 'AddSenses', value: { Darkvision: '60' } }] },
    },
    prerequisites: [],
  }],
  traitChoice: { amount: 1, options: [] },
  descriptions: { age: 'Long-lived', alignment: 'Chaotic', size: 'Slender', language: 'Melodic', abilities: 'Dexterous' },
});

describe('Races wizard', () => {
  it('starts on the Identity step and walks forward via the footer', async () => {
    render(() => <Races />);
    expect(screen.getByText('Who are they?')).toBeTruthy();
    fireEvent.click(screen.getByText('Continue to Abilities →'));
    await waitFor(() => {
      expect(screen.getByText('Where does their nature shine?')).toBeTruthy();
    });
  });

  it('prefills the form from a ?name= homebrew race', async () => {
    h.params = { name: 'Elf' };
    h.all = [elf()];
    h.homebrew = [elf()];
    const { container } = render(() => <Races />);
    const formEl = container.querySelector('[data-testid="race-form"]') as HTMLElement;
    await waitFor(() => {
      expect(formEl.getAttribute('data-name')).toBe('Elf');
    });
    expect(formEl.getAttribute('data-sizes')).toBe('Medium');
    expect(formEl.getAttribute('data-speed')).toBe('30');
    expect(formEl.getAttribute('data-abilities')).toBe('DEX +2');
    expect(formEl.getAttribute('data-languages')).toBe('Common,Elvish');
    expect(formEl.getAttribute('data-traits')).toBe('Darkvision');
  });

  it('prefills a race present only in the live homebrewManager list (stale useDnDRaces snapshot)', async () => {
    h.params = { name: 'Elf' };
    h.all = []; // the merged-hook snapshot misses a race created this session
    h.homebrew = [elf()];
    const { container } = render(() => <Races />);
    const formEl = container.querySelector('[data-testid="race-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Elf'));
  });

  it('publishes an edited homebrew race through updateRace, preserving id and unedited fields', async () => {
    h.params = { name: 'Elf' };
    h.all = [elf()];
    h.homebrew = [elf()];
    const { container } = render(() => <Races />);
    const formEl = container.querySelector('[data-testid="race-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Elf'));

    fireEvent.click(screen.getByText('Review')); // stepper jump
    fireEvent.click(await screen.findByText(/^Publish/));

    await waitFor(() => expect(h.updateRace).toHaveBeenCalledTimes(1));
    expect(h.addRace).not.toHaveBeenCalled();
    expect(h.removeRace).not.toHaveBeenCalled();
    const saved = h.updateRace.mock.calls[0][0];
    expect(saved.id).toBe('race-1');
    // Fields the wizard has no UI for survive the update spread.
    expect(saved.abilityBonusChoice).toEqual({ amount: 1, options: [] });
    expect(saved.traitChoice).toEqual({ amount: 1, options: [] });
    // The trait's rich metadata (mads) round-trips through the hydrate → publish path.
    expect(saved.traits[0].details.metadata.mads).toEqual([{ command: 'AddSenses', value: { Darkvision: '60' } }]);
    expect(saved.languageChoice).toEqual({ amount: 1, options: ['Sylvan'] });
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith('/homebrew'));
  });

  it('clones an SRD race (?name= with no homebrew row) through addRace with a fresh id', async () => {
    h.params = { name: 'Elf' };
    h.all = [elf()];
    h.homebrew = [];
    const { container } = render(() => <Races />);
    const formEl = container.querySelector('[data-testid="race-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Elf'));

    fireEvent.click(screen.getByText('Review'));
    fireEvent.click(await screen.findByText(/^Publish/));

    await waitFor(() => expect(h.addRace).toHaveBeenCalledTimes(1));
    expect(h.updateRace).not.toHaveBeenCalled();
    const saved = h.addRace.mock.calls[0][0];
    expect(saved.name).toBe('Elf');
    expect(saved.id).toBeTruthy();
    expect(saved.id).not.toBe('race-1');
  });

  it('renames an existing homebrew race via removeRace + addRace, keeping its id', async () => {
    h.params = { name: 'Elf' };
    h.all = [elf()];
    h.homebrew = [elf()];
    const { container } = render(() => <Races />);
    const formEl = container.querySelector('[data-testid="race-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Elf'));

    fireEvent.change(screen.getByPlaceholderText('Enter race name...'), { target: { value: 'Eladrin' } });
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Eladrin'));

    fireEvent.click(screen.getByText('Review'));
    fireEvent.click(await screen.findByText(/^Publish/));

    await waitFor(() => expect(h.addRace).toHaveBeenCalledTimes(1));
    expect(h.removeRace).toHaveBeenCalledWith('Elf');
    expect(h.updateRace).not.toHaveBeenCalled();
    const saved = h.addRace.mock.calls[0][0];
    expect(saved.name).toBe('Eladrin');
    expect(saved.id).toBe('race-1'); // same id → subraces stay linked by parentRace
  });

  it('blocks publishing a new race whose name collides with existing homebrew', async () => {
    h.homebrew = [elf()];
    // New draft (no edit params) that collides with the stored Elf
    localStorage.setItem('hb:raceDraft:new', JSON.stringify({
      v: 1,
      form: { name: 'Elf', size: ['Medium'] },
      extras: { traits: [] },
      step: 5,
    }));
    render(() => <Races />);
    fireEvent.click(await screen.findByText('Resume draft'));

    fireEvent.click(await screen.findByText(/^Publish/));

    await waitFor(() => expect(h.snackbar).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning', message: expect.stringContaining('already exists') }),
    ));
    expect(h.addRace).not.toHaveBeenCalled();
    expect(h.updateRace).not.toHaveBeenCalled();
  });

  it('offers to resume a saved draft and restores its form + step', async () => {
    localStorage.setItem('hb:raceDraft:new', JSON.stringify({
      v: 1,
      form: { name: 'Drafty', size: ['Small'], languages: ['Sylvan'] },
      extras: { traits: [] },
      step: 1,
    }));
    const { container } = render(() => <Races />);
    fireEvent.click(await screen.findByText('Resume draft'));

    const formEl = container.querySelector('[data-testid="race-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Drafty'));
    expect(formEl.getAttribute('data-languages')).toBe('Sylvan');
    expect(screen.getByText('Where does their nature shine?')).toBeTruthy();
  });
});
