import {
  Component,
  Show,
  createEffect,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";
import styles from "./Spells.module.scss";
import Paginator from "../../../shared/components/paginator/paginator";
import SearchBar from "./searchBar/searchBar";
import { useSearchParams } from "@solidjs/router";
import { SharedHookContext } from "../../rootApp";
import SpellModal from "../../../shared/components/modals/spellModal/spellModal.component";
import { Clone, homebrewManager } from "../../../shared";
import { Body, Table, Chip, Icon, Column, Cell, Header,Menu, Row } from "coles-solid-library";
import { SpellMenu } from "./spellMenu/spellMenu";
import { useDnDSpells } from "../../../shared/customHooks/dndInfo/info/all/spells";
import { Spell } from "../../../models";

const masterSpells: Component = () => {
  const sharedHooks = useContext(SharedHookContext);
  const dndSrdSpells = useDnDSpells();

  // search param stuff
  const [searchParam, setSearchParam] = useSearchParams();

  // Ensure we always have a valid name param once spells load (or version changes)
  createEffect(() => {
    const list = dndSrdSpells();
    if (list.length === 0) return;
    const param = searchParam.name;
    const found = param && list.some(s => s.name.toLowerCase() === param.toLowerCase());
    if (!found) {
      setSearchParam({ name: list[0].name });
    }
  });

  // Reactive selected spell derived from spells + name param
  const selectedSpell = createMemo(() => {
    const list = dndSrdSpells();
    if (list.length === 0) return undefined;
    const target = (searchParam.name || list[0].name).toLowerCase();
    return list.find(s => s.name.toLowerCase() === target) || list[0];
  });

  const [currentSpell, setCurrentSpell] = createSignal<Spell | undefined>(undefined);

  // Keep currentSpell in sync with derived selectedSpell
  createEffect(() => {
    const sel = selectedSpell();
    if (sel) setCurrentSpell(sel);
  });

  //-------------

  const [paginatedSpells, setPaginatedSpells] = createSignal<Spell[]>([]);
  const [searchResults, setSearchResults] = createSignal<Spell[]>([]);
  const [showSpell, setShowSpell] = createSignal(false);
  const [currentSort, setCurrentSort] = createSignal<{
    sortKey: string;
    isAsc: boolean;
  }>({ sortKey: "level", isAsc: true });
  const [tableData, setTableData] = createSignal<Spell[]>([]);


  const paginateItems = createMemo(() =>
    searchResults().length > 0 ? searchResults() : dndSrdSpells()
  );
						
  const dataSort = (sortBy: keyof Spell) => {
    setCurrentSort((old) => {
      if (old.sortKey === sortBy) {
        return Clone({ sortKey: sortBy as string, isAsc: !old.isAsc });
      } else {
        return Clone({ sortKey: sortBy as string, isAsc: old.isAsc });
      }
    });
    setTableData((old) => {
      const currentSorting = currentSort();
      const shouldAce = currentSorting.isAsc;

      return Clone(
        old.sort((a, b) => {
          const aSort =
            typeof a?.[sortBy] === "string"
              ? a?.[sortBy].replaceAll(" ", "")
              : a?.[sortBy];
          const bSort =
            typeof b?.[sortBy] === "string"
              ? b?.[sortBy].replaceAll(" ", "")
              : b?.[sortBy];

          if (aSort === undefined || bSort === undefined) {
            return 0;
          }

          if (aSort < bSort) return shouldAce ? 1 : -1;
          if (aSort > bSort) return shouldAce ? -1 : 1;
          return 0;
        })
      );

      return old;
    });
  };

  const setCurrentObj = (spell: Spell) => {

    setCurrentSpell(spell);
    setShowSpell(true);

  }

  const checkForComponents = (spell: Spell) => {
    const returnarr:string[] = [];
    
    if (spell.isSomatic) {
      returnarr.push("S");
    }
    if (spell.isVerbal) {
      returnarr.push("V");
    }
    if (spell.isMaterial) {
      returnarr.push("M");
    }

    return returnarr;
  }

  const checkForHomebrew = (spell:Spell):boolean => {
    try {
      return homebrewManager.spells().some(customSpell => customSpell.name.toLowerCase() === spell.name.toLowerCase());
    } catch {
      return false;
    }
  };



  createEffect(() => {
    const cur = currentSpell();
    if (showSpell() && cur?.name) {
      setSearchParam({ name: cur.name });
    } else if (!showSpell()) {
      setSearchParam({ name: "" });
    }
  });

  createEffect(() => {
    const allSpells = dndSrdSpells();

    setTableData(allSpells);
  });

  return (
    <Body class={`${styles.spellsBody}`}>
      <h1>Spells</h1>
      <SearchBar
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        spellsSrd={tableData}
      ></SearchBar>

      <div class={`${styles.SpellsBody}`}>
        <Table 
          data={() => paginatedSpells()} 
          columns={["name","school","level","menu"]}> 
          <Column name="name">
            <Header onClick={()=>dataSort("name")}>
              Name
              <Show when={currentSort().sortKey === "name"}>
                <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
              </Show>
            </Header>
            <Cell<Spell> rowNumber={1}>{(spell) => <span>
              {spell.name}
            </span>}</Cell>
          </Column>

          <Column name="school">
            <Header onClick={()=>dataSort("school")}>
              School
              <Show when={currentSort().sortKey === "school"}>
                <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
              </Show>
            </Header>
            <Cell<Spell>>{(spell) => spell.school }</Cell>
          </Column>

          <Column name="level">
            <Header onClick={()=>dataSort("level")}>
              Level
              <Show when={currentSort().sortKey === "level"}>
                <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
              </Show>
            </Header>
            <Cell<Spell>>{(spell) => spell.level }</Cell>
          </Column>

          <Column name="menu">
            <Header><></></Header>
            <Cell<Spell> onClick={(e)=>e.stopPropagation()}>{(spell) => <>
              <SpellMenu spell={spell}/>
            </> }</Cell>
          </Column>

          <Row rowNumber={1} onClick={(e,spell)=>{
            setCurrentSpell(spell);
            setShowSpell((old)=>!old);
            
          }} style={{height:"40px"}}/>
        </Table>
      </div>

      <Show when={showSpell() && currentSpell()}>
        <SpellModal spell={currentSpell as any} backgroundClick={[showSpell,setShowSpell]} />
      </Show>
    
      <div class={`${styles.paginator}`}>
        <Paginator
          items={paginateItems}
          setPaginatedItems={setPaginatedSpells}
        ></Paginator>
      </div>
    </Body>
  );
};
export default masterSpells;


