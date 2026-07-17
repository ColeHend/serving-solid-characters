import { Component, For } from 'solid-js';
import { TextArea } from 'coles-solid-library';
import { RaceForm, StepProps } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

type FlavorKey = 'descAge' | 'descAlignment' | 'descSize' | 'descLanguage' | 'descAbilities';

const FLAVOR_FIELDS: { key: FlavorKey; label: string }[] = [
  { key: 'descAge', label: 'Age — how long do they live?' },
  { key: 'descAlignment', label: 'Alignment — which way do they lean?' },
  { key: 'descSize', label: 'Size — what do they look like?' },
  { key: 'descLanguage', label: 'Languages — how do they sound?' },
  { key: 'descAbilities', label: 'Abilities — a line about their bonuses' },
];

// Flavor step — the optional lore paragraphs shown on the race page, persisted
// 1:1 into the descriptions map.
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
            rows={2}
            text={() => (props.formGroup.get(field.key as keyof RaceForm) as string) ?? ''}
            setText={setText(field.key)}
          />
        </div>
      )}</For>
    </div>
  );
};
