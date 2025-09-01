import type { FeatureDetail } from "../../../../../models/data/features";

export interface EquipmentGroup { optionKeys?: string[]; items?: string[] }

export interface ValidationContext {
  isNew: boolean;
  name: string;
  languageAmount: number;
  languageOptions: string[];
  features: FeatureDetail[];
  abilityChoices: string[];
  abilityBaseline: number;
  equipmentGroups: EquipmentGroup[];
}

export function validate(ctx: ValidationContext): string[] {
  const errs: string[] = [];
  if (ctx.isNew && !ctx.name.trim()) errs.push('Name is required');
  if (ctx.languageAmount > 0 && ctx.languageOptions.length < ctx.languageAmount) errs.push('Provide at least the number of language options equal to the amount');
  if (ctx.features.some(f => !f.name.trim())) errs.push('All features must have a name');
  const featureNames = ctx.features.map(f => f.name.trim().toLowerCase());
  if (new Set(featureNames).size !== featureNames.length) errs.push('Feature names must be unique');
  ctx.equipmentGroups.forEach((g, idx) => {
    const keys = (g.optionKeys || []).map(k => k.trim().toLowerCase());
    if (new Set(keys).size !== keys.length) errs.push(`Duplicate equipment option key in group ${idx + 1}`);
    if (!keys.length) errs.push(`Equipment group ${idx + 1} missing keys`);
    if (!(g.items || []).length) errs.push(`Equipment group ${idx + 1} has no items`);
  });
  const keyCombos = ctx.equipmentGroups.map(g => (g.optionKeys || []).slice().sort().join('|')).filter(Boolean);
  const dupCombo = keyCombos.find((c,i)=> keyCombos.indexOf(c)!==i);
  if (dupCombo) errs.push('Equipment groups must have distinct key sets');
  return errs;
}

export function fieldError(errors: string[], field: string): string | undefined {
  if (field === 'name') return errors.find(e => e.includes('Name is required'));
  if (field === 'languages') return errors.find(e => e.toLowerCase().includes('language options'));
  if (field === 'features') return errors.find(e => e.toLowerCase().includes('feature'));
  if (field === 'equipment') return errors.find(e => e.toLowerCase().includes('equipment'));
  return undefined;
}
