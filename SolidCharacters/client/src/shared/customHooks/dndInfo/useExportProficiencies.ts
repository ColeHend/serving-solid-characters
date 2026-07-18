import { Accessor, createMemo } from "solid-js";
import { Character } from "../../../models/character.model";
import { applyEquipProficiencyMads } from "../mads/equipmentProficiencies";
import { useDnDClasses } from "./info/all/classes";
import { useDnDBackgrounds } from "./info/all/backgrounds";

/**
 * Armor / weapon / tool proficiencies resolved for a character, ready to hand to
 * the headless `characterToSheetValues` mapper (which is pure and must not call
 * data hooks itself — same contract as `useExportFullStats`).
 */
export interface ResolvedProficiencies {
  armor: string[];
  weapons: string[];
  tools: string[];
}

/** Case-insensitive de-dupe that preserves first-seen casing. */
const uniq = (values: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.trim().toLowerCase();
    if (!v.trim() || seen.has(key)) continue;
    seen.add(key);
    out.push(v.trim());
  }
  return out;
};

/**
 * Resolve a character's armor/weapon/tool proficiencies from its class(es) and
 * background. `Character` only stores class/background NAMES, while the
 * categorized arrays live on the source `Class5E` / `Background` objects — so we
 * look them up here, in owner context, and union them.
 */
const useExportProficiencies = (currentCharacter: Accessor<Character | undefined>): Accessor<ResolvedProficiencies> => {
  const classes = useDnDClasses();
  const backgrounds = useDnDBackgrounds();

  return createMemo<ResolvedProficiencies>(() => {
    const char = currentCharacter();
    if (!char) return { armor: [], weapons: [], tools: [] };

    // Class names: every level's class, plus the headline className as a fallback.
    const classNames = uniq([...(char.levels ?? []).map((l) => l?.class ?? ""), char.className ?? ""]);

    const armor: string[] = [];
    const weapons: string[] = [];
    const tools: string[] = [];

    for (const name of classNames) {
      const cls = classes().find((c) => c.name?.toLowerCase() === name.toLowerCase());
      if (!cls?.proficiencies) continue;
      armor.push(...(cls.proficiencies.armor ?? []));
      weapons.push(...(cls.proficiencies.weapons ?? []));
      tools.push(...(cls.proficiencies.tools ?? []));
    }

    const bg = backgrounds().find((b) => b.name?.toLowerCase() === (char.background ?? "").toLowerCase());
    if (bg?.proficiencies) {
      armor.push(...(bg.proficiencies.armor ?? []));
      weapons.push(...(bg.proficiencies.weapons ?? []));
      tools.push(...(bg.proficiencies.tools ?? []));
    }

    // Feature mads (ArmorProficiencies/WeaponProficiencies/ToolProficiencies) union in on
    // top — grants, resolved choose-N picks, and Remove subtractions.
    return applyEquipProficiencyMads(char, { armor: uniq(armor), weapons: uniq(weapons), tools: uniq(tools) });
  });
};

export default useExportProficiencies;
