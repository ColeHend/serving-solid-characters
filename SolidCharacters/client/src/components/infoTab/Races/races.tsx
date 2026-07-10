import { 
  Component,
  Show,
  createEffect,
  createMemo,
  createSignal, 
  onCleanup, 
  onMount
} from "solid-js";
import { 
  Body,
  Table,
  Cell, 
  Column, 
  Header,
  Row, 
} from "coles-solid-library";
import { useSearchParams } from "@solidjs/router";
import { createTableSort, getUserSettings, Paginator } from "../../../shared";
import { Race } from "../../../models/generated";
import { useDnDRaces } from "../../../shared/customHooks/dndInfo/info/all/races";
import { RaceMenu } from "./raceMenu/raceMenu";
import RaceView from "../../../shared/components/modals/raceView/raceView";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import styles from "./races.module.scss";

const races: Component = () => {
  const [showRace,setShowRace] = createSignal<boolean>(false);
   
  const [paginatedRaces,setPaginatedRaces] = createSignal<Race[]>([]);
  const [currentRace,setCurrentRace] = createSignal<Race>({} as Race);
  const [tableData, setTableData] = createSignal<Race[]>([]);
  const [results,setResults] = createSignal<Race[]>([]);
  
  const srdRaces = useDnDRaces();
  const [searchParam,setSearchParam] = useSearchParams();
  const [userSettings] = getUserSettings();

  const system = createMemo(() => userSettings().dndSystem);

  const is2014 = createMemo(() => system() === "2014" || system() === "both");

  const columns = createMemo(() => is2014() ? ["name","legacy","options"] : ["name","options"])

  const displayResults = createMemo(()=>results().length > 0 ? results() : srdRaces());

  const {currentSort, dataSort, applySort} = createTableSort<Race>({
    data: [tableData, setTableData],
    syncSetters: [setResults],
  })

  createEffect(() => {
    const list = srdRaces();
    if (list.length === 0) return;
    const param = typeof searchParam.name === "string" ? searchParam.name : searchParam.name?.join(" ");
    const found = param && list.some(r => r.name.toLowerCase() === param.toLowerCase());
    if (!found) {
      setSearchParam({ name: list[0].name});
    }
  })

  const selectedRace = createMemo(() => {
    const list = srdRaces();
    if (list.length === 0) return undefined;
    const param = typeof searchParam.name === "string" ? searchParam.name : searchParam.name?.join(" ");
    const target = (param|| list[0].name).toLowerCase();
    return list.find(r => r.name.toLowerCase() === target) || list[0];
  })
  
  createEffect(() => {
    const sel = selectedRace();
    if (sel) setCurrentRace(sel);
  })

  createEffect(() => {
    const cur = currentRace();

    if (showRace() && cur?.name) {
      setSearchParam({ name: cur?.name ?? ''})
    } else if (!showRace()) {
      setSearchParam({ name: ""})
    }
  })

  createEffect(() => {
    const list = srdRaces();
    applySort(list);
  })

  onMount(()=>{
    document.body.classList.add('race-bg');
  })

  onCleanup(()=>{
    document.body.classList.remove('race-bg');
  })

  return <Body class={`${styles.body}`}>
    <h1 class={`${styles.title}`}>Races</h1>

    <div class={`${styles.searchBar}`}>
      <SearchBar 
        dataSource={tableData} 
        setResults={setResults}
        searchFunction={(data,search)=>{
          return data.name.toLowerCase() === search.toLowerCase();
        }}/>
    </div>

    <div class={`${styles.racesTable}`}>
      <Show when={columns()} keyed>
        <>
          <Table  data={paginatedRaces} columns={columns()}  >
                
            <Column name="name" class={`${styles.nameCol}`}>
              <Header onClick={() => dataSort("name")}>
                Name
                
                <Show when={currentSort().sortKey === "name"}>
                    <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
                  </Show>
              </Header>
            </Column>

            <Column name="legacy" class={`${styles.legacyCol}`}>
              <Header onClick={() => dataSort("legacy")}>
                Legacy

                <Show when={currentSort().sortKey === "legacy"}>
                  <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
                </Show>
              </Header>
            </Column>

            <Column name="options" class={`${styles.optionsCol}`}>
              <Header><></></Header>
            </Column>

          </Table>

          <div class={`${styles.scrollable}`}>
            <Table  data={paginatedRaces} columns={columns()}  >
                
              <Column name="name" class={`${styles.nameCol}`}>

                <Cell<Race>>
                  { (race) => <span>
                    {race.name}
                  </span>}
                </Cell>
              </Column>

              <Column name="legacy" class={`${styles.legacyCol}`}>

                <Cell<Race>>
                  { (race) => <Show when={race.legacy === true}>
                    <span>
                      Legacy
                    </span>
                </Show>}
                </Cell>
              </Column>

              <Column name="options" class={`${styles.optionsCol}`}>

                <Cell<Race> onClick={(e)=>e.stopPropagation()}>
                  { (race) => <RaceMenu race={race} />}
                </Cell>
              </Column>

              <Row onClick={(e, race)=>{
                setCurrentRace(race);
                setShowRace(!showRace());
              }}/>
            </Table>
          </div>
        </>
      </Show>
    </div>

    <Show when={showRace()}>
      <RaceView currentRace={currentRace} backClick={[showRace,setShowRace]} width="60%" />
    </Show>

    <div class={`${styles.paginator}`}>
      <Paginator items={displayResults} setPaginatedItems={setPaginatedRaces} transparent />
    </div>

  </Body>
};
export default races;