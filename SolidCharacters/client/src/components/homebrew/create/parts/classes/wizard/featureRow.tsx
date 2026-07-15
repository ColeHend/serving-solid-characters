import { Component } from 'solid-js';
import { Icon } from 'coles-solid-library';
import { Delete } from 'coles-solid-library/icons';
import { FeatureDetail } from '../../../../../../models/generated';
import styles from './stepFeatures.module.scss';

interface FeatureRowProps {
  feature: FeatureDetail;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * One feature within a level: an accent dot, the (clickable → edit) name, a small
 * category tag and a trailing trash button. The name + tag form a single button so the
 * whole row opens the edit modal; the delete button is kept separate (no nested buttons).
 */
export const FeatureRow: Component<FeatureRowProps> = (props) => {
  const category = () => props.feature.metadata?.category || 'Class feature';
  return (
    <div class={styles.featureRow}>
      <button type="button" class={styles.featureMain} onClick={() => props.onEdit()}>
        <span class={styles.featureDot} />
        <span class={styles.featureName}>{props.feature.name}</span>
        <span class={styles.featureTag}>{category()}</span>
      </button>
      <button
        type="button"
        class={styles.deleteBtn}
        aria-label={`Delete ${props.feature.name}`}
        onClick={() => props.onDelete()}
      >
        <Icon icon={Delete} size={'small'} />
      </button>
    </div>
  );
};
