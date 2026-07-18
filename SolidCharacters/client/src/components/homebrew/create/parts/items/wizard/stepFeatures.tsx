import { Component, For, Show } from 'solid-js';
import type { FeatureDetail } from '../../../../../../models/generated';
import type { Feature } from '../../../../../../models/old/core.model';
import { itemsStore } from '../itemsStore';
import { StepProps } from './wizard.shared';
import { FeatureRow } from '../../classes/wizard/featureRow';
import sharedStyles from '../../classes/wizard/classesWizard.module.scss';
import featureStyles from '../../classes/wizard/stepFeatures.module.scss';
import styles from './itemsWizard.module.scss';

// Step 3 of the items wizard: the feature list. Items keep the lightweight
// Feature<string,string> model (name + value round-tripped via properties.__draft),
// so rows are projected into the shared FeatureRow's shape — it only reads
// .name and .metadata.category.
export const StepFeatures: Component<StepProps> = (props) => {
  const store = itemsStore;
  const features = () => store.state.form!.features;

  const asDetail = (f: Feature<string, string>, index: number): FeatureDetail => ({
    id: `item-feature-${index}`,
    name: f.name,
    description: f.value || '',
    metadata: { category: (f.metadata as { category?: string })?.category || 'Item feature' },
  });

  const removeFeature = (name: string) =>
    store.mutate(d => { d.features = d.features.filter(f => f.name !== name); });

  return (
    <div class={styles.step}>
      <div class={sharedStyles.card}>
        <div class={featureStyles.cardHead}>
          <span class={sharedStyles.cardLabel}>
            Features — {features().length}
          </span>
          <span class={sharedStyles.counterMuted}>optional</span>
        </div>

        <div class={featureStyles.featureList}>
          <Show
            when={features().length}
            fallback={<div class={featureStyles.empty}>No features yet — plenty of items are just gear.</div>}
          >
            <For each={features()}>
              {(feature, i) => (
                <FeatureRow
                  feature={asDetail(feature, i())}
                  onEdit={() => props.openEditFeature(i())}
                  onDelete={() => removeFeature(feature.name)}
                />
              )}
            </For>
          </Show>
        </div>

        <div class={featureStyles.actions}>
          <button type="button" class={featureStyles.addBtn} onClick={() => props.openAddFeature()}>
            Add feature
          </button>
        </div>
      </div>
    </div>
  );
};
