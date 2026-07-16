import { Component, For, runWithOwner } from 'solid-js';
import { Input, Option, Select, TextArea } from 'coles-solid-library';
import { StepProps } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Step 1 of the subclass wizard: parent class, name and description in one card.
export const StepIdentity: Component<StepProps> = (props) => {
  return (
    <div class={styles.card}>
      {/* 1. Parent class — options are keyed by selector key (not name) so same-named classes
             from different rulesets (2014/2024 Wizard) stay distinct; labels carry the version. */}
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Parent class — which class is this a subclass of?</span>
        <Select
          transparent
          value={props.formGroup.get('parentClassId') ?? ''}
          // coles Select fires onChange from a tracked effect; detach so the form write
          // (and everything reacting to it) can't be captured by that scope.
          onChange={(key) => runWithOwner(null, () => {
            // The Select can echo onChange with the current value (tracked-effect quirk);
            // bail so a pre-options echo can't blank the resolved parentClass name.
            if (key === (props.formGroup.get('parentClassId') ?? '')) return;
            const option = props.classOptions().find(o => o.key === key);
            props.formGroup.set('parentClassId', key);
            props.formGroup.set('parentClass', option?.name ?? '');
          })}
        >
          <For each={props.classOptions()}>{(o) => <Option value={o.key}>{o.label}</Option>}</For>
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
