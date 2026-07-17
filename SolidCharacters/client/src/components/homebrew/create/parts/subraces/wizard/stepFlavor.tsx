import { Component, For } from 'solid-js';
import { TextArea } from 'coles-solid-library';
import { StepProps, SubraceForm } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

type FlavorKey = 'desc' | 'descAge' | 'descAlignment' | 'descSize' | 'descLanguage' | 'descAbilities';

const FLAVOR_FIELDS: { key: FlavorKey; label: string; rows: number }[] = [
  { key: 'desc', label: 'Description — what is this lineage?', rows: 3 },
  { key: 'descAge', label: 'Age — how long do they live?', rows: 2 },
  { key: 'descAlignment', label: 'Alignment — which way do they lean?', rows: 2 },
  { key: 'descSize', label: 'Size — what do they look like?', rows: 2 },
  { key: 'descLanguage', label: 'Languages — how do they sound?', rows: 2 },
  { key: 'descAbilities', label: 'Abilities — a line about their bonuses', rows: 2 },
];

// Flavor step — the subrace's main description plus the optional lore
// paragraphs, persisted 1:1 into the descriptions map.
export const StepFlavor: Component<StepProps> = (props) => {
  const setText = (key: FlavorKey) => (v: string | ((prev: string) => string)) =>
    props.formGroup.set(
      key,
      typeof v === 'function' ? v((props.formGroup.get(key) as string) ?? '') : v,
    );

  return (
    <div class={styles.card}>
      <For each={FLAVOR_FIELDS}>{(field) => (
        <div class={styles.boxedField}>
          <span class={styles.cardLabel}>{field.label}</span>
          <TextArea
            rows={field.rows}
            text={() => (props.formGroup.get(field.key as keyof SubraceForm) as string) ?? ''}
            setText={setText(field.key)}
          />
        </div>
      )}</For>
    </div>
  );
};
