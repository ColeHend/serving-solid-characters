import { Component, For, Show, createEffect, createMemo, createSignal, untrack } from 'solid-js';
import { FeatureDetail } from '../../../../../../models/generated';
import { LEVELS, StepProps, featuresPlaced, formatLevelList, subclassFeatureLevels } from './wizard.shared';
import { LevelPills } from '../../classes/wizard/levelPills';
import { FeatureRow } from '../../classes/wizard/featureRow';
import sharedStyles from '../../classes/wizard/classesWizard.module.scss';
import styles from '../../classes/wizard/stepFeatures.module.scss';

/**
 * Features step — work level by level, same idiom as the class wizard: a pill grid
 * selects the active level and the level card lists its features. The grid is limited
 * to the parent class's subclass-grant levels (all 20 when none are detectable), plus
 * any out-of-range level that already holds features — those are flagged, never dropped.
 * No empty-level warning and no ASI/subclass quick-adds: subclasses grant features at
 * only a few levels, and ASIs/subclass markers belong to the parent class.
 */
export const StepFeatures: Component<StepProps> = (props) => {
  const [selectedLevel, setSelectedLevel] = createSignal(3);

  const parentClass = () => (props.formGroup.get('parentClass') as string) || '';
  const placedLevels = createMemo(() => subclassFeatureLevels(props.levels.features));

  const pillLevels = createMemo<number[]>(() => {
    const allowed = props.allowedLevels();
    if (!allowed) return LEVELS;
    const extra = placedLevels().filter(l => !allowed.includes(l));
    return [...allowed, ...extra].sort((a, b) => a - b);
  });

  const outOfRange = createMemo<Set<number>>(() => {
    const allowed = props.allowedLevels();
    return new Set(allowed ? placedLevels().filter(l => !allowed.includes(l)) : []);
  });

  // Snap to the first offered level when the current one leaves the grid (parent class
  // switched, or class data finished loading). untrack the selection so the effect only
  // re-fires on pill-set changes, not on every click.
  createEffect(() => {
    const pills = pillLevels();
    if (!pills.includes(untrack(selectedLevel))) setSelectedLevel(pills[0] ?? 3);
  });

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
      <LevelPills
        selected={selectedLevel()}
        onSelect={setSelectedLevel}
        hasFeatures={hasFeatures}
        levels={pillLevels()}
        flagged={(level) => outOfRange().has(level)}
      />

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

      <Show when={outOfRange().size > 0}>
        <div class={`${sharedStyles.banner} ${sharedStyles.bannerWarn}`}>
          <span>
            Level{outOfRange().size === 1 ? '' : 's'} {formatLevelList([...outOfRange()])} {outOfRange().size === 1 ? "isn't" : "aren't"} among{' '}
            {parentClass() || 'the parent class'}'s subclass levels — remove the features or move them.
          </span>
        </div>
      </Show>

      <Show when={props.allowedLevels() === null && parentClass()}>
        <div class={sharedStyles.banner}>
          <span>Showing all 20 levels — {parentClass()} doesn't declare subclass feature levels.</span>
        </div>
      </Show>
    </div>
  );
};
