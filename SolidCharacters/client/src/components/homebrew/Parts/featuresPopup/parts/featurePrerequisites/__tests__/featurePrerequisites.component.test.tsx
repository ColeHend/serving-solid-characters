import { render, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect } from 'vitest';
import { FormArray } from 'coles-solid-library';
import { FeaturePrerequisites } from '../featurePrerequisites';
import { newPrereqFormGroup } from '../../../featuresPopup.shared';
import type { MadPrereqForm } from '../../../../../../../models/data/formModels';

const renderPrereqs = (fa = new FormArray<MadPrereqForm>([])) => {
  const utils = render(() => <FeaturePrerequisites prereqForm={fa} />);
  return { ...utils, fa };
};

const selects = (container: HTMLElement) =>
  container.querySelectorAll('select[data-mock="Select"]');

describe('FeaturePrerequisites', () => {

  it('adds a rule row on + Add Rule', () => {
    const { container, getByText, fa } = renderPrereqs();
    expect(selects(container).length).toBe(0);

    fireEvent.click(getByText('+ Add Rule'));

    expect(fa.length).toBe(1);
    // Only the Trait select renders until a trait is chosen.
    expect(selects(container).length).toBe(1);
  });

  it('removes its rule when the delete button is clicked', () => {
    const { container, getByText, getByLabelText, fa } = renderPrereqs();
    fireEvent.click(getByText('+ Add Rule'));
    expect(fa.length).toBe(1);

    fireEvent.click(getByLabelText('Remove rule'));

    expect(fa.length).toBe(0);
    expect(selects(container).length).toBe(0);
  });

  it('reveals operation and value fields only after a trait is selected', () => {
    const { container, getByText } = renderPrereqs();
    fireEvent.click(getByText('+ Add Rule'));
    expect(selects(container).length).toBe(1);

    fireEvent.change(selects(container)[0], { target: { value: 'Name' } });

    // Trait + Operation selects, plus the Value text input.
    expect(selects(container).length).toBe(2);
    expect(container.querySelector('input[type="text"]')).not.toBeNull();
  });

  it('deleting the first of two rules keeps the SECOND row\'s DOM alive (rows are reference-keyed)', () => {
    // The library Select parks its display state in the FormField provider and only
    // reads props.value at mount — position-keyed rows would show the deleted row's
    // traits on the survivor. Keying by stable FormGroup refs must preserve row DOM.
    const fa = new FormArray<MadPrereqForm>([]);
    fa.add(newPrereqFormGroup({ formName: 'prereq 1', value: 'Level', operation: '>=', keyValue: '7', group: 0 }));
    fa.add(newPrereqFormGroup({ formName: 'prereq 2', value: 'Class', operation: '===', keyValue: 'Fighter', group: 0 }));
    const { getAllByLabelText } = renderPrereqs(fa);

    const [firstDelete, secondDelete] = getAllByLabelText('Remove rule');
    fireEvent.click(firstDelete);

    expect(fa.length).toBe(1);
    expect(fa.get()[0].value).toBe('Class');
    expect(firstDelete.isConnected).toBe(false);
    expect(secondDelete.isConnected).toBe(true);
  });

  it('two editors on two FormArrays stay independent — adding to one leaves the other empty', () => {
    const first = renderPrereqs();
    const second = renderPrereqs();

    fireEvent.click(first.getByText('+ Add Rule'));

    expect(first.fa.length).toBe(1);
    expect(second.fa.length).toBe(0);
    expect(selects(second.container).length).toBe(0);
  });
});
