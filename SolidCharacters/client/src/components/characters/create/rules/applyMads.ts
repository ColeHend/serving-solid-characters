import { Character } from "../../../../models/character.model";
import { FeatureDetail } from "../../../../models/generated";
import { Clone } from "../../../../shared";
import { Stats } from "../../../../shared/customHooks/dndInfo/useCharacters";
import { MadFeature } from "../../../../shared/customHooks/mads/madModels";
import {
  choiceProficiencyMads,
  choiceSpellMads,
  choiceStatMads,
  collectMadFeatures,
  pendingProficiencyChoices,
  pendingSpellChoices,
  pendingStatChoices,
  useMadCharacters,
} from "../../../../shared/customHooks/mads/useMadCharacters";
import { getAbilityModifier } from "./engine";

/**
 * An AddArmorClass command WITH a stats list is a base-AC *formula* (Unarmored Defense:
 * bonus + ability mods) competing with the mapper's 10+DEX baseline — the additive handler
 * would double-count DEX. Formulas are pulled out and the best one replaces the baseline;
 * flat AddArmorClass bonuses still stack normally.
 */
function isAcFormula(mad: MadFeature): boolean {
  return mad.command === "AddArmorClass" && !!(mad.value?.["stats"] ?? "").trim();
}

function formulaAc(character: Character, mad: MadFeature): number {
  const bonus = Number(mad.value?.["bonus"] ?? 0) || 0;
  const stats = (mad.value?.["stats"] ?? "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
  return (
    bonus +
    stats.reduce(
      (sum: number, stat: string) =>
        sum + getAbilityModifier(character.stats?.[stat as keyof Stats] ?? 10),
      0,
    )
  );
}

/**
 * The mads-applied view of a character, mirroring the view page: apply to a clone at
 * display time, never persist the result (the view page re-applies on load — persisting
 * an applied character would double-apply).
 */
export function applyCreatorMads(character: Character): Character {
  const clone = Clone(character);
  const mads = collectMadFeatures(clone);
  const formulas = mads.filter(isAcFormula);
  const rest = mads.filter((mad) => !isAcFormula(mad));

  const preDexMod = getAbilityModifier(clone.stats?.dex ?? 10);
  const applied = useMadCharacters(clone, rest);

  // Keep the 10+DEX baseline honest after mads ASIs, then swap in the best base-AC formula.
  const postDexMod = getAbilityModifier(applied.stats?.dex ?? 10);
  applied.ArmorClass += postDexMod - preDexMod;
  if (formulas.length > 0) {
    const dexBase = 10 + postDexMod;
    const best = Math.max(dexBase, ...formulas.map((mad) => formulaAc(applied, mad)));
    applied.ArmorClass += best - dexBase;
  }
  return applied;
}

export type MadChoiceKind = "stat" | "proficiency" | "spell";

export interface MadChoice {
  feature: FeatureDetail;
  mad: MadFeature;
  kind: MadChoiceKind;
  /** True while the player hasn't made (or completed) the pick. */
  pending: boolean;
}

function featureSources(character: Character): FeatureDetail[] {
  return [
    ...(character.levels ?? []).flatMap((level) => level.features ?? []),
    ...(character.race?.features ?? []),
    ...(character.features ?? []),
  ];
}

/** Every choice-form mad on the character's features, flagged with whether it still needs a pick. */
export function draftMadChoices(character: Character): MadChoice[] {
  return featureSources(character).flatMap((feature) => {
    const pendingStat = pendingStatChoices(character, feature);
    const pendingProf = pendingProficiencyChoices(character, feature);
    const pendingSpell = pendingSpellChoices(character, feature);
    return [
      ...choiceStatMads(feature).map((mad) => ({
        feature,
        mad,
        kind: "stat" as const,
        pending: pendingStat.includes(mad),
      })),
      ...choiceProficiencyMads(feature).map((mad) => ({
        feature,
        mad,
        kind: "proficiency" as const,
        pending: pendingProf.includes(mad),
      })),
      ...choiceSpellMads(feature).map((mad) => ({
        feature,
        mad,
        kind: "spell" as const,
        pending: pendingSpell.includes(mad),
      })),
    ];
  });
}
