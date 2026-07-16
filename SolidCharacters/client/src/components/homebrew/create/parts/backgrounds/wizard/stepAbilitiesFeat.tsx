import { Component, For, Show, createMemo, runWithOwner } from 'solid-js';
import { Option, Select } from 'coles-solid-library';
import { Markdown } from '../../../../../../shared/components/MarkDown/MarkDown';
import { ALL_ABILITIES, MAX_ABILITY_OPTIONS, StepProps, toggleInArray } from './wizard.shared';
import { ToggleChip } from '../../classes/wizard/toggleChip';
import wiz from '../../classes/wizard/classesWizard.module.scss';
import styles from '../../classes/wizard/stepProficiencies.module.scss';

/**
 * Abilities & Feat step — the 2024-style grants: up to three ability score options
 * and an origin feat. Both are optional so 2014-style backgrounds stay valid.
 */
export const StepAbilitiesFeat: Component<StepProps> = (props) => {
  const abilities = () => (props.formGroup.get('abilityOptions') as string[]) ?? [];
  const featId = () => (props.formGroup.get('feat') as string) ?? '';
  const selectedFeat = createMemo(() => props.originFeats().find(f => f.id === featId()));

  return (
    <div class={styles.step}>
      <div class={wiz.card}>
        <div class={`${wiz.sectionHead} ${styles.headRow}`}>
          <b>ABILITY SCORE OPTIONS</b>
          <span class={`${abilities().length ? wiz.counterGood : wiz.counterMuted} ${styles.pushRight}`}>
            {abilities().length}/{MAX_ABILITY_OPTIONS} picked
          </span>
        </div>
        <div class={wiz.chipRow}>
          <For each={ALL_ABILITIES}>{(stat) => (
            <ToggleChip
              label={stat}
              selected={abilities().includes(stat)}
              disabled={!abilities().includes(stat) && abilities().length >= MAX_ABILITY_OPTIONS}
              onToggle={() => props.formGroup.set('abilityOptions', toggleInArray(abilities(), stat, MAX_ABILITY_OPTIONS))}
            />
          )}</For>
        </div>
        <span class={wiz.counterMuted}>
          Players increase these scores when they pick the background (2024 rules). Leave empty for a 2014-style background.
        </span>
      </div>

      <div class={wiz.card}>
        <div class={wiz.boxedField}>
          <span class={wiz.cardLabel}>Origin feat</span>
          <Select
            transparent
            value={featId()}
            // coles Select fires onChange from a tracked effect and can echo the current
            // value; detach and bail on echoes so form writes can't be captured/looped.
            onChange={(id: string) => runWithOwner(null, () => {
              if (id === featId()) return;
              props.formGroup.set('feat', id);
            })}
          >
            <Option value="">None</Option>
            <For each={props.originFeats()}>{(feat) => <Option value={feat.id}>{feat.details.name}</Option>}</For>
          </Select>
        </div>
        <Show when={selectedFeat()}>
          <Markdown text={selectedFeat()!.details.description ?? ''} />
        </Show>
      </div>
    </div>
  );
};
