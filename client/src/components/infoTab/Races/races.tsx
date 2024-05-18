import { Component, For, Show, createMemo, createSignal } from "solid-js";
import useGetRaces from "../../../customHooks/data/useGetRaces";
import useStyle from "../../../customHooks/utility/style/styleHook";
import styles from "./races.module.scss";
import { effect } from "solid-js/web";


const races: Component = () => {
  // signals ↓
  const [RowShown, SetRowShown] = createSignal<number[]>([]);
  const toggleRow = (index: number) =>
    !hasIndex(index)
      ? SetRowShown([...RowShown(), index])
      : SetRowShown(RowShown().filter((i) => i !== index));
  const hasIndex = (index: number) => RowShown().includes(index);

  // import services ↓
  const dndSrdRaces = useGetRaces();
  const stylin = useStyle();

  effect(() => {
    console.log(dndSrdRaces()) 
  });

  return (
    <div class={`${stylin.accent} ${styles.outerStyles}`} id="racesComp">
      <h1>races</h1>

      <div class={`${styles.wrapper}`}>
        
        <div class={`${styles.fixed}`}> {/* sidebar  */} 
            <For each={dndSrdRaces()}>
              {(race, i) => (
                  <div class={`${styles.sidebar}`}>
                      <div class={`${styles.flexrow}`}>
                          <span onClick={() => toggleRow(i())}><Banner /></span> {/** ← add onclick here */} <span>{race.name}</span> 
                          <br />
                      </div>
                      <Show when={hasIndex(i())}> {/** shown when the flag is clicked */}
                          <div class={`${styles.sidebar_shown}`}>
                              <Show when={race.subRaces.length > 0}>
                                <button>subraces</button> {/** aaaaand here */}
                              </Show>
                          </div>
                      </Show>
                  </div>
              )}
            </For>
        </div>
        
        <div class={`${styles.thePage}`}> {/* the page  */}
          <For each={dndSrdRaces()}>
              {(race, i) => 
               <>
                <div>
                      <h1>{race.name}</h1>


                      <h2>{race.name} traits</h2>
                      <div>
                          <h3>ability score increases:</h3>
                          <For each={race.abilityBonuses}>
                              {(bonus) => 
                                  <>
                                    <br />
                                    <span>{bonus.name}</span> <span>{bonus.value}</span>
                                    <br />
                                  </>
                              }
                          </For>
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
                            {race.speed}
                          </span>

                          <h3>race specific traits:</h3>
                          
                          <span>
                            {/* {race.traits} */}
                            <For each={race.traits}>
                              {(trait) => 
                                <>
                                  <div>{trait.name}: <For each={trait.value}>{(value)=><span class={`${styles.wrap}`}>{value}</span>}</For></div>
                                  <br />
                                </>
                              }
                            </For>
                          </span>

                          <h3>languages:</h3>


                        <Show when={race.subRaces.length > 0}>
                          <h2>subraces</h2>
                          
                          <For each={race.subRaces}>
                                {(subrace) =>
                                  <div>

                                  </div>
                                }
                          </For>

                        </Show>

                      </div>
                      
                  </div>
                  <hr style={{width:"100%"}} />
               </>
              }
          </For>
        </div>
        
      
      </div>

    </div>
  );
};

export default races;


const Banner: Component = () => {
    return (
        <svg class={`${styles.banner}`} width="50" height="40" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
            <path d="M 15 5 L 35 5 L 35 45 L 25 35 L 15 45 Z" fill="none" stroke="white" stroke-width="2"/>
        </svg>
    );
  };