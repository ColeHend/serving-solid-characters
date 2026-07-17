import { Component, For, runWithOwner } from 'solid-js';
import { Input, Option, Select, TextArea } from 'coles-solid-library';
import { SPELL_LEVELS, StepProps, getSchools, spellLevelLabel } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Step 1 of the spell wizard: name, level, school and the descriptive text.
export const StepIdentity: Component<StepProps> = (props) => {
  return (
    <div class={styles.card}>
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Spell name</span>
        <Input
          value={props.formGroup.get('name') ?? ''}
          onChange={(e) => props.formGroup.set('name', e.currentTarget.value)}
          placeholder="Enter spell name..."
        />
      </div>

      <div class={styles.grid2}>
        <div class={styles.boxedField}>
          <span class={styles.cardLabel}>Level</span>
          <Select
            transparent
            value={props.formGroup.get('level') ?? '0'}
            // coles Select fires onChange from a tracked effect; detach so the form write
            // (and everything reacting to it) can't be captured by that scope.
            onChange={(level) => runWithOwner(null, () => {
              if (level === (props.formGroup.get('level') ?? '0')) return;
              props.formGroup.set('level', level);
            })}
          >
            <For each={SPELL_LEVELS}>{(level) => <Option value={level}>{spellLevelLabel(level)}</Option>}</For>
          </Select>
        </div>
        <div class={styles.boxedField}>
          <span class={styles.cardLabel}>School of magic</span>
          <Select
            transparent
            value={props.formGroup.get('school') ?? ''}
            onChange={(school) => runWithOwner(null, () => {
              if (school === (props.formGroup.get('school') ?? '')) return;
              props.formGroup.set('school', school);
            })}
          >
            <For each={getSchools(props.allSpells())}>{(school) => <Option value={school}>{school}</Option>}</For>
          </Select>
        </div>
      </div>

      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Description</span>
        <TextArea
          rows={4}
          text={() => props.formGroup.get('description') ?? ''}
          setText={(v) => props.formGroup.set(
            'description',
            typeof v === 'function' ? v(props.formGroup.get('description') ?? '') : v,
          )}
        />
      </div>

      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>At higher levels — optional</span>
        <TextArea
          rows={2}
          text={() => props.formGroup.get('higherLevel') ?? ''}
          setText={(v) => props.formGroup.set(
            'higherLevel',
            typeof v === 'function' ? v(props.formGroup.get('higherLevel') ?? '') : v,
          )}
        />
      </div>
    </div>
  );
};
