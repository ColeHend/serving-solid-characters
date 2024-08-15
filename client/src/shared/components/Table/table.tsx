import { Component, createContext, createSignal, For, useContext, JSX, type Accessor, type Setter, onMount, Show, createEffect, createMemo } from "solid-js";
import { ProviderProps } from "../../../models/hookContext";
import { Clone } from "../../customHooks";
type StateType<T=any> = T;
const tableContext = createContext<[Accessor<TableState<StateType>>, Setter<TableState<StateType>>]>(createSignal<TableState<StateType>>({ headers: [], cells: [], bottomRows: [], currentColumns: [], shouldUpdate: false }));

export const TableProvider = <T,>(props: ProviderProps<[Accessor<TableState<StateType<T>>>, Setter<TableState<StateType<T>>>]>) => {
    return (
        <tableContext.Provider value={props.value}>
            {props.children}
        </tableContext.Provider>
    );
};
export function getTableContext<T>() {
    return useContext<[Accessor<TableState<StateType<T>>>, Setter<TableState<StateType<T>>>]>(tableContext);
};
export type ColumnState<T> = (item: T, index: number)=>JSX.Element;
interface TableState<T> {
    headers: JSX.Element[];
    cells: ColumnState<T>[];
    bottomRows: ColumnState<T>[];
    currentColumns: string[];
    multipleRows?: boolean;
    shouldUpdate: boolean;
}
interface TableProps<T> {
    data: T[];
    columns: string[];
    children?: JSX.Element;
}
const Table = <T,>(props: TableProps<T>) => {
    const [tableState, setTableState] = getTableContext<T>();
    const tableData = createMemo(()=>props.data);
    props.children 
    createEffect(()=>{
        tableData();
        setTableState((prev)=>(Clone({...prev, headers: [], currentColumns: [], shouldUpdate: true})));
    })
    return (
        <TableProvider value={[tableState, setTableState]}>
            <table>
                <thead>
                    <tr>
                        <For each={tableState().headers}>{(header)=><>
                            {header}
                        </>}</For>
                    </tr>
                </thead>
                <tbody>
                    <For each={tableData()}>{(row, rowI)=><>
                        <Show when={!tableState().multipleRows}>
                            <tr>
                                <For each={tableState().cells}>{(column, i)=><Show when={props.columns.includes(tableState().currentColumns[i()])}>
                                    {column(row, i())}
                                </Show>}</For>
                            </tr>
                        </Show>
                        <Show when={tableState().multipleRows}>
                            <tr>
                                <For each={tableState().cells}>{(column, i)=><>
                                    {column(row, i())}
                                </>}</For>
                            </tr>
                            <tr>
                                {tableState().bottomRows[rowI()](row, rowI())}
                            </tr>
                        </Show>
                    </>}</For>
                </tbody>
            </table>
        </TableProvider>
    );
};

export { Table };
export default Table;