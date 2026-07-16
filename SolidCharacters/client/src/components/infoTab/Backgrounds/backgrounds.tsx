/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import styles from "./backgrounds.module.scss";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { useSearchParams } from "@solidjs/router";
import { Background } from "../../../models/generated";
import { createTableSort, getUserSettings, Paginator } from "../../../shared";
import BackgroundView from "../../../shared/components/modals/background/backgrondView";
import { Body, Table, Cell, Column, Header, Row } from "coles-solid-library";
import { BackgroundMenu } from "./backgroundMenu/backgroundMenu";
import { useDnDBackgrounds } from "../../../shared/customHooks/dndInfo/info/all/backgrounds";
import { trackRecentItem } from "../../../shared/customHooks/useRecentItems";

const Viewbackgrounds: Component = () => {
  const [currentBackground,setCurrentBackground] = createSignal<Background | undefined>(undefined); 
  const [showTheBackground,setShowTheBackground] = createSignal<boolean>(false);
  const [paginatedBackgrounds,setPaginatedBackgrounds] = createSignal<Background[]>([])
  const [searchResult, setSearchResult] = createSignal<Background[]>([]);
  const [tableData, setTableData] = createSignal<Background[]>([]);
  
  const { currentSort, dataSort, applySort } = createTableSort<Background>({
    data: [tableData, setTableData],
    syncSetters: [setSearchResult],
  });

  const [searchParam, setSearchParam] = useSearchParams();
  const [userSettings] = getUserSettings();
  const srdbackgrounds = useDnDBackgrounds();

  const displayResults = createMemo(()=>{
    return searchResult().length <= 0 ? srdbackgrounds() : searchResult()
  })

  const system = createMemo(() => userSettings().dndSystem);

  const is2014 = createMemo(() => system() === "2014" || system() === "both");

  const columns = createMemo(() =>
    is2014() ? ["name", "legacy", "menu"] : ["name", "menu"]
  );

  // Ensure we always have a valid name param once backgrounds load (or version changes)
  createEffect(() => {
    const list = srdbackgrounds();
    if (list.length === 0) return;
    const param = searchParam.name;
    const found = param && list.some(b => b.name.toLowerCase() === (typeof param !== "string" ? param.join(" ") : param ).toLowerCase());
    if (!found) {
      setSearchParam({ name: list[0].name });
    }
  })

  const selectedBackground = createMemo(() => {
    const list = srdbackgrounds();
    if (list.length === 0) return undefined;
    const searchString = (typeof searchParam.name !== "string" ? searchParam.name?.join(" ") : searchParam.name )
    const target = (searchString || list[0].name).toLowerCase();
    return list.find(b => b.name.toLowerCase() === target) || list[0];
  })

  createEffect(() => {
    const sel = selectedBackground();
    if (sel) setCurrentBackground(sel);
  })

  createEffect(() => {
    const cur = currentBackground();

    if (showTheBackground() && cur?.name) {
      setSearchParam({ name: cur.name });
      trackRecentItem({
        name: cur.name,
        type: "background",
        route: `/info/backgrounds?search=${encodeURIComponent(cur.name)}`,
      });
    } else if (!showTheBackground()) {
      setSearchParam({ name: "" });
    }
  })

  createEffect(() => {
    const list = srdbackgrounds();
    applySort(list);
  })

  onMount(() => {
    document.body.classList.add("backgrounds-bg");
  })

  onCleanup(() => {
    document.body.classList.remove("backgrounds-bg");
  })

  return <Body class={`${styles.body}`}>
    <h1 class={`${styles.Title}`}>Backgrounds</h1>
    <div class={`${styles.searchBar}`}>
      <SearchBar
        dataSource={tableData}
        setResults={setSearchResult}
        searchFunction={(data,search)=>{
          return data.name.toLowerCase() === search.toLowerCase();
        }}
        seed={typeof searchParam.search === "string" ? searchParam.search : searchParam.search?.[0]}/>
    </div>
    <div class={`${styles.backgroundsDiv}`} >
      <Show when={columns()} keyed>
        <>
          <Table data={() => paginatedBackgrounds()} columns={columns()}>
              <Column name="name" class={`${is2014() ? styles.nameCol : styles.nameCol2024}`}>
                <Header onClick={()=>dataSort("name")}>
                  Name
                  <Show when={currentSort().sortKey === "name"}>
                    <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
                  </Show>
                </Header>
              </Column>

              <Column name="legacy" class={`${styles.legacyCol}`}>
                <Header onClick={()=>dataSort("legacy")}>
                  Legacy
                  <Show when={currentSort().sortKey === "legacy"}>
                    <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
                  </Show>
                </Header>
              </Column>

              <Column name="menu" class={`${styles.menuCol}`}>
                <Header class={`${styles.noClicky}`}><></></Header>
              </Column>
            </Table>

          <div class={`${styles.scrollable}`}>
            <Table data={() => paginatedBackgrounds()} columns={columns()}>
              <Column name="name" class={`${is2014() ? styles.nameCol : styles.nameCol2024}`}>
                <Cell<Background>>
                  { (background) => <span>
                    {background.name}    
                  </span>}
                </Cell>
              </Column>

              <Column name="legacy" class={`${styles.legacyCol}`}>
                  <Cell<Background>>
                    {(background) => <Show when={background.legacy === true}>
                      <span>
                        legacy
                      </span>  
                    </Show>}
                  </Cell>
              </Column>

              <Column name="menu" class={`${styles.menuCol}`}>

                <Cell<Background> onClick={(e)=>e.stopPropagation()}>
                  { (background) => <BackgroundMenu openDialog={()=>{
                    setCurrentBackground(background);
                    setShowTheBackground(!showTheBackground());
                  }} background={background} />}
                </Cell>
              </Column>

              <Row onClick={(e ,background)=>{
                setCurrentBackground(background);
                setShowTheBackground(!showTheBackground());
              }}/>
            </Table>
          </div>
        </>
      </Show>
    </div> 

    <Show when={showTheBackground()}>
      <BackgroundView background={currentBackground as any} backClick={[showTheBackground,setShowTheBackground]} />
    </Show>

    <div class={`${styles.paginator}`}>
      <Paginator items={displayResults} setPaginatedItems={setPaginatedBackgrounds} transparent />
    </div>           
  </Body>
};
export default Viewbackgrounds;