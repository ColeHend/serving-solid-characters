import {
  Component,
  Show,
  createEffect,
  createMemo,
  createSignal,
} from "solid-js";
import styles from "./feats.module.scss";
// import { Feat } from "../../../models/old/feat.model";
import Paginator from "../../../shared/components/paginator/paginator";
import { effect } from "solid-js/web";
import useGetFeats from "../../../shared/customHooks/dndInfo/oldSrdinfo/data/useGetFeats";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { homebrewManager } from "../../../shared";
import FeatView from "../../../shared/components/modals/featModal/featView";
import { Body,Button,Icon,Table,Row,Cell,Header, Column, Menu, MenuItem } from "coles-solid-library";
import { FeatMenu } from "./featMenu/featMenu";
import { useDnDFeats } from "../../../shared/customHooks/dndInfo/info/all/feats";
import { Feat } from "../../../models/data";

const featsList: Component = () => {
  const [showFeatModal,setShowFeatModal] = createSignal<boolean>(false);
  const [paginatedFeats, setPaginatedFeats] = createSignal<Feat[]>([]);
  const [searchResult, setSearchResult] = createSignal<Feat[]>([]);
  const [currentFeat, setCurrentFeat] = createSignal<Feat | undefined>(undefined);
  const [tableData, setTableData] = createSignal<Feat[]>([]);
  
  const [searchParam, setSearchParam] = useSearchParams();
  const srdFeats = useDnDFeats();
  const navigate = useNavigate()
  
  
  const selectedFeat = createMemo(() => {
    const list = srdFeats();
    if (list.length === 0) return undefined;
    const target = (searchParam.name || list[0].details.name).toLowerCase();
    return list.find(f => f.details.name.toLowerCase() === target) || list[0];
  })
  
  const displayResults = createMemo(() => searchResult().length > 0 ? searchResult() : srdFeats() );
  
  // if (!searchParam.name) setSearchParam({ name: srdFeats()[0]?.details.name });
  
  
  
  // Ensure we always have a valid name param once feats load (or version changes)
  createEffect(()=>{
    const list = srdFeats();
    if (list.length === 0) return;
    const param = searchParam.name;
    const found = param && list.some(f => f.details.name.toLowerCase() === param.toLowerCase());
    if (!found) {
      setSearchParam({ name: list[0].details.name});
    }
  });

  // Keep currentFeat in sync with derived selectedFeat
  createEffect(() => {
    const sel = selectedFeat();
    if (sel) setCurrentFeat(sel);

    if(showFeatModal() && sel?.details.name) {
      setSearchParam({ name: sel.details.name})
    } else if (!showFeatModal()) {
      setSearchParam({ name: ""})
    }
  })

  createEffect(()=>{
    const list = srdFeats();
    setTableData(list);
  })

  return (
    <Body class={`${styles.featWrapper}`}>
      <h1 class={styles.header}>Feats</h1>
                
      <div class={`${styles.searchDiv}`}>
        <SearchBar
          dataSource={tableData}
          setResults={setSearchResult}
          searchFunction={(data,search)=>{
            return data.details.name.toLowerCase() === search.toLowerCase();
          }}></SearchBar>
      </div>
                
      <div class={`${styles.featTable}`}>
        <Table data={() => paginatedFeats()} columns={["name","options"]}>
                        
          <Column name="name">
            <Header><></></Header>
            <Cell<Feat>>
              { (feat) => <span onClick={()=>{
                setCurrentFeat(feat);
                setShowFeatModal(!showFeatModal());
              }}>
                {feat.details.name} 
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
        <Paginator items={displayResults} setPaginatedItems={setPaginatedFeats} />
      </div>
    </Body>
  );
}
export default featsList;
