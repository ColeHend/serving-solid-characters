import {
  Accessor,
  Component,
  For,
  Show,
  createMemo,
  createSignal,
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

const getClass = (
  name: string,
  hitDie: number,
  proficiencies: string[],
  proficiencyChoices: Choice<string>[],
  savingThrows: string[],
  startingEquipment: StartingEquipment,
  classLevels: LevelEntity[],
  features: Feature<unknown, string>[],
  subclasses: Subclass[],
  level: number = 0,
  spellcastingAbility: string = "",
  spellcastingInfo: { name: string; desc: string[] }[] = []
) => {
  return {
    name,
    hitDie,
    proficiencies,
    proficiencyChoices,
    savingThrows,
    startingEquipment,
    classLevels,
    features,
    subclasses,
    spellcasting: {
      level,
      name,
      spellcastingAbility,
      info: spellcastingInfo
    }
  } as DnDClass;
}

const Classes: Component = () => {
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

  // --- other stuff ---
  const stylin = useStyle();
  const allLevelsArr = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  ];
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
  const [classLevels, setClassLevels] = createSignal<LevelEntity[]>([]);
  const [features, setFeatures] = createSignal<Feature<unknown, string>[]>([]);
  const [subclasses, setSubclasses] = createSignal<Subclass[]>([]);

  const selectableChoices = createMemo(() => {
    switch (currentItemChoiceGroup()) {
      case 1:
        return startingEquipment().choice1;
      case 2:
        return startingEquipment().choice2;
      case 3:
        return startingEquipment().choice3;
      case 4:
        return startingEquipment().choice4;
      default:
        return startingEquipment().choice1;
    }
  });

  const currentClass: Accessor<DnDClass> = createMemo(() =>
    getClass(
      name(),
      hitDie(),
      proficiencies(),
      proficiencyChoices(),
      savingThrows(),
      startingEquipment(),
      classLevels(),
      features(),
      subclasses(),
      spellcastingLevel(),
      spellcastingAbility(),
      spellcastingInfo()
    )
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

// ----------------- JSX -----------------
  return (
    <>
      <HomebrewSidebar />
      <div class={`${stylin.accent} ${styles.body}`}>
        <h1>classes</h1>
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
                      value={`${proficiencies().includes(armor)}`}
                      onChange={(e) =>
                        e.currentTarget.checked
                          ? setProficiencies((old) =>
                            old.filter((x) => x !== armor)
                          )
                          : setProficiencies((old) => [...old, armor])
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
                      value={`${proficiencies().includes(weapon)}`}
                      onChange={(e) =>
                        e.currentTarget.checked
                          ? setProficiencies((old) =>
                            old.filter((x) => x !== weapon)
                          )
                          : setProficiencies((old) => [...old, weapon])
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
                        onChange={(e) =>
                          e.currentTarget.checked
                            ? setSkillProficiencies((old) => [...old, skill])
                            : setSkillProficiencies((old) =>
                              old.filter((x) => x !== skill)
                            )
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
            onChange={(e) => {
              setSelectedSubclassLevel(+e.currentTarget.value);
            }}
          >
            <Option value={0}>None</Option>
            <For each={allLevelsArr}>
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
        <h4>Spellcasting</h4>
        <label for="HasSpellCasting">
          Has SpellCasting?
        </label>
        <Input
          type="checkbox"
          style={{ width: "min-content" }}
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
          </div>
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
          elements={allLevelsArr.map((x) => ({
            name: `Level ${x}`,
            element: (
              <LevelBuilder
                hasSpellCasting={hasSpellCasting}
                allClasses={allClasses}
                features={features}
                setFeatures={setFeatures}
                name={name}
                level={x}
              />
            ),
          }))}
        />
        <h3>New Related like battle master manuvers</h3>
      </div>
    </>
  );
};
export default Classes;
