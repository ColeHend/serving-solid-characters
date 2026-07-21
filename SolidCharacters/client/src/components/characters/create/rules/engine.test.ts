import { describe, expect, it } from "vitest";
import { CasterType, Class5E, Feat, Spell, Subclass } from "../../../../models/generated";
import { CharacterSkillProficiency } from "../../../../models/character.model";
import { Stats } from "../../../../shared/customHooks/dndInfo/useCharacters";
import {
  backgroundBonusPool,
  casterTypeLabel,
  classSkillChoiceSpec,
  collectLanguages,
  computeAc,
  computeFinalScores,
  defaultSlots,
  speciesBonusPool,
  sumBonusPool,
  computeInitiative,
  computeMaxHp,
  computePassivePerception,
  computeSavingThrows,
  computeSkillRows,
  computeSpellcasting,
  darkvisionRange,
  featCategory,
  featureRowsByLevel,
  getProficiencyBonus,
  hitDieLabel,
  hitDieSides,
  isOffList,
  maxCastableSpellLevel,
  mergeMadSkillRows,
  multiclassCasterLevel,
  spellFlavor,
  spellWithinLevelCap,
  subclassUnlockLevel,
  totalLevel,
} from "./engine";

const scores: Stats = { str: 15, dex: 16, con: 14, int: 12, wis: 10, cha: 8 };

const barbarian = {
  name: "Barbarian",
  hitDie: "d12",
  savingThrows: ["Strength", "Constitution"],
  choices: {
    skills: {
      options: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
      amount: 2,
    },
  },
} as unknown as Class5E;

const sorcerer = {
  name: "Sorcerer",
  hitDie: "d6",
  savingThrows: ["Constitution", "Charisma"],
  spellcasting: { metadata: { casterType: CasterType.Full, slots: {} }, knownType: 0, learnedSpells: {} },
} as unknown as Class5E;

// Entry-based resolver (mirrors derived.classByKey — id-first in prod, name here).
const classByName = (entry: { name: string }) =>
  ({ barbarian, sorcerer } as Record<string, Class5E>)[entry.name.toLowerCase()];

// The plan's verification character: Barbarian 1 (initial) / Sorcerer 3, scores above.
const classes = [
  { name: "Barbarian", level: 1 },
  { name: "Sorcerer", level: 3 },
];

describe("screenshot scenario (Barbarian 1 / Sorcerer 3, STR15 DEX16 CON14 INT12 WIS10 CHA8)", () => {
  it("level badge sums class levels", () => {
    expect(totalLevel(classes)).toBe(4);
  });

  it("proficiency bonus is +2 at level 4", () => {
    expect(getProficiencyBonus(totalLevel(classes))).toBe(2);
  });

  it("HP 32 = d12 max + CON, then three average d6 levels", () => {
    expect(computeMaxHp(classes, classByName, 2)).toBe(14 + 3 * 6);
  });

  it("AC 13 unarmored", () => {
    expect(computeAc(3)).toBe(13);
  });

  it("initiative is the DEX mod with no Initiative roll bonuses", () => {
    expect(computeInitiative(3, [], 2, scores)).toBe(3);
  });

  it("saving throws are proficient for the initial class only", () => {
    const saves = computeSavingThrows(barbarian, scores, 2);
    const byKey = Object.fromEntries(saves.map((s) => [s.key, s]));
    expect(byKey.str).toEqual({ key: "str", mod: 4, proficient: true });
    expect(byKey.con).toEqual({ key: "con", mod: 4, proficient: true });
    expect(byKey.dex).toEqual({ key: "dex", mod: 3, proficient: false });
    expect(byKey.cha).toEqual({ key: "cha", mod: -1, proficient: false });
  });

  it("sorcerer save DC 9 with CHA 8", () => {
    const casting = computeSpellcasting(classes, classByName, scores, 2);
    expect(casting).toEqual([{ className: "Sorcerer", ability: "cha", saveDc: 9, attack: 1 }]);
  });

  it("passive perception 12 with Perception proficiency", () => {
    const rows = computeSkillRows({
      classSkills: ["Perception"],
      backgroundSkills: ["Athletics"],
      overrides: {},
      finalScores: scores,
      profBonus: 2,
    });
    expect(computePassivePerception(rows)).toBe(12);
  });
});

describe("computeInitiative", () => {
  it("is the DEX mod alone when no roll bonuses apply", () => {
    expect(computeInitiative(3, [], 2, scores)).toBe(3);
  });

  it("adds a 2014 Alert-style flat Initiative bonus (DEX + 5)", () => {
    expect(computeInitiative(3, [{ rollType: "Initiative", bonus: 5 }], 2, scores)).toBe(8);
  });

  it("adds a 2024 Alert-style Full-PB Initiative bonus (DEX + PB)", () => {
    expect(
      computeInitiative(3, [{ rollType: "Initiative", proficiencyBonus: "Full PB" }], 2, scores),
    ).toBe(5);
  });

  it("ignores roll bonuses that aren't Initiative", () => {
    expect(computeInitiative(3, [{ rollType: "SavingThrow", bonus: 5 }], 2, scores)).toBe(3);
  });
});

describe("computeSkillRows", () => {
  const rows = computeSkillRows({
    classSkills: ["Acrobatics"],
    backgroundSkills: ["Athletics", "Perception"],
    overrides: { Investigation: "expertise", Athletics: "none" },
    finalScores: scores,
    profBonus: 2,
  });
  const byName = Object.fromEntries(rows.map((r) => [r.name, r]));

  it("pre-applies class and background picks", () => {
    expect(byName.Acrobatics).toMatchObject({ state: "proficient", source: "class", mod: 5 });
    expect(byName.Perception).toMatchObject({ state: "proficient", source: "background", mod: 2 });
  });

  it("expertise doubles proficiency (Investigation +5 = +1 INT + 2×2)", () => {
    expect(byName.Investigation).toMatchObject({ state: "expertise", source: "manual", mod: 5 });
  });

  it("an explicit 'none' override beats a background pick", () => {
    expect(byName.Athletics).toMatchObject({ state: "none", source: "manual", mod: 2 });
  });

  it("untrained skills use the bare ability mod", () => {
    expect(byName.Deception).toMatchObject({ state: "none", source: null, mod: -1 });
    expect(rows).toHaveLength(18);
  });
});

describe("mergeMadSkillRows", () => {
  const prof = (
    stat: keyof Stats,
    value: number,
    proficient = false,
    expertise = false,
  ): CharacterSkillProficiency => ({ stat, value, proficient, expertise });

  // Athletics/Acrobatics come in class-proficient; every other row is untrained.
  const baseRows = computeSkillRows({
    classSkills: ["Athletics", "Acrobatics"],
    backgroundSkills: [],
    overrides: {},
    finalScores: scores,
    profBonus: 2,
  });
  const merge = (
    baseSkills: Record<string, CharacterSkillProficiency>,
    madSkills: Record<string, CharacterSkillProficiency>,
  ) =>
    Object.fromEntries(
      mergeMadSkillRows(baseRows, baseSkills, madSkills, scores, 2).map((r) => [r.name, r]),
    );

  it("locks in a feature-granted proficiency on an untrained skill", () => {
    const rows = merge({ Perception: prof("wis", 0) }, { Perception: prof("wis", 2, true) });
    expect(rows.Perception).toMatchObject({
      state: "proficient",
      source: "feature",
      locked: true,
      mod: 2, // WIS 0 + PB 2
    });
  });

  it("upgrades a class-granted proficiency to feature expertise", () => {
    const rows = merge(
      { Athletics: prof("str", 4, true) },
      { Athletics: prof("str", 6, true, true) },
    );
    expect(rows.Athletics).toMatchObject({
      state: "expertise",
      source: "feature",
      locked: true,
      mod: 6, // STR 2 + 2×PB
    });
  });

  it("leaves the row untouched when the mad state isn't an upgrade", () => {
    const rows = merge({ Acrobatics: prof("dex", 5, true) }, { Acrobatics: prof("dex", 5, true) });
    expect(rows.Acrobatics).toMatchObject({
      state: "proficient",
      source: "class",
      locked: false,
      mod: 5, // DEX 3 + PB, unchanged
    });
  });

  it("adds an AllProficiencies-style value bump to an unchanged row", () => {
    // Jack of All Trades bumps the stored value by half PB without granting proficiency.
    const rows = merge({ Stealth: prof("dex", 3) }, { Stealth: prof("dex", 4) });
    expect(rows.Stealth).toMatchObject({
      state: "none",
      source: null,
      locked: false,
      mod: 4, // DEX 3 + (4 − 3) bump
    });
  });

  it("matches a display-name row against its storage key", () => {
    const rows = merge({}, { "Sleight Of Hand": prof("dex", 5, true) });
    expect(rows["Sleight of Hand"]).toMatchObject({
      state: "proficient",
      source: "feature",
      locked: true,
      mod: 5, // DEX 3 + PB
    });
  });
});

describe("computeFinalScores", () => {
  const base: Stats = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };
  const zero: Stats = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

  it("sums base, manual bonus, and both assigned bonus maps", () => {
    const out = computeFinalScores(base, { ...zero, dex: 2 }, { dex: 2, int: 1 }, { str: 2 });
    expect(out).toEqual({ str: 17, dex: 18, con: 13, int: 13, wis: 10, cha: 8 });
  });

  it("empty bonus maps leave the base + manual sums untouched", () => {
    expect(computeFinalScores(base, zero, {}, {})).toEqual(base);
  });
});

describe("speciesBonusPool", () => {
  const dwarf = { abilityBonuses: [{ stat: 2, value: 2 }] } as never; // CON +2

  it("a fixed bonus becomes a reassignable token prefilled with the book stat", () => {
    const pool = speciesBonusPool("2014", dwarf);
    expect(pool.tokens).toEqual([{ value: 2, preset: "con", allowed: [] }]);
    expect(pool.canSpread).toBe(false);
    // zero-click parity: the defaults reproduce the book assignment
    expect(sumBonusPool(pool, defaultSlots(pool))).toEqual({ con: 2 });
    // an empty (never-seeded) slot list falls back to those defaults too
    expect(sumBonusPool(pool, [])).toEqual({ con: 2 });
    // ...and the token can be moved anywhere
    expect(sumBonusPool(pool, ["str"])).toEqual({ str: 2 });
  });

  it("folds an ALL bonus into `all` with no tokens (2014 Human)", () => {
    const human = { abilityBonuses: [{ stat: 7, value: 1 }] } as never;
    const pool = speciesBonusPool("2014", human);
    expect(pool).toMatchObject({ tokens: [], all: 1, canSpread: false });
    expect(sumBonusPool(pool, [])).toEqual({ str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 });
  });

  it("Half-Elf: +2 prefilled on CHA plus two restricted choice tokens", () => {
    const halfElf = {
      abilityBonuses: [{ stat: 5, value: 2 }], // CHA +2 fixed
      abilityBonusChoice: {
        amount: 2,
        choices: [0, 1, 2, 3, 4].map((stat) => ({ stat, value: 1 })), // CHA excluded
      },
    } as never;
    const pool = speciesBonusPool("2014", halfElf);
    expect(pool.canSpread).toBe(false);
    expect(defaultSlots(pool)).toEqual(["cha", "", ""]);
    expect(pool.tokens[1]).toEqual({ value: 1, preset: "", allowed: ["str", "dex", "con", "int", "wis"] });
    expect(sumBonusPool(pool, ["cha", "str", "con"])).toEqual({ cha: 2, str: 1, con: 1 });
    // a choice token dropped on an off-allowed stat contributes nothing
    expect(sumBonusPool(pool, ["cha", "cha", "con"])).toEqual({ cha: 2, con: 1 });
    // unassigned choice tokens contribute nothing (checklist flags them instead)
    expect(sumBonusPool(pool, defaultSlots(pool))).toEqual({ cha: 2 });
  });

  it("a +2/+1 race+subrace pool canSpread, and spread style swaps in three floating +1s", () => {
    const elf = { abilityBonuses: [{ stat: 1, value: 2 }] } as never; // DEX +2
    const highElf = { abilityBonuses: [{ stat: 3, value: 1 }] } as never; // INT +1
    const standard = speciesBonusPool("2014", elf, highElf);
    expect(standard.canSpread).toBe(true);
    expect(defaultSlots(standard)).toEqual(["dex", "int"]);

    const spread = speciesBonusPool("2014", elf, highElf, "spread");
    expect(spread.canSpread).toBe(true);
    expect(spread.tokens).toEqual([
      { value: 1, preset: "", allowed: [] },
      { value: 1, preset: "", allowed: [] },
      { value: 1, preset: "", allowed: [] },
    ]);
    expect(sumBonusPool(spread, ["str", "wis", "cha"])).toEqual({ str: 1, wis: 1, cha: 1 });
  });

  it("gates by edition: empty for 2024, and legacy-flag-driven in both-mode", () => {
    expect(speciesBonusPool("2024", dwarf).tokens).toEqual([]);
    expect(speciesBonusPool("both", dwarf).tokens).toEqual([]); // no legacy flag → current row
    const legacyDwarf = { legacy: true, abilityBonuses: [{ stat: 2, value: 2 }] } as never;
    expect(speciesBonusPool("both", legacyDwarf).tokens).toHaveLength(1);
  });
});

describe("backgroundBonusPool", () => {
  const acolyte = { abilityOptions: ["Intelligence", "Wisdom", "Charisma"] } as never;

  it("standard style is a +2 and a +1 restricted to the background's options", () => {
    const pool = backgroundBonusPool("2024", acolyte);
    expect(pool.canSpread).toBe(true);
    expect(pool.tokens).toEqual([
      { value: 2, preset: "", allowed: ["int", "wis", "cha"] },
      { value: 1, preset: "", allowed: ["int", "wis", "cha"] },
    ]);
    expect(sumBonusPool(pool, ["wis", "int"])).toEqual({ wis: 2, int: 1 });
    // an off-options assignment contributes nothing
    expect(sumBonusPool(pool, ["str", "int"])).toEqual({ int: 1 });
  });

  it("spread style is three +1s over the same options", () => {
    const pool = backgroundBonusPool("2024", acolyte, "spread");
    expect(pool.tokens.map((t) => t.value)).toEqual([1, 1, 1]);
    expect(sumBonusPool(pool, ["int", "wis", "cha"])).toEqual({ int: 1, wis: 1, cha: 1 });
  });

  it("empty for 2014, for a background without options, and with no background at all", () => {
    expect(backgroundBonusPool("2014", acolyte).tokens).toEqual([]);
    expect(backgroundBonusPool("2024", { abilityOptions: [] } as never).tokens).toEqual([]);
    expect(backgroundBonusPool("2024", undefined).tokens).toEqual([]);
  });
});

describe("collectLanguages", () => {
  it("unions Common, species languages, species picks, and manual picks without duplicates", () => {
    const race = { languages: ["Common", "Elvish"] } as never;
    expect(collectLanguages(["Elvish", "Giant"], ["Dwarvish"], race)).toEqual([
      "Common",
      "Elvish",
      "Dwarvish",
      "Giant",
    ]);
  });

  it("works with no species at all", () => {
    expect(collectLanguages(["Orc"], [])).toEqual(["Common", "Orc"]);
  });
});

describe("computeMaxHp edge cases", () => {
  it("level-1 single class does not crash and gives die max + CON", () => {
    expect(computeMaxHp([{ name: "Barbarian", level: 1 }], classByName, 2)).toBe(14);
  });

  it("a class with no hit die (bad homebrew) still yields at least 1 HP per level", () => {
    expect(computeMaxHp([{ name: "Mystery", level: 3 }], () => undefined, -1)).toBe(3);
  });
});

describe("data normalization helpers", () => {
  it("hitDieSides handles both editions' formats", () => {
    expect(hitDieSides("d12")).toBe(12); // 2024
    expect(hitDieSides("12")).toBe(12); // 2014 via DTO string coercion
    expect(hitDieSides(12)).toBe(12);
    expect(hitDieSides(undefined)).toBe(0);
    expect(hitDieSides("weird")).toBe(0);
  });

  it("hitDieLabel normalizes every hit-die shape to display form", () => {
    expect(hitDieLabel("12")).toBe("d12"); // bare 2014 string
    expect(hitDieLabel("d8")).toBe("d8");
    expect(hitDieLabel(6)).toBe("d6"); // numeric homebrew coercion
    expect(hitDieLabel(undefined)).toBe("");
    expect(hitDieLabel("weird")).toBe("");
  });

  it("casterTypeLabel maps the enum, defaulting to Martial", () => {
    expect(casterTypeLabel(barbarian)).toBe("Martial");
    expect(casterTypeLabel(sorcerer)).toBe("Full caster");
  });

  it("multiclassCasterLevel sums full/half/third", () => {
    const paladin = {
      name: "Paladin",
      spellcasting: { metadata: { casterType: CasterType.Half, slots: {} } },
    } as unknown as Class5E;
    const lookup = (entry: { name: string }) => (entry.name === "Paladin" ? paladin : classByName(entry));
    expect(
      multiclassCasterLevel(
        [
          { name: "Sorcerer", level: 3 },
          { name: "Paladin", level: 5 },
          { name: "Barbarian", level: 2 },
        ],
        lookup,
      ),
    ).toBe(5);
  });
});

describe("maxCastableSpellLevel", () => {
  const caster = (name: string, slots: Record<number, Record<string, number>>) =>
    ({ name, spellcasting: { metadata: { casterType: CasterType.Full, slots } } }) as unknown as Class5E;

  const cleric = caster("Cleric", {
    3: { spellSlotsLevel1: 4, spellSlotsLevel2: 2 },
    5: { spellSlotsLevel1: 4, spellSlotsLevel2: 3, spellSlotsLevel3: 2 },
  });
  const wizard = caster("Wizard", { 3: { spellSlotsLevel1: 4, spellSlotsLevel2: 2 } });
  const paladin = caster("Paladin", { 2: { spellSlotsLevel1: 2 } }); // slot onset at level 2
  const warlock = caster("Warlock", { 5: { spellSlotsLevel3: 2 } }); // stored pact row
  const fighter = { name: "Fighter" } as unknown as Class5E;
  const lookup = (entry: { name: string }) =>
    ({ cleric, wizard, paladin, warlock, fighter } as Record<string, Class5E>)[entry.name.toLowerCase()];

  it("reads the highest slot level from the class's stored slot row", () => {
    expect(maxCastableSpellLevel([{ name: "Cleric", level: 5 }], lookup)).toBe(3);
  });

  it("returns null for non-casters", () => {
    expect(maxCastableSpellLevel([{ name: "Fighter", level: 5 }], lookup)).toBe(null);
    expect(maxCastableSpellLevel([], lookup)).toBe(null);
  });

  it("returns null for a caster below its slot onset", () => {
    expect(maxCastableSpellLevel([{ name: "Paladin", level: 1 }], lookup)).toBe(null);
  });

  it("handles pact casters via their stored pact-slot row", () => {
    expect(maxCastableSpellLevel([{ name: "Warlock", level: 5 }], lookup)).toBe(3);
  });

  it("takes the max across classes (deliberately per-class, not combined multiclass slots)", () => {
    expect(
      maxCastableSpellLevel(
        [
          { name: "Cleric", level: 3 },
          { name: "Wizard", level: 3 },
        ],
        lookup,
      ),
    ).toBe(2);
    expect(
      maxCastableSpellLevel(
        [
          { name: "Cleric", level: 5 },
          { name: "Fighter", level: 5 },
        ],
        lookup,
      ),
    ).toBe(3);
  });

  it("a later class raises a max already established by an earlier caster", () => {
    expect(
      maxCastableSpellLevel(
        [
          { name: "Paladin", level: 2 },
          { name: "Cleric", level: 5 },
        ],
        lookup,
      ),
    ).toBe(3);
  });
});

describe("spellWithinLevelCap", () => {
  const atLevel = (level: string) => ({ level } as unknown as Spell);

  it("passes cantrips and everything up to the cap, excludes above it", () => {
    expect(spellWithinLevelCap(atLevel("0"), 1)).toBe(true);
    expect(spellWithinLevelCap(atLevel("3"), 3)).toBe(true);
    expect(spellWithinLevelCap(atLevel("4"), 3)).toBe(false);
  });

  it("a null cap passes everything", () => {
    expect(spellWithinLevelCap(atLevel("9"), null)).toBe(true);
  });
});

describe("subclassUnlockLevel", () => {
  it("uses the class's subclass-marker feature when present", () => {
    const cls = {
      name: "Sorcerer",
      features: { 1: [{ id: "", name: "Spellcasting", description: "" }], 3: [{ id: "", name: "Sorcerer Subclass", description: "" }] },
    } as unknown as Class5E;
    expect(subclassUnlockLevel(cls, [])).toBe(3);
  });

  it("falls back to the earliest subclass feature level, then to 3", () => {
    const sub = { features: { 2: [], 6: [] } } as unknown as Subclass;
    expect(subclassUnlockLevel(undefined, [sub])).toBe(2);
    expect(subclassUnlockLevel(undefined, [])).toBe(3);
  });
});

describe("featureRowsByLevel", () => {
  // 2014-shaped wizard: dense keys, archetype-title markers at 2 and 6, dead levels 3 and 5.
  const wizard = {
    name: "Wizard",
    features: {
      1: [{ id: "", name: "Spellcasting", description: "" }, { id: "", name: "Arcane Recovery", description: "" }],
      2: [{ id: "", name: "Arcane Tradition", description: "" }],
      3: [],
      4: [{ id: "", name: "Ability Score Improvement", description: "" }],
      5: [],
      6: [{ id: "", name: "Arcane Tradition Feature", description: "" }],
    },
  } as unknown as Class5E;
  const evocation = {
    name: "School of Evocation",
    features: {
      2: [{ id: "", name: "Evocation Savant", description: "" }, { id: "", name: "Sculpt Spells", description: "" }],
      6: [{ id: "", name: "Potent Cantrip", description: "" }],
    },
  } as unknown as Subclass;

  it("emits one row per level 1..maxLevel, with dead levels as kind 'empty'", () => {
    const rows = featureRowsByLevel(wizard, undefined, 6);
    expect(rows.map((r) => r.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(rows[0]).toEqual({ level: 1, names: ["Spellcasting", "Arcane Recovery"], kind: "features" });
    expect(rows[2]).toEqual({ level: 3, names: [], kind: "empty" });
    expect(rows[4].kind).toBe("empty");
  });

  it("passes the data's generic placeholders through when no subclass is chosen", () => {
    const rows = featureRowsByLevel(wizard, undefined, 6);
    expect(rows[1]).toEqual({ level: 2, names: ["Arcane Tradition"], kind: "subclass" });
    expect(rows[5]).toEqual({ level: 6, names: ["Arcane Tradition Feature"], kind: "subclass" });
  });

  it("drops the generic term everywhere once a subclass is chosen — real features only", () => {
    const rows = featureRowsByLevel(wizard, evocation, 6);
    expect(rows[1]).toEqual({ level: 2, names: ["Evocation Savant", "Sculpt Spells"], kind: "features" });
    expect(rows[5]).toEqual({ level: 6, names: ["Potent Cantrip"], kind: "features" });
  });

  it("marker levels the chosen subclass never filled become plain 'empty' rows (strict drop)", () => {
    const sparse = {
      name: "Homebrew Tradition",
      features: { 2: [{ id: "", name: "Only Feature", description: "" }] },
    } as unknown as Subclass;
    expect(featureRowsByLevel(wizard, sparse, 6)[5]).toEqual({ level: 6, names: [], kind: "empty" });
  });

  it("synthesizes a subclass slot from hint levels for sparse homebrew classes", () => {
    const homebrew = {
      name: "Stormwarden",
      features: { 1: [{ id: "", name: "Storm Strike", description: "" }] },
    } as unknown as Class5E;
    const rows = featureRowsByLevel(homebrew, undefined, 3, [3, 7]);
    expect(rows[1]).toEqual({ level: 2, names: [], kind: "empty" });
    expect(rows[2]).toEqual({ level: 3, names: ["Subclass Feature"], kind: "subclass" });
  });

  it("returns [] when the class has no named feature data, or maxLevel < 1", () => {
    expect(featureRowsByLevel({ name: "X", features: {} } as unknown as Class5E, undefined, 5)).toEqual([]);
    expect(featureRowsByLevel(undefined, undefined, 5)).toEqual([]);
    expect(featureRowsByLevel(wizard, undefined, 0)).toEqual([]);
  });
});

describe("classSkillChoiceSpec", () => {
  it("reads options and amount from choices.skills", () => {
    expect(classSkillChoiceSpec(barbarian)).toEqual({
      options: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
      amount: 2,
    });
  });

  it("empty options (2024 Bard) mean any of the 18 skills", () => {
    const bard = { name: "Bard", choices: { skills: { options: [], amount: 3 } } } as unknown as Class5E;
    const spec = classSkillChoiceSpec(bard);
    expect(spec.options).toHaveLength(18);
    expect(spec.amount).toBe(3);
  });

  it("defaults to choose 2 when the data has no skills choice", () => {
    expect(classSkillChoiceSpec(undefined).amount).toBe(2);
  });
});

describe("grimoire helpers", () => {
  const acidSplash = {
    name: "Acid Splash",
    description: "*You hurl* a bubble of acid at one creature. It must succeed on a Dexterity save.",
    classes: ["Sorcerer", "Wizard"],
  } as unknown as Spell;

  it("isOffList marks spells on none of the character's class lists", () => {
    expect(isOffList(acidSplash, ["Barbarian", "Sorcerer"])).toBe(false);
    expect(isOffList(acidSplash, ["Druid"])).toBe(true);
  });

  it("spellFlavor strips markdown and stops at the first sentence, capped at 90 chars", () => {
    expect(spellFlavor(acidSplash)).toBe("You hurl a bubble of acid at one creature.");
    const long = { description: `${"a".repeat(200)}.`, classes: [] } as unknown as Spell;
    expect(spellFlavor(long).length).toBeLessThanOrEqual(90);
  });
});

describe("featCategory", () => {
  it("normalizes the data's category strings", () => {
    const origin = { details: { metadata: { category: "Origin Feat" } }, prerequisites: [{ type: 1, value: "4" }] } as unknown as Feat;
    const general = { details: { metadata: { category: "General Feat" } }, prerequisites: [] } as unknown as Feat;
    const style = { details: { metadata: { category: "Fighting Style Feat" } }, prerequisites: [] } as unknown as Feat;
    expect(featCategory(origin)).toBe("Origin");
    expect(featCategory(general)).toBe("General");
    expect(featCategory(style)).toBe("Other");
  });

  it("falls back to the zero-prerequisites heuristic when uncategorized (2014)", () => {
    const bare = { details: { name: "Grappler" }, prerequisites: [] } as unknown as Feat;
    const gated = { details: { name: "Grappler" }, prerequisites: [{ type: 7, value: "STR 13" }] } as unknown as Feat;
    expect(featCategory(bare)).toBe("Origin");
    expect(featCategory(gated)).toBe("General");
  });
});

describe("darkvisionRange", () => {
  it("parses a range out of trait text", () => {
    const traits = [
      { details: { name: "Darkvision", description: "You have Darkvision with a range of 60 feet." } },
    ];
    expect(darkvisionRange(traits)).toBe(60);
    expect(darkvisionRange([])).toBeUndefined();
  });
});
