import { Component, For, Match, Show, Switch, createMemo } from 'solid-js';
import { itemsStore } from '../itemsStore';
import { BUILT_IN_TAGS, StepProps } from './wizard.shared';
import { WeaponDetails } from './weaponDetails';
import { ArmorDetails } from './armorDetails';
import { ToggleChip } from '../../classes/wizard/toggleChip';
import sharedStyles from '../../classes/wizard/classesWizard.module.scss';
import styles from './itemsWizard.module.scss';

// Step 2 of the items wizard: kind-specific statistics followed by the tag picker.
// Plain items have neither — tags are weapon/armor property keywords, so the picker
// only renders for those kinds.
export const StepDetails: Component<StepProps> = () => {
  const store = itemsStore;

  // Union so tags parsed off SRD items (outside the built-in list) stay visible and removable.
  const allTags = createMemo(() => {
    const current = store.state.form?.tags ?? [];
    return [...BUILT_IN_TAGS, ...current.filter(t => !BUILT_IN_TAGS.includes(t))];
  });
  const toggleTag = (tag: string) =>
    store.mutate(d => {
      d.tags = d.tags.includes(tag) ? d.tags.filter(t => t !== tag) : [...d.tags, tag];
    });

  return (
    <div class={styles.step}>
      <Switch>
        <Match when={store.state.form!.kind === 'Weapon'}><WeaponDetails /></Match>
        <Match when={store.state.form!.kind === 'Armor'}><ArmorDetails /></Match>
        <Match when={true}>
          <div class={sharedStyles.banner}>
            <span>Plain gear needs no combat statistics — describe it on the Identity step and add any special features next.</span>
          </div>
        </Match>
      </Switch>

      <Show when={store.state.form!.kind !== 'Item'}>
        <div class={sharedStyles.card}>
          <div class={sharedStyles.sectionHead}>
            <span class={sharedStyles.cardLabel}>
              Tags — {store.state.form!.tags.length} selected
            </span>
          </div>
          <div class={sharedStyles.chipRow}>
            <For each={allTags()}>
              {(tag) => (
                <ToggleChip
                  label={tag}
                  selected={store.state.form!.tags.includes(tag)}
                  onToggle={() => toggleTag(tag)}
                />
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
};
