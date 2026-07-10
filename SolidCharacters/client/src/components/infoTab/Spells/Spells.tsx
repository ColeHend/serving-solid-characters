/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Component,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import styles from "./Spells.module.scss";
import Paginator from "../../../shared/components/paginator/paginator";
import { useSearchParams } from "@solidjs/router";
import SpellModal from "../../../shared/components/modals/spellModal/spellModal.component";
import { createTableSort } from "../../../shared";
import { Body, Table, Column, Cell, Header, Row } from "coles-solid-library";
import { SpellMenu } from "./spellMenu/spellMenu";
import { useDnDSpells } from "../../../shared/customHooks/dndInfo/info/all/spells";
import { Spell } from "../../../models/generated";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";


const masterSpells: Component = () => {
  const dndSrdSpells = useDnDSpells();

  // search param stuff
  const [searchParam, setSearchParam] = useSearchParams();

  const [currentSpell, setCurrentSpell] = createSignal<Spell | undefined>(undefined);

  // Ensure we always have a valid name param once spells load (or version changes)
  createEffect(() => {
    const list = dndSrdSpells();
    if (list.length === 0) return;
    const param = searchParam.name;
    const found = param && list.some(s => s.name.toLowerCase() === (typeof param === "string" ? param.toLowerCase() : param.join(" ").toLowerCase() ));
    if (!found) {
      setSearchParam({ name: list[0].name });
    }
  });

  // Reactive selected spell derived from spells + name param
  const selectedSpell = createMemo(() => {
    const list = dndSrdSpells();
    if (list.length === 0) return undefined;
    const target = (typeof searchParam.name === "string" ? searchParam.name :searchParam.name?.join(" ")  || list[0].name).toLowerCase();
    return list.find(s => s.name.toLowerCase() === target) || list[0];
  });

 

  // Keep currentSpell in sync with derived selectedSpell
  createEffect(() => {
    const sel = selectedSpell();
    if (sel) setCurrentSpell(sel);
  });

  //-------------

  const [paginatedSpells, setPaginatedSpells] = createSignal<Spell[]>([]);
  const [searchResults, setSearchResults] = createSignal<Spell[]>([]);
  const [showSpell, setShowSpell] = createSignal(false);
  const [tableData, setTableData] = createSignal<Spell[]>([]);
  const [lastChar, setLastChar] = createSignal<string>("");

  const { currentSort, dataSort, applySort } = createTableSort<Spell>({
    data: [tableData, setTableData],
    syncSetters: [setSearchResults],
    initial: {sortKey: "level", isAsc: true}
  });

  const paginateItems = createMemo(() =>
    searchResults().length > 0 ? searchResults() : dndSrdSpells()
  );

  createEffect(() => {
    const cur = currentSpell();
    if (showSpell() && cur?.name) {
      setSearchParam({ name: cur.name });
    } else if (!showSpell()) {
      setSearchParam({ name: "" });
    }
  });

  onMount(()=>{
    document.body.classList.add('spells-bg');
  })

  onCleanup(()=>{
    document.body.classList.remove('spells-bg');
  })

  createEffect(() => {
    const allSpells = dndSrdSpells();

    applySort(allSpells);
  });

  return (
    <Body class={`${styles.body}`}>
      <h1 class={`${styles.bodyTitle}`}>Spells</h1>
      <div class={`${styles.searchBar}`}>
        <SearchBar 
          setResults={setSearchResults}
          dataSource={tableData}
          searchFunction={(spell,search)=> spell.name.toLowerCase().trim().includes(search.toLowerCase().trim())}
        />
      </div>
      <div class={`${styles.spellsBody}`}>
        <Table
          data={() => paginatedSpells()}
          columns={["name","school","level","menu"]}>
          <Column name="name" class={`${styles.SpellName}`}>
            <Header onClick={()=>dataSort("name")} class={`${styles.clickyHeader}`}>
              Name
              <Show when={currentSort().sortKey === "name"}>
                <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
              </Show>
            </Header>
          </Column>

           <Column name="school" class={`${styles.SpellSchool}`}>
            <Header onClick={()=>dataSort("school")} class={`${styles.clickyHeader}`}>
              School
              <Show when={currentSort().sortKey === "school"}>
                <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
              </Show>
            </Header>
          </Column>

          <Column name="level" class={`${styles.SpellLevel}`}>
            <Header onClick={()=>dataSort("level")} class={`${styles.clickyHeader}`}>
              Level
              <Show when={currentSort().sortKey === "level"}>
                <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
              </Show>
            </Header>
          </Column>

          <Column name="menu" class={`${styles.SpellActions}`}>
            <Header><></></Header>
          </Column>
        </Table>

        <div class={`${styles.scrollable}`}>
          <Table 
            data={() => paginatedSpells()} 
            columns={["name","school","level","menu"]}> 
            <Column name="name" class={`${styles.SpellName}`}>
              <Cell<Spell> rowNumber={1}>{(spell) => <span>
                {spell.name}
              </span>}</Cell>
            </Column>

            <Column name="school" class={`${styles.SpellSchool}`}>
              <Cell<Spell>>{(spell) => spell.school }</Cell>
            </Column>

            <Column name="level" class={`${styles.SpellLevel}`}>
              <Cell<Spell>>{(spell) => spell.level }</Cell>
            </Column>

            <Column name="menu" class={`${styles.SpellActions}`}>
              <Cell<Spell> onClick={(e)=>{
                e.stopPropagation()
              }}>{(spell) => <>
                <SpellMenu 
                  spell={spell}
                  lastChar={[lastChar, setLastChar]}/>
              </> }</Cell>
            </Column>

            <Row rowNumber={1} onClick={(e,spell)=>{
              setCurrentSpell(spell);
              setShowSpell((old)=>!old);
              
            }} style={{height:"40px"}}/>
          </Table>
        </div>
      </div>

      <Show when={showSpell() && currentSpell()}>
        <SpellModal spell={currentSpell as any} backgroundClick={[showSpell,setShowSpell]} />
      </Show>

      
    
      <div class={`${styles.paginator}`}>
        <Paginator
          items={paginateItems}
          setPaginatedItems={setPaginatedSpells}
          transparent
        ></Paginator>
      </div>
    </Body>
  );
};
export default masterSpells;


