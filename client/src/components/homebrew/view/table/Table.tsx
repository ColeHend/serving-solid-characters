// src/components/Table.tsx
import { createContext, useContext, JSX, ParentComponent, Show, createMemo, createSignal } from "solid-js";
import { For } from "solid-js/web";
import { beutifyChip } from "../../../../shared/customHooks/utility/beautifyChip";
import Button, { MenuButton } from "../../../../shared/components/Button/Button";
import Paginator from "../../../../shared/components/paginator/paginator";

interface TableProps<T> {
  data: T[];
  keys: (keyof T)[];
  button?: {
      generateMenuButtons: (data: T) => MenuButton[];
      overideX?: string;
      overideY?: string;
      backgroundClick?: boolean;
  },
  paginator?: Array<number>
}

const Table = <T,>(props: TableProps<T>) => {
    const [paginated, setPaginated] = createSignal<T[]>(props.data);
    const [dummyPage, setDummyPage] = createSignal<T[]>([]);
  return (
      <>
        <table>
            <thead>
            <tr>
                <For each={props.keys ?? []}>
                {(key) => {
                    return <th>{beutifyChip(key.toString())}</th>;
                }}
                </For>
                <Show when={props.button}>
                    <td>Options</td>
                </Show>
            </tr>
            </thead>
            <tbody>
                <For each={paginated()}>
                    {(child) => <tr>
                        <For each={props.keys}>
                            {(key) => <td>{`${child[key]}`}</td>}
                        </For>
                        <Show when={props.button}>
                            <Button 
                            enableBackgroundClick={props.button?.backgroundClick}
                            overrideX={props.button?.overideX} 
                            overrideY={props.button?.overideY} 
                            menuItems={(!!props.button ? props.button.generateMenuButtons(child) : undefined)} >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>
                            </Button>
                        </Show>
                    </tr>
                }</For>
            </tbody>
        </table>
        <Show when={props.paginator}>
            <Paginator<T> setPaginatedItems={setPaginated} items={paginated} itemsPerPage={props.paginator} />
        </Show>
      </>
  );
};

export default Table;
