import { Component, createMemo, createSignal, For } from "solid-js";
import styles from '../classes.module.scss';
import { Choice } from "../../../../../../models/core.model";
import { Button, Chip, Input, Option, Select } from "../../../../../../shared";
import FormField from "../../../../../../shared/components/FormField/formField";
import { DnDClass } from "../../../../../../models";
import Chipbar from "../../../../../../shared/components/Chipbar/chipbar";
import type Chiptype from "../../../../../../shared/models/chip";
interface Props {
	currentClass: DnDClass;
	setProficiencies: (proficiencies: string[]) => void;
	setSaves: (stats: string[]) => void;
}

const Proficiency: Component<Props> = (props) => {
	const armorTypes = getArmorTypes();
	const weaponTypes = getWeaponTypes();
	const statProficiencies = getStatProficiencies();
	const tools = getTools();
	const skills = getSkills();

	const currentArmor = ()=>props.currentClass.proficiencies.filter((prof) => armorTypes.map(x=>x.toLowerCase()).includes(prof.toLowerCase()));
	const currentWeapons = ()=>props.currentClass.proficiencies.filter((prof) => weaponTypes.map(x=>x.toLowerCase()).includes(prof.toLowerCase()));
	const currentTools = ()=>props.currentClass.proficiencies.filter((prof) => tools.map(x=>x.toLowerCase()).includes(prof.toLowerCase()));
	const currentSkills = ()=>props.currentClass.proficiencies.filter((prof) => skills.map(x=>x.toLowerCase()).includes(prof.toLowerCase()));
	const defaultChip = (items: string[]) => !!items.length ? items : ["None"];
	
	return (
		<div class={styles.rowTwo}>
			<h2>Proficiencies</h2>
			<div  class={`${styles.allProficiency}`}>
				<div class={`${styles.singleProficiency}`}>
					<h3>Armor<Button>+</Button></h3>
					<span>
						<For each={defaultChip(currentArmor())}>
							{(prof) => <Chip key="Armor" value={prof} />}
						</For>
					</span>
				</div>
				<div class={`${styles.singleProficiency}`}>
					<h3>Weapons
						<Button>+</Button>
					</h3>
					<span>
						<For each={defaultChip(currentWeapons())}>
							{(prof) => <Chip key="Weapon" value={prof} />}
						</For>
					</span>
				</div>
				<div class={`${styles.singleProficiency}`}>
					<h3>Tools
						<Button>+</Button>
					</h3>
					<span>
						<For each={defaultChip(currentTools())}>
							{(prof) => <Chip key="Tool" value={prof} />}
						</For>
					</span>
				</div>
				<div class={`${styles.singleProficiency}`}>
					<h3>Saving Throws
						<Button>+</Button>
					</h3>
					<span>
						<For each={defaultChip(props.currentClass.savingThrows)}>
							{(prof) => <Chip key="Saving Throw" value={prof} />}
						</For>
					</span>
				</div>
				<div class={`${styles.singleProficiency}`}>
					<h3>Skills
						<Button>+</Button>
					</h3>
					<span>
						<For each={defaultChip(currentSkills())}>
							{(prof) => <Chip key="Skill" value={prof} />}
						</For>
					</span>
				</div>

			</div>
		</div>
	);
}
export default Proficiency;

const getArmorTypes = ()=>{
	return ["Light", "Medium", "Heavy", "Shields"];
};
const getWeaponTypes = ()=>{
	return ["Simple", "Martial"];
};
const getStatProficiencies = ()=>{
	return ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
}
const getSkills = ()=>{
	return ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"];
}
const getTools = ()=>{
	return ["Artisan's Tools", "Disguise Kit", "Forgery Kit", "Gaming Set", "Herbalism Kit", "Musical Instrument", "Navigator's Tools", "Poisoner's Kit", "Thieves' Tools", "Vehicles (Land)", "Vehicles (Water)"];
}