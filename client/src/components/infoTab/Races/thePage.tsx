import { Component, For, Show } from "solid-js";
import { Race } from "../../../models/race.model";
import Subrace from "./subraces/subrace";

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
                <h3>ability score increases: </h3>
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

                <h3>age:</h3>

                <span class={`${styles.wrap}`}>{race.age}</span>

                <h3>alignment:</h3>

                <span class={`${styles.wrap}`}>{race.alignment}</span>

                <h3>size:</h3>

                <span class={`${styles.wrap}`}>{race.sizeDescription}</span>

                <h3>speed:</h3>

                <span>{race.speed}ft</span>

                <h3>race specific traits:</h3>

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
        )}
      </For>
    </div>
  );
};
export default ThePage