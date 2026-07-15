import type { FormGroup } from 'coles-solid-library';
import type { SetStoreFunction } from 'solid-js/store';
import { Stat, CastingStat } from '../../../../../../shared/models/stats';
import { SpellsKnown } from '../../../../../../shared/models/casting';
import { CasterType, Choice, FeatureTypes } from '../../../../../../models/old/core.model';
import { LevelEntity, Subclass } from '../../../../../../models/old/class.model';
import { FeatureDetail } from '../../../../../../models/generated';

// Shared (non-JSX) types, constants and pure helpers for the class-creation wizard.
// Single source of truth for step metadata, completion status and review summaries so the
// Stepper, the Features warning banner and the Review step can never disagree.

export interface EquipmentChoice {
  a: string;
  b: string;
}

export type SpellsKnownMode = 'fixed' | 'prepared' | 'spellbook';

interface ClassSpecificValue {
  key: string;
  value: string;
}

export interface ClassForm {
  name: string;
  description: string;
  hitDie: number;
  primaryStat: Stat[];
  savingThrows: Stat[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  armorStart: string[];
  weaponStart: string[];
  itemStart: string[];
  armorProfChoices: Choice<string>[];
  weaponProfChoices: Choice<string>[];
  toolProfChoices: Choice<string>[];
  skills: Stat[];
  skillChoiceNum: number;
  skillChoices: string[];
  startingEquipment: string[];
  equipmentChoices: EquipmentChoice[];
  spellCasting: boolean;
  castingStat?: CastingStat;
  casterType?: CasterType;
  classSpecificValues?: ClassSpecificValue[];
  subclasses?: Subclass[];
  metadataSubclassLevels?: number[];
  metadataSubclassName?: string;
  metadataSubclassPos?: 'before' | 'after' | string;
  classLevels: LevelEntity[];
  spellcastName: string;
  spellsKnownCalc: SpellsKnown;
  spellsKnownMode: SpellsKnownMode;
  // Holds a Stat (0-5); the adapter's statName() maps 0-5 → STR..CHA, so the old
  // CastingStat enum (None/INT/WIS/CHA) mis-indexed it (WIS=2 → 'CON').
  // Undefined until the user picks an ability chip on the Spellcasting step.
  spellcastAbility?: Stat;
  spellsKnownRoundup?: boolean;
  spellsInfo: string;
  spellsLevel: number;
  hasCantrips: boolean;
}

export interface ProfStore {
  weapons?: string[];
  armor?: string[];
  tools?: string[];
}

// ---------------------------------------------------------------------------
// Steps

export enum WizardStep {
  Identity = 0,
  Proficiencies = 1,
  Equipment = 2,
  Features = 3,
  Spellcasting = 4,
  Review = 5,
}

export const WIZARD_STEPS: WizardStep[] = [
  WizardStep.Identity,
  WizardStep.Proficiencies,
  WizardStep.Equipment,
  WizardStep.Features,
  WizardStep.Spellcasting,
  WizardStep.Review,
];

export interface StepMeta {
  label: string;
  question: string;
  subtitle: string;
}

export const STEP_META: Record<WizardStep, StepMeta> = {
  [WizardStep.Identity]: {
    label: 'Identity',
    question: 'Who is this class?',
    subtitle: 'A name, a die, and the abilities it lives by. You can change all of this later.',
  },
  [WizardStep.Proficiencies]: {
    label: 'Proficiencies',
    question: 'What are they trained to use?',
    subtitle: 'Tap to toggle. Broad categories here — specific weapons and tools come with equipment.',
  },
  [WizardStep.Equipment]: {
    label: 'Equipment',
    question: 'What do they carry at level 1?',
    subtitle: 'Build A-or-B choices on the left; pull items from the compendium on the right.',
  },
  [WizardStep.Features]: {
    label: 'Features',
    question: 'What do they gain as they level?',
    subtitle: 'Work level by level — dots mark levels that already have features.',
  },
  [WizardStep.Spellcasting]: {
    label: 'Spellcasting',
    question: 'How do they cast?',
    subtitle: 'Pick a caster type and the level table fills its spell-slot columns automatically.',
  },
  [WizardStep.Review]: {
    label: 'Review',
    question: 'Ready to publish?',
    subtitle: 'Check the summary. You can publish with warnings and fix them later — drafts stay editable.',
  },
};

// ---------------------------------------------------------------------------
// Option data

export const STAT_ABBR = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
export const STAT_FULL = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
export const ALL_STATS: Stat[] = [Stat.STR, Stat.DEX, Stat.CON, Stat.INT, Stat.WIS, Stat.CHA];

export const MAX_PRIMARY_ABILITIES = 2;
export const MAX_SAVING_THROWS = 2;

export interface HitDieOption {
  die: number;
  label: string;
  sub: string;
}

export const HIT_DICE: HitDieOption[] = [
  { die: 6, label: 'd6', sub: 'Fragile caster' },
  { die: 8, label: 'd8', sub: 'Balanced' },
  { die: 10, label: 'd10', sub: 'Frontline' },
  { die: 12, label: 'd12', sub: 'Juggernaut' },
];

export const ARMOR_OPTIONS = ['Light', 'Medium', 'Heavy', 'Shields'];
export const WEAPON_OPTIONS = ['Simple', 'Martial'];

export interface CasterCard {
  type: CasterType;
  title: string;
  sub: string;
}

export const CASTER_CARDS: CasterCard[] = [
  { type: CasterType.None, title: 'None', sub: 'No spell slots. Martial classes, maneuvers, ki-style resources.' },
  { type: CasterType.Third, title: 'Third', sub: 'Slots to 4th level, starting at class level 3. Eldritch Knight pace.' },
  { type: CasterType.Half, title: 'Half', sub: 'Slots to 5th level, starting at class level 2. Paladin / Ranger pace.' },
  { type: CasterType.Full, title: 'Full', sub: 'Slots to 9th level from level 1. Wizard / Cleric pace.' },
];

export const SPELLS_KNOWN_MODES: { mode: SpellsKnownMode; label: string }[] = [
  { mode: 'fixed', label: 'Fixed number' },
  { mode: 'prepared', label: 'Prepared list' },
  { mode: 'spellbook', label: 'Spellbook' },
];

export const CASTER_BANNERS: Record<CasterType, string> = {
  [CasterType.None]: 'Non-caster — the level table stays martial; no slot columns are added.',
  [CasterType.Third]: 'Third caster — the table gains slot columns 1st–4th, slots from level 3.',
  [CasterType.Half]: 'Half caster — the table gains slot columns 1st–5th, slots from level 2.',
  [CasterType.Full]: 'Full caster — the table gains slot columns 1st–9th, slots from level 1.',
};

// ---------------------------------------------------------------------------
// Per-level state (source of truth for the Features step)

export interface WizardLevels {
  /** Level (1-20) → features granted at that level. Starts empty — no placeholder seeding. */
  features: Record<number, FeatureDetail[]>;
  /** Advanced: custom level-table columns, column key → (level → cell value). */
  classSpecific: Record<string, Record<number, string>>;
  /** Advanced: cantrips known per level (casters only). */
  cantripsKnown: Record<number, number>;
}

export const emptyWizardLevels = (): WizardLevels => ({ features: {}, classSpecific: {}, cantripsKnown: {} });

export const MAX_LEVEL = 20;
export const LEVELS: number[] = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

export const profBonusFor = (level: number): number =>
  level < 5 ? 2 : level < 9 ? 3 : level < 13 ? 4 : level < 17 ? 5 : 6;

export const emptyLevels = (features: WizardLevels['features']): number[] =>
  LEVELS.filter(l => !(features[l]?.length));

export const featuresPlaced = (features: WizardLevels['features']): number =>
  LEVELS.reduce((sum, l) => sum + (features[l]?.length ?? 0), 0);

export const formatLevelList = (levels: number[]): string => levels.join(', ');

/** Toggle `value` in `list`; when adding would exceed `max`, return the list unchanged. */
export function toggleInArray<T>(list: T[] | undefined, value: T, max?: number): T[] {
  const arr = list ?? [];
  if (arr.includes(value)) return arr.filter(v => v !== value);
  if (max !== undefined && arr.length >= max) return arr;
  return [...arr, value];
}

/**
 * Bridge back to the adapter's legacy shape: rebuild the LevelEntity[] that toClass5E consumes
 * from the wizard's level store. classSpecific keys are stamped on EVERY level (the adapter
 * derives its column list from level 1's keys).
 */
export function buildLevelEntities(className: string, levels: WizardLevels): LevelEntity[] {
  const columnKeys = Object.keys(levels.classSpecific);
  return LEVELS.map(level => {
    const info = { className, subclassName: '', level, type: FeatureTypes.Class, other: '' };
    const classSpecific: Record<string, string> = {};
    columnKeys.forEach(key => { classSpecific[key] = levels.classSpecific[key]?.[level] ?? ''; });
    const cantrips = levels.cantripsKnown[level];
    return {
      level,
      info,
      profBonus: profBonusFor(level),
      features: (levels.features[level] ?? []).map(f => ({
        name: f.name,
        value: f.description,
        metadata: {},
        info: { ...info },
      })),
      classSpecific,
      spellcasting: cantrips !== undefined ? { cantrips_known: cantrips } : undefined,
    } as LevelEntity;
  });
}

// ---------------------------------------------------------------------------
// Step status + review rows

export type StepStatus = 'complete' | 'incomplete' | 'warning';

export function stepStatus(step: WizardStep, fg: FormGroup<ClassForm>, levels: WizardLevels): StepStatus {
  switch (step) {
  case WizardStep.Identity: {
    const named = ((fg.get('name') as string) || '').trim().length > 0;
    return named && !!fg.get('hitDie') && ((fg.get('primaryStat') as Stat[])?.length ?? 0) > 0
      ? 'complete' : 'incomplete';
  }
  case WizardStep.Proficiencies: {
    const any = ((fg.get('savingThrows') as Stat[])?.length ?? 0) > 0
      || ((fg.get('armorProficiencies') as string[])?.length ?? 0) > 0
      || ((fg.get('weaponProficiencies') as string[])?.length ?? 0) > 0
      || ((fg.get('toolProficiencies') as string[])?.length ?? 0) > 0
      || ((fg.get('skillChoices') as string[])?.length ?? 0) > 0;
    return any ? 'complete' : 'incomplete';
  }
  case WizardStep.Equipment: {
    const any = ((fg.get('itemStart') as string[])?.length ?? 0) > 0
      || ((fg.get('equipmentChoices') as EquipmentChoice[])?.length ?? 0) > 0;
    return any ? 'complete' : 'incomplete';
  }
  case WizardStep.Features: {
    if (!featuresPlaced(levels.features)) return 'incomplete';
    return emptyLevels(levels.features).length ? 'warning' : 'complete';
  }
  case WizardStep.Spellcasting:
    // undefined until the user picks a card — choosing "None" is a valid, complete answer.
    return fg.get('casterType') === undefined ? 'incomplete' : 'complete';
  default:
    return 'incomplete';
  }
}

export interface ReviewRowData {
  step: WizardStep;
  ok: boolean;
  title: string;
  summary: string;
  /** Optional second line (used by the Features warning row). */
  detail?: string;
  action: 'edit' | 'fix';
}

export function buildReviewRows(fg: FormGroup<ClassForm>, levels: WizardLevels): ReviewRowData[] {
  const name = ((fg.get('name') as string) || '').trim();
  const hitDie = fg.get('hitDie') as number | undefined;
  const primary = ((fg.get('primaryStat') as Stat[]) ?? []).map(s => STAT_ABBR[s]).filter(Boolean);
  const saves = ((fg.get('savingThrows') as Stat[]) ?? []).map(s => STAT_ABBR[s]).filter(Boolean);
  const armor = (fg.get('armorProficiencies') as string[]) ?? [];
  const weapons = (fg.get('weaponProficiencies') as string[]) ?? [];
  const skillNum = (fg.get('skillChoiceNum') as number) || 0;
  const skillOpts = (fg.get('skillChoices') as string[]) ?? [];
  const kit = (fg.get('itemStart') as string[]) ?? [];
  const equipChoices = (fg.get('equipmentChoices') as EquipmentChoice[]) ?? [];
  const casterType = fg.get('casterType') as CasterType | undefined;
  const ability = fg.get('spellcastAbility') as Stat | undefined;
  const mode = fg.get('spellsKnownMode') as SpellsKnownMode | undefined;
  const hasCantrips = !!fg.get('hasCantrips');

  const placed = featuresPlaced(levels.features);
  const empty = emptyLevels(levels.features);
  const featuresOk = placed > 0 && empty.length === 0;

  const casterSummary = () => {
    if (casterType === undefined || casterType === CasterType.None) return 'Non-caster · no spell slots';
    const card = CASTER_CARDS.find(c => c.type === casterType);
    const modeLabel = SPELLS_KNOWN_MODES.find(m => m.mode === mode)?.label ?? 'Fixed number';
    const abilityLabel = ability !== undefined ? STAT_FULL[ability] : 'no ability picked';
    return `${card?.title ?? '?'}-caster · ${abilityLabel} · ${modeLabel} · ${hasCantrips ? 'cantrips' : 'no cantrips'}`;
  };

  return [
    {
      step: WizardStep.Identity,
      ok: stepStatus(WizardStep.Identity, fg, levels) === 'complete',
      title: 'Identity',
      summary: `${name || 'Unnamed class'} · ${hitDie ? `d${hitDie}` : 'no'} hit die · ${primary.length ? primary.join(' & ') : 'no primary ability'}`,
      action: 'edit',
    },
    {
      step: WizardStep.Proficiencies,
      ok: stepStatus(WizardStep.Proficiencies, fg, levels) === 'complete',
      title: 'Proficiencies',
      summary: `${armor.length ? armor.join(', ') : 'no armor'} · ${weapons.length ? weapons.join(' & ') : 'no weapons'} · saves: ${saves.length ? saves.join(', ') : 'none'} · ${skillNum} of ${skillOpts.length} skills`,
      action: 'edit',
    },
    {
      step: WizardStep.Equipment,
      ok: stepStatus(WizardStep.Equipment, fg, levels) === 'complete',
      title: 'Starting equipment',
      summary: `${equipChoices.length} choice row(s) + fixed kit: ${kit.length ? kit.join(', ') : 'empty'}`,
      action: 'edit',
    },
    {
      step: WizardStep.Features,
      ok: featuresOk,
      title: featuresOk
        ? `Features — ${placed} placed`
        : `Features — ${placed} placed, ${empty.length} level(s) empty`,
      summary: featuresOk
        ? `${placed} feature${placed === 1 ? '' : 's'} across 20 levels`
        : `Levels ${formatLevelList(empty)} need at least one feature each`,
      action: featuresOk ? 'edit' : 'fix',
    },
    {
      step: WizardStep.Spellcasting,
      ok: stepStatus(WizardStep.Spellcasting, fg, levels) === 'complete',
      title: 'Spellcasting',
      summary: casterSummary(),
      action: 'edit',
    },
  ];
}

// ---------------------------------------------------------------------------
// Draft autosave

export const DRAFT_VERSION = 1;

export const draftKey = (editName?: string): string =>
  `hb:classDraft:${(editName ?? '').trim().toLowerCase() || 'new'}`;

/** Every ClassForm field that round-trips through a draft (classLevels/subclasses excluded — the
 *  levels store is serialized separately and subclasses are not edited by this wizard). */
export const DRAFT_FORM_KEYS = [
  'name', 'description', 'hitDie', 'primaryStat', 'savingThrows',
  'armorProficiencies', 'weaponProficiencies', 'toolProficiencies',
  'armorStart', 'weaponStart', 'itemStart',
  'armorProfChoices', 'weaponProfChoices', 'toolProfChoices',
  'skills', 'skillChoiceNum', 'skillChoices',
  'startingEquipment', 'equipmentChoices',
  'spellCasting', 'castingStat', 'casterType',
  'classSpecificValues', 'metadataSubclassLevels', 'metadataSubclassName', 'metadataSubclassPos',
  'spellcastName', 'spellsKnownCalc', 'spellsKnownMode', 'spellcastAbility',
  'spellsKnownRoundup', 'spellsInfo', 'spellsLevel', 'hasCantrips',
] as const satisfies readonly (keyof ClassForm)[];

export interface WizardDraft {
  v: number;
  form: Partial<ClassForm>;
  levels: WizardLevels;
  step: WizardStep;
}

export function serializeDraft(fg: FormGroup<ClassForm>, levels: WizardLevels, step: WizardStep): string {
  const form: Record<string, unknown> = {};
  DRAFT_FORM_KEYS.forEach(key => { form[key] = fg.get(key); });
  return JSON.stringify({ v: DRAFT_VERSION, form, levels, step } satisfies WizardDraft);
}

export function parseDraft(raw: string | null): WizardDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as WizardDraft;
    if (draft?.v !== DRAFT_VERSION || typeof draft.form !== 'object' || !draft.form) return null;
    return {
      ...draft,
      levels: { ...emptyWizardLevels(), ...(draft.levels ?? {}) },
      step: WIZARD_STEPS.includes(draft.step) ? draft.step : WizardStep.Identity,
    };
  } catch {
    return null;
  }
}

export function hydrateDraft(fg: FormGroup<ClassForm>, draft: WizardDraft): void {
  DRAFT_FORM_KEYS.forEach(key => {
    if (key in draft.form) fg.set(key, (draft.form as Record<string, unknown>)[key] as never);
  });
}

/** localStorage access that tolerates environments where the API is missing or restricted
 *  (private-mode quota errors, partial test stubs). Failures degrade to "no draft". */
export const draftStorage = {
  read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  write(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      console.warn('Class draft autosave failed', err);
      return false;
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* nothing to clean up */
    }
  },
};

// ---------------------------------------------------------------------------
// Step component contract (every step receives the same props; unused ones are ignored)

export interface StepProps {
  formGroup: FormGroup<ClassForm>;
  levels: WizardLevels;
  setLevels: SetStoreFunction<WizardLevels>;
  goToStep: (step: WizardStep) => void;
  /** Opens the shared FeaturesPopup in "add" mode targeting the given level. */
  openAddFeature: (level: number) => void;
  /** Opens the shared FeaturesPopup in "edit" mode for an existing feature at the given level. */
  openEditFeature: (level: number, feature: FeatureDetail) => void;
  /** Review step only: validate + save to homebrewManager. */
  publish: () => void | Promise<void>;
}
