import { RulesetSelection } from "../../../../models/character.model";
import { classSkillChoiceSpec } from "../rules/engine";
import { Spell } from "../../../../models/generated";
import { subclassBelongsTo } from "../../../../models/data/subclasses";
import {
  entitySelectorKey,
  featSelectorKey,
  selectorKeyDisplayName,
} from "../../../../shared/customHooks/utility/tools/entityKey";
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

/** Resolve a selector key back to its entity's display name via a (source-edition) list. */
const nameOfKey = (list: { id?: string; name?: string }[], key: string): string | undefined =>
  list.find((e) => entitySelectorKey({ id: e.id, name: e.name ?? "" }) === key)?.name;

/**
 * Recompute the draft against the target edition's dataset: selections that still exist there
 * (homebrew is merged into both editions' hooks, so it always survives) are kept — re-keyed to
 * the target edition's rows — and the rest are dropped and reported. Key-shaped selections
 * (spells, feats) need `source`, the edition being left, to recover a name for the same-name
 * swap. An empty dataset can't be validated (still loading) — its category is left untouched
 * rather than wiped.
 */
export function reconcileEdition(
  draft: CharacterDraft,
  target: RulesetSelection,
  data: EditionData,
  source: EditionData,
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
          const wanted = subclass.toLowerCase();
          const match = data.subclasses.find(
            (sub) =>
              sub.name.toLowerCase() === wanted &&
              (class5e
                ? subclassBelongsTo(sub, class5e)
                : sub.parentClass?.toLowerCase() === entry.name.toLowerCase()),
          );
          if (!match) {
            dropped.push(`${subclass} (subclass)`);
            subclass = "";
            // A dangling selector key would otherwise resolve the dropped subclass right back.
            subclassId = undefined;
          } else {
            // Re-key to the target edition's row — the old id is a stale cross-edition
            // selector that would only keep resolving through the name fallback.
            subclassId = entitySelectorKey({ id: match.id, name: match.name });
          }
        }
        const validSkills = new Set(classSkillChoiceSpec(class5e).options.map((s) => s.toLowerCase()));
        const skillChoices = entry.skillChoices.filter((skill) => validSkills.has(skill.toLowerCase()));
        return { ...entry, subclass, subclassId, skillChoices };
      });
  }

  let species = draft.species;
  let lineage = draft.lineage;
  let raceLanguageChoices = draft.raceLanguageChoices;
  let raceTraitChoices = draft.raceTraitChoices;
  if (species && data.races.length > 0 && !names(data.races).has(species.toLowerCase())) {
    dropped.push(`${species} (species)`);
    species = "";
    lineage = "";
    raceLanguageChoices = [];
    raceTraitChoices = [];
  } else if (species && data.races.length > 0) {
    // The surviving species may define different choice sets in the target edition.
    const race = data.races.find((r) => r.name?.toLowerCase() === species.toLowerCase());
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
  let backgroundId = draft.backgroundId;
  let originFeat = draft.originFeat;
  if (background && data.backgrounds.length > 0) {
    const backgroundByName = (name: string) => {
      const matches = data.backgrounds.filter((b) => b.name?.toLowerCase() === name.toLowerCase());
      return matches.find((b) => b.legacy !== true) ?? matches[0];
    };
    const match =
      (backgroundId
        ? data.backgrounds.find(
          (b) => entitySelectorKey({ id: b.id, name: b.name }) === backgroundId,
        )
        : undefined) ?? backgroundByName(background);
    if (!match) {
      dropped.push(`${background} (background)`);
      background = "";
      // A dangling selector key would otherwise resolve the dropped background right back.
      backgroundId = undefined;
      originFeat = "";
    } else {
      // Re-key to the target edition's row, like subclasses/feats/spells below.
      backgroundId = entitySelectorKey({ id: match.id, name: match.name });
    }
  }

  let feats = draft.feats;
  let featOrAsi = draft.featOrAsi;
  if (data.feats.length > 0) {
    const targetKeys = new Set(data.feats.map((f) => featSelectorKey(f)));
    const featByName = (name: string) => {
      const matches = data.feats.filter((f) => f.details?.name?.toLowerCase() === name.toLowerCase());
      return matches.find((f) => f.legacy !== true) ?? matches[0];
    };
    const sourceNameOf = (key: string) =>
      source.feats.find((f) => featSelectorKey(f) === key)?.details?.name ??
      selectorKeyDisplayName(key);
    feats = draft.feats.flatMap((key) => {
      if (targetKeys.has(key)) return [key];
      // Not in the target edition by key — swap to the same-named feat there when it has one.
      const name = sourceNameOf(key);
      const swap = featByName(name);
      if (swap) return [featSelectorKey(swap)];
      dropped.push(`${name} (feat)`);
      return [];
    });
    // Feat-or-ASI slot picks re-key the same way; a feat with no counterpart falls back to
    // the plain ASI. (Slot keys themselves are feature ids — the mapper drops dangling ones.)
    featOrAsi = Object.fromEntries(
      Object.entries(draft.featOrAsi).map(([slot, value]) => {
        if (!value || value === "asi" || targetKeys.has(value)) return [slot, value] as const;
        const name = sourceNameOf(value);
        const swap = featByName(name);
        if (swap) return [slot, featSelectorKey(swap)] as const;
        dropped.push(`${name} (feat)`);
        return [slot, "asi"] as const;
      }),
    );
    // The player's origin-feat override must exist in the target edition too (name-shaped).
    const featNames = new Set(data.feats.map((f) => f.details?.name?.toLowerCase()).filter(Boolean));
    if (originFeat && !featNames.has(originFeat.toLowerCase())) {
      dropped.push(`${originFeat} (origin feat)`);
      originFeat = "";
    }
    // The background's own recommended feat is derived — flag it when it won't exist anymore.
    const recommended = background
      ? backgroundFeatName({ background, backgroundId }, data.backgrounds)
      : "";
    if (background && recommended && !featNames.has(recommended.toLowerCase())) {
      dropped.push(`${recommended} (background feat)`);
    }
  }

  let spells = draft.spells;
  if (data.spells.length > 0) {
    const targetKeys = new Set(data.spells.map((sp) => entitySelectorKey(sp)));
    const spellByName = (name: string) => {
      const matches = data.spells.filter((sp) => sp.name?.toLowerCase() === name.toLowerCase());
      return matches.find((sp) => sp.legacy !== true) ?? matches[0];
    };
    spells = draft.spells.flatMap((key) => {
      if (targetKeys.has(key)) return [key];
      const name = nameOfKey(source.spells, key) ?? selectorKeyDisplayName(key);
      const swap = spellByName(name);
      if (swap) return [entitySelectorKey(swap)];
      dropped.push(`${name} (spell)`);
      return [];
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
      backgroundId,
      originFeat,
      feats,
      featOrAsi,
      spells,
      // Bonus-slot assignments are pool-shaped and the target edition derives different
      // pools — clear them so the provider reseeds that edition's book defaults.
      abilityBonuses: { species: [], background: [] },
      abilityBonusStyle: { species: "standard", background: "standard" },
      raceLanguageChoices,
      raceTraitChoices,
    },
    dropped,
  };
}
