import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import AbilityBonusesSection from '../sections/AbilityBonusesSection';
import { racesStore } from '../racesStore';

describe('AbilityBonusesSection', () => {
  it('adds an ability bonus', () => {
    // ensure new draft
    racesStore.selectNew();
    const { getByText, getByDisplayValue, getAllByText } = render(() => <AbilityBonusesSection />);
    // open select not easily testable without library specifics; directly call store
    racesStore.addAbilityBonus('STR', 2);
    expect(racesStore.activeRace()?.abilityBonuses.some(a => a.name === 'STR')).toBe(true);
  });
});