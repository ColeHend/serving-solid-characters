import { Accessor, Component, createEffect, createMemo, createSignal, For, Match, Setter, Show, splitProps, Switch } from "solid-js";
import { LevelEntity } from "../../../../../models/old/class.model";
import { Table, Column, Row, Header, Cell, TabBar, FormGroup, FormField, Input, Icon, Button, Select, Option, Checkbox } from "coles-solid-library";
import styles from "./classes.module.scss";
import { ClassForm } from "./classes";
import { CasterType, FeatureTypes } from "../../../../../models/old/core.model";
import { ClassTable } from "./classTable";

enum FeatureTabs {
  ClassSpecific,
  CasterFeatures,
}
interface FeatureTableProps {
  formGroup: FormGroup<ClassForm>;
  tableData: Accessor<LevelEntity[]>;
  setTableData: Setter<LevelEntity[]>;
}
export const FeatureTable: Component<FeatureTableProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<FeatureTabs>(0);
  const [tabs, setTabs] = createSignal<string[]>(['Class Specific', 'Caster Features']);
  const [{tableData, setTableData}, rest] = splitProps(props, ['tableData', 'setTableData']);
  
  // const [tableData, setTableData] = createSignal<LevelEntity[]>(defaultTableData);
  createEffect(() => {
    props.formGroup.set('classLevels', tableData());
  })
  const [newColumnName, setNewColumnName] = createSignal<string>('');
  
  const classSpecificKeys = createMemo(() => {
    // Force memo to recalculate when columnUpdateTrigger changes
    const groupKeys = Object.keys(tableData()[0].classSpecific);
    return [...new Set([...groupKeys])];
  });
  const tableColumns = createMemo(() => {
    return ["Level", "Features", ...classSpecificKeys()];
  });
  const casterType = createMemo(() => props.formGroup.get('casterType') ?? CasterType.None);
  
  return (
    <div class={`${styles.classSection}`}>
      <div>
        <div>
          <TabBar activeTab={activeTab()} tabs={tabs()} onTabChange={(e, i)=>{
            setActiveTab(i);
          }}/>
        </div>
        <div>
          <Switch >
            <Match when={activeTab() === FeatureTabs.ClassSpecific}>
              <div class={`${styles.classSpecific}`}>
                <FormField name="New Column Name"><Input value={newColumnName()} onChange={(e)=>{setNewColumnName(e.currentTarget.value)}} /></FormField>
                <Button title="Add new Column" onClick={()=>{
                  setTableData((old)=>([...old.map((level) => {
                    level.classSpecific[newColumnName()] = '-';
                    return level;
                  })]));
                  setNewColumnName(''); // Clear the input field after adding
                }}><Icon name="add_box" /></Button>
              </div>
              <div class={`${styles.classSpecific}`}>
                <For each={Object.keys(tableData()[0].classSpecific)}>{(key)=>
                  <Button class={`${styles.deleteClassSpecificBtn}`} onClick={()=>{
                    setTableData((old)=>([...old.map((level) => {
                      delete level.classSpecific[key];
                      return level;
                    })]));
                  }} ><Icon name="delete" size={'medium'}/> {key}</Button>
                }</For>
              </div>
            </Match>
            <Match when={activeTab() === FeatureTabs.CasterFeatures}>
              <div>
              </div>
              <div class={`${styles.casterFeatures}`}>
                <div style={{"flex-basis": "100%"}}>
                  <FormField style={{width:'50%'}} name="Caster Type" formName="casterType">
                    <Select>
                      <Option value={CasterType.None}>None</Option>
                      <Option value={CasterType.Full}>Full</Option>
                      <Option value={CasterType.Half}>Half</Option>
                      <Option value={CasterType.Third}>Third</Option>
                    </Select>
                  </FormField>
                </div>
                <Show when={casterType() !== CasterType.None}>
                  <FormField name="Has Cantrips" formName="hasCantrips">
                    <Checkbox />
                  </FormField>
                  <FormField name="Spell Level" formName="spellsLevel">
                    <Select>
                      <For each={Array.from({ length: 10 }, (_, i) => i)}>
                        {(level) => <Option value={level}>{level}</Option>}
                      </For>
                    </Select>
                  </FormField>
                  <FormField name="Spells Known" formName="spellsKnownCalc">
                    <Select>
                      <Option value={0 /* SpellsKnown.Number */}>Number</Option>
                      <Option value={1 /* SpellsKnown.Formula */}>Formula</Option>
                    </Select>
                  </FormField>
                  <FormField name="Spellcasting Ability" formName="spellcastAbility">
                    <Select>
                      <Option value={0 /* STR */}>Strength</Option>
                      <Option value={1 /* DEX */}>Dexterity</Option>
                      <Option value={2 /* CON */}>Constitution</Option>
                      <Option value={3 /* INT */}>Intelligence</Option>
                      <Option value={4 /* WIS */}>Wisdom</Option>
                      <Option value={5 /* CHA */}>Charisma</Option>
                    </Select>
                  </FormField>
                </Show>
              </div>
            </Match>
          </Switch>
        </div>
      </div>
      <div>
        <ClassTable 
          formGroup={props.formGroup} 
          data={tableData()}
          setData={setTableData} 
          columns={tableColumns()} 
          casterType={props.formGroup.get('casterType') ?? CasterType.None} />
      </div>
    </div>
  );
};