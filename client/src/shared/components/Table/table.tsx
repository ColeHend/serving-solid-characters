import { createContext, useContext } from 'solid-js';
import { JSX } from 'solid-js';

// Define the context
const TableContext = createContext<{ data: any[] }>();

// Custom hook to use the context
export function useTableContext() {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTableContext must be used within a Table');
  }
  return context;
}


type TableProps = {
  data: any[];
  children: JSX.Element;
};

export function Table(props: TableProps) {
  return (
    <TableContext.Provider value={{ data: props.data }}>
      <table>
        {props.children}
      </table>
    </TableContext.Provider>
  );
}
