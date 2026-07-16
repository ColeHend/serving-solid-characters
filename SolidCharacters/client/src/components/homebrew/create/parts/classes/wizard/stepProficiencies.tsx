import { Component, For, createMemo } from 'solid-js';
import { Input, Checkbox, Icon } from 'coles-solid-library';
import { Shield, Swords, Handyman, Security } from 'coles-solid-library/icons';
import type { Stat } from '../../../../../../shared/models/stats';
import { SKILLS, TOOLS } from '../../backgrounds/constants';
import { ToggleChip } from './toggleChip';
import {
  ARMOR_OPTIONS,
  WEAPON_OPTIONS,
  ALL_STATS,
  STAT_ABBR,
  MAX_SAVING_THROWS,
  toggleInArray,
} from './wizard.shared';
import type { StepProps } from './wizard.shared';
import shared from './classesWizard.module.scss';
import styles from './stepProficiencies.module.scss';

type StrListField = 'armorProficiencies' | 'weaponProficiencies' | 'toolProficiencies';

export const StepProficiencies: Component<StepProps> = (props) => {
  // Reactive readers -------------------------------------------------------
  const armor = () => (props.formGroup.get('armorProficiencies') as string[]) ?? [];
  const weapons = () => (props.formGroup.get('weaponProficiencies') as string[]) ?? [];
  const tools = () => (props.formGroup.get('toolProficiencies') as string[]) ?? [];
  const saves = () => (props.formGroup.get('savingThrows') as Stat[]) ?? [];
  const skillChoices = () => (props.formGroup.get('skillChoices') as string[]) ?? [];

  // Union of the canonical option list with any already-stored values that
  // aren't in it (prefilled SRD/homebrew data), so unknown values still show
  // as selectable chips. Canonical order first, then appended unknowns.
  const unionChips = (canonical: string[], stored: () => string[]) =>
    createMemo(() => {
      const cur = stored();
      const extra = cur.filter((v) => !canonical.includes(v));
      return [...canonical, ...extra];
    });

  const armorChips = unionChips(ARMOR_OPTIONS, armor);
  const weaponChips = unionChips(WEAPON_OPTIONS, weapons);
  const toolChips = unionChips(TOOLS, tools);

  const saveCount = () => saves().length;

  // Mutators (always replace arrays) --------------------------------------
  const toggleStr = (field: StrListField, value: string) => {
    const cur = (props.formGroup.get(field) as string[]) ?? [];
    props.formGroup.set(field, toggleInArray(cur, value));
  };

  const toggleSave = (stat: Stat) => {
    props.formGroup.set('savingThrows', toggleInArray(saves(), stat, MAX_SAVING_THROWS));
  };

  const toggleSkill = (skill: string) => {
    props.formGroup.set('skillChoices', toggleInArray(skillChoices(), skill));
  };

  const onSkillNum = (e: Event & { currentTarget: HTMLInputElement }) => {
    const n = parseInt(e.currentTarget.value, 10);
    props.formGroup.set('skillChoiceNum', Number.isNaN(n) ? 0 : n);
  };

  return (
    <div class={styles.step}>
      {/* Card 1 — broad proficiency categories + saving throws */}
      <div class={shared.card}>
        <div class={shared.grid2}>
          {/* ARMOR */}
          <div class={styles.group}>
            <div class={shared.sectionHead}>
              <Icon icon={Shield} size="small" />
              <span class={shared.cardLabel}>Armor</span>
            </div>
            <div class={shared.chipRow}>
              <For each={armorChips()}>
                {(opt) => (
                  <ToggleChip
                    label={opt}
                    selected={armor().includes(opt)}
                    onToggle={() => toggleStr('armorProficiencies', opt)}
                  />
                )}
              </For>
            </div>
          </div>

          {/* WEAPONS */}
          <div class={styles.group}>
            <div class={shared.sectionHead}>
              <Icon icon={Swords} size="small" />
              <span class={shared.cardLabel}>Weapons</span>
            </div>
            <div class={shared.chipRow}>
              <For each={weaponChips()}>
                {(opt) => (
                  <ToggleChip
                    label={opt}
                    selected={weapons().includes(opt)}
                    onToggle={() => toggleStr('weaponProficiencies', opt)}
                  />
                )}
              </For>
            </div>
          </div>

          {/* TOOLS */}
          <div class={styles.group}>
            <div class={shared.sectionHead}>
              <Icon icon={Handyman} size="small" />
              <span class={shared.cardLabel}>Tools</span>
            </div>
            <div class={shared.chipRow}>
              <For each={toolChips()}>
                {(opt) => (
                  <ToggleChip
                    label={opt}
                    selected={tools().includes(opt)}
                    onToggle={() => toggleStr('toolProficiencies', opt)}
                  />
                )}
              </For>
            </div>
          </div>

          {/* SAVING THROWS */}
          <div class={styles.group}>
            <div class={`${shared.sectionHead} ${styles.headRow}`}>
              <Icon icon={Security} size="small" />
              <span class={shared.cardLabel}>Saving Throws</span>
              <span
                class={`${saveCount() === MAX_SAVING_THROWS ? shared.counterGood : shared.counterMuted} ${styles.pushRight}`}
              >
                {saveCount()} of {MAX_SAVING_THROWS} picked
              </span>
            </div>
            <div class={shared.chipRow}>
              <For each={ALL_STATS}>
                {(stat, i) => (
                  <ToggleChip
                    label={STAT_ABBR[i()]}
                    selected={saves().includes(stat)}
                    onToggle={() => toggleSave(stat)}
                    disabled={!saves().includes(stat) && saveCount() >= MAX_SAVING_THROWS}
                  />
                )}
              </For>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2 — skills the player chooses from */}
      <div class={shared.card}>
        <div class={styles.skillHead}>
          <b>SKILLS</b>
          <span class={shared.counterMuted}>players choose</span>
          <span class={styles.numField}>
            <Input
              type="number"
              min={0}
              max={18}
              value={props.formGroup.get('skillChoiceNum') as number}
              onChange={onSkillNum}
            />
          </span>
          <span class={shared.counterMuted}>
            from the checked list · {skillChoices().length} checked
          </span>
        </div>
        <div class={styles.skillGrid}>
          <For each={SKILLS}>
            {(skill) => (
              <Checkbox
                label={skill}
                checked={skillChoices().includes(skill)}
                onChange={() => toggleSkill(skill)}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
