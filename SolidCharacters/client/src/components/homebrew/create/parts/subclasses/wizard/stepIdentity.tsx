import { Component, For, runWithOwner } from 'solid-js';
import { Input, Option, Select, TextArea } from 'coles-solid-library';
import { StepProps } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Step 1 of the subclass wizard: parent class, name and description in one card.
export const StepIdentity: Component<StepProps> = (props) => {
  return (
    <div class={styles.card}>
      {/* 1. Parent class */}
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Parent class — which class is this a subclass of?</span>
        <Select
          transparent
          value={props.formGroup.get('parentClass') ?? ''}
          // coles Select fires onChange from a tracked effect; detach so the form write
          // (and everything reacting to it) can't be captured by that scope.
          onChange={(value) => runWithOwner(null, () => props.formGroup.set('parentClass', value))}
        >
          <For each={props.allClassNames()}>{(name) => <Option value={name}>{name}</Option>}</For>
        </Select>
      </div>

      {/* 2. Subclass name */}
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Subclass name</span>
        <Input
          value={props.formGroup.get('name') ?? ''}
          onChange={(e) => props.formGroup.set('name', e.currentTarget.value)}
          placeholder="Enter subclass name..."
        />
      </div>

      {/* 3. Description */}
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Description</span>
        <TextArea
          rows={3}
          text={() => props.formGroup.get('description') ?? ''}
          setText={(v) => props.formGroup.set(
            'description',
            typeof v === 'function' ? v(props.formGroup.get('description') ?? '') : v,
          )}
        />
      </div>
    </div>
  );
};
