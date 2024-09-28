import { Component, For, createSignal, useContext, createMemo, Show } from "solid-js";
import { useStyle, Body, Input, Select, Option, Button, TextArea } from "../../../../../shared/";
import styles from './backgrounds.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import { SharedHookContext } from "../../../../rootApp";
import getUserSettings from "../../../../../shared/customHooks/userSettings";
import HomebrewManager from "../../../../../shared/customHooks/homebrewManager";
import { createStore } from "solid-js/store";
import { Background } from "../../../../../models";
import useGetBackgrounds from "../../../../../shared/customHooks/data/useGetBackgrounds";
import { className, effect } from "solid-js/web";
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
		const [featureDesc, setFeatureDesc] = createSignal("");
		const [selectedSkill, setSelectedSkill] = createSignal("");
		const [selectedTool, setSelectedTool] = createSignal("");
		const [selectedLanguage, setSelectedLanguage] = createSignal("");
		const [selectedProficiency, setSelectedProficiency] = createSignal("");
		const [currentBackground, setCurrentBackground] = createStore<Background>({
			name: "",
			desc: "",
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
				info: feature.info,
				metadata: feature.metadata
			};
			setCurrentBackground({feature: [...currentBackground.feature, newFeature]});
		};

		const replaceFeature = (level: number, index: number, feature: Feature<string, string>) => {
			const newFeatures = [...currentBackground.feature];
			newFeatures[index] = {
				name: feature.name,
				value: [feature.value],
				info: feature.info,
				metadata: feature.metadata
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
										<div>
											<FormField name="Background Name">
												<Input 
													min={1}
													value={currentBackground.name} 
													onChange={(e)=>setCurrentBackground({name:e.currentTarget.value})} transparent/>
											</FormField>
										</div>
										<div>
											<h4>Background Description</h4>
											<FormField name="Description">
												<TextArea
													transparent
													onChange={(e)=>setCurrentBackground({desc: e.currentTarget.value})}
													text={featureDesc}
													setText={setFeatureDesc} />
											</FormField>
										</div>
										<div>
											<h4>Skill Proficiencies</h4>
											<div>
												<label>Choose </label>
												<Input type="number" transparent
													style={{width: "min-content"}} 
													value={currentBackground.languageChoice.choose} 
													onChange={(e)=>{
													setCurrentBackground({languageChoice: {...currentBackground.languageChoice, type: FeatureTypes.Language, choose: parseInt(e.currentTarget.value)}});
												}} /> 
											</div>
											<div>
												<Select transparent
													value={selectedSkill()} 
													onChange={(e)=>{
														setSelectedSkill(e.currentTarget.value);
													}
												}>
													<For each={allSkills()}>{(skill)=>
														<Option value={skill}>{skill}</Option>
													}</For>
												</Select>
												<Button onClick={(e)=>{
													setCurrentBackground({
														startingProficiencies: [...currentBackground.startingProficiencies,
															{
																info: {
																	className: '',
																	subclassName: '',
																	level: 0,
																	type: FeatureTypes.Background,
																	other: ''
																},
																metadata: {},
																name: 'Skill Proficiency',
																value: selectedSkill()
															}
														]
													})
												}}>Add Proficiency Choice</Button>
											</div>
											<div>
												<For each={currentBackground.startingProficiencies}>{(prof, index)=>
													<div>
														{prof.name}: {prof.value}
													</div>
												}</For>
											</div>
										</div>
										<div>
											<h4>Features</h4>
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
										<div>
											<div>
												<h4>Languages</h4>
											</div>
											<div>
												<Select transparent disableUnselected
													value={selectedLanguage()} 
													onChange={(e)=>{
														setSelectedLanguage(e.currentTarget.value);
													}
												}>
													<For each={getLanguages()}>{(lang)=>
														<Option value={lang}>{lang}</Option>
													}</For>
													<Option value="Custom">Custom</Option>
												</Select>
												<Button onClick={(e)=>{
													setCurrentBackground({languageChoice: {...currentBackground.languageChoice, 
														choices: [...currentBackground.languageChoice.choices, selectedLanguage()]
													}});
												}}>Add Language</Button>
											</div>
											<div>
												<For each={currentBackground.languageChoice.choices}>{(lang)=>
													<div>
														{lang}
													</div>
												}</For>
											</div>
										</div>
										<div>
											<h4>Starting Proficiencies</h4>
											<div>
												<Select transparent disableUnselected
													value={selectedProficiency()}
													onChange={(e)=>{
														setSelectedProficiency(e.currentTarget.value);
													}
												}>
													<For each={allSkills()}>{(skill)=>
														<Option value={skill}>{skill}</Option>
													}</For>
												</Select>
												<Button onClick={()=>{
													setCurrentBackground({startingProficiencies: [...currentBackground.startingProficiencies, {
														info: {
															className: '',
															subclassName: '',
															level: 0,
															type: FeatureTypes.Background,
															other: ''
														},
														name: 'Skill Proficiency',
														value: selectedProficiency(),
														metadata: {}
													}]});
												}}>Add Proficiency</Button>
											</div>
											<div>
												<For each={currentBackground.startingProficiencies.filter(x=>allSkills().includes(x.value))}>{(prof)=>
													<div>
														{prof.name}: {prof.value}
													</div>
												}</For>
											</div>
										</div>
										<div>
											<h4>Tool Proficiencies</h4>
											<div>
												<Select transparent disableUnselected
													value={selectedTool()}
													onChange={(e)=>{
														setSelectedTool(e.currentTarget.value);
													}
												}>
													<For each={allTools()}>{(tool)=>
														<Option value={tool}>{tool}</Option>
													}</For>
												</Select>
												<Button onClick={()=>{
													setCurrentBackground({startingProficiencies: [...currentBackground.startingProficiencies, {
														info: {
															className: '',
															subclassName: '',
															level: 0,
															type: FeatureTypes.Background,
															other: ''
														},
														name: 'Tool Proficiency',
														value: selectedTool(),
														metadata: {}
													}]});
												}}>Add Proficiency</Button>
											</div>
											<div>
												<For each={currentBackground.startingProficiencies.filter(x=>allTools().includes(x.value))}>{(prof)=>
													<div>
														{prof.name}: {prof.value}
													</div>
												}</For>
											</div>
										</div>
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

const allSkills = ()=>[
	'Acrobatics',
	'Animal Handling',
	'Arcana',
	'Athletics',
	'Deception',
	'History',
	'Insight',
	'Intimidation',
	'Investigation',
	'Medicine',
	'Nature',
	'Perception',
	'Performance',
	'Persuasion',
	'Religion',
	'Sleight of Hand',
	'Stealth',
	'Survival'
];
const allTools = ()=>[
	'Artisan\'s Tools',
	"Smith's Tools",
	"Brewer's Supplies",
	"Calligrapher's Supplies",
	"Carpenter's Tools",
	"Cobbler's Tools",
	"Cook's Utensils",
	"Glassblower's Tools",
	"Jeweler's Tools",
	"Leatherworker's Tools",
	"Mason's Tools",
	"Painter's Supplies",
	"Potter's Tools",
	"Tinker's Tools",
	"Weaver's Tools",
	"Woodcarver's Tools",
	'Disguise Kit',
	'Forgery Kit',
	'Gaming Set',
	'Herbalism Kit',
	'Musical Instrument',
	'Navigator\'s Tools',
	'Poisoner\'s Kit',
	'Thieves\' Tools',
	'Vehicles (Land)',
	'Vehicles (Water)',
];