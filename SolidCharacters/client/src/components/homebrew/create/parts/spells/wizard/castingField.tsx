import { Component, For, Show, createSignal, runWithOwner } from 'solid-js';
import { Input, Option, Select } from 'coles-solid-library';
import { ToggleChip } from '../../classes/wizard/toggleChip';
import styles from '../../classes/wizard/classesWizard.module.scss';

// One casting property (casting time / range / duration): a Select over values harvested
// from the spell catalog, with a Custom toggle that swaps in a free-text Input.

interface CastingFieldProps {
  label: string;
  value: () => string;
  options: () => string[];
  onCommit: (value: string) => void;
}

export const CastingField: Component<CastingFieldProps> = (props) => {
  const [forceCustom, setForceCustom] = createSignal(false);
  // Derived, not stored: a prefilled/resumed value that isn't in the preset list renders
  // as custom automatically, with no toggle state to persist.
  const isCustom = () => forceCustom() || (!!props.value() && !props.options().includes(props.value()));

  const toggleCustom = () => {
    if (isCustom()) {
      // Back to presets: a non-preset value can't display in the Select, so clear it.
      if (!props.options().includes(props.value())) props.onCommit('');
      setForceCustom(false);
    } else {
      setForceCustom(true);
    }
  };

  return (
    <div class={styles.boxedField}>
      <span class={styles.cardLabel}>{props.label}</span>
      <Show
        when={isCustom()}
        fallback={
          <Select
            transparent
            value={props.value()}
            // coles Select fires onChange from a tracked effect; detach so the form write
            // can't be captured by that scope, and bail on same-value echoes.
            onChange={(value) => runWithOwner(null, () => {
              if (value === props.value()) return;
              props.onCommit(value);
            })}
          >
            <For each={props.options()}>{(option) => <Option value={option}>{option}</Option>}</For>
          </Select>
        }
      >
        <Input
          value={props.value()}
          onChange={(e) => props.onCommit(e.currentTarget.value)}
          placeholder={`Custom ${props.label.toLowerCase()}...`}
        />
      </Show>
      <div class={styles.chipRow}>
        <ToggleChip label="Custom" selected={isCustom()} onToggle={toggleCustom} />
      </div>
    </div>
  );
};
