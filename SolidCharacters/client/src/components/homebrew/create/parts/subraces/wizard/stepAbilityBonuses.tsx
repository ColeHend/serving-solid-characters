import { Component, For, Show, createMemo } from 'solid-js';
import { Input } from 'coles-solid-library';
import { ALL_ABILITIES, RaceStatBonus, StepProps } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Ability bonuses step — one numeric field per ability score; 0 means the
// lineage adds no bonus to that score (only non-zero entries are persisted).
export const StepAbilityBonuses: Component<StepProps> = (props) => {
  const bonuses = () => (props.formGroup.get('abilityBonuses') as RaceStatBonus[]) ?? [];

  const valueFor = (stat: number) => bonuses().find(b => b.stat === stat)?.value ?? 0;

  const setBonus = (stat: number, value: number) => {
    const rest = bonuses().filter(b => b.stat !== stat);
    props.formGroup.set(
      'abilityBonuses',
      value === 0 ? rest : [...rest, { stat, value }].sort((a, b) => a.stat - b.stat),
    );
  };

  const anyBonus = createMemo(() => bonuses().some(b => b.value !== 0));

  return (
    <>
      <div class={styles.card}>
        <div class={styles.cardLabel}>Extra ability score bonuses</div>
        <div class={styles.grid2}>
          <For each={ALL_ABILITIES}>{(ability, i) => (
            <div class={styles.boxedField}>
              <span class={styles.cardLabel}>{ability}</span>
              <Input
                type="number"
                min={-5}
                max={5}
                value={valueFor(i())}
                onInput={(e) => setBonus(i(), Math.max(-5, Math.min(5, +e.currentTarget.value || 0)))}
              />
            </div>
          )}</For>
        </div>
      </div>

      <Show when={!anyBonus()}>
        <div class={styles.banner}>
          <span>These stack on top of the parent race's bonuses — many subraces add just one +1.</span>
        </div>
      </Show>
    </>
  );
};
