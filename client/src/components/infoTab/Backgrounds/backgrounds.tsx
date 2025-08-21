import { Component, createMemo, createSignal, Show } from "solid-js";
import useGetBackgrounds from "../../../shared/customHooks/dndInfo/oldSrdinfo/data/useGetBackgrounds";
import styles from "./backgrounds.module.scss";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { useSearchParams } from "@solidjs/router";
import { Background } from "../../../models";
import { homebrewManager, Paginator } from "../../../shared";
import BackgroundView from "../../../shared/components/modals/background/backgrondView";
import { Body, Table, Cell, Column, Header, Button } from "coles-solid-library";
import { BackgroundMenu } from "./backgroundMenu/backgroundMenu";

const Viewbackgrounds: Component = () => {
  const backgrounds = useGetBackgrounds();
  const [searchResult, setSearchResult] = createSignal(backgrounds() || []);
  const displayResults = createMemo(()=>{
    return searchResult().length <= 0 ? backgrounds() : searchResult()
  })

  const [searchParam, setSearchParam] = useSearchParams();
  if (!searchParam.name) setSearchParam({name: backgrounds()[0]?.name})
  const selectedBackground = backgrounds().filter(x=>x.name?.toLowerCase() === (searchParam?.name || (backgrounds()[0]?.name ?? "")).toLowerCase())[0]
  const [currentBackground,setCurrentBackground] = createSignal<Background>(selectedBackground); 
  const [,setPaginatedBackgrounds] = createSignal<Background[]>([])
  const [showTheBackground,setShowTheBackground] = createSignal<boolean>(false);



  return <Body>
    <h1>Backgrounds</h1>
    <div class={`${styles.searchBar}`}>
      <SearchBar 
        dataSource={backgrounds} 
        setResults={setSearchResult}
        searchFunction={(data,search)=>{
          return data.name.toLowerCase() === search.toLowerCase();
        }}/>
    </div>
    <div class={`${styles.backgroundsDiv}`} >
      <Table data={displayResults} columns={["name","options"]}>
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
      <BackgroundView background={currentBackground} backClick={[showTheBackground,setShowTheBackground]} />
    </Show>

    <div class={`${styles.paginator}`}>
      <Paginator items={searchResult} setPaginatedItems={setPaginatedBackgrounds}  />
    </div>           
  </Body>
};
export default Viewbackgrounds;