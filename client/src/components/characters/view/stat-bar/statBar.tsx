import { Accessor, Component } from "solid-js";
import { Stats,
} from "../../../../shared/customHooks/dndInfo/useCharacters";
import styles from "./statBar.module.scss";
import StatBlock from "./stat/stat";
import { Character } from "../../../../models/character.model";

type Props = {
  fullStats: Accessor<Stats>;
  currentCharacter: Accessor<Character>;
};
const StatBar: Component<Props> = (props) => {
  const getProficiencyBonus = (level: number) => Math.ceil(level / 4) + 1;

  props.currentCharacter().proficiencies.skills

  return (
    <div class={`${styles.statBlocks}`}>
      <StatBlock
        stat={props.fullStats().str}
        name="Strength"
        proficientMod={getProficiencyBonus(props.currentCharacter().level)}
        skills={props.currentCharacter().proficiencies.skills}
      />
      <StatBlock
        stat={props.fullStats().dex}
        name="Dexterity"
        proficientMod={getProficiencyBonus(props.currentCharacter().level)}
        skills={props.currentCharacter().proficiencies.skills}
      />
      <StatBlock
        stat={props.fullStats().con}
        name="Constitution"
        proficientMod={getProficiencyBonus(props.currentCharacter().level)}
        skills={props.currentCharacter().proficiencies.skills}
      />
      <StatBlock
        stat={props.fullStats().int}
        name="Intelligence"
        proficientMod={getProficiencyBonus(props.currentCharacter().level)}
        skills={props.currentCharacter().proficiencies.skills}
      />
      <StatBlock
        stat={props.fullStats().wis}
        name="Wisdom"
        proficientMod={getProficiencyBonus(props.currentCharacter().level)}
        skills={props.currentCharacter().proficiencies.skills}
      />
      <StatBlock
        stat={props.fullStats().cha}
        name="Charisma"
        proficientMod={getProficiencyBonus(props.currentCharacter().level)}
        skills={props.currentCharacter().proficiencies.skills}
      />
    </div>
  );
};

export default StatBar;