import { Component, For, Show } from 'solid-js';
import { Checkbox } from 'coles-solid-library';
import { CasterType } from '../../../../../../models/old/core.model';
import { SpellsKnown } from '../../../../../../shared/models/casting';
import type { Stat } from '../../../../../../shared/models/stats';
import styles from './classesWizard.module.scss';
import { ToggleChip } from './toggleChip';
import { OptionCard } from './optionCard';
import {
  ALL_STATS,
  CASTER_BANNERS,
  CASTER_CARDS,
  SPELLS_KNOWN_MODES,
  STAT_FULL,
  type SpellsKnownMode,
  type StepProps,
} from './wizard.shared';

/** Spellcasting step: pick a caster type, then (for casters) a casting ability and how spells are known. */
export const StepSpellcasting: Component<StepProps> = (props) => {
  const casterType = (): CasterType | undefined =>
    props.formGroup.get('casterType') as CasterType | undefined;

  const isCaster = (): boolean => {
    const t = casterType();
    return t !== undefined && t !== CasterType.None;
  };

  const selectCaster = (type: CasterType): void => {
    props.formGroup.set('casterType', type);
    props.formGroup.set('spellCasting', type !== CasterType.None);
  };

  const setAbility = (stat: Stat): void => {
    props.formGroup.set('spellcastAbility', stat);
  };

  const setMode = (mode: SpellsKnownMode): void => {
    props.formGroup.set('spellsKnownMode', mode);
    props.formGroup.set('spellsKnownCalc', mode === 'fixed' ? SpellsKnown.Number : SpellsKnown.StatLevel);
  };

  return (
    <div class={styles.card}>
      <div class={styles.optionRow}>
        <For each={CASTER_CARDS}>
          {(card) => (
            <OptionCard
              title={card.title}
              subtitle={card.sub}
              alignStart
              badge
              selected={casterType() === card.type}
              onSelect={() => selectCaster(card.type)}
            />
          )}
        </For>
      </div>

      <Show when={isCaster()}>
        <div class={styles.cardLabel}>Spellcasting ability</div>
        <div class={styles.chipRow}>
          <For each={ALL_STATS}>
            {(stat) => (
              <ToggleChip
                label={STAT_FULL[stat]}
                selected={props.formGroup.get('spellcastAbility') === stat}
                onToggle={() => setAbility(stat)}
              />
            )}
          </For>
        </div>

        <div class={styles.cardLabel}>Spells known</div>
        <div class={styles.chipRow} style={{ 'align-items': 'center' }}>
          <For each={SPELLS_KNOWN_MODES}>
            {(entry) => (
              <ToggleChip
                label={entry.label}
                selected={props.formGroup.get('spellsKnownMode') === entry.mode}
                onToggle={() => setMode(entry.mode)}
              />
            )}
          </For>
          <Checkbox
            label="Has cantrips"
            checked={!!props.formGroup.get('hasCantrips')}
            onChange={(v: boolean) => props.formGroup.set('hasCantrips', v)}
          />
        </div>
      </Show>

      <Show when={casterType() !== undefined}>
        <div class={styles.banner}>
          ✦ {CASTER_BANNERS[casterType() as CasterType]}
        </div>
      </Show>
    </div>
  );
};
