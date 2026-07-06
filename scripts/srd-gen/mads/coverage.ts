import type { RulesetData, FeatureDetailJson } from "../types.ts";

export interface CoverageGap {
    owner: string;
    kind: string;
    feature: string;
    trigger: string;
}

/**
 * Mechanical-language triggers: a feature whose text matches one of these but carries no
 * command is either a curation gap or a justified skip — either way it must be visible.
 */
const TRIGGERS: [RegExp, string][] = [
    [/\bresistance to\b/i, "resistance"],
    [/\bimmun(e|ity) to\b/i, "immunity"],
    [/\badvantage on\b/i, "advantage"],
    [/\bdisadvantage on\b/i, "disadvantage"],
    [/\bproficien(cy|t) (in|with)\b/i, "proficiency"],
    [/\byour (base )?(walking )?speed (increases|is)\b/i, "speed"],
    [/\bspeed increases by\b/i, "speed"],
    [/\b(walking )?speed becomes\b/i, "speed set"],
    [/\b(flying|swimming|climbing|burrowing|fly|swim|climb|burrow) speed\b/i, "movement type"],
    [/\bdarkvision\b|\bblindsight\b|\btremorsense\b|\btruesight\b/i, "senses"],
    [/\bhit point maximum increases\b/i, "hp max"],
    [/\bscore increases? by\b/i, "stat increase"],
    [/\byour armor class equals\b|\bAC equals\b|\bAC = /i, "AC formula"],
    [/\battack twice\b|\bextra attack\b|\badditional attack\b/i, "extra attack"],
    [/\byou can use (this|it) .{0,40}\btimes\b/i, "limited uses"],
    [/\bnumber of times equal to\b/i, "limited uses"],
    [/\bregain(ing)? all expended uses\b/i, "limited uses"],
    [/\byou know the .{1,40} (spell|cantrip)\b|\byou learn the .{1,40} spell\b/i, "spell grant"],
    [/\byou can speak, read, and write\b/i, "language"],
    [/\bexpertise\b/i, "expertise"],
];

function firstTrigger(text: string): string | null {
    for (const [re, label] of TRIGGERS) if (re.test(text)) return label;
    return null;
}

/** Every feature with mechanical-looking text and no attached command. */
export function coverageGaps(data: RulesetData): CoverageGap[] {
    const gaps: CoverageGap[] = [];
    const check = (owner: string, kind: string, f: FeatureDetailJson) => {
        if (f.metadata?.mads?.length) return;
        const trigger = firstTrigger(`${f.name} ${f.description ?? ""}`);
        if (trigger) gaps.push({ owner, kind, feature: f.name, trigger });
    };

    for (const c of data.classes) for (const feats of Object.values(c.features ?? {})) for (const f of feats) check(c.name, "class", f);
    for (const s of data.subclasses) for (const feats of Object.values(s.features ?? {})) for (const f of feats) check(s.name, "subclass", f);
    for (const r of data.races) for (const t of r.traits ?? []) if (t.details) check(r.name, "race", t.details);
    for (const r of data.subraces) for (const t of r.traits ?? []) if (t.details) check(r.name, "subrace", t.details);
    for (const b of data.backgrounds) for (const f of b.features ?? []) check(b.name, "background", f);
    for (const f of data.feats) if (f.details) check(f.details.name, "feat", f.details);
    for (const m of data.magicItems) {
        if (m.metadata?.mads?.length) continue;
        const props = m.properties ?? {};
        const trigger = firstTrigger(`${m.name} ${m.desc ?? ""} ${props.effect ?? ""}`);
        if (trigger) gaps.push({ owner: m.name, kind: "magic_item", feature: m.name, trigger });
    }
    return gaps;
}

/**
 * Lint: a FIXED-stat AddStats attached to text that says "of your choice" is a curation
 * error — those must use the choice form (stat:"choice" + options).
 */
export function choiceWordingLint(data: RulesetData): string[] {
    const errors: string[] = [];
    const check = (owner: string, f: FeatureDetailJson) => {
        for (const m of f.metadata?.mads ?? []) {
            if (!m.command.endsWith("Stats")) continue;
            const fixed = m.value["stat"] && m.value["stat"] !== "choice";
            if (fixed && /increase .{0,60}of your choice|of your choice .{0,40}increases?/i.test(f.description ?? "")) {
                errors.push(`${owner}/${f.name}: fixed-stat ${m.command} on "of your choice" wording — use stat:"choice"`);
            }
        }
    };
    for (const c of data.classes) for (const feats of Object.values(c.features ?? {})) for (const f of feats) check(c.name, f);
    for (const s of data.subclasses) for (const feats of Object.values(s.features ?? {})) for (const f of feats) check(s.name, f);
    for (const f of data.feats) if (f.details) check(f.details.name, f.details);
    for (const b of data.backgrounds) for (const f of b.features ?? []) check(b.name, f);
    return errors;
}
