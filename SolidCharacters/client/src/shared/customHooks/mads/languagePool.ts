/**
 * Canonical language pool for choice-form Languages commands.
 *
 * LEAF MODULE (like spellChoiceFilters.ts): no internal imports, so the mads runtime
 * (useMadCharacters.ts), the AI catalog (madCommandCatalog.ts), and the picker/editor UI can all
 * depend on it without cycles.
 */

/** Every SRD language — the derived pool for a choice-form Languages command with no options CSV. */
export const ALL_LANGUAGES: readonly string[] = [
    "Common", "Undercommon", "Abyssal", "Infernal", "Celestial", "Primordial", "Draconic",
    "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc", "Sylvan", "Deep Speech",
];

/**
 * True when a choice-form Languages command draws from ALL languages rather than a curated list
 * (no options CSV). Mirrors hasDerivedSpellPool: membership can't be checked against the empty
 * options list, so resolvers validate count only and trust the picker (the only writer).
 */
export const hasDerivedLanguagePool = (value: Record<string, string> | undefined | null): boolean =>
    String(value?.["options"] ?? "").trim() === "";
