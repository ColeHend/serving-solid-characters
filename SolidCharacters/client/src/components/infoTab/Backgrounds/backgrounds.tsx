import { Component, createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import styles from "./backgrounds.module.scss";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { useSearchParams } from "@solidjs/router";
// import { Background } from "../../../models/data";
import { Background } from "../../../models/data";
import { Paginator } from "../../../shared";
import BackgroundView from "../../../shared/components/modals/background/backgrondView";
import { Body, Table, Cell, Column, Header } from "coles-solid-library";
import { BackgroundMenu } from "./backgroundMenu/backgroundMenu";
import { useDnDBackgrounds } from "../../../shared/customHooks/dndInfo/info/all/backgrounds";

const Viewbackgrounds: Component = () => {
  const [currentBackground,setCurrentBackground] = createSignal<Background | undefined>(undefined); 
  const [showTheBackground,setShowTheBackground] = createSignal<boolean>(false);
  const [paginatedBackgrounds,setPaginatedBackgrounds] = createSignal<Background[]>([])
  const [searchResult, setSearchResult] = createSignal<Background[]>([]);
  const [tableData, setTableData] = createSignal<Background[]>([]);
  
  const [searchParam, setSearchParam] = useSearchParams();
  const srdbackgrounds = useDnDBackgrounds();

  const displayResults = createMemo(()=>{
    return searchResult().length <= 0 ? srdbackgrounds() : searchResult()
  })

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
    } else if (!showTheBackground()) {
      setSearchParam({ name: "" });
    }
  })

  createEffect(() => {
    const list = srdbackgrounds();
    setTableData(list);
  })

  onMount(() => {
    document.body.classList.add("backgrounds-bg");
  })

  onCleanup(() => {
    document.body.classList.remove("backgrounds-bg");
  })

  return <Body class={`${styles.body}`}>
    <h1>Backgrounds</h1>
    <div class={`${styles.searchBar}`}>
      <SearchBar 
        dataSource={tableData} 
        setResults={setSearchResult}
        searchFunction={(data,search)=>{
          return data.name.toLowerCase() === search.toLowerCase();
        }}/>
    </div>
    <div class={`${styles.backgroundsDiv}`} >
      <Table data={() => paginatedBackgrounds()} columns={["name","options"]}>
        <Column name="name">
          <Header><></></Header>

          <Cell<Background>>
            { (background) => <span onClick={()=>{
              setCurrentBackground(background);
              setShowTheBackground(!showTheBackground());
            }}>
              {background.name}    
            </span>}
          </Cell>
        </Column>

        <Column name="options">
          <Header><></></Header>

          <Cell<Background>>
            { (background) => <BackgroundMenu background={background} />}
          </Cell>
        </Column>
      </Table>
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