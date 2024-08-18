import { Accessor, Setter, createSignal, useContext, JSX, createContext } from "solid-js";
import { ProviderProps } from "../../../models/hookContext";
type StateType<T=any> = T;
export interface TableState<T=any> {
	headers: JSX.Element[];
	rowTransform: ((item: T, index: number)=>JSX.Element)[];
	cellProps?: JSX.HTMLAttributes<HTMLTableDataCellElement>[];
	currentColumns: string[];
	multipleRows?: boolean;
}
export interface TableContext<T=any> {
	tableState: Accessor<TableState<StateType<T>>>;
	setTableState: Setter<TableState<StateType<T>>>;
}
const tableContext = createContext<TableContext>({
	tableState: () => ({ headers: [], rowTransform: [], currentColumns: [] }),
	setTableState: () => {},
});

interface TableProviderProps<T = any> {
	children: JSX.Element;
	value: TableState<StateType<T>>;
}

export const TableProvider = <T,>(props: TableProviderProps<T>) => {

	const [tableState, setTableState] = createSignal(props.value);
    return (
        <tableContext.Provider value={{tableState, setTableState}}>
            {props.children}
        </tableContext.Provider>
    );
};
export function getTableContext<T>() {
    return useContext<TableContext<T>>(tableContext);
};
export type ColumnState<T> = (item: T, index: number)=>JSX.Element;
