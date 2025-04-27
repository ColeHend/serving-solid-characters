import { Component, createMemo, createSignal, Show } from "solid-js";
import useGetBackgrounds from "../../../shared/customHooks/dndInfo/oldSrdinfo/data/useGetBackgrounds";
import styles from "./backgrounds.module.scss";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { Background } from "../../../models";
import Table from "../../../shared/components/Table/table";
import { Cell, Column, Header } from "../../../shared/components/Table/innerTable";
import { Body, Button, homebrewManager, Paginator, SkinnySnowman } from "../../../shared";
import BackgroundView from "../../../shared/components/modals/background/backgrondView";

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

  const navigate = useNavigate();

  const checkForHomebrew = (background: Background): boolean => {
    homebrewManager.backgrounds().forEach(customBackground =>{
      if (background.name.toLowerCase() === customBackground.name.toLowerCase()) {
        return true
      }
    })

    return false
  }
  const menuItems = (background:Background) => ([
    {
      name: checkForHomebrew(background) ? "Edit" :"Clone and Edit",
      action: () => {navigate(`/homebrew/create/backgrounds?name=${background.name}`)}
    },
    {
      name: "Calculate Dmg",
      action: () => {}
    }
  ])


  return <Body>
    <h1 class={`${styles.header}`}>Backgrounds</h1>
    <div class={`${styles.searchBar}`}>
      <SearchBar 
        placeholder="Search Backgrounds..." 
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
            { (background) => <span>
              <Button enableBackgroundClick menuItems={menuItems(background)} class={`${styles.menuBtn}`}>
                <SkinnySnowman />
              </Button>
            </span>}
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