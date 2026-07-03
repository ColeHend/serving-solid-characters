import { FormGroup, FormArray, Validators } from 'coles-solid-library';
import type { Race } from '../../../../../models/generated';
import { ABILITY_SHORT } from '../../../../../shared/constants/homebrew';

// Shared form state for the Race and Subrace homebrew editors.
// One flat FormGroup (the library has no nested groups or dotted paths) plus
// two STANDALONE FormArrays. The arrays must never be FormGroup keys: a keyed
// FormArray crashes native <Form> submit (structuredClone over the instance's
// function fields), so both editors save from a plain button instead.

export interface RaceLikeFormShape {
  name: string;
  speed: number;
  sizes: string[];
  langFixed: string[];
  langAmount: number;
  langOptions: string[];
  langDesc: string;
  descAge: string;
  descAlignment: string;
  descSize: string;
  descAbilities: string; // race only — subrace editor ignores it
  desc: string;          // subrace only — race editor ignores it
}

export interface AbilityBonusRow { name: string; value: number }
export interface TraitRow { name: string; body: string }

// The editors' draft shape: a superset of races' RaceDraft and subraces'
// SubraceDraft (minus id/parentRace) so one adapter feeds both editors'
// existing pure validators unchanged.
export interface RaceLikeDraft {
  name: string;
  speed: number;
  sizes: string[];
  abilityBonuses: AbilityBonusRow[];
  languages: { fixed: string[]; amount: number; options: string[]; desc: string };
  proficiencies: { armor: string[]; weapons: string[]; tools: string[]; skills: string[] };
  traits: { name: string; value: string[] }[];
  text: { age: string; alignment: string; sizeDesc: string; abilitiesDesc: string; desc: string };
}

// Ability codec: the persisted model stores stat as a numeric AbilityScores
// index; the editors work with 'STR'..'CHA' short codes.
export function encodeStat(name: string): number {
  return (ABILITY_SHORT as readonly string[]).indexOf(name);
}
export function decodeStat(stat: number | string): string {
  if (typeof stat === 'number') return ABILITY_SHORT[stat] ?? String(stat);
  if ((ABILITY_SHORT as readonly string[]).includes(stat)) return stat;
  const n = Number(stat);
  return Number.isInteger(n) && ABILITY_SHORT[n] ? ABILITY_SHORT[n] : String(stat);
}

export function makeAbilityRow(name = '', value = 1): FormGroup<AbilityBonusRow> {
  return new FormGroup<AbilityBonusRow>({
    name: [name, [Validators.Required]],
    value: [value, []],
  });
}

export function makeTraitRow(name = '', body = ''): FormGroup<TraitRow> {
  return new FormGroup<TraitRow>({
    name: [name, [Validators.Required]],
    body: [body, []],
  });
}

function drain(fa: FormArray<any>) {
  while (fa.length) fa.remove(fa.length - 1);
}

export type RaceLikeKind = 'race' | 'subrace';

// Accepts either editor's existing draft shape: race drafts have no text.desc
// and subrace drafts no text.abilitiesDesc, so the nested objects are partial.
export type RaceLikeFill = Partial<Omit<RaceLikeDraft, 'text' | 'languages'>> & {
  text?: Partial<RaceLikeDraft['text']>;
  languages?: Partial<RaceLikeDraft['languages']>;
};

export function createRaceLikeForm(config: { kind: RaceLikeKind }) {
  const isRace = config.kind === 'race';
  const form = new FormGroup<RaceLikeFormShape>({
    name: ['', [Validators.Required]],
    // Field validators mirror the pure aggregate rules per kind (races
    // require sizes/speed, subraces don't) so form.validate() never blocks
    // a save the aggregate validator would allow.
    speed: [30, isRace ? [Validators.custom<number>('positive', v => !!v && v > 0)] : []],
    sizes: [[], isRace ? [Validators.minLength(1)] : []],
    langFixed: [[], []],
    langAmount: [0, []],
    langOptions: [[], []],
    langDesc: ['', []],
    descAge: ['', []],
    descAlignment: ['', []],
    descSize: ['', []],
    descAbilities: ['', []],
    desc: ['', []],
  });
  const abilityBonuses = new FormArray<AbilityBonusRow>([]);
  const traits = new FormArray<TraitRow>([]);

  // Hydrate the trio from an editor draft (blank or mapped from an entity).
  function fill(d: RaceLikeFill) {
    form.set('name', d.name ?? '');
    form.set('speed', d.speed ?? 30);
    form.set('sizes', [...(d.sizes ?? [])]);
    form.set('langFixed', [...(d.languages?.fixed ?? [])]);
    form.set('langAmount', d.languages?.amount ?? 0);
    form.set('langOptions', [...(d.languages?.options ?? [])]);
    form.set('langDesc', d.languages?.desc ?? '');
    form.set('descAge', d.text?.age ?? '');
    form.set('descAlignment', d.text?.alignment ?? '');
    form.set('descSize', d.text?.sizeDesc ?? '');
    form.set('descAbilities', d.text?.abilitiesDesc ?? '');
    form.set('desc', d.text?.desc ?? '');
    drain(abilityBonuses);
    for (const b of d.abilityBonuses ?? []) abilityBonuses.add(makeAbilityRow(b.name, b.value));
    drain(traits);
    for (const t of d.traits ?? []) traits.add(makeTraitRow(t.name, (t.value ?? []).join('\n')));
  }

  // Reactive read of the whole editor state in the legacy draft shape, so the
  // existing pure validators (validateRace / validateDraft) work unchanged.
  function formToDraft(): RaceLikeDraft {
    const v = form.formChangeValue();
    return {
      name: v.name,
      speed: v.speed,
      sizes: v.sizes,
      abilityBonuses: abilityBonuses.get(),
      languages: { fixed: v.langFixed, amount: v.langAmount, options: v.langOptions, desc: v.langDesc },
      proficiencies: { armor: [], weapons: [], tools: [], skills: [] },
      traits: traits.get().map(t => ({ name: t.name, value: t.body.trim() ? t.body.split(/\n+/) : [] })),
      text: { age: v.descAge, alignment: v.descAlignment, sizeDesc: v.descSize, abilitiesDesc: v.descAbilities, desc: v.desc },
    };
  }

  // Serialize to the persisted Race model (race kind; subraces go through
  // their own helpers.draftToModel to stay embedded on the parent).
  // Fields the editor has no UI for (abilityBonusChoice, traitChoice, the
  // undeclared subRaces extension) are deliberately NOT emitted — callers
  // updating an existing entity must spread over it ({...existing, ...built})
  // so those survive the update.
  function buildRace(id?: string): Race {
    const v = form.get();
    return {
      id: id ?? crypto.randomUUID(),
      name: v.name,
      size: v.sizes.join(', '),
      speed: v.speed,
      languages: [...v.langFixed],
      languageChoice: v.langAmount ? { amount: v.langAmount, options: [...v.langOptions] } : undefined,
      abilityBonuses: abilityBonuses.get().map(a => ({ stat: encodeStat(a.name) as never, value: a.value })),
      traits: traits.get().map(t => ({
        id: crypto.randomUUID(),
        details: { id: crypto.randomUUID(), name: t.name, description: t.body },
        prerequisites: [],
      })),
      descriptions: {
        age: v.descAge,
        alignment: v.descAlignment,
        size: v.descSize,
        language: v.langDesc,
        abilities: v.descAbilities,
        ...(config.kind === 'subrace' ? { desc: v.desc } : {}),
      },
    };
  }

  return { form, abilityBonuses, traits, fill, formToDraft, buildRace };
}

export type RaceLikeFormApi = ReturnType<typeof createRaceLikeForm>;
