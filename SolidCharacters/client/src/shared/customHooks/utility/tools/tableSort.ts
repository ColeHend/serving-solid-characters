import { Accessor, Setter, createSignal, untrack } from "solid-js";
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

  const sortAndWrite = (data: T[], state: SortState) => {
    const sortBy = state.sortKey as keyof T & string;
    const selector = config.valueSelectors?.[sortBy];
    const getValue = (item: T) => (selector ? selector(item) : item?.[sortBy]);

    const sorted = Clone(data).sort((a, b) => {
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
      return state.isAsc ? cmp : -cmp;
    });

    const [, setTableData] = config.data;
    setTableData(() => sorted);
    config.syncSetters?.forEach((set) => set(() => sorted));
  };

  const dataSort = (sortBy: keyof T & string) => {
    const next = currentSort().sortKey === sortBy
      ? { sortKey: sortBy as string, isAsc: !currentSort().isAsc }
      : { sortKey: sortBy as string, isAsc: true };
    setCurrentSort(next);

    const [tableData] = config.data;
    sortAndWrite(tableData(), next);
  };

  /**
   * Sorts `data` by the current sort state and writes it to the data signal
   * and every `syncSetters` entry. Call from an effect when async source data
   * arrives so the table content matches the sort indicator. Reads the sort
   * state untracked, so such an effect only re-runs when the source changes.
   */
  const applySort = (data: T[]) => sortAndWrite(data, untrack(currentSort));

  /**
   * Sets an exact sort state (key + direction) and re-sorts the current table
   * data, unlike `dataSort` which toggles. Used by controls that pick a full
   * sort state, e.g. a filter dialog's sort picker or a sort-chip reset.
   * No-ops on an unchanged state so controls that echo their value from a
   * tracked effect (e.g. the library Select) cannot loop.
   */
  const setSort = (next: SortState) => {
    const current = untrack(currentSort);
    if (current.sortKey === next.sortKey && current.isAsc === next.isAsc) return;
    setCurrentSort(next);
    const [tableData] = config.data;
    sortAndWrite(tableData(), next);
  };

  return { currentSort, dataSort, applySort, setSort };
}
