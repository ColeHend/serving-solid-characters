import { describe, it, expect } from "vitest";
import { COMPUTE_TOOLS, parseDiceExpression, runComputeTool } from "./computeTools";
import type { AiToolCall } from "./types";

const call = (name: string, input: Record<string, unknown>): AiToolCall => ({ id: "t", name, input });

describe("parseDiceExpression", () => {
    it("parses multiple dice groups and a flat bonus", () => {
        const { groups, flatBonus } = parseDiceExpression("2d6+1d4+3");
        expect(groups).toEqual([{ count: 2, sides: 6 }, { count: 1, sides: 4 }]);
        expect(flatBonus).toBe(3);
    });
    it("treats dN as 1dN and tolerates whitespace", () => {
        expect(parseDiceExpression(" d8 ").groups).toEqual([{ count: 1, sides: 8 }]);
    });
    it("returns no groups for unparseable input", () => {
        expect(parseDiceExpression("nonsense").groups).toHaveLength(0);
    });
});

describe("runComputeTool", () => {
    it("exposes exactly the four curated tools", () => {
        expect(COMPUTE_TOOLS.map(t => t.name).sort()).toEqual(
            ["calc_ability_modifier", "calc_attack_dpr", "calc_proficiency_bonus", "calc_save_dpr"],
        );
    });
    it("calc_ability_modifier computes the modifier", () => {
        const r = runComputeTool(call("calc_ability_modifier", { score: 16 }));
        expect(r.isError).toBe(false);
        expect(r.content).toContain("+3");
    });
    it("flags a missing required field as an error", () => {
        expect(runComputeTool(call("calc_ability_modifier", {})).isError).toBe(true);
    });
    it("calc_proficiency_bonus computes the bonus", () => {
        expect(runComputeTool(call("calc_proficiency_bonus", { level: 5 })).content).toContain("+3");
    });
    it("calc_attack_dpr returns a DPR estimate", () => {
        const r = runComputeTool(call("calc_attack_dpr", { attackBonus: 7, targetAC: 16, damageDice: "2d6", damageBonus: 4, numberOfAttacks: 2 }));
        expect(r.isError).toBe(false);
        expect(r.content).toMatch(/DPR/);
    });
    it("calc_attack_dpr errors on unreadable dice", () => {
        expect(runComputeTool(call("calc_attack_dpr", { attackBonus: 7, targetAC: 16, damageDice: "nope" })).isError).toBe(true);
    });
    it("calc_save_dpr returns expected damage", () => {
        const r = runComputeTool(call("calc_save_dpr", { saveDC: 15, targetSaveBonus: 3, damageDice: "8d6", saveType: "save_half", numberOfTargets: 3 }));
        expect(r.isError).toBe(false);
        expect(r.content).toMatch(/expected damage/);
    });
    it("errors on an unknown compute tool", () => {
        expect(runComputeTool(call("calc_unknown", {})).isError).toBe(true);
    });
});
