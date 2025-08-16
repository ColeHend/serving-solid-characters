import {
  Component,
  Show,
  createMemo,
  createSignal,
} from "solid-js";
import styles from "./feats.module.scss";
import { Feat } from "../../../models/old/feat.model";
import Paginator from "../../../shared/components/paginator/paginator";
import { effect } from "solid-js/web";
import useGetFeats from "../../../shared/customHooks/dndInfo/oldSrdinfo/data/useGetFeats";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { homebrewManager } from "../../../shared";
import FeatView from "../../../shared/components/modals/featModal/featView";
import { Body,Button,Icon,Table,Row,Cell,Header, Column, Menu, MenuItem } from "coles-solid-library";
import { FeatMenu } from "./featMenu/featMenu";

const featsList: Component = () => {
  const [paginatedFeats, setPaginatedFeats] = createSignal<Feat[]>([]);
  const [searchResult, setSearchResult] = createSignal<Feat[]>([]);
  const displayResults = createMemo(() => {
    if (searchResult().length === 0) return paginatedFeats();
    return searchResult();
  });
  const srdFeats = useGetFeats();
  const [searchParam, setSearchParam] = useSearchParams();
  if (!searchParam.name) setSearchParam({ name: srdFeats()[0]?.name });
  const selectedFeat = srdFeats().filter(
    (feat) =>{
      return feat.name?.toLowerCase() === (searchParam.name || (srdFeats()[0]?.name ?? "")).toLowerCase();
    }
  )[0];
  const [currentFeat, setCurrentFeat] = createSignal<Feat>(selectedFeat);
  const [showFeatModal,setShowFeatModal] = createSignal<boolean>(false);

  const navigate = useNavigate()

  

  effect(() => {
    setSearchParam({ name: currentFeat()?.name });
  });

  return (
    <Body class={`${styles.featWrapper}`}>
      <h1 class={styles.header}>Feats</h1>
                
      <div class={`${styles.searchDiv}`}>
        <SearchBar
          placeholder="Search Feats..."
          dataSource={srdFeats}
          setResults={setSearchResult}
          searchFunction={(data,search)=>{
            return data.name.toLowerCase() === search.toLowerCase();
          }}></SearchBar>
      </div>
                
      <div class={`${styles.featTable}`}>
        <Table data={displayResults} columns={["name","options"]}>
                        
          <Column name="name">
            <Header><></></Header>
            <Cell<Feat>>
              { (feat) => <span onClick={()=>{
                setCurrentFeat(feat);
                setShowFeatModal(!showFeatModal());
              }}>
                {feat.name} 
              </span>}
            </Cell>
          </Column>
          <Column name="options">
            <Header><></></Header>
            <Cell<Feat>>
              { (feat) => <FeatMenu feat={feat} />}
            </Cell>
          </Column>

        </Table>

      </div>

      <Show when={showFeatModal()}>
        <FeatView feat={currentFeat} show={[showFeatModal,setShowFeatModal]} width="40%" height="40%" />
      </Show>
               
      <div class={`${styles.paginator}`}>
        <Paginator items={srdFeats} setPaginatedItems={setPaginatedFeats} />
      </div>
    </Body>
  );
}
export default featsList;
