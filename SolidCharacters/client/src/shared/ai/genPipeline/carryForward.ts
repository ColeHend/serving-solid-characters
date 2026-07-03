import { getAbilityModifier, signed } from "../../customHooks/utility/tools/dndMath";
import { ABILITY_KEYS } from "./types";
import type { PipelineType, WorkingCharacter, WorkingClass, WorkingEntity, WorkingSubclass } from "./types";

/**
 * The carry-forward digest (plan §5.2 / spec §5.2): a summary of everything decided so far, fed into each
 * step so the model treats new content as an extension of the working object rather than a contradiction.
 * Facts stay terse, but prior FEATURES carry a bounded slice of their actual rules text (`featureList`):
 * a level-13 feature can only avoid duplicating or stacking an earlier feature's numbers if it can see
 * them — names alone made cross-feature coordination impossible. At numCtx 16384 the worst case
 * (~20 features × ~1 line) is well within budget; DIGEST_CHARS bounds it if descriptions balloon.
 *
 * e.g. class:  "Class «Stormwarden»; d8; primary STR; full caster; features:
 *               - Rage (L1): While raging you gain +2 melee damage and resistance to…"
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

    // The ability-scores step is told the priority order lives in DECIDED SO FAR (trainedIn.ts), so it
    // must actually be here — omitting it forces the model to guess the primary from the class name.
    if (ch.abilityPriority?.length) parts.push(`ability priority: ${ch.abilityPriority.map(a => a.toUpperCase()).join(" > ")}`);
    if (ch.abilityScores && Object.keys(ch.abilityScores).length) parts.push(abilityLine(ch.abilityScores));
    if (ch.skills?.length) parts.push(`skills: ${ch.skills.join(", ")}`);
    if (ch.savingThrows?.length) parts.push(`saves: ${ch.savingThrows.map(s => s.toUpperCase()).join(", ")}`);
    if (ch.casterType && ch.casterType !== "none") parts.push(`${ch.casterType} caster`);
    if (ch.features?.length) parts.push(`features: ${featureList(ch.features)}`);
    if (ch.spells?.length) parts.push(`spells: ${ch.spells.join(", ")}`);
    if (ch.equipment?.length) parts.push(`gear: ${ch.equipment.join(", ")}`);
    return parts.join("; ");
}

/**
 * The carry-forward digest fed to a SUBCLASS feature step (Phase E): the base class's identity plus the
 * subclass being built (its brief + the features it has so far), so each subclass feature extends its own
 * subclass — not the base class and not a sibling. Terse, like `summarize`.
 *
 * e.g. "Subclass «Path of the Tempest» of «Stormwarden» (d10, primary STR; core: Charge…); brief: turns
 *       Charge into chained lightning; features: Storm's Wrath (L3)"
 */
export function summarizeSubclass(working: WorkingClass, sub: WorkingSubclass): string {
    const parts: string[] = [];
    parts.push(`Subclass «${sub.name?.trim() || "(unnamed)"}» of «${working.name?.trim() || "(unnamed)"}»`);
    const classFacts = [
        working.hitDie?.trim(),
        working.primaryAbility?.trim() ? `primary ${working.primaryAbility.trim()}` : "",
        working.coreMechanic?.trim() ? `core: ${working.coreMechanic.trim()}` : "",
    ].filter(Boolean).join("; ");
    if (classFacts) parts.push(`base class — ${classFacts}`);
    // Base-class feature names (no text — the subclass varies the class, it doesn't rewrite it) so a
    // subclass feature can't unknowingly duplicate something the base class already grants.
    if (working.features?.length) parts.push(`base features: ${featureNames(working.features)}`);
    if (sub.brief?.trim()) parts.push(`brief: ${sub.brief.trim()}`);
    if (sub.features?.length) parts.push(`features: ${featureList(sub.features)}`);
    return parts.join("; ");
}

/** Per-feature rules-text budget in the digest — enough for the numbers, bounded so 20 features can't flood. */
const DIGEST_CHARS = 200;

/**
 * Features in level order, each with its resource tag and a bounded slice of rules text — the numbers a
 * later feature must coordinate with. Multi-line ("- Name (Ln): text") so the block stays scannable.
 */
function featureList(features: { name: string; level: number; description?: string; resource?: string }[]): string {
    const lines = features
        .filter(f => f.name?.trim())
        .slice()
        .sort((a, b) => a.level - b.level)
        .map(f => {
            const desc = (f.description ?? "").replace(/\s+/g, " ").trim();
            const clipped = desc.length > DIGEST_CHARS ? `${desc.slice(0, DIGEST_CHARS).trimEnd()}…` : desc;
            const resource = f.resource?.trim() ? ` [${f.resource.trim()}]` : "";
            return `- ${f.name.trim()} (L${f.level})${resource}${clipped ? `: ${clipped}` : ""}`;
        });
    return lines.length ? `\n${lines.join("\n")}` : "";
}

/** "Rage (L1), Reckless Attack (L2)" — names only, for context where full text would drown the step. */
function featureNames(features: { name: string; level: number }[]): string {
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
