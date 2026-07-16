import { Component, For } from 'solid-js';
import { Icon, Input } from 'coles-solid-library';
import { Chat, Handyman, Security, Shield, Swords } from 'coles-solid-library/icons';
import { ARMOR, LANGUAGES, SKILLS, StepProps, TOOLS, WEAPONS, toggleInArray } from './wizard.shared';
import type { BackgroundForm } from './wizard.shared';
import { ToggleChip } from '../../classes/wizard/toggleChip';
import { CustomEntryInput } from '../../classes/wizard/customEntryInput';
import wiz from '../../classes/wizard/classesWizard.module.scss';
import styles from '../../classes/wizard/stepProficiencies.module.scss';

type ProfField = 'skillProfs' | 'toolProfs' | 'armorProfs' | 'weaponProfs';

const PROF_GROUPS: { field: ProfField; label: string; icon: string; options: string[] }[] = [
  { field: 'skillProfs', label: 'SKILLS', icon: Security, options: SKILLS },
  { field: 'toolProfs', label: 'TOOLS', icon: Handyman, options: TOOLS },
  { field: 'armorProfs', label: 'ARMOR', icon: Shield, options: ARMOR },
  { field: 'weaponProfs', label: 'WEAPONS', icon: Swords, options: WEAPONS },
];

/**
 * Proficiencies & Languages step — four toggle-chip proficiency groups plus the
 * language offer (toggle chips + free-form entries + how many a player picks).
 */
export const StepProficienciesLanguages: Component<StepProps> = (props) => {
  const current = (field: keyof BackgroundForm) => (props.formGroup.get(field) as string[]) ?? [];

  // Union of the canonical option list with any already-stored values that aren't in it
  // (prefilled SRD/homebrew data, custom entries), so unknown values still show as chips.
  const withStored = (options: string[], stored: string[]) =>
    [...options, ...stored.filter(v => !options.includes(v))];

  const toggle = (field: ProfField, value: string) =>
    props.formGroup.set(field, toggleInArray(current(field), value));

  const languages = () => current('languages');
  const langAmount = () => (props.formGroup.get('langChoiceAmount') as number) || 0;

  const addCustomLanguage = (text: string) => {
    if (languages().includes(text)) return;
    props.formGroup.set('languages', [...languages(), text]);
  };

  return (
    <div class={styles.step}>
      <div class={wiz.card}>
        <div class={wiz.grid2}>
          <For each={PROF_GROUPS}>{(group) => (
            <div class={styles.group}>
              <div class={wiz.sectionHead}>
                <Icon icon={group.icon} size={'small'} />
                <b>{group.label}</b>
              </div>
              <div class={wiz.chipRow}>
                <For each={withStored(group.options, current(group.field))}>{(option) => (
                  <ToggleChip
                    label={option}
                    selected={current(group.field).includes(option)}
                    onToggle={() => toggle(group.field, option)}
                  />
                )}</For>
              </div>
            </div>
          )}</For>
        </div>
      </div>

      <div class={wiz.card}>
        <div class={`${wiz.sectionHead} ${styles.headRow}`}>
          <Icon icon={Chat} size={'small'} />
          <b>LANGUAGES</b>
          <span class={`${languages().length ? wiz.counterGood : wiz.counterMuted} ${styles.pushRight}`}>
            {languages().length} offered
          </span>
        </div>
        <div class={wiz.chipRow}>
          <For each={withStored(LANGUAGES, languages())}>{(lang) => (
            <ToggleChip
              label={lang}
              selected={languages().includes(lang)}
              onToggle={() => props.formGroup.set('languages', toggleInArray(languages(), lang))}
            />
          )}</For>
          <CustomEntryInput onCommit={addCustomLanguage} placeholder="e.g. Thieves' Cant" />
        </div>
        <div class={styles.skillHead}>
          <b>PLAYERS CHOOSE</b>
          <span class={styles.numField}>
            <Input
              type="number"
              min={0}
              value={langAmount()}
              onInput={(e) => props.formGroup.set('langChoiceAmount', Math.max(0, +e.currentTarget.value || 0))}
            />
          </span>
          <span class={wiz.counterMuted}>of the offered languages. 0 = they learn all of them.</span>
        </div>
      </div>
    </div>
  );
};
