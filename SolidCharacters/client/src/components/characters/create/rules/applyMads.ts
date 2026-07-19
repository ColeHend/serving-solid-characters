import { Character } from "../../../../models/character.model";
import { FeatureDetail, MagicItem } from "../../../../models/generated";
import { entitySelectorKey } from "../../../../shared/customHooks/utility/tools/entityKey";
import { Clone } from "../../../../shared";
import { Stats } from "../../../../shared/customHooks/dndInfo/useCharacters";
import { MadFeature } from "../../../../shared/customHooks/mads/madModels";
import {
  activeFeatureMads,
  choiceExpertiseMads,
  choiceItemMads,
  choiceLanguageMads,
  choiceProficiencyMads,
  choiceResistanceMads,
  choiceSpellMads,
  choiceStatMads,
  collectMadFeatures,
  collectMagicItemMads,
  featureGroupOptions,
  madGroup,
  pendingExpertiseChoices,
  pendingGroupChoice,
  pendingItemChoices,
  pendingLanguageChoices,
  pendingProficiencyChoices,
  pendingResistanceChoices,
  pendingSpellChoices,
  pendingStatChoices,
  statChoiceKey,
  useMadCharacters,
} from "../../../../shared/customHooks/mads/useMadCharacters";
import {
  EQUIP_PROF_KINDS,
  choiceEquipProfMads,
  pendingEquipProfChoices,
} from "../../../../shared/customHooks/mads/equipmentProficiencies";
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
export function applyCreatorMads(character: Character, magicItems: MagicItem[] = []): Character {
  const clone = Clone(character);
  // Item mads come AFTER feature mads so a `mode:set` stat item (Headband of Intellect) wins.
  const mads = [...collectMadFeatures(clone), ...collectMagicItemMads(clone, magicItems)];
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

/**
 * A class "Ability Score Improvement" slot — the 5e rule lets a feat replace the increase,
 * so the creator offers a feat picker with the plain ASI as one of its options.
 */
export function isFeatOrAsiFeature(feature: FeatureDetail): boolean {
  return /ability score improvement/i.test(feature.name ?? "") && choiceStatMads(feature).length > 0;
}

export type MadChoiceKind =
  | "stat" | "proficiency" | "expertise" | "resistance" | "language"
  | "spell" | "item" | "armorProf" | "weaponProf" | "toolProf" | "group";

/** Where a choice-bearing feature came from, so each creator section renders only its own. */
export type MadChoiceSource = "class" | "race" | "background" | "feat";

export interface MadChoice {
  feature: FeatureDetail;
  mad: MadFeature;
  kind: MadChoiceKind;
  /** True while the player hasn't made (or completed) the pick. */
  pending: boolean;
  source: MadChoiceSource;
  /** Class choices only: the owning class's selector key, matching draftClassKey. */
  sourceKey?: string;
}

interface TaggedFeature {
  feature: FeatureDetail;
  source: MadChoiceSource;
  sourceKey?: string;
}

function featureSources(character: Character): TaggedFeature[] {
  return [
    ...(character.levels ?? []).flatMap((level) =>
      (level.features ?? []).map((feature) => ({
        feature,
        source: "class" as const,
        sourceKey: level.classId || entitySelectorKey({ name: level.class }),
      }))),
    ...(character.race?.features ?? []).map((feature) => ({ feature, source: "race" as const })),
    ...(character.backgroundFeatures ?? []).map((feature) => ({ feature, source: "background" as const })),
    ...(character.features ?? []).map((feature) => ({ feature, source: "feat" as const })),
  ];
}

/** Every choice-form mad on the character's features, flagged with whether it still needs a pick. */
export function draftMadChoices(character: Character): MadChoice[] {
  const equipKindOf = { armor: "armorProf", weapon: "weaponProf", tool: "toolProf" } as const;
  return featureSources(character).flatMap(({ feature, source, sourceKey }) => {
    // Only the active branch's choices render — an unpicked lineage's nested pickers stay dormant.
    const active = activeFeatureMads(character, feature);
    const inActive = (mad: MadFeature) => active.includes(mad);
    const pendingStat = pendingStatChoices(character, feature);
    const pendingProf = pendingProficiencyChoices(character, feature);
    const pendingExpertise = pendingExpertiseChoices(character, feature);
    const pendingResistance = pendingResistanceChoices(character, feature);
    const pendingLanguage = pendingLanguageChoices(character, feature);
    const pendingSpell = pendingSpellChoices(character, feature);
    const pendingItem = pendingItemChoices(character, feature);
    // A feat-or-ASI slot resolved with a FEAT has no ability pick — that's complete, not pending.
    const slotFeatChosen = (feature2: FeatureDetail) => {
      const slot = character.builder?.featOrAsi?.[statChoiceKey(feature2)];
      return !!slot && slot !== "asi";
    };
    const groups = featureGroupOptions(feature);
    const groupChoice: MadChoice[] = groups.length
      ? [{
        feature,
        // The picker only needs the feature + group options; carry the first branch mad for shape.
        mad: ((feature.metadata?.mads ?? []) as MadFeature[]).find((m) => madGroup(m) > 0) as MadFeature,
        kind: "group" as const,
        pending: pendingGroupChoice(character, feature),
        source,
        sourceKey,
      }]
      : [];
    return [
      ...groupChoice,
      ...choiceStatMads(feature).filter(inActive).map((mad) => ({
        feature,
        mad,
        kind: "stat" as const,
        pending: slotFeatChosen(feature) ? false : pendingStat.includes(mad),
        source,
        sourceKey,
      })),
      ...choiceProficiencyMads(feature).filter(inActive).map((mad) => ({
        feature,
        mad,
        kind: "proficiency" as const,
        pending: pendingProf.includes(mad),
        source,
        sourceKey,
      })),
      ...choiceExpertiseMads(feature).filter(inActive).map((mad) => ({
        feature,
        mad,
        kind: "expertise" as const,
        pending: pendingExpertise.includes(mad),
        source,
        sourceKey,
      })),
      ...choiceResistanceMads(feature).filter(inActive).map((mad) => ({
        feature,
        mad,
        kind: "resistance" as const,
        pending: pendingResistance.includes(mad),
        source,
        sourceKey,
      })),
      ...choiceLanguageMads(feature).filter(inActive).map((mad) => ({
        feature,
        mad,
        kind: "language" as const,
        pending: pendingLanguage.includes(mad),
        source,
        sourceKey,
      })),
      ...choiceSpellMads(feature).filter(inActive).map((mad) => ({
        feature,
        mad,
        kind: "spell" as const,
        pending: pendingSpell.includes(mad),
        source,
        sourceKey,
      })),
      ...choiceItemMads(feature).filter(inActive).map((mad) => ({
        feature,
        mad,
        kind: "item" as const,
        pending: pendingItem.includes(mad),
        source,
        sourceKey,
      })),
      ...EQUIP_PROF_KINDS.flatMap((equipKind) => {
        const pending = pendingEquipProfChoices(equipKind, character, feature);
        return choiceEquipProfMads(equipKind, feature).filter(inActive).map((mad) => ({
          feature,
          mad,
          kind: equipKindOf[equipKind],
          pending: pending.includes(mad),
          source,
          sourceKey,
        }));
      }),
    ];
  });
}
