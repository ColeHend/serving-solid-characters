import { render, waitFor, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';
import { createSignal } from 'solid-js';
import type { FeatureDetail } from '../../../../../models/generated';

// Mocks (must come before importing target component). The popup calls these four
// data hooks at component top; useDndFeatures additionally runs other hooks at
// module load, so the whole module must be replaced.
vi.mock('../../../../../shared/customHooks/dndInfo/info/all/spells', () => ({
  useDnDSpells: () => (() => [
    { id: 'sp1', name: 'Bless' },
    { id: 'sp2', name: 'Cure Wounds' },
  ])
}));
vi.mock('../../../../../shared/customHooks/dndInfo/info/all/items', () => ({
  useDnDItems: () => (() => [])
}));
vi.mock('../../../../../shared/customHooks/dndInfo/info/all/feats', () => ({
  useDnDFeats: () => (() => [])
}));
vi.mock('../../../../../shared/customHooks/dndInfo/useDndFeatures', () => ({
  useDndFeature: () => ({ allFeatures: () => [], setAllFeatures: () => {} })
}));

import { FeaturesPopup } from '../featuresPopup';

const editFeature = (): FeatureDetail => ({
  id: 'f1',
  name: 'Second Wind',
  description: 'Regain HP',
  metadata: {
    uses: 0,
    recharge: '',
    spells: [],
    category: '',
    mads: [
      { command: 'AddHitPoints', value: { amount: '5' }, type: 0, prerequisites: [], group: 0 },
      { command: 'AddUses', value: { amount: '1', recharge: 'short' }, type: 1, prerequisites: [], group: 0 },
    ],
  },
});

const blankFeature = (): FeatureDetail => ({ id: '', name: '', description: '' });

const nameInput = (container: HTMLElement) =>
  container.querySelector('input[data-mock="Input"]') as HTMLInputElement;

const usesInput = (container: HTMLElement) =>
  container.querySelector('input[type="number"]') as HTMLInputElement;

const spellInput = (container: HTMLElement) =>
  container.querySelector('input[placeholder^="Type a spell"]') as HTMLInputElement;

const renderPopup = (feature: FeatureDetail, onClose = vi.fn()) => {
  const featureSignal = createSignal<FeatureDetail>(feature);
  const utils = render(() =>
    <FeaturesPopup Show={createSignal(true)} feature={featureSignal} isEdit={() => !!feature.id} onClose={onClose} />
  );
  return { ...utils, onClose, setFeature: featureSignal[1] };
};

const lastEmitted = (onClose: ReturnType<typeof vi.fn>) =>
  onClose.mock.calls.at(-1)![0] as FeatureDetail;

describe('FeaturesPopup edit hydration', () => {

  // Regression tripwire: hydrating an edit-mode feature used to loop forever
  // ("too much recursion") because the hydration effect tracked the internal
  // feature signal it was writing. render() itself throws pre-fix.
  it('hydrates an edit-mode feature without recursing', async () => {
    const { container } = renderPopup(editFeature());
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('Regain HP');
  });

  it('re-opens blank (add mode) after cancel, dropping the previous edit\'s mad rows', async () => {
    const { container, getByText, onClose, setFeature } = renderPopup(editFeature());
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    // Mirror the real close→reopen flow: Cancel clears the internal state,
    // then the parent's openAddFeature hands over a fresh blank feature.
    fireEvent.click(getByText('Cancel'));
    setFeature(blankFeature());
    await waitFor(() => expect(nameInput(container).value).toBe(''));

    fireEvent.click(getByText('Save changes'));
    const emitted = lastEmitted(onClose);
    expect(emitted.name).toBe('');
    expect(emitted.id).toBe('');
    expect(emitted.metadata!.mads).toHaveLength(0);
  });

  it('emits edited name/description via onClose with id and hydrated mads preserved', async () => {
    const { container, getByText, onClose } = renderPopup(editFeature());
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    fireEvent.input(nameInput(container), { target: { value: 'Reckless Rage' } });
    fireEvent.input(container.querySelector('textarea')!, { target: { value: 'Attack with abandon' } });

    fireEvent.click(getByText('Save changes'));
    const emitted = lastEmitted(onClose);
    expect(emitted.name).toBe('Reckless Rage');
    expect(emitted.description).toBe('Attack with abandon');
    expect(emitted.id).toBe('f1');
    expect(emitted.metadata!.mads).toHaveLength(2);
    expect(emitted.metadata!.mads![0].command).toBe('AddHitPoints');
  });

  it('hydrates and re-emits feature options + optionsConfig on save (metadata rebuild must not drop them)', async () => {
    const feature = editFeature();
    feature.metadata!.optionsConfig = { label: 'Invocation', countScaling: '2:2,5:3' };
    feature.metadata!.options = [
      {
        name: 'Armor of Shadows',
        description: 'Cast mage armor at will.',
        mads: [{ command: 'AddSpells', value: { ID: 'sp1' }, type: 0, prerequisites: [], group: 0 }],
      },
      {
        name: 'Thirsting Blade',
        description: 'Attack twice with your pact weapon.',
        prerequisites: { minLevel: 5, requiredFeature: 'Pact of the Blade', text: '5th level, Pact of the Blade' },
        mads: [],
      },
    ];
    const { container, getByText, onClose } = renderPopup(feature);
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    fireEvent.click(getByText('Save changes'));
    const emitted = lastEmitted(onClose);
    expect(emitted.metadata!.optionsConfig).toEqual({ label: 'Invocation', countScaling: '2:2,5:3' });
    expect(emitted.metadata!.options).toHaveLength(2);
    expect(emitted.metadata!.options![0]).toMatchObject({
      name: 'Armor of Shadows',
      mads: [{ command: 'AddSpells', value: { ID: 'sp1' } }],
    });
    expect(emitted.metadata!.options![1].prerequisites).toEqual({
      minLevel: 5, requiredFeature: 'Pact of the Blade', text: '5th level, Pact of the Blade',
    });
  });

  it('preserves an edited free-text category on save', async () => {
    const feature = editFeature();
    feature.metadata!.category = 'Channel Divinity';
    const { container, getByText, onClose } = renderPopup(feature);
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    const categoryInput = container.querySelectorAll('input[data-mock="Input"]')[1] as HTMLInputElement;
    expect(categoryInput.value).toBe('Channel Divinity');
    expect(categoryInput.disabled).toBe(false);
    fireEvent.input(categoryInput, { target: { value: 'Rage Powers' } });

    fireEvent.click(getByText('Save changes'));
    expect(lastEmitted(onClose).metadata!.category).toBe('Rage Powers');
  });

  it('locks the category input for wizard machine tags', async () => {
    const feature = editFeature();
    feature.metadata!.category = 'ASI';
    const { container } = renderPopup(feature);
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    const categoryInput = container.querySelectorAll('input[data-mock="Input"]')[1] as HTMLInputElement;
    expect(categoryInput.disabled).toBe(true);
  });
});

describe('Per-effect prerequisites', () => {

  it("persists each hydrated mad's own prerequisites through save", async () => {
    const feature = editFeature();
    feature.metadata!.mads = [
      { command: 'AddHitPoints', value: { amount: '5' }, type: 0, prerequisites: [{ value: 'Level', operation: '>=', keyValue: '7', group: 0 }], group: 0 },
      { command: 'AddSpells', value: { ID: 'sp1' }, type: 0, prerequisites: [{ value: 'Class', operation: '===', keyValue: 'Fighter', group: 0 }], group: 0 },
    ];
    const { container, getByText, onClose } = renderPopup(feature);
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    fireEvent.click(getByText('Save changes'));
    const mads = lastEmitted(onClose).metadata!.mads!;
    expect(mads[0].prerequisites).toEqual([{ value: 'Level', operation: '>=', keyValue: '7', group: 0 }]);
    expect(mads[1].prerequisites).toEqual([{ value: 'Class', operation: '===', keyValue: 'Fighter', group: 0 }]);
  });

  it('adding a rule on one effect card leaves the other card untouched', async () => {
    const feature = editFeature();
    feature.metadata!.mads = [
      { command: 'AddHitPoints', value: { amount: '5' }, type: 0, prerequisites: [], group: 0 },
      { command: 'AddSpells', value: { ID: 'sp1' }, type: 0, prerequisites: [], group: 0 },
    ];
    const { container, getByText, getAllByText } = renderPopup(feature);
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    fireEvent.click(getByText('Effects (2)'));
    const addRuleButtons = getAllByText('+ Add Rule');
    expect(addRuleButtons).toHaveLength(2);

    fireEvent.click(addRuleButtons[0]);

    // Exactly ONE rule row in the whole tab — the shared-form bug rendered it on every card.
    expect(getAllByText('Character has')).toHaveLength(1);
  });
});

describe('Usage & spells ↔ mads bridge', () => {

  it('binds limited uses to the AddUses mad and excludes it from the effect count', async () => {
    const { container, getByText } = renderPopup(editFeature());
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    // AddUses is owned by the Usage & spells tab; only AddHitPoints is an effect.
    getByText('Effects (1)');

    fireEvent.click(getByText('Usage & spells'));
    await waitFor(() => expect(usesInput(container).value).toBe('1'));
  });

  it('updates the AddUses mad from the usage tab, normalizing the recharge label', async () => {
    const { container, getByText, onClose } = renderPopup(editFeature());
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    fireEvent.click(getByText('Usage & spells'));
    await waitFor(() => expect(usesInput(container)).toBeTruthy());
    fireEvent.change(usesInput(container), { target: { value: '3' } });

    fireEvent.click(getByText('Save changes'));
    const mads = lastEmitted(onClose).metadata!.mads!;
    const usesMads = mads.filter(m => m.command === 'AddUses');
    expect(usesMads).toHaveLength(1);
    expect(usesMads[0].value).toEqual({ amount: '3', recharge: 'Short Rest' });
  });

  it('removes the AddUses mad when uses are cleared', async () => {
    const { container, getByText, onClose } = renderPopup(editFeature());
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    fireEvent.click(getByText('Usage & spells'));
    await waitFor(() => expect(usesInput(container)).toBeTruthy());
    fireEvent.change(usesInput(container), { target: { value: '' } });

    fireEvent.click(getByText('Save changes'));
    const mads = lastEmitted(onClose).metadata!.mads!;
    expect(mads).toHaveLength(1);
    expect(mads[0].command).toBe('AddHitPoints');
  });

  it('adds a spell chip on Enter and emits a concrete AddSpells mad', async () => {
    const { container, getByText, onClose } = renderPopup(editFeature());
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    fireEvent.click(getByText('Usage & spells'));
    await waitFor(() => expect(spellInput(container)).toBeTruthy());
    fireEvent.input(spellInput(container), { target: { value: 'Bless' } });
    fireEvent.keyDown(spellInput(container), { key: 'Enter' });

    await waitFor(() => expect(container.querySelector('[data-mock="Chip"][data-value="Bless"]')).toBeTruthy());
    // Granted spells show in BOTH tabs — the new row also counts as an effect.
    getByText('Effects (2)');

    fireEvent.click(getByText('Save changes'));
    const mads = lastEmitted(onClose).metadata!.mads!;
    const spellMad = mads.find(m => m.command === 'AddSpells');
    expect(spellMad?.value).toEqual({ ID: 'sp1' });
    expect(spellMad?.type).toBe(0);
  });

  it('drops the AddSpells mad when its chip is removed', async () => {
    const feature = editFeature();
    feature.metadata!.mads!.push({ command: 'AddSpells', value: { ID: 'sp2' }, type: 0, prerequisites: [], group: 0 });
    const { container, getByText, onClose } = renderPopup(feature);
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    fireEvent.click(getByText('Usage & spells'));
    await waitFor(() => expect(container.querySelector('[data-mock="Chip"][data-value="Cure Wounds"]')).toBeTruthy());
    fireEvent.click(container.querySelector('button[aria-label="remove Cure Wounds"]')!);

    fireEvent.click(getByText('Save changes'));
    const mads = lastEmitted(onClose).metadata!.mads!;
    expect(mads.some(m => m.command === 'AddSpells')).toBe(false);
    expect(mads).toHaveLength(2);
  });

  it('diverts Save through the unset-effects guard and drops the unset row on Save anyway', async () => {
    const feature = editFeature();
    // A row the author never finished: no command, no value → isUnsetRow.
    feature.metadata!.mads!.push({ command: '', value: {}, type: 0, prerequisites: [], group: 0 });
    const { container, getByText, onClose } = renderPopup(feature);
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    fireEvent.click(getByText('Save changes'));
    expect(onClose).not.toHaveBeenCalled(); // guard intercepted the close

    fireEvent.click(getByText('Save anyway'));
    const mads = lastEmitted(onClose).metadata!.mads!;
    expect(mads).toHaveLength(2); // AddHitPoints + AddUses; the junk row is gone
    expect(mads.some(m => m.command === '')).toBe(false);
  });

  it('Keep editing returns from the guard without closing or losing state', async () => {
    const feature = editFeature();
    feature.metadata!.mads!.push({ command: '', value: {}, type: 0, prerequisites: [], group: 0 });
    const { container, getByText, onClose } = renderPopup(feature);
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    fireEvent.click(getByText('Cancel'));
    expect(onClose).not.toHaveBeenCalled(); // guard intercepted the discard
    fireEvent.click(getByText('Keep editing'));

    // Still editing: saving again re-diverts, and the confirmed save carries the full state.
    fireEvent.click(getByText('Save changes'));
    fireEvent.click(getByText('Save anyway'));
    const emitted = lastEmitted(onClose);
    expect(emitted.name).toBe('Second Wind');
    expect(emitted.metadata!.mads).toHaveLength(2);
  });

  it('binds only the FIRST AddUses mad; duplicates stay visible as effects', async () => {
    const feature = editFeature();
    feature.metadata!.mads = [
      { command: 'AddUses', value: { amount: '1', recharge: 'short' }, type: 1, prerequisites: [], group: 0 },
      { command: 'AddUses', value: { amount: '9', recharge: 'Long Rest' }, type: 1, prerequisites: [], group: 0 },
      { command: 'AddHitPoints', value: { amount: '5' }, type: 0, prerequisites: [], group: 0 },
    ];
    const { container, getByText, onClose } = renderPopup(feature);
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    // The duplicate AddUses is NOT hidden — it counts as an effect alongside AddHitPoints.
    getByText('Effects (2)');

    fireEvent.click(getByText('Usage & spells'));
    await waitFor(() => expect(usesInput(container).value).toBe('1'));
    fireEvent.change(usesInput(container), { target: { value: '4' } });

    fireEvent.click(getByText('Save changes'));
    const mads = lastEmitted(onClose).metadata!.mads!;
    expect(mads[0].value["amount"]).toBe('4');
    expect(mads[1].value["amount"]).toBe('9');
  });
});

describe('Languages effect editor', () => {

  const languagesFeature = (value: Record<string, string>): FeatureDetail => ({
    id: 'f2',
    name: 'Linguist',
    description: 'Learn languages',
    metadata: {
      uses: 0,
      recharge: '',
      spells: [],
      category: '',
      mads: [{ command: 'AddLanguages', value, type: 0, prerequisites: [], group: 0 }],
    },
  });

  const checkbox = (container: HTMLElement, label: string) =>
    container.querySelector(`input[data-mock="Checkbox"][label="${label}"]`) as HTMLInputElement;

  it('re-commits an existing single language instead of wiping it (hydration regression)', async () => {
    const { container, getByText, onClose } = renderPopup(languagesFeature({ name: 'Elvish' }));
    await waitFor(() => expect(nameInput(container).value).toBe('Linguist'));

    fireEvent.click(getByText('Effects (1)'));
    fireEvent.click(getByText('Edit value'));
    fireEvent.click(getByText('Set Languages'));

    fireEvent.click(getByText('Save changes'));
    const mads = lastEmitted(onClose).metadata!.mads!;
    expect(mads).toHaveLength(1);
    expect(mads[0].value).toEqual({ name: 'Elvish' });
  });

  it('commits the all-languages choice form (choice + count, no options)', async () => {
    const { container, getByText, onClose } = renderPopup(languagesFeature({ name: 'Elvish' }));
    await waitFor(() => expect(nameInput(container).value).toBe('Linguist'));

    fireEvent.click(getByText('Effects (1)'));
    fireEvent.click(getByText('Edit value'));
    fireEvent.click(checkbox(container, 'Let the player choose the language(s)'));
    getByText('The player may pick any language.');
    fireEvent.change(container.querySelector('input[type="number"]')!, { target: { value: '2' } });
    fireEvent.click(getByText('Set Languages'));

    fireEvent.click(getByText('Save changes'));
    const mads = lastEmitted(onClose).metadata!.mads!;
    expect(mads[0].value).toEqual({ name: 'choice', count: '2' });
  });

  it('commits the curated choice form with an options CSV', async () => {
    const { container, getByText, onClose } = renderPopup(languagesFeature({ name: 'Elvish' }));
    await waitFor(() => expect(nameInput(container).value).toBe('Linguist'));

    fireEvent.click(getByText('Effects (1)'));
    fireEvent.click(getByText('Edit value'));
    fireEvent.click(checkbox(container, 'Let the player choose the language(s)'));
    fireEvent.click(checkbox(container, 'Limit to a curated list'));

    const allowed = container.querySelector('select[data-mock="Select"][multiple]') as HTMLSelectElement;
    for (const opt of Array.from(allowed.options)) {
      if (opt.value === 'Elvish' || opt.value === 'Giant') opt.selected = true;
    }
    fireEvent.change(allowed);

    fireEvent.click(getByText('Set Languages'));

    fireEvent.click(getByText('Save changes'));
    const mads = lastEmitted(onClose).metadata!.mads!;
    expect(mads[0].value).toEqual({ name: 'choice', options: 'Elvish,Giant', count: '1' });
  });
});
