import { Component, For, createSignal, useContext, createMemo } from "solid-js";
import { useStyle, getUserSettings, Body, homebrewManager } from "../../../../../shared/";
import styles from './races.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { SharedHookContext } from "../../../../rootApp";
import { Race } from "../../../../../models";
import { createStore } from "solid-js/store";
import { FeatureTypes } from "../../../../../models/core.model";

const Races: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyle(userSettings().theme));
		
		const [currentRace, setCurrentRace] = createStore<Race>({
			name: "",
			speed: 30,
			age: "",
			alignment: "",
			size: "",
			sizeDescription: "",
			languages: [],
			languageChoice: {choose: 0, choices: [], type: FeatureTypes.Language},
			languageDesc: "",
			traits: [],
			traitChoice: {choose: 0, choices: [], type: FeatureTypes.Race},
			startingProficencies: [],
			startingProficiencyChoices: {choose: 0, choices: [], type: FeatureTypes.Race},
			abilityBonuses: [],
			abilityBonusChoice: {choose: 0, choices: [], type: FeatureTypes.AbilityScore},
			subRaces: []
		});
    return (
        <>
            <Body>
                <h1>races</h1>
                <div>
                    <p>name</p>
                    <p>size</p>
                    <p>speed</p>
                    <p>ability score increase</p>
                    <p>age range</p>
                    <p>features</p>
                </div>
            </Body>
        </>
    );
}
export default Races;