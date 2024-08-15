import { Component, createEffect, createSignal, For, JSX, onMount, type Accessor, type Setter } from "solid-js";
import { ColumnState, getTableContext } from "./table";
import { effect } from "solid-js/web";
import { Clone } from "../..";

interface ColumnProps<T> {
    children: [JSX.Element, ColumnState<T>, ColumnState<T>?];
    name: string;
    multipleRows?: boolean;
}
const Column = <T,>(props: ColumnProps<T>) => {
    const [tableState, setTableState] = getTableContext<T>();
    createEffect(()=> {
        if (tableState().shouldUpdate) {
            setTableState((prev)=>(Clone({...prev, 
                currentColumns: [...prev.currentColumns, props.name],
                headers: [...prev.headers, props.children[0]],
                cells: [...prev.cells, props.children[1]], 
                multipleRows: props.multipleRows ?? false
            })));
            console.log("Column", tableState());
        }
    });
    return props.children;
};
const Header = <T,>(props: { children: JSX.Element }) => {
    const [tableState, setTableState] = getTableContext<T>();

    // createEffect(()=> {
    //     if (tableState().shouldUpdate) {
    //         setTableState((prev)=>(Clone({...prev, headers: [...prev.headers, <th>{props.children}</th>]})));
    //         console.log("Header", tableState());
    //     }
    // });
    return <th>{props.children}</th>;
}
const Cell = <T,>(props: { children: ColumnState<T> }) => {
    const [tableState, setTableState] = getTableContext<T>();

    // createEffect(()=>{
    //     if (tableState().shouldUpdate) {
    //         setTableState((prev)=>(Clone({...prev, shouldUpdate: false, columns: [...prev.cells, props.children]})));
    //         console.log("Cell", tableState());
    //     }
    // });
    return <></>;
}
const BottomRow = <T,>(props: { children: ColumnState<T> }) => {
    const [tableState, setTableState] = getTableContext<T>();

    createEffect(()=>{
        if (tableState().shouldUpdate) {
            setTableState((prev)=>Clone({...prev, shouldUpdate: false, bottomRows: [...prev.bottomRows, props.children]}));
        }
    });
    return <></>;
}
export { Column, Header, Cell, BottomRow };