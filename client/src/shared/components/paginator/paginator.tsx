import { Accessor, Component, For, createSignal, createMemo, Setter } from "solid-js";
import { effect } from "solid-js/web";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import style from "./paginator.module.scss";
import Button from "../Button/Button";
import Select from "../Select/Select";

type Props<T> = {
    items: Accessor<T>;
    setPaginatedItems: Setter<T>;
    itemsPerPage?: number[];
};

const Paginator = <T,>(props: Props<T[]>) => {
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const setPaginatedItems = props.setPaginatedItems;

    const stylin = useStyle();

    // the paginator --------------------------------
    const theItems = createMemo(() => props.items().slice((currentPage() - 1) * itemsPerPage(), currentPage() * itemsPerPage()))
    // the paginator --------------------------------

    const lastpage = createMemo(() => Math.ceil(props.items().length / itemsPerPage()));

    // could potentially be a prop
    const ItemsPerPageArr = props.itemsPerPage ?? [10, 20, 50, 100];

    effect(()=>{
        if(currentPage() > lastpage()) {
            setCurrentPage(lastpage())
        }
    })

    effect(() => {
        setPaginatedItems(theItems());
    });
    
    return (
        <div class={`${stylin.accent} ${style.paginator}`}>
            <Button disabled={currentPage() === 1} onClick={()=>setCurrentPage(1)}>←←</Button>
            <Button disabled={currentPage() === 1} onClick={()=>setCurrentPage(currentPage() - 1)}>←</Button>
            <Select disableUnselected={true} onChange={(x)=>setItemsPerPage(+x.currentTarget.value)}>
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