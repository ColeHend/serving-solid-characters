import { Component, For, createSignal, useContext, createMemo, createEffect, Show } from "solid-js";
import { useStyle, getUserSettings, Body, homebrewManager, FormField, Input, Select, Option, Button, Chip, Clone, UniqueSet } from "../../../../../shared/";
import styles from './races.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { SharedHookContext } from "../../../../rootApp";
import { Race } from "../../../../../models";
import { createStore } from "solid-js/store";
import { FeatureTypes, AbilityScores, Feature } from "../../../../../models/core.model";
import FeatureModal from "../classes/sections/featureModal";
import { LevelEntity } from "../../../../../models/class.model";
import { f, n, S } from "@vite-pwa/assets-generator/shared/assets-generator.5e51fd40";
import useGetRaces from "../../../../../shared/customHooks/data/useGetRaces";

const Races: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyle(userSettings().theme));
		const allRaces = useGetRaces();
		const hombrewRaces = createMemo(()=>homebrewManager.races());
		// -------------------- Signals/State
		const [selectedAbility, setSelectedAbility] = createSignal<AbilityScores>(0);
		const [newSizes, setNewSizes] = createSignal<string>('Tiny');
		// ------- Store
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
		// -------------------- Functions
		const getAge = (type: 'low' | 'high') => {
			const ages = currentRace.age.split(" - ");
			if (type === 'low') {
				return ages[0] ?? '0';
			} else {
				return ages[1] ?? '0';
			}
		}
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
					other: feature.info.other
				},
				metadata: feature.metadata
			};
			const newTraits = Clone(currentRace.traits);
			newTraits.push(newFeature);
			setCurrentRace("traits", newTraits);
			setShowFeatureModal(false);
		}
		const replaceFeature = (level: number, index:number, feature: Feature<string, string>) => {
			const newFeature: Feature<string[], string> = {
				name: feature.name,
				value: [feature.value],
				info: {
					className: feature.info.className,
					subclassName: feature.info.subclassName,
					level: feature.info.level,
					type: feature.info.type,
					other: feature.info.other
				},
				metadata: feature.metadata
			};
			const newTraits = Clone(currentRace.traits);
			newTraits[index] = newFeature;
			setCurrentRace("traits", newTraits);
			setShowFeatureModal(false);
		}

		createEffect(()=>{
			console.log(allRaces());
			
		})

    return (
        <>
            <Body>
                <h1>Races</h1>
                <div>
                    <div>
											<FormField name="Name">
												<Input type="text"
													transparent 
													value={currentRace.name} 
													onInput={(e) => setCurrentRace("name", e.currentTarget.value)} />
											</FormField>
										</div>
                    <div>
											<h2>Size</h2>
											<div>
												<Select transparent
													value={newSizes()} 
													onChange={(e)=>setNewSizes(e.currentTarget.value)}>
													<For each={["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"]}>{(size) => 		
														<Option value={size}>{size}</Option>
													}</For>
												</Select>
												<Button onClick={(e)=>{
													const selSize = currentRace.size.split(",");
													const newArray = [...selSize, newSizes().trim()]
														.map((s)=>s.trim())
														.filter(s=>!!s.length);
													setCurrentRace("size", newArray.join(", "));
												}}>Add Size Option</Button>
											</div>
											<div style={{display: 'flex'}}>
												<Show when={!!currentRace.size}>
													<For each={currentRace.size.split(", ")}>{(size, i) => 
														<Chip value={size} remove={()=> {
															const newSizes = currentRace.size.split(", ");
															newSizes.splice(i(), 1);
															setCurrentRace("size", newSizes.join(", "));
														}} />
													}</For>
												</Show>
												<Show when={!currentRace.size}>
													<Chip value="None" />
												</Show>
											</div>
											<div>
												<FormField name="Size Description">
													<Input type="text"
														transparent 
														value={currentRace.sizeDescription} 
														onInput={(e) => setCurrentRace("sizeDescription", e.currentTarget.value)} />
												</FormField>
											</div>
										</div>
                    <div>
											<h2>Speed</h2>
											<FormField name="Speed">
												<Input type="number" 
													transparent
													value={currentRace.speed} 
													onInput={(e) => setCurrentRace("speed", parseInt(e.currentTarget.value))} />
											</FormField>
										</div>
                    <div>
											<h2>Ability Scores</h2>
											<Select transparent
												value={selectedAbility()}
												onChange={(e)=>setSelectedAbility(parseInt(e.currentTarget.value))}>
												<For each={[0,1,2,3,4,5,6]}>{(ability) => 		
													<Option value={ability}>{AbilityScores[ability]}</Option>
												}</For>
											</Select>
										</div>
                    <div>
											<h2>Age Range</h2>
											<FormField name="Low Age">
												<Input type="text"
													transparent 
													value={getAge('low')} 
													onInput={(e) => setAge(e.currentTarget.value, getAge('high'))} />
											</FormField>
											<FormField name="High Age">
												<Input type="text"
													transparent 
													value={getAge('high')} 
													onInput={(e) => setAge(getAge('low'), e.currentTarget.value)} />
												</FormField>
										</div>
										<div>
											<h2>Features</h2>
											<div style={{display:'flex'}}>
												<Button onClick={()=>setShowFeatureModal(true)}>Add Feature</Button>
												<span>
													<For each={currentRace.traits}>{(trait, i) => 
														<Chip 
															value={trait.name}
															onClick={()=>{
																setEditIndex(i);
																setShowFeatureModal(true);
															}} 
															remove={()=>{
																const newTraits = Clone(currentRace.traits);
																newTraits.splice(i(), 1);
																setCurrentRace("traits", newTraits);
																setShowFeatureModal(false);
															}} 
														/>
													}</For>
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
            </Body>
        </>
    );
}
export default Races;