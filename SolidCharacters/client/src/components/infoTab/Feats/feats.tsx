import {
  Component,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { 
  Body,
  Table,
  Cell,
  Header,
  Column, 
} from "coles-solid-library";
import { homebrewManager, Paginator } from "../../../shared";
import { useSearchParams } from "@solidjs/router";
import { FeatMenu } from "./featMenu/featMenu";
import { useDnDFeats } from "../../../shared/customHooks/dndInfo/info/all/feats";
import { Feat } from "../../../models/generated";
import FeatView from "../../../shared/components/modals/featModal/featView";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import styles from "./feats.module.scss";

const featsList: Component = () => {
  const [currentFeat, setCurrentFeat] = createSignal<Feat | undefined>(undefined);
  const [showFeatModal,setShowFeatModal] = createSignal<boolean>(false);
  const [paginatedFeats, setPaginatedFeats] = createSignal<Feat[]>([]);
  const [searchResult, setSearchResult] = createSignal<Feat[]>([]);
  const [tableData, setTableData] = createSignal<Feat[]>([]);
  
  const [searchParam, setSearchParam] = useSearchParams();
  const srdFeats = useDnDFeats();
  // Create a unified list including homebrew feats; normalize any legacy feats missing details
  const allFeats = createMemo<Feat[]>(() => {
    const base = srdFeats() || [];
    const homebrew = (homebrewManager.feats() || []).map((f: any) => {
      if (!f.details) {
        f.details = { name: f.name || '', description: Array.isArray(f.desc) ? f.desc[0] : (f.desc || '') };
      }
      return f as Feat;
    });
    // Avoid duplicates by name (prefer homebrew override)
    const seen = new Set<string>();
    const merged: Feat[] = [];
    [...base, ...homebrew].forEach(f => {
      const key = f.details?.name || (f as any).name;
      if (!key) return;
      if (seen.has(key.toLowerCase())) return;
      seen.add(key.toLowerCase());
      merged.push(f);
    });
    return merged;
  });
  
  const displayResults = createMemo(() => searchResult().length > 0 ? searchResult() : allFeats() );
  
  // Ensure we always have a valid name param once feats load (or version changes)
  createEffect(()=>{
    const list = allFeats();
    if (list.length === 0) return;
    const param = typeof searchParam.name !== "string" ? searchParam.name?.[0]: searchParam.name;
    const found = param && list.some(f => f.details?.name && f.details.name.toLowerCase() === param.toLowerCase());
    if (!found) {
      setSearchParam({ name: list[0].details?.name || ''});
    }
  });
  
  const selectedFeat = createMemo(() => {
  const list = allFeats();
    if (list.length === 0) return undefined;
    const param = typeof searchParam.name !== "string" ? searchParam.name?.[0]: searchParam.name;
    const target = (param || list[0].details?.name || '').toLowerCase();
    return list.find(f => f.details?.name && f.details.name.toLowerCase() === target) || list[0];
  })
  
  
  // Keep currentFeat in sync with derived selectedFeat
  createEffect(() => {
    const sel = selectedFeat();
    if (sel) setCurrentFeat(sel);
  })

  createEffect(()=>{
    const cur = currentFeat();

    if(showFeatModal() && cur?.details?.name) {
      setSearchParam({ name: cur.details.name})
    } else if (!showFeatModal()) {
      setSearchParam({ name: ""})
    }
  })

  onMount(()=>{
    document.body.classList.add('feats-bg');
  })

  onCleanup(()=>{
    document.body.classList.remove('feats-bg');
  })

  createEffect(()=>{
  const list = allFeats();
  setTableData(list.filter(f => f?.details?.name));
  })

  return (
    <Body class={`${styles.body}`}>
      <h1>Feats</h1>
                
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
                setShowFeatModal((old) => !old);
              }}>
                {feat.details?.name || (feat as any).name || ''} 
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
        <FeatView feat={currentFeat as any} show={[showFeatModal,setShowFeatModal]} width="40%" height="40%" />
      </Show>
               
      <div class={`${styles.paginator}`}>
        <Paginator items={displayResults} setPaginatedItems={setPaginatedFeats} transparent/>
      </div>
    </Body>
  );
}
export default featsList;
