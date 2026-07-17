import { createStore, produce, reconcile } from "solid-js/store";
import {
  AbilityGenMethod,
  CharacterDetails,
  RulesetSelection,
  SkillOverrideState,
} from "../../../../models/character.model";
import { ABILITY_SCORE_MAX, ABILITY_SCORE_MIN, AbilityKey, MAX_TOTAL_LEVEL } from "../rules/constants";
import { CharacterDraft, DraftItems, defaultBaseScores, emptyDraft, zeroScores } from "./types";

const nextSkillState: Record<SkillOverrideState, SkillOverrideState> = {
  none: "proficient",
  proficient: "expertise",
  expertise: "none",
};

/** One 4d6-drop-lowest roll. */
function roll4d6DropLowest(): number {
  const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  return dice.sort((a, b) => a - b).slice(1).reduce((sum, d) => sum + d, 0);
}

export function createDraftStore(initial?: Partial<CharacterDraft>) {
  const [draft, setDraft] = createStore<CharacterDraft>(emptyDraft("2024", initial));

  const actions = {
    setEdition(edition: RulesetSelection) {
      setDraft("edition", edition);
    },
    setName(name: string) {
      setDraft("name", name);
    },
    setAlignment(alignment: string) {
      setDraft("alignment", alignment);
    },

    addClass(name: string) {
      if (draft.classes.some((c) => c.name === name)) return;
      setDraft("classes", draft.classes.length, { name, level: 1, subclass: "", skillChoices: [] });
    },
    removeClass(name: string) {
      setDraft("classes", (classes) => classes.filter((c) => c.name !== name));
    },
    setClassLevel(name: string, level: number) {
      setDraft(
        "classes",
        (c) => c.name === name,
        produce((entry) => {
          const otherLevels = draft.classes
            .filter((c) => c.name !== name)
            .reduce((sum, c) => sum + c.level, 0);
          entry.level = Math.max(1, Math.min(level, MAX_TOTAL_LEVEL - otherLevels));
        }),
      );
    },
    setSubclass(name: string, subclass: string) {
      setDraft("classes", (c) => c.name === name, "subclass", subclass);
    },
    toggleClassSkill(name: string, skill: string, maxPicks: number) {
      setDraft(
        "classes",
        (c) => c.name === name,
        produce((entry) => {
          if (entry.skillChoices.includes(skill)) {
            entry.skillChoices = entry.skillChoices.filter((s) => s !== skill);
          } else if (entry.skillChoices.length < maxPicks) {
            entry.skillChoices = [...entry.skillChoices, skill];
          }
        }),
      );
    },

    setSpecies(species: string) {
      // A new species brings new choice sets; stale picks must not linger.
      setDraft({
        species,
        lineage: "",
        raceAbilityChoices: [],
        raceLanguageChoices: [],
        raceTraitChoices: [],
      });
    },
    setLineage(lineage: string) {
      setDraft("lineage", lineage);
    },
    toggleRaceAbilityChoice(key: AbilityKey, maxPicks: number) {
      setDraft("raceAbilityChoices", (picks) =>
        picks.includes(key)
          ? picks.filter((k) => k !== key)
          : picks.length < maxPicks
            ? [...picks, key]
            : picks);
    },
    toggleRaceLanguageChoice(language: string, maxPicks: number) {
      setDraft("raceLanguageChoices", (picks) =>
        picks.includes(language)
          ? picks.filter((l) => l !== language)
          : picks.length < maxPicks
            ? [...picks, language]
            : picks);
    },
    toggleRaceTraitChoice(name: string, maxPicks: number) {
      setDraft("raceTraitChoices", (picks) =>
        picks.includes(name)
          ? picks.filter((t) => t !== name)
          : picks.length < maxPicks
            ? [...picks, name]
            : picks);
    },
    setBackground(background: string) {
      // A new background brings new boost abilities and its own recommended feat;
      // stale boosts and origin-feat overrides must not linger.
      setDraft({ background, backgroundBoosts: {}, originFeat: "" });
    },
    setOriginFeat(name: string) {
      setDraft("originFeat", name);
    },

    addLanguage(language: string) {
      if (!language || draft.languages.includes(language)) return;
      setDraft("languages", draft.languages.length, language);
    },
    removeLanguage(language: string) {
      setDraft("languages", (langs) => langs.filter((l) => l !== language));
    },

    setAbilityMethod(method: AbilityGenMethod) {
      setDraft({ abilityMethod: method, baseScores: defaultBaseScores(method), rolledPool: [] });
    },
    setBaseScore(key: AbilityKey, value: number) {
      setDraft("baseScores", key, Math.max(0, Math.min(value, ABILITY_SCORE_MAX)));
    },
    swapBaseScores(a: AbilityKey, b: AbilityKey) {
      setDraft(
        "baseScores",
        produce((scores) => {
          const swapped = scores[a];
          scores[a] = scores[b];
          scores[b] = swapped;
        }),
      );
    },
    stepBonus(key: AbilityKey, delta: 1 | -1) {
      setDraft("bonusScores", key, (bonus) => Math.max(ABILITY_SCORE_MIN - 10, Math.min(bonus + delta, 10)));
    },
    rollPool() {
      setDraft({
        rolledPool: Array.from({ length: 6 }, roll4d6DropLowest).sort((a, b) => b - a),
        baseScores: zeroScores(),
      });
    },
    applyBackgroundBoost(assignment: Partial<Record<AbilityKey, number>>) {
      setDraft("backgroundBoosts", reconcile(assignment));
    },
    clearBackgroundBoosts() {
      setDraft("backgroundBoosts", reconcile({}));
    },

    cycleSkill(skill: string, currentState: SkillOverrideState) {
      setDraft("skillOverrides", skill, nextSkillState[currentState]);
    },

    addFeat(name: string) {
      if (!name || draft.feats.includes(name)) return;
      setDraft("feats", draft.feats.length, name);
    },
    removeFeat(name: string) {
      setDraft("feats", (feats) => feats.filter((f) => f !== name));
    },

    setMadStatChoice(key: string, ability: string) {
      setDraft("madChoices", "stats", key, ability);
    },
    /** CSV of picked skill names (the Character contract's storage shape). */
    setMadProficiencyChoice(key: string, picksCsv: string) {
      setDraft("madChoices", "proficiencies", key, picksCsv);
    },
    /** CSV of picked spell ids. */
    setMadSpellChoice(key: string, picksCsv: string) {
      setDraft("madChoices", "spells", key, picksCsv);
    },

    addSpell(name: string) {
      if (!name || draft.spells.includes(name)) return;
      setDraft("spells", draft.spells.length, name);
    },
    removeSpell(name: string) {
      setDraft("spells", (spells) => spells.filter((s) => s !== name));
    },

    setDetail<K extends keyof CharacterDetails>(key: K, value: CharacterDetails[K]) {
      setDraft("details", key, value);
    },

    updateItems(patch: Partial<DraftItems>) {
      setDraft("items", patch);
    },
    addInventoryItem(name: string) {
      if (!name || draft.items.inventory.includes(name)) return;
      setDraft("items", "inventory", draft.items.inventory.length, name);
    },
    removeInventoryItem(name: string) {
      setDraft(
        "items",
        produce((items) => {
          items.inventory = items.inventory.filter((i) => i !== name);
          items.equipped = items.equipped.filter((i) => i !== name);
          items.attuned = items.attuned.filter((i) => i !== name);
        }),
      );
    },
    setCurrency(key: keyof DraftItems["currency"], value: number) {
      setDraft("items", "currency", key, Math.max(0, Math.floor(value)));
    },

    reset() {
      setDraft(reconcile(emptyDraft(draft.edition)));
    },
    load(next: CharacterDraft) {
      setDraft(reconcile(next));
    },
  };

  return { draft, setDraft, actions };
}

export type DraftActions = ReturnType<typeof createDraftStore>["actions"];
