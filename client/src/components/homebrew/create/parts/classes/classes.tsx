import {
  Accessor,
  Component,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  untrack,
  useContext,
  type JSX,
} from "solid-js";
import styles from "./classes.module.scss";
import HomebrewSidebar from "../../sidebar";
import HomebrewManager from "../../../../../shared/customHooks/homebrewManager";
import {
  Input,
  Button,
  Select,
  Option,
  Carousel,
  Chip,
  useGetClasses,
  useGetItems,
  getUserSettings,
  useStyle,
  Body,
	SkinnySnowman,
	Clone,
	getSpellSlots,
	Tabs,
	Tab
} from "../../../../../shared/";
import type { DnDClass } from "../../../../../models";
import { ClassCasting, LevelEntity, Subclass } from "../../../../../models/class.model";
import {
  Choice,
  StartingEquipment,
  Feature,
	Description,
} from "../../../../../models/core.model";
import LevelBuilder from "./levelBuilder";
import { SpellsKnown } from "../subclasses/subclasses";
import { A, useSearchParams } from "@solidjs/router";
import { SharedHookContext } from "../../../../rootApp";
import Table from '../../../../../shared/components/Table/table';
import { SecondRow, Cell, Column, Header, Row } from '../../../../../shared/components/Table/innerTable';
import FormField from "../../../../../shared/components/FormField/formField";
import Proficiency from "./sections/proficiency";
import StartEquipment from "./sections/startEquipment";
import { CastingStat, Stat } from "../../../../../shared/models/stats";
import { SpellLevels } from "../../../../../shared/models/casting";
import Chipbar from "../../../../../shared/components/Chipbar/chipbar";
import { Item } from '../../../../../shared/index';
import { createStore } from "solid-js/store";
import Modal from "../../../../../shared/components/popup/popup.component";
import FeatureModal from "./sections/featureModal";

const Classes: Component = () => {
	// --- getter functions
  const [searchParam, setSearchParam] = useSearchParams();
	const [userSettings, setUserSettings] = getUserSettings();
	const themeStyle = createMemo(()=>useStyle(userSettings().theme));
	const sharedHooks = useContext(SharedHookContext);
	const [currentClass, setCurrentClass] = createStore<DnDClass>({
		id: 0,
		name: "",
		hitDie: 4,
		proficiencies: [],
		proficiencyChoices: [],
		savingThrows: [],
		startingEquipment: {
			class: "",
			quantity: 0,
			choice1: [],
			choice2: [],
			choice3: [],
			choice4: []
		},
		classLevels: Array.from({length: 20}, (_, i)=>({
			level: i+1, 
			profBonus: (Math.ceil((i+1)/4)+1), 
			features: [], 
			classSpecific: {}, 
			info: { className:"", level: i+1, subclassName:"", type:"", other:""}
		}),),
		subclasses: [],
		classMetadata: {
			subclassLevels: [],
			subclassType: "",
			subclassTypePosition: "before"
		}
	}); 
	const tableData = () => currentClass.classLevels
	const getFeatureChips = (i:number)=>Object.entries((classLevels()[i]?.classSpecific));
	const casterType = createMemo(() => currentClass.spellcasting?.casterType);
	const setCasterType = (casterType: string) => setCurrentClass((prev)=>({
		classMetadata: {
			...prev.classMetadata,
			spellcasting: {
				level: 0,
				name: prev.spellcasting?.name ?? "",
				spellsKnownCalc: prev.spellcasting?.spellsKnownCalc ?? "Level",
				spellcastingAbility: prev.spellcasting?.spellcastingAbility ?? "INT",
				casterType: casterType,
				info: prev.spellcasting?.info ?? []
			}
		}
}));
	const [currentColumns, setCurrentColumns] = createSignal<string[]>(["level", "proficiency", "options", "features"]);
	const [levels, setLevels] = createSignal<number[]>(Array.from({length: 20}, (_, i)=>i+1));
	const spellCalc = () => currentClass.spellcasting?.spellsKnownCalc;
	const classLevels = () => currentClass.classLevels;
	// --- setter functions
	const setName = (name: string) => setCurrentClass((prev)=>Clone({...prev, name}));
	const setHitDie = (hitDie: number) => setCurrentClass((prev)=>Clone({...prev, hitDie}));
	const setProficiencies = (proficiencies: string[]) => setCurrentClass((prev)=>Clone({...prev, proficiencies}));
	const setProficiencyChoices = (proficiencyChoices: Choice<string>[]) => setCurrentClass((prev)=>Clone({...prev, proficiencyChoices}));
	const setSavingThrows = (savingThrows: string[]) => setCurrentClass((prev)=>Clone({...prev, savingThrows}));
	const setStartingEquipment = (startingEquipment: StartingEquipment) => setCurrentClass((prev)=>Clone({...prev, startingEquipment}));
	const setStartingEquipChoice = (choiceNum: number, choice: Choice<Item>[]) => {
		
		switch (choiceNum) {
			case 1:
				setCurrentClass((prev)=>(({ 
					startingEquipment: {...prev.startingEquipment, choice1: choice}
				} as DnDClass)));
				break;
			case 2:
			setCurrentClass((prev)=>(({
				startingEquipment: {...prev.startingEquipment, choice2: choice}
			} as DnDClass)));
			break;
			case 3:
				setCurrentClass((prev)=>(({
					startingEquipment: {...prev.startingEquipment, choice3: choice}
				} as DnDClass)));
			break;
			case 4:
				setCurrentClass((prev)=>(({ 
					startingEquipment: {...prev.startingEquipment, choice4: choice}
				} as DnDClass)));
				break;	
			default:
				setCurrentClass((prev)=>(({
					startingEquipment: {...prev.startingEquipment, choice1: choice}
				} as DnDClass)));
				break;
		}
	};

	const setClassLevels = (classLevels: LevelEntity[]) => setCurrentClass((prev)=>({ classLevels}));
	const setSubclasses = (subclasses: Subclass[]) => setCurrentClass((prev)=>({ subclasses}));
	const setSubclassLevels = (subclassLevels: number[]) => setCurrentClass((prev)=>({ classMetadata: {...prev.classMetadata, subclassLevels}}));
	// - spellcasting
	const setSpellcastingName = (name: string) => setCurrentClass((prev)=>({
		spellcasting: {
			level: 0,
			name,
			spellsKnownCalc: prev.spellcasting?.spellsKnownCalc ?? "Level",
			spellcastingAbility: prev.spellcasting?.spellcastingAbility ?? "INT",
			casterType: prev.spellcasting?.casterType ?? "full",
			info: prev.spellcasting?.info ?? []
		}
	}));
	const setSpellKnown = (known: SpellsKnown, roundUp: boolean = false) => setCurrentClass((prev)=>({ 
		spellcasting: {
			level: 0,
			name: prev.spellcasting?.name ?? "",
			spellsKnownCalc: SpellsKnown[known],
			spellcastingAbility: prev.spellcasting?.spellcastingAbility ?? "INT",
			casterType: prev.spellcasting?.casterType ?? "full",
			info: prev.spellcasting?.info ?? [],
			spellsKnownRoundup: roundUp
		}
	}));
	const setSpellCastingAbility = (ability: CastingStat) => setCurrentClass((prev)=>({ 
		spellcasting: {
			level: 0,
			name: prev.spellcasting?.name ?? "",
			spellsKnownCalc: prev.spellcasting?.spellsKnownCalc ?? "Level",
			spellcastingAbility: CastingStat[ability],
			casterType: prev.spellcasting?.casterType ?? "full",
			info: prev.spellcasting?.info ?? []
		}
	}));
	const setSpellCasterType = (casterType: string) => setCurrentClass((prev)=>({ 
		spellcasting: {
			level: 0,
			name: prev.spellcasting?.name ?? "",
			spellsKnownCalc: prev.spellcasting?.spellsKnownCalc ?? "Level",
			spellcastingAbility: prev.spellcasting?.spellcastingAbility ?? "INT",
			casterType: casterType,
			info: prev.spellcasting?.info ?? []
		}
	}));
	const setSpellCastingInfo = (info: Description[]) => setCurrentClass((prev)=>({ 
		spellcasting: {
			level: 0,
			name: prev.spellcasting?.name ?? "",
			spellsKnownCalc: prev.spellcasting?.spellsKnownCalc ?? "Level",
			spellcastingAbility: prev.spellcasting?.spellcastingAbility ?? "INT",
			casterType: prev.spellcasting?.casterType ?? "full",
			info
		}
	}));

	
	// --- functions
	const addClassSpecific = (feature: string) => {
		const newClassLevels = classLevels().map((x, i)=>({...x, classSpecific: {...x.classSpecific, [feature]: feature}}));
		setClassLevels(newClassLevels);
	};

	const removeClassSpecific = (feature: string) => {
		setCurrentClass((old)=>{
			const newOld = Clone(old);
			Array.from({length: 20}, (_, i)=>i+1).forEach((level)=>{
				const levelEntries = Object.entries(old.classLevels[level-1].classSpecific)
				const removeIndex = levelEntries.findIndex(([key, value])=>key === feature);
				if (removeIndex !== -1) levelEntries.splice(removeIndex, 1);
				newOld.classLevels[level-1].classSpecific = Object.fromEntries(levelEntries);
			});
			return {classLevels: newOld.classLevels};
		});
		setCurrentColumns((old)=>old.filter((x)=>x !== feature));
	};

	const addFeature = (level: number, feature: Feature<unknown, string>) => {
		setCurrentClass(old=> {
			const newClass = Clone(old);
			newClass.classLevels[(level - 1)].features.push(feature);
			return newClass;
		});
	};
	const removeFeature = (level: number, name: string) => {
		setCurrentClass((old)=>{
			const newClass = Clone(old);
			const index = newClass.classLevels[(level - 1)].features.findIndex((x)=>x.name === name);
			newClass.classLevels[(level - 1)].features.splice(index, 1);
			return newClass;
		});
	};
	
	function getSpellSlot(level: number, slotLevel: number) {
    return getSpellSlots(level, slotLevel, untrack(casterType) ?? '');
	}
	const setSpellCantrips = (level: number, cantrips: number) => {
		const newClassLevels = classLevels().map((x, i)=>i === level - 1 ? {...x, spellcasting: {...x.spellcasting, cantrips_known: cantrips}} : x);
		setClassLevels(newClassLevels);
	}
	const setSpellSlot = (level: number, slotLevel: number, slots: number) => {
		const newClassLevels = classLevels().map((x, i)=>i === level - 1 && !!slots ? {...x, spellcasting: {...x.spellcasting, [`spell_slots_level_${slotLevel}`]: slots}} : x);
		setClassLevels(newClassLevels);
	}
	function setSpellSlots(casterType: string) {
		setCurrentClass((prev)=>({ 
			classLevels: Array.from({length: 20}, (_, i)=>i+1).map((level)=>{
				const classLevel = prev.classLevels[level-1];
				const otherKeys = Object.entries(classLevel.spellcasting ?? {}).filter((x)=>!x.includes('spell_slots_level'));
				classLevel.spellcasting = {};
				if (!!otherKeys.length) otherKeys.forEach(([key, value])=> classLevel.spellcasting![key] = value);
				Array.from({length: 9}, (_, i)=>i+1).forEach((slotLevel)=>{
					const slotValue = getSpellSlots(level, slotLevel, casterType);
					if (slotValue !== '-') classLevel.spellcasting![`spell_slots_level_${slotLevel}`] = slotValue;
				});
				return classLevel;
			}), 
			spellcasting: {
				level: 0,
				name: prev.spellcasting?.name ?? "",
				spellsKnownCalc: prev.spellcasting?.spellsKnownCalc ?? "Level",
				spellcastingAbility: prev.spellcasting?.spellcastingAbility ?? "INT",
				casterType: casterType,
				info: prev.spellcasting?.info ?? []
			}
		}));
	}
	function setSpellsKnown(level: number, known: number) {
		const newClassLevels = currentClass.classLevels.map((x, i)=>i === level - 1 ? {...x, spellcasting: {...x.spellcasting, spells_known: known}} : x);
		setClassLevels(newClassLevels);
	}
	
	function clearSpellSlots() {
		setCurrentClass((old)=>Clone<DnDClass>({...old,
			classLevels: old.classLevels.map((x, i)=>({...x, 
				spellcasting: {
					['spells_known']: (x?.spellcasting?.['spells_known'] ?? ++i)
				}
			})),
			spellcasting: {
				level: 0,
				name: old.spellcasting?.name ?? "",
				spellsKnownCalc: old.spellcasting?.spellsKnownCalc ?? "Level",
				spellcastingAbility: old.spellcasting?.spellcastingAbility ?? "INT",
				casterType: old.spellcasting?.casterType ?? "full",
				info: old.spellcasting?.info ?? []
			}
			
		}) as DnDClass);
		if (spellCalc() === 'Other') {
			return 'spellsKnown'
		}
	}
	// ---- effects
	createEffect(()=>{
		console.log("CurrentClass: ", currentClass);
	});
	createEffect(()=>{
		const currentColumns = ["level", "proficiency", "features"];
		const spellCalcRes = untrack(spellCalc);
		switch (casterType()) {
			case "full":
				if (spellCalcRes === 'Other') {
					currentColumns.push(...['spellsKnown', "cantrip", "level-1", "level-2", "level-3", "level-4", "level-5", "level-6", "level-7", "level-8", "level-9"]);
				} else {
					currentColumns.push(...["cantrip", "level-1", "level-2", "level-3", "level-4", "level-5", "level-6", "level-7", "level-8", "level-9"]);
				}
				setCurrentColumns(currentColumns);
				setSpellSlots("full");
				break;
			case "half":
				if (spellCalcRes === 'Other') {
					currentColumns.push(...['spellsKnown', "cantrip", "level-1", "level-2", "level-3", "level-4", "level-5"]);
				} else {
					currentColumns.push(...["cantrip", "level-1", "level-2", "level-3", "level-4", "level-5"]);
				}
				setCurrentColumns(currentColumns);
				setSpellSlots("half");
				break;
			case "third":
				if (spellCalcRes === 'Other') {
					currentColumns.push(...['spellsKnown', "cantrip", "level-1", "level-2", "level-3", "level-4"]);
				} else {
					currentColumns.push(...["cantrip", "level-1", "level-2", "level-3", "level-4"]);
				}
				setCurrentColumns(currentColumns);
				setSpellSlots("third");
				break;
			case "other":
					if (spellCalcRes === 'Other') {
						currentColumns.push(...['spellsKnown', "cantrip", "level-1", "level-2", "level-3", "level-4", "level-5", "level-6", "level-7", "level-8", "level-9"]);
					} else {
						currentColumns.push(...["cantrip", "level-1", "level-2", "level-3", "level-4", "level-5", "level-6", "level-7", "level-8", "level-9"]);
					}
					setCurrentColumns(currentColumns);
					break;
			default:
				setCurrentColumns(currentColumns);
				break;
		}
	})
	createEffect(()=>{
		setCurrentColumns((old)=>{
			if (old.length >= 3) {
				const firstColumns = old.slice(0, 3);
				const restColumns = old.slice(3);
				return [...(new Set([...firstColumns, ...getClassSpecificKeys(), ...restColumns].filter(x=>!!x)))]
			}
			return old;
		})
	})

	const [newColumnKeyname, setNewColumnKeyname] = createSignal<string>('');
	const [showAddFeature, setShowAddFeature] = createSignal<boolean>(false);
	const [currentLevel, setCurrentLevel] = createSignal<LevelEntity>({} as LevelEntity);
	const getClassSpecificKeys = createMemo(()=>{
		const keys = new Set<string>();
		classLevels().forEach((x)=>Object.keys(x.classSpecific).forEach((key)=>keys.add(key)));
		return Array.from(keys).filter((x)=>!!x);
	});
	const newColumnInvalid = createMemo(()=> newColumnKeyname().trim() === '' || currentColumns().includes(newColumnKeyname()));
// ----------------- JSX -----------------
  return (
    <>
      <Body>
        <div>
					<h1>Classes Homebrewing</h1>
					<div class={`${styles.rowOne}`}>
						<span>
							<FormField class={`${styles.fieldStyle}`} name="Class Name">
								<Input transparent value={currentClass.name} onChange={(e)=>setName(e.currentTarget.value)} />
							</FormField>
						</span>
						<span class={`${styles.selectSpan}`}>
							<label for="hitDie">Hit Die</label>
							<Select id="hitDie" transparent value={currentClass.hitDie} onChange={(e)=>{
								setHitDie(+e.currentTarget.value);
							}} disableUnselected>
								<For each={[4,6,8,10,12]}>{(die)=>(
									<Option value={die}>{die}</Option>
								)}</For>
							</Select>
						</span>
						<span  class={`${styles.selectSpan}`}>
							<label for="casterType">Caster Type</label>
							<Select tooltip="Caster Type" disableUnselected transparent  
								value={casterType()} 
								onChange={(e)=>{setCasterType(e.currentTarget.value);}} >
									<Option value="none">None</Option>
								<For each={["full", "half", "third", "other"]}>{(x)=>(
									<Option value={x}>{`${x[0].toUpperCase()}${x.slice(1)}`}</Option>
								)}</For>
							</Select>
						</span>
					</div>
					<div class={`${styles.twoRowContainer}`}>
						<div class={`${styles.divide}`} style={{
							"display": "flex",
							"flex-direction": "column",
						}}>
							<Proficiency setSaves={setSavingThrows} setProficiencies={setProficiencies} currentClass={currentClass} />
							<div>
								<Tabs>
									<Tab name="Subclasses">
										<div>
											<div>
												<FormField name="Subclass Type">
													<Input transparent type="text" 
														placeholder="e.g.. __ bloodline, order of the __" 
														value={currentClass.classMetadata.subclassType}
														onInput={(e)=>setCurrentClass(old => ({
															classMetadata: {
																...old.classMetadata,
																subclassType: e.currentTarget.value.trim()
															}
														}))}/>
												</FormField>
												<Select disableUnselected transparent 
													value={currentClass.classMetadata.subclassTypePosition}
													onChange={(e)=>setCurrentClass((old)=>({
														classMetadata: {
															...old.classMetadata,
															subclassTypePosition: e.currentTarget.value
														}
													}))}>
													<Option value={'before'}>Before</Option>
													<Option value={'after'}>After</Option>
												</Select>
											</div>
											<Show when={!!currentClass.classMetadata.subclassType.trim().length}>
												<div>
													<Input style={{width: '75px', border: '1px solid'}} transparent type="number" min={1} max={20} />
													<Button>Add Subclass Level</Button>
												</div>
											</Show>
										</div>
									</Tab>
									<Tab name="Class Specific">
										<div>
											<FormField name="Column Name">
												<Input transparent type="text" 
													value={newColumnKeyname()} 
													onInput={(e)=>setNewColumnKeyname(e.currentTarget.value.trim())} />
											</FormField>
											<Button
												disabled={newColumnInvalid()} 
												onClick={(e)=>{
													addClassSpecific(newColumnKeyname());
												}} 
											>New Table Column</Button>
										</div>
										<div>
											<ul>
												<For each={getClassSpecificKeys()}>{(key)=><>
													<li>
														<span>{key} <Button onClick={(e)=>{
															removeClassSpecific(key);
														}}>x</Button></span>
													</li>
												</>}</For>
											</ul>
										</div>
									</Tab>
										<Tab name="Spellcasting">
											<Show when={!!casterType() && casterType() !== "none"}>
												<div class={`${styles.spellcasting}`}>
													<span class={`${styles.selectSpan}`}>
														<label>Casting Stat</label>
														<Select disableUnselected transparent 
															value={(()=>{
																const classCast = currentClass.spellcasting;
																if (!!classCast) {
																	const abilityValue = classCast.spellcastingAbility;
																	if (typeof abilityValue === 'string'  && !/\d/.test(abilityValue)) return JSON.parse(JSON.stringify(CastingStat))[abilityValue].toString();
																	if (typeof abilityValue === 'number' || /\d/.test(abilityValue)) return abilityValue.toString();
																}
																return '1';
															})()} 
															onChange={(e)=>{setSpellCastingAbility(+e.currentTarget.value)}}> 
															<For each={[1,2,3]}>{(x)=><>
																<Option value={x}>{CastingStat[x]}</Option>
															</>}</For>
														</Select>
													</span>
													<span class={`${styles.selectSpan}`}>
														<label>Spells Known</label>
														<Input type="checkbox"
															tooltip="Round up spells known?"
															style={{"margin": "0px", 'margin-left': '10px'}} 
															checked={currentClass.spellcasting?.spellsKnownRoundup ?? false} 
															onChange={(e)=>{
																const casterType = currentClass.spellcasting?.casterType as keyof typeof SpellsKnown;
																if (!!casterType) {
																	const num = +SpellsKnown[casterType] as number;
																	setSpellKnown(num, e.currentTarget.checked);
																}
															}}/>
														<Select disableUnselected transparent
															value={currentClass.spellcasting?.casterType ?? ''}
															onChange={(e)=>setSpellKnown(+e.currentTarget.value)}>
															<For each={[1,2,3,4,5,6]}>{(x)=><>
																<Option value={x}>{SpellsKnown[x]}</Option>
															</>}</For>
														</Select>
													</span>
												</div>
											</Show>
											<Show when={!!!casterType() || casterType() === "none"}>
												<h4>
													Not A Caster
												</h4>
											</Show>
										</Tab>
								</Tabs>
							</div>

						</div>
						<div class={`${styles.divide}`} />
						<StartEquipment  currentClass={currentClass}  setStartEquipChoice={setStartingEquipChoice}/>
					</div>
					<div class={`${styles.twoRowContainer}`}>
						<div class={`${styles.twoRowContainer}`}>
							<Table class={`${styles.wholeTable}`} data={()=>currentClass.classLevels} columns={currentColumns()}>
								<Column name="proficiency">
									<Header class={`${styles.headerStyle}`}>P.B.</Header>
									<Cell<LevelEntity> class={`${styles.cellStyle}`}>{(x)=>`+${x.profBonus}`}</Cell>
								</Column>
								<Column name="level">
									<Header class={`${styles.headerStyle}`}>Level</Header>
									<Cell class={`${styles.cellStyle}`}>{(x)=>x.level}</Cell>
								</Column>
								<Column name="features">
									<Header class={`${styles.headerStyle}`}>Features</Header>
									<Cell<LevelEntity> class={`${styles.tableFeature}`}>{(x, i)=>{
										return <>
											<Button onClick={(e)=>{
												setCurrentLevel(x);
												setShowAddFeature(old => !old);
											}}>+</Button>
											<For each={x?.features}>{(entry)=>{
												return <Chip key={`${entry?.info?.level} `} value={entry?.name} remove={()=>removeFeature(entry?.info?.level, entry?.name)} />
											}}</For>
										</>;
									}}</Cell>
								</Column>
								<Column name='spellsKnown'>
									<Header class={`${styles.headerStyle}`}>Spells Known</Header>
									<Cell<LevelEntity> class={`${styles.cellStyle}`}>{(x)=><Input style={{width:'2.5rem'}} type="number" min={0} 
										value={classLevels()[x.level-1].spellcasting?.spells_known}
										onChange={(e)=>setSpellsKnown(x.level, +e.currentTarget.value)}/>}</Cell>
								</Column>
								<Column name="cantrip">
									<Header class={`${styles.headerStyle}`}>Cantrips</Header>
									<Cell<LevelEntity> class={`${styles.cellStyle}`}>{
										(x)=><Input style={{width:'2.5rem'}} type="number" min={0}
											value={classLevels()[x.level-1].spellcasting?.cantrips_known}
											onChange={(e)=>setSpellCantrips(x.level, +e.currentTarget.value)}/>
									}</Cell>
								</Column>
								<For each={getClassSpecificKeys()}>{(key)=><Column name={key}>
										<Header class={`${styles.headerStyle}`}>{key}</Header>
										<Cell<LevelEntity> class={`${styles.cellStyle}`}>{(x)=><>
											<Show when={x.classSpecific[key] === key}>{key}</Show>
										</>}</Cell>
									</Column>
								}</For>
								<For each={[1,2,3,4,5,6,7,8,9]}>{(level)=>
									<Column name={`level-${level}`}>
										<Header class={`${styles.headerStyle}`}>{SpellLevels.get(level.toString())}</Header>
										<Cell<LevelEntity> class={`${styles.cellStyle}`}>{(x)=><>
										<Show when={casterType() !== "other"}>{getSpellSlot(x.level, level)}</Show>
										<Show when={casterType() === "other"}>
											<Input 
												style={{width:"2rem"}}
												value={classLevels()[x.level-1].spellcasting?.[`spell_slots_level_${level}`]} 
												onChange={(e)=> setSpellSlot(x.level, level, +e.currentTarget.value)}/>
										</Show>
										</>}</Cell>
									</Column>
								}</For>
								<Row class={`${styles.rowStyle}`}/> 
							</Table>
							<Show when={showAddFeature()}>
									<FeatureModal 
										addFeature={addFeature} 
										showFeature={showAddFeature}
										currentLevel={currentLevel()} 
										setShowFeature={setShowAddFeature} />
							</Show>
						</div>
					</div>
				</div>
      </Body>
    </>
  );
};
export default Classes;
