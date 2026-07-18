import { Component, For, Show, runWithOwner } from 'solid-js';
import { Input, Option, Select } from 'coles-solid-library';
import { SIZES, StepProps, toggleInArray } from './wizard.shared';
import { ToggleChip } from '../../classes/wizard/toggleChip';
import { CustomEntryInput } from '../../classes/wizard/customEntryInput';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Step 1 of the subrace wizard: parent race, name, size and speed in one card.
export const StepIdentity: Component<StepProps> = (props) => {
  const sizes = () => (props.formGroup.get('size') as string[]) ?? [];

  // Union of the canonical size tokens with any already-stored custom sizes
  // (prefilled homebrew data), so unknown values still show as chips.
  const sizeOptions = () => [...SIZES, ...sizes().filter(s => !SIZES.includes(s))];

  const addCustomSize = (text: string) => {
    if (sizes().includes(text)) return;
    props.formGroup.set('size', [...sizes(), text]);
  };

  return (
    <div class={styles.card}>
      {/* 1. Parent race — options are keyed by selector key (not name) so same-named races
             from different rulesets (2014/2024 Elf) stay distinct; labels carry the version. */}
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Parent race — which race is this a lineage of?</span>
        <Select
          transparent
          value={props.formGroup.get('parentRaceKey') ?? ''}
          // coles Select fires onChange from a tracked effect; detach so the form write
          // (and everything reacting to it) can't be captured by that scope.
          onChange={(key) => runWithOwner(null, () => {
            // The Select can echo onChange with the current value (tracked-effect quirk);
            // bail so a pre-options echo can't blank the resolved parentRaceName.
            if (key === (props.formGroup.get('parentRaceKey') ?? '')) return;
            const option = props.raceOptions().find(o => o.key === key);
            props.formGroup.set('parentRaceKey', key);
            props.formGroup.set('parentRaceName', option?.name ?? '');
          })}
        >
          <For each={props.raceOptions()}>{(o) => <Option value={o.key}>{o.label}</Option>}</For>
        </Select>
      </div>

      {/* 2. Edit an existing lineage of that parent — the wizard's edit entry point
             (nothing else in the app deep-links with ?subrace=). */}
      <Show when={props.subraceOptions().length > 0}>
        <div class={styles.boxedField}>
          <span class={styles.cardLabel}>Edit an existing lineage</span>
          <Select
            transparent
            value={props.subracePickerValue()}
            onChange={(name) => props.onPickSubrace(name)}
          >
            <Option value="">+ New Subrace</Option>
            <For each={props.subraceOptions()}>{(name) => <Option value={name}>{name}</Option>}</For>
          </Select>
        </div>
      </Show>

      {/* 3. Subrace name */}
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Subrace name</span>
        <Input
          value={props.formGroup.get('name') ?? ''}
          onChange={(e) => props.formGroup.set('name', e.currentTarget.value)}
          placeholder="Enter subrace name..."
        />
      </div>

      {/* 3. Size — optional; leave empty to inherit the parent race's size */}
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Size — leave empty to keep the parent race's</span>
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

      {/* 4. Speed */}
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Walking speed (feet)</span>
        <Input
          type="number"
          min={0}
          value={(props.formGroup.get('speed') as number) ?? 30}
          onInput={(e) => props.formGroup.set('speed', Math.max(0, +e.currentTarget.value || 0))}
        />
      </div>

      {/* 5. Source */}
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Source (optional)</span>
        <Input
          value={props.formGroup.get('source') ?? ''}
          onChange={(e) => props.formGroup.set('source', e.currentTarget.value)}
          placeholder="e.g. My Campaign"
        />
      </div>
    </div>
  );
};
