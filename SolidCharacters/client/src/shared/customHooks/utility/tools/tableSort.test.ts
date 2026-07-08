import { describe, it, expect } from 'vitest';
import { createSignal } from 'solid-js';
import { createTableSort } from './tableSort';
import { costToCopper } from '../../../../components/infoTab/items/item';

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

  it('compares numeric strings numerically, not lexicographically', () => {
    const numeric: TestRow[] = [
      { name: '10', level: 1 },
      { name: '2', level: 2 },
      { name: '1', level: 3 },
    ];
    const [tableData, setTableData] = createSignal<TestRow[]>(numeric);
    const { dataSort } = createTableSort<TestRow>({
      data: [tableData, setTableData],
      initial: { sortKey: 'level', isAsc: true },
    });

    dataSort('name');

    // lexicographic order would be '1', '10', '2'
    expect(tableData().map(r => r.name)).toEqual(['1', '2', '10']);
  });

  it('sorts rows with missing values to the end regardless of direction', () => {
    const { tableData, dataSort } = setup();

    dataSort('cost'); // Mace has no cost
    expect(tableData().map(r => r.name)).toEqual(['Axe', 'Wand of Webs', 'Mace']);

    dataSort('cost'); // descending
    expect(tableData().map(r => r.name)).toEqual(['Wand of Webs', 'Axe', 'Mace']);
  });

  it('sorts comma-grouped costs correctly through costToCopper', () => {
    const priced: TestRow[] = [
      { name: 'Apparatus', level: 1, cost: '1,500 gp' },
      { name: 'Rope', level: 2, cost: '1 gp' },
      { name: 'Torch', level: 3, cost: '1 cp' },
      { name: 'Mystery', level: 4, cost: '' },
    ];
    const [tableData, setTableData] = createSignal<TestRow[]>(priced);
    const { dataSort } = createTableSort<TestRow>({
      data: [tableData, setTableData],
      valueSelectors: { cost: (row) => costToCopper(row.cost ?? '') },
    });

    dataSort('cost');
    expect(tableData().map(r => r.name)).toEqual(['Torch', 'Rope', 'Apparatus', 'Mystery']);

    dataSort('cost'); // descending: unparseable cost still last
    expect(tableData().map(r => r.name)).toEqual(['Apparatus', 'Rope', 'Torch', 'Mystery']);
  });
});

describe('costToCopper', () => {
  it('converts each coin type to copper', () => {
    expect(costToCopper('1 cp')).toBe(1);
    expect(costToCopper('2 sp')).toBe(20);
    expect(costToCopper('5 ep')).toBe(250);
    expect(costToCopper('15 gp')).toBe(1500);
    expect(costToCopper('10 pp')).toBe(10000);
  });

  it('parses comma-grouped values', () => {
    expect(costToCopper('1,500 GP')).toBe(150000);
    expect(costToCopper('200,000 gp')).toBe(20000000);
  });

  it('tolerates missing spaces, stray commas and trailing text', () => {
    expect(costToCopper('300gp')).toBe(30000);
    expect(costToCopper('16, sp')).toBe(160);
    expect(costToCopper('15 gp (per flask)')).toBe(1500);
  });

  it('returns undefined for unparseable costs', () => {
    expect(costToCopper('')).toBeUndefined();
    expect(costToCopper('priceless')).toBeUndefined();
  });
});
