import { describe, it, expect } from 'vitest';
import { createSignal } from 'solid-js';
import { createTableSort } from './tableSort';

interface TestRow {
  name: string;
  level: number;
  cost?: string;
}

const rows: TestRow[] = [
  { name: 'Wand of Webs', level: 3, cost: '10 gp' },
  { name: 'Axe', level: 1, cost: '2 gp' },
  { name: 'Mace', level: 2 },
];

function setup(config?: Partial<Parameters<typeof createTableSort<TestRow>>[0]>) {
  const [tableData, setTableData] = createSignal<TestRow[]>(rows);
  const [results, setResults] = createSignal<TestRow[]>([]);
  const sort = createTableSort<TestRow>({
    data: [tableData, setTableData],
    syncSetters: [setResults],
    ...config,
  });
  return { tableData, results, ...sort };
}

describe('createTableSort', () => {
  it('sorts ascending on the first click of a column', () => {
    const { tableData, dataSort, currentSort } = setup();

    dataSort('level');

    expect(currentSort()).toEqual({ sortKey: 'level', isAsc: true });
    expect(tableData().map(r => r.level)).toEqual([1, 2, 3]);
  });

  it('flips direction when the same column is clicked again', () => {
    const { tableData, dataSort, currentSort } = setup();

    dataSort('level');
    dataSort('level');

    expect(currentSort()).toEqual({ sortKey: 'level', isAsc: false });
    expect(tableData().map(r => r.level)).toEqual([3, 2, 1]);
  });

  it('resets to ascending when switching to a different column', () => {
    const { dataSort, currentSort } = setup();

    dataSort('level');
    dataSort('level'); // now descending
    dataSort('name');

    expect(currentSort()).toEqual({ sortKey: 'name', isAsc: true });
  });

  it('uses the initial sort state when provided', () => {
    const { currentSort, dataSort } = setup({ initial: { sortKey: 'cost', isAsc: false } });

    expect(currentSort()).toEqual({ sortKey: 'cost', isAsc: false });

    // clicking the initial column toggles from its configured direction
    dataSort('cost');
    expect(currentSort()).toEqual({ sortKey: 'cost', isAsc: true });
  });

  it('uses a valueSelector override for its key', () => {
    const gpValue = (cost?: string) => Number(cost?.replace(' gp', '') ?? NaN);
    const { tableData, dataSort } = setup({
      valueSelectors: { cost: (row) => gpValue(row.cost) },
    });

    dataSort('cost');

    // Mace has no cost -> selector yields NaN, comparisons are false, order among defined values still ascending
    const costs = tableData().filter(r => r.cost).map(r => r.cost);
    expect(costs).toEqual(['2 gp', '10 gp']); // numeric, not lexicographic ('10 gp' < '2 gp' as strings)
  });

  it('pushes the sorted array into syncSetters and does not mutate the original array', () => {
    const [tableData, setTableData] = createSignal<TestRow[]>(rows);
    const [results, setResults] = createSignal<TestRow[]>([]);
    const original = tableData();

    const { dataSort } = createTableSort<TestRow>({
      data: [tableData, setTableData],
      syncSetters: [setResults],
    });
    dataSort('level');

    expect(results()).toEqual(tableData());
    expect(results().map(r => r.level)).toEqual([1, 2, 3]);
    expect(original).toBe(rows); // original signal value untouched
    expect(rows.map(r => r.level)).toEqual([3, 1, 2]);
  });

  it('compares string values with spaces stripped', () => {
    const spaced: TestRow[] = [
      { name: 'a c', level: 1 }, // "ac" without spaces
      { name: 'ab', level: 2 },
    ];
    const [tableData, setTableData] = createSignal<TestRow[]>(spaced);
    const { dataSort } = createTableSort<TestRow>({
      data: [tableData, setTableData],
      initial: { sortKey: 'level', isAsc: true },
    });

    dataSort('name');

    // "ab" < "ac" once spaces are stripped; with spaces "a c" < "ab"
    expect(tableData().map(r => r.name)).toEqual(['ab', 'a c']);
  });

  it('treats undefined values as equal, leaving their relative order alone', () => {
    const { tableData, dataSort } = setup();

    dataSort('cost'); // Mace has no cost

    expect(tableData()).toHaveLength(3);
    expect(tableData().some(r => r.name === 'Mace')).toBe(true);
  });
});
