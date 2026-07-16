import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks (must come before importing target component)
const h = vi.hoisted(() => ({
  params: {} as Record<string, string>,
  navigate: vi.fn(),
  snackbar: vi.fn(),
  /** Merged SRD+homebrew list served by useDnDBackgrounds. */
  all: [] as unknown[],
  /** Homebrew-only list served by homebrewManager.backgrounds(). */
  homebrew: [] as unknown[],
  addBackground: vi.fn().mockResolvedValue(undefined),
  updateBackground: vi.fn().mockResolvedValue(undefined),
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
    backgrounds: () => h.homebrew,
    addBackground: h.addBackground,
    updateBackground: h.updateBackground,
  },
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/backgrounds', () => ({
  useDnDBackgrounds: () => (() => h.all),
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/feats', () => ({
  useDnDFeats: () => (() => [
    { id: 'feat-1', details: { id: 'feat-1', name: 'Magic Initiate', description: 'Learn spells.' }, prerequisites: [] },
    { id: 'feat-2', details: { id: 'feat-2', name: 'Grappler', description: 'Grab.' }, prerequisites: [{ type: 'stat' }] },
  ]),
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/items', () => ({
  useDnDItems: () => (() => []),
}));
// The shared FeaturesPopup is heavy (mads editors, SRD catalogs) — the wizard shell mounts
// it closed; stub it out for these tests.
vi.mock('../../../../Parts/featuresPopup/featuresPopup', () => ({
  FeaturesPopup: () => null,
}));

import Backgrounds from '../backgrounds';

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
  h.addBackground.mockResolvedValue(undefined);
  h.updateBackground.mockResolvedValue(undefined);
});

const acolyte = () => ({
  id: 'bg-1',
  name: 'Acolyte',
  desc: 'Temple service',
  proficiencies: { armor: [], weapons: [], tools: [], skills: ['Insight', 'Religion'] },
  startEquipment: [{ optionKeys: ['A'], items: ['Holy Symbol', '15gp'] }],
  abilityOptions: ['Intelligence', 'Wisdom', 'Charisma'],
  feat: 'feat-1',
  languages: { options: ['Celestial'], amount: 1 },
  features: [{ id: 'f1', name: 'Shelter of the Faithful', description: 'Aid from temples' }],
});

describe('Backgrounds wizard', () => {
  it('starts on the Identity step and walks forward via the footer', async () => {
    render(() => <Backgrounds />);
    expect(screen.getByText('Where do they come from?')).toBeTruthy();
    fireEvent.click(screen.getByText('Continue to Abilities & Feat →'));
    await waitFor(() => {
      expect(screen.getByText('What did their past hone?')).toBeTruthy();
    });
  });

  it('prefills the form from a ?name= homebrew background', async () => {
    h.params = { name: 'Acolyte' };
    h.all = [acolyte()];
    h.homebrew = [acolyte()];
    const { container } = render(() => <Backgrounds />);
    const formEl = container.querySelector('[data-testid="background-form"]') as HTMLElement;
    await waitFor(() => {
      expect(formEl.getAttribute('data-name')).toBe('Acolyte');
    });
    expect(formEl.getAttribute('data-feat')).toBe('feat-1');
    expect(formEl.getAttribute('data-abilities')).toBe('Intelligence,Wisdom,Charisma');
    expect(formEl.getAttribute('data-languages')).toBe('Celestial');
    expect(formEl.getAttribute('data-groups')).toBe('A');
    expect(formEl.getAttribute('data-features')).toBe('Shelter of the Faithful');
  });

  it('publishes an edited homebrew background through updateBackground with its id preserved', async () => {
    h.params = { name: 'Acolyte' };
    h.all = [acolyte()];
    h.homebrew = [acolyte()];
    const { container } = render(() => <Backgrounds />);
    const formEl = container.querySelector('[data-testid="background-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Acolyte'));

    fireEvent.click(screen.getByText('Review')); // stepper jump
    const publishBtn = await screen.findByText(/^Publish/);
    fireEvent.click(publishBtn);

    await waitFor(() => expect(h.updateBackground).toHaveBeenCalledTimes(1));
    expect(h.addBackground).not.toHaveBeenCalled();
    const saved = h.updateBackground.mock.calls[0][0];
    expect(saved.id).toBe('bg-1');
    // Coins survive the prefill → publish round trip in the persisted encoding.
    expect(saved.startEquipment).toEqual([{ optionKeys: ['A'], items: ['Holy Symbol', '15gp'] }]);
    expect(saved.languages).toEqual({ options: ['Celestial'], amount: 1 });
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith('/homebrew'));
  });

  it('clones an SRD background (?name= with no homebrew row) through addBackground with a fresh id', async () => {
    h.params = { name: 'Acolyte' };
    h.all = [acolyte()];
    h.homebrew = [];
    const { container } = render(() => <Backgrounds />);
    const formEl = container.querySelector('[data-testid="background-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Acolyte'));

    fireEvent.click(screen.getByText('Review'));
    fireEvent.click(await screen.findByText(/^Publish/));

    await waitFor(() => expect(h.addBackground).toHaveBeenCalledTimes(1));
    expect(h.updateBackground).not.toHaveBeenCalled();
    const saved = h.addBackground.mock.calls[0][0];
    expect(saved.name).toBe('Acolyte');
    expect(saved.id).toBeTruthy();
    expect(saved.id).not.toBe('bg-1');
  });

  it('blocks publishing a new background whose name collides with existing homebrew', async () => {
    h.homebrew = [acolyte()];
    // New draft (no edit params) that collides with the stored Acolyte
    localStorage.setItem('hb:backgroundDraft:new', JSON.stringify({
      v: 1,
      form: { name: 'Acolyte', desc: '' },
      extras: { equipment: [], features: [] },
      step: 5,
    }));
    render(() => <Backgrounds />);
    fireEvent.click(await screen.findByText('Resume draft'));

    fireEvent.click(await screen.findByText(/^Publish/));

    await waitFor(() => expect(h.snackbar).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning', message: expect.stringContaining('already exists') }),
    ));
    expect(h.addBackground).not.toHaveBeenCalled();
    expect(h.updateBackground).not.toHaveBeenCalled();
  });

  it('offers to resume a saved draft and restores its form + step', async () => {
    localStorage.setItem('hb:backgroundDraft:new', JSON.stringify({
      v: 1,
      form: { name: 'Drafty', desc: 'wip', languages: ['Sylvan'] },
      extras: { equipment: [], features: [] },
      step: 1,
    }));
    const { container } = render(() => <Backgrounds />);
    fireEvent.click(await screen.findByText('Resume draft'));

    const formEl = container.querySelector('[data-testid="background-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Drafty'));
    expect(formEl.getAttribute('data-languages')).toBe('Sylvan');
    expect(screen.getByText('What did their past hone?')).toBeTruthy();
  });
});
