import { Component, For, createSignal, useContext, createMemo, Show } from "solid-js";
import styles from './spells.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { SharedHookContext } from "../../../../rootApp";
import FormField from "../../../../../shared/components/FormField/formField";
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
	getAddNumberAccent,
	UniqueSet,
	TextArea
} from "../../../../../shared/";
import useGetSpells from "../../../../../shared/customHooks/data/useGetSpells";
import { createStore } from "solid-js/store";
import { range } from "rxjs";
const Spells: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyle(userSettings().theme));
		const spellLevels = Array.from({length: 10}, (_, i) => i);
		const allSpells = useGetSpells();
		const [showCustoms, setShowCustoms] = createStore<{[key:string]:boolean}>({
			castingTime: false,
			range: false,
		});
		const [spellDesc, setSpellDesc] = createSignal("");

		const getSchools = ()=>{
			const schools = new UniqueSet<string>();
			allSpells().forEach(spell=>schools.add(spell.school));
			return schools.value.sort()
		};
		const getCastingTimes = ()=>{
			const castingTimes = new UniqueSet<string>();
			allSpells().forEach(spell=>castingTimes.add(spell.castingTime));
			return castingTimes.value.sort()
		};
		const getRanges = ()=>{
			const ranges = new UniqueSet<string>();
			allSpells().forEach(spell=>ranges.add(spell.range));
			return ranges.value.sort()
		}
		const getDurations = ()=>{
			const durations = new UniqueSet<string>();
			allSpells().forEach(spell=>durations.add(spell.duration));
			return durations.value.sort()
		}
		
    return (
        <>
            <Body>
                <h1></h1>
                <p>
									<FormField class={`${styles.smallField}`} name="Spell Name">
										<Input transparent />
									</FormField>
								</p>
                <p>
									<Select class={`${styles.border}`} transparent>
										<For each={spellLevels}>{(slotLevel)=>
											<Option value={slotLevel} >
												{getAddNumberAccent(slotLevel)}
											</Option>
										}</For>
									</Select>
								</p>
                <p>
									<Select class={`${styles.border}`} transparent>
										<For each={getSchools()}>{(school)=>
											<Option value={school} >
												{school}
											</Option>
										}</For>
									</Select>
								</p>
                <p>
									<label >Custom</label>
									<Input type="checkbox" tooltip="Custom Input?" 
										onClick={(e)=>setShowCustoms({"castingTime": e.currentTarget.checked})} 
										checked={showCustoms["castingTime"]} />
									<Show when={!showCustoms["castingTime"]}>
										<Select class={`${styles.border}`} transparent>
											<For each={getCastingTimes()}>{(castingTime)=>
												<Option value={castingTime} >
													{castingTime}
												</Option>
											}</For>
										</Select>
									</Show>
									<Show when={showCustoms["castingTime"]}>
									<FormField class={`${styles.smallField}`} name="Casting Time">
											<Input transparent />
										</FormField>
									</Show>
								</p>
                <p>
								<label >Custom</label>
									<Input type="checkbox" tooltip="Custom Input?" 
										onClick={(e)=>setShowCustoms({"range": e.currentTarget.checked})} 
										checked={showCustoms["range"]} />
									<Show when={!showCustoms["range"]}>
										<Select class={`${styles.border}`} transparent>
											<For each={getRanges()}>{(range)=>
												<Option value={range} >
													{range}
												</Option>
											}</For>
										</Select>
									</Show>
									<Show when={showCustoms["range"]}>
										<FormField class={`${styles.smallField}`} name="Range">
											<Input transparent />
										</FormField>
									</Show>
								</p>
                <p>
									<label for="hasVerbal">has Verbal?</label>
									<Input id="hasVerbal" type="checkbox" />
									<label for="hasSomatic">has Somatic?</label>
									<Input id="hasSomatic" type="checkbox" />
									<label for="hasMaterial">has Material?</label>
									<Input checked={showCustoms['hasMaterial']} 
										onclick={(e)=>setShowCustoms({"hasMaterial": e.currentTarget.checked})} 
										id="hasMaterial" type="checkbox" />
								</p>
								<Show when={showCustoms['hasMaterial']}>
									<div>
										<FormField class={`${styles.smallField}`} name="Material Components">
											<Input transparent />
										</FormField>
									</div>
								</Show>
                <p>
									<label >Custom</label>
									<Input type="checkbox" tooltip="Custom Input?" 
										onClick={(e)=>setShowCustoms({"duration": e.currentTarget.checked})} 
										checked={showCustoms["duration"]} />
									<label for="isConcentration">isConcentration?</label>
									<Input id="isConcentration" type="checkbox" tooltip="Custom Input?" 
										onClick={(e)=>setShowCustoms({"isConcentration": e.currentTarget.checked})} 
										checked={showCustoms["isConcentration"]} />
									<Show when={!showCustoms["duration"]}>
										<Select class={`${styles.border}`} transparent>
											<For each={getDurations().filter((val)=> showCustoms["isConcentration"] ? val.toLowerCase().includes("concentration") : !val.toLowerCase().includes("concentration"))}>{(duration)=>
												<Option value={duration} >
													{duration}
												</Option>
											}</For>
										</Select>
									</Show>
									<Show when={showCustoms["duration"]}>
										<FormField class={`${styles.smallField}`} name="Duration">
											<Input transparent />
										</FormField>
									</Show>
								</p>
                <p>
									<FormField name="Description">
										<TextArea transparent={true} text={spellDesc} setText={setSpellDesc} picToTextEnabled={true} />
									</FormField>
								</p>
                <p>classes list</p>
            </Body>
        </>
    );
}
export default Spells;