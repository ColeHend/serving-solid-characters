import { Component, Show } from 'solid-js';
import styles from './classesWizard.module.scss';

interface ToggleChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const ToggleChip: Component<ToggleChipProps> = (props) => {
  return (
    <button
      type="button"
      class={`${styles.chip} ${props.selected ? styles.chipOn : ''}`}
      aria-pressed={props.selected}
      disabled={props.disabled}
      onClick={() => props.onToggle()}
    >
      <span>{props.label}</span>
      <Show when={props.selected}>
        <span class={styles.chipCheck}>✓</span>
      </Show>
    </button>
  );
};
