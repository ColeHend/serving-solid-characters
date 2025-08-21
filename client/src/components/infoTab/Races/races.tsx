import { 
  Component,
  Show,
  createMemo,
  createSignal 
} from "solid-js";
import { 
  Body,
  Table,
  Cell, 
  Column, 
  Header, 
} from "coles-solid-library";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { Paginator,homebrewManager } from "../../../shared";
import { effect } from "solid-js/web";
import { Race } from "../../../models/old/race.model";
import { RaceMenu } from "./raceMenu/raceMenu";
import useGetRaces from "../../../shared/customHooks/dndInfo/oldSrdinfo/data/useGetRaces";
import RaceView from "../../../shared/components/modals/raceView/raceView";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import styles from "./races.module.scss";

const races: Component = () => {
  const dndSrdRaces = useGetRaces();

  const [searchParam,setSearchParam] = useSearchParams();
  const [currentRace,setCurrentRace] = createSignal<Race>({} as Race);
  const [results,setResults] = createSignal<Race[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [paginatedRaces,setPaginatedRaces] = createSignal<Race[]>([]);
  const [showRace,setShowRace] = createSignal<boolean>(false);
  
  const displayResults = createMemo(()=>results().length > 0?results():dndSrdRaces())
  
  if(!searchParam.name) setSearchParam({name: currentRace()?.name});
  
  
  effect(()=>{
    setSearchParam({name: dndSrdRaces().length > 0 ? currentRace()?.name : "Dragonborn"})
  })

  return <Body>
    <h1>Races</h1>

    <div class={`${styles.searchBar}`}>
      <SearchBar 
        dataSource={dndSrdRaces} 
        setResults={setResults}
        searchFunction={(data,search)=>{
          return data.name.toLowerCase() === search.toLowerCase();
        }}/>
    </div>

    <div class={`${styles.racesTable}`}>
      <Table  data={displayResults} columns={["name","options"]}  >
          
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
      <Paginator items={results} setPaginatedItems={setPaginatedRaces} />
    </div>

  </Body>
};
export default races;