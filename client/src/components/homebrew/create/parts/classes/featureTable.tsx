import { Component, createEffect, createMemo, createSignal, For, Match, Switch } from "solid-js";
import { LevelEntity } from "../../../../../models/class.model";
import { Table, Column, Row, Header, Cell, TabBar, FormGroup, FormField, Input, Icon, Button,  } from "coles-solid-library";
import styles from "./classes.module.scss";
import { ClassForm } from "./classes";
import { FeatureTypes } from "../../../../../models/core.model";

enum FeatureTabs {
  ClassSpecific,
  CasterFeatures,
}
interface FeatureTableProps {
  formGroup: FormGroup<ClassForm>;
}
export const FeatureTable: Component<FeatureTableProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<FeatureTabs>(0);
  const [tabs, setTabs] = createSignal<string[]>(['Class Specific', 'Caster Features']);
  const defaultTableData: LevelEntity[] = Array.from({ length: 20 }, (_, i) => ({
    level: i + 1,
    features: [],
    info: {
      className: props.formGroup.get('name'),
      subclassName: '',
      level: i + 1,
      type: FeatureTypes.Class,
      other: '',
    },
    profBonus: i < 5 ? 2 : i < 9 ? 3 : i < 13 ? 4 : i < 17 ? 5 : 6,
    classSpecific: {},
  }));
  const [tableData, setTableData] = createSignal<LevelEntity[]>(defaultTableData);
  const [newColumnName, setNewColumnName] = createSignal<string>('');
  const [columnUpdateTrigger, setColumnUpdateTrigger] = createSignal(0);
  
  const classSpecificKeys = createMemo(() => {
    // Force memo to recalculate when columnUpdateTrigger changes
    const groupKeys = Object.keys(tableData()[0].classSpecific);
    columnUpdateTrigger();
    return [...new Set([...groupKeys])];
  });
  const tableColumns = createMemo(() => {
    return ["Level", "Features", ...classSpecificKeys()];
  });
  
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
              <div>
                <FormField name="New Column Name"><Input value={newColumnName()} onChange={(e)=>{setNewColumnName(e.currentTarget.value)}} /></FormField>
                <Button title="Add new Column" onClick={()=>{
                  const data = tableData();
                  const newData = [...data.map((level) => {
                    level.classSpecific[newColumnName()] = '';
                    return level;
                  })];
                  props.formGroup.set('classLevels', newData);
                  setTableData(newData);
                  setColumnUpdateTrigger(prev => prev + 1); 
                  console.log(newData);
                  
                  setNewColumnName(''); // Clear the input field after adding
                }}><Icon name="add_box" /></Button>
              </div>
            </Match>
            <Match when={activeTab() === FeatureTabs.CasterFeatures}>
              <div></div>
            </Match>
          </Switch>
        </div>
      </div>
      <div>
        <Table columns={tableColumns()} data={tableData}>
          <Column name='Level'>
            <Header>Level</Header>
            <Cell<LevelEntity> >{(_, index) => <span>{index + 1}</span>}</Cell>
            <Cell<LevelEntity> rowNumber={2} >{(level) => <span>{level.features.map(x=>x.value).join(', ')}</span>}</Cell>
          </Column>
          <Column name='Features'>
            <Header>Features</Header>
            <Cell<LevelEntity>>{(level) => level.features.map((feature) => feature.name).join(', ')}</Cell>
          </Column>
          <For each={classSpecificKeys()}>{(key)=>
            <Column name={key}>
              <Header>{key}</Header>
              <Cell<LevelEntity>>{(level) => level.classSpecific[key]}</Cell>
            </Column>
          }</For>

          <Row isDropHeader />
          <Row rowNumber={2} isDropRow />
        </Table>
      </div>
    </div>
  );
};