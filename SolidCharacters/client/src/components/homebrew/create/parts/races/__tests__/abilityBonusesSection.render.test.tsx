import { describe, it, expect } from 'vitest';
import { render } from '@solidjs/testing-library';
import AbilityBonusesSection from '../sections/AbilityBonusesSection';
import { createRaceLikeForm, makeAbilityRow } from '../../shared/raceLikeForm.shared';

describe('AbilityBonusesSection', () => {
  it('renders added ability bonuses', () => {
    const api = createRaceLikeForm({ kind: 'race' });
    const { getByText } = render(() => <AbilityBonusesSection api={api} />);
    api.abilityBonuses.add(makeAbilityRow('STR', 2));
    expect(api.abilityBonuses.get().some(a => a.name === 'STR')).toBe(true);
    expect(getByText('STR+2')).toBeTruthy();
  });
});
