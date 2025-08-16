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
import { Spell } from "../../../models/old/spell.model";
import SearchBar from "./searchBar/searchBar";
import useGetSpells from "../../../shared/customHooks/dndInfo/oldSrdinfo/data/useGetSpells";
import { useSearchParams } from "@solidjs/router";
import { SharedHookContext } from "../../rootApp";
import SpellModal from "../../../shared/components/modals/spellModal/spellModal.component";
import { Clone, homebrewManager } from "../../../shared";
import { Body, Table, Chip, Icon, Column, Cell, Header,Menu, Row } from "coles-solid-library";
import { SpellMenu } from "./spellMenu/spellMenu";

const masterSpells: Component = () => {
  const sharedHooks = useContext(SharedHookContext);
  const dndSrdSpells = useGetSpells();



  // search param stuff

  const [searchParam, setSearchParam] = useSearchParams();
  if (!searchParam.name) setSearchParam({ name: dndSrdSpells()[0]?.name });
  const selectedSpell = dndSrdSpells().filter(
    (x) =>
      x.name?.toLowerCase() ===
      (searchParam?.name || (dndSrdSpells()[0]?.name ?? "")).toLowerCase()
  )[0];
  const [currentSpell, setCurrentSpell] = createSignal<Spell>(selectedSpell);

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
        return Clone({ sortKey: sortBy, isAsc: !old.isAsc });
      } else {
        return Clone({ sortKey: sortBy, isAsc: old.isAsc });
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
    <Body>
      <h1 class={`${styles.header}`}>Spells</h1>
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
            <Cell<Spell>>{(spell) => <span onClick={() => {
              setCurrentSpell(spell);
              setShowSpell((old)=>!old)
            }}>
              {spell.name}
            </span>}</Cell>
            <Cell<Spell> rowNumber={2} colSpan={2}>{(spell) => (
              <div style={{border: "1px solid", padding: "5px", 'border-radius': "10px"}}>
                <div>{spell?.range || "Loading..."}</div>
                <Show when={spell.ritual}>
                  <Chip key="ritual" value="yes"></Chip>

                </Show>

              </div>
            )}</Cell>
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
            <Cell<Spell>>{(spell) => <>
              <SpellMenu spell={spell}/>
            </> }</Cell>
          </Column>

          <Row style={{height:"40px"}} isDropHeader={true} />
          <Row rowNumber={2} isDropRow={true} />
        </Table>
      </div>

      <Show when={showSpell()}>
        <SpellModal spell={currentSpell} backgroundClick={[showSpell,setShowSpell]}   />
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


