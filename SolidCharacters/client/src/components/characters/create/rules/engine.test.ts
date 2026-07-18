import { describe, expect, it } from "vitest";
import { CasterType, Class5E, Feat, Spell, Subclass } from "../../../../models/generated";
import { Stats } from "../../../../shared/customHooks/dndInfo/useCharacters";
import {
  casterTypeLabel,
  classSkillChoiceSpec,
  collectLanguages,
  computeAc,
  computeFinalScores,
  computeInitiative,
  computeMaxHp,
  computePassivePerception,
  computeSavingThrows,
  computeSkillRows,
  computeSpellcasting,
  darkvisionRange,
  featCategory,
  getProficiencyBonus,
  hitDieSides,
  isOffList,
  multiclassCasterLevel,
  spellFlavor,
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

const classByName = (name: string) =>
  ({ barbarian, sorcerer } as Record<string, Class5E>)[name.toLowerCase()];

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

  it("initiative stays at DEX mod with Alert (design behavior, RAW behind the constant)", () => {
    expect(computeInitiative(3, ["Alert"], 2)).toBe(3);
    expect(computeInitiative(3, [], 2)).toBe(3);
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

describe("computeFinalScores", () => {
  const base: Stats = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };
  const zero: Stats = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

  it("2024 applies background boosts, ignores race", () => {
    const race = { abilityBonuses: [{ stat: 1, value: 2 }] } as never;
    const out = computeFinalScores("2024", base, { ...zero, dex: 2 }, { str: 2, int: 1 }, race);
    expect(out).toEqual({ str: 17, dex: 16, con: 13, int: 13, wis: 10, cha: 8 });
  });

  it("2014 applies race/subrace bonuses automatically, ignores background boosts", () => {
    const race = { abilityBonuses: [{ stat: 1, value: 2 }] } as never; // DEX +2
    const subrace = { abilityBonuses: [{ stat: 3, value: 1 }] } as never; // INT +1
    const out = computeFinalScores("2014", base, zero, { str: 2 }, race, subrace);
    expect(out).toEqual({ str: 15, dex: 16, con: 13, int: 13, wis: 10, cha: 8 });
  });

  it("an ALL race bonus raises every score", () => {
    const race = { abilityBonuses: [{ stat: 7, value: 1 }] } as never; // Human 2014
    const out = computeFinalScores("2014", base, zero, {}, race);
    expect(out).toEqual({ str: 16, dex: 15, con: 14, int: 13, wis: 11, cha: 9 });
  });

  it("both-mode: a legacy species grants its own bonuses (paired legacy background has no boosts)", () => {
    const race = { legacy: true, abilityBonuses: [{ stat: 1, value: 2 }] } as never; // DEX +2
    const out = computeFinalScores("both", base, zero, {}, race);
    expect(out).toEqual({ str: 15, dex: 16, con: 13, int: 12, wis: 10, cha: 8 });
  });

  it("both-mode: a current species grants nothing — background boosts apply instead", () => {
    const race = { abilityBonuses: [{ stat: 1, value: 2 }] } as never; // 2024 row, no legacy flag
    const out = computeFinalScores("both", base, zero, { str: 2, int: 1 }, race);
    expect(out).toEqual({ str: 17, dex: 14, con: 13, int: 13, wis: 10, cha: 8 });
  });

  it("applies the race's abilityBonusChoice picks (2014 Half-Elf's two +1s)", () => {
    const halfElf = {
      abilityBonuses: [{ stat: 5, value: 2 }], // CHA +2 fixed
      abilityBonusChoice: {
        amount: 2,
        choices: [0, 1, 2, 3, 4].map((stat) => ({ stat, value: 1 })),
      },
    } as never;
    const out = computeFinalScores("2014", base, zero, {}, halfElf, undefined, ["str", "con"]);
    expect(out).toEqual({ str: 16, dex: 14, con: 14, int: 12, wis: 10, cha: 10 });
  });

  it("caps abilityBonusChoice picks at the allowed amount and ignores off-list picks", () => {
    const race = {
      abilityBonuses: [],
      abilityBonusChoice: { amount: 1, choices: [{ stat: 0, value: 1 }] },
    } as never;
    const out = computeFinalScores("2014", base, zero, {}, race, undefined, ["dex", "str"]);
    // DEX isn't in the choice list; STR is second but the cap of 1 already consumed the pick.
    expect(out).toEqual(base);
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

  it("casterTypeLabel maps the enum, defaulting to Martial", () => {
    expect(casterTypeLabel(barbarian)).toBe("Martial");
    expect(casterTypeLabel(sorcerer)).toBe("Full caster");
  });

  it("multiclassCasterLevel sums full/half/third", () => {
    const paladin = {
      name: "Paladin",
      spellcasting: { metadata: { casterType: CasterType.Half, slots: {} } },
    } as unknown as Class5E;
    const lookup = (n: string) => (n === "Paladin" ? paladin : classByName(n));
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
