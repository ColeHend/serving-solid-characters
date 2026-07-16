import { render, waitFor, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';
import { createSignal } from 'solid-js';
import type { FeatureDetail } from '../../../../../models/generated';

// Mocks (must come before importing target component). The popup calls these four
// data hooks at component top; useDndFeatures additionally runs other hooks at
// module load, so the whole module must be replaced.
vi.mock('../../../../../shared/customHooks/dndInfo/info/all/spells', () => ({
  useDnDSpells: () => (() => [])
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

describe('FeaturesPopup edit hydration', () => {

  // Regression tripwire: hydrating an edit-mode feature used to loop forever
  // ("too much recursion") because the hydration effect tracked the internal
  // feature signal it was writing. render() itself throws pre-fix.
  it('hydrates an edit-mode feature without recursing', async () => {
    const feature = createSignal<FeatureDetail>(editFeature());
    const { container } = render(() =>
      <FeaturesPopup Show={createSignal(true)} feature={feature} isEdit={() => true} onClose={vi.fn()} />
    );
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('Regain HP');
  });

  it('re-opens blank (add mode) after cancel, dropping the previous edit\'s mad rows', async () => {
    const [getF, setF] = createSignal<FeatureDetail>(editFeature());
    const onClose = vi.fn();
    const { container, getByText } = render(() =>
      <FeaturesPopup Show={createSignal(true)} feature={[getF, setF]} isEdit={() => true} onClose={onClose} />
    );
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    // Mirror the real close→reopen flow: Cancel clears the internal state,
    // then the parent's openAddFeature hands over a fresh blank feature.
    fireEvent.click(getByText('Cancel'));
    setF(blankFeature());
    await waitFor(() => expect(nameInput(container).value).toBe(''));

    fireEvent.click(getByText('Update Feature'));
    const emitted = onClose.mock.calls.at(-1)![0] as FeatureDetail;
    expect(emitted.name).toBe('');
    expect(emitted.metadata!.mads).toHaveLength(0);
  });

  it('emits edited name/description via onClose with hydrated mads preserved', async () => {
    const feature = createSignal<FeatureDetail>(editFeature());
    const onClose = vi.fn();
    const { container, getByText } = render(() =>
      <FeaturesPopup Show={createSignal(true)} feature={feature} isEdit={() => true} onClose={onClose} />
    );
    await waitFor(() => expect(nameInput(container).value).toBe('Second Wind'));

    fireEvent.input(nameInput(container), { target: { value: 'Reckless Rage' } });
    fireEvent.input(container.querySelector('textarea')!, { target: { value: 'Attack with abandon' } });

    fireEvent.click(getByText('Update Feature'));
    const emitted = onClose.mock.calls.at(-1)![0] as FeatureDetail;
    expect(emitted.name).toBe('Reckless Rage');
    expect(emitted.description).toBe('Attack with abandon');
    expect(emitted.metadata!.mads).toHaveLength(2);
    expect(emitted.metadata!.mads![0].command).toBe('AddHitPoints');
  });
});
