import { Component, For, createMemo } from 'solid-js';
import { buildReviewRows, type StepProps } from './wizard.shared';
import { ReviewRow } from './reviewRow';
import styles from './stepReview.module.scss';

/**
 * Review step — a vertical stack of per-step summary rows built from the single
 * source of truth (buildReviewRows). Each row's action jumps back to its step.
 * The "Publish" action lives in the wizard footer, not here.
 */
export const StepReview: Component<StepProps> = (props) => {
  const rows = createMemo(() => buildReviewRows(props.formGroup, props.levels));

  return (
    <div class={styles.stack}>
      <For each={rows()}>
        {(row) => <ReviewRow row={row} onAction={() => props.goToStep(row.step)} />}
      </For>
    </div>
  );
};
