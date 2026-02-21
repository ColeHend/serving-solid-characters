import { Component, For, Show } from 'solid-js';
import { FormField, Input, Button } from 'coles-solid-library';
import { itemsStore } from './itemsStore';
import { FlatCard } from '../../../../../shared/components/flatCard/flatCard';

interface Props { collapsed?: boolean; toggle(): void; selectionVersion: number; }

export const WeaponSection: Component<Props> = (p) => {
  const store = itemsStore;

  function addWeaponDamage() { store.mutate(d => { if (!d.damage) d.damage = []; d.damage = [...d.damage, { dice: '1d6', type: 'slashing', bonus: 0 }]; }); }
  function updateDamage(i: number, field: 'dice'|'type'|'bonus', value: string) {
    store.mutate(d => { if (!d.damage) return; const next = [...d.damage]; const target = { ...next[i] }; (target as any)[field] = field === 'bonus' ? parseInt(value||'0') : value; next[i] = target; d.damage = next; });
  }
  function removeDamage(i: number) { store.mutate(d => { if (!d.damage) return; d.damage = d.damage.filter((_,idx)=>idx!==i); }); }

  return (
    <FlatCard
     icon='swords'
     headerName='Weapon Data'
     startOpen={true}
     transparent
    >
      <div style={{ display:'flex', gap:'0.75rem', 'flex-wrap':'wrap' }}>
        <FormField name="Weapon Category"><Input transparent value={store.state.form!.weaponCategory || ''} onInput={e=>store.updateField('weaponCategory', e.currentTarget.value)} /></FormField>
        <FormField name="Weapon Range"><Input transparent value={store.state.form!.weaponRange || ''} onInput={e=>store.updateField('weaponRange', e.currentTarget.value)} /></FormField>
        <FormField name="Normal Range"><Input type="number" transparent value={store.state.form!.range?.normal || 0} onInput={e=>store.mutate(d=> { d.range = d.range || { normal:0, long:0 }; d.range.normal = parseInt(e.currentTarget.value||'0'); })} /></FormField>
        <FormField name="Long Range"><Input type="number" transparent value={store.state.form!.range?.long || 0} onInput={e=>store.mutate(d=> { d.range = d.range || { normal:0, long:0 }; d.range.long = parseInt(e.currentTarget.value||'0'); })} /></FormField>
      </div>
      <div>
        <div style={{ display:'flex', 'align-items':'center', gap:'0.5rem' }}>
          <h5 style={{ margin:0 }}>Damage</h5>
          <Button onClick={addWeaponDamage}>+ Add</Button>
        </div>
        <Show when={store.state.form!.damage?.length}>
            <For each={store.state.form!.damage}>{(d, i) => (
              <div style={{ display:'flex', gap:'0.5rem', 'align-items':'center' }}>
                <Input transparent value={d.dice} onInput={e=>updateDamage(i(), 'dice', e.currentTarget.value)} />
                <Input transparent value={d.type} onInput={e=>updateDamage(i(), 'type', e.currentTarget.value)} />
                <Input type="number" transparent value={d.bonus || 0} onInput={e=>updateDamage(i(), 'bonus', e.currentTarget.value)} />
                <Button onClick={()=>removeDamage(i())}>x</Button>
              </div>
            )}</For>
        </Show>
        <Show when={!store.state.form!.damage || store.state.form!.damage.length === 0}><div style={{ 'font-size':'0.8rem', opacity:0.7 }}>No damage entries</div></Show>
      </div>
    </FlatCard>
  );
};

export default WeaponSection;
