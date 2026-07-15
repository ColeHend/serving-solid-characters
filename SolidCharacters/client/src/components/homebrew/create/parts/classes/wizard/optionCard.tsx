import { Component, Show } from 'solid-js';
import styles from './classesWizard.module.scss';

interface OptionCardProps {
  title: string;
  subtitle?: string;
  selected: boolean;
  onSelect: () => void;
  /** Show a ✓ badge in the top-right corner when selected (caster-type cards). */
  badge?: boolean;
  /** Left-align content (caster-type cards); default is centered (hit-die cards). */
  alignStart?: boolean;
}

export const OptionCard: Component<OptionCardProps> = (props) => {
  return (
    <button
      type="button"
      class={`${styles.optionCard} ${props.selected ? styles.optionCardOn : ''} ${props.alignStart ? styles.optionCardStart : ''}`}
      aria-pressed={props.selected}
      onClick={() => props.onSelect()}
    >
      <Show when={props.badge && props.selected}>
        <span class={styles.optionBadge}>✓</span>
      </Show>
      <span class={styles.optionTitle}>{props.title}</span>
      <Show when={props.subtitle}>
        <span class={styles.optionSub}>{props.subtitle}</span>
      </Show>
    </button>
  );
};
