import { Accessor, Component, For, createSignal, createMemo, Setter, useContext } from "solid-js";
import { Spell } from "../../../models/spell.model";
import { effect } from "solid-js/web";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import style from "./paginator.module.scss";
import Button from "../Button/Button";
import { SharedHookContext } from "../../../components/rootApp";
import { getUserSettings, Select } from "../..";

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

  effect(()=>{
    if(currentPage() > lastpage()){
      setCurrentPage(lastpage())
    }
  })

  effect(() => {
    props.setPaginatedItems(theItems());
  });
    
  return (
    <div class={`${stylin()?.accent} ${style.paginator} `}>
      <Button disabled={currentPage() === 1} onClick={()=>setCurrentPage(1)}>←←</Button>
      <Button disabled={currentPage() === 1} onClick={()=>setCurrentPage(currentPage() - 1)}>←</Button>
      <Select transparent value={itemsPerPage()} onChange={(x)=>setItemsPerPage(x)}>
        <For each={ItemsPerPageArr}>
          {(item) => 
            <option value={item}>
              {item}
            </option>
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