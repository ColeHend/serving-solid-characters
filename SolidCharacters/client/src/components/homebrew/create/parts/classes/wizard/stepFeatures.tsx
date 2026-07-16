import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { FeatureDetail } from '../../../../../../models/generated';
import { ASI_FEATURE, subclassMarkerInput } from '../../../../../../shared/ai/refs/classProgression';
import { createNewId } from '../../../../../../shared/customHooks/utility/tools/idGen';
import {
  StepProps,
  emptyLevels,
  featuresPlaced,
  formatLevelList,
} from './wizard.shared';
import { LevelPills } from './levelPills';
import { FeatureRow } from './featureRow';
import { AdvancedLevels } from './advancedLevels';
import sharedStyles from './classesWizard.module.scss';
import styles from './stepFeatures.module.scss';

/**
 * Features step — work level by level. A pill grid selects the active level; the level
 * card lists its features (each editable / deletable) and offers quick-adds; a warning
 * banner flags levels that still have no features. The collapsed "advanced" card edits
 * the extra level-table columns and cantrips for the selected level.
 */
export const StepFeatures: Component<StepProps> = (props) => {
  const [selectedLevel, setSelectedLevel] = createSignal(1);

  const currentFeatures = createMemo<FeatureDetail[]>(
    () => props.levels.features[selectedLevel()] ?? [],
  );
  const hasFeatures = (level: number) => (props.levels.features[level]?.length ?? 0) > 0;

  const placed = () => featuresPlaced(props.levels.features);
  const empties = () => emptyLevels(props.levels.features);

  const deleteFeature = (level: number, feature: FeatureDetail) => {
    props.setLevels('features', level, (arr) => (arr ?? []).filter((f) => f.id !== feature.id));
  };

  const appendFeature = (level: number, item: FeatureDetail) => {
    props.setLevels('features', level, (arr) => [...(arr ?? []), item]);
  };

  const addAsi = () => {
    appendFeature(selectedLevel(), {
      id: createNewId(),
      ...ASI_FEATURE,
      metadata: { category: 'ASI' },
    });
  };

  const addSubclassLevel = () => {
    const name = (props.formGroup.get('name') as string) ?? '';
    const marker = subclassMarkerInput(name, selectedLevel());
    appendFeature(selectedLevel(), {
      id: createNewId(),
      name: marker.name,
      description: marker.description,
      metadata: { category: 'Subclass' },
    });
  };

  const warningText = () =>
    placed() === 0
      ? 'No features yet — every level needs at least one.'
      : `⚠ Levels ${formatLevelList(empties())} have no features yet — every level needs at least one.`;

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
            {placed()} features placed across 20 levels
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
          <button type="button" class={styles.ghostBtn} onClick={addAsi}>
            + ASI
          </button>
          <button type="button" class={styles.ghostBtn} onClick={addSubclassLevel}>
            Mark as subclass level
          </button>
        </div>
      </div>

      <Show when={empties().length > 0}>
        <div class={`${sharedStyles.banner} ${sharedStyles.bannerWarn}`}>
          <span>{warningText()}</span>
        </div>
      </Show>

      <AdvancedLevels levels={props.levels} setLevels={props.setLevels} selectedLevel={selectedLevel} />
    </div>
  );
};
