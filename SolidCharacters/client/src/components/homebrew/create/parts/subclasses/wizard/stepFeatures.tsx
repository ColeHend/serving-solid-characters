import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { FeatureDetail } from '../../../../../../models/generated';
import { StepProps, featuresPlaced } from './wizard.shared';
import { LevelPills } from '../../classes/wizard/levelPills';
import { FeatureRow } from '../../classes/wizard/featureRow';
import sharedStyles from '../../classes/wizard/classesWizard.module.scss';
import styles from '../../classes/wizard/stepFeatures.module.scss';

/**
 * Features step — work level by level, same idiom as the class wizard: a pill grid
 * selects the active level and the level card lists its features. No empty-level
 * warning and no ASI/subclass quick-adds: subclasses grant features at only a few
 * levels, and ASIs/subclass markers belong to the parent class.
 */
export const StepFeatures: Component<StepProps> = (props) => {
  const [selectedLevel, setSelectedLevel] = createSignal(3);

  const currentFeatures = createMemo<FeatureDetail[]>(
    () => props.levels.features[selectedLevel()] ?? [],
  );
  const hasFeatures = (level: number) => (props.levels.features[level]?.length ?? 0) > 0;

  const placed = () => featuresPlaced(props.levels.features);

  const deleteFeature = (level: number, feature: FeatureDetail) => {
    props.setLevels('features', level, (arr) => (arr ?? []).filter((f) => f.id !== feature.id));
  };

  return (
    <div class={styles.step}>
      <LevelPills selected={selectedLevel()} onSelect={setSelectedLevel} hasFeatures={hasFeatures} />

      <div class={sharedStyles.card}>
        <div class={styles.cardHead}>
          <span class={sharedStyles.cardLabel}>
            Level {selectedLevel()} — {currentFeatures().length}{' '}
            {currentFeatures().length === 1 ? 'Feature' : 'Features'}
          </span>
          <span class={sharedStyles.counterMuted}>
            {placed()} feature{placed() === 1 ? '' : 's'} placed
          </span>
        </div>

        <div class={styles.featureList}>
          <Show
            when={currentFeatures().length}
            fallback={
              <div class={styles.empty}>No features at level {selectedLevel()} yet — add one below.</div>
            }
          >
            <For each={currentFeatures()}>
              {(feature) => (
                <FeatureRow
                  feature={feature}
                  onEdit={() => props.openEditFeature(selectedLevel(), feature)}
                  onDelete={() => deleteFeature(selectedLevel(), feature)}
                />
              )}
            </For>
          </Show>
        </div>

        <div class={styles.actions}>
          <button
            type="button"
            class={styles.addBtn}
            onClick={() => props.openAddFeature(selectedLevel())}
          >
            Add feature to level {selectedLevel()}
          </button>
        </div>
      </div>

      <Show when={placed() === 0}>
        <div class={`${sharedStyles.banner} ${sharedStyles.bannerWarn}`}>
          <span>No features yet — a subclass needs at least one to publish.</span>
        </div>
      </Show>
    </div>
  );
};
