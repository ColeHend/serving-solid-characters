import { describe, expect, it } from "vitest";
import { Background, Class5E, Feat, Race, Spell, Subclass } from "../../../../models/generated";
import { EditionData, reconcileEdition } from "./reconcileEdition";
import { emptyDraft } from "./types";

const cls = (name: string, skillOptions: string[] = []): Class5E =>
  ({ name, choices: { skills: { options: skillOptions, amount: 2 } } }) as unknown as Class5E;
const feat = (name: string, id?: string): Feat =>
  ({ id, details: { name }, prerequisites: [] }) as unknown as Feat;
const spell = (name: string, id?: string): Spell => ({ id, name }) as unknown as Spell;

const data2014: EditionData = {
  classes: [cls("Barbarian", ["Athletics", "Survival"]), cls("Sorcerer")],
  subclasses: [
    { id: "sub-draconic-14", name: "Draconic Bloodline", parentClass: "Sorcerer" } as unknown as Subclass,
  ],
  races: [{ name: "Human" } as unknown as Race],
  subraces: [],
  backgrounds: [{ name: "Acolyte" } as unknown as Background],
  feats: [feat("Grappler", "grappler-14")],
  spells: [spell("Acid Splash", "acid-14")],
};

/** The edition being LEFT — resolves the draft's spell/feat selector keys back to names. */
const source2024: EditionData = {
  classes: [cls("Barbarian"), cls("Sorcerer")],
  subclasses: [
    { id: "sub-draconic-24", name: "Draconic Sorcery", parentClass: "Sorcerer" } as unknown as Subclass,
  ],
  races: [{ name: "Goliath" } as unknown as Race],
  subraces: [],
  backgrounds: [{ name: "Soldier" } as unknown as Background],
  feats: [feat("Savage Attacker", "savage-24"), feat("Grappler", "grappler-24")],
  spells: [spell("Acid Splash", "acid-24"), spell("Sorcerous Burst", "burst-24")],
};

const draft = () =>
  emptyDraft("2024", {
    classes: [
      { name: "Barbarian", level: 1, subclass: "", skillChoices: ["Athletics", "Perception"] },
      { name: "Sorcerer", level: 3, subclass: "Draconic Sorcery", skillChoices: [] },
    ],
    species: "Goliath",
    background: "Soldier",
    abilityBonuses: { species: [], background: ["str", "con", "dex"] },
    abilityBonusStyle: { species: "standard", background: "spread" },
    feats: ["savage-24", "grappler-24"],
    spells: ["acid-24", "burst-24"],
  });

describe("reconcileEdition", () => {
  it("keeps same-name survivors re-keyed to the target edition and drops the rest with a report", () => {
    const { next, dropped } = reconcileEdition(draft(), "2014", data2014, source2024);
    expect(next.edition).toBe("2014");
    expect(next.classes.map((c) => c.name)).toEqual(["Barbarian", "Sorcerer"]);
    expect(next.species).toBe("");
    expect(next.background).toBe("");
    // Slot assignments always reset on an edition switch; the provider reseeds defaults.
    expect(next.abilityBonuses).toEqual({ species: [], background: [] });
    expect(next.abilityBonusStyle).toEqual({ species: "standard", background: "standard" });
    // Grappler exists in both editions — its key swaps to the 2014 row's.
    expect(next.feats).toEqual(["grappler-14"]);
    expect(next.spells).toEqual(["acid-14"]);
    expect(dropped).toContain("Goliath (species)");
    expect(dropped).toContain("Soldier (background)");
    expect(dropped).toContain("Savage Attacker (feat)");
    expect(dropped).toContain("Sorcerous Burst (spell)");
  });

  it("re-validates a kept class's subclass and skill picks", () => {
    const { next, dropped } = reconcileEdition(draft(), "2014", data2014, source2024);
    expect(next.classes[1].subclass).toBe("");
    expect(dropped).toContain("Draconic Sorcery (subclass)");
    // Perception isn't a 2014 Barbarian option in this fixture; Athletics survives.
    expect(next.classes[0].skillChoices).toEqual(["Athletics"]);
  });

  it("re-keys a kept subclass's selector key to the target edition's row", () => {
    const survivor = draft();
    survivor.classes[1].subclass = "Draconic Bloodline";
    survivor.classes[1].subclassId = "hb:Draconic Bloodline"; // stale pre-id key
    const { next } = reconcileEdition(survivor, "2014", data2014, source2024);
    expect(next.classes[1].subclass).toBe("Draconic Bloodline");
    expect(next.classes[1].subclassId).toBe("sub-draconic-14");
  });

  it("clears the stale selector key alongside a dropped subclass", () => {
    const withKey = draft();
    withKey.classes[1].subclassId = "hb:Draconic Sorcery";
    const { next } = reconcileEdition(withKey, "2014", data2014, source2024);
    expect(next.classes[1].subclass).toBe("");
    expect(next.classes[1].subclassId).toBeUndefined();
  });

  it("re-keys feat-or-ASI slot picks and falls back to plain ASI when the feat is gone", () => {
    const withSlots = {
      ...draft(),
      feats: [],
      featOrAsi: { "slot-1": "grappler-24", "slot-2": "savage-24", "slot-3": "asi" },
    };
    const { next, dropped } = reconcileEdition(withSlots, "2014", data2014, source2024);
    expect(next.featOrAsi).toEqual({ "slot-1": "grappler-14", "slot-2": "asi", "slot-3": "asi" });
    expect(dropped).toContain("Savage Attacker (feat)");
  });

  it("drops a class entirely when the target edition lacks it, reporting its level", () => {
    const homebrewless = { ...data2014, classes: [cls("Sorcerer")] };
    const { next, dropped } = reconcileEdition(draft(), "2014", homebrewless, source2024);
    expect(next.classes.map((c) => c.name)).toEqual(["Sorcerer"]);
    expect(dropped).toContain("Barbarian (class)");
  });

  it("clears species choice picks when the species drops, and filters them when it survives", () => {
    const withPicks = {
      ...draft(),
      abilityBonuses: { species: ["str" as const], background: [] },
      raceLanguageChoices: ["Giant"],
      raceTraitChoices: ["Firebreath"],
    };
    // Goliath doesn't exist in the 2014 fixture → species and its picks all clear.
    const dropped = reconcileEdition(withPicks, "2014", data2014, source2024).next;
    expect(dropped.species).toBe("");
    expect(dropped.abilityBonuses.species).toEqual([]);
    expect(dropped.raceLanguageChoices).toEqual([]);
    expect(dropped.raceTraitChoices).toEqual([]);

    // Human survives but defines no choice sets → the stale picks are filtered out.
    const survived = reconcileEdition({ ...withPicks, species: "Human" }, "2014", data2014, source2024).next;
    expect(survived.species).toBe("Human");
    expect(survived.abilityBonuses.species).toEqual([]);
    expect(survived.raceLanguageChoices).toEqual([]);
  });

  it("drops nothing when entering both-mode with the merged dataset (key superset)", () => {
    const merged: EditionData = {
      classes: [...data2014.classes, ...source2024.classes],
      subclasses: [...data2014.subclasses, ...source2024.subclasses],
      races: [...data2014.races, ...source2024.races],
      subraces: [],
      backgrounds: [...data2014.backgrounds, ...source2024.backgrounds],
      feats: [...data2014.feats, ...source2024.feats],
      spells: [...data2014.spells, ...source2024.spells],
    };
    const { next, dropped } = reconcileEdition(draft(), "both", merged, source2024);
    expect(dropped).toEqual([]);
    expect(next.edition).toBe("both");
    expect(next.species).toBe("Goliath");
    // Keys already present in the merged target stay untouched — no swap to the 2014 rows.
    expect(next.spells).toEqual(["acid-24", "burst-24"]);
    expect(next.feats).toEqual(["savage-24", "grappler-24"]);
  });

  it("leaving both-mode drops the other edition's picks like any single-edition switch", () => {
    const bothDraft = { ...draft(), edition: "both" as const };
    const { next, dropped } = reconcileEdition(bothDraft, "2014", data2014, source2024);
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
    const { next, dropped } = reconcileEdition(draft(), "2014", empty, empty);
    expect(dropped).toEqual([]);
    expect(next.classes).toEqual(draft().classes);
    expect(next.species).toBe("Goliath");
    expect(next.feats).toEqual(draft().feats);
    expect(next.spells).toEqual(draft().spells);
    expect(next.edition).toBe("2014");
  });

  it("re-keys a kept background's selector key to the target edition's row", () => {
    const src: EditionData = {
      ...source2024,
      backgrounds: [{ id: "acolyte-24", name: "Acolyte" } as unknown as Background],
    };
    const tgt: EditionData = {
      ...data2014,
      backgrounds: [{ id: "acolyte-14", name: "Acolyte", legacy: true } as unknown as Background],
    };
    const withBg = { ...draft(), background: "Acolyte", backgroundId: "acolyte-24" };
    const { next, dropped } = reconcileEdition(withBg, "2014", tgt, src);
    expect(next.background).toBe("Acolyte");
    expect(next.backgroundId).toBe("acolyte-14");
    expect(dropped).not.toContain("Acolyte (background)");
  });

  it("clears the stale selector key alongside a dropped background", () => {
    const withKey = { ...draft(), backgroundId: "soldier-24" };
    const { next } = reconcileEdition(withKey, "2014", data2014, source2024);
    expect(next.background).toBe("");
    expect(next.backgroundId).toBeUndefined();
  });

  it("keeps the picked both-mode row when its key resolves in the merged dataset", () => {
    // Both-mode: the 2014 and 2024 Acolytes coexist; the legacy pick must not swap to the
    // 2024 row (whose origin feat the legacy printing doesn't grant).
    const merged: EditionData = {
      ...data2014,
      backgrounds: [
        { id: "acolyte-14", name: "Acolyte", legacy: true } as unknown as Background,
        { id: "acolyte-24", name: "Acolyte", feat: "Magic Initiate (Cleric)" } as unknown as Background,
      ],
    };
    const withBg = { ...draft(), background: "Acolyte", backgroundId: "acolyte-14" };
    const { next } = reconcileEdition(withBg, "both", merged, source2024);
    expect(next.backgroundId).toBe("acolyte-14");
  });

  it("derives the recommended-feat warning from the re-keyed target row", () => {
    const src: EditionData = {
      ...data2014,
      backgrounds: [{ id: "acolyte-14", name: "Acolyte", legacy: true } as unknown as Background],
    };
    const tgt: EditionData = {
      ...source2024,
      backgrounds: [
        { id: "acolyte-24", name: "Acolyte", feat: "Magic Initiate (Cleric)" } as unknown as Background,
      ],
    };
    const withBg = { ...draft(), background: "Acolyte", backgroundId: "acolyte-14" };
    const { next, dropped } = reconcileEdition(withBg, "2024", tgt, src);
    expect(next.backgroundId).toBe("acolyte-24");
    // The 2024 fixture feats lack Magic Initiate — the warning must fire from the target row.
    expect(dropped).toContain("Magic Initiate (Cleric) (background feat)");
  });

  it("switches silently when everything survives", () => {
    const survivor = emptyDraft("2014", {
      classes: [
        {
          name: "Sorcerer",
          level: 2,
          subclass: "Draconic Bloodline",
          subclassId: "sub-draconic-14",
          skillChoices: [],
        },
      ],
      species: "Human",
      background: "Acolyte",
      feats: ["grappler-14"],
      spells: ["acid-14"],
    });
    const { next, dropped } = reconcileEdition(survivor, "2014", data2014, data2014);
    expect(dropped).toEqual([]);
    expect(next.classes[0].subclassId).toBe("sub-draconic-14");
  });
});
