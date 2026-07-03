import { Accessor, Component } from "solid-js";
import { Stats,
} from "../../../../shared/customHooks/dndInfo/useCharacters";
import styles from "./statBar.module.scss";
import StatBlock from "./stat/stat";
import { Character, RollAdvantage } from "../../../../models/character.model";

type Props = {
  fullStats: Accessor<Stats>;
  currentCharacter: Accessor<Character>;
  rollAdvantages?: Accessor<RollAdvantage[]>;
};

const STAT_KEYS: Record<string, keyof Stats> = {
  Strength: "str", Dexterity: "dex", Constitution: "con",
  Intelligence: "int", Wisdom: "wis", Charisma: "cha",
};

const StatBar: Component<Props> = (props) => {
  const getProficiencyBonus = (level: number) => Math.ceil(level / 4) + 1;

  // Save/check advantages that apply to this ability (no stat on the grant = all stats).
  const advantagesFor = (name: string) =>
    (props.rollAdvantages?.() ?? []).filter(a =>
      (a.rollType === "SavingThrow" || a.rollType === "AbilityCheck") &&
      (!a.stat || a.stat === STAT_KEYS[name]));

  return (
    <div class={`${styles.statBlocks}`}>
      <StatBlock
        stat={props.fullStats().str}
        name="Strength"
        proficientMod={getProficiencyBonus(props.currentCharacter()?.level)}
        skills={props.currentCharacter()?.proficiencies.skills}
        advantages={advantagesFor("Strength")}
      />
      <StatBlock
        stat={props.fullStats().dex}
        name="Dexterity"
        proficientMod={getProficiencyBonus(props.currentCharacter()?.level)}
        skills={props.currentCharacter()?.proficiencies.skills}
        advantages={advantagesFor("Dexterity")}
      />
      <StatBlock
        stat={props.fullStats().con}
        name="Constitution"
        proficientMod={getProficiencyBonus(props.currentCharacter()?.level)}
        skills={props.currentCharacter()?.proficiencies.skills}
        advantages={advantagesFor("Constitution")}
      />
      <StatBlock
        stat={props.fullStats().int}
        name="Intelligence"
        proficientMod={getProficiencyBonus(props.currentCharacter()?.level)}
        skills={props.currentCharacter()?.proficiencies.skills}
        advantages={advantagesFor("Intelligence")}
      />
      <StatBlock
        stat={props.fullStats().wis}
        name="Wisdom"
        proficientMod={getProficiencyBonus(props.currentCharacter()?.level)}
        skills={props.currentCharacter()?.proficiencies.skills}
        advantages={advantagesFor("Wisdom")}
      />
      <StatBlock
        stat={props.fullStats().cha}
        name="Charisma"
        proficientMod={getProficiencyBonus(props.currentCharacter()?.level)}
        skills={props.currentCharacter()?.proficiencies.skills}
        advantages={advantagesFor("Charisma")}
      />
    </div>
  );
};

export default StatBar;
