import { Component, createSignal, For, Setter } from "solid-js";
import styles from "./classes.module.scss";
import { useGetArmor, useGetItems, useGetWeapons } from "../../../../../shared";
import { Stat } from "../../../../../shared/models/stats";
import { Button, Chipbar, ChipType, FormField, FormGroup, Icon, Input, Modal, Option, Select } from "coles-solid-library";
import { ClassForm, ProfStore } from "./classes";

interface ProficienciesProps {
  formGroup: FormGroup<ClassForm>;
  setProfStore: Setter<ProfStore>;
}
export const Proficiencies: Component<ProficienciesProps> = (props) => {
  const [showEquipTable, setShowEquipTable] = createSignal<boolean>(false);
  const armorChips = () => {
    const currentArmor = props.formGroup.get("armorProficiencies") as string[];
    return currentArmor.map((armor) => ({ key: "Armor", value: armor } as ChipType));
  };
  const setArmorChips: Setter<ChipType[]> = (chips) => {
    const prev = props.formGroup.get("armorProficiencies") as string[];
    if (typeof chips === "function") {
      const val1 = chips(prev.map(x=>({key:"Armor", value: x}))).map((chip) => chip.value);
      props.formGroup.set("armorProficiencies", val1);

    }
    else {
      props.formGroup.set("armorProficiencies", chips.map((chip) => chip.value));

    }
  };
  const weaponChips = () => {
    const currentWeapons = props.formGroup.get("weaponProficiencies") as string[];
    return currentWeapons.map((weapon) => ({ key: "Weapon", value: weapon } as ChipType));
  };
  const setWeaponChips: Setter<ChipType[]> = (chips) => {
    const prev = props.formGroup.get("weaponProficiencies") as string[];
    if (typeof chips === "function") {
      const value = chips(prev.map(x=>({key:"Weapon", value: x}))).map((chip) => chip.value);
      props.formGroup.set("weaponProficiencies", value);

    }
    else {
      props.formGroup.set("weaponProficiencies", chips.map((chip) => chip.value));

    }
  };
  const toolChips = () => {
    const currentTools = props.formGroup.get("toolProficiencies") as string[];
    return currentTools.map((tool) => ({ key: "Tool", value: tool } as ChipType));
  };
  const setToolChips: Setter<ChipType[]> = (chips) => {
    const prev = props.formGroup.get("toolProficiencies") as string[];
    if (typeof chips === "function") {
      const value = chips(prev.map(x=>({key:"Tool", value: x}))).map((chip) => chip.value);
      props.formGroup.set("toolProficiencies", value);

    } else {
      props.formGroup.set("toolProficiencies", chips.map((chip) => chip.value));

    }
  };
  const allItems = useGetItems();
  const [selectedItems, setSelectedItems] = createSignal<string[]>([]);
  const allWeapons = useGetWeapons();
  const [selectedWeapons, setSelectedWeapons] = createSignal<string[]>([]);
  const allArmor = useGetArmor();
  const [selectedArmor, setSelectedArmor] = createSignal<string[]>([]);
  return (
    <div class={`${styles.classSection}`}>
      <div>
        Proficiencies
      </div>
      <div>
        <div>
          <div>Armor</div>
          <div>
            <span class={styles.lineUp}>
              <Button onClick={()=>{
                const currentArmor = props.formGroup.get("armorProficiencies") as string[];
                props.formGroup.set("armorProficiencies", [...currentArmor, ...selectedArmor()]);
                setSelectedArmor([]);
                props.setProfStore((prev) => ({ ...prev, armor: [...prev.armor || [], ...selectedArmor()] }));
              }}><Icon name="add" /></Button>
              <Select multiple value={selectedArmor()} onChange={setSelectedArmor}>
                <Option value="Light">Light</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Heavy">Heavy</Option>
                <Option value="Shields">Shields</Option>
                <For each={allArmor()}>
                  {(armor) => <Option value={armor.name}>{armor.name}</Option>}
                </For>
              </Select>
            </span>
            <span>
              <Chipbar chips={armorChips} setChips={setArmorChips} />
            </span>
          </div>
        </div>
        <div>
          <div>Weapons</div>
          <div>
            <span class={styles.lineUp}>
              <Button onClick={()=>{
                const currentWeapons = props.formGroup.get("weaponProficiencies") as string[];
                props.formGroup.set("weaponProficiencies", [...currentWeapons, ...selectedWeapons()]);
                setSelectedWeapons([]);
                props.setProfStore((prev) => ({ ...prev, weapons: [...prev.weapons || [], ...selectedWeapons()] }));
              }}><Icon name="add" /></Button>
              <Select multiple value={selectedWeapons()} onChange={setSelectedWeapons}>
                <Option value="Simple">Simple</Option>
                <Option value="Martial">Martial</Option>
                <For each={allWeapons()}>
                  {(weapon) => <Option value={weapon.name}>{weapon.name}</Option>}
                </For>
              </Select>
            </span>
            <span>
              <Chipbar chips={weaponChips} setChips={setWeaponChips} />
            </span>
          </div>
        </div>
        <div>
          <div>Tools</div>
          <div>
            <span class={styles.lineUp}>
              <Button onClick={()=>{
                const currentTools = props.formGroup.get("toolProficiencies") as string[];
                props.formGroup.set("toolProficiencies", [...currentTools, ...selectedItems()]);
                setSelectedItems([]);
                props.setProfStore((prev) => ({ ...prev, tools: [...prev.tools || [], ...selectedItems()] }));
              }}><Icon name="add" /></Button>
              <Select multiple value={selectedItems()} onChange={setSelectedItems}>
                <For each={allItems().filter((item) => item.equipmentCategory === "Tools")}>
                  {(item) => <Option value={item.name}>{item.name}</Option>}
                </For>
              </Select>
            </span>
            <span>
              <Chipbar chips={toolChips} setChips={setToolChips} />
            </span>
          </div>
        </div>
        <div>
          <FormField class={`${styles.fieldSizeXl}`} name="Saving Throws" formName="savingThrows">
            <Select multiple>
              <Option value={Stat.STR}>Strength</Option>
              <Option value={Stat.DEX}>Dexterity</Option>
              <Option value={Stat.CON}>Constitution</Option>
              <Option value={Stat.INT}>Intelligence</Option>
              <Option value={Stat.WIS}>Wisdom</Option>
              <Option value={Stat.CHA}>Charisma</Option>
            </Select>
          </FormField>
        </div>
        <div>
          <FormField class={`${styles.fieldSizeXl}`} name="Skill Choice Amount" formName="skillChoiceNum">
            <Input type="number" />
          </FormField>
          
          <FormField class={`${styles.fieldSizeXl}`} name="Skill Choices" formName="skillChoices">
            <Select multiple >
              <For each={getSkills()}>
                {(skill) => <Option value={skill}>{skill}</Option>}
              </For>
            </Select>
          </FormField>
        </div>
      </div>
      <Modal title={`Proficiencies`} show={[showEquipTable, setShowEquipTable]}>

      </Modal>
    </div>
  );
};
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