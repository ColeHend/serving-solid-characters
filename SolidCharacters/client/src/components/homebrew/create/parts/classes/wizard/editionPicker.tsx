import { Component } from 'solid-js';
import { SegmentedToggle } from '../../../../../../shared/components/modals/rulesDictionary/segmentedToggle';
import {
  EditionKey,
  editionToLegacy,
  legacyToEdition,
} from '../../../../../../shared/customHooks/dndInfo/info/edition';

// Shared across every homebrew Identity step (classes/races/items/feats/spells/backgrounds).
// Reuses the dictionary's SegmentedToggle radiogroup and owns the tri-state ⇄ `legacy` mapping
// so the mapping lives in exactly one place. "Both" stores an undefined (neutral) legacy.
const EDITIONS: { key: EditionKey; label: string }[] = [
  { key: '2014', label: '2014 (Legacy)' },
  { key: '2024', label: '2024' },
  { key: 'both', label: 'Both' },
];

export const EditionPicker: Component<{
  /** The entity's `legacy` field: true = 2014, false = 2024, undefined = Both/neutral. */
  value: boolean | undefined;
  onChange: (legacy: boolean | undefined) => void;
  ariaLabel?: string;
  class?: string;
}> = (props) => (
  <SegmentedToggle
    options={EDITIONS}
    value={legacyToEdition(props.value)}
    onChange={(k) => props.onChange(editionToLegacy(k as EditionKey))}
    ariaLabel={props.ariaLabel ?? 'Edition'}
    class={props.class}
  />
);
