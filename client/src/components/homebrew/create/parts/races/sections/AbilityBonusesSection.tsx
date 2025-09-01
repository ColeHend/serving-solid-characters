import { Component, For, createSignal } from 'solid-js';
import { FormField, Select, Option, Input, Button, Chip } from 'coles-solid-library';
import { racesStore } from '../racesStore';

const ABILITIES = ['STR','DEX','CON','INT','WIS','CHA'];

interface Props {}

const AbilityBonusesSection: Component<Props> = () => {
  const store = racesStore;
  const [ability, setAbility] = createSignal('');
  const [value, setValue] = createSignal(1);
  const bonuses = () => store.activeRace()?.abilityBonuses || [];
  return (
    <div>
      <h3 class="visuallyHidden">Ability Bonuses</h3>
      {/* Dense row: Ability | Value | Add */}
  <div class="inlineRow inlineDense">
        <FormField name="Ability">
          <Select transparent value={ability()} onChange={v => setAbility(v)}>
            <Option value="">-- ability --</Option>
            <For each={ABILITIES}>{a => <Option value={a}>{a}</Option>}</For>
          </Select>
        </FormField>
        <FormField name="Value">
          <Input type="number" min={1} max={4} transparent style={{ width: '70px' }} value={value()} onInput={e => setValue(parseInt(e.currentTarget.value||'1'))} />
        </FormField>
        <Button onClick={() => { if (ability()) { store.addAbilityBonus(ability(), value()); setAbility(''); setValue(1);} }} disabled={!ability()}>Add</Button>
      </div>
      <div class="chipsRowSingle" aria-label="Ability Bonuses">
        <For each={bonuses()}>{b => <Chip value={`${b.name}+${b.value}`} remove={() => store.removeAbilityBonus(b.name)} />}</For>
      </div>
    </div>
  );
};

export default AbilityBonusesSection;