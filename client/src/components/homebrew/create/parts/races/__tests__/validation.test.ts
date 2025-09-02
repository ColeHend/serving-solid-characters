import { describe, it, expect } from 'vitest';
import { validateRace } from '../validation';
import type { RaceDraft } from '../racesStore';

function draft(partial: Partial<RaceDraft>): RaceDraft {
  return {
    name: '', speed:30, sizes: [], abilityBonuses: [], languages: { fixed: [], amount:0, options: [], desc:'' }, proficiencies:{ armor:[], weapons:[], tools:[], skills:[] }, traits: [], text:{ age:'', alignment:'', sizeDesc:'', abilitiesDesc:'' }, ...partial
  };
}

describe('race validation', () => {
  it('requires name for new', () => {
    const errs = validateRace({ isNew: true, draft: draft({ name: '' }) });
    expect(errs).toContain('Name is required');
  });
  it('requires at least one size', () => {
    const errs = validateRace({ isNew: true, draft: draft({ sizes: [] }) });
    expect(errs).toContain('At least one size is required');
  });
  it('validates duplicate ability bonus', () => {
    const errs = validateRace({ isNew: true, draft: draft({ sizes:['Medium'], abilityBonuses:[{name:'STR', value:1},{name:'str', value:2}], name:'Test' }) });
    expect(errs).toContain('Duplicate ability bonus');
  });
  it('requires enough language choice options', () => {
    const errs = validateRace({ isNew: true, draft: draft({ name:'Test', sizes:['Medium'], languages:{ fixed:[], amount:2, options:['Elvish'], desc:'' } }) });
    expect(errs.some(e=>e.toLowerCase().includes('language choice'))).toBe(true);
  });
  it('requires unique trait names', () => {
  const errs = validateRace({ isNew: true, draft: draft({ name:'Test', sizes:['Medium'], traits:[{ name:'Darkvision', value:[] }, { name:'darkvision', value:[] }] }) });
    expect(errs).toContain('Trait names must be unique');
  });
});