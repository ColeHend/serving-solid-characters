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

export type charClasses = {
  className: string;
  subclass?: string;
}

interface sectionProps {
  charClasses: [Accessor<charClasses[]>,Setter<charClasses[]>];
  classLevels: [Accessor<Record<string, number>>, Setter<Record<string, number>>];
  getCharLevel: (className: string) => number;
  setCharLevel: (className: string, level: number) => void;
  knSpells: [Accessor<string[]>,Setter<string[]>];
  selectedSubclass: Accessor<string>;
}

export const ClassesSection: Component<sectionProps> = (props) => {
  const classes = useDnDClasses();
  const srdSpells = useDnDSpells();

  const [knownSpells,setKnownSpells] = props.knSpells;
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
  

  
    
  const getCharacterLevel = props.getCharLevel;
  const setCharacterLevel = props.setCharLevel;
  const currentSublcass = createMemo(()=>props.selectedSubclass());


  const getClass = (className: string): Class5E => {
      return classes().find(c => c.name === className) ?? {} as Class5E;
  }
  
  const range = (start: number, end:number, step = 1) => Array.from({ length: Math.ceil((end - start) / step) }, (_, i) => start + i * step);
  

  const isLearned = (spellName: string) => {
    return knownSpells().includes(spellName);
  }

  const filterdSpells = (className: string) => {
    // get class information.
    const [class5e,] = createSignal<Class5E>(getClass(className)); 

    // get current class level
    const level = createMemo<number>(()=>getCharacterLevel(className));

    // use current level and caster type to get the slots
    // const firstLSlots = createMemo(()=>getSpellSlots(level(), 1,class5e().spellcasting?.metadata.casterType ?? CasterType.None));
    // const secondLSlots = createMemo(()=>getSpellSlots(level(),2,class5e().spellcasting?.metadata.casterType ?? CasterType.None));
    // const thirdLSlots = createMemo(()=>getSpellSlots(level(), 3,class5e().spellcasting?.metadata.casterType ?? CasterType.None));
    // const fourthLSlots = createMemo(()=>getSpellSlots(level(),4,class5e().spellcasting?.metadata.casterType ?? CasterType.None));
    // const fithLSlots = createMemo(()=>getSpellSlots(level(),  5,class5e().spellcasting?.metadata.casterType ?? CasterType.None));
    // const sixthLSlots = createMemo(()=>getSpellSlots(level(), 6,class5e().spellcasting?.metadata.casterType ?? CasterType.None));
    // const seventhLSlots = createMemo(()=>getSpellSlots(level(),7,class5e().spellcasting?.metadata.casterType ?? CasterType.None));
    // const eighthLSlots = createMemo(()=>getSpellSlots(level(), 8,class5e().spellcasting?.metadata.casterType ?? CasterType.None));
    // const ninthLSlots = createMemo(()=>getSpellSlots(level(),  9,class5e().spellcasting?.metadata.casterType ?? CasterType.None));

    // check for highest slots
    const highestSlotLevel = createMemo<number>(()=>{

      console.log("level", level());
      

      return getSpellAndCasterLevel(class5e(),"spell",level() - 1)
    }) 

    // - filter spells by class and subclass 
    // - then return spells filterd by highest spell slot
    return createMemo(()=>{
      const classSpells = srdSpells().filter(s => s.classes.includes(className));
      const subclassSpells = srdSpells().filter(s => s.subClasses.includes(currentSublcass()));

      const allSpells = Clone([...classSpells,...subclassSpells]);
      
      console.log("highest slot level: ", highestSlotLevel());
      

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
  
  return (
    <FlatCard
      icon="shield"
      headerName="Classes"
      extraHeaderJsx={
        <div>
          <Button onClick={()=>setShowAddClass(old=>!old)}>Add Class</Button>
        </div>
      }
    >
      <div class={`${styles.classesSection}`}>
        <For each={charClasses()}>
          {(charLevel, i) => (
            <FlatCard icon="sword_rose" headerName={`${charLevel.className}(${getCharacterLevel(charLevel.className) - 1 === -1 ? 0 : getCharacterLevel(charLevel.className) - 1})`} class={`${styles.cardAlt}`} extraHeaderJsx={
                <Show when={i() !== 0}>
                  <Button onClick={()=>{
                    const confirm = window.confirm("Are you sure?");

                    if (confirm) setCharClasses(old => old.filter(old => old.className !== charLevel.className));
                  }}>Delete</Button>
                </Show>
            }>
              <div class={`${styles.classHeader}`}>
                <span>
                  {charLevel.className}
                  <Show when={charLevel.subclass}>({charLevel.subclass})</Show>
                </span>

                <Select
                  value={getCharacterLevel(charLevel.className)}
                  onSelect={(value) =>
                    setCharacterLevel(charLevel.className, value)
                  }
                >
                  <For each={levels()}>
                    {(level) => <Option value={level + 1}>{level}</Option>}
                  </For>
                </Select>
              </div>
              <div class={`${styles.TabBar}`} style={{}}>
                <Button onClick={()=>getTab(charLevel.className) === 0 ? setTab(charLevel.className,-1) :setTab(charLevel.className,0)} transparent>Features <Show when={getTab(charLevel.className) === 0} fallback={"↑"}>↓</Show></Button>
                <Button onClick={()=>getTab(charLevel.className) === 1 ? setTab(charLevel.className,-1) :setTab(charLevel.className,1)} transparent>Spells <Show when={getTab(charLevel.className) === 1} fallback={"↑"}>↓</Show></Button>
              </div>
              <Show when={getTab(charLevel.className) === 0}>
                <div style={{ height: "40vh", "overflow-y": "scroll" }}>
                  <For each={range(1, getCharacterLevel(charLevel.className))}>
                    {(level) => (
                      <div>
                        <For each={getClass(charLevel.className).features?.[level]}>
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
              <Show when={getTab(charLevel.className) === 1}>
                <div class={`${styles.learnSpellsTable}`}>
                  <Table data={filterdSpells(charLevel.className)} columns={["name","level","learnBtn"]}>
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
                                      setKnownSpells(old=>[...old,spell.name])
                                  }}>
                                      <Icon name="add"/> Learn
                                  </Button>
                              </Show>
                              <Show when={isLearned(spell.name)}>
                                  <Button class={`${styles.LearnBtn}`} onClick={()=>{
                                      setKnownSpells(old=>old.filter(s=>s !== spell.name));
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
          allClasses={()=>classes().filter(class5e=>!charClasses().some(c => c.className.includes(class5e.name)))}
          setCharClasses={setCharClasses}
        />
      </Show>
    </FlatCard>
  );
};



