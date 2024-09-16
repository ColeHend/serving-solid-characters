import {
  Component,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";
import styles from "./Spells.module.scss";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import useDnDSpells from "../../../shared/customHooks/dndInfo/srdinfo/useDnDSpells";
import Paginator from "../../../shared/components/paginator/paginator";
import { Spell } from "../../../models/spell.model";
import SearchBar from "./searchBar/searchBar";
import useGetSpells from "../../../shared/customHooks/data/useGetSpells";
import { useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import { SharedHookContext } from "../../rootApp";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { Body } from "../../../shared/components";
import Chip from "../../../shared/components/Chip/Chip";
import SpellModal from "../../../shared/components/modals/spellModal/spellModal.component";
import Table from "../../../shared/components/Table/table";
import {
  Column,
  Header,
  Cell,
  Row,
  SecondRow,
} from "../../../shared/components/Table/innerTable";
import { Clone } from "../../../shared";
import Chipbar from "../../../shared/components/Chipbar/chipbar";

const masterSpells: Component = () => {
  const sharedHooks = useContext(SharedHookContext);
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(() => useStyles(userSettings().theme));
  const dndSrdSpells = useGetSpells();
  let compArr: any[] = [];

  // search param stuff

  const [searchParam, setSearchParam] = useSearchParams();
  if (!!!searchParam.name) setSearchParam({ name: dndSrdSpells()[0]?.name });
  const selectedSpell = dndSrdSpells().filter(
    (x) =>
      x.name?.toLowerCase() ===
      (searchParam?.name || dndSrdSpells()[0]?.name).toLowerCase()
  )[0];
  const [currentSpell, setCurrentSpell] = createSignal<Spell>(selectedSpell);

  //-------------

  const [paginatedSpells, setPaginatedSpells] = createSignal<Spell[]>([]);
  const [searchResults, setSearchResults] = createSignal<any[]>([]);
  const [showSpell, setShowSpell] = createSignal(false);
  const [currentSort, setCurrentSort] = createSignal<{
    sortKey: string;
    isAsc: boolean;
  }>({ sortKey: "level", isAsc: true });
  const [tableData, setTableData] = createSignal<Spell[]>([]);

  const paginateItems = createMemo(() =>
    searchResults().length > 0 ? searchResults() : dndSrdSpells()
  );

  const spellLevel = (spellLevel: string) => {
    switch (spellLevel) {
      case "0":
        return "Cantrip";
      case "1":
        return "1st";
      case "2":
        return "2nd";
      case "3":
        return "3rd";
      default:
        return `${spellLevel}th`;
    }
  };

  const spellComponents = (spell: Spell) => {
    const components = [];
    if (spell.isVerbal) components.push("V");
    if (spell.isSomatic) components.push("S");
    if (spell.isMaterial) components.push("M");
    if (!!spell.materials_Needed) {
      return [components.join(", "), spell.materials_Needed ?? null].join(", ");
    }
    return components.join(", ");
  };

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

  createEffect(() => {
    setSearchParam({ name: currentSpell()?.name ?? "" });
  });

  createEffect(() => {
    const allSpells = dndSrdSpells();

    setTableData(allSpells);
  });
  return (
    <Body>
      <h1 class={`${styles.center}`}>Spells</h1>
      <br />
      <SearchBar
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        spellsSrd={tableData}
      ></SearchBar>

      <Show when={!sharedHooks.isMobile()}>
        <Table
          class={`${styles.SpellsBody}`}
          data={paginatedSpells}
          columns={["name", "level"]}
          dropdown
        >
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
              {(spell, i) => (
                <div>
                  <span>{spell.name}</span>
                </div>
              )}
            </Cell>
          </Column>
          <Column name="level">
            <Header>
              <span onClick={() => dataSort("level")}>
                <strong>Level</strong>
                <Show when={currentSort().sortKey === "level"}>
                  <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
                </Show>
              </span>
            </Header>
            <Cell<Spell> class={`${styles.center}`}>
              {(spell, i) => (
                <div>
                  <span>{spell.level}</span>
                </div>
              )}
            </Cell>
          </Column>

          <Row />
          <SecondRow<Spell>>
            {(spell, i) => (
              <div class={`${styles.view}`}>
                <div>
                  <h1>{spell.name}</h1>

                  <h2>
                    {spellLevel(spell.level)} {spell.school}
                  </h2>

                  <h2>Casting time: {spell.castingTime} </h2>

                  <h2>Range: {spell.range} </h2>

                  <h2>Component: {spellComponents(spell)}</h2>

                  <h2>Duration: {spell.duration}</h2>

                  <h2>Classes: {spell.classes.join(", ")}</h2>

                  <h2>SubClasses: {spell.subClasses.join(", ")}</h2>

                  <Show when={spell.ritual}>
                    <Chip class={`${styles.spellChip}`} key="ritual" value="yes" />
                  </Show>

                  <span>{spell.desc}</span>

                  <Show when={!!spell.higherLevel}>
                    <h4>At Higher Levels: </h4> <span>{spell.higherLevel}</span>
                  </Show>
                </div>
              </div>
            )}
          </SecondRow>
        </Table>
      </Show>
      <Show when={sharedHooks.isMobile()}>
        <div class={`${styles.header}`}>
          <span onClick={() => dataSort("name")}>
            <strong>Name</strong>
            <Show when={currentSort().sortKey === "name"}>
              <span>{currentSort().isAsc ? "↑" : "↓"}</span>
            </Show>
          </span>
          <span onClick={() => dataSort("level")}>
            <strong>Level</strong>
            <Show when={currentSort().sortKey === "level"}>
              <span>{currentSort().isAsc ? "↑" : "↓"}</span>
            </Show>
          </span>
        </div>
        <For each={paginatedSpells()}>
          {(spell, i) => (
            <>
              <div class={`${styles.headerBar}`}>
                <span
                  onClick={() => {
                    setCurrentSpell(spell);
                    setShowSpell((old) => !old);
                  }}
                >
                  {spell.name}
                </span>

                <span
                  onClick={() => {
                    setCurrentSpell(spell);
                    setShowSpell((old) => !old);
                  }}
                >
                  {spellLevel(spell.level)}
                </span>
              </div>
              <hr />
            </>
          )}
        </For>

        <Show when={showSpell()}>
          <SpellModal
            spell={currentSpell}
            backgroundClick={[showSpell, setShowSpell]}
          />
        </Show>
      </Show>

      <div class={`${styles.center} ${styles.paginator}`}>
        <Paginator
          items={paginateItems}
          setPaginatedItems={setPaginatedSpells}
        ></Paginator>
      </div>
    </Body>
  );
};
export default masterSpells;
