import { Accessor, Component, createEffect, createMemo, createSignal, For, Match, Setter, Show, Switch } from "solid-js";
import { LevelEntity } from "../../../../../models/old/class.model";
import { CasterType } from "../../../../../models/old/core.model";
import { Button, FormGroup, Icon, Input, Modal } from "coles-solid-library";
import { ClassForm } from "./classes";
import styles from "./classes.module.scss";
import { SpellsKnown } from "../../../../../shared/models/casting";
import { getSpellSlots } from "../../../../../shared";
import { FeatureModal } from "./featureModal";

interface ClassTableProps {
  columns: string[];
  casterType: CasterType;
  formGroup: FormGroup<ClassForm>;
  change: Accessor<boolean>;
  setChange: Setter<boolean>;
}
export const ClassTable: Component<ClassTableProps> = (props) => {
  const [selectedFeature, setSelectedFeature] = createSignal<string>('');
  const classSpecificKeys = createMemo(() => {
    props.change();
    const groupKeys = Object.keys(props.formGroup.get('classSpecific'));
    return [...new Set([...groupKeys])];
  });
  
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
  const getClassSpecific = (level: number, key: string) => {
    return props.formGroup.get('classSpecific')[key][level];
  }
  const setClassSpecific = (level: number, key: string, value: string) => {
    const classSpecific = props.formGroup.get('classSpecific');
    classSpecific[key][level] = value;
    props.formGroup.set('classSpecific', classSpecific);
    props.setChange((old)=>(!old));
  };
  const getCantripsKnown = (level: number) => {
    props.change();
    const spellSlots = props.formGroup.get('spellSlots') ?? {};
    const cantrips = spellSlots[level]?.cantrips_known;
    if (cantrips) {
      return cantrips;
    }
    return 0;
  };
  const setCantripsKnown = (level: number, value: number) => {
    const newLevel = props.formGroup.get('spellSlots') ?? {};
    newLevel[level].cantrips_known = value;
    props.formGroup.set('spellSlots', newLevel);
    props.setChange((old)=>(!old));
  };
  const getFeatures = (level: number) => {
    props.change();
    const features = props.formGroup.get('features') ?? {};
    if (features[level]) {
      return features[level];
    }
    return [];
  }

  createEffect(()=>{
    // props.formGroup.set('classLevels', props.data);
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
                <Button title="Add Feature" onClick={()=>{
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
        <For each={Array.from({ length: 20 }, (_, i) => i + 1)}>{(row, level)=>
          <tr>
            <For each={currentColumns()}>{(col)=>(
              <Switch>
                {/* Level Number */}
                <Match when={col === 'Level'}>
                  <td>{getColumnName(`${row}`)}</td>
                </Match>
                {/* Features */}
                <Match when={col === 'Features'}>
                  <td  class={getColumnStyle(col)}>
                    <For each={getFeatures(row)}>{(feature) => (
                      <span>
                        <span class={styles.deleteFeature} onClick={()=>{
                          const newLevel = getFeatures(row).filter(f => f.name !== feature.name);;
                          props.formGroup.set('features', {
                            ...props.formGroup.get('features'),
                            [row]: newLevel
                          });
                        }}>
                          <Icon name="delete" size={'small'} />
                        </span>
                        <span class={styles.singleFeature} onClick={()=>{
                          setSelectedFeature(feature.name);
                          setIsEditChoice(true);
                          setFeatureToAddLvl(row);
                          setShowAddFeature(true);
                        }} >{feature.name}</span>
                      </span>
                    )}</For>
                  </td>
                </Match>
                {/* Class Specific Features */}
                <Match when={classSpecificKeys().includes(col)}>
                  <td class={`${styles.cantripSpacing}`}>
                    <Input value={getClassSpecific(row,col)} onChange={(e)=>setClassSpecific(row, col, e.currentTarget.value)} />
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
      formGroup={props.formGroup}
      setChange={props.setChange} 
    />
  </>;
}