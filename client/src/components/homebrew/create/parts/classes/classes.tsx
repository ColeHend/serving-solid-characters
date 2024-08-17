import {
  Accessor,
  Component,
  For,
  Show,
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
  Body
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
import { effect } from "solid-js/web";
import { SpellsKnown } from "../subclasses/subclasses";
import { useSearchParams } from "@solidjs/router";
import { SharedHookContext } from "../../../../rootApp";
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
		classLevels: [],
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

	const setClassLevels = (classLevels: LevelEntity[]) => setCurrentClass((prev)=>({...prev, classLevels}));
	const setFeatures = (features: Feature<unknown, string>[]) => setCurrentClass((prev)=>({...prev, features}));
	const setSubclasses = (subclasses: Subclass[]) => setCurrentClass((prev)=>({...prev, subclasses}));
	const setSubclassLevels = (subclassLevels: number[]) => setCurrentClass((prev)=>({...prev, subclassLevels}));
	const [userSettings, setUserSettings] = getUserSettings();
	const themeStyle = createMemo(()=>useStyle(userSettings().theme));
	const sharedHooks = useContext(SharedHookContext);


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
						
					</div>
				</div>
      </Body>
    </>
  );
};
export default Classes;
