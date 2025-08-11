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
import { useNavigate, useSearchParams } from "@solidjs/router";
import { SharedHookContext } from "../../rootApp";
import { Button } from "../../../shared/components";
import SpellModal from "../../../shared/components/modals/spellModal/spellModal.component";
import Table from "../../../shared/components/Table/table";
import {Chip} from "../../../shared/components";
import {
  Column,
  Header,
  Cell,
  Row,
  SecondRow,
} from "../../../shared/components/Table/innerTable";
import { Clone, homebrewManager, SkinnySnowman } from "../../../shared";
import { Body } from "coles-solid-library";

const masterSpells: Component = () => {
  const sharedHooks = useContext(SharedHookContext);
  const dndSrdSpells = useGetSpells();
  const navigate = useNavigate();



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
    homebrewManager.spells().forEach(customSpell=>{
      if (spell.name.toLowerCase() === customSpell.name.toLowerCase()) {
        return true;
      }
    })

    return false;
  };

  const menuItems = (spell:Spell) => ([
    {
      name:checkForHomebrew(spell)?"Edit":"Clone and Edit",
      action: () => {navigate(`/homebrew/create/spells?name=${spell.name}`)}
    },
    {
      name: "Calculate Dmg",
      action: () => {}
    }
  ])


  createEffect(() => {
    setSearchParam({ name: currentSpell()?.name});

    if(showSpell() === false) {
      setSearchParam({name: ""})
    }
  });

  createEffect(() => {
    const allSpells = dndSrdSpells();

    setTableData(allSpells);
  });

  return (
    <Body>
      <h1 class={`${styles.header}`}>Spells</h1>
      <br />
      <SearchBar
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        spellsSrd={tableData}
      ></SearchBar>

      <div class={`${styles.SpellsBody}`}>
        <Table
          data={paginatedSpells}
          columns={["name","school","level","menu"]}
          dropdown>
          
          <Column name="name">
            <Header>
              <span onClick={() => dataSort("name")}>
                <strong>Name</strong>
                <Show when={currentSort().sortKey === "name"}>
                  <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
                </Show>
              </span>
            </Header>
            <Cell<Spell> class={`${styles.center}`}>
              {(spell) => (
                <div>
                  <span onClick={()=>setCurrentObj(spell)}>{spell.name}</span>
                </div>
              )}
            </Cell>
          </Column>

          <Show when={!sharedHooks.isMobile()}>
            <Column name="school">
              <Header class={styles.clickyHeader}>
                <span onClick={() => dataSort("school")}>
                  <strong>School</strong>
                  <Show when={currentSort().sortKey === "school"}>
                    <span >{currentSort().isAsc ? "▲" : "▼"}</span>
                  </Show>
                </span>
              </Header>
              <Cell<Spell> class={`${styles.center}`}>{ (spell) => <div>
                <span class={`${styles.small}`} onClick={()=>setCurrentObj(spell)}>{spell.school}</span>
              </div>}</Cell>
            </Column>
          </Show>

          <Column name="level">
            <Header>
              <span onClick={() => dataSort("level")}>
                <strong>Level</strong>
                <Show when={currentSort().sortKey === "level"}>
                  <span class={`${styles.small}`} >{currentSort().isAsc ? "▲" : "▼"}</span>
                </Show>
              </span>
            </Header>
            <Cell<Spell> class={`${styles.center}`}>
              {(spell) => <span onClick={()=>setCurrentObj(spell)}>{spell.level}</span>}
            </Cell>
          </Column>
          
          <Column name="menu">
            <Header><strong></strong></Header>

            <Cell<Spell>>
              { (spell) => <span>
                <Button enableBackgroundClick menuItems={menuItems(spell)} class={`${styles.spellMenuBtn}`}>
                  <SkinnySnowman />
                </Button>
              </span>}
            </Cell>
          </Column>

          <Row style={{width:"98%"}} />
          <SecondRow<Spell>>
            {(spell) => <div class={`${!sharedHooks.isMobile()?styles.flexRow:''}`}>
              {spell.ritual? <Chip key="ritual" value="yes" /> : ""}
              {spell.concentration ? <Chip key="concentration" value="yes" /> : ""}
              {spell.damageType ? <Chip key="dmg-type" value={spell.damageType} /> : ""}
              <Chip key="Comps" value={`${checkForComponents(spell).join(", ")}`} />
            </div>
            }
          </SecondRow>
          
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


