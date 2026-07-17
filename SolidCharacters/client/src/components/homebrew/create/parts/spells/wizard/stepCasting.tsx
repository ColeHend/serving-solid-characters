import { Component, Show } from 'solid-js';
import { Input } from 'coles-solid-library';
import { ToggleChip } from '../../classes/wizard/toggleChip';
import { CastingField } from './castingField';
import { StepProps, filterDurations, getCastingTimes, getDurations, getRanges } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Step 2 of the spell wizard: how the spell is cast — time, range, duration,
// concentration/ritual tags and the V/S/M component line.
export const StepCasting: Component<StepProps> = (props) => {
  const flag = (key: 'concentration' | 'ritual' | 'isVerbal' | 'isSomatic' | 'isMaterial') =>
    !!props.formGroup.get(key);
  const toggleFlag = (key: 'concentration' | 'ritual' | 'isVerbal' | 'isSomatic' | 'isMaterial') =>
    props.formGroup.set(key, !flag(key));

  return (
    <div class={styles.card}>
      <div class={styles.grid2}>
        <CastingField
          label="Casting time"
          value={() => (props.formGroup.get('castingTime') as string) ?? ''}
          options={() => getCastingTimes(props.allSpells())}
          onCommit={(v) => props.formGroup.set('castingTime', v)}
        />
        <CastingField
          label="Range"
          value={() => (props.formGroup.get('range') as string) ?? ''}
          options={() => getRanges(props.allSpells())}
          onCommit={(v) => props.formGroup.set('range', v)}
        />
      </div>

      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Concentration & ritual</span>
        <div class={styles.chipRow}>
          <ToggleChip label="Concentration" selected={flag('concentration')} onToggle={() => toggleFlag('concentration')} />
          <ToggleChip label="Ritual" selected={flag('ritual')} onToggle={() => toggleFlag('ritual')} />
        </div>
      </div>

      <CastingField
        label="Duration"
        value={() => (props.formGroup.get('duration') as string) ?? ''}
        options={() => filterDurations(getDurations(props.allSpells()), flag('concentration'))}
        onCommit={(v) => props.formGroup.set('duration', v)}
      />

      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Components</span>
        <div class={styles.chipRow}>
          <ToggleChip label="Verbal (V)" selected={flag('isVerbal')} onToggle={() => toggleFlag('isVerbal')} />
          <ToggleChip label="Somatic (S)" selected={flag('isSomatic')} onToggle={() => toggleFlag('isSomatic')} />
          <ToggleChip label="Material (M)" selected={flag('isMaterial')} onToggle={() => toggleFlag('isMaterial')} />
        </div>
        <Show when={flag('isMaterial')}>
          <Input
            value={(props.formGroup.get('materialsNeeded') as string) ?? ''}
            onChange={(e) => props.formGroup.set('materialsNeeded', e.currentTarget.value)}
            placeholder="a pinch of sulfur, a bat's fur..."
          />
        </Show>
      </div>
    </div>
  );
};
