import { Accessor, createMemo, createSignal } from "solid-js";
import { SortState } from "./tableSort";

export type FilterPrimitive = string | number | boolean | null | undefined;

export interface FilterFieldConfig<T> {
  /** Unique id for the field; defaults to reading `item[key]`. */
  key: string;
  /** Display name used in the dialog and on chips, e.g. "School". */
  label: string;
  /** Value extraction override; return an array for multi-valued fields (e.g. classes). */
  getValues?: (item: T) => FilterPrimitive | FilterPrimitive[];
  /** Display formatting for option/chip labels (e.g. "true" -> "Yes"). */
  format?: (value: string) => string;
  /** Static option list in given order, replacing derivation from data (e.g. all six stats). */
  options?: string[];
  /** Custom match predicate replacing exact value matching (e.g. level thresholds). */
  matches?: (item: T, selected: string[]) => boolean;
}

/** Accessors into an existing createTableSort instance so the filter dialog
 *  and chips stay in sync with the column-header sort. */
export interface FilterSortBridge {
  currentSort: Accessor<SortState>;
  setSort: (state: SortState) => void;
  /** The view's default sort; removing the sort chip resets to this. */
  initial: SortState;
  /** Keys offered in the dialog's sort picker. */
  options: { key: string; label: string }[];
}

export interface TableFilterConfig<T> {
  /** Raw source data (e.g. the SRD hook memo). */
  source: Accessor<T[]>;
  fields: FilterFieldConfig<T>[];
  /** Presence enables the built-in Legacy tri-state filter. */
  legacy?: { getValue?: (item: T) => boolean | undefined };
  sort?: FilterSortBridge;
}

export type LegacyMode = "all" | "legacy" | "nonLegacy";

export type FilterChipModel =
  | { type: "value"; key: string; value: string; label: string }
  | { type: "legacy"; label: string }
  | { type: "sort"; label: string };

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** String-coerced values of `field` on `item` (multi-valued via getValues). */
export const fieldValuesOf = <T>(item: T, field: FilterFieldConfig<T>): string[] => {
  const raw = field.getValues
    ? field.getValues(item)
    : (item as Record<string, unknown>)[field.key] as FilterPrimitive;
  return (Array.isArray(raw) ? raw : [raw])
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map(String);
};

/** AND across fields, OR within a field; fields with no selection always match. */
export const matchesFields = <T>(
  item: T,
  fields: FilterFieldConfig<T>[],
  selections: Record<string, string[]>,
): boolean =>
  fields.every((field) => {
    const sel = selections[field.key] ?? [];
    if (sel.length === 0) return true;
    if (field.matches) return field.matches(item, sel);
    return sel.some((s) => fieldValuesOf(item, field).includes(s));
  });

/**
 * Headless filter state for a data table: per-field multi-select value
 * filters (distinct values derived from the source data), an optional
 * legacy tri-state, and a chip model of every active selection. Filtering
 * is AND across fields, OR within a field. Compose with `createTableSort`
 * by feeding `filteredData()` to `applySort` from an effect and passing the
 * sort instance in as `config.sort` for chip display and the dialog picker.
 */
export function createTableFilter<T>(config: TableFilterConfig<T>) {
  const [selections, setSelections] = createSignal<Record<string, string[]>>({});
  const [legacyMode, setLegacyMode] = createSignal<LegacyMode>("all");
  const fieldByKey = new Map(config.fields.map((f) => [f.key, f]));

  const isLegacyItem = (item: T) =>
    (config.legacy?.getValue?.(item) ?? (item as { legacy?: boolean }).legacy) === true;

  const distinct = createMemo(() => {
    const map = new Map<string, string[]>();
    for (const field of config.fields) {
      if (field.options) {
        map.set(field.key, field.options);
        continue;
      }
      const set = new Set<string>();
      for (const item of config.source()) fieldValuesOf(item, field).forEach((v) => set.add(v));
      map.set(field.key, [...set].sort(collator.compare));
    }
    return map;
  });

  const optionsFor = (key: string) =>
    (distinct().get(key) ?? []).map((value) => ({
      value,
      label: fieldByKey.get(key)?.format?.(value) ?? value,
    }));

  const filteredData = createMemo(() => {
    const sel = selections();
    const mode = legacyMode();
    const active = config.fields.filter((f) => (sel[f.key]?.length ?? 0) > 0);
    if (active.length === 0 && (!config.legacy || mode === "all")) return config.source();

    return config.source().filter((item) => {
      if (config.legacy && mode !== "all") {
        if (mode === "legacy" ? !isLegacyItem(item) : isLegacyItem(item)) return false;
      }
      return matchesFields(item, active, sel);
    });
  });

  // Idempotent on purpose: the library Select re-fires onChange from a tracked
  // effect whenever its value prop's signal changes, so writing an unchanged
  // selection must not produce a new selections object or the echo loops.
  const setFieldValues = (key: string, values: string[]) =>
    setSelections((old) => {
      const current = old[key] ?? [];
      if (current.length === values.length && current.every((v, i) => v === values[i])) {
        return old;
      }
      return { ...old, [key]: values };
    });

  const removeValue = (key: string, value: string) =>
    setSelections((old) => ({ ...old, [key]: (old[key] ?? []).filter((v) => v !== value) }));

  const clearAll = () => {
    setSelections({});
    setLegacyMode("all");
    config.sort?.setSort(config.sort.initial);
  };

  const chips = createMemo<FilterChipModel[]>(() => {
    const out: FilterChipModel[] = [];
    const sort = config.sort;
    if (sort) {
      const cur = sort.currentSort();
      if (cur.sortKey !== sort.initial.sortKey || cur.isAsc !== sort.initial.isAsc) {
        const label = sort.options.find((o) => o.key === cur.sortKey)?.label ?? cur.sortKey;
        out.push({ type: "sort", label: `Sort: ${label} ${cur.isAsc ? "▲" : "▼"}` });
      }
    }
    for (const field of config.fields) {
      for (const value of selections()[field.key] ?? []) {
        out.push({
          type: "value",
          key: field.key,
          value,
          label: `${field.label}: ${field.format?.(value) ?? value}`,
        });
      }
    }
    if (config.legacy && legacyMode() !== "all") {
      out.push({ type: "legacy", label: legacyMode() === "legacy" ? "Legacy only" : "Non-legacy" });
    }
    return out;
  });

  const removeChip = (chip: FilterChipModel) => {
    if (chip.type === "value") removeValue(chip.key, chip.value);
    else if (chip.type === "legacy") setLegacyMode("all");
    else config.sort?.setSort(config.sort.initial);
  };

  return {
    fields: config.fields,
    sort: config.sort,
    hasLegacy: !!config.legacy,
    selections,
    setFieldValues,
    legacyMode,
    setLegacyMode,
    optionsFor,
    filteredData,
    chips,
    removeChip,
    clearAll,
    isActive: createMemo(() => chips().length > 0),
  };
}

export type TableFilter<T> = ReturnType<typeof createTableFilter<T>>;
