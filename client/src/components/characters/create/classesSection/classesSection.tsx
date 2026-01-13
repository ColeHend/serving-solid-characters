import { Button, ExpansionPanel, Select, Option, TabBar, Cell, Column, Header, Icon, Row, Table } from "coles-solid-library";
import { range } from "rxjs";
import { Accessor, Component, createEffect, createMemo, createSignal, For, Setter, Show } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { CasterType, Class5E, Spell } from "../../../../models/data";
import { useDnDClasses } from "../../../../shared/customHooks/dndInfo/info/all/classes";
import styles from "./classesSection.module.scss";
import { AddClass } from "./AddClass/AddClass";
import { Clone, getSpellSlots, spellLevel } from "../../../../shared";
import SearchBar from "../../../../shared/components/SearchBar/SearchBar";
import SpellModal from "../../../../shared/components/modals/spellModal/spellModal.component";
import { useDnDSpells } from "../../../../shared/customHooks/dndInfo/info/all/spells";
import getSpellAndCasterLevel from "../../../../shared/customHooks/utility/tools/getSpellAndCasterLevel";
import { aL } from "vitest/dist/chunks/reporters.d.BFLkQcL6";
import { Character } from "../../../../models/character.model";
import { SetStoreFunction } from "solid-js/store";

export type charClasses = {
  className: string;
  subclass?: string;
}

interface sectionProps {
  charClasses: [Accessor<string[]>,Setter<string[]>];
  classLevels: [Accessor<Record<string, number>>, Setter<Record<string, number>>];
  character: [get: Character, set: SetStoreFunction<Character>];
  selectedSubclass: Accessor<string>;
}

export const ClassesSection: Component<sectionProps> = (props) => {
  const classes = useDnDClasses();
  const srdSpells = useDnDSpells();

  const [newCharacter, setNewCharacer] = props.character;

  const character = createMemo(()=>newCharacter);

  const charSpells = createMemo(()=>character().spells);

  const [classLevels, setClassLevels] = props.classLevels; 
  const [charClasses, setCharClasses] = props.charClasses; 

  const [showAddClass,setShowAddClass] = createSignal<boolean>(false);
  const [activeTab, setActiveTab] = createSignal<Record<string, number>>({});

  const [learnSpells,setLearnSpells] = createSignal<Spell[]>([]);
  const [currentSort, setCurrentSort] = createSignal<{
      sortKey: string;
      isAsc: boolean;
  }>({ sortKey: "level", isAsc: true });
  const [showSpellModal,setShowSpellModal] = createSignal<boolean>(false);
    

  const levels = createMemo<number[]>(()=>[
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20
  ])

  const [selectedSpell,setSelectedSpell] = createSignal<Spell>({
    id: "",
    name: "",
    description: "",
    duration: "",
    is_concentration: false,
    level: "0",
    range: "",
    is_ritual: false,
    school: "",
    castingTime: "",
    damageType: "",
    page: "",
    components: "",
    isMaterial: false,
    isSomatic: false,
    isVerbal: false,
    materials_Needed: "",
    higherLevel: "",
    classes: [],
    subClasses: []
  });
  
    
  const getCharacterLevel = (className: string): number => {
    return classLevels()[className] ?? 0;
  }
  const setCharacterLevel = (className: string, level: number): void => {
    setClassLevels(old => ({...old,[className]: level}));
  }

  const currentSublcass = createMemo(()=>props.selectedSubclass());


  const getClass = (className: string): Class5E => {
      return classes().find(c => c.name === className) ?? {} as Class5E;
  }
  
  const range = (start: number, end:number, step = 1) => Array.from({ length: Math.ceil((end - start) / step) }, (_, i) => start + i * step);
  

  const isLearned = (spellName: string) => {
    // return charSpells().includes(spellName);

    if (charSpells().some(x=>x.name.includes(spellName))) {
      return true
    } else {
      return false
    }
  }

  const filterdSpells = (className: string) => {
    // get class information.
    const [class5e,] = createSignal<Class5E>(getClass(className)); 

    // get current class level
    const level = createMemo<number>(()=>getCharacterLevel(className));

    // check for highest slots
    const highestSlotLevel = createMemo<number>(()=>{

      return getSpellAndCasterLevel(class5e(),"spell",level() - 1)
    }) 

    // - filter spells by class and subclass 
    // - then return spells filterd by highest spell slot
    return createMemo(()=>{
      const classSpells = srdSpells().filter(s => s.classes.includes(className));
      const subclassSpells = srdSpells().filter(s => s.subClasses.includes(currentSublcass()));

      const allSpells = Clone([...classSpells,...subclassSpells]);
      
      setLearnSpells(allSpells.filter(spell=> !!spell.level && +spell.level <= highestSlotLevel())); 
      
      return learnSpells().sort((a,b)=>+a.level - +b.level);
  });
  }
  const getTab = (name: string) => {

    return activeTab()?.[name] ?? 0;
  }
  const setTab = (name:string, activeTab: number):void => {
    setActiveTab(old =>({...old,  
      [name]: activeTab
    }));
  }

  const hasSpells = (className: string) => {
    const classSpells = srdSpells().filter(s => s.classes.includes(className));
    const subclassSpells = srdSpells().filter(s => s.subClasses.includes(currentSublcass()));

    const allSpells = Clone([...classSpells,...subclassSpells]);
    

    if (allSpells.length > 0) return true;

    return false;
  }
   

  const currentLevel = createMemo<number>(()=>{
    let totalLevel = 0;

    charClasses().forEach((class5e)=> {
      let level = getCharacterLevel(class5e);

      console.log("class level: ", level);
      

      if (Number.isNaN(level)) {
        level = 0;
      } 

      totalLevel += level -1
    })

    return totalLevel;
  })

  const noNegitveValue = (value: number) => {
    if (value === -1) return 0;

    return value;
  }
  
  return (
    <FlatCard
      icon="shield"
      headerName={<div style={{width:"20vw", display:"flex",margin:"0",padding: "0","flex-direction": "row"}}>
        <span>Class(es):</span>
        ({currentLevel()})
        <For each={charClasses()}>
          {(class5e)=> <span >
            {class5e} ({noNegitveValue(getCharacterLevel(class5e) - 1)})  
          </span>}
        </For>
        
      </div>}
      extraHeaderJsx={
        <div>
          <Button onClick={()=>setShowAddClass(old=>!old)}>Add Class</Button>
        </div>
      }
    >
      <div class={`${styles.classesSection}`}>
        <For each={charClasses()}>
          {(charLevel, i) => (
            <FlatCard headerName={`${charLevel} (${getCharacterLevel(charLevel) - 1 === -1 ? 0 : getCharacterLevel(charLevel) - 1})`} class={`${styles.cardAlt}`} extraHeaderJsx={
                <Show when={i() !== 0}>
                  <Button onClick={()=>{
                    const confirm = window.confirm("Are you sure?");

                    if (confirm) setCharClasses(old => old.filter(old => old !== charLevel));
                  }}>Delete</Button>
                </Show>
            }>
              <div class={`${styles.classHeader}`}>
                

                <Select
                  value={getCharacterLevel(charLevel)}
                  onSelect={(value) =>
                    setCharacterLevel(charLevel, value)
                  }
                  class={`${styles.levelSelect}`}
                >
                  <For each={levels()}>
                    {(level) => <Option value={level + 1}>{level}</Option>}
                  </For>
                </Select>
              </div>
              <div class={`${styles.TabBar}`} style={{}}>
                <Button onClick={()=>getTab(charLevel) === 0 ? setTab(charLevel,-1) :setTab(charLevel,0)} transparent>Features <Show when={getTab(charLevel) === 0} fallback={"↑"}>↓</Show></Button>
                <Show when={hasSpells(charLevel)}>
                  <Button onClick={()=>getTab(charLevel) === 1 ? setTab(charLevel,-1) :setTab(charLevel,1)} transparent>Spells <Show when={getTab(charLevel) === 1} fallback={"↑"}>↓</Show></Button>
                </Show>
              </div>
              <Show when={getTab(charLevel) === 0}>
                <div style={{ height: "40vh", "overflow-y": "scroll" }}>
                  <For each={range(1, getCharacterLevel(charLevel))}>
                    {(level) => (
                      <div>
                        <For each={getClass(charLevel).features?.[level]}>
                          {(feature) => (
                            <FlatCard
                              headerName={`${feature.name}`}
                              icon="star"
                              class={`${styles.cardAlt}`}
                            >
                              {feature.description}

                              {feature.metadata?.category}
                            </FlatCard>
                          )}
                        </For>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
              <Show when={getTab(charLevel) === 1}>
                <div class={`${styles.learnSpellsTable}`}>
                  <Table data={filterdSpells(charLevel)} columns={["name","level","learnBtn"]}>
                      <Column name="name">
                          <Header>
                              Name
                          </Header>
                          <Cell<Spell>>
                              {(spell)=><span>
                                  <div>{spell.name}</div>
                                  <div>
                                      <Show when={spell.is_concentration}>
                                          <span>concentration</span>
                                      </Show>
                                      <Show when={spell.is_ritual}>
                                          <span>ritual</span>
                                      </Show>
                                  </div>

                              </span>}
                          </Cell>
                      </Column>

                      <Column name="level">
                          <Header>
                          Level
                          </Header>
                          <Cell<Spell>>
                              {(spell)=><span>
                                  <span>{spellLevel(+spell.level)}</span>
                              </span>}
                          </Cell>
                      </Column>

                      <Column name="learnBtn">
                        <Header><></></Header>
                        <Cell<Spell> onClick={(e)=>e.stopPropagation()}>
                          {(spell)=><span>
                              <Show when={!isLearned(spell.name)}>
                                  <Button class={`${styles.LearnBtn}`} onClick={()=>{
                                      setNewCharacer('spells',(old)=>{
                                        return [...old, {name: spell.name, prepared: false}]
                                      })
                                  }}>
                                      <Icon name="add"/> Learn
                                  </Button>
                              </Show>
                              <Show when={isLearned(spell.name)}>
                                  <Button class={`${styles.LearnBtn}`} onClick={()=>{
                                      setNewCharacer('spells',(old)=>old.filter(s=>s.name !== spell.name));
                                  }}>
                                      <Icon name="remove" /> Delete
                                  </Button>
                              </Show>
                          </span>}
                        </Cell>
                      </Column>
                      
                      <Row onClick={(e,spell)=>{
                          setSelectedSpell(spell);
                          setShowSpellModal(old => !old);
                      }} />
                  </Table>
                </div>
              </Show>


              <Show when={showSpellModal()}>
                <SpellModal 
                  spell={selectedSpell}
                  backgroundClick={[showSpellModal,setShowSpellModal]}
                />
              </Show>
            </FlatCard>
          )}
        </For>
      </div>

      <Show when={showAddClass()}>
        <AddClass 
          show={[showAddClass, setShowAddClass]}
          allClasses={()=>classes().filter(class5e=>!charClasses().some(c => c.includes(class5e.name)))}
          setCharClasses={setCharClasses}
        />
      </Show>
    </FlatCard>
  );
};



