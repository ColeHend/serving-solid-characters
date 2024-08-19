import { Component, createContext, createSignal, For, useContext, JSX, type Accessor, type Setter, onMount, Show, createEffect, createMemo, splitProps, createReaction, createComputed, createRenderEffect } from "solid-js";
import { ProviderProps } from "../../../models/hookContext";
import { Clone } from "../../customHooks";
import { getTableContext, TableContext, TableProvider, TableState } from "./tableProvider";
import { RowProvider, useRowContext } from "./rowProvider";
import { effect, render } from "solid-js/web";
import { Button, DownArrow, UpArrow } from "../..";
import DOMPurify from "dompurify";
export type ColumnState<T> = (item: T, index: number)=>JSX.Element;

interface TableProps<T> extends JSX.HTMLAttributes<HTMLTableElement> {
	data: Accessor<T[]>;
	columns: string[];
	children?: JSX.Element;
	dropdown?: boolean;
	dropdownArrow?: {width: string, height: string};
}
const Table = <T,>(props: TableProps<T>)=>{
	return <TableProvider value={{
		headers: [],
		rowTransform: [],
		currentColumns: [],
		
	}}><TableComponent {...props}/></TableProvider>
}
const TableComponent = <T,>(props: TableProps<T>) => {
		const state = getTableContext<T>();
		const [tbodyRef, setTbodyRef] = createSignal<HTMLTableSectionElement>();
		state.setTableState({headers: [], rowTransform: [], currentColumns: [], });
		const [local, others] = splitProps(props, ["data", "columns", "children", "dropdown"]);
		const [showDropdown, setShowDropdown] = createSignal<{[key:number]: boolean}>({});
		const updateState = ()=>state.setTableState(old=>({...old, multipleRows: !!!old?.multipleRows}));
	  const getCellProps = (i: number)=> !!state.tableState().cellProps ? state.tableState().cellProps![i]: {};
		const [rerender, setRerender] = createSignal(false);
		const buildTRow = (row: T, rowI: number)=>{
			return <tr>
				{state.tableState().rowTransform.map((cellTransform, i)=>{
					return <td {...getCellProps(i)}>{cellTransform(row, rowI)}</td>
				})}
			</tr>;
		}
		createEffect(()=>{
			const element = tbodyRef();
			if (!!element) {
				element.innerHTML = "";
				const data = props.data();
				render(()=>data.map((row, i)=> buildTRow(row, i)), element);
			}
		});
		createEffect(()=>{
			if (rerender()) {
				setRerender(false);
				updateState();
			}
		});
    return (
			<table {...others}>
				<thead>
						<tr>
								<For each={state.tableState().headers}>{(header, i)=>
									<Show when={local.columns.includes(state.tableState().currentColumns[i()])}>
										{header}
								</Show>}</For>
						</tr>
				</thead>
				<tbody ref={setTbodyRef}>
						{props.children}
				</tbody>
			</table>
    );
};

export { Table };
export default Table;