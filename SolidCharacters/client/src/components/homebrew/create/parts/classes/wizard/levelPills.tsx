import { Component, For, Show } from 'solid-js';
import { LEVELS } from './wizard.shared';
import styles from './stepFeatures.module.scss';

interface LevelPillsProps {
  selected: number;
  onSelect: (level: number) => void;
  hasFeatures: (level: number) => boolean;
  /** Levels to render; defaults to all 20. */
  levels?: number[];
  /** Marks a pill with warning styling (e.g. features placed outside the parent class's subclass levels). */
  flagged?: (level: number) => boolean;
}

/**
 * A wrapping grid of level pills (all 20 unless `levels` narrows it). A pill shows its level
 * number with a small dot underneath when that level already has features; levels with features
 * are accent-tinted, the selected level is filled, flagged levels are warn-tinted, and empty
 * levels stay dim. Selection is instant — the highlight classes recompute from the reactive
 * `selected` / `hasFeatures` / `flagged` props.
 */
export const LevelPills: Component<LevelPillsProps> = (props) => {
  return (
    <div class={styles.pillGrid}>
      <For each={props.levels ?? LEVELS}>
        {(level) => {
          const has = () => props.hasFeatures(level);
          const on = () => props.selected === level;
          const flag = () => props.flagged?.(level) ?? false;
          return (
            <button
              type="button"
              class={`${styles.pill} ${has() ? styles.pillHas : ''} ${flag() ? styles.pillFlag : ''} ${on() ? styles.pillOn : ''}`}
              aria-pressed={on()}
              aria-label={`Level ${level}${has() ? ', has features' : ', no features'}${flag() ? ', not a subclass level' : ''}`}
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
