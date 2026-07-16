// Shared (non-JSX) types and pure helpers for the Equipment step's structured choice
// builder. Leaf module: wizard.shared.ts imports FROM here, so nothing in this file may
// import from wizard.shared.ts.
//
// Serialization contract (backward compatible with the saved class format): each option
// collapses to a comma-joined human string ("Chain Mail, Javelin x8, 155 GP") stored in
// choices["equipment_N"].options. Round-tripping is lossless regardless of whether a
// segment is recognised as a real item — unmatched segments simply become custom chips.

export type EquipmentEntryKind = 'item' | 'custom';

export interface EquipmentEntry {
  kind: EquipmentEntryKind;
  /** Canonical item name, or the custom text verbatim. */
  name: string;
  /** Item entries only; >= 1. Absent means 1. */
  qty?: number;
}

export interface EquipmentOption {
  entries: EquipmentEntry[];
}

export interface EquipmentChoice {
  /** The UI enforces at least two options ("or" semantics). */
  options: EquipmentOption[];
}

export const emptyEquipmentChoice = (): EquipmentChoice => ({
  options: [{ entries: [] }, { entries: [] }],
});

// ---------------------------------------------------------------------------
// Serialize: entries -> human-readable option string

export const entryToString = (e: EquipmentEntry): string =>
  e.kind === 'item' && (e.qty ?? 1) > 1 ? `${e.name} x${e.qty}` : e.name;

export const optionToString = (o: EquipmentOption): string =>
  (o.entries ?? []).map(entryToString).map((s) => s.trim()).filter(Boolean).join(', ');

// ---------------------------------------------------------------------------
// Parse: option string -> entries

/** "Javelin x8" / "Javelin ×8" — a suffix only this serializer emits, so it marks an
 *  item entry even when the item list isn't available for name matching. */
const QTY_RE = /^(.+?)\s*[x×]\s*(\d+)$/i;

/** knownItems maps lowercased name -> canonical name; absent = skip item matching. */
export function parseSegment(seg: string, knownItems?: Map<string, string>): EquipmentEntry {
  const cleaned = seg.replace(/^and\s+/i, '').trim();
  const qtyMatch = QTY_RE.exec(cleaned);
  if (qtyMatch) {
    const base = qtyMatch[1].trim();
    return {
      kind: 'item',
      name: knownItems?.get(base.toLowerCase()) ?? base,
      qty: Number(qtyMatch[2]),
    };
  }
  const canonical = knownItems?.get(cleaned.toLowerCase());
  if (canonical) return { kind: 'item', name: canonical, qty: 1 };
  return { kind: 'custom', name: cleaned };
}

export function parseOptionString(raw: string, knownItems?: Map<string, string>): EquipmentEntry[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((seg) => parseSegment(seg, knownItems));
}

// ---------------------------------------------------------------------------
// Interactive mutations — every function returns a NEW option object so callers can
// rebuild the FormGroup array immutably.

export function addItemEntry(o: EquipmentOption, name: string): EquipmentOption {
  const idx = o.entries.findIndex(
    (e) => e.kind === 'item' && e.name.toLowerCase() === name.toLowerCase(),
  );
  if (idx >= 0) {
    return {
      entries: o.entries.map((e, i) => (i === idx ? { ...e, qty: (e.qty ?? 1) + 1 } : e)),
    };
  }
  return { entries: [...o.entries, { kind: 'item', name, qty: 1 }] };
}

export function addCustomEntry(o: EquipmentOption, text: string): EquipmentOption {
  const cleaned = text.trim();
  if (!cleaned) return o;
  return { entries: [...o.entries, { kind: 'custom', name: cleaned }] };
}

export function removeEntry(o: EquipmentOption, index: number): EquipmentOption {
  return { entries: o.entries.filter((_, i) => i !== index) };
}

/** qty <= 0 removes the entry. */
export function setEntryQty(o: EquipmentOption, index: number, qty: number): EquipmentOption {
  if (qty <= 0) return removeEntry(o, index);
  return { entries: o.entries.map((e, i) => (i === index ? { ...e, qty } : e)) };
}

// ---------------------------------------------------------------------------
// Migration / status

interface LegacyEquipmentChoice {
  a: string;
  b: string;
}

export function isLegacyChoice(v: unknown): v is LegacyEquipmentChoice {
  return (
    !!v && typeof v === 'object' &&
    typeof (v as LegacyEquipmentChoice).a === 'string' &&
    typeof (v as LegacyEquipmentChoice).b === 'string' &&
    !Array.isArray((v as EquipmentChoice).options)
  );
}

/** Coerces persisted data (old {a,b} drafts or the current structured shape) into
 *  EquipmentChoice[]. Unknown shapes are dropped; a non-array becomes []. */
export function coerceEquipmentChoices(raw: unknown, knownItems?: Map<string, string>): EquipmentChoice[] {
  if (!Array.isArray(raw)) return [];
  const out: EquipmentChoice[] = [];
  for (const c of raw) {
    if (isLegacyChoice(c)) {
      out.push({
        options: [
          { entries: parseOptionString(c.a, knownItems) },
          { entries: parseOptionString(c.b, knownItems) },
        ],
      });
    } else if (c && typeof c === 'object' && Array.isArray((c as EquipmentChoice).options)) {
      out.push(c as EquipmentChoice);
    }
  }
  return out;
}

export const choiceHasContent = (c: EquipmentChoice): boolean =>
  (c?.options ?? []).some((o) => (o?.entries?.length ?? 0) > 0);
