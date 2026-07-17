import type { FormGroup } from 'coles-solid-library';
import { Spell } from '../../../../../../models/generated';
import { UniqueSet, getAddNumberAccent } from '../../../../../../shared/';
import {
  draftStorage,
  toggleInArray,
  type StepMeta,
  type StepStatus,
} from '../../classes/wizard/wizard.shared';

// Shared (non-JSX) types, constants and pure helpers for the spell-creation wizard.
// Mirrors the subclass wizard's wizard.shared.ts; the generic draft/toggle helpers are
// imported from the class wizard so the wizards can never drift on them.

export { draftStorage, toggleInArray };
export type { StepMeta, StepStatus };

export interface SpellForm {
  // Identity
  name: string;
  /** Spell level as a string ("0"–"9", "0" = cantrip) — matches the persisted Spell model. */
  level: string;
  school: string;
  description: string;
  higherLevel: string;
  // Casting
  castingTime: string;
  range: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  isVerbal: boolean;
  isSomatic: boolean;
  isMaterial: boolean;
  materialsNeeded: string;
  // Classes
  classes: string[];
  // Pass-through — loaded with the spell and saved back untouched; no step edits these.
  id: string;
  components: string;
  damageType: string;
  page: string;
  subClasses: string[];
  /** Ruleset stamp on SRD entities (2014 → true); undefined = unknown, keep as-is. */
  legacy?: boolean;
}

// ---------------------------------------------------------------------------
// Steps

export enum SpellWizardStep {
  Identity = 0,
  Casting = 1,
  Classes = 2,
  Review = 3,
}

export const SPELL_STEPS: SpellWizardStep[] = [
  SpellWizardStep.Identity,
  SpellWizardStep.Casting,
  SpellWizardStep.Classes,
  SpellWizardStep.Review,
];

export const STEP_META: Record<SpellWizardStep, StepMeta> = {
  [SpellWizardStep.Identity]: {
    label: 'Identity',
    question: 'What is this spell?',
    subtitle: 'Name it, set its level and school, and describe what it does. You can change all of this later.',
  },
  [SpellWizardStep.Casting]: {
    label: 'Casting',
    question: 'How is it cast?',
    subtitle: 'Casting time, range, duration, and the components it demands. Concentration filters the duration list.',
  },
  [SpellWizardStep.Classes]: {
    label: 'Classes',
    question: 'Who can cast it?',
    subtitle: 'Tap the classes that learn this spell. Leave it empty for a spell no class gets by default.',
  },
  [SpellWizardStep.Review]: {
    label: 'Review',
    question: 'Ready to publish?',
    subtitle: 'Check the summary. You can publish and refine later — drafts stay editable.',
  },
};

// ---------------------------------------------------------------------------
// Option data

/** Level Select options: "0"–"9" valued, labeled Cantrip / 1st / 2nd / … */
export const SPELL_LEVELS: string[] = Array.from({ length: 10 }, (_, i) => `${i}`);

export const spellLevelLabel = (level: string): string => getAddNumberAccent(+level);

const uniqueSorted = (spells: Spell[], pick: (s: Spell) => string): string[] => {
  const set = new UniqueSet<string>();
  spells.forEach(s => {
    const value = pick(s);
    if (value) set.add(value);
  });
  return set.value.sort();
};

// Dropdown options are harvested from the existing SRD+homebrew catalog rather than
// hardcoded enums, so homebrew conventions show up alongside the official ones.
export const getSchools = (spells: Spell[]): string[] => uniqueSorted(spells, s => s.school);
export const getCastingTimes = (spells: Spell[]): string[] => uniqueSorted(spells, s => s.castingTime);
export const getRanges = (spells: Spell[]): string[] => uniqueSorted(spells, s => s.range);
export const getDurations = (spells: Spell[]): string[] => uniqueSorted(spells, s => s.duration);

/** Concentration spells only pick from concentration durations and vice-versa. */
export const filterDurations = (durations: string[], concentration: boolean): string[] =>
  durations.filter(d => concentration
    ? d.toLowerCase().includes('concentration')
    : !d.toLowerCase().includes('concentration'));

// ---------------------------------------------------------------------------
// Persistence assembly

/** Form → persisted Spell. Pass-through fields survive untouched so editing an SRD or
 *  AI-generated spell never strips data the wizard doesn't surface. */
export function toDataSpell(form: SpellForm): Spell {
  const data: Spell = {
    id: form.id || '',
    name: form.name.trim(),
    description: form.description || '',
    duration: form.duration || '',
    concentration: !!form.concentration,
    components: form.components || '',
    level: form.level || '0',
    range: form.range || '',
    ritual: !!form.ritual,
    school: form.school || '',
    castingTime: form.castingTime || '',
    damageType: form.damageType || '',
    page: form.page || '',
    isMaterial: !!form.isMaterial,
    isSomatic: !!form.isSomatic,
    isVerbal: !!form.isVerbal,
    materialsNeeded: form.materialsNeeded || '',
    higherLevel: form.higherLevel || '',
    classes: [...(form.classes ?? [])],
    subClasses: [...(form.subClasses ?? [])],
  };
  if (form.legacy !== undefined) data.legacy = form.legacy;
  return data;
}

// ---------------------------------------------------------------------------
// Step status + review rows

export function stepStatus(step: SpellWizardStep, fg: FormGroup<SpellForm>): StepStatus {
  const filled = (key: keyof SpellForm) => ((fg.get(key) as string) || '').trim().length > 0;
  switch (step) {
  case SpellWizardStep.Identity:
    return filled('name') ? 'complete' : 'incomplete';
  case SpellWizardStep.Casting:
    return filled('castingTime') && filled('range') && filled('duration') ? 'complete' : 'incomplete';
  case SpellWizardStep.Classes:
    return ((fg.get('classes') as string[])?.length ?? 0) > 0 ? 'complete' : 'incomplete';
  default:
    return 'incomplete';
  }
}

/** "V, S, M (a pinch of sulfur)" — the classic statblock component line; 'None' when bare. */
export function spellComponentString(fg: FormGroup<SpellForm>): string {
  const parts: string[] = [];
  if (fg.get('isVerbal')) parts.push('V');
  if (fg.get('isSomatic')) parts.push('S');
  if (fg.get('isMaterial')) {
    const materials = ((fg.get('materialsNeeded') as string) || '').trim();
    parts.push(materials ? `M (${materials})` : 'M');
  }
  return parts.length ? parts.join(', ') : 'None';
}

export interface SpellReviewRow {
  step: SpellWizardStep;
  ok: boolean;
  title: string;
  summary: string;
  detail?: string;
  action: 'edit' | 'fix';
}

export function buildReviewRows(fg: FormGroup<SpellForm>): SpellReviewRow[] {
  const name = ((fg.get('name') as string) || '').trim();
  const description = ((fg.get('description') as string) || '').trim();
  const school = (fg.get('school') as string) || '';
  const castingTime = (fg.get('castingTime') as string) || '';
  const range = (fg.get('range') as string) || '';
  const duration = (fg.get('duration') as string) || '';
  const classes = (fg.get('classes') as string[]) ?? [];

  const identityOk = !!name && !!description;
  const castingOk = stepStatus(SpellWizardStep.Casting, fg) === 'complete';
  const castingSummary = [
    `${castingTime || '?'} · ${range || '?'} · ${duration || '?'}`,
    fg.get('concentration') ? ' · Concentration' : '',
    fg.get('ritual') ? ' · Ritual' : '',
  ].join('');

  return [
    {
      step: SpellWizardStep.Identity,
      ok: identityOk,
      title: 'Identity',
      summary: `${name || 'Unnamed spell'} · ${spellLevelLabel((fg.get('level') as string) || '0')} · ${school || 'no school'}`,
      detail: description ? undefined : 'No description yet — add one so the spell reads correctly.',
      action: identityOk ? 'edit' : 'fix',
    },
    {
      step: SpellWizardStep.Casting,
      ok: castingOk,
      title: 'Casting',
      summary: castingSummary,
      detail: `Components: ${spellComponentString(fg)}`,
      action: castingOk ? 'edit' : 'fix',
    },
    {
      step: SpellWizardStep.Classes,
      ok: true,
      title: `Classes — ${classes.length} selected`,
      summary: classes.length ? classes.join(', ') : 'No classes — nothing learns this by default.',
      action: 'edit',
    },
  ];
}

// ---------------------------------------------------------------------------
// Draft autosave

export const DRAFT_VERSION = 1;

/** Keyed by the ?name= edit target only — a new spell always drafts under ':new' so
 *  typing a name never spawns per-keystroke orphan drafts (mirrors the other wizards). */
export const spellDraftKey = (editName?: string): string => {
  const name = (editName ?? '').trim().toLowerCase();
  return `hb:spellDraft:${name || 'new'}`;
};

/** Every SpellForm field round-trips through a draft — including the pass-through
 *  fields, so a drafted edit of an SRD/AI spell keeps data the wizard never shows. */
export const DRAFT_FORM_KEYS = [
  'name', 'level', 'school', 'description', 'higherLevel',
  'castingTime', 'range', 'duration', 'concentration', 'ritual',
  'isVerbal', 'isSomatic', 'isMaterial', 'materialsNeeded',
  'classes',
  'id', 'components', 'damageType', 'page', 'subClasses', 'legacy',
] as const satisfies readonly (keyof SpellForm)[];

export interface SpellWizardDraft {
  v: number;
  form: Partial<SpellForm>;
  step: SpellWizardStep;
}

export function serializeDraft(fg: FormGroup<SpellForm>, step: SpellWizardStep): string {
  const form: Record<string, unknown> = {};
  DRAFT_FORM_KEYS.forEach(key => { form[key] = fg.get(key); });
  return JSON.stringify({ v: DRAFT_VERSION, form, step } satisfies SpellWizardDraft);
}

export function parseDraft(raw: string | null): SpellWizardDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as SpellWizardDraft;
    if (draft?.v !== DRAFT_VERSION || typeof draft.form !== 'object' || !draft.form) return null;
    return {
      ...draft,
      step: SPELL_STEPS.includes(draft.step) ? draft.step : SpellWizardStep.Identity,
    };
  } catch {
    return null;
  }
}

export function hydrateDraft(fg: FormGroup<SpellForm>, draft: SpellWizardDraft): void {
  DRAFT_FORM_KEYS.forEach(key => {
    if (!(key in draft.form)) return;
    fg.set(key, (draft.form as Record<string, unknown>)[key] as never);
  });
}

/** Snapshot of the full form for publish. */
export function collectForm(fg: FormGroup<SpellForm>): SpellForm {
  const form = {} as Record<string, unknown>;
  DRAFT_FORM_KEYS.forEach(key => { form[key] = fg.get(key); });
  return form as unknown as SpellForm;
}

// ---------------------------------------------------------------------------
// Step component contract (every step receives the same props; unused ones are ignored)

export interface StepProps {
  formGroup: FormGroup<SpellForm>;
  /** Merged SRD+homebrew spell catalog — source of the derived dropdown options. */
  allSpells: () => Spell[];
  /** Class names for the Classes step's toggle chips. */
  classNames: () => string[];
  goToStep: (step: SpellWizardStep) => void;
  /** Review step only: validate + save to homebrewManager. */
  publish: () => void | Promise<void>;
  /** Review step only: remove the homebrew spell being edited. */
  deleteSpell: () => void | Promise<void>;
  /** True when the current name matches a stored homebrew spell (shows Delete). */
  isExisting: () => boolean;
}
