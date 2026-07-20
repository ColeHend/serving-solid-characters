import { Accessor, createMemo } from "solid-js";
import { Character } from "../../../models/character.model";
import {
  EquipProficiencies,
  resolveCharacterEquipProficiencies,
} from "../mads/equipmentProficiencies";
import { useDnDClasses } from "./info/all/classes";
import { useDnDBackgrounds } from "./info/all/backgrounds";

/**
 * Armor / weapon / tool proficiencies resolved for a character, ready to hand to
 * the headless `characterToSheetValues` mapper (which is pure and must not call
 * data hooks itself — same contract as `useExportFullStats`).
 */
export type ResolvedProficiencies = EquipProficiencies;

/**
 * Resolve a character's armor/weapon/tool proficiencies from its class(es), background,
 * and equipment-proficiency mads. `Character` only stores class/background NAMES, while
 * the categorized arrays live on the source `Class5E` / `Background` objects — so we look
 * them up here, in owner context, and hand them to the pure resolver.
 */
const useExportProficiencies = (currentCharacter: Accessor<Character | undefined>): Accessor<ResolvedProficiencies> => {
  const classes = useDnDClasses();
  const backgrounds = useDnDBackgrounds();

  return createMemo<ResolvedProficiencies>(() => {
    const char = currentCharacter();
    if (!char) return { armor: [], weapons: [], tools: [] };
    return resolveCharacterEquipProficiencies(char, classes(), backgrounds());
  });
};

export default useExportProficiencies;
