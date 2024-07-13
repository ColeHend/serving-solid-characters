import { Accessor, Component, For, createMemo, createSignal } from "solid-js";
import useStyle from "../../../../../shared/customHooks/utility/style/styleHook";
import styles from "./classes.module.scss";
import HomebrewSidebar from "../../sidebar";
import HomebrewManager from "../../../../../shared/customHooks/homebrewManager";
import {
  Input,
  Button,
  Select,
  Option,
} from "../../../../../shared/components/index";
import type { DnDClass } from "../../../../../models";
import { LevelEntity, Subclass } from "../../../../../models/class.model";
import {
  Choice,
  StartingEquipment,
  Feature,
} from "../../../../../models/core.model";

const getClass = (
    name: string,
    hitDie: number,
    proficiencies: string[],
    proficiencyChoices: Choice<string>[],
    savingThrows: string[],
    startingEquipment: StartingEquipment,
    classLevels: LevelEntity[],
    features: Feature<unknown, string>[],
    subclasses: Subclass[]
  ) => {
    return {
      name,
      hitDie,
      proficiencies,
      proficiencyChoices,
      savingThrows,
      startingEquipment,
      classLevels,
      features,
      subclasses,
    } as DnDClass;
  };

const Classes: Component = () => {
  const [name, setName] = createSignal<string>("");
  const [hitDie, setHitDie] = createSignal<number>(0);
  const [proficiencies, setProficiencies] = createSignal<string[]>([]);
  const [proficiencyChoices, setProficiencyChoices] = createSignal<
    Choice<string>[]
  >([]);
  const [savingThrows, setSavingThrows] = createSignal<string[]>([]);
  const [startingEquipment, setStartingEquipment] =
    createSignal<StartingEquipment>({
      class: "",
      quantity: 0,
      choice1: [],
      choice2: [],
      choice3: [],
      choice4: [],
    });
  const [classLevels, setClassLevels] = createSignal<LevelEntity[]>([]);
  const [features, setFeatures] = createSignal<Feature<unknown, string>[]>([]);
  const [subclasses, setSubclasses] = createSignal<Subclass[]>([]);

  const currentClass: Accessor<DnDClass> = createMemo(() =>
    getClass(
      name(),
      hitDie(),
      proficiencies(),
      proficiencyChoices(),
      savingThrows(),
      startingEquipment(),
      classLevels(),
      features(),
      subclasses()
    )
  );

  const curr = currentClass();
  const stylin = useStyle();
  return (
    <>
      <HomebrewSidebar />
      <div class={`${stylin.accent} ${styles.body}`}>
        <h1>classes</h1>
        <div>
          <p>Name</p>
            <Input
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}/>
          <p>Hit Die</p>
            <Select value={hitDie()} onChange={(e) => setHitDie(+e.currentTarget.value)}>
                <Option value={4}>d4</Option>
                <Option value={6}>d6</Option>
                <Option value={8}>d8</Option>
                <Option value={10}>d10</Option>
                <Option value={12}>d12</Option>
            </Select>
          <p>Stat Proficiency</p>
          <p>Armor Proficiency</p>
          <p>Weapon Proficiency</p>
          <p>Tool Proficiency</p>
          <p>Skill Proficiency</p>
          <p>Starting Equipment</p>
          <p>Level up Features</p>
          <p>New Related like battle master manuvers</p>
        </div>
      </div>
    </>
  );
};
export default Classes;
