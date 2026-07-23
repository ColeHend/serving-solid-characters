import { Component } from 'solid-js';
import { Input, TextArea } from 'coles-solid-library';
import { StepProps } from './wizard.shared';
import { EditionPicker } from '../../classes/wizard/editionPicker';
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

      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Source (optional)</span>
        <Input
          value={props.formGroup.get('source') ?? ''}
          onChange={(e) => props.formGroup.set('source', e.currentTarget.value)}
          placeholder="e.g. My Campaign"
        />
      </div>

      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Edition</span>
        <EditionPicker
          value={props.formGroup.get('legacy') as boolean | undefined}
          onChange={(v) => props.formGroup.set('legacy', v as never)}
        />
      </div>
    </div>
  );
};
