import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks (must come before importing target component)
const h = vi.hoisted(() => ({
  params: {} as Record<string, string>,
  navigate: vi.fn(),
  snackbar: vi.fn(),
  subclasses: [] as unknown[],
  classes: [] as unknown[],
  addSubclass: vi.fn().mockResolvedValue(true),
  updateSubclass: vi.fn().mockResolvedValue(true),
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
    subclasses: () => h.subclasses,
    addSubclass: h.addSubclass,
    updateSubclass: h.updateSubclass,
  },
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/classes', () => ({
  useDnDClasses: () => (() => h.classes),
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/spells', () => ({
  useDnDSpells: () => (() => [{ name: 'Fire Bolt', level: 0 }, { name: 'Magic Missile', level: 1 }]),
}));
// The shared FeaturesPopup is heavy (mads editors, SRD catalogs) — the wizard shell mounts
// it closed; stub it out for these tests.
vi.mock('../../../../Parts/featuresPopup/featuresPopup', () => ({
  FeaturesPopup: () => null,
}));

import Subclasses from '../subclasses';

// The environment's localStorage global is a partial stub; give the wizard's draft-autosave a
// real in-memory Storage, fresh per test, so a leftover draft can never show the resume banner
// and gate the ?name=&subclass= prefill these tests assert on.
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
  h.subclasses = [];
  // Name-only classes → no detectable subclass levels → the Features step's all-20 fallback.
  h.classes = [{ name: 'Wizard' }, { name: 'Fighter' }];
  h.addSubclass.mockResolvedValue(true);
  h.updateSubclass.mockResolvedValue(true);
});

const echoSubclass = () => ({
  name: 'Echo',
  parentClass: 'Wizard',
  description: 'echo desc',
  features: { 3: [{ name: 'Echo Step', description: 'Teleport a short distance' }] },
  storage_key: 'wizard__echo',
});

describe('Subclasses wizard', () => {
  it('starts on the Identity step and walks forward via the footer', async () => {
    render(() => <Subclasses />);
    expect(screen.getByText('Which class does this subclass belong to?')).toBeTruthy();
    fireEvent.click(screen.getByText('Continue to Features →'));
    await waitFor(() => {
      expect(screen.getByText('What do they gain as they level?')).toBeTruthy();
    });
  });

  it('prefills identity + feature levels from ?name=&subclass=', async () => {
    h.params = { name: 'Wizard', subclass: 'Echo' };
    h.subclasses = [echoSubclass()];
    const { container } = render(() => <Subclasses />);
    const formEl = container.querySelector('[data-testid="subclass-form"]') as HTMLElement;
    await waitFor(() => {
      expect(formEl.getAttribute('data-parent-class')).toBe('Wizard');
    });
    expect(formEl.getAttribute('data-name')).toBe('Echo');
    expect(formEl.getAttribute('data-feature-levels')).toBe('3');
    // Name-only stored subclass resolves its selector key to the first name match.
    expect(formEl.getAttribute('data-parent-class-id')).toBe('hb:Wizard');
  });

  it('publishes an edited subclass through updateSubclass and navigates home', async () => {
    h.params = { name: 'Wizard', subclass: 'Echo' };
    h.subclasses = [echoSubclass()];
    const { container } = render(() => <Subclasses />);
    const formEl = container.querySelector('[data-testid="subclass-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Echo'));

    fireEvent.click(screen.getByText('Review')); // stepper jump
    const publishBtn = await screen.findByText(/^Publish/);
    fireEvent.click(publishBtn);

    await waitFor(() => expect(h.updateSubclass).toHaveBeenCalledTimes(1));
    expect(h.addSubclass).not.toHaveBeenCalled();
    const saved = h.updateSubclass.mock.calls[0][0];
    expect(saved.storage_key).toBe('wizard__echo');
    expect(saved.features[3][0].name).toBe('Echo Step');
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith('/homebrew'));
  });

  it('blocks publishing a duplicate subclass name for the same class', async () => {
    h.subclasses = [echoSubclass()];
    // New draft (no edit params) that collides with the stored Echo
    localStorage.setItem('hb:subclassDraft:new', JSON.stringify({
      v: 1,
      form: { parentClass: 'Wizard', name: 'Echo', description: '' },
      levels: { features: {} },
      step: 3,
    }));
    render(() => <Subclasses />);
    fireEvent.click(await screen.findByText('Resume draft'));

    const publishBtn = await screen.findByText(/^Publish/);
    fireEvent.click(publishBtn);

    await waitFor(() => expect(h.snackbar).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning', message: expect.stringContaining('already has a subclass named') }),
    ));
    expect(h.addSubclass).not.toHaveBeenCalled();
    expect(h.updateSubclass).not.toHaveBeenCalled();
  });

  it('limits the Features pill grid to the parent class\'s subclass levels', async () => {
    h.classes = [
      {
        name: 'Wizard',
        features: {
          3: [{ name: 'Wizard Subclass', description: 'Choose a subclass.' }],
          6: [{ name: 'Subclass Feature', description: 'See your subclass.' }],
          10: [{ name: 'Subclass Feature', description: 'See your subclass.' }],
          14: [{ name: 'Subclass Feature', description: 'See your subclass.' }],
        },
      },
      { name: 'Fighter' },
    ];
    localStorage.setItem('hb:subclassDraft:new', JSON.stringify({
      v: 1,
      form: { parentClass: 'Wizard', name: 'Echo', description: '' },
      levels: { features: {} },
      step: 1,
    }));
    render(() => <Subclasses />);
    fireEvent.click(await screen.findByText('Resume draft'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Level 3,/ })).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: /^Level 6,/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Level 10,/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Level 14,/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Level 1,/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Level 4,/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Level 20,/ })).toBeNull();
  });

  it('keeps out-of-range levels visible as flagged pills with a warning banner', async () => {
    h.classes = [
      {
        name: 'Wizard',
        features: {
          3: [{ name: 'Wizard Subclass', description: 'Choose a subclass.' }],
          6: [{ name: 'Subclass Feature', description: 'See your subclass.' }],
        },
      },
      { name: 'Fighter' },
    ];
    localStorage.setItem('hb:subclassDraft:new', JSON.stringify({
      v: 1,
      form: { parentClass: 'Wizard', name: 'Echo', description: '' },
      levels: { features: { 5: [{ id: 'f5', name: 'Stray Step', description: 'Placed off-cadence' }] } },
      step: 1,
    }));
    render(() => <Subclasses />);
    fireEvent.click(await screen.findByText('Resume draft'));

    const strayPill = await screen.findByRole('button', { name: /^Level 5,.*not a subclass level/ });
    expect(strayPill).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Level 3,/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Level 4,/ })).toBeNull();
    expect(screen.getByText(/Level 5 isn't among Wizard's subclass levels/)).toBeTruthy();
  });

  it('resolves the parent by selector key, not first name match (2014 vs 2024 Wizard)', async () => {
    h.classes = [
      {
        id: 'w14', name: 'Wizard', legacy: true,
        features: { 2: [{ name: 'Arcane Tradition', description: 'Choose a tradition.' }], 6: [{ name: 'Arcane Tradition Feature', description: 'See your subclass.' }] },
      },
      {
        id: 'w24', name: 'Wizard', legacy: false,
        features: { 3: [{ name: 'Wizard Subclass', description: 'Choose a subclass.' }], 6: [{ name: 'Subclass Feature', description: 'See your subclass.' }] },
      },
    ];
    localStorage.setItem('hb:subclassDraft:new', JSON.stringify({
      v: 1,
      form: { parentClass: 'Wizard', parentClassId: 'w24', name: 'Echo', description: '' },
      levels: { features: {} },
      step: 1,
    }));
    render(() => <Subclasses />);
    fireEvent.click(await screen.findByText('Resume draft'));

    // The 2024 Wizard (id w24) grants at 3/6 — the 2014 first-name-match would show 2/6.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Level 3,/ })).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: /^Level 6,/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Level 2,/ })).toBeNull();
  });

  it('snaps the selected level to the first allowed pill when 3 is not offered', async () => {
    // 2014-style Wizard grants at 2/6/10/14 — the step's initial selection (3) must snap to 2.
    h.classes = [
      {
        id: 'w14', name: 'Wizard', legacy: true,
        features: {
          2: [{ name: 'Arcane Tradition', description: 'Choose a tradition.' }],
          6: [{ name: 'Arcane Tradition Feature', description: 'See your subclass.' }],
          10: [{ name: 'Arcane Tradition Feature', description: 'See your subclass.' }],
          14: [{ name: 'Arcane Tradition Feature', description: 'See your subclass.' }],
        },
      },
    ];
    localStorage.setItem('hb:subclassDraft:new', JSON.stringify({
      v: 1,
      form: { parentClass: 'Wizard', parentClassId: 'w14', name: 'Echo', description: '' },
      levels: { features: {} },
      step: 1,
    }));
    render(() => <Subclasses />);
    fireEvent.click(await screen.findByText('Resume draft'));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Level 3,/ })).toBeNull();
    });
    // Selection snapped off the missing 3 onto the first offered level.
    expect(screen.getByText(/Level 2 — 0 Features/)).toBeTruthy();
    expect(screen.getByText('Add feature to level 2')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Level 2,/ }).getAttribute('aria-pressed')).toBe('true');
  });

  it('offers to resume a saved draft and restores its form + step', async () => {
    localStorage.setItem('hb:subclassDraft:new', JSON.stringify({
      v: 1,
      form: { parentClass: 'Wizard', name: 'Drafty', description: 'wip' },
      levels: { features: {} },
      step: 1,
    }));
    const { container } = render(() => <Subclasses />);
    const resumeBtn = await screen.findByText('Resume draft');
    fireEvent.click(resumeBtn);

    const formEl = container.querySelector('[data-testid="subclass-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Drafty'));
    expect(screen.getByText('What do they gain as they level?')).toBeTruthy();
  });
});
