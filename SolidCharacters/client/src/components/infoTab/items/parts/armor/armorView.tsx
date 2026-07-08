/* eslint-disable @typescript-eslint/no-explicit-any */
import { Accessor, Component, createEffect, createMemo, createSignal, Show } from "solid-js";
import style from "./amorView.module.scss";
import { Item } from "../../../../../models/generated";
import { srdItem } from "../../../../../models/data/generated";
import { Body, Cell, Column, Header, Row, Table } from "coles-solid-library";
import { useSearchParams } from "@solidjs/router";
import { costToCopper } from "../../item";
import { createTableSort, Paginator } from "../../../../../shared";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import { ItemPopup } from "../../../../../shared/components/modals/ItemModal/ItemModal";
import { ItemsMenu } from "../itemsMenu/itemsMenu";

interface viewProps {
    items: Accessor<srdItem[]>;
}

export const ArmorView:Component<viewProps> = (props) => {

    const [searchParam, setSearchParam] = useSearchParams();
    
      const [tableData,setTableData] = createSignal<Item[]>([]);
      const [searchResult,setSearchResult] = createSignal<Item[]>([]);
      const [paginatedItems,setPaginatedItems] = createSignal<Item[]>([]);
      const [currentItem, setCurrentItem] = createSignal<Item | undefined>(undefined);
      const [showItem,setShowItem] = createSignal<boolean>(false);
      const { currentSort, dataSort } = createTableSort<Item>({
        data: [tableData, setTableData],
        syncSetters: [setSearchResult],
        initial: { sortKey: "cost", isAsc: false },
        valueSelectors: {
          cost: (item) => costToCopper(item?.cost),
          properties: (item) => String(item?.properties?.AC ?? ""),
        },
      });


      const searchResults = createMemo(() => searchResult()?.length > 0 ? searchResult() : props.items());
    
      createEffect(()=>{
        const list = props.items();
        if (list.length === 0) return;
        const param = typeof searchParam?.name === "string" ? searchParam?.name : searchParam?.name?.join(" ");
        const found = param && list.some(i => i?.name?.toLowerCase() === param?.toLowerCase())
        if ((!param || !found) && list?.[0].name === param) {
          setSearchParam({ name: list?.[0]?.name});
        }
      });
    
      const selectedItem = createMemo(() => {
        const list = props.items();
        const param = typeof searchParam?.name === "string" ? searchParam?.name : searchParam?.name?.join(" ");
        if (list.length === 0) return undefined;
        const target = (param || (list?.[0]?.name ?? ""))?.toLowerCase();
        return list?.find(i => i?.name?.toLowerCase() === target) || list[0];
      })
    
      createEffect(() => {
        const sel = selectedItem();
        if (sel) setCurrentItem(sel);
      })
    
      createEffect(() => {
        const cur = currentItem();
    
        if (showItem() && cur?.name) {
          setSearchParam({
            name: cur?.name
          })
        } else if (!showItem()) {
          setSearchParam({
            name: "",
          })
        }
      })
    
    
      createEffect(()=>{
        const list = props?.items();
        setTableData(list);
    
      });

    return <Body class={`${style.itemsBody}`}>
        <div class={`${style.searchBar}`}>
            <SearchBar 
                dataSource={tableData}
                setResults={setSearchResult}
                searchFunction={
                (item,search) => item?.name?.toLowerCase()?.includes(search?.toLowerCase())
                }
            />
        </div>
        
        <div class={`${style.table}`}>
            <Table columns={["name","props","cost","menu"]} data={()=>paginatedItems()}>
              <Column name="name" class={`${style.nameColumn}`}>
                    <Header onClick={()=>dataSort("name")}>
                    Name
                    <Show when={currentSort()?.sortKey === "name"}>
                        <span>{ currentSort()?.isAsc ? " ▲" : " ▼" }</span>
                    </Show>
                    </Header>
                </Column>
        
                <Column name="props" class={`${style.propsColumn}`}>
                    <Header onClick={()=>dataSort("properties")}>
                    AC
                    <Show when={currentSort()?.sortKey === "properties"}>
                        <span>{ currentSort()?.isAsc ? " ▲" : " ▼" }</span>
                    </Show>
                    </Header>
                </Column>
        
                <Column name="cost" class={`${style.costColumn}`}>
                    <Header onClick={()=>dataSort("cost")}>
                    Cost
                    <Show when={ currentSort()?.sortKey === "cost"}>
                        <span>{ currentSort()?.isAsc ? " ▲" : " ▼"}</span>
                    </Show>
                    </Header>
                </Column>

                <Column name="menu" class={`${style.actionColumn}`}> 
                  <Header><></></Header>
                </Column>
            </Table>
            <div class={`${style.scrollable}`}>
              <Table  columns={["name","props","cost","menu"]} data={()=>paginatedItems()}>
                  <Column name="name" class={`${style.nameColumn}`}>
                      <Header><></></Header>
                      <Cell<Item>>
                      {(item)=> <span>
                          {item.name}
                      </span>}
                      </Cell>
                  </Column>
          
                  <Column name="props" class={`${style.propsColumn}`}>
                      <Header><></></Header>
                      <Cell<srdItem>>
                      {(item)=><span>
                          {item?.properties?.AC}
                      </span>}
                      </Cell>
                  </Column>
          
                  <Column name="cost" class={`${style.costColumn}`}>
                      <Header><></></Header>
                      <Cell<srdItem>>
                      {(item)=><span>
                          {(item?.cost)}
                      </span>}
                      </Cell>
                  </Column>

                  <Column name="menu" class={`${style.actionColumn}`}>
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
        </div>

        <div class={`${style.paginator}`}>
            <Paginator 
                items={searchResults}
                setPaginatedItems={setPaginatedItems}
                transparent
            />
        </div>

        <Show when={showItem() && currentItem()}>
            <ItemPopup show={[showItem, setShowItem]} item={currentItem as any} />
        </Show>
    </Body>
}