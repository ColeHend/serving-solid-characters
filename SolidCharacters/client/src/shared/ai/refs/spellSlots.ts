import { CasterType, Spellcasting, Spellslots, SpellKnownType } from "../../../models/generated";

/**
 * Canonical 5e spell-slot tables, so an AI-generated caster class/subclass can be STAMPED with a working
 * slot table from a single `casterType` choice — the model never has to emit slot numbers, and the
 * character sheet (which reads class.spellcasting.metadata.slots[classLevel]) renders immediately.
 *
 * Without this, a caster saves with spellcasting undefined → zero slots / zero caster level forever.
 */

// Full-caster slots by CASTER LEVEL 1-20 → [slots for spell levels 1..9] (PHB multiclass spellcaster table).
const FULL_CASTER: number[][] = [
    [],                                   // index 0 unused
    [2, 0, 0, 0, 0, 0, 0, 0, 0],          // 1
    [3, 0, 0, 0, 0, 0, 0, 0, 0],          // 2
    [4, 2, 0, 0, 0, 0, 0, 0, 0],          // 3
    [4, 3, 0, 0, 0, 0, 0, 0, 0],          // 4
    [4, 3, 2, 0, 0, 0, 0, 0, 0],          // 5
    [4, 3, 3, 0, 0, 0, 0, 0, 0],          // 6
    [4, 3, 3, 1, 0, 0, 0, 0, 0],          // 7
    [4, 3, 3, 2, 0, 0, 0, 0, 0],          // 8
    [4, 3, 3, 3, 1, 0, 0, 0, 0],          // 9
    [4, 3, 3, 3, 2, 0, 0, 0, 0],          // 10
    [4, 3, 3, 3, 2, 1, 0, 0, 0],          // 11
    [4, 3, 3, 3, 2, 1, 0, 0, 0],          // 12
    [4, 3, 3, 3, 2, 1, 1, 0, 0],          // 13
    [4, 3, 3, 3, 2, 1, 1, 0, 0],          // 14
    [4, 3, 3, 3, 2, 1, 1, 1, 0],          // 15
    [4, 3, 3, 3, 2, 1, 1, 1, 0],          // 16
    [4, 3, 3, 3, 2, 1, 1, 1, 1],          // 17
    [4, 3, 3, 3, 3, 1, 1, 1, 1],          // 18
    [4, 3, 3, 3, 3, 2, 1, 1, 1],          // 19
    [4, 3, 3, 3, 3, 2, 2, 1, 1],          // 20
];

// Warlock Pact Magic by class level 1-20 → [slotCount, slotSpellLevel] (all slots at one level).
const PACT: [count: number, level: number][] = [
    [0, 0],   // index 0 unused
    [1, 1], [2, 1], [2, 2], [2, 2], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5], [2, 5],
    [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [4, 5], [4, 5], [4, 5], [4, 5],
];

function rowToSlots(row: number[]): Spellslots {
    const s: Spellslots = {};
    for (let i = 0; i < 9; i++) {
        if (row[i] > 0) (s as Record<string, number>)[`spellSlotsLevel${i + 1}`] = row[i];
    }
    return s;
}

/** Map the tool's flat casterType string to the CasterType enum. Unknown/empty → None. */
export function parseCasterType(raw: unknown): CasterType {
    switch (String(raw ?? "").trim().toLowerCase()) {
        case "third": return CasterType.Third;
        case "half": return CasterType.Half;
        case "full": return CasterType.Full;
        case "pact": return CasterType.Pact;
        default: return CasterType.None;
    }
}

/** Build the class-level-keyed slot table for a caster type. Half/third casters start at level 2/3. */
export function buildSlotTable(ct: CasterType): Record<number, Spellslots> {
    const out: Record<number, Spellslots> = {};
    for (let level = 1; level <= 20; level++) {
        let slots: Spellslots | null = null;
        if (ct === CasterType.Full) slots = rowToSlots(FULL_CASTER[level]);
        else if (ct === CasterType.Half && level >= 2) slots = rowToSlots(FULL_CASTER[Math.ceil(level / 2)]);
        else if (ct === CasterType.Third && level >= 3) slots = rowToSlots(FULL_CASTER[Math.ceil(level / 3)]);
        else if (ct === CasterType.Pact) {
            const [count, slotLevel] = PACT[level];
            if (count > 0 && slotLevel > 0) slots = { [`spellSlotsLevel${slotLevel}`]: count } as Spellslots;
        }
        if (slots && Object.keys(slots).length) out[level] = slots;
    }
    return out;
}

/**
 * Build a complete Spellcasting block for a caster type, with a stamped slot table. Returns undefined for
 * a non-caster (None) so the entity keeps `spellcasting: undefined`. The user can still refine spells
 * known / learned spells in the editor; the slot table is what the sheet needs to function.
 */
export function buildSpellcasting(ct: CasterType): Spellcasting | undefined {
    if (ct === CasterType.None) return undefined;
    return {
        metadata: { slots: buildSlotTable(ct), casterType: ct },
        knownType: SpellKnownType.Number,
        learnedSpells: {},
    };
}
