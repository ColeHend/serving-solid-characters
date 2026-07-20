import { Spell } from "../../../models/generated";
import { FilterFieldConfig, matchesFields } from "../utility/tools/tableFilter";

/**
 * Filter-form choice spells: a choice-form AddSpells command ({ID:"choice"})
 * may describe its allowed list with filter fields instead of (or in addition
 * to) the explicit `options` id CSV. The player pool is the UNION of both.
 *
 * SPELL_FILTER_FIELD_KEYS, FIELD_TO_VALUE_KEY and spellFilterFields must stay
 * 1:1 — the catalog, the authoring UI, the creator picker and the spells
 * reference page all key off this module.
 */

export const SPELL_FILTER_FIELD_KEYS = [
    "filterLevel",
    "filterSchool",
    "filterClass",
    "filterCastingTime",
    "filterDamageType",
    "filterConcentration",
    "filterRitual",
] as const;
export type SpellFilterValueKey = typeof SPELL_FILTER_FIELD_KEYS[number];

/** True when the command value carries at least one non-empty filter field. */
export const hasSpellFilterValue = (value: Record<string, unknown> | undefined | null): boolean =>
    SPELL_FILTER_FIELD_KEYS.some((k) => String(value?.[k] ?? "").trim() !== "");

/**
 * True when the choice's pool is (at least partly) derived from the spell
 * catalog rather than pure explicit options: any filter field, or a bare
 * spellLevel with no options ("any spell of that level"). options present
 * with no filters keeps the pool = options only, whatever spellLevel says —
 * SRD content (Magic Initiate, High Elf Cantrip, ...) depends on that.
 */
export const hasDerivedSpellPool = (value: Record<string, unknown> | undefined | null): boolean =>
    hasSpellFilterValue(value) ||
    (String(value?.["spellLevel"] ?? "").trim() !== "" && String(value?.["options"] ?? "").trim() === "");

export const yesNo = (value: string) => (value === "true" ? "Yes" : "No");

/** The spells reference page's filter fields, shared so authoring/picking filter identically. */
export const spellFilterFields: FilterFieldConfig<Spell>[] = [
    { key: "level", label: "Level" },
    { key: "school", label: "School" },
    { key: "castingTime", label: "Casting time" },
    { key: "damageType", label: "Damage type" },
    { key: "concentration", label: "Concentration", format: yesNo },
    { key: "ritual", label: "Ritual", format: yesNo },
    { key: "classes", label: "Class", getValues: (spell) => spell.classes },
];

/** createTableFilter field key -> mad.value key. */
export const FIELD_TO_VALUE_KEY: Record<string, SpellFilterValueKey> = {
    level: "filterLevel",
    school: "filterSchool",
    castingTime: "filterCastingTime",
    damageType: "filterDamageType",
    concentration: "filterConcentration",
    ritual: "filterRitual",
    classes: "filterClass",
};

const splitCsv = (raw: string | undefined): string[] =>
    (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** mad.value filter keys -> createTableFilter selections (seeds the dialog when re-editing). */
export function filterSelectionsFromValue(
    value: Record<string, string> | undefined,
): Record<string, string[]> {
    const selections: Record<string, string[]> = {};
    for (const [fieldKey, valueKey] of Object.entries(FIELD_TO_VALUE_KEY)) {
        const values = splitCsv(value?.[valueKey]);
        if (values.length) selections[fieldKey] = values;
    }
    return selections;
}

/** createTableFilter selections -> mad.value filter keys; empty fields are omitted. */
export function serializeSpellFilter(
    selections: Record<string, string[]>,
): Record<string, string> {
    const value: Record<string, string> = {};
    for (const [fieldKey, valueKey] of Object.entries(FIELD_TO_VALUE_KEY)) {
        const values = (selections[fieldKey] ?? []).map((s) => s.trim()).filter(Boolean);
        if (values.length) value[valueKey] = values.join(",");
    }
    return value;
}

/**
 * Spells matching the command's derived-pool spec — the same AND-across-fields /
 * OR-within-a-field semantics as the spells reference page. spellLevel further
 * restricts filter matches to that level unless filterLevel is set explicitly
 * (filterLevel wins); with no filter fields at all, a bare spellLevel and no
 * options means "any spell of that level". Returns [] when the pool is purely
 * the explicit `options` ids (options present, no filters — spellLevel is only
 * a keying discriminator there); callers union the result with `options`.
 */
export function filterSpellsForChoice(
    spells: Spell[],
    value: Record<string, string> | undefined,
): Spell[] {
    const spellLevel = String(value?.["spellLevel"] ?? "").trim();
    if (hasSpellFilterValue(value)) {
        const selections = filterSelectionsFromValue(value);
        let matches = spells.filter((spell) => matchesFields(spell, spellFilterFields, selections));
        if (spellLevel !== "" && String(value?.["filterLevel"] ?? "").trim() === "") {
            matches = matches.filter((spell) => String(spell.level) === spellLevel);
        }
        return matches;
    }
    if (spellLevel !== "" && String(value?.["options"] ?? "").trim() === "") {
        return spells.filter((spell) => String(spell.level) === spellLevel);
    }
    return [];
}
