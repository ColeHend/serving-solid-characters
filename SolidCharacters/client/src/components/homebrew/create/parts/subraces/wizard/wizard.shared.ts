import type { FormGroup } from 'coles-solid-library';
import type { SetStoreFunction } from 'solid-js/store';
import { FeatureDetail } from '../../../../../../models/generated';
import {
  draftStorage,
  toggleInArray,
  type StepMeta,
  type StepStatus,
} from '../../classes/wizard/wizard.shared';
import {
  ALL_ABILITIES,
  LANGUAGES,
  RaceExtras,
  RaceForm,
  RaceStatBonus,
  SIZES,
  bonusLabel,
  emptyExtras,
} from '../../races/wizard/wizard.shared';

// Shared (non-JSX) types, constants and pure helpers for the subrace-creation
// wizard. Mirrors the race wizard's wizard.shared.ts (a subrace edits the same
// fields plus a parent race and a main description); the generic draft/toggle
// helpers come from the class wizard so the wizards can never drift on them.

export { draftStorage, toggleInArray, ALL_ABILITIES, LANGUAGES, SIZES, bonusLabel, emptyExtras };
export type { StepMeta, StepStatus, RaceExtras, RaceStatBonus };

export interface SubraceForm extends RaceForm {
  /** Selector key of the chosen parent race (see raceSelectorKey) — disambiguates races that
   *  share a name across rulesets/homebrew. '' when unresolved. */
  parentRaceKey: string;
  /** Display name of the chosen parent race, resolved from the key. */
  parentRaceName: string;
  /** The subrace's main description (persisted as descriptions.desc). */
  desc: string;
}

// ---------------------------------------------------------------------------
// Parent-race selector (mirrors the subclass wizard's parent-class selector)

/** Stable unique option key for a race in the merged SRD+homebrew list: the entity id when
 *  present, else an 'hb:'-prefixed name fallback. */
export const raceSelectorKey = (race: { id?: string | number; name: string }): string =>
  race.id != null && `${race.id}` !== '' ? `${race.id}` : `hb:${race.name}`;

/** Ruleset tag for the selector: SRD entities carry a centrally-stamped `legacy`
 *  (2014 → true, 2024 → false); homebrew races carry none. */
export const raceVersionLabel = (race: { legacy?: boolean }): '2014' | '2024' | 'Homebrew' =>
  race.legacy === true ? '2014' : race.legacy === false ? '2024' : 'Homebrew';

export interface RaceOption {
  key: string;
  name: string;
  version: '2014' | '2024' | 'Homebrew';
  /** Display text: "Elf (2024)". */
  label: string;
}

export const toRaceOption = (race: { id?: string | number; name: string; legacy?: boolean }): RaceOption => {
  const versionLabel = raceVersionLabel(race);
  const version = ['2014', 'Homebrew'].includes(versionLabel) ? '(Legacy)': '';
  return { key: raceSelectorKey(race), name: race.name, version: versionLabel, label: `${race.name} ${version}` };
};

// ---------------------------------------------------------------------------
// Steps

export enum SubraceWizardStep {
  Identity = 0,
  AbilityBonuses = 1,
  Languages = 2,
  Traits = 3,
  Flavor = 4,
  Review = 5,
}

export const SUBRACE_STEPS: SubraceWizardStep[] = [
  SubraceWizardStep.Identity,
  SubraceWizardStep.AbilityBonuses,
  SubraceWizardStep.Languages,
  SubraceWizardStep.Traits,
  SubraceWizardStep.Flavor,
  SubraceWizardStep.Review,
];

export const STEP_META: Record<SubraceWizardStep, StepMeta> = {
  [SubraceWizardStep.Identity]: {
    label: 'Identity',
    question: 'Who are they descended from?',
    subtitle: 'Pick the parent race, then name the lineage. You can change all of this later.',
  },
  [SubraceWizardStep.AbilityBonuses]: {
    label: 'Abilities',
    question: 'What does this lineage add?',
    subtitle: 'Extra ability score bonuses on top of the parent race — leave everything at 0 if the lineage adds none.',
  },
  [SubraceWizardStep.Languages]: {
    label: 'Languages',
    question: 'What tongues do they add?',
    subtitle: 'Languages beyond the parent race\'s, plus any the player picks at creation.',
  },
  [SubraceWizardStep.Traits]: {
    label: 'Traits',
    question: 'What sets this lineage apart?',
    subtitle: 'Subrace traits — extra senses, resistances, innate magic. Rows open the full feature editor.',
  },
  [SubraceWizardStep.Flavor]: {
    label: 'Flavor',
    question: 'What are they like?',
    subtitle: 'A description of the lineage, plus optional lore — age, alignment, size and more.',
  },
  [SubraceWizardStep.Review]: {
    label: 'Review',
    question: 'Ready to publish?',
    subtitle: 'Check the summary. You can publish and refine later — drafts stay editable.',
  },
};

// ---------------------------------------------------------------------------
// Step status + review rows

export function stepStatus(step: SubraceWizardStep, fg: FormGroup<SubraceForm>, extras: RaceExtras): StepStatus {
  switch (step) {
  case SubraceWizardStep.Identity: {
    const named = ((fg.get('name') as string) || '').trim().length > 0;
    return named && !!fg.get('parentRaceKey') ? 'complete' : 'incomplete';
  }
  case SubraceWizardStep.AbilityBonuses:
    // Lenient: many subraces add no bonuses of their own.
    return ((fg.get('abilityBonuses') as RaceStatBonus[]) ?? []).some(b => b.value !== 0)
      ? 'complete' : 'incomplete';
  case SubraceWizardStep.Languages: {
    const fixed = ((fg.get('languages') as string[])?.length ?? 0) > 0;
    const choice = ((fg.get('langChoiceAmount') as number) || 0) > 0;
    return fixed || choice ? 'complete' : 'incomplete';
  }
  case SubraceWizardStep.Traits:
    return extras.traits.length > 0 ? 'complete' : 'incomplete';
  case SubraceWizardStep.Flavor: {
    const any = (['desc', 'descAge', 'descAlignment', 'descSize', 'descLanguage', 'descAbilities'] as const)
      .some(key => ((fg.get(key) as string) || '').trim().length > 0);
    return any ? 'complete' : 'incomplete';
  }
  default:
    return 'incomplete';
  }
}

export interface SubraceReviewRow {
  step: SubraceWizardStep;
  ok: boolean;
  title: string;
  summary: string;
  detail?: string;
  action: 'edit' | 'fix';
}

export function buildReviewRows(fg: FormGroup<SubraceForm>, extras: RaceExtras): SubraceReviewRow[] {
  const name = ((fg.get('name') as string) || '').trim();
  const parent = ((fg.get('parentRaceName') as string) || '').trim();
  const sizes = (fg.get('size') as string[]) ?? [];
  const speed = (fg.get('speed') as number) || 0;
  const bonuses = ((fg.get('abilityBonuses') as RaceStatBonus[]) ?? []).filter(b => b.value !== 0);
  const languages = (fg.get('languages') as string[]) ?? [];
  const langAmount = (fg.get('langChoiceAmount') as number) || 0;
  const langOptions = (fg.get('langChoiceOptions') as string[]) ?? [];
  const traits = extras.traits;
  const desc = ((fg.get('desc') as string) || '').trim();

  const status = (step: SubraceWizardStep) => stepStatus(step, fg, extras) === 'complete';

  return [
    {
      step: SubraceWizardStep.Identity,
      ok: status(SubraceWizardStep.Identity),
      title: 'Identity',
      summary: `${name || 'Unnamed subrace'} · ${parent ? `of ${parent}` : 'no parent race'}${sizes.length ? ` · ${sizes.join(' / ')}` : ''}${speed ? ` · ${speed} ft speed` : ''}`,
      action: status(SubraceWizardStep.Identity) ? 'edit' : 'fix',
    },
    {
      step: SubraceWizardStep.AbilityBonuses,
      ok: status(SubraceWizardStep.AbilityBonuses),
      title: 'Ability bonuses',
      summary: bonuses.length ? bonuses.map(bonusLabel).join(', ') : 'No extra bonuses.',
      action: 'edit',
    },
    {
      step: SubraceWizardStep.Languages,
      ok: status(SubraceWizardStep.Languages),
      title: 'Languages',
      summary: `${languages.length ? languages.join(', ') : 'none added'}${langAmount ? ` · choose ${langAmount}${langOptions.length ? ` of ${langOptions.join(', ')}` : ' of any'}` : ''}`,
      action: 'edit',
    },
    {
      step: SubraceWizardStep.Traits,
      ok: status(SubraceWizardStep.Traits),
      title: `Traits — ${traits.length} added`,
      summary: traits.length
        ? traits.map(t => t.name).join(', ')
        : 'No traits yet — most subraces have at least one.',
      action: 'edit',
    },
    {
      step: SubraceWizardStep.Flavor,
      ok: status(SubraceWizardStep.Flavor),
      title: 'Flavor',
      summary: desc ? 'Described.' : 'No description yet — optional.',
      action: 'edit',
    },
  ];
}

// ---------------------------------------------------------------------------
// Draft autosave

export const DRAFT_VERSION = 1;

/** Keyed by the ?race=&subrace= edit target only — a new subrace always drafts under ':new'
 *  so typing a name never spawns per-keystroke orphan drafts (mirrors the other wizards). */
export const subraceDraftKey = (editRace?: string, editSubrace?: string): string =>
  `hb:subraceDraft:${(editRace ?? '').trim().toLowerCase() || '_'}:${(editSubrace ?? '').trim().toLowerCase() || 'new'}`;

export const DRAFT_FORM_KEYS = [
  'parentRaceKey', 'parentRaceName', 'name', 'desc',
  'size', 'speed',
  'languages', 'langChoiceAmount', 'langChoiceOptions',
  'abilityBonuses',
  'descAge', 'descAlignment', 'descSize', 'descLanguage', 'descAbilities',
] as const satisfies readonly (keyof SubraceForm)[];

export interface SubraceWizardDraft {
  v: number;
  form: Partial<SubraceForm>;
  extras: RaceExtras;
  step: SubraceWizardStep;
}

export function serializeDraft(fg: FormGroup<SubraceForm>, extras: RaceExtras, step: SubraceWizardStep): string {
  const form: Record<string, unknown> = {};
  DRAFT_FORM_KEYS.forEach(key => { form[key] = fg.get(key); });
  return JSON.stringify({ v: DRAFT_VERSION, form, extras, step } satisfies SubraceWizardDraft);
}

export function parseDraft(raw: string | null): SubraceWizardDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as SubraceWizardDraft;
    if (draft?.v !== DRAFT_VERSION || typeof draft.form !== 'object' || !draft.form) return null;
    return {
      ...draft,
      extras: { ...emptyExtras(), ...(draft.extras ?? {}) },
      step: SUBRACE_STEPS.includes(draft.step) ? draft.step : SubraceWizardStep.Identity,
    };
  } catch {
    return null;
  }
}

export function hydrateDraft(fg: FormGroup<SubraceForm>, draft: SubraceWizardDraft): void {
  DRAFT_FORM_KEYS.forEach(key => {
    if (!(key in draft.form)) return;
    fg.set(key, (draft.form as Record<string, unknown>)[key] as never);
  });
}

// ---------------------------------------------------------------------------
// Step component contract (every step receives the same props; unused ones are ignored)

export interface StepProps {
  formGroup: FormGroup<SubraceForm>;
  extras: RaceExtras;
  setExtras: SetStoreFunction<RaceExtras>;
  /** Parent-race options for the Identity step's selector, keyed by raceSelectorKey. */
  raceOptions: () => RaceOption[];
  goToStep: (step: SubraceWizardStep) => void;
  /** Opens the shared FeaturesPopup in "add" mode. */
  openAddFeature: () => void;
  /** Opens the shared FeaturesPopup in "edit" mode for an existing trait. */
  openEditFeature: (feature: FeatureDetail) => void;
  /** Review step only: validate + save to homebrewManager. */
  publish: () => void | Promise<void>;
}
