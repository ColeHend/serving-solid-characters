import { Component, For } from 'solid-js';
import { Input } from 'coles-solid-library';
import { SIZES, StepProps, toggleInArray } from './wizard.shared';
import { ToggleChip } from '../../classes/wizard/toggleChip';
import { CustomEntryInput } from '../../classes/wizard/customEntryInput';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Step 1 of the race wizard: name, size and speed in one card.
export const StepIdentity: Component<StepProps> = (props) => {
  const sizes = () => (props.formGroup.get('size') as string[]) ?? [];

  // Union of the canonical size tokens with any already-stored custom sizes
  // (prefilled SRD/homebrew data), so unknown values still show as chips.
  const sizeOptions = () => [...SIZES, ...sizes().filter(s => !SIZES.includes(s))];

  const addCustomSize = (text: string) => {
    if (sizes().includes(text)) return;
    props.formGroup.set('size', [...sizes(), text]);
  };

  return (
    <div class={styles.card}>
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Race name</span>
        <Input
          value={props.formGroup.get('name') ?? ''}
          onChange={(e) => props.formGroup.set('name', e.currentTarget.value)}
          placeholder="Enter race name..."
        />
      </div>

      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Size — most races are one; pick several for variable sizes</span>
        <div class={styles.chipRow}>
          <For each={sizeOptions()}>{(size) => (
            <ToggleChip
              label={size}
              selected={sizes().includes(size)}
              onToggle={() => props.formGroup.set('size', toggleInArray(sizes(), size))}
            />
          )}</For>
          <CustomEntryInput onCommit={addCustomSize} placeholder="e.g. Medium (about 4 feet)" />
        </div>
      </div>

      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Walking speed (feet)</span>
        <Input
          type="number"
          min={0}
          value={(props.formGroup.get('speed') as number) ?? 30}
          onInput={(e) => props.formGroup.set('speed', Math.max(0, +e.currentTarget.value || 0))}
        />
      </div>
    </div>
  );
};
