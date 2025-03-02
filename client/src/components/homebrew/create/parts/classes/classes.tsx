import {
  Component,
  For,
  Setter,
  Show,
  createMemo,
  createSignal,
  onMount,
  untrack,
} from "solid-js";
import styles from "./classes.module.scss";
import HomebrewManager from "../../../../../shared/customHooks/homebrewManager";
import {
  Input,
  Button,
  Select,
  Option,
  Chip,
  useGetClasses,
  Body,
  Clone,
  Tabs,
  Tab,
  TextArea
} from "../../../../../shared/";
import type { DnDClass } from "../../../../../models";
import { LevelEntity } from "../../../../../models/class.model";
import { Feature, FeatureTypes } from "../../../../../models/core.model";
import { SpellsKnown } from "../subclasses/subclasses";
import { useSearchParams } from "@solidjs/router";
import Table from '../../../../../shared/components/Table/table';
import { Cell, Column, Header, Row } from '../../../../../shared/components/Table/innerTable';
import FormField from "../../../../../shared/components/FormField/formField";
import Proficiency from "./sections/proficiency";
import StartEquipment from "./sections/startEquipment";
import { CastingStat } from "../../../../../shared/models/stats";
import { SpellLevels } from "../../../../../shared/models/casting";
import { createStore } from "solid-js/store";
import Modal from "../../../../../shared/components/popup/popup.component";
import FeatureModal from "./sections/featureModal";
import addSnackbar from "../../../../../shared/components/Snackbar/snackbar";
import { delay, of } from "rxjs";
import { useGetClassSetters } from "./hooks/classSetters";

const Classes: Component = () => {
  // --- getter functions
  const [searchParam] = useSearchParams();
  const allClasses = useGetClasses();
  const hombrewClasses = HomebrewManager.classes
  const [currentClass, setCurrentClass] = createStore<DnDClass>({
    id: 0,
    name: "",
    hitDie: 4,
    proficiencies: [],
    proficiencyChoices: [],
    savingThrows: [],
    startingEquipment: {
      class: "",
      quantity: 0,
      choice1: [],
      choice2: [],
      choice3: [],
      choice4: []
    },
    classLevels: Array.from({length: 20}, (_, i)=>({
      level: i+1, 
      profBonus: (Math.ceil((i+1)/4)+1), 
      features: [], 
      classSpecific: {}, 
      info: { className:"", level: i+1, subclassName:"", type: FeatureTypes.Class, other:""}
    }),),
    subclasses: [],
    classMetadata: {
      subclassLevels: [],
      subclassType: "",
      subclassTypePosition: "before"
    },
    spellcasting: {
      level: 0,
      name: "",
      spellsKnownCalc: "",
      spellcastingAbility: "",
      casterType: "none",
      info: []
    }
  }); 
  const [casterType, setCasterInternalType] = createSignal<string>('none');
  const setCasterType = (casterType: string) => setCurrentClass((prev)=>({
    spellcasting: {
      level: prev.spellcasting?.level ?? 0,
      name: prev.spellcasting?.name ?? "",
      spellsKnownCalc: prev.spellcasting?.spellsKnownCalc ?? "Level",
      spellcastingAbility: prev.spellcasting?.spellcastingAbility ?? "INT",
      casterType: casterType,
      info: prev.spellcasting?.info ?? []
    }
  }));
  const [currentColumns, setCurrentColumns] = createSignal<string[]>(["level", "proficiency", "features"]);
  const [newColumnKeyname, setNewColumnKeyname] = createSignal<string>('');
  const [showAddFeature, setShowAddFeature] = createSignal<boolean>(false);
  const [currentLevel, setCurrentLevel] = createSignal<LevelEntity>({} as LevelEntity);
  const [currentFeatureIndex, setCurrentFeatureIndex] = createSignal<number>(-1);
  const spellCalc = createMemo(() => {
    const spellCalc = currentClass.spellcasting?.spellsKnownCalc ?? 'Level';
    if (typeof spellCalc === 'string') return spellCalc;
    return SpellsKnown[spellCalc];
  });
  const {
    setName,
    setHitDie,
    setProficiencies,
    setSavingThrows,
    setStartingEquipChoice,
    setSubclassLevels,
    setSpellKnown,
    setSpellCastingAbility,
    setSpellCastingInfo,
    addClassSpecificAll,
    removeClassSpecific,
    addFeature,
    replaceFeature,
    removeFeature,
    getSpellSlot,
    setSpellCantrips,
    setSpellSlot,
    setSpellSlots,
    setSpellsKnown,
  } = useGetClassSetters(currentClass, setCurrentClass, setCurrentColumns, casterType, spellCalc);

  // const [levels, setLevels] = createSignal<number[]>(Array.from({length: 20}, (_, i)=>i+1));
  // const classLevels = () => currentClass.classLevels;
  // const tableData = () => currentClass.classLevels
  // const getFeatureChips = (i:number)=>Object.entries((currentClass.classLevels[i]?.classSpecific));
  // const casterType = createMemo(() => currentClass.spellcasting?.casterType  ?? 'none');

	
  // --- functions
	
  // ---- effects
  const getShouldDisplayColumns = (casterType: string, currClass?: DnDClass) => {
    const currentColumns = ["level", "proficiency", "features", ...getClassSpecificKeys(currClass ?? currentClass)].filter(x=>!!x);
    const full = Array.from({length: 9}, (_, i)=>i+1);
    const numToLevel = (nums: number[]) => ['cantrip', ...nums.map((x)=>`spell_slots_level_${x}`)];
    switch (casterType.toLowerCase()) {
    case 'full':
      if (untrack(spellCalc).toLowerCase() === 'other') return [...currentColumns, 'spellsKnown', ...numToLevel(full)];
      return [...currentColumns, ...numToLevel(full)];
    case 'half':
    { 
      const half = Array.from({length: 5}, (_, i)=>i+1);
      if (untrack(spellCalc).toLowerCase() === 'other') return [...currentColumns, 'spellsKnown', ...numToLevel(half)];
      return [...currentColumns, ...numToLevel(half)]; 
    }
    case 'third':
    { 
      const third = Array.from({length: 4}, (_, i)=>i+1);
      if (untrack(spellCalc).toLowerCase() === 'other') return [...currentColumns, 'spellsKnown', ...numToLevel(third)];
      return [...currentColumns, ...numToLevel(third)]; 
    }
    case 'other':
      if (untrack(spellCalc).toLowerCase() === 'other') return [...currentColumns, 'spellsKnown', ...numToLevel(full)];
      return [...currentColumns, ...numToLevel(full)];
    default:
      return currentColumns;
    }
  };

  function getClassSpecificKeys(currClass: DnDClass) {
    return [...new Set<string>(currClass.classLevels.flatMap((x)=>Object.keys(x.classSpecific)))];
  };
  const newColumnInvalid = createMemo(()=> newColumnKeyname().trim() === '' || currentColumns().includes(newColumnKeyname()));

  function GetFeatureTypeString(value: FeatureTypes) {
    if (Number.isNaN(+value)) return `${value}`;
    return FeatureTypes[value];
  }
  // ----------------- JSX -----------------
  const [toAddSubclassLevel, setToAddSubclassLevel] = createSignal<number>(1);
  const [showSpellcasting, setShowSpellcasting] = createSignal<boolean>(false);
  function getSpellDesc(ind: number) {
    return (desc: string) => 
      setSpellCastingInfo((currentClass.spellcasting?.info ?? [])
        .map((x, index)=>index === ind ? {name: x.name, desc: desc?.split('\n')} : x)
      );
    
  }
  const canSaveValidation = ()=>{
    if (currentClass.name.trim().length === 0) {
      addSnackbar({message: 'Please fill out the class name', severity: 'warning'});
      return true;
    }
    return false; 
  };
	
  const getFeatureKey = (feature: Feature<string, string>) => {
    if (feature.info?.subclassName) return feature.info.subclassName;
    if (feature.info?.className) return feature.info.className;
    if (feature.info?.type) return GetFeatureTypeString(feature.info.type);
    if (feature.info?.other) return feature.info.other;
    return 'Feature';
  }
  const doesExist = createMemo(()=>{
    let searchName:string;
    if (searchParam.name) {
      searchName = searchParam.name;
    } else {
      searchName = currentClass.name;
    }
    const foundClass = allClasses().find((x)=>x.name === searchName);
    if (foundClass) {
      return foundClass;
    }
    return false;
  });
 
	
  const findAndSetClass = () => {
    const foundClass = doesExist() as DnDClass;
    foundClass.classLevels = foundClass.classLevels.map((newLevel, i)=> {
      newLevel.info = {
        className: newLevel.info?.className ?? foundClass.name,
        level: i+1,
        subclassName: newLevel.info?.subclassName ?? '',
        type: newLevel.info?.type ?? '',
        other: newLevel.info?.other ?? ''
      };
      if (newLevel.spellcasting) {
        newLevel.spellcasting = {
          ...newLevel?.spellcasting,
          level: i+1
        };
      }
      newLevel.classSpecific = Object.fromEntries(Object.entries(newLevel?.classSpecific ?? {}));
      newLevel.level = i+1;
      return newLevel
    });
    if (foundClass.classLevels[0].spellcasting) {
      Array.from({length: 20}, (_, i)=>i+1).forEach((level)=>{
        setSpellCantrips(level, foundClass.classLevels[level-1].spellcasting?.cantrips_known ?? 0);
      })
    }

    setCurrentClass(foundClass);
    const casterType = (foundClass.spellcasting?.casterType ?? 'None') as keyof typeof SpellsKnown;
    setCasterInternalType(casterType);
    const currentColumns = getShouldDisplayColumns(casterType, foundClass);
    setCurrentColumns(currentColumns);

		
		
  };

  const isHomebrew = createMemo(()=>!!hombrewClasses().find((x)=>x.name === currentClass.name));

  onMount(()=>{
    if (searchParam.name) {
      of(null).pipe(delay(50)).subscribe(()=>{
        findAndSetClass();
      })
    }
  })
	
  return (
    <>
      <Body>
        <div>
          <h1>Classes Homebrewing</h1>
          <span>
            <Button
              onClick={()=>{
                if (!canSaveValidation()) {
                  if (isHomebrew()) {
                    HomebrewManager.updateClass(currentClass);
                    addSnackbar({message: `${currentClass.name} updated`, severity: 'success'});
                  } else {
                    HomebrewManager.addClass(currentClass);
                    addSnackbar({message: `${currentClass.name} added`, severity: 'success'});
                  }
                }
              }}>{isHomebrew()? "Edit" : "Save"}</Button>
            <Show when={!!doesExist()}>
              <Button onClick={()=>{
                findAndSetClass();
              }}>Fill</Button>
            </Show>
          </span>
          <div class={`${styles.rowOne}`}>
            <span>
              <FormField class={`${styles.fieldStyle}`} name="Class Name">
                <Input transparent required value={currentClass.name} onChange={(e)=>setName(e.currentTarget.value)} />
              </FormField>
            </span>
            <span class={`${styles.selectSpan}`}>
              <label for="hitDie">Hit Die</label>
              <Select id="hitDie" transparent value={currentClass.hitDie} onChange={(e)=>{
                setHitDie(+e.currentTarget.value);
              }} disableUnselected>
                <For each={[4,6,8,10,12]}>{(die)=>(
                  <Option value={die}>{die}</Option>
                )}</For>
              </Select>
            </span>
            <span  class={`${styles.selectSpan}`}>
              <label for="casterType">Caster Type</label>
              <Select tooltip="Caster Type" disableUnselected transparent  
                value={casterType().trim()} 
                onChange={(e)=>{
                  setCasterType(e.currentTarget.value);
                  setCasterInternalType(e.currentTarget.value);
                  const currentColumns = getShouldDisplayColumns(e.currentTarget.value);
                  setCurrentColumns(currentColumns);
                  setSpellSlots(e.currentTarget.value);
                }} >
                <Option value="none">None</Option>
                <For each={["full", "half", "third", "other"]}>{(x)=>(
                  <Option value={x}>{`${x[0].toUpperCase()}${x.slice(1)}`}</Option>
                )}</For>
              </Select>
            </span>
          </div>
          <div class={`${styles.twoRowContainer}`}>
            <div class={`${styles.divide}`} style={{
              "display": "flex",
              "flex-direction": "column",
            }}>
              <Proficiency setSaves={setSavingThrows} setProficiencies={setProficiencies} currentClass={currentClass} />
              <div style={{width:'100%'}}>
                <Tabs>
                  <Tab name="Subclasses">
                    <div>
                      <div>
                        <FormField name="Subclass Type">
                          <Input transparent type="text" 
                            placeholder="e.g.. __ bloodline, order of the __" 
                            value={currentClass.classMetadata?.subclassType ?? ""}
                            onChange={(e)=>setCurrentClass(old => ({
                              classMetadata: {
                                ...old.classMetadata,
                                subclassType: e.currentTarget.value.trim()
                              }
                            }))}/>
                        </FormField>
                        <Select disableUnselected transparent 
                          value={currentClass.classMetadata?.subclassTypePosition ?? "before"}
                          onChange={(e)=>setCurrentClass((old)=>({
                            classMetadata: {
                              ...old.classMetadata,
                              subclassTypePosition: e.currentTarget.value
                            }
                          }))}>
                          <Option value={'before'}>Before</Option>
                          <Option value={'after'}>After</Option>
                        </Select>
                      </div>
                      <Show when={!!currentClass.classMetadata?.subclassType.trim().length}>
                        <div>
                          <Input style={{width: '75px', border: '1px solid'}} 
                            transparent type="number" 
                            min={1} max={20}
                            value={toAddSubclassLevel()}
                            onInput={(e)=>setToAddSubclassLevel(+e.currentTarget.value)} 
                          />
                          <Button onClick={()=>{
                            setSubclassLevels([...new Set([...currentClass.classMetadata.subclassLevels, toAddSubclassLevel()])].sort());
                            setToAddSubclassLevel(1);
                          }}>Add Subclass Level</Button>
                        </div>
                        <div>
                          <For each={currentClass.classMetadata.subclassLevels}>{(level)=><>
                            <span>
                              {level}
                              <Button onClick={()=>{
                                setSubclassLevels(currentClass.classMetadata.subclassLevels.filter((x)=>x !== level));
                              }}>x</Button>
                            </span>
                          </>}</For>
                        </div>
                      </Show>
                    </div>
                  </Tab>
                  <Tab name="Class Specific">
                    <div>
                      <FormField name="Column Name">
                        <Input transparent type="text" 
                          value={newColumnKeyname()} 
                          onInput={(e)=>{setNewColumnKeyname(e.currentTarget.value.trim())}} />
                      </FormField>
                      <Button
                        disabled={newColumnInvalid()} 
                        onClick={()=>{
                          addClassSpecificAll(newColumnKeyname());
                          setCurrentColumns(getShouldDisplayColumns(casterType()));
                          setNewColumnKeyname('');
                        }} 
                      >New Table Column</Button>
                    </div>
                    <div>
                      <For each={getClassSpecificKeys(currentClass)}>{(key)=><>
                        <span>
                          {key} 
                          <Button 
                            onClick={()=>{
                              removeClassSpecific(key);
                            }}
                          >x</Button>
                        </span>
                      </>}</For>
                    </div>
                  </Tab>
                  <Tab 
                    name="Spellcasting"
                    hidden={() => !casterType() || !!casterType() && casterType() === "none"}>
                    <div class={`${styles.spellcasting}`}>
                      <span class={`${styles.selectSpan}`}>
                        <label>Casting Stat</label>
                        <Select disableUnselected transparent 
                          value={(()=>{
                            const classCast = currentClass.spellcasting;
                            if (classCast) {
                              const abilityValue = classCast.spellcastingAbility;
                              if (typeof abilityValue === 'string'  && !/\d/.test(abilityValue)) return JSON.parse(JSON.stringify(CastingStat))[abilityValue]?.toString();
                              if (typeof abilityValue === 'number' || /\d/.test(abilityValue)) return abilityValue?.toString();
                            }
                            return '1';
                          })()} 
                          onChange={(e)=>{setSpellCastingAbility(+e.currentTarget.value)}}> 
                          <For each={[1,2,3]}>{(x)=><>
                            <Option value={x}>{CastingStat[x]}</Option>
                          </>}</For>
                        </Select>
                      </span>
                      <span class={`${styles.selectSpan}`}>
                        <label>Spells Known</label>
                        <Input type="checkbox"
                          tooltip="Round up spells known?"
                          style={{"margin": "0px", 'margin-left': '10px'}} 
                          checked={currentClass.spellcasting?.spellsKnownRoundup ?? false} 
                          onChange={(e)=>{
                            const casterType = currentClass.spellcasting?.casterType as keyof typeof SpellsKnown;
                            if (casterType) {
                              const num = +SpellsKnown[casterType] as number;
                              setSpellKnown(num, e.currentTarget.checked);
                            }
                          }}/>
                        <Select disableUnselected transparent
                          value={Clone<any>(SpellsKnown)[(currentClass.spellcasting?.spellsKnownCalc ?? 'Level')] as number}
                          onChange={(e)=>{
                            setSpellKnown(+e.currentTarget.value);
                            setCurrentColumns(getShouldDisplayColumns(casterType()));
                          }}>
                          <For each={[1,2,3,4,5,6]}>{(x)=><>
                            <Option value={x}>{SpellsKnown[x]}</Option>
                          </>}</For>
                        </Select>
                      </span>
                      <span>
                        <Button onClick={()=>setShowSpellcasting(!showSpellcasting())}>Add Spellcasting Description</Button>
												
                        <Show when={showSpellcasting()}>
                          <Modal title="Spellcasting Desc" setClose={setShowSpellcasting}>
                            <div style={{"margin-top":"1%"}}>
                              <div>
                                <Button onClick={(e)=>{
                                  setSpellCastingInfo((currentClass.spellcasting?.info ?? []).concat({name:'', desc:[]}));
                                }}>Add Spellcasting Description</Button>
                              </div>
                              <div style={{
                                "overflow-y": "auto", 
                                "height": "450px", 
                                'width': '100%',
                                display: 'flex',
                                'flex-direction': 'row',
                                'flex-wrap': 'wrap',
                              }
                              }>
                                <For each={currentClass.spellcasting?.info}>{(entry, i)=>
                                  <div style={{
                                    display: 'flex',
                                    "flex-direction": 'column',
                                    width: '48%'
                                  }}>
                                    <FormField name={`Spellcasting Desc ${i()}`}>
                                      <Input transparent 
                                        value={entry.name} 
                                        onChange={(e)=>{
                                          setSpellCastingInfo((currentClass.spellcasting?.info ?? [])
                                            .map((x, index)=>index === i() ? {name:e.currentTarget.value , desc: x.desc }: x)
                                          );
                                        }}/>
                                    </FormField>
                                    <FormField style={{width: '50%'}} name={`Spellcasting Desc ${i()}`}>
                                      <TextArea transparent 
                                        text={()=>entry.desc.join('\n')}
                                        onChange={(e)=>getSpellDesc(i())(e.currentTarget.value)} 
                                        style={{width: '100%'}}
                                        setText={()=>{}} />
                                    </FormField>
                                    <Button onClick={(e)=>{
                                      setSpellCastingInfo((currentClass.spellcasting?.info ?? []).filter((x, index)=>index !== i()));
                                    }}>Remove</Button>
                                    <br style={{
                                      border: '1px solid',
                                    }} />
                                  </div>
                                }</For>
                              </div>
                            </div>
                          </Modal>
                        </Show>
                      </span>
                    </div>
                  </Tab>
                </Tabs>
              </div>

            </div>
            <div class={`${styles.divide}`} />
            <StartEquipment  currentClass={currentClass}  setStartEquipChoice={setStartingEquipChoice}/>
          </div>
          <div class={`${styles.twoRowContainer} ${styles.scrollX}`}>
            <Table class={`${styles.wholeTable} `} data={()=>currentClass.classLevels} columns={currentColumns()}>
              <Column name="proficiency">
                <Header class={`${styles.headerStyle}`}>P.B.</Header>
                <Cell<LevelEntity> class={`${styles.cellStyle}`}>{(x)=>`+${x.profBonus}`}</Cell>
              </Column>
              <Column name="level">
                <Header class={`${styles.headerStyle}`}>Level</Header>
                <Cell class={`${styles.cellStyle}`}>{(x)=>x.level}</Cell>
              </Column>
              <Column name="features">
                <Header class={`${styles.headerStyle}`}>Features</Header>
                <Cell<LevelEntity> class={`${styles.tableFeature}`}>{(x, i)=>{
                  return <>
                    <Button onClick={(e)=>{
                      setCurrentLevel(x);
                      setShowAddFeature(old => !old);
                    }}>+</Button>
                    <For each={x?.features}>{(entry, i)=>{
                      return <span class={`${styles.chipHover}`} onClick={(e)=>{
                        setCurrentFeatureIndex(i());
                        setCurrentLevel(x);
                        setShowAddFeature(old => !old);
                      }}>
                        <Chip key={getFeatureKey(entry)} value={`${entry?.name} `} remove={()=>removeFeature(entry?.info?.level, entry?.name)} />
                      </span>
                    }}</For>
                  </>;
                }}</Cell>
              </Column>
              <Column name='spellsKnown'>
                <Header class={`${styles.headerStyle}`}>Spells Known</Header>
                <Cell<LevelEntity> class={`${styles.cellStyle}`}>{(x)=><span>
                  <Input style={{width:'2.5rem'}} 
                    value={currentClass.classLevels[x.level-1].spellcasting?.spells_known}
                    onChange={(e)=>setSpellsKnown(x.level, +e.currentTarget.value)}
                    type="number" 
                    min={0} />
                </span>}</Cell>
              </Column>
              <Column name="cantrip">
                <Header class={`${styles.headerStyle}`}>Cantrips</Header>
                <Cell<LevelEntity> class={`${styles.cellStyle}`}>{
                  (x)=><Input style={{width:'2.5rem', border: '1px solid'}} type="number" transparent min={0}
                    value={currentClass.classLevels[x.level-1]?.spellcasting?.cantrips_known}
                    onChange={(e)=>setSpellCantrips(x.level, +e.currentTarget.value)}/>
                }</Cell>
              </Column>
              <For each={getClassSpecificKeys(currentClass)}>{(key)=><Column name={key}>
                <Header class={`${styles.headerStyle}`}>{key}</Header>
                <Cell<LevelEntity> class={`${styles.cellStyle}`}>{(x)=><Input transparent 
                  value={x.classSpecific[key]} 
                  onInput={(e)=>{
                    setCurrentClass((old)=>({
                      classLevels: old.classLevels
                        .map((level)=>level.level === x.level ? {...level, 
                          classSpecific: {...level.classSpecific, [key]: (e.currentTarget.value ?? '0')}
                        } : {...level, classSpecific: {...level.classSpecific, [key]: (level.classSpecific[key] ?? '0')}})}));
                  }}
                  style={{
                    width: '50px',
                    border: '1px solid'
                  }}
                />}</Cell>
              </Column>
              }</For>
              <For each={[1,2,3,4,5,6,7,8,9]}>{(level)=>
                <Column name={`spell_slots_level_${level}`}>
                  <Header class={`${styles.headerStyle}`}>{SpellLevels.get(level.toString())}</Header>
                  <Cell<LevelEntity> class={`${styles.cellStyle}`}>{(x)=><>
                    <Show when={casterType().toLowerCase() !== "other"}>{
                      getSpellSlot(x.level, level)
                    }</Show>
                    <Show when={casterType().toLowerCase() === "other"}>
                      <Input 
                        style={{width:"2rem"}}
                        value={currentClass.classLevels[x.level-1].spellcasting?.[`spell_slots_level_${level}`]} 
                        onChange={(e)=> setSpellSlot(x.level, level, +e.currentTarget.value)}/>
                    </Show>
                  </>}</Cell>
                </Column>
              }</For>
              <Row class={`${styles.rowStyle}`}/> 
            </Table>
            <Show when={showAddFeature()}>
              <FeatureModal 
                addFeature={addFeature}
                replaceFeature={replaceFeature} 
                showFeature={showAddFeature}
                currentLevel={currentLevel()} 
                setShowFeature={setShowAddFeature}
                editIndex={currentFeatureIndex}
                setEditIndex={setCurrentFeatureIndex} />
            </Show>
          </div>
        </div>
      </Body>
    </>
  );
};
export default Classes;
