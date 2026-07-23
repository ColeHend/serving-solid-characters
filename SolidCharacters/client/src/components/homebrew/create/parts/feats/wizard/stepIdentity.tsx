import { Component } from 'solid-js';
import { Input, TextArea } from 'coles-solid-library';
import { FeatStepProps } from './wizard.shared';
import { EditionPicker } from '../../classes/wizard/editionPicker';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Step 1 of the feat wizard: name and the descriptive text.
export const StepIdentity: Component<FeatStepProps> = (props) => {
  return (
    <div class={styles.card}>
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Feat name</span>
        <Input
          value={props.formGroup.get('name') ?? ''}
          onChange={(e) => props.formGroup.set('name', e.currentTarget.value)}
          placeholder="Enter feat name..."
        />
      </div>

      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Description</span>
        <TextArea
          rows={5}
          text={() => props.formGroup.get('description') ?? ''}
          setText={(v) => props.formGroup.set(
            'description',
            typeof v === 'function' ? v(props.formGroup.get('description') ?? '') : v,
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
