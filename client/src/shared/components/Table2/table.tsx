import { Component, createContext, createSignal, useContext, type Accessor, type Setter } from "solid-js";
import { ProviderProps } from "../../../models/hookContext";
type StateType<T=any> = T;
const tableContext = createContext<[Accessor<TableState<StateType>>, Setter<TableState<StateType>>]>(createSignal<TableState<StateType>>({ data: [], headers: [], columns: [] }));

export const TableProvider = <T,>(props: ProviderProps<[Accessor<TableState<StateType<T>>>, Setter<TableState<StateType<T>>>]>) => {
  return (
    <tableContext.Provider value={props.value}>
      {props.children}
    </tableContext.Provider>
  );
};
interface TableState<T> {
    data: T[];
    headers: any[];
    columns: any[];
}
interface TableProps<T> {
    data: T[];
    columns: string[];
}
const Table = <T,>(props: TableProps<T>) => {
  const [tableState, setTableState] = useContext<[Accessor<TableState<StateType<T>>>, Setter<TableState<StateType<T>>>]>(tableContext);
  return (
    <TableProvider value={[tableState, setTableState]}>
      <table>
        <thead>
          <tr>
            {props.columns.map((column) => (
              <th>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.data.map((row) => (
            <tr>
            </tr>
          ))}
        </tbody>
      </table>
    </TableProvider>
  );
};
