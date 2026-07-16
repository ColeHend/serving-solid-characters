import { render, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect } from 'vitest';
import { createSignal } from 'solid-js';
import { FormArray } from 'coles-solid-library';
import { FeaturePrerequisites } from '../featurePrerequisites';
import type { MadPrereqForm } from '../../../../../../../models/data/formModels';
import type { MadPrerequisite } from '../../../../../../../shared';

const renderPrereqs = () => {
  const fa = new FormArray<MadPrereqForm>([]);
  const prereqs = createSignal<Record<string, MadPrerequisite>>({});
  const utils = render(() =>
    <FeaturePrerequisites prereqForm={fa} prereqs={prereqs} Submit={() => {}} />
  );
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
});
