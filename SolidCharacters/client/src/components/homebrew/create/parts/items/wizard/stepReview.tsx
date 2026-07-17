import { Component, For, createMemo } from 'solid-js';
import { itemsStore } from '../itemsStore';
import { buildItemReviewRows, type StepProps } from './wizard.shared';
import { ReviewRow } from './reviewRow';
import styles from '../../classes/wizard/stepReview.module.scss';

/**
 * Review step — per-step summary rows from the single source of truth
 * (buildItemReviewRows). Each row's action jumps back to its step; the
 * Save/Update action lives in the wizard footer, not here.
 */
export const StepReview: Component<StepProps> = (props) => {
  const store = itemsStore;
  const rows = createMemo(() => buildItemReviewRows(store.state.form, store.errors()));

  return (
    <div class={styles.stack}>
      <For each={rows()}>
        {(row) => <ReviewRow row={row} onAction={() => props.goToStep(row.step)} />}
      </For>
    </div>
  );
};
