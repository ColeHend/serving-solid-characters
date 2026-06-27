import { getAbilityModifier, signed } from "../../customHooks/utility/tools/dndMath";
import { ABILITY_KEYS } from "./types";
import type { PipelineType, WorkingCharacter, WorkingClass, WorkingEntity } from "./types";

/**
 * The carry-forward digest (plan §5.2 / spec §5.2): a COMPACT summary of everything decided so far, fed
 * into each step so the model treats new content as an extension of the working object rather than a
 * contradiction. Deliberately terse — it competes with the brief, the scoped homebrew, and the step task
 * for the local model's limited context, so it lists facts, not prose.
 *
 * e.g. class:     "Class «Stormwarden»; d8; primary STR; full caster; features: Rage (L1), Reckless (L2)"
 *      character: "L5 Hill Dwarf Barbarian (Soldier); STR16/CON15; skills: Athletics, Intimidation"
 */
export function summarize(working: WorkingEntity, type: PipelineType): string {
    return type === "class"
        ? summarizeClass(working as WorkingClass)
        : summarizeCharacter(working as WorkingCharacter);
}

function summarizeClass(c: WorkingClass): string {
    const parts: string[] = [];
    parts.push(`Class «${c.name?.trim() || "(unnamed)"}»`);
    if (c.hitDie?.trim()) parts.push(c.hitDie.trim());
    if (c.primaryAbility?.trim()) parts.push(`primary ${c.primaryAbility.trim()}`);
    if (c.casterType && c.casterType !== "none") parts.push(`${c.casterType} caster`);
    if (c.coreMechanic?.trim()) parts.push(`core: ${c.coreMechanic.trim()}`);
    if (c.savingThrows?.length) parts.push(`saves: ${c.savingThrows.join(", ")}`);
    if (c.features?.length) parts.push(`features: ${featureList(c.features)}`);
    if (c.subclasses?.length) parts.push(`subclasses: ${c.subclasses.map(s => s.name).filter(Boolean).join(", ")}`);
    return parts.join("; ");
}

function summarizeCharacter(ch: WorkingCharacter): string {
    const parts: string[] = [];
    const identity = [
        ch.level ? `L${ch.level}` : "",
        ch.lineage?.trim() ?? "",
        ch.className?.trim() ?? "",
    ].filter(Boolean).join(" ");
    const withBackground = ch.background?.trim() ? `${identity} (${ch.background.trim()})` : identity;
    if (withBackground.trim()) parts.push(withBackground.trim());

    if (ch.abilityScores && Object.keys(ch.abilityScores).length) parts.push(abilityLine(ch.abilityScores));
    if (ch.skills?.length) parts.push(`skills: ${ch.skills.join(", ")}`);
    if (ch.savingThrows?.length) parts.push(`saves: ${ch.savingThrows.map(s => s.toUpperCase()).join(", ")}`);
    if (ch.casterType && ch.casterType !== "none") parts.push(`${ch.casterType} caster`);
    if (ch.features?.length) parts.push(`features: ${featureList(ch.features)}`);
    if (ch.spells?.length) parts.push(`spells: ${ch.spells.join(", ")}`);
    return parts.join("; ");
}

/** "Rage (L1), Reckless Attack (L2)" — features in level order, blanks dropped. */
function featureList(features: { name: string; level: number }[]): string {
    return features
        .filter(f => f.name?.trim())
        .slice()
        .sort((a, b) => a.level - b.level)
        .map(f => `${f.name.trim()} (L${f.level})`)
        .join(", ");
}

/** "STR16(+3)/CON15(+2)" — only the abilities that have been assigned, in canonical order. */
function abilityLine(scores: Partial<Record<typeof ABILITY_KEYS[number], number>>): string {
    return ABILITY_KEYS
        .filter(k => scores[k] != null)
        .map(k => `${k.toUpperCase()}${scores[k]}(${signed(getAbilityModifier(scores[k]!))})`)
        .join("/");
}
