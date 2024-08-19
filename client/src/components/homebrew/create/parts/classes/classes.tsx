import {
  Accessor,
  Component,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
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
	Clone
} from "../../../../../shared/";
import type { DnDClass } from "../../../../../models";
import { LevelEntity, Subclass } from "../../../../../models/class.model";
import {
  Choice,
  StartingEquipment,
  Feature,
  Item,
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

const Classes: Component = () => {
  const [searchParam, setSearchParam] = useSearchParams();
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
	});
	const setName = (name: string) => setCurrentClass((prev)=>({...prev, name}));
	const setHitDie = (hitDie: number) => setCurrentClass((prev)=>({...prev, hitDie}));
	const setProficiencies = (proficiencies: string[]) => setCurrentClass((prev)=>({...prev, proficiencies}));
	const setProficiencyChoices = (proficiencyChoices: Choice<string>[]) => setCurrentClass((prev)=>({...prev, proficiencyChoices}));
	const setSavingThrows = (savingThrows: string[]) => setCurrentClass((prev)=>({...prev, savingThrows}));
	const setStartingEquipment = (startingEquipment: StartingEquipment) => setCurrentClass((prev)=>({...prev, startingEquipment}));
	const setStartingEquipChoice = (choiceNum: number, choice: Choice<Item>[]) => {setCurrentClass((prev)=>({...prev, 
		startingEquipment: {...prev.startingEquipment, [`choice${choiceNum}`]: choice}
	}))};

	const setClassLevels = (classLevels: LevelEntity[]) => setCurrentClass((prev)=>Clone({...prev, classLevels}));
	const setSubclasses = (subclasses: Subclass[]) => setCurrentClass((prev)=>Clone({...prev, subclasses}));
	const setSubclassLevels = (subclassLevels: number[]) => setCurrentClass((prev)=>Clone({...prev, subclassLevels}));
	const [userSettings, setUserSettings] = getUserSettings();
	const themeStyle = createMemo(()=>useStyle(userSettings().theme));
	const sharedHooks = useContext(SharedHookContext);
	const [currentColumns, setCurrentColumns] = createSignal<string[]>(["level", "proficiency", "options", "features"]);
	const [levels, setLevels] = createSignal<number[]>(Array.from({length: 20}, (_, i)=>i+1));

	const addClassSpecific = (level: number, feature: string) => {
		const newClassLevels = currentClass().classLevels.map((x, i)=>i === level ? {...x, classSpecific: {...x.classSpecific, [feature]: feature}} : x);
		setClassLevels(newClassLevels);
	};
	const removeClassSpecific = (level: number, feature: string) => {
		const newClassLevels: LevelEntity[] = currentClass().classLevels.map((x, i)=>{
			if (i === level) {
				const newClassSpecific = {...x.classSpecific};
				delete newClassSpecific[feature];
				return {...x, classSpecific: newClassSpecific};
			}
			return x;
		});
		setClassLevels(newClassLevels);
	};
	const addFeature = (level: number, feature?: Feature<unknown, string>) => {
		if (!feature) {
			feature = {name: `Feature ${Math.floor(Math.random() * 10) * Math.ceil(Math.random() * 10)}`, value: "a value", info: {
				className: "",
				subclassName: "",
				level,
				type: "",
				other: ""
			}};
		}
		const newFeatures = currentClass().classLevels[(level - 1)].features;
		newFeatures.push(feature);
		const newClass = {...currentClass()};
		newClass.classLevels[(level - 1)].features = newFeatures;
		setCurrentClass(newClass);
	};
	const removeFeature = (level: number, name: string) => {
		const newFeatures = currentClass().classLevels[(level - 1)].features.filter((x)=>x.name !== name);
		const newClass = {...currentClass()};
		newClass.classLevels[(level - 1)].features = newFeatures;
		setCurrentClass(newClass);
	};
	const getFeatureChips = (i:number)=>Object.entries((currentClass().classLevels[i]?.classSpecific));
	createEffect(()=>{
		console.log("CurrentClass: ", currentClass());
	});
	const [tableData, setTableData] = createSignal(currentClass().classLevels);
	
	createEffect(()=>{
		setTableData(Clone(currentClass().classLevels));
		console.log("TableData: ", tableData());
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
								<Input transparent={true} value={currentClass().name} onChange={(e)=>setName(e.currentTarget.value)} />
							</FormField>
						</span>
						<span class={`${styles.selectSpan}`}>
							<label for="hitDie">Hit Die</label>
							<Select id="hitDie" transparent={true} value={currentClass().hitDie} onChange={(e)=>{
								setHitDie(+e.currentTarget.value);
							}} disableUnselected>
								<For each={[4,6,8,10,12]}>{(die)=>(
									<Option value={die}>{die}</Option>
								)}</For>
							</Select>
						</span>
					</div>
					<div class={`${styles.twoRowContainer}`}>
						<Proficiency setSaves={setSavingThrows} setProficiencies={setProficiencies} currentClass={currentClass()} />
							<StartEquipment currentClass={currentClass()}  setStartEquipChoice={setStartingEquipChoice}/>
					</div>
					<div class={`${styles.twoRowContainer}`}>
						<div class={`${styles.twoRowContainer}`}>
							<Table class={`${styles.wholeTable}`} data={tableData} columns={currentColumns()}>
								<Column name="proficiency">
									<Header class={`${styles.headerStyle}`}>P.B.</Header>
									<Cell<LevelEntity> class={`${styles.cellStyle}`}>{(x)=>`+${x.profBonus}`}</Cell>
								</Column>
								<Column name="level">
									<Header class={`${styles.headerStyle}`}>Level</Header>
									<Cell<LevelEntity> class={`${styles.cellStyle}`}>{(x)=>x.level}</Cell>
								</Column>
								<Column name="features">
									<Header class={`${styles.headerStyle}`}>Features</Header>
									<Cell<LevelEntity> class={`${styles.tableFeature}`}>{(x, i)=>{
										return <>
											<Show when={!!x.features?.length}>
												<Button onClick={(e)=>addFeature(x.level)}>+</Button>
												<For each={x?.features}>{(entry)=>{
													return <Chip key={`${entry.info.level} `} value={entry.name} remove={()=>removeFeature(entry.info.level, entry.name)} />
												}}</For>
											</Show>
											<Show when={!!!x.features?.length}>
												<Button onClick={(e)=>addFeature(x.level)}>+</Button>
											</Show>
										</>;
									}}</Cell>
								</Column>
								<Row class={`${styles.rowStyle}`}/>
								<SecondRow<LevelEntity>>{(level, i)=>(
									<div class={`${styles.levelSecondRow}`}>
										<strong>Features: </strong>
											
									</div>
								)}</SecondRow>
							</Table>
						</div>
					</div>
				</div>
      </Body>
    </>
  );
};
export default Classes;
