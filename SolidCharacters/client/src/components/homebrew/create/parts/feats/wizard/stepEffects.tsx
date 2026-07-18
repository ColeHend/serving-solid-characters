import { Component, For, Show, createMemo } from 'solid-js';
import { Button, Chip } from 'coles-solid-library';
import type { FeatureMetadata } from '../../../../../../models/generated';
import {
  FeatStepProps,
  commandChipLabel,
  formMads,
  validateStoredCommand,
} from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Step 3 of the feat wizard: the mads character-change commands. Authoring happens in
// the shared FeaturesPopup (opened by the shell); this card shows what's attached.
export const StepEffects: Component<FeatStepProps> = (props) => {
  const mads = () => formMads(props.formGroup);
  const errors = createMemo(() => mads().flatMap(mad => validateStoredCommand(mad)));

  const removeMad = (index: number) => {
    const metadata = props.formGroup.get('metadata') as FeatureMetadata | undefined;
    if (!metadata) return;
    props.formGroup.set('metadata', {
      ...metadata,
      mads: (metadata.mads ?? []).filter((_, i) => i !== index),
    });
  };

  return (
    <div class={styles.card}>
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Effects on the character</span>
        <div class={styles.chipRow}>
          <For each={mads()}>{(mad, i) => (
            <Chip
              key="Effect"
              value={commandChipLabel(mad)}
              remove={() => removeMad(i())}
            />
          )}</For>
        </div>
        <Show when={mads().length === 0}>
          <div class={styles.banner}>
            No effects yet — effects change the character sheet automatically when this feat is taken.
          </div>
        </Show>
        <Show when={errors().length > 0}>
          <div class={`${styles.banner} ${styles.bannerWarn}`}>
            {errors()[0]}
          </div>
        </Show>
        <Button theme="primary" onClick={() => props.openEffectsEditor()}>
          {mads().length ? 'Edit effects' : 'Add effects'}
        </Button>
      </div>
    </div>
  );
};
