import { createNewId } from "../../customHooks/utility/tools/idGen";
import { buildPreview, HomebrewPreview } from "../tools/toolDispatcher";
import type { AiToolCall } from "../types";
import type { WorkingClass } from "./types";

/**
 * Phase G, thin slice (plan §6): turn the finished WORKING class into the savable entity. Rather than
 * map to the `models/generated` `Class5E` DTO by hand, we rebuild the exact `create_class` tool input the
 * one-shot path produced and run it through `buildPreview` — so the pipeline reuses `toClass` (the typed
 * mapper), `validateEntity` (the hard blockers), and the whole `HomebrewPreview` → Save → `addClass`
 * machinery without duplicating any of it. The result is an ordinary preview card: Save persists it via
 * the existing `saveHomebrew` path, identical to a one-shot generation.
 */

/** Rebuild the `create_class` tool-input object from the working class (the shape `toClass` reads). */
export function workingClassToToolInput(working: WorkingClass): Record<string, unknown> {
    const p = working.proficiencies;
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
        features: (working.features ?? []).map(f => ({ level: f.level, name: f.name, description: f.description })),
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
