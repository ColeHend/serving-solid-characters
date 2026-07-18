import type { FormGroup } from 'coles-solid-library';
import type { SetStoreFunction } from 'solid-js/store';
import { FeatureDetail } from '../../../../../../models/generated';
import { FeatureDetail as DataFeatureDetail, Spell } from '../../../../../../models/data';
import { Subclass } from '../../../../../../models/data/subclasses';
import { createNewId } from '../../../../../../shared/customHooks/utility/tools/idGen';
import { SpellsKnown } from '../SpellsKnown';
import {
  LEVELS,
  draftStorage,
  featuresPlaced,
  formatLevelList,
  type StepMeta,
  type StepStatus,
} from '../../classes/wizard/wizard.shared';
import { buildSubclassSpellcasting, type SpellcastingFormState } from './subclassSpellcasting.shared';

// Shared (non-JSX) types, constants and pure helpers for the subclass-creation wizard.
// Mirrors the class wizard's wizard.shared.ts; the generic level/draft helpers are
// imported from there so the two wizards can never drift on them.

export { LEVELS, draftStorage, featuresPlaced, formatLevelList };
export type { StepMeta, StepStatus };

export interface SubclassForm extends SpellcastingFormState {
  /** Parent class NAME — what the persisted Subclass model, storage_key and duplicate guard key on. */
  parentClass: string;
  /** Selector key of the chosen parent class (see classSelectorKey) — disambiguates classes that
   *  share a name across rulesets (2014 vs 2024 Wizard). '' when unresolved (old drafts, name-only prefill). */
  parentClassId: string;
  name: string;
  description: string;
  /** Provenance label, e.g. "My Campaign"; empty/undefined = plain homebrew. */
  source?: string;
  /** Spell-picker selection on the Spellcasting step; ephemeral, never drafted/persisted. */
  selectedSpellName: string;
}

// ---------------------------------------------------------------------------
// Parent-class selector

/** Stable unique option key for a class in the merged SRD+homebrew list: the SRD GUID when
 *  present, else a name-derived key (homebrew classes are Dexie-keyed by name and may lack an id). */
export const classSelectorKey = (cls: { id?: string | number; name: string }): string =>
  cls.id != null && `${cls.id}` !== '' ? `${cls.id}` : `hb:${cls.name}`;

/** Ruleset tag for the selector: SRD entities carry a centrally-stamped `legacy`
 *  (2014 → true, 2024 → false); homebrew classes carry none. */
export const classVersionLabel = (cls: { legacy?: boolean }): '2014' | '2024' | 'Homebrew' =>
  cls.legacy === true ? '2014' : cls.legacy === false ? '2024' : 'Homebrew';

export interface ClassOption {
  key: string;
  name: string;
  version: '2014' | '2024' | 'Homebrew';
  /** Display text: "Wizard (2014)". */
  label: string;
}

export const toClassOption = (cls: { id?: string | number; name: string; legacy?: boolean }): ClassOption => {
  const version = classVersionLabel(cls);
  return { key: classSelectorKey(cls), name: cls.name, version, label: `${cls.name} (${version})` };
};

// ---------------------------------------------------------------------------
// Steps

export enum SubclassWizardStep {
  Identity = 0,
  Features = 1,
  Spellcasting = 2,
  Review = 3,
}

export const SUBCLASS_STEPS: SubclassWizardStep[] = [
  SubclassWizardStep.Identity,
  SubclassWizardStep.Features,
  SubclassWizardStep.Spellcasting,
  SubclassWizardStep.Review,
];

export const STEP_META: Record<SubclassWizardStep, StepMeta> = {
  [SubclassWizardStep.Identity]: {
    label: 'Identity',
    question: 'Which class does this subclass belong to?',
    subtitle: 'Pick the parent class, then name your subclass and describe its theme. You can change all of this later.',
  },
  [SubclassWizardStep.Features]: {
    label: 'Features',
    question: 'What do they gain as they level?',
    subtitle: 'Add features at the levels this subclass grants them — dots mark levels that already have features.',
  },
  [SubclassWizardStep.Spellcasting]: {
    label: 'Spellcasting',
    question: 'Does this subclass grant spellcasting?',
    subtitle: 'Optional. Half- or third-caster progressions fill their slot table automatically.',
  },
  [SubclassWizardStep.Review]: {
    label: 'Review',
    question: 'Ready to publish?',
    subtitle: 'Check the summary. You can publish and refine later — drafts stay editable.',
  },
};

// ---------------------------------------------------------------------------
// Option data

export interface SubclassCasterCard {
  /** UI casterType string the adapter consumes ('' = non-caster). */
  key: '' | 'third' | 'half';
  title: string;
  sub: string;
}

// Subclasses never full-cast — a full-caster progression belongs on the class itself.
export const SUBCLASS_CASTER_CARDS: SubclassCasterCard[] = [
  { key: '', title: 'None', sub: 'No spell slots. Purely martial or utility archetypes.' },
  { key: 'third', title: 'Third', sub: 'Slots to 4th level, starting at level 3. Eldritch Knight / Arcane Trickster pace.' },
  { key: 'half', title: 'Half', sub: 'Slots to 5th level, starting at level 2. Paladin / Ranger pace.' },
];

export const SUBCLASS_CASTER_BANNERS: Record<string, string> = {
  '': 'Non-caster — no slot table is added.',
  third: 'Third caster — the slot table gains columns 1st–4th, slots from level 3.',
  half: 'Half caster — the slot table gains columns 1st–5th, slots from level 2.',
};

export const CASTING_ABILITIES = ['Intelligence', 'Wisdom', 'Charisma'];

/** parseDataSpellcasting returns the calc stat UPPERCASED ('WISDOM'); map back to the UI word. */
export const normalizeCastingAbility = (raw: string | undefined): string => {
  if (!raw) return '';
  return CASTING_ABILITIES.find(a => a.toLowerCase() === raw.toLowerCase()) ?? '';
};

export const SPELLS_KNOWN_OPTIONS: { value: SpellsKnown; label: string }[] = [
  { value: SpellsKnown.None, label: 'None' },
  { value: SpellsKnown.Level, label: 'Level' },
  { value: SpellsKnown.HalfLevel, label: 'Half level' },
  { value: SpellsKnown.StatModPlusLevel, label: 'Stat modifier + level' },
  { value: SpellsKnown.StatModPlusHalfLevel, label: 'Stat modifier + half level' },
  { value: SpellsKnown.StatModPlusThirdLevel, label: 'Stat modifier + third level' },
  { value: SpellsKnown.Other, label: 'Custom per level' },
];

export const spellsKnownLabel = (value: SpellsKnown): string =>
  SPELLS_KNOWN_OPTIONS.find(o => o.value === value)?.label ?? 'None';

// ---------------------------------------------------------------------------
// Per-level state (source of truth for the Features step)

export interface SubclassLevels {
  /** Level (1-20) → features granted at that level. Sparse — subclasses skip most levels. */
  features: Record<number, FeatureDetail[]>;
}

export const emptySubclassLevels = (): SubclassLevels => ({ features: {} });

export const subclassFeatureLevels = (features: SubclassLevels['features']): number[] =>
  LEVELS.filter(l => (features[l]?.length ?? 0) > 0);

/**
 * Store (id-bearing generated FeatureDetail) → persisted data-model features record.
 * Strips the wizard-only id but keeps choiceKey/metadata so mads/usage survive a save,
 * unlike the old page's lossy {name, description} projection.
 */
export function buildSubclassFeatures(features: SubclassLevels['features']): Subclass['features'] {
  const result: Subclass['features'] = {};
  LEVELS.forEach(level => {
    const arr = features[level];
    if (!arr?.length) return;
    result[level] = arr.map(({ name, description, choiceKey, metadata }) => {
      const out: DataFeatureDetail = { name, description };
      if (choiceKey !== undefined) out.choiceKey = choiceKey;
      // generated metadata carries mads as an array; the data model's singular typing is
      // absorbed at the homebrewManager boundary like everywhere else.
      if (metadata !== undefined) out.metadata = metadata as DataFeatureDetail['metadata'];
      return out;
    });
  });
  return result;
}

/** Persisted features → store, stamping ids so FeatureRow/FeaturesPopup edits have stable identity.
 *  Accepts both the data-model record and the generated-DTO record (srdSubclass.features). */
export function hydrateSubclassFeatures(features?: Subclass['features'] | Record<number, FeatureDetail[]>): SubclassLevels['features'] {
  const result: SubclassLevels['features'] = {};
  if (!features) return result;
  Object.entries(features).forEach(([lvl, arr]) => {
    const level = +lvl;
    if (!Number.isFinite(level) || !Array.isArray(arr) || !arr.length) return;
    result[level] = arr.map(f => ({
      ...(f as FeatureDetail),
      id: (f as FeatureDetail).id || createNewId(),
    }));
  });
  return result;
}

// ---------------------------------------------------------------------------
// Persistence assembly

export const subclassStorageKey = (parentClass: string, name: string): string =>
  `${parentClass.toLowerCase()}__${name.toLowerCase()}`;

export function toDataSubclass(form: SubclassForm, levels: SubclassLevels): Subclass {
  const source = form.source?.trim();
  // The selector key is the parent's REAL id except for the legacy `hb:<name>` fallback
  // (pre-id homebrew classes) — a synthetic key must never persist as parentClassId;
  // consumers fall back to the parentClass name until the parent is re-saved with an id.
  const parentClassId = form.parentClassId && !form.parentClassId.startsWith('hb:')
    ? form.parentClassId
    : undefined;
  return {
    name: form.name,
    ...(source ? { source } : {}),
    parentClass: form.parentClass,
    ...(parentClassId ? { parentClassId } : {}),
    description: form.description || '',
    features: buildSubclassFeatures(levels.features),
    spellcasting: buildSubclassSpellcasting(form.name, form),
    choices: undefined,
    storage_key: subclassStorageKey(form.parentClass, form.name),
  };
}

// ---------------------------------------------------------------------------
// Step status + review rows

export function stepStatus(step: SubclassWizardStep, fg: FormGroup<SubclassForm>, levels: SubclassLevels): StepStatus {
  switch (step) {
  case SubclassWizardStep.Identity: {
    const named = ((fg.get('name') as string) || '').trim().length > 0;
    return named && !!fg.get('parentClass') ? 'complete' : 'incomplete';
  }
  case SubclassWizardStep.Features:
    // No warning tier: subclasses legitimately grant features at only a few levels.
    return featuresPlaced(levels.features) > 0 ? 'complete' : 'incomplete';
  case SubclassWizardStep.Spellcasting: {
    if (!fg.get('hasCasting')) return 'complete';
    return fg.get('casterType') && fg.get('castingModifier') ? 'complete' : 'incomplete';
  }
  default:
    return 'incomplete';
  }
}

export interface SubclassReviewRow {
  step: SubclassWizardStep;
  ok: boolean;
  title: string;
  summary: string;
  detail?: string;
  action: 'edit' | 'fix';
}

export function buildReviewRows(
  fg: FormGroup<SubclassForm>,
  levels: SubclassLevels,
  allowedLevels?: number[] | null,
): SubclassReviewRow[] {
  const name = ((fg.get('name') as string) || '').trim();
  const parentClass = (fg.get('parentClass') as string) || '';
  const placed = featuresPlaced(levels.features);
  const withFeatures = subclassFeatureLevels(levels.features);
  const offenders = allowedLevels ? withFeatures.filter(l => !allowedLevels.includes(l)) : [];

  const casterSummary = () => {
    if (!fg.get('hasCasting')) return 'Non-caster · no spell slots';
    const card = SUBCLASS_CASTER_CARDS.find(c => c.key === fg.get('casterType'));
    const ability = (fg.get('castingModifier') as string) || 'no ability picked';
    const known = spellsKnownLabel(fg.get('spellsKnownCalc') as SpellsKnown);
    return `${card?.title ?? '?'}-caster · ${ability} · ${known} known · ${fg.get('hasCantrips') ? 'cantrips' : 'no cantrips'}`;
  };

  return [
    {
      step: SubclassWizardStep.Identity,
      ok: stepStatus(SubclassWizardStep.Identity, fg, levels) === 'complete',
      title: 'Identity',
      summary: `${name || 'Unnamed subclass'} · subclass of ${parentClass || 'no class picked'}`,
      action: 'edit',
    },
    {
      step: SubclassWizardStep.Features,
      ok: placed > 0,
      title: `Features — ${placed} placed`,
      summary: placed > 0
        ? `Features at level${withFeatures.length === 1 ? '' : 's'} ${formatLevelList(withFeatures)}`
        : 'No features yet — a subclass needs at least one.',
      // Out-of-range levels are informational only — never blocks publish.
      detail: offenders.length
        ? `Level${offenders.length === 1 ? '' : 's'} ${formatLevelList(offenders)} aren't subclass levels for ${parentClass || 'the parent class'}.`
        : undefined,
      action: placed > 0 ? 'edit' : 'fix',
    },
    {
      step: SubclassWizardStep.Spellcasting,
      ok: stepStatus(SubclassWizardStep.Spellcasting, fg, levels) === 'complete',
      title: 'Spellcasting',
      summary: casterSummary(),
      action: 'edit',
    },
  ];
}

// ---------------------------------------------------------------------------
// Draft autosave

export const DRAFT_VERSION = 1;

/** Keyed by the ?name=&subclass= edit target only — a new subclass always drafts under
 *  ':new' so typing a name never spawns per-keystroke orphan drafts (mirrors the class wizard). */
export const subclassDraftKey = (editClass?: string, editSubclass?: string): string => {
  const cls = (editClass ?? '').trim().toLowerCase();
  const sub = (editSubclass ?? '').trim().toLowerCase();
  return `hb:subclassDraft:${cls && sub ? `${cls}__${sub}` : 'new'}`;
};

/** Every SubclassForm field that round-trips through a draft (selectedSpellName is ephemeral UI).
 *  parentClassId is absent from pre-existing drafts — hydrateDraft skips missing keys and the
 *  shell's parent-class lookup falls back to the name. */
export const DRAFT_FORM_KEYS = [
  'parentClass', 'parentClassId', 'name', 'description', 'source',
  'hasCasting', 'casterType', 'castingModifier',
  'spellsKnownCalc', 'halfCasterRoundUp', 'hasCantrips', 'hasRitualCasting',
  'spellsKnownPerLevel', 'spellcastingInfo', 'subclassSpells',
] as const satisfies readonly (keyof SubclassForm)[];

export interface SubclassWizardDraft {
  v: number;
  form: Partial<SubclassForm>;
  levels: SubclassLevels;
  step: SubclassWizardStep;
}

export function serializeDraft(fg: FormGroup<SubclassForm>, levels: SubclassLevels, step: SubclassWizardStep): string {
  const form: Record<string, unknown> = {};
  DRAFT_FORM_KEYS.forEach(key => { form[key] = fg.get(key); });
  return JSON.stringify({ v: DRAFT_VERSION, form, levels, step } satisfies SubclassWizardDraft);
}

export function parseDraft(raw: string | null): SubclassWizardDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as SubclassWizardDraft;
    if (draft?.v !== DRAFT_VERSION || typeof draft.form !== 'object' || !draft.form) return null;
    return {
      ...draft,
      levels: { ...emptySubclassLevels(), ...(draft.levels ?? {}) },
      step: SUBCLASS_STEPS.includes(draft.step) ? draft.step : SubclassWizardStep.Identity,
    };
  } catch {
    return null;
  }
}

export function hydrateDraft(fg: FormGroup<SubclassForm>, draft: SubclassWizardDraft): void {
  DRAFT_FORM_KEYS.forEach(key => {
    if (!(key in draft.form)) return;
    fg.set(key, (draft.form as Record<string, unknown>)[key] as never);
  });
}

/** Snapshot of the persistable form for publish (drafted keys + ephemeral defaults). */
export function collectForm(fg: FormGroup<SubclassForm>): SubclassForm {
  const form = {} as Record<string, unknown>;
  DRAFT_FORM_KEYS.forEach(key => { form[key] = fg.get(key); });
  form.selectedSpellName = '';
  return form as unknown as SubclassForm;
}

// ---------------------------------------------------------------------------
// Step component contract (every step receives the same props; unused ones are ignored)

export interface StepProps {
  formGroup: FormGroup<SubclassForm>;
  levels: SubclassLevels;
  setLevels: SetStoreFunction<SubclassLevels>;
  /** Parent-class options for the Identity step's selector, keyed by classSelectorKey. */
  classOptions: () => ClassOption[];
  /** Parent class's subclass-grant levels; null = no restriction (Features step shows all 20). */
  allowedLevels: () => number[] | null;
  /** Spell catalog for the Spellcasting step's picker. */
  allSpells: () => Spell[];
  goToStep: (step: SubclassWizardStep) => void;
  /** Opens the shared FeaturesPopup in "add" mode targeting the given level. */
  openAddFeature: (level: number) => void;
  /** Opens the shared FeaturesPopup in "edit" mode for an existing feature at the given level. */
  openEditFeature: (level: number, feature: FeatureDetail) => void;
  /** Review step only: validate + save to homebrewManager. */
  publish: () => void | Promise<void>;
}
