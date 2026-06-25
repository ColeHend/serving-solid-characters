import { DiceGroup, averageDamageFromDice } from "../../customHooks/utility/tools/dndMath";
import { MagicItem, Spell } from "../../../models/generated";
import { HomebrewPreview } from "../toolDispatcher";

/**
 * Deterministic "fact sheet" for the balance reviewer. dndMath.ts is NOT used to JUDGE balance (it can't
 * read prose), only to extract the numbers the LLM should reason from: the dice it found, their average,
 * and any save DC. The verdict stays the model's call — these are advisory figures appended to its prompt.
 */

const DICE_RE = /(\d+)\s*d\s*(\d+)/gi;
const DC_RE = /\bDC\s*(\d+)/i;
const SAVE_RE = /\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|STR|DEX|CON|INT|WIS|CHA)\s+sav(?:e|ing throw)/i;

function descriptionOf(preview: HomebrewPreview): string {
    switch (preview.kind) {
        case "spell": return (preview.entity as Spell).description ?? "";
        case "magic_item": return (preview.entity as MagicItem).desc ?? "";
        default: {
            const e = preview.entity as unknown as { description?: string; desc?: string };
            return e.description ?? e.desc ?? "";
        }
    }
}

/** Parse all `NdM` dice in a string into DiceGroups (capped to avoid pathological inputs). */
export function parseDice(text: string): DiceGroup[] {
    const groups: DiceGroup[] = [];
    let m: RegExpExecArray | null;
    DICE_RE.lastIndex = 0;
    while ((m = DICE_RE.exec(text)) && groups.length < 20) {
        const count = parseInt(m[1], 10);
        const sides = parseInt(m[2], 10);
        if (count > 0 && sides > 1) groups.push({ count, sides });
    }
    return groups;
}

/**
 * A short advisory summary for the balance reviewer's prompt, or "" if there's nothing numeric to say.
 * Reuses dndMath's averageDamageFromDice so the figures match the rest of the app.
 */
export function balanceFacts(preview: HomebrewPreview): string {
    const text = descriptionOf(preview);
    if (!text) return "";

    const lines: string[] = [];
    const dice = parseDice(text);
    if (dice.length) {
        const avg = averageDamageFromDice(dice);
        const expr = dice.map(d => `${d.count}d${d.sides}`).join(" + ");
        lines.push(`Dice found in the text: ${expr} (averages ~${avg.toFixed(1)} if rolled together).`);
    }
    const dc = DC_RE.exec(text);
    const save = SAVE_RE.exec(text);
    if (dc) lines.push(`Stated save DC: ${dc[1]}.`);
    if (save) lines.push(`Targets a ${save[1]} saving throw.`);

    if (preview.kind === "spell") {
        const lvl = (preview.entity as Spell).level;
        lines.push(`Spell level: ${lvl === "0" ? "cantrip" : lvl}.`);
        lines.push("Reference: official damage cantrips average ~5.5 at level 1, scaling to ~22 by level 17; a 1st-level damage spell averages ~10–14, 3rd-level ~14–28, on a hit/failed save.");
    } else if (preview.kind === "magic_item") {
        lines.push(`Rarity: ${(preview.entity as MagicItem).rarity || "(unset)"}.`);
    }

    return lines.length ? lines.join("\n") : "";
}
