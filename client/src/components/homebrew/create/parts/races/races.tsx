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
  TextArea,
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
import StartingProf from "./startingProfs/startingProfs";

const Races: Component = () => {
  const sharedHooks = useContext(SharedHookContext);
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(() => useStyle(userSettings().theme));
  const allRaces = useGetRaces();
  const hombrewRaces = createMemo(() => homebrewManager.races());
  const [searchParam, setSearchParam] = useSearchParams();
  // -------------------- Signals/State
  const [selectedAbility, setSelectedAbility] = createSignal<AbilityScores>(0);
  const [newSizes, setNewSizes] = createSignal<string>("Tiny");
  const [newLanguage,setNewLanguage] = createSignal<string>("common");
  const [abilityIncrease,setAbilityIncrease] = createSignal<number>(0);
  const [startProfPopup,setStartProfPopup] = createSignal<boolean>(false);
  
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

  // --------- Functions 

  const fillRacesInfo = (search?:boolean) => {
    const searchName = !!search ? searchParam.name: currentRace.name;
    const race = homebrewManager.races().find((x)=>x.name === searchName);
    const srdRace = allRaces().find((x)=>x.name === searchName);

    if (!!srdRace) {
      setCurrentRace("name",srdRace.name);
      setCurrentRace("size",srdRace.size);
      setCurrentRace("sizeDescription",srdRace.sizeDescription);
      setSizeDesc(srdRace.sizeDescription);
      setCurrentRace("speed",srdRace.speed);
      setCurrentRace("abilityBonuses",srdRace.abilityBonuses);
      setCurrentRace("abilityBonusChoice",srdRace.abilityBonusChoice);
      setCurrentRace("alignment",srdRace.alignment);
      setAlignTextarea(srdRace.alignment);
      setCurrentRace("languages",srdRace.languages);
      setCurrentRace("languageDesc",srdRace.languageDesc);
      setLanguageDesc(srdRace.languageDesc);
      setCurrentRace("languageChoice",srdRace.languageChoice); 
      setCurrentRace("age",srdRace.age);
      setAgeDesc(srdRace.age);
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
      setSizeDesc(race.sizeDescription);
      setCurrentRace("speed",race.speed);
      setCurrentRace("abilityBonuses",race.abilityBonuses);
      setCurrentRace("abilityBonusChoice",race.abilityBonusChoice);
      setCurrentRace("alignment",race.alignment);
      setAlignTextarea(race.alignment);
      setCurrentRace("languages",race.languages);
      setCurrentRace("languageDesc",race.languageDesc);
      setLanguageDesc(race.languageDesc);
      setCurrentRace("languageChoice",race.languageChoice); 
      setCurrentRace("age",race.age);
      setAgeDesc(race.age)
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

  const doesExist = () => {
    return homebrewManager.races().findIndex((x)=> x.name === currentRace.name) > -1
  }

  const createRace = () => {
    homebrewManager.addRace(currentRace);
    clearFields()
  }

  const updateRace = () => {
    homebrewManager.updateRace(currentRace);
    clearFields()
  }

  const clearFields = () => {
    setCurrentRace({
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
    })
    setSelectedAbility(0);
    setNewSizes("");
    setNewLanguage("");
    setAbilityIncrease(0);
    setAlignTextarea("");
    setLanguageDesc("");
    setSizeDesc("");
    setAgeDesc("")

  }

  // other state for text areas

  const [alignTextarea,setAlignTextarea] = createSignal<string>("");
  const [languageDesc,setLanguageDesc] = createSignal<string>("");
  const [sizeDesc,setSizeDesc] = createSignal<string>("");
  const [ageDesc,setAgeDesc] = createSignal<string>("");

  // when the component first loads ▼

  onMount(() => {
    if (!!searchParam.name) fillRacesInfo(true)
  })

  // setting values for textareas

  createEffect(()=>{
    setCurrentRace("alignment",alignTextarea());
    setCurrentRace("sizeDescription",sizeDesc());
    setCurrentRace("languageDesc",languageDesc());
    setCurrentRace("age",ageDesc())
  })

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
            </div>

            <div>
              <Show when={doesExist()}>
                <Button onClick={()=>fillRacesInfo()}>Fill Info</Button>
                <Button onClick={()=>{
                  const areSure = confirm("are you sure");

                  if (areSure) {
                    homebrewManager.removeRace(currentRace.name)
                  }

                }}>Delete</Button>
              </Show>
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
                  <TextArea transparent text={sizeDesc} setText={setSizeDesc} />
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

              <FormField name="age desc">
                  <TextArea 
                  transparent 
                  text={ageDesc}
                  setText={setAgeDesc}
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
              <FormField name="alignment desc">
                  <TextArea 
                  text={alignTextarea} 
                  setText={setAlignTextarea}
                  transparent
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
                    <TextArea 
                    transparent
                    text={languageDesc}
                    setText={setLanguageDesc}
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
                        { (startingProf) => <Chip key={startingProf.name} value={startingProf.value} /> }
                    </For>
                  </Show>
                  <Show when={currentRace.startingProficencies.length === 0}>
                    <Chip value="None"></Chip>
                  </Show>
                </div>

                <Button onClick={(e)=>setStartProfPopup(!startProfPopup())}>
                  Add Proficency
                </Button>
              </div>
          
              <Show when={startProfPopup()}>
                <StartingProf setClose={setStartProfPopup} setRaceStore={setCurrentRace} currentRace={currentRace} />
              </Show>
            </div>

          </div>
        </div>

        <Show when={!doesExist()}>
          <Button onClick={createRace}>Create</Button>
        </Show>
        <Show when={doesExist()}>
          <Button onClick={updateRace}>Update</Button>
        </Show>
      </Body>
    </>
  );
};
export default Races;
