/* eslint-disable @typescript-eslint/no-explicit-any */
import { Accessor, Component, createEffect, createMemo, createSignal, Show } from "solid-js";
import { srdItem } from "../../../../../models/data/generated";
import { Body, Cell, Column, Header, Row, Table } from "coles-solid-library";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import { createTableSort, getUserSettings, ItemType, Paginator } from "../../../../../shared";
import style from "./allItem.module.scss";
import { ItemsMenu } from "../itemsMenu/itemsMenu";
import { useSearchParams } from "@solidjs/router";
import { ItemPopup } from "../../../../../shared/components/modals/ItemModal/ItemModal";
import { isMobile } from "coles-solid-library/dist/tools/tools.js";

interface props {
    srdItems: Accessor<srdItem[]>;
}

export const AllItems: Component<props> = (props) => {

    const allItems = createMemo(() => props.srdItems());
    
    const [tabledata,setTabledata] = createSignal<srdItem[]>(allItems()); // source of truth.
    const [paginatedData,setPaginatedData] = createSignal<srdItem[]>([]); // paginated data
    const [searchResults, setSearchResults] = createSignal<srdItem[]>([]); // data being tracked

    const [currentItem, setCurrentItem] = createSignal<srdItem | undefined>(undefined);
    const [showItem, setShowItem] = createSignal<boolean>(false);
    
    const [userSettings,] = getUserSettings();
    const [searchParam, setSearchParam] = useSearchParams();

    const mobile = createMemo(() => isMobile());

    const system = createMemo(() => userSettings().dndSystem);

    const is2014 = createMemo(() => system() === "2014" || system() === "both");

    const columns = createMemo(() => {
        const isMobile = mobile();
        if (isMobile) {
            return is2014() ? ["name","legacy", "menu"] : ["name", "type", "menu"]
        } else {
            return is2014() ? ["name", "type" ,"legacy", "menu"] : ["name", "type", "menu"]
        }
        
    });

    const searchResult$ = createMemo(() => searchResults()?.length > 0 ? searchResults() : allItems());
    
    const { currentSort, dataSort, applySort } = createTableSort<srdItem>({
        data: [tabledata,setTabledata],
        syncSetters: [setSearchResults],
        initial: {sortKey: "name", isAsc: true},
        valueSelectors: {
            type: (item) => ItemType[item.type],
        }
    })

    createEffect(()=>{
        const list = allItems();
        if (list.length === 0) return;
        const param = typeof searchParam?.name === "string" ? searchParam?.name : searchParam?.name?.join(" ");
        const found = param && list.some(i => i?.name?.toLowerCase() === param?.toLowerCase())
        if ((!param || !found) && list?.[0].name === param) {
            setSearchParam({ name: list?.[0]?.name});
        }
    });

    const selectedItem = createMemo(() => {
        const list = allItems();
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

    createEffect(() => {
        const list = props?.srdItems();
        applySort(list);
    });

    return <Body class={`${style.body}`}>
        <div class={`${style.searchBar}`}>
            <SearchBar searchFunction={(data, search) => data.name.trim().toLowerCase().includes(search.trim().toLowerCase())} dataSource={tabledata} setResults={setSearchResults} />
        </div>

        <div class={`${style.allItemsTable}`}>
            <Show when={columns()} keyed>
                <>
                    <Table data={paginatedData} columns={columns()}>
                        <Column name="name" class={`${is2014() ? style.nameCol : style.nameCol2024}`}>
                            <Header onClick={()=>dataSort("name")}>
                                Name

                                <Show when={currentSort()?.sortKey === "name"}>
                                    <span>{ currentSort()?.isAsc ? " ▲" : " ▼" }</span>
                                </Show>
                            </Header>
                        </Column>

                        <Column name="type" class={`${style.costCol}`}>
                            <Header onClick={()=>dataSort("type")}>
                                Type

                                <Show when={currentSort()?.sortKey === "type"}>
                                    <span>{ currentSort()?.isAsc ? " ▲" : " ▼" }</span>
                                </Show>
                            </Header>
                        </Column>
                        
                        <Column name="legacy" class={`${style.legacyCol}`}>
                            <Header onClick={()=>dataSort("legacy")}>
                                Legacy

                                <Show when={currentSort()?.sortKey === "legacy"}>
                                    <span>{ currentSort()?.isAsc ? " ▲" : " ▼" }</span>
                                </Show>
                            </Header>
                        </Column>

                        <Column name="menu" class={`${style.menuCol}`}>
                            <Header class={`${style.noClicky}`}>
                                <></>
                            </Header>
                        </Column>
                    </Table>

                    <div class={`${style.scrollable}`}>
                        <Table data={paginatedData} columns={columns()}>
                            <Column name="name" class={`${is2014() ? style.nameCol : style.nameCol2024}`}>
                                <Cell<srdItem>>
                                    {(item => <div>
                                        {item.name}
                                    </div>)}
                                </Cell>
                            </Column>

                            <Column name="type" class={`${style.costCol}`}>
                                <Cell<srdItem>>
                                    {(item => <div>
                                        {ItemType[item.type]}
                                    </div>)}
                                </Cell>
                            </Column>
                            
                            <Column name="legacy" class={`${style.legacyCol}`}>
                                <Cell<srdItem>>
                                    {(item => <div>
                                        <Show when={item.legacy === true}>
                                            Legacy
                                        </Show>
                                    </div>)}
                                </Cell>
                            </Column>

                            <Column name="menu" class={`${style.menuCol}`}>
                                <Cell<srdItem> onClick={(e)=>e.stopPropagation()}>
                                    {(item => <ItemsMenu openDialog={()=>{
                                        setCurrentItem(item);
                                        setShowItem(old => !old);
                                    }} item={item} />)}
                                </Cell>
                            </Column>

                            <Row onClick={(e, item) => {
                                setCurrentItem(item);
                                setShowItem(old => !old);
                            }}/>
                        </Table>
                    </div>
                </>
            </Show>
        </div>

        <div>
            <Paginator items={searchResult$} setPaginatedItems={setPaginatedData} />
        </div>

        <Show when={showItem() && currentItem()}>
            <ItemPopup show={[showItem, setShowItem]} item={currentItem as any} />
        </Show>
    </Body>
}