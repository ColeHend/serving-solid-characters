import type { FormGroup } from 'coles-solid-library';
import type { SetStoreFunction } from 'solid-js/store';
import { FeatureDetail } from '../../../../../../models/generated';
import { ABILITY_SHORT, SIZE_TOKENS } from '../../../../../../shared/constants/homebrew';
import {
  draftStorage,
  toggleInArray,
  type StepMeta,
  type StepStatus,
} from '../../classes/wizard/wizard.shared';
import { ALL_ABILITIES, LANGUAGES } from '../../backgrounds/wizard/wizard.shared';

// Shared (non-JSX) types, constants and pure helpers for the race-creation wizard.
// Mirrors the class/subclass/background wizards' wizard.shared.ts; the generic
// draft/toggle helpers are imported from the class wizard so the wizards can
// never drift on them.

export { draftStorage, toggleInArray, ALL_ABILITIES, LANGUAGES };
export type { StepMeta, StepStatus };

export const SIZES: string[] = [...SIZE_TOKENS];

export interface RaceForm {
  name: string;
  /** Size options the race offers — the persisted model joins them with ', '. */
  size: string[];
  speed: number;
  /** Languages every member knows. */
  languages: string[];
  /** How many extra languages a player picks — 0 = no choice. */
  langChoiceAmount: number;
  /** The options that choice picks from — empty = any language. */
  langChoiceOptions: string[];
  /** Fixed ability score bonuses (stat = AbilityScores index 0..5). */
  abilityBonuses: RaceStatBonus[];
  descAge: string;
  descAlignment: string;
  descSize: string;
  descLanguage: string;
  descAbilities: string;
}

/** Plain-data twin of the persisted StatBonus (numeric stat index, no enum import). */
export interface RaceStatBonus { stat: number; value: number }

// ---------------------------------------------------------------------------
// Extras store (structured collections that don't fit flat FormGroup fields —
// the races analogue of the backgrounds wizard's features list)

export interface RaceExtras {
  /** Racial traits, edited through the shared FeaturesPopup. */
  traits: FeatureDetail[];
}

export const emptyExtras = (): RaceExtras => ({ traits: [] });

// ---------------------------------------------------------------------------
// Steps

export enum RaceWizardStep {
  Identity = 0,
  AbilityBonuses = 1,
  Languages = 2,
  Traits = 3,
  Flavor = 4,
  Review = 5,
}

export const RACE_STEPS: RaceWizardStep[] = [
  RaceWizardStep.Identity,
  RaceWizardStep.AbilityBonuses,
  RaceWizardStep.Languages,
  RaceWizardStep.Traits,
  RaceWizardStep.Flavor,
  RaceWizardStep.Review,
];

export const STEP_META: Record<RaceWizardStep, StepMeta> = {
  [RaceWizardStep.Identity]: {
    label: 'Identity',
    question: 'Who are they?',
    subtitle: 'A name, a size, and how fast they move. You can change all of this later.',
  },
  [RaceWizardStep.AbilityBonuses]: {
    label: 'Abilities',
    question: 'Where does their nature shine?',
    subtitle: 'Fixed ability score bonuses the race grants — leave everything at 0 for a 2024-style race, where bonuses come from backgrounds.',
  },
  [RaceWizardStep.Languages]: {
    label: 'Languages',
    question: 'What tongues do they speak?',
    subtitle: 'Languages every member knows, plus any the player picks at creation.',
  },
  [RaceWizardStep.Traits]: {
    label: 'Traits',
    question: 'What makes them different?',
    subtitle: 'Racial traits — darkvision, resistances, innate magic. Rows open the full feature editor.',
  },
  [RaceWizardStep.Flavor]: {
    label: 'Flavor',
    question: 'What are they like?',
    subtitle: 'Optional lore shown on the race page — age, alignment, size and more.',
  },
  [RaceWizardStep.Review]: {
    label: 'Review',
    question: 'Ready to publish?',
    subtitle: 'Check the summary. You can publish and refine later — drafts stay editable.',
  },
};

// ---------------------------------------------------------------------------
// Step status + review rows

export function stepStatus(step: RaceWizardStep, fg: FormGroup<RaceForm>, extras: RaceExtras): StepStatus {
  switch (step) {
  case RaceWizardStep.Identity: {
    const named = ((fg.get('name') as string) || '').trim().length > 0;
    return named && ((fg.get('size') as string[])?.length ?? 0) > 0 && ((fg.get('speed') as number) || 0) > 0
      ? 'complete' : 'incomplete';
  }
  case RaceWizardStep.AbilityBonuses:
    // Lenient: 2024-style races legitimately grant none.
    return ((fg.get('abilityBonuses') as RaceStatBonus[]) ?? []).some(b => b.value !== 0)
      ? 'complete' : 'incomplete';
  case RaceWizardStep.Languages: {
    const fixed = ((fg.get('languages') as string[])?.length ?? 0) > 0;
    const choice = ((fg.get('langChoiceAmount') as number) || 0) > 0;
    return fixed || choice ? 'complete' : 'incomplete';
  }
  case RaceWizardStep.Traits:
    return extras.traits.length > 0 ? 'complete' : 'incomplete';
  case RaceWizardStep.Flavor: {
    const any = (['descAge', 'descAlignment', 'descSize', 'descLanguage', 'descAbilities'] as const)
      .some(key => ((fg.get(key) as string) || '').trim().length > 0);
    return any ? 'complete' : 'incomplete';
  }
  default:
    return 'incomplete';
  }
}

/** "STR +2" display for a stored numeric bonus. */
export const bonusLabel = (bonus: RaceStatBonus): string =>
  `${ABILITY_SHORT[bonus.stat] ?? `#${bonus.stat}`} ${bonus.value > 0 ? '+' : ''}${bonus.value}`;

export interface RaceReviewRow {
  step: RaceWizardStep;
  ok: boolean;
  title: string;
  summary: string;
  detail?: string;
  action: 'edit' | 'fix';
}

export function buildReviewRows(fg: FormGroup<RaceForm>, extras: RaceExtras): RaceReviewRow[] {
  const name = ((fg.get('name') as string) || '').trim();
  const sizes = (fg.get('size') as string[]) ?? [];
  const speed = (fg.get('speed') as number) || 0;
  const bonuses = ((fg.get('abilityBonuses') as RaceStatBonus[]) ?? []).filter(b => b.value !== 0);
  const languages = (fg.get('languages') as string[]) ?? [];
  const langAmount = (fg.get('langChoiceAmount') as number) || 0;
  const langOptions = (fg.get('langChoiceOptions') as string[]) ?? [];
  const traits = extras.traits;
  const flavorFields: [keyof RaceForm, string][] = [
    ['descAge', 'age'], ['descAlignment', 'alignment'], ['descSize', 'size'],
    ['descLanguage', 'languages'], ['descAbilities', 'abilities'],
  ];
  const flavored = flavorFields.filter(([key]) => ((fg.get(key) as string) || '').trim().length > 0);

  const status = (step: RaceWizardStep) => stepStatus(step, fg, extras) === 'complete';

  return [
    {
      step: RaceWizardStep.Identity,
      ok: status(RaceWizardStep.Identity),
      title: 'Identity',
      summary: `${name || 'Unnamed race'} · ${sizes.length ? sizes.join(' / ') : 'no size'} · ${speed} ft speed`,
      action: 'edit',
    },
    {
      step: RaceWizardStep.AbilityBonuses,
      ok: status(RaceWizardStep.AbilityBonuses),
      title: 'Ability bonuses',
      summary: bonuses.length ? bonuses.map(bonusLabel).join(', ') : 'No fixed bonuses (2024-style).',
      action: 'edit',
    },
    {
      step: RaceWizardStep.Languages,
      ok: status(RaceWizardStep.Languages),
      title: 'Languages',
      summary: `${languages.length ? languages.join(', ') : 'none fixed'}${langAmount ? ` · choose ${langAmount}${langOptions.length ? ` of ${langOptions.join(', ')}` : ' of any'}` : ''}`,
      action: 'edit',
    },
    {
      step: RaceWizardStep.Traits,
      ok: status(RaceWizardStep.Traits),
      title: `Traits — ${traits.length} added`,
      summary: traits.length
        ? traits.map(t => t.name).join(', ')
        : 'No traits yet — most races have at least one.',
      action: 'edit',
    },
    {
      step: RaceWizardStep.Flavor,
      ok: status(RaceWizardStep.Flavor),
      title: 'Flavor',
      summary: flavored.length
        ? `Described: ${flavored.map(([, label]) => label).join(', ')}`
        : 'No flavor text yet — optional.',
      action: 'edit',
    },
  ];
}

// ---------------------------------------------------------------------------
// Draft autosave

export const DRAFT_VERSION = 1;

/** Keyed by the ?name= edit target only — a new race always drafts under ':new'
 *  so typing a name never spawns per-keystroke orphan drafts (mirrors the class wizard). */
export const raceDraftKey = (editName?: string): string =>
  `hb:raceDraft:${(editName ?? '').trim().toLowerCase() || 'new'}`;

export const DRAFT_FORM_KEYS = [
  'name', 'size', 'speed',
  'languages', 'langChoiceAmount', 'langChoiceOptions',
  'abilityBonuses',
  'descAge', 'descAlignment', 'descSize', 'descLanguage', 'descAbilities',
] as const satisfies readonly (keyof RaceForm)[];

export interface RaceWizardDraft {
  v: number;
  form: Partial<RaceForm>;
  extras: RaceExtras;
  step: RaceWizardStep;
}

export function serializeDraft(fg: FormGroup<RaceForm>, extras: RaceExtras, step: RaceWizardStep): string {
  const form: Record<string, unknown> = {};
  DRAFT_FORM_KEYS.forEach(key => { form[key] = fg.get(key); });
  return JSON.stringify({ v: DRAFT_VERSION, form, extras, step } satisfies RaceWizardDraft);
}

export function parseDraft(raw: string | null): RaceWizardDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as RaceWizardDraft;
    if (draft?.v !== DRAFT_VERSION || typeof draft.form !== 'object' || !draft.form) return null;
    return {
      ...draft,
      extras: { ...emptyExtras(), ...(draft.extras ?? {}) },
      step: RACE_STEPS.includes(draft.step) ? draft.step : RaceWizardStep.Identity,
    };
  } catch {
    return null;
  }
}

export function hydrateDraft(fg: FormGroup<RaceForm>, draft: RaceWizardDraft): void {
  DRAFT_FORM_KEYS.forEach(key => {
    if (!(key in draft.form)) return;
    fg.set(key, (draft.form as Record<string, unknown>)[key] as never);
  });
}

// ---------------------------------------------------------------------------
// Step component contract (every step receives the same props; unused ones are ignored)

export interface StepProps {
  formGroup: FormGroup<RaceForm>;
  extras: RaceExtras;
  setExtras: SetStoreFunction<RaceExtras>;
  goToStep: (step: RaceWizardStep) => void;
  /** Opens the shared FeaturesPopup in "add" mode. */
  openAddFeature: () => void;
  /** Opens the shared FeaturesPopup in "edit" mode for an existing trait. */
  openEditFeature: (feature: FeatureDetail) => void;
  /** Review step only: validate + save to homebrewManager. */
  publish: () => void | Promise<void>;
}
