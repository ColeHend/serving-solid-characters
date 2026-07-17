import { Component, For, Show } from 'solid-js';
import { ToggleChip } from '../../classes/wizard/toggleChip';
import { StepProps, toggleInArray } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Step 3 of the spell wizard: which classes get this spell on their list.
export const StepClasses: Component<StepProps> = (props) => {
  const selected = () => (props.formGroup.get('classes') as string[]) ?? [];

  return (
    <div class={styles.card}>
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Classes that learn this spell</span>
        <div class={styles.chipRow}>
          <For each={props.classNames()}>{(name) => (
            <ToggleChip
              label={name}
              selected={selected().includes(name)}
              onToggle={() => props.formGroup.set('classes', toggleInArray(selected(), name))}
            />
          )}</For>
        </div>
        <Show when={selected().length === 0}>
          <div class={styles.banner}>
            No classes selected — the spell will exist, but no class list offers it by default.
          </div>
        </Show>
      </div>
    </div>
  );
};
