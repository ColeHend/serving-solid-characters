import { describe, expect, it } from "vitest";
import { Stats } from "../../../../shared/customHooks/dndInfo/useCharacters";
import { ChecklistInputs, buildChecklist, checklistReady } from "./checklist";

const scores = (all: number): Stats => ({ str: all, dex: all, con: all, int: all, wis: all, cha: all });

const baseInputs = (): ChecklistInputs => ({
  name: "Verity",
  classes: [
    {
      name: "Barbarian",
      level: 3,
      subclass: "Berserker",
      skillChoicesCount: 2,
      skillChoiceAmount: 2,
      subclassUnlockLevel: 3,
      hasSubclasses: true,
    },
  ],
  species: "Human",
  lineageExpected: false,
  lineage: "",
  background: "Soldier",
  abilityMethod: "standard",
  baseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
  rolledPool: [],
  boostsExpected: true,
  boostsApplied: true,
  isCaster: false,
  spellsKnown: 0,
  pendingFeatureChoices: 0,
});

describe("buildChecklist", () => {
  it("marks a complete draft all done and ready", () => {
    const rows = buildChecklist(baseInputs());
    expect(rows.every((row) => row.status === "done")).toBe(true);
    expect(checklistReady(rows)).toBe(true);
  });

  it("warns when a selected subclass no longer resolves, and stays quiet when it does", () => {
    const resolved = buildChecklist(baseInputs());
    expect(resolved.find((row) => row.id === "subclassMissing")).toBeUndefined();

    const inputs = baseInputs();
    inputs.classes[0].subclassUnresolved = true;
    const rows = buildChecklist(inputs);
    const row = rows.find((r) => r.id === "subclassMissing");
    expect(row?.status).toBe("warn");
    expect(row?.detail).toContain("Berserker");
    // Advisory only — an unresolved subclass must not block saving.
    expect(checklistReady(rows)).toBe(true);
  });

  it("flags the empty draft's required steps as todos", () => {
    const rows = buildChecklist({
      ...baseInputs(),
      name: "",
      classes: [],
      species: "",
      background: "",
      boostsExpected: false,
    });
    const byId = Object.fromEntries(rows.map((row) => [row.id, row.status]));
    expect(byId.name).toBe("todo");
    expect(byId.class).toBe("todo");
    expect(byId.species).toBe("todo");
    expect(byId.background).toBe("todo");
    expect(checklistReady(rows)).toBe(false);
  });

  it("warns on leftover point-buy budget and completes when spent", () => {
    const unspent = buildChecklist({
      ...baseInputs(),
      abilityMethod: "pointbuy",
      baseScores: scores(8),
    }).find((row) => row.id === "abilities");
    expect(unspent?.status).toBe("warn");
    expect(unspent?.detail).toContain("27");

    const spent = buildChecklist({
      ...baseInputs(),
      abilityMethod: "pointbuy",
      // 15/15/15 + 8/8/8 costs exactly 27.
      baseScores: { str: 15, dex: 15, con: 15, int: 8, wis: 8, cha: 8 },
    }).find((row) => row.id === "abilities");
    expect(spent?.status).toBe("done");
  });

  it("asks the roll method to roll first, then to assign", () => {
    const unrolled = buildChecklist({
      ...baseInputs(),
      abilityMethod: "roll",
      baseScores: scores(0),
      rolledPool: [],
    }).find((row) => row.id === "abilities");
    expect(unrolled?.detail).toContain("Roll");

    const unassigned = buildChecklist({
      ...baseInputs(),
      abilityMethod: "roll",
      baseScores: { str: 12, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      rolledPool: [12, 11, 10, 10, 9, 8],
    }).find((row) => row.id === "abilities");
    expect(unassigned?.status).toBe("todo");
    expect(unassigned?.detail).toContain("5");
  });

  it("warns a caster with no spells and an unlocked subclass left unchosen", () => {
    const rows = buildChecklist({
      ...baseInputs(),
      classes: [
        {
          name: "Sorcerer",
          level: 3,
          subclass: "",
          skillChoicesCount: 1,
          skillChoiceAmount: 2,
          subclassUnlockLevel: 3,
          hasSubclasses: true,
        },
      ],
      isCaster: true,
      spellsKnown: 0,
    });
    const byId = Object.fromEntries(rows.map((row) => [row.id, row]));
    expect(byId.spells.status).toBe("warn");
    expect(byId.subclass.status).toBe("warn");
    expect(byId.classSkills.status).toBe("warn");
    expect(byId.classSkills.detail).toContain("Sorcerer 1/2");
    // Warnings alone don't block saving.
    expect(checklistReady(rows)).toBe(true);
  });

  it("expects a lineage only when the species offers one", () => {
    const rows = buildChecklist({ ...baseInputs(), lineageExpected: true, lineage: "" });
    expect(rows.find((row) => row.id === "lineage")?.status).toBe("warn");
    const withLineage = buildChecklist({ ...baseInputs(), lineageExpected: true, lineage: "Hill Dwarf" });
    expect(withLineage.find((row) => row.id === "lineage")?.status).toBe("done");
  });
});
