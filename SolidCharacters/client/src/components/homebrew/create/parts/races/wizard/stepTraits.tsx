import { Component, For, Show } from 'solid-js';
import { FeatureDetail } from '../../../../../../models/generated';
import { StepProps } from './wizard.shared';
import { FeatureRow } from './featureRow';
import wiz from '../../classes/wizard/classesWizard.module.scss';
import styles from '../../classes/wizard/stepFeatures.module.scss';

/**
 * Traits step — a flat trait list (races have no levels, so no level pills).
 * Rows open the shared FeaturesPopup for editing; the add button opens it in
 * add mode.
 */
export const StepTraits: Component<StepProps> = (props) => {
  const traits = () => props.extras.traits;

  const deleteTrait = (trait: FeatureDetail) =>
    props.setExtras('traits', arr => arr.filter(t => t.id !== trait.id));

  return (
    <div class={styles.step}>
      <div class={wiz.card}>
        <div class={styles.cardHead}>
          <span class={wiz.cardLabel}>Racial traits</span>
          <span class={wiz.counterMuted}>
            {traits().length} trait{traits().length === 1 ? '' : 's'} added
          </span>
        </div>

        <div class={styles.featureList}>
          <Show
            when={traits().length}
            fallback={<div class={styles.empty}>No traits yet — add one below.</div>}
          >
            <For each={traits()}>
              {(trait) => (
                <FeatureRow
                  feature={trait}
                  onEdit={() => props.openEditFeature(trait)}
                  onDelete={() => deleteTrait(trait)}
                />
              )}
            </For>
          </Show>
        </div>

        <div class={styles.actions}>
          <button type="button" class={styles.addBtn} onClick={() => props.openAddFeature()}>
            Add trait
          </button>
        </div>
      </div>

      <Show when={!traits().length}>
        <div class={wiz.banner}>
          <span>Traits are what make a race play differently — darkvision, resistances, innate spells.</span>
        </div>
      </Show>
    </div>
  );
};
