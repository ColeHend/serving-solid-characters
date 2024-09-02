import { Component, createContext, createSignal, For, useContext, JSX, type Accessor, type Setter, onMount, Show, createEffect, createMemo, splitProps, createReaction, createComputed, createRenderEffect, Switch } from "solid-js";
import { ProviderProps } from "../../../models/hookContext";
import { Clone } from "../../customHooks";
import { getTableContext, TableContext, TableProvider, TableState } from "./tableProvider";
import { RowProvider, useRowContext } from "./rowProvider";
import { Dynamic, effect, render } from "solid-js/web";
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
	const [local, others] = splitProps(props, ["data", "columns", "children", "dropdown"]);
	const [theadRef, setTheadRef] = createSignal<HTMLTableSectionElement>();
	const [tbodyRef, setTbodyRef] = createSignal<HTMLTableSectionElement>();
	state.setTableState({headers: [], rowTransform: [], currentColumns: [], });
	const [showDropdown, setShowDropdown] = createSignal<{[key:number]: boolean}>({});
	const getColumnIndex = (name: string)=>state.tableState().currentColumns.findIndex(x=>x===name);
	const getHeaderTransform = (name: string)=>state.tableState().headers[getColumnIndex(name)];
	const isDropTable = ()=>!!state.tableState().dropTransform;

	const dropCheck = (i: number)=>{
		const hasTransform = !!state.tableState().dropTransform 
		const showDrop = (!!showDropdown()[i] || !Object.keys(props).includes("dropdown"));
		console.log(hasTransform, showDrop);
		return hasTransform && showDrop;
	};

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
						<BuildTableRow<T> 
							columns={local.columns} 
							showDropdown={showDropdown()[i()]} 
							setShowDropdown={setShowDropdown} 
							dropdownArrow={others.dropdownArrow} 
							isDropTable={isDropTable()}
							row={row} 
							rowI={i()} />
						<Show when={dropCheck(i())}>
							<BuildSecondRow 
								colSpan={local.columns.length} 
								row={row} 
								rowI={i()} 
								transform={state.tableState().dropTransform!} />
						</Show>
					</>}</For>
				</Show>
			</tbody>
		</table>
	);
};

interface RowProps<T> extends JSX.HTMLAttributes<HTMLTableRowElement> {
	columns: string[];
	showDropdown: boolean;
	setShowDropdown: Setter<{[key:number]: boolean}>;
	dropdownArrow?: {width: string, height: string};
	row: T;
	rowI: number;
	isDropTable: boolean;

}
const BuildTableRow = <T,>(props: RowProps<T>) => {
	const state = getTableContext<T>();
	const getCellProps = (i: number)=> !!state.tableState().cellProps ? state.tableState().cellProps![i]: {};
	const getColumnIndex = (name: string)=>state.tableState().currentColumns.findIndex(x=>x===name);
	const getCellTransform = (name: string)=>state.tableState().rowTransform[getColumnIndex(name)];
	const hasTransforms = () => !!props.columns.map(x=> getCellTransform(x)).filter(x=>typeof x === "function").length;
	return <>
			<Show when={props.isDropTable && hasTransforms()}>
				<tr>
					<For each={props.columns}>{(column, i)=>{
						const cellTransform = getCellTransform(column);
						return <Show when={typeof cellTransform === "function"}>
								<td data-index={i()} {...getCellProps(getColumnIndex(column))}>
									{cellTransform(props.row, props.rowI)}
								</td>
							</Show>
					}}</For>
						<td>
							<Show when={props.showDropdown}>
								<Button onClick={()=>props.setShowDropdown(old=>({...old, [props.rowI]: false}))}>
									<UpArrow width={props.dropdownArrow?.width} height={props.dropdownArrow?.height} />
								</Button>
							</Show>
							<Show when={!props.showDropdown}>
								<Button onClick={()=>props.setShowDropdown(old=>({...old, [props.rowI]: true}))}>
									<DownArrow width={props.dropdownArrow?.width} height={props.dropdownArrow?.height} />
								</Button>
							</Show>
						</td>
				</tr>
			</Show>
			<Show when={!props.isDropTable && hasTransforms()}>
				<tr>
					<For each={props.columns}>{(column, i)=>{
						const cellTransform = getCellTransform(column);
						return <Show when={typeof cellTransform === "function"}>
								<td data-index={i()} {...getCellProps(getColumnIndex(column))}>
									{cellTransform(props.row, props.rowI)}
								</td>
							</Show>
					}}</For>
				</tr>
			</Show>
	</>
}
interface SecondRowProps<T> {
	row: T;
	colSpan: number;
	rowI: number;
	transform: ColumnState<T>;
}
const BuildSecondRow = <T,>(props: SecondRowProps<T>)=>{
	return <tr><td colSpan={props.colSpan}>{props.transform(props.row, props.rowI)}</td></tr>;
}

export { Table };
export default Table;