import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FeatureDetail } from '../../../../../../models/generated';

// Mocks (must come before importing target component)
const h = vi.hoisted(() => ({
  params: {} as Record<string, string>,
  navigate: vi.fn(),
  snackbar: vi.fn(),
  feats: [] as { name?: string; details?: { name: string; [key: string]: unknown }; [key: string]: unknown }[],
  srdFeats: [] as unknown[],
  classes: [] as { name: string }[],
  addFeat: vi.fn(),
  updateFeat: vi.fn(),
  removeFeat: vi.fn(),
  handoff: null as unknown,
  // What the mocked FeaturesPopup emits on save; the last props it received.
  popupSaved: null as ((feature: unknown) => unknown) | null,
  popupProps: null as { feature: [() => unknown, unknown] } | null,
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
    feats: () => h.feats,
    addFeat: h.addFeat,
    updateFeat: h.updateFeat,
    removeFeat: h.removeFeat,
  },
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/feats', () => ({
  useDnDFeats: () => (() => h.srdFeats),
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/classes', () => ({
  useDnDClasses: () => (() => h.classes),
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/subclasses', () => ({
  useDnDSubclasses: () => (() => []),
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/races', () => ({
  useDnDRaces: () => (() => []),
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/items', () => ({
  useDnDItems: () => (() => []),
}));
vi.mock('../../../../../../shared/ai/editHandoff', () => ({
  takeEditHandoff: () => h.handoff,
}));
// The real FeaturesPopup drags in half the catalog hooks; the wizard only needs its
// contract — feature in, onClose(FeatureDetail) out — so stand in a plain DOM button.
vi.mock('../../../../Parts/featuresPopup/featuresPopup', () => ({
  FeaturesPopup: (props: {
    feature: [() => unknown, unknown];
    onClose?: (data: unknown) => void;
    Show: [() => boolean, (v: boolean) => void];
  }) => {
    h.popupProps = props;
    const button = document.createElement('button');
    button.textContent = 'Mock effects save';
    button.onclick = () => {
      props.Show[1](false);
      props.onClose?.(h.popupSaved ? h.popupSaved(props.feature[0]()) : props.feature[0]());
    };
    return button;
  },
}));

import Feats from '../feats';

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

const resistanceMad = () => ({
  command: 'AddResistances', value: { damageType: 'Fire' }, type: 0, prerequisites: [], group: 0,
});

const storedAlert = () => ({
  id: 'hb-alert',
  details: {
    id: 'hb-alert', name: 'Alert', description: 'Always ready.',
    metadata: { uses: 0, recharge: '', spells: [], category: '', mads: [resistanceMad()] },
  },
  prerequisites: [{ type: 7, value: 'DEX 13' }],
  name: 'Alert',
  desc: ['Always ready.'],
});

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  vi.clearAllMocks();
  h.params = {};
  h.feats = [];
  h.srdFeats = [{
    details: { id: '', name: 'Grappler', description: 'srd feat' },
    prerequisites: [{ type: 7, value: 'STR 13' }],
  }];
  h.classes = [{ name: 'Wizard' }];
  h.handoff = null;
  h.popupSaved = null;
  h.popupProps = null;
  // Publish verifies the save landed by re-reading the live list, so the mocks
  // must actually mutate it like the real manager's finalize() does.
  h.addFeat.mockImplementation((feat: { name: string }) => { h.feats.push(feat); return Promise.resolve(); });
  h.updateFeat.mockImplementation((feat: { name: string }) => {
    h.feats = h.feats.map(f => f.name === feat.name ? feat : f);
    return Promise.resolve();
  });
  h.removeFeat.mockImplementation((name: string) => {
    h.feats = h.feats.filter(f => (f.details?.name ?? f.name) !== name);
    return Promise.resolve();
  });
});

const formEl = (container: HTMLElement) =>
  container.querySelector('[data-testid="feat-form"]') as HTMLElement;

describe('Feats wizard', () => {
  it('starts on the Identity step and walks forward via the footer', async () => {
    render(() => <Feats />);
    expect(screen.getByText('What is this feat?')).toBeTruthy();
    fireEvent.click(screen.getByText('Continue to Prerequisites →'));
    await waitFor(() => {
      expect(screen.getByText('What must a character have first?')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('Continue to Effects →'));
    await waitFor(() => {
      expect(screen.getByText('What does it do mechanically?')).toBeTruthy();
    });
  });

  it('prefills from ?name=, preferring the homebrew feat (with its mads) over the SRD one', async () => {
    h.params = { name: 'Grappler' };
    h.feats = [{ ...storedAlert(), name: 'Grappler', details: { ...storedAlert().details, name: 'Grappler' } }];
    const { container } = render(() => <Feats />);
    await waitFor(() => {
      expect(formEl(container).getAttribute('data-name')).toBe('Grappler');
    });
    expect(formEl(container).getAttribute('data-description')).toBe('Always ready.');
    expect(formEl(container).getAttribute('data-prereqs')).toBe('DEX 13');
    expect(formEl(container).getAttribute('data-mads')).toBe('AddResistances');
  });

  it('prefills from an SRD feat when no homebrew copy exists', async () => {
    h.params = { name: 'Grappler' };
    const { container } = render(() => <Feats />);
    await waitFor(() => {
      expect(formEl(container).getAttribute('data-name')).toBe('Grappler');
    });
    expect(formEl(container).getAttribute('data-description')).toBe('srd feat');
    expect(formEl(container).getAttribute('data-prereqs')).toBe('STR 13');
  });

  it('prefills from an AI edit handoff, keeping its mads', async () => {
    h.handoff = { ...storedAlert(), id: '', details: { ...storedAlert().details, name: 'Grimoire Gift' } };
    const { container } = render(() => <Feats />);
    await waitFor(() => {
      expect(formEl(container).getAttribute('data-name')).toBe('Grimoire Gift');
    });
    expect(formEl(container).getAttribute('data-mads')).toBe('AddResistances');
  });

  it('adds the default ability-score prerequisite through the builder', async () => {
    render(() => <Feats />);
    fireEvent.click(screen.getByText('Continue to Prerequisites →'));
    fireEvent.click(await screen.findByText('Add requirement'));
    const container = document.body;
    await waitFor(() => {
      expect(formEl(container as HTMLElement).getAttribute('data-prereqs')).toBe('STR 10');
    });
    expect(screen.getByText('STR 10')).toBeTruthy();
  });

  it('authors effects through the popup and writes them back into the form', async () => {
    h.popupSaved = (feature) => ({
      ...(feature as FeatureDetail),
      metadata: { uses: 0, recharge: '', spells: [], category: '', mads: [resistanceMad()] },
    });
    const { container } = render(() => <Feats />);
    fireEvent.change(screen.getByPlaceholderText('Enter feat name...'), { target: { value: 'War Caster' } });
    await waitFor(() => expect(formEl(container).getAttribute('data-name')).toBe('War Caster'));

    fireEvent.click(screen.getByText('Continue to Prerequisites →'));
    fireEvent.click(screen.getByText('Continue to Effects →'));
    fireEvent.click(await screen.findByText('Add effects'));
    fireEvent.click(screen.getByText('Mock effects save'));

    await waitFor(() => {
      expect(formEl(container).getAttribute('data-mads')).toBe('AddResistances');
    });
    // The popup was hydrated from the wizard's form, not a blank feature.
    expect((h.popupProps!.feature[0]() as FeatureDetail).name).toBe('War Caster');
  });

  it('refuses to open the effects editor for an unnamed feat', async () => {
    render(() => <Feats />);
    fireEvent.click(screen.getByText('Continue to Prerequisites →'));
    fireEvent.click(screen.getByText('Continue to Effects →'));
    fireEvent.click(await screen.findByText('Add effects'));

    await waitFor(() => expect(h.snackbar).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning', message: expect.stringContaining('Name your feat') }),
    ));
    expect(screen.getByText('What is this feat?')).toBeTruthy();
  });

  it('publishes a new feat through addFeat and navigates home', async () => {
    localStorage.setItem('hb:featDraft:new', JSON.stringify({
      v: 1,
      form: {
        name: 'War Caster', description: 'Advantage on concentration.',
        prerequisites: [{ type: 7, value: 'INT 13' }],
        metadata: { uses: 0, recharge: '', spells: [], category: '', mads: [resistanceMad()] },
      },
      step: 3,
    }));
    render(() => <Feats />);
    fireEvent.click(await screen.findByText('Resume draft'));

    const publishBtn = await screen.findByText(/^Publish/);
    fireEvent.click(publishBtn);

    await waitFor(() => expect(h.addFeat).toHaveBeenCalledTimes(1));
    expect(h.updateFeat).not.toHaveBeenCalled();
    const saved = h.addFeat.mock.calls[0][0];
    expect(saved.name).toBe('War Caster');
    expect(saved.desc).toEqual(['Advantage on concentration.']);
    expect(saved.details.name).toBe('War Caster');
    expect(saved.details.metadata.mads).toEqual([resistanceMad()]); // mads survive the draft + publish
    expect(saved.prerequisites).toEqual([{ type: 7, value: 'INT 13' }]);
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith('/homebrew'));
    expect(localStorage.getItem('hb:featDraft:new')).toBeNull();
  });

  it('publishes an edited feat through updateFeat, not addFeat', async () => {
    h.params = { name: 'Alert' };
    h.feats = [storedAlert()];
    const { container } = render(() => <Feats />);
    await waitFor(() => expect(formEl(container).getAttribute('data-name')).toBe('Alert'));

    fireEvent.click(screen.getByText('Review')); // stepper jump
    const publishBtn = await screen.findByText(/^Publish/);
    fireEvent.click(publishBtn);

    await waitFor(() => expect(h.updateFeat).toHaveBeenCalledTimes(1));
    expect(h.addFeat).not.toHaveBeenCalled();
    const saved = h.updateFeat.mock.calls[0][0];
    expect(saved.id).toBe('hb-alert');
    expect(saved.details.metadata.mads).toEqual([resistanceMad()]);
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith('/homebrew'));
  });

  it('blocks publishing a name that collides with a feat not being edited', async () => {
    h.feats = [storedAlert()];
    localStorage.setItem('hb:featDraft:new', JSON.stringify({
      v: 1,
      form: { name: 'Alert', description: 'counterfeit' },
      step: 3,
    }));
    render(() => <Feats />);
    fireEvent.click(await screen.findByText('Resume draft'));

    const publishBtn = await screen.findByText(/^Publish/);
    fireEvent.click(publishBtn);

    await waitFor(() => expect(h.snackbar).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning', message: expect.stringContaining('already exists') }),
    ));
    expect(h.addFeat).not.toHaveBeenCalled();
    expect(h.updateFeat).not.toHaveBeenCalled();
  });

  it('refuses to publish without a name and jumps back to Identity', async () => {
    localStorage.setItem('hb:featDraft:new', JSON.stringify({
      v: 1,
      form: { description: 'nameless' },
      step: 3,
    }));
    render(() => <Feats />);
    fireEvent.click(await screen.findByText('Resume draft'));

    const publishBtn = await screen.findByText(/^Publish/);
    fireEvent.click(publishBtn);

    await waitFor(() => expect(h.snackbar).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning', message: expect.stringContaining('Name your feat') }),
    ));
    expect(h.addFeat).not.toHaveBeenCalled();
    expect(screen.getByText('What is this feat?')).toBeTruthy();
  });

  it('offers to resume a saved draft and restores its form + step', async () => {
    localStorage.setItem('hb:featDraft:new', JSON.stringify({
      v: 1,
      form: { name: 'Drafty', prerequisites: [{ type: 1, value: '4' }] },
      step: 1,
    }));
    const { container } = render(() => <Feats />);
    fireEvent.click(await screen.findByText('Resume draft'));

    await waitFor(() => expect(formEl(container).getAttribute('data-name')).toBe('Drafty'));
    expect(formEl(container).getAttribute('data-prereqs')).toBe('4');
    expect(screen.getByText('What must a character have first?')).toBeTruthy();
  });

  it('deletes an existing homebrew feat from the Review step', async () => {
    h.params = { name: 'Alert' };
    h.feats = [storedAlert()];
    const { container } = render(() => <Feats />);
    await waitFor(() => expect(formEl(container).getAttribute('data-name')).toBe('Alert'));

    fireEvent.click(screen.getByText('Review')); // stepper jump
    const deleteBtn = await screen.findByText('Delete feat');
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(h.removeFeat).toHaveBeenCalledWith('Alert'));
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith('/homebrew'));
  });
});
