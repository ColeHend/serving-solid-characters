import { Component, createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js";
import Style from "./subraces.module.scss";
import { Body, homebrewManager, Select,Option, Chip, FormField, Input, Button, UniqueStringArray, Clone, TextArea } from "../../../../../shared";
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

    const srdRaces = useGetRaces();

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

    const [desc,setDesc] = createSignal<string>("");
    const [age,setAge] = createSignal<string>("");
    const [alignment,setAlignment] = createSignal<string>("");
    const [sizeDesc,setSizeDesc] = createSignal<string>("");
    const [newSizes,setNewSizes] = createSignal<string>("Tiny");
    
    if (!!!searchParams.race && !!!searchParams.subrace) setSearchParams({race:currentRace.name,subrace: currentSubrace.name})

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

    const fillInfo = (search?:boolean) => {
        const searchRace = search? searchParams.race : currentRace.name;
        const searchSubrace = search? searchParams.subrace : currentSubrace.name;

        const race = allRaces().find((x)=>x.name === searchRace);
        
        if (!!race) { // get subrace and set the current race !important
            const subrace = race.subRaces.find(x=>x.name === searchSubrace);
            
            setCurrentRace(race);

            if (!!subrace) { // fill subrace info
                setCurrentSubrace(subrace);
                setDesc(subrace.desc);
                setAge(subrace.age);
                setAlignment(subrace.alignment);
                setSizeDesc(subrace.sizeDescription);
            }
        }
        
    }

    // ▼ when things change ▼ \\

    createEffect(()=>{
        setSearchParams({race: currentRace.name ?? "",subrace: currentSubrace.name ?? ""})
    })

    createEffect(()=>{
        setCurrentSubrace("desc",desc());
        setCurrentSubrace("age",age());
        setCurrentSubrace("alignment",alignment());
        setCurrentSubrace("sizeDescription",sizeDesc());

    })
    
    onMount(()=>{
        if(!!searchParams.race && !!searchParams.subrace) fillInfo(true)
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
                
                    <Show when={doesExist()}>
                        <Button onClick={()=>fillInfo()}>Fill Info</Button>
                        <Button onClick={()=>{
                            let areSure = confirm("Are you sure? this action will cause you to lose progress.");

                            if (areSure) {
                                currentRace.subRaces.filter(x=>x.name !== currentSubrace.name)
                                
                                homebrewManager.updateRace(Clone(currentRace));

                                addSnackbar({
                                    severity:"success",
                                    message:"Deleted Subrace",
                                    closeTimeout: 4000
                                })
                            }
                        }}>Delete</Button>
                    </Show>
                </div>



                <h3>Desc</h3>
                <div>
                    <FormField name="Subrace Desc">
                        <TextArea 
                            text={desc}
                            setText={setDesc}
                            transparent
                        />
                    </FormField>
                </div>


                <h3>Age Desc</h3>
                <div>
                    <FormField name="Subrace Age Desc">
                        <TextArea 
                            text={age}
                            setText={setAge}
                            transparent
                        />
                    </FormField>
                </div>


                <h3>Alignment Desc</h3>
                <div>
                    <FormField name="Subrace Alignment Desc">
                        <TextArea 
                            text={alignment}
                            setText={setAlignment}
                            transparent
                        />
                    </FormField>
                </div>


                <h3>size</h3>
                <div>
                    <Select
                        transparent
                        value={newSizes()}
                        onChange={((e)=>setNewSizes(e.currentTarget.value))}
                        disableUnselected
                    >
                        <For each={[
                      "Tiny",
                      "Small",
                      "Medium",
                      "Large",
                      "Huge",
                      "Gargantuan",
                    ]}>
                        { (sizeOption)=><Option value={sizeOption} >{sizeOption}</Option> }
                    </For>
                    </Select>

                    <Button onClick={(e)=>{
                        const selSize = currentSubrace.size.split(",");
                        const newArray = [...selSize,newSizes().trim()]
                            .map((s)=> s.trim())
                            .filter((s)=> !!s.length);
                        setCurrentSubrace("size",newArray.join(","))
                    }}>Add Size Option</Button>

                </div>

                <div>
                    <Show when={!!currentSubrace.size}>
                        <For each={currentSubrace.size.split(", ")}>
                            { (size,i) => <Chip value={size} remove={()=>{
                                const newSizes = currentSubrace.size.split(", ");
                                newSizes.splice(i(), 1);
                                setCurrentSubrace("size",newSizes.join(", "))
                            }} /> }
                        </For>
                    </Show>
                    <Show when={!currentSubrace.size}>
                        <Chip value="None"/>
                    </Show>
                </div>


                <h3>size desc</h3>
                <div>
                    <FormField name="Subrace SizeDesc">
                        <TextArea 
                            text={sizeDesc}
                            setText={setSizeDesc}
                            transparent
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
            <Button disabled={currentRace.name === ""} onClick={saveSubrace}>Save</Button>
        </Show>
        
    </Body>
}
export default Subraces;