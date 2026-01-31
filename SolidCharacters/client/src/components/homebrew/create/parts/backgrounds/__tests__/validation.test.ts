import { describe, it, expect } from 'vitest';
import { validate, fieldError, ValidationContext } from '../validation';

function ctx(partial: Partial<ValidationContext>): ValidationContext {
  return {
    isNew: true,
    name: '',
    languageAmount: 0,
    languageOptions: [],
    features: [],
    abilityChoices: [],
    abilityBaseline: 0,
    equipmentGroups: [],
    ...partial
  };
}

describe('background validation', () => {
  it('requires name when new', () => {
    const errors = validate(ctx({ name: '' }));
    expect(errors).toContain('Name is required');
  });

  it('passes when name provided', () => {
    const errors = validate(ctx({ name: 'Sage' }));
    expect(errors).not.toContain('Name is required');
  });

  it('requires enough language options', () => {
    const errors = validate(ctx({ name: 'Polyglot', languageAmount: 2, languageOptions: ['Elvish'] }));
    expect(errors.some(e => e.toLowerCase().includes('language options'))).toBe(true);
  });

  it('accepts sufficient language options', () => {
    const errors = validate(ctx({ name: 'Polyglot', languageAmount: 2, languageOptions: ['Elvish','Dwarvish'] }));
    expect(errors.some(e => e.toLowerCase().includes('language options'))).toBe(false);
  });

  it('rejects empty feature names & duplicate names', () => {
    const errors = validate(ctx({ name: 'Hero', features: [ { name: '', description: '' }, { name: 'Bravery', description: '' }, { name: 'bravery', description: '' } ] as any }));
    expect(errors).toContain('All features must have a name');
    expect(errors).toContain('Feature names must be unique');
  });

  it('validates equipment groups', () => {
    const errors = validate(ctx({ name: 'Traveler', equipmentGroups: [ { optionKeys: ['A','A'], items: ['Torch'] }, { optionKeys: [], items: [] } ] } as any));
    expect(errors.some(e => e.includes('Duplicate equipment option key in group 1'))).toBe(true);
    expect(errors.some(e => e.includes('Equipment group 2 missing keys'))).toBe(true);
    expect(errors.some(e => e.includes('Equipment group 2 has no items'))).toBe(true);
  });

  it('detects duplicate equipment key sets across groups', () => {
    const errors = validate(ctx({ name: 'Traveler', equipmentGroups: [ { optionKeys: ['A','B'], items: ['Torch'] }, { optionKeys: ['B','A'], items: ['Rope'] } ] }));
    expect(errors).toContain('Equipment groups must have distinct key sets');
  });

  it('fieldError maps to correct error', () => {
    const errors = validate(ctx({ name: '', languageAmount: 1, languageOptions: [] }));
    expect(fieldError(errors, 'name')).toBe('Name is required');
    expect(fieldError(errors, 'languages')?.toLowerCase()).toContain('language');
  });
});
