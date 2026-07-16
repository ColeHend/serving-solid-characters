import { Component, Show } from 'solid-js';
import type { ReviewRowData } from './wizard.shared';
import styles from './stepReview.module.scss';

interface ReviewRowProps {
  row: ReviewRowData;
  onAction: () => void;
}

/**
 * One full-width summary row on the Review step: a status glyph, the step's
 * title + summary (+ optional detail line), and a quiet Edit / Fix-now button.
 * Warn rows (row.ok === false) take the warn-tinted border/background.
 */
export const ReviewRow: Component<ReviewRowProps> = (props) => {
  return (
    <div class={`${styles.row} ${props.row.ok ? '' : styles.rowWarn}`}>
      <Show
        when={props.row.ok}
        fallback={
          <span class={styles.statusWarn} role="img" aria-label="Needs attention">
            ⚠
          </span>
        }
      >
        <span class={styles.statusOk} role="img" aria-label="Complete">
          ✓
        </span>
      </Show>

      <div class={styles.body}>
        <div class={styles.title}>{props.row.title}</div>
        <div class={styles.summary}>{props.row.summary}</div>
        <Show when={props.row.detail}>
          <div class={styles.summary}>{props.row.detail}</div>
        </Show>
      </div>

      <button
        type="button"
        class={`${styles.actionBtn} ${props.row.action === 'fix' ? styles.actionFix : ''}`}
        onClick={() => props.onAction()}
        aria-label={`${props.row.action === 'fix' ? 'Fix' : 'Edit'} ${props.row.title}`}
      >
        {props.row.action === 'fix' ? 'Fix now' : 'Edit'}
      </button>
    </div>
  );
};
