import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import TraitsSection from '../TraitsSection';
import { racesStore } from '../../racesStore';

// Helper to reset to new draft each test
function prepareDraft() {
  racesStore.selectNew();
  racesStore.updateBlankDraft('name','TraitTestRace');
}

describe('TraitsSection interaction', () => {
  it('adds a new trait from inputs', () => {
    prepareDraft();
    const { getByPlaceholderText, getByText } = render(() => <TraitsSection />);
    const nameInput = getByPlaceholderText('Trait name') as HTMLInputElement;
    const descArea = getByPlaceholderText('Description (multi-line)') as HTMLTextAreaElement;
    fireEvent.input(nameInput, { target: { value: 'Darkvision' } });
    fireEvent.input(descArea, { target: { value: 'You can see in the dark.' } });
    fireEvent.click(getByText('Add Trait'));
  expect(racesStore.activeRace()?.traits.find((t: any) => t.name === 'Darkvision')).toBeTruthy();
  });

  it('edits an existing trait when chip clicked', async () => {
    prepareDraft();
    // Add initial trait directly via store
  racesStore.addTrait('Keen Senses', ['You have proficiency in Perception.','Second line']);
    const { getByText, getByPlaceholderText } = render(() => <TraitsSection />);
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
    const traits = racesStore.activeRace()?.traits || [];
  expect(traits.find((t: any) => t.name === 'Sharper Senses')).toBeTruthy();
  expect(traits.find((t: any) => t.name === 'Keen Senses')).toBeFalsy();
  });
});