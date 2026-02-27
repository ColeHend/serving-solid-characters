import { 
    Accessor, 
    Component, 
    createEffect, 
    createMemo, 
    createSignal, 
    Show 
} from "solid-js";
import { 
    Body, 
    Cell, 
    Column, 
    Header, 
    Row, 
    Table 
} from "coles-solid-library";
import { ItemPopup } from "../../../../../shared/components/modals/ItemModal/ItemModal";
import { Clone, Paginator } from "../../../../../shared";
import { useSearchParams } from "@solidjs/router";
import { Item } from "../../../../../models/generated";
import { srdItem, ItemProperties } from "../../../../../models/data/generated";
import { costToCopper } from "../../item";
import styles from "./weaponsView.module.scss";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import { ItemsMenu } from "../itemsMenu/itemsMenu";

interface viewProps {
    items: Accessor<Item[]>;
}

export const WeaponsView:Component<viewProps> = (props) => {
    const [searchParam, setSearchParam] = useSearchParams();

    const [searchResults,setSearchResults] = createSignal<Item[]>([]);
    const [tabledata, setTableData] = createSignal<Item[]>([]);
    const [paginatedItems,setPaginatedItems] = createSignal<Item[]>([]);
    const [currentItem, setCurrentItem] = createSignal<Item | undefined>(undefined);
    const [showItem,setShowItem] = createSignal<boolean>(false);
    const [currentSort,setCurrentSort] = createSignal<{
        sortKey: string;
        isAsc: boolean;
    }>({ sortKey: "cost", isAsc: false});

    const searchResult$ = createMemo(() => searchResults().length > 0 ? searchResults() : props.items());
    
    createEffect(() => {
        const list = props.items();
        if (list.length === 0) return;
        const param = typeof searchParam.name === "string" ? searchParam.name : searchParam.name?.join(" ");
        const found = param && list.some(i => i.name.toLowerCase() === param.toLowerCase());
        // Only set if param is missing or invalid, and not already set to first item
        if ((!param || !found) && list[0].name === param) {
            setSearchParam({ name: list[0].name });
        }
    });

    const selectedItem = createMemo(() => {
    const list = props.items();
    const param = typeof searchParam.name === "string" ? searchParam.name : searchParam.name?.join(" ");
    if (list.length === 0) return undefined;
    const target = (param || list[0].name).toLowerCase();
    return list.find(i => i.name.toLowerCase() === target) || list[0];
    })

    createEffect(() => {
        const sel = selectedItem();
        if (sel) setCurrentItem(sel);
    })

    createEffect(() => {
    const cur = currentItem();

    if (showItem() && cur?.name) {
        setSearchParam({
        name: cur.name
        })
    } else if (!showItem()) {
        setSearchParam({
        name: "",
        })
    }
    })


    createEffect(()=>{
    const list = props.items();
    setTableData(list);

    });



    const dataSort = (sortBy: keyof srdItem) => {
        setCurrentSort(old => {
          if (old.sortKey === sortBy) {
            return Clone({ sortKey: sortBy as string, isAsc: !old.isAsc });
          } else {
            return Clone({ sortKey: sortBy as string, isAsc: old.isAsc });
          }
        });
        setTableData((old) => {
          const currentSorting = currentSort();
          const shouldAsc = currentSorting.isAsc;
    
          const sorted = Clone(
            old.sort((a, b) => {
              let aSort: any, bSort: any;
    
              if (sortBy === "cost") {
                aSort = costToCopper(a.cost);
                bSort = costToCopper(b.cost);
              } else if (sortBy === "properties") {
                aSort = a.properties.Damage ?? "";
                bSort = b.properties.Damage ?? "";
              } else {
                  aSort = typeof a?.[sortBy] === "string"
                        ? a?.[sortBy].replaceAll(" ", "")
                        : a?.[sortBy];
                  bSort = typeof b?.[sortBy] === "string"
                        ? b?.[sortBy].replaceAll(" ", "")
                        : b?.[sortBy];
              }

              if (aSort === undefined || bSort === undefined) {
                return 0;
              }
    
              if (aSort < bSort) return shouldAsc ? 1 : -1;
              if (aSort > bSort) return shouldAsc ? -1 : 1;
              return 0;
            })
          );
    
          // Also update paginatedItems to trigger UI update
          setSearchResults((old) => sorted);
    
          return sorted;
        });
    }; 

    // const properties = createMemo<ItemProperties>(()=>currentItem()?.properties ?? {});

    return <Body class={`${styles.itemsBody}`}>
        <div class={`${styles.searchBar}`}>
            <SearchBar 
                dataSource={tabledata}
                setResults={setSearchResults}
            />
        </div>

        <div class={`${styles.table}`}>
            <Table columns={["name","dmg","cost","menu"]} data={()=>paginatedItems()}>
                <Column name="name">
                    <Header
                        onClick={()=>dataSort("name")}
                    >
                        Name
                        <Show when={currentSort().sortKey === "name"}>
                            <span>{ currentSort().isAsc ? " ▲" : " ▼" }</span>
                        </Show>
                    </Header>
                    <Cell<srdItem>>
                        {(item)=><span>
                            {item.name}
                        </span>}
                    </Cell>
                </Column>

                <Column name="dmg">
                    <Header
                        onClick={()=>dataSort("properties")}
                    >
                        Dmg
                        <Show when={currentSort().sortKey === "properties"}>
                            <span>{ currentSort().isAsc ? " ▲" : " ▼" }</span>
                        </Show>
                    </Header>
                    <Cell<srdItem>>
                        {(item)=><span>
                            {item.properties?.Damage ?? "" }
                        </span>}
                    </Cell>
                </Column>

                <Column name="cost">
                    <Header
                    onClick={
                        ()=>dataSort("cost")
                    }>
                        Cost
                        <Show when={currentSort().sortKey === "cost"}>
                            <span>{ currentSort().isAsc ? " ▲" : " ▼" }</span>
                        </Show>
                    </Header>
                    <Cell<srdItem>>
                        {(item)=><span>
                            {item.cost}
                        </span>}
                    </Cell>
                </Column>

                <Column name="menu">
                    <Header><></></Header>
                    <Cell<srdItem> onClick={(e)=>e.stopPropagation()}>
                    {(item)=><ItemsMenu item={item} />}
                    </Cell>
                </Column>

                <Row rowNumber={1} onClick={(e, Item)=>{
                    setCurrentItem(Item);
                    setShowItem(old => !old);
                }}/>
            </Table>
        </div>

        <div>
            <Paginator 
                items={searchResult$}
                setPaginatedItems={setPaginatedItems}
                transparent
            />
        </div>
        
        <Show when={showItem()}>
            <ItemPopup 
                show={[showItem,setShowItem]}
                item={currentItem as any}
            />
        </Show>
    </Body>
}