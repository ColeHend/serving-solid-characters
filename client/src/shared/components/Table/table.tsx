import { Component, createContext, createSignal, For, useContext, JSX, type Accessor, type Setter, onMount, Show, createEffect, createMemo } from "solid-js";
import { ProviderProps } from "../../../models/hookContext";
import { Clone } from "../../customHooks";
import { getTableContext, TableContext, TableProvider, TableState } from "./tableProvider";
import { RowProvider, useRowContext } from "./rowProvider";
import { effect } from "solid-js/web";
export type ColumnState<T> = (item: T, index: number)=>JSX.Element;

interface TableProps<T> {
	data: T[];
	columns: string[];
	children?: JSX.Element;
}
const Table = <T,>(props: TableProps<T>)=>{
	return <TableProvider value={{
		headers: [],
		rowTransform: [],
		currentColumns: [],
	}}><TableComponent {...props}/></TableProvider>
}
const TableComponent = <T,>(props: TableProps<T>) => {
    const {tableState, setTableState} = getTableContext<T>();
    const tableData = createMemo(()=> props.data);
    props.children 

		effect(()=>{
			console.log("tableState: ", tableState());
			console.log("props.columns: ", props.columns);
			
		})

    return (
			<table>
				<thead>
						<tr>
								<For each={tableState().headers}>{(header, i)=>
									<Show when={props.columns.includes(tableState().currentColumns[i()])}>
										{header}
								</Show>}</For>
						</tr>
				</thead>
				<tbody>
						<For each={tableData()}>{(row, rowI)=><>
								<Show when={!tableState().multipleRows}>
										<tr>
												<For each={tableState().rowTransform}>{(rowTransform, i)=>
													<Show when={props.columns.includes(tableState().currentColumns[i()])}>
														<td {...!!tableState().cellProps ? tableState().cellProps![i()] : {}}>{rowTransform(row, i())}</td>
													</Show>
												}</For>
										</tr>
								</Show>
								<Show when={tableState().multipleRows}>
										<tr>
												{/* <For each={tableState().cells}>{(column, i)=><>
														{column(row, i())}
												</>}</For> */}
										</tr>
										<tr>
												{/* {tableState().bottomRows[rowI()](row, rowI())} */}
										</tr>
								</Show>
						</>}</For>
				</tbody>
			</table>
    );
};

export { Table };
export default Table;