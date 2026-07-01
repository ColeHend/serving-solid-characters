import { HomebrewKind } from "../refs/homebrewKind";
import { HomebrewPreview } from "../tools/toolDispatcher";
import { featuresOf, looksMechanical } from "./commandAgent";
import { validateStoredCommand } from "./madCommandCatalog";

/**
 * Deterministic validator for the mechanical "mads" commands attached to a generated feature-bearing entity
 * (the High generation-depth check — see genPipeline/madsStep). Pure: no model calls, no DB. It re-checks
 * each stored command against the catalog so a malformed/illegal command (one the runtime sheet handlers
 * would throw on) is caught before it ships. Non-feature kinds (spell/item/magic_item) have no features, so
 * validation is a no-op for them.
 */

export interface MadsFinding {
    /** The feature whose command failed validation. */
    feature: string;
    /** Index of the command within that feature's `metadata.mads`. */
    index: number;
    /** The command string (e.g. "AddResistances"). */
    command: string;
    /** Why it's illegal (from validateStoredCommand). */
    errors: string[];
}

export interface MadsValidation {
    /** Flat, human-readable errors across every feature. Empty ⇒ all MADS commands are well-formed. */
    errors: string[];
    /** Per-command findings, so a caller can strip/repair exactly the offending commands. */
    flagged: MadsFinding[];
}

/** Validate every MADS command attached to a (feature-bearing) entity. */
export function validateMads(kind: HomebrewKind, entity: HomebrewPreview["entity"]): MadsValidation {
    const errors: string[] = [];
    const flagged: MadsFinding[] = [];
    for (const feature of featuresOf(kind, entity)) {
        const mads = feature.metadata?.mads ?? [];
        mads.forEach((mad, index) => {
            const errs = validateStoredCommand(mad);
            if (!errs.length) return;
            flagged.push({ feature: feature.name ?? "", index, command: mad.command, errors: errs });
            for (const e of errs) errors.push(`«${feature.name || "(unnamed feature)"}»: ${e}`);
        });
    }
    return { errors, flagged };
}

/**
 * Names of feature-bearing features that ended up with NO mads command — their mechanical effect is
 * unrepresented on the sheet (the generator/catalog produced nothing, or every proposal was stripped as
 * invalid). Pure and dev-only in practice: the caller logs these so a developer can add the missing
 * mechanical info. Non-feature kinds have no features, so this is an empty list for them.
 *
 * `mechanicalOnly` narrows the result to features whose text reads as granting a concrete effect
 * (`looksMechanical`), so a legitimately pure-flavor feature with no command isn't reported as a gap.
 */
export function featuresMissingMads(
    kind: HomebrewKind,
    entity: HomebrewPreview["entity"],
    mechanicalOnly = false,
): string[] {
    return featuresOf(kind, entity)
        .filter(feature => !(feature.metadata?.mads?.length))
        .filter(feature => !mechanicalOnly || looksMechanical(feature.description))
        .map(feature => feature.name ?? "(unnamed feature)");
}

/**
 * Return a CLONE of the entity with every invalid MADS command removed. The deterministic floor behind
 * validateAndRepairMads: even if the AI repair does nothing, no sheet-corrupting command can survive.
 */
export function stripInvalidMads(kind: HomebrewKind, entity: HomebrewPreview["entity"]): HomebrewPreview["entity"] {
    const clone = structuredClone(entity);
    for (const feature of featuresOf(kind, clone)) {
        if (!feature.metadata?.mads?.length) continue;
        feature.metadata.mads = feature.metadata.mads.filter(mad => validateStoredCommand(mad).length === 0);
    }
    return clone;
}
