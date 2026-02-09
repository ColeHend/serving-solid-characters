import { Button, ExpansionPanel, Select, Option, TabBar, Cell, Column, Header, Icon, Row, Table, FormGroup, FormField, Input } from "coles-solid-library";
import { range } from "rxjs";
import { Accessor, Component, createEffect, createMemo, createSignal, For, Setter, Show } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { CasterType, Class5E, Spell, Subclass } from "../../../../models/data";
import { useDnDClasses } from "../../../../shared/customHooks/dndInfo/info/all/classes";
import styles from "./classesSection.module.scss";
import { AddClass } from "./AddClass/AddClass";
import { Clone, getSpellSlots, spellLevel } from "../../../../shared";
import SpellModal from "../../../../shared/components/modals/spellModal/spellModal.component";
import { useDnDSpells } from "../../../../shared/customHooks/dndInfo/info/all/spells";
import getSpellAndCasterLevel from "../../../../shared/customHooks/utility/tools/getSpellAndCasterLevel";
import { Character, CharacterForm } from "../../../../models/character.model";
import { useDnDSubclasses } from "../../../../shared/customHooks/dndInfo/info/all/subclasses";
import { formSubclass } from "../create";

export type charClasses = {
  className: string;
  subclass?: string;
}

interface sectionProps {
  charClasses: [Accessor<string[]>,Setter<string[]>];
  classLevels: [Accessor<Record<string, number>>, Setter<Record<string, number>>];
  knownSpells: [Accessor<string[]>, Setter<string[]>];
  formGroup: FormGroup<CharacterForm>;
  currSubclasses: [Accessor<formSubclass[]>, Setter<formSubclass[]>];
}

export const ClassesSection: Component<sectionProps> = (props) => {
  const classes = useDnDClasses();
  const srdSpells = useDnDSpells();
  const subclasses = useDnDSubclasses();

  const group = createMemo(()=>props.formGroup); 

  const [knownSpells, setKnownSpells] = props.knownSpells;
  
  const charSpells = createMemo(()=>knownSpells());
  
  const [classLevels, setClassLevels] = props.classLevels; 
  const [charClasses, setCharClasses] = props.charClasses; 

  const [showAddClass,setShowAddClass] = createSignal<boolean>(false);
  const [activeTab, setActiveTab] = createSignal<Record<string, number>>({});

  const [learnSpells,setLearnSpells] = createSignal<Spell[]>([]);
  // const [currentSort, setCurrentSort] = createSignal<{
  //     sortKey: string;
  //     isAsc: boolean;
  // }>({ sortKey: "level", isAsc: true });
  const [showSpellModal,setShowSpellModal] = createSignal<boolean>(false);
    

  const levels = createMemo<number[]>(()=>new Array(20).fill(0).map((x,i)=>i+1));

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
    return classLevels()[className] ?? 1;
  }
  const setCharacterLevel = (className: string, level: number): void => {
    setClassLevels(old => ({...old,[className]: level}));
  }

  const getClass = (className: string): Class5E => {
      return classes().find(c => c.name === className) ?? {} as Class5E;
  }
  
  const range = (start: number, end:number, step = 1) => Array.from({ length: Math.ceil((end - start) / step) }, (_, i) => start + i * step);
  

  const isLearned = (spellName: string) => {
    // return charSpells().includes(spellName);

    return charSpells().some(x=>x.includes(spellName))
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
      const subclassSpells = srdSpells().filter(s => s.subClasses.includes(currentSubclass()[0]));

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
    const subclassSpells = srdSpells().filter(s => s.subClasses.includes(currentSubclass()[0]));

    const allSpells = Clone([...classSpells,...subclassSpells]);
    

    if (allSpells.length > 0) return true;

    return false;
  }
   
  const currentLevel = createMemo<number>(()=>{
    let totalLevel = 0;


    charClasses().forEach((class5e)=> {
      
      let level = getCharacterLevel(class5e);      

      if (Number.isNaN(level) || level < 0) {
        level = 0;
      }

      totalLevel += level 
    })

    return totalLevel;
  })

  const noNegitveValue = (value: number) => {
    if (Number.isNaN(value) || value < 0) return 0;

    return value;
  }
  
  const getSubclasses = (className: string) => {
    const currentClass = getClass(className);
    
    return subclasses().filter(subclass=>subclass.parentClass === currentClass.name);

  }

  const currentSubclass = createMemo(()=>group().get().subclass);


  // Class Info Getter Funcitions

  const savingThrows = (className: string) => {
    const class5e = getClass(className);

    return class5e.savingThrows;
  }

  const armorProfs = (className: string) => {
    const class5e = getClass(className);

    return class5e.proficiencies.armor;
  }

  const weaponProfs = (className: string) => {
    const class5e = getClass(className);

    return class5e.proficiencies.weapons;
  }

  const toolsProfs = (className: string) => {
    const class5e = getClass(className);

    return class5e.proficiencies.tools;
  }

  const skillProfs = (className: string) => {
    const class5e = getClass(className);

    return class5e.proficiencies.skills;
  }

  const skillChoices = (className: string) => {
    const class5e = getClass(className);

    return class5e.choices?.[class5e.startChoices?.skills ?? ''];
  }

  createEffect(()=>{
    console.log("classes: ", levels());
    
  })




  return (
    <FlatCard
      icon="shield"
      headerName={<div style={{width:"20vw", display:"flex",margin:"0",padding: "0","flex-direction": "row"}}>
        <span>Class(es):</span>
        ({currentLevel()})
        <For each={charClasses()}>
          {(class5e)=> <span >
            {class5e} ({noNegitveValue(getCharacterLevel(class5e))})  
          </span>}
        </For>
        
      </div>}
      extraHeaderJsx={
        <div>
          <Button onClick={()=>setShowAddClass(old=>!old)}>Add Class</Button>
        </div>
      }
      transparent
    >
      <div class={`${styles.classesSection}`}>
        <For each={charClasses()}>
          {(charLevel, i) => (
            <FlatCard headerName={`${charLevel} (${getCharacterLevel(charLevel) === -1 ? 1 : getCharacterLevel(charLevel)})`} class={`${styles.cardAlt}`} extraHeaderJsx={
                <Show when={i() !== 0}>
                  <Button onClick={()=>{
                    const confirm = window.confirm("Are you sure?");

                    if (confirm) setCharClasses(old => old.filter(old => old !== charLevel));
                  }}>Delete</Button>
                </Show>
            } transparent>
              <div class={`${styles.classHeader}`}>
                  <Select
                    value={getCharacterLevel(charLevel)}
                    defaultValue={1}
                    onSelect={(value) =>
                      setCharacterLevel(charLevel, value)
                    }
                    class={`${styles.levelSelect}`}
                  >
                    <For each={levels()}>
                      {(level) => <Option value={level}>{level}</Option>}
                    </For>
                  </Select>
              </div>

              <div>
                <div>
                  <strong>Saving Throws: </strong>
                  {savingThrows(charLevel).join(", ")}
                </div>

                <h3>Proficiencies</h3>
                    
                <Show when={weaponProfs(charLevel).length > 0} fallback={
                  <div>
                      <strong>Weapons: </strong>
                      None
                  </div>
                }>
                  <div>
                      <strong>Weapons: </strong>
                      {weaponProfs(charLevel).join(", ")}
                  </div>
                </Show>

                <Show when={armorProfs(charLevel).length > 0} fallback={<div>
                  <strong>Armor: </strong>
                  None
                </div>}>
                  <div>
                    <strong>Armor: </strong>
                    {armorProfs(charLevel).join(", ")}
                  </div>
                </Show>

                <Show when={toolsProfs(charLevel).length > 0} fallback={<div>
                  <strong>Tools: </strong>
                  None
                </div>}>
                  <div>
                    <strong>Tools: </strong>
                    {toolsProfs(charLevel).join(", ")}
                  </div>
                </Show>

                <Show when={skillProfs(charLevel).length > 0} fallback={<div>
                  <strong>Skills: </strong>
                  None
                </div>}>
                  <div>
                    <strong>Skills: </strong>
                    {skillProfs(charLevel).join(", ")}
                  </div>
                </Show>

              </div>

              <div>
                <h3>Skill Choices</h3>
                Choose <span>{skillChoices(charLevel)?.amount}</span> skills from the list below.
                
                  {/* <Select
                    value={Array.isArray(currentSkills()) ? currentSkills() : []}
                    onSelect={(value) => {
                      // Ensure value is always an array
                      const selected = Array.isArray(value) ? value : [value];

                      
                    }}
                    multiple
                  >
                    <For each={skillChoices(charLevel)?.options}>
                      {(skill) => <Option value={skill}>{skill}</Option>}
                    </For>
                  </Select> */}
                {/* <FormField name="Skill Choices">
                </FormField> */}

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
                              transparent
                            >
                              {feature.description}

                              {feature.metadata?.category}

                              <Show when={feature.name.includes(`Subclass`)}>
                                <FormField name="subclass">
                                  <Select
                                    value={currentSubclass()[0]}
                                    onSelect={value => {
                                      // Only update the subclass, not the whole form or class level
                                      group().set("subclass",[...group().get().subclass, value]);
                                    }}
                                  >
                                    <For each={getSubclasses(charLevel)}>
                                      {(subclass, i) => <Option value={subclass.name}>{subclass.name}</Option>}
                                    </For>
                                  </Select>
                                </FormField>
                              </Show>
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
          allClasses={()=>classes().filter(class5e=>!charClasses().some(c => c.includes(class5e.name)))}
          setCharClasses={setCharClasses}
        />
      </Show>
    </FlatCard>
  );
};