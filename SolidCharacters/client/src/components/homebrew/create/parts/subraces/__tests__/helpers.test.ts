import { describe, it, expect } from 'vitest';
import { blankDraft, draftToModel, validateDraft, SubraceDraft } from '../helpers';

function makeDraft(mut?: Partial<SubraceDraft>): SubraceDraft {
  const d = blankDraft('Elf');
  return { ...d, ...mut };
}

describe('subraces helpers', () => {
  it('blankDraft sets parent and defaults', () => {
    const d = blankDraft('Human');
    expect(d.parentRace).toBe('Human');
    expect(d.abilityBonuses.length).toBe(0);
    expect(d.languages.fixed.length).toBe(0);
  });

  it('validateDraft requires parent and name', () => {
    const errs = validateDraft(makeDraft({ parentRace: '', name: '' }), []);
    expect(errs).toContain('Parent required');
    expect(errs).toContain('Name required');
  });

  it('validateDraft detects duplicate name within race', () => {
    const draft = makeDraft({ name: 'High' });
    const errs = validateDraft(draft, [{ name: 'Elf', subRaces: [{ id: 'x', name: 'High' }] }]);
    expect(errs).toContain('Duplicate name');
  });

  it('validateDraft allows same name if different race', () => {
    const draft = makeDraft({ name: 'High' });
    const errs = validateDraft(draft, [{ name: 'Dwarf', subRaces: [{ id: 'x', name: 'High' }] }]);
    expect(errs).not.toContain('Duplicate name');
  });

  it('validateDraft flags duplicate trait names', () => {
    const draft = makeDraft({ name: 'Sun', traits: [ { name: 'Keen', value: [] }, { name: 'keen', value: [] } ] });
    const errs = validateDraft(draft, [{ name: 'Elf', subRaces: [] }]);
    expect(errs.some(e => e.startsWith('Trait dup'))).toBe(true);
  });

  it('draftToModel maps ability bonuses and traits', () => {
    const draft = makeDraft({ name: 'Wood', sizes: ['Medium'], abilityBonuses: [{ name: 'DEX', value: 2 }], traits: [{ name: 'Fleet', value: ['You are swift.'] }], languages: { fixed: ['Common'], amount: 1, options: ['Elvish'], desc: 'You speak common' } });
    const model = draftToModel(draft);
    expect(model.size).toBe('Medium');
    expect(model.abilityBonuses[0].value).toBe(2);
    expect(model.traits[0].details.description).toMatch(/swift/);
    expect(model.languageChoice.amount).toBe(1);
  });
});
