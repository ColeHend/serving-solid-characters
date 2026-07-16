import { Component } from 'solid-js';
import { Icon } from 'coles-solid-library';
import { Delete } from 'coles-solid-library/icons';
import { FeatureDetail } from '../../../../../../models/generated';
import styles from '../../classes/wizard/stepFeatures.module.scss';

interface FeatureRowProps {
  feature: FeatureDetail;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Thin sibling of the class wizard's FeatureRow — same markup and styles, but the
 * fallback category tag reads "Background feature" instead of "Class feature".
 */
export const FeatureRow: Component<FeatureRowProps> = (props) => {
  const category = () => props.feature.metadata?.category || 'Background feature';
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
