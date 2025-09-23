import { Component } from 'solid-js';
import { FormField, Input, Select, Option } from 'coles-solid-library';
import { itemsStore } from './itemsStore';
import { FlatCard } from '../../../../../shared/components/flatCard/flatCard';

interface Props { collapsed?: boolean; toggle(): void; selectionVersion: number; }

export const ArmorSection: Component<Props> = (p) => {
  const store = itemsStore;
  return (
    <FlatCard
      icon='shield'
      headerName='Armor Data'
      startOpen={true}
    >
      <div style={{ display:'flex', gap:'0.75rem', 'flex-wrap':'wrap' }}>
        <FormField name="Armor Category"><Input transparent value={store.state.form!.armorCategory || ''} onInput={e=>store.updateField('armorCategory', e.currentTarget.value)} /></FormField>
        <FormField name="Base AC"><Input type="number" transparent value={store.state.form!.armorClass?.base || 0} onInput={e=>store.mutate(d=> { d.armorClass = d.armorClass || { base:0, dexBonus:false, maxBonus:0 }; d.armorClass.base = parseInt(e.currentTarget.value||'0'); })} /></FormField>
        <FormField name="Dex Bonus?">
          <Select transparent value={store.state.form!.armorClass?.dexBonus ? 'yes':'no'} onChange={val=>store.mutate(d=> { d.armorClass = d.armorClass || { base:0, dexBonus:false, maxBonus:0 }; d.armorClass.dexBonus = val==='yes'; })}>
            <Option value="yes">Yes</Option>
            <Option value="no">No</Option>
          </Select>
        </FormField>
        <FormField name="Max Dex Bonus"><Input type="number" transparent value={store.state.form!.armorClass?.maxBonus || 0} onInput={e=>store.mutate(d=> { d.armorClass = d.armorClass || { base:0, dexBonus:false, maxBonus:0 }; d.armorClass.maxBonus = parseInt(e.currentTarget.value||'0'); })} /></FormField>
        <FormField name="Str Min"><Input type="number" transparent value={store.state.form!.strMin || 0} onInput={e=>store.updateField('strMin', parseInt(e.currentTarget.value||'0'))} /></FormField>
        <FormField name="Stealth Disadv.">
          <Select transparent value={store.state.form!.stealthDisadvantage ? 'yes':'no'} onChange={val=>store.updateField('stealthDisadvantage', val==='yes')}>
            <Option value="no">No</Option>
            <Option value="yes">Yes</Option>
          </Select>
        </FormField>
      </div>
    </FlatCard>
  );
};

export default ArmorSection;
