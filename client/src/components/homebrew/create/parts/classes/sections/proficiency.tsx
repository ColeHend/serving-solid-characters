import { Component, createEffect, createMemo, createSignal, For, Show } from "solid-js";
import styles from '../classes.module.scss';
import { Button, Chip, Input, Option, Select, useDnDItems, Weapon, Armor, Item, useGetItems } from "../../../../../../shared";
import { DnDClass } from "../../../../../../models";
import Modal from "../../../../../../shared/components/popup/popup.component";
interface Props {
	currentClass: DnDClass;
	setProficiencies: (proficiencies: string[]) => void;
	setSaves: (stats: string[]) => void;
}

const Proficiency: Component<Props> = (props) => {
  const allItems = useGetItems();
  const allWeapons = createMemo(()=>allItems().filter((item)=>item.equipmentCategory === "Weapon") as Weapon[]);
  const allArmor = createMemo(()=>allItems().filter((item)=>item.equipmentCategory === "Armor") as Armor[]);
  const allTools = createMemo(()=>allItems().filter((item)=>item.equipmentCategory === "Tools") as Item[]);
	
  const armorTypes = getArmorTypes();
  const weaponTypes = getWeaponTypes();
  const statProficiencies = getStatProficiencies();
  const skills = getSkills();

  const currentArmor = ()=>props.currentClass.proficiencies.filter((prof) => {
    const allArmorTypes = armorTypes.map(x=>x.toLowerCase().trim());
    const allArmors = allArmor().map(x=>x.name.toLowerCase().trim());
    const proficent = prof.replace("Armor", "").replace("armor", "").toLowerCase().trim();
	
    const armorGeneral = allArmorTypes.includes(proficent);
    const armorSpecific = allArmors.includes(proficent);
		
    return armorGeneral || armorSpecific;
  });
  const currentWeapons = ()=>props.currentClass.proficiencies.filter((prof) => {
    const proficient = prof.replace("Weapons", "").replace("weapons", "").replace("weapon", "").replace("Weapon", "").toLowerCase().trim();
		
    const weaponGeneral = weaponTypes.map(x=>x.toLowerCase()).includes(proficient);
    const weaponSpecific = allWeapons().map(x=>x.name.toLowerCase()).includes(proficient);
    return weaponGeneral || weaponSpecific;
  });
  const currentTools = ()=>props.currentClass.proficiencies.filter((prof) => allTools().map(x=>x.name.toLowerCase()).includes(prof.toLowerCase()));
  const currentSkills = ()=>props.currentClass.proficiencies.filter((prof) => skills.map(x=>x.toLowerCase()).includes(prof.toLowerCase()));
  const defaultChip = (items: string[]) => items.length ? items : ["None"];
  const [showWeapon, setShowWeapon] = createSignal(false);
  const [selectedGeneralWeapon, setSelectedGeneralWeapon] = createSignal("Simple");
  const [selectedSpecificWeapon, setSelectedSpecificWeapon] = createSignal("");
  const [showArmor, setShowArmor] = createSignal(false);
  const [selectedGeneralArmor, setSelectedGeneralArmor] = createSignal("Light");
  const [selectedSpecificArmor, setSelectedSpecificArmor] = createSignal("");
  const [showTool, setShowTool] = createSignal(false);
  const [selectedTool, setSelectedTool] = createSignal("");
  const [showStat, setShowStat] = createSignal(false);
  const [selectedStat, setSelectedStat] = createSignal("");
  const [showSkill, setShowSkill] = createSignal(false);
  const [selectedSkill, setSelectedSkill] = createSignal("");

  return (
    <div class={styles.rowTwo}>
      <h2>Proficiencies</h2>
      <div  class={`${styles.allProficiency}`}>
        <div class={`${styles.singleProficiency}`}>
          <h3>Armor<Button onClick={(e)=>setShowArmor(old=>!old)}>+</Button></h3>
          <Show when={showArmor()}>
            <Modal backgroundClick={[showArmor, setShowArmor]} title="Add Armor">
              <div>
                <div><h3>General</h3></div>
                <div>
                  <Select transparent disableUnselected value={selectedGeneralArmor()} onChange={(e)=>{
                    setSelectedGeneralArmor(e.target.value);
                  }} >
                    <For each={armorTypes}>
                      {(type) => <Option value={type} >{type}</Option>}
                    </For>
                  </Select>
                  <Button onClick={(e)=>{
                    props.setProficiencies([...props.currentClass.proficiencies, selectedGeneralArmor()].filter(x=>!!x));
                  }}>Add</Button>
                </div>
                <div><h3>Specific</h3></div>
                <div>
                  <Select transparent value={selectedSpecificArmor()} onChange={(e)=>{
                    setSelectedSpecificArmor(e.target.value);
                  }} >
                    <For each={allArmor()}>
                      {(armor) => <Option value={armor.name} >{armor.name}</Option>}
                    </For>
                  </Select>
                  <Button onClick={(e)=>{
                    props.setProficiencies([...props.currentClass.proficiencies, selectedSpecificArmor()].filter(x=>!!x));
                  }}>Add</Button>
                </div>
              </div>
            </Modal>
          </Show>
          <span>
            <For each={defaultChip(currentArmor())}>
              {(prof) => <Chip key="Armor" value={prof} remove={()=>{
                props.setProficiencies(props.currentClass.proficiencies.filter((x)=>x!==prof));
              }}/>}
            </For>
          </span>
        </div>
        <div class={`${styles.singleProficiency}`}>
          <h3>Weapons
            <Button onClick={(e)=>{
              setShowWeapon(old=>!old);
            }}>+</Button>
          </h3>
          <Show when={showWeapon()}>
            <Modal backgroundClick={[showWeapon, setShowWeapon]} title="Add Weapon">
              <div>
                <div><h3>General</h3></div>
                <div>
                  <Select transparent disableUnselected value={selectedGeneralWeapon()} onChange={(e)=>{
                    setSelectedGeneralWeapon(e.target.value);
                  }} >
                    <For each={weaponTypes}>
                      {(type) => <Option value={type} >{type}</Option>}
                    </For>
                  </Select>
                  <Button onClick={(e)=>{
                    props.setProficiencies([...props.currentClass.proficiencies, selectedGeneralWeapon()].filter(x=>!!x));
                  }}>Add</Button>
                </div>
                <div><h3>Specific</h3></div>
                <div>
                  <Select transparent value={selectedSpecificWeapon()} onChange={(e)=>{
                    setSelectedSpecificWeapon(e.target.value);
                  }} >
                    <For each={allWeapons()}>
                      {(weapon) => <Option value={weapon.name} >{weapon.name}</Option>}
                    </For>
                  </Select>
                  <Button onClick={(e)=>{
                    const selected = selectedSpecificWeapon();
                    const newWeapon = selected ? selected : allWeapons()[0].name;
                    props.setProficiencies([...props.currentClass.proficiencies, newWeapon].filter(x=>!!x));
                  }}>Add</Button>
                </div>
              </div>
            </Modal>
          </Show>
          <span>
            <For each={defaultChip(currentWeapons())}>
              {(prof) => <Chip key="Weapon" value={prof} remove={()=>{
                props.setProficiencies(props.currentClass.proficiencies.filter((x)=>x!==prof));
              }}/>}
            </For>
          </span>
        </div>
        <div class={`${styles.singleProficiency}`}>
          <h3>Tools
            <Button onClick={(e)=>{
              setShowTool(old=>!old);
            }}>+</Button>
          </h3>
          <Show when={showTool()}>
            <Modal backgroundClick={[showTool, setShowTool]} title="Add Tool">
              <div>
                <div>
                  <Select transparent value={selectedTool()} onChange={(e)=>{
                    setSelectedTool(e.target.value);
                  }} >
                    <For each={allTools()}>
                      {(tool) => <Option value={tool.name} >{tool.name}</Option>}
                    </For>
                  </Select>
                  <Button onClick={(e)=>{
                    props.setProficiencies([...props.currentClass.proficiencies, selectedTool()].filter(x=>!!x));
                  }}>Add</Button>
                </div>
              </div>
            </Modal>
          </Show>
          <span>
            <For each={defaultChip(currentTools())}>
              {(prof) => <Chip key="Tool" value={prof} remove={()=>{
                props.setProficiencies(props.currentClass.proficiencies.filter((x)=>x!==prof));
              }} />}
            </For>
          </span>
        </div>
        <div class={`${styles.singleProficiency}`}>
          <h3>Saving Throws
            <Button onClick={(e)=>{
              setShowStat(old=>!old);
            }}>+</Button>
          </h3>
          <Show when={showStat()}>
            <Modal backgroundClick={[showStat, setShowStat]} title="Add Stat">
              <div>
                <div>
                  <Select transparent value={selectedStat()} onChange={(e)=>{
                    setSelectedStat(e.target.value);
                  }} >
                    <For each={statProficiencies}>
                      {(stat) => <Option value={stat} >{stat}</Option>}
                    </For>
                  </Select>
                  <Button onClick={(e)=>{
                    props.setSaves([...props.currentClass.savingThrows, selectedStat()].filter(x=>!!x));
                  }}>Add</Button>
                </div>
              </div>
            </Modal>
          </Show>
          <span>
            <For each={defaultChip(props.currentClass.savingThrows)}>
              {(prof) => <Chip key="Saving Throw" value={prof} remove={()=>{
                props.setSaves(props.currentClass.savingThrows.filter((x)=>x!==prof));
              }} />}
            </For>
          </span>
        </div>
        <div class={`${styles.singleProficiency}`}>
          <h3>Skills
            <Button onClick={(e)=>{
              setShowSkill(old=>!old);
            }}>+</Button>
          </h3>
          <Show when={showSkill()}>
            <Modal backgroundClick={[showSkill, setShowSkill]} title="Add Skill">
              <div>
                <div>
                  <Select transparent value={selectedSkill()} onChange={(e)=>{
                    setSelectedSkill(e.target.value);
                  }} >
                    <For each={skills}>
                      {(skill) => <Option value={skill} >{skill}</Option>}
                    </For>
                  </Select>
                  <Button onClick={(e)=>{
                    props.setProficiencies([...props.currentClass.proficiencies, selectedSkill()].filter(x=>!!x));
                  }}>Add</Button>
                </div>
              </div>
            </Modal>
          </Show>
          <span>
            <For each={defaultChip(currentSkills())}>
              {(prof) => <Chip key="Skill" value={prof} remove={()=>{
                props.setProficiencies(props.currentClass.proficiencies.filter((x)=>x!==prof));
              }}/>}
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