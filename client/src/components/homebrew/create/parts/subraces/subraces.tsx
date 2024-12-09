import { Component, createEffect, createMemo, createSignal, For, Show } from "solid-js";
import Style from "./subraces.module.scss";
import { Body, homebrewManager, Select,Option, Chip, FormField, Input, Button, UniqueStringArray, Clone } from "../../../../../shared";
import { createStore } from "solid-js/store";
import { Race, Subrace } from "../../../../../models/race.model";
import { AbilityScores, Feature, FeatureTypes } from "../../../../../models/core.model";
import useGetRaces from "../../../../../shared/customHooks/data/useGetRaces";
import { useSearchParams } from "@solidjs/router";
import addSnackbar from "../../../../../shared/components/Snackbar/snackbar";
import FeatureModal from "../classes/sections/featureModal";
import { LevelEntity } from "../../../../../models/class.model";
import StartingProf from "../races/startingProfs/startingProfs";

const Subraces:Component = () => {

    const allRaces = useGetRaces();

    const allRaceNames = () => homebrewManager.races().map(x=>x.name)

    const [showProfPopup,setShowProfPopup] = createSignal<boolean>(false);

    const [newProficeny,setNewProficeny] = createStore<Feature<string,string>>({
        info: {
            className: "",
            subclassName: "",
            level: 0,
            type: FeatureTypes.Subclass,
            other: ""
        },
        metadata: {},
        choices: [],
        name: "",
        value: "",
    })

    const [currentSubrace,setCurrentSubrace] = createStore<Subrace>({
        name: "",
        desc: "",
        traits: [],
        traitChoice: {
            choose: 0,
            choices: [

            ],
            type: FeatureTypes.Subrace
        },
        abilityBonuses: [],
        abilityBonusChoice: {
            choose: 0,
            choices: [],
            type: FeatureTypes.AbilityScore,
        },
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
        startingProficencies: [],
        startingProficiencyChoices: {
            choose: 0,
            choices: [],
            type: FeatureTypes.Subrace
        }
    });

    const [currentRace,setCurrentRace] = createStore<Race>({
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

    const [searchParams,setSearchParams] = useSearchParams();

    const [selectedAbility,setSelectedAbility] = createSignal<AbilityScores>(0);

    const [abilityIncrease,setAbilityIncrease] = createSignal<number>(0);

    const [newLanguage, setNewLanguage] = createSignal<string>("");

    const [showStartProf,setShowStartProf] = createSignal<boolean>(false);

    const [showTraitPopup,setShowTraitPopup] = createSignal<boolean>(false);
    
    const [editIndex, setEditIndex] = createSignal<number>(-1);

    


    // functions

    const allLanguages = ():string[] => {
        return UniqueStringArray(allRaces().flatMap(x=>x.languages))
    }

    const addAbilityScore = ():void => {
        let AbilityScore:Feature<number, string> = {} as Feature<number, string>;

        // ---------------set the info---------------
        AbilityScore.name = AbilityScores[selectedAbility()];
        AbilityScore.value = abilityIncrease();


        // add the ability
        setCurrentSubrace("abilityBonuses",old=>([...old,AbilityScore]))
    }

    const addFeature = (level: number, feature: Feature<string, string>) => {
        const newFeature: Feature<string[], string> = {
            name: feature.name,
            value: [feature.value],
            info: feature.info,
            choices:feature.choices?.map((c)=> ({
                ...c,
                choices: [c.choices.map(ch=> ch)]
            })) ,
            metadata: {
                ...feature.metadata,
                changes: feature.metadata.changes
            }
        }
        const newFeatures = Clone(currentSubrace.traits)
        newFeatures.push(newFeature)
        setCurrentSubrace("traits",newFeatures)
        setShowTraitPopup(!showTraitPopup());
    }

    const replaceFeature = ( level: number, index: number, feature: Feature<string, string>) => {
        const newFeature: Feature<string[], string> = {
            name: feature.name,
            value: [feature.value],
            info: feature.info,
            choices:feature.choices?.map((c)=> ({
                ...c,
                choices: [c.choices.map(ch=> ch)]
            })) ,
            metadata: {
                ...feature.metadata,
                changes: feature.metadata.changes
            }
        }
        const newFeatures = Clone(currentSubrace.traits)
        newFeatures[index] = newFeature;
        setCurrentSubrace("traits",newFeatures)
        setShowTraitPopup(!showTraitPopup());
    }

    const addProfiencey = ():void => {

        setCurrentSubrace("startingProficencies",old=>([...old ?? [],Clone(newProficeny)]))

        setNewProficeny({
            info: {
                className: "",
                subclassName: "",
                level: 0,
                type: FeatureTypes.Subclass,
                other: ""
            },
            metadata: {},
            choices: [],
            name: "",
            value: "",
        })
    }

    const doesExist = () => {
        return currentRace.subRaces.findIndex(x=> x.name === currentSubrace.name) > -1
    }

    const saveSubrace = () => {
        // set the subraces
        setCurrentRace("subRaces",old=>([...old,Clone(currentSubrace)]))
        
        setTimeout(()=>{
            // update the race
            homebrewManager.updateRace(Clone(currentRace));
        },100)

        setCurrentSubrace({
            name: "",
            desc: "",
            traits: [],
            traitChoice: {
                choose: 0,
                choices: [
    
                ],
                type: FeatureTypes.Subrace
            },
            abilityBonuses: [],
            abilityBonusChoice: {
                choose: 0,
                choices: [],
                type: FeatureTypes.AbilityScore,
            },
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
            startingProficencies: [],
            startingProficiencyChoices: {
                choose: 0,
                choices: [],
                type: FeatureTypes.Subrace
            }
        })
    }

    const updateSubrace = () => {
        // find the subraces index
        const index = currentRace.subRaces.findIndex(x=>x.name === currentSubrace.name)

        // update the subrace 
        currentRace.subRaces[index] = Clone(currentSubrace);

        setTimeout(()=>{
            // update the race
            homebrewManager.updateRace(currentRace)
        },100)

        setCurrentSubrace({
            name: "",
            desc: "",
            traits: [],
            traitChoice: {
                choose: 0,
                choices: [
    
                ],
                type: FeatureTypes.Subrace
            },
            abilityBonuses: [],
            abilityBonusChoice: {
                choose: 0,
                choices: [],
                type: FeatureTypes.AbilityScore,
            },
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
            startingProficencies: [],
            startingProficiencyChoices: {
                choose: 0,
                choices: [],
                type: FeatureTypes.Subrace
            }
        })
    }

    // ▼ when things change ▼ \\

    createEffect(()=>{
        setSearchParams({race: currentRace.name ?? "",subrace: currentSubrace.name ?? ""})
    })
    
    return <Body>
        <h1>Subraces</h1>

        <h2>Select Race</h2>
        <Select 
            transparent
            onChange={(e)=>{
                const race = allRaces().find(x=>x.name === e.currentTarget.value)
                
                if (e.currentTarget.value !== "") {
                    if (!!race) setCurrentRace(race)
                } else {                    
                    setCurrentRace({
                        name: "",
                        speed: 0, 
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
                }
                console.log("set: ", currentRace);
                
            }}
            
        >
            <For each={allRaceNames()}>
                { (raceName,i) => <Option value={raceName}>{raceName}</Option> }
            </For>
        </Select>
        
        <Show when={currentRace.name !== ""} fallback={<div>NO RACE SELECTED!</div>}>
            <h2>Subrace</h2>
            <div>
                <h3>Name</h3>
                <div>
                    <FormField name="Subrace Name">
                        <Input 
                        type="text"
                        transparent
                        value={currentSubrace.name}
                        onInput={(e)=>setCurrentSubrace("name",e.currentTarget.value)}
                        />
                    </FormField>
                </div>


                <h3>Desc</h3>
                <div>
                    <FormField name="Subrace Desc">
                        <Input 
                        type="text"
                        transparent
                        value={currentSubrace.desc}
                        onInput={(e)=>setCurrentSubrace("desc",e.currentTarget.value)}
                        />
                    </FormField>
                </div>


                <h3>age</h3>
                <div>
                    <FormField name="Subrace Age">
                        <Input 
                        type="text"
                        transparent
                        value={currentSubrace.age}
                        onInput={(e)=>setCurrentSubrace("age",e.currentTarget.value)}
                        />
                    </FormField>
                </div>


                <h3>alignment</h3>
                <div>
                    <FormField name="Subrace Alignment">
                        <Input 
                        type="text"
                        transparent
                        value={currentSubrace.alignment}
                        onInput={(e)=>setCurrentSubrace("alignment",e.currentTarget.value)}
                        />
                    </FormField>
                </div>


                <h3>size</h3>
                <div>
                    <FormField name="Subrace Size">
                        <Input 
                        type="text"
                        transparent
                        value={currentSubrace.size}
                        onInput={(e)=>setCurrentSubrace("size",e.currentTarget.value)}
                        />
                    </FormField>
                </div>


                <h3>size desc</h3>
                <div>
                    <FormField name="Subrace SizeDesc">
                        <Input 
                        type="text"
                        transparent
                        value={currentSubrace.sizeDescription}
                        onInput={(e)=>setCurrentSubrace("sizeDescription",e.currentTarget.value)}
                        />
                    </FormField>
                </div>


                <h3>Ability Score</h3>
                <div class={`${Style.AbilityScoreWrapper}`}>
                    <FormField name="Ability Score" class={`${Style.AbilityScore}`}>
                        <Select
                            transparent
                            value={selectedAbility()}
                            onChange={(e)=> 
                                setSelectedAbility(parseInt(e.currentTarget.value))
                            }
                            disableUnselected
                        >
                            <For each={[0, 1, 2, 3, 4, 5, 6]}>
                                { (ability) => <Option value={ability}>{AbilityScores[ability]}</Option> }
                            </For>
                        </Select>
                        <Input type="number" 
                        transparent
                        min={0}
                        value={abilityIncrease()}
                        onInput={(e)=> setAbilityIncrease(parseInt(e.currentTarget.value))}
                        />
                    </FormField>
                    <Button onClick={addAbilityScore}>Add Ability</Button>
                </div>

                <div>
                    <Show when={currentSubrace.abilityBonuses.length > 0}>
                        <For each={currentSubrace.abilityBonuses}>
                            { (ablity) => <Chip key={ablity.name} value={`${ablity.value}`} remove={()=>currentSubrace.abilityBonuses.filter(ab=>ab.name !== ablity.name)} /> }
                        </For>
                    </Show>
                </div>


                <h3>languages</h3>
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

                    <Button disabled={newLanguage() === ""} onClick={e=>{
                        setCurrentSubrace("languages",old=>([...old,newLanguage()]))
                        setNewLanguage("")
                    }}>Add Language</Button>
                </div>

                <div>
                    <Show when={currentSubrace.languages.length > 0}>
                        <For each={currentSubrace.languages}>
                            { (language) => <Chip value={language} remove={()=> currentSubrace.languages.filter(l=>l !== language)}/> }
                        </For>
                    </Show>
                </div>


                <h3>startingProficencies</h3>
                <div style={{display:"flex","flex-direction":"row","align-items":"flex-start"}}>
                    
                    <div style={{display:"flex","flex-direction":"column"}}>
                        <Show when={currentSubrace.startingProficencies?.length} fallback={<Chip value="None" />}>
                            <For each={currentSubrace.startingProficencies}>
                                { (prof,i) => <Chip value={prof.value} /> }
                            </For>
                        </Show>
                    </div>

                    <Button onClick={(e)=>setShowStartProf(!showStartProf())}>Add Proficencey</Button>

                </div>


                <h3>Traits</h3>
                <div style={{display:"flex","flex-direction":"row","align-items":"flex-start"}}>

                        <div>
                            <Show when={currentSubrace.traits.length > 0} fallback={<Chip value="None" />}>
                                <For each={currentSubrace.traits}>
                                    { (trait,i) => <Chip value={trait.name} remove={()=>setCurrentSubrace("traits",old=>([...old.filter(t=>t.name !== trait.name)]))} /> }
                                </For>
                            </Show>
                        </div>

                        <Button onClick={(e)=>setShowTraitPopup(!showTraitPopup())}>Add Trait</Button>
                </div>
            </div>
        </Show>

        <Show when={showStartProf()}>
            <StartingProf 
            setClose={setShowStartProf}
            addProfiencey={addProfiencey}
            setNewProficeny={setNewProficeny}
            newProficeny={newProficeny}
            />
        </Show>

        <Show when={showTraitPopup()}>
            <FeatureModal 
            addFeature={addFeature}
            replaceFeature={replaceFeature}
            currentLevel={{} as LevelEntity}
            showFeature={showTraitPopup}
            setShowFeature={setShowTraitPopup}
            editIndex={editIndex}
            setEditIndex={setEditIndex}
            currentSubrace={currentSubrace}
            />
        </Show>

        <Show when={!!doesExist()}>
            <Button onClick={updateSubrace}>Update</Button>
        </Show>
        
        <Show when={!doesExist()}>
            <Button onClick={saveSubrace}>Save</Button>
        </Show>
        
    </Body>
}
export default Subraces;