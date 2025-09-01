import { For, Show } from "solid-js";
import { Checkbox, Select, Option, Input, Button, Chip, FormGroup } from "coles-solid-library";
import styles from './subclasses.module.scss';
import { Spell } from "../../../../../models";
import { SpellsKnown } from './SpellsKnown';

interface SpellcastingSectionProps<T extends {
  hasCasting: boolean; casterType: string; castingModifier: string; spellsKnownCalc: SpellsKnown;
  halfCasterRoundUp: boolean; hasCantrips: boolean; hasRitualCasting: boolean; spellsKnownPerLevel: {level:number,amount:number}[];
  spellcastingInfo: {name:string,desc:string[]}[]; subclassSpells: Spell[]; selectedSpellName: string;
}> {
  form: FormGroup<T>;
  toAddKnownLevel: () => number;
  setToAddKnownLevel: (v:number)=>void;
  toAddKnownAmount: () => number;
  setToAddKnownAmount: (v:number)=>void;
  mergedCastingLevels: () => { level:number; spellcasting: Record<string, any> }[];
  allSpells: () => Spell[];
  getAddNumberAccent: (n:number)=>string;
  getNumberArray: (n:number)=>number[];
  onSave: () => void;
  canSave: () => boolean;
  setSubclassSpells: (fn:(prev: Spell[])=>Spell[]) => void;
  setSpellcastingInfo: (fn:(prev:{name:string,desc:string[]}[])=>{name:string,desc:string[]}[])=>void;
  setSpellsKnownPerLevel: (fn:(prev:{level:number,amount:number}[])=>{level:number,amount:number}[])=>void;
}

export const SpellcastingSection = <T extends {
  hasCasting: boolean; casterType: string; castingModifier: string; spellsKnownCalc: SpellsKnown;
  halfCasterRoundUp: boolean; hasCantrips: boolean; hasRitualCasting: boolean; spellsKnownPerLevel: {level:number,amount:number}[];
  spellcastingInfo: {name:string,desc:string[]}[]; subclassSpells: Spell[]; selectedSpellName: string;
}>(p: SpellcastingSectionProps<T>) => {
  const addCustomKnown = () => {
    const list = (p.form.get('spellsKnownPerLevel') as any[]) || [];
    if (!list.some(x => x.level === p.toAddKnownLevel())) {
      const next = [...list, { level: p.toAddKnownLevel(), amount: p.toAddKnownAmount() }].sort((a,b)=>a.level-b.level);
      p.form.set('spellsKnownPerLevel', next as any);
    }
  };

  const addSpell = () => {
    const pick = p.form.get('selectedSpellName') as any;
    const spell = p.allSpells().find(s => s.name === pick);
    if (spell) p.setSubclassSpells(old => old.some(s => s.name === spell.name) ? old : [...old, spell]);
  };

  return (
    <div>
      <h2>Spellcasting</h2>
      <div>
        <Checkbox
          checked={!!p.form.get('hasCasting')}
          onChange={val => p.form.set('hasCasting', (typeof val === 'boolean' ? val : !p.form.get('hasCasting')) as any)}
          label="Has Spellcasting"
        />
      </div>
      <Show when={p.form.get('hasCasting')}>
        <div class={styles.castingRowOne}>
          <span>
            <label for="casterType">Caster Type:</label>
            <Select value={(p.form.get('casterType') as any)||''} onChange={v => p.form.set('casterType', v as any)}>
              <Option value="half">Half Caster</Option>
              <Option value="third">Third Caster</Option>
            </Select>
          </span>
          <span>
            <label for="castingStat">Casting Stat:</label>
            <Select value={(p.form.get('castingModifier') as any)||''} onChange={v => p.form.set('castingModifier', v as any)}>
              <For each={["Intelligence", "Wisdom", "Charisma"]}>{stat => <Option value={stat}>{stat}</Option>}</For>
            </Select>
          </span>
        </div>
        <div>
          <label for="spellsKnown">Spells Known: </label>
            <Select value={(p.form.get('spellsKnownCalc') as any)} onChange={e => p.form.set('spellsKnownCalc', (+e) as any)}>
              <Option value={SpellsKnown.None.toString()}>None</Option>
              <Option value={SpellsKnown.Level.toString()}>Level</Option>
              <Option value={SpellsKnown.HalfLevel.toString()}>Half Level</Option>
              <Option value={SpellsKnown.StatModPlusLevel.toString()}>Stat Modifier + Level</Option>
              <Option value={SpellsKnown.StatModPlusHalfLevel.toString()}>Stat Modifier + Half Level</Option>
              <Option value={SpellsKnown.StatModPlusThirdLevel.toString()}>Stat Modifier + Third Level</Option>
              <Option value={SpellsKnown.Other.toString()}>Other</Option>
            </Select>
            <Checkbox
              checked={!!p.form.get('halfCasterRoundUp')}
              onChange={val => p.form.set('halfCasterRoundUp', (typeof val === 'boolean' ? val : !p.form.get('halfCasterRoundUp')) as any)}
              label="Half Caster Round Up"
            />
        </div>
        <Show when={p.form.get('spellsKnownCalc') === SpellsKnown.Other}>
          <div>
            <h3>Spells Known</h3>
            <div>
              <label for="slotLevel">Class Level: </label>
              <Select onChange={p.setToAddKnownLevel}>
                <For each={p.getNumberArray(20)}>{lvl => <Option value={lvl}>{`Level ${lvl}`}</Option>}</For>
              </Select>
            </div>
            <div>
              <label for="slotAmount">Slot Amount: </label>
              <Input name="slotAmount" type="number" min={0} onChange={(e)=> p.setToAddKnownAmount(+e.currentTarget.value)} />
            </div>
            <Button onClick={addCustomKnown}>Add</Button>
            <div class={styles.chips}>
              <For each={((p.form.get('spellsKnownPerLevel') as any[])||[])}>
                {level => <Chip key={`Level ${level.level}`} value={`${level.level}: ${level.amount}`} remove={()=> {
                  const list = (p.form.get('spellsKnownPerLevel') as any[]) || [];
                  p.form.set('spellsKnownPerLevel', list.filter(l => l.level !== level.level) as any);
                }} />}
              </For>
            </div>
          </div>
        </Show>
        <div>
          <Checkbox
            checked={!!p.form.get('hasCantrips')}
            onChange={val => p.form.set('hasCantrips', (typeof val === 'boolean' ? val : !p.form.get('hasCantrips')) as any)}
            label="Has Cantrips"
          />
          <Checkbox
            checked={!!p.form.get('hasRitualCasting')}
            onChange={val => p.form.set('hasRitualCasting', (typeof val === 'boolean' ? val : !p.form.get('hasRitualCasting')) as any)}
            label="Ritual Casting"
          />
        </div>
        <div>
          <h3>Prepared / Known Spells</h3>
          <Select value={(p.form.get('selectedSpellName') as any) || ''} onChange={v => p.form.set('selectedSpellName', v as any)}>
            <For each={p.allSpells()}>{spell => <Option value={spell.name}>{spell.name}</Option>}</For>
          </Select>
          <Button onClick={addSpell}>Add Spell</Button>
          <div>
            <For each={((p.form.get('subclassSpells') as any[])||[])}>
              {spell => <Chip key={p.getAddNumberAccent(+spell.level)} value={spell.name} remove={() => p.setSubclassSpells(old => old.filter(x => x.name !== spell.name))} />}
            </For>
          </div>
        </div>
        <div>
          <h3>Slot Progression Preview</h3>
          <Show when={p.form.get('hasCasting') && p.form.get('casterType')}>
            <table class={styles.slotTable}>
              <thead>
                <tr>
                  <th>Lvl</th>
                  <th>Can</th>
                  <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th>
                </tr>
              </thead>
              <tbody>
                <For each={p.mergedCastingLevels()}>{row => (
                  <tr>
                    <td>{row.level}</td>
                    <td>{row.spellcasting.cantrips_known ?? '-'}</td>
                    <td>{row.spellcasting.spell_slots_level_1 ?? '-'}</td>
                    <td>{row.spellcasting.spell_slots_level_2 ?? '-'}</td>
                    <td>{row.spellcasting.spell_slots_level_3 ?? '-'}</td>
                    <td>{row.spellcasting.spell_slots_level_4 ?? '-'}</td>
                    <td>{row.spellcasting.spell_slots_level_5 ?? '-'}</td>
                    <td>{row.spellcasting.spell_slots_level_6 ?? '-'}</td>
                    <td>{row.spellcasting.spell_slots_level_7 ?? '-'}</td>
                    <td>{row.spellcasting.spell_slots_level_8 ?? '-'}</td>
                    <td>{row.spellcasting.spell_slots_level_9 ?? '-'}</td>
                  </tr>
                )}</For>
              </tbody>
            </table>
          </Show>
        </div>
        <div>
          <h3>Spellcasting Info</h3>
          <Button onClick={() => p.setSpellcastingInfo(info => [...info, { name: "", desc: [] }])}>Add Info</Button>
          <div>
            <For each={((p.form.get('spellcastingInfo') as any[])||[])}>{(info,i) => {
              return (
                <div>
                  <div>
                    <label for={`nameInput${i()}`}>Title: </label>
                    <Input name={`nameInput${i()}`} value={info.name} onChange={(e)=> p.setSpellcastingInfo(arr => { const clone = [...arr]; clone[i()] = { ...clone[i()], name: e.currentTarget.value }; return clone; })} />
                  </div>
                  <div>
                    <label for={`descInput${i()}`}>Description: </label>
                    <textarea class={styles.textArea} name={`descInput${i()}`} value={info.desc.join("\n")} onChange={(e)=> p.setSpellcastingInfo(arr => { const clone = [...arr]; clone[i()] = { ...clone[i()], desc: e.currentTarget.value.split("\n") }; return clone; })} />
                  </div>
                  <div>
                    <Button 
                    onClick={()=> p.setSpellcastingInfo(arr => arr.filter((_,idx)=> idx !== i()))}>Remove</Button>
                  </div>
                </div>
              );
            }}</For>
          </div>
        </div>
      </Show>
      <div>
        <Button
          disabled={!p.canSave()} 
          onClick={p.onSave}>Save</Button>
      </div>
    </div>
  );
};
