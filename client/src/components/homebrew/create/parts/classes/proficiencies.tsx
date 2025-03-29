import { Component, createSignal, For } from "solid-js";
import styles from "./classes.module.scss";
import { useGetArmor, useGetItems, useGetWeapons } from "../../../../../shared";
import { Stat } from "../../../../../shared/models/stats";
import { Button, Chipbar, ChipType, FormField, Icon, Input, Modal, Option, Select } from "coles-solid-library";

export const Proficiencies: Component = () => {
  const [showEquipTable, setShowEquipTable] = createSignal<boolean>(false);
  const [armorChips, setArmorChips] = createSignal<ChipType[]>([]);
  const [weaponChips, setWeaponChips] = createSignal<ChipType[]>([]);
  const [toolChips, setToolChips] = createSignal<ChipType[]>([]);
  const allItems = useGetItems();
  const allWeapons = useGetWeapons();
  const allArmor = useGetArmor();
  return (
    <div class={`${styles.classSection}`}>
      <div>
        Proficiencies
      </div>
      <div>
        <div>
          <div>Armor</div>
          <div>
            <span>
              <Button><Icon name="add" /></Button>
            </span>
            <span>
              <Chipbar chips={armorChips} setChips={setArmorChips} />
            </span>
          </div>
        </div>
        <div>
          <div>Weapons</div>
          <div>
            <span>
              <Button><Icon name="add" /></Button>
            </span>
            <span>
              <Chipbar chips={weaponChips} setChips={setWeaponChips} />
            </span>
          </div>
        </div>
        <div>
          <div>Tools</div>
          <div>
            <span>
              <Button><Icon name="add" /></Button>
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