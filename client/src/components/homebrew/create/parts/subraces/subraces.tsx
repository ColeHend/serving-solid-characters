import { Component, createMemo, For, Show } from "solid-js";
import Style from "./subraces.module.scss";
import { Body, homebrewManager, Select,Option, Chip } from "../../../../../shared";
import { createStore } from "solid-js/store";
import { Race, Subrace } from "../../../../../models/race.model";
import { FeatureTypes } from "../../../../../models/core.model";
import useGetRaces from "../../../../../shared/customHooks/data/useGetRaces";

const Subraces:Component = () => {

    const allRaces = useGetRaces();

    const allRaceNames = () => homebrewManager.races().map(x=>x.name)

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

    return <Body>
        <h1>Subraces</h1>

        <h2>Select Race</h2>
        <Select 
            transparent
            onChange={(e)=>{
                const race = allRaces().find(x=>x.name === e.currentTarget.value)

                if (!!race) {
                    setCurrentRace("name",race.name)
                    setCurrentRace("age",race.age)
                    setCurrentRace("alignment",race.alignment)
                    setCurrentRace("speed",race.speed)
                    setCurrentRace("size",race.size)
                    setCurrentRace("sizeDescription",race.sizeDescription)
                    setCurrentRace("languages",race.languages)
                    setCurrentRace("languageDesc",race.languageDesc)
                    setCurrentRace("languageChoice",race.languageChoice)
                    setCurrentRace("traits",race.traits)
                    setCurrentRace("traitChoice",race.traitChoice)
                    setCurrentRace("startingProficencies",race.startingProficencies)
                    setCurrentRace("startingProficiencyChoices",race.startingProficiencyChoices)
                    setCurrentRace("abilityBonuses",race.abilityBonuses)
                    setCurrentRace("abilityBonusChoice",race.abilityBonusChoice)
                }
                console.log("set: ", currentRace);
                
            }}
            
        >
            <For each={allRaceNames()}>
                { (raceName,i) => <Option value={raceName}>{raceName}</Option> }
            </For>
        </Select>

        <div>
            editting stuff temporary lorem ispum
        </div>

        <div>
            <Show when={currentRace.subRaces.length > 0}>
                <For each={currentRace.subRaces}>
                    { (subrace) => <Chip value={subrace.name} remove={()=>currentRace.subRaces.filter(x=>x.name !== subrace.name)} /> }
                </For>
            </Show>
        </div>

        
    </Body>
}
export default Subraces;