import {
  Component,
  For,
  createSignal,
  useContext,
  createMemo,
  createEffect,
  Show,
  onMount,
} from "solid-js";
import {
  useStyle,
  getUserSettings,
  Body,
  homebrewManager,
  FormField,
  Input,
  Select,
  Option,
  Button,
  Chip,
  Clone,
  UniqueSet,
  UniqueStringArray,
  useGetItems,
} from "../../../../../shared/";
import styles from "./races.module.scss";
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { SharedHookContext } from "../../../../rootApp";
import { Race } from "../../../../../models";
import { createStore } from "solid-js/store";
import {
  FeatureTypes,
  AbilityScores,
  Feature,
} from "../../../../../models/core.model";
import FeatureModal from "../classes/sections/featureModal";
import { LevelEntity } from "../../../../../models/class.model";
import {
  f,
  n,
  S,
} from "@vite-pwa/assets-generator/shared/assets-generator.5e51fd40";
import useGetRaces from "../../../../../shared/customHooks/data/useGetRaces";
import { useSearchParams } from "@solidjs/router";
import addSnackbar from "../../../../../shared/components/Snackbar/snackbar";
import { Observable } from "rxjs";
import { ItemType } from "../../../../../shared/customHooks/utility/itemType";

const Races: Component = () => {
  const sharedHooks = useContext(SharedHookContext);
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(() => useStyle(userSettings().theme));
  const allRaces = useGetRaces();
  const allItems = useGetItems();
  const hombrewRaces = createMemo(() => homebrewManager.races());
  const [searchParam, setSearchParam] = useSearchParams();
  // -------------------- Signals/State
  const [selectedAbility, setSelectedAbility] = createSignal<AbilityScores>(0);
  const [newSizes, setNewSizes] = createSignal<string>("Tiny");
  const [newLanguage,setNewLanguage] = createSignal<string>("common");
  const [abilityIncrease,setAbilityIncrease] = createSignal<number>(0);
  // ------- Store
  const [currentRace, setCurrentRace] = createStore<Race>({
    name: "",
    speed: 30, 
    age: "", 
    alignment: "", 
    size: "", 
    sizeDescription: "", 
    languages: [], 
    languageChoice: { 
      choose: 0, 
      choices: [], 
      type: FeatureTypes.Language 
    },
    languageDesc: "", 
    traits: [], 
    traitChoice: { 
      choose: 0, 
      choices: [], 
      type: FeatureTypes.Race 
    }, 
    startingProficencies: [], 
    startingProficiencyChoices: {
      choose: 0,
      choices: [],
      type: FeatureTypes.Race,
    },
    abilityBonuses: [],
    abilityBonusChoice: {
      choose: 0,
      choices: [],
      type: FeatureTypes.AbilityScore,
    },
    subRaces: [],
  });
  // -------------------- Functions
  const getAge = (type: "low" | "high") => {
    const ages = currentRace.age.split(" - ");
    if (type === "low") {
      return ages[0] ?? "0";
    } else {
      return ages[1] ?? "0";
    }
  };
  const setAge = (low: string, high: string) => {
    setCurrentRace("age", `${low} - ${high}`);
  };
  // --------- Feature Modal
  const [editIndex, setEditIndex] = createSignal<number>(-1);
  const [showFeatureModal, setShowFeatureModal] = createSignal<boolean>(false);
  const addFeature = (level: number, feature: Feature<string, string>) => {
    const newFeature: Feature<string[], string> = {
      name: feature.name,
      value: [feature.value],
      info: {
        className: feature.info.className,
        subclassName: feature.info.subclassName,
        level: feature.info.level,
        type: feature.info.type,
        other: feature.info.other,
      },
      metadata: feature.metadata,
    };
    const newTraits = Clone(currentRace.traits);
    newTraits.push(newFeature);
    setCurrentRace("traits", newTraits);
    setShowFeatureModal(false);
  };
  const replaceFeature = (
    level: number,
    index: number,
    feature: Feature<string, string>
  ) => {
    const newFeature: Feature<string[], string> = {
      name: feature.name,
      value: [feature.value],
      info: {
        className: feature.info.className,
        subclassName: feature.info.subclassName,
        level: feature.info.level,
        type: feature.info.type,
        other: feature.info.other,
      },
      metadata: feature.metadata,
    };
    const newTraits = Clone(currentRace.traits);
    newTraits[index] = newFeature;
    setCurrentRace("traits", newTraits);
    setShowFeatureModal(false);
  };

  // --------- Other Functions 

  const fillRacesInfo = (search?:boolean) => {
    const searchName = !!search ? searchParam.name: currentRace.name;
    const race = homebrewManager.races().find((x)=>x.name === searchName);
    const srdRace = allRaces().find((x)=>x.name === searchName);

    if (!!srdRace) {
      setCurrentRace("name",srdRace.name);
      setCurrentRace("size",srdRace.size);
      setCurrentRace("sizeDescription",srdRace.sizeDescription);
      setCurrentRace("speed",srdRace.speed);
      setCurrentRace("abilityBonuses",srdRace.abilityBonuses);
      setCurrentRace("abilityBonusChoice",srdRace.abilityBonusChoice);
      setCurrentRace("alignment",srdRace.alignment);
      setCurrentRace("languages",srdRace.languages);
      setCurrentRace("languageDesc",srdRace.languageDesc);
      setCurrentRace("languageChoice",srdRace.languageChoice); 
      setCurrentRace("age",srdRace.age);
      setCurrentRace("startingProficencies",srdRace.startingProficencies);
      setCurrentRace("startingProficiencyChoices",srdRace.startingProficiencyChoices);
      setCurrentRace("traitChoice",srdRace.traitChoice);
      setCurrentRace("traits",srdRace.traits);
      setCurrentRace("subRaces",srdRace.subRaces);
    }
    if (!!race) {
      setCurrentRace("name",race.name);
      setCurrentRace("size",race.size);
      setCurrentRace("sizeDescription",race.sizeDescription);
      setCurrentRace("speed",race.speed);
      setCurrentRace("abilityBonuses",race.abilityBonuses);
      setCurrentRace("abilityBonusChoice",race.abilityBonusChoice);
      setCurrentRace("alignment",race.alignment);
      setCurrentRace("languages",race.languages);
      setCurrentRace("languageDesc",race.languageDesc);
      setCurrentRace("languageChoice",race.languageChoice); 
      setCurrentRace("age",race.age);
      setCurrentRace("startingProficencies",race.startingProficencies);
      setCurrentRace("startingProficiencyChoices",race.startingProficiencyChoices);
      setCurrentRace("traitChoice",race.traitChoice);
      setCurrentRace("traits",race.traits);
      setCurrentRace("subRaces",race.subRaces);
    }
  }

  const addAbiliyScore = () => {
    let abilityScore:Feature<number, string> = {} as Feature<number,string>;

    // set ability score information
    abilityScore.name = AbilityScores[selectedAbility()];
    abilityScore.value = abilityIncrease();

    // add new ability score to race
    setCurrentRace("abilityBonuses",(old)=>([...old,abilityScore]))
  }

  const removeAbilityScore = (abilityScore: Feature<number,string>) => {
    const searchAbility = createMemo(()=>currentRace.abilityBonuses.find(x=>x.name === abilityScore.name))

    if(!!searchAbility()) {
      setCurrentRace("abilityBonuses",currentRace.abilityBonuses.filter(x=>x.name !== searchAbility()?.name))

      addSnackbar({
        message:"removed Ability",
        severity:"success",
        closeTimeout:4000
      })
    }
  }
  
  const allLanguages = ():string[] => {
    return UniqueStringArray(allRaces().flatMap(x=>x.languages))
  }

  const allWeapons = ():string[] => {
    const weapons:string[] = [];
    const foundWeapons = allItems().filter(item=>item.equipmentCategory === ItemType[1]).map(x=>x.name);

    if (foundWeapons.length > 0) {
      foundWeapons.forEach(weapon=>weapons.push(weapon));
      addSnackbar({
        message:`Found: ${foundWeapons.length}\nAdding: ${weapons.length}`,
        severity:"success",
        closeTimeout:4000
      })
      console.log("weapons: ",weapons);
    }

    if (weapons.length < 0 || foundWeapons.length < 0) {
      addSnackbar({
        message:`No Weapons: ${weapons.length}\n Found: ${foundWeapons.length}`
      })
    }

    return weapons
  }

  const allArmors = ():string[] => {
    const armors:string[] = []
    const foundArmors = allItems().filter(item=>item.equipmentCategory === ItemType[2]).map(x=>x.name);

    if (foundArmors.length > 0) {
      foundArmors.forEach(armor=>armors.push(armor));
      addSnackbar({
        message:`Found: ${foundArmors.length}\nAdding: ${armors.length}`,
        severity:"success",
        closeTimeout:4000,
      })
      console.log("armors: ",armors);
    }

    if (armors.length < 0 || foundArmors.length < 0 ) {
      addSnackbar({
        message:`No Armors: ${armors.length}\n Found: ${foundArmors.length}`
      })
    }

    return armors
  }

  const allTools = ():string[] => ([
    "Alchemist's Supplies",
    "Brewer's Supplies",
    "Calligrapher's Supplies",
    "Carpenter's Tools",
    "Cartographer's Tools",
    "Cobbler's Tools",
    "Cook's Utensils",
    "Glassblower's Tools",
    "Jeweler's Tools",
    "Leatherworker's Tools",
    "Mason's Tools",
    "Painter's Supplies",
    "Potter's Tools",
    "Smith's Tools",
    "Tinker's Tools",
    "Weaver's Tools",
    "Woodcarver's Tools",
    "Disguise Kit",
    "------------",
    "Forgery Kit",
    "Herbalism Kit",
    "Navigator's Tools",
    "Poisoner's Kit",
    "Thieves' Tools",
    "------------",
    "Dice Set",
    "Dragonchess Set",
    "Playing Card Set",
    "Three-Dragon Ante Set",
    "------------",
    "Bagpipes",
    "Drum",
    "Dulcimer",
    "Flute",
    "Lute",
    "Lyre",
    "Horn",
    "Pan Flute",
    "Shawm",
    "Viol",
    "------------",
    "other",
  ])

  const allSkills = ():string[] => ([
    "Athletics",
    "Acrobatics",
    "Sleight of Hand",
    "Stealth",
    "Arcana",
    "History",
    "Investigation",
    "Nature",
    "Religion",
    "Animal Handling",
    "Insight",
    "Medicine",
    "Perception",
    "Survival",
    "Deception",
    "Intimidation",
    "Performance",
    "Persuasion",
    "other"
  ])



  // when the component first loads ▼

  onMount(() => {
    if (!!searchParam.name) fillRacesInfo(true)
  })

  createEffect(() => {
    console.log(allRaces());
  });

  return (
    <>
      <Body>
        <h1>Races</h1>
        <div class={`${styles.wrapper}`}>
          {/* first colunm */}
          <div>

            <div>
              <FormField name="Name">
                <Input
                  type="text"
                  transparent
                  value={currentRace.name}
                  onInput={(e) => setCurrentRace("name", e.currentTarget.value)}
                />
              </FormField>
            
              {/* add fill btn here */}
            </div>

            <div>
              <h2>Size</h2>
              <div>
                <Select
                  transparent
                  value={newSizes()}
                  onChange={(e) => setNewSizes(e.currentTarget.value)}
                >
                  <For
                    each={[
                      "Tiny",
                      "Small",
                      "Medium",
                      "Large",
                      "Huge",
                      "Gargantuan",
                    ]}
                  >
                    {(size) => <Option value={size}>{size}</Option>}
                  </For>
                </Select>
                <Button
                  onClick={(e) => {
                    const selSize = currentRace.size.split(",");
                    const newArray = [...selSize, newSizes().trim()]
                      .map((s) => s.trim())
                      .filter((s) => !!s.length);
                    setCurrentRace("size", newArray.join(", "));
                  }}
                >
                  Add Size Option
                </Button>
              </div>
              
              <div style={{ display: "flex" }}>
                <Show when={!!currentRace.size}>
                  <For each={currentRace.size.split(", ")}>
                    {(size, i) => (
                      <Chip
                        value={size}
                        remove={() => {
                          const newSizes = currentRace.size.split(", ");
                          newSizes.splice(i(), 1);
                          setCurrentRace("size", newSizes.join(", "));
                        }}
                      />
                    )}
                  </For>
                </Show>
                <Show when={!currentRace.size}>
                  <Chip value="None" />
                </Show>
              </div>
              
              <div>
                <FormField name="Size Description">
                  <Input
                    type="text"
                    transparent
                    value={currentRace.sizeDescription}
                    onInput={(e) =>
                      setCurrentRace("sizeDescription", e.currentTarget.value)
                    }
                  />
                </FormField>
              </div>
            </div>
            
            <div>
              <h2>Speed</h2>
              <FormField name="Speed">
                <Input
                  type="number"
                  transparent
                  value={currentRace.speed}
                  onInput={(e) =>
                    setCurrentRace("speed", parseInt(e.currentTarget.value))
                  }
                />
              </FormField>
            </div>

            <div>
              <h2>Ability Scores</h2> 
              <div class={styles.abilityScoreInput}>
                <Select
                  transparent
                  value={selectedAbility()}
                  onChange={(e) =>
                    setSelectedAbility(parseInt(e.currentTarget.value))
                  }
                >
                  <For each={[0, 1, 2, 3, 4, 5, 6]}>
                    {(ability) => (
                      <Option value={ability}>{AbilityScores[ability]}</Option>
                    )}
                  </For>
                </Select>
                <Input type="number"
                  transparent
                  min={0}
                  max={999}
                  value={abilityIncrease()}
                  onInput={(e)=>setAbilityIncrease(parseInt(e.currentTarget.value))}
                />
                <Button onClick={addAbiliyScore}>Add Ability Score</Button>
              </div>

              <Show when={currentRace.abilityBonuses.length > 0}>
                <div class={`${styles.abilityScoreRow}`}>
                  <For each={currentRace.abilityBonuses}>
                    { (abilityScore) => 
                      <Chip remove={()=>removeAbilityScore(abilityScore)} key={abilityScore.name} value={`${abilityScore.value}`} /> 
                    }
                  </For>
                </div>
              </Show>
            </div>

            <div>
              <h2>Age</h2>

              <FormField name="age">
                  <Input  
                    type="text"
                    transparent
                    value={currentRace.age}
                    onInput={(e) => setCurrentRace("age", e.currentTarget.value)}
                  />
              </FormField>
            </div>

            <div>
              <h2>Features</h2>

              <div style={{ display: "flex" }}>

                <Button onClick={() => setShowFeatureModal(true)}>
                  Add Feature
                </Button>

                <span>

                  <For each={currentRace.traits}>
                    {(trait, i) => (
                      <Chip
                        value={trait.name}
                        onClick={() => {
                          setEditIndex(i);
                          setShowFeatureModal(true);
                        }}
                        remove={() => {
                          const newTraits = Clone(currentRace.traits);
                          newTraits.splice(i(), 1);
                          setCurrentRace("traits", newTraits);
                          setShowFeatureModal(false);
                        }}
                      />
                    )}
                  </For>

                  <Show when={currentRace.traits.length === 0}>
                    <Chip value="None" />
                  </Show>

                </span>

                <Show when={showFeatureModal()}>
                  <FeatureModal
                    addFeature={addFeature}
                    replaceFeature={replaceFeature}
                    currentLevel={{} as LevelEntity}
                    showFeature={showFeatureModal}
                    setShowFeature={setShowFeatureModal}
                    editIndex={editIndex}
                    setEditIndex={setEditIndex}
                    currentRace={currentRace}
                  />
                </Show>
              </div>

            </div>

          </div> 
          
          {/* second column */}
          <div>
            <div>
              <FormField name="alignment">
                  <Input 
                    type="text"
                    transparent
                    value={currentRace.alignment}
                    onInput={(e)=>setCurrentRace("alignment",e.currentTarget.value)}
                  />
              </FormField>
            </div>

            <div>
              <h2>languages</h2>
              <div>
                  <Select
                    transparent
                    value={newLanguage()}
                    onChange={(e)=>setNewLanguage(e.currentTarget.value)}
                  >
                    <For each={allLanguages()}>
                      { (language) => <Option value={language}>{language}</Option> }
                    </For>
                  </Select>

                  <Button
                    onClick={(e)=>{
                      setCurrentRace("languages",(old)=>([...old,newLanguage()]))
                    }}
                  >
                    Add Language
                  </Button>
              </div>
              <div>
                <Show when={currentRace.languages.length > 0}>
                    <For each={currentRace.languages}>
                      { (language, i) => <Chip value={language} remove={()=>setCurrentRace("languages",(old)=>([...old.filter((l)=>l !== language)]))} /> }
                    </For>
                </Show>
                <Show when={currentRace.languages.length === 0}>
                  <Chip key="" value="None" />
                </Show>
              </div>
              <div>
                <FormField name="Language Description">
                    <Input 
                      type="text"
                      transparent
                      value={currentRace.languageDesc}
                      onInput={(e)=>setCurrentRace("languageDesc",e.currentTarget.value)}
                    />
                </FormField>
              </div>
            </div>

            <div>
              <h2>Starting Proficencies</h2>
              
              <div class={styles.startingProficencies}>
                <div>
                  <Show when={currentRace.startingProficencies.length > 0}>
                    <For each={currentRace.startingProficencies}>
                        { (startingProf) => <Chip value={startingProf.value} /> }
                    </For>
                  </Show>
                </div>

                <Button onClick={(e)=>{}}>
                  Add Proficency
                </Button>
              </div>
            </div>

          </div>
        </div>
      </Body>
    </>
  );
};
export default Races;
