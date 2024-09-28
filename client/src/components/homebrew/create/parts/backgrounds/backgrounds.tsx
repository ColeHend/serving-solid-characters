import { Component, For, createSignal, useContext, createMemo, Show } from "solid-js";
import { useStyle, Body, Input, Select, Option, Button } from "../../../../../shared/";
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
import FeatureModal from "../classes/sections/featureModal";
import { LevelEntity } from "../../../../../models/class.model";
import { Feature, FeatureTypes } from "../../../../../models/core.model";

const Backgrounds: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
		const allBackgrounds = useGetBackgrounds();
		const brewBackgrounds = HomebrewManager.backgrounds;
    const stylin = createMemo(()=>useStyle(userSettings().theme));
		const [showFeatureModal, setShowFeatureModal] = createSignal(false);
		const [editIndex, setEditIndex] = createSignal(-1);
		const [currentBackground, setCurrentBackground] = createStore<Background>({
			name: "",
			startingProficiencies: [],
			languageChoice: {choose: 0, type: FeatureTypes.Language, choices: []},
			startingEquipment: [],
			startingEquipmentChoices: [],
			feature: []
		});
		const addFeature = (level: number, feature: Feature<string, string>) => {
			const newFeature: Feature<string[], string> = {
				name: feature.name,
				value: [feature.value],
				info: feature.info
			};
			setCurrentBackground({feature: [...currentBackground.feature, newFeature]});
		};

		const replaceFeature = (level: number, index: number, feature: Feature<string, string>) => {
			const newFeatures = [...currentBackground.feature];
			newFeatures[index] = {
				name: feature.name,
				value: [feature.value],
				info: feature.info
			};
			setCurrentBackground({feature: newFeatures});
		};

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
											<FormField name="Amount of Starting Proficiencies">
												<Input type="number" transparent
													style={{width: "min-content"}} 
													value={currentBackground.languageChoice.choose} 
													onChange={(e)=>{
													setCurrentBackground({languageChoice: {...currentBackground.languageChoice, type: FeatureTypes.Language, choose: parseInt(e.currentTarget.value)}});
												}} /> 
											</FormField>
										</p>
										<div>
											<Button onClick={(e)=>{
												setShowFeatureModal(true);
												setEditIndex(-1);
											}}>Add Feature</Button>
											<Show when={showFeatureModal()}>
												<FeatureModal 
													addFeature={addFeature} 
													replaceFeature={replaceFeature} 
													currentLevel={{} as LevelEntity} 
													showFeature={showFeatureModal} 
													setShowFeature={setShowFeatureModal}
													editIndex={editIndex}
													setEditIndex={setEditIndex} 
													currentBackground={currentBackground}
												/>
											</Show>
											<For each={currentBackground.feature}>{(f, index)=>
												<Button onClick={(e)=>{
													setShowFeatureModal(true);
													setEditIndex(index);
												}}>{f.name}</Button>
											}</For>
										</div>
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