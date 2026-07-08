import { Accessor, Setter, createSignal } from "solid-js";
import { Clone } from "./Tools";

export interface SortState {
  sortKey: string;
  isAsc: boolean;
}

export interface TableSortConfig<T> {
  /** The tableData signal pair the sort reads from and writes back to. */
  data: [Accessor<T[]>, Setter<T[]>];
  /** Extra setters to receive the sorted array (e.g. the search-results signal feeding the Paginator). */
  syncSetters?: Setter<T[]>[];
  /** Initial sort state. Defaults to { sortKey: "name", isAsc: true }. */
  initial?: SortState;
  /** Per-key value extraction overrides for nested/derived values (e.g. cost strings). */
  valueSelectors?: Partial<Record<keyof T & string, (item: T) => string | number | boolean | undefined>>;
}

/** Natural string comparison so numeric strings order numerically ("2" < "10"). */
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/**
 * Creates table-header sorting state and a sort trigger for a data table.
 *
 * Clicking a new column sorts it ascending; clicking the same column again
 * flips the direction. The sorted array is written back to the `data` signal
 * and pushed into every `syncSetters` entry. Missing values (null/undefined/"")
 * always sort to the end.
 *
 * @example
 * const { currentSort, dataSort } = createTableSort<Background>({
 *   data: [tableData, setTableData],
 *   syncSetters: [setSearchResult],
 *   initial: { sortKey: "level", isAsc: true },
 * });
 * // <Header onClick={() => dataSort("legacy")}>
 */
export function createTableSort<T>(config: TableSortConfig<T>) {
  const [currentSort, setCurrentSort] = createSignal<SortState>(
    config.initial ?? { sortKey: "name", isAsc: true }
  );

  const dataSort = (sortBy: keyof T & string) => {
    const next = currentSort().sortKey === sortBy
      ? { sortKey: sortBy as string, isAsc: !currentSort().isAsc }
      : { sortKey: sortBy as string, isAsc: true };
    setCurrentSort(next);

    const selector = config.valueSelectors?.[sortBy];
    const getValue = (item: T) => (selector ? selector(item) : item?.[sortBy]);

    const [tableData, setTableData] = config.data;
    const sorted = Clone(tableData()).sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);

      // Missing values always sort last, regardless of direction
      const aMissing = aVal === undefined || aVal === null || aVal === "";
      const bMissing = bVal === undefined || bVal === null || bVal === "";
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;

      const cmp =
        typeof aVal === "string" && typeof bVal === "string"
          ? collator.compare(aVal, bVal)
          : aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return next.isAsc ? cmp : -cmp;
    });

    setTableData(() => sorted);
    config.syncSetters?.forEach((set) => set(() => sorted));
  };

  return { currentSort, dataSort };
}
