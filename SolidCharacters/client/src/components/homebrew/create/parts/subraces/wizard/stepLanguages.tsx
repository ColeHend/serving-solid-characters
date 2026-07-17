import { Component, For } from 'solid-js';
import { Icon, Input } from 'coles-solid-library';
import { Chat } from 'coles-solid-library/icons';
import { LANGUAGES, StepProps, toggleInArray } from './wizard.shared';
import { ToggleChip } from '../../classes/wizard/toggleChip';
import { CustomEntryInput } from '../../classes/wizard/customEntryInput';
import wiz from '../../classes/wizard/classesWizard.module.scss';
import styles from '../../classes/wizard/stepProficiencies.module.scss';

/**
 * Languages step — the languages the lineage adds on top of the parent race's,
 * plus an optional player choice (how many extra, and from which options).
 */
export const StepLanguages: Component<StepProps> = (props) => {
  const languages = () => (props.formGroup.get('languages') as string[]) ?? [];
  const options = () => (props.formGroup.get('langChoiceOptions') as string[]) ?? [];
  const amount = () => (props.formGroup.get('langChoiceAmount') as number) || 0;

  // Union of the canonical language list with any already-stored values that aren't
  // in it (prefilled homebrew data, custom entries), so unknown values still show
  // as chips.
  const withStored = (stored: string[]) =>
    [...LANGUAGES, ...stored.filter(v => !LANGUAGES.includes(v))];

  const addCustom = (field: 'languages' | 'langChoiceOptions', current: string[]) => (text: string) => {
    if (current.includes(text)) return;
    props.formGroup.set(field, [...current, text]);
  };

  return (
    <div class={styles.step}>
      <div class={wiz.card}>
        <div class={`${wiz.sectionHead} ${styles.headRow}`}>
          <Icon icon={Chat} size={'small'} />
          <b>EVERY MEMBER SPEAKS</b>
          <span class={`${languages().length ? wiz.counterGood : wiz.counterMuted} ${styles.pushRight}`}>
            {languages().length} added
          </span>
        </div>
        <div class={wiz.chipRow}>
          <For each={withStored(languages())}>{(lang) => (
            <ToggleChip
              label={lang}
              selected={languages().includes(lang)}
              onToggle={() => props.formGroup.set('languages', toggleInArray(languages(), lang))}
            />
          )}</For>
          <CustomEntryInput onCommit={addCustom('languages', languages())} placeholder="e.g. Thieves' Cant" />
        </div>
      </div>

      <div class={wiz.card}>
        <div class={styles.skillHead}>
          <b>PLAYERS CHOOSE</b>
          <span class={styles.numField}>
            <Input
              type="number"
              min={0}
              value={amount()}
              onInput={(e) => props.formGroup.set('langChoiceAmount', Math.max(0, +e.currentTarget.value || 0))}
            />
          </span>
          <span class={wiz.counterMuted}>extra language{amount() === 1 ? '' : 's'}. 0 = no choice.</span>
        </div>
        <div class={`${wiz.sectionHead} ${styles.headRow}`}>
          <b>FROM THESE OPTIONS</b>
          <span class={`${wiz.counterMuted} ${styles.pushRight}`}>
            {options().length ? `${options().length} offered` : 'none = any language'}
          </span>
        </div>
        <div class={wiz.chipRow}>
          <For each={withStored(options())}>{(lang) => (
            <ToggleChip
              label={lang}
              selected={options().includes(lang)}
              onToggle={() => props.formGroup.set('langChoiceOptions', toggleInArray(options(), lang))}
            />
          )}</For>
          <CustomEntryInput onCommit={addCustom('langChoiceOptions', options())} placeholder="e.g. Primordial" />
        </div>
      </div>
    </div>
  );
};
