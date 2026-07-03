import { DiceGroup, averageDamageFromDice } from "../../customHooks/utility/tools/dndMath";
import { Background, Class5E, Feat, FeatureDetail, MagicItem, Race, Spell, Subclass } from "../../../models/generated";
import { HomebrewPreview } from "../tools/toolDispatcher";

/**
 * Deterministic "fact sheet" for the balance reviewer. dndMath.ts is NOT used to JUDGE balance (it can't
 * read prose), only to extract the numbers the LLM should reason from: the dice it found, their average,
 * and any save DC. The verdict stays the model's call — these are advisory figures appended to its prompt.
 *
 * For a CLASS or SUBCLASS the entity has no single description; its rules live across `features` keyed by
 * level. So the dice/DC scan runs over every feature's text, and the class branch adds the structural facts
 * the critic reasons about — hit die, primary ability, feature spread, and any unintended dead levels.
 */

const DICE_RE = /(\d+)\s*d\s*(\d+)/gi;
const DC_RE = /\bDC\s*(\d+)/i;
const SAVE_RE = /\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|STR|DEX|CON|INT|WIS|CHA)\s+sav(?:e|ing throw)/i;

/** Levels that carry an Ability Score Improvement in official classes — featureless here is BY DESIGN, not a dead level. */
const ASI_LEVELS = new Set([4, 8, 12, 16, 19]);

/** A balanced 5e class grants a feature at most levels, with spikes ~5/11/17 and no unintended dead levels. */
const CLASS_POWER_REFERENCE =
    "Reference: a balanced 5e class grants a feature at most levels (1-20), with bigger power spikes around " +
    "levels 5, 11, and 17, and no unintended dead levels besides the ASI levels (4, 8, 12, 16, 19). No single " +
    "feature should outclass a same-level official feature.";

/** Concatenate every feature's rules text (across all levels) so the dice/DC scan sees a class's whole body. */
function featuresText(features: Record<number, FeatureDetail[]> | undefined): string {
    if (!features) return "";
    return Object.values(features).flat().map(f => f.description ?? "").filter(Boolean).join("\n");
}

/**
 * Feature/trait rules text for the feature-bearing non-class kinds. Mirrors commandAgent.featuresOf but
 * stays local — importing commandAgent would pull the SRD/homebrew catalog graph into the readiness module.
 */
function detailTexts(preview: HomebrewPreview): string {
    switch (preview.kind) {
        case "feat":
            return (preview.entity as Feat).details?.description ?? "";
        case "race": case "subrace":
            return ((preview.entity as Race).traits ?? []).map(t => t.details?.description ?? "").filter(Boolean).join("\n");
        case "background":
            return (((preview.entity as Background).features ?? []) as FeatureDetail[]).map(f => f.description ?? "").filter(Boolean).join("\n");
        default: return "";
    }
}

function descriptionOf(preview: HomebrewPreview): string {
    switch (preview.kind) {
        case "spell": return (preview.entity as Spell).description ?? "";
        case "magic_item": return (preview.entity as MagicItem).desc ?? "";
        case "class": return featuresText((preview.entity as Class5E).features);
        case "subclass": return featuresText((preview.entity as Subclass).features);
        default: {
            // Feature-bearing kinds keep their rules in trait/feature details — scan those too, so the
            // dice/DC extraction isn't blind to everything but the summary line.
            const e = preview.entity as unknown as { description?: string; desc?: string };
            return [e.description ?? e.desc ?? "", detailTexts(preview)].filter(Boolean).join("\n");
        }
    }
}

/** The 1-20 levels that gain neither a feature nor an ASI — the "dead levels" the critic should not leave. */
function deadLevels(featureLevels: number[]): number[] {
    const have = new Set(featureLevels);
    const dead: number[] = [];
    for (let l = 1; l <= 20; l++) if (!have.has(l) && !ASI_LEVELS.has(l)) dead.push(l);
    return dead;
}

/** Structural facts for a class's feature spread, fed to the balance/consistency critic. */
function classFacts(c: Class5E): string[] {
    const lines: string[] = [];
    const chassis: string[] = [];
    if (c.hitDie?.trim()) chassis.push(`hit die ${c.hitDie.trim()}`);
    if (c.primaryAbility?.trim()) chassis.push(`primary ability ${c.primaryAbility.trim()}`);
    if (chassis.length) lines.push(`Class chassis: ${chassis.join(", ")}.`);

    const byLevel = c.features ?? {};
    const levels = Object.keys(byLevel).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    const total = levels.reduce((n, l) => n + (byLevel[l]?.length ?? 0), 0);
    if (total) lines.push(`Grants ${total} feature${total === 1 ? "" : "s"} across levels ${levels.join(", ") || "—"}.`);
    const dead = deadLevels(levels);
    if (dead.length) lines.push(`Levels with no new feature (excluding ASI levels): ${dead.join(", ")}.`);

    lines.push(CLASS_POWER_REFERENCE);
    return lines;
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
    // A class/subclass still yields structural facts (feature spread, dead levels) even if the dice scan
    // turns up nothing, so only short-circuit on an empty description for the single-description kinds.
    const isClassKind = preview.kind === "class" || preview.kind === "subclass";
    if (!text && !isClassKind) return "";

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
    } else if (preview.kind === "feat") {
        lines.push("Reference: an official feat grants either a +1 ability score increase plus a minor benefit, or one strong standalone benefit. Several strong benefits stacked in one feat is above the curve.");
    } else if (preview.kind === "race" || preview.kind === "subrace") {
        const traits = (preview.entity as Race).traits?.length ?? 0;
        if (traits) lines.push(`Grants ${traits} trait${traits === 1 ? "" : "s"}.`);
        lines.push("Reference: an official race grants 2-4 traits — ability increases, one signature trait (e.g. Darkvision or one damage resistance), and minor riders; a subrace adds 1-2 traits on top of its parent. Stacking several resistances, flight, and other combat traits together is above the curve.");
    } else if (preview.kind === "background") {
        lines.push("Reference: an official background grants two skill proficiencies, a tool or language, ~15 gp of starting equipment, and a narrative-only feature (2024 rules: plus one Origin feat). Any numeric combat bonus is above the curve.");
    } else if (preview.kind === "item") {
        lines.push("Reference: mundane gear matches the PHB tables — weapons top out at 1d8 one-handed (1d10 versatile) or 1d12 two-handed with at most one property pairing; light armor AC 11-12+Dex, medium 13-15 (Dex max 2), heavy 14-18. Anything better than its PHB peer should be a magic item with a rarity instead.");
    } else if (preview.kind === "class") {
        lines.push(...classFacts(preview.entity as Class5E));
    } else if (preview.kind === "subclass") {
        const total = Object.values((preview.entity as Subclass).features ?? {}).flat().length;
        if (total) lines.push(`Subclass grants ${total} feature${total === 1 ? "" : "s"}.`);
        lines.push("Reference: an official subclass adds ~4 features at its grant levels; each should reinterpret the base class, not eclipse it.");
    }

    return lines.length ? lines.join("\n") : "";
}
