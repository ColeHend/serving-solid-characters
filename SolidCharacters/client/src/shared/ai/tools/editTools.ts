import { AiToolDef } from "../types";
import { HOMEBREW_KINDS } from "../refs/homebrewKind";

/**
 * edit_homebrew — a single, generic diff-patch tool for editing EXISTING homebrew (one tool, not eight,
 * for small-model reliability). It emits ONLY the fields that change as a list of patch ops; the
 * dispatcher (buildEditPreview) locates the entity, applies the patch to a clone, and surfaces a diff the
 * user accepts/rejects. Routed as the "edit" category in toolCategory.ts.
 */
export const EDIT_HOMEBREW_TOOL: AiToolDef = {
    name: "edit_homebrew",
    description:
        "Edit an EXISTING piece of homebrew by changing only specific fields (a diff). Use this instead of create_* when the user wants to modify something they already have — it preserves every other field and the user reviews the diff. Look it up first with lookup_homebrew if you're unsure of the current contents. " +
        "Each change has a dot/bracket `path`, an `op` (set/add/remove) and a `value`. " +
        "Example: {\"kind\":\"spell\",\"name\":\"Fireball\",\"changes\":[{\"path\":\"range\",\"op\":\"set\",\"value\":\"200 feet\"}]}. " +
        "Nested example (a class feature): {\"path\":\"features.3.0.description\",\"op\":\"set\",\"value\":\"...\"}. Add to a list: {\"path\":\"classes\",\"op\":\"add\",\"value\":\"Bard\"}.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            kind: { type: "string", enum: [...HOMEBREW_KINDS], description: "The kind of homebrew to edit: spell, item, magic_item, feat, background, race, subclass, or class." },
            name: { type: "string", description: "The exact name of the existing homebrew entity to edit." },
            parentClass: { type: "string", description: "Required only for a subclass — its parent class, to disambiguate." },
            changes: {
                type: "array",
                description: "The field changes to apply. Only include fields that actually change.",
                items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        path: { type: "string", description: "Dot/bracket path to the field, e.g. \"range\", \"classes\", or \"features.3.0.description\"." },
                        op: { type: "string", enum: ["set", "add", "remove"], description: "set replaces the value; add appends to a list (or text); remove deletes a field or list item." },
                        value: { description: "The new value (for set) or the item to append (for add). Omit for remove." },
                    },
                    required: ["path", "op"],
                },
            },
        },
        required: ["kind", "name", "changes"],
    },
};

export const EDIT_TOOLS: AiToolDef[] = [EDIT_HOMEBREW_TOOL];
