import { describe, expect, it } from "vitest";
import { Background, Class5E, Feat, Race, Spell, Subclass } from "../../../../models/generated";
import { EditionData, reconcileEdition } from "./reconcileEdition";
import { emptyDraft } from "./types";

const cls = (name: string, skillOptions: string[] = []): Class5E =>
  ({ name, choices: { skills: { options: skillOptions, amount: 2 } } }) as unknown as Class5E;
const feat = (name: string): Feat => ({ details: { name }, prerequisites: [] }) as unknown as Feat;

const data2014: EditionData = {
  classes: [cls("Barbarian", ["Athletics", "Survival"]), cls("Sorcerer")],
  subclasses: [{ name: "Draconic Bloodline", parentClass: "Sorcerer" } as unknown as Subclass],
  races: [{ name: "Human" } as unknown as Race],
  subraces: [],
  backgrounds: [{ name: "Acolyte" } as unknown as Background],
  feats: [feat("Grappler")],
  spells: [{ name: "Acid Splash" } as unknown as Spell],
};

const draft = () =>
  emptyDraft("2024", {
    classes: [
      { name: "Barbarian", level: 1, subclass: "", skillChoices: ["Athletics", "Perception"] },
      { name: "Sorcerer", level: 3, subclass: "Draconic Sorcery", skillChoices: [] },
    ],
    species: "Goliath",
    background: "Soldier",
    backgroundBoosts: { str: 2, con: 1 },
    feats: ["Savage Attacker", "Grappler"],
    spells: ["Acid Splash", "Sorcerous Burst"],
  });

describe("reconcileEdition", () => {
  it("keeps by-name survivors and drops the rest with a report", () => {
    const { next, dropped } = reconcileEdition(draft(), "2014", data2014);
    expect(next.edition).toBe("2014");
    expect(next.classes.map((c) => c.name)).toEqual(["Barbarian", "Sorcerer"]);
    expect(next.species).toBe("");
    expect(next.background).toBe("");
    expect(next.backgroundBoosts).toEqual({});
    expect(next.feats).toEqual(["Grappler"]);
    expect(next.spells).toEqual(["Acid Splash"]);
    expect(dropped).toContain("Goliath (species)");
    expect(dropped).toContain("Soldier (background)");
    expect(dropped).toContain("Savage Attacker (feat)");
    expect(dropped).toContain("Sorcerous Burst (spell)");
  });

  it("re-validates a kept class's subclass and skill picks", () => {
    const { next, dropped } = reconcileEdition(draft(), "2014", data2014);
    expect(next.classes[1].subclass).toBe("");
    expect(dropped).toContain("Draconic Sorcery (subclass)");
    // Perception isn't a 2014 Barbarian option in this fixture; Athletics survives.
    expect(next.classes[0].skillChoices).toEqual(["Athletics"]);
  });

  it("drops a class entirely when the target edition lacks it, reporting its level", () => {
    const homebrewless = { ...data2014, classes: [cls("Sorcerer")] };
    const { next, dropped } = reconcileEdition(draft(), "2014", homebrewless);
    expect(next.classes.map((c) => c.name)).toEqual(["Sorcerer"]);
    expect(dropped).toContain("Barbarian (class)");
  });

  it("clears species choice picks when the species drops, and filters them when it survives", () => {
    const withPicks = {
      ...draft(),
      raceAbilityChoices: ["str" as const],
      raceLanguageChoices: ["Giant"],
      raceTraitChoices: ["Firebreath"],
    };
    // Goliath doesn't exist in the 2014 fixture → species and its picks all clear.
    const dropped = reconcileEdition(withPicks, "2014", data2014).next;
    expect(dropped.species).toBe("");
    expect(dropped.raceAbilityChoices).toEqual([]);
    expect(dropped.raceLanguageChoices).toEqual([]);
    expect(dropped.raceTraitChoices).toEqual([]);

    // Human survives but defines no choice sets → the stale picks are filtered out.
    const survived = reconcileEdition({ ...withPicks, species: "Human" }, "2014", data2014).next;
    expect(survived.species).toBe("Human");
    expect(survived.raceAbilityChoices).toEqual([]);
    expect(survived.raceLanguageChoices).toEqual([]);
  });

  it("drops nothing when entering both-mode with the merged dataset (name superset)", () => {
    const merged: EditionData = {
      classes: [...data2014.classes, cls("Barbarian"), cls("Sorcerer")],
      subclasses: [
        ...data2014.subclasses,
        { name: "Draconic Sorcery", parentClass: "Sorcerer" } as unknown as Subclass,
      ],
      races: [...data2014.races, { name: "Goliath" } as unknown as Race],
      subraces: [],
      backgrounds: [...data2014.backgrounds, { name: "Soldier" } as unknown as Background],
      feats: [...data2014.feats, feat("Savage Attacker")],
      spells: [...data2014.spells, { name: "Sorcerous Burst" } as unknown as Spell],
    };
    const { next, dropped } = reconcileEdition(draft(), "both", merged);
    expect(dropped).toEqual([]);
    expect(next.edition).toBe("both");
    expect(next.species).toBe("Goliath");
    expect(next.spells).toEqual(["Acid Splash", "Sorcerous Burst"]);
  });

  it("leaving both-mode drops the other edition's picks like any single-edition switch", () => {
    const bothDraft = { ...draft(), edition: "both" as const };
    const { next, dropped } = reconcileEdition(bothDraft, "2014", data2014);
    expect(next.edition).toBe("2014");
    expect(dropped).toContain("Soldier (background)");
    expect(dropped).toContain("Sorcerous Burst (spell)");
  });

  it("leaves categories alone when their dataset is empty (still loading)", () => {
    const empty: EditionData = {
      classes: [],
      subclasses: [],
      races: [],
      subraces: [],
      backgrounds: [],
      feats: [],
      spells: [],
    };
    const { next, dropped } = reconcileEdition(draft(), "2014", empty);
    expect(dropped).toEqual([]);
    expect(next.classes).toEqual(draft().classes);
    expect(next.species).toBe("Goliath");
    expect(next.edition).toBe("2014");
  });

  it("switches silently when everything survives", () => {
    const survivor = emptyDraft("2014", {
      classes: [{ name: "Sorcerer", level: 2, subclass: "Draconic Bloodline", skillChoices: [] }],
      species: "Human",
      background: "Acolyte",
      feats: ["Grappler"],
      spells: ["Acid Splash"],
    });
    const { dropped } = reconcileEdition(survivor, "2014", data2014);
    expect(dropped).toEqual([]);
  });
});
