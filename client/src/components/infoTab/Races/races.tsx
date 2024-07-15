import { Accessor, Component, For, Match, Show, Switch, createMemo, createSignal } from "solid-js";
import useGetRaces from "../../../shared/customHooks/data/useGetRaces";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import styles from "./races.module.scss";
import { effect } from "solid-js/web";
import { Race } from "../../../models/race.model";
import Subrace from "./subraces/subrace";
import Banner from "../../../shared/components/Banner/banner";
import Sidebar from "./sidebar";
import ThePage from "./thePage";
import { useSearchParams } from "@solidjs/router";
import Button from "../../../shared/components/Button/Button";


const races: Component = () => {
  // import services ↓
  const dndSrdRaces = useGetRaces();
  const stylin = useStyle();

  // signals ↓
  const [RowShown, SetRowShown] = createSignal<number[]>([]);
  const toggleRow = (index: number) =>
    !hasIndex(index)
      ? SetRowShown([...RowShown(), index])
      : SetRowShown(RowShown().filter((i) => i !== index));
  const hasIndex = (index: number) => RowShown().includes(index);

  const [searchParam,setSearchParam] = useSearchParams();
  const selectedRace = dndSrdRaces()?.findIndex((val)=>val.name.toLowerCase() === searchParam.name?.toLowerCase())
  const [currentRaceIndex,setCurrentRaceIndex] = createSignal<number>(selectedRace >= 0 ? selectedRace : 0) 
  
  if(!!!searchParam.name) setSearchParam({name: dndSrdRaces().length > 0 ? dndSrdRaces()[currentRaceIndex()].name: "dragonborn" });
  
  const currentRace:Accessor<Race> = createMemo(()=>dndSrdRaces().length > 0 && currentRaceIndex() >= 0 && currentRaceIndex() < dndSrdRaces().length ? dndSrdRaces()[currentRaceIndex()] : ({} as Race))

  effect(()=>{
    setSearchParam({name: dndSrdRaces().length > 0 ? currentRace()?.name : "Dragonborn"})
  })
  return (
    <>
      <div class={`${stylin.accent} ${styles.outerStyles}`} id="racesComp">
        <h1>Races</h1>

        <div class={`${styles.SelectorBar}`}>
          <button onClick={()=>currentRaceIndex() === 0 ? setCurrentRaceIndex(old=> (dndSrdRaces().length - 1)) : setCurrentRaceIndex(old=>old - 1)}>←</button>
          <span>{currentRace().name}</span>
          <button onClick={()=>currentRaceIndex() === (dndSrdRaces().length - 1) ? setCurrentRaceIndex(old=> 0) : setCurrentRaceIndex(old=>old + 1)}>→</button>
        </div>
{/* 
        <div>
                <Button onClick={()=>currentClassIndex() === 0 ? setCurrentCharacterIndex(old=> (dndSrdClasses().length - 1)) : setCurrentCharacterIndex(old=>old - 1)}>←</Button>
                <span>{currentClass().name}</span>
                <Button onClick={()=>currentClassIndex() === (dndSrdClasses().length - 1) ? setCurrentCharacterIndex(old=> 0) : setCurrentCharacterIndex(old=>old + 1)}>→</Button>
            </div> */}


        <div class={`${styles.wrapper}`}>

          <ThePage styles={styles} dndSrdRace={currentRace} />
          
        </div>

      </div>
    </>
  );
};
export default races;