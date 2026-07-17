import { Component, For, Match, Show, Switch, runWithOwner } from 'solid-js';
import { Button, Chip, Input, Option, Select } from 'coles-solid-library';
import {
  FeatStepProps,
  MAX_PREREQS,
  PREREQ_TYPE_OPTIONS,
  PrerequisiteType,
} from './wizard.shared';
import { createPrereqBuilder } from './prereqBuilder';
import type { Prerequisite } from '../../../../../../models/generated';
import styles from '../../classes/wizard/classesWizard.module.scss';

const ABILITIES: { value: string; label: string }[] = [
  { value: 'STR', label: 'Strength' },
  { value: 'DEX', label: 'Dexterity' },
  { value: 'CON', label: 'Constitution' },
  { value: 'INT', label: 'Intelligence' },
  { value: 'WIS', label: 'Wisdom' },
  { value: 'CHA', label: 'Charisma' },
];

// Step 2 of the feat wizard: the old PrerequisiteSelector, restyled into a wizard card.
// The builder owns the in-progress requirement; committed ones live in the FormGroup.
export const StepPrerequisites: Component<FeatStepProps> = (props) => {
  const builder = createPrereqBuilder();
  const committed = () => (props.formGroup.get('prerequisites') as Prerequisite[]) ?? [];

  // coles Select fires onChange from a tracked effect; detach so signal writes (and
  // everything reacting to them) can't be captured by that scope.
  const detached = (write: () => void) => runWithOwner(null, write);

  return (
    <div class={styles.card}>
      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Requirement type</span>
        <Select
          transparent
          value={builder.selectedType()}
          onChange={(value) => detached(() => {
            const type = +value as PrerequisiteType;
            if (type === builder.selectedType()) return;
            builder.setSelectedType(type);
          })}
        >
          <For each={PREREQ_TYPE_OPTIONS}>{(option) => (
            <Option value={option.type}>{option.label}</Option>
          )}</For>
        </Select>
      </div>

      <Switch>
        <Match when={builder.selectedType() === PrerequisiteType.Stat}>
          <div class={styles.grid2}>
            <div class={styles.boxedField}>
              <span class={styles.cardLabel}>Ability</span>
              <Select
                transparent
                value={builder.keyName()}
                onChange={(value) => detached(() => builder.setKeyName(value))}
              >
                <For each={ABILITIES}>{(ability) => (
                  <Option value={ability.value}>{ability.label}</Option>
                )}</For>
              </Select>
            </div>
            <div class={styles.boxedField}>
              <span class={styles.cardLabel}>Minimum score</span>
              <Input
                type="number"
                min="1"
                value={builder.keyValue()}
                onChange={(e) => builder.setKeyValue(e.currentTarget.value)}
              />
            </div>
          </div>
        </Match>

        <Match when={builder.selectedType() === PrerequisiteType.Class}>
          <div class={styles.grid2}>
            <div class={styles.boxedField}>
              <span class={styles.cardLabel}>Class</span>
              <Select
                transparent
                value={builder.keyValue()}
                onChange={(value) => detached(() => builder.setKeyValue(value))}
              >
                <For each={builder.catalogs().classes}>{(name) => (
                  <Option value={name}>{name}</Option>
                )}</For>
              </Select>
            </div>
            <div class={styles.boxedField}>
              <span class={styles.cardLabel}>Level — optional</span>
              <Input
                type="number"
                min="1"
                placeholder="Any level"
                value={builder.classLevel()}
                onChange={(e) => builder.setClassLevel(e.currentTarget.value)}
              />
            </div>
          </div>
        </Match>

        <Match when={builder.selectedType() === PrerequisiteType.Level}>
          <div class={styles.boxedField}>
            <span class={styles.cardLabel}>Character level</span>
            <Input
              type="number"
              min="1"
              value={builder.keyValue()}
              onChange={(e) => builder.setKeyValue(e.currentTarget.value)}
            />
          </div>
        </Match>

        <Match when={builder.selectedType() === PrerequisiteType.Subclass}>
          <div class={styles.boxedField}>
            <span class={styles.cardLabel}>Subclass</span>
            <Select
              transparent
              value={builder.keyValue()}
              onChange={(value) => detached(() => builder.setKeyValue(value))}
            >
              <For each={builder.catalogs().subclasses}>{(encoded) => (
                <Option value={encoded}>{encoded.replace(':', ' / ')}</Option>
              )}</For>
            </Select>
          </div>
        </Match>

        <Match when={builder.selectedType() === PrerequisiteType.Feat}>
          <div class={styles.boxedField}>
            <span class={styles.cardLabel}>Feat</span>
            <Select
              transparent
              value={builder.keyValue()}
              onChange={(value) => detached(() => builder.setKeyValue(value))}
            >
              <For each={builder.catalogs().feats}>{(name) => (
                <Option value={name}>{name}</Option>
              )}</For>
            </Select>
          </div>
        </Match>

        <Match when={builder.selectedType() === PrerequisiteType.Race}>
          <div class={styles.boxedField}>
            <span class={styles.cardLabel}>Race</span>
            <Select
              transparent
              value={builder.keyValue()}
              onChange={(value) => detached(() => builder.setKeyValue(value))}
            >
              <For each={builder.catalogs().races}>{(name) => (
                <Option value={name}>{name}</Option>
              )}</For>
            </Select>
          </div>
        </Match>

        <Match when={builder.selectedType() === PrerequisiteType.Item}>
          <div class={styles.boxedField}>
            <span class={styles.cardLabel}>Item</span>
            <Select
              transparent
              value={builder.keyValue()}
              onChange={(value) => detached(() => builder.setKeyValue(value))}
            >
              <For each={builder.catalogs().items}>{(name) => (
                <Option value={name}>{name}</Option>
              )}</For>
            </Select>
          </div>
        </Match>

        <Match when={builder.selectedType() === PrerequisiteType.String}>
          <div class={styles.boxedField}>
            <span class={styles.cardLabel}>Requirement text</span>
            <Input
              type="text"
              placeholder="Enter prerequisite text"
              value={builder.keyValue()}
              onChange={(e) => builder.setKeyValue(e.currentTarget.value)}
            />
          </div>
        </Match>
      </Switch>

      <Button
        theme="primary"
        disabled={committed().length >= MAX_PREREQS}
        onClick={() => builder.addPrereq(props.formGroup)}
      >
        Add requirement
      </Button>

      <div class={styles.boxedField}>
        <span class={styles.cardLabel}>Added requirements</span>
        <div class={styles.chipRow}>
          <For each={committed()}>{(pre, i) => (
            <Chip
              key={`${PrerequisiteType[pre.type]}`}
              value={pre.value}
              remove={() => builder.removePrereq(props.formGroup, i())}
            />
          )}</For>
        </div>
        <Show when={committed().length === 0}>
          <div class={styles.banner}>
            No prerequisites — anyone can take this feat.
          </div>
        </Show>
        <Show when={committed().length >= MAX_PREREQS}>
          <div class={`${styles.banner} ${styles.bannerWarn}`}>
            Limit of {MAX_PREREQS} prerequisites reached — remove one to add another.
          </div>
        </Show>
      </div>
    </div>
  );
};
