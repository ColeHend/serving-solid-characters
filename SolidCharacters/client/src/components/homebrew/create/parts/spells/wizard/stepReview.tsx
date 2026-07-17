import { Component, For, Show, createMemo } from 'solid-js';
import { Button } from 'coles-solid-library';
import { buildReviewRows, type StepProps } from './wizard.shared';
import { ReviewRow } from './reviewRow';
import styles from '../../classes/wizard/stepReview.module.scss';
import wizStyles from '../../classes/wizard/classesWizard.module.scss';

/**
 * Review step — per-step summary rows from the single source of truth
 * (buildReviewRows). Each row's action jumps back to its step; the Publish
 * action lives in the wizard footer, not here. Deleting an existing homebrew
 * spell also lives here, next to the other terminal actions.
 */
export const StepReview: Component<StepProps> = (props) => {
  const rows = createMemo(() => buildReviewRows(props.formGroup));

  return (
    <div class={styles.stack}>
      <For each={rows()}>
        {(row) => <ReviewRow row={row} onAction={() => props.goToStep(row.step)} />}
      </For>

      <Show when={props.isExisting()}>
        <div class={`${wizStyles.banner} ${wizStyles.bannerWarn}`}>
          <span>This spell is already in your homebrew collection. Deleting removes it permanently.</span>
          <Button theme="error" onClick={() => void props.deleteSpell()}>Delete spell</Button>
        </div>
      </Show>
    </div>
  );
};
