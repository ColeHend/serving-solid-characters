import { Component } from 'solid-js';
import { FormField, Input, Select, Option, TextArea } from 'coles-solid-library';
import { itemsStore } from './itemsStore';
import { FlatCard } from '../../../../../shared/components/flatCard/flatCard';

interface Props { collapsed?: boolean; toggle(): void; }

export const IdentitySection: Component<Props> = (p) => {
  const store = itemsStore;
  return (
    <FlatCard
      icon="identity_platform"
      headerName='Identity'
      startOpen={true}
      transparent
    >
      <FormField name="Name">
        <Input transparent value={store.state.form!.name} onInput={e=>store.updateField('name', e.currentTarget.value)} />
      </FormField>
      <FormField name="Kind">
        <Select transparent value={store.state.form!.kind} onChange={val => store.setKind(val as any)}>
          <Option value="Item">Item</Option>
          <Option value="Weapon">Weapon</Option>
          <Option value="Armor">Armor</Option>
        </Select>
      </FormField>
      <FormField name="Description">
        <TextArea
          transparent
          rows={5}
          text={() => store.state.form!.desc}
          setText={((v: string) => store.updateField('desc', v)) as any}
        />
      </FormField>
      <div style={{ display:'flex', gap:'0.75rem' }}>
        <FormField name="Cost Qty"><Input type="number" transparent value={store.state.form!.cost.quantity} onInput={e=>store.mutate(d=> d.cost.quantity = parseInt(e.currentTarget.value||'0'))} /></FormField>
        <FormField name="Unit"><Input transparent value={store.state.form!.cost.unit} onInput={e=>store.mutate(d=> d.cost.unit = e.currentTarget.value)} /></FormField>
        <FormField name="Weight"><Input type="number" transparent value={store.state.form!.weight || 0} onInput={e=>store.updateField('weight', parseInt(e.currentTarget.value||'0'))} /></FormField>
      </div>
    </FlatCard>
  );
};

export default IdentitySection;
