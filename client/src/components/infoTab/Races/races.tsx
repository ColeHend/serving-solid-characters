import { Component, For, Match, Show, Switch, createMemo, createSignal } from "solid-js";
import useGetRaces from "../../../shared/customHooks/data/useGetRaces";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import styles from "./races.module.scss";
import { effect } from "solid-js/web";
import { Race } from "../../../models/race.model";
import Subrace from "./subraces/subrace";
import Banner from "../../../shared/components/Banner/banner";
import Sidebar from "./sidebar";
import ThePage from "./thePage";


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
  effect(()=>{
    console.log(dndSrdRaces());
    })
  return (
    <>
      <Sidebar dndSrdRaces={dndSrdRaces} styles={styles} toggleRow={toggleRow} hasIndex={hasIndex} />
      <div class={`${stylin.accent} ${styles.outerStyles}`} id="racesComp">
        <h1>Races</h1>

        <div class={`${styles.wrapper}`}>

          <ThePage styles={styles} dndSrdRaces={dndSrdRaces} />
          
        </div>

      </div>
    </>
  );
};
export default races;