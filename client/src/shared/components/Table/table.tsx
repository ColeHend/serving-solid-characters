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
	  const getCellProps = (i: number)=> !!state.tableState().cellProps ? state.tableState().cellProps![i]: {};
		const getColumnIndex = (name: string)=>state.tableState().currentColumns.findIndex(x=>x===name);
		const getHeaderTransform = (name: string)=>state.tableState().headers[getColumnIndex(name)];
		
		const buildTHeaderRow = ()=>{
			const getColumnIndex = (name: string)=>state.tableState().currentColumns.findIndex(x=>x===name);
			const getHeaderTransform = (name: string)=>state.tableState().headers[getColumnIndex(name)];
			return <tr>
				<For each={local.columns}>{(column, i)=><>{getHeaderTransform(column)}</>}</For>
			</tr>;
		}
		const buildTRow = (row: T, rowI: number)=>{
			const getColumnIndex = (name: string)=>state.tableState().currentColumns.findIndex(x=>x===name);
			const getCellTransform = (name: string)=>state.tableState().rowTransform[getColumnIndex(name)];
			const hasTransforms = !!local.columns.map(x=>getCellTransform(x)).filter(x=>typeof x === "function").length;
			if (local.dropdown && hasTransforms) {
				return <tr>
					<For each={local.columns}>{(column, i)=>{
						const cellTransform = getCellTransform(column);
						if (typeof cellTransform === "function") {
							return <td {...getCellProps(getColumnIndex(column))}>
								{cellTransform(row, rowI)}
							</td>
						}
					}}</For>
						<td>
							<Show when={showDropdown()[rowI]}>
								<Button onClick={()=>setShowDropdown(old=>({...old, [rowI]: false}))}><UpArrow width={props.dropdownArrow?.width} height={props.dropdownArrow?.height} /></Button>
							</Show>
							<Show when={!showDropdown()[rowI]}>
								<Button onClick={()=>setShowDropdown(old=>({...old, [rowI]: true}))}><DownArrow width={props.dropdownArrow?.width} height={props.dropdownArrow?.height} /></Button>
							</Show>
						</td>
				</tr>;
			} else if (hasTransforms) {
				return <tr>
					<For each={local.columns}>{(column, i)=>{
						const cellTransform = getCellTransform(column);
						if (typeof cellTransform === "function") {
							return <td {...getCellProps(getColumnIndex(column))}>
								{cellTransform(row, rowI)}
							</td>
						}
					}}</For>
				</tr>
			} else {
				return <></>;
			}
		}
		const buildSecondRow = (row: T, rowI: number)=>{
			const getTransform = state.tableState().dropTransform;
			if (typeof getTransform !== "function" || !!!state.tableState().dropTransform) {
				return <></>;
			}
			const colSpan = props.dropdown ? local.columns.length + 1 : local.columns.length;
			return <tr {...state.tableState().dropProps}><td colSpan={colSpan}>{getTransform(row, rowI)}</td></tr>;
		}
		const dropCheck = (i: number)=>!!state.tableState().dropTransform && (!!showDropdown()[i] || !Object.keys(props).includes("dropdown"));
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
				if (!!data.length) {
					render(()=>data.map((row, i)=> {
						if (dropCheck(i)) {
							return <>
								{buildTRow(row, i)}
								{buildSecondRow(row, i)}
							</>
						} else {
							return buildTRow(row, i);
						}
					}), element);
				}
			}
		});
		props.children;
    return (
			<table {...others}>
				<thead ref={setTheadRef}>
					<For each={local.columns}>{(column, i)=><>{getHeaderTransform(column)}</>}</For>
				</thead>
				<tbody ref={setTbodyRef}>
					<Show when={!local.data().length}><></></Show>
					<Show when={local.data().length}>
						<For each={local.data()}>{(row, i)=><>
							{buildTRow(row, i())}
							<Show when={dropCheck(i())}>
								{buildSecondRow(row, i())}
							</Show>
						</>}</For>
					</Show>
				</tbody>
			</table>
    );
};

export { Table };
export default Table;