import { Component, For, Show } from "solid-js";
import { Race } from "../../../models/race.model";
import Subrace from "./subraces/subrace";
import { effect } from "solid-js/web";
import ExpansionPanel from "../../../shared/components/expansion/expansion";

type Props = {
  styles: CSSModuleClasses;
  dndSrdRaces: () => Race[];
};

const ThePage: Component<Props> = (props) => {
  let styles = props.styles;
  let dndSrdRaces = props.dndSrdRaces;
  
  return (
    <div class={`${styles.thePage}`}>
      {/* the page  */}
      <For each={dndSrdRaces()}>
        {(race, i) => (
          <>
            <div>
              <h1 id={`${race.name}`}>{race.name}</h1>

              <h2>{race.name} traits</h2>
              <div>
                <h3>Ability Score Increases: </h3>
                <div class={`${styles.abilityscore}`}>
                  <For each={race.abilityBonuses}>
                    {(bonus) => (
                      <>
                        <br />
                        <span>{bonus.name}</span> <span>{bonus.value}</span>
                        <br />
                      </>
                    )}
                  </For>
                </div>

                <h3>Age:</h3>

                <span class={`${styles.wrap}`}>{race.age}</span>

                <h3>Alignment:</h3>

                <span class={`${styles.wrap}`}>{race.alignment}</span>

                <h3>Size:</h3>

                <span class={`${styles.wrap}`}>{race.sizeDescription}</span>

                <h3>Speed:</h3>

                <span>{race.speed}ft</span>

                <h3>Race Specific Traits:</h3>

                <span>
                  {/* {race.traits} */}
                  <For each={race.traits}>
                    {(trait) => (
                      <>
                        <div>
                          {trait.name}:{" "}
                          <For each={trait.value}>
                            {(value) => (
                              <span class={`${styles.wrap}`}>{value}</span>
                            )}
                          </For>
                        </div>
                        <br />
                      </>
                    )}
                  </For>
                </span>
                <h3>Proficiencies</h3>

                <div>{race.startingProficencies.map(x => x.value).join("\n")}</div>

                <h3>Languages:</h3>

                {race.languageDesc}

                <br />
                
                <Subrace styles={styles} race={race} />
              </div>
            </div>
            <Show when={i() !== dndSrdRaces().length - 1}>
              <hr style={{ width: "100%" }} />
            </Show>
          </>
        )}
      </For>
    </div>
  );
};
export default ThePage