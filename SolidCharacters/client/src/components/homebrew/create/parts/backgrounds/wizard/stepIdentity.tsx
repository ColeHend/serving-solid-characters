import { Component } from 'solid-js';
import { Input, TextArea } from 'coles-solid-library';
import { StepProps } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Step 1 of the background wizard: name and description in one card.
export const StepIdentity: Component<StepProps> = (props) => {
  return (
    <div class={styles.card}>
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Background name</span>
        <Input
          value={props.formGroup.get('name') ?? ''}
          onChange={(e) => props.formGroup.set('name', e.currentTarget.value)}
          placeholder="Enter background name..."
        />
      </div>

      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Description</span>
        <TextArea
          rows={3}
          text={() => props.formGroup.get('desc') ?? ''}
          setText={(v) => props.formGroup.set(
            'desc',
            typeof v === 'function' ? v(props.formGroup.get('desc') ?? '') : v,
          )}
        />
      </div>
    </div>
  );
};
