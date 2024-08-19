import { Component, createEffect, createSignal, For, JSX, onMount, splitProps, type Accessor, type Setter } from "solid-js";
import { ColumnState } from "./table";
import { effect } from "solid-js/web";
import { Clone } from "../..";
import { getTableContext } from "./tableProvider";
import { useRowContext } from "./rowProvider";

interface ColumnProps<T> {
    children: [JSX.Element, JSX.Element, JSX.Element?];
    name: string;
    multipleRows?: boolean;
}
const Column = <T,>(props: ColumnProps<T>) => {
    const {tableState, setTableState} = getTableContext<T>();
		props.children
		onMount(()=>{
			setTableState((prev)=>({...prev, currentColumns: [...prev.currentColumns, props.name]}));
		})
    return <tr></tr>;
};
interface HeaderProps extends JSX.HTMLAttributes<HTMLTableHeaderCellElement>{
		children: JSX.Element;
}
const Header = <T,>(props: HeaderProps) => {
    const {tableState, setTableState} = getTableContext<T>();
		const [local, others] = splitProps(props, ["children"]);
    onMount(()=> {
			setTableState((prev)=>({...prev, headers: [...prev.headers, <th {...others}>{local.children}</th>]}));
    });
    return <></>;
}
interface CellProps<T> {
		children: ColumnState<T>;
		classes?: string;
		style?: JSX.CSSProperties;
		[key: string]: any;
}
const Cell = <T=any,>(props: CellProps<T>) => {
		const [local, others] = splitProps(props, ["children"]);
    const {tableState, setTableState} = getTableContext<T>();
		const rowContext = useRowContext();

    onMount(()=>{
			setTableState((prev)=>({...prev, 
				cellProps: [...(!!prev.cellProps ? prev.cellProps : []), others],
				rowTransform: [...prev.rowTransform, local.children]}));
    });
    return <></>;
}
interface RowProps extends JSX.HTMLAttributes<HTMLTableRowElement> {}
const Row = <T,>(props: RowProps) => {
		const {tableState, setTableState} = getTableContext<T>();
		onMount(()=>{
				setTableState((prev)=>({...prev, rowProps: props}))
		});
		return <></>;
}
interface DropRowProps<T> {
		children: ColumnState<T>;
		classes?: string;
		style?: JSX.CSSProperties;
		[key: string]: any;
}
const SecondRow = <T,>(props: DropRowProps<T>) => {
		const [local, others] = splitProps(props, ["children"]);
		const rowContext = useRowContext();
		const {tableState, setTableState} = getTableContext<T>();
		onMount(()=>{
				setTableState((prev)=>({...prev, 
					dropTransform: local.children,
					dropProps: others}))
		});
    return <></>;
}
export { Column, Header, Cell, SecondRow, Row };