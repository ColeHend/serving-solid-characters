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

  const getSkills: (name: string) => string[] = (name) => {
    switch (name) {
    case "Strength":
      return ["Athletics"];
    case "Dexterity":
      return ["Acrobatics", "Sleight Of Hand", "Stealth"];
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
                <span><u>_{calcSkillMod(props.skills[`${skillName}`])}_</u></span>
              </li>
            }
          </For>
        </ul>
      </div>
    </div>
  );
};

export default StatBlock;