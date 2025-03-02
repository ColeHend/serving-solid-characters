import { Component, createContext, useContext } from "solid-js";
import { Accessor, JSX, Setter, createSignal } from "solid-js";
interface RowContext {
		getRowI: Accessor<number>;
		setRowI: Setter<number>;
		getRowItem: Accessor<any>;
		setRowItem: Setter<any>;
}
const Context = createContext<RowContext>();
interface RowProviderProps<T> {
	children: JSX.Element;
	rowI: number;
	rowItem: T;
}
export const RowProvider = <T,>(props: RowProviderProps<T>) => {
  const [getRowI, setRowI] = createSignal(props.rowI);
  const [getRowItem, setRowItem] = createSignal(props.rowItem);
  return (
    <Context.Provider value={{getRowI, setRowI, getRowItem, setRowItem}}>
      {props.children}
    </Context.Provider>
  );
};
export function useRowContext() {
  return useContext(Context);
};