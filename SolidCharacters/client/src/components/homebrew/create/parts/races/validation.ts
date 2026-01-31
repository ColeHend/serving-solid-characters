import type { RaceDraft } from './racesStore';

export interface RaceValidationContext {
  isNew: boolean;
  draft?: RaceDraft;
}

export function validateRace(ctx: RaceValidationContext): string[] {
  const errs: string[] = [];
  const d = ctx.draft;
  if (!d) return ['No race selected'];
  if (ctx.isNew && !d.name.trim()) errs.push('Name is required');
  if (d.sizes.length === 0) errs.push('At least one size is required');
  if (!d.speed || d.speed <= 0) errs.push('Speed must be greater than 0');
  const abilityNames = d.abilityBonuses.map(a => a.name.toLowerCase());
  if (new Set(abilityNames).size !== abilityNames.length) errs.push('Duplicate ability bonus');
  const languageSet = new Set(d.languages.fixed.map(l => l.toLowerCase()));
  if (languageSet.size !== d.languages.fixed.length) errs.push('Duplicate language');
  if (d.languages.amount > 0 && d.languages.options.length < d.languages.amount) errs.push('Provide enough language choice options');
  if (d.traits.some(t => !t.name.trim())) errs.push('All traits must have a name');
  const traitNames = d.traits.map(t => t.name.toLowerCase());
  if (new Set(traitNames).size !== traitNames.length) errs.push('Trait names must be unique');
  return errs;
}

export function fieldError(errors: string[], field: string) {
  if (field === 'name') return errors.find(e => e.toLowerCase().includes('name'));
  if (field === 'sizes') return errors.find(e => e.toLowerCase().includes('size is required'));
  if (field === 'speed') return errors.find(e => e.toLowerCase().includes('speed'));
  if (field === 'abilities') return errors.find(e => e.toLowerCase().includes('ability'));
  if (field === 'languages') return errors.find(e => e.toLowerCase().includes('language'));
  return undefined;
}
