import {
  Character,
  CharacterSenses,
  MovementSpeedKey,
  MovementType,
  RollAdvantage,
  RollBonus,
} from "../../../models/character.model";
import { Stats } from "../dndInfo/useCharacters";
import { movementTypeName } from "./commands/useMovementFeature";
import { rollBonusAmount } from "./commands/useRollBonusFeature";

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** "ADV · DEX · unless Incapacitated"-style label for a RollAdvantage. */
export function advantageLabel(adv: RollAdvantage): string {
  return `${adv.mode === "advantage" ? "ADV" : "DIS"}${adv.stat ? ` · ${adv.stat.toUpperCase()}` : ""}${adv.condition ? ` · ${adv.condition}` : ""}`;
}

/** "+2 · DEX · with Ranged weapons"-style label; PB fractions resolve against profBonus. */
export function rollBonusLabel(rb: RollBonus, profBonus: number, stats?: Stats): string {
  return `+${rollBonusAmount(rb, profBonus, stats)}${rb.stat ? ` · ${rb.stat.toUpperCase()}` : ""}${rb.condition ? ` · ${rb.condition}` : ""}`;
}

/** Non-walking movement modes as "Fly 60 ft"; a mode without its own speed moves at the walking Speed. */
export function movementModeLabels(character: Character): string[] {
  return (character.movementTypes ?? [])
    .filter((t) => t !== MovementType.Walk)
    .map((t) => {
      const name = movementTypeName(t);
      const speed = character.movementSpeeds?.[name as MovementSpeedKey] ?? character.Speed;
      return `${capitalize(name)} ${speed} ft`;
    });
}

/** Special senses as "Darkvision 60 ft" labels. */
export function senseLabels(senses: CharacterSenses): string[] {
  return Object.entries(senses ?? {})
    .filter(([, range]) => typeof range === "number" && range > 0)
    .map(([sense, range]) => `${capitalize(sense)} ${range} ft`);
}
