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
		const [theadRef, setTheadRef] = createSignal<HTMLTableSectionElement>();
		const [tbodyRef, setTbodyRef] = createSignal<HTMLTableSectionElement>();
		state.setTableState({headers: [], rowTransform: [], currentColumns: [], });
		const [local, others] = splitProps(props, ["data", "columns", "children", "dropdown"]);
		const [showDropdown, setShowDropdown] = createSignal<{[key:number]: boolean}>({});
		const updateState = ()=>state.setTableState(old=>({...old, multipleRows: !!!old?.multipleRows}));
	  const getCellProps = (i: number)=> !!state.tableState().cellProps ? state.tableState().cellProps![i]: {};
		const [rerender, setRerender] = createSignal(false);
		const buildTHeaderRow = ()=>{
			const getColumnIndex = (name: string)=>state.tableState().currentColumns.findIndex(x=>x===name);
			const getHeaderTransform = (name: string)=>state.tableState().headers[getColumnIndex(name)];
			return <tr>
				<For each={local.columns}>{(column, i)=><th>{getHeaderTransform(column)}</th>}</For>
			</tr>;
		}
		const buildTRow = (row: T, rowI: number)=>{
			const getColumnIndex = (name: string)=>state.tableState().currentColumns.findIndex(x=>x===name);
			const getCellTransform = (name: string)=>state.tableState().rowTransform[getColumnIndex(name)];
			return <tr>
				<For each={local.columns}>{(column, i)=><td>{getCellTransform(column)(row, rowI)}</td>}</For>
			</tr>;
		}
		createEffect(()=>{
			const elementhead = theadRef();
			if (!!elementhead) {
				elementhead.innerHTML = "";
				render(()=>buildTHeaderRow(), elementhead);
			}
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
				<thead ref={setTheadRef}></thead>
				<tbody ref={setTbodyRef}>
						{props.children}
				</tbody>
			</table>
    );
};

export { Table };
export default Table;