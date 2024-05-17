import { Component, For, createMemo, createSignal } from "solid-js";
import useStyle from "../../../../customHooks/utility/style/styleHook";
import styles from "./stat.module.scss";
import { effect } from "solid-js/web";
interface SkillProficiency {
    name: string;
    proficient: boolean;
    expertise: boolean;
}

const allSkills: SkillProficiency[] = [
  { name: "Acrobatics", proficient: true, expertise: false },
  { name: "Animal Handling", proficient: false, expertise: false },
  { name: "Arcana", proficient: false, expertise: false },
  { name: "Athletics", proficient: false, expertise: false },
  { name: "Deception", proficient: false, expertise: false },
  { name: "History", proficient: false, expertise: false },
  { name: "Insight", proficient: false, expertise: false },
  { name: "Intimidation", proficient: false, expertise: false },
  { name: "Investigation", proficient: false, expertise: false },
  { name: "Medicine", proficient: false, expertise: false },
  { name: "Nature", proficient: false, expertise: false },
  { name: "Perception", proficient: false, expertise: false },
  { name: "Performance", proficient: false, expertise: false },
  { name: "Persuasion", proficient: false, expertise: false },
  { name: "Religion", proficient: false, expertise: false },
  { name: "Sleight of Hand", proficient: false, expertise: false },
  { name: "Stealth", proficient: false, expertise: false },
  { name: "Survival", proficient: false, expertise: false },
];

type Props = {
  stat: number;
  name: string;
  skills: string[];
  expertise?: string[];
  proficientMod: number;
};

const StatBlock: Component<Props> = (props) => {
  const getStatMod = (stat: number) => Math.floor((stat - 10) / 2);
  const stylin = useStyle();
  const [skills, setSkills] = createSignal<SkillProficiency[]>(allSkills);
  
  effect(()=>{
    setSkills(allSkills.map((skill) => {
      if (props.skills.includes(skill.name)) {
        skill = { ...skill, proficient: true };
      }
      if (props.expertise?.includes(skill.name)) {
        skill = { ...skill, proficient: true, expertise: true };
      }
      return skill;
    }));
  })

  const getSkills: (name: string) => string[] = (name) => {
    switch (name) {
      case "Strength":
        return ["Athletics"];
      case "Dexterity":
        return ["Acrobatics", "Sleight of Hand", "Stealth"];
      case "Constitution":
        return [];
      case "Intelligence":
        return ["Arcana", "History", "Investigation", "Nature", "Religion"];
      case "Wisdom":
        return [
          "Animal Handling",
          "Insight",
          "Medicine",
          "Perception",
          "Survival",
        ];
      case "Charisma":
        return ["Deception", "Intimidation", "Performance", "Persuasion"];
      default:
        return [];
    }
  };
  const calcSkillMod = (skill: SkillProficiency) => {
    let mod = getStatMod(props.stat);
    if (skill.proficient) {
      mod += props.proficientMod;
    }
    if (skill.expertise) {
      mod += props.proficientMod;
    }
    return mod;
  };
  return (
    <div class={`${styles.statStyle}`}>
      <div class={`${styles.stat}`}>
        <span>
          <span class={`${stylin.accent}`}>{getStatMod(props.stat)}</span>
          <ul>
            <li>{props.stat}</li>
            <li>{props.name}</li>
          </ul>
        </span>
      </div>
      <div class={`${styles.secondBox}`}>
        <ul>
          <li>{props.name} Saving Throw: </li>
          <For
            each={skills().filter((skill) =>
              getSkills(props.name).includes(skill.name)
            )}
          >
            {(skill) => (
              <li>
                <span>{skill.proficient ? skill.expertise ? <u>✓✓ </u> : <u>✓_ </u> : <u>__</u>}</span>
                <label for={skill.name}> {skill.name} </label>
                <span><u>_{calcSkillMod(skill)}_</u></span>
              </li>
            )}
          </For>
        </ul>
      </div>
    </div>
  );
};

export default StatBlock;
