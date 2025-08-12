import { Component, For, createMemo, createSignal } from "solid-js";
import useStyles from "../../../../../shared/customHooks/utility/style/styleHook";
import styles from "./stat.module.scss";
import { effect } from "solid-js/web";
import getUserSettings from "../../../../../shared/customHooks/userSettings";
import { CharacterSkillProficiency } from "../../../../../models/character.model";

type Props = {
  stat: number;
  name: string;
  skills: Record<string, CharacterSkillProficiency>;
  proficientMod: number;
};

const StatBlock: Component<Props> = (props) => {
  const getStatMod = (stat: number) => Math.floor((stat - 10) / 2);
  // eslint-disable-next-line
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyles(userSettings().theme));

  const [skills, setSkills] = createSignal<Record<string, CharacterSkillProficiency>>({});
  
  // effect(()=>{
  //   setSkills(allSkills.map((skill) => {
  //     if () {
        
  //     }
  //     if (props.expertise?.includes(skill.name)) {
  //       skill = { ...skill, proficient: true, expertise: true };
  //     }
  //     return skill;
  //   }));
  // })

  const getSkills: (name: string) => string[] = (name) => {
    switch (name) {
    case "Strength":
      return ["athletics"];
    case "Dexterity":
      return ["acrobatics", "sleightOfHand", "stealth"];
    case "Constitution":
      return [];
    case "Intelligence":
      return ["arcana", "history", "investigation", "nature", "religion"];
    case "Wisdom":
      return [
        "animalHandling",
        "insight",
        "medicine",
        "perception",
        "survival",
      ];
    case "Charisma":
      return ["deception", "intimidation", "performance", "persuasion"];
    default:
      return [];
    }
  };
  const calcSkillMod = (skill: CharacterSkillProficiency) => {
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
          <span class={`${stylin().box}`}>{getStatMod(props.stat)}</span>
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
            each={getSkills(props.name)}>
            {
              (skillName) => <li>
                <span>{props.skills[`${skillName}`].proficient ? props.skills[`${skillName}`].expertise ? <u>✓✓ </u> : <u>✓_ </u> : <u>__</u>}</span>
                <label for={skillName}> {skillName} </label>
                <span><u>_{props.skills[`${skillName}`].value}_</u></span>
              </li>
            }
          </For>
        </ul>
      </div>
    </div>
  );
};

export default StatBlock;
// .filter((skill) =>
//               getSkills(props.name).includes(skill.name)
//             )}
//           >
//             {(skill) => (
//               <li>
//                 <span>{skill.proficient ? skill.expertise ? <u>✓✓ </u> : <u>✓_ </u> : <u>__</u>}</span>
//                 <label for={skill.name}> {skill.name} </label>
//                 <span><u>_{calcSkillMod(skill)}_</u></span>
//               </li>
//             )