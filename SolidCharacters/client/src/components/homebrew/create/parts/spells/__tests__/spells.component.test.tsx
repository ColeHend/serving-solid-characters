import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks (must come before importing target component)
const h = vi.hoisted(() => ({
  params: {} as Record<string, string>,
  navigate: vi.fn(),
  snackbar: vi.fn(),
  spells: [] as { name: string; [key: string]: unknown }[],
  classes: [] as { name: string }[],
  addSpell: vi.fn(),
  updateSpell: vi.fn(),
  removeSpell: vi.fn(),
  handoff: null as unknown,
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
    spells: () => h.spells,
    addSpell: h.addSpell,
    updateSpell: h.updateSpell,
    removeSpell: h.removeSpell,
  },
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/classes', () => ({
  useDnDClasses: () => (() => h.classes),
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/spells', () => ({
  useDnDSpells: () => (() => [
    {
      name: 'Fire Bolt', level: '0', school: 'Evocation', description: 'srd cantrip',
      castingTime: '1 action', range: '120 feet', duration: 'Instantaneous',
      concentration: false, ritual: false, isVerbal: true, isSomatic: true, isMaterial: false,
      classes: ['Wizard'], subClasses: [], id: 'srd-firebolt', components: 'V, S', damageType: 'Fire', page: '',
    },
  ]),
}));
vi.mock('../../../../../../shared/ai/editHandoff', () => ({
  takeEditHandoff: () => h.handoff,
}));

import Spells from '../spells';

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

const storedFireball = () => ({
  id: 'hb-fireball', name: 'Fireball', description: 'A bright streak…',
  duration: 'Instantaneous', concentration: false, components: 'V, S, M',
  level: '3', range: '150 feet', ritual: false, school: 'Evocation',
  castingTime: '1 action', damageType: 'Fire', page: 'PHB 241',
  isMaterial: true, isSomatic: true, isVerbal: true, materialsNeeded: 'a ball of bat guano',
  higherLevel: 'More dice.', classes: ['Wizard', 'Sorcerer'], subClasses: [],
});

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  vi.clearAllMocks();
  h.params = {};
  h.spells = [];
  h.classes = [{ name: 'Wizard' }, { name: 'Fighter' }];
  h.handoff = null;
  // Publish verifies the save landed by re-reading the live list, so the mocks
  // must actually mutate it like the real manager's finalize() does.
  h.addSpell.mockImplementation((spell: { name: string }) => { h.spells.push(spell); return Promise.resolve(); });
  h.updateSpell.mockImplementation((spell: { name: string }) => {
    h.spells = h.spells.map(s => s.name === spell.name ? spell : s);
    return Promise.resolve();
  });
  h.removeSpell.mockImplementation((name: string) => {
    h.spells = h.spells.filter(s => s.name !== name);
    return Promise.resolve();
  });
});

describe('Spells wizard', () => {
  it('starts on the Identity step and walks forward via the footer', async () => {
    render(() => <Spells />);
    expect(screen.getByText('What is this spell?')).toBeTruthy();
    fireEvent.click(screen.getByText('Continue to Casting →'));
    await waitFor(() => {
      expect(screen.getByText('How is it cast?')).toBeTruthy();
    });
  });

  it('prefills from ?name=, preferring the homebrew spell over the SRD one', async () => {
    h.params = { name: 'Fire Bolt' };
    // Homebrew copy of the SRD name with a different school — the homebrew one must win.
    h.spells = [{ ...storedFireball(), name: 'Fire Bolt', school: 'Necromancy', level: '0' }];
    const { container } = render(() => <Spells />);
    const formEl = container.querySelector('[data-testid="spell-form"]') as HTMLElement;
    await waitFor(() => {
      expect(formEl.getAttribute('data-name')).toBe('Fire Bolt');
    });
    expect(formEl.getAttribute('data-school')).toBe('Necromancy');
    expect(formEl.getAttribute('data-classes')).toBe('Wizard,Sorcerer');
  });

  it('prefills from an SRD spell when no homebrew copy exists', async () => {
    h.params = { name: 'Fire Bolt' };
    const { container } = render(() => <Spells />);
    const formEl = container.querySelector('[data-testid="spell-form"]') as HTMLElement;
    await waitFor(() => {
      expect(formEl.getAttribute('data-name')).toBe('Fire Bolt');
    });
    expect(formEl.getAttribute('data-school')).toBe('Evocation');
    expect(formEl.getAttribute('data-level')).toBe('0');
  });

  it('prefills from an AI edit handoff', async () => {
    h.handoff = { ...storedFireball(), name: 'Grimoire Gift', id: '' };
    const { container } = render(() => <Spells />);
    const formEl = container.querySelector('[data-testid="spell-form"]') as HTMLElement;
    await waitFor(() => {
      expect(formEl.getAttribute('data-name')).toBe('Grimoire Gift');
    });
  });

  it('publishes a new spell through addSpell and navigates home', async () => {
    localStorage.setItem('hb:spellDraft:new', JSON.stringify({
      v: 1,
      form: {
        name: 'Echo Bolt', level: '2', school: 'Evocation', description: 'Boom.',
        castingTime: '1 action', range: '60 feet', duration: 'Instantaneous',
        classes: ['Wizard'], damageType: 'Thunder',
      },
      step: 3,
    }));
    render(() => <Spells />);
    fireEvent.click(await screen.findByText('Resume draft'));

    const publishBtn = await screen.findByText(/^Publish/);
    fireEvent.click(publishBtn);

    await waitFor(() => expect(h.addSpell).toHaveBeenCalledTimes(1));
    expect(h.updateSpell).not.toHaveBeenCalled();
    const saved = h.addSpell.mock.calls[0][0];
    expect(saved.name).toBe('Echo Bolt');
    expect(saved.level).toBe('2');
    expect(saved.damageType).toBe('Thunder'); // pass-through survives the draft
    expect(saved.classes).toEqual(['Wizard']);
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith('/homebrew'));
    expect(localStorage.getItem('hb:spellDraft:new')).toBeNull();
  });

  it('publishes an edited spell through updateSpell, not addSpell', async () => {
    h.params = { name: 'Fireball' };
    h.spells = [storedFireball()];
    const { container } = render(() => <Spells />);
    const formEl = container.querySelector('[data-testid="spell-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Fireball'));

    fireEvent.click(screen.getByText('Review')); // stepper jump
    const publishBtn = await screen.findByText(/^Publish/);
    fireEvent.click(publishBtn);

    await waitFor(() => expect(h.updateSpell).toHaveBeenCalledTimes(1));
    expect(h.addSpell).not.toHaveBeenCalled();
    const saved = h.updateSpell.mock.calls[0][0];
    expect(saved.id).toBe('hb-fireball');
    expect(saved.materialsNeeded).toBe('a ball of bat guano');
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith('/homebrew'));
  });

  it('blocks publishing a name that collides with a spell not being edited', async () => {
    h.spells = [storedFireball()];
    localStorage.setItem('hb:spellDraft:new', JSON.stringify({
      v: 1,
      form: { name: 'Fireball', description: 'counterfeit' },
      step: 3,
    }));
    render(() => <Spells />);
    fireEvent.click(await screen.findByText('Resume draft'));

    const publishBtn = await screen.findByText(/^Publish/);
    fireEvent.click(publishBtn);

    await waitFor(() => expect(h.snackbar).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning', message: expect.stringContaining('already exists') }),
    ));
    expect(h.addSpell).not.toHaveBeenCalled();
    expect(h.updateSpell).not.toHaveBeenCalled();
  });

  it('refuses to publish without a name and jumps back to Identity', async () => {
    localStorage.setItem('hb:spellDraft:new', JSON.stringify({
      v: 1,
      form: { description: 'nameless' },
      step: 3,
    }));
    render(() => <Spells />);
    fireEvent.click(await screen.findByText('Resume draft'));

    const publishBtn = await screen.findByText(/^Publish/);
    fireEvent.click(publishBtn);

    await waitFor(() => expect(h.snackbar).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning', message: expect.stringContaining('Name your spell') }),
    ));
    expect(h.addSpell).not.toHaveBeenCalled();
    expect(screen.getByText('What is this spell?')).toBeTruthy();
  });

  it('offers to resume a saved draft and restores its form + step', async () => {
    localStorage.setItem('hb:spellDraft:new', JSON.stringify({
      v: 1,
      form: { name: 'Drafty', level: '1', classes: ['Fighter'] },
      step: 1,
    }));
    const { container } = render(() => <Spells />);
    fireEvent.click(await screen.findByText('Resume draft'));

    const formEl = container.querySelector('[data-testid="spell-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Drafty'));
    expect(formEl.getAttribute('data-classes')).toBe('Fighter');
    expect(screen.getByText('How is it cast?')).toBeTruthy();
  });

  it('deletes an existing homebrew spell from the Review step', async () => {
    h.params = { name: 'Fireball' };
    h.spells = [storedFireball()];
    const { container } = render(() => <Spells />);
    const formEl = container.querySelector('[data-testid="spell-form"]') as HTMLElement;
    await waitFor(() => expect(formEl.getAttribute('data-name')).toBe('Fireball'));

    fireEvent.click(screen.getByText('Review')); // stepper jump
    const deleteBtn = await screen.findByText('Delete spell');
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(h.removeSpell).toHaveBeenCalledWith('Fireball'));
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith('/homebrew'));
  });
});
