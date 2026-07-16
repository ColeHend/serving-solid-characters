import { Component, For, Show } from 'solid-js';
import { FeatureDetail } from '../../../../../../models/generated';
import { StepProps } from './wizard.shared';
import { FeatureRow } from './featureRow';
import wiz from '../../classes/wizard/classesWizard.module.scss';
import styles from '../../classes/wizard/stepFeatures.module.scss';

/**
 * Features step — a flat feature list (backgrounds have no levels, so no level
 * pills). Rows open the shared FeaturesPopup for editing; the add button opens
 * it in add mode.
 */
export const StepFeatures: Component<StepProps> = (props) => {
  const features = () => props.extras.features;

  const deleteFeature = (feature: FeatureDetail) =>
    props.setExtras('features', arr => arr.filter(f => f.id !== feature.id));

  return (
    <div class={styles.step}>
      <div class={wiz.card}>
        <div class={styles.cardHead}>
          <span class={wiz.cardLabel}>Background features</span>
          <span class={wiz.counterMuted}>
            {features().length} feature{features().length === 1 ? '' : 's'} added
          </span>
        </div>

        <div class={styles.featureList}>
          <Show
            when={features().length}
            fallback={<div class={styles.empty}>No features yet — add one below.</div>}
          >
            <For each={features()}>
              {(feature) => (
                <FeatureRow
                  feature={feature}
                  onEdit={() => props.openEditFeature(feature)}
                  onDelete={() => deleteFeature(feature)}
                />
              )}
            </For>
          </Show>
        </div>

        <div class={styles.actions}>
          <button type="button" class={styles.addBtn} onClick={() => props.openAddFeature()}>
            Add feature
          </button>
        </div>
      </div>

      <Show when={!features().length}>
        <div class={wiz.banner}>
          <span>Features are optional — most backgrounds grant one signature feature, like Shelter of the Faithful.</span>
        </div>
      </Show>
    </div>
  );
};
