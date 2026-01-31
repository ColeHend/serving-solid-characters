import { Accessor, Component, For, createSignal, createMemo, Setter, useContext, createEffect } from "solid-js";
// Removed outdated Spell import (no direct usage)
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import style from "./paginator.module.scss";
import { SharedHookContext } from "../../../components/rootApp";
import { getUserSettings } from "../..";
import { Button, Select, Option } from "coles-solid-library";

type Props<T> = {
    items: Accessor<T>;
    setPaginatedItems: Setter<T>;
    itemsPerPage?: number[];
		classes?: string;
};

const Paginator = <T,>(props: Props<T[]>) => {
  const sharedHooks = useContext(SharedHookContext);

  const [userSettings, setUserSettings] = getUserSettings();
  const [currentPage, setCurrentPage] = createSignal(1);
  const [itemsPerPage, setItemsPerPage] = createSignal(props.itemsPerPage?.[0] ?? 10);

  const stylin = createMemo(()=>useStyle(userSettings().theme))

  // the paginator --------------------------------
  const theItems = createMemo(() => props.items().slice((currentPage() - 1) * itemsPerPage(), currentPage() * itemsPerPage()))
  // the paginator --------------------------------

  const lastpage = createMemo(() => Math.ceil(props.items().length / itemsPerPage()));

  const ItemsPerPageArr = props.itemsPerPage ?? [10, 20, 50, 100];

  // Reset or clamp current page when data source changes (e.g., version switch)
  let prevSignature = "";
  createEffect(() => {
    const list = props.items();
    const signature = `${list.length}:${(list[0] as any)?.id ?? (list[0] as any)?.name ?? ""}`;
    // If underlying collection identity changed, reset to first page
    if (signature !== prevSignature) {
      prevSignature = signature;
      setCurrentPage(1);
    }
  });

  createEffect(() => {
    // Clamp page if items shrank
    if (currentPage() > lastpage()) {
      setCurrentPage(lastpage());
    }
    props.setPaginatedItems(theItems());
  });

    
  return (
    <div class={`${stylin()?.tertiary} ${style.paginator} `}>
      <Button disabled={currentPage() === 1} onClick={()=>setCurrentPage(1)}>←←</Button>
      <Button disabled={currentPage() === 1} onClick={()=>setCurrentPage(currentPage() - 1)}>←</Button>
      <Select value={itemsPerPage()} onChange={(e)=>setItemsPerPage(e)}>
        <For each={ItemsPerPageArr}>
          {(item) => 
            <Option value={item}>
              {item}
            </Option>
          }
        </For>
      </Select>
      <div class={style.pageView}>
        <div>{currentPage()}</div> / <div>{lastpage()}</div>
      </div>
      <Button disabled={currentPage() === lastpage()} onClick={()=>setCurrentPage(currentPage() + 1)}>→</Button>
      <Button disabled={currentPage() === lastpage()} onClick={()=>setCurrentPage(lastpage())}>→→</Button>
            
    </div>
  );
};
export { Paginator };
export default Paginator;