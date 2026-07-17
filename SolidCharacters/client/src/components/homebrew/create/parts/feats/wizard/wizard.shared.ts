import type { FormGroup } from 'coles-solid-library';
import { FeatureMetadata, MadFeature, Prerequisite, PrerequisiteType } from '../../../../../../models/generated';
import { commandChipLabel, validateStoredCommand } from '../../../../../../shared/ai/commands/madCommandCatalog';
import {
  draftStorage,
  toggleInArray,
  type StepMeta,
  type StepStatus,
} from '../../classes/wizard/wizard.shared';

// Shared (non-JSX) types, constants and pure helpers for the feat-creation wizard.
// Mirrors the spell wizard's wizard.shared.ts; the generic draft/toggle helpers are
// imported from the class wizard so the wizards can never drift on them.

export { draftStorage, toggleInArray, PrerequisiteType };
export type { StepMeta, StepStatus };

export interface FeatForm {
  // Identity
  name: string;
  description: string;
  // Prerequisites
  prerequisites: Prerequisite[];
  // Effects — the whole FeatureDetail.metadata object (uses/recharge/spells/category/mads),
  // owned by the shared FeaturesPopup and carried here so nothing it authors is lost.
  metadata?: FeatureMetadata;
  // Pass-through — loaded with the feat and saved back untouched; no step edits these.
  id: string;
  /** Ruleset stamp on SRD entities (2014 → true); undefined = unknown, keep as-is. */
  legacy?: boolean;
}

// ---------------------------------------------------------------------------
// Steps

export enum FeatWizardStep {
  Identity = 0,
  Prerequisites = 1,
  Effects = 2,
  Review = 3,
}

export const FEAT_STEPS: FeatWizardStep[] = [
  FeatWizardStep.Identity,
  FeatWizardStep.Prerequisites,
  FeatWizardStep.Effects,
  FeatWizardStep.Review,
];

export const STEP_META: Record<FeatWizardStep, StepMeta> = {
  [FeatWizardStep.Identity]: {
    label: 'Identity',
    question: 'What is this feat?',
    subtitle: 'Name it and describe what it grants. You can change all of this later.',
  },
  [FeatWizardStep.Prerequisites]: {
    label: 'Prerequisites',
    question: 'What must a character have first?',
    subtitle: 'Add the requirements to take this feat — ability scores, levels, classes, and more. Leave it empty for a feat anyone can take.',
  },
  [FeatWizardStep.Effects]: {
    label: 'Effects',
    question: 'What does it do mechanically?',
    subtitle: 'Effects apply automatically to characters that take this feat. A purely descriptive feat can skip this.',
  },
  [FeatWizardStep.Review]: {
    label: 'Review',
    question: 'Ready to publish?',
    subtitle: 'Check the summary. You can publish and refine later — drafts stay editable.',
  },
};

// ---------------------------------------------------------------------------
// Prerequisite building

export const MAX_PREREQS = 10;

export const PREREQ_TYPE_OPTIONS: { type: PrerequisiteType; label: string }[] = [
  { type: PrerequisiteType.Stat, label: 'Ability Score' },
  { type: PrerequisiteType.Class, label: 'Class' },
  { type: PrerequisiteType.Level, label: 'Class Level' },
  { type: PrerequisiteType.Subclass, label: 'Subclass' },
  { type: PrerequisiteType.Feat, label: 'Feat' },
  { type: PrerequisiteType.Race, label: 'Race' },
  { type: PrerequisiteType.Item, label: 'Item' },
  { type: PrerequisiteType.String, label: 'Other / Text' },
];

export interface PrereqBuilderInput {
  keyName: string;
  keyValue: string;
  classLevel: string;
}

/** Option values per type, harvested from the live catalogs by the builder. */
export interface PrereqCatalogs {
  classes: string[];
  /** Stored as "Parent:Name" — the same encoding the old selector persisted. */
  subclasses: string[];
  feats: string[];
  races: string[];
  items: string[];
}

/** Committed prerequisite value for the current builder input; null = nothing to add. */
export function buildPrereqValue(type: PrerequisiteType, input: PrereqBuilderInput): string | null {
  switch (type) {
  case PrerequisiteType.Stat:
    return `${input.keyName.toUpperCase()} ${input.keyValue}`;
  case PrerequisiteType.Class: {
    const lvl = input.classLevel;
    return lvl && /^\d+$/.test(lvl) ? `${input.keyValue} ${lvl}` : input.keyValue;
  }
  case PrerequisiteType.String:
    return input.keyValue.trim() || null;
  default:
    return input.keyValue;
  }
}

/** Builder defaults whenever the requirement type changes (the old selector's reset effect, pure). */
export function defaultsForType(type: PrerequisiteType, catalogs: PrereqCatalogs): PrereqBuilderInput {
  switch (type) {
  case PrerequisiteType.Stat:
    return { keyName: 'STR', keyValue: '10', classLevel: '' };
  case PrerequisiteType.Class:
    return { keyName: 'Class', keyValue: catalogs.classes[0] ?? 'Barbarian', classLevel: '' };
  case PrerequisiteType.Level:
    return { keyName: 'Level', keyValue: '1', classLevel: '' };
  case PrerequisiteType.Subclass:
    return { keyName: 'Subclass', keyValue: catalogs.subclasses[0] ?? '', classLevel: '' };
  case PrerequisiteType.Feat:
    return { keyName: 'Feat', keyValue: catalogs.feats[0] ?? '', classLevel: '' };
  case PrerequisiteType.Race:
    return { keyName: 'Race', keyValue: catalogs.races[0] ?? '', classLevel: '' };
  case PrerequisiteType.Item:
    return { keyName: 'Item', keyValue: catalogs.items[0] ?? '', classLevel: '' };
  default:
    return { keyName: 'Text', keyValue: '', classLevel: '' };
  }
}

/** Legacy stored feats hold preReqs as [{name: "STR 12"}, ...] — same mapping the old form used. */
export function mapLegacyPreReqs(preReqs: unknown[]): Prerequisite[] {
  return (preReqs ?? []).map((f): Prerequisite => {
    const raw = ((f as { value?: unknown; name?: unknown })?.value
      ?? (f as { name?: unknown })?.name ?? '').toString();
    if (/^(STR|DEX|CON|INT|WIS|CHA)\s+\d+$/i.test(raw))
      return { type: PrerequisiteType.Stat, value: raw.toUpperCase() };
    if (/^\d+$/.test(raw))
      return { type: PrerequisiteType.Level, value: raw };
    return { type: PrerequisiteType.Class, value: raw };
  });
}

/** Human label for a committed prerequisite — chips and review rows. */
export function describePrerequisite(pre: Prerequisite): string {
  switch (pre.type) {
  case PrerequisiteType.Level:
    return `Level ${pre.value}`;
  case PrerequisiteType.Subclass:
    return pre.value.replace(':', ' / ');
  case PrerequisiteType.Feat:
    return `Feat: ${pre.value}`;
  case PrerequisiteType.Race:
    return `Race: ${pre.value}`;
  case PrerequisiteType.Item:
    return `Item: ${pre.value}`;
  default:
    // Stat ("STR 13"), Class ("Barbarian 3") and free text already read on their own.
    return pre.value;
  }
}

// ---------------------------------------------------------------------------
// Effects (mads) helpers

export function formMads(fg: FormGroup<FeatForm>): MadFeature[] {
  return (fg.get('metadata') as FeatureMetadata | undefined)?.mads ?? [];
}

export { commandChipLabel, validateStoredCommand };

// ---------------------------------------------------------------------------
// Persistence assembly

/** The Dexie feats table is keyed by a root `name`, and legacy consumers still read
 *  root `desc[]` — the persisted shape carries both alongside the real model. */
export type StoredFeat = {
  id: string;
  legacy?: boolean;
  details: {
    id: string;
    name: string;
    description: string;
    metadata?: FeatureMetadata;
  };
  prerequisites: Prerequisite[];
  name: string;
  desc: string[];
};

/** Form → persisted Feat. Pass-through fields survive untouched so editing an SRD or
 *  AI-generated feat never strips data the wizard doesn't surface. */
export function toDataFeat(form: FeatForm): StoredFeat {
  const name = form.name.trim();
  const description = form.description || '';
  const data: StoredFeat = {
    id: form.id || '',
    details: {
      id: form.id || '',
      name,
      description,
      ...(form.metadata ? { metadata: form.metadata } : {}),
    },
    prerequisites: [...(form.prerequisites ?? [])],
    name,
    desc: [description],
  };
  if (form.legacy !== undefined) data.legacy = form.legacy;
  return data;
}

// ---------------------------------------------------------------------------
// Step status + review rows

export function stepStatus(step: FeatWizardStep, fg: FormGroup<FeatForm>): StepStatus {
  switch (step) {
  case FeatWizardStep.Identity:
    return ((fg.get('name') as string) || '').trim().length > 0 ? 'complete' : 'incomplete';
  case FeatWizardStep.Prerequisites:
    return ((fg.get('prerequisites') as Prerequisite[])?.length ?? 0) > 0 ? 'complete' : 'incomplete';
  case FeatWizardStep.Effects:
    return formMads(fg).length > 0 ? 'complete' : 'incomplete';
  default:
    return 'incomplete';
  }
}

export interface FeatReviewRow {
  step: FeatWizardStep;
  ok: boolean;
  title: string;
  summary: string;
  detail?: string;
  action: 'edit' | 'fix';
}

export function buildReviewRows(fg: FormGroup<FeatForm>): FeatReviewRow[] {
  const name = ((fg.get('name') as string) || '').trim();
  const description = ((fg.get('description') as string) || '').trim();
  const prereqs = (fg.get('prerequisites') as Prerequisite[]) ?? [];
  const mads = formMads(fg);
  const madErrors = mads.flatMap(mad => validateStoredCommand(mad));

  const identityOk = !!name && !!description;

  return [
    {
      step: FeatWizardStep.Identity,
      ok: identityOk,
      title: 'Identity',
      summary: name || 'Unnamed feat',
      detail: description ? undefined : 'No description yet — add one so the feat reads correctly.',
      action: identityOk ? 'edit' : 'fix',
    },
    {
      step: FeatWizardStep.Prerequisites,
      ok: true,
      title: `Prerequisites — ${prereqs.length}`,
      summary: prereqs.length
        ? prereqs.map(describePrerequisite).join(', ')
        : 'No prerequisites — anyone can take this feat.',
      action: 'edit',
    },
    {
      step: FeatWizardStep.Effects,
      ok: madErrors.length === 0,
      title: `Effects — ${mads.length}`,
      summary: mads.length
        ? mads.map(commandChipLabel).join(', ')
        : 'No effects — this feat is descriptive only.',
      detail: madErrors[0],
      action: madErrors.length === 0 ? 'edit' : 'fix',
    },
  ];
}

// ---------------------------------------------------------------------------
// Draft autosave

export const DRAFT_VERSION = 1;

/** Keyed by the ?name= edit target only — a new feat always drafts under ':new' so
 *  typing a name never spawns per-keystroke orphan drafts (mirrors the other wizards). */
export const featDraftKey = (editName?: string): string => {
  const name = (editName ?? '').trim().toLowerCase();
  return `hb:featDraft:${name || 'new'}`;
};

/** Every FeatForm field round-trips through a draft — including the pass-through
 *  fields, so a drafted edit of an SRD/AI feat keeps data the wizard never shows. */
export const DRAFT_FORM_KEYS = [
  'name', 'description', 'prerequisites', 'metadata', 'id', 'legacy',
] as const satisfies readonly (keyof FeatForm)[];

export interface FeatWizardDraft {
  v: number;
  form: Partial<FeatForm>;
  step: FeatWizardStep;
}

export function serializeDraft(fg: FormGroup<FeatForm>, step: FeatWizardStep): string {
  const form: Record<string, unknown> = {};
  DRAFT_FORM_KEYS.forEach(key => { form[key] = fg.get(key); });
  return JSON.stringify({ v: DRAFT_VERSION, form, step } satisfies FeatWizardDraft);
}

export function parseDraft(raw: string | null): FeatWizardDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as FeatWizardDraft;
    if (draft?.v !== DRAFT_VERSION || typeof draft.form !== 'object' || !draft.form) return null;
    return {
      ...draft,
      step: FEAT_STEPS.includes(draft.step) ? draft.step : FeatWizardStep.Identity,
    };
  } catch {
    return null;
  }
}

export function hydrateDraft(fg: FormGroup<FeatForm>, draft: FeatWizardDraft): void {
  DRAFT_FORM_KEYS.forEach(key => {
    if (!(key in draft.form)) return;
    let value = (draft.form as Record<string, unknown>)[key];
    // A hand-edited or damaged draft must never park garbage in the structured fields.
    if (key === 'prerequisites' && !Array.isArray(value)) value = [];
    if (key === 'metadata' && (value === null || typeof value !== 'object')) value = undefined;
    fg.set(key, value as never);
  });
}

/** Snapshot of the full form for publish. */
export function collectForm(fg: FormGroup<FeatForm>): FeatForm {
  const form = {} as Record<string, unknown>;
  DRAFT_FORM_KEYS.forEach(key => { form[key] = fg.get(key); });
  return form as unknown as FeatForm;
}

// ---------------------------------------------------------------------------
// Step component contract (every step receives the same props; unused ones are ignored)

export interface FeatStepProps {
  formGroup: FormGroup<FeatForm>;
  goToStep: (step: FeatWizardStep) => void;
  /** Effects step only: opens the shared FeaturesPopup on this feat's details. */
  openEffectsEditor: () => void;
  /** Review step only: validate + save to homebrewManager. */
  publish: () => void | Promise<void>;
  /** Review step only: remove the homebrew feat being edited. */
  deleteFeat: () => void | Promise<void>;
  /** True when the current name matches a stored homebrew feat (shows Delete). */
  isExisting: () => boolean;
}
