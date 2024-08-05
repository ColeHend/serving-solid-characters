import {
  Accessor,
  Component,
  For,
  Show,
  createMemo,
  createSignal,
  useContext,
  type JSX,
} from "solid-js";
import useStyle from "../../../../../shared/customHooks/utility/style/styleHook";
import styles from "./classes.module.scss";
import HomebrewSidebar from "../../sidebar";
import HomebrewManager from "../../../../../shared/customHooks/homebrewManager";
import {
  Input,
  Button,
  Select,
  Option,
  Carousel,
  Chip,
} from "../../../../../shared/components/index";
import type { DnDClass } from "../../../../../models";
import { LevelEntity, Subclass } from "../../../../../models/class.model";
import {
  Choice,
  StartingEquipment,
  Feature,
  Item,
} from "../../../../../models/core.model";
import useGetClasses from "../../../../../shared/customHooks/data/useGetClasses";
import useGetItems from "../../../../../shared/customHooks/data/useGetItems";
import LevelBuilder from "./levelBuilder";
import { effect } from "solid-js/web";
import { SpellsKnown } from "../subclasses/subclasses";
import { useSearchParams } from "@solidjs/router";
import { SharedHookContext } from "../../../../rootApp";
import useStyles from "../../../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../../../shared/customHooks/userSettings";

const Classes: Component = () => {
  const [searchParam, setSearchParam] = useSearchParams();
  // ----------------- simple data ---
  const [name, setName] = createSignal<string>("");
  const [hitDie, setHitDie] = createSignal<number>(0);
  const [savingThrows, setSavingThrows] = createSignal<string[]>([]);

  // --- proficiencies ---
  const [statProficiencies, setStatProficiencies] = createSignal<string[]>([]);
  const [proficiencies, setProficiencies] = createSignal<string[]>([]);
  const [skillProfAmount, setSkillProfAmount] = createSignal<number>(1);
  const [skillProficiencies, setSkillProficiencies] = createSignal<string[]>([]);
  const [proficiencyChoices, setProficiencyChoices] = createSignal<Choice<string>[]>([]);

  // --- tools ---
  const [toolChoices, setToolChoices] = createSignal<string[]>([]);
  const [toolChoiceAmount, setToolChoiceAmount] = createSignal<number>(1);

  // --- subclass ---
  const [subclassLevels, setSubclassLevels] = createSignal<number[]>([]);
  const [selectedSubclassLevel, setSelectedSubclassLevel] = createSignal<number>(0);

  // --- starting items ---
  const [currentItemChoice, setCurrentItemChoice] = createSignal<string>("");
  const [currentItemChoiceGroup, setCurrentItemChoiceGroup] = createSignal<number>(1);
  const [currentItemChoiceIndex, setCurrentItemChoiceIndex] = createSignal<number>(-1);
  const [currentItemAmount, setCurrentItemAmount] = createSignal<number>(1);
  const [currentItemChoiceAmount, setCurrentItemChoiceAmount] = createSignal<number>(1);

  // --- spellcasting ---
  const [spellcastingInfo, setSpellCastingInfo] = createSignal<{
    name: string;
    desc: string[];
  }[]>([]);
  const [spellcastingAbility, setSpellCastingAbility] = createSignal<string>("");
  const [spellcastingLevel, setSpellCastingLevel] = createSignal<number>(1);
  const [spelllistUsed, setSpellListUsed] = createSignal<string>("");
  const [hasSpellCasting, setHasSpellCasting] = createSignal(false);
  const [casterType, setCasterType] = createSignal("");
  const [useCastingCalc, setUseCastingCalc] = createSignal(false);
  const [spellsKnownCalc, setSpellsKnownCalc] = createSignal<SpellsKnown>(SpellsKnown.None);
  const [spellsKnownRoundup, setSpellsKnownRoundup] = createSignal(false);

  // --- other stuff ---
  const sharedHooks = useContext(SharedHookContext);
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyles(userSettings().theme));
  const [allLevelsArr, setAllLevelArr] = createSignal(new Array(20).fill(0).map((x, i) => i + 1));
  const skills = [
    "Acrobatics",
    "Animal Handling",
    "Arcana",
    "Athletics",
    "Deception",
    "History",
    "Insight",
    "Intimidation",
    "Investigation",
    "Medicine",
    "Nature",
    "Perception",
    "Performance",
    "Persuasion",
    "Religion",
    "Sleight of Hand",
    "Stealth",
    "Survival",
  ];

  // ------------------ complex data ---
  const theItems = useGetItems();
  const allClasses = useGetClasses();
  const allTools = createMemo(() => {
    return theItems().filter((item) => item.equipmentCategory === "Tools");
  });
  const [startingEquipment, setStartingEquipment] =
    createSignal<StartingEquipment>({
      class: "",
      quantity: 0,
      choice1: [],
      choice2: [],
      choice3: [],
      choice4: [],
    });
  const [classLevels, setClassLevels] = createSignal<LevelEntity[]>(new Array(20).fill({
    info: {
      className: "",
      subclassName: "",
      level: 0,
      type: "",
      other: ""
    },
    level: 0,
    profBonus: 0,
    features: [],
    classSpecific: {},
    spellcasting: {}
  }).map((x,i)=>{
    return {
      ...x,
      info: {
        ...x.info,
        level: (i + 1)
      },
      level: (i + 1),
      profBonus: Math.ceil((i + 1) / 4) + 1,
    }
  }));
  const [features, setFeatures] = createSignal<Feature<unknown, string>[]>(new Array(20).fill({
    info: {
      className: name(),
      subclassName: "",
      level: 0,
      type: "",
      other: ""
      },
      name: "",
      value: ""
      }).map((x,i)=>{
        return {
          ...x,
          info: {
            ...x.info,
            level: (i + 1)
          },
        }
      }));
  const [subclasses, setSubclasses] = createSignal<Subclass[]>([]);

  const selectableChoices = createMemo(() => {
    switch (currentItemChoiceGroup()) {
      case 1:
        return startingEquipment()?.choice1;
      case 2:
        return startingEquipment()?.choice2;
      case 3:
        return startingEquipment()?.choice3;
      case 4:
        return startingEquipment()?.choice4;
      default:
        return startingEquipment()?.choice1;
    }
  });
  
  const currentClass: Accessor<DnDClass> = createMemo(() => {
    const theClass:DnDClass = {
      name: name(),
      hitDie: hitDie(),
      proficiencies: proficiencies(),
      proficiencyChoices: !!skillProficiencies()?.length ? [{choose: skillProfAmount(), type: "Skill", choices: skillProficiencies()}] : [],
      savingThrows: statProficiencies(),
      startingEquipment: startingEquipment(),
      classLevels: classLevels().map((y) => {
        return {
          ...y,
          info: {
            ...y.info,
            className: name()
          },
          features: features().filter((x) => x?.info?.level === y?.info?.level),
        }
      }),
      features: features(),
      subclasses: subclasses(),
      subclassLevels: subclassLevels(),
      spellcasting: hasSpellCasting() ? {
        level: spellcastingLevel(),
        name: spelllistUsed(),
        spellcastingAbility: spellcastingAbility(),
        casterType: casterType(),
        info: spellcastingInfo(),
        spellsKnownCalc: spellsKnownCalc(),
        spellsKnownRoundup: spellsKnownRoundup()
      } : undefined,
      id: 0
    }
    return theClass;
  }
  );

  const addStartingItem = (group: number) => {
    const newItem = startingEquipment();
    let currentItemChoices: Choice<Item>[] = [];
    switch (group) {
      case 1:
        currentItemChoices = newItem.choice1;
        break;
      case 2:
        currentItemChoices = newItem.choice2;
        break;
      case 3:
        currentItemChoices = newItem.choice3;
        break;
      case 4:
        currentItemChoices = newItem.choice4;
        break;
      default:
        break;
    }

    if (!(currentItemChoiceIndex() >= 0)) {
      currentItemChoices.push({
        choose: currentItemChoiceAmount(),
        type: "",
        choices: [
          {
            item: currentItemChoice(),
            quantity: currentItemAmount(),
            desc: [],
          },
        ],
      });
    } else if (currentItemChoiceIndex() >= 0) {
      if (currentItemChoiceIndex() < newItem.choice1.length) {
        currentItemChoices[currentItemChoiceIndex()].choices.push({
          item: currentItemChoice(),
          quantity: currentItemAmount(),
          desc: [],
        });
      }
    }

    switch (group) {
      case 1:
        newItem.choice1 = currentItemChoices;
        break;
      case 2:
        newItem.choice2 = currentItemChoices;
        break;
      case 3:
        newItem.choice3 = currentItemChoices;
        break;
      case 4:
        newItem.choice4 = currentItemChoices;
        break;
      default:
        break;
    }
    console.log("Adding Item: ", newItem);

    setStartingEquipment(() => JSON.parse(JSON.stringify(newItem)));
    console.log("Starting Equipment: ", startingEquipment());
  };
// ---- effects
effect(()=>{
  console.log("Search Param: ", searchParam);
  if (!!searchParam.name) {
    const foundClass = allClasses().find((x) => x.name === searchParam.name);
    console.log("Found Class: ", foundClass);
    if (!!foundClass && name() !== foundClass.name) {
      setName(foundClass.name);
      setHitDie(foundClass.hitDie);
      setProficiencies(foundClass.proficiencies);
      setSkillProfAmount(foundClass.proficiencyChoices[0]?.choose ?? 0);
      setSkillProficiencies(foundClass.proficiencyChoices[0]?.choices.map(x=>x.replace("Skill:", "").trim()));
      setStatProficiencies(foundClass.savingThrows);
      setStartingEquipment(!!foundClass.startingEquipment ? foundClass.startingEquipment : {
        class: "",
        quantity: 0,
        choice1: [],
        choice2: [],
        choice3: [],
        choice4: []
      });
      setClassLevels(foundClass.classLevels);
      
      if (!!!foundClass.features?.length || foundClass.classLevels?.length > foundClass.features?.length) {
        setFeatures(foundClass.classLevels.sort((a,b)=>a.level-b.level).flatMap((x) => x.features).map((x,i) => {
          return {
            ...x,
            info: {
              ...x.info,
              className: foundClass.name,
              level: i + 1,
            },
          }
        }));
      } else {
        setFeatures(foundClass.features);
      }
      
      setSubclasses(foundClass.subclasses);
      setSubclassLevels(foundClass.subclassLevels);
      setSpellCastingAbility(foundClass.spellcasting?.spellcastingAbility || "");
      setSpellCastingLevel(foundClass.spellcasting?.level || 1);
      setSpellListUsed(foundClass.classLevels.filter(x=>!!x.spellcasting).length > 0 ? foundClass.classLevels.filter(x=>!!x.spellcasting)[0].info.className : "");
      setHasSpellCasting(!!foundClass.spellcasting || foundClass.classLevels.map(x=>!!x.spellcasting).includes(true));
      setCasterType(foundClass.spellcasting?.casterType || "");
      setUseCastingCalc(!!foundClass.spellcasting);
      setSpellsKnownCalc(foundClass.spellcasting?.spellsKnownCalc || SpellsKnown.None);
      setSpellsKnownRoundup(!!foundClass.spellcasting?.spellsKnownRoundup);
    }
  }
})

effect(()=>{
  console.log("Current Class: ", currentClass());
})
// ----------------- JSX -----------------
  return (
    <>
      <div class={`${stylin()?.primary} ${styles.body}`}>
        <h1>Classes</h1>
        <div class={styles.Columns}>
          <div class={`${styles.Column}`}>
            <h3>Name</h3>
            <Input
              value={name()}
              placeholder="What is the class name?"
              onInput={(e) => setName(e.currentTarget.value)}
            />
            <h3>Hit Die</h3>
            <Select
              value={hitDie()}
              onChange={(e) => setHitDie(+e.currentTarget.value)}
            >
              <Option value={4}>d4</Option>
              <Option value={6}>d6</Option>
              <Option value={8}>d8</Option>
              <Option value={10}>d10</Option>
              <Option value={12}>d12</Option>
            </Select>
            <h3>Stat Proficiency</h3>
            <div class={`${styles.statProf}`}>
              <div>
                <For each={["STR", "DEX", "CON"]}>
                  {(stat) => (
                    <div>
                      <label for={stat}>{stat}:</label>
                      <Input
                        type="checkbox"
                        checked={statProficiencies().includes(stat)}
                        onChange={(e) =>
                          e.currentTarget.checked
                            ? setStatProficiencies((old) => [...old, stat])
                            : setStatProficiencies((old) =>
                              old.filter((x) => x !== stat)
                            )
                        }
                      />
                    </div>
                  )}
                </For>
              </div>
              <div>
                <For each={["INT", "WIS", "CHA"]}>
                  {(stat) => (
                    <div>
                      <label for={stat}>{stat}:</label>
                      <Input
                        type="checkbox"
                        checked={statProficiencies().includes(stat)}
                        onChange={(e) =>
                          e.currentTarget.checked
                            ? setStatProficiencies((old) => [...old, stat])
                            : setStatProficiencies((old) =>
                              old.filter((x) => x !== stat)
                            )
                        }
                      />
                    </div>
                  )}
                </For>
              </div>
            </div>
            <h3>Armor Proficiency</h3>
            <div class={`${styles.statProf}`}>
              <For
                each={["Light Armor", "Medium Armor", "Shields", "Heavy Armor"]}
              >
                {(armor) => (
                  <div>
                    <label for={armor}>{armor}</label>
                    <Input
                      type="checkbox"
                      checked={proficiencies().map(x=>x.toLowerCase()).includes(armor.toLowerCase())}
                      onChange={(e) =>
                        !e.currentTarget.checked
                          ? setProficiencies((old) => {
                            old = old.filter((x) => x !== armor)
                            return JSON.parse(JSON.stringify(old)); 
                          })
                          : setProficiencies((old) => JSON.parse(JSON.stringify([...old, armor])))
                      }
                    />
                  </div>
                )}
              </For>
            </div>
            <h3>Weapon Proficiency</h3>
            <div class={`${styles.statProf}`}>
              <For each={["Simple Weapons", "Martial Weapons"]}>
                {(weapon) => (
                  <div>
                    <label for={weapon}>{weapon}</label>
                    <Input
                      type="checkbox"
                      checked={proficiencies().map(x=>x.toLowerCase()).includes(weapon.toLowerCase())}
                      onChange={(e) =>
                        !e.currentTarget.checked
                          ? setProficiencies((old) =>
                            JSON.parse(JSON.stringify(old.filter((x) => x !== weapon)))
                          )
                          : setProficiencies((old) => JSON.parse(JSON.stringify([...old, weapon])))
                      }
                    />
                  </div>
                )}
              </For>
            </div>
          </div>
          <div class={`${styles.Column}`}>
            <h3>Skill Proficiency</h3>
            <div class={`${styles.statProf}`}>
              <div>
                <h3 class={styles.Tools}>
                  <label for="SkillChoice">Choose: </label>
                </h3>
                <Input
                  type="number"
                  name="SkillChoice"
                  placeholder="Can choose how many?"
                  value={skillProfAmount()}
                  onInput={(e) => setSkillProfAmount(+e.currentTarget.value)}
                />
                <For each={skills}>
                  {(skill) => (
                    <label for={skill}>
                      {skill}{" "}
                      <Input
                        type="checkbox"
                        checked={skillProficiencies()?.map(x=>x.toLowerCase()).includes(skill.toLowerCase())}
                        onChange={(e) =>
                          e.currentTarget.checked
                            ? setSkillProficiencies((old) => JSON.parse(JSON.stringify([...old, skill])))
                            : setSkillProficiencies((old) => JSON.parse(JSON.stringify(old.filter((x) => x !== skill))))
                        }
                      />
                    </label>
                  )}
                </For>
              </div>
            </div>
            <h3>Starting Equipment</h3>
            <div>
              <div>
                <div>
                  <Select
                    value={currentItemChoiceGroup()}
                    onChange={(e) =>
                      setCurrentItemChoiceGroup(+e.currentTarget.value)
                    }
                    disableUnselected={true}
                  >
                    <For each={[1, 2, 3, 4]}>
                      {(item) => <Option value={item}>Choice {item}</Option>}
                    </For>
                  </Select>
                  <Select
                    value={currentItemChoiceIndex()}
                    onChange={(e) =>
                      setCurrentItemChoiceIndex(+e.currentTarget.value)
                    }
                  >
                    <For each={selectableChoices()}>
                      {(item, i) => <Option value={i()}>Item {i() + 1}</Option>}
                    </For>
                  </Select>
                  <Button
                    onClick={(e) => addStartingItem(currentItemChoiceGroup())}
                  >
                    +
                  </Button>
                </div>
                <div>
                  <Input
                    placeholder="AMNT"
                    type="number"
                    style={{ width: "14%" }}
                    value={currentItemAmount()}
                    onInput={(e) =>
                      setCurrentItemAmount(+e.currentTarget.value)
                    }
                  />
                  <Select
                    onChange={(e) => {
                      setCurrentItemChoice(e.currentTarget.value);
                    }}
                  >
                    <For each={theItems()}>
                      {(item) => <Option value={item.name}>{item.name}</Option>}
                    </For>
                  </Select>
                </div>
              </div>
              <div>
                <div>
                  <div>
                    <h4>Choices </h4>
                  </div>
                  <div>
                    <For each={selectableChoices()}>
                      {(item, it) => (
                        <div class={styles.itemStuff}>
                          <div>
                            <span>
                              Choose :{" "}
                              <Input
                                type="number"
                                placeholder="How many can be chosen?"
                                value={item.choose}
                                onInput={(e) =>
                                  setCurrentItemChoiceAmount(
                                    +e.currentTarget.value
                                  )
                                }
                              />{" "}
                            </span>
                          </div>
                          <div>
                            <For each={item.choices}>
                              {(choice, i) => (
                                <Chip
                                  key={choice.item}
                                  value={`${choice.quantity}`}
                                  remove={() => {
                                    setStartingEquipment((old) => {
                                      switch (currentItemChoiceGroup()) {
                                        case 1:
                                          old.choice1[it()].choices.splice(
                                            i(),
                                            1
                                          );
                                          if (
                                            old.choice1[it()].choices.length ===
                                            0
                                          ) {
                                            old.choice1.splice(it(), 1);
                                          }
                                          old.choice1 = [...old.choice1];
                                          break;
                                        case 2:
                                          old.choice2[it()].choices.splice(
                                            i(),
                                            1
                                          );
                                          if (
                                            old.choice2[it()].choices.length ===
                                            0
                                          ) {
                                            old.choice2.splice(it(), 1);
                                          }
                                          old.choice2 = [...old.choice2];
                                          break;
                                        case 3:
                                          old.choice3[it()].choices.splice(
                                            i(),
                                            1
                                          );
                                          if (
                                            old.choice3[it()].choices.length ===
                                            0
                                          ) {
                                            old.choice3.splice(it(), 1);
                                          }
                                          old.choice3 = [...old.choice3];
                                          break;
                                        case 4:
                                          old.choice4[it()].choices.splice(
                                            i(),
                                            1
                                          );
                                          if (
                                            old.choice4[it()].choices.length ===
                                            0
                                          ) {
                                            old.choice4.splice(it(), 1);
                                          }
                                          old.choice4 = [...old.choice4];
                                          break;
                                        default:
                                          break;
                                      }
                                      return JSON.parse(JSON.stringify(old));
                                    });
                                  }}
                                />
                              )}
                            </For>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <h3>Tool Proficiency</h3>
        <div>
          <h3 class={styles.Tools}>
            <label for="ToolChoice">Choose: </label>
          </h3>
          <Input
            type="number"
            name="ToolChoice"
            placeholder="Can choose how many?"
            value={toolChoiceAmount()}
            onInput={(e) => setToolChoiceAmount(+e.currentTarget.value)}
          />
          <div class={`${styles.toolProf}`}>
            <label for="all">
              <Input
                type="checkbox"
                checked={toolChoices().length === allTools().length}
                onChange={(e) =>
                  e.currentTarget.checked
                    ? setToolChoices(allTools().map((x) => x.name))
                    : setToolChoices([])
                }
              />{" "}
              All
            </label>
            <For each={allTools()}>
              {(tool) => (
                <>
                  <label for={tool.name}>
                    <Input
                      type="checkbox"
                      checked={toolChoices().includes(tool.name)}
                      onChange={(e) =>
                        e.currentTarget.checked
                          ? setToolChoices((old) => [...old, tool.name])
                          : setToolChoices((old) =>
                            old.filter((x) => x !== tool.name)
                          )
                      }
                    />
                    {tool.name}
                  </label>
                </>
              )}
            </For>
          </div>
        </div>
        <div>
          <h3>Subclass Levels</h3>
          <Select
            disableUnselected={true}
            value={selectedSubclassLevel()}
            onChange={(e) => {
              setSelectedSubclassLevel(+e.currentTarget.value);
            }}
          >
            <Option value={0}>None</Option>
            <For each={allLevelsArr()}>
              {(level) => <Option value={level}>Level {level}</Option>}
            </For>
          </Select>
          <Button
            onClick={(e) => {
              setSubclassLevels((old) =>
                !old.includes(selectedSubclassLevel())
                  ? [...old, selectedSubclassLevel()]
                  : old
              );
            }}
          >
            Add Subclass Level
          </Button>
          <div class={`${styles.subclassLevels}`}>
            <For each={subclassLevels()}>
              {(level) => (
                <Chip
                  key="Level"
                  value={level.toString()}
                  remove={() => {
                    setSubclassLevels((old) => old.filter((x) => x !== level));
                  }}
                />
              )}
            </For>
          </div>
        </div>
        <div>
        <h4>Spellcasting</h4>
        <label for="HasSpellCasting">
          Has SpellCasting?
        </label>
        <Input
          type="checkbox"
          class={`${styles.checkbox}`}
          checked={hasSpellCasting()}
          onChange={(e) => setHasSpellCasting(e.currentTarget.checked)}
        />
        <Show when={hasSpellCasting()}>
          <div class={styles.hasCastingMain}>
            <div>
              <label for="spellList">Spell List</label>
              <Select
                onChange={(e) => setSpellListUsed(e.currentTarget.value)}
                name="spellList"
                disableUnselected={true}
              >
                <For
                  each={allClasses().filter((x) =>
                    x.classLevels
                      .flatMap((y) =>
                        !!y.spellcasting
                          ? Object.keys(y.spellcasting).length > 0
                          : false
                      )
                      .includes(true)
                  )}
                >
                  {(theClass) => (
                    <Option value={theClass.name.trim()}>{theClass.name.trim()}</Option>
                  )}
                </For>
                <Option value={name().trim() !== "" ? name() : "CurrentClass"}>{name().trim() !== "" ? name() : "CurrentClass"}</Option>
              </Select>
            </div>
            <div>
              <label for="spellAbility">Spellcasting Ability </label>
              <Select
                onChange={(e) =>
                  setSpellCastingAbility(e.currentTarget.value)
                }
                name="spellAbility"
                disableUnselected={true}
              >
                <For each={["Intelligence", "Wisdom", "Charisma"]}>
                  {(stat) => <Option value={stat}>{stat}</Option>}
                </For>
              </Select>
            </div>
            <div>
              <label for="levelGained">Gained at Level: </label>
              <Input
                onChange={(e) => setSpellCastingLevel(+e.currentTarget.value)}
                min={1}
                max={20}
                type="number"
                name="levelGained"
              />
            </div>
            <div>
              <label for="useCastingCalc">Use Casting Calculation</label>
              <Input
                type="checkbox"
                class={`${styles.checkbox}`}
                checked={useCastingCalc()}
                onChange={(e) => setUseCastingCalc(e.currentTarget.checked)}
              />
            </div>
          </div>
          <Show when={useCastingCalc()}>
            <div>
              <label for="spellsKnownCalc">Spells Known Calculation</label>
              <Select
                onChange={(e) => setSpellsKnownCalc(+e.currentTarget.value)}
                name="spellsKnownCalc"
                disableUnselected={true}
              >
                <Option value={SpellsKnown.None}>None</Option>
                <Option value={SpellsKnown.Level}>Level</Option>
                <Option value={SpellsKnown.HalfLevel}>Half Level</Option>
                <Option value={SpellsKnown.StatModPlusLevel}>Stat Modifier + Level</Option>
                <Option value={SpellsKnown.StatModPlusHalfLevel}>Stat Modifier + Half Level</Option>
                <Option value={SpellsKnown.StatModPlusThirdLevel}>Stat Modifier + Third Level</Option>
              </Select>
              <label for="spellsKnownRoundup">Round Up Spells Known?</label>
              <Input
                type="checkbox"
                class={`${styles.checkbox}`}
                checked={spellsKnownRoundup()}
                onChange={(e) => setSpellsKnownRoundup(e.currentTarget.checked)}
              />
            </div>
          </Show>
          <div>
            <Button onClick={(e) => { setSpellCastingInfo(old => [...old, { name: "", desc: [""] }]) }}>Add Spellcasting Info Section</Button>
            <For each={spellcastingInfo()} >{(obj, i) => <>
              <p><Input onChange={(e) => setSpellCastingInfo((old) => {
                old[i()].name = e.currentTarget.value;
                return [...old];
              })} placeholder="Enter Section Title..." /></p>
              <p><textarea class={styles.textArea} onChange={(e) => setSpellCastingInfo((old) => {
                old[i()].desc = [e.currentTarget.value];
                return [...old];
              })} placeholder="Enter Section Description..." /></p>
              <Button onClick={(e) => {
                setSpellCastingInfo(old => {
                  old.splice(i(), 1);
                  return [...old];
                })
              }}>Remove</Button>
            </>}</For>
          </div>
        </Show>
        <h3>Level up Features</h3>
        <Carousel
          elements={allLevelsArr().map((x) => ({
            name: `Level ${x}`,
            element: (
              <LevelBuilder
              setClassLevels={setClassLevels}
              useCastingCalc={useCastingCalc}
                classLevels={classLevels}
                hasSpellCasting={hasSpellCasting}
                allClasses={allClasses}
                features={features}
                setFeatures={setFeatures}
                name={name}
                level={x}
                casterType={casterType}
                setCasterType={setCasterType}
              />
            ),
          }))}
        />
        </div>
        <div>
          <Button
            onClick={() => {
              if (!HomebrewManager.classes().map((x) => x.name).includes(name())) {
                HomebrewManager.addClass(currentClass());
                setCasterType("");
                setSpellCastingAbility("");
                setSpellCastingLevel(1);
                setSpellListUsed("");
                setHasSpellCasting(false);
                setSpellCastingInfo([]);
                setName("");
                setHitDie(0);
                setStatProficiencies([]);
                setProficiencies([]);
                setSkillProfAmount(1);
                setSkillProficiencies([]);
                setProficiencyChoices([]);
                setToolChoices([]);
                setToolChoiceAmount(1);
                setSubclassLevels([]);
                setSelectedSubclassLevel(0);  
                setStartingEquipment({
                  class: "",
                  quantity: 0,
                  choice1: [],
                  choice2: [],
                  choice3: [],
                  choice4: [],
                });
                setClassLevels(new Array(20).fill({
                  info: {
                    className: "",
                    subclassName: "",
                    level: 0,
                    type: "",
                    other: ""
                  },
                  level: 0,
                  profBonus: 0,
                  features: [],
                  classSpecific: {}
                }).map((x,i)=>{
                  return {
                    ...x,
                    info: {
                      ...x.info,
                      level: (i + 1)
                    },
                    level: (i + 1),
                    profBonus: Math.ceil((i + 1) / 4) + 1,
                  }
                }));
                setFeatures(new Array(20).fill({
                  info: {
                    className: name(),
                    subclassName: "",
                    level: 0,
                    type: "",
                    other: ""
                    },
                    name: "",
                    value: ""
                    }).map((x,i)=>{
                      return {
                        ...x,
                        info: {
                          ...x.info,
                          level: (i + 1)
                        },
                      }
                    }));
                setSubclasses([]);
              }
            }}
          >
            Save Class
          </Button>
        </div>
      </div>
    </>
  );
};
export default Classes;
