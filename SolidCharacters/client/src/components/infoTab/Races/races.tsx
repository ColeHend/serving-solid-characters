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
} from "coles-solid-library";
import { useSearchParams } from "@solidjs/router";
import { Paginator } from "../../../shared";
import { Race } from "../../../models/data";
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

  const displayResults = createMemo(()=>results().length > 0?results():srdRaces())

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
      setSearchParam({ name: cur.name})
    } else if (!showRace()) {
      setSearchParam({ name: ""})
    }
  })

  createEffect(() => {
    const list = srdRaces();
    setTableData(list);
  })

  onMount(()=>{
    document.body.classList.add('race-bg');
  })

  onCleanup(()=>{
    document.body.classList.remove('race-bg');
  })

  return <Body class={`${styles.body}`}>
    <h1>Races</h1>

    <div class={`${styles.searchBar}`}>
      <SearchBar 
        dataSource={tableData} 
        setResults={setResults}
        searchFunction={(data,search)=>{
          return data.name.toLowerCase() === search.toLowerCase();
        }}/>
    </div>

    <div class={`${styles.racesTable}`}>
      <Table  data={paginatedRaces} columns={["name","options"]}  >
          
        <Column name="name">
          <Header><></></Header>

          <Cell<Race>>
            { (race) => <span onClick={()=>{
              setCurrentRace(race);
              setShowRace(!showRace());
            }}>
              {race.name}
            </span>}
          </Cell>
        </Column>

        <Column name="options">
          <Header><></></Header>

          <Cell<Race>>
            { (race) => <RaceMenu race={race} />}
          </Cell>
        </Column>

      </Table>
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