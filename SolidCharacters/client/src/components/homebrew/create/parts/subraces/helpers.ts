import { ABILITY_SHORT } from '../../../../../shared';

export interface SubraceDraft {
  id: string;
  name: string;
  parentRace: string;
  sizes: string[];
  speed: number;
  abilityBonuses: { name: string; value: number }[];
  languages: { fixed: string[]; amount: number; options: string[]; desc: string };
  traits: { name: string; value: string[] }[];
  text: { age: string; alignment: string; sizeDesc: string; desc: string };
}

export const ABILITIES = [...ABILITY_SHORT];

export const blankDraft = (parent: string): SubraceDraft => ({
  id: crypto.randomUUID(),
  name: '',
  parentRace: parent,
  sizes: [],
  speed: 30,
  abilityBonuses: [],
  languages: { fixed: [], amount: 0, options: [], desc: '' },
  traits: [],
  text: { age: '', alignment: '', sizeDesc: '', desc: '' }
});

export function draftToModel(d: SubraceDraft): any {
  return {
    id: d.id,
    name: d.name,
    parentRace: d.parentRace,
    size: d.sizes.join(', '),
    speed: d.speed,
    languages: [...d.languages.fixed],
    languageChoice: d.languages.amount ? { amount: d.languages.amount, options: [...d.languages.options] } : undefined,
    abilityBonuses: d.abilityBonuses.map(a => ({ stat: ABILITIES.indexOf(a.name as (typeof ABILITIES)[number]), value: a.value })),
    traits: d.traits.map(t => ({ details: { name: t.name, description: t.value.join('\n') }, prerequisites: [] })),
    descriptions: { age: d.text.age, alignment: d.text.alignment, size: d.text.sizeDesc, desc: d.text.desc, language: d.languages.desc }
  };
}

export interface SubraceLike { id?: string; name?: string; parentRace?: string }

export function validateDraft(d?: SubraceDraft, subraces: SubraceLike[] = []): string[] {
  if (!d) return ['No draft'];
  const errs: string[] = [];
  if (!d.parentRace) errs.push('Parent required');
  if (!d.name.trim()) errs.push('Name required');
  // Duplicate check against the flat subrace list, scoped to the same parent
  // race (parentRace === race id).
  const dup = subraces.some(s =>
    s.parentRace === d.parentRace && s.name?.toLowerCase() === d.name.toLowerCase() && s.id !== d.id);
  if (dup) errs.push('Duplicate name');
  const traitNames = new Set<string>();
  d.traits.forEach(t=> { const key = t.name.toLowerCase(); if (traitNames.has(key)) errs.push(`Trait dup: ${t.name}`); else traitNames.add(key); });
  return errs;
}
