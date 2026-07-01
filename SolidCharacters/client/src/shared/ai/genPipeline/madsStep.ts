import { AiSettings } from "../../../models/userSettings";
import { HomebrewPreview } from "../tools/toolDispatcher";
import { applyCommandsToEntity, ensureCatalogs, featuresOf, generateCommands, normalizeName } from "../commands/commandAgent";
import { stripInvalidMads, validateMads } from "../commands/validateMads";

/**
 * The High generation-depth MADS step: validate the mechanical "mads" commands already attached to
 * `preview.entity` (by the command enrichment that runs at every depth) and, when any are malformed/illegal,
 * AI-repair just the broken ones.
 *
 * Order matters: enrichment PRODUCES the commands, this VALIDATES + CORRECTS them, so it runs AFTER
 * attachCommands (the caller — aiAssistant.enrichWithCommands — sequences it). The repair is bounded to a
 * single model call and FAILS OPEN to a deterministic floor (illegal commands stripped), so it can never
 * leave the entity worse than enrichment did, and never ships a sheet-corrupting command.
 *
 * Returns the corrected entity, or null when nothing needed fixing (the caller then keeps the enriched
 * entity unchanged). Non-feature kinds never reach here (the caller gates on hasFeatures), but if they did,
 * validateMads finds no commands and this returns null.
 */
export async function validateAndRepairMads(
    preview: HomebrewPreview,
    ai: AiSettings,
    signal?: AbortSignal,
): Promise<HomebrewPreview["entity"] | null> {
    const { errors, flagged } = validateMads(preview.kind, preview.entity);
    if (!errors.length) return null;   // every command is well-formed — nothing to do

    const flaggedNames = new Set(flagged.map(f => normalizeName(f.feature)));

    // Deterministic floor: clear ALL commands on the flagged features (drops the illegal ones AND any good
    // ones on the SAME feature, so the AI re-attach below can't create duplicates). Other features untouched.
    const cleaned = structuredClone(preview.entity);
    for (const feature of featuresOf(preview.kind, cleaned)) {
        if (flaggedNames.has(normalizeName(feature.name)) && feature.metadata?.mads) {
            feature.metadata.mads = [];
        }
    }
    const cleanedPreview: HomebrewPreview = { ...preview, entity: cleaned };

    // One forced AI repair: re-propose commands, then apply ONLY the proposals for the flagged features (so
    // good commands on other features keep their original, already-validated form). Fail open to the floor.
    if (!signal?.aborted) {
        try {
            const proposed = await generateCommands(cleanedPreview, ai, signal);
            const onlyFlagged = (proposed ?? []).filter(p => flaggedNames.has(normalizeName(p.name)));
            if (onlyFlagged.length && !signal?.aborted) {
                await ensureCatalogs();   // load SRD/homebrew accessors so referenced names resolve to ids
                const { entity } = applyCommandsToEntity(cleanedPreview, onlyFlagged);
                // Final guard: strip anything the model produced that STILL doesn't validate.
                return stripInvalidMads(preview.kind, entity);
            }
        } catch (e) {
            console.error("MADS repair failed", e);
        }
    }
    // Repair produced nothing usable (or was aborted) — return the deterministically-cleaned entity.
    return stripInvalidMads(preview.kind, cleaned);
}
