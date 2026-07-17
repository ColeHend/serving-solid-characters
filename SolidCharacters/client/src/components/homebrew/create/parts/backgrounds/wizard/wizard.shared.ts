import type { FormGroup } from 'coles-solid-library';
import type { SetStoreFunction } from 'solid-js/store';
import { Background, Feat, FeatureDetail, StartingEquipment } from '../../../../../../models/generated';
import { createNewId } from '../../../../../../shared/customHooks/utility/tools/idGen';
import {
  draftStorage,
  toggleInArray,
  type StepMeta,
  type StepStatus,
} from '../../classes/wizard/wizard.shared';
import { ARMOR, SKILLS, TOOLS, WEAPONS } from '../constants';

// Shared (non-JSX) types, constants and pure helpers for the background-creation wizard.
// Mirrors the class/subclass wizards' wizard.shared.ts; the generic draft/toggle helpers
// are imported from the class wizard so the three wizards can never drift on them.

export { draftStorage, toggleInArray, ARMOR, SKILLS, TOOLS, WEAPONS };
export type { StepMeta, StepStatus };

export interface BackgroundForm {
  name: string;
  desc: string;
  /** Provenance label, e.g. "My Campaign"; empty/undefined = plain homebrew. */
  source?: string;
  /** Selected origin feat's SRD id — '' = none. */
  feat: string;
  /** Ability score display names the background offers (2024-style), max 3. */
  abilityOptions: string[];
  /** Language options the background offers. */
  languages: string[];
  /** How many of the offered languages a player picks. */
  langChoiceAmount: number;
  armorProfs: string[];
  weaponProfs: string[];
  toolProfs: string[];
  skillProfs: string[];
}

// ---------------------------------------------------------------------------
// Extras store (structured collections that don't fit flat FormGroup fields —
// the backgrounds analogue of the class wizard's WizardLevels store)

export type Currency = 'PP' | 'GP' | 'EP' | 'SP' | 'CP';

export const CURRENCIES: Currency[] = ['PP', 'GP', 'EP', 'SP', 'CP'];

export const CURRENCY_NAMES: Record<Currency, string> = {
  PP: 'Platinum',
  GP: 'Gold',
  EP: 'Electrum',
  SP: 'Silver',
  CP: 'Copper',
};

/** One starting-equipment option group ("A", "B", …): items plus starting coin. */
export interface EquipmentGroup {
  /** Option-key label the persisted StartingEquipment carries (its optionKeys entry). */
  key: string;
  items: string[];
  currency: Record<Currency, number>;
}

export interface BackgroundExtras {
  equipment: EquipmentGroup[];
  /** Flat feature list — backgrounds have no levels. */
  features: FeatureDetail[];
}

export const emptyCurrency = (): Record<Currency, number> => ({ PP: 0, GP: 0, EP: 0, SP: 0, CP: 0 });

export const emptyExtras = (): BackgroundExtras => ({ equipment: [], features: [] });

export const groupHasContent = (group: EquipmentGroup): boolean =>
  group.items.length > 0 || CURRENCIES.some(c => (group.currency[c] ?? 0) > 0);

// ---------------------------------------------------------------------------
// Steps

export enum BackgroundWizardStep {
  Identity = 0,
  AbilitiesFeat = 1,
  ProficienciesLanguages = 2,
  Equipment = 3,
  Features = 4,
  Review = 5,
}

export const BACKGROUND_STEPS: BackgroundWizardStep[] = [
  BackgroundWizardStep.Identity,
  BackgroundWizardStep.AbilitiesFeat,
  BackgroundWizardStep.ProficienciesLanguages,
  BackgroundWizardStep.Equipment,
  BackgroundWizardStep.Features,
  BackgroundWizardStep.Review,
];

export const STEP_META: Record<BackgroundWizardStep, StepMeta> = {
  [BackgroundWizardStep.Identity]: {
    label: 'Identity',
    question: 'Where do they come from?',
    subtitle: 'A name and the story behind it. You can change all of this later.',
  },
  [BackgroundWizardStep.AbilitiesFeat]: {
    label: 'Abilities & Feat',
    question: 'What did their past hone?',
    subtitle: '2024-style backgrounds offer up to three ability scores and an origin feat — leave both empty for a 2014-style background.',
  },
  [BackgroundWizardStep.ProficienciesLanguages]: {
    label: 'Proficiencies',
    question: 'What did they learn along the way?',
    subtitle: 'Tap to toggle skills and tools; add the languages the background offers.',
  },
  [BackgroundWizardStep.Equipment]: {
    label: 'Equipment',
    question: 'What do they carry?',
    subtitle: 'Build option groups on the left; pull items from the compendium on the right.',
  },
  [BackgroundWizardStep.Features]: {
    label: 'Features',
    question: 'What doors does it open?',
    subtitle: 'Optional features the background grants — a contact, a sanctuary, a trade.',
  },
  [BackgroundWizardStep.Review]: {
    label: 'Review',
    question: 'Ready to publish?',
    subtitle: 'Check the summary. You can publish and refine later — drafts stay editable.',
  },
};

// ---------------------------------------------------------------------------
// Option data

export const ALL_ABILITIES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];

export const MAX_ABILITY_OPTIONS = 3;

export const LANGUAGES = [
  'Common',
  'Undercommon',
  'Abyssal',
  'Infernal',
  'Celestial',
  'Primordial',
  'Draconic',
  'Dwarvish',
  'Elvish',
  'Giant',
  'Gnomish',
  'Goblin',
  'Halfling',
  'Orc',
  'Sylvan',
  'Deep Speech',
];

export const featLabel = (feats: Feat[], featId: string): string =>
  feats.find(f => f.id === featId)?.details.name ?? '';

// ---------------------------------------------------------------------------
// Currency encoding — coins are persisted as "5gp"-style strings appended to a
// group's items list (what BackgroundView and character creation consume).

const CURRENCY_RE = /^(\d+)\s*(pp|gp|ep|sp|cp)$/i;

export const encodeCurrency = (currency: Record<Currency, number>): string[] =>
  CURRENCIES.filter(c => (currency[c] ?? 0) > 0).map(c => `${currency[c]}${c.toLowerCase()}`);

/** Inverse of encodeCurrency for prefill: split a persisted items list into plain items + coin values. */
export function splitItemsCurrency(items: string[] | undefined): { items: string[]; currency: Record<Currency, number> } {
  const currency = emptyCurrency();
  const plain: string[] = [];
  (items ?? []).forEach(raw => {
    const entry = (raw ?? '').trim();
    if (!entry) return;
    const match = entry.match(CURRENCY_RE);
    if (match) currency[match[2].toUpperCase() as Currency] = +match[1];
    else plain.push(entry);
  });
  return { items: plain, currency };
}

/** Persisted startEquipment groups → editable store groups. */
export const toEquipmentGroups = (startEquipment?: StartingEquipment[]): EquipmentGroup[] =>
  (startEquipment ?? []).map(group => {
    const { items, currency } = splitItemsCurrency(group.items);
    return { key: group.optionKeys?.join(', ') ?? '', items, currency };
  });

/** Persisted features → store, stamping ids so FeatureRow/FeaturesPopup edits have stable identity. */
export const hydrateFeatures = (features?: FeatureDetail[]): FeatureDetail[] =>
  (features ?? []).map(f => ({ ...f, id: f.id || createNewId() }));

// ---------------------------------------------------------------------------
// Persistence assembly

export function toBackground(fg: FormGroup<BackgroundForm>, extras: BackgroundExtras, existingId?: string): Background {
  const source = ((fg.get('source') as string) || '').trim();
  return {
    id: existingId || createNewId(),
    name: ((fg.get('name') as string) || '').trim(),
    ...(source ? { source } : {}),
    desc: (fg.get('desc') as string) || '',
    proficiencies: {
      armor: (fg.get('armorProfs') as string[]) ?? [],
      weapons: (fg.get('weaponProfs') as string[]) ?? [],
      tools: (fg.get('toolProfs') as string[]) ?? [],
      skills: (fg.get('skillProfs') as string[]) ?? [],
    },
    startEquipment: extras.equipment.filter(groupHasContent).map(group => ({
      optionKeys: [group.key],
      items: [...group.items, ...encodeCurrency(group.currency)],
    })),
    abilityOptions: (fg.get('abilityOptions') as string[]) ?? [],
    feat: (fg.get('feat') as string) || undefined,
    languages: {
      options: (fg.get('languages') as string[]) ?? [],
      amount: (fg.get('langChoiceAmount') as number) || 0,
    },
    features: extras.features,
  };
}

// ---------------------------------------------------------------------------
// Step status + review rows

export function stepStatus(step: BackgroundWizardStep, fg: FormGroup<BackgroundForm>, extras: BackgroundExtras): StepStatus {
  switch (step) {
  case BackgroundWizardStep.Identity:
    return ((fg.get('name') as string) || '').trim().length > 0 ? 'complete' : 'incomplete';
  case BackgroundWizardStep.AbilitiesFeat:
    // Lenient: 2014-style backgrounds legitimately have neither.
    return ((fg.get('abilityOptions') as string[])?.length ?? 0) > 0 || !!fg.get('feat')
      ? 'complete' : 'incomplete';
  case BackgroundWizardStep.ProficienciesLanguages: {
    const any = ((fg.get('skillProfs') as string[])?.length ?? 0) > 0
      || ((fg.get('toolProfs') as string[])?.length ?? 0) > 0
      || ((fg.get('armorProfs') as string[])?.length ?? 0) > 0
      || ((fg.get('weaponProfs') as string[])?.length ?? 0) > 0
      || ((fg.get('languages') as string[])?.length ?? 0) > 0;
    return any ? 'complete' : 'incomplete';
  }
  case BackgroundWizardStep.Equipment:
    return extras.equipment.some(groupHasContent) ? 'complete' : 'incomplete';
  case BackgroundWizardStep.Features:
    return extras.features.length > 0 ? 'complete' : 'incomplete';
  default:
    return 'incomplete';
  }
}

export interface BackgroundReviewRow {
  step: BackgroundWizardStep;
  ok: boolean;
  title: string;
  summary: string;
  detail?: string;
  action: 'edit' | 'fix';
}

export function buildReviewRows(
  fg: FormGroup<BackgroundForm>,
  extras: BackgroundExtras,
  /** Display name of the chosen origin feat (the Review step resolves it from the feat catalog). */
  featName?: string,
): BackgroundReviewRow[] {
  const name = ((fg.get('name') as string) || '').trim();
  const desc = ((fg.get('desc') as string) || '').trim();
  const abilities = (fg.get('abilityOptions') as string[]) ?? [];
  const skills = (fg.get('skillProfs') as string[]) ?? [];
  const otherProfs = [
    ...((fg.get('toolProfs') as string[]) ?? []),
    ...((fg.get('armorProfs') as string[]) ?? []),
    ...((fg.get('weaponProfs') as string[]) ?? []),
  ];
  const languages = (fg.get('languages') as string[]) ?? [];
  const langAmount = (fg.get('langChoiceAmount') as number) || 0;
  const groups = extras.equipment.filter(groupHasContent);
  const features = extras.features;

  const status = (step: BackgroundWizardStep) => stepStatus(step, fg, extras) === 'complete';

  return [
    {
      step: BackgroundWizardStep.Identity,
      ok: status(BackgroundWizardStep.Identity),
      title: 'Identity',
      summary: `${name || 'Unnamed background'} · ${desc ? 'described' : 'no description yet'}`,
      action: 'edit',
    },
    {
      step: BackgroundWizardStep.AbilitiesFeat,
      ok: status(BackgroundWizardStep.AbilitiesFeat),
      title: 'Abilities & feat',
      summary: `${abilities.length ? abilities.join(' / ') : 'no ability options'} · ${featName || 'no origin feat'}`,
      action: 'edit',
    },
    {
      step: BackgroundWizardStep.ProficienciesLanguages,
      ok: status(BackgroundWizardStep.ProficienciesLanguages),
      title: 'Proficiencies & languages',
      summary: `skills: ${skills.length ? skills.join(', ') : 'none'} · other: ${otherProfs.length ? otherProfs.join(', ') : 'none'} · languages: ${languages.length ? languages.join(', ') : 'none'}${langAmount ? ` (choose ${langAmount})` : ''}`,
      action: 'edit',
    },
    {
      step: BackgroundWizardStep.Equipment,
      ok: status(BackgroundWizardStep.Equipment),
      title: `Starting equipment — ${groups.length} option group${groups.length === 1 ? '' : 's'}`,
      summary: groups.length
        ? groups.map(g => `${g.key || '?'}: ${[...g.items, ...encodeCurrency(g.currency)].join(', ')}`).join(' · ')
        : 'No equipment groups yet.',
      action: 'edit',
    },
    {
      step: BackgroundWizardStep.Features,
      ok: status(BackgroundWizardStep.Features),
      title: `Features — ${features.length} added`,
      summary: features.length
        ? features.map(f => f.name).join(', ')
        : 'No features yet — most backgrounds grant one.',
      action: 'edit',
    },
  ];
}

// ---------------------------------------------------------------------------
// Draft autosave

export const DRAFT_VERSION = 1;

/** Keyed by the ?name= edit target only — a new background always drafts under ':new'
 *  so typing a name never spawns per-keystroke orphan drafts (mirrors the class wizard). */
export const backgroundDraftKey = (editName?: string): string =>
  `hb:backgroundDraft:${(editName ?? '').trim().toLowerCase() || 'new'}`;

export const DRAFT_FORM_KEYS = [
  'name', 'desc', 'source', 'feat', 'abilityOptions',
  'languages', 'langChoiceAmount',
  'armorProfs', 'weaponProfs', 'toolProfs', 'skillProfs',
] as const satisfies readonly (keyof BackgroundForm)[];

export interface BackgroundWizardDraft {
  v: number;
  form: Partial<BackgroundForm>;
  extras: BackgroundExtras;
  step: BackgroundWizardStep;
}

export function serializeDraft(fg: FormGroup<BackgroundForm>, extras: BackgroundExtras, step: BackgroundWizardStep): string {
  const form: Record<string, unknown> = {};
  DRAFT_FORM_KEYS.forEach(key => { form[key] = fg.get(key); });
  return JSON.stringify({ v: DRAFT_VERSION, form, extras, step } satisfies BackgroundWizardDraft);
}

export function parseDraft(raw: string | null): BackgroundWizardDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as BackgroundWizardDraft;
    if (draft?.v !== DRAFT_VERSION || typeof draft.form !== 'object' || !draft.form) return null;
    return {
      ...draft,
      extras: { ...emptyExtras(), ...(draft.extras ?? {}) },
      step: BACKGROUND_STEPS.includes(draft.step) ? draft.step : BackgroundWizardStep.Identity,
    };
  } catch {
    return null;
  }
}

export function hydrateDraft(fg: FormGroup<BackgroundForm>, draft: BackgroundWizardDraft): void {
  DRAFT_FORM_KEYS.forEach(key => {
    if (!(key in draft.form)) return;
    fg.set(key, (draft.form as Record<string, unknown>)[key] as never);
  });
}

// ---------------------------------------------------------------------------
// Step component contract (every step receives the same props; unused ones are ignored)

export interface StepProps {
  formGroup: FormGroup<BackgroundForm>;
  extras: BackgroundExtras;
  setExtras: SetStoreFunction<BackgroundExtras>;
  /** Origin-feat options (SRD feats without prerequisites) for the Abilities & Feat step. */
  originFeats: () => Feat[];
  goToStep: (step: BackgroundWizardStep) => void;
  /** Opens the shared FeaturesPopup in "add" mode. */
  openAddFeature: () => void;
  /** Opens the shared FeaturesPopup in "edit" mode for an existing feature. */
  openEditFeature: (feature: FeatureDetail) => void;
  /** Review step only: validate + save to homebrewManager. */
  publish: () => void | Promise<void>;
}
