import { Component, For, createSignal, useContext, createMemo } from "solid-js";
import { useStyle, Body, Input, Select, Option } from "../../../../../shared/";
import styles from './backgrounds.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import { SharedHookContext } from "../../../../rootApp";
import getUserSettings from "../../../../../shared/customHooks/userSettings";
import HomebrewManager from "../../../../../shared/customHooks/homebrewManager";
import { createStore } from "solid-js/store";
import { Background } from "../../../../../models";
import useGetBackgrounds from "../../../../../shared/customHooks/data/useGetBackgrounds";
import { effect } from "solid-js/web";
import FormField from "../../../../../shared/components/FormField/formField";

const Backgrounds: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
		const allBackgrounds = useGetBackgrounds();
		const brewBackgrounds = HomebrewManager.backgrounds;
    const stylin = createMemo(()=>useStyle(userSettings().theme));
		const [currentBackground, setCurrentBackground] = createStore<Background>({
			name: "",
			startingProficiencies: [],
			languageChoice: {choose: 0, type: 'language', choices: []},
			startingEquipment: [],
			startingEquipmentChoices: [],
			feature: []
		});
		effect(()=>{
			console.log('Backgrounds: ', allBackgrounds());
			
		})
    return (
        <>
            <Body>
                <h1>backgrounds</h1>
                <div>
										<p>
											<FormField name="Background Name">
												<Input 
													value={currentBackground.name} 
													onChange={(e)=>setCurrentBackground({name:e.currentTarget.value})} transparent/>
											</FormField>
										</p>
										<p>
											<Input type="number" transparent
												style={{width: "min-content"}} 
												value={currentBackground.languageChoice.choose} 
												onChange={(e)=>{
												setCurrentBackground({languageChoice: {...currentBackground.languageChoice, type:"language", choose: parseInt(e.currentTarget.value)}});
											}} /> 
										</p>
                    <p>ideals</p>
                    <p>bonds</p>
                    <p>flaws</p>
                    <p>personality traits</p>
                    <p>background features</p>
                    <p>languages</p>
                    <p>skills</p>
                    <p>tools</p>
                </div>
            </Body>
        </>
    );
}
export default Backgrounds;

const getLanguages = ()=>{
	return [
		'Abyssal',
		'Aquan',
		'Auran',
		'Celestial',
		'Draconic',
		'Dwarvish',
		'Elvish',
		'Giant',
		'Gnomish',
		'Goblin',
		'Halfling',
		'Infernal',
		'Orc',
		'Sylvan',
		'Undercommon'
	]
}