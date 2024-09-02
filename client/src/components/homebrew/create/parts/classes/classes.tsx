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
	getSpellSlots
} from "../../../../../shared/";
import type { DnDClass } from "../../../../../models";
import { ClassCasting, LevelEntity, Subclass } from "../../../../../models/class.model";
import {
  Choice,
  StartingEquipment,
  Feature,
  Item,
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

const Classes: Component = () => {
	// --- getter functions
  const [searchParam, setSearchParam] = useSearchParams();
	const [userSettings, setUserSettings] = getUserSettings();
	const themeStyle = createMemo(()=>useStyle(userSettings().theme));
	const sharedHooks = useContext(SharedHookContext);
	const [currentClass, setCurrentClass] = createSignal<DnDClass>({
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
			classSpecific: {"test": "test"}, 
			info: { className:"", level: i+1, subclassName:"", type:"", other:""}
		}),),
		features: [],
		subclasses: [],
		subclassLevels: []
	}, {
		equals: (prev, next) => {
				if (prev.classLevels.length !== next.classLevels.length) return false;
				for (let i = 0; i < prev.classLevels.length; i++) {
					const prevLevel = prev.classLevels[i];
					const nextLevel = next.classLevels[i];
					if (prevLevel.features.length !== nextLevel.features.length) return false;
					for (let j = 0; j < prevLevel.features.length; j++) {
						const prevFeature = prevLevel.features[j];
						const nextFeature = nextLevel.features[j];
						if (prevFeature.name !== nextFeature.name) return false;
						if (JSON.stringify(prevFeature.value) !== JSON.stringify(nextFeature.value)) return false;
						if (JSON.stringify(prevFeature.info) !== JSON.stringify(nextFeature.info)) return false;
					}
					if (prevLevel.level !== nextLevel.level) return false;
					if (prevLevel.profBonus !== nextLevel.profBonus) return false;
					if (JSON.stringify(prevLevel.classSpecific) !== JSON.stringify(nextLevel.classSpecific)) return false;
					if (JSON.stringify(prevLevel.spellcasting) !== JSON.stringify(nextLevel.spellcasting)) return false; 
				}
				if (prev.proficiencies.length !== next.proficiencies.length) return false;
				for (let i = 0; i < prev.proficiencies.length; i++) {
					if (prev.proficiencies[i] !== next.proficiencies[i]) return false;
				}
				const name = prev.name === next.name;
				const hitDie = prev.hitDie === next.hitDie;
				const proficiencyChoices = JSON.stringify(prev.proficiencyChoices) === JSON.stringify(next.proficiencyChoices);
				const savingThrows = JSON.stringify(prev.savingThrows) === JSON.stringify(next.savingThrows);
				const startingEquipment = JSON.stringify(prev.startingEquipment) === JSON.stringify(next.startingEquipment);
				const subclasses = JSON.stringify(prev.subclasses) === JSON.stringify(next.subclasses);
				const subclassLevels = JSON.stringify(prev.subclassLevels) === JSON.stringify(next.subclassLevels);
				const all = [name, hitDie, proficiencyChoices, savingThrows, startingEquipment, subclasses, subclassLevels];
				return all.every((x) => x);
		},
	});
	const tableData = () => currentClass().classLevels
	const getFeatureChips = (i:number)=>Object.entries((classLevels()[i]?.classSpecific));
	const [casterType, setCasterType] = createSignal<string>("");
	const [currentColumns, setCurrentColumns] = createSignal<string[]>(["level", "proficiency", "options", "features"]);
	const [levels, setLevels] = createSignal<number[]>(Array.from({length: 20}, (_, i)=>i+1));
	const spellCalc = () => currentClass().spellcasting?.spellsKnownCalc;
	const classLevels = () => currentClass().classLevels;
	// --- setter functions
	const setName = (name: string) => setCurrentClass((prev)=>Clone({...prev, name}));
	const setHitDie = (hitDie: number) => setCurrentClass((prev)=>Clone({...prev, hitDie}));
	const setProficiencies = (proficiencies: string[]) => setCurrentClass((prev)=>Clone({...prev, proficiencies}));
	const setProficiencyChoices = (proficiencyChoices: Choice<string>[]) => setCurrentClass((prev)=>Clone({...prev, proficiencyChoices}));
	const setSavingThrows = (savingThrows: string[]) => setCurrentClass((prev)=>Clone({...prev, savingThrows}));
	const setStartingEquipment = (startingEquipment: StartingEquipment) => setCurrentClass((prev)=>Clone({...prev, startingEquipment}));
	const setStartingEquipChoice = (choiceNum: number, choice: Choice<Item>[]) => {setCurrentClass((prev)=>Clone({...prev, 
		startingEquipment: {...prev.startingEquipment, [`choice${choiceNum}`]: choice}
	}))};

	const setClassLevels = (classLevels: LevelEntity[]) => setCurrentClass((prev)=>Clone({...prev, classLevels}));
	const setSubclasses = (subclasses: Subclass[]) => setCurrentClass((prev)=>Clone({...prev, subclasses}));
	const setSubclassLevels = (subclassLevels: number[]) => setCurrentClass((prev)=>Clone({...prev, subclassLevels}));
	// - spellcasting
	const setSpellcastingName = (name: string) => setCurrentClass((prev)=>Clone({...prev,
		spellcasting: {...prev?.spellcasting, name}
	} as DnDClass));
	const setSpellKnown = (known: SpellsKnown, roundUp: boolean = false) => setCurrentClass((prev)=>Clone({...prev, 
		spellcasting: {...prev?.spellcasting, spellsKnownCalc: SpellsKnown[known], spellsKnownRoundup: roundUp}
	} as DnDClass));
	const setSpellCastingAbility = (ability: CastingStat) => setCurrentClass((prev)=>Clone({...prev, 
		spellcasting: {...prev?.spellcasting , spellcastingAbility: CastingStat[ability]}
	} as DnDClass));
	const setSpellCasterType = (casterType: string) => setCurrentClass((prev)=>Clone({...prev, 
		spellcasting: {...prev?.spellcasting, casterType}
	} as DnDClass));
	const setSpellCastingInfo = (info: Description[]) => setCurrentClass((prev)=>Clone({...prev, 
		spellcasting: {...prev?.spellcasting, info}
	} as DnDClass));

	
	// --- functions
	const addClassSpecific = (level: number, feature: string) => {
		const newClassLevels = classLevels().map((x, i)=>i === level ? {...x, classSpecific: {...x.classSpecific, [feature]: feature}} : x);
		setClassLevels(newClassLevels);
	};
	const removeClassSpecific = (level: number, feature: string) => {
		const newClassLevels: LevelEntity[] = classLevels().map((x, i)=>{
			if (i === level) {
				const newClassSpecific = {...x.classSpecific};
				delete newClassSpecific[feature];
				return {...x, classSpecific: newClassSpecific};
			}
			return x;
		});
		setClassLevels(newClassLevels);
	};
	const addFeature = (
		level: number, 
		feature: Feature<unknown, string> = {
			name: `Feature ${Math.floor(Math.random() * 10) * Math.ceil(Math.random() * 10)}`, 
			value: "a value", 
			info: {
				className: "",
				subclassName: "",
				level,
				type: "",
				other: ""
			}
		}
	) => {
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
    return getSpellSlots(level, slotLevel, casterType());
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
		setCurrentClass((prev)=>({...prev, 
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
		}) as DnDClass);
	}
	function setSpellsKnown(level: number, known: number) {
		const newClassLevels = currentClass().classLevels.map((x, i)=>i === level - 1 ? {...x, spellcasting: {...x.spellcasting, spells_known: known}} : x);
		setClassLevels(newClassLevels);
	}
	
	function clearSpellSlots() {
		setCurrentClass((old)=>({...old,
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
		console.log("CurrentClass: ", currentClass());
	});
	createEffect(()=>{
		const currentColumns = ["level", "proficiency", "features"];
		
		switch (casterType()) {
			case "full":
				const typ = untrack(clearSpellSlots);
				if (!!typ) {
					currentColumns.push(...[typ, "cantrip", "level-1", "level-2", "level-3", "level-4", "level-5", "level-6", "level-7", "level-8", "level-9"]);
				} else {
					currentColumns.push(...["cantrip", "level-1", "level-2", "level-3", "level-4", "level-5", "level-6", "level-7", "level-8", "level-9"]);
				}
				setCurrentColumns(currentColumns);
				setSpellSlots("full");
				break;
			case "half":
				const typ2 = untrack(clearSpellSlots);
				if (!!typ2) {
					currentColumns.push(...[typ2, "cantrip", "level-1", "level-2", "level-3", "level-4", "level-5"]);
				} else {
					currentColumns.push(...["cantrip", "level-1", "level-2", "level-3", "level-4", "level-5"]);
				}
				setCurrentColumns(currentColumns);
				setSpellSlots("half");
				break;
			case "third":
				const typ3 = untrack(clearSpellSlots);
				if (!!typ3) {
					currentColumns.push(...[typ3, "cantrip", "level-1", "level-2", "level-3", "level-4"]);
				} else {
					currentColumns.push(...["cantrip", "level-1", "level-2", "level-3", "level-4"]);
				}
				setCurrentColumns(currentColumns);
				setSpellSlots("third");
				break;
			case "other":
					if (spellCalc() === 'Other') {
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


// ----------------- JSX -----------------
  return (
    <>
      <Body>
        <div>
					<h1>Classes Homebrewing</h1>
					<div class={`${styles.rowOne}`}>
						<span>
							<FormField class={`${styles.fieldStyle}`} name="Class Name">
								<Input transparent value={currentClass().name} onChange={(e)=>setName(e.currentTarget.value)} />
							</FormField>
						</span>
						<span class={`${styles.selectSpan}`}>
							<label for="hitDie">Hit Die</label>
							<Select id="hitDie" transparent value={currentClass().hitDie} onChange={(e)=>{
								setHitDie(+e.currentTarget.value);
							}} disableUnselected>
								<For each={[4,6,8,10,12]}>{(die)=>(
									<Option value={die}>{die}</Option>
								)}</For>
							</Select>
						</span>
						<span  class={`${styles.selectSpan}`}>
							<label for="casterType">Caster Type</label>
							<Select tooltip="Caster Type" transparent  
								value={casterType()} 
								onChange={(e)=>{setCasterType(e.currentTarget.value);}} >
								<For each={["full", "half", "third", "other"]}>{(x)=>(
									<Option value={x}>{`${x[0].toUpperCase()}${x.slice(1)}`}</Option>
								)}</For>
							</Select>
						</span>
						<Show when={!!casterType()}>
							<span class={`${styles.selectSpan}`}>
								<label>Casting Stat</label>
								<Select disableUnselected transparent 
									value={currentClass().spellcasting?.spellcastingAbility ?? ""} 
									onSelect={(e)=>setSpellCastingAbility(+e.currentTarget.value)}> 
									<For each={[1,2,3]}>{(x)=><>
										<Option value={x}>{CastingStat[x]}</Option>
									</>}</For>
								</Select>
							</span>
						</Show>
						<Show when={!!casterType()}>
							<span class={`${styles.selectSpan}`}>
								<label>Spells Known</label>
								<Input type="checkbox"
									tooltip="Round up spells known?"
									style={{"margin": "0px", 'margin-left': '10px'}} 
									checked={currentClass().spellcasting?.spellsKnownRoundup ?? false} 
									onChange={(e)=>{
										const casterType = currentClass().spellcasting?.casterType as keyof typeof SpellsKnown;
										if (!!casterType) {
											const num = +SpellsKnown[casterType] as number;
											setSpellKnown(num, e.currentTarget.checked);
										}
									}}/>
								<Select disableUnselected transparent
									value={currentClass().spellcasting?.casterType ?? ''}
									onChange={(e)=>setSpellKnown(+e.currentTarget.value)}>
									<For each={[1,2,3,4,5,6]}>{(x)=><>
										<Option value={x}>{SpellsKnown[x]}</Option>
									</>}</For>
								</Select>
							</span>
						</Show>
					</div>
					<div class={`${styles.twoRowContainer}`}>
						<Proficiency setSaves={setSavingThrows} setProficiencies={setProficiencies} currentClass={currentClass()} />
							<StartEquipment currentClass={currentClass()}  setStartEquipChoice={setStartingEquipChoice}/>
					</div>
					<div class={`${styles.twoRowContainer}`}>
						<div class={`${styles.twoRowContainer}`}>
							<Table class={`${styles.wholeTable}`} data={()=>currentClass().classLevels} columns={currentColumns()}>
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
											<Button onClick={(e)=>addFeature(x.level)}>+</Button>
											<For each={x?.features}>{(entry)=>{
												return <Chip key={`${entry.info.level} `} value={entry.name} remove={()=>removeFeature(entry.info.level, entry.name)} />
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
						</div>
					</div>
				</div>
      </Body>
    </>
  );
};
export default Classes;
