/**
 * The set of homebrew entity kinds Grimoire can generate (one per create_* tool).
 *
 * Extracted to its own leaf module (no imports) so non-AI modules — notably
 * models/userSettings.ts (tool permissions, custom review agents) — can reference the
 * union without importing toolDispatcher.ts and dragging in homebrewManager/the model
 * graph (which would create an import cycle). toolDispatcher.ts re-exports this so
 * existing `import { HomebrewKind } from "../tools/toolDispatcher"` call sites keep working.
 */
export type HomebrewKind =
    | "spell" | "item" | "magic_item" | "feat" | "background" | "race" | "subclass" | "class";

/** All kinds, in display order. Handy for permission grids and "applies to" pickers. */
export const HOMEBREW_KINDS: HomebrewKind[] = [
    "spell", "item", "magic_item", "feat", "background", "race", "subclass", "class",
];

/** Human-readable label for a kind (used in settings UIs and prompts). */
export const HOMEBREW_KIND_LABELS: Record<HomebrewKind, string> = {
    spell: "Spell",
    item: "Item",
    magic_item: "Magic Item",
    feat: "Feat",
    background: "Background",
    race: "Race",
    subclass: "Subclass",
    class: "Class",
};

/** The create_* tool name for a kind (and back). Single source of truth for the mapping. */
export const KIND_TO_TOOL: Record<HomebrewKind, string> = {
    spell: "create_spell",
    item: "create_item",
    magic_item: "create_magic_item",
    feat: "create_feat",
    background: "create_background",
    race: "create_race",
    subclass: "create_subclass",
    class: "create_class",
};

/** Inverse of KIND_TO_TOOL: the kind for a create_* tool name, or undefined. */
export const TOOL_TO_KIND: Record<string, HomebrewKind> = Object.fromEntries(
    (Object.entries(KIND_TO_TOOL) as [HomebrewKind, string][]).map(([kind, tool]) => [tool, kind]),
) as Record<string, HomebrewKind>;

/**
 * Human label for a kind, backed by HOMEBREW_KIND_LABELS — the single source of truth. Use these
 * instead of ad-hoc `kind.replace("_", " ")`, which only works because the one multi-word kind is
 * "magic_item" and silently mis-renders any future irregular label/casing.
 */
export const kindLabel = (kind: HomebrewKind): string => HOMEBREW_KIND_LABELS[kind] ?? kind;
export const kindLabelLower = (kind: HomebrewKind): string => kindLabel(kind).toLowerCase();
