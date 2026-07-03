import { Component, For, createSignal } from 'solid-js';
import { FormField, Select, Option, Input, Button, Chip } from 'coles-solid-library';
import { RaceLikeFormApi, makeAbilityRow } from '../../shared/raceLikeForm.shared';

const ABILITIES = ['STR','DEX','CON','INT','WIS','CHA'];

interface Props { api: RaceLikeFormApi }

const AbilityBonusesSection: Component<Props> = (p) => {
  const { abilityBonuses } = p.api;
  const [ability, setAbility] = createSignal('');
  const [value, setValue] = createSignal(1);
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
        <Button onClick={() => { if (ability()) { abilityBonuses.add(makeAbilityRow(ability(), value())); setAbility(''); setValue(1);} }} disabled={!ability()}>Add</Button>
      </div>
      <div class="chipsRowSingle" aria-label="Ability Bonuses">
        <For each={abilityBonuses.get()}>{(b, i) => <Chip value={`${b.name}+${b.value}`} remove={() => abilityBonuses.remove(i())} />}</For>
      </div>
    </div>
  );
};

export default AbilityBonusesSection;
