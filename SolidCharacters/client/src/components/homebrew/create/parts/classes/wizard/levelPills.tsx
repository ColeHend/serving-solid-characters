import { Component, For, Show } from 'solid-js';
import { LEVELS } from './wizard.shared';
import styles from './stepFeatures.module.scss';

interface LevelPillsProps {
  selected: number;
  onSelect: (level: number) => void;
  hasFeatures: (level: number) => boolean;
}

/**
 * A wrapping grid of 20 level pills. A pill shows its level number with a small dot
 * underneath when that level already has features; levels with features are accent-tinted,
 * the selected level is filled, and empty levels stay dim. Selection is instant — the
 * highlight classes recompute from the reactive `selected` / `hasFeatures` props.
 */
export const LevelPills: Component<LevelPillsProps> = (props) => {
  return (
    <div class={styles.pillGrid}>
      <For each={LEVELS}>
        {(level) => {
          const has = () => props.hasFeatures(level);
          const on = () => props.selected === level;
          return (
            <button
              type="button"
              class={`${styles.pill} ${has() ? styles.pillHas : ''} ${on() ? styles.pillOn : ''}`}
              aria-pressed={on()}
              aria-label={`Level ${level}${has() ? ', has features' : ', no features'}`}
              onClick={() => props.onSelect(level)}
            >
              <span>{level}</span>
              <Show when={has()} fallback={<span class={styles.pillDotEmpty} />}>
                <span class={styles.pillDot} />
              </Show>
            </button>
          );
        }}
      </For>
    </div>
  );
};
