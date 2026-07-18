import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';

// Mocks must come before importing the component (which pulls in the router hooks).
vi.mock('@solidjs/router', () => ({
  useSearchParams: () => [{}, vi.fn()],
  useNavigate: () => vi.fn(),
}));
// Interactive stub for the shared FeaturesPopup: exercises the shell's adapter wiring
// (Show/isEdit/onClose) without mounting the heavy mads/SRD editors.
vi.mock('../../../../Parts/featuresPopup/featuresPopup', () => ({
  // JSX expression container keeps the Show read reactive (a bare ternary in the
  // component body would evaluate once, before the signal ever flips).
  FeaturesPopup: (props: {
    Show: [() => boolean, (v: boolean) => void];
    isEdit: () => boolean;
    onClose?: (data: unknown) => void;
  }) => (
    <div data-testid="popup-stub-root">
      {props.Show[0]()
        ? <div data-testid="popup-stub">
          <span>{props.isEdit() ? 'edit-mode' : 'add-mode'}</span>
          <button onClick={() => {
            props.onClose?.({ id: '', name: 'PopupFeat', description: 'from popup', metadata: { category: 'Magic' } });
            props.Show[1](false);
          }}>stub-save</button>
        </div>
        : null}
    </div>
  ),
}));

import Items from '../items';
import { itemsStore } from '../itemsStore';
import { Feature, FeatureTypes } from '../../../../../../models/old/core.model';

describe('Items wizard shared FeaturesPopup wiring', () => {
  beforeEach(() => {
    itemsStore._testReset();
    itemsStore._testSetSrd({ Dagger: { name: 'Dagger' } });
  });

  it('adds a feature through the popup adapter and lists it', async () => {
    render(() => <Items />);
    fireEvent.click(screen.getByText('Features'));
    await waitFor(() => expect(screen.getByText('Does it do anything special?')).toBeTruthy());

    fireEvent.click(screen.getByText('Add feature'));
    expect(await screen.findByText('add-mode')).toBeTruthy();
    fireEvent.click(screen.getByText('stub-save'));

    await waitFor(() =>
      expect(itemsStore.state.form!.features.some(f => f.name === 'PopupFeat')).toBe(true));
    const saved = itemsStore.state.form!.features.find(f => f.name === 'PopupFeat')!;
    expect(saved.value).toBe('from popup');
    expect(saved.info.type).toBe(FeatureTypes.Item);
    // Row renders through the shared FeatureRow with the popup's category.
    expect(screen.getByText('PopupFeat')).toBeTruthy();
    expect(screen.getByText('Magic')).toBeTruthy();
  });

  it('editing an existing feature replaces it in place', async () => {
    itemsStore.selectNew();
    const existing: Feature<string, string> = {
      name: 'Shiny',
      value: 'glows',
      info: { className: '', subclassName: '', level: 0, type: FeatureTypes.Item, other: 'item' },
      metadata: {},
    };
    itemsStore.mutate(d => { d.features = [existing]; });
    render(() => <Items />);
    fireEvent.click(screen.getByText('Features'));
    await waitFor(() => expect(screen.getByText('Shiny')).toBeTruthy());

    fireEvent.click(screen.getByText('Shiny')); // FeatureRow main button → edit
    expect(await screen.findByText('edit-mode')).toBeTruthy();
    fireEvent.click(screen.getByText('stub-save'));

    await waitFor(() => expect(itemsStore.state.form!.features).toHaveLength(1));
    expect(itemsStore.state.form!.features[0].name).toBe('PopupFeat');
  });
});
