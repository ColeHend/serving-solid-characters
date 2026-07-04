import { createNewId } from "../../customHooks/utility/tools/idGen";
import { subclassMarkerInput } from "../refs/classProgression";
import { buildPreview, HomebrewPreview } from "../tools/toolDispatcher";
import type { AiToolCall } from "../types";
import type { WorkingClass, WorkingSubclass } from "./types";

/**
 * Phase G, thin slice (plan §6): turn the finished WORKING class into the savable entity. Rather than
 * map to the `models/generated` `Class5E` DTO by hand, we rebuild the exact `create_class` tool input the
 * one-shot path produced and run it through `buildPreview` — so the pipeline reuses `toClass` (the typed
 * mapper), `validateEntity` (the hard blockers), and the whole `HomebrewPreview` → Save → `addClass`
 * machinery without duplicating any of it. The result is an ordinary preview card: Save persists it via
 * the existing `saveHomebrew` path, identical to a one-shot generation.
 *
 * Subclasses (Phase E) are SEPARATE entities in the data model (`Subclass.parentClass` points at the class
 * by name — they are not embedded in `Class5E`), so they assemble to their own `create_subclass` previews
 * the same way. The pipeline emits the class preview followed by one preview per subclass.
 */

/** Rebuild the `create_class` tool-input object from the working class (the shape `toClass` reads). */
export function workingClassToToolInput(working: WorkingClass): Record<string, unknown> {
    const p = working.proficiencies;
    const features = (working.features ?? []).map(f => ({ level: f.level, name: f.name, description: f.description }));
    // The subclass-grant level is dropped from the base feature loop, so mark it here (where subclassLevel is
    // known) — otherwise that row is blank in the class table. `ensureAllClassLevels` fills the rest.
    if (working.subclassCount && working.subclassCount > 0 && working.subclassLevel) {
        features.push(subclassMarkerInput(working.name ?? "", working.subclassLevel));
    }
    return {
        name: working.name ?? "",
        hitDie: working.hitDie ?? "",
        primaryAbility: working.primaryAbility ?? "",
        savingThrows: working.savingThrows ?? [],
        skills: p?.skills ?? [],
        armor: p?.armor ?? [],
        weapons: p?.weapons ?? [],
        tools: p?.tools ?? [],
        startingEquipment: working.startingEquipment ?? [],
        casterType: working.casterType ?? "none",
        features,
    };
}

/** Rebuild the `create_subclass` tool-input object for one subclass, linked to its parent class by name. */
export function workingSubclassToToolInput(sub: WorkingSubclass, parentClass: string): Record<string, unknown> {
    return {
        name: sub.name ?? "",
        parentClass,
        description: sub.brief ?? "",
        features: (sub.features ?? []).map(f => ({ level: f.level, name: f.name, description: f.description })),
    };
}

/**
 * Assemble the working class into a `HomebrewPreview` (kind "class"). The synthetic tool-call id is fresh
 * and not part of any `outstanding` set, so confirming the card saves it and the follow-up resolve no-ops
 * harmlessly — exactly how a conversation-restored ("detached") card already behaves.
 */
export function assembleClassPreview(working: WorkingClass, dndSystem = "both"): HomebrewPreview {
    const toolCall: AiToolCall = {
        id: `genclass-${createNewId()}`,
        name: "create_class",
        input: workingClassToToolInput(working),
    };
    return buildPreview(toolCall, dndSystem);
}

/** Assemble each subclass (with at least a name) into its own savable `HomebrewPreview` (kind "subclass"). */
export function assembleSubclassPreviews(working: WorkingClass, dndSystem = "both"): HomebrewPreview[] {
    const parentClass = working.name ?? "";
    return (working.subclasses ?? [])
        .filter(s => (s.name ?? "").trim())
        .map(sub => {
            const toolCall: AiToolCall = {
                id: `gensubclass-${createNewId()}`,
                name: "create_subclass",
                input: workingSubclassToToolInput(sub, parentClass),
            };
            return buildPreview(toolCall, dndSystem);
        });
}

/**
 * Assemble the finished working class into its savable previews: the class first, then one per subclass.
 * The orchestrator hands the whole list to the host so every piece becomes an ordinary preview card.
 */
export function assembleClassPreviews(working: WorkingClass, dndSystem = "both"): HomebrewPreview[] {
    return [assembleClassPreview(working, dndSystem), ...assembleSubclassPreviews(working, dndSystem)];
}
