import { Component, createEffect, createMemo, createSignal, For, Match, Setter, Show, Switch } from "solid-js";
import { LevelEntity } from "../../../../../models/old/class.model";
import { CasterType } from "../../../../../models/old/core.model";
import { Button, FormGroup, Icon, Input, Modal } from "coles-solid-library";
import { ClassForm } from "./classes";
import styles from "./classes.module.scss";
import { SpellsKnown } from "../../../../../shared/models/casting";
import { getSpellSlots } from "../../../../../shared";
import { FeatureModal } from "./featureModal";

interface ClassTableProps {
  data: LevelEntity[];
  setData: Setter<LevelEntity[]>;
  columns: string[];
  casterType: CasterType;
  formGroup: FormGroup<ClassForm>;
}
export const ClassTable: Component<ClassTableProps> = (props) => {
  const [selectedFeature, setSelectedFeature] = createSignal<string>('');
  const classSpecificKeys = createMemo(() => {
    const groupKeys = Object.keys(props.data[0].classSpecific);
    return [...new Set([...groupKeys])];
  });
  const getFeatureNames = (level: LevelEntity) => {
    return level.features.map(f=> f.name).join(', ');
  }
  const getColumnName = (l: string) => {
    const level = parseInt(l);
    if (!isNaN(level)) {
      switch (level) {
      case 0:
        return 'Cantrips';
      case 1:
        return '1st';
      case 2:
        return '2nd';
      case 3:
        return '3rd';
      default:
        return `${level}th`;
      }
    }
    return l;
  };
  const spellLevels = Array.from({ length: 10 }, (_, i) => i);
  const spellNames = spellLevels.map(l=>getColumnName(`${l}`));
  const getCasterArray = () => {
    let levels = [...spellLevels];
    if (props.casterType === CasterType.None) {
      return [];
    } else {
      if (props.casterType === CasterType.Half) {
        levels.splice(6);
      } else if (props.casterType === CasterType.Third) {
        levels.splice(5);
      }
      if (!props.formGroup.get('hasCantrips')) {
        levels = levels.slice(1);
      }
      return levels;
    }
  };
  const currentColumns = createMemo(() => {
    const spellLevels = getCasterArray();
    return [...props.columns, ...spellLevels.map(l=>getColumnName(`${l}`))];
  });
  const getSlotLevel = (spellName: string) => {
    const level = parseInt(spellName[0]);
    if (!isNaN(level)) {
      return level;
    }
    return 0;
  };
  const getTypeKey = ()=>{
    switch (props.casterType) {
    case CasterType.Full:
      return 'full';
    case CasterType.Half:
      return 'half';
    case CasterType.Third:
      return 'third';
    default:
      return 'full';
    }
  };
  const getColumnStyle = (col: string) => {
    if (col === 'Features') {
      return styles.featureColumn;
    } else {
      return styles.casterColumn;
    }
  };
  const setClassSpecific = (level: LevelEntity, key: string, value: string) => {
    const newLevel = {...level};
    newLevel.classSpecific[key] = value;
    props.setData((prev)=>([...prev.map(l => l.level === level.level ? newLevel : l)]));
  };
  const getCantripsKnown = (level: LevelEntity) => {
    if (level.spellcasting?.cantrips_known) {
      return level.spellcasting.cantrips_known;
    }
    return 0;
  };
  const setCantripsKnown = (level: LevelEntity, value: number) => {
    const newLevel = {...level};
    newLevel.spellcasting ??= {};
    newLevel.spellcasting.cantrips_known = value;
    props.setData((prev)=>([...prev.map(l => l.level === level.level ? newLevel : l)]));
  };
  createEffect(()=>{
    props.formGroup.set('classLevels', props.data);
  });
  const [featureToAddLvl, setFeatureToAddLvl] = createSignal<number>(1);
  const [showAddFeature, setShowAddFeature] = createSignal<boolean>(false);
  const [isEditChoice, setIsEditChoice] = createSignal<boolean>(false);
  return <>
    <table class={styles.tableStyle}>
      <colgroup>
        <For each={currentColumns()}>{(col)=><col class={getColumnStyle(col)} />}</For>
      </colgroup>
      <thead>
        <tr>
          <th colSpan={currentColumns().length}>
            <span class={styles.addFeature}>
              <span>
                Add Feature To Level
              </span>
              <span>
                <Input type="number" min={1} max={20} value={featureToAddLvl()} onChange={(e)=>{
                  setFeatureToAddLvl(parseInt(e.currentTarget.value));
                }} />
              </span>
              <span>
                <Button title="Add Feature" aria-label="Add feature to selected level" onClick={()=>{
                  setIsEditChoice(false);
                  setSelectedFeature('');
                  setShowAddFeature(true);
                }} class={styles.addFeatureBtn}>
                  <Icon name="add_box" size={'small'} />
                </Button>
              </span>
            </span>
          </th>
        </tr>
        <tr> 
          <For each={currentColumns()}>{(col)=><th>{getColumnName(col)}</th>}</For>
        </tr>
      </thead>
      <tbody>
        <For each={props.data}>{(row, level)=>
          <tr>
            <For each={currentColumns()}>{(col)=>(
              <Switch>
                {/* Level Number */}
                <Match when={col === 'Level'}>
                  <td>{getColumnName(`${row.level}`)}</td>
                </Match>
                {/* Features */}
                <Match when={col === 'Features'}>
                  <td  class={getColumnStyle(col)}>
                    <For each={row.features}>{(feature) => (
                      <span>
                        <span class={styles.deleteFeature} role="button" aria-label={`Delete feature ${feature.name}`} onClick={()=>{
                          const newLevel = {...row};
                          newLevel.features = newLevel.features.filter(f => f.name !== feature.name);
                          props.setData((prev)=>([...prev.map(l => l.level === row.level ? newLevel : l)]));
                        }}>
                          <Icon name="delete" size={'small'} />
                        </span>
                        <span class={styles.singleFeature} onClick={()=>{
                          setSelectedFeature(feature.name);
                          setIsEditChoice(true);
                          setFeatureToAddLvl(row.level);
                          setShowAddFeature(true);
                        }} >{feature.name}</span>
                      </span>
                    )}</For>
                  </td>
                </Match>
                {/* Class Specific Features */}
                <Match when={classSpecificKeys().includes(col)}>
                  <td class={`${styles.cantripSpacing}`}>
                    <Input value={row.classSpecific[col]} onChange={(e)=>setClassSpecific(row, col, e.currentTarget.value)} />
                  </td>
                </Match>
                {/* Spell Slots */}
                <Match when={spellNames.includes(col)}>
                  <Show when={col === 'Cantrips'}>
                    <td class={`${styles.cantripSpacing}`}>
                      <Input type='number' min={0} value={getCantripsKnown(row)} onChange={(e)=>setCantripsKnown(row, parseInt(e.currentTarget.value))} />
                    </td>
                  </Show>
                  <Show when={col !== 'Cantrips'}>
                    <td>{getSpellSlots(level() + 1, getSlotLevel(col), getTypeKey())}</td>
                  </Show>
                </Match>
              </Switch>
            )}</For>
          </tr>}
        </For>
      </tbody>
    </table>
    <FeatureModal
      selectedFeature={selectedFeature}
      setSelectedFeature={setSelectedFeature}
      showAddFeature={showAddFeature}
      setShowAddFeature={setShowAddFeature}
      isEditChoice={isEditChoice}
      selectedLevel={featureToAddLvl}
      setTableData={props.setData}
      formGroup={props.formGroup} 
    />
  </>;
}