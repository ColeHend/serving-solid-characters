import { Component, For } from 'solid-js';
import { Input, TextArea } from 'coles-solid-library';
import {
  StepProps,
  HIT_DICE,
  ALL_STATS,
  STAT_ABBR,
  MAX_PRIMARY_ABILITIES,
  toggleInArray,
} from './wizard.shared';
import { OptionCard } from './optionCard';
import { ToggleChip } from './toggleChip';
import styles from './classesWizard.module.scss';

// Step 1 of the class wizard: name, hit die, primary abilities and description.
// A single .card holding four sections; label→content grouping uses a tight inline
// flex gap so the card's own spacing separates the sections.
export const StepIdentity: Component<StepProps> = (props) => {
  const primary = () => props.formGroup.get('primaryStat') ?? [];
  const sectionStyle = { display: 'flex', 'flex-direction': 'column', gap: '8px' } as const;

  return (
    <div class={styles.card}>
      {/* 1. Class name */}
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Class name</span>
        <Input
          value={props.formGroup.get('name') ?? ''}
          onChange={(e) => props.formGroup.set('name', e.currentTarget.value)}
          placeholder="Enter class name..."
        />
      </div>

      {/* 2. Hit die */}
      <div style={sectionStyle}>
        <span class={styles.cardLabel}>Hit die — how tough are they?</span>
        <div class={styles.optionRow}>
          <For each={HIT_DICE}>{(opt) => (
            <OptionCard
              title={opt.label}
              subtitle={opt.sub}
              selected={props.formGroup.get('hitDie') === opt.die}
              onSelect={() => props.formGroup.set('hitDie', opt.die)}
            />
          )}</For>
        </div>
      </div>

      {/* 3. Primary abilities */}
      <div style={sectionStyle}>
        <span class={styles.cardLabel}>
          Primary abilities — pick up to {MAX_PRIMARY_ABILITIES} · {primary().length} selected
        </span>
        <div class={styles.chipRow}>
          <For each={ALL_STATS}>{(stat) => (
            <ToggleChip
              label={STAT_ABBR[stat]}
              selected={primary().includes(stat)}
              onToggle={() => props.formGroup.set(
                'primaryStat',
                toggleInArray(primary(), stat, MAX_PRIMARY_ABILITIES),
              )}
            />
          )}</For>
        </div>
      </div>

      {/* 4. Description */}
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Description</span>
        <TextArea
          rows={3}
          text={() => props.formGroup.get('description') ?? ''}
          setText={(v) => props.formGroup.set(
            'description',
            typeof v === 'function' ? v(props.formGroup.get('description') ?? '') : v,
          )}
        />
      </div>

      {/* 5. Source */}
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Source (optional)</span>
        <Input
          value={props.formGroup.get('source') ?? ''}
          onChange={(e) => props.formGroup.set('source', e.currentTarget.value)}
          placeholder="e.g. My Campaign"
        />
      </div>
    </div>
  );
};
