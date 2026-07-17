import { Component, For, createMemo } from 'solid-js';
import { buildReviewRows, type StepProps } from './wizard.shared';
import { ReviewRow } from './reviewRow';
import styles from '../../classes/wizard/stepReview.module.scss';

/**
 * Review step — per-step summary rows from the single source of truth
 * (buildReviewRows). Each row's action jumps back to its step; the Publish
 * action lives in the wizard footer, not here.
 */
export const StepReview: Component<StepProps> = (props) => {
  const rows = createMemo(() => buildReviewRows(props.formGroup, props.extras));

  return (
    <div class={styles.stack}>
      <For each={rows()}>
        {(row) => <ReviewRow row={row} onAction={() => props.goToStep(row.step)} />}
      </For>
    </div>
  );
};
