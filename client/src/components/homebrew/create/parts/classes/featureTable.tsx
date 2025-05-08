import { Accessor, Component, createEffect, createMemo, createSignal, For, Match, Setter, Show, splitProps, Switch } from "solid-js";
import { LevelEntity } from "../../../../../models/old/class.model";
import { Table, Column, Row, Header, Cell, TabBar, FormGroup, FormField, Input, Icon, Button, Select, Option } from "coles-solid-library";
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
  change: Accessor<boolean>;
  setChange: Setter<boolean>;
}
export const FeatureTable: Component<FeatureTableProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<FeatureTabs>(0);
  const [tabs, setTabs] = createSignal<string[]>(['Class Specific', 'Caster Features']);
  // const [tableData, setTableData] = createSignal<LevelEntity[]>(defaultTableData);


  createEffect(() => {
    // props.formGroup.set('classLevels', tableData());
  })
  const [newColumnName, setNewColumnName] = createSignal<string>('');

  const classSpecificKeys = createMemo(() => {
    // Force memo to recalculate when columnUpdateTrigger changes
    const groupKeys = Object.keys(props.formGroup.get('classSpecific') ?? {});
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
          <TabBar activeTab={activeTab()} tabs={tabs()} onTabChange={(e, i) => {
            setActiveTab(i);
          }} />
        </div>
        <div>
          <Switch >
            <Match when={activeTab() === FeatureTabs.ClassSpecific}>
              <div class={`${styles.classSpecific}`}>
                <FormField name="New Column Name">
                  <Input value={newColumnName()} onChange={(e) => { setNewColumnName(e.currentTarget.value) }} />
                </FormField>
                <Button title="Add new Column" onClick={() => {
                  const classSpecific = props.formGroup.get('classSpecific') ?? {};
                  props.formGroup.set('classSpecific', {
                    ...classSpecific,
                    [newColumnName()]: {
                      1: '',
                      2: '',
                      3: '',
                      4: '',
                      5: '',
                      6: '',
                      7: '',
                      8: '',
                      9: '',
                      10: '',
                      11: '',
                      12: '',
                      13: '',
                      14: '',
                      15: '',
                      16: '',
                      17: '',
                      18: '',
                      19: '',
                      20: ''
                    }
                  });
                  setNewColumnName(''); // Clear the input field after adding
                }}><Icon name="add_box" /></Button>
              </div>
              <div class={`${styles.classSpecific}`}>
                <For each={Object.keys(props.formGroup.get('classSpecific'))}>{(key) =>
                  <Button class={`${styles.deleteClassSpecificBtn}`} onClick={() => {
                    const classSpecific = props.formGroup.get('classSpecific') ?? {};
                    delete classSpecific[key];
                    props.formGroup.set('classSpecific', classSpecific);
                  }} ><Icon name="delete" size={'medium'} /> {key}</Button>
                }</For>
              </div>
            </Match>
            <Match when={activeTab() === FeatureTabs.CasterFeatures}>
              <div>
              </div>
              <div class={`${styles.casterFeatures}`}>
                <FormField style={{ width: '45%' }} name="Caster Type" formName="casterType">
                  <Select>
                    <Option value={CasterType.None}>None</Option>
                    <Option value={CasterType.Full}>Full</Option>
                    <Option value={CasterType.Half}>Half</Option>
                    <Option value={CasterType.Third}>Third</Option>
                  </Select>
                </FormField>
                <Show when={casterType() === CasterType.Half}>
                  <FormField style={{ width: '45%' }} name="RoundUp?" formName="spellsKnownRoundup">
                    <Select>
                      <Option value={true}>Yes</Option>
                      <Option value={false}>No</Option>
                    </Select>
                  </FormField>
                </Show>
                {/* <div style={{"flex-basis": "100%"}}>
                  <span>
                  </span>
                </div> */}
                <Show when={casterType() !== CasterType.None}>
                  <FormField name="Has Cantrips?" formName="hasCantrips">
                    <Select>
                      <Option value={true}>Yes</Option>
                      <Option value={false}>No</Option>
                    </Select>
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
                      <Option value={0}>Number</Option>
                      <Option value={1}>Formula</Option>
                    </Select>
                  </FormField>
                  <FormField name="Spellcasting Ability" formName="spellcastAbility">
                    <Select>
                      <Option value={0}>Strength</Option>
                      <Option value={1}>Dexterity</Option>
                      <Option value={2}>Constitution</Option>
                      <Option value={3}>Intelligence</Option>
                      <Option value={4}>Wisdom</Option>
                      <Option value={5}>Charisma</Option>
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
          columns={tableColumns()}
          change={props.change}
          setChange={props.setChange}
          casterType={props.formGroup.get('casterType') ?? CasterType.None} />
      </div>
    </div>
  );
};