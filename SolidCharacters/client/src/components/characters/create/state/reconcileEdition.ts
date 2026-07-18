import { RulesetSelection } from "../../../../models/character.model";
import { classSkillChoiceSpec, normalizeAbility } from "../rules/engine";
import { AbilityScores, Spell } from "../../../../models/generated";
import { SrdLookups, backgroundFeatName } from "./draftMapper";
import { CharacterDraft } from "./types";

export interface EditionData extends SrdLookups {
  spells: Spell[];
}

export interface EditionSwitchReport {
  next: CharacterDraft;
  /** Human-readable losses for the confirm modal, e.g. "Goliath (species)". Empty = switch silently. */
  dropped: string[];
}

const names = (list: { name?: string }[]) => new Set(list.map((e) => e.name?.toLowerCase()).filter(Boolean));

/**
 * Recompute the draft against the target edition's dataset: selections whose names still exist
 * (homebrew is merged into both editions' hooks, so it always survives) are kept, the rest are
 * dropped and reported. An empty dataset can't be validated (still loading) — its category is
 * left untouched rather than wiped.
 */
export function reconcileEdition(
  draft: CharacterDraft,
  target: RulesetSelection,
  data: EditionData,
): EditionSwitchReport {
  const dropped: string[] = [];

  // Classes: drop missing ones; re-validate kept classes' subclass and skill picks.
  let classes = draft.classes;
  if (data.classes.length > 0) {
    const classNames = names(data.classes);
    classes = draft.classes
      .filter((entry) => {
        if (classNames.has(entry.name.toLowerCase())) return true;
        dropped.push(`${entry.name} ${entry.level > 1 ? `${entry.level} ` : ""}(class)`);
        return false;
      })
      .map((entry) => {
        const class5e = data.classes.find((c) => c.name.toLowerCase() === entry.name.toLowerCase());
        let subclass = entry.subclass;
        let subclassId = entry.subclassId;
        if (subclass && data.subclasses.length > 0) {
          const stillExists = data.subclasses.some(
            (sub) =>
              sub.name.toLowerCase() === subclass.toLowerCase() &&
              sub.parentClass?.toLowerCase() === entry.name.toLowerCase(),
          );
          if (!stillExists) {
            dropped.push(`${subclass} (subclass)`);
            subclass = "";
            // A dangling selector key would otherwise resolve the dropped subclass right back.
            subclassId = undefined;
          }
        }
        const validSkills = new Set(classSkillChoiceSpec(class5e).options.map((s) => s.toLowerCase()));
        const skillChoices = entry.skillChoices.filter((skill) => validSkills.has(skill.toLowerCase()));
        return { ...entry, subclass, subclassId, skillChoices };
      });
  }

  let species = draft.species;
  let lineage = draft.lineage;
  let raceAbilityChoices = draft.raceAbilityChoices;
  let raceLanguageChoices = draft.raceLanguageChoices;
  let raceTraitChoices = draft.raceTraitChoices;
  if (species && data.races.length > 0 && !names(data.races).has(species.toLowerCase())) {
    dropped.push(`${species} (species)`);
    species = "";
    lineage = "";
    raceAbilityChoices = [];
    raceLanguageChoices = [];
    raceTraitChoices = [];
  } else if (species && data.races.length > 0) {
    // The surviving species may define different choice sets in the target edition.
    const race = data.races.find((r) => r.name?.toLowerCase() === species.toLowerCase());
    const abilityOptions = new Set(
      (race?.abilityBonusChoice?.choices ?? [])
        .map((bonus) => normalizeAbility(AbilityScores[bonus.stat]))
        .filter(Boolean),
    );
    raceAbilityChoices = draft.raceAbilityChoices.filter((key) => abilityOptions.has(key));
    const languageOptions = new Set((race?.languageChoice?.options ?? []).map((l) => l.toLowerCase()));
    raceLanguageChoices = draft.raceLanguageChoices.filter((l) => languageOptions.has(l.toLowerCase()));
    const traitOptions = new Set(
      (race?.traitChoice?.choices ?? []).map((t) => t.details?.name?.toLowerCase()).filter(Boolean),
    );
    raceTraitChoices = draft.raceTraitChoices.filter((t) => traitOptions.has(t.toLowerCase()));
  }
  if (lineage && data.subraces.length > 0 && !names(data.subraces).has(lineage.toLowerCase())) {
    dropped.push(`${lineage} (lineage)`);
    lineage = "";
  }

  let background = draft.background;
  let backgroundBoosts = draft.backgroundBoosts;
  let originFeat = draft.originFeat;
  if (background && data.backgrounds.length > 0 && !names(data.backgrounds).has(background.toLowerCase())) {
    dropped.push(`${background} (background)`);
    background = "";
    backgroundBoosts = {};
    originFeat = "";
  }

  let feats = draft.feats;
  if (data.feats.length > 0) {
    const featNames = new Set(data.feats.map((f) => f.details?.name?.toLowerCase()).filter(Boolean));
    feats = draft.feats.filter((name) => {
      if (featNames.has(name.toLowerCase())) return true;
      dropped.push(`${name} (feat)`);
      return false;
    });
    // The player's origin-feat override must exist in the target edition too.
    if (originFeat && !featNames.has(originFeat.toLowerCase())) {
      dropped.push(`${originFeat} (origin feat)`);
      originFeat = "";
    }
    // The background's own recommended feat is derived — flag it when it won't exist anymore.
    const recommended = background ? backgroundFeatName({ background }, data.backgrounds) : "";
    if (background && recommended && !featNames.has(recommended.toLowerCase())) {
      dropped.push(`${recommended} (background feat)`);
    }
  }

  let spells = draft.spells;
  if (data.spells.length > 0) {
    const spellNames = names(data.spells);
    spells = draft.spells.filter((name) => {
      if (spellNames.has(name.toLowerCase())) return true;
      dropped.push(`${name} (spell)`);
      return false;
    });
  }

  return {
    next: {
      ...draft,
      edition: target,
      classes,
      species,
      lineage,
      background,
      backgroundBoosts,
      originFeat,
      feats,
      spells,
      raceAbilityChoices,
      raceLanguageChoices,
      raceTraitChoices,
    },
    dropped,
  };
}
