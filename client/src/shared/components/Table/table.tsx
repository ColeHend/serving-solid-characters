import { Component, createContext, createSignal, For, useContext, JSX, type Accessor, type Setter, onMount, Show, createEffect, createMemo, splitProps } from "solid-js";
import { ProviderProps } from "../../../models/hookContext";
import { Clone } from "../../customHooks";
import { getTableContext, TableContext, TableProvider, TableState } from "./tableProvider";
import { RowProvider, useRowContext } from "./rowProvider";
import { effect } from "solid-js/web";
import { Button, DownArrow, UpArrow } from "../..";
export type ColumnState<T> = (item: T, index: number)=>JSX.Element;

interface TableProps<T> extends JSX.HTMLAttributes<HTMLTableElement> {
	data: T[];
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
		const {tableState, setTableState} = getTableContext<T>();
		setTableState({headers: [], rowTransform: [], currentColumns: [], });
		const [local, others] = splitProps(props, ["data", "columns", "children", "dropdown"]);
    const tableData = createMemo(()=> props.data);
		const [showDropdown, setShowDropdown] = createSignal<{[key:number]: boolean}>({});
    props.children

    return (
			<table {...others}>
				<thead>
						<tr>
								<For each={tableState().headers}>{(header, i)=>
									<Show when={local.columns.includes(tableState().currentColumns[i()])}>
										{header}
								</Show>}</For>
						</tr>
				</thead>
				<tbody>
						<For each={tableData()}>{(row, rowI)=><>
								<Show when={!!!tableState().dropTransform}>
										<tr {...tableState().rowProps}>
												<For each={tableState().rowTransform}>{(rowTransform, i)=>
													<Show when={local.columns.includes(tableState().currentColumns[i()])}>
														<td {...!!tableState().cellProps ? tableState().cellProps![i()] : {}}>{rowTransform(row, i())}</td>
													</Show>
												}</For>
										</tr>
								</Show>
								<Show when={!!tableState().dropTransform}>
										<tr {...tableState().rowProps}>
											<For each={tableState().rowTransform}>{(rowTransform, i)=>
												<Show when={local.columns.includes(tableState().currentColumns[i()])}>
													<td {...!!tableState().cellProps ? tableState().cellProps![i()] : {}}>{rowTransform(row, i())}</td>
												</Show>
											}</For>
											<Show when={local.dropdown}>
												<td>
													<Button style={{margin:"0px 0px 0px 5px", padding:"0px"}} onClick={()=>{setShowDropdown(old=>({...old, [rowI()]: !!!old[rowI()]}))}}>
														<Show when={!!!showDropdown()[rowI()]}>
															<DownArrow width={props.dropdownArrow?.width} height={props.dropdownArrow?.height} />
														</Show>
														<Show when={!!showDropdown()[rowI()]}>
																<UpArrow width={props.dropdownArrow?.width} height={props.dropdownArrow?.height} />
														</Show>
													</Button>
												</td>
											</Show>
										</tr>
										<Show when={!local.dropdown || !!showDropdown()[rowI()]}>
											<tr {...tableState().dropProps}>
													<td colSpan={!!local.dropdown ? ++props.columns.length :props.columns.length}>
														{tableState().dropTransform?.(row, rowI())}
													</td>
											</tr>
										</Show>
								</Show>
						</>}</For>
				</tbody>
			</table>
    );
};

export { Table };
export default Table;