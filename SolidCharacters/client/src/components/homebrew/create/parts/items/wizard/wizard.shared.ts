import type { StepMeta, StepStatus } from '../../classes/wizard/wizard.shared';
import type { DraftItem, DraftKind } from '../itemsStore';

// Shared (non-JSX) types, constants and pure helpers for the items-creation wizard.
// Mirrors the subclass wizard's wizard.shared.ts; unlike the other creators the form
// state lives in the itemsStore singleton, so everything here is pure over
// (DraftItem, errors[]) snapshots and stays unit-testable without the store.

export type { StepMeta, StepStatus };

// ---------------------------------------------------------------------------
// Steps

export enum ItemsWizardStep {
  Identity = 0,
  Details = 1,
  Features = 2,
  Review = 3,
}

export const ITEM_STEPS: ItemsWizardStep[] = [
  ItemsWizardStep.Identity,
  ItemsWizardStep.Details,
  ItemsWizardStep.Features,
  ItemsWizardStep.Review,
];

export const STEP_META: Record<ItemsWizardStep, StepMeta> = {
  [ItemsWizardStep.Identity]: {
    label: 'Identity',
    question: 'What are you forging?',
    subtitle: 'Load an existing item to tweak, or start fresh. Name it, pick what kind of thing it is, and set its cost and weight.',
  },
  [ItemsWizardStep.Details]: {
    label: 'Details',
    question: 'What are its stats?',
    subtitle: 'Weapons list damage and range, armor lists AC and requirements — plain gear has neither.',
  },
  [ItemsWizardStep.Features]: {
    label: 'Features',
    question: 'Does it do anything special?',
    subtitle: 'Add features for magical effects, activated abilities or extra rules text. Optional — plenty of items are just gear.',
  },
  [ItemsWizardStep.Review]: {
    label: 'Review',
    question: 'Ready to forge it?',
    subtitle: 'Check the summary. You can save now and refine later — homebrew stays editable.',
  },
};

// ---------------------------------------------------------------------------
// Option data

export interface KindCard {
  kind: DraftKind;
  title: string;
  sub: string;
}

export const KIND_CARDS: KindCard[] = [
  { kind: 'Item', title: 'Item', sub: 'Adventuring gear, tools, consumables — no combat statistics.' },
  { kind: 'Weapon', title: 'Weapon', sub: 'Deals damage — dice, damage types and range.' },
  { kind: 'Armor', title: 'Armor', sub: 'Grants AC — category, Dex rules and strength requirements.' },
];

export const BUILT_IN_TAGS = [
  'Versatile',
  'Ammunition',
  'Loading',
  'Light',
  'Two-Handed',
  'Finesse',
  'Thrown',
  'Monk',
  'Heavy',
  'Reach',
  'Special',
  'Consumable',
];

// ---------------------------------------------------------------------------
// Step status (derived from the store's validate() messages)

/** Buckets itemsStore.errors() strings onto the step that can fix them, keyed off the
 *  stable message prefixes in itemsStore.validate() ('name:', 'cost', 'weapon.', …). */
export function errorsForStep(step: ItemsWizardStep, errs: string[]): string[] {
  switch (step) {
  case ItemsWizardStep.Identity:
    return errs.filter(e => e.startsWith('name:') || e.startsWith('cost'));
  case ItemsWizardStep.Details:
    return errs.filter(e => e.startsWith('weapon.') || e.startsWith('armor.'));
  case ItemsWizardStep.Features:
    return errs.filter(e => e.startsWith('features:'));
  default:
    return [];
  }
}

export function itemStepStatus(
  step: ItemsWizardStep,
  form: DraftItem | null,
  errs: string[],
  visited: ReadonlySet<ItemsWizardStep>,
): StepStatus {
  if (!form) return 'incomplete';
  switch (step) {
  case ItemsWizardStep.Identity:
    if (!form.name.trim()) return 'incomplete';
    return errorsForStep(step, errs).length ? 'warning' : 'complete';
  case ItemsWizardStep.Details:
    // Seeded weapon/armor defaults aren't "filled out" and plain gear has no Details
    // content at all, so an actual visit is the gate; errors still take precedence.
    if (errorsForStep(step, errs).length) return 'warning';
    return visited.has(ItemsWizardStep.Details) ? 'complete' : 'incomplete';
  case ItemsWizardStep.Features:
    // Features are optional; checked once visited or a feature has actually been added.
    if (errorsForStep(step, errs).length) return 'warning';
    return visited.has(ItemsWizardStep.Features) || form.features.length > 0
      ? 'complete' : 'incomplete';
  default:
    // Review lights up only when the item is publishable.
    return errs.length === 0 ? 'complete' : 'incomplete';
  }
}

// ---------------------------------------------------------------------------
// Review rows

export interface ItemReviewRow {
  step: ItemsWizardStep;
  ok: boolean;
  title: string;
  summary: string;
  detail?: string;
  action: 'edit' | 'fix';
}

const detailsSummary = (form: DraftItem): string => {
  if (form.kind === 'Weapon') {
    const dmg = (form.damage ?? [])
      .map(d => `${d.dice}${d.bonus ? `+${d.bonus}` : ''} ${d.type}`.trim())
      .join(', ') || 'no damage entries';
    const range = form.range?.normal
      ? ` · range ${form.range.normal}${form.range.long ? `/${form.range.long}` : ''}`
      : '';
    return `${form.weaponCategory || 'Weapon'} · ${dmg}${range}`;
  }
  if (form.kind === 'Armor') {
    const ac = form.armorClass;
    const acTxt = ac
      ? `AC ${ac.base}${ac.dexBonus ? ` + Dex${ac.maxBonus ? ` (max ${ac.maxBonus})` : ''}` : ''}`
      : 'no AC set';
    const extras = [
      form.strMin ? `Str ${form.strMin}` : '',
      form.stealthDisadvantage ? 'stealth disadvantage' : '',
    ].filter(Boolean).join(' · ');
    return `${form.armorCategory || 'Armor'} · ${acTxt}${extras ? ` · ${extras}` : ''}`;
  }
  return 'Plain gear — no combat statistics';
};

export function buildItemReviewRows(form: DraftItem | null, errs: string[]): ItemReviewRow[] {
  if (!form) return [];
  const identityErrs = errorsForStep(ItemsWizardStep.Identity, errs);
  const detailErrs = errorsForStep(ItemsWizardStep.Details, errs);
  const featureErrs = errorsForStep(ItemsWizardStep.Features, errs);
  const name = form.name.trim();
  // Tags are weapon/armor keywords — plain gear doesn't carry them.
  const tagsTxt = form.kind === 'Item'
    ? ''
    : ` · ${form.tags.length ? `${form.tags.length} tag${form.tags.length === 1 ? '' : 's'}` : 'no tags'}`;

  return [
    {
      step: ItemsWizardStep.Identity,
      ok: !!name && identityErrs.length === 0,
      title: 'Identity',
      summary: `${name || 'Unnamed item'} · ${form.kind} · ${form.cost.quantity} ${form.cost.unit}${form.weight ? ` · ${form.weight} lb` : ''}`,
      detail: identityErrs[0],
      action: name && !identityErrs.length ? 'edit' : 'fix',
    },
    {
      step: ItemsWizardStep.Details,
      ok: detailErrs.length === 0,
      title: 'Details',
      summary: `${detailsSummary(form)}${tagsTxt}`,
      detail: detailErrs[0],
      action: detailErrs.length ? 'fix' : 'edit',
    },
    {
      step: ItemsWizardStep.Features,
      ok: featureErrs.length === 0,
      title: `Features — ${form.features.length}`,
      summary: form.features.length
        ? form.features.map(f => f.name).join(', ')
        : 'No features — plenty of items are just gear.',
      detail: featureErrs[0],
      action: featureErrs.length ? 'fix' : 'edit',
    },
  ];
}

// ---------------------------------------------------------------------------
// Step component contract (steps read/write the itemsStore singleton directly,
// like the sections they replaced; only navigation and modal hooks come in as props)

export interface StepProps {
  goToStep: (step: ItemsWizardStep) => void;
  /** Identity step's loader Select: load an SRD/homebrew item ('__new__' starts blank). */
  selectExisting: (name: string) => void;
  /** Opens the shared item-feature modal in "add" mode. */
  openAddFeature: () => void;
  /** Opens the shared item-feature modal editing features[index]. */
  openEditFeature: (index: number) => void;
  /** Review step / footer: validate + save through itemsStore.persist(). */
  publish: () => void;
}

// Extension point for a future draftStorage autosave (subclass-wizard style). Deliberately
// not wired yet: the Select-driven load model rewrites the whole form on every select(),
// so autosave needs baseline resets on select/selectNew/persist before it can land.
// export const itemsDraftKey = (editName?: string) => `hb:itemDraft:${(editName ?? '').trim().toLowerCase() || 'new'}`;
