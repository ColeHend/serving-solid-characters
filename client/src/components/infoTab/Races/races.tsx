import { Accessor, Component, For, Match, Show, Switch, createMemo, createSignal, useContext } from "solid-js";
import useGetRaces from "../../../shared/customHooks/data/useGetRaces";
import styles from "./races.module.scss";
import { effect } from "solid-js/web";
import { Race } from "../../../models/race.model";
import { useNavigate, useSearchParams } from "@solidjs/router";
import Button from "../../../shared/components/Button/Button";
import { SharedHookContext } from "../../rootApp";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { Body, Paginator, SkinnySnowman,homebrewManager } from "../../../shared";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import {Table} from "../../../shared/components/Table/table";
import { Cell, Column, Header } from "../../../shared/components/Table/innerTable";
import RaceView from "../../../shared/components/modals/raceView/raceView";

const races: Component = () => {
  // import services ↓
  const dndSrdRaces = useGetRaces();

  const sharedHooks = useContext(SharedHookContext);
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyles(userSettings().theme));
  const [searchParam,setSearchParam] = useSearchParams();
  const selectedRace = dndSrdRaces()?.filter((val)=>val.name?.toLowerCase() === searchParam?.name?.toLowerCase());
  const [currentRace,setCurrentRace] = createSignal<Race>({} as Race);
  const [results,setResults] = createSignal<Race[]>([]);
  const [paginatedRaces,setPaginatedRaces] = createSignal<Race[]>([]);
  const [showRace,setShowRace] = createSignal<boolean>(false);
  
  const displayResults = createMemo(()=>results().length > 0?results():dndSrdRaces())
  
  const navigate = useNavigate();

  if(!!!searchParam.name) setSearchParam({name: currentRace()?.name});
  
  const checkForHomebrew = (race: Race):boolean => {

    homebrewManager.races().forEach(customRace=> {
      if (customRace.name.toLowerCase() === race.name.toLowerCase()) {
        return true
      }
    })

    return false
  }

  const menuItems = (race:Race) => ([
    {
      name: checkForHomebrew(race) ? "Edit" : "Clone and Edit",
      action: ()=> {navigate(`/homebrew/create/races?name=${race.name}`)}
    },
    {
      name: "Calulate dmg",
      action: ()=> {}
    }
  ])

  effect(()=>{
    setSearchParam({name: dndSrdRaces().length > 0 ? currentRace()?.name : "Dragonborn"})
  })
  return <Body>
      <h1 class={`${styles.header}`}>Races</h1>

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
              { (race, i) => <span onClick={()=>{
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
                { (race, i) => <span>
                  <Button enableBackgroundClick menuItems={menuItems(race)} class={`${styles.menuBtn}`}>
                    <SkinnySnowman />
                  </Button>
                </span>}
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