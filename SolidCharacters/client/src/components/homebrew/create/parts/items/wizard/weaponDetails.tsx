import { Component, For, Show } from 'solid-js';
import { Icon, Input } from 'coles-solid-library';
import { Delete } from 'coles-solid-library/icons';
import { itemsStore } from '../itemsStore';
import sharedStyles from '../../classes/wizard/classesWizard.module.scss';
import featureStyles from '../../classes/wizard/stepFeatures.module.scss';

// Weapon panel of the Details step: category/range fields plus the damage-entry editor.
// Damage rows reuse the class wizard's advanced-editor row styling (.featureRow + .advInput).
export const WeaponDetails: Component = () => {
  const store = itemsStore;

  const addDamage = () =>
    store.mutate(d => { d.damage = [...(d.damage ?? []), { dice: '1d6', type: 'slashing', bonus: 0 }]; });
  const updateDamage = (i: number, field: 'dice' | 'type' | 'bonus', value: string) =>
    store.mutate(d => {
      if (!d.damage) return;
      const next = [...d.damage];
      next[i] = { ...next[i], [field]: field === 'bonus' ? parseInt(value || '0') : value };
      d.damage = next;
    });
  const removeDamage = (i: number) =>
    store.mutate(d => { d.damage = (d.damage ?? []).filter((_, idx) => idx !== i); });

  return (
    <div class={sharedStyles.card}>
      <span class={sharedStyles.cardLabel}>Weapon statistics</span>
      <div class={sharedStyles.grid2}>
        <div class={sharedStyles.boxedField}>
          <span class={sharedStyles.cardLabel}>Category</span>
          <Input
            transparent
            value={store.state.form!.weaponCategory || ''}
            onInput={e => store.updateField('weaponCategory', e.currentTarget.value)}
            placeholder="Simple, Martial..."
          />
        </div>
        <div class={sharedStyles.boxedField}>
          <span class={sharedStyles.cardLabel}>Weapon range</span>
          <Input
            transparent
            value={store.state.form!.weaponRange || ''}
            onInput={e => store.updateField('weaponRange', e.currentTarget.value)}
            placeholder="Melee, Ranged..."
          />
        </div>
        <div class={sharedStyles.boxedField}>
          <span class={sharedStyles.cardLabel}>Normal range (ft)</span>
          <Input
            type="number"
            transparent
            value={store.state.form!.range?.normal || 0}
            onChange={e => store.mutate(d => {
              d.range = d.range || { normal: 0, long: 0 };
              d.range.normal = parseInt(e.currentTarget.value || '0');
            })}
          />
        </div>
        <div class={sharedStyles.boxedField}>
          <span class={sharedStyles.cardLabel}>Long range (ft)</span>
          <Input
            type="number"
            transparent
            value={store.state.form!.range?.long || 0}
            onChange={e => store.mutate(d => {
              d.range = d.range || { normal: 0, long: 0 };
              d.range.long = parseInt(e.currentTarget.value || '0');
            })}
          />
        </div>
      </div>

      <div class={featureStyles.cardHead}>
        <span class={sharedStyles.cardLabel}>
          Damage — {store.state.form!.damage?.length ?? 0} {(store.state.form!.damage?.length ?? 0) === 1 ? 'entry' : 'entries'}
        </span>
        <span class={sharedStyles.counterMuted}>dice like 1d8</span>
      </div>
      <div class={featureStyles.featureList}>
        <Show
          when={store.state.form!.damage?.length}
          fallback={<div class={featureStyles.empty}>No damage entries yet — a weapon needs at least one.</div>}
        >
          <For each={store.state.form!.damage}>{(dmg, i) => (
            <div class={featureStyles.featureRow}>
              <div class={`${featureStyles.advInput} ${featureStyles.advInputNarrow}`}>
                <Input transparent value={dmg.dice} onInput={e => updateDamage(i(), 'dice', e.currentTarget.value)} placeholder="1d6" />
              </div>
              <div class={`${featureStyles.advInput} ${featureStyles.advInputGrow}`}>
                <Input transparent value={dmg.type} onInput={e => updateDamage(i(), 'type', e.currentTarget.value)} placeholder="slashing" />
              </div>
              <div class={`${featureStyles.advInput} ${featureStyles.advInputNarrow}`}>
                <Input type="number" transparent value={dmg.bonus || 0} onChange={e => updateDamage(i(), 'bonus', e.currentTarget.value)} />
              </div>
              <button
                type="button"
                class={featureStyles.deleteBtn}
                aria-label={`Delete damage entry ${i() + 1}`}
                onClick={() => removeDamage(i())}
              >
                <Icon icon={Delete} size={'small'} />
              </button>
            </div>
          )}</For>
        </Show>
      </div>
      <div class={featureStyles.actions}>
        <button type="button" class={featureStyles.ghostBtn} onClick={addDamage}>
          Add damage entry
        </button>
      </div>
    </div>
  );
};
