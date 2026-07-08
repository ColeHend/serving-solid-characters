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

/**
 * Creates table-header sorting state and a sort trigger for a data table.
 *
 * Clicking a new column sorts it ascending; clicking the same column again
 * flips the direction. The sorted array is written back to the `data` signal
 * and pushed into every `syncSetters` entry.
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
    const getValue = (item: T) => {
      if (selector) return selector(item);
      const raw = item?.[sortBy];
      return typeof raw === "string" ? raw.replaceAll(" ", "") : raw;
    };

    const [tableData, setTableData] = config.data;
    const sorted = Clone(tableData()).sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);

      if (aVal === undefined || aVal === null || bVal === undefined || bVal === null) return 0;

      if (aVal < bVal) return next.isAsc ? -1 : 1;
      if (aVal > bVal) return next.isAsc ? 1 : -1;
      return 0;
    });

    setTableData(() => sorted);
    config.syncSetters?.forEach((set) => set(() => sorted));
  };

  return { currentSort, dataSort };
}
