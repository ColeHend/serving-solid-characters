import { Component, For, Match, Show, Switch, createMemo, createSignal } from "solid-js";
import useGetRaces from "../../../customHooks/data/useGetRaces";
import useStyle from "../../../customHooks/utility/style/styleHook";
import styles from "./races.module.scss";
import { effect } from "solid-js/web";
import { Race } from "../../../models/race.model";
import Subrace from "./subraces/subrace";
import Banner from "./banner";
import Sidebar from "./sidebar";


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

  return (
    <>
      <Sidebar dndSrdRaces={dndSrdRaces} styles={styles} toggleRow={toggleRow} hasIndex={hasIndex} />
      <div class={`${stylin.accent} ${styles.outerStyles}`} id="racesComp">
        <h1>Races</h1>

        <div class={`${styles.wrapper}`}>


          <div class={`${styles.thePage}`}> {/* the page  */}
            <For each={dndSrdRaces()}>
              {(race, i) =>
                <>
                  <div>
                    <h1>{race.name}</h1>


                    <h2>{race.name} traits</h2>
                    <div>
                      <h3>ability score increases: </h3>
                      <div class={`${styles.abilityscore}`}>
                        <For each={race.abilityBonuses}>
                          {(bonus) =>
                            <>
                              <br />
                              <span>{bonus.name}</span> <span>{bonus.value}</span>
                              <br />
                            </>
                          }
                        </For>

                      </div>
                    
                      <h3>age:</h3>

                      <span class={`${styles.wrap}`}>
                        {race.age}
                      </span>

                      <h3>alignment:</h3>

                      <span class={`${styles.wrap}`}>
                        {race.alignment}
                      </span>

                      <h3>size:</h3>

                      <span class={`${styles.wrap}`}>
                        {race.sizeDescription}
                      </span>

                      <h3>speed:</h3>

                      <span>
                        {race.speed}ft
                      </span>

                      <h3>race specific traits:</h3>

                      <span>
                        {/* {race.traits} */}
                        <For each={race.traits}>
                          {(trait) =>
                            <>
                              <div>{trait.name}: <For each={trait.value}>{(value) => <span class={`${styles.wrap}`}>{value}</span>}</For></div>
                              <br />
                            </>
                          }
                        </For>
                      </span>

                      <h3>languages:</h3>

                      {race.languageDesc}

                      <br />


                     <Subrace styles={styles} race={race} />

                    </div>

                  </div>
                  <Show when={i() !== dndSrdRaces().length - 1}>
                    <hr style={{ width: "100%" }} />
                  </Show>
                </>
              }
            </For>
          </div>

        </div>

      </div>
    </>
  );
};
export default races;