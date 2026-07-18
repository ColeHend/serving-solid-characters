import { Component } from 'solid-js';
import { Checkbox, Input } from 'coles-solid-library';
import { itemsStore } from '../itemsStore';
import sharedStyles from '../../classes/wizard/classesWizard.module.scss';

// Armor panel of the Details step: category, AC block and requirements.
export const ArmorDetails: Component = () => {
  const store = itemsStore;
  const mutateAc = (patch: (ac: { base: number; dexBonus: boolean; maxBonus: number }) => void) =>
    store.mutate(d => {
      d.armorClass = d.armorClass || { base: 10, dexBonus: true, maxBonus: 0 };
      patch(d.armorClass);
    });

  return (
    <div class={sharedStyles.card}>
      <span class={sharedStyles.cardLabel}>Armor statistics</span>
      <div class={sharedStyles.grid2}>
        <div class={sharedStyles.boxedField}>
          <span class={sharedStyles.cardLabel}>Category</span>
          <Input
            transparent
            value={store.state.form!.armorCategory || ''}
            onInput={e => store.updateField('armorCategory', e.currentTarget.value)}
            placeholder="Light, Medium, Heavy..."
          />
        </div>
        <div class={sharedStyles.boxedField}>
          <span class={sharedStyles.cardLabel}>Base AC</span>
          <Input
            type="number"
            transparent
            value={store.state.form!.armorClass?.base || 0}
            onChange={e => mutateAc(ac => ac.base = parseInt(e.currentTarget.value || '0'))}
          />
        </div>
        <div class={sharedStyles.boxedField}>
          <span class={sharedStyles.cardLabel}>Max Dex bonus (0 = unlimited)</span>
          <Input
            type="number"
            transparent
            value={store.state.form!.armorClass?.maxBonus || 0}
            onChange={e => mutateAc(ac => ac.maxBonus = parseInt(e.currentTarget.value || '0'))}
          />
        </div>
        <div class={sharedStyles.boxedField}>
          <span class={sharedStyles.cardLabel}>Strength minimum</span>
          <Input
            type="number"
            transparent
            value={store.state.form!.strMin || 0}
            onChange={e => store.updateField('strMin', parseInt(e.currentTarget.value || '0'))}
          />
        </div>
      </div>
      <div class={sharedStyles.chipRow}>
        <Checkbox
          label="Add Dexterity modifier to AC"
          checked={!!store.state.form!.armorClass?.dexBonus}
          onChange={(v: boolean) => mutateAc(ac => ac.dexBonus = v)}
        />
        <Checkbox
          label="Stealth disadvantage"
          checked={!!store.state.form!.stealthDisadvantage}
          onChange={(v: boolean) => store.updateField('stealthDisadvantage', v)}
        />
      </div>
    </div>
  );
};
