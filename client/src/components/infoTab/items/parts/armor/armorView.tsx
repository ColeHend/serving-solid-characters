import { Accessor, Component, createEffect, createMemo, createSignal, Show } from "solid-js";
import style from "./amorView.module.scss";
import { Item, ItemType } from "../../../../../models/data";
import { Body, Cell, Column, Header, Row, Table } from "coles-solid-library";
import { useSearchParams } from "@solidjs/router";
import { costToCopper } from "../../item";
import { Clone, Paginator } from "../../../../../shared";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import { ItemPopup } from "../../../../../shared/components/modals/ItemModal/ItemModal";
interface viewProps {
    items: Accessor<Item[]>;
}

export const ArmorView:Component<viewProps> = (props) => {

    const [searchParam, setSearchParam] = useSearchParams();
    
      const [tableData,setTableData] = createSignal<Item[]>([]);
      const [searchResult,setSearchResult] = createSignal<Item[]>([]);
      const [paginatedItems,setPaginatedItems] = createSignal<Item[]>([]);
      const [currentItem, setCurrentItem] = createSignal<Item | undefined>(undefined);
      const [showItem,setShowItem] = createSignal<boolean>(false);
      const [currentSort,setCurrentSort] = createSignal<{
        sortKey: string;
        isAsc: boolean;
      }>({ sortKey: "cost", isAsc: false});
      
      const searchResults = createMemo(() => searchResult().length > 0 ? searchResult() : props.items());
    
      createEffect(()=>{
        const list = props.items();
        if (list.length === 0) return;
        const param = searchParam.name;
        const found = param && list.some(i => i.name.toLowerCase() === param.toLowerCase())
        if ((!param || !found) && list[0].name === param) {
          setSearchParam({ name: list[0].name});
        }
      });
    
      const selectedItem = createMemo(() => {
        const list = props.items();
        if (list.length === 0) return undefined;
        const target = (searchParam.name || list[0].name).toLowerCase();
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

      const dataSort = (sortBy: keyof Item) => {
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
            aSort = a.properties?.AC ?? ""
            bSort = b.properties?.AC ?? ""
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
      setSearchResult((old) => sorted);

      return sorted;
    });
  }; 

    return <Body class={`${style.itemsBody}`}>
        <div class={`${style.searchBar}`}>
            <SearchBar 
                dataSource={tableData}
                setResults={setSearchResult}
                searchFunction={
                (item,search) => item.name.toLowerCase().includes(search.toLowerCase())
                }
            />
        </div>
        
        <div class={`${style.table}`}>
            <Table columns={["name","props","cost"]} data={()=>paginatedItems()}>
                <Column name="name">
                    <Header onClick={()=>dataSort("name")}>
                    Name
                    <Show when={currentSort().sortKey === "name"}>
                        <span>{ currentSort().isAsc ? " ▲" : " ▼" }</span>
                    </Show>
                    </Header>
                    <Cell<Item>>
                    {(item)=> <span>
                        {item.name}
                    </span>}
                    </Cell>
                </Column>
        
                <Column name="props">
                    <Header onClick={()=>dataSort("properties")}>
                    AC
                    <Show when={currentSort().sortKey === "properties"}>
                        <span>{ currentSort().isAsc ? " ▲" : " ▼" }</span>
                    </Show>
                    </Header>
                    <Cell<Item>>
                    {(item)=><span>
                        {item.properties?.AC}
                    </span>}
                    </Cell>
                </Column>
        
                <Column name="cost">
                    <Header onClick={()=>dataSort("cost")}>
                    Cost
                    <Show when={ currentSort().sortKey === "cost"}>
                        <span>{ currentSort().isAsc ? " ▲" : " ▼"}</span>
                    </Show>
                    </Header>
                    <Cell<Item>>
                    {(item)=><span>
                        {(item.cost)}
                    </span>}
                    </Cell>
                </Column>
                    
                <Row rowNumber={1} onClick={(e, Item)=>{
                    setCurrentItem(Item);
                    setShowItem(old => !old);
                }}/>
            </Table>
        </div>

        <div class={`${style.paginator}`}>
            <Paginator 
                items={searchResults}
                setPaginatedItems={setPaginatedItems}
            />
        </div>

        <Show when={showItem() && currentItem()}>
            <ItemPopup show={[showItem, setShowItem]} item={currentItem as any} />
        </Show>
    </Body>
}