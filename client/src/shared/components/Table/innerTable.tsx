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
			setTableState((prev)=>({...prev, headers: [...prev.headers, <th {...others}>{props.children}</th>]}));
    });
    return <>{local.children}</>;
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
    return <>{local.children(rowContext?.getRowItem() ?? {}, rowContext?.getRowI() ?? 0)}</>;
}
const BottomRow = <T,>(props: { children: ColumnState<T> }) => {
    const {tableState, setTableState} = getTableContext<T>();
		const rowContext = useRowContext();

    onMount(()=>{
        // if (tableState().shouldUpdate) {
        //     setTableState((prev)=>({...prev, shouldUpdate: false, bottomRows: [...prev.bottomRows, props.children]}));
        // }
    });
    return <>{props.children(rowContext?.getRowItem(), rowContext?.getRowI() ?? 0)}</>;
}
export { Column, Header, Cell, BottomRow };