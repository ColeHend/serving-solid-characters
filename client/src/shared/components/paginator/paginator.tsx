import { Accessor, Component, For, createSignal, createMemo, Setter } from "solid-js";
import { Spell } from "../../../../models/spell.model";
import { effect } from "solid-js/web";
import Modal from "../popup/popup.component";
import { create } from "domain";
import useStyle from "../../../../customHooks/utility/style/styleHook";

type Props<T> = {
    items: Accessor<T>;
    setPaginatedItems: Setter<T>;
};

const Paginator: Component<Props<any[]>> = (props) => {
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const setPaginatedItems = props.setPaginatedItems;

    const stylin = useStyle();

    // the paginator --------------------------------
    const theItems = createMemo(() => props.items().slice((currentPage() - 1) * itemsPerPage(), currentPage() * itemsPerPage()))
    // the paginator --------------------------------

    const lastpage = createMemo(() => Math.ceil(props.items().length / itemsPerPage()));

    // could potentially be a prop
    const ItemsPerPageArr = [10, 20, 50, 100];

    effect(()=>{
        if(currentPage() > lastpage()) {
            setCurrentPage(lastpage())
        }
    })

    effect(() => {
        setPaginatedItems(theItems());
    });
    
    return (
        <div class={`${stylin.accent} `}>
            <button disabled={currentPage() === 1} onClick={()=>setCurrentPage(1)}>←←</button>
            <button disabled={currentPage() === 1} onClick={()=>setCurrentPage(currentPage() - 1)}>←</button>
            <select onChange={(x)=>setItemsPerPage(+x.currentTarget.value)}>
                <For each={ItemsPerPageArr}>
                    {(item) => 
                        <option value={item}>
                            {item}
                        </option>
                    }
                </For>
            </select>
            <span>
                {currentPage()} / {lastpage()}
            </span>
            <button disabled={currentPage() === lastpage()} onClick={()=>setCurrentPage(currentPage() + 1)}>→</button>
            <button disabled={currentPage() === lastpage()} onClick={()=>setCurrentPage(lastpage())}>→→</button>
            
        </div>
    );
};
export default Paginator;