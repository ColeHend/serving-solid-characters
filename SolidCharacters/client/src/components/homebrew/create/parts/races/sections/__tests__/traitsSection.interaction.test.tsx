import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import TraitsSection from '../TraitsSection';
import { createRaceLikeForm, makeTraitRow } from '../../../shared/raceLikeForm.shared';

// Helper to build a fresh editor form per test
function setup() {
  const api = createRaceLikeForm({ kind: 'race' });
  api.form.set('name', 'TraitTestRace');
  return api;
}

describe('TraitsSection interaction', () => {
  it('adds a new trait from inputs', () => {
    const api = setup();
    const { getByPlaceholderText, getByText } = render(() => <TraitsSection api={api} />);
    const nameInput = getByPlaceholderText('Trait name') as HTMLInputElement;
    const descArea = getByPlaceholderText('Description (multi-line)') as HTMLTextAreaElement;
    fireEvent.input(nameInput, { target: { value: 'Darkvision' } });
    fireEvent.input(descArea, { target: { value: 'You can see in the dark.' } });
    fireEvent.click(getByText('Add Trait'));
    expect(api.traits.get().find(t => t.name === 'Darkvision')).toBeTruthy();
  });

  it('edits an existing trait when chip clicked', () => {
    const api = setup();
    // Add initial trait directly via the form array
    api.traits.add(makeTraitRow('Keen Senses', 'You have proficiency in Perception.\nSecond line'));
    const { getByText, getByPlaceholderText } = render(() => <TraitsSection api={api} />);
    // Click chip to begin edit
    fireEvent.click(getByText('Keen Senses'));
    const nameInput = getByPlaceholderText('Trait name') as HTMLInputElement;
    const descArea = getByPlaceholderText('Description (multi-line)') as HTMLTextAreaElement;
    // Ensure prefilled
    expect(nameInput.value).toBe('Keen Senses');
    expect(descArea.value).toMatch(/Perception/);
    expect(descArea.value.split('\n').length).toBeGreaterThan(1); // multi-line preserved
    // Modify and update
    fireEvent.input(nameInput, { target: { value: 'Sharper Senses' } });
    fireEvent.input(descArea, { target: { value: 'Advantage on Perception checks.' } });
    fireEvent.click(getByText('Update Trait'));
    const traits = api.traits.get();
    expect(traits.find(t => t.name === 'Sharper Senses')).toBeTruthy();
    expect(traits.find(t => t.name === 'Keen Senses')).toBeFalsy();
  });
});
